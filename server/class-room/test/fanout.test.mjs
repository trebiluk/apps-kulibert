import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { makeFanout, makeInbox } from '../src/world/fanout.js'

const E = (x, id, b = 0) => ({ x, y: 0, z: 0, id, b })

test('three rooms see the same edits in the same order, even with a flaky link and repeats', async () => {
  const w = makeWorld(memDb())
  const rooms = { a: makeInbox(), b: makeInbox(), c: makeInbox() }
  const seen = { a: [], b: [], c: [] }
  let n = 0
  const send = async (id, msg) => {
    n++
    if (id === 'b' && n % 3 === 0) return false                  // b misses some pushes
    const r = rooms[id].push(msg)
    seen[id].push(...r.fresh.map((o) => o.s))
    if (id === 'c') seen.c.push(...rooms.c.push(msg).fresh.map((o) => o.s))   // c is delivered twice
    return !r.gap
  }
  const f = makeFanout(w, send)
  for (const id of ['a', 'b', 'c']) f.link(id, 0)
  for (let i = 0; i < 30; i++) { w.apply([E(i, 1)], 1); if (i % 4 === 0) await f.tick(i) }
  for (let k = 0; k < 6; k++) await f.tick(100)
  const want = Array.from({ length: 30 }, (_, i) => i + 1)
  assert.deepEqual(seen.a, want)
  assert.deepEqual(seen.b, want)
  assert.deepEqual(seen.c, want)
})

test('a room that went silent is dropped; one that is too far behind is told to resync', async () => {
  const db = memDb()
  const w = makeWorld(db)
  const got = []
  const f = makeFanout(w, async (id, m) => { got.push([id, !!m.resync]); return true }, { deadMs: 1000 })
  f.link('x', 0); f.link('y', 0)
  w.apply([E(1, 1)], 1)
  f.touch('x', 900)
  await f.tick(1500)
  assert.deepEqual(f.linked(), ['x'])
  w.apply([E(2, 1)], 1); w.apply([E(3, 1)], 1); w.flush()
  db.commit({ ops: [], keep: 1 })
  const slow = makeFanout(w, async (id, m) => { got.push([id, !!m.resync]); return true })
  slow.link('z', 0)
  w.apply([E(4, 1)], 1); w.apply([E(5, 1)], 1); w.apply([E(6, 1)], 1); w.flush()
  db.commit({ ops: [], keep: 1 })
  await slow.tick(1)
  assert.deepEqual(got.filter((g) => g[0] === 'z'), [['z', true]])
  const lone = makeInbox(0)
  assert.equal(lone.push({ from: 5, ops: [] }).gap, true)
})
