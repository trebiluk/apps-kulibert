// Wheat growth. Fixed times, no random ticks. Dry-equivalent 8 min to full; wet soil is 2x.
export const RIPE_MS = 8 * 60 * 1000
export const WET_R = 4
export const DRY = 49
export const WET = 63
export const WATER = 64
export const CROP = [59, 60, 61, 62]

export function isCropId(id) {
  return id >= 59 && id <= 62
}

export function stage(grown) {
  const g = +grown || 0
  if (g <= 0) return 0
  return Math.min(3, Math.floor(g / (RIPE_MS / 4)))
}

export function advance(crop, now) {
  if (!crop) return crop
  const seen = +crop.lastSeen || 0
  if (!(now > seen)) return crop
  const speed = crop.wet ? 2 : 1
  crop.grown = Math.min(RIPE_MS, (+crop.grown || 0) + (now - seen) * speed)
  crop.lastSeen = now
  return crop
}

export function preview(crop, now) {
  const wet = !!(crop && crop.wet)
  let grown = crop ? (+crop.grown || 0) : 0
  const seen = crop ? (+crop.lastSeen || 0) : 0
  if (now > seen) grown = Math.min(RIPE_MS, grown + (now - seen) * (wet ? 2 : 1))
  const speed = wet ? 2 : 1
  const left = grown >= RIPE_MS ? 0 : (RIPE_MS - grown) / speed
  return { grown, wet, stage: stage(grown), left }
}

export function formatLeft(ms) {
  const s = Math.max(0, Math.ceil((+ms || 0) / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m + ':' + String(r).padStart(2, '0')
}

export function nearWater(getVoxel, x, y, z) {
  for (let dx = -WET_R; dx <= WET_R; dx++) {
    for (let dz = -WET_R; dz <= WET_R; dz++) {
      if (getVoxel(x + dx, y, z + dz) === WATER) return true
      if (getVoxel(x + dx, y - 1, z + dz) === WATER) return true
    }
  }
  return false
}

export function createFarm() {
  const map = new Map()
  const key = (x, y, z) => x + ',' + y + ',' + z
  function add(x, y, z, now, wet) {
    const row = { x: x | 0, y: y | 0, z: z | 0, plantedAt: now, grown: 0, wet: !!wet, lastSeen: now }
    map.set(key(row.x, row.y, row.z), row)
    return row
  }
  function get(x, y, z) { return map.get(key(x | 0, y | 0, z | 0)) || null }
  function remove(x, y, z) { map.delete(key(x | 0, y | 0, z | 0)) }
  function dump() {
    return [...map.values()].map((r) => ({
      x: r.x, y: r.y, z: r.z, plantedAt: r.plantedAt, grown: r.grown, wet: !!r.wet, lastSeen: r.lastSeen,
    }))
  }
  function load(list) {
    map.clear()
    if (!Array.isArray(list)) return
    const now = Date.now()
    for (const r of list) {
      if (!r || !Number.isFinite(+r.x) || !Number.isFinite(+r.y) || !Number.isFinite(+r.z)) continue
      const row = {
        x: r.x | 0,
        y: r.y | 0,
        z: r.z | 0,
        plantedAt: Number.isFinite(+r.plantedAt) ? +r.plantedAt : now,
        grown: Math.max(0, Math.min(RIPE_MS, +r.grown || 0)),
        wet: !!r.wet,
        lastSeen: Number.isFinite(+r.lastSeen) ? +r.lastSeen : (Number.isFinite(+r.plantedAt) ? +r.plantedAt : now),
      }
      map.set(key(row.x, row.y, row.z), row)
    }
  }
  function clear() { map.clear() }
  function rows() { return map.values() }
  return { add, get, remove, dump, load, clear, rows }
}
