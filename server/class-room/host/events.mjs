// Shared events for the personal host (docs/bertopia/HOME-HOST.md §7): mobs stay local to each game, but a boss
// fight is news everyone in the world should hear. Pure. One boss fight per world at a time.
//   client -> host  {v:0, t:'ev', k:'boss', a:'start'|'phase'|'end', phase?:1..3, pct?:0|25|50|75|100, won?:bool}
//   host -> all     {t:'ev', k:'boss', a:'start'|'phase'|'end'|'live', by:<alias>, phase, pct, won?}
// Only the player who started the fight moves it on; the owner may end it; it ends by itself when that player
// leaves or after 15 minutes without news. Each player may send 4 event frames per 10 s.
export const EVENT_KINDS = ['boss']
export const EVENT_STALE_MS = 15 * 60 * 1000
export const EVENT_BURST = 4, EVENT_WINDOW_MS = 10000
const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi

export function makeEvents({ now = Date.now } = {}) {
  let boss = null                      // { ref, by, phase, pct, at }
  const sent = new Map()               // ref -> [times]
  const frame = (a, extra) => ({ t: 'ev', k: 'boss', a, by: boss.by, phase: boss.phase, pct: boss.pct, ...(extra || {}) })
  const stale = () => boss && now() - boss.at > EVENT_STALE_MS
  return {
    // p = { ref, alias, staff } -> { relay } | { error } | {} (nothing to say)
    handle(p, f) {
      const t = now(), times = (sent.get(p.ref) || []).filter((x) => t - x < EVENT_WINDOW_MS)
      if (times.length >= EVENT_BURST) return { error: 'ev-slow' }
      times.push(t); sent.set(p.ref, times)
      if (!EVENT_KINDS.includes(f.k) || !['start', 'phase', 'end'].includes(f.a)) return { error: 'ev-shape' }
      if (f.phase !== undefined && !int(f.phase, 1, 3)) return { error: 'ev-shape' }
      if (f.pct !== undefined && !(int(f.pct, 0, 100) && f.pct % 25 === 0)) return { error: 'ev-shape' }
      if (stale()) boss = null
      if (f.a === 'start') {
        if (boss) return { error: 'ev-busy' }
        boss = { ref: p.ref, by: p.alias, phase: f.phase || 1, pct: f.pct === undefined ? 100 : f.pct, at: t }
        return { relay: frame('start') }
      }
      if (!boss) return {}
      if (boss.ref !== p.ref && !(f.a === 'end' && p.staff)) return { error: 'ev-not-yours' }
      if (f.a === 'phase') { boss.phase = f.phase || boss.phase; if (f.pct !== undefined) boss.pct = f.pct; boss.at = t; return { relay: frame('phase') } }
      const out = frame('end', { won: f.won === true }); boss = null; return { relay: out }
    },
    // the starter left: the fight is over for everyone else
    leave(ref) { sent.delete(ref); if (boss && boss.ref === ref) { const out = frame('end', { won: false }); boss = null; return out } return null },
    // what a newcomer hears right after joining
    current() { if (stale()) boss = null; return boss ? frame('live') : null },
    clear() { boss = null; sent.clear() },
  }
}
