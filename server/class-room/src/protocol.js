// Pure helpers for the class room server. No Cloudflare APIs in this file,
// so Node can unit-test everything here (see test/protocol.test.mjs).
//
// Phase 0 = presence only: alias nameplates and positions. Nothing a kid typed
// is ever accepted, stored or sent. The only strings that cross the wire are the
// hub alias (picked or generated, never typed, and signed into the join token)
// and short fixed message names.

export const PROTOCOL = 'bt-room.v0'   // WebSocket subprotocol the client must offer
export const MAX_PLAYERS = 30          // hard cap per room
export const TICK_MS = 200             // about 5 snapshots per second
export const FULL_EVERY_TICKS = 25     // a full resync about every 5 seconds
export const MAX_FRAME_CHARS = 128     // a position frame is about 50 characters
export const MAX_MSGS_PER_SEC = 12     // per socket; a normal client sends about 6
export const IDLE_CLOSE_MS = 45000     // close sockets that send nothing for this long
export const WORLD_LIMIT = 100000      // reject any |x|, |y| or |z| beyond this
export const PROTO_VERSION = 0         // every client frame carries "v":0; anything else is refused
export const MAX_TOKEN_TTL_SEC = 120   // kid join tickets: used right away, so very short-lived
export const MAX_STAFF_TOKEN_TTL_SEC = 300
export const MAX_STAFF_EXTRA = 4       // staff sockets allowed on top of the 30 kids
export const SEQ_MAX = 2147483647

// WebSocket close codes (4000-4999 are ours).
export const CLOSE = {
  FULL: 4001,      // room already has MAX_PLAYERS
  REPLACED: 4002,  // the same kid joined again (second tab); the older socket is closed
  ABUSE: 4003,     // too many bad or too-fast frames
  IDLE: 4004,      // nothing received for IDLE_CLOSE_MS
  BAD: 4005,       // a malformed, oversized, unknown, replayed or not-allowed frame
  KICKED: 4006,    // a teacher or admin removed this socket
}

export const ROLES = ['kid', 'teacher', 'admin']

// The 7 server world configs (Diego, Oct 25). Only staff create a world, and only from
// one of these. A ticket must name one; anything else is refused. What each config DOES
// (kit rules, resets, contest tools) is game logic for later phases; Phase 0 only
// carries the id so a room can never be anything but one of the seven.
//   solvay    all Solvay kids, school-wide, long-lived
//   semester  grade 6-8 groups, resets each semester
//   period    one per class period, teacher work assignments
//   game      kit rules, PvP opt-in
//   loot      loot and boss focus, cosmetic drops only
//   contest   creative flat, plots, contest tools, strong grief prevention
//   seed      teacher-picked custom seed and preset
export const CONFIG_IDS = ['solvay', 'semester', 'period', 'game', 'loot', 'contest', 'seed']
// Extra config ids a NON-school host registers in its own process (the personal host, docs/bertopia/HOME-HOST.md).
// The school Worker never calls this, so a home config id is refused at school and vice versa.
const EXTRA_CONFIG_IDS = new Set()
export function registerConfigIds(ids) { for (const id of ids) if (typeof id === 'string' && /^home(-[a-z]{3,16})?$/.test(id)) EXTRA_CONFIG_IDS.add(id) }
export const isConfigId = (s) => typeof s === 'string' && (CONFIG_IDS.includes(s) || EXTRA_CONFIG_IDS.has(s))
export const isStaff = (role) => role === 'teacher' || role === 'admin'

// ---------------------------------------------------------------- identity

// Opaque ids (kid ref, room id): letters, digits, underscore, hyphen. 8-64 chars.
const OPAQUE_RE = /^[A-Za-z0-9_-]{8,64}$/
export function isOpaqueId(s) {
  return typeof s === 'string' && OPAQUE_RE.test(s)
}

// An alias is picked or generated on the Hub, never typed in the game. It is
// still checked here, because it is shown on other kids' screens.
//   - starts with a letter or digit, then letters, digits, marks, space, _ or -
//   - U+200C (zero-width non-joiner) is allowed because Dari/Farsi words need it
//   - no bidi controls, no other invisible characters, no emoji, no punctuation
//   - at most 24 characters and at most 8 combining marks
const ALIAS_RE = /^[\p{L}\p{N}][\p{L}\p{N}\p{M}‌ _-]*$/u
const MARK_RE = /\p{M}/gu
export function cleanAlias(a) {
  if (typeof a !== 'string') return null
  const s = a.normalize('NFC').trim().replace(/ {2,}/g, ' ')
  if (!s || [...s].length > 24) return null
  if (!ALIAS_RE.test(s)) return null
  if ((s.match(MARK_RE) || []).length > 8) return null
  return s
}

// ---------------------------------------------------------------- frames

const q1 = (v) => Math.round(v * 10) / 10

// Client frames are strict. Each one carries the protocol version and has an exact
// set of allowed keys. Anything else (unknown type, extra key, wrong version,
// binary, too long, bad JSON) is an error, and the room drops the connection.
//
//   position  {"v":0,"t":"p","q":17,"x":1.2,"y":5,"z":-3.4,"r":90,"f":0}
//             q = sequence number, must go up on every position frame (stops replays)
//             x, y, z block coordinates (rounded to 0.1), r yaw degrees, f flags 0-255 (optional)
//   ping      {"v":0,"t":"ping","n":7}
//   staff     {"v":0,"t":"st","a":"kick","i":4}  |  {"v":0,"t":"st","a":"freeze","on":1}
//             a = kick | freeze | open | close | rollback. Only teacher/admin tickets may send these.
//
// There is deliberately no frame for text, creating a world, hosting, inviting,
// uploading a world file, or saving. Kids cannot do those over this socket at all.
const KEYS = {
  p: new Set(['v', 't', 'q', 'x', 'y', 'z', 'r', 'f']),
  ping: new Set(['v', 't', 'n']),
  st: new Set(['v', 't', 'a', 'i', 'on']),
}
const STAFF_ACTIONS = new Set(['kick', 'freeze', 'open', 'close', 'rollback'])
const isInt = (n, lo, hi) => Number.isInteger(n) && n >= lo && n <= hi

export function parsePos(m) {
  const { x, y, z, r } = m
  const f = m.f === undefined ? 0 : m.f
  if (![x, y, z, r].every((n) => typeof n === 'number' && Number.isFinite(n))) return null
  if (Math.abs(x) > WORLD_LIMIT || Math.abs(y) > WORLD_LIMIT || Math.abs(z) > WORLD_LIMIT) return null
  if (!Number.isInteger(f) || f < 0 || f > 255) return null
  return {
    x: q1(x) + 0,   // "+ 0" turns -0 into 0
    y: q1(y) + 0,
    z: q1(z) + 0,
    r: (((Math.round(r) % 360) + 360) % 360),
    f,
  }
}

// Returns {t:'p', q, pos} | {t:'ping', n} | {t:'st', a, i?, on?}
//      or {err:'binary'|'big'|'json'|'shape'|'version'|'type'|'keys'|'pos'|'seq'|'ping'|'staff'}
export function parseFrame(data) {
  if (typeof data !== 'string') return { err: 'binary' }
  if (data.length > MAX_FRAME_CHARS) return { err: 'big' }
  let m
  try { m = JSON.parse(data) } catch (e) { return { err: 'json' } }
  if (!m || typeof m !== 'object' || Array.isArray(m)) return { err: 'shape' }
  if (m.v !== PROTO_VERSION) return { err: 'version' }
  const keys = typeof m.t === 'string' && Object.hasOwn(KEYS, m.t) ? KEYS[m.t] : null
  if (!keys) return { err: 'type' }   // anything else, including anything that looks like chat
  for (const k of Object.keys(m)) if (!keys.has(k)) return { err: 'keys' }

  if (m.t === 'p') {
    if (!isInt(m.q, 0, SEQ_MAX)) return { err: 'seq' }
    const pos = parsePos(m)
    return pos ? { t: 'p', q: m.q, pos } : { err: 'pos' }
  }
  if (m.t === 'ping') {
    return isInt(m.n, 0, SEQ_MAX) ? { t: 'ping', n: m.n } : { err: 'ping' }
  }
  // staff
  if (!STAFF_ACTIONS.has(m.a)) return { err: 'staff' }
  if (m.a === 'kick') {
    return isInt(m.i, 1, 65535) && m.on === undefined ? { t: 'st', a: 'kick', i: m.i } : { err: 'staff' }
  }
  if (m.a === 'freeze') {
    return (m.on === 0 || m.on === 1) && m.i === undefined ? { t: 'st', a: 'freeze', on: m.on } : { err: 'staff' }
  }
  return m.i === undefined && m.on === undefined ? { t: 'st', a: m.a } : { err: 'staff' }
}

// One player's entry inside a snapshot: [id,x,y,z,r,f]
export function frag(id, p) {
  return '[' + id + ',' + p.x + ',' + p.y + ',' + p.z + ',' + p.r + ',' + p.f + ']'
}

// ---------------------------------------------------------------- rate limit

// Token bucket. A socket's bucket refills MAX_MSGS_PER_SEC tokens each second and holds at most that many.
// Other limiters (per IP) pass their own rate and capacity.
export function newBucket(now, rate = MAX_MSGS_PER_SEC, cap = rate) {
  return { tokens: cap, at: now, rate, cap }
}
export function takeToken(b, now) {
  const add = ((now - b.at) / 1000) * b.rate
  b.tokens = Math.min(b.cap, b.tokens + add)
  b.at = now
  if (b.tokens < 1) return false
  b.tokens -= 1
  return true
}
