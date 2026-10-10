// Load frozen world fixtures. No browser, no network.
import { existsSync, readFileSync, readdirSync } from 'fs'
import { gunzipSync, gzipSync } from 'zlib'
import { pathToFileURL } from 'url'
import { migrateVoxels } from '../src/save/migrate.js'
import * as migrateMod from '../src/save/migrate.js'
import { fromDoc } from '../src/save.js'
import { stage } from '../src/farm.js'
import { createHash } from 'crypto'
import { genBlock, exploredSeen, spawnGround, groundAt, genColumns, underAll, solidUnder } from '../src/worldgen.js'

const S = 24
const FIX = new URL('../tests/fixtures/', import.meta.url)

export function parseBlocks(text) {
  const start = text.indexOf('export const BLOCKS = [')
  if (start < 0) throw new Error('BLOCKS not found')
  const end = text.indexOf('\n]', start)
  const body = text.slice(start, end < 0 ? start + 8000 : end)
  const rows = []
  const re = /\[\s*(\d+)\s*,\s*'([^']+)'/g
  let m
  while ((m = re.exec(body))) rows.push([Number(m[1]), m[2]])
  if (!rows.length) throw new Error('no BLOCKS rows')
  return rows
}

export async function loadBlockRows() {
  const idsUrl = new URL('../src/data/ids.js', import.meta.url)
  let rows = null
  if (existsSync(idsUrl)) {
    const mod = await import(idsUrl.href)
    const listed = mod.BLOCKS || mod.default
    if (Array.isArray(listed) && listed.length && Array.isArray(listed[0])) rows = listed.map((r) => [r[0], r[1]])
    const ids = mod.IDS || mod.ids
    if (!rows && ids && typeof ids === 'object') {
      const out = []
      for (const [k, v] of Object.entries(ids)) {
        if (typeof v === 'number') out.push([v, k])
        else if (/^\d+$/.test(k) && typeof v === 'string') out.push([Number(k), v])
      }
      if (out.length) rows = out
    }
  }
  if (!rows) {
    const mod = await import('../src/data/blocks-list.js')
    const listed = mod.BLOCKS
    if (Array.isArray(listed) && listed.length && Array.isArray(listed[0])) rows = listed.map((r) => [r[0], r[1]])
  }
  if (!rows) rows = parseBlocks(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'))
  const { packBlocks } = await import('../src/packs/registry.js')
  await import('../src/packs/farm/pack.js')
  const have = new Set(rows.map((r) => r[1]))
  for (const b of packBlocks()) if (!have.has(b.key)) rows.push([b.id, b.key])
  return rows
}

export function gzipU16(u16) {
  const buf = Buffer.from(u16.buffer, u16.byteOffset, u16.byteLength)
  const gz = gzipSync(buf, { level: 9 })
  if (gz.length >= 10) gz.writeUInt32LE(0, 4)
  return gz.toString('base64')
}

export function ungzipU16(b64) {
  const raw = gunzipSync(Buffer.from(b64, 'base64'))
  const buf = Buffer.from(raw)
  if (buf.byteLength % 2) throw new Error('chunk byte length is odd')
  return new Uint16Array(buf.buffer, buf.byteOffset, buf.byteLength / 2)
}

function placeholderOn(mod) {
  return Object.keys(mod).some((k) => /placeholder/i.test(k))
}

function nameToIdOf(rows) {
  return Object.fromEntries(rows.map(([id, name]) => [name, id]))
}

function idToNameOf(rows) {
  return new Map(rows.map(([id, name]) => [id, name]))
}

function paletteOf(rows) {
  let max = 0
  for (const [id] of rows) if (id > max) max = id
  const p = Array.from({ length: max + 1 }, () => null)
  p[0] = 'air'
  for (const [id, name] of rows) p[id] = name
  return p
}

function bagCounts(player) {
  const out = {}
  for (const s of (player && player.bag) || []) {
    if (s && s.item && s.n) out[s.item] = (out[s.item] || 0) + s.n
  }
  return out
}

function boxOf(meta) {
  if (!meta || typeof meta !== 'object') return null
  for (const [at, rec] of Object.entries(meta)) {
    if (!rec || rec.kind !== 'box' || !Array.isArray(rec.slots)) continue
    const items = {}
    for (const s of rec.slots) if (s && s.item && s.n) items[s.item] = (items[s.item] || 0) + s.n
    return { at, items }
  }
  return null
}

function ovenOf(stations) {
  if (!stations || typeof stations !== 'object') return null
  for (const [at, rec] of Object.entries(stations)) {
    if (!rec || rec.kind !== 'oven') continue
    const item = rec.pending || (Array.isArray(rec.output) && rec.output[0]) || (Array.isArray(rec.input) && rec.input[0]) || null
    return { at, item }
  }
  return null
}

function blockCounts(data, idToName) {
  const blocks = {}
  for (let i = 0; i < data.length; i++) {
    const id = data[i]
    if (!id) continue
    const name = idToName.get(id) || ('#' + id)
    blocks[name] = (blocks[name] || 0) + 1
  }
  return blocks
}

function countPaletteName(data, palette, name) {
  let n = 0
  if (!palette) return 0
  for (let i = 0; i < data.length; i++) {
    const id = data[i]
    if (id && palette[id] === name) n++
  }
  return n
}

function cropReport(list) {
  const rows = Array.isArray(list) ? list.filter((c) => c && c.kind !== 'bush') : []
  const stages = rows.map((c) => stage(c.grown, c)).sort((a, b) => a - b)
  return { count: rows.length, stages }
}

function bushReport(list) {
  const rows = Array.isArray(list) ? list.filter((c) => c && c.kind === 'bush') : []
  return { n: rows.length, stages: rows.map((c) => stage(c.grown, c)).sort((a, b) => a - b) }
}

function sameU16(a, b) {
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function flatten(value, prefix, into) {
  if (Array.isArray(value)) {
    into.push([prefix, JSON.stringify(value)])
    return
  }
  if (value && typeof value === 'object') {
    const keys = Object.keys(value).sort()
    if (!keys.length) into.push([prefix, '{}'])
    for (const k of keys) flatten(value[k], prefix ? prefix + '.' + k : k, into)
    return
  }
  into.push([prefix, value == null ? 'null' : String(value)])
}

function diffCounts(expect, got) {
  const a = []
  const b = []
  flatten(expect, '', a)
  flatten(got, '', b)
  const bm = new Map(b)
  const lines = []
  const seen = new Set()
  for (const [k, v] of a) {
    seen.add(k)
    const w = bm.has(k) ? bm.get(k) : 'missing'
    if (w !== v) lines.push(k + ' ' + v + '→' + w)
  }
  for (const [k, v] of b) if (!seen.has(k)) lines.push(k + ' missing→' + v)
  return lines
}

function observed(doc, data, rows, playerDoc) {
  const idToName = idToNameOf(rows)
  return {
    blocks: blockCounts(data, idToName),
    bag: bagCounts(playerDoc.player),
    home: playerDoc.player && playerDoc.player.home ? playerDoc.player.home : null,
    box: boxOf(playerDoc.meta),
    crops: cropReport(doc.crops),
    bush: bushReport(doc.crops),
    oven: ovenOf(doc.stations),
  }
}

async function checkFile(name, rows) {
  const doc = JSON.parse(readFileSync(new URL(name, FIX), 'utf8'))
  const expect = JSON.parse(readFileSync(new URL(name.replace(/\.json$/, '.expect.json'), FIX), 'utf8'))
  let work = doc
  if (typeof migrateMod.migrate === 'function') {
    const next = migrateMod.migrate(JSON.parse(JSON.stringify(doc)))
    if (next && next.doc && typeof next.doc === 'object') work = next.doc
    else if (next && typeof next === 'object' && next.chunks) work = next
  }
  if (typeof migrateMod.resetUnknown === 'function') migrateMod.resetUnknown()
  const nameToId = nameToIdOf(rows)
  const parts = []
  const gifts = []
  for (const key of Object.keys(work.chunks || {}).sort()) {
    const raw = ungzipU16(work.chunks[key])
    if (raw.length !== S * S * S) throw new Error(key + ' length ' + raw.length)
    const migrated = migrateVoxels(work.palette, raw, nameToId)
    gifts.push(...(migrated.gifts || []))
    parts.push(migrated.data)
  }
  const data = parts.length === 1 ? parts[0] : concat(parts)
  const playerDoc = fromDoc(work)
  const got = observed(work, data, rows, playerDoc)
  const rebuilt = paletteOf(rows)
  if (typeof migrateMod.unknownEntries === 'function') {
    for (const [id, name] of migrateMod.unknownEntries()) {
      if (!name) continue
      while (rebuilt.length <= id) rebuilt.push(null)
      rebuilt[id] = name
    }
  }
  if (typeof migrateMod.resetUnknown === 'function') migrateMod.resetUnknown()
  const again = ungzipU16(gzipU16(data))
  const second = migrateVoxels(rebuilt, again, nameToId)
  const roundOk = sameU16(data, second.data)
  const wantUnknown = expect.blocks && expect.blocks.futureThing
  const hasPh = placeholderOn(migrateMod)
  const survived = countPaletteName(second.data, rebuilt, 'futureThing')
  const soft = []
  const hardExpect = JSON.parse(JSON.stringify(expect))
  const hardGot = JSON.parse(JSON.stringify(got))
  if (wantUnknown) {
    const giftN = gifts.filter((n) => n === 'futureThing').length
    if (!hasPh) {
      const kept = survived === wantUnknown && roundOk
      if (!kept && giftN !== wantUnknown) {
        return { status: 'FAIL', diff: ['futureThing gift ' + wantUnknown + '→' + giftN + ' survived ' + survived] }
      }
      if (!kept) soft.push('futureThing')
      delete hardExpect.blocks.futureThing
      if (hardGot.blocks) {
        delete hardGot.blocks.futureThing
        for (const k of Object.keys(hardGot.blocks)) if (k[0] === '#') delete hardGot.blocks[k]
      }
    } else if (survived !== wantUnknown || !roundOk) {
      return { status: 'FAIL', diff: ['futureThing round trip ' + wantUnknown + '→' + survived] }
    }
  }
  const diff = diffCounts(hardExpect, hardGot)
  if (!roundOk) diff.push('round trip changed')
  const fresh = uneditedGen2(doc)
  if (GEN2_FRESH[name] && fresh !== GEN2_FRESH[name]) diff.push('unedited gen2 changed')
  if (diff.length) return { status: 'FAIL', diff }
  if (soft.length) return { status: 'EXPECTED-FAIL', diff: ['turns green when P1 placeholder lands'] }
  return { status: 'PASS', diff: [] }
}

function concat(parts) {
  let n = 0
  for (const p of parts) n += p.length
  const out = new Uint16Array(n)
  let o = 0
  for (const p of parts) { out.set(p, o); o += p.length }
  return out
}

const GEN2_FRESH_HASH = '79db2f1e4be5153bc9c286e48341c1a4bad03d63aa9016e99ce9d4d05ed51cd9'
const GEN2_FRESH = {
  'w-2.5.113.json': GEN2_FRESH_HASH,
  'w-2.5.119.json': GEN2_FRESH_HASH,
  'w-2.5.120.json': GEN2_FRESH_HASH,
  'w-2.5.121.json': GEN2_FRESH_HASH,
  'w-2.5.123.json': GEN2_FRESH_HASH,
  'w-2.5.131.json': GEN2_FRESH_HASH,
  'w-unknown.json': GEN2_FRESH_HASH,
  'w-v1.json': GEN2_FRESH_HASH,
}
const GEN2_SURFACE = '85bd820c6e16decde16f9a995aa0393473748a96b3fd35241d0dfbf936198d53'

function uneditedGen2(doc) {
  const seen = exploredSeen(doc.chunks || {}, doc.chunkSize || S)
  const saved = new Set(Object.keys(doc.chunks || {}))
  const pick = Object.keys(seen).filter((k) => !saved.has(k) && k.split(',')[1] === '0').sort()
  const h = createHash('sha256')
  const step = Math.max(1, Math.floor(pick.length / 8))
  let n = 0
  for (let i = 0; i < pick.length; i += step) {
    const [ci, , ck] = pick[i].split(',').map(Number)
    for (let x = ci * S; x < ci * S + S; x += 4) {
      for (let z = ck * S; z < ck * S + S; z += 4) {
        const y = spawnGround(x, z)
        h.update(genBlock(x, y, z, 2) || '-')
        h.update(genBlock(x, y - 1, z, 2) || '-')
        n++
      }
    }
  }
  h.update(String(n))
  return h.digest('hex')
}

function surface64(gen) {
  const h = createHash('sha256')
  let clay = 0
  for (let x = -32; x < 32; x++) {
    for (let z = -32; z < 32; z++) {
      const y = spawnGround(x, z)
      const top = genBlock(x, y, z, gen) || ''
      const under = genBlock(x, y - 1, z, gen) || ''
      if (top === 'clay' || under === 'clay') clay++
      h.update(top + '/' + under + ';')
    }
  }
  return { hash: h.digest('hex'), clay }
}

function countFarClay(gen) {
  let n = 0
  for (let x = 144; x <= 180; x++) {
    for (let z = -48; z <= 48; z++) {
      const y = spawnGround(x, z)
      if (genBlock(x, y, z, gen) === 'clay' || genBlock(x, y - 1, z, gen) === 'clay') n++
    }
  }
  return n
}

const DUP_SPOTS = [[6, 5, 8], [8, 5, 9], [10, 5, 6], [11, 5, 8]]

function atCell(u16, x, y, z) {
  return u16[x * S * S + y * S + z]
}

function townCells(u16) {
  return DUP_SPOTS.map(([x, y, z]) => atCell(u16, x, y, z))
}

function chunkBytes(doc) {
  const out = {}
  for (const k of Object.keys(doc.chunks || {}).sort()) out[k] = doc.chunks[k]
  return out
}

function resave(doc) {
  const back = fromDoc(doc)
  return { ...doc, player: back.player, econ: back.econ, meta: back.meta, lost: back.lost, drops: back.drops }
}

function roundTwice(doc) {
  let cur = doc
  let hash = ''
  let meta = ''
  for (let i = 0; i < 2; i++) {
    const moved = migrateMod.migrate(JSON.parse(JSON.stringify(cur))).doc
    const again = migrateMod.migrate(JSON.parse(JSON.stringify(resave(moved)))).doc
    const h1 = createHash('sha256').update(JSON.stringify(chunkBytes(moved))).digest('hex')
    const h2 = createHash('sha256').update(JSON.stringify(chunkBytes(again))).digest('hex')
    const m1 = JSON.stringify(fromDoc(moved).meta)
    const m2 = JSON.stringify(fromDoc(again).meta)
    if (h1 !== h2) return 'voxels ' + i
    if (m1 !== m2) return 'meta ' + i
    if (i && (h1 !== hash || m1 !== meta)) return 'drift'
    hash = h1
    meta = m1
    cur = again
  }
  return ''
}

function townDupReport(name) {
  const raw = JSON.parse(readFileSync(new URL(name, FIX), 'utf8'))
  const before = ungzipU16(raw.chunks['0,0,0'])
  const moved = migrateMod.migrate(JSON.parse(JSON.stringify(raw))).doc
  const after = ungzipU16(moved.chunks['0,0,0'])
  const diffs = []
  for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) diffs.push(i)
  const want = DUP_SPOTS.map(([x, y, z]) => x * S * S + y * S + z).sort((a, b) => a - b)
  const got = diffs.slice().sort((a, b) => a - b)
  const cleared = got.length === 4 && got.every((n, i) => n === want[i]) && townCells(after).every((id) => id === 0)
  const lines = []
  if (!cleared) lines.push('dup cells ' + JSON.stringify(townCells(after)) + ' diffs ' + diffs.length)
  if (moved.townDupFixed !== 1) lines.push('dup flag')
  const trip = roundTwice(raw)
  if (trip) lines.push('dup ' + trip)
  return lines
}

function townCleanReport(names) {
  const lines = []
  for (const name of names) {
    if (name === 'w-2.5.124-dup.json') continue
    const raw = JSON.parse(readFileSync(new URL(name, FIX), 'utf8'))
    const before = chunkBytes(raw)
    const moved = migrateMod.migrate(JSON.parse(JSON.stringify(raw))).doc
    const after = chunkBytes(moved)
    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    for (const k of keys) if (before[k] !== after[k]) lines.push(name + ' chunk ' + k)
    if (moved.townDupFixed) lines.push(name + ' flag')
    const trip = roundTwice(raw)
    if (trip) lines.push(name + ' ' + trip)
  }
  return lines
}

function townKeptReport() {
  const raw = JSON.parse(readFileSync(new URL('w-2.5.124-dup.json', FIX), 'utf8'))
  const kid = JSON.parse(JSON.stringify(raw))
  const ku = ungzipU16(kid.chunks['0,0,0'])
  ku[6 * S * S + 4 * S + 8] = 2
  kid.chunks['0,0,0'] = gzipU16(ku)
  const moved = migrateMod.migrate(kid).doc
  const after = ungzipU16(moved.chunks['0,0,0'])
  const bench = atCell(after, 6, 5, 8)
  const under = atCell(after, 6, 4, 8)
  const rest = [[8, 5, 9], [10, 5, 6], [11, 5, 8]].every(([x, y, z]) => atCell(after, x, y, z) === 0)
  if (bench !== 22 || under !== 2 || !rest) return ['kept bench ' + bench + ' under ' + under]
  const owned = JSON.parse(JSON.stringify(raw))
  owned.meta = { ...(owned.meta || {}), '8,5,9': { kind: 'storeCounter' } }
  const keep = ungzipU16(migrateMod.migrate(owned).doc.chunks['0,0,0'])
  if (atCell(keep, 8, 5, 9) !== 25) return ['kept meta store']
  if (atCell(keep, 6, 5, 8) !== 0) return ['meta still cleared the bench']
  return []
}

function gen4Sample() {
  const h = createHash('sha256')
  let n = 0
  for (let x = 96; x < 144; x++) {
    for (let z = 96; z < 144; z++) {
      const y = groundAt(x, z, 4)
      for (let dy = -2; dy <= 6; dy++) {
        h.update((genBlock(x, y + dy, z, 4) || '-') + '\n')
        n++
      }
    }
  }
  h.update(String(n))
  return h.digest('hex')
}

function mix(n) {
  let h = Math.imul(n | 0, 374761393)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return (h ^ (h >>> 16)) >>> 0
}

function colsMatch() {
  let bad = 0
  let first = ''
  for (let n = 0; n < 50; n++) {
    const x0 = ((mix(n + 3) % 21) - 10) * S
    const z0 = ((mix(n + 50) % 21) - 10) * S
    const y0 = ((mix(n + 90) % 4) - 2) * S
    const gen = 2 + (mix(n + 7) % 3)
    const arr = new Int8Array(S * S)
    const fade = (x, z) => {
      const d = Math.max(Math.abs((x | 0) - (x0 + 11)), Math.abs((z | 0) - (z0 + 7))) - 6
      return d > 0 ? Math.min(12, d) : 0
    }
    for (let i = 0; i < S; i++) for (let k = 0; k < S; k++) arr[i * S + k] = fade(x0 + i, z0 + k)
    const cols = genColumns(x0, z0, gen, arr)
    const deep = underAll(x0, y0, z0, cols)
    for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
      const x = x0 + i
      const y = y0 + j
      const z = z0 + k
      const a = genBlock(x, y, z, gen, fade) || ''
      const b = deep ? (solidUnder(x, y, z) || '') : (genBlock(x, y, z, gen, fade, cols) || '')
      if (a !== b) {
        bad++
        if (!first) first = x + ',' + y + ',' + z + ' g' + gen + ' ' + a + '→' + b
      }
    }
  }
  return { bad, first }
}

function benchSurface() {
  const fill = (x0, z0) => {
    const arr = new Int8Array(S * S)
    arr.fill(12)
    const fade = () => 12
    const t = performance.now()
    const cols = genColumns(x0, z0, 4, arr)
    if (underAll(x0, 0, z0, cols)) {
      for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) solidUnder(x0 + i, j, z0 + k)
    } else {
      for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) genBlock(x0 + i, j, z0 + k, 4, fade, cols)
    }
    return performance.now() - t
  }
  fill(48, 48)
  return fill(960, -720)
}
const GEN4_SAMPLE = '9f88619597f29a3d8f45bef88f678bf64735ce90947d4460a356da2a239a4d60'
const GEN3_SAMPLE = '2c06555d8307d1cd8ab3842cfef4d8060212a2ba43e223cea02d31beb214694a'

function genSampleHash(gen, x0, z0, x1, z1) {
  const h = createHash('sha256')
  let n = 0
  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      const y = spawnGround(x, z)
      for (let dy = -2; dy <= 6; dy++) {
        h.update(genBlock(x, y + dy, z, gen) || '-')
        n++
      }
    }
  }
  h.update(String(n))
  return h.digest('hex')
}

function borderFade(x, z) {
  const nx0 = 96
  const nx1 = 119
  const nz0 = 120
  const nz1 = 143
  const dx = x < nx0 ? nx0 - x : x > nx1 ? x - nx1 : 0
  const dz = z < nz0 ? nz0 - z : z > nz1 ? z - nz1 : 0
  const d = Math.max(dx, dz) - 1
  return d > 0 ? d : 0
}

function terrainReport() {
  const lines = []
  const g4 = gen4Sample()
  if (g4 !== GEN4_SAMPLE) lines.push('gen4 hash ' + g4)
  const cols = colsMatch()
  if (cols.bad) lines.push('cols ' + cols.bad + ' ' + cols.first)
  const ms = benchSurface()
  console.log('surface chunk ' + ms.toFixed(1) + 'ms')
  if (ms > 12) lines.push('surface ' + ms.toFixed(1) + 'ms')
  const g3 = genSampleHash(3, 96, 48, 144, 96)
  if (g3 !== GEN3_SAMPLE) lines.push('gen3 hash ' + g3)
  if (genSampleHash(3, 96, 48, 144, 96) !== g3) lines.push('gen3 drift')
  let minH = 99
  let maxH = -99
  let sand = 0
  let gravel = 0
  let above = 0
  let floatLog = 0
  for (let x = -96; x < -48; x++) {
    for (let z = -96; z < -48; z++) {
      const h = groundAt(x, z, 4)
      if (h < minH) minH = h
      if (h > maxH) maxH = h
      const top = genBlock(x, h, z, 4) || ''
      if (top === 'sand') sand++
      if (top === 'gravel') gravel++
      for (let y = 0; y <= 30; y++) {
        const name = genBlock(x, y, z, 4) || ''
        if (y > 23 && name) above++
        if (name === 'log' && !(genBlock(x, y - 1, z, 4) || '')) floatLog++
      }
    }
  }
  if (maxH - minH < 6) lines.push('hill range ' + (maxH - minH))
  if (!sand || !gravel) lines.push('beach sand ' + sand + ' gravel ' + gravel)
  if (above) lines.push('above y23 ' + above)
  if (floatLog) lines.push('floating logs ' + floatLog)
  if (groundAt(8, 1, 4) !== 4) lines.push('spawn not flat')
  let edge = 0
  for (let z = 120; z < 144; z++) {
    const left = groundAt(119, z, 3)
    const right = groundAt(120, z, 4, borderFade)
    const step = Math.abs(right - left)
    if (step > edge) edge = step
    if (right !== spawnGround(120, z)) lines.push('border lifted ' + z)
  }
  const corner = Math.abs(groundAt(119, 119, 3) - groundAt(120, 119, 4, borderFade))
  if (corner > edge) edge = corner
  if (edge > 1) lines.push('border step ' + edge)
  return lines
}

async function main() {
  const rows = await loadBlockRows()
  const near = surface64(2)
  const farClay = countFarClay(3)
  let fail = near.clay !== 0 || near.hash !== GEN2_SURFACE || farClay < 1 ? 1 : 0
  if (fail) console.log('FAIL gen2-surface clay ' + near.clay + ' far ' + farClay + ' hash ' + near.hash)
  else console.log('PASS gen2-surface ' + near.hash + ' far-clay ' + farClay)
  const names = readdirSync(FIX).filter((f) => f.endsWith('.json') && !f.endsWith('.expect.json')).sort()
  for (const name of names) {
    let result
    try { result = await checkFile(name, rows) }
    catch (e) { result = { status: 'FAIL', diff: [e.message] } }
    if (result.status === 'FAIL') fail++
    const extra = result.diff && result.diff.length ? ' ' + result.diff.join('; ') : ''
    console.log(result.status + ' ' + name + extra)
  }
  const dupLines = townDupReport('w-2.5.124-dup.json')
  if (dupLines.length) { fail++; console.log('FAIL town-dup ' + dupLines.join('; ')) }
  else console.log('PASS town-dup 4')
  const cleanLines = townCleanReport(names)
  if (cleanLines.length) { fail++; console.log('FAIL town-clean ' + cleanLines.join('; ')) }
  else console.log('PASS town-clean 0')
  const keptLines = townKeptReport()
  if (keptLines.length) { fail++; console.log('FAIL town-kept ' + keptLines.join('; ')) }
  else console.log('PASS town-kept')
  const terrainLines = terrainReport()
  if (terrainLines.length) { fail++; console.log('FAIL terrain ' + terrainLines.join('; ')) }
  else console.log('PASS terrain gen3 ' + GEN3_SAMPLE.slice(0, 12) + ' gen4 ' + GEN4_SAMPLE.slice(0, 12) + ' hills+beach')
  process.exit(fail ? 1 : 0)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) main()
