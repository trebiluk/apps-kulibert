// Item transport part 1: items in containers (box 27, oven 23) on the live server.
//   node --import ./test/shim/register.mjs --test test/items.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { memDb } from '../src/world/memdb.js'
import { makeWorld } from '../src/world/world.js'
import { makeHub } from '../src/world/hub.js'
import { decodeChunk, encodeChunk, locate } from '../src/world/chunks.js'
import { STACK, CONTAINERS, put, take, count, encodeItems, decodeItems, emptySlots } from '../src/world/items.js'
import { parseFrame2 } from '../src/world/protocol2.js'
import { makeRoom, joinReq, frames, send, timers } from './helpers.mjs'
import { plotRect } from '../src/claims.js'

const BOX = 27, OVEN = 23, STONE = 1, APPLE = 500, LOG = 501
const A = 7
const fresh = () => { const db = memDb(); return { db, world: makeWorld(db, { gen: () => 0 }) } }
const slotsText = (slots) => slots.map((s) => (s ? s.id + 'x' + s.n : '.')).join(' ')

test('slot model: 64-stacks, top up first, nothing destroyed', () => {
  assert.equal(STACK, 64)
  assert.deepEqual(CONTAINERS, { 27: 18, 23: 3 })
  let s = emptySlots(OVEN)
  let r = put(s, APPLE, 70)
  assert.equal(slotsText(r.slots), '500x64 500x6 .')
  assert.equal(r.left, 0)
  r = put(r.slots, APPLE, 200)
  assert.equal(slotsText(r.slots), '500x64 500x64 500x64')
  assert.equal(r.left, 200 - 58 - 64, 'what did not fit comes back')
  r = put(r.slots, LOG, 1)
  assert.equal(r.left, 1, 'full: nothing placed')
  const t = take(r.slots, APPLE, 100)
  assert.equal(t.got, 100)
  assert.equal(count(t.slots, APPLE), 192 - 100)
  assert.equal(take(t.slots, LOG, 5).got, 0)
  assert.equal(put(s, APPLE, 1).slots !== s, true, 'pure: input untouched')
  assert.equal(slotsText(s), '. . .')
})

test('save field i round-trips; empty cells and non-containers write no row; older chunks load empty', () => {
  const items = new Map([[5, [{ id: APPLE, n: 3 }, null, { id: LOG, n: 64 }]], [9, [null, null, null]]])
  const rows = encodeItems(items)
  assert.deepEqual(rows, [[5, [[0, APPLE, 3], [2, LOG, 64]]]])
  const back = decodeItems(rows, (idx) => (idx === 5 ? OVEN : 0))
  assert.equal(slotsText(back.get(5)), '500x3 . 501x64')
  assert.equal(decodeItems(rows, () => STONE).size, 0, 'a row for a cell that is no longer a container is dropped')
  assert.equal(decodeItems([[5, [[7, APPLE, 3]]], [5, [[0, 0, 3]]], [5, [[1, APPLE, 99]]], 'junk'], () => OVEN).size, 0, 'bad slots, ids and counts are dropped, never thrown')
  const str = encodeChunk(new Map([[5, OVEN]]), [], rows)
  assert.deepEqual(JSON.parse(str).i, rows)
  const old = encodeChunk(new Map([[5, OVEN]]))
  assert.equal('i' in JSON.parse(old), false, 'no items, no field')
  assert.deepEqual(decodeChunk(old).i, [], 'older chunk: no items')
  assert.deepEqual(decodeChunk('{"f":1,"e":[[5,27]]}').i, [])
})

test('world: put, take, inv; a change fans out as a touch op; the server copy is what the next load sees', () => {
  const { db, world } = fresh()
  world.apply([{ x: 1, y: 64, z: 1, id: BOX, b: 0 }], A)
  const head = world.head()
  let r = world.move(A, 1, 64, 1, APPLE, 70, 'put')
  assert.deepEqual([r.ok, r.moved], [true, 70])
  assert.equal(slotsText(r.slots).startsWith('500x64 500x6 .'), true)
  r = world.move(A, 1, 64, 1, APPLE, 10, 'take')
  assert.deepEqual([r.ok, r.moved, count(r.slots, APPLE)], [true, 10, 60])
  assert.equal(world.inv(1, 64, 1).slots[0].n, 60)
  const ops = world.since(head, 10).ops
  assert.equal(ops.length, 2)
  assert.ok(ops.every((o) => o.b === BOX && o.i === BOX && o.w === A), 'touch ops: same block in and out')
  world.flush()
  const again = makeWorld(db, { gen: () => 0 })
  assert.equal(count(again.inv(1, 64, 1).slots, APPLE), 60, 'saved per chunk')
  const { cx, cz } = locate(1, 64, 1)
  assert.deepEqual(decodeChunk(db.getChunk(cx, cz)).i.length, 1)
})

test('world: refusals write nothing: not a container, full, none to take, bad item or count', () => {
  const { world } = fresh()
  world.apply([{ x: 1, y: 64, z: 1, id: OVEN, b: 0 }, { x: 2, y: 64, z: 1, id: STONE, b: 0 }], A)
  const head = world.head()
  assert.equal(world.move(A, 2, 64, 1, APPLE, 1, 'put').why, 'container')
  assert.equal(world.move(A, 3, 64, 1, APPLE, 1, 'put').why, 'container', 'air')
  assert.equal(world.move(A, 1, 64, 1, APPLE, 1, 'take').why, 'none')
  world.move(A, 1, 64, 1, APPLE, 64, 'put'); world.move(A, 1, 64, 1, APPLE, 64, 'put'); world.move(A, 1, 64, 1, APPLE, 64, 'put')
  const full = world.move(A, 1, 64, 1, LOG, 1, 'put')
  assert.deepEqual([full.ok, full.why], [false, 'full'])
  assert.equal(world.move(A, 1, 64, 1, 0, 1, 'put').why, 'shape')
  assert.equal(world.move(A, 1, 64, 1, APPLE, 64 * 18 + 1, 'put').why, 'shape')
  assert.equal(world.move(A, 1, 64, 1, APPLE, 0, 'put').why, 'shape')
  assert.equal(world.since(head, 10).ops.length, 3, 'only the three puts moved anything')
})

test('rule (Diego, Oct 31): a player break of a full container drops 80% per stack, rounded; the rest is lost', () => {
  const { world } = fresh()
  world.apply([{ x: 1, y: 64, z: 1, id: BOX, b: 0 }], A)
  world.move(A, 1, 64, 1, APPLE, 64 + 3, 'put')
  world.move(A, 1, 64, 1, LOG, 1, 'put')
  const r = world.apply([{ x: 1, y: 64, z: 1, id: 0, b: BOX }], A, undefined, { drops: true })[0]
  assert.equal(r.ok, true)
  assert.deepEqual(r.drops, [{ id: APPLE, n: 51 }, { id: APPLE, n: 2 }, { id: LOG, n: 1 }], '64 -> 51, 3 -> 2, 1 -> 1')
  assert.equal(world.inv(1, 64, 1).error, 'container')
  assert.equal(world.cell(1, 64, 1), 0)
  // a wrench / replace is the same rule
  world.apply([{ x: 2, y: 64, z: 1, id: BOX, b: 0 }], A)
  world.move(A, 2, 64, 1, APPLE, 10, 'put')
  const w = world.apply([{ x: 2, y: 64, z: 1, id: STONE, b: BOX }], A, undefined, { drops: true })[0]
  assert.deepEqual(w.drops, [{ id: APPLE, n: 8 }])
  // an empty container breaks normally, with no drops
  world.apply([{ x: 3, y: 64, z: 1, id: OVEN, b: 0 }], A)
  const e = world.apply([{ x: 3, y: 64, z: 1, id: 0, b: OVEN }], A, undefined, { drops: true })[0]
  assert.deepEqual(e, { ok: true, s: e.s })
})

test('rule: no duplication: the items leave the world with the break, once; a repeat, a re-place, a reload or an undo gets nothing', () => {
  const { world, db } = fresh()
  world.apply([{ x: 1, y: 64, z: 1, id: BOX, b: 0 }], A)
  world.move(A, 1, 64, 1, APPLE, 20, 'put')
  const t0 = Date.now()
  const r = world.apply([{ x: 1, y: 64, z: 1, id: 0, b: BOX }], A, t0, { drops: true })[0]
  assert.deepEqual(r.drops, [{ id: APPLE, n: 16 }])
  const again = world.apply([{ x: 1, y: 64, z: 1, id: 0, b: BOX }], A, t0, { drops: true })[0]
  assert.deepEqual([again.ok, again.why, again.drops], [false, 'stale', undefined], 'a repeated break frame is stale')
  world.apply([{ x: 1, y: 64, z: 1, id: BOX, b: 0 }], A)
  assert.deepEqual(world.inv(1, 64, 1).slots, emptySlots(BOX), 'a box placed back is empty')
  world.flush()
  assert.deepEqual(makeWorld(db, { gen: () => 0 }).inv(1, 64, 1).slots, emptySlots(BOX), 'and stays empty after a reload')
  // undo (system, no breaker) keeps the old safe refusal: a full container is never broken with nobody to drop to
  world.move(A, 1, 64, 1, APPLE, 5, 'put')
  assert.equal(world.apply([{ x: 1, y: 64, z: 1, id: 0, b: BOX }], 0)[0].why, 'not-empty')
  assert.equal(count(world.inv(1, 64, 1).slots, APPLE), 5)
})

test('rule: an explosion drops ALL items of a container; the explode hook is not called by anything yet', () => {
  const { world } = fresh()
  world.apply([{ x: 1, y: 64, z: 1, id: BOX, b: 0 }, { x: 2, y: 64, z: 1, id: OVEN, b: 0 }, { x: 3, y: 64, z: 1, id: STONE, b: 0 }], A)
  world.move(A, 1, 64, 1, APPLE, 67, 'put')
  world.move(A, 2, 64, 1, LOG, 3, 'put')
  const head = world.head()
  const r = world.explode([{ x: 1, y: 64, z: 1 }, { x: 2, y: 64, z: 1 }, { x: 3, y: 64, z: 1 }, { x: 4, y: 64, z: 1 }])
  assert.equal(r.n, 3, 'air is skipped')
  assert.deepEqual(r.drops, [{ x: 1, y: 64, z: 1, id: APPLE, n: 64 }, { x: 1, y: 64, z: 1, id: APPLE, n: 3 }, { x: 2, y: 64, z: 1, id: LOG, n: 3 }])
  assert.equal(world.inv(1, 64, 1).error, 'container')
  assert.deepEqual(world.since(head, 10).ops.map((o) => [o.b, o.i, o.w]), [[BOX, 0, 0], [OVEN, 0, 0], [STONE, 0, 0]], 'logged as system breaks')
  assert.deepEqual(world.explode([{ x: 1, y: 64, z: 1 }]).drops, [], 'nothing to drop twice')
})

test('protocol: iget/iput/itake frames are strict', () => {
  assert.equal(parseFrame2({ v: 0, t: 'iget', x: 1, y: 64, z: 2 }).t, 'iget')
  assert.equal(parseFrame2({ v: 0, t: 'iput', x: 1, y: 64, z: 2, id: 5, n: 3 }).t, 'iput')
  assert.equal(parseFrame2({ v: 0, t: 'itake', x: 1, y: 64, z: 2, id: 5, n: 64 }).t, 'itake')
  assert.equal(parseFrame2({ v: 0, t: 'iput', x: 1, y: 64, z: 2, id: 5, n: 64 * 18 + 1 }).err, 'val')
  assert.equal(parseFrame2({ v: 0, t: 'iput', x: 1, y: 64, z: 2, id: 0, n: 1 }).err, 'val')
  assert.equal(parseFrame2({ v: 0, t: 'iput', x: 1, y: 64, z: 2, id: 5 }).err, 'keys')
  assert.equal(parseFrame2({ v: 0, t: 'iget', x: 1, y: 99999, z: 2 }).err, 'cell')
  assert.equal(parseFrame2({ v: 0, t: 'iput', x: 1, y: 64, z: 2, id: 5, n: 3, extra: 1 }).err, 'keys')
})

test('through a real room: inv, put, take; the other kid hears the touch op; out of reach is refused in the room', async (t) => {
  timers(t)
  const rooms = new Map()
  const hub = makeHub({ db: memDb(), send: async (name, msg) => (rooms.has(name) ? rooms.get(name).deliver(msg) : false), gen: () => 0 })
  const stub = {
    assign: async (a) => hub.assign(a), edit: async (a, b) => hub.edit(a, b), link: async (id) => hub.link(id),
    unlink: async (id) => hub.unlink(id), touch: async (id) => hub.touch(id), left: async (r) => hub.left(r),
    chunk: async (x, z) => hub.chunk(x, z), since: async (s, n) => hub.since(s, n), setLocked: async (on) => hub.setLocked(on),
    inv: async (x, y, z) => hub.inv(x, y, z), move: async (ref, x, y, z, i, n, d) => hub.move(ref, x, y, z, i, n, d),
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
  const settle = () => new Promise((r) => setImmediate(r))
  await enter('staffref-001', 'teacher')
  const k = await enter('kidref-0001'), b = await enter('kidref-0002')
  const r = plotRect(k.plot)
  const cell = { x: r.x0 + 3, y: 64, z: r.z0 + 3 }
  await send(k.room, k, { v: 0, t: 'p', q: k.q++, x: cell.x, y: 64, z: cell.z, r: 0, f: 0 })
  await send(b.room, b, { v: 0, t: 'p', q: b.q++, x: cell.x, y: 64, z: cell.z, r: 0, f: 0 })
  await send(k.room, k, { v: 0, t: 'b', ...cell, id: BOX, b: 0 }); await settle()
  t.mock.timers.tick(300)
  await send(k.room, k, { v: 0, t: 'iput', ...cell, id: APPLE, n: 70 }); await settle()
  const mv = frames(k.sock).filter((f) => f.t === 'mv').at(-1)
  assert.deepEqual([mv.moved, mv.slots[0], mv.slots[1], mv.slots[2]], [70, [APPLE, 64], [APPLE, 6], 0])
  await send(b.room, b, { v: 0, t: 'iget', ...cell }); await settle()
  const inv = frames(b.sock).filter((f) => f.t === 'inv').at(-1)
  assert.deepEqual(inv.slots.slice(0, 2), [[APPLE, 64], [APPLE, 6]])
  await hub.fan.tick(); await settle()
  const ops = frames(b.sock).filter((f) => f.t === 'o').flatMap((f) => f.o)
  assert.equal(ops.length, 2, 'the box placement and the touch op')
  assert.deepEqual(ops[1].slice(1), [cell.x, cell.y, cell.z, BOX])
  t.mock.timers.tick(300)
  await send(b.room, b, { v: 0, t: 'itake', ...cell, id: APPLE, n: 10 }); await settle()
  assert.equal(frames(b.sock).filter((f) => f.t === 'mv').at(-1).moved, 10)
  await send(b.room, b, { v: 0, t: 'itake', x: cell.x + 200, y: 64, z: cell.z, id: APPLE, n: 1 }); await settle()
  assert.equal(frames(b.sock).filter((f) => f.t === 'no').at(-1).c, 'reach')
  assert.equal(count(hub.inv(cell.x, cell.y, cell.z).slots, APPLE), 60)

  // grief rules still decide who may break: kid b is in reach but it is kid k's plot -> refused, nothing drops
  t.mock.timers.tick(300)
  await send(b.room, b, { v: 0, t: 'b', ...cell, id: 0, b: BOX }); await settle()
  assert.equal(frames(b.sock).filter((f) => f.t === 'dr').length, 0)
  assert.equal(count(hub.inv(cell.x, cell.y, cell.z).slots, APPLE), 60, 'items untouched')
  // the owner breaks it mid-use: 80% per stack to the breaker's client only, once
  const want = hub.inv(cell.x, cell.y, cell.z).slots.filter(Boolean).map((q) => [q.id, Math.round(q.n * 0.8)])
  t.mock.timers.tick(300)
  await send(k.room, k, { v: 0, t: 'b', ...cell, id: 0, b: BOX }); await settle()
  const dr = frames(k.sock).filter((f) => f.t === 'dr')
  assert.equal(dr.length, 1)
  assert.deepEqual([dr[0].x, dr[0].y, dr[0].z, dr[0].d], [cell.x, cell.y, cell.z, want])
  assert.equal(frames(b.sock).filter((f) => f.t === 'dr').length, 0, 'the other kid gets no copy')
  assert.equal(hub.inv(cell.x, cell.y, cell.z).error, 'container')
})
