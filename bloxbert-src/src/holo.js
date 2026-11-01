// Holo Hand, part 1. Replaces the first-person hand with a small flat hologram of the held item.
// Design: crew-board docs/bertopia/HOLO-HAND.md. Matte amber #C98A3E at about 45% opacity, #8A5A22 outline.
// It is a DOM canvas, not a mesh: zero triangles, no draw call, no lights. The picture is redrawn only when
// the held item changes. The spot is re-chosen on resize and once a second, so it never covers the hotbar or a button.
import { blockIcon, slotArt, itemSvg, wandCanvas } from './icons.js'
import { ITEMS } from './data/items.js'
import { BLOCKS } from './data/blocks-list.js'
import ATLAS from '../assets/atlas.json'

const AMBER = [0xC9, 0x8A, 0x3E]
const EDGE = [0x8A, 0x5A, 0x22]
const FILL_A = 0.45
const EDGE_A = 0.85
const PIC = 48 // source picture size, same as the hotbar
const PAD = 2 // room for the outline
const GAP = 8 // space kept around buttons and the hotbar
const AVOID = 'button, a[href], input, select, [role="button"], #hotbar, #stick-pad, #current'

// Open palm, drawn in the outline colour: the "empty hand" picture.
const PALM = '<svg viewBox="0 0 48 48" aria-hidden="true" focusable="false"><path d="M15 27V14a2.5 2.5 0 0 1 5 0v10M20 23V10a2.5 2.5 0 0 1 5 0v13M25 23V11a2.5 2.5 0 0 1 5 0v13M30 24v-8a2.5 2.5 0 0 1 5 0v14c0 7-5 12-11 12h-1c-4 0-7-2-9-5l-5-8a2.4 2.4 0 0 1 4-3l3 4" fill="rgba(201,138,62,0.18)" stroke="#8A5A22" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

export function createHolo(opts) {
  const root = document.createElement('div')
  root.id = 'holo-hand'
  root.setAttribute('aria-hidden', 'true')
  const bob = document.createElement('div')
  bob.className = 'holo-bob'
  const pic = document.createElement('canvas')
  pic.className = 'holo-pic'
  pic.width = pic.height = PIC + PAD * 2
  const palm = document.createElement('div')
  palm.className = 'holo-palm'
  palm.innerHTML = PALM
  bob.append(pic, palm)
  root.append(bob)
  const note = document.createElement('div')
  note.id = 'holo-note'
  note.setAttribute('role', 'status')
  note.setAttribute('aria-live', 'polite')
  note.hidden = true
  document.body.append(root, note)

  let shownKey = null
  let want = ''
  let tries = 0
  let retry = 0
  let side = ''
  let spot = null
  let placedAt = 0
  let noteTimer = 0
  let visible = false

  function keyOf(spec) {
    if (!spec || spec.kind === 'empty') return ''
    const variant = spec.key === 'buildWand' && opts.wandMode ? (opts.wandMode() || 'select') : ''
    return spec.kind + ':' + (spec.kind === 'block' ? (spec.id | 0) : spec.key) + (variant ? ':' + variant : '')
  }

  function sourceOf(spec) {
    if (spec.key === 'buildWand') return wandCanvas((opts.wandMode && opts.wandMode()) || 'select')
    if (spec.kind === 'block') {
      const b = BLOCKS.find((x) => x[0] === (spec.id | 0))
      // Same picture as the hotbar: slotArt keeps the world cube for cube blocks and uses the item's own sprite
      // for placeable items like Sapling (its cube tile read as a tan square).
      return slotArt(spec.key, b ? blockIcon(b, ATLAS) : null)
    }
    const item = ITEMS[spec.key]
    if (item && item.svg) return { svg: itemSvg(item.svg) }
    return slotArt(spec.key)
  }

  // Any icon (canvas, img, svg markup or a node holding an svg) -> 48px canvas, or null.
  function toCanvas(src, done) {
    if (!src) { done(null); return }
    const draw = (img) => {
      const c = document.createElement('canvas')
      c.width = c.height = PIC
      try { c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, PIC, PIC) } catch (e) { done(null); return }
      done(fill(c))
    }
    if (src.getContext && src.width) { draw(src); return }
    if (src.tagName === 'IMG') {
      if (src.complete && src.naturalWidth) draw(src)
      else { src.onload = () => draw(src); src.onerror = () => done(null) }
      return
    }
    let xml = typeof src.svg === 'string' ? src.svg : ''
    if (!xml) {
      const svg = src.querySelector && src.querySelector('svg')
      if (svg) xml = new XMLSerializer().serializeToString(svg)
      else {
        const inner = src.querySelector && src.querySelector('canvas,img')
        if (inner) { toCanvas(inner, done); return }
      }
    }
    if (!xml || !xml.includes('<svg')) { done(null); return }
    if (!xml.includes('xmlns=')) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    if (!/<svg[^>]*\swidth=/.test(xml)) xml = xml.replace('<svg', '<svg width="48" height="48"')
    const img = new Image()
    const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
    img.onload = () => { URL.revokeObjectURL(url); draw(img) }
    img.onerror = () => { URL.revokeObjectURL(url); done(null) }
    img.src = url
  }

  // r1: crop to the item's visible pixels and scale them up to the full picture, so the hologram itself
  // (not just its box) is about 12% of the screen height. Keeps the shape's aspect, centred.
  function fill(c) {
    let d
    try { d = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, PIC, PIC).data } catch (e) { return c }
    let x0 = PIC, y0 = PIC, x1 = -1, y1 = -1
    for (let y = 0; y < PIC; y++) for (let x = 0; x < PIC; x++) {
      if (d[(y * PIC + x) * 4 + 3] < 80) continue
      if (x < x0) x0 = x
      if (x > x1) x1 = x
      if (y < y0) y0 = y
      if (y > y1) y1 = y
    }
    if (x1 < 0) return c
    const w = x1 - x0 + 1
    const h = y1 - y0 + 1
    if (w >= PIC - 1 && h >= PIC - 1) return c
    const k = PIC / Math.max(w, h)
    const out = document.createElement('canvas')
    out.width = out.height = PIC
    const g = out.getContext('2d', { willReadFrequently: true })
    g.imageSmoothingEnabled = false
    g.drawImage(c, x0, y0, w, h, (PIC - w * k) / 2, (PIC - h * k) / 2, w * k, h * k)
    return out
  }

  // Recolour to one matte amber: darker parts of the item stay darker, so the shape still reads in grayscale.
  // The brightest pixel is #C98A3E at 45%, so nothing is near white.
  function paintHolo(src) {
    let data
    try { data = src.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, PIC, PIC).data } catch (e) { return false }
    const W = PIC + PAD * 2
    const mask = new Uint8Array(W * W)
    const lum = new Float32Array(W * W)
    let any = 0
    for (let y = 0; y < PIC; y++) {
      for (let x = 0; x < PIC; x++) {
        const i = (y * PIC + x) * 4
        if (data[i + 3] < 80) continue
        const p = (y + PAD) * W + x + PAD
        mask[p] = 1
        lum[p] = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
        any++
      }
    }
    if (!any) return false
    // Stretch the item's own light and dark parts across the amber range, so a flat-looking icon still shows its detail.
    let lo = 1
    let hi = 0
    for (let p = 0; p < W * W; p++) if (mask[p]) { if (lum[p] < lo) lo = lum[p]; if (lum[p] > hi) hi = lum[p] }
    const span = hi - lo > 0.04 ? hi - lo : 1
    const g = pic.getContext('2d')
    const out = g.createImageData(W, W)
    const o = out.data
    for (let y = 0; y < W; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x
        const j = p * 4
        if (mask[p]) {
          const k = 0.2 + 0.8 * Math.max(0, Math.min(1, (lum[p] - (span === 1 ? 0 : lo)) / span))
          o[j] = EDGE[0] + (AMBER[0] - EDGE[0]) * k
          o[j + 1] = EDGE[1] + (AMBER[1] - EDGE[1]) * k
          o[j + 2] = EDGE[2] + (AMBER[2] - EDGE[2]) * k
          o[j + 3] = 255 * FILL_A
          continue
        }
        let edge = false
        for (let dy = -PAD; dy <= PAD && !edge; dy++) {
          for (let dx = -PAD; dx <= PAD; dx++) {
            const xx = x + dx
            const yy = y + dy
            if (xx < 0 || yy < 0 || xx >= W || yy >= W) continue
            if (Math.abs(dx) + Math.abs(dy) > PAD) continue
            if (mask[yy * W + xx]) { edge = true; break }
          }
        }
        if (edge) {
          o[j] = EDGE[0]
          o[j + 1] = EDGE[1]
          o[j + 2] = EDGE[2]
          o[j + 3] = 255 * EDGE_A
        }
      }
    }
    g.clearRect(0, 0, W, W)
    g.putImageData(out, 0, 0)
    return true
  }

  function showPicture(key, spec) {
    shownKey = key
    clearTimeout(retry)
    if (!key) {
      root.dataset.state = 'empty'
      return
    }
    if (key !== want) tries = 0
    want = key
    toCanvas(sourceOf(spec), (c) => {
      if (want !== key) return
      if (c && paintHolo(c)) { root.dataset.state = 'item'; tries = 0; return }
      // Pack pictures can still be blank while the texture sheet loads: try again a few times, then show the palm.
      root.dataset.state = 'empty'
      if (tries++ < 6) retry = setTimeout(() => { if (want === key) { shownKey = null } }, 500)
    })
  }

  // Lower corner on the main-hand side, about 12% of the screen height, clear of every visible control.
  function blockers() {
    const out = []
    const W = innerWidth
    const H = innerHeight
    for (const el of document.querySelectorAll(AVOID)) {
      if (root.contains(el)) continue
      if (el.checkVisibility && !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue
      const r = el.getBoundingClientRect()
      if (r.width < 4 || r.height < 4) continue
      if (r.width > W * 0.9 && r.height > H * 0.9) continue
      if (r.bottom < H * 0.35) continue
      out.push(r)
    }
    return out
  }
  function place() {
    placedAt = performance.now()
    const W = innerWidth
    const H = innerHeight
    const left = side === 'left'
    const list = blockers()
    const clear = (x, y, s) => {
      for (let i = 0; i < list.length; i++) {
        const r = list[i]
        if (x < r.right + GAP && x + s > r.left - GAP && y < r.bottom + GAP && y + s > r.top - GAP) return false
      }
      return true
    }
    const full = Math.round(Math.max(44, Math.min(120, H * 0.12)))
    // r1: phone held upright, Left: the thumb stick and hotbar fill the corner itself, so dock the hand flush left
    // directly on top of the stick (the lowest left spot that covers nothing) before searching anywhere else.
    if (left && H > W && W <= 600) {
      const stick = document.getElementById('stick-pad')
      const sr = stick && stick.offsetWidth ? stick.getBoundingClientRect() : null
      if (sr && sr.height) {
        for (const s of [full, Math.round(full * 0.8), Math.max(44, Math.round(full * 0.65))]) {
          const x = 8
          const y = Math.round(sr.top - GAP - s)
          if (y > H * 0.4 && clear(x, y, s)) { spot = { x, y, s }; apply(); return }
        }
      }
    }
    for (const s of [full, Math.round(full * 0.8), Math.max(44, Math.round(full * 0.65))]) {
      const edge = 8
      for (let y = H - s - edge; y >= H * 0.4; y -= 6) {
        for (let k = 0; k <= W * 0.45 - s; k += 6) {
          const x = left ? edge + k : W - s - edge - k
          if (clear(x, y, s)) { spot = { x, y, s }; apply(); return }
        }
      }
    }
    spot = null
    apply()
  }
  function apply() {
    if (!spot) { root.dataset.room = '0'; return }
    root.dataset.room = '1'
    root.style.left = spot.x + 'px'
    root.style.top = spot.y + 'px'
    root.style.width = root.style.height = spot.s + 'px'
  }
  addEventListener('resize', () => { placedAt = 0 })

  function update() {
    const s = opts.side() === 'left' ? 'left' : 'right'
    if (s !== side) { side = s; root.dataset.side = s; placedAt = 0 }
    const on = !!opts.show() && !opts.hidden() && !opts.wet()
    if (on !== visible) { visible = on; root.dataset.on = on ? '1' : '0'; if (on) placedAt = 0 }
    if (!on) return
    const spec = opts.held()
    const key = keyOf(spec)
    if (key !== shownKey) showPicture(key, spec)
    if (performance.now() - placedAt > 1000) place()
  }

  // "Main hand: Right" for 3 s, next to the hologram (or low in that corner if it has no room).
  function announce(text) {
    note.textContent = text
    note.hidden = false
    note.dataset.side = side
    placedAt = 0
    update()
    if (spot) {
      note.style.top = Math.max(8, spot.y - 40) + 'px'
      note.style.bottom = 'auto'
      note.style.left = side === 'left' ? spot.x + 'px' : ''
      note.style.right = side === 'left' ? '' : Math.max(8, innerWidth - spot.x - spot.s) + 'px'
    } else {
      note.style.top = ''
      note.style.bottom = ''
      note.style.left = ''
      note.style.right = ''
    }
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => { note.hidden = true }, 3000)
  }

  root.dataset.on = '0'
  root.dataset.state = 'empty'
  return {
    update,
    announce,
    info: () => ({ visible, side, key: shownKey || '', state: root.dataset.state, room: root.dataset.room === '1', rect: spot ? { ...spot } : null, tris: 0 }),
    // Part 2: where the beam starts. The centre of the hologram, or null while it is hidden.
    origin: () => (visible && spot ? { x: spot.x + spot.s / 2, y: spot.y + spot.s / 2 } : null),
  }
}
