// P4: world sim (day clock, ovens, belts), catch-up after sleep, the shared alarm plan, 7-day history.
// Pure node: memDb + the real world/hub; the World object is driven through a fake ctx.
//   node --import ./test/shim/register.mjs --test test/sim.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeHub } from '../src/world/hub.js'
import { makeWorld } from '../src/world/world.js'
import { decodeChunk, locate } from '../src/world/chunks.js'
import { BELT_MS, BELT_SLOTS, CATCHUP_MS, OVEN_MS, SIM_MS, STEP_CHUNKS, grant, stateOf, stepChunk } from '../src/world/sim.js'
import { HISTORY_MS, makeHistory } from '../src/editlog.js'
import { PURGE_MS, SAVE_MS, TICK_MS, World, plan } from '../src/world-do.js'

const OVEN = 23, BELT = 74, STONE = 1
const T0 = Date.parse('2026-10-31T13:00:00Z')
const MIN = 60_000, HOUR = 60 * MIN, DAY = 24 * HOUR

function fresh(gen) {
  const db = memDb()
  return { db, world: makeWorld(db, { gen: gen ?? (() => 0) }) }
}
const put = (world, x, y, z, id, t = T0, who = 7) => world.apply([{ x, y, z, id, b: 0 }], who, t)[0]
const chunkOf = (world, cx, cz) => decodeChunk(world.chunk(cx, cz).d)
const machine = (world, x, y, z) => { const { cx, cz, idx } = locate(x, y, z); return chunkOf(world, cx, cz).m.find((r) => r[0] === idx) }

test('tick is 15/s and the other constants are the decided ones', () => {
  assert.equal(TICK_MS, 67)
  assert.equal(SIM_MS, 7500)
  assert.equal(CATCHUP_MS, 60 * MIN)
  assert.equal(STEP_CHUNKS, 64)
  assert.equal(HISTORY_MS, 7 * DAY)
})

test('sim advances the day clock by elapsed time, nothing before the first step', () => {
  const { world } = fresh()
  assert.equal(world.clock(), 0)
  world.sim(T0)
  assert.equal(world.clock(), 0, 'first step only starts the clock')
  world.sim(T0 + 7500)
  world.sim(T0 + 15000)
  assert.equal(world.clock(), 15000)
})

test('ovens and belts advance only in chunks that hold a machine; plain chunks are untouched', () => {
  const { world, db } = fresh()
  put(world, 1, 64, 1, OVEN)      // chunk 0,0
  put(world, 20, 64, 1, BELT)     // chunk 1,0
  put(world, 40, 64, 1, STONE)    // chunk 2,0: no machine
  world.sim(T0)
  const head = world.head()
  world.sim(T0 + OVEN_MS)         // one bake, 20 belt steps
  assert.equal(world.machineChunks(), 2)
  world.flush()
  const oven = machine(world, 1, 64, 1)
  assert.ok(oven, 'oven row saved in its chunk')
  assert.deepEqual(stateOf(OVEN, oven[2]), { done: 1 })
  const belt = chunkOf(world, 1, 0).m[0]
  assert.deepEqual(stateOf(BELT, belt[2]), { step: 20 % BELT_SLOTS })
  assert.deepEqual(chunkOf(world, 2, 0).m, [], 'no machine rows in a plain chunk')
  const ops = world.since(head, 50).ops
  assert.equal(ops.length, 2, 'one touch op per changed machine')
  for (const o of ops) assert.equal(o.b, o.i, 'a touch op leaves the block as it is')
  assert.ok(ops.every((o) => o.w === 0), 'touch ops are system ops')
  assert.equal(db.getMeta('mindex'), JSON.stringify(['0,0', '1,0']))
})

test('a machine that is broken leaves the index and its row; one placed later starts at zero', () => {
  const { world } = fresh()
  put(world, 1, 64, 1, OVEN)
  world.sim(T0)
  world.sim(T0 + OVEN_MS)
  world.apply([{ x: 1, y: 64, z: 1, id: 0, b: OVEN }], 7, T0 + OVEN_MS)
  assert.equal(world.machineChunks(), 0)
  world.sim(T0 + 2 * OVEN_MS)
  world.flush()
  assert.deepEqual(chunkOf(world, 0, 0).m, [])
  put(world, 1, 64, 1, OVEN, T0 + 2 * OVEN_MS)
  world.sim(T0 + 2 * OVEN_MS + 1)
  assert.deepEqual(stateOf(OVEN, machine(world, 1, 64, 1) ? machine(world, 1, 64, 1)[2] : 0), { done: 0 })
})

test('catch-up after a sleep is capped at 60 minutes of world time, for the clock and for every machine', () => {
  const { world } = fresh()
  put(world, 1, 64, 1, OVEN)
  world.sim(T0)
  world.sim(T0 + 3 * DAY)        // three days idle, then someone links
  assert.equal(world.clock(), CATCHUP_MS)
  world.flush()
  assert.deepEqual(stateOf(OVEN, machine(world, 1, 64, 1)[2]), { done: CATCHUP_MS / OVEN_MS })
  assert.equal(grant(0, 10, 60), 10)
  assert.equal(grant(0, 100, 60), 60)
  assert.equal(grant(100, 10, 60), 0, 'a clock that went backwards grants nothing')
})

test('a catch-up equals a never-slept run (within the cap): same clock, same oven and belt states', () => {
  const slept = fresh(), awake = fresh()
  for (const w of [slept.world, awake.world]) { put(w, 1, 64, 1, OVEN); put(w, 3, 64, 1, BELT); w.sim(T0) }
  // 40 minutes: the awake world steps every 7.5 s; the slept world does one catch-up
  const end = T0 + 40 * MIN
  for (let t = T0 + SIM_MS; t <= end; t += SIM_MS) awake.world.sim(t)
  awake.world.sim(end)
  slept.world.sim(end)
  for (const w of [slept.world, awake.world]) w.flush()
  assert.equal(slept.world.clock(), awake.world.clock())
  const s = chunkOf(slept.world, 0, 0).m, a = chunkOf(awake.world, 0, 0).m
  assert.deepEqual(s.map((r) => [r[0], r[1], stateOf(r[1], r[2])]), a.map((r) => [r[0], r[1], stateOf(r[1], r[2])]))
  assert.deepEqual(stateOf(OVEN, s[0][2]), { done: 120 })
  assert.deepEqual(stateOf(BELT, s[1][2]), { step: (40 * MIN / BELT_MS) % BELT_SLOTS })
})

test('a step handles at most 64 machine chunks, round robin; each chunk advances by its own elapsed time', () => {
  const { world } = fresh()
  for (let i = 0; i < 70; i++) put(world, i * 16 + 1, 64, 1, OVEN, T0, 1000 + i)   // 70 chunks, one kid each (2.5.591 caps 10 machines per kid)
  assert.equal(world.sim(T0).chunks, 64)              // starts chunks 0..63
  world.flush()
  assert.equal(chunkOf(world, 69, 0).m.length, 0, 'chunk 69 not reached in the first round')
  assert.equal(world.sim(T0 + OVEN_MS).chunks, 64)    // 64..69 start, 0..57 get one bake
  assert.equal(world.sim(T0 + 2 * OVEN_MS).chunks, 64) // 58..69 and 0..51
  world.flush()
  assert.deepEqual(stateOf(OVEN, machine(world, 1, 64, 1)[2]), { done: 2 }, 'chunk 0: stepped at T0, +1, +2')
  assert.deepEqual(stateOf(OVEN, machine(world, 58 * 16 + 1, 64, 1)[2]), { done: 2 }, 'chunk 58: started at T0, next seen at +2, granted both bakes')
  assert.deepEqual(stateOf(OVEN, machine(world, 69 * 16 + 1, 64, 1)[2]), { done: 1 }, 'chunk 69: started at +1, seen at +2')
})

test('an older world without an index gets one built from its chunks on first use', () => {
  const a = fresh()
  put(a.world, 1, 64, 1, OVEN)
  a.world.flush()
  const db = a.db
  db.commit({ meta: { mindex: '' } })        // pretend the key never existed
  db.getMeta = ((orig) => (k) => (k === 'mindex' ? null : orig(k)))(db.getMeta)
  const world = makeWorld(db, { gen: () => 0 })
  assert.equal(world.machineChunks(), 1)
})

test('sim results reach rooms through the fan-out like any edit', async () => {
  const sent = []
  const hub = makeHub({ db: memDb(), send: async (id, msg) => { sent.push([id, msg]); return true }, gen: () => 0 })
  hub.link('room-a')
  hub.world.apply([{ x: 1, y: 64, z: 1, id: OVEN, b: 0 }], 7, T0)
  await hub.fan.tick(T0)
  hub.sim(T0)
  hub.sim(T0 + OVEN_MS)
  await hub.fan.tick(T0 + OVEN_MS)
  const ops = sent.flatMap(([, m]) => m.ops || [])
  // the kid's edit, then a touch when the machine starts counting, then a touch when a bake is done
  assert.deepEqual(ops.map((o) => [o.x, o.y, o.z, o.i, o.w]), [[1, 64, 1, OVEN, 7], [1, 64, 1, OVEN, 0], [1, 64, 1, OVEN, 0]])
})

test('7-day history: every edit has a row, rows older than 7 days are purged, newer ones stay', () => {
  const { world, db } = fresh()
  const history = makeHistory(db)
  put(world, 1, 64, 1, STONE, T0 - 8 * DAY)
  put(world, 2, 64, 1, STONE, T0 - 6 * DAY)
  put(world, 3, 64, 1, STONE, T0)
  world.flush()
  const rows = history.rows(0)
  assert.equal(rows.length, 3)
  assert.deepEqual(Object.keys(rows[0]).sort(), ['b', 'i', 's', 't', 'w', 'x', 'y', 'z'])
  assert.equal(rows[0].w, 7, 'actor is the hash the world already uses, never a ref')
  assert.equal(history.purge(T0), 1)
  assert.deepEqual(history.rows(0).map((r) => r.x), [2, 3])
})

test('alarm plan: earliest due wins; sim only while players are on; nobody on means no sim alarm', () => {
  const now = T0
  let p = plan(now, { save: now + SAVE_MS, sim: now + SIM_MS, purge: now + PURGE_MS }, true)
  assert.deepEqual(p.run, { save: false, sim: false, purge: false })
  assert.equal(p.at, now + SAVE_MS)
  p = plan(now + SAVE_MS, { save: now + SAVE_MS, sim: now + SIM_MS, purge: now + PURGE_MS }, true)
  assert.deepEqual(p.run, { save: true, sim: false, purge: false })
  assert.equal(p.next.save, null)
  assert.equal(p.at, now + SIM_MS)
  p = plan(now + SIM_MS, { save: null, sim: now + SIM_MS, purge: now + PURGE_MS }, true)
  assert.equal(p.run.sim, true)
  assert.equal(p.next.sim, now + 2 * SIM_MS, 'sim re-arms itself while players are on')
  p = plan(now + SIM_MS, { save: null, sim: now + SIM_MS, purge: now + PURGE_MS }, false)
  assert.equal(p.run.sim, false)
  assert.equal(p.next.sim, null, 'nobody on: the sim is not run and not re-armed')
  assert.equal(p.at, now + PURGE_MS, 'only the daily purge stays')
  p = plan(now, { save: null, sim: null, purge: null }, false)
  assert.equal(p.at, null)
})

// The World object on a fake ctx: the real link/alarm/unlink path, nothing mocked but storage and time.
function fakeWorld(t0) {
  let now = t0
  const realNow = Date.now
  Date.now = () => now
  const sql = { exec() { return { toArray: () => [], [Symbol.iterator]: function* () {} } } }
  const ctx = { storage: { sql, alarm: null, transactionSync: (f) => f(), getAlarm: async () => ctx.storage.alarm, setAlarm: async (at) => { ctx.storage.alarm = at } } }
  const w = new World(ctx, { ROOMS: { idFromName: (n) => n, get: () => ({ deliver: async () => true }) } })
  // swap the unusable sql db for memDb-backed hub pieces
  const db = memDb()
  w.hub = makeHub({ db, send: async () => true, gen: () => 0 })
  w.history = makeHistory(db)
  return { w, ctx, db, tick: (ms) => { now += ms }, restore: () => { clearInterval(w.timer); w.timer = null; Date.now = realNow } }
}

test('World object: link on a cold world runs one catch-up, arms the sim; alarm runs sim+save; unlink stops the sim', async () => {
  const { w, ctx, tick, restore } = fakeWorld(T0)
  try {
    assert.equal(ctx.storage.alarm, null, 'a sleeping world holds no alarm')
    await w.link('room-a')
    assert.equal(w.hub.simAt(), T0, 'catch-up step ran on wake')
    assert.equal(ctx.storage.alarm, T0 + SIM_MS, 'sim armed')
    w.hub.world.apply([{ x: 1, y: 64, z: 1, id: OVEN, b: 0 }], 7, T0)
    await w.save()
    assert.equal(ctx.storage.alarm, T0 + SAVE_MS, 'save is sooner, so the slot moves earlier')
    tick(SAVE_MS); ctx.storage.alarm = null
    await w.alarm()
    assert.equal(ctx.storage.alarm, T0 + SIM_MS, 'after the save the sim is next')
    tick(SIM_MS - SAVE_MS); ctx.storage.alarm = null
    await w.alarm()
    assert.equal(w.hub.simAt(), T0 + SIM_MS, 'sim ran')
    assert.equal(ctx.storage.alarm, T0 + 2 * SIM_MS)
    w.unlink('room-a')
    clearInterval(w.timer); w.timer = null
    tick(SIM_MS); ctx.storage.alarm = null
    await w.alarm()
    assert.equal(w.hub.simAt(), T0 + SIM_MS, 'nobody on: no sim step')
    assert.equal(ctx.storage.alarm, T0 + PURGE_MS, 'only the daily purge remains armed')
  } finally { restore() }
})

test('World object: a kid joining mid-period sees the correct world after a sleep (catch-up matches a never-slept run)', async () => {
  const a = fakeWorld(T0)
  try {
    await a.w.link('room-a')
    a.w.hub.world.apply([{ x: 1, y: 64, z: 1, id: OVEN, b: 0 }], 7, T0)
    a.w.hub.sim(T0)
    a.w.unlink('room-a'); clearInterval(a.w.timer); a.w.timer = null
    a.tick(25 * MIN)
    await a.w.link('room-b')                        // wake 25 minutes later
    const row = chunkOf(a.w.hub.world, 0, 0).m[0]
    assert.deepEqual(stateOf(OVEN, row[2]), { done: 25 * MIN / OVEN_MS })
    assert.equal(a.w.hub.clock(), 25 * MIN)
  } finally { clearInterval(a.w.timer); a.w.timer = null; a.restore() }
})
