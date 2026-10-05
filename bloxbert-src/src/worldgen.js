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
  if (n < 0.01) return 'woolBlue'
  if (n < 0.02) return 'woolRed'
  if (n < 0.03) return 'woolGreen'
  if (n < 0.04) return 'woolTan'
  if (n < 0.07) return 'wheat'
  return ''
}
