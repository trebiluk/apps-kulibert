// Worker entry. Public endpoints: GET /rt/ws (WebSocket upgrade), GET /rt/health, and (2.5.596,
// B20 p1) GET /rt/history?x=&y=&z= for staff: "who changed this block" from the 7-day log.
// /rt/history takes the same signed join ticket, as "Authorization: Bearer <ticket>". Only a staff
// ticket (teacher/admin, passkey amr, checked by verifyToken) for a shared world gets an answer, and
// only about its own world; a kid ticket gets 403. Read-only: nothing is stored or changed.
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
import { isStaff } from './protocol.js'
import { historyVia } from './editlog.js'

export { Room } from './room.js'
export { World } from './world-do.js'

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

const text = (body, status, extra = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store', ...extra } })

// CORS for the staff console: only an allowed Origin is echoed. A request with no Origin (curl) is fine,
// the ticket is the check; a request from any other Origin is refused.
function cors(request, env) {
  const origin = request.headers.get('Origin')
  if (!origin) return {}
  if (!originAllowed(request, env)) return null
  return { 'access-control-allow-origin': origin, 'access-control-allow-headers': 'authorization', 'access-control-allow-methods': 'GET', vary: 'Origin' }
}

const cellParam = (v) => (v !== null && /^-?\d{1,7}$/.test(v) ? Number(v) : null)

async function history(request, env, url) {
  const h = cors(request, env)
  if (!h) { logFailure(null, 'origin'); return text('forbidden', 403) }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...h, 'access-control-max-age': '600' } })
  if (request.method !== 'GET') return text('method', 405, h)
  if (env.REQUIRE_TLS !== '0' && !overTls(request, url)) return text('https only', 403, h)
  if (!env.ROOM_JOIN_SECRET || !env.WORLDS) return text('not configured', 503, h)
  const m = /^Bearer (\S+)$/.exec(request.headers.get('Authorization') || '')
  if (!m) { logFailure(null, 'no-ticket'); return text('unauthorized', 401, h) }
  const v = await verifyToken(m[1], [env.ROOM_JOIN_SECRET, env.ROOM_JOIN_SECRET_PREV])
  if (!v.ok) { logFailure(null, 'ticket-' + v.why); return text('unauthorized', 401, h) }
  const c = v.claims
  if (!isStaff(c.role) || !c.world) { logFailure(c.alias, 'history-not-staff'); return text('forbidden', 403, h) }
  const [x, y, z] = ['x', 'y', 'z'].map((k) => cellParam(url.searchParams.get(k)))
  if (x === null || y === null || z === null) return text('bad cell', 400, h)
  const w = env.WORLDS.get(env.WORLDS.idFromName(c.world))
  const entries = await historyVia((s, n) => w.since(s, n), x, y, z)
  if (!entries) return text('busy, try again', 503, h)
  // aliases-only law: the body is cell + [{who (builder tag), action, block, t}], nothing else
  return new Response(JSON.stringify({ x, y, z, entries }), { status: 200, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } })
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname === '/rt/health') return text('ok', 200)
    if (url.pathname === '/rt/history') return history(request, env, url)
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
    const stub = env.ROOMS.get(env.ROOMS.idFromName(roomName))
    return stub.fetch(fwd)
  },
}
