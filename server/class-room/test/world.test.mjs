import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
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
