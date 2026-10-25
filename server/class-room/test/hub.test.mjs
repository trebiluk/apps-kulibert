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
