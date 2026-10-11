// Circuit runtime. The netlist rebuilds when a tech block is placed, broken, or toggled.
import { simulate, conductorMarks } from './circuit-sim.js'
import { hookPower } from './power.js'
import { Rules } from './rules.js'
import { TECH } from './packs/tech/pack.js'
import { packOn } from './packs/registry.js'

const LAMPS = new Set([47, 1100, 1101, 1102, 1103])
const LESSON = { cell: 'lessonLoop', line: 'lessonCopper', switch: 'lessonSwitch', button: 'lessonSwitch' }
const BADGE_KEY = 'bloxbert-conductor'
const parts = new Map()
let api = null
let dirty = true
let syncing = false
let result = { powered: [], lit: [], lines: {}, stops: [], edges: [] }
const releaseAt = new Map()
let gifted = false
let visualsOn = false
const glows = new Map()
const dots = []
let dotPos = []
let shown = ''

function keyOf(x, y, z) { return (x | 0) + ',' + (y | 0) + ',' + (z | 0) }

export function techId(id) {
  return id === TECH.cell || id === TECH.line || id === TECH.switch || id === TECH.switchOn || id === TECH.button || id === TECH.buttonOn
}

export function loadId(id) {
  return LAMPS.has(id)
}

function kindOf(id) {
  if (id === TECH.cell) return 'cell'
  if (id === TECH.line) return 'line'
  if (id === TECH.switch || id === TECH.switchOn) return 'switch'
  if (id === TECH.button || id === TECH.buttonOn) return 'button'
  if (LAMPS.has(id)) return 'load'
  return ''
}

function watch(id) { return techId(id) || loadId(id) }

function put(x, y, z, id) {
  const key = keyOf(x, y, z)
  const kind = kindOf(id)
  if (!kind) { parts.delete(key); return }
  parts.set(key, {
    id: key,
    kind,
    x: x | 0,
    y: y | 0,
    z: z | 0,
    on: id === TECH.switchOn || id === TECH.buttonOn,
    block: id,
  })
}

function readBadge() {
  try { return JSON.parse(localStorage.getItem(BADGE_KEY) || '{"n":0,"seen":{}}') } catch (e) { return { n: 0, seen: {} } }
}

function writeBadge(row) {
  try { localStorage.setItem(BADGE_KEY, JSON.stringify({ n: row.n | 0, seen: row.seen || {} })) } catch (e) {}
}

function metaGet(x, y, z) {
  if (!api || !api.metaGet) return null
  return api.metaGet(keyOf(x, y, z))
}

function metaSet(x, y, z, rec) {
  if (api && api.metaSet) api.metaSet(keyOf(x, y, z), rec)
}

function lesson(kind) {
  const id = LESSON[kind]
  if (!id || !api || !api.learn || !api.t) return
  if (api.learn.addNote(id)) api.card(api.t(id))
}

export function noteVoxel(x, y, z, prev, next) {
  if (!watch(prev) && !watch(next)) return
  const was = kindOf(prev)
  put(x, y, z, next)
  if (techId(next)) {
    const rec = metaGet(x, y, z)
    const face = rec && (rec.face === 'N' || rec.face === 'E' || rec.face === 'W' || rec.face === 'S') ? rec.face : ''
    if (!face && api && api.faceAt) {
      const nextRec = Object.assign({}, rec || {}, { kind: kindOf(next), face: api.faceAt(x, z) })
      metaSet(x, y, z, nextRec)
    }
  }
  if (!syncing && techId(next) && !techId(prev)) lesson(kindOf(next))
  if (syncing) return
  dirty = true
  void was
}

export function orientTech(mesh, x, y, z) {
  if (!mesh) return
  const rec = metaGet(x, y, z)
  const face = rec && rec.face
  const yaw = face === 'E' ? Math.PI / 2 : face === 'W' ? -Math.PI / 2 : face === 'N' ? Math.PI : 0
  mesh.rotation.y = yaw
}

export function poweredAt(x, y, z) {
  if (!packOn('tech')) return false
  if (Rules.value('tech.circuits') === false) return false
  if (dirty) rebuild()
  const key = keyOf(x, y, z)
  return result.lit.indexOf(key) >= 0
}

function empty() {
  return { powered: [], lit: [], lines: {}, stops: [], edges: [] }
}

function rebuild() {
  dirty = false
  if (!packOn('tech') || Rules.value('tech.circuits') === false) {
    result = empty()
    syncLamps()
    return
  }
  const list = []
  for (const p of parts.values()) list.push(p)
  const held = {}
  for (const p of list) if (p.kind === 'button' && p.on) held[p.id] = true
  result = simulate({ parts: list }, { held })
  const marks = conductorMarks(readBadge(), result.lit.map((id) => ({ id, lines: result.lines[id] || 0 })))
  writeBadge(marks)
  syncLamps()
}

function setBlock(x, y, z, id) {
  if (!api) return
  syncing = true
  try { api.setVoxel(x, y, z, id) } finally { syncing = false }
  put(x, y, z, id)
}

function syncLamps() {
  if (!api) return
  const lit = new Set(result.lit)
  syncing = true
  try {
    for (const p of parts.values()) {
      if (p.kind !== 'load') continue
      const id = api.getVoxel(p.x, p.y, p.z)
      const on = lit.has(p.id)
      if (id === 1100 || id === 1101 || id === 1102 || id === 1103) {
        const off = id === 1100 || id === 1102 ? id : (id === 1101 ? 1100 : 1102)
        const bright = off === 1100 ? 1101 : 1103
        const rec = Object.assign({}, metaGet(p.x, p.y, p.z) || {})
        if (on && (id === 1100 || id === 1102)) {
          if (rec.manual == null) rec.manual = id
          rec.circuitForce = 1
          metaSet(p.x, p.y, p.z, rec)
          api.setVoxel(p.x, p.y, p.z, bright)
          put(p.x, p.y, p.z, bright)
        } else if (!on && rec.circuitForce) {
          const back = rec.manual === 1101 || rec.manual === 1103 ? rec.manual : off
          rec.circuitForce = 0
          metaSet(p.x, p.y, p.z, rec)
          api.setVoxel(p.x, p.y, p.z, back)
          put(p.x, p.y, p.z, back)
        }
      } else if (id === 47) {
        const rec = Object.assign({ kind: 'lantern' }, metaGet(p.x, p.y, p.z) || {})
        if ((rec.circuitLit ? 1 : 0) !== (on ? 1 : 0)) {
          rec.circuitLit = on ? 1 : 0
          metaSet(p.x, p.y, p.z, rec)
        }
      }
    }
  } finally { syncing = false }
  if (api && api.markGlow) api.markGlow()
}

export function rescan() {
  parts.clear()
  if (!api || !api.chunks) { dirty = true; return }
  const saved = api.chunks()
  const S = api.chunkSize || 24
  for (const [k, data] of saved) {
    const bits = String(k).split(',')
    const ci = bits[0] | 0
    const cj = bits[1] | 0
    const ck = bits[2] | 0
    for (let n = 0; n < data.length; n++) {
      const id = data[n]
      if (!watch(id)) continue
      const i = Math.floor(n / (S * S))
      const j = Math.floor(n / S) % S
      const kk = n % S
      put(ci * S + i, cj * S + j, ck * S + kk, id)
    }
  }
  dirty = true
  rebuild()
}

export function attachCircuits(next) {
  api = next
  hookPower(poweredAt)
  rescan()
}

export function pressButton(x, y, z) {
  if (!api || !packOn('tech') || Rules.value('tech.circuits') === false) return false
  const id = api.getVoxel(x, y, z)
  if (id !== TECH.button && id !== TECH.buttonOn) return false
  releaseAt.delete(keyOf(x, y, z))
  if (id !== TECH.buttonOn) {
    api.setVoxel(x, y, z, TECH.buttonOn)
  }
  return true
}

export function releaseButton(x, y, z) {
  if (!api) return
  const id = api.getVoxel(x, y, z)
  if (id !== TECH.button && id !== TECH.buttonOn) return
  releaseAt.set(keyOf(x, y, z), (api.now ? api.now() : Date.now()) + 1000)
}

export function toggleSwitch(x, y, z) {
  if (!api || !packOn('tech')) return false
  const id = api.getVoxel(x, y, z)
  if (id !== TECH.switch && id !== TECH.switchOn) return false
  api.setVoxel(x, y, z, id === TECH.switch ? TECH.switchOn : TECH.switch)
  return true
}

export function preferLamp(x, y, z, id) {
  const next = id === 1100 ? 1101 : id === 1101 ? 1100 : id === 1102 ? 1103 : id === 1103 ? 1102 : id
  const rec = Object.assign({}, metaGet(x, y, z) || {})
  rec.manual = next
  metaSet(x, y, z, rec)
}

function lensOn() {
  return !!(api && api.held && api.held() === 'circuitLens')
}

function hideVisuals() {
  if (!visualsOn) return
  visualsOn = false
  shown = ''
  for (const mesh of glows.values()) { try { mesh.dispose() } catch (e) {} }
  glows.clear()
  for (const mesh of dots) mesh.setEnabled(false)
  dotPos = []
}

function ensureDots() {
  if (!api || !api.dot || dots.length) return
  for (let i = 0; i < 12; i++) dots.push(api.dot())
}

function syncGlow(ids) {
  const want = new Set(ids)
  for (const key of [...glows.keys()]) {
    if (want.has(key)) continue
    try { glows.get(key).dispose() } catch (e) {}
    glows.delete(key)
  }
  for (const key of want) {
    if (glows.has(key)) continue
    const p = parts.get(key)
    if (!p || !api.glow) continue
    glows.set(key, api.glow(p.x, p.y, p.z))
  }
  shown = [...want].sort().join('|')
}

function animate(now) {
  if (!lensOn()) { hideVisuals(); return }
  visualsOn = true
  const lineIds = []
  for (const id of result.powered) {
    const p = parts.get(id)
    if (p && p.kind === 'line') lineIds.push(id)
  }
  const sig = lineIds.slice().sort().join('|')
  if (sig !== shown) syncGlow(lineIds)
  const lite = api.lite && api.lite()
  if (lite) {
    for (const mesh of dots) mesh.setEnabled(false)
    dotPos = []
    return
  }
  ensureDots()
  const edges = result.edges || []
  const usable = []
  for (const pair of edges) {
    const a = parts.get(pair[0])
    const b = parts.get(pair[1])
    if (!a || !b) continue
    if (a.kind !== 'line' && a.kind !== 'cell' && b.kind !== 'line') continue
    usable.push([a, b])
  }
  dotPos = []
  for (let i = 0; i < dots.length; i++) {
    const mesh = dots[i]
    if (!usable.length) { mesh.setEnabled(false); continue }
    const edge = usable[i % usable.length]
    const t = ((now / 700) + i * 0.17) % 1
    const x = edge[0].x + 0.5 + (edge[1].x - edge[0].x) * t
    const y = edge[0].y + 0.22 + (edge[1].y - edge[0].y) * t
    const z = edge[0].z + 0.5 + (edge[1].z - edge[0].z) * t
    mesh.setEnabled(true)
    api.move(mesh, x, y, z)
    dotPos.push([x, y, z])
  }
}

export function tick(now) {
  if (api && !gifted && api.creative && api.creative() && api.give) {
    gifted = true
    if (!api.count || api.count('circuitLens') < 1) api.give('circuitLens', 1)
  }
  if (releaseAt.size && api) {
    const t = now || (api.now ? api.now() : Date.now())
    for (const [key, at] of releaseAt) {
      if (t < at) continue
      releaseAt.delete(key)
      const bits = key.split(',')
      const x = bits[0] | 0
      const y = bits[1] | 0
      const z = bits[2] | 0
      if (api.getVoxel(x, y, z) === TECH.buttonOn) api.setVoxel(x, y, z, TECH.button)
    }
  }
  if (dirty) rebuild()
  if (!lensOn()) { hideVisuals(); return }
  animate(now || (api && api.now ? api.now() : Date.now()))
}

export function view() {
  if (dirty) rebuild()
  return {
    lit: result.lit.slice(),
    powered: result.powered.slice(),
    stops: result.stops.slice(),
    lines: Object.assign({}, result.lines),
    dots: dotPos.map((p) => p.slice()),
    glow: glows.size,
    lite: !!(api && api.lite && api.lite()),
    held: lensOn(),
    badge: readBadge().n | 0,
  }
}

void setBlock
