// One spot for toasts and sticky hints. They take turns and stay off the HUD.
const GAP = 300
const TURN = 2400
const ACT_MS = 8000
const CAP = 4
const OBSTACLES = [
  'header.top', '#mode-pill', '#mode-chip', '.brand', '.tb-plate',
  '#day-clock', '#wallet-chip', '#game-menu', '#fs-btn', '#pause-btn', '#menu-btn',
  '#hotbar', '#held-chip', '#pick-chip', '#stick-pad', '#jump-col',
  '#wand-pill', '#use-pill', '#save-chip', '#inspect-chip', '#dig-chip',
  '#sheet', '#qol-bar', '#bot-code .bot-card', '#play-chip', '#rules-card', '#update-chip',
  '#kb-bar', '.kb-bar', '#kb-drawer', '#path-make', '#path-chip', '#menu-hint', '#qol-tip',
]

let toastQ = []
let holds = new Map()
let slot = null
let gapTimer = 0

function shown(el) {
  if (!el || el.hidden) return null
  const s = getComputedStyle(el)
  if (s.display === 'none' || s.visibility === 'hidden') return null
  if (s.opacity === '0' && el.id !== 'held-chip') return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null
  if (r.bottom <= 0 || r.right <= 0 || r.top >= window.innerHeight || r.left >= window.innerWidth) return null
  // Full-screen scrims (rules card) sit above the HUD. Don't park a tip on a control just because the scrim covers every spot.
  if (el.id !== 'sheet' && el.id !== 'hotbar' && r.width > window.innerWidth * 0.9 && r.height > window.innerHeight * 0.7) return null
  return r
}
function overlaps(a, b, pad) {
  const p = pad || 0
  return a.left < b.right + p && a.right > b.left - p && a.top < b.bottom + p && a.bottom > b.top - p
}
function obstacles(el) {
  const rects = []
  for (const sel of OBSTACLES) {
    let nodes
    try { nodes = document.querySelectorAll(sel) } catch (e) { continue }
    nodes.forEach((node) => {
      if (node === el || (el.contains && el.contains(node)) || (node.contains && node.contains(el))) return
      const r = shown(node)
      if (r) rects.push(r)
    })
  }
  return rects
}

function dockNarrowToast(el, sheet, tw, th) {
  const blocks = []
  const add = (node) => {
    if (!node || node === el || node.hidden) return
    const cs = getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = node.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) return
    if (r.bottom <= 0 || r.top >= window.innerHeight) return
    blocks.push(r)
  }
  const bar = sheet.querySelector('.sheet-bar')
  add(bar)
  add(document.getElementById('sheet-back'))
  add(document.getElementById('sheet-x'))
  add(document.getElementById('sheet-title'))
  add(document.getElementById('sheet-ver'))
  sheet.querySelectorAll('.crate-tab, .craft-tab, .well').forEach(add)
  add(document.querySelector('header.top'))
  add(document.querySelector('.kb-bar'))
  add(document.getElementById('pause-btn'))
  add(document.getElementById('fs-btn'))
  add(document.getElementById('hotbar'))
  const sheetR = sheet.getBoundingClientRect()
  const hits = (l, t) => blocks.some((b) => l < b.right + 8 && l + tw > b.left - 8 && t < b.bottom + 8 && t + th > b.top - 8)
  const onScreen = (l, t) => l >= 4 && t >= 4 && l + tw <= window.innerWidth - 4 && t + th <= window.innerHeight - 4
  const clearOfSheet = (l, t) => {
    const dx = Math.max(sheetR.left - (l + tw), l - sheetR.right)
    const dy = Math.max(sheetR.top - (t + th), t - sheetR.bottom)
    if (dx < 0 && dy < 0) return false
    const gap = dx < 0 ? dy : dy < 0 ? dx : Math.hypot(dx, dy)
    return gap >= 8
  }
  const lefts = [8, Math.round(Math.max(8, (window.innerWidth - tw) / 2))]
  const hot = document.getElementById('hotbar')
  let hotR = null
  if (hot && !hot.hidden) {
    const cs = getComputedStyle(hot)
    if (cs.display !== 'none' && cs.visibility !== 'hidden') hotR = hot.getBoundingClientRect()
  }
  const floor = bar ? Math.round(bar.getBoundingClientRect().bottom + 8) : 8
  const candidates = []
  if (hotR && hotR.height > 8 && hotR.top > floor) {
    const t = Math.round(hotR.top - 8 - th)
    for (const l of lefts) candidates.push([l, t])
  }
  const below = Math.round(sheetR.bottom + 8)
  for (const l of lefts) candidates.push([l, below])
  let pick = null
  for (const pair of candidates) {
    if (onScreen(pair[0], pair[1]) && !hits(pair[0], pair[1]) && clearOfSheet(pair[0], pair[1])) { pick = pair; break }
  }
  if (!pick) {
    const start = hotR ? Math.round(hotR.top - 8 - th) : window.innerHeight - th - 8
    for (let t = start; t >= floor && !pick; t -= 8) {
      for (const l of lefts) {
        if (onScreen(l, t) && !hits(l, t) && clearOfSheet(l, t)) { pick = [l, t]; break }
      }
    }
  }
  if (!pick) {
    const start = hotR ? Math.round(hotR.top - 8 - th) : window.innerHeight - th - 8
    for (let t = start; t >= floor && !pick; t -= 8) {
      for (const l of lefts) {
        if (onScreen(l, t) && !hits(l, t)) { pick = [l, t]; break }
      }
    }
  }
  if (!pick) {
    let t = hotR ? Math.round(hotR.top - 8 - th) : floor
    if (t < floor) t = floor
    if (t + th > window.innerHeight - 4) t = Math.max(floor, window.innerHeight - 4 - th)
    pick = [lefts[0], t]
  }
  el.style.setProperty('left', Math.round(pick[0]) + 'px', 'important')
  el.style.setProperty('top', Math.round(pick[1]) + 'px', 'important')
  el.dataset.sheetDock = '1'
  el.style.pointerEvents = el.querySelector('button, .toast-hold') ? 'auto' : 'none'
  return true
}
function sheetToastDock(el) {
  if (!el || (el.id !== 'toast' && el.id !== 'qol-tip')) return false
  const sheet = document.getElementById('sheet')
  if (!sheet || sheet.hidden) return false
  const panel = sheet.dataset.panel || ''
  if (!panel || panel === 'tour') return false
  const sheetR = sheet.getBoundingClientRect()
  if (sheetR.width < 8 || sheetR.height < 8) return false
  el.style.zIndex = '70'
  el.style.setProperty('position', 'fixed', 'important')
  el.style.setProperty('transform', 'none', 'important')
  el.style.setProperty('right', 'auto', 'important')
  el.style.setProperty('bottom', 'auto', 'important')
  el.style.setProperty('margin', '0', 'important')
  el.style.setProperty('width', 'max-content', 'important')
  el.style.setProperty('max-width', 'min(420px, calc(100vw - 16px))', 'important')
  const box = el.getBoundingClientRect()
  const tw = Math.min(Math.max(box.width || 160, 96), window.innerWidth - 16)
  const th = Math.max(box.height || 36, 32)
  if (window.innerWidth < 700) return dockNarrowToast(el, sheet, tw, th)
  const blocks = []
  const add = (node) => {
    if (!node || node === el || node.hidden) return
    const cs = getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = node.getBoundingClientRect()
    if (r.width < 4 || r.height < 4) return
    if (r.bottom <= 0 || r.top >= window.innerHeight) return
    blocks.push(r)
  }
  add(sheet)
  sheet.querySelectorAll('.sheet-bar, #sheet-body, #sheet-x, #sheet-back, .crate-tab, .craft-tab').forEach(add)
  add(document.querySelector('header.top'))
  add(document.querySelector('.kb-bar'))
  add(document.getElementById('pause-btn'))
  add(document.getElementById('fs-btn'))
  add(document.getElementById('hotbar'))
  const hits = (l, t) => blocks.some((b) => l < b.right + 8 && l + tw > b.left - 8 && t < b.bottom + 8 && t + th > b.top - 8)
  const onScreen = (l, t) => l >= 4 && t >= 4 && l + tw <= window.innerWidth - 4 && t + th <= window.innerHeight - 4
  const above = Math.round(sheetR.top - 8 - th)
  const candidates = [
    [Math.round(Math.max(8, sheetR.left)), above],
    [Math.round(Math.max(8, (window.innerWidth - tw) / 2)), above],
    [8, above],
    [Math.round(sheetR.right + 8), Math.max(8, Math.round(sheetR.top))],
    [Math.round(sheetR.left - 8 - tw), Math.max(8, Math.round(sheetR.top))],
    [Math.round(sheetR.right + 8), Math.max(8, Math.round(sheetR.top + 8))],
  ]
  let pick = null
  for (const pair of candidates) {
    if (onScreen(pair[0], pair[1]) && !hits(pair[0], pair[1])) { pick = pair; break }
  }
  if (!pick) {
    const step = 16
    for (let t = 8; t <= window.innerHeight - th - 8 && !pick; t += step) {
      const lefts = [8, Math.round(sheetR.right + 8), Math.round(window.innerWidth - tw - 8), Math.round(sheetR.left)]
      for (const l of lefts) {
        if (onScreen(l, t) && !hits(l, t)) { pick = [l, t]; break }
      }
    }
  }
  if (!pick) {
    let t = Math.round(sheetR.top - 8 - th)
    let l = Math.round(Math.max(8, Math.min(sheetR.left, window.innerWidth - tw - 8)))
    if (t < 0) t = 0
    pick = [l, t]
  }
  el.style.setProperty('left', Math.round(pick[0]) + 'px', 'important')
  el.style.setProperty('top', Math.round(pick[1]) + 'px', 'important')
  el.dataset.sheetDock = '1'
  el.style.pointerEvents = el.querySelector('button, .toast-hold') ? 'auto' : 'none'
  return true
}
function barBand() {
  const bars = []
  const controls = []
  const consider = (node, bucket) => {
    if (!node || node.hidden) return
    const cs = getComputedStyle(node)
    if (cs.display === 'none' || cs.visibility === 'hidden') return
    const r = node.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) return
    if (r.bottom <= 0 || r.top >= window.innerHeight) return
    bucket.push(r)
  }
  const hot = document.getElementById('hotbar')
  if (hot) {
    consider(hot, bars)
    hot.querySelectorAll('.slot, .bag-tile').forEach((node) => consider(node, bars))
  }
  consider(document.getElementById('wand-pill'), bars) // 2.5.400: the wand's Elegir/✓/X bar sits above the hotbar; toasts and the keys line go above it, not on it
  consider(document.getElementById('pause-btn'), controls)
  consider(document.getElementById('fs-btn'), controls)
  return { bars, controls }
}
// Keep a toast fully above the live hotbar and Bag, and off Pause / Full screen.
export function pinAboveBar(el) {
  if (!el || el.hidden || el.dataset.sheetDock === '1') return false
  el.style.setProperty('position', 'fixed', 'important')
  el.style.setProperty('transform', 'none', 'important')
  el.style.setProperty('bottom', 'auto', 'important')
  el.style.setProperty('right', 'auto', 'important')
  el.style.setProperty('margin', '0', 'important')
  const wide = el.classList && el.classList.contains('keys')
  el.style.setProperty('width', 'max-content', 'important')
  el.style.setProperty('max-width', wide ? 'min(880px, calc(100vw - 16px))' : 'min(420px, calc(100vw - 16px))', 'important')
  const box = el.getBoundingClientRect()
  const w = Math.min(Math.max(box.width || 140, 96), window.innerWidth - 16)
  const h = Math.max(box.height || 36, 32)
  const { bars, controls } = barBand()
  if (!bars.length) return false
  const ceil = Math.min.apply(null, bars.map((r) => r.top)) - 8
  let top = Math.round(ceil - h)
  if (top < 8) top = 8
  let left = Math.round((window.innerWidth - w) / 2)
  if (left < 8) left = 8
  if (left + w > window.innerWidth - 8) left = Math.max(8, Math.round(window.innerWidth - 8 - w))
  const hit = (x, y, list) => list.some((b) => x < b.right + 8 && x + w > b.left - 8 && y < b.bottom + 8 && y + h > b.top - 8)
  if (hit(left, top, controls)) {
    const blockers = controls.filter((b) => top < b.bottom + 8 && top + h > b.top - 8)
    if (blockers.length) {
      const gapL = Math.min.apply(null, blockers.map((b) => b.left)) - w - 8
      const gapR = Math.max.apply(null, blockers.map((b) => b.right)) + 8
      if (gapL >= 8) left = Math.round(gapL)
      else if (gapR + w <= window.innerWidth - 8) left = Math.round(gapR)
    }
  }
  if (bars.length && top + h > ceil + 0.5) top = Math.max(8, Math.round(ceil - h))
  if (wide) {
    const crowd = []
    for (const sel of ['#stick-pad', '#jump-col', '#path-chip', '#play-chip', '#toast', '#qol-tip', '#dig-chip', '#suit-bar']) {
      const node = document.querySelector(sel)
      if (!node || node.hidden) continue
      const r = node.getBoundingClientRect()
      if (r.width < 8 || r.height < 8) continue
      crowd.push(r)
    }
    for (let n = 0; n < 8; n++) {
      const over = crowd.find((b) => left < b.right - 2 && left + w > b.left + 2 && top < b.bottom - 2 && top + h > b.top + 2)
      if (!over) break
      const up = Math.round(over.top - 8 - h)
      if (up >= 8 && up < top) top = up
      else break
    }
  }
  el.style.setProperty('left', Math.round(left) + 'px', 'important')
  el.style.setProperty('top', Math.round(top) + 'px', 'important')
  return true
}
function keepClear() {
  const pause = document.getElementById('pause-btn')
  const pr = shown(pause)
  if (!pr) return
  const sheet = document.getElementById('sheet')
  const sheetOpen = !!(sheet && !sheet.hidden && sheet.dataset.panel !== 'tour')
  for (const sel of ['#toast', '#menu-hint', '#qol-tip', '#path-chip', '#play-chip']) {
    const el = document.querySelector(sel)
    if (!el || el.dataset.sheetDock === '1') continue
    if (sheetOpen && el.id === 'toast') continue
    const r = shown(el)
    if (!r || !overlaps(r, pr, 8)) continue
    const below = Math.round(pr.bottom + 8)
    const hot = document.querySelector('#hotbar')
    const hr = shown(hot)
    if (!hr || below + r.height <= hr.top - 4) {
      el.style.setProperty('top', below + 'px', 'important')
      el.style.setProperty('bottom', 'auto', 'important')
      continue
    }
    const left = Math.round(pr.left - r.width - 8)
    if (left >= 8) {
      el.style.setProperty('left', left + 'px', 'important')
      el.style.setProperty('right', 'auto', 'important')
    }
  }
}
function settle(el) {
  let real = el.getBoundingClientRect()
  if (real.width < 2 || real.height < 2) return false
  for (let n = 0; n < 8; n++) {
    const hits = obstacles(el).filter((r) => overlaps(real, r, 4))
    if (!hits.length) { el.style.zIndex = '40'; return true }
    const below = Math.max(...hits.map((r) => r.bottom)) + 8
    if (below + real.height <= window.innerHeight - 8) {
      el.style.top = Math.round(below) + 'px'
      el.style.zIndex = '40'
      real = el.getBoundingClientRect()
      continue
    }
    const right = Math.max(...hits.map((r) => r.right)) + 8
    if (right + real.width <= window.innerWidth - 8) {
      el.style.left = Math.round(right) + 'px'
      el.style.zIndex = '40'
      real = el.getBoundingClientRect()
      continue
    }
    const left = Math.min(...hits.map((r) => r.left)) - real.width - 8
    if (left >= 8) {
      el.style.left = Math.round(left) + 'px'
      el.style.zIndex = '40'
      real = el.getBoundingClientRect()
      continue
    }
    el.style.zIndex = '26'
    return false
  }
  return true
}

export function placeTip(el, follow) {
  if (!el) return false
  armWatch()
  el.classList.remove('path-corner')
  el.classList.add('tip-dock')
  const toast = el.id === 'toast'
  el.style.position = 'fixed'
  el.style.right = 'auto'
  el.style.bottom = 'auto'
  el.style.transform = 'none'
  el.style.margin = '0'
  el.style.width = 'max-content'
  el.style.maxWidth = 'min(280px, calc(100vw - 24px))'
  el.style.zIndex = '40'
  el.dataset.sheetDock = ''
  if (!toast) el.style.pointerEvents = 'auto'
  el.hidden = false
  if ((toast || el.id === 'qol-tip') && sheetToastDock(el)) {
    try { el.dispatchEvent(new Event("tipmove")) } catch (e) {}
    if (!follow) {
      requestAnimationFrame(() => { if (el.isConnected && !el.hidden) placeTip(el, true) })
      setTimeout(() => { if (el.isConnected && !el.hidden) placeTip(el, true) }, 120)
    }
    return true
  }
  const measured = el.getBoundingClientRect()
  const w = Math.min(Math.max(measured.width || el.offsetWidth || 0, 120), window.innerWidth - 24)
  const h = Math.max(measured.height || el.offsetHeight || 0, 36)
  const rects = obstacles(el)
  const header = document.querySelector('header.top')
  const hb = header ? header.getBoundingClientRect().bottom : 48
  const xs = []
  const cx = Math.max(8, Math.round((window.innerWidth - w) / 2))
  xs.push(cx, 12, Math.max(8, window.innerWidth - w - 12))
  for (let x = 12; x <= window.innerWidth - w - 8; x += 36) xs.push(x)
  let pick = null
  for (let y = Math.max(8, hb + 8); y < window.innerHeight - h - 8; y += 8) {
    for (const x of xs) {
      const box = { left: x, top: y, right: x + w, bottom: y + h }
      if (rects.every((r) => !overlaps(box, r, 8))) { pick = { left: x, top: y }; break }
    }
    if (pick) break
  }
  if (!pick) {
    pick = { left: cx, top: Math.max(8, hb + 8) }
    el.style.zIndex = '26'
  }
  el.style.left = Math.round(pick.left) + 'px'
  el.style.top = Math.round(pick.top) + 'px'
  if (toast) el.style.pointerEvents = el.querySelector('button, .toast-hold') ? 'auto' : 'none'
  settle(el)
  keepClear()
  if (toast || el.id === 'qol-tip' || el.id === 'menu-hint' || el.id === 'dig-chip') pinAboveBar(el)
  const keysLine = document.querySelector('body > .keys')
  if (keysLine && el !== keysLine && keysLine.dataset.gone !== '1' && getComputedStyle(keysLine).display !== 'none') pinAboveBar(keysLine)
  try { el.dispatchEvent(new Event("tipmove")) } catch (e) {}
  if (!follow) {
    requestAnimationFrame(() => {
      if (el.isConnected && !el.hidden) placeTip(el, true)
    })
    setTimeout(() => {
      if (el.isConnected && !el.hidden) placeTip(el, true)
    }, 120)
    setTimeout(() => {
      if (el.isConnected && !el.hidden) placeTip(el, true)
    }, 500)
  }
  return true
}

function hideHold(id) {
  const rec = holds.get(id)
  if (rec && rec.el) rec.el.hidden = true
}
function parkDock(el) {
  el.classList.remove('tip-dock')
  el.style.position = ''
  el.style.left = ''
  el.style.top = ''
  el.style.right = ''
  el.style.bottom = ''
  el.style.width = ''
  el.style.maxWidth = ''
  el.style.transform = ''
  el.style.margin = ''
  el.style.zIndex = ''
}
function showHold(id) {
  const rec = holds.get(id)
  if (!rec) return false
  if (rec.still && !rec.still()) { holds.delete(id); return false }
  const el = rec.el
  if (!el || !el.isConnected) { holds.delete(id); return false }
  if (id === 'path') parkDock(el)
  else placeTip(el)
  el.hidden = false
  return true
}
function afterGap(fn) {
  clearTimeout(gapTimer)
  gapTimer = setTimeout(() => { gapTimer = 0; fn() }, GAP)
}
const TOAST_MS = 3000
function reducedMotion() {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
}
function fadeHide(el, done) {
  if (!el) { done(); return }
  if (reducedMotion()) { done(); return }
  el.style.setProperty('transition', 'opacity .35s linear', 'important')
  el.style.setProperty('opacity', '0', 'important')
  const token = (el._fade = (el._fade || 0) + 1)
  setTimeout(() => {
    if (el._fade !== token) return
    el.style.removeProperty('opacity')
    el.style.removeProperty('transition')
    done()
  }, 360)
}
function endToast(opts) {
  const el = document.getElementById('toast')
  const finish = () => {
    if (el) {
      el.hidden = true
      el.classList.remove('new-chip')
      el.classList.remove('nice-chip')
      el.classList.remove('toast-nudge')
      el.style.removeProperty('opacity')
      el.style.removeProperty('transition')
    }
    slot = null
    afterGap(pump)
  }
  if (slot && slot.timer) clearTimeout(slot.timer)
  if (opts && opts.fade && el && !el.hidden) fadeHide(el, finish)
  else finish()
}
function presentToast(job) {
  const el = document.getElementById('toast')
  if (!el) { slot = null; afterGap(pump); return }
  el.replaceChildren()
  el.classList.toggle('new-chip', !!job.chip)
  if (typeof job.fill === 'function') job.fill(el)
  if (job.text) el.append(document.createTextNode(job.text))
  if (job.act && job.act.label && job.act.run) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'toast-hold'
    b.textContent = job.act.label
    const run = job.act.run
    b.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      run()
      endToast()
    })
    el.append(b)
  }
  placeTip(el)
  el.dataset.born = String(Math.round(performance.now()))
  el.style.pointerEvents = 'auto'
  el.style.removeProperty('opacity')
  if (!el.dataset.toastTap) {
    el.dataset.toastTap = '1'
    el.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('button')) return
      e.preventDefault()
      endToast()
    })
  }
  el.classList.remove('toast-nudge')
  const ms = TOAST_MS
  slot = { kind: 'toast', id: job.id || '', text: job.text || '', timer: setTimeout(() => endToast({ fade: true }), ms) }
  lastLiveAt = performance.now()
  toastTrace('show', job.text || '')
}
function pump() {
  if (slot || gapTimer) return
  if (toastQ.length) {
    presentToast(toastQ.shift())
    return
  }
  for (const id of holds.keys()) {
    if (showHold(id)) {
      slot = { kind: 'hold', id, since: performance.now(), timer: 0, yielding: false }
      noteContention()
      return
    }
  }
}
function yieldHold() {
  if (!slot || slot.kind !== 'hold' || slot.yielding) return
  const others = toastQ.length > 0 || [...holds.keys()].some((id) => id !== slot.id)
  if (!others) return
  slot.yielding = true
  const waited = performance.now() - (slot.since || 0)
  const left = Math.max(GAP, TURN - waited)
  clearTimeout(slot.timer)
  slot.timer = setTimeout(() => {
    if (!slot || slot.kind !== 'hold') return
    const id = slot.id
    hideHold(id)
    const rec = holds.get(id)
    if (rec) { holds.delete(id); holds.set(id, rec) }
    slot = null
    afterGap(pump)
  }, left)
}
function noteContention() { yieldHold() }

const seenAt = new Map()
let lastLiveAt = 0
let lastNudgeAt = 0
function staffTestOn() {
  try {
    if (window.kwTest && window.kwTest.on && window.kwTest.on()) return true
    if (window.KulibertTest && window.KulibertTest.on && window.KulibertTest.on()) return true
  } catch (e) {}
  return false
}
function toastTrace(kind, text) {
  if (!staffTestOn()) return
  try { console.info('[toast] ' + kind + ' ' + (text || '')) } catch (e) {}
}
function motionLess() {
  try {
    if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
  } catch (e) {}
  return reducedMotion()
}
function sameToastOnScreen(text) {
  if (!text || !slot || slot.kind !== 'toast' || slot.text !== text) return false
  const el = document.getElementById('toast')
  return !!(el && !el.hidden)
}
function pingLive(el) {
  let node = null
  const kids = el.childNodes
  for (let i = 0; i < kids.length; i++) {
    const child = kids[i]
    if (child.nodeType === 3 && child.nodeValue && child.nodeValue.replace(/\u200B/g, '').length) {
      node = child
      break
    }
  }
  if (!node) return
  const base = node.nodeValue.replace(/\u200B/g, '')
  node.nodeValue = node.nodeValue.endsWith('\u200B') ? base : base + '\u200B'
}
function nudgeToast(el) {
  const now = performance.now()
  if (now - lastNudgeAt < 500) return
  lastNudgeAt = now
  el.classList.add('toast-nudge')
  clearTimeout(nudgeToast.t)
  nudgeToast.t = setTimeout(() => { if (el.isConnected) el.classList.remove('toast-nudge') }, 150)
  try {
    el.getAnimations().forEach((a) => { if (a.id === 'toast-nudge') a.cancel() })
    el.animate(
      [
        { transform: 'translateY(0px)' },
        { transform: 'translateY(-4px)', offset: 0.45 },
        { transform: 'translateY(0px)' },
      ],
      { duration: 150, easing: 'ease-out', composite: 'accumulate', id: 'toast-nudge' }
    )
  } catch (e) {}
}
function pulseSameToast(text) {
  const el = document.getElementById('toast')
  if (!el || !slot || slot.kind !== 'toast') return
  const now = performance.now()
  if (text) seenAt.set(text, now)
  el.hidden = false
  el.style.removeProperty('opacity')
  el.style.removeProperty('transition')
  el._fade = (el._fade || 0) + 1
  if (slot.timer) clearTimeout(slot.timer)
  slot.timer = setTimeout(() => endToast({ fade: true }), TOAST_MS)
  el.dataset.born = String(Math.round(now))
  if (now - lastLiveAt >= 2000) {
    lastLiveAt = now
    pingLive(el)
  }
  if (!motionLess()) nudgeToast(el)
  toastTrace('pulse', text || '')
}
export function showToast(msg, opts) {
  const o = opts || {}
  const job = {
    text: msg == null ? '' : String(msg),
    act: o.act && o.act.label && o.act.run ? o.act : null,
    ms: o.ms,
    id: o.id || '',
    chip: !!o.chip,
    step: o.step || '',
    fill: o.fill || null,
  }
  if (!job.text && !job.fill) return
  const now = performance.now()
  // Action toasts keep the old 6s anti-spam. A plain repeat pulses the one on screen.
  if (job.act) {
    if (job.text && seenAt.has(job.text) && now - seenAt.get(job.text) < 6000) return
  } else if (sameToastOnScreen(job.text)) {
    pulseSameToast(job.text)
    return
  }
  if (job.text) seenAt.set(job.text, now)
  if (toastQ.length && toastQ[toastQ.length - 1].text === job.text && !job.act) return
  if (slot && slot.kind === 'toast') {
    clearTimeout(slot.timer)
    slot = null
    presentToast(job)
    return
  }
  const queued = () => {
    if (job.id) {
      const i = toastQ.findIndex((row) => row.id && row.id === job.id)
      if (i >= 0) toastQ.splice(i, 1)
    }
    toastQ.push(job)
    if (toastQ.length > CAP) toastQ.shift()
  }
  if (slot && slot.kind === 'hold') { queued(); yieldHold(); return }
  if (slot || gapTimer) { queued(); return }
  presentToast(job)
}

export function holdTip(id, el, still) {
  if (!id || !el) return
  const prev = holds.get(id)
  holds.set(id, { el, still: still || (prev && prev.still) || null })
  if (slot && slot.kind === 'hold' && slot.id === id) {
    if (id === 'path') parkDock(el)
    else placeTip(el)
    el.hidden = false
    noteContention()
    return
  }
  if (slot || gapTimer) {
    el.hidden = true
    noteContention()
    return
  }
  if (showHold(id)) {
    slot = { kind: 'hold', id, since: performance.now(), timer: 0, yielding: false }
    noteContention()
  }
}

export function dropTip(id) {
  const rec = holds.get(id)
  holds.delete(id)
  if (rec && rec.el) rec.el.hidden = true
  if (slot && slot.kind === 'hold' && slot.id === id) {
    clearTimeout(slot.timer)
    slot = null
    afterGap(pump)
  }
}

function onResize() {
  if (onResize.arm) return
  onResize.arm = requestAnimationFrame(() => {
    onResize.arm = 0
    layoutTips()
  })
}
function layoutTips() {
  if (slot && slot.kind === 'toast') {
    const el = document.getElementById('toast')
    if (el && !el.hidden) placeTip(el, true)
  } else if (slot && slot.kind === 'hold') {
    const rec = holds.get(slot.id)
    if (rec && rec.el && !rec.el.hidden) placeTip(rec.el, true)
  }
  for (const id of ['qol-tip', 'dig-chip']) {
    const node = document.getElementById(id)
    if (node && !node.hidden && node.dataset.sheetDock !== '1') pinAboveBar(node)
  }
  const keys = document.querySelector('body > .keys')
  if (keys && keys.dataset.gone !== '1' && getComputedStyle(keys).display !== 'none') {
    const sheet = document.getElementById('sheet')
    if (!sheet || sheet.hidden) pinAboveBar(keys)
  }
}
function armWatch() {
  const watch = (node) => {
    if (!node || node.dataset.tipWatch) return
    node.dataset.tipWatch = '1'
    new MutationObserver(() => onResize()).observe(node, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] })
    if (window.ResizeObserver) new ResizeObserver(() => onResize()).observe(node)
  }
  for (const sel of ['#held-chip', '#hotbar', '#pick-chip', '#mode-pill', 'header.top', '#rules-card', '#sheet', '#path-chip', '#stick-pad', '#jump-col', '#play-chip', '#suit-bar']) {
    watch(document.querySelector(sel))
  }
}
if (document.body) armWatch()
else document.addEventListener('DOMContentLoaded', armWatch)
window.addEventListener('resize', onResize)
window.addEventListener('orientationchange', () => setTimeout(onResize, 50))
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize)
window.showToast = showToast
