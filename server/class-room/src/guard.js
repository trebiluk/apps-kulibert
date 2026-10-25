// Abuse ladder and failure log. Pure (the caller passes the clock), memory only.
//
//   hard offence (bad frame, replay, forged staff command) -> the connection is dropped
//   and one STRIKE is recorded against the kid's opaque ref.
//   STRIKES_TO_BAN strikes inside STRIKE_WINDOW_MS -> a temporary BAN (the ref cannot
//   rejoin this room). Each further ban is longer, up to MAX_BAN_MS.
//
// Bans are per ref, never per IP: a whole class shares one school IP, so an IP ban would
// lock out 30 innocent kids. IP limits (room.js) only slow a flood; they never ban.
//
// Memory only, on purpose (Phase 0 stores nothing): if the room empties and the object is
// evicted, strikes and bans are forgotten. Cloudflare's own WAF rate limit sits in front.

export const STRIKE_WINDOW_MS = 10 * 60 * 1000
export const STRIKES_TO_BAN = 3
export const BAN_MS = 10 * 60 * 1000
export const MAX_BAN_MS = 60 * 60 * 1000
const MAX_ENTRIES = 500

export function makeLedger() {
  const m = new Map() // ref -> { strikes: number[], bans: number, until: number }

  const entry = (ref) => {
    let e = m.get(ref)
    if (!e) {
      if (m.size >= MAX_ENTRIES) {
        for (const [k, v] of m) { if (v.until === 0) { m.delete(k); break } }   // evict an unbanned entry
      }
      e = { strikes: [], bans: 0, until: 0 }
      m.set(ref, e)
    }
    return e
  }

  return {
    // Returns {action:'kick'} or {action:'ban', until}.
    strike(ref, now) {
      const e = entry(ref)
      e.strikes = e.strikes.filter((t) => now - t < STRIKE_WINDOW_MS)
      e.strikes.push(now)
      if (e.strikes.length >= STRIKES_TO_BAN) {
        e.bans++
        e.strikes = []
        e.until = now + Math.min(MAX_BAN_MS, BAN_MS * 6 ** (e.bans - 1))
        return { action: 'ban', until: e.until }
      }
      return { action: 'kick' }
    },
    isBanned(ref, now) {
      const e = m.get(ref)
      return !!e && e.until > now
    },
    sweep(now) {
      for (const [k, e] of m) {
        e.strikes = e.strikes.filter((t) => now - t < STRIKE_WINDOW_MS)
        if (e.until <= now && e.strikes.length === 0 && e.bans === 0) m.delete(k)
      }
    },
    size: () => m.size,
  }
}

// Failure log. A record holds a fixed code, the alias (or null before a ticket is trusted)
// and the time. Never an IP, a ref, a token, a message body or a name.
export const failureLog = {
  sink: (rec) => console.log(JSON.stringify(rec)),
}
export function logFailure(alias, code, now = Date.now()) {
  try { failureLog.sink({ ev: 'fail', code, alias: alias ?? null, ts: Math.floor(now / 1000) }) } catch (e) {}
}
