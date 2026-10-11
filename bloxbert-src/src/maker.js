// World Maker M1. Flat and Void are generated here. Normal stays in worldgen.js.
// Sliders and the word seed are stored on the world. Worldgen reads them later (A1).

export const SEED_WORDS = [
  'amber', 'apple', 'bird', 'brook', 'cedar', 'cloud', 'coral', 'daisy',
  'ember', 'fern', 'flint', 'frost', 'grove', 'harbor', 'hazel', 'ivory',
  'jade', 'lake', 'maple', 'meadow', 'moss', 'oak', 'pebble', 'quartz',
  'river', 'robin', 'sage', 'spruce', 'stone', 'thistle', 'willow', 'wren',
]

export const ADJECTIVES = ['Bright', 'Calm', 'Golden', 'Green', 'Hidden', 'Little', 'Quiet', 'Red', 'Silver', 'Sunny', 'Wild', 'Young']
export const NOUNS = ['Brook', 'Camp', 'Field', 'Garden', 'Harbor', 'Hill', 'Lake', 'Meadow', 'Orchard', 'Ridge', 'River', 'Woods']

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

export function makerBlock(preset, x, y, z, spawn) {
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
  return null
}
