// Worker entry. One public endpoint: GET /rt/ws (WebSocket upgrade).
//
// Transport: WSS only. TLS is Cloudflare's; there is no custom crypto and no homemade
// encryption anywhere in this package. The Worker refuses a socket that did not arrive
// over https/wss (REQUIRE_TLS, on by default).
//
// The join ticket travels in the WebSocket subprotocol header, not in the URL, so it
// never lands in a URL log:   new WebSocket(url, ['bt-room.v0', ticket])
//
// The Worker checks the browser Origin and the signed ticket, then hands the socket to
// the Durable Object named by the ticket's room id. A kid cannot pick a room, create
// one, or invite anyone: the room, the role and the config all come from the signature.
//
// Fails closed: no secret configured means 503, never "let everyone in".

import { PROTOCOL } from './protocol.js'
import { verifyToken } from './token.js'
import { logFailure } from './guard.js'

export { Room } from './room.js'
export { World } from './world-do.js'
export { Control } from './control-do.js'
import { isControlTicket, parseAction, ACTIONS } from './control.js'
import { CONFIG_IDS } from './protocol.js'

function originAllowed(request, env) {
  const origin = request.headers.get('Origin')
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
  return !!origin && allowed.includes(origin)
}

function overTls(request, url) {
  if (url.protocol === 'https:' || url.protocol === 'wss:') return true
  try { return JSON.parse(request.headers.get('cf-visitor') || '{}').scheme === 'https' } catch (e) { return false }
}

// Sec-WebSocket-Protocol: "bt-room.v0, <ticket>"
function pickToken(header) {
  if (!header) return null
  const list = header.split(',').map((s) => s.trim()).filter(Boolean)
  if (!list.includes(PROTOCOL)) return null
  return list.find((s) => s !== PROTOCOL) || null
}

// A short one-way tag of the caller's IP, used only for in-memory rate limits inside the
// room. The IP itself is never forwarded, stored or logged.
async function ipTag(request, secret) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local'
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret + '|' + ip))
  return [...new Uint8Array(d).slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const text = (body, status) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } })
const corsFor = (request, env) => (originAllowed(request, env) ? { 'access-control-allow-origin': request.headers.get('Origin'), 'access-control-allow-methods': 'POST,OPTIONS', 'access-control-allow-headers': 'authorization,content-type', 'access-control-max-age': '600', vary: 'Origin' } : {})
const json = (request, env, status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...corsFor(request, env) } })

// Master Control (part 2): staff login and the control actions, JSON over POST from an allowed origin.
// /rt/staff/login {pass} -> a 5-minute admin control ticket (STAFF_PASS_HASH = sha256 hex of the staff password,
// a Worker secret). /rt/control/<action> with Authorization: Bearer <ticket>: state, open, chat, freeze, kick, rollback.
async function control(request, env, url) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsFor(request, env) })
  if (!originAllowed(request, env)) { logFailure(null, 'origin'); return text('forbidden', 403) }
  if (request.method !== 'POST') return text('post', 405)
  if (!env.ROOM_JOIN_SECRET || !env.CONTROL) return text('not configured', 503)
  let body = null
  try { const t = await request.text(); if (t.length > 4096) return json(request, env, 413, { error: 'too big' }); body = t ? JSON.parse(t) : {} } catch (e) { return json(request, env, 400, { error: 'json' }) }
  const ctl = env.CONTROL.get(env.CONTROL.idFromName('main'))
  if (url.pathname === '/rt/staff/login') {
    const r = await ctl.login(body && body.pass, env.STAFF_PASS_HASH || '', await ipTag(request, env.ROOM_JOIN_SECRET), env.ROOM_JOIN_SECRET, CONFIG_IDS[0])
    if (r.error) logFailure(null, 'staff-login-' + r.error)
    return json(request, env, r.error ? (r.error === 'slow-down' ? 429 : r.error === 'not-configured' ? 503 : 401) : 200, r)
  }
  const action = url.pathname.slice('/rt/control/'.length)
  if (!ACTIONS.includes(action)) return json(request, env, 404, { error: 'not found' })
  const auth = request.headers.get('Authorization') || ''
  const v = await verifyToken(auth.startsWith('Bearer ') ? auth.slice(7).trim() : '', [env.ROOM_JOIN_SECRET, env.ROOM_JOIN_SECRET_PREV])
  if (!v.ok || !isControlTicket(v.claims)) { logFailure(null, 'control-ticket'); return json(request, env, 401, { error: 'ticket' }) }
  const a = parseAction(action, body)
  if (a.error) return json(request, env, 400, { error: a.error })
  if (action === 'state') return json(request, env, 200, await ctl.state())
  if (action === 'open' || action === 'chat') return json(request, env, 200, await ctl.setFlag(action, a.args.on))
  const room = env.ROOMS.get(env.ROOMS.idFromName(a.args.room))
  let r
  try {
    if (action === 'freeze') r = await room.control({ a: 'freeze', on: a.args.on })
    else if (action === 'kick') r = await room.control({ a: 'kick', alias: a.args.alias })
    else r = await room.control({ a: 'rollback', minutes: a.args.minutes })
  } catch (e) { r = { error: 'room' } }
  return json(request, env, r && r.error ? 400 : 200, r || { ok: true })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/rt/health') return text('ok', 200)
    if (url.pathname === '/rt/staff/login' || url.pathname.startsWith('/rt/control/')) return control(request, env, url)
    if (url.pathname !== '/rt/ws') return text('not found', 404)
    if (request.method !== 'GET' || request.headers.get('Upgrade') !== 'websocket') return text('expected websocket', 426)
    if (env.REQUIRE_TLS !== '0' && !overTls(request, url)) return text('https only', 403)
    if (!originAllowed(request, env)) { logFailure(null, 'origin'); return text('forbidden', 403) }
    if (!env.ROOM_JOIN_SECRET) return text('not configured', 503)

    const token = pickToken(request.headers.get('Sec-WebSocket-Protocol'))
    if (!token) { logFailure(null, 'no-ticket'); return text('unauthorized', 401) }
    const v = await verifyToken(token, [env.ROOM_JOIN_SECRET, env.ROOM_JOIN_SECRET_PREV])
    if (!v.ok) { logFailure(null, 'ticket-' + v.why); return text('unauthorized', 401) }
    const c = v.claims

    // Build the request the Durable Object sees. Every x-bt-* header the client sent is
    // removed first; ours are set after verification. The ticket itself is not passed on.
    // The alias is percent-encoded because header values must be Latin-1 and aliases can
    // be Arabic, Dari or Tigrinya.
    const fwd = new Request(request)
    for (const name of [...fwd.headers.keys()]) if (name.startsWith('x-bt-')) fwd.headers.delete(name)
    fwd.headers.delete('Sec-WebSocket-Protocol')
    // The room only ever sees the hashed tag, never the address itself.
    for (const name of ['cf-connecting-ip', 'cf-connecting-ipv6', 'true-client-ip', 'x-forwarded-for', 'x-real-ip']) fwd.headers.delete(name)
    fwd.headers.set('x-bt-ref', c.ref)
    fwd.headers.set('x-bt-alias', encodeURIComponent(c.alias))
    fwd.headers.set('x-bt-jti', c.jti)
    fwd.headers.set('x-bt-exp', String(c.exp))
    fwd.headers.set('x-bt-role', c.role)
    fwd.headers.set('x-bt-ip', await ipTag(request, env.ROOM_JOIN_SECRET))
    fwd.headers.set('x-bt-cfg', c.cfg)   // already checked against the 7 config ids in verifyToken

    // Master Control's multiplayer switch: off = kids wait (staff still get in to prepare)
    if (env.CONTROL && c.role === 'kid') {
      try { const f = await env.CONTROL.get(env.CONTROL.idFromName('main')).flags(); if (f && f.open === false) { logFailure(c.alias, 'multiplayer-off'); return text('closed', 503) } } catch (e) {}
    }
    // Shared world: the world hub seats the kid in one of its 30-kid rooms (see world/hub.js).
    let roomName = c.room
    if (c.world) {
      if (!env.WORLDS) return text('not configured', 503)
      const w = env.WORLDS.get(env.WORLDS.idFromName(c.world))
      const a = await w.assign({ world: c.world, ref: c.ref, grp: c.grp, role: c.role, bld: c.bld, cfg: c.cfg })
      if (a.err) { logFailure(c.alias, 'assign-' + a.err); return text(a.err, a.err === 'full' ? 503 : 403) }
      roomName = a.room
      fwd.headers.set('x-bt-world', c.world)
      fwd.headers.set('x-bt-rid', a.room)
    }
    fwd.headers.set('x-bt-room', roomName)   // the room's own id, so it can report itself to Master Control by id
    const stub = env.ROOMS.get(env.ROOMS.idFromName(roomName))
    return stub.fetch(fwd)
  },
}
