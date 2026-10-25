// Two REAL Room objects sharing one hub: an edit in room 1 shows up in room 2, in order, once.
import test from 'node:test'
import assert from 'node:assert/strict'
import { makeRoom, joinReq, frames, send, timers } from './helpers.mjs'
import { memDb } from '../src/world/memdb.js'
import { makeHub } from '../src/world/hub.js'
import { decodeChunk } from '../src/world/chunks.js'
import { plotRect } from '../src/claims.js'
import { CLOSE } from '../src/protocol.js'

const settle = () => new Promise((r) => setImmediate(r))

function setup() {
  const rooms = new Map()
  const hub = makeHub({ db: memDb(), send: async (name, msg) => (rooms.has(name) ? rooms.get(name).deliver(msg) : false) })
  const stub = {
    assign: async (a) => hub.assign(a), edit: async (a, b) => hub.edit(a, b), link: async (id) => hub.link(id),
    unlink: async (id) => hub.unlink(id), touch: async (id) => hub.touch(id), left: async (r) => hub.left(r),
    chunk: async (x, z) => hub.chunk(x, z), since: async (s, n) => hub.since(s, n), setLocked: async (on) => hub.setLocked(on),
  }
  const env = { WORLDS: { idFromName: (n) => n, get: () => stub } }
  const join = async (ref, role = 'kid', grp) => {
    const a = await stub.assign({ world: 'world-0001', ref, grp, role, bld: 's', cfg: 'contest' })
    if (a.err) return { err: a.err }
    if (!rooms.has(a.room)) rooms.set(a.room, makeRoom({ open: false, env }).room)
    const room = rooms.get(a.room)
    const res = await room.fetch(joinReq(ref, 'Alias ' + ref.slice(-4), { 'x-bt-role': role, 'x-bt-cfg': 'contest', 'x-bt-world': 'world-0001', 'x-bt-rid': a.room }))
    await settle()
    return { room, plot: a.plot, ref, q: 0, sock: res.webSocket.server, name: a.room }
  }
  return { hub, rooms, join, stub }
}
const at = (k, x, z) => send(k.room, k, { v: 0, t: 'p', q: k.q++, x, y: 64, z, r: 0, f: 0 })
const ops = (k) => frames(k.sock).filter((f) => f.t === 'o').flatMap((f) => f.o)

test('two rooms, one world: the edit reaches both rooms once and in order; refusals reach only the sender', async (t) => {
  timers(t)
  const { hub, rooms, join } = setup()
  const teacher = await join('staffref-001', 'teacher')
  const kids = []
  for (let i = 0; i < 40; i++) kids.push(await join('kidref-' + String(1000 + i)))
  assert.equal(rooms.size, 2)
  const a = kids[0], b = kids[39]
  assert.notEqual(a.name, b.name)
  const r = plotRect(a.plot)
  await at(a, r.x0 + 2, r.z0 + 2)
  const cell = { x: r.x0 + 3, y: 64, z: r.z0 + 3 }
  await send(a.room, a, { v: 0, t: 'b', ...cell, id: 5, b: 0 }); await settle()
  await hub.fan.tick(); await settle()
  assert.deepEqual(ops(a), [[1, cell.x, cell.y, cell.z, 5]])
  assert.deepEqual(ops(b), [[1, cell.x, cell.y, cell.z, 5]])
  assert.deepEqual(ops(teacher), [[1, cell.x, cell.y, cell.z, 5]])
  await hub.fan.tick(); await settle()
  assert.equal(ops(b).length, 1, 'delivered twice')

  // B (other room) stands next to A's block and tries to break it: refused to B only, nothing fanned out
  await at(b, r.x0 + 2, r.z0 + 2)
  await send(b.room, b, { v: 0, t: 'b', ...cell, id: 0, b: 5 }); await settle()
  assert.equal(frames(b.sock).filter((f) => f.t === 'no').at(-1).c, 'not-yours')
  await send(b.room, b, { v: 0, t: 'b', x: cell.x + 200, y: 64, z: cell.z, id: 0, b: 0 }); await settle()
  assert.equal(frames(b.sock).filter((f) => f.t === 'no').at(-1).c, 'reach')     // too far from where B really is: caught in the room, never reaches the world
  assert.equal(frames(a.sock).filter((f) => f.t === 'no').length, 0)
  assert.equal(hub.world.head(), 1)
})

test('teacher in one room fixes grief in another; a stale edit gets the true block back', async (t) => {
  timers(t)
  const { hub, join } = setup()
  const teacher = await join('staffref-001', 'teacher')
  const a = await join('kidref-0001')
  const r = plotRect(a.plot)
  const cell = { x: r.x0 + 3, y: 64, z: r.z0 + 3 }
  await at(a, r.x0 + 2, r.z0 + 2)
  await send(a.room, a, { v: 0, t: 'b', ...cell, id: 5, b: 0 }); await settle()
  await at(teacher, cell.x, cell.z)
  await send(teacher.room, teacher, { v: 0, t: 'b', ...cell, id: 0, b: 0 }); await settle()   // teacher thought it was empty
  const no = frames(teacher.sock).filter((f) => f.t === 'no').at(-1)
  assert.deepEqual([no.c, no.cur], ['stale', 5])
  await send(teacher.room, teacher, { v: 0, t: 'b', ...cell, id: 0, b: 5 }); await settle()
  await hub.fan.tick(); await settle()
  assert.deepEqual(ops(a).map((o) => o[4]), [5, 0])
})

test('catch-up: sync replays missed ops, cget returns the chunk with its seq; bad world frames drop the connection', async (t) => {
  timers(t)
  const { hub, join } = setup()
  await join('staffref-001', 'teacher')
  const a = await join('kidref-0001')
  const r = plotRect(a.plot)
  await at(a, r.x0 + 2, r.z0 + 2)
  for (let i = 0; i < 3; i++) { await send(a.room, a, { v: 0, t: 'b', x: r.x0 + 3 + i, y: 64, z: r.z0 + 2, id: 5, b: 0 }); await settle() }
  const late = await join('kidref-0002')
  await send(late.room, late, { v: 0, t: 'sync', s: 1 }); await settle()
  assert.deepEqual(ops(late).map((o) => o[0]), [2, 3])
  await send(late.room, late, { v: 0, t: 'cget', cx: Math.floor((r.x0 + 3) / 16), cz: Math.floor((r.z0 + 2) / 16) }); await settle()
  const ch = frames(late.sock).find((f) => f.t === 'ch')
  assert.equal(ch.s, 3)
  assert.ok(decodeChunk(ch.d).edits.size >= 1)
  await send(late.room, late, { v: 0, t: 'b', x: 1.5, y: 64, z: 0, id: 1, b: 0 })
  assert.equal(late.sock.closed.code, CLOSE.BAD)
  assert.equal(hub.world.head(), 3)
})

test('a room that empties unlinks from the world; the teacher\'s close stops new kids world-wide', async (t) => {
  timers(t)
  const { hub, join } = setup()
  const teacher = await join('staffref-001', 'teacher')
  const a = await join('kidref-0001')
  assert.deepEqual(hub.fan.linked(), ['world-0001-r1'])
  await send(teacher.room, teacher, { v: 0, t: 'st', a: 'close' }); await settle()
  assert.deepEqual(await join('kidref-0002'), { err: 'closed' })
  await a.room.webSocketClose(a.sock, 1000); await teacher.room.webSocketClose(teacher.sock, 1000); await settle()
  assert.deepEqual(hub.fan.linked(), [])
})

test('repeated edits on other kids\' land earn a kick; a room that is not linked refuses pushes', async (t) => {
  timers(t)
  const { join } = setup()
  await join('staffref-001', 'teacher')
  const a = await join('kidref-0001')
  const b = await join('kidref-0002')
  const rb = plotRect(b.plot)
  await at(a, rb.x0 + 2, rb.z0 + 2)
  for (let i = 0; i < 9 && !a.sock.closed; i++) { await send(a.room, a, { v: 0, t: 'b', x: rb.x0 + 3, y: 64, z: rb.z0 + 3, id: 5, b: 0 }); await settle(); t.mock.timers.tick(100) }
  assert.equal(a.sock.closed.code, CLOSE.ABUSE)
  const lone = makeRoom({ open: false, env: {} }).room
  assert.equal(await lone.deliver({ from: 0, ops: [{ s: 1, x: 0, y: 0, z: 0, i: 1 }] }), false)
})
