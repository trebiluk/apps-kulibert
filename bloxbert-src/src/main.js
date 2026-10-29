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
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Light } from '@babylonjs/core/Lights/light'
import { PointLight } from '@babylonjs/core/Lights/pointLight'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import ATLAS from '../assets/atlas.json'
import { BLOCKS } from './data/blocks-list.js';
import { installPacks, packList, setPack, currentPackId, smallTextures, setSmallTextures } from './gfx/packs.js'
import { STR } from './strings.js'
import { EXTRA } from './strings-extra.js'
// 2.5.536 what's new. Locked version. Main was 2.5.533. rw, ti, and fa-AF are machine drafts.
const WN536 = {
  en: { whatsNewBody: '2.5.536 — Tap your cog chip to see today\'s cogs.' },
  simple: { whatsNewBody: '2.5.536 — Tap the cog chip. See today\'s cogs.' },
  uk: { whatsNewBody: '2.5.536 — Торкни фішку шестерень, щоб побачити сьогоднішні.' },
  ru: { whatsNewBody: '2.5.536 — Нажми фишку шестерён, чтобы увидеть сегодняшние.' },
  es: { whatsNewBody: '2.5.536 — Toca la ficha de engranajes para ver los de hoy.' },
  ar: { whatsNewBody: '2.5.536 — المس شريحة التروس لترى تروس اليوم.' },
  'fa-AF': { whatsNewBody: '2.5.536 — تراشه چرخ‌دنده را بزن تا چرخ‌دنده‌های امروز را ببینی.' },
  rw: { whatsNewBody: '2.5.536 — Kanda ikofi y\'amapine ubone aya uyu munsi.' },
  ti: { whatsNewBody: '2.5.536 — ናይ ኮግ ቺፕ ጠውቕ ናይ ሎሚ ኮግ ንምርኣይ።' },
}
for (const [lang, row] of Object.entries(WN536)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  EXTRA[lang].whatsNewBody = row.whatsNewBody
}
// 2.5.540 what's new. Locked 2.5.537 was already below main (2.5.539). rw, ti, and fa-AF are machine drafts.
const WN540 = {
  en: { whatsNewBody: '2.5.540 — Beds now tell you why they won\'t fit.' },
  simple: { whatsNewBody: '2.5.540 — Beds now say why they will not fit.' },
  uk: { whatsNewBody: '2.5.540 — Ліжка тепер кажуть, чому не вміщаються.' },
  ru: { whatsNewBody: '2.5.540 — Кровати теперь говорят, почему не помещаются.' },
  es: { whatsNewBody: '2.5.540 — Las camas ahora dicen por qué no caben.' },
  ar: { whatsNewBody: '2.5.540 — الأسرّة الآن تقول لماذا لا تتسع.' },
  'fa-AF': { whatsNewBody: '2.5.540 — بسترها حالا می‌گویند چرا جا نمی‌شوند.' },
  rw: { whatsNewBody: '2.5.540 — Ibitanda ubu bivuga impamvu bitinjira.' },
  ti: { whatsNewBody: '2.5.540 — ዓራታት ሕጂ ስለምን ከምዘይኣትዉ ይነግሩ።' },
}
for (const [lang, row] of Object.entries(WN540)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  EXTRA[lang].whatsNewBody = row.whatsNewBody
}
// 2.5.541 what's new. Locked 2.5.534 was already below main (2.5.540). rw, ti, and fa-AF are machine drafts.
const WN541 = {
  en: { whatsNewBody: '2.5.541 — The Menu opens on the first click and speaks your language.' },
  simple: { whatsNewBody: '2.5.541 — The Menu opens on the first click. It uses your language.' },
  uk: { whatsNewBody: '2.5.541 — Меню відкривається з першого клацання і говорить твоєю мовою.' },
  ru: { whatsNewBody: '2.5.541 — Меню открывается с первого щелчка и говорит на твоём языке.' },
  es: { whatsNewBody: '2.5.541 — El Menú se abre al primer clic y habla tu idioma.' },
  ar: { whatsNewBody: '2.5.541 — القائمة تُفتح من أول نقرة وتتحدث بلغتك.' },
  'fa-AF': { whatsNewBody: '2.5.541 — فهرست از اولین کلیک باز می‌شود و به زبان تو حرف می‌زند.' },
  rw: { whatsNewBody: '2.5.541 — Menyu ifunguka ku gukanda kwa mbere kandi ivuga ururimi rwawe.' },
  ti: { whatsNewBody: '2.5.541 — ዝርዝር ካብ ቀዳማይ ጠውቃይ ይኸፍትን ብቋንቋኻ ይዛረብን።' },
}
for (const [lang, row] of Object.entries(WN541)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  EXTRA[lang].whatsNewBody = row.whatsNewBody
}
// 2.5.542 what's new. rw, ti, and fa-AF are machine drafts.
const WN542 = {
  en: { whatsNewBody: '2.5.542 — Classic and Mystical looks. Small textures stay sharp.' },
  simple: { whatsNewBody: '2.5.542 — Two looks: Classic and Mystical. Small textures stay sharp.' },
  uk: { whatsNewBody: '2.5.542 — Вигляди Класичний і Містичний. Малі текстури лишаються чіткими.' },
  ru: { whatsNewBody: '2.5.542 — Виды Классика и Мистика. Маленькие текстуры остаются чёткими.' },
  es: { whatsNewBody: '2.5.542 — Aspectos Clásico y Místico. Las texturas pequeñas siguen nítidas.' },
  ar: { whatsNewBody: '2.5.542 — مظهران: كلاسيكي وصوفي. القوام الصغير يبقى حادًا.' },
  'fa-AF': { whatsNewBody: '2.5.542 — دو نما: کلاسیک و رازآلود. بافت کوچک تیز می‌ماند.' },
  rw: { whatsNewBody: '2.5.542 — Isura Classic na Mystical. Amashusho mato aguma yagaragara.' },
  ti: { whatsNewBody: '2.5.542 — ክልተ መልክዕ፡ ክላሲክን ሚስቲካልን። ንኣሽቱ ምስልታት ብልጽጽ ይጸንሑ።' },
}
for (const [lang, row] of Object.entries(WN542)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  EXTRA[lang].whatsNewBody = row.whatsNewBody
}
function holdWalletChip() {
  const el = document.getElementById('wallet-chip')
  if (!el || el.dataset.cogReady === '1') return
  el.dataset.cogHold = '1'
  el.hidden = true
  if (el.childNodes.length) el.replaceChildren()
}
holdWalletChip()
import { inSafeZone } from './safe-zone.js'
import { createEdits } from './world-edit.js'
import { createLog } from './change-log.js'
import { withFloor } from './world-floor.js'
import { mountPanels } from './panels.js'
import { mountSlotQol } from './slots-bridge.js'
import { createSession } from './session.js'
import { createBackups } from './backups.js'
import { CHANGELOG } from './changelog.js'
import { Rules, combatRule } from './rules.js'
import { paintRules, rulesWord } from './rules-editor.js'
import { showRulesCard } from './rules-card.js'
import { Effects } from './effects.js'
import { blockIcon, dropperIcon, slotArt, itemSvg, menuPlate, menuIcon, wandCanvas } from './icons.js'
import { dayCap } from './econ/cogs.js'
import { createMobs } from './mobs.js'
import { placeFoundryArena, onConsoleUse } from './foundry.js'
import { createStations } from './stations.js'
import { createTools } from './tools.js'
import { createLearn } from './learn.js'
import { holdTip, dropTip, showToast, pinAboveBar } from './tips.js'
import { FLOOR, STATIONS, keptCell, protectedCell, protectRadius, TOWN_AT, plotInterior } from './town.js'
import { coalHere, plantHere, wildWood, pondHere, shoreLow, rescueSpots, starterPonds, surfaceY, starterBushes, wildBushCell, groundAt, genBlock, genColumns, peekColumn, underAll, solidUnder, GEN, spawnTreeYaw } from './worldgen.js'
import { makerBlock, seedWords, ADJECTIVES, NOUNS, clampStep, normSeed, isMakerPreset, softPreset, tipKey, makerName, shareCode, parseShare, PRESETS } from './maker.js'
import { fromDoc, botsFrom } from './save.js'
import { RECIPES } from './data/recipes.js'
import { setGate, gates } from './data/gates.js'
import { JUMP_V, GRAV_MULT, FLY_V, speedFor, overlapsPlayer, mineMs, inReach, blockNearBody, reachFor, TOUCH_REACH, crackStage, crackVisible, advanceDig, keepCrouchStep, shouldRepeatPlace, canUse, capAir, airLimit, WALK, gateDig, toolToast } from './feel.js'
import { nearestTree, fellCells, takeHit, TREE_NEAR, TREE_LOOK, TREE_HITS } from './chop-tree.js'
import { createBasics } from './basics.js'
import { isDoor, isDoorTop, doorTopId, doorKind, isOpenDoor, placedDoorId, DOOR_HOLD_MS, LEVER, BUTTON, LANTERN } from './doors.js'
import { migrateVoxels, migrate, SCHEMA, unknownEntries, resetUnknown, isMissingId } from './save/migrate.js'
import { maybePush, maybePull } from './save/server-sync.js'
import { mountSyncChip, setSyncState } from './save/sync-chip.js'
import { packVersions, packBlocks, packOn } from './packs/registry.js'
import './packs/farm/pack.js'
import './packs/decor/pack.js'
import { floraSkill, FLORA_CROSS } from './packs/flora/pack.js'
import { packRecipes, packItems } from './packs/registry.js'
import { ITEMS } from './data/items.js'
{
  const have = new Set(RECIPES.map((r) => r.id))
  for (const r of packRecipes()) {
    const decor = r.id === 'floorLamp' || r.id === 'wallLamp' || r.id === 'rug'
    const flora = r.id === 'birchPlanks' || r.id === 'pinePlanks' || r.id.indexOf('dye') === 0
    if ((decor || flora) && !have.has(r.id)) RECIPES.push(r)
  }
  for (const it of packItems()) if ((it.pack === 'decor' || it.pack === 'flora') && !ITEMS[it.key]) ITEMS[it.key] = it.def
}
import { dropOf, harvestCounts, berryPickCount } from './data/items.js'
import * as Badges from './badges.js'
import * as CrewBadges from './crew-badges.js'
window.addEventListener('contextmenu', (e) => {
  const t = e.target
  const tag = t && t.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (t && t.isContentEditable)) return
  e.preventDefault()
}, true)
function fixZoom() { // 2.5.480: Chrome zoom makes fixed UI overlap
  const z = window.devicePixelRatio || 1
  if (z > 1.25) document.documentElement.style.setProperty('--ui-scale', String(Math.min(1, 1.25 / z)))
  else document.documentElement.style.removeProperty('--ui-scale')
}
window.addEventListener('resize', fixZoom)
fixZoom()
window.Badges = Badges // 2.5.476: panel reads progress
Badges.onBadge((id) => { // 2.5.472: pay 10 bronze cogs once
  if (!session || session.mode !== 'survival') return
  const name = t('bdg' + id.replace(/Round|Walk|Corner/, '')[0].toUpperCase() + id.replace(/Round|Walk|Corner/, '').slice(1) + 'Name') || id // 2.5.475: fix name key
  if (session.wallet && session.wallet.post) session.wallet.post({ kind: 'badge', cogs: 10, by: 'you', ref: id, metal: 'bronze' })
  toast(t('bdgEarned').replace('{name}', name))
  setTimeout(() => toast(t('bdgPaid').replace('{n}', '10')), 800)
  dirty = true
})
CrewBadges.setHost({ t: t, markDirty: function () { dirty = true }, laneAdd: laneAdd, capLane: capLane })
import { wildBushLoot } from './drops.js'
import { createHands } from './hands.js'
import { createFarm, nearWater, advance, stage, preview, formatLeft, isCropId, isBushId, isRipe, replantSeed, CROP, BUSH, DRY, WET, WATER, RIPE_MS, capOf } from './farm.js'
import { createForage, wildPickCount, BARE_BUSH, FRUIT_BUSH, WILD_WHEAT } from './forage.js'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { createQuality } from './gfx/quality.js'
import { createLook } from './gfx/look.js'
import { powerOf } from './power.js'
import { TECH } from './packs/tech/pack.js'
import { initBot } from './bot/bot.js'
import { createCalm } from './hud-calm.js'
import { createBelts, craftOnce } from './conveyor.js'
import { putInSlots } from './box.js'
import { noteVoxel, orientTech, attachCircuits, pressButton, releaseButton, toggleSwitch, preferLamp, tick as circuitTick, rescan as circuitRescan, view as circuitView } from './circuits.js'
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
const gfxLook = createLook()
let plantHalf = false

const COMBAT_TUNING = { hand: 1, wood: 2, stone: 3, copper: 4, steel: 6, weakMul: 2, bonkCd: 400, iframe: 800, lowSuit: 25 }
let suit = 100
let suitMax = 100
let lastBonk = 0
function suitTier() {
  const held = session && session.selectedItem ? session.selectedItem() : ''
  if (/steel/i.test(held)) return COMBAT_TUNING.steel
  if (/copper/i.test(held)) return COMBAT_TUNING.copper
  if (/stone/i.test(held)) return COMBAT_TUNING.stone
  if (/wood/i.test(held)) return COMBAT_TUNING.wood
  return COMBAT_TUNING.hand
}
function bonk() {
  if (performance.now() - lastBonk < COMBAT_TUNING.bonkCd) return 0
  lastBonk = performance.now()
  return suitTier()
}

function playerPos() {
  try { return noa.entities.getPosition(noa.playerEntity) } catch (e) { return null }
}
function combatTarget() {
  const pos = playerPos()
  if (!pos) return null
  if (inSafeZone(pos[0], pos[2])) return null
  if (!mobs || !mobs.list) return null
  const list = mobs.list()
  if (!list || !list.length) return null
  let best = null, bestD = 9
  const cam = noa.camera
  const heading = cam ? cam.heading : 0
  const fx = -Math.sin(heading), fz = -Math.cos(heading)
  for (const m of list) {
    const dx = m.x - pos[0], dz = m.z - pos[2]
    const d = Math.sqrt(dx * dx + dz * dz)
    if (d > 3 || d < 0.1) continue
    const dot = (dx * fx + dz * fz) / d
    if (dot > 0.5 && d < bestD) { best = m; bestD = d }
  }
  return best
}

function safeZoneFightTap() {
  const pos = playerPos()
  if (!pos || !inSafeZone(pos[0], pos[2])) return false
  if (!mobs || !mobs.list) return false
  const list = mobs.list()
  if (!list || !list.length) return false
  const cam = noa.camera
  const heading = cam ? cam.heading : 0
  const fx = -Math.sin(heading), fz = -Math.cos(heading)
  for (const m of list) {
    const dx = m.x - pos[0], dz = m.z - pos[2]
    const d = Math.sqrt(dx * dx + dz * dz)
    if (d > 16 || d < 0.1) continue
    const dot = (dx * fx + dz * fz) / d
    // 2.5.370: mobs stop about 10 blocks from town, so a tap aimed at a far mob explains too (never eats a block tap)
    if (dot > 0.5 && (d <= 3.2 || !noa.targetedBlock)) { showSafeChip(); return true }
  }
  return false
}
function doBonk() {
  try { if (combatRule && combatRule('combat') === 'off') return } catch (e) {}
  const pos = playerPos()
  if (!pos) return
  if (inSafeZone(pos[0], pos[2])) {
    showSafeChip()
    return
  }
  const mob = combatTarget()
  if (!mob) return
  const dmg = bonk()
  if (dmg > 0) showFloat('-' + dmg)
}
let lastSafeChip = 0
function safeChipLine(chip) {
  const zone = t('c1SafeZone') || 'Bertyville is a safe zone'
  if (chip && chip.dataset.safe === 'fight') return '🛡 ' + zone + ' — ' + (t('c1NoFightHere') || 'No fighting here')
  return '🛡 ' + zone
}
function showSafeChip() {
  const now = performance.now()
  if (now - lastSafeChip < 2000) return
  lastSafeChip = now
  const chip = ensureSafeChip()
  chip.dataset.safe = 'fight'
  chip.textContent = safeChipLine(chip)
  chip.hidden = false
  capLane()
  setTimeout(() => {
    if (!chip.isConnected) return
    if (chip.dataset.safe === 'fight') chip.dataset.safe = 'zone'
    paintSafeChip()
  }, 2000)
}

let lastSafe = false
function paintBonk() {
  const aimed = combatTarget()
  const touch = document.body.classList.contains('touch')
  const bonkBtn = document.getElementById('t-bonk')
  if (bonkBtn) bonkBtn.hidden = !(touch && aimed)
  const btn = document.getElementById('t-break')
  if (!btn) return
  if (aimed) {
    btn.textContent = t('c1Bonk') || 'Bonk'
    btn.setAttribute('aria-label', t('c1Bonk') || 'Bonk')
  } else {
    btn.textContent = t('break') || 'Break'
    btn.setAttribute('aria-label', t('break') || 'Break')
  }
}

function ensureLane() {
  let lane = document.getElementById('chip-lane')
  if (lane) return lane
  lane = document.createElement('div')
  lane.id = 'chip-lane'
  document.body.append(lane)
  if (window.MutationObserver) {
    new MutationObserver((recs) => {
      for (const rec of recs) {
        if (rec.target && rec.target.parentElement === lane) { capLane(); return }
      }
    }).observe(lane, { subtree: true, attributes: true, attributeFilter: ['hidden', 'class'] })
  }
  return lane
}
function laneAdd(el, prio) {
  if (!el) return
  const lane = ensureLane()
  el.dataset.prio = String(prio)
  el.style.position = ''
  el.style.left = ''
  el.style.right = ''
  el.style.top = ''
  el.style.bottom = ''
  el.style.transform = ''
  el.style.zIndex = ''
  let before = null
  for (const kid of lane.children) {
    if (kid === el) continue
    if (Number(kid.dataset.prio || 99) > prio) { before = kid; break }
  }
  if (before) lane.insertBefore(el, before)
  else if (el.parentElement !== lane) lane.append(el)
  else if (el !== lane.lastElementChild) lane.append(el)
  capLane()
}
function laneRelease(el) {
  if (!el) return
  const lane = document.getElementById('chip-lane')
  if (!lane || el.parentElement !== lane) return
  if (el.hasAttribute('data-wait')) el.removeAttribute('data-wait')
  document.body.append(el)
  capLane()
}
function capLane() {
  const lane = document.getElementById('chip-lane')
  if (!lane) return
  const cap = (window.innerWidth < 520 || window.innerHeight < 520) ? 3 : 4
  let n = 0
  for (const el of lane.children) {
    const fading = el.id === 'path-chip' && el.classList.contains('path-out')
    const off = el.hidden || el.style.display === 'none' || fading
    if (off) {
      if (el.hasAttribute('data-wait')) el.removeAttribute('data-wait')
      continue
    }
    n += 1
    if (n > cap) el.dataset.wait = '1'
    else if (el.hasAttribute('data-wait')) el.removeAttribute('data-wait')
  }
}
function layoutLane() {
  const lane = document.getElementById('chip-lane')
  if (!lane) return
  const box = (id) => {
    const node = document.getElementById(id)
    if (!node || node.hidden) return null
    const r = node.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return null
    return r
  }
  let left = 76
  let right = 12
  const bump = (r) => {
    if (!r) return
    const mid = (r.left + r.right) / 2
    if (mid < window.innerWidth / 2) left = Math.max(left, Math.round(r.right) + 8)
    else right = Math.max(right, Math.round(window.innerWidth - r.left) + 8)
  }
  bump(box('game-menu'))
  bump(box('pause-btn'))
  bump(box('fs-btn'))
  const play = box('play-chip')
  if (play) {
    const band = lane.getBoundingClientRect()
    const laneTop = band.top
    const laneBottom = Math.max(band.bottom, laneTop + 44)
    if (play.bottom > laneTop + 1 && play.top < laneBottom - 1) {
      const gap = 8
      const roomRight = (window.innerWidth - right) - (play.right + gap)
      const roomLeft = (play.left - gap) - left
      if (roomRight >= 120 || roomRight >= roomLeft) left = Math.max(left, Math.round(play.right) + gap)
      else right = Math.max(right, Math.round(window.innerWidth - play.left) + gap)
    }
  }
  lane.style.left = left + 'px'
  lane.style.right = right + 'px'
  capLane()
  seatToasts()
}
let seatingToasts = false
function shownBottom(node) {
  if (!node || node.hidden) return 0
  const cs = getComputedStyle(node)
  if (cs.display === 'none' || cs.visibility === 'hidden') return 0
  const r = node.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return 0
  if (r.bottom <= 0 || r.top >= window.innerHeight) return 0
  return r.bottom
}
function setImp(el, prop, value) {
  if (el.style.getPropertyValue(prop) === value && el.style.getPropertyPriority(prop) === 'important') return
  el.style.setProperty(prop, value, 'important')
}
// Toasts start 8px under the lowest of the top bar, the chip lane and the boss bar.
// The boss bar (lane z-index 26) paints above them (z-index 24).
function seatToasts() {
  if (seatingToasts) return
  const toast = document.getElementById('toast')
  const zap = document.getElementById('c2-zap')
  const up = (el) => !!(el && el.isConnected && !el.hidden && getComputedStyle(el).display !== 'none' && el.dataset.sheetDock !== '1')
  if (!up(toast) && !up(zap)) return
  seatingToasts = true
  try {
    const floor = Math.round(Math.max(
      shownBottom(document.querySelector('header.top')),
      shownBottom(document.getElementById('chip-lane')),
      shownBottom(document.getElementById('boss-bar'))
    ) + 8)
    let ceil = window.innerHeight - 8
    const hot = document.getElementById('hotbar')
    if (hot && !hot.hidden) {
      const hr = hot.getBoundingClientRect()
      if (hr.height > 8 && hr.top > 40) ceil = Math.min(ceil, hr.top - 8)
    }
    const wand = document.getElementById('wand-pill')
    if (wand && !wand.hidden) {
      const wr = wand.getBoundingClientRect()
      if (wr.height > 8 && wr.width > 8) ceil = Math.min(ceil, wr.top - 8)
    }
    for (const el of [toast, zap]) {
      if (!up(el)) continue
      setImp(el, 'position', 'fixed')
      setImp(el, 'left', '50%')
      setImp(el, 'right', 'auto')
      setImp(el, 'bottom', 'auto')
      setImp(el, 'transform', 'translateX(-50%)')
      setImp(el, 'margin', '0')
      setImp(el, 'z-index', '24')
      setImp(el, 'max-width', 'min(420px, calc(100vw - 16px))')
      setImp(el, 'top', floor + 'px')
      const key = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120)
      if (el.dataset.toastKey !== key) {
        el.dataset.toastKey = key
        el.classList.remove('toast-one')
        delete el.dataset.toastH
        if (el.dataset.toastCut === '1') {
          el.removeAttribute('aria-label')
          el.dataset.toastCut = ''
        }
      }
      let r = el.getBoundingClientRect()
      const gap = ceil - floor
      const natural = Number(el.dataset.toastH || 0)
      if (el.classList.contains('toast-one') && natural && gap >= natural + 1) {
        el.classList.remove('toast-one')
        delete el.dataset.toastH
        if (el.dataset.toastCut === '1') {
          el.removeAttribute('aria-label')
          el.dataset.toastCut = ''
        }
        r = el.getBoundingClientRect()
      }
      if (!el.classList.contains('toast-one') && r.bottom > ceil + 0.5) {
        el.dataset.toastH = String(Math.ceil(r.height))
        el.classList.add('toast-one')
        const full = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim()
        if (full) {
          el.setAttribute('aria-label', full)
          el.dataset.toastCut = '1'
        }
        r = el.getBoundingClientRect()
        if (r.bottom > ceil + 0.5) setImp(el, 'top', Math.max(floor, Math.round(ceil - r.height)) + 'px')
      }
    }
  } finally {
    seatingToasts = false
  }
}
function watchToasts() {
  if (watchToasts.armed || !window.MutationObserver) return
  watchToasts.armed = true
  let arm = 0
  const queue = () => {
    if (arm || seatingToasts) return
    arm = requestAnimationFrame(() => { arm = 0; seatToasts() })
  }
  const mo = new MutationObserver(() => {
    const zap = document.getElementById('c2-zap')
    if (zap && !zap.dataset.toastWatch) {
      zap.dataset.toastWatch = '1'
      mo.observe(zap, { attributes: true, attributeFilter: ['style', 'class', 'hidden'], childList: true })
    }
    queue()
  })
  const toast = document.getElementById('toast')
  if (toast) mo.observe(toast, { attributes: true, attributeFilter: ['style', 'class', 'hidden'], childList: true })
  mo.observe(document.body, { childList: true })
  const lane = document.getElementById('chip-lane')
  if (lane) mo.observe(lane, { attributes: true, subtree: true, attributeFilter: ['style', 'class', 'hidden'] })
  window.addEventListener('resize', queue)
}
function ensureSafeChip() {
  let chip = document.getElementById('safe-chip')
  if (!chip) {
    chip = document.createElement('div')
    chip.id = 'safe-chip'
    chip.setAttribute('role', 'status')
    chip.style.cssText = 'background:#0f766e;color:#fff;padding:6px 12px;border-radius:8px;font-size:14px;font-weight:700;min-height:32px;display:flex;align-items:center;gap:6px;max-width:100%;box-sizing:border-box'
    chip.hidden = true
    laneAdd(chip, 7)
  }
  return chip
}
function paintSafeChip() {
  const chip = ensureSafeChip()
  const pos = playerPos()
  if (!pos) {
    if (!chip.hidden) chip.textContent = safeChipLine(chip)
    return
  }
  const now = inSafeZone(pos[0], pos[2])
  if (now) {
    if (chip.hidden && chip.dataset.safe !== 'fight') chip.dataset.safe = 'zone'
    chip.textContent = safeChipLine(chip)
    chip.hidden = false
  } else if (!chip.hidden) {
    chip.hidden = true
    chip.dataset.safe = ''
  }
}
function checkSafeEntry() {
  const pos = playerPos()
  if (!pos) return
  const now = inSafeZone(pos[0], pos[2])
  lastSafe = now
  paintSafeChip()
}
function showFloat(text) {
  const el = document.createElement('div')
  el.textContent = text
  el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translateX(-50%);color:#fbbf24;font-size:24px;font-weight:700;z-index:40;pointer-events:none'
  document.body.append(el)
  setTimeout(() => el.remove(), 600)
}
function paintSuit() {
  const text = document.getElementById('suit-text')
  const fill = document.getElementById('suit-fill')
  const low = suit < COMBAT_TUNING.lowSuit
  if (text) {
    const base = (t('suitText') || 'Suit {n}/{max}').replace('{n}', suit).replace('{max}', suitMax)
    text.textContent = low ? base + ' ' + (t('c1Low') || 'Low') : base
  }
  if (fill) {
    fill.style.width = Math.max(4, (suit / suitMax) * 60) + 'px'
    fill.style.outline = low ? '2px dashed #f59e0b' : 'none'
    fill.style.animation = low && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'pulse 1s infinite' : 'none'
  }
}
function bonked() {
  suit = suitMax
  paintSuit()
  const card = document.createElement('div')
  card.id = 'bonked-card'
  card.style.cssText = 'position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:rgba(11,18,32,.9)'
  const title = t('c1Bonked') || 'Bonked! Your stuff is safe'
  const btnText = t('c1BackToBed') || 'Back to bed'
  card.innerHTML = '<div style="background:#111a2e;border:1px solid #22304d;border-radius:14px;padding:20px;text-align:center"><b>' + title + '</b><button id="bonked-back" style="min-width:44px;min-height:44px;margin-top:12px">' + btnText + '</button></div>'
  document.body.append(card)
  const btn = document.getElementById('bonked-back')
  const done = () => { card.remove(); if (typeof goHome === 'function') goHome() }
  if (btn) { btn.focus(); btn.addEventListener('click', done) }
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === 'Escape') done() })
  setTimeout(done, 5000)
}
function guardTest() {
  const staff = window.kwTest && window.kwTest.on && window.kwTest.on()
  if (!staff) {
    document.querySelectorAll('script[src*="kw-test"]').forEach((s) => s.remove())
    document.querySelectorAll('[id*="kw-test"]').forEach((n) => n.remove())
    try { delete window.KulibertTest } catch (e) {}
    try { delete window.KWTest } catch (e) {}
  }
}
guardTest()
const LOW_FPS = location.search.includes('lowfps=1')
window.__auto = { log: [] }
if (LOW_FPS && AUTO && gfxLook.managed) gfxLook.autoName('fancy')

function normLang(code) {
  const raw = String(code || '').trim()
  if (!raw) return ''
  if (raw === 'simple') return 'simple'
  if (raw === 'fa' || /^fa[-_]/i.test(raw)) return STR['fa-AF'] ? 'fa-AF' : ''
  if (STR[raw]) return raw
  const base = raw.toLowerCase().split(/[-_]/)[0]
  if (base === 'fa') return STR['fa-AF'] ? 'fa-AF' : ''
  return STR[base] ? base : ''
}
function readBag(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') } catch (e) { return null }
}
function classLanguage() {
  const q = normLang(qs.get("classlang") || '')
  if (q) return q
  const prefs = readBag('kulibert-prefs-v1')
  if (prefs && typeof prefs === 'object') {
    const hit = normLang(prefs.classLang || prefs.roomLang || prefs.teacherLang || '')
    if (hit) return hit
  }
  for (const key of ['bloxbert-class-lang', 'kulibert-class-lang', 'tech-room-lang']) {
    try {
      const v = localStorage.getItem(key)
      if (!v) continue
      const parsed = (v[0] === '{' || v[0] === '"') ? JSON.parse(v) : v
      const hit = normLang(typeof parsed === 'string' ? parsed : (parsed && parsed.lang))
      if (hit) return hit
    } catch (e) {}
  }
  return ''
}
function hubLanguage() {
  const prefs = readBag('kulibert-prefs-v1')
  if (!prefs || typeof prefs !== 'object') return ''
  return normLang(prefs.lang)
}
function kidLanguage() {
  const hub = hubLanguage()
  if (hub) {
    try {
      if (localStorage.getItem('bloxbert-lang') !== hub) localStorage.setItem('bloxbert-lang', hub)
    } catch (e) {}
    return hub
  }
  try {
    const saved = normLang(localStorage.getItem('bloxbert-lang') || '')
    if (saved) return saved
  } catch (e) {}
  return normLang(qs.get('lang') || '')
}
function browserLanguage() {
  let list = []
  try { list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ''] } catch (e) {}
  for (const item of list) {
    const hit = normLang(item)
    if (hit) return hit
  }
  return ''
}
function saveKidLang(code) {
  const hit = normLang(code)
  if (!hit) return
  try { localStorage.setItem('bloxbert-lang', hit) } catch (e) {}
  try {
    const prefs = readBag('kulibert-prefs-v1')
    const bag = prefs && typeof prefs === 'object' ? prefs : {}
    bag.lang = hit
    if (!bag.v) bag.v = 1
    localStorage.setItem('kulibert-prefs-v1', JSON.stringify(bag))
  } catch (e) {}
}
const kidLang = kidLanguage()
let LANG = classLanguage() || kidLang || browserLanguage() || 'en'
document.addEventListener('click', (e) => {
  const btn = e.target && e.target.closest && e.target.closest('.kb-drawer-langs button')
  if (!btn) return
  const raw = btn.getAttribute('lang') || ''
  const hit = normLang(raw === 'fa' ? 'fa-AF' : raw)
  if (!hit) return
  saveKidLang(hit)
  LANG = hit
  applyI18n()
})
window.addEventListener('storage', (e) => {
  if (!e || e.key !== 'kulibert-prefs-v1') return
  let bag = null
  try { bag = e.newValue ? JSON.parse(e.newValue) : null } catch (err) { return }
  const hit = bag && typeof bag === 'object' ? normLang(bag.lang) : ''
  if (!hit) return
  if (classLanguage()) {
    try {
      if (localStorage.getItem('bloxbert-lang') !== hit) localStorage.setItem('bloxbert-lang', hit)
    } catch (err) {}
    return
  }
  saveKidLang(hit)
  LANG = hit
  applyI18n()
})
let freshDropDate = ''
function t(key) {
  if (key === 'confirmFresh' && freshDropDate) return t('confirmFreshFull').replace('{date}', freshDropDate)
  const hit = (EXTRA[LANG] && EXTRA[LANG][key]) || (STR[LANG] && STR[LANG][key]) || (EXTRA.en && EXTRA.en[key]) || (STR.en && STR.en[key])
  if (!hit) { console.warn('missing string', key); return EXTRA.en[key] || key }
  return hit
}
function tintIco(canvas, hex) {
  const g = canvas.getContext('2d')
  if (!g) return
  const img = g.getImageData(0, 0, canvas.width, canvas.height)
  const r = parseInt(hex.slice(1, 3), 16)
  const gv = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  for (let i = 0; i < img.data.length; i += 4) {
    if (!img.data[i + 3]) continue
    img.data[i] = r
    img.data[i + 1] = gv
    img.data[i + 2] = b
  }
  g.putImageData(img, 0, 0)
}
function fillIco(root) {
  if (!root || !root.querySelectorAll) return
  for (const el of root.querySelectorAll('[data-ico]')) {
    const pic = menuIcon(el.dataset.ico)
    el.replaceChildren()
    if (!pic) continue
    if (el.closest && el.closest('#sheet-back')) tintIco(pic, '#E6EEF2')
    el.append(pic)
  }
}
function paintBackTab() {
  const back = document.getElementById('sheet-back')
  if (!back) return
  const word = t('backMenu')
  back.setAttribute('aria-label', word)
  const lab = back.querySelector('.back-lab')
  if (lab) lab.textContent = word
  const ico = back.querySelector('[data-ico]')
  if (ico) ico.dataset.ico = 'menu'
  fillIco(back)
}
function dressTop() {
  const name = document.querySelector('.brand .tb-name')
  if (name && !name.dataset.pix) {
    name.dataset.pix = '1'
    name.before(menuPlate())
    name.classList.add('kd-sr')
  }
  for (const [id, icon] of [['undo-btn', 'undo'], ['redo-btn', 'redo'], ['save-btn', 'floppy'], ['hub-back', 'home']]) {
    const btn = document.getElementById(id)
    const ti = btn && btn.querySelector('.ti')
    if (!ti || ti.dataset.pix) continue
    ti.dataset.pix = '1'
    ti.textContent = ''
    const pic = menuIcon(icon)
    if (pic) ti.append(pic)
    if (btn) btn.title = btn.getAttribute('aria-label') || ''
  }
  fillIco(document)
}
function i18nKey(el) {
  const name = el.dataset.i18n
  if (!TOUCH_UI) return name
  if (name === 'keysHint') return 'keysHintTouch'
  if (name === 'keysLine') return 'keysLineTouch'
  return name
}
var walletReady = false
var dressingWallet = false
function kidSignedIn() {
  try {
    const who = window.KulibertWho
    if (!who || typeof who.active !== 'function' || !who.active()) return false
    const row = typeof who.read === 'function' ? who.read() : null
    return !!(row && row.alias)
  } catch (e) { return false }
}
function cogOpen() {
  const card = document.getElementById('cog-card')
  return !!(card && !card.hidden)
}
function todayEarned() {
  if (!walletReady || !session || !session.wallet) return 0
  const ledger = session.wallet.state && session.wallet.state.ledger
  const row = dayCap(ledger, Date.now(), 'quest')
  return row && typeof row.earned === 'number' ? row.earned : 0
}
function bronzeTotal() {
  if (!walletReady || !session || !session.wallet) return 0
  const n = session.wallet.balance('bronze')
  return typeof n === 'number' ? n : 0
}
function paintCogCard() {
  const card = document.getElementById('cog-card')
  if (!card) return
  const title = card.querySelector('[data-cog="title"]')
  const hard = card.querySelector('[data-cog="hard"]')
  const today = card.querySelector('[data-cog="today"]')
  const earn = card.querySelector('[data-cog="earn"]')
  const total = card.querySelector('[data-cog="total"]')
  const stay = card.querySelector('[data-cog="stay"]')
  const x = card.querySelector('.cog-x')
  const ok = card.querySelector('.cog-ok')
  if (title) title.textContent = t('cogBronze')
  if (hard) hard.textContent = t('cogHard')
  if (total) total.textContent = t('cogTotal').replace('{n}', String(bronzeTotal()))
  if (today) today.textContent = t('cogToday').replace('{n}', String(todayEarned()))
  if (earn) earn.textContent = t('cogEarn')
  if (stay) {
    stay.hidden = !!kidSignedIn()
    stay.textContent = t('cogStay')
  }
  if (x) x.setAttribute('aria-label', t('close'))
  if (ok) {
    ok.textContent = t('cogOk')
    ok.setAttribute('aria-label', t('cogOk'))
  }
}
function ensureCogStyle() {
  if (document.getElementById('cog-card-css')) return
  const s = document.createElement('style')
  s.id = 'cog-card-css'
  s.textContent = '#cog-card{position:fixed;inset:0;z-index:80;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,.55);padding:12px;box-sizing:border-box}#cog-card[hidden]{display:none!important}#cog-card .card{position:relative;width:min(420px,100%);box-sizing:border-box;background:#0E1A22;color:#E6EEF2;border:1px solid #1F8A8A;border-radius:16px;padding:16px 16px 14px}#cog-card h2{margin:0;margin-inline-end:48px;margin-bottom:8px;font-size:1.25rem;font-weight:800}#cog-card p{margin:0 0 8px;font-size:15px;line-height:1.4}#cog-card .cog-x{position:absolute;top:8px;inset-inline-end:8px;min-width:44px;min-height:44px;width:44px;height:44px}#wallet-chip .metal-mini{display:inline-flex;align-items:center;gap:4px;margin-inline-start:6px}#wallet-chip .metal-mini .gic,#wallet-chip > .gic{width:16px;height:16px;display:flex;flex:0 0 16px}html body .kb-bar #wallet-chip{position:relative!important;z-index:4!important}#cog-card h2{display:flex;align-items:center;gap:8px}#cog-card h2 .gic{width:28px;height:28px;display:flex;flex:0 0 28px}#cog-card .card{max-height:calc(100vh - 24px);overflow:auto}#cog-card .cog-ok{display:inline-flex;align-items:center;justify-content:center;min-width:44px;min-height:44px;margin-top:4px;padding:0 18px;border-radius:10px;border:1px solid #1F8A8A;background:#145e56;color:#E6EEF2;font:800 16px/1 system-ui,sans-serif}'
  document.head.append(s)
}
function metalMini(metal, n) {
  const s = document.createElement('span')
  s.className = 'metal-mini'
  s.dataset.metal = metal
  const g = document.createElement('span')
  g.className = 'gic'
  g.dataset.ico = metal === 'gold' ? 'cogGold' : 'cogSilver'
  g.setAttribute('aria-hidden', 'true')
  const pic = menuIcon(g.dataset.ico)
  if (pic) g.append(pic)
  const b = document.createElement('bd' + 'i')
  b.textContent = n + ' ' + t(metal === 'gold' ? 'cogGold' : 'cogSilver')
  s.append(g, b)
  return s
}
function dressWalletChip() {
  const el = document.getElementById('wallet-chip')
  if (!el || !session || !session.wallet) return
  if (el.dataset.cogHold === '1') {
    el.hidden = true
    if (el.childNodes.length) el.replaceChildren()
    return
  }
  if (!walletReady || dressingWallet) return
  el.hidden = false
  const n = session.wallet.balance('bronze')
  const bals = session.wallet.balances()
  const word = t('practice')
  const want = n + ' ' + word
  const silverOn = (bals.silver || 0) > 0
  const goldOn = (bals.gold || 0) > 0
  const mainIco = el.querySelector(':scope > .gic')
  const mainBdi = el.querySelector(':scope > bdi')
  const ok = !!(mainIco && mainIco.dataset.ico === 'cog' && mainIco.querySelector('canvas')
    && mainBdi && mainBdi.textContent === want
    && !!el.querySelector(':scope > .metal-mini[data-metal="silver"]') === silverOn
    && !!el.querySelector(':scope > .metal-mini[data-metal="gold"]') === goldOn)
  if (!ok) {
    dressingWallet = true
    const g = document.createElement('span')
    g.className = 'gic'
    g.dataset.ico = 'cog'
    g.setAttribute('aria-hidden', 'true')
    const pic = menuIcon('cog')
    if (pic) g.append(pic)
    const b = document.createElement('bd' + 'i')
    b.textContent = want
    el.replaceChildren(g, b)
    if (silverOn) el.append(metalMini('silver', bals.silver))
    if (goldOn) el.append(metalMini('gold', bals.gold))
    dressingWallet = false
  }
  el.title = t('practiceTip')
  el.setAttribute('aria-label', t('cogBronze') + ', ' + want)
  if (cogOpen()) paintCogCard()
}
function releaseWalletChip() {
  const el = document.getElementById('wallet-chip')
  if (el) {
    delete el.dataset.cogHold
    el.dataset.cogReady = '1'
  }
  walletReady = true
  watchWalletChip()
  if (session && session.paintChip) session.paintChip()
  dressWalletChip()
}
function watchWalletChip() {
  const el = document.getElementById('wallet-chip')
  if (!el || el.dataset.cogWatch) return
  el.dataset.cogWatch = '1'
  new MutationObserver(() => {
    if (dressingWallet) return
    dressWalletChip()
  }).observe(el, { childList: true, characterData: true, subtree: true })
}
function closeCogCard() {
  const card = document.getElementById('cog-card')
  if (card) card.hidden = true
  cardClosedAt = performance.now()
  const chip = document.getElementById('wallet-chip')
  if (chip) chip.focus()
}
function openCogCard() {
  ensureCogStyle()
  let card = document.getElementById('cog-card')
  if (!card) {
    card = document.createElement('div')
    card.id = 'cog-card'
    card.hidden = true
    card.setAttribute('role', 'dialog')
    card.setAttribute('aria-modal', 'true')
    card.setAttribute('aria-labelledby', 'cog-card-title')
    card.innerHTML = '<div class="card"><button type="button" class="icon-btn cog-x" aria-label="Close"><span class="ti" data-ico="x"></span></button><h2 id="cog-card-title"><span class="gic" data-ico="cog" aria-hidden="true"></span><span data-cog="title"></span></h2><p data-cog="total"></p><p data-cog="hard"></p><p data-cog="today"></p><p data-cog="earn"></p><p data-cog="stay" hidden></p><button type="button" class="cog-ok"></button></div>'
    document.body.append(card)
    fillIco(card)
    card.querySelector('.cog-x').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeCogCard() })
    card.querySelector('.cog-ok').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); closeCogCard() })
    card.addEventListener('click', (e) => { if (e.target === card) closeCogCard() })
  }
  paintCogCard()
  card.hidden = false
  const x = card.querySelector('.cog-x')
  if (x) x.focus()
}
function applyI18n() {
  ensureCogStyle()
  painting = true
  document.documentElement.lang = LANG
  if (LANG === 'ar' || LANG === 'fa-AF') document.documentElement.dir = 'rtl'
  else document.documentElement.dir = 'ltr'
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = i18nKey(el)
    el.textContent = t(key)
  }
  for (const el of document.querySelectorAll('[data-i18n-label]')) el.setAttribute('aria-label', t(el.dataset.i18nLabel))
  for (const el of document.querySelectorAll('[data-i18n-title]')) el.setAttribute('title', t(el.dataset.i18nTitle))
  for (const el of document.querySelectorAll('[data-bt-label]')) el.setAttribute('aria-label', t(el.dataset.btLabel))
  for (const el of document.querySelectorAll('[data-bt-title]')) el.setAttribute('title', t(el.dataset.btTitle))
  const plate = document.getElementById('ver-plate')
  if (plate) plate.textContent = VERSION
  document.title = 'Bertopia ' + VERSION
  const aboutPlate = document.getElementById('about-plate')
  if (aboutPlate) aboutPlate.textContent = VERSION
  const pick = document.getElementById('pick-chip')
  if (pick && pick.dataset.ready) paintPick()
  dressTop()
  paintBackTab()
  try { paintModeChip() } catch (e) {}
  if (lookReady) paintViewChip()
  repaintLiveNotes()
  paintHeldHeader()
  try { paintSuit() } catch (e) {}
  try { paintUpdateChip() } catch (e) {}
  if (walletReady) dressWalletChip()
  if (cogOpen()) paintCogCard()
  try { paintMenuLabels() } catch (e) {}
  painting = false
}
function paintMenuLabels() {
  const drawer = document.getElementById('drawer')
  if (drawer) {
    const name = t('drawerName')
    if (name && name !== 'drawerName') {
      drawer.setAttribute('aria-label', name)
      if (drawer.hasAttribute('title')) drawer.setAttribute('title', name)
    }
  }
  const word = t('menu')
  if (!word || word === 'menu') return
  for (const id of ['game-menu', 'menu-btn']) {
    const el = document.getElementById(id)
    if (!el) continue
    el.setAttribute('aria-label', word)
    el.title = word
  }
  const bar = document.querySelector('.kb-bar .kb-menu')
  if (!bar) return
  bar.setAttribute('aria-label', word)
  bar.title = word
  if (!bar.childElementCount) {
    const lead = (bar.textContent || '').indexOf('\u2630') !== -1 ? '\u2630 ' : ''
    bar.textContent = lead + word
  }
}
let heldHeaderOn = false
function paintHeldHeader() {
  if (!heldHeaderOn) return
  const el = document.getElementById('current')
  let word = t('emptySlot')
  const survival = !!(session && session.mode === 'survival')
  if (survival) {
    const held = session.selectedItem && session.selectedItem()
    word = held ? ((held === 'buildWand' && t('wandShort')) || t(held)) : t('emptySlot')
    try { if (session.paintHotbar) session.paintHotbar() } catch (e) {}
  } else if (wandSlot) word = t('wandShort') || t('buildWand')
  else word = blockName(current)
  if (el) el.textContent = word
  const flash = document.getElementById('held-chip')
  if (flash && !flash.hidden && flash.dataset.hold !== '1') flash.textContent = word
  if (!survival) {
    const nameEl = document.querySelector('#hotbar .hot-name')
    if (nameEl) nameEl.textContent = word
    for (const b of document.querySelectorAll('#hotbar .slot[data-id]')) {
      const id = Number(b.dataset.id)
      if (Number.isFinite(id)) b.setAttribute('aria-label', blockName(id))
    }
  }
}
let liveNotesReady = false
function refreshSaveChip() {
  const el = document.getElementById('save-chip')
  if (!el || el.hidden) return
  const saved = el.dataset.state === 'saved' || el.dataset.state === 'synced' || el.dataset.state === 'offline'
  const word = saved ? t('saved') : t('s2bSaving')
  const lab = el.querySelector('.sc-word')
  if (lab) lab.textContent = word
  el.setAttribute('aria-label', word)
}
function refreshUsePill() {
  const el = document.getElementById('use-pill')
  if (!el || el.hidden || !useTarget || !useTarget.verb) return
  const word = t(useTarget.verb)
  const lab = el.querySelector('.glbl')
  if (lab) lab.textContent = word
  el.setAttribute('aria-label', word)
}
function refreshPathChip() {
  const el = document.getElementById('path-chip')
  if (!el || el.hidden) return
  paintPath()
}
function repaintLiveNotes() {
  if (!liveNotesReady) return
  try { paintSafeChip() } catch (e) {}
  try { refreshSaveChip() } catch (e) {}
  try { refreshPathChip() } catch (e) {}
  try { refreshUsePill() } catch (e) {}
}
let painting = false
let lookReady = false
let langArm = 0
function langDrifted() {
  if (document.documentElement.lang !== LANG) return true
  for (const el of document.querySelectorAll('[data-i18n]')) {
    const key = i18nKey(el)
    if (el.textContent !== t(key)) return true
  }
  return false
}
function defendLang() {
  if (painting || !langDrifted()) return
  applyI18n()
}
new MutationObserver((records) => {
  if (painting || langArm) return
  for (const rec of records) {
    const node = rec.target
    const el = node && node.nodeType === 1 ? node : node && node.parentElement
    if (!el || !el.closest) continue
    if (el === document.documentElement || el.closest('[data-i18n]')) {
      langArm = requestAnimationFrame(() => { langArm = 0; defendLang() })
      return
    }
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['lang', 'dir'], subtree: true, childList: true, characterData: true })
applyI18n()
pinKeysLine()

let walkPresses = 0
const KEYS_SEEN = 'bert-keys-tip-seen'
const TOUCH_ONLY = matchMedia('(hover: none) and (pointer: coarse)').matches || qs.has('touch')
let keysGone = false
function keysStored() {
  try { return localStorage.getItem(KEYS_SEEN) === '1' } catch (e) { return false }
}
function hideKeysTip(remember) {
  const chip = document.getElementById('keys-chip')
  const pop = document.getElementById('keys-pop')
  if (chip) chip.hidden = true
  if (pop) pop.hidden = true
  if (!remember) return
  keysGone = true
  try { localStorage.setItem(KEYS_SEEN, '1') } catch (e) {}
}
function fadeKeys() {
  if (keysGone) return
  hideKeysTip(true)
}
function showKeysAgain() {
  const chip = document.getElementById('keys-chip')
  const pop = document.getElementById('keys-pop')
  if (chip) {
    chip.hidden = false
    chip.setAttribute('aria-expanded', 'true')
  }
  if (pop) pop.hidden = false
  pinKeysLine()
}
if (TOUCH_ONLY) hideKeysTip(false)
else if (keysStored()) hideKeysTip(false)
else setTimeout(() => { if (!keysGone) fadeKeys() }, 8000)
document.addEventListener('keydown', (e) => {
  if (e.repeat) return
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
  if (!typing && (e.key === '?' || (e.shiftKey && e.code === 'Slash'))) {
    e.preventDefault()
    showKeysAgain()
    return
  }
  if (TOUCH_ONLY || typing) return
  const code = e.code
  if (code !== 'KeyW' && code !== 'KeyA' && code !== 'KeyS' && code !== 'KeyD' && code !== 'ArrowUp' && code !== 'ArrowDown' && code !== 'ArrowLeft' && code !== 'ArrowRight') return
  walkPresses += 1
  fadeKeys()
}, true)

function pinKeysLine() {
  const el = document.querySelector('body > .keys')
  if (!el || el.hidden || el.dataset.gone === '1') return
  const sheet = document.getElementById('sheet')
  if (sheet && !sheet.hidden) return
  pinAboveBar(el)
}
function bindKeysChip() {
  const btn = document.getElementById('keys-chip')
  const pop = document.getElementById('keys-pop')
  if (!btn || !pop || btn.dataset.bound) return
  btn.dataset.bound = '1'
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    const open = pop.hidden
    pop.hidden = !open
    btn.setAttribute('aria-expanded', open ? 'true' : 'false')
    pinKeysLine()
  })
}
bindKeysChip()
function paintViewChip() {
  const word = document.getElementById('view-chip-word')
  const btn = document.getElementById('view-chip')
  if (!word || !btn) return
  const label = TOUCH_UI
    ? (t('cameraView') + ': ' + (camBehind ? t('camBehind') : t('camClose')))
    : t('viewKey')
  word.textContent = label
  btn.setAttribute('aria-label', label)
  btn.setAttribute('aria-pressed', camBehind ? 'true' : 'false')
}
function bindViewChip() {
  const btn = document.getElementById('view-chip')
  if (!btn || btn.dataset.bound) return
  btn.dataset.bound = '1'
  btn.addEventListener('pointerdown', (e) => { e.stopPropagation() })
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    camBehind = !camBehind
    applyLook()
  })
}
bindViewChip()
window.addEventListener('resize', () => pinKeysLine())
requestAnimationFrame(() => pinKeysLine())
setTimeout(pinKeysLine, 400)
setTimeout(pinKeysLine, 1200)

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
  digChipUntil = performance.now() + 3000
  digChipTimer = setTimeout(() => {
    digChipTimer = 0
    if (gen !== digChipGen) return
    const chip = document.getElementById('dig-chip')
    if (!chip || chip.hidden) return
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const gone = () => { chip.hidden = true; chip.style.removeProperty('opacity'); chip.style.removeProperty('transition'); digChipUntil = 0 }
    if (reduce) { gone(); return }
    chip.style.setProperty('transition', 'opacity .35s linear', 'important')
    chip.style.setProperty('opacity', '0', 'important')
    digChipTimer = setTimeout(() => {
      digChipTimer = 0
      if (gen !== digChipGen) return
      gone()
    }, 360)
  }, 3000)
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
    chip.className = 'tb-lcd'
    chip.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%) translateZ(0);z-index:42;'
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
  pinAboveBar(chip)
  requestAnimationFrame(() => { if (chip.isConnected && !chip.hidden) pinAboveBar(chip) })
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
  if (protectTold && now - protectTold < 10000) return
  protectTold = now
  toast(t('areaHint'))
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
  const ico = document.createElement('span')
  ico.className = 'gic'
  const flag = menuIcon('flag')
  if (flag) ico.append(flag)
  const lab = document.createElement('span')
  lab.className = 'glbl'
  setBtn.append(ico, lab)
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
  clearColor: [0.70, 0.80, 0.86],
  useAO: gfxLook.ao,
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
let lookSens = 0.6
let lookInvert = false
let autoClimb = typeof matchMedia === 'function' && matchMedia('(pointer:coarse)').matches
let wideView = false
let showHand = true
let mainHand = 'right'
let camBehind = false
let allCaps = false
let dyslexiaFont = false
let suitId = 'berty'
try {
  const savedLook = JSON.parse(localStorage.getItem(LOOK_KEY) || '{}')
  if (savedLook.cv >= 3 && savedLook.sens >= 0.5 && savedLook.sens <= 2) lookSens = savedLook.sens
  lookInvert = !!savedLook.invert
  wideView = !!savedLook.wide
  if (savedLook.cv >= 2 && typeof savedLook.climb === 'boolean') autoClimb = savedLook.climb
  if (savedLook.hand === false) showHand = false
  if (savedLook.mainHand === 'left') mainHand = 'left'
  if (savedLook.cam === 'behind') camBehind = true
  if (savedLook.allCaps === true) allCaps = true
  if (savedLook.dyslexia === true) dyslexiaFont = true
  if (savedLook.suit === 'clay' || savedLook.suit === 'bearcat' || savedLook.suit === 'grove' || savedLook.suit === 'snow') suitId = savedLook.suit
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
              'vec2 crispF = fract(vDiffuseUV); baseColor = texture(atlasTexture, vec3((crispF * ' + (window.__bertTexCore || 32) + '.0 + 2.0) / ' + ((window.__bertTexCore || 32) + 4) + '.0, texAtlasIndex));'
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
window.__bertTexCore = smallTextures() ? 32 : 64
installPacks(noa, gfxLook)
noa.registry.registerMaterial('glass', { textureURL: 'assets/glass.png', texHasAlpha: true })
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
const copperD = dye('shape-copper', 0.78, 0.42, 0.16)
const copperOn = dye('shape-copper-on', 0.25, 0.9, 0.95)
copperOn.emissiveColor = new Color3(0.15, 0.75, 0.85)
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
const waterDye = dye('shape-water', 0.16, 0.42, 0.78, 0.55)
waterDye.backFaceCulling = true
Effect.ShadersStore.bertWaterVertexShader = 'precision highp float;attribute vec3 position;attribute vec3 normal;uniform mat4 worldViewProjection;varying vec3 vN;void main(){vN=normal;gl_Position=worldViewProjection*vec4(position,1.0);}'
Effect.ShadersStore.bertWaterFragmentShader = 'precision highp float;varying vec3 vN;void main(){float up=clamp(normalize(vN).y,0.0,1.0);vec3 deep=vec3(0.04,0.16,0.34);vec3 body=vec3(0.10,0.34,0.56);vec3 skin=vec3(0.42,0.68,0.78);vec3 col=mix(deep,body,0.6);col=mix(col,skin,smoothstep(0.22,0.9,up));float a=mix(0.66,0.44,up);gl_FragColor=vec4(col,a);}'
const waterMat = new ShaderMaterial('bert-water', shapeScene, { vertex: 'bertWater', fragment: 'bertWater' }, { attributes: ['position', 'normal'], uniforms: ['worldViewProjection'] })
waterMat.alpha = 0.55
waterMat.backFaceCulling = false
waterMat.transparencyMode = 2
noa.registry.registerMaterial('bertWater', { renderMaterial: waterMat })
function waterMesh() {
  return shape('water', [part('w', 0.98, 0.98, 0.98, 0, 0.5, 0, 0, waterDye)], waterDye)
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
  return crossCut('tuft', plantMat('tuft', null), 0.42, 0.48)
}
const floraMeshes = {}
function rgbCss(r, g, b) {
  return 'rgb(' + ((r * 255) | 0) + ',' + ((g * 255) | 0) + ',' + ((b * 255) | 0) + ')'
}
function plantMat(name, spec) {
  const c = document.createElement('canvas')
  c.width = c.height = 32
  const g = c.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = false
  g.clearRect(0, 0, 32, 32)
  const stem = spec ? '#2f6b28' : '#3e7a2c'
  const mid = spec ? '#5ea832' : '#245018'
  const tip = '#1e4a28'
  const blade = (x, y0, h, col, w) => { g.fillStyle = col; g.fillRect(x, y0, w || 2, h) }
  blade(11, 12, 18, stem, 2)
  blade(15, 6, 24, mid, 2)
  blade(19, 14, 16, tip, 2)
  blade(14, 9, 8, '#5ea832', 2)
  if (spec && spec[3] != null) {
    g.fillStyle = rgbCss(spec[0], spec[1], spec[2])
    g.fillRect(11, 3, 10, 8)
    g.fillRect(13, 1, 6, 12)
    g.fillStyle = rgbCss(spec[3], spec[4], spec[5])
    g.fillRect(14, 5, 4, 4)
  }
  const tex = new DynamicTexture('plant-' + name, c, shapeScene, false, Texture.NEAREST_SAMPLINGMODE)
  tex.hasAlpha = true
  tex.update()
  const mat = noa.rendering.makeStandardMaterial('plant-' + name)
  mat.diffuseTexture = tex
  mat.emissiveTexture = tex
  mat.useAlphaFromDiffuseTexture = true
  mat.transparencyMode = 1
  mat.alphaCutOff = 0.5
  mat.alpha = 1
  mat.backFaceCulling = false
  mat.specularColor = new Color3(0, 0, 0)
  mat.emissiveColor = new Color3(0.55, 0.55, 0.5)
  mat.diffuseColor = new Color3(0.85, 0.9, 0.8)
  return mat
}
function crossCut(name, mat, w, h) {
  const parts = []
  for (let i = 0; i < 2; i++) {
    const mesh = CreatePlane(name + '-' + i, { width: w, height: h }, shapeScene)
    mesh.material = mat
    mesh.position.set(0, h * 0.5, 0)
    mesh.rotation.y = i * Math.PI * 0.5
    mesh.bakeCurrentTransformIntoVertices()
    mesh.position.set(0, 0, 0)
    mesh.rotation.set(0, 0, 0)
    mesh.isPickable = false
    parts.push(mesh)
  }
  const mesh = Mesh.MergeMeshes(parts, true, true, undefined, false, false)
  mesh.name = name
  mesh.material = mat
  mesh.isPickable = false
  mesh.isVisible = false
  mesh.thinInstanceAllowAutomaticStaticBufferRecreation = true
  return mesh
}
function floraMesh(name, spec) {
  if (floraMeshes[name]) return floraMeshes[name]
  const h = spec[6] || 0.7
  const w = spec[7] || 0.46
  const mesh = crossCut('flora-' + name, plantMat(name, spec), w, h)
  floraMeshes[name] = mesh
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
function cellMesh() {
  const body = part('b', 0.46, 0.62, 0.28, 0, 0.34, 0, 0, copperD)
  const nub = part('n', 0.14, 0.1, 0.14, 0, 0.7, 0, 0, metalD)
  return shape('tech-cell', [body, nub], copperD)
}
function lineMesh() {
  return shape('tech-line', [part('s', 0.92, 0.08, 0.28, 0, 0.04, 0, 0, copperD)], copperD)
}
function techSwitchMesh(on) {
  const base = part('b', 0.5, 0.12, 0.5, 0, 0.06, 0, 0, copperD)
  const arm = part('h', 0.08, 0.46, 0.08, 0, 0.34, on ? 0.14 : -0.14, on ? 0.7 : -0.7, on ? copperOn : metalD)
  return shape(on ? 'tech-sw-on' : 'tech-sw', [base, arm], on ? copperOn : copperD)
}
function techButtonMesh(on) {
  const base = part('b', 0.56, 0.1, 0.56, 0, 0.05, 0, 0, copperD)
  const cap = part('c', 0.3, on ? 0.08 : 0.2, 0.3, 0, on ? 0.14 : 0.2, 0, 0, on ? copperOn : buttonD)
  return shape(on ? 'tech-btn-on' : 'tech-btn', [base, cap], on ? copperOn : copperD)
}
function bedMesh() {
  const wool = dye('bed-wool', 0.2, 0.46, 0.78)
  const pillow = dye('bed-pillow', 0.94, 0.95, 0.97)
  const legs = [
    [-0.36, -0.34], [0.36, -0.34], [-0.36, 1.22], [0.36, 1.22],
  ].map(([lx, lz], i) => part('bed-leg-' + i, 0.08, 0.16, 0.08, lx, 0.08, lz, 0, woodD))
  const frame = part('bed-frame', 0.88, 0.08, 1.78, 0, 0.2, 0.44, 0, woodD)
  const mattress = part('bed-mat', 0.78, 0.14, 1.62, 0, 0.31, 0.4, 0, wool)
  const board = part('bed-board', 0.86, 0.22, 0.08, 0, 0.42, 1.22, 0, woodD)
  const pill = part('bed-pill', 0.46, 0.12, 0.26, 0, 0.49, 1.05, 0, pillow)
  return mergeMats('bunk', legs.concat([frame, mattress, board, pill]))
}
function chairMesh() {
  const pad = dye('chair-pad', 0.16, 0.55, 0.72)
  const legs = [
    part('cl1', 0.1, 0.4, 0.1, -0.26, 0.2, -0.26, 0, woodD),
    part('cl2', 0.1, 0.4, 0.1, 0.26, 0.2, -0.26, 0, woodD),
    part('cl3', 0.1, 0.4, 0.1, -0.26, 0.2, 0.26, 0, woodD),
    part('cl4', 0.1, 0.4, 0.1, 0.26, 0.2, 0.26, 0, woodD),
  ]
  const seat = part('cseat', 0.7, 0.1, 0.7, 0, 0.44, 0, 0, pad)
  const back = part('cback', 0.7, 0.52, 0.08, 0, 0.74, 0.3, 0, woodD)
  return mergeMats('chair', legs.concat([seat, back]))
}
function sewingMesh() {
  const cloth = dye('sew-cloth', 0.8, 0.25, 0.4)
  const top = part('stop', 0.78, 0.1, 0.5, 0, 0.48, 0, 0, woodD)
  const legs = [
    part('sl1', 0.08, 0.46, 0.08, -0.3, 0.23, -0.16, 0, woodD),
    part('sl2', 0.08, 0.46, 0.08, 0.3, 0.23, -0.16, 0, woodD),
    part('sl3', 0.08, 0.46, 0.08, -0.3, 0.23, 0.16, 0, woodD),
    part('sl4', 0.08, 0.46, 0.08, 0.3, 0.23, 0.16, 0, woodD),
  ]
  const arm = part('sarm', 0.08, 0.34, 0.08, 0.16, 0.7, 0, 0, metalD)
  const needle = part('sn', 0.04, 0.18, 0.04, 0.16, 0.5, 0.1, 0, metalD)
  const bolt = part('scloth', 0.28, 0.05, 0.2, -0.12, 0.55, 0, 0, cloth)
  return mergeMats('sewing', legs.concat([top, arm, needle, bolt]))
}
function techFacing(mesh, x, y, z) { orientTech(mesh, x, y, z) }
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
  1400: cellMesh(),
  1401: lineMesh(),
  1402: techSwitchMesh(false),
  1403: techSwitchMesh(true),
  1404: techButtonMesh(false),
  1405: techButtonMesh(true),
  72: chairMesh(),
  73: sewingMesh(),
  26: bedMesh(),
}
const clayMat = dye('clay-soil', 0.64, 0.5, 0.38)
noa.registry.registerMaterial('clay', { renderMaterial: clayMat })
for (const [id, name, material] of BLOCKS) {
  const open = typeof name === 'string' && name.endsWith('Open')
  const glass = material === 'glass'
  const mesh0 = SHAPES[id]
  const cross = typeof name === 'string' ? FLORA_CROSS[name] : null
  const mesh = mesh0 || (cross ? floraMesh(name, cross) : null)
  const lantern = id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103
  const rug = id === 1104 || id === 1105
  const line = id === TECH.line
  const plant = id === 28 || id === 58 || isCropId(id) || isBushId(id) || !!cross
  const tilled = id === DRY || id === WET
  const fluid = id === WATER
  const opts = { material: mesh && !fluid ? null : material, opaque: tilled || (!mesh && !open && !glass && !fluid), solid: tilled || (!open && !lantern && !plant && !fluid && !rug && !line) }
  if (name === 'chair' || name === 'bunk') { opts.solid = false; opts.opaque = false }
  if (name === 'bunk') {
    opts.onCustomMeshCreate = orientBed
    const fix = (x, y, z) => queueMicrotask(() => ensureBedPair(x, y, z))
    opts.onSet = fix
    opts.onLoad = fix
  }
  if (fluid) { opts.material = 'bertWater'; opts.fluid = true; opts.opaque = false; opts.solid = false }
  if (mesh && !fluid) opts.blockMesh = mesh
  if (id === 1102 || id === 1103) opts.onCustomMeshCreate = wallLampFacing
  if (id === TECH.cell || id === TECH.line || id === TECH.switch || id === TECH.switchOn || id === TECH.button || id === TECH.buttonOn) opts.onCustomMeshCreate = techFacing
  if (cross || name === 'tuft') {
    opts.onCustomMeshCreate = (mesh, x, y, z) => {
      if (plantHalf && ((x + z) & 1)) mesh.scaling.setAll(0)
    }
  }
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
const FLORA_PLANT_IDS = new Set(BLOCKS.filter((b) => FLORA_CROSS[b[1]]).map((b) => b[0]))
const blockName = (id) => {
  const row = BLOCKS.find((b) => b[0] === id)
  return t(row ? String(row[1]).replace(/Top/g, '') : 'stone')
}

const S = 24
const saved = new Map()
let dirty = false
let worldRev = 0
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
    if (x === 10 && z === 7 && y === h + 1) return ID.bunk
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
  if (isMakerPreset(makerLive.preset)) {
    const name = makerBlock(makerLive.preset, x, y, z, worldSpawn, makerLive.seed)
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
  return { preset: 'normal', hills: 2, water: 2, trees: 2, seed: 0, adj: 0, noun: 0, on: true, edited: false }
}
let makerLive = defaultMaker()
function makerEnabled() {
  return makerLive.on !== false
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
  if (isMakerPreset(makerLive.preset)) {
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
      const name = makerBlock(makerLive.preset, x0 + i, y0 + j, z0 + k, worldSpawn, makerLive.seed)
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
let genBurstUntil = 0
function chunkPending(id) {
  const parts = id.split('|')
  return noa.world._chunksPending.includes(+parts[0], +parts[1], +parts[2])
}
function drainGen() {
  if (!genQueue.length) return
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!p) return
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
  const burst = t0 < genBurstUntil
  const cap = burst ? 16 : 2
  const budget = burst ? 32 : 6
  let added = 0
  while (genQueue.length && added < cap && performance.now() - t0 < budget) {
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
    if (isMakerPreset(makerLive.preset)) makerLive.edited = true
    markSave(t('notSaved'))
    if (isMachineId(prev) || isMachineId(v)) trackMachine(x, y, z, v)
  }
  if (prev !== v) {
    worldRev += 1
    noteVoxel(x, y, z, prev, v)
    afterVoxel(x, y, z, prev, v)
    gfxLook.note(x, y, z, prev, v)
  }
}
function remeshBox(x, y, z, r) {
  const x0 = Math.floor((x - r) / S)
  const x1 = Math.floor((x + r) / S)
  const y0 = Math.floor((y - r) / S)
  const y1 = Math.floor((y + r) / S)
  const z0 = Math.floor((z - r) / S)
  const z1 = Math.floor((z + r) / S)
  for (let ci = x0; ci <= x1; ci++) for (let cj = y0; cj <= y1; cj++) for (let ck = z0; ck <= z1; ck++) {
    const chunk = noa.world._storage.getChunkByIndexes(ci, cj, ck)
    if (!chunk) continue
    chunk._terrainDirty = true
    noa.world._queueChunkForRemesh(chunk)
  }
}
function remeshAll() {
  const hash = noa.world._storage.hash
  for (const id in hash) {
    const chunk = hash[id]
    if (!chunk) continue
    chunk._terrainDirty = true
    noa.world._queueChunkForRemesh(chunk)
  }
}
gfxLook.bind({
  getVoxel: (x, y, z) => getVoxel(x, y, z),
  opaque: (id) => !!(noa.registry && noa.registry.getBlockOpacity(id)),
  meta: (x, y, z) => (session && session.meta ? session.meta.get(x + ',' + y + ',' + z) : null),
  lanternOn: (x, y, z) => {
    if (!basics || !basics.light) return false
    const row = basics.light(x, y, z)
    return !!(row && row.radius > 1)
  },
  saved: () => saved,
  reduce: () => REDUCE,
  remesh: (x, y, z, r) => remeshBox(x, y, z, r),
  remeshAllLights: (map) => { for (const s of map.values()) remeshBox(s.x, s.y, s.z, REACH_LIGHT) },
})
const REACH_LIGHT = 8
noa.on('addingTerrainMesh', (mesh) => gfxLook.paint(mesh))
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
  if (group && v) saveSoon()
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
function faceFirstSpawn() {
  if (session && session.mode !== 'survival') return
  if (isMakerPreset(makerLive.preset)) return
  setLook(spawnTreeYaw(SPAWN[0], SPAWN[2]), 0.18)
}
setLook(0, 0.18)

let current = ID.brickRed
let tableMode = false
let flying = false
let inspectOn = false
let holdPick = false
let tableCursor = [8, TOWN.y + 1, 6]
let session = null
let calm = null
let kidPause = false
let bot = { dump() { return [] }, load() {} }
let belts = null
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
function plantMeshDrawn(id) {
  const meshes = noa.registry && noa.registry._blockMeshLookup
  const mesh = meshes && meshes[id]
  if (!mesh) return false
  if (typeof mesh.getTotalVertices !== 'function') return true
  return mesh.getTotalVertices() > 0
}
function bareTuftOrFlora(id) {
  if (id !== ID.tuft && !FLORA_PLANT_IDS.has(id)) return false
  return !plantMeshDrawn(id)
}
function lowPlant(id) {
  if (!id) return false
  return id === ID.tuft || FLORA_PLANT_IDS.has(id) || isCropId(id) || isBushId(id)
}
function playLocked() {
  return !!(document.pointerLockElement || (noa.container && noa.container.hasPointerLock))
}
noa.blockTargetIdCheck = (id) => {
  if (bareTuftOrFlora(id)) return false
  if (id === WATER && session && session.selectedItem && session.selectedItem() === 'bushSprout') return true
  return !passThrough(id) && (OPEN_IDS.has(id) || id === ID.chair || id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103 || id === 1104 || id === 1105 || id === TECH.line || id === ID.wheat || id === ID.tuft || isCropId(id) || isBushId(id) || FLORA_PLANT_IDS.has(id) || noa.registry.getBlockSolidity(id))
}
if (noa.defaultBlockHighlightFunction) {
  noa.off('targetBlockChanged', noa.defaultBlockHighlightFunction)
  noa.on('targetBlockChanged', (tgt) => {
    if (tgt && lowPlant(tgt.blockID) && !FLORA_PLANT_IDS.has(tgt.blockID)) {
      noa.rendering.highlightBlockFace(false)
      return
    }
    noa.defaultBlockHighlightFunction(tgt)
  })
}
let basics = null
let panels = null
function survivalOn() { return !!(session && session.mode === 'survival') }
function canReach(pos) {
  if (!pos) return false
  const p = noa.entities.getPosition(noa.playerEntity)
  const reach = Effects.reach(reachFor(survivalOn()))
  return inReach(p[0], p[1], p[2], pos[0], pos[1], pos[2], reach)
    || blockNearBody(p[0], p[1], p[2], pos[0], pos[1], pos[2], reach)
}
let farPress = 0
let farHit = null
let farKeyAt = 0
function grabClick() { return !TOUCH_UI && (!playLocked() || performance.now() - lockGainedAt < 300) }
function toastFar() {
  if (grabClick()) return
  if (farPress) return
  farPress = 1
  toast(t('tooFar'))
}
function releaseFar() { setTimeout(() => { farPress = 0 }, 0) }
function toastFarKey() {
  if (grabClick()) return
  const now = performance.now()
  if (now - farKeyAt < 600) return
  farKeyAt = now
  toast(t('tooFar'))
}
function showWalkCloser(x, y) {
  const el = $('reach-hint')
  if (!el) return
  el.textContent = '\u2192 ' + t('walkCloser')
  el.hidden = false
  if (x != null) el.style.left = x + 'px'
  if (y != null) el.style.top = y + 'px'
  clearTimeout(showWalkCloser.t)
  showWalkCloser.t = setTimeout(() => { if (el.isConnected) el.hidden = true }, 1400)
}
function hideWalkCloser() {
  const el = $('reach-hint')
  if (el) el.hidden = true
  clearTimeout(showWalkCloser.t)
}
function heldPlaceKey() {
  if (wandHeld()) return ''
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
  if (id === ID.sewing) return 'sew'
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
  const el = $('toast')
  const show = !TOUCH_UI && !tableMode && !anyCard() && placeableHeld()
  if (!show) {
    if (el && !el.hidden && el.textContent === t('crouchPlace')) el.hidden = true
    return
  }
  if (crouchHintN >= 3) return
  crouchHintN += 1
  toast(t('crouchPlace'))
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
  if (tableMode || anyCard()) return
  const aimed = noa.targetedBlock
  if (aimed && aimed.position && canReach(aimed.position)) return
  const tree = scanTree()
  if (tree && tree.d <= TREE_NEAR) return
  if (tree) { showMoveCloser(tree); return }
  if (!placeableHeld()) return
  const far = viewFar()
  if (!far || canReach(far.position)) return
  toastFar()
}
let chopState = null
let treeHold = false
let spaceChop = false
let treeCache = null
let treeCacheAt = 0
function logSets() {
  if (logSets.s) return logSets
  logSets.s = new Set([ID.log, ID.birchLog, ID.pineLog].filter((n) => n))
  logSets.leaf = new Set([ID.leaves, ID.birchLeaves, ID.pineNeedles].filter((n) => n))
  logSets.item = {}
  if (ID.log) logSets.item[ID.log] = 'log'
  if (ID.birchLog) logSets.item[ID.birchLog] = 'birchLog'
  if (ID.pineLog) logSets.item[ID.pineLog] = 'pineLog'
  return logSets
}
function scanTree() {
  const now = performance.now()
  if (treeCache && now - treeCacheAt < 120) return treeCache.tree
  const p = noa.entities.getPosition(noa.playerEntity)
  const tree = p ? nearestTree(p[0], p[1], p[2], getVoxel, logSets().s, TREE_LOOK) : null
  treeCache = { tree }
  treeCacheAt = now
  return tree
}
function faceTree(tree) {
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!p) return
  setLook(Math.atan2(tree.x + 0.5 - p[0], tree.z + 0.5 - p[2]), 0.22)
}
function showMoveCloser(tree) {
  const el = $('reach-hint')
  if (!el || !tree) return
  const p = noa.entities.getPosition(noa.playerEntity)
  const head = noa.camera ? noa.camera.heading : 0
  let rel = Math.atan2(tree.x + 0.5 - (p ? p[0] : 0), tree.z + 0.5 - (p ? p[2] : 0)) - head
  while (rel > Math.PI) rel -= Math.PI * 2
  while (rel < -Math.PI) rel += Math.PI * 2
  const deg = Math.round(rel * 180 / Math.PI)
  el.innerHTML = '<i class="aim-arrow" style="transform:rotate(' + deg + 'deg)">\u2191</i> ' + t('moveCloser')
  el.style.left = (innerWidth / 2 + Math.sin(rel) * 140) + 'px'
  el.style.top = (innerHeight / 2 - Math.cos(rel) * 80) + 'px'
  el.hidden = false
  clearTimeout(showMoveCloser.t)
  showMoveCloser.t = setTimeout(() => { if (el.isConnected) el.hidden = true }, 1600)
}
function showChopCount(n) {
  const el = $('chop-count')
  if (!el) return
  el.hidden = false
  el.textContent = n + '/3'
  clearTimeout(showChopCount.t)
  showChopCount.t = setTimeout(() => { if (el.isConnected) el.hidden = true }, 900)
}
function shakeChop() {
  const canvas = document.querySelector('#stage canvas')
  if (!canvas) return
  canvas.classList.remove('chop-shake')
  void canvas.offsetWidth
  canvas.classList.add('chop-shake')
}
function showWoodPop(item, n) { // 2.5.457: show the real item and count
  const el = $('wood-pop')
  if (!el) return
  const label = el.querySelector('b')
  if (label) label.textContent = '+' + (n || 1) + ' ' + (item ? t(item) : t('log'))
  el.hidden = false
  clearTimeout(showWoodPop.t)
  showWoodPop.t = setTimeout(() => { if (el.isConnected) el.hidden = true }, 1600)
}
function fellTree(tree) {
  const sets = logSets()
  const cells = fellCells(tree, getVoxel, sets.leaf)
  const ops = []
  for (let i = 0; i < cells.length; i++) {
    const x = cells[i][0]
    const y = cells[i][1]
    const z = cells[i][2]
    if (zoneLocked(x, y, z)) continue
    if (!getVoxel(x, y, z)) continue
    ops.push([x, y, z, 0])
  }
  if (ops.length < 3) return false
  const group = edits.applyEdit(ops, { source: 'hand', label: 'chop' })
  if (!group) return false
  changeLog.note(group)
  dirty = true
  let logs = 0 // 2.5.453: count trunk log cells
  for (const [x, y, z] of cells) {
    const id = getVoxel(x, y, z)
    if (id && sets.s.has(id)) logs += 1
  }
  logs = Math.max(1, Math.min(6, logs))
  if (session && session.give) session.give('log', logs)
  if (calm && calm.note) calm.note('tree')
  showWoodPop('log', logs) // 2.5.457: pass the real item and count
  treeCache = null
  return true
}
function pulseChop(tree, fresh) {
  if (!tree) return
  const now = performance.now()
  const key = tree.x + ',' + tree.z
  const next = takeHit(chopState, now, key, fresh)
  chopState = next
  if (!next.hit) return
  faceTree(tree)
  showCrack(next.hits / TREE_HITS, null, null, true)
  showChopCount(next.hits)
  shakeChop()
  pokeHand('break')
  if (next.fell) {
    fellTree(tree)
    chopState = null
    treeHold = false
    hideCrack()
  }
}
function treeGesture() {
  if (!survivalOn() || tableMode || anyCard() || wandHeld()) return ''
  const aimed = noa.targetedBlock
  if (!aimed || !aimed.position) return ''
  const id = aimed.blockID
  if (isUseBlock(id) || machineKind(id) || isDoor(id) || isCropId(id) || isBushId(id)) return ''
  if (!logSets().s.has(id)) return ''
  const tree = scanTree()
  if (!tree || tree.d > TREE_NEAR) return ''
  hideWalkCloser()
  treeHold = true
  pulseChop(tree, true)
  return 'chop'
}
function holdTreeChop() {
  if (!survivalOn() || tableMode || anyCard()) { treeHold = false; return }
  const lookingAway = !!(look && look.pt === 'touch' && look.moved >= 24)
  const want = !lookingAway && !!(spaceChop || mouseLeft || leftDown || (noa.inputs.state && noa.inputs.state.fire))
  if (!want) { treeHold = false; return }
  const tree = scanTree()
  if (!tree || tree.d > TREE_NEAR) { treeHold = false; return }
  if (!treeHold) {
    treeHold = true
    pulseChop(tree, true)
  } else pulseChop(tree, false)
  if (dig) dig = null
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
function tellNoRoom(key, msg) {
  const now = performance.now()
  if (now < roomQuietUntil) return
  if (roomTold === key && now - roomToldAt < 1200) return
  roomTold = key
  roomToldAt = now
  toast(msg || t('noRoom'))
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
const BED_H = 0.55
let bedBusy = false
function bedKey(x, y, z) { return x + ',' + y + ',' + z }
function bedDelta(face) { return face === 'N' || face === 'S' ? [1, 0] : [0, 1] }
function bedYaw(face) { return face === 'N' || face === 'S' ? Math.PI / 2 : 0 }
function orientBed(mesh, x, y, z) {
  const rec = session && session.meta && session.meta.get(bedKey(x, y, z))
  if (rec && rec.role === 'head') {
    mesh.scaling.setAll(0.001)
    return
  }
  let face = rec && (rec.face === 'N' || rec.face === 'E' || rec.face === 'W' || rec.face === 'S') ? rec.face : ''
  if (!face) {
    if (getVoxel(x + 1, y, z) === ID.bunk) face = 'S'
    else face = 'E'
  }
  mesh.rotation.y = bedYaw(face)
  const alongX = face === 'N' || face === 'S'
  const hx = x + (alongX ? 1 : 0)
  const hz = z + (alongX ? 0 : 1)
  const paired = (rec && rec.role === 'foot') || getVoxel(hx, y, hz) === ID.bunk
  if (!paired) {
    mesh.scaling.set(1, 1, 0.5)
    mesh.position.z = 0.3
  }
}
function bedPairOf(x, y, z) {
  const self = bedKey(x, y, z)
  const rec = session && session.meta && session.meta.get(self)
  const read = (row) => {
    if (!row || !row.anchor || !row.pair) return null
    const a = row.anchor.split(',').map(Number)
    const b = row.pair.split(',').map(Number)
    return { ax: a[0], ay: a[1], az: a[2], hx: b[0], hy: b[1], hz: b[2], face: row.face || 'E', solo: false }
  }
  const own = read(rec)
  if (own) return own
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  for (let i = 0; i < dirs.length; i++) {
    const nx = x + dirs[i][0]
    const nz = z + dirs[i][1]
    const other = session && session.meta && session.meta.get(bedKey(nx, y, nz))
    const hit = read(other)
    if (hit && (other.anchor === self || other.pair === self)) return hit
  }
  return { ax: x, ay: y, az: z, hx: x, hy: y, hz: z, face: (rec && rec.face) || 'E', solo: true }
}
function stampBed(ax, ay, az, hx, hy, hz, face, design) {
  if (!session || !session.meta) return
  const anchor = bedKey(ax, ay, az)
  const pair = bedKey(hx, hy, hz)
  const base = design && design.kind === 'bunk' ? design : { kind: 'bunk', stars: 1, tone: 'natural', fabric: 'woolBlue', pattern: 'plain', restAt: 0 }
  const row = (role) => ({ ...base, kind: 'bunk', stars: base.stars || 1, tone: base.tone || 'natural', fabric: base.fabric || 'woolBlue', pattern: base.pattern || 'plain', restAt: base.restAt || 0, face, role, anchor, pair })
  session.meta.set(anchor, row('foot'))
  if (hx !== ax || hz !== az) session.meta.set(pair, row('head'))
}
function ensureBedPair(x, y, z) {
  if (bedBusy || !session || !session.meta) return
  if (getVoxel(x, y, z) !== ID.bunk) return
  const key = bedKey(x, y, z)
  const rec = session.meta.get(key)
  if (rec && rec.pair && rec.role) return
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
  let anchor = true
  for (let i = 0; i < dirs.length; i++) {
    const nx = x + dirs[i][0]
    const nz = z + dirs[i][1]
    if (getVoxel(nx, y, nz) !== ID.bunk) continue
    if (nz < z || (nz === z && nx < x)) anchor = false
  }
  if (!anchor) return
  const face = rec && (rec.face === 'N' || rec.face === 'E' || rec.face === 'W' || rec.face === 'S') ? rec.face : ''
  const order = []
  if (face) order.push(bedDelta(face))
  order.push([0, 1])
  let hx = x
  let hz = z
  let grew = false
  const seen = new Set()
  for (let i = 0; i < order.length; i++) {
    const sig = order[i][0] + ',' + order[i][1]
    if (seen.has(sig)) continue
    seen.add(sig)
    const nx = x + order[i][0]
    const nz = z + order[i][1]
    const id = getVoxel(nx, y, nz)
    if (id === ID.bunk) { hx = nx; hz = nz; grew = true; break }
    if (!id) { hx = nx; hz = nz; grew = true; break }
  }
  const useFace = face || (hz !== z ? 'E' : hx !== x ? 'S' : 'E')
  bedBusy = true
  try {
    if (grew && (hx !== x || hz !== z) && !getVoxel(hx, y, hz)) setVoxel(hx, y, hz, ID.bunk)
    else if (!(grew && (hx !== x || hz !== z))) { hx = x; hz = z }
    stampBed(x, y, z, hx, y, hz, useFace, rec)
    setVoxel(x, y, z, 0)
    setVoxel(x, y, z, ID.bunk)
    if (hx !== x || hz !== z) {
      setVoxel(hx, y, hz, 0)
      setVoxel(hx, y, hz, ID.bunk)
    }
  } finally { bedBusy = false }
}
// Why a bed will not sit: two free floor blocks, or one free block above them.
function bedBlockReason(x, y, z, span) {
  const taken = (cx, cy, cz) => !!getVoxel(cx, cy, cz)
  if (taken(x, y, z) || taken(span.sx, span.sy, span.sz)) return 'bedFloor'
  if (!tableMode) {
    const p = noa.entities.getPosition(noa.playerEntity)
    if (overlapsPlayer(span.sx, span.sy, span.sz, p[0], p[1], p[2])) return 'bedFloor'
  }
  if (!teacherOn() && !townHelper() && protectedCell(span.sx, span.sy, span.sz, protect)) return 'bedFloor'
  if (taken(x, y + 1, z) || taken(span.sx, span.sy + 1, span.sz)) return 'bedAbove'
  if (!tableMode && !canReach([span.sx, span.sy, span.sz])) return 'far'
  return ''
}
function placeBed(x, y, z) {
  if (!tableMode && !canReach([x, y, z])) { toastFarKey(); return false }
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!tableMode && overlapsPlayer(x, y, z, p[0], p[1], p[2])) { toast(t('standing')); return false }
  const span = shopSpan(x, y, z)
  const why = bedBlockReason(x, y, z, span)
  if (why) {
    ghostBedScale(true)
    syncPlaceGhost()
    if (why === 'far') toastFarKey()
    else tellNoRoom(span.sx + ',' + span.sy + ',' + span.sz + ':' + why, t(why))
    return false
  }
  if (session && !session.onPlace(x, y, z, ID.bunk)) return false
  const prev = session && session.meta && session.meta.get(bedKey(x, y, z))
  stampBed(x, y, z, span.sx, span.sy, span.sz, span.face, prev)
  if (!edit(x, y, z, ID.bunk)) {
    if (session && session.mode === 'survival' && session.give) session.give('bunk', 1)
    if (session && session.meta) { session.meta.delete(bedKey(x, y, z)); session.meta.delete(bedKey(span.sx, span.sy, span.sz)) }
    return false
  }
  if (!edit(span.sx, span.sy, span.sz, ID.bunk)) {
    edit(x, y, z, 0)
    if (session && session.mode === 'survival' && session.give) session.give('bunk', 1)
    if (session && session.meta) { session.meta.delete(bedKey(x, y, z)); session.meta.delete(bedKey(span.sx, span.sy, span.sz)) }
    ghostBedScale(true)
    syncPlaceGhost()
    tellNoRoom(span.sx + ',' + span.sy + ',' + span.sz + ':bedFloor', t('bedFloor'))
    return false
  }
  return true
}
function liftBed(x, y, z) {
  if (!tableMode && !canReach([x, y, z])) return false
  const pair = bedPairOf(x, y, z)
  if (zoneLocked(pair.ax, pair.ay, pair.az)) return false
  if (!pair.solo && zoneLocked(pair.hx, pair.hy, pair.hz)) return false
  if (session && session.pickup) session.pickup(pair.ax, pair.ay, pair.az, ID.bunk)
  else if (session && session.give) session.give('bunk', 1)
  if (session && session.meta) {
    session.meta.delete(bedKey(pair.ax, pair.ay, pair.az))
    if (!pair.solo) session.meta.delete(bedKey(pair.hx, pair.hy, pair.hz))
  }
  const wipe = (cx, cy, cz) => { if (getVoxel(cx, cy, cz) === ID.bunk) edit(cx, cy, cz, 0) }
  wipe(pair.ax, pair.ay, pair.az)
  if (!pair.solo) wipe(pair.hx, pair.hy, pair.hz)
  return getVoxel(pair.ax, pair.ay, pair.az) !== ID.bunk && (pair.solo || getVoxel(pair.hx, pair.hy, pair.hz) !== ID.bunk)
}
function supportBeds() {
  if (flying || tableMode || seated || !playerBody) return
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!p || playerBody.velocity[1] > 1.2) return
  const x0 = Math.floor(p[0] - 0.1)
  const x1 = Math.floor(p[0] + 0.1)
  const z0 = Math.floor(p[2] - 0.1)
  const z1 = Math.floor(p[2] + 0.1)
  let top = null
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    for (const by of [Math.floor(p[1] + 0.05), Math.floor(p[1] - 0.2)]) {
      if (getVoxel(x, by, z) !== ID.bunk) continue
      const surface = by + BED_H
      if (p[1] <= surface + 0.05 && p[1] >= surface - 0.7) {
        if (top == null || surface > top) top = surface
      }
    }
  }
  if (top == null || p[1] >= top - 0.001) return
  playerBody.velocity[1] = 0
  noa.entities.setPosition(noa.playerEntity, [p[0], top, p[2]])
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
  if (!hold && !leftPress && !(look && look.pt === 'touch')) { window.__ghostBreaks = (window.__ghostBreaks || 0) + 1; return false }
  const id = getVoxel(x, y, z)
  if (!id) return false
  if (isFoundryConsole(id, x, z) && survivalOn()) { useAt({ position: [x, y, z], id }); return false }
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
  if (id === ID.vend) return false
  if (id === ID.bunk) return liftBed(x, y, z)
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
  if (gone && id === ID.conveyor && belts) {
    const cargo = belts.remove(x, y, z)
    if (cargo && session && session.give) session.give(cargo, 1)
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
function isFoundryConsole(id, x, z) { return id === 42 && x === 60 && z === 60 }
function isUseBlock(id) {
  if (id === ID.conveyor) return true
  if (isDoor(id) || id === LEVER.off || id === LEVER.on || id === BUTTON.off || id === BUTTON.on || id === LANTERN) return true
  if (id === TECH.switch || id === TECH.switchOn || id === TECH.button || id === TECH.buttonOn) return true
  if (id === 1100 || id === 1101 || id === 1102 || id === 1103) return true
  return id === ID.door || id === ID.doorOpen || id === ID.storeCounter || id === ID.oven || id === ID.workbench || id === ID.vend || id === ID.bunk || id === ID.box || id === ID.chair || id === ID.sewing || isShopBlock(id)
}
function isGear(id) {
  return isDoor(id) || id === LEVER.off || id === LEVER.on || id === BUTTON.off || id === BUTTON.on || id === LANTERN || id === TECH.switch || id === TECH.switchOn || id === TECH.button || id === TECH.buttonOn
}
function useHoldReady(dig, now) {
  if (!dig || !isUseBlock(dig.id)) return true
  if (isDoor(dig.id)) return false
  return now - (dig.t0 || now) >= 500
}
function useAt(hit) {
  // C5 Foundry Console: Override Key on the arena Console
  try {
    if (hit && hit.position && isFoundryConsole(hit.id != null ? hit.id : hit.blockID, hit.position[0], hit.position[2])) {
      const ok = onConsoleUse(session, (n) => mobs && mobs.spawnBoss ? mobs.spawnBoss(n, [60, hit.position[1] + 1, 63]) : null)
      if (ok) return true
    }
  } catch (e) {}
  if (bot && bot.swallowPlace && bot.swallowPlace()) {
    if (bot.tryArmed) bot.tryArmed()
    return true
  }
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
  if (id === ID.conveyor) {
    if (!canReach([ax, ay, az])) return false
    const spun = belts && belts.rotate(ax, ay, az)
    if (spun === false) toast('⚠ ' + t('tooManyMachines'))
    return true
  }
  if (isDoor(id) && freshPlacedDoor()) {
    forceShut(ax, ay, az)
    toast(t('doorShut'))
    return true
  }
  if (id === ID.chair) {
    if (!canReach([ax, ay, az])) return false
    sitDown(ax | 0, ay | 0, az | 0)
    return true
  }
  if ((id === LANTERN || id === 1100 || id === 1101 || id === 1102 || id === 1103) && powerOf(ax, ay, az)) {
    if (id !== LANTERN) preferLamp(ax, ay, az, id)
    return true
  }
  if (id === TECH.switch || id === TECH.switchOn) {
    if (!canReach([ax, ay, az])) return false
    return toggleSwitch(ax, ay, az)
  }
  if (id === TECH.button || id === TECH.buttonOn) {
    if (!canReach([ax, ay, az])) return false
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
  if (!crouching()) noteCrouchHint()
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
  else if (kind === 'woodshop') { if (performance.now() - (window.__shopClosedAt || 0) < 300) return true; panels.open('woodshop', shopAnchorKey(ax, ay, az)) }
  else if (kind === 'sew') panels.open('woodshop', ax + ',' + ay + ',' + az)
  else panels.open('shop')
  openMachineKey = key
  return true
}
function placeableCell(id) {
  return !id || id === WATER || id === ID.tuft || id === ID.wheat
}
function placeBlock(face, opts) {
  if (bot && bot.swallowPlace && bot.swallowPlace()) return false
  if (inspectOn) { showInspect(); return false }
  const repeat = !!(opts && opts.repeat)
  const sayFar = () => { if (repeat || !placeableHeld()) return; toastFarKey() }
  const aimedBlock = face && face.position ? face : noa.targetedBlock
  if (!repeat && aimedBlock && panels) {
    const aimId = aimedBlock.blockID != null ? aimedBlock.blockID : aimedBlock.id
    const beside = machineKind(aimId) && againstMachine(aimedBlock)
    if ((isUseBlock(aimId) || machineKind(aimId) || isFoundryConsole(aimId, aimedBlock.position[0], aimedBlock.position[2])) && !beside) {
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
  else if (id === TECH.switchOn) id = TECH.switch
  else if (id === TECH.buttonOn) id = TECH.button
  let beltFace = ''
  if (id === ID.conveyor && belts) {
    const gate = belts.tryPlace(x, y, z, belts.awayFace(x, z), 'you')
    if (!gate.ok) { toast('⚠ ' + t('tooManyMachines')); return false }
    beltFace = gate.face
  }
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
  if (id === ID.bunk) { const ok = placeBed(x, y, z); if (ok) pokeHand('place'); return ok }
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
  if (placed && id === ID.conveyor && belts) {
    belts.commit(x, y, z, beltFace || belts.awayFace(x, z), 'you')
    showBeltHint()
  }
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
      Badges.bump('berryRound', cell)
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
  Badges.bump('berryRound', x + ',' + y + ',' + z)
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
  Badges.bump('berryRound', cell)
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
  if (farm && farm.rows) { const wetRows = farm.rows().filter(r => r.wet).length; Badges.set('gardenCorner', wetRows) } // 2.5.475: wire garden badge
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
let lastClient = { x: 0, y: 0 }
let lastPointing = 0 // 2.5.506: mouse moved last vs keyboard focus in the Bag
let lastKeyNav = 0
function hudEl(el) {
  if (!el || !el.closest) return false
  const canvas = noa.container && noa.container.canvas
  if (el === canvas) return false
  return !!el.closest('button, a, input, textarea, select, label, #sheet, #hotbar, header, .kb-bar, #play-chip, #path-chip, #path-make')
}
function overHud() {
  if (document.pointerLockElement || (noa.container && noa.container.hasPointerLock)) return false
  let el = null
  try { el = document.elementFromPoint(lastClient.x, lastClient.y) } catch (e) { return false }
  return hudEl(el)
}
window.addEventListener('pointermove', (e) => { lastClient.x = e.clientX; lastClient.y = e.clientY; if (!e.pointerType || e.pointerType !== 'touch') lastPointing = performance.now(); if (leftPress && !(e.buttons & 1)) dropLeft() }, true)
window.addEventListener('pointerdown', (e) => { lastClient.x = e.clientX; lastClient.y = e.clientY; if (leftPress && !(e.buttons & 1)) dropLeft() }, true)
noa.inputs.down.on('fire', () => {
  if (!leftPress || leftPress.acted) return
  leftPress.acted = true
  if (wandHeld()) return
  if (inspectOn) { showInspect(); return }
  if (tableMode) return
  if (anyCard()) return
  if (overHud()) return
  if (!playLocked()) {
    if (actThisClick || awaitWorldClick) { if (awaitWorldClick) armActLock(); return }
    showPlayChip(); grabLock(); return
  }
  if (eatResumeClick()) return
  const aimed = noa.targetedBlock
  if (combatTarget()) { doBonk(); return }
  if (safeZoneFightTap()) return
  if (treeGesture() === 'chop') return
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
  if (wandHeld()) return
  if (inspectOn) { showInspect(); return }
  if (tableMode || rightPress) return
  if (anyCard()) return
  if (overHud()) return
  if (!playLocked()) {
    if (actThisClick || awaitWorldClick) { if (awaitWorldClick) armActLock(); return }
    showPlayChip(); grabLock(); return
  }
  if (eatResumeClick()) return
  const tget = noa.targetedBlock
  if (!TOUCH_UI && deskOpenStation(tget)) return
  if (tryEatClick(tget)) return
  if (tget && isUseBlock(tget.blockID)) return
  const placed = placeBlock()
  if (!TOUCH_UI && placed) { mouseRight = true; placeHoldAt = performance.now() }
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
let pinTimer = 0 // 2.5.440: coalesce machine save-pin
function noteMachine() {
  dirty = true
  pinGen += 1
  if (!pinTimer) pinTimer = setTimeout(() => { pinTimer = 0; pinMachines() }, 1000)
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
const tabId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('t' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8))
let lastSeenAt = ''
let saveLockHeld = false
let savePaused = false
let lockPending = false
let lockRelease = null
let lockGen = 0
function mountStayChip(id, tone) {
  let el = document.getElementById(id)
  if (el) return el
  el = document.createElement('div')
  el.id = id
  el.setAttribute('role', 'status')
  el.style.cssText = 'position:fixed;z-index:80;left:50%;bottom:calc(92px + env(safe-area-inset-bottom, 0px));transform:translateX(-50%);max-width:92vw;padding:8px 14px;border-radius:999px;border:1px solid ' + (tone || 'rgba(255,138,31,.75)') + ';background:rgba(14,26,34,.94);color:#ffe7c2;font:700 14px/1.3 ui-sans-serif,system-ui,sans-serif;text-align:center;pointer-events:none'
  el.hidden = true
  document.body.appendChild(el)
  return el
}
function showPauseChip() {
  const el = mountStayChip('save-pause-chip', 'rgba(255,138,31,.8)')
  el.textContent = t('tabPaused')
  el.hidden = false
}
function hidePauseChip() {
  const el = document.getElementById('save-pause-chip')
  if (el) el.hidden = true
}
function showNotSavedChip() {
  const el = mountStayChip('save-fail-chip', 'rgba(248,113,113,.85)')
  el.textContent = t('notSaved')
  el.style.bottom = 'calc(132px + env(safe-area-inset-bottom, 0px))'
  el.hidden = false
}
function clearNotSavedChip() {
  const el = document.getElementById('save-fail-chip')
  if (el) el.hidden = true
}
function pauseOtherTab() {
  savePaused = true
  allowSave = false
  showPauseChip()
}
function resumeSaving() {
  savePaused = false
  hidePauseChip()
  if (!readOnlySave) allowSave = true
}
function foreignNewer(prev) {
  if (!prev || typeof prev.updatedAt !== 'string') return false
  if (!prev.tabId || prev.tabId === tabId) return false
  if (!lastSeenAt) return true
  return prev.updatedAt > lastSeenAt
}
function claimBroadcast(world) {
  if (typeof BroadcastChannel !== 'function') {
    saveLockHeld = true
    return
  }
  let bc
  try { bc = new BroadcastChannel('bertopia-' + world) } catch (e) { saveLockHeld = true; return }
  let answered = false
  bc.onmessage = (ev) => {
    const data = ev.data || {}
    if (!data || data.tabId === tabId) return
    if (data.type === 'hello') {
      if (saveLockHeld) { try { bc.postMessage({ type: 'here', tabId }) } catch (e) {} }
    } else if (data.type === 'here') {
      answered = true
      if (!saveLockHeld) pauseOtherTab()
    }
  }
  try { bc.postMessage({ type: 'hello', tabId }) } catch (e) {}
  setTimeout(() => {
    if (!answered && !savePaused && WORLD === world) saveLockHeld = true
  }, 280)
}
function dropSaveLock() {
  saveLockHeld = false
  if (lockRelease) {
    const fn = lockRelease
    lockRelease = null
    try { fn() } catch (e) {}
  }
}
function peekStored() {
  return idb().then((db) => new Promise((res, rej) => {
    const r = db.transaction(STORE).objectStore(STORE).get(WORLD)
    r.onsuccess = () => res(r.result || null)
    r.onerror = () => rej(r.error || new Error('read'))
  }))
}
async function yieldIfBehind() {
  let prev = null
  try { prev = await peekStored() } catch (e) { return false }
  if (!foreignNewer(prev)) return false
  pauseOtherTab()
  dropSaveLock()
  return true
}
function claimSaveLock() {
  if (saveLockHeld || lockPending) return
  const world = WORLD
  const gen = ++lockGen
  const name = 'bertopia-' + world
  if (!(navigator.locks && typeof navigator.locks.request === 'function')) {
    claimBroadcast(world)
    return
  }
  lockPending = true
  navigator.locks.request(name, { ifAvailable: true }, async (lock) => {
    if (gen !== lockGen) return
    lockPending = false
    if (WORLD !== world) return
    if (!lock) {
      pauseOtherTab()
      return
    }
    saveLockHeld = true
    const wasPaused = savePaused
    if (wasPaused) {
      const behind = await yieldIfBehind()
      if (gen !== lockGen || WORLD !== world) {
        dropSaveLock()
        return
      }
      if (behind) return
    }
    if (gen !== lockGen || WORLD !== world) {
      dropSaveLock()
      return
    }
    if (savePaused) resumeSaving()
    await new Promise((resolve) => { lockRelease = resolve })
    if (gen !== lockGen) return
    saveLockHeld = false
    lockRelease = null
  }).catch(() => {
    if (gen !== lockGen) return
    lockPending = false
    if (!saveLockHeld) claimBroadcast(world)
  })
}
function rebindSaveLock() {
  lockGen += 1
  if (lockRelease) {
    const fn = lockRelease
    lockRelease = null
    try { fn() } catch (e) {}
  }
  saveLockHeld = false
  lockPending = false
  claimSaveLock()
}
async function waitWriter() {
  const t0 = performance.now()
  while (!saveLockHeld && !savePaused && performance.now() - t0 < 800) {
    await new Promise((r) => setTimeout(r, 30))
  }
  return !!(saveLockHeld && !savePaused)
}
function copySaved() {
  const copies = []
  for (const [k, v] of saved) copies.push([k, v.slice()])
  return copies
}
async function snapshot() {
  let copies = copySaved()
  let chunks = {}
  for (let pass = 0; pass < 4; pass++) {
    const rev = worldRev
    chunks = {}
    for (const [k, v] of copies) chunks[k] = await gz(v)
    if (worldRev === rev) break
    copies = copySaved()
    if (pass === 3) {
      chunks = {}
      for (const [k, v] of copies) chunks[k] = await gz(v)
    }
  }
  const p = noa.entities.getPosition(noa.playerEntity)
  const rules = Rules.dump()
  const effects = Effects.dump()
  const clock = basics ? basics.dump() : null
  return {
    format: 'kuliblocks', v: 2, schema: SCHEMA, packs: packVersions(), appVersion: 'bloxbert-' + VERSION, id: WORLD, title: 'Bertyville',
    ownerRef: null, seed: 1, spawn: worldSpawn.slice(), spawnSet: !!spawnSet, pos: [p[0], p[1], p[2]], look: [Math.round(noa.camera.heading * 1000) / 1000, Math.round(noa.camera.pitch * 1000) / 1000], protect: { size: protect.size, center: protect.center ? protect.center.slice() : null }, chunkSize: S,
    genVersion, genSeen: compactSeen(),
    palette: blockPalette(),
    chunks, updatedAt: new Date().toISOString(), tabId,
    ...(session ? session.dump() : { player: { mode: 'creative', bag: [], hot: 0, home: null, table: false }, econ: null, meta: {} }),
    creativeBar: paletteIds.slice(0, CREATIVE_HOT), // 2.5.506: Creative hotbar order, per world
    stations: stations.dump(),
    basics: clock,
    gifts,
    crops: farm.dump(),
    forage: forage.dump(),
    badges: Badges.dump(), // 2.5.472
    crew: CrewBadges.dump(),
    bots: bot.dump(),
    pondAid: !!pondAid,
    maker: makerSnap(),
    ...(openedFrom ? { openedFrom } : {}),
    ...(Object.keys(rules).length ? { rules } : {}),
    ...(Object.keys(effects).length ? { effects } : {}),
  }
}
async function saveBody() {
  if (!(await waitWriter())) {
    pauseOtherTab()
    const err = new Error('paused')
    err.code = 'paused'
    throw err
  }
  if (!allowSave || readOnlySave) {
    const err = new Error(readOnlySave ? 'newer' : 'held')
    err.code = readOnlySave ? 'newer' : 'held'
    throw err
  }
  const gen = pinGen
  const doc = await snapshot()
  if (basics) doc.basics = basics.dump()
  const revAtPut = worldRev
  const db = await idb()
  const wrote = await new Promise((res, rej) => {
    let settled = false
    let stale = false
    const done = (v) => { if (!settled) { settled = true; res(v) } }
    const fail = (e) => { if (!settled) { settled = true; rej(e) } }
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getReq = store.get(WORLD)
    getReq.onerror = () => fail(getReq.error || new Error('save'))
    getReq.onsuccess = () => {
      if (foreignNewer(getReq.result)) {
        stale = true
        try { tx.abort() } catch (e) {}
        return
      }
      const putReq = store.put(doc, WORLD)
      putReq.onerror = () => fail(putReq.error || new Error('save'))
    }
    tx.oncomplete = () => done(true)
    tx.onabort = (ev) => {
      if (stale) { if (ev && ev.preventDefault) ev.preventDefault(); done(false) }
      else fail(tx.error || new Error('save'))
    }
    tx.onerror = (ev) => {
      if (stale) { if (ev && ev.preventDefault) ev.preventDefault(); done(false) }
      else fail(tx.error || new Error('save'))
    }
  })
  if (!wrote) {
    pauseOtherTab()
    dropSaveLock()
    const err = new Error('paused')
    err.code = 'paused'
    throw err
  }
  lastSeenAt = doc.updatedAt
  try { maybePush(doc) } catch (e) {}
  if (gen === pinGen) {
    if (worldRev === revAtPut) dirty = false
    else dirty = true
    machineCells.clear()
    clearPin()
  }
  if (worldRev !== revAtPut && allowSave && !savePaused && saveLag < 3) {
    saveLag += 1
    queueMicrotask(() => { if (dirty && allowSave && !savePaused) saveSoon() })
    return -1
  }
  saveLag = 0
  let bytes = 0
  try { bytes = JSON.stringify(doc).length } catch (e) { bytes = 0 }
  clearNotSavedChip()
  markSave(t('saved') + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + ' · ' + (bytes / 1024).toFixed(1) + ' KB')
  return bytes
}
let saveChain = Promise.resolve()
let saveSoon = () => {}
let saveLag = 0
function save() {
  const job = saveChain.then(() => saveBody())
  saveChain = job.catch(() => {})
  return job
}
saveSoon = () => {
  dirty = true
  paintSaveChip('saving')
  return save().then((bytes) => {
    if (!(bytes >= 0)) return bytes
    paintSaveChip(navigator.onLine ? 'saved' : 'offline')
    return bytes
  })
}
async function saveClicked() {
  paintSaveChip('saving')
  try {
    await save()
    toast(t('saved'))
    clearNotSavedChip()
  } catch (e) {
    if (e && e.code === 'paused') {
      pauseOtherTab()
      toast(t('tabPaused'))
      return
    }
    showNotSavedChip()
    if (e && e.code === 'newer') toast(t('saveNewer'))
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
  spotReady = false
  const bootSpot = readSpot()
  let doc = null
  try {
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
    try {
      const pulled = await Promise.race([
        maybePull(WORLD, doc),
        new Promise(r => setTimeout(() => r(null), 4000))
      ])
      if (pulled) doc = pulled
    } catch (e) {}
    if (__BLOX_STUDENT__ && !doc && localStorage.getItem('bert-oldworld-done') !== '1') { // 2.5.474: old world card
      try {
        const old = await Promise.race([
          new Promise((res) => {
            const req = indexedDB.open('kuliblocks-test')
            req.onupgradeneeded = (e) => { e.target.transaction.abort(); res(null) }
            req.onsuccess = () => {
              const db = req.result
              if (!db.objectStoreNames.contains('worlds')) { db.close(); res(null); return }
              const tx = db.transaction('worlds', 'readonly')
              const g = tx.objectStore('worlds').get(WORLD)
              g.onsuccess = () => { db.close(); res(g.result || null) }
              g.onerror = () => { db.close(); res(null) }
            }
            req.onerror = () => res(null)
          }),
          new Promise(r => setTimeout(() => r(null), 3000))
        ])
        if (!old) { try { localStorage.setItem('bert-oldworld-done', '1') } catch (e) {} } // 2.5.475: don't retry if no old world
        if (old) {
          const bring = await new Promise((res) => {
            const card = document.createElement('div')
            card.style.cssText = 'position:fixed;inset:0;z-index:90;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.5)'
            card.innerHTML = '<div style="background:#222;color:#e8e6e3;padding:24px;border:2px solid #E85820;max-width:320px;text-align:center"><p style="font-size:18px;margin:0 0 16px">' + t('oldWorldAsk') + '</p><button id="ow-bring" style="min-height:48px;margin:4px;padding:8px 16px;background:#E85820;color:#fff;border:none;font-size:16px">' + t('oldWorldBring') + '</button><button id="ow-fresh" style="min-height:48px;margin:4px;padding:8px 16px;background:#2b2b2b;color:#e8e6e3;border:1px solid #E85820;font-size:16px">' + t('oldWorldFresh') + '</button></div>'
            document.body.appendChild(card)
            const bringBtn = document.getElementById('ow-bring')
            const freshBtn = document.getElementById('ow-fresh')
            bringBtn.onclick = () => { card.remove(); res(true) }
            freshBtn.onclick = () => { card.remove(); res(false) }
            card.onkeydown = (e) => { if (e.key === 'Escape') { card.remove(); res(false) } } // 2.5.475: Escape closes
            bringBtn.focus() // 2.5.475: focus the first button
          })
          localStorage.setItem('bert-oldworld-done', '1')
          if (bring) { doc = old; idbPut(WORLD, doc) }
        }
      } catch (e) {}
    }
    if (!doc) {
      Rules.load({})
      Effects.load({})
      farm.clear()
      forage.clear()
      pondAid = true
      ensureHelp()
      grantSaplings()
      grantStartKit()
      seedOldBushes()
      allowSave = !savePaused
      lastSeenAt = ''
      if (mergePin(null)) noteMachine()
      faceFirstSpawn()
      if (bootSpot && bootSpot.world === WORLD) {
        const sPos = finiteTriple(bootSpot.pos)
        if (sPos && sPos[1] >= -60) {
          pinSavedSpot(sPos)
          if (Array.isArray(bootSpot.look) && bootSpot.look.length >= 2 && Number.isFinite(+bootSpot.look[0]) && Number.isFinite(+bootSpot.look[1])) setLook(+bootSpot.look[0], +bootSpot.look[1])
        }
        if (bootSpot.clock && basics && basics.load) {
          basics.load(bootSpot.clock)
          paintDayClock()
        }
      }
      spotReady = true
      writeSpot()
      return false
    }
    if (doc.format !== 'kuliblocks') {
      keepSaved(doc)
      return false
    }
    try {
      await applyDoc(doc, bootSpot)
    } catch (e) {
      keepSaved(e)
      return false
    }
    const pinned = mergePin(doc)
    if (doc && typeof doc.updatedAt === 'string') lastSeenAt = doc.updatedAt
    allowSave = !readOnlySave && !savePaused
    if (readOnlySave) {
      dirty = false
      toast(t('saveNewer'))
      markSave(t('saveNewer'))
    } else {
      markSave(t('loaded'))
      if (pinned) noteMachine()
    }
    return true
  } finally {
    spotReady = true
  }
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
let landHold = null
let landHoldUntil = 0
let landLook = null
let landFree = false
let applyDocN = 0
function chunkSettled(x, y, z) {
  const world = noa.world
  const storage = world && world._storage
  if (!storage || typeof storage.getChunkByIndexes !== 'function') return false
  const ix = world._coordsToChunkIndexes ? world._coordsToChunkIndexes(x, y, z) : [Math.floor(x / S), Math.floor(y / S), Math.floor(z / S)]
  const ci = ix[0], cj = ix[1], ck = ix[2]
  const inv = world._chunksInvalidated
  if (inv && typeof inv.includes === 'function' && inv.includes(ci, cj, ck)) return false
  const pending = world._chunksPending
  if (pending && typeof pending.includes === 'function' && pending.includes(ci, cj, ck)) return false
  return !!storage.getChunkByIndexes(ci, cj, ck)
}
function spotSupported(spot) {
  return chunkSettled(spot[0], spot[1], spot[2]) && chunkSettled(spot[0], spot[1] - 1, spot[2])
}
function pinSavedSpot(spot) {
  landHold = [spot[0], spot[1], spot[2]]
  landHoldUntil = performance.now() + 12000
  landLook = null
  landFree = false
  const body = playerBody
  if (body) {
    body.gravityMultiplier = 0
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
  }
  noa.entities.setPosition(noa.playerEntity, landHold)
}
function landSteered() {
  const st = noa.inputs && noa.inputs.state
  // 2.5.438: only WASD or jump releases the hold; camera turns never drop the player.
  return !!(st && (st.forward || st.backward || st.left || st.right || st.jump))
}
function landLetGo() {
  landHold = null
  landLook = null
  landFree = false
  if (playerBody && !flying && !tableMode && !seated) playerBody.gravityMultiplier = GRAV_MULT
}
function keepSavedSpot() {
  if (landFree) {
    const p = noa.entities.getPosition(noa.playerEntity)
    const expired = performance.now() > landHoldUntil
    if (p && spotSupported(p)) landLetGo()
    else if (expired) rescueToGround(false)
    else if (playerBody) playerBody.gravityMultiplier = 0
    return
  }
  if (!landHold) return
  if (landSteered()) {
    const p = noa.entities.getPosition(noa.playerEntity)
    const here = p ? [p[0], p[1], p[2]].map((n) => Math.round(n * 100) / 100).join(',') : ''
    console.info('[bertopia] walk released the saved spot ' + here)
    setTimeout(() => {
      try {
        const q = noa.entities.getPosition(noa.playerEntity)
        const stay = q ? [q[0], q[1], q[2]].map((n) => Math.round(n * 100) / 100).join(',') : ''
        console.info('[bertopia] still here ' + stay)
      } catch (e) {}
    }, 5000)
    if (p && spotSupported(p)) landLetGo()
    else {
      landFree = true
      if (playerBody) playerBody.gravityMultiplier = 0
    }
    return
  }
  const ready = spotSupported(landHold)
  const expired = performance.now() > landHoldUntil
  if (ready) { landLetGo(); return }
  if (expired) { rescueToGround(false); return }
  if (playerBody) {
    playerBody.gravityMultiplier = 0
    playerBody.velocity[0] = playerBody.velocity[1] = playerBody.velocity[2] = 0
  }
  noa.entities.setPosition(noa.playerEntity, landHold)
}
async function applyDoc(doc, bootSpot) {
  applyDocN += 1
  let from = ''
  try { from = String(new Error().stack || '').split('\n').slice(2, 4).join(' | ') } catch (e) {}
  console.info('[bertopia] applyDoc #' + applyDocN + ' ' + from)
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
  let spot = finiteTriple(src.pos) || finiteTriple(src.spawn) || SPAWN.slice()
  const savedSpot = bootSpot !== undefined ? bootSpot : readSpot()
  if (savedSpot && savedSpot.world === WORLD) {
    const docAt = src.updatedAt ? Date.parse(src.updatedAt) : 0
    if (savedSpot.at > docAt) {
      const sPos = finiteTriple(savedSpot.pos)
      if (sPos && sPos[1] >= -60) spot = sPos
    }
  }
  pinSavedSpot(spot)
  const look = src && src.look
  if (Array.isArray(look) && look.length >= 2 && Number.isFinite(+look[0]) && Number.isFinite(+look[1])) setLook(+look[0], +look[1])
  else if (!finiteTriple(src && src.pos)) faceFirstSpawn()
  worldSpawn = finiteTriple(src.spawn) || SPAWN.slice()
  spawnSet = !!src.spawnSet
  protect = normProtect(src.protect)
  if (session) {
    shopsLive = false
    applyCreativeHotbar(src && src.creativeBar) // 2.5.506: restore this world's Creative hotbar
    const slice = fromDoc(src)
    slice.playedExtra = !!(
      (src.stations && Object.keys(src.stations).length) ||
      (Array.isArray(src.bots) && src.bots.length) ||
      (src.crops && typeof src.crops === 'object' && Object.keys(src.crops).length) ||
      (src.forage && typeof src.forage === 'object' && Object.keys(src.forage).length)
    )
    session.load(slice)
    rehydrateDecor()
    shopsLive = true
  }
  if (src.basics && basics) basics.load(src.basics)
  if (savedSpot && savedSpot.world === WORLD && savedSpot.clock && basics && basics.load) {
    const docAt = src.updatedAt ? Date.parse(src.updatedAt) : 0
    if (savedSpot.at > docAt) {
      basics.load(savedSpot.clock)
      paintDayClock()
    }
  }
  dropGifts()
  if (src.stations) stations.load(src.stations)
  if (session && session.recoverOrphans) session.recoverOrphans('')
  gifts = Object.assign({}, src && src.gifts)
  syncGlasses()
  grantSaplings()
  farm.load(src && src.crops)
  syncCrops(Date.now())
  forage.load(src && src.forage)
  Badges.load(src && src.badges) // 2.5.472
  CrewBadges.load(src && src.crew)
  syncForage(Date.now())
  bot.load(botsFrom(src))
  if (belts) belts.adopt()
  pondAid = false
  ensureStarterPond(src)
  seedOldBushes()
  if (session) paintModeChip()
  syncDropMeshes()
  circuitRescan()
  paintWorldName()
  showMakerTip()
  keepSavedSpot()
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
  bot.load([])
  if (belts) belts.clear()
  pondAid = true
  genVersion = GEN
  genSeen = {}
  saved.clear(); dirty = true; edits.clear(); paintUndo()
  changeLog.clearWorld().catch(() => {})
  noa.world.invalidateVoxelsInAABB({ base: [-2000, -200, -2000], max: [2000, 200, 2000] })
  if (session) applyCreativeHotbar(null) // 2.5.506: a fresh world does not inherit the last hotbar
  if (session && session.freshStart) session.freshStart()
  else if (session && session.clearLoose) session.clearLoose()
  if (basics && basics.freshDay) basics.freshDay()
  if (stations && stations.load) stations.load({})
  try { applySky() } catch (e) {}
  try { paintDayClock() } catch (e) {}
  if (learn && learn.freshGoals) learn.freshGoals()
  grantSaplings()
  grantStartKit()
  syncDropMeshes()
  clearSpot()
  noa.entities.setPosition(noa.playerEntity, SPAWN.slice())
  worldSpawn = SPAWN.slice()
  spawnSet = false
  protect = { size: 'medium', center: null }
  faceFirstSpawn()
  seedOldBushes()
  openedFrom = ''
  bakeSpawnChunk()
  paintWorldName()
  showMakerTip()
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
  const named = makerName(doc && doc.maker)
  if (named) bits.push(named)
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
  const touched = body.archiveBlocks > 0 || body.archiveBag > 0 || isMakerPreset(makerLive.preset) || (body.basics && Number(body.basics.day) > 1)
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
  const pic = icon ? menuIcon(icon) : null
  if (pic) ico.append(pic)
  const lab = document.createElement('span')
  lab.className = 'glbl'
  lab.textContent = label
  b.append(ico, lab)
  b.title = label
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
    host.append(menuTile(on ? 'boxcheck' : 'boxempty', t(on ? 'makerOn' : 'makerOff'), () => {
      makerLive.on = !on
      dirty = true
      save().catch(() => {})
      paintOldEntry(host, openList)
    }))
  }
  if (makerEnabled()) host.append(menuTile('spark', t('newWorld'), () => openMaker()))
  if (keys.length) host.append(menuTile('back', t('openOld'), () => { if (openList) openList() }))
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
    on: makerLive.on !== false,
    edited: !!makerLive.edited,
    genVersion,
  }
}
function applyMaker(raw) {
  if (!raw || typeof raw !== 'object') { makerLive = defaultMaker(); paintWorldName(); return }
  const preset = PRESETS.indexOf(raw.preset) >= 0 ? raw.preset : 'normal'
  makerLive = {
    preset,
    hills: clampStep(raw.hills == null ? 2 : raw.hills),
    water: clampStep(raw.water == null ? 2 : raw.water),
    trees: clampStep(raw.trees == null ? 2 : raw.trees),
    seed: raw.seed | 0,
    adj: raw.adj | 0,
    noun: raw.noun | 0,
    on: raw.on !== false,
    edited: !!raw.edited,
  }
  paintWorldName()
}
function paintWorldName() {
  const el = document.querySelector('.brand .tb-name')
  if (!el) return
  const named = makerName(makerLive)
  el.textContent = named || 'Bertopia'
}
function showMakerTip() {
  const key = tipKey(makerLive.preset)
  if (!key) return
  if (calm && calm.quiet()) return
  toast(t(key))
}
function bakeSpawnChunk() {
  if (!isMakerPreset(makerLive.preset)) return
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
    preset: PRESETS.indexOf(makerLive.preset) >= 0 ? makerLive.preset : 'normal',
    hills: clampStep(makerLive.hills),
    water: clampStep(makerLive.water),
    trees: clampStep(makerLive.trees),
    seed: makerLive.seed | 0,
    adj: makerLive.adj | 0,
    noun: makerLive.noun | 0,
    code: '',
  }
  if (!makerDraft.seed) makerDraft.seed = normSeed((Math.random() * 32000) | 0)
  const title = document.getElementById('sheet-title')
  if (title) title.textContent = t('newWorld')
  paintMaker(grid)
  const made = grid.querySelector('[data-maker-start]')
  if (made) requestAnimationFrame(() => { try { made.focus({ focusVisible: true }) } catch (e) { made.focus() } })
}
function makerSpin(text, fn) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'gtile'
  b.style.minWidth = '44px'
  b.style.minHeight = '44px'
  const name = text === '<' ? 'chevL' : text === '>' ? 'chevR' : ''
  if (name) {
    const pic = menuIcon(name)
    if (pic) b.append(pic)
    else b.textContent = text
  } else b.textContent = text
  b.title = text
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
  const choices = [
    ['normal', 'leaf', 'makerNormal'], ['flat', 'flat', 'makerFlat'], ['void', 'void', 'makerVoid'],
    ['islands', 'islands', 'makerIslands'], ['sky', 'sky', 'makerSky'], ['parkour', 'parkour', 'makerParkour'],
  ]
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
  const shuffle = menuTile('shuffle', t('makerShuffle'), () => {
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
  const share = document.createElement('div')
  share.className = 'wide'
  share.style.cssText = 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;min-height:44px'
  const shareLab = document.createElement('span')
  shareLab.className = 'glbl'
  shareLab.textContent = t('makerCode')
  const shareIn = document.createElement('input')
  shareIn.type = 'text'
  shareIn.dataset.shareCode = '1'
  shareIn.value = makerDraft.code || ''
  shareIn.placeholder = shareCode(makerDraft)
  shareIn.setAttribute('aria-label', t('makerCode'))
  shareIn.style.cssText = 'flex:1;min-width:160px;min-height:44px;background:#1f2b44;color:#E6EEF2;border:1px solid #22D3EE;border-radius:8px;padding:0 8px'
  shareIn.addEventListener('input', () => { makerDraft.code = shareIn.value })
  const use = makerSpin(t('makerUseCode'), () => {
    const parsed = parseShare(makerDraft.code || shareIn.value)
    if (!parsed) { toast(t('makerCodeBad')); return }
    makerDraft.preset = parsed.preset
    makerDraft.hills = parsed.hills
    makerDraft.water = parsed.water
    makerDraft.trees = parsed.trees
    makerDraft.seed = parsed.seed
    makerDraft.code = shareCode(parsed)
    paintMaker(g)
  })
  use.dataset.shareUse = '1'
  use.style.minHeight = '44px'
  share.append(shareLab, shareIn, use)
  g.append(share)
  if (makerLive.seed) {
    const have = document.createElement('p')
    have.className = 'gnote wide'
    have.dataset.liveShare = '1'
    have.textContent = makerLive.edited || !isMakerPreset(makerLive.preset) ? t('makerShareFile') : shareCode(makerLive)
    g.append(have)
  }
  const start = menuTile('check', t('makerStart'), () => { startMade() })
  start.style.minHeight = '44px'
  start.dataset.makerStart = '1'
  const back = menuTile('back', t('makerBack'), () => { if (panels) panels.open('world') })
  back.style.minHeight = '44px'
  g.append(start, back)
}
async function startMade() {
  if (!makerDraft) return
  if (!confirm(t('confirmFresh'))) return
  makerNext = {
    preset: PRESETS.indexOf(makerDraft.preset) >= 0 ? makerDraft.preset : 'normal',
    hills: clampStep(makerDraft.hills),
    water: clampStep(makerDraft.water),
    trees: clampStep(makerDraft.trees),
    seed: normSeed(makerDraft.seed),
    adj: makerDraft.adj | 0,
    noun: makerDraft.noun | 0,
    on: makerLive.on !== false,
    edited: false,
  }
  await resetWorld()
  try { if (panels && panels.dismiss) panels.dismiss() } catch (e) {}
  document.body.classList.remove('menu-open')
  try { sealPanels() } catch (e) {}
  if (!kidPause) {
    try { noa.setPaused(false) } catch (e) {}
    if (session) session.paused = false
  }
  revealWorld()
  freeLookForHud()
  showMakerTip()
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

// 2.5.310: keep the player's spot across a reload while signed out
const SPOT_KEY = 'bertopia-spot-v1'
let lastSpotWrite = 0
let spotReady = false
function writeSpot() {
  try {
    if (!spotReady) return
    if (!noa || !noa.playerEntity) return
    const p = noa.entities.getPosition(noa.playerEntity)
    if (!p || !Number.isFinite(p[0]) || !Number.isFinite(p[1]) || !Number.isFinite(p[2])) return
    if (p[1] < -60) return
    const look = [Math.round(noa.camera.heading * 1000) / 1000, Math.round(noa.camera.pitch * 1000) / 1000]
    const spot = {
      world: WORLD,
      pos: [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100, Math.round(p[2] * 100) / 100],
      look,
      at: Date.now(),
      clock: basics && basics.dump ? basics.dump() : null
    }
    localStorage.setItem(SPOT_KEY, JSON.stringify(spot))
    lastSpotWrite = Date.now()
  } catch (e) {}
}
function readSpot() {
  try {
    const raw = localStorage.getItem(SPOT_KEY)
    if (!raw) return null
    const s = JSON.parse(raw)
    if (!s || s.world !== WORLD) return null
    const pos = finiteTriple(s.pos)
    if (!pos || pos[1] < -60) return null
    return s
  } catch (e) { return null }
}
function clearSpot() {
  try { localStorage.removeItem(SPOT_KEY) } catch (e) {}
}
setInterval(() => {
  if (!noa || !noa.playerEntity) return
  if (Date.now() - lastSpotWrite > 5000) writeSpot()
}, 1000)

setInterval(() => { if (dirty && allowSave && saveLockHeld && !savePaused) save().catch((e) => { if (!(e && e.code === 'paused')) showNotSavedChip() }) }, 20000)
function flushSave() {
  clearTimeout(pinTimer); pinTimer = 0 // 2.5.440: flush the coalesced pin
  if (dirty) pinMachines()
  if (!(dirty && allowSave && !savePaused)) return
  save().catch((e) => { if (!(e && e.code === 'paused')) showNotSavedChip() })
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    writeSpot()
    flushSave()
    dropRightHold()
    dropLeft()
  } else {
    syncCrops(Date.now())
    syncForage(Date.now())
    if (!saveLockHeld && !lockPending) claimSaveLock()
try { mountSyncChip() } catch (e) {}
  }
})
window.addEventListener('pagehide', () => { writeSpot(); flushSave() })
claimSaveLock()
setInterval(() => { if (savePaused && !saveLockHeld && !lockPending) claimSaveLock() }, 3000)

function saveFailToast(e) {
  if (e && e.code === 'newer') toast(t('saveNewer'))
  else toast(t(e && e.code === 'held' ? 'saveKept' : 'saveFull'))
}
function updateSeen() {
  try { return localStorage.getItem('bert-update-seen') === VERSION } catch (e) { return false }
}
function markUpdateSeen() {
  try { localStorage.setItem('bert-update-seen', VERSION) } catch (e) {}
}
function paintUpdateChip() {
  const b = document.getElementById('update-chip')
  if (!b || b.hidden) return
  const word = t('updateReady')
  let lab = b.querySelector('[data-upd]')
  if (!lab) {
    b.replaceChildren()
    const ico = document.createElement('span')
    ico.setAttribute('aria-hidden', 'true')
    ico.textContent = '↻'
    lab = document.createElement('span')
    lab.dataset.upd = '1'
    b.append(ico, document.createTextNode(' '), lab)
  }
  lab.textContent = word
  b.setAttribute('aria-label', word)
}
function showUpdateChip() {
  if (updateSeen()) return
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
  laneAdd(b, 8)
  b.hidden = false
  paintUpdateChip()
  markUpdateSeen()
  layoutLane()
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
    const reg = await navigator.serviceWorker.getRegistration(__BLOX_DOOR__) // 2.5.473
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
  if (updateSeen()) return
  try {
    if (dirty && allowSave) await save()
  } catch (e) {
    saveFailToast(e)
  }
  try { await changeLog.flush() } catch (e) {}
  showUpdateChip()
})

const $ = (id) => document.getElementById(id)
let modeIcon = ''
function paintModeChip() {
  const chip = $('mode-chip')
  const creativeMode = !!(session && session.mode === 'creative' && !tableMode)
  const survivalMode = !tableMode && !!(session && session.mode === 'survival')
  if (chip) {
    const name = tableMode ? 'grid' : creativeMode ? 'create' : 'survive'
    const label = tableMode ? t('buildTable') : creativeMode ? t('creative') : t('survival')
    let ico = chip.querySelector('.gic')
    let lab = chip.querySelector('.mode-lab')
    if (!ico || !lab) {
      chip.replaceChildren()
      ico = document.createElement('span')
      ico.className = 'gic'
      lab = document.createElement('span')
      lab.className = 'mode-lab'
      chip.append(ico, lab)
      modeIcon = ''
    }
    if (modeIcon !== name) {
      modeIcon = name
      ico.replaceChildren()
      const pic = menuIcon(name)
      if (pic) ico.append(pic)
    }
    lab.textContent = label
    chip.title = label
    chip.setAttribute('aria-label', label)
    chip.hidden = !tableMode
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
    const psLab = ps.querySelector('.tl')
    if (psLab) psLab.textContent = t('survival')
    else ps.append(document.createTextNode(t('survival')))
    ps.title = t('survival')
  }
  if (pc) {
    pc.classList.toggle('on', creativeMode)
    pc.setAttribute('aria-pressed', String(creativeMode))
    const pcLab = pc.querySelector('.tl')
    if (pcLab) pcLab.textContent = t('creative')
    else pc.append(document.createTextNode(t('creative')))
    pc.title = t('creative')
  }
  document.body.classList.toggle('mode-creative', creativeMode)
}
let clockIcon = ''
function paintDayClock() {
  const btn = $('day-clock')
  if (!btn || !basics || !basics.face) return
  const face = basics.face()
  const ico = btn.querySelector('.gic')
  if (ico && clockIcon !== face.icon) {
    clockIcon = face.icon
    ico.replaceChildren()
    const pic = menuIcon(face.icon)
    if (pic) ico.append(pic)
  }
  const num = btn.querySelector('.day-num')
  const tim = btn.querySelector('.day-time')
  if (num) num.textContent = t('clockDay').replace('{n}', String(face.day))
  if (tim) tim.textContent = face.text
  btn.dataset.lock = face.locked ? 'day' : ''
  btn.dataset.phase = face.phase
  const label = face.locked ? t('alwaysDay') : t('clockDay').replace('{n}', String(face.day)) + ' · ' + face.text
  btn.setAttribute('aria-label', label)
}
function dayTipText(face) {
  if (!face || face.locked) return t('alwaysDay')
  if (face.phase === 'night' || face.phase === 'dawn') return t('clockMorning').replace('{n}', String(face.morningMin))
  return t('clockNight').replace('{n}', String(face.nightMin))
}
function showDayTip() {
  if (!basics || !basics.face) return
  toast(dayTipText(basics.face()))
}
function bindDayClock() {
  const btn = $('day-clock')
  if (!btn || btn.dataset.bound) return
  btn.dataset.bound = '1'
  btn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation() })
  btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); showDayTip() })
}
bindDayClock()
function armBrief() {
  if (!location.search.includes('brief=1')) return
  window.__brief = {
    give(item, n) {
      session.setMode('survival')
      session.give(item, n || 1)
      return session.bag.count(item)
    },
    hold(item) {
      session.holdItem(item)
      return session.selectedItem()
    },
    clear() {
      for (let i = 0; i < session.bag.slots.length; i++) session.bag.slots[i] = null
      session.paintHotbar()
    },
    open(id, key) { if (panels) panels.open(id, key) },
    close() { if (panels) panels.close() },
    box(item, n) {
      const key = '2,6,2'
      const slots = Array.from({ length: 18 }, () => null)
      slots[0] = { item: item, n: n || 1 }
      session.meta.set(key, { kind: 'box', slots: slots })
      if (panels) panels.open('box', key)
      return key
    },
    counter(item, n, price) {
      const key = '3,6,3'
      session.meta.set(key, { kind: 'vend', owner: 'you', slots: [{ item: item, n: n, price: price }, null, null, null], till: 0, sales: [], salesN: 0 })
      if (panels) panels.open('counter', key)
      return key
    },
    chip() {
      const el = document.getElementById('held-chip')
      if (!el) return null
      const r = el.getBoundingClientRect()
      const hot = document.getElementById('hotbar').getBoundingClientRect()
      const pill = document.getElementById('use-pill')
      const pr = pill.getBoundingClientRect()
      const stick = document.getElementById('stick-pad')
      const sr = stick.getBoundingClientRect()
      const hit = (a, b) => a.width > 2 && b.width > 2 && a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1
      return {
        hidden: el.hidden,
        text: el.innerText,
        aria: el.getAttribute('aria-label') || '',
        open: el.dataset.open || '',
        item: el.dataset.item || '',
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top),
        bottom: Math.round(r.bottom),
        nameW: Math.round((el.querySelector('.brief-top .brief-name') || {}).getBoundingClientRect ? el.querySelector('.brief-top .brief-name').getBoundingClientRect().width : 0),
        moreW: Math.round((el.querySelector('.brief-top ~ .brief-more') || el.querySelector('.brief-more')).getBoundingClientRect().width),
        cog: (el.querySelector('.brief-cog') || {}).textContent || '',
        cogW: Math.round((el.querySelector('.brief-cog') && !el.querySelector('.brief-cog').hidden ? el.querySelector('.brief-cog').getBoundingClientRect().width : 0)),
        pop: !!(el.querySelector('.brief-pop') && !el.querySelector('.brief-pop').hidden && el.querySelector('.brief-pop').getBoundingClientRect().height > 2),
        overHot: hit(r, hot),
        overPill: pill && !pill.hidden ? hit(r, pr) : false,
        overStick: getComputedStyle(stick).display !== 'none' ? hit(r, sr) : false,
      }
    },
    place(x, y, z) { return placeBed(x | 0, y | 0, z | 0) },
    lift(x, y, z) { return liftBed(x | 0, y | 0, z | 0) },
    voxel(x, y, z) { return getVoxel(x | 0, y | 0, z | 0) },
    meta(x, y, z) { return (session && session.meta && session.meta.get((x | 0) + ',' + (y | 0) + ',' + (z | 0))) || null },
    count(item) { return session && session.bag ? session.bag.count(item) : 0 },
    mesh() {
      const m = scene.getMeshByName && scene.getMeshByName('bunk')
      if (!m) return null
      m.computeWorldMatrix(true)
      const b = m.getHierarchyBoundingVectors(true)
      return { h: Math.round((b.max.y - b.min.y) * 100) / 100, dx: Math.round((b.max.x - b.min.x) * 100) / 100, dz: Math.round((b.max.z - b.min.z) * 100) / 100 }
    },
    ghost() {
      const spot = { x: 40, y: 6, z: 40 }
      const side = shopSpan(spot.x, spot.y, spot.z)
      const amber = shopBlocked(side) || !canReach([side.sx, side.sy, side.sz]) || !!getVoxel(spot.x, spot.y, spot.z)
      ghostBedScale(true)
      placeGhost.material = amber ? blockedMat : tealMat
      placeGhostSide.material = placeGhost.material
      const gy = 0.275
      const lp = noa.globalToLocal([spot.x + 0.5, spot.y + gy, spot.z + 0.5], null, ghostLocal)
      placeGhost.position.set(lp[0], lp[1], lp[2])
      placeGhost.setEnabled(true)
      const lp2 = noa.globalToLocal([side.sx + 0.5, side.sy + gy, side.sz + 0.5], null, ghostLocal2)
      placeGhostSide.position.set(lp2[0], lp2[1], lp2[2])
      placeGhostSide.setEnabled(true)
      return {
        on: placeGhost.isEnabled(),
        side: placeGhostSide.isEnabled(),
        sy: Math.round(placeGhost.scaling.y * 100) / 100,
        fill: placeGhost.material.alpha,
        amber,
      }
    },
    pos() { const p = noa.entities.getPosition(noa.playerEntity); return [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100, Math.round(p[2] * 100) / 100] },
    move(x, y, z) { noa.entities.setPosition(noa.playerEntity, [x, y, z]); if (playerBody) playerBody.velocity[1] = 0 },
    fly(on) { flying = !!on; if (playerBody) playerBody.gravityMultiplier = on ? 0 : 3.2 },
    night() { if (basics) { basics.setAlways(false); basics.seek(basics.nightAt()) } return basics && basics.phase ? basics.phase() : '' },
    sleep() { return sleepNow() },
    panel() {
      const title = document.getElementById('sheet-title')
      const tiles = [...document.querySelectorAll('#sheet .bed-tile')].map((el) => {
        const r = el.getBoundingClientRect()
        return { text: (el.textContent || '').replace(/\s+/g, ' ').trim(), h: Math.round(r.height), w: Math.round(r.width) }
      })
      return { title: title ? title.textContent : '', tiles }
    },
    icons() {
      const src = (el) => (el && (el.src || el.getAttribute('src'))) || ''
      const hot = document.querySelector('#hotbar [data-item="workbench"] img, #hotbar [data-item="woodshop"] img, #hotbar img.bench-png')
      return { hot: src(hot) }
    },
  }
  window.__briefReady = true
}
function armClock() {
  const q = location.search
  if (!q.includes('clock=')) return
  try { Rules.set('survival.daynight', q.includes('clock=lock') ? 'day' : 'cycle') } catch (e) {}
  if (basics) {
    basics.setAlways(false)
    if (q.includes('clock=lock')) basics.setAlways(true)
    if (q.includes('clock=night')) basics.seek(basics.nightAt())
    else if (q.includes('clock=dusk')) basics.seek(14 * 60 * 1000)
    else if (q.includes('clock=dawn')) basics.seek(19 * 60 * 1000)
    else basics.seek(Math.round(500 / 1440 * 20 * 60 * 1000))
    if (q.includes('day=3')) basics.setDay(3)
  }
  try { applySky() } catch (e) {}
  paintDayClock()
  window.__clockReady = true
}
window.__clock = {
  face: () => basics && basics.face ? basics.face() : null,
  text: () => { const el = $('day-clock'); return el ? (el.innerText || '').replace(/\s+/g, ' ').trim() : '' },
  icon: () => { const c = document.querySelector('#day-clock canvas'); return c ? c.dataset.icon : '' },
  tip: () => { const el = $('day-tip'); return el && !el.hidden ? el.textContent : '' },
  box: () => { const el = $('day-clock'); if (!el) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left) } },
  tap: () => showDayTip(),
  night: () => { if (!basics) return null; try { Rules.set('survival.daynight', 'cycle') } catch (e) {} basics.setAlways(false); basics.seek(basics.nightAt()); try { applySky() } catch (e) {} paintDayClock(); return basics.face() },
  dusk: () => { if (!basics) return null; try { Rules.set('survival.daynight', 'cycle') } catch (e) {} basics.setAlways(false); basics.seek(14 * 60 * 1000); try { applySky() } catch (e) {} paintDayClock(); return basics.face() },
  dawn: () => { if (!basics) return null; try { Rules.set('survival.daynight', 'cycle') } catch (e) {} basics.setAlways(false); basics.seek(19 * 60 * 1000); try { applySky() } catch (e) {} paintDayClock(); return basics.face() },
  sleep: () => sleepNow(),
  dump: () => basics && basics.dump ? basics.dump() : null,
  load: (doc) => { if (basics && basics.load) basics.load(doc); paintDayClock(); return basics.face() },
  lockDay: () => { try { Rules.set('survival.daynight', 'day') } catch (e) {} if (basics) basics.setAlways(false); try { applySky() } catch (e) {} paintDayClock(); return basics.face() },
}
function markSave(text) {
  const el = $('save-state')
  if (el) el.textContent = text
  const btn = $('save-btn')
  if (btn) {
    const saved = typeof text === 'string' && text.indexOf(t('saved')) === 0
    btn.classList.toggle('saved', saved)
    clearTimeout(markSave.t)
    if (saved) markSave.t = setTimeout(() => { if (btn.isConnected) btn.classList.remove('saved') }, 2000)
  }
  if (typeof text === 'string' && text.indexOf(t('saved')) === 0) paintSaveChip(navigator.onLine ? 'saved' : 'offline')
}
function placeSaveChip(el) {
  if (el && el.parentElement && el.parentElement.id === 'chip-lane') {
    el.style.left = ''
    el.style.top = ''
    el.style.right = ''
    el.style.bottom = ''
    el.style.transform = ''
    el.style.position = ''
    return
  }
  el.style.right = 'auto'
  el.style.bottom = 'auto'
  el.style.transform = 'none'
  el.style.pointerEvents = 'none'
  const w = el.offsetWidth || 128
  const h = el.offsetHeight || 44
  const boxes = []
  for (const sel of ['#pick-chip', '#hotbar', '#stick-pad', '.stickpad', '#jump-col', '#game-menu', '#fs-btn', '#pause-btn', '#day-clock', 'header.top', '#toast', '#play-chip', '#menu-btn', '.kb-bar', '#reach-hint']) {
    for (const n of document.querySelectorAll(sel)) {
      if (!n || n === el || n.hidden) continue
      const s = getComputedStyle(n)
      if (s.display === 'none' || s.visibility === 'hidden') continue
      const r = n.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) continue
      boxes.push(r)
    }
  }
  const pad = 8
  const clear = (x, y) => {
    const a = { l: x - pad, t: y - pad, r: x + w + pad, b: y + h + pad }
    if (a.l < 4 || a.t < 4 || a.r > innerWidth - 4 || a.b > innerHeight - 4) return false
    for (const b of boxes) {
      if (a.l < b.right && a.r > b.left && a.t < b.bottom && a.b > b.top) return false
    }
    return true
  }
  const spots = []
  const midX = Math.round((innerWidth - w) / 2)
  const midY = Math.round((innerHeight - h) / 2)
  spots.push([midX, midY])
  for (const top of [72, 112, 148, 8]) spots.push([midX, top], [12, top])
  for (let y = 8; y < innerHeight - h - 8; y += 20) spots.push([midX, y], [12, y])
  for (const [x, y] of spots) {
    if (!clear(x, y)) continue
    el.style.left = x + 'px'
    el.style.top = y + 'px'
    return
  }
  el.style.left = midX + 'px'
  el.style.top = midY + 'px'
}
let kidActed = false
for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, (e) => { if (e.isTrusted) kidActed = true }, { capture: true, passive: true })
function paintSaveChip(state) {
  const el = $('save-chip')
  if (!el) return
  if (!kidActed) return
  const saved = state === 'saved' || state === 'synced' || state === 'offline'
  const word = saved ? t('saved') : t('s2bSaving') // 2.5.384: the chip's own tick icon is the only tick (was a second '✓ ' in the word)
  el.hidden = false
  el.dataset.state = state || 'saved'
  const lab = el.querySelector('.sc-word')
  if (lab) lab.textContent = word
  el.setAttribute('aria-label', word)
  placeSaveChip(el)
  clearTimeout(paintSaveChip.hideT)
  if (saved) paintSaveChip.hideT = setTimeout(() => { if (el.isConnected) el.hidden = true }, 1500)
}
function toast(text, act) {
  if (calm) calm.say(text, act)
  else showToast(text, { act })
  seatToasts()
}
let woodTipOn = false
function clearWoodTip() {
  if (!woodTipOn) return
  woodTipOn = false
  const el = document.getElementById('toast')
  if (el && el.dataset.wood === '1') {
    el.hidden = true
    el.dataset.wood = ''
  }
}
function showWoodTip() {
  toast(t('toolFaster'))
  woodTipOn = true
  const el = document.getElementById('toast')
  if (el) el.dataset.wood = '1'
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
let lookHoldUntil = 0
let lockGainedAt = 0
let resumeSwallow = false
let shopsLive = false
let openMachineKey = ''
let muteUseKey = ''
let muteUseUntil = 0
let crouchHintN = 0
let playLockWanted = false
let playArmed = false
let lockAskedAt = 0
let lockTries = 0
let closingPlay = false
let awaitWorldClick = false
let actThisClick = false
let markPath = () => {}
let paintPath = () => {}
let learnRef = null
let lastPointer = null
let calmRepaint = false
calm = createCalm({
  t,
  creative: () => !!(session && session.mode === 'creative'),
  dirty: () => { dirty = true },
  icon: (step) => calmIcon(step),
  repaint: () => {
    if (calmRepaint) return
    calmRepaint = true
    try {
      if (session && session.mode === 'survival' && session.paintHotbar) session.paintHotbar()
      if (panels && panels.softRepaint) panels.softRepaint()
    } finally { calmRepaint = false }
  },
})
function calmIcon(step) {
  if (step === 'nice-log') return menuIcon('leaf')
  if (step === 'nice-make') return menuIcon('check')
  if (step === 'nice-place') return menuIcon('builds')
  if (step === 'nice-wall') return menuIcon('walls')
  if (step === 'bench') {
    const pic = document.createElement('canvas')
    pic.width = 32
    pic.height = 32
    const pen = pic.getContext('2d')
    pen.fillStyle = '#2DD4BF'
    pen.fillRect(6, 12, 20, 16)
    pen.fillStyle = '#3B82F6'
    pen.fillRect(8, 4, 16, 10)
    pen.fillStyle = '#FF8A1F'
    pen.fillRect(10, 7, 12, 3)
    return pic
  }
  const name = step === 'tree' ? 'bench' : step === 'craft' ? 'hotbar' : 'gear'
  return menuIcon(name)
}
session = createSession({
  t, toast, blocked: (id) => blockedToast(id), getVoxel,
  pos: () => noa.entities.getPosition(noa.playerEntity),
  heading: () => noa.camera.heading,
  markDirty: () => { dirty = true },
  saveNow: () => saveSoon(),
  beltFlow: (key) => belts ? belts.flow(key) : null,
  focusKey: () => openMachineKey,
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
  liftBed: (x, y, z) => liftBed(x | 0, y | 0, z | 0),
  sleepNow: () => sleepNow(),
  shopWall: (key) => (stations && stations.wallItems ? stations.wallItems(key) : []),
  shopClear: (key) => { if (stations && stations.clearShop) stations.clearShop(key) },
  shopsReady: () => shopsLive,
  assign: (id) => bagPick(typeof id === 'number' ? BLOCKS.find((b) => b[0] === id)?.[1] || 'stone' : id, selectedSlot),
  putPalette: (i, id) => putPalette(i, id),
  blockIcon: (id) => blockIcon(BLOCKS.find((b) => b[0] === id) || BLOCKS[2], ATLAS),
  flash: (name) => flashHeld(name),
  paintBar: () => { paintBar(); selectSlot(selectedSlot) },
  creativeHot: () => selectedSlot,
  creativeBlock: () => (wandSlot ? 0 : current || 0),
  setCreativeHot: (i) => {
    const n = Math.max(0, i | 0)
    if (!paletteIds.length) return
    selectedSlot = n % CREATIVE_HOT // 2.5.397
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
  hotN: () => calm.hotN(),
  hudQuiet: () => calm.quiet(),
  workbenchOn: () => calm.workbenchOn(),
  machinesOn: () => calm.machinesOn(),
  noteCalm: (step) => calm.note(step),
  cheer: (kind) => calm.cheer(kind),
  hudDump: () => calm.dump(),
  hudAdopt: (raw, played) => calm.adopt(raw, played),
  onMode: () => { calm.apply(); paintModeChip() },
  calmAll: () => calm.allOn(),
  setCalmAll: (on) => calm.setAll(on),
  dressChip: () => dressWalletChip(),
})
session.mountEnergy(noa)
Effects.mount(document.getElementById('energy-bar'), { toast, lang: () => LANG })
holdWalletChip()
watchWalletChip()
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
function grantStartKit() {
  if (!session || !session.give) return
  if (session.mode && session.mode !== 'survival') return
  if (gifts.startKit) return
  session.give('stick', 4)
  session.give('berry', 1)
  gifts.startKit = true
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
  if (!text) return
  toast(text)
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
  flagDay: (on) => { document.documentElement.dataset.alwaysDay = on ? '1' : '0'; paintDayClock() },
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
const mobs = createMobs({
  toLocal: (p) => noa.globalToLocal(p, null, []),
  getVoxel, edit,
  playerPos: () => noa.entities.getPosition(noa.playerEntity),
  isNight: () => basics && basics.phase && basics.phase() === 'night',
  toast, t,
  inSafeZone,
  plotInterior,
  litBedNear: (x, z) => {
    for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let y = 0; y <= 16; y++) {
      if (getVoxel((x | 0) + dx, y, (z | 0) + dz) === ID.bunk) return true
    }
    return false
  },
  isBuildWorld: () => tableMode,
  isCreative: () => !!(session && session.mode === 'creative'),
  rule: () => Rules.dump(),
  takeCommon: () => {
    if (!session || !session.bag || !session.spend) return ''
    const common = ['dirt', 'stone', 'sand', 'gravel', 'planks', 'stick', 'coal', 'leaves', 'cobble', 'log']
    for (const id of common) {
      if (session.bag.count(id) > 0 && session.spend(id, 1)) return id
    }
    return ''
  },
  giveItem: (item, n) => { if (session && session.give) session.give(item, n || 1) },
  ground: () => (session && session.groundDrops ? session.groundDrops() : null),
  hurtSuit: (n, x, z) => {
    if (inSafeZone(x | 0, z | 0)) return
    suit = Math.max(0, suit - (n | 0))
    paintSuit()
  },
  lastBonk: () => lastBonk,
  scene: () => { try { return noa.rendering.getScene() } catch (e) { return null } },
  addMesh: (mesh) => { try { noa.rendering.addMeshToScene(mesh, false) } catch (e) {} },
})
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
  toast(t('make') + ' ' + t(id))
  return true
}, craftOk: (id) => !session || !session.craftOk || session.craftOk(id), rules: (next) => session && session.shopRules ? session.shopRules(next) : { path: 'choose', help: false, required: false }, best: () => session && session.bestBed ? session.bestBed() : null, teacher: () => teacherOn(), belt: (key) => belts ? belts.flow(key) : null })
function beltKey(x, y, z) { return x + ',' + y + ',' + z }
function beltBuf(rec, bin) {
  const k = bin ? 'bin' : 'bout'
  if (!Array.isArray(rec[k])) rec[k] = []
  return rec[k]
}
function pushBuf(slots, item) {
  if (!item) return false
  for (const s of slots) if (s && s.item === item && s.n < 64) { s.n += 1; return true }
  if (slots.length >= 8) return false
  slots.push({ item, n: 1 })
  return true
}
function pullBuf(slots) {
  const i = slots.findIndex((s) => s && s.n > 0)
  if (i < 0) return ''
  const item = slots[i].item
  slots[i].n -= 1
  if (slots[i].n <= 0) slots.splice(i, 1)
  return item
}
function benchRec(x, y, z) {
  if (!session || !session.meta) return null
  const key = beltKey(x, y, z)
  let rec = session.meta.get(key)
  if (!rec || typeof rec !== 'object') rec = { kind: 'workbench', face: readFace(x, y, z) }
  beltBuf(rec, true)
  beltBuf(rec, false)
  session.meta.set(key, rec)
  return rec
}
belts = createBelts({
  t,
  mark: () => { dirty = true },
  metaGet: (key) => session && session.meta ? session.meta.get(key) : null,
  metaSet: (key, rec) => { if (session && session.meta) session.meta.set(key, rec) },
  metaDelete: (key) => { if (session && session.meta) session.meta.delete(key) },
  metaEntries: () => session && session.meta ? [...session.meta.entries()] : [],
  faceToward: (x, z) => faceTowardPlayer(x, z),
  machineFace: (x, y, z) => readFace(x, y, z),
  machine(x, y, z) {
    const id = getVoxel(x, y, z)
    if (id === ID.oven) return 'oven'
    if (id === ID.workbench) return 'bench'
    if (id === ID.box) return 'box'
    return ''
  },
  ready: (x, y, z) => chunkSettled(x, y, z),
  solid: (x, y, z) => getVoxel(x, y, z) === ID.conveyor,
  anchors() {
    const p = noa.entities.getPosition(noa.playerEntity)
    const list = [{ x: p[0], y: p[1], z: p[2] }]
    try {
      for (const b of bot.dump()) list.push({ x: b.x + 0.5, y: b.y, z: b.z + 0.5 })
    } catch (e) {}
    return list
  },
  pullOven: (x, y, z) => stations.pullOut(beltKey(x, y, z)) || '',
  ovenCounts: (x, y, z) => stations.slotCounts(beltKey(x, y, z)),
  pushBox(x, y, z, item) {
    const rec = session && session.meta && session.meta.get(beltKey(x, y, z))
    if (!rec || !Array.isArray(rec.slots)) return false
    const put = putInSlots(rec.slots, item, 1)
    if (!put || put.left) return false
    rec.slots = put.slots
    return true
  },
  pullBox(x, y, z) {
    const rec = session && session.meta && session.meta.get(beltKey(x, y, z))
    if (!rec || !rec.slots) return ''
    for (let i = 0; i < rec.slots.length; i++) {
      const s = rec.slots[i]
      if (!s || !s.n) continue
      const item = s.item
      s.n -= 1
      if (s.n <= 0) rec.slots[i] = null
      return item
    }
    return ''
  },
  boxCounts(x, y, z) {
    const rec = session && session.meta && session.meta.get(beltKey(x, y, z))
    let n = 0
    if (rec && rec.slots) for (const s of rec.slots) if (s && s.n) n += s.n
    return { inn: 0, outn: n }
  },
  pushBench(x, y, z, item) {
    const rec = benchRec(x, y, z)
    return !!(rec && pushBuf(rec.bin, item))
  },
  pullBench(x, y, z) {
    const rec = benchRec(x, y, z)
    return rec ? pullBuf(rec.bout) : ''
  },
  benchCounts(x, y, z) {
    const rec = benchRec(x, y, z)
    const sum = (rows) => (rows || []).reduce((n, s) => n + (s && s.n ? s.n : 0), 0)
    return rec ? { inn: sum(rec.bin), outn: sum(rec.bout) } : { inn: 0, outn: 0 }
  },
  craftBench(x, y, z) {
    const rec = benchRec(x, y, z)
    if (!rec) return false
    return !!craftOnce(rec.bin, rec.bout)
  },
  hintDone() {
    try { localStorage.setItem('bloxbert-belt-hint', 'done') } catch (e) {}
    const hint = document.getElementById('menu-hint')
    if (hint && hint.classList.contains('belt-on')) hint.hidden = true
    dropTip('belt')
  },
})
function showBeltHint() {
  try { if (localStorage.getItem('bloxbert-belt-hint') === 'done') return } catch (e) { return }
  const hint = document.getElementById('menu-hint')
  if (!hint) return
  hint.hidden = false
  hint.classList.add('belt-on')
  hint.replaceChildren()
  const arrow = document.createElement('span')
  arrow.className = 'belt-arrow'
  arrow.setAttribute('aria-hidden', 'true')
  arrow.textContent = '➤'
  const words = document.createElement('span')
  words.textContent = t('beltHint')
  hint.append(arrow, words)
  holdTip('belt', hint, () => hint.isConnected && !hint.hidden && hint.classList.contains('belt-on'))
}
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
  rebindSaveLock()
  session.setMode(m)
  paintModeChip()
  await load()
  if (panels) panels.close()
}
let tourAutoOpen = false
function releaseLook(opts) {
  selfUnlock = !!document.pointerLockElement
  document.body.classList.add('menu-open')
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
  try { if (document.pointerLockElement) document.exitPointerLock() } catch (e) {}
  try { noa.container.setPointerLock(false) } catch (e) {}
  if (!(opts && opts.keepWorld)) {
    try { noa.setPaused(true) } catch (e) {}
  }
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
let lastInputPointer = false // 2.5.391
window.addEventListener('pointerdown', () => { lastInputPointer = true }, true)
window.addEventListener('keydown', () => { lastInputPointer = false }, true)
function anyCard() {
  const door = $('door-opt')
  const inspect = $('inspect-card')
  const about = $('about')
  const sheet = $('sheet')
  const cog = document.getElementById('cog-card')
  return !!((door && !door.hidden) || (inspect && !inspect.hidden) || (about && !about.hidden) || (sheet && !sheet.hidden) || (cog && !cog.hidden))
}
function focusBtn(btn) {
  if (!btn) return
  try { btn.focus({ focusVisible: true }) } catch (e) { try { btn.focus() } catch (err) {} }
  btn.style.outline = '3px solid #22D3EE'
  btn.style.outlineOffset = '2px'
}
function hidePlayChip() {
  const el = $('play-chip')
  if (!el) return
  window.__playChipGone = true
  if (document.activeElement === el) {
    const canvas = noa.container && noa.container.canvas
    if (canvas) { try { canvas.focus({ preventScroll: true }) } catch (e) { canvas.focus() } }
  }
  el.hidden = true
  layoutLane()
}
function showPlayChip() {
  const el = $('play-chip')
  if (!el) return
  if (window.__playChipGone) return
  el.textContent = '▶ ' + t(TOUCH_UI ? 'tapToPlay' : 'clickToPlay')
  el.setAttribute('aria-label', t(TOUCH_UI ? 'tapToPlay' : 'clickToPlay'))
  el.hidden = false
  layoutLane()
}
function startFromChip() {
  if (tableMode || anyCard()) return
  document.body.classList.add('playing')
  if (TOUCH_UI) { hidePlayChip(); return }
  beginKeyPlay()
}
function beginKeyPlay() {
  if (TOUCH_UI || tableMode) return
  playArmed = true
  awaitWorldClick = false
  hidePlayChip()
  document.body.classList.remove('menu-open')
  if (!kidPause) {
    try { noa.setPaused(false) } catch (e) {}
    if (session) session.paused = false
  }
  const canvas = noa.container && noa.container.canvas
  if (canvas) { try { canvas.focus({ preventScroll: true }) } catch (e) { canvas.focus() } }
  grabLock()
}
function revealWorld() {
  if (tableMode || kidPause) return
  document.body.classList.add('playing')
  playArmed = true
  awaitWorldClick = false
  hidePlayChip()
  document.body.classList.remove('menu-open')
  try { noa.setPaused(false) } catch (e) {}
  if (session) session.paused = false
  genBurstUntil = performance.now() + 2200
  const world = noa.world
  const prevTick = world.maxProcessingPerTick
  const prevRender = world.maxProcessingPerRender
  world.maxProcessingPerTick = 50
  world.maxProcessingPerRender = 24
  const started = performance.now()
  const stop = started + 2200
  let caught = false
  const step = () => {
    if (world.playerChunkLoaded) caught = true
    if ((caught && performance.now() > started + 500) || performance.now() > stop) {
      world.maxProcessingPerTick = prevTick
      world.maxProcessingPerRender = prevRender
      return
    }
    requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
  const canvas = noa.container && noa.container.canvas
  if (canvas) { try { canvas.focus({ preventScroll: true }) } catch (e) { canvas.focus() } }
}
function freeLookForHud() {
  if (TOUCH_UI || tableMode) return
  playArmed = true
  playLockWanted = false
  awaitWorldClick = true
  armResume = 0
  lockTries = 0
  selfUnlock = true
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
  try { if (document.pointerLockElement) document.exitPointerLock() } catch (e) {}
  try { noa.container.setPointerLock(false) } catch (e) {}
  showPlayChip()
}
function playKeyTarget(e) {
  const chip = $('play-chip')
  const canvas = noa.container && noa.container.canvas
  if (chip && !chip.hidden && (e.target === chip || document.activeElement === chip)) return true
  return !!(canvas && (e.target === canvas || document.activeElement === canvas))
}
function clearLookAccum() {
  try { noa.inputs.pointerState.dx = 0; noa.inputs.pointerState.dy = 0 } catch (e) {}
}
function swallowing() { return !actThisClick && !TOUCH_UI && performance.now() < lockSwallowUntil }
function armActLock() {
  if (TOUCH_UI || tableMode) { awaitWorldClick = false; return }
  if (actThisClick) return
  actThisClick = true
  awaitWorldClick = false
  hidePlayChip()
  grabLock()
  setTimeout(() => { actThisClick = false }, 220)
}
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
  if (!el || !el.requestPointerLock) { playLockWanted = false; armResume = 0; if (!playArmed) showPlayChip(); return }
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
      armResume = 0
      if (!playArmed) showPlayChip()
    })
  } catch (e) {}
}
function resumePlay() {
  const how = closeHow || 'gesture'
  closeHow = ''
  if (anyCard()) return
  cardClosedAt = performance.now()
  document.body.classList.remove('menu-open')
  if (!kidPause) {
    try { noa.setPaused(false) } catch (e) {}
    if (session) session.paused = false
  }
  if (TOUCH_UI) { hidePlayChip(); return }
  if (how === 'key') {
    playLockWanted = false
    armResume = 0
    lockTries = 0
    hidePlayChip()
    return
  }
  playLockWanted = false
  armResume = 0
  lockTries = 0
  awaitWorldClick = true
  try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
  try { noa.container.setPointerLock(false) } catch (e) {}
  showPlayChip()
}
function closePlay(how) {
  if (closingPlay) return
  closingPlay = true
  try {
    const sheet = $('sheet')
    const fromMenu = !!(sheet && !sheet.hidden && sheet.dataset.panel === 'menu')
    if (fromMenu) closeHow = 'menu'
    else if (how) closeHow = how
    if (!closeHow) closeHow = 'gesture'
    if (openMachineKey) {
      muteUseKey = openMachineKey
      muteUseUntil = performance.now() + 300
    }
    if (sheet && !sheet.hidden && sheet.dataset.panel === 'woodshop') window.__shopClosedAt = performance.now()
    openMachineKey = ''
    hideDoorCard()
    const about = $('about')
    if (about) about.hidden = true
    const inspect = $('inspect-card')
    if (inspect) inspect.hidden = true
    if (panels && panels.dismiss) panels.dismiss()
    if (sheet) sheet.hidden = true
    resumePlay()
  } finally { closingPlay = false }
}
function eatResume(e) {
  if (swallowing()) return false
  if (!armResume) return false
  if (TOUCH_UI || (e && e.pointerType === 'touch')) { armResume = 0; return false }
  if (document.pointerLockElement || noa.container.hasPointerLock) { armResume = 0; hidePlayChip(); return false }
  armResume = 0
  hidePlayChip()
  grabLock()
  return true
}
function eatResumeClick() {
  if (TOUCH_UI || !resumeSwallow) return false
  resumeSwallow = false
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
  g.append(menuTile('camera', t('classSnap'), () => { classSnap() }))
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
  lastPointer: () => lastInputPointer, // 2.5.393
  t, toast,
  touch: () => TOUCH_UI,
  workbenchOn: () => calm.workbenchOn(),
  paintBack: () => paintBackTab(),
  save: () => saveClicked(),
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
  startPlay: () => { closePlay('key'); beginKeyPlay() },
  onClose: () => resumePlay(),
  onOpen: () => {
    openMachineKey = ''
    releaseLook({ keepWorld: tourAutoOpen })
    requestAnimationFrame(() => { const b = document.querySelector('#sheet button'); if (lastInputPointer) { try { if (b) b.focus({ preventScroll: true, focusVisible: false }) } catch (e) {} } else focusBtn(b) }) // 2.5.391: opened by mouse/touch -> focus Menu quietly, no big ring over the header; keyboard keeps the ring
  },
  paintBag: (g) => session.paintBag(g),
  clearBag: () => { if (session && session.clearBagPick) session.clearBagPick() },
  paintCraft: (g) => session.paintCraft(g),
  paintShop: (g) => session.paintShop(g),
  paintWallet: (g) => session.paintWallet(g),
  paintSettings: (g) => { paintPackLook(g); paintTextOpts(g); paintPickers(g); session.paintSettings(g); paintPvpSettings(g); paintLook(g) },
  paintTeacher: (g) => session.paintTeacher(g),
  paintRules: (g) => { Rules.useLang(LANG); paintRules(g, { lang: LANG, markDirty: () => { dirty = true }, save: () => save() }) },
  rulesWord: () => rulesWord(LANG),
  worldRules: () => showRulesCard({ force: true, lang: LANG, world: WORLD }),
  paintPrices: (g) => session.paintPrices(g),
  paintCounter: (g, key) => session.paintCounter(g, key),
  paintBunk: (g, key) => session.paintBunk(g, key),
  paintBox: (g, key) => session.paintBox(g, key),
  tools: () => equipWand(),
  leave: async () => { await save(); location.href = '/' },
  paintBuilds: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('myBuilds') })),
  paintRewind: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('undoMinutes') })),
  paintSnaps: (g) => g.append(Object.assign(document.createElement('p'), { className: 'gnote', textContent: t('snapshots') })),
  paintTour: (g) => learn.paintTour(g),
  paintGoals: (g) => learn.paintGoals(g),
  paintA11y: (g) => learn.paintA11y(g),
  paintLog: (g) => {
    const parts = (v) => String(v).split('.').map((n) => parseInt(n, 10) || 0)
    const byNewest = (a, b) => {
      const aa = parts(a.v), bb = parts(b.v)
      const n = Math.max(aa.length, bb.length)
      for (let i = 0; i < n; i++) {
        const d = (bb[i] || 0) - (aa[i] || 0)
        if (d) return d
      }
      return 0
    }
    const merged = []
    for (const row of CHANGELOG.slice().sort(byNewest)) {
      if (row.dev) continue
      let cur = merged[merged.length - 1]
      if (!cur || cur.v !== row.v) {
        cur = { v: row.v, lines: {} }
        merged.push(cur)
      }
      for (const lang of Object.keys(row.lines)) {
        cur.lines[lang] = (cur.lines[lang] || []).concat(row.lines[lang] || [])
      }
    }
    for (const row of merged) {
      const p = document.createElement('p')
      p.className = 'gnote'
      const raw = row.lines[LANG] || row.lines.en || []
      const lead = row.v + ' — '
      const lines = raw.map((line) => {
        const s = String(line)
        return s.startsWith(lead) ? s.slice(lead.length) : s
      }).join(' ')
      const ver = document.createElement('span')
      ver.className = 'log-v'
      ver.textContent = row.v
      ver.style.cssText = 'color:#22D3EE;font-weight:800;margin-inline-end:8px'
      p.append(ver)
      if (row.v === VERSION) {
        const here = document.createElement('span')
        here.className = 'log-here'
        here.textContent = t('youAreHere')
        here.style.cssText = 'display:inline-block;margin-inline-end:8px;padding:0 8px;border:1px solid #22D3EE;border-radius:999px;font-size:13px;line-height:1.6;color:#22D3EE'
        p.append(here)
      }
      p.append(document.createTextNode(lines))
      g.append(p)
    }
  },
  paintStation: (g, key, kind) => stations.paint(g, key || '0,5,0', kind || 'oven'),
  notes: () => learn.notes(),
  holdTour: () => holdTour(),
})
const FUEL_ITEMS = { planks: 1, log: 1, coal: 1, pinecone: 1 }
mountSlotQol({
  bag: () => session && session.bag,
  cap: (item) => (ITEMS[item] && ITEMS[item].stack) || 64,
  name: (item) => t(item),
  t,
  survival: () => !session || session.mode === 'survival',
  panel: () => (panels && panels.openPanel) || '',
  paintHotbar: () => { if (session && session.paintHotbar) session.paintHotbar() },
  repaint: () => { if (panels && panels.softRepaint) panels.softRepaint() },
  save: () => { if (typeof noteMachine === 'function') noteMachine() },
  spill: (item, n) => { if (session && session.give) session.give(item, n) },
  boxSlots: (key) => {
    const rec = session && session.meta && session.meta.get(key)
    return rec && rec.slots
  },
  machine: (key) => (stations && stations.dump ? stations.dump()[key] : null),
  isFuel: (item) => !!FUEL_ITEMS[item],
  isSmelt: (item) => RECIPES.some((r) => r.at === 'oven' && r.in.length === 1 && r.in[0][0] === item),
  loadFuel: (key, item) => !!(stations && stations.addFuel && stations.addFuel(key, item)),
  loadInput: (key, item) => {
    const recipe = RECIPES.find((r) => r.at === 'oven' && r.in.length === 1 && r.in[0][0] === item)
    if (!recipe || !stations) return false
    const raw = stations.dump()[key] || {}
    if (raw.left > 0) return !!stations.addInput(key, recipe.id)
    return !!stations.arm(key, recipe.id)
  },
  takeOutput: (key) => (stations && stations.take ? stations.take(key) : ''),
  recipes: () => RECIPES,
  craftMany: (recipe) => !!(session && session.craftMany && session.craftMany(recipe, 64)),
  toolOf: (item) => (ITEMS[item] && ITEMS[item].tool) || '',
  fillFacts: (host, spec) => session && session.fillFacts && session.fillFacts(host, spec),
})
let hintOwner = ''
const hintQ = []
function pathOpen() {
  const el = document.getElementById('path-chip')
  return !!(el && !el.hidden && !el.classList.contains('path-out'))
}
function hintTaken() {
  if (hintOwner === 'menu' || hintOwner === 'bag') return true
  const hint = document.getElementById('menu-hint')
  return !!(hint && !hint.hidden)
}
function queueHint(kind) {
  if (!kind || hintOwner === kind || hintQ.indexOf(kind) >= 0) return
  hintQ.push(kind)
}
function claimHint(kind) {
  if (kind === 'path') {
    const hint = document.getElementById('menu-hint')
    if (hint && !hint.hidden) {
      hint.hidden = true
      const prev = hintOwner === 'bag' ? 'bag' : 'menu'
      if (hintOwner === 'menu' || hintOwner === 'bag') hintOwner = ''
      queueHint(prev)
    }
  }
  hintOwner = kind
  const i = hintQ.indexOf(kind)
  if (i >= 0) hintQ.splice(i, 1)
}
function pumpHints() {
  if (hintOwner) return
  while (hintQ.length) {
    const next = hintQ.shift()
    if (next === 'bag') { if (showBagHint()) return; continue }
    if (next === 'menu') { if (showMenuHint()) return; continue }
    if (next === 'path') { if (learn) learn.paintPath(); return }
  }
}
function releaseHint(kind) {
  if (hintOwner === kind) hintOwner = ''
  const i = hintQ.indexOf(kind)
  if (i >= 0) hintQ.splice(i, 1)
  if (releaseHint.busy) return
  releaseHint.busy = true
  try { pumpHints() } finally { releaseHint.busy = false }
}
function showMenuHint() {
  try { if (localStorage.getItem('bloxbert-menu-hint')) return false } catch (e) { return false }
  if (calm && calm.quiet()) return false
  try { localStorage.setItem('bloxbert-menu-hint', 'done') } catch (e) {}
  toast(TOUCH_UI ? t('menuHintTouch') : t('menuHint'))
  return false
}
function dropMenuHint() {
  try { localStorage.setItem('bloxbert-menu-hint', 'done') } catch (e) {}
  const hint = $('menu-hint')
  if (hint) hint.hidden = true
  const mi = hintQ.indexOf('menu')
  if (mi >= 0) hintQ.splice(mi, 1)
  if (hintOwner === 'menu' || hintOwner === 'bag') {
    const owner = hintOwner
    hintOwner = ''
    const oi = hintQ.indexOf(owner)
    if (oi >= 0) hintQ.splice(oi, 1)
    pumpHints()
  }
}
const learn = createLearn({
  t, toast, close: () => panels.close(),
  openTour: () => { tourAutoOpen = true; try { panels.open('tour') } finally { tourAutoOpen = false } },
  panel: () => (panels && panels.openPanel) || '',
  survival: () => session && session.mode === 'survival',
  touch: () => TOUCH_UI,
  hudQuiet: () => calm && calm.quiet(),
  setBright: (on) => basics && basics.setBright(on),
  bright: () => !!(basics && basics.bright),
  pay: (n) => session && session.wallet && session.wallet.post({ kind: 'goal', cogs: n, by: 'you' }),
  world: () => WORLD,
  count: (item) => (session && session.bag ? session.bag.count(item) : 0),
  plankOwned: () => (session && session.plankOwned ? session.plankOwned() : 0),
  makeGoal: (id) => !!(session && session.makeGoal && session.makeGoal(id)),
  hintTaken: () => hintTaken(),
  queueHint: (kind) => queueHint(kind),
  claimHint: (kind) => claimHint(kind),
  releaseHint: (kind) => releaseHint(kind),
  laneAdd, laneRelease,
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
const WAND_MODES = ['select', 'fill', 'walls', 'copy', 'paste']
const WAND_ICON = { select: 'select', fill: 'fill', walls: 'walls', copy: 'copy', paste: 'paste' }
const WAND_KEY = { select: 'wandSelect', fill: 'wandFill', walls: 'wandWalls', copy: 'wandCopy', paste: 'wandPaste' }
const WAND_RGB = {
  select: [0.13, 0.83, 0.93],
  fill: [1, 0.54, 0.12],
  walls: [0.90, 0.71, 0.13],
  copy: [0.90, 0.96, 1],
  paste: [0.18, 0.83, 0.75],
}
let wandMode = 'select'
let wandSlot = false
heldHeaderOn = true
paintHeldHeader()
let paintId = 0
let wandWas = false
let wandPainted = ''
let wandPress = null
let wandLine = null
function wandHeld() {
  if (tableMode || !session) return false
  if (session.mode === 'survival') return !!(session.selectedItem && session.selectedItem() === 'buildWand')
  return !!wandSlot
}
function rememberPaint() {
  if (!session || wandHeld()) return
  if (session.mode === 'survival') {
    const key = session.selectedItem && session.selectedItem()
    const id = key && ITEMS[key] && ITEMS[key].block
    if (id) paintId = id
  } else if (current) paintId = current
}
function paintHeldWandIcon() {
  const btn = document.querySelector('#hotbar [data-item="buildWand"]')
  if (!btn) return
  const next = wandCanvas(wandMode)
  const canvas = btn.querySelector('canvas')
  if (canvas) canvas.replaceWith(next)
  else {
    const sw = btn.querySelector('.sw')
    if (sw) sw.append(next)
    else btn.prepend(next)
  }
}
function paintWandPill() {
  const pill = $('wand-pill')
  if (!pill) return
  const on = wandHeld()
  pill.hidden = !on
  syncHudBusy()
  if (!on) return
  const modeBtn = $('wand-mode')
  if (modeBtn) {
    modeBtn.replaceChildren()
    const ico = document.createElement('span')
    ico.className = 'gic'
    const pic = menuIcon(WAND_ICON[wandMode] || 'select')
    if (pic) ico.append(pic)
    const lab = document.createElement('span')
    lab.className = 'glbl'
    lab.textContent = t(WAND_KEY[wandMode] || 'wandSelect')
    modeBtn.append(ico, lab)
    modeBtn.title = lab.textContent
    modeBtn.setAttribute('aria-label', lab.textContent)
  }
  const rgb = WAND_RGB[wandMode] || WAND_RGB.select
  pill.style.setProperty('--wand', 'rgb(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' + Math.round(rgb[2] * 255) + ')')
  paintHeldWandIcon()
  wandPainted = wandMode
}
function noteWandTip() {
  try { if (localStorage.getItem('bloxbert-wand-tip') === '1') return } catch (e) { return }
  try { localStorage.setItem('bloxbert-wand-tip', '1') } catch (e) {}
  showCard(t('wandTip'))
}
function syncWandUi() {
  syncHudBusy()
  const on = wandHeld()
  if (!on) rememberPaint()
  if (on && !wandWas) noteWandTip()
  if (on !== wandWas || (on && wandPainted !== wandMode)) paintWandPill()
  if (!on && wandWas) {
    const pill = $('wand-pill')
    if (pill) pill.hidden = true
  }
  wandWas = on
}
function cycleWand(dir) {
  const i = WAND_MODES.indexOf(wandMode)
  wandMode = WAND_MODES[(i + (dir || 1) + WAND_MODES.length) % WAND_MODES.length]
  paintWandPill()
}
function setWandMode(name) {
  if (WAND_MODES.indexOf(name) < 0) return wandMode
  wandMode = name
  paintWandPill()
  return wandMode
}
function equipWand() {
  if (!session) return false
  if (session.mode !== 'survival') return selectWandSlot()
  if (session.bag.count('buildWand') < 1) { toast(t('wandNeed')); return false }
  session.holdItem('buildWand')
  paintWandPill()
  return true
}
function selectWandSlot() {
  if (!session || session.mode === 'survival') return equipWand()
  if (session.bag.count('buildWand') < 1) session.give('buildWand', 1)
  wandSlot = true
  paintBar()
  paintWandPill()
  const el = $('current')
  if (el) el.textContent = t('wandShort') || t('buildWand')
  flashHeld(t('buildWand'))
  return true
}
function wandCorner(which, cell) {
  if (!cell) { toast(t('tapCorner')); return }
  if (which === 1) {
    tools.setCorners(cell, null)
    toast(t('cornerA'))
  } else {
    const a = tools.cornerA()
    if (!a) { toast(t('tapCorner')); return }
    tools.setCorners(a, cell)
    const bx = tools.box()
    if (bx && (bx.w > 64 || bx.h > 32 || bx.l > 64)) {
      tools.setCorners(a, null)
      toast(t('tooBig'))
      return
    }
    toast(tools.tSize() || t('cornerA'))
  }
  paintWandBox()
}
function wandDo() {
  if (!tools.box()) { toast(t('tapCorner')); return null }
  if (wandMode === 'select') { toast(tools.tSize()); return tools.box() }
  if (wandMode === 'copy') {
    const clip = tools.copy()
    if (clip) toast(t('wandCopy'))
    return clip
  }
  const id = paintId || current || 0
  if ((wandMode === 'fill' || wandMode === 'walls') && !id) { toast(t('pickBlock') || 'Pick a block in your hotbar first'); return null }
  const staged = tools.act(wandMode, { id })
  if (!staged) return null
  return tools.confirm()
}
function wandCancel() {
  tools.clearBox()
  paintWandBox()
}
function paintWandBox() {
  if (!wandLine) return
  if (!wandHeld()) { wandLine.setEnabled(false); return }
  const full = tools.box()
  const mark = full ? null : tools.cornerA()
  const bx = full || (mark && { x0: mark[0], y0: mark[1], z0: mark[2], x1: mark[0], y1: mark[1], z1: mark[2], w: 1, h: 1, l: 1 })
  if (!bx) { wandLine.setEnabled(false); return }
  const rgb = WAND_RGB[wandMode] || WAND_RGB.fill
  wandLine.color.set(rgb[0], rgb[1], rgb[2])
  if (!full && mark) wandLine.scaling.set(1.3, 1.3, 1.3)
  else wandLine.scaling.set(bx.w, bx.h, bx.l)
  const cx = (bx.x0 + bx.x1) / 2 + 0.5
  const cy = (bx.y0 + bx.y1) / 2 + 0.5
  const cz = (bx.z0 + bx.z1) / 2 + 0.5
  const lp = noa.globalToLocal([cx, cy, cz], null, [])
  wandLine.position.copyFromFloats(lp[0], lp[1], lp[2])
  wandLine.setEnabled(true)
}
function finishWandPress(e) {
  const p = wandPress
  wandPress = null
  mouseLeft = false
  leftDown = false
  mouseRight = false
  if (!p || !wandHeld()) return
  if (p.moved >= 8) return
  if (e && e.timeStamp - p.t > 700) return
  const hit = (e && e.pointerType === 'touch') ? rayAt(e.clientX, e.clientY) : targetHit()
  if (!hit || !hit.position) { toast(t('tapCorner')); return }
  const raw = hit.position
  const cell = [raw[0] | 0, raw[1] | 0, raw[2] | 0]
  let which = p.button === 2 ? 2 : 1
  if (p.button !== 2 && e && e.pointerType === 'touch' && tools.cornerA() && !tools.box()) which = 2
  wandCorner(which, cell)
}
function bindWandPill() {
  const pill = $('wand-pill')
  if (pill) pill.addEventListener('pointerdown', (e) => { e.stopPropagation() })
  const modeBtn = $('wand-mode')
  const go = $('wand-do')
  const ex = $('wand-x')
  if (modeBtn) modeBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (wandHeld()) cycleWand(1) })
  if (go) go.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); if (wandHeld()) wandDo() })
  if (ex) ex.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); wandCancel() })
}
bindWandPill()
let seated = null
let sleepBusy = false
let useTarget = null
liveNotesReady = true
let useScanAt = 0
function useVerb(id) {
  if (id === ID.chair) return 'useSit'
  if (id === ID.bunk) return 'useSleep'
  if (isDoor(id)) return isOpenDoor(id) ? 'useShut' : 'useOpen'
  if (id === ID.box) return 'useOpen'
  if (id === ID.oven) return 'useBake'
  if (id === ID.workbench) return 'useCraft'
  if (id === ID.woodshop || id === ID.woodshopSide) return 'useBuild'
  if (id === ID.sewing) return 'useSew'
  if (id === LEVER.off || id === LEVER.on || id === TECH.switch || id === TECH.switchOn) return 'useFlip'
  if (id === BUTTON.off || id === BUTTON.on || id === TECH.button || id === TECH.buttonOn) return 'usePress'
  return ''
}
function findUseTarget() {
  const p = noa.entities.getPosition(noa.playerEntity)
  if (!p || !noa.camera) return null
  const h = noa.camera.heading
  const pitch = noa.camera.pitch
  const cp = Math.cos(pitch)
  const lx = cp * Math.sin(h)
  const ly = -Math.sin(pitch)
  const lz = cp * Math.cos(h)
  const x0 = Math.floor(p[0]) - 3
  const x1 = Math.floor(p[0]) + 3
  const y0 = Math.floor(p[1]) - 1
  const y1 = Math.floor(p[1]) + 2
  const z0 = Math.floor(p[2]) - 3
  const z1 = Math.floor(p[2]) + 3
  let best = null
  let bestD = 3
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) {
    let id = getVoxel(x, y, z)
    if (!useVerb(id) && !isFoundryConsole(id, x, z)) continue
    let ux = x
    let uy = y
    let uz = z
    let uid = id
    if (isDoorTop(id)) {
      const below = getVoxel(x, y - 1, z)
      if (isDoor(below) && !isDoorTop(below)) { uy = y - 1; uid = below }
    }
    const verb = useVerb(uid) || (isFoundryConsole(uid, ux, uz) ? 'usePress' : '')
    if (!verb) continue
    const dx = x + 0.5 - p[0]
    const dy = y + 0.5 - (p[1] + 1.2)
    const dz = z + 0.5 - p[2]
    const dist = Math.hypot(dx, dy, dz)
    if (!(dist > 0.15) || dist > 3) continue
    const dot = (lx * dx + ly * dy + lz * dz) / dist
    if (dot < 0.62) continue
    if (dist < bestD) {
      bestD = dist
      best = { x: ux, y: uy, z: uz, id: uid, verb, dist }
    }
  }
  return best
}
function useUiBlocked() {
  if (wandHeld() || seated || tableMode || sleepBusy) return true
  if (anyCard()) return true
  if (document.body.classList.contains('menu-open')) return true
  return false
}
function paintUsePill(hit) {
  const el = $('use-pill')
  if (!el) return
  if (!hit) {
    el.hidden = true
    useTarget = null
    return
  }
  const same = useTarget && useTarget.x === hit.x && useTarget.y === hit.y && useTarget.z === hit.z && useTarget.verb === hit.verb && !el.hidden
  useTarget = hit
  el.hidden = false
  el.dataset.verb = hit.verb
  el.style.bottom = ''
  el.style.left = ''
  const chip = $('path-chip')
  const cr = chip && !chip.hidden ? chip.getBoundingClientRect() : null
  if (cr && cr.width) {
    const pr = el.getBoundingClientRect()
    if (pr.left < cr.right && cr.left < pr.right && pr.top < cr.bottom && cr.top < pr.bottom) {
      const btn = ['t-bonk', 'jump-col'].map((id) => $(id)).filter((n) => n && n.getBoundingClientRect().width > 0).map((n) => n.getBoundingClientRect().left)
      const wall = Math.min(innerWidth - 8, ...btn) - 8
      if (cr.right + 8 + pr.width <= wall) el.style.left = Math.round(cr.right + 8 + pr.width / 2) + 'px'
      else el.style.bottom = Math.round(innerHeight - cr.top + 8) + 'px'
    }
  }
  if (same) return
  const ico = el.querySelector('.gic')
  if (ico) {
    ico.replaceChildren()
    const block = BLOCKS.find((b) => b[0] === hit.id)
    if (block) ico.append(blockIcon(block, ATLAS))
  }
  const lab = el.querySelector('.glbl')
  const word = t(hit.verb)
  if (lab) lab.textContent = word
  el.setAttribute('aria-label', word)
}
function syncUsePill(force) {
  const now = performance.now()
  if (useUiBlocked()) { paintUsePill(null); return }
  if (!force && now - useScanAt < 120) return
  useScanAt = now
  paintUsePill(findUseTarget())
}
function sitDown(x, y, z) {
  window.__useLook = null
  window.__usePos = null
  flying = false
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (body) {
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    body.gravityMultiplier = 0
    if (body.resting) body.resting = [false, false, false]
  }
  noa.entities.setPosition(noa.playerEntity, [x + 0.5, y + 0.02, z + 0.5])
  setLook(Math.PI, 0.12)
  seated = { x, y, z }
  paintUsePill(null)
  pokeHand('use')
}
function standUp() {
  if (!seated) return false
  const spot = seated
  const h = noa.camera.heading
  seated = null
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (body) body.gravityMultiplier = flying ? 0 : GRAV_MULT
  noa.entities.setPosition(noa.playerEntity, [spot.x + 0.5 + Math.sin(h) * 0.85, spot.y + 0.05, spot.z + 0.5 + Math.cos(h) * 0.85])
  return true
}
function sleepNow() {
  if (sleepBusy) return 'busy'
  const phase = basics && basics.phase ? basics.phase() : 'day'
  if (phase !== 'night') { toast(t('notTired')); return 'day' }
  const fade = $('sleep-fade')
  sleepBusy = true
  paintUsePill(null)
  const wake = () => {
    if (basics && basics.skipMorning) basics.skipMorning()
    else if (basics && basics.seek) basics.seek(0)
    try { applySky() } catch (e) {}
    paintDayClock()
    sleepBusy = false
  }
  if (!fade) { wake(); return 'night' }
  fade.hidden = false
  requestAnimationFrame(() => fade.classList.add('on'))
  setTimeout(() => {
    wake()
    fade.classList.remove('on')
    setTimeout(() => { fade.hidden = true }, 600)
  }, 700)
  return 'night'
}
function usePillOn() {
  const el = $('use-pill')
  return !!(useTarget && el && !el.hidden && !useUiBlocked())
}
function pressUse() {
  const hit = useTarget
  if (!hit || useUiBlocked()) return false
  if (hit.verb === 'useSit') { sitDown(hit.x, hit.y, hit.z); return true }
  if (hit.verb === 'useSleep') { sleepNow(); pokeHand('use'); return true }
  return useAt({ position: [hit.x, hit.y, hit.z], blockID: hit.id, id: hit.id })
}
function bindUsePill() {
  const pill = $('use-pill')
  if (!pill) return
  pill.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation() })
  pill.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); pressUse() })
}
bindUsePill()
function armUse() {
  const q = location.search
  // Staff-only boss shortcut (kwTest.on only)
  if (q.includes('use=boss=overseer') && window.kwTest && window.kwTest.on && window.kwTest.on()) {
    try {
      if (session && session.give) session.give('overrideKey', 1)
      noa.entities.setPosition(noa.playerEntity, [60, 6, 60])
      console.info('[bt-test] foundry at 60,6,60')
    } catch (e) {}
  }
  window.__btTestPending = {
    isTest: location.pathname.startsWith('/blocks-test/') || (window.kwTest && window.kwTest.on && window.kwTest.on()),
    nightQ: q.includes('use=night'),
    mobQ: (q.match(/use=mob=([a-z]+)/) || [])[1] || '',
    ruleQ: (q.match(/use=rule=([a-z]+(?::[a-z]+)*)/) || [])[1] || '',
  }
  if (window.__btTestPending.isTest && (window.__btTestPending.nightQ || window.__btTestPending.mobQ)) {
    // Defer to after armClock so night sticks
    return
  }
  const kind = q.includes('use=door') ? 'door' : q.includes('use=oven') ? 'oven' : q.includes('use=bed') ? 'bed' : q.includes('use=sew') ? 'sew' : q.includes('use=chair') || q.includes('use=') ? 'chair' : ''
  if (!kind) return
  if (learn && learn.cancelAuto) learn.cancelAuto()
  if (session) session.setMode('creative')
  if (basics && basics.setBright) basics.setBright(true)
  flying = true
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (body) { body.gravityMultiplier = 0; body.velocity[0] = body.velocity[1] = body.velocity[2] = 0 }
  const px = 2.5
  const py = 6.15
  const pz = 2.55
  const bx = 2
  const bz = 4
  const tall = kind === 'chair' || kind === 'oven' || kind === 'bed' || kind === 'sew'
  const by = tall ? 6 : 5
  const place = () => {
    for (let x = 1; x <= 3; x++) for (let z = 4; z <= 6; z++) for (let y = 5; y <= 8; y++) {
      if (getVoxel(x, y, z)) setVoxel(x, y, z, 0)
    }
    if (kind === 'door') {
      setVoxel(bx, by, bz, ID.door)
      setVoxel(bx, by + 1, bz, ID.doorTop)
    } else if (kind === 'oven') setVoxel(bx, by, bz, ID.oven)
    else if (kind === 'bed') {
      if (session && session.meta) {
        session.meta.set(bx + ',' + by + ',' + bz, { kind: 'bunk', stars: 1, face: 'E', role: 'foot', anchor: bx + ',' + by + ',' + bz, pair: bx + ',' + by + ',' + (bz + 1) })
        session.meta.set(bx + ',' + by + ',' + (bz + 1), { kind: 'bunk', stars: 1, face: 'E', role: 'head', anchor: bx + ',' + by + ',' + bz, pair: bx + ',' + by + ',' + (bz + 1) })
      }
      setVoxel(bx, by, bz, ID.bunk)
      setVoxel(bx, by, bz + 1, ID.bunk)
    }
    else if (kind === 'sew') setVoxel(bx, by, bz, ID.sewing)
    else setVoxel(bx, by, bz, ID.chair)
    if (tall) setVoxel(bx, by - 1, bz, ID.planks)
  }
  noa.entities.setPosition(noa.playerEntity, [px, py, pz])
  setLook(0, 0.38)
  window.__useLook = [0, 0.38]
  window.__usePos = [px, py, pz]
  place()
  const rules = document.getElementById('rules-card')
  if (rules) rules.hidden = true
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  const hint = document.getElementById('menu-hint')
  if (hint) hint.hidden = true
  const play = document.getElementById('play-chip')
  if (play) play.hidden = true
  const toastEl = document.getElementById('toast')
  if (toastEl) toastEl.hidden = true
  const keys = document.querySelector('.keys')
  if (keys) keys.hidden = true
  const path = document.getElementById('path-chip')
  if (path) path.hidden = true
  window.__use = {
    kind: () => (useTarget ? useTarget.verb : ''),
    id: () => (useTarget ? useTarget.id : 0),
    hidden: () => { const el = $('use-pill'); return !el || el.hidden },
    label: () => { const el = $('use-pill'); return el && !el.hidden ? (el.innerText || '').replace(/\s+/g, ' ').trim() : '' },
    box: () => { const el = $('use-pill'); if (!el || el.hidden) return null; const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), bottom: Math.round(r.bottom) } },
    press: () => pressUse(),
    sit: () => seated ? { x: seated.x, y: seated.y, z: seated.z, h: Math.round(noa.camera.heading * 100) / 100 } : null,
    stand: () => standUp(),
    sleep: () => sleepNow(),
    phase: () => basics && basics.phase ? basics.phase() : '',
    night: () => { if (basics) { basics.setAlways(false); basics.seek(basics.nightAt()) } },
    morning: () => { if (basics) { basics.setAlways(false); basics.seek(0) } },
    voxel: (x, y, z) => getVoxel(x, y, z),
    wand() { selectWandSlot(); syncUsePill(true) },
    offWand() { wandSlot = false; if (session && session.mode === 'survival' && session.setHot) session.setHot(0); else selectSlot(1); syncUsePill(true) },
    toast: () => { const el = document.getElementById('toast'); return el && !el.hidden ? el.textContent : '' },
    panel: () => { const el = $('sheet'); return el && !el.hidden ? (el.dataset.panel || '') : '' },
  }
  setTimeout(() => { place(); syncUsePill(true); window.__useReady = true }, 500)
}
function armShot() {
  try { localStorage.setItem('bloxbert-wand-tip', '1') } catch (e) {}
  if (session) session.setMode('creative')
  if (basics && basics.setBright) basics.setBright(true)
  selectWandSlot()
  setWandMode('fill')
  noa.entities.setPosition(noa.playerEntity, [6.2, 12.5, 2.2])
  flying = true
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (body) { body.gravityMultiplier = 0; body.velocity[0] = body.velocity[1] = body.velocity[2] = 0 }
  const eye = noa.ents.getPositionData(noa.playerEntity)
  const eyeY = (eye && eye.height ? eye.height : 1.6) * 0.9
  const aim = [12, 14, 10]
  tools.setCorners([aim[0] - 2, aim[1] - 1, aim[2] - 2], [aim[0] + 1, aim[1] + 1, aim[2] + 1])
  paintWandBox()
  const dx = aim[0] - 6.2, dy = aim[1] - (12.5 + eyeY), dz = aim[2] - 2.2
  const flat = Math.hypot(dx, dz) || 1
  setLook(Math.atan2(dx, dz), -Math.atan2(dy, flat))
  window.__shotLook = [noa.camera.heading, noa.camera.pitch]
  const rules = document.getElementById('rules-card')
  if (rules) rules.hidden = true
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  const hint = document.getElementById('menu-hint')
  if (hint) hint.hidden = true
  const play = document.getElementById('play-chip')
  if (play) play.hidden = true
  const toastEl = document.getElementById('toast')
  if (toastEl) toastEl.hidden = true
  const keys = document.querySelector('.keys')
  if (keys) keys.hidden = true
  window.__shot = {
    mode: () => wandMode,
    held: () => wandHeld(),
    hot: () => (session && session.mode === 'survival' ? session.hot : (wandSlot ? 'wand' : selectedSlot)),
    box: () => {
      const bx = tools.box()
      return bx ? bx.w + 'x' + bx.h + 'x' + bx.l : ''
    },
    cam() {
      const p = noa.entities.getPosition(noa.playerEntity)
      return {
        pos: p && [Math.round(p[0] * 10) / 10, Math.round(p[1] * 10) / 10, Math.round(p[2] * 10) / 10],
        heading: Math.round(noa.camera.heading * 100) / 100,
        pitch: Math.round(noa.camera.pitch * 100) / 100,
        line: wandLine && wandLine.isEnabled(),
        lp: wandLine && [Math.round(wandLine.position.x * 10) / 10, Math.round(wandLine.position.y * 10) / 10, Math.round(wandLine.position.z * 10) / 10],
      }
    },
    off() {
      window.__shotLook = null
      if (session && session.mode !== 'survival') selectSlot(1)
      else if (session && session.setHot) session.setHot(0)
    },
  }
  window.__shotReady = true
}
function armCraft() {
  if (learn && learn.cancelAuto) learn.cancelAuto()
  if (session) {
    session.setMode('survival')
    session.give('log', 1)
    session.give('planks', 2)
    if (session.focusCraft) session.focusCraft('workbench')
  }
  if (basics && basics.setBright) basics.setBright(true)
  const rules = document.getElementById('rules-card')
  if (rules) rules.hidden = true
  const hint = document.getElementById('menu-hint')
  if (hint) hint.hidden = true
  const play = document.getElementById('play-chip')
  if (play) play.hidden = true
  const toastEl = document.getElementById('toast')
  if (toastEl) toastEl.hidden = true
  if (panels) panels.open('crafting')
  window.__craft = {
    count(id) { return session && session.bag ? session.bag.count(id) : 0 },
    tab(name) {
      const btn = document.querySelector('#sheet .craft-tab[data-tab="' + name + '"]')
      if (btn) btn.click()
    },
    find(q) {
      const input = document.querySelector('#sheet .craft-find')
      if (!input) return
      input.value = q
      input.dispatchEvent(new Event('input', { bubbles: true }))
    },
    tiles() {
      return [...document.querySelectorAll('#sheet .book .well')].map((b) => ({
        id: b.dataset.recipe || '',
        name: (b.querySelector('.wlab') || {}).textContent || '',
        lock: !!b.querySelector('.lock'),
        station: !!b.querySelector('.station-mark'),
      }))
    },
    needs() {
      return [...document.querySelectorAll('#sheet .need-pane .need-bit')].map((b) => ({
        item: b.dataset.item || '',
        n: (b.querySelector('.need-n') || {}).textContent || '',
      }))
    },
  }
  window.__craftReady = true
}
$('game-menu').setAttribute('aria-label', t('menu'))
$('game-menu').addEventListener('click', (e) => {
  e.stopPropagation()
  rememberOpener(document.querySelector('.kb-bar .kb-menu') || $('game-menu'))
  openMenu(!menuSheetOpen())
})
const pathChip = $('path-chip')
if (pathChip) {
  let tipTouchAt = 0
  const pathX = (e) => !!(e && e.target && e.target.closest && e.target.closest('.path-x'))
  pathChip.addEventListener('pointerdown', (e) => e.stopPropagation())
  pathChip.addEventListener('pointerup', (e) => {
    if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return
    if (!pathX(e)) return
    e.preventDefault()
    e.stopPropagation()
    tipTouchAt = performance.now()
    learn.dismissPath()
  })
  pathChip.addEventListener('touchend', (e) => {
    if (!pathX(e)) return
    e.preventDefault()
    if (performance.now() - tipTouchAt < 700) return
    tipTouchAt = performance.now()
    learn.dismissPath()
  }, { passive: false })
  pathChip.addEventListener('click', (e) => {
    if (!pathX(e)) return
    e.preventDefault()
    e.stopPropagation()
    if (performance.now() - tipTouchAt < 700) return
    learn.dismissPath()
  })
}
$('ver-plate').addEventListener('click', () => { openMenu(true); panels.open('log') })
$('wallet-chip').addEventListener('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  if (cogOpen()) closeCogCard()
  else openCogCard()
})
let menuFromLock = false
let hadLock = false
let escUnlock = false
let menuOpener = null
let escJustClosed = 0
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') escUnlock = true }, true)
document.addEventListener('keyup', (e) => { if (e.key === 'Escape') escUnlock = false }, true)
document.addEventListener('pointerlockchange', () => {
  dropRightHold()
  if (document.pointerLockElement) {
    hadLock = true
    try { noa.container.canvas.focus({ preventScroll: true }) } catch (e) {}
    menuFromLock = false
    playLockWanted = false
    lockTries = 0
    dropLockLook = true
    lockGainedAt = performance.now()
    freezeAfterUnpause()
    lockSwallowUntil = Math.max(lockSwallowUntil, performance.now() + 150)
    clearLookAccum()
    hidePlayChip()
    showBagHint()
    armResume = 0
    mouseLeft = false
    try { noa.inputs.state.fire = false } catch (e) {}
    return
  }
  dropLeft()
  const wasLocked = hadLock
  hadLock = false
  resumeSwallow = false
  const fromEsc = escUnlock
  escUnlock = false
  if (playLockWanted && !anyCard() && !TOUCH_UI && lockTries < 2 && navigator.userActivation && navigator.userActivation.isActive) {
    lockTries += 1
    lockAskedAt = 0
    grabLock()
    return
  }
  if (escJustClosed && performance.now() - escJustClosed < 700) { selfUnlock = false; return }
  if (anyCard() || (cardClosedAt && performance.now() - cardClosedAt < 600)) { selfUnlock = false; return }
  if (wasLocked && !selfUnlock && !tableMode && !menuFromLock && fromEsc) { menuFromLock = true; openMenu(true) }
  else if (wasLocked && !selfUnlock && !tableMode && !anyCard()) showPlayChip()
  selfUnlock = false
})
let simTick = 0, beltAcc = 0, beltsDirty = false // 2.5.440: sim tick for belts/mobs/circuits
function beltStep() {
  if (!belts) return
  belts.prune()
  const p = noa.entities.getPosition(noa.playerEntity)
  const anchors = [{ x: p[0], y: p[1], z: p[2] }]
  try { for (const b of (bot.positions ? bot.positions() : [])) anchors.push(b) } catch (e) {}
  belts.tick(anchors)
  beltsDirty = true
}
function mobsStep() {
  const now = simTick * (1000/30)
  try { if (mobs) mobs.tick(now) } catch (e) { _btLog('tick', e) }
  try { if (mobs && mobs.trySpawn) mobs.trySpawn(now) } catch (e) { _btLog('trySpawn', e) }
}
noa.on('tick', () => {
  simTick++; beltAcc += 1000/30
  supportBeds()
  // 2.5.447: shared machine animation tick (UV scroll / lever tween driver). Pauses off-screen via noa.
  if (typeof window !== 'undefined') window.__btMachineAnim = (simTick % 16) / 16
  while (beltAcc >= 250) { beltAcc -= 250; beltStep() }
  if (simTick % 3 === 0) mobsStep()
  try { if (circuits && circuits.tick) circuits.tick(simTick * (1000/30)) } catch (e) {}
  keepSavedSpot()
  const p = noa.entities.getPosition(noa.playerEntity)
  if (softPreset(makerLive.preset) && p[1] < -10) {
    const body = noa.entities.getPhysicsBody && noa.entities.getPhysicsBody(noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    noa.entities.setPosition(noa.playerEntity, worldSpawn.slice())
    toast(t('makerTryAgain'))
    return
  }
  if (unpauseFreeze > 0) {
    unpauseFreeze -= 1
    if (playerBody) playerBody.velocity[0] = playerBody.velocity[1] = playerBody.velocity[2] = 0
    if (unpauseSpot) noa.entities.setPosition(noa.playerEntity, unpauseSpot)
    if (!unpauseFreeze) unpauseSpot = null
    return
  }
  if (p[1] < -66) { poof(); return }
  const now = performance.now()
  if (!flying && now - buriedCheckAt > 500) {
    buriedCheckAt = now
    const x = Math.floor(p[0]), y = Math.floor(p[1]), z = Math.floor(p[2])
    if (solidVoxel(x, y, z) && solidVoxel(x, y + 1, z)) rescueToGround(true)
  }
})
let buriedCheckAt = 0
let unpauseFreeze = 0
let unpauseSpot = null
function freezeAfterUnpause() {
  unpauseFreeze = 2
  try { const q = noa.entities.getPosition(noa.playerEntity); unpauseSpot = [q[0], q[1], q[2]] } catch (e) { unpauseSpot = null }
  if (playerBody) playerBody.velocity[0] = playerBody.velocity[1] = playerBody.velocity[2] = 0
}
{
  const rawSetPaused = noa.setPaused.bind(noa)
  noa.setPaused = (v) => { const was = !!noa._paused; rawSetPaused(v); if (!v && was) freezeAfterUnpause() }
}
function solidVoxel(x, y, z) {
  try { const id = getVoxel(x, y, z); return !!id && !!noa.registry.getBlockSolidity(id) } catch (e) { return false }
}
function groundTop(x, z) {
  for (let y = 24; y > -64; y--) {
    if (solidVoxel(x, y, z) && !solidVoxel(x, y + 1, z) && !solidVoxel(x, y + 2, z)) return y
  }
  return null
}
// 2.5.438: put the player on the first solid voxel with 2 air blocks above it (here, then home, then town).
function rescueToGround(fromVoid) {
  const p = noa.entities.getPosition(noa.playerEntity)
  const home = session && session.home && session.home.length ? session.home : null
  const tries = [p, home, worldSpawn].filter(Boolean)
  let spot = null, usedHome = false
  for (const c of tries) {
    const x = Math.floor(c[0]), z = Math.floor(c[2])
    const y = groundTop(x, z)
    if (y !== null) { spot = [x + 0.5, y + 1.05, z + 0.5]; usedHome = c === home; break }
  }
  if (!spot) { const w = worldSpawn; spot = [w[0], w[1], w[2]] }
  landHold = null
  landLook = null
  landFree = false
  noa.entities.setPosition(noa.playerEntity, spot)
  flying = false
  document.body.classList.remove('fly')
  if (playerBody) {
    playerBody.velocity[0] = playerBody.velocity[1] = playerBody.velocity[2] = 0
    if (!tableMode && !seated) playerBody.gravityMultiplier = GRAV_MULT
  }
  console.info('[bertopia] rescueToGround ' + spot.map((n) => Math.round(n * 100) / 100).join(','))
  if (fromVoid !== false) {
    const fx = $('poof'); if (fx) { fx.hidden = false; setTimeout(() => { fx.hidden = true }, 240) }
    toast(usedHome ? t('poofBunk') : t('poofTown'))
  }
  if (dirty) save()
  return spot
}
function poof() {
  rescueToGround(true)
}
if (!localStorage.getItem('bloxbert-menu-hint')) showMenuHint()

const bar = $('hotbar')
const sheetEl = $('sheet')
const CREATIVE_HOT = 9 // 2.5.397: Creative hotbar is 9 numbered slots like Survival
function defaultPalette() {
  const ids = BLOCKS.filter((b) => b[0] < 1000 && !isDoorTop(b[0]) && !isCropId(b[0]) && !isBushId(b[0]) && b[0] !== WET && b[1] !== 'woodshopSide').map((b) => b[0])
  if (packOn('tech')) {
    for (const id of [TECH.cell, TECH.line, TECH.switch, TECH.button]) {
      if (BLOCKS.some((b) => b[0] === id) && ids.indexOf(id) < 0) ids.push(id)
    }
  }
  return ids
}
const paletteIds = defaultPalette()
function knownBlockId(id) {
  const n = Number(id)
  if (!Number.isFinite(n) || n <= 0) return 0
  return BLOCKS.some((b) => b[0] === n) ? n : 0
}
function applyCreativeHotbar(saved) { // 2.5.506: unknown ids keep that slot's default block
  const base = defaultPalette()
  paletteIds.length = 0
  for (const id of base) paletteIds.push(id)
  if (!Array.isArray(saved)) return
  for (let i = 0; i < CREATIVE_HOT && i < saved.length; i++) {
    const id = knownBlockId(saved[i])
    if (!id) continue
    const j = paletteIds.indexOf(id)
    if (j === i) continue
    if (j >= 0) {
      const prev = paletteIds[i]
      paletteIds[i] = paletteIds[j]
      paletteIds[j] = prev
    } else paletteIds[i] = id
  }
}
let selectedSlot = 0
function bertSlotContentBox(slot) {
  const r = slot.getBoundingClientRect()
  const cs = getComputedStyle(slot)
  const left = r.left + (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.paddingLeft) || 0)
  const right = r.right - (parseFloat(cs.borderRightWidth) || 0) - (parseFloat(cs.paddingRight) || 0)
  return { left: left, right: right, width: Math.max(0, right - left) }
}
function bertVisibleBox(slot) {
  const base = bertSlotContentBox(slot)
  let left = base.left
  let right = base.right
  const r = slot.getBoundingClientRect()
  let node = slot.parentElement
  while (node && node !== document.documentElement) {
    const ncs = getComputedStyle(node)
    const ox = ncs.overflowX
    if (ox === 'hidden' || ox === 'clip' || ox === 'auto' || ox === 'scroll') {
      const nr = node.getBoundingClientRect()
      const aL = nr.left + (parseFloat(ncs.borderLeftWidth) || 0) + (parseFloat(ncs.paddingLeft) || 0)
      const aR = nr.right - (parseFloat(ncs.borderRightWidth) || 0) - (parseFloat(ncs.paddingRight) || 0)
      if (r.right > aL + 0.5 && r.left < aR - 0.5) {
        const overlap = Math.min(r.right, aR) - Math.max(r.left, aL)
        if (overlap >= r.width * 0.6) {
          left = Math.max(left, aL)
          right = Math.min(right, aR)
        }
      }
    }
    node = node.parentElement
  }
  return { left: left, right: right, width: Math.max(0, right - left) }
}
function bertLabelTextBox(lbl) {
  const range = document.createRange()
  const node = lbl.firstChild
  if (node && node.nodeType === 3 && lbl.childNodes.length === 1) range.selectNodeContents(node)
  else range.selectNodeContents(lbl)
  return range.getBoundingClientRect()
}
function bertLabelFits(tb, box) {
  if (!tb || tb.width < 0.5) return true
  return tb.left >= box.left - 0.5 && tb.right <= box.right + 0.5
}
function fitSlotNames(root) {
  const host = root || document.getElementById('hotbar')
  if (!host) return
  host.querySelectorAll('.slot .lbl').forEach((lbl) => {
    const name = (lbl.dataset.name || (lbl.textContent || '')).replace(/\s+/g, ' ').trim()
    if (!name) return
    lbl.dataset.name = name
    lbl.replaceChildren(document.createTextNode(name))
    lbl.style.setProperty('white-space', 'normal', 'important')
    lbl.style.setProperty('word-break', 'normal', 'important')
    lbl.style.setProperty('overflow-wrap', 'normal', 'important')
    lbl.style.setProperty('hyphens', 'none', 'important')
    lbl.style.setProperty('overflow', 'visible', 'important')
    lbl.style.setProperty('text-overflow', 'clip', 'important')
    lbl.style.setProperty('max-height', 'none', 'important')
    lbl.style.setProperty('width', '100%', 'important')
    lbl.style.setProperty('max-width', '100%', 'important')
    lbl.style.setProperty('min-width', '0', 'important')
    lbl.style.setProperty('box-sizing', 'border-box', 'important')
    lbl.style.setProperty('padding', '0', 'important')
    lbl.style.setProperty('font-size', '14px', 'important')
    lbl.style.setProperty('line-height', '1.05', 'important')
    const slot = lbl.parentElement
    if (!slot) return
    if (slot.dataset.bertFit === '1') {
      slot.style.removeProperty('min-width')
      slot.style.removeProperty('width')
      slot.style.removeProperty('flex-basis')
      slot.style.removeProperty('max-width')
      delete slot.dataset.bertFit
    }
    slot.style.setProperty('overflow', 'visible', 'important')
    if (slot.getBoundingClientRect().width < 1) return
    const place = () => {
      const own = bertSlotContentBox(slot)
      const vis = bertVisibleBox(slot)
      const cutL = Math.max(0, vis.left - own.left)
      const cutR = Math.max(0, own.right - vis.right)
      if ((cutL > 0.5 || cutR > 0.5) && vis.width >= 8) {
        lbl.style.setProperty('width', Math.floor(vis.width) + 'px', 'important')
        lbl.style.setProperty('max-width', Math.floor(vis.width) + 'px', 'important')
        lbl.style.setProperty('margin-left', cutL + 'px', 'important')
        lbl.style.setProperty('margin-right', cutR + 'px', 'important')
      } else {
        lbl.style.setProperty('width', '100%', 'important')
        lbl.style.setProperty('max-width', '100%', 'important')
        lbl.style.setProperty('margin-left', '0', 'important')
        lbl.style.setProperty('margin-right', '0', 'important')
      }
      return bertVisibleBox(slot)
    }
    let size = 14
    let box = place()
    let tb = bertLabelTextBox(lbl)
    while (size > 10 && !bertLabelFits(tb, box)) {
      size -= 1
      lbl.style.setProperty('font-size', size + 'px', 'important')
      box = place()
      tb = bertLabelTextBox(lbl)
    }
    let guard = 0
    while (guard < 4) {
      const own = bertSlotContentBox(slot)
      if (bertLabelFits(tb, own)) break
      const over = Math.max(0, own.left - tb.left) + Math.max(0, tb.right - own.right)
      const grow = Math.max(44, Math.ceil(slot.getBoundingClientRect().width + over + 2))
      slot.dataset.bertFit = '1'
      slot.style.setProperty('min-width', grow + 'px', 'important')
      slot.style.setProperty('width', grow + 'px', 'important')
      slot.style.setProperty('max-width', 'none', 'important')
      slot.style.setProperty('flex-basis', grow + 'px', 'important')
      slot.style.setProperty('flex-shrink', '0', 'important')
      tb = bertLabelTextBox(lbl)
      guard += 1
    }
  })
  host.querySelectorAll('.item-strip').forEach((strip) => {
    if (strip.dataset.fitScroll) return
    strip.dataset.fitScroll = '1'
    strip.addEventListener('scroll', () => requestAnimationFrame(() => fitSlotNames(host)))
  })
}
window.__bertopiaFitSlots = fitSlotNames
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => fitSlotNames())
if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', () => fitSlotNames())
window.addEventListener('orientationchange', () => requestAnimationFrame(() => fitSlotNames()))
function paintBar() {
  const heldScroll = bar.dataset.drag === '1' ? ((bar.querySelector('.item-strip') || {}).scrollLeft || 0) : null
  bar.innerHTML = ''
  bar.classList.add('palette')
  bar.classList.remove('bagbar')
  const from = 0
  const ids = paletteIds.slice(0, CREATIVE_HOT) // 2.5.397: always 9 numbered slots
  bar.dataset.n = String(ids.length)
  const nameEl = document.createElement('div')
  nameEl.className = 'hot-name'
  nameEl.textContent = wandSlot ? (t('wandShort') || t('buildWand')) : blockName(paletteIds[selectedSlot] ?? current)
  const tray = document.createElement('div')
  tray.className = 'hot-tray'
  const strip = document.createElement('div')
  strip.className = 'item-strip'
  ids.forEach((id, i) => {
    const real = from + i
    const b = document.createElement('button')
    b.className = 'slot'
    b.type = 'button'
    b.dataset.slot = String(real)
    b.dataset.id = String(id)
    const block = BLOCKS.find((x) => x[0] === id) || BLOCKS[0]
    const name = blockName(id)
    b.setAttribute('aria-label', name)
    b.setAttribute('aria-pressed', String(!wandSlot && real === selectedSlot))
    const d = document.createElement('span')
    d.className = 'digit'
    d.textContent = String(real + 1)
    b.append(d)
    b.addEventListener('click', () => selectSlot(real))
    b.prepend(blockIcon(block, ATLAS))
    strip.append(b)
  })
  const wandBtn = document.createElement('button')
  wandBtn.type = 'button'
  wandBtn.className = 'slot'
  wandBtn.dataset.item = 'buildWand'
  wandBtn.setAttribute('aria-label', t('buildWand'))
  wandBtn.setAttribute('aria-pressed', String(!!wandSlot))
  wandBtn.prepend(wandCanvas(wandMode))
  const w0 = document.createElement('span')
  w0.className = 'digit'
  w0.textContent = '0'
  wandBtn.append(w0)
  wandBtn.addEventListener('click', () => selectWandSlot())
  const bagBtn = document.createElement('button')
  bagBtn.type = 'button'
  bagBtn.className = 'slot bag-tile'
  bagBtn.dataset.bag = '1'
  bagBtn.setAttribute('aria-label', t('bag'))
  bagBtn.innerHTML = '<span class="digit">E</span><span class="gic"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8 9.2V8a4 4 0 0 1 8 0v1.2" fill="none" stroke="#E6EEF2" stroke-width="1.6" stroke-linecap="round"/><path d="M6.2 9.2h11.6l-1 11.2H7.2z" fill="#1F8A8A" stroke="#E6EEF2" stroke-width="1.4"/><path d="M9 13.2h6" stroke="#E6EEF2" stroke-width="1.3" stroke-linecap="round"/></svg></span>'
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
  tray.append(strip, wandBtn, bagBtn)
  bar.append(nameEl, tray)
  const on = strip.querySelector('[aria-pressed="true"]')
  if (on) {
    if (heldScroll != null) strip.scrollLeft = heldScroll
    else strip.scrollLeft = Math.max(0, on.offsetLeft - strip.clientWidth / 2 + on.offsetWidth / 2)
  }
  requestAnimationFrame(() => fitSlotNames(bar))
}
let paintBarNarrow = window.innerWidth <= 520
window.addEventListener('resize', () => {
  const narrow = window.innerWidth <= 520
  if (narrow === paintBarNarrow) return
  paintBarNarrow = narrow
  if (document.body.classList.contains('mode-creative')) paintBar()
  else requestAnimationFrame(() => fitSlotNames())
})
function useSelected() {
  if (survivalOn() && session && session.useHeld) { session.useHeld(); return }
  flashHeld(blockName(current))
}
function scrollPalette(dir) {
  if (wandSlot) {
    selectSlot(dir > 0 ? 0 : CREATIVE_HOT - 1) // 2.5.397
    return
  }
  if (dir < 0 && selectedSlot === 0) { selectWandSlot(); return }
  if (dir > 0 && selectedSlot === CREATIVE_HOT - 1) { selectWandSlot(); return } // 2.5.397
  selectSlot(selectedSlot + dir)
}
function onWandWheel(e) {
  if (!e || tableMode) return
  const dy = e.deltaY || 0
  if (!dy) return
  if (wandHeld()) {
    e.preventDefault()
    cycleWand(dy > 0 ? 1 : -1)
    return
  }
  if (e.target && e.target.closest && e.target.closest('#hotbar, #wand-pill, #sheet, .card')) return
  if (session && session.mode === 'survival' && session.setHot) session.setHot(session.hot + (dy > 0 ? 1 : -1))
  else scrollPalette(dy > 0 ? 1 : -1)
}
document.getElementById('stage').addEventListener('wheel', onWandWheel, { passive: false })
function selectSlot(i) {
  const wasWand = wandSlot
  wandSlot = false
  const n = ((i % paletteIds.length) + paletteIds.length) % paletteIds.length
  const same = !wasWand && n === selectedSlot && current === paletteIds[n]
  selectedSlot = n
  current = paletteIds[n]
  if (!same) paintBar()
  else {
    const pill = $('wand-pill')
    if (pill) pill.hidden = true
  }
  const name = blockName(current)
  const el = $('current')
  if (el) el.textContent = name
  flashHeld(name)
}
function putPalette(i, id) {
  if (!paletteIds.length) return
  const n = ((Number(i) % CREATIVE_HOT) + CREATIVE_HOT) % CREATIVE_HOT // 2.5.397
  const j = paletteIds.indexOf(Number(id))
  if (j >= 0 && j !== n) {
    const prev = paletteIds[n]
    paletteIds[n] = paletteIds[j]
    paletteIds[j] = prev
  } else if (j < 0) {
    paletteIds[n] = Number(id) // 2.5.397: a Bag block not in the starting list can take a slot
  }
  selectedSlot = n
  current = paletteIds[n]
  wandSlot = false
  paintBar()
  const name = blockName(current)
  const label = $('current')
  if (label) label.textContent = name
  flashHeld(name)
  try { saveSoon().catch(() => {}) } catch (e) {} // 2.5.506: the order lives in this world's save
}
function pick(id) {
  const i = paletteIds.indexOf(id)
  if (i >= 0 && i < CREATIVE_HOT) selectSlot(i) // 2.5.397
  else putPalette(selectedSlot, id) // 2.5.397: not in 1-9 -> into the held slot
}

function syncHudBusy() {
  const busy = ['wand-pill', 'use-pill', 'held-chip', 'dig-chip', 'door-opt'].some(id => {
    const el = document.getElementById(id)
    return el && !el.hidden
  })
  document.body.classList.toggle('hud-busy', busy)
}
function flashHeld(name) {
  const chip = $('held-chip')
  if (!chip || chip.dataset.hold === '1') return
  chip.textContent = name
  chip.hidden = false
  chip.classList.remove('on')
  void chip.offsetWidth
  chip.classList.add('on')
  clearTimeout(flashHeld.t)
  flashHeld.t = setTimeout(() => { chip.hidden = true; chip.classList.remove('on'); syncHudBusy() }, 1500)
  syncHudBusy()
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
function fingerSolid(id, forBreak) {
  if (!id) return false
  if (forBreak && (isCropId(id) || isBushId(id))) return true
  return !passThrough(id)
}
function rayAt(cx, cy, forBreak) {
  try {
    if (!Ray) return null
    const scene = noa.rendering.getScene()
    const rect = canvas.getBoundingClientRect()
    if (!(rect.width > 0) || !(rect.height > 0)) return null
    const ray = scene.createPickingRay(cx - rect.left, cy - rect.top, null, noa.rendering.camera)
    if (!ray || !ray.direction) return null
    const glob = noa.localToGlobal([ray.origin.x, ray.origin.y, ray.origin.z], [0, 0, 0])
    const origin = [glob[0], glob[1], glob[2]]
    const eyeV = noa.camera.getTargetPosition()
    const eye = [eyeV[0], eyeV[1], eyeV[2]]
    let dx = ray.direction.x, dy = ray.direction.y, dz = ray.direction.z
    const len = Math.hypot(dx, dy, dz) || 1
    dx /= len; dy /= len; dz /= len
    let eyeT = (eye[0] - origin[0]) * dx + (eye[1] - origin[1]) * dy + (eye[2] - origin[2]) * dz
    if (!(eyeT > 0)) eyeT = 0
    const start = Math.max(0, eyeT - 0.45)
    const end = eyeT + TOUCH_REACH
    let prev = null
    for (let t = start; t <= end + 0.001; t += 0.2) {
      const x = Math.floor(origin[0] + dx * t)
      const y = Math.floor(origin[1] + dy * t)
      const z = Math.floor(origin[2] + dz * t)
      if (prev && prev[0] === x && prev[1] === y && prev[2] === z) continue
      const behind = t < eyeT - 0.4
      const cell = [x, y, z]
      if (behind) { prev = cell; continue }
      const id = getVoxel(x, y, z)
      if (!fingerSolid(id, forBreak)) { prev = cell; continue }
      const ddx = x + 0.5 - eye[0]
      const ddy = y + 0.5 - eye[1]
      const ddz = z + 0.5 - eye[2]
      let nx = 0, ny = 0, nz = 0
      if (prev) {
        nx = Math.max(-1, Math.min(1, prev[0] - x))
        ny = Math.max(-1, Math.min(1, prev[1] - y))
        nz = Math.max(-1, Math.min(1, prev[2] - z))
      }
      const hit = { id, blockID: id, pos: cell, position: [x, y, z], adjacent: [x + nx, y + ny, z + nz], normal: [nx, ny, nz] }
      if (ddx * ddx + ddy * ddy + ddz * ddz > TOUCH_REACH * TOUCH_REACH) {
        hit.far = true
        return hit
      }
      return hit
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
    dropMenuHint()
    tuckBarDrawer()
    setTimeout(tuckBarDrawer, 400)
  } else {
    panels.close()
    if (!kidPause) {
      try { noa.setPaused(false) } catch (e) {}
      if (session) session.paused = false
    }
  }
  drawer.classList.remove('open')
  $('menu-btn').setAttribute('aria-expanded', String(!!on))
  const gm = $('game-menu')
  if (gm) gm.setAttribute('aria-expanded', String(!!on))
  sealPanels()
}
function sealPanels() {
  const box = $('drawer')
  const open = !!(box && box.classList.contains('open'))
  if (box) {
    box.inert = !open
    box.setAttribute('aria-hidden', open ? 'false' : 'true')
  }
  const sheet = $('sheet')
  if (sheet) sheet.inert = !!sheet.hidden
  const kb = document.getElementById('kb-drawer')
  if (kb) kb.inert = !!kb.hidden
  const about = $('about')
  if (about) about.inert = !!about.hidden
  const inspect = $('inspect-card')
  if (inspect) inspect.inert = !!inspect.hidden
  const door = $('door-opt')
  if (door) door.inert = !!door.hidden
  const modal = topLayer()
  if (modal) document.documentElement.setAttribute('data-kb-modal-open', '1')
  else document.documentElement.removeAttribute('data-kb-modal-open')
  if (box) {
    box.querySelectorAll('button, a, input, select, textarea').forEach((el) => {
      if (open) {
        if (el.dataset.kbTab === '1') { el.tabIndex = 0; delete el.dataset.kbTab }
      } else if (el.tabIndex >= 0) {
        el.dataset.kbTab = '1'
        el.tabIndex = -1
      }
    })
  }
}
function menuSheetOpen() {
  const sheet = document.getElementById('sheet')
  return !!(sheet && !sheet.hidden)
}
function onBarMenu(e) {
  e.stopPropagation()
  e.stopImmediatePropagation()
  const btn = e.currentTarget
  rememberOpener(btn)
  openMenu(!menuSheetOpen())
  if (btn && btn.setAttribute) btn.setAttribute('aria-expanded', menuSheetOpen() ? 'true' : 'false')
}
function liftMenuButton() {
  if (document.getElementById('bert-menu-hit')) return
  const css = document.createElement('style')
  css.id = 'bert-menu-hit'
  css.textContent = 'html body .kb-bar{z-index:90!important;pointer-events:auto!important}html body .kb-bar .kb-menu{position:relative!important;z-index:6!important;pointer-events:auto!important}html body:has(#sheet:not([hidden]):not([data-panel="tour"])) .kb-bar{display:flex!important;pointer-events:none!important;background:transparent!important;border:0!important;box-shadow:none!important;z-index:90!important}html body:has(#sheet:not([hidden]):not([data-panel="tour"])) .kb-bar .kb-menu{pointer-events:auto!important;display:inline-flex!important}'
  document.head.append(css)
}
function bindBarMenu() {
  liftMenuButton()
  const btn = document.querySelector('.kb-bar .kb-menu')
  if (!btn || btn.dataset.bertMenu === '1') return
  btn.dataset.bertMenu = '1'
  btn.addEventListener('click', onBarMenu, true)
}
bindBarMenu()
setTimeout(bindBarMenu, 300)
setTimeout(bindBarMenu, 1200)
function mountGoalsHud() {
  if (document.getElementById('goals-hud')) return
  const css = document.createElement('style')
  css.textContent = '#goals-hud{position:fixed;z-index:32;top:calc(var(--top-h, 60px) + 8px);left:76px;min-width:44px;min-height:44px;height:48px;padding:0 12px;border-radius:12px;border:1px solid #e2e8f0;background:rgba(11,18,32,.92);color:#f8fafc;font:700 15px/1 system-ui,sans-serif;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;cursor:pointer}html[data-kb-bar]:not(.kb-framed) #goals-hud{top:calc(48px + var(--top-h, 60px) + 8px)}'
  document.head.append(css)
  const b = document.createElement('button')
  b.type = 'button'
  b.id = 'goals-hud'
  b.dataset.i18n = 'goals'
  b.dataset.i18nLabel = 'goals'
  b.textContent = t('goals')
  b.setAttribute('aria-label', t('goals'))
  const menu = document.getElementById('game-menu')
  if (menu && menu.parentNode) menu.parentNode.insertBefore(b, menu.nextSibling)
  else document.body.append(b)
  b.addEventListener('click', () => {
    rememberOpener(b)
    if (!panels) return
    panels.open('goals')
    sealPanels()
  })
}
mountGoalsHud()
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
const saveChipBtn = $('save-chip')
if (saveChipBtn) saveChipBtn.addEventListener('click', () => { saveClicked() })
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
  if (TOUCH_UI) return false
  if (calm && calm.quiet()) return false
  try { if (localStorage.getItem('bloxbert-bag-hint') === '1') return false } catch (e) { return false }
  try { localStorage.setItem('bloxbert-bag-hint', '1') } catch (e) {}
  toast(t('bagHint'))
  return false
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
function bagWellBlock(well) {
  if (!well) return 0
  const raw = well.dataset && well.dataset.block
  let n = Number(raw)
  if (n) return n
  const node = well.querySelector && well.querySelector('[data-block]')
  n = Number(node && node.dataset && node.dataset.block)
  return n || 0
}
function bagWell(el) {
  if (!el || !el.closest) return null
  const well = el.closest('#sheet[data-panel="inventory"] .well')
  if (!well || !bagWellBlock(well)) return null
  const sheet = $('sheet')
  if (!sheet || sheet.hidden || !sheet.contains(well)) return null
  return well
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
let leftPress = null // { id, t, x, y, z, acted }
let leftPressId = 0
function dropLeft() {
  leftPress = null
  mouseLeft = leftDown = false
  try { noa.inputs.state.fire = false } catch (e) {}
  if (dig && !dig.broke) { dig = null; hideCrack() }
}
window.__ghostBreaks = 0
let mouseRight = false
let rightDown = false
let rightPress = null
let placeHoldAt = 0
function dropRightHold() {
  mouseRight = false
  rightDown = false
  rightPress = null
}
let pickArmed = false
let holdHinted = false
let quickCrackGen = 0
function flashHoldHint(d) {
  if (!d || d.broke || d.creative || d.kind !== 'mouse' || !survivalOn()) return false
  if (isUseBlock(d.id)) return false
  if (performance.now() - (d.t0 || 0) >= 480) return false
  showCrack(Math.max(d.p || 0, 0.16), null, null, true)
  if (!holdHinted) { holdHinted = true; toast(t('holdToBreak')) }
  const gen = ++quickCrackGen
  setTimeout(() => { if (gen === quickCrackGen) hideCrack() }, 700)
  return true
}
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
  if (seated) { standUp(); return }
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
  if (now - lastJump < 450) { // 2.5.394: was 300 ms release-to-release; a normal kid double-tap (about 110 ms press + 200 ms gap) missed it
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
function rememberOpener(el) {
  if (el && el.focus) menuOpener = el
}
function focusBack() {
  const el = menuOpener
  menuOpener = null
  const btn = (el && el.isConnected && seenBox(el)) ? el : (document.querySelector('.kb-bar .kb-menu') || $('game-menu'))
  if (!btn) return
  try { btn.focus({ focusVisible: true }) } catch (e) { try { btn.focus() } catch (err) {} }
}
function seenBox(el) {
  if (!el || el.nodeType !== 1 || el.disabled || el.hidden) return false
  if (el.closest('[hidden], [inert]')) return false
  const s = getComputedStyle(el)
  if (s.display === 'none' || s.visibility === 'hidden') return false
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return false
  if (r.right <= 1 || r.left >= innerWidth - 1) return false
  return true
}
function focusList(root) {
  const scope = root || document
  return [...scope.querySelectorAll('button, a[href], input, select, textarea')].filter((el) => {
    if (el.tabIndex < 0 || !seenBox(el)) return false
    return true
  })
}
function topLayer() {
  for (const id of ['cog-card', 'rules-card', 'shop-safe', 'fs-hint', 'door-opt', 'inspect-card', 'about', 'sheet']) {
    const el = document.getElementById(id)
    if (el && !el.hidden && seenBox(el)) return el
  }
  const kb = document.getElementById('kb-drawer')
  if (kb && !kb.hidden && seenBox(kb)) return kb
  return null
}
function moveFocus(list, dir) {
  if (!list.length) return
  const i = list.indexOf(document.activeElement)
  const n = i < 0 ? (dir < 0 ? list.length - 1 : 0) : (i + dir + list.length) % list.length
  focusChoice(list[n])
}
function focusChoice(el) {
  if (!el) return
  try { el.focus({ focusVisible: true }) } catch (e) { try { el.focus() } catch (err) {} }
  revealFocus(el)
}
function revealFocus(el) {
  if (!el || !el.getBoundingClientRect) return
  try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } catch (e) {}
  let node = el.parentElement
  while (node && node !== document.body) {
    const s = getComputedStyle(node)
    if (/auto|hidden|scroll|clip/.test(s.overflowY + s.overflowX)) {
      const er = el.getBoundingClientRect()
      const pr = node.getBoundingClientRect()
      if (er.bottom > pr.bottom + 1) node.scrollTop += er.bottom - pr.bottom + 8
      else if (er.top < pr.top - 1) node.scrollTop -= pr.top - er.top + 8
      if (er.right > pr.right + 1) node.scrollLeft += er.right - pr.right + 8
      else if (er.left < pr.left - 1) node.scrollLeft -= pr.left - er.left + 8
    }
    node = node.parentElement
  }
}
function arrowPick(list, key) {
  const cur = document.activeElement
  const i = list.indexOf(cur)
  const dir = (key === 'ArrowRight' || key === 'ArrowDown') ? 1 : -1
  if (i < 0) return list[dir < 0 ? list.length - 1 : 0]
  const r = cur.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  const horiz = key === 'ArrowLeft' || key === 'ArrowRight'
  let best = null
  let bestScore = Infinity
  for (const el of list) {
    if (el === cur) continue
    const b = el.getBoundingClientRect()
    if (b.width < 2 || b.height < 2) continue
    const x = b.left + b.width / 2
    const y = b.top + b.height / 2
    const dx = x - cx
    const dy = y - cy
    if (key === 'ArrowRight' && dx < 12) continue
    if (key === 'ArrowLeft' && dx > -12) continue
    if (key === 'ArrowDown' && dy < 12) continue
    if (key === 'ArrowUp' && dy > -12) continue
    const along = horiz ? Math.abs(dx) : Math.abs(dy)
    const cross = horiz ? Math.abs(dy) : Math.abs(dx)
    if (cross > along * 1.6 && cross > 80) continue
    const score = along + cross * 1.4
    if (score < bestScore) { bestScore = score; best = el }
  }
  if (best) return best
  return list[(i + dir + list.length) % list.length]
}
window.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return
  const langList = document.getElementById('lang-list')
  if (langList && !langList.hidden) return
  const cogCard = document.getElementById('cog-card')
  if (cogCard && !cogCard.hidden) {
    e.preventDefault()
    e.stopPropagation()
    closeCogCard()
    return
  }
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
  if (wandHeld() && (tools.cornerA() || (tools.ghost && tools.ghost()))) {
    e.preventDefault()
    e.stopPropagation()
    if (!e.repeat) wandCancel()
    return
  }
  e.preventDefault()
  e.stopImmediatePropagation()
  if (e.repeat) return
  const kb = document.getElementById('kb-drawer')
  if (kb && !kb.hidden) {
    kb.hidden = true
    const back = document.getElementById('kb-drawer-backdrop')
    if (back) back.hidden = true
    kb.inert = true
    sealPanels()
    focusBack()
    return
  }
  const sheet = $('sheet')
  if (sheet && !sheet.hidden) {
    if (sheet.querySelector('[data-maker]')) {
      if (panels) panels.open('world')
      return
    }
    if (sheet.dataset.panel && sheet.dataset.panel !== 'menu') {
      escJustClosed = performance.now()
      selfUnlock = true
      playLockWanted = false
      awaitWorldClick = true
      try { if (noa.container && noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (err) {}
      closePlay('esc')
      focusBack()
      return
    }
    escJustClosed = performance.now()
    closePlay('esc')
    focusBack()
    return
  }
  if (anyCard()) {
    escJustClosed = performance.now()
    closePlay('esc')
    focusBack()
    return
  }
  rememberOpener(document.activeElement)
  openMenu(true)
}, true)
const GAME_KEYS = new Set(['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'AltLeft', 'AltRight'])
function gameKeyGuard(e) {
  if (e.key === 'Escape' || !playLocked() || topLayer()) return
  const ae = document.activeElement
  if (ae && (ae.closest('input,textarea,select,[contenteditable]') || ae.isContentEditable)) return
  const c = noa.container
  if (!c) return
  if (ae !== c.canvas && ae !== c.element && ae !== document.body) return
  const mod = (e.ctrlKey || e.metaKey) && /^Key[SDFPRG]$/.test(e.code)
  if (!GAME_KEYS.has(e.code) && !/^F([1-9]|10)$/.test(e.code) && !mod) return
  e.preventDefault()
  if (e.code === 'Tab') e.stopImmediatePropagation()
}
document.addEventListener('keydown', gameKeyGuard, true)
document.addEventListener('keyup', gameKeyGuard, true)
document.addEventListener('keydown', (e) => {
  if (e.key === 'Tab' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') lastKeyNav = performance.now()
  const layer = topLayer()
  if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const sheet = document.getElementById('sheet')
    const menuBtn = document.querySelector('.kb-bar .kb-menu')
    const ae = document.activeElement
    const canvas = noa.container && (noa.container.canvas || noa.container.element)
    const atStart = !ae || ae === document.body || ae === document.documentElement || ae.id === 'play-chip' || ae === canvas
    if (!e.shiftKey && menuBtn && seenBox(menuBtn) && (!sheet || sheet.hidden) && atStart) {
      e.preventDefault()
      e.stopImmediatePropagation()
      focusChoice(menuBtn)
      return
    }
    const list = focusList(layer || document)
    if (!list.length) return
    e.preventDefault()
    e.stopImmediatePropagation()
    moveFocus(list, e.shiftKey ? -1 : 1)
    return
  }
  if ((e.key === 'Enter' || e.key === ' ' || e.code === 'Space') && !e.repeat && !e.altKey && !e.ctrlKey && !e.metaKey) {
    const sheet = document.getElementById('sheet')
    const panel = sheet && !sheet.hidden ? sheet.dataset.panel : ''
    if (layer && (panel === 'menu' || panel === 'world')) {
      const hit = e.target && e.target.closest && e.target.closest('button, a[href]')
      if (hit && layer.contains(hit) && !(e.target.closest && e.target.closest('input, textarea, select'))) {
        e.preventDefault()
        e.stopImmediatePropagation()
        hit.click()
        return
      }
    }
  }
  if (!layer || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
  if (e.target && e.target.closest && e.target.closest('input, textarea, select, .lang-list')) return
  const sheet = document.getElementById('sheet')
  const panel = sheet && !sheet.hidden ? sheet.dataset.panel : ''
  const grid = panel === 'menu' || panel === 'world'
  if (!grid && e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const buttons = focusList(layer).filter((el) => el.tagName === 'BUTTON' || el.tagName === 'A')
  if (!buttons.length) return
  e.preventDefault()
  e.stopImmediatePropagation()
  if (grid) focusChoice(arrowPick(buttons, e.key))
  else moveFocus(buttons, e.key === 'ArrowDown' ? 1 : -1)
}, true)
function shutByKey() {
  if (!anyCard()) return false
  closePlay('gesture')
  return true
}
document.addEventListener('keydown', (e) => {
  if (e.target.closest('input,textarea')) return
  if (e.key === 'Escape' || e.key === 'Tab') return
  if (e.key === 'e' || e.key === 'E') { // 2.5.506: E toggles the Bag even while the wand is held
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return
    e.preventDefault()
    openBagFromHud()
    return
  }
  if ((e.key === 'q' || e.key === 'Q') && !e.ctrlKey && !e.metaKey) {
    if ($('sheet') && !$('sheet').hidden) return
    e.preventDefault()
    if (!e.repeat && session && session.dropHeld) session.dropHeld(e.shiftKey)
    return
  }
  if (e.key === 'f' || e.key === 'F') {
    if (!e.ctrlKey && !e.metaKey && $('sheet') && $('sheet').hidden) {
      e.preventDefault()
      if (e.repeat) return
      if (usePillOn()) { pressUse(); return }
      useSelected()
      return
    }
  }
  if (e.key === 'v' || e.key === 'V') { // 2.5.441: V toggles the camera view
    if (!e.ctrlKey && !e.metaKey && !e.repeat && $('sheet') && $('sheet').hidden) {
      e.preventDefault()
      camBehind = !camBehind
      applyLook()
      const camBtn = document.querySelector('#look-card .pill.on')
      if (camBtn && camBtn.textContent) {
        camBtn.textContent = camBehind ? t('camBehind') : t('camClose')
        camBtn.setAttribute('aria-label', t('cameraView') + ': ' + camBtn.textContent)
      }
      return
    }
  }
  if (e.key === 'c' || e.key === 'C') {
    if (e.ctrlKey || e.metaKey) return
    if (calm && !calm.workbenchOn()) return
    e.preventDefault()
    const sheet = $('sheet')
    if (sheet && !sheet.hidden && sheet.dataset.panel === 'crafting') { closePlay('gesture'); return }
    openMenu(true); panels.open('crafting'); return
  }
  if (e.key === '0' && !tableMode && !e.repeat && $('sheet') && $('sheet').hidden && session && session.mode !== 'survival') { // 2.5.395: 0 toggles the Build Wand in Creative
    if (wandSlot) selectSlot(selectedSlot); else selectWandSlot()
    return
  }
  const n = '123456789'.indexOf(e.key)
  if (n >= 0 && !tableMode && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey) {
    const sheet = $('sheet')
    const bagOpen = !!(sheet && !sheet.hidden && sheet.dataset.panel === 'inventory')
    if (bagOpen && session && session.mode !== 'survival') { // 2.5.506: hover wins only when the mouse moved last
      const under = document.elementFromPoint(lastClient.x, lastClient.y)
      const hovered = bagWell(under)
      const focused = bagWell(document.activeElement)
      const mouseLast = lastPointing > lastKeyNav
      const tile = hovered && focused && hovered !== focused ? (mouseLast ? hovered : focused) : (mouseLast ? (hovered || focused) : (focused || hovered))
      if (tile) {
        const block = bagWellBlock(tile)
        if (block) {
          e.preventDefault()
          e.stopPropagation()
          putPalette(n, block)
          toast((tile.getAttribute('aria-label') || '') + ' → ' + (n + 1))
          return
        }
      }
    } else if (sheet && sheet.hidden) {
      if (session && session.mode === 'survival' && session.pressHot) session.pressHot(n)
      else selectSlot(n)
    }
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) { e.preventDefault(); undo(); return }
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z' || e.key === 'Z')) { e.preventDefault(); redo(); return }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) { e.preventDefault(); redo(); return }
  if (e.key === 'i' || e.key === 'I') { if (!e.ctrlKey && !e.metaKey) { e.preventDefault(); setInspect(!inspectOn) } }
  if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey && !e.repeat) {
    const sheet = $('sheet')
    if (!(sheet && !sheet.hidden) && !(e.target && e.target.closest && e.target.closest('input, textarea'))) {
      if (wandHeld()) { // 2.5.506: R cycles the wand. E stays the Bag.
        e.preventDefault()
        cycleWand(1)
        return
      }
      const aimed = noa.targetedBlock
      if (aimed && aimed.position && getVoxel(aimed.position[0], aimed.position[1], aimed.position[2]) === ID.conveyor) {
        e.preventDefault()
        const spun = belts && belts.rotate(aimed.position[0], aimed.position[1], aimed.position[2])
        if (spun === false) toast('⚠ ' + t('tooManyMachines'))
        return
      }
    }
  }
  if ((e.key === ' ' || e.code === 'Space') && (playLocked() || playArmed || TOUCH_UI) && !tableMode && !anyCard()) {
    const typing = e.target && e.target.closest && e.target.closest('button,a,input,textarea,select')
    if (!typing && survivalOn()) {
      const tree = scanTree()
      if (tree && tree.d <= TREE_NEAR) {
        e.preventDefault()
        spaceChop = true
        if (!e.repeat) {
          treeHold = true
          pulseChop(tree, true)
          jumpDown()
        }
        return
      }
      if (tree && !e.repeat) showMoveCloser(tree)
    }
  }
  if (e.key === ' ' || e.code === 'Space' || e.key === 'Enter') {
    if (!TOUCH_UI && !playLocked() && !tableMode && !anyCard() && playKeyTarget(e)) {
      e.preventDefault()
      if (!e.repeat) startFromChip()
      return
    }
  }
  if (e.key === ' ' || e.code === 'Space') {
    if (e.target && e.target.closest && e.target.closest('button,a,input,textarea,select')) return
    if (!e.repeat) jumpDown()
  }
  if (e.key === 'Enter') {
    resumeSwallow = false
    if (e.target && e.target.closest && e.target.closest('button, a, input, textarea, select')) return
    e.preventDefault()
    if (wandHeld()) { if (!e.repeat) wandDo(); return }
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
document.addEventListener('keyup', (e) => { if (e.key === 'Shift') downHeld = false; if (e.code === 'KeyZ') crouchKey = false; if (e.key === ' ' || e.code === 'Space') { spaceChop = false; jumpUp() } })
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
  if (!TOUCH_UI && (performance.now() < lockSwallowUntil || performance.now() - lockGainedAt < 300)) return
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
function lingerQuick(d, now) {
  if (!d || d.broke || d.creative || d.kind !== 'mouse' || !survivalOn()) return false
  if (isUseBlock(d.id)) return false
  if (!d.quickUntil) {
    if (now - (d.t0 || now) >= 480) return false
    d.quickUntil = now + 700
    showCrack(Math.max(d.p || 0, 0.16), null, null, true)
    if (!holdHinted) { holdHinted = true; toast(t('holdToBreak')) }
    return true
  }
  if (now >= d.quickUntil) return false
  showCrack(Math.max(d.p || 0, 0.16), null, null, true)
  return true
}
function wallId(id) {
  if (!id || id === WATER || OPEN_IDS.has(id)) return false
  if (id === LANTERN || (id >= 1100 && id <= 1105)) return false
  if (id === ID.wheat || id === ID.tuft || FLORA_PLANT_IDS.has(id) || isCropId(id) || isBushId(id)) return false
  try { return !!noa.registry.getBlockSolidity(id) } catch (e) { return false }
}
function eyeBlocked() {
  if (!noa.camera || tableMode || flying) return false
  const eye = noa.camera.getPosition()
  if (!eye) return false
  const spots = [[0, 0, 0], [0.2, 0, 0], [-0.2, 0, 0], [0, 0.2, 0], [0, -0.2, 0], [0, 0, 0.2], [0, 0, -0.2]]
  for (let i = 0; i < spots.length; i++) {
    const s = spots[i]
    if (wallId(getVoxel(Math.floor(eye[0] + s[0]), Math.floor(eye[1] + s[1]), Math.floor(eye[2] + s[2])))) return true
  }
  return false
}
function pushEyeOut() {
  const eye = noa.camera.getPosition()
  if (!eye) return
  const ex = Math.floor(eye[0])
  const ey = Math.floor(eye[1])
  const ez = Math.floor(eye[2])
  let best = null
  let bestD = 99
  for (let dy = 1; dy >= -1; dy--) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        if (!dx && !dy && !dz) continue
        if (wallId(getVoxel(ex + dx, ey + dy, ez + dz))) continue
        const d = dx * dx + dz * dz + dy * dy * 0.6
        if (d < bestD) { bestD = d; best = [ex + dx + 0.5, ey + dy + 0.15, ez + dz + 0.5] }
      }
    }
  }
  if (!best) return
  const p = noa.entities.getPosition(noa.playerEntity)
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  noa.entities.setPosition(noa.playerEntity, [p[0] + best[0] - eye[0], p[1] + best[1] - eye[1], p[2] + best[2] - eye[2]])
  if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
}
function zoomToWall(want) {
  const tgt = noa.camera.getTargetPosition()
  const look = noa.camera.getDirection()
  if (!tgt || !look || !(want > 0)) return want
  const ex = tgt[0], ey = tgt[1], ez = tgt[2]
  const bx = -look[0], by = -look[1], bz = -look[2]
  let hit = null
  try {
    const picked = noa.pick([ex, ey, ez], [bx, by, bz], want + 0.05, wallId)
    if (picked && picked.position) {
      hit = Math.hypot(picked.position[0] - ex, picked.position[1] - ey, picked.position[2] - ez)
    }
  } catch (e) { hit = null }
  if (hit == null) {
    let prev = 0
    for (let t = 0.25; t <= want + 0.001; t += 0.25) {
      if (wallId(getVoxel(Math.floor(ex + bx * t), Math.floor(ey + by * t), Math.floor(ez + bz * t)))) { hit = prev; break }
      prev = t
    }
  }
  if (hit == null) return want
  return Math.max(0, Math.min(want, hit - 0.3))
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
  if (!tableMode && !landHold) {
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
  if (carryOn && lastMove && !flying) {
    noa.inputs.state.forward = lastMove.forward
    noa.inputs.state.backward = lastMove.backward
    noa.inputs.state.left = lastMove.left
    noa.inputs.state.right = lastMove.right
    if (grounded && body.velocity[1] <= 0 && !want) carryOn = false
  }
  const stickRun = runSince && now - runSince >= 300
  moveState.maxSpeed = speedFor({ crouch: crouchKey || crouchOn, run: (downHeld && !flying) || !!stickRun, fly: flying && (!survivalOn() || Effects.has('fly')) }) * Effects.speedMul()
  if (flying && !tableMode && !seated && !window.__useLook && !window.__shotLook) {
    const st = noa.inputs.state
    const horiz = !!(st.forward || st.backward || st.left || st.right)
    const vert = !!(st.jump || jumpHeld || downHeld)
    if (!horiz || !vert) {
      const k = Math.exp(-((dt || 33) / 1000) * 15)
      const damp = (v) => { const n = v * k; return Math.abs(n) < 0.05 ? 0 : n }
      if (!horiz) { body.velocity[0] = damp(body.velocity[0]); body.velocity[2] = damp(body.velocity[2]) }
      if (!vert) body.velocity[1] = damp(body.velocity[1])
    }
  }
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
  if (wandHeld()) {
    mouseLeft = false
    leftDown = false
    mouseRight = false
    try { noa.inputs.state.fire = false } catch (e) {}
    if (dig) { dig = null; hideCrack() }
  }
  if (swallowing()) {
    mouseLeft = false
    mouseRight = false
    try { noa.inputs.state.fire = false } catch (e) {}
  }
  const breaking = !!leftPress && !!(mouseLeft || leftDown || noa.inputs.state.fire)
  if (!breaking && !spaceChop) sweep = null
  holdTreeChop()
  const touchLook = !!(look && look.pt === 'touch')
  if (!treeHold && !sheetOpen && !anyCard() && !tableMode && breaking && leftPress && !dig && !touchLook && (playLocked() || (look && look.pt !== 'touch'))) beginDig('mouse')
  if (anyCard()) dropRightHold()
  else if (!rightDown) mouseRight = false
  else if (shouldRepeatPlace(mouseRight, now - placeHoldAt, TOUCH_UI)) {
    placeHoldAt = now
    if (rightPress) rightPress.repeated = true
    placeBlock(null, { repeat: true })
  }
  if (!tableMode && !flying) {
    const behind = camBehind ? 4 : 0
    const up = behind > 0.5 && TOUCH_UI && noa.camera.pitch < -0.25 ? Math.min(2.2, -noa.camera.pitch * 1.6) : 0
    let zoom = behind + up
    if (camBehind && zoom > 0) {
      const safe = zoomToWall(zoom)
      if (safe < zoom && (noa.camera.currentZoom || 0) > safe) noa.camera.currentZoom = safe
      zoom = safe
    }
    if (eyeBlocked()) {
      if (zoom > 0) {
        zoom = 0
        if ((noa.camera.currentZoom || 0) > 0) noa.camera.currentZoom = 0
      } else {
        const eye = noa.camera.getPosition()
        if (eye && wallId(getVoxel(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2])))) pushEyeOut()
      }
    }
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
    if (!look || look.pt !== 'touch' || look.moved >= 24) { farHit = null; hideWalkCloser() }
    else if (!farHit.shown && now - farHit.t0 >= 250) {
      farHit.shown = true
      showWalkCloser(look.x, look.y)
    } else if (farHit.shown) showWalkCloser(look.x, look.y)
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
    if (breaking && leftPress && !doorAimed && !shopAimed && now - leftPress.t >= 400 && now - dig.t0 >= 250) { breakBlock(); dig.t0 = now }
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
    else if (!breaking && lingerQuick(dig, now)) { }
    else if (!breaking && !same) { clearWoodTip(); dig = null; hideCrack() }
    else {
      const next = advanceDig(dig, now, breaking, true)
      if (!next) {
        if (!lingerQuick(dig, now)) { clearWoodTip(); dig = null; hideCrack() }
      }
      else {
        dig = next
        const blocked = clampGate(dig, now)
        const elapsed = now - dig.t0
        if (crackVisible(dig.draining ? 250 : elapsed, dig.p)) showCrack(dig.p)
        else hideCrack()
        if (!blocked && !dig.draining && survivalOn() && dig.p > 0 && logSets().s.has(dig.id) && elapsed >= 2000 && !dig.hinted && heldTool() !== 'wood' && heldTool() !== 'stone') { dig.hinted = true; showWoodTip() }
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
      if (!blocked && survivalOn() && dig.p > 0 && logSets().s.has(dig.id) && elapsed >= 2000 && !dig.hinted && heldTool() !== 'wood' && heldTool() !== 'stone') { dig.hinted = true; showWoodTip() }
      if (!blocked && dig.p >= 1 && !dig.broke && useHoldReady(dig, now)) {
        breakAt(dig.x, dig.y, dig.z, true)
        dig.broke = true
        puff()
        dig.t0 = now
        if (!survivalOn()) dig.need = 250
        else { clearWoodTip(); dig = null; hideCrack() }
      } else if (dig.broke && !survivalOn() && now - dig.t0 >= dig.need) {
        const hit = rayAt(look.x, look.y)
        if (hit) breakAt(hit.position[0], hit.position[1], hit.position[2])
        dig.t0 = now
      }
    } else if (dig.draining && !dig.broke) {
      const next = advanceDig(dig, now, false, true)
      if (!next) { clearWoodTip(); dig = null; hideCrack() }
      else { dig = next; if (crackVisible(250, dig.p)) showCrack(dig.p); else hideCrack() }
    }
  }
  tickCrops()
  tickForage()
  hoverCrop()
}
noa.on('tick', (dt) => {
  paintBonk()
  checkSafeEntry()
  const maxP = 89 * Math.PI / 180
  if (noa.camera.pitch > maxP || noa.camera.pitch < -maxP) setLook(noa.camera.heading, noa.camera.pitch)
  feelTick(dt || 33)
  syncWandUi()
  syncUsePill(false)
  if (stations) { stations.tick(); syncOvenGlow(); syncFronts(false) }
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  if (tableMode) {
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = noa.inputs.state.jump = false
    noa.entities.setPosition(noa.playerEntity, [8.5, 12, 8.5])
  } else if (seated) {
    body.gravityMultiplier = 0
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    noa.inputs.state.forward = noa.inputs.state.backward = noa.inputs.state.left = noa.inputs.state.right = noa.inputs.state.jump = false
    noa.entities.setPosition(noa.playerEntity, [seated.x + 0.5, seated.y + 0.02, seated.z + 0.5])
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
    const base = seated ? 1.05 : 0.9 * noa.ents.getPositionData(noa.playerEntity).height
    const moving = !tableMode && !seated && !REDUCE && (noa.inputs.state.forward || noa.inputs.state.backward || noa.inputs.state.left || noa.inputs.state.right)
    follow.offset[1] = base + (moving ? Math.sin(performance.now() / 180) * 0.045 : 0)
  }
})

const canvas = noa.container.canvas
canvas.tabIndex = 0
canvas.setAttribute('aria-label', 'Bertopia')
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
// 2.5.541: pointer lock retargets the click onto #stage and zeroes clientX/clientY.
// Chrome still emits a pointermove pair (+x,+y then -x,-y) for the real aim.
// Do not preventDefault on the Menu pointerdown, or the click never arrives.
let menuAim = null
let movePending = null
let menuClickAt = 0
function menuButtonOf(el) {
  if (!el || !el.closest) return null
  if (el.closest('.kb-bar')) {
    const hit = el.closest('.kb-menu')
    if (hit) return hit
  }
  return el.closest('#game-menu, #menu-btn')
}
function menuHitAt(x, y) {
  const btn = document.querySelector('.kb-bar .kb-menu') || document.getElementById('game-menu')
  if (!btn) return null
  const r = btn.getBoundingClientRect()
  if (r.width < 8 || r.height < 8) return null
  if (x >= r.left && y >= r.top && x <= r.right && y <= r.bottom) return btn
  return null
}
function noteLockMove(e) {
  if (!document.pointerLockElement || TOUCH_UI) return
  const mx = e.movementX || 0
  const my = e.movementY || 0
  if (!mx && !my) return
  if (movePending && performance.now() - movePending.t > 300) movePending = null
  if (movePending && Math.abs(movePending.x + mx) <= 1 && Math.abs(movePending.y + my) <= 1) {
    const hit = menuHitAt(movePending.x, movePending.y) || menuHitAt(mx, my)
    const justClicked = performance.now() - menuClickAt < 120
    menuAim = hit ? { btn: hit, t: performance.now() } : null
    movePending = null
    if (hit && justClicked) {
      menuClickAt = 0
      const box = hit.getBoundingClientRect()
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: box.left + 8, clientY: box.top + 8, button: 0 })
      ev.bertMenuFwd = true
      hit.dispatchEvent(ev)
    }
    return
  }
  movePending = { x: mx, y: my, t: performance.now() }
}
function freshMenuAim() {
  if (!menuAim) return null
  if (performance.now() - menuAim.t > 500) { menuAim = null; return null }
  return menuAim.btn
}
function keepHudClick(e) {
  if (e.bertMenuFwd) return
  if (menuButtonOf(e.target)) return
  if (document.pointerLockElement && !TOUCH_UI) {
    if (e.type === 'click') {
      menuClickAt = performance.now()
      if (movePending) {
        const pendingHit = menuHitAt(movePending.x, movePending.y) || menuHitAt(-movePending.x, -movePending.y)
        if (pendingHit) menuAim = { btn: pendingHit, t: performance.now() }
      }
    }
    const lockedMenu = freshMenuAim()
    if (lockedMenu) {
      e.stopPropagation()
      if (e.type === 'click') {
        menuAim = null
        movePending = null
        menuClickAt = 0
        const r = lockedMenu.getBoundingClientRect()
        const ev = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 })
        ev.bertMenuFwd = true
        lockedMenu.dispatchEvent(ev)
      }
      return
    }
  }
  const top = hudAt(e)
  if (!top) return
  const menu = menuButtonOf(top)
  if (menu) {
    e.stopPropagation()
    if (e.type === 'click') {
      const ev = new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, button: e.button || 0 })
      ev.bertMenuFwd = true
      menu.dispatchEvent(ev)
    }
    return
  }
  e.preventDefault()
  e.stopPropagation()
  const shell = noa.container && noa.container._shell
  if (shell) shell.stickyPointerLock = false
  if (e.type === 'click') {
    top.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY, button: e.button || 0 }))
  }
}
window.addEventListener('pointermove', noteLockMove, true)
window.addEventListener('pointerdown', keepHudClick, true)
window.addEventListener('mousedown', keepHudClick, true)
window.addEventListener('click', keepHudClick, true)
window.addEventListener('pointerdown', (e) => {
  if (canvasHit(e) || TOUCH_UI) return
  const shell = noa.container && noa.container._shell
  if (!shell || !shell.stickyPointerLock) return
  shell.stickyPointerLock = false
  playLockWanted = false
  selfUnlock = true
  dropLockLook = true
}, true)
canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault()
  if (canvasHit(e) || e.target === stageEl || (stageEl && stageEl.contains(e.target))) e.preventDefault()
  if (TOUCH_UI || tableMode || anyCard()) return
  deskOpenStation(targetHit())
}, true)
let look = null
let buttonHold = null
const LOOK_H = 0.40 * Math.PI / 180
const LOOK_V = 0.34 * Math.PI / 180
let airCap = WALK
function applyLook() {
  noa.camera.sensitivityX = 10 * lookSens
  noa.camera.sensitivityY = 10 * lookSens
  noa.camera.sensitivityMult = 0
  noa.camera.inverseY = lookInvert
  document.documentElement.dataset.allcaps = allCaps ? '1' : '0'
  document.documentElement.dataset.dyslexia = dyslexiaFont ? '1' : '0'
  try { localStorage.setItem(LOOK_KEY, JSON.stringify({ cv: 3, sens: lookSens, invert: lookInvert, wide: wideView, climb: autoClimb, hand: showHand, mainHand, offHandItem: null, cam: camBehind ? 'behind' : 'close', allCaps: !!allCaps, dyslexia: !!dyslexiaFont, suit: suitId })) } catch (e) {}
  lookReady = true
  paintViewChip()
}
const PICKER_KEYS = ['graphics', 'quality', 'textSize']
const pickerWatched = new WeakSet()
let pickerLangWatch = false
function watchPickerGroup(el) {
  if (!el || pickerWatched.has(el)) return
  pickerWatched.add(el)
  new MutationObserver(() => {
    if (el.hasAttribute('aria-checked')) el.removeAttribute('aria-checked')
    if (el.classList.contains('on')) el.classList.remove('on')
  }).observe(el, { attributes: true, attributeFilter: ['aria-checked', 'class'] })
}
function namePickerGroups() {
  for (const key of PICKER_KEYS) {
    const word = t(key)
    for (const el of document.querySelectorAll('[data-q="' + key + '"]')) {
      if (el.getAttribute('role') !== 'radiogroup') continue
      el.setAttribute('aria-label', word)
      if (el.hasAttribute('aria-checked')) el.removeAttribute('aria-checked')
      el.classList.remove('on')
      watchPickerGroup(el)
      const prev = el.previousElementSibling
      if (prev && prev.classList.contains('ghead')) prev.textContent = word
    }
  }
}
function paintPickers(g) {
  namePickerGroups()
  const take = (key) => {
    const src = document.querySelector('#settings [data-q="' + key + '"]')
    if (!src || src.getAttribute('role') !== 'radiogroup') return null
    const clone = src.cloneNode(true)
    clone.classList.add('sheet-qset')
    clone.setAttribute('aria-label', t(key))
    fillIco(clone)
    watchPickerGroup(clone)
    return clone
  }
  const head = (key) => {
    const p = document.createElement('p')
    p.className = 'gnote ghead'
    p.textContent = t(key)
    return p
  }
  g.append(head('graphics'))
  const gfx = take('graphics')
  if (gfx) g.append(gfx)
  g.append(head('quality'))
  const qual = take('quality')
  if (qual) g.append(qual)
  paintGfx()
  paintQuality()
  namePickerGroups()
}
if (!pickerLangWatch) {
  pickerLangWatch = true
  new MutationObserver(() => { try { namePickerGroups() } catch (e) {} }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  try { namePickerGroups() } catch (e) {}
}
function lookLine(name, value, icon) {
  const row = document.createElement('div')
  row.className = 'set-line'
  if (icon) {
    const ico = document.createElement('span')
    ico.className = 'set-ico'
    const pic = menuIcon(icon)
    if (pic) ico.append(pic)
    row.append(ico)
  }
  const lab = document.createElement('span')
  lab.className = 'set-lab'
  lab.textContent = name
  row.append(lab)
  if (value) {
    const val = document.createElement('span')
    val.className = 'set-val'
    val.textContent = value
    row.append(val)
    row._val = val
  }
  return row
}
function lookPill(name, on, flip, look, icon) {
  const row = lookLine(name, null, icon)
  const b = document.createElement('button')
  b.type = 'button'
  b.className = 'pill'
  if (look) b.dataset.look = look
  const draw = () => {
    const v = !!on()
    b.classList.toggle('on', v)
    b.setAttribute('aria-pressed', v ? 'true' : 'false')
    b.textContent = v ? t('switchOn') : t('switchOff')
  }
  draw()
  b.addEventListener('click', () => { flip(); draw() })
  row.append(b)
  return row
}
function paintTextOpts(g) {
  const head = document.createElement('p')
  head.className = 'gnote ghead'
  head.textContent = t('textHead')
  g.append(head)
  g.append(
    lookPill(t('allCaps'), () => allCaps, () => { allCaps = !allCaps; applyLook() }, 'allCaps', ''),
    lookPill(t('dyslexiaFont'), () => dyslexiaFont, () => { dyslexiaFont = !dyslexiaFont; applyLook() }, 'dyslexia', ''),
  )
}
function paintPackLook(g) {
  const lookHead = document.createElement('p')
  lookHead.className = 'gnote ghead'
  lookHead.textContent = 'Look'
  const packRow = document.createElement('div')
  packRow.className = 'set-line'
  packRow.id = 'look-packs'
  packRow.style.flexWrap = 'wrap'
  packRow.style.gap = '8px'
  const packBtns = []
  const paintPackBtns = () => {
    const id = currentPackId()
    for (const b of packBtns) {
      const on = b.dataset.pack === id
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
      b.style.setProperty('background', on ? '#3a4048' : '#2c333b', 'important')
      b.style.setProperty('color', '#e6eef2', 'important')
      b.style.setProperty('border', on ? '3px solid #e07a2f' : '3px solid #5c656e', 'important')
      b.style.setProperty('box-shadow', on ? 'inset 0 0 0 1px #e07a2f' : 'none', 'important')
    }
  }
  for (const pack of packList()) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'look-pack'
    b.dataset.pack = pack.id
    b.style.setProperty('min-height', '48px', 'important')
    b.style.setProperty('height', '48px', 'important')
    b.style.setProperty('min-width', '48px', 'important')
    b.style.setProperty('padding', '0 12px 0 6px', 'important')
    b.style.setProperty('display', 'inline-flex', 'important')
    b.style.setProperty('align-items', 'center', 'important')
    b.style.setProperty('gap', '8px', 'important')
    b.style.setProperty('border-radius', '10px', 'important')
    b.style.setProperty('font', '700 16px sans-serif', 'important')
    b.style.setProperty('cursor', 'pointer', 'important')
    const icon = document.createElement('canvas')
    icon.width = 32
    icon.height = 32
    icon.setAttribute('aria-hidden', 'true')
    icon.style.width = '32px'
    icon.style.height = '32px'
    icon.style.imageRendering = 'pixelated'
    const face = new Image()
    face.onload = () => {
      const ctx = icon.getContext('2d')
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(face, 2, 2, 32, 32, 0, 0, 32, 32)
    }
    face.src = 'assets/packs/' + pack.id + '/atlas32.png'
    const word = document.createElement('span')
    word.textContent = pack.name
    b.setAttribute('aria-label', pack.name)
    b.append(icon, word)
    const choose = () => {
      if (b.dataset.busy === '1') return
      b.dataset.busy = '1'
      setPack(pack.id).then(() => { b.dataset.busy = ''; paintPackBtns() })
    }
    b.addEventListener('click', choose)
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
      e.stopPropagation()
      choose()
    })
    packBtns.push(b)
    packRow.append(b)
  }
  paintPackBtns()
  const smallBtn = document.createElement('button')
  smallBtn.type = 'button'
  smallBtn.className = 'look-pack'
  smallBtn.dataset.small = '1'
  smallBtn.textContent = 'Small textures (faster)'
  smallBtn.style.setProperty('min-height', '48px', 'important')
  smallBtn.style.setProperty('height', '48px', 'important')
  smallBtn.style.setProperty('min-width', '48px', 'important')
  smallBtn.style.setProperty('padding', '0 14px', 'important')
  smallBtn.style.setProperty('border-radius', '10px', 'important')
  smallBtn.style.setProperty('font', '700 16px sans-serif', 'important')
  smallBtn.style.setProperty('width', 'auto', 'important')
  smallBtn.style.setProperty('align-self', 'flex-start', 'important')
  const paintSmall = () => {
    const on = smallTextures()
    smallBtn.setAttribute('aria-pressed', on ? 'true' : 'false')
    smallBtn.style.setProperty('background', on ? '#3a4048' : '#2c333b', 'important')
    smallBtn.style.setProperty('color', '#e6eef2', 'important')
    smallBtn.style.setProperty('border', on ? '3px solid #e07a2f' : '3px solid #5c656e', 'important')
  }
  paintSmall()
  smallBtn.addEventListener('click', () => setSmallTextures(!smallTextures()))
  g.append(lookHead, packRow, smallBtn)
}
function paintLook(g) {
  const sens = lookLine(t('lookSens'), lookSens.toFixed(1) + '×', 'sliders')
  const range = document.createElement('input')
  range.type = 'range'
  range.min = '0.5'
  range.max = '2'
  range.step = '0.1'
  range.value = String(lookSens)
  range.setAttribute('aria-label', t('lookSens'))
  range.addEventListener('input', () => {
    lookSens = Number(range.value)
    if (sens._val) sens._val.textContent = lookSens.toFixed(1) + '×'
    applyLook()
  })
  const side = lookLine(t('mainHand'), null, 'hand')
  const sideBtn = document.createElement('button')
  sideBtn.type = 'button'
  sideBtn.className = 'pill on'
  const paintSide = () => { sideBtn.textContent = mainHand === 'left' ? t('left') : t('right') }
  paintSide()
  sideBtn.addEventListener('click', () => { mainHand = mainHand === 'left' ? 'right' : 'left'; applyLook(); paintSide() })
  side.append(sideBtn)
  const cam = lookLine(t('cameraView'), null, 'camera')
  const camBtn = document.createElement('button')
  camBtn.type = 'button'
  camBtn.className = 'pill on'
  camBtn.dataset.cam = '1'
  const paintCam = () => {
    camBtn.textContent = camBehind ? t('camBehind') : t('camClose')
    camBtn.setAttribute('aria-label', t('cameraView') + ': ' + camBtn.textContent)
  }
  paintCam()
  camBtn.addEventListener('click', () => { camBehind = !camBehind; applyLook(); paintCam() })
  cam.append(camBtn)
  const clothes = document.createElement('div')
  clothes.className = 'set-line'
  clothes.style.flexWrap = 'wrap'
  clothes.style.gap = '8px'
  const clothesLab = document.createElement('span')
  clothesLab.className = 'set-lab'
  clothesLab.id = 'suit-look-lab'
  clothesLab.textContent = t('suitLook')
  const clothesGroup = document.createElement('div')
  clothesGroup.setAttribute('role', 'radiogroup')
  clothesGroup.setAttribute('aria-labelledby', 'suit-look-lab')
  clothesGroup.style.display = 'flex'
  clothesGroup.style.flexWrap = 'wrap'
  clothesGroup.style.gap = '8px'
  for (const id of Object.keys(SUIT_WORD)) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'pill'
    b.dataset.suit = id
    b.style.minHeight = '44px'
    b.style.minWidth = '44px'
    b.textContent = SUIT_WORD[id]
    b.setAttribute('role', 'radio')
    b.addEventListener('click', () => {
      suitId = id
      paintBertySuit()
      applyLook()
      for (const kid of clothesGroup.querySelectorAll('button')) {
        const on = kid.dataset.suit === suitId
        kid.setAttribute('aria-checked', on ? 'true' : 'false')
        kid.classList.toggle('on', on)
      }
    })
    clothesGroup.append(b)
  }
  const paintClothes = () => {
    clothesLab.textContent = t('suitLook')
    clothesGroup.setAttribute('aria-label', t('suitLook'))
    for (const kid of clothesGroup.querySelectorAll('button')) {
      const on = kid.dataset.suit === suitId
      kid.setAttribute('aria-checked', on ? 'true' : 'false')
      kid.classList.toggle('on', on)
      kid.setAttribute('aria-label', t('suitLook') + ': ' + kid.textContent)
    }
  }
  paintClothes()
  clothes.append(clothesLab, clothesGroup)
  g.append(
    sens,
    range,
    lookPill(t('invertY'), () => lookInvert, () => { lookInvert = !lookInvert; applyLook() }, 'invert', 'invert'),
    lookPill(t('wideView'), () => wideView, () => { wideView = !wideView; applyLook() }, '', 'wide'),
    lookPill(t('autoJump'), () => autoClimb, () => { autoClimb = !autoClimb; applyLook() }, '', 'climb'),
    lookPill(t('showHand'), () => showHand, () => { showHand = !showHand; applyLook() }, '', 'hand'),
    side,
    cam,
    clothes,
    lookPill(t('hideTips'), () => learn.hideTips(), () => { learn.setHideTips(!learn.hideTips()) }, 'tips', 'tips'),
  )
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
  if (performance.now() < lookHoldUntil) return
  applyLockedLook(dx, dy)
  if (dx || dy) fadeKeys()
}, true)
let deskStationAt = 0
function deskOpenStation(hit) {
  if (TOUCH_UI || !hit) return false
  if (bot && bot.swallowPlace && bot.swallowPlace()) return false
  const id = hit.blockID != null ? hit.blockID : hit.id
  if (id !== ID.workbench && id !== ID.box) return false
  const now = performance.now()
  if (now - deskStationAt < 350) return true
  deskStationAt = now
  const pos = hit.position || [hit.x, hit.y, hit.z]
  useAt({ position: pos, blockID: id, id })
  return true
}
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
  const desktop = !TOUCH_UI && e.pointerType !== 'touch'
  if (desktop && awaitWorldClick) {
    armActLock()
    return
  }
  if ((e.button === 0 || e.button < 0) && eatResume(e)) return
  if (desktop && resumeSwallow) return
  if (desktop && !playLocked() && performance.now() < lockSwallowUntil) return
  if (desktop && !playLocked() && !tableMode && !anyCard() && !playArmed && (e.button === 0 || e.button < 0)) return
  const wandClick = wandHeld() && (e.button === 0 || e.button < 0)
  if (wandClick) {
    wandPress = { button: 0, t: e.timeStamp, x: e.clientX, y: e.clientY, moved: 0 }
  } else if ((e.button === 0 || e.button < 0) && e.isTrusted && (e.buttons & 1)) { mouseLeft = true; leftDown = true; leftPress = { id: ++leftPressId, t: performance.now(), x: e.clientX, y: e.clientY, acted: false } }
  if (e.button > 0 || tableMode) return
  look = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, t: e.timeStamp, moved: 0, looking: false, pt: e.pointerType || '' }
  if (look.pt === 'touch' || look.pt === 'pen' || ((TOUCH_UI || playArmed) && !playLocked())) look.pt = 'touch'
  lastPointer = { x: e.clientX, y: e.clientY }
  if (wandClick) { dig = null; hideCrack(); return }
  if ((e.button === 0 || e.button < 0) && treeGesture() === 'chop') {
    dig = null
    return
  }
  const finger = look.pt === 'touch'
  const seen = finger ? null : cropOnLook()
  const hit = seen
    ? { id: seen.id, blockID: seen.id, position: [seen.x, seen.y, seen.z], adjacent: [seen.x, seen.y + 1, seen.z] }
    : (finger ? rayAt(e.clientX, e.clientY, true) : targetHit())
  if (hit && (hit.id === TECH.button || hit.blockID === TECH.button || hit.id === TECH.buttonOn || hit.blockID === TECH.buttonOn) && hit.position && canReach(hit.position)) {
    pressButton(hit.position[0], hit.position[1], hit.position[2])
    buttonHold = { x: hit.position[0], y: hit.position[1], z: hit.position[2] }
  }
  if (hit && finger && !tableMode && hit.far) {
    const tree = scanTree()
    if (tree && tree.d > TREE_NEAR) showMoveCloser(tree)
    else farHit = { x: hit.position[0], y: hit.position[1], z: hit.position[2], t0: performance.now(), shown: false }
    dig = null
    hideCrack()
  } else if (hit && !hit.far) {
    hideWalkCloser()
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
    if (survivalOn()) {
      const tree = scanTree()
      if (tree && tree.d > TREE_NEAR) showMoveCloser(tree)
      else if (!finger) breakMiss()
    }
  }
})
canvas.addEventListener('pointermove', (e) => {
  if (!look || e.pointerId !== look.id) return
  if (performance.now() < lookHoldUntil) return
  if (look.pt === 'touch') {
    const drift = Math.hypot(e.clientX - look.sx, e.clientY - look.sy)
    look.moved = drift
    if (drift >= 24) farHit = null
    if (drift < 24) { look.x = e.clientX; look.y = e.clientY; return }
    lastLookAt = performance.now()
    if (dig && dig.kind === 'touch') { clearWoodTip(); dig = null; hideCrack() }
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
  if (wandPress && (e.button === 0 || e.button < 0)) {
    finishWandPress(e)
    look = null
    dig = null
    hideCrack()
    return
  }
  if (buttonHold) {
    releaseButton(buttonHold.x, buttonHold.y, buttonHold.z)
    buttonHold = null
  }
  releaseFar()
  if (e.button === 0 || e.button < 0) { mouseLeft = false; leftDown = false }
  if (!playArmed && !actThisClick && !TOUCH_UI && !tableMode && !anyCard() && !playLocked() && (e.button === 0 || e.button < 0)) {
    showPlayChip()
    grabLock()
  }
  if ((e.button === 0 || e.button < 0) && dig && !dig.broke && (isCropId(dig.id) || isBushId(dig.id)) && !fruitingAt(dig.x, dig.y, dig.z, getVoxel(dig.x, dig.y, dig.z))) {
    dig = null
    hideCrack()
  }
  if (swallowing()) {
    flashHoldHint(dig)
    look = null
    dig = null
    return
  }
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
    if (moved < 24 && held < 500) {
      const tree = scanTree()
      if (tree && tree.d > TREE_NEAR) showMoveCloser(tree)
      else showWalkCloser(e.clientX, e.clientY)
    }
    return
  }
  const handId = session && session.blockForHot ? session.blockForHot() : 0
  const heldKey = session && session.selectedItem ? session.selectedItem() : ''
  const tapUse = heldKey === 'berry' || heldKey === 'bread' || heldKey === 'cupcake'
  const breakTap = lookWasTouch && survivalOn() && held < 500 && !broke && down && !isUseBlock(down.id) && !(face && face.position && isFoundryConsole(face.id != null ? face.id : face.blockID, face.position[0], face.position[2])) && !handId && !tapUse
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
  const upUse = up && (isUseBlock(up.id) || machineKind(up.id) || isFoundryConsole(up.id, up.x, up.z))
  if ((touchTap || mouseTap) && (downUse || upUse)) {
    dig = null
    hideCrack()
    const target = (downUse ? face : null) || upHit || face
    const tid = target ? (target.blockID != null ? target.blockID : target.id) : 0
    if (machineKind(tid) && crouching() && placeableHeld()) placeBlock(target)
    else useAt(target)
    return
  }
  if (!lookWasTouch && !survivalOn() && !anyCard() && held < 400 && moved < 8 && down && !broke && !(down && (isShopBlock(down.id) || down.id === ID.bunk)) && leftPress && !leftPress.acted) {
    leftPress.acted = true
    breakAt(down.x, down.y, down.z)
    dig = null
    hideCrack()
    return
  }
  // 2.5.370: a touch tap in town aimed at a far mob says No fighting here (only when no block is under the finger)
  if (touchTap && !up && !down && safeZoneFightTap()) return
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
// 2.5.396: while the mouse is locked, clicks land on #stage; hear them for the wand
if (stageEl) {
  stageEl.addEventListener('pointerdown', (e) => {
    if (e.target === stageEl && playLocked() && !anyCard() && e.button === 0 && e.isTrusted && (e.buttons & 1)) { if (wandHeld()) wandPress = { x: e.clientX, y: e.clientY, t: performance.now() }; else { mouseLeft = true; leftDown = true; leftPress = { id: ++leftPressId, t: performance.now(), x: e.clientX, y: e.clientY, acted: false } } }
  })
  stageEl.addEventListener('pointerup', (e) => {
    if (e.target === stageEl && playLocked() && wandHeld() && !anyCard()) finishWandPress(e)
  })
}
canvas.addEventListener('pointercancel', () => {
  actThisClick = false
  if (buttonHold) {
    releaseButton(buttonHold.x, buttonHold.y, buttonHold.z)
    buttonHold = null
  }
  look = null; leftDown = false; mouseLeft = false; dig = null; hideCrack(); farHit = null; releaseFar()
})
window.addEventListener('pointerdown', (e) => {
  rightDown = !!(e.buttons & 2) || e.button === 2
  if (e.button === 2 && wandHeld() && (canvasHit(e) || (playLocked() && e.target === stageEl))) {
    wandPress = { button: 2, t: e.timeStamp, x: e.clientX, y: e.clientY, moved: 0 }
    e.preventDefault()
    e.stopPropagation()
    return
  }
  if (e.button !== 2 || tableMode || !sheetEl.hidden) return
  if (!TOUCH_UI && (canvasHit(e) || e.target === stageEl || (stageEl && stageEl.contains(e.target)) || document.pointerLockElement)) {
    if (deskOpenStation(targetHit())) {
      e.preventDefault()
      e.stopPropagation()
      mouseRight = false
      rightPress = null
      return
    }
  }
  const lockedPlay = !!(document.pointerLockElement && !TOUCH_UI && e.button === 2)
  if (!canvasHit(e) && !lockedPlay) return
  const lockFirst = awaitWorldClick && !TOUCH_UI && e.pointerType !== 'touch'
  const peek = lockFirst ? targetHit() : null
  const doorFirst = !!(peek && isDoor(peek.blockID))
  if (lockFirst && !doorFirst) { armActLock(); return }
  if (!lockFirst && !TOUCH_UI && e.pointerType !== 'touch' && !playLocked() && performance.now() < lockSwallowUntil) return
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
    rightPress.placed = !!placeBlock(snap)
    if (rightPress.placed) {
      mouseRight = true
      placeHoldAt = performance.now()
    } else mouseRight = false
  } else mouseRight = false
  if (!reachable && !tableMode && !anyCard() && placeableHeld()) toastFarKey()
  if (lockFirst && doorFirst) armActLock()
}, true)
window.addEventListener('pointermove', (e) => {
  if (wandPress) {
    const dx = e.movementX || (e.clientX - wandPress.x)
    const dy = e.movementY || (e.clientY - wandPress.y)
    wandPress.moved += Math.abs(dx) + Math.abs(dy)
    wandPress.x = e.clientX
    wandPress.y = e.clientY
  }
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
  if (!TOUCH_UI && down && (down.id === ID.workbench || down.id === ID.box)) {
    deskOpenStation({ id: down.id, blockID: down.id, position: [down.x, down.y, down.z] })
    return
  }
  if (press.locked) {
    if (down && up && down.x === up.x && down.y === up.y && down.z === up.z) placeBlock(upHit)
    return
  }
  const sameDoor = down && up && isDoor(down.id) && isDoor(up.id) && down.x === up.x && down.y === up.y && down.z === up.z && press.moved <= 16 && (!e || e.timeStamp - press.t < 400)
  if (sameDoor || canUse(down, up, press.moved, false)) placeBlock(upHit)
}
window.addEventListener('blur', () => dropLeft())
window.addEventListener('pointercancel', () => dropLeft())
window.addEventListener('pointerup', (e) => {
  if (leftPress && !(e.buttons & 1)) dropLeft()
  if (e.button === 2 || !(e.buttons & 2)) rightDown = false
  if (wandPress && e.button === 2) { finishWandPress(e); return }
  releaseFar()
  if (e.button === 0) { mouseLeft = false; leftDown = false }
  if (e.button === 2) finishRight(e)
}, true)
window.addEventListener('pointercancel', () => { rightPress = null; mouseRight = false; rightDown = false; releaseFar() })
window.addEventListener('blur', () => {
  dropRightHold()
  downHeld = false
  crouchKey = false
  spaceChop = false
  treeHold = false
  jumpHeld = false
  window.__playChipGone = false
  try {
    noa.inputs.state.fire = false
    noa.inputs.state.forward = false
    noa.inputs.state.backward = false
    noa.inputs.state.left = false
    noa.inputs.state.right = false
    noa.inputs.state.jump = false
  } catch (e) {}
})
for (const el of document.querySelectorAll('[data-hold]')) {
  const st = el.dataset.hold
  const on = (e) => { e.preventDefault(); noa.inputs.state[st] = true; el.classList.add('down'); if (st === 'jump') jumpDown() }
  const off = () => { noa.inputs.state[st] = false; el.classList.remove('down'); if (st === 'jump') jumpUp() }
  el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off)
  el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off)
}
$('t-place').addEventListener('click', () => {
  if (bot && bot.tryArmed && bot.tryArmed()) return
  const aimed = noa.targetedBlock || targetHit()
  if (tryEatClick(aimed)) return
  placeBlock()
})
$('t-break').addEventListener('click', () => {
  if (combatTarget()) { doBonk(); return }
  if (safeZoneFightTap()) return
  breakBlock()
})
const bonkBtn = document.getElementById('t-bonk')
if (bonkBtn) bonkBtn.addEventListener('click', () => { if (combatTarget()) doBonk() })
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
if (stickPad) stickPad.addEventListener('contextmenu', (e) => e.preventDefault())
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
scene.fogColor = new Color3(0.625, 0.71, 0.735)
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
Effect.ShadersStore.bertSkyFragmentShader = 'precision highp float;varying vec3 vPos;uniform float uTime;uniform float uFlat;uniform float uStars;uniform vec3 uZenith;uniform vec3 uHorizon;void main(){vec3 n=normalize(vPos);float h=smoothstep(0.42,0.95,n.y);vec3 col=mix(uHorizon,uZenith,h);if(uFlat>0.5)col=uHorizon;float star=step(0.9975,fract(sin(dot(floor(n.xy*120.0)+floor(n.yz*70.0),vec2(12.9898,78.233)))*43758.5453));col+=vec3(0.95,0.97,1.0)*star*uStars*smoothstep(0.05,0.4,n.y);gl_FragColor=vec4(col,1.0);}'
const skyMat = new ShaderMaterial('sky', scene, { vertex: 'bertSky', fragment: 'bertSky' }, { attributes: ['position'], uniforms: ['worldViewProjection', 'uTime', 'uFlat', 'uStars', 'uZenith', 'uHorizon'] })
skyMat.backFaceCulling = false
skyMat.disableDepthWrite = true
skyMat.fogEnabled = false
skyMat.setFloat('uTime', 0)
skyMat.setFloat('uFlat', 0)
skyMat.setFloat('uStars', 0)
skyMat.setColor3('uZenith', new Color3(0.20, 0.38, 0.62))
skyMat.setColor3('uHorizon', new Color3(0.70, 0.80, 0.86))
const sky = CreateSphere('sky', { diameter: 900, segments: 12 }, scene)
sky.material = skyMat
sky.isPickable = false
sky.infiniteDistance = true
sky.alwaysSelectAsActiveMesh = true
noa.rendering.addMeshToScene(sky, false)
function skyDisc(name, rgb, local) {
  const mesh = CreatePlane(name, { size: 4.5 }, scene)
  const mat = new StandardMaterial(name + '-m', scene)
  mat.emissiveColor = new Color3(rgb[0], rgb[1], rgb[2])
  mat.disableLighting = true
  mat.backFaceCulling = false
  mat.fogEnabled = false
  mesh.material = mat
  mesh.isPickable = false
  mesh.infiniteDistance = true
  mesh.billboardMode = Mesh.BILLBOARDMODE_ALL
  mesh.parent = noa.rendering.camera
  mesh.position.set(local[0], local[1], local[2])
  mesh.alwaysSelectAsActiveMesh = true
  noa.rendering.addMeshToScene(mesh, false)
  return mesh
}
const sunQuad = skyDisc('sun-quad', [0.95, 0.90, 0.66], [-6, 11, 22])
const moonQuad = skyDisc('moon-quad', [0.9, 0.93, 1], [7, 10, 22])
const skyZen = new Color3(0.20, 0.38, 0.62)
const skyHor = new Color3(0.70, 0.80, 0.86)
const skyEase = { phase: '', z: [0.20, 0.38, 0.62], h: [0.70, 0.80, 0.86], f: [0.625, 0.71, 0.735], stars: 0, sun: 1, moon: 0, fromZ: null, fromH: null, fromF: null, fromStars: 0, fromSun: 1, fromMoon: 0, t0: 0 }
function skyGlideMs() {
  try {
    if (document.documentElement.getAttribute('data-kp-motion') === 'less') return 1000
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 1000
  } catch (e) {}
  return 3000
}
function mix3(out, from, to, u) {
  out[0] = from[0] + (to[0] - from[0]) * u
  out[1] = from[1] + (to[1] - from[1]) * u
  out[2] = from[2] + (to[2] - from[2]) * u
}
function applySky() {
  const phase = basics && basics.phase ? basics.phase() : 'day'
  const row = gfxLook.sky(phase)
  const tz = row.zenith
  const th = row.horizon
  const tf = atmosphereFog(phase, row)
  const now = performance.now()
  if (!skyEase.fromZ || skyEase.phase !== phase) {
    if (!skyEase.fromZ) {
      skyEase.z = tz.slice()
      skyEase.h = th.slice()
      skyEase.f = tf.slice()
      skyEase.stars = row.stars
      skyEase.sun = row.sun
      skyEase.moon = row.moon
    }
    skyEase.fromZ = skyEase.z.slice()
    skyEase.fromH = skyEase.h.slice()
    skyEase.fromF = skyEase.f.slice()
    skyEase.fromStars = skyEase.stars
    skyEase.fromSun = skyEase.sun
    skyEase.fromMoon = skyEase.moon
    skyEase.phase = phase
    skyEase.t0 = now
  }
  const u = Math.min(1, (now - skyEase.t0) / skyGlideMs())
  mix3(skyEase.z, skyEase.fromZ, tz, u)
  mix3(skyEase.h, skyEase.fromH, th, u)
  mix3(skyEase.f, skyEase.fromF, tf, u)
  skyEase.stars = skyEase.fromStars + (row.stars - skyEase.fromStars) * u
  skyEase.sun = skyEase.fromSun + (row.sun - skyEase.fromSun) * u
  skyEase.moon = skyEase.fromMoon + (row.moon - skyEase.fromMoon) * u
  skyZen.set(skyEase.z[0], skyEase.z[1], skyEase.z[2])
  skyHor.set(skyEase.h[0], skyEase.h[1], skyEase.h[2])
  skyMat.setColor3('uZenith', skyZen)
  skyMat.setColor3('uHorizon', skyHor)
  skyMat.setFloat('uFlat', row.flat ? 1 : 0)
  skyMat.setFloat('uStars', skyEase.stars)
  sunQuad.setEnabled(skyEase.sun > 0.2)
  moonQuad.setEnabled(skyEase.moon > 0.2)
  if (!underWater) {
    const fog = skyEase.f
    scene.fogColor.set(fog[0], fog[1], fog[2])
    if (scene.clearColor) scene.clearColor.set(skyEase.h[0], skyEase.h[1], skyEase.h[2], 1)
    if (gfxLook.name !== 'lite') {
      const end = scene.fogEnd || 32
      const far = phase === 'dusk' || phase === 'dawn' ? 0.62 : 0.55
      scene.fogStart = Math.max(scene.fogStart || 0, end * far)
    }
  }
}
function atmosphereFog(phase, row) {
  const h = row.horizon
  if (gfxLook.name === 'lite') return h
  const cap = (c) => Math.min(0.85, c)
  let out
  if (phase === 'dusk') out = [h[0] * 0.38 + 0.32, h[1] * 0.38 + 0.28, h[2] * 0.38 + 0.24]
  else if (phase === 'dawn') out = [h[0] * 0.45 + 0.26, h[1] * 0.45 + 0.24, h[2] * 0.45 + 0.22]
  else if (phase === 'night') out = [h[0] * 0.55 + 0.05, h[1] * 0.55 + 0.06, h[2] * 0.55 + 0.07]
  else out = [h[0] * 0.75 + 0.10, h[1] * 0.75 + 0.11, h[2] * 0.75 + 0.09]
  return [cap(out[0]), cap(out[1]), cap(out[2])]
}
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
  const target = k >= 0.92 ? 1 : k >= 0.6 ? 0.84 + (k - 0.6) * (0.16 / 0.32) : 0.60 + (k - 0.4) * (0.24 / 0.2)
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
  applySky()
  const warm = gfxLook.name === 'lite' ? [1, 1, 1] : [1.02, 1, 0.92]
  scene.ambientColor.set(DAY_AMB[0] * k, DAY_AMB[1] * k, DAY_AMB[2] * k)
  sunLight.diffuse.set(DAY_DIFF.r * k * warm[0], DAY_DIFF.g * k * warm[1], DAY_DIFF.b * k * warm[2])
  sunLight.specular.set(DAY_SPEC.r * k * warm[0], DAY_SPEC.g * k * warm[1], DAY_SPEC.b * k * warm[2])

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
          if (id === 47) {
            const rec = session && session.meta && session.meta.get(x + ',' + y + ',' + z)
            if (rec && rec.circuitLit) found.push({ x, y, z, radius: 7, step: 1 })
          }
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
      sunLight.diffuse.set(DAY_DIFF.r * sunK * warm[0], DAY_DIFF.g * sunK * warm[1], DAY_DIFF.b * sunK * warm[2])
      sunLight.specular.set(DAY_SPEC.r * sunK * warm[0], DAY_SPEC.g * sunK * warm[1], DAY_SPEC.b * sunK * warm[2])
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
  suitCounts.push(n)
  const cols = new Float32Array(n * 4)
  for (let i = 0; i < n; i++) { cols[i * 4] = rgb[0]; cols[i * 4 + 1] = rgb[1]; cols[i * 4 + 2] = rgb[2]; cols[i * 4 + 3] = 1 }
  m.setVerticesData(VertexBuffer.ColorKind, cols)
  m.isPickable = false
  return m
}
const suitCounts = []
const SUIT_KEYS = ['shoe', 'pant', 'pant', 'shirt', 'head', 'visor']
const SUITS = {
  berty: { shoe: [0.08, 0.12, 0.16], pant: [0.06, 0.42, 0.5], shirt: [0.12, 0.82, 0.76], head: [0.45, 0.95, 0.9], visor: [0.72, 0.4, 1], hand: [0.82, 0.82, 0.82] },
  clay: { shoe: [0.37, 0.7, 0.77], pant: [0.14, 0.23, 0.29], shirt: [0.16, 0.2, 0.28], head: [0.84, 0.71, 0.54], visor: [0.29, 0.2, 0.16], hand: [0.84, 0.71, 0.54] },
  bearcat: { shoe: [0.1, 0.11, 0.14], pant: [0.11, 0.14, 0.2], shirt: [0.94, 0.54, 0.14], head: [0.9, 0.76, 0.64], visor: [0.11, 0.14, 0.2], hand: [0.94, 0.54, 0.14] },
  grove: { shoe: [0.23, 0.16, 0.11], pant: [0.42, 0.26, 0.14], shirt: [0.24, 0.56, 0.38], head: [0.88, 0.71, 0.54], visor: [0.18, 0.42, 0.28], hand: [0.88, 0.71, 0.54] },
  snow: { shoe: [0.23, 0.27, 0.33], pant: [0.56, 0.78, 0.85], shirt: [0.93, 0.95, 0.97], head: [0.94, 0.82, 0.72], visor: [0.35, 0.45, 0.55], hand: [0.94, 0.82, 0.72] },
}
const SUIT_WORD = { berty: 'Berty', clay: 'Clay', bearcat: 'Bearcat', grove: 'Grove', snow: 'Snow' }
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
const armMat = new StandardMaterial('berty-arm', scene)
armMat.diffuseColor = new Color3(0.12, 0.82, 0.76)
armMat.emissiveColor = new Color3(0.04, 0.28, 0.26)
armMat.specularColor = new Color3(0.04, 0.04, 0.04)
function makeArm(name, x) {
  const arm = CreateBox(name, { width: 0.12, height: 0.42, depth: 0.12 }, scene)
  arm.material = armMat
  arm.isPickable = false
  arm.setPivotPoint(new Vector3(0, 0.21, 0))
  arm.position.set(x, 0.02, 0)
  arm.parent = berty
  return arm
}
const armL = makeArm('berty-arm-l', -0.28)
const armR = makeArm('berty-arm-r', 0.28)
function paintBertySuit() {
  const suit = SUITS[suitId] || SUITS.berty
  const colors = berty.getVerticesData(VertexBuffer.ColorKind)
  let need = 0
  for (let i = 0; i < suitCounts.length; i++) need += suitCounts[i]
  if (colors && colors.length === need * 4 && suitCounts.length === SUIT_KEYS.length) {
    let o = 0
    for (let i = 0; i < suitCounts.length; i++) {
      const rgb = suit[SUIT_KEYS[i]]
      const n = suitCounts[i]
      for (let v = 0; v < n; v++) {
        const p = (o + v) * 4
        colors[p] = rgb[0]
        colors[p + 1] = rgb[1]
        colors[p + 2] = rgb[2]
      }
      o += n
    }
    berty.setVerticesData(VertexBuffer.ColorKind, colors)
  }
  armMat.diffuseColor.set(suit.shirt[0], suit.shirt[1], suit.shirt[2])
  armMat.emissiveColor.set(suit.shirt[0] * 0.34, suit.shirt[1] * 0.34, suit.shirt[2] * 0.34)
  if (hands && hands.tint) hands.tint(suit.hand)
}
paintBertySuit()
const heldMat = new StandardMaterial('berty-held-mat', scene)
heldMat.specularColor = new Color3(0, 0, 0)
heldMat.diffuseColor = new Color3(0.45, 0.62, 0.32)
const heldBox = CreateBox('berty-held', { size: 0.2 }, scene)
heldBox.material = heldMat
heldBox.isPickable = false
heldBox.position.set(0, -0.48, 0.14)
heldBox.parent = armR
heldBox.setEnabled(false)
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
function wandBoxPoints() {
  const h = 0.5
  const p = [
    new Vector3(-h, -h, -h), new Vector3(h, -h, -h), new Vector3(h, -h, h), new Vector3(-h, -h, h),
    new Vector3(-h, h, -h), new Vector3(h, h, -h), new Vector3(h, h, h), new Vector3(-h, h, h),
  ]
  const order = [0, 1, 2, 3, 0, 4, 5, 6, 7, 4, 5, 1, 2, 6, 7, 3]
  return order.map((i) => p[i])
}
wandLine = CreateLines('wand-box', { points: wandBoxPoints() }, scene)
wandLine.color = new Color3(1, 0.54, 0.12)
wandLine.isPickable = false
wandLine.setEnabled(false)
noa.rendering.addMeshToScene(wandLine)
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
const blockedMat = new StandardMaterial('place-ghost-blocked', scene) // 2.5.449: red outline, no fill
blockedMat.diffuseColor = new Color3(0.8, 0.1, 0.1)
blockedMat.emissiveColor = new Color3(0.6, 0.05, 0.05)
blockedMat.specularColor = new Color3(0, 0, 0)
blockedMat.alpha = 0.0
blockedMat.transparencyMode = 2
blockedMat.backFaceCulling = false
const tealMat = new StandardMaterial('place-ghost-teal', scene) // 2.5.449: teal fill for fits
tealMat.diffuseColor = new Color3(0.13, 0.72, 0.7)
tealMat.emissiveColor = new Color3(0, 0, 0)
tealMat.specularColor = new Color3(0, 0, 0)
tealMat.alpha = 0.25
tealMat.transparencyMode = 2
tealMat.backFaceCulling = false
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
function ghostBedScale(on) {
  const s = on ? (0.55 / 0.98) : 1
  if (placeGhost) placeGhost.scaling.set(1, s, 1)
  if (placeGhostSide) placeGhostSide.scaling.set(1, s, 1)
}
function seedHeld() {
  if (!survivalOn() || !session || !session.selectedItem) return false
  return (session.selectedItem() || '') === 'wheatSeeds'
}
function hideGhosts() {
  if (placeGhost) placeGhost.setEnabled(false)
  if (placeGhostSide) placeGhostSide.setEnabled(false)
}
function ghostEdge(mesh, rgb) {
  if (!mesh || !mesh.enableEdgesRendering) return
  const key = rgb.join(',')
  if (mesh.__edgeKey === key) return
  mesh.enableEdgesRendering()
  mesh.edgesWidth = 2
  mesh.edgesColor = new Color4(rgb[0], rgb[1], rgb[2], 1)
  mesh.__edgeKey = key
}
let cueState = ''
function paintCue(kind, reason) {
  const el = document.getElementById('place-cue')
  const live = document.getElementById('place-cue-live')
  if (!el) return
  const why = reason || ''
  const label = kind === 'ok' ? t('placeFits') : kind === 'no' ? why : ''
  const next = kind ? kind + ':' + label : ''
  if (cueState === next) return
  cueState = next
  el.hidden = !kind
  el.dataset.state = kind || ''
  const mark = el.querySelector('.mark')
  const word = el.querySelector('.word')
  if (mark) mark.textContent = kind === 'ok' ? '✓' : kind === 'no' ? '✕' : ''
  if (word) word.textContent = label
  if (live && live.textContent !== label) live.textContent = label
}
function paintSoilTip(on) {
  const el = document.getElementById('soil-tip')
  const live = document.getElementById('place-cue-live')
  if (!el) return
  if (!on) {
    el.hidden = true
    const cue = document.getElementById('place-cue')
    if (live && cue && cue.hidden && live.textContent) live.textContent = ''
    return
  }
  const word = el.querySelector('.word')
  const text = t('needsFarmSoil')
  if (word && word.textContent !== text) word.textContent = text
  el.hidden = false
  if (live && live.textContent !== text) live.textContent = text
}
function syncPlaceGhost() {
  noteMissingAim()
  if (seedHeld()) {
    hideGhosts()
    if (placeGhostSide) placeGhostSide.scaling.set(1, 1, 1)
    const aimed = tableMode ? tableTarget() : noa.targetedBlock
    const soilId = aimed && (aimed.blockID || 0)
    const soil = soilId === DRY || soilId === WET
    if (!aimed || !aimed.position || !soil) {
      if (outline) outline.color.copyFrom(cyanLine)
      paintCue('', '')
      paintSoilTip(!!aimed)
      return
    }
    paintSoilTip(false)
    placeGhost.scaling.set(0.34, 0.42, 0.34)
    placeGhost.material = tealMat
    ghostEdge(placeGhost, [0.08, 0.45, 0.48])
    const x = Math.round(aimed.position[0])
    const y = Math.round(aimed.position[1])
    const z = Math.round(aimed.position[2])
    const lp = noa.globalToLocal([x + 0.5, y + 1.21, z + 0.5], null, ghostLocal)
    placeGhost.position.set(lp[0], lp[1], lp[2])
    placeGhost.setEnabled(true)
    paintCue('ok', '')
    return
  }
  paintSoilTip(false)
  const spot = ghostCell()
  if (!spot) {
    hideGhosts()
    if (outline) outline.color.copyFrom(cyanLine)
    paintCue('', '')
    return
  }
  const id = heldBlockId()
  let side = null
  let amber = false
  let bunkWhy = ''
  if (id === ID.woodshop || id === ID.bunk) {
    side = shopSpan(spot.x, spot.y, spot.z)
    if (id === ID.bunk) {
      bunkWhy = bedBlockReason(spot.x, spot.y, spot.z, side)
      amber = !!bunkWhy
    } else amber = shopBlocked(side) || !canReach([side.sx, side.sy, side.sz])
  }
  if (id === ID.bunk) ghostBedScale(true)
  else {
    placeGhost.scaling.set(1, 1, 1)
    if (placeGhostSide) placeGhostSide.scaling.set(1, 1, 1)
  }
  if (amber) {
    placeGhost.material = blockedMat
    placeGhostSide.material = blockedMat
    ghostEdge(placeGhost, [0.9, 0.15, 0.15])
    ghostEdge(placeGhostSide, [0.9, 0.15, 0.15])
    outline.color.set(0.9, 0.15, 0.15)
    paintCue('no', id === ID.bunk ? (bunkWhy === 'far' ? t('tooFar') : t(bunkWhy || 'bedFloor')) : t('noRoom'))
  } else {
    placeGhost.material = tealMat
    placeGhostSide.material = tealMat
    ghostEdge(placeGhost, [0.08, 0.45, 0.48])
    ghostEdge(placeGhostSide, [0.08, 0.45, 0.48])
    outline.color.set(0.13, 0.55, 0.58)
    paintCue('ok', '')
  }
  const gy = id === ID.bunk ? 0.275 : 0.5
  const lp = noa.globalToLocal([spot.x + 0.5, spot.y + gy, spot.z + 0.5], null, ghostLocal)
  placeGhost.position.set(lp[0], lp[1], lp[2])
  placeGhost.setEnabled(true)
  if (side) {
    const lp2 = noa.globalToLocal([side.sx + 0.5, side.sy + gy, side.sz + 0.5], null, ghostLocal2)
    placeGhostSide.position.set(lp2[0], lp2[1], lp2[2])
    placeGhostSide.setEnabled(true)
  } else placeGhostSide.setEnabled(false)
}
function paintOutline() {
  const tgt = noa.targetedBlock
  const pos = tgt ? tgt.position : (tableMode ? tableCursor : null)
  if (!pos) { outline.scaling.set(1, 1, 1); outline.setEnabled(false); syncPlaceGhost(); return }
  const id = tgt ? (tgt.blockID || 0) : 0
  const low = lowPlant(id)
  outline.scaling.set(low ? 0.6 / 1.04 : 1, low ? 0.7 / 1.04 : 1, low ? 0.6 / 1.04 : 1)
  const oneBox = !!(heldBlockId() && ghostCell()) || (seedHeld() && (id === DRY || id === WET))
  outline.setEnabled(!oneBox)
  if (!oneBox) {
    const local = noa.globalToLocal([pos[0] + 0.5, pos[1] + (low ? 0.35 : 0.5), pos[2] + 0.5], null, [])
    outline.position.copyFromFloats(local[0], local[1], local[2])
  }
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
      applySky()
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
  if (wandHeld()) {
    heldScratch.kind = 'flat'
    heldScratch.key = 'buildWand'
    return heldScratch
  }
  if (survivalOn() && session && session.selectedItem) {
    const key = session.selectedItem() || ''
    if (!key) return heldScratch
    const def = ITEMS[key]
    if (key === 'wheatSeeds' || key === 'bushSprout') return heldScratch
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
function poseBerty(dt) {
  const body = noa.ents.getPhysicsBody(noa.playerEntity)
  const sp = body ? Math.hypot(body.velocity[0], body.velocity[2]) : 0
  let dy = noa.camera.heading - berty.rotation.y
  while (dy > Math.PI) dy -= Math.PI * 2
  while (dy < -Math.PI) dy += Math.PI * 2
  berty.rotation.y += dy * (1 - Math.exp(-(dt || 16) / 90))
  const swing = sp > 0.4 ? Math.sin(performance.now() / 140) * 0.65 : 0
  armL.rotation.x = swing
  armR.rotation.x = -swing
  const held = fillHeld()
  const show = (noa.camera.zoomDistance || 0) > 0.5 && held.kind !== 'empty'
  heldBox.setEnabled(show)
  if (!show) return
  const arm = mainHand === 'left' ? armL : armR
  if (heldBox.parent !== arm) heldBox.parent = arm
  const c = DROP_TINT[held.key] || [0.45, 0.62, 0.32]
  heldMat.diffuseColor.set(c[0], c[1], c[2])
  heldMat.emissiveColor.set(c[0] * 0.45, c[1] * 0.45, c[2] * 0.45)
}
hands = createHands({
  scene,
  camera: noa.rendering.camera,
  noa,
  held: fillHeld,
  wandMode: () => wandMode,
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
paintBertySuit()
let beltAt = 0
const beltArrows = new Map()
const beltBadges = new Map()
const beltMats = new Map()
const beltFull = new Map()
let beltArrowMat = null
let beltFullMat = null
function beltArrowLook() {
  if (beltArrowMat) return beltArrowMat
  beltArrowMat = dye('belt-arrow-mat', 0.13, 0.83, 0.93)
  beltArrowMat.emissiveColor = new Color3(0.13, 0.83, 0.93)
  beltArrowMat.disableLighting = true
  return beltArrowMat
}
function beltFullLook() {
  if (beltFullMat) return beltFullMat
  beltFullMat = dye('belt-full-mat', 0.13, 0.83, 0.93)
  beltFullMat.emissiveColor = new Color3(0.13, 0.83, 0.93)
  beltFullMat.alpha = 0.35
  beltFullMat.transparencyMode = 2
  beltFullMat.disableLighting = true
  return beltFullMat
}
function beltBadgeMat(sig, item, n, pause) {
  if (beltMats.has(sig)) return beltMats.get(sig)
  const tex = new DynamicTexture('belt-' + beltMats.size, { width: 64, height: 64 }, shapeScene, false)
  const ctx = tex.getContext()
  ctx.fillStyle = '#10283A'
  ctx.fillRect(0, 0, 64, 64)
  ctx.strokeStyle = '#22D3EE'
  ctx.lineWidth = 4
  ctx.strokeRect(3, 3, 58, 58)
  const letter = (ITEMS[item] && ITEMS[item].letter) || (item ? String(item).slice(0, 2) : '')
  ctx.fillStyle = '#E6EEF2'
  ctx.font = '700 16px sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(String(letter).slice(0, 2), 8, 26)
  ctx.font = '700 26px sans-serif'
  ctx.textAlign = 'right'
  const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const mark = reduce ? (pause ? '⏸' : '▶') : (pause ? 'II' : String(n || 1))
  ctx.fillText(mark, 58, 52)
  tex.update()
  const mat = new StandardMaterial('beltm-' + beltMats.size, shapeScene)
  mat.diffuseTexture = tex
  mat.emissiveTexture = tex
  mat.disableLighting = true
  mat.backFaceCulling = false
  mat.specularColor = new Color3(0, 0, 0)
  beltMats.set(sig, mat)
  return mat
}
function beltSpot(x, y, z, face) {
  const o = face === 'N' ? [0.5, 1.06, 0.78] : face === 'E' ? [0.78, 1.06, 0.5] : face === 'W' ? [0.22, 1.06, 0.5] : [0.5, 1.06, 0.22]
  return [x + o[0], y + o[1], z + o[2]]
}
function hideMap(map, seen) {
  for (const [key, mesh] of map) if (!seen.has(key)) { mesh.setEnabled(false) }
}
function stepBelts(now) {
  if (!belts) return
  if (!beltAt) beltAt = now + 250
  if (now >= beltAt) {
    if (now - beltAt > 250) beltAt = now
    else beltAt += 250
    belts.prune()
    const p = noa.entities.getPosition(noa.playerEntity)
    const anchors = [{ x: p[0], y: p[1], z: p[2] }]
    try { for (const b of bot.dump()) anchors.push({ x: b.x + 0.5, y: b.y, z: b.z + 0.5 }) } catch (e) {}
    belts.tick(anchors)
  }
  const p2 = noa.entities.getPosition(noa.playerEntity)
  const anchors = [{ x: p2[0], y: p2[1], z: p2[2] }]
  try { for (const b of bot.dump()) anchors.push({ x: b.x + 0.5, y: b.y, z: b.z + 0.5 }) } catch (e) {}
  const rows = belts.visuals(anchors)
  const seen = new Set()
  for (const row of rows) {
    const key = row.x + ',' + row.y + ',' + row.z
    seen.add(key)
    let arrow = beltArrows.get(key)
    if (!arrow) {
      arrow = CreateBox('belt-arrow-' + key, { width: 0.28, height: 0.06, depth: 0.18 }, shapeScene)
      arrow.material = beltArrowLook()
      arrow.isPickable = false
      noa.rendering.addMeshToScene(arrow, false)
      beltArrows.set(key, arrow)
    }
    arrow.setEnabled(true)
    const spot = beltSpot(row.x, row.y, row.z, row.face)
    const lp = noa.globalToLocal(spot, null, glowLocal)
    arrow.position.set(lp[0], lp[1], lp[2])
    arrow.rotation.y = row.face === 'N' ? Math.PI : row.face === 'E' ? Math.PI / 2 : row.face === 'W' ? -Math.PI / 2 : 0
    let badge = beltBadges.get(key)
    if (row.n || row.pause) {
      if (!badge) {
        badge = CreatePlane('belt-badge-' + key, { width: 0.46, height: 0.46 }, shapeScene)
        badge.rotation.x = Math.PI / 2
        badge.isPickable = false
        noa.rendering.addMeshToScene(badge, false)
        beltBadges.set(key, badge)
      }
      const sig = (row.pause ? 'p' : 'i') + ':' + (row.item || '') + ':' + row.n
      badge.material = beltBadgeMat(sig, row.item, row.n, row.pause && !row.n)
      badge.setEnabled(true)
      const bp = noa.globalToLocal([row.x + 0.5, row.y + 1.12, row.z + 0.5], null, glowLocal)
      badge.position.set(bp[0], bp[1], bp[2])
    } else if (badge) badge.setEnabled(false)
  }
  hideMap(beltArrows, seen)
  hideMap(beltBadges, seen)
  const fullSeen = new Set()
  const held = belts.stats().full || []
  for (const key of held) {
    fullSeen.add(key)
    const parts = key.split(',').map(Number)
    let mesh = beltFull.get(key)
    if (!mesh) {
      mesh = CreateBox('belt-full-' + key, { width: 1.08, height: 1.08, depth: 1.08 }, shapeScene)
      mesh.material = beltFullLook()
      mesh.isPickable = false
      noa.rendering.addMeshToScene(mesh, false)
      beltFull.set(key, mesh)
    }
    mesh.setEnabled(true)
    const lp = noa.globalToLocal([parts[0] + 0.5, parts[1] + 0.5, parts[2] + 0.5], null, glowLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
  }
  hideMap(beltFull, fullSeen)
}
const _btSeen = new Set()
function _btLog(fn, e) {
  const msg = fn + ' failed: ' + (e && e.message || e)
  if (!_btSeen.has(msg)) { _btSeen.add(msg); console.warn('[bt-combat]', msg) }
}

// C5 boss bar
let bossBar = null
function ensureBossBar() {
  if (bossBar) return bossBar
  bossBar = document.createElement('div')
  bossBar.id = 'boss-bar'
  bossBar.setAttribute('role', 'status')
  bossBar.setAttribute('aria-live', 'polite')
  bossBar.innerHTML = '<div data-boss-vis aria-hidden="true"></div><span data-boss-sr style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap"></span>'
  bossBar.style.cssText = 'background:#0f172a;color:#f8fafc;padding:8px 16px;border-radius:8px;min-width:0;max-width:100%;text-align:center;font-size:14px;line-height:1.25;display:none;box-sizing:border-box'
  bossBar.dir = document.documentElement.dir || 'ltr'
  laneAdd(bossBar, 1)
  return bossBar
}
let lastBossPhase = 0
function paintBossBar() {
  const bar = ensureBossBar()
  if (inSafeZone && playerPos && inSafeZone(playerPos()[0], playerPos()[2])) { bar.style.display = 'none'; capLane(); seatToasts(); return }
  if (mobs && mobs.blockedWorld && mobs.blockedWorld()) { bar.style.display = 'none'; capLane(); seatToasts(); return }
  const list = mobs && mobs.list ? mobs.list() : []
  const boss = list.find(m => m.kind === 'overseer')
  if (!boss) { bar.style.display = 'none'; capLane(); seatToasts(); return }
  const phase = boss.phase || 1
  const phaseWord = phase === 1 ? (t ? t('phase1') : 'Stamp coming') : phase === 2 ? (t ? t('phase2') : 'Conveyor') : (t ? t('phase3') : 'Vent left')
  const weak = boss.weakOpen && performance.now() < boss.weakOpen
  const adds = list.filter(m => m.fromBoss === boss.id).length; const vis = bar.querySelector('[data-boss-vis]'); vis.innerHTML = '⚙️ ' + (t ? t('c5barName') : 'Foundry Overseer') + (adds ? ' ⚡ ×' + adds : '') + '<br><div style="background:#334155;height:8px;border-radius:4px;margin:4px 0"><div style="background:#f59e0b;height:8px;width:' + Math.max(0, Math.round(100 * boss.hp / boss.maxHp)) + '%"></div></div>' + boss.hp + '/' + boss.maxHp + ' · ' + phaseWord + (weak ? '<br>⚡ ' + (t ? t('c5barWeak') : 'Weak point open!') : '')
  vis.innerHTML += '<br>' + (t ? t('c5barHint') : 'Bring a crewmate — it\'s a team boss.')
  bar.style.display = 'block'
  capLane() 
  const step = Math.ceil(4 * Math.max(0, boss.hp) / (boss.maxHp || 1)) * 25
  const say = (t ? t('c5barName') : 'Foundry Overseer') + ' ' + step + '% · ' + phaseWord + (adds ? ' · ⚡ ×' + adds : '') + (weak ? ' · ' + (t ? t('c5barWeak') : 'Weak point open!') : '')
  if (say !== bar._said) { bar._said = say; bar.querySelector('[data-boss-sr]').textContent = say }
  if (phase !== lastBossPhase) lastBossPhase = phase
  // 2.5.376: bar may have grown (weak-point line), so re-check the Stamp warning against it
  if (mobs && mobs.fitStamp) mobs.fitStamp()
  seatToasts()
}

noa.on('beforeRender', (dt) => {
  if (Math.floor(performance.now() / 250) !== (window._bossPaint || 0)) { window._bossPaint = Math.floor(performance.now() / 250); paintBossBar() }
  // 2.5.440: mobs moved to sim tick
  if (window.__shotLook) {
    setLook(window.__shotLook[0], window.__shotLook[1])
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    if (body) { body.gravityMultiplier = 0; body.velocity[1] = 0 }
    const p = noa.entities.getPosition(noa.playerEntity)
    if (p && p[1] < 11) noa.entities.setPosition(noa.playerEntity, [6.2, 12.5, 2.2])
    const toastEl = $('toast')
    if (toastEl) toastEl.hidden = true
  }
  if (window.__useLook && !seated) {
    setLook(window.__useLook[0], window.__useLook[1])
    const body = noa.ents.getPhysicsBody(noa.playerEntity)
    if (body) { body.gravityMultiplier = 0; body.velocity[0] = body.velocity[1] = body.velocity[2] = 0 }
    if (window.__usePos) noa.entities.setPosition(noa.playerEntity, window.__usePos)
    const toastEl = $('toast')
    if (toastEl && toastEl.textContent !== t('notTired')) toastEl.hidden = true
  }
  circuitTick(performance.now())
  stepBelts(performance.now())
  paintOutline()
  paintWandBox()
  paintProtectRing()
  if (basics) syncGlow()
  underwaterTick()
  if (hands) hands.update(dt || 16)
  poseBerty(dt || 16)
  if (!REDUCE) {
    skyTime += (dt || 16) * 0.0004
    skyMat.setFloat('uTime', skyTime)
  }
  if (gfxLook.sway) gfxLook.tickSway(scene, performance.now() * 0.001)
  if (plantHalf) syncPlantCut()
})

const perf = { frames: [], first: 0, deltas: [], jsMs: [], steps: [], level: () => level, get auto() { return AUTO }, quality: () => quality, aa: AA }
{ const sh = noa.container._shell, r = sh.onRender; sh.onRender = function (dt, a1, a2) { const a = performance.now(); r(dt, a1, a2); perf.jsMs.push(performance.now() - a); if (perf.jsMs.length > 2000) perf.jsMs.splice(0, 1000) } }
let last = performance.now(), n = 0, acc = 0
function frame(tnow) {
  if (!frame._suitPainted) { frame._suitPainted = true; paintSuit() }
  if (!perf.first) perf.first = performance.now()
  n++; acc += tnow - last; perf.deltas.push(tnow - last); if (perf.deltas.length > 4000) perf.deltas.splice(0, 2000); last = tnow
  if (acc >= 1000) {
    const fps = (n * 1000) / acc; perf.frames.push(fps); n = 0; acc = 0
    const sample = LOW_FPS ? 12 : (Number.isFinite(window.__autoFps) ? window.__autoFps : fps)
    const moved = gfx.tick(sample, performance.now())
    if (moved) {
      if (moved.plants) plantHalf = gfx.plants < 1
      if (moved.view) {
        noa.world.setAddRemoveDistance(gfx.add, gfx.rem)
        gfx.applyFog()
      }
      if (moved.look) {
        try {
          const shift = gfxLook.autoName(moved.look)
          if (shift && (shift.ao || shift.lights)) applyGraphics()
          else paintGfx()
        } catch (e) { console.warn('graphics', e) }
      }
      if (moved.plants) syncPlantCut()
      const sheet = $('sheet')
      if (!sheet || sheet.hidden) {
        const now = performance.now()
        if (now - (toast.autoAt || 0) > 20000) {
          toast.autoAt = now
          toast(t('autoSmoother'))
        }
      }
      const log = window.__auto && window.__auto.log
      if (log) log.push({ guard: gfx.guard, plants: gfx.plants, add: gfx.add[0], gfx: gfxLook.name, managed: gfxLook.managed, toast: t('autoSmoother'), toastSkipped: !!(sheet && !sheet.hidden) })
      paintQualityNote()
    }
    perf.lastFps = fps
    if (showSpeed) $('perf').textContent = fps.toFixed(0) + ' fps · ' + gfx.label() + ' · ' + Math.round(100 / level) + '% res · ' + noa.world._chunksKnown.count() + ' chunks'
    publishAuto()
    paintQualityNote()
    paintDayClock()
  }
  requestAnimationFrame(frame)
}
noa.world.on('chunkAdded', () => { if (!perf.firstChunk) perf.firstChunk = performance.now() })
requestAnimationFrame(frame)
function paintQuality() {
  for (const b of document.querySelectorAll('[data-q]')) {
    const on = b.dataset.q === quality
    b.setAttribute('aria-checked', String(on)); b.classList.toggle('on', on)
  }
  paintQualityNote()
}
function paintQualityNote() {
  const el = $('q-now'); if (!el) return
  if (quality === 'auto') el.textContent = t('auto') + ' · ' + t(gfx.guardKey())
  else el.textContent = t(quality) + ' · ' + Math.round(100 / level) + '%'
}
function publishAuto() {
  const box = window.__auto || (window.__auto = { log: [] })
  box.guard = gfx.guard
  box.plants = gfx.plants
  box.add = gfx.add[0]
  box.gfx = gfxLook.name
  box.managed = gfxLook.managed
  box.quality = quality
  box.note = ($('q-now') && $('q-now').textContent) || ''
}
function syncPlantCut() {
  const list = noa._objectMesher && noa._objectMesher.allBaseMeshes
  if (!list) return
  for (let m = 0; m < list.length; m++) {
    const mesh = list[m]
    const meshName = mesh && mesh.name || ''
    if (meshName !== 'tuft' && meshName.indexOf('flora-') !== 0) continue
    const store = mesh._thinInstanceDataStorage
    if (!store || !store.matrixData) continue
    const data = store.matrixData
    const count = store.instancesCount || 0
    for (let i = 0; i < count; i++) {
      const o = i * 16
      const hide = plantHalf && (((data[o + 12] | 0) + (data[o + 14] | 0)) & 1)
      if (hide) {
        data[o] = 0
        data[o + 1] = 0
        data[o + 2] = 0
        data[o + 4] = 0
        data[o + 5] = 0
        data[o + 6] = 0
        data[o + 8] = 0
        data[o + 9] = 0
        data[o + 10] = 0
      } else if (data[o] === 0 && data[o + 5] === 0 && data[o + 10] === 0) {
        data[o] = 1
        data[o + 5] = 1
        data[o + 10] = 1
      }
    }
    mesh.thinInstanceBufferUpdated('matrix')
  }
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
  plantHalf = gfx.plants < 1
  syncPlantCut()
  engine.setHardwareScalingLevel(level)
  noa.world.setAddRemoveDistance(gfx.add, gfx.rem)
  gfx.applyFog()
  paintQuality(); toast(t(quality))
}
document.addEventListener('click', (e) => {
  const hit = e.target && e.target.closest && e.target.closest('[data-q],[data-gfx]')
  if (!hit) return
  if (hit.dataset.q) setQuality(hit.dataset.q)
  else if (hit.dataset.gfx) setGraphics(hit.dataset.gfx)
})
paintQuality()
function paintGfx() {
  for (const b of document.querySelectorAll('[data-gfx]')) {
    const on = b.dataset.gfx === gfxLook.name
    b.setAttribute('aria-checked', String(on))
    b.classList.toggle('on', on)
  }
}
function applyGraphics() {
  noa.rendering.useAO = gfxLook.ao
  remeshAll()
  applySky()
  gfxLook.tickSway(scene, performance.now() * 0.001)
  paintGfx()
}
function setGraphics(q) {
  const prevAo = gfxLook.ao
  const prevLights = gfxLook.lightsOn
  const prev = gfxLook.name
  if (!gfxLook.set(q)) return gfxLook.name
  try {
    if (prevAo !== gfxLook.ao || prevLights !== gfxLook.lightsOn) applyGraphics()
    else { applySky(); gfxLook.tickSway(scene, performance.now() * 0.001); paintGfx() }
    if (prev !== gfxLook.name) toast(gfxLook.label())
  } catch (e) { console.warn('graphics', e) }
  return gfxLook.name
}
paintGfx()

const topBar = document.querySelector('.top')
function refit() {
  const bar = document.querySelector('.kb-bar')
  const kb = bar ? Math.ceil(bar.getBoundingClientRect().height) : 0
  if (kb) document.documentElement.style.setProperty('--kb-h', kb + 'px')
  const h = Math.ceil(topBar.getBoundingClientRect().height)
  document.documentElement.style.setProperty('--top-h', h + 'px')
  document.documentElement.style.setProperty('--phone-top', h + 'px')
  layoutLane()
  noa.rendering.resize()
}
new ResizeObserver(refit).observe(topBar)
const kbWatch = document.querySelector('.kb-bar')
if (kbWatch) new ResizeObserver(refit).observe(kbWatch)
addEventListener('resize', refit)
addEventListener('orientationchange', () => { refit(); setTimeout(refit, 300) })
if (window.visualViewport) visualViewport.addEventListener('resize', refit)
document.addEventListener('fullscreenchange', refit)
document.addEventListener('webkitfullscreenchange', refit)
if (window.MutationObserver) {
  new MutationObserver(() => layoutLane()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-kb-bar', 'dir'] })
  const playWatch = document.getElementById('play-chip')
  if (playWatch) new MutationObserver(() => layoutLane()).observe(playWatch, { attributes: true, attributeFilter: ['hidden'] })
  const sheetWatch = document.getElementById('sheet')
  if (sheetWatch) new MutationObserver(() => layoutLane()).observe(sheetWatch, { attributes: true, attributeFilter: ['hidden'] })
}
laneAdd(document.getElementById('save-chip'), 5)
laneAdd(document.getElementById('inspect-chip'), 3)
laneAdd(document.getElementById('held-chip'), 6)
watchToasts()
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
const LOCK_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyN', 'KeyT', 'Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Backspace', 'AltLeft', 'AltRight', 'F1', 'F3', 'F5', 'F6', 'F7', 'F10']
function lockKeys() { try { if (navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(LOCK_KEYS).catch(() => {}) } catch (e) {} }
function unlockKeys() { try { if (navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock() } catch (e) {} }
async function enterFs() {
  const el = document.documentElement
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' })
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    else throw new Error('no-fs')
    fsFails = 0
    lockKeys()
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
function togglePause() {
  kidPause = !kidPause
  try { noa.setPaused(kidPause) } catch (e) {}
  if (session) session.paused = kidPause
  document.body.classList.toggle('paused', kidPause)
  const btn = $('pause-btn')
  if (btn) {
    btn.setAttribute('aria-pressed', kidPause ? 'true' : 'false')
    btn.classList.toggle('on', kidPause)
  }
}
const pauseBtn = $('pause-btn')
if (pauseBtn) pauseBtn.addEventListener('click', () => togglePause())
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
document.addEventListener('fullscreenchange', () => { if (!isFs()) unlockKeys() })
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
  function shadeNear(x, y, z) {
    let best = 0
    let n = 0
    const meshes = scene.meshes
    for (let m = 0; m < meshes.length; m++) {
      const mesh = meshes[m]
      if (!mesh || !mesh.name || mesh.name.indexOf('chunk_') !== 0) continue
      const pos = mesh.getVerticesData('position')
      const col = mesh.getVerticesData('color')
      if (!pos || !col) continue
      const mm = /^chunk_(-?\d+)\|(-?\d+)\|(-?\d+)\|/.exec(mesh.name)
      if (!mm) continue
      const ox = +mm[1] * S
      const oy = +mm[2] * S
      const oz = +mm[3] * S
      for (let i = 0; i < pos.length; i += 3) {
        const wx = ox + pos[i]
        const wy = oy + pos[i + 1]
        const wz = oz + pos[i + 2]
        if (Math.abs(wx - (x + 0.5)) > 1.35 || Math.abs(wy - (y + 0.5)) > 1.35 || Math.abs(wz - (z + 0.5)) > 1.35) continue
        const vi = (i / 3) * 4
        const lum = col[vi] * 0.3 + col[vi + 1] * 0.55 + col[vi + 2] * 0.15
        if (lum > best) best = lum
        n++
      }
    }
    return { best, n }
  }
  function waterTops(x, y, z) {
    const pts = []
    const meshes = scene.meshes
    for (let m = 0; m < meshes.length; m++) {
      const mesh = meshes[m]
      if (!mesh || !mesh.material || mesh.material.name !== 'bert-water') continue
      const pos = mesh.getVerticesData('position')
      const nor = mesh.getVerticesData('normal')
      if (!pos || !nor) continue
      const mm = /^chunk_(-?\d+)\|(-?\d+)\|(-?\d+)\|/.exec(mesh.name || '')
      if (!mm) continue
      const ox = +mm[1] * S
      const oy = +mm[2] * S
      const oz = +mm[3] * S
      for (let i = 0; i < pos.length; i += 3) {
        if (nor[i + 1] < 0.5) continue
        const wx = ox + pos[i]
        const wy = oy + pos[i + 1]
        const wz = oz + pos[i + 2]
        if (wy < y + 0.6 || wy > y + 1.4) continue
        if (wx < x - 0.05 || wx > x + 2.05 || wz < z - 0.05 || wz > z + 1.05) continue
        pts.push([Math.round(wx * 100) / 100, Math.round(wy * 100) / 100, Math.round(wz * 100) / 100])
      }
    }
    return pts
  }
  window.__gfx = {
    get name() { return gfxLook.name },
    get managed() { return gfxLook.managed },
    get builds() { return gfxLook.builds },
    get ao() { return gfxLook.ao },
    get sway() { return gfxLook.sway },
    get lights() { return gfxLook.lightsOn },
    get gradient() { return gfxLook.gradient },
    level: (x, y, z) => gfxLook.level(x, y, z),
    sky: () => gfxLook.sky(basics ? basics.phase() : 'day'),
    fog: () => [scene.fogColor.r, scene.fogColor.g, scene.fogColor.b],
    leaf: (id, x, z) => gfxLook.leafTint(id, x, z),
    waterAlpha: () => waterMat.alpha,
    set: (q) => setGraphics(q),
    drop: () => { if (gfxLook.dropLite()) applyGraphics(); return gfxLook.name },
    flower: () => gfxLook.tickSway(scene, performance.now() * 0.001),
    shadeNear,
    waterTops,
  }
  window.__blocks = {
    version: VERSION, setQuality, setGraphics, refit, get quality() { return quality }, get graphics() { return gfxLook.name }, get lang() { return LANG },
    rules: Rules,
    effects: Effects,
    noa, perf, save, load, resetWorld, placeBlock, breakBlock, pick, setVoxel, getVoxel, undo, redo, showDig: () => paintDigChip(null), importFile, exportDoc: snapshot,
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
    strip: () => [],
    wand: () => ({ held: wandHeld(), mode: wandMode, box: tools.box(), paint: paintId }),
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
    look: () => [noa.camera.heading, noa.camera.pitch],
  }
}

let circuitDots = 0
attachCircuits({
  getVoxel,
  setVoxel,
  chunks: () => saved,
  chunkSize: S,
  metaGet: (key) => session && session.meta ? session.meta.get(key) : null,
  metaSet: (key, rec) => { if (session && session.meta) session.meta.set(key, rec) },
  faceAt: faceTowardPlayer,
  held: () => session && session.selectedItem ? (session.selectedItem() || '') : '',
  lite: () => quality === 'lite',
  creative: () => !!(session && session.mode === 'creative'),
  give: (item, n) => { if (session && session.give) session.give(item, n) },
  count: (item) => session && session.bag ? session.bag.count(item) : 0,
  learn,
  card: (text) => showCard(text),
  t,
  now: () => performance.now(),
  markGlow: () => { syncGlow._dirty = true; gfxLook.markCircuits() },
  dot() {
    const mesh = CreateSphere('cdot', { diameter: 0.14, segments: 4 }, shapeScene)
    const mat = new StandardMaterial('cdotm' + circuitDots, shapeScene)
    circuitDots += 1
    mat.emissiveColor = new Color3(0.25, 0.95, 1)
    mat.disableLighting = true
    mesh.material = mat
    mesh.isPickable = false
    mesh.setEnabled(false)
    noa.rendering.addMeshToScene(mesh, false)
    return mesh
  },
  glow(x, y, z) {
    const mesh = CreateBox('cglow', { width: 0.98, height: 0.12, depth: 0.36 }, shapeScene)
    const mat = new StandardMaterial('cglowm' + x + '_' + y + '_' + z, shapeScene)
    mat.emissiveColor = new Color3(0.2, 0.9, 1)
    mat.alpha = 0.9
    mat.transparencyMode = 2
    mat.disableLighting = true
    mesh.material = mat
    mesh.isPickable = false
    noa.rendering.addMeshToScene(mesh, false)
    const lp = noa.globalToLocal([x + 0.5, y + 0.14, z + 0.5], null, glowLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
    return mesh
  },
  move(mesh, x, y, z) {
    if (!mesh) return
    const lp = noa.globalToLocal([x, y, z], null, glowLocal)
    mesh.position.set(lp[0], lp[1], lp[2])
  },
})

basics.boot(WORLD !== 'bertyville')
function parkPlayChip() {
  const el = $('play-chip')
  if (!el) return
  const bar = document.querySelector('.kb-bar')
  const placed = bar ? el.previousElementSibling === bar : el === document.body.firstElementChild
  if (!placed) {
    if (bar && bar.parentNode) bar.after(el)
    else document.body.insertBefore(el, document.body.firstChild)
  }
  if (!el.dataset.playBound) {
    el.dataset.playBound = '1'
    el.addEventListener('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      startFromChip()
    })
  }
}
function focusPlayChip(el) {
  if (!el) return
  try { el.focus({ focusVisible: true }) } catch (e) { try { el.focus() } catch (err) {} }
}
function bootPlayChip() {
  parkPlayChip()
  sealPanels()
  if (playLocked() || tableMode) return
  const el = $('play-chip')
  if (!el) return
  showPlayChip()
  if (TOUCH_UI) return
  const ae = document.activeElement
  if (!bootPlayChip.done || ae === document.body || ae === document.documentElement) {
    focusPlayChip(el)
    bootPlayChip.done = true
  }
}
bootPlayChip()
setTimeout(bootPlayChip, 400)
setTimeout(() => {
  parkPlayChip()
  sealPanels()
  const kb = document.getElementById('kb-drawer')
  if (kb && window.MutationObserver) {
    new MutationObserver(() => sealPanels()).observe(kb, { attributes: true, attributeFilter: ['hidden'] })
    sealPanels()
  }
}, 1200)
if (window.MutationObserver) {
  const watch = new MutationObserver(() => sealPanels())
  const sheetWatch = $('sheet')
  const drawerWatch = $('drawer')
  if (sheetWatch) watch.observe(sheetWatch, { attributes: true, attributeFilter: ['hidden'] })
  if (drawerWatch) watch.observe(drawerWatch, { attributes: true, attributeFilter: ['class', 'hidden'] })
}
function aimAt(wx, wy, wz) {
  const p = noa.entities.getPosition(noa.playerEntity)
  const eye = noa.ents.getPositionData(noa.playerEntity)
  const eyeY = (eye && eye.height ? eye.height : 1.6) * 0.9
  const dx = wx - p[0]
  const dy = wy - (p[1] + eyeY)
  const dz = wz - p[2]
  const flat = Math.hypot(dx, dz) || 1
  return { h: Math.atan2(dx, dz), p: -Math.atan2(dy, flat) }
}
function lerpAng(a, b, t) {
  let d = b - a
  d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI
  return a + d * t
}
let camEase = null
function frameWall(bot) {
  const spots = bot && bot.runLog && bot.runLog.spots
  let x = 0
  let y = 0
  let z = 0
  if (spots && spots.length) {
    for (const s of spots) { x += s[0] + 0.5; y += s[1] + 0.5; z += s[2] + 0.5 }
    x /= spots.length
    y /= spots.length
    z /= spots.length
  } else if (bot) {
    x = bot.x + 0.5
    y = bot.y + 1.5
    z = bot.z + 0.5
  } else return
  const aim = aimAt(x, y, z)
  const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  if (reduce) { setLook(aim.h, aim.p); return }
  camEase = { t0: performance.now(), ms: 800, fromH: noa.camera.heading, fromP: noa.camera.pitch, toH: aim.h, toP: aim.p }
  lookHoldUntil = performance.now() + 800
}
noa.on('tick', () => {
  if (!camEase) return
  const t = Math.min(1, (performance.now() - camEase.t0) / camEase.ms)
  const e = t < 1 ? t * t * (3 - 2 * t) : 1
  setLook(lerpAng(camEase.fromH, camEase.toH, e), camEase.fromP + (camEase.toP - camEase.fromP) * e)
  if (t >= 1) camEase = null
})
bot = initBot({
  noa, t, toast, getVoxel,
  markDirty: () => { dirty = true },
  saveNow: () => saveSoon(),
  session,
  close: () => panels && panels.close(),
  applyEdit: (ops, meta) => edits.applyEdit(ops, meta || { source: 'bot', by: 'bot', cause: 'program' }),
  peekEdit: () => edits.peek(),
  undoEdit: () => edits.undo(),
  undoRun: (runId) => edits.undoRun(runId),
  noteEdit: () => { const g = edits.peek(); if (g && g.source === 'bot') changeLog.note(g, 'bot') },
  kept: (x, y, z) => keptCell(x, y, z) || protectedCell(x, y, z, protect),
  heldBlock: () => heldBlockId() || 0,
  takeHeld: () => {
    if (!survivalOn()) return ''
    const k = session && session.selectedItem && session.selectedItem()
    if (!k || !session.spend(k, 1)) return false
    return k
  },
  giveItem: (k, n) => { if (session && session.give) session.give(k, n || 1) },
  botOn: () => calm.botOn(),
  onBotRun: () => calm.note('run'),
  onWall: (b) => {
    if (session && session.noteWin) session.noteWin('wall')
    frameWall(b)
  },
})
let bertRotateWatch = null
let bertRotateResets = 0
function bertShownBox(el) {
  if (!el || el.hidden) return null
  const cs = getComputedStyle(el)
  if (cs.display === 'none' || cs.visibility === 'hidden') return null
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return null
  return r
}
function bertPxGap(a, b) {
  if (!a || !b) return 999
  const dx = Math.max(b.left - a.right, a.left - b.right)
  const dy = Math.max(b.top - a.bottom, a.top - b.bottom)
  if (dx < 0 && dy < 0) return Math.round(Math.max(dx, dy))
  if (dx < 0) return Math.round(dy)
  if (dy < 0) return Math.round(dx)
  return Math.round(Math.hypot(dx, dy))
}
function bertHotbarLines(node) {
  const text = node.textContent || ''
  const range = document.createRange()
  const lines = []
  let buf = ''
  let top = null
  for (let i = 0; i < text.length; i++) {
    range.setStart(node, i)
    range.setEnd(node, i + 1)
    const r = range.getBoundingClientRect()
    if (r.width < 0.2 && r.height < 0.2) { buf += text[i]; continue }
    if (top == null || Math.abs(r.top - top) > 2) {
      if (buf) lines.push(buf)
      buf = text[i]
      top = r.top
    } else buf += text[i]
  }
  if (buf) lines.push(buf)
  return lines
}
window.__bertopiaHotbarCheck = function (opts) {
  const short = !!(opts && opts.short) || location.search.indexOf('short=1') >= 0
  const labels = []
  document.querySelectorAll('#hotbar .slot').forEach((slot) => {
    const lbl = slot.querySelector('.lbl')
    const name = lbl ? (lbl.textContent || '').replace(/\s+/g, ' ').trim() : ''
    let fontPx = 0
    let textW = 0
    let visibleW = 0
    let fits = true
    let midWordBreak = false
    if (lbl && name) {
      fontPx = parseFloat(getComputedStyle(lbl).fontSize) || 0
      const tb = bertLabelTextBox(lbl)
      const vis = bertVisibleBox(slot)
      textW = tb.width
      visibleW = vis.width
      fits = bertLabelFits(tb, vis)
      const node = lbl.firstChild
      if (!node || node.nodeType !== 3 || lbl.childNodes.length !== 1) midWordBreak = true
      else {
        const words = name.split(' ').filter(Boolean)
        const lines = bertHotbarLines(node)
        midWordBreak = lines.some((line) => line.trim().split(/\s+/).filter(Boolean).some((part) => words.indexOf(part) < 0))
      }
    } else {
      visibleW = bertVisibleBox(slot).width
    }
    labels.push({
      name: name,
      fontPx: Math.round(fontPx * 10) / 10,
      textW: Math.round(textW * 10) / 10,
      visibleW: Math.round(visibleW * 10) / 10,
      fits: fits,
      midWordBreak: midWordBreak,
    })
  })
  const anyClipped = labels.some((row) => row.fits === false)
  const anyMidWordBreak = labels.some((row) => row.midWordBreak)
  if (short) {
    return {
      w: window.innerWidth,
      n: labels.length,
      anyClipped: anyClipped,
      anyMidWordBreak: anyMidWordBreak,
      clipped: labels.filter((row) => row.fits === false).map((row) => row.name),
    }
  }
  return { w: window.innerWidth, labels: labels, anyClipped: anyClipped, anyMidWordBreak: anyMidWordBreak }
}
if (location.search.indexOf('proof=1') >= 0 && window.kwTest && window.kwTest.on && window.kwTest.on()) {
  window.__bertopiaSetHotbar = function (names) {
    if (!session || !session.bag) return false
    const list = Array.isArray(names) ? names : []
    const byName = new Map()
    for (const key of Object.keys(ITEMS)) {
      const label = String(t(key) || '').replace(/\s+/g, ' ').trim()
      if (label) byName.set(label, key)
    }
    const paint = []
    const n = Math.min(list.length, 9)
    for (let i = 0; i < n; i++) {
      const want = String(list[i] == null ? '' : list[i]).replace(/\s+/g, ' ').trim()
      const key = byName.get(want) || (ITEMS[want] ? want : '')
      paint.push(key ? { item: key, n: 1 } : null)
    }
    if (session.paintHotbar) session.paintHotbar(paint)
    return true
  }
}
window.__bertopiaRotateCheck = function () {
  const seed = makerLive && makerLive.seed != null ? (makerLive.seed | 0) : 0
  const gen = (window.__freshGen || 0) + (window.__makerGen || 0) + (window.__archiveGen || 0)
  const token = seed + ':' + gen
  if (bertRotateWatch == null) bertRotateWatch = token
  else if (bertRotateWatch !== token) { bertRotateResets += 1; bertRotateWatch = token }
  const w = window.innerWidth
  const h = window.innerHeight
  const sheet = document.getElementById('sheet')
  const bagOpen = !!(sheet && !sheet.hidden && sheet.dataset.panel === 'inventory')
  const blocks = []
  if (bagOpen) {
    const sheetR = bertShownBox(sheet)
    const bar = bertShownBox(sheet.querySelector('.sheet-bar'))
    const closeBtn = bertShownBox(document.getElementById('sheet-x'))
    if (sheetR) blocks.push(sheetR)
    if (bar) blocks.push(bar)
    if (closeBtn) blocks.push(closeBtn)
    sheet.querySelectorAll('.crate-tab').forEach((node) => { const r = bertShownBox(node); if (r) blocks.push(r) })
  }
  const toast = bertShownBox(document.getElementById('toast'))
  let toastClearPx = 999
  if (toast && blocks.length) toastClearPx = Math.min.apply(null, blocks.map((b) => bertPxGap(toast, b)))
  const pause = bertShownBox(document.getElementById('pause-btn'))
  let pauseClearPx = 999
  if (pause && blocks.length) pauseClearPx = Math.min.apply(null, blocks.map((b) => bertPxGap(pause, b)))
  let playerPos = [0, 0, 0]
  try {
    const p = noa.entities.getPosition(noa.playerEntity)
    if (p) playerPos = [Math.round(p[0] * 100) / 100, Math.round(p[1] * 100) / 100, Math.round(p[2] * 100) / 100]
  } catch (e) {}
  return {
    w: w,
    h: h,
    orientation: h >= w ? 'portrait' : 'landscape',
    mode: session && session.mode ? session.mode : '',
    bagOpen: bagOpen,
    toastClearPx: toastClearPx,
    pauseClearPx: pauseClearPx,
    worldSeed: seed,
    playerPos: playerPos,
    resetCount: bertRotateResets,
  }
}
load().catch(() => {}).finally(() => {
  try { gfxLook.reindex() } catch (e) {}
  releaseWalletChip()
  if (allowSave) window.__bertOpen = true
  if (location.search.includes('smoke=1')) {
    window.__noa = noa
    const markReady = () => { window.__bloxReady = true }
    if (window.__bertPackReady) markReady()
    else window.addEventListener('bertopia-pack-ready', markReady, { once: true })
  }
  paintModeChip()
  function runBtTest() {
    if (!window.__btTestPending || !window.__btTestPending.isTest) return
    const p = window.__btTestPending
    if (p.nightQ) {
      try {
        if (Rules && Rules.set) Rules.set('survival.daynight', 'night')
        if (basics && basics.setAlways) basics.setAlways(false)
        if (window.__clock && window.__clock.night) window.__clock.night()
        if (applySky) applySky()
        if (session && session.setMode) session.setMode('survival')
      } catch (e) {
        console.warn('[bt-test] night FAILED', e && e.message)
      }
      console.info('[bt-test] night on', window.__clock && window.__clock.text ? window.__clock.text() : '')
      if (toast) toast(t ? t('c4hNight') : 'Test: night')
    }
    let testX = 56, testY = 6, testZ = 56
    for (let x = 56; x < 80; x += 2) if (!inSafeZone(x, 56)) { testX = x; break }
    try { noa.entities.setPosition(noa.playerEntity, [testX, testY, testZ]) } catch (e) {}
    console.info('[bt-test] player at', testX, testY, testZ, 'zone=' + inSafeZone(testX, testZ))
    window.__use = window.__use || {}
    window.__use.spawn = (k) => {
      if (!mobs || !mobs.spawn) return null
      const cam = noa.camera
      const h = cam ? cam.heading : 0
      const sx = testX + Math.sin(h) * 4
      const sz = testZ + Math.cos(h) * 4
      let sy = testY
      if (getVoxel) {
        for (let dy = 0; dy < 8; dy++) if ((getVoxel(sx | 0, testY - dy, sz | 0) | 0) > 0 && (getVoxel(sx | 0, testY - dy + 1, sz | 0) | 0) === 0) { sy = testY - dy + 1; break }
      }
      const r = mobs.spawn(k, sx | 0, sy, sz | 0, true)
      console.info('[bt-test] spawn', k, r ? 'ok id=' + r.id + ' at ' + (sx|0) + ',' + sy + ',' + (sz|0) : 'REFUSED')
      return r
    }
    window.__use.mobs = () => mobs && mobs.list ? mobs.list() : []
    window.__use.phase = () => (basics && basics.phase ? basics.phase() : 'day')
    if (p.ruleQ) {
      const world = (typeof WORLD !== 'undefined' && WORLD) || 'game'
      const store = 'bloxbert-combat-' + world
      if (p.ruleQ === 'reset') {
        try { localStorage.removeItem(store) } catch (e) {}
        console.info('[bt-test] rule reset (world ' + world + ')')
        if (toast) toast('Test: rules reset')
      } else {
        const [k, v] = p.ruleQ.split(':')
        if (k && v) {
          let prefs = {}
          try { prefs = JSON.parse(localStorage.getItem(store) || '{}') } catch (e) {}
          prefs[k] = v
          try { localStorage.setItem(store, JSON.stringify(prefs)) } catch (e) {}
          console.info('[bt-test] rule ' + k + '=' + v + ' (world ' + world + ')')
          if (toast) toast('Test: ' + k + '=' + v)
        }
      }
    }
    if (p.mobQ) {
      const r = window.__use.spawn(p.mobQ)
      if (r && toast) toast(t ? t('c4hSpawn') : 'Test: ' + p.mobQ)
      else if (toast) toast(t ? t('c4hRefuse') : 'Test: refused')
    }
  }
  if (session && session.mode === 'survival' && session.paintHotbar) session.paintHotbar()
  else paintBar()
  if (sentToSurvival) toast(t('studentWorld'))
  markSave(saved.size ? t('bertyville') + ' · ' + t('loaded') : t('bertyville') + ' · ' + t('notSaved'))
  showRulesCard({ teacher: !!(teacherOn() || staffOn()), lang: LANG, world: WORLD })
  if (location.search.includes('shot=1')) armShot()
  if (location.search.includes('craft=1')) armCraft()
  if (location.search.includes('use=')) armUse()
  // C5 Foundry arena once, outside safe zone, Game/solo only
  try {
    if (!(mobs && mobs.blockedWorld && mobs.blockedWorld()) && !localStorage.getItem('bt-foundry-built-2')) {
      const ox = 60, oz = 60
      let oy = 3
      for (let y = 5; y > 0; y--) { if ((getVoxel(ox, y, oz) | 0) > 0) { oy = y + 1; break } }
      if (!inSafeZone(ox, oz)) {
        placeFoundryArena(getVoxel, edit, [ox, oy, oz])
        localStorage.setItem('bt-foundry-built-2', '1')
        console.info('[bt-foundry] arena at', ox, oy, oz)
      } else console.info('[bt-foundry] skipped (safe)')
    }
  } catch (e) { console.warn('[bt-foundry] skip', e && e.message) }
  armClock()
  runBtTest()
  paintDayClock()
  armBrief()
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
    doFill() {
      const name = 'fill'
      const staged = tools.act(name)
      if (!staged) return false
      return !!tools.confirm()
    },
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
    beltLab() {
      try { localStorage.removeItem('bloxbert-belt-hint') } catch (e) {}
      if (belts && belts.hintClear) belts.hintClear()
      noa.entities.setPosition(noa.playerEntity, [80.5, 20, 80.5])
      const x = 80
      const y = 20
      const z = 80
      const p = [80.5, 20, 80.5]
      const k = (dx, dz) => (x + dx) + ',' + y + ',' + (z + dz)
      const wipe = (dx, dz) => { edit(x + dx, y, z + dz, 0) }
      for (let dz = 0; dz <= 4; dz++) wipe(0, dz)
      for (let dx = 8; dx <= 14; dx++) wipe(dx, 0)
      edit(x, y, z + 3, ID.oven)
      session.meta.set(k(0, 3), { kind: 'oven', face: 'S' })
      edit(x, y, z + 2, ID.conveyor)
      edit(x, y, z + 1, ID.conveyor)
      const g1 = belts.tryPlace(x, y, z + 2, 'S', 'you')
      const g2 = belts.tryPlace(x, y, z + 1, 'S', 'you')
      if (g1.ok) belts.commit(x, y, z + 2, g1.face, 'you')
      if (g2.ok) belts.commit(x, y, z + 1, g2.face, 'you')
      edit(x, y, z, ID.box)
      session.meta.set(k(0, 0), { kind: 'box', face: 'N', slots: Array.from({ length: 18 }, () => null) })
      const ovenKey = k(0, 3)
      stations.load({ [ovenKey]: { kind: 'oven', fuel: 0, input: [], output: ['glass', 'glass', 'glass'], until: 0, left: 0 } })
      showBeltHint()
      const hint = document.getElementById('menu-hint')
      const hintText = hint ? hint.textContent : ''
      const anchors = [{ x: p[0], y: p[1], z: p[2] }]
      for (let i = 0; i < 16; i++) belts.tick(anchors)
      const box = session.meta.get(k(0, 0))
      const arrived = (box.slots || []).reduce((n, s) => n + (s && s.n ? s.n : 0), 0)
      const flow = belts.flow(ovenKey)
      const hold = stations.dump()
      if (hold[ovenKey]) hold[ovenKey].output = ['glass']
      stations.load(hold)
      belts.tick(anchors)
      const held = JSON.stringify(session.meta.get(k(0, 2)))
      belts.tick([{ x: p[0] + 96, y: p[1], z: p[2] }])
      const frozen = held.indexOf('"n":1') >= 0 && JSON.stringify(session.meta.get(k(0, 2))) === held
      edit(x + 8, y, z, ID.box)
      session.meta.set(k(8, 0), { kind: 'box', face: 'E', slots: [{ item: 'log', n: 2 }, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null] })
      edit(x + 9, y, z, ID.conveyor)
      const gin = belts.tryPlace(x + 9, y, z, 'E', 'you')
      if (gin.ok) belts.commit(x + 9, y, z, gin.face, 'you')
      edit(x + 10, y, z, ID.workbench)
      session.meta.set(k(10, 0), { kind: 'workbench', face: 'E' })
      edit(x + 11, y, z, ID.conveyor)
      const gout = belts.tryPlace(x + 11, y, z, 'E', 'you')
      if (gout.ok) belts.commit(x + 11, y, z, gout.face, 'you')
      edit(x + 12, y, z, ID.box)
      session.meta.set(k(12, 0), { kind: 'box', face: 'W', slots: Array.from({ length: 18 }, () => null) })
      for (let i = 0; i < 24; i++) belts.tick(anchors)
      const chest = session.meta.get(k(12, 0))
      const planks = (chest.slots || []).reduce((n, s) => n + (s && s.item === 'planks' ? s.n : 0), 0)
      const spun = belts.rotate(x, y, z + 2)
      const faceMid = (session.meta.get(k(0, 2)) || {}).face
      belts.rotate(x, y, z + 2)
      belts.rotate(x, y, z + 2)
      belts.rotate(x, y, z + 2)
      const dump = stations.dump()
      if (!dump[ovenKey]) dump[ovenKey] = { kind: 'oven', fuel: 0, input: [], output: [], until: 0, left: 0 }
      dump[ovenKey].output = ['glass']
      stations.load(dump)
      const fullBox = session.meta.get(k(0, 0))
      fullBox.slots = Array.from({ length: 18 }, () => ({ item: 'dirt', n: 64 }))
      for (let i = 0; i < 6; i++) belts.tick(anchors)
      const blocked = belts.flow(k(0, 0))
      let refused = false
      for (let i = 0; i < 70 && !refused; i++) {
        const cell = x + 20 + i
        const gate = belts.tryPlace(cell, y, z + 6, 'E', 'you')
        if (!gate.ok) { refused = i >= 64; break }
        edit(cell, y, z + 6, ID.conveyor)
        belts.commit(cell, y, z + 6, gate.face, 'you')
      }
      const sheet = document.getElementById('sheet')
      const body = document.getElementById('sheet-body')
      if (sheet) sheet.hidden = false
      if (body) stations.paint(body, ovenKey, 'oven')
      const strip = document.querySelector('#sheet .belt-flow')
      const card = strip && strip.closest('.belt-full, .machine, .ks-card, article, .card')
      return {
        place: g1.ok + ':' + g1.face + ',' + g2.ok + ':' + g2.face,
        oven: getVoxel(x, y, z + 3),
        belt: getVoxel(x, y, z + 2),
        hintText,
        hintOn: !!(hint && hint.classList.contains('belt-on')),
        arrived,
        hintHidden: !!(hint && hint.hidden),
        flow: flow && flow.text,
        planks,
        spun,
        faceMid,
        blocked: blocked && blocked.text,
        full: !!(blocked && blocked.full),
        frozen,
        refused,
        strip: strip ? strip.textContent : '',
        stripScroll: strip ? strip.scrollWidth > strip.clientWidth + 2 : true,
      }
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
      return { id: r.id, x: r.position[0], y: r.position[1], z: r.position[2], ax: r.adjacent[0], ay: r.adjacent[1], az: r.adjacent[2], nx: n[0] | 0, ny: n[1] | 0, nz: n[2] | 0, far: !!r.far }
    },
    screen(x, y, z) {
      const scene = noa.rendering.getScene()
      const cam = noa.rendering.camera
      const engine = scene.getEngine()
      const tm = cam.getTransformationMatrix()
      const local = noa.globalToLocal([x + 0.5, y + 0.5, z + 0.5], null, [0, 0, 0])
      const m = tm.m
      const X = local[0], Y = local[1], Z = local[2]
      const px = X * m[0] + Y * m[4] + Z * m[8] + m[12]
      const py = X * m[1] + Y * m[5] + Z * m[9] + m[13]
      const pw = X * m[3] + Y * m[7] + Z * m[11] + m[15]
      if (!pw) return null
      const ndx = px / pw
      const ndy = py / pw
      const rw = engine.getRenderWidth()
      const rh = engine.getRenderHeight()
      const rect = canvas.getBoundingClientRect()
      return {
        x: rect.left + ((ndx + 1) * 0.5) * rect.width,
        y: rect.top + (1 - (ndy + 1) * 0.5) * rect.height,
        ndx, ndy,
      }
    },
    showHud() {
      if (calm) calm.setAll(true)
      return !document.body.classList.contains('hud-calm')
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
      const ok = placeBed(x | 0, y | 0, z | 0)
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
    circuit: () => circuitView(),
    meta: (x, y, z) => session && session.meta ? (session.meta.get((x | 0) + ',' + (y | 0) + ',' + (z | 0)) || null) : null,
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
function readPvpPrefs() {
  try { return JSON.parse(localStorage.getItem('bloxbert-pvp') || '{}') } catch (e) { return {} }
}
function savePvpPrefs(p) {
  try { localStorage.setItem('bloxbert-pvp', JSON.stringify(p)) } catch (e) {}
}
window.pvpAllowed = function(world, a, b) {
  const p = readPvpPrefs()
  if (world === 'main' || world === 'bertyville') {
    if (p.mainPvpAllowed === false) return false
    return !!(a && a.pvpOptIn && b && b.pvpOptIn)
  }
  return !!(p.kitPvp)
}
function paintLangRow(g) {
  const row = document.createElement('div')
  row.className = 'set-line'
  const ico = document.createElement('span')
  ico.className = 'set-ico'
  ico.textContent = '🌐'
  const lab = document.createElement('span')
  lab.className = 'set-lab'
  const picks = [
    ['en', 'English'],
    ['uk', 'Українська'],
    ['ru', 'Русский'],
    ['es', 'Español'],
    ['ar', 'العربية'],
    ['fa-AF', 'دری'],
    ['rw', 'Kinyarwanda'],
    ['ti', 'ትግርኛ'],
  ]
  const cur = LANG || 'en'
  const curName = (picks.find((p) => p[0] === cur) || ['', cur === 'simple' ? 'Simple' : cur])[1]
  lab.textContent = (t('language') || 'Language') + ': ' + curName
  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'pill'
  btn.textContent = t('change') || 'Change'
  btn.setAttribute('aria-expanded', 'false')
  btn.setAttribute('aria-haspopup', 'listbox')
  btn.setAttribute('aria-controls', 'lang-list')
  const list = document.createElement('div')
  list.id = 'lang-list'
  list.className = 'lang-list'
  list.hidden = true
  list.setAttribute('role', 'listbox')
  list.setAttribute('aria-label', t('language') || 'Language')
  list.dir = 'ltr'
  const opts = []
  for (const [code, name] of picks) {
    const opt = document.createElement('button')
    opt.type = 'button'
    opt.className = 'pill lang-opt'
    opt.setAttribute('role', 'option')
    opt.lang = code === 'ar' ? 'ar' : code
    opt.dir = code === 'ar' ? 'rtl' : 'ltr'
    opt.dataset.lang = code
    const on = code === cur
    opt.setAttribute('aria-selected', on ? 'true' : 'false')
    opt.setAttribute('aria-checked', on ? 'true' : 'false')
    if (on) opt.classList.add('on')
    const mark = document.createElement('span')
    mark.className = 'lang-mark'
    mark.setAttribute('aria-hidden', 'true')
    mark.textContent = on ? '✓' : ''
    const word = document.createElement('span')
    word.className = 'lang-name'
    word.textContent = name
    opt.append(mark, word)
    opt.addEventListener('pointerdown', (e) => {
      if (e.button > 0) return
      opt._lx = e.clientX
      opt._ly = e.clientY
      e.stopPropagation()
    })
    opt.addEventListener('pointerup', (e) => {
      if (e.button > 0) return
      const dx = e.clientX - (opt._lx == null ? e.clientX : opt._lx)
      const dy = e.clientY - (opt._ly == null ? e.clientY : opt._ly)
      if (dx * dx + dy * dy > 144) return
      chooseLang(code, e)
    })
    opt.addEventListener('click', (e) => chooseLang(code, e))
    list.append(opt)
    opts.push(opt)
  }
  function chooseLang(code, e) {
    const now = performance.now()
    if (now - (window.__langPickedAt || 0) < 450) return
    window.__langPickedAt = now
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    pickLang(code)
  }
  function closeList() {
    if (!list.isConnected) return
    list.hidden = true
    btn.setAttribute('aria-expanded', 'false')
    if (btn.isConnected) btn.focus()
  }
  function openList(byKey) {
    list.hidden = false
    btn.setAttribute('aria-expanded', 'true')
    if (!byKey) return
    const hit = opts.find((o) => o.dataset.lang === cur) || opts[0]
    if (hit) hit.focus()
  }
  function pickLang(code) {
    const next = normLang(code)
    if (!next || next === LANG) { closeList(); return }
    const mode = session && session.mode
    saveKidLang(next)
    LANG = next
    applyI18n()
    if (session && mode && session.mode !== mode && session.setMode) session.setMode(mode)
    if (panels && panels.softRepaint) panels.softRepaint()
    const sheet = document.getElementById('sheet')
    if (sheet && !sheet.hidden && sheet.dataset.panel === 'settings') {
      const title = document.getElementById('sheet-title')
      if (title) title.textContent = t('settings')
    }
    const xlab = document.querySelector('#sheet-x .xlab')
    if (xlab) xlab.textContent = t('close')
    const x = document.getElementById('sheet-x')
    if (x) x.setAttribute('aria-label', t('close'))
  }
  btn.addEventListener('click', (e) => { if (list.hidden) openList(!e.detail); else closeList() })
  list.addEventListener('keydown', (e) => {
    const i = opts.indexOf(document.activeElement)
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeList(); return }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      const dir = (e.key === 'ArrowDown' || e.key === 'ArrowRight') ? 1 : -1
      const n = opts.length
      opts[((i < 0 ? 0 : i) + dir + n) % n].focus()
    }
  })
  const onEsc = (e) => {
    if (!list.isConnected) { document.removeEventListener('keydown', onEsc, true); return }
    if (e.key !== 'Escape' || list.hidden) return
    e.preventDefault()
    e.stopPropagation()
    closeList()
  }
  document.addEventListener('keydown', onEsc, true)
  const back = document.getElementById('sheet-back')
  if (back) back.addEventListener('click', (e) => {
    if (!list.isConnected || list.hidden) return
    e.preventDefault()
    e.stopPropagation()
    closeList()
  }, true)
  row.append(ico, lab, btn)
  g.append(row, list)
}
function paintPvpSettings(g) {
  paintLangRow(g)
  const p = readPvpPrefs()
  const mk = (key, def, onLabel, offLabel, icon) => {
    const row = document.createElement('div')
    row.className = 'set-line'
    const ico = document.createElement('span')
    ico.className = 'set-ico'
    ico.textContent = icon
    const lab = document.createElement('span')
    lab.className = 'set-lab'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'pill'
    btn.style.minWidth = '44px'
    btn.style.minHeight = '44px'
    const on = p[key] !== undefined ? p[key] : def
    lab.textContent = onLabel.split(':')[0].trim()
    btn.textContent = on ? (t('switchOn') || 'ON') : (t('switchOff') || 'OFF')
    btn.setAttribute('aria-label', lab.textContent)
    btn.addEventListener('click', () => {
      const cur = readPvpPrefs()
      cur[key] = !on
      savePvpPrefs(cur)
      paintPvpSettings(g)
    })
    row.append(ico, lab, btn)
    g.append(row)
  }
  mk('pvpOptIn', false, t('pvpOn'), t('pvpOff'), '⚔')
  mk('keepInventory', true, t('keepStuffOn'), t('keepStuffOff'), '🎒')
  mk('kitPvp', false, t('kitPvpOn'), t('kitPvpOff'), '⚔')
  const hint = document.createElement('p')
  hint.className = 'gnote'
  hint.textContent = t('pvpHint')
  g.append(hint)
}
const crewCredit = {
  hits: {},
  trailUntil: 0,
  record(mobId, alias, kind) {
    const name = String(alias || 'Friend').slice(0, 24)
    if (!mobId || !name) return []
    const now = Date.now()
    const list = (this.hits[mobId] || []).filter((h) => now - h.t < 10000)
    const prev = list.find((h) => h.alias === name)
    if (prev) { prev.t = now; prev.kind = kind || prev.kind }
    else list.push({ alias: name, kind: kind || 'hit', t: now })
    this.hits[mobId] = list
    return this.contributors(mobId, now)
  },
  contributors(mobId, nowMs) {
    const now = nowMs || Date.now()
    const out = []
    for (const h of this.hits[mobId] || []) {
      if (now - h.t >= 10000) continue
      if (h.alias && !out.includes(h.alias)) out.push(h.alias)
    }
    return out
  },
  onRemote() { /* netcode plugs in here (ARENA-NETCODE-PLAN.md) */ },
  bonus(mobId) {
    return this.contributors(mobId, Date.now()).length >= 2 ? 1.25 : 1
  },
  trail(mobId) {
    return this.contributors(mobId, Date.now()).length >= 4
  },
}
window.crewCredit = crewCredit
function startHelpUp() {
  if (document.getElementById('c3-help')) return
  const btn = document.createElement('button')
  btn.id = 'c3-help'
  btn.type = 'button'
  btn.hidden = true
  btn.style.cssText = 'position:fixed;left:50%;bottom:200px;transform:translateX(-50%);z-index:34;display:flex;align-items:center;gap:8px;min-width:44px;min-height:44px;padding:8px 16px;border-radius:999px;border:3px solid #3ec6c6;background:#0E1A22;color:#E6EEF2;font:800 15px/1.2 sans-serif;max-width:90vw'
  const ring = document.createElement('span')
  ring.setAttribute('aria-hidden', 'true')
  ring.style.cssText = 'width:22px;height:22px;box-sizing:border-box;border:3px solid #f6e27a;border-radius:50%;flex:0 0 auto'
  const label = document.createElement('span')
  btn.append(ring, label)
  document.body.append(btn)
  let holdStart = 0
  let holding = false
  let coolUntil = 0
  function lessMotion() {
    try {
      return document.documentElement.getAttribute('data-kp-motion') === 'less' || matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (e) { return false }
  }
  function nearestMob() {
    const pos = noa.entities.getPosition(noa.playerEntity)
    if (!pos || !mobs || !mobs.list) return 'help'
    let id = 'help'
    let best = 8
    for (const m of mobs.list()) {
      const d = Math.hypot(m.x - pos[0], m.z - pos[2])
      if (d < best) { best = d; id = m.id }
    }
    return id
  }
  function finishHold() {
    holding = false
    holdStart = 0
    ring.style.background = 'transparent'
    const alias = t('c3You') || 'You'
    if (Date.now() < coolUntil) {
      toast(t('c3Refuse') || 'Wait a moment before helping again')
      return
    }
    coolUntil = Date.now() + 20000
    suit = Math.min(suitMax, suit + 30)
    paintSuit()
    if (window.crewCredit) window.crewCredit.record(nearestMob(), alias, 'assist')
    const line = t('c3Helped') || '{alias} helped you up'
    toast(String(line).replace('{alias}', alias))
    try { if (window.bumpMedic) window.bumpMedic() } catch (e) {}
  }
  function sync() {
    const menu = document.body.classList.contains('menu-open')
    const low = suit < 25 && !menu
    btn.hidden = !low
    if (!low) { holding = false; holdStart = 0; return }
    if (!holding) {
      label.textContent = t('c3HelpUp') || 'Help up'
      ring.style.background = 'transparent'
      return
    }
    label.textContent = t('c3Helping') || 'Helping up…'
    const p = Math.min(1, (performance.now() - holdStart) / 1500)
    if (!lessMotion()) ring.style.background = 'conic-gradient(#f6e27a ' + Math.round(p * 360) + 'deg, transparent 0)'
    if (p >= 1) finishHold()
  }
  function down(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (btn.hidden || holding) return
    holding = true
    holdStart = performance.now()
    sync()
  }
  function up() { holding = false; holdStart = 0; sync() }
  btn.addEventListener('pointerdown', down)
  btn.addEventListener('pointerup', up)
  btn.addEventListener('pointercancel', up)
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') down(e)
    if (e.key === 'Escape') up()
  })
  btn.addEventListener('keyup', (e) => { if (e.key === 'Enter' || e.key === ' ') up() })
  setInterval(sync, 100)
}
startHelpUp()
if (location.search.includes('proof=1') && window.kwTest && window.kwTest.on && window.kwTest.on()) {
  window.__BT_PROOF = {
    giveLamp(kind) {
      const item = kind === 'wall' ? 'wallLamp' : 'floorLamp'
      if (session && session.setMode) session.setMode('survival')
      if (session && session.give) session.give(item, 1)
      return this.bagCounts()
    },
    giveBed() {
      if (session && session.setMode) session.setMode('survival')
      if (session && session.give) session.give('bunk', 1)
      return this.bagCounts()
    },
    hangTools() {
      const sheet = document.getElementById('sheet')
      const key = (sheet && sheet.dataset.shopKey) || openMachineKey || '0,5,0'
      const rec = stations && stations.ensureShop ? stations.ensureShop(key) : null
      if (rec) rec.wall = ['safetyGlasses', 'measuringTape', 'handSaw', 'hammer']
      const body = document.getElementById('sheet-body')
      if (body && stations && stations.paintWoodshop) stations.paintWoodshop(body, key)
      return rec && rec.wall ? rec.wall.filter(Boolean).length : 0
    },
    giveWoodshop() {
      if (session && session.setMode) session.setMode('survival')
      if (session && session.give) session.give('woodshop', 1)
      return this.bagCounts()
    },
    placeHeld() {
      const item = session && session.selectedItem ? session.selectedItem() : ''
      if (!item) return false
      const p = noa.entities.getPosition(noa.playerEntity)
      const x = Math.floor(p[0]) + 1, y = Math.floor(p[1]), z = Math.floor(p[2])
      const id = item === 'floorLamp' ? 1100 : item === 'wallLamp' ? 1102 : item === 'woodshop' ? ID.woodshop : item === 'bunk' ? ID.bunk : 0
      if (!id) return false
      edit(x, y, z, id)
      if (session && session.spend) session.spend(item, 1)
      return true
    },
    lampState() {
      const out = []
      const p = noa.entities.getPosition(noa.playerEntity)
      const px = Math.floor(p[0]), py = Math.floor(p[1]), pz = Math.floor(p[2])
      for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) for (let y = py - 2; y <= py + 4; y++) {
        const id = getVoxel(px + dx, y, pz + dz)
        if (id === 1100 || id === 1101 || id === 1102 || id === 1103) {
          let light = false, dist = 99
          try {
            for (const L of noa.rendering.scene.lights) {
              if (L.getClassName && L.getClassName() === 'PointLight' && L.isEnabled && L.isEnabled()) {
                light = true
                dist = Math.hypot(L.position.x - (px + dx), L.position.z - (pz + dz))
              }
            }
          } catch (e) {}
          out.push({ x: px + dx, y, z: pz + dz, voxelId: id, on: id === 1101 || id === 1103, pointLight: { on: light, dist: Math.round(dist * 10) / 10 } })
        }
      }
      return out
    },
    openWoodshop() { const k = openMachineKey || '0,5,0'; if (panels) panels.open('woodshop', k); const sheet = document.getElementById('sheet'); if (sheet) sheet.dataset.shopKey = k; return true },
    voxelAt(x, y, z) { return getVoxel(x, y, z) },
    spawnMob(kind) {
      const testX = 56, testY = 6, testZ = 56
      const mob = mobs.spawn(kind || 'scrapper', testX + 4, testY, testZ, true)
      return { ok: !!mob, kind: kind || 'scrapper', id: mob ? mob.id : null }
    },
    spawnDummy() {
      const p = noa.entities.getPosition(noa.playerEntity)
      const d = { id: 'dummy', hp: 100, x: Math.floor(p[0]) + 2, y: Math.floor(p[1]), z: Math.floor(p[2]) }
      window.__dummy = d
      return { ok: true, hp: d.hp }
    },
    bonkDummy() {
      const d = window.__dummy
      if (!d) return { ok: false }
      const before = d.hp
      d.hp = Math.max(0, d.hp - bonk())
      return { ok: true, hpBefore: before, hpAfter: d.hp }
    },
    hit(n) {
      const before = suit
      suit = Math.max(0, suit - (n || 10))
      paintSuit()
      if (suit <= 0) bonked()
      return { ok: true, suitBefore: before, suitAfter: suit }
    },
    setNight(on) {
      if (basics && basics.seek) basics.seek(on ? basics.nightAt() : 0)
      return { ok: true, night: !!on }
    },
    helpUp(alias) {
      suit = Math.min(suitMax, suit + 30)
      paintSuit()
      if (toast) toast((alias || 'Friend') + ' helped you up, Suit plus 30')
      return suit
    },
    fakeContributor(alias, mobId) {
      const id = mobId || 'test-mob'
      crewCredit.record(id, alias || 'TestKid', 'hit')
      return crewCredit.contributors(id, Date.now())
    },
    rebootMob(id) {
      const who = mobs && mobs.reboot ? mobs.reboot(id) : null
      const chip = document.getElementById('c3-crew')
      return { who, bag: this.bagCounts(), chip: chip ? chip.textContent : '' }
    },
    bagCounts() {
      const out = {}
      if (session && session.bag) for (const s of session.bag.slots) if (s && s.item) out[s.item] = (out[s.item] || 0) + (s.n || 0)
      return out
    },
  }
}

repaintBlocks()
void T0