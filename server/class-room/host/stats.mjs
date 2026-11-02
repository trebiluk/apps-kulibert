// Leaderboards for the personal host (part 15). Pure: a table of counters per alias (18+: aliases are the names
// people chose; no refs, no addresses), kept in a world's meta row 'stats' by the host, saved a few seconds after a
// change. Boards: placed, broken, time (minutes), chats, boss (fights won), warps (teleports). Time counts while
// a player is in, from join to leave, in whole seconds.
export const BOARDS = ['placed', 'broken', 'time', 'chats', 'boss', 'warps']
export const BOARD_WORDS = { placed: 'blocks placed', broken: 'blocks broken', time: 'minutes played', chats: 'chat lines', boss: 'boss fights won', warps: 'teleports' }
export const MAX_ALIASES = 500      // a world keeps the 500 most recently seen aliases
export const TOP_N = 10

export function makeStats(initial) {
  let table = sane(initial)
  let dirty = false
  const row = (alias) => { const k = String(alias || '').slice(0, 20); if (!k) return null; let r = table[k]; if (!r) { r = { placed: 0, broken: 0, sec: 0, chats: 0, boss: 0, warps: 0, seen: 0 }; table[k] = r; trim() } return r }
  function trim() { const keys = Object.keys(table); if (keys.length <= MAX_ALIASES) return; keys.sort((a, b) => table[a].seen - table[b].seen); for (const k of keys.slice(0, keys.length - MAX_ALIASES)) delete table[k] }
  return {
    add(alias, key, n = 1, now = Date.now()) { const r = row(alias); if (!r) return; if (key === 'time') r.sec += Math.max(0, n | 0); else if (key in r && key !== 'seen') r[key] += Math.max(0, n | 0); r.seen = now; dirty = true },
    top(board = 'placed', n = TOP_N) {
      if (!BOARDS.includes(board)) return null
      const val = (r) => (board === 'time' ? Math.floor(r.sec / 60) : r[board])
      return Object.entries(table).map(([alias, r]) => ({ alias, n: val(r) })).filter((e) => e.n > 0).sort((a, b) => b.n - a.n || a.alias.localeCompare(b.alias)).slice(0, Math.max(1, Math.min(50, n | 0)))
    },
    mine(alias) { const r = table[String(alias || '').slice(0, 20)]; return r ? { placed: r.placed, broken: r.broken, time: Math.floor(r.sec / 60), chats: r.chats, boss: r.boss, warps: r.warps } : null },
    reset(alias) { if (alias) { delete table[String(alias).slice(0, 20)] } else table = {}; dirty = true },
    dump() { return JSON.parse(JSON.stringify(table)) },
    take() { if (!dirty) return null; dirty = false; return JSON.stringify(table) },
    get size() { return Object.keys(table).length },
  }
}
// what comes back from a world file: only well-shaped rows, numbers clamped, at most MAX_ALIASES
export function sane(raw) {
  let obj = raw
  if (typeof raw === 'string') { try { obj = JSON.parse(raw) } catch (e) { obj = null } }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return {}
  const out = {}
  const num = (v) => (Number.isFinite(v) && v >= 0 ? Math.min(1e9, Math.floor(v)) : 0)
  for (const [k, r] of Object.entries(obj)) {
    if (typeof k !== 'string' || !k || k.length > 20 || k === '__proto__' || !r || typeof r !== 'object' || Array.isArray(r)) continue
    out[k] = { placed: num(r.placed), broken: num(r.broken), sec: num(r.sec), chats: num(r.chats), boss: num(r.boss), warps: num(r.warps), seen: num(r.seen) }
    if (Object.keys(out).length >= MAX_ALIASES) break
  }
  return out
}
// the lines a player reads after /top
export function topText(board, list, who) {
  if (!list) return 'Boards: ' + BOARDS.join(', ') + ' — /top <board>'
  if (!list.length) return 'Nobody on the ' + BOARD_WORDS[board] + ' board yet.'
  const me = who ? list.findIndex((e) => e.alias === who) : -1
  return 'Top ' + BOARD_WORDS[board] + ': ' + list.map((e, i) => (i + 1) + '. ' + e.alias + ' ' + e.n).join(' · ') + (who && me < 0 ? ' · (you are not on it yet)' : '')
}
