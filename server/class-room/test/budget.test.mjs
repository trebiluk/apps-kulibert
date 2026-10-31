// Lane 4 (2.5.591): high-tick budget and lag budget for placements, decided by the World.
// Area = the chunk and its 8 neighbours (same as lagcost). lagcost runs first; either can refuse.
//   node --import ./test/shim/register.mjs --test test/budget.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { makeHub } from '../src/world/hub.js'
import { HIGH_TICK, HIGH_TICK_MAX, LAG_BUDGET, classOf, decide, weightOf } from '../src/world/budget.js'
import { BUDGET, CLASS_WEIGHT } from '../src/lag/lagcost.js'
import { makeRoom, joinReq, frames, send, timers } from './helpers.mjs'
import { plotRect } from '../src/claims.js'

const BELT = 74, OVEN = 23, STONE = 1, LANTERN = 47, LEVER = 38
const A = 101, B = 202      // actor hashes
const fresh = () => { const db = memDb(); return { db, world: makeWorld(db, { gen: () => 0 }) } }
const place = (world, who, x, z, id, b = 0, y = 64) => world.apply([{ x, y, z, id, b }], who)[0]

test('the decided numbers: belt and oven are high-tick, max 10, lag budget is lagcost\'s 400', () => {
  assert.deepEqual([...HIGH_TICK].sort((a, b) => a - b), [OVEN, BELT])
  assert.equal(HIGH_TICK_MAX, 10)
  assert.equal(LAG_BUDGET, BUDGET)
  assert.equal(classOf(BELT), 'belt')
  assert.equal(classOf(OVEN), 'solid', 'oven class is not guessed for lagcost; the high-tick budget covers it')
  assert.equal(classOf(12345), 'solid')
  assert.equal(weightOf(0), CLASS_WEIGHT.air)
})

test('the 11th high-tick machine in an area is refused with the reason and 10/10', () => {
  const { world } = fresh()
  for (let i = 0; i < 10; i++) {
    const r = place(world, i < 5 ? A : B, i, 0, i % 2 ? OVEN : BELT)
    assert.equal(r.ok, true, 'machine ' + (i + 1))
    assert.deepEqual(r.budget.area, [i + 1, 10])
  }
  const r = place(world, A, 10, 0, BELT)
  assert.deepEqual([r.ok, r.why], [false, 'hightick'])
  assert.deepEqual(r.budget.area, [10, 10])
  assert.deepEqual(r.budget.you, [5, 10])
  assert.equal(world.cell(10, 64, 0), 0, 'nothing placed')
})

test('the area is the chunk plus its 8 neighbours: two chunks away is a new area', () => {
  const { world } = fresh()
  for (let i = 0; i < 10; i++) place(world, i < 5 ? A : B, i, 0, BELT)          // chunk 0,0
  assert.equal(place(world, A, 16 + 3, 0, BELT).ok, false, 'chunk 1,0 shares the area')
  assert.equal(place(world, A, -16 + 3, 16 + 3, BELT).ok, false, 'chunk -1,1 (diagonal) shares the area')
  const far = place(world, A, 32 + 3, 0, BELT)                                   // chunk 2,0: its area is chunks 1..3
  assert.equal(far.ok, true)
  assert.deepEqual(far.budget.area, [1, 10])
})

test('one player can stand at most 10 machines anywhere in the world', () => {
  const { world } = fresh()
  for (let i = 0; i < 10; i++) assert.equal(place(world, A, i * 64, 0, BELT).ok, true)   // ten different areas
  const r = place(world, A, 10 * 64, 0, OVEN)
  assert.deepEqual([r.ok, r.why, r.budget.you], [false, 'hightick', [10, 10]])
  assert.equal(place(world, B, 10 * 64, 0, OVEN).ok, true, 'another player can still build there')
})

test('breaking or replacing a machine frees its place in both budgets; breaking is never refused', () => {
  const { world } = fresh()
  for (let i = 0; i < 10; i++) place(world, A, i, 0, BELT)
  const br = place(world, A, 0, 0, 0, BELT)
  assert.equal(br.ok, true)
  assert.deepEqual([br.budget.area, br.budget.you], [[9, 10], [9, 10]])
  assert.equal(place(world, A, 11, 0, BELT).ok, true)
  assert.equal(place(world, A, 1, 0, STONE, BELT).ok, true, 'replacing a belt with stone is always allowed')
  assert.equal(world.budgetAt(A, 5, 0).area[0], 9)
  assert.equal(place(world, B, 2, 0, 0, BELT).ok, true, 'someone else breaking it frees A\'s budget too')
  assert.deepEqual(world.budgetAt(A, 5, 0).you, [8, 10])
})

test('swapping your own belt for an oven does not count twice', () => {
  const { world } = fresh()
  for (let i = 0; i < 10; i++) place(world, A, i * 64, 0, BELT)
  const r = place(world, A, 0, 0, OVEN, BELT)
  assert.equal(r.ok, true)
  assert.deepEqual(r.budget.you, [10, 10])
})

test('lagcost runs first: a busy area refuses a costly block with \'lag\', even when the high-tick budget has room', () => {
  const { world } = fresh()
  // 133 lanterns = 399 points (light = 3) across the area; one more would pass 400
  let n = 0
  for (let x = 0; x < 16 && n < 133; x++) for (let z = 0; z < 16 && n < 133; z++) { place(world, A, x, z, LANTERN); n++ }
  assert.equal(world.budgetAt(A, 0, 0).lag[0], 399)
  const light = place(world, A, 0, 0, LANTERN, 0, 65)
  assert.deepEqual([light.ok, light.why], [false, 'lag'])
  assert.deepEqual(light.budget.lag, [399, 400])
  const belt = place(world, A, 1, 0, BELT, 0, 65)
  assert.deepEqual([belt.ok, belt.why], [false, 'lag'], 'a belt (4 points) is refused by lag first, not hightick')
  assert.equal(belt.budget.area[0], 0, 'and the high-tick numbers still read 0/10')
  assert.equal(place(world, A, 2, 0, STONE, 0, 65).ok, true, 'plain blocks are never refused by the lag budget')
  assert.equal(place(world, A, 3, 0, 0, LANTERN).ok, true, 'breaking a light is never refused')
  const lever = place(world, A, 3, 0, LEVER, 0)
  assert.deepEqual([lever.ok, lever.why], [false, 'lag'], 'a lever (5) does not fit in the 3 points freed: 396 + 5 = 401')
  assert.equal(place(world, A, 3, 0, LANTERN, 0).ok, true, 'a lantern (3) does: 396 + 3 = 399')
})

test('budgets survive a restart: placer list and counts come back from the save', () => {
  const { db, world } = fresh()
  for (let i = 0; i < 10; i++) place(world, A, i * 64, 0, BELT)
  world.flush()
  const again = makeWorld(db, { gen: () => 0 })
  const r = again.apply([{ x: 700, y: 64, z: 0, id: BELT, b: 0 }], A)[0]
  assert.deepEqual([r.ok, r.why, r.budget.you], [false, 'hightick', [10, 10]])
})

test('existing saves load: machines placed before the budget count for their area, not for a player', () => {
  const { db, world } = fresh()
  for (let i = 0; i < 10; i++) place(world, A, i, 0, BELT)
  world.flush()
  db.commit({ meta: { htown: '{}' } })      // as if saved before this feature
  const old = makeWorld(db, { gen: () => 0 })
  assert.deepEqual(old.budgetAt(A, 0, 0), { area: [10, 10], you: [0, 10], lag: [40, 400] })
  assert.equal(old.apply([{ x: 11, y: 64, z: 0, id: BELT, b: 0 }], A)[0].why, 'hightick')
  assert.equal(old.apply([{ x: 64 * 3, y: 64, z: 0, id: BELT, b: 0 }], A)[0].ok, true)
})

test('decide() alone: break always ok; numbers are after the placement on success, before it on refusal', () => {
  assert.equal(decide({ near: { lag: 999, ht: 99 }, mine: 99, cur: BELT, id: 0 }).ok, true)
  const ok = decide({ near: { lag: 0, ht: 2 }, mine: 1, cur: 0, id: BELT })
  assert.deepEqual(ok.budget, { area: [3, 10], you: [2, 10], lag: [4, 400] })
  const no = decide({ near: { lag: 0, ht: 10 }, mine: 1, cur: 0, id: OVEN })
  assert.deepEqual([no.ok, no.why, no.budget.area], [false, 'hightick', [10, 10]])
})

// Through a REAL Room: the kid gets the World's reason and numbers; nothing is decided in the room.
test('room relays the World\'s numbers: {t:"bud"} after a machine, {t:"no", c:"hightick", bud} on the 11th', async (t) => {
  timers(t)
  const rooms = new Map()
  const hub = makeHub({ db: memDb(), send: async (name, msg) => (rooms.has(name) ? rooms.get(name).deliver(msg) : false), gen: () => 0 })
  const stub = {
    assign: async (a) => hub.assign(a), edit: async (a, b) => hub.edit(a, b), link: async (id) => hub.link(id),
    unlink: async (id) => hub.unlink(id), touch: async (id) => hub.touch(id), left: async (r) => hub.left(r),
    chunk: async (x, z) => hub.chunk(x, z), since: async (s, n) => hub.since(s, n), setLocked: async (on) => hub.setLocked(on),
  }
  const env = { WORLDS: { idFromName: (n) => n, get: () => stub } }
  const enter = async (ref, role = 'kid') => {
    const a = await stub.assign({ world: 'world-0001', ref, role, bld: 's', cfg: 'contest' })
    if (!rooms.has(a.room)) rooms.set(a.room, makeRoom({ open: false, env }).room)
    const room = rooms.get(a.room)
    const res = await room.fetch(joinReq(ref, 'Alias ' + ref.slice(-4), { 'x-bt-role': role, 'x-bt-cfg': 'contest', 'x-bt-world': 'world-0001', 'x-bt-rid': a.room }))
    await new Promise((r) => setImmediate(r))
    return { room, plot: a.plot, q: 0, sock: res.webSocket.server }
  }
  await enter('staffref-001', 'teacher')
  const k = await enter('kidref-0001')
  const r = plotRect(k.plot)
  await send(k.room, k, { v: 0, t: 'p', q: k.q++, x: r.x0 + 3, y: 64, z: r.z0 + 3, r: 0, f: 0 })
  const cells = []
  for (let dx = 1; dx <= 4; dx++) for (let dz = 1; dz <= 3; dz++) cells.push({ x: r.x0 + dx, y: 64, z: r.z0 + dz })
  for (let i = 0; i < 11; i++) {
    t.mock.timers.tick(200)                                   // stay under the contest edit rate
    await send(k.room, k, { v: 0, t: 'b', ...cells[i], id: BELT, b: 0 })
    await new Promise((res) => setImmediate(res))
  }
  const bud = frames(k.sock).filter((f) => f.t === 'bud')
  assert.equal(bud.length, 10)
  assert.deepEqual(bud.at(-1), { t: 'bud', area: [10, 10], you: [10, 10], lag: [40, 400] })
  const no = frames(k.sock).filter((f) => f.t === 'no').at(-1)
  assert.equal(no.c, 'hightick')
  assert.deepEqual(no.bud.area, [10, 10])
  assert.equal(hub.world.cell(cells[10].x, 64, cells[10].z), 0)
})
