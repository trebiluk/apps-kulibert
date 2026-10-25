import test from 'node:test'
import assert from 'node:assert/strict'
import { makeAlloc } from '../src/world/alloc.js'

test('rooms: fill in order, cap 30, class stays together, returning kid goes home, full world says null', () => {
  const a = makeAlloc('w1')
  const ids = []
  for (let i = 0; i < 70; i++) ids.push(a.assign('k' + i, i < 20 ? 'classA' : undefined))
  assert.deepEqual(a.counts(), [30, 30, 10])
  assert.ok(ids.slice(0, 20).every((x) => x === 'w1-r1'))
  a.leave('k5'); a.leave('k45')
  assert.equal(a.assign('k45'), 'w1-r2')
  assert.equal(a.assign('k5'), 'w1-r1')
  const small = makeAlloc('w2', { cap: 2, maxRooms: 2 })
  for (const k of ['p', 'q', 'r', 's']) small.assign(k)
  assert.equal(small.assign('t'), null)
})

test('rooms: cap holds under random joins and leaves', () => {
  const a = makeAlloc('w3', { cap: 30, maxRooms: 5 })
  let seed = 7
  const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647
  for (let i = 0; i < 4000; i++) {
    const ref = 'k' + Math.floor(rnd() * 200)
    if (rnd() < 0.6) a.assign(ref, 'g' + Math.floor(rnd() * 6)); else a.leave(ref)
    assert.ok(a.counts().every((c) => c <= 30))
  }
})
