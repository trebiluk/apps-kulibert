// Holo Hand, part 2. The tractor beam and the state words.
// Design: crew-board docs/bertopia/HOLO-HAND.md (Beam, States). Part 1 is holo.js (the hologram itself).
// The beam is one 2px line on a fixed, transparent canvas: from the hologram to the aim point on screen.
// It draws only while mining, placing, or hovering a usable block within reach, and fades out in 150 ms.
// Under reduced motion it appears at once and stays static. No glow, no particles, no pulse.
const AMBER = '#C98A3E'
const EDGE = '#8A5A22'
const FADE_MS = 150

export function createHoloBeam(opts) {
  const c = document.createElement('canvas')
  c.id = 'holo-beam'
  c.setAttribute('aria-hidden', 'true')
  document.body.append(c)
  const g = c.getContext('2d')
  const word = document.createElement('div')
  word.id = 'holo-word'
  word.setAttribute('role', 'status')
  word.setAttribute('aria-live', 'polite')
  word.hidden = true
  document.body.append(word)

  let w = 0
  let h = 0
  let dpr = 1
  let alpha = 0 // 0..1, what is drawn now
  let lastKind = ''
  let lastWord = ''
  let lastEnd = null
  let lastAt = 0
  let drawnBlank = true

  function fit() {
    dpr = Math.min(2, window.devicePixelRatio || 1)
    const nw = innerWidth
    const nh = innerHeight
    if (nw === w && nh === h && c.width === Math.round(nw * dpr)) return
    w = nw
    h = nh
    c.width = Math.round(w * dpr)
    c.height = Math.round(h * dpr)
    c.style.width = w + 'px'
    c.style.height = h + 'px'
    drawnBlank = false
  }
  addEventListener('resize', fit)

  function reduced() {
    return document.documentElement.getAttribute('data-kp-motion') === 'less' || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }

  // kind: '' | 'mine' | 'place' | 'use' | 'far'. end: [x, y] on screen, or null. label: the word to show by the crosshair.
  function update(state) {
    fit()
    const now = performance.now()
    const kind = state && state.kind || ''
    const label = state && state.label || ''
    const end = state && state.end || null
    const from = opts.origin() // {x, y} centre of the hologram, or null when it is hidden
    const wantBeam = !!(from && end && (kind === 'mine' || kind === 'place' || kind === 'use'))
    const still = reduced()
    if (wantBeam) {
      alpha = 1
      lastEnd = end
      lastAt = now
    } else if (alpha > 0) {
      alpha = still ? 0 : Math.max(0, 1 - (now - lastAt) / FADE_MS)
    }
    if (label !== lastWord || kind !== lastKind) {
      lastWord = label
      lastKind = kind
      word.hidden = !label
      word.dataset.kind = kind
      word.textContent = label
    }
    if (alpha <= 0 || !from || !lastEnd) {
      if (!drawnBlank) { g.clearRect(0, 0, c.width, c.height); drawnBlank = true }
      return
    }
    g.clearRect(0, 0, c.width, c.height)
    drawnBlank = false
    g.save()
    g.scale(dpr, dpr)
    g.globalAlpha = alpha
    g.lineCap = 'round'
    // dark edge under the amber line so it reads on sky and on grass
    g.strokeStyle = EDGE
    g.lineWidth = 4
    g.beginPath()
    g.moveTo(from.x, from.y)
    g.lineTo(lastEnd[0], lastEnd[1])
    g.stroke()
    g.strokeStyle = AMBER
    g.lineWidth = 2
    g.stroke()
    g.restore()
  }

  return {
    update,
    info: () => ({ alpha: +alpha.toFixed(2), kind: lastKind, word: lastWord, end: lastEnd ? lastEnd.slice() : null, blank: drawnBlank }),
  }
}
