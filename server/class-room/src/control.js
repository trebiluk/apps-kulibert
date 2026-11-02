// Master Control's staff controls (part 2, Nov 1): the pure half. A tiny registry of live rooms (ids and counts
// only — never aliases, refs or addresses), two switches (multiplayer open, chat), and the staff login that mints a
// short control ticket. Storage is a key/value: get(k) -> value|undefined, put(k, v). Time is injectable.
import { signToken } from './token.js'

export const LOGIN_TRIES = 5                  // wrong passwords per address tag ...
export const LOGIN_BACKOFF_MS = 10 * 60 * 1000 // ... then this long a wait
export const CONTROL_TTL_SEC = 300            // a control ticket lives 5 minutes (the staff cap in token.js)
export const CONTROL_ROOM = 'mc-control-room'  // the "room" a control ticket names (an opaque id, 8+ chars); no Room ever has this id
export const ROOM_STALE_MS = 10 * 60 * 1000   // a room that has not reported in this long is dropped from the list
export const ACTIONS = ['state', 'open', 'chat', 'freeze', 'kick', 'rollback']

const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
export async function sha256Hex(text) { return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(text ?? '')))) }
const same = (a, b) => { if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false; let d = 0; for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i); return d === 0 }

export function makeControl(store, { now = Date.now, rand = () => Math.random().toString(36).slice(2, 12) } = {}) {
  const flagsOf = async () => ({ open: true, chat: true, ...((await store.get('flags')) || {}) })
  const roomsOf = async () => (await store.get('rooms')) || {}
  const triesOf = async () => (await store.get('tries')) || {}
  return {
    flags: flagsOf,
    async setFlag(key, on) {
      if (key !== 'open' && key !== 'chat') return { error: 'flag' }
      const f = await flagsOf(); f[key] = on === true; await store.put('flags', f); return { ok: true, flags: f }
    },
    // a Room reports itself: { wid, kids, staff, frozen } ; a room with nobody in it is forgotten
    async report(rid, s) {
      if (typeof rid !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(rid)) return { error: 'rid' }
      const rooms = await roomsOf()
      const kids = Math.max(0, Number(s && s.kids) | 0), staff = Math.max(0, Number(s && s.staff) | 0)
      if (!kids && !staff) delete rooms[rid]
      else rooms[rid] = { wid: s && typeof s.wid === 'string' ? s.wid.slice(0, 64) : null, kids, staff, frozen: !!(s && s.frozen), at: now() }
      await store.put('rooms', rooms); return { ok: true }
    },
    async state() {
      const rooms = await roomsOf(), t = now(), list = []
      let changed = false
      for (const [rid, r] of Object.entries(rooms)) { if (t - r.at > ROOM_STALE_MS) { delete rooms[rid]; changed = true } else list.push({ rid, ...r }) }
      if (changed) await store.put('rooms', rooms)
      list.sort((a, b) => a.rid.localeCompare(b.rid))
      return { flags: await flagsOf(), rooms: list, at: t }
    },
    // staff login: the password's SHA-256 against the configured hash (STAFF_PASS_HASH), 5 tries per address then 10 min
    async login(pass, hash, ipTag, secret, cfg) {
      const tries = await triesOf(), t = now(), e = tries[ipTag] || { n: 0, until: 0 }
      if (e.until && t < e.until) return { error: 'slow-down', wait: Math.ceil((e.until - t) / 1000) }
      if (!hash || typeof hash !== 'string' || hash.length !== 64) return { error: 'not-configured' }
      if (typeof pass !== 'string' || pass.length > 200 || !same(await sha256Hex(pass), hash.toLowerCase())) {
        e.n++; if (e.n >= LOGIN_TRIES) { e.n = 0; e.until = t + LOGIN_BACKOFF_MS }
        tries[ipTag] = e; for (const k of Object.keys(tries)) if (tries[k].until && tries[k].until < t - 60 * 60 * 1000) delete tries[k]
        await store.put('tries', tries)
        return { error: 'password', left: e.until ? 0 : LOGIN_TRIES - e.n, ...(e.until ? { wait: LOGIN_BACKOFF_MS / 1000 } : {}) }
      }
      if (tries[ipTag]) { delete tries[ipTag]; await store.put('tries', tries) }
      const exp = Math.floor(t / 1000) + CONTROL_TTL_SEC
      const ticket = await signToken({ v: 1, ref: 'staffctl-' + rand(), room: CONTROL_ROOM, alias: 'Master Control', exp, jti: 'ctl-' + rand() + rand(), role: 'admin', amr: ['passkey'], cfg }, secret)
      return { ok: true, ticket, exp }
    },
  }
}

// a verified ticket may control only if it is the admin control ticket (not a game ticket that happens to be staff).
// verifyToken already required amr "passkey" for staff and drops it from the claims it returns.
export const isControlTicket = (c) => !!(c && c.role === 'admin' && c.room === CONTROL_ROOM && c.alias === 'Master Control')

// request shapes for the actions (pure): -> { ok, args } or { error }
export function parseAction(action, b) {
  const o = b && typeof b === 'object' ? b : {}
  const rid = typeof o.room === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(o.room) ? o.room : null
  switch (action) {
    case 'state': return { ok: true, args: {} }
    case 'open': case 'chat': return typeof o.on === 'boolean' ? { ok: true, args: { on: o.on } } : { error: 'on: true or false' }
    case 'freeze': return rid && typeof o.on === 'boolean' ? { ok: true, args: { room: rid, on: o.on } } : { error: 'room and on' }
    case 'kick': { const alias = typeof o.alias === 'string' ? o.alias.trim().slice(0, 24) : ''; return rid && alias ? { ok: true, args: { room: rid, alias } } : { error: 'room and alias' } }
    case 'rollback': { const m = Number(o.minutes); return rid && Number.isFinite(m) && m >= 1 && m <= 7 * 24 * 60 ? { ok: true, args: { room: rid, minutes: Math.floor(m) } } : { error: 'room and minutes (1 to 10080)' } }
    default: return { error: 'action' }
  }
}
