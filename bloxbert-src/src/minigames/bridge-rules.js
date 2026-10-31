// Bridge Rush rules. Pure: no DOM, no engine. See bridge-rush.js for the arena.
export const GAP = 12
export const BUDGET = 40
export const CART_LOAD = 3
export const MATS = {
  wood: { id: 10, cost: 1, holds: 2, key: 'wood' },
  steel: { id: 9, cost: 2, holds: 5, key: 'steel' },
}

// Pure rules, exported for the unit check.
// row: array of GAP entries, each '' | 'wood' | 'steel'. Cell i has the left cliff at i = -1 and the right cliff at i = GAP.
export function capacityAt(row, i) {
  const own = MATS[row[i]]
  if (!own) return 0
  const side = (j) => (j < 0 || j >= GAP ? 5 : (MATS[row[j]] ? MATS[row[j]].holds : 0))
  const left = side(i - 1)
  const right = side(i + 1)
  const base = left === 0 || right === 0 ? own.holds * 0.5 : own.holds
  return base + left * 0.5 + right * 0.5
}
// Simulate the cart: returns { distance, broke: index | -1 }
export function runCart(row, load = CART_LOAD) {
  for (let i = 0; i < GAP; i++) {
    if (!row[i]) return { distance: i, broke: -1 }
    if (capacityAt(row, i) < load) return { distance: i, broke: i }
  }
  return { distance: GAP, broke: -1 }
}
export function stars(distance, blocks) {
  if (distance < GAP) return 0
  return blocks < 20 ? 2 : 1
}
export function better(a, b) { // true when a beats b
  if (!b) return true
  if (a.distance !== b.distance) return a.distance > b.distance
  return a.blocks < b.blocks
}
// One row per alias: a run only replaces that kid's row when it beats it.
export function insertRecord(list, rec) {
  const rest = (list || []).filter((r) => r.alias !== rec.alias)
  const mine = (list || []).find((r) => r.alias === rec.alias)
  const keep = mine && !better(rec, mine) ? mine : rec
  const next = [...rest, keep].sort((p, q) => (p.distance !== q.distance ? q.distance - p.distance : p.blocks - q.blocks))
  return next.slice(0, 3)
}
export function blocksCost(row) {
  let n = 0
  for (const k of row) if (MATS[k]) n += MATS[k].cost
  return n
}
