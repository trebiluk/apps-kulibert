// A tree is a trunk of logs. Distance is to the trunk block, not the crosshair.
export const TREE_NEAR = 1.5
export const TREE_LOOK = 28
export const TREE_HITS = 3
export const HIT_GAP = 320
export const HIT_KEEP = 2600
export const MIN_TRUNK = 3

export function trunkDist(px, pz, tx, tz) {
  const dx = Math.max(tx - px, 0, px - (tx + 1))
  const dz = Math.max(tz - pz, 0, pz - (tz + 1))
  return Math.hypot(dx, dz)
}

export function columnSpan(tx, tz, y, id, getVoxel) {
  let lo = y | 0
  let hi = y | 0
  while (lo > y - 14 && getVoxel(tx, lo - 1, tz) === id) lo--
  while (hi < y + 14 && getVoxel(tx, hi + 1, tz) === id) hi++
  return { lo, hi, n: hi - lo + 1 }
}

const SPAWN_TRUNKS = [[10, 1], [-1, -19], [5, -19], [11, -19], [17, -19], [23, -19], [29, -19]]

function candidates(px, pz, radius) {
  const seen = new Set()
  const out = []
  const push = (x, z) => {
    x = x | 0
    z = z | 0
    if (Math.abs(x + 0.5 - px) > radius + 1 || Math.abs(z + 0.5 - pz) > radius + 1) return
    const k = x + ',' + z
    if (seen.has(k)) return
    seen.add(k)
    out.push([x, z])
  }
  for (let i = 0; i < SPAWN_TRUNKS.length; i++) push(SPAWN_TRUNKS[i][0], SPAWN_TRUNKS[i][1])
  const ox0 = Math.floor(px / 9)
  const oz0 = Math.floor(pz / 9)
  for (let ox = -4; ox <= 4; ox++) for (let oz = -4; oz <= 4; oz++) push((ox0 + ox) * 9 + 4, (oz0 + oz) * 9 + 4)
  const bx0 = Math.floor(px / 10)
  const bz0 = Math.floor(pz / 10)
  for (let ox = -4; ox <= 4; ox++) for (let oz = -4; oz <= 4; oz++) push((bx0 + ox) * 10 + 2, (bz0 + oz) * 10 + 6)
  const px0 = Math.floor(px / 12)
  const pz0 = Math.floor(pz / 12)
  for (let ox = -3; ox <= 3; ox++) for (let oz = -3; oz <= 3; oz++) push((px0 + ox) * 12 + 8, (pz0 + oz) * 12 + 3)
  return out
}

export function nearestTree(px, py, pz, getVoxel, logIds, radius) {
  const r = radius == null ? TREE_LOOK : radius
  const y0 = Math.floor(py) - 3
  const y1 = Math.floor(py) + 8
  const spots = candidates(px, pz, r)
  spots.sort((a, b) => trunkDist(px, pz, a[0], a[1]) - trunkDist(px, pz, b[0], b[1]))
  let best = null
  for (let i = 0; i < spots.length; i++) {
    const x = spots[i][0]
    const z = spots[i][1]
    const d = trunkDist(px, pz, x, z)
    if (d > r) break
    if (best && d >= best.d) break
    let hitY = 0
    let hitId = 0
    for (let y = y0; y <= y1; y++) {
      const id = getVoxel(x, y, z) | 0
      if (logIds.has(id)) { hitY = y; hitId = id; break }
    }
    if (!hitId) continue
    const span = columnSpan(x, z, hitY, hitId, getVoxel)
    if (span.n < MIN_TRUNK) continue
    best = { x, z, id: hitId, d, lo: span.lo, hi: span.hi, n: span.n }
  }
  return best
}

export function fellCells(tree, getVoxel, leafIds) {
  const cells = []
  const seen = new Set()
  const add = (x, y, z) => {
    const k = x + ',' + y + ',' + z
    if (seen.has(k)) return
    seen.add(k)
    cells.push([x, y, z])
  }
  for (let y = tree.lo; y <= tree.hi + 2; y++) {
    const id = getVoxel(tree.x, y, tree.z) | 0
    if (y <= tree.hi || leafIds.has(id)) add(tree.x, y, tree.z)
  }
  const top = tree.hi
  for (let y = top - 2; y <= top + 2; y++) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (!dx && !dz) continue
        if (Math.abs(dx) + Math.abs(dz) + Math.abs(y - top) > 4) continue
        const id = getVoxel(tree.x + dx, y, tree.z + dz) | 0
        if (leafIds.has(id)) add(tree.x + dx, y, tree.z + dz)
      }
    }
  }
  return cells
}

export function takeHit(state, now, key, fresh) {
  if (!state || state.key !== key || now - (state.at || 0) > HIT_KEEP) {
    return { key, hits: 1, at: now, hit: true, fell: false }
  }
  if (!fresh && now - state.at < HIT_GAP) return { key: state.key, hits: state.hits, at: state.at, hit: false, fell: false }
  if (fresh && now - state.at < 40) return { key: state.key, hits: state.hits, at: state.at, hit: false, fell: false }
  const hits = state.hits + 1
  return { key, hits, at: now, hit: true, fell: hits >= TREE_HITS }
}
