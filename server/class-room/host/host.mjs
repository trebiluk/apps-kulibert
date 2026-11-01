// Bertopia local host (part 1): the class-room server on a home PC, for non-school use.
//   node --import ./host/register.mjs host/host.mjs [--port 8790] [--data ./topia-data] [--lan]
// The same src/worker.js, src/room.js and src/world-do.js as the school server, with host/runtime.mjs standing in for
// Cloudflare. Worlds are SQLite files under --data. The host picks nicknames and makes join tickets itself (no
// TechWorks). The menu at http://localhost:<port>/ is for the host only; players use /play?code=... on the LAN.
// No names, emails or IPs are stored: a player is a nickname, an opaque ref and a join code.
import http from 'node:http'
import os from 'node:os'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import './runtime.mjs'
import { acceptKey, roomCtx, worldCtx, rpc } from './runtime.mjs'
import worker, { Room, World } from '../src/worker.js'
import { signToken } from '../src/token.js'
import { CONFIG_IDS, cleanAlias } from '../src/protocol.js'
import { HISTORY_MS } from '../src/editlog.js'

const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const flag = (k) => argv.includes('--' + k)
export const PORT = Number(arg('port', 8790))
const DATA = path.resolve(arg('data', 'topia-data'))
const LAN = flag('lan')
const HERE = path.dirname(fileURLToPath(import.meta.url))
fs.mkdirSync(path.join(DATA, 'worlds'), { recursive: true })
fs.mkdirSync(path.join(DATA, 'backups'), { recursive: true })

// ---------------------------------------------------------------- host settings (nicknames, join codes; no PII)
const SETTINGS = path.join(DATA, 'host.json')
function loadSettings() {
  try { return JSON.parse(fs.readFileSync(SETTINGS, 'utf8')) } catch (e) { return null }
}
const settings = loadSettings() || { secret: randomBytes(24).toString('hex'), hostKey: randomBytes(12).toString('hex'), players: [], cfg: 'contest', world: null, locked: false }
const saveSettings = () => fs.writeFileSync(SETTINGS, JSON.stringify(settings, null, 2))
if (!loadSettings()) saveSettings()
const env = { ROOM_JOIN_SECRET: settings.secret, ALLOWED_ORIGINS: '', REQUIRE_TLS: '0' }

// ---------------------------------------------------------------- Durable Objects, in process
const rooms = new Map()      // name -> Room
const worlds = new Map()     // name -> { obj, ctx }
const worldFile = (name) => path.join(DATA, 'worlds', name.replace(/[^A-Za-z0-9_-]/g, '_') + '.sqlite')
function roomOf(name) {
  if (!rooms.has(name)) {
    const ctx = roomCtx()
    const r = new Room(ctx, env)
    r.ctx = ctx
    const accept = ctx.acceptWebSocket
    ctx.acceptWebSocket = (ws) => { ws.room = r; accept(ws) }     // so the upgrade handler knows which Room owns a socket
    rooms.set(name, r)
  }
  return rooms.get(name)
}
function worldOf(name) {
  if (!worlds.has(name)) {
    if (settings.world !== name) throw new Error('world is closed')   // a late RPC from a dropped room must not reopen it

    const ctx = worldCtx(worldFile(name), () => worlds.get(name).obj.alarm())
    worlds.set(name, { obj: new World(ctx, env), ctx })
  }
  return worlds.get(name).obj
}
env.ROOMS = { idFromName: (n) => n, get: (n) => rpc(() => roomOf(n)) }
env.WORLDS = { idFromName: (n) => n, get: (n) => rpc(() => worldOf(n)) }

// ---------------------------------------------------------------- players and tickets
const opened = new Set()   // worlds a host-role player has joined since this process started (mirrors the hub's open flag)
const findPlayer = (code) => settings.players.find((p) => p.code === code)
const roleOk = (r) => r === 'kid' || r === 'teacher'
export function addPlayer(nick, role = 'kid') {
  const alias = cleanAlias(String(nick || '').trim())
  if (!alias) return { error: 'nickname' }
  if (settings.players.some((p) => p.alias.toLowerCase() === alias.toLowerCase())) return { error: 'taken' }
  const p = { alias, role: roleOk(role) ? role : 'kid', ref: 'homeref-' + randomBytes(8).toString('hex'), code: randomBytes(3).toString('hex').toUpperCase(), since: Date.now() }
  settings.players.push(p); saveSettings()
  return p
}
export function removePlayer(code) { const n = settings.players.length; settings.players = settings.players.filter((p) => p.code !== code); saveSettings(); return settings.players.length < n }
async function ticketFor(p) {
  if (!settings.world) return null
  return signToken({ v: 1, ref: p.ref, world: settings.world, alias: p.alias, exp: Math.floor(Date.now() / 1000) + 100, jti: 'home-' + randomBytes(8).toString('hex'),
    role: p.role, cfg: settings.cfg, ...(p.role === 'teacher' ? { amr: ['passkey'] } : {}) }, settings.secret)
}

// ---------------------------------------------------------------- worlds on disk
const listWorlds = () => fs.readdirSync(path.join(DATA, 'worlds')).filter((f) => f.endsWith('.sqlite')).map((f) => { const st = fs.statSync(path.join(DATA, 'worlds', f)); return { name: f.replace(/\.sqlite$/, ''), bytes: st.size, changed: st.mtimeMs, open: settings.world === f.replace(/\.sqlite$/, '') } })
function closeWorld({ forget = true } = {}) {
  if (!settings.world) return
  const name = settings.world
  settings.world = null              // first: a dropped room's late left()/unlink() RPC must not recreate the World
  const w = worlds.get(name)
  if (w) {
    for (const r of rooms.values()) { try { w.obj.hub.unlink(r.rid) } catch (e) {} }
    if (w.obj.timer) { clearInterval(w.obj.timer); w.obj.timer = null }   // the fan-out clock: Cloudflare evicts it, here it must be stopped
    try { w.obj.hub.flush() } catch (e) { console.error('[host] final save failed', e.message) }
    worlds.delete(name)
    try { w.ctx.close() } catch (e) { console.error('[host] close failed', e.message) }
  }
  for (const r of rooms.values()) for (const p of [...r.players.values()]) r.drop(p.id, 4006, 'world closed')
  rooms.clear(); opened.clear()
  if (forget) saveSettings()
}
function openWorld(name) {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(name)) return { error: 'name' }   // a world id rides in the join ticket: 8-64 chars (protocol.js)
  closeWorld()
  settings.world = name; saveSettings()
  worldOf(name)
  return { ok: true, name }
}
function backupWorld(name) {
  const w = worlds.get(name); if (w) w.obj.hub.flush()
  const src = worldFile(name); if (!fs.existsSync(src)) return { error: 'missing' }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const dst = path.join(DATA, 'backups', name + '-' + stamp + '.sqlite')
  if (w) w.ctx.db.exec(`VACUUM INTO '${dst.replace(/'/g, "''")}'`); else fs.copyFileSync(src, dst)
  return { ok: true, file: path.basename(dst) }
}
function restoreWorld(file) {
  const src = path.join(DATA, 'backups', path.basename(file)); if (!fs.existsSync(src)) return { error: 'missing' }
  const name = path.basename(file).replace(/-\d{4}-\d{2}-\d{2}T.*$/, '')
  const was = settings.world === name
  if (was) closeWorld()
  backupWorld(name)   // keep what is there now
  fs.copyFileSync(src, worldFile(name)); for (const ext of ['-wal', '-shm']) { try { fs.unlinkSync(worldFile(name) + ext) } catch (e) {} }
  if (was) openWorld(name)
  return { ok: true, name }
}

// ---------------------------------------------------------------- live view
function live() {
  const w = settings.world ? worlds.get(settings.world) : null
  const out = { world: settings.world, locked: settings.locked, rooms: [], head: w ? w.obj.hub.world.head() : 0, recent: [] }
  for (const [name, r] of rooms) out.rooms.push({ name, players: [...r.players.values()].map((p) => ({ alias: p.alias, role: p.role, id: p.id })) })
  if (w) {
    const h = w.obj.hub
    const ops = h.world.since(Math.max(0, h.world.head() - 30), 30).ops || []
    const who = new Map(settings.players.map((p) => [h.who(p.ref), p.alias]))
    out.recent = ops.map((o) => ({ s: o.s, who: who.get(o.w) || (o.w ? 'someone' : 'server'), x: o.x, y: o.y, z: o.z, b: o.b, i: o.i, t: o.t })).reverse()
  }
  return out
}
function builtBy(x, y, z) {
  const w = settings.world ? worlds.get(settings.world) : null
  if (!w) return []
  w.obj.hub.flush()
  const who = new Map(settings.players.map((p) => [w.obj.hub.who(p.ref), p.alias]))
  // newest first from the 7-day ops log (same rule as the school server's who-built-this, #113)
  const rows = w.ctx.storage.sql.exec('SELECT w,b,i,t FROM ops WHERE x=? AND y=? AND z=? AND t>=? AND b<>i ORDER BY s DESC LIMIT 10', x, y, z, Date.now() - HISTORY_MS).toArray()
  return rows.map((o) => ({ who: o.w ? who.get(o.w) || 'someone' : 'server', action: o.i === 0 ? 'broke' : o.b === 0 ? 'placed' : 'replaced', block: o.i === 0 ? o.b : o.i, t: o.t }))
}

// ---------------------------------------------------------------- HTTP
const lanAddrs = () => Object.values(os.networkInterfaces()).flat().filter((i) => i && i.family === 'IPv4' && !i.internal).map((i) => i.address)
const isLocal = (req) => { const a = req.socket.remoteAddress || ''; return a === '127.0.0.1' || a === '::1' || a === '::ffff:127.0.0.1' }
const json = (res, status, body) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)) }
const text = (res, status, body) => { res.writeHead(status, { 'content-type': 'text/plain', 'cache-control': 'no-store' }); res.end(body) }
const file = (res, name, type) => { res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' }); res.end(fs.readFileSync(path.join(HERE, name))) }
const readBody = (req) => new Promise((r) => { let b = ''; req.on('data', (d) => { b += d; if (b.length > 1e5) req.destroy() }); req.on('end', () => { try { r(JSON.parse(b || '{}')) } catch (e) { r({}) } }) })
const hostOk = (req, url) => isLocal(req) && (req.headers['x-host-key'] === settings.hostKey || url.searchParams.get('k') === settings.hostKey)

export const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  if (url.pathname === '/') return isLocal(req) ? file(res, 'menu.html', 'text/html; charset=utf-8') : text(res, 403, 'host menu is for the host PC only')
  if (url.pathname === '/play') return file(res, 'play.html', 'text/html; charset=utf-8')
  if (url.pathname === '/rt/health') return text(res, 200, 'ok')
  // players: a join code -> a fresh ticket (any device on the LAN)
  if (url.pathname === '/join' && req.method === 'POST') {
    const b = await readBody(req)
    const p = findPlayer(String(b.code || '').toUpperCase())
    if (!p) return json(res, 403, { error: 'code' })
    if (!settings.world) return json(res, 503, { error: 'no world open' })
    if (settings.locked && p.role !== 'teacher') return json(res, 403, { error: 'locked' })
    // the world opens when a host-role player is in it (same rule as the school server); say so instead of a dead socket
    if (p.role === 'kid' && !opened.has(settings.world)) return json(res, 403, { error: 'no host' })
    return json(res, 200, { ticket: await ticketFor(p), alias: p.alias, role: p.role, ws: 'ws://' + req.headers.host + '/rt/ws', world: settings.world })
  }
  // host menu API: this PC only, with the host key
  if (url.pathname.startsWith('/host/')) {
    if (!hostOk(req, url)) return json(res, 403, { error: 'host only' })
    const b = req.method === 'POST' ? await readBody(req) : {}
    switch (url.pathname) {
      case '/host/state': return json(res, 200, { port: PORT, lan: LAN, addrs: LAN ? lanAddrs() : [], world: settings.world, cfg: settings.cfg, locked: settings.locked, players: settings.players.map(({ alias, role, code, since }) => ({ alias, role, code, since })), worlds: listWorlds(), backups: fs.readdirSync(path.join(DATA, 'backups')).sort().reverse(), live: live(), data: DATA })
      case '/host/world/open': return json(res, 200, openWorld(String(b.name || '')))
      case '/host/world/close': closeWorld(); return json(res, 200, { ok: true })
      case '/host/world/backup': return json(res, 200, backupWorld(String(b.name || settings.world || '')))
      case '/host/world/restore': return json(res, 200, restoreWorld(String(b.file || '')))
      case '/host/world/cfg': if (!CONFIG_IDS.includes(b.cfg)) return json(res, 400, { error: 'cfg' }); settings.cfg = b.cfg; saveSettings(); return json(res, 200, { ok: true })
      case '/host/lock': settings.locked = !!b.on; saveSettings(); for (const w of worlds.values()) w.obj.setLocked(settings.locked); return json(res, 200, { ok: true, locked: settings.locked })
      case '/host/player/add': return json(res, 200, addPlayer(b.nick, b.role))
      case '/host/player/remove': { const p = findPlayer(String(b.code || '')); if (p) for (const r of rooms.values()) { const id = r.byRef.get(p.ref); if (id) r.drop(id, 4006, 'kicked') } return json(res, 200, { ok: removePlayer(String(b.code || '')) }) }
      case '/host/player/kick': { const p = findPlayer(String(b.code || '')); let n = 0; if (p) for (const r of rooms.values()) { const id = r.byRef.get(p.ref); if (id) { r.drop(id, 4006, 'kicked'); n++ } } return json(res, 200, { ok: true, kicked: n }) }
      case '/host/built': return json(res, 200, { entries: builtBy(Number(b.x), Number(b.y), Number(b.z)) })
      case '/host/stop': json(res, 200, { ok: true }); setTimeout(() => shutdown(), 100); return
      default: return json(res, 404, { error: 'no' })
    }
  }
  text(res, 404, 'not found')
})

// WebSocket upgrades go through the real Worker (ticket, config, room) and then the real Room.
server.on('upgrade', async (req, tcp, head) => {
  const url = new URL(req.url, 'http://' + req.headers.host)
  if (url.pathname !== '/rt/ws') { tcp.destroy(); return }
  const h = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (typeof v === 'string') h.set(k, v)
  h.set('Upgrade', 'websocket')
  h.set('Origin', 'http://' + req.headers.host)                         // same-origin: the ticket is the real check
  h.set('CF-Connecting-IP', req.socket.remoteAddress || 'local')
  env.ALLOWED_ORIGINS = 'http://' + req.headers.host
  let out
  try { out = await worker.fetch(new Request('http://' + req.headers.host + req.url, { headers: h }), env) } catch (e) { console.error('[host] join failed', e); tcp.destroy(); return }
  if (!out || out.status !== 101) {
    const body = out ? await out.text() : 'error'
    tcp.write(`HTTP/1.1 ${out ? out.status : 500} ${body}\r\nContent-Type: text/plain\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`)
    tcp.destroy(); return
  }
  const ws = out.webSocket.server
  const room = ws.room || null
  if (settings.world && ws.attachment && ws.attachment.role && ws.attachment.role !== 'kid') opened.add(settings.world)            // null for a "full" socket: the Room already closed it
  tcp.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + acceptKey(req.headers['sec-websocket-key']) + '\r\nSec-WebSocket-Protocol: bt-room.v0\r\n\r\n')
  ws.attach(tcp, head, {
    onText: (t) => { if (room) room.webSocketMessage(ws, t).catch(() => {}) },
    onEnd: (code) => { if (room) room.webSocketClose(ws, code).catch(() => {}) },
  })
})

function shutdown() {
  console.log('[host] stopping')
  try { closeWorld({ forget: false }) } catch (e) {}     // host.json still names it: it comes back on the next start
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 1500)
}
process.on('SIGINT', shutdown); process.on('SIGTERM', shutdown)

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  server.listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
    console.log(`[host] Bertopia local host on http://localhost:${PORT}/?k=${settings.hostKey}   (menu, this PC only)`)
    if (LAN) console.log('[host] players on this Wi-Fi join at ' + lanAddrs().map((a) => `http://${a}:${PORT}/play`).join('  or  '))
    else console.log('[host] run with --lan to let other devices on this Wi-Fi join')
    console.log('[host] data: ' + DATA)
    if (settings.world) { const name = settings.world; settings.world = null; openWorld(name); console.log('[host] reopened world ' + name) }
    if (flag('open')) {   // --open: show the menu in the default browser (Windows / macOS / Linux)
      const u = `http://localhost:${PORT}/?k=${settings.hostKey}`
      const cmd = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', u]] : process.platform === 'darwin' ? ['open', [u]] : ['xdg-open', [u]]
      import('node:child_process').then((cp) => { try { cp.spawn(cmd[0], cmd[1], { detached: true, stdio: 'ignore' }).unref() } catch (e) {} })
    }
  })
}
export { settings, rooms, worlds, env, openWorld, closeWorld, backupWorld, restoreWorld, live }
