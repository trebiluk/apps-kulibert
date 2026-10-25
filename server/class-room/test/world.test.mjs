import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { decodeChunk } from '../src/world/chunks.js'
import { makeWorld } from '../src/world/world.js'

const E = (x, y, z, id, b) => ({ x, y, z, id, b })

test('two rooms editing the same cell: exactly one wins, the other gets the true block', () => {
  const w = makeWorld(memDb())
  const [a] = w.apply([E(5, 64, 5, 7, 1)], 1)
  const [b] = w.apply([E(5, 64, 5, 9, 1)], 2)        // thought it was still 1
  assert.equal(a.ok, true)
  assert.deepEqual(b, { ok: false, why: 'stale', cur: 7 })
  assert.equal(w.apply([E(5, 64, 5, 9, 7)], 2)[0].ok, true)   // retry with the truth works
  assert.equal(w.head(), 2)
})

test('seq is gapless and in order across a mixed batch; shape errors take no number', () => {
  const w = makeWorld(memDb())
  const r = w.apply([E(0, 0, 0, 1, 0), { x: 1.5 }, E(1, 0, 0, 1, 0), E(0, 0, 0, 1, 1)], 3)
  assert.deepEqual(r.map((x) => x.ok), [true, false, true, true])
  assert.deepEqual(r.map((x) => x.s), [1, undefined, 2, 2])        // the last one changed nothing, so it takes no new number
  assert.deepEqual(w.since(0).ops.map((o) => o.s), [1, 2])
})

test('worldgen check: a client lying about the original block is refused', () => {
  const w = makeWorld(memDb(), { gen: () => 3 })
  assert.equal(w.apply([E(0, 0, 0, 1, 9)], 1)[0].why, 'stale')
  assert.equal(w.apply([E(0, 0, 0, 1, 3)], 1)[0].ok, true)
})

test('flush is atomic: a failed commit loses nothing and repeats nothing', () => {
  const db = memDb()
  const w = makeWorld(db)
  w.apply([E(1, 1, 1, 5, 0)], 1)
  db.fail = true
  assert.throws(() => w.flush())
  assert.equal(db.chunkCount(), 0)
  assert.equal(w.flush(), 1, 'the retry writes the edit that failed')
  assert.equal(db.chunkCount(), 1)
  w.apply([E(2, 1, 1, 6, 0)], 1)
  assert.equal(w.flush(), 1)
  assert.equal(w.flush(), 0, 'a clean world writes nothing')
  const w2 = makeWorld(db)                                   // restart: reload from the db
  assert.equal(w2.head(), 2)
  assert.equal(w2.apply([E(1, 1, 1, 8, 5)], 1)[0].ok, true)
  assert.equal(w2.apply([E(2, 1, 1, 8, 6)], 1)[0].ok, true)
  assert.deepEqual(w2.since(0).ops.map((o) => o.s), [1, 2, 3, 4])
})

test('a chunk from a newer format is never overwritten', () => {
  const db = memDb()
  db.commit({ chunks: [[0, 0, '{"f":99,"e":[]}']] })
  const w = makeWorld(db)
  assert.equal(w.apply([E(1, 1, 1, 5, 0)], 1)[0].why, 'chunk-locked')
  assert.equal(w.flush(), 0)
  assert.equal(db.getChunk(0, 0), '{"f":99,"e":[]}')
})

test('since(): replay when retained, resync when too old; chunk reply carries its seq', () => {
  const db = memDb()
  const w = makeWorld(db)
  for (let i = 0; i < 5; i++) w.apply([E(i, 0, 0, 1, 0)], 1)
  w.flush()
  assert.equal(w.since(2).ops.length, 3)
  db.commit({ ops: [], keep: 2 })
  assert.equal(w.since(0).resync, true)
  const ch = w.chunk(0, 0)
  assert.equal(ch.s, 5)
  assert.equal(decodeChunk(ch.d).edits.size, 5)
})
