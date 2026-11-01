// The home door (docs/bertopia/HOME-HOST.md §3, §4, §6): session codes, display names, the 18+ confirm, join limits,
// bans, the owner PIN, and home tickets. Pure where it can be: time and randomness are injectable for the checks.
// It never sees the school secret; it issues tickets with iss 'home' and a home-* config id, which the school Worker
// refuses (unknown issuer, unknown config), and it refuses school tickets (wrong issuer, different secret).
import { randomInt, randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto'
import { signToken, verifyToken } from '../src/token.js'
import { cleanAlias, newBucket, takeToken, registerConfigIds } from '../src/protocol.js'
import { registerPolicy } from '../src/claims.js'

export const ISSUER = 'home'
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'   // no 0/O/1/I/L
export const CODE_LEN = 8
export const IDLE_END_MS = 24 * 60 * 60 * 1000
export const TICKET_TTL_SEC = 60
export const JOIN_PER_MIN = 5
export const JOIN_BACKOFF_MS = 10 * 60 * 1000
export const PIN_TRIES = 5
export const PIN_BACKOFF_MS = 10 * 60 * 1000
export const CONNS_PER_IP = 3
export const NAME_MIN = 2, NAME_MAX = 20
export const DEFAULT_MAX_PLAYERS = 16

// ONE home config id for tickets and claims (a world's config is pinned by the hub, as at school). It is disjoint from
// the 7 school ids. The RULESET (survival, creative, ...) is session state: the door reports it, hello carries it and
// the server enforces it (part 3). A shared home world has no plots and no Bertyville map.
export const HOME_CFG = 'home'
export const RULESETS = ['home-school', 'home-survival', 'home-creative', 'home-peaceful', 'home-pvp', 'home-hardcore']
export const HOME_CFGS = RULESETS   // kept for callers that list presets
export function registerHome() {
  registerConfigIds([HOME_CFG])
  registerPolicy(HOME_CFG, { plots: false, wild: true, town: false, strong: false, buddies: false, editsPerSec: 8, bannedBlocks: [] })
}

// ---- session code
export function makeCode(rand = randomInt) {
  let s = ''
  for (let i = 0; i < CODE_LEN; i++) s += CODE_ALPHABET[rand(CODE_ALPHABET.length)]
  return s
}
export const normCode = (s) => String(s || '').toUpperCase().replace(/[\s-]/g, '')
export const hashCode = (code, salt) => createHash('sha256').update(salt + ':' + normCode(code)).digest('hex')
const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b))

// ---- display names: 2-20 chars, letters (any script), digits, space, _ -; trimmed; no owner/host lookalikes; filter
const RESERVED = ['owner', 'host', 'admin', 'server', 'bertopia', 'teacher', 'staff', 'mod', 'moderator', 'system']
const fold = (s) => s.toLowerCase().replace(/[\s_\-.]/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't').replace(/@/g, 'a').replace(/\$/g, 's')
export function checkName(raw, { filter = () => true } = {}) {
  if (typeof raw !== 'string') return { error: 'name' }
  const name = raw.replace(/\s+/g, ' ').trim()
  if (name.length < NAME_MIN || name.length > NAME_MAX) return { error: 'name' }
  if (!/^[\p{L}\p{M}\p{N} _-]+$/u.test(name)) return { error: 'name' }
  if (!cleanAlias(name)) return { error: 'name' }                       // the school alias rules (no bidi controls, no email shapes)
  const f = fold(name)
  if (RESERVED.some((r) => f === r || (f.startsWith(r) && /^[a-z]{0,2}$|^\d{0,2}$/.test(f.slice(r.length)) && f.length <= r.length + 2 && !/^[a-z]{3,}$/.test(f.slice(r.length))) || (f.startsWith('the') && f.slice(3) === r))) return { error: 'name-reserved' }
  if (!filter(name)) return { error: 'name-filtered' }
  return { name }
}

// ---- owner PIN: scrypt, never logged
const SCRYPT = { N: 1 << 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }
export function hashPin(pin, salt = randomBytes(16).toString('hex')) {
  return salt + '$' + scryptSync(String(pin), salt, 32, SCRYPT).toString('hex')
}
export const validPin = (pin) => typeof pin === 'string' && /^\d{6,12}$/.test(pin)
export function checkPin(pin, stored) {
  if (!validPin(pin) || typeof stored !== 'string' || !stored.includes('$')) return false
  const [salt, hash] = stored.split('$')
  return same(scryptSync(pin, salt, 32, SCRYPT).toString('hex'), hash)
}

// ---- the door itself
// deps: { secret, now(), rand, filter(name) -> bool, maxPlayers, password? }
export function makeDoor({ secret, now = Date.now, rand = randomInt, filter, maxPlayers = DEFAULT_MAX_PLAYERS, codeSalt = randomBytes(8).toString('hex') }) {
  const usedCodes = new Set()           // hashes of every code ever issued by this host (never reused)
  let session = null                    // { id, codeHash, startedAt, lastSeen, password|null, cfg, world, rotated }
  const joinBuckets = new Map()         // ipTag -> { bucket, until }
  const pinBuckets = new Map()
  const conns = new Map()               // ipTag -> count (the host updates it on socket open/close)
  const bans = new Map()                // ref -> { name, ipTag, at }  (this process only)
  const names = new Map()               // folded name -> ref  (unique per session)
  const ipTag = (ip) => createHash('sha256').update(codeSalt + '|' + String(ip || 'local')).digest('hex').slice(0, 16)

  function limited(map, key, perMin, backoffMs) {
    const t = now()
    let e = map.get(key)
    if (e && e.until && t < e.until) return { wait: Math.ceil((e.until - t) / 1000) }
    if (!e) { e = { bucket: newBucket(t, perMin / 60, perMin), until: 0 }; map.set(key, e) }
    if (!takeToken(e.bucket, t)) { e.until = t + backoffMs; return { wait: Math.ceil(backoffMs / 1000) } }
    return null
  }
  const touch = () => { if (session) session.lastSeen = now() }
  // limiter entries that have been quiet for an hour are forgotten (bounded memory under a code-guessing bot)
  const forget = (map) => { const t = now(); for (const [k, e] of map) if (!(e.until && t < e.until) && t - e.bucket.at > 60 * 60 * 1000) map.delete(k) }

  const door = {
    ipTag,
    get session() { return session },
    get bans() { return [...bans.entries()].map(([ref, b]) => ({ ref, name: b.name, at: b.at })) },
    // Owner: start a session. Returns the code ONCE; only its hash is kept.
    start({ world, cfg = 'home-survival', password = null } = {}) {
      if (!RULESETS.includes(cfg)) throw new Error('cfg')
      let code
      do code = makeCode(rand); while (usedCodes.has(hashCode(code, codeSalt)))
      const codeHash = hashCode(code, codeSalt); usedCodes.add(codeHash)
      session = { id: 'home-' + randomBytes(6).toString('hex'), codeHash, startedAt: now(), lastSeen: now(), password: password || null, cfg, world, rotated: 0 }
      names.clear(); bans.clear()
      return { code, session: door.info() }
    },
    rotate() {
      if (!session) return null
      let code
      do code = makeCode(rand); while (usedCodes.has(hashCode(code, codeSalt)))
      session.codeHash = hashCode(code, codeSalt); usedCodes.add(session.codeHash); session.rotated++
      return { code }                          // people already in stay in: their sockets are accepted already
    },
    end() { session = null; names.clear() },
    setPassword(pw) { if (session) session.password = pw ? String(pw) : null },
    setCfg(cfg) { if (session && RULESETS.includes(cfg)) session.cfg = cfg },
    info() { return session ? { id: session.id, startedAt: session.startedAt, lastSeen: session.lastSeen, cfg: session.cfg, world: session.world, password: !!session.password, rotated: session.rotated, players: names.size } : null },
    // Called by the host on its own clock: a session with nobody in it for 24 h ends.
    sweep(playersOnline) { forget(joinBuckets); forget(pinBuckets); if (session && playersOnline === 0 && now() - session.lastSeen > IDLE_END_MS) { door.end(); return true } return false },
    noteActivity: touch,

    // Player join: everything in docs §3 step 3, in that order. ip is the raw address (hashed here, never stored).
    async join({ code, name, password, adults, ip, playersOnline = 0 }) {
      const tag = ipTag(ip)
      const lim = limited(joinBuckets, tag, JOIN_PER_MIN, JOIN_BACKOFF_MS)
      if (lim) return { error: 'slow-down', wait: lim.wait }
      if (!session) return { error: 'ended' }
      if (!same(hashCode(code, codeSalt), session.codeHash)) return { error: 'code' }   // counted above: a wrong code spends a try
      if (session.password && String(password || '') !== session.password) return { error: 'password' }
      if (adults !== true) return { error: 'adults' }
      const n = checkName(name, { filter })
      if (n.error) return { error: n.error }
      if ((conns.get(tag) || 0) >= CONNS_PER_IP) return { error: 'too-many' }
      if (playersOnline >= maxPlayers) return { error: 'full' }
      const key = fold(n.name)
      for (const [ref, b] of bans) if (b.ipTag === tag || b.nameKey === key) return { error: 'banned', ref }
      let ref = names.get(key)
      if (!ref) { ref = 'homeref-' + randomBytes(8).toString('hex'); names.set(key, ref) }
      touch()
      const ticket = await signToken({ v: 1, ref, world: session.world, alias: n.name, exp: Math.floor(now() / 1000) + TICKET_TTL_SEC, jti: 'hj-' + randomBytes(8).toString('hex'), role: 'kid', cfg: HOME_CFG, iss: ISSUER }, secret)
      return { ticket, name: n.name, ref, ruleset: session.cfg, world: session.world }
    },
    // Owner play ticket (role admin = the Room's staff path: kick, freeze, mute, edit anywhere).
    async ownerTicket(name = 'Owner') {
      if (!session) return null
      touch()
      return signToken({ v: 1, ref: 'homeowner-' + createHash('sha256').update(secret).digest('hex').slice(0, 16), world: session.world, alias: name, exp: Math.floor(now() / 1000) + TICKET_TTL_SEC, jti: 'ho-' + randomBytes(8).toString('hex'), role: 'admin', amr: ['passkey'], cfg: HOME_CFG, iss: ISSUER }, secret)
    },
    // What the socket upgrade asks: is this a home ticket of ours? (school tickets fail here: wrong secret, no iss)
    verify: (token, nowSec) => verifyToken(token, [secret], nowSec, { issuer: ISSUER }),

    // Owner PIN tries are limited per address like joins
    pinAttempt(ip) { return limited(pinBuckets, ipTag(ip), PIN_TRIES, PIN_BACKOFF_MS) },
    pinOk(ip) { pinBuckets.delete(ipTag(ip)) },

    // Connections per address: the host reports opens and closes
    connOpen(ip) { const t = ipTag(ip); conns.set(t, (conns.get(t) || 0) + 1) },
    connClose(ip) { const t = ipTag(ip); const n = (conns.get(t) || 1) - 1; if (n <= 0) conns.delete(t); else conns.set(t, n) },

    // Ban for this session: by ref, name and address tag; nothing persists
    ban(ref, name, ip) { bans.set(ref, { name, nameKey: fold(name || ''), ipTag: ipTag(ip), at: now() }) },
    unban(ref) { bans.delete(ref) },
    isBanned(ref) { return bans.has(ref) },
    nameOf(ref) { for (const [k, r] of names) if (r === ref) return k; return null },
  }
  return door
}
