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
  if (n >= 0.12 && n < 0.28) return 'tuft'
  if (wildBushCell(x, z)) return 'bushFruit'
  return ''
}

// Light density (the spec gives no number): 3 plains bushes and 2 forest-edge
// bushes within a short walk of spawn (18–38 blocks), plus one bush in 42% of
// 28×28 wilderness cells. That scatter is about 1 bush per 1,870 grass blocks.
// Town, roads, ponds, wheat, tufts, trunks and crowns stay clear.
const BUSH_EVERY = 28
function plantBlocked(x, z) {
  if (townTrunk(x, z)) return true
  const h = groundY(x, z)
  if (h <= 1) return true
  if (starterWood(x, h + 1, z)) return true
  if (starterStone(x, h + 1, z)) return true
  if (starterSand(x, h + 1, z)) return true
  if (wildWood(x, h + 1, z)) return true
  if (pondHere(x, h, z) || pondHere(x, h + 1, z) || shoreLow(x, h, z) || shoreLow(x, h + 1, z)) return true
  const n = hash(x, z)
  if (n >= 0.04 && n < 0.07) return true
  if (n >= 0.12 && n < 0.28) return true
  return false
}
function trunkDist(x, z) {
  let best = 999
  const bx = Math.floor(x / 9) * 9 + 4
  const bz = Math.floor(z / 9) * 9 + 4
  for (let ox = -18; ox <= 18; ox += 9) for (let oz = -18; oz <= 18; oz += 9) {
    const tx = bx + ox
    const tz = bz + oz
    if (townTrunk(tx, tz) || hash(tx, tz) >= 0.18) continue
    const d = Math.hypot(x - tx, z - tz)
    if (d < best) best = d
  }
  return best
}
function biomeAt(x, z) {
  const d = trunkDist(x, z)
  if (d >= 1 && d <= 6) return 'forest'
  if (d > 6) return 'plains'
  return ''
}
let nearCache = null
let scanningBushes = false
function nearSpawnBushes() {
  if (nearCache) return nearCache
  if (scanningBushes) return []
  scanningBushes = true
  try {
    const plains = []
    const forest = []
    for (let x = -40; x <= 56; x++) {
      for (let z = -48; z <= 40; z++) {
        const d = Math.hypot(x + 0.5 - POND_SPAWN[0], z + 0.5 - POND_SPAWN[1])
        if (d < 18 || d > 38) continue
        if (plantBlocked(x, z)) continue
        const kind = biomeAt(x, z)
        if (kind === 'plains') plains.push({ x, z, d, kind })
        else if (kind === 'forest') forest.push({ x, z, d, kind })
      }
    }
    plains.sort((a, b) => a.d - b.d || a.x - b.x || a.z - b.z)
    forest.sort((a, b) => a.d - b.d || a.x - b.x || a.z - b.z)
    const picked = []
    const take = (list, n) => {
      for (const s of list) {
        if (picked.filter((p) => p.kind === s.kind).length >= n) return
        if (picked.some((p) => Math.hypot(p.x - s.x, p.z - s.z) < 7)) continue
        picked.push(s)
      }
    }
    take(plains, 3)
    take(forest, 2)
    nearCache = picked
    return picked
  } finally {
    scanningBushes = false
  }
}
function scatterAt(x, z) {
  const cx = Math.floor(x / BUSH_EVERY) * BUSH_EVERY
  const cz = Math.floor(z / BUSH_EVERY) * BUSH_EVERY
  if (hash(cx + 401, cz - 88) >= 0.42) return false
  for (let i = 0; i < 8; i++) {
    const ox = Math.floor(hash(cx + 3 + i * 17, cz + 9) * BUSH_EVERY)
    const oz = Math.floor(hash(cx + 11, cz + 5 + i * 13) * BUSH_EVERY)
    const bx = cx + ox
    const bz = cz + oz
    if (plantBlocked(bx, bz) || !biomeAt(bx, bz)) continue
    return x === bx && z === bz
  }
  return false
}
export function wildBushCell(x, z) {
  if (scanningBushes) return false
  if (nearSpawnBushes().some((s) => s.x === x && s.z === z)) return true
  return scatterAt(x, z)
}
export function starterBushes() {
  return nearSpawnBushes().map((s) => ({
    x: s.x, z: s.z, y: groundY(s.x, s.z) + 1, kind: s.kind, d: Math.round(s.d),
  }))
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

// Still-water ponds a new Survival kid can walk to. Spawn is the feet spot [8.5, _, 1.5].
export const POND_SPAWN = [8.5, 1.5]
const TOWN_Y = 4
const PLOTS = [[18, 25, 4, 11], [18, 25, 15, 22], [4, 11, 16, 23]]

export function surfaceY(x, z) {
  if (x >= -20 && x <= 36 && z >= -18 && z <= 28) return TOWN_Y
  return groundY(x, z)
}

function townGrass(x, z) {
  if (x < -20 || x > 36 || z < -18 || z > 28) return false
  const ice = (x + 10) * (x + 10) + (z - 14) * (z - 14)
  if (ice <= 36) return false
  if (z >= -1 && z <= 1 && x >= -18 && x <= 34) return false
  if (x >= 4 && x <= 13 && z >= 4 && z <= 11) return false
  for (const [x0, x1, z0, z1] of PLOTS) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) return false
  }
  return true
}

function wildBlocked(x, z) {
  const h = groundY(x, z)
  if (h <= 1) return true
  for (let y = h; y <= h + 8; y++) {
    if (wildWood(x, y, z)) return true
    const p = plantHere(x, y, z, h, false)
    if (p === 'log' || p === 'leaves' || p === 'stone' || p === 'sand') return true
  }
  return false
}

function clearGrass(x, z) {
  if (townTrunk(x, z)) return townGrass(x, z)
  return !wildBlocked(x, z)
}

function pondFits(x, z, w) {
  const h = surfaceY(x, z)
  for (let dx = -1; dx <= w; dx++) for (let dz = -1; dz <= w; dz++) {
    const cx = x + dx
    const cz = z + dz
    if (surfaceY(cx, cz) !== h) return false
    if (!clearGrass(cx, cz)) return false
  }
  return true
}

function distSpawn(x, z) {
  const dx = x + 0.5 - POND_SPAWN[0]
  const dz = z + 0.5 - POND_SPAWN[1]
  return Math.hypot(dx, dz)
}

let pondCache = null
export function starterPonds(seed = 1) {
  const s = seed | 0
  if (pondCache && pondCache.seed === s) return pondCache.list
  const want = 2 + (Math.floor(hash(s + 19, 3) * 2) % 2)
  const sx = Math.round(POND_SPAWN[0])
  const sz = Math.round(POND_SPAWN[1])
  const cands = []
  for (let x = sx - 30; x <= sx + 30; x++) {
    for (let z = sz - 30; z <= sz + 30; z++) {
      const sizes = [3, 4, 5]
      const spin = Math.floor(hash(x + s, z + 7) * 3)
      for (let n = 0; n < 3; n++) {
        const size = sizes[(spin + n) % 3]
        let near = 99
        let far = 0
        for (let dx = 0; dx < size; dx++) for (let dz = 0; dz < size; dz++) {
          const d = distSpawn(x + dx, z + dz)
          if (d < near) near = d
          if (d > far) far = d
        }
        if (near < 8 || far > 30) continue
        if (!pondFits(x, z, size)) continue
        cands.push({ x, z, w: size, near })
        break
      }
    }
  }
  cands.sort((a, b) => a.near - b.near || a.x - b.x || a.z - b.z)
  const found = []
  for (const c of cands) {
    if (found.length >= want) break
    if (found.some((p) => c.x < p.x + p.w + 6 && c.x + c.w + 6 > p.x && c.z < p.z + p.w + 6 && c.z + c.w + 6 > p.z)) continue
    const depth = found.length === 0 || c.w < 4 ? 1 : 2
    found.push({ x: c.x, z: c.z, w: c.w, d: depth })
  }
  pondCache = { seed: s, list: found }
  return found
}

export function pondHere(x, y, z, seed = 1) {
  const ponds = starterPonds(seed)
  for (let i = 0; i < ponds.length; i++) {
    const p = ponds[i]
    if (x < p.x || x >= p.x + p.w || z < p.z || z >= p.z + p.w) continue
    const h = surfaceY(x, z)
    const inset = x > p.x && x < p.x + p.w - 1 && z > p.z && z < p.z + p.w - 1
    if (y === h) return true
    if (p.d === 2 && inset && y === h - 1) return true
  }
  return false
}

// The side of a new pond that faces spawn. One grass row steps down 1 block
// so a kid walks to the water instead of meeting a 2-high bank. Old saves
// never call this: their chunks are already stored, and rescue ponds stay flat.
function beachColumn(p, x, z) {
  const cx = p.x + (p.w - 1) / 2
  const cz = p.z + (p.w - 1) / 2
  const dx = POND_SPAWN[0] - cx
  const dz = POND_SPAWN[1] - cz
  if (Math.abs(dx) >= Math.abs(dz)) {
    const sx = dx >= 0 ? p.x + p.w : p.x - 1
    return x === sx && z >= p.z && z < p.z + p.w
  }
  const sz = dz >= 0 ? p.z + p.w : p.z - 1
  return z === sz && x >= p.x && x < p.x + p.w
}

export function shoreLow(x, y, z, seed = 1) {
  const ponds = starterPonds(seed)
  let on = false
  for (let i = 0; i < ponds.length && !on; i++) on = beachColumn(ponds[i], x, z)
  if (!on) return false
  const h = surfaceY(x, z)
  return y === h || y === h + 1 || y === h + 2
}

// 4x4 rescue spots for an old save that has no water yet. Same seed, same order.
export function rescueSpots(seed = 1) {
  const s = seed | 0
  const out = []
  const sx = Math.round(POND_SPAWN[0])
  const sz = Math.round(POND_SPAWN[1])
  for (let x = sx - 25; x <= sx + 25; x++) {
    for (let z = sz - 25; z <= sz + 25; z++) {
      const cx = x + 1.5
      const cz = z + 1.5
      const d = Math.hypot(cx - POND_SPAWN[0], cz - POND_SPAWN[1])
      if (d < 10 || d > 25) continue
      if (!pondFits(x, z, 4)) continue
      if (hash(x + s * 3, z + 11) < 0.35) continue
      out.push({ x, z, w: 4, d: 1 })
    }
  }
  return out
}
