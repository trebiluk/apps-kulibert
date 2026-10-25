import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeHub } from '../src/world/hub.js'
import { plotRect } from '../src/claims.js'

const A = (o) => ({ world: 'world-0001', ref: 'kidref-0001', grp: 'class-6a', role: 'kid', bld: 's', cfg: 'contest', ...o })
const T = (o) => A({ ref: 'staffref-001', role: 'teacher', ...o })
const mk = () => { const db = memDb(); return { db, hub: makeHub({ db, send: async () => true }) } }

test('hub: closed until staff open it; wrong config or wrong build refused; teacher closes the whole world', () => {
  const { hub } = mk()
  assert.deepEqual(hub.assign(A()), { err: 'closed' })
  assert.equal(hub.assign(T()).room, 'world-0001-r1')
  assert.equal(hub.assign(A()).room, 'world-0001-r1')
  assert.deepEqual(hub.assign(A({ ref: 'kidref-0002', cfg: 'game' })), { err: 'config' })
  assert.deepEqual(hub.assign(A({ ref: 'kidref-0003', bld: 't' })), { err: 'build' })
  hub.setLocked(true)
  assert.deepEqual(hub.assign(A({ ref: 'kidref-0004' })), { err: 'closed' })
  assert.equal(hub.assign(T({ ref: 'staffref-002' })).room, 'world-0001-r1')   // staff still get in
  assert.deepEqual(hub.assign(A({ ref: 'kidref-0004' })), { err: 'closed' })      // and staff joining does not reopen a closed world
  hub.setLocked(false)
  assert.equal(hub.assign(A({ ref: 'kidref-0004' })).room, 'world-0001-r1')
})

test('hub: a test build and a student build never share a world; a world remembers its config after a restart', () => {
  const db = memDb()
  const h1 = makeHub({ db, send: async () => true })
  h1.assign(T({ bld: 't' }))
  assert.deepEqual(h1.assign(T({ ref: 'staffref-009', bld: 's' })), { err: 'build' })
  const h2 = makeHub({ db, send: async () => true })                    // restart
  assert.deepEqual(h2.assign(A({ ref: 'kidref-0005', bld: 't' })), { err: 'closed' })   // closed until staff are back
  assert.equal(h2.assign(T({ bld: 't' })).room, 'world-0001-r1')
  assert.deepEqual(h2.assign(A({ ref: 'kidref-0006', cfg: 'game', bld: 't' })), { err: 'config' })
})

test('hub: 70 kids over several rooms share ONE world; a world with no free seat says full', () => {
  const { hub } = mk()
  hub.assign(T())
  const rooms = new Set()
  for (let i = 0; i < 70; i++) rooms.add(hub.assign(A({ ref: 'kidref-' + String(1000 + i) })).room)
  assert.deepEqual([...rooms].sort(), ['world-0001-r1', 'world-0001-r2', 'world-0001-r3'])
  for (let i = 70; i < 360; i++) hub.assign(A({ ref: 'kidref-' + String(1000 + i) }))
  assert.deepEqual(hub.assign(A({ ref: 'kidref-9999' })), { err: 'full' })
})

test('hub: edits go through plots, then the one writer; stale and undecided-config edits are refused', () => {
  const { hub } = mk()
  hub.assign(T())
  const a = hub.assign(A()), b = hub.assign(A({ ref: 'kidref-0002' }))
  const mine = plotRect(a.plot), yours = plotRect(b.plot)
  const kid = { ref: 'kidref-0001', staff: false }
  const e = (r, id, bb = 0) => ({ x: r.x0 + 2, y: 64, z: r.z0 + 2, id, b: bb })
  assert.equal(hub.edit(kid, [e(mine, 5)])[0].ok, true)
  assert.equal(hub.edit(kid, [e(yours, 5)])[0].why, 'not-yours')
  assert.equal(hub.world.cell(yours.x0 + 2, 64, yours.z0 + 2), undefined)   // refused means not written
  assert.equal(hub.edit(kid, [e(mine, 6, 0)])[0].why, 'stale')            // thought it was still air
  assert.equal(hub.edit({ ref: 'staffref-001', staff: true }, [e(mine, 0, 5)])[0].ok, true)   // staff repair
  const d = mk().hub                                                       // a config with no edit policy
  d.assign(T({ cfg: 'period' }))
  assert.equal(d.assign(A({ cfg: 'period' })).plot, null)
  assert.equal(d.edit(kid, [e(mine, 5)])[0].why, 'no-policy')
  assert.equal(d.world.cell(mine.x0 + 2, 64, mine.z0 + 2), undefined)
  assert.equal(hub.edit(kid, [null, { x: 1 }])[0].why, 'shape')
})

test('hub: teacher undo puts back one kid\'s blocks and the change is numbered like any edit', () => {
  const { hub } = mk()
  hub.assign(T())
  const a = hub.assign(A()), r = plotRect(a.plot)
  const kid = { ref: 'kidref-0001', staff: false }
  hub.edit(kid, [{ x: r.x0, y: 64, z: r.z0, id: 7, b: 0 }], 1000)
  hub.edit(kid, [{ x: r.x0 + 1, y: 64, z: r.z0, id: 7, b: 0 }], 1100)
  const before = hub.world.head()
  const res = hub.undo({ since: 900, until: 2000, who: hub.who('kidref-0001') })
  assert.deepEqual(res.map((x) => x.ok), [true, true])
  assert.equal(hub.world.cell(r.x0, 64, r.z0), 0)
  assert.equal(hub.world.head(), before + 2)
})
