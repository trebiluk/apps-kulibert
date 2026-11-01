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
import { PROTOCOL } from '../src/protocol.js'
import { makeDoor, registerHome, hashPin, checkPin, validPin, RULESETS, DEFAULT_MAX_PLAYERS } from './door.mjs'
import { nameOk } from './words.mjs'
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
  res.writeHead(200, { 'content-type': MIME[ext] || 'application/octet-stream', 'cache-control': ext === '.html' ? 'no-store' : 'max-age=300' })
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
  port: 8890, listen: '127.0.0.1', origins: [], maxPlayers: DEFAULT_MAX_PLAYERS,
  world: null, ruleset: 'home-survival', usedCodes: [],
}, loadCfg() || {})
if (flag('lan')) cfg.listen = '0.0.0.0'
cfg.port = Number(arg('port', cfg.port))
if (FORBIDDEN_PORTS.includes(cfg.port)) { console.error('[home] port ' + cfg.port + ' is used by the game checks or wrangler; pick another'); process.exit(2) }
const saveCfg = () => fs.writeFileSync(CFG_FILE, JSON.stringify(cfg, null, 2))
saveCfg()
registerHome()
const env = { ROOM_JOIN_SECRET: cfg.secret, ALLOWED_ORIGINS: '', REQUIRE_TLS: '0' }
const door = makeDoor({ secret: cfg.secret, filter: nameOk, maxPlayers: cfg.maxPlayers })

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
  rooms.clear()
  if (forget) saveCfg()
}
function openWorld(name) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name)) return { error: 'name' }
  closeWorld(); cfg.world = name; saveCfg(); worldOf(name)
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

// ---------------------------------------------------------------- session (the door) + owner tools
let lastCode = null                  // shown on the owner page until the owner dismisses it; never written to disk
let ownerSeated = false              // an owner socket has been accepted this session (mirrors the hub's open flag)
function startSession({ ruleset, password }) {
  if (!cfg.world) return { error: 'no world' }
  if (ruleset && RULESETS.includes(ruleset)) cfg.ruleset = ruleset
  const r = door.start({ world: cfg.world, cfg: cfg.ruleset, password: password || null })
  lastCode = r.code
  saveCfg()
  return { ok: true, code: r.code, session: r.session }
}
function endSession() {
  door.end(); lastCode = null; ownerSeated = false
  for (const { room, p } of players()) room.drop(p.id, 4006, 'session ended')
}
function rotateCode() { const r = door.rotate(); if (!r) return { error: 'ended' }; lastCode = r.code; return { ok: true, code: r.code } }
const findPlayer = (ref) => players().find(({ p }) => p.ref === ref)
function kick(ref) { const f = findPlayer(ref); if (!f) return { error: 'offline' }; f.room.drop(f.p.id, 4006, 'kicked'); return { ok: true } }
function ban(ref) { const f = findPlayer(ref); door.ban(ref, f ? f.p.alias : door.nameOf(ref) || '', f ? f.p.ip : ''); if (f) f.room.drop(f.p.id, 4006, 'banned'); return { ok: true } }
function freeze(on) { for (const r of rooms.values()) { r.frozen = !!on; r.broadcast({ t: 'frz', on: on ? 1 : 0 }) } return { ok: true, frozen: !!on } }
// Mute: a per-player flag the Room reads once quick chat is wired (part 4; essentials.js is standalone today). Until then it only shows on the owner page.
function mute(ref, on) { let n = 0; for (const { p } of players()) if (ref === '*' || p.ref === ref) { p.muted = !!on; n++ } return { ok: true, n } }
// Rollback: undo every edit of the last N minutes (optionally by one player), through the world so it is numbered, saved and fanned out.
function rollback(minutes, ref) {
  const w = cfg.world && worlds.get(cfg.world); if (!w) return { error: 'no world' }
  const hub = w.obj.hub
  const until = Date.now(), since = until - Math.max(1, Math.min(7 * 24 * 60, Number(minutes) || 5)) * 60 * 1000
  const sel = { since, until, ...(ref ? { who: hub.who(ref) } : {}) }
  const plan = undoPlan(hub.world.log(), sel)
  const res = applyUndo(hub.world, plan)
  return { ok: true, cells: plan.length, applied: res.filter((r) => r.ok).length }
}
function live() {
  const w = cfg.world ? worlds.get(cfg.world) : null
  const out = { world: cfg.world, session: door.info(), ruleset: cfg.ruleset, players: [], head: w ? w.obj.hub.world.head() : 0, recent: [], bans: door.bans, frozen: [...rooms.values()].some((r) => r.frozen) }
  for (const { room, p } of players()) out.players.push({ ref: p.ref, name: p.alias, role: p.role === 'kid' ? 'player' : 'owner', room: room.rid, muted: !!p.muted })
  if (w) {
    const h = w.obj.hub
    const who = new Map(out.players.map((p) => [h.who(p.ref), p.name]))
    out.recent = (h.world.since(Math.max(0, h.world.head() - 30), 30).ops || []).map((o) => ({ s: o.s, who: o.w ? who.get(o.w) || 'someone' : 'server', x: o.x, y: o.y, z: o.z, b: o.b, i: o.i, t: o.t })).reverse()
  }
  return out
}

// ---------------------------------------------------------------- HTTP
const lanAddrs = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address)
const rawIp = (req) => (req.socket.remoteAddress || '').replace(/^::ffff:/, '')
// A loopback connection may carry X-Forwarded-For (a local TLS proxy per the README, or a check); anything else is its real address.
const ipOf = (req) => { const r = rawIp(req); const f = r === '127.0.0.1' || r === '::1' ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : ''; return f || r }
const isLocal = (req) => ['127.0.0.1', '::1'].includes(rawIp(req))
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
const text = (res, status, body) => { res.writeHead(status, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end(body) }
const page = (res, name) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' }); res.end(fs.readFileSync(path.join(HERE, name))) }
const readBody = (req) => new Promise((r) => { let b = ''; req.on('data', (d) => { b += d; if (b.length > 1e5) req.destroy() }); req.on('end', () => { try { r(JSON.parse(b || '{}')) } catch (e) { r({}) } }) })
const ownerTokens = new Map()         // token -> expiry; issued after a PIN check, per owner browser session
const ownerOk = (req) => { const tkn = req.headers['x-owner']; const exp = tkn && ownerTokens.get(tkn); return isLocal(req) && !!exp && exp > Date.now() }
const originOk = (req) => { const o = req.headers.origin; if (!o) return true; const mine = ['http://localhost:' + cfg.port, 'http://127.0.0.1:' + cfg.port, ...lanAddrs().map((a) => 'http://' + a + ':' + cfg.port), ...cfg.origins]; return mine.includes(o) }

export const server = http.createServer(async (req, res) => {
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
    const b = await readBody(req)
    const r = await door.join({ code: b.code, name: b.name, password: b.password, adults: b.adults === true, ip: ipOf(req), playersOnline: online() })
    // the hub opens a world when a staff seat (here: the owner) is in it; say so instead of handing out a ticket that dies at the door
    if (!r.error && !ownerSeated) return json(res, 403, { error: 'no-owner' })
    if (r.error) return json(res, r.error === 'slow-down' ? 429 : r.error === 'full' ? 503 : 403, { error: r.error, ...(r.wait ? { wait: r.wait } : {}) })
    return json(res, 200, { ticket: r.ticket, name: r.name, world: r.world, ruleset: r.ruleset, ws: 'ws://' + req.headers.host + '/rt/ws', version: PKG.gameVersion || PKG.version })
  }
  // owner API: host PC only. /owner/pin exchanges the PIN (and the URL key) for a short token; the rest need the token.
  if (url.pathname.startsWith('/owner/')) {
    if (!isLocal(req)) return json(res, 403, { error: 'host only' })
    const b = req.method === 'POST' ? await readBody(req) : {}
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
      case '/owner/state': return json(res, 200, { version: PKG.version, port: cfg.port, listen: cfg.listen, lan: cfg.listen !== '127.0.0.1', addrs: cfg.listen === '127.0.0.1' ? [] : lanAddrs(), maxPlayers: cfg.maxPlayers, rulesets: RULESETS, world: cfg.world, worlds: listWorlds(), backups: fs.readdirSync(path.join(DATA, 'backups')).sort().reverse(), code: lastCode, live: live(), data: DATA })
      case '/owner/session/start': return json(res, 200, startSession(b))
      case '/owner/session/end': endSession(); return json(res, 200, { ok: true })
      case '/owner/session/rotate': return json(res, 200, rotateCode())
      case '/owner/session/code/hide': lastCode = null; return json(res, 200, { ok: true })
      case '/owner/session/password': door.setPassword(b.password); return json(res, 200, { ok: true, password: !!b.password })
      case '/owner/ruleset': if (!RULESETS.includes(b.ruleset)) return json(res, 400, { error: 'ruleset' }); cfg.ruleset = b.ruleset; door.setCfg(b.ruleset); saveCfg(); return json(res, 200, { ok: true, ruleset: cfg.ruleset })   // part 3 makes this live mid-session
      case '/owner/play': { const t = await door.ownerTicket(String(b.name || 'Owner').slice(0, 20)); return t ? json(res, 200, { ticket: t, ws: 'ws://localhost:' + cfg.port + '/rt/ws' }) : json(res, 400, { error: 'no session' }) }
      case '/owner/world/open': return json(res, 200, openWorld(String(b.name || '')))
      case '/owner/world/close': endSession(); closeWorld(); return json(res, 200, { ok: true })
      case '/owner/world/backup': return json(res, 200, backupWorld(String(b.name || cfg.world || '')))
      case '/owner/world/restore': return json(res, 200, restoreWorld(String(b.file || '')))
      case '/owner/kick': return json(res, 200, kick(String(b.ref || '')))
      case '/owner/ban': return json(res, 200, ban(String(b.ref || '')))
      case '/owner/unban': door.unban(String(b.ref || '')); return json(res, 200, { ok: true })
      case '/owner/freeze': return json(res, 200, freeze(!!b.on))
      case '/owner/mute': return json(res, 200, mute(String(b.ref || '*'), !!b.on))
      case '/owner/rollback': return json(res, 200, rollback(b.minutes, b.ref ? String(b.ref) : null))
      case '/owner/lan': cfg.listen = b.on ? '0.0.0.0' : '127.0.0.1'; saveCfg(); return json(res, 200, { ok: true, restart: true })
      case '/owner/stop': json(res, 200, { ok: true }); setTimeout(shutdown, 100); return
      default: return json(res, 404, { error: 'no' })
    }
  }
  text(res, 404, 'not found')
})

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
  tcp.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(req.headers['sec-websocket-key']) + '\r\nSec-WebSocket-Protocol: ' + PROTOCOL + '\r\n\r\n')
  ws.attach(tcp, head, {
    onText: (t) => { door.noteActivity(); if (room) room.webSocketMessage(ws, t).catch(() => {}) },
    onEnd: (code) => { door.connClose(ip); if (room) room.webSocketClose(ws, code).catch(() => {}) },
  })
})

setInterval(() => { if (door.sweep(online())) console.log('[home] session ended: 24 h with nobody in') }, 60 * 1000).unref()

function shutdown() {
  console.log('[home] stopping')
  try { endSession(); closeWorld({ forget: false }) } catch (e) {}
  server.close(() => process.exit(0)); setTimeout(() => process.exit(0), 1500)
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(cfg.port, cfg.listen, () => {
    console.log(`[home] Bertopia personal host (adults 18+)  owner page: http://localhost:${cfg.port}/owner?k=${cfg.ownerKey}`)
    console.log(cfg.listen === '127.0.0.1' ? '[home] this PC only (owner page: "Let other computers join" for the LAN)' : '[home] players on this network join at ' + lanAddrs().map((a) => `http://${a}:${cfg.port}/`).join('  or  '))
    console.log('[home] data: ' + DATA + (GAME ? ' | game: ' + GAME : ' | no game build yet: run `npm run build:home` in bloxbert-src; / shows the plain join page'))
    if (cfg.world) { const n = cfg.world; cfg.world = null; openWorld(n); console.log('[home] reopened world ' + n + ' (start a session to let people in)') }
    if (flag('open')) { const u = `http://localhost:${cfg.port}/owner?k=${cfg.ownerKey}`; const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', u]] : process.platform === 'darwin' ? ['open', [u]] : ['xdg-open', [u]]; import('node:child_process').then((cp) => { try { cp.spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref() } catch (e) {} }) }
  })
}
export { cfg, door, rooms, worlds, openWorld, closeWorld, startSession, endSession, live }
