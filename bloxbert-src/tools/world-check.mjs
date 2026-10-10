// Load frozen world fixtures. No browser, no network.
import { existsSync, readFileSync, readdirSync } from 'fs'
import { gunzipSync, gzipSync } from 'zlib'
import { pathToFileURL } from 'url'
import { migrateVoxels } from '../src/save/migrate.js'
import * as migrateMod from '../src/save/migrate.js'
import { fromDoc } from '../src/save.js'
import { stage } from '../src/farm.js'
import { createHash } from 'crypto'
import { genBlock, exploredSeen, spawnGround } from '../src/worldgen.js'

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
  if (existsSync(idsUrl)) {
    const mod = await import(idsUrl.href)
    const rows = mod.BLOCKS || mod.default
    if (Array.isArray(rows) && rows.length && Array.isArray(rows[0])) return rows.map((r) => [r[0], r[1]])
    const ids = mod.IDS || mod.ids
    if (ids && typeof ids === 'object') {
      const out = []
      for (const [k, v] of Object.entries(ids)) {
        if (typeof v === 'number') out.push([v, k])
        else if (/^\d+$/.test(k) && typeof v === 'string') out.push([Number(k), v])
      }
      if (out.length) return out
    }
  }
  return parseBlocks(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8'))
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
  process.exit(fail ? 1 : 0)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) main()
