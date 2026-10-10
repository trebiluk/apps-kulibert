// World rules R1. Pure, no browser.
import { Rules, ALIASES } from '../src/rules.js'

const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg) }

const langs = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']
const scripts = {
  en: /[A-Za-z]/, es: /[A-Za-zÁÉÍÓÚáéíóúñ]/, rw: /[A-Za-z]/,
  uk: /[А-Яа-яІіЇїЄєҐґ]/, ru: /[А-Яа-яЁё]/,
  ar: /[\u0600-\u06FF]/, 'fa-AF': /[\u0600-\u06FF]/, ti: /[\u1200-\u137F]/,
}

eq(Object.keys(Rules.dump()).length === 0, 'dump of defaults is {} ' + JSON.stringify(Rules.dump()))
eq(Rules.allow(null, 'core.break', {}).ok === true, 'break starts on')
eq(Rules.allow({ admin: true }, 'core.place', { teacher: true }).ok === true, 'place starts on')
eq(Rules.allow(null, 'core.fly').ok === true, 'fly default is today')

Rules.set('core.break', false)
Rules.set('core.craft', false)
const dumped = Rules.dump()
eq(dumped['core.break'] === false && dumped['core.craft'] === false && dumped['core.place'] == null && dumped['core.fly'] == null, 'dump only changes ' + JSON.stringify(dumped))
const round = JSON.parse(JSON.stringify(dumped))
Rules.load({})
eq(Object.keys(Rules.dump()).length === 0 && Rules.allow(null, 'core.break').ok === true, 'empty load is defaults')
Rules.load(round)
eq(Rules.allow(null, 'core.break').ok === false && Rules.allow(null, 'core.craft').ok === false && Rules.allow(null, 'core.place').ok === true, 'load round trip')
eq(JSON.stringify(Rules.dump()) === JSON.stringify(round), 'dump matches loaded')
eq(JSON.stringify(round) === JSON.stringify(dumped), 'load did not mutate the saved object')

Rules.set('core.break', true)
eq(Rules.dump()['core.break'] == null && Rules.allow(null, 'core.break').ok === true, 'set back to default drops the key')

Rules.load({ 'core.place': false, 'pack.future.glow': 3, 'pack.future.flag': false })
eq(Rules.dump()['pack.future.glow'] === 3 && Rules.dump()['pack.future.flag'] === false, 'unknown ids survive ' + JSON.stringify(Rules.dump()))
eq(Rules.allow(null, 'pack.future.flag').ok === false, 'unknown false is off')
eq(Rules.allow(null, 'pack.future.glow').ok === true, 'unknown other value stays allowed')
eq(Rules.allow(null, 'core.place', { kind: 'oven' }).ok === false, 'place off')
const again = Rules.dump()
Rules.load(again)
eq(again['pack.future.glow'] === 3 && Rules.dump()['pack.future.glow'] === 3, 'unknown survives a second load')

for (const id of ['core.break', 'core.place', 'core.craft', 'core.station.open', 'core.fly']) {
  const seen = new Set()
  for (const lang of langs) {
    const line = Rules.why(id, lang)
    eq(!!line && scripts[lang].test(line), id + ' ' + lang + ' toast ' + line)
    if (lang !== 'en') seen.add(line)
  }
  eq(seen.size >= 6, id + ' translations differ')
}

ALIASES['old.break'] = 'core.break'
Rules.load({})
Rules.set('old.break', false)
eq(Rules.allow(null, 'old.break').ok === false && Rules.allow(null, 'core.break').ruleId === 'core.break', 'alias allow')
eq(Rules.dump()['core.break'] === false && Rules.dump()['old.break'] == null, 'alias stores the permanent id')
delete ALIASES['old.break']
Rules.load({})

eq(Rules.allow({ team: 'teacher' }, 'core.station.open', { kind: 'oven' }).ok === true, 'teacher does not bypass')

// Entry points. Crafting off changes nothing and toasts once. Crafting on still makes the item.
function hasClass(n, c) { return (' ' + (n.className || '') + ' ').includes(' ' + c + ' ') }
function walk(n, out) {
  if (!n || typeof n !== 'object') return
  out.push(n)
  for (const c of n.children || []) walk(c, out)
}
function matchSel(n, sel) {
  if (sel.startsWith('.')) return sel.split('.').filter(Boolean).every((c) => hasClass(n, c))
  if (sel.startsWith('#')) return n.id === sel.slice(1)
  return n.tag === sel
}
const made = []
function node(tag) {
  const n = {
    tag, className: '', id: '', textContent: '', title: '', type: '', disabled: false, hidden: false,
    style: {}, dataset: {}, children: [], attrs: {}, listeners: {}, isConnected: true, clientWidth: 0,
    append(...xs) { for (const x of xs) if (x && typeof x === 'object') n.children.push(x) },
    setAttribute(k, v) { n.attrs[k] = String(v); if (k === 'id') n.id = String(v) },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(n.attrs, k) ? n.attrs[k] : null },
    addEventListener(ev, fn) { (n.listeners[ev] || (n.listeners[ev] = [])).push(fn) },
    removeEventListener() {},
    remove() {},
    click() { for (const fn of n.listeners.click || []) fn({ preventDefault() {}, stopPropagation() {} }) },
    closest() { return null },
    querySelector(sel) { return n.querySelectorAll(sel)[0] || null },
    querySelectorAll(sel) {
      const all = []
      walk(n, all)
      return all.filter((x) => x !== n && matchSel(x, sel))
    },
  }
  n.classList = {
    add(...cs) { for (const c of cs) if (c && !hasClass(n, c)) n.className = (n.className + ' ' + c).trim() },
    remove(c) { n.className = n.className.split(/\s+/).filter((x) => x && x !== c).join(' ') },
    toggle(c, on) {
      const has = hasClass(n, c)
      const next = on === undefined ? !has : !!on
      if (next) n.classList.add(c)
      else n.classList.remove(c)
    },
    contains(c) { return hasClass(n, c) },
  }
  Object.defineProperty(n, 'innerHTML', { get() { return '' }, set() { n.children.length = 0 } })
  if (tag === 'canvas') n.getContext = () => new Proxy({}, { get: () => () => {} })
  made.push(n)
  return n
}
globalThis.document = {
  documentElement: node('html'),
  body: node('body'),
  createElement: node,
  createRange() { return { setStart() {}, setEnd() {}, getClientRects: () => [] } },
  getElementById(id) { return made.find((n) => n.id === id) || null },
  querySelector(sel) { return made.find((n) => matchSel(n, sel)) || null },
  querySelectorAll(sel) { return made.filter((n) => matchSel(n, sel)) },
  addEventListener() {},
  removeEventListener() {},
}
globalThis.window = globalThis
globalThis.addEventListener = globalThis.addEventListener || (() => {})
globalThis.requestAnimationFrame = () => 0
globalThis.matchMedia = () => ({ matches: false })
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
let craftOpts = null
globalThis.KulibertSlots = { ui: { craftPanel(_side, opts) { craftOpts = opts } } }

const { createSession } = await import('../src/session.js')
const { createStations } = await import('../src/stations.js')
const { RECIPES } = await import('../src/data/recipes.js')
const stick = RECIPES.find((r) => r.id === 'stick')

function world() {
  const blocked = []
  const s = createSession({
    t: (k) => k,
    toast() {},
    blocked: () => blocked.push('core.craft'),
    getVoxel: () => 22,
    pos: () => [8, 5, 8],
    heading: () => 0,
    tableOn: () => false,
    markDirty() {},
  })
  s.setMode('survival')
  return { s, blocked }
}
function openStick(s) {
  craftOpts = null
  s.focusCraft('stick')
  const g = node('div')
  s.paintCraft(g)
  return craftOpts
}
function snap(s) { return s.bag.count('planks') + ':' + s.bag.count('stick') + ':' + s.bag.count('bunk') + ':' + s.bag.count('woolBlue') }

Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const before = snap(s)
  const opts = openStick(s)
  opts.onFill()
  eq(snap(s) === before && blocked.length === 1, 'fill off ' + snap(s) + ' toasts ' + blocked.length)
}
Rules.set('core.craft', true)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const opts = openStick(s)
  opts.onFill()
  opts.onMake()
  eq(s.bag.count('planks') === 14 && s.bag.count('stick') === 4 && blocked.length === 0, 'fill+make on ' + snap(s))
}
Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const opts = openStick(s)
  Rules.set('core.craft', true)
  opts.onFill()
  Rules.set('core.craft', false)
  const before = snap(s)
  blocked.length = 0
  openStick(s).onMake()
  eq(snap(s) === before && blocked.length === 1, 'make off ' + snap(s) + ' toasts ' + blocked.length)
}
Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const before = snap(s)
  openStick(s).onMax()
  eq(snap(s) === before && blocked.length === 1, 'xmax off ' + snap(s) + ' toasts ' + blocked.length)
}
Rules.set('core.craft', true)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const g = node('div')
  s.focusCraft('stick')
  s.paintCraft(g)
  craftOpts.onMax()
  const yes = g.querySelector('.xmax-yes')
  Rules.set('core.craft', false)
  const before = snap(s)
  yes.click()
  eq(!!yes && snap(s) === before && blocked.length === 1, 'xmax confirm off ' + snap(s) + ' toasts ' + blocked.length)
}
Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const before = snap(s)
  const ok = s.craftMany(stick, 2)
  eq(ok === false && snap(s) === before && blocked.length === 1, 'craftMany off ' + snap(s) + ' toasts ' + blocked.length)
}
Rules.set('core.craft', true)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const ok = s.craftMany(stick, 1)
  eq(ok === true && s.bag.count('planks') === 14 && s.bag.count('stick') === 4 && blocked.length === 0, 'craftMany on ' + snap(s))
}
Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const before = snap(s)
  const res = s.tryCraft('stick')
  eq(res && res.ok === false && res.why === 'rule' && snap(s) === before && blocked.length === 1, 'tryCraft off ' + JSON.stringify(res) + ' ' + snap(s))
}
Rules.set('core.craft', true)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const res = s.tryCraft('stick')
  eq(res && res.ok === true && s.bag.count('planks') === 14 && s.bag.count('stick') === 4 && blocked.length === 0, 'tryCraft on ' + JSON.stringify(res))
}
Rules.set('core.craft', false)
{
  const { s, blocked } = world()
  s.give('planks', 16)
  const before = snap(s)
  openStick(s).onFill()
  eq(snap(s) === before && blocked.length === 1, 'bag tab off ' + snap(s) + ' toasts ' + blocked.length)
}

function shopCase(on) {
  Rules.set('core.craft', on)
  const { s, blocked } = world()
  s.give('planks', 6)
  s.give('woolBlue', 6)
  s.give('safetyGlasses', 1)
  s.give('measuringTape', 1)
  s.give('handSaw', 1)
  s.give('hammer', 1)
  const stations = createStations({
    t: (k) => k,
    touch() {},
    have: (item) => s.bag.count(item),
    spend: (item, n) => s.spend(item, n),
    give: (item, n) => s.give(item, n || 1),
    giveBed: (d) => s.giveBed(d),
    craftOk: (id) => s.craftOk(id),
    best: () => ({ stars: 3, tone: 'natural', fabric: 'woolBlue', pattern: 'plain' }),
    rules: () => ({ path: 'choose', help: false, required: false }),
    teacher: () => false,
    safetyDue: () => false,
    icon() { const n = node('span'); n.dataset.block = '1'; return n },
  })
  const g = node('div')
  stations.paint(g, '1,5,1', 'woodshop')
  return { s, blocked, g }
}
for (const kind of ['bed-just', 'bed-design', 'bed-remake']) {
  const { s, blocked, g } = shopCase(false)
  const before = snap(s)
  const btn = g.querySelector('.' + kind)
  eq(!!btn, kind + ' button')
  if (btn) btn.click()
  eq(snap(s) === before && blocked.length === 1 && s.bag.count('bunk') === 0, kind + ' off ' + snap(s) + ' toasts ' + blocked.length)
}
{
  const { s, blocked, g } = shopCase(true)
  g.querySelector('.bed-just').click()
  eq(s.bag.count('bunk') === 1 && s.bag.count('planks') === 3 && s.bag.count('woolBlue') === 3 && blocked.length === 0, 'just build on ' + snap(s))
}
{
  const { s, blocked, g } = shopCase(true)
  g.querySelector('.bed-design').click()
  eq(s.bag.count('bunk') === 0 && s.bag.count('planks') === 6 && !!g.querySelector('.bed-step') && blocked.length === 0, 'design on ' + snap(s))
}
{
  const { s, blocked, g } = shopCase(true)
  g.querySelector('.bed-remake').click()
  eq(s.bag.count('bunk') === 1 && s.bag.count('planks') === 3 && blocked.length === 0, 'remake on ' + snap(s))
}
Rules.load({})

if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('rules-check ok')
process.exit(0)
