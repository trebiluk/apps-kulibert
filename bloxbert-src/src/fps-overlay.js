// ?fps=1 only: small top-right readout of fps and slowest-5% frame time. Off by default.
export function mountFpsOverlay() {
  let on = false
  try { on = /[?&]fps=1(&|$)/.test(location.search) } catch (e) {}
  if (!on) return
  const box = document.createElement('div')
  box.id = 'fps-overlay'
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;right:12px;top:120px;z-index:99999;padding:4px 8px;border-radius:6px;background:rgba(10,14,30,.85);color:#e8ecf4;font:600 13px/1.3 monospace;pointer-events:none'
  document.body.append(box)
  const times = []
  let last = performance.now()
  let shown = last
  const frame = (now) => {
    times.push(now - last)
    last = now
    if (times.length > 240) times.shift()
    if (now - shown > 500 && times.length > 10) {
      shown = now
      const sorted = times.slice().sort((a, b) => a - b)
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
      const p95 = sorted[Math.floor(sorted.length * 0.95)]
      // Sit just under Fullscreen (top-right) so it never covers the hotbar or bag slot.
      const fs = document.getElementById('fs-btn')
      const r = fs && fs.getBoundingClientRect()
      if (r && r.height) box.style.top = Math.round(r.bottom + 8) + 'px'
      box.textContent = (1000 / avg).toFixed(0) + ' fps · p95 ' + p95.toFixed(1) + ' ms'
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
