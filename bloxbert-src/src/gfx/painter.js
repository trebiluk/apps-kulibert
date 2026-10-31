// Block Painter, part 2. A kid paints one 16x16 block from the fixed 32 colors,
// taps Use it, and the block changes in the world. Saved on this device only.
// Format: TEXTURE-PACK-FORMAT (paletteId bertopia-32-v1). Look: BLOCK-PAINTER-LOOK.
import { PALETTE, applyStudent, setPack, currentPackId } from './packs.js'

export const STUDENT_KEY = 'bertopia-student-pack'
const SIZE = 16
const MAX_BYTES = 20 * 1024
const PACK_NAME = 'My pack'
const BLOCKS = [
  { key: 'dirt', word: 'ptDirt' },
  { key: 'stone', word: 'ptStone' },
  { key: 'planks', word: 'ptPlanks' },
  { key: 'sand', word: 'ptSand' },
  { key: 'grass', word: 'ptGrassTop' },
  { key: 'leaves', word: 'ptLeaves' },
]
const ICON = {
  pencil: '<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',
  fill: '<path d="M5 11l7-7 7 7-7 7z"/><path d="M19 14c0 2 2 2 2 4a2 2 0 0 1-4 0c0-2 2-2 2-4z"/>',
  eraser: '<path d="M4 15l8-9 8 7-5 6H8z"/><path d="M8 19h12"/>',
  pick: '<path d="M15 4l5 5-3 1-1 1-8 8H5v-3l8-8 1-1z"/>',
  mirror: '<path d="M12 3v18"/><path d="M8 7H4l3 5-3 5h4"/><path d="M16 7h4l-3 5 3 5h-4"/>',
  undo: '<path d="M8 8H4v4"/><path d="M5 12a7 7 0 1 1 2 5"/>',
  redo: '<path d="M16 8h4v4"/><path d="M19 12a7 7 0 1 0-2 5"/>',
  use: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M9 7L4 12l5 5"/><path d="M4 12h11a5 5 0 0 1 0 8"/>',
  rotate: '<path d="M20 12a8 8 0 1 1-3-6.2"/><path d="M20 4v5h-5"/>',
  block: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5"/>',
}
function svg(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ICON[name] + '</svg>'
}

let T = (k) => k
let TOAST = () => {}

// Blank = the checker the fixture uses: dark and bright check, alternating.
function blank() {
  const a = new Uint8Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) a[y * SIZE + x] = (x + y) & 1 ? 16 : 0
  return a
}
const BLANK = blank()
function sameAs(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

// The same checks pack-check runs on the student fixture. Returns '' when fine.
export function checkStudent(pack, bytes) {
  if (!pack || typeof pack !== 'object') return 'shape'
  if (bytes >= MAX_BYTES) return 'size'
  if (pack.format !== 'bertopia-pack') return 'format'
  if (pack.version !== 1) return 'version'
  if (pack.paletteId !== 'bertopia-32-v1') return 'paletteId'
  const name = String(pack.name || '')
  if (name.length < 1 || name.length > 24) return 'name'
  const textures = pack.textures || {}
  const names = Object.keys(textures)
  if (names.length < 1 || names.length > 64) return 'count'
  for (const key of names) {
    const pixels = textures[key] && textures[key].pixels
    if (!Array.isArray(pixels) || pixels.length !== 256) return 'pixels'
    for (let i = 0; i < pixels.length; i++) {
      const n = pixels[i]
      if (!Number.isInteger(n) || n < 0 || n > 31) return 'pixel'
    }
  }
  return ''
}

function readSaved() {
  let raw = ''
  try { raw = localStorage.getItem(STUDENT_KEY) || '' } catch (e) { return null }
  if (!raw) return null
  try {
    const pack = JSON.parse(raw)
    if (checkStudent(pack, raw.length)) return null
    return pack
  } catch (e) {
    return null
  }
}

// Reapply the saved block after a reload or a look swap. Waits for the strip.
let restoreTry = 0
export function restoreStudent() {
  const pack = readSaved()
  if (!pack) return Promise.resolve(false)
  const sheet = window.__bertSheet
  if (!sheet || !sheet.img || !sheet.img.naturalWidth) {
    if (restoreTry++ > 240) return Promise.resolve(false)
    return new Promise((resolve) => requestAnimationFrame(() => resolve(restoreStudent())))
  }
  restoreTry = 0
  return applyStudent(pack).catch(() => false)
}
if (typeof window !== 'undefined') window.__bertStudentRestore = () => { restoreStudent() }

// ---- panel ----
let P = null // dom refs, built on first open
let open = false
let trigger = null
let blockKey = BLOCKS[0].key
let pixels = BLANK.slice()
let drafts = {}
let tool = 'pencil'
let color = 3
let mirror = false
let cx = 7
let cy = 7
let undoStack = []
let redoStack = []
let before = null
let activePointer = null
let lastX = 0
let lastY = 0
let prevFrame = 0
let rot = 0

function el(tag, cls, html) {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html != null) e.innerHTML = html
  return e
}

function say(text) {
  if (P) P.live.textContent = text
}

function swatchLabel(i) {
  return T('ptColor').replace('{n}', String(i + 1))
}

function toolWord() {
  return T({ pencil: 'ptPencil', fill: 'ptFill', eraser: 'ptEraser', pick: 'ptPickColor' }[tool])
}

function meta() {
  const cell = T('ptCell').replace('{r}', String(cy + 1)).replace('{c}', String(cx + 1))
  P.meta.textContent = cell + ' · ' + toolWord() + ' · ' + swatchLabel(color) + ' · ' + T('ptMirror') + ': ' + (mirror ? T('ptOn') : T('ptOff'))
}

function placeCursor() {
  P.grid.style.setProperty('--cx', String(cx))
  P.grid.style.setProperty('--cy', String(cy))
  meta()
}

function redraw() {
  const d = P.img.data
  for (let i = 0; i < pixels.length; i++) {
    const c = PALETTE[pixels[i]] || PALETTE[0]
    const o = i * 4
    d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255
  }
  P.g.putImageData(P.img, 0, 0)
}

function crisp() {
  const big = document.createElement('canvas')
  big.width = 64
  big.height = 64
  const g = big.getContext('2d')
  g.imageSmoothingEnabled = false
  g.drawImage(P.canvas, 0, 0, 64, 64)
  return big.toDataURL()
}

function queuePreview() {
  if (prevFrame) return
  prevFrame = requestAnimationFrame(() => {
    prevFrame = 0
    if (!P) return
    const url = crisp()
    for (const im of P.faces) im.src = url
  })
}

function paintedChanged() {
  redraw()
  queuePreview()
}

function setPix(x, y, c) {
  const i = y * SIZE + x
  if (pixels[i] === c) return false
  pixels[i] = c
  return true
}
function stamp(x, y, c) {
  let ch = setPix(x, y, c)
  if (mirror) {
    const mx = SIZE - 1 - x
    if (mx !== x) ch = setPix(mx, y, c) || ch
  }
  return ch
}
function stampValue(x, y) {
  // Eraser puts the blank checker back for that cell.
  if (tool === 'eraser') return stampBlank(x, y)
  return stamp(x, y, color)
}
function stampBlank(x, y) {
  let ch = setPix(x, y, BLANK[y * SIZE + x])
  if (mirror) {
    const mx = SIZE - 1 - x
    if (mx !== x) ch = setPix(mx, y, BLANK[y * SIZE + mx]) || ch
  }
  return ch
}
function line(x0, y0, x1, y1) {
  let ch = false
  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  for (;;) {
    if (stampValue(x0, y0)) ch = true
    if (x0 === x1 && y0 === y1) break
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x0 += sx }
    if (e2 < dx) { err += dx; y0 += sy }
  }
  return ch
}
// The two check colors (0 and 16) are the blank look, so Fill treats them as one empty area.
function isEmpty(v) { return v === 0 || v === 16 }
function flood(x, y) {
  const src = pixels[y * SIZE + x]
  const empty = isEmpty(src)
  if (src === color && !empty) return false
  const stack = [x, y]
  const seen = new Uint8Array(SIZE * SIZE)
  let ch = false
  while (stack.length) {
    const py = stack.pop()
    const px = stack.pop()
    const i = py * SIZE + px
    if (seen[i]) continue
    const v = pixels[i]
    if (empty ? !isEmpty(v) : v !== src) continue
    seen[i] = 1
    if (pixels[i] !== color) ch = true
    pixels[i] = color
    if (px > 0) stack.push(px - 1, py)
    if (px < SIZE - 1) stack.push(px + 1, py)
    if (py > 0) stack.push(px, py - 1)
    if (py < SIZE - 1) stack.push(px, py + 1)
  }
  return ch
}

function history() {
  P.undo.setAttribute('aria-disabled', undoStack.length ? 'false' : 'true')
  P.redo.setAttribute('aria-disabled', redoStack.length ? 'false' : 'true')
}
function begin() { before = pixels.slice() }
function end() {
  if (!before) return
  if (!sameAs(before, pixels)) {
    undoStack.push(before)
    if (undoStack.length > 50) undoStack.shift()
    redoStack.length = 0
    history()
    P.msg.textContent = ''
    P.err.textContent = ''
  }
  before = null
}
function doUndo() {
  if (!undoStack.length) return
  redoStack.push(pixels.slice())
  pixels.set(undoStack.pop())
  paintedChanged()
  history()
}
function doRedo() {
  if (!redoStack.length) return
  undoStack.push(pixels.slice())
  pixels.set(redoStack.pop())
  paintedChanged()
  history()
}

function setTool(next) {
  tool = next
  for (const b of P.toolBtns) b.setAttribute('aria-pressed', b.dataset.tool === next ? 'true' : 'false')
  meta()
}
function setColor(i) {
  color = i
  for (let k = 0; k < P.swatches.length; k++) P.swatches[k].setAttribute('aria-pressed', k === i ? 'true' : 'false')
  meta()
}
function toggleMirror() {
  mirror = !mirror
  P.mirrorBtn.setAttribute('aria-pressed', mirror ? 'true' : 'false')
  P.mirrorState.textContent = mirror ? T('ptOn') : T('ptOff')
  P.grid.dataset.mirror = mirror ? '1' : '0'
  meta()
}

function clampCell(v) { return v < 0 ? 0 : v > SIZE - 1 ? SIZE - 1 : v }
function cellFromEvent(e) {
  const r = P.grid.getBoundingClientRect()
  return [clampCell(Math.floor(((e.clientX - r.left) / r.width) * SIZE)), clampCell(Math.floor(((e.clientY - r.top) / r.height) * SIZE))]
}
function pickAt(x, y) {
  setColor(pixels[y * SIZE + x])
  setTool('pencil')
  say(toolWord() + '. ' + swatchLabel(color))
}
function actAtCursor() {
  if (tool === 'pick') { pickAt(cx, cy); return }
  begin()
  const ch = tool === 'fill' ? flood(cx, cy) : line(cx, cy, cx, cy)
  if (ch) paintedChanged()
  end()
}

function commitDraft() {
  if (!P) return
  drafts[blockKey] = pixels.slice()
}
function setBlock(key) {
  commitDraft()
  blockKey = key
  const saved = drafts[key]
  pixels = saved ? Uint8Array.from(saved) : BLANK.slice()
  undoStack = []
  redoStack = []
  before = null
  history()
  paintedChanged()
  meta()
}

function showErr() {
  P.msg.textContent = ''
  P.err.textContent = T('ptErr')
}

async function useIt() {
  P.err.textContent = ''
  P.msg.textContent = ''
  try {
    commitDraft()
    const textures = {}
    const saved = readSaved()
    if (saved) for (const k of Object.keys(saved.textures)) textures[k] = { pixels: saved.textures[k].pixels.slice() }
    for (const k of Object.keys(drafts)) {
      if (k === blockKey || !sameAs(drafts[k], BLANK)) textures[k] = { pixels: Array.from(drafts[k]) }
    }
    const pack = { format: 'bertopia-pack', version: 1, paletteId: 'bertopia-32-v1', name: PACK_NAME, textures }
    const json = JSON.stringify(pack)
    if (checkStudent(pack, json.length)) { showErr(); return }
    const ok = await applyStudent(pack)
    if (!ok) { showErr(); return }
    let kept = true
    try { localStorage.setItem(STUDENT_KEY, json) } catch (e) { kept = false }
    P.msg.textContent = T('ptInWorld')
    if (!kept) P.err.textContent = T('ptNoSave')
    TOAST(T('ptInWorld'))
  } catch (e) {
    showErr()
  }
}

function backToClassic() {
  P.err.textContent = ''
  try { localStorage.removeItem(STUDENT_KEY) } catch (e) {}
  drafts = {}
  pixels = BLANK.slice()
  undoStack = []
  redoStack = []
  history()
  paintedChanged()
  setPack(currentPackId()).then(() => {
    P.msg.textContent = T('ptClassicBack')
    TOAST(T('ptClassicBack'))
  }).catch(() => showErr())
}

// ---- building the panel ----
function build() {
  const root = document.getElementById('painter')
  if (!root) return null
  const q = (s) => root.querySelector(s)
  const refs = {
    root,
    title: q('#pt-title'),
    blockLabel: q('#pt-block-label'),
    select: q('#pt-block'),
    close: q('#pt-close'),
    tools: q('#pt-tools'),
    meta: q('#pt-meta'),
    grid: q('#pt-grid'),
    canvas: q('#pt-canvas'),
    cursor: q('#pt-cursor'),
    palette: q('#pt-palette'),
    stage: q('#pt-stage'),
    cube: q('#pt-cube'),
    rotate: q('#pt-rotate'),
    previewLabel: q('#pt-prev-label'),
    use: q('#pt-use'),
    back: q('#pt-back'),
    msg: q('#pt-msg'),
    err: q('#pt-err'),
    live: q('#pt-live'),
    toolBtns: [],
    swatches: [],
    faces: [],
  }
  refs.g = refs.canvas.getContext('2d', { alpha: false })
  refs.g.imageSmoothingEnabled = false
  refs.img = refs.g.createImageData(SIZE, SIZE)
  const mk = (id, name, word, extra) => {
    const b = el('button', 'pt-btn pt-tool', svg(name) + '<span class="pt-word"></span>' + (extra || ''))
    b.type = 'button'
    b.id = id
    b.dataset.word = word
    refs.tools.append(b)
    return b
  }
  for (const [id, name, word, tl] of [
    ['pt-pencil', 'pencil', 'ptPencil', 'pencil'],
    ['pt-fill', 'fill', 'ptFill', 'fill'],
    ['pt-eraser', 'eraser', 'ptEraser', 'eraser'],
    ['pt-pick', 'pick', 'ptPickColor', 'pick'],
  ]) {
    const b = mk(id, name, word)
    b.dataset.tool = tl
    refs.toolBtns.push(b)
  }
  refs.mirrorBtn = mk('pt-mirror', 'mirror', 'ptMirror', '<span class="pt-state"></span>')
  refs.mirrorState = refs.mirrorBtn.querySelector('.pt-state')
  refs.undo = mk('pt-undo', 'undo', 'ptUndo')
  refs.redo = mk('pt-redo', 'redo', 'ptRedo')
  PALETTE.forEach((c, i) => {
    const b = el('button', 'pt-sw', '<span class="pt-chk"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>')
    b.type = 'button'
    b.style.setProperty('background', 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')', 'important')
    b.addEventListener('click', () => { setColor(i); say(swatchLabel(i)) })
    refs.palette.append(b)
    refs.swatches.push(b)
  })
  for (const f of ['front', 'back', 'right', 'left', 'top', 'bottom']) {
    const face = el('div', 'pt-face ' + f)
    const im = document.createElement('img')
    im.alt = ''
    im.draggable = false
    face.append(im)
    refs.cube.append(face)
    refs.faces.push(im)
  }
  for (const b of BLOCKS) {
    const o = document.createElement('option')
    o.value = b.key
    refs.select.append(o)
  }
  refs.close.innerHTML = svg('close') + '<span class="pt-word"></span>'
  refs.rotate.innerHTML = svg('rotate') + '<span class="pt-word"></span>'
  refs.use.innerHTML = svg('use') + '<span class="pt-word"></span>'
  refs.back.innerHTML = svg('back') + '<span class="pt-word"></span>'
  q('.pt-pickico').innerHTML = svg('block')
  return refs
}

function words() {
  P.title.textContent = T('ptTitle')
  P.blockLabel.textContent = T('ptBlock')
  P.select.setAttribute('aria-label', T('ptBlock'))
  BLOCKS.forEach((b, i) => { P.select.options[i].textContent = T(b.word) })
  P.close.querySelector('.pt-word').textContent = T('ptClose')
  P.rotate.querySelector('.pt-word').textContent = T('ptRotate')
  P.use.querySelector('.pt-word').textContent = T('ptUse')
  P.back.querySelector('.pt-word').textContent = T('ptBack')
  P.tools.setAttribute('aria-label', T('ptTools'))
  for (const b of P.tools.querySelectorAll('.pt-tool')) b.querySelector('.pt-word').textContent = T(b.dataset.word)
  P.palette.setAttribute('aria-label', T('ptColors'))
  P.swatches.forEach((b, i) => b.setAttribute('aria-label', swatchLabel(i)))
  P.grid.setAttribute('aria-label', T('ptGridHelp'))
  P.previewLabel.textContent = T('ptPreview')
  P.stage.setAttribute('aria-label', T('ptPreview'))
  P.mirrorState.textContent = mirror ? T('ptOn') : T('ptOff')
}

function focusables() {
  return Array.from(P.root.querySelectorAll('button, select, [tabindex="0"]')).filter((n) => !n.hidden && n.offsetParent !== null)
}

function onKey(e) {
  if (!open) return
  if (e.type !== 'keydown') { e.stopPropagation(); return }
  const k = e.key
  if (k === 'Escape') { e.preventDefault(); e.stopPropagation(); closePainter(); return }
  if (k === 'Tab') {
    const list = focusables()
    if (list.length) {
      const i = list.indexOf(document.activeElement)
      const n = e.shiftKey ? (i <= 0 ? list.length - 1 : i - 1) : (i < 0 || i === list.length - 1 ? 0 : i + 1)
      e.preventDefault()
      list[n].focus()
    }
    e.stopPropagation()
    return
  }
  if (document.activeElement === P.grid) {
    if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
      e.preventDefault()
      cx = clampCell(cx + (k === 'ArrowRight' ? 1 : k === 'ArrowLeft' ? -1 : 0))
      cy = clampCell(cy + (k === 'ArrowDown' ? 1 : k === 'ArrowUp' ? -1 : 0))
      placeCursor()
      e.stopPropagation()
      return
    }
    if (k === ' ' || k === 'Spacebar' || k === 'Enter') {
      e.preventDefault()
      if (!e.repeat) actAtCursor()
      e.stopPropagation()
      return
    }
  }
  if ((e.ctrlKey || e.metaKey) && !e.altKey) {
    const low = k.toLowerCase()
    if (low === 'z') { e.preventDefault(); if (e.shiftKey) doRedo(); else doUndo() } else if (low === 'y') { e.preventDefault(); doRedo() }
  }
  // Nothing else reaches the game while the painter is open. Buttons still click.
  e.stopPropagation()
}

function wire() {
  P.root.addEventListener('click', (e) => e.stopPropagation())
  P.root.addEventListener('pointerdown', (e) => e.stopPropagation())
  P.root.addEventListener('mousedown', (e) => e.stopPropagation())
  P.root.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true })
  P.close.addEventListener('click', closePainter)
  P.use.addEventListener('click', useIt)
  P.back.addEventListener('click', backToClassic)
  P.select.addEventListener('change', () => setBlock(P.select.value))
  P.rotate.addEventListener('click', () => {
    rot = (rot + 1) % 4
    P.cube.style.setProperty('--rot', String(rot))
  })
  P.tools.addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    if (b.dataset.tool) { setTool(b.dataset.tool); say(toolWord()) } else if (b === P.mirrorBtn) { toggleMirror(); say(T('ptMirror') + ': ' + (mirror ? T('ptOn') : T('ptOff'))) } else if (b === P.undo) doUndo()
    else if (b === P.redo) doRedo()
  })
  const g = P.grid
  g.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || activePointer !== null) return
    activePointer = e.pointerId
    try { g.setPointerCapture(e.pointerId) } catch (err) {}
    g.focus({ preventScroll: true })
    e.preventDefault()
    const c = cellFromEvent(e)
    cx = c[0]; cy = c[1]
    placeCursor()
    if (tool === 'pick') { pickAt(cx, cy); lastX = cx; lastY = cy; return }
    begin()
    const ch = tool === 'fill' ? flood(cx, cy) : line(cx, cy, cx, cy)
    if (ch) paintedChanged()
    lastX = cx; lastY = cy
  })
  g.addEventListener('pointermove', (e) => {
    if (e.pointerId !== activePointer) return
    const c = cellFromEvent(e)
    if (tool === 'pencil' || tool === 'eraser') {
      if (c[0] === lastX && c[1] === lastY) return
      if (line(lastX, lastY, c[0], c[1])) paintedChanged()
    }
    cx = c[0]; cy = c[1]; lastX = cx; lastY = cy
    placeCursor()
  })
  const stop = (e) => {
    if (e.pointerId !== activePointer) return
    activePointer = null
    end()
  }
  g.addEventListener('pointerup', stop)
  g.addEventListener('pointercancel', stop)
  g.addEventListener('contextmenu', (e) => e.preventDefault())
}

function reduced() {
  try { return matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
}

export function openPainter(from) {
  if (open) return
  if (!P) {
    P = build()
    if (!P) return
    wire()
  }
  trigger = from || null
  const saved = readSaved()
  if (!Object.keys(drafts).length && saved) for (const k of Object.keys(saved.textures)) drafts[k] = Uint8Array.from(saved.textures[k].pixels)
  words()
  P.root.dir = document.documentElement.dir || 'ltr'
  P.cube.dataset.spin = reduced() ? '0' : '1'
  P.rotate.hidden = !reduced()
  P.msg.textContent = ''
  P.err.textContent = ''
  P.select.value = blockKey
  const keep = blockKey
  pixels = drafts[keep] ? Uint8Array.from(drafts[keep]) : BLANK.slice()
  undoStack = []
  redoStack = []
  setTool(tool)
  setColor(color)
  P.mirrorBtn.setAttribute('aria-pressed', mirror ? 'true' : 'false')
  history()
  redraw()
  queuePreview()
  placeCursor()
  P.root.hidden = false
  open = true
  window.addEventListener('keydown', onKey, true)
  window.addEventListener('keyup', onKey, true)
  window.addEventListener('keypress', onKey, true)
  try { P.grid.focus({ preventScroll: true }) } catch (e) {}
}

export function closePainter() {
  if (!open) return
  commitDraft()
  open = false
  P.root.hidden = true
  window.removeEventListener('keydown', onKey, true)
  window.removeEventListener('keyup', onKey, true)
  window.removeEventListener('keypress', onKey, true)
  const t = trigger
  trigger = null
  if (t && t.isConnected) { try { t.focus() } catch (e) {} }
}

export function initPainter(opts) {
  if (opts && opts.t) T = opts.t
  if (opts && opts.toast) TOAST = opts.toast
}

// A "Paint a block" button for the end of Settings > Look.
export function addPaintButton(parent) {
  const b = el('button', 'look-pack pt-open', svg('pencil') + '<span></span>')
  b.type = 'button'
  b.id = 'pt-open'
  b.querySelector('span').textContent = T('ptOpen')
  const st = { 'min-height': '48px', 'min-width': '48px', padding: '0 14px', background: '#2c333b', color: '#e6eef2', border: '3px solid #5c656e', 'border-radius': '10px', cursor: 'pointer', width: 'auto', 'align-self': 'flex-start' }
  for (const k of Object.keys(st)) b.style.setProperty(k, st[k], 'important')
  b.addEventListener('click', () => openPainter(b))
  parent.append(b)
  return b
}
