// Schema migrations and unknown palette names. Pure, no browser.
import { FROZEN } from '../src/data/ids.js'
import { migrate, migrateVoxels, resetUnknown, unknownEntries, SCHEMA } from '../src/save/migrate.js'

const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg) }

const v1 = { format: 'kuliblocks', v: 1, palette: ['air', 'grass'], chunks: { a: [1, 1, 0] } }
const m1 = migrate(v1)
eq(m1.readOnly === false && m1.doc.schema === 3 && m1.doc.v === 1 && m1.doc.packs && !Object.keys(m1.doc.packs).length, 'v1 to schema 3')
eq(v1.schema == null && v1.packs == null, 'v1 not mutated')

const v2 = { format: 'kuliblocks', v: 2, player: { mode: 'survival', bag: [{ item: 'berry', n: 1 }, { item: 'futureSeed', n: 2 }], hot: 0, home: [3, 5, 3] }, meta: { '1,5,1': { kind: 'box', slots: [{ item: 'futureRelic', n: 1 }] } }, crops: [{ x: 1, y: 2, z: 3, kind: 'mystery' }], palette: ['air', 'stone'], chunks: {} }
const m2 = migrate(v2)
eq(m2.doc.schema === 3 && m2.doc.player.home[0] === 3 && m2.doc.player.bag[1].item === 'futureSeed', 'v2 keeps bag and home')
eq(m2.doc.meta['1,5,1'].slots[0].item === 'futureRelic' && m2.doc.crops[0].kind === 'mystery', 'v2 keeps unknown keys')
eq(v2.schema == null, 'v2 not mutated')

const s3 = { format: 'kuliblocks', v: 2, schema: 3, packs: { woodshop: 1 }, palette: ['air'], chunks: {} }
const m3 = migrate(s3)
eq(m3.readOnly === false && m3.doc.schema === 3 && m3.doc.packs.woodshop === 1, 'schema 3 stays')
eq(s3.packs.woodshop === 1, 'schema 3 not mutated')

const future = { format: 'kuliblocks', v: 2, schema: 9, packs: { later: 4 }, note: 'keep' }
const m9 = migrate(future)
eq(m9.readOnly === true && m9.doc === future && future.schema === 9 && future.note === 'keep' && future.packs.later === 4, 'schema 9 read-only')

const nameToId = { ...FROZEN }
delete nameToId.woodshopBench
function namesOf(palette, data) {
  resetUnknown()
  const moved = migrateVoxels(palette, data, nameToId)
  const counts = {}
  for (const id of moved.data) {
    if (!id) continue
    const name = nameToId.grass && id === nameToId.grass ? 'grass'
      : Object.keys(nameToId).find((k) => nameToId[k] === id) || unknownEntries().find(([n]) => n === id)?.[1]
    if (!name) { fail.push('unnamed ' + id); continue }
    counts[name] = (counts[name] || 0) + 1
  }
  return { counts, gifts: moved.gifts, data: moved.data }
}
function paletteFrom(data) {
  const p = ['air']
  for (const [key, id] of Object.entries(nameToId)) p[id] = key
  const used = new Set(data)
  for (const [id, name] of unknownEntries()) if (used.has(id)) p[id] = name
  return p
}

resetUnknown()
const srcPalette = ['air', 'grass', 'dirt', 'stone', 'futureThing']
const src = Uint16Array.from([1, 1, 2, 4, 4, 3, 0])
const first = namesOf(srcPalette, src)
eq(first.gifts.length === 0, 'futureThing is not a gift')
eq(first.counts.grass === 2 && first.counts.dirt === 1 && first.counts.stone === 1 && first.counts.futureThing === 2, 'first counts ' + JSON.stringify(first.counts))
const savedPalette = paletteFrom(first.data)
eq(savedPalette.includes('futureThing'), 'palette keeps futureThing')
const again = namesOf(savedPalette, first.data)
eq(again.counts.grass === 2 && again.counts.dirt === 1 && again.counts.stone === 1 && again.counts.futureThing === 2, 'reload counts ' + JSON.stringify(again.counts))
eq(paletteFrom(again.data).includes('futureThing'), 'second save keeps the name')
eq(SCHEMA === 3, 'schema')

if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('save-check ok')
