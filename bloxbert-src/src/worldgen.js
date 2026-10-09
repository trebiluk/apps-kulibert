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

function townTrunk(x, z) { return x >= -20 && x <= 36 && z >= -18 && z <= 28 }

function groundY(x, z) {
  return Math.round(3 + 2.2 * Math.sin(x / 19) * Math.cos(z / 23) + 1.2 * Math.sin((x + z) / 11))
}

// Wilderness trees. Same grid and density as before. Each trunk is 4, 5 or 6 logs
// for that spot (the crown still covers the top two). Never inside town.
export function wildWood(x, y, z) {
  const cx = Math.floor(x / 9) * 9 + 4
  const cz = Math.floor(z / 9) * 9 + 4
  if (hash(cx, cz) >= 0.18 || townTrunk(cx, cz)) return ''
  const th = groundY(cx, cz)
  const tall = 4 + Math.floor(hash(cx + 91, cz - 17) * 3)
  const top = th + tall
  if (x === cx && z === cz && y > th && y <= top) return 'log'
  const dy = y - top
  const dx = x - cx
  const dz = z - cz
  if (dy >= -1 && dy <= 1 && Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) return 'leaves'
  return ''
}

// Six full trees just south of Bertyville, each a short walk from spawn [8.5, 1.5].
// Trunks are 6 logs (the normal crown covers the top two). Same spots every new world.
const STARTER = [[-1, -19], [5, -19], [11, -19], [17, -19], [23, -19], [29, -19]]
const TRUNK = 6

function starterWood(x, y, z) {
  for (let i = 0; i < STARTER.length; i++) {
    const tx = STARTER[i][0]
    const tz = STARTER[i][1]
    const dx = x - tx
    const dz = z - tz
    if (dx > 2 || dx < -2 || dz > 2 || dz < -2) continue
    const base = groundY(tx, tz)
    const top = base + TRUNK
    if (dx === 0 && dz === 0 && y > base && y <= top) return 'log'
    const dy = y - top
    if (dy >= -1 && dy <= 1 && Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) return 'leaves'
  }
  return ''
}

// A small stone mound the kid can walk up to, just past the trees. About 24 blocks from spawn.
const ROCK = [8, -23]

function starterStone(x, y, z) {
  const dx = x - ROCK[0]
  const dz = z - ROCK[1]
  if (dx > 1 || dx < -1 || dz > 1 || dz < -1) return false
  const base = groundY(x, z)
  const tall = dx === 0 && dz === 0 ? 3 : 2
  return y > base && y <= base + tall
}

// Nine sand blocks on the grass, just west of that mound and still inside a short walk. Same spot every new world.
const SAND = { x0: 4, x1: 6, z0: -22, z1: -20 }

function starterSand(x, y, z) {
  if (x < SAND.x0 || x > SAND.x1 || z < SAND.z0 || z > SAND.z1) return false
  const base = groundY(x, z)
  return y > base && y <= base + 1
}

export function plantHere(x, y, z, surface, inTown) {
  if (inTown) return ''
  const wood = starterWood(x, y, z)
  if (wood && y > surface) return wood
  if (starterStone(x, y, z) && y > surface) return 'stone'
  if (starterSand(x, y, z) && y > surface) return 'sand'
  if (y !== surface + 1) return ''
  if (surface <= 1) return hash(x, z + 5) < 0.18 ? 'reed' : ''
  const n = hash(x, z)
  if (n >= 0.04 && n < 0.07) return 'wheat'
  return ''
}
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
