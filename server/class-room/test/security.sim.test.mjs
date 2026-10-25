// Security behaviour of the REAL Room and Worker, with fake sockets and a fake clock.
//   npm run test:sim
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  makeRoom, joinReq, join, joinN, joinStaff, frames, posFrame, send, timers, refOf, aliasOf, nextJti,
} from './helpers.mjs'
import worker from '../src/worker.js'
import { signToken } from '../src/token.js'
import { failureLog } from '../src/guard.js'
import { CLOSE, MAX_PLAYERS, MAX_STAFF_EXTRA, CONFIG_IDS } from '../src/protocol.js'

const st = (room, who, obj) => send(room, who, { v: 0, t: 'st', ...obj })
const errs = (sock) => frames(sock).filter((f) => f.t === 'err').map((f) => f.c)
const captureLog = () => { const seen = []; const old = failureLog.sink; failureLog.sink = (r) => seen.push(r); return { seen, restore: () => { failureLog.sink = old } } }

// ------------------------------------------------------------ only staff create worlds

test('a fresh room is closed to kids; only a staff ticket opens it; kids must match its config', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  assert.equal((await join(room, 1)).res.status, 403)          // no staff yet: closed, fails closed
  const teacher = await joinStaff(room, 'teacher')
  assert.equal(frames(teacher.sock)[0].role, 't')
  assert.equal(room.cfg, 'period')
  assert.equal((await join(room, 1)).sock.closed, null)         // now open
  assert.equal((await join(room, 2, { 'x-bt-cfg': 'game' })).res.status, 403)   // wrong config for this room
  assert.equal((await join(room, 3, { 'x-bt-cfg': 'myrealm' })).res.status, 400) // not one of the 7
  assert.equal((await join(room, 4, { 'x-bt-role': 'god' })).res.status, 400)
  assert.equal(room.players.size, 2)
})

test('every one of the 7 configs can be opened by staff, and a kid can join each', async (t) => {
  timers(t)
  for (const cfg of CONFIG_IDS) {
    const { room } = makeRoom({ open: false })
    const tr = await room.fetch(joinReq('staffref-0001', 'Teacher One', { 'x-bt-role': 'teacher', 'x-bt-cfg': cfg }))
    assert.equal(tr.status, 101, cfg)
    const kid = await join(room, 1, { 'x-bt-cfg': cfg })
    assert.equal(kid.res.status, 101, cfg)
  }
})

test('close and open: closing refuses new kids (existing stay); staff joining does not reopen a closed room', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  const teacher = await joinStaff(room)
  const k1 = await join(room, 1)
  await st(room, teacher, { a: 'close' })
  assert.equal((await join(room, 2)).res.status, 403)
  assert.equal(k1.sock.closed, null)
  const t2 = await joinStaff(room, 'teacher', 901)               // another staff joins: still closed
  assert.equal(t2.res.status, 101)
  assert.equal((await join(room, 2)).res.status, 403)
  await st(room, t2, { a: 'open' })
  assert.equal((await join(room, 2)).res.status, 101)
})

test('staff are on top of the 30 kids, up to the staff limit', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  await joinStaff(room, 'teacher', 900)
  await joinN(room, MAX_PLAYERS)
  assert.equal(room.players.size, MAX_PLAYERS + 1)
  assert.equal((await join(room, 31)).sock.closed.code, CLOSE.FULL)
  for (let n = 1; n < MAX_STAFF_EXTRA; n++) assert.equal((await joinStaff(room, 'teacher', 900 + n)).sock.closed, null)
  assert.equal((await joinStaff(room, 'teacher', 950)).sock.closed.code, CLOSE.FULL)
})

// ------------------------------------------------------------ tickets

test('a ticket works once: a replay is refused, a new ticket is fine', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const jti = nextJti()
  const a = await room.fetch(joinReq(refOf(1), aliasOf(1), { 'x-bt-jti': jti }))
  assert.equal(a.status, 101)
  const b = await room.fetch(joinReq(refOf(2), aliasOf(2), { 'x-bt-jti': jti }))   // someone replays it
  assert.equal(b.status, 401)
  assert.equal(room.players.size, 1)
  assert.equal((await room.fetch(joinReq(refOf(1), aliasOf(1)))).status, 101)       // the kid, with a fresh ticket
})

test('used tickets are forgotten after a while (memory stays small)', async (t) => {
  timers(t)
  const { room } = makeRoom()
  for (let i = 1; i <= 20; i++) await room.fetch(joinReq(refOf(i), aliasOf(i)))
  assert.equal(room.usedJti.size, 20)
  t.mock.timers.tick(7 * 60 * 1000)
  await room.fetch(joinReq(refOf(50), aliasOf(50)))
  assert.equal(room.usedJti.size, 1)
})

test('one IP cannot hammer the join door (but a whole class behind one IP is fine)', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  const ip = { 'x-bt-ip': 'abcdef0123456789' }
  await room.fetch(joinReq('staffref-0001', 'Teacher One', { ...ip, 'x-bt-role': 'teacher' }))
  for (let i = 1; i <= 30; i++) assert.equal((await join(room, i, ip)).res.status, 101, 'kid ' + i)    // a class
  let refused = 0
  for (let i = 100; i < 200; i++) if ((await join(room, i, ip)).res.status === 429) refused++
  assert.ok(refused >= 30, 'hammering was not slowed: ' + refused)
})

// ------------------------------------------------------------ ladder: drop, kick, ban

test('a kid sending a staff command is dropped; three strikes is a temporary ban; the ban ends', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const log = captureLog()
  try {
    for (let n = 1; n <= 3; n++) {
      const k = await join(room, 1)
      assert.equal(k.res.status, 101, 'attempt ' + n)
      await st(room, k, { a: 'open' })
      assert.equal(k.sock.closed.code, CLOSE.BAD)
      assert.deepEqual(errs(k.sock), ['role'])
    }
    assert.equal((await join(room, 1)).res.status, 403)           // banned
    assert.equal((await join(room, 2)).res.status, 101)           // other kids are fine
    t.mock.timers.tick(10 * 60 * 1000 + 1000)
    assert.equal((await join(room, 1)).res.status, 101)           // ban over
  } finally { log.restore() }
  assert.ok(log.seen.length >= 3)
  for (const r of log.seen) {
    assert.deepEqual(Object.keys(r).sort(), ['alias', 'code', 'ev', 'ts'])
    assert.ok(!JSON.stringify(r).includes('kidref'), 'a ref was logged')
  }
})

test('replayed and out-of-order position frames end the connection', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const k = await join(room, 1)
  const f = posFrame(k)
  await send(room, k, f)
  assert.equal(k.sock.closed, null)
  await send(room, k, f)                                          // the same frame again
  assert.equal(k.sock.closed.code, CLOSE.BAD)
  assert.deepEqual(errs(k.sock), ['replay'])
  const k2 = await join(room, 2)
  k2.q = 10; await send(room, k2, posFrame(k2))
  k2.q = 5; await send(room, k2, posFrame(k2))                    // going backwards
  assert.equal(k2.sock.closed.code, CLOSE.BAD)
})

test('speed hack: the move is refused and the client is told to go back; five in a row is a kick', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const k = await join(room, 1)
  const o = await join(room, 2)
  await send(room, k, posFrame(k, { x: 0, z: 0 }))
  t.mock.timers.tick(200)
  await send(room, k, posFrame(k, { x: 500, z: 0 }))              // teleport
  assert.deepEqual(frames(k.sock).at(-1), { t: 'fix', x: 0, y: 64, z: 0 })
  t.mock.timers.tick(200)
  assert.equal(room.players.get(1).pos.x, 0, 'the teleport was accepted')
  for (let i = 0; i < 4; i++) await send(room, k, posFrame(k, { x: 500 + i, z: 0 }))
  assert.equal(k.sock.closed.code, CLOSE.ABUSE)
  t.mock.timers.tick(200)
  for (const s of o.sock.inbox) assert.ok(!s.includes('500'), 'the hacked position reached another kid')
})

test('out-of-bounds heights are refused', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const k = await join(room, 1)
  await send(room, k, posFrame(k, { y: 99999 }))                  // inside WORLD_LIMIT but above the sky limit
  assert.equal(room.players.get(1).pos, null)
})

test('flood: frames over the rate are thrown away; the flooder is kicked; others are untouched', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const bad = await join(room, 1)
  const ok = await join(room, 2)
  for (let n = 0; n < 500; n++) await send(room, bad, '{"v":0,"t":"ping","n":1}')
  assert.equal(bad.sock.closed.code, CLOSE.ABUSE)
  await send(room, ok, '{"v":0,"t":"ping","n":1}')
  assert.equal(ok.sock.closed, null)
})

test('per-IP budget: a normal class behind one school IP is never slowed; 34 sockets all flooding at once are capped', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  const ip = { 'x-bt-ip': 'abcdef0123456789' }
  const staff = []
  for (let n = 0; n < MAX_STAFF_EXTRA; n++) staff.push(await room.fetch(joinReq('staffref-' + (900 + n), 'Teacher ' + n, { ...ip, 'x-bt-role': 'teacher' })))
  const kids = []
  for (let i = 1; i <= 30; i++) kids.push(await join(room, i, ip))
  const pongs = () => kids.reduce((s, k) => s + frames(k.sock).filter((f) => f.t === 'pong').length, 0)

  // normal: every kid sends 6 messages a second for 3 seconds
  for (let sec = 0; sec < 3; sec++) {
    for (let m = 0; m < 6; m++) { for (const k of kids) await send(room, k, '{"v":0,"t":"ping","n":1}'); t.mock.timers.tick(160) }
  }
  assert.equal(pongs(), 30 * 6 * 3, 'a normal class was slowed down')
  assert.ok(kids.every((k) => !k.sock.closed))

  // flood: all 30 kids and 4 staff send a full burst in the same instant
  t.mock.timers.tick(5000)
  for (const k of kids) k.sock.inbox.length = 0
  const sockets = [...staff.map((r) => r.webSocket.server), ...kids.map((k) => k.sock)]
  for (const sock of sockets) for (let n = 0; n < 12; n++) await room.webSocketMessage(sock, '{"v":0,"t":"ping","n":1}')
  assert.ok(pongs() < 30 * 12, 'the per-IP cap did not apply: ' + pongs())
})

// ------------------------------------------------------------ staff powers

test('teacher: kick, freeze, rollback. Roles are checked every time', async (t) => {
  timers(t)
  const { room } = makeRoom({ open: false })
  const teacher = await joinStaff(room, 'teacher', 900)
  const admin = await joinStaff(room, 'admin', 901)
  const k1 = await join(room, 1)
  const k2 = await join(room, 2)

  await st(room, teacher, { a: 'kick', i: 99 })
  assert.deepEqual(errs(teacher.sock), ['target'])
  await st(room, teacher, { a: 'kick', i: room.byRef.get('staffref-901') })
  assert.deepEqual(errs(teacher.sock), ['target', 'role'])      // a teacher cannot kick an admin
  await st(room, teacher, { a: 'kick', i: room.byRef.get(refOf(1)) })
  assert.equal(k1.sock.closed.code, CLOSE.KICKED)
  assert.ok(frames(k2.sock).some((f) => f.t === 'leave'))

  await st(room, teacher, { a: 'rollback' })
  assert.equal(errs(teacher.sock).at(-1), 'role')               // teachers cannot roll back
  await st(room, admin, { a: 'rollback' })
  assert.equal(errs(admin.sock).at(-1), 'unsupported')          // nothing to roll back in Phase 0

  // freeze: kids snap back and everyone hears about it; staff can still move
  await send(room, k2, posFrame(k2, { x: 1, z: 1 }))
  t.mock.timers.tick(200)
  await st(room, teacher, { a: 'freeze', on: 1 })
  assert.deepEqual(frames(k2.sock).at(-1), { t: 'frz', on: 1 })
  await send(room, k2, posFrame(k2, { x: 2, z: 2 }))
  assert.deepEqual(frames(k2.sock).at(-1), { t: 'fix', x: 1, y: 64, z: 1 })
  assert.equal(k2.sock.closed, null, 'a frozen kid must not be punished')
  await send(room, teacher, posFrame(teacher, { x: 3, z: 3 }))
  assert.equal(room.players.get(room.byRef.get('staffref-900')).pos.x, 3)
  await st(room, teacher, { a: 'freeze', on: 0 })
  t.mock.timers.tick(200)
  await send(room, k2, posFrame(k2, { x: 2, z: 2 }))
  assert.equal(room.players.get(room.byRef.get(refOf(2))).pos.x, 2)
})

test('a kid cannot create, host, invite or upload a world over the socket: every attempt ends the connection', async (t) => {
  timers(t)
  const { room } = makeRoom()
  const log = captureLog()
  try {
    const verbs = ['create', 'host', 'invite', 'realm', 'world', 'file', 'upload', 'save', 'share', 'join']
    for (let n = 0; n < verbs.length; n++) {
      const k = await join(room, 100 + n)
      await send(room, k, { v: 0, t: verbs[n], name: 'MARKER', code: 'MARKER' })
      assert.equal(k.sock.closed.code, CLOSE.BAD, verbs[n])
      assert.deepEqual(errs(k.sock), ['type'], verbs[n])
      const k2 = await join(room, 200 + n)
      await send(room, k2, { v: 0, t: 'st', a: verbs[n] })
      assert.equal(k2.sock.closed.code, CLOSE.BAD, 'staff ' + verbs[n])
    }
  } finally { log.restore() }
  assert.equal(room.players.size, 0)
})

// ------------------------------------------------------------ the Worker door

const SECRET = 'worker-test-secret-0123456789abcd'
const claims = (o = {}) => ({
  v: 1, ref: refOf(1), room: 'class-room-01', alias: aliasOf(1), exp: Math.floor(Date.now() / 1000) + 60,
  jti: nextJti(), role: 'kid', cfg: 'period', ...o,
})
function envWith(sent, over = {}) {
  return {
    ALLOWED_ORIGINS: 'https://apps.kulibert.net', ROOM_JOIN_SECRET: SECRET,
    ROOMS: { idFromName: (n) => 'id:' + n, get: (id) => ({ fetch: async (r) => { sent.push({ id, headers: r.headers }); return new Response(null, { status: 101 }) } }) },
    ...over,
  }
}
const wsReq = (token, { url = 'https://apps.kulibert.net/rt/ws', extra = {} } = {}) =>
  new Request(url, { headers: { Upgrade: 'websocket', Origin: 'https://apps.kulibert.net', 'Sec-WebSocket-Protocol': 'bt-room.v0, ' + token, ...extra } })

test('worker: TLS only (ws:// is refused unless REQUIRE_TLS=0 for local tests)', async () => {
  const sent = []
  const tok = await signToken(claims(), SECRET)
  assert.equal((await worker.fetch(wsReq(tok, { url: 'http://apps.kulibert.net/rt/ws' }), envWith(sent))).status, 403)
  assert.equal((await worker.fetch(wsReq(await signToken(claims(), SECRET), { url: 'http://apps.kulibert.net/rt/ws', extra: { 'cf-visitor': '{"scheme":"https"}' } }), envWith(sent))).status, 101)
  assert.equal((await worker.fetch(wsReq(await signToken(claims(), SECRET), { url: 'http://127.0.0.1/rt/ws' }), envWith(sent, { REQUIRE_TLS: '0' }))).status, 101)
})

test('worker: client-sent x-bt-* headers are removed; role, config and ticket id come from the signature; the IP is hashed', async () => {
  const sent = []
  const tok = await signToken(claims({ cfg: 'contest' }), SECRET)
  const res = await worker.fetch(wsReq(tok, { extra: { 'x-bt-role': 'admin', 'x-bt-cfg': 'solvay', 'x-bt-jti': 'attacker-jti-01', 'x-bt-ip': '0000000000000000', 'x-bt-extra': '1', 'CF-Connecting-IP': '203.0.113.9' } }), envWith(sent))
  assert.equal(res.status, 101)
  const h = sent[0].headers
  assert.equal(h.get('x-bt-role'), 'kid')
  assert.equal(h.get('x-bt-cfg'), 'contest')
  assert.notEqual(h.get('x-bt-jti'), 'attacker-jti-01')
  assert.equal(h.get('x-bt-extra'), null)
  assert.match(h.get('x-bt-ip'), /^[0-9a-f]{16}$/)
  assert.notEqual(h.get('x-bt-ip'), '0000000000000000')
  for (const [, v] of h) assert.ok(!v.includes('203.0.113.9'), 'the IP was forwarded')
})

test('worker: forged, elevated, unsigned and wrong-config tickets never reach a room', async () => {
  const sent = []
  const log = captureLog()
  try {
    const good = await signToken(claims(), SECRET)
    const [p, s] = good.split('.')
    const elevated = Buffer.from(JSON.stringify({ ...claims(), role: 'admin', amr: ['passkey'] })).toString('base64url')
    const bad = [
      elevated + '.' + s,
      await signToken(claims({ role: 'teacher' }), SECRET),                               // staff without a passkey claim
      await signToken(claims({ role: 'teacher', amr: ['passkey'], exp: Math.floor(Date.now() / 1000) + 3000 }), SECRET),
      await signToken(claims({ cfg: 'kid-hosted' }), SECRET),
      await signToken(claims({ realm: 'mine' }), SECRET),
      await signToken(claims(), 'some-other-secret-0123456789'),
      p + '.', '.', 'x', '',
      Buffer.from('{"alg":"none"}').toString('base64url') + '.' + Buffer.from(JSON.stringify(claims())).toString('base64url') + '.',
    ]
    for (const tok of bad) assert.equal((await worker.fetch(wsReq(tok), envWith(sent))).status, 401, tok.slice(0, 30))
  } finally { log.restore() }
  assert.equal(sent.length, 0)
  for (const r of log.seen) assert.deepEqual(Object.keys(r).sort(), ['alias', 'code', 'ev', 'ts'])
})
