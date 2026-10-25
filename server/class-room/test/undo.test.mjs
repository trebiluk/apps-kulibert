import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { undoPlan, applyUndo } from '../src/world/undo.js'

const E = (x, id, b = 0) => ({ x, y: 0, z: 0, id, b })

test('undo: put back one griefer\'s blocks in a time window, and it is saved and numbered', () => {
  const w = makeWorld(memDb())
  w.apply([E(1, 7)], 1, 1000); w.apply([E(2, 7)], 2, 1500); w.apply([E(1, 9, 7)], 1, 2000)
  const plan = undoPlan(w.log(), { since: 900, until: 2500, who: 1 })
  assert.deepEqual(plan, [{ x: 1, y: 0, z: 0, id: 0 }])
  const r = applyUndo(w, plan)
  assert.equal(r[0].ok, true)
  assert.equal(w.cell(1, 0, 0), 0)
  assert.equal(w.cell(2, 0, 0), 7)                    // the other kid's block is untouched
  assert.equal(w.head(), 4)
})
