// Bertyville spawn. Stations the class needs, and what a student may not change.
export const FLOOR = 4

// Workshop floor stations. Worldgen places them on a new world. A saved chunk is left alone.
export const STATIONS = [
  { x: 6, z: 8, id: 'workbench' },
  { x: 11, z: 8, id: 'oven' },
  { x: 8, z: 9, id: 'storeCounter' },
  { x: 10, z: 6, id: 'bunk' },
]

const PLOTS = [[18, 25, 4, 11], [18, 25, 15, 22], [4, 11, 16, 23]]

export const PROTECT_R = { off: 0, small: 8, medium: 16, large: 32 }
export const TOWN_AT = [8, FLOOR, 8]

export function plotInterior(x, z) {
  return PLOTS.some(([x0, x1, z0, z1]) => x >= x0 + 1 && x <= x1 - 1 && z >= z0 + 1 && z <= z1 - 1)
}

export function plotRing(x, z) {
  return PLOTS.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1 && (x === x0 || x === x1 || z === z0 || z === z1))
}

export function keptCell(x, y, z) {
  const shop = x >= 4 && x <= 13 && z >= 4 && z <= 11 && y >= FLOOR - 1 && y <= FLOOR + 4
  const road = z >= -1 && z <= 1 && x >= -18 && x <= 34 && y >= FLOOR - 1 && y <= FLOOR
  const pond = (x + 10) * (x + 10) + (z - 14) * (z - 14) <= 36 && y >= FLOOR - 1 && y <= FLOOR
  const ring = plotRing(x, z) && y >= FLOOR && y <= FLOOR + 1
  return shop || road || pond || ring
}

export function protectRadius(size) {
  return PROTECT_R[size] || 0
}

export function protectedCell(x, y, z, p) {
  const size = p && p.size
  if (size === 'off') return false
  if (!p || !p.center) return keptCell(x, y, z)
  const r = protectRadius(size)
  if (!r) return keptCell(x, y, z)
  const c = p.center
  const dx = x - c[0]
  const dz = z - c[2]
  const inY = y >= FLOOR - 1 && y <= FLOOR + 8
  if (inY && dx * dx + dz * dz <= r * r) return true
  const tx = TOWN_AT[0] - c[0]
  const tz = TOWN_AT[2] - c[2]
  if (tx * tx + tz * tz <= r * r && keptCell(x, y, z)) return true
  return false
}
