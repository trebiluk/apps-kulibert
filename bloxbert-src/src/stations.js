// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES } from './data/recipes.js'
import { fx } from './fx.js'
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BAKES = { planks: 1, log: 4, coal: 8 }
const FLAME = '<svg class="flame" viewBox="0 0 32 40" width="28" height="34" aria-hidden="true"><path d="M16 2c2 8 8 10 8 18a8 8 0 1 1-16 0c0-5 3-8 4-12 1 3 2 4 4 6z"/><path class="core" d="M16 18c1 4 4 5 4 9a4 4 0 1 1-8 0c0-3 2-4 4-9z"/></svg>'
const GHOST = '<svg class="ghost-ico" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect x="6" y="6" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
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
export function createStations(api) {
  const map = new Map()
  const seen = new Map()
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
  }
  function tick() {
    for (const rec of map.values()) finish(rec)
  }
  function addFuel(key, item) {
    const kind = BAKES[item] ? item : fuelKind(api)
    if (!kind) return false
    if (api.spend && !api.spend(kind, 1)) return false
    const r = get(key, 'oven')
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
  function paint(g, key, kind) {
    const k = key || '0,5,0'
    const isBench = kind === 'bench'
    const r = get(k, kind || 'oven')
    finish(r)
    const id = k + ':' + (kind || 'oven')
    const prev = seen.get(id)
    const fuelNow = r.left || 0
    const outNow = (r.output && r.output.length) || 0
    const grew = !!(prev && fuelNow > prev.fuel)
    const done = !!(prev && outNow > prev.out)
    seen.set(id, { fuel: fuelNow, out: outNow })
    g.innerHTML = ''
    g.classList.add('crate')
    const crate = document.createElement('div')
    crate.className = 'station-crate'
    const secs = r.secs || 5
    const timeLeft = r.until ? Math.max(0, (r.until - Date.now()) / 1000) : 0
    const pct = r.until ? Math.max(0, Math.min(1, (secs - timeLeft) / secs)) : 0
    const fuelWord = fuelNow > 0 ? String(fuelNow) : api.t('fuel')
    const pending = r.pending
    const outItem = r.output && r.output[0]
    const inShow = pending || (!pending && r.pick) || ''
    const inWord = inShow ? (api.name ? api.name(inShow) : inShow) : api.t('input')
    const outWord = outItem ? (api.name ? api.name(outItem) : outItem) : api.t('output')
    function well(role, word, item, ghost) {
      const b = document.createElement(isBench ? 'div' : 'button')
      if (!isBench) b.type = 'button'
      b.className = 'gtile slot-' + role + (ghost ? ' ghost' : '')
      const pic = document.createElement('span')
      pic.className = 'gic'
      if (role === 'fuel') pic.innerHTML = FLAME
      else if (item && api.icon) pic.append(api.icon(item))
      else pic.innerHTML = GHOST
      b.append(pic)
      const lab = document.createElement('span')
      lab.className = 'glbl'
      lab.textContent = word
      b.append(lab)
      if (role === 'fuel' && !isBench) {
        const flame = pic.querySelector('.flame')
        if (grew && flame) fx(flame, 'flame')
        if (!fuelNow && flame) flame.classList.add('ghost')
      }
      if (ghost) pic.classList.add('ghost')
      return b
    }
    const fuelEl = well('fuel', fuelWord, '', !fuelNow)
    fuelEl.setAttribute('aria-label', fuelWord)
    const inEl = well('in', inWord, inShow, !pending && !r.staged)
    const arrow = document.createElement('div')
    arrow.className = 'arrow-bar'
    arrow.setAttribute('aria-hidden', 'true')
    const fill = document.createElement('div')
    fill.className = 'arrow-fill'
    fill.style.width = Math.round(pct * 100) + '%'
    arrow.append(fill)
    const outEl = well('out', outWord, outItem || '', !outItem)
    if (done && outItem) {
      const badge = document.createElement('span')
      badge.className = 'check'
      badge.textContent = '✓'
      outEl.append(badge)
      fx(outEl, 'bump')
      fx(outEl.querySelector('.gic'), 'in')
    }
    if (!isBench) {
      fuelEl.addEventListener('click', () => {
        if (!addFuel(k)) r.fuelNote = api.t('addFuelWood')
        paint(g, key, kind)
      })
      inEl.addEventListener('click', () => { r.picking = true; paint(g, key, kind) })
      outEl.addEventListener('click', () => { take(k); paint(g, key, kind) })
    }
    crate.append(fuelEl, inEl, arrow, outEl)
    if (!isBench && r.picking) {
      const strip = document.createElement('div')
      strip.className = 'oven-picks'
      const creative = api.creative && api.creative()
      const ready = OVEN.filter((recipe) => creative || recipe.in.every(([item, n]) => api.have && api.have(item) >= n))
      if (!ready.length) {
        const p = document.createElement('p')
        p.className = 'gnote'
        p.textContent = api.t('nothingBake')
        strip.append(p)
      }
      for (const recipe of ready) {
        const b2 = document.createElement('button')
        b2.type = 'button'
        b2.className = 'gtile' + (r.pick === recipe.id ? ' on' : '')
        const pic = document.createElement('span')
        pic.className = 'gic'
        if (api.icon) pic.append(api.icon(recipe.in[0][0]))
        b2.append(pic)
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        lbl.textContent = recipe.in.map(([item, n]) => (api.name ? api.name(item) : item) + ' ×' + n).join(' + ') + ' → ' + (api.name ? api.name(recipe.out[0]) : recipe.out[0])
        b2.append(lbl)
        b2.addEventListener('click', () => { addInput(k, recipe.id); paint(g, key, kind) })
        strip.append(b2)
      }
      crate.append(strip)
    }
    if (!isBench && r.fuelNote) {
      const chip = document.createElement('p')
      chip.className = 'fuel-chip'
      chip.setAttribute('role', 'status')
      chip.textContent = r.fuelNote
      crate.append(chip)
    }
    g.append(crate)
    clearTimeout(paint.timer)
    if (!isBench) paint.timer = setTimeout(() => { if (g.isConnected) paint(g, key, kind) }, 1000)
  }
  return { tick, paint, view, addFuel, addInput, arm, take, dump: () => Object.fromEntries(map), load: (obj) => { map.clear(); for (const [k, v] of Object.entries(obj || {})) map.set(k, v) } }
}
