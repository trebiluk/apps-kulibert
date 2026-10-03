// Bloxbert — test page (noindex test page at /blocks-test/). Pins: noa-engine develop @8a74866, @babylonjs/core 6.49.0.
// 1.1: RepoScout spike settings folded in (AA off, chunk distance [1.5,1]/[2.5,2], player shadow off, auto render scale).
// 1.2: named Bloxbert. Auto / Lite / Full quality switch in Settings. Phone: toolbar wraps, faster touch turning,
//      re-fit on rotate. ar / fa-AF: page is RTL but ☰ stays top-left and the menu opens from the left.
const VERSION = '1.2'
// noa-engine (MIT) + Babylon.js 6 (Apache-2.0). Tiles: Kenney Voxel Pack (CC0).
import { Engine } from 'noa-engine'
import ATLAS from '../assets/atlas.json'

const T0 = performance.now()
// No WebGL2 (GPU blocked or broken): show a plain card instead of a blank page.
if (!document.createElement('canvas').getContext('webgl2')) {
  document.getElementById('stage').innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px"><div style="max-width:440px;background:#111a2e;border:1px solid #22304d;border-radius:14px;padding:20px"><b style="font-size:18px">This device can\'t run 3D right now</b><p style="color:#9fb0c6">Bloxbert needs WebGL 2. Try restarting Chrome, or use another Chromebook or phone. Your saved world is still safe.</p></div></div>'
  throw new Error('Bloxbert: WebGL2 not available')
}
const coarse = matchMedia('(pointer: coarse)').matches
const qs = new URLSearchParams(location.search)
const TOUCH_UI = coarse || qs.has('touch')
// ---------- quality: Auto / Lite / Full (RepoScout spike numbers) ----------
// Lite: antialias off, hardware scaling 1.75, chunk distance [1.5,1] / remove [2.5,2].
// Auto: antialias off, same chunk distance, starts at full res (1.5 on screens bigger than ~1366x768) and steps the
//       hardware scaling level up 0.25 (to at most 2 = half res) when fps stays under 30 for 3 s. Default everywhere, phones too.
// Full: antialias on, full res, chunk distance [2,1.5] / remove [3,2.5], no auto step.
// ?q=auto|lite|full pins a profile for tests; ?scale=n pins a render scale (old 1.1 flag, turns auto off).
const QKEY = 'bloxbert-quality'
const QP = {
  auto: { aa: false, add: [1.5, 1], rem: [2.5, 2] },
  lite: { aa: false, scale: 1.75, add: [1.5, 1], rem: [2.5, 2] },
  full: { aa: true, scale: 1, add: [2, 1.5], rem: [3, 2.5] },
}
let stored = null
try { stored = localStorage.getItem(QKEY) } catch (e) {}
let quality = QP[qs.get('q')] ? qs.get('q') : QP[stored] ? stored : 'auto'
const AA = QP[quality].aa // fixed for the life of the WebGL context
const PINNED = qs.has('scale')
let AUTO = quality === 'auto' && !PINNED && qs.get('auto') !== '0'
const BIG = innerWidth * innerHeight > 1366 * 768 * 1.15
const startLevel = (q) => QP[q].scale || (BIG ? 1.5 : 1)
let level = PINNED ? 1 / Math.max(0.5, Math.min(1, +qs.get('scale') || 1)) : startLevel(quality)
const MAX_LEVEL = 2

// ---------- language: chrome words from the Hub packs; ar / fa-AF go RTL ----------
let LANG = qs.get('lang') || ''
if (!LANG) { try { LANG = (JSON.parse(localStorage.getItem('kulibert-prefs-v1') || 'null') || {}).lang || '' } catch (e) {} }
const WORDS = {
  ar: { menu: 'القائمة', close: 'إغلاق', settings: 'الإعدادات', whatsNew: 'ما الجديد', help: 'مساعدة' },
  'fa-AF': { menu: 'فهرست', close: 'بستن', settings: 'تنظیمات', whatsNew: 'تازه\u200cها', help: 'کمک' },
}
if (WORDS[LANG]) {
  document.documentElement.lang = LANG; document.documentElement.dir = 'rtl'
  for (const el of document.querySelectorAll('[data-w]')) { const w = WORDS[LANG][el.dataset.w]; if (w) el.textContent = w }
  for (const el of document.querySelectorAll('[data-wl]')) { const w = WORDS[LANG][el.dataset.wl]; if (w) el.setAttribute('aria-label', w) }
}

const noa = new Engine({
  domElement: document.getElementById('stage'),
  debug: false, showFPS: false, silent: true, silentBabylon: true,
  antiAlias: AA, preserveDrawingBuffer: false, // AA off was the biggest spike win (51 vs 38 fps); only Full turns it on
  playerShadowComponent: false,
  chunkSize: 24,
  chunkAddDistance: QP[quality].add,
  chunkRemoveDistance: QP[quality].rem,
  clearColor: [0.62, 0.78, 0.86],
  ambientColor: [0.62, 0.66, 0.7],
  lightDiffuse: [0.95, 0.95, 0.92],
  lightVector: [0.6, -1, 0.35],
  playerStart: [0.5, 12, 0.5],
  playerAutoStep: true,
  stickyPointerLock: !TOUCH_UI, // never ask for pointer lock on touch
  dragCameraOutsidePointerLock: false,
  blockTestDistance: 8,
  texturePath: '',
})

const engine = noa.rendering.engine
engine.setHardwareScalingLevel(level)

// ---------- 20 blocks ----------
const tile = (n) => ({ textureURL: 'assets/atlas.png', atlasIndex: ATLAS[n] })
const mats = [
  'grass_top', 'dirt_grass', 'dirt', 'stone', 'greystone', 'stone_coal', 'sand', 'gravel_stone',
  'brick_red', 'brick_grey', 'wood', 'trunk_top', 'trunk_side', 'leaves', 'cotton_blue',
  'cotton_green', 'cotton_red', 'cotton_tan', 'snow', 'ice', 'redsand',
]
mats.forEach((m) => noa.registry.registerMaterial(m, tile(m)))
noa.registry.registerMaterial('glass', { textureURL: 'assets/glass.png', texHasAlpha: true })

// id, label, material(s), short tag (shape cue so colour is never the only cue)
export const BLOCKS = [
  [1, 'Grass', ['grass_top', 'dirt', 'dirt_grass'], 'G', 'grass_top'],
  [2, 'Dirt', 'dirt', 'D', 'dirt'],
  [3, 'Stone', 'stone', 'S', 'stone'],
  [4, 'Slate', 'greystone', 'Sl', 'greystone'],
  [5, 'Coal stone', 'stone_coal', 'Co', 'stone_coal'],
  [6, 'Sand', 'sand', 'Sa', 'sand'],
  [7, 'Gravel', 'gravel_stone', 'Gv', 'gravel_stone'],
  [8, 'Red brick', 'brick_red', 'Br', 'brick_red'],
  [9, 'Grey brick', 'brick_grey', 'Bg', 'brick_grey'],
  [10, 'Planks', 'wood', 'P', 'wood'],
  [11, 'Log', ['trunk_top', 'trunk_top', 'trunk_side'], 'L', 'trunk_side'],
  [12, 'Leaves', 'leaves', 'Lv', 'leaves'],
  [13, 'Blue wool', 'cotton_blue', 'Wb', 'cotton_blue'],
  [14, 'Green wool', 'cotton_green', 'Wg', 'cotton_green'],
  [15, 'Red wool', 'cotton_red', 'Wr', 'cotton_red'],
  [16, 'Tan wool', 'cotton_tan', 'Wt', 'cotton_tan'],
  [17, 'Snow', 'snow', 'Sn', 'snow'],
  [18, 'Ice', 'ice', 'I', 'ice'],
  [19, 'Red sand', 'redsand', 'Rs', 'redsand'],
  [20, 'Glass', 'glass', 'Gl', null],
]
// Materials use noa's 3-array form [top, bottom, sides]. (If a 6-array is ever used: index 2 renders the TOP face — RepoScout spike note.)
for (const [id, , material] of BLOCKS) {
  noa.registry.registerBlock(id, { material, opaque: id !== 20 })
}
const ID = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))

// ---------- world store (our copy is the source of truth) ----------
const S = 24
const saved = new Map() // 'ci,cj,ck' -> Uint16Array(S^3) for chunks a kid changed
let dirty = false

function hash(x, z) { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function heightAt(x, z) {
  return Math.round(3 + 2.2 * Math.sin(x / 19) * Math.cos(z / 23) + 1.2 * Math.sin((x + z) / 11))
}
function genVoxel(x, y, z) {
  const h = heightAt(x, z)
  if (y > h) {
    // a few small trees
    const cx = Math.floor(x / 9) * 9 + 4, cz = Math.floor(z / 9) * 9 + 4
    if (hash(cx, cz) < 0.18) {
      const th = heightAt(cx, cz)
      if (x === cx && z === cz && y <= th + 4) return ID.Log
      const dy = y - (th + 4), dx = x - cx, dz = z - cz
      if (dy >= -1 && dy <= 1 && Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) return ID.Leaves
    }
    return 0
  }
  if (y === h) return h <= 1 ? ID.Sand : ID.Grass
  if (y > h - 3) return ID.Dirt
  return ID.Stone
}
const key = (i, j, k) => i + ',' + j + ',' + k
function fillGenerated(data, x0, y0, z0) {
  // ndarray layout [S,S,S] row-major: idx = i*S*S + j*S + k
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
    data[i * S * S + j * S + k] = genVoxel(x0 + i, y0 + j, z0 + k)
  }
}
noa.world.on('worldDataNeeded', (id, arr, x, y, z) => {
  const s = saved.get(key(x / S, y / S, z / S))
  if (s) arr.data.set(s)
  else if (y < -S) arr.data.fill(ID.Stone)
  else if (y > 24) arr.data.fill(0)
  else fillGenerated(arr.data, x, y, z)
  noa.world.setChunkData(id, arr)
})
function getVoxel(x, y, z) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const s = saved.get(key(ci, cj, ck))
  if (!s) return cj * S < -S ? ID.Stone : cj * S > 24 ? 0 : genVoxel(x, y, z)
  return s[(x - ci * S) * S * S + (y - cj * S) * S + (z - ck * S)]
}
const undoStack = []
function edit(x, y, z, v) {
  const before = getVoxel(x, y, z)
  if (before === v) return false
  undoStack.push([x, y, z, before]); if (undoStack.length > 100) undoStack.shift()
  setVoxel(x, y, z, v); paintUndo()
  return true
}
function undo() {
  const u = undoStack.pop(); paintUndo()
  if (!u) { toast('Nothing to undo'); return false }
  setVoxel(u[0], u[1], u[2], u[3]); return true
}
function setVoxel(x, y, z, v) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const k = key(ci, cj, ck)
  let s = saved.get(k)
  if (!s) { s = new Uint16Array(S * S * S); fillGenerated(s, ci * S, cj * S, ck * S); saved.set(k, s) }
  const i = x - ci * S, j = y - cj * S, kk = z - ck * S
  s[i * S * S + j * S + kk] = v
  noa.setBlock(v, x, y, z)
  dirty = true
  markSave('Not saved yet')
}

// noa only rebuilds the view vector on mouse input, so set it ourselves for touch and tests
function setLook(h, p) {
  const c = noa.camera, max = Math.PI / 2 - 0.01
  c.heading = ((h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  c.pitch = Math.max(-max, Math.min(max, p))
  const d = c.getDirection()
  d[0] = Math.cos(c.pitch) * Math.sin(c.heading); d[1] = -Math.sin(c.pitch); d[2] = Math.cos(c.pitch) * Math.cos(c.heading)
}
setLook(0.6, 0.22)

// ---------- place / break ----------
let current = ID['Red brick']
function breakBlock() {
  const t = noa.targetedBlock
  if (!t) return false
  return edit(t.position[0], t.position[1], t.position[2], 0)
}
function placeBlock() {
  const t = noa.targetedBlock
  if (!t) return false
  const [x, y, z] = t.adjacent
  // don't place inside the player
  const p = noa.entities.getPosition(noa.playerEntity)
  if (Math.floor(p[0]) === x && Math.floor(p[2]) === z && (y === Math.floor(p[1]) || y === Math.floor(p[1] + 1))) return false
  return edit(x, y, z, current)
}
noa.inputs.down.on('fire', () => { if (noa.container.hasPointerLock) breakBlock() })
noa.inputs.down.on('alt-fire', () => { if (noa.container.hasPointerLock) placeBlock() })

// ---------- save (IndexedDB, kuliblocks shape, gzip via CompressionStream) ----------
const DB = 'kuliblocks-test', STORE = 'worlds', WORLD = 'cut1'
function idb() {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error)
  })
}
async function gz(u16) {
  const cs = new Blob([u16.buffer]).stream().pipeThrough(new CompressionStream('gzip'))
  const buf = new Uint8Array(await new Response(cs).arrayBuffer())
  let bin = ''; for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
  return btoa(bin)
}
async function ungz(b64) {
  const bin = atob(b64); const u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i)
  const ds = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint16Array(await new Response(ds).arrayBuffer())
}
async function snapshot() {
  const chunks = {}
  for (const [k, v] of saved) chunks[k] = await gz(v)
  const p = noa.entities.getPosition(noa.playerEntity)
  return {
    format: 'kuliblocks', v: 1, appVersion: 'bloxbert-test-' + VERSION, id: WORLD, title: 'Bertyville',
    ownerRef: null, seed: 1, spawn: [p[0], p[1], p[2]], chunkSize: S,
    palette: ['air', ...BLOCKS.map((b) => b[1].toLowerCase().replace(/ /g, '_'))],
    chunks, updatedAt: new Date().toISOString(),
  }
}
async function save() {
  const doc = await snapshot()
  const db = await idb()
  await new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(doc, WORLD); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
  dirty = false
  const bytes = JSON.stringify(doc).length
  markSave('Saved · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · ' + (bytes / 1024).toFixed(1) + ' KB')
  return bytes
}
async function load() {
  const db = await idb()
  const doc = await new Promise((res) => { const r = db.transaction(STORE).objectStore(STORE).get(WORLD); r.onsuccess = () => res(r.result); r.onerror = () => res(null) })
  if (!doc || doc.format !== 'kuliblocks') return false
  await applyDoc(doc)
  dirty = false
  markSave('Loaded your saved world')
  return true
}
// Check a save file before it touches the world. Throws a plain-words error.
async function readDoc(doc) {
  if (!doc || doc.format !== 'kuliblocks' || doc.v !== 1) throw new Error('That file is not a Bloxbert world.')
  if (doc.chunkSize !== S || !doc.chunks || typeof doc.chunks !== 'object') throw new Error('That world uses a different chunk size.')
  const out = new Map(), max = BLOCKS.length
  for (const k of Object.keys(doc.chunks)) {
    if (!/^-?\d+,-?\d+,-?\d+$/.test(k)) throw new Error('That world file is damaged.')
    const a = await ungz(doc.chunks[k])
    if (a.length !== S * S * S) throw new Error('That world file is damaged.')
    for (let i = 0; i < a.length; i++) if (a[i] > max) throw new Error('That world has blocks this version does not know.')
    out.set(k, a)
  }
  return out
}
async function applyDoc(doc) {
  const chunks = await readDoc(doc)
  saved.clear(); for (const [k, v] of chunks) saved.set(k, v)
  undoStack.length = 0; paintUndo()
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  if (Array.isArray(doc.spawn) && doc.spawn.every(Number.isFinite)) noa.entities.setPosition(noa.playerEntity, doc.spawn)
}
async function importFile(file) {
  if (file.size > 2 * 1024 * 1024) throw new Error('That file is too big for a world (over 2 MB).')
  let doc
  try { doc = JSON.parse(await file.text()) } catch (e) { throw new Error('That file is not a Bloxbert world.') }
  await applyDoc(doc)
  await save()
  markSave('Imported · saved on this device')
}
async function resetWorld() {
  saved.clear(); dirty = true; undoStack.length = 0; paintUndo()
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  noa.entities.setPosition(noa.playerEntity, [0.5, 12, 0.5])
  markSave('Fresh world (not saved yet)')
}
async function exportJSON() {
  const doc = await snapshot()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(doc)], { type: 'application/json' }))
  a.download = 'bloxbert-world.kuliblocks.json'; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
setInterval(() => { if (dirty) save() }, 20000)
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) save() })

// ---------- UI ----------
const $ = (id) => document.getElementById(id)
function markSave(text) { $('save-state').textContent = text }
function toast(text) { const el = $('toast'); el.textContent = text; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true }, 2400) }
function paintUndo() { const b = $('undo-btn'); if (b) b.disabled = !undoStack.length }

const bar = $('hotbar')
BLOCKS.forEach(([id, label, , tag, icon]) => {
  const b = document.createElement('button')
  b.className = 'slot'; b.type = 'button'; b.dataset.id = id
  b.setAttribute('aria-label', label)
  const sw = document.createElement('span'); sw.className = 'sw'
  if (icon) sw.style.backgroundPosition = '0 ' + (-ATLAS[icon] * 30) + 'px'
  else sw.classList.add('glass')
  if (icon) sw.style.backgroundSize = '30px ' + (mats.length * 30) + 'px'
  const t = document.createElement('span'); t.className = 'tag'; t.textContent = tag
  const l = document.createElement('span'); l.className = 'lbl'; l.textContent = label
  b.append(sw, t, l)
  b.addEventListener('click', () => pick(id))
  bar.append(b)
})
function pick(id) {
  current = id
  for (const el of bar.children) el.setAttribute('aria-pressed', String(+el.dataset.id === id))
  $('current').textContent = BLOCKS.find((b) => b[0] === id)[1]
}
pick(current)
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return
  const n = '1234567890'.indexOf(e.key)
  if (n >= 0) pick(n + 1)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo() }
})
noa.on('tick', () => {
  const s = noa.inputs.pointerState.scrolly
  if (s) { const i = BLOCKS.findIndex((b) => b[0] === current); pick(BLOCKS[(i + (s > 0 ? 1 : BLOCKS.length - 1)) % BLOCKS.length][0]) }
})

// drawer
const drawer = $('drawer'), scrim = $('scrim')
function openMenu(on) {
  drawer.classList.toggle('open', on); scrim.hidden = !on
  $('menu-btn').setAttribute('aria-expanded', String(on))
  if (on) { if (document.pointerLockElement) document.exitPointerLock(); drawer.querySelector('button').focus() }
}
$('menu-btn').addEventListener('click', () => openMenu(!drawer.classList.contains('open')))
$('close-btn').addEventListener('click', () => openMenu(false))
scrim.addEventListener('click', () => openMenu(false))
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openMenu(false) })
$('m-save').addEventListener('click', () => save())
$('m-load').addEventListener('click', () => load())
$('m-export').addEventListener('click', () => exportJSON())
$('m-import').addEventListener('click', () => $('import-file').click())
$('import-file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''
  if (!f) return
  try { await importFile(f); toast('World imported'); openMenu(false) } catch (err) { toast(err.message) }
})
$('undo-btn').addEventListener('click', () => undo())
$('save-btn').addEventListener('click', async () => { const b = await save(); toast('Saved · ' + (b / 1024).toFixed(1) + ' KB') })
paintUndo()
$('m-reset').addEventListener('click', () => { if (confirm('Start a fresh world? Your saved copy stays until you press Save.')) resetWorld() })
$('m-perf').addEventListener('click', () => $('perf').hidden = !$('perf').hidden)

// touch: drag to look, buttons to move / jump / place / break
const canvas = noa.container.canvas
let look = null
// 1.2: faster turning. Slow drags aim finely (0.007 rad/px ≈ 48° per 120 px); quick swipes speed up to 2x.
canvas.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') { look = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp } } })
canvas.addEventListener('pointermove', (e) => {
  if (!look || e.pointerId !== look.id) return
  const dx = e.clientX - look.x, dy = e.clientY - look.y
  const v = Math.hypot(dx, dy) / Math.max(4, e.timeStamp - look.t) // px per ms
  look.x = e.clientX; look.y = e.clientY; look.t = e.timeStamp
  const k = 0.007 * (1 + Math.min(1, v / 1.5))
  setLook(noa.camera.heading + dx * k, noa.camera.pitch + dy * k * 0.85)
})
const endLook = (e) => { if (look && e.pointerId === look.id) look = null }
canvas.addEventListener('pointerup', endLook); canvas.addEventListener('pointercancel', endLook)
for (const el of document.querySelectorAll('[data-hold]')) {
  const st = el.dataset.hold
  const on = (e) => { e.preventDefault(); noa.inputs.state[st] = true; el.classList.add('down') }
  const off = () => { noa.inputs.state[st] = false; el.classList.remove('down') }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off)
  el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off)
}
$('t-place').addEventListener('click', placeBlock)
$('t-break').addEventListener('click', breakBlock)
document.body.classList.toggle('touch', TOUCH_UI)

// perf readout + hooks for the headless measurement
const perf = { frames: [], first: 0, deltas: [], jsMs: [], steps: [], level: () => level, get auto() { return AUTO }, quality: () => quality, aa: AA }
// time the whole noa render call (scene render + our hooks) on the main thread
{ const sh = noa.container._shell, r = sh.onRender; sh.onRender = function (dt, a1, a2) { const a = performance.now(); r(dt, a1, a2); perf.jsMs.push(performance.now() - a); if (perf.jsMs.length > 2000) perf.jsMs.shift() } }
let last = performance.now(), n = 0, acc = 0, lowSecs = 0
function frame(t) {
  if (!perf.first) perf.first = performance.now() // ms since navigation start
  n++; acc += t - last; perf.deltas.push(t - last); if (perf.deltas.length > 4000) perf.deltas.shift(); last = t
  if (acc >= 1000) {
    const fps = (n * 1000) / acc; perf.frames.push(fps); n = 0; acc = 0
    // auto render scale: 3 slow seconds in a row -> render 0.25 coarser (ignore the first 4 s of loading)
    if (AUTO && performance.now() - perf.first > 4000) {
      if (fps < 30) { if (++lowSecs >= 3 && level < MAX_LEVEL) { level = Math.min(MAX_LEVEL, level + 0.25); engine.setHardwareScalingLevel(level); lowSecs = 0; perf.steps.push({ at: Math.round(performance.now()), level }); toast('Lower detail for speed') } }
      else lowSecs = 0
    }
    perf.lastFps = fps
    $('perf').textContent = fps.toFixed(0) + ' fps · ' + QNAME[quality] + ' · ' + Math.round(100 / level) + '% res · ' + noa.world._chunksKnown.count() + ' chunks'
    paintQualityNote()
  }
  requestAnimationFrame(frame)
}
noa.world.on('chunkAdded', () => { if (!perf.firstChunk) perf.firstChunk = performance.now() })
requestAnimationFrame(frame)
// ---------- Settings: quality switch ----------
const QNAME = { auto: 'Auto', lite: 'Lite', full: 'Full' }
function paintQuality() {
  for (const b of document.querySelectorAll('[data-q]')) {
    const on = b.dataset.q === quality
    b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on)
  }
  paintQualityNote()
}
function paintQualityNote() {
  const el = $('q-now'); if (!el) return
  el.textContent = 'Now: ' + QNAME[quality] + ' · ' + Math.round(100 / level) + '% detail' + (AUTO ? ' (drops by itself if it gets slow)' : '') + (AA ? ' · smooth edges on' : '')
}
async function setQuality(q) {
  if (!QP[q]) return
  try { localStorage.setItem(QKEY, q) } catch (e) {}
  if (QP[q].aa !== AA) {
    // smooth edges (antialias) can only change with a fresh 3D view: save, then reload once
    toast('Saving, then restarting the 3D view…')
    try { if (dirty) await save() } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete('q'); u.searchParams.delete('scale')
    location.replace(u.href)
    return
  }
  quality = q
  AUTO = q === 'auto' && !PINNED
  level = PINNED ? level : startLevel(q)
  engine.setHardwareScalingLevel(level); lowSecs = 0
  noa.world.setAddRemoveDistance(QP[q].add, QP[q].rem)
  paintQuality(); toast(QNAME[q] + ' quality')
}
for (const b of document.querySelectorAll('[data-q]')) b.addEventListener('click', () => setQuality(b.dataset.q))
paintQuality()

// ---------- layout: top bar height + re-fit on rotate / resize ----------
const topBar = document.querySelector('.top')
function refit() {
  document.documentElement.style.setProperty('--top-h', Math.ceil(topBar.getBoundingClientRect().height) + 'px')
  noa.rendering.resize()
}
new ResizeObserver(refit).observe(topBar)
addEventListener('resize', refit)
addEventListener('orientationchange', () => { refit(); setTimeout(refit, 300) })
if (window.visualViewport) visualViewport.addEventListener('resize', refit)
refit()

window.__blocks = {
  version: VERSION, setQuality, refit, get quality() { return quality }, get lang() { return LANG },
  noa, perf, save, load, resetWorld, placeBlock, breakBlock, pick, setVoxel, getVoxel, undo, importFile, exportDoc: snapshot,
  hold: (st, v) => { noa.inputs.state[st] = v },
  turn: (dh, dp = 0) => setLook(noa.camera.heading + dh, noa.camera.pitch + dp), setLook,
}

load().catch(() => {}).finally(() => markSave(saved.size ? 'Bertyville · loaded your save' : 'Bertyville · not saved yet'))
