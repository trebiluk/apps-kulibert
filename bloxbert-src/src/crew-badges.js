// Crew badges: Crew Medic (10 help-ups), Flanker (10 back hits), Foundry Crew. Alias only. Counts and ids save in the world doc.
const IDS = ['medic', 'flanker', 'foundry']
const GOAL = { medic: 10, flanker: 10, foundry: 1 }
const EN_NAME = { medic: 'Crew Medic', flanker: 'Flanker', foundry: 'Foundry Crew' }
let counts = { medic: 0, flanker: 0, foundry: 0 }
let earned = new Set()
let host = null
const queue = []
let showing = ''
let chipEl = null
let chipTimer = 0

function blank() {
  counts = { medic: 0, flanker: 0, foundry: 0 }
  earned = new Set()
}
function tr(key, fallback) {
  if (!host || !host.t) return fallback
  try {
    const v = host.t(key)
    if (v && v !== key) return v
  } catch (e) {}
  return fallback
}
function badgeName(id) {
  return tr('c4tBadge' + id, EN_NAME[id] || id)
}
function chipLine(id) {
  const name = badgeName(id)
  const tmpl = tr('bdgEarned', 'Badge earned: {name}')
  return String(tmpl).replace('{name}', name)
}
function clearChip() {
  if (chipTimer) { clearTimeout(chipTimer); chipTimer = 0 }
  if (chipEl && chipEl.remove) chipEl.remove()
  chipEl = null
  showing = ''
  if (host && host.capLane) host.capLane()
}
function paintChip(id) {
  showing = id
  const el = document.createElement('div')
  el.setAttribute('role', 'status')
  el.dataset.badge = id
  const medal = document.createElement('span')
  medal.setAttribute('aria-hidden', 'true')
  medal.textContent = '🏅'
  const text = document.createElement('span')
  text.dir = 'auto'
  text.textContent = chipLine(id)
  el.append(medal, text)
  el.style.cssText = 'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px;max-width:100%;box-sizing:border-box;background:#1e3a8a;color:#fff;padding:8px 14px;border-radius:10px;font-weight:700;font-size:16px;font-family:inherit;line-height:1.3;text-align:center;pointer-events:none;overflow-wrap:anywhere'
  text.style.overflowWrap = 'anywhere'
  text.style.minWidth = '0'
  if (host && host.laneAdd) host.laneAdd(el, 4)
  else document.body.append(el)
  chipEl = el
  chipTimer = setTimeout(advanceChip, 4000)
}
function advanceChip() {
  chipTimer = 0
  if (chipEl && chipEl.remove) chipEl.remove()
  chipEl = null
  showing = ''
  const next = queue.shift()
  if (next) paintChip(next)
}
function showChip(id) {
  try {
    if (typeof document === 'undefined' || !document.createElement || !document.body) return
    if (showing) {
      if (queue.length < 3) queue.push(id)
      return
    }
    paintChip(id)
  } catch (e) {}
}
export function earnChip(id) {
  if (IDS.indexOf(id) < 0) return false
  if (earned.has(id)) return false
  earned.add(id)
  showChip(id)
  if (host && host.markDirty) host.markDirty()
  return true
}
export function bumpMedic() {
  if (counts.medic >= 10) return
  counts.medic += 1
  if (counts.medic >= 10) earnChip('medic')
}
export function bumpFlanker() {
  if (counts.flanker >= 10) return
  counts.flanker += 1
  if (counts.flanker >= 10) earnChip('flanker')
}
export function bumpFoundry() {
  if ((counts.foundry || 0) < 1) counts.foundry = 1
  earnChip('foundry')
}
export function setHost(h) {
  host = h && typeof h === 'object' ? h : null
}
export function dump() {
  return {
    v: 1,
    counts: { medic: counts.medic | 0, flanker: counts.flanker | 0, foundry: counts.foundry | 0 },
    earned: IDS.filter((id) => earned.has(id)),
  }
}
function clampCount(id, raw) {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return 0
  const max = id === 'foundry' ? 1 : 10
  if (raw < 0) return 0
  if (raw > max) return max
  return raw
}
export function load(src) {
  clearChip()
  queue.length = 0
  blank()
  try {
    if (!src || typeof src !== 'object' || src.v !== 1) return
    const c = src.counts
    if (c && typeof c === 'object') {
      for (const id of IDS) counts[id] = clampCount(id, c[id])
    }
    const got = new Set()
    if (Array.isArray(src.earned)) {
      for (const id of src.earned) if (IDS.indexOf(id) >= 0) got.add(id)
    }
    for (const id of IDS) {
      if (got.has(id) && counts[id] < GOAL[id]) counts[id] = GOAL[id]
      if (counts[id] >= GOAL[id]) got.add(id)
      else got.delete(id)
    }
    earned = got
  } catch (e) {
    blank()
  }
}
export function badgeList() {
  return IDS.map((id) => {
    const n = counts[id] || 0
    const m = GOAL[id]
    const done = earned.has(id)
    let progress
    if (!host || !host.t) {
      progress = id === 'foundry' ? (done ? 'yes' : 'not yet') : n + '/' + m
    } else if (done) {
      progress = tr('bdgDone', 'Done')
    } else {
      progress = tr('bdgProgress', '{n} of {m}').replace('{n}', String(n)).replace('{m}', String(m))
    }
    return { id, name: badgeName(id), progress, earned: done }
  })
}

try { window.bumpMedic = bumpMedic } catch (e) {}
try { window.bumpFlanker = bumpFlanker } catch (e) {}
try { window.bumpFoundry = bumpFoundry } catch (e) {}
try { window.badgeList = badgeList } catch (e) {}
