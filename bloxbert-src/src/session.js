// Survival session: bag, Cogs, shop, counters, bunk. Creative never touches this bag.
import { ITEMS, dropOf, saplingRoll, wheatSeedCount, tuftSeedCount } from './data/items.js'
import { RECIPES } from './data/recipes.js'
import { ECON } from './data/econ.js'
import { pays, sells } from './data/econ.js'
import { createBag } from './items.js'
import { canMake, craftStatus, maxTimes, make, fillTakes, maxPlan, placeResult, countOf, isWool } from './craft.js'
import { createWallet } from './econ/wallet.js'
import { quoteSell, quoteBuy, canSellToday } from './econ/store.js'
import { visit } from './econ/vend.js'
import { blockIcon, itemSvg } from './icons.js'
import { mergeOrAdd, stepMagnet, canPick, nearPlayer, pullLoose, noteId, lostWhyKeys, wildBushLoot } from './drops.js'
import { emptyBox, cloneRec, slotMuted } from './box.js'
import { bindBertopiaSlots } from './slots-bridge.js'
import { TOOL_LIFE, setDigSlow, getDigSlow } from './feel.js'
import { fx } from './fx.js'
import { bindStationBag } from './stations.js'
import { berryTuft } from './worldgen.js'
import { Rules } from './rules.js'

export function createSession(api) {
  const bags = { survival: createBag(), creative: createBag() }
  let bag = bags.survival
  bindStationBag(() => bag.slots)
  const wallet = createWallet(ECON, () => paintChip())
  const meta = new Map()
  let mode = 'survival'
  let home = null
  const hotSlot = { survival: 0, creative: 0 }
  let hot = 0
  let bagSel = -1
  let bagSkip = 0
  function slotsHeld() {
    const sheet = document.getElementById('sheet')
    return !!(sheet && sheet.dataset.slotsReady === '0')
  }
  function blockSlot(e) {
    const KS = window.KulibertSlots
    if (KS && KS.guardSlot) return KS.guardSlot(e)
    if (!slotsHeld()) return false
    if (e) { e.preventDefault(); e.stopPropagation() }
    return true
  }
  let day = localDay()
  function localDay() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  let paused = false
  const BOLT_MS = 4 * 60 * 1000
  const HUNGRY_GAP = 5 * 60 * 1000
  const FEED = { berry: 1, bread: 4, cupcake: 3 }
  const LEAF_FOOD = 'berry'
  let energy = { bolts: 10, acc: 0, toasted: false }
  let bedQueue = []
  let bestBed = null
  const BED_TONES = { natural: 1, honey: 1, dark: 1 }
  const BED_PATS = { plain: 1, stripes: 1, checks: 1 }
  const BED_WOOL = { woolBlue: 1, woolGreen: 1, woolRed: 1, woolTan: 1 }
  function shopRules(next) {
    let cur = { path: 'choose', help: false, required: false }
    try {
      const saved = JSON.parse(localStorage.getItem('bloxbert-shop-rules') || 'null')
      if (saved && typeof saved === 'object') {
        if (saved.path === 'design' || saved.path === 'build' || saved.path === 'choose') cur.path = saved.path
        cur.help = !!saved.help
        cur.required = !!saved.required
      }
    } catch (e) {}
    if (next && typeof next === 'object') {
      if (next.path === 'design' || next.path === 'build' || next.path === 'choose') cur.path = next.path
      if ('help' in next) cur.help = !!next.help
      if ('required' in next) cur.required = !!next.required
      try { localStorage.setItem('bloxbert-shop-rules', JSON.stringify(cur)) } catch (e) {}
    }
    return cur
  }
  function liveRecipes() {
    const hide = shopRules().required
    return RECIPES.filter((r) => !(hide && r.id === 'bunk' && r.at === 'bench'))
  }
  function normalizeBed(d) {
    d = d || {}
    return {
      stars: d.stars >= 3 ? 3 : d.stars === 2 ? 2 : 1,
      tone: BED_TONES[d.tone] ? d.tone : 'natural',
      fabric: BED_WOOL[d.fabric] ? d.fabric : 'woolBlue',
      pattern: BED_PATS[d.pattern] ? d.pattern : 'plain',
      restAt: d.restAt > 0 ? d.restAt : 0,
    }
  }
  function giveBed(design) {
    const row = normalizeBed(design)
    if (design && design.restAt > 0) row.restAt = design.restAt
    bedQueue.push(row)
    if (row.stars >= 3) bestBed = { stars: 3, tone: row.tone, fabric: row.fabric, pattern: row.pattern }
    giveItem('bunk', 1)
    if (api.noteMachine) api.noteMachine()
    else if (api.markDirty) api.markDirty()
    return { n: bag.count('bunk'), stars: row.stars }
  }
  function ensureBed(key) {
    let rec = meta.get(key)
    if (!rec || rec.kind !== 'bunk') {
      rec = { kind: 'bunk', ...normalizeBed(null) }
      meta.set(key, rec)
      if (api.markDirty) api.markDirty()
    } else {
      const n = normalizeBed(rec)
      rec.kind = 'bunk'
      rec.stars = n.stars
      rec.tone = n.tone
      rec.fabric = n.fabric
      rec.pattern = n.pattern
      if (!(rec.restAt > 0)) rec.restAt = 0
    }
    return rec
  }
  let hungrySaid = false
  let hungryN = 0
  let berryN = 0
  let berryTold = false
  let ateSinceTip = false
  let hungryWait = false
  let hungryAt = 0
  let playedMs = 0
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
    const where = mergeOrAdd(ground, lost, { item, n, x, y, z, at: Date.now(), why: why === 'full' ? 'bag' : 'ground' })
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
    const n = wallet.balance()
    const el = document.getElementById('wallet-chip')
    if (el) {
      el.hidden = mode !== 'survival'
      el.innerHTML = '<bdi>⚙ ' + n + ' ' + t('practice') + '</bdi>'
      el.title = t('practiceTip')
      el.setAttribute('aria-label', t('practiceTip'))
    }
    const live = document.querySelector('#sheet[data-panel="wallet"] .balance')
    if (live) live.innerHTML = '<bdi>⚙ ' + n + ' ' + t('practice') + '</bdi>'
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
      if (s && slotMuted(s.item)) sw.textContent = '?'
      else if (item && item.svg) sw.innerHTML = itemSvg(item.svg)
      else if (item && item.block && api.blockIcon) sw.append(fitIcon(api.blockIcon(item.block)))
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
      b.setAttribute('aria-label', s ? faceName(s.item) : t('emptySlot'))
      if (s) b.title = faceName(s.item)
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
    if (pocketDot) {
      const dot = document.createElement('span')
      dot.dataset.bagDot = '1'
      dot.setAttribute('aria-hidden', 'true')
      dot.style.cssText = 'position:absolute;top:4px;right:4px;width:10px;height:10px;border-radius:50%;background:#f6c453;box-shadow:0 0 0 2px #1a1206;pointer-events:none'
      bagBtn.style.position = 'relative'
      bagBtn.append(dot)
    }
    bagBtn.addEventListener('pointerdown', (e) => e.stopPropagation())
    bagBtn.addEventListener('click', () => {
      const sheet = document.getElementById('sheet')
      if (sheet && !sheet.hidden && sheet.dataset.panel === 'inventory') { if (api.close) api.close(); return }
      if (api.open) api.open('inventory')
    })
    bar.append(bagBtn)
    const held = bag.slots[hot]
    const label = document.getElementById('current')
    if (label) label.textContent = held ? itemName(held.item) : t('emptySlot')
    const useBtn = document.getElementById('t-place')
    if (useBtn) useBtn.textContent = held && isFoodItem(held.item) ? t('useFood') : t('place')
    const nameKey = held ? held.item : ''
    if (nameKey !== paintHotbar.nameKey) {
      paintHotbar.nameKey = nameKey
      if (nameKey && isFoodItem(nameKey)) sayEatTip()
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
  function isFoodItem(item) {
    if (slotMuted(item)) return false
    return !!(item && (FEED[item] || EDIBLE.includes(item)))
  }
  function sayEatTip() {
    try { if (localStorage.getItem('bloxbert-eat-tip') === '1') return } catch (e) { return }
    try { localStorage.setItem('bloxbert-eat-tip', '1') } catch (e) {}
    api.toast(t('eatTip'))
  }
  function useHeld() {
    const item = selectedItem()
    if (!item || slotMuted(item)) return ''
    if (energyOn && mode === 'survival' && FEED[item]) {
      if (energy.bolts >= 10) {
        api.toast(t('energyFull'))
        return itemName(item)
      }
      if (!bag.take(item, 1)) return ''
      ateSinceTip = true
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
      ateSinceTip = true
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
    const n = ITEMS[item] && ITEMS[item].stack
    return n || 64
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
    if (slotsHeld()) return
    bagSkip = 0
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
      }
      if (!dragged || cancel) {
        if (!dragged && !cancel && opts.onTap) opts.onTap(ev)
        return
      }
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
    ic.append(faceIcon(itemKey))
    const name = document.createElement('span')
    name.className = 'bag-name'
    name.textContent = faceName(itemKey) + ' x' + n
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
      b.addEventListener('pointerdown', (e) => e.stopPropagation())
      b.addEventListener('click', (e) => { e.stopPropagation(); fn(e) })
      keys.append(b)
    }
    addKey('hold', t('holdIt'), (e) => { if (e && e.stopPropagation) e.stopPropagation(); holdItem(itemKey, index); if (api.close) api.close() })
    addKey('drop1', t('drop1'), () => { dropStack(index, false); refreshBag() })
    addKey('dropall', t('dropAll'), () => { dropStack(index, true); refreshBag() })
    if (!slotMuted(itemKey)) addKey('worth', t('worth'), () => {
      const pay = quoteSell(item, wallet.state.soldToday[itemKey] || 0, wallet.state.dial || 1, { ...ECON, dial: wallet.state.dial })
      api.toast(t('worth') + ' ⚙ ' + (item.base || 0) + ' · ' + t('tallyPays') + ' ⚙ ' + pay + ' · ' + t('youHave') + ' ' + bag.count(itemKey))
    })
    panel.append(keys)
    return panel
  }
  function slotPx() {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--ks-slot')
    const n = parseFloat(raw)
    return n > 0 ? n : 56
  }
  function canvasHasInk(canvas) {
    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx || canvas.width < 2 || canvas.height < 2) return false
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data
      for (let i = 3; i < data.length; i += 16) if (data[i] > 8) return true
      return false
    } catch (e) { return false }
  }
  function fitIcon(node) {
    if (!node) return node
    const canvas = node.tagName === 'CANVAS' ? node : (node.querySelector ? node.querySelector('canvas') : null)
    const show = (c) => {
      c.style.width = '100%'
      c.style.height = '100%'
      c.style.imageRendering = 'pixelated'
    }
    const upscale = (c) => {
      const px = slotPx()
      const dpr = Math.min(window.devicePixelRatio || 1, 3)
      const side = Math.max(1, Math.round(px * dpr))
      if (c.width === side && c.height === side) { show(c); return c }
      const next = document.createElement('canvas')
      next.width = side
      next.height = side
      if (c.dataset && c.dataset.block) next.dataset.block = c.dataset.block
      const g = next.getContext('2d', { willReadFrequently: true })
      g.imageSmoothingEnabled = false
      g.drawImage(c, 0, 0, side, side)
      show(next)
      return next
    }
    const apply = (c) => {
      if (!c) return node
      if (!canvasHasInk(c)) { show(c); return node }
      const next = upscale(c)
      if (next === c) return node
      if (node === c) return next
      if (c.parentNode) c.replaceWith(next)
      return node
    }
    const out = apply(canvas)
    if (canvas && !canvasHasInk(canvas)) {
      const later = () => {
        if (!canvas.isConnected && node !== canvas) return
        if (!canvasHasInk(canvas)) return
        const next = upscale(canvas)
        if (next !== canvas && canvas.parentNode) canvas.replaceWith(next)
      }
      requestAnimationFrame(later)
      setTimeout(later, 80)
    }
    return out
  }
  function qMark() {
    const s = document.createElement('span')
    s.textContent = '?'
    return s
  }
  function faceIcon(key) {
    if (slotMuted(key)) return qMark()
    return itemIcon(ITEMS[key])
  }
  function faceName(key) {
    return slotMuted(key) ? '?' : itemName(key)
  }
  function itemIcon(item) {
    if (!item) return document.createElement('span')
    if (item.svg) { const s = document.createElement('span'); s.innerHTML = itemSvg(item.svg); return s }
    if (item.block && api.blockIcon) return fitIcon(api.blockIcon(item.block))
    const s = document.createElement('span')
    s.innerHTML = itemSvg('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>')
    return s
  }
  function paintBag(g) {
    clearPocketDot()
    const title = document.getElementById('sheet-title')
    g.classList.add('baggrid')
    if (mode !== 'survival') {
      if (title) title.textContent = t('bag')
      const wells = document.createElement('div')
      wells.className = 'wells'
      for (const [k, item] of Object.entries(ITEMS)) {
        if (!item.block || slotMuted(k)) continue
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'well gtile'
        const pic = document.createElement('span')
        pic.className = 'gic'
        pic.append(api.blockIcon ? fitIcon(api.blockIcon(item.block)) : document.createElement('span'))
        b.append(pic)
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        lbl.textContent = itemName(k)
        b.append(lbl)
        b.setAttribute('aria-label', itemName(k))
        b.title = itemName(k)
        b.addEventListener('pointerdown', (e) => {
          if (blockSlot(e)) return
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
          if (blockSlot()) return
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
      lostBtn.textContent = t('lostBtn') + ' · ' + lostWhyKeys(lost).map((k) => t(k)).join(', ') + ' · ' + n
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
      if (s) pic.append(faceIcon(s.item))
      b.append(pic)
      if (s) {
        const count = document.createElement('span')
        count.className = 'count'
        count.textContent = String(s.n)
        b.append(count)
        if (i === bagSel) {
          const lbl = document.createElement('span')
          lbl.className = 'glbl'
          lbl.textContent = (s.item === 'woodTool' || s.item === 'stoneTool') ? bagLine(s) : faceName(s.item)
          b.append(lbl)
        }
      }
      const wear = s && wearBar(ITEMS[s.item], s.uses)
      if (wear) b.append(wear)
      b.setAttribute('aria-pressed', String(i === bagSel))
      b.setAttribute('aria-label', s ? faceName(s.item) : t('emptySlot'))
      b.title = s ? faceName(s.item) : t('emptySlot')
      b.addEventListener('pointerdown', (e) => {
        if (blockSlot(e)) return
        startDrag(b, e, {
          ghostClass: 'bag-ghost',
          targets: '.well[data-slot]',
          canStart: () => !!(s && bag.slots[i]),
          icon: () => faceIcon(s.item),
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
        if (blockSlot(e)) return
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
  let trayId = ''
  let trayPlaced = []
  let trayWool = []
  let trayWatch = false
  function noteTray() { if (api.noteMachine) api.noteMachine() }
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
      const back = pair[0] === 'woolAny' && trayWool[i] ? trayWool[i] : pair[0]
      trayGiveBack(back, n)
      trayPlaced[i] = 0
      trayWool[i] = ''
      moved = true
    })
    if (moved) { paintHotbar(); noteTray() }
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
    let n = countOf(bag, item)
    if (r && r.id === trayId) r.in.forEach((pair, i) => { if (pair[0] === item) n += trayPlaced[i] || 0 })
    return n
  }
  function syncTray(id) {
    if (trayId === id) return
    returnTray()
    trayId = id
    xmaxAsk = ''
    leftFor = ''
    const rr = RECIPES.find((x) => x.id === id)
    trayPlaced = rr ? rr.in.map(() => 0) : []
    trayWool = rr ? rr.in.map(() => '') : []
  }
  function seenBag(id) {
    const r = id ? RECIPES.find((x) => x.id === id) : null
    return { count: (item) => heldCount(r, item) }
  }
  let trayNote = ''
  let xmaxAsk = ''
  let leftFor = ''
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
    const made = RECIPES.find((r) => r.out[0] === item && r.at && r.at !== 'hand')
    if (made) {
      const key = made.at === 'bench' ? 'workbench' : made.at === 'forge' ? 'smelter' : made.at
      if (key === 'workbench' || key === 'oven' || key === 'smelter' || key === 'fabricator') return t(key)
    }
    if (item === LEAF_FOOD) return t('leaves')
    const own = ITEMS[item] && ITEMS[item].block
    for (let id = 1; id <= 48; id++) {
      if (dropOf(id) !== item || id === own) continue
      if (id === 29) return t('reed')
      const key = Object.keys(ITEMS).find((k) => ITEMS[k].block === id)
      if (key && key !== item) return t(key)
    }
    if (item === 'log' || item === 'planks') return t('srcChop')
    if (item === 'stone' || item === 'slate') return t('srcStone')
    if (item === 'coal') return t('srcCoal')
    if (item === 'wheat') return t('srcFarm')
    return ''
  }
  function madeFrom(item) {
    const made = RECIPES.find((r) => r.out[0] === item && r.at && r.at !== 'hand' && r.at !== 'oven')
    if (!made) return ''
    const whereKey = made.at === 'bench' ? 'workbench' : made.at === 'forge' ? 'smelter' : made.at
    const from = made.in.map(([it]) => itemName(it)).join(', ')
    return t(whereKey) + ', ' + t('fromSrc').replace('{item}', from)
  }
  function ovenTileLine(r) {
    const bits = r.in.map(([item, n]) => {
      const via = madeFrom(item) || sourceHint(item)
      const name = n + ' ' + itemName(item)
      return via ? name + ' (' + via + ')' : name
    })
    return bits.join(', ') + ' - ' + t('oven')
  }
  function craftProbe() {
    if (!craftProbe.el) {
      const el = document.createElement('div')
      el.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;white-space:normal;word-break:normal;overflow-wrap:normal;hyphens:manual;box-sizing:border-box;padding:0;border:0;display:block;width:auto;'
      document.body.append(el)
      craftProbe.el = el
    }
    return craftProbe.el
  }
  function craftLines(el) {
    const cs = getComputedStyle(el)
    const probe = craftProbe()
    probe.style.width = Math.max(1, el.clientWidth) + 'px'
    probe.style.font = cs.font
    probe.style.fontSize = cs.fontSize
    probe.style.fontWeight = cs.fontWeight
    probe.style.lineHeight = cs.lineHeight
    probe.style.letterSpacing = cs.letterSpacing
    probe.textContent = el.textContent || ''
    const h = probe.getBoundingClientRect().height
    const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) * 1.15) || 14
    return h / lh
  }
  function craftWordClip(el) {
    const limit = el.clientWidth + 0.75
    if (limit < 2) return true
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const probe = craftProbe()
    const cs = getComputedStyle(el)
    probe.style.font = cs.font
    probe.style.fontSize = cs.fontSize
    probe.style.fontWeight = cs.fontWeight
    probe.style.letterSpacing = cs.letterSpacing
    probe.style.width = 'auto'
    let node
    while ((node = walker.nextNode())) {
      const text = node.textContent || ''
      const re = /\S+/g
      let m
      while ((m = re.exec(text))) {
        const range = document.createRange()
        range.setStart(node, m.index)
        range.setEnd(node, m.index + m[0].length)
        const rects = range.getClientRects()
        const tops = new Set()
        for (const r of rects) tops.add(Math.round(r.top))
        if (tops.size > 1) return true
        probe.textContent = m[0]
        if (probe.getBoundingClientRect().width > limit) return true
      }
    }
    return false
  }
  function craftTileOk(name, need, needLines) {
    if (craftLines(name) > 2.05) return false
    if (craftWordClip(name)) return false
    if (!need) return true
    const nr = need.getBoundingClientRect()
    const nm = name.getBoundingClientRect()
    if (nm.height > 0 && nr.height > 0 && nm.bottom > nr.top + 1) return false
    if (need.scrollHeight > need.clientHeight + 2) return false
    if (craftWordClip(need)) return false
    if (needLines && craftLines(need) > 2.05) return false
    return true
  }
  function fitCraftBook(book) {
    if (!book) return
    if (!fitCraftBook.armed) {
      fitCraftBook.armed = true
      window.addEventListener('resize', () => {
        const live = document.querySelector('#sheet[data-panel="crafting"] .book')
        if (live) requestAnimationFrame(() => fitCraftBook(live))
      })
    }
    if (!book.isConnected || book.clientWidth < 8) {
      if (book.dataset.fit === 'wait') return
      book.dataset.fit = 'wait'
      requestAnimationFrame(() => {
        book.dataset.fit = ''
        if (book.isConnected) fitCraftBook(book)
      })
      return
    }
    const cap = Math.max(48, Math.floor(book.clientWidth))
    for (const b of book.querySelectorAll('.well')) {
      const name = b.querySelector(':scope > .wlab')
      if (!name) continue
      const need = b.querySelector(':scope > .need')
      const full = name.textContent || ''
      name.title = full
      if (!b.title || b.title.indexOf(full) === -1) b.title = b.title ? (full + '. ' + b.title) : full
      const aria = b.getAttribute('aria-label') || ''
      if (aria.indexOf(full) === -1) b.setAttribute('aria-label', aria ? (full + '. ' + aria) : b.title)
      b.style.width = ''
      name.style.fontSize = '14px'
      if (craftTileOk(name, need, true)) continue
      name.style.fontSize = '12px'
      if (craftTileOk(name, need, true)) continue
      const minW = Math.ceil(b.getBoundingClientRect().width)
      const hi0 = Math.max(minW, cap)
      let best = 0
      let lo = minW
      let hi = hi0
      while (lo <= hi) {
        const mid = (lo + hi) >> 1
        b.style.width = mid + 'px'
        if (craftTileOk(name, need, true)) { best = mid; hi = mid - 1 }
        else lo = mid + 1
      }
      if (!best) {
        lo = minW
        hi = hi0
        while (lo <= hi) {
          const mid = (lo + hi) >> 1
          b.style.width = mid + 'px'
          if (craftTileOk(name, need, false)) { best = mid; hi = mid - 1 }
          else lo = mid + 1
        }
      }
      if (best) b.style.width = best + 'px'
      else {
        b.style.width = hi0 + 'px'
        name.style.fontSize = '12px'
      }
    }
    book.dataset.fit = '1'
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
    let rows = liveRecipes().map((r) => ({ r, st: craftStatus(r, seenBag(r.id), stations, mode !== 'survival') }))
    if (!rows.some((x) => x.r.id === craftId)) {
      const pick = rows.find((x) => x.st.group === 'now') || rows.find((x) => x.st.group === 'almost') || rows[0]
      craftId = pick ? pick.r.id : ''
    }
    syncTray(craftId)
    rows = liveRecipes().map((r) => ({ r, st: craftStatus(r, seenBag(r.id), stations, mode !== 'survival') }))
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
        name.textContent = r.id === 'door' ? t('doorTall') : itemName(r.out[0])
        name.title = name.textContent
        b.append(name)
        if (r.at === 'oven') {
          const line = document.createElement('span')
          line.className = 'need bake-in'
          const mark = document.createElement('span')
          mark.className = 'art oven-mark'
          mark.append(itemIcon(ITEMS.oven))
          const words = document.createElement('span')
          words.className = 'need-line'
          words.textContent = ovenTileLine(r)
          line.append(mark, words)
          b.title = name.textContent + '. ' + words.textContent
          b.setAttribute('aria-label', b.title)
          b.append(line)
        } else if (!st.ok) {
          const lock = document.createElement('span')
          lock.className = 'lock'
          lock.setAttribute('aria-hidden', 'true')
          lock.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><rect x="6" y="11" width="12" height="9" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
          b.append(lock)
          const line = document.createElement('span')
          line.className = 'need'
          const bits = []
          for (const [item, have, n] of st.needs) {
            if (have >= n) continue
            const left = n - have
            const label = left === 1 ? itemName(item) : (item === LEAF_FOOD ? t('berryMany') : itemName(item))
            const hint = sourceHint(item)
            bits.push(String(left) + ' ' + label + (hint ? ' (' + hint + ')' : ''))
          }
          const full = bits.length
            ? t('needN').replace('{n} {item}', bits.join(', '))
            : (st.gate === 'T5' ? t('needsT5') : st.gate === 'T4' ? t('needsT4') : st.station === 'oven' ? t('needsOven') : st.station === 'bench' ? t('needsBench') : t('showAll'))
          const shown = r.id === 'cupcake' && bits.length ? full + ' · ' + t('oven') : full
          line.textContent = shown
          if (bits.length > 1) b.classList.add('wide')
          b.title = name.textContent + '. ' + shown
          b.setAttribute('aria-label', name.textContent + '. ' + shown)
          b.append(line)
        }
        if (!b.title) b.title = name.textContent
        if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.title)
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
        const ok = needItem === 'woolAny' ? isWool(item) : item === needItem
        if (!ok) return false
        const room = needN - (trayPlaced[index] || 0)
        const takeN = Math.min(bag.count(item), room)
        if (takeN <= 0) return false
        if (!bag.take(item, takeN)) return false
        trayPlaced[index] = (trayPlaced[index] || 0) + takeN
        if (needItem === 'woolAny') trayWool[index] = item
        paintHotbar()
        paintCraft(g)
        noteTray()
        return true
      }
      const returnSlot = (index) => {
        const n = trayPlaced[index] || 0
        if (!n) return
        const back = r.in[index][0] === 'woolAny' && trayWool[index] ? trayWool[index] : r.in[index][0]
        trayGiveBack(back, n)
        trayPlaced[index] = 0
        trayWool[index] = ''
        paintHotbar()
        paintCraft(g)
        noteTray()
      }
      const isBread = r.id === 'bread'
      const full = r.in.every((pair, i) => (trayPlaced[i] || 0) >= pair[1])
      const ready = !isBread && full && !st.station && !st.gate
      let times = 64
      for (const [item, need] of r.in) times = Math.min(times, Math.floor(heldCount(r, item) / need))
      if (!(times > 0)) times = 0
      const KS = window.KulibertSlots
      if (KS && KS.ui && KS.ui.craftPanel) {
        KS.ui.craftPanel(side, {
          recipe: r,
          placed: () => trayPlaced,
          bag: () => bag.slots,
          name: (item) => item === 'woolAny' ? t('woolAny') : itemName(item),
          icon: (item) => itemIcon(item === 'woolAny' ? ITEMS.woolBlue : ITEMS[item]),
          t,
          resultName: (r.id === 'door' ? t('doorTall') : itemName(r.out[0])) + (r.out[1] > 1 ? ' ×' + r.out[1] : ''),
          fillLabel: t('fillTray'),
          makeLabel: isBread ? t('bakeInOven') : t('make'),
          maxLabel: t('timesMax'),
          makeDisabled: isBread ? false : !ready,
          maxDisabled: !(st.ok && times > 1),
          bake: isBread,
          ovenIcon: isBread ? () => itemIcon(ITEMS.oven) : null,
          onPlace: (index, item) => placePart(item, index),
          onReturn: (index) => returnSlot(index),
          onFill: () => {
            const takes = fillTakes(r, (item) => countOf(bag, item), trayPlaced)
            let any = false
            takes.forEach((takeN, i) => {
              if (!(takeN > 0)) return
              const need = r.in[i][0]
              if (need === 'woolAny') {
                let left = takeN
                for (const c of ['woolBlue', 'woolGreen', 'woolRed', 'woolTan']) {
                  const d = Math.min(bag.count(c), left)
                  if (d > 0 && bag.take(c, d)) {
                    trayWool[i] = c
                    left -= d
                    any = true
                  }
                  if (!left) break
                }
                trayPlaced[i] = (trayPlaced[i] || 0) + (takeN - left)
              } else if (bag.take(need, takeN)) {
                trayPlaced[i] = (trayPlaced[i] || 0) + takeN
                any = true
              }
            })
            if (any) { paintHotbar(); noteTray() }
            paintCraft(g)
          },
          onMake: () => {
            if (isBread) {
              if (!openBreadOven()) paintCraft(g)
              return
            }
            if (!r.in.every((pair, i) => (trayPlaced[i] || 0) >= pair[1])) return
            if (st.station || st.gate) return
            const outN = r.out[1]
            const spot = placeResult(bag, r.out[0], outN, hot)
            const got = outN - spot.left
            if (!got) {
              api.toast(t('bagFull'))
              paintCraft(g)
              return
            }
            if (spot.left) {
              const p = api.pos()
              spawnDrop(r.out[0], spot.left, p[0], p[1] + 0.3, p[2], 'full')
            }
            r.in.forEach((_, i) => { trayPlaced[i] = 0 })
            noteTray()
            markFound(r.out[0])
            if (r.out[0] === 'woodTool') markPath('pathTool')
            if (spot.pocket >= 0) sayPocket(r.out[0], spot.pocket)
            else api.toast(t('make') + ' ' + itemName(r.out[0]))
            craftFx = 'make'
            leftFor = r.id
            paintHotbar()
            paintCraft(g)
          },
          onMax: () => {
            if (!st.ok || times < 2) return
            xmaxAsk = r.id
            paintCraft(g)
          },
        })
      }
      if (leftFor === r.id) {
        const left = document.createElement('p')
        left.className = 'gnote left-line'
        left.textContent = r.in.map(([item]) => t('leftLine').replace('{item}', itemName(item)).replace('{n}', String(bag.count(item)))).join(' · ')
        side.append(left)
      }
      if (st.station || st.gate) {
        const chip = document.createElement('span')
        chip.className = 'gate-chip'
        const which = st.station === 'oven' ? t('needsOven') : st.station === 'bench' ? t('needsBench') : st.station === 'smelter' || st.station === 'forge' || st.gate === 'T4' ? t('needsT4') : st.station === 'fabricator' || st.gate === 'T5' ? t('needsT5') : ''
        chip.textContent = which
        side.append(chip)
      }
      if (note) {
        const slotChip = document.createElement('p')
        slotChip.className = 'slot-chip'
        slotChip.textContent = note
        slotChip.setAttribute('role', 'status')
        side.append(slotChip)
      }
      if (xmaxAsk === r.id) {
        const plan = maxPlan(r, (item) => heldCount(r, item))
        const ask = document.createElement('div')
        ask.className = 'xmax-ask keys'
        const q = document.createElement('p')
        q.className = 'gnote'
        const uses = plan.uses.map(([item, m]) => m + ' ' + itemName(item)).join(', ')
        q.textContent = t('makeAsk').replace('{n}', String(plan.n)).replace('{uses}', uses)
        const yes = document.createElement('button')
        yes.type = 'button'
        yes.className = 'keycap xmax-yes'
        yes.textContent = t('make')
        yes.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          returnTray()
          const n = maxTimes(r, bag)
          if (n > 0) {
            craftMany(r, n)
            craftFx = 'make'
            leftFor = r.id
          }
          xmaxAsk = ''
          paintCraft(g)
        })
        const no = document.createElement('button')
        no.type = 'button'
        no.className = 'keycap xmax-no'
        no.textContent = t('cancel')
        no.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          xmaxAsk = ''
          paintCraft(g)
        })
        ask.append(q, yes, no)
        side.append(ask)
      }
    }
    tray.append(book, side)
    g.append(tray)
    const made = side.querySelector('.well.result')
    if (made) {
      const lab = made.querySelector('.wlab')
      if (lab && lab.textContent) {
        made.title = lab.textContent
        lab.title = lab.textContent
      }
    }
    requestAnimationFrame(() => fitCraftBook(book))
    if (fxKind === 'slide') side.querySelectorAll('.ing').forEach((el, i) => fx(el, 'in', i * 60))
    if (fxKind === 'make') {
      const makeBtn = side.querySelector('.keycap.make')
      if (makeBtn) fx(makeBtn, 'squash')
      const resultEl = side.querySelector('.result')
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
    b.addEventListener('pointerdown', (e) => e.stopPropagation())
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(e) })
    return b
  }
  function paintSell(g) {
    today()
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const [k, item] of Object.entries(ITEMS)) {
      if (!bag.count(k) || slotMuted(k)) continue
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
    p.innerHTML = '<bdi>⚙ ' + wallet.balance() + ' ' + t('practice') + '</bdi>'
    g.append(p)
    const send = document.createElement('button')
    send.type = 'button'
    send.className = 'gtile'
    send.innerHTML = '<span class="gic">📤</span><span class="glbl">' + t('sendTeacher') + '</span>'
    send.addEventListener('click', () => {
      if (wallet.balance() < 1) return
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
      const words = (phrase[row.kind] || row.kind).replace('{n}', row.n || 0).replace('{item}', row.item ? itemName(row.item) : '').replace('{cogs}', row.price || Math.abs(row.cogs))
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
    if (on) {
      g.append(btn(api.townYes && api.townYes() ? t('townYes') : t('townNo'), () => {
        if (api.setTown) api.setTown(!(api.townYes && api.townYes()))
        g.innerHTML = ''
        paintTeacher(g)
      }))
      if (api.paintSpawn) api.paintSpawn(g)
    }
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
      yes.addEventListener('pointerdown', (e) => e.stopPropagation())
      yes.addEventListener('click', (e) => { e.stopPropagation(); const [x, y, z] = String(key).split(',').map(Number); pickup(x, y, z, 24); api.close() })
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
      const face = rec && rec.face
      rec = { kind: 'box', slots: emptyBox() }
      if (face) rec.face = face
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
  function slotsUi() {
    if (paintBox.ui) return paintBox.ui
    const KS = bindBertopiaSlots({
      icon: (item) => slotMuted(item) ? qMark() : itemIcon(ITEMS[item] || null),
      name: itemName,
      t,
      cap: stackCap,
      onChange: () => { paintHotbar(); if (api.noteMachine) api.noteMachine(); else if (api.markDirty) api.markDirty() },
      toast: (msg) => { if (msg) api.toast(msg) },
    })
    if (!KS) return null
    paintBox.ui = KS.createSession(document.body)
    return paintBox.ui
  }
  function paintBox(g, key) {
    const rec = boxRec(key)
    const ui = slotsUi()
    if (paintBox.key !== key) {
      if (ui) { ui.setRefresh(() => {}); ui.unpick() }
      paintBox.key = key
    }
    g.innerHTML = ''
    g.classList.add('crate')
    const panel = document.createElement('div')
    panel.className = 'machine station-crate ks-root'
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
    line.textContent = t('boxSlots').replace('{n}', String(used)).replace('{max}', String(rec.slots.length))
    words.append(title, line)
    head.append(ic, words)
    const wells = document.createElement('div')
    wells.className = 'machine-wells'
    const strip = document.createElement('div')
    strip.className = 'bag-strip'
    const hint = document.createElement('p')
    hint.className = 'gnote box-hint'
    hint.textContent = t('boxClick')
    panel.append(head, wells, strip, hint)
    g.append(panel)
    if (!ui) return
    const repaint = () => { if (g.isConnected) paintBox(g, key) }
    ui.setRefresh(repaint)
    const KS = window.KulibertSlots
    const bagWrap = KS.createInventory({ id: 'bag', slots: bag.slots, cap: stackCap })
    const boxWrap = KS.createInventory({ id: 'box:' + key, slots: rec.slots, cap: stackCap })
    const short = window.innerHeight <= 500
    const wide = window.innerWidth >= 700
    const boxCols = short && wide ? 9 : 6
    const bagCols = short && wide ? bag.slots.length : (window.innerWidth < 700 ? 5 : 9)
    ui.grid(wells, boxWrap, { cols: boxCols, quick: [bagWrap] })
    ui.grid(strip, bagWrap, { cols: bagCols, quick: [boxWrap] })
    const bar = document.getElementById('hotbar')
    if (bar) {
      if (paintBox.hotHook) bar.removeEventListener('click', paintBox.hotHook, true)
      paintBox.hotHook = (ev) => {
        const sheet = document.getElementById('sheet')
        if (!sheet || sheet.hidden || sheet.dataset.panel !== 'box') return
        const slot = ev.target && ev.target.closest ? ev.target.closest('[data-slot]') : null
        if (!slot || slot.dataset.slot == null || slot.dataset.slot === '') return
        ev.preventDefault()
        ev.stopPropagation()
        ui.activate(bagWrap, +slot.dataset.slot, ev)
      }
      bar.addEventListener('click', paintBox.hotHook, true)
    }
  }
  function paintBunk(g, key) {
    const rec = ensureBed(key)
    const card = document.createElement('div')
    card.className = 'bed-panel' + ((rec.stars || 1) >= 3 ? ' bed-gold' : '')
    const stars = document.createElement('p')
    stars.className = 'gnote bed-stars'
    stars.dataset.stars = String(rec.stars || 1)
    stars.textContent = (rec.stars || 1) >= 3 ? t('starBest') : (rec.stars || 1) === 2 ? t('starSteady') : t('starWorks')
    const look = document.createElement('p')
    look.className = 'gnote bed-look'
    look.dataset.tone = rec.tone
    look.dataset.fabric = rec.fabric
    look.dataset.pattern = rec.pattern
    look.textContent = t('tone' + rec.tone.charAt(0).toUpperCase() + rec.tone.slice(1)) + ' · ' + t(rec.fabric) + ' · ' + t('pattern' + rec.pattern.charAt(0).toUpperCase() + rec.pattern.slice(1))
    card.append(stars, look)
    if ((rec.stars || 1) >= 3) {
      const gold = document.createElement('p')
      gold.className = 'gnote bed-gold-line'
      gold.textContent = t('goldTrim')
      card.append(gold)
    }
    g.append(card)
    const rest = btn(t('restWord'), () => {
      const now = Date.now()
      if (rec.restAt && now < rec.restAt) { api.toast(t('restWait')); return }
      const gain = (rec.stars || 1) >= 2 ? 3 : 2
      const next = Math.min(10, energy.bolts + gain)
      energy.bolts = next
      if (energy.bolts > 0) energy.toasted = false
      rec.restAt = now + 5 * 60 * 1000
      paintEnergy()
      if (api.markDirty) api.markDirty()
      api.toast(t('rested'))
      g.innerHTML = ''
      paintBunk(g, key)
    })
    rest.classList.add('bed-rest')
    rest.dataset.wait = rec.restAt && Date.now() < rec.restAt ? '1' : '0'
    g.append(rest)
    const homeBtn = btn(t('setHome'), () => { home = String(key || '0,0,0').split(',').map(Number); markPath('pathHome'); api.toast(t('homeSet')); api.close() })
    homeBtn.classList.add('bed-home')
    g.append(homeBtn)
    g.append(btn('🧹 ' + t('pickup'), () => {
      const [x, y, z] = String(key).split(',').map(Number)
      pickup(x, y, z, 26)
      if (api.removeBlock) api.removeBlock(x, y, z)
      api.close()
    }))
    g.append(btn(t('no'), () => api.close()))
    for (const id of ['skillNeed', 'skillPlan', 'skillTest', 'skillImprove']) {
      const line = document.createElement('p')
      line.className = 'gnote bed-skill'
      line.dataset.skill = id
      line.textContent = t(id)
      g.append(line)
    }
  }
  let pocketDot = false
  function clearPocketDot() {
    pocketDot = false
    const dot = document.querySelector('#hotbar [data-bag-dot]')
    if (dot) dot.remove()
  }
  function sayPocket(item, index) {
    pocketDot = true
    api.toast(t('inPockets').replace('{item}', itemName(item)), {
      label: t('holdIt'),
      run: () => holdItem(item, index),
    })
  }
  function takeNamed(item, n) {
    if (item !== 'woolAny') return bag.take(item, n)
    let left = n
    for (const c of ['woolBlue', 'woolGreen', 'woolRed', 'woolTan']) {
      const d = Math.min(bag.count(c), left)
      if (d > 0 && bag.take(c, d)) left -= d
      if (!left) return true
    }
    return left === 0
  }
  function craftMany(r, times) {
    if (r && r.id === 'bunk' && r.at === 'bench' && shopRules().required) return false
    const stations = { bench: near('bench'), oven: near('oven') }
    const n = Math.min(times, maxTimes(r, bag))
    if (!n || !canMake(r, bag, stations).ok) return false
    for (const [item, need] of r.in) if (!takeNamed(item, need * n)) return false
    const spot = placeResult(bag, r.out[0], r.out[1] * n, hot)
    markFound(r.out[0])
    if (spot.left) {
      const p = api.pos()
      spawnDrop(r.out[0], spot.left, p[0], p[1] + 0.3, p[2], 'full')
    }
    if (spot.pocket >= 0) sayPocket(r.out[0], spot.pocket)
    else api.toast(t('make') + ' ' + itemName(r.out[0]) + (n > 1 ? ' ×' + n : ''))
    if (r.out[0] === 'woodTool') markPath('pathTool')
    paintHotbar()
    return true
  }
  function sell(k, n) {
    if (slotMuted(k)) return
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
    if (wallet.balance() < price * n) { api.toast(t('needMore').replace('{n}', price * n - wallet.balance())); return false }
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
    if (api.townKept && api.townKept(x, y, z)) return false
    if (id === 24 || id === 26) return false
    if (id === 27) spillBox(x, y, z)
    const wildBush = id >= 65 && id <= 68 && api.wildBush && api.wildBush(x, y, z)
    const drop = wildBush ? null : dropOf(id)
    let got = 0
    let loose = 0
    const wasEmpty = !bag.slots[hot]
    const beforeSlots = slotSnap()
    if (wildBush) {
      const loot = wildBushLoot(x, y, z)
      giveLoose('berry', loot.berries, x, y, z)
      if (loot.sprout) giveLoose('bushSprout', 1, x, y, z)
      got = loot.berries
    } else if (drop) {
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
        markFound(LEAF_FOOD)
        const berryLeft = bag.add(LEAF_FOOD, 1)
        if (berryLeft) spawnDrop(LEAF_FOOD, berryLeft, x + 0.5, y + 0.7, z + 0.5, 'full')
        if (!berryTold) {
          berryTold = true
          berryN += 1
          api.toast(berryTip())
        }
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
    if (id === 28) giveLoose('wheatSeeds', wheatSeedCount(x, y, z), x, y, z)
    if (id === 58) giveLoose('wheatSeeds', tuftSeedCount(x, y, z), x, y, z)
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
  function giveLoose(item, n, x, y, z) {
    if (!n || !ITEMS[item]) return
    markFound(item)
    const left = bag.add(item, n)
    if (left) spawnDrop(item, left, x + 0.5, y + 0.55, z + 0.5, 'full')
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
    if (api.townKept && api.townKept(x, y, z)) return false
    const item = selectedItem()
    const need = Object.entries(ITEMS).find(([, v]) => v.block === id)
    const key = need ? need[0] : item
    if (!key || !bag.count(key)) { api.toast(t('noItem').replace('{item}', itemName(key || 'stone'))); return false }
    if (!bag.take(key, 1)) return false
    if (id === 12) placedLeaves.add(x + ',' + y + ',' + z)
    if (id === 24) meta.set(x + ',' + y + ',' + z, { kind: 'vend', owner: 'you', slots: [null, null, null, null], till: 0, sales: [], salesN: 0 })
    if (id === 27) meta.set(x + ',' + y + ',' + z, { kind: 'box', slots: emptyBox() })
    if (id === 26) {
      const d = bedQueue.length ? bedQueue.shift() : normalizeBed(null)
      meta.set(x + ',' + y + ',' + z, { kind: 'bunk', ...normalizeBed(d), restAt: d.restAt || 0 })
    }
    if (id === 30) markPath('pathDoor')
    bagHist.push({ type: 'place', item: key, n: 1 })
    redoBag.length = 0
    paintHotbar()
    return true
  }
  function keep(item, n) {
    if (!item || !(n > 0) || !ITEMS[item]) return 0
    markFound(item)
    const left = bag.add(item, n)
    if (left) lostAdd(item, left, 'bag')
    return left
  }
  function pickup(x, y, z, id) {
    const key = x + ',' + y + ',' + z
    const wasEmpty = !bag.slots[hot]
    let first = ''
    let parked = 0
    const take = (item, n) => {
      const left = keep(item, n)
      const got = n - left
      if (got && !first) first = item
      if (left) parked += left
    }
    if (id === 24) {
      const rec = meta.get(key)
      if (rec) {
        for (const s of rec.slots || []) if (s && s.n) take(s.item, s.n)
        if (rec.till) wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
        take('vend', 1)
        meta.delete(key)
      }
      if (api.removeBlock) api.removeBlock(x, y, z)
    }
    if (id === 27) {
      const rec = meta.get(key)
      if (rec && rec.slots) for (const s of rec.slots) if (s && s.n) take(s.item, s.n)
      take('box', 1)
      meta.delete(key)
    }
    if (id === 26) {
      const rec = meta.get(key)
      const d = normalizeBed(rec && rec.kind === 'bunk' ? rec : null)
      if (rec && rec.restAt > 0) d.restAt = rec.restAt
      bedQueue.unshift(d)
      meta.delete(key)
      home = null
      take('bunk', 1)
    }
    takeHand(first, wasEmpty)
    paintHotbar()
    paintChip()
    if (parked) api.toast(t('bagFull'))
    return true
  }
  function blockAt(key) {
    const parts = String(key).split(',').map(Number)
    if (!api.getVoxel || parts.length < 3) return -1
    return api.getVoxel(parts[0], parts[1], parts[2]) | 0
  }
  function recoverOrphans(skipItem) {
    const skip = skipItem || ''
    const doomed = []
    for (const [key, rec] of meta) {
      if (!rec) continue
      if (rec.kind === 'bunk' && blockAt(key) !== 26) doomed.push([key, rec])
      else if (rec.kind === 'vend' && blockAt(key) !== 24) doomed.push([key, rec])
      else if (rec.kind === 'box' && blockAt(key) !== 27) doomed.push([key, rec])
      else if (rec.kind === 'woodshop' && blockAt(key) !== 69 && blockAt(key) !== 70) doomed.push([key, rec])
    }
    const shops = new Set()
    let n = 0
    let parked = 0
    let first = ''
    const take = (item, count) => {
      if (item === skip) return
      const left = keep(item, count)
      if (count - left && !first) first = item
      if (left) parked += left
    }
    for (const [key, rec] of doomed) {
      if (!meta.has(key)) continue
      if (rec.kind === 'bunk') {
        const d = normalizeBed(rec)
        if (rec.restAt > 0) d.restAt = rec.restAt
        bedQueue.unshift(d)
        take('bunk', 1)
        meta.delete(key)
        n++
      } else if (rec.kind === 'vend') {
        for (const s of rec.slots || []) if (s && s.n) take(s.item, s.n)
        if (rec.till) wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
        take('vend', 1)
        meta.delete(key)
        n++
      } else if (rec.kind === 'box') {
        for (const s of rec.slots || []) if (s && s.n) take(s.item, s.n)
        take('box', 1)
        meta.delete(key)
        n++
      } else if (rec.kind === 'woodshop') {
        if (api.shopsReady && !api.shopsReady()) continue
        const anchor = rec.anchor || key
        if (shops.has(anchor)) { meta.delete(key); continue }
        if (blockAt(anchor) === 69 || blockAt(anchor) === 70) continue
        shops.add(anchor)
        const tools = api.shopWall ? api.shopWall(anchor) : []
        for (let i = 0; i < tools.length; i++) take(tools[i], 1)
        take('woodshop', 1)
        if (api.shopClear) api.shopClear(anchor)
        meta.delete(anchor)
        if (rec.pair) meta.delete(rec.pair)
        meta.delete(key)
        n++
      }
    }
    if (!n) return 0
    paintHotbar()
    paintChip()
    if (first || parked) api.toast(parked ? t('bagFull') : t('gotItem').replace('{item}', itemName(first)))
    return n
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
    recoverOrphans(h && h.type === 'place' ? h.item : '')
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
    recoverOrphans('')
  }
  function lostAdd(item, n, why) {
    if (!item || !(n > 0)) return
    const hit = lost.find((d) => d.item === item)
    if (hit) hit.n += n
    else lost.push({ item, n, why: why || 'aside' })
    if (api.markDirty) api.markDirty()
  }
  function tryCraft(name) {
    const r = RECIPES.find((x) => x.id === name || x.out[0] === name)
    if (!r) return { ok: false, why: 'missing' }
    if (r.id === 'bunk' && r.at === 'bench' && shopRules().required) return { ok: false, why: 'shop' }
    const stations = { bench: near('bench'), oven: near('oven'), smelter: near('smelter'), forge: near('forge'), fabricator: near('fabricator') }
    const st = craftStatus(r, bag, stations, mode !== 'survival')
    if (!st.ok) return { ok: false, why: st.gate || st.station || 'count', gate: st.gate || '' }
    if (!Rules.allow(null, 'core.craft', { id: r.id }).ok) {
      if (api.blocked) api.blocked('core.craft')
      else api.toast(Rules.why('core.craft'))
      return { ok: false, why: 'rule', ruleId: 'core.craft' }
    }
    const made = make(r, bag, hot)
    if (!made) return { ok: false, why: 'full' }
    markFound(r.out[0])
    if (made.pocket >= 0) sayPocket(r.out[0], made.pocket)
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
    for (const [k, v] of meta) m[k] = cloneRec(v)
    if (mode === 'survival') hotSlot.survival = hot
    return {
      player: {
        mode,
        bag: bags.survival.dump(),
        bagCreative: bags.creative.dump(),
        hot: hotSlot.survival,
        hotCreative: api.creativeHot ? api.creativeHot() : hotSlot.creative,
        home,
        bedQueue: bedQueue.map((d) => normalizeBed(d)),
        bestBed: bestBed ? normalizeBed(bestBed) : null,
        table: api.tableOn(),
        tray: { id: trayId, placed: trayPlaced.slice(), wool: trayWool.slice() },
        energy: { bolts: energy.bolts, acc: energy.acc, toasted: energy.toasted },
      },
      econ: wallet.dump(),
      meta: m,
      drops: ground.map((d) => ({ id: d.id, x: +d.x.toFixed(2), y: +d.y.toFixed(2), z: +d.z.toFixed(2), item: d.item, n: d.n, at: d.at })),
      lost: lost.map((d) => ({ item: d.item, n: d.n, why: d.why || 'ground' })),
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
    bedQueue = Array.isArray(p.bedQueue) ? p.bedQueue.map((d) => normalizeBed(d)) : []
    bestBed = p.bestBed && p.bestBed.stars >= 3 ? normalizeBed(p.bestBed) : null
    trayId = p.tray && typeof p.tray.id === 'string' ? p.tray.id : ''
    trayPlaced = p.tray && Array.isArray(p.tray.placed) ? p.tray.placed.map((n) => Math.max(0, n | 0)) : []
    trayWool = p.tray && Array.isArray(p.tray.wool) ? p.tray.wool.map((k) => (typeof k === 'string' ? k : '')) : []
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
    for (const [k, v] of Object.entries(doc.meta || {})) meta.set(k, cloneRec(v))
    day = wallet.state.day || day
    ground.length = 0
    lost.length = 0
    for (const d of doc.drops || []) {
      if (!d || !ITEMS[d.item] || !(d.n > 0)) continue
      ground.push({ id: d.id || ground.length + 1, x: +d.x || 0, y: +d.y || 0, z: +d.z || 0, item: d.item, n: d.n | 0, at: d.at || 0 })
      noteId(d.id || 0)
    }
    for (const d of doc.lost || []) if (d && ITEMS[d.item] && d.n > 0) lost.push({ item: d.item, n: d.n | 0, why: d.why === 'ground' || d.why === 'bag' || d.why === 'aside' ? d.why : 'aside' })
    for (const s of extra) if (s && ITEMS[s.item] && s.n > 0) {
      const hit = lost.find((d) => d.item === s.item && d.why === 'aside')
      if (hit) hit.n += s.n
      else lost.push({ item: s.item, n: s.n, why: 'aside' })
    }
    if (extra.length) api.toast(t('keptAside'))
    for (const s of bags.survival.slots) if (s) markFound(s.item)
    for (const s of bags.creative.slots) if (s) markFound(s.item)
    for (const item of (doc.econ && doc.econ.found) || []) markFound(item)
    paintChip()
    syncDig()
    paintEnergy()
    recoverOrphans('')
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
  function many(key) {
    const named = t(key + 'Many')
    if (named && named !== key + 'Many') return named
    const one = itemName(key)
    if (/[^aeiou]y$/i.test(one)) return one.slice(0, -1) + 'ies'
    if (/(s|sh|ch|x|z)$/i.test(one)) return one + 'es'
    return one + 's'
  }
  function lowerName(key) {
    const name = itemName(key)
    return name ? name.charAt(0).toLowerCase() + name.slice(1) : key
  }
  function hungerTip() {
    const meal = RECIPES.find((r) => r.at === 'oven' && r.out[0] === 'bread')
      || RECIPES.find((r) => r.at === 'oven' && FEED[r.out[0]])
    const from = meal && (meal.in.find(([k]) => k === 'flour') || meal.in[0])
    const bake = meal ? meal.out[0] : 'bread'
    const dough = from ? from[0] : 'flour'
    return t('hungryEat')
      .replace('{leaves}', lowerName('leaves'))
      .replace('{berries}', many(LEAF_FOOD))
      .replace('{bread}', itemName(bake))
      .replace('{flour}', itemName(dough))
      .replace('{oven}', itemName('oven'))
  }
  function sayHungry() {
    hungrySaid = true
    hungryWait = false
    ateSinceTip = false
    hungryAt = playedMs
    hungryN += 1
    api.toast(hungerTip())
  }
  function berryTip() {
    const how = document.body.classList.contains('touch') ? t('berryEatTouch') : t('berryEat')
    return t('berryDrop').replace('{berries}', many(LEAF_FOOD)).replace('{leaves}', lowerName('leaves')).replace('{how}', how)
  }
  function play(ms, force) {
    syncDig()
    if (!energyOn || mode !== 'survival') { paintEnergy(); return }
    if (!force && (paused || (typeof document !== 'undefined' && document.hidden))) return
    if (!(ms > 0) || energy.bolts <= 0) { paintEnergy(); return }
    const before = energy.bolts
    playedMs += ms
    energy.acc += ms
    while (energy.acc >= BOLT_MS && energy.bolts > 0) {
      energy.acc -= BOLT_MS
      energy.bolts -= 1
    }
    if (energy.bolts === 0) energy.acc = 0
    const crossed = before > 6 && energy.bolts <= 6
    if (crossed && !hungrySaid) sayHungry()
    else if (crossed && ateSinceTip) hungryWait = true
    if (hungryWait && energy.bolts <= 6 && playedMs - hungryAt >= HUNGRY_GAP) sayHungry()
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
        bolts: energy.bolts, acc: energy.acc, pace: pace(), dig: getDigSlow(), on: energyOn, lowN, hungryN, berryN,
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
  function setEnergy(n) {
    energy.bolts = Math.max(0, Math.min(10, n | 0))
    energy.acc = 0
    if (energy.bolts > 0) energy.toasted = false
    paintEnergy()
    return energy.bolts
  }
  function energyState() { return { bolts: energy.bolts, acc: energy.acc } }
  setInterval(() => { if (!paused && mode === 'survival' && ECON.townsfolk.on) vendTick(1) }, 30000)
  return {
    get bag() { return bag },
    bags: () => ({ survival: bags.survival.dump(), creative: bags.creative.dump() }), wallet, meta, paintBag, clearBagPick() { bagSel = -1 }, paintCraft, paintShop, paintWallet, paintSettings, paintTeacher, paintPrices, paintCounter, paintBunk, paintBox,
    give: (item, n) => giveItem(item, n || 1),
    trayDump() { return { id: trayId, placed: trayPlaced.slice(), wool: trayWool.slice() } },
    restoreTray(tray) {
      if (!tray || typeof tray !== 'object') return
      trayId = typeof tray.id === 'string' ? tray.id : ''
      trayPlaced = Array.isArray(tray.placed) ? tray.placed.map((n) => Math.max(0, n | 0)) : []
      trayWool = Array.isArray(tray.wool) ? tray.wool.map((k) => (typeof k === 'string' ? k : '')) : []
    },
    lostAdd,
    tryCraft,
    setCraftOpen(v) { craftOpen = !!v },
    focusCraft(id) { craftId = id || ''; craftOpen = true },
    lostItems: () => lost.map((d) => d.item + ':' + d.n),
    spend: (item, n) => { const ok = bag.take(item, n); if (ok) paintHotbar(); return ok },
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
      if (s && api.flash) api.flash(faceName(s.item))
      return ''
    },
    tryPlace: () => { const k = selectedItem(); if (slotMuted(k)) return false; const id = k && ITEMS[k] && ITEMS[k].block; return onPlace(1, 5, 1, id) },
    get hot() { return hot },
    onBreak, onPlace, beforeUndo, afterUndo, beforeRedo, afterRedo, vendTick, dump, load, setMode, paintChip, paintHotbar, selectedItem, pickup,
    recoverOrphans, bedDesigns: () => bedQueue.map((d) => normalizeBed(d)), park: (item, n) => keep(item, n || 1),
    get mode() { return mode }, set paused(v) { paused = v }, get home() { return home },
    shopRules, giveBed, bestBed: () => bestBed ? { ...bestBed } : null, setEnergy, energyState,
    setDay(iso) { day = iso; wallet.state.day = iso; wallet.state.soldToday = {}; for (const rec of meta.values()) rec.visits = 0 },
    give(item, n) { giveItem(item, n) },
    seedCount(kind, x, y, z) { return kind === 'tuft' ? tuftSeedCount(x, y, z) : wheatSeedCount(x, y, z) },
    blockForHot() { const k = selectedItem(); if (!k || slotMuted(k)) return 0; return ITEMS[k] && ITEMS[k].block },
    toolTier() { const k = selectedItem(); return (k && ITEMS[k] && ITEMS[k].tool) || 'hand' },
    dropHeld, groundDrops: () => ground, clearLoose() { ground.length = 0; lost.length = 0 }, tickDrops,
    tryBuy(k) { const item = ITEMS[k]; return item ? buy(k, 1, quoteBuy(item, wallet.state.dial || 1, ECON)) : false },
    known: (k) => (wallet.state.found || []).includes(k),
    useHeld, selectOwned, holdItem, mountEnergy, isFood: isFoodItem,
  }
}
