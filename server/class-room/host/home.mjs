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
import { makeDoor, registerHome, hashPin, checkPin, validPin, RULESETS, DEFAULT_MAX_PLAYERS } from './door.mjs'
import { makeRuleset, PRESETS } from './rules.mjs'
import { cleanChat, makeChatGate } from './chat.mjs'
import { makeEvents } from './events.mjs'
import { makeCommands } from './commands.mjs'
import { checkPlugin, makeRunner, EXAMPLES, LIMITS as PLUGIN_LIMITS } from '../src/plugins.js'
import { DatabaseSync } from 'node:sqlite'
import { HISTORY_MS } from '../src/editlog.js'
import { undoPlan, applyUndo } from '../src/world/undo.js'

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
}, loadCfg() || {})
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
    if (cfg.world !== name) throw new Error('world is closed')
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
const listWorlds = () => fs.readdirSync(path.join(DATA, 'worlds')).filter((f) => f.endsWith('.sqlite')).map((f) => { const st = fs.statSync(path.join(DATA, 'worlds', f)); const name = f.replace(/\.sqlite$/, ''); return { name, bytes: st.size, changed: st.mtimeMs, open: cfg.world === name } })
function closeWorld({ forget = true } = {}) {
  if (!cfg.world) return
  const name = cfg.world; cfg.world = null
  const w = worlds.get(name)
  if (w) {
    for (const r of rooms.values()) { try { w.obj.hub.unlink(r.rid) } catch (e) {} }
    if (w.obj.timer) { clearInterval(w.obj.timer); w.obj.timer = null }
    try { w.obj.hub.flush() } catch (e) { console.error('[home] final save failed', e.message) }
    worlds.delete(name)
    try { w.ctx.close() } catch (e) { console.error('[home] close failed', e.message) }
  }
  for (const { room, p } of players()) room.drop(p.id, 4006, 'world closed')
  rooms.clear(); pluginList = []; runner.load([])
  if (forget) saveCfg()
}
function openWorld(name) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name)) return { error: 'name' }
  closeWorld(); cfg.world = name; saveCfg(); worldOf(name); loadPlugins()
  return { ok: true, name }
}
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
  const was = cfg.world === name
  if (was) { endSession(); closeWorld() }
  backupWorld(name)
  fs.copyFileSync(src, worldFile(name)); for (const ext of ['-wal', '-shm']) { try { fs.unlinkSync(worldFile(name) + ext) } catch (e) {} }
  if (was) openWorld(name)
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
const CMD_WHY = { role: 'Only the owner can do that.', cooldown: 'Wait a few seconds.', 'no-home': 'No home set yet: /sethome where you stand.', 'no-such-player': 'No player by that name.', 'no-such-warp': 'No warp by that name (/warps lists them).', 'warp-name': 'Warp names: letters, digits, - or _ (up to 20).', unknown: 'Unknown command. /help lists them.', who: 'Who? Add a player name.', what: 'Say what? Add the text.', pos: 'Stand somewhere first.', 'not-here': 'You cannot set a home here.' }
function runCommand(room, ws, p, cmd, text) {
  const me = { id: p.id, ref: p.ref, staff: p.role !== 'kid', pos: p.pos }
  const r = commands.run(me, cmd, text)
  const tell = (o) => { try { ws.send(JSON.stringify(o)) } catch (e) {} }
  if (r.error) { tell({ t: 'cmdno', c: cmd.c, why: CMD_WHY[r.error] || r.error }); return }
  for (const f of r.fx) {
    if (f.k === 'tp') { const t = players().find(({ p: q }) => q.id === f.id); if (t) { try { t.p.ws.send(JSON.stringify({ t: 'tp', x: f.pos.x, y: f.pos.y, z: f.pos.z, by: p.alias })) } catch (e) {} ; if (t.p.id !== p.id) tell({ t: 'cmdok', c: cmd.c, msg: t.p.alias + ' is on the way.' }); else tell({ t: 'cmdok', c: cmd.c }) } }
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
  if (r.local === 'warps') return tell({ t: 'cmdok', c: 'warps', msg: commands.warpList().length ? 'Warps: ' + commands.warpList().join(', ') : 'No warps yet: /setwarp <name> where you stand.' })
  if (r.local === 'setwarp') { const x = commands.setWarp(r.name, p.pos); if (x.error) return tell({ t: 'cmdno', c: 'setwarp', why: CMD_WHY[x.error] }); broadcastRules(); return tell({ t: 'cmdok', c: 'setwarp', msg: 'Warp "' + r.name + '" set.' }) }
  if (r.local === 'delwarp') { const x = commands.delWarp(r.name); if (x.error) return tell({ t: 'cmdno', c: 'delwarp', why: CMD_WHY[x.error] }); broadcastRules(); return tell({ t: 'cmdok', c: 'delwarp', msg: 'Warp "' + r.name + '" removed.' }) }
  runCommand(room, ws, p, r.cmd, r.text)
}
const events = makeEvents()           // shared boss fight news
// The whole map for a joining game (home only; the school path asks chunk by chunk). Every changed cell of the open
// world plus the seq it is good up to; live ops after that seq come through the normal fan-out. One per player / 5 s.
const ALL_BATCH = 4000, ALL_GAP_MS = 5000
const allAsked = new Map()   // ref -> last time
function worldCells() {
  const w = cfg.world && worlds.get(cfg.world); if (!w) return null
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
  const wc = worldCells(); if (!wc) return
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
  return { ok: true, plugin: clean }
}
function togglePlugin(id, on) { const p = pluginList.find((x) => x.id === id); if (!p) return { error: 'no such plugin' }; p.on = !!on; savePlugins(); feed('plugin ' + (on ? 'on' : 'off') + ': ' + p.name); return { ok: true } }
function dropPlugin(id) { const i = pluginList.findIndex((x) => x.id === id); if (i < 0) return { error: 'no such plugin' }; feed('plugin removed: ' + pluginList[i].name); pluginList.splice(i, 1); savePlugins(); return { ok: true } }
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
    else if (a.a === 'undo' && who && Number.isFinite(ev.x)) { const w = cfg.world && worlds.get(cfg.world); if (w) { const cur = w.obj.hub.world.cell(ev.x, ev.y, ev.z); if (cur !== undefined && cur !== ev.before) w.obj.hub.world.apply([{ x: ev.x, y: ev.y, z: ev.z, id: ev.before, b: cur }], null) } }
    else if (a.a === 'set') { const w = cfg.world && worlds.get(cfg.world); if (w) { const cur = w.obj.hub.world.cell(a.x, a.y, a.z); if (cur !== undefined && cur !== a.id) w.obj.hub.world.apply([{ x: a.x, y: a.y, z: a.z, id: a.id, b: cur }], null) } }
  }
}
const evPlayer = (p) => ({ id: p.id, name: p.alias, owner: p.role !== 'kid' })
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
function rollback(minutes, ref) {
  const w = cfg.world && worlds.get(cfg.world); if (!w) return { error: 'no world' }
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
  return { t: 'rules', ...s, r: { ...s.r, 'survival.keep': own ? keepFor.get(ref) : s.r['survival.keep'] }, keep: own ? 'player' : 'world', menu: commands.menuFor(staff), warps: commands.warpList() }
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
  if (m.t === 'b') { const why = rules.editWhy(m, staff); if (why) { no(why, { x: m.x, y: m.y, z: m.z }); return true } if (pluginEvent({ e: m.id === 0 ? 'break' : 'place', player: evPlayer(p), x: m.x, y: m.y, z: m.z, block: m.id === 0 ? m.b : m.id, before: m.b })) { no('plugin', { x: m.x, y: m.y, z: m.z }); return true } tallyEdit(p.alias, m.id !== 0); return false }
  if (m.t === 'p') {
    const why = rules.flyWhy(m, staff); if (why) { no(why); return true }
    // Home positions are trusted within the world's bounds (adults the owner let in): creative flying, respawns and
    // teleports would trip the school's speed check, which kicks after 5 strikes. Sequence must still go up.
    if (room.frozen && !staff && p.pos) return false                       // a freeze still snaps back (Room)
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
  if (m.t === 'cmd') { if (m.c === 'setwarp' || m.c === 'delwarp') typedCommand(room, ws, p, '/' + m.c + ' ' + String(m.name || '')); else if (m.c === 'announce') typedCommand(room, ws, p, '/announce ' + String(m.text || '')); else runCommand(room, ws, p, { c: String(m.c), ...(m.id !== undefined ? { id: m.id } : {}), ...(m.i !== undefined ? { i: m.i } : {}), ...(m.on !== undefined ? { on: m.on } : {}) }); return true }
  if (m.t === 'chat' && typeof m.m === 'string' && m.m.trim().startsWith('/')) { typedCommand(room, ws, p, m.m); return true }
  if (m.t === 'chat') {
    const off = rules.chatWhy(m, staff); if (off) { no(off); return true }
    if (p.muted) { no('chat-muted'); return true }
    const c = cleanChat(m.m); if (c.error) { no(c.error); return true }
    const slow = chatGate.check(p.ref); if (slow) { no('chat-slow', slow); return true }
    if (pluginEvent({ e: 'chat', player: evPlayer(p), text: c.m })) { no('plugin'); return true }
    broadcastAll({ t: 'chat', a: p.alias, m: c.m, at: Date.now() })
    if (SHOW_CHAT) feed(p.alias + ': ' + c.m)
    return true
  }
  // shared events (home-only): a boss fight started, moved on or ended somewhere in the world
  if (m.t === 'ev') {
    const r = events.handle({ ref: p.ref, alias: p.alias, staff }, m)
    if (r.error) no(r.error); else if (r.relay) { broadcastAll(r.relay); if (r.relay.a === 'start') feed(p.alias + ' started a boss fight'); else if (r.relay.a === 'end') feed('the boss fight ended' + (r.relay.won ? ': won' : '')) }
    return true
  }
  return false
}
function live() {
  const w = cfg.world ? worlds.get(cfg.world) : null
  const out = { world: cfg.world, session: door.info(), ruleset: cfg.ruleset, players: [], head: w ? w.obj.hub.world.head() : 0, recent: [], bans: door.bans, frozen: [...rooms.values()].some((r) => r.frozen) }
  for (const { room, p } of players()) out.players.push({ ref: p.ref, name: p.alias, role: p.role === 'kid' ? 'player' : 'owner', room: room.rid, muted: !!p.muted, keep: keepFor.has(p.ref) ? keepFor.get(p.ref) : rules.get('survival.keep') !== false, keepOwn: keepFor.has(p.ref) })
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
const ownerOk = (req) => { const tkn = req.headers['x-owner']; const exp = tkn && ownerTokens.get(tkn); return isLocal(req) && !!exp && exp > Date.now() }
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
  if (url.pathname === '/owner') return isLocal(req) ? page(res, 'owner.html') : text(res, 403, 'the owner page is for the host PC only')
  if (url.pathname === '/rt/health') return text(res, 200, 'ok')
  if (url.pathname === '/version') return json(res, 200, { version: PKG.version, game: PKG.gameVersion || null })
  if (url.pathname === '/join' && req.method === 'POST') {
    const b = await readBody(req, res); if (!b) return
    const r = await door.join({ code: b.code, name: b.name, password: b.password, adults: b.adults === true, ip: ipOf(req), playersOnline: online() })
    // the hub opens a world when a staff seat (here: the owner) is in it; say so instead of handing out a ticket that dies at the door
    if (!r.error && !ownerSeated) return json(res, 403, { error: 'no-owner' })
    if (r.error) return json(res, r.error === 'slow-down' ? 429 : r.error === 'full' ? 503 : 403, { error: r.error, ...(r.wait ? { wait: r.wait } : {}) })
    return json(res, 200, { ticket: r.ticket, name: r.name, world: r.world, ruleset: r.ruleset, ws: wsBase(req) + '/rt/ws', version: PKG.gameVersion || PKG.version })
  }
  // owner API: host PC only. /owner/pin exchanges the PIN (and the URL key) for a short token; the rest need the token.
  if (url.pathname.startsWith('/owner/')) {
    if (!isLocal(req)) return json(res, 403, { error: 'host only' })
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
      case '/owner/state': return json(res, 200, { version: PKG.version, tunnel: tunnelHost() ? 'https://' + tunnelHost() + '/' : null, game: PKG.gameVersion || null, gameBuilt: !!GAME, port: cfg.port, listen: cfg.listen, lan: cfg.listen !== '127.0.0.1', addrs: cfg.listen === '127.0.0.1' ? [] : lanAddrs(), maxPlayers: cfg.maxPlayers, rulesets: RULESETS, world: cfg.world, worlds: listWorlds(), backups: fs.readdirSync(path.join(DATA, 'backups')).sort().reverse(), code: lastCode, live: live(), data: DATA })
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
      case '/owner/plugin/on': return json(res, 200, togglePlugin(String(b.id || ''), !!b.on))
      case '/owner/plugin/drop': return json(res, 200, dropPlugin(String(b.id || '')))
      case '/owner/play': { const t = await door.ownerTicket(String(b.name || 'Owner').slice(0, 20)); return t ? json(res, 200, { ticket: t, ws: 'ws://localhost:' + cfg.port + '/rt/ws', world: cfg.world, name: String(b.name || 'Owner').slice(0, 20) }) : json(res, 400, { error: 'no session' }) }
      case '/owner/world/open': return json(res, 200, openWorld(String(b.name || '')))
      case '/owner/world/close': endSession(); closeWorld(); return json(res, 200, { ok: true })
      case '/owner/world/backup': return json(res, 200, backupWorld(String(b.name || cfg.world || '')))
      case '/owner/world/restore': return json(res, 200, restoreWorld(String(b.file || '')))
      case '/owner/kick': return json(res, 200, kick(String(b.ref || '')))
      case '/owner/ban': return json(res, 200, ban(String(b.ref || '')))
      case '/owner/unban': door.unban(String(b.ref || '')); return json(res, 200, { ok: true })
      case '/owner/freeze': return json(res, 200, freeze(!!b.on))
      case '/owner/mute': return json(res, 200, mute(String(b.ref || '*'), !!b.on))
      case '/owner/keep': { const r = setKeep(String(b.ref || ''), b.on === undefined ? null : b.on); return json(res, r.error ? 400 : 200, r) }
      case '/owner/rollback': return json(res, 200, rollback(b.minutes, b.ref ? String(b.ref) : null))
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
  if (!cfg.world || c.world !== cfg.world || !door.session || door.isBanned(c.ref)) return refuse(403, 'closed')
  const ip = ipOf(req)
  // the hub seats the player (room choice, open flag, build gate), then the Room checks everything again
  const a = worldOf(cfg.world).assign({ world: c.world, ref: c.ref, grp: null, role: c.role, bld: 's', cfg: c.cfg })
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
  feed(c.alias + (c.role !== 'kid' ? ' (owner)' : '') + ' joined · ' + players().length + ' in')
  sendRules(ws, c.ref)   // right after hello: the active ruleset, with this player's keep-inventory value
  { const ev = events.current(); if (ev) try { ws.send(JSON.stringify(ev)) } catch (e) {} }   // and a boss fight already going
  // plugins last: a 'join' greeting must land after the rules frame, which is what turns the player's chat on
  { const me = players().find(({ p }) => p.ws === ws); if (me) { if (me.p.role !== 'kid') try { ws.send(JSON.stringify({ t: 'plugins', list: pluginSummary() })) } catch (e) {}; pluginEvent({ e: 'join', player: evPlayer(me.p) }) } }
  tcp.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(req.headers['sec-websocket-key']) + '\r\nSec-WebSocket-Protocol: ' + PROTOCOL + '\r\n\r\n')
  ws.attach(tcp, head, {
    onText: (t) => { door.noteActivity(); if (!room) return; const p = [...room.players.values()].find((q) => q.ws === ws); if (p && homeFrame(room, ws, p, t)) return; room.webSocketMessage(ws, t).catch(() => {}) },
    onEnd: (code) => { door.connClose(ip); chatGate.forget(c.ref); allAsked.delete(c.ref); commands.forget(c.ref); feed(c.alias + ' left (' + code + ') · ' + Math.max(0, players().length - 1) + ' in'); { const me = players().find(({ p }) => p.ws === ws); if (me) pluginEvent({ e: 'leave', player: evPlayer(me.p) }) } const ev = events.leave(c.ref); if (room) room.webSocketClose(ws, code).catch(() => {}); if (ev) broadcastAll(ev) },
  })
})

setInterval(() => { for (const [k, exp] of ownerTokens) if (exp <= Date.now()) ownerTokens.delete(k); chatGate.sweep(); if (door.sweep(players().length)) console.log('[home] session ended: 24 h with nobody in') }, 60 * 1000).unref()

function shutdown() {
  console.log('[home] stopping')
  try { endSession(); closeWorld({ forget: false }) } catch (e) {}
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
    if (cfg.world) { const n = cfg.world; cfg.world = null; openWorld(n); console.log('[home] reopened world ' + n + ' (start a session to let people in)') }
    if (flag('open')) { const u = `http://localhost:${cfg.port}/owner?k=${cfg.ownerKey}`; const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', u]] : process.platform === 'darwin' ? ['open', [u]] : ['xdg-open', [u]]; import('node:child_process').then((cp) => { try { const c = cp.spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }); c.on('error', () => console.log('[home] could not open a browser: open ' + u + ' yourself')); c.unref() } catch (e) {} }) }
  })
}
export { cfg, door, rooms, worlds, openWorld, closeWorld, startSession, endSession, live }
