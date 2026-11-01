// Avatar Outfits check (2.5.555): the catalog, the save format, Random, Reset, names and the muted look. Pure node, no browser.
import {
  SLOTS, ITEMS, COLORS, COLOR_IDS, PATTERNS, STARTER, starterLook, normalize, createStore, partsFor, BASE_PARTS, SHAPES,
  nameFor, allNames, stringKeys, patternValue, TILE,
} from '../src/outfits.js'
import { EXTRA } from '../src/strings-extra.js'

const fail = []
const check = (ok, msg) => { if (!ok) fail.push(msg) }
const mem = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), _m: m } }
function seeded(n) { let a = n >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const hslSat = (c) => { const mx = Math.max(...c); const mn = Math.min(...c); const l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)) }

// 1. The catalog is what the design asked for.
check(JSON.stringify(SLOTS) === JSON.stringify(['head', 'top', 'bottom', 'feet', 'extra']), 'five slots in order')
check(ITEMS.head.length === 4 && ITEMS.top.length === 5 && ITEMS.bottom.length === 4 && ITEMS.feet.length === 3 && ITEMS.extra.length === 4, 'item counts per slot')
check(JSON.stringify(ITEMS.head) === JSON.stringify(['none', 'beanie', 'hardhat', 'headphones']), 'head items')
check(JSON.stringify(ITEMS.extra) === JSON.stringify(['none', 'backpack', 'scarf', 'toolbelt']), 'extra items')
check(COLOR_IDS.length === 6 && ['clay', 'sage', 'slate', 'sand', 'plum', 'charcoal'].every((c) => COLORS[c]), 'six colors')
check(JSON.stringify(PATTERNS) === JSON.stringify(['plain', 'stripes', 'checks', 'dots', 'rivets', 'patch']), 'six patterns in order')

// 2. Muted: no neon, no pure white, every part inside the tone range, nothing brighter than 0.9 (about #E6).
for (const id of COLOR_IDS) {
  const c = COLORS[id]
  check(Math.max(...c) <= 0.82, id + ' color too bright')
  check(lum(c) >= 0.15 && lum(c) <= 0.85, id + ' luminance out of 15-85%')
  check(hslSat(c) <= 0.55, id + ' too saturated: ' + hslSat(c).toFixed(2))
}
for (const slot of SLOTS) {
  for (const id of ITEMS[slot]) {
    for (const color of COLOR_IDS) {
      const parts = partsFor({ ...STARTER, [slot]: id, [slot + 'Color']: color })
      for (const p of parts) {
        check(Math.max(...p.rgb) <= 0.9, slot + ':' + id + ' ' + color + ' part brighter than 0.9')
        check(!(p.rgb[0] >= 0.99 && p.rgb[1] >= 0.99 && p.rgb[2] >= 0.99), 'pure white part')
        check(lum(p.rgb) >= 0.1, slot + ':' + id + ' ' + color + ' part near black')
      }
    }
  }
}

// 3. Cosmetic only: parts hold geometry and color, never text, letters, logos or stats.
const allowed = new Set(['p', 's', 'rgb', 'pat', 't'])
for (const p of partsFor(starterLook())) check(Object.keys(p).every((k) => allowed.has(k)), 'part has an unexpected field')
for (const slot of SLOTS) for (const id of ITEMS[slot]) {
  for (const part of (SHAPES[slot][id] || [])) {
    check(part.s.every((v) => v > 0), slot + ':' + id + ' has a flat box')
    check(Object.keys(part).every((k) => ['p', 's', 't', 'pat'].includes(k)), slot + ':' + id + ' part has a text-like field')
  }
  check(slot + id !== '', 'id')
  check(!/[A-Z\s]/.test(id), 'id is plain lower case: ' + id)
}
check(!JSON.stringify(ITEMS).match(/jersey|team|gang|logo|brand|nike|adidas/i), 'no teams, jerseys or brands in item ids')

// 4. Same size and hitbox: the base rig fills the same box as the old android (y -0.9..0.41), and clothes stay close to it.
const bounds = (parts) => {
  const b = { x0: 9, x1: -9, y0: 9, y1: -9, z0: 9, z1: -9 }
  for (const p of parts) {
    b.x0 = Math.min(b.x0, p.p[0] - p.s[0] / 2); b.x1 = Math.max(b.x1, p.p[0] + p.s[0] / 2)
    b.y0 = Math.min(b.y0, p.p[1] - p.s[1] / 2); b.y1 = Math.max(b.y1, p.p[1] + p.s[1] / 2)
    b.z0 = Math.min(b.z0, p.p[2] - p.s[2] / 2); b.z1 = Math.max(b.z1, p.p[2] + p.s[2] / 2)
  }
  return b
}
const base = bounds(BASE_PARTS.map((p) => ({ p: p.p, s: p.s })))
check(Math.abs(base.y0 - -0.89) < 0.02 && Math.abs(base.y1 - 0.41) < 0.02, 'base height changed: ' + base.y0.toFixed(2) + ' to ' + base.y1.toFixed(2))
for (const slot of SLOTS) for (const id of ITEMS[slot]) {
  const b = bounds((SHAPES[slot][id] || []).map((p) => ({ p: p.p, s: p.s })))
  if (!(SHAPES[slot][id] || []).length) continue
  check(b.x0 >= -0.3 && b.x1 <= 0.3 && b.z0 >= -0.32 && b.z1 <= 0.32 && b.y0 >= -0.92 && b.y1 <= 0.6, slot + ':' + id + ' pokes out of the rig: ' + JSON.stringify(b))
}

// 5. Save format: ids only. Old or broken saves load the starter look.
check(JSON.stringify(normalize(null)) === JSON.stringify(STARTER), 'null loads the starter look')
check(JSON.stringify(normalize({})) === JSON.stringify(STARTER), 'empty save loads the starter look')
check(JSON.stringify(normalize('hoodie')) === JSON.stringify(STARTER), 'junk loads the starter look')
const half = normalize({ top: 'hoodie', topColor: 'neon', topPattern: 'stripes', feet: 'jetpack' })
check(half.top === 'hoodie' && half.topColor === STARTER.topColor && half.topPattern === 'stripes' && half.feet === STARTER.feet, 'unknown ids fall back field by field')
const storage = mem()
const a = createStore({ storage, key: 'k' })
check(a.get().top === 'tee' && !a.dirty(), 'fresh store is the starter look')
a.set('head', 'item', 'hardhat'); a.set('head', 'color', 'sage'); a.set('head', 'pattern', 'plain')
a.set('top', 'item', 'hoodie'); a.set('top', 'color', 'sage'); a.set('top', 'pattern', 'stripes')
check(a.dirty(), 'edits make the look unsaved')
check(storage.getItem('k') === null, 'nothing is saved before Save')
a.save()
const raw = JSON.parse(storage.getItem('k'))
check(raw.head === 'hardhat' && raw.headColor === 'sage' && raw.headPattern === 'plain' && raw.top === 'hoodie' && raw.topPattern === 'stripes', 'saved ids')
check(Object.entries(raw).every(([k, v]) => k === 'v' ? v === 1 : /^[a-z]+$/.test(String(v))), 'saved values are plain ids only')
check(Object.keys(raw).length === 16, 'saved shape has v and 15 id fields: ' + Object.keys(raw).length)
const b = createStore({ storage, key: 'k' })
check(JSON.stringify(b.saved()) === JSON.stringify(a.saved()), 'save survives a reload')
check(!b.dirty(), 'reloaded look is not dirty')
storage.setItem('bad', '{not json'); check(JSON.stringify(createStore({ storage, key: 'bad' }).get()) === JSON.stringify(STARTER), 'broken json loads the starter look')
check(JSON.stringify(createStore({ storage, key: 'missing' }).get()) === JSON.stringify(STARTER), 'no save loads the starter look')

// 6. Reset and Random.
b.reset()
check(JSON.stringify(b.get()) === JSON.stringify(STARTER), 'reset gives the starter look')
b.revert(); check(b.get().top === 'hoodie', 'revert goes back to the saved look')
const locked = ['top:labcoat', 'head:hardhat', 'extra:backpack', 'feet:rainboots']
const r = createStore({ storage: mem(), key: 'r' })
r.setUnlocked(SLOTS.flatMap((s) => ITEMS[s].map((i) => s + ':' + i)).filter((k) => !locked.includes(k)))
const rng = seeded(7)
const seen = new Set()
let bad = 0
for (let i = 0; i < 600; i++) {
  const look = r.random(rng)
  for (const slot of SLOTS) {
    seen.add(slot + ':' + look[slot])
    if (locked.includes(slot + ':' + look[slot])) bad++
    check(COLORS[look[slot + 'Color']] && PATTERNS.includes(look[slot + 'Pattern']), 'random gave an unknown color or pattern')
  }
}
check(bad === 0, 'Random picked a locked item ' + bad + ' times')
check(seen.size >= 14, 'Random covers the unlocked items: ' + seen.size)
check(r.set('top', 'item', 'labcoat') === false && r.get().top !== 'labcoat', 'a locked item cannot be picked')
check(r.set('top', 'item', 'jetpack') === false, 'an unknown item cannot be picked')

// 7. Names read well and every string exists in all nine sets.
const en = EXTRA.en
const t = (k) => en[k] || ('??' + k)
const look = { ...STARTER, top: 'hoodie', topColor: 'sage', topPattern: 'stripes' }
check(nameFor('top', look, t) === 'Sage Stripes Hoodie', 'name format: ' + nameFor('top', look, t))
check(nameFor('top', { ...look, topPattern: 'plain' }, t) === 'Sage Hoodie', 'plain pattern is left out')
check(nameFor('head', STARTER, t) === 'No hat', 'empty head slot says what it is')
check(allNames(look, t).length === 5 && allNames(look, t).every((n) => n && !n.includes('??') && !n.includes('{')), 'all five names are whole')
for (const lang of Object.keys(EXTRA)) {
  if (lang === 'simple') continue
  for (const k of stringKeys()) check(EXTRA[lang] && EXTRA[lang][k], lang + ' is missing ' + k)
}
for (const k of ['myLook', 'mlRandom', 'mlReset', 'mlSave', 'mlSaved', 'ls_head', 'ls_top', 'ls_bottom', 'ls_feet', 'ls_extra', 'mlColor', 'mlPattern', 'mlItem']) check(en[k], 'en is missing ' + k)
check(en.mlSaved === 'Look saved', 'toast text')

// 8. Pattern tiles: plain is untouched, the others only darken (never brighter than the color), and each differs from plain.
for (const p of PATTERNS) {
  let min = 1; let max = 0
  for (let y = 0; y < TILE; y++) for (let x = 0; x < TILE; x++) { const v = patternValue(p, x, y); min = Math.min(min, v); max = Math.max(max, v) }
  check(max <= 1, p + ' brightens')
  check(p === 'plain' ? min === 1 : min < 1 && min >= 0.55, p + ' tile range')
}

if (fail.length) {
  console.error('outfits check FAILED')
  for (const f of fail.slice(0, 20)) console.error(' - ' + f)
  process.exit(1)
}
console.log('outfits ok')
