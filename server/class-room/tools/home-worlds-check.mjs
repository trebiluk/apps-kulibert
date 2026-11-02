// Part 14 check: several worlds open at once on one host — one session and code, join lands in the main world or a
// picked one, chat crosses worlds with a tag, /world switches, /list groups by world, closing one world keeps the
// others, worlds reopen after a restart.   node --no-warnings tools/home-worlds-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const PORT = 19580 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-worlds-')), A = 'http://127.0.0.1:' + PORT
let child = null, token = null, CODE = '', ipN = 50, log = ''
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (name, world) => post('/join', { code: CODE, name, adults: true, ...(world ? { world } : {}) }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { chat: [], oks: [], nos: [], frames: [], hello: null, closed: null, q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); c.frames.push(f); if (f.t === 'hello') c.hello = f; else if (f.t === 'chat') c.chat.push(f); else if (f.t === 'cmdok') c.oks.push(f); else if (f.t === 'cmdno') c.nos.push(f) }
  c.ws.onclose = (e) => { c.closed = { code: e.code, reason: e.reason } }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  return c
}
async function boot() {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA, '--show-chat'], { stdio: ['ignore', 'pipe', 'pipe'] })
  log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
}
try {
  await boot()
  const o1 = await api('world/open', { name: 'alpha-world-0001' }), o2 = await api('world/open', { name: 'beta-world-00002' })
  eq(o1.ok && o1.main === 'alpha-world-0001' && o2.ok && o2.main === 'alpha-world-0001' && o2.worlds.join() === 'alpha-world-0001,beta-world-00002', 'open: two worlds open at once; the first is the main one')
  eq((await (await fetch(A + '/worlds')).json()).worlds.length === 0, 'public /worlds lists nothing without a session')
  CODE = (await api('session/start', { ruleset: 'home-creative' })).code
  const pub = (await (await fetch(A + '/worlds')).json()).worlds
  eq(pub.length === 2 && pub[0].main === true && pub[0].players === 0 && !JSON.stringify(pub).includes(CODE), 'public /worlds: names, main flag and counts only, once a session is live')
  const O = await sock(await api('play', { name: 'Diego' }))
  const jA = await join('Ann Alpha'), jB = await join('Ben Beta', 'beta-world-00002'), jX = await join('Cat Pick', 'nope-world-00000')
  eq(jA.world === 'alpha-world-0001' && jB.world === 'beta-world-00002' && jX.world === 'alpha-world-0001' && jA.worlds.join() === 'alpha-world-0001,beta-world-00002', 'join: lands in the main world, or the picked open world; an unknown pick falls back to main; the reply lists the open worlds')
  const SA = await sock(jA), SB = await sock(jB), SX = await sock(jX); await sleep(300)
  const st = await api('state', {})
  eq(st.live.worlds.map((w) => w.name + ':' + w.players).join() === 'alpha-world-0001:3,beta-world-00002:1' && st.live.players.find((p) => p.name === 'Ben Beta').world === 'beta-world-00002', 'state: players per world (owner + 2 in alpha, 1 in beta)')
  eq(SA.hello.players.length === 1 && SB.hello.players.length === 0, 'rooms: each world has its own players (Ben sees nobody else in beta) ' + JSON.stringify({ a: SA.hello.players.length, b: SB.hello.players.length, bw: jB.world }))
  SB.send({ t: 'chat', m: 'hello from beta' }); await sleep(250)
  eq(SA.chat.some((c) => c.m === 'hello from beta' && c.w === 'beta-world-00002') && O.chat.some((c) => c.m === 'hello from beta') && /\[beta-world-00002\] Ben Beta: hello from beta/.test(log), 'cross chat: a line from beta reaches alpha with a world tag; the feed shows the world ' + JSON.stringify(SA.chat.slice(-1)) + ' ' + JSON.stringify(SB.nos))
  SA.send({ t: 'chat', m: '/list' }); await sleep(200)
  eq(SA.oks.some((o) => /In \(4\): alpha-world-0001\* \[3\].*beta-world-00002 \[1\] Ben Beta/.test(o.msg)), '/list groups by world (main starred)')
  SA.send({ t: 'chat', m: '/world' }); await sleep(200)
  eq(SA.oks.some((o) => /Open worlds: alpha-world-0001 \(main\), beta-world-00002 — you are in alpha-world-0001/.test(o.msg)), '/world alone lists the open worlds and where you are')
  SA.send({ t: 'chat', m: '/world beta' }); await sleep(250)
  eq(SA.frames.some((f) => f.t === 'switch' && f.world === 'beta-world-00002') && /Ann Alpha switches to world beta-world-00002/.test(log), '/world <name> answers with a switch frame (the game reloads into that world)')
  SA.send({ t: 'chat', m: '/world nope' }); SA.send({ t: 'chat', m: '/world alpha' }); await sleep(200)
  eq(SA.nos.some((n) => /No open world/.test(n.why)) && SA.oks.some((o) => /already in alpha/.test(o.msg)), '/world: unknown and current are told apart')
  // the switch, as the game does it: a fresh join naming the world
  SA.ws.close(); await sleep(200)
  const SA2 = await sock(await join('Ann Alpha', 'beta-world-00002')); await sleep(300)
  eq(SA2.hello.players.length === 1 && (await api('state', {})).live.worlds.map((w) => w.players).join() === '2,2', 'switch: rejoining with the world lands Ann in beta next to Ben')
  // block edits stay in their own world
  SB.send({ t: 'b', x: 5, y: 64, z: 5, id: 1, b: 0 }); await sleep(300)
  const rb = await api('rollback', { minutes: 5, world: 'alpha-world-0001' })
  eq(rb.ok && rb.cells === 0, 'edits in beta do not show up in a rollback of alpha')
  // closing one world keeps the other; the main one moves on; state and /worlds agree
  const cl = await api('world/close', { name: 'alpha-world-0001' }); await sleep(300)
  eq(cl.ok && cl.worlds.join() === 'beta-world-00002' && cl.main === 'beta-world-00002' && SX.closed && SX.closed.reason === 'world closed' && O.closed && !SB.closed && !SA2.closed, 'close: alpha closes (its players dropped), beta stays with its players, beta becomes main')
  eq((await api('world/open', { name: 'alpha-world-0001' })).ok && (await api('world/main', { name: 'alpha-world-0001' })).main === 'alpha-world-0001' && (await api('state', {})).live.worlds.find((w) => w.main).name === 'alpha-world-0001', 'reopen + make main: alpha is back and main again')
  let n = 0; for (; n < 9; n++) { const r = await api('world/open', { name: 'extra-world-000' + n }); if (r.error) break }
  eq(n === 6 && (await api('state', {})).live.worlds.length === 8, 'cap: at most 8 open worlds')
  // restart: the open set comes back
  await api('stop', {}); await sleep(500); if (child.exitCode === null) child.kill(); await sleep(200)
  await boot()
  const back = await api('state', {})
  eq(back.live.worlds.length === 8 && back.world === 'alpha-world-0001' && /reopened .*alpha-world-0001.*\(main alpha-world-0001/.test(log), 'restart: all open worlds reopen with the same main')
} catch (e) {
  eq(false, 'live run threw: ' + (e && e.message ? e.message.split('\n')[0] : e) + '\n' + log.split('\n').slice(-6).join('\n'))
} finally {
  try { await api('stop', {}) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-worlds-check: ${fails} FAIL` : 'home-worlds-check: all PASS')
process.exit(fails ? 1 : 0)
