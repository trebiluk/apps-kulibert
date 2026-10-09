// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES } from './data/recipes.js'
import { ITEMS } from './data/items.js'
import { slotArt } from './icons.js'
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BAKES = { planks: 1, log: 4, coal: 8 }
let slotsOf = () => []
export function bindStationBag(fn) { if (typeof fn === 'function') slotsOf = fn }
function fuelKind(api) {
  const held = api.held ? api.held() : ''
  if (BAKES[held] && api.have && api.have(held) > 0) return held
  for (const k of ['planks', 'log', 'coal']) if (api.have && api.have(k) > 0) return k
  return ''
}
function beginBake(r, recipe) {
  if (!recipe || r.until || !(r.left > 0)) return
  r.pending = recipe.out[0]
  r.secs = recipe.secs || 5
  r.until = Date.now() + r.secs * 1000
  r.staged = null
  r.picking = false
}
function recipeFor(api, item, fueled) {
  if (!item || !fueled) return null
  const creative = api.creative && api.creative()
  const ready = OVEN.filter((recipe) => recipe.in.some(([it]) => it === item) && (creative || recipe.in.every(([it, n]) => api.have && api.have(it) >= n)))
  if (!ready.length) return null
  return ready.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || ready.find((recipe) => recipe.in[0][0] === item) || ready[0]
}
export function createStations(api) {
  const map = new Map()
  function get(key, kind) {
    if (!map.has(key)) map.set(key, { kind, fuel: 0, input: [], output: [], until: 0, left: 0 })
    return map.get(key)
  }
  function finish(rec) {
    if (!rec || rec.kind !== 'oven' || !rec.until) return
    if (Date.now() < rec.until) return
    rec.output.push(rec.pending || 'glass')
    rec.pending = null
    rec.until = 0
    rec.left = Math.max(0, rec.left - 1)
    rec.fuel = rec.left
    rec.input = []
    rec.inputN = 0
    const burn = BAKES[rec.fuelItem] || 1
    rec.fuelSpent = (rec.fuelSpent || 0) + 1
    if (rec.fuelSpent >= burn) {
      rec.fuelSpent -= burn
      rec.fuelN = Math.max(0, (rec.fuelN || 1) - 1)
    }
    if (!(rec.left > 0) || !(rec.fuelN > 0)) { rec.fuelItem = ''; rec.fuelN = 0; rec.fuelSpent = 0 }
  }
  function tick() {
    for (const rec of map.values()) finish(rec)
  }
  function addFuel(key, item) {
    const kind = item ? (BAKES[item] ? item : '') : fuelKind(api)
    if (!kind) return false
    if (api.spend && !api.spend(kind, 1)) return false
    const r = get(key, 'oven')
    if (r.fuelItem && r.fuelItem !== kind) r.fuelN = 0
    r.fuelItem = kind
    r.fuelN = (r.fuelN || 0) + 1
    r.left = (r.left || 0) + BAKES[kind]
    r.fuel = r.left
    r.fuelNote = ''
    beginBake(r, OVEN.find((x) => x.id === r.staged))
    return true
  }
  function arm(key, recipeId) {
    const recipe = OVEN.find((x) => x.id === recipeId)
    if (!recipe) return false
    const r = get(key, 'oven')
    r.pick = recipe.id
    if (r.until) { r.picking = false; return true }
    const ready = recipe.in.every(([item, n]) => api.have && api.have(item) >= n)
    if (ready && r.staged !== recipe.id) {
      for (const [item, n] of recipe.in) if (api.spend) api.spend(item, n)
      r.staged = recipe.id
      r.input = recipe.in.map(([item]) => item)
      r.inputN = recipe.in[0][1]
    }
    r.picking = !r.staged
    beginBake(r, r.staged ? recipe : null)
    return true
  }
  function addInput(key, recipeId) {
    const recipe = OVEN.find((x) => x.id === recipeId)
    const r = get(key, 'oven')
    if (!recipe || !(r.left > 0)) return false
    for (const [item, n] of recipe.in) if (api.have && api.have(item) < n) return false
    for (const [item, n] of recipe.in) if (api.spend) api.spend(item, n)
    r.picking = false
    r.pick = recipe.id
    r.input = recipe.in.map(([item]) => item)
    r.inputN = recipe.in[0][1]
    r.pending = recipe.out[0]
    r.secs = recipe.secs || 5
    r.until = Date.now() + r.secs * 1000
    r.staged = null
    return true
  }
  function take(key) {
    const r = get(key, 'oven')
    const item = r.output.shift()
    if (item && api.give) api.give(item, 1)
    return item
  }
  function view(key) {
    const r = map.get(key)
    if (!r) return { kind: 'oven', fuel: 0, input: [], output: [], ring: 0 }
    const secs = r.secs || 5
    const left = r.until ? Math.max(0, Math.ceil((r.until - Date.now()) / 1000)) : 0
    const ring = r.until ? (secs - left) / secs : 0
    return { kind: r.kind, fuel: r.fuel, input: r.input.slice(), output: r.output.slice(), ring, left: r.left }
  }
  function itemName(item) { return api.name ? api.name(item) : item }
  function bakesItem(item) { return OVEN.some((recipe) => recipe.in.some(([it]) => it === item)) }
  function bakeHint() {
    const bits = []
    let food = false
    for (const recipe of OVEN) {
      if (recipe.label === 'food') { food = true; continue }
      bits.push(recipe.in.map(([it]) => itemName(it)).join(' + ') + ' → ' + itemName(recipe.out[0]))
    }
    if (food) bits.push(api.t('rawFood') + ' → ' + api.t('bakedFood'))
    return api.t('bakesHint').replace('{list}', bits.join(', '))
  }
  function face(item) {
    const def = item && ITEMS[item]
    if (def && def.svg) return slotArt(item, null)
    if (api.icon && ((def && def.block) || !def)) {
      const node = api.icon(item)
      if (node && node.dataset && node.dataset.block) return node
    }
    return slotArt(item, null)
  }
  function head(crate, iconKey, name, status) {
    const row = document.createElement('div')
    row.className = 'machine-head'
    const ic = document.createElement('span')
    ic.className = 'gic'
    if (api.icon) ic.append(face(iconKey))
    const words = document.createElement('div')
    const title = document.createElement('span')
    title.className = 'machine-name'
    title.textContent = name
    const line = document.createElement('p')
    line.className = 'machine-status'
    line.setAttribute('role', 'status')
    line.textContent = status
    words.append(title, line)
    row.append(ic, words)
    crate.append(row)
  }
  function paint(g, key, kind) {
    const k = key || '0,5,0'
    const isBench = kind === 'bench'
    if (g._ksDestroy) { g._ksDestroy(); g._ksDestroy = null }
    g.innerHTML = ''
    g.classList.add('crate')
    if (isBench) {
      const crate = document.createElement('div')
      crate.className = 'station-crate machine'
      head(crate, 'workbench', api.t('workbench'), api.t('crafting'))
      g.append(crate)
      return
    }
    const KS = window.KulibertSlots
    if (!KS || !KS.ui || !KS.ui.machinePanel) return
    const read = () => {
      const r = get(k, 'oven')
      finish(r)
      const secs = r.secs || 5
      const timeLeft = r.until ? Math.max(0, (r.until - Date.now()) / 1000) : 0
      const pct = r.until ? Math.max(0, Math.min(1, (secs - timeLeft) / secs)) : 0
      const fuelItem = r.fuelItem || ''
      const fuelCount = fuelItem ? (r.fuelN || 0) : 0
      const inItem = (r.input && r.input[0]) || ''
      const inCount = inItem ? (r.inputN || 1) : 0
      const outItem = r.output && r.output[0]
      return { r, secs, timeLeft, pct, fuelItem, fuelCount, inItem, inCount, outItem }
    }
    const fueled = () => (get(k, 'oven').left || 0) > 0
    const recipeYouCan = (item) => {
      if (!item) return null
      const creative = api.creative && api.creative()
      const ready = OVEN.filter((recipe) => recipe.in.some(([it]) => it === item) && (creative || recipe.in.every(([it, n]) => api.have && api.have(it) >= n)))
      if (!ready.length) return null
      return ready.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || ready.find((recipe) => recipe.in[0][0] === item) || ready[0]
    }
    const refuse = (role, item) => {
      const named = itemName(item)
      if (role === 'fuel') return api.t('fuelBounce').replace('{item}', named)
      if (role === 'input' && !bakesItem(item)) return api.t('ovenNoBake').replace('{item}', named)
      return ''
    }
    const onLoad = (role, item) => {
      if (role === 'fuel') {
        if (!item || !BAKES[item]) return { ok: false, message: refuse('fuel', item) }
        if (!addFuel(k, item)) return { ok: false, message: api.t('addFuelWood') }
        return { ok: true }
      }
      if (role === 'input') {
        if (!item || !bakesItem(item)) return { ok: false, message: refuse('input', item) }
        const cur = get(k, 'oven')
        if (cur.until || (cur.input && cur.input.length)) return { ok: false }
        const recipe = recipeYouCan(item)
        if (!recipe) return { ok: false, message: api.t('ovenNoBake').replace('{item}', itemName(item)) }
        const ok = fueled() ? addInput(k, recipe.id) : arm(k, recipe.id)
        if (!ok) return { ok: false, message: api.t('nothingBake') }
        return { ok: true }
      }
      return { ok: false }
    }
    const panel = KS.ui.machinePanel(g, {
      title: api.t('oven'),
      headerIcon: () => face('oven'),
      icon: (item) => face(item),
      status: () => {
        const s = read()
        if (s.outItem && !s.r.until) return api.t('takeYour').replace('{item}', itemName(s.outItem))
        if (s.r.until) return api.t('bakingNow')
        if (s.inItem && !(s.r.left > 0)) return api.t('ovenAddFuel')
        if (s.r.left > 0 && !s.inItem) return api.t('addToBake')
        return api.t('needsFuel')
      },
      slots: () => {
        const s = read()
        return [
          { role: 'fuel', label: api.t('fuel'), item: s.fuelItem, n: s.fuelCount, filter: (item) => !!BAKES[item], takeOnly: false },
          { role: 'input', label: api.t('input'), item: s.inItem, n: s.inCount, filter: (item) => bakesItem(item), takeOnly: false },
          { role: 'output', label: api.t('output'), item: s.outItem || '', n: s.outItem ? 1 : 0, filter: () => false, takeOnly: true },
        ]
      },
      process: () => {
        const s = read()
        const fuelNow = s.r.left || 0
        const burning = !!(s.r.until && s.timeLeft > 0 && fuelNow > 0)
        let burn = 0
        if (burning && s.secs > 0) burn = s.timeLeft / s.secs
        else if (fuelNow > 0) burn = Math.min(1, fuelNow / 8)
        const pending = s.r.pending
        return {
          pct: s.pct,
          burning,
          lit: fuelNow > 0,
          burn,
          label: s.timeLeft > 0 ? Math.ceil(s.timeLeft) + 's' : '',
          previewItem: pending || '',
          previewText: pending ? api.t('willMake').replace('{item}', itemName(pending)) : '',
        }
      },
      bag: () => slotsOf() || [],
      onLoad,
      onTake: () => { take(k) },
      refuse,
      notes: () => [api.t('ovenClick'), bakeHint()],
      name: (item) => itemName(item),
      t: (key) => api.t(key),
    })
    g._ksDestroy = panel.destroy
  }
  function baking() {
    const out = []
    for (const [key, rec] of map) {
      if (rec && rec.until && Date.now() < rec.until) out.push(key)
    }
    return out
  }
  return { tick, paint, view, addFuel, addInput, arm, take, baking, dump: () => Object.fromEntries(map), load: (obj) => { map.clear(); for (const [k, v] of Object.entries(obj || {})) map.set(k, v) } }
}
