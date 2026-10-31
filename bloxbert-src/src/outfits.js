// Avatar Outfits, part 1 (2.5.555). Single player, cosmetic only: no stats, no words, letters, logos or team sets on clothes.
// Pure data and logic. No imports, no DOM, no Babylon, so tools/outfits-check.mjs runs it in node and the picker and the rig share one source.
//
// The look is stored as ids only: { v:1, head:'hardhat', headColor:'sage', headPattern:'plain', top:..., bottom:..., feet:..., extra:... }.
// Foundry unlocks and the shared-server sync are later parts. Every starter item is unlocked here, but Random already asks isUnlocked().

export const SLOTS = ['head', 'top', 'bottom', 'feet', 'extra']

export const ITEMS = {
  head: ['none', 'beanie', 'hardhat', 'headphones'],
  top: ['tee', 'hoodie', 'bib', 'vest', 'labcoat'],
  bottom: ['workpants', 'shorts', 'cargo', 'coverall'],
  feet: ['boots', 'sneakers', 'rainboots'],
  extra: ['none', 'backpack', 'scarf', 'toolbelt'],
}

// Muted on purpose: no neon, no pure white. 'light' parts are 12% brighter and still stay under 0.9.
export const COLORS = {
  clay: [0.72, 0.45, 0.35],
  sage: [0.55, 0.67, 0.52],
  slate: [0.38, 0.48, 0.62],
  sand: [0.80, 0.72, 0.55],
  plum: [0.50, 0.32, 0.46],
  charcoal: [0.26, 0.28, 0.31],
}
export const COLOR_IDS = Object.keys(COLORS)
export const PATTERNS = ['plain', 'stripes', 'checks', 'dots', 'rivets', 'patch']

export const STARTER = {
  v: 1,
  head: 'none', headColor: 'sage', headPattern: 'plain',
  top: 'tee', topColor: 'clay', topPattern: 'plain',
  bottom: 'workpants', bottomColor: 'slate', bottomPattern: 'plain',
  feet: 'boots', feetColor: 'charcoal', feetPattern: 'plain',
  extra: 'none', extraColor: 'sand', extraPattern: 'plain',
}

export function starterLook() { return { ...STARTER } }

// Anything that is not a known id falls back to the starter value for that field. Old saves have no outfit: starter look.
export function normalize(raw) {
  const out = starterLook()
  if (!raw || typeof raw !== 'object') return out
  for (const slot of SLOTS) {
    if (typeof raw[slot] === 'string' && ITEMS[slot].includes(raw[slot])) out[slot] = raw[slot]
    if (typeof raw[slot + 'Color'] === 'string' && COLORS[raw[slot + 'Color']]) out[slot + 'Color'] = raw[slot + 'Color']
    if (typeof raw[slot + 'Pattern'] === 'string' && PATTERNS.includes(raw[slot + 'Pattern'])) out[slot + 'Pattern'] = raw[slot + 'Pattern']
  }
  return out
}

export function sameLook(a, b) {
  for (const k of Object.keys(STARTER)) if (a[k] !== b[k]) return false
  return true
}

// ---- unlocks (all starter items; later parts add more) --------------------------------------------------
function allStarterKeys() {
  const keys = []
  for (const slot of SLOTS) for (const id of ITEMS[slot]) keys.push(slot + ':' + id)
  return keys
}

// ---- the store: draft look, saved look, local storage -----------------------------------------------------
export function createStore(opts) {
  const o = opts || {}
  const key = o.key || 'bloxbert-outfit'
  const storage = o.storage || null
  const unlocked = new Set(o.unlocked || allStarterKeys())
  let saved = starterLook()
  try {
    const raw = storage && storage.getItem(key)
    if (raw) saved = normalize(JSON.parse(raw))
  } catch (e) { saved = starterLook() }
  let draft = { ...saved }
  const listeners = []
  const tell = () => { for (const fn of listeners) { try { fn(draft) } catch (e) {} } }
  const api = {
    get: () => draft,
    saved: () => saved,
    dirty: () => !sameLook(draft, saved),
    on: (fn) => { listeners.push(fn) },
    isUnlocked: (slot, id) => unlocked.has(slot + ':' + id),
    setUnlocked: (list) => { unlocked.clear(); for (const k of list) unlocked.add(k) },
    unlockedItems: (slot) => ITEMS[slot].filter((id) => unlocked.has(slot + ':' + id)),
    set(slot, field, value) {
      // field: 'item' | 'color' | 'pattern'
      if (!SLOTS.includes(slot)) return false
      if (field === 'item') {
        if (!ITEMS[slot].includes(value) || !unlocked.has(slot + ':' + value)) return false
        draft[slot] = value
      } else if (field === 'color') {
        if (!COLORS[value]) return false
        draft[slot + 'Color'] = value
      } else if (field === 'pattern') {
        if (!PATTERNS.includes(value)) return false
        draft[slot + 'Pattern'] = value
      } else return false
      tell()
      return true
    },
    // rng() returns 0..1. Unlocked items only; every color and pattern is open in this part.
    random(rng) {
      const r = rng || Math.random
      const pick = (list) => list[Math.min(list.length - 1, Math.floor(r() * list.length))]
      const next = { ...draft, v: 1 }
      for (const slot of SLOTS) {
        const ids = api.unlockedItems(slot)
        if (ids.length) next[slot] = pick(ids)
        next[slot + 'Color'] = pick(COLOR_IDS)
        next[slot + 'Pattern'] = pick(PATTERNS)
      }
      draft = next
      tell()
      return draft
    },
    reset() { draft = starterLook(); tell(); return draft },
    save() {
      saved = { ...draft }
      try { if (storage) storage.setItem(key, JSON.stringify(saved)) } catch (e) { return false }
      tell()
      return true
    },
    revert() { draft = { ...saved }; tell() },
  }
  return api
}

// ---- patterns: one small atlas, six 8 x 8 tiles. Value is a brightness factor (1 = untouched). ----------------
export const TILE = 8
export function patternValue(pattern, x, y) {
  switch (pattern) {
    case 'stripes': return x % 4 < 2 ? 1 : 0.78
    case 'checks': return ((x >> 1) + (y >> 1)) % 2 ? 0.8 : 1
    case 'dots': return (x % 4 < 2 && y % 4 < 2) ? 0.74 : 1
    case 'rivets': return ((x === 1 || x === 6) && (y === 1 || y === 6)) ? 0.62 : 1
    case 'patch':
      if (x >= 2 && x <= 5 && y >= 2 && y <= 5) return (x === 2 || x === 5 || y === 2 || y === 5) ? 0.7 : 0.88
      return 1
    default: return 1
  }
}

// ---- geometry. Rig space is the existing berty mesh: y from -0.9 (feet) to 0.41 (head top), front is +z. --------
// part: { p:[x,y,z] center, s:[w,h,d], t:'main'|'dark'|'light'|'metal'|'metalDark'|'head'|'visor'|'eye', pat:true if the pattern applies }
const L = -1
const R = 1
function pair(fn) { return [fn(L), fn(R)] }

export const BASE_PARTS = [
  ...pair((x) => ({ p: [x * 0.1, -0.66, 0], s: [0.14, 0.3, 0.16], t: 'metalDark' })),
  ...pair((x) => ({ p: [x * 0.1, -0.84, 0.02], s: [0.15, 0.1, 0.22], t: 'metalDark' })),
  { p: [0, -0.5, 0], s: [0.3, 0.12, 0.2], t: 'metal' },
  { p: [0, -0.2, 0], s: [0.34, 0.5, 0.2], t: 'metal' },
  { p: [0, 0.08, 0], s: [0.12, 0.08, 0.12], t: 'metalDark' },
  { p: [0, 0.26, 0], s: [0.32, 0.3, 0.3], t: 'head' },
  { p: [0, 0.27, 0.155], s: [0.24, 0.1, 0.03], t: 'visor' },
  { p: [-0.055, 0.27, 0.175], s: [0.05, 0.04, 0.015], t: 'eye' },
  { p: [0.055, 0.27, 0.175], s: [0.05, 0.04, 0.015], t: 'eye' },
]

export const SHAPES = {
  head: {
    none: [],
    beanie: [
      { p: [0, 0.45, 0], s: [0.36, 0.12, 0.34], t: 'main', pat: true },
      { p: [0, 0.39, 0], s: [0.37, 0.04, 0.35], t: 'dark' },
      { p: [0, 0.53, 0], s: [0.1, 0.05, 0.1], t: 'light' },
    ],
    hardhat: [
      { p: [0, 0.46, 0], s: [0.35, 0.1, 0.34], t: 'main', pat: true },
      { p: [0, 0.515, 0], s: [0.08, 0.03, 0.3], t: 'light' },
      { p: [0, 0.41, 0.2], s: [0.34, 0.03, 0.12], t: 'dark' },
    ],
    headphones: [
      { p: [0, 0.43, 0], s: [0.36, 0.04, 0.06], t: 'dark' },
      ...pair((x) => ({ p: [x * 0.19, 0.26, 0], s: [0.06, 0.14, 0.14], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.18, 0.37, 0], s: [0.03, 0.1, 0.05], t: 'dark' })),
    ],
  },
  top: {
    tee: [
      { p: [0, -0.15, 0], s: [0.38, 0.32, 0.24], t: 'main', pat: true },
      { p: [0, 0.03, 0], s: [0.2, 0.03, 0.2], t: 'dark' },
    ],
    hoodie: [
      { p: [0, -0.2, 0], s: [0.4, 0.46, 0.25], t: 'main', pat: true },
      { p: [0, 0.05, -0.12], s: [0.3, 0.1, 0.1], t: 'dark' },
      { p: [0, -0.34, 0.13], s: [0.24, 0.1, 0.02], t: 'dark' },
      ...pair((x) => ({ p: [x * 0.05, -0.08, 0.13], s: [0.02, 0.1, 0.01], t: 'light' })),
    ],
    bib: [
      { p: [0, -0.18, 0.1], s: [0.28, 0.26, 0.07], t: 'main', pat: true },
      ...pair((x) => ({ p: [x * 0.1, -0.02, 0], s: [0.05, 0.1, 0.24], t: 'dark' })),
      { p: [0, -0.2, 0.14], s: [0.12, 0.08, 0.02], t: 'light' },
    ],
    vest: [
      { p: [0, -0.17, 0], s: [0.4, 0.38, 0.25], t: 'main', pat: true },
      ...pair((x) => ({ p: [x * 0.1, -0.28, 0.13], s: [0.1, 0.08, 0.02], t: 'dark' })),
      { p: [0, -0.17, 0.13], s: [0.02, 0.36, 0.01], t: 'light' },
    ],
    labcoat: [
      { p: [0, -0.28, 0], s: [0.42, 0.62, 0.26], t: 'main', pat: true },
      { p: [0, -0.06, 0.14], s: [0.1, 0.28, 0.01], t: 'dark' },
      { p: [0, -0.22, 0.14], s: [0.03, 0.03, 0.01], t: 'light' },
      { p: [0, -0.3, 0.14], s: [0.03, 0.03, 0.01], t: 'light' },
      { p: [0, -0.38, 0.14], s: [0.03, 0.03, 0.01], t: 'light' },
    ],
  },
  bottom: {
    workpants: [
      ...pair((x) => ({ p: [x * 0.1, -0.65, 0], s: [0.17, 0.36, 0.2], t: 'main', pat: true })),
      { p: [0, -0.5, 0], s: [0.36, 0.07, 0.22], t: 'dark' },
    ],
    shorts: [
      ...pair((x) => ({ p: [x * 0.1, -0.58, 0], s: [0.17, 0.2, 0.2], t: 'main', pat: true })),
      { p: [0, -0.5, 0], s: [0.36, 0.07, 0.22], t: 'dark' },
    ],
    cargo: [
      ...pair((x) => ({ p: [x * 0.1, -0.65, 0], s: [0.17, 0.36, 0.2], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.2, -0.62, 0], s: [0.05, 0.12, 0.12], t: 'dark' })),
      { p: [0, -0.5, 0], s: [0.36, 0.07, 0.22], t: 'dark' },
    ],
    coverall: [
      ...pair((x) => ({ p: [x * 0.1, -0.66, 0], s: [0.18, 0.4, 0.21], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.1, -0.8, 0], s: [0.2, 0.05, 0.23], t: 'dark' })),
      { p: [0, -0.5, 0], s: [0.38, 0.1, 0.24], t: 'main', pat: true },
    ],
  },
  feet: {
    boots: [
      ...pair((x) => ({ p: [x * 0.1, -0.8, 0.03], s: [0.18, 0.14, 0.28], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.1, -0.875, 0.03], s: [0.19, 0.03, 0.3], t: 'dark' })),
      ...pair((x) => ({ p: [x * 0.1, -0.72, -0.01], s: [0.17, 0.06, 0.2], t: 'dark' })),
    ],
    sneakers: [
      ...pair((x) => ({ p: [x * 0.1, -0.83, 0.03], s: [0.17, 0.08, 0.28], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.1, -0.875, 0.03], s: [0.18, 0.025, 0.3], t: 'light' })),
      ...pair((x) => ({ p: [x * 0.1, -0.83, 0.17], s: [0.15, 0.06, 0.04], t: 'light' })),
    ],
    rainboots: [
      ...pair((x) => ({ p: [x * 0.1, -0.74, 0], s: [0.18, 0.3, 0.24], t: 'main', pat: true })),
      ...pair((x) => ({ p: [x * 0.1, -0.875, 0.02], s: [0.19, 0.03, 0.28], t: 'dark' })),
      ...pair((x) => ({ p: [x * 0.1, -0.6, 0], s: [0.2, 0.04, 0.26], t: 'dark' })),
    ],
  },
  extra: {
    none: [],
    backpack: [
      { p: [0, -0.17, -0.2], s: [0.3, 0.34, 0.14], t: 'main', pat: true },
      { p: [0, -0.02, -0.2], s: [0.31, 0.06, 0.15], t: 'dark' },
      { p: [0, -0.28, -0.285], s: [0.18, 0.1, 0.03], t: 'dark' },
      ...pair((x) => ({ p: [x * 0.12, -0.12, -0.1], s: [0.04, 0.3, 0.02], t: 'dark' })),
    ],
    scarf: [
      { p: [0, 0.065, 0], s: [0.4, 0.07, 0.26], t: 'main', pat: true },
      { p: [-0.1, -0.08, 0.14], s: [0.1, 0.24, 0.03], t: 'main', pat: true },
      { p: [-0.1, -0.2, 0.14], s: [0.1, 0.03, 0.03], t: 'dark' },
    ],
    toolbelt: [
      { p: [0, -0.47, 0], s: [0.4, 0.06, 0.25], t: 'main', pat: true },
      ...pair((x) => ({ p: [x * 0.19, -0.54, 0.04], s: [0.07, 0.12, 0.1], t: 'dark' })),
      { p: [0, -0.47, 0.13], s: [0.06, 0.05, 0.02], t: 'light' },
    ],
  },
}

const METAL = {
  metal: [0.56, 0.59, 0.63], metalDark: [0.34, 0.37, 0.41], head: [0.72, 0.74, 0.76],
  visor: [0.14, 0.16, 0.2], eye: [0.58, 0.78, 0.72],
}
const clamp = (v) => Math.min(0.9, Math.max(0, v))

function toneRgb(t, base) {
  if (METAL[t]) return METAL[t]
  if (t === 'dark') return [base[0] * 0.74, base[1] * 0.74, base[2] * 0.74]
  if (t === 'light') return [clamp(base[0] * 1.12), clamp(base[1] * 1.12), clamp(base[2] * 1.12)]
  return base
}

// One flat list for the 3D rig and the 2D preview: { p, s, rgb, pat } where pat is an index into PATTERNS (0 = plain).
export function partsFor(look, only) {
  const l = normalize(look)
  const out = []
  const add = (list, base, pattern) => {
    for (const part of list) out.push({ p: part.p, s: part.s, rgb: toneRgb(part.t, base), pat: part.pat ? PATTERNS.indexOf(pattern) : 0, t: part.t })
  }
  if (!only) add(BASE_PARTS, [0.5, 0.5, 0.5], 'plain')
  for (const slot of SLOTS) {
    if (only && only !== slot) continue
    add(SHAPES[slot][l[slot]] || [], COLORS[l[slot + 'Color']], l[slot + 'Pattern'])
  }
  return out
}

// Arms use the Top color so sleeves match.
export function armRgb(look) {
  const l = normalize(look)
  return COLORS[l.topColor]
}

// ---- names -------------------------------------------------------------------------------------------------
// t(key) is the game's translator. Keys: ol_<slot>_<id> items, oc_<color>, op_<pattern>, mlNameFmt, mlNamePlain.
export function itemKey(slot, id) { return 'ol_' + slot + '_' + id }
export function colorKey(id) { return 'oc_' + id }
export function patternKey(id) { return 'op_' + id }

function fill(fmt, vars) {
  return String(fmt).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m))
}

// "Sage Stripes Hoodie". Plain pattern is left out. An empty slot ('none') says what it is: "No hat".
export function nameFor(slot, look, t) {
  const l = normalize(look)
  const id = l[slot]
  const item = t(itemKey(slot, id))
  if (id === 'none') return item
  const color = t(colorKey(l[slot + 'Color']))
  const pat = l[slot + 'Pattern']
  if (pat === 'plain') return fill(t('mlNamePlain'), { color, item })
  return fill(t('mlNameFmt'), { color, pattern: t(patternKey(pat)), item })
}

export function allNames(look, t) {
  return SLOTS.map((slot) => nameFor(slot, look, t))
}

// Every string key this module can ask for, so the string check can prove all 9 sets have them.
export function stringKeys() {
  const keys = ['mlNameFmt', 'mlNamePlain']
  for (const slot of SLOTS) for (const id of ITEMS[slot]) keys.push(itemKey(slot, id))
  for (const id of COLOR_IDS) keys.push(colorKey(id))
  for (const id of PATTERNS) keys.push(patternKey(id))
  return keys
}
