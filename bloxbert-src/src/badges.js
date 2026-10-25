// 2.5.472: badges Part 1 — berryRound, lanternWalk, gardenCorner. Survival only.
const BADGES = {
  berryRound: { kind: 'alias', need: 5, keys: new Set() },
  lanternWalk: { kind: 'stamp', need: 6, n: 0 },
  gardenCorner: { kind: 'trophy', need: 4, n: 0 },
}
const earned = new Set()
let onEarn = null
export function onBadge(fn) { onEarn = fn }
export function bump(id, key) {
  const b = BADGES[id]
  if (!b || earned.has(id) || b.keys.has(key)) return
  if (b.keys.size >= b.need) return
  b.keys.add(key)
  if (b.keys.size >= b.need) earn(id)
}
export function set(id, n) {
  const b = BADGES[id]
  if (!b || earned.has(id)) return
  b.n = n
  if (n >= b.need) earn(id)
}
function earn(id) {
  if (earned.has(id)) return
  earned.add(id)
  if (onEarn) onEarn(id)
}
export function dump() {
  return {
    v: 1,
    earned: [...earned],
    prog: {
      berryRound: [...BADGES.berryRound.keys],
      lanternWalk: BADGES.lanternWalk.n,
      gardenCorner: BADGES.gardenCorner.n,
    },
  }
}
export function load(src) {
  if (!src || src.v !== 1) return
  for (const id of src.earned || []) earned.add(id)
  const p = src.prog || {}
  if (p.berryRound) for (const k of p.berryRound) BADGES.berryRound.keys.add(k)
  if (typeof p.lanternWalk === 'number') BADGES.lanternWalk.n = p.lanternWalk
  if (typeof p.gardenCorner === 'number') BADGES.gardenCorner.n = p.gardenCorner
}
export function progress(id) {
  const b = BADGES[id]
  if (!b) return { n: 0, m: 0, done: false }
  const n = b.keys ? b.keys.size : b.n
  return { n, m: b.need, done: earned.has(id) }
}
export function all() { return Object.keys(BADGES) }
