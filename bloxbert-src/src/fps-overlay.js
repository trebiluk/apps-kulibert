// ?fps=1 only: small corner readout of fps and slowest-5% frame time. Off by default.
export function mountFpsOverlay() {
  let on = false
  try { on = new URLSearchParams(location.search).get('fps') === '1' } catch (e) {}
  if (!on) return
  const box = document.createElement('div')
  box.id = 'fps-overlay'
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99999;padding:4px 8px;border-radius:6px;background:rgba(10,14,30,.85);color:#e8ecf4;font:600 13px/1.3 monospace;pointer-events:none'
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
      box.textContent = (1000 / avg).toFixed(0) + ' fps · p95 ' + p95.toFixed(1) + ' ms'
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
