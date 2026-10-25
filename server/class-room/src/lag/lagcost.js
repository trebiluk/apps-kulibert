// Lag Coach, part 1: what a build COSTS. Pure, no browser or server APIs, so the same file runs in
// the game (single player too) and on the server (teacher "heavy builds" list, by chunk, no names).
// Cost = how much work the game does every tick or frame for a block, not how big it looks.
// Weights are first guesses; tune them on a real low-end Chromebook. classOf(id) comes from the game's
// block table (unknown ids count as 'solid'), so this file never needs to know block ids.
export const CLASS_WEIGHT = { air: 0, solid: 0.02, animated: 2, light: 3, belt: 4, circuit: 5, liquid: 6, entity: 6, spawner: 8 }
export const BUDGET = 400    // points allowed across the 3x3 chunks around the player on a floor Chromebook

// edits: Map(idx -> block id) for one chunk. -> { total, by:{class:points} }
export function chunkCost(edits, classOf) {
  const by = {}
  let total = 0
  for (const id of edits.values()) {
    const c = CLASS_WEIGHT[classOf(id)] === undefined ? 'solid' : classOf(id)
    const w = CLASS_WEIGHT[c]
    if (!w) continue
    by[c] = (by[c] || 0) + w
    total += w
  }
  return { total, by }
}

// Sum the 3x3 chunks around (cx,cz). costOf(cx,cz) -> { total, by } (cache it per chunk).
export function nearCost(costOf, cx, cz) {
  const by = {}
  let total = 0
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const c = costOf(cx + dx, cz + dz)
      total += c.total
      for (const k of Object.keys(c.by)) by[k] = (by[k] || 0) + c.by[k]
    }
  }
  return { total, by }
}

// The class doing the most work (ignores 'solid' and 'air'); null if nothing notable.
export function dominant(by) {
  let best = null
  for (const k of Object.keys(by)) if (k !== 'solid' && k !== 'air' && (best === null || by[k] > by[best])) best = k
  return best
}
