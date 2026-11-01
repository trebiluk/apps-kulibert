// ?fps=1 only: small top-left readout under the top bar of fps and slowest-5% frame time. Off by default.
// 2.5.587 frame budget: per-system ms rows (60-frame average and worst frame). Nothing leaves the device.
const ON = (() => { try { return /[?&]fps=1(&|$)/.test(location.search) } catch (e) { return false } })()
const N = 6 // chunks, belts, mobs, hud, render, total
const noop = () => {}
const acc = new Float64Array(N)
const open = new Float64Array(N)
// Timing hooks for main.js. Off: no-op functions, so hot paths pay one empty call and no branch.
export const fb = { s: noop, e: noop }
if (ON) {
  fb.s = (i) => { open[i] = performance.now() }
  fb.e = (i) => { acc[i] += performance.now() - open[i] }
}
// Row labels in every pack + Simple. Kept short so the box fits at 412 wide.
const LABELS = {
  en: ['chunks', 'belts', 'mobs', 'HUD', 'render', 'total', 'avg', 'worst'],
  simple: ['chunks', 'belts', 'mobs', 'HUD', 'draw', 'all', 'avg', 'worst'],
  uk: ['чанки', 'стрічки', 'моби', 'HUD', 'рендер', 'разом', 'сер', 'макс'],
  ru: ['чанки', 'ленты', 'мобы', 'HUD', 'рендер', 'всего', 'ср', 'макс'],
  es: ['bloques', 'cintas', 'bichos', 'HUD', 'dibujo', 'total', 'media', 'peor'],
  ar: ['القطع', 'السيور', 'الكائنات', 'HUD', 'الرسم', 'المجموع', 'متوسط', 'أسوأ'],
  'fa-AF': ['تکه‌ها', 'تسمه‌ها', 'جانوران', 'HUD', 'رسم', 'جمع', 'میانه', 'بدترین'],
  rw: ['ibice', 'imikandara', 'inyamaswa', 'HUD', 'gushushanya', 'byose', 'impuzandengo', 'bibi'],
  ti: ['ክፋላት', 'ቀበቶታት', 'እንስሳ', 'HUD', 'ስእሊ', 'ድምር', 'ማእከላይ', 'ዝኸፍአ'],
}
function wrap(obj, name, i) {
  const fn = obj && obj[name]
  if (typeof fn !== 'function') return
  obj[name] = function () { const t0 = performance.now(); try { return fn.apply(this, arguments) } finally { acc[i] += performance.now() - t0 } }
}
export function mountFpsOverlay(noa) {
  if (!ON) return
  // Engine-side brackets, installed only with ?fps=1: chunk create/remove and deferred remesh count as chunks; the scene draw is render.
  if (noa) { wrap(noa.world, 'tick', 0); wrap(noa.rendering, 'tick', 0); wrap(noa.rendering, 'render', 4) }
  const box = document.createElement('div')
  box.id = 'fps-overlay'
  box.setAttribute('aria-hidden', 'true')
  box.style.cssText = 'position:fixed;left:12px;top:120px;z-index:35;padding:3px 7px;border-radius:6px;background:rgba(10,14,30,.85);color:#e8ecf4;font:600 12px/1.35 monospace;white-space:pre;pointer-events:none'
  document.body.append(box)
  const times = []
  const hist = [] // last 60 frames of per-system ms
  let last = performance.now()
  let shown = last
  const frame = (now) => {
    times.push(now - last)
    last = now
    if (times.length > 240) times.shift()
    let sum = 0
    const row = new Float64Array(N)
    for (let i = 0; i < N - 1; i++) { row[i] = acc[i]; sum += acc[i]; acc[i] = 0 }
    row[N - 1] = sum
    hist.push(row)
    if (hist.length > 60) hist.shift()
    if (now - shown > 500 && times.length > 10) {
      shown = now
      const sorted = times.slice().sort((a, b) => a - b)
      const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length
      const p95 = sorted[Math.floor(sorted.length * 0.95)]
      const L = LABELS[document.documentElement.lang] || LABELS.en
      const w = Math.max(...L.slice(0, N).map((s) => s.length))
      let text = (1000 / avg).toFixed(0) + ' fps · p95 ' + p95.toFixed(0) + 'ms\n' + ''.padEnd(w) + ' ' + L[6].padStart(6) + ' ' + L[7].padStart(6)
      for (let i = 0; i < N; i++) {
        let a = 0, m = 0
        for (const r of hist) { a += r[i]; if (r[i] > m) m = r[i] }
        a /= hist.length
        text += '\n' + L[i].padEnd(w) + ' ' + a.toFixed(2).padStart(6) + ' ' + m.toFixed(1).padStart(6)
      }
      box.textContent = text + '  ms'
      // Top-left, just under the top bar, beside Goals: clear of Pause, Fullscreen, Suit and the hotbar.
      const bar = document.querySelector('.top')
      const goals = document.getElementById('goals-hud')
      const gr = goals && goals.getBoundingClientRect()
      const br = bar && bar.getBoundingClientRect()
      if (gr && gr.width) { box.style.left = Math.round(gr.right + 8) + 'px'; box.style.top = Math.round(gr.top) + 'px' }
      else if (br) { box.style.left = '12px'; box.style.top = Math.round(br.bottom + 4) + 'px' }
      // Slide right past anything it would sit on (Suit pill on sideways phones, the quest card).
      for (let k = 0; k < 4; k++) {
        const me = box.getBoundingClientRect()
        let hit = null
        for (const id of ['suit-bar', 'path-chip', 'play-chip']) {
          const el = document.getElementById(id)
          const r = el && !el.hidden && el.getBoundingClientRect()
          if (r && r.width && r.left < me.right && r.right > me.left && r.top < me.bottom && r.bottom > me.top) { hit = r; break }
        }
        if (!hit) break
        box.style.left = Math.round(hit.right + 8) + 'px'
      }
      // Narrow phones: if it runs off the right edge, drop it under Goals at the left instead.
      const me = box.getBoundingClientRect()
      if (me.right > innerWidth - 4) {
        box.style.left = '8px'
        if (gr && gr.width) box.style.top = Math.round(gr.bottom + 6) + 'px'
      }
    }
    requestAnimationFrame(frame)
  }
  requestAnimationFrame(frame)
}
