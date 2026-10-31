// Sync status chip. Mounts when sync is on: ?sync=1 in the URL, or the bt-sync sessionStorage flag that
// server-sync.js sets once sync has run, so the chip stays after a navigation without the query. DOM, aria-live polite.
// States: Saved to school / Saving… / Offline — saved here / Not signed in.

const WHO = 'https://tw.kulibert.net/api/who'

let chip = null
let live = null
let current = 'idle'

function flagOn() {
  try {
    if (typeof location !== 'undefined' && /(?:\?|&)sync=1(?:&|$)/.test(location.search)) return true
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bt-sync') === '1') return true // same key server-sync.js persists
  } catch (e) {}
  return false
}

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
  if (icon) icon.textContent = state === 'offline' ? '☁' : (state === 'saving' ? '↻' : '☁')
}

function explain() {
  const lines = {
    saved: 'Your world is copied to the school server.',
    saving: 'Copying your world to the school server…',
    offline: 'You are offline. The world is saved on this Chromebook.',
    nosign: 'Sign in to keep a school copy.',
  }
  const msg = lines[current] || lines.saved
  if (typeof window !== 'undefined' && window.alert) window.alert(msg)
}

export function mountSyncChip() {
  if (!flagOn() || typeof document === 'undefined' || chip) return
  chip = document.createElement('button')
  chip.type = 'button'
  chip.className = 'bt-sync-chip'
  chip.style.cssText = 'position:fixed;top:12px;right:12px;z-index:40;background:#1e293b;color:#e2e8f0;border:1px solid #475569;border-radius:999px;padding:10px 16px;font:14px/1.2 system-ui,sans-serif;min-height:44px;min-width:44px;display:flex;align-items:center;gap:8px;cursor:pointer;'
  chip.innerHTML = '<span class="bt-sync-icon" aria-hidden="true">☁</span><span class="bt-sync-live" aria-live="polite"></span>'
  live = chip.querySelector('.bt-sync-live')
  chip.addEventListener('click', explain)
  chip.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); explain() } })
  document.body.appendChild(chip)
  signedIn().then(ok => {
    if (!ok) setText('nosign', 'Not signed in')
    else setText('saved', 'Saved to school')
  })
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => { if (current === 'offline') setText('saved', 'Saved to school') })
    window.addEventListener('offline', () => setText('offline', 'Offline — saved here'))
  }
}

export function setSyncState(state) {
  if (!chip) return
  const texts = {
    saved: 'Saved to school',
    saving: 'Saving…',
    offline: 'Offline — saved here',
    nosign: 'Not signed in',
  }
  setText(state, texts[state] || texts.saved)
}
