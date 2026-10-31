// Item transport part 2: oven conversion on the live server (input, fuel, output; 0068 time + catch-up).
//   node --import ./test/shim/register.mjs --test test/oven.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { decodeChunk, locate } from '../src/world/chunks.js'
import { CATCHUP_MS, SIM_MS } from '../src/world/sim.js'
import { FUEL, OVEN_RECIPES, slotFor, OVEN_IN, OVEN_FUEL } from '../src/world/items.js'
import { bake, MAX_BAKES_PER_STEP } from '../src/world/oven.js'

const OVEN = 23, SAND = 6, GLASS = 20, RED_SAND = 19, BRICK = 8, PLANKS = 10, LOG = 11, COAL = 5, APPLE = 500
const A = 7
const T0 = Date.parse('2026-10-31T13:00:00Z')
const SEC = 1000, MIN = 60 * SEC
const X = 1, Y = 64, Z = 1

const txt = (slots) => slots.map((s) => (s ? s.id + 'x' + s.n : '.')).join(' ')

// A world with its own clock and one oven at (1,64,1), registered with the sim at T0.
function oven(db = memDb()) {
  let t = T0
  const world = makeWorld(db, { gen: () => 0, now: () => t })
  world.apply([{ x: X, y: Y, z: Z, id: OVEN, b: 0 }], A)
  world.sim(t)
  return {
    db, world,
    at: (ms) => { t = ms },
    put: (item, n) => world.move(A, X, Y, Z, item, n, 'put', t),
    take: (item, n) => world.move(A, X, Y, Z, item, n, 'take', t),
    sim: (ms) => { t = ms; return world.sim(ms) },
    slots: () => world.inv(X, Y, Z).slots,
  }
}
const rowOf = (world) => {
  const { cx, cz, idx } = locate(X, Y, Z)
  return decodeChunk(world.chunk(cx, cz).d).m.find((r) => r[0] === idx)
}

test('recipes and fuel come from the game data (oven: sand->glass, red sand->brick, 5 s; planks 1, log 4, coal 8)', () => {
  assert.deepEqual(OVEN_RECIPES, { 6: { n: 2, out: 20, k: 1, ms: 5000 }, 19: { n: 2, out: 8, k: 1, ms: 5000 } })
  assert.deepEqual(FUEL, { 10: 1, 11: 4, 5: 8 })
  assert.equal(slotFor(OVEN, COAL), OVEN_FUEL)
  assert.equal(slotFor(OVEN, SAND), OVEN_IN)
  assert.equal(slotFor(OVEN, APPLE), null)
  assert.equal(slotFor(27, APPLE), undefined, 'a box has no slot roles')
})

test('conversion: 2 sand + time + fuel -> 1 glass every 5 s; red sand -> brick; stops when input runs out', () => {
  let r = bake([{ id: SAND, n: 6 }, { id: LOG, n: 1 }, null], {}, 15 * SEC)
  assert.equal(txt(r.slots), '. . 20x3', 'log lit once: 4 bakes of fuel, 3 used')
  assert.deepEqual(r.st, { prog: 0, left: 1 })
  assert.equal(r.bakes, 3)
  r = bake([{ id: SAND, n: 6 }, { id: LOG, n: 1 }, null], {}, 12 * SEC)
  assert.equal(txt(r.slots), '6x2 . 20x2', 'two done, the third is 2 s in')
  assert.deepEqual(r.st, { prog: 2 * SEC, left: 2 })
  assert.equal(r.why, null, 'still running')
  r = bake([{ id: RED_SAND, n: 3 }, { id: COAL, n: 1 }, null], {}, 60 * SEC)
  assert.equal(txt(r.slots), '19x1 . 8x1', 'an odd leftover waits for one more')
  assert.equal(r.why, 'input')
  assert.equal(r.st.left, 7)
  // split time gives the same result as one grant
  let a = bake([{ id: SAND, n: 20 }, { id: PLANKS, n: 10 }, null], {}, 0)
  for (const ms of [3 * SEC, 4 * SEC, 1, 17 * SEC - 1, 9 * SEC]) a = bake(a.slots, a.st, ms)
  const b = bake([{ id: SAND, n: 20 }, { id: PLANKS, n: 10 }, null], {}, 33 * SEC)
  assert.deepEqual([a.slots, a.st], [b.slots, b.st])
})

test('fuel use: planks burn 1 bake, log 4, coal 8; an item is lit only when a bake completes', () => {
  for (const [fuel, bakes] of [[PLANKS, 1], [LOG, 4], [COAL, 8]]) {
    const r = bake([{ id: SAND, n: 64 }, { id: fuel, n: 1 }, null], {}, 10 * MIN)
    assert.equal(r.bakes, bakes, `fuel ${fuel}`)
    assert.equal(r.why, 'fuel')
    assert.equal(r.slots[1], null)
    assert.equal(r.slots[0].n, 64 - 2 * bakes)
  }
  const part = bake([{ id: SAND, n: 2 }, { id: COAL, n: 1 }, null], {}, 4 * SEC)
  assert.equal(txt(part.slots), '6x2 5x1 .', 'a part-done bake has consumed nothing yet')
  const none = bake([{ id: SAND, n: 4 }, null, null], {}, 10 * MIN)
  assert.deepEqual([none.bakes, none.why, none.st.prog], [0, 'fuel', 0], 'no fuel: paused, no time banked')
})

test('fuel left in a burning item is saved with the oven and survives a reload', () => {
  const db = memDb()
  const o = oven(db)
  o.put(COAL, 1); o.put(SAND, 6)
  o.sim(T0 + 15 * SEC)
  assert.equal(txt(o.slots()), '. . 20x3')
  const row = rowOf(o.world)
  assert.equal(row[4], 5, 'coal: 8 bakes, 3 used, 5 left, saved as the 5th field')
  o.world.flush()
  const again = makeWorld(db, { gen: () => 0, now: () => T0 + 15 * SEC })
  again.move(A, X, Y, Z, SAND, 4, 'put', T0 + 15 * SEC)
  again.sim(T0 + 25 * SEC)
  assert.equal(txt(again.inv(X, Y, Z).slots), '. . 20x5', 'two more bakes on the saved fuel, no new fuel item needed')
  assert.equal(rowOf(again)[4], 3)
})

test('a full output pauses the oven with nothing lost, and it resumes after a take', () => {
  let r = bake([{ id: SAND, n: 4 }, { id: COAL, n: 2 }, { id: GLASS, n: 64 }], { prog: 1500 }, 10 * MIN)
  assert.deepEqual([r.bakes, r.why], [0, 'full'])
  assert.equal(txt(r.slots), '6x4 5x2 20x64', 'no input or fuel taken')
  assert.equal(r.st.prog, 1500, 'the part-done bake is kept, the paused time is not banked')
  r = bake([{ id: SAND, n: 4 }, { id: COAL, n: 1 }, { id: BRICK, n: 1 }], {}, 10 * MIN)
  assert.deepEqual([r.bakes, r.why], [0, 'full'], 'output holds another item: paused')
  r = bake([{ id: SAND, n: 64 }, { id: COAL, n: 8 }, { id: GLASS, n: 60 }], {}, 10 * MIN)
  assert.equal(txt(r.slots), '6x56 5x7 20x64', 'fills to 64 exactly, then stops')

  const o = oven()
  o.put(COAL, 8); o.put(SAND, 64)
  o.sim(T0 + 3 * MIN)                                  // 32 bakes need 160 s
  assert.equal(txt(o.slots()), '. 5x4 20x32')
  o.put(SAND, 64)
  o.sim(T0 + 6 * MIN)
  assert.equal(txt(o.slots()), '. . 20x64', 'input used up, output at 64, fuel spent')
  o.at(T0 + 7 * MIN)
  o.put(COAL, 1); o.put(SAND, 2)
  o.sim(T0 + 30 * MIN)
  assert.equal(txt(o.slots()), '6x2 5x1 20x64', 'output full: paused 23 min, nothing consumed')
  o.at(T0 + 31 * MIN)
  assert.equal(o.take(GLASS, 10).moved, 10)
  o.sim(T0 + 31 * MIN + 2 * SEC)
  assert.equal(txt(o.slots()), '6x2 5x1 20x54', 'resumes from zero: the paused 24 min were not paid out')
  o.sim(T0 + 31 * MIN + 5 * SEC)
  assert.equal(txt(o.slots()), '. . 20x55')
})

test('offline catch-up: one 60-min grant after a sleep equals a server that never slept', () => {
  const slept = oven(), awake = oven()
  for (const o of [slept, awake]) { o.put(LOG, 3); o.put(SAND, 40) }
  slept.sim(T0 + 3 * 60 * MIN)                         // 3 h asleep: one step, clamped to 60 min
  for (let ms = SIM_MS; ms <= 3 * 60 * MIN; ms += SIM_MS) awake.sim(T0 + ms)
  assert.equal(txt(slept.slots()), txt(awake.slots()))
  assert.equal(txt(slept.slots()), '6x16 . 20x12', '3 logs = 12 bakes; the rest of the sand waits for fuel')
  const [rs, ra] = [rowOf(slept.world), rowOf(awake.world)]
  assert.deepEqual([rs[2], rs[4]], [ra[2], ra[4]], 'same progress and fuel left')
  assert.deepEqual([rs[2], rs[4]], [0, undefined], 'no part bake, no burning fuel left')

  // the catch-up is the 0068 cap: an oven that would need more than 60 min gets exactly 60 min of work
  assert.equal(CATCHUP_MS / OVEN_RECIPES[SAND].ms, MAX_BAKES_PER_STEP)
  const many = bake([{ id: SAND, n: 64 }, { id: COAL, n: 64 }, null], {}, CATCHUP_MS)
  assert.equal(many.bakes, 32, 'one input stack caps real work far below the 720-bake bound')

  // a part-done bake carries across the sleep
  const p = oven()
  p.put(COAL, 1); p.put(SAND, 4)
  p.sim(T0 + 3 * SEC)
  p.sim(T0 + 2 * 60 * MIN)
  assert.equal(txt(p.slots()), '. . 20x2')
})

test('an oven paused for lack of fuel or input does not bank the time it sat idle', () => {
  const o = oven()
  o.put(SAND, 10)
  o.sim(T0 + 30 * MIN)                                 // no fuel for 30 min
  o.at(T0 + 40 * MIN)                                  // 10 more min with no sim (asleep), then a kid adds coal
  o.put(COAL, 1)
  o.sim(T0 + 40 * MIN + 5 * SEC)
  assert.equal(txt(o.slots()), '6x8 . 20x1', 'exactly one bake for the 5 s since the coal went in')

  const e = oven()
  e.sim(T0 + 50 * MIN)                                 // an empty oven sits for 50 min
  e.at(T0 + 55 * MIN)
  e.put(COAL, 1); e.put(SAND, 64)
  e.sim(T0 + 55 * MIN + 10 * SEC)
  assert.equal(txt(e.slots()), '6x60 . 20x2', 'no credit for the empty time')
  assert.equal(e.slots()[1], null)
})

test('a put goes to its slot or is refused: fuel -> slot 1, inputs -> slot 0, anything else -> slot; output is take-only', () => {
  const o = oven()
  assert.equal(o.put(APPLE, 1).why, 'slot')
  assert.equal(o.put(GLASS, 1).why, 'slot', 'outputs are never put in')
  assert.equal(o.put(BRICK, 1).why, 'slot')
  let r = o.put(COAL, 3)
  assert.deepEqual([r.ok, txt(r.slots)], [true, '. 5x3 .'])
  r = o.put(SAND, 70)
  assert.deepEqual([r.ok, r.moved, txt(r.slots)], [true, 64, '6x64 5x3 .'], 'one stack per slot; the rest comes back')
  assert.equal(o.put(LOG, 1).why, 'full', 'fuel slot holds coal: a log does not mix in')
  assert.equal(o.put(RED_SAND, 2).why, 'full', 'input slot holds sand')
  assert.equal(o.take(SAND, 64).moved, 64)
  assert.equal(o.put(RED_SAND, 2).ok, true, 'once empty, the input slot takes another recipe')
  assert.equal(o.world.move(A, X, Y, Z, PLANKS, 1, 'put', T0).why, 'full')
  assert.equal(o.world.apply([{ x: X, y: Y, z: Z, id: 0, b: OVEN }], A)[0].why, 'not-empty', 'part 1: a full oven cannot be broken')
})

test('the sim fans out a touch op when an oven bakes, and none while it is idle', () => {
  const o = oven()
  o.put(COAL, 1); o.put(SAND, 2)
  const head = o.world.head()
  o.sim(T0 + 2 * SEC)
  assert.equal(o.world.since(head, 50).ops.length, 0, 'mid-bake: nothing to show yet')
  o.sim(T0 + 6 * SEC)
  const ops = o.world.since(head, 50).ops
  assert.equal(ops.length, 1)
  assert.deepEqual([ops[0].x, ops[0].y, ops[0].z, ops[0].b, ops[0].i, ops[0].w], [X, Y, Z, OVEN, OVEN, 0])
  const h2 = o.world.head()
  o.sim(T0 + 20 * SEC)
  assert.equal(o.world.since(h2, 50).ops.length, 0, 'out of input: idle, no ops')
})
