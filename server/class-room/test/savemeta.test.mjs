import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { buildAllowed, makeMigrations, health } from '../src/world/savemeta.js'

test('test builds and student builds never share a world', () => {
  assert.equal(buildAllowed(false, 's'), true)
  assert.equal(buildAllowed(false, 't'), false)
  assert.equal(buildAllowed(true, 't'), true)
  assert.equal(buildAllowed(true, 's'), false)
  assert.equal(buildAllowed(false, undefined), true)
})

test('migration: runs only when a tester triggers it, once, keeps the old copy, flag set with the change', () => {
  const db = memDb()
  const w = makeWorld(db)
  w.apply([{ x: 1, y: 1, z: 1, id: 5, b: 0 }], 1); w.flush()
  const old = db.getChunk(0, 0)
  const mig = makeMigrations(db, [{ id: 'm001-bump', map: (s) => s.replace('"f":1', '"f":1,"n":1') }])
  assert.deepEqual(mig.status(), [{ id: 'm001-bump', done: false }])
  assert.equal(db.getChunk(0, 0), old, 'nothing ran by itself')
  assert.deepEqual(mig.run('m001-bump'), { ok: true, changed: 1 })
  assert.equal(db.getMeta('bak:m001-bump:0,0'), old)
  assert.deepEqual(mig.run('m001-bump'), { ok: true, already: true })
  assert.equal(mig.run('nope').why, 'unknown')
  db.fail = true
  const m2 = makeMigrations(db, [{ id: 'm002', map: () => 'x' }])
  assert.throws(() => m2.run('m002'))
  assert.equal(m2.status()[0].done, false)
})

test('health check never writes, and reports bad and newer chunks', () => {
  const db = memDb()
  const w = makeWorld(db)
  w.apply([{ x: 1, y: 1, z: 1, id: 5, b: 0 }], 1); w.flush()
  db.commit({ chunks: [[9, 9, '{"f":99}'], [8, 8, 'junk']] })
  const mig = makeMigrations(db, [{ id: 'm1', map: (s) => s }])
  const guarded = new Proxy(db, { get: (t, k) => (k === 'commit' ? () => { throw new Error('WROTE') } : t[k]) })
  const h = health(guarded, mig)
  assert.deepEqual({ wseq: h.wseq, chunks: h.chunks, corrupt: h.corrupt, newer: h.newer, pend: h.pendingMigrations }, { wseq: 1, chunks: 3, corrupt: 1, newer: 1, pend: ['m1'] })
})
