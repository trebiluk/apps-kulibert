// In-process simulation of the room: the REAL Room class and the REAL Worker entry,
// with fake sockets and a fake clock. No Cloudflare, no network, no npm packages.
//
//   npm run test:sim     (= node --import ./test/shim/register.mjs --test test/room.sim.test.mjs)
//
// This proves the room LOGIC (cap 30, 5 Hz, no echo, no text, abuse, idle, wake-up).
// It does NOT prove the Cloudflare runtime. That is what tools/load30.mjs is for,
// run against `wrangler dev` (and later a real Chromebook).
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  makeRoom, joinReq, join, joinN, frames, snaps, sendPos, allPos, timers, send, refOf, aliasOf, nextJti,
} from './helpers.mjs'
import { Room } from '../src/room.js'
import worker from '../src/worker.js'
import { signToken } from '../src/token.js'
import { MAX_PLAYERS, TICK_MS, CLOSE } from '../src/protocol.js'

// ------------------------------------------------------------------ the room

test('30 kids join; each sees the others; the 31st is told the room is full', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, MAX_PLAYERS)

  kids.forEach((k, idx) => {
    const hello = frames(k.sock)[0]
    assert.equal(hello.t, 'hello')
    assert.equal(hello.max, MAX_PLAYERS)
    assert.equal(hello.tick, TICK_MS)
    assert.equal(hello.players.length, idx)   // everyone who was already there
    assert.equal(hello.you, idx + 1)
  })
  assert.equal(frames(kids[0].sock).filter((f) => f.t === 'join').length, 29)

  const extra = await join(room, 31)
  assert.deepEqual(frames(extra.sock).map((f) => f.t), ['full'])
  assert.equal(extra.sock.closed.code, CLOSE.FULL)
  assert.equal(room.players.size, MAX_PLAYERS)
  assert.equal(frames(kids[0].sock).filter((f) => f.t === 'join').length, 29)  // nobody was told about the 31st
})

test('snapshots: about 5 per second, each kid gets the other 29, never their own position', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, MAX_PLAYERS)
  for (const k of kids) k.sock.inbox.length = 0

  await allPos(room, kids)
  t.mock.timers.tick(TICK_MS)
  for (const k of kids) {
    const s = snaps(k.sock)
    assert.equal(s.length, 1)
    assert.equal(s[0].p.length, 29)
    assert.ok(s[0].p.every((e) => e[0] !== k.i), 'own position was echoed')
    assert.equal(new Set(s[0].p.map((e) => e[0])).size, 29)
  }

  // Nothing moved: no snapshot on the next tick.
  for (const k of kids) k.sock.inbox.length = 0
  t.mock.timers.tick(TICK_MS)
  for (const k of kids) assert.equal(snaps(k.sock).length, 0)

  // Five seconds of everyone moving at 5 Hz.
  for (const k of kids) k.sock.inbox.length = 0
  for (let n = 1; n <= 25; n++) {
    await allPos(room, kids, n)
    t.mock.timers.tick(TICK_MS)
  }
  let worst = 0
  for (const k of kids) {
    assert.equal(snaps(k.sock).length, 25)   // 25 snapshots in 5 s = 5 Hz
    const bytes = k.sock.inbox.reduce((sum, s) => sum + Buffer.byteLength(s), 0)
    worst = Math.max(worst, bytes / 5)
  }
  t.diagnostic('worst-case download per kid with 29 others moving: ' + Math.round(worst) + ' bytes/s')
  assert.ok(worst < 8000, 'over the 8 KB/s budget: ' + worst)
})

test('every 5 seconds a full snapshot goes out even if nobody moved', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, 3)
  await allPos(room, kids)
  t.mock.timers.tick(TICK_MS)
  for (const k of kids) k.sock.inbox.length = 0
  t.mock.timers.tick(TICK_MS * 24)
  for (const k of kids) { const s = snaps(k.sock); assert.equal(s.length, 1); assert.equal(s[0].f, 1); assert.equal(s[0].p.length, 2) }
})

test('no text can travel: every non-position frame ends the connection, and nothing leaks', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, 8)
  const attempts = [
    ['type',    '{"v":0,"t":"chat","m":"MARKER-HELLO"}'],
    ['type',    '{"v":0,"t":"say","text":"MARKER-HELLO"}'],
    ['keys',    '{"v":0,"t":"p","q":1,"x":1,"y":2,"z":3,"r":4,"f":0,"m":"MARKER-HELLO","alias":"MARKER-HELLO"}'],
    ['binary',  new ArrayBuffer(8)],
    ['version', '{"t":"p","q":1,"x":1,"y":2,"z":3,"r":4}'],
    ['json',    '{"v":0,"t":"p",'],
    ['staff',   '{"v":0,"t":"st","a":"hostworld"}'],
  ]
  for (let n = 0; n < attempts.length; n++) {
    const [code, raw] = attempts[n]
    await room.webSocketMessage(kids[n].sock, raw)
    assert.equal(kids[n].sock.closed?.code, CLOSE.BAD, 'attempt ' + n + ' was not dropped')
    assert.equal(frames(kids[n].sock).filter((f) => f.t === 'err').at(-1)?.c, code)
  }
  // The last kid stays and plays normally.
  await allPos(room, kids.slice(7))
  t.mock.timers.tick(TICK_MS)
  for (const k of kids) for (const s of k.sock.inbox) {
    assert.ok(!s.includes('MARKER'), 'text reached a client: ' + s)
    assert.ok(!s.includes('kidref-'), 'an opaque kid ref reached a client: ' + s)
  }
})

test('a second tab from the same kid replaces the first, even when the room is full', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, MAX_PLAYERS)
  for (const k of kids) k.sock.inbox.length = 0

  const again = await join(room, 5)   // same ref and alias as kid 5
  assert.equal(kids[4].sock.closed.code, CLOSE.REPLACED)
  assert.equal(room.players.size, MAX_PLAYERS)
  assert.equal(frames(again.sock)[0].t, 'hello')
  const t2 = frames(kids[0].sock).map((f) => f.t)
  assert.deepEqual(t2, ['leave', 'join'])
})

test('a flood is cut off with the abuse code and the room is told', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, 3)
  for (let n = 0; n < 100; n++) await sendPos(room, kids[0], n)   // 100 frames in the same millisecond
  assert.equal(kids[0].sock.closed.code, CLOSE.ABUSE)
  assert.equal(room.players.size, 2)
  assert.ok(frames(kids[1].sock).some((f) => f.t === 'leave' && f.i === 1))
})

test('a kid who goes silent for 45 seconds is dropped; kids who keep sending stay', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, MAX_PLAYERS)
  const quiet = kids[29]
  for (let n = 1; n <= 260; n++) {   // 52 seconds
    await allPos(room, kids.slice(0, 29), n)
    t.mock.timers.tick(TICK_MS)
  }
  assert.equal(quiet.sock.closed.code, CLOSE.IDLE)
  assert.equal(room.players.size, 29)
  assert.ok(kids.slice(0, 29).every((k) => !k.sock.closed))
  assert.ok(frames(kids[0].sock).some((f) => f.t === 'leave' && f.i === 30))
})

test('kids leaving: everyone else hears about each one', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const kids = await joinN(room, MAX_PLAYERS)
  for (const k of kids) k.sock.inbox.length = 0
  for (const k of kids.slice(25)) await room.webSocketClose(k.sock, 1000)
  assert.equal(room.players.size, 25)
  for (const k of kids.slice(0, 25)) assert.equal(frames(k.sock).filter((f) => f.t === 'leave').length, 5)
})

test('an emptied room stops its timer, and a woken room rebuilds from socket attachments', async (t) => {
  timers(t)
  const { ctx, room } = makeRoom()
  const kids = await joinN(room, 3)
  assert.ok(room.timer)

  // Simulate the object being evicted and woken while the sockets stayed open.
  const woke = new Room(ctx, {})
  woke.cfg = 'period'
  assert.equal(woke.players.size, 3)
  assert.deepEqual([...woke.players.values()].map((p) => p.alias), [aliasOf(1), aliasOf(2), aliasOf(3)])
  assert.ok(woke.timer, 'timer should restart for a room with players')
  // Woken with kids but no staff socket: the room stays closed (fails closed) until a teacher is back.
  assert.equal((await woke.fetch(joinReq(refOf(4), aliasOf(4)))).status, 403)
  const back = await woke.fetch(joinReq('staffref-0001', 'Teacher One', { 'x-bt-role': 'teacher' }))
  assert.equal(frames(back.webSocket.server)[0].you, 4)   // no id collision
  const fresh = await woke.fetch(joinReq(refOf(4), aliasOf(4)))
  assert.equal(frames(fresh.webSocket.server)[0].you, 5)

  woke.stopTimer()
  const empty = makeRoom()
  const one = await join(empty.room, 1)
  await empty.room.webSocketClose(one.sock, 1000)
  t.mock.timers.tick(TICK_MS)
  assert.equal(empty.room.timer, null)
  void kids
})

test('the room refuses a request that did not come through the Worker', async () => {
  const { room } = makeRoom()
  assert.equal((await room.fetch({ headers: new Headers({ Upgrade: 'websocket' }) })).status, 400)
  assert.equal((await room.fetch({ headers: new Headers({}) })).status, 426)
  assert.equal((await room.fetch(joinReq('short', 'Test Pup 01'))).status, 400)
  assert.equal((await room.fetch(joinReq(refOf(1), 'evil‮name'))).status, 400)
  assert.equal((await room.fetch(joinReq(refOf(1), 'hello@school.org'))).status, 400)
  assert.equal(room.players.size, 0)
})

// ------------------------------------------------------------------ the Worker gate

const SECRET = 'worker-test-secret-0123456789abcd'
const claims = (o = {}) => ({
  v: 1, ref: refOf(1), room: 'class-room-01', alias: aliasOf(1), exp: Math.floor(Date.now() / 1000) + 60,
  jti: nextJti(), role: 'kid', cfg: 'period', ...o,
})

function envWith(sent, over = {}) {
  return {
    ALLOWED_ORIGINS: 'https://apps.kulibert.net',
    ROOM_JOIN_SECRET: SECRET,
    ROOMS: {
      idFromName: (n) => 'id:' + n,
      get: (id) => ({ fetch: async (r) => { sent.push({ id, headers: r.headers }); return new Response(null, { status: 101 }) } }),
    },
    ...over,
  }
}
function wsReq(token, { origin = 'https://apps.kulibert.net', protocols, extra = {} } = {}) {
  const h = { Upgrade: 'websocket', ...extra }
  if (origin) h.Origin = origin
  const p = protocols ?? (token ? 'bt-room.v0, ' + token : 'bt-room.v0')
  if (p) h['Sec-WebSocket-Protocol'] = p
  return new Request('https://apps.kulibert.net/rt/ws', { headers: h })
}

test('worker: refuses wrong origin, no upgrade, no secret, no token, bad token', async () => {
  const sent = []
  const good = await signToken(claims(), SECRET)
  const status = async (req, env = envWith(sent)) => (await worker.fetch(req, env)).status

  assert.equal(await status(new Request('https://apps.kulibert.net/rt/ws')), 426)
  assert.equal(await status(wsReq(good, { origin: 'https://evil.example' })), 403)
  assert.equal(await status(wsReq(good, { origin: '' })), 403)
  assert.equal(await status(wsReq(good), envWith(sent, { ROOM_JOIN_SECRET: undefined })), 503)
  assert.equal(await status(wsReq(good, { protocols: '' })), 401)
  assert.equal(await status(wsReq(good, { protocols: 'bt-room.v0' })), 401)
  assert.equal(await status(wsReq(good, { protocols: good })), 401)   // token without our protocol name
  assert.equal(await status(wsReq(await signToken(claims(), 'some-other-secret-0123456789'))), 401)
  assert.equal(await status(wsReq(await signToken(claims({ exp: Math.floor(Date.now() / 1000) - 120 }), SECRET))), 401)
  assert.equal(await status(wsReq(await signToken(claims({ cfg: 'myrealm' }), SECRET))), 401)   // not one of the 7 configs
  assert.equal(await status(wsReq(await signToken(claims({ alias: 'a‮b' }), SECRET))), 401)
  assert.equal(await status(wsReq('garbage.token')), 401)
  assert.equal(sent.length, 0, 'a refused request reached a room')
})

test('worker: a good token reaches the room named in the token, with identity headers only', async () => {
  const sent = []
  const good = await signToken(claims({ alias: 'گربه‌ها 2' }), SECRET)
  const res = await worker.fetch(wsReq(good, { extra: { 'x-bt-ref': 'attacker-ref-0001', 'x-bt-alias': 'attacker' } }), envWith(sent))
  assert.equal(res.status, 101)
  assert.equal(sent.length, 1)
  assert.equal(sent[0].id, 'id:class-room-01')                 // room comes from the signed claims
  assert.equal(sent[0].headers.get('x-bt-ref'), refOf(1))      // client-supplied value was replaced
  assert.equal(decodeURIComponent(sent[0].headers.get('x-bt-alias')), 'گربه‌ها 2')
  assert.equal(sent[0].headers.get('sec-websocket-protocol'), null)
  for (const [, v] of sent[0].headers) assert.ok(!v.includes(good), 'the token was passed on')
})

test('worker: health and unknown paths', async () => {
  const env = envWith([])
  assert.equal((await worker.fetch(new Request('https://apps.kulibert.net/rt/health'), env)).status, 200)
  assert.equal((await worker.fetch(new Request('https://apps.kulibert.net/rt/other'), env)).status, 404)
})
