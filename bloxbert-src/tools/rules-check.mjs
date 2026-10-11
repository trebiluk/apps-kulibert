// World rules R1. Pure, no browser.
import { Rules, ALIASES, GROUPS } from '../src/rules.js'
import { paintRules, rulesWord } from '../src/rules-editor.js'
import { createBasics } from '../src/basics.js'

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
    tag, className: '', id: '', textContent: '', title: '', type: '', value: '', disabled: false, hidden: false,
    style: {}, dataset: {}, children: [], attrs: {}, listeners: {}, isConnected: true, clientWidth: 0,
    append(...xs) { for (const x of xs) if (x && typeof x === 'object') { x.parent = n; n.children.push(x) } },
    setAttribute(k, v) { n.attrs[k] = String(v); if (k === 'id') n.id = String(v) },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(n.attrs, k) ? n.attrs[k] : null },
    addEventListener(ev, fn) { (n.listeners[ev] || (n.listeners[ev] = [])).push(fn) },
    removeEventListener() {},
    remove() {},
    click() { for (const fn of n.listeners.click || []) fn({ preventDefault() {}, stopPropagation() {} }) },
    focus() { if (globalThis.document) globalThis.document.activeElement = n },
    getBoundingClientRect() {
      let p = n
      while (p) {
        if (p.hidden) return { x: -314, y: 0, left: -314, top: 0, width: 200, height: 48, right: -114, bottom: 48 }
        p = p.parent
      }
      return { x: 16, y: 80, left: 16, top: 80, width: 96, height: 72, right: 112, bottom: 152 }
    },
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
  if (tag === 'canvas') n.getContext = () => new Proxy({
    createImageData(w, h) {
      const width = w && typeof w === 'object' ? (w.width || 16) : (w || 16)
      const height = w && typeof w === 'object' ? (w.height || 16) : (h || width)
      return { data: new Uint8ClampedArray(width * height * 4), width, height }
    },
  }, { get(t, p) { return p in t ? t[p] : () => {} } })
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
globalThis.cancelAnimationFrame = () => {}
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

const scriptsUi = {
  en: /[A-Za-z]/, es: /[A-Za-zÁÉÍÓÚáéíóúñ¿]/, rw: /[A-Za-z]/,
  uk: /[А-Яа-яІіЇїЄєҐґ]/, ru: /[А-Яа-яЁё]/,
  ar: /[\u0600-\u06FF]/, 'fa-AF': /[\u0600-\u06FF]/, ti: /[\u1200-\u137F]/,
}
for (const lang of langs) eq(scriptsUi[lang].test(rulesWord(lang)), 'rules title ' + lang + ' ' + rulesWord(lang))
const byId = Object.fromEntries(Rules.rows().map((d) => [d.id, d]))
eq(byId['core.break'].display === 'building' && byId['core.place'].display === 'building', 'building group')
eq(byId['core.craft'].display === 'crafting' && byId['core.station.open'].display === 'crafting', 'crafting group')
eq(byId['core.fly'].display === 'movement' && byId['core.fly'].soon === true, 'movement group')
eq(['core.break', 'core.place', 'core.craft', 'core.station.open', 'core.fly'].every((id) => byId[id].group === 'core') && GROUPS.building.en === 'Building', 'ids stay core')
eq(GROUPS.survival && GROUPS.survival.en === 'Survival', 'survival group name')

function allNodes(root) {
  const out = []
  walk(root, out)
  return out
}
function rowIds(root) {
  return allNodes(root).filter((n) => n.dataset && n.dataset.id && hasClass(n, 're-row')).map((n) => n.dataset.id)
}
function fireInput(input, text) {
  input.value = text
  for (const fn of input.listeners.input || []) fn({ target: input })
}

const saves = []
const dirties = []
const editor = node('div')
paintRules(editor, {
  lang: 'en',
  markDirty: () => dirties.push(1),
  save: () => { saves.push(JSON.parse(JSON.stringify(Rules.dump()))) },
})
eq(rowIds(editor).slice().sort().join(',') === 'core.break,core.place', 'building rows ' + rowIds(editor).join(','))
allNodes(editor).find((n) => n.dataset && n.dataset.group === 'crafting').click()
eq(rowIds(editor).slice().sort().join(',') === 'core.craft,core.station.open,station.bench,station.oven,station.woodshop', 'crafting rows ' + rowIds(editor).join(','))
allNodes(editor).find((n) => n.dataset && n.dataset.group === 'movement').click()
eq(rowIds(editor).join(',') === 'core.fly', 'movement row')
const flyToggle = allNodes(editor).find((n) => hasClass(n, 're-toggle') && n.disabled && n.textContent === 'Coming soon')
eq(!!flyToggle, 'fly is read-only')
if (flyToggle) flyToggle.click()
eq(Rules.dump()['core.fly'] == null, 'fly click does not save')
allNodes(editor).find((n) => n.dataset && n.dataset.group === 'building').click()

fireInput(editor.querySelector('.re-search'), 'craft')
eq(rowIds(editor).join(',') === 'core.craft', 'search craft ' + rowIds(editor).join(','))
fireInput(editor.querySelector('.re-search'), '')
const breakRow = allNodes(editor).find((n) => n.dataset && n.dataset.id === 'core.break' && hasClass(n, 're-row'))
const breakToggle = breakRow.querySelector('.re-toggle')
breakToggle.click()
eq(Rules.allow(null, 'core.break').ok === false && saves.length === 1 && saves[0]['core.break'] === false && dirties.length === 1, 'toggle break saves ' + JSON.stringify(saves))
eq(allNodes(editor).some((n) => hasClass(n, 're-note') && n.textContent === 'Rules changed'), 'rules changed note')
editor.querySelector('.re-changed').click()
eq(rowIds(editor).join(',') === 'core.break', 'changed only ' + rowIds(editor).join(','))
editor.querySelector('.re-reset').click()
eq(Rules.allow(null, 'core.break').ok === false && !!editor.querySelector('.re-yes') && !!editor.querySelector('.re-ask'), 'reset waits for confirm')
editor.querySelector('.re-yes').click()
eq(Object.keys(Rules.dump()).length === 0 && saves[saves.length - 1] && Object.keys(saves[saves.length - 1]).length === 0, 'reset clears dump')

Rules.set('pack.future.glow', 3)
const packHost = node('div')
paintRules(packHost, { lang: 'en' })
const packRow = allNodes(packHost).find((n) => n.dataset && n.dataset.id === 'pack.future.glow')
eq(!packRow, 'pack row hidden until its group')
const packBtn = allNodes(packHost).find((n) => n.dataset && n.dataset.group === 'pack')
eq(!!packBtn, 'pack group shows')
if (packBtn) packBtn.click()
const packShown = allNodes(packHost).find((n) => n.dataset && n.dataset.id === 'pack.future.glow' && hasClass(n, 're-pack'))
eq(!!packShown && allNodes(packShown).some((n) => n.textContent === 'Pack not installed'), 'pack row is greyed')
Rules.load({})

globalThis.location = { search: '' }
const sheetNodes = {}
for (const id of ['sheet', 'sheet-body', 'sheet-title', 'sheet-back', 'sheet-x']) {
  const n = node(id === 'sheet-title' ? 'b' : id === 'sheet' || id === 'sheet-body' ? 'div' : 'button')
  n.id = id
  sheetNodes[id] = n
}
sheetNodes.sheet.hidden = true
sheetNodes.sheet.append(sheetNodes['sheet-title'], sheetNodes['sheet-back'], sheetNodes['sheet-x'], sheetNodes['sheet-body'])
document.body.append(sheetNodes.sheet)
document.documentElement.clientWidth = 412
document.documentElement.clientHeight = 800
const menuBtn = node('button')
menuBtn.id = 'game-menu'
menuBtn.textContent = 'Menu'
document.body.append(menuBtn)
const { mountPanels } = await import('../src/panels.js')
let who = { teacher: false, staff: false }
let painted = 0
const panels = mountPanels({
  t: (k) => (k === 'worldRules' ? 'World Rules' : k),
  teacher: () => who.teacher,
  staff: () => who.staff,
  paintTeacher(g) {
    const p = node('p')
    p.className = 'gnote'
    p.textContent = 'teacher-body'
    g.append(p)
  },
  paintRules() { painted += 1 },
  rulesWord: () => 'Rules',
  worldRules() { showRulesCard({ force: true, lang: 'en', world: 'town' }) },
  closePlay() { sheetNodes.sheet.hidden = true },
})
menuBtn.addEventListener('click', () => panels.openRoot())
const sheetBody = document.getElementById('sheet-body')
panels.open('teacher')
eq(!allNodes(sheetBody).some((n) => n.dataset && n.dataset.rulesTile), 'student has no Rules tile')
who = { teacher: true, staff: true }
panels.open('teacher')
eq(allNodes(sheetBody).some((n) => n.dataset && n.dataset.rulesTile), 'teacher has Rules tile')
painted = 0
panels.open('rules')
eq(painted === 1 && document.getElementById('sheet').dataset.panel === 'rules', 'rules sheet paints')
who = { teacher: false, staff: false }
const before = painted
panels.open('rules')
eq(painted === before, 'student rules sheet does not paint')

Rules.load({})
eq(Object.keys(Rules.dump()).length === 0 && Rules.value('survival.daynight') === 'cycle', 'old world is cycle')
eq(['bench', 'oven', 'woodshop', 'vend'].every((k) => Rules.allow(null, 'core.station.open', { kind: k }).ok), 'old world stations open')
eq(!Rules.rows().some((d) => d.id === 'station.sewing' || d.id === 'station.loom' || d.id === 'station.craft'), 'missing kinds skipped')
for (const id of ['station.bench', 'station.oven', 'station.woodshop', 'survival.daynight', 'survival.energy']) {
  const d = byId[id]
  eq(!!d, 'registered ' + id)
  for (const lang of langs) {
    eq(!!d.label[lang] && scripts[lang].test(d.label[lang]), id + ' label ' + lang + ' ' + (d.label && d.label[lang]))
    eq(!!d.desc[lang] && scripts[lang].test(d.desc[lang]), id + ' desc ' + lang)
    if (id.startsWith('station.')) eq(!!Rules.why(id, lang) && scripts[lang].test(Rules.why(id, lang)), id + ' why ' + lang)
  }
  if (d.options) for (const o of d.options) for (const lang of langs) eq(!!o.label[lang] && scripts[lang].test(o.label[lang]), id + ' ' + o.id + ' ' + lang)
}
for (const lang of langs) eq(scripts[lang].test(GROUPS.survival[lang]), 'survival header ' + lang)

Rules.set('station.oven', false)
{
  const oven = Rules.allow(null, 'core.station.open', { kind: 'oven' })
  const ovenLine = Rules.why('core.station.open', 'en')
  const bench = Rules.allow(null, 'core.station.open', { kind: 'bench' })
  eq(oven.ok === false && oven.rule === 'station.oven', 'oven allow ' + JSON.stringify(oven))
  eq(ovenLine === 'The teacher turned off the Oven.', 'oven toast line ' + ovenLine)
  eq(bench.ok === true && bench.rule === 'core.station.open', 'bench still allowed')
  eq(Rules.why('station.oven', 'uk') && scripts.uk.test(Rules.why('station.oven', 'uk')), 'oven why uk')
}
eq(JSON.stringify(Rules.dump()) === JSON.stringify({ 'station.oven': false }), 'only oven stored ' + JSON.stringify(Rules.dump()))
Rules.set('core.station.open', false)
eq(['oven', 'bench', 'woodshop', 'vend'].every((k) => {
  const g = Rules.allow(null, 'core.station.open', { kind: k })
  return g.ok === false && g.rule === 'core.station.open'
}), 'parent off blocks every station')
eq(Rules.why('core.station.open', 'en') === 'Stations are off in this world', 'parent toast')
Rules.load({})
Rules.set('station.woodshop', false)
eq(Rules.allow(null, 'core.station.open', { kind: 'woodshop' }).rule === 'station.woodshop', 'woodshop only')
eq(Rules.allow(null, 'core.station.open', { kind: 'oven' }).ok === true && Rules.allow(null, 'core.station.open', { kind: 'bench' }).ok === true, 'other stations stay')
Rules.load({ 'survival.daynight': 'night', 'station.oven': false, 'survival.energy': 'fast', 'survival.daynight.nope': 'noon' })
eq(Rules.value('survival.daynight') === 'night' && Rules.dump()['station.oven'] === false, 'load night and oven')
eq(Rules.value('survival.energy') === 'fast' && Rules.dump()['survival.energy'] === 'fast', 'energy can be stored for the next step')
Rules.load({ 'survival.daynight': 'noon' })
eq(Rules.value('survival.daynight') === 'cycle' && Rules.dump()['survival.daynight'] == null, 'bad sky value drops')
Rules.load({})

const skyApi = { now: () => 5000, get: () => 0, set() {}, toast() {}, t: (k) => k, survival: () => false, teacher: () => false, gift() {}, card() {}, badge() {}, flagDay() {}, give() {}, changed() {} }
const sky = createBasics(skyApi)
sky.boot(false)
eq(sky.always === true && sky.phase() === 'day' && sky.lum() === 1, 'cycle keeps always-day ' + sky.phase() + ' ' + sky.lum())
Rules.set('survival.daynight', 'night')
eq(sky.phase() === 'night' && Math.abs(sky.lum() - 0.4) < 0.001 && sky.always === true, 'night holds sky ' + sky.lum() + ' pref ' + sky.always)
Rules.set('survival.daynight', 'day')
eq(sky.phase() === 'day' && sky.lum() === 1 && sky.always === true, 'day forces day')
sky.setAlways(false)
Rules.set('survival.daynight', 'cycle')
sky.seek(sky.nightAt())
eq(sky.always === false && sky.phase() === 'night', 'cycle follows the clock ' + sky.phase())
Rules.set('survival.daynight', 'day')
eq(sky.phase() === 'day' && sky.lum() === 1 && sky.always === false, 'day wins over the clock')
Rules.set('survival.daynight', 'cycle')
eq(sky.phase() === 'night' && sky.always === false, 'cycle returns the kid pref')
sky.setAlways(true)
eq(sky.phase() === 'day' && sky.lum() === 1, 'kid always-day is back')
const roundSky = JSON.parse(JSON.stringify(Rules.dump()))
Rules.load({})
Rules.load(roundSky)
eq(Object.keys(roundSky).length === 0 && Rules.value('survival.daynight') === 'cycle', 'cycle is not stored')
Rules.set('survival.daynight', 'night')
const dumpedSky = JSON.parse(JSON.stringify(Rules.dump()))
Rules.load({})
Rules.load(dumpedSky)
eq(Rules.value('survival.daynight') === 'night' && sky.phase() === 'night', 'night survives dump load')
Rules.load({})

const rtlAr = node('div')
paintRules(rtlAr, { lang: 'ar' })
eq(rtlAr.querySelector('.re-wrap').getAttribute('dir') === 'rtl', 'arabic rtl')
const rtlFa = node('div')
paintRules(rtlFa, { lang: 'fa-AF' })
eq(rtlFa.querySelector('.re-wrap').getAttribute('dir') === 'rtl', 'dari rtl')
const rtlEn = node('div')
paintRules(rtlEn, { lang: 'en' })
eq(rtlEn.querySelector('.re-wrap').getAttribute('dir') === 'ltr', 'english ltr')

const surv = node('div')
paintRules(surv, { lang: 'en', save() {} })
allNodes(surv).find((n) => n.dataset && n.dataset.group === 'survival').click()
eq(rowIds(surv).slice().sort().join(',') === 'survival.daynight,survival.energy', 'survival rows ' + rowIds(surv).join(','))
const skyRow = allNodes(surv).find((n) => n.dataset && n.dataset.id === 'survival.daynight' && hasClass(n, 're-row'))
eq(!!skyRow && textOf(skyRow).includes('\u2600') && !textOf(skyRow).includes('\u{1F319}'), 'editor row keeps the sun')
const energy = allNodes(surv).find((n) => n.dataset && n.dataset.id === 'survival.energy')
eq(!!energy && allNodes(energy).some((n) => n.textContent === 'Coming soon'), 'energy soon tag')
const fast = allNodes(energy).find((n) => n.dataset && n.dataset.opt === 'fast')
eq(!!fast && fast.disabled, 'energy choice disabled')
if (fast) fast.click()
eq(Rules.value('survival.energy') === 'normal' && Rules.dump()['survival.energy'] == null, 'energy changes nothing')
const nightBtn = allNodes(surv).find((n) => n.dataset && n.dataset.opt === 'night')
eq(!!nightBtn && !nightBtn.disabled, 'night choice')
if (nightBtn) nightBtn.click()
eq(Rules.dump()['survival.daynight'] === 'night' && sky.phase() === 'night', 'editor night')
const dayBtn = allNodes(surv).find((n) => n.dataset && n.dataset.opt === 'cycle')
if (dayBtn) dayBtn.click()
eq(Rules.dump()['survival.daynight'] == null, 'editor cycle clears')

Rules.load({})
const ovenEd = node('div')
const ovenSaves = []
paintRules(ovenEd, { lang: 'en', markDirty() {}, save() { ovenSaves.push(JSON.parse(JSON.stringify(Rules.dump()))) } })
allNodes(ovenEd).find((n) => n.dataset && n.dataset.group === 'crafting').click()
const ovenRow = allNodes(ovenEd).find((n) => n.dataset && n.dataset.id === 'station.oven' && hasClass(n, 're-row'))
ovenRow.querySelector('.re-toggle').click()
const ovenGate = Rules.allow(null, 'core.station.open', { kind: 'oven' })
const ovenWhy = Rules.why('core.station.open', 'en')
eq(ovenGate.rule === 'station.oven', 'editor oven off')
eq(ovenWhy === 'The teacher turned off the Oven.', 'editor oven why ' + ovenWhy)
eq(Rules.allow(null, 'core.station.open', { kind: 'bench' }).ok === true, 'editor bench on')
eq(JSON.stringify(ovenSaves[0]) === JSON.stringify({ 'station.oven': false }), 'editor stores only oven ' + JSON.stringify(ovenSaves[0]))
ovenEd.querySelector('.re-reset').click()
ovenEd.querySelector('.re-yes').click()
eq(Rules.allow(null, 'core.station.open', { kind: 'oven' }).ok === true && Object.keys(Rules.dump()).length === 0, 'reset opens oven')

const added = Rules.registerPack('demo', [{ id: 'lamp', type: 'bool', def: true, group: 'crafting', icon: '✦', label: { en: 'Lamp' }, desc: { en: 'A pack lamp.' } }])
eq(added === 1 && Rules.rows().some((d) => d.id === 'demo.lamp' && d.pack === 'demo' && d.display === 'crafting'), 'registerPack tags the row')
eq(Rules.registerPack('demo', [{ id: 'lamp', type: 'bool', def: true, display: 'crafting' }]) === 0, 'registerPack does not double')
const packCraft = node('div')
paintRules(packCraft, { lang: 'en' })
allNodes(packCraft).find((n) => n.dataset && n.dataset.group === 'crafting').click()
eq(rowIds(packCraft).includes('demo.lamp'), 'pack row under crafting ' + rowIds(packCraft).join(','))
Rules.load({})

const { showRulesCard, diffs } = await import('../src/rules-card.js')
const { STR } = await import('../src/strings.js')
const keyFns = []
document.addEventListener = (ev, fn) => { keyFns.push({ ev, fn }) }
function cardEl() { return document.getElementById('rules-card') }
function tilesOf() {
  const card = cardEl()
  return card ? card.querySelectorAll('.rc-tile') : []
}
function textOf(n) {
  if (!n) return ''
  let s = n.textContent || ''
  for (const c of n.children || []) s += textOf(c)
  return s
}
function parseHex(s) {
  const m = String(s || '').trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
function contrast(a, b) {
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
  const L = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b)
  const hi = Math.max(L(a), L(b))
  const lo = Math.min(L(a), L(b))
  return (hi + 0.05) / (lo + 0.05)
}
function cssBlocks() {
  const s = document.getElementById('rules-card-css')
  if (!s || !s.textContent) return []
  const out = []
  for (const block of s.textContent.split('}')) {
    const i = block.indexOf('{')
    if (i < 0) continue
    const sels = block.slice(0, i).split(',').map((x) => x.trim()).filter(Boolean)
    const decl = {}
    for (const part of block.slice(i + 1).split(';')) {
      const c = part.indexOf(':')
      if (c < 0) continue
      decl[part.slice(0, c).trim()] = part.slice(c + 1).trim()
    }
    out.push({ sels, decl })
  }
  return out
}
function selMatches(el, sel) {
  const focus = document.activeElement === el
  if (sel.includes(':focus-visible') && !focus) return false
  if (/(?<![\w-]):focus(?![\w-])/.test(sel) && !sel.includes(':focus-visible') && !focus) return false
  const base = sel.replace(/:focus-visible|:focus/g, '')
  if (base.includes('.rc-got') && !hasClass(el, 'rc-got')) return false
  if (base.includes('#rules-card')) {
    let p = el
    let ok = false
    while (p) { if (p.id === 'rules-card') ok = true; p = p.parent }
    if (!ok) return false
  }
  return base.includes('.rc-got')
}
globalThis.getComputedStyle = (el) => {
  const style = { color: '', backgroundColor: '' }
  for (const rule of cssBlocks()) {
    if (!rule.sels.some((s) => selMatches(el, s))) continue
    if (rule.decl.color) style.color = rule.decl.color
    if (rule.decl['background-color']) style.backgroundColor = rule.decl['background-color']
    else if (rule.decl.background) style.backgroundColor = rule.decl.background
  }
  return style
}
document.documentElement.clientWidth = 412
document.documentElement.clientHeight = 800
function worldRulesTile() {
  menuBtn.click()
  const host = document.getElementById('sheet')
  const tiles = host.querySelectorAll('.gtile')
  return tiles.find((n) => textOf(n).includes('World Rules'))
}

showRulesCard({ lang: 'en', world: 'town' })
eq(!cardEl() || cardEl().hidden, 'zero rules no card')

Rules.set('station.oven', false)
Rules.set('survival.daynight', 'night')
showRulesCard({ lang: 'en', world: 'town', teacher: true })
eq(!cardEl() || cardEl().hidden, 'teacher skips the card on join')
eq(showRulesCard({ lang: 'en', world: 'town' }) === true, 'reload shows the card')
eq(tilesOf().length === 2, 'two tiles ' + tilesOf().length)
eq(tilesOf().some((n) => textOf(n).includes('Oven off') && textOf(n).includes('🔥')), 'oven off tile ' + tilesOf().map((n) => textOf(n)).join('|'))
eq(tilesOf().some((n) => textOf(n).includes('Always night') && textOf(n).includes('\u{1F319}') && !textOf(n).includes('\u2600')), 'always night moon ' + tilesOf().map((n) => textOf(n)).join('|'))
eq(showRulesCard({ lang: 'en', world: 'town' }) === false && !cardEl().hidden, 'once per session while it is open')
cardEl().querySelector('.rc-got').click()
eq(cardEl().hidden === true, 'got it closes')
eq(showRulesCard({ lang: 'en', world: 'town' }) === false && cardEl().hidden === true, 'got it stays closed')

const menuHost = node('nav')
const inspect = node('button')
inspect.id = 'm-inspect'
menuHost.append(inspect)
eq(!menuHost.querySelector('#m-rules'), 'drawer row is gone')
const tile = worldRulesTile()
const box = tile && tile.getBoundingClientRect()
const vw = document.documentElement.clientWidth
const vh = document.documentElement.clientHeight
eq(!!tile && hasClass(tile, 'gtile') && textOf(tile).includes('\u2691'), 'menu tile ' + textOf(tile))
eq(!!box && box.left >= 0 && box.top >= 0 && box.right <= vw && box.bottom <= vh && box.width >= 44 && box.height >= 44, 'tile in view ' + JSON.stringify(box))
tile.click()
eq(cardEl().hidden === false && tilesOf().length === 2, 'menu reopens the card')
const gotFocus = cardEl().querySelector('.rc-got')
const focusStyle = getComputedStyle(gotFocus)
const focusContrast = contrast(parseHex(focusStyle.color), parseHex(focusStyle.backgroundColor))
eq(focusContrast >= 4.5, 'focused got it contrast ' + focusContrast + ' ' + focusStyle.color + ' on ' + focusStyle.backgroundColor)
document.activeElement = null
const idleStyle = getComputedStyle(gotFocus)
const idleContrast = contrast(parseHex(idleStyle.color), parseHex(idleStyle.backgroundColor))
eq(idleContrast >= 4.5, 'idle got it contrast ' + idleContrast)
const esc = keyFns.find((k) => k.ev === 'keydown')
eq(!!esc, 'esc is armed')
if (esc) esc.fn({ key: 'Escape', preventDefault() {} })
eq(cardEl().hidden === true, 'esc closes')

Rules.set('core.break', false)
Rules.set('core.place', false)
Rules.set('core.craft', false)
Rules.set('core.station.open', false)
Rules.set('station.bench', false)
Rules.set('station.woodshop', false)
Rules.set('survival.energy', 'fast')
Rules.set('pack.missing.loom', false)
eq(showRulesCard({ lang: 'en', world: 'town' }) === true, 'changed rules show again')
eq(tilesOf().length === 6, 'six tiles ' + tilesOf().length)
eq(!!cardEl().querySelector('.rc-more') && cardEl().querySelector('.rc-more').textContent === '+2 more', 'more ' + (cardEl().querySelector('.rc-more') && cardEl().querySelector('.rc-more').textContent))
eq(!tilesOf().some((n) => n.dataset && (n.dataset.id === 'survival.energy' || n.dataset.id === 'pack.missing.loom' || n.dataset.id === 'core.fly')), 'soon and missing pack stay off the card')

Rules.load({ name: 'Quiet night', 'station.oven': false })
showRulesCard({ force: true, lang: 'en', world: 'town' })
eq(!!cardEl().querySelector('.rc-name') && cardEl().querySelector('.rc-name').textContent === 'Quiet night', 'template name line')
eq(tilesOf().length === 1 && !tilesOf().some((n) => textOf(n).includes('Quiet night')), 'name is not a tile')

Rules.load({})
eq(showRulesCard({ lang: 'en', world: 'town' }) === false && cardEl().hidden === true, 'reset next load has no card')
worldRulesTile().click()
eq(cardEl().hidden === false && cardEl().querySelector('.rc-title').textContent === 'Normal rules' && tilesOf().length === 0, 'menu says normal rules')
cardEl().querySelector('.rc-got').click()
eq(cardEl().hidden === true, 'normal got it closes')

for (const lang of langs) {
  Rules.load({ 'station.oven': false, 'core.break': false, 'survival.daynight': 'night' })
  const rows = diffs(lang)
  eq(rows.length === 3, 'diffs ' + lang + ' ' + rows.length)
  for (const row of rows) eq(!!row.icon && scripts[lang].test(row.text), lang + ' ' + row.id + ' ' + row.text)
  showRulesCard({ force: true, lang })
  const title = cardEl().querySelector('.rc-title').textContent
  const got = cardEl().querySelector('.rc-got').textContent
  eq(scripts[lang].test(title) && scripts[lang].test(got), 'card words ' + lang + ' ' + title + ' / ' + got)
  eq(scripts[lang].test(STR[lang].worldRules), 'menu word ' + lang + ' ' + STR[lang].worldRules)
}
showRulesCard({ force: true, lang: 'ar' })
eq(cardEl().querySelector('.rc-card').getAttribute('dir') === 'rtl', 'arabic card rtl')
showRulesCard({ force: true, lang: 'fa-AF' })
eq(cardEl().querySelector('.rc-card').getAttribute('dir') === 'rtl', 'dari card rtl')
showRulesCard({ force: true, lang: 'en' })
eq(cardEl().querySelector('.rc-card').getAttribute('dir') === 'ltr', 'english card ltr')
const gotBox = cardEl().querySelector('.rc-got')
eq(gotBox, 'got it button')
Rules.load({})

const { Effects } = await import('../src/effects.js')
const { inReach, reachFor, jumpHeight, JUMP_V, WALK } = await import('../src/feel.js')

Effects.load(undefined)
eq(Effects.speedMul() === 1 && Effects.reach(6) === 6 && Object.keys(Effects.dump()).length === 0, 'old world with no effects plays the same')
eq(Effects.list().length === 0, 'load(undefined) clears')

const baseWalk = WALK * 2
Effects.give('speed', { level: 2, ms: 120000 })
eq(Math.abs(WALK * Effects.speedMul() * 2 - baseWalk * 1.5) < 0.001, 'speed II walks 1.5x in 2s ' + (WALK * Effects.speedMul() * 2))
eq(Effects.level('speed') === 2 && Object.keys(Effects.dump()).length === 0, 'session give is not saved')

const baseH = jumpHeight(JUMP_V)
Effects.give('jump', { level: 2, ms: 60000 })
const hi = jumpHeight(Effects.jumpV(JUMP_V))
eq(baseH < 1.4 && hi >= 3.4 && hi < 3.6, 'jump II clears a 3-block wall ' + baseH + ' -> ' + hi)

const blockedFly = Effects.spaceFly(true, false)
eq(blockedFly.ok === false && blockedFly.flying === false, 'survival space without fly stays down')
Effects.give('fly', { ms: 60000 })
const upFly = Effects.spaceFly(true, false)
const downFly = Effects.spaceFly(true, true)
eq(upFly.ok === true && upFly.flying === true && downFly.ok === true && downFly.flying === false, 'fly toggles with the effect')
eq(Effects.spaceFly(false, false).ok === true, 'creative still toggles')

const worldK = 0.4
Effects.load({})
Effects.give('nightVision', { ms: 60000 })
eq(Effects.light(worldK) === worldK, 'night vision does not flash on')
Effects.tick(500)
const mid = Effects.light(worldK)
eq(mid > worldK + 0.2 && mid < worldK + 0.55, 'night vision is fading in, not a flash ' + mid)
Effects.tick(1000)
eq(Effects.light(worldK) > worldK + 0.3 && worldK === 0.4, 'night vision raises light only for this player')

const fallH = 8
const g0 = 32
const t0 = Math.sqrt((2 * fallH) / g0)
const t1 = Math.sqrt((2 * fallH) / Effects.grav(g0))
Effects.give('slowFall', { ms: 60000 })
const tSlow = Math.sqrt((2 * fallH) / Effects.grav(g0))
eq(Effects.grav(g0) === g0 * 0.4 && tSlow > t0 * 1.5 && t1 === t0, 'slow fall lands slower ' + t0 + ' -> ' + tSlow)

const eye = [0.5, 5, 0.5]
const far = [8, 5, 0]
eq(inReach(eye[0], eye[1], eye[2], far[0], far[1], far[2], reachFor(true)) === false, 'reach 6 misses a block 8 away')
Effects.give('longReach', { ms: 60000 })
eq(Effects.reach(reachFor(true)) === 9 && inReach(eye[0], eye[1], eye[2], far[0], far[1], far[2], Effects.reach(reachFor(true))) === true, 'long reach breaks a block 8 away')

for (const id of ['speed', 'jump', 'fly', 'nightVision', 'slowFall', 'longReach']) {
  Effects.load({})
  Effects.give(id, { level: 2, ms: 5000 })
  eq(Effects.has(id), id + ' starts')
  Effects.tick(4999)
  eq(Effects.has(id), id + ' still on at 4999')
  Effects.tick(2)
  eq(!Effects.has(id), id + ' ends on time')
}

Effects.load({ speed: { level: 2 }, nope: { level: 1 } })
eq(Effects.has('speed') && Effects.level('speed') === 2 && !Effects.has('nope'), 'world load keeps known ids')
eq(Effects.dump().speed && Effects.dump().speed.level === 2 && !Effects.dump().nope, 'world give is saved')
Effects.give('jump', { level: 1, ms: 60000 })
eq(Effects.dump().jump == null && Effects.dump().speed, 'session give stays out of dump')

Rules.load({})
Effects.load({})
Effects.give('jump', { level: 2, world: true })
eq(showRulesCard({ lang: 'en', world: 'fx-town' }) === true, 'empty rules plus a permanent effect still shows the card')
eq(tilesOf().some((n) => n.dataset && n.dataset.id === 'fx.jump') && textOf(tilesOf().find((n) => n.dataset && n.dataset.id === 'fx.jump')).includes('Jump II'), 'card shows the permanent jump tile')
eq(showRulesCard({ lang: 'en', world: 'fx-town', teacher: true }) === false, 'teacher still skips the join card')
Effects.give('speed', { level: 1, ms: 60000 })
const fxTiles = tilesOf()
eq(!fxTiles.some((n) => n.dataset && n.dataset.id === 'fx.speed'), 'session effects are not card tiles')
Effects.load({})
Rules.load({})

const toasts = []
const bar = node('div')
bar.id = 'energy-bar'
document.body.append(bar)
Effects.mount(bar, { toast: (m) => toasts.push(m), lang: () => 'en' })
Effects.load({})
for (const id of ['speed', 'jump', 'fly', 'nightVision', 'slowFall', 'longReach']) Effects.give(id, { level: 2, ms: 300000 })
const strip = document.getElementById('fx-strip')
eq(!!strip && strip.parent === bar.parent, 'strip is a sibling under the energy bar')
const chips = strip.querySelectorAll('.fx-chip')
const more = strip.querySelector('.fx-more')
eq(chips.length === 4 && more && more.textContent === '+2', 'six effects show 4 chips plus +N ' + chips.length + ' ' + (more && more.textContent))
eq(strip.hidden === false, 'strip shows while effects are on')
Effects.load({})
Effects.tick(0)
eq(document.getElementById('fx-strip').hidden === true, 'strip hides when empty')
Effects.useLang('ar')
Effects.give('jump', { level: 2, ms: 5 * 60000 })
eq(document.getElementById('fx-strip').getAttribute('dir') === 'rtl', 'arabic strip rtl')
Effects.useLang('fa-AF')
Effects.tick(0)
eq(document.getElementById('fx-strip').getAttribute('dir') === 'rtl', 'dari strip rtl')
Effects.useLang('en')
Effects.tick(0)
eq(document.getElementById('fx-strip').getAttribute('dir') === 'ltr', 'english strip ltr')
eq(toasts.some((m) => m.indexOf('Jump II') !== -1 && m.indexOf('5') !== -1), 'toast says Jump II and the minutes ' + toasts.join('|'))
const times = document.getElementById('fx-strip').querySelectorAll('.fx-time')
eq(times.length === 1 && /^\d+:\d\d$/.test(times[0].textContent), 'chip shows mm:ss ' + (times[0] && times[0].textContent))
Effects.give('fly', { world: true })
const inf = [...document.getElementById('fx-strip').querySelectorAll('.fx-time')].map((n) => n.textContent)
eq(inf.indexOf('\u221e') !== -1, 'unlimited shows infinity ' + inf.join(','))
Effects.load({})

let saved = 0
const fxRoot = node('div')
paintRules(fxRoot, { lang: 'en', save: () => { saved += 1 } })
allNodes(fxRoot).find((n) => n.dataset && n.dataset.group === 'effects').click()
const speedII = allNodes(fxRoot).find((n) => n.dataset && n.dataset.fx === 'speed' && n.dataset.level === '2')
eq(!!speedII, 'effects group has a level II picker')
speedII.click()
const five = allNodes(fxRoot).find((n) => n.dataset && n.dataset.fx === 'speed' && n.dataset.min === '5')
eq(!!five, 'effects group has a 5 min give')
const savedBefore = saved
five.click()
eq(Effects.has('speed') && Effects.level('speed') === 2 && Object.keys(Effects.dump()).length === 0, 'editor 5 min speed II is session only')
eq(saved === savedBefore, 'session give does not save')

const offSpeed = allNodes(fxRoot).find((n) => n.dataset && n.dataset.fx === 'speed' && n.dataset.act === 'remove')
eq(!!offSpeed, 'given effect has a remove button')
offSpeed.click()
eq(!Effects.has('speed') && saved === savedBefore, 'remove ends the effect and does not save')

function hopPeak() {
  let y = 0
  let v = JUMP_V
  const dt = 1 / 120
  let peak = 0
  for (let i = 0; i < 2000; i++) {
    const g = Effects.grav(32, v)
    v -= g * dt
    y += v * dt
    if (y > peak) peak = y
    if (i > 5 && y <= 0) break
  }
  return peak
}
Effects.load({})
const plainHop = hopPeak()
const slowMin = allNodes(fxRoot).find((n) => n.dataset && n.dataset.fx === 'slowFall' && n.dataset.min === '1')
eq(!!slowMin, 'slow fall has a 1 min give')
const savedSlow = saved
slowMin.click()
const slowHop = hopPeak()
eq(Effects.has('slowFall') && saved === savedSlow, 'ui gives slow fall without saving')
eq(Effects.grav(32, 1) === 32 && Effects.grav(32, -1) === 12.8, 'slow fall gravity only while falling')
eq(plainHop > 1 && plainHop < 1.4 && Math.abs(slowHop - plainHop) < 0.05, 'slow fall jump stays about 1.1 ' + plainHop.toFixed(2) + ' -> ' + slowHop.toFixed(2))
const offSlow = allNodes(fxRoot).find((n) => n.dataset && n.dataset.fx === 'slowFall' && n.dataset.act === 'remove')
eq(!!offSlow, 'slow fall remove is on the row')
offSlow.click()
eq(!Effects.has('slowFall'), 'ui remove ends slow fall at once')

Effects.give('fly', { ms: 60000 })
Effects.give('jump', { level: 1, ms: 60000 })
allNodes(fxRoot).find((n) => n.dataset && n.dataset.group === 'effects').click()
const clearAll = allNodes(fxRoot).find((n) => n.dataset && n.dataset.act === 'clear-all')
eq(!!clearAll && clearAll.textContent === 'Clear all effects', 'clear all effects is in the give group')
const savedClear = saved
clearAll.click()
eq(Effects.list().length === 0 && saved === savedClear, 'clear all ends every effect and does not save')

Effects.load({})
Effects.useLang('en')
Effects.give('speed', { level: 1, ms: 60000 })
let minuteChip = document.getElementById('fx-strip').querySelector('.fx-chip')
eq(Effects.has('speed') && minuteChip && minuteChip.dataset.id === 'speed' && minuteChip.className.indexOf('fx-bye') < 0, 'one minute chip is up')
Effects.tick(59999)
eq(Effects.has('speed'), 'one minute still on just before the timer')
Effects.tick(1)
eq(!Effects.has('speed'), 'one minute effect expires on its timer')
Effects.tick(400)
minuteChip = document.getElementById('fx-strip').querySelector('.fx-chip')
eq(!minuteChip && document.getElementById('fx-strip').hidden === true, 'expired chip goes away')
Effects.load({})

for (const lang of langs) {
  Effects.useLang(lang)
  const rows = Effects.catalog()
  eq(rows.length === 6, 'catalog ' + lang)
  for (const row of rows) {
    const label = row.label[lang] || ''
    const desc = row.desc[lang] || ''
    eq(scripts[lang].test(label) && scripts[lang].test(desc), 'effect words ' + lang + ' ' + row.id + ' ' + label + ' / ' + desc)
  }
}
Effects.load({})
Effects.useLang('en')

if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('rules-check ok')
process.exit(0)
