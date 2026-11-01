// Sync status chip. Mounts when sync is on: ?sync=1 in the URL, or the bt-sync sessionStorage flag that
// server-sync.js sets once sync has run, so the chip stays after a navigation without the query. DOM, aria-live polite.
// States: Saved to school / Saving… / Offline — saved here / Not signed in.

import { flagOn } from './sync-flag.js'

const WHO = 'https://tw.kulibert.net/api/who'

let chip = null
let live = null
let current = 'idle'
let retry = null
let wrap = null
let retryFn = null

async function signedIn() {
  try {
    const res = await fetch(WHO, { credentials: 'include' })
    if (!res.ok) return false
    const json = await res.json()
    return !!(json && json.verified)
  } catch (e) { return false }
}

function setText(state, text) {
  if (!chip || !live) return
  current = state
  live.textContent = text
  chip.setAttribute('aria-label', text)
  const icon = chip.querySelector('.bt-sync-icon')
  if (icon) icon.textContent = state === 'offline' ? '☁' : (state === 'saving' ? '↻' : (state === 'failed' ? '⚠' : '☁'))
  if (retry) retry.style.display = state === 'failed' ? 'flex' : 'none'
  place()
}

function explain() {
  const lines = {
    saved: 'Your world is copied to the school server.',
    saving: 'Copying your world to the school server…',
    offline: 'You are offline. The world is saved on this Chromebook.',
    nosign: 'Sign in to keep a school copy.',
    failed: 'Your world is saved on this Chromebook. We could not copy it to the school server yet. Press Try again.',
  }
  const msg = lines[current] || lines.saved
  if (typeof window !== 'undefined' && window.alert) window.alert(msg)
}

// Sit inside the Tech Room bar band, in the free space, so the bar's Sign in button never covers the chip.
// One-row bar (wide): just left of Sign in. Two-row bar (phone): second row, left edge. No bar (Hub frame): the old corner.
function place() {
  try { placeNow() } catch (e) {}
}
function placeNow() {
  if (!wrap || typeof document === 'undefined') return
  const bar = document.querySelector('.kb-bar')
  const br = bar ? bar.getBoundingClientRect() : null
  if (!br || !br.height) {
    wrap.style.top = '12px'; wrap.style.right = '12px'; wrap.style.left = 'auto'
    return
  }
  if (br.height > 60) {
    wrap.style.top = Math.round(br.top + 54) + 'px'; wrap.style.left = '8px'; wrap.style.right = 'auto'
    return
  }
  const alias = bar.querySelector('.kb-alias')
  const ar = alias && !alias.hidden ? alias.getBoundingClientRect() : null
  const right = ar && ar.width ? Math.round(window.innerWidth - ar.left + 8) : 12
  wrap.style.top = Math.round(br.top + 2) + 'px'; wrap.style.right = right + 'px'; wrap.style.left = 'auto'
}

let watching = false
function watchBar() {
  if (watching || typeof window === 'undefined') return
  watching = true
  window.addEventListener('resize', place)
  window.addEventListener('orientationchange', place)
  window.addEventListener('load', place)
  try {
    // the bar is drawn after us on some pages, and changes height when it wraps
    new MutationObserver(place).observe(document.body, { childList: true })
    const bar = document.querySelector('.kb-bar')
    if (bar && typeof ResizeObserver !== 'undefined') new ResizeObserver(place).observe(bar)
  } catch (e) {}
  setTimeout(place, 400)
  setTimeout(place, 1500)
}

export function mountSyncChip() {
  if (!flagOn() || typeof document === 'undefined' || chip) return
  chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'bt-sync-chip'
  chip.style.cssText = 'background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:999px;padding:10px 16px;font:14px/1.2 system-ui,sans-serif;min-height:44px;min-width:44px;display:flex;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;'
  chip.innerHTML = '<span class="bt-sync-icon" aria-hidden="true">☁</span><span class="bt-sync-live" aria-live="polite"></span>'
  live = chip.querySelector('.bt-sync-live')
  chip.addEventListener('click', explain)
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explain() } })
  wrap = document.createElement('div')
  wrap.className = 'bt-sync-wrap'
  wrap.style.cssText = 'position:fixed;top:12px;right:12px;z-index:92;display:flex;align-items:center;gap:6px;'
  wrap.appendChild(chip)
  retry = document.createElement('button')
  retry.type = 'button'
  retry.className = 'bt-sync-retry'
  retry.setAttribute('aria-label', 'Try again')
  retry.style.cssText = 'background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:999px;padding:10px 16px;font:14px/1.2 system-ui,sans-serif;min-height:44px;min-width:44px;display:none;align-items:center;gap:8px;cursor:pointer;white-space:nowrap;'
  retry.innerHTML = '<span aria-hidden="true">↻</span><span>Try again</span>'
  retry.addEventListener('click', () => { if (retryFn) retryFn() })
  wrap.appendChild(retry)
  document.body.appendChild(wrap)
  place()
  watchBar()
  signedIn().then(ok => {
    if (!ok) setText('nosign', 'Not signed in')
    else setText('saved', 'Saved to school')
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { if (current === 'offline') setText('saved', 'Saved to school') })
    window.addEventListener('offline', () => setText('offline', 'Offline — saved here'))
  }
}

// The sync code registers what the Try again button does.
export function onSyncRetry(fn) {
  retryFn = typeof fn === 'function' ? fn : null
}

export function getSyncState() {
  return current
}

export function setSyncState(state) {
  current = state
  if (!chip) return
  const texts = {
    saved: 'Saved to school',
    saving: 'Saving…',
    offline: 'Offline — saved here',
    nosign: 'Not signed in',
    failed: 'Not saved',
  }
  setText(state, texts[state] || texts.saved)
}
