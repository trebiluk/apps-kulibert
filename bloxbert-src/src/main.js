// Bloxbert 2.0.0 — student door at /blocks/. Pins: noa-engine develop @8a74866, @babylonjs/core 6.49.0.
// Proven in test 1.2 and kept: Auto / Lite / Full, phone wrap, 58°-class touch turn, rotate re-fit, RTL drawer from the left.
// __BLOX_STUDENT__ is replaced by the build. The student door does not ship window.__blocks.
const VERSION = '2.0.0'
import { Engine } from 'noa-engine'
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import ATLAS from '../assets/atlas.json'
import { STR } from './strings.js'

const T0 = performance.now()
if (!document.createElement('canvas').getContext('webgl2')) {
  document.getElementById('stage').innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px"><div style="max-width:440px;background:#111a2e;border:1px solid #22304d;border-radius:14px;padding:20px"><b style="font-size:18px">This device can\'t run 3D right now</b><p style="color:#9fb0c6">Bloxbert needs WebGL 2. Try restarting Chrome, or use another Chromebook or phone. Your saved world is still safe.</p></div></div>'
  throw new Error('Bloxbert: WebGL2 not available')
}
const coarse = matchMedia('(pointer: coarse)').matches
const qs = new URLSearchParams(location.search)
const TOUCH_UI = coarse || qs.has('touch')
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches

const QKEY = 'bloxbert-quality'
const QP = {
  auto: { aa: false, add: [1.5, 1], rem: [2.5, 2] },
  lite: { aa: false, scale: 1.75, add: [1.5, 1], rem: [2.5, 2] },
  full: { aa: true, scale: 1, add: [2, 1.5], rem: [3, 2.5] },
}
let stored = null
try { stored = localStorage.getItem(QKEY) } catch (e) {}
let quality = QP[qs.get('q')] ? qs.get('q') : QP[stored] ? stored : 'auto'
const AA = QP[quality].aa
const PINNED = qs.has('scale')
let AUTO = quality === 'auto' && !PINNED && qs.get('auto') !== '0'
const BIG = innerWidth * innerHeight > 1366 * 768 * 1.15
const startLevel = (q) => QP[q].scale || (BIG ? 1.5 : 1)
let level = PINNED ? 1 / Math.max(0.5, Math.min(1, +qs.get('scale') || 1)) : startLevel(quality)
const MAX_LEVEL = 2

let LANG = qs.get('lang') || ''
if (!LANG) { try { LANG = (JSON.parse(localStorage.getItem('kulibert-prefs-v1') || 'null') || {}).lang || '' } catch (e) {} }
if (!STR[LANG]) LANG = 'en'
function t(key) { return (STR[LANG] && STR[LANG][key]) || STR.en[key] || key }
function applyI18n() {
  document.documentElement.lang = LANG
  if (LANG === 'ar' || LANG === 'fa-AF') document.documentElement.dir = 'rtl'
  else document.documentElement.dir = 'ltr'
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n)
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel))
  const plate = document.getElementById('ver-plate')
  if (plate) plate.textContent = 'Bloxbert ' + VERSION
  const aboutPlate = document.getElementById('about-plate')
  if (aboutPlate) aboutPlate.textContent = 'Bloxbert ' + VERSION
}
applyI18n()

const SPAWN = [8.5, 8, 1.5]
const noa = new Engine({
  domElement: document.getElementById('stage'),
  debug: false, showFPS: false, silent: true, silentBabylon: true,
  antiAlias: AA, preserveDrawingBuffer: false,
  playerShadowComponent: false,
  chunkSize: 24,
  chunkAddDistance: QP[quality].add,
  chunkRemoveDistance: QP[quality].rem,
  clearColor: [0.62, 0.78, 0.86],
  ambientColor: [0.62, 0.66, 0.7],
  lightDiffuse: [0.95, 0.95, 0.92],
  lightVector: [0.6, -1, 0.35],
  playerStart: SPAWN,
  playerAutoStep: true,
  stickyPointerLock: !TOUCH_UI,
  dragCameraOutsidePointerLock: false,
  blockTestDistance: 10,
  texturePath: '',
})
const engine = noa.rendering.engine
engine.setHardwareScalingLevel(level)

const tile = (n) => ({ textureURL: 'assets/atlas.png', atlasIndex: ATLAS[n] })
const mats = [
  'grass_top', 'dirt_grass', 'dirt', 'stone', 'greystone', 'stone_coal', 'sand', 'gravel_stone',
  'brick_red', 'brick_grey', 'wood', 'trunk_top', 'trunk_side', 'leaves', 'cotton_blue',
  'cotton_green', 'cotton_red', 'cotton_tan', 'snow', 'ice', 'redsand',
]
mats.forEach((m) => noa.registry.registerMaterial(m, tile(m)))
noa.registry.registerMaterial('glass', { textureURL: 'assets/glass.png', texHasAlpha: true })

// id, name key, material, letter cue, atlas icon
export const BLOCKS = [
  [1, 'grass', ['grass_top', 'dirt', 'dirt_grass'], 'G', 'grass_top'],
  [2, 'dirt', 'dirt', 'D', 'dirt'],
  [3, 'stone', 'stone', 'S', 'stone'],
  [4, 'slate', 'greystone', 'Sl', 'greystone'],
  [5, 'coal', 'stone_coal', 'Co', 'stone_coal'],
  [6, 'sand', 'sand', 'Sa', 'sand'],
  [7, 'gravel', 'gravel_stone', 'Gv', 'gravel_stone'],
  [8, 'brickRed', 'brick_red', 'Br', 'brick_red'],
  [9, 'brickGrey', 'brick_grey', 'Bg', 'brick_grey'],
  [10, 'planks', 'wood', 'P', 'wood'],
  [11, 'log', ['trunk_top', 'trunk_top', 'trunk_side'], 'L', 'trunk_side'],
  [12, 'leaves', 'leaves', 'Lv', 'leaves'],
  [13, 'woolBlue', 'cotton_blue', 'Wb', 'cotton_blue'],
  [14, 'woolGreen', 'cotton_green', 'Wg', 'cotton_green'],
  [15, 'woolRed', 'cotton_red', 'Wr', 'cotton_red'],
  [16, 'woolTan', 'cotton_tan', 'Wt', 'cotton_tan'],
  [17, 'snow', 'snow', 'Sn', 'snow'],
  [18, 'ice', 'ice', 'I', 'ice'],
  [19, 'redSand', 'redsand', 'Rs', 'redsand'],
  [20, 'glass', 'glass', 'Gl', null],
]
for (const [id, , material] of BLOCKS) noa.registry.registerBlock(id, { material, opaque: id !== 20 })
const ID = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
const blockName = (id) => t(BLOCKS.find((b) => b[0] === id)[1])

const S = 24
const saved = new Map()
let dirty = false
function hash(x, z) { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function heightAt(x, z) {
  return Math.round(3 + 2.2 * Math.sin(x / 19) * Math.cos(z / 23) + 1.2 * Math.sin((x + z) / 11))
}
const TOWN = { x0: -20, x1: 36, z0: -18, z1: 28, y: 4 }
function inTown(x, z) { return x >= TOWN.x0 && x <= TOWN.x1 && z >= TOWN.z0 && z <= TOWN.z1 }
function box(x, z, x0, x1, z0, z1) { return x >= x0 && x <= x1 && z >= z0 && z <= z1 }
// Hand-made Bertyville on seed 1: workshop, gravel road, ice pond, three empty plots. Not a copied village.
function townVoxel(x, y, z) {
  const h = TOWN.y
  if (y < h - 3) return ID.stone
  if (y < h) return ID.dirt
  const pond = (x + 10) * (x + 10) + (z - 14) * (z - 14)
  const road = z >= -1 && z <= 1 && x >= -18 && x <= 34
  const shop = box(x, z, 4, 13, 4, 11)
  const plotA = box(x, z, 18, 25, 4, 11)
  const plotB = box(x, z, 18, 25, 15, 22)
  const plotC = box(x, z, 4, 11, 16, 23)
  if (y === h) {
    if (pond <= 16) return ID.ice
    if (pond <= 36) return ID.sand
    if (road) return ID.gravel
    if (shop) return ID.planks
    if (plotA || plotB || plotC) return (x === 18 || x === 25 || z === 4 || z === 11 || z === 15 || z === 22 || z === 16 || z === 23) && (plotA || plotB || plotC) ? ID.gravel : ID.grass
    return ID.grass
  }
  if (y > h && y <= h + 4 && shop) {
    const edge = x === 4 || x === 13 || z === 4 || z === 11
    const door = z === 4 && x >= 7 && x <= 10 && y <= h + 2
    const window = x === 13 && z === 7 && y === h + 2
    const post = (x === 4 || x === 13) && (z === 4 || z === 11)
    if (door) return 0
    if (window) return ID.glass
    if (post) return ID.log
    if (edge && y <= h + 3) return ID.brickRed
    if (y === h + 4) return ID.planks
    if (x === 6 && z === 8 && y === h + 1) return ID.planks
    return 0
  }
  if (y === h + 1) {
    if ((plotA && ((x === 18 && z === 4) || (x === 25 && z === 4) || (x === 18 && z === 11) || (x === 25 && z === 11)))
      || (plotB && ((x === 18 && z === 15) || (x === 25 && z === 15) || (x === 18 && z === 22) || (x === 25 && z === 22)))
      || (plotC && ((x === 4 && z === 16) || (x === 11 && z === 16) || (x === 4 && z === 23) || (x === 11 && z === 23)))) return ID.brickGrey
    if (x === 2 && z === 2) return ID.log
  }
  if (y === h + 2 && x === 2 && z === 2) return ID.woolBlue
  return 0
}
function genVoxel(x, y, z) {
  if (inTown(x, z)) return townVoxel(x, y, z)
  const h = heightAt(x, z)
  if (y > h) {
    const cx = Math.floor(x / 9) * 9 + 4, cz = Math.floor(z / 9) * 9 + 4
    if (hash(cx, cz) < 0.18 && !inTown(cx, cz)) {
      const th = heightAt(cx, cz)
      if (x === cx && z === cz && y <= th + 4) return ID.log
      const dy = y - (th + 4), dx = x - cx, dz = z - cz
      if (dy >= -1 && dy <= 1 && Math.abs(dx) <= 2 && Math.abs(dz) <= 2 && Math.abs(dx) + Math.abs(dz) + Math.abs(dy) <= 3) return ID.leaves
    }
    return 0
  }
  if (y === h) return h <= 1 ? ID.sand : ID.grass
  if (y > h - 3) return ID.dirt
  return ID.stone
}
const key = (i, j, k) => i + ',' + j + ',' + k
function fillGenerated(data, x0, y0, z0) {
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
    data[i * S * S + j * S + k] = genVoxel(x0 + i, y0 + j, z0 + k)
  }
}
noa.world.on('worldDataNeeded', (id, arr, x, y, z) => {
  const s = saved.get(key(x / S, y / S, z / S))
  if (s) arr.data.set(s)
  else if (y < -S) arr.data.fill(ID.stone)
  else if (y > 24) arr.data.fill(0)
  else fillGenerated(arr.data, x, y, z)
  noa.world.setChunkData(id, arr)
})
function getVoxel(x, y, z) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const s = saved.get(key(ci, cj, ck))
  if (!s) return cj * S < -S ? ID.stone : cj * S > 24 ? 0 : genVoxel(x, y, z)
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
  if (!u) { toast(t('nothingUndo')); return false }
  setVoxel(u[0], u[1], u[2], u[3]); return true
}
function drawVoxel(x, y, z, v) {
  // Our store is the truth. noa.setBlockID no-ops on an unloaded chunk; never trust it as a save.
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const chunk = noa.world._storage && noa.world._storage.getChunkByIndexes(ci, cj, ck)
  if (chunk) noa.setBlock(v, x, y, z)
}
function setVoxel(x, y, z, v) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const k = key(ci, cj, ck)
  let s = saved.get(k)
  if (!s) { s = new Uint16Array(S * S * S); fillGenerated(s, ci * S, cj * S, ck * S); saved.set(k, s) }
  const i = x - ci * S, j = y - cj * S, kk = z - ck * S
  s[i * S * S + j * S + kk] = v
  drawVoxel(x, y, z, v)
  dirty = true
  markSave(t('notSaved'))
}
function setLook(h, p) {
  const c = noa.camera, max = Math.PI / 2 - 0.01
  c.heading = ((h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  c.pitch = Math.max(-max, Math.min(max, p))
  const d = c.getDirection()
  d[0] = Math.cos(c.pitch) * Math.sin(c.heading); d[1] = -Math.sin(c.pitch); d[2] = Math.cos(c.pitch) * Math.cos(c.heading)
}
setLook(0, 0.18)

let current = ID.brickRed
let tableMode = false
let flying = false
let tableCursor = [8, TOWN.y + 1, 6]
function breakBlock() {
  const tget = tableMode ? tableTarget() : noa.targetedBlock
  if (!tget) return false
  return edit(tget.position[0], tget.position[1], tget.position[2], 0)
}
function placeBlock() {
  if (tableMode && !noa.targetedBlock) return edit(tableCursor[0], tableCursor[1], tableCursor[2], current)
  const tget = noa.targetedBlock
  if (!tget) return false
  const [x, y, z] = tget.adjacent
  if (!tableMode) {
    const p = noa.entities.getPosition(noa.playerEntity)
    if (Math.floor(p[0]) === x && Math.floor(p[2]) === z && (y === Math.floor(p[1]) || y === Math.floor(p[1] + 1))) return false
  }
  return edit(x, y, z, current)
}
function tableTarget() {
  return { position: tableCursor.slice(), adjacent: [tableCursor[0], tableCursor[1] + 1, tableCursor[2]] }
}
noa.inputs.down.on('fire', () => { if (!tableMode && noa.container.hasPointerLock) breakBlock() })
noa.inputs.down.on('alt-fire', () => { if (!tableMode && noa.container.hasPointerLock) placeBlock() })

const DB = __BLOX_STUDENT__ ? 'kuliblocks' : 'kuliblocks-test'
const STORE = 'worlds', WORLD = 'bertyville'
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
    format: 'kuliblocks', v: 1, appVersion: 'bloxbert-' + VERSION, id: WORLD, title: 'Bertyville',
    ownerRef: null, seed: 1, spawn: [p[0], p[1], p[2]], chunkSize: S,
    palette: ['air', ...BLOCKS.map((b) => b[1])],
    chunks, updatedAt: new Date().toISOString(),
  }
}
async function save() {
  const doc = await snapshot()
  const db = await idb()
  await new Promise((res, rej) => { const tx = db.transaction(STORE, 'readwrite'); tx.objectStore(STORE).put(doc, WORLD); tx.oncomplete = res; tx.onerror = () => rej(tx.error) })
  dirty = false
  const bytes = JSON.stringify(doc).length
  markSave(t('saved') + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · ' + (bytes / 1024).toFixed(1) + ' KB')
  return bytes
}
async function load() {
  const db = await idb()
  const doc = await new Promise((res) => { const r = db.transaction(STORE).objectStore(STORE).get(WORLD); r.onsuccess = () => res(r.result); r.onerror = () => res(null) })
  if (!doc || doc.format !== 'kuliblocks') return false
  await applyDoc(doc)
  dirty = false
  markSave(t('loaded'))
  return true
}
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
  markSave(t('imported'))
}
async function resetWorld() {
  saved.clear(); dirty = true; undoStack.length = 0; paintUndo()
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  noa.entities.setPosition(noa.playerEntity, SPAWN.slice())
  setLook(0, 0.18)
  markSave(t('fresh'))
}
async function exportJSON() {
  const doc = await snapshot()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(doc)], { type: 'application/json' }))
  a.download = 'bloxbert-bertyville.kuliblocks.json'; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
setInterval(() => { if (dirty) save() }, 20000)
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) save() })

const $ = (id) => document.getElementById(id)
function markSave(text) { const el = $('save-state'); if (el) el.textContent = text }
function toast(text) { const el = $('toast'); if (!el) return; el.textContent = text; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true }, 2400) }
function paintUndo() { const b = $('undo-btn'); if (b) b.disabled = !undoStack.length }

const bar = $('hotbar')
BLOCKS.forEach(([id, name, , tag, icon]) => {
  const b = document.createElement('button')
  b.className = 'slot'; b.type = 'button'; b.dataset.id = id
  b.setAttribute('aria-label', t(name) + ' ' + tag)
  const sw = document.createElement('span'); sw.className = 'sw pat-' + (id % 6)
  if (icon) {
    sw.style.backgroundPosition = '0 ' + (-ATLAS[icon] * 30) + 'px'
    sw.style.backgroundSize = '30px ' + (mats.length * 30) + 'px'
  } else sw.classList.add('glass')
  const tg = document.createElement('span'); tg.className = 'tag'; tg.textContent = tag
  const l = document.createElement('span'); l.className = 'lbl'; l.dataset.block = name; l.textContent = t(name)
  b.append(sw, tg, l)
  b.addEventListener('click', () => pick(id))
  bar.append(b)
})
function pick(id) {
  current = id
  for (const el of bar.children) el.setAttribute('aria-pressed', String(+el.dataset.id === id))
  $('current').textContent = blockName(id)
}
pick(current)
function repaintBlocks() {
  for (const el of bar.children) {
    const b = BLOCKS.find((x) => x[0] === +el.dataset.id)
    el.setAttribute('aria-label', t(b[1]) + ' ' + b[3])
    el.querySelector('.lbl').textContent = t(b[1])
  }
  $('current').textContent = blockName(current)
}

const drawer = $('drawer'), scrim = $('scrim')
function openMenu(on) {
  drawer.classList.toggle('open', on); scrim.hidden = !on
  $('menu-btn').setAttribute('aria-expanded', String(on))
  document.documentElement.toggleAttribute('data-kb-modal-open', on)
  if (on) { if (document.pointerLockElement) document.exitPointerLock(); drawer.querySelector('button').focus() }
}
$('menu-btn').addEventListener('click', () => openMenu(!drawer.classList.contains('open')))
$('close-btn').addEventListener('click', () => openMenu(false))
scrim.addEventListener('click', () => openMenu(false))
$('m-save').addEventListener('click', () => save())
$('m-load').addEventListener('click', () => load())
$('m-export').addEventListener('click', () => exportJSON())
$('m-import').addEventListener('click', () => $('import-file').click())
$('import-file').addEventListener('change', async (e) => {
  const f = e.target.files[0]; e.target.value = ''
  if (!f) return
  try { await importFile(f); toast(t('imported')); openMenu(false) } catch (err) { toast(err.message) }
})
$('undo-btn').addEventListener('click', () => undo())
$('save-btn').addEventListener('click', async () => { const b = await save(); toast(t('saved') + ' · ' + (b / 1024).toFixed(1) + ' KB') })
paintUndo()
$('m-reset').addEventListener('click', () => { if (confirm(t('confirmFresh'))) resetWorld() })
$('m-about').addEventListener('click', () => { $('about').hidden = false; $('about').querySelector('button').focus() })
$('about-close').addEventListener('click', () => { $('about').hidden = true })

let showSpeed = false
try { showSpeed = localStorage.getItem('bloxbert-fps') === 'on' } catch (e) {}
function paintSpeed() { $('perf').hidden = !showSpeed }
paintSpeed()
$('m-perf').addEventListener('click', () => {
  showSpeed = !showSpeed
  try { localStorage.setItem('bloxbert-fps', showSpeed ? 'on' : 'off') } catch (e) {}
  paintSpeed()
})

const TSKEY = 'bloxbert-text'
let textSize = 'm'
try { textSize = localStorage.getItem(TSKEY) || 'm' } catch (e) {}
function paintText() {
  document.documentElement.dataset.ts = textSize
  for (const b of document.querySelectorAll('[data-ts]')) b.classList.toggle('on', b.dataset.ts === textSize)
}
paintText()
for (const b of document.querySelectorAll('[data-ts]')) b.addEventListener('click', () => {
  textSize = b.dataset.ts
  try { localStorage.setItem(TSKEY, textSize) } catch (e) {}
  paintText()
})

function setMode(table) {
  tableMode = table
  document.body.classList.toggle('table', table)
  $('m-creative').classList.toggle('on', !table)
  $('m-creative').setAttribute('aria-pressed', String(!table))
  $('m-table').classList.toggle('on', table)
  $('m-table').setAttribute('aria-pressed', String(table))
  $('mode-chip').textContent = table ? t('buildTable') : t('creative')
  if (table) {
    if (document.pointerLockElement) document.exitPointerLock()
    noa.camera.zoomDistance = 16
    flying = false
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = 0
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    noa.entities.setPosition(noa.playerEntity, [8.5, 12, 8.5])
    setLook(0.4, 0.55)
  } else {
    noa.camera.zoomDistance = 0
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = flying ? 0 : 2
  }
}
$('m-creative').addEventListener('click', () => setMode(false))
$('m-table').addEventListener('click', () => { setMode(true); openMenu(false) })
if (qs.get('mode') === 'table') setMode(true)

let lastJump = 0
function onJumpTap() {
  if (tableMode) return
  const now = performance.now()
  if (now - lastJump < 350) {
    flying = !flying
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = flying ? 0 : 2
    if (!flying) body.velocity[1] = 0
    toast(flying ? t('flyOn') : t('flyOff'))
    lastJump = 0
    return
  }
  lastJump = now
}
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return
  if (e.key === 'Escape') { openMenu(false); return }
  const n = '1234567890'.indexOf(e.key)
  if (n >= 0 && !tableMode) pick(n + 1)
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) { e.preventDefault(); undo() }
  if (e.key === ' ' || e.code === 'Space') onJumpTap()
  if (!tableMode) return
  if (e.key === 'Enter') { e.preventDefault(); placeBlock(); return }
  const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key]
  if (!step) return
  e.preventDefault()
  const h = noa.camera.heading
  const fx = Math.round(Math.sin(h)), fz = Math.round(Math.cos(h))
  const rx = Math.round(Math.cos(h)), rz = Math.round(-Math.sin(h))
  tableCursor[0] += step[0] * rx + step[1] * fx
  tableCursor[2] += step[0] * rz + step[1] * fz
  if (e.shiftKey) tableCursor[1] += step[1] || step[0]
  tableCursor[1] = Math.max(1, Math.min(40, tableCursor[1]))
})
noa.on('tick', () => {
  const s = noa.inputs.pointerState.scrolly
  if (s && !tableMode) { const i = BLOCKS.findIndex((b) => b[0] === current); pick(BLOCKS[(i + (s > 0 ? 1 : BLOCKS.length - 1)) % BLOCKS.length][0]) }
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (tableMode) {
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = noa.inputs.state.jump = false
    noa.entities.setPosition(noa.playerEntity, [8.5, 12, 8.5])
  } else if (flying) {
    body.gravityMultiplier = 0
    body.velocity[1] = noa.inputs.state.jump ? 7 : 0
  }
  const follow = noa.ents.getState(noa.camera.cameraTarget, 'followsEntity')
  if (follow) {
    const base = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
    const moving = !tableMode && !REDUCE && (noa.inputs.state.forward || noa.inputs.state.backward || noa.inputs.state.left || noa.inputs.state.right)
    follow.offset[1] = base + (moving ? Math.sin(performance.now() / 180) * 0.045 : 0)
  }
})

const canvas = noa.container.canvas
let look = null
const TURN = 58 * Math.PI / 180 / 120
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && !tableMode && !TOUCH_UI) return
  look = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: 0 }
})
canvas.addEventListener('pointermove', (e) => {
  if (!look || e.pointerId !== look.id) return
  const dx = e.clientX - look.x, dy = e.clientY - look.y
  look.moved += Math.abs(dx) + Math.abs(dy)
  look.x = e.clientX; look.y = e.clientY; look.t = e.timeStamp
  setLook(noa.camera.heading + dx * TURN, noa.camera.pitch + dy * TURN * 0.85)
})
canvas.addEventListener('pointerup', (e) => {
  if (!look || e.pointerId !== look.id) return
  const tap = look.moved < 10
  look = null
  if (tableMode && tap) placeBlock()
})
canvas.addEventListener('pointercancel', () => { look = null })
for (const el of document.querySelectorAll('[data-hold]')) {
  const st = el.dataset.hold
  const on = (e) => { e.preventDefault(); noa.inputs.state[st] = true; el.classList.add('down'); if (st === 'jump') onJumpTap() }
  const off = () => { noa.inputs.state[st] = false; el.classList.remove('down') }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off)
  el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off)
}
$('t-place').addEventListener('click', placeBlock)
$('t-break').addEventListener('click', breakBlock)
$('table-place').addEventListener('click', placeBlock)
document.body.classList.toggle('touch', TOUCH_UI)

const scene = noa.rendering.getScene()
const s = 0.52
const outline = CreateLines('bb-outline', {
  points: [
    new Vector3(-s, -s, -s), new Vector3(s, -s, -s), new Vector3(s, -s, s), new Vector3(-s, -s, s), new Vector3(-s, -s, -s),
    new Vector3(-s, s, -s), new Vector3(s, s, -s), new Vector3(s, s, s), new Vector3(-s, s, s), new Vector3(-s, s, -s),
  ],
}, scene)
outline.color = new Color3(0.13, 0.83, 0.93)
outline.isPickable = false
outline.setEnabled(false)
noa.rendering.addMeshToScene(outline)
function paintOutline() {
  const tgt = noa.targetedBlock
  const pos = tgt ? tgt.position : (tableMode ? tableCursor : null)
  if (!pos) { outline.setEnabled(false); return }
  outline.setEnabled(true)
  const local = noa.globalToLocal([pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5], null, [])
  outline.position.copyFromFloats(local[0], local[1], local[2])
}
noa.on('beforeRender', paintOutline)

const perf = { frames: [], first: 0, deltas: [], jsMs: [], steps: [], level: () => level, get auto() { return AUTO }, quality: () => quality, aa: AA }
{ const sh = noa.container._shell, r = sh.onRender; sh.onRender = function (dt, a1, a2) { const a = performance.now(); r(dt, a1, a2); perf.jsMs.push(performance.now() - a); if (perf.jsMs.length > 2000) perf.jsMs.shift() } }
let last = performance.now(), n = 0, acc = 0, lowSecs = 0
function frame(tnow) {
  if (!perf.first) perf.first = performance.now()
  n++; acc += tnow - last; perf.deltas.push(tnow - last); if (perf.deltas.length > 4000) perf.deltas.shift(); last = tnow
  if (acc >= 1000) {
    const fps = (n * 1000) / acc; perf.frames.push(fps); n = 0; acc = 0
    if (AUTO && performance.now() - perf.first > 4000) {
      if (fps < 30) { if (++lowSecs >= 3 && level < MAX_LEVEL) { level = Math.min(MAX_LEVEL, level + 0.25); engine.setHardwareScalingLevel(level); lowSecs = 0; perf.steps.push({ at: Math.round(performance.now()), level }); toast(t('lowerDetail')) } }
      else lowSecs = 0
    }
    perf.lastFps = fps
    if (showSpeed) $('perf').textContent = fps.toFixed(0) + ' fps · ' + QNAME[quality] + ' · ' + Math.round(100 / level) + '% res · ' + noa.world._chunksKnown.count() + ' chunks'
    paintQualityNote()
  }
  requestAnimationFrame(frame)
}
noa.world.on('chunkAdded', () => { if (!perf.firstChunk) perf.firstChunk = performance.now() })
requestAnimationFrame(frame)
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
  el.textContent = QNAME[quality] + ' · ' + Math.round(100 / level) + '%' + (AUTO ? '' : '') + (AA ? '' : '')
}
async function setQuality(q) {
  if (!QP[q]) return
  try { localStorage.setItem(QKEY, q) } catch (e) {}
  if (QP[q].aa !== AA) {
    toast(t('save') + '…')
    try { await save() } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete('q'); u.searchParams.delete('scale')
    location.replace(u.href)
    return
  }
  quality = q
  AUTO = q === 'auto' && !PINNED
  level = PINNED ? level : startLevel(q)
  engine.setHardwareScalingLevel(level); lowSecs = 0
  noa.world.setAddRemoveDistance(QP[q].add, QP[q].rem)
  paintQuality(); toast(QNAME[q])
}
for (const b of document.querySelectorAll('[data-q]')) b.addEventListener('click', () => setQuality(b.dataset.q))
paintQuality()

const topBar = document.querySelector('.top')
function refit() {
  document.documentElement.style.setProperty('--top-h', Math.ceil(topBar.getBoundingClientRect().height) + 'px')
  noa.rendering.resize()
}
new ResizeObserver(refit).observe(topBar)
addEventListener('resize', refit)
addEventListener('orientationchange', () => { refit(); setTimeout(refit, 300) })
if (window.visualViewport) visualViewport.addEventListener('resize', refit)
document.addEventListener('fullscreenchange', refit)
document.addEventListener('webkitfullscreenchange', refit)
refit()

const FSKEY = 'kulibert-fullscreen'
function fsWant() { try { return localStorage.getItem(FSKEY) === 'on' } catch (e) { return false } }
function fsSet(v) { try { localStorage.setItem(FSKEY, v) } catch (e) {} }
function isFs() { return !!(document.fullscreenElement || document.webkitFullscreenElement) }
function installed() {
  try { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true } catch (e) { return false }
}
const iphone = /iPhone/.test(navigator.userAgent)
function canFs() {
  const el = document.documentElement
  return !!(el.requestFullscreen || el.webkitRequestFullscreen)
}
let fsFails = 0
async function enterFs() {
  const el = document.documentElement
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else throw new Error('no-fs')
    fsFails = 0
  } catch (e) {
    fsFails++
    if (fsFails >= 2) fsSet('off')
    throw e
  }
}
async function exitFs() {
  try {
    if (document.exitFullscreen && isFs()) await document.exitFullscreen()
    else if (document.webkitExitFullscreen && isFs()) document.webkitExitFullscreen()
  } catch (e) {}
}
function paintFs() {
  const btn = $('fs-btn')
  if (!btn) return
  const hide = isFs() || installed()
  btn.hidden = hide
  btn.setAttribute('aria-pressed', String(isFs()))
}
$('fs-btn').addEventListener('click', async () => {
  if (iphone && !canFs()) { $('fs-hint').hidden = false; return }
  fsSet('on'); fsFails = 0
  try { await enterFs() } catch (e) { if (iphone) $('fs-hint').hidden = false }
  paintFs()
})
$('fs-hint-close').addEventListener('click', () => { $('fs-hint').hidden = true })
document.querySelector('[data-fs-exit]').addEventListener('click', async () => { fsSet('off'); fsFails = 2; await exitFs(); paintFs() })
document.addEventListener('pointerup', () => {
  if (!fsWant() || isFs() || fsFails >= 2 || installed()) return
  enterFs().then(paintFs).catch(() => {})
}, { capture: true, passive: true })
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') return
  if (!fsWant() || isFs() || fsFails >= 2 || installed()) return
  enterFs().then(paintFs).catch(() => {})
}, { capture: true, passive: true })
document.addEventListener('fullscreenchange', paintFs)
document.addEventListener('webkitfullscreenchange', paintFs)
paintFs()

async function goHome() {
  await exitFs()
  const home = '/?hub=classic'
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'tech-room-home' }, location.origin)
    }
  } catch (e) {}
  try { (window.top || window).location.href = home } catch (e) { location.href = home }
}
$('m-hub').addEventListener('click', () => goHome())
document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a.kb-home, a.kb-drawer-home')
  if (!a) return
  e.preventDefault()
  goHome()
})
function fixHome() {
  for (const a of document.querySelectorAll('a.kb-home, a.kb-drawer-home')) a.setAttribute('href', '/?hub=classic')
}
fixHome(); setTimeout(fixHome, 600); setTimeout(fixHome, 1600)

if (!__BLOX_STUDENT__) {
  window.__blocks = {
    version: VERSION, setQuality, refit, get quality() { return quality }, get lang() { return LANG },
    noa, perf, save, load, resetWorld, placeBlock, breakBlock, pick, setVoxel, getVoxel, undo, importFile, exportDoc: snapshot,
    hold: (st, v) => { noa.inputs.state[st] = v },
    turn: (dh, dp = 0) => setLook(noa.camera.heading + dh, noa.camera.pitch + dp), setLook,
  }
}

load().catch(() => {}).finally(() => markSave(saved.size ? t('bertyville') + ' · ' + t('loaded') : t('bertyville') + ' · ' + t('notSaved')))
repaintBlocks()
void T0
