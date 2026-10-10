// Fails if a shipped block id drifts from the frozen list.
import { readFileSync } from 'fs'
import { FROZEN } from '../src/data/ids.js'
import { packBlocks, registerPack, packIds, packVersions } from '../src/packs/registry.js'
import '../src/packs/farm/pack.js'

const fail = []
const text = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
const start = text.indexOf('export const BLOCKS = [')
const end = text.indexOf('\n]', start)
const body = start >= 0 && end > start ? text.slice(start, end) : ''
const blocks = [...body.matchAll(/\[(\d+),\s*'([^']+)'/g)].map((m) => ({ id: +m[1], key: m[2] }))
if (blocks.length < 40) fail.push('BLOCKS parse failed')

const idToKey = new Map()
for (const [key, id] of Object.entries(FROZEN)) {
  if (idToKey.has(id)) fail.push('frozen id ' + id + ' reused')
  idToKey.set(id, key)
}
const have = new Map(blocks.map((b) => [b.key, b.id]))
for (const b of blocks) {
  if (!Object.prototype.hasOwnProperty.call(FROZEN, b.key)) fail.push('BLOCKS ' + b.key + ' missing from FROZEN')
  else if (FROZEN[b.key] !== b.id) fail.push('frozen ' + b.key + ' is ' + FROZEN[b.key] + ' not ' + b.id)
  if (idToKey.get(b.id) !== b.key) fail.push('frozen id ' + b.id + ' has a different key')
}
const packed = new Set(packBlocks().map((b) => b.key))
for (const [key, id] of Object.entries(FROZEN)) {
  if (have.has(key) || packed.has(key)) continue
  if (id >= 1100) continue
  fail.push('frozen key disappeared ' + key)
}
for (const b of packBlocks()) {
  if (!Object.prototype.hasOwnProperty.call(FROZEN, b.key)) fail.push('pack ' + b.key + ' missing from FROZEN')
  else if (FROZEN[b.key] !== b.id) fail.push('pack ' + b.key + ' id drifted')
  if (idToKey.get(b.id) !== b.key) fail.push('frozen id ' + b.id + ' has a different key')
}
if (FROZEN.missing !== 1000) fail.push('missing')
if (FROZEN.woodshopBench !== 1300) fail.push('woodshopBench')
let threw = false
try { registerPack({ id: 'bad', v: 1, blocks: [{ id: 1, key: 'grass' }] }) } catch (e) { threw = true }
if (!threw) fail.push('pack accepted a core id')
threw = false
try { registerPack({ id: 'bad2', v: 1, blocks: [{ id: 1300, key: 'notBench' }] }) } catch (e) { threw = true }
if (!threw) fail.push('pack renamed a frozen id')
registerPack({ id: 'woodshop', v: 1, blocks: [{ id: 1300, key: 'woodshopBench' }] })
registerPack({ id: 'alpha', v: 2, blocks: [] })
threw = false
try { registerPack({ id: 'alpha', v: 1, blocks: [] }) } catch (e) { threw = true }
if (!threw) fail.push('duplicate pack')
if (packIds().join(',') !== 'alpha,farm,woodshop') fail.push('merge order ' + packIds().join(','))
if (packVersions().alpha !== 2 || packVersions().woodshop !== 1) fail.push('pack versions')
if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('ids-check ok', blocks.length, 'blocks', Object.keys(FROZEN).length, 'frozen')
