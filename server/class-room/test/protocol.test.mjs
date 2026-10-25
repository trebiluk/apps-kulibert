// Unit tests for the pure parts: aliases, frames, tokens, rate limit.
// Run: npm run test:unit        (plain Node 20+, no Cloudflare needed)
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanAlias, isOpaqueId, parseFrame, parsePos, frag, newBucket, takeToken,
  MAX_MSGS_PER_SEC, MAX_FRAME_CHARS, MAX_TOKEN_TTL_SEC, MAX_STAFF_TOKEN_TTL_SEC, CONFIG_IDS,
} from '../src/protocol.js'
import { signToken, verifyToken } from '../src/token.js'

const SECRET = 'unit-test-secret-0123456789abcdef'
const NOW = 1_800_000_000
const good = { v: 1, ref: 'kidref-0001', room: 'class-room-01', alias: 'Test Pup 01', exp: NOW + 60, jti: 'jti-00000001', role: 'kid', cfg: 'period' }
const staff = { ...good, role: 'teacher', amr: ['passkey'], ref: 'staffref-0001', alias: 'Teacher One' }

test('aliases: picked/generated names pass, in every script we ship', () => {
  assert.equal(cleanAlias('Test Pup 01'), 'Test Pup 01')
  assert.equal(cleanAlias('Мишко_7'), 'Мишко_7')            // uk/ru
  assert.equal(cleanAlias('Búho-3'), 'Búho-3')               // es
  assert.equal(cleanAlias('نمر ٣'), 'نمر ٣')                  // ar
  assert.equal(cleanAlias('گربه‌ها 2'), 'گربه‌ها 2') // fa-AF with ZWNJ
  assert.equal(cleanAlias('ድሙ 4'), 'ድሙ 4')                    // ti
  assert.equal(cleanAlias('Inzovu 5'), 'Inzovu 5')           // rw
  assert.equal(cleanAlias('  Test   Pup  '), 'Test Pup')     // trimmed, spaces collapsed
})

test('aliases: anything that could spoof, hide, or carry a message is refused', () => {
  const refused = [
    '', '   ', 'a'.repeat(25), '‮evil', 'Pup‮', 'Pup⁦x', 'Pup​x', // bidi + zero-width
    '-start', '_start', ' x'.trim() + '!', 'Pup <b>', 'hello@school.org', 'Pup 😀',
    'Pup\nPup', 'Pup\tPup', 'Pup/1', 'a' + '\u0301'.repeat(10), // 10 combining marks (NFC folds one into the letter; 9 remain, limit is 8)
  ]
  for (const a of refused) assert.equal(cleanAlias(a), null, JSON.stringify(a))
  assert.equal(cleanAlias(42), null)
  assert.equal(cleanAlias(null), null)
})

test('opaque ids', () => {
  assert.ok(isOpaqueId('kidref-0001'))
  assert.ok(!isOpaqueId('short'))
  assert.ok(!isOpaqueId('has space in it'))
  assert.ok(!isOpaqueId('a@b.c.example'))
  assert.ok(!isOpaqueId('x'.repeat(65)))
  assert.ok(!isOpaqueId(null))
})

const P = (o = {}) => JSON.stringify({ v: 0, t: 'p', q: 1, x: 1.26, y: -0.04, z: 3, r: -90, f: 2, ...o })

test('position frames are rounded and wrapped', () => {
  assert.deepEqual(parseFrame(P()), { t: 'p', q: 1, pos: { x: 1.3, y: 0, z: 3, r: 270, f: 2 } })
  assert.equal(Object.is(parseFrame(P()).pos.y, -0), false)
  assert.equal(parseFrame(P({ r: 725 })).pos.r, 5)
  assert.equal(parseFrame(P({ f: undefined })).pos.f, 0)
})

test('frames: bad, big, binary, unknown, extra-key and chat-like frames are all refused', () => {
  const cases = [
    ['not json', 'json'],
    ['[1,2]', 'shape'],
    ['null', 'shape'],
    [P({ v: 1 }), 'version'],
    ['{"t":"p","q":1,"x":1,"y":0,"z":0,"r":0}', 'version'],
    [P({ x: '1' }), 'pos'],
    [P({ x: 1e9 }), 'pos'],
    [P({ r: undefined }), 'pos'],
    [P({ f: 256 }), 'pos'],
    [P({ f: 1.5 }), 'pos'],
    [P({ q: -1 }), 'seq'],
    [P({ q: 1.5 }), 'seq'],
    [P({ q: undefined }), 'seq'],
    [P({ m: 'hello' }), 'keys'],
    [P({ alias: 'Someone' }), 'keys'],
    ['{"v":0,"t":"chat","m":"hi"}', 'type'],
    ['{"v":0,"t":"say","text":"hello"}', 'type'],
    ['{"v":0,"m":"hello"}', 'type'],
    ['{"v":0,"t":"__proto__"}', 'type'],
    ['{"v":0,"t":"constructor"}', 'type'],
    [P({ pad: 'x'.repeat(MAX_FRAME_CHARS) }), 'big'],
  ]
  for (const [raw, err] of cases) assert.deepEqual(parseFrame(raw), { err }, raw.slice(0, 60))
  assert.deepEqual(parseFrame(new ArrayBuffer(4)), { err: 'binary' })
  assert.deepEqual(parseFrame(new Uint8Array([1, 2, 3])), { err: 'binary' })
})

test('there is no frame to create, host, invite, upload or save a world', () => {
  for (const t of ['create', 'host', 'invite', 'realm', 'world', 'file', 'upload', 'save', 'share', 'join', 'chat', 'name', 'sign']) {
    assert.deepEqual(parseFrame(JSON.stringify({ v: 0, t })), { err: 'type' }, t)
    assert.deepEqual(parseFrame(JSON.stringify({ v: 0, t: 'st', a: t })), { err: 'staff' }, 'staff ' + t)
  }
})

test('ping frames are strict', () => {
  assert.deepEqual(parseFrame('{"v":0,"t":"ping","n":7}'), { t: 'ping', n: 7 })
  for (const raw of ['{"v":0,"t":"ping","n":-1}', '{"v":0,"t":"ping"}', '{"v":0,"t":"ping","n":"7"}', '{"v":0,"t":"ping","n":7,"m":"x"}']) {
    assert.ok(parseFrame(raw).err, raw)
  }
})

test('staff frames: exact shapes only', () => {
  const st = (o) => parseFrame(JSON.stringify({ v: 0, t: 'st', ...o }))
  assert.deepEqual(st({ a: 'kick', i: 4 }), { t: 'st', a: 'kick', i: 4 })
  assert.deepEqual(st({ a: 'freeze', on: 1 }), { t: 'st', a: 'freeze', on: 1 })
  assert.deepEqual(st({ a: 'open' }), { t: 'st', a: 'open' })
  assert.deepEqual(st({ a: 'close' }), { t: 'st', a: 'close' })
  assert.deepEqual(st({ a: 'rollback' }), { t: 'st', a: 'rollback' })
  for (const o of [{ a: 'kick' }, { a: 'kick', i: 0 }, { a: 'kick', i: 'x' }, { a: 'kick', i: 1, on: 1 }, { a: 'freeze' }, { a: 'freeze', on: 2 },
    { a: 'open', i: 1 }, { a: 'close', on: 1 }, { a: 'ban', i: 1 }, {}]) assert.deepEqual(st(o), { err: 'staff' }, JSON.stringify(o))
  assert.deepEqual(st({ a: 'open', zzz: 1 }), { err: 'keys' })
})

test('snapshot fragment is compact and numeric only', () => {
  assert.equal(frag(3, { x: 1.2, y: 5, z: -3.4, r: 90, f: 0 }), '[3,1.2,5,-3.4,90,0]')
  assert.ok(parsePos({ x: 0, y: 0, z: 0, r: 0 }))
})

test('rate limit: a normal client passes, a flood is cut off, tokens come back', () => {
  const b = newBucket(0)
  let ok = 0
  for (let i = 0; i < 100; i++) if (takeToken(b, 0)) ok++
  assert.equal(ok, MAX_MSGS_PER_SEC)               // burst is capped
  assert.ok(takeToken(b, 1000))                    // a second later it refills
  const c = newBucket(0)
  let passed = 0
  for (let t = 0; t < 10000; t += 200) { if (takeToken(c, t)) passed++; if (takeToken(c, t + 1)) passed++ } // ~10 msg/s for 10 s
  assert.equal(passed, 100)
})

test('tokens: round trip', async () => {
  const t = await signToken(good, SECRET)
  const v = await verifyToken(t, [SECRET], NOW)
  assert.deepEqual(v, { ok: true, claims: { ref: 'kidref-0001', room: 'class-room-01', world: null, grp: null, bld: 's', alias: 'Test Pup 01', jti: 'jti-00000001', exp: NOW + 60, role: 'kid', cfg: 'period' } })
  const sv = await verifyToken(await signToken(staff, SECRET), [SECRET], NOW)
  assert.equal(sv.ok, true)
  assert.equal(sv.claims.role, 'teacher')
})

test('tokens: a previous secret still verifies during rotation', async () => {
  const t = await signToken(good, SECRET)
  const v = await verifyToken(t, ['another-secret-0123456789abc', SECRET], NOW)
  assert.equal(v.ok, true)
})

test('tokens: a ticket names a room OR a world, never both, never neither; build and group are checked', async () => {
  const w = { ...good, world: 'world-0001' }
  delete w.room
  const ok = await verifyToken(await signToken({ ...w, grp: 'class-6a-01', bld: 't' }, SECRET), [SECRET], NOW)
  assert.deepEqual([ok.ok, ok.claims.world, ok.claims.room, ok.claims.grp, ok.claims.bld], [true, 'world-0001', null, 'class-6a-01', 't'])
  const why = async (o) => (await verifyToken(await signToken(o, SECRET), [SECRET], NOW)).why
  assert.equal(await why({ ...good, world: 'world-0001' }), 'id')
  assert.equal(await why({ ...w, room: undefined, world: undefined }), 'id')
  assert.equal(await why({ ...w, grp: 'bad grp' }), 'id')
  assert.equal(await why({ ...w, bld: 'x' }), 'bld')
})

test('tokens: every one of the 7 configs is accepted and nothing else is', async () => {
  assert.deepEqual(CONFIG_IDS, ['solvay', 'semester', 'period', 'game', 'loot', 'contest', 'seed'])
  for (const cfg of CONFIG_IDS) assert.equal((await verifyToken(await signToken({ ...good, cfg }, SECRET), [SECRET], NOW)).ok, true, cfg)
  for (const cfg of ['myrealm', 'Period', 'period ', '', 'kid-hosted', undefined, 7, null]) {
    const c = { ...good, cfg }
    if (cfg === undefined) delete c.cfg
    assert.equal((await verifyToken(await signToken(c, SECRET), [SECRET], NOW)).why, 'cfg', String(cfg))
  }
})

test('tokens: refused', async () => {
  const t = await signToken(good, SECRET)
  const why = async (token, secrets = [SECRET], now = NOW) => (await verifyToken(token, secrets, now)).why
  const sign = (o) => signToken(o, SECRET)

  assert.equal(await why(t, ['wrong-secret-0123456789abcdef']), 'sig')
  assert.equal(await why(t, []), 'no-secret')
  assert.equal(await why(t, ['short']), 'no-secret')                       // weak secret is not accepted
  assert.equal(await why(t, [undefined, SECRET]), undefined)               // missing PREV is fine
  assert.equal(await why(t, [SECRET], NOW + 61 + 30), 'expired')
  assert.equal(await why(await sign({ ...good, exp: NOW + MAX_TOKEN_TTL_SEC + 31 })), 'ttl')   // kid tickets: 2 minutes at most
  assert.equal(await why(await sign({ ...staff, exp: NOW + MAX_STAFF_TOKEN_TTL_SEC + 31 })), 'ttl')
  assert.equal(await why(await sign({ ...staff, exp: NOW + MAX_STAFF_TOKEN_TTL_SEC })), undefined)
  assert.equal(await why(await sign({ ...good, exp: 'soon' })), 'exp')
  assert.equal(await why(await sign({ ...good, v: 2 })), 'version')
  assert.equal(await why(await sign({ ...good, ref: 'x' })), 'id')
  assert.equal(await why(await sign({ ...good, room: 'has space here' })), 'id')
  assert.equal(await why(await sign({ ...good, jti: undefined })), 'id')
  assert.equal(await why(await sign({ ...good, alias: 'evil‮name' })), 'alias')
  assert.equal(await why(await sign({ ...good, alias: 'hi@school.org' })), 'alias')
  assert.equal(await why(await sign({ ...good, role: 'god' })), 'role')
  assert.equal(await why(await sign({ ...good, role: undefined })), 'role')
  assert.equal(await why(await sign({ ...staff, amr: undefined })), 'amr')            // staff without a passkey sign-in
  assert.equal(await why(await sign({ ...staff, amr: ['pwd'] })), 'amr')
  assert.equal(await why(await sign({ ...good, amr: ['passkey'] })), 'amr')          // kids do not carry amr
  assert.equal(await why('nodot'), 'shape')
  assert.equal(await why('a.b.c'), 'shape')
  assert.equal(await why(''), 'shape')
  assert.equal(await why(t.slice(0, -2) + 'AA'), 'sig')                    // tampered signature
  const [p, s] = t.split('.')
  const forged = Buffer.from(JSON.stringify({ ...good, alias: 'Someone Else' })).toString('base64url')
  assert.equal(await why(forged + '.' + s), 'sig')                         // payload changed, old signature
  const elevated = Buffer.from(JSON.stringify({ ...good, role: 'admin', amr: ['passkey'] })).toString('base64url')
  assert.equal(await why(elevated + '.' + s), 'sig')                       // a kid cannot promote their own ticket
  assert.equal(await why(p + '.' + '!!!'), 'b64')
  assert.equal(await why('{"alg":"none"}.'), 'sig')   // no unsigned tickets
})

test('tokens: nothing can carry a name or an email', async () => {
  for (const extra of [{ name: 'Real Name' }, { email: 'kid@school.org' }, { sub: 'x' }, { realm: 'mine' }, { host: 1 }]) {
    assert.equal((await verifyToken(await signToken({ ...good, ...extra }, SECRET), [SECRET], NOW)).why, 'claims', JSON.stringify(extra))
  }
  const v = await verifyToken(await signToken(good, SECRET), [SECRET], NOW)
  assert.deepEqual(Object.keys(v.claims).sort(), ['alias', 'bld', 'cfg', 'exp', 'grp', 'jti', 'ref', 'role', 'room', 'world'])
})
