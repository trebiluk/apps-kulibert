// What a fresh Survival world grows. Pure, so a node check can prove a kid can find it.
import { blockByKey } from './packs/registry.js'
import './packs/farm/pack.js'
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
export function wildWood(x, y, z, gen, fade) {
  const cx = Math.floor(x / 9) * 9 + 4
  const cz = Math.floor(z / 9) * 9 + 4
  if (hash(cx, cz) >= 0.18 || townTrunk(cx, cz)) return ''
  const th = (gen | 0) >= 4 ? groundAt(cx, cz, gen, fade) : groundY(cx, cz)
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
  if (surface <= 1) return hash(x, z + 5) < 0.18 && blockByKey('reed') ? 'reed' : ''
  const n = hash(x, z)
  if (n >= 0.04 && n < 0.07) return blockByKey('wheat') ? 'wheat' : ''
  if (n >= 0.12 && n < 0.28) return blockByKey('tuft') ? 'tuft' : ''
  if (wildBushCell(x, z)) return blockByKey('bushFruit') ? 'bushFruit' : ''
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

// Spawn smoothing. New worlds only: the generator asks spawnGround.
// Saved chunks never call it. Within 40 of Survival spawn, a pit 2 or more
// deep with no 1-block step within a short walk gets one stair on its lowest
// side. Town, ponds, and trunks stay where they are.
const SMOOTH_R = 40
const STEP_NEAR = 4
let smoothCache = null

function rawColumn(x, z) {
  if (x >= -20 && x <= 36 && z >= -18 && z <= 28) return 4
  return groundY(x, z)
}

function columnWet(x, z) {
  const h = rawColumn(x, z)
  return pondHere(x, h, z) || pondHere(x, h - 1, z) || shoreLow(x, h, z)
}

function columnTrunk(x, z) {
  const h = groundY(x, z)
  const plant = plantHere(x, h + 1, z, h, false)
  if (plant === 'log' || plant === 'stone' || plant === 'sand') return true
  return wildWood(x, h + 1, z) === 'log'
}

function buildSmooth() {
  const map = new Map()
  const skip = new Set()
  const H = (x, z) => {
    const k = x + ',' + z
    return map.has(k) ? map.get(k) : rawColumn(x, z)
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  const sx = 8.5
  const sz = 1.5
  const near = (x, z) => {
    const dx = x + 0.5 - sx
    const dz = z + 0.5 - sz
    return dx * dx + dz * dz <= SMOOTH_R * SMOOTH_R
  }
  function climbDist(x, z) {
    const start = H(x, z)
    const seen = new Set([x + ',' + z])
    const q = [[x, z, 0]]
    while (q.length) {
      const [cx, cz, dist] = q.shift()
      const ch = H(cx, cz)
      for (let i = 0; i < dirs.length; i++) {
        const nx = cx + dirs[i][0]
        const nz = cz + dirs[i][1]
        const nh = H(nx, nz)
        if (nh > start && nh <= ch + 1) return dist + 1
        if (dist >= 12 || nh > ch + 1) continue
        const k = nx + ',' + nz
        if (seen.has(k)) continue
        seen.add(k)
        q.push([nx, nz, dist + 1])
      }
    }
    return 99
  }
  function lowestRim(x, z) {
    const h = H(x, z)
    let best = null
    for (let i = 0; i < dirs.length; i++) {
      const nx = x + dirs[i][0]
      const nz = z + dirs[i][1]
      const nh = H(nx, nz)
      if (nh < h + 2) continue
      const d = Math.hypot(nx + 0.5 - sx, nz + 0.5 - sz)
      if (!best || nh < best.nh || (nh === best.nh && d < best.d)) best = { nh, dx: dirs[i][0], dz: dirs[i][1], d }
    }
    return best
  }
  function layStair(x, z) {
    const rim = lowestRim(x, z)
    if (!rim) return false
    let cx = x
    let cz = z
    let want = rim.nh - 1
    let laid = false
    for (let n = 0; n < 6 && want >= 0; n++) {
      const inTown = cx >= -20 && cx <= 36 && cz >= -18 && cz <= 28
      if (inTown || columnWet(cx, cz)) {
        if (n === 0) return false
        break
      }
      if (columnTrunk(cx, cz)) {
        if (n === 0) return false
        break
      }
      const cur = H(cx, cz)
      if (cur > want) break
      if (cur < want) {
        map.set(cx + ',' + cz, want)
        laid = true
      } else break
      cx -= rim.dx
      cz -= rim.dz
      want -= 1
    }
    return laid
  }
  for (let guard = 0; guard < 24; guard++) {
    let pick = null
    for (let x = Math.floor(sx - SMOOTH_R); x <= Math.ceil(sx + SMOOTH_R); x++) {
      for (let z = Math.floor(sz - SMOOTH_R); z <= Math.ceil(sz + SMOOTH_R); z++) {
        if (!near(x, z) || skip.has(x + ',' + z)) continue
        if (x >= -20 && x <= 36 && z >= -18 && z <= 28) continue
        if (!lowestRim(x, z)) continue
        const dist = climbDist(x, z)
        if (dist <= STEP_NEAR) continue
        const rim = lowestRim(x, z)
        const spawnD = Math.hypot(x + 0.5 - sx, z + 0.5 - sz)
        const cand = { x, z, dist, rim: rim.nh, spawnD }
        if (!pick || cand.dist > pick.dist || (cand.dist === pick.dist && (cand.rim < pick.rim || (cand.rim === pick.rim && cand.spawnD < pick.spawnD)))) pick = cand
      }
    }
    if (!pick) break
    if (!layStair(pick.x, pick.z)) skip.add(pick.x + ',' + pick.z)
  }
  return map
}

export function spawnGround(x, z) {
  if (x >= -20 && x <= 36 && z >= -18 && z <= 28) return 4
  if (!smoothCache) smoothCache = buildSmooth()
  const v = smoothCache.get((x | 0) + ',' + (z | 0))
  return v == null ? groundY(x, z) : v
}

// Gen 2 is the original ground. Gen 3 adds the sand and clay banks.
// Gen 4 adds hills and beaches, and only on chunks that stamp 4.
// Gen 2 and gen 3 stay byte-identical.
export const GEN = 4
export const CHUNK = 24
export const GEN_MARGIN = 4
const TOWN_BOX = { x0: -20, x1: 36, y0: -64, y1: 8, z0: -18, z1: 28 }

function inTownXZ(x, z) {
  return x >= TOWN_BOX.x0 && x <= TOWN_BOX.x1 && z >= TOWN_BOX.z0 && z <= TOWN_BOX.z1
}

function townName(x, y, z) {
  const h = TOWN_Y
  if (y < h - 3) return coalHere(x, y, z) ? 'coal' : 'stone'
  if (y < h) return 'dirt'
  const pond = (x + 10) * (x + 10) + (z - 14) * (z - 14)
  const road = z >= -1 && z <= 1 && x >= -18 && x <= 34
  const shop = x >= 4 && x <= 13 && z >= 4 && z <= 11
  const plotA = x >= 18 && x <= 25 && z >= 4 && z <= 11
  const plotB = x >= 18 && x <= 25 && z >= 15 && z <= 22
  const plotC = x >= 4 && x <= 11 && z >= 16 && z <= 23
  if (y === h) {
    if (pond <= 16) return 'ice'
    if (pond <= 36) return 'sand'
    if (road) return 'gravel'
    if (shop) return 'planks'
    if (plotA || plotB || plotC) {
      const edge = x === 18 || x === 25 || z === 4 || z === 11 || z === 15 || z === 22 || z === 16 || z === 23
      return edge ? 'gravel' : 'grass'
    }
    return 'grass'
  }
  if (y > h && y <= h + 4 && shop) {
    const edge = x === 4 || x === 13 || z === 4 || z === 11
    const door = z === 4 && x >= 7 && x <= 10 && y <= h + 2
    const window = x === 13 && z === 7 && y === h + 2
    const post = (x === 4 || x === 13) && (z === 4 || z === 11)
    if (door) return ''
    if (window) return 'glass'
    if (post) return 'log'
    if (edge && y <= h + 3) return 'brickRed'
    if (y === h + 4) return 'planks'
    if (x === 8 && z === 9 && y === h + 1) return 'storeCounter'
    if (x === 6 && z === 8 && y === h + 1) return 'workbench'
    if (x === 11 && z === 8 && y === h + 1) return 'oven'
    if (x === 10 && z === 6 && y === h + 1) return 'bunk'
    return ''
  }
  if (y === h + 1) {
    if ((plotA && ((x === 18 && z === 4) || (x === 25 && z === 4) || (x === 18 && z === 11) || (x === 25 && z === 11)))
      || (plotB && ((x === 18 && z === 15) || (x === 25 && z === 15) || (x === 18 && z === 22) || (x === 25 && z === 22)))
      || (plotC && ((x === 4 && z === 16) || (x === 11 && z === 16) || (x === 4 && z === 23) || (x === 11 && z === 23)))) return 'brickGrey'
    if (x === 2 && z === 2) return 'log'
  }
  if (y === h + 2 && x === 2 && z === 2) return 'woolBlue'
  return ''
}

function genCore(x, y, z) {
  if (y === -64) return 'coreplate'
  if (y < -64) return ''
  if (pondHere(x, y, z)) return 'water'
  if (y > surfaceY(x, z) && pondHere(x, y - 1, z)) return ''
  if (shoreLow(x, y, z)) return ''
  if (inTownXZ(x, z)) return townName(x, y, z)
  const h = spawnGround(x, z)
  if (y > h) {
    const grew = wildWood(x, y, z)
    if (grew === 'log' || grew === 'leaves') return grew
    const plant = plantHere(x, y, z, h, false)
    if (plant) return plant
    return ''
  }
  if (y === h) return h <= 1 ? 'sand' : 'grass'
  if (y > h - 3) return 'dirt'
  if (y > -64 && coalHere(x, y, z)) return 'coal'
  if (y > -64) return 'stone'
  return ''
}

function bandWidth(x, z) {
  return 3 + Math.floor(hash(x, z) * 4)
}

function pondBand(x, z) {
  const ponds = starterPonds(1)
  let best = null
  for (let i = 0; i < ponds.length; i++) {
    const p = ponds[i]
    const dx = x < p.x ? p.x - x : x > p.x + p.w - 1 ? x - (p.x + p.w - 1) : 0
    const dz = z < p.z ? p.z - z : z > p.z + p.w - 1 ? z - (p.z + p.w - 1) : 0
    const d = Math.max(Math.abs(dx), Math.abs(dz))
    if (best && d >= best.d) continue
    best = { d, x: p.x, z: p.z, kind: p.w >= 5 || p.d === 2 ? 'lake' : 'pond' }
  }
  if (!best || best.d === 0) return null
  const w = bandWidth(best.x, best.z)
  if (best.d > w) return null
  return { d: best.d, w, kind: best.kind, x: best.x, z: best.z }
}

function lowBand(x, z) {
  let best = null
  for (let dx = -6; dx <= 6; dx++) {
    for (let dz = -6; dz <= 6; dz++) {
      const cx = x + dx
      const cz = z + dz
      if (spawnGround(cx, cz) > 1) continue
      let rim = false
      if (spawnGround(cx + 1, cz) >= 2 || spawnGround(cx - 1, cz) >= 2 || spawnGround(cx, cz + 1) >= 2 || spawnGround(cx, cz - 1) >= 2) rim = true
      if (!rim) continue
      const d = Math.max(Math.abs(dx), Math.abs(dz))
      if (best && d >= best.d) continue
      best = { d, x: cx, z: cz }
    }
  }
  if (!best) return null
  const w = bandWidth(best.x + 13, best.z - 7)
  if (best.d > w) return null
  return { d: best.d, w, kind: 'low', x: best.x, z: best.z }
}

const bandCache = new Map()
function bandAt(x, z) {
  const k = (x | 0) + ',' + (z | 0)
  if (bandCache.has(k)) return bandCache.get(k)
  if (bandCache.size > 12000) bandCache.clear()
  const pond = pondBand(x, z)
  const low = lowBand(x, z)
  const hit = pond || low
  bandCache.set(k, hit)
  return hit
}

function soilName(name) {
  return !name || name === 'grass' || name === 'sand' || name === 'dirt' || name === 'gravel'
}

function gen3(x, y, z, base) {
  if (inTownXZ(x, z)) return base
  if (pondHere(x, y, z) || shoreLow(x, y, z)) return base
  const h = spawnGround(x, z)
  const band = bandAt(x, z)
  if (!band) return base
  const edge = band.d === band.w && hash(x + 4, z - 2) < 0.45
  if (y === h && soilName(base)) return edge ? 'gravel' : 'sand'
  if (y === h - 1 && band.kind !== 'low' && band.d <= 2 && !edge && (base === 'dirt' || base === 'sand')) return 'clay'
  if (y === h - 1 && band.kind === 'low' && band.d <= 1 && !edge && (base === 'dirt' || base === 'sand')) return 'clay'
  return base
}

function lerp(a, b, t) { return a + (b - a) * t }
function smoothStep(t) { return t * t * (3 - 2 * t) }

function vnoise(x, z, period) {
  const x0 = Math.floor(x / period)
  const z0 = Math.floor(z / period)
  const fx = x / period - x0
  const fz = z / period - z0
  const sx = smoothStep(fx)
  const sz = smoothStep(fz)
  return lerp(lerp(hash(x0, z0), hash(x0 + 1, z0), sx), lerp(hash(x0, z0 + 1), hash(x0 + 1, z0 + 1), sx), sz)
}

function distTown(x, z) {
  let dx = 0
  let dz = 0
  if (x < TOWN_BOX.x0) dx = TOWN_BOX.x0 - x
  else if (x > TOWN_BOX.x1) dx = x - TOWN_BOX.x1
  if (z < TOWN_BOX.z0) dz = TOWN_BOX.z0 - z
  else if (z > TOWN_BOX.z1) dz = z - TOWN_BOX.z1
  return Math.hypot(dx, dz)
}

function flatFactor(x, z) {
  const spawnD = Math.hypot(x + 0.5 - POND_SPAWN[0], z + 0.5 - POND_SPAWN[1])
  const d = Math.min(spawnD, distTown(x, z))
  if (d <= 48) return 0
  if (d >= 60) return 1
  return (d - 48) / 12
}

function pondFoot(x, z) {
  if (Math.hypot(x + 0.5 - POND_SPAWN[0], z + 0.5 - POND_SPAWN[1]) > 36) return false
  const ponds = starterPonds(1)
  for (let i = 0; i < ponds.length; i++) {
    const p = ponds[i]
    if (x >= p.x && x < p.x + p.w && z >= p.z && z < p.z + p.w) return true
  }
  return false
}

const hillCache = new Map()
const coastCache = new Map()
const gyCache = new Map()

function cachedGround(x, z) {
  const k = x + ',' + z
  const v = gyCache.get(k)
  if (v != null) return v
  if (gyCache.size > 40000) gyCache.clear()
  const h = spawnGround(x, z)
  gyCache.set(k, h)
  return h
}

function coastDist(x, z) {
  const k = x + ',' + z
  const hit = coastCache.get(k)
  if (hit != null) return hit
  if (coastCache.size > 20000) coastCache.clear()
  let best = 19
  if (cachedGround(x, z) <= 1) best = 0
  else {
    for (let r = 1; r <= 18; r++) {
      let found = false
      for (let dx = -r; dx <= r && !found; dx++) {
        if (cachedGround(x + dx, z - r) <= 1 || cachedGround(x + dx, z + r) <= 1) found = true
        else if (Math.abs(dx) !== r && (cachedGround(x - r, z + dx) <= 1 || cachedGround(x + r, z + dx) <= 1)) found = true
      }
      if (found) { best = r; break }
    }
  }
  coastCache.set(k, best)
  return best
}

// Two octaves of the existing hash. Hills add at most 12. They scale to 0
// within 48 of spawn and the town, and they stay 0 on a pond footprint and
// on the low beach (so the sand band keeps the gen-3 shore).
function hillsAt(x, z) {
  const k = x + ',' + z
  const hit = hillCache.get(k)
  if (hit != null) return hit
  if (hillCache.size > 20000) hillCache.clear()
  let v = 0
  const f = flatFactor(x, z)
  if (f > 0 && !pondFoot(x, z)) {
    const c = coastDist(x, z)
    if (c > 6) {
      const ramp = c >= 18 ? 1 : (c - 6) / 12
      const n = vnoise(x, z, 48) * 0.62 + vnoise(x + 17, z - 9, 18) * 0.38
      v = Math.round(Math.min(12, n * 12) * f * ramp)
      if (v > 12) v = 12
      if (v < 0) v = 0
    }
  }
  hillCache.set(k, v)
  return v
}

function fadeNum(fade, x, z) {
  const n = typeof fade === 'function' ? fade(x, z) : fade
  if (n == null || n >= 12) return 12
  return n > 0 ? n : 0
}

export function groundAt(x, z, gen, fade) {
  const xi = x | 0
  const zi = z | 0
  const base = spawnGround(xi, zi)
  if ((gen | 0) < 4) return base
  let add = hillsAt(xi, zi)
  const f = fadeNum(fade, xi, zi)
  if (f < 12) add = Math.round(add * f / 12)
  const h = base + add
  return h > 23 ? 23 : h
}

function genCore4(x, y, z, fade) {
  if (y === -64) return 'coreplate'
  if (y < -64) return ''
  if (pondHere(x, y, z)) return 'water'
  if (y > surfaceY(x, z) && pondHere(x, y - 1, z)) return ''
  if (shoreLow(x, y, z)) return ''
  if (inTownXZ(x, z)) return townName(x, y, z)
  const h = groundAt(x, z, 4, fade)
  if (y > h) {
    const grew = wildWood(x, y, z, 4, fade)
    if (grew === 'log' || grew === 'leaves') return grew
    const plant = plantHere(x, y, z, h, false)
    if (plant) return plant
    return ''
  }
  if (y === h) return h <= 1 ? 'sand' : 'grass'
  if (y > h - 3) return 'dirt'
  if (y > -64 && coalHere(x, y, z)) return 'coal'
  if (y > -64) return 'stone'
  return ''
}

function gen4(x, y, z, fade) {
  if (y > 23) return ''
  const base = genCore4(x, y, z, fade)
  if (inTownXZ(x, z) || pondHere(x, y, z) || shoreLow(x, y, z)) return base
  const h = groundAt(x, z, 4, fade)
  // The beach and the pond banks use the gen-3 painter on any column the
  // hill did not lift. A lifted column keeps the new grass surface.
  if (h === spawnGround(x, z)) return gen3(x, y, z, base)
  return base
}

export function genBlock(x, y, z, gen, fade) {
  const g = gen | 0
  const xi = x | 0
  const yi = y | 0
  const zi = z | 0
  if (g >= 4) return gen4(xi, yi, zi, fade)
  const base = genCore(xi, yi, zi)
  if (g >= 3) return gen3(xi, yi, zi, base)
  return base
}

export function exploredSeen(chunks, chunkSize = CHUNK) {
  const S = chunkSize | 0 || CHUNK
  let i0 = Math.floor(TOWN_BOX.x0 / S)
  let i1 = Math.floor(TOWN_BOX.x1 / S)
  let j0 = Math.floor(TOWN_BOX.y0 / S)
  let j1 = Math.floor(TOWN_BOX.y1 / S)
  let k0 = Math.floor(TOWN_BOX.z0 / S)
  let k1 = Math.floor(TOWN_BOX.z1 / S)
  for (const key of Object.keys(chunks || {})) {
    const m = /^(-?\d+),(-?\d+),(-?\d+)$/.exec(key)
    if (!m) continue
    const i = +m[1]
    const j = +m[2]
    const k = +m[3]
    if (i < i0) i0 = i
    if (i > i1) i1 = i
    if (j < j0) j0 = j
    if (j > j1) j1 = j
    if (k < k0) k0 = k
    if (k > k1) k1 = k
  }
  i0 -= GEN_MARGIN
  i1 += GEN_MARGIN
  j0 -= GEN_MARGIN
  j1 += GEN_MARGIN
  k0 -= GEN_MARGIN
  k1 += GEN_MARGIN
  const seen = {}
  for (let i = i0; i <= i1; i++) {
    for (let j = j0; j <= j1; j++) {
      for (let k = k0; k <= k1; k++) seen[i + ',' + j + ',' + k] = 2
    }
  }
  return seen
}
