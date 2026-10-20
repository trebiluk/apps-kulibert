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

function sheetToastDock(el) {
  if (!el || el.id !== 'toast') return false
  const sheet = document.getElementById('sheet')
  if (!sheet || sheet.hidden) return false
  const panel = sheet.dataset.panel || ''
  if (panel !== 'crafting' && panel !== 'inventory') return false
  const bar = sheet.querySelector('.sheet-bar')
  if (!bar) return false
  const r = bar.getBoundingClientRect()
  if (r.width < 8 || r.height < 8) return false
  const room = Math.max(96, r.width - 88)
  el.style.zIndex = '70'
  el.style.setProperty('position', 'fixed', 'important')
  el.style.setProperty('transform', 'none', 'important')
  el.style.setProperty('right', 'auto', 'important')
  el.style.setProperty('bottom', 'auto', 'important')
  el.style.setProperty('margin', '0', 'important')
  el.style.setProperty('max-width', room + 'px', 'important')
  el.style.setProperty('width', 'max-content', 'important')
  const box = el.getBoundingClientRect()
  const tw = Math.min(box.width || 160, room)
  const th = Math.max(box.height || 36, 36)
  const left = Math.round(Math.max(r.left + 8, Math.min(r.left + 8, r.right - tw - 72)))
  let top = Math.round(r.bottom - th)
  if (th <= r.height - 2) top = Math.round(r.top + Math.max(0, (r.height - th) / 2))
  if (top + th > r.bottom) top = Math.round(r.bottom - th)
  el.style.setProperty('left', left + 'px', 'important')
  el.style.setProperty('top', top + 'px', 'important')
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
  el.style.setProperty('width', 'max-content', 'important')
  el.style.setProperty('max-width', 'min(420px, calc(100vw - 16px))', 'important')
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
  if (toast && sheetToastDock(el)) {
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
function endToast() {
  const el = document.getElementById('toast')
  if (el) {
    el.hidden = true
    el.classList.remove('new-chip')
  }
  slot = null
  afterGap(pump)
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
  const ms = job.ms || (job.chip ? 2000 : (job.act ? ACT_MS : TURN))
  slot = { kind: 'toast', id: job.id || '', text: job.text || '', timer: setTimeout(endToast, ms) }
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
  if (slot && slot.kind === 'toast' && slot.text === job.text && !job.act) return
  if (toastQ.length && toastQ[toastQ.length - 1].text === job.text && !job.act) return
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
}
function armWatch() {
  const watch = (node) => {
    if (!node || node.dataset.tipWatch) return
    node.dataset.tipWatch = '1'
    new MutationObserver(() => onResize()).observe(node, { attributes: true, attributeFilter: ['hidden', 'class', 'style'] })
    if (window.ResizeObserver) new ResizeObserver(() => onResize()).observe(node)
  }
  for (const sel of ['#held-chip', '#hotbar', '#pick-chip', '#mode-pill', 'header.top', '#rules-card', '#sheet']) {
    watch(document.querySelector(sel))
  }
}
if (document.body) armWatch()
else document.addEventListener('DOMContentLoaded', armWatch)
window.addEventListener('resize', onResize)
window.addEventListener('orientationchange', () => setTimeout(onResize, 50))
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize)
window.showToast = showToast
