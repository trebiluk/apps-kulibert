// What a fresh Survival world grows. Pure, so a node check can prove a kid can find it.
export function hash(x, z) {
  let h = (x * 374761393 + z * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export function coalHere(x, y, z) {
  if (y > -3 || y < -28) return false
  const region = hash(Math.floor(x / 6), Math.floor(z / 6) + Math.floor(y / 4) * 17)
  if (region > 0.42) return false
  return hash(x + y * 13, z) < 0.7
}

export function plantHere(x, y, z, surface, inTown) {
  if (inTown || y !== surface + 1) return ''
  if (surface <= 1) return hash(x, z + 5) < 0.18 ? 'reed' : ''
  const n = hash(x, z)
  if (n >= 0.04 && n < 0.07) return 'wheat'
  return ''
}

function townTrunk(x, z) { return x >= -20 && x <= 36 && z >= -18 && z <= 28 }

// 1 in 4 wheat tufts within 4 blocks of a real tree column also drop a berry.
export function berryTuft(x, y, z) {
  const bx = Math.floor(x / 9) * 9 + 4
  const bz = Math.floor(z / 9) * 9 + 4
  let near = false
  for (let ox = -9; ox <= 9 && !near; ox += 9) for (let oz = -9; oz <= 9; oz += 9) {
    const tx = bx + ox, tz = bz + oz
    if (townTrunk(tx, tz) || hash(tx, tz) >= 0.18) continue
    if (Math.abs(x - tx) <= 4 && Math.abs(z - tz) <= 4) near = true
  }
  if (!near) return false
  const h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1274126177)) >>> 0
  return h % 4 === 0
}
