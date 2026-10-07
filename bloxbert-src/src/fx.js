// One motion helper for the Build Tray and the oven crate.
export function motionLess() {
  if (typeof document === 'undefined') return true
  if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
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
