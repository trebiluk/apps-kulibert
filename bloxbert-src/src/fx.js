// One motion helper for the Build Tray and the oven crate.
let reduceQuery = null
// BN-21: read live every time, so a Hub change, Bertopia's Gentle Mode or the OS setting applies mid-game.
export function motionLess() {
  if (typeof document === 'undefined') return true
  const el = document.documentElement
  if (el.getAttribute('data-kp-motion') === 'less') return true // the Hub's "less motion" (kulibert-prefs.js)
  if (el.getAttribute('data-bt-gentle') === '1') return true // Bertopia's own Gentle Mode, this game only
  try {
    if (!reduceQuery) reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)') // one query; .matches stays live
    return reduceQuery.matches
  } catch (e) { return false }
}

function fade(el) {
  const t0 = performance.now()
  const step = (now) => {
    const p = Math.min(1, (now - t0) / 120)
    el.style.opacity = String(0.35 + 0.65 * p)
    if (p < 1) requestAnimationFrame(step)
    else el.style.opacity = ''
  }
  el.style.opacity = '0.35'
  requestAnimationFrame(step)
}

export function fx(el, name, delayMs) {
  if (!el) return
  if (motionLess()) { fade(el); return }
  el.classList.remove('fx-' + name)
  el.style.animationDelay = delayMs ? delayMs + 'ms' : ''
  void el.offsetWidth
  el.classList.add('fx-' + name)
}
