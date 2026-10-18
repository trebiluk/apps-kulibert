// Bertopia wiring for the shared slot contract. The arrays stay the ones the save already uses.
export function bindBertopiaSlots(api) {
  const KS = typeof window !== 'undefined' ? window.KulibertSlots : null
  if (!KS) return null
  KS.config({
    icon: (item) => api.icon(item),
    name: (item) => api.name(item),
    t: (k) => api.t(k),
    cap: (item) => api.cap(item),
    reducedMotion: () => {
      try {
        if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches
      } catch (e) { return false }
    },
    onChange: () => { if (api.onChange) api.onChange() },
    toast: (msg) => { if (api.toast) api.toast(msg) },
  })
  return KS
}

// Quick-move, stack split, and item names. Class names on the digital panels stay as they are.
let live = null
let booted = false
let held = null
let swallowUntil = 0
let press = null
let tipTimer = 0
let tipUntil = 0
let lastOrient = 0

export function mountSlotQol(api) {
  live = api
  if (booted || typeof document === 'undefined') return
  booted = true
  ensureUi()
  document.addEventListener('pointerdown', onDown, true)
  document.addEventListener('pointermove', onMove, true)
  document.addEventListener('pointerup', onUp, true)
  document.addEventListener('pointercancel', onUp, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('contextmenu', onMenu, true)
  document.addEventListener('pointerover', onOver, true)
  document.addEventListener('pointerout', onOut, true)
  window.addEventListener('resize', onRotate)
  window.addEventListener('orientationchange', onRotate)
  window.__qolReturn = (opt) => returnHeld(opt || { silent: true })
  window.__qolState = () => ({
    held: held ? { item: held.item, n: held.n } : null,
    bag: snap(api.bag && api.bag()),
  })
}

function api() { return live || {} }
function bagSlots() {
  const bag = api().bag && api().bag()
  return bag && bag.slots ? bag.slots : null
}
function capOf(item) {
  const n = api().cap ? api().cap(item) : 64
  return n > 0 ? n : 64
}
function labelOf(item) {
  const name = api().name ? api().name(item) : ''
  if (!name || name === item) return (api().t && api().t('qolItem')) || 'Item'
  return name
}
function lessMotion() {
  try {
    if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch (e) { return false }
}
function survival() {
  return !api().survival || api().survival()
}
function panel() { return (api().panel && api().panel()) || '' }
function changed() {
  if (api().paintHotbar) api().paintHotbar()
  if (api().repaint) api().repaint()
  if (api().save) api().save()
  paintGhost()
}
function snap(bag) {
  if (!bag || !bag.slots) return []
  return bag.slots.map((s) => (s && s.n > 0 ? { item: s.item, n: s.n } : null))
}

function locate(node) {
  if (!node || !node.closest) return null
  const brief = node.closest('.brief-tile')
  if (brief && brief.dataset.brief && !brief.closest('.ks-slot, .well[data-slot], #hotbar .slot')) {
    return {
      kind: 'shop',
      item: brief.dataset.brief,
      stock: brief.dataset.stock,
      price: brief.dataset.price,
      priceKind: brief.dataset.priceKind || '',
      el: brief,
    }
  }
  const slot = node.closest('.ks-slot, .well[data-slot], #hotbar .slot[data-slot], .well.result, #qol-bar button')
  if (!slot || slot.closest('#qol-bar')) return null
  if (slot.classList.contains('result')) return { kind: 'craft-out', el: slot }
  const role = slot.dataset.ksRole || slot.dataset.role || ''
  if (role === 'output') return { kind: 'oven-out', el: slot }
  if (role === 'fuel' || role === 'input' || role === 'ing') return { kind: 'role', role: role, el: slot }
  if (slot.dataset.ksBag != null) {
    let i = slot.dataset.i != null && slot.dataset.i !== '' ? +slot.dataset.i : +slot.dataset.slot
    if (!Number.isInteger(i) && slot.parentElement) i = Array.prototype.indexOf.call(slot.parentElement.children, slot)
    return { kind: 'bag', index: i, el: slot }
  }
  if (slot.dataset.ksInv) {
    const id = slot.dataset.ksInv
    const i = +slot.dataset.i
    if (id === 'bag') return { kind: 'bag', index: i, el: slot }
    if (id.indexOf('box:') === 0) return { kind: 'box', key: id.slice(4), index: i, el: slot }
  }
  if (slot.dataset.slot != null && slot.dataset.slot !== '') {
    const host = slot.closest('#hotbar') ? 'hotbar' : 'bag'
    return { kind: 'bag', index: +slot.dataset.slot, el: slot, host: host }
  }
  return null
}
function atPoint(x, y) {
  const under = document.elementFromPoint(x, y)
  return locate(under)
}
function boxSlots(key) {
  const list = api().boxSlots && key ? api().boxSlots(key) : null
  return Array.isArray(list) ? list : null
}
function stackOf(loc) {
  if (!loc) return null
  if (loc.kind === 'bag') {
    const slots = bagSlots()
    const s = slots && slots[loc.index]
    return s && s.n > 0 ? s : null
  }
  if (loc.kind === 'box') {
    const slots = boxSlots(loc.key)
    const s = slots && slots[loc.index]
    return s && s.n > 0 ? s : null
  }
  if (loc.kind === 'oven-out' || loc.kind === 'role') {
    const rec = api().machine && api().machine(stationKey())
    if (!rec) return null
    if (loc.kind === 'oven-out' || loc.role === 'output') {
      const item = rec.output && rec.output[0]
      return item ? { item: item, n: rec.output.length } : null
    }
    if (loc.role === 'fuel' && rec.fuelItem && rec.fuelN > 0) return { item: rec.fuelItem, n: rec.fuelN }
    if (loc.role === 'input' && rec.input && rec.input[0]) return { item: rec.input[0], n: rec.inputN || 1 }
  }
  if (loc.kind === 'craft-out') {
    const needs = recipeNeeds()
    const recipe = findRecipe(needs)
    if (!recipe) return null
    return { item: recipe.out[0], n: recipe.out[1] || 1 }
  }
  return null
}
function stationKey() {
  const sheet = document.getElementById('sheet')
  return (sheet && sheet.dataset.pkey) || ''
}
function recipeNeeds() {
  return Array.from(document.querySelectorAll('#sheet .ks-slot.ing')).map((el) => el.dataset.need || '')
}
function findRecipe(needs) {
  const list = api().recipes ? api().recipes() : []
  return list.find((r) => r.in && r.in.length === needs.length && r.in.every((pair, i) => pair[0] === needs[i])) || null
}

function ownShift(loc) {
  const id = panel()
  if (!loc) return false
  if (id === 'inventory' && loc.kind === 'bag') return true
  if (id === 'box' && (loc.kind === 'bag' || loc.kind === 'box')) return true
  if (id === 'station' && (loc.kind === 'bag' || loc.kind === 'oven-out')) return true
  if (id === 'crafting' && loc.kind === 'craft-out') return true
  return false
}

function onDown(e) {
  const openTip = document.getElementById('qol-tip')
  if (openTip && !openTip.hidden && !(e.target && openTip.contains(e.target))) hideTip()
  if (swallowUntil && performance.now() > swallowUntil) swallowUntil = 0
  const barHit = e.target && e.target.closest && e.target.closest('#qol-bar')
  if (barHit) {
    e.stopPropagation()
    return
  }
  if (!survival()) return
  const loc = locate(e.target)
  if (!loc) {
    if (press && press.timer) clearTimeout(press.timer)
    return
  }
  if (e.button === 2) {
    e.preventDefault()
    e.stopImmediatePropagation()
    hideBar()
    doRight(loc)
    swallowUntil = performance.now() + 500
    return
  }
  if (e.button != null && e.button !== 0) return
  if (e.shiftKey && ownShift(loc)) {
    e.preventDefault()
    e.stopImmediatePropagation()
    hideBar()
    press = { pid: e.pointerId, shift: true, loc: copyLoc(loc), x: e.clientX, y: e.clientY }
    return
  }
  if (held) {
    e.preventDefault()
    e.stopImmediatePropagation()
    hideBar()
    press = { pid: e.pointerId, drop: true, loc: copyLoc(loc), x: e.clientX, y: e.clientY }
    return
  }
  if (e.pointerType === 'touch' || e.pointerType === 'pen') {
    const snapLoc = copyLoc(loc)
    const timer = setTimeout(() => {
      if (!press || press.pid !== e.pointerId || press.moved) return
      press.long = true
      try {
        window.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }))
      } catch (err) {}
      if (snapLoc.kind === 'shop') showTip(snapLoc, 0, true)
      else {
        showBar(snapLoc)
        showTip(snapLoc, 0, true)
      }
      swallowUntil = performance.now() + 800
    }, 400)
    press = { pid: e.pointerId, timer: timer, loc: snapLoc, x: e.clientX, y: e.clientY, type: e.pointerType }
  }
}
function onMove(e) {
  if (held) paintGhost(e.clientX, e.clientY)
  if (!press || e.pointerId !== press.pid) return
  const dx = e.clientX - press.x
  const dy = e.clientY - press.y
  if (dx * dx + dy * dy > 64) {
    press.moved = true
    if (press.timer) { clearTimeout(press.timer); press.timer = 0 }
    if (!press.long) hideBar()
  }
}
function onUp(e) {
  if (!press || e.pointerId !== press.pid) {
    if (e.pointerType === 'touch' && !held) {
      const loc = locate(e.target)
      if (loc && loc.host === 'hotbar') showTip(loc, 1500, true)
    }
    return
  }
  const job = press
  press = null
  if (job.timer) clearTimeout(job.timer)
  if (job.type === 'touch' && job.loc && job.loc.host === 'hotbar' && !job.long && !job.moved) showTip(job.loc, 1500, true)
  if (job.long) {
    swallowUntil = performance.now() + 500
    return
  }
  if (job.shift) {
    doShift(job.loc)
    swallowUntil = performance.now() + 500
    return
  }
  if (job.drop) {
    const dest = atPoint(e.clientX, e.clientY) || job.loc
    dropHeld(dest, true)
    swallowUntil = performance.now() + 500
  }
}
function onClick(e) {
  const btn = e.target && e.target.closest && e.target.closest('#qol-bar button')
  if (btn) {
    e.preventDefault()
    e.stopImmediatePropagation()
    const act = btn.dataset.qol
    const loc = barLoc()
    hideBar()
    if (act === 'half') doRight(loc)
    else if (act === 'one') doOne(loc)
    else if (act === 'move') doShift(loc)
    return
  }
  if (performance.now() < swallowUntil) {
    swallowUntil = 0
    e.preventDefault()
    e.stopImmediatePropagation()
  }
}
function onMenu(e) {
  if (locate(e.target)) { e.preventDefault(); e.stopPropagation() }
}
function onOver(e) {
  if (e.pointerType && e.pointerType !== 'mouse') return
  const loc = locate(e.target)
  clearTimeout(tipTimer)
  if (!loc || (loc.kind !== 'shop' && !stackOf(loc))) return
  const snapLoc = copyLoc(loc)
  tipTimer = setTimeout(() => showTip(snapLoc, 0, false), 300)
}
function onOut(e) {
  const loc = locate(e.target)
  if (!loc) return
  clearTimeout(tipTimer)
  if (performance.now() >= tipUntil) hideTip()
}
function onRotate() {
  const w = window.innerWidth
  const h = window.innerHeight
  const sign = w >= h ? 1 : -1
  const phone = w < 980 || h < 980
  if (lastOrient && sign !== lastOrient && phone && (held || press)) {
    if (press && press.timer) clearTimeout(press.timer)
    press = null
    returnHeld({ silent: false })
  }
  lastOrient = sign
}

function copyLoc(loc) {
  if (!loc) return null
  return {
    kind: loc.kind, index: loc.index, key: loc.key, role: loc.role, host: loc.host, el: loc.el,
    item: loc.item, stock: loc.stock, price: loc.price, priceKind: loc.priceKind,
  }
}
function indices(slots, pred) {
  const out = []
  for (let i = 0; i < slots.length; i++) if (!pred || pred(i)) out.push(i)
  return out
}
function shiftTo(fromSlots, fromIndex, toSlots, toIndexList) {
  const src = fromSlots && fromSlots[fromIndex]
  if (!src || !(src.n > 0) || !toSlots) return 0
  const cap = capOf(src.item)
  let moved = 0
  for (let n = 0; n < toIndexList.length; n++) {
    const j = toIndexList[n]
    if (fromSlots === toSlots && j === fromIndex) continue
    const dest = toSlots[j]
    if (!dest || dest.item !== src.item || dest.n >= cap) continue
    const take = Math.min(cap - dest.n, src.n)
    dest.n += take
    src.n -= take
    moved += take
    if (src.n <= 0) {
      fromSlots[fromIndex] = null
      return moved
    }
  }
  for (let n = 0; n < toIndexList.length; n++) {
    const j = toIndexList[n]
    if (fromSlots === toSlots && j === fromIndex) continue
    if (toSlots[j]) continue
    const row = { item: src.item, n: src.n }
    if (src.uses != null) row.uses = src.uses
    toSlots[j] = row
    moved += src.n
    fromSlots[fromIndex] = null
    return moved
  }
  return moved
}
function roomFor(slots, item) {
  const cap = capOf(item)
  let space = 0
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (!s) space += cap
    else if (s.item === item && s.n < cap) space += cap - s.n
  }
  return space
}

function doShift(loc) {
  if (!loc || !survival()) return
  hideTip()
  const id = panel()
  const slots = bagSlots()
  if (!slots) return
  let moved = 0
  if (id === 'inventory' && loc.kind === 'bag') {
    const targets = loc.index < 9 ? indices(slots, (i) => i >= 9) : indices(slots, (i) => i < 9)
    moved = shiftTo(slots, loc.index, slots, targets)
  } else if (id === 'box' && loc.kind === 'bag') {
    const box = boxSlots(loc.key || stationKey())
    if (box) moved = shiftTo(slots, loc.index, box, indices(box))
  } else if (id === 'box' && loc.kind === 'box') {
    const box = boxSlots(loc.key)
    if (box) moved = shiftTo(box, loc.index, slots, indices(slots))
  } else if (id === 'station' && loc.kind === 'bag') {
    moved = shiftIntoMachine(loc)
  } else if (id === 'station' && loc.kind === 'oven-out') {
    moved = takeOutputs()
  } else if (id === 'crafting' && loc.kind === 'craft-out') {
    moved = craftOut()
  } else if (loc.kind === 'bag' && (id === 'inventory' || loc.host === 'hotbar') && id === 'inventory') {
    moved = 0
  }
  if (!moved) shake(loc)
  else changed()
}
function shiftIntoMachine(loc) {
  const slots = bagSlots()
  const src = slots && slots[loc.index]
  if (!src) return 0
  const key = stationKey()
  const rec = (api().machine && api().machine(key)) || {}
  const parked = []
  for (let i = 0; i < slots.length; i++) {
    if (i === loc.index) continue
    if (slots[i] && slots[i].item === src.item) {
      parked.push([i, slots[i]])
      slots[i] = null
    }
  }
  let moved = 0
  if (api().isFuel && api().isFuel(src.item)) {
    if (!(rec.fuelItem && rec.fuelItem !== src.item)) {
      const have = src.n
      for (let i = 0; i < have; i++) {
        if (!api().loadFuel || !api().loadFuel(key, src.item)) break
        moved++
      }
    }
  } else if (api().isSmelt && api().isSmelt(src.item)) {
    if (!(rec.until || (rec.input && rec.input.length))) {
      const before = countItem(src.item)
      const ok = api().loadInput && api().loadInput(key, src.item)
      const after = countItem(src.item)
      if (ok && after < before) moved = before - after
    }
  }
  for (let p = 0; p < parked.length; p++) {
    const i = parked[p][0]
    const row = parked[p][1]
    if (!slots[i]) slots[i] = row
    else {
      const left = row.n
      const cap = capOf(row.item)
      let rest = left
      for (let s = 0; s < slots.length && rest; s++) {
        if (slots[s] && slots[s].item === row.item && slots[s].n < cap) {
          const d = Math.min(cap - slots[s].n, rest)
          slots[s].n += d
          rest -= d
        }
      }
      for (let s = 0; s < slots.length && rest; s++) {
        if (slots[s]) continue
        slots[s] = { item: row.item, n: Math.min(cap, rest) }
        rest -= slots[s].n
      }
    }
  }
  return moved
}
function countItem(item) {
  const slots = bagSlots() || []
  let n = 0
  for (let i = 0; i < slots.length; i++) if (slots[i] && slots[i].item === item) n += slots[i].n
  return n
}
function takeOutputs() {
  const slots = bagSlots()
  const key = stationKey()
  const rec = (api().machine && api().machine(key)) || {}
  const item = rec.output && rec.output[0]
  const have = rec.output ? rec.output.length : 0
  if (!item || !have || !slots) return 0
  const space = roomFor(slots, item)
  if (!space) return 0
  const times = Math.min(have, space, 64)
  let n = 0
  for (let i = 0; i < times; i++) {
    const got = api().takeOutput && api().takeOutput(key)
    if (!got) break
    n++
  }
  return n
}
function craftOut() {
  const recipe = findRecipe(recipeNeeds())
  if (!recipe || !api().craftMany) return 0
  const slots = bagSlots()
  const item = recipe.out[0]
  if (slots && roomFor(slots, item) <= 0) return 0
  const ok = api().craftMany(recipe)
  return ok ? 1 : 0
}

function doRight(loc) {
  if (!loc) return
  hideTip()
  if (!held) {
    pickHalf(loc)
    return
  }
  dropHeld(loc, false)
}
function doOne(loc) {
  if (!loc) return
  if (!held) {
    pickCount(loc, 1)
    return
  }
  dropHeld(loc, false)
}
function pickHalf(loc) {
  const s = stackOf(loc)
  if (!s || loc.kind === 'oven-out' || loc.kind === 'craft-out' || loc.kind === 'role') {
    if (s) shake(loc)
    return
  }
  pickCount(loc, Math.ceil(s.n / 2))
}
function pickCount(loc, n) {
  const slots = loc.kind === 'box' ? boxSlots(loc.key) : bagSlots()
  if (!slots) return
  const s = slots[loc.index]
  if (!s || !(s.n > 0) || n <= 0) { shake(loc); return }
  const take = Math.min(s.n, n)
  held = { item: s.item, n: take }
  if (s.uses != null) held.uses = s.uses
  s.n -= take
  if (s.n <= 0) slots[loc.index] = null
  changed()
}
function dropHeld(loc, all) {
  if (!held || !loc) return
  const n = all ? held.n : 1
  if (loc.kind !== 'bag' && loc.kind !== 'box') { shake(loc); return }
  const slots = loc.kind === 'box' ? boxSlots(loc.key) : bagSlots()
  if (!slots || loc.index < 0 || loc.index >= slots.length) { shake(loc); return }
  const dest = slots[loc.index]
  const cap = capOf(held.item)
  if (!dest) {
    const put = Math.min(n, held.n, cap)
    const row = { item: held.item, n: put }
    if (held.uses != null) row.uses = held.uses
    slots[loc.index] = row
    held.n -= put
  } else if (dest.item === held.item) {
    const room = cap - dest.n
    const put = Math.min(room, n, held.n)
    if (put <= 0) { shake(loc); return }
    dest.n += put
    held.n -= put
  } else if (all && held.n <= cap) {
    const back = { item: dest.item, n: dest.n }
    if (dest.uses != null) back.uses = dest.uses
    dest.item = held.item
    dest.n = held.n
    dest.uses = held.uses
    held = back
  } else {
    shake(loc)
    return
  }
  if (held && held.n <= 0) held = null
  changed()
}

function returnHeld(opt) {
  hideBar()
  hideTip()
  if (!held) { paintGhost(); return }
  const stack = held
  held = null
  putBack(stack)
  paintGhost()
  if (api().paintHotbar) api().paintHotbar()
  if (!opt || !opt.silent) { if (api().repaint) api().repaint() }
  if (api().save) api().save()
}
function putBack(stack) {
  const slots = bagSlots()
  if (!slots || !stack || !(stack.n > 0)) return
  const cap = capOf(stack.item)
  let left = stack.n
  for (let i = 0; i < slots.length && left; i++) {
    const s = slots[i]
    if (!s || s.item !== stack.item || s.n >= cap) continue
    const d = Math.min(cap - s.n, left)
    s.n += d
    left -= d
  }
  for (let i = 0; i < slots.length && left; i++) {
    if (slots[i]) continue
    const d = Math.min(cap, left)
    const row = { item: stack.item, n: d }
    if (stack.uses != null) row.uses = stack.uses
    slots[i] = row
    left -= d
  }
  if (left && api().spill) api().spill(stack.item, left)
}

function shake(loc) {
  const el = loc && loc.el
  const node = el && el.isConnected ? el : document.querySelector('#sheet .well[data-slot="' + (loc && loc.index) + '"], #sheet .ks-slot')
  if (!node) return
  node.classList.remove('qol-shake')
  void node.offsetWidth
  node.classList.add('qol-shake')
  const stamp = (node._qolShake = (node._qolShake || 0) + 1)
  setTimeout(() => { if (node._qolShake === stamp) node.classList.remove('qol-shake') }, 200)
}

function ensureUi() {
  if (document.getElementById('qol-tip')) return
  const tip = document.createElement('div')
  tip.id = 'qol-tip'
  tip.className = 'kd-tip'
  tip.hidden = true
  tip.setAttribute('role', 'tooltip')
  tip.addEventListener('pointerdown', () => { tip.hidden = true })
  const bar = document.createElement('div')
  bar.id = 'qol-bar'
  bar.className = 'kd-card'
  bar.hidden = true
  bar.setAttribute('role', 'menu')
  for (const pair of [['half', 'qolHalf', 'Half'], ['one', 'qolOne', 'One'], ['move', 'qolMove', 'Move']]) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'kd-key' + (pair[0] === 'move' ? ' kd-go' : '')
    b.dataset.qol = pair[0]
    b.textContent = (api().t && api().t(pair[1])) || pair[2]
    bar.append(b)
  }
  const ghost = document.createElement('div')
  ghost.id = 'qol-held'
  ghost.hidden = true
  document.body.append(tip, bar, ghost)
}
function showBar(loc) {
  ensureUi()
  const bar = document.getElementById('qol-bar')
  if (!bar || !loc || !stackOf(loc)) return
  bar.dataset.kind = loc.kind || ''
  bar.dataset.index = loc.index != null ? String(loc.index) : ''
  bar.dataset.key = loc.key || ''
  bar.dataset.role = loc.role || ''
  bar.hidden = false
  const el = loc.el && loc.el.isConnected ? loc.el : null
  const rect = el ? el.getBoundingClientRect() : { left: 16, top: 80, width: 48, bottom: 120 }
  const width = bar.offsetWidth || 180
  let left = rect.left
  let top = rect.top - (bar.offsetHeight || 56) - 8
  if (top < 8) top = rect.bottom + 8
  if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8
  bar.style.left = Math.max(8, left) + 'px'
  bar.style.top = Math.max(8, top) + 'px'
}
function barLoc() {
  const bar = document.getElementById('qol-bar')
  if (!bar) return null
  return { kind: bar.dataset.kind, index: bar.dataset.index === '' ? -1 : +bar.dataset.index, key: bar.dataset.key, role: bar.dataset.role }
}
function hideBar() {
  const bar = document.getElementById('qol-bar')
  if (bar) bar.hidden = true
}
function tipHitsHud(tip) {
  const a = tip.getBoundingClientRect()
  const sels = ['.jumpcol', '#stick-pad']
  for (let i = 0; i < sels.length; i++) {
    const el = document.querySelector(sels[i])
    if (!el) continue
    const b = el.getBoundingClientRect()
    if (b.width < 2 || b.height < 2) continue
    if (a.left < b.right - 0.5 && a.right > b.left + 0.5 && a.top < b.bottom - 0.5 && a.bottom > b.top + 0.5) return true
  }
  return false
}
function showTip(loc, ms, sticky) {
  const shop = loc && loc.kind === 'shop'
  const s = stackOf(loc)
  if (!s && !shop) return
  ensureUi()
  const tip = document.getElementById('qol-tip')
  if (!tip) return
  clearTimeout(showTip.hide)
  const item = s ? s.item : loc.item
  const spec = {
    item: item,
    n: s ? s.n : (shop && loc.stock != null && loc.stock !== '' ? loc.stock : null),
    uses: s ? s.uses : null,
    stock: shop && loc.stock != null && loc.stock !== '' ? loc.stock : null,
    price: shop && loc.price != null && loc.price !== '' ? loc.price : null,
    priceKind: shop ? (loc.priceKind || '') : '',
  }
  tip.replaceChildren()
  if (api().fillFacts && spec.item) api().fillFacts(tip, spec)
  else {
    const name = document.createElement('span')
    name.className = 'qol-name'
    name.textContent = labelOf(item)
    const count = document.createElement('span')
    count.textContent = ' × ' + (s ? s.n : '')
    tip.append(name, count)
    const tool = api().toolOf && api().toolOf(item)
    const life = tool && api().toolLife && api().toolLife(tool)
    if (tool && life) {
      const bar = document.createElement('span')
      bar.className = 'qol-wear'
      const fill = document.createElement('span')
      const left = s && s.uses == null ? life : Math.max(0, Math.min(life, s ? s.uses : life))
      fill.style.width = Math.round((left / life) * 100) + '%'
      bar.append(fill)
      tip.append(bar)
    }
  }
  const el = loc.el && loc.el.isConnected ? loc.el : null
  const rect = el ? el.getBoundingClientRect() : { left: 16, top: 64, width: 48 }
  tip.hidden = false
  const narrow = document.body.classList.contains('touch') && window.innerWidth <= 480 && window.innerHeight > window.innerWidth
  let width = Math.min(420, window.innerWidth - 16)
  let left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))
  let top = Math.max(8, rect.top - 8)
  const jump = document.querySelector('.jumpcol')
  const jumpRect = jump ? jump.getBoundingClientRect() : null
  const jumpOn = !!(jumpRect && jumpRect.width > 2 && jumpRect.height > 2)
  if (narrow && jumpOn) {
    const room = window.innerWidth - jumpRect.right - 16
    if (room >= 160) {
      left = jumpRect.right + 8
      width = room
    } else top = Math.max(8, jumpRect.top - 8)
  }
  tip.style.maxWidth = width + 'px'
  tip.style.left = left + 'px'
  tip.style.top = top + 'px'
  tip.style.transform = 'translateY(-100%)'
  if (narrow && jumpOn && tipHitsHud(tip)) tip.style.top = Math.max(8, jumpRect.top - 8) + 'px'
  placeReadTip(tip)
  tipUntil = Infinity
  clearTimeout(showTip.hide)
}
function placeReadTip(tip) {
  const w = window.innerWidth
  const h = window.innerHeight
  const hot = document.getElementById('hotbar')
  const hb = hot && !hot.hidden ? hot.getBoundingClientRect() : null
  const lift = hb && hb.height > 8 ? Math.max(16, h - hb.top) + 12 : 108
  if (w <= 480) {
    tip.style.left = '8px'
    tip.style.right = '8px'
    tip.style.width = 'auto'
    tip.style.maxWidth = (w - 16) + 'px'
    tip.style.top = 'auto'
    tip.style.bottom = lift + 'px'
    tip.style.transform = 'none'
    return
  }
  const r = tip.getBoundingClientRect()
  const center = r.left < w * 0.7 && r.right > w * 0.3 && r.top < h * 0.62 && r.bottom > h * 0.38
  const onHot = hb && r.left < hb.right && r.right > hb.left && r.bottom > hb.top - 4 && r.top < hb.bottom
  if (!center && !onHot) return
  tip.style.left = '16px'
  tip.style.top = 'auto'
  tip.style.bottom = lift + 'px'
  tip.style.transform = 'none'
}
function hideTip() {
  clearTimeout(tipTimer)
  const tip = document.getElementById('qol-tip')
  if (tip && performance.now() >= tipUntil) tip.hidden = true
}
function paintGhost(x, y) {
  const ghost = document.getElementById('qol-held')
  if (!ghost) return
  if (!held) { ghost.hidden = true; return }
  ghost.hidden = false
  ghost.textContent = labelOf(held.item) + ' × ' + held.n
  if (x == null) return
  ghost.style.left = (x + 12) + 'px'
  ghost.style.top = (y + 12) + 'px'
}
