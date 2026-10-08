// Survival session: bag, Cogs, shop, counters, bunk. Creative never touches this bag.
import { ITEMS, dropOf, saplingRoll } from './data/items.js'
import { RECIPES } from './data/recipes.js'
import { ECON } from './data/econ.js'
import { pays, sells } from './data/econ.js'
import { createBag } from './items.js'
import { canMake, craftStatus, maxTimes, make } from './craft.js'
import { createWallet } from './econ/wallet.js'
import { quoteSell, quoteBuy, canSellToday } from './econ/store.js'
import { visit } from './econ/vend.js'
import { blockIcon, itemSvg } from './icons.js'
import { mergeOrAdd, stepMagnet, canPick, nearPlayer, pullLoose, noteId, lostLabelKey } from './drops.js'
import { emptyBox } from './box.js'
import { TOOL_LIFE, setDigSlow, getDigSlow } from './feel.js'
import { fx } from './fx.js'
import { bindStationBag } from './stations.js'
import { berryTuft } from './worldgen.js'

export function createSession(api) {
  const bags = { survival: createBag(), creative: createBag() }
  let bag = bags.survival
  bindStationBag(() => bag.slots)
  const wallet = createWallet(ECON)
  const meta = new Map()
  let mode = 'survival'
  let home = null
  const hotSlot = { survival: 0, creative: 0 }
  let hot = 0
  let bagSel = -1
  let boxPick = -1
  let bagSkip = 0
  let day = localDay()
  function localDay() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  let paused = false
  const BOLT_MS = 4 * 60 * 1000
  const FEED = { berry: 1, bread: 4, cupcake: 3 }
  let energy = { bolts: 10, acc: 0, toasted: false }
  let lowN = 0
  let energyOn = true
  try { if (localStorage.getItem('bloxbert-energy') === '0') energyOn = false } catch (e) {}
  let visitN = 1
  const bagHist = []
  const redoBag = []
  const placedLeaves = new Set()
  const ground = []
  const lost = []
  wallet.state.day = day
  wallet.post({ kind: 'start', cogs: 0, by: 'you' })

  function t(k) { return api.t(k) }
  function itemName(k) { return t(k) }
  function today() {
    if (wallet.state.day !== day) { wallet.state.day = day; wallet.state.soldToday = {}; wallet.state.spentToday = 0 }
    return day
  }
  function markFound(item) {
    if (!item || !ITEMS[item]) return
    if (!wallet.state.found) wallet.state.found = []
    if (!wallet.state.found.includes(item)) wallet.state.found.push(item)
  }
  function spawnDrop(item, n, x, y, z, why) {
    const where = mergeOrAdd(ground, lost, { item, n, x, y, z, at: Date.now() })
    if (where === 'lost') api.toast(t('lostFound'))
    else if (why === 'q') api.toast(t('dropped'))
    else if (why === 'full') api.toast(t('bagFull'))
    if (api.markDirty) api.markDirty()
    return where
  }
  function motionLess() {
    if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
  }
  function slotSnap() {
    return bag.slots.map((s) => (s ? { item: s.item, n: s.n } : null))
  }
  function changedIndex(before) {
    for (let i = 0; i < bag.slots.length; i++) {
      const a = before[i]
      const b = bag.slots[i]
      if ((a && a.item) !== (b && b.item) || (a ? a.n : 0) !== (b ? b.n : 0)) return i
    }
    return -1
  }
  function rollCount(el, from, to) {
    const t0 = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - t0) / 220)
      el.textContent = String(Math.round(from + (to - from) * t))
      if (t < 1) requestAnimationFrame(step)
    }
    el.textContent = String(from)
    requestAnimationFrame(step)
  }
  function crateFx(node, from, to, kind, done) {
    const x0 = from[0], y0 = from[1], x1 = to[0], y1 = to[1]
    const less = motionLess()
    const place = (x, y, op) => {
      node.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)'
      node.style.opacity = String(op)
    }
    const finish = () => { if (node.parentNode) node.remove(); if (done) done() }
    if (less || kind === 'fade') {
      const t0 = performance.now()
      const step = (now) => {
        const t = Math.min(1, (now - t0) / 120)
        place(x1, y1, t)
        if (t < 1) requestAnimationFrame(step)
        else finish()
      }
      place(x1, y1, 0)
      requestAnimationFrame(step)
      return
    }
    const dur = 350
    const t0 = performance.now()
    const step = (now) => {
      const t = Math.min(1, (now - t0) / dur)
      let ax, ay, bx, by, u
      if (kind === 'back') {
        if (t < 0.42) {
          u = t / 0.42
          ax = x0; ay = y0
          bx = x0 + (x1 - x0) * 0.62
          by = y0 + (y1 - y0) * 0.62
        } else {
          u = (t - 0.42) / 0.58
          ax = x0 + (x1 - x0) * 0.62
          ay = y0 + (y1 - y0) * 0.62
          bx = x0; by = y0
        }
      } else {
        u = t
        ax = x0; ay = y0; bx = x1; by = y1
      }
      const mx = (ax + bx) / 2
      const my = Math.min(ay, by) - 64
      const x = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx
      const y = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by
      const op = kind === 'back' && t > 0.82 ? 1 - (t - 0.82) / 0.18 : 1
      place(x, y, op)
      if (t < 1) requestAnimationFrame(step)
      else finish()
    }
    place(x0, y0, 1)
    requestAnimationFrame(step)
  }
  function landItem(item, before, kind) {
    if (mode !== 'survival' || !ITEMS[item]) return
    const idx = changedIndex(before)
    const well = idx >= 0 && idx < 9
      ? document.querySelector('#hotbar [data-slot="' + idx + '"]')
      : document.querySelector('#hotbar [data-bag="1"]')
    if (!well) return
    const rect = well.getBoundingClientRect()
    const node = document.createElement('div')
    node.className = 'fly-icon'
    node.append(itemIcon(ITEMS[item]))
    document.body.append(node)
    const oldN = idx >= 0 && before[idx] && before[idx].item === item ? before[idx].n : 0
    const newN = idx >= 0 && bag.slots[idx] ? bag.slots[idx].n : oldN
    crateFx(node, [window.innerWidth / 2, window.innerHeight / 2], [rect.left + rect.width / 2, rect.top + rect.height / 2], kind, () => {
      if (kind !== 'fly' || motionLess()) return
      well.classList.remove('bump')
      void well.offsetWidth
      well.classList.add('bump')
      const badge = well.querySelector('.count')
      if (badge) rollCount(badge, oldN, newN)
    })
  }
  function giveItem(item, n = 1) {
    markFound(item)
    const before = slotSnap()
    const left = bag.add(item, n)
    const got = n - left
    if (got) paintHotbar()
    if (got) landItem(item, before, 'fly')
    if (left) {
      const p = api.pos()
      spawnDrop(item, left, p[0], p[1] + 0.3, p[2], 'full')
      landItem(item, before, 'back')
    }
    return left
  }
  function heading() { return api.heading ? api.heading() : 0 }
  function dropSpot() {
    const p = api.pos()
    const h = heading()
    let x = p[0] + Math.sin(h) * 0.9
    let z = p[2] + Math.cos(h) * 0.9
    const y = p[1] + 0.35
    if (api.getVoxel && api.getVoxel(Math.floor(x), Math.floor(y), Math.floor(z))) { x = p[0]; z = p[2] }
    return [x, y, z]
  }
  function dropHeld(all) {
    if (mode !== 'survival') return
    const s = bag.slots[hot]
    if (!s) return
    const n = all ? s.n : 1
    const item = s.item
    if (!bag.take(item, n)) return
    const p = dropSpot()
    spawnDrop(item, n, p[0], p[1], p[2], 'q')
    paintHotbar()
  }
  function dropItem(item, all) {
    if (mode !== 'survival' || !bag.count(item)) return
    const n = all ? bag.count(item) : 1
    if (!bag.take(item, n)) return
    const p = dropSpot()
    spawnDrop(item, n, p[0], p[1], p[2], 'q')
    paintHotbar()
  }
  function takeLost() {
    let got = 0
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (let i = 0; i < lost.length;) {
      const d = lost[i]
      const left = bag.add(d.item, d.n)
      const took = d.n - left
      got += took
      if (took && !first) first = d.item
      if (left) { d.n = left; break }
      lost.splice(i, 1)
    }
    takeHand(first, wasEmpty)
    if (got) { paintHotbar(); paintChip(); api.toast(t('pickedUp')); if (api.markDirty) api.markDirty() }
    else if (lost.length) api.toast(t('bagFull'))
    return got
  }
  const dropPlayer = { x: 0, y: 0, z: 0 }
  const dropFeet = { x: 0, y: 0, z: 0 }
  function tickDrops(dt) {
    if (mode !== 'survival' || !ground.length) return false
    const p = api.pos()
    dropPlayer.x = p[0]
    dropPlayer.y = p[1] + 0.9
    dropPlayer.z = p[2]
    dropFeet.x = p[0]
    dropFeet.y = p[1]
    dropFeet.z = p[2]
    const now = Date.now()
    const moved = stepMagnet(ground, dropPlayer, (dt || 16) / 1000, now)
    let got = 0
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (let i = ground.length - 1; i >= 0; i--) {
      const d = ground[i]
      if (!canPick(d, now) || !nearPlayer(d, dropFeet)) continue
      const left = bag.add(d.item, d.n)
      const took = d.n - left
      if (!took) continue
      got += took
      if (!first) first = d.item
      markFound(d.item)
      if (left) d.n = left
      else ground.splice(i, 1)
    }
    takeHand(first, wasEmpty)
    if (got) { paintHotbar(); paintChip(); api.toast(t('pickedUp')) }
    if (moved || got) { if (api.markDirty) api.markDirty(); return true }
    return false
  }
  function paintChip() {
    const el = document.getElementById('wallet-chip')
    if (!el) return
    el.hidden = mode !== 'survival'
    el.innerHTML = '<bdi>⚙ ' + wallet.state.cogs + '</bdi> <small>' + t('practice') + '</small>'
  }
  function paintHotbar() {
    const bar = document.getElementById('hotbar')
    if (!bar || mode !== 'survival') return
    bar.classList.add('bagbar')
    bar.classList.remove('palette')
    bar.innerHTML = ''
    const strip = document.createElement('div')
    strip.className = 'item-strip'
    for (let i = 0; i < 9; i++) {
      const s = bag.slots[i]
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'slot' + (s ? '' : ' empty')
      b.dataset.slot = String(i)
      const item = s && ITEMS[s.item]
      const digit = document.createElement('span')
      digit.className = 'digit'
      digit.textContent = String(i + 1)
      const sw = document.createElement('span')
      sw.className = 'sw'
      if (item && item.svg) sw.innerHTML = itemSvg(item.svg)
      else if (item && item.block && api.blockIcon) sw.append(api.blockIcon(item.block))
      else if (item) sw.innerHTML = itemSvg('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="#E6B15A"/></svg>')
      b.append(digit, sw)
      if (s) {
        const count = document.createElement('span')
        count.className = 'count'
        count.textContent = String(s.n)
        b.append(count)
      }
      const wear = s && wearBar(item, s.uses)
      if (wear) b.append(wear)
      b.setAttribute('aria-pressed', String(i === hot))
      b.setAttribute('aria-label', s ? itemName(s.item) : t('emptySlot'))
      if (s) b.title = itemName(s.item)
      b.addEventListener('click', () => {
        if (i === hot) useHeld()
        else { hot = i; paintHotbar(); if (s) api.flash && api.flash(itemName(s.item)) }
      })
      strip.append(b)
    }
    bar.append(strip)
    const bagBtn = document.createElement('button')
    bagBtn.type = 'button'
    bagBtn.className = 'slot bag-tile'
    bagBtn.dataset.bag = '1'
    bagBtn.innerHTML = '<span class="gic"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 9.2V8a4 4 0 0 1 8 0v1.2" fill="none" stroke="#E6EEF2" stroke-width="1.6" stroke-linecap="round"/><path d="M6.2 9.2h11.6l-1 11.2H7.2z" fill="#1F8A8A" stroke="#E6EEF2" stroke-width="1.4"/><path d="M9 13.2h6" stroke="#E6EEF2" stroke-width="1.3" stroke-linecap="round"/></svg></span><span class="lbl"></span>'
    bagBtn.querySelector('.lbl').textContent = t('bag')
    bagBtn.setAttribute('aria-label', t('bag'))
    bagBtn.addEventListener('click', () => { if (api.open) api.open('inventory') })
    bar.append(bagBtn)
    const held = bag.slots[hot]
    const label = document.getElementById('current')
    if (label) label.textContent = held ? itemName(held.item) : t('emptySlot')
    const nameKey = held ? held.item : ''
    if (nameKey !== paintHotbar.nameKey) {
      paintHotbar.nameKey = nameKey
      if (nameKey && api.flash) api.flash(itemName(nameKey))
      else {
        const chip = document.getElementById('held-chip')
        if (chip) chip.hidden = true
      }
    }
  }
  function selectedItem() {
    if (mode !== 'survival') return null
    return bag.slots[hot] && bag.slots[hot].item
  }
  const EDIBLE = ['berry', 'bread', 'cupcake']
  function useHeld() {
    const item = selectedItem()
    if (!item) return ''
    if (energyOn && mode === 'survival' && FEED[item]) {
      if (energy.bolts >= 10) {
        api.toast(t('energyFull'))
        return itemName(item)
      }
      if (!bag.take(item, 1)) return ''
      energy.bolts = Math.min(10, energy.bolts + FEED[item])
      if (energy.bolts > 0) energy.toasted = false
      paintHotbar()
      paintEnergy()
      syncDig()
      api.toast(t('ate').replace('{item}', itemName(item)))
      if (api.markDirty) api.markDirty()
      return itemName(item)
    }
    if (EDIBLE.includes(item) && bag.take(item, 1)) {
      paintHotbar()
      api.toast(t('ate').replace('{item}', itemName(item)))
      if (api.markDirty) api.markDirty()
      return itemName(item)
    }
    const name = itemName(item)
    if (api.flash) api.flash(name)
    return name
  }
  function selectOwned(blockId) {
    const key = Object.entries(ITEMS).find(([, v]) => v.block === blockId)
    if (!key || !bag.count(key[0])) return false
    const i = bag.slots.findIndex((s) => s && s.item === key[0])
    if (i < 0) return false
    if (i > 8) {
      const tmp = bag.slots[hot]
      bag.slots[hot] = bag.slots[i]
      bag.slots[i] = tmp
    } else hot = i
    paintHotbar()
    if (api.markDirty) api.markDirty()
    if (api.flash) api.flash(itemName(key[0]))
    return true
  }
  function near(kind) {
    const ids = kind === 'bench' ? [22] : kind === 'oven' ? [23] : kind === 'smelter' || kind === 'forge' ? [42] : kind === 'fabricator' ? [43] : []
    const p = api.pos()
    for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -4; dz <= 4; dz++) {
      const id = api.getVoxel(Math.floor(p[0]) + dx, Math.floor(p[1]) + dy, Math.floor(p[2]) + dz)
      if (ids.includes(id)) return true
    }
    return false
  }
  function holdItem(itemKey, index) {
    let i = Number.isInteger(index) ? index : -1
    if (!bag.slots[i] || bag.slots[i].item !== itemKey) i = bag.slots.findIndex((s) => s && s.item === itemKey)
    if (i < 0) return false
    if (i > 8) {
      const tmp = bag.slots[hot]
      bag.slots[hot] = bag.slots[i]
      bag.slots[i] = tmp
    } else hot = i
    paintHotbar()
    if (api.markDirty) api.markDirty()
    return true
  }
  function stackCap(item) {
    return item === 'woodTool' || item === 'stoneTool' ? 1 : 64
  }
  function relocate(from, to) {
    if (from === to || from < 0 || to < 0 || to >= bag.slots.length) return false
    const a = bag.slots[from]
    if (!a) return false
    const b = bag.slots[to]
    const follow = () => {
      if (hot === from) hot = to
      else if (hot === to) hot = from
      if (bagSel === from) bagSel = to
      else if (bagSel === to) bagSel = from
    }
    if (!b) {
      bag.slots[to] = a
      bag.slots[from] = null
      follow()
    } else if (b.item === a.item) {
      const room = stackCap(a.item) - b.n
      if (room <= 0) return false
      const moveN = Math.min(room, a.n)
      b.n += moveN
      a.n -= moveN
      if (a.n <= 0) {
        bag.slots[from] = null
        if (hot === from) hot = to
        if (bagSel === from) bagSel = to
      }
    } else {
      bag.slots[from] = b
      bag.slots[to] = a
      follow()
    }
    paintHotbar()
    if (api.markDirty) api.markDirty()
    return true
  }
  function tapSlot(i) {
    const s = bag.slots[i]
    if (bagSel < 0) { if (s) bagSel = i; return }
    if (bagSel === i) { bagSel = -1; return }
    relocate(bagSel, i)
  }
  function dropStack(index, all) {
    const s = bag.slots[index]
    if (!s) return
    const n = all ? s.n : 1
    const item = s.item
    s.n -= n
    if (s.n <= 0) {
      bag.slots[index] = null
      if (bagSel === index) bagSel = -1
    }
    const p = dropSpot()
    spawnDrop(item, n, p[0], p[1], p[2], 'q')
    paintHotbar()
    if (api.markDirty) api.markDirty()
  }
  function startDrag(el, e, opts) {
    if (!e || (e.button != null && e.button !== 0)) return
    bagSkip = 0
    trayGesture = 0
    if (opts.canStart && !opts.canStart()) return
    const pid = e.pointerId
    const start = opts.distance != null ? opts.distance : (e.pointerType === 'touch' ? 10 : 6)
    const sx = e.clientX
    const sy = e.clientY
    let dragged = false
    let ghost = null
    let done = false
    const clearMarks = () => {
      document.querySelectorAll('.drop-ok,.drop-bad').forEach((n) => n.classList.remove('drop-ok', 'drop-bad'))
    }
    const targetAt = (x, y) => {
      const under = document.elementFromPoint(x, y)
      return under && under.closest ? under.closest(opts.targets) : null
    }
    const paint = (x, y) => {
      clearMarks()
      const t = targetAt(x, y)
      if (!t) return
      t.classList.add(opts.canDrop(t) ? 'drop-ok' : 'drop-bad')
    }
    const finish = (ev, cancel) => {
      if (done) return
      if (ev && ev.pointerId !== pid) return
      done = true
      window.removeEventListener('pointermove', move, true)
      window.removeEventListener('pointerup', up, true)
      window.removeEventListener('pointercancel', up, true)
      window.removeEventListener('resize', onResize)
      try { el.releasePointerCapture(pid) } catch (err) {}
      clearMarks()
      if (ghost) ghost.remove()
      ghost = null
      if (dragged) {
        bagSkip = performance.now()
        trayGesture = performance.now()
      }
      if (!dragged || cancel) return
      const t = ev ? targetAt(ev.clientX, ev.clientY) : null
      if (t && opts.canDrop(t)) opts.onDrop(t)
    }
    const move = (ev) => {
      if (ev.pointerId !== pid) return
      const dx = ev.clientX - sx
      const dy = ev.clientY - sy
      if (!dragged && dx * dx + dy * dy >= start * start) {
        dragged = true
        ghost = document.createElement('div')
        ghost.className = opts.ghostClass
        if (opts.icon) ghost.append(opts.icon())
        document.body.append(ghost)
      }
      if (!ghost) return
      ghost.style.left = ev.clientX + 'px'
      ghost.style.top = ev.clientY + 'px'
      paint(ev.clientX, ev.clientY)
    }
    const up = (ev) => finish(ev, ev.type === 'pointercancel')
    const onResize = () => finish(null, true)
    try { el.setPointerCapture(pid) } catch (err) {}
    window.addEventListener('pointermove', move, true)
    window.addEventListener('pointerup', up, true)
    window.addEventListener('pointercancel', up, true)
    window.addEventListener('resize', onResize)
  }
  function refreshBag() {
    const g = document.querySelector('#sheet[data-panel="inventory"] .ggrid')
    if (!g || mode !== 'survival') return
    g.innerHTML = ''
    paintBag(g)
  }
  function card(itemKey, index) {
    const item = ITEMS[itemKey]
    const s = bag.slots[index]
    const n = s && s.item === itemKey ? s.n : 0
    const panel = document.createElement('div')
    panel.className = 'bag-card'
    const head = document.createElement('div')
    head.className = 'bag-head'
    const ic = document.createElement('span')
    ic.className = 'gic'
    ic.append(itemIcon(item))
    const name = document.createElement('span')
    name.className = 'bag-name'
    name.textContent = itemName(itemKey) + ' x' + n
    head.append(ic, name)
    panel.append(head)
    const keys = document.createElement('div')
    keys.className = 'bag-keys'
    const addKey = (act, label, fn) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'keycap'
      b.dataset.act = act
      b.textContent = label
      b.addEventListener('click', (e) => { e.stopPropagation(); fn() })
      keys.append(b)
    }
    addKey('hold', t('holdIt'), () => { holdItem(itemKey, index); if (api.close) api.close() })
    addKey('drop1', t('drop1'), () => { dropStack(index, false); refreshBag() })
    addKey('dropall', t('dropAll'), () => { dropStack(index, true); refreshBag() })
    addKey('worth', t('worth'), () => {
      const pay = quoteSell(item, wallet.state.soldToday[itemKey] || 0, wallet.state.dial || 1, { ...ECON, dial: wallet.state.dial })
      api.toast(t('worth') + ' ⚙ ' + (item.base || 0) + ' · ' + t('tallyPays') + ' ⚙ ' + pay + ' · ' + t('youHave') + ' ' + bag.count(itemKey))
    })
    panel.append(keys)
    return panel
  }
  function itemIcon(item) {
    if (!item) return document.createElement('span')
    if (item.svg) { const s = document.createElement('span'); s.innerHTML = itemSvg(item.svg); return s }
    if (item.block && api.blockIcon) return api.blockIcon(item.block)
    const s = document.createElement('span')
    s.innerHTML = itemSvg('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>')
    return s
  }
  function paintBag(g) {
    const title = document.getElementById('sheet-title')
    g.classList.add('baggrid')
    if (mode !== 'survival') {
      if (title) title.textContent = t('bag')
      const wells = document.createElement('div')
      wells.className = 'wells'
      for (const [k, item] of Object.entries(ITEMS)) {
        if (!item.block) continue
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'well gtile'
        const pic = document.createElement('span')
        pic.className = 'gic'
        pic.append(api.blockIcon ? api.blockIcon(item.block) : document.createElement('span'))
        b.append(pic)
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        lbl.textContent = itemName(k)
        b.append(lbl)
        b.setAttribute('aria-label', itemName(k))
        b.title = itemName(k)
        b.addEventListener('pointerdown', (e) => {
          if (e.button != null && e.button !== 0) return
          const blockId = item.block
          const bar = document.getElementById('hotbar')
          const sx = e.clientX
          const sy = e.clientY
          const pid = e.pointerId
          const thresh = e.pointerType === 'touch' ? 10 : 6
          let dropped = false
          const raise = (ev) => {
            if (ev.pointerId !== pid) return
            const dx = ev.clientX - sx
            const dy = ev.clientY - sy
            if (dx * dx + dy * dy < thresh * thresh) return
            if (bar) {
              bar.style.zIndex = '70'
              bar.dataset.drag = '1'
            }
            window.removeEventListener('pointermove', raise, true)
          }
          const paintMark = () => {
            for (const n of document.querySelectorAll('#hotbar .slot')) {
              if (n.classList.contains('drop-ok')) {
                n.style.outline = '3px solid #22D3EE'
                n.style.outlineOffset = '1px'
              } else if (n.style.outline) {
                n.style.outline = ''
                n.style.outlineOffset = ''
              }
            }
          }
          const end = () => {
            window.removeEventListener('pointermove', raise, true)
            window.removeEventListener('pointermove', paintMark, true)
            window.removeEventListener('pointerup', end, true)
            window.removeEventListener('pointercancel', end, true)
            if (bar) delete bar.dataset.drag
            setTimeout(() => {
              if (dropped) return
              if (bar) bar.style.zIndex = ''
              for (const n of document.querySelectorAll('#hotbar .slot')) {
                n.style.outline = ''
                n.style.outlineOffset = ''
              }
            }, 0)
          }
          window.addEventListener('pointermove', raise, true)
          startDrag(b, e, {
            ghostClass: 'bag-ghost',
            targets: '#hotbar .slot[data-slot]',
            icon: () => (api.blockIcon ? api.blockIcon(blockId) : document.createElement('span')),
            canDrop: () => true,
            onDrop: (slot) => {
              const i = Number(slot.dataset.slot)
              if (bar) delete bar.dataset.drag
              if (api.putPalette) api.putPalette(i, blockId)
              dropped = true
              const landed = document.querySelector('#hotbar .slot[data-slot="' + i + '"]')
              if (landed) {
                landed.style.outline = '3px solid #22D3EE'
                landed.style.outlineOffset = '2px'
                setTimeout(() => {
                  if (landed.isConnected) {
                    landed.style.outline = ''
                    landed.style.outlineOffset = ''
                  }
                }, 600)
              }
              if (bar) {
                bar.style.zIndex = '70'
                setTimeout(() => { bar.style.zIndex = '' }, 1000)
              }
            },
          })
          window.addEventListener('pointermove', paintMark, true)
          window.addEventListener('pointerup', end, true)
          window.addEventListener('pointercancel', end, true)
        })
        b.addEventListener('click', () => {
          if (bagSkip && performance.now() - bagSkip < 700) return
          if (api.assign) api.assign(item.block, k)
          api.toast(itemName(k))
          for (const el of wells.querySelectorAll('.well.on')) {
            el.classList.remove('on')
            el.setAttribute('aria-pressed', 'false')
          }
          b.classList.add('on')
          b.setAttribute('aria-pressed', 'true')
        })
        wells.append(b)
      }
      g.append(wells)
      return
    }
    const used = bag.slots.filter(Boolean).length
    if (title) title.textContent = t('bag') + ' · ' + used + '/' + bag.slots.length
    if (bagSel >= bag.slots.length || (bagSel >= 0 && !bag.slots[bagSel])) bagSel = -1
    if (lost.length) {
      const n = lost.reduce((sum, d) => sum + d.n, 0)
      const lostBtn = document.createElement('button')
      lostBtn.type = 'button'
      lostBtn.className = 'keycap lost-row'
      lostBtn.textContent = t('lostBtn') + ' · ' + t(lostLabelKey()) + ' · ' + n
      lostBtn.addEventListener('click', () => { takeLost(); g.innerHTML = ''; paintBag(g) })
      g.append(lostBtn)
    }
    const tab = (text) => {
      const d = document.createElement('div')
      d.className = 'crate-tab'
      d.textContent = text
      return d
    }
    const row = (from, to) => {
      const w = document.createElement('div')
      w.className = 'wells'
      for (let i = from; i < to; i++) w.append(one(bag.slots[i], i))
      return w
    }
    const layout = document.createElement('div')
    layout.className = 'bag-layout'
    const main = document.createElement('div')
    main.className = 'bag-main'
    main.append(tab(t('hotbar')), row(0, 9), tab(t('pockets')), row(9, bag.slots.length))
    layout.append(main)
    if (bagSel >= 0 && bag.slots[bagSel]) layout.append(card(bag.slots[bagSel].item, bagSel))
    g.append(layout)
    function one(s, i) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well gtile' + (s ? '' : ' empty') + (i === bagSel ? ' on' : '')
      b.dataset.slot = String(i)
      const pic = document.createElement('span')
      pic.className = 'gic'
      if (s) pic.append(itemIcon(ITEMS[s.item]))
      b.append(pic)
      if (s) {
        const count = document.createElement('span')
        count.className = 'count'
        count.textContent = String(s.n)
        b.append(count)
        if (i === bagSel) {
          const lbl = document.createElement('span')
          lbl.className = 'glbl'
          lbl.textContent = (s.item === 'woodTool' || s.item === 'stoneTool') ? bagLine(s) : itemName(s.item)
          b.append(lbl)
        }
      }
      const wear = s && wearBar(ITEMS[s.item], s.uses)
      if (wear) b.append(wear)
      b.setAttribute('aria-pressed', String(i === bagSel))
      b.setAttribute('aria-label', s ? itemName(s.item) : t('emptySlot'))
      b.title = s ? itemName(s.item) : t('emptySlot')
      b.addEventListener('pointerdown', (e) => {
        startDrag(b, e, {
          ghostClass: 'bag-ghost',
          targets: '.well[data-slot]',
          canStart: () => !!(s && bag.slots[i]),
          icon: () => itemIcon(ITEMS[s.item]),
          canDrop: (well) => {
            const to = Number(well.dataset.slot)
            const src = bag.slots[i]
            if (!src || to === i) return false
            const dest = bag.slots[to]
            if (!dest || dest.item !== src.item) return true
            return dest.n < stackCap(src.item)
          },
          onDrop: (well) => {
            const to = Number(well.dataset.slot)
            if (to !== i) relocate(i, to)
            refreshBag()
          },
        })
      })
      b.addEventListener('click', (e) => {
        if (bagSkip && performance.now() - bagSkip < 700) { e.preventDefault(); e.stopPropagation(); return }
        tapSlot(i)
        refreshBag()
      })
      return b
    }
  }
  let craftOpen = false
  let craftId = ''
  let craftFx = ''
  let trayPick = ''
  let trayPickSlot = -1
  let trayId = ''
  let trayPlaced = []
  let trayWatch = false
  let trayGesture = 0
  function trayGiveBack(item, n) {
    if (!item || !(n > 0)) return
    const left = bag.add(item, n)
    if (!left) return
    const p = api.pos()
    spawnDrop(item, left, p[0], p[1] + 0.3, p[2], 'full')
  }
  function returnTray() {
    const r = RECIPES.find((x) => x.id === trayId)
    let moved = false
    if (r) r.in.forEach((pair, i) => {
      const n = trayPlaced[i] || 0
      if (!n) return
      trayGiveBack(pair[0], n)
      trayPlaced[i] = 0
      moved = true
    })
    if (moved) paintHotbar()
  }
  function armTrayWatch() {
    if (trayWatch) return
    const sheet = document.getElementById('sheet')
    if (!sheet) return
    trayWatch = true
    const obs = new MutationObserver(() => {
      if (sheet.hidden || sheet.dataset.panel !== 'crafting') returnTray()
    })
    obs.observe(sheet, { attributes: true, attributeFilter: ['hidden', 'data-panel'] })
  }
  function heldCount(r, item) {
    let n = bag.count(item)
    if (r && r.id === trayId) r.in.forEach((pair, i) => { if (pair[0] === item) n += trayPlaced[i] || 0 })
    return n
  }
  function syncTray(id) {
    if (trayId === id) return
    returnTray()
    trayId = id
    const rr = RECIPES.find((x) => x.id === id)
    trayPlaced = rr ? rr.in.map(() => 0) : []
  }
  function seenBag(id) {
    const r = id ? RECIPES.find((x) => x.id === id) : null
    return { count: (item) => heldCount(r, item) }
  }
  let trayNote = ''
  function nearestOvenKey() {
    const p = api.pos()
    const px = Math.floor(p[0]), py = Math.floor(p[1]), pz = Math.floor(p[2])
    let best = null
    let bestD = 1e9
    for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -4; dz <= 4; dz++) {
      const x = px + dx, y = py + dy, z = pz + dz
      if (api.getVoxel(x, y, z) !== 23) continue
      const d = dx * dx + dy * dy + dz * dz
      if (d < bestD) { bestD = d; best = x + ',' + y + ',' + z }
    }
    return best
  }
  function openBreadOven() {
    craftId = 'bread'
    if (!near('oven')) {
      trayNote = t('needsOven')
      return false
    }
    returnTray()
    const key = nearestOvenKey()
    if (api.armOven && key) api.armOven(key, 'bread')
    if (api.open) api.open('station', key)
    return true
  }
  function sourceHint(item) {
    if (item === 'log' || item === 'planks') return t('srcChop')
    if (item === 'stone' || item === 'slate') return t('srcStone')
    if (item === 'coal') return t('srcCoal')
    return ''
  }
  function paintCraft(g) {
    armTrayWatch()
    const sheetBody = document.getElementById('sheet-body')
    if (sheetBody) {
      sheetBody.scrollTop = 0
      requestAnimationFrame(() => { if (sheetBody.isConnected) sheetBody.scrollTop = 0 })
    }
    g.innerHTML = ''
    g.classList.add('crate')
    const stations = { bench: near('bench'), oven: near('oven'), smelter: near('smelter'), forge: near('forge'), fabricator: near('fabricator') }
    let rows = RECIPES.map((r) => ({ r, st: craftStatus(r, seenBag(r.id), stations, mode !== 'survival') }))
    if (!rows.some((x) => x.r.id === craftId)) {
      const pick = rows.find((x) => x.st.group === 'now') || rows.find((x) => x.st.group === 'almost') || rows[0]
      craftId = pick ? pick.r.id : ''
    }
    syncTray(craftId)
    rows = RECIPES.map((r) => ({ r, st: craftStatus(r, seenBag(r.id), stations, mode !== 'survival') }))
    if (trayPickSlot >= 0) {
      const held = bag.slots[trayPickSlot]
      if (!held || held.item !== trayPick) { trayPick = ''; trayPickSlot = -1 }
    } else if (trayPick && !bag.count(trayPick)) trayPick = ''
    const fxKind = craftFx
    craftFx = ''
    const note = trayNote
    trayNote = ''
    const tray = document.createElement('div')
    tray.className = 'build-tray'
    const book = document.createElement('div')
    book.className = 'book'
    const side = document.createElement('div')
    side.className = 'tray'
    const ingWells = []
    let resultEl = null
    const drawWells = (list) => {
      if (!list.length) return
      const row = document.createElement('div')
      row.className = 'book-row'
      for (const { r, st } of list) {
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'well' + (r.id === craftId ? ' on' : '') + (st.ok || r.id === 'bread' ? '' : ' dim')
        b.setAttribute('aria-pressed', String(r.id === craftId))
        const art = document.createElement('span')
        art.className = 'art'
        art.append(itemIcon(ITEMS[r.out[0]]))
        b.append(art)
        const name = document.createElement('span')
        name.className = 'wlab'
        name.textContent = itemName(r.out[0])
        b.append(name)
        if (r.id === 'bread') {
          const line = document.createElement('span')
          line.className = 'need bake-in'
          const mark = document.createElement('span')
          mark.className = 'art oven-mark'
          mark.append(itemIcon(ITEMS.oven))
          line.append(mark, document.createTextNode(t('bakeInOven')))
          b.append(line)
        } else if (!st.ok) {
          const lock = document.createElement('span')
          lock.className = 'lock'
          lock.setAttribute('aria-hidden', 'true')
          lock.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="11" width="12" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
          b.append(lock)
          const miss = st.needs.find(([, have, n]) => have < n)
          const line = document.createElement('span')
          line.className = 'need'
          if (miss) {
            const hint = sourceHint(miss[0])
            line.textContent = t('needN').replace('{n}', String(miss[2])).replace('{item}', itemName(miss[0])) + (hint ? ' · ' + hint : '')
          } else line.textContent = st.gate === 'T5' ? t('needsT5') : st.gate === 'T4' ? t('needsT4') : st.station === 'oven' ? t('needsOven') : st.station === 'bench' ? t('needsBench') : t('showAll')
          b.append(line)
        }
        b.addEventListener('click', () => {
          if (r.id === 'bread') {
            if (!openBreadOven()) paintCraft(g)
            return
          }
          if (r.id !== craftId) returnTray()
          craftId = r.id
          craftFx = 'slide'
          paintCraft(g)
        })
        row.append(b)
      }
      book.append(row)
    }
    const head = (key) => {
      const p = document.createElement('p')
      p.className = 'gnote ghead'
      p.textContent = t(key)
      book.append(p)
    }
    const now = rows.filter((x) => x.st.group === 'now')
    const almost = rows.filter((x) => x.st.group === 'almost')
    const gated = rows.filter((x) => x.st.group === 'gated')
    const rest = rows.filter((x) => x.st.group === 'rest')
    if (now.length) { head('canNow'); drawWells(now) }
    if (almost.length) { head('almost'); drawWells(almost) }
    if (rest.length || gated.length) {
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'keycap showall'
      toggle.textContent = t('showAll')
      toggle.addEventListener('click', () => { craftOpen = !craftOpen; paintCraft(g) })
      book.append(toggle)
      if (craftOpen) drawWells(gated.concat(rest))
    }
    const chosen = rows.find((x) => x.r.id === craftId) || rows[0]
    if (chosen) {
      const { r, st } = chosen
      if (trayPlaced.length !== r.in.length) trayPlaced = r.in.map((_, i) => trayPlaced[i] || 0)
      const placePart = (item, index) => {
        const needItem = r.in[index][0]
        const needN = r.in[index][1]
        if (item !== needItem) {
          const well = side.querySelector('.ing[data-i="' + index + '"]')
          if (well) {
            well.classList.add('bad')
            fx(well, 'shake')
          }
          const chip = side.querySelector('.slot-chip')
          if (chip) {
            chip.hidden = false
            chip.textContent = t('slotNeeds').replace('{item}', itemName(needItem))
          }
          return false
        }
        const room = needN - (trayPlaced[index] || 0)
        const takeN = Math.min(bag.count(item), room)
        if (takeN <= 0) return false
        if (!bag.take(item, takeN)) return false
        trayPlaced[index] = (trayPlaced[index] || 0) + takeN
        paintHotbar()
        paintCraft(g)
        return true
      }
      const returnSlot = (index) => {
        const n = trayPlaced[index] || 0
        if (!n) return
        trayGiveBack(r.in[index][0], n)
        trayPlaced[index] = 0
        paintHotbar()
        paintCraft(g)
      }
      const line = document.createElement('div')
      line.className = 'tray-line'
      r.in.forEach(([item, n], i) => {
        const placed = trayPlaced[i] || 0
        const well = document.createElement('button')
        well.type = 'button'
        well.className = 'well ing' + (placed ? '' : ' ghost') + (placed >= n ? ' done' : '')
        well.dataset.i = String(i)
        well.dataset.placed = String(placed)
        well.dataset.need = item
        well.setAttribute('aria-label', itemName(item) + ' ' + placed + '/' + n)
        const art = document.createElement('span')
        art.className = 'art'
        art.append(itemIcon(ITEMS[item]))
        well.append(art)
        const badge = document.createElement('span')
        badge.className = 'badge'
        badge.textContent = placed + '/' + n
        well.append(badge)
        const lab = document.createElement('span')
        lab.className = 'wlab'
        lab.textContent = itemName(item)
        well.append(lab)
        if (placed >= n) {
          const check = document.createElement('span')
          check.className = 'check'
          check.textContent = '✓'
          check.setAttribute('aria-hidden', 'true')
          well.append(check)
        }
        well.addEventListener('pointerdown', () => { trayGesture = 0; bagSkip = 0 })
        well.addEventListener('click', () => {
          if (performance.now() - trayGesture < 450) return
          const have = trayPlaced[i] || 0
          if (trayPick) {
            if (have >= n && trayPick === item) { returnSlot(i); return }
            placePart(trayPick, i)
            return
          }
          if (have > 0) returnSlot(i)
        })
        line.append(well)
        ingWells.push(well)
      })
      const arrow = document.createElement('div')
      arrow.className = 'chunk-arrow'
      arrow.setAttribute('aria-hidden', 'true')
      line.append(arrow)
      resultEl = document.createElement('div')
      resultEl.className = 'well result'
      const art = document.createElement('span')
      art.className = 'art'
      art.append(itemIcon(ITEMS[r.out[0]]))
      resultEl.append(art)
      const lab = document.createElement('span')
      lab.className = 'wlab'
      lab.textContent = itemName(r.out[0]) + (r.out[1] > 1 ? ' ×' + r.out[1] : '')
      resultEl.append(lab)
      line.append(resultEl)
      side.append(line)
      const bagRow = document.createElement('div')
      bagRow.className = 'bag-strip'
      bag.slots.forEach((s, si) => {
        if (!s) return
        const b = document.createElement('button')
        b.type = 'button'
        const picked = trayPickSlot === si
        b.className = 'well bag-bit' + (picked ? ' pick' : '')
        b.dataset.item = s.item
        b.dataset.slot = String(si)
        b.setAttribute('aria-pressed', String(picked))
        b.setAttribute('aria-label', itemName(s.item) + ' ' + bag.count(s.item))
        const pic = document.createElement('span')
        pic.className = 'art'
        pic.append(itemIcon(ITEMS[s.item]))
        b.append(pic)
        const badge = document.createElement('span')
        badge.className = 'badge'
        badge.textContent = String(s.n)
        b.append(badge)
        b.addEventListener('pointerdown', (e) => {
          const item = s.item
          startDrag(b, e, {
            ghostClass: 'tray-ghost',
            targets: '#sheet .ing',
            icon: () => itemIcon(ITEMS[item]),
            canDrop: (well) => {
              const idx = +well.dataset.i
              const need = r.in[idx]
              if (!need || need[0] !== item) return false
              if ((trayPlaced[idx] || 0) >= need[1]) return false
              return bag.count(item) > 0
            },
            onDrop: (well) => { if (well.dataset.i != null) placePart(item, +well.dataset.i) },
          })
        })
        b.addEventListener('click', () => {
          if (performance.now() - trayGesture < 450) return
          trayPick = s.item
          trayPickSlot = si
          paintCraft(g)
        })
        bagRow.append(b)
      })
      side.append(bagRow)
      if (st.station || st.gate) {
        const chip = document.createElement('span')
        chip.className = 'gate-chip'
        const which = st.station === 'oven' ? t('needsOven') : st.station === 'bench' ? t('needsBench') : st.station === 'smelter' || st.station === 'forge' || st.gate === 'T4' ? t('needsT4') : st.station === 'fabricator' || st.gate === 'T5' ? t('needsT5') : ''
        chip.textContent = which
        side.append(chip)
      }
      const slotChip = document.createElement('p')
      slotChip.className = 'slot-chip'
      slotChip.hidden = !note
      if (note) slotChip.textContent = note
      slotChip.setAttribute('role', 'status')
      side.append(slotChip)
      const keys = document.createElement('div')
      keys.className = 'keys'
      const fillBtn = document.createElement('button')
      fillBtn.type = 'button'
      fillBtn.className = 'keycap fill'
      fillBtn.textContent = t('fillTray')
      fillBtn.addEventListener('click', () => {
        let any = false
        r.in.forEach(([item, n], i) => {
          const room = n - (trayPlaced[i] || 0)
          const takeN = Math.min(bag.count(item), room)
          if (takeN > 0 && bag.take(item, takeN)) {
            trayPlaced[i] = (trayPlaced[i] || 0) + takeN
            any = true
          }
        })
        if (any) paintHotbar()
        paintCraft(g)
      })
      keys.append(fillBtn)
      const isBread = r.id === 'bread'
      const full = r.in.every((pair, i) => (trayPlaced[i] || 0) >= pair[1])
      const ready = !isBread && full && !st.station && !st.gate
      const makeBtn = document.createElement('button')
      makeBtn.type = 'button'
      makeBtn.className = 'keycap make' + (isBread ? ' bake' : '') + (!isBread && ready ? ' lit' : '')
      if (isBread) {
        const ic = document.createElement('span')
        ic.className = 'art'
        ic.append(itemIcon(ITEMS.oven))
        makeBtn.append(ic)
        const lab = document.createElement('span')
        lab.textContent = t('bakeInOven')
        makeBtn.append(lab)
        makeBtn.addEventListener('click', () => { if (!openBreadOven()) paintCraft(g) })
      } else {
        makeBtn.textContent = t('make')
        makeBtn.disabled = !ready
        makeBtn.addEventListener('click', () => {
          if (!r.in.every((pair, i) => (trayPlaced[i] || 0) >= pair[1])) return
          if (st.station || st.gate) return
          const outN = r.out[1]
          const left = bag.add(r.out[0], outN)
          const got = outN - left
          if (!got) {
            api.toast(t('bagFull'))
            paintCraft(g)
            return
          }
          if (left) {
            const p = api.pos()
            spawnDrop(r.out[0], left, p[0], p[1] + 0.3, p[2], 'full')
          }
          r.in.forEach((_, i) => { trayPlaced[i] = 0 })
          markFound(r.out[0])
          if (r.out[0] === 'woodTool') markPath('pathTool')
          api.toast(t('make') + ' ' + itemName(r.out[0]))
          craftFx = 'make'
          paintHotbar()
          paintCraft(g)
        })
      }
      keys.append(makeBtn)
      let times = 64
      for (const [item, need] of r.in) times = Math.min(times, Math.floor(heldCount(r, item) / need))
      if (!(times > 0)) times = 0
      const max = document.createElement('button')
      max.type = 'button'
      max.className = 'keycap'
      max.textContent = t('timesMax')
      max.disabled = !(st.ok && times > 1)
      max.addEventListener('click', () => {
        if (!st.ok || times < 2) return
        returnTray()
        const n = maxTimes(r, bag)
        if (n > 1) {
          craftMany(r, n)
          craftFx = 'make'
        }
        paintCraft(g)
      })
      keys.append(max)
      side.append(keys)
    }
    tray.append(book, side)
    g.append(tray)
    if (fxKind === 'slide') ingWells.forEach((el, i) => fx(el, 'in', i * 60))
    if (fxKind === 'make') {
      const makeBtn = side.querySelector('.keycap.make')
      fx(makeBtn, 'squash')
      if (resultEl) fx(resultEl, 'pop')
    }
  }
  function paintShop(g) {
    g.innerHTML = ''
    g.append(tab('💰', t('sell'), () => paintSell(g)))
    g.append(tab('🛒', t('buy'), () => paintBuy(g)))
    g.append(tab('📋', t('prices'), () => paintPrices(g)))
    paintSell(g)
  }
  function tab(ic, label, fn) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile tab'
    b.innerHTML = '<span class="gic">' + ic + '</span><span class="glbl"></span>'
    b.querySelector('.glbl').textContent = label
    b.addEventListener('click', fn)
    return b
  }
  function btn(label, fn) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile'
    b.innerHTML = '<span class="gic">⚙</span><span class="glbl"></span>'
    b.querySelector('.glbl').textContent = label
    b.addEventListener('click', fn)
    return b
  }
  function paintSell(g) {
    today()
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const [k, item] of Object.entries(ITEMS)) {
      if (!bag.count(k)) continue
      const sold = wallet.state.soldToday[k] || 0
      const pay = item.sell ? quoteSell(item, sold, wallet.state.dial || 1, ECON) : 0
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic"></span><span class="glbl"></span>'
      b.querySelector('.gic').append(itemIcon(item))
      b.querySelector('.glbl').textContent = item.sell ? itemName(k) + ' · ' + t('sell') + ' ⚙ ' + pay : itemName(k)
      b.disabled = !item.sell || !canSellToday(sold, wallet.state.dailyCap || ECON.dailyCap)
      b.addEventListener('click', () => { sell(k, 1); paintSell(g) })
      g.append(b)
    }
  }
  function paintBuy(g) {
    for (const el of [...g.querySelectorAll('.item,.break')]) el.remove()
    const br = document.createElement('div')
    br.className = 'break'
    g.append(br)
    for (const k of ECON.storeSells) {
      const item = ITEMS[k]
      const price = quoteBuy(item, wallet.state.dial || 1, ECON)
      const known = (wallet.state.found || []).includes(k)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic"></span><span class="glbl"></span><span class="gneed"></span>'
      b.querySelector('.gic').append(itemIcon(item))
      b.querySelector('.glbl').textContent = itemName(k)
      b.querySelector('.gneed').textContent = known ? '⚙ ' + price : t('findFirst')
      b.disabled = !known
      if (known) b.addEventListener('click', () => buy(k, 1, price))
      g.append(b)
    }
  }
  function paintPrices(g) {
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const k of ECON.storeSells) {
      const item = ITEMS[k]
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic">' + itemIcon(item) + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = itemName(k) + ' · ' + t('sell') + ' ⚙ ' + quoteSell(item, wallet.state.soldToday[k] || 0, wallet.state.dial || 1, ECON) + ' · ' + t('buy') + ' ⚙ ' + quoteBuy(item, wallet.state.dial || 1, ECON)
      g.append(b)
    }
  }
  function paintWallet(g) {
    const p = document.createElement('p')
    p.className = 'gnote balance'
    p.innerHTML = '<bdi>⚙ ' + wallet.state.cogs + ' ' + t('practice') + '</bdi>'
    g.append(p)
    const send = document.createElement('button')
    send.type = 'button'
    send.className = 'gtile'
    send.innerHTML = '<span class="gic">📤</span><span class="glbl">' + t('sendTeacher') + '</span>'
    send.addEventListener('click', () => {
      if (wallet.state.cogs < 1) return
      wallet.post({ kind: 'to-teacher', cogs: -1, perk: 'shout', status: 'waiting', by: 'you' })
      paintChip()
      api.toast(t('sentTeacher'))
    })
    g.append(send)
    const phrase = { sell: t('sold'), buy: t('bought'), 'till-take': t('takeTill'), 'vend-sale': t('townBought'), start: t('startCogs'), teacher: t('teacher') }
    for (const row of wallet.state.ledger.slice(-10).reverse()) {
      const line = document.createElement('p')
      line.className = 'gnote'
      const time = new Date(row.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const words = (phrase[row.kind] || row.kind).replace('{n}', row.n || 0).replace('{item}', itemName(row.item || '')).replace('{cogs}', row.price || Math.abs(row.cogs))
      line.innerHTML = '<bdi>' + words + ' ' + (row.cogs ? (row.cogs > 0 ? '+' : '') + '⚙' + row.cogs : '') + ' · ' + time + '</bdi>'
      g.append(line)
    }
  }
  function paintSettings(g) {
    g.append(btn(t('alwaysDay'), () => {
      const on = document.documentElement.dataset.alwaysDay === '1'
      const next = !on
      document.documentElement.dataset.alwaysDay = next ? '1' : '0'
      if (api.setAlways) api.setAlways(next)
      api.toast(t('alwaysDay'))
    }))
    const n = document.createElement('p')
    n.className = 'gnote'
    n.textContent = t('onDevice')
    g.append(n)
  }
  function paintTeacher(g) {
    if (!(api.staff && api.staff())) {
      const note = document.createElement('p')
      note.className = 'gnote'
      note.textContent = t('askStaff')
      g.append(note)
      return
    }
    const on = api.teacher && api.teacher()
    g.append(btn(on ? t('teacherOn') : t('teacherOff'), () => {
      if (!on && !confirm(t('teacherAsk'))) return
      if (api.setTeacher) api.setTeacher(!on)
      g.innerHTML = ''
      paintTeacher(g)
    }))
    g.append(btn(energyOn ? t('energyOn') : t('energyOff'), () => {
      energyOn = !energyOn
      try { localStorage.setItem('bloxbert-energy', energyOn ? '1' : '0') } catch (e) {}
      syncDig()
      paintEnergy()
      g.innerHTML = ''
      paintTeacher(g)
    }))
    if (on) g.append(btn(api.townYes && api.townYes() ? t('townYes') : t('townNo'), () => {
      if (api.setTown) api.setTown(!(api.townYes && api.townYes()))
      g.innerHTML = ''
      paintTeacher(g)
    }))
    g.append(btn(t('priceDial'), () => { wallet.state.dial = wallet.state.dial === 1 ? 1.5 : 1; api.toast(t('pricesChanged')) }))
    g.append(btn(t('townsfolk'), () => { ECON.townsfolk.on = !ECON.townsfolk.on }))
    g.append(btn(t('resetWallet'), () => { if (confirm(t('resetWallet'))) { wallet.state.cogs = wallet.state.start; wallet.state.ledger = []; wallet.post({ kind: 'teacher', cogs: 0, by: 'teacher' }); paintChip() } }))
  }
  function paintCounter(g, key) {
    g.innerHTML = ''
    const rec = meta.get(key)
    if (!rec) return
    rec.slots.forEach((s, i) => {
      g.append(btn((s ? itemName(s.item) + ' ' + s.n + ' ⚙ ' + s.price : t('stock')) + ' ' + (i + 1), () => stock(key, i)))
    })
    g.append(btn(t('takeTill') + ' ⚙ ' + rec.till, () => { takeTill(key); paintCounter(g, key) }))
    g.append(btn('🧹 ' + t('pickup'), () => {
      const ask = document.createElement('div')
      ask.className = 'ggrid'
      const card = document.createElement('p')
      card.className = 'gnote'
      card.innerHTML = '<img alt="" src="assets/tile-vend.png" width="48" height="48"> '
      card.append(document.createTextNode(t('pickup') + '?'))
      const yes = document.createElement('button')
      yes.type = 'button'
      yes.className = 'gtile'
      yes.innerHTML = '<span class="gic">✓</span><span class="glbl"></span>'
      yes.querySelector('.glbl').textContent = t('pickup')
      yes.addEventListener('click', () => { const [x, y, z] = String(key).split(',').map(Number); pickup(x, y, z, 24); api.close() })
      const no = document.createElement('button')
      no.type = 'button'
      no.className = 'gtile'
      no.innerHTML = '<span class="gic">✕</span><span class="glbl"></span>'
      no.querySelector('.glbl').textContent = t('no')
      no.addEventListener('click', () => ask.remove())
      ask.append(card, yes, no)
      g.append(ask)
    }))
    const profit = (rec.sales || []).reduce((n, s) => n + s.cogs, 0) - wallet.state.spentToday
    const line = document.createElement('p')
    line.className = 'gnote'
    line.textContent = t('profit') + ' ⚙ ' + profit
    g.append(line)
  }
  function hashKey(key) {
    let h = 0
    for (const c of key) h = (h * 33 + c.charCodeAt(0)) | 0
    return h
  }
  function boxRec(key) {
    let rec = meta.get(key)
    if (!rec || !Array.isArray(rec.slots)) {
      rec = { kind: 'box', slots: emptyBox() }
      meta.set(key, rec)
    }
    while (rec.slots.length < 18) rec.slots.push(null)
    return rec
  }
  function spillBox(x, y, z) {
    const key = x + ',' + y + ',' + z
    const rec = meta.get(key)
    if (!rec || !rec.slots) return
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (const s of rec.slots) {
      if (!s || !s.n) continue
      const before = bag.count(s.item)
      const left = bag.add(s.item, s.n)
      if (!first && bag.count(s.item) > before) first = s.item
      if (left) spawnDrop(s.item, left, x + 0.5, y + 0.4, z + 0.5, 'full')
    }
    meta.delete(key)
    takeHand(first, wasEmpty)
    paintHotbar()
    paintChip()
  }
  function paintBox(g, key) {
    const rec = boxRec(key)
    if (paintBox.key !== key) { boxPick = -1; paintBox.key = key }
    g.innerHTML = ''
    g.classList.add('crate')
    const panel = document.createElement('div')
    panel.className = 'machine station-crate'
    const head = document.createElement('div')
    head.className = 'machine-head'
    const ic = document.createElement('span')
    ic.className = 'gic'
    ic.append(itemIcon(ITEMS.box))
    const words = document.createElement('div')
    const title = document.createElement('span')
    title.className = 'machine-name'
    title.textContent = t('box')
    const used = rec.slots.filter((s) => s && s.n).length
    const line = document.createElement('p')
    line.className = 'machine-status'
    line.setAttribute('role', 'status')
    line.textContent = t('filled').replace('{n}', String(used))
    words.append(title, line)
    head.append(ic, words)
    const wells = document.createElement('div')
    wells.className = 'machine-wells'
    const repaint = () => { g.innerHTML = ''; paintBox(g, key) }
    const moveBagSlotToWell = (si, wi) => {
      const s = bag.slots[si]
      if (!s || wi < 0) return false
      const dest = rec.slots[wi]
      if (!dest) rec.slots[wi] = { item: s.item, n: s.n }
      else if (dest.item === s.item) {
        const room = 64 - dest.n
        if (room <= 0) return false
        const move = Math.min(room, s.n)
        dest.n += move
        s.n -= move
        if (s.n <= 0) bag.slots[si] = null
        else { paintHotbar(); if (api.markDirty) api.markDirty(); return true }
      } else {
        rec.slots[wi] = { item: s.item, n: s.n }
        bag.slots[si] = { item: dest.item, n: dest.n }
      }
      if (!dest) bag.slots[si] = null
      paintHotbar()
      if (api.markDirty) api.markDirty()
      return true
    }
    const takeWell = (i) => {
      const s = rec.slots[i]
      if (!s) return false
      const left = bag.add(s.item, s.n)
      if (left === s.n) { api.toast(t('bagFull')); return false }
      rec.slots[i] = left ? { item: s.item, n: left } : null
      paintHotbar()
      if (api.markDirty) api.markDirty()
      return true
    }
    rec.slots.forEach((s, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well gtile box-well' + (s ? '' : ' empty')
      b.dataset.i = String(i)
      const pic = document.createElement('span')
      pic.className = 'gic art'
      if (s) pic.append(itemIcon(ITEMS[s.item]))
      b.append(pic)
      if (s) {
        const count = document.createElement('span')
        count.className = 'badge'
        count.textContent = String(s.n)
        b.append(count)
      }
      const lab = document.createElement('span')
      lab.className = 'glbl'
      lab.textContent = s ? itemName(s.item) : t('emptySlot')
      b.append(lab)
      b.setAttribute('aria-label', s ? itemName(s.item) + ' ' + s.n : t('emptySlot'))
      if (s) {
        const item = s.item
        b.addEventListener('pointerdown', (e) => {
          startDrag(b, e, {
            distance: 10,
            ghostClass: 'bag-ghost',
            targets: '#sheet .bag-strip, #sheet .bag-bit',
            icon: () => itemIcon(ITEMS[item]),
            canDrop: () => true,
            onDrop: () => { takeWell(i); repaint() },
          })
        })
      }
      b.addEventListener('click', () => {
        if (bagSkip && performance.now() - bagSkip < 700) return
        if (boxPick >= 0) {
          if (moveBagSlotToWell(boxPick, i)) { boxPick = -1; repaint() }
          return
        }
        if (s && takeWell(i)) repaint()
      })
      wells.append(b)
    })
    const strip = document.createElement('div')
    strip.className = 'bag-strip'
    bag.slots.forEach((s, si) => {
      if (!s) return
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'well bag-bit' + (boxPick === si ? ' pick' : '')
      b.dataset.item = s.item
      b.dataset.slot = String(si)
      b.setAttribute('aria-pressed', String(boxPick === si))
      b.setAttribute('aria-label', itemName(s.item) + ' ' + s.n)
      const pic = document.createElement('span')
      pic.className = 'art'
      pic.append(itemIcon(ITEMS[s.item]))
      b.append(pic)
      const badge = document.createElement('span')
      badge.className = 'badge'
      badge.textContent = String(s.n)
      b.append(badge)
      const item = s.item
      b.addEventListener('pointerdown', (e) => {
        startDrag(b, e, {
          distance: 10,
          ghostClass: 'bag-ghost',
          targets: '#sheet .box-well',
          icon: () => itemIcon(ITEMS[item]),
          canDrop: (well) => {
            const dest = rec.slots[+well.dataset.i]
            if (!dest || dest.item === item) return !dest || dest.n < 64
            return true
          },
          onDrop: (well) => { if (moveBagSlotToWell(si, +well.dataset.i)) { boxPick = -1; repaint() } },
        })
      })
      b.addEventListener('click', () => {
        if (bagSkip && performance.now() - bagSkip < 700) return
        boxPick = boxPick === si ? -1 : si
        repaint()
      })
      strip.append(b)
    })
    panel.append(head, wells, strip)
    g.append(panel)
  }
  function paintBunk(g, key) {
    g.append(btn(t('yes'), () => { home = String(key || '0,0,0').split(',').map(Number); markPath('pathHome'); api.toast(t('homeSet')); api.close() }))
    g.append(btn('🧹 ' + t('pickup'), () => { home = null; api.toast(t('homeCleared')); api.close() }))
    g.append(btn(t('no'), () => api.close()))
  }
  function craftMany(r, times) {
    const stations = { bench: near('bench'), oven: near('oven') }
    const n = Math.min(times, maxTimes(r, bag))
    if (!n || !canMake(r, bag, stations).ok) return false
    for (const [item, need] of r.in) bag.take(item, need * n)
    const left = bag.add(r.out[0], r.out[1] * n)
    markFound(r.out[0])
    if (left) {
      const p = api.pos()
      spawnDrop(r.out[0], left, p[0], p[1] + 0.3, p[2], 'full')
    } else api.toast(t('make') + ' ' + itemName(r.out[0]) + (n > 1 ? ' ×' + n : ''))
    if (r.out[0] === 'woodTool') markPath('pathTool')
    paintHotbar()
    return true
  }
  function sell(k, n) {
    today()
    const item = ITEMS[k]
    const sold = wallet.state.soldToday[k] || 0
    if (!canSellToday(sold, wallet.state.dailyCap || ECON.dailyCap)) { api.toast(t('tallyEnough').replace('{item}', itemName(k))); return }
    const pay = quoteSell(item, sold, wallet.state.dial || 1, ECON)
    if (!bag.take(k, n)) return
    wallet.state.soldToday[k] = sold + n
    wallet.post({ kind: 'sell', item: k, n, cogs: pay * n, by: 'tally' })
    paintChip(); paintHotbar()
    api.toast(t('sold').replace('{n}', n).replace('{item}', itemName(k)))
  }
  function buy(k, n, price) {
    if (!(wallet.state.found || []).includes(k)) { api.toast(t('findFirst')); return false }
    if (wallet.state.cogs < price * n) { api.toast(t('needMore').replace('{n}', price * n - wallet.state.cogs)); return false }
    if (bag.add(k, n)) { api.toast(t('bagFull')); return false }
    wallet.state.spentToday += price * n
    wallet.post({ kind: 'buy', item: k, n, cogs: -price * n, by: 'tally' })
    paintChip(); paintHotbar()
    api.toast(t('bought').replace('{n}', n).replace('{item}', itemName(k)))
    return true
  }
  function stock(key, i) {
    const rec = meta.get(key)
    const item = selectedItem() || Object.keys(ITEMS).find((k) => bag.count(k))
    if (!item || !bag.take(item, 1)) { api.toast(t('bagFull')); return }
    rec.slots[i] = { item, n: (rec.slots[i] && rec.slots[i].item === item ? rec.slots[i].n : 0) + 1, price: rec.slots[i] && rec.slots[i].price || Math.max(1, ITEMS[item].base || 1) }
    paintHotbar()
  }
  function takeTill(key) {
    const rec = meta.get(key)
    if (!rec.till) return
    wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
    rec.till = 0
    paintChip()
  }
  function takeHand(item, wasEmpty) {
    if (!wasEmpty || !item) return
    if (bag.slots[hot] && bag.slots[hot].item === item) return
    const i = bag.slots.findIndex((s) => s && s.item === item)
    if (i >= 0 && i < 9) hot = i
  }
  function markPath(id) { if (api.path) api.path(id) }
  function onBreak(x, y, z, id) {
    if (mode !== 'survival') {
      if (mode === 'creative') {
        const drop = dropOf(id)
        if (drop) {
          const left = bag.add(drop, 1)
          if (left) spawnDrop(drop, left, x + 0.5, y + 0.4, z + 0.5, 'full')
        }
      }
      return true
    }
    if (id === 21) { api.toast(t('coreplateToast')); return false }
    if (api.townKept && api.townKept(x, y, z)) { api.toast(t('shopProtected')); return false }
    if (id === 24 || id === 26) return false
    if (id === 27) spillBox(x, y, z)
    const drop = dropOf(id)
    let got = 0
    let loose = 0
    const wasEmpty = !bag.slots[hot]
    const beforeSlots = slotSnap()
    if (drop) {
      markFound(drop)
      const left = bag.add(drop, 1)
      got = 1 - left
      loose = left
      if (left) spawnDrop(drop, left, x + 0.5, y + 0.4, z + 0.5, 'full')
      else takeHand(drop, wasEmpty)
    }
    if (id === 12 && !placedLeaves.has(x + ',' + y + ',' + z)) {
      const spot = x + ',' + y + ',' + z
      const h = (x * 374761393 + y * 668265263 + z * 1274126177) >>> 0
      if (!wallet.state.picked.includes(spot) && (h / 4294967296) < 0.33) {
        wallet.state.picked.push(spot)
        markFound('berry')
        const berryLeft = bag.add('berry', 1)
        if (berryLeft) spawnDrop('berry', berryLeft, x + 0.5, y + 0.7, z + 0.5, 'full')
      }
    }
    bagHist.push({ type: 'break', item: drop, n: got, loose })
    if (id === 12 && saplingRoll(x, y, z)) {
      markFound('sapling')
      const sapLeft = bag.add('sapling', 1)
      if (sapLeft) spawnDrop('sapling', sapLeft, x + 0.5, y + 0.55, z + 0.5, 'full')
    }
    if (id === 28 && berryTuft(x, y, z)) {
      markFound('berry')
      const tuftLeft = bag.add('berry', 1)
      if (tuftLeft) spawnDrop('berry', tuftLeft, x + 0.5, y + 0.7, z + 0.5, 'full')
    }
    if (id === 11) markPath('pathTree')
    if (id === 3) markPath('pathStone')
    if (id === 5) markPath('pathCoal')
    wearHeld()
    paintHotbar()
    paintChip()
    if (drop && got) landItem(drop, beforeSlots, 'fly')
    else if (drop && loose) landItem(drop, beforeSlots, 'back')
    return true
  }
  function wearBar(item, uses) {
    const life = item && TOOL_LIFE[item.tool]
    if (!life) return null
    const bar = document.createElement('span')
    bar.className = 'wear'
    const fill = document.createElement('span')
    fill.className = 'fill'
    const left = uses == null ? life : uses
    fill.style.width = Math.max(0, Math.min(100, Math.round((left / life) * 100))) + '%'
    bar.append(fill)
    return bar
  }
  function bagLine(s) {
    if (s.item === 'woodTool') return t('woodToolLine')
    if (s.item === 'stoneTool') return t('stoneToolLine')
    return itemName(s.item) + ' ' + s.n
  }
  function wearHeld() {
    const s = bag.slots[hot]
    if (!s || !ITEMS[s.item] || !ITEMS[s.item].tool) return
    const life = TOOL_LIFE[ITEMS[s.item].tool]
    if (!life) return
    if (s.uses == null) s.uses = life
    s.uses -= 1
    if (s.uses > 0) return
    bag.slots[hot] = null
    const left = bag.add('stick', 1)
    if (left) {
      const p = api.pos()
      spawnDrop('stick', left, p[0], p[1] + 0.3, p[2], 'full')
    }
    api.toast(t('toolStick'))
  }
  function onPlace(x, y, z, id) {
    if (mode !== 'survival') return true
    if (id === 185) {
      const below = api.getVoxel ? api.getVoxel(x, y - 1, z) : 0
      if (below !== 1 && below !== 2) { api.toast(t('saplingSoil')); return false }
    }
    if (api.townKept && api.townKept(x, y, z)) { api.toast(t('shopProtected')); return false }
    const item = selectedItem()
    const need = Object.entries(ITEMS).find(([, v]) => v.block === id)
    const key = need ? need[0] : item
    if (!key || !bag.count(key)) { api.toast(t('noItem').replace('{item}', itemName(key || 'stone'))); return false }
    if (!bag.take(key, 1)) return false
    if (id === 12) placedLeaves.add(x + ',' + y + ',' + z)
    if (id === 24) meta.set(x + ',' + y + ',' + z, { kind: 'vend', owner: 'you', slots: [null, null, null, null], till: 0, sales: [], salesN: 0 })
    if (id === 27) meta.set(x + ',' + y + ',' + z, { kind: 'box', slots: emptyBox() })
    if (id === 30) markPath('pathDoor')
    bagHist.push({ type: 'place', item: key, n: 1 })
    redoBag.length = 0
    paintHotbar()
    return true
  }
  function pickup(x, y, z, id) {
    const key = x + ',' + y + ',' + z
    const wasEmpty = !bag.slots[hot]
    let first = ''
    if (id === 24) {
      const rec = meta.get(key)
      if (rec) {
        for (const s of rec.slots) if (s) {
          const before = bag.count(s.item)
          bag.add(s.item, s.n)
          if (!first && bag.count(s.item) > before) first = s.item
        }
        const beforeVend = bag.count('vend')
        bag.add('vend', 1)
        if (!first && bag.count('vend') > beforeVend) first = 'vend'
        if (rec.till) wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
        meta.delete(key)
      }
      if (api.removeBlock) api.removeBlock(x, y, z)
    }
    if (id === 26) {
      home = null
      const before = bag.count('bunk')
      bag.add('bunk', 1)
      if (!first && bag.count('bunk') > before) first = 'bunk'
    }
    takeHand(first, wasEmpty)
    paintHotbar()
    paintChip()
    return true
  }
  function beforeUndo() {
    if (mode !== 'survival' || !bagHist.length) return true
    const h = bagHist[bagHist.length - 1]
    if (h.type === 'break' && h.item && h.n && bag.count(h.item) < h.n) { api.toast(t('alreadyLeft')); return false }
    if (h.type === 'break' && h.loose && !pullLoose(ground, lost, (k) => bag.count(k), (k, n) => bag.take(k, n), h.item, h.loose)) { api.toast(t('alreadyLeft')); return false }
    return true
  }
  function afterUndo() {
    if (mode !== 'survival') return
    const h = bagHist.pop()
    if (!h) return
    if (h.type === 'place') bag.add(h.item, h.n)
    if (h.type === 'break' && h.item && h.n) bag.take(h.item, h.n)
    redoBag.push(h)
    paintHotbar()
  }
  function beforeRedo() {
    if (mode !== 'survival' || !redoBag.length) return true
    const h = redoBag[redoBag.length - 1]
    if (h.type === 'place' && h.item && bag.count(h.item) < h.n) { api.toast(t('noItem').replace('{item}', itemName(h.item))); return false }
    return true
  }
  function afterRedo() {
    if (mode !== 'survival') return
    const h = redoBag.pop()
    if (!h) return
    bagHist.push(h)
    if (h.type === 'place') bag.take(h.item, h.n)
    if (h.type === 'break' && h.item) {
      if (h.n) bag.add(h.item, h.n)
      if (h.loose) {
        const p = api.pos()
        spawnDrop(h.item, h.loose, p[0], p[1] + 0.3, p[2], 'full')
      }
    }
    paintHotbar()
  }
  function lostAdd(item, n) {
    if (!item || !(n > 0)) return
    const hit = lost.find((d) => d.item === item)
    if (hit) hit.n += n
    else lost.push({ item, n })
    if (api.markDirty) api.markDirty()
  }
  function tryCraft(name) {
    const r = RECIPES.find((x) => x.id === name || x.out[0] === name)
    if (!r) return { ok: false, why: 'missing' }
    const stations = { bench: near('bench'), oven: near('oven'), smelter: near('smelter'), forge: near('forge'), fabricator: near('fabricator') }
    const st = craftStatus(r, bag, stations, mode !== 'survival')
    if (!st.ok) return { ok: false, why: st.gate || st.station || 'count', gate: st.gate || '' }
    if (!make(r, bag)) return { ok: false, why: 'full' }
    paintHotbar()
    return { ok: true, n: bag.count(r.out[0]) }
  }
  function vendTick(n = 1) {
    today()
    let sales = 0
    for (const [key, rec] of meta) {
      if (rec.kind !== 'vend') continue
      for (let i = 0; i < n; i++) {
        if ((rec.salesN || 0) >= (ECON.townsfolk.maxPerCounterPerDay || 20)) break
        const hit = visit(rec, hashKey(key), day, visitN++, (item) => (ITEMS[item] && ITEMS[item].base) || 1)
        if (!hit) continue
        rec.salesN = (rec.salesN || 0) + 1
        rec.slots[hit.i].n -= hit.n
        if (!rec.slots[hit.i].n) rec.slots[hit.i] = null
        rec.till += hit.cogs
        rec.sales = (rec.sales || []).concat([{ at: Date.now(), item: hit.item, n: hit.n, cogs: hit.cogs }]).slice(-20)
        wallet.post({ kind: 'vend-sale', item: hit.item, n: hit.n, cogs: 0, price: hit.cogs, by: 'townsfolk' })
        sales++
        api.toast(t('townBought').replace('{n}', hit.n).replace('{item}', itemName(hit.item)).replace('{cogs}', hit.cogs))
      }
    }
    return sales
  }
  function dump() {
    const m = {}
    for (const [k, v] of meta) m[k] = v
    if (mode === 'survival') hotSlot.survival = hot
    return {
      player: {
        mode,
        bag: bags.survival.dump(),
        bagCreative: bags.creative.dump(),
        hot: hotSlot.survival,
        hotCreative: api.creativeHot ? api.creativeHot() : hotSlot.creative,
        home,
        table: api.tableOn(),
        energy: { bolts: energy.bolts, acc: energy.acc, toasted: energy.toasted },
      },
      econ: wallet.dump(),
      meta: m,
      drops: ground.map((d) => ({ id: d.id, x: +d.x.toFixed(2), y: +d.y.toFixed(2), z: +d.z.toFixed(2), item: d.item, n: d.n, at: d.at })),
      lost: lost.map((d) => ({ item: d.item, n: d.n })),
    }
  }
  function load(doc) {
    const p = doc.player || {}
    mode = p.mode === 'creative' ? 'creative' : 'survival'
    const extra = bags.survival.load(p.bag) || []
    bags.creative.load(Array.isArray(p.bagCreative) ? p.bagCreative : [])
    hotSlot.survival = p.hot || 0
    hotSlot.creative = p.hotCreative || 0
    bag = bags[mode]
    hot = mode === 'survival' ? hotSlot.survival : 0
    if (api.setCreativeHot) api.setCreativeHot(hotSlot.creative)
    home = p.home || null
    const savedEnergy = p.energy
    if (savedEnergy && Number.isFinite(+savedEnergy.bolts)) {
      energy = {
        bolts: Math.max(0, Math.min(10, savedEnergy.bolts | 0)),
        acc: Number.isFinite(+savedEnergy.acc) ? Math.max(0, +savedEnergy.acc) : 0,
        toasted: !!savedEnergy.toasted && (savedEnergy.bolts | 0) === 0,
      }
    } else energy = { bolts: 10, acc: 0, toasted: false }
    wallet.load(doc.econ)
    if (!wallet.state.ledger.length) wallet.post({ kind: 'start', cogs: 0, by: 'you' })
    meta.clear()
    for (const [k, v] of Object.entries(doc.meta || {})) meta.set(k, v)
    day = wallet.state.day || day
    ground.length = 0
    lost.length = 0
    for (const d of doc.drops || []) {
      if (!d || !ITEMS[d.item] || !(d.n > 0)) continue
      ground.push({ id: d.id || ground.length + 1, x: +d.x || 0, y: +d.y || 0, z: +d.z || 0, item: d.item, n: d.n | 0, at: d.at || 0 })
      noteId(d.id || 0)
    }
    for (const d of doc.lost || []) if (d && ITEMS[d.item] && d.n > 0) lost.push({ item: d.item, n: d.n | 0 })
    for (const s of extra) if (s && ITEMS[s.item] && s.n > 0) {
      const hit = lost.find((d) => d.item === s.item)
      if (hit) hit.n += s.n
      else lost.push({ item: s.item, n: s.n })
    }
    if (extra.length) api.toast(t('keptAside'))
    for (const s of bags.survival.slots) if (s) markFound(s.item)
    for (const s of bags.creative.slots) if (s) markFound(s.item)
    for (const item of (doc.econ && doc.econ.found) || []) markFound(item)
    paintChip()
    syncDig()
    paintEnergy()
    if (mode === 'survival') paintHotbar()
    else if (api.paintBar) api.paintBar()
  }
  function setMode(next) {
    const n = next === 'creative' ? 'creative' : 'survival'
    if (n !== mode) {
      if (mode === 'survival') hotSlot.survival = hot
      mode = n
      bag = bags[mode]
      hot = mode === 'survival' ? hotSlot.survival : 0
    }
    paintChip()
    syncDig()
    paintEnergy()
    if (mode === 'survival') paintHotbar()
    else if (api.paintBar) api.paintBar()
  }
  function pace() {
    if (!energyOn || mode !== 'survival' || energy.bolts > 0) return 1
    return 0.7
  }
  function syncDig() { setDigSlow(pace() < 1 ? 1.5 : 1) }
  function paintEnergy() {
    const el = document.getElementById('energy-bar')
    if (!el) return
    const show = !!(energyOn && mode === 'survival')
    el.hidden = !show
    el.setAttribute('aria-label', 'Energy ' + energy.bolts)
    el.querySelectorAll('span').forEach((bit, i) => bit.classList.toggle('on', i < energy.bolts))
  }
  function play(ms, force) {
    syncDig()
    if (!energyOn || mode !== 'survival') { paintEnergy(); return }
    if (!force && (paused || (typeof document !== 'undefined' && document.hidden))) return
    if (!(ms > 0) || energy.bolts <= 0) { paintEnergy(); return }
    const before = energy.bolts
    energy.acc += ms
    while (energy.acc >= BOLT_MS && energy.bolts > 0) {
      energy.acc -= BOLT_MS
      energy.bolts -= 1
    }
    if (energy.bolts === 0) energy.acc = 0
    if (energy.bolts === 0 && !energy.toasted) {
      energy.toasted = true
      lowN += 1
      api.toast(t('energyLow'))
    }
    if (energy.bolts !== before && api.markDirty) api.markDirty()
    paintEnergy()
    syncDig()
  }
  function mountEnergy(noa) {
    let el = document.getElementById('energy-bar')
    if (!el) {
      el = document.createElement('div')
      el.id = 'energy-bar'
      el.setAttribute('role', 'img')
      const top = document.querySelector('header.top')
      if (top) top.append(el)
      else document.body.append(el)
    }
    if (!el.querySelector('span')) for (let n = 0; n < 10; n++) el.append(document.createElement('span'))
    paintEnergy()
    syncDig()
    const hook = () => {
      const smoke = window.__smoke
      if (!smoke || smoke.__energyHooked) return
      if (smoke.clock) {
        const orig = smoke.clock
        smoke.clock = (n) => { const r = orig(n); play(Number(n) || 0, true); return r }
      }
      smoke.energy = () => ({
        bolts: energy.bolts, acc: energy.acc, pace: pace(), dig: getDigSlow(), on: energyOn, lowN,
        shown: !!(document.getElementById('energy-bar') && !document.getElementById('energy-bar').hidden),
      })
      smoke.charge = (n) => {
        energy.bolts = Math.max(0, Math.min(10, n | 0))
        energy.acc = 0
        energy.toasted = energy.bolts === 0
        lowN = 0
        syncDig()
        paintEnergy()
      }
      smoke.__energyHooked = true
    }
    hook()
    setTimeout(hook, 0)
    if (noa && noa.on) setTimeout(() => {
      noa.on('tick', (dt) => {
        play(dt || 33, false)
        if (pace() < 1) {
          const ms = noa.ents.getMovement(noa.playerEntity)
          if (ms) ms.maxSpeed *= 0.7
        }
      })
    }, 0)
  }
  setInterval(() => { if (!paused && mode === 'survival' && ECON.townsfolk.on) vendTick(1) }, 30000)
  return {
    get bag() { return bag },
    bags: () => ({ survival: bags.survival.dump(), creative: bags.creative.dump() }), wallet, meta, paintBag, paintCraft, paintShop, paintWallet, paintSettings, paintTeacher, paintPrices, paintCounter, paintBunk, paintBox,
    give: (item, n) => giveItem(item, n || 1),
    lostAdd,
    tryCraft,
    setCraftOpen(v) { craftOpen = !!v },
    lostItems: () => lost.map((d) => d.item + ':' + d.n),
    spend: (item, n) => bag.take(item, n),
    spendBlock: (id, n) => { const hit = Object.entries(ITEMS).find(([, v]) => v.block === id); const ok = hit ? bag.take(hit[0], n) : false; paintHotbar(); return ok },
    haveBlock: (id) => { const hit = Object.entries(ITEMS).find(([, v]) => v.block === id); return hit ? bag.count(hit[0]) : 0 },
    noteBag: (need) => { for (const [id, n] of Object.entries(need)) { const hit = Object.entries(ITEMS).find(([, v]) => v.block === +id); if (hit) bagHist.push({ type: 'place', item: hit[0], n }) } },
    setHot: (i) => { hot = ((i % 9) + 9) % 9; paintHotbar() },
    pressHot(i) {
      const n = ((i % 9) + 9) % 9
      if (n === hot) return useHeld()
      hot = n
      paintHotbar()
      const s = bag.slots[n]
      if (s && api.flash) api.flash(itemName(s.item))
      return ''
    },
    tryPlace: () => { const k = selectedItem(); const id = k && ITEMS[k] && ITEMS[k].block; return onPlace(1, 5, 1, id) },
    get hot() { return hot },
    onBreak, onPlace, beforeUndo, afterUndo, beforeRedo, afterRedo, vendTick, dump, load, setMode, paintChip, paintHotbar, selectedItem, pickup,
    get mode() { return mode }, set paused(v) { paused = v }, get home() { return home },
    setDay(iso) { day = iso; wallet.state.day = iso; wallet.state.soldToday = {}; for (const rec of meta.values()) rec.visits = 0 },
    give(item, n) { giveItem(item, n) },
    blockForHot() { const k = selectedItem(); return k && ITEMS[k] && ITEMS[k].block },
    toolTier() { const k = selectedItem(); return (k && ITEMS[k] && ITEMS[k].tool) || 'hand' },
    dropHeld, groundDrops: () => ground, clearLoose() { ground.length = 0; lost.length = 0 }, tickDrops,
    tryBuy(k) { const item = ITEMS[k]; return item ? buy(k, 1, quoteBuy(item, wallet.state.dial || 1, ECON)) : false },
    known: (k) => (wallet.state.found || []).includes(k),
    useHeld, selectOwned, holdItem, mountEnergy,
  }
}
