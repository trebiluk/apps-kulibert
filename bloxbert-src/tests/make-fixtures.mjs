// Build frozen world fixtures. Writes a file only when it is not there yet.
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { stage } from '../src/farm.js'
import { gzipU16, loadBlockRows } from '../tools/world-check.mjs'

const S = 24
const DIR = new URL('./fixtures/', import.meta.url)
const WHEN = '2026-10-10T00:00:00.000Z'
const T0 = 1700000000000

function at(x, y, z) { return x * S * S + y * S + z }
function put(data, x, y, z, id) { data[at(x, y, z)] = id }

function emptyChunk() { return new Uint16Array(S * S * S) }

function terrain(data, id, x0, x1, z0, z1) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    put(data, x, 0, z, id.stone)
    put(data, x, 1, z, id.dirt)
    put(data, x, 2, z, id.grass)
  }
}

function counts(data, nameOf) {
  const blocks = {}
  for (let i = 0; i < data.length; i++) {
    const id = data[i]
    if (!id) continue
    const name = nameOf.get(id)
    if (!name) continue
    blocks[name] = (blocks[name] || 0) + 1
  }
  return blocks
}

function bagSlots(stacks) {
  const bag = Array.from({ length: 15 }, () => null)
  stacks.forEach((s, i) => { bag[i] = { item: s[0], n: s[1] } })
  return bag
}

function palette(rows, extra) {
  let max = 0
  for (const [id] of rows) if (id > max) max = id
  const p = Array.from({ length: max + 1 }, () => null)
  p[0] = 'air'
  for (const [id, name] of rows) p[id] = name
  if (extra) p.push(extra)
  return p
}

function docV2(rows, data, extra) {
  const names = palette(rows, extra && extra.paletteName)
  return {
    format: 'kuliblocks',
    v: 2,
    appVersion: 'bloxbert-2.5.113',
    id: 'bertyville-survival',
    title: 'Bertyville',
    ownerRef: null,
    seed: 1,
    spawn: [4.5, 4, 4.5],
    chunkSize: S,
    palette: names,
    chunks: { '0,0,0': gzipU16(data) },
    updatedAt: WHEN,
    player: extra.player,
    econ: { start: 0, cogs: 0, seq: 0, day: '', soldToday: {}, spentToday: 0, picked: [], found: ['log'], ledger: [], dial: 1, dailyCap: 40 },
    meta: extra.meta,
    stations: extra.stations,
    basics: { ms: 0, always: false, bright: false, starter: false, actor: 'you', locks: [], autos: [], lights: [], badges: [], saplings: [] },
    gifts: {},
    crops: extra.crops,
    forage: extra.forage,
  }
}

function world113(id) {
  const data = emptyChunk()
  terrain(data, id, 0, 7, 0, 7)
  for (let y = 3; y <= 4; y++) {
    for (let x = 1; x <= 4; x++) for (let z = 1; z <= 4; z++) {
      if (x === 1 || x === 4 || z === 1 || z === 4) put(data, x, y, z, id.planks)
    }
  }
  put(data, 1, 3, 2, id.door)
  put(data, 3, 3, 3, id.bunk)
  put(data, 2, 3, 3, id.box)
  put(data, 3, 3, 2, id.oven)
  const plots = [[6, 2], [7, 2], [6, 3], [7, 3]]
  const cropIds = [id.cropSprout, id.cropLeafy, id.cropTall, id.cropRipe]
  const growns = [0, 200000, 400000, 480000]
  const crops = plots.map(([x, z], i) => {
    put(data, x, 2, z, id.farmland)
    put(data, x, 3, z, cropIds[i])
    return { x, y: 3, z, plantedAt: T0, grown: growns[i], wet: false, lastSeen: T0, kind: 'wheat', regrow: false }
  })
  put(data, 6, 2, 4, id.farmland)
  put(data, 6, 3, 4, id.bushFruit)
  crops.push({ x: 6, y: 3, z: 4, plantedAt: T0, grown: 600000, wet: true, lastSeen: T0, kind: 'bush', regrow: false })
  const slots = Array.from({ length: 18 }, () => null)
  slots[0] = { item: 'log', n: 3 }
  slots[1] = { item: 'coal', n: 2 }
  slots[2] = { item: 'bread', n: 1 }
  const meta = { '2,3,3': { kind: 'box', slots } }
  const stations = {
    '3,3,2': {
      kind: 'oven', fuel: 8, left: 8, fuelItem: 'planks', fuelN: 1, fuelSpent: 0,
      input: ['flour'], inputN: 2, pending: 'bread', secs: 8, until: T0 + 4000,
      output: [], staged: null, pick: 'bread', picking: false,
    },
  }
  const player = {
    mode: 'survival',
    bag: bagSlots([['log', 8], ['planks', 16], ['wheatSeeds', 4], ['bread', 2]]),
    hot: 0,
    home: [3, 3, 3],
  }
  return { data, crops, meta, stations, player, forage: [] }
}

function expectOf(data, nameOf, scene) {
  const wheat = scene.crops.filter((c) => c.kind !== 'bush')
  const bush = scene.crops.filter((c) => c.kind === 'bush')
  const items = {}
  for (const s of scene.meta['2,3,3'].slots) if (s && s.item) items[s.item] = (items[s.item] || 0) + s.n
  const bag = {}
  for (const s of scene.player.bag) if (s && s.item) bag[s.item] = (bag[s.item] || 0) + s.n
  return {
    blocks: counts(data, nameOf),
    bag,
    home: scene.player.home,
    box: { at: '2,3,3', items },
    crops: { count: wheat.length, stages: wheat.map((c) => stage(c.grown, c)).sort((a, b) => a - b) },
    bush: { n: bush.length, stages: bush.map((c) => stage(c.grown, c)).sort((a, b) => a - b) },
    oven: { at: '3,3,2', item: 'bread' },
  }
}

function worldV1(id) {
  const data = emptyChunk()
  terrain(data, id, 0, 3, 0, 3)
  return data
}

function writeNew(name, obj) {
  const url = new URL(name, DIR)
  const text = JSON.stringify(obj, null, 2) + '\n'
  if (existsSync(url)) {
    const prev = readFileSync(url, 'utf8')
    if (prev !== text) throw new Error(name + ' already exists and would change. Old fixtures stay forever.')
    return
  }
  writeFileSync(url, text)
}

const rows = await loadBlockRows()
const id = Object.fromEntries(rows.map(([n, name]) => [name, n]))
const nameOf = new Map(rows.map(([n, name]) => [n, name]))

const scene = world113(id)
const doc = docV2(rows, scene.data, scene)
const expect113 = expectOf(scene.data, nameOf, scene)
writeNew('w-2.5.113.json', doc)
writeNew('w-2.5.113.expect.json', expect113)

const unknownData = new Uint16Array(scene.data)
const names = palette(rows, 'futureThing')
const futureId = names.length - 1
for (let i = 0; i < 5; i++) put(unknownData, 10, 5, 10 + i, futureId)
const unknownDoc = docV2(rows, unknownData, { ...scene, paletteName: 'futureThing' })
const unknownExpect = expectOf(unknownData, new Map([...nameOf, [futureId, 'futureThing']]), scene)
unknownExpect.blocks.futureThing = 5
writeNew('w-unknown.json', unknownDoc)
writeNew('w-unknown.expect.json', unknownExpect)

const v1data = worldV1(id)
const v1 = {
  format: 'kuliblocks',
  v: 1,
  appVersion: 'bloxbert-2.3.0',
  id: 'bertyville',
  title: 'Bertyville',
  seed: 1,
  spawn: [2.5, 4, 2.5],
  chunkSize: S,
  palette: palette(rows),
  chunks: { '0,0,0': gzipU16(v1data) },
  updatedAt: '2026-01-01T00:00:00.000Z',
}
const v1expect = {
  blocks: counts(v1data, nameOf),
  bag: {},
  home: null,
  box: null,
  crops: { count: 0, stages: [] },
  bush: { n: 0, stages: [] },
  oven: null,
}
writeNew('w-v1.json', v1)
writeNew('w-v1.expect.json', v1expect)
console.log('fixtures ready')
