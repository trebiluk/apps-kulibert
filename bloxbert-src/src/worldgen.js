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
  // Trees skip a gen-5 river or lake column. Gen 4 and older never ask.
  if ((gen | 0) >= 5 && columnWater(cx, cz, fade)) return ''
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
// Gen 5 adds rivers and lakes, and only on chunks that stamp 5.
// Gen 2, 3 and 4 stay byte-identical.
// NOTE: Lily pads, fish, and the reed-paper recipe are not this step.
export const GEN = 5
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
  const tile = tileLRU.get(tileKey(Math.floor(x / TILE) * TILE, Math.floor(z / TILE) * TILE))
  if (tile) {
    const i0 = x - tile.ox
    const k0 = z - tile.oz
    if (i0 >= 7 && k0 >= 7 && i0 < WIDE - 7 && k0 < WIDE - 7) {
      if (tile.coast[i0 * WIDE + k0] > 6) return null
      let best = null
      for (let dx = -6; dx <= 6; dx++) {
        for (let dz = -6; dz <= 6; dz++) {
          const ii = i0 + dx
          const kk = k0 + dz
          if (tile.base[ii * WIDE + kk] > 1) continue
          const rim = tile.base[(ii + 1) * WIDE + kk] >= 2 || tile.base[(ii - 1) * WIDE + kk] >= 2 || tile.base[ii * WIDE + kk + 1] >= 2 || tile.base[ii * WIDE + kk - 1] >= 2
          if (!rim) continue
          const d = dx < 0 ? -dx : dx
          const adz = dz < 0 ? -dz : dz
          const dist = d > adz ? d : adz
          if (best && dist >= best.d) continue
          best = { d: dist, x: x + dx, z: z + dz }
        }
      }
      if (!best) return null
      const w = bandWidth(best.x + 13, best.z - 7)
      if (best.d > w) return null
      return { d: best.d, w, kind: 'low', x: best.x, z: best.z }
    }
  }
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
  let low = null
  const known = wideAt(x, z)
  if (!(known && known.coast > 6)) low = lowBand(x, z)
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
const TILE = 24
const SEARCH = 18
const COAST_PAD = SEARCH + 4
const COAST_CAP = 19
const WIDE = TILE + COAST_PAD * 2
const TILE_MAX = 64
const tileLRU = new Map()

function numKey(x, z) {
  return (x + 32768) * 65536 + z
}

function tileKey(x0, z0) {
  return (x0 + 32768) * 65536 + z0
}

function rememberTile(tile) {
  const k = tileKey(tile.x0, tile.z0)
  if (tileLRU.has(k)) tileLRU.delete(k)
  tileLRU.set(k, tile)
  while (tileLRU.size > TILE_MAX) tileLRU.delete(tileLRU.keys().next().value)
}

// A wide-tile sample is exact when the whole Chebyshev search fits in the
// tile, or when the nearest low cell is closer than the tile edge.
function wideAt(x, z) {
  const x0 = Math.floor(x / TILE) * TILE
  const z0 = Math.floor(z / TILE) * TILE
  const home = tileLRU.get(tileKey(x0, z0))
  const hit = readWide(home, x, z)
  if (hit) return hit
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dz) continue
      const tile = tileLRU.get(tileKey(x0 + dx * TILE, z0 + dz * TILE))
      const near = readWide(tile, x, z)
      if (near) return near
    }
  }
  return null
}

function readWide(tile, x, z) {
  if (!tile) return null
  const i = x - tile.ox
  const k = z - tile.oz
  if (i < 0 || k < 0 || i >= WIDE || k >= WIDE) return null
  const p = i * WIDE + k
  const coast = tile.coast[p]
  const inset = Math.min(i, k, WIDE - 1 - i, WIDE - 1 - k)
  if (inset < SEARCH && coast > inset) return null
  return { base: tile.base[p], hills: tile.hills[p], coast }
}

function cachedGround(x, z) {
  const w = wideAt(x, z)
  if (w) return w.base
  const k = numKey(x, z)
  const v = gyCache.get(k)
  if (v != null) return v
  if (gyCache.size > 40000) gyCache.clear()
  const h = spawnGround(x, z)
  gyCache.set(k, h)
  return h
}

function coastDist(x, z) {
  const w = wideAt(x, z)
  if (w) return w.coast
  const k = numKey(x, z)
  const hit = coastCache.get(k)
  if (hit != null) return hit
  if (coastCache.size > 20000) coastCache.clear()
  let best = COAST_CAP
  if (cachedGround(x, z) <= 1) best = 0
  else {
    for (let r = 1; r <= SEARCH; r++) {
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

function hillsFrom(x, z, coast) {
  let v = 0
  const f = flatFactor(x, z)
  if (f > 0 && !pondFoot(x, z)) {
    if (coast > 6) {
      const ramp = coast >= 18 ? 1 : (coast - 6) / 12
      const n = vnoise(x, z, 48) * 0.62 + vnoise(x + 17, z - 9, 18) * 0.38
      v = Math.round(Math.min(12, n * 12) * f * ramp)
      if (v > 12) v = 12
      if (v < 0) v = 0
    }
  }
  return v
}

// Two octaves of the existing hash. Hills add at most 12. They scale to 0
// within 48 of spawn and the town, and they stay 0 on a pond footprint and
// on the low beach (so the sand band keeps the gen-3 shore).
function hillsAt(x, z) {
  const w = wideAt(x, z)
  if (w) return w.hills
  const k = numKey(x, z)
  const hit = hillCache.get(k)
  if (hit != null) return hit
  if (hillCache.size > 20000) hillCache.clear()
  const v = hillsFrom(x, z, coastDist(x, z))
  hillCache.set(k, v)
  return v
}

function buildTile(x0, z0) {
  const ox = x0 - COAST_PAD
  const oz = z0 - COAST_PAD
  const coast = new Int16Array(WIDE * WIDE)
  const base = new Int16Array(WIDE * WIDE)
  const hills = new Int16Array(WIDE * WIDE)
  for (let i = 0; i < WIDE; i++) {
    for (let k = 0; k < WIDE; k++) {
      const p = i * WIDE + k
      const b = spawnGround(ox + i, oz + k)
      base[p] = b
      coast[p] = b <= 1 ? 0 : COAST_CAP
    }
  }
  for (let i = 0; i < WIDE; i++) {
    for (let k = 0; k < WIDE; k++) {
      const p = i * WIDE + k
      let d = coast[p]
      if (i > 0) {
        const a = coast[p - WIDE] + 1
        if (a < d) d = a
      }
      if (k > 0) {
        const a = coast[p - 1] + 1
        if (a < d) d = a
      }
      if (i > 0 && k > 0) {
        const a = coast[p - WIDE - 1] + 1
        if (a < d) d = a
      }
      if (i > 0 && k + 1 < WIDE) {
        const a = coast[(i - 1) * WIDE + (k + 1)] + 1
        if (a < d) d = a
      }
      coast[p] = d < COAST_CAP ? d : COAST_CAP
    }
  }
  for (let i = WIDE - 1; i >= 0; i--) {
    for (let k = WIDE - 1; k >= 0; k--) {
      const p = i * WIDE + k
      let d = coast[p]
      if (i + 1 < WIDE) {
        const a = coast[p + WIDE] + 1
        if (a < d) d = a
      }
      if (k + 1 < WIDE) {
        const a = coast[p + 1] + 1
        if (a < d) d = a
      }
      if (i + 1 < WIDE && k + 1 < WIDE) {
        const a = coast[p + WIDE + 1] + 1
        if (a < d) d = a
      }
      if (i + 1 < WIDE && k > 0) {
        const a = coast[p + WIDE - 1] + 1
        if (a < d) d = a
      }
      coast[p] = d < COAST_CAP ? d : COAST_CAP
    }
  }
  for (let i = 0; i < WIDE; i++) {
    for (let k = 0; k < WIDE; k++) {
      const p = i * WIDE + k
      hills[p] = hillsFrom(ox + i, oz + k, coast[p])
    }
  }
  return { x0, z0, ox, oz, base, hills, coast }
}

function fadeOf(fadeArr, idx) {
  if (!fadeArr) return 12
  let f = fadeArr[idx]
  if (f == null || f >= 12) return 12
  return f > 0 ? f : 0
}

// One 24x24 column tile. h is the faded ground. base, hills and coast do
// not depend on fade. coast is an exact capped Chebyshev distance.
export function genColumns(x0, z0, gen, fadeArr) {
  const x0i = Math.floor(x0 / TILE) * TILE
  const z0i = Math.floor(z0 / TILE) * TILE
  let tile = tileLRU.get(tileKey(x0i, z0i))
  if (!tile) {
    tile = buildTile(x0i, z0i)
    rememberTile(tile)
  }
  const h = new Int16Array(TILE * TILE)
  const base = new Int16Array(TILE * TILE)
  const hills = new Int16Array(TILE * TILE)
  const coast = new Int16Array(TILE * TILE)
  const g = gen | 0
  let minH = 32767
  for (let i = 0; i < TILE; i++) {
    for (let k = 0; k < TILE; k++) {
      const p = (i + COAST_PAD) * WIDE + (k + COAST_PAD)
      const idx = i * TILE + k
      const b = tile.base[p]
      const hi = tile.hills[p]
      base[idx] = b
      hills[idx] = hi
      coast[idx] = tile.coast[p]
      let add = g >= 4 ? hi : 0
      if (g >= 4) {
        const f = fadeOf(fadeArr, idx)
        if (f < 12) add = Math.round(add * f / 12)
      }
      let hh = b + add
      if (hh > 23) hh = 23
      h[idx] = hh
      if (hh < minH) minH = hh
    }
  }
  let water = null
  let hasWater = false
  if (g >= 5) {
    water = new Array(TILE * TILE)
    for (let i = 0; i < TILE; i += 4) {
      for (let k = 0; k < TILE; k += 4) {
        const n = vnoise(x0i + i + 2, z0i + k + 2, 88)
        const rx = Math.floor((x0i + i) / LAKE_EVERY)
        const rz = Math.floor((z0i + k) / LAKE_EVERY)
        const L = lakeDef(rx, rz)
        let nearLake = false
        if (L) {
          const dx = x0i + i + 2 - L.cx
          const dz = z0i + k + 2 - L.cz
          nearLake = dx * dx + dz * dz <= (L.rad + 6) * (L.rad + 6)
        }
        if (!nearLake && Math.abs(n - 0.5) > 0.22) continue
        for (let di = 0; di < 4; di++) {
          for (let dk = 0; dk < 4; dk++) {
            const idx = (i + di) * TILE + (k + dk)
            const f = fadeOf(fadeArr, idx)
            const rec = f >= 12 ? columnWaterRaw(x0i + i + di, z0i + k + dk) : null
            water[idx] = rec
            if (rec) hasWater = true
          }
        }
      }
    }
    if (!hasWater) water = null
  }
  return { x0: x0i, z0: z0i, h, base, hills, coast, minH, water, hasWater }
}

export function peekColumn(x, z) {
  return wideAt(x | 0, z | 0)
}

export function solidUnder(x, y, z) {
  if (y === -64) return 'coreplate'
  if (y < -64 || y > 23) return ''
  return coalHere(x, y, z) ? 'coal' : 'stone'
}

// True when every voxel of the chunk is stone, coal or the core plate.
// Pond, shore and town decorations stay on the real generator.
export function underAll(x0, y0, z0, cols) {
  const yTop = y0 + TILE - 1
  if (!(yTop < cols.minH - 3)) return false
  let minSurf = 999
  let town = false
  for (let i = 0; i < TILE; i++) {
    for (let k = 0; k < TILE; k++) {
      const x = x0 + i
      const z = z0 + k
      const s = surfaceY(x, z)
      if (s < minSurf) minSurf = s
      if (!town && x >= -20 && x <= 36 && z >= -18 && z <= 28) town = true
    }
  }
  if (yTop >= minSurf - 1) return false
  if (town && yTop >= 1) return false
  return true
}

function fadeNum(fade, x, z) {
  const n = typeof fade === 'function' ? fade(x, z) : fade
  if (n == null || n >= 12) return 12
  return n > 0 ? n : 0
}

function colsIndex(cols, x, z) {
  if (!cols) return -1
  const i = x - cols.x0
  const k = z - cols.z0
  if (i < 0 || k < 0 || i >= TILE || k >= TILE) return -1
  return i * TILE + k
}

export function groundAt(x, z, gen, fade, cols) {
  const xi = x | 0
  const zi = z | 0
  if ((gen | 0) >= 5) {
    const w = columnWater(xi, zi, fade, cols)
    if (w && w.kind === 'water') return w.top
  }
  const idx = colsIndex(cols, xi, zi)
  if ((gen | 0) < 4) {
    if (idx >= 0) return cols.base[idx]
    const w = wideAt(xi, zi)
    if (w) return w.base
    return spawnGround(xi, zi)
  }
  if (idx >= 0) return cols.h[idx]
  const w = wideAt(xi, zi)
  let base
  let add
  if (w) {
    base = w.base
    add = w.hills
  } else {
    base = spawnGround(xi, zi)
    add = hillsAt(xi, zi)
  }
  const f = fadeNum(fade, xi, zi)
  if (f < 12) add = Math.round(add * f / 12)
  const h = base + add
  return h > 23 ? 23 : h
}

function genCore4(x, y, z, fade, cols) {
  if (y === -64) return 'coreplate'
  if (y < -64) return ''
  if (pondHere(x, y, z)) return 'water'
  if (y > surfaceY(x, z) && pondHere(x, y - 1, z)) return ''
  if (shoreLow(x, y, z)) return ''
  if (inTownXZ(x, z)) return townName(x, y, z)
  const h = groundAt(x, z, 4, fade, cols)
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

function columnBase(x, z, cols) {
  const idx = colsIndex(cols, x, z)
  if (idx >= 0) return cols.base[idx]
  const w = wideAt(x, z)
  if (w) return w.base
  return spawnGround(x, z)
}

function gen4(x, y, z, fade, cols) {
  if (y > 23) return ''
  const base = genCore4(x, y, z, fade, cols)
  if (inTownXZ(x, z) || pondHere(x, y, z) || shoreLow(x, y, z)) return base
  const h = groundAt(x, z, 4, fade, cols)
  // The beach and the pond banks use the gen-3 painter on any column the
  // hill did not lift. A lifted column keeps the new grass surface.
  if (h === columnBase(x, z, cols)) return gen3(x, y, z, base)
  return base
}

// Gen 5 water. Still water only: no flow sim. A column's answer depends on
// the seed and the column, never on which chunk asked. Gen 4 and older do
// not call this. Lily pads, fish, and the reed-paper recipe are not this step.
const LAKE_EVERY = 96
const waterMemo = new Map()
const channelMemo = new Map()
const lakeMemo = new Map()

function terrainAt(x, z) {
  return groundAt(x, z, 4, null, null)
}

function riverHalf(x, z) {
  // 1.5..2.0 so an axis-aligned cut is 3, 4, or 5 blocks, never 6.
  return 1.5 + vnoise(x + 420, z - 180, 64) * 0.5
}

function riverDist(x, z) {
  const n = vnoise(x, z, 88)
  const ex = vnoise(x + 2, z, 88) - vnoise(x - 2, z, 88)
  const ez = vnoise(x, z + 2, 88) - vnoise(x, z - 2, 88)
  const g = Math.hypot(ex, ez)
  if (g < 1e-4) return 99
  return (n - 0.5) * 4 / g
}

function keptClear(x, z) {
  if (flatFactor(x, z) <= 0) return true
  if (z >= -1 && z <= 1 && x >= -18 && x <= 34) return true
  const h = terrainAt(x, z)
  if (pondHere(x, h, z) || pondHere(x, h - 1, z) || shoreLow(x, h, z) || shoreLow(x, h + 1, z)) return true
  return false
}

function treeHere(x, z) {
  const h = terrainAt(x, z)
  for (let y = h + 1; y <= h + 7; y += 3) {
    const w = wildWood(x, y, z, 4)
    if (w === 'log' || w === 'leaves') return true
  }
  return false
}

function lakeCand(rx, rz) {
  let rec = null
  const span = LAKE_EVERY - 28
  for (let n = 0; n < 6 && !rec; n++) {
    const cx = rx * LAKE_EVERY + 14 + Math.floor(hash(rx + 91 + n * 13, rz - 17) * span)
    const cz = rz * LAKE_EVERY + 14 + Math.floor(hash(rx - 13, rz + 47 + n * 9) * span)
    if (flatFactor(cx, cz) < 1) continue
    const rad = 4 + Math.floor(hash(rx + 3 + n, rz + 9) * 6)
    let min = 99
    let max = -99
    let sum = 0
    let count = 0
    const rings = [0, Math.max(2, rad >> 1), rad]
    for (let r = 0; r < rings.length; r++) {
      const ring = rings[r]
      const steps = ring === 0 ? 1 : 8
      for (let i = 0; i < steps; i++) {
        const a = (i / steps) * Math.PI * 2
        const sx = cx + Math.round(Math.cos(a) * ring)
        const sz = cz + Math.round(Math.sin(a) * ring)
        const hh = spawnGround(sx, sz)
        if (hh < min) min = hh
        if (hh > max) max = hh
        sum += hh
        count++
      }
    }
    if (max - min > 2 || min < 2) continue
    const h0 = spawnGround(cx, cz)
    if (h0 > min + 1 || h0 > sum / count) continue
    // Flat water sits on the low ground of the basin, hills included.
    // Five samples, not the whole disk, so a far chunk does not scan the coast.
    const inner = Math.max(2, rad >> 1)
    let level = terrainAt(cx, cz)
    const around = [[inner, 0], [-inner, 0], [0, inner], [0, -inner]]
    for (let i = 0; i < around.length; i++) {
      const ht = terrainAt(cx + around[i][0], cz + around[i][1])
      if (ht < level) level = ht
    }
    if (level < 2) level = 2
    if (level > 20) continue
    rec = { cx, cz, rad, level }
  }
  return rec
}

function lakeDef(rx, rz) {
  const key = rx + ',' + rz
  if (lakeMemo.has(key)) return lakeMemo.get(key)
  const cand = lakeCand(rx, rz)
  let rec = cand
  // One lake per 96-block area. Yield to a candidate on a lower cell so two
  // lakes cannot sit inside the same 4×4 chunks, and the answer never walks
  // off the map.
  if (cand) {
    for (let dx = -1; dx <= 1 && rec; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        if (!dx && !dz) continue
        const nr = rx + dx
        const nz = rz + dz
        if (nr > rx || (nr === rx && nz >= rz)) continue
        const other = lakeCand(nr, nz)
        if (!other) continue
        const ddx = other.cx - cand.cx
        const ddz = other.cz - cand.cz
        if (Math.max(Math.abs(ddx), Math.abs(ddz)) < 96) { rec = null; break }
      }
    }
  }
  lakeMemo.set(key, rec)
  return rec
}

function lakeAt(x, z) {
  const rx = Math.floor(x / LAKE_EVERY)
  const rz = Math.floor(z / LAKE_EVERY)
  let best = null
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      const L = lakeDef(rx + dx, rz + dz)
      if (!L) continue
      const ddx = x - L.cx
      const ddz = z - L.cz
      const d = Math.hypot(ddx, ddz)
      if (d > L.rad + 2) continue
      if (!best || d < best.d) best = { cx: L.cx, cz: L.cz, rad: L.rad, level: L.level, d }
    }
  }
  return best
}

function maskHalf(x, z) {
  const scale = flatFactor(x, z)
  if (scale <= 0) return 0
  return riverHalf(x, z) * scale
}

function channelAt(x, z) {
  const k = numKey(x, z)
  if (channelMemo.has(k)) return channelMemo.get(k)
  const half = maskHalf(x, z)
  let ok = false
  if (half > 0.15 && Math.abs(riverDist(x, z)) <= half) {
    const h = spawnGround(x, z)
    if (h > 1 && h <= 23) {
      let down = h <= 3
      if (!down) {
        const lake = lakeAt(x, z)
        if (lake && lake.d <= lake.rad + 2) down = true
      }
      if (!down) {
        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
        for (let i = 0; i < dirs.length && !down; i++) {
          const nx = x + dirs[i][0]
          const nz = z + dirs[i][1]
          const nh = spawnGround(nx, nz)
          if (nh < h && (nh <= 1 || maskHalf(nx, nz) > 0.12)) down = true
          else if (nh === h) {
            const far = spawnGround(x + dirs[i][0] * 4, z + dirs[i][1] * 4)
            if (far < h) down = true
          }
        }
      }
      ok = down
    }
  }
  channelMemo.set(k, ok)
  return ok
}

function besideChannel(x, z) {
  const half = maskHalf(x, z)
  if (!(half > 0)) return false
  const ad = Math.abs(riverDist(x, z))
  if (ad <= half || ad > half + 2.25) return false
  const reach = hash(Math.floor(x / 4) + 20, Math.floor(z / 4) - 6) < 0.5 ? 1 : 2
  for (let dx = -reach; dx <= reach; dx++) {
    for (let dz = -reach; dz <= reach; dz++) {
      if (!dx && !dz) continue
      if (Math.max(Math.abs(dx), Math.abs(dz)) > reach) continue
      if (channelAt(x + dx, z + dz)) return true
    }
  }
  return false
}

function bedName(x, z) {
  const n = hash(x + 15, z - 4)
  if (n < 0.25) return 'clay'
  if (n < 0.8) return 'gravel'
  return 'sand'
}

function waterRec(top, h, x, z) {
  if (top > h || h - top > 1) return null
  let depth = hash(x + 11, z - 5) < 0.62 ? 1 : 2
  if (top < h || flatFactor(x, z) < 0.75) depth = 1
  if (depth > 3) depth = 3
  return { kind: 'water', top, depth, h, bed: bedName(x, z) }
}

function lakeWater(level, h, x, z) {
  if (h > level + 2 || h < level - 2) return null
  let depth
  if (h >= level) depth = hash(x + 11, z - 5) < 0.62 ? 1 : 2
  else depth = level - h + 1
  if (depth > 3) depth = 3
  if (depth < 1) depth = 1
  if (level - depth > h) return null
  return { kind: 'water', top: level, depth, h, bed: bedName(x, z) }
}

function bankRec(h, x, z, lakeEdge) {
  const surface = hash(x - 8, z + 3) < 0.5 ? 'gravel' : 'sand'
  const clay = hash(x + 2, z - 9) < (lakeEdge ? 0.55 : 0.34)
  const reed = hash(x - 4, z + 11) < (lakeEdge ? 0.32 : 0.12) && blockByKey('reed') ? 'reed' : ''
  return { kind: 'bank', h, surface, clay, reed }
}

function columnWaterRaw(x, z) {
  const scale = flatFactor(x, z)
  if (scale <= 0) return null
  const rough = vnoise(x, z, 88)
  const lake = lakeAt(x, z)
  if (Math.abs(rough - 0.5) > 0.12 && !(lake && lake.d <= lake.rad + 2)) return null
  const h = terrainAt(x, z)
  if (h <= 1 || h > 23) return null
  const near = Math.abs(riverDist(x, z)) <= maskHalf(x, z) + 2.25
  if (!near && !(lake && lake.d <= lake.rad + 2)) return null
  if (keptClear(x, z)) return null
  let rec = null
  if (lake && h >= lake.level - 2 && h <= lake.level + 2) {
    if (lake.d <= lake.rad) rec = lakeWater(lake.level, h, x, z)
    else if (lake.d <= lake.rad + 2) {
      if (channelAt(x, z)) rec = lakeWater(lake.level, h, x, z)
      if (!rec) rec = bankRec(h, x, z, true)
    }
  }
  if (!rec && channelAt(x, z)) {
    let floor = h
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (Math.abs(dx) + Math.abs(dz) > 3) continue
        const nx = x + dx
        const nz = z + dz
        if (!channelAt(nx, nz)) continue
        const nh = terrainAt(nx, nz)
        if (nh < floor) floor = nh
      }
    }
    rec = waterRec(floor, h, x, z)
  }
  if (!rec && besideChannel(x, z)) rec = bankRec(h, x, z, false)
  if (!rec || treeHere(x, z)) return null
  return rec
}

function columnWater(x, z, fade) {
  const full = fadeNum(fade, x, z) >= 12
  const key = (full ? 'f' : 'n') + numKey(x, z)
  if (waterMemo.has(key)) return waterMemo.get(key)
  const rec = full ? columnWaterRaw(x, z) : null
  waterMemo.set(key, rec)
  return rec
}

function paintWater(x, y, z, info, fade, cols) {
  if (y > 23) return ''
  if (info.kind === 'water') {
    if (y > info.top) return ''
    if (y <= info.top && y >= info.top - info.depth + 1) return 'water'
    if (y === info.top - info.depth) return info.bed
    return gen4(x, y, z, fade, cols)
  }
  if (y > info.h + 1) return ''
  if (y === info.h + 1) return info.reed || ''
  if (y === info.h) return info.surface
  if (y === info.h - 1 && info.clay) return 'clay'
  return gen4(x, y, z, fade, cols)
}

function gen5(x, y, z, fade, cols) {
  const info = columnWater(x, z, fade)
  if (!info) return gen4(x, y, z, fade, cols)
  return paintWater(x, y, z, info, fade, cols)
}

export function genBlock(x, y, z, gen, fade, cols) {
  const g = gen | 0
  const xi = x | 0
  const yi = y | 0
  const zi = z | 0
  if (g >= 5) {
    if (cols && cols.hasWater) {
      const i = xi - cols.x0
      const k = zi - cols.z0
      if (i >= 0 && k >= 0 && i < TILE && k < TILE) {
        const idx = i * TILE + k
        const hh = cols.h[idx]
        const info = yi > hh + 3 || yi < hh - 3 ? null : cols.water[idx]
        if (!info) return gen4(xi, yi, zi, fade, cols)
        return paintWater(xi, yi, zi, info, fade, cols)
      }
    } else if (cols) return gen4(xi, yi, zi, fade, cols)
    return gen5(xi, yi, zi, fade, cols)
  }
  if (g >= 4) return gen4(xi, yi, zi, fade, cols)
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
