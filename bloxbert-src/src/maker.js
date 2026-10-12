// World Maker. Flat, Void, Islands, Sky and Parkour Start are generated here.
// Normal stays in worldgen.js. Sliders and the word seed are stored on the world.

export const SEED_WORDS = [
  'amber', 'apple', 'bird', 'brook', 'cedar', 'cloud', 'coral', 'daisy',
  'ember', 'fern', 'flint', 'frost', 'grove', 'harbor', 'hazel', 'ivory',
  'jade', 'lake', 'maple', 'meadow', 'moss', 'oak', 'pebble', 'quartz',
  'river', 'robin', 'sage', 'spruce', 'stone', 'thistle', 'willow', 'wren',
]

export const ADJECTIVES = ['Bright', 'Calm', 'Golden', 'Green', 'Hidden', 'Little', 'Quiet', 'Red', 'Silver', 'Sunny', 'Wild', 'Young']
export const NOUNS = ['Brook', 'Camp', 'Field', 'Garden', 'Harbor', 'Hill', 'Lake', 'Meadow', 'Orchard', 'Ridge', 'River', 'Woods']

export const PRESETS = ['normal', 'flat', 'void', 'islands', 'sky', 'parkour']
export const MAKER_PRESETS = ['flat', 'void', 'islands', 'sky', 'parkour']
export const GEN_PRESETS = ['islands', 'sky', 'parkour']
const CODE_TAG = { normal: 'NRM', flat: 'FLT', void: 'VOID', islands: 'ISL', sky: 'SKY', parkour: 'PRK' }
const TAG_PRESET = { NRM: 'normal', FLT: 'flat', VOID: 'void', ISL: 'islands', SKY: 'sky', PRK: 'parkour' }

const SEED_SPAN = SEED_WORDS.length * SEED_WORDS.length * SEED_WORDS.length

export function clampStep(n) {
  n = n | 0
  if (n < 0) return 0
  if (n > 4) return 4
  return n
}

export function normSeed(n) {
  const x = Math.abs(n | 0) % SEED_SPAN
  return x || 1
}

export function seedWords(n) {
  const m = SEED_WORDS.length
  let x = normSeed(n)
  const a = x % m
  x = Math.floor(x / m)
  const b = x % m
  const c = Math.floor(x / m) % m
  return [SEED_WORDS[a], SEED_WORDS[b], SEED_WORDS[c]]
}

export function titleCaseWord(w) {
  const s = String(w || '')
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function makerName(maker) {
  if (!maker) return ''
  const a = ADJECTIVES[(maker.adj | 0) % ADJECTIVES.length] || ''
  const n = NOUNS[(maker.noun | 0) % NOUNS.length] || ''
  return (a + ' ' + n).trim()
}

export function isMakerPreset(preset) {
  return MAKER_PRESETS.indexOf(preset) >= 0
}

export function softPreset(preset) {
  return preset === 'void' || preset === 'sky' || preset === 'parkour'
}

export function tipKey(preset) {
  if (preset === 'flat') return 'makerTipFlat'
  if (preset === 'void') return 'makerTipVoid'
  if (preset === 'islands') return 'makerTipIslands'
  if (preset === 'sky') return 'makerTipSky'
  if (preset === 'parkour') return 'makerTipParkour'
  return ''
}

function mulberry(seed) {
  let s = (seed | 0) || 1
  return function next() {
    s = (s + 0x6D2B79F5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function scatterIslands(seed) {
  const rnd = mulberry((seed | 0) ^ 0x151)
  const n = 6 + Math.floor(rnd() * 7)
  const list = []
  let guard = 0
  while (list.length < n && guard < 80) {
    guard++
    const x = Math.floor(rnd() * 56) - 24
    const z = Math.floor(rnd() * 56) - 24
    if (x * x + z * z < 36) continue
    if (list.some((p) => (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z) < 64)) continue
    list.push({ x, z, r: 2 + Math.floor(rnd() * 3), tree: rnd() < 0.55 })
  }
  if (!list.length) list.push({ x: 14, z: 6, r: 3, tree: true })
  return list
}

function scatterSky(seed) {
  const rnd = mulberry((seed | 0) ^ 0x5A1)
  const n = 3 + Math.floor(rnd() * 4)
  const list = [{ x: 8, z: 1, w: 5, d: 5, y: 7 }]
  let guard = 0
  while (list.length < n && guard < 40) {
    guard++
    const x = Math.floor(rnd() * 40) - 12
    const z = Math.floor(rnd() * 40) - 16
    if (Math.abs(x - 8) < 8 && Math.abs(z - 1) < 8) continue
    const w = 4 + Math.floor(rnd() * 7)
    const d = 4 + Math.floor(rnd() * 7)
    const y = 8 + Math.floor(rnd() * 8)
    list.push({ x, z, w, d, y })
  }
  return list
}

function parkourPads(seed) {
  const rnd = mulberry((seed | 0) ^ 0x9A2)
  const pads = [{ x0: 6, x1: 10, z0: -1, z1: 3, y: 7 }]
  let x = 11
  let y = 7
  const z0 = -1
  const z1 = 1
  for (let i = 0; i < 10; i++) {
    const gap = 1 + Math.floor(rnd() * 3)
    const rise = Math.floor(rnd() * 2)
    const len = 2 + Math.floor(rnd() * 2)
    x += gap
    y += rise
    pads.push({ x0: x, x1: x + len - 1, z0, z1, y })
    x += len - 1
  }
  const last = pads[pads.length - 1]
  pads.push({ x0: last.x1 + 2, x1: last.x1 + 4, z0: -1, z1: 3, y: last.y, finish: true })
  return pads
}

const layoutCache = new Map()
function layoutFor(preset, seed) {
  const k = preset + ':' + (seed | 0)
  let hit = layoutCache.get(k)
  if (hit) return hit
  if (preset === 'islands') hit = { islands: scatterIslands(seed) }
  else if (preset === 'sky') hit = { islands: scatterSky(seed) }
  else if (preset === 'parkour') hit = { pads: parkourPads(seed) }
  else hit = {}
  layoutCache.set(k, hit)
  return hit
}

function treeAt(x, y, z, cx, top, cz) {
  if (y <= top) return ''
  const dx = x - cx
  const dz = z - cz
  if (dx === 0 && dz === 0 && y <= top + 4) return 'log'
  const dy = y - (top + 4)
  if (dy >= -1 && dy <= 1 && Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) return 'leaves'
  return ''
}

function islandsBlock(x, y, z, seed) {
  if (y > 12) return ''
  if (y < 3) return 'water'
  const islands = layoutFor('islands', seed).islands
  for (let i = 0; i < islands.length; i++) {
    const p = islands[i]
    const dx = x - p.x
    const dz = z - p.z
    if (dx * dx + dz * dz > p.r * p.r) continue
    if (y === 3 || y === 4) return 'sand'
    if (y === 5) return 'grass'
    if (y === 6) return 'dirt'
    if (p.tree) {
      const wood = treeAt(x, y, z, p.x, 6, p.z)
      if (wood) return wood
    }
    return ''
  }
  if (y === 3) return 'water'
  return ''
}

function skyBlock(x, y, z, seed, spawn) {
  const islands = layoutFor('sky', seed).islands
  for (let i = 0; i < islands.length; i++) {
    const p = islands[i]
    const halfW = Math.floor(p.w / 2)
    const halfD = Math.floor(p.d / 2)
    if (Math.abs(x - p.x) > halfW || Math.abs(z - p.z) > halfD) continue
    if (y === p.y) return 'grass'
    if (y === p.y - 1 || y === p.y - 2) return 'dirt'
    if (i === 0) continue
    if ((x + z + i) % 5 === 0) {
      const wood = treeAt(x, y, z, p.x, p.y, p.z)
      if (wood) return wood
    }
  }
  const sx = Math.floor((spawn && spawn[0]) || 8)
  const sy = 7
  const sz = Math.floor((spawn && spawn[2]) || 1)
  if (y === sy && Math.abs(x - sx) <= 2 && Math.abs(z - sz) <= 2) return 'grass'
  if ((y === sy - 1 || y === sy - 2) && Math.abs(x - sx) <= 2 && Math.abs(z - sz) <= 2) return 'dirt'
  return ''
}

function parkourBlock(x, y, z, seed) {
  const pads = layoutFor('parkour', seed).pads
  for (let i = 0; i < pads.length; i++) {
    const p = pads[i]
    if (x < p.x0 || x > p.x1 || z < p.z0 || z > p.z1) continue
    if (y === p.y) return p.finish ? 'woolGreen' : 'stone'
    if (y === p.y - 1) return 'stone'
  }
  return ''
}

export function makerBlock(preset, x, y, z, spawn, seed) {
  if (preset === 'flat') {
    if (y === 4) return 'grass'
    if (y < 4 && y >= 0) return 'dirt'
    if (y < 0) return 'stone'
    return ''
  }
  if (preset === 'void') {
    const sx = Math.floor((spawn && spawn[0]) || 0)
    const sy = Math.floor((spawn && spawn[1]) || 0) - 1
    const sz = Math.floor((spawn && spawn[2]) || 0)
    if (y === sy && Math.abs(x - sx) <= 2 && Math.abs(z - sz) <= 2) return 'stone'
    return ''
  }
  if (preset === 'islands') return islandsBlock(x, y, z, seed | 0)
  if (preset === 'sky') return skyBlock(x, y, z, seed | 0, spawn)
  if (preset === 'parkour') return parkourBlock(x, y, z, seed | 0)
  return null
}

export function shareCode(maker) {
  if (!maker) return ''
  const tag = CODE_TAG[maker.preset] || 'NRM'
  const words = seedWords(maker.seed).map(titleCaseWord)
  return tag + '-' + clampStep(maker.hills) + '-' + clampStep(maker.water) + '-' + clampStep(maker.trees) + ' ' + words.join('-')
}

export function parseShare(text) {
  const raw = String(text || '').trim()
  const m = raw.match(/^([A-Za-z]+)-(\d)-(\d)-(\d)\s+([A-Za-z]+)-([A-Za-z]+)-([A-Za-z]+)$/)
  if (!m) return null
  const preset = TAG_PRESET[m[1].toUpperCase()]
  if (!preset) return null
  const a = SEED_WORDS.indexOf(m[5].toLowerCase())
  const b = SEED_WORDS.indexOf(m[6].toLowerCase())
  const c = SEED_WORDS.indexOf(m[7].toLowerCase())
  if (a < 0 || b < 0 || c < 0) return null
  const n = SEED_WORDS.length
  return {
    preset,
    hills: clampStep(m[2]),
    water: clampStep(m[3]),
    trees: clampStep(m[4]),
    seed: normSeed(a + b * n + c * n * n),
  }
}
