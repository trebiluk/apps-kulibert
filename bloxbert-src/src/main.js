// Bloxbert 2.0.0 — student door at /blocks/. Pins: noa-engine develop @8a74866, @babylonjs/core 6.49.0.
// Proven in test 1.2 and kept: Auto / Lite / Full, phone wrap, 58°-class touch turn, rotate re-fit, RTL drawer from the left.
// __BLOX_STUDENT__ is replaced by the build. The student door does not ship window.__blocks.
const VERSION = '2.5.33'
import { Engine } from 'noa-engine'
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Scene } from '@babylonjs/core/scene'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import ATLAS from '../assets/atlas.json'
import { STR } from './strings.js'
import { EXTRA } from './strings-extra.js'
import { createEdits } from './world-edit.js'
import { createLog } from './change-log.js'
import { withFloor } from './world-floor.js'
import { mountPanels } from './panels.js'
import { createSession } from './session.js'
import { CHANGELOG } from './changelog.js'
import { blockIcon } from './icons.js'
import { createStations } from './stations.js'
import { createTools } from './tools.js'
import { createLearn } from './learn.js'
import { fromDoc } from './save.js'
import { JUMP_V, GRAV_MULT, FLY_V, speedFor, overlapsPlayer, mineMs, inReach, reachFor, crackStage, crackVisible, advanceDig, keepCrouchStep, shouldRepeatPlace, capAir, WALK } from './feel.js'

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
function t(key) {
  const hit = (EXTRA[LANG] && EXTRA[LANG][key]) || (STR[LANG] && STR[LANG][key]) || (EXTRA.en && EXTRA.en[key]) || (STR.en && STR.en[key])
  if (!hit) { console.warn('missing string', key); return EXTRA.en[key] || key }
  return hit
}
function applyI18n() {
  document.documentElement.lang = LANG
  if (LANG === 'ar' || LANG === 'fa-AF') document.documentElement.dir = 'rtl'
  else document.documentElement.dir = 'ltr'
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n)
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel))
  const plate = document.getElementById('ver-plate')
  if (plate) plate.textContent = VERSION
  const aboutPlate = document.getElementById('about-plate')
  if (aboutPlate) aboutPlate.textContent = VERSION
  const pick = document.getElementById('pick-chip')
  if (pick && pick.dataset.ready) pick.textContent = t('pickChip') + (pick.classList.contains('on') ? ' ✓' : '')
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
  clearColor: [0.64, 0.8, 0.93],
  ambientColor: [0.78, 0.82, 0.88],
  lightDiffuse: [1.15, 1.08, 0.98],
  lightSpecular: [0.16, 0.16, 0.14],
  lightVector: [0.35, -1, 0.2],
  playerStart: SPAWN,
  playerAutoStep: true,
  stickyPointerLock: !TOUCH_UI,
  dragCameraOutsidePointerLock: false,
  blockTestDistance: 10,
  texturePath: '',
})
const engine = noa.rendering.engine
engine.setHardwareScalingLevel(level)
const moveState = noa.ents.getMovement(noa.playerEntity)
const playerBody = noa.ents.getPhysicsBody(noa.playerEntity)
playerBody.gravityMultiplier = GRAV_MULT
playerBody.airDrag = 0
playerBody.autoStep = !!TOUCH_UI
moveState.airJumps = 0
moveState.jumpImpulse = 0
moveState.jumpForce = 0
moveState.jumpTime = 0
moveState.airMoveMult = 0.6
moveState.maxSpeed = 4.3
noa.inputs.unbind('alt-fire')
noa.inputs.bind('alt-fire', 'Mouse3')
noa.inputs.unbind('mid-fire')
noa.inputs.bind('mid-fire', 'Mouse2')

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
  [21, 'coreplate', 'coreplate', 'Cp', null],
  [22, 'workbench', 'workbench', 'Wk', null],
  [23, 'oven', 'oven', 'Ov', null],
  [24, 'vend', 'vend', 'Vc', null],
  [25, 'storeCounter', 'store', 'Sc', null],
  [26, 'bunk', 'bunk', 'Bk', null],
]
noa.registry.registerMaterial('coreplate', { textureURL: 'assets/tile-coreplate.png' })
noa.registry.registerMaterial('workbench', { textureURL: 'assets/tile-workbench.png' })
noa.registry.registerMaterial('oven', { textureURL: 'assets/tile-oven.png' })
noa.registry.registerMaterial('vend', { textureURL: 'assets/tile-vend.png' })
noa.registry.registerMaterial('store', { textureURL: 'assets/tile-store.png' })
noa.registry.registerMaterial('bunk', { textureURL: 'assets/tile-bunk.png' })
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
    if (x === 8 && z === 9 && y === h + 1) return ID.storeCounter
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
  if (y === -64) return ID.coreplate
  if (y < -64) return 0
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
  if (y > -64) return ID.stone
  return 0
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
  else if (y > 24) arr.data.fill(0)
  else fillGenerated(arr.data, x, y, z)
  noa.world.setChunkData(id, arr)
})
function getVoxel(x, y, z) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const s = saved.get(key(ci, cj, ck))
  if (!s) return genVoxel(x, y, z)
  return s[(x - ci * S) * S * S + (y - cj * S) * S + (z - ck * S)]
}
function setVoxel(x, y, z, v, draw = true) {
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const k = key(ci, cj, ck)
  let s = saved.get(k)
  if (!s) { s = new Uint16Array(S * S * S); fillGenerated(s, ci * S, cj * S, ck * S); saved.set(k, s) }
  const i = x - ci * S, j = y - cj * S, kk = z - ck * S
  s[i * S * S + j * S + kk] = v
  if (draw) drawVoxel(x, y, z, v)
  dirty = true
  markSave(t('notSaved'))
}
const edits = createEdits({
  getVoxel,
  setVoxel,
  invalidate: (box) => noa.world.invalidateVoxelsInAABB(box),
})
const changeLog = createLog({ dbName: __BLOX_STUDENT__ ? 'bloxlog' : 'bloxlog-test', worldId: 'bertyville', chunkSize: S })
function edit(x, y, z, v) {
  const group = edits.applyEdit([[x, y, z, v]], { source: 'hand', label: 'hand' })
  if (group) changeLog.note(group)
  return !!group
}
function undo() {
  if (session && !session.beforeUndo()) return false
  const group = edits.undo()
  if (!group) { toast(t('nothingUndo')); return false }
  if (session) session.afterUndo()
  changeLog.note(group, 'you')
  toast(t('undid').replace('{n}', String(group.n)))
  return true
}
function redo() {
  if (session && !session.beforeRedo()) return false
  const group = edits.redo()
  if (!group) return false
  if (session) session.afterRedo()
  changeLog.note(group, 'you')
  toast(t('redid').replace('{n}', String(group.n)))
  return true
}
setInterval(() => { const run = () => changeLog.flush().catch(() => {}); if (window.requestIdleCallback) requestIdleCallback(run); else run() }, 10000)
document.addEventListener('visibilitychange', () => { if (document.hidden) changeLog.flush().catch(() => {}) })
changeLog.prune().catch(() => {})
function drawVoxel(x, y, z, v) {
  // Our store is the truth. noa.setBlockID no-ops on an unloaded chunk; never trust it as a save.
  const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
  const chunk = noa.world._storage && noa.world._storage.getChunkByIndexes(ci, cj, ck)
  if (chunk) noa.setBlock(v, x, y, z)
}
function setLook(h, p) {
  const c = noa.camera, max = 85 * Math.PI / 180
  c.heading = ((h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  c.pitch = Math.max(-max, Math.min(max, p))
  const d = c.getDirection()
  d[0] = Math.cos(c.pitch) * Math.sin(c.heading); d[1] = -Math.sin(c.pitch); d[2] = Math.cos(c.pitch) * Math.cos(c.heading)
}
setLook(0, 0.18)

let current = ID.brickRed
let tableMode = false
let flying = false
let inspectOn = false
let holdPick = false
let tableCursor = [8, TOWN.y + 1, 6]
let session = null
let panels = null
function survivalOn() { return !!(session && session.mode === 'survival') }
function canReach(pos) {
  if (!pos) return false
  const p = noa.entities.getPosition(noa.playerEntity)
  return inReach(p[0], p[1], p[2], pos[0], pos[1], pos[2], reachFor(survivalOn()))
}
function breakAt(x, y, z) {
  const id = getVoxel(x, y, z)
  if (!id) return false
  if (id === ID.vend || id === ID.bunk) return false
  if (!tableMode && !canReach([x, y, z])) return false
  if (session && !session.onBreak(x, y, z, id)) return false
  return edit(x, y, z, 0)
}
function breakBlock() {
  const tget = tableMode ? tableTarget() : noa.targetedBlock
  if (!tget) return false
  const [x, y, z] = tget.position
  return breakAt(x, y, z)
}
function placeBlock(face) {
  if (inspectOn) { showInspect(); return false }
  const aimedBlock = face && face.position ? face : noa.targetedBlock
  if (aimedBlock && panels) {
    const [ax, ay, az] = aimedBlock.position
    if (aimedBlock.blockID === ID.storeCounter && session && session.mode === 'survival') { panels.open('shop'); return false }
    if (aimedBlock.blockID === ID.oven || aimedBlock.blockID === 23) { panels.open('station', aimedBlock.position.join(',')); return false }
    if (aimedBlock.blockID === ID.bench || aimedBlock.blockID === 22) { panels.open('bench', aimedBlock.position.join(',')); return false }
    if (aimedBlock.blockID === ID.vend) { panels.open('counter', ax + ',' + ay + ',' + az); return false }
    if (aimedBlock.blockID === ID.bunk) { panels.open('bunk', ax + ',' + ay + ',' + az); return false }
  }
  let x, y, z
  if (tableMode && !aimedBlock) { x = tableCursor[0]; y = tableCursor[1]; z = tableCursor[2] }
  else {
    if (!aimedBlock) return false
    ;[x, y, z] = aimedBlock.adjacent
    if (!tableMode) {
      if (!canReach([x, y, z])) return false
      const p = noa.entities.getPosition(noa.playerEntity)
      if (overlapsPlayer(x, y, z, p[0], p[1], p[2])) return false
    }
  }
  const id = session && session.mode === 'survival' ? (session.blockForHot() || 0) : current
  if (session && session.mode === 'survival' && !id) { toast(t('noItem').replace('{item}', t('stone'))); return false }
  if (session && !session.onPlace(x, y, z, id)) return false
  return edit(x, y, z, id)
}
function tableTarget() {
  return { position: tableCursor.slice(), adjacent: [tableCursor[0], tableCursor[1] + 1, tableCursor[2]] }
}
noa.inputs.down.on('fire', () => {
  if (inspectOn) { showInspect(); return }
  if (tableMode || !noa.container.hasPointerLock) return
  if (survivalOn()) beginDig('mouse')
  else { breakBlock(); dig = { kind: 'mouse', creative: true, t0: performance.now() } }
})
noa.inputs.down.on('alt-fire', () => {
  if (inspectOn) { showInspect(); return }
  if (!tableMode && noa.container.hasPointerLock) {
    placeBlock()
    if (!TOUCH_UI) { mouseRight = true; placeHoldAt = performance.now() }
  }
})
noa.inputs.down.on('mid-fire', () => pickAimed())

const DB = __BLOX_STUDENT__ ? 'kuliblocks' : 'kuliblocks-test'
const STORE = 'worlds'
function teacherOn() {
  try { return localStorage.getItem('bloxbert-teacher') === '1' } catch (e) { return false }
}
function setTeacher(on) {
  try { localStorage.setItem('bloxbert-teacher', on ? '1' : '0') } catch (e) {}
  toast(on ? t('teacherOn') : t('teacherOff'))
  if (!on && WORLD === 'bertyville') {
    WORLD = 'bertyville-survival'
    try { localStorage.setItem('bloxbert-last-world', WORLD) } catch (e) {}
    if (session) session.setMode('survival')
    paintModeChip()
    load()
  }
}
let sentToSurvival = false
let WORLD = 'bertyville-survival'
try {
  const savedWorld = localStorage.getItem('bloxbert-last-world')
  if (savedWorld) WORLD = savedWorld
  if (!teacherOn() && WORLD === 'bertyville') {
    WORLD = 'bertyville-survival'
    sentToSurvival = true
    localStorage.setItem('bloxbert-last-world', WORLD)
  }
} catch (e) {}
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
    format: 'kuliblocks', v: 2, appVersion: 'bloxbert-' + VERSION, id: WORLD, title: 'Bertyville',
    ownerRef: null, seed: 1, spawn: [p[0], p[1], p[2]], chunkSize: S,
    palette: ['air', ...BLOCKS.map((b) => b[1])],
    chunks, updatedAt: new Date().toISOString(),
    ...(session ? session.dump() : { player: { mode: 'creative', bag: [], hot: 0, home: null, table: false }, econ: null, meta: {} }),
    stations: stations.dump(),
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
  if (!doc || doc.format !== 'kuliblocks' || (doc.v !== 1 && doc.v !== 2)) throw new Error(t('versionSkew'))
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
  edits.clear(); paintUndo()
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  if (Array.isArray(doc.spawn) && doc.spawn.every(Number.isFinite)) noa.entities.setPosition(noa.playerEntity, doc.spawn)
  if (session) session.load(fromDoc(doc))
  if (doc.stations) stations.load(doc.stations)
  const chip = $('mode-chip')
  if (chip && session) chip.textContent = session.mode === 'survival' ? t('survival') + ' · ' + t('practice') : t('creative')
  syncDropMeshes()
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
  saved.clear(); dirty = true; edits.clear(); paintUndo()
  changeLog.clearWorld().catch(() => {})
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  if (session && session.clearLoose) session.clearLoose()
  syncDropMeshes()
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
function paintModeChip() {
  const chip = $('mode-chip')
  if (!chip) return
  if (tableMode) { chip.textContent = t('buildTable'); return }
  chip.textContent = session && session.mode === 'survival' ? t('survival') + ' · ' + t('practice') : t('creative')
  const creative = $('m-creative')
  if (creative) creative.hidden = !teacherOn()
  const surv = $('m-survival')
  if (surv) {
    const on = !tableMode && session && session.mode === 'survival'
    surv.classList.toggle('on', on)
    surv.setAttribute('aria-pressed', String(on))
  }
}
function markSave(text) { const el = $('save-state'); if (el) el.textContent = text }
function toast(text) { const el = $('toast'); if (!el) return; el.textContent = text; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { el.hidden = true }, 2400) }
function paintUndo() {
  const u = $('undo-btn'); if (u) u.disabled = !edits.canUndo
  const r = $('redo-btn'); if (r) r.disabled = !edits.canRedo
}
let selfUnlock = false
let lastPointer = null
session = createSession({
  t, toast, getVoxel,
  pos: () => noa.entities.getPosition(noa.playerEntity),
  heading: () => noa.camera.heading,
  markDirty: () => { dirty = true },
  tableOn: () => tableMode,
  open: (id) => panels && panels.open(id),
  close: () => panels && panels.close(),
  removeBlock: (x, y, z) => edit(x, y, z, 0),
  assign: (id) => bagPick(typeof id === 'number' ? BLOCKS.find((b) => b[0] === id)?.[1] || 'stone' : id, selectedSlot),
  blockIcon: (id) => blockIcon(BLOCKS.find((b) => b[0] === id) || BLOCKS[2], ATLAS),
  flash: (name) => flashHeld(name),
  paintBar: () => { paintBar(); selectSlot(selectedSlot) },
  teacher: () => teacherOn(),
  setTeacher: (on) => setTeacher(on),
})
const stations = createStations({ t, give: (item, n) => session && session.give && session.give(item, n || 1), spend: (item, n) => !session || session.mode !== 'survival' || (session.spend && session.spend(item, n)), have: (item) => session && session.bag ? session.bag.count(item) : 0, creative: () => !session || session.mode !== 'survival', name: (k) => t(k), icon: (item) => {
  const hit = BLOCKS.find((b) => b[1] === item)
  if (hit) return blockIcon(hit, ATLAS)
  const c = document.createElement('canvas')
  c.width = c.height = 32
  c.dataset.item = item
  const g = c.getContext('2d')
  g.fillStyle = item === 'flour' ? '#f3e2b3' : item === 'sugar' ? '#f7f7f7' : '#c4494a'
  g.fillRect(0, 0, 32, 32)
  return c
} })
async function goWorld(m) {
  if (m === 'creative' && !teacherOn()) { toast(t('buildLocked')); return }
  await save()
  WORLD = m === 'survival' ? 'bertyville-survival' : 'bertyville'
  try { localStorage.setItem('bloxbert-last-world', WORLD) } catch (e) {}
  changeLog.setWorld(WORLD)
  session.setMode(m)
  paintModeChip()
  await load()
  if (panels) panels.close()
}
let holdTour = () => {}
panels = mountPanels({
  t, toast,
  save: () => save(),
  load: () => load(),
  exportWorld: () => exportJSON(),
  importWorld: () => $('import-file').click(),
  fresh: () => resetWorld(),
  hub: () => goHome(),
  teacher: () => teacherOn(),
  setTeacher: (on) => setTeacher(on),
  fullScreen: () => $('fs-btn').click(),
  inspect: () => setInspect(true),
  table: () => setMode(true),
  setWorldMode: (m) => goWorld(m),
  onClose: () => { try { noa.setPaused(false) } catch (e) {} session.paused = false },
  paintBag: (g) => session.paintBag(g),
  paintCraft: (g) => session.paintCraft(g),
  paintShop: (g) => session.paintShop(g),
  paintWallet: (g) => session.paintWallet(g),
  paintSettings: (g) => { session.paintSettings(g); paintLook(g) },
  paintTeacher: (g) => session.paintTeacher(g),
  paintPrices: (g) => session.paintPrices(g),
  paintCounter: (g, key) => session.paintCounter(g, key),
  paintBunk: (g, key) => session.paintBunk(g, key),
  tools: () => { const strip = $('tool-strip'); if (strip) strip.hidden = false },
  leave: async () => { await save(); location.href = '/' },
  paintBuilds: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('myBuilds') })),
  paintRewind: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('undoMinutes') })),
  paintSnaps: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('snapshots') })),
  paintTour: (g) => learn.paintTour(g),
  paintGoals: (g) => learn.paintGoals(g),
  paintA11y: (g) => learn.paintA11y(g),
  paintLog: (g) => {
    for (const row of CHANGELOG) {
      const p = document.createElement('p')
      p.className = 'gnote'
      const lines = (row.lines[LANG] || row.lines.en).join(' ')
      p.textContent = row.v + (row.v === VERSION ? ' · ' + t('youAreHere') : '') + ' · ' + lines
      g.append(p)
    }
  },
  paintStation: (g, key, kind) => stations.paint(g, key || '0,5,0', kind || 'oven'),
  holdTour: () => holdTour(),
})
const learn = createLearn({
  t, toast, close: () => panels.close(),
  openTour: () => panels.open('tour'),
  panel: () => (panels && panels.openPanel) || '',
  pay: (n) => session && session.wallet && session.wallet.post({ kind: 'goal', cogs: n, by: 'you' }),
})
holdTour = () => learn.cancelAuto()
const tools = createTools({
  t, toast, getVoxel,
  survival: () => session && session.mode === 'survival',
  have: (id) => session && session.haveBlock ? session.haveBlock(id) : 0,
  spendBlock: (id, n) => session && session.spendBlock && session.spendBlock(id, n),
  noteBag: (need) => session && session.noteBag && session.noteBag(need),
  heldBlock: () => session && session.blockForHot ? session.blockForHot() : 0,
  blockName: (id) => blockName(id),
  names: () => ['air', ...BLOCKS.map((b) => b[1])],
  current: () => current,
  aim: () => (noa.targetedBlock ? noa.targetedBlock.adjacent : [8, 6, 8]),
  apply: (ops, label) => {
    const g = edits.applyEdit(ops, { source: 'tool', label })
    if (g) changeLog.note(g, 'you')
    toast(label)
    return g
  },
})
for (const b of document.querySelectorAll('#tool-strip [data-tool]')) {
  b.addEventListener('click', () => {
    const name = b.dataset.tool
    if (name === 'close') { $('tool-strip').hidden = true; tools.cancel(); return }
    if (name === 'do') { tools.confirm(); return }
    if (name === 'cancel') { tools.cancel(); return }
    const res = tools.act(name)
    if (!res && name !== 'select' && !tools.box()) toast(t('tapCorner'))
  })
}
$('game-menu').setAttribute('aria-label', t('menu'))
$('game-menu').addEventListener('click', () => openMenu(true))
$('ver-plate').addEventListener('click', () => { openMenu(true); panels.open('log') })
$('wallet-chip').addEventListener('click', () => { openMenu(true); panels.open('wallet') })
let menuFromLock = false
document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && !selfUnlock && !tableMode && !menuFromLock) { menuFromLock = true; openMenu(true) }
  selfUnlock = false
  if (document.pointerLockElement) menuFromLock = false
})
noa.on('tick', () => {
  const p = noa.entities.getPosition(noa.playerEntity)
  if (p[1] < -72) poof()
})
function poof() {
  const home = session && session.home
  const spot = home ? home : SPAWN
  noa.entities.setPosition(noa.playerEntity, spot.slice ? spot.slice() : [spot[0], spot[1], spot[2]])
  flying = false
  document.body.classList.remove('fly')
  const body = noa.entities.getPhysicsBody && noa.entities.getPhysicsBody(noa.playerEntity)
  if (body) body.gravityMultiplier = GRAV_MULT
  const fx = $('poof'); if (fx) { fx.hidden = false; setTimeout(() => { fx.hidden = true }, 240) }
  toast(home ? t('poofBunk') : t('poofTown'))
  if (dirty) save()
}
if (!localStorage.getItem('bloxbert-menu-hint')) {
  const hint = $('menu-hint')
  if (hint) { hint.hidden = false; hint.textContent = TOUCH_UI ? t('menuHintTouch') : t('menuHint') }
}

const bar = $('hotbar')
const barIds = [1, 2, 3, 4, 5, 6, 7, 8, 9]
let selectedSlot = 0
function paintBar() {
  bar.innerHTML = ''
  barIds.forEach((id, i) => {
    const b = document.createElement('button')
    b.className = 'slot'
    b.type = 'button'
    b.dataset.slot = String(i)
    b.dataset.id = String(id)
    const block = BLOCKS.find((x) => x[0] === id) || BLOCKS[2]
    const name = block[1]
    b.setAttribute('aria-label', t(name))
    b.setAttribute('aria-pressed', String(i === selectedSlot))
    const l = document.createElement('span')
    l.className = 'lbl'
    l.textContent = t(name)
    b.append(l)
    b.addEventListener('click', () => selectSlot(i))
    b.prepend(blockIcon(block, ATLAS))
    bar.append(b)
  })
  const bag = document.createElement('button')
  bag.type = 'button'
  bag.className = 'slot bag-tile'
  bag.dataset.bag = '1'
  bag.innerHTML = '<span class="gic"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M6 8h12v12H6z" fill="none" stroke="currentColor"/></svg></span><span class="lbl"></span>'
  bag.querySelector('.lbl').textContent = t('bag')
  bag.addEventListener('click', () => { openMenu(true); panels.open('inventory') })
  bar.append(bag)
}
function useSelected() {
  if (survivalOn() && session && session.useHeld) { session.useHeld(); return }
  flashHeld(blockName(current))
}
function selectSlot(i) {
  const n = (i + 9) % 9
  const same = n === selectedSlot && current === barIds[n]
  selectedSlot = n
  current = barIds[n]
  if (!same) paintBar()
  const name = blockName(current)
  const el = $('current')
  if (el) el.textContent = name
  flashHeld(name)
}
function pick(id) {
  barIds[selectedSlot] = id
  current = id
  paintBar()
  $('current').textContent = blockName(id)
  flashHeld(blockName(id))
}
function flashHeld(name) {
  const chip = $('held-chip')
  if (!chip) return
  chip.textContent = name
  chip.hidden = false
  clearTimeout(flashHeld.t)
  flashHeld.t = setTimeout(() => { chip.hidden = true }, 1500)
}
function bagPick(item, slot) {
  selectedSlot = slot
  const id = typeof item === 'number' ? item : (BLOCKS.find((b) => b[1] === item) || [1])[0]
  pick(id)
}
function aimed() {
  if (lastPointer) {
    const hit = rayAt(lastPointer.x, lastPointer.y)
    if (hit) return hit
  }
  if (noa.targetedBlock && noa.targetedBlock.blockID) return { id: noa.targetedBlock.blockID, pos: noa.targetedBlock.position }
  if (tableMode) {
    const id = getVoxel(tableCursor[0], tableCursor[1], tableCursor[2])
    if (id) return { id, pos: tableCursor.slice() }
  }
  return null
}
function rayAt(cx, cy) {
  try {
    const scene = noa.rendering.getScene()
    const rect = canvas.getBoundingClientRect()
    const hit = scene.pick(cx - rect.left, cy - rect.top)
    if (!hit || !hit.hit || !hit.pickedPoint) return null
    const n = hit.getNormal ? hit.getNormal() : { x: 0, y: 1, z: 0 }
    const x = Math.floor(hit.pickedPoint.x - n.x * 0.05)
    const y = Math.floor(hit.pickedPoint.y - n.y * 0.05)
    const z = Math.floor(hit.pickedPoint.z - n.z * 0.05)
    const id = getVoxel(x, y, z)
    if (!id) return null
    const nx = Math.round(n.x), ny = Math.round(n.y), nz = Math.round(n.z)
    return { id, blockID: id, pos: [x, y, z], position: [x, y, z], adjacent: [x + nx, y + ny, z + nz] }
  } catch (e) { return null }
}
function tryPickBlock(id) {
  if (survivalOn() && session && session.selectOwned) {
    if (session.selectOwned(id)) { toast(t('picked') + ' ' + blockName(id)); return true }
    toast(t('pickNeed'))
    return false
  }
  pick(id)
  toast(t('picked') + ' ' + blockName(id))
  return true
}
function pickAimed() {
  const hit = aimed()
  if (!hit || !hit.id) return false
  return tryPickBlock(hit.id)
}
function setInspect(on) {
  inspectOn = on
  document.body.classList.toggle('inspect', on)
  const chip = $('inspect-chip')
  if (chip) chip.hidden = !on
  const row = $('m-inspect')
  if (row) row.classList.toggle('on', on)
}
async function showInspect() {
  const hit = aimed()
  const card = $('inspect-card')
  const list = $('inspect-list')
  if (!card || !list) return
  card.hidden = false
  list.innerHTML = ''
  if (!hit) { list.innerHTML = '<p>' + t('inspectEmpty') + '</p>'; return }
  const rows = await changeLog.history(hit.pos[0], hit.pos[1], hit.pos[2])
  if (!rows.length) { list.innerHTML = '<p>' + t('inspectEmpty') + '</p>'; return }
  for (const row of rows) {
    const verb = row.before === 0 ? t('placed') : row.after === 0 ? t('broke') : t('changed')
    const name = blockName(row.after || row.before)
    const time = new Date(row.t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const p = document.createElement('p')
    p.innerHTML = '<bdi>' + t('you') + ' · ' + verb + ' ' + name + ' · ' + time + '</bdi>'
    list.append(p)
  }
}
paintBar()
selectSlot(0)
function repaintBlocks() { paintBar() }

const drawer = $('drawer'), scrim = $('scrim')
function tuckBarDrawer() {
  const d = document.getElementById('kb-drawer')
  if (d) d.hidden = true
  const back = document.getElementById('kb-drawer-backdrop')
  if (back) back.hidden = true
}
function openMenu(on) {
  if (on && learn) learn.cancelAuto()
  if (on) {
    selfUnlock = true
    if (document.pointerLockElement) document.exitPointerLock()
    try { noa.setPaused(true) } catch (e) {}
    if (session) session.paused = true
    panels.openRoot()
    try { localStorage.setItem('bloxbert-menu-hint', 'done') } catch (e) {}
    const hint = $('menu-hint'); if (hint) hint.hidden = true
    tuckBarDrawer()
    setTimeout(tuckBarDrawer, 400)
  } else {
    panels.close()
    try { noa.setPaused(false) } catch (e) {}
    if (session) session.paused = false
  }
  drawer.classList.remove('open'); scrim.hidden = true
  $('menu-btn').setAttribute('aria-expanded', String(!!on))
  const gm = $('game-menu')
  if (gm) gm.setAttribute('aria-expanded', String(!!on))
}
function bindBarMenu() {
  const btn = document.querySelector('.kb-bar .kb-menu')
  if (!btn || btn.dataset.bertMenu === '1') return
  btn.dataset.bertMenu = '1'
  btn.addEventListener('click', () => openMenu(true))
}
bindBarMenu()
setTimeout(bindBarMenu, 300)
setTimeout(bindBarMenu, 1200)
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
$('redo-btn').addEventListener('click', () => redo())
edits.onChange = paintUndo
$('save-btn').addEventListener('click', async () => { const b = await save(); toast(t('saved') + ' · ' + (b / 1024).toFixed(1) + ' KB') })
paintUndo()
$('m-reset').addEventListener('click', () => { if (confirm(t('confirmFresh'))) resetWorld() })
$('m-about').addEventListener('click', () => { $('about').hidden = false; $('about').querySelector('button').focus() })
$('m-inspect').addEventListener('click', () => { setInspect(!inspectOn); openMenu(false) })
$('inspect-chip').addEventListener('click', () => setInspect(false))
$('inspect-close').addEventListener('click', () => { $('inspect-card').hidden = true })
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
  $('mode-chip').textContent = table ? t('buildTable') : (session && session.mode === 'survival' ? t('survival') + ' · ' + t('practice') : t('creative'))
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
    noa.camera.zoomDistance = TOUCH_UI ? 4 : 0
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = flying ? 0 : GRAV_MULT
  }
}
$('m-creative').addEventListener('click', () => { if (teacherOn()) goWorld('creative') })
$('m-survival').addEventListener('click', () => { setMode(false); goWorld('survival') })
$('m-table').addEventListener('click', () => { setMode(true); openMenu(false) })
if (qs.get('mode') === 'table') setMode(true)

let lastJumpDown = 0
let lastJump = 0
let jumpHeld = false
let crouchKey = false
let crouchOn = false
let mouseLeft = false
let mouseRight = false
let placeHoldAt = 0
let pickArmed = false
let dig = null
let lastGroundAt = 0
let jumpBufferAt = 0
let prevJumpWant = false
let lastLookAt = 0
let runSince = 0
let lastStickRelease = 0
let carryOn = false
let lastMove = null
function jumpDown() {
  if (tableMode || jumpHeld) return
  jumpHeld = true
  lastJumpDown = performance.now()
}
function jumpUp() {
  if (!jumpHeld) return
  jumpHeld = false
  const tap = performance.now() - lastJumpDown < 250
  if (!tap || tableMode) return
  const now = performance.now()
  if (now - lastJump < 300) {
    if (survivalOn()) { toast(t('noFly')); lastJump = 0; return }
    flying = !flying
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = flying ? 0 : GRAV_MULT
    body.velocity[1] = 0
    toast(flying ? t('flyOn') : t('flyOff'))
    lastJump = 0
    return
  }
  lastJump = now
}
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  e.preventDefault()
  e.stopPropagation()
  if (e.repeat) return
  const card = $('inspect-card'); if (card) card.hidden = true
  if ($('sheet') && !$('sheet').hidden) { panels.backOne(); return }
  openMenu(true)
}, true)
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return
  if (e.key === 'Escape') return
  if (e.key === 'e' || e.key === 'E') { e.preventDefault(); openMenu(true); panels.open('inventory'); return }
  if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) {
    if ($('sheet') && !$('sheet').hidden) return
    e.preventDefault()
    if (!e.repeat && session && session.dropHeld) session.dropHeld(e.shiftKey)
    return
  }
  if (e.key === 'f' || e.key === 'F') { if (!e.ctrlKey && !e.metaKey && $('sheet') && $('sheet').hidden) { e.preventDefault(); useSelected(); return } }
  if (e.key === 'c' || e.key === 'C') { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); openMenu(true); panels.open('crafting'); return } }
  if ((e.key === 'b' || e.key === 'B') && !e.ctrlKey) { const strip = $('tool-strip'); if (strip) strip.hidden = !strip.hidden; return }
  const n = '123456789'.indexOf(e.key)
  if (n >= 0 && !tableMode && !e.repeat && $('sheet') && $('sheet').hidden) {
    if (session && session.mode === 'survival' && session.pressHot) session.pressHot(n)
    else selectSlot(n)
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undo(); return }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'Z')) { e.preventDefault(); redo(); return }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return }
  if (e.key === 'i' || e.key === 'I') { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setInspect(!inspectOn) } }
  if (e.key === ' ' || e.code === 'Space') { if (!e.repeat) jumpDown() }
  if (!tableMode) return
  if (e.key === 'Enter') { e.preventDefault(); if (inspectOn) showInspect(); else placeBlock(); return }
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
let downHeld = false
document.addEventListener('keydown', (e) => { if (e.key === 'Shift') downHeld = true; if (e.code === 'KeyZ') crouchKey = true })
document.addEventListener('keyup', (e) => { if (e.key === 'Shift') downHeld = false; if (e.code === 'KeyZ') crouchKey = false; if (e.key === ' ' || e.code === 'Space') jumpUp() })
function showCrack(p, x, y) {
  const ring = $('pick-ring')
  if (!ring) return
  const stage = crackStage(p)
  if (stage < 1) { ring.hidden = true; return }
  ring.hidden = false
  if (stage !== showCrack.stage) {
    showCrack.stage = stage
    ring.classList.remove('tick')
    void ring.offsetWidth
    ring.classList.add('tick')
  }
  const shown = stage / 4
  ring.style.left = (x == null ? innerWidth / 2 : x) + 'px'
  ring.style.top = (y == null ? innerHeight / 2 : y) + 'px'
  if (REDUCE) ring.style.background = '#14B8A6'
  else ring.style.background = 'conic-gradient(#14B8A6 ' + shown + 'turn, transparent 0)'
}
function hideCrack() { const ring = $('pick-ring'); if (ring) ring.hidden = true; showCrack.stage = 0 }
function puff() {
  const el = $('poof')
  if (!el || REDUCE) return
  el.hidden = false
  clearTimeout(puff.t)
  puff.t = setTimeout(() => { el.hidden = true }, 180)
}
function beginDig(kind) {
  const tget = noa.targetedBlock
  if (!tget) { dig = null; hideCrack(); return }
  const [x, y, z] = tget.position
  const id = getVoxel(x, y, z)
  const name = (BLOCKS.find((b) => b[0] === id) || [])[1] || ''
  const now = performance.now()
  if (dig && !dig.broke && dig.x === x && dig.y === y && dig.z === z && dig.p > 0) {
    dig.kind = kind
    dig.draining = false
    dig.need = mineMs(name, survivalOn(), kind === 'touch')
    dig.t0 = now - dig.p * dig.need
    return
  }
  dig = { kind, x, y, z, id, name, t0: now, need: mineMs(name, survivalOn(), kind === 'touch'), broke: false, p: 0, stage: 0 }
}
function feelTick(dt) {
  if (session && session.tickDrops) session.tickDrops(dt)
  syncDropMeshes()
  const body = playerBody
  if (survivalOn()) flying = false
  if (!tableMode) body.gravityMultiplier = flying ? 0 : GRAV_MULT
  const grounded = body.atRestY() < 0
  if (grounded) lastGroundAt = performance.now()
  const want = !!(noa.inputs.state.jump || jumpHeld)
  const now = performance.now()
  if (want && !prevJumpWant && !flying && !tableMode) {
    if (now - lastStickRelease < 200 && lastMove) carryOn = true
    if (grounded || now - lastGroundAt < 120) {
      body.velocity[1] = JUMP_V
      lastGroundAt = 0
      jumpBufferAt = 0
    } else jumpBufferAt = now
  }
  prevJumpWant = want
  if (jumpBufferAt && grounded && now - jumpBufferAt < 150 && !flying && !tableMode) {
    body.velocity[1] = JUMP_V
    jumpBufferAt = 0
    lastGroundAt = 0
  }
  if (carryOn && lastMove) {
    noa.inputs.state.forward = lastMove.forward
    noa.inputs.state.backward = lastMove.backward
    noa.inputs.state.left = lastMove.left
    noa.inputs.state.right = lastMove.right
    if (grounded && body.velocity[1] <= 0 && !want) carryOn = false
  }
  const stickRun = runSince && now - runSince >= 300
  moveState.maxSpeed = speedFor({ crouch: crouchKey || crouchOn, run: (downHeld && !flying) || !!stickRun, fly: flying && !survivalOn() })
  if (grounded) airCap = Math.max(WALK, Math.hypot(body.velocity[0], body.velocity[2]))
  else if (!flying && !tableMode) {
    const next = capAir(body.velocity[0], body.velocity[2], airCap)
    body.velocity[0] = next[0]
    body.velocity[2] = next[1]
  }
  noa.blockTestDistance = reachFor(survivalOn())
  playerBody.autoStep = !!(autoClimb && !flying && !tableMode)
  if ((crouchKey || crouchOn) && grounded && !flying && !tableMode) {
    const p = noa.entities.getPosition(noa.playerEntity)
    const hdg = noa.camera.heading
    const fx = Math.sin(hdg), fz = Math.cos(hdg)
    const rx = Math.cos(hdg), rz = -Math.sin(hdg)
    const allow = (dx, dz) => {
      const x = Math.floor(p[0] + dx * 0.55)
      const y = Math.floor(p[1])
      const z = Math.floor(p[2] + dz * 0.55)
      return keepCrouchStep(!!getVoxel(x, y - 1, z), !!getVoxel(x, y, z))
    }
    if (noa.inputs.state.forward && !allow(fx, fz)) noa.inputs.state.forward = false
    if (noa.inputs.state.backward && !allow(-fx, -fz)) noa.inputs.state.backward = false
    if (noa.inputs.state.left && !allow(-rx, -rz)) noa.inputs.state.left = false
    if (noa.inputs.state.right && !allow(rx, rz)) noa.inputs.state.right = false
  }
  if (shouldRepeatPlace(mouseRight, now - placeHoldAt, TOUCH_UI) && noa.container.hasPointerLock && $('sheet').hidden) { placeHoldAt = now; placeBlock() }
  else if (!noa.container.hasPointerLock || !$('sheet').hidden) mouseRight = false
  if (!tableMode && !flying) {
    const up = TOUCH_UI && noa.camera.pitch < -0.25 ? Math.min(2.2, -noa.camera.pitch * 1.6) : 0
    noa.camera.zoomDistance = (TOUCH_UI ? 4 : 0) + up
  }
  const cam = noa.rendering.camera
  const portrait = TOUCH_UI && innerHeight > innerWidth
  cam.fov = ((portrait ? 85 : 55) + (wideView ? 10 : 0)) * Math.PI / 180
  if (TOUCH_UI && !tableMode && !REDUCE && now - lastLookAt > 500) {
    const v = body.velocity
    const spd = Math.hypot(v[0], v[2])
    if (spd > 0.4) {
      const target = Math.atan2(v[0], v[2])
      let diff = target - noa.camera.heading
      while (diff > Math.PI) diff -= Math.PI * 2
      while (diff < -Math.PI) diff += Math.PI * 2
      const step = (90 * Math.PI / 180) * (dt / 1000)
      setLook(noa.camera.heading + Math.max(-step, Math.min(step, diff)), noa.camera.pitch)
    }
  }
  if (dig && dig.kind === 'mouse' && dig.creative) {
    if (mouseLeft && now - dig.t0 >= 250) { breakBlock(); dig.t0 = now }
    if (!mouseLeft) dig = null
  } else if (dig && dig.kind === 'mouse') {
    const tget = noa.targetedBlock
    const same = !!(tget && tget.position[0] === dig.x && tget.position[1] === dig.y && tget.position[2] === dig.z)
    if (mouseLeft && !same) beginDig('mouse')
    else if (!mouseLeft && !same) { dig = null; hideCrack() }
    else {
      const next = advanceDig(dig, now, mouseLeft, true)
      if (!next) { dig = null; hideCrack() }
      else {
        dig = next
        const elapsed = now - dig.t0
        if (crackVisible(dig.draining ? 250 : elapsed, dig.p)) showCrack(dig.p)
        else hideCrack()
        if (!dig.draining && survivalOn() && elapsed >= 2000 && !dig.hinted) { dig.hinted = true; toast(t('toolFaster')) }
        if (!dig.draining && dig.p >= 1 && !dig.broke) { dig.broke = true; breakAt(dig.x, dig.y, dig.z); hideCrack(); puff() }
      }
    }
  } else if (dig && dig.kind === 'touch') {
    const holding = !!(look && look.moved < 8 && !dig.draining)
    if (holding) {
      dig.p = Math.min(1, (now - dig.t0) / dig.need)
      if (crackVisible(now - dig.t0, dig.p)) showCrack(dig.p, look.x, look.y)
      else hideCrack()
      if (survivalOn() && now - dig.t0 >= 2000 && !dig.hinted) { dig.hinted = true; toast(t('toolFaster')) }
      if (dig.p >= 1 && !dig.broke) {
        breakAt(dig.x, dig.y, dig.z)
        dig.broke = true
        puff()
        dig.t0 = now
        if (!survivalOn()) dig.need = 250
        else { dig = null; hideCrack() }
      } else if (dig.broke && !survivalOn() && now - dig.t0 >= dig.need) {
        const hit = rayAt(look.x, look.y)
        if (hit) breakAt(hit.position[0], hit.position[1], hit.position[2])
        dig.t0 = now
      }
    } else if (dig.draining && !dig.broke) {
      const next = advanceDig(dig, now, false, true)
      if (!next) { dig = null; hideCrack() }
      else { dig = next; if (crackVisible(250, dig.p)) showCrack(dig.p); else hideCrack() }
    }
  }
}
noa.on('tick', (dt) => {
  feelTick(dt || 33)
  const s = noa.inputs.pointerState.scrolly
  if (s && !tableMode) {
    if (session && session.mode === 'survival' && session.setHot) session.setHot(session.hot + (s > 0 ? 1 : -1))
    else selectSlot(selectedSlot + (s > 0 ? 1 : -1))
  }
  if (stations) stations.tick()
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (tableMode) {
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = noa.inputs.state.jump = false
    noa.entities.setPosition(noa.playerEntity, [8.5, 12, 8.5])
  } else if (flying) {
    body.gravityMultiplier = 0
    if (body.resting) body.resting = [false, false, false]
    const up = (noa.inputs.state.jump || jumpHeld) ? FLY_V : (downHeld ? -FLY_V : 0)
    body.velocity[1] = up
    if (up) {
      const p = noa.entities.getPosition(noa.playerEntity)
      noa.entities.setPosition(noa.playerEntity, [p[0], p[1] + up / 60, p[2]])
    }
  }
  const follow = noa.ents.getState(noa.camera.cameraTarget, 'followsEntity')
  if (follow) {
    const base = 0.9 * noa.ents.getPositionData(noa.playerEntity).height
    const moving = !tableMode && !REDUCE && (noa.inputs.state.forward || noa.inputs.state.backward || noa.inputs.state.left || noa.inputs.state.right)
    follow.offset[1] = base + (moving ? Math.sin(performance.now() / 180) * 0.045 : 0)
  }
})

const canvas = noa.container.canvas
canvas.addEventListener('contextmenu', (e) => e.preventDefault())
let look = null
const LOOK_H = 0.40 * Math.PI / 180
const LOOK_V = 0.34 * Math.PI / 180
const LOOK_KEY = 'bloxbert-look'
let lookSens = 1
let lookInvert = false
let autoClimb = !!TOUCH_UI
let airCap = WALK
let wideView = false
try {
  const savedLook = JSON.parse(localStorage.getItem(LOOK_KEY) || '{}')
  if (savedLook.sens >= 0.5 && savedLook.sens <= 2) lookSens = savedLook.sens
  lookInvert = !!savedLook.invert
  wideView = !!savedLook.wide
  if (typeof savedLook.climb === 'boolean') autoClimb = savedLook.climb
} catch (e) {}
function applyLook() {
  noa.camera.sensitivityX = 10 * lookSens
  noa.camera.sensitivityY = 10 * lookSens
  noa.camera.inverseY = lookInvert
  try { localStorage.setItem(LOOK_KEY, JSON.stringify({ sens: lookSens, invert: lookInvert, wide: wideView, climb: autoClimb })) } catch (e) {}
}
function paintLook(g) {
  const label = document.createElement('p')
  label.className = 'gnote'
  label.textContent = t('lookSens') + ' ' + lookSens.toFixed(1) + '×'
  const range = document.createElement('input')
  range.type = 'range'
  range.min = '0.5'
  range.max = '2'
  range.step = '0.1'
  range.value = String(lookSens)
  range.setAttribute('aria-label', t('lookSens'))
  range.addEventListener('input', () => {
    lookSens = Number(range.value)
    label.textContent = t('lookSens') + ' ' + lookSens.toFixed(1) + '×'
    applyLook()
  })
  const inv = document.createElement('button')
  inv.type = 'button'
  inv.className = 'gtile wide'
  const paintInv = () => { inv.textContent = t('invertY') + (lookInvert ? ' ✓' : '') }
  paintInv()
  inv.addEventListener('click', () => { lookInvert = !lookInvert; applyLook(); paintInv() })
  const wide = document.createElement('button')
  wide.type = 'button'
  wide.className = 'gtile wide'
  const paintWide = () => { wide.textContent = t('wideView') + (wideView ? ' ✓' : '') }
  paintWide()
  wide.addEventListener('click', () => { wideView = !wideView; applyLook(); paintWide() })
  const climb = document.createElement('button')
  climb.type = 'button'
  climb.className = 'gtile wide'
  const paintClimb = () => { climb.textContent = t('climb') + (autoClimb ? ' ✓' : '') }
  paintClimb()
  climb.addEventListener('click', () => { autoClimb = !autoClimb; applyLook(); paintClimb() })
  g.append(label, range, inv, wide, climb)
}
applyLook()
canvas.addEventListener('mousedown', (e) => { if (e.button === 1) e.preventDefault() })
canvas.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); pickAimed() } })
canvas.addEventListener('pointerdown', (e) => {
  if (e.button === 0) mouseLeft = true
  if (e.pointerType === 'mouse' && !tableMode && !TOUCH_UI) return
  look = { id: e.pointerId, x: e.clientX, y: e.clientY, t: e.timeStamp, moved: 0 }
  lastPointer = { x: e.clientX, y: e.clientY }
  if ((e.pointerType !== 'mouse' || TOUCH_UI) && !tableMode) {
    const hit = rayAt(e.clientX, e.clientY)
    if (hit) {
      const name = (BLOCKS.find((b) => b[0] === hit.id) || [])[1] || ''
      const need = mineMs(name, survivalOn(), true)
      const same = dig && !dig.broke && dig.x === hit.position[0] && dig.y === hit.position[1] && dig.z === hit.position[2] && dig.p > 0
      const kept = same ? dig.p : 0
      dig = { kind: 'touch', x: hit.position[0], y: hit.position[1], z: hit.position[2], id: hit.id, name, t0: performance.now() - kept * need, need, broke: false, face: hit, p: kept }
    } else dig = null
  }
})
canvas.addEventListener('pointermove', (e) => {
  if (!look || e.pointerId !== look.id) return
  const dx = e.clientX - look.x, dy = e.clientY - look.y
  look.moved += Math.abs(dx) + Math.abs(dy)
  if (look.moved >= 8) { lastLookAt = performance.now(); if (dig && dig.kind === 'touch') { dig = null; hideCrack() } }
  if (look.moved < 8) return
  look.x = e.clientX; look.y = e.clientY
  setLook(noa.camera.heading + dx * LOOK_H * lookSens, noa.camera.pitch + dy * (lookInvert ? -1 : 1) * LOOK_V * lookSens)
})
canvas.addEventListener('pointerup', (e) => {
  if (e.button === 0) mouseLeft = false
  if (!look || e.pointerId !== look.id) return
  const tap = look.moved < 8
  const held = e.timeStamp - look.t
  const face = dig && dig.face
  const broke = dig && dig.broke
  if (dig && dig.kind === 'touch') {
    if (broke || held < 500) { dig = null; hideCrack() }
    else { dig.draining = true; dig.drainAt = performance.now() }
  }
  look = null
  if (pickArmed && tap && face) {
    tryPickBlock(face.id || face.blockID)
    pickArmed = false
    paintPick()
    return
  }
  if (inspectOn && tap) { showInspect(); return }
  if (tableMode && tap) { placeBlock(); return }
  if (tap && held < 500 && !broke && face) placeBlock(face)
})
canvas.addEventListener('pointercancel', () => { look = null; dig = null; hideCrack() })
window.addEventListener('pointerup', (e) => { if (e.button === 0) mouseLeft = false; if (e.button === 2) mouseRight = false })
for (const el of document.querySelectorAll('[data-hold]')) {
  const st = el.dataset.hold
  const on = (e) => { e.preventDefault(); noa.inputs.state[st] = true; el.classList.add('down'); if (st === 'jump') jumpDown() }
  const off = () => { noa.inputs.state[st] = false; el.classList.remove('down'); if (st === 'jump') jumpUp() }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off)
  el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off)
}
$('t-place').addEventListener('click', placeBlock)
$('t-break').addEventListener('click', breakBlock)
$('table-place').addEventListener('click', placeBlock)
function paintPick() {
  const b = $('pick-chip')
  if (!b) return
  b.textContent = t('pickChip') + (pickArmed ? ' ✓' : '')
  b.dataset.ready = '1'
  b.classList.toggle('on', pickArmed)
  b.setAttribute('aria-pressed', String(pickArmed))
}
const pickBtn = $('pick-chip')
if (pickBtn) pickBtn.addEventListener('click', () => { pickArmed = !pickArmed; paintPick() })
paintPick()
document.body.classList.toggle('touch', TOUCH_UI)
const stickPad = document.getElementById('stick-pad')
const stickKnob = document.getElementById('stick-knob')
if (stickPad && stickKnob) {
  let sid = null
  let origin = null
  const setKnob = (x, y) => { stickKnob.style.transform = 'translate(' + x + 'px,' + y + 'px)' }
  const moveStick = (e) => {
    const dx = e.clientX - origin.x
    const dy = e.clientY - origin.y
    const dist = Math.hypot(dx, dy)
    if (dist < 12) {
      noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = false
      runSince = 0
      setKnob(0, 0)
      return
    }
    const nudge = Math.min(28, dist)
    setKnob(dx / dist * nudge, dy / dist * nudge)
    noa.inputs.state.forward = dy < -12
    noa.inputs.state.backward = dy > 12
    noa.inputs.state.left = dx < -12
    noa.inputs.state.right = dx > 12
    lastMove = { forward: !!noa.inputs.state.forward, backward: !!noa.inputs.state.backward, left: !!noa.inputs.state.left, right: !!noa.inputs.state.right }
    if (dist >= 56) { if (!runSince) runSince = performance.now() }
    else runSince = 0
  }
  stickPad.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    sid = e.pointerId
    stickPad.setPointerCapture(e.pointerId)
    const r = stickPad.getBoundingClientRect()
    origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    moveStick(e)
  })
  stickPad.addEventListener('pointermove', (e) => { if (e.pointerId === sid) moveStick(e) })
  const endStick = (e) => {
    if (e.pointerId !== sid) return
    sid = null
    lastStickRelease = performance.now()
    runSince = 0
    noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = false
    setKnob(0, 0)
  }
  stickPad.addEventListener('pointerup', endStick)
  stickPad.addEventListener('pointercancel', endStick)
}
const crouchBtn = document.getElementById('t-crouch')
if (crouchBtn) crouchBtn.addEventListener('click', () => {
  crouchOn = !crouchOn
  crouchBtn.classList.toggle('down', crouchOn)
  crouchBtn.setAttribute('aria-pressed', String(crouchOn))
})
let stickSide = 'left'
try { stickSide = localStorage.getItem('bloxbert-stick') || 'left' } catch (e) {}
document.body.classList.toggle('stick-right', stickSide === 'right')
const stickRow = document.getElementById('m-stick')
if (stickRow) stickRow.addEventListener('click', () => {
  stickSide = stickSide === 'right' ? 'left' : 'right'
  try { localStorage.setItem('bloxbert-stick', stickSide) } catch (e) {}
  document.body.classList.toggle('stick-right', stickSide === 'right')
})

const scene = noa.rendering.getScene()
scene.fogMode = Scene.FOGMODE_LINEAR
scene.fogColor = new Color3(0.64, 0.8, 0.93)
scene.fogStart = 40
scene.fogEnd = 78
Effect.ShadersStore.bertSkyVertexShader = 'precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 vPos;void main(){vPos=position;gl_Position=worldViewProjection*vec4(position,1.0);}'
Effect.ShadersStore.bertSkyFragmentShader = 'precision highp float;varying vec3 vPos;uniform float uTime;void main(){vec3 n=normalize(vPos);float h=clamp(n.y*1.15+0.08,0.0,1.0);vec3 zenith=vec3(0.13,0.34,0.72);vec3 horizon=vec3(0.64,0.80,0.93);vec3 col=mix(horizon,zenith,h);vec3 sunDir=normalize(vec3(-0.45,0.86,-0.22));float sun=smoothstep(0.996,1.0,dot(n,sunDir));float glow=smoothstep(0.82,1.0,dot(n,sunDir));col=mix(col,vec3(1.0,0.93,0.78),glow*0.55);col=mix(col,vec3(1.0,0.97,0.9),sun);float band=sin(n.x*9.0+uTime)*sin(n.z*7.0+uTime*0.7);float cloud=smoothstep(0.35,0.75,band)*smoothstep(0.05,0.28,n.y)*smoothstep(0.72,0.4,n.y);col=mix(col,vec3(0.93,0.96,1.0),cloud*0.42);gl_FragColor=vec4(col,1.0);}'
const skyMat = new ShaderMaterial('sky', scene, { vertex: 'bertSky', fragment: 'bertSky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'uTime'] })
skyMat.backFaceCulling = false
skyMat.disableDepthWrite = true
skyMat.fogEnabled = false
skyMat.setFloat('uTime', 0)
const sky = CreateSphere('sky', { diameter: 900, segments: 12 }, scene)
sky.material = skyMat
sky.isPickable = false
sky.infiniteDistance = true
sky.alwaysSelectAsActiveMesh = true
noa.rendering.addMeshToScene(sky, false)
let skyTime = 0
function bertyPart(w, h, d, x, y, z, rgb) {
  const m = CreateBox('bp', { width: w, height: h, depth: d }, scene)
  m.position.set(x, y, z)
  m.computeWorldMatrix(true)
  const n = m.getTotalVertices()
  const cols = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) { cols[i * 4] = rgb[0]; cols[i * 4 + 1] = rgb[1]; cols[i * 4 + 2] = rgb[2]; cols[i * 4 + 3] = 1 }
  m.setVerticesData(VertexBuffer.ColorKind, cols)
  m.isPickable = false
  return m
}
const berty = Mesh.MergeMeshes([
  bertyPart(0.5, 0.03, 0.5, 0, -0.88, 0, [0.08, 0.12, 0.16]),
  bertyPart(0.2, 0.18, 0.26, -0.11, -0.74, 0, [0.06, 0.42, 0.5]),
  bertyPart(0.2, 0.18, 0.26, 0.11, -0.74, 0, [0.06, 0.42, 0.5]),
  bertyPart(0.38, 0.58, 0.24, 0, -0.3, 0, [0.12, 0.82, 0.76]),
  bertyPart(0.32, 0.3, 0.3, 0, 0.26, 0, [0.45, 0.95, 0.9]),
  bertyPart(0.24, 0.08, 0.05, 0, 0.28, 0.16, [0.72, 0.4, 1]),
], true, true)
berty.isPickable = false
const bertyMat = new StandardMaterial('berty-mat', scene)
bertyMat.diffuseColor = new Color3(1, 1, 1)
bertyMat.specularColor = new Color3(0.04, 0.04, 0.04)
bertyMat.emissiveColor = new Color3(0.1, 0.28, 0.26)
berty.material = bertyMat
noa.ents.addComponent(noa.playerEntity, noa.ents.names.mesh, { mesh: berty, offset: [0, 0.9, 0] })
let dropReady = false
const dropMeshes = new Map()
const dropMats = new Map()
const DROP_TINT = {
  dirt: [0.55, 0.38, 0.22], log: [0.45, 0.28, 0.14], planks: [0.76, 0.58, 0.3],
  stone: [0.55, 0.56, 0.6], sand: [0.86, 0.78, 0.48], gravel: [0.5, 0.5, 0.52],
  brickRed: [0.78, 0.32, 0.22], glass: [0.55, 0.86, 0.92], berry: [0.78, 0.16, 0.28],
  coal: [0.18, 0.18, 0.2], leaves: [0.28, 0.62, 0.3], grass: [0.32, 0.68, 0.3],
  bread: [0.82, 0.62, 0.32], cupcake: [0.9, 0.45, 0.6], flour: [0.92, 0.88, 0.75],
}
function dropMat(item) {
  if (dropMats.has(item)) return dropMats.get(item)
  const c = DROP_TINT[item] || [0.15, 0.72, 0.68]
  const m = new StandardMaterial('drop-' + item, scene)
  m.diffuseColor = new Color3(c[0], c[1], c[2])
  m.emissiveColor = new Color3(c[0] * 0.55, c[1] * 0.55, c[2] * 0.55)
  m.specularColor = new Color3(0, 0, 0)
  dropMats.set(item, m)
  return m
}
function syncDropMeshes() {
  if (!dropReady || !session || !session.groundDrops) return
  const p = noa.entities.getPosition(noa.playerEntity)
  const list = session.groundDrops().filter((d) => Math.hypot(d.x - p[0], d.z - p[2]) < 40).slice(0, 48)
  const seen = new Set()
  const bob = REDUCE ? 0.2 : 0.2 + Math.sin(performance.now() / 280) * 0.06
  for (const d of list) {
    seen.add(d.id)
    let mesh = dropMeshes.get(d.id)
    if (!mesh) {
      mesh = CreateBox('drop' + d.id, { size: 0.34 }, scene)
      mesh.material = dropMat(d.item)
      mesh.isPickable = false
      const lp0 = noa.globalToLocal([d.x, d.y + bob, d.z], null, [])
      mesh.position.set(lp0[0], lp0[1], lp0[2])
      noa.rendering.addMeshToScene(mesh, false)
      dropMeshes.set(d.id, mesh)
    }
    if (!REDUCE) mesh.rotation.y = performance.now() / 500
    const lp = noa.globalToLocal([d.x, d.y + bob, d.z], null, [])
    mesh.position.set(lp[0], lp[1], lp[2])
  }
  for (const [id, mesh] of dropMeshes) if (!seen.has(id)) { mesh.dispose(); dropMeshes.delete(id) }
}
dropReady = true
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
noa.on('beforeRender', (dt) => {
  paintOutline()
  if (!REDUCE) skyTime += (dt || 16) * 0.0004
  skyMat.setFloat('uTime', REDUCE ? 0 : skyTime)
})

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
    noa, perf, save, load, resetWorld, placeBlock, breakBlock, pick, setVoxel, getVoxel, undo, redo, importFile, exportDoc: snapshot,
    applyEdit: (ops) => { const g = edits.applyEdit(ops, { source: 'test', label: 'test' }); if (g) changeLog.note(g); return g },
    history: (x, y, z) => changeLog.history(x, y, z),
    logPrune: (nowMs) => changeLog.prune(nowMs),
    bag: () => session.bag.dump(),
    give: (item, n) => session.give(item, n),
    cogs: () => session.wallet.state.cogs,
    ledger: () => session.wallet.state.ledger,
    vendTick: (n) => session.vendTick(n),
    setDay: (iso) => session.setDay(iso),
    tp: (x, y, z) => noa.entities.setPosition(noa.playerEntity, [x, y, z]),
    mode: (m) => session.setMode(m),
    select: (a, b) => tools.select(a, b),
    tool: (name) => name === 'fill' ? tools.fill(current) : name === 'copy' ? tools.copy() : null,
    clip: () => tools.clip(),
    pasteAt: (at, opts) => tools.pasteAt(at, opts),
    confirm: () => tools.confirm(),
    cancel: () => tools.cancel(),
    ghost: () => tools.ghost(),
    fly: () => ({ on: flying, y: noa.entities.getPosition(noa.playerEntity)[1] }),
    strip: () => [...document.querySelectorAll('#tool-strip button')].map((b) => b.dataset.tool),
    schem: { write: () => tools.schemWrite(), read: (obj) => tools.schemRead(obj) },
    builds: { list: () => tools.builds },
    rewind: (mins) => tools.rewind(mins),
    snap: { list: () => tools.snaps, make: () => tools.snapMake(), restore: () => null },
    measure: (points) => tools.measure(points),
    hold: (st, v) => { noa.inputs.state[st] = v },
    turn: (dh, dp = 0) => setLook(noa.camera.heading + dh, noa.camera.pitch + dp), setLook,
  }
}

load().catch(() => {}).finally(() => { paintModeChip(); if (sentToSurvival) toast(t('studentWorld')); markSave(saved.size ? t('bertyville') + ' · ' + t('loaded') : t('bertyville') + ' · ' + t('notSaved')) })
if (typeof __BLOX_STUDENT__ === 'undefined' || !__BLOX_STUDENT__) if (location.search.includes('smoke=1')) {
  window.__smoke = {
    seed() {
      session.setMode('survival')
      session.give('coal', 2)
      session.give('sand', 4)
      session.give('cupcake', 1)
      session.give('log', 3)
      session.setHot(0)
    },
    notch(n) { session.setHot(session.hot + n) },
    key(i) { session.setHot(i) },
    hot: () => session.hot,
    place: () => session.tryPlace(),
    counts: () => ({ coal: session.bag.count('coal'), sand: session.bag.count('sand'), log: session.bag.count('log'), cupcake: session.bag.count('cupcake'), vend: session.bag.count('vend') }),
    fillSeed(n) { session.setMode('survival'); session.give('log', n); tools.select([0, 5, 0], [2, 6, 1]) },
    emptyOven() {
      session.setMode('survival')
      session.spend('sand', session.bag.count('sand'))
      session.spend('flour', session.bag.count('flour'))
      session.spend('sugar', session.bag.count('sugar'))
      session.spend('berry', session.bag.count('berry'))
      const g = document.getElementById('sheet-body')
      stations.paint(g, '8,5,8', 'oven')
      g.querySelectorAll('.gtile')[1].click()
      return g.innerText
    },
    glassOut() {
      stations.load({ '1,5,1': { kind: 'oven', fuel: 1, left: 4, input: [], output: ['glass'], until: 0 } })
      const g = document.getElementById('sheet-body')
      stations.paint(g, '1,5,1', 'oven')
      return g.innerText
    },
    brick() { return t('brickRed') },
    words() {
      const chip = document.getElementById('size-chip')
      chip.hidden = false
      chip.textContent = t('fillN').replace('{n}', '12')
      return { fill: chip.textContent, bake: t('nothingBake'), walls: t('wallsN').replace('{n}', '16') }
    },
    ovenOpen() {
      session.setMode('survival')
      session.give('coal', 1)
      session.give('sand', 2)
      session.give('flour', 2)
      const g = document.getElementById('sheet-body')
      stations.paint(g, '9,5,9', 'oven')
      g.querySelectorAll('.gtile')[0].click()
      g.querySelectorAll('.gtile')[1].click()
    },
    pickup() { session.setMode('survival'); session.meta.set('1,2,3', { kind: 'vend', slots: [{ item: 'cupcake', n: 2, price: 12 }], till: 12, sales: [] }); session.pickup(1, 2, 3, 24); return session.bag.count('vend') + ':' + session.bag.count('cupcake') },
    sale() { session.setMode('survival'); session.meta.set('4,2,3', { kind: 'vend', slots: [{ item: 'cupcake', n: 2, price: 12 }], till: 0, sales: [], salesN: 0 }); session.vendTick(2); const rows = session.wallet.state.ledger.filter((r) => r.kind === 'vend-sale'); return rows.reduce((n, r) => n + r.cogs, 0) },
  }
}
repaintBlocks()
void T0
