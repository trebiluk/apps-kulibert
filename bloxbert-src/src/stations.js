// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES } from './data/recipes.js'
import { ITEMS } from './data/items.js'
import { slotArt } from './icons.js'
import { fx } from './fx.js'
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BAKES = { planks: 1, log: 4, coal: 8 }
const FLAME = '<svg class="flame" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2c2 8 8 10 8 18a8 8 0 1 1-16 0c0-5 3-8 4-12 1 3 2 4 4 6z"/><path class="core" d="M16 18c1 4 4 5 4 9a4 4 0 1 1-8 0c0-3 2-4 4-9z"/></svg>'
const GHOST = '<svg class="ghost-ico" viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><rect x="6" y="6" width="20" height="20" rx="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
let slotsOf = () => []
let pickItem = ''
let pickSlot = -1
let gestureAt = 0
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
function machineDrag(el, e, opts) {
  if (!e || (e.button != null && e.button !== 0)) return
  gestureAt = 0
  const pid = e.pointerId
  const start = e.pointerType === 'touch' ? 10 : 8
  const sx = e.clientX
  const sy = e.clientY
  let dragged = false
  let ghost = null
  let done = false
  const clearMarks = () => document.querySelectorAll('.drop-ok,.drop-bad').forEach((n) => n.classList.remove('drop-ok', 'drop-bad'))
  const targetAt = (x, y) => {
    const under = document.elementFromPoint(x, y)
    return under && under.closest ? under.closest(opts.targets) : null
  }
  const mark = (x, y) => {
    clearMarks()
    const t = targetAt(x, y)
    if (t) t.classList.add(opts.canDrop(t) ? 'drop-ok' : 'drop-bad')
  }
  const finish = (ev, cancel) => {
    if (done || (ev && ev.pointerId !== pid)) return
    done = true
    window.removeEventListener('pointermove', move, true)
    window.removeEventListener('pointerup', up, true)
    window.removeEventListener('pointercancel', up, true)
    window.removeEventListener('resize', onResize)
    try { el.releasePointerCapture(pid) } catch (err) {}
    clearMarks()
    if (ghost) ghost.remove()
    if (dragged) gestureAt = performance.now()
    if (!dragged || cancel) return
    const t = ev ? targetAt(ev.clientX, ev.clientY) : null
    if (t && opts.canDrop(t)) opts.onDrop(t)
    else if (t && opts.onReject) opts.onReject(t)
  }
  const move = (ev) => {
    if (ev.pointerId !== pid) return
    const dx = ev.clientX - sx
    const dy = ev.clientY - sy
    if (!dragged && dx * dx + dy * dy >= start * start) {
      dragged = true
      ghost = document.createElement('div')
      ghost.className = 'tray-ghost'
      if (opts.icon) ghost.append(opts.icon())
      document.body.append(ghost)
    }
    if (!ghost) return
    ghost.style.left = ev.clientX + 'px'
    ghost.style.top = ev.clientY + 'px'
    mark(ev.clientX, ev.clientY)
  }
  const up = (ev) => finish(ev, ev.type === 'pointercancel')
  const onResize = () => finish(null, true)
  try { el.setPointerCapture(pid) } catch (err) {}
  window.addEventListener('pointermove', move, true)
  window.addEventListener('pointerup', up, true)
  window.addEventListener('pointercancel', up, true)
  window.addEventListener('resize', onResize)
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
    const kind = BAKES[item] ? item : fuelKind(api)
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
    const r = get(k, kind || 'oven')
    finish(r)
    if (r.flashUntil && Date.now() >= r.flashUntil) { r.flash = ''; r.flashUntil = 0 }
    const flash = (text) => {
      r.flash = text
      r.flashUntil = Date.now() + 1500
      clearTimeout(flash.hide)
      flash.hide = setTimeout(() => { if (g.isConnected) paint(g, key, kind) }, 1500)
    }
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
    crate.className = 'station-crate machine'
    if (isBench) {
      head(crate, 'workbench', api.t('workbench'), api.t('crafting'))
      g.append(crate)
      return
    }
    const secs = r.secs || 5
    const timeLeft = r.until ? Math.max(0, (r.until - Date.now()) / 1000) : 0
    const pct = r.until ? Math.max(0, Math.min(1, (secs - timeLeft) / secs)) : 0
    const pending = r.pending
    const outItem = r.output && r.output[0]
    const fuelItem = r.fuelItem || ''
    const fuelCount = fuelItem ? (r.fuelN || 0) : 0
    const inItem = (r.input && r.input[0]) || ''
    const inCount = inItem ? (r.inputN || 1) : 0
    if (r.ask === 'fuel' && fuelItem) r.ask = ''
    if (r.ask === 'input' && (inItem || r.until)) r.ask = ''
    let status = api.t('needsFuel')
    if (outItem && !r.until) status = api.t('takeYour').replace('{item}', api.name ? api.name(outItem) : outItem)
    else if (r.until) status = api.t('bakingNow')
    else if (r.ask === 'fuel') status = api.t('pickFuel')
    else if (r.ask === 'input' || r.picking) status = api.t('pickBake')
    else if (inItem && !(r.left > 0)) status = api.t('ovenAddFuel')
    else if (r.left > 0 && !inItem) status = api.t('addToBake')
    else if (!(r.left > 0)) status = api.t('needsFuel')
    else status = api.t('input')
    head(crate, 'oven', api.t('oven'), status)
    const row = document.createElement('div')
    row.className = 'machine-row'
    function well(role, word, item, count, ghost) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well gtile slot-' + role + (ghost ? ' ghost' : '')
      b.dataset.role = role
      const pic = document.createElement('span')
      pic.className = 'gic art'
      if (item) pic.append(face(item))
      else pic.innerHTML = GHOST
      b.append(pic)
      const lab = document.createElement('span')
      if ((role === 'fuel' || role === 'in') && count > 0) {
        lab.className = 'badge'
        lab.textContent = String(count)
      } else {
        lab.className = 'glbl wlab'
        lab.textContent = word
      }
      b.append(lab)
      if (ghost) pic.classList.add('ghost')
      const named = item && api.name ? api.name(item) : ''
      b.setAttribute('aria-label', named ? word + ' ' + named + (count > 0 ? ' ' + count : '') : word)
      b.title = named || word
      return b
    }
    const fuelEl = well('fuel', api.t('fuel'), fuelItem, fuelCount, !fuelItem)
    const inEl = well('in', api.t('input'), inItem, inCount, !inItem)
    const arrow = document.createElement('div')
    arrow.className = 'arrow-bar'
    arrow.setAttribute('aria-hidden', 'true')
    const fill = document.createElement('div')
    fill.className = 'arrow-fill'
    fill.style.width = Math.round(pct * 100) + '%'
    arrow.append(fill)
    const outEl = well('out', api.t('output'), outItem || '', outItem ? 1 : 0, !outItem)
    if (done && outItem) {
      const badge = document.createElement('span')
      badge.className = 'check'
      badge.textContent = '✓'
      outEl.append(badge)
      fx(outEl, 'bump')
    }
    const fueled = () => (get(k, 'oven').left || 0) > 0
    const recipeYouCan = (item) => {
      if (!item) return null
      const creative = api.creative && api.creative()
      const ready = OVEN.filter((recipe) => recipe.in.some(([it]) => it === item) && (creative || recipe.in.every(([it, n]) => api.have && api.have(it) >= n)))
      if (!ready.length) return null
      return ready.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || ready.find((recipe) => recipe.in[0][0] === item) || ready[0]
    }
    const useFuel = (item) => {
      if (item && !BAKES[item]) {
        flash(api.t('ovenNoBurn').replace('{item}', itemName(item)))
        pickItem = ''
        pickSlot = -1
        paint(g, key, kind)
        return false
      }
      if (!addFuel(k, item)) r.fuelNote = api.t('addFuelWood')
      else { r.fuelNote = ''; r.flash = '' }
      pickItem = ''
      pickSlot = -1
      paint(g, key, kind)
      return true
    }
    const useInput = (item) => {
      if (item && !bakesItem(item)) {
        flash(api.t('ovenNoBake').replace('{item}', itemName(item)))
        pickItem = ''
        pickSlot = -1
        paint(g, key, kind)
        return false
      }
      const recipe = recipeFor(api, item, fueled())
      if (!recipe || !addInput(k, recipe.id)) return false
      r.flash = ''
      pickItem = ''
      pickSlot = -1
      paint(g, key, kind)
      return true
    }
    const askSlot = (role) => {
      if (role === 'fuel' && fuelItem) return
      if (role === 'input' && (inItem || r.until)) return
      r.ask = r.ask === role ? '' : role
      r.picking = false
      r.flash = ''
      r.fuelNote = ''
      pickItem = ''
      pickSlot = -1
      paint(g, key, kind)
    }
    const rejectPick = (role, item) => {
      flash((role === 'fuel' ? api.t('ovenNoBurn') : api.t('ovenNoBake')).replace('{item}', itemName(item)))
      paint(g, key, kind)
      const well = g.querySelector(role === 'fuel' ? '.slot-fuel' : '.slot-in')
      if (well) fx(well, 'bump')
    }
    const commitSlot = (role) => {
      if (role === 'fuel' && fuelItem) return
      if (role === 'input' && (inItem || r.until)) return
      const item = pickItem
      if (!item) { askSlot(role); return }
      if (role === 'fuel') {
        if (!BAKES[item]) { rejectPick('fuel', item); return }
        useFuel(item)
        return
      }
      const recipe = recipeYouCan(item)
      if (!recipe) { rejectPick('input', item); return }
      r.ask = ''
      const ok = fueled() ? addInput(k, recipe.id) : arm(k, recipe.id)
      if (!ok) { rejectPick('input', item); return }
      r.flash = ''
      r.fuelNote = ''
      pickItem = ''
      pickSlot = -1
      paint(g, key, kind)
    }
    fuelEl.addEventListener('click', () => commitSlot('fuel'))
    inEl.addEventListener('click', () => commitSlot('input'))
    outEl.addEventListener('click', () => { take(k); paint(g, key, kind) })
    const fuelHold = document.createElement('div')
    fuelHold.className = 'fuel-slot'
    fuelHold.append(fuelEl)
    const burning = !!(r.until && timeLeft > 0 && fuelNow > 0)
    let burnPct = 0
    if (burning && secs > 0) burnPct = Math.round((timeLeft / secs) * 100)
    else if (fuelNow > 0) burnPct = Math.round(Math.min(1, fuelNow / 8) * 100)
    const side = document.createElement('span')
    side.className = 'flame-side' + (fuelNow > 0 ? ' lit' : ' out') + (burning ? ' burn' : '')
    side.style.setProperty('--burn', String(burnPct / 100))
    side.innerHTML = FLAME + '<i class="burn-bar" style="width:' + burnPct + '%"></i>'
    const flame = side.querySelector('.flame')
    if (grew && flame && fuelNow > 0) fx(flame, 'flame')
    fuelHold.append(side)
    let preview = null
    if (pending) {
      preview = document.createElement('div')
      preview.className = 'will-make'
      const pic = document.createElement('span')
      pic.className = 'gic'
      pic.append(face(pending))
      const lab = document.createElement('span')
      lab.className = 'glbl'
      const made = api.name ? api.name(pending) : pending
      lab.textContent = api.t('willMake').replace('{item}', made)
      preview.append(pic, lab)
      preview.title = lab.textContent
    }
    row.append(fuelHold, inEl, arrow)
    if (preview) row.append(preview)
    row.append(outEl)
    const clickHint = document.createElement('p')
    clickHint.className = 'gnote oven-click'
    clickHint.textContent = api.t('ovenClick')
    const hint = document.createElement('p')
    hint.className = 'gnote oven-bakes'
    hint.textContent = bakeHint()
    crate.append(row, clickHint, hint)
    const strip = document.createElement('div')
    strip.className = 'bag-strip'
    const slots = slotsOf() || []
    slots.forEach((s, si) => {
      if (!s) return
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well bag-bit' + (pickSlot === si ? ' pick' : '')
      b.dataset.item = s.item
      b.dataset.slot = String(si)
      const label = (api.name ? api.name(s.item) : s.item) + ' ' + s.n
      b.setAttribute('aria-label', label)
      b.title = api.name ? api.name(s.item) : s.item
      const pic = document.createElement('span')
      pic.className = 'art'
      if (api.icon) pic.append(face(s.item))
      b.append(pic)
      const badge = document.createElement('span')
      badge.className = 'badge'
      badge.textContent = String(s.n)
      b.append(badge)
      const item = s.item
      b.addEventListener('pointerdown', (e) => {
        machineDrag(b, e, {
          targets: '#sheet .slot-fuel, #sheet .slot-in',
          icon: () => face(item),
          canDrop: (well) => well.dataset.role === 'fuel' ? !!BAKES[item] : !!recipeFor(api, item, fueled()),
          onDrop: (well) => { if (well.dataset.role === 'fuel') useFuel(item); else useInput(item) },
          onReject: (well) => {
            if (well.dataset.role === 'fuel') {
              if (!BAKES[item]) flash(api.t('ovenNoBurn').replace('{item}', itemName(item)))
            } else if (!bakesItem(item)) flash(api.t('ovenNoBake').replace('{item}', itemName(item)))
            paint(g, key, kind)
          },
        })
      })
      b.addEventListener('click', () => {
        if (gestureAt > 0 && performance.now() - gestureAt < 450) return
        if (pickSlot === si) { pickItem = ''; pickSlot = -1 } else { pickItem = item; pickSlot = si }
        paint(g, key, kind)
      })
      strip.append(b)
    })
    crate.append(strip)
    if (r.ask === 'fuel' || r.ask === 'input') {
      const picks = document.createElement('div')
      picks.className = 'oven-picks oven-ask'
      picks.dataset.ask = r.ask
      const fit = new Map()
      for (const s of slots) {
        if (!s || !(s.n > 0)) continue
        const ok = r.ask === 'fuel' ? !!BAKES[s.item] : bakesItem(s.item)
        if (!ok) continue
        fit.set(s.item, (fit.get(s.item) || 0) + s.n)
      }
      if (!fit.size) {
        const p = document.createElement('p')
        p.className = 'gnote'
        p.textContent = r.ask === 'fuel' ? api.t('addFuelWood') : api.t('nothingBake')
        picks.append(p)
      }
      for (const [item, n] of fit) {
        const b2 = document.createElement('button')
        b2.type = 'button'
        b2.className = 'gtile oven-choice'
        b2.dataset.item = item
        b2.dataset.fit = r.ask
        const pic = document.createElement('span')
        pic.className = 'gic'
        pic.append(face(item))
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        const named = api.name ? api.name(item) : item
        lbl.textContent = named + ' ×' + n
        b2.append(pic, lbl)
        b2.setAttribute('aria-label', named)
        b2.addEventListener('click', () => {
          if (r.ask === 'fuel') {
            r.ask = ''
            useFuel(item)
            return
          }
          const recipe = recipeYouCan(item)
          r.ask = ''
          r.flash = ''
          if (!recipe) {
            r.fuelNote = api.t('nothingBake')
            paint(g, key, kind)
            return
          }
          const ok = fueled() ? addInput(k, recipe.id) : arm(k, recipe.id)
          if (!ok) r.fuelNote = api.t('nothingBake')
          else { r.fuelNote = ''; r.flash = '' }
          pickItem = ''
          pickSlot = -1
          paint(g, key, kind)
        })
        picks.append(b2)
      }
      crate.append(picks)
    } else if (r.picking) {
      const picks = document.createElement('div')
      picks.className = 'oven-picks'
      const creative = api.creative && api.creative()
      const ready = OVEN.filter((recipe) => creative || recipe.in.every(([item, n]) => api.have && api.have(item) >= n))
      if (!ready.length) {
        const p = document.createElement('p')
        p.className = 'gnote'
        p.textContent = api.t('nothingBake')
        picks.append(p)
      }
      for (const recipe of ready) {
        const b2 = document.createElement('button')
        b2.type = 'button'
        b2.className = 'gtile' + (r.pick === recipe.id ? ' on' : '')
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        lbl.textContent = recipe.in.map(([item, n]) => (api.name ? api.name(item) : item) + ' ×' + n).join(' + ')
        b2.append(lbl)
        b2.addEventListener('click', () => { addInput(k, recipe.id); paint(g, key, kind) })
        picks.append(b2)
      }
      crate.append(picks)
    }
    const note = r.flashUntil > Date.now() && r.flash ? r.flash : (r.fuelNote || '')
    if (note) {
      const chip = document.createElement('p')
      chip.className = 'fuel-chip'
      chip.setAttribute('role', 'status')
      chip.textContent = note
      crate.append(chip)
    }
    g.append(crate)
    clearTimeout(paint.timer)
    paint.timer = setTimeout(() => { if (g.isConnected) paint(g, key, kind) }, 1000)
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
