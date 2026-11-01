// Part 1 live check: starts a real personal host on a free port and drives it over HTTP + WebSockets. First-run PIN,
// session code, 18+, reserved names, join, build (wild world, no town), owner tools (freeze, rollback, mute, rotate,
// ban, kick, end), restart keeps the PIN and the world. Fake names only.   node --no-warnings tools/home-owner-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 18890 + (process.pid % 100)
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-home-'))
const A = 'http://127.0.0.1:' + PORT
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
let child = null, key = null, token = null

async function start() {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (d) => { log += d }); child.stderr.on('data', (d) => { log += d })
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  if (!/owner page/.test(log)) throw new Error('host did not start: ' + log)
  key = /k=([0-9a-f]+)/.exec(log)[1]
  return log
}
const stop = async () => { await api('stop'); for (let i = 0; i < 60 && child.exitCode === null; i++) await sleep(50) }
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const pin = (p) => post('/owner/pin', { key, pin: p })
// each fake player comes from its own address so the per-address join limit is not what we measure here
let ipN = 10
const join = (b) => post('/join', b, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { ops: [], nos: [], hello: null, closed: null, frz: [], q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'o') c.ops.push(...f.o); else if (f.t === 'no') c.nos.push(f); else if (f.t === 'frz') c.frz.push(f.on) }
  c.ws.onclose = (e) => { c.closed = e.code + (e.reason ? ' ' + e.reason : '') }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello && !c.closed; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  return c
}
const refOf = async (name) => (await api('state')).live.players.find((p) => p.name === name)?.ref

try {
  const log = await start()
  eq(!/secret|pin/i.test(log.replace(/owner page.*k=[0-9a-f]+/, '')), 'start: the log names no secret or PIN')
  eq((await fetch(A + '/owner/state')).status === 401, 'owner API: refused without the owner token')
  eq((await pin('12345')).error === 'pin-format', 'first run: a 5-digit PIN is refused')
  eq((await post('/owner/pin', { key: 'wrong', pin: '246810' })).error === 'key', 'first run: the URL key is required')
  token = (await pin('246810')).token
  eq(!!token, 'first run: a 6-digit PIN is set and opens the page')
  eq((await pin('111111')).error === 'pin', 'later: a wrong PIN is refused')
  let bad = 0; for (let i = 0; i < 6; i++) if ((await pin('000000')).error === 'slow-down') bad++
  eq(bad >= 1, 'later: wrong PINs back off')
  token = (await pin('246810')).token || token

  eq((await api('session/start', {})).error === 'no world', 'session: needs an open world')
  eq((await api('world/open', { name: 'garden-world' })).ok === true, 'world: created and opened')
  const s1 = await api('session/start', { ruleset: 'home-survival' })
  eq(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/.test(s1.code), 'session: an 8-char code from the safe alphabet: ' + s1.code)
  const st = await api('state')
  eq(st.code === s1.code && st.live.session && st.live.session.cfg === 'home-survival', 'owner page: shows the code and the ruleset')
  await api('session/code/hide'); eq((await api('state')).code === null, 'owner page: the code can be hidden (never saved)')

  eq((await join({ code: s1.code, name: 'Sam', adults: false })).error === 'adults', 'join: 18+ confirm required')
  eq((await join({ code: s1.code, name: 'Owner', adults: true })).error === 'name-reserved', 'join: "Owner" is reserved')
  eq((await join({ code: 'NOPE2345', name: 'Sam', adults: true })).error === 'code', 'join: wrong code')
  eq((await join({ code: s1.code, name: 'Early', adults: true })).error === 'no-owner', 'join: before the owner is in, players are told to wait for the owner')
  const Ow = await sock(await api('play', { name: 'Diego' }))
  eq(Ow.hello && Ow.hello.role === 'a', 'owner: plays with the staff role')
  const sj = await join({ code: s1.code, name: 'Sam', adults: true }); const S = await sock(sj)
  const kj = await join({ code: s1.code, name: 'Kai', adults: true }); const K = await sock(kj)
  eq(S.hello && K.hello && K.hello.players.map((p) => p.a).sort().join() === 'Diego,Sam', 'join: two players in, they see each other and the owner')
  eq(sj.ruleset === 'home-survival' && sj.version, 'join: the reply carries the ruleset and the server version')

  for (const c of [Ow, S, K]) c.send({ t: 'p', q: c.q++, x: 10.5, y: 64, z: 10.5, r: 0, f: 0 }); await sleep(80)
  for (let i = 0; i < 6; i++) { S.send({ t: 'b', x: 10 + i, y: 64, z: 11, id: 1, b: 0 }); await sleep(120) }
  K.send({ t: 'b', x: 10, y: 66, z: 11, id: 10, b: 0 }); await sleep(400)
  eq(S.nos.length === 0 && K.nos.length === 0, 'build: a shared home world has no plots and no town: both may build at the spawn (' + [...S.nos, ...K.nos].map((n) => n.c).join(',') + ')')
  eq(K.ops.length === 7 && S.ops.length === 7, 'build: everyone saw all 7 edits (' + K.ops.length + ',' + S.ops.length + ')')
  let live = (await api('state')).live
  eq(live.head === 7 && live.players.length === 3 && live.recent[0].who === 'Kai', 'owner page: live view shows players and edits by name')

  await api('freeze', { on: true }); await sleep(100); S.send({ t: 'b', x: 30, y: 64, z: 11, id: 1, b: 0 }); await sleep(250)
  eq(S.nos.at(-1) && S.nos.at(-1).c === 'frozen' && K.frz.includes(1), 'freeze: edits refused, everyone told')
  await api('freeze', { on: false })
  const rb = await api('rollback', { minutes: 5, ref: await refOf('Sam') }); await sleep(400)
  eq(rb.ok && rb.applied === 6 && (await api('state')).live.head === 13, 'rollback: Sam\'s 6 edits undone as 6 new numbered edits (Kai\'s stays)')
  await api('mute', { ref: await refOf('Kai'), on: true })
  eq((await api('state')).live.players.find((p) => p.name === 'Kai').muted === true, 'mute: the flag shows on the owner page (chat lands in part 4)')

  const rot = await api('session/rotate')
  eq(rot.ok && rot.code !== s1.code, 'rotate: a new code')
  eq((await join({ code: s1.code, name: 'Pat', adults: true })).error === 'code', 'rotate: the old code stops at once')
  eq(!!(await join({ code: rot.code, name: 'Pat', adults: true })).ticket && S.closed === null, 'rotate: the new code works and people already in stay in')

  await api('ban', { ref: await refOf('Kai') }); await sleep(250)
  eq(String(K.closed).startsWith('4006'), 'ban: Kai is disconnected (' + K.closed + ')')
  eq((await join({ code: rot.code, name: 'Kai', adults: true })).error === 'banned', 'ban: Kai cannot rejoin this session')
  eq((await api('state')).live.bans.length === 1, 'ban: listed on the owner page')
  await api('kick', { ref: await refOf('Sam') }); await sleep(250)
  eq(String(S.closed).startsWith('4006'), 'kick: Sam is disconnected (' + S.closed + ')')
  await api('session/end'); await sleep(250)
  eq(String(Ow.closed).startsWith('4006') && (await join({ code: rot.code, name: 'Pat', adults: true })).error === 'ended', 'end: everyone out, the code is dead')

  // restart: PIN, key, world and edits survive; no session
  await stop()
  await start()
  token = (await pin('246810')).token
  eq(!!token, 'restart: the same PIN opens the page (hash kept)')
  const s2 = await api('state')
  eq(s2.world === 'garden-world' && s2.live.head === 13 && !s2.live.session && s2.code === null, 'restart: the world and its edits are back; no session and no code until the owner starts one')
  eq((await join({ code: rot.code, name: 'Pat', adults: true })).error === 'ended', 'restart: an old code is not accepted (codes are never reused)')
} catch (e) {
  fails++; console.log('FAIL  crashed: ' + (e && e.stack || e))
} finally {
  if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-owner-check: ${fails} FAIL` : 'home-owner-check: all PASS')
process.exit(fails ? 1 : 0)
