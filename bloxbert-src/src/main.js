// Bloxbert 2.0.0 — student door at /blocks/. Pins: noa-engine develop @8a74866, @babylonjs/core 6.49.0.
// Proven in test 1.2 and kept: Auto / Lite / Full, phone wrap, 58°-class touch turn, rotate re-fit, RTL drawer from the left.
// __BLOX_STUDENT__ is replaced by the build. The student door does not ship window.__blocks.
const VERSION = PKG_VERSION
import { Engine } from 'noa-engine'
import { CreateLines } from '@babylonjs/core/Meshes/Builders/linesBuilder'
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder'
import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial'
import { Effect } from '@babylonjs/core/Materials/effect'
import { Scene } from '@babylonjs/core/scene'
import { Vector3, Vector4, Matrix, Quaternion } from '@babylonjs/core/Maths/math.vector'
import { Ray } from '@babylonjs/core/Culling/ray'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { Light } from '@babylonjs/core/Lights/light'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import ATLAS from '../assets/atlas.json'
import { BLOCKS } from './data/blocks-list.js';
import { registerWrapMaterials } from "./gfx/tile-wraps.js";
import { STR } from './strings.js'
import { EXTRA } from './strings-extra.js'
import { createEdits } from './world-edit.js'
import { createLog } from './change-log.js'
import { withFloor } from './world-floor.js'
import { mountPanels } from './panels.js'
import { createSession } from './session.js'
import { createBackups } from './backups.js'
import { CHANGELOG } from './changelog.js'
import { Rules } from './rules.js'
import { paintRules, rulesWord } from './rules-editor.js'
import { showRulesCard } from './rules-card.js'
import { Effects } from './effects.js'
import { blockIcon, dropperIcon, slotArt, itemSvg } from './icons.js'
import { createStations } from './stations.js'
import { createTools } from './tools.js'
import { createLearn } from './learn.js'
import { FLOOR, STATIONS, keptCell, protectedCell, protectRadius, TOWN_AT } from './town.js'
import { coalHere, plantHere, wildWood, pondHere, shoreLow, rescueSpots, starterPonds, surfaceY, starterBushes, wildBushCell, groundAt, genBlock, genColumns, peekColumn, underAll, solidUnder, GEN } from './worldgen.js'
import { makerBlock, seedWords, ADJECTIVES, NOUNS, clampStep, normSeed } from './maker.js'
import { fromDoc } from './save.js'
import { RECIPES } from './data/recipes.js'
import { setGate, gates } from './data/gates.js'
import { JUMP_V, GRAV_MULT, FLY_V, speedFor, overlapsPlayer, mineMs, inReach, reachFor, crackStage, crackVisible, advanceDig, keepCrouchStep, shouldRepeatPlace, canUse, capAir, airLimit, WALK, gateDig, toolToast } from './feel.js'
import { createBasics } from './basics.js'
import { isDoor, isDoorTop, doorTopId, doorKind, isOpenDoor, placedDoorId, DOOR_HOLD_MS, LEVER, BUTTON, LANTERN } from './doors.js'
import { migrateVoxels, migrate, SCHEMA, unknownEntries, resetUnknown, isMissingId } from './save/migrate.js'
import { packVersions, packBlocks, packOn } from './packs/registry.js'
import './packs/farm/pack.js'
import './packs/decor/pack.js'
import { floraSkill } from './packs/flora/pack.js'
import { packRecipes, packItems } from './packs/registry.js'
import { ITEMS } from './data/items.js'
{
  const have = new Set(RECIPES.map((r) => r.id))
  for (const r of packRecipes()) {
    const decor = r.id === 'floorLamp' || r.id === 'wallLamp' || r.id === 'rug'
    const flora = r.id === 'birchPlanks' || r.id === 'pinePlanks'
    if ((decor || flora) && !have.has(r.id)) RECIPES.push(r)
  }
  for (const it of packItems()) if ((it.pack === 'decor' || it.pack === 'flora') && !ITEMS[it.key]) ITEMS[it.key] = it.def
}
import { dropOf, harvestCounts, berryPickCount } from './data/items.js'
import { wildBushLoot } from './drops.js'
import { createHands } from './hands.js'
import { createFarm, nearWater, advance, stage, preview, formatLeft, isCropId, isBushId, isRipe, replantSeed, CROP, BUSH, DRY, WET, WATER, RIPE_MS, capOf } from './farm.js'
import { createForage, wildPickCount, BARE_BUSH, FRUIT_BUSH, WILD_WHEAT } from './forage.js'
import { createQuality } from './gfx/quality.js'
const farm = createFarm()
const forage = createForage()

const T0 = performance.now()
if (!document.createElement('canvas').getContext('webgl2')) {
  document.getElementById('stage').innerHTML = '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px"><div style="max-width:440px;background:#111a2e;border:1px solid #22304d;border-radius:14px;padding:20px"><b style="font-size:18px">This device can\'t run 3D right now</b><p style="color:#9fb0c6">Bloxbert needs WebGL 2. Try restarting Chrome, or use another Chromebook or phone. Your saved world is still safe.</p></div></div>'
  throw new Error('Bloxbert: WebGL2 not available')
}
const coarse = matchMedia('(pointer: coarse)').matches
const qs = new URLSearchParams(location.search)
const TOUCH_UI = coarse || qs.has('touch')
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches

const gfx = createQuality()
let quality = gfx.quality
const AA = gfx.aa
let AUTO = gfx.auto
let level = gfx.level

let LANG = qs.get('lang') || ''
if (!LANG) { try { LANG = (JSON.parse(localStorage.getItem('kulibert-prefs-v1') || 'null') || {}).lang || '' } catch (e) {} }
if (!STR[LANG]) LANG = 'en'
let freshDropDate = ''
function t(key) {
  if (key === 'confirmFresh' && freshDropDate) return t('confirmFreshFull').replace('{date}', freshDropDate)
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
  if (pick && pick.dataset.ready) paintPick()
}
applyI18n()

let walkPresses = 0
function fadeKeys() {
  const el = document.querySelector('.keys')
  if (!el || el.dataset.gone === '1') return
  el.dataset.gone = '1'
  if (REDUCE || TOUCH_UI) { el.style.display = 'none'; return }
  el.style.transition = 'opacity .5s linear'
  el.style.opacity = '0'
}
document.addEventListener('keydown', (e) => {
  if (TOUCH_UI || e.repeat) return
  const code = e.code
  if (code !== 'KeyW' && code !== 'KeyA' && code !== 'KeyS' && code !== 'KeyD' && code !== 'ArrowUp' && code !== 'ArrowDown' && code !== 'ArrowLeft' && code !== 'ArrowRight') return
  walkPresses += 1
  if (walkPresses >= 3) fadeKeys()
}, true)

const SPAWN = [8.5, 8, 1.5]
let worldSpawn = SPAWN.slice()
let spawnSet = false
let protect = { size: 'medium', center: null }
let ringUntil = 0
let protectTold = 0
function finiteTriple(a) {
  if (!Array.isArray(a) || a.length < 3 || !Number.isFinite(a[0]) || !Number.isFinite(a[1]) || !Number.isFinite(a[2])) return null
  return [a[0], a[1], a[2]]
}
function normProtect(p) {
  const size = p && (p.size === 'off' || p.size === 'small' || p.size === 'medium' || p.size === 'large') ? p.size : 'medium'
  return { size, center: finiteTriple(p && p.center) }
}
function roundPos(p) {
  return [Math.round(p[0]), Math.round(p[1]), Math.round(p[2])]
}
let digCache = { at: 0, spot: null }
let digChipUntil = 0
let digChipTimer = 0
let digChipGen = 0
function stopDigTimer() {
  digChipGen += 1
  if (digChipTimer) {
    clearTimeout(digChipTimer)
    digChipTimer = 0
  }
  digChipUntil = 0
}
function hideDigChip() {
  stopDigTimer()
  const chip = document.getElementById('dig-chip')
  if (chip) chip.hidden = true
}
function armDigTimer() {
  stopDigTimer()
  const gen = digChipGen
  digChipUntil = performance.now() + 8000
  digChipTimer = setTimeout(() => {
    digChipTimer = 0
    if (gen !== digChipGen) return
    const chip = document.getElementById('dig-chip')
    if (!chip || chip.hidden) return
    chip.hidden = true
    digChipUntil = 0
  }, 8000)
}
function peekId(x, y, z) {
  const ci = Math.floor(x / S)
  const cj = Math.floor(y / S)
  const ck = Math.floor(z / S)
  const s = saved.get(key(ci, cj, ck))
  if (s) return s[(x - ci * S) * S * S + (y - cj * S) * S + (z - ck * S)] | 0
  const stamped = genSeen[key(ci, cj, ck)]
  const g = stamped == null ? genVersion : (stamped | 0)
  const name = genBlock(x, y, z, g, (qx, qz) => fadeDist(qx, y, qz))
  return name ? (ID[name] || 0) : 0
}
function nearestDig() {
  const pos = noa.entities.getPosition(noa.playerEntity)
  const px = Math.round(pos[0])
  const pz = Math.round(pos[2])
  const c = protect.center
  const rad = c ? protectRadius(protect.size) : 0
  const stone = ID.stone
  const sand = ID.sand
  for (let ring = 1; ring <= 64; ring++) {
    let best = null
    let bestD = 1e9
    for (let dx = -ring; dx <= ring; dx++) {
      for (let dz = -ring; dz <= ring; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== ring) continue
        const x = px + dx
        const z = pz + dz
        if (c && rad) {
          const ddx = x - c[0]
          const ddz = z - c[2]
          if (ddx * ddx + ddz * ddz <= rad * rad) continue
        }
        const h = heightAt(x, z)
        for (let y = h; y >= h - 4 && y > -64; y--) {
          if (protectedCell(x, y, z, protect)) continue
          const id = peekId(x, y, z)
          if (id !== stone && id !== sand) continue
          const d = dx * dx + dz * dz + (y - h) * (y - h)
          if (d < bestD) { bestD = d; best = [x, y, z] }
        }
      }
    }
    if (best) return best
  }
  return null
}
function paintDigChip(spot) {
  let chip = document.getElementById('dig-chip')
  if (!chip) {
    chip = document.createElement('button')
    chip.type = 'button'
    chip.id = 'dig-chip'
    chip.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateZ(0);isolation:isolate;z-index:42;min-height:44px;min-width:44px;padding:8px 14px;border-radius:999px;border:1px solid #d7e2f2;background:#132033;color:#f4f7fb;font:600 14px/1.2 system-ui,sans-serif;cursor:pointer;'
    chip.addEventListener('pointerdown', (e) => e.stopPropagation())
    chip.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      hideDigChip()
    })
    document.body.appendChild(chip)
  }
  if (spot) {
    const here = noa.entities.getPosition(noa.playerEntity)
    const dx = spot[0] + 0.5 - here[0]
    const dz = spot[2] + 0.5 - here[2]
    let rel = Math.atan2(dx, dz) - (noa.camera ? noa.camera.heading : 0)
    rel = Math.atan2(Math.sin(rel), Math.cos(rel))
    const arrows = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖']
    const arrow = arrows[(Math.round(rel / (Math.PI / 4)) + 8) % 8]
    chip.textContent = arrow + ' ' + t('digOutside')
  } else chip.textContent = t('digOutside')
  chip.hidden = false
  armDigTimer()
}
function tickDigChip() {
  const chip = document.getElementById('dig-chip')
  if (!chip || chip.hidden) return
  let pos = null
  try { pos = noa.entities.getPosition(noa.playerEntity) } catch (e) { pos = null }
  if (!pos || !inTown(pos[0], pos[2])) {
    hideDigChip()
    return
  }
  if (digChipUntil && performance.now() >= digChipUntil) hideDigChip()
}
setInterval(tickDigChip, 400)
function noteProtected() {
  const now = performance.now()
  if (protectTold && now - protectTold < 3000) return
  protectTold = now
  toast(t('protectedArea') + ' — ' + t('digOutside'))
  ringUntil = now + 2000
  let spot = digCache.spot
  if (now - digCache.at >= 10000) {
    try { spot = nearestDig() } catch (e) { spot = digCache.spot }
    digCache = { at: now, spot }
  }
  paintDigChip(spot)
}
function zoneLocked(x, y, z) {
  if (teacherOn() || townHelper()) return false
  if (!protectedCell(x, y, z, protect)) return false
  noteProtected()
  return true
}
function setSpawnHere() {
  worldSpawn = roundPos(noa.entities.getPosition(noa.playerEntity))
  spawnSet = true
  dirty = true
  markSave(t('notSaved'))
}
function setProtectSize(size) {
  const keep = protect && protect.center ? protect.center.slice() : null
  protect = { size, center: size === 'off' ? keep : roundPos(noa.entities.getPosition(noa.playerEntity)) }
  dirty = true
  markSave(t('notSaved'))
}
function paintSpawn(g) {
  const setBtn = document.createElement('button')
  setBtn.type = 'button'
  setBtn.className = 'gtile'
  setBtn.dataset.spawn = 'set'
  setBtn.style.minHeight = '44px'
  setBtn.style.minWidth = '44px'
  setBtn.innerHTML = '<span class="gic">⚑</span><span class="glbl"></span>'
  setBtn.querySelector('.glbl').textContent = t('setSpawnHere')
  setBtn.addEventListener('pointerdown', (e) => e.stopPropagation())
  setBtn.addEventListener('click', (e) => { e.stopPropagation(); setSpawnHere(); toast(t('setSpawnHere')) })
  g.append(setBtn)
  const note = document.createElement('p')
  note.className = 'gnote'
  note.textContent = t('protect')
  g.append(note)
  const row = document.createElement('div')
  row.style.display = 'flex'
  row.style.flexWrap = 'wrap'
  row.style.gap = '8px'
  const sizes = [['off', 'Off'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large']]
  function paintSizes() {
    row.innerHTML = ''
    for (const [size, label] of sizes) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      b.dataset.spawn = 'size'
      b.dataset.size = size
      b.style.minHeight = '44px'
      b.style.minWidth = '44px'
      b.style.flex = '1 1 72px'
      b.setAttribute('aria-pressed', String(protect.size === size))
      if (protect.size === size) b.style.outline = '3px solid #22D3EE'
      b.innerHTML = '<span class="glbl"></span>'
      b.querySelector('.glbl').textContent = label
      b.addEventListener('pointerdown', (e) => e.stopPropagation())
      b.addEventListener('click', (e) => { e.stopPropagation(); setProtectSize(size); paintSizes() })
      row.append(b)
    }
  }
  paintSizes()
  g.append(row)
}
const noa = new Engine({
  domElement: document.getElementById('stage'),
  debug: false, showFPS: false, silent: true, silentBabylon: true,
  antiAlias: AA, preserveDrawingBuffer: false,
  playerShadowComponent: false,
  chunkSize: 24,
  chunkAddDistance: gfx.add,
  chunkRemoveDistance: gfx.rem,
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
noa.world.maxProcessingPerTick = 5
noa.world.maxProcessingPerRender = 3
const engine = noa.rendering.engine
engine.setHardwareScalingLevel(level)
const moveState = noa.ents.getMovement(noa.playerEntity)
const playerBody = noa.ents.getPhysicsBody(noa.playerEntity)
playerBody.gravityMultiplier = GRAV_MULT
playerBody.airDrag = 0
const LOOK_KEY = 'bloxbert-look'
let lookSens = 1
let lookInvert = false
let autoClimb = true
let wideView = false
let showHand = true
let mainHand = 'right'
let camBehind = false
try {
  const savedLook = JSON.parse(localStorage.getItem(LOOK_KEY) || '{}')
  if (savedLook.sens >= 0.5 && savedLook.sens <= 2) lookSens = savedLook.sens
  lookInvert = !!savedLook.invert
  wideView = !!savedLook.wide
  if (savedLook.cv === 2 && typeof savedLook.climb === 'boolean') autoClimb = savedLook.climb
  if (savedLook.hand === false) showHand = false
  if (savedLook.mainHand === 'left') mainHand = 'left'
  if (savedLook.cam === 'behind') camBehind = true
} catch (e) {}
playerBody.autoStep = !!autoClimb
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
// 36px layers: 2px copied gutter around the original 32. Sample the core, nearest, no mipmaps.
const _rawArray = engine.createRawTexture2DArray.bind(engine)
engine.createRawTexture2DArray = (data, w, h, depth, format, _mip, invertY, sampling, ...rest) =>
  _rawArray(data, w, h, depth, format, false, invertY, Texture.NEAREST_SAMPLINGMODE, ...rest)
const crispAtlas = () => {
  const mats = noa.rendering.scene.materials
  for (let i = 0; i < mats.length; i++) {
    const plugList = mats[i].pluginManager && mats[i].pluginManager._plugins
    if (!plugList) continue
    for (let j = 0; j < plugList.length; j++) {
      const plug = plugList[j]
      if (!plug || plug.__crisp || !plug.getCustomCode) continue
      const frag = plug.getCustomCode('fragment')
      if (!frag) continue
      let uses = false
      for (const k in frag) if (typeof frag[k] === 'string' && frag[k].indexOf('atlasTexture') >= 0) uses = true
      if (!uses) continue
      const orig = plug.getCustomCode.bind(plug)
      plug.getCustomCode = (stage) => {
        const code = orig(stage)
        if (!code || stage !== 'fragment') return code
        const out = {}
        for (const k in code) {
          const v = code[k]
          out[k] = typeof v === 'string'
            ? v.replace(
              'baseColor = texture(atlasTexture, vec3(vDiffuseUV, texAtlasIndex));',
              'vec2 crispF = fract(vDiffuseUV); baseColor = texture(atlasTexture, vec3((crispF * 32.0 + 2.0) / 36.0, texAtlasIndex));'
            )
            : v
        }
        return out
      }
      plug.__crisp = 1
    }
  }
}
noa.rendering.scene.onBeforeRenderObservable.add(crispAtlas)
const mats = [
  'grass_top', 'dirt_grass', 'dirt', 'stone', 'greystone', 'stone_coal', 'sand', 'gravel_stone',
  'brick_red', 'brick_grey', 'wood', 'trunk_top', 'trunk_side', 'leaves', 'cotton_blue',
  'cotton_green', 'cotton_red', 'cotton_tan', 'snow', 'ice', 'redsand',
]
mats.forEach((m) => noa.registry.registerMaterial(m, tile(m)))
noa.registry.registerMaterial('glass', { textureURL: 'assets/glass.png', texHasAlpha: true })

noa.registry.registerMaterial('coreplate', tile('coreplate'))
noa.registry.registerMaterial('workbench', tile('workbench'))
noa.registry.registerMaterial('benchTop', tile('workbench'))
noa.registry.registerMaterial('benchSide', tile('benchSide'))
noa.registry.registerMaterial('ovenBrick', tile('ovenBrick'))
noa.registry.registerMaterial('ovenFront', tile('ovenFront'))
noa.registry.registerMaterial('oven', tile('ovenFront'))
noa.registry.registerMaterial('vend', tile('vend'))
noa.registry.registerMaterial('store', tile('store'))
noa.registry.registerMaterial('bunk', tile('bunk'))
// Pixel-art wrap materials for batch 1
registerWrapMaterials(noa);
const shapeScene = noa.rendering.scene
function dye(name, r, g, b, a) {
  const mat = noa.rendering.makeStandardMaterial(name)
  mat.diffuseColor = new Color3(r, g, b)
  mat.ambientColor = new Color3(r * 0.45, g * 0.45, b * 0.45)
  mat.specularColor = new Color3(0, 0, 0)
  mat.backFaceCulling = false
  if (a != null && a < 1) { mat.alpha = a; mat.transparencyMode = 2 }
  return mat
}
function part(name, w, h, d, x, y, z, rx, mat) {
  const mesh = CreateBox(name, { width: w, height: h, depth: d }, shapeScene)
  mesh.material = mat
  mesh.position.set(x, y, z)
  if (rx) mesh.rotation.x = rx
  mesh.bakeCurrentTransformIntoVertices()
  mesh.position.set(0, 0, 0)
  mesh.rotation.set(0, 0, 0)
  mesh.isPickable = false
  return mesh
}
function shape(name, parts, mat) {
  const mesh = parts.length === 1 ? parts[0] : Mesh.MergeMeshes(parts, true, true)
  mesh.name = name
  mesh.material = mat
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
const woodD = dye('shape-wood', 0.72, 0.48, 0.24)
const glassD = dye('shape-glass', 0.55, 0.86, 0.95, 0.45)
const metalD = dye('shape-metal', 0.55, 0.6, 0.66)
const slideD = dye('shape-slide', 0.25, 0.72, 0.7, 0.5)
const handleD = dye('shape-handle', 0.96, 0.78, 0.28)
const buttonD = dye('shape-button', 0.86, 0.2, 0.22)
const lampD = dye('shape-lamp', 1, 0.84, 0.32)
lampD.emissiveColor = new Color3(0.95, 0.62, 0.12)
const wheatStalk = noa.rendering.makeStandardMaterial('wheat-stalk')
wheatStalk.diffuseColor = new Color3(0.22, 0.62, 0.18)
wheatStalk.ambientColor = new Color3(0.82, 0.9, 0.78)
wheatStalk.specularColor = new Color3(0, 0, 0)
wheatStalk.backFaceCulling = false
const wheatHead = noa.rendering.makeStandardMaterial('wheat-head')
wheatHead.diffuseColor = new Color3(0.95, 0.76, 0.18)
wheatHead.ambientColor = new Color3(0.95, 0.9, 0.7)
wheatHead.specularColor = new Color3(0, 0, 0)
wheatHead.backFaceCulling = false
function paintTallDoor(kind) {
  const c = document.createElement('canvas')
  c.width = 64
  c.height = 128
  const g = c.getContext('2d', { willReadFrequently: true })
  const wood = kind === 'wood'
  const glass = kind === 'glass'
  const metal = kind === 'metal'
  const frame = wood ? '#3A2415' : metal ? '#2A3138' : glass ? '#F4FBFE' : '#08332F'
  const frameIn = wood ? '#6B3E26' : metal ? '#3E474F' : glass ? '#D7F3FA' : '#146964'
  if (wood || metal) {
    const bands = wood
      ? ['#E8C27A', '#C9954C', '#E0B56A', '#D7A45A', '#E4B56A', '#C9954C', '#E8C27A']
      : ['#9AA3AB', '#7D868E', '#B0B8BF', '#8A939B', '#9AA3AB', '#7D868E', '#B0B8BF']
    const top = 8
    const bot = 120
    const n = bands.length
    for (let i = 0; i < n; i++) {
      const y0 = top + Math.round((bot - top) * i / n)
      const y1 = top + Math.round((bot - top) * (i + 1) / n)
      g.fillStyle = bands[i]
      g.fillRect(8, y0, 48, y1 - y0)
    }
  } else {
    g.clearRect(0, 0, 64, 128)
    g.fillStyle = glass ? 'rgba(186, 228, 244, 0.62)' : 'rgba(46, 168, 162, 0.55)'
    g.fillRect(8, 8, 48, 112)
  }
  g.fillStyle = frame
  g.fillRect(0, 0, 8, 128)
  g.fillRect(56, 0, 8, 128)
  g.fillRect(0, 0, 64, 8)
  g.fillRect(0, 120, 64, 8)
  g.fillStyle = frameIn
  g.fillRect(8, 8, 3, 112)
  g.fillRect(53, 8, 3, 112)
  g.fillRect(8, 8, 48, 3)
  g.fillRect(8, 117, 48, 3)
  g.fillStyle = metal ? '#E6EEF2' : '#F6C453'
  g.beginPath(); g.arc(46, 78, 5, 0, Math.PI * 2); g.fill()
  g.fillStyle = metal ? '#2A3138' : '#8A5A20'
  g.beginPath(); g.arc(46, 78, 2.2, 0, Math.PI * 2); g.fill()
  return c
}
function readCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  c.getContext('2d', { willReadFrequently: true })
  return c
}
function doorHalfTex(name, src, top, alpha) {
  const tex = new DynamicTexture(name, readCanvas(64, 64), shapeScene, false, Texture.NEAREST_SAMPLINGMODE)
  tex.hasAlpha = !!alpha
  const ctx = tex.getContext()
  ctx.clearRect(0, 0, 64, 64)
  ctx.drawImage(src, 0, top ? 0 : 64, 64, 64, 0, 0, 64, 64)
  tex.update()
  return tex
}
function doorHalfMat(name, tex, alpha) {
  const mat = noa.rendering.makeStandardMaterial(name)
  mat.diffuseTexture = tex
  mat.specularColor = new Color3(0.06, 0.05, 0.04)
  mat.ambientColor = new Color3(0.62, 0.6, 0.56)
  mat.backFaceCulling = false
  if (alpha) {
    tex.hasAlpha = true
    mat.useAlphaFromDiffuseTexture = true
    mat.transparencyMode = 2
  }
  return mat
}
const DOOR_ART = {}
for (const kind of ['wood', 'glass', 'metal', 'slide']) {
  const src = paintTallDoor(kind)
  const alpha = kind === 'glass' || kind === 'slide'
  DOOR_ART[kind] = {
    top: doorHalfMat('door-' + kind + '-top', doorHalfTex('door-' + kind + '-top-tex', src, true, alpha), alpha),
    bot: doorHalfMat('door-' + kind + '-bot', doorHalfTex('door-' + kind + '-bot-tex', src, false, alpha), alpha),
  }
}
function doorPanel(kind, open, half) {
  const faceUV = []
  faceUV[0] = new Vector4(0, 1, 1, 0)
  const mesh = CreateBox('door-' + kind + '-' + half + (open ? '-o' : '-c'), { width: 0.9, height: 1, depth: 0.12, faceUV }, shapeScene)
  mesh.material = DOOR_ART[kind][half]
  mesh.position.set(0, 0.5, 0)
  if (open) {
    mesh.setPivotPoint(new Vector3(-0.45, 0, 0))
    mesh.rotation.y = 1.25
  }
  mesh.bakeCurrentTransformIntoVertices()
  mesh.setPivotPoint(new Vector3(0, 0, 0))
  mesh.position.set(0, 0, 0)
  mesh.rotation.set(0, 0, 0)
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
const ovenHotTex = new Texture('assets/tile-oven-hot.png', shapeScene, false, true, Texture.NEAREST_SAMPLINGMODE)
ovenHotTex.hasAlpha = false
const ovenHotMat = new StandardMaterial('oven-hot-face', shapeScene)
ovenHotMat.diffuseTexture = ovenHotTex
ovenHotMat.emissiveTexture = ovenHotTex
ovenHotMat.emissiveColor = new Color3(1, 0.85, 0.55)
ovenHotMat.specularColor = new Color3(0, 0, 0)
ovenHotMat.disableLighting = true
ovenHotMat.backFaceCulling = false
function flatFace(name, url) {
  const tex = new Texture(url, shapeScene, false, true, Texture.NEAREST_SAMPLINGMODE)
  tex.hasAlpha = false
  const mat = new StandardMaterial(name, shapeScene)
  mat.diffuseTexture = tex
  mat.emissiveTexture = tex
  mat.emissiveColor = new Color3(0.62, 0.62, 0.62)
  mat.specularColor = new Color3(0, 0, 0)
  mat.disableLighting = true
  mat.backFaceCulling = false
  return mat
}
const ovenFaceMat = flatFace('oven-front-face', 'assets/tile-oven-front.png')
const benchFaceMat = flatFace('bench-front-face', 'assets/tile-workbench-side.png')
function crateFaceURL() {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 32
  const g = c.getContext('2d', { willReadFrequently: true })
  g.fillStyle = '#d2b48c'
  g.fillRect(0, 0, 32, 32)
  g.strokeStyle = '#5c3a1e'
  g.lineWidth = 4
  g.strokeRect(3, 3, 26, 26)
  g.fillStyle = '#6b4423'
  g.fillRect(14, 13, 4, 7)
  return c.toDataURL()
}
const boxFaceMat = flatFace('box-front-face', crateFaceURL())
const ovenGlows = new Map()
function crossed(mat, w, h, d, y, yaw) {
  const mesh = CreateBox('wx', { width: w, height: h, depth: d }, shapeScene)
  mesh.material = mat
  mesh.position.set(0, y, 0)
  mesh.rotation.y = yaw
  mesh.bakeCurrentTransformIntoVertices()
  mesh.position.set(0, 0, 0)
  mesh.rotation.set(0, 0, 0)
  mesh.isPickable = false
  return mesh
}
function wheatMesh() {
  const parts = []
  for (const yaw of [0.55, -0.55]) {
    parts.push(crossed(wheatStalk, 0.62, 0.34, 0.04, 0.2, yaw))
    parts.push(crossed(wheatHead, 0.36, 0.2, 0.055, 0.44, yaw))
  }
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = 'wheat'
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
const soilD = dye('shape-soil', 0.55, 0.36, 0.16)
const furrowD = dye('shape-furrow', 0.25, 0.14, 0.07)
const dropD = dye('shape-waterdrop', 0.23, 0.51, 0.96)
function farmlandMesh(wet) {
  const body = part('soil', 1, 0.94, 1, 0, 0.47, 0, 0, wet ? furrowD : soilD)
  const bits = [body]
  for (let i = 0; i < 4; i++) bits.push(part('fur' + i, 0.9, 0.05, 0.08, 0, 0.96, -0.33 + i * 0.22, 0, furrowD))
  if (wet) bits.push(part('drop', 0.1, 0.08, 0.1, 0.28, 0.99, -0.28, 0, dropD))
  return shape(wet ? 'farmland-wet' : 'farmland', bits, wet ? furrowD : soilD)
}
function farmlandWetMesh() {
  const body = part('soil', 1, 0.94, 1, 0, 0.47, 0, 0, furrowD)
  const bits = [body]
  for (let i = 0; i < 4; i++) bits.push(part('fur' + i, 0.9, 0.05, 0.08, 0, 0.96, -0.33 + i * 0.22, 0, furrowD))
  bits.push(part('drop', 0.18, 0.16, 0.18, 0.28, 1.02, -0.28, 0, dropD))
  const mesh = Mesh.MergeMeshes(bits, true, true, undefined, false, true)
  mesh.name = 'farmland-wet'
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
const waterMat = dye('shape-water', 0.18, 0.45, 0.95, 0.55)
waterMat.backFaceCulling = true
function waterMesh() {
  return shape('water', [part('w', 0.98, 0.98, 0.98, 0, 0.5, 0, 0, waterMat)], waterMat)
}
function cropGreen(name, r, g, b, er, eg, eb) {
  const mat = noa.rendering.makeStandardMaterial(name)
  mat.diffuseColor = new Color3(r, g, b)
  mat.ambientColor = new Color3(r * 0.25, g * 0.25, b * 0.25)
  mat.emissiveColor = new Color3(er, eg, eb)
  mat.specularColor = new Color3(0, 0, 0)
  mat.backFaceCulling = false
  return mat
}
const sproutMat = cropGreen('crop-sprout', 0.55, 0.95, 0.28, 0.16, 0.42, 0.06)
const leafyMat = cropGreen('crop-leafy', 0.18, 0.7, 0.12, 0.04, 0.22, 0.02)
const tallMat = cropGreen('crop-tall', 0.05, 0.38, 0.07, 0.015, 0.12, 0.015)
const ripeStalk = dye('crop-ripe-stalk', 0.76, 0.58, 0.12)
const ripeHead = dye('crop-ripe-head', 0.98, 0.82, 0.2)
ripeHead.emissiveColor = new Color3(0.45, 0.32, 0.05)
const sparkMat = dye('crop-spark', 1, 0.95, 0.55)
sparkMat.emissiveColor = new Color3(1, 0.92, 0.35)
function cropMesh(n) {
  const body = [sproutMat, leafyMat, tallMat, ripeStalk][n]
  const h = [0.32, 0.52, 0.74, 0.8][n]
  const y = [0.18, 0.28, 0.4, 0.42][n]
  const w = [0.36, 0.56, 0.68, 0.7][n]
  const parts = []
  for (const yaw of [0.55, -0.55]) {
    parts.push(crossed(body, w, h, 0.045, y, yaw))
    if (n === 3) parts.push(crossed(ripeHead, 0.42, 0.22, 0.06, y + h * 0.4, yaw))
  }
  if (n === 3) {
    parts.push(part('sp1', 0.08, 0.08, 0.08, 0.18, 0.92, 0.1, 0, sparkMat))
    parts.push(part('sp2', 0.06, 0.06, 0.06, -0.14, 0.72, -0.1, 0, sparkMat))
  }
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = 'crop-' + n
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function blob(name, d, x, y, z, mat) {
  const mesh = CreateSphere(name, { diameter: d, segments: 5 }, shapeScene)
  mesh.material = mat
  mesh.position.set(x, y, z)
  mesh.bakeCurrentTransformIntoVertices()
  mesh.position.set(0, 0, 0)
  mesh.isPickable = false
  return mesh
}
const bushLeafMat = cropGreen('bush-leaf', 0.18, 0.62, 0.16, 0.04, 0.16, 0.03)
const bushDeep = cropGreen('bush-deep', 0.06, 0.38, 0.1, 0.02, 0.1, 0.02)
const berryMat = dye('bush-berry', 0.86, 0.14, 0.18)
berryMat.emissiveColor = new Color3(0.35, 0.04, 0.05)
function bushMesh(n) {
  const parts = []
  const stemH = [0.16, 0.22, 0.26, 0.26][n]
  parts.push(part('stem', 0.07, stemH, 0.07, 0, stemH / 2, 0, 0, bushDeep))
  const canopy = [0.28, 0.44, 0.62, 0.66][n]
  const cy = [0.22, 0.34, 0.46, 0.48][n]
  parts.push(blob('can', canopy, 0, cy, 0, n >= 2 ? bushDeep : bushLeafMat))
  if (n >= 1) {
    parts.push(blob('l', canopy * 0.55, -0.16, cy * 0.75, 0.06, bushLeafMat))
    parts.push(blob('r', canopy * 0.52, 0.16, cy * 0.8, -0.05, bushLeafMat))
  }
  if (n === 3) {
    parts.push(blob('b1', 0.13, -0.16, cy + 0.06, 0.12, berryMat))
    parts.push(blob('b2', 0.13, 0.18, cy, -0.1, berryMat))
    parts.push(blob('b3', 0.11, 0.02, cy + 0.16, 0.02, berryMat))
    parts.push(part('sp', 0.08, 0.08, 0.08, 0.22, cy + 0.28, 0.06, 0, sparkMat))
  }
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = 'bush-' + n
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function tuftMesh() {
  const parts = []
  for (const yaw of [0.35, 1.15]) parts.push(crossed(wheatStalk, 0.36, 0.4, 0.03, 0.14, yaw))
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = 'tuft'
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function leverMesh(on) {
  const base = part('b', 0.5, 0.14, 0.5, 0, 0.07, 0, 0, woodD)
  const handle = part('h', 0.1, 0.56, 0.1, 0, 0.46, on ? 0.16 : -0.16, on ? 1 : -1, handleD)
  return shape(on ? 'lever-on' : 'lever-off', [base, handle], on ? handleD : woodD)
}
function buttonMesh(on) {
  const plate = part('p', 0.7, 0.7, 0.1, 0, 0.5, -0.18, 0, buttonD)
  const cap = part('c', 0.34, 0.34, on ? 0.08 : 0.28, 0, 0.5, on ? -0.1 : 0.06, 0, buttonD)
  return shape(on ? 'button-in' : 'button-out', [plate, cap], buttonD)
}
function lanternMesh() {
  const body = part('b', 0.46, 0.46, 0.46, 0, 0.48, 0, 0, lampD)
  const cap = part('c', 0.18, 0.08, 0.18, 0, 0.76, 0, 0, woodD)
  return shape('lantern', [body, cap], lampD)
}
function lampShape(name, parts, shadeMat) {
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = name
  mesh.material = shadeMat
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function floorLampMesh(on) {
  const base = part('base', 0.22, 0.06, 0.22, 0, 0.03, 0, 0, woodD)
  const stem = part('stem', 0.06, 0.72, 0.06, 0, 0.42, 0, 0, woodD)
  const shadeMat = on ? lampD : woodD
  const shade = part('shade', 0.28, 0.18, 0.28, 0, 0.84, 0, 0, shadeMat)
  return lampShape('floorLamp' + (on ? 'On' : 'Off'), [base, stem, shade], shadeMat)
}
function mergeMats(name, parts) {
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, true)
  mesh.name = name
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function wallLampMesh(on) {
  const arm = part('arm', 0.08, 0.08, 0.18, 0, 0.55, -0.41, 0, woodD)
  const shadeMat = on ? lampD : woodD
  const shade = part('shade', 0.22, 0.22, 0.22, 0, 0.55, -0.2, 0, shadeMat)
  return mergeMats('wallLamp' + (on ? 'On' : 'Off'), [arm, shade])
}
function wallLampFacing(mesh, x, y, z) {
  const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
  const side = rec && rec.side
  const yaw = side === 'E' ? Math.PI / 2 : side === 'W' ? -Math.PI / 2 : side === 'N' ? Math.PI : 0
  mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw, 0, 0)
  mesh.rotation.x = 0
  mesh.rotation.y = yaw
  mesh.rotation.z = 0
}
const rugEdge = dye('rug-edge', 0.28, 0.14, 0.09)
rugEdge.emissiveColor = new Color3(0.09, 0.04, 0.025)
const rugMid = dye('rug-mid', 0.46, 0.22, 0.13)
rugMid.emissiveColor = new Color3(0.15, 0.07, 0.035)
function rugMesh() {
  const edge = part('edge', 0.92, 0.05, 0.92, 0, 0.025, 0, 0, rugEdge)
  const mid = part('mid', 0.58, 0.052, 0.58, 0, 0.027, 0, 0, rugMid)
  return mergeMats('rug', [edge, mid])
}
const SHAPES = {
  28: wheatMesh(),
  49: farmlandMesh(false),
  58: tuftMesh(),
  59: cropMesh(0),
  60: cropMesh(1),
  61: cropMesh(2),
  62: cropMesh(3),
  63: farmlandWetMesh(),
  64: waterMesh(),
  65: bushMesh(0),
  66: bushMesh(1),
  67: bushMesh(2),
  68: bushMesh(3),
  30: doorPanel('wood', false, 'bot'),
  31: doorPanel('wood', true, 'bot'),
  32: doorPanel('glass', false, 'bot'),
  33: doorPanel('glass', true, 'bot'),
  34: doorPanel('metal', false, 'bot'),
  35: doorPanel('metal', true, 'bot'),
  36: doorPanel('slide', false, 'bot'),
  37: doorPanel('slide', true, 'bot'),
  50: doorPanel('wood', false, 'top'),
  51: doorPanel('wood', true, 'top'),
  52: doorPanel('glass', false, 'top'),
  53: doorPanel('glass', true, 'top'),
  54: doorPanel('metal', false, 'top'),
  55: doorPanel('metal', true, 'top'),
  56: doorPanel('slide', false, 'top'),
  57: doorPanel('slide', true, 'top'),
  38: leverMesh(false),
  39: leverMesh(true),
  40: buttonMesh(false),
  41: buttonMesh(true),
  47: lanternMesh(),
  1100: floorLampMesh(false),
  1101: floorLampMesh(true),
  1102: wallLampMesh(false),
  1103: wallLampMesh(true),
  1104: rugMesh(),
  1105: rugMesh(),
}
const clayMat = dye('clay-soil', 0.64, 0.5, 0.38)
noa.registry.registerMaterial('clay', { renderMaterial: clayMat })
for (const [id, name, material] of BLOCKS) {
  const open = typeof name === 'string' && name.endsWith('Open')
  const glass = material === 'glass'
  const mesh = SHAPES[id]
  const lantern = id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103
  const rug = id === 1104 || id === 1105
  const plant = id === 28 || id === 58 || isCropId(id) || isBushId(id)
  const tilled = id === DRY || id === WET
  const fluid = id === WATER
  const opts = { material: mesh && !fluid ? null : material, opaque: tilled || (!mesh && !open && !glass && !fluid), solid: tilled || (!open && !lantern && !plant && !fluid && !rug) }
  if (fluid) { opts.fluid = true; opts.opaque = false; opts.solid = false }
  if (mesh && !fluid) opts.blockMesh = mesh
  if (id === 1102 || id === 1103) opts.onCustomMeshCreate = wallLampFacing
  if (isDoor(id)) {
    const fix = (x, y, z) => queueMicrotask(() => normalizeDoorTop(x, y, z))
    opts.onSet = fix
    opts.onLoad = fix
  }
  noa.registry.registerBlock(id, opts)
}
noa.registry.registerMaterial('missingCrate', { textureURL: 'assets/tile-missing.png' })
noa.registry.registerBlock(1000, { material: 'missingCrate', opaque: true, solid: true })
function ensureMissingBlock(id) {
  if (id < 1001 || id > 1099) return
  noa.registry.registerBlock(id, { material: 'missingCrate', opaque: true, solid: true })
}
function blockPalette() {
  const p = ['air']
  for (const b of BLOCKS) p[b[0]] = b[1]
  const used = new Set()
  for (const data of saved.values()) for (let i = 0; i < data.length; i++) {
    const id = data[i]
    if (id >= 1001 && id <= 1099) used.add(id)
  }
  for (const [id, name] of unknownEntries()) if (used.has(id)) p[id] = name
  return p
}
const ID = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
const OPEN_IDS = new Set(BLOCKS.filter((b) => String(b[1]).endsWith('Open')).map((b) => b[0]))
noa.blockTargetIdCheck = (id) => OPEN_IDS.has(id) || id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103 || id === 1104 || id === 1105 || id === ID.wheat || id === ID.tuft || isCropId(id) || isBushId(id) || noa.registry.getBlockSolidity(id)
const blockName = (id) => {
  const row = BLOCKS.find((b) => b[0] === id)
  return t(row ? String(row[1]).replace(/Top/g, '') : 'stone')
}

const S = 24
const saved = new Map()
let dirty = false
let allowSave = false
let readOnlySave = false
let voxelQuiet = false
let pinGen = 0
let machineTimer = 0
const machineCells = new Map()
function hash(x, z) { let h = (x * 374761393 + z * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296 }
function heightAt(x, z) {
  const xi = x | 0
  const zi = z | 0
  const i = Math.floor(xi / S)
  const k = Math.floor(zi / S)
  const stamped = genSeen[key(i, 0, k)]
  const g = stamped == null ? genVersion : (stamped | 0)
  const col = peekColumn(xi, zi)
  if (col) {
    if (g < 4) return col.base
    let add = col.hills
    const f = fadeDist(xi, 0, zi)
    if (f < 12) add = Math.round(add * f / 12)
    const h = col.base + add
    return h > 23 ? 23 : h
  }
  return groundAt(xi, zi, g, (qx, qz) => fadeDist(qx, 0, qz))
}
const TOWN = { x0: -20, x1: 36, z0: -18, z1: 28, y: FLOOR }
function inTown(x, z) { return x >= TOWN.x0 && x <= TOWN.x1 && z >= TOWN.z0 && z <= TOWN.z1 }
function box(x, z, x0, x1, z0, z1) { return x >= x0 && x <= x1 && z >= z0 && z <= z1 }
// Hand-made Bertyville on seed 1: workshop, gravel road, ice pond, three empty plots. Not a copied village.
function townVoxel(x, y, z) {
  const h = TOWN.y
  if (y < h - 3) return coalHere(x, y, z) ? ID.coal : ID.stone
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
    if (x === 6 && z === 8 && y === h + 1) return ID.workbench
    if (x === 11 && z === 8 && y === h + 1) return ID.oven
    if (x === 10 && z === 6 && y === h + 1) return ID.bunk
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
  if (makerLive.preset === 'flat' || makerLive.preset === 'void') {
    const name = makerBlock(makerLive.preset, x, y, z, worldSpawn)
    return name ? (ID[name] || 0) : 0
  }
  const g = seenGen(x, y, z)
  const name = genBlock(x, y, z, g, (qx, qz) => fadeDist(qx, y, qz))
  return name ? (ID[name] || 0) : 0
}
const key = (i, j, k) => i + ',' + j + ',' + k
let genVersion = GEN
let genSeen = {}
let makerNext = null
let makerDraft = null
function defaultMaker() {
  return { preset: 'normal', hills: 2, water: 2, trees: 2, seed: 0, adj: 0, noun: 0 }
}
let makerLive = defaultMaker()
function makerEnabled() {
  try { return localStorage.getItem('bloxbert-maker') !== '0' } catch (e) { return true }
}
function seenGen(x, y, z) {
  const k = key(Math.floor(x / S), Math.floor(y / S), Math.floor(z / S))
  if (genSeen[k] == null) {
    genSeen[k] = GEN
    dirty = true
  }
  return genSeen[k]
}
function fadeDist(x, y, z) {
  const i = Math.floor(x / S)
  const j = Math.floor(y / S)
  const k = Math.floor(z / S)
  let best = 12
  for (let di = -1; di <= 1; di++) for (let dk = -1; dk <= 1; dk++) {
    if (!di && !dk) continue
    const g = genSeen[key(i + di, j, k + dk)]
    if (g == null || (g | 0) >= 4) continue
    const nx0 = (i + di) * S
    const nz0 = (k + dk) * S
    const dx = x < nx0 ? nx0 - x : x > nx0 + S - 1 ? x - (nx0 + S - 1) : 0
    const dz = z < nz0 ? nz0 - z : z > nz0 + S - 1 ? z - (nz0 + S - 1) : 0
    const d = Math.max(dx, dz) - 1
    if (d < best) best = d
  }
  return best > 0 ? best : 0
}
function compactSeen() {
  const out = {}
  for (const k of Object.keys(genSeen)) out[k] = genSeen[k] | 0
  return out
}
function fillGenerated(data, x0, y0, z0) {
  if (makerLive.preset === 'flat' || makerLive.preset === 'void') {
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
      const name = makerBlock(makerLive.preset, x0 + i, y0 + j, z0 + k, worldSpawn)
      data[i * S * S + j * S + k] = name ? (ID[name] || 0) : 0
    }
    return
  }
  const g = seenGen(x0, y0, z0)
  const fadeArr = new Int8Array(S * S)
  for (let i = 0; i < S; i++) for (let k = 0; k < S; k++) fadeArr[i * S + k] = fadeDist(x0 + i, y0, z0 + k)
  const cols = genColumns(x0, z0, g, fadeArr)
  if (underAll(x0, y0, z0, cols)) {
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
      const name = solidUnder(x0 + i, y0 + j, z0 + k)
      data[i * S * S + j * S + k] = name ? (ID[name] || 0) : 0
    }
    return
  }
  const fade = (qx, qz) => {
    const i = (qx | 0) - x0
    const k = (qz | 0) - z0
    if (i >= 0 && i < S && k >= 0 && k < S) return fadeArr[i * S + k]
    return fadeDist(qx, y0, qz)
  }
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
    const name = genBlock(x0 + i, y0 + j, z0 + k, g, fade, cols)
    data[i * S * S + j * S + k] = name ? (ID[name] || 0) : 0
  }
}
const genQueue = []
function chunkPending(id) {
  const parts = id.split('|')
  return noa.world._chunksPending.includes(+parts[0], +parts[1], +parts[2])
}
function drainGen() {
  if (!genQueue.length) return
  const p = noa.entities.getPosition(noa.playerEntity)
  const px = p[0]
  const py = p[1]
  const pz = p[2]
  for (let n = 0; n < genQueue.length; n++) {
    const job = genQueue[n]
    const dx = job.x + 12 - px
    const dy = job.y + 12 - py
    const dz = job.z + 12 - pz
    job.d = dx * dx + dy * dy + dz * dz
  }
  genQueue.sort((a, b) => a.d - b.d)
  const t0 = performance.now()
  let added = 0
  while (genQueue.length && added < 2 && performance.now() - t0 < 6) {
    const job = genQueue.shift()
    if (!chunkPending(job.id)) continue
    const s = saved.get(key(job.x / S, job.y / S, job.z / S))
    if (s) job.arr.data.set(s)
    else if (job.y > 24) { seenGen(job.x, job.y, job.z); job.arr.data.fill(0) }
    else fillGenerated(job.arr.data, job.x, job.y, job.z)
    noa.world.setChunkData(job.id, job.arr)
    added++
  }
}
noa.on('beforeRender', drainGen)
noa.world.on('worldDataNeeded', (id, arr, x, y, z) => {
  const s = saved.get(key(x / S, y / S, z / S))
  if (s) { arr.data.set(s); noa.world.setChunkData(id, arr); return }
  if (y > 24) { seenGen(x, y, z); arr.data.fill(0); noa.world.setChunkData(id, arr); return }
  genQueue.push({ id, arr, x, y, z, d: 0 })
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
  const prev = s[i * S * S + j * S + kk]
  s[i * S * S + j * S + kk] = v
  if ((prev >= 1100 && prev <= 1105) || (v >= 1100 && v <= 1105)) {
    if (typeof syncGlow === 'function') syncGlow._dirty = true
  }
  if (draw) drawVoxel(x, y, z, v)
  if (!voxelQuiet) {
    dirty = true
    markSave(t('notSaved'))
    if (isMachineId(prev) || isMachineId(v)) trackMachine(x, y, z, v)
  }
  if (prev !== v) afterVoxel(x, y, z, prev, v)
}
let soilBusy = false
function afterVoxel(x, y, z, prev, next) {
  if (soilBusy) return
  if ((isCropId(prev) || isBushId(prev)) && !(isCropId(next) || isBushId(next))) farm.remove(x, y, z)
  const soil = prev === DRY || prev === WET || next === DRY || next === WET
  const water = prev === WATER || next === WATER
  if (!soil && !water) return
  soilBusy = true
  try {
    if (water) {
      for (let dx = -4; dx <= 4; dx++) for (let dz = -4; dz <= 4; dz++) {
        syncSoil(x + dx, y, z + dz)
        syncSoil(x + dx, y + 1, z + dz)
        touchBush(x + dx, y, z + dz)
        touchBush(x + dx, y + 1, z + dz)
      }
    }
    if (soil) {
      syncSoil(x, y, z)
      if (next !== DRY && next !== WET) {
        const crop = farm.get(x, y + 1, z)
        if (crop) {
          advance(crop, Date.now())
          crop.wet = crop.kind === 'bush' ? nearWater(getVoxel, x, y, z) : false
        }
      }
    }
  } finally { soilBusy = false }
}
function touchBush(sx, sy, sz) {
  const row = farm.get(sx, sy + 1, sz)
  if (!row || row.kind !== 'bush') return
  const wet = nearWater(getVoxel, sx, sy, sz)
  if (!!row.wet === wet) return
  advance(row, Date.now())
  row.wet = wet
}
function syncSoil(x, y, z) {
  const id = getVoxel(x, y, z)
  if (id !== DRY && id !== WET) return
  const wet = nearWater(getVoxel, x, y, z)
  const want = wet ? WET : DRY
  if (id !== want) setVoxel(x, y, z, want)
  if (wet && learn && learn.addNote('farmWet')) showCard(t('farmWet'))
  const crop = farm.get(x, y + 1, z)
  if (crop && !!crop.wet !== wet) {
    advance(crop, Date.now())
    crop.wet = wet
  }
}
function normalizeDoorTop(x, y, z) {
  const id = getVoxel(x, y, z)
  if (!isDoor(id) || isDoorTop(id)) return
  const below = getVoxel(x, y - 1, z)
  if (!isDoor(below) || isDoorTop(below) || doorKind(below) !== doorKind(id)) return
  setVoxel(x, y, z, doorTopId(id))
}
const edits = createEdits({
  getVoxel,
  setVoxel,
  invalidate: (box) => noa.world.invalidateVoxelsInAABB(box),
})
const changeLog = createLog({ dbName: __BLOX_STUDENT__ ? 'bloxlog' : 'bloxlog-test', worldId: 'bertyville', chunkSize: S })
function edit(x, y, z, v) {
  if (zoneLocked(x, y, z)) return false
  if (v) {
    const was = getVoxel(x, y, z)
    if (was === ID.bunk || was === ID.vend || was === ID.box || was === ID.woodshop || was === ID.woodshopSide) return false
  }
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
  const c = noa.camera, max = 89 * Math.PI / 180
  if (!Number.isFinite(h)) h = c.heading || 0
  if (!Number.isFinite(p)) p = c.pitch || 0
  c.heading = ((h % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
  c.pitch = Math.max(-max, Math.min(max, p))
  const d = c.getDirection()
  const cp = Math.cos(c.pitch)
  d[0] = cp * Math.sin(c.heading); d[1] = -Math.sin(c.pitch); d[2] = cp * Math.cos(c.heading)
}
setLook(0, 0.18)

let current = ID.brickRed
let tableMode = false
let flying = false
let inspectOn = false
let holdPick = false
let tableCursor = [8, TOWN.y + 1, 6]
let session = null
function passCropAim(id) {
  if (!session || !session.selectedItem || !isCropId(id)) return false
  const held = session.selectedItem() || ''
  return held === 'wheatSeeds' || held === 'hoe'
}
function passThrough(id) {
  if (id === WATER) {
    const held = session && session.selectedItem && session.selectedItem()
    return held !== 'bushSprout'
  }
  return passCropAim(id)
}
noa.blockTargetIdCheck = (id) => {
  if (id === WATER && session && session.selectedItem && session.selectedItem() === 'bushSprout') return true
  return !passThrough(id) && (OPEN_IDS.has(id) || id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103 || id === 1104 || id === 1105 || id === ID.wheat || id === ID.tuft || isCropId(id) || isBushId(id) || noa.registry.getBlockSolidity(id))
}
let basics = null
let panels = null
function survivalOn() { return !!(session && session.mode === 'survival') }
function canReach(pos) {
  if (!pos) return false
  const p = noa.entities.getPosition(noa.playerEntity)
  return inReach(p[0], p[1], p[2], pos[0], pos[1], pos[2], Effects.reach(reachFor(survivalOn())))
}
let farPress = 0
let farHit = null
let farKeyAt = 0
function toastFar() {
  if (farPress) return
  farPress = 1
  toast(t('tooFar'))
}
function releaseFar() { setTimeout(() => { farPress = 0 }, 0) }
function toastFarKey() {
  const now = performance.now()
  if (now - farKeyAt < 600) return
  farKeyAt = now
  toast(t('tooFar'))
}
function heldPlaceKey() {
  if (survivalOn()) {
    const held = session && session.selectedItem ? session.selectedItem() || '' : ''
    if (!held || held === 'berry' || held === 'bread' || held === 'cupcake') return ''
    if (!(session && session.blockForHot && session.blockForHot())) return ''
    return held
  }
  return current ? 'block' : ''
}
function placeableHeld() { return !!heldPlaceKey() }
function machineKind(id) {
  if (id === ID.oven || id === 23) return 'oven'
  if (id === ID.workbench || id === 22) return 'bench'
  if (id === ID.vend) return 'vend'
  if (id === ID.bunk) return 'bunk'
  if (id === ID.box) return 'box'
  if (id === ID.woodshop || id === ID.woodshopSide) return 'woodshop'
  if (id === ID.storeCounter) return 'shop'
  return ''
}
function crouching() { return !!(crouchKey || crouchOn) }
function mutedUse(block) {
  if (!block || !block.position || !muteUseKey) return false
  if (performance.now() > muteUseUntil) return false
  return block.position.join(',') === muteUseKey
}
function againstMachine(block) {
  if (!block || !machineKind(block.blockID || block.id) || !placeableHeld()) return false
  return crouching()
}
function noteCrouchHint() {
  if (crouchHintN >= 3) return
  if (!heldPlaceKey()) return
  crouchHintN += 1
  toast(t('crouchPlace'))
  const el = $('toast')
  if (el) el.style.zIndex = '60'
}
function landingCell(aimed) {
  if (!aimed || !aimed.position) return null
  const id = aimed.blockID != null ? aimed.blockID : aimed.id
  if (id === ID.wheat || id === ID.tuft) return { x: Math.round(aimed.position[0]), y: Math.round(aimed.position[1]), z: Math.round(aimed.position[2]) }
  const sx = Math.round(aimed.position[0])
  const sy = Math.round(aimed.position[1])
  const sz = Math.round(aimed.position[2])
  const n = aimed.normal
  let nx = 0, ny = 0, nz = 0
  if (n) {
    const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2])
    if (ax >= ay && ax >= az && ax > 0.45) nx = n[0] > 0 ? 1 : -1
    else if (ay >= az && ay > 0.45) ny = n[1] > 0 ? 1 : -1
    else if (az > 0.45) nz = n[2] > 0 ? 1 : -1
  }
  const stepped = (nx || ny || nz) ? { x: sx + nx, y: sy + ny, z: sz + nz } : null
  const adj = aimed.adjacent ? { x: Math.round(aimed.adjacent[0]), y: Math.round(aimed.adjacent[1]), z: Math.round(aimed.adjacent[2]) } : null
  const open = (c) => {
    if (!c) return false
    const v = getVoxel(c.x, c.y, c.z)
    return !v || v === WATER || v === ID.tuft || v === ID.wheat
  }
  let spot = null
  if (open(stepped)) spot = stepped
  else if (open(adj)) spot = adj
  else spot = stepped || adj
  if (location.search.includes('smoke=1')) {
    if (!window.__lands) window.__lands = []
    window.__lands.push({
      face: aimed.position.slice(),
      n: n ? [n[0], n[1], n[2]] : null,
      cell: spot ? [spot.x, spot.y, spot.z] : null,
    })
    console.info('land face ' + aimed.position.join(',') + ' n ' + (n ? n.join(',') : '') + ' cell ' + (spot ? spot.x + ',' + spot.y + ',' + spot.z : ''))
  }
  return spot
}
function viewFar() {
  try {
    const dist = reachFor(survivalOn()) + 6
    const hit = noa.pick(null, null, dist, (id) => id !== 0)
    if (!hit || !hit.position || !hit.normal) return null
    const nx = Math.round(hit.normal[0]) || 0
    const ny = Math.round(hit.normal[1]) || 0
    const nz = Math.round(hit.normal[2]) || 0
    const ax = Math.floor(hit.position[0])
    const ay = Math.floor(hit.position[1])
    const az = Math.floor(hit.position[2])
    const x = ax - nx
    const y = ay - ny
    const z = az - nz
    const id = getVoxel(x, y, z)
    if (!id) return null
    return { id, blockID: id, position: [x, y, z], adjacent: [ax, ay, az] }
  } catch (e) { return null }
}
function placeMiss() {
  if (tableMode || anyCard() || !placeableHeld()) return
  const aimed = noa.targetedBlock
  if (aimed && aimed.position && canReach(aimed.position)) return
  toastFarKey()
}
function breakMiss() {
  if (tableMode || anyCard() || !placeableHeld()) return
  const aimed = noa.targetedBlock
  if (aimed && aimed.position && canReach(aimed.position)) return
  const far = viewFar()
  if (!far || canReach(far.position)) return
  toastFar()
}
function reachOpen(pos, repeat) {
  if (tableMode || canReach(pos)) return true
  if (!repeat) toastFar()
  return false
}
function isShopBlock(id) { return id === ID.woodshop || id === ID.woodshopSide }
function shopDelta(face) { return face === 'E' || face === 'W' ? [0, 0, 1] : [1, 0, 0] }

function stampDecor(item, design) {
  if (!session || !session.meta || !item || !design) return
  const rec = session.meta.get('decor-held') || { kind: 'decor-held', list: [] }
  rec.list = Array.isArray(rec.list) ? rec.list : []
  rec.list.push({ item, design })
  session.meta.set('decor-held', rec)
  const slot = session.bag && session.bag.slots && session.bag.slots.find((s) => s && s.item === item && !s.design)
  if (slot) slot.design = JSON.parse(JSON.stringify(design))
}
function peekDecor(item) {
  if (!session || !item) return null
  const slot = session.bag && session.bag.slots && session.bag.slots.find((s) => s && s.item === item && s.design)
  if (slot) return slot.design
  const rec = session.meta.get('decor-held')
  const row = rec && Array.isArray(rec.list) && rec.list.find((r) => r && r.item === item && r.design)
  return row ? row.design : null
}
function dropDecor(item) {
  if (!session || !session.meta || !item) return
  const rec = session.meta.get('decor-held')
  if (!rec || !Array.isArray(rec.list)) return
  const i = rec.list.findIndex((r) => r && r.item === item)
  if (i >= 0) rec.list.splice(i, 1)
  session.meta.set('decor-held', rec)
}
function rehydrateDecor() {
  if (!session || !session.meta || !session.bag) return
  const rec = session.meta.get('decor-held')
  if (!rec || !Array.isArray(rec.list)) return
  const left = rec.list.slice()
  for (const s of session.bag.slots) {
    if (!s || s.design) continue
    const i = left.findIndex((r) => r && r.item === s.item && r.design)
    if (i < 0) continue
    s.design = left[i].design
    left.splice(i, 1)
  }
}
function isWallLamp(id) { return id === 1102 || id === 1103 }
function isFloorLamp(id) { return id === 1100 || id === 1101 }
function isRug(id) { return id === 1104 || id === 1105 }
function rugSpan(x, y, z) {
  return [
    [x, y, z], [x + 1, y, z], [x, y, z + 1], [x + 1, y, z + 1]
  ]
}
function placeWallLamp(face) {
  if (!face || !face.position) return false
  const normal = face.normal || [0, 0, 1]
  if (Math.abs(normal[1]) > 0.5) {
    toast(t('placeOnWall'))
    showShopAmber(face.position[0], face.position[1], face.position[2], face.position[0], face.position[1], face.position[2])
    return false
  }
  const x = Math.floor(face.position[0] + (normal[0] || 0))
  const y = Math.floor(face.position[1] + (normal[1] || 0))
  const z = Math.floor(face.position[2] + (normal[2] || 0))
  if (getVoxel(x, y, z)) { toast(t('noRoom')); return false }
  const key = x + ',' + y + ',' + z
  const side = normal[0] > 0 ? 'E' : normal[0] < 0 ? 'W' : normal[2] > 0 ? 'S' : 'N'
  const design = peekDecor('wallLamp')
  if (session && session.meta) session.meta.set(key, { kind: 'wallLamp', side, design })
  if (session && !session.onPlace(x, y, z, 1102)) {
    if (session.meta) session.meta.delete(key)
    return false
  }
  if (!edit(x, y, z, 1102)) {
    if (session && session.meta) session.meta.delete(key)
    return false
  }
  dropDecor('wallLamp')
  if (typeof syncGlow === 'function') syncGlow._dirty = true
  return true
}
function placeRug(x, y, z) {
  const cells = rugSpan(x, y, z)
  for (const [cx, cy, cz] of cells) {
    if (getVoxel(cx, cy, cz)) {
      showShopAmber(x, y, z, cx, cy, cz)
      tellNoRoom(cx + ',' + cy + ',' + cz)
      return false
    }
  }
  if (session && !session.onPlace(x, y, z, 1104)) return false
  for (const [cx, cy, cz] of cells) {
    if (!edit(cx, cy, cz, cx === x && cz === z ? 1104 : 1105)) {
      for (const [rx, ry, rz] of cells) edit(rx, ry, rz, 0)
      return false
    }
  }
  const anchor = x + ',' + y + ',' + z
  if (session && session.meta) {
    const design = peekDecor('rug')
    for (const [cx, cy, cz] of cells) {
      session.meta.set(cx + ',' + cy + ',' + cz, { kind: 'rug', anchor, design })
    }
    dropDecor('rug')
  }
  if (typeof syncGlow === 'function') syncGlow._dirty = true
  return true
}
function shopSpan(x, y, z, face) {
  const f = face || faceTowardPlayer(x, z)
  const d = shopDelta(f)
  return { face: f, x, y, z, sx: x + d[0], sy: y, sz: z + d[2] }
}
function shopBlocked(span) {
  if (getVoxel(span.sx, span.sy, span.sz)) return true
  if (!teacherOn() && !townHelper() && protectedCell(span.sx, span.sy, span.sz, protect)) return true
  if (!tableMode) {
    const p = noa.entities.getPosition(noa.playerEntity)
    if (overlapsPlayer(span.sx, span.sy, span.sz, p[0], p[1], p[2])) return true
  }
  return false
}
let roomTold = ''
let roomToldAt = 0
let roomQuietUntil = 0
function tellNoRoom(key) {
  const now = performance.now()
  if (now < roomQuietUntil) return
  if (roomTold === key && now - roomToldAt < 1200) return
  roomTold = key
  roomToldAt = now
  toast(t('noRoom'))
  const el = $('toast')
  if (el) el.classList.add('fx-pop')
}
function showShopAmber(x, y, z, sx, sy, sz) {
  if (!placeGhost || !amberMat) return
  placeGhost.material = amberMat
  const lp = noa.globalToLocal([x + 0.5, y + 0.5, z + 0.5], null, ghostLocal)
  placeGhost.position.set(lp[0], lp[1], lp[2])
  placeGhost.setEnabled(true)
  if (placeGhostSide) {
    placeGhostSide.material = amberMat
    const lp2 = noa.globalToLocal([sx + 0.5, sy + 0.5, sz + 0.5], null, ghostLocal2)
    placeGhostSide.position.set(lp2[0], lp2[1], lp2[2])
    placeGhostSide.setEnabled(true)
  }
  if (outline && amberLine) outline.color.copyFrom(amberLine)
}
function shopAnchorKey(x, y, z) {
  const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
  if (rec && rec.kind === 'woodshop' && rec.anchor) return rec.anchor
  if (getVoxel(x, y, z) === ID.woodshop) return x + ',' + y + ',' + z
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let i = 0; i < dirs.length; i++) {
    const nx = x + dirs[i][0]
    const nz = z + dirs[i][1]
    if (getVoxel(nx, y, nz) === ID.woodshop) return nx + ',' + y + ',' + nz
  }
  return x + ',' + y + ',' + z
}
function shopPair(x, y, z) {
  const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
  if (rec && rec.kind === 'woodshop' && rec.anchor && rec.pair) {
    const a = rec.anchor.split(',').map(Number)
    const b = rec.pair.split(',').map(Number)
    return { ax: a[0], ay: a[1], az: a[2], sx: b[0], sy: b[1], sz: b[2], face: rec.face || 'S' }
  }
  if (getVoxel(x, y, z) === ID.woodshopSide) {
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    for (let i = 0; i < dirs.length; i++) {
      const nx = x + dirs[i][0]
      const nz = z + dirs[i][1]
      if (getVoxel(nx, y, nz) === ID.woodshop) return shopPair(nx, y, nz)
    }
  }
  const face = (rec && rec.face) || 'S'
  const span = shopSpan(x, y, z, face)
  return { ax: x, ay: y, az: z, sx: span.sx, sy: span.sy, sz: span.sz, face }
}
function placeShop(x, y, z) {
  if (!tableMode && !canReach([x, y, z])) { toastFarKey(); return false }
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!tableMode && overlapsPlayer(x, y, z, p[0], p[1], p[2])) { toast(t('standing')); return false }
  const span = shopSpan(x, y, z)
  const sideFar = !tableMode && !canReach([span.sx, span.sy, span.sz])
  if (getVoxel(x, y, z) || shopBlocked(span) || sideFar) {
    showShopAmber(x, y, z, span.sx, span.sy, span.sz)
    tellNoRoom(span.sx + ',' + span.sy + ',' + span.sz)
    return false
  }
  if (session && !session.onPlace(x, y, z, ID.woodshop)) return false
  if (!edit(x, y, z, ID.woodshop)) {
    if (session && session.mode === 'survival') session.give('woodshop', 1)
    return false
  }
  if (!edit(span.sx, span.sy, span.sz, ID.woodshopSide)) {
    edit(x, y, z, 0)
    if (session && session.mode === 'survival') session.give('woodshop', 1)
    showShopAmber(x, y, z, span.sx, span.sy, span.sz)
    tellNoRoom(span.sx + ',' + span.sy + ',' + span.sz)
    return false
  }
  const anchor = x + ',' + y + ',' + z
  const pair = span.sx + ',' + span.sy + ',' + span.sz
  if (session && session.meta) {
    const row = (role) => ({ kind: 'woodshop', face: span.face, role, anchor, pair })
    session.meta.set(anchor, row('anchor'))
    session.meta.set(pair, row('side'))
  }
  if (stations && stations.ensureShop) stations.ensureShop(anchor)
  if (basics) { basics.saw(x, y, z, ID.woodshop); basics.saw(span.sx, span.sy, span.sz, ID.woodshopSide) }
  ensureFront(x, y, z)
  ensureFront(span.sx, span.sy, span.sz)
  noteMachine()
  roomTold = ''
  roomQuietUntil = performance.now() + 400
  return true
}
function liftShop(x, y, z) {
  if (!tableMode && !canReach([x, y, z])) return false
  const pair = shopPair(x, y, z)
  const anchor = pair.ax + ',' + pair.ay + ',' + pair.az
  const sideKey = pair.sx + ',' + pair.sy + ',' + pair.sz
  const tools = stations && stations.wallItems ? stations.wallItems(anchor).slice() : []
  if (session && session.park) {
    for (let i = 0; i < tools.length; i++) session.park(tools[i], 1)
    session.park('woodshop', 1)
  } else if (session) {
    for (let i = 0; i < tools.length; i++) session.give(tools[i], 1)
    session.give('woodshop', 1)
  }
  if (session && session.meta) {
    session.meta.delete(anchor)
    session.meta.delete(sideKey)
  }
  if (stations && stations.clearShop) stations.clearShop(anchor)
  const clear = (cx, cy, cz) => {
    const id = getVoxel(cx, cy, cz)
    if (id === ID.woodshop || id === ID.woodshopSide) edit(cx, cy, cz, 0)
  }
  clear(pair.ax, pair.ay, pair.az)
  if (pair.sx !== pair.ax || pair.sz !== pair.az) clear(pair.sx, pair.sy, pair.sz)
  ensureFront(pair.ax, pair.ay, pair.az)
  ensureFront(pair.sx, pair.sy, pair.sz)
  noteMachine()
  toast(t('gotItem').replace('{item}', t('woodshop')))
  return true
}
function strictOn() {
  try {
    if (location.search.includes('strict=1')) return true
    if (localStorage.getItem('bloxbert-strict') === '1') return true
  } catch (e) {}
  return false
}
function safetyDue() {
  let seenSession = false
  try { seenSession = sessionStorage.getItem('bt-shop-safe') === '1' } catch (e) {}
  if (strictOn()) return !seenSession
  return !gifts.shopSafe
}
function markSafety() {
  gifts.shopSafe = true
  try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
  noteMachine()
}
let glassesMesh = null
function wearGlasses(on) {
  gifts.glassesOn = !!on
  if (document.body) document.body.dataset.glasses = on ? '1' : ''
  if (glassesMesh) glassesMesh.setEnabled(!!on)
  if (on) noteMachine()
}
function syncGlasses() {
  const on = !!gifts.glassesOn
  if (document.body) document.body.dataset.glasses = on ? '1' : ''
  if (glassesMesh) glassesMesh.setEnabled(on)
}
let hands = null
function pokeHand(kind) { if (hands) hands.swing(kind) }
function breakAt(x, y, z, hold) {
  const id = getVoxel(x, y, z)
  if (!id) return false
  if (!Rules.allow(null, 'core.break', { x, y, z, id }).ok) {
    blockedToast('core.break')
    return false
  }
  if (id === WATER || (isMissingId(id) && survivalOn())) return false
  if ((isCropId(id) || isBushId(id)) && survivalOn() && !tableMode) {
    if (!canReach([x, y, z])) return false
    if (fruitingAt(x, y, z, id)) {
      leftHarvest(x, y, z, id)
      return true
    }
    if (!hold) {
      showGrowCard(x, y, z)
      return true
    }
  }
  if (basics && basics.blocksBreak(id)) return false
  if (id === ID.vend || id === ID.bunk) return false
  if (!tableMode && !canReach([x, y, z])) return false
  if (id === 1100 || id === 1101 || id === 1102 || id === 1103 || id === 1104 || id === 1105) {
    const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
    const item = (id === 1100 || id === 1101) ? 'floorLamp' : (id === 1102 || id === 1103) ? 'wallLamp' : 'rug'
    const cells = (id === 1104 || id === 1105) ? rugSpan(x, y, z) : [[x, y, z]]
    if (session && session.give) session.give(item, 1)
    if (rec && rec.design) stampDecor(item, rec.design)
    for (const [cx, cy, cz] of cells) {
      if (session && session.meta) session.meta.delete(cx + ',' + cy + ',' + cz)
      edit(cx, cy, cz, 0)
    }
    dirty = true
    if (typeof noteMachine === 'function') noteMachine()
    if (typeof syncGlow === 'function') syncGlow._dirty = true
    pokeHand('break')
    return true
  }
  if (isShopBlock(id)) return liftShop(x, y, z)
  if (id === ID.box) {
    if (session && session.pickup) session.pickup(x, y, z, id)
    if (getVoxel(x, y, z) === ID.box) edit(x, y, z, 0)
    pokeHand('break')
    return true
  }
  const wild = isBushId(id) && !farm.get(x, y, z)
  const wheatBack = id === WILD_WHEAT && session && session.mode === 'survival' && wildWheatCell(x, y, z)
  if (session && !session.onBreak(x, y, z, id)) return false
  const gone = edit(x, y, z, 0)
  if (gone && wild) forage.remove(x, y, z)
  if (gone && wheatBack) {
    forage.add(x, y, z, 'wheat', Date.now())
    showCard(t('wheatBack'))
    dirty = true
  }
  if (gone && isUseBlock(id)) {
    const key = dropOf(id)
    toast(t('gotItem').replace('{item}', key ? t(key) : blockName(id)))
  }
  if (gone) pokeHand('break')
  return gone
}
function wildWheatCell(x, y, z) {
  if (inTown(x, z)) return false
  return plantHere(x, y, z, heightAt(x, z), false) === 'wheat'
}
function breakBlock() {
  const tget = tableMode ? tableTarget() : noa.targetedBlock
  if (!tget) return false
  const [x, y, z] = tget.position
  return breakAt(x, y, z)
}
function isUseBlock(id) {
  if (isDoor(id) || id === LEVER.off || id === LEVER.on || id === BUTTON.off || id === BUTTON.on || id === LANTERN) return true
  if (id === 1100 || id === 1101 || id === 1102 || id === 1103) return true
  return id === ID.door || id === ID.doorOpen || id === ID.storeCounter || id === ID.oven || id === ID.workbench || id === ID.vend || id === ID.bunk || id === ID.box || isShopBlock(id)
}
function isGear(id) {
  return isDoor(id) || id === LEVER.off || id === LEVER.on || id === BUTTON.off || id === BUTTON.on || id === LANTERN
}
function useHoldReady(dig, now) {
  if (!dig || !isUseBlock(dig.id)) return true
  if (isDoor(dig.id)) return false
  return now - (dig.t0 || now) >= 500
}
function useAt(hit) {
  if (!useHit(hit)) return false
  pokeHand('use')
  return true
}
function useHit(hit) {
  if (!hit || !hit.position) return false
  const id = hit.blockID != null ? hit.blockID : hit.id
  const ax = hit.position[0]
  const ay = hit.position[1]
  const az = hit.position[2]
  if (isDoor(id) && freshPlacedDoor()) {
    forceShut(ax, ay, az)
    toast(t('doorShut'))
    return true
  }
  if (basics && canReach([ax, ay, az]) && basics.use(ax, ay, az)) {
    const nowId = getVoxel(ax, ay, az)
    if (isDoor(id) && doorKind(id) !== 'metal') toast(t(isOpenDoor(nowId) ? 'doorOpenMsg' : 'doorShut'))
    if (id === LANTERN) showLamp(ax, ay, az)
    return true
  }
  if (id === 1100 || id === 1101 || id === 1102 || id === 1103) {
    const next = id === 1100 ? 1101 : id === 1101 ? 1100 : id === 1102 ? 1103 : 1102
    edit(ax, ay, az, next)
    if (basics) basics.saw(ax, ay, az, next)
    if (typeof syncGlow === 'function') syncGlow._dirty = true
    return true
  }
  if (id === LANTERN) return true
  const kind = machineKind(id)
  if (location.search.includes('smoke=1') && kind) console.info('use face ' + ax + ',' + ay + ',' + az + ' id ' + id)
  if (!kind) return !!isUseBlock(id)
  if (mutedUse({ position: [ax, ay, az] })) return true
  if (heldPlaceKey() && !crouching()) noteCrouchHint()
  const shopOk = kind !== 'shop' || (session && session.mode === 'survival')
  if (!shopOk || !panels) return true
  const key = ax + ',' + ay + ',' + az
  if (kind === 'box') { if (!canReach([ax, ay, az])) return true }
  else if (!reachOpen([ax, ay, az], false)) return true
  if (!Rules.allow(null, 'core.station.open', { kind }).ok) {
    blockedToast('core.station.open')
    return true
  }
  if (kind === 'oven') panels.open('station', key)
  else if (kind === 'bench') panels.open('crafting')
  else if (kind === 'vend') panels.open('counter', key)
  else if (kind === 'bunk') panels.open('bunk', key)
  else if (kind === 'box') panels.open('box', key)
  else if (kind === 'woodshop') panels.open('woodshop', shopAnchorKey(ax, ay, az))
  else panels.open('shop')
  openMachineKey = key
  return true
}
function placeableCell(id) {
  return !id || id === WATER || id === ID.tuft || id === ID.wheat
}
function placeBlock(face, opts) {
  if (inspectOn) { showInspect(); return false }
  const repeat = !!(opts && opts.repeat)
  const sayFar = () => { if (repeat || !placeableHeld()) return; toastFarKey() }
  const aimedBlock = face && face.position ? face : noa.targetedBlock
  if (!repeat && aimedBlock && panels) {
    const aimId = aimedBlock.blockID != null ? aimedBlock.blockID : aimedBlock.id
    const beside = machineKind(aimId) && againstMachine(aimedBlock)
    if ((isUseBlock(aimId) || machineKind(aimId)) && !beside) {
      useAt(aimedBlock)
      return false
    }
  }
  if (tryBush(aimedBlock)) return false
  if (tryCrop(aimedBlock)) return false
  if (tryPlant(aimedBlock, repeat)) return false
  if (trySprout(aimedBlock, repeat)) return false
  if (tryTill(aimedBlock, repeat)) return false
  if (!Rules.allow(null, 'core.place').ok) {
    blockedToast('core.place')
    return false
  }
  let x, y, z
  if (tableMode && !aimedBlock) { x = tableCursor[0]; y = tableCursor[1]; z = tableCursor[2] }
  else {
    if (!aimedBlock) {
      if (!repeat) placeMiss()
      return false
    }
    const spot = landingCell(aimedBlock)
    if (!spot) {
      if (!repeat) placeMiss()
      return false
    }
    x = spot.x
    y = spot.y
    z = spot.z
    if (!tableMode) {
      if (!canReach([x, y, z])) { sayFar(); return false }
      const p = noa.entities.getPosition(noa.playerEntity)
      if (overlapsPlayer(x, y, z, p[0], p[1], p[2])) { if (!repeat) toast(t('standing')); return false }
    }
  }
  let id = session && session.mode === 'survival' ? (session.blockForHot() || 0) : current
  const heldKey = session && session.selectedItem ? session.selectedItem() || '' : ''
  if (heldKey === 'floorLamp') id = 1100
  else if (heldKey === 'wallLamp') id = 1102
  else if (heldKey === 'rug') id = 1104
  if (isDoor(id)) id = placedDoorId(id)
  else if (id === LEVER.on) id = LEVER.off
  else if (id === BUTTON.on) id = BUTTON.off
  if (session && session.mode === 'survival' && !id) {
    const held = session.selectedItem && session.selectedItem()
    toast(held ? t('notABlock') : t('emptySlot'))
    return false
  }
  if (id === 1100) {
    if (session && !session.onPlace(x, y, z, 1100)) return false
    if (!edit(x, y, z, 1100)) return false
    if (session && session.meta) {
      const design = peekDecor('floorLamp') || { height: 'Standard', shade: 'Natural' }
      session.meta.set(x + ',' + y + ',' + z, { kind: 'floorLamp', design })
      dropDecor('floorLamp')
    }
    if (typeof syncGlow === 'function') syncGlow._dirty = true
    if (basics) basics.saw(x, y, z, 1100)
    pokeHand('place')
    return true
  }
  if (id === 1102) { const ok = placeWallLamp(face); if (ok) pokeHand('place'); return ok }
  if (id === 1104) { const ok = placeRug(x, y, z); if (ok) pokeHand('place'); return ok }
  if (id === ID.woodshop) { const ok = placeShop(x, y, z); if (ok) pokeHand('place'); return ok }
  if (!placeableCell(getVoxel(x, y, z))) return false
  if (session && !session.onPlace(x, y, z, id)) return false
  const placed = edit(x, y, z, id)
  if (placed && basics) {
    basics.saw(x, y, z, id)
    if (isDoor(id)) {
      doorPlacedAt = performance.now()
      toast(t('doorShut'))
      if (!getVoxel(x, y + 1, z)) {
        if (edit(x, y + 1, z, id)) basics.saw(x, y + 1, z, id)
      }
    }
  }
  if (placed) rememberFace(x, y, z, id)
  if (placed) pokeHand('place')
  return placed
}
const tillCount = new Map()
function tryTill(aimed, repeat) {
  if (!packOn('farm')) return false
  if (!aimed || !session || session.mode !== 'survival') return false
  if (!aimed.position || !aimed.adjacent) return false
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  const ax = Math.round(aimed.adjacent[0])
  const ay = Math.round(aimed.adjacent[1])
  const az = Math.round(aimed.adjacent[2])
  if (ax !== x || az !== z || ay !== y + 1) return false
  const id = getVoxel(x, y, z)
  if (id !== ID.grass && id !== ID.dirt) return false
  const held = (session.selectedItem && session.selectedItem()) || ''
  if (held && held !== 'hoe') return false
  if (repeat) return true
  if (!tableMode && !canReach([x, y, z])) return false
  if (zoneLocked(x, y, z)) return true
  const key = x + ',' + y + ',' + z
  const hoe = held === 'hoe'
  if (!hoe) {
    const n = (tillCount.get(key) || 0) + 1
    tillCount.set(key, n)
    showCard(t('digSoil'))
    showCrack((n / 3) * 0.9)
    if (n < 3) return true
    tillCount.delete(key)
  } else tillCount.delete(key)
  hideCrack()
  const wet = nearWater(getVoxel, x, y, z)
  if (!edit(x, y, z, wet ? WET : DRY)) return true
  if (learn.addNote('farmNote')) showCard(t('farmNote'))
  return true
}
const STAGE_KEY = ['stageSprout', 'stageLeafy', 'stageTall', 'stageRipe']
function cropText(row) {
  if (row && row.kind === 'bush') return bushText(row)
  const p = preview(row, Date.now())
  let text = p.left <= 0
    ? t('wheat') + ' - ' + t('stageRipe')
    : t('wheat') + ' - ' + t(STAGE_KEY[p.stage]) + ' - ' + t('ripeIn').replace('{time}', formatLeft(p.left))
  if (!p.wet) text += ' ' + t('drySoil')
  return text
}
function bushText(row) {
  const p = preview(row, Date.now())
  const time = formatLeft(p.left)
  let text = p.left <= 0
    ? t('berryBush') + ' - ' + t('stageRipe')
    : t('berryBush') + ' - ' + t(STAGE_KEY[p.stage]) + ' - ' + (row.regrow
      ? t('regrowsIn').replace('{t}', time)
      : t('ripeIn').replace('{time}', time))
  if (!p.wet) text += ' ' + t('drySoil')
  return text
}
function showCropCard(x, y, z) {
  const row = farm.get(x, y, z)
  if (!row) return
  showCard(cropText(row))
}
let sweep = null
function armSweep() {
  if (!sweep) sweep = { seen: new Set(), n: 0 }
  return sweep
}
function fruitingAt(x, y, z, id) {
  const row = farm.get(x, y, z)
  if (isCropId(id)) return id === CROP[3] || isRipe(row, Date.now())
  if (isBushId(id)) return id === BUSH[3] || isRipe(row, Date.now())
  return false
}
let growToldAt = 0
function showGrowCard(x, y, z) {
  const row = farm.get(x, y, z)
  const id = getVoxel(x, y, z)
  const base = isBushId(id) && !row ? wildBushText(x, y, z) : (row ? cropText(row) : (isBushId(id) ? t('berryBush') : t('wheat')))
  growToldAt = performance.now()
  showCard(base + '\n' + t('notRipeHold'))
}
function leftHarvest(x, y, z, id) {
  const stroke = armSweep()
  const cell = x + ',' + y + ',' + z
  if (stroke.seen.has(cell) || stroke.n >= 5) return false
  if (isBushId(id) && !farm.get(x, y, z)) {
    if (id === FRUIT_BUSH) {
      const n = wildPickCount(x, y, z)
      session.give('berry', n)
      popBerry(x, y, z, n)
      setVoxel(x, y, z, BARE_BUSH)
      forage.add(x, y, z, 'bush', Date.now())
      showCard(wildBushText(x, y, z))
      dirty = true
    }
  } else if (isCropId(id)) harvestCrop(x, y, z)
  else {
    let row = farm.get(x, y, z)
    if (!row) {
      row = farm.add(x, y, z, Date.now(), false, { kind: 'bush' })
      row.grown = capOf(row)
    }
    pickBush(x, y, z, row)
  }
  stroke.seen.add(cell)
  stroke.n += 1
  hideCrack()
  return true
}
function cropDig(kind, x, y, z, id, now) {
  if (!survivalOn() || tableMode) return null
  if (!isCropId(id) && !isBushId(id)) return null
  if (!canReach([x, y, z])) return null
  const cell = x + ',' + y + ',' + z
  if (sweep && sweep.seen.has(cell)) {
    return { kind, x, y, z, id, name: '', t0: now, need: 1e9, broke: true, skipBreak: true, p: 0 }
  }
  if (fruitingAt(x, y, z, id)) {
    leftHarvest(x, y, z, id)
    return { kind, x, y, z, id, name: '', t0: now, need: 1e9, broke: true, skipBreak: true, p: 0 }
  }
  showGrowCard(x, y, z)
  return null
}
let harvestStroke = null
function cropScreen(x, y, z) {
  try {
    const lp = noa.globalToLocal([x + 0.5, y + 1.15, z + 0.5], null, [0, 0, 0])
    const sc = noa.rendering.getScene()
    const eng = sc.getEngine()
    const cam = sc.activeCamera
    const vw = eng.getRenderWidth()
    const vh = eng.getRenderHeight()
    const viewport = cam.viewport.toGlobal(vw, vh)
    const p = Vector3.Project(new Vector3(lp[0], lp[1], lp[2]), Matrix.Identity(), sc.getTransformMatrix(), viewport)
    const canvas = document.querySelector('#stage canvas')
    const r = canvas.getBoundingClientRect()
    if (p.z < 0 || p.z > 1) return null
    return { x: r.left + (p.x / vw) * r.width, y: r.top + (p.y / vh) * r.height }
  } catch (e) { return null }
}
function popHarvest(x, y, z, got) {
  const at = cropScreen(x, y, z) || { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }
  const node = document.createElement('div')
  node.dataset.harvestPop = '1'
  node.style.cssText = 'position:fixed;z-index:70;left:0;top:0;pointer-events:none;display:flex;align-items:center;gap:6px;font:700 18px/1.2 sans-serif;color:#fffdf6;text-shadow:0 1px 2px #142033;white-space:nowrap'
  const icon = (svg) => {
    const s = document.createElement('span')
    s.style.cssText = 'width:28px;height:28px;display:inline-flex'
    s.innerHTML = svg
    const el = s.querySelector('svg')
    if (el) { el.setAttribute('width', '28'); el.setAttribute('height', '28') }
    return s
  }
  const wheatSvg = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 V9" stroke="#c9922a" stroke-width="2" fill="none" stroke-linecap="round"/><ellipse cx="12" cy="7" rx="2.4" ry="3.2" fill="#f6c453"/><ellipse cx="8.2" cy="11" rx="2" ry="2.8" fill="#e6b422"/><ellipse cx="15.8" cy="11" rx="2" ry="2.8" fill="#e6b422"/></svg>'
  const counts = '+' + got.wheat + ' ' + t('wheat') + ' +' + got.seeds + ' ' + t('wheatSeeds')
  const label = document.createElement('span')
  label.dataset.harvestCounts = counts
  label.textContent = counts
  node.append(icon(wheatSvg), icon(itemSvg('wheatSeeds')), label)
  node.style.left = at.x + 'px'
  node.style.top = at.y + 'px'
  document.body.append(node)
  node.animate([
    { transform: 'translate(-50%, -8px)', opacity: 1 },
    { transform: 'translate(-50%, -76px)', opacity: 0 },
  ], { duration: 600, easing: 'ease-out', fill: 'forwards' })
  setTimeout(() => node.remove(), 650)
}
function popBerry(x, y, z, n) {
  const at = cropScreen(x, y, z) || { x: window.innerWidth / 2, y: window.innerHeight * 0.45 }
  const node = document.createElement('div')
  node.dataset.harvestPop = '1'
  node.style.cssText = 'position:fixed;z-index:70;left:0;top:0;pointer-events:none;display:flex;align-items:center;gap:6px;font:700 18px/1.2 sans-serif;color:#fffdf6;text-shadow:0 1px 2px #142033;white-space:nowrap'
  const icon = (svg) => {
    const s = document.createElement('span')
    s.style.cssText = 'width:28px;height:28px;display:inline-flex'
    s.innerHTML = svg
    const el = s.querySelector('svg')
    if (el) { el.setAttribute('width', '28'); el.setAttribute('height', '28') }
    return s
  }
  const counts = '+' + n + ' ' + t('berry')
  const label = document.createElement('span')
  label.dataset.harvestCounts = counts
  label.textContent = counts
  node.append(icon(itemSvg('berry')), label)
  node.style.left = at.x + 'px'
  node.style.top = at.y + 'px'
  document.body.append(node)
  node.animate([
    { transform: 'translate(-50%, -8px)', opacity: 1 },
    { transform: 'translate(-50%, -76px)', opacity: 0 },
  ], { duration: 600, easing: 'ease-out', fill: 'forwards' })
  setTimeout(() => node.remove(), 650)
}
function pickBush(x, y, z, row) {
  const n = berryPickCount(x, y, z)
  session.give('berry', n)
  popBerry(x, y, z, n)
  const now = Date.now()
  row.regrow = true
  row.grown = 0
  row.lastSeen = now
  paintCrop(row)
  showCropCard(x, y, z)
}
function wildBushText(x, y, z) {
  const row = forage.get(x, y, z)
  if (row && row.kind === 'bush') {
    const p = forage.preview(row, Date.now())
    return t('wildBush') + ' - ' + t('bareBranches') + ' - ' + t('berriesIn').replace('{t}', formatLeft(p.left))
  }
  if (getVoxel(x, y, z) === FRUIT_BUSH) return t('wildBush')
  return t('wildBush') + ' - ' + t('bareBranches')
}
function tryWildBush(x, y, z) {
  if (!session || session.mode !== 'survival') {
    showCard(wildBushText(x, y, z))
    return true
  }
  if (getVoxel(x, y, z) !== FRUIT_BUSH) {
    showCard(wildBushText(x, y, z))
    return true
  }
  const press = rightPress
  if (press) {
    if (!harvestStroke || harvestStroke.press !== press) harvestStroke = { press, seen: new Set(), n: 0 }
  } else harvestStroke = { press: null, seen: new Set(), n: 0 }
  const cell = x + ',' + y + ',' + z
  if (harvestStroke.seen.has(cell) || harvestStroke.n >= 5) return true
  const n = wildPickCount(x, y, z)
  session.give('berry', n)
  popBerry(x, y, z, n)
  const now = Date.now()
  setVoxel(x, y, z, BARE_BUSH)
  forage.add(x, y, z, 'bush', now)
  showCard(wildBushText(x, y, z))
  harvestStroke.seen.add(cell)
  harvestStroke.n += 1
  dirty = true
  return true
}
function tryBush(aimed) {
  if (!aimed || !aimed.position) return false
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  if (!isBushId(getVoxel(x, y, z))) return false
  if (!tableMode && !canReach([x, y, z])) {
    showCropCard(x, y, z)
    return true
  }
  const row = farm.get(x, y, z)
  if (!row) return tryWildBush(x, y, z)
  const ripe = getVoxel(x, y, z) === BUSH[3] || preview(row, Date.now()).stage === 3
  if (!ripe || !session || session.mode !== 'survival') {
    showCropCard(x, y, z)
    return true
  }
  const press = rightPress
  if (press) {
    if (!harvestStroke || harvestStroke.press !== press) harvestStroke = { press, seen: new Set(), n: 0 }
  } else harvestStroke = { press: null, seen: new Set(), n: 0 }
  const cell = x + ',' + y + ',' + z
  if (harvestStroke.seen.has(cell) || harvestStroke.n >= 5) return true
  pickBush(x, y, z, row)
  harvestStroke.seen.add(cell)
  harvestStroke.n += 1
  return true
}
function harvestCrop(x, y, z) {
  const got = harvestCounts(x, y, z)
  const wheat0 = session.bag.count('wheat')
  const seed0 = session.bag.count('wheatSeeds')
  session.give('wheat', got.wheat)
  session.give('wheatSeeds', got.seeds)
  popHarvest(x, y, z, got)
  const overflow = session.bag.count('wheat') - wheat0 < got.wheat || session.bag.count('wheatSeeds') - seed0 < got.seeds
  let replanted = false
  if (replantSeed(session.bag.count('wheatSeeds')) && session.spend('wheatSeeds', 1)) {
    const now = Date.now()
    const soil = getVoxel(x, y - 1, z)
    const wet = soil === WET || nearWater(getVoxel, x, y - 1, z)
    let row = farm.get(x, y, z)
    if (!row) row = farm.add(x, y, z, now, wet)
    row.grown = 0
    row.plantedAt = now
    row.lastSeen = now
    row.wet = !!wet
    setVoxel(x, y, z, CROP[0])
    replanted = true
  } else setVoxel(x, y, z, 0)
  if (!overflow) toast(t(replanted ? 'replanted' : 'harvestedBare'))
  if (replanted && learn && learn.addNote('farmReplant')) showCard(t('farmReplant'))
  if (learn && learn.addNote('farmHarvest')) showCard(t('farmHarvest'))
}
function tryCrop(aimed) {
  if (!aimed || !aimed.position) return false
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  if (!isCropId(getVoxel(x, y, z))) return false
  if (!tableMode && !canReach([x, y, z])) {
    showCropCard(x, y, z)
    return true
  }
  const row = farm.get(x, y, z)
  const ripe = getVoxel(x, y, z) === CROP[3] || !!(row && preview(row, Date.now()).stage === 3)
  if (!ripe || !session || session.mode !== 'survival') {
    showCropCard(x, y, z)
    return true
  }
  const press = rightPress
  if (press) {
    if (!harvestStroke || harvestStroke.press !== press) harvestStroke = { press, seen: new Set(), n: 0 }
  } else harvestStroke = { press: null, seen: new Set(), n: 0 }
  const cell = x + ',' + y + ',' + z
  if (harvestStroke.seen.has(cell) || harvestStroke.n >= 5) return true
  harvestCrop(x, y, z)
  harvestStroke.seen.add(cell)
  harvestStroke.n += 1
  return true
}
let plantStroke = null
function tryPlant(aimed, repeat) {
  if (!packOn('farm')) return false
  if (!aimed || !session || session.mode !== 'survival') return false
  if (!aimed.position || !aimed.adjacent) return false
  const held = (session.selectedItem && session.selectedItem()) || ''
  if (held !== 'wheatSeeds') return false
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  const ax = Math.round(aimed.adjacent[0])
  const ay = Math.round(aimed.adjacent[1])
  const az = Math.round(aimed.adjacent[2])
  if (ax !== x || az !== z || ay !== y + 1) return false
  const soil = getVoxel(x, y, z)
  if (soil !== DRY && soil !== WET) return false
  if (!tableMode && !canReach([x, y, z])) return false
  const above = getVoxel(ax, ay, az)
  if (above) return true
  const press = rightPress
  if (press) {
    if (!plantStroke || plantStroke.press !== press) plantStroke = { press, seen: new Set(), n: 0 }
  } else plantStroke = { press: null, seen: new Set(), n: 0 }
  const cell = ax + ',' + ay + ',' + az
  if (plantStroke.seen.has(cell) || plantStroke.n >= 5) return true
  if (!session.spend('wheatSeeds', 1)) return true
  const now = Date.now()
  const wet = soil === WET || nearWater(getVoxel, x, y, z)
  farm.add(ax, ay, az, now, wet)
  setVoxel(ax, ay, az, CROP[0])
  plantStroke.seen.add(cell)
  plantStroke.n += 1
  if (learn.addNote('farmSeed')) showCard(t('farmSeed'))
  if (wet && learn.addNote('farmWet')) showCard(t('farmWet'))
  return true
}
let sproutStroke = null
function sproutWhy(soil) {
  if (soil === DRY || soil === WET) return t('bushNotFarm')
  if (soil === WATER) return t('bushNotWater')
  if (soil === ID.stone || soil === ID.slate) return t('bushNotStone')
  if (soil !== ID.grass && soil !== ID.dirt) return t('plantOnGrass')
  return ''
}
function trySprout(aimed, repeat) {
  if (!packOn('farm')) return false
  if (!aimed || !session || session.mode !== 'survival') return false
  if (!aimed.position || !aimed.adjacent) return false
  const held = (session.selectedItem && session.selectedItem()) || ''
  if (held !== 'bushSprout') return false
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  const ax = Math.round(aimed.adjacent[0])
  const ay = Math.round(aimed.adjacent[1])
  const az = Math.round(aimed.adjacent[2])
  if (!tableMode && !canReach([x, y, z])) return false
  const press = rightPress
  if (press) {
    if (!sproutStroke || sproutStroke.press !== press) sproutStroke = { press, seen: new Set(), n: 0, said: false }
  } else sproutStroke = { press: null, seen: new Set(), n: 0, said: false }
  const say = (text) => {
    if (!sproutStroke.said) { showCard(text); sproutStroke.said = true }
    return true
  }
  const soil = getVoxel(x, y, z)
  const why = sproutWhy(soil)
  if (why) return say(why)
  const top = ax === x && az === z && ay === y + 1
  if (!top) return say(t('plantOnGrass'))
  if (sproutStroke.n >= 1 || repeat && sproutStroke.n >= 1) return true
  if (getVoxel(ax, ay, az)) return true
  if (!session.spend('bushSprout', 1)) return true
  const now = Date.now()
  const wet = nearWater(getVoxel, x, y, z)
  farm.add(ax, ay, az, now, wet, { kind: 'bush' })
  setVoxel(ax, ay, az, BUSH[0])
  sproutStroke.n += 1
  return true
}
function paintCrop(row) {
  if (!packOn('farm')) return
  const ids = row.kind === 'bush' ? BUSH : CROP
  const st = stage(row.grown, row)
  const id = ids[st]
  if (getVoxel(row.x, row.y, row.z) !== id) setVoxel(row.x, row.y, row.z, id)
  if (st === 3 && row.kind !== 'bush' && learn && learn.addNote('farmRipe')) showCard(t('farmRipe'))
}
function growAll(now) {
  let moved = false
  for (const r of farm.rows()) {
    const before = r.grown
    const prev = stage(before, r)
    advance(r, now)
    if (r.grown !== before) moved = true
    if (stage(r.grown, r) !== prev) paintCrop(r)
  }
  if (moved) dirty = true
}
function syncCrops(now) {
  if (!packOn('farm')) return
  for (const r of farm.rows()) advance(r, now)
  for (const r of farm.rows()) {
    const soilId = getVoxel(r.x, r.y - 1, r.z)
    if (r.kind === 'bush') r.wet = nearWater(getVoxel, r.x, r.y - 1, r.z)
    else {
      let wet = false
      if (soilId === DRY || soilId === WET) wet = nearWater(getVoxel, r.x, r.y - 1, r.z)
      r.wet = wet
      if (soilId === DRY && wet) setVoxel(r.x, r.y - 1, r.z, WET)
      if (soilId === WET && !wet) setVoxel(r.x, r.y - 1, r.z, DRY)
    }
    paintCrop(r)
  }
}
let cropTickAt = 0
let cropFreeze = false
let cropHoverAt = 0
function syncForage(now) {
  if (!packOn('farm')) return
  const list = [...forage.rows()]
  let moved = false
  for (const r of list) {
    const before = r.grown
    forage.advance(r, now)
    if (r.grown !== before) moved = true
    const p = forage.preview(r, now)
    if (r.kind === 'wheat') {
      const open = getVoxel(r.x, r.y, r.z) === 0 && getVoxel(r.x, r.y - 1, r.z) === ID.grass
      if (!open) { forage.remove(r.x, r.y, r.z); moved = true; continue }
      if (p.ready) { setVoxel(r.x, r.y, r.z, WILD_WHEAT); forage.remove(r.x, r.y, r.z); moved = true }
      continue
    }
    const id = getVoxel(r.x, r.y, r.z)
    const bare = isBushId(id) && id !== FRUIT_BUSH && !farm.get(r.x, r.y, r.z)
    if (!bare) { forage.remove(r.x, r.y, r.z); moved = true; continue }
    if (p.ready) { setVoxel(r.x, r.y, r.z, FRUIT_BUSH); forage.remove(r.x, r.y, r.z); moved = true }
  }
  if (moved) dirty = true
}
let forageTickAt = 0
function tickForage() {
  const wall = Date.now()
  if (!forageTickAt) { forageTickAt = wall; return }
  if (wall - forageTickAt < 1000) return
  forageTickAt = wall
  syncForage(wall)
}
function tickCrops() {
  if (cropFreeze) return
  const wall = Date.now()
  if (!cropTickAt) { cropTickAt = wall; return }
  if (wall - cropTickAt < 1000) return
  cropTickAt = wall
  growAll(wall)
}
function hoverCrop() {
  if (cropFreeze || tableMode || anyCard()) return
  if (performance.now() - growToldAt < 1600) return
  const aimed = noa.targetedBlock
  if (!aimed || !aimed.position) return
  const x = Math.round(aimed.position[0])
  const y = Math.round(aimed.position[1])
  const z = Math.round(aimed.position[2])
  if (isBushId(aimed.blockID) && !farm.get(x, y, z)) {
    const wall = Date.now()
    if (wall - cropHoverAt < 500) return
    cropHoverAt = wall
    showCard(wildBushText(x, y, z))
    return
  }
  const wheatWait = forage.get(x, y + 1, z)
  if (aimed.blockID === ID.grass && wheatWait && wheatWait.kind === 'wheat') {
    const wall = Date.now()
    if (wall - cropHoverAt < 500) return
    cropHoverAt = wall
    showCard(t('wheatBack'))
    return
  }
  if (cropFreeze) return
  if (!(isCropId(aimed.blockID) || isBushId(aimed.blockID))) return
  const row = farm.get(x, y, z)
  if (!row) return
  const p = preview(row, Date.now())
  if (p.left <= 0 && row.kind !== 'bush') return
  const wall = Date.now()
  if (wall - cropHoverAt < 500) return
  cropHoverAt = wall
  showCard(cropText(row))
}
function tableTarget() {
  return { position: tableCursor.slice(), adjacent: [tableCursor[0], tableCursor[1] + 1, tableCursor[2]] }
}
noa.inputs.down.on('fire', () => {
  if (inspectOn) { showInspect(); return }
  if (anyCard() || tableMode || !noa.container.hasPointerLock) return
  const aimed = noa.targetedBlock
  if (aimed && (isDoor(aimed.blockID) || isShopBlock(aimed.blockID))) { beginDig('mouse'); return }
  if (survivalOn()) beginDig('mouse')
  else {
    breakBlock()
    dig = { kind: 'mouse', creative: true, t0: performance.now(), id: aimed ? aimed.blockID : 0, x: aimed ? aimed.position[0] : 0, y: aimed ? aimed.position[1] : 0, z: aimed ? aimed.position[2] : 0 }
  }
})
let ateClickAt = 0
function tryEatClick(aimed) {
  if (!survivalOn() || !session || !session.isFood || !session.selectedItem) return false
  const item = session.selectedItem()
  if (!session.isFood(item)) return false
  const id = aimed ? (aimed.blockID != null ? aimed.blockID : aimed.id) : 0
  if (id && (isUseBlock(id) || isCropId(id) || isBushId(id))) return false
  const now = performance.now()
  if (now - ateClickAt < 140) return true
  ateClickAt = now
  useSelected()
  return true
}
noa.inputs.down.on('alt-fire', () => {
  if (inspectOn) { showInspect(); return }
  if (anyCard() || tableMode || rightPress || !noa.container.hasPointerLock) return
  const tget = noa.targetedBlock
  if (tryEatClick(tget)) return
  if (tget && isUseBlock(tget.blockID)) return
  placeBlock()
  if (!TOUCH_UI) { mouseRight = true; placeHoldAt = performance.now() }
})
noa.inputs.down.on('mid-fire', () => pickAimed())

const DB = __BLOX_STUDENT__ ? 'kuliblocks' : 'kuliblocks-test'
const STORE = 'worlds'
function staffOn() {
  try { return !!(window.HubStaffAuth && window.HubStaffAuth.isUnlocked()) } catch (e) { return false }
}
function townHelper() {
  if (!staffOn()) return false
  try { return localStorage.getItem('bloxbert-town') === '1' } catch (e) { return false }
}
function setTownHelper(on) {
  try { localStorage.setItem('bloxbert-town', on ? '1' : '0') } catch (e) {}
  toast(on ? t('townYes') : t('townNo'))
}
function ensureHelp() {
  const y = FLOOR + 1
  for (const s of STATIONS) {
    const ci = Math.floor(s.x / S)
    const cj = Math.floor(y / S)
    const ck = Math.floor(s.z / S)
    if (saved.has(ci + ',' + cj + ',' + ck)) continue
    if (getVoxel(s.x, y, s.z) === ID[s.id]) continue
    setVoxel(s.x, y, s.z, ID[s.id], true)
  }
}
function teacherOn() {
  if (!staffOn()) return false
  try { return localStorage.getItem('bloxbert-teacher') === '1' } catch (e) { return false }
}
const MODE_SWITCH_ALL = true
function setTeacher(on) {
  try { localStorage.setItem('bloxbert-teacher', on ? '1' : '0') } catch (e) {}
  toast(on ? t('teacherOn') : t('teacherOff'))
  if (MODE_SWITCH_ALL) { paintModeChip(); return }
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
  if (idb.db) return Promise.resolve(idb.db)
  if (!idb.p) idb.p = new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(STORE)) r.result.createObjectStore(STORE) }
    r.onsuccess = () => {
      idb.db = r.result
      idb.db.onversionchange = () => { try { idb.db.close() } catch (e) {} idb.db = null; idb.p = null }
      res(idb.db)
    }
    r.onerror = () => { idb.p = null; rej(r.error) }
  })
  return idb.p
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
let pondAid = false
function waterWithin(r) {
  const sx = 8.5
  const sz = 1.5
  const x0 = Math.floor(sx - r)
  const x1 = Math.ceil(sx + r)
  const z0 = Math.floor(sz - r)
  const z1 = Math.ceil(sz + r)
  const rr = r * r
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const dx = x + 0.5 - sx
      const dz = z + 0.5 - sz
      if (dx * dx + dz * dz > rr) continue
      const y = surfaceY(x, z)
      if (getVoxel(x, y, z) === WATER || getVoxel(x, y - 1, z) === WATER) return true
    }
  }
  return false
}
function chunkSavedAt(x, y, z) {
  const ci = Math.floor(x / S)
  const cj = Math.floor(y / S)
  const ck = Math.floor(z / S)
  return saved.has(ci + ',' + cj + ',' + ck)
}
function seedOldBushes() {
  if (gifts.forage110) return 0
  let n = 0
  for (let x = 8 - 64; x <= 8 + 64; x++) {
    for (let z = 2 - 64; z <= 2 + 64; z++) {
      if (!wildBushCell(x, z)) continue
      const h = surfaceY(x, z)
      const y = h + 1
      if (!chunkSavedAt(x, y, z)) continue
      if (keptCell(x, y, z)) continue
      if (getVoxel(x, y, z) !== 0) continue
      if (getVoxel(x, h, z) !== ID.grass) continue
      setVoxel(x, y, z, FRUIT_BUSH)
      n++
    }
  }
  gifts.forage110 = true
  dirty = true
  return n
}
function rescueClear(x, y, z) {
  if (keptCell(x, y, z)) return false
  const cur = getVoxel(x, y, z)
  if (isCropId(cur) || isBushId(cur)) return false
  const gen = genVoxel(x, y, z)
  if (cur === gen) return true
  if (gen === WATER && (cur === ID.grass || cur === ID.dirt || cur === 0)) return true
  return false
}
function canRescue(spot) {
  for (let dx = 0; dx < spot.w; dx++) {
    for (let dz = 0; dz < spot.w; dz++) {
      const x = spot.x + dx
      const z = spot.z + dz
      const y = surfaceY(x, z)
      if (!rescueClear(x, y, z)) return false
      const up = getVoxel(x, y + 1, z)
      if (isCropId(up) || isBushId(up) || keptCell(x, y + 1, z)) return false
      if (up && up !== genVoxel(x, y + 1, z)) return false
    }
  }
  return true
}
function placeRescue(spot) {
  for (let dx = 0; dx < spot.w; dx++) {
    for (let dz = 0; dz < spot.w; dz++) {
      const x = spot.x + dx
      const z = spot.z + dz
      setVoxel(x, surfaceY(x, z), z, WATER)
    }
  }
}
function ensureStarterPond(doc) {
  if (doc && doc.pondAid) { pondAid = true; return null }
  if (waterWithin(40)) { pondAid = true; return null }
  const spots = rescueSpots(1)
  for (let i = 0; i < spots.length; i++) {
    if (!canRescue(spots[i])) continue
    placeRescue(spots[i])
    pondAid = true
    dirty = true
    return spots[i]
  }
  return null
}
function bakeBox(x0, x1, y0, y1, z0, z1) {
  for (let y = y0; y <= y1; y += S) {
    for (let x = x0; x <= x1; x += S) {
      for (let z = z0; z <= z1; z += S) {
        const ci = Math.floor(x / S), cj = Math.floor(y / S), ck = Math.floor(z / S)
        const k = key(ci, cj, ck)
        if (saved.has(k)) continue
        const data = new Uint16Array(S * S * S)
        fillGenerated(data, ci * S, cj * S, ck * S)
        saved.set(k, data)
      }
    }
  }
}
function dryNear(r) {
  const sx = 8.5
  const sz = 1.5
  const x0 = Math.floor(sx - r)
  const x1 = Math.ceil(sx + r)
  const z0 = Math.floor(sz - r)
  const z1 = Math.ceil(sz + r)
  bakeBox(x0, x1, -2, 16, z0, z1)
  let n = 0
  const rr = r * r
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const dx = x + 0.5 - sx
      const dz = z + 0.5 - sz
      if (dx * dx + dz * dz > rr) continue
      for (let y = -2; y <= 16; y++) {
        if (getVoxel(x, y, z) !== WATER) continue
        setVoxel(x, y, z, y >= surfaceY(x, z) ? ID.grass : ID.dirt)
        n++
      }
    }
  }
  pondAid = false
  return n
}
function isMachineId(id) {
  if (!id) return false
  if (isDoor(id)) return true
  return id === ID.box || id === ID.oven || id === ID.workbench || id === ID.vend || id === ID.bunk || isShopBlock(id)
}
function trackMachine(x, y, z, id) {
  machineCells.set(x + ',' + y + ',' + z, id | 0)
  noteMachine()
}
function pinKey() { return 'bloxbert-machines:' + WORLD }
function clearPin() { try { localStorage.removeItem(pinKey()) } catch (e) {} }
function pinMachines() {
  try {
    const blocks = []
    for (const [k, id] of machineCells) {
      const [x, y, z] = k.split(',').map(Number)
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) blocks.push([x, y, z, id | 0])
    }
    const meta = {}
    if (session && session.meta) for (const [k, v] of session.meta) meta[k] = JSON.parse(JSON.stringify(v))
    let stationDump = {}
    try { stationDump = stations && stations.dump ? stations.dump() : {} } catch (e) { stationDump = {} }
    let basicDump = null
    try {
      if (basics && basics.dump) {
        const d = basics.dump()
        basicDump = { locks: d.locks, autos: d.autos }
      }
    } catch (e) { basicDump = null }
    const pin = {
      at: Date.now(),
      world: WORLD,
      blocks,
      meta,
      stations: stationDump,
      basics: basicDump,
      tray: session && session.trayDump ? session.trayDump() : null,
    }
    localStorage.setItem(pinKey(), JSON.stringify(pin))
  } catch (e) {}
}
function noteMachine() {
  dirty = true
  pinGen += 1
  pinMachines()
  clearTimeout(machineTimer)
  machineTimer = setTimeout(() => { if (dirty && allowSave) save().catch(() => {}) }, 500)
}
function mergePin(doc) {
  let pin = null
  try { pin = JSON.parse(localStorage.getItem(pinKey()) || 'null') } catch (e) { pin = null }
  if (!pin || pin.world !== WORLD || !(pin.at > 0)) return false
  const docAt = doc && doc.updatedAt ? Date.parse(doc.updatedAt) : 0
  if (!(pin.at > (docAt || 0))) return false
  voxelQuiet = true
  try {
    if (Array.isArray(pin.blocks)) {
      for (const cell of pin.blocks) {
        if (!cell || cell.length < 4) continue
        const x = cell[0] | 0, y = cell[1] | 0, z = cell[2] | 0, id = cell[3] | 0
        if (getVoxel(x, y, z) !== id) setVoxel(x, y, z, id, true)
      }
    }
  } finally { voxelQuiet = false }
  if (session && pin.meta && typeof pin.meta === 'object') {
    session.meta.clear()
    for (const [k, v] of Object.entries(pin.meta)) session.meta.set(k, v)
  }
  if (pin.stations && stations && stations.load) stations.load(pin.stations)
  if (pin.basics && basics && basics.patch) basics.patch(pin.basics)
  if (pin.tray && session && session.restoreTray) session.restoreTray(pin.tray)
  dirty = true
  return true
}
let openedFrom = ''
async function snapshot() {
  const chunks = {}
  for (const [k, v] of saved) chunks[k] = await gz(v)
  const p = noa.entities.getPosition(noa.playerEntity)
  const rules = Rules.dump()
  const effects = Effects.dump()
  return {
    format: 'kuliblocks', v: 2, schema: SCHEMA, packs: packVersions(), appVersion: 'bloxbert-' + VERSION, id: WORLD, title: 'Bertyville',
    ownerRef: null, seed: 1, spawn: worldSpawn.slice(), spawnSet: !!spawnSet, pos: [p[0], p[1], p[2]], protect: { size: protect.size, center: protect.center ? protect.center.slice() : null }, chunkSize: S,
    genVersion, genSeen: compactSeen(),
    palette: blockPalette(),
    chunks, updatedAt: new Date().toISOString(),
    ...(session ? session.dump() : { player: { mode: 'creative', bag: [], hot: 0, home: null, table: false }, econ: null, meta: {} }),
    stations: stations.dump(),
    basics: basics ? basics.dump() : null,
    gifts,
    crops: farm.dump(),
    forage: forage.dump(),
    pondAid: !!pondAid,
    maker: makerSnap(),
    ...(openedFrom ? { openedFrom } : {}),
    ...(Object.keys(rules).length ? { rules } : {}),
    ...(Object.keys(effects).length ? { effects } : {}),
  }
}
async function saveBody() {
  if (!allowSave || readOnlySave) {
    const err = new Error(readOnlySave ? 'newer' : 'held')
    err.code = readOnlySave ? 'newer' : 'held'
    throw err
  }
  const gen = pinGen
  const doc = await snapshot()
  const db = await idb()
  await new Promise((res, rej) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(doc, WORLD)
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error || new Error('save'))
    tx.onabort = () => rej(tx.error || new Error('save'))
  })
  if (gen === pinGen) {
    dirty = false
    machineCells.clear()
    clearPin()
  }
  let bytes = 0
  try { bytes = JSON.stringify(doc).length } catch (e) { bytes = 0 }
  markSave(t('saved') + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · ' + (bytes / 1024).toFixed(1) + ' KB')
  return bytes
}
let saveChain = Promise.resolve()
function save() {
  const job = saveChain.then(() => saveBody())
  saveChain = job.catch(() => {})
  return job
}
async function saveClicked() {
  try {
    await save()
    toast(t('saved'))
  } catch (e) {
    if (e && e.code === 'newer') toast('Made in a newer Bertopia')
    else toast(t(e && e.code === 'held' ? 'saveKept' : 'saveFull'))
  }
}
function keepSaved(err) {
  allowSave = false
  toast(t('saveKept'))
  markSave(t('saveKept'))
  return err
}
async function load() {
  let doc = null
  try {
    const db = await idb()
    doc = await new Promise((res, rej) => {
      const r = db.transaction(STORE).objectStore(STORE).get(WORLD)
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error || new Error('read'))
    })
  } catch (e) {
    keepSaved(e)
    return false
  }
  if (!doc) {
    Rules.load({})
    Effects.load({})
    farm.clear()
    forage.clear()
    pondAid = true
    ensureHelp()
    grantSaplings()
    seedOldBushes()
    allowSave = true
    if (mergePin(null)) noteMachine()
    return false
  }
  if (doc.format !== 'kuliblocks') {
    keepSaved(doc)
    return false
  }
  try {
    await applyDoc(doc)
  } catch (e) {
    keepSaved(e)
    return false
  }
  const pinned = mergePin(doc)
  allowSave = !readOnlySave
  if (readOnlySave) {
    dirty = false
    toast('Made in a newer Bertopia')
    markSave('Made in a newer Bertopia')
  } else {
    markSave(t('loaded'))
    if (pinned) noteMachine()
  }
  return true
}
async function readDoc(doc) {
  if (!doc || doc.format !== 'kuliblocks' || (doc.v !== 1 && doc.v !== 2)) throw new Error(t('versionSkew'))
  const moved = migrate(doc)
  readOnlySave = !!moved.readOnly
  const src = moved.doc || doc
  genVersion = src.genVersion == null ? GEN : (src.genVersion | 0)
  genSeen = src.genSeen && typeof src.genSeen === 'object' ? { ...src.genSeen } : {}
  if (src.chunkSize !== S || !src.chunks || typeof src.chunks !== 'object') throw new Error('That world uses a different chunk size.')
  const out = new Map()
  const nameToId = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
  pendingGifts = []
  resetUnknown()
  for (const k of Object.keys(src.chunks)) {
    if (!/^-?\d+,-?\d+,-?\d+$/.test(k)) throw new Error('That world file is damaged.')
    const a = await ungz(src.chunks[k])
    if (a.length !== S * S * S) throw new Error('That world file is damaged.')
    const migrated = migrateVoxels(src.palette, a, nameToId)
    pendingGifts.push(...migrated.gifts)
    out.set(k, migrated.data)
  }
  for (const [id] of unknownEntries()) ensureMissingBlock(id)
  return out
}
async function applyDoc(doc) {
  openedFrom = doc && typeof doc.openedFrom === 'string' ? doc.openedFrom : ''
  applyMaker(doc && doc.maker)
  const moved = migrate(doc)
  const src = moved.doc || doc
  Rules.load(doc && doc.rules || {})
  Effects.load(doc && doc.effects || {})
  const chunks = await readDoc(doc)
  saved.clear(); for (const [k, v] of chunks) saved.set(k, v)
  edits.clear(); paintUndo()
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  const spot = finiteTriple(src.pos) || finiteTriple(src.spawn)
  if (spot) noa.entities.setPosition(noa.playerEntity, spot)
  worldSpawn = finiteTriple(src.spawn) || SPAWN.slice()
  spawnSet = !!src.spawnSet
  protect = normProtect(src.protect)
  if (session) {
    shopsLive = false
    session.load(fromDoc(src))
    rehydrateDecor()
    shopsLive = true
  }
  if (src.basics && basics) basics.load(src.basics)
  dropGifts()
  if (src.stations) stations.load(src.stations)
  if (session && session.recoverOrphans) session.recoverOrphans('')
  gifts = Object.assign({}, src && src.gifts)
  syncGlasses()
  grantSaplings()
  farm.load(src && src.crops)
  syncCrops(Date.now())
  forage.load(src && src.forage)
  syncForage(Date.now())
  pondAid = false
  ensureStarterPond(src)
  seedOldBushes()
  if (session) paintModeChip()
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
  try { await save() } catch (e) {}
  try { await keepClassic() } catch (e) {}
  if (makerNext) { makerLive = makerNext; makerNext = null }
  else makerLive = defaultMaker()
  Rules.load({})
  Effects.load({})
  gifts = {}
  syncGlasses()
  farm.clear()
  forage.clear()
  pondAid = true
  genVersion = GEN
  genSeen = {}
  saved.clear(); dirty = true; edits.clear(); paintUndo()
  changeLog.clearWorld().catch(() => {})
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  if (session && session.freshStart) session.freshStart()
  else if (session && session.clearLoose) session.clearLoose()
  grantSaplings()
  syncDropMeshes()
  noa.entities.setPosition(noa.playerEntity, SPAWN.slice())
  worldSpawn = SPAWN.slice()
  spawnSet = false
  protect = { size: 'medium', center: null }
  setLook(0, 0.18)
  seedOldBushes()
  openedFrom = ''
  bakeSpawnChunk()
  markSave(t('fresh'))
  try { await save() } catch (e) {}
  try { await paintOldWorlds() } catch (e) {}
  window.__freshGen = (window.__freshGen || 0) + 1
}
function classicStamp(d) {
  const x = d || new Date()
  const p = (n) => String(n).padStart(2, '0')
  const uniq = Math.random().toString(36).slice(2, 6)
  return String(x.getFullYear()) + p(x.getMonth() + 1) + p(x.getDate()) + '-' + p(x.getHours()) + p(x.getMinutes()) + p(x.getSeconds()) + '-' + uniq
}
function classicLabel(day) {
  const s = String(day || '')
  let m = s.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})/)
  if (m) return m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5] + ':' + m[6]
  m = s.match(/^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})/)
  if (m) return m[1] + '-' + m[2] + '-' + m[3] + ' ' + m[4] + ':' + m[5]
  if (/^\d{8}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6)
  return s
}
function classicPrefix() { return WORLD + '-classic-' }
function idbReq(req) {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result)
    req.onerror = () => rej(req.error || new Error('idb'))
  })
}
async function idbGet(k) {
  const db = await idb()
  return idbReq(db.transaction(STORE).objectStore(STORE).get(k))
}
async function idbPut(k, doc) {
  const db = await idb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).put(doc, k)
  await new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error || new Error('idb')); tx.onabort = () => rej(tx.error || new Error('idb')) })
}
async function idbDel(k) {
  const db = await idb()
  const tx = db.transaction(STORE, 'readwrite')
  tx.objectStore(STORE).delete(k)
  await new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error || new Error('idb')); tx.onabort = () => rej(tx.error || new Error('idb')) })
}
async function classicKeys() {
  const db = await idb()
  const keys = await idbReq(db.transaction(STORE).objectStore(STORE).getAllKeys())
  const pre = classicPrefix()
  return (keys || []).filter((k) => typeof k === 'string' && k.indexOf(pre) === 0).sort((a, b) => b.slice(pre.length).localeCompare(a.slice(pre.length)))
}
function countBlocks() {
  let n = 0
  for (const data of saved.values()) {
    if (!data) continue
    for (let i = 0; i < data.length; i++) if (data[i]) n++
  }
  return n
}
function countBag() {
  const slots = session && session.bag && session.bag.slots
  if (!slots) return 0
  let n = 0
  for (const s of slots) if (s && s.n) n++
  return n
}
function classicText(day, doc) {
  const bits = [t('openDated').replace('{date}', classicLabel(day))]
  if (doc && doc.archiveWhy === 'fresh') bits.push(t('archiveFresh'))
  else if (doc && doc.archiveWhy === 'swap') bits.push(t('archiveSwap'))
  if (doc && doc.archiveBlocks != null) bits.push(t('archiveBlocks').replace('{n}', String(doc.archiveBlocks | 0)))
  if (doc && doc.archiveBag != null) bits.push(t('archiveBag').replace('{n}', String(doc.archiveBag | 0)))
  return bits.join(' · ')
}
async function trimClassic(keys, protect) {
  const list = keys || await classicKeys()
  const keep = new Set()
  const pins = Array.isArray(protect) ? protect : (protect ? [protect] : [])
  for (const k of pins) if (k && list.indexOf(k) >= 0) keep.add(k)
  for (const k of list) {
    if (keep.size >= 6) break
    keep.add(k)
  }
  const dropped = []
  for (const k of list) if (!keep.has(k)) { await idbDel(k); dropped.push(k) }
  return dropped
}
async function putClassic(doc, avoid) {
  if (!doc) return ''
  let body
  try { body = JSON.parse(JSON.stringify(doc)) } catch (e) { body = doc }
  const base = classicStamp()
  let n = 0
  let key = classicPrefix() + base
  while (n < 30) {
    if (key !== avoid && !(await idbGet(key))) break
    n += 1
    key = classicPrefix() + base + '-' + n
  }
  if (key === avoid) key = classicPrefix() + base + '-' + Date.now().toString(36)
  await idbPut(key, body)
  return key
}
async function archiveLeaving(avoid, why) {
  try { await save() } catch (e) {}
  const doc = await idbGet(WORLD)
  if (!doc) return []
  let body
  try { body = JSON.parse(JSON.stringify(doc)) } catch (e) { body = doc }
  const from = typeof body.openedFrom === 'string' ? body.openedFrom : ''
  const pre = classicPrefix()
  body.archiveBlocks = countBlocks()
  body.archiveBag = countBag()
  if (from && from === avoid) return []
  const touched = body.archiveBlocks > 0 || makerLive.preset === 'flat' || makerLive.preset === 'void'
  if (!touched) return []
  const pins = []
  if (from.indexOf(pre) === 0 && from !== avoid) {
    const prev = await idbGet(from)
    body.archiveWhy = prev && (prev.archiveWhy === 'fresh' || prev.archiveWhy === 'swap') ? prev.archiveWhy : why
    await idbPut(from, body)
    pins.push(from)
  } else {
    body.archiveWhy = why
    delete body.openedFrom
    const key = await putClassic(body, avoid)
    if (key) pins.push(key)
  }
  if (avoid) pins.push(avoid)
  return trimClassic(null, pins)
}
const dropQueue = []
let dropPump = 0
function toastDrops(keys) {
  if (!keys || !keys.length) return
  for (let i = 0; i < keys.length; i++) dropQueue.push(1)
  if (dropPump) return
  const step = () => {
    dropPump = 0
    if (!dropQueue.length) return
    dropQueue.shift()
    toast(t('oldestWorld'))
    if (dropQueue.length) dropPump = setTimeout(step, 2500)
  }
  step()
}
async function noteFreshDrop() {
  const keys = await classicKeys()
  if (!keys || keys.length < 6) { freshDropDate = ''; return }
  const pre = classicPrefix()
  freshDropDate = classicLabel(String(keys[keys.length - 1]).slice(pre.length))
}
async function keepClassic() {
  const dropped = await archiveLeaving('', 'fresh')
  toastDrops(dropped)
  try { await noteFreshDrop() } catch (e) {}
}
async function openClassic(keyName) {
  const raw = await idbGet(keyName)
  if (!raw) return
  let doc
  try { doc = JSON.parse(JSON.stringify(raw)) } catch (e) { doc = raw }
  const dropped = await archiveLeaving(keyName, 'swap')
  doc.openedFrom = keyName
  await applyDoc(doc)
  try { await save() } catch (e) {}
  await paintOldWorlds()
  const sheet = document.getElementById('sheet')
  if (sheet && !sheet.hidden && sheet.dataset.panel === 'oldworlds') {
    const g = sheet.querySelector('.ggrid')
    if (g) await paintOldList(g)
  }
  toast(t('archiveOpen'))
  toastDrops(dropped)
  try { await noteFreshDrop() } catch (e) {}
  window.__archiveGen = (window.__archiveGen || 0) + 1
}
async function paintOldWorlds() {
  try { await noteFreshDrop() } catch (e) {}
  const btn = document.getElementById('m-old')
  const list = document.getElementById('m-old-list')
  if (!btn || !list) return
  if (!btn.dataset.bound) {
    btn.dataset.bound = '1'
    btn.addEventListener('click', async () => {
      const keys = await classicKeys()
      list.innerHTML = ''
      if (!keys.length) { list.hidden = true; btn.hidden = true; return }
      const pre = classicPrefix()
      for (const k of keys) {
        const day = String(k).slice(pre.length)
        const row = document.createElement('button')
        row.type = 'button'
        row.className = 'row'
        row.style.minHeight = '44px'
        row.textContent = classicText(day, await idbGet(k))
        row.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openClassic(k) })
        list.append(row)
      }
      list.hidden = false
    })
  }
  const keys = await classicKeys()
  btn.hidden = !keys.length
  if (!keys.length) { list.hidden = true; list.innerHTML = '' }
  const slot = document.querySelector('#sheet [data-old-slot]')
  if (slot) paintOldEntry(slot, () => { if (panels) panels.open('oldworlds') })
}
function menuTile(icon, label, fn) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'gtile'
  const ico = document.createElement('span')
  ico.className = 'gic'
  ico.textContent = icon
  const lab = document.createElement('span')
  lab.className = 'glbl'
  lab.textContent = label
  b.append(ico, lab)
  b.addEventListener('click', fn)
  return b
}
async function paintOldEntry(host, openList) {
  if (!host) return
  const keys = await classicKeys()
  host.innerHTML = ''
  if (!host.isConnected) return
  if (teacherOn()) {
    const on = makerEnabled()
    host.append(menuTile(on ? '☑' : '☐', t(on ? 'makerOn' : 'makerOff'), () => {
      try { localStorage.setItem('bloxbert-maker', on ? '0' : '1') } catch (e) {}
      paintOldEntry(host, openList)
    }))
  }
  if (makerEnabled()) host.append(menuTile('✦', t('newWorld'), () => openMaker()))
  if (keys.length) host.append(menuTile('↩', t('openOld'), () => { if (openList) openList() }))
}
async function paintOldList(g) {
  g.innerHTML = ''
  const keys = await classicKeys()
  const pre = classicPrefix()
  if (!keys.length) return
  for (const k of keys) {
    const day = String(k).slice(pre.length)
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile wide'
    b.dataset.archive = k
    b.style.minHeight = '44px'
    b.style.gridColumn = '1 / -1'
    const lab = document.createElement('span')
    lab.className = 'glbl'
    lab.textContent = classicText(day, await idbGet(k))
    b.append(lab)
    b.addEventListener('click', () => { openClassic(k) })
    g.append(b)
  }
}
function makerSnap() {
  return {
    preset: makerLive.preset || 'normal',
    hills: clampStep(makerLive.hills),
    water: clampStep(makerLive.water),
    trees: clampStep(makerLive.trees),
    seed: makerLive.seed | 0,
    adj: makerLive.adj | 0,
    noun: makerLive.noun | 0,
    genVersion,
  }
}
function applyMaker(raw) {
  if (!raw || typeof raw !== 'object') { makerLive = defaultMaker(); return }
  const preset = raw.preset === 'flat' || raw.preset === 'void' ? raw.preset : 'normal'
  makerLive = {
    preset,
    hills: clampStep(raw.hills == null ? 2 : raw.hills),
    water: clampStep(raw.water == null ? 2 : raw.water),
    trees: clampStep(raw.trees == null ? 2 : raw.trees),
    seed: raw.seed | 0,
    adj: raw.adj | 0,
    noun: raw.noun | 0,
  }
}
function bakeSpawnChunk() {
  if (makerLive.preset !== 'flat' && makerLive.preset !== 'void') return
  const x0 = Math.floor(worldSpawn[0] / S) * S
  const y0 = Math.floor(worldSpawn[1] / S) * S
  const z0 = Math.floor(worldSpawn[2] / S) * S
  const k = key(x0 / S, y0 / S, z0 / S)
  if (saved.has(k)) return
  const data = new Uint16Array(S * S * S)
  fillGenerated(data, x0, y0, z0)
  saved.set(k, data)
}
function openMaker() {
  const sheet = document.getElementById('sheet')
  const grid = sheet && sheet.querySelector('.ggrid')
  if (!grid) return
  makerDraft = {
    preset: makerLive.preset === 'flat' || makerLive.preset === 'void' ? makerLive.preset : 'normal',
    hills: clampStep(makerLive.hills),
    water: clampStep(makerLive.water),
    trees: clampStep(makerLive.trees),
    seed: makerLive.seed | 0,
    adj: makerLive.adj | 0,
    noun: makerLive.noun | 0,
  }
  if (!makerDraft.seed) makerDraft.seed = normSeed((Math.random() * 32000) | 0)
  const title = document.getElementById('sheet-title')
  if (title) title.textContent = t('newWorld')
  paintMaker(grid)
}
function makerSpin(text, fn) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'gtile'
  b.style.minWidth = '44px'
  b.style.minHeight = '44px'
  b.textContent = text
  b.addEventListener('click', fn)
  return b
}
function paintMaker(g) {
  g.innerHTML = ''
  g.dataset.maker = '1'
  const presets = document.createElement('div')
  presets.className = 'wide'
  presets.style.display = 'flex'
  presets.style.gap = '8px'
  const choices = [['normal', '🌿', 'makerNormal'], ['flat', '▬', 'makerFlat'], ['void', '○', 'makerVoid']]
  for (const [id, icon, lab] of choices) {
    const tile = menuTile(icon, t(lab), () => { makerDraft.preset = id; paintMaker(g) })
    tile.dataset.preset = id
    tile.style.minHeight = '44px'
    if (makerDraft.preset === id) tile.style.outline = '3px solid #f6c453'
    presets.append(tile)
  }
  g.append(presets)
  for (const key of ['hills', 'water', 'trees']) {
    const row = document.createElement('div')
    row.className = 'wide'
    row.style.cssText = 'display:flex;align-items:center;gap:8px;min-height:44px'
    const name = document.createElement('span')
    name.className = 'glbl'
    name.style.flex = '0 0 72px'
    name.textContent = t(key === 'hills' ? 'makerHills' : key === 'water' ? 'makerWater' : 'makerTrees')
    const dec = makerSpin('<', () => { makerDraft[key] = clampStep((makerDraft[key] | 0) - 1); paintMaker(g) })
    dec.dataset.slider = key
    dec.dataset.step = '-1'
    const track = document.createElement('span')
    track.style.cssText = 'position:relative;flex:1;height:44px;background:#1f2b44;border-radius:8px;min-width:88px'
    const knob = document.createElement('span')
    knob.dataset.sliderHandle = key
    knob.style.cssText = 'position:absolute;top:0;width:44px;height:44px;background:#e6b422;border-radius:8px'
    knob.style.left = 'calc(' + ((makerDraft[key] | 0) / 4) + ' * (100% - 44px))'
    track.append(knob)
    const val = document.createElement('span')
    val.dataset.sliderValue = key
    val.style.minWidth = '24px'
    val.style.textAlign = 'center'
    val.textContent = String((makerDraft[key] | 0) + 1)
    const inc = makerSpin('>', () => { makerDraft[key] = clampStep((makerDraft[key] | 0) + 1); paintMaker(g) })
    inc.dataset.slider = key
    inc.dataset.step = '1'
    row.append(name, dec, track, val, inc)
    g.append(row)
  }
  const words = seedWords(makerDraft.seed)
  const seed = document.createElement('p')
  seed.className = 'gnote wide'
  seed.dataset.seedWords = words.join(' ')
  seed.dataset.seedNum = String(normSeed(makerDraft.seed))
  seed.textContent = words.join(' · ') + ' · ' + normSeed(makerDraft.seed)
  g.append(seed)
  const shuffle = menuTile('↻', t('makerShuffle'), () => {
    makerDraft.seed = normSeed((makerDraft.seed | 0) + 997)
    paintMaker(g)
  })
  shuffle.style.minHeight = '44px'
  g.append(shuffle)
  const nameRow = document.createElement('div')
  nameRow.className = 'wide'
  nameRow.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap'
  const nameLab = document.createElement('span')
  nameLab.className = 'glbl'
  nameLab.textContent = t('makerName')
  const spinWord = (kind, list) => {
    const box = document.createElement('span')
    box.style.cssText = 'display:inline-flex;align-items:center;gap:4px'
    const dec = makerSpin('<', () => {
      makerDraft[kind] = ((makerDraft[kind] | 0) - 1 + list.length) % list.length
      paintMaker(g)
    })
    dec.dataset.word = kind
    dec.dataset.step = '-1'
    const lab = document.createElement('span')
    lab.dataset.makerWord = kind
    lab.textContent = list[(makerDraft[kind] | 0) % list.length]
    lab.style.minWidth = '72px'
    lab.style.textAlign = 'center'
    const inc = makerSpin('>', () => {
      makerDraft[kind] = ((makerDraft[kind] | 0) + 1) % list.length
      paintMaker(g)
    })
    inc.dataset.word = kind
    inc.dataset.step = '1'
    box.append(dec, lab, inc)
    return box
  }
  nameRow.append(nameLab, spinWord('adj', ADJECTIVES), spinWord('noun', NOUNS))
  g.append(nameRow)
  const start = menuTile('✓', t('makerStart'), () => { startMade() })
  start.style.minHeight = '44px'
  start.dataset.makerStart = '1'
  const back = menuTile('←', t('makerBack'), () => { if (panels) panels.open('world') })
  back.style.minHeight = '44px'
  g.append(start, back)
}
async function startMade() {
  if (!makerDraft) return
  if (!confirm(t('confirmFresh'))) return
  makerNext = {
    preset: makerDraft.preset === 'flat' || makerDraft.preset === 'void' ? makerDraft.preset : 'normal',
    hills: clampStep(makerDraft.hills),
    water: clampStep(makerDraft.water),
    trees: clampStep(makerDraft.trees),
    seed: normSeed(makerDraft.seed),
    adj: makerDraft.adj | 0,
    noun: makerDraft.noun | 0,
  }
  await resetWorld()
  window.__makerGen = (window.__makerGen || 0) + 1
}
paintOldWorlds().catch(() => {})
async function exportJSON() {
  const doc = await snapshot()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([JSON.stringify(doc)], { type: 'application/json' }))
  a.download = 'bloxbert-bertyville.kuliblocks.json'; a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 2000)
}
setInterval(() => { if (dirty && allowSave) save().catch(() => {}) }, 20000)
function flushSave() {
  if (dirty) pinMachines()
  if (dirty && allowSave) save().catch(() => {})
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) flushSave()
  else syncCrops(Date.now())
  if (!document.hidden) syncForage(Date.now())
})
window.addEventListener('pagehide', flushSave)

function saveFailToast(e) {
  if (e && e.code === 'newer') toast('Made in a newer Bertopia')
  else toast(t(e && e.code === 'held' ? 'saveKept' : 'saveFull'))
}
function showUpdateChip() {
  let b = document.getElementById('update-chip')
  if (!b) {
    b = document.createElement('button')
    b.type = 'button'
    b.id = 'update-chip'
    b.addEventListener('pointerdown', (e) => e.stopPropagation())
    b.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      acceptUpdate()
    })
    document.body.appendChild(b)
  }
  b.textContent = t('updateReady')
  b.hidden = false
}
async function acceptUpdate() {
  try {
    await save()
    if (dirty && allowSave) await save()
    await changeLog.flush()
    if (dirty) throw Object.assign(new Error('held'), { code: 'held' })
  } catch (e) {
    saveFailToast(e)
    return
  }
  try {
    const reg = await navigator.serviceWorker.getRegistration('/blocks/')
    const waiting = reg && reg.waiting
    if (!waiting) return
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (sessionStorage.getItem('bert-sw-reloaded') === VERSION) return
      sessionStorage.setItem('bert-sw-reloaded', VERSION)
      location.reload()
    })
    waiting.postMessage({ type: 'skip' })
  } catch (e) {}
}
window.addEventListener('bert-update', async () => {
  try {
    if (dirty && allowSave) await save()
  } catch (e) {
    saveFailToast(e)
  }
  try { await changeLog.flush() } catch (e) {}
  showUpdateChip()
})

const $ = (id) => document.getElementById(id)
function paintModeChip() {
  const chip = $('mode-chip')
  const creativeMode = !!(session && session.mode === 'creative' && !tableMode)
  const survivalMode = !tableMode && !!(session && session.mode === 'survival')
  if (chip) {
    if (tableMode) chip.textContent = t('buildTable')
    else chip.textContent = creativeMode ? t('creative') : t('survival')
  }
  paintPath()
  const creative = $('m-creative')
  if (creative) creative.hidden = !teacherOn()
  const surv = $('m-survival')
  if (surv) {
    surv.classList.toggle('on', survivalMode)
    surv.setAttribute('aria-pressed', String(survivalMode))
  }
  const pill = $('mode-pill')
  if (pill) pill.hidden = !MODE_SWITCH_ALL
  const ps = $('mode-survival')
  const pc = $('mode-creative')
  if (ps) {
    ps.classList.toggle('on', survivalMode)
    ps.setAttribute('aria-pressed', String(survivalMode))
    ps.textContent = t('survival')
  }
  if (pc) {
    pc.classList.toggle('on', creativeMode)
    pc.setAttribute('aria-pressed', String(creativeMode))
    pc.textContent = t('creative')
  }
  document.body.classList.toggle('mode-creative', creativeMode)
}
function markSave(text) { const el = $('save-state'); if (el) el.textContent = text }
function toast(text, act) {
  const el = $('toast')
  if (!el) return
  el.replaceChildren()
  el.append(document.createTextNode(text))
  if (act && act.label && act.run) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'toast-hold'
    b.textContent = act.label
    b.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      act.run()
      el.hidden = true
    })
    el.append(b)
  }
  el.hidden = false
  clearTimeout(toast.t)
  toast.t = setTimeout(() => { el.hidden = true }, act ? 8000 : 2400)
}
const blockedAt = new Map()
function blockedToast(ruleId) {
  const now = performance.now()
  if (now - (blockedAt.get(ruleId) || 0) < 2000) return
  blockedAt.set(ruleId, now)
  const line = Rules.why(ruleId, LANG)
  if (!line) return
  toast(Rules.icon(ruleId) + ' ' + line)
}
function paintUndo() {
  const u = $('undo-btn'); if (u) u.disabled = !edits.canUndo
  const r = $('redo-btn'); if (r) r.disabled = !edits.canRedo
}
let selfUnlock = false
let armResume = 0
let cardClosedAt = 0
let closeHow = ''
let dropLockLook = false
let lockSwallowUntil = 0
let shopsLive = false
let openMachineKey = ''
let muteUseKey = ''
let muteUseUntil = 0
let crouchHintN = 0
let playLockWanted = false
let lockAskedAt = 0
let lockTries = 0
let closingPlay = false
let markPath = () => {}
let paintPath = () => {}
let learnRef = null
let lastPointer = null
session = createSession({
  t, toast, blocked: (id) => blockedToast(id), getVoxel,
  pos: () => noa.entities.getPosition(noa.playerEntity),
  heading: () => noa.camera.heading,
  markDirty: () => { dirty = true },
  found: (item) => {
    const key = floraSkill(item)
    if (key && learnRef && learnRef.addNote(key)) showCard(t(key))
  },
  noteMachine: () => noteMachine(),
  tableOn: () => tableMode,
  open: (id, key) => panels && panels.open(id, key),
  armOven: (key, id) => stations.arm(key, id),
  close: () => panels && panels.close(),
  removeBlock: (x, y, z) => edit(x, y, z, 0),
  shopWall: (key) => (stations && stations.wallItems ? stations.wallItems(key) : []),
  shopClear: (key) => { if (stations && stations.clearShop) stations.clearShop(key) },
  shopsReady: () => shopsLive,
  assign: (id) => bagPick(typeof id === 'number' ? BLOCKS.find((b) => b[0] === id)?.[1] || 'stone' : id, selectedSlot),
  putPalette: (i, id) => putPalette(i, id),
  blockIcon: (id) => blockIcon(BLOCKS.find((b) => b[0] === id) || BLOCKS[2], ATLAS),
  flash: (name) => flashHeld(name),
  paintBar: () => { paintBar(); selectSlot(selectedSlot) },
  creativeHot: () => selectedSlot,
  setCreativeHot: (i) => {
    const n = Math.max(0, i | 0)
    if (!paletteIds.length) return
    selectedSlot = n % paletteIds.length
    current = paletteIds[selectedSlot]
  },
  path: (id) => markPath(id),
  teacher: () => teacherOn(),
  setTeacher: (on) => setTeacher(on),
  staff: () => staffOn(),
  townKept: (x, y, z) => zoneLocked(x, y, z),
  wildBush: (x, y, z) => isBushId(getVoxel(x, y, z)) && !farm.get(x, y, z),
  townYes: () => townHelper(),
  setTown: (on) => setTownHelper(on),
  paintSpawn: (g) => paintSpawn(g),
  setAlways: (on) => basics && basics.setAlways(on),
  setBright: (on) => basics && basics.setBright(on),
})
session.mountEnergy(noa)
Effects.mount(document.getElementById('energy-bar'), { toast, lang: () => LANG })
session.paintChip()
let pendingGifts = []
let gifts = {}
function grantSaplings() {
  if (!session || !session.give) return
  if (gifts.sapling2) return
  const have = session.bag && session.bag.count ? session.bag.count('sapling') : 0
  if (have < 2) session.give('sapling', 2 - have)
  gifts.sapling2 = true
  dirty = true
}
let doorOptAt = null
let doorPlacedAt = 0
let doorShownAt = 0
let doorHintN = 0
let doorLookKey = ''
let doorLookAt = 0
function freshPlacedDoor() { return doorPlacedAt && performance.now() - doorPlacedAt < 280 }
function forceShut(x, y, z) {
  const id = getVoxel(x, y, z)
  const shut = placedDoorId(id)
  if (!shut || id === shut) return shut || id
  edit(x, y, z, shut)
  const up = getVoxel(x, y + 1, z)
  if (up === id) edit(x, y + 1, z, shut)
  return shut
}
function showCard(text) {
  const el = $('maker-card')
  if (!el) return
  el.hidden = false
  el.textContent = text
  clearTimeout(showCard.t)
  showCard.t = setTimeout(() => { el.hidden = true }, 4200)
}
function showLamp(x, y, z) {
  const st = basics && basics.light(x, y, z)
  const card = $('lamp-card')
  if (!card || !st) return
  card.hidden = false
  const level = $('lamp-level')
  if (level) level.textContent = t('lightLabel')
  const fill = $('lamp-fill')
  if (fill) fill.style.width = Math.round((st.charge || 0) * 100) + '%'
  clearTimeout(showLamp.t)
  showLamp.t = setTimeout(() => { card.hidden = true }, 2200)
}
function noteDoorLook(now) {
  if (doorHintN >= 3) return
  const card = $('door-opt')
  if (card && !card.hidden) return
  const aimed = noa.targetedBlock
  if (!aimed || !isDoor(aimed.blockID)) { doorLookKey = ''; return }
  const key = aimed.position[0] + ',' + aimed.position[1] + ',' + aimed.position[2]
  if (doorLookKey === key + ':shown') return
  if (key !== doorLookKey) { doorLookKey = key; doorLookAt = now; return }
  if (now - doorLookAt < 600) return
  doorHintN += 1
  doorLookKey = key + ':shown'
  toast(t(TOUCH_UI ? 'doorHintTouch' : 'doorHint'))
}
function showDoorOpt(x, y, z) {
  doorOptAt = [x, y, z]
  doorShownAt = performance.now()
  const el = $('door-opt')
  if (!el) return
  const pic = $('door-pic')
  if (pic) pic.dataset.open = isOpenDoor(getVoxel(x, y, z)) ? '1' : '0'
  const scrim = $('door-scrim')
  if (scrim) scrim.style.pointerEvents = 'none'
  const arm = () => {
    if (scrim) scrim.style.pointerEvents = ''
    window.removeEventListener('pointerup', arm, true)
    window.removeEventListener('pointercancel', arm, true)
  }
  window.addEventListener('pointerup', arm, true)
  window.addEventListener('pointercancel', arm, true)
  el.hidden = false
  releaseLook()
  paintDoorOpt()
  focusBtn($('door-auto'))
}
function paintDoorOpt() {
  if (!doorOptAt || !basics) return
  const [x, y, z] = doorOptAt
  const autoOn = basics.autoOn(x, y, z)
  const locked = basics.locked(x, y, z)
  const autoBtn = $('door-auto')
  const lockBtn = $('door-lock')
  if (autoBtn) {
    autoBtn.textContent = t(autoOn ? 'autoCloseOn' : 'autoCloseOff')
    autoBtn.setAttribute('aria-pressed', autoOn ? 'true' : 'false')
  }
  if (lockBtn) {
    lockBtn.textContent = t(locked ? 'padlockOn' : 'padlockOff')
    lockBtn.setAttribute('aria-pressed', locked ? 'true' : 'false')
  }
}
function hideDoorCard() {
  doorOptAt = null
  const el = $('door-opt')
  if (el) el.hidden = true
  const focused = document.activeElement
  if (focused && focused.blur && el && el.contains(focused)) focused.blur()
}
function hideDoorOpt() {
  hideDoorCard()
  if (!closingPlay) closePlay('gesture')
}
function dropGifts() {
  if (!pendingGifts.length) return
  const names = pendingGifts.slice()
  pendingGifts = []
  const spot = [2, 5, 40]
  setVoxel(spot[0], spot[1], spot[2], ID.box, true)
  const slots = Array.from({ length: 18 }, () => null)
  names.slice(0, 18).forEach((name, i) => { slots[i] = { item: name, n: 1 } })
  if (session) session.meta.set(spot.join(','), { kind: 'box', slots })
}
basics = createBasics({
  now: () => performance.now(),
  t, toast,
  get: (x, y, z) => getVoxel(x, y, z),
  set: (x, y, z, id) => { edit(x, y, z, id) },
  survival: () => survivalOn(),
  teacher: () => teacherOn(),
  give: (item, n) => session && session.give(item, n),
  gift: (item, n) => session && session.give && session.give(item, n || 1),
  card: (text) => showCard(text),
  badge: (text) => showCard(text),
  flagDay: (on) => { document.documentElement.dataset.alwaysDay = on ? '1' : '0' },
  changed: () => noteMachine(),
})
if ($('door-auto')) $('door-auto').addEventListener('click', () => {
  if (!doorOptAt || !basics) return
  const [x, y, z] = doorOptAt
  const on = !basics.autoOn(x, y, z)
  basics.auto(x, y, z, on)
  toast(t(on ? 'autoCloseOn' : 'autoCloseOff'))
  paintDoorOpt()
})
if ($('door-lock')) $('door-lock').addEventListener('click', () => {
  if (!doorOptAt || !basics) return
  const [x, y, z] = doorOptAt
  const on = !basics.locked(x, y, z)
  if (on) basics.lock(x, y, z, 'you')
  else basics.unlock(x, y, z)
  toast(t(on ? 'padlockOn' : 'padlockOff'))
  paintDoorOpt()
})
if ($('door-pick')) $('door-pick').addEventListener('click', () => {
  if (!doorOptAt || !basics) return
  const id = getVoxel(doorOptAt[0], doorOptAt[1], doorOptAt[2])
  const n = basics.pickup(doorOptAt[0], doorOptAt[1], doorOptAt[2])
  if (n) {
    const key = dropOf(id)
    toast(t('gotItem').replace('{item}', key ? t(key) : blockName(id)))
  }
  hideDoorOpt()
})
if ($('door-x')) $('door-x').addEventListener('pointerdown', (e) => e.stopPropagation())
if ($('door-x')) $('door-x').addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  hideDoorOpt()
})
if ($('door-scrim')) $('door-scrim').addEventListener('click', () => {
  if (performance.now() - doorShownAt < 700) return
  hideDoorOpt()
})
window.addEventListener('click', (e) => {
  if (!e.target || !e.target.closest || !e.target.closest('[data-lift]')) return
  e.preventDefault()
  e.stopPropagation()
}, true)
window.addEventListener('pointerdown', (e) => {
  const el = $('door-opt')
  if (!el || el.hidden) return
  if (e.target && e.target.closest && e.target.closest('.door-panel')) return
  if (document.pointerLockElement || noa.container.hasPointerLock) {
    e.preventDefault()
    e.stopPropagation()
    selfUnlock = true
    try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (err) {}
    try { if (document.pointerLockElement) document.exitPointerLock() } catch (err) {}
    try { noa.container.setPointerLock(false) } catch (err) {}
    return
  }
  if (performance.now() - doorShownAt < 700) return
  e.preventDefault()
  e.stopPropagation()
  hideDoorOpt()
}, true)
const stations = createStations({ touch: () => noteMachine(), t, give: (item, n) => session && session.give && session.give(item, n || 1), spend: (item, n) => !session || session.mode !== 'survival' || (session.spend && session.spend(item, n)), have: (item) => session && session.bag ? session.bag.count(item) : 0, held: () => session && session.selectedItem ? session.selectedItem() || '' : '', creative: () => !session || session.mode !== 'survival', toast: (msg) => toast(msg), name: (k) => t(k), icon: (item) => {
  const hit = BLOCKS.find((b) => b[1] === item)
  if (hit) return blockIcon(hit, ATLAS)
  return slotArt(item)
}, openCraft: (item) => { if (session && session.focusCraft) session.focusCraft(item); if (panels) panels.open('crafting') }, safetyDue: () => safetyDue(), markSafety: () => markSafety(), glasses: (on) => wearGlasses(!!on), giveBed: (design) => session && session.giveBed ? session.giveBed(design) : null, craft: (id, design) => {
  if (!session || session.mode !== 'survival') return false
  const open = openMachineKey && getVoxel(...openMachineKey.split(',').map(Number)) === ID.woodshop
  if (!open) return false
  const rec = stations && stations.ensureShop ? stations.ensureShop(openMachineKey) : null
  const hung = rec && Array.isArray(rec.wall) ? rec.wall.filter(Boolean) : []
  const tools = ['safetyGlasses', 'measuringTape', 'handSaw', 'hammer']
  if (!tools.every((t) => hung.includes(t))) return false
  const r = RECIPES.find((x) => x.id === id)
  if (!r) return false
  if (session.craftOk && !session.craftOk(id)) return false
  const chosen = design && typeof design === 'object'
    ? design
    : (id === 'rug' ? { colour: (r.in[0] && r.in[0][0]) || 'woolBlue', trim: 'woolTan' } : { height: 'Standard', shade: 'Natural' })
  const ins = id === 'rug' && chosen.colour ? [[chosen.colour, 4]] : r.in
  for (const [k, n] of ins) if (!(session.bag && session.bag.count(k) >= n)) return false
  for (const [k, n] of ins) if (session.spend && !session.spend(k, n)) return false
  if (session.give) session.give(id, 1)
  stampDecor(id, chosen)
  toast('Made ' + t(id))
  return true
}, craftOk: (id) => !session || !session.craftOk || session.craftOk(id), rules: (next) => session && session.shopRules ? session.shopRules(next) : { path: 'choose', help: false, required: false }, best: () => session && session.bestBed ? session.bestBed() : null, teacher: () => teacherOn() })
function syncOvenGlow() {
  const hot = new Set()
  const keys = stations && stations.baking ? stations.baking() : []
  for (const key of keys) {
    const parts = String(key).split(',')
    const x = Number(parts[0]), y = Number(parts[1]), z = Number(parts[2])
    if (getVoxel(x, y, z) !== ID.oven) continue
    hot.add(key)
    const face = readFace(x, y, z)
    let rec = ovenGlows.get(key)
    if (rec && rec.face !== face) { rec.mesh.dispose(); ovenGlows.delete(key); rec = null }
    if (!rec) {
      const thin = face === 'E' || face === 'W'
      const mesh = CreateBox('oven-hot-' + key, thin ? { width: 0.045, height: 1.02, depth: 1.02 } : { width: 1.02, height: 1.02, depth: 0.045 }, shapeScene)
      mesh.material = ovenHotMat
      mesh.isPickable = false
      noa.rendering.addMeshToScene(mesh, false)
      rec = { mesh, face }
      ovenGlows.set(key, rec)
    }
    const spot = faceSpot(x, y, z, face, 0.03)
    const lp = noa.globalToLocal(spot, null, glowLocal)
    rec.mesh.position.set(lp[0], lp[1], lp[2])
  }
  for (const key of [...ovenGlows.keys()]) {
    if (hot.has(key)) continue
    ovenGlows.get(key).mesh.dispose()
    ovenGlows.delete(key)
  }
}
function faceTowardPlayer(x, z) {
  const p = noa.entities.getPosition(noa.playerEntity)
  const dx = p[0] - (x + 0.5)
  const dz = p[2] - (z + 0.5)
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? 'E' : 'W'
  return dz >= 0 ? 'N' : 'S'
}
function readFace(x, y, z) {
  const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
  const face = rec && rec.face
  return face === 'N' || face === 'E' || face === 'W' || face === 'S' ? face : 'S'
}
function faceSpot(x, y, z, face, out) {
  const o = out == null ? 0.02 : out
  if (face === 'N') return [x + 0.5, y + 0.5, z + 1 + o]
  if (face === 'E') return [x + 1 + o, y + 0.5, z + 0.5]
  if (face === 'W') return [x - o, y + 0.5, z + 0.5]
  return [x + 0.5, y + 0.5, z - o]
}
function rememberFace(x, y, z, id) {
  if (!session || !session.meta) return
  const kind = id === ID.oven ? 'oven' : id === ID.workbench ? 'workbench' : id === ID.box ? 'box' : isShopBlock(id) ? 'woodshop' : ''
  if (!kind) return
  const key = x + ',' + y + ',' + z
  const face = faceTowardPlayer(x, z)
  const prev = session.meta.get(key)
  if (prev && typeof prev === 'object') prev.face = face
  else session.meta.set(key, { kind, face })
  ensureFront(x, y, z)
}
const frontMeshes = new Map()
let faceScanAt = 0
function ensureFront(x, y, z) {
  const id = getVoxel(x, y, z)
  const kind = id === ID.oven ? 'oven' : id === ID.workbench || isShopBlock(id) ? 'bench' : id === ID.box ? 'box' : ''
  const key = x + ',' + y + ',' + z
  if (!kind) {
    const old = frontMeshes.get(key)
    if (old) { old.mesh.dispose(); frontMeshes.delete(key) }
    return
  }
  const face = readFace(x, y, z)
  let rec = frontMeshes.get(key)
  if (rec && (rec.face !== face || rec.kind !== kind)) { rec.mesh.dispose(); frontMeshes.delete(key); rec = null }
  if (!rec) {
    const thin = face === 'E' || face === 'W'
    const mesh = CreateBox('front-' + kind + '-' + key, thin ? { width: 0.05, height: 1.01, depth: 1.01 } : { width: 1.01, height: 1.01, depth: 0.05 }, shapeScene)
    mesh.material = kind === 'oven' ? ovenFaceMat : kind === 'bench' ? benchFaceMat : boxFaceMat
    mesh.isPickable = false
    noa.rendering.addMeshToScene(mesh, false)
    rec = { mesh, face, kind, x, y, z }
    frontMeshes.set(key, rec)
  }
  const lp = noa.globalToLocal(faceSpot(x, y, z, face, 0.02), null, glowLocal)
  rec.mesh.position.set(lp[0], lp[1], lp[2])
}
function syncFronts(force) {
  const now = performance.now()
  if (force || now - faceScanAt > 400) {
    faceScanAt = now
    const p = noa.entities.getPosition(noa.playerEntity)
    const px = Math.floor(p[0]), py = Math.floor(p[1]), pz = Math.floor(p[2])
    const seen = new Set()
    for (let x = px - 16; x <= px + 16; x++) for (let y = py - 5; y <= py + 5; y++) for (let z = pz - 16; z <= pz + 16; z++) {
      const id = getVoxel(x, y, z)
      if (id !== ID.oven && id !== ID.workbench && id !== ID.box && !isShopBlock(id)) continue
      seen.add(x + ',' + y + ',' + z)
      ensureFront(x, y, z)
    }
    for (const key of [...frontMeshes.keys()]) if (!seen.has(key)) {
      frontMeshes.get(key).mesh.dispose()
      frontMeshes.delete(key)
    }
  }
  for (const rec of frontMeshes.values()) {
    const lp = noa.globalToLocal(faceSpot(rec.x, rec.y, rec.z, rec.face, 0.02), null, glowLocal)
    rec.mesh.position.set(lp[0], lp[1], lp[2])
  }
}
async function goWorld(m) {
  if (MODE_SWITCH_ALL && (m === 'survival' || m === 'creative')) {
    if (tableMode) setMode(false)
    if (session) session.setMode(m)
    paintModeChip()
    if (panels) panels.close()
    return
  }
  if (m === 'creative' && !teacherOn()) { toast(t('buildLocked')); return }
  const next = m === 'survival' ? 'bertyville-survival' : 'bertyville'
  if (WORLD === next && session && session.mode === m && !tableMode) {
    toast(t('alreadyHere'))
    paintModeChip()
    if (panels) panels.close()
    return
  }
  await save()
  WORLD = m === 'survival' ? 'bertyville-survival' : 'bertyville'
  try { localStorage.setItem('bloxbert-last-world', WORLD) } catch (e) {}
  changeLog.setWorld(WORLD)
  session.setMode(m)
  paintModeChip()
  await load()
  if (panels) panels.close()
}
function releaseLook() {
  selfUnlock = !!document.pointerLockElement
  document.body.classList.add('menu-open')
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
  try { if (document.pointerLockElement) document.exitPointerLock() } catch (e) {}
  try { noa.container.setPointerLock(false) } catch (e) {}
  try { noa.setPaused(true) } catch (e) {}
  if (session) session.paused = true
  if (hands) {
    hands.update(16)
    try { noa.rendering.getScene().render() } catch (e) {}
  }
  if (look || mouseLeft) {
    const card = heldCard()
    if (card) armLift(card)
  }
}
function heldCard() {
  for (const id of ['door-opt', 'inspect-card', 'about', 'sheet']) {
    const el = $(id)
    if (el && !el.hidden) return el
  }
  return null
}
function armLift(root) {
  if (!root) return
  const token = String(performance.now())
  root.dataset.lift = token
  let ended = false
  const clear = () => {
    if (root.dataset.lift !== token) return
    delete root.dataset.lift
  }
  const onUp = () => {
    if (ended) return
    ended = true
    window.removeEventListener('pointerup', onUp, true)
    window.removeEventListener('pointercancel', onUp, true)
    setTimeout(clear, 250)
  }
  window.addEventListener('pointerup', onUp, true)
  window.addEventListener('pointercancel', onUp, true)
}
function anyCard() {
  const door = $('door-opt')
  const inspect = $('inspect-card')
  const about = $('about')
  const sheet = $('sheet')
  return !!((door && !door.hidden) || (inspect && !inspect.hidden) || (about && !about.hidden) || (sheet && !sheet.hidden))
}
function focusBtn(btn) {
  if (!btn) return
  try { btn.focus({ focusVisible: true }) } catch (e) { try { btn.focus() } catch (err) {} }
  btn.style.outline = '3px solid #22D3EE'
  btn.style.outlineOffset = '2px'
}
function hidePlayChip() {
  const el = $('play-chip')
  if (el) el.hidden = true
}
function showPlayChip() {
  const el = $('play-chip')
  if (!el) return
  el.textContent = t('clickToPlay')
  el.hidden = false
}
function clearLookAccum() {
  try { noa.inputs.pointerState.dx = 0; noa.inputs.pointerState.dy = 0 } catch (e) {}
}
function swallowing() { return !TOUCH_UI && performance.now() < lockSwallowUntil }
function grabLock() {
  if (TOUCH_UI || tableMode) return
  clearLookAccum()
  dropLockLook = true
  lockSwallowUntil = Math.max(lockSwallowUntil, performance.now() + 150)
  mouseLeft = false
  mouseRight = false
  try { noa.inputs.state.fire = false } catch (e) {}
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = true } catch (e) {}
  if (document.pointerLockElement) {
    playLockWanted = false
    lockTries = 0
    hidePlayChip()
    return
  }
  const now = performance.now()
  if (playLockWanted && now - lockAskedAt < 200) return
  playLockWanted = true
  lockAskedAt = now
  const el = noa.container && noa.container.element
  if (!el || !el.requestPointerLock) { playLockWanted = false; armResume = now; showPlayChip(); return }
  try {
    const res = el.requestPointerLock()
    if (res && res.catch) res.catch((err) => {
      if (document.pointerLockElement || !playLockWanted || anyCard()) return
      const msg = String(err && err.message || err || '')
      const live = !!(navigator.userActivation && navigator.userActivation.isActive)
      if (!/too many/i.test(msg) && live && lockTries < 2) {
        lockTries += 1
        lockAskedAt = 0
        requestAnimationFrame(() => { if (playLockWanted && !anyCard()) grabLock() })
        return
      }
      playLockWanted = false
      armResume = performance.now()
      showPlayChip()
    })
  } catch (e) {}
}
function resumePlay() {
  const how = closeHow || 'gesture'
  closeHow = ''
  if (anyCard()) return
  cardClosedAt = performance.now()
  document.body.classList.remove('menu-open')
  try { noa.setPaused(false) } catch (e) {}
  if (session) session.paused = false
  if (TOUCH_UI) { hidePlayChip(); return }
  if (how === 'esc') {
    playLockWanted = false
    armResume = performance.now()
    showPlayChip()
    return
  }
  armResume = 0
  hidePlayChip()
  lockTries = 0
  grabLock()
}
function closePlay(how) {
  if (closingPlay) return
  closingPlay = true
  try {
    if (how) closeHow = how
    if (!closeHow) closeHow = 'gesture'
    if (openMachineKey) {
      muteUseKey = openMachineKey
      muteUseUntil = performance.now() + 300
    }
    openMachineKey = ''
    hideDoorCard()
    const about = $('about')
    if (about) about.hidden = true
    const inspect = $('inspect-card')
    if (inspect) inspect.hidden = true
    if (panels && panels.dismiss) panels.dismiss()
    const sheet = $('sheet')
    if (sheet) sheet.hidden = true
    resumePlay()
  } finally { closingPlay = false }
}
function eatResume(e) {
  if (swallowing()) return true
  if (!armResume) return false
  if (TOUCH_UI || (e && e.pointerType === 'touch')) { armResume = 0; return false }
  if (document.pointerLockElement || noa.container.hasPointerLock) { armResume = 0; hidePlayChip(); return false }
  armResume = 0
  hidePlayChip()
  grabLock()
  return true
}
let holdTour = () => {}
const backups = createBackups({
  dbName: DB,
  store: STORE,
  world: () => WORLD,
  snapshot,
  applyDoc,
  save,
  toast,
  t,
})
function kbLabel(n) {
  const bytes = Math.max(0, n | 0)
  if (bytes < 1024) return bytes + ' B'
  return (bytes / 1024).toFixed(1) + ' KB'
}
function whenText(at) {
  const d = new Date(at || Date.now())
  const p = (n) => String(n).padStart(2, '0')
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}
async function classSnap() {
  if (!teacherOn()) return
  const res = await backups.backup(backups.className(), null, 'class')
  toast(res && res.dropped ? t('oldestDropped') : t('backupSaved'))
  const sheet = document.getElementById('sheet')
  if (sheet && !sheet.hidden && sheet.dataset.panel === 'backups' && panels) panels.open('backups')
}
async function paintBackups(g) {
  paintBackups.gen = (paintBackups.gen || 0) + 1
  const gen = paintBackups.gen
  g.innerHTML = ''
  if (!teacherOn()) return
  const note = document.createElement('p')
  note.className = 'gnote wide'
  note.dataset.cloudNote = '1'
  note.textContent = t('cloudLater')
  g.append(note)
  g.append(menuTile('📸', t('classSnap'), () => { classSnap() }))
  const field = document.createElement('div')
  field.className = 'wide gnote'
  field.style.display = 'flex'
  field.style.flexDirection = 'column'
  field.style.gap = '6px'
  field.append(document.createTextNode(t('backupName')))
  const input = document.createElement('input')
  input.id = 'backup-name'
  input.type = 'text'
  input.maxLength = 40
  input.autocomplete = 'off'
  input.setAttribute('aria-label', t('backupName'))
  input.style.cssText = 'width:100%;min-height:44px;font:inherit;padding:8px 10px;border-radius:8px;border:2px solid #1F8A8A;background:#08131A;color:#E6EEF2'
  field.append(input)
  g.append(field)
  const saveBtn = menuTile('💾', t('saveBackup'), async () => {
    const name = input.value.trim().slice(0, 40)
    if (!name) { toast(t('backupNeedName')); return }
    const res = await backups.backup(name)
    toast(res && res.dropped ? t('oldestDropped') : t('backupSaved'))
    if (panels) panels.open('backups')
  })
  saveBtn.id = 'backup-save'
  g.append(saveBtn)
  const rows = await backups.list()
  if (gen !== paintBackups.gen || !g.isConnected) return
  if (!rows.length) {
    const empty = document.createElement('p')
    empty.className = 'gnote wide'
    empty.dataset.backupEmpty = '1'
    empty.textContent = t('backupEmpty')
    g.append(empty)
    return
  }
  for (const row of rows) {
    const box = document.createElement('div')
    box.className = 'wide'
    box.dataset.backup = row.id
    box.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 0;border-top:1px solid #1f2b44'
    const meta = document.createElement('div')
    meta.className = 'gnote'
    meta.style.flex = '1 1 140px'
    meta.style.margin = '0'
    const name = document.createElement('span')
    name.dataset.backupName = '1'
    name.style.fontWeight = '700'
    name.textContent = row.name
    const when = document.createElement('div')
    when.dataset.backupWhen = '1'
    when.textContent = whenText(row.at)
    const size = document.createElement('div')
    size.dataset.backupSize = '1'
    size.textContent = kbLabel(row.bytes)
    meta.append(name, when, size)
    const restoreBtn = document.createElement('button')
    restoreBtn.type = 'button'
    restoreBtn.className = 'gtile'
    restoreBtn.dataset.act = 'restore'
    restoreBtn.style.minHeight = '44px'
    restoreBtn.textContent = t('restoreBackup')
    restoreBtn.addEventListener('click', async () => {
      if (!confirm(t('restoreAsk'))) return
      await backups.restore(row.id)
      if (panels) panels.open('backups')
    })
    const delBtn = document.createElement('button')
    delBtn.type = 'button'
    delBtn.className = 'gtile'
    delBtn.dataset.act = 'delete'
    delBtn.style.minHeight = '44px'
    delBtn.textContent = t('deleteBackup')
    delBtn.addEventListener('click', async () => {
      if (!confirm(t('confirmDeleteBackup'))) return
      await backups.remove(row.id)
      toast(t('backupGone'))
      if (panels) panels.open('backups')
    })
    box.append(meta, restoreBtn, delBtn)
    g.append(box)
  }
}
panels = mountPanels({
  t, toast,
  save: () => save(),
  load: () => load(),
  exportWorld: () => exportJSON(),
  importWorld: () => $('import-file').click(),
  fresh: () => resetWorld(),
  hub: () => goHome(),
  teacher: () => teacherOn(),
  classSnap: () => classSnap(),
  paintBackups: (g) => paintBackups(g),
  paintOldEntry: (host, openList) => paintOldEntry(host, openList),
  paintOldWorlds: (g) => paintOldList(g),
  setTeacher: (on) => setTeacher(on),
  fullScreen: () => $('fs-btn').click(),
  inspect: () => setInspect(true),
  table: () => setMode(true),
  setWorldMode: (m) => goWorld(m),
  closePlay: (how) => closePlay(how),
  onClose: () => resumePlay(),
  onOpen: () => {
    openMachineKey = ''
    releaseLook()
    requestAnimationFrame(() => focusBtn(document.querySelector('#sheet button')))
  },
  paintBag: (g) => session.paintBag(g),
  clearBag: () => { if (session && session.clearBagPick) session.clearBagPick() },
  paintCraft: (g) => session.paintCraft(g),
  paintShop: (g) => session.paintShop(g),
  paintWallet: (g) => session.paintWallet(g),
  paintSettings: (g) => { session.paintSettings(g); paintLook(g) },
  paintTeacher: (g) => session.paintTeacher(g),
  paintRules: (g) => { Rules.useLang(LANG); paintRules(g, { lang: LANG, markDirty: () => { dirty = true }, save: () => save() }) },
  rulesWord: () => rulesWord(LANG),
  worldRules: () => showRulesCard({ force: true, lang: LANG, world: WORLD }),
  paintPrices: (g) => session.paintPrices(g),
  paintCounter: (g, key) => session.paintCounter(g, key),
  paintBunk: (g, key) => session.paintBunk(g, key),
  paintBox: (g, key) => session.paintBox(g, key),
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
  notes: () => learn.notes(),
  holdTour: () => holdTour(),
})
const learn = createLearn({
  t, toast, close: () => panels.close(),
  openTour: () => panels.open('tour'),
  panel: () => (panels && panels.openPanel) || '',
  survival: () => session && session.mode === 'survival',
  touch: () => TOUCH_UI,
  setBright: (on) => basics && basics.setBright(on),
  bright: () => !!(basics && basics.bright),
  pay: (n) => session && session.wallet && session.wallet.post({ kind: 'goal', cogs: n, by: 'you' }),
  world: () => WORLD,
  count: (item) => (session && session.bag ? session.bag.count(item) : 0),
})
markPath = (id) => learn.bump(id)
learnRef = learn
paintPath = () => learn.paintPath()
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
    if (ops.some(([x, y, z]) => zoneLocked(x, y, z))) return null
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
const pathChip = $('path-chip')
if (pathChip) {
  pathChip.addEventListener('pointerdown', (e) => e.stopPropagation())
  pathChip.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    learn.dismissPath()
  })
}
$('ver-plate').addEventListener('click', () => { openMenu(true); panels.open('log') })
$('wallet-chip').addEventListener('click', () => { toast(t('practiceTip')); openMenu(true); panels.open('wallet') })
let menuFromLock = false
let hadLock = false
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement) {
    hadLock = true
    menuFromLock = false
    playLockWanted = false
    lockTries = 0
    dropLockLook = true
    lockSwallowUntil = Math.max(lockSwallowUntil, performance.now() + 150)
    clearLookAccum()
    hidePlayChip()
    showBagHint()
    armResume = 0
    mouseLeft = false
    try { noa.inputs.state.fire = false } catch (e) {}
    return
  }
  const wasLocked = hadLock
  hadLock = false
  if (playLockWanted && !anyCard() && !TOUCH_UI && lockTries < 2 && navigator.userActivation && navigator.userActivation.isActive) {
    lockTries += 1
    lockAskedAt = 0
    grabLock()
    return
  }
  if (anyCard() || (cardClosedAt && performance.now() - cardClosedAt < 600)) { selfUnlock = false; return }
  if (wasLocked && !selfUnlock && !tableMode && !menuFromLock) { menuFromLock = true; openMenu(true) }
  selfUnlock = false
})
noa.on('tick', () => {
  const p = noa.entities.getPosition(noa.playerEntity)
  if (p[1] < -72) poof()
})
function poof() {
  const home = session && session.home
  const spot = home && home.length ? home : worldSpawn
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
const sheetEl = $('sheet')
const paletteIds = BLOCKS.filter((b) => b[0] < 1000 && !isDoorTop(b[0]) && !isCropId(b[0]) && !isBushId(b[0]) && b[0] !== WET && b[1] !== 'woodshopSide').map((b) => b[0])
let selectedSlot = 0
function paintBar() {
  const heldScroll = bar.dataset.drag === '1' ? ((bar.querySelector('.item-strip') || {}).scrollLeft || 0) : null
  bar.innerHTML = ''
  bar.classList.add('palette')
  bar.classList.remove('bagbar')
  bar.dataset.n = String(paletteIds.length)
  const strip = document.createElement('div')
  strip.className = 'item-strip'
  paletteIds.forEach((id, i) => {
    const b = document.createElement('button')
    b.className = 'slot'
    b.type = 'button'
    b.dataset.slot = String(i)
    b.dataset.id = String(id)
    const block = BLOCKS.find((x) => x[0] === id) || BLOCKS[0]
    const name = blockName(id)
    b.setAttribute('aria-label', name)
    b.setAttribute('aria-pressed', String(i === selectedSlot))
    const l = document.createElement('span')
    l.className = 'lbl'
    l.textContent = name
    b.append(l)
    b.addEventListener('click', () => selectSlot(i))
    b.prepend(blockIcon(block, ATLAS))
    strip.append(b)
  })
  bar.append(strip)
  const bagBtn = document.createElement('button')
  bagBtn.type = 'button'
  bagBtn.className = 'slot bag-tile'
  bagBtn.dataset.bag = '1'
  bagBtn.innerHTML = '<span class="gic"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 9.2V8a4 4 0 0 1 8 0v1.2" fill="none" stroke="#E6EEF2" stroke-width="1.6" stroke-linecap="round"/><path d="M6.2 9.2h11.6l-1 11.2H7.2z" fill="#1F8A8A" stroke="#E6EEF2" stroke-width="1.4"/><path d="M9 13.2h6" stroke="#E6EEF2" stroke-width="1.3" stroke-linecap="round"/></svg></span><span class="lbl"></span>'
  bagBtn.querySelector('.lbl').textContent = t('bag')
  bagBtn.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return
    e.preventDefault()
    e.stopPropagation()
  })
  bagBtn.addEventListener('click', (e) => {
    if (e.pointerType === 'touch') { openBagFromHud(); return }
    e.preventDefault()
    e.stopPropagation()
    openBagFromHud()
  })
  bar.append(bagBtn)
  const on = strip.querySelector('[aria-pressed="true"]')
  if (on) {
    if (heldScroll != null) strip.scrollLeft = heldScroll
    else strip.scrollLeft = Math.max(0, on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2)
  }
}
function useSelected() {
  if (survivalOn() && session && session.useHeld) { session.useHeld(); return }
  flashHeld(blockName(current))
}
function selectSlot(i) {
  const n = ((i % paletteIds.length) + paletteIds.length) % paletteIds.length
  const same = n === selectedSlot && current === paletteIds[n]
  selectedSlot = n
  current = paletteIds[n]
  if (!same) paintBar()
  const name = blockName(current)
  const el = $('current')
  if (el) el.textContent = name
  flashHeld(name)
}
function putPalette(i, id) {
  if (!paletteIds.length) return
  const n = ((Number(i) % paletteIds.length) + paletteIds.length) % paletteIds.length
  const j = paletteIds.indexOf(Number(id))
  if (j >= 0 && j !== n) {
    const prev = paletteIds[n]
    paletteIds[n] = paletteIds[j]
    paletteIds[j] = prev
  }
  selectedSlot = n
  current = paletteIds[n]
  paintBar()
  const name = blockName(current)
  const label = $('current')
  if (label) label.textContent = name
  flashHeld(name)
}
function pick(id) {
  const i = paletteIds.indexOf(id)
  if (i >= 0) selectSlot(i)
}
function flashHeld(name) {
  const chip = $('held-chip')
  if (!chip) return
  chip.textContent = name
  chip.hidden = false
  chip.classList.remove('on')
  void chip.offsetWidth
  chip.classList.add('on')
  clearTimeout(flashHeld.t)
  flashHeld.t = setTimeout(() => { chip.hidden = true; chip.classList.remove('on') }, 1500)
}
function bagPick(item, slot) {
  selectedSlot = slot
  const id = typeof item === 'number' ? item : (BLOCKS.find((b) => b[1] === item) || [1])[0]
  pick(id)
}
let missingAimKey = ''
let missingAimAt = 0
function noteMissingAim() {
  const hit = aimed()
  if (!hit || !isMissingId(hit.id)) return
  const pos = hit.pos || []
  const key = pos[0] + ',' + pos[1] + ',' + pos[2]
  const now = performance.now()
  if (missingAimKey === key && now - missingAimAt < 3000) return
  missingAimKey = key
  missingAimAt = now
  let name = '?'
  for (const [id, n] of unknownEntries()) {
    if (id === hit.id && n) { name = String(n); break }
  }
  showCard(t('missingPackAim').replace('{name}', name))
}
function aimed() {
  if (noa.targetedBlock && noa.targetedBlock.blockID) return { id: noa.targetedBlock.blockID, pos: noa.targetedBlock.position }
  if (tableMode) {
    const id = getVoxel(tableCursor[0], tableCursor[1], tableCursor[2])
    if (id) return { id, pos: tableCursor.slice() }
  }
  return null
}
function rayAt(cx, cy, forBreak) {
  try {
    if (!Ray) return null
    const scene = noa.rendering.getScene()
    const rect = canvas.getBoundingClientRect()
    const ray = scene.createPickingRay(cx - rect.left, cy - rect.top, null, noa.rendering.camera)
    if (!ray || !ray.direction) return null
    let ox = ray.origin.x, oy = ray.origin.y, oz = ray.origin.z
    const dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z
    const len = Math.hypot(dx, dy, dz) || 1
    const dir = [dx / len, dy / len, dz / len]
    let left = (noa.camera.zoomDistance || 0) + reachFor(survivalOn()) + 6
    for (let i = 0; i < 8 && left > 0.2; i++) {
    const hit = noa._localPick([ox, oy, oz], dir, left, (id) => id !== 0 && ((forBreak && (isCropId(id) || isBushId(id))) || !passThrough(id)))
      if (!hit || !hit.position || !hit.normal) return null
      const nx = Math.round(hit.normal[0])
      const ny = Math.round(hit.normal[1])
      const nz = Math.round(hit.normal[2])
      if (nx || ny || nz) {
        const x = Math.floor(hit.position[0] - nx * 0.08)
        const y = Math.floor(hit.position[1] - ny * 0.08)
        const z = Math.floor(hit.position[2] - nz * 0.08)
        const id = getVoxel(x, y, z)
        if (id) return { id, blockID: id, pos: [x, y, z], position: [x, y, z], adjacent: [x + nx, y + ny, z + nz], normal: [nx, ny, nz] }
      }
      const step = 0.51
      ox += dir[0] * step
      oy += dir[1] * step
      oz += dir[2] * step
      left -= step
    }
    return null
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
  releaseLook()
  focusBtn($('inspect-close'))
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
selectedSlot = 0
current = paletteIds[0]
if (session && session.paintHotbar) session.paintHotbar()
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
    releaseLook()
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
$('m-save').addEventListener('click', () => { saveClicked() })
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
$('save-btn').addEventListener('click', () => { saveClicked() })
paintUndo()
$('m-reset').addEventListener('click', () => { if (confirm(t('confirmFresh'))) resetWorld() })
$('m-about').addEventListener('click', () => { $('about').hidden = false; releaseLook(); focusBtn($('about').querySelector('button')) })
$('m-inspect').addEventListener('click', () => { setInspect(!inspectOn); openMenu(false) })
$('inspect-chip').addEventListener('click', () => setInspect(false))
$('inspect-close').addEventListener('click', () => closePlay('gesture'))
$('about-close').addEventListener('click', () => closePlay('gesture'))

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
  paintModeChip()
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
    noa.camera.zoomDistance = camBehind ? 4 : 0
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    body.gravityMultiplier = flying ? 0 : GRAV_MULT
  }
}
function armLive(m) {
  if (!MODE_SWITCH_ALL) return
  if (tableMode) setMode(false)
  goWorld(m)
}
function quietUnlock() {
  selfUnlock = true
  try { if (document.pointerLockElement) document.exitPointerLock() } catch (e) {}
  try { noa.container.setPointerLock(false) } catch (e) {}
}
if (typeof window !== 'undefined') window.__quietUnlock = quietUnlock
let bagOpenedAt = 0
let bagDown = false
function showBagHint() {
  if (TOUCH_UI) return
  try { if (localStorage.getItem('bloxbert-bag-hint') === '1') return } catch (e) {}
  const hint = $('menu-hint')
  if (!hint) return
  hint.hidden = false
  hint.textContent = t('bagHint')
  try { localStorage.setItem('bloxbert-bag-hint', '1') } catch (e) {}
}
function bagUnderPointer(e) {
  if (!e || TOUCH_UI || e.pointerType === 'touch') return false
  if (e.button != null && e.button !== 0) return false
  const bag = document.querySelector('#hotbar [data-bag="1"]')
  if (!bag) return false
  const r = bag.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return false
  return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
}
function openBagFromHud() {
  const now = performance.now()
  if (now - bagOpenedAt < 40) return
  bagOpenedAt = now
  menuFromLock = true
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
  quietUnlock()
  mouseLeft = false
  look = null
  dig = null
  leftDown = false
  try { hideCrack() } catch (e) {}
  try { noa.inputs.state.fire = false } catch (e) {}
  const sheet = $('sheet')
  if (sheet && !sheet.hidden && sheet.dataset.panel === 'inventory') {
    closePlay('gesture')
    return
  }
  if (panels) panels.open('inventory')
}
window.addEventListener('pointerdown', (e) => {
  if (!bagUnderPointer(e)) { bagDown = false; return }
  e.preventDefault()
  e.stopPropagation()
  bagDown = true
  openBagFromHud()
}, true)
window.addEventListener('click', (e) => {
  if (!bagUnderPointer(e)) return
  e.preventDefault()
  e.stopPropagation()
  if (bagDown) { bagDown = false; return }
  openBagFromHud()
}, true)
const liveS = $('mode-survival')
const liveC = $('mode-creative')
function armFrom(el, m) {
  el.addEventListener('pointerdown', () => { quietUnlock() }, true)
  el.addEventListener('click', () => armLive(m))
}
if (liveS) armFrom(liveS, 'survival')
if (liveC) armFrom(liveC, 'creative')
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
let leftDown = false
let mouseRight = false
let rightPress = null
let placeHoldAt = 0
let pickArmed = false
let holdHinted = false
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
    const flyTry = Effects.spaceFly(survivalOn(), flying)
    if (!flyTry.ok) { toast(t('noFly')); lastJump = 0; return }
    flying = flyTry.flying
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
  const rulesCard = document.getElementById('rules-card')
  if (rulesCard && !rulesCard.hidden) {
    e.preventDefault()
    e.stopPropagation()
    rulesCard.hidden = true
    return
  }
  const safe = document.getElementById('shop-safe')
  if (safe) {
    e.preventDefault()
    e.stopPropagation()
    const btn = safe.querySelector('button')
    if (btn) btn.click()
    else safe.remove()
    return
  }
  e.preventDefault()
  e.stopPropagation()
  if (e.repeat) return
  if (!anyCard()) { openMenu(true); return }
  closePlay('esc')
}, true)
function shutByKey() {
  if (!anyCard()) return false
  closePlay('gesture')
  return true
}
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return
  if (e.key === 'Escape') return
  if (e.key === 'Tab' && anyCard()) { e.preventDefault(); shutByKey(); return }
  if (e.key === 'e' || e.key === 'E') {
    if (e.ctrlKey || e.metaKey) return
    e.preventDefault()
    if (shutByKey()) return
    openMenu(true); panels.open('inventory'); return
  }
  if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) {
    if ($('sheet') && !$('sheet').hidden) return
    e.preventDefault()
    if (!e.repeat && session && session.dropHeld) session.dropHeld(e.shiftKey)
    return
  }
  if (e.key === 'f' || e.key === 'F') { if (!e.ctrlKey && !e.metaKey && $('sheet') && $('sheet').hidden) { e.preventDefault(); useSelected(); return } }
  if (e.key === 'c' || e.key === 'C') {
    if (e.ctrlKey || e.metaKey) return
    e.preventDefault()
    const sheet = $('sheet')
    if (sheet && !sheet.hidden && sheet.dataset.panel === 'crafting') { closePlay('gesture'); return }
    openMenu(true); panels.open('crafting'); return
  }
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
  if (e.key === 'Enter') {
    e.preventDefault()
    if (inspectOn) { if (!e.repeat) showInspect(); return }
    if (tableMode) { placeBlock(null, { key: true }); return }
    if (!anyCard() && placeableHeld()) {
      const aimed = noa.targetedBlock
      if (!aimed || !aimed.position || !canReach(aimed.position)) toastFarKey()
    }
    return
  }
  if (!tableMode) return
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
document.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyT' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
  if (e.target && e.target.closest && e.target.closest('input, textarea, select')) return
  const sheet = $('sheet')
  if (sheet && !sheet.hidden) return
  if (!(teacherOn() || staffOn())) return
  e.preventDefault()
  releaseLook()
  if (panels) panels.open('rules')
})
document.addEventListener('keyup', (e) => { if (e.key === 'Shift') downHeld = false; if (e.code === 'KeyZ') crouchKey = false; if (e.key === ' ' || e.code === 'Space') jumpUp() })
function showCrack(p, x, y, early) {
  const ring = $('pick-ring')
  if (!ring) return
  const stage = crackStage(p)
  if (stage < 1 && !early) { ring.hidden = true; return }
  ring.hidden = false
  if (stage !== showCrack.stage) {
    showCrack.stage = stage
    ring.classList.remove('tick')
    void ring.offsetWidth
    ring.classList.add('tick')
  }
  const shown = Math.max(stage / 4, early ? Math.max(p, 0.08) : 0)
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
function heldTool() { return session && session.toolTier ? session.toolTier() : 'hand' }
const toolTold = {}
function clampGate(dig, now) {
  if (!dig) return false
  const g = gateDig(dig.p || 0, dig.name, heldTool(), survivalOn())
  dig.p = g.p
  if (!g.blocked) return false
  const elapsed = now - (dig.t0 || now)
  if (!dig.draining && elapsed >= 250) {
    const key = toolToast(dig.name)
    if (key && (!toolTold[key] || now - toolTold[key] >= 10000)) {
      toolTold[key] = now
      toast(t(key))
    }
  }
  return true
}
function beginDig(kind) {
  const seen = cropOnLook()
  const tget = noa.targetedBlock
  if (!seen && !tget) {
    dig = null
    hideCrack()
    if (survivalOn() && !tableMode) breakMiss()
    return
  }
  const x = seen ? seen.x : tget.position[0]
  const y = seen ? seen.y : tget.position[1]
  const z = seen ? seen.z : tget.position[2]
  const id = getVoxel(x, y, z)
  const now = performance.now()
  const grown = cropDig(kind, x, y, z, id, now)
  if (grown) { dig = grown; return }
  const name = (BLOCKS.find((b) => b[0] === id) || [])[1] || ''
  if (dig && !dig.broke && dig.x === x && dig.y === y && dig.z === z && dig.p > 0) {
    dig.kind = kind
    dig.draining = false
    dig.need = mineMs(name, survivalOn(), kind === 'touch', heldTool())
    dig.t0 = now - dig.p * dig.need
    return
  }
  dig = { kind, x, y, z, id, name, t0: now, need: mineMs(name, survivalOn(), kind === 'touch', heldTool()), broke: false, p: 0, stage: 0 }
}
function cropOnLook() {
  if (!survivalOn() || tableMode || !noa.camera) return null
  const pos = noa.entities.getPosition(noa.playerEntity)
  const h = noa.camera.heading
  const pitch = noa.camera.pitch
  const cp = Math.cos(pitch)
  const dir = [cp * Math.sin(h), -Math.sin(pitch), cp * Math.cos(h)]
  const reach = reachFor(true)
  let prev = ''
  for (let t = 0.2; t <= reach; t += 0.2) {
    const x = Math.floor(pos[0] + dir[0] * t)
    const y = Math.floor(pos[1] + 1.62 + dir[1] * t)
    const z = Math.floor(pos[2] + dir[2] * t)
    const key = x + ',' + y + ',' + z
    if (key === prev) continue
    prev = key
    const id = getVoxel(x, y, z)
    if (!id || id === WATER) continue
    if (isCropId(id) || isBushId(id)) {
      if (!canReach([x, y, z])) return null
      return { x, y, z, id }
    }
    if (noa.registry.getBlockSolidity(id)) return null
  }
  return null
}
let stuckSince = 0
let stuckTold = false
let stuckClear = 0
function airish(id) {
  if (!id || id === WATER) return true
  if (isCropId(id) || isBushId(id)) return true
  if (id === ID.wheat || id === ID.tuft || id === ID.reed || id === ID.sapling) return true
  return false
}
function boxedIn() {
  const p = noa.entities.getPosition(noa.playerEntity)
  const x = Math.floor(p[0])
  const y = Math.floor(p[1])
  const z = Math.floor(p[2])
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let i = 0; i < dirs.length; i++) {
    const nx = x + dirs[i][0]
    const nz = z + dirs[i][1]
    if (airish(getVoxel(nx, y, nz)) && airish(getVoxel(nx, y + 1, nz)) && !airish(getVoxel(nx, y - 1, nz))) return false
    if (airish(getVoxel(nx, y, nz)) && airish(getVoxel(nx, y + 1, nz)) && airish(getVoxel(nx, y - 1, nz)) && !airish(getVoxel(nx, y - 2, nz))) return false
    if (!airish(getVoxel(nx, y, nz)) && airish(getVoxel(nx, y + 1, nz)) && airish(getVoxel(nx, y + 2, nz))) return false
  }
  return true
}
function feelTick(dt) {
  if (learn && learn.sync) learn.sync()
  tickDigChip()
  Effects.tick(dt)
  if (basics) basics.tick()
  if (session && session.tickDrops) session.tickDrops(dt)
  syncDropMeshes()
  const body = playerBody
  if (survivalOn() && !Effects.has('fly')) flying = false
  if (!tableMode) {
    const g = flying ? 0 : Effects.grav(GRAV_MULT, body.velocity[1])
    if (body.gravityMultiplier !== g) body.gravityMultiplier = g
  }
  const grounded = body.atRestY() < 0
  if (grounded) lastGroundAt = performance.now()
  if (survivalOn() && !flying && !tableMode && grounded && Math.abs(body.velocity[1]) < 1 && boxedIn()) {
    stuckClear = 0
    if (!stuckSince) stuckSince = performance.now()
    else if (!stuckTold && performance.now() - stuckSince >= 5000) {
      stuckTold = true
      toast(t('stuckStep'))
    }
  } else if (!stuckTold) {
    if (!stuckClear) stuckClear = performance.now()
    else if (performance.now() - stuckClear > 400) stuckSince = 0
  }
  const want = !!(noa.inputs.state.jump || jumpHeld)
  const now = performance.now()
  if (want && !prevJumpWant && !flying && !tableMode) {
    if (now - lastStickRelease < 200 && lastMove) carryOn = true
    if (grounded || now - lastGroundAt < 120) {
      body.velocity[1] = Effects.jumpV(JUMP_V)
      lastGroundAt = 0
      jumpBufferAt = 0
    } else jumpBufferAt = now
  }
  prevJumpWant = want
  if (jumpBufferAt && grounded && now - jumpBufferAt < 150 && !flying && !tableMode) {
    body.velocity[1] = Effects.jumpV(JUMP_V)
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
  moveState.maxSpeed = speedFor({ crouch: crouchKey || crouchOn, run: (downHeld && !flying) || !!stickRun, fly: flying && (!survivalOn() || Effects.has('fly')) }) * Effects.speedMul()
  if (grounded) airCap = airLimit(Math.hypot(body.velocity[0], body.velocity[2]), moveState.maxSpeed, WALK)
  else if (!flying && !tableMode) {
    const next = capAir(body.velocity[0], body.velocity[2], airCap)
    body.velocity[0] = next[0]
    body.velocity[2] = next[1]
  }
  const reach = Effects.reach(reachFor(survivalOn()))
  if (noa.blockTestDistance !== reach) noa.blockTestDistance = reach
  const stepOn = !!(autoClimb && !flying && !tableMode)
  if (playerBody.autoStep !== stepOn) playerBody.autoStep = stepOn
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
  const sheetOpen = !sheetEl.hidden
  if (swallowing()) {
    mouseLeft = false
    mouseRight = false
    try { noa.inputs.state.fire = false } catch (e) {}
  }
  const breaking = !!(noa.inputs.state.fire || mouseLeft || leftDown)
  if (!breaking) sweep = null
  const touchLook = !!(look && look.pt === 'touch')
  if (!sheetOpen && !anyCard() && !tableMode && breaking && !dig && !touchLook && (noa.container.hasPointerLock || (look && look.pt !== 'touch'))) beginDig('mouse')
  if (sheetOpen) mouseRight = false
  else if (shouldRepeatPlace(mouseRight, now - placeHoldAt, TOUCH_UI)) {
    placeHoldAt = now
    if (rightPress) rightPress.repeated = true
    placeBlock(null, { repeat: true })
  }
  if (!tableMode && !flying) {
    const behind = camBehind ? 4 : 0
    const up = behind > 0.5 && TOUCH_UI && noa.camera.pitch < -0.25 ? Math.min(2.2, -noa.camera.pitch * 1.6) : 0
    const zoom = behind + up
    if (noa.camera.zoomDistance !== zoom) noa.camera.zoomDistance = zoom
  }
  const cam = noa.rendering.camera
  const portrait = TOUCH_UI && innerHeight > innerWidth
  const fov = ((portrait ? 85 : 55) + (wideView ? 10 : 0)) * Math.PI / 180
  if (cam.fov !== fov) cam.fov = fov
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
  if (farHit) {
    if (!look || look.pt !== 'touch' || look.moved >= 24) farHit = null
    else if (!farHit.shown && now - farHit.t0 >= 250) {
      farHit.shown = true
      toastFar()
    }
  }
  noteDoorLook(now)
  if (dig && !dig.broke && !dig.draining) {
    if (dig.swingAt == null) {
      dig.swingAt = now
      pokeHand('break')
    }
    let extra = 0
    while (now - dig.swingAt >= 250 && extra < 8) {
      dig.swingAt += 250
      pokeHand('break')
      extra++
    }
  }
  if (dig && basics && isDoor(dig.id) && now - dig.t0 >= DOOR_HOLD_MS && !dig.opt) {
    dig.opt = true
    showDoorOpt(dig.x, dig.y, dig.z)
    hideCrack()
    dig = null
  }
  if (dig && dig.kind === 'mouse' && dig.creative) {
    const aimedNow = noa.targetedBlock
    const doorAimed = aimedNow && isDoor(aimedNow.blockID)
    const shopAimed = aimedNow && isShopBlock(aimedNow.blockID)
    if (breaking && !doorAimed && !shopAimed && now - dig.t0 >= 250) { breakBlock(); dig.t0 = now }
    if (!breaking) dig = null
  } else if (dig && dig.kind === 'mouse') {
    const seen = breaking ? cropOnLook() : null
    const tget = noa.targetedBlock
    const ax = seen ? seen.x : tget && tget.position[0]
    const ay = seen ? seen.y : tget && tget.position[1]
    const az = seen ? seen.z : tget && tget.position[2]
    const aimed = !!(seen || tget)
    const same = !!(aimed && ax === dig.x && ay === dig.y && az === dig.z)
    if (breaking && aimed && !same) beginDig('mouse')
    else if (!breaking && !same) { dig = null; hideCrack() }
    else {
      const next = advanceDig(dig, now, breaking, true)
      if (!next) { dig = null; hideCrack() }
      else {
        dig = next
        const blocked = clampGate(dig, now)
        const elapsed = now - dig.t0
        if (crackVisible(dig.draining ? 250 : elapsed, dig.p)) showCrack(dig.p)
        else hideCrack()
        if (!blocked && !dig.draining && survivalOn() && elapsed >= 2000 && !dig.hinted && heldTool() !== 'stone') { dig.hinted = true; toast(t(heldTool() === 'wood' ? 'stoneFaster' : 'toolFaster')) }
        if (!blocked && !dig.draining && dig.p >= 1 && !dig.broke && useHoldReady(dig, now)) { dig.broke = true; breakAt(dig.x, dig.y, dig.z, true); hideCrack(); puff() }
      }
    }
  } else if (dig && dig.kind === 'touch') {
    const holding = !!(look && !look.looking && look.moved < (look.pt === 'touch' ? 24 : 8) && !dig.draining)
    if (holding) {
      dig.p = Math.min(1, (now - dig.t0) / dig.need)
      const blocked = clampGate(dig, now)
      const elapsed = now - dig.t0
      if (look.pt === 'touch' && elapsed >= 150) showCrack(dig.p, look.x, look.y, true)
      else if (crackVisible(elapsed, dig.p)) showCrack(dig.p, look.x, look.y)
      else hideCrack()
      if (!blocked && survivalOn() && elapsed >= 2000 && !dig.hinted && heldTool() !== 'stone') { dig.hinted = true; toast(t(heldTool() === 'wood' ? 'stoneFaster' : 'toolFaster')) }
      if (!blocked && dig.p >= 1 && !dig.broke && useHoldReady(dig, now)) {
        breakAt(dig.x, dig.y, dig.z, true)
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
  tickCrops()
  tickForage()
  hoverCrop()
}
noa.on('tick', (dt) => {
  const maxP = 89 * Math.PI / 180
  if (noa.camera.pitch > maxP || noa.camera.pitch < -maxP) setLook(noa.camera.heading, noa.camera.pitch)
  feelTick(dt || 33)
  const s = noa.inputs.pointerState.scrolly
  if (s && !tableMode) {
    if (session && session.mode === 'survival' && session.setHot) session.setHot(session.hot + (s > 0 ? 1 : -1))
    else selectSlot(selectedSlot + (s > 0 ? 1 : -1))
  }
  if (stations) { stations.tick(); syncOvenGlow(); syncFronts(false) }
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
function canvasHit(e) { return !!(e && e.target === canvas) }
function hudAt(e) {
  if (!e || TOUCH_UI) return null
  let top = null
  try { top = document.elementFromPoint(e.clientX, e.clientY) } catch (err) { return null }
  if (!top || top === canvas || top === stageEl) return null
  if (top.closest && top.closest('#stage')) return null
  if (e.target === top || (top.contains && top.contains(e.target))) return null
  if (!e.clientX && !e.clientY) return null
  return top
}
const stageEl = document.getElementById('stage')
function keepHudClick(e) {
  const top = hudAt(e)
  if (!top) return
  e.preventDefault()
  e.stopPropagation()
  const shell = noa.container && noa.container._shell
  if (shell) shell.stickyPointerLock = false
  if (e.type === 'click') {
    top.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, button: e.button || 0 }))
    setTimeout(() => {
      if (!TOUCH_UI && shell && !anyCard() && !tableMode) shell.stickyPointerLock = true
    }, 0)
  }
}
window.addEventListener('pointerdown', keepHudClick, true)
window.addEventListener('mousedown', keepHudClick, true)
window.addEventListener('click', keepHudClick, true)
window.addEventListener('pointerdown', (e) => {
  if (canvasHit(e) || TOUCH_UI) return
  const shell = noa.container && noa.container._shell
  if (!shell || !shell.stickyPointerLock) return
  shell.stickyPointerLock = false
  setTimeout(() => {
    if (!TOUCH_UI && !anyCard() && !tableMode) shell.stickyPointerLock = true
  }, 0)
}, true)
canvas.addEventListener('contextmenu', (e) => { if (canvasHit(e)) e.preventDefault() })
let look = null
const LOOK_H = 0.40 * Math.PI / 180
const LOOK_V = 0.34 * Math.PI / 180
let airCap = WALK
function applyLook() {
  noa.camera.sensitivityX = 10 * lookSens
  noa.camera.sensitivityY = 10 * lookSens
  noa.camera.sensitivityMult = 0
  noa.camera.inverseY = lookInvert
  try { localStorage.setItem(LOOK_KEY, JSON.stringify({ cv: 2, sens: lookSens, invert: lookInvert, wide: wideView, climb: autoClimb, hand: showHand, mainHand, offHandItem: null, cam: camBehind ? 'behind' : 'close' })) } catch (e) {}
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
  inv.dataset.look = 'invert'
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
  const hand = document.createElement('button')
  hand.type = 'button'
  hand.className = 'gtile wide'
  const paintHand = () => { hand.textContent = t('showHand') + (showHand ? ' ✓' : '') }
  paintHand()
  hand.addEventListener('click', () => { showHand = !showHand; applyLook(); paintHand() })
  const side = document.createElement('button')
  side.type = 'button'
  side.className = 'gtile wide'
  const paintSide = () => { side.textContent = t('mainHand') + ': ' + (mainHand === 'left' ? t('left') : t('right')) }
  paintSide()
  side.addEventListener('click', () => { mainHand = mainHand === 'left' ? 'right' : 'left'; applyLook(); paintSide() })
  const cam = document.createElement('button')
  cam.type = 'button'
  cam.className = 'gtile wide'
  const paintCam = () => { cam.textContent = t('cameraView') + ': ' + (camBehind ? t('camBehind') : t('camClose')) }
  paintCam()
  cam.addEventListener('click', () => { camBehind = !camBehind; applyLook(); paintCam() })
  const tips = document.createElement('button')
  tips.type = 'button'
  tips.className = 'gtile wide'
  tips.dataset.look = 'tips'
  const paintTips = () => { tips.textContent = t('hideTips') + (learn.hideTips() ? ' ✓' : '') }
  paintTips()
  tips.addEventListener('click', () => { learn.setHideTips(!learn.hideTips()); paintTips() })
  g.append(label, range, inv, wide, climb, hand, side, cam, tips)
}
applyLook()
function applyLockedLook(dx, dy) {
  if (!dx && !dy) return
  const conv = 0.0066 * Math.PI / 180
  const sx = 10 * lookSens * conv
  const sy = 10 * lookSens * conv
  setLook(noa.camera.heading + dx * sx, noa.camera.pitch + dy * (lookInvert ? -1 : 1) * sy)
}
document.addEventListener('mousemove', (e) => {
  if (TOUCH_UI) return
  if (!document.pointerLockElement && !(noa.container && noa.container.hasPointerLock)) return
  if (anyCard() || tableMode) return
  const dx = e.movementX || 0
  const dy = e.movementY || 0
  if (dropLockLook) { dropLockLook = false; return }
  if (performance.now() < lockSwallowUntil) return
  applyLockedLook(dx, dy)
}, true)
canvas.addEventListener('mousedown', (e) => { if (!canvasHit(e)) return; if (e.button === 1) e.preventDefault() })
canvas.addEventListener('auxclick', (e) => { if (e.button === 1) { e.preventDefault(); pickAimed() } })
function targetHit() {
  const t = noa.targetedBlock
  if (!t || !t.position) return null
  const n = t.normal
  return { id: t.blockID, blockID: t.blockID, position: t.position.slice(), adjacent: (t.adjacent || t.position).slice(), normal: n ? [n[0], n[1], n[2]] : null, face: t }
}
canvas.addEventListener('pointerdown', (e) => {
  if (!canvasHit(e)) return
  if ((e.button === 0 || e.button < 0) && eatResume(e)) return
  if (e.button === 0 || e.button < 0) { mouseLeft = true; leftDown = true }
  if (e.button > 0 || tableMode) return
  look = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.timeStamp, moved: 0, looking: false, pt: e.pointerType || '' }
  lastPointer = { x: e.clientX, y: e.clientY }
  const finger = look.pt === 'touch'
  const seen = finger ? null : cropOnLook()
  const hit = seen
    ? { id: seen.id, blockID: seen.id, position: [seen.x, seen.y, seen.z], adjacent: [seen.x, seen.y + 1, seen.z] }
    : (finger ? rayAt(e.clientX, e.clientY, true) : targetHit())
  if (hit && finger && !tableMode && !canReach(hit.position)) {
    farHit = { x: hit.position[0], y: hit.position[1], z: hit.position[2], t0: performance.now(), shown: false }
    dig = null
    hideCrack()
  } else if (hit) {
    const name = (BLOCKS.find((b) => b[0] === hit.id) || [])[1] || ''
    const grown = cropDig(finger ? 'touch' : 'mouse', hit.position[0], hit.position[1], hit.position[2], hit.id, performance.now())
    if (grown) dig = grown
    else {
      const need = isGear(hit.id) ? 1e9 : mineMs(name, survivalOn(), finger, heldTool())
      const same = dig && !dig.broke && dig.x === hit.position[0] && dig.y === hit.position[1] && dig.z === hit.position[2] && dig.p > 0
      const kept = same ? dig.p : 0
      dig = { kind: finger ? 'touch' : 'mouse', x: hit.position[0], y: hit.position[1], z: hit.position[2], id: hit.id, name, t0: performance.now() - kept * need, need, broke: false, face: hit, p: kept }
    }
  } else {
    dig = null
    if (!finger && survivalOn()) breakMiss()
  }
})
canvas.addEventListener('pointermove', (e) => {
  if (!look || e.pointerId !== look.id) return
  if (look.pt === 'touch') {
    const drift = Math.hypot(e.clientX - look.sx, e.clientY - look.sy)
    look.moved = drift
    if (drift >= 24) farHit = null
    if (drift < 24) { look.x = e.clientX; look.y = e.clientY; return }
    lastLookAt = performance.now()
    if (dig && dig.kind === 'touch') { dig = null; hideCrack() }
    const dx0 = e.clientX - look.sx
    const dy0 = e.clientY - look.sy
    if (!look.looking) {
      look.looking = true
      const over = drift - 24
      look.x = e.clientX
      look.y = e.clientY
      if (over > 0) setLook(noa.camera.heading + (dx0 / drift) * over * LOOK_H * lookSens, noa.camera.pitch + (dy0 / drift) * over * (lookInvert ? -1 : 1) * LOOK_V * lookSens)
      return
    }
    const dx = e.clientX - look.x
    const dy = e.clientY - look.y
    look.x = e.clientX
    look.y = e.clientY
    setLook(noa.camera.heading + dx * LOOK_H * lookSens, noa.camera.pitch + dy * (lookInvert ? -1 : 1) * LOOK_V * lookSens)
    return
  }
  if (document.pointerLockElement || noa.container.hasPointerLock) return
  const dx = e.clientX - look.x, dy = e.clientY - look.y
  look.moved += Math.abs(dx) + Math.abs(dy)
  if (look.moved >= 8) { lastLookAt = performance.now(); if (dig && dig.kind === 'touch') { dig = null; hideCrack() } }
  if (look.moved < 8) return
  look.x = e.clientX; look.y = e.clientY
  setLook(noa.camera.heading + dx * LOOK_H * lookSens, noa.camera.pitch + dy * (lookInvert ? -1 : 1) * LOOK_V * lookSens)
})
canvas.addEventListener('pointerup', (e) => {
  releaseFar()
  if (e.button === 0 || e.button < 0) { mouseLeft = false; leftDown = false }
  if ((e.button === 0 || e.button < 0) && dig && !dig.broke && (isCropId(dig.id) || isBushId(dig.id)) && !fruitingAt(dig.x, dig.y, dig.z, getVoxel(dig.x, dig.y, dig.z))) {
    dig = null
    hideCrack()
  }
  if (swallowing()) { look = null; dig = null; hideCrack(); return }
  if (!look || e.pointerId !== look.id) return
  const moved = look.moved
  const tap = moved < 8
  const held = e.timeStamp - look.t
  const lookWasTouch = look.pt === 'touch'
  const wasFar = farHit
  const face = dig && dig.face
  const broke = dig && dig.broke
  const down = face && face.position
    ? { id: face.id || face.blockID, x: face.position[0], y: face.position[1], z: face.position[2] }
    : (dig && dig.x != null ? { id: dig.id, x: dig.x, y: dig.y, z: dig.z } : null)
  if (dig && dig.kind === 'touch') {
    if (broke || held < 500) { dig = null; hideCrack() }
    else { dig.draining = true; dig.drainAt = performance.now() }
  }
  look = null
  if (lookWasTouch && wasFar) {
    farHit = null
    if (moved < 24 && !wasFar.shown && held < 500) toastFar()
    return
  }
  const handId = session && session.blockForHot ? session.blockForHot() : 0
  const heldKey = session && session.selectedItem ? session.selectedItem() : ''
  const tapUse = heldKey === 'berry' || heldKey === 'bread' || heldKey === 'cupcake'
  const breakTap = lookWasTouch && survivalOn() && held < 500 && !broke && down && !isUseBlock(down.id) && !handId && !tapUse
  if (pickArmed && tap && held < 500 && face) {
    tryPickBlock(face.id || face.blockID)
    pickArmed = false
    paintPick()
    return
  }
  if (inspectOn && tap) { showInspect(); return }
  if (tableMode && tap) { placeBlock(); return }
  const touchTap = lookWasTouch && held < 500 && moved < 24 && !broke
  const mouseTap = !lookWasTouch && held < 500 && moved < 8 && !broke
  const upHit = lookWasTouch ? rayAt(e.clientX, e.clientY) : targetHit()
  const up = upHit && upHit.position ? { id: upHit.id || upHit.blockID, x: upHit.position[0], y: upHit.position[1], z: upHit.position[2] } : null
  const downUse = down && (isUseBlock(down.id) || machineKind(down.id))
  const upUse = up && (isUseBlock(up.id) || machineKind(up.id))
  if ((touchTap || mouseTap) && (downUse || upUse)) {
    dig = null
    hideCrack()
    const target = (downUse ? face : null) || upHit || face
    const tid = target ? (target.blockID != null ? target.blockID : target.id) : 0
    if (machineKind(tid) && crouching() && placeableHeld()) placeBlock(target)
    else useAt(target)
    return
  }
  if (!lookWasTouch && !survivalOn() && !anyCard() && held < 400 && moved < 8 && down && !broke && !(down && (isShopBlock(down.id) || down.id === ID.bunk))) {
    breakAt(down.x, down.y, down.z)
    dig = null
    hideCrack()
    return
  }
  const creativeBlock = !survivalOn() && !!current
  const survivalBlock = survivalOn() && !!handId && !tapUse
  if (touchTap && (creativeBlock || survivalBlock)) {
    const spot = (upHit && upHit.position) ? upHit : face
    if (spot) { placeBlock(spot); return }
  }
  const cropAim = down && (isCropId(down.id) || isBushId(down.id))
  if (held < 500 && !broke && canUse(down, up, moved, false) && !breakTap && !cropAim) placeBlock(upHit || face)
  if (breakTap && canUse(down, up, moved, false) && !holdHinted) {
    holdHinted = true
    toast(t('holdToBreak'))
  }
})
canvas.addEventListener('pointercancel', () => { look = null; leftDown = false; mouseLeft = false; dig = null; hideCrack(); farHit = null; releaseFar() })
window.addEventListener('pointerdown', (e) => {
  if (e.button !== 2 || tableMode || !sheetEl.hidden) return
  if (!canvasHit(e)) return
  if (eatResume(e)) return
  const snap = targetHit()
  if (tryEatClick(snap)) {
    mouseRight = false
    rightPress = null
    return
  }
  const interactive = !!(snap && isUseBlock(snap.blockID))
  rightPress = {
    id: snap ? snap.blockID : null,
    x: snap ? snap.position[0] : 0,
    y: snap ? snap.position[1] : 0,
    z: snap ? snap.position[2] : 0,
    px: e.clientX, py: e.clientY, moved: 0, t: e.timeStamp, pid: e.pointerId,
    interactive, repeated: false, placed: false,
    locked: !!(document.pointerLockElement || noa.container.hasPointerLock),
  }
  const reachable = !!(snap && canReach(snap.position))
  if (!TOUCH_UI && reachable && !interactive) {
    mouseRight = true
    placeHoldAt = performance.now()
    rightPress.placed = !!placeBlock(snap)
  } else mouseRight = false
  if (!reachable && !tableMode && !anyCard() && placeableHeld()) toastFarKey()
}, true)
window.addEventListener('pointermove', (e) => {
  if (!rightPress) return
  if (e.pointerId != null && rightPress.pid != null && e.pointerId !== rightPress.pid) return
  const cdx = e.clientX - rightPress.px
  const cdy = e.clientY - rightPress.py
  const mdx = e.movementX || 0
  const mdy = e.movementY || 0
  const dx = Math.abs(cdx) >= Math.abs(mdx) ? cdx : mdx
  const dy = Math.abs(cdy) >= Math.abs(mdy) ? cdy : mdy
  rightPress.moved += Math.abs(dx) + Math.abs(dy)
  if (!noa.container.hasPointerLock && rightPress.moved > 6 && (dx || dy)) {
    setLook(noa.camera.heading + dx * LOOK_H * lookSens, noa.camera.pitch + dy * (lookInvert ? -1 : 1) * LOOK_V * lookSens)
  }
  rightPress.px = e.clientX
  rightPress.py = e.clientY
}, true)
function finishRight(e) {
  if (swallowing()) { rightPress = null; mouseRight = false; return }
  if (!rightPress) return
  if (e && e.pointerId != null && rightPress.pid != null && e.pointerId !== rightPress.pid) return
  const press = rightPress
  rightPress = null
  mouseRight = false
  if (anyCard()) return
  if (press.placed || press.repeated || inspectOn) return
  if (e && e.pointerType === 'touch' && e.timeStamp - press.t >= 500) return
  if (!press.interactive) return
  const upHit = targetHit()
  const down = press.id == null ? null : { id: press.id, x: press.x, y: press.y, z: press.z }
  const up = upHit ? { id: upHit.blockID, x: upHit.position[0], y: upHit.position[1], z: upHit.position[2] } : null
  if (press.locked) {
    if (down && up && down.x === up.x && down.y === up.y && down.z === up.z) placeBlock(upHit)
    return
  }
  if (canUse(down, up, press.moved, false)) placeBlock(upHit)
}
window.addEventListener('pointerup', (e) => {
  releaseFar()
  if (e.button === 0) { mouseLeft = false; leftDown = false }
  if (e.button === 2) finishRight(e)
}, true)
window.addEventListener('pointercancel', () => { rightPress = null; mouseRight = false; releaseFar() })
for (const el of document.querySelectorAll('[data-hold]')) {
  const st = el.dataset.hold
  const on = (e) => { e.preventDefault(); noa.inputs.state[st] = true; el.classList.add('down'); if (st === 'jump') jumpDown() }
  const off = () => { noa.inputs.state[st] = false; el.classList.remove('down'); if (st === 'jump') jumpUp() }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off)
  el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off)
}
$('t-place').addEventListener('click', () => {
  const aimed = noa.targetedBlock || targetHit()
  if (tryEatClick(aimed)) return
  placeBlock()
})
$('t-break').addEventListener('click', breakBlock)
$('table-place').addEventListener('click', placeBlock)
function paintPick() {
  const b = $('pick-chip')
  if (!b) return
  b.replaceChildren()
  const icon = document.createElement('span')
  icon.className = 'dropper'
  icon.innerHTML = dropperIcon()
  const lab = document.createElement('span')
  lab.textContent = t('pickChip') + (pickArmed ? ' ✓' : '')
  b.append(icon, lab)
  b.title = t('copyTip')
  b.setAttribute('aria-label', t('copyTip'))
  b.dataset.ready = '1'
  b.classList.toggle('on', pickArmed)
  b.setAttribute('aria-pressed', String(pickArmed))
}
const pickBtn = $('pick-chip')
if (pickBtn) {
  let copyTipT = 0
  pickBtn.addEventListener('pointerdown', () => { copyTipT = setTimeout(() => toast(t('copyTip')), 450) })
  const clearCopyTip = () => clearTimeout(copyTipT)
  pickBtn.addEventListener('pointerup', clearCopyTip)
  pickBtn.addEventListener('pointercancel', clearCopyTip)
  pickBtn.addEventListener('pointerleave', clearCopyTip)
  pickBtn.addEventListener('click', () => { pickArmed = !pickArmed; paintPick() })
}
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
gfx.applyFog(scene)
const uwEl = document.createElement('div')
uwEl.id = 'uw'
uwEl.hidden = true
uwEl.style.cssText = 'position:fixed;inset:0;z-index:4;background:rgba(20,70,140,.35);pointer-events:none'
document.body.append(uwEl)
let underWater = false
const plainFog = gfx.applyFog.bind(gfx)
gfx.applyFog = (next) => {
  plainFog(next)
  if (!underWater) return
  const k = basics && basics.lum ? basics.lum() : 1
  scene.fogColor.set(0.10 * k, 0.25 * k, 0.45 * k)
  scene.fogStart = 0
  scene.fogEnd = 12
}
Effect.ShadersStore.bertSkyVertexShader = 'precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 vPos;void main(){vPos=position;gl_Position=worldViewProjection*vec4(position,1.0);}'
Effect.ShadersStore.bertSkyFragmentShader = 'precision highp float;varying vec3 vPos;uniform float uTime;uniform float uLum;void main(){vec3 n=normalize(vPos);float h=clamp(n.y*1.15+0.08,0.0,1.0);float lum=clamp(uLum,0.4,1.0);vec3 zenith=mix(vec3(0.03,0.05,0.12),vec3(0.13,0.34,0.72),lum);vec3 horizon=mix(vec3(0.16,0.18,0.30),vec3(0.64,0.80,0.93),lum);vec3 col=mix(horizon,zenith,h);vec3 sunDir=normalize(vec3(-0.45,0.86,-0.22));float sun=smoothstep(0.996,1.0,dot(n,sunDir))*lum;float glow=smoothstep(0.82,1.0,dot(n,sunDir))*lum;col=mix(col,vec3(1.0,0.93,0.78),glow*0.55);col=mix(col,vec3(1.0,0.97,0.9),sun);vec3 moonDir=normalize(vec3(0.25,0.72,0.45));float moon=smoothstep(0.986,0.998,dot(n,moonDir))*(1.0-lum);col=mix(col,vec3(0.86,0.9,0.98),moon);float star=step(0.992,fract(sin(dot(floor(n.xy*90.0),vec2(12.9898,78.233)))*43758.5453));col+=vec3(star)*(1.0-lum)*smoothstep(0.15,0.55,n.y);float band=sin(n.x*9.0+uTime)*sin(n.z*7.0+uTime*0.7);float cloud=smoothstep(0.35,0.75,band)*smoothstep(0.05,0.28,n.y)*smoothstep(0.72,0.4,n.y)*lum;col=mix(col,vec3(0.93,0.96,1.0),cloud*0.42);gl_FragColor=vec4(col,1.0);}'
const skyMat = new ShaderMaterial('sky', scene, { vertex: 'bertSky', fragment: 'bertSky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'uTime', 'uLum'] })
skyMat.backFaceCulling = false
skyMat.disableDepthWrite = true
skyMat.fogEnabled = false
skyMat.setFloat('uTime', 0)
skyMat.setFloat('uLum', 1)
const sky = CreateSphere('sky', { diameter: 900, segments: 12 }, scene)
sky.material = skyMat
sky.isPickable = false
sky.infiniteDistance = true
sky.alwaysSelectAsActiveMesh = true
noa.rendering.addMeshToScene(sky, false)
const lampLights = []
for (let i = 0; i < 4; i++) {
  const L = new PointLight('lamp' + i, new Vector3(0, -40, 0), scene)
  L.intensity = 0
  L.range = 8
  L.falloffType = Light.FALLOFF_GLTF
  L.diffuse = new Color3(1, 0.93, 0.72)
  L.specular = new Color3(0, 0, 0)
  L.setEnabled(false)
  lampLights.push(L)
}
const flies = []
for (let i = 0; i < 6; i++) {
  const m = CreateSphere('fly' + i, { diameter: 0.1, segments: 3 }, scene)
  const mat = new StandardMaterial('flym' + i, scene)
  mat.emissiveColor = new Color3(0.75, 0.95, 0.35)
  mat.disableLighting = true
  m.material = mat
  m.isPickable = false
  m.setEnabled(false)
  noa.rendering.addMeshToScene(m, false)
  flies.push(m)
}
const glowMeshes = new Map()
const glowLocal = [0, 0, 0]
const poolTex = new DynamicTexture('lamp-pool', readCanvas(64, 64), scene, false)
poolTex.hasAlpha = true
{
  const ctx = poolTex.getContext()
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0, 'rgba(255,210,130,255)')
  g.addColorStop(0.5, 'rgba(255,188,96,180)')
  g.addColorStop(1, 'rgba(255,170,70,0)')
  ctx.clearRect(0, 0, 64, 64)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 64, 64)
  poolTex.update()
}
const poolMat = new StandardMaterial('lamp-pool-mat', scene)
poolMat.emissiveTexture = poolTex
poolMat.opacityTexture = poolTex
poolMat.emissiveColor = new Color3(1, 0.86, 0.5)
poolMat.diffuseColor = new Color3(0, 0, 0)
poolMat.specularColor = new Color3(0, 0, 0)
poolMat.disableLighting = true
poolMat.backFaceCulling = false
const pools = []
for (let i = 0; i < 4; i++) {
  const m = CreateGround('pool' + i, { width: 9, height: 9, subdivisions: 1 }, scene)
  m.material = poolMat
  m.isPickable = false
  m.setEnabled(false)
  noa.rendering.addMeshToScene(m, false)
  pools.push(m)
  lampLights[i].includedOnlyMeshes = [m]
}
const SHADE_RGB = { Natural: [0.95, 0.62, 0.12], Cream: [0.98, 0.93, 0.78], Teal: [0.1, 0.75, 0.7] }
const WOOL_RGB = { woolBlue: [0.25, 0.45, 0.86], woolGreen: [0.22, 0.66, 0.32], woolRed: [0.78, 0.22, 0.2], woolTan: [0.76, 0.6, 0.34] }
const decorTints = []
for (let i = 0; i < 8; i++) {
  const mat = new StandardMaterial('decor-tint-m' + i, scene)
  mat.emissiveColor = new Color3(1, 0.9, 0.6)
  mat.diffuseColor = new Color3(0, 0, 0)
  mat.specularColor = new Color3(0, 0, 0)
  mat.disableLighting = true
  const box = CreateBox('decor-tint-' + i, { size: 0.3 }, scene)
  box.material = mat
  box.isPickable = false
  box.setEnabled(false)
  noa.rendering.addMeshToScene(box, false)
  decorTints.push(box)
}
function shellKind(x, y, z) {
  let roof = 0
  for (let dy = 1; dy <= 4; dy++) {
    const id = getVoxel(x, y + dy, z)
    if (id) { roof = id; break }
  }
  if (!roof) return ''
  let walls = 0
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let i = 0; i < dirs.length; i++) {
    const dx = dirs[i][0]
    const dz = dirs[i][1]
    for (let s = 1; s <= 3; s++) {
      if (getVoxel(x + dx * s, y, z + dz * s)) { walls++; break }
    }
  }
  if (walls < 3) return ''
  const built = roof === 10 || roof === 11 || roof === 12 || roof === 20 || roof === 8 || roof === 9 || roof === 22 || roof === 26 || roof === 69 || (roof >= 13 && roof <= 16)
  return built ? 'house' : 'cave'
}
function syncDecorTint(srcs) {
  let n = 0
  const rows = srcs || []
  for (let i = 0; i < rows.length && n < decorTints.length; i++) {
    const src = rows[i]
    const rec = session && session.meta && session.meta.get(src.x + ',' + src.y + ',' + src.z)
    const design = rec && rec.design
    if (!design) continue
    let rgb = null
    let spot = [src.x + 0.5, src.y + 0.84, src.z + 0.5]
    let sc = [0.34, 0.22, 0.34]
    if (src.id === 1100 || src.id === 1101) rgb = SHADE_RGB[design.shade] || SHADE_RGB.Natural
    else if (src.id === 1102 || src.id === 1103) {
      rgb = SHADE_RGB[design.shade] || SHADE_RGB.Natural
      const side = rec.side
      const ox = side === 'E' ? 0.22 : side === 'W' ? -0.22 : 0
      const oz = side === 'S' ? 0.22 : side === 'N' ? -0.22 : 0.22
      spot = [src.x + 0.5 + ox, src.y + 0.55, src.z + 0.5 + oz]
      sc = [0.28, 0.28, 0.28]
    } else if (src.id === 1104) {
      rgb = WOOL_RGB[design.colour] || WOOL_RGB.woolTan
      spot = [src.x + 1, src.y + 0.09, src.z + 1]
      sc = [1.55, 0.08, 1.55]
    }
    if (!rgb) continue
    const mesh = decorTints[n++]
    mesh.material.emissiveColor.set(rgb[0], rgb[1], rgb[2])
    mesh.scaling.set(sc[0] / 0.3, sc[1] / 0.3, sc[2] / 0.3)
    const lp = noa.globalToLocal(spot, null, glowLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
    mesh.setEnabled(true)
  }
  for (let i = n; i < decorTints.length; i++) decorTints[i].setEnabled(false)
}
const DAY_AMB = [0.78, 0.82, 0.88]
const sunLight = noa.rendering.light
const DAY_DIFF = sunLight.diffuse.clone()
const DAY_SPEC = sunLight.specular.clone()
// Noon sun+ambient already exceeds 1, and StandardMaterial clamps that sum,
// so a raw k scale leaves night grass near 73%. Pull terrain ambient down
// until a flat top face lands in the night / brighter-night bands.
const TOP_NDL = 1 / Math.hypot(0.35, 1, 0.2)
function litLum(k, a) {
  const r = Math.min(1, DAY_DIFF.r * k * TOP_NDL + DAY_AMB[0] * k * a)
  const g = Math.min(1, DAY_DIFF.g * k * TOP_NDL + DAY_AMB[1] * k * a)
  const b = Math.min(1, DAY_DIFF.b * k * TOP_NDL + DAY_AMB[2] * k * a)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function ambScale(k) {
  const target = k >= 0.92 ? 1 : k >= 0.6 ? 0.75 + (k - 0.6) * (0.25 / 0.32) : 0.55 + (k - 0.4) * (0.2 / 0.2)
  if (litLum(k, 1) <= target + 0.001) return 1
  let lo = 0
  let hi = 1
  for (let i = 0; i < 16; i++) {
    const mid = (lo + hi) / 2
    if (litLum(k, mid) > target) hi = mid
    else lo = mid
  }
  return (lo + hi) / 2
}
let bertEm = null
function paintTerrain(k, fill) {
  const a = fill == null ? ambScale(k) : fill
  const mats = scene.materials
  for (let i = 0; i < mats.length; i++) {
    const m = mats[i]
    if (!m || !m.name || m.name.indexOf('terrain') === -1) continue
    m._checkScenePerformancePriority = function () {}
    m.checkReadyOnlyOnce = false
    m.ambientColor.set(a, a, a)
  }
  const meshes = scene.meshes
  for (let i = 0; i < meshes.length; i++) {
    const mat = meshes[i].material
    if (!mat || !mat.name || mat.name.indexOf('terrain') === -1) continue
    const subs = meshes[i].subMeshes
    if (!subs) continue
    for (let s = 0; s < subs.length; s++) {
      const dw = subs[s]._drawWrapper
      if (dw) dw._forceRebindOnNextCall = true
    }
  }
}
function syncGlow() {
  if (!basics) return
  const k = Effects.light(basics.lum())
  skyMat.setFloat('uLum', k)
  scene.ambientColor.set(DAY_AMB[0] * k, DAY_AMB[1] * k, DAY_AMB[2] * k)
  sunLight.diffuse.set(DAY_DIFF.r * k, DAY_DIFF.g * k, DAY_DIFF.b * k)
  sunLight.specular.set(DAY_SPEC.r * k, DAY_SPEC.g * k, DAY_SPEC.b * k)

  if (!underWater) scene.fogColor.set(0.10 + 0.54 * k, 0.12 + 0.68 * k, 0.22 + 0.71 * k)
  if (!bertEm && typeof bertyMat !== 'undefined' && bertyMat) bertEm = bertyMat.emissiveColor.clone()
  if (bertEm) bertyMat.emissiveColor.set(bertEm.r * k, bertEm.g * k, bertEm.b * k)
  if (typeof dropMats !== 'undefined') {
    for (const m of dropMats.values()) {
      const e = m.metadata
      if (e && e.er != null) m.emissiveColor.set(e.er * k, e.eg * k, e.eb * k)
    }
  }
  const dark = k < 0.92
  const ppos = noa.entities.getPosition(noa.playerEntity)
  const list = basics.lights().filter((l) => l.radius > 1 && l.step > 0)
  // pack light provider: on lamps (cached, full cell scan)
  if (typeof noa !== 'undefined' && noa.world) {
    const seen = new Set()
    for (const l of list) seen.add(l.x + ',' + l.y + ',' + l.z)
    const px = Math.floor(ppos[0]), py = Math.floor(ppos[1]), pz = Math.floor(ppos[2])
    const chunk = (px >> 4) + ',' + (pz >> 4)
    if (!syncGlow._cache || syncGlow._cache.chunk !== chunk || syncGlow._dirty) {
      const found = []
      const tints = []
      const r = 16
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
        const x = px + dx, z = pz + dz
        for (let y = py - 2; y <= py + 4; y++) {
          const id = getVoxel(x, y, z)
          if (id === 1101 || id === 1103) found.push({ x, y, z, radius: 6, step: 1 })
          if (id === 1100 || id === 1101 || id === 1102 || id === 1103 || id === 1104) tints.push({ x, y, z, id })
        }
      }
      syncGlow._cache = { chunk, found, tints }
      syncGlow._dirty = false
    }
    for (const src of syncGlow._cache.found) {
      const k = src.x + ',' + src.y + ',' + src.z
      if (!seen.has(k)) { list.push(src); seen.add(k) }
    }
  }
  list.sort((a, b) => {
    const da = (a.x + 0.5 - ppos[0]) ** 2 + (a.z + 0.5 - ppos[2]) ** 2
    const db = (b.x + 0.5 - ppos[0]) ** 2 + (b.z + 0.5 - ppos[2]) ** 2
    return da - db || b.radius - a.radius
  })
  const cap = quality === 'lite' ? 2 : 4
  for (let i = 0; i < lampLights.length; i++) {
    const L = lampLights[i]
    const pool = pools[i]
    const src = dark && i < cap ? list[i] : null
    if (!src) { L.setEnabled(false); pool.setEnabled(false); continue }
    const lp = noa.globalToLocal([src.x + 0.5, src.y + 1.25, src.z + 0.5], null, glowLocal)
    L.position.set(lp[0], lp[1], lp[2])
    L.range = Math.max(4, src.radius)
    L.intensity = 1.4
    L.setEnabled(true)
    const d = Math.min(9, Math.max(6, src.radius))
    const gp = noa.globalToLocal([src.x + 0.5, src.y + 0.08, src.z + 0.5], null, glowLocal)
    pool.position.set(gp[0], gp[1], gp[2])
    pool.scaling.set(d / 9, 1, d / 9)
    pool.setEnabled(true)
  }
  let fill = null
  if (dark) {
    const eye = noa.camera.getPosition()
    const kind = shellKind(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2]))
    let near = false
    if (kind && list.length) {
      const dx = list[0].x + 0.5 - ppos[0]
      const dy = list[0].y + 0.5 - ppos[1]
      const dz = list[0].z + 0.5 - ppos[2]
      near = dx * dx + dy * dy + dz * dz < 40
    }
    if (kind) {
      const sunK = k * (kind === 'house' ? 0.2 : 0.12)
      sunLight.diffuse.set(DAY_DIFF.r * sunK, DAY_DIFF.g * sunK, DAY_DIFF.b * sunK)
      sunLight.specular.set(DAY_SPEC.r * sunK, DAY_SPEC.g * sunK, DAY_SPEC.b * sunK)
      fill = kind === 'house' ? (near ? 1.15 : 0.28) : (near ? 0.42 : 0.16)
      scene.ambientColor.set(fill, fill, fill)
    }
  }
  paintTerrain(k, fill)
  syncDecorTint(syncGlow._cache && syncGlow._cache.tints)
  const seen = new Set()
  const glowList = basics.lights()
  for (const src of glowList) {
    if (!(src.step > 0) && src.charge > 0.2) continue
    const id = src.x + ',' + src.y + ',' + src.z
    seen.add(id)
    let mesh = glowMeshes.get(id)
    if (!mesh) {
      mesh = CreateSphere('gl' + seen.size, { diameter: 0.26, segments: 4 }, scene)
      const mat = new StandardMaterial('glm' + seen.size, scene)
      mat.emissiveColor = new Color3(1, 0.88, 0.4)
      mat.disableLighting = true
      mesh.material = mat
      mesh.isPickable = false
      noa.rendering.addMeshToScene(mesh, false)
      glowMeshes.set(id, mesh)
    }
    const lp = noa.globalToLocal([src.x + 0.5, src.y + 0.55, src.z + 0.5], null, glowLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
    mesh.setEnabled(true)
  }
  for (const [id, mesh] of glowMeshes) if (!seen.has(id)) mesh.setEnabled(false)
  const night = basics.phase() === 'night' || basics.phase() === 'dusk'
  const p = noa.entities.getPosition(noa.playerEntity)
  const ft = performance.now() / 1000
  for (let i = 0; i < flies.length; i++) {
    flies[i].setEnabled(night)
    if (!night) continue
    const lp = noa.globalToLocal([p[0] + Math.sin(ft + i) * 3, p[1] + 1.2 + Math.sin(ft * 2 + i) * 0.4, p[2] + Math.cos(ft * 0.8 + i) * 3], null, glowLocal)
    flies[i].position.set(lp[0], lp[1], lp[2])
  }
}
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
const glassesMat = new StandardMaterial('berty-glasses', scene)
glassesMat.diffuseColor = new Color3(0.15, 0.2, 0.24)
glassesMat.emissiveColor = new Color3(0.25, 0.65, 0.78)
glassesMat.specularColor = new Color3(0.2, 0.2, 0.2)
glassesMesh = CreateBox('berty-glasses', { width: 0.22, height: 0.05, depth: 0.03 }, scene)
glassesMesh.material = glassesMat
glassesMesh.position.set(0, 0.32, 0.2)
glassesMesh.parent = berty
glassesMesh.isPickable = false
glassesMesh.setEnabled(false)
syncGlasses()
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
  m.metadata = { er: c[0] * 0.55, eg: c[1] * 0.55, eb: c[2] * 0.55 }
  dropMats.set(item, m)
  return m
}
const dropSeen = new Set()
const dropLocal = [0, 0, 0]
const dropWorld = [0, 0, 0]
function syncDropMeshes() {
  if (!dropReady || !session || !session.groundDrops) return
  const drops = session.groundDrops()
  if (!drops.length) {
    if (!dropMeshes.size) return
    for (const [id, mesh] of dropMeshes) { mesh.dispose(); dropMeshes.delete(id) }
    return
  }
  const p = noa.entities.getPosition(noa.playerEntity)
  dropSeen.clear()
  const bob = REDUCE ? 0.2 : 0.2 + Math.sin(performance.now() / 280) * 0.06
  let shown = 0
  for (const d of drops) {
    const dx = d.x - p[0]
    const dz = d.z - p[2]
    if (dx * dx + dz * dz >= 1600) continue
    if (++shown > 48) break
    dropSeen.add(d.id)
    let mesh = dropMeshes.get(d.id)
    if (!mesh) {
      mesh = CreateBox('drop' + d.id, { size: 0.34 }, scene)
      mesh.material = dropMat(d.item)
      mesh.isPickable = false
      noa.rendering.addMeshToScene(mesh, false)
      dropMeshes.set(d.id, mesh)
    }
    if (!REDUCE) mesh.rotation.y = performance.now() / 500
    dropWorld[0] = d.x
    dropWorld[1] = d.y + bob
    dropWorld[2] = d.z
    const lp = noa.globalToLocal(dropWorld, null, dropLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
  }
  for (const [id, mesh] of dropMeshes) if (!dropSeen.has(id)) { mesh.dispose(); dropMeshes.delete(id) }
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
const ghostMat = new StandardMaterial('place-ghost', scene)
ghostMat.diffuseColor = new Color3(0.75, 0.82, 0.78)
ghostMat.emissiveColor = new Color3(0.28, 0.34, 0.3)
ghostMat.specularColor = new Color3(0, 0, 0)
ghostMat.alpha = 0.42
ghostMat.transparencyMode = 2
ghostMat.backFaceCulling = false
const placeGhost = CreateBox('place-ghost', { size: 0.98 }, scene)
placeGhost.material = ghostMat
placeGhost.isPickable = false
placeGhost.setEnabled(false)
noa.rendering.addMeshToScene(placeGhost, false)
const amberMat = new StandardMaterial('place-ghost-amber', scene)
amberMat.diffuseColor = new Color3(0.95, 0.62, 0.12)
amberMat.emissiveColor = new Color3(0.72, 0.38, 0.05)
amberMat.specularColor = new Color3(0, 0, 0)
amberMat.alpha = 0.55
amberMat.transparencyMode = 2
amberMat.backFaceCulling = false
const placeGhostSide = CreateBox('place-ghost-side', { size: 0.98 }, scene)
placeGhostSide.material = ghostMat
placeGhostSide.isPickable = false
placeGhostSide.setEnabled(false)
noa.rendering.addMeshToScene(placeGhostSide, false)
const ghostLocal = [0, 0, 0]
const ghostLocal2 = [0, 0, 0]
const cyanLine = new Color3(0.13, 0.83, 0.93)
const amberLine = new Color3(0.95, 0.62, 0.12)
function ringPoints() {
  const n = 48
  const pts = []
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    pts.push(new Vector3(Math.cos(a), 0, Math.sin(a)))
  }
  return pts
}
const protectRing = CreateLines('protect-ring', { points: ringPoints() }, scene)
protectRing.color = cyanLine
protectRing.isPickable = false
protectRing.setEnabled(false)
noa.rendering.addMeshToScene(protectRing)
function ringSpot() {
  if (protect && protect.center) {
    const c = protect.center
    return { x: c[0], y: c[1] + 0.08, z: c[2], r: protectRadius(protect.size) || 8 }
  }
  return { x: TOWN_AT[0], y: FLOOR + 1.08, z: TOWN_AT[2], r: protectRadius(protect && protect.size) || 16 }
}
function paintProtectRing() {
  if (performance.now() >= ringUntil) { protectRing.setEnabled(false); return }
  const spot = ringSpot()
  if (!spot || !spot.r) { protectRing.setEnabled(false); return }
  protectRing.scaling.set(spot.r, 1, spot.r)
  const lp = noa.globalToLocal([spot.x, spot.y, spot.z], null, [])
  protectRing.position.copyFromFloats(lp[0], lp[1], lp[2])
  protectRing.setEnabled(true)
}
function heldBlockId() {
  if (survivalOn()) return (session && session.blockForHot && session.blockForHot()) || 0
  return current || 0
}
function ghostTint(id) {
  const name = (BLOCKS.find((b) => b[0] === id) || [])[1] || ''
  if (name === 'planks' || name === 'log' || name === 'box' || name === 'workbench' || name === 'woodshop' || name === 'door') return [0.86, 0.66, 0.34]
  if (name === 'leaves' || name === 'grass' || name === 'woolGreen') return [0.28, 0.62, 0.32]
  if (name === 'brickRed' || name === 'woolRed') return [0.72, 0.28, 0.22]
  if (name === 'glass' || name === 'ice' || name === 'woolBlue') return [0.45, 0.72, 0.86]
  if (name === 'sand' || name === 'woolTan') return [0.82, 0.74, 0.45]
  return [0.62, 0.68, 0.72]
}
function ghostCell() {
  if (anyCard() || !placeableHeld()) return null
  const aimed = tableMode ? tableTarget() : noa.targetedBlock
  if (!aimed || !aimed.position) return null
  const id = aimed.blockID || 0
  if (!tableMode && id && isUseBlock(id) && !againstMachine(aimed)) return null
  const spot = landingCell(aimed)
  if (!spot) return null
  if (!tableMode) {
    if (!canReach([spot.x, spot.y, spot.z])) return null
    const p = noa.entities.getPosition(noa.playerEntity)
    if (overlapsPlayer(spot.x, spot.y, spot.z, p[0], p[1], p[2])) return null
  }
  if (getVoxel(spot.x, spot.y, spot.z)) return null
  return spot
}
function syncPlaceGhost() {
  noteMissingAim()
  const spot = ghostCell()
  if (!spot) {
    placeGhost.setEnabled(false)
    placeGhostSide.setEnabled(false)
    if (outline) outline.color.copyFrom(cyanLine)
    return
  }
  const id = heldBlockId()
  let side = null
  let amber = false
  if (id === ID.woodshop) {
    side = shopSpan(spot.x, spot.y, spot.z)
    amber = shopBlocked(side) || !canReach([side.sx, side.sy, side.sz])
  }
  if (amber) {
    placeGhost.material = amberMat
    placeGhostSide.material = amberMat
    outline.color.copyFrom(amberLine)
  } else {
    const tint = ghostTint(id)
    ghostMat.diffuseColor.set(tint[0], tint[1], tint[2])
    ghostMat.emissiveColor.set(tint[0] * 0.55, tint[1] * 0.55, tint[2] * 0.55)
    placeGhost.material = ghostMat
    placeGhostSide.material = ghostMat
    outline.color.copyFrom(cyanLine)
  }
  const lp = noa.globalToLocal([spot.x + 0.5, spot.y + 0.5, spot.z + 0.5], null, ghostLocal)
  placeGhost.position.set(lp[0], lp[1], lp[2])
  placeGhost.setEnabled(true)
  if (side) {
    const lp2 = noa.globalToLocal([side.sx + 0.5, side.sy + 0.5, side.sz + 0.5], null, ghostLocal2)
    placeGhostSide.position.set(lp2[0], lp2[1], lp2[2])
    placeGhostSide.setEnabled(true)
  } else placeGhostSide.setEnabled(false)
}
function paintOutline() {
  const tgt = noa.targetedBlock
  const pos = tgt ? tgt.position : (tableMode ? tableCursor : null)
  if (!pos) { outline.setEnabled(false); syncPlaceGhost(); return }
  outline.setEnabled(true)
  const local = noa.globalToLocal([pos[0] + 0.5, pos[1] + 0.5, pos[2] + 0.5], null, [])
  outline.position.copyFromFloats(local[0], local[1], local[2])
  syncPlaceGhost()
}
function eyeVoxel() {
  const eye = noa.camera.getPosition()
  return getVoxel(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2]))
}
function underwaterTick() {
  const wet = eyeVoxel() === WATER
  if (wet !== underWater) {
    underWater = wet
    uwEl.hidden = !wet
    if (!wet) {
      const k = basics && basics.lum ? basics.lum() : 1
      scene.fogColor.set(0.10 + 0.54 * k, 0.12 + 0.68 * k, 0.22 + 0.71 * k)
      plainFog()
    }
  }
  if (!underWater) return
  const k = basics && basics.lum ? basics.lum() : 1
  scene.fogColor.set(0.10 * k, 0.25 * k, 0.45 * k)
  scene.fogStart = 0
  scene.fogEnd = 12
}
const heldScratch = { kind: 'empty', key: '', id: 0 }
function fillHeld() {
  heldScratch.kind = 'empty'
  heldScratch.key = ''
  heldScratch.id = 0
  if (survivalOn() && session && session.selectedItem) {
    const key = session.selectedItem() || ''
    if (!key) return heldScratch
    const def = ITEMS[key]
    if (def && def.block && !def.svg && !def.tool) {
      heldScratch.kind = 'block'
      heldScratch.key = key
      heldScratch.id = def.block
    } else {
      heldScratch.kind = 'flat'
      heldScratch.key = key
    }
    return heldScratch
  }
  if (current) {
    heldScratch.kind = 'block'
    heldScratch.key = String(current)
    heldScratch.id = current
  }
  return heldScratch
}
hands = createHands({
  scene,
  camera: noa.rendering.camera,
  noa,
  held: fillHeld,
  side: () => mainHand,
  show: () => showHand,
  hidden: () => tableMode || inspectOn || anyCard() || document.body.classList.contains('photo') || document.body.classList.contains('menu-open') || noa.camera.zoomDistance > 0.5,
  wet: () => underWater,
  lite: () => quality === 'lite' || REDUCE,
  speed: () => {
    const b = noa.ents.getPhysicsBody(noa.playerEntity)
    return b ? Math.hypot(b.velocity[0], b.velocity[2]) : 0
  },
})
noa.on('beforeRender', (dt) => {
  paintOutline()
  paintProtectRing()
  if (basics) syncGlow()
  underwaterTick()
  if (hands) hands.update(dt || 16)
  if (REDUCE) return
  skyTime += (dt || 16) * 0.0004
  skyMat.setFloat('uTime', skyTime)
})

const perf = { frames: [], first: 0, deltas: [], jsMs: [], steps: [], level: () => level, get auto() { return AUTO }, quality: () => quality, aa: AA }
{ const sh = noa.container._shell, r = sh.onRender; sh.onRender = function (dt, a1, a2) { const a = performance.now(); r(dt, a1, a2); perf.jsMs.push(performance.now() - a); if (perf.jsMs.length > 2000) perf.jsMs.splice(0, 1000) } }
let last = performance.now(), n = 0, acc = 0
function frame(tnow) {
  if (!perf.first) perf.first = performance.now()
  n++; acc += tnow - last; perf.deltas.push(tnow - last); if (perf.deltas.length > 4000) perf.deltas.splice(0, 2000); last = tnow
  if (acc >= 1000) {
    const fps = (n * 1000) / acc; perf.frames.push(fps); n = 0; acc = 0
    const moved = gfx.tick(fps)
    if (moved) {
      level = gfx.level
      engine.setHardwareScalingLevel(level)
      noa.world.setAddRemoveDistance(gfx.add, gfx.rem)
      gfx.applyFog()
      perf.steps.push({ at: Math.round(performance.now()), level, add: gfx.add[0] })
      if (moved.toast) toast(t('lowerDetail'))
    }
    perf.lastFps = fps
    if (showSpeed) $('perf').textContent = fps.toFixed(0) + ' fps · ' + gfx.label() + ' · ' + Math.round(100 / level) + '% res · ' + noa.world._chunksKnown.count() + ' chunks'
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
  const next = gfx.set(q)
  if (!next) return
  if (next.reload) {
    toast(t('save') + '…')
    try { await save() } catch (e) {}
    const u = new URL(location.href); u.searchParams.delete('q'); u.searchParams.delete('scale')
    location.replace(u.href)
    return
  }
  quality = gfx.quality
  AUTO = gfx.auto
  level = gfx.level
  engine.setHardwareScalingLevel(level)
  noa.world.setAddRemoveDistance(gfx.add, gfx.rem)
  gfx.applyFog()
  paintQuality(); toast(gfx.label())
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
    rules: Rules,
    effects: Effects,
    noa, perf, save, load, resetWorld, placeBlock, breakBlock, pick, setVoxel, getVoxel, undo, redo, importFile, exportDoc: snapshot,
    applyEdit: (ops) => { const g = edits.applyEdit(ops, { source: 'test', label: 'test' }); if (g) changeLog.note(g); return g },
    history: (x, y, z) => changeLog.history(x, y, z),
    logPrune: (nowMs) => changeLog.prune(nowMs),
    bag: () => session.bag.dump(),
    give: (item, n) => {
      const left = session.give(item, n)
      if (learn && learn.sync) learn.sync()
      return left
    },
    cogs: () => session.wallet.balance(),
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
    get climb() { return autoClimb },
    hand() {
      return hands ? { show: showHand, side: mainHand, visible: hands.showing(), key: hands.key(), tris: hands.tris(), swing: hands.swinging(), swingCount: hands.swingCount() } : null
    },
    handSwing(kind) { pokeHand(kind) },
    lookHand(patch) {
      if (patch) {
        if (patch.show != null) showHand = !!patch.show
        if (patch.side === 'left' || patch.side === 'right') mainHand = patch.side
        if (patch.cam === 'behind' || patch.cam === 'close') camBehind = patch.cam === 'behind'
        applyLook()
      }
      let saved = null
      try { saved = JSON.parse(localStorage.getItem(LOOK_KEY) || 'null') } catch (e) {}
      return { show: showHand, side: mainHand, cam: camBehind ? 'behind' : 'close', saved }
    },
    panel(id) {
      if (!panels) return ''
      if (!id) { panels.close(); return '' }
      panels.open(id)
      const sheet = document.getElementById('sheet')
      return (sheet && !sheet.hidden && sheet.dataset.panel) || ''
    },
    table(on) { setMode(!!on); return tableMode },
    turn: (dh, dp = 0) => setLook(noa.camera.heading + dh, noa.camera.pitch + dp), setLook,
  }
}

basics.boot(WORLD !== 'bertyville')
load().catch(() => {}).finally(() => {
  if (allowSave) window.__bertOpen = true
  if (location.search.includes('smoke=1')) window.__bloxReady = true
  paintModeChip()
  if (session && session.mode === 'survival' && session.paintHotbar) session.paintHotbar()
  else paintBar()
  if (sentToSurvival) toast(t('studentWorld'))
  markSave(saved.size ? t('bertyville') + ' · ' + t('loaded') : t('bertyville') + ' · ' + t('notSaved'))
  showRulesCard({ teacher: !!(teacherOn() || staffOn()), lang: LANG, world: WORLD })
})
if (typeof __BLOX_STUDENT__ === 'undefined' || !__BLOX_STUDENT__) if (location.search.includes('smoke=1')) {
  let bagWarned = false
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
    fillBar() {
      const items = ['stone', 'dirt', 'sand', 'gravel', 'coal', 'log', 'planks', 'brickRed', 'glass']
      session.setMode('survival')
      for (let i = 0; i < 9; i++) session.bag.slots[i] = { item: items[i], n: 1 }
      for (let i = 9; i < session.bag.slots.length; i++) {
        const s = session.bag.slots[i]
        if (s && s.item === 'wheatSeeds') session.bag.slots[i] = null
      }
      session.paintHotbar()
      return session.bag.slots.map((s) => (s ? s.item + ':' + s.n : null))
    },
    seeds() { return session.bag.count('wheatSeeds') },
    stash(x, y, z, item, n) {
      const k = x + ',' + y + ',' + z
      let rec = session.meta.get(k)
      if (!rec || !Array.isArray(rec.slots)) {
        rec = { kind: 'box', slots: Array.from({ length: 18 }, () => null), face: rec && rec.face }
        session.meta.set(k, rec)
      }
      let slot = rec.slots.find((s) => s && s.item === item)
      if (!slot) {
        const i = rec.slots.findIndex((s) => !s)
        if (i < 0) return null
        slot = { item, n: 0 }
        rec.slots[i] = slot
      }
      slot.n += n
      noteMachine()
      return rec.slots.filter((s) => s && s.n).map((s) => s.item + ':' + s.n)
    },
    peekBox(x, y, z) {
      const rec = session.meta.get(x + ',' + y + ',' + z)
      if (!rec || !rec.slots) return null
      return rec.slots.filter((s) => s && s.n).map((s) => s.item + ':' + s.n)
    },
    oven(key) { const all = stations.dump(); return all[key] || null },
    startBake(x, y, z) {
      const key = x + ',' + y + ',' + z
      const fueled = stations.addFuel(key, 'planks')
      const started = stations.addInput(key, 'bread')
      return { fueled, started, rec: stations.dump()[key] || null }
    },
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
    lightOven(key) {
      session.give('planks', 1)
      session.give('sand', 2)
      stations.addFuel(key, 'planks')
      const ok = stations.arm(key, 'glass')
      return { ok, hot: stations.baking() }
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
    stand(x, y, z, h, p) {
      noa.entities.setPosition(noa.playerEntity, [x, y, z])
      const b = noa.ents.getPhysicsBody(noa.playerEntity)
      if (b) b.velocity[0] = b.velocity[1] = b.velocity[2] = 0
      setLook(h || 0, p || 0)
    },
    close() { if (panels) panels.close() },
    arm() { armResume = 0; playLockWanted = false; lockSwallowUntil = 0 },
    plant(x, y, z, id) { setVoxel(x, y, z, id, true); if (basics) basics.saw(x, y, z, id); return getVoxel(x, y, z) },
    chop(x, y, z) {
      const id = getVoxel(x, y, z)
      const ok = session.onBreak(x, y, z, id)
      if (ok) setVoxel(x, y, z, 0, true)
      return { ok, id, berry: session.bag.count('berry'), seeds: session.bag.count('wheatSeeds'), wheat: session.bag.count('wheat'), dirt: session.bag.count('dirt') }
    },
    aim() { const t = noa.targetedBlock; return t ? { id: t.blockID, x: t.position[0], y: t.position[1], z: t.position[2] } : null },
    land() {
      const t = noa.targetedBlock
      const spot = ghostCell()
      return { aim: t ? { id: t.blockID, x: Math.round(t.position[0]), y: Math.round(t.position[1]), z: Math.round(t.position[2]) } : null, spot, on: !!(placeGhost && placeGhost.isEnabled()) }
    },
    voxel(x, y, z) { return getVoxel(x, y, z) },
    facing(x, y, z) { return readFace(x, y, z) },
    fillBag(item, n) {
      if (!item || !ITEMS[item]) {
        if (!bagWarned) {
          bagWarned = true
          console.warn('fillBag: unknown item ' + item)
        }
        return false
      }
      session.setMode('survival')
      session.give(item, n)
      session.clearLoose()
      return true
    },
    emptyBag() {
      session.setMode('survival')
      for (let i = 0; i < session.bag.slots.length; i++) session.bag.slots[i] = null
      session.setHot(0)
    },
    grounded() {
      const b = noa.ents.getPhysicsBody(noa.playerEntity)
      return !!(b && b.atRestY() < 0)
    },
    drops() { return session.groundDrops().map((d) => d.item + ':' + d.n) },
    count(item) { return session.bag.count(item) },
    bags() { return session.bags() },
    wipeCreative() {
      const back = session.mode
      session.setMode('creative')
      for (let i = 0; i < session.bag.slots.length; i++) session.bag.slots[i] = null
      session.setMode(back)
    },
    heading() { return noa.camera.heading },
    toast() { const el = document.getElementById('toast'); return el && !el.hidden ? el.textContent : '' },
    reach() { return noa.blockTestDistance },
    pos() { const p = noa.entities.getPosition(noa.playerEntity); return [p[0], p[1], p[2]] },
    flying() { return document.body.classList.contains('fly') },
    seedBox(x, y, z) { session.meta.set(x + ',' + y + ',' + z, { kind: 'box', slots: Array.from({ length: 18 }, () => ({ item: 'dirt', n: 1 })) }) },
    word(k) { return t(k) },
    kept(x, y, z) { return keptCell(x, y, z) },
    world(x, y, z) { return noa.world.getBlockID(x, y, z) },
    fresh() { resetWorld() },
    parkLost(item, n, why) { session.lostAdd(item, n, why) },
    hit(x, y) {
      const r = rayAt(x, y)
      if (!r) return null
      const n = r.normal || [0, 0, 0]
      return { id: r.id, x: r.position[0], y: r.position[1], z: r.position[2], ax: r.adjacent[0], ay: r.adjacent[1], az: r.adjacent[2], nx: n[0] | 0, ny: n[1] | 0, nz: n[2] | 0 }
    },
    setMeta(key, rec) {
      if (!session || !session.meta) return false
      session.meta.set(String(key), rec)
      return true
    },
    bunk() {
      const r = RECIPES.find((x) => x.id === 'bunk')
      return r ? r.in.map((p) => p[0] + ':' + p[1]).join('+') : ''
    },
    persist: () => save(),
    townLock(x, y, z) {
      protectTold = 0
      const locked = zoneLocked(x, y, z)
      const chip = document.getElementById('dig-chip')
      return { locked, shown: !!(chip && !chip.hidden), text: chip ? chip.textContent : '' }
    },
    energy: () => session && session.energyState ? session.energyState() : { bolts: 0 },
    setEnergy: (n) => session && session.setEnergy ? session.setEnergy(n) : 0,
    clock: (n) => basics && basics.clock(n),
    seek: (n) => basics && basics.seek(n),
    nightAt: () => basics ? basics.nightAt() : 0,
    lum: () => basics ? basics.lum() : 1,
    phase: () => basics ? basics.phase() : 'day',
    always(on) { if (arguments.length && basics) basics.setAlways(on); return !!(basics && basics.always) },
    bright: (on) => { if (basics) basics.setBright(on); return !!(basics && basics.bright) },
    gate: (tier) => { setGate(tier, true); return gates() },
    actor: (id) => basics && basics.actor(id),
    teacher: (on) => basics && basics.teacherStub(on),
    lock: (x, y, z, owner) => basics && basics.lock(x, y, z, owner),
    auto: (x, y, z, on) => basics && basics.auto(x, y, z, on),
    use: (x, y, z) => basics ? basics.use(x, y, z) : false,
    light: (x, y, z) => basics ? basics.light(x, y, z) : null,
    charge: (x, y, z, c) => basics && basics.setCharge(x, y, z, c),
    badge: () => basics ? basics.badgeCount() : 0,
    badgeText: () => basics ? basics.badgeText() : '',
    resetBadges: () => basics && basics.resetBadges(),
    clearLights() {
      if (!basics) return
      for (const l of basics.lights()) setVoxel(l.x, l.y, l.z, 0, true)
      basics.tick()
    },
    card: () => { const el = document.getElementById('maker-card'); return el && !el.hidden ? el.textContent : '' },
    crops: () => farm.dump(),
    forage: () => forage.dump(),
    bushes: () => starterBushes(),
    loot: (x, y, z) => wildBushLoot(x, y, z),
    pickN: (x, y, z) => wildPickCount(x, y, z),
    seekForage(ms) {
      const now = Date.now()
      for (const r of forage.rows()) r.lastSeen = now - ms
      syncForage(now)
      return { forage: forage.dump(), now }
    },
    clockBackForage(x, y, z) {
      const r = forage.get(x, y, z)
      if (!r) return null
      const g = r.grown
      r.lastSeen = Date.now() + 60000
      forage.advance(r, Date.now())
      return { grown: r.grown, same: r.grown === g, lastSeen: r.lastSeen }
    },
    reseed() { gifts.forage110 = false; return seedOldBushes() },
    ponds: () => starterPonds(1),
    rescue: () => rescueSpots(1).slice(0, 8),
    pondFlag: () => pondAid,
    aimSolid: (id) => !!noa.blockTargetIdCheck(id),
    dryNear: (r) => dryNear(r || 40),
    ensurePond: () => { pondAid = false; return ensureStarterPond({ pondAid: false }) },
    ripeMs: () => RIPE_MS,
    freeze(on) { cropFreeze = !!on },
    seekCrops(ms) {
      const now = Date.now()
      for (const r of farm.rows()) r.lastSeen = now - ms
      growAll(now)
      return farm.dump()
    },
    setGrown(x, y, z, grown) {
      const r = farm.get(x, y, z)
      if (!r) return null
      r.grown = Math.max(0, Math.min(capOf(r), grown))
      r.lastSeen = Date.now()
      paintCrop(r)
      return { ...r }
    },
    zeroCrops() {
      const now = Date.now()
      for (const r of farm.rows()) { r.grown = 0; r.lastSeen = now; r.plantedAt = now }
      return farm.dump()
    },
    stroke(on) {
      if (on) rightPress = { test: true, planted: false, repeated: false, placed: false, interactive: false, id: null, x: 0, y: 0, z: 0, moved: 0, t: 0 }
      else { rightPress = null; plantStroke = null; harvestStroke = null; sproutStroke = null }
    },
    notes: () => learn.notes(),
    clockBack(x, y, z) {
      const r = farm.get(x, y, z)
      if (!r) return null
      const g = r.grown
      r.lastSeen = Date.now() + 60000
      advance(r, Date.now())
      return { grown: r.grown, same: r.grown === g, lastSeen: r.lastSeen }
    },
    crack: () => { const ring = document.getElementById('pick-ring'); return ring && !ring.hidden ? ring.style.background : '' },
    rolls(kind, x, y, z) { return session.seedCount(kind, x, y, z) },
    lost: () => session.lostItems ? session.lostItems() : [],
    gifts: () => ({ ...gifts }),
    shopPlace: (x, y, z) => placeShop(x | 0, y | 0, z | 0),
    clearShop: (key) => { if (stations && stations.clearShop) stations.clearShop(key) },
    shopLift: (x, y, z) => liftShop(x | 0, y | 0, z | 0),
    shopInfo: (x, y, z) => {
      const key = x + ',' + y + ',' + z
      const meta = session && session.meta ? session.meta.get(key) || null : null
      const anchor = meta && meta.anchor ? meta.anchor : shopAnchorKey(x, y, z)
      return { id: getVoxel(x, y, z), meta, face: readFace(x, y, z), anchor, wall: stations && stations.wallItems ? stations.wallItems(anchor) : [] }
    },
    safety: () => {
      const el = document.getElementById('shop-safe')
      return { due: safetyDue(), seen: !!gifts.shopSafe, open: !!el, text: el ? el.innerText : '' }
    },
    glasses: () => ({ on: !!gifts.glassesOn, mesh: !!(glassesMesh && glassesMesh.isEnabled()), mark: document.body.dataset.glasses || '' }),
    wearGlasses: (on) => wearGlasses(!!on),
    strict: (on) => {
      try {
        if (on) localStorage.setItem('bloxbert-strict', '1')
        else localStorage.removeItem('bloxbert-strict')
        sessionStorage.removeItem('bt-shop-safe')
      } catch (e) {}
      return strictOn()
    },
    focus: (id) => { if (session && session.focusCraft) session.focusCraft(id); if (panels) panels.open('crafting'); return true },
    hold: (item) => !!(session && session.holdItem && session.holdItem(item)),
    take: (item, n) => !!(session && session.spend && session.spend(item, n || 1)),
    home: () => session && session.home,
    shopRules: (next) => session && session.shopRules ? session.shopRules(next) : null,
    bed: (key) => session && session.meta ? (session.meta.get(key) || null) : null,
    beds: () => session && session.bedDesigns ? session.bedDesigns() : [],
    recover: () => session && session.recoverOrphans ? session.recoverOrphans('') : 0,
    placeBunk: (x, y, z) => {
      if (!session) return null
      session.holdItem && session.holdItem('bunk')
      const ok = session.onPlace(x | 0, y | 0, z | 0, ID.bunk)
      if (ok) setVoxel(x | 0, y | 0, z | 0, ID.bunk, true)
      return { ok, meta: session.meta.get((x | 0) + ',' + (y | 0) + ',' + (z | 0)) || null, id: getVoxel(x | 0, y | 0, z | 0) }
    },
    apply: (doc) => applyDoc(doc),
    uses: () => {
      const s = session.bag.slots[session.hot]
      return s ? { item: s.item, uses: s.uses == null ? null : s.uses, n: s.n } : null
    },
    craft: (id) => session.tryCraft(id),
    bakeBread() {
      const key = '11,5,8'
      if (!session.bag.count('planks') && !session.bag.count('coal') && !session.bag.count('log')) session.give('planks', 1)
      const fuel = session.bag.count('coal') ? 'coal' : session.bag.count('log') ? 'log' : 'planks'
      const fueled = stations.addFuel(key, fuel)
      const armed = stations.arm(key, 'bread')
      return { fueled, armed, flour: session.bag.count('flour'), bread: session.bag.count('bread'), view: stations.view(key) }
    },
    takeBread() {
      const key = '11,5,8'
      stations.tick()
      const item = stations.take(key)
      return { item, bread: session.bag.count('bread'), view: stations.view(key) }
    },
    needs(id) {
      session.setCraftOpen(true)
      if (panels) panels.open('crafting')
      const g = document.getElementById('sheet-body')
      return g ? g.innerText : ''
    },
    async loadOld() {
      const data = new Uint16Array(S * S * S)
      const at = []
      for (let id = 1; id <= 31; id++) {
        const x = (id - 1) % 16
        const z = 4 + ((id - 1) / 16 | 0)
        data[x * S * S + 2 * S + z] = id
        at.push([x, 2, z])
      }
      data[2 * S + 3] = 32
      const palette = ['air', 'grass', 'dirt', 'stone', 'slate', 'coal', 'sand', 'gravel', 'brickRed', 'brickGrey', 'planks', 'log', 'leaves', 'woolBlue', 'woolGreen', 'woolRed', 'woolTan', 'snow', 'ice', 'redSand', 'glass', 'coreplate', 'workbench', 'oven', 'vend', 'storeCounter', 'bunk', 'box', 'wheat', 'reed', 'door', 'doorOpen', 'glowPebble']
      const doc = { format: 'kuliblocks', v: 2, chunkSize: S, palette, chunks: { '0,0,0': await gz(data) }, spawn: [8.5, 8, 40], player: { mode: 'survival', bag: [], hot: 0 } }
      await applyDoc(doc)
      const ids = at.map(([x, y, z]) => getVoxel(x, y, z))
      const gift = session.meta.get('2,5,40')
      return { ids, unknown: getVoxel(0, 2, 3), gift: gift && gift.slots ? gift.slots.filter(Boolean).map((s) => s.item) : [] }
    },
    fps: () => perf.lastFps || 0,
    fpsSpan(ms = 4000) {
      const d = perf.deltas
      let acc = 0, n = 0
      for (let i = d.length - 1; i >= 0 && acc < ms; i--) { acc += d[i]; n++ }
      return acc > 400 ? (n * 1000) / acc : (perf.lastFps || 0)
    },
    project(x, y, z) {
      const lp = noa.globalToLocal([x + 0.5, y + 1.02, z + 0.5], null, [0, 0, 0])
      const sc = noa.rendering.getScene()
      const engine = sc.getEngine()
      const cam = sc.activeCamera
      const vw = engine.getRenderWidth()
      const vh = engine.getRenderHeight()
      const viewport = cam.viewport.toGlobal(vw, vh)
      const p = Vector3.Project(new Vector3(lp[0], lp[1], lp[2]), Matrix.Identity(), sc.getTransformMatrix(), viewport)
      const canvas = document.querySelector('#stage canvas')
      const r = canvas.getBoundingClientRect()
      return { x: r.left + (p.x / vw) * r.width, y: r.top + (p.y / vh) * r.height, behind: p.z < 0 || p.z > 1 }
    },
    projectAt(x, y, z) {
      const lp = noa.globalToLocal([x, y, z], null, [0, 0, 0])
      const sc = noa.rendering.getScene()
      const engine = sc.getEngine()
      const cam = sc.activeCamera
      const vw = engine.getRenderWidth()
      const vh = engine.getRenderHeight()
      const viewport = cam.viewport.toGlobal(vw, vh)
      const p = Vector3.Project(new Vector3(lp[0], lp[1], lp[2]), Matrix.Identity(), sc.getTransformMatrix(), viewport)
      const canvas = document.querySelector('#stage canvas')
      const r = canvas.getBoundingClientRect()
      return { x: r.left + (p.x / vw) * r.width, y: r.top + (p.y / vh) * r.height, behind: p.z < 0 || p.z > 1 }
    },
  }
}
repaintBlocks()
void T0