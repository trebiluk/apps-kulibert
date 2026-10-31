// ?fps=1 only: small top-left readout under the top bar of fps and slowest-5% frame time. Off by default.
export function mountFpsOverlay() {
  let on = false
  try { on = /[?&]fps=1(&|$)/.test(location.search) } catch (e) {}
  if (!on) return
  const box = document.createElement('div')
  box.id = 'fps-overlay'
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:12px;top:120px;z-index:99999;padding:2px 6px;border-radius:6px;background:rgba(10,14,30,.85);color:#e8ecf4;font:600 11px/1.3 monospace;white-space:nowrap;pointer-events:none'
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
      // Top-left, just under the top bar, beside Goals: clear of Pause, Fullscreen, Suit and the hotbar.
      const bar = document.querySelector('.top')
      const goals = document.getElementById('goals-hud')
      const gr = goals && goals.getBoundingClientRect()
      const br = bar && bar.getBoundingClientRect()
      if (gr && gr.width) { box.style.left = Math.round(gr.right + 8) + 'px'; box.style.top = Math.round(gr.top) + 'px' }
      else if (br) { box.style.left = '12px'; box.style.top = Math.round(br.bottom + 4) + 'px' }
      box.textContent = (1000 / avg).toFixed(0) + ' fps · p95 ' + p95.toFixed(0) + 'ms'
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
