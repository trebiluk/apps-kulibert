// Load frozen world fixtures. No browser, no network.
import { existsSync, readFileSync, readdirSync } from 'fs'
import { gunzipSync, gzipSync } from 'zlib'
import { pathToFileURL } from 'url'
import { migrateVoxels } from '../src/save/migrate.js'
import * as migrateMod from '../src/save/migrate.js'
import { fromDoc } from '../src/save.js'
import { stage } from '../src/farm.js'

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
    if (next && typeof next === 'object') work = next
  }
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
      soft.push('futureThing')
      if (giftN !== wantUnknown && survived !== wantUnknown) {
        return { status: 'FAIL', diff: ['futureThing gift ' + wantUnknown + '→' + giftN + ' survived ' + survived] }
      }
      delete hardExpect.blocks.futureThing
      if (hardGot.blocks) delete hardGot.blocks.futureThing
    } else if (survived !== wantUnknown || !roundOk) {
      return { status: 'FAIL', diff: ['futureThing round trip ' + wantUnknown + '→' + survived] }
    }
  }
  const diff = diffCounts(hardExpect, hardGot)
  if (!roundOk) diff.push('round trip changed')
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

async function main() {
  const rows = await loadBlockRows()
  const names = readdirSync(FIX).filter((f) => f.endsWith('.json') && !f.endsWith('.expect.json')).sort()
  let fail = 0
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
