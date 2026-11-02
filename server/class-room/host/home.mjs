// Bertopia personal host (adults 18+, non-school). docs/bertopia/HOME-HOST.md. Part 1: door + session + owner.
//   node --no-warnings --import ./host/register.mjs host/home.mjs [--port 8890] [--data <dir>] [--lan] [--open]
// The same src/room.js and src/world-do.js as school, under plain Node (host/runtime.mjs). Joining is by SESSION CODE
// (host/door.mjs), not by TechWorks ticket; the owner has a PIN. Binds 127.0.0.1 unless --lan. Nothing here is in the
// school bundle; the school Worker refuses every ticket this process makes (iss 'home', home-* config).
import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import './runtime.mjs'
import { acceptKey, roomCtx, worldCtx, rpc } from './runtime.mjs'
import { Room } from '../src/room.js'
import { World } from '../src/world-do.js'
import { PROTOCOL, parsePos } from '../src/protocol.js'
import { decodeChunk, cellAt } from '../src/world/chunks.js'
import { LIMITS } from '../src/rules.js'
import { makeDoor, registerHome, hashPin, checkPin, validPin, RULESETS, DEFAULT_MAX_PLAYERS, HOME_CFG } from './door.mjs'
import { makeRuleset, PRESETS } from './rules.mjs'
import { cleanChat, makeChatGate } from './chat.mjs'
import { fold } from './words.mjs'
import { makeEvents } from './events.mjs'
import { makeCommands, LOCAL_CMDS } from './commands.mjs'
import { makeStats, BOARDS, topText } from './stats.mjs'
import { checkPlugin, makeRunner, EXAMPLES, LIMITS as PLUGIN_LIMITS } from '../src/plugins.js'
import { DatabaseSync } from 'node:sqlite'
import { HISTORY_MS } from '../src/editlog.js'
import { undoPlan, applyUndo } from '../src/world/undo.js'
import { makeAccess, accessToken } from './access.mjs'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const flag = (k) => argv.includes('--' + k)
const HERE = path.dirname(fileURLToPath(import.meta.url))
const FORBIDDEN_PORTS = [8787, 8788, 8877, 8879, 8881]
const PKG = JSON.parse(fs.readFileSync(path.join(HERE, '..', 'package.json'), 'utf8'))
// The game: ../../bertopia-home (npm run build:home in bloxbert-src), served at /. Without it, / is the plain join page.
const REPO = path.resolve(HERE, '..', '..', '..')
const GAME = [arg('game', ''), path.join(REPO, 'bertopia-home')].filter(Boolean).map((d) => path.resolve(d)).find((d) => fs.existsSync(path.join(d, 'index.html'))) || null
const SHARED = path.join(REPO, 'shared')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' }
function serveFile(res, root, rel) {
  const p = path.normalize(path.join(root, rel))
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) return false
  const ext = path.extname(p).toLowerCase()
  res.writeHead(200, { 'content-type': (Object.prototype.hasOwnProperty.call(MIME, ext) && MIME[ext]) || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-store' : 'max-age=300' })
  res.end(fs.readFileSync(p)); return true
}
try { PKG.gameVersion = JSON.parse(fs.readFileSync(path.join(REPO, 'bloxbert-src', 'package.json'), 'utf8')).version } catch (e) {}

// ---------------------------------------------------------------- config (home.json): secret, PIN hash, settings. No PII.
const DATA = path.resolve(arg('data', path.join(os.homedir(), 'Documents', 'Bertopia Home')))
fs.mkdirSync(path.join(DATA, 'worlds'), { recursive: true })
fs.mkdirSync(path.join(DATA, 'backups'), { recursive: true })
const CFG_FILE = path.join(DATA, 'home.json')
function loadCfg() { try { return JSON.parse(fs.readFileSync(CFG_FILE, 'utf8')) } catch (e) { return null } }
const cfg = Object.assign({
  secret: randomBytes(32).toString('hex'),        // the home secret: generated once, never printed, never the school's
  ownerKey: randomBytes(16).toString('hex'),      // the owner page's own URL key (PIN is asked on top)
  pin: null,                                      // salt$scrypt, set on first run
  port: 8890, listen: '127.0.0.1', origins: [], tunnelHost: '', maxPlayers: DEFAULT_MAX_PLAYERS,
  world: null, ruleset: 'home-survival', usedCodes: [],
  guard: { on: true, breaks: 70, window: 10, undo: true },
  access: { team: '', aud: '', email: '' },
  library: { url: '', key: '' },   // part 12: the cloud plugin library (plugins.kulibert.net); the key lives here only   // part 11: owner page through the tunnel, only behind Cloudflare Access (team name, app AUD, the owner's email)   // griefer guard (part 10): breaks per window (s) before an auto-kick (70 = faster than the best tool, under the Room's 10/s cap); a repeat is a ban; undo their last minute
}, loadCfg() || {})
if (!cfg.access || typeof cfg.access !== 'object') cfg.access = { team: '', aud: '', email: '' }
if (!cfg.library || typeof cfg.library !== 'object') cfg.library = { url: '', key: '' }
// part 14: several worlds open at once. cfg.world = the main one (joins land there unless a world is picked);
// cfg.worlds = every open world. One session, one code, cross-world chat; a player switches with /world <name>.
if (!Array.isArray(cfg.worlds)) cfg.worlds = cfg.world ? [cfg.world] : []
if (cfg.world && !cfg.worlds.includes(cfg.world)) cfg.worlds.push(cfg.world)
const isOpen = (name) => !!name && cfg.worlds.includes(name)
if (!cfg.guard || typeof cfg.guard !== 'object') cfg.guard = { on: true, breaks: 70, window: 10, undo: true }
if (flag('lan')) cfg.listen = '0.0.0.0'
cfg.port = Number(arg('port', cfg.port))
if (FORBIDDEN_PORTS.includes(cfg.port)) { console.error('[home] port ' + cfg.port + ' is used by the game checks or wrangler; pick another'); process.exit(2) }
const saveCfg = () => fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2))
saveCfg()
registerHome()
const env = { ROOM_JOIN_SECRET: cfg.secret, ALLOWED_ORIGINS: '', REQUIRE_TLS: '0' }
const door = makeDoor({ secret: cfg.secret, maxPlayers: cfg.maxPlayers })   // no name filter: adults 18+

// ---------------------------------------------------------------- Durable Objects, in process (as in host.mjs, PR #122)
const rooms = new Map(), worlds = new Map()
const worldFile = (name) => path.join(DATA, 'worlds', name.replace(/[^A-Za-z0-9_-]/g, '_') + '.sqlite')
function roomOf(name) {
  if (!rooms.has(name)) {
    const ctx = roomCtx(); const r = new Room(ctx, env); r.ctx = ctx
    const accept = ctx.acceptWebSocket; ctx.acceptWebSocket = (ws) => { ws.room = r; accept(ws) }
    rooms.set(name, r)
  }
  return rooms.get(name)
}
function worldOf(name) {
  if (!worlds.has(name)) {
    if (!isOpen(name)) throw new Error('world is closed')
    const ctx = worldCtx(worldFile(name), () => worlds.get(name).obj.alarm())
    worlds.set(name, { obj: new World(ctx, env), ctx })
  }
  return worlds.get(name).obj
}
env.ROOMS = { idFromName: (n) => n, get: (n) => rpc(() => roomOf(n)) }
env.WORLDS = { idFromName: (n) => n, get: (n) => rpc(() => worldOf(n)) }
const players = () => [...rooms.values()].flatMap((r) => [...r.players.values()].map((p) => ({ room: r, p })))
const online = () => players().filter(({ p }) => p.role === 'kid').length

// ---------------------------------------------------------------- worlds (open/close/backup/restore, as #122)
const listWorlds = () => fs.readdirSync(path.join(DATA, 'worlds')).filter((f) => f.endsWith('.sqlite')).map((f) => { const st = fs.statSync(path.join(DATA, 'worlds', f)); const name = f.replace(/\.sqlite$/, ''); return { name, bytes: st.size, changed: st.mtimeMs, open: isOpen(name), main: cfg.world === name } })
// close ONE world: its players are dropped, its rooms forgotten; the others stay open. The main world moves on if needed.
function closeWorld(name = cfg.world, { forget = true } = {}) {
  if (!name || !isOpen(name)) return
  const w = worlds.get(name)
  saveStats()
  if (w) {
    for (const r of rooms.values()) if (r.wid === name) { try { w.obj.hub.unlink(r.rid) } catch (e) {} }
    if (w.obj.timer) { clearInterval(w.obj.timer); w.obj.timer = null }
    try { w.obj.hub.flush() } catch (e) { console.error('[home] final save failed', e.message) }
    worlds.delete(name)
    try { w.ctx.close() } catch (e) { console.error('[home] close failed', e.message) }
  }
  for (const { room, p } of players()) if (room.wid === name) room.drop(p.id, 4006, 'world closed')
  for (const [rid, r] of rooms) if (r.wid === name) rooms.delete(rid)
  statsOf.delete(name)
  cfg.worlds = cfg.worlds.filter((n) => n !== name)
  if (cfg.world === name) { cfg.world = cfg.worlds[0] || null; pluginList = []; runner.load([]); if (cfg.world) loadPlugins() }
  feed('world closed: ' + name + (cfg.world ? ' · main is ' + cfg.world : ''))
  if (forget) saveCfg()
}
function closeAllWorlds() { for (const n of [...cfg.worlds]) closeWorld(n, { forget: false }); saveCfg() }
// open a world next to the ones already open; the first one open (or main: true) is the main world
function openWorld(name, { main = false } = {}) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name)) return { error: 'name' }
  if (cfg.worlds.length >= MAX_WORLDS && !isOpen(name)) return { error: 'too-many-worlds' }
  if (!isOpen(name)) cfg.worlds.push(name)
  worldOf(name)
  // the hub opens a world to kids only once a staff seat has been in it (school); at home the owner holds a seat in
  // every open world, so players can land in any of them while the owner is elsewhere (or not in yet)
  try { const hub = worldOf(name); const seat = 'homeowner-seat-' + name.slice(0, 20); const a = hub.assign({ world: name, ref: seat, grp: null, role: 'admin', bld: 's', cfg: HOME_CFG }); if (!a.err) hub.left(seat) } catch (e) {}
  if (main || !cfg.world) { cfg.world = name; loadPlugins(); if (libOn()) libPull(true).then((r) => { if (r.error) feed('plugin library: ' + r.error + ' (using the world\'s own copy)') }) }
  saveCfg(); feed('world open: ' + name + (cfg.world === name ? ' (main)' : '') + ' · ' + cfg.worlds.length + ' open')
  return { ok: true, name, main: cfg.world, worlds: cfg.worlds.slice() }
}
const MAX_WORLDS = 8
function backupWorld(name) {
  const w = worlds.get(name); if (w) w.obj.hub.flush()
  const src = worldFile(name); if (!fs.existsSync(src)) return { error: 'missing' }
  const dst = path.join(DATA, 'backups', name + '-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19) + '.sqlite')
  if (w) w.ctx.db.exec(`VACUUM INTO '${dst.replace(/'/g, "''")}'`); else fs.copyFileSync(src, dst)
  return { ok: true, file: path.basename(dst) }
}
function restoreWorld(file) {
  const src = path.join(DATA, 'backups', path.basename(file)); if (!fs.existsSync(src)) return { error: 'missing' }
  const name = path.basename(file).replace(/-\d{4}-\d{2}-\d{2}T.*$/, '')
  const was = isOpen(name)
  const wasMain = cfg.world === name
  if (was) closeWorld(name)
  backupWorld(name)
  fs.copyFileSync(src, worldFile(name)); for (const ext of ['-wal', '-shm']) { try { fs.unlinkSync(worldFile(name) + ext) } catch (e) {} }
  if (was) openWorld(name, { main: wasMain })
  return { ok: true, name }
}

// World files (docs/bertopia/HOME-HOST.md §8): a world leaves as one SQLite file (the same copy a backup makes) and
// comes back as a NEW world, never over an existing one. An import must be a SQLite file whose tables are exactly the
// world's own (chunks, ops, meta) and that passes SQLite's integrity check; anything else is deleted unopened by the game.
const WORLD_FILE_MAX = 256 * 1024 * 1024
const WORLD_TABLES = { chunks: ['cx', 'cz', 'd'], ops: ['s', 'w', 'x', 'y', 'z', 'b', 'i', 't'], meta: ['k', 'v'] }
const SQLITE_MAGIC = Buffer.from('SQLite format 3\0', 'latin1')
function exportWorld(res, name) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name) || !fs.existsSync(worldFile(name))) return json(res, 404, { error: 'missing' })
  const r = backupWorld(name); if (r.error) return json(res, 404, r)
  const file = path.join(DATA, 'backups', r.file)
  res.writeHead(200, { 'content-type': 'application/octet-stream', 'content-length': fs.statSync(file).size, 'content-disposition': `attachment; filename="${name}.bertopia-world"`, 'cache-control': 'no-store' })
  fs.createReadStream(file).pipe(res)
}
// -> null when the file is a world, else the reason
function checkWorldFile(file) {
  const fd = fs.openSync(file, 'r'); const head = Buffer.alloc(16); fs.readSync(fd, head, 0, 16, 0); fs.closeSync(fd)
  if (!head.equals(SQLITE_MAGIC)) return 'not-a-world'
  let db = null
  try {
    db = new DatabaseSync(file, { readOnly: true })
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table','view','trigger') AND name NOT LIKE 'sqlite_%'").all().map((r) => r.name)
    if (tables.length !== 3 || !Object.keys(WORLD_TABLES).every((t) => tables.includes(t))) return 'not-a-world'
    for (const [t, cols] of Object.entries(WORLD_TABLES)) { const have = db.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name); if (have.join() !== cols.join()) return 'not-a-world' }
    const ok = db.prepare('PRAGMA integrity_check').all(); if (ok.length !== 1 || Object.values(ok[0])[0] !== 'ok') return 'damaged'
    return null
  } catch (e) { return 'damaged' } finally { try { db && db.close() } catch (e) {} }
}
function importWorld(req, res, name) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name)) { req.resume(); return json(res, 400, { error: 'name' }) }
  if (fs.existsSync(worldFile(name))) { req.resume(); return json(res, 409, { error: 'exists' }) }
  const tmp = path.join(DATA, 'backups', '.import-' + randomBytes(6).toString('hex') + '.sqlite')
  const out = fs.createWriteStream(tmp); let size = 0, over = false
  const fail = (status, error) => { try { fs.unlinkSync(tmp) } catch (e) {} ; if (!res.headersSent) json(res, status, { error }) }
  req.on('data', (d) => { size += d.length; if (size > WORLD_FILE_MAX && !over) { over = true; out.destroy(); req.destroy(); fail(413, 'too-big') } })
  req.on('error', () => { if (!over) { out.destroy(); fail(400, 'upload') } })
  req.pipe(out)
  out.on('finish', () => {
    if (over) return
    const why = size ? checkWorldFile(tmp) : 'not-a-world'
    if (why) return fail(400, why)
    fs.renameSync(tmp, worldFile(name))
    json(res, 200, { ok: true, name, bytes: size })
  })
}

// ---------------------------------------------------------------- session (the door) + owner tools
let lastCode = null                  // shown on the owner page until the owner dismisses it; never written to disk
let rules = makeRuleset(cfg.ruleset)   // the live ruleset (host/rules.mjs); hello carries it, a change is broadcast
const RULE_FRAMES = new Set(['craft', 'st', 'hit'])   // (+ home-only: chat, ev, all)   // home-only frames the Room does not know; answered here
const chatGate = makeChatGate()       // typed chat: one gap per player; nothing is stored
// Server commands (part 8): buttons send {t:'cmd', c}, typed chat sends '/tp Trebby'; both end in src/essentials.js.
const SPAWN = { x: 8.5, y: 8, z: 1.5 }   // the game's own spawn (bloxbert-src main.js SPAWN)
const commands = makeCommands({ spawn: () => SPAWN, players: () => players().map(({ p }) => ({ id: p.id, ref: p.ref, alias: p.alias, staff: p.role !== 'kid', pos: p.pos })) })
const CMD_WHY = { role: 'Only the owner can do that.', cooldown: 'Wait a few seconds.', 'no-home': 'No home set yet: /sethome where you stand.', 'no-such-player': 'No player by that name.', 'no-such-warp': 'No warp by that name (/warps lists them).', 'warp-name': 'Warp names: letters, digits, - or _ (up to 20).', unknown: 'Unknown command. /help lists them.', who: 'Who? Add a player name.', what: 'Say what? Add the text.', pos: 'Stand somewhere first.', 'not-here': 'You cannot set a home here.',
  'no-such-world': 'No open world by that name (/world lists them).', 'top-board': 'Boards: placed, broken, time, chats, boss, warps.', 'give-shape': 'Use: /give <player> <item> [count 1-64].', 'give-count': 'Count: 1 to 64.', 'gm-shape': 'Use: /gm creative|survival <player>.', 'too-far': 'Those coordinates are outside the world.', self: 'Not on yourself.', 'chat-off': 'Chat is off.', muted: 'You are muted.', 'not-online': 'That player is not in right now.' }
// essentials 2 (part 13): per-player state the host keeps for the session
const frozenAt = new Map()   // ref -> { x, y, z, at } : a frozen player's spot (positions are refused, the client is sent back)
const modeFor = new Map()    // ref -> 'creative' | 'survival' : a game mode set for one player (/gm), on top of the ruleset's
const findById = (id) => players().find(({ p: q }) => q.id === id)
function localCommand(room, ws, p, r) {
  const tell = (o) => { try { ws.send(JSON.stringify(o)) } catch (e) {} }
  const no = (why) => tell({ t: 'cmdno', c: r.local, why: CMD_WHY[why] || why })
  const ok = (msg) => tell({ t: 'cmdok', c: r.local, msg })
  const send = (t, o) => { try { t.p.ws.send(JSON.stringify(o)) } catch (e) {} }
  if (r.local === 'warps') return ok(commands.warpList().length ? 'Warps: ' + commands.warpList().join(', ') : 'No warps yet: /setwarp <name> where you stand.')
  if (r.local === 'setwarp') { const x = commands.setWarp(r.name, p.pos); if (x.error) return no(x.error); broadcastRules(); return ok('Warp "' + r.name + '" set.') }
  if (r.local === 'delwarp') { const x = commands.delWarp(r.name); if (x.error) return no(x.error); broadcastRules(); return ok('Warp "' + r.name + '" removed.') }
  if (r.local === 'list') {
    const tag = (q) => q.alias + (q.role !== 'kid' ? ' (owner)' : '') + (frozenAt.has(q.ref) ? ' ❄' : '') + (q.muted ? ' 🔇' : '')
    if (cfg.worlds.length <= 1) { const names = players().map(({ p: q }) => tag(q)); return ok('In (' + names.length + '): ' + names.join(', ')) }
    const by = new Map(cfg.worlds.map((w) => [w, []])); for (const { room: rm, p: q } of players()) (by.get(rm.wid) || by.set(rm.wid, []).get(rm.wid)).push(tag(q))
    return ok('In (' + players().length + '): ' + [...by].map(([w, names]) => w + (w === cfg.world ? '*' : '') + ' [' + names.length + ']' + (names.length ? ' ' + names.join(', ') : '')).join(' · ') + ' — /world <name> to switch')
  }
  if (r.local === 'top') {
    const board = r.board || 'placed'; const st = statsFor(worldOfPlayer(p)); const list = st ? st.top(board) : []
    if (r.board === '?' ) return ok(topText(null))
    const mine = st && st.mine(p.alias)
    return ok(topText(board, list, p.alias) + (mine ? ' · you: ' + mine[board] : ''))
  }
  if (r.local === 'world') {
    if (!r.name) return ok('Open worlds: ' + cfg.worlds.map((w) => w + (w === cfg.world ? ' (main)' : '')).join(', ') + ' — you are in ' + worldOfPlayer(p))
    const target = cfg.worlds.find((w) => fold(w) === fold(r.name)) || cfg.worlds.find((w) => fold(w).startsWith(fold(r.name)))
    if (!target) return no('no-such-world')
    if (target === worldOfPlayer(p)) return ok('You are already in ' + target + '.')
    feed(p.alias + ' switches to world ' + target); tell({ t: 'switch', world: target }); return
  }
  if (r.local === 'msg') {
    if (p.muted) return no('muted')
    if (rules.snapshot().r['chat.typed'] !== true && p.role === 'kid') return no('chat-off')
    const t = findById(r.id); if (!t) return no('not-online'); if (t.p.id === p.id) return no('self')
    const c = cleanChat(r.text); if (c.error) return no(c.error)
    send(t, { t: 'chat', a: '(whisper) ' + p.alias, m: c.m, at: Date.now() }); return tell({ t: 'chat', a: '(to ' + t.p.alias + ')', m: c.m, at: Date.now(), me: true })
  }
  if (r.local === 'day' || r.local === 'night' || r.local === 'cycle') { const x = setRule('survival.daynight', r.local); if (x.error) return no(x.error); feed('owner set ' + r.local); return ok(r.local === 'cycle' ? 'Day and night cycle again.' : 'It is ' + r.local + ' now.') }
  if (r.local === 'tppos') { tell({ t: 'tp', x: r.x + 0.5, y: r.y, z: r.z + 0.5, by: p.alias }); return ok('Off to ' + r.x + ', ' + r.y + ', ' + r.z + '.') }
  if (r.local === 'unban') { const b = door.bans.find((x) => fold(x.name || '') === fold(r.name)); if (!b) return no('no-such-player'); door.unban(b.ref); feed('owner unbanned ' + b.name); return ok(b.name + ' may join again.') }
  const t = findById(r.id); if (!t) return no('not-online'); if (t.p.id === p.id && r.local !== 'heal' && r.local !== 'clear' && r.local !== 'give' && r.local !== 'gm') return no('self')
  if (r.local === 'kick') { kick(t.p.ref); return ok(t.p.alias + ' was kicked.') }
  if (r.local === 'ban') { ban(t.p.ref); return ok(t.p.alias + ' was banned for this session.') }
  if (r.local === 'freeze') { if (t.p.role !== 'kid') return no('role'); frozenAt.set(t.p.ref, { ...(t.p.pos || SPAWN), at: Date.now() }); send(t, { t: 'chat', a: '⚙ host', m: 'You are frozen by the owner.', at: Date.now() }); feed('owner froze ' + t.p.alias); return ok(t.p.alias + ' is frozen.') }
  if (r.local === 'unfreeze') { if (!frozenAt.delete(t.p.ref)) return no('not-online'); send(t, { t: 'chat', a: '⚙ host', m: 'You can move again.', at: Date.now() }); feed('owner unfroze ' + t.p.alias); return ok(t.p.alias + ' can move again.') }
  if (r.local === 'give') { send(t, { t: 'give', item: r.item, n: r.n, by: p.alias }); feed('owner gave ' + t.p.alias + ' ' + r.n + ' ' + r.item); return ok(r.n + ' ' + r.item + ' → ' + t.p.alias + '.') }
  if (r.local === 'heal') { send(t, { t: 'heal', by: p.alias }); return ok(t.p.alias + ' healed.') }
  if (r.local === 'clear') { send(t, { t: 'clear', by: p.alias }); feed('owner cleared the bag of ' + t.p.alias); return ok('Bag of ' + t.p.alias + ' cleared.') }
  if (r.local === 'gm') { modeFor.set(t.p.ref, r.mode); try { t.p.ws.send(JSON.stringify(rulesFor(t.p.ref))) } catch (e) {} feed('owner set ' + t.p.alias + ' to ' + r.mode); return ok(t.p.alias + ' is in ' + r.mode + ' now.') }
  return no('unknown')
}
function runCommand(room, ws, p, cmd, text) {
  const me = { id: p.id, ref: p.ref, staff: p.role !== 'kid', pos: p.pos }
  const r = commands.run(me, cmd, text)
  const tell = (o) => { try { ws.send(JSON.stringify(o)) } catch (e) {} }
  if (r.error) { tell({ t: 'cmdno', c: cmd.c, why: CMD_WHY[r.error] || r.error }); return }
  for (const f of r.fx) {
    if (f.k === 'tp') { const t = players().find(({ p: q }) => q.id === f.id); if (t) { stat(t.p, 'warps'); try { t.p.ws.send(JSON.stringify({ t: 'tp', x: f.pos.x, y: f.pos.y, z: f.pos.z, by: p.alias })) } catch (e) {} ; if (t.p.id !== p.id) tell({ t: 'cmdok', c: cmd.c, msg: t.p.alias + ' is on the way.' }); else tell({ t: 'cmdok', c: cmd.c }) } }
    else if (f.k === 'spawnall') { broadcastAll({ t: 'tp', x: f.pos.x, y: f.pos.y, z: f.pos.z, by: p.alias }); feed('owner sent everyone to spawn') }
    else if (f.k === 'home-set') tell({ t: 'cmdok', c: cmd.c, msg: 'Home set.' })
    else if (f.k === 'announce') { broadcastAll({ t: 'chat', a: '📣 ' + p.alias, m: String(f.text || ''), at: Date.now() }); feed('owner announced: ' + String(f.text || '')) }
    else if (f.k === 'mute') { const t = players().find(({ p: q }) => q.id === f.id); if (t) { t.p.muted = !!f.on; feed('owner ' + (f.on ? 'muted ' : 'unmuted ') + t.p.alias); tell({ t: 'cmdok', c: cmd.c, msg: t.p.alias + (f.on ? ' muted.' : ' unmuted.') }) } }
    else if (f.k === 'muteall') { for (const { p: q } of players()) if (q.role === 'kid') q.muted = !!f.on; feed('owner ' + (f.on ? 'muted' : 'unmuted') + ' everyone'); tell({ t: 'cmdok', c: cmd.c, msg: f.on ? 'Everyone muted.' : 'Everyone unmuted.' }) }
  }
}
function typedCommand(room, ws, p, line) {
  const staff = p.role !== 'kid'
  const r = commands.parse(line, staff)
  const tell = (o) => { try { ws.send(JSON.stringify(o)) } catch (e) {} }
  if (r.help) return tell({ t: 'cmdok', c: 'help', msg: 'Commands: ' + r.help })
  if (r.error === 'unknown') { const name = (/^\/(\w+)/.exec(line) || [])[1]; if (name && pluginList.some((pl) => pl.on && pl.rules.some((ru) => ru.when.e === 'command' && ru.when.name === name.toLowerCase()))) { pluginEvent({ e: 'command', name: name.toLowerCase(), player: evPlayer(p), text: line }); return } }
  if (r.error) return tell({ t: 'cmdno', c: 'typed', why: CMD_WHY[r.error] || r.error })
  if (r.local) return localCommand(room, ws, p, r)
  runCommand(room, ws, p, r.cmd, r.text)
}
const events = makeEvents()           // shared boss fight news
// The whole map for a joining game (home only; the school path asks chunk by chunk). Every changed cell of the open
// world plus the seq it is good up to; live ops after that seq come through the normal fan-out. One per player / 5 s.
const ALL_BATCH = 4000, ALL_GAP_MS = 5000
const allAsked = new Map()   // ref -> last time
function worldCells(name) {
  const w = name && worlds.get(name); if (!w) return null
  const h = w.obj.hub
  const head = h.world.head()
  try { h.flush() } catch (e) {}
  const out = []
  for (const { cx, cz } of w.ctx.db.prepare('SELECT cx, cz FROM chunks').all()) {
    const r = h.world.chunk(cx, cz); if (r.error) continue
    const c = decodeChunk(r.d); if (c.error) continue
    for (const [idx, id] of c.edits) { const { x, y, z } = cellAt(cx, cz, idx); out.push([x, y, z, id]) }
  }
  return { head, cells: out }
}
function sendAll(ws, p) {
  const t = Date.now(), last = allAsked.get(p.ref) || 0
  if (t - last < ALL_GAP_MS) { try { ws.send(JSON.stringify({ t: 'no', c: 'all-slow' })) } catch (e) {} ; return }
  allAsked.set(p.ref, t)
  const me = players().find(({ p: q }) => q === p); const wc = worldCells(me ? me.room.wid : cfg.world); if (!wc) return
  const n = Math.max(1, Math.ceil(wc.cells.length / ALL_BATCH))
  for (let i = 0; i < n; i++) { try { ws.send(JSON.stringify({ t: 'all', s: wc.head, i, n, c: wc.cells.slice(i * ALL_BATCH, (i + 1) * ALL_BATCH) })) } catch (e) { return } }
}
// Activity feed for the host's own window (Diego: "console never updated with chat, joins, blocks"). Display names
// and counts only: never a code, PIN, token, address or ref. Block edits are summed per player per 5 s. Chat lines show
// only with --show-chat (or SHOW_CHAT=1): the host sees them in the game anyway; the launcher passes it when asked.
const SHOW_CHAT = flag('show-chat') || process.env.BT_SHOW_CHAT === '1'
const feed = (text) => console.log('[' + new Date().toTimeString().slice(0, 8) + '] ' + text)
const editTally = new Map()   // alias -> { placed, broken, timer }
function tallyEdit(alias, placed) {
  let t = editTally.get(alias)
  if (!t) { t = { placed: 0, broken: 0, timer: null }; editTally.set(alias, t) }
  if (placed) t.placed++; else t.broken++
  if (!t.timer) t.timer = setTimeout(() => { editTally.delete(alias); feed(alias + (t.placed ? ' placed ' + t.placed : '') + (t.placed && t.broken ? ',' : '') + (t.broken ? ' broke ' + t.broken : '') + ' block' + (t.placed + t.broken === 1 ? '' : 's')) }, 5000).unref()
}
const broadcastAll = (f) => { for (const r of rooms.values()) try { r.broadcast(f) } catch (e) {} }

// ---------------------------------------------------------------- leaderboards (part 15): counters per alias, per world
const statsOf = new Map()   // world name -> makeStats(); loaded from the world's meta 'stats', saved back 3 s after a change
function statsFor(name) {
  if (!name || !isOpen(name)) return null
  let st = statsOf.get(name)
  if (!st) { let raw = null; try { const w = worlds.get(name); const r = w && w.ctx.db.prepare('SELECT v FROM meta WHERE k=?').get('stats'); raw = r && r.v } catch (e) {} st = makeStats(raw); statsOf.set(name, st) }
  return st
}
function saveStats() { for (const [name, st] of statsOf) { const j = st.take(); if (!j) continue; try { const w = worlds.get(name); if (w) w.ctx.db.prepare('INSERT OR REPLACE INTO meta VALUES(?,?)').run('stats', j) } catch (e) {} } }
setInterval(saveStats, 3000).unref()
const stat = (p, key, n = 1) => { const st = statsFor(worldOfPlayer(p)); if (st) st.add(p.alias, key, n) }
// time played: counted from join to leave (and every minute while in, so a crash loses at most a minute)
const joinedAt = new Map()   // ref -> ms
setInterval(() => { const t = Date.now(); for (const { p } of players()) { const at = joinedAt.get(p.ref); if (at && t - at >= 60000) { stat(p, 'time', Math.floor((t - at) / 1000)); joinedAt.set(p.ref, t) } } }, 60000).unref()

// ---------------------------------------------------------------- griefer guard (part 10)
// Breaking blocks faster than a person can (cfg.guard.breaks in cfg.guard.window seconds) is a storm: the player is
// kicked, their last minute is undone (cfg.guard.undo), and a second storm in the session is a ban. Owner and staff
// are never guarded. Memory only; the owner tunes it on the owner page (/owner/guard).
const storms = new Map()   // ref -> { times: [ms...], strikes }
function guardBreak(p) {
  const g = cfg.guard || {}; if (g.on === false || p.role !== 'kid') return false
  const limit = Math.max(10, Number(g.breaks) || 70), win = Math.max(2, Number(g.window) || 10) * 1000, t = Date.now()
  let e = storms.get(p.ref); if (!e) { e = { times: [], strikes: 0 }; storms.set(p.ref, e) }
  e.times.push(t); while (e.times.length && e.times[0] < t - win) e.times.shift()
  if (e.times.length <= limit) return false
  e.times.length = 0; e.strikes++
  const f = findPlayer(p.ref)
  if (g.undo !== false) { try { const r = rollback(1, p.ref); feed('guard undid ' + (r.cells || 0) + ' cell' + (r.cells === 1 ? '' : 's') + ' of ' + p.alias) } catch (err) {} }
  if (e.strikes >= 2) { feed('guard banned ' + p.alias + ' (second block storm)'); door.ban(p.ref, p.alias, f ? f.p.ip : ''); if (f) f.room.drop(f.p.id, 4006, 'banned') }
  else { feed('guard kicked ' + p.alias + ' (block storm: ' + limit + '+ breaks in ' + win / 1000 + ' s)'); if (f) f.room.drop(f.p.id, 4006, 'kicked') }
  return true
}

// ---------------------------------------------------------------- plugins (part 9: the in-game code builder)
// 18+: a world's plugins live IN the world file (meta 'plugins'), so they travel with exports and backups; the cloud
// library (option 2) syncs the same JSON later. Only plugins with on:true run. The owner edits them in-game.
const runner = makeRunner()
let pluginList = []
const dbOf = () => { const w = cfg.world && worlds.get(cfg.world); return w ? w.ctx.db : null }
function loadPlugins() {
  const db = dbOf(); let list = []
  try { const raw = db && db.prepare('SELECT v FROM meta WHERE k=?').get('plugins'); if (raw && raw.v) list = JSON.parse(raw.v) } catch (e) { list = [] }
  if (!Array.isArray(list)) list = []
  if (!db) list = []
  pluginList = list.filter((p) => !checkPlugin(p, 'adult'))
  runner.load(pluginList)
}
function savePlugins() {
  const db = dbOf(); if (!db) return
  db.prepare('INSERT OR REPLACE INTO meta VALUES(?,?)').run('plugins', JSON.stringify(pluginList))
  runner.load(pluginList); broadcastPlugins()
}
const pluginSummary = () => pluginList.map((p) => ({ id: p.id, name: p.name, by: p.by, about: p.about || '', on: !!p.on, rules: p.rules.length }))
function broadcastPlugins() { const f = { t: 'plugins', list: pluginSummary() }; for (const { p } of players()) if (p.role !== 'kid') try { p.ws.send(JSON.stringify(f)) } catch (e) {} }
function putPlugin(p) {
  const why = checkPlugin(p, 'adult'); if (why) return { error: why }
  const i = pluginList.findIndex((x) => x.id === p.id)
  if (i < 0 && pluginList.length >= PLUGIN_LIMITS.plugins) return { error: 'up to ' + PLUGIN_LIMITS.plugins + ' plugins per world' }
  const clean = { id: p.id, name: String(p.name).trim(), by: String(p.by || 'owner').slice(0, 20), about: String(p.about || '').slice(0, 200), on: !!p.on, v: 1, rules: p.rules }
  if (i < 0) pluginList.push(clean); else pluginList[i] = clean
  savePlugins(); feed('plugin ' + (i < 0 ? 'added' : 'saved') + ': ' + clean.name + (clean.on ? ' (on)' : ' (off)'))
  libAutoPush()
  return { ok: true, plugin: clean }
}
// ---------------------------------------------------------------- the cloud library (part 12) + files
// Pull: the library's plugins become this world's (this world's on/off choice for a plugin it already had is kept:
// "turn on/off per server"). Push: this world's plugins become the library's. Both carry the library's version so two
// editors never silently overwrite each other; pull/push with force:true skip that check. Files: the same list as
// plugins/<id>.json in the data folder, to work on in any editor and load back.
const LIB_TIMEOUT = 8000
const libOn = () => !!(cfg.library.url && /^lk_[0-9a-f]{32}$/.test(cfg.library.key || ''))
async function libCall(method, p, body) {
  if (!libOn()) return { error: 'no-library' }
  try {
    const r = await fetch(cfg.library.url.replace(/\/+$/, '') + p, { method, headers: { 'content-type': 'application/json', authorization: 'Bearer ' + cfg.library.key }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(LIB_TIMEOUT) })
    const j = await r.json().catch(() => ({ error: 'bad reply' }))
    return r.ok ? j : { error: j.error || ('http ' + r.status), ...(j.v !== undefined ? { v: j.v } : {}) }
  } catch (e) { return { error: 'unreachable' } }
}
let libV = null   // the library version this world last synced with
async function libNew(url) {
  const u = String(url || cfg.library.url || '').replace(/\/+$/, ''); if (!/^https?:\/\//.test(u)) return { error: 'url' }
  let j; try { j = await (await fetch(u + '/lib/new', { method: 'POST', signal: AbortSignal.timeout(LIB_TIMEOUT) })).json() } catch (e) { return { error: 'unreachable' } }
  if (!j || !j.key) return { error: j && j.error || 'no key' }
  cfg.library = { url: u, key: j.key }; saveCfg(); libV = j.v; feed('owner made a new plugin library at ' + u)
  return { ok: true, url: u }   // the key stays in home.json; the owner page never shows it again
}
async function libPull(force) {
  if (!dbOf()) return { error: 'no world' }
  const r = await libCall('GET', '/lib'); if (r.error) return r
  if (!force && libV !== null && r.v < libV) return { error: 'conflict', v: r.v, mine: libV }
  const mine = new Map(pluginList.map((p) => [p.id, p]))
  pluginList = r.plugins.slice(0, PLUGIN_LIMITS.plugins).map((p) => ({ ...p, on: mine.has(p.id) ? !!mine.get(p.id).on : !!p.on }))
  savePlugins(); libV = r.v; feed('plugins pulled from the library: ' + pluginList.length + ' (v' + r.v + ')')
  return { ok: true, v: r.v, count: pluginList.length }
}
async function libPush(force) {
  if (!dbOf()) return { error: 'no world' }
  const r = await libCall('PUT', '/lib', { plugins: pluginList, ...(force || libV === null ? {} : { v: libV }) })
  if (r.error) return r
  libV = r.v; feed('plugins pushed to the library: ' + pluginList.length + ' (v' + r.v + ')')
  return { ok: true, v: r.v, count: pluginList.length }
}
const PLUGIN_DIR = path.join(DATA, 'plugins')
function filesSave() {
  fs.mkdirSync(PLUGIN_DIR, { recursive: true })
  for (const p of pluginList) fs.writeFileSync(path.join(PLUGIN_DIR, p.id + '.json'), JSON.stringify(p, null, 2))
  feed('plugins saved as files: ' + pluginList.length + ' in ' + PLUGIN_DIR)
  return { ok: true, count: pluginList.length, dir: PLUGIN_DIR }
}
function filesLoad() {
  if (!dbOf()) return { error: 'no world' }
  let names = []; try { names = fs.readdirSync(PLUGIN_DIR).filter((n) => /^[A-Za-z0-9-]{2,40}\.json$/.test(n)).sort() } catch (e) { return { error: 'no files', dir: PLUGIN_DIR } }
  const bad = [], list = []
  for (const n of names) {
    let p; try { p = JSON.parse(fs.readFileSync(path.join(PLUGIN_DIR, n), 'utf8')) } catch (e) { bad.push(n + ': not JSON'); continue }
    const why = p && typeof p === 'object' ? checkPlugin(p, 'adult') : 'not a plugin'
    if (why) { bad.push(n + ': ' + why); continue }
    if (p.id + '.json' !== n) { bad.push(n + ': the file name must be the plugin id'); continue }
    if (list.length < PLUGIN_LIMITS.plugins) list.push({ id: p.id, name: String(p.name).trim(), by: String(p.by || 'owner').slice(0, 20), about: String(p.about || '').slice(0, 200), on: !!p.on, v: 1, rules: p.rules })
  }
  if (bad.length && !list.length) return { error: 'no good files', bad }
  pluginList = list; savePlugins(); feed('plugins loaded from files: ' + list.length + (bad.length ? ' (' + bad.length + ' skipped)' : '')); libAutoPush()
  return { ok: true, count: list.length, bad }
}
function togglePlugin(id, on) { const p = pluginList.find((x) => x.id === id); if (!p) return { error: 'no such plugin' }; p.on = !!on; savePlugins(); feed('plugin ' + (on ? 'on' : 'off') + ': ' + p.name); return { ok: true } }
function dropPlugin(id) { const i = pluginList.findIndex((x) => x.id === id); if (i < 0) return { error: 'no such plugin' }; feed('plugin removed: ' + pluginList[i].name); pluginList.splice(i, 1); savePlugins(); libAutoPush(); return { ok: true } }
// an in-game edit lands in the library too (so every server the owner runs sees it on its next pull); on/off stays per server
function libAutoPush() { if (libOn()) libPush(true).then((r) => { if (r.error) feed('plugin library push failed: ' + r.error) }) }
// an event from the world -> run the plugins, carry out what they say. -> true when the event is denied
function pluginEvent(ev) {
  if (!pluginList.length) return false
  const r = runner.fire(ev)
  carryOut(r.actions, ev)
  return r.denied
}
function carryOut(actions, ev) {
  for (const a of actions) {
    const who = a.to !== undefined ? players().find(({ p }) => p.id === a.to) : null
    const send = (o) => { if (who) try { who.p.ws.send(JSON.stringify(o)) } catch (e) {} }
    if (a.a === 'say') broadcastAll({ t: 'chat', a: '⚙ ' + a.plugin, m: a.text, at: Date.now() })
    else if (a.a === 'tell') send({ t: 'chat', a: '⚙ ' + a.plugin, m: a.text, at: Date.now(), me: true })
    else if (a.a === 'announce') { broadcastAll({ t: 'chat', a: '📣 ' + a.plugin, m: a.text, at: Date.now() }); feed('plugin ' + a.plugin + ' announced: ' + a.text) }
    else if (a.a === 'tp') send({ t: 'tp', x: a.x + 0.5, y: a.y, z: a.z + 0.5, by: a.plugin })
    else if (a.a === 'spawn') send({ t: 'tp', x: SPAWN.x, y: SPAWN.y, z: SPAWN.z, by: a.plugin })
    else if (a.a === 'kick' && who && who.p.role === 'kid') { feed('plugin ' + a.plugin + ' kicked ' + who.p.alias); who.room.drop(who.p.id, 4006, 'plugin') }
    else if (a.a === 'mute' && who && who.p.role === 'kid') who.p.muted = !!a.on
    else if (a.a === 'undo' && who && Number.isFinite(ev.x)) { const w = worlds.get(ev.world || cfg.world); if (w) { const cur = w.obj.hub.world.cell(ev.x, ev.y, ev.z); if (cur !== undefined && cur !== ev.before) w.obj.hub.world.apply([{ x: ev.x, y: ev.y, z: ev.z, id: ev.before, b: cur }], null) } }
    else if (a.a === 'set') { const w = worlds.get(ev.world || cfg.world); if (w) { const cur = w.obj.hub.world.cell(a.x, a.y, a.z); if (cur !== undefined && cur !== a.id) w.obj.hub.world.apply([{ x: a.x, y: a.y, z: a.z, id: a.id, b: cur }], null) } }
  }
}
const evPlayer = (p) => ({ id: p.id, name: p.alias, owner: p.role !== 'kid' })
const worldOfPlayer = (p) => { const f = players().find(({ p: q }) => q === p); return f ? f.room.wid : cfg.world }
setInterval(() => { if (pluginList.length) carryOut(runner.tick(), {}) }, 1000).unref()
let ownerSeated = false              // an owner socket has been accepted this session (mirrors the hub's open flag)
function startSession({ ruleset, password }) {
  if (!cfg.world) return { error: 'no world' }
  if (ruleset && RULESETS.includes(ruleset)) cfg.ruleset = ruleset
  rules = makeRuleset(cfg.ruleset)
  const r = door.start({ world: cfg.world, cfg: cfg.ruleset, password: password || null })
  lastCode = r.code
  saveCfg()
  feed('session started · world ' + cfg.world + ' · rules ' + cfg.ruleset + (password ? ' · password on' : ''))
  return { ok: true, code: r.code, session: r.session }
}
function endSession() {
  if (door.session) feed('session ended')
  door.end(); lastCode = null; ownerSeated = false; events.clear(); keepFor.clear()
  for (const { room, p } of players()) room.drop(p.id, 4006, 'session ended')
}
function rotateCode() { const r = door.rotate(); if (!r) return { error: 'ended' }; lastCode = r.code; feed('code rotated'); return { ok: true, code: r.code } }
const findPlayer = (ref) => players().find(({ p }) => p.ref === ref)
function kick(ref) { const f = findPlayer(ref); if (!f) return { error: 'offline' }; feed('owner kicked ' + f.p.alias); f.room.drop(f.p.id, 4006, 'kicked'); return { ok: true } }
function ban(ref) { const f = findPlayer(ref); feed('owner banned ' + (f ? f.p.alias : door.nameOf(ref) || 'a player')); door.ban(ref, f ? f.p.alias : door.nameOf(ref) || '', f ? f.p.ip : ''); if (f) f.room.drop(f.p.id, 4006, 'banned'); return { ok: true } }
function freeze(on) { feed(on ? 'owner froze building' : 'owner unfroze building'); for (const r of rooms.values()) { r.frozen = !!on; r.broadcast({ t: 'frz', on: on ? 1 : 0 }) } return { ok: true, frozen: !!on } }
// Mute: a per-player flag the Room reads once quick chat is wired (part 4; essentials.js is standalone today). Until then it only shows on the owner page.
function mute(ref, on) { let n = 0, who = ref === '*' ? 'everyone' : ''; for (const { p } of players()) if (ref === '*' || p.ref === ref) { p.muted = !!on; n++; if (ref !== '*') who = p.alias } if (n) feed('owner ' + (on ? 'muted ' : 'unmuted ') + who); return { ok: true, n } }
// Rollback: undo every edit of the last N minutes (optionally by one player), through the world so it is numbered, saved and fanned out.
function rollback(minutes, ref, worldName = null) {
  const target = worldName || (ref && findPlayer(ref) ? findPlayer(ref).room.wid : cfg.world)
  const w = target && worlds.get(target); if (!w) return { error: 'no world' }
  const hub = w.obj.hub
  const until = Date.now(), since = until - Math.max(1, Math.min(7 * 24 * 60, Number(minutes) || 5)) * 60 * 1000
  const sel = { since, until, ...(ref ? { who: hub.who(ref) } : {}) }
  const plan = undoPlan(hub.world.log(), sel)
  const res = applyUndo(hub.world, plan)
  feed('owner rolled back ' + plan.length + ' cell' + (plan.length === 1 ? '' : 's') + ' (' + Math.round((until - since) / 60000) + ' min' + (ref ? ', one player' : '') + ')')
  return { ok: true, cells: plan.length, applied: res.filter((r) => r.ok).length }
}
// Keep inventory: the world's value (rules 'survival.keep') unless the owner set one for a player (this session only).
const keepFor = new Map()            // ref -> true | false
// The rules a player gets: the world's, with their own keep-inventory value. keep says where it came from.
function rulesFor(ref) {
  const s = rules.snapshot()
  const own = keepFor.has(ref)
  const me = players().find(({ p }) => p.ref === ref), staff = !!(me && me.p.role !== 'kid')
  const mode = modeFor.get(ref)
  return { t: 'rules', ...s, r: { ...s.r, 'survival.keep': own ? keepFor.get(ref) : s.r['survival.keep'], ...(mode ? { mode } : {}) }, keep: own ? 'player' : 'world', ...(mode ? { modeFrom: 'player' } : {}), menu: commands.menuFor(staff), warps: commands.warpList() }
}
const sendRules = (ws, ref) => { try { ws.send(JSON.stringify(rulesFor(ref))) } catch (e) {} }
// Everyone hears a rules change as {t:'rules', ...}: the client shows a calm toast and applies it.
function broadcastRules() { for (const { p } of players()) if (p.ws) sendRules(p.ws, p.ref) }
function setKeep(ref, on) {
  if (typeof ref !== 'string' || !ref) return { error: 'ref' }
  if (on === null) keepFor.delete(ref); else if (typeof on === 'boolean') keepFor.set(ref, on); else return { error: 'value' }
  const f = findPlayer(ref); if (f && f.p.ws) sendRules(f.p.ws, ref)
  return { ok: true, keep: keepFor.has(ref) ? keepFor.get(ref) : rules.get('survival.keep'), from: keepFor.has(ref) ? 'player' : 'world' }
}
function setRuleset(preset) { if (!rules.setPreset(preset)) return { error: 'ruleset' }; feed('rules: ' + preset); cfg.ruleset = preset; door.setCfg(preset); saveCfg(); broadcastRules(); return { ok: true, ...rules.snapshot() } }
function setRule(id, v) { const r = rules.set(id, v); if (r.error) return r; if (!r.same) broadcastRules(); return { ok: true, ...rules.snapshot() } }
// The home frame filter: runs BEFORE the (school) Room sees a frame. Enforces the ruleset on edits, answers the
// home-only craft/st/hit frames, drops quick chat from a muted player. Everything else goes to the Room unchanged.
function homeFrame(room, ws, p, text) {
  let m = null; try { m = JSON.parse(text) } catch (e) { return false }
  if (!m || m.v !== 0 || typeof m.t !== 'string') return false
  const staff = p.role !== 'kid'
  const no = (c, extra) => { try { ws.send(JSON.stringify({ t: 'no', c, ...(extra || {}) })) } catch (e) {} }
  if (m.t === 'b') { const why = rules.editWhy(m, staff); if (why) { no(why, { x: m.x, y: m.y, z: m.z }); return true } if (m.id === 0 && guardBreak(p)) return true; if (pluginEvent({ e: m.id === 0 ? 'break' : 'place', player: evPlayer(p), x: m.x, y: m.y, z: m.z, block: m.id === 0 ? m.b : m.id, before: m.b })) { no('plugin', { x: m.x, y: m.y, z: m.z }); return true } tallyEdit(p.alias, m.id !== 0); stat(p, m.id !== 0 ? 'placed' : 'broken'); return false }
  if (m.t === 'p') {
    const why = rules.flyWhy(m, staff); if (why) { no(why); return true }
    // Home positions are trusted within the world's bounds (adults the owner let in): creative flying, respawns and
    // teleports would trip the school's speed check, which kicks after 5 strikes. Sequence must still go up.
    if (room.frozen && !staff && p.pos) return false                       // a freeze still snaps back (Room)
    const fz = frozenAt.get(p.ref)
    if (fz) { const t = Date.now(); if (t - fz.at >= 1000) { fz.at = t; try { ws.send(JSON.stringify({ t: 'tp', x: fz.x, y: fz.y, z: fz.z, by: '' })) } catch (e) {} } return true }   // /freeze <player>: stays put
    const pos = parsePos(m)
    if (!pos || !Number.isInteger(m.q) || m.q <= p.lastQ || pos.y < LIMITS.yMin || pos.y > LIMITS.yMax) return false   // the Room refuses it
    p.lastQ = m.q; p.pos = pos; p.posAt = Date.now(); p.dirty = true
    return true
  }
  if (m.t === 'all') { sendAll(ws, p); return true }
  if (RULE_FRAMES.has(m.t)) {
    const why = m.t === 'craft' ? rules.craftWhy(m, staff) : m.t === 'st' ? rules.stationWhy(m, staff) : rules.hitWhy(m, staff)
    if (why) no(why, m.t === 'st' ? { k: m.k } : {}); else try { ws.send(JSON.stringify({ t: 'ok', a: m.t })) } catch (e) {}
    return true
  }
  if (m.t === 'q' && p.muted) return true   // quick chat from a muted player: dropped quietly, as at school
  // world chat (home-only): on unless the owner turned it off; plain text, 200 chars, burst 5 then 1/s, no word filter, never stored
  if (m.t === 'cmd' && LOCAL_CMDS.includes(String(m.c)) && !['setwarp', 'delwarp', 'warps'].includes(m.c)) { const c = String(m.c), staff = p.role !== 'kid'; if (!staff && !['list', 'top', 'world'].includes(c)) { try { ws.send(JSON.stringify({ t: 'cmdno', c, why: CMD_WHY.role })) } catch (e) {} return true } localCommand(room, ws, p, ['list', 'day', 'night', 'cycle'].includes(c) ? { local: c } : c === 'top' ? { local: 'top', board: 'placed' } : c === 'world' ? { local: 'world', name: String(m.name || '') } : { local: c, id: Number(m.id) }); return true }
  if (m.t === 'cmd') { if (m.c === 'setwarp' || m.c === 'delwarp') typedCommand(room, ws, p, '/' + m.c + ' ' + String(m.name || '')); else if (m.c === 'announce') typedCommand(room, ws, p, '/announce ' + String(m.text || '')); else runCommand(room, ws, p, { c: String(m.c), ...(m.id !== undefined ? { id: m.id } : {}), ...(m.i !== undefined ? { i: m.i } : {}), ...(m.on !== undefined ? { on: m.on } : {}) }); return true }
  if (m.t === 'chat' && typeof m.m === 'string' && m.m.trim().startsWith('/')) { typedCommand(room, ws, p, m.m); return true }
  if (m.t === 'chat') {
    const off = rules.chatWhy(m, staff); if (off) { no(off); return true }
    if (p.muted) { no('chat-muted'); return true }
    const c = cleanChat(m.m); if (c.error) { no(c.error); return true }
    const slow = chatGate.check(p.ref); if (slow) { no('chat-slow', slow); return true }
    if (pluginEvent({ e: 'chat', world: room.wid, player: evPlayer(p), text: c.m })) { no('plugin'); return true }
    stat(p, 'chats')
    broadcastAll({ t: 'chat', a: p.alias, m: c.m, at: Date.now(), ...(cfg.worlds.length > 1 ? { w: room.wid } : {}) })   // cross-world: every open world hears it, tagged with where it came from
    if (SHOW_CHAT) feed((cfg.worlds.length > 1 ? '[' + room.wid + '] ' : '') + p.alias + ': ' + c.m)
    return true
  }
  // shared events (home-only): a boss fight started, moved on or ended somewhere in the world
  if (m.t === 'ev') {
    const r = events.handle({ ref: p.ref, alias: p.alias, staff }, m)
    if (r.error) no(r.error); else if (r.relay) { broadcastAll(r.relay); if (r.relay.a === 'start') feed(p.alias + ' started a boss fight'); else if (r.relay.a === 'end') { feed('the boss fight ended' + (r.relay.won ? ': won' : '')); if (r.relay.won) stat(p, 'boss') } }
    return true
  }
  return false
}
function live() {
  const w = cfg.world ? worlds.get(cfg.world) : null
  const out = { world: cfg.world, worlds: cfg.worlds.map((n) => ({ name: n, main: n === cfg.world, players: players().filter(({ room }) => room.wid === n).length })), session: door.info(), ruleset: cfg.ruleset, players: [], head: w ? w.obj.hub.world.head() : 0, recent: [], bans: door.bans, frozen: [...rooms.values()].some((r) => r.frozen) }
  for (const { room, p } of players()) out.players.push({ ref: p.ref, name: p.alias, role: p.role === 'kid' ? 'player' : 'owner', room: room.rid, world: room.wid, muted: !!p.muted, keep: keepFor.has(p.ref) ? keepFor.get(p.ref) : rules.get('survival.keep') !== false, keepOwn: keepFor.has(p.ref), frozen: frozenAt.has(p.ref), mode: modeFor.get(p.ref) || null, pos: p.pos ? { x: p.pos.x, y: p.pos.y, z: p.pos.z } : null })
  if (w) {
    const h = w.obj.hub
    const who = new Map(out.players.map((p) => [h.who(p.ref), p.name]))
    out.rules = rules.snapshot()
    out.recent = (h.world.since(Math.max(0, h.world.head() - 30), 30).ops || []).map((o) => ({ s: o.s, who: o.w ? who.get(o.w) || 'someone' : 'server', x: o.x, y: o.y, z: o.z, b: o.b, i: o.i, t: o.t })).reverse()
  }
  return out
}

// ---------------------------------------------------------------- HTTP
const lanAddrs = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address)
const rawIp = (req) => (req.socket.remoteAddress || '').replace(/^::ffff:/, '')
// A loopback connection may carry X-Forwarded-For (a local TLS proxy per the README, or a check); anything else is its real address.
// A loopback peer may be a local TLS proxy or the Cloudflare tunnel (which sends the visitor in CF-Connecting-IP).
const ipOf = (req) => { const r = rawIp(req); const f = r === '127.0.0.1' || r === '::1' ? String(req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || '').split(',')[0].trim() : ''; return f || r }
// "This PC" = a loopback socket that did NOT come through a proxy or the tunnel: anything carrying a forwarded visitor
// (CF-Connecting-IP, X-Forwarded-For) or the tunnel's own hostname is a visitor, however local the socket looks.
const access = makeAccess(cfg.access || {}, { certsUrl: process.env.BT_ACCESS_CERTS || '' })   // BT_ACCESS_CERTS: the checks only (a stand-in certs server)
// The owner page through the tunnel: only with Access on, only on the tunnel host, only with a JWT Cloudflare signed
// for this app (and this email). Anything else that is not the host PC stays out. PIN + owner key come after.
const remoteOwnerOk = async (req) => {
  if (!access.on || !tunnelHost() || !viaTunnel(req)) return false
  const tok = accessToken(req); if (!tok) return false
  const r = await access.check(tok)
  if (!r.ok) { feed('owner page refused through the tunnel (' + r.error + ')'); return false }
  return true
}
const isLocal = (req) => ['127.0.0.1', '::1'].includes(rawIp(req)) && !req.headers['cf-connecting-ip'] && !req.headers['x-forwarded-for'] && !(tunnelHost() && String(req.headers.host || '').toLowerCase().split(':')[0] === tunnelHost())
// Behind a local TLS proxy (README: Caddy/nginx on this PC) the page is https, so the socket must be wss://. Only a
// loopback peer may say so; anyone else gets plain ws:// for their LAN address.
const viaProxy = (req) => ['127.0.0.1', '::1'].includes(rawIp(req))   // a loopback socket: a local TLS proxy or the tunnel may stand in front
// Through the tunnel (loopback socket + CF-Connecting-IP) the game must open wss://<tunnel host>: Cloudflare only
// routes the tunnel's own hostname, and a browser on an https page refuses plain ws://.
const viaTunnel = (req) => viaProxy(req) && !!req.headers['cf-connecting-ip'] && !!tunnelHost()
const wsBase = (req) => viaTunnel(req) ? 'wss://' + tunnelHost() : (viaProxy(req) && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https' ? 'wss://' : 'ws://') + req.headers.host
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
const text = (res, status, body) => { res.writeHead(status, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end(body) }
const page = (res, name) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(fs.readFileSync(path.join(HERE, name))) }
const BODY_MAX = 16 * 1024   // the biggest honest body (a rules edit) is under 1 KB
const readBody = (req, res) => new Promise((r) => {
  let b = '', over = false
  req.on('data', (d) => { if (over) return; b += d; if (b.length > BODY_MAX) { over = true; res.writeHead(413, { 'content-type': 'application/json', connection: 'close' }); res.end('{"error":"too-big"}'); req.destroy() } })
  req.on('end', () => { if (over) return; try { r(JSON.parse(b || '{}')) } catch (e) { r({}) } })
  req.on('close', () => { if (over) r(null) })
})
const ownerTokens = new Map()         // token -> expiry; issued after a PIN check, per owner browser session
const ownerOk = (req) => { const tkn = req.headers['x-owner']; const exp = tkn && ownerTokens.get(tkn); return (isLocal(req) || req.btRemoteOk === true) && !!exp && exp > Date.now() }   // btRemoteOk: set by the /owner gate after Cloudflare Access checked out
const inviteJoins = new Map()   // ref -> join reply with invite fields, until the socket opens
// the link a person opens to land on the join card with the key filled in: the internet address when the tunnel is on, else this PC's
const joinLink = (key) => (tunnelHost() ? 'https://' + tunnelHost() : 'http://localhost:' + cfg.port) + '/?invite=' + encodeURIComponent(key)
const tunnelHost = () => String(arg('tunnel-host', cfg.tunnelHost || '')).toLowerCase().replace(/[^a-z0-9.-]/g, '')
const originOk = (req) => { const o = req.headers.origin; if (!o) return true; const mine = ['http://localhost:' + cfg.port, 'http://127.0.0.1:' + cfg.port, ...lanAddrs().map((a) => 'http://' + a + ':' + cfg.port), ...cfg.origins, ...(tunnelHost() ? ['https://' + tunnelHost()] : [])]; return mine.includes(o) }

export const server = http.createServer((req, res) => handle(req, res).catch((e) => { console.error('[home] request failed:', e && e.message); try { json(res, 500, { error: 'server' }) } catch (_) {} }))
async function handle(req, res) {
  const url = new URL(req.url, 'http://x')
  if (!originOk(req)) return text(res, 403, 'origin')
  if (url.pathname === '/' || url.pathname === '/index.html') return GAME ? serveFile(res, GAME, 'index.html') : page(res, 'join.html')
  if (url.pathname === '/join.html') return page(res, 'join.html')
  if (url.pathname.startsWith('/shared/') && serveFile(res, SHARED, url.pathname.slice('/shared/'.length))) return
  if (url.pathname.startsWith('/fonts/') && serveFile(res, path.join(REPO, 'fonts'), url.pathname.slice('/fonts/'.length))) return
  if (GAME && !url.pathname.startsWith('/rt/') && !url.pathname.startsWith('/owner') && url.pathname !== '/join' && url.pathname !== '/version' && serveFile(res, GAME, url.pathname.slice(1))) return
  if (url.pathname === '/owner') return (isLocal(req) || (await remoteOwnerOk(req))) ? page(res, 'owner.html') : text(res, 403, 'the owner page is for the host PC only')
  if (url.pathname === '/rt/health') return text(res, 200, 'ok')
  if (url.pathname === '/version') return json(res, 200, { version: PKG.version, game: PKG.gameVersion || null })
  // the open worlds, for the join card's picker: names and counts only, and only while a session is live
  if (url.pathname === '/worlds') return json(res, 200, { worlds: door.session ? cfg.worlds.map((n) => ({ name: n, main: n === cfg.world, players: players().filter(({ room }) => room.wid === n).length })) : [] })
  if (url.pathname === '/join' && req.method === 'POST') {
    const b = await readBody(req, res); if (!b) return
    const pick = typeof b.world === 'string' && isOpen(b.world) ? b.world : null   // a picked world must be one of the open ones; else the main one
    const r = await door.join({ code: b.code, name: b.name, password: b.password, adults: b.adults === true, ip: ipOf(req), playersOnline: online(), world: pick })
    // the hub opens a world when a staff seat (here: the owner) is in it; say so instead of handing out a ticket that dies at the door
    if (!r.error && !ownerSeated) return json(res, 403, { error: 'no-owner' })
    if (r.error) return json(res, r.error === 'slow-down' ? 429 : r.error === 'full' ? 503 : 403, { error: r.error, ...(r.wait ? { wait: r.wait } : {}) })
    if (r.invite) inviteJoins.set(r.ref, r)   // the socket open names it in the feed
    return json(res, 200, { ticket: r.ticket, name: r.name, world: r.world, ruleset: r.ruleset, ws: wsBase(req) + '/rt/ws', version: PKG.gameVersion || PKG.version, worlds: cfg.worlds.slice() })
  }
  // owner API: host PC only. /owner/pin exchanges the PIN (and the URL key) for a short token; the rest need the token.
  if (url.pathname.startsWith('/owner/')) {
    if (!isLocal(req)) { if (!(await remoteOwnerOk(req))) return json(res, 403, { error: 'host only' }); req.btRemoteOk = true }
    // world files move as raw bytes, so they skip the small JSON body reader (owner only, this PC only)
    if (url.pathname === '/owner/world/export') return ownerOk(req) ? exportWorld(res, String(url.searchParams.get('name') || cfg.world || '')) : json(res, 401, { error: 'owner' })
    if (url.pathname === '/owner/world/import' && req.method === 'POST') return ownerOk(req) ? importWorld(req, res, String(url.searchParams.get('name') || '')) : json(res, 401, { error: 'owner' })
    const raw = req.method === 'POST' ? await readBody(req, res) : {}; if (!raw) return
    // owner bodies are small and flat: keep strings, booleans and finite numbers; drop anything else (no objects as ids)
    const b = Object.create(null)
    for (const [k, v] of Object.entries(raw && typeof raw === 'object' ? raw : {})) if (['string', 'boolean'].includes(typeof v) || (typeof v === 'number' && Number.isFinite(v)) || v === null) b[k] = v
    if (url.pathname === '/owner/pin') {
      if (b.key !== cfg.ownerKey) return json(res, 403, { error: 'key' })
      const lim = door.pinAttempt(ipOf(req)); if (lim) return json(res, 429, { error: 'slow-down', wait: lim.wait })
      if (!cfg.pin) { if (!validPin(b.pin)) return json(res, 400, { error: 'pin-format' }); cfg.pin = hashPin(b.pin); saveCfg() }   // first run: set it
      else if (!checkPin(String(b.pin || ''), cfg.pin)) return json(res, 403, { error: 'pin' })
      door.pinOk(ipOf(req))
      const tkn = randomBytes(24).toString('hex'); ownerTokens.set(tkn, Date.now() + 12 * 60 * 60 * 1000)
      return json(res, 200, { token: tkn, firstRun: false })
    }
    if (url.pathname === '/owner/setup') return json(res, 200, { pinSet: !!cfg.pin, keyOk: url.searchParams.get('k') === cfg.ownerKey })
    if (!ownerOk(req)) return json(res, 401, { error: 'owner' })
    switch (url.pathname) {
      case '/owner/state': return json(res, 200, { version: PKG.version, tunnel: tunnelHost() ? 'https://' + tunnelHost() + '/' : null, game: PKG.gameVersion || null, gameBuilt: !!GAME, port: cfg.port, listen: cfg.listen, lan: cfg.listen !== '127.0.0.1', addrs: cfg.listen === '127.0.0.1' ? [] : lanAddrs(), maxPlayers: cfg.maxPlayers, rulesets: RULESETS, world: cfg.world, worlds: listWorlds(), backups: fs.readdirSync(path.join(DATA, 'backups')).sort().reverse(), code: lastCode, live: live(), data: DATA, guard: cfg.guard, invites: door.invites, library: { on: libOn(), url: cfg.library.url || '', v: libV }, access: { on: access.on, team: cfg.access.team || '', email: cfg.access.email || '', remote: !isLocal(req) } })
      case '/owner/session/start': return json(res, 200, startSession(b))
      case '/owner/session/end': endSession(); return json(res, 200, { ok: true })
      case '/owner/session/rotate': return json(res, 200, rotateCode())
      case '/owner/session/code/hide': lastCode = null; return json(res, 200, { ok: true })
      case '/owner/session/password': door.setPassword(b.password); return json(res, 200, { ok: true, password: !!b.password })
      case '/owner/ruleset': return json(res, RULESETS.includes(b.ruleset) ? 200 : 400, setRuleset(String(b.ruleset || '')))
      case '/owner/rule': { const r = setRule(String(b.id || ''), b.v); return json(res, r.error ? 400 : 200, r) }
      case '/owner/rules': return json(res, 200, { ...rules.snapshot(), presets: Object.keys(PRESETS) })
      case '/owner/plugins': return json(res, 200, { list: pluginList, examples: EXAMPLES })
      case '/owner/plugin/put': { const r = putPlugin(raw && raw.plugin); return json(res, r.error ? 400 : 200, r) }
      case '/owner/library/status': return json(res, 200, { on: libOn(), url: cfg.library.url || '', v: libV, dir: PLUGIN_DIR })
      case '/owner/library/new': { if (!isLocal(req)) return json(res, 403, { error: 'host only' }); const r = await libNew(b.url); return json(res, r.error ? 400 : 200, r) }
      case '/owner/library/link': { if (!isLocal(req)) return json(res, 403, { error: 'host only' })   // the key is typed on the host PC only
        const u = String(b.url || '').replace(/\/+$/, ''), k = String(b.key || '').trim()
        if (b.off === true) { cfg.library = { url: '', key: '' }; saveCfg(); libV = null; feed('owner unlinked the plugin library'); return json(res, 200, { ok: true, on: false }) }
        if (!/^https?:\/\//.test(u) || !/^lk_[0-9a-f]{32}$/.test(k)) return json(res, 400, { error: 'url and key' })
        cfg.library = { url: u, key: k }; saveCfg(); libV = null; const r = await libCall('GET', '/lib'); if (r.error) { cfg.library = { url: '', key: '' }; saveCfg(); return json(res, 400, r) }
        feed('owner linked the plugin library at ' + u + ' (' + r.plugins.length + ' plugins)'); return json(res, 200, { ok: true, on: true, count: r.plugins.length, v: r.v }) }
      case '/owner/library/pull': { const r = await libPull(b.force === true); return json(res, r.error ? (r.error === 'conflict' ? 409 : 400) : 200, r) }
      case '/owner/library/push': { const r = await libPush(b.force === true); return json(res, r.error ? (r.error === 'conflict' ? 409 : 400) : 200, r) }
      case '/owner/plugins/files/save': return json(res, 200, filesSave())
      case '/owner/plugins/files/load': { const r = filesLoad(); return json(res, r.error ? 400 : 200, r) }
      case '/owner/plugin/on': return json(res, 200, togglePlugin(String(b.id || ''), !!b.on))
      case '/owner/plugin/drop': return json(res, 200, dropPlugin(String(b.id || '')))
      case '/owner/play': { const w = typeof b.world === 'string' && isOpen(b.world) ? b.world : cfg.world; const t = await door.ownerTicket(String(b.name || 'Owner').slice(0, 20), w); return t ? json(res, 200, { ticket: t, ws: 'ws://localhost:' + cfg.port + '/rt/ws', world: w, name: String(b.name || 'Owner').slice(0, 20) }) : json(res, 400, { error: 'no session' }) }
      case '/owner/world/open': { const r = openWorld(String(b.name || ''), { main: b.main === true }); return json(res, r.error ? 400 : 200, r) }
      case '/owner/world/main': { const n = String(b.name || ''); if (!isOpen(n)) return json(res, 404, { error: 'not open' }); cfg.world = n; pluginList = []; runner.load([]); loadPlugins(); saveCfg(); feed('main world: ' + n); return json(res, 200, { ok: true, main: n }) }
      case '/owner/world/close': { const n = b.name ? String(b.name) : cfg.world; if (!isOpen(n)) return json(res, 404, { error: 'not open' }); if (cfg.worlds.length === 1) endSession(); closeWorld(n); return json(res, 200, { ok: true, worlds: cfg.worlds.slice(), main: cfg.world }) }
      case '/owner/world/backup': return json(res, 200, backupWorld(String(b.name || cfg.world || '')))
      case '/owner/world/restore': return json(res, 200, restoreWorld(String(b.file || '')))
      case '/owner/invite': { const r = door.invite({ label: b.label, name: b.name || null, max: b.max, ttlMs: Number(b.hours) ? Number(b.hours) * 3600 * 1000 : undefined }); if (r.error) return json(res, 400, r); feed('owner made invite ' + (r.label || r.id) + (b.label ? ' (' + String(b.label).slice(0, 40) + ')' : '') + ', ' + r.max + ' use' + (r.max === 1 ? '' : 's')); return json(res, 200, { ...r, link: joinLink(r.key) }) }
      case '/owner/invites': return json(res, 200, { list: door.invites })
      case '/owner/invite/revoke': { const r = door.revokeInvite(String(b.id || '')); if (!r.error) feed('owner revoked invite ' + String(b.id || '')); return json(res, r.error ? 404 : 200, r) }
      case '/owner/access': { if (!isLocal(req)) return json(res, 403, { error: 'host only' })   // only from the host PC: the remote door is not changed from the remote side
        if (b.team !== undefined || b.aud !== undefined || b.email !== undefined) { Object.assign(cfg.access, { team: String(b.team ?? cfg.access.team ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 64), aud: String(b.aud ?? cfg.access.aud ?? '').replace(/[^a-f0-9]/gi, '').slice(0, 64), email: String(b.email ?? cfg.access.email ?? '').trim().toLowerCase().slice(0, 120) }); saveCfg(); feed('owner set Cloudflare Access: ' + (access.on ? 'on (' + cfg.access.team + ')' : 'off')) }
        return json(res, 200, { access: { on: access.on, team: cfg.access.team, email: cfg.access.email, aud: cfg.access.aud ? cfg.access.aud.slice(0, 8) + '…' : '' } }) }
      case '/owner/top': { const name = b.world && isOpen(String(b.world)) ? String(b.world) : cfg.world; const st = statsFor(name); const board = BOARDS.includes(b.board) ? b.board : 'placed'; return json(res, 200, { world: name, board, boards: BOARDS, list: st ? st.top(board, 20) : [], aliases: st ? st.size : 0 }) }
      case '/owner/top/reset': { const name = b.world && isOpen(String(b.world)) ? String(b.world) : cfg.world; const st = statsFor(name); if (!st) return json(res, 400, { error: 'no world' }); st.reset(b.alias ? String(b.alias) : null); saveStats(); feed('owner reset the leaderboard' + (b.alias ? ' entry of ' + String(b.alias) : '') + ' in ' + name); return json(res, 200, { ok: true }) }
      case '/owner/guard': { if (b.on !== undefined || b.breaks !== undefined || b.window !== undefined || b.undo !== undefined) { cfg.guard = { on: b.on === undefined ? cfg.guard.on !== false : b.on === true, breaks: Math.max(10, Math.min(500, Number(b.breaks) || cfg.guard.breaks || 70)), window: Math.max(2, Math.min(60, Number(b.window) || cfg.guard.window || 10)), undo: b.undo === undefined ? cfg.guard.undo !== false : b.undo === true }; saveCfg(); feed('owner set guard: ' + (cfg.guard.on ? cfg.guard.breaks + ' breaks / ' + cfg.guard.window + ' s' + (cfg.guard.undo ? ', undo' : '') : 'off')) } return json(res, 200, { guard: cfg.guard }) }
      case '/owner/kick': return json(res, 200, kick(String(b.ref || '')))
      case '/owner/ban': return json(res, 200, ban(String(b.ref || '')))
      case '/owner/unban': door.unban(String(b.ref || '')); return json(res, 200, { ok: true })
      case '/owner/freeze': return json(res, 200, freeze(!!b.on))
      case '/owner/mute': return json(res, 200, mute(String(b.ref || '*'), !!b.on))
      case '/owner/keep': { const r = setKeep(String(b.ref || ''), b.on === undefined ? null : b.on); return json(res, r.error ? 400 : 200, r) }
      case '/owner/rollback': return json(res, 200, rollback(b.minutes, b.ref ? String(b.ref) : null, b.world ? String(b.world) : null))
      case '/owner/lan': cfg.listen = b.on ? '0.0.0.0' : '127.0.0.1'; saveCfg(); return json(res, 200, { ok: true, restart: true })
      case '/owner/stop': json(res, 200, { ok: true }); setTimeout(shutdown, 100); return
      default: return json(res, 404, { error: 'no' })
    }
  }
  text(res, 404, 'not found')
}

// WebSocket: a home ticket (iss 'home', our secret) opens the same Room.fetch the school uses.
server.on('upgrade', async (req, tcp, head) => {
  const url = new URL(req.url, 'http://' + req.headers.host)
  const refuse = (status, body) => { tcp.write(`HTTP/1.1 ${status} ${body}\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`); tcp.destroy() }
  if (url.pathname !== '/rt/ws' || !originOk(req)) return refuse(403, 'forbidden')
  const protos = String(req.headers['sec-websocket-protocol'] || '').split(',').map((s) => s.trim())
  const token = protos.includes(PROTOCOL) ? protos.find((s) => s !== PROTOCOL) : null
  if (!token) return refuse(401, 'unauthorized')
  const v = await door.verify(token)
  if (!v.ok) return refuse(401, 'unauthorized')
  const c = v.claims
  if (!cfg.world || !isOpen(c.world) || !door.session || door.isBanned(c.ref)) return refuse(403, 'closed')
  const ip = ipOf(req)
  // the hub seats the player (room choice, open flag, build gate), then the Room checks everything again
  const a = worldOf(c.world).assign({ world: c.world, ref: c.ref, grp: null, role: c.role, bld: 's', cfg: c.cfg })
  if (a.err) return refuse(403, a.err)
  const h = new Headers()
  for (const [k, v2] of Object.entries(req.headers)) if (typeof v2 === 'string' && !k.startsWith('x-bt-')) h.set(k, v2)
  h.set('Upgrade', 'websocket'); h.delete('sec-websocket-protocol')
  h.set('x-bt-ref', c.ref); h.set('x-bt-alias', encodeURIComponent(c.alias)); h.set('x-bt-jti', c.jti); h.set('x-bt-exp', String(c.exp))
  h.set('x-bt-role', c.role); h.set('x-bt-cfg', c.cfg); h.set('x-bt-ip', door.ipTag(ip)); h.set('x-bt-world', c.world); h.set('x-bt-rid', a.room)
  let out
  try { out = await roomOf(a.room).fetch(new Request('http://' + req.headers.host + req.url, { headers: h })) } catch (e) { console.error('[home] join failed', e.message); return refuse(500, 'error') }
  if (!out || out.status !== 101) return refuse(out ? out.status : 500, out ? await out.text() : 'error')
  const ws = out.webSocket.server, room = ws.room || null
  if (room) { const p = [...room.players.values()].find((q) => q.ws === ws); if (p) p.ip = ip }
  door.connOpen(ip); door.noteActivity(); if (c.role !== 'kid') ownerSeated = true
  joinedAt.set(c.ref, Date.now()); { const me = players().find(({ p }) => p.ws === ws); if (me) statsFor(me.room.wid) }
  const inv = inviteJoins.get(c.ref); inviteJoins.delete(c.ref)
  feed(c.alias + (c.role !== 'kid' ? ' (owner)' : '') + ' joined' + (inv ? ' with invite ' + (inv.inviteLabel || inv.invite) + ' (' + inv.inviteUse + '/' + inv.inviteMax + ')' : '') + ' · ' + players().length + ' in')
  sendRules(ws, c.ref)   // right after hello: the active ruleset, with this player's keep-inventory value
  { const ev = events.current(); if (ev) try { ws.send(JSON.stringify(ev)) } catch (e) {} }   // and a boss fight already going
  // plugins last: a 'join' greeting must land after the rules frame, which is what turns the player's chat on
  { const me = players().find(({ p }) => p.ws === ws); if (me) { if (me.p.role !== 'kid') try { ws.send(JSON.stringify({ t: 'plugins', list: pluginSummary() })) } catch (e) {}; pluginEvent({ e: 'join', player: evPlayer(me.p) }) } }
  tcp.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(req.headers['sec-websocket-key']) + '\r\nSec-WebSocket-Protocol: ' + PROTOCOL + '\r\n\r\n')
  ws.attach(tcp, head, {
    onText: (t) => { door.noteActivity(); if (!room) return; const p = [...room.players.values()].find((q) => q.ws === ws); if (p && homeFrame(room, ws, p, t)) return; room.webSocketMessage(ws, t).catch(() => {}) },
    onEnd: (code) => { door.connClose(ip); chatGate.forget(c.ref); allAsked.delete(c.ref); commands.forget(c.ref); frozenAt.delete(c.ref); modeFor.delete(c.ref); { const at = joinedAt.get(c.ref); const me = players().find(({ p }) => p.ws === ws); if (at && me) stat(me.p, 'time', Math.floor((Date.now() - at) / 1000)); joinedAt.delete(c.ref) } feed(c.alias + ' left (' + code + ') · ' + Math.max(0, players().length - 1) + ' in'); { const me = players().find(({ p }) => p.ws === ws); if (me) pluginEvent({ e: 'leave', player: evPlayer(me.p) }) } const ev = events.leave(c.ref); if (room) room.webSocketClose(ws, code).catch(() => {}); if (ev) broadcastAll(ev) },
  })
})

setInterval(() => { for (const [k, exp] of ownerTokens) if (exp <= Date.now()) ownerTokens.delete(k); chatGate.sweep(); if (door.sweep(players().length)) console.log('[home] session ended: 24 h with nobody in') }, 60 * 1000).unref()

function shutdown() {
  console.log('[home] stopping')
  try { endSession(); const keep = cfg.worlds.slice(), main = cfg.world; for (const n of keep) closeWorld(n, { forget: false }); cfg.worlds = keep; cfg.world = main } catch (e) {}   // worlds reopen on the next start
  server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500)
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)
// A launcher that started us (the Python launcher) asks for a clean stop by writing "stop" on our stdin: Windows has
// no SIGTERM, and a hard kill would skip the final save. Only when it asked for this channel.
if (process.env.BT_STDIN_STOP === '1') {
  let buf = ''
  process.stdin.setEncoding('utf8')
  process.stdin.on('data', (d) => { buf += d; if (/(^|\n)stop\s*\n/.test(buf)) shutdown() })
  process.stdin.on('end', () => shutdown())   // the launcher went away: stop cleanly rather than run headless
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(cfg.port, cfg.listen, () => {
    console.log(`[home] Bertopia personal host (adults 18+)  owner page: http://localhost:${cfg.port}/owner?k=${cfg.ownerKey}`)
    console.log(cfg.listen === '127.0.0.1' ? '[home] this PC only (owner page: "Let other computers join" for the LAN)' : '[home] players on this network join at ' + lanAddrs().map((a) => `http://${a}:${cfg.port}/`).join('  or  '))
    console.log('[home] data: ' + DATA + (GAME ? ' | game: ' + GAME : ' | no game build yet: run `npm run build:home` in bloxbert-src; / shows the plain join page'))
    if (cfg.worlds.length) { const main = cfg.world, list = cfg.worlds.slice(); cfg.worlds = []; cfg.world = null; for (const n of list) { try { openWorld(n, { main: n === main }) } catch (e) { console.error('[home] could not reopen ' + n + ': ' + e.message) } } console.log('[home] reopened ' + cfg.worlds.join(', ') + ' (main ' + cfg.world + '; start a session to let people in)') }
    if (flag('open')) { const u = `http://localhost:${cfg.port}/owner?k=${cfg.ownerKey}`; const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', u]] : process.platform === 'darwin' ? ['open', [u]] : ['xdg-open', [u]]; import('node:child_process').then((cp) => { try { const c = cp.spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }); c.on('error', () => console.log('[home] could not open a browser: open ' + u + ' yourself')); c.unref() } catch (e) {} }) }
  })
}
export { cfg, door, rooms, worlds, openWorld, closeWorld, startSession, endSession, live }
