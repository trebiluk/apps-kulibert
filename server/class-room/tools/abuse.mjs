// Abuse test: everything below must be REJECTED by the server. Real WebSockets.
//
//   Terminal 1:  cp .dev.vars.example .dev.vars   (once)   then   npm run dev
//   Terminal 2:  ROOM_JOIN_SECRET=<same value as in .dev.vars> npm run test:abuse
//
// Options: --url=ws://127.0.0.1:8787/rt/ws  --origin=http://127.0.0.1:8787
//
// Groups: fake tickets, replayed tickets, replayed messages, malformed/oversized/unknown
// messages, text and world-making attempts, speed hacks, floods, kid using staff powers,
// repeat offenders (kick -> temp-ban), connection hammering.
// A watcher kid sits in the room the whole time and must never receive anything forged.
// All names are fake. Exit code 0 only if every attack was rejected.
import WebSocket from 'ws'
import { signToken } from '../src/token.js'
import { PROTOCOL, CLOSE, MAX_TOKEN_TTL_SEC, MAX_STAFF_TOKEN_TTL_SEC } from '../src/protocol.js'

const arg = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const URL = arg.url || process.env.ROOM_URL || 'ws://127.0.0.1:8787/rt/ws'
const ORIGIN = arg.origin || process.env.ROOM_ORIGIN || 'http://127.0.0.1:8787'
const SECRET = process.env.ROOM_JOIN_SECRET
if (!SECRET || SECRET.length < 16) { console.error('Set ROOM_JOIN_SECRET to the same value as in .dev.vars (at least 16 characters).'); process.exit(2) }

const ROOM = 'abuse-' + Date.now().toString(36)
const MARK = 'ABUSE-LEAK-MARKER'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const now = () => Math.floor(Date.now() / 1000)
let jn = 0
const claims = (i, o = {}) => ({
  v: 1, ref: 'abuseref-' + String(i).padStart(4, '0'), room: ROOM, alias: 'Fake Pup ' + String(i).padStart(2, '0'),
  exp: now() + 60, jti: 'abusejti-' + Date.now().toString(36) + '-' + (++jn), role: 'kid', cfg: 'period', ...o,
})
const mint = (i, o = {}, secret = SECRET) => signToken(claims(i, o), secret)
const teacherTicket = () => mint('T', { ref: 'staffref-abuse', alias: 'Fake Teacher', role: 'teacher', amr: ['passkey'] })
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')

function connect(token, { origin = ORIGIN, protocols } = {}) {
  return new Promise((resolve) => {
    const c = { ws: null, id: null, status: null, closeCode: null, errs: [], fixes: [], got: [], q: 0, frz: 0 }
    const ws = new WebSocket(URL, protocols ?? [PROTOCOL, token], { origin })
    c.ws = ws
    ws.on('unexpected-response', (req, res) => { c.status = res.statusCode; res.resume(); resolve(c) })
    ws.on('error', () => {})
    ws.on('close', (code) => { c.closeCode = code; resolve(c) })
    ws.on('message', (data) => {
      const raw = data.toString()
      c.got.push(raw)
      let m; try { m = JSON.parse(raw) } catch (e) { return }
      if (m.t === 'hello') { c.id = m.you; resolve(c) }
      else if (m.t === 'err') c.errs.push(m.c)
      else if (m.t === 'fix') c.fixes.push(m)
      else if (m.t === 'frz') c.frz = m.on
    })
    c.pos = (o = {}) => ws.send(JSON.stringify({ v: 0, t: 'p', q: c.q++, x: 0, y: 64, z: 0, r: 0, f: 0, ...o }))
    c.raw = (s) => ws.send(s)
    c.json = (o) => ws.send(JSON.stringify(o))
  })
}

const fails = []
const check = (ok, msg) => { if (!ok) fails.push(msg); console.log((ok ? 'PASS  ' : 'FAIL  ') + msg) }
const closes = async (c, code) => { for (let i = 0; i < 20 && !c.closeCode; i++) await sleep(50); return c.closeCode === code }
const refused = async (token, want, o) => (await connect(token, o)).status === want

async function main() {
  console.log(`abuse test: room ${ROOM}, ${URL}`)

  // ---- setup: a teacher opens the room, a watcher kid sits in it
  const teacher = await connect(await teacherTicket())
  check(!!teacher.id, 'setup: teacher ticket (with passkey claim) opens the room')
  const watcher = await connect(await mint(1))
  check(!!watcher.id, 'setup: watcher kid joined')

  // ---- 1. fake tickets (all must be 401 before reaching the room)
  console.log('\n-- fake tickets')
  const good = await mint(2)
  const [p, s] = good.split('.')
  const T = [
    ['garbage', 'garbage'],
    ['empty payload', '.'],
    ['alg none, no signature', b64({ alg: 'none' }) + '.' + b64(claims(2)) + '.'],
    ['unsigned claims', b64(claims(2)) + '.'],
    ['wrong secret', await mint(2, {}, 'some-other-secret-0123456789')],
    ['tampered payload (alias changed)', b64(claims(2, { alias: 'Someone Else' })) + '.' + s],
    ['promoted to admin, old signature', b64(claims(2, { role: 'admin', amr: ['passkey'] })) + '.' + s],
    ['tampered signature', p + '.' + s.slice(0, -3) + 'AAA'],
    ['expired', await mint(2, { exp: now() - 300 })],
    ['lives too long (kid ticket)', await mint(2, { exp: now() + MAX_TOKEN_TTL_SEC + 120 })],
    ['lives too long (staff ticket)', await mint(2, { role: 'teacher', amr: ['passkey'], exp: now() + MAX_STAFF_TOKEN_TTL_SEC + 120 })],
    ['staff without passkey claim', await mint(2, { role: 'teacher' })],
    ['staff with password claim', await mint(2, { role: 'teacher', amr: ['pwd'] })],
    ['unknown role', await mint(2, { role: 'owner' })],
    ['not one of the 7 configs', await mint(2, { cfg: 'myrealm' })],
    ['kid-hosted style config', await mint(2, { cfg: 'kid-hosted' })],
    ['extra claim (email)', await mint(2, { email: 'kid@school.org' })],
    ['alias with bidi control', await mint(2, { alias: 'Fake‮Pup' })],
    ['alias that is an email', await mint(2, { alias: 'kid@school.org' })],
    ['alias with an emoji', await mint(2, { alias: 'Fake 🐶' })],
  ]
  for (const [label, tok] of T) check(await refused(tok, 401), `fake ticket refused (401): ${label}`)
  check(await refused(await mint(2), 403, { origin: 'https://evil.example' }), 'wrong browser origin refused (403)')
  check((await connect(null, { protocols: [] })).status === 401, 'no ticket at all refused (401)')
  check((await connect(good, { protocols: [good] })).status === 401, 'ticket without our protocol name refused (401)')

  // ---- 2. replayed ticket
  console.log('\n-- replayed ticket')
  const once = await mint(3)
  const first = await connect(once)
  check(!!first.id, 'a ticket works the first time')
  check(await refused(once, 401), 'the same ticket again is refused (401)')
  first.ws.close(1000)

  // ---- 3. malformed / oversized / unknown / text / world-making (each must end the connection)
  console.log('\n-- bad messages (each connection must be closed with ' + CLOSE.BAD + ')')
  const bad = [
    ['not JSON', (c) => c.raw('{"v":0,"t":"p",'), 'json'],
    ['JSON array', (c) => c.raw('[1,2,3]'), 'shape'],
    ['missing version', (c) => c.json({ t: 'ping', n: 1 }), 'version'],
    ['wrong version', (c) => c.json({ v: 1, t: 'ping', n: 1 }), 'version'],
    ['unknown type', (c) => c.json({ v: 0, t: 'teleport', x: 1 }), 'type'],
    ['prototype type', (c) => c.raw('{"v":0,"t":"__proto__"}'), 'type'],
    ['extra key on position', (c) => c.pos({ m: MARK }), 'keys'],
    ['position as strings', (c) => c.pos({ x: '5' }), 'pos'],
    ['position NaN-ish (huge)', (c) => c.pos({ x: 1e300 }), 'pos'],
    ['negative sequence', (c) => c.pos({ q: -5 }), 'seq'],
    ['oversized frame', (c) => c.pos({ pad: 'x'.repeat(500) }), 'big'],
    ['binary frame', (c) => c.ws.send(Buffer.from([1, 2, 3, 4])), 'binary'],
    ['chat text', (c) => c.json({ v: 0, t: 'chat', m: MARK }), 'type'],
    ['sign text', (c) => c.json({ v: 0, t: 'sign', text: MARK }), 'type'],
    ['create a world', (c) => c.json({ v: 0, t: 'create', name: MARK }), 'type'],
    ['host a world', (c) => c.json({ v: 0, t: 'host', name: MARK }), 'type'],
    ['invite a friend', (c) => c.json({ v: 0, t: 'invite', to: MARK }), 'type'],
    ['realm', (c) => c.json({ v: 0, t: 'realm', name: MARK }), 'type'],
    ['upload a world file', (c) => c.json({ v: 0, t: 'upload', data: MARK }), 'type'],
    ['save a world', (c) => c.json({ v: 0, t: 'save', data: MARK }), 'type'],
    ['block edit (not in Phase 0)', (c) => c.json({ v: 0, t: 'b', x: 1, y: 64, z: 1, id: 3 }), 'type'],
    ['inventory change (not in Phase 0)', (c) => c.json({ v: 0, t: 'inv', id: 3, delta: 64 }), 'type'],
  ]
  let n = 10
  for (const [label, fn, code] of bad) {
    const c = await connect(await mint(n++))
    fn(c)
    const ok = await closes(c, CLOSE.BAD)
    check(ok && c.errs.includes(code), `${label}: refused ("${code}") and the connection closed`)
  }

  // ---- 4. kid uses staff powers
  console.log('\n-- kid uses staff powers (must be dropped)')
  for (const [label, frame] of [
    ['freeze', { v: 0, t: 'st', a: 'freeze', on: 1 }],
    ['kick the teacher', { v: 0, t: 'st', a: 'kick', i: teacher.id }],
    ['open the world', { v: 0, t: 'st', a: 'open' }],
    ['close the world', { v: 0, t: 'st', a: 'close' }],
    ['rollback', { v: 0, t: 'st', a: 'rollback' }],
  ]) {
    const c = await connect(await mint(n++))
    c.json(frame)
    check((await closes(c, CLOSE.BAD)) && c.errs.includes('role'), `kid ${label}: dropped with "role"`)
  }
  await sleep(300)
  check(watcher.frz === 0 && !watcher.closeCode, 'the room was not frozen or closed by any kid')

  // ---- 5. replayed messages
  console.log('\n-- replayed messages')
  const rp = await connect(await mint(n++))
  const frame = JSON.stringify({ v: 0, t: 'p', q: 7, x: 1, y: 64, z: 1, r: 0, f: 0 })
  rp.raw(frame)
  await sleep(100)
  rp.raw(frame)
  check((await closes(rp, CLOSE.BAD)) && rp.errs.includes('replay'), 'the same position frame sent twice: dropped ("replay")')
  const bk = await connect(await mint(n++))
  bk.pos({ q: 20 }); bk.pos({ q: 19 })
  check((await closes(bk, CLOSE.BAD)) && bk.errs.includes('replay'), 'a position frame with an older sequence number: dropped')

  // ---- 6. speed hacks
  console.log('\n-- speed hacks')
  const sp = await connect(await mint(n++))
  sp.pos({ x: 0, z: 0 })
  await sleep(250)
  sp.pos({ x: 900, z: 900 })
  await sleep(250)
  check(sp.fixes.length === 1 && sp.fixes[0].x === 0 && sp.fixes[0].z === 0, 'teleport: refused and the client is told to go back to its last good spot')
  for (let i = 0; i < 6; i++) { sp.pos({ x: 900 + i, z: 900 }); await sleep(30) }
  check(await closes(sp, CLOSE.ABUSE), `repeated teleports end in a kick (${CLOSE.ABUSE})`)
  const fly = await connect(await mint(n++))
  fly.pos({ y: 64 }); await sleep(250); fly.pos({ y: 300 }); await sleep(250)
  check(fly.fixes.length === 1, 'flying straight up 236 blocks in a quarter second: refused')
  const sky = await connect(await mint(n++))
  sky.pos({ y: 99999 }); await sleep(250); sky.pos({ y: 64 }); await sleep(250)
  check(sky.fixes.length === 0 && !sky.closeCode, 'a height outside the world is ignored (not accepted)')
  await sleep(500)
  check(!watcher.got.some((g) => g.includes('900,') || g.includes(',300,') || g.includes('99999')), 'no hacked position ever reached the watcher')

  // ---- 7. floods
  console.log('\n-- floods')
  const fl = await connect(await mint(n++))
  for (let i = 0; i < 600; i++) fl.raw('{"v":0,"t":"ping","n":1}')
  check(await closes(fl, CLOSE.ABUSE), `600 messages at once: flooder kicked (${CLOSE.ABUSE})`)
  const fl2 = await connect(await mint(n++))
  const t0 = Date.now()
  while (Date.now() - t0 < 4000 && !fl2.closeCode) fl2.pos({ x: 0, z: 0, q: fl2.q++ })
  check(await closes(fl2, CLOSE.ABUSE) || fl2.closeCode === CLOSE.BAD, 'a position flood is cut off')
  check(!watcher.closeCode, 'the watcher was still connected after all the floods')

  // ---- 8. repeat offender: kick, kick, temp-ban; other kids unaffected
  console.log('\n-- repeat offender')
  const bannedRef = 90
  for (let i = 0; i < 3; i++) {
    const c = await connect(await mint(bannedRef))
    c.json({ v: 0, t: 'host', name: MARK })
    await closes(c, CLOSE.BAD)
  }
  check(await refused(await mint(bannedRef), 403), 'after 3 strikes the kid is temporarily banned (403 on rejoin)')
  const other = await connect(await mint(91))
  check(!!other.id, 'another kid can still join')

  // ---- 9. hammering the door
  console.log('\n-- connection hammering')
  const results = await Promise.all(Array.from({ length: 120 }, (_, i) => mint(200 + i).then((t) => connect(t))))
  const slowed = results.filter((c) => c.status === 429).length
  const full = results.filter((c) => c.closeCode === CLOSE.FULL).length
  check(slowed + full > 0, `120 joins in a burst from one address: ${slowed} slowed (429), ${full} told full`)
  results.forEach((c) => { if (c.id) try { c.ws.close(1000) } catch (e) {} })

  // ---- the watcher saw nothing forged
  check(!watcher.got.some((g) => g.includes(MARK)), 'nothing from any attack reached the watcher')
  check(!watcher.got.some((g) => /abuseref-|staffref-/.test(g)), 'no opaque kid id ever reached the watcher')

  for (const c of [watcher, teacher, other]) if (c.id) c.ws.close(1000)
  await sleep(300)
  console.log('')
  console.log(fails.length ? `FAILED: ${fails.length} attack(s) were NOT rejected` : 'ALL ATTACKS REJECTED')
  process.exit(fails.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
