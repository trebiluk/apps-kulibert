import test from 'node:test'
import assert from 'node:assert/strict'
import './helpers.mjs'
import worker from '../src/worker.js'
import { makeControl, sha256Hex, parseAction, isControlTicket, LOGIN_TRIES, ROOM_STALE_MS } from '../src/control.js'
import { verifyToken, signToken } from '../src/token.js'

const mem = () => { const m = new Map(); return { get: async (k) => m.get(k), put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))) } } }
const SECRET = 'control-test-secret-0123456789abcd'

test('control: flags default open+chat, switches persist, rooms registry holds ids and counts only and forgets stale rooms', async () => {
  let t = 1_000_000
  const c = makeControl(mem(), { now: () => t })
  assert.deepEqual(await c.flags(), { open: true, chat: true })
  assert.equal((await c.setFlag('open', false)).flags.open, false)
  assert.equal((await c.setFlag('nope', true)).error, 'flag')
  assert.equal((await c.report('bad room!', {})).error, 'rid')
  await c.report('world-0001-r1', { wid: 'world-0001', kids: 12, staff: 1, frozen: false })
  await c.report('solo-room-7', { kids: 3, staff: 0, frozen: true, alias: 'LEAK', ref: 'LEAK' })
  const st = await c.state()
  assert.equal(st.flags.open, false)
  assert.deepEqual(st.rooms.map((r) => r.rid), ['solo-room-7', 'world-0001-r1'])
  assert.ok(!JSON.stringify(st).includes('LEAK'), 'nothing but ids and counts')
  await c.report('solo-room-7', { kids: 0, staff: 0 })
  assert.equal((await c.state()).rooms.length, 1, 'an empty room is forgotten')
  t += ROOM_STALE_MS + 1
  assert.equal((await c.state()).rooms.length, 0, 'a room that stopped reporting is dropped')
})

test('control: login mints a 5-minute admin control ticket; wrong passwords are limited per address', async () => {
  let t = 1_000_000_000
  const c = makeControl(mem(), { now: () => t })
  const hash = await sha256Hex('open sesame')
  assert.equal((await c.login('open sesame', '', 'tag1', SECRET, 'solvay')).error, 'not-configured')
  const r = await c.login('open sesame', hash.toUpperCase(), 'tag1', SECRET, 'solvay')
  assert.ok(r.ok && r.ticket && r.exp === Math.floor(t / 1000) + 300)
  const v = await verifyToken(r.ticket, [SECRET], Math.floor(t / 1000))
  assert.ok(v.ok && isControlTicket(v.claims) && v.claims.alias === 'Master Control')
  const game = await signToken({ v: 1, ref: 'staffref-1', room: 'world-0001-r1', alias: 'Ms Teacher', exp: Math.floor(t / 1000) + 200, jti: 'jti-game-0002', role: 'admin', amr: ['passkey'], cfg: 'solvay' }, SECRET)
  assert.ok(!isControlTicket((await verifyToken(game, [SECRET], Math.floor(t / 1000))).claims), 'a staff game ticket is not a control ticket')
  for (let i = 0; i < LOGIN_TRIES - 1; i++) assert.equal((await c.login('nope', hash, 'tag2', SECRET, 'solvay')).error, 'password')
  const last = await c.login('nope', hash, 'tag2', SECRET, 'solvay')
  assert.equal(last.error, 'password'); assert.equal(last.wait, 600)
  assert.equal((await c.login('open sesame', hash, 'tag2', SECRET, 'solvay')).error, 'slow-down', 'even the right password waits now')
  assert.ok((await c.login('open sesame', hash, 'tag3', SECRET, 'solvay')).ok, 'another address is not affected')
  t += 11 * 60 * 1000
  assert.ok((await c.login('open sesame', hash, 'tag2', SECRET, 'solvay')).ok, 'after the wait the address may try again')
})

test('control: action shapes', () => {
  assert.deepEqual(parseAction('open', { on: true }).args, { on: true })
  assert.ok(parseAction('open', { on: 'yes' }).error)
  assert.deepEqual(parseAction('freeze', { room: 'world-0001-r1', on: false }).args, { room: 'world-0001-r1', on: false })
  assert.deepEqual(parseAction('kick', { room: 'r1', alias: '  Pup 01  ' }).args, { room: 'r1', alias: 'Pup 01' })
  assert.ok(parseAction('kick', { room: 'r1' }).error)
  assert.deepEqual(parseAction('rollback', { room: 'r1', minutes: 5.7 }).args, { room: 'r1', minutes: 5 })
  assert.ok(parseAction('rollback', { room: 'r1', minutes: 0 }).error && parseAction('rollback', { room: 'r1', minutes: 1e6 }).error)
  assert.ok(parseAction('explode', {}).error && parseAction('freeze', { room: '../x', on: true }).error)
})

test('worker: /rt/staff/login and /rt/control/* with origin, CORS, ticket and the multiplayer switch', async () => {
  const hash = await sha256Hex('open sesame')
  const store = mem(); let t = Date.now()
  const ctl = makeControl(store, { now: () => t })
  const calls = []
  const env = {
    ALLOWED_ORIGINS: 'https://apps.kulibert.net', ROOM_JOIN_SECRET: SECRET, STAFF_PASS_HASH: hash,
    CONTROL: { idFromName: (n) => n, get: () => ({ flags: () => ctl.flags(), setFlag: (k, on) => ctl.setFlag(k, on), state: () => ctl.state(), login: (...a) => ctl.login(...a), report: (...a) => ctl.report(...a) }) },
    ROOMS: { idFromName: (n) => n, get: (id) => ({ control: async (f) => { calls.push([id, f]); return f.a === 'kick' && f.alias === 'Nobody' ? { error: 'no-such-player' } : { ok: true } }, fetch: async () => new Response(null, { status: 101 }) }) },
  }
  const post = (path, body, headers = {}) => worker.fetch(new Request('https://class.kulibert.net' + path, { method: 'POST', headers: { Origin: 'https://apps.kulibert.net', 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) }), env)
  const pre = await worker.fetch(new Request('https://class.kulibert.net/rt/control/state', { method: 'OPTIONS', headers: { Origin: 'https://apps.kulibert.net' } }), env)
  assert.equal(pre.status, 204); assert.equal(pre.headers.get('access-control-allow-origin'), 'https://apps.kulibert.net')
  assert.equal((await worker.fetch(new Request('https://class.kulibert.net/rt/staff/login', { method: 'POST', headers: { Origin: 'https://evil.example' }, body: '{}' }), env)).status, 403, 'another origin is refused')
  assert.equal((await post('/rt/staff/login', { pass: 'nope' })).status, 401)
  const login = await post('/rt/staff/login', { pass: 'open sesame' })
  assert.equal(login.status, 200); const { ticket } = await login.json()
  assert.equal((await post('/rt/control/state', {})).status, 401, 'no ticket')
  const auth = { Authorization: 'Bearer ' + ticket }
  const stR = await post('/rt/control/state', {}, auth); const st = await stR.json()
  assert.deepEqual(st.flags, { open: true, chat: true }, 'state ' + stR.status + ' ' + JSON.stringify(st))
  assert.equal((await (await post('/rt/control/open', { on: false }, auth)).json()).flags.open, false)
  assert.equal((await post('/rt/control/freeze', { room: 'world-0001-r1', on: true }, auth)).status, 200)
  assert.equal((await post('/rt/control/kick', { room: 'world-0001-r1', alias: 'Nobody' }, auth)).status, 400)
  assert.equal((await post('/rt/control/rollback', { room: 'world-0001-r1', minutes: 5 }, auth)).status, 200)
  assert.deepEqual(calls.map((c) => c[1].a), ['freeze', 'kick', 'rollback'])
  assert.equal((await post('/rt/control/explode', {}, auth)).status, 404)
  assert.equal((await post('/rt/control/freeze', { room: 'r1' }, auth)).status, 400)
  // the multiplayer switch: a kid's socket is refused while open=false, staff still get in
  const sock = async (role) => worker.fetch(new Request('https://class.kulibert.net/rt/ws', { headers: { Upgrade: 'websocket', Origin: 'https://apps.kulibert.net', 'Sec-WebSocket-Protocol': 'bt-room.v0, ' + await signToken({ v: 1, ref: 'testref-' + role, room: 'solo-room-1', alias: 'Pup ' + role, exp: Math.floor(Date.now() / 1000) + 60, jti: 'jti-' + role + '-' + Math.random().toString(36).slice(2, 10), role, ...(role === 'kid' ? {} : { amr: ['passkey'] }), cfg: 'solvay' }, SECRET) } }), env)
  assert.equal((await sock('kid')).status, 503)
  assert.equal((await sock('teacher')).status, 101)
  await ctl.setFlag('open', true)
  assert.equal((await sock('kid')).status, 101)
  // a staff GAME ticket is not a control ticket
  const game = await signToken({ v: 1, ref: 'staffref-1', room: 'world-0001-r1', alias: 'Ms Teacher', exp: Math.floor(Date.now() / 1000) + 200, jti: 'jti-game-0001', role: 'admin', amr: ['passkey'], cfg: 'solvay' }, SECRET)
  assert.equal((await post('/rt/control/state', {}, { Authorization: 'Bearer ' + game })).status, 401)
})
