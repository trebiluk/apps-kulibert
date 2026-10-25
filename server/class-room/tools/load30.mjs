// Headless load test: 30 fake kids against one room, over real WebSockets.
//
//   Terminal 1:  cp .dev.vars.example .dev.vars   (once)   then   npm run dev
//   Terminal 2:  ROOM_JOIN_SECRET=<same value as in .dev.vars> npm run test:load -- --seconds=20
//
// Options (all optional):  --url=ws://127.0.0.1:8787/rt/ws   --origin=http://127.0.0.1:8787
//   --clients=30  --seconds=20  --maxBytesPerSec=8000  --maxRttP95=250
//
// A teacher ticket opens the room first (kids cannot join a room no staff has opened),
// then 30 kids join. Tickets are one-use, so every connection gets a fresh one.
//
// Every name here is fake ("Fake Pup 07"). No student data is used anywhere.
// This runs on one computer. It proves the server keeps up and behaves; it says
// nothing about a low-end Chromebook on school Wi-Fi. That is a separate test.
import WebSocket from 'ws'
import { signToken } from '../src/token.js'
import { PROTOCOL, MAX_PLAYERS, CLOSE } from '../src/protocol.js'

const arg = Object.fromEntries(process.argv.slice(2).filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')))
const URL = arg.url || process.env.ROOM_URL || 'ws://127.0.0.1:8787/rt/ws'
const ORIGIN = arg.origin || process.env.ROOM_ORIGIN || 'http://127.0.0.1:8787'
const SECRET = process.env.ROOM_JOIN_SECRET
const N = Number(arg.clients || 30)
const SECONDS = Number(arg.seconds || 20)
const BYTES_BUDGET = Number(arg.maxBytesPerSec || 8000)
const RTT_P95_MS = Number(arg.maxRttP95 || 250)
const ROOM = 'loadtest-' + Date.now().toString(36)
const LEAK = 'LOADTEST-LEAK-MARKER'

if (!SECRET || SECRET.length < 16) {
  console.error('Set ROOM_JOIN_SECRET to the same value as in .dev.vars (at least 16 characters).')
  process.exit(2)
}
if (N < 6) { console.error('--clients must be at least 6'); process.exit(2) }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const pad = (n, w = 3) => String(n).padStart(w, '0')
const pct = (arr, p) => {
  if (!arr.length) return NaN
  const s = [...arr].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))]
}
const fmt = (n) => (Number.isFinite(n) ? (Math.round(n * 10) / 10).toString() : 'n/a')

let jtiN = 0
const mint = (i, over = {}, secret = SECRET) =>
  signToken({
    v: 1, ref: 'loadref-' + pad(i), room: ROOM, alias: 'Fake Pup ' + pad(i, 2),
    exp: Math.floor(Date.now() / 1000) + 60, jti: 'loadjti-' + Date.now().toString(36) + '-' + (++jtiN),
    role: 'kid', cfg: 'period', ...over,
  }, secret)
const mintTeacher = () => mint('T', { ref: 'staffref-load', alias: 'Fake Teacher', role: 'teacher', amr: ['passkey'] })

function connect(label, token, { origin = ORIGIN, protocols } = {}) {
  return new Promise((resolve) => {
    const c = {
      label, ws: null, id: null, known: new Map(), snaps: 0, bytes: 0, snapAt: [], rtts: [], pings: new Map(), pingN: 0,
      errs: [], q: 0, joins: 0, leaves: 0, fulls: 0, leaks: 0, selfSeen: 0, closeCode: null, status: null,
    }
    const ws = new WebSocket(URL, protocols ?? [PROTOCOL, token], { origin })
    c.ws = ws
    ws.on('unexpected-response', (req, res) => { c.status = res.statusCode; res.resume(); resolve(c) })
    ws.on('error', () => {})
    ws.on('close', (code) => { c.closeCode = code; resolve(c) })
    ws.on('message', (data) => {
      const raw = data.toString()
      c.bytes += Buffer.byteLength(raw)
      if (raw.includes(LEAK)) c.leaks++
      let m
      try { m = JSON.parse(raw) } catch (e) { return }
      if (m.t === 'hello') {
        c.id = m.you
        for (const p of m.players) c.known.set(p.i, p.a)
        resolve(c)
      } else if (m.t === 'join') { c.known.set(m.i, m.a); c.joins++ }
      else if (m.t === 'leave') { c.known.delete(m.i); c.leaves++ }
      else if (m.t === 's') {
        c.snaps++
        c.snapAt.push(performance.now())
        for (const e of m.p) if (e[0] === c.id) c.selfSeen++
      } else if (m.t === 'pong') {
        const at = c.pings.get(m.n)
        if (at !== undefined) { c.rtts.push(performance.now() - at); c.pings.delete(m.n) }
      } else if (m.t === 'full') c.fulls++
      else if (m.t === 'err') c.errs.push(m.c)
    })
  })
}

const fails = []
const check = (ok, msg) => {
  if (!ok) fails.push(msg)
  console.log((ok ? 'PASS  ' : 'FAIL  ') + msg)
}

async function main() {
  console.log(`room ${ROOM}: ${N} fake clients, ${SECONDS}s, ${URL}`)

  // ---- 0. a closed room refuses kids; the teacher opens it
  const early = await connect('early-kid', await mint(99))
  check(early.status === 403, 'before any teacher joins, a kid is refused (403 closed)')
  const teacher = await connect('teacher', await mintTeacher())
  check(!!teacher.id, 'a teacher ticket (with a passkey claim) opens the room')
  const teacherPing = setInterval(() => teacher.ws.send(JSON.stringify({ v: 0, t: 'ping', n: ++teacher.pingN })), 10000)

  // ---- 1. everyone joins
  const clients = await Promise.all(
    Array.from({ length: N }, (_, k) => mint(k + 1).then((tok) => connect('kid' + (k + 1), tok))),
  )
  check(clients.every((c) => c.id), `all ${N} clients joined (got hello)`)
  await sleep(700)
  check(clients.every((c) => c.known.size === N), `every client knows the ${N - 1} other kids and the teacher`)
  check(new Set([teacher, ...clients].map((c) => c.id)).size === N + 1, 'every socket got a different room id')

  // ---- 2. cap
  if (N === MAX_PLAYERS) {
    const extra = await connect('extra', await mint(N + 1))
    check(extra.fulls === 1 && extra.closeCode === CLOSE.FULL, `client ${N + 1} is told "full" and closed with ${CLOSE.FULL}`)
  }

  // ---- 3. presence at 5 Hz
  for (const c of clients) { c.bytes = 0; c.snaps = 0; c.snapAt = []; c.rtts = []; c.selfSeen = 0; c.leaks = 0 }
  const t0 = performance.now()
  const timers = clients.map((c, k) => setInterval(() => {
    const t = (performance.now() - t0) / 1000
    c.ws.send(JSON.stringify({ v: 0, t: 'p', q: c.q++, x: k * 10 + 5 * Math.cos(t + k), y: 64, z: -20 + 5 * Math.sin(t + k), r: (t * 40 + k * 12) % 360, f: 0 }))
  }, 200))
  const pingers = clients.map((c) => setInterval(() => {
    const n = ++c.pingN
    c.pings.set(n, performance.now())
    c.ws.send(JSON.stringify({ v: 0, t: 'ping', n }))
  }, 1000))
  await sleep(SECONDS * 1000)
  timers.forEach(clearInterval)
  pingers.forEach(clearInterval)
  await sleep(400)

  const rate = clients.map((c) => c.snaps / SECONDS)
  const gaps = clients.flatMap((c) => c.snapAt.slice(1).map((t, i) => t - c.snapAt[i]))
  const bps = clients.map((c) => c.bytes / SECONDS)
  const rtts = clients.flatMap((c) => c.rtts)
  console.log('')
  console.log('metric                      min      median   p95      max')
  const row = (name, a) => console.log(name.padEnd(26), [Math.min(...a), pct(a, 50), pct(a, 95), Math.max(...a)].map((v) => fmt(v).padEnd(8)).join(' '))
  row('snapshots per second', rate)
  row('gap between snapshots ms', gaps)
  row('download bytes per second', bps)
  row('ping round trip ms', rtts)
  console.log('')

  check(Math.min(...rate) >= 4 && Math.max(...rate) <= 6, 'every client gets about 5 snapshots per second (4 to 6)')
  check(pct(gaps, 95) <= 500, 'p95 gap between snapshots is 500 ms or less')
  check(pct(bps, 95) <= BYTES_BUDGET, `p95 download is ${BYTES_BUDGET} bytes per second or less`)
  check(rtts.length >= N * (SECONDS - 3) && pct(rtts, 95) <= RTT_P95_MS, `p95 ping round trip is ${RTT_P95_MS} ms or less (local only)`)
  check(clients.reduce((s, c) => s + c.selfSeen, 0) === 0, 'nobody was ever sent their own position')
  check(clients.reduce((s, c) => s + c.leaks, 0) === 0, 'no smuggled text reached any client')
  check(clients.every((c) => !c.closeCode), 'nobody was disconnected during the run')

  // ---- 4. leaving
  const leavers = clients.slice(-5)
  const stayers = clients.slice(0, -5)
  for (const c of stayers) c.leaves = 0
  leavers.forEach((c) => c.ws.close(1000))
  await sleep(700)
  check(stayers.every((c) => c.leaves === 5), 'the other clients were told about all 5 leavers')

  // ---- 4b. text, world-making and staff powers: each attempt ends the connection, nothing leaks
  for (const c of stayers) c.leaks = 0
  const attempts = [
    ['chat', { v: 0, t: 'chat', m: LEAK }, 'type'],
    ['extra field on a position', { v: 0, t: 'p', q: 1, x: 1, y: 64, z: 1, r: 0, f: 0, m: LEAK }, 'keys'],
    ['create a world', { v: 0, t: 'create', name: LEAK }, 'type'],
    ['host a world', { v: 0, t: 'host', name: LEAK }, 'type'],
    ['invite a friend', { v: 0, t: 'invite', to: LEAK }, 'type'],
    ['upload a world file', { v: 0, t: 'upload', data: LEAK }, 'type'],
    ['kid sends a staff command', { v: 0, t: 'st', a: 'freeze', on: 1 }, 'role'],
    ['wrong protocol version', { v: 9, t: 'ping', n: 1 }, 'version'],
  ]
  for (const [label, frame, code] of attempts) {
    const bad = await connect('bad-' + label, await mint(70 + attempts.findIndex((a) => a[0] === label)))
    bad.ws.send(JSON.stringify(frame))
    await sleep(250)
    check(bad.closeCode === CLOSE.BAD && bad.errs.includes(code), `${label}: refused with "${code}" and the connection closed (${CLOSE.BAD})`)
  }
  check(stayers.reduce((s, c) => s + c.leaks, 0) === 0, 'no smuggled text reached any other client')

  // ---- 5. same kid, second tab
  const second = await connect('kid1-second-tab', await mint(1))
  await sleep(300)
  check(clients[0].closeCode === CLOSE.REPLACED && !!second.id, `a second tab replaces the first (old socket closed ${CLOSE.REPLACED})`)

  // ---- 6. the gate refuses what it should
  const status = async (label, tok, o) => (await connect(label, tok, o)).status
  check((await status('wrong-secret', await mint(40, {}, 'some-other-secret-0123456789'))) === 401, 'token signed with another secret: 401')
  check((await status('expired', await mint(41, { exp: Math.floor(Date.now() / 1000) - 120 }))) === 401, 'expired token: 401')
  check((await status('bidi-alias', await mint(42, { alias: 'Fake‮Pup' }))) === 401, 'alias with a bidi control character: 401')
  check((await status('email-alias', await mint(43, { alias: 'kid@school.org' }))) === 401, 'alias that looks like an email: 401')
  check((await status('bad-origin', await mint(44), { origin: 'https://evil.example' })) === 403, 'wrong browser origin: 403')
  check((await status('no-protocol', null, { protocols: [] })) === 401, 'no subprotocol and no token: 401')
  check((await status('bad-config', await mint(45, { cfg: 'myrealm' }))) === 401, 'a config that is not one of the 7: 401')
  check((await status('kid-as-staff', await mint(46, { role: 'teacher' }))) === 401, 'staff role without a passkey claim: 401')
  check((await status('wrong-config', await mint(47, { cfg: 'game' }))) === 403, 'a kid ticket for a different config than the room: 403')
  const reuse = await mint(48)
  await connect('first-use', reuse)
  check((await status('replayed', reuse)) === 401, 'the same ticket used twice: 401')

  // ---- done
  clearInterval(teacherPing)
  teacher.ws.close(1000)
  second.ws.close(1000)
  stayers.forEach((c) => { try { c.ws.close(1000) } catch (e) {} })
  await sleep(300)
  console.log('')
  console.log(fails.length ? `FAILED: ${fails.length} check(s)` : 'ALL CHECKS PASSED')
  console.log('Local run only. A low-end Chromebook on school Wi-Fi needs its own test.')
  process.exit(fails.length ? 1 : 0)
}

main().catch((e) => { console.error(e); process.exit(1) })
