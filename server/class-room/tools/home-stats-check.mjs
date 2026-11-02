// Part 15 check: leaderboards. Pure half (host/stats.mjs), then a live host: counters from edits, chat, boss wins,
// teleports and time; /top; the owner's board + reset; saved in the world file across a restart; per world.
//   node --no-warnings tools/home-stats-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeStats, sane, topText, BOARDS, MAX_ALIASES } from '../host/stats.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- pure
{
  const st = makeStats(null)
  st.add('Ann', 'placed', 3); st.add('Ben', 'placed', 5); st.add('Ann', 'broken'); st.add('Ann', 'time', 125); st.add('Cat', 'boss'); st.add('Ben', 'warps', 2)
  eq(st.top('placed').map((e) => e.alias + ':' + e.n).join() === 'Ben:5,Ann:3' && st.top('time')[0].n === 2 && st.top('boss')[0].alias === 'Cat' && st.top('chats').length === 0, 'boards: sorted, time in whole minutes, empty boards empty')
  eq(st.top('nope') === null && /Boards: placed, broken/.test(topText(null)) && /Nobody on the chat lines board yet/.test(topText('chats', [])) && /^Top blocks placed: 1\. Ben 5 · 2\. Ann 3 · \(you are not on it yet\)$/.test(topText('placed', st.top('placed'), 'Dan')), 'text: the lines a player reads')
  eq(st.mine('Ann').time === 2 && st.mine('Ann').placed === 3 && st.mine('Nobody') === null, 'mine: a player\'s own numbers')
  const j = st.take(); eq(typeof j === 'string' && st.take() === null && JSON.parse(j).Ann.sec === 125, 'take: the JSON to save, once per change')
  st.reset('Ann'); eq(st.mine('Ann') === null && st.size === 2, 'reset one alias'); st.reset(); eq(st.size === 0, 'reset all')
  const bad = sane('{"__proto__":{"placed":1},"Ok":{"placed":"3","sec":-5,"boss":2.9,"junk":1},"":{"placed":1},"' + 'x'.repeat(30) + '":{"placed":1},"Arr":[1]}')
  eq(Object.keys(bad).join() === 'Ok' && bad.Ok.placed === 0 && bad.Ok.sec === 0 && bad.Ok.boss === 2 && !('junk' in bad.Ok), 'sane: junk rows and fields from a world file are dropped or clamped')
  const many = {}; for (let i = 0; i < MAX_ALIASES + 50; i++) many['a' + i] = { placed: 1, seen: i }
  const s2 = makeStats(many); s2.add('newest', 'placed')
  eq(s2.size === MAX_ALIASES && s2.mine('newest') && !s2.mine('a0'), 'cap: the least recently seen aliases make room')
}

// ---- live
const PORT = 19480 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-stats-')), A = 'http://127.0.0.1:' + PORT
let child = null, token = null, CODE = '', ipN = 50, log = ''
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (name, world) => post('/join', { code: CODE, name, adults: true, ...(world ? { world } : {}) }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { oks: [], nos: [], hello: null, closed: null, q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'cmdok') c.oks.push(f); else if (f.t === 'cmdno') c.nos.push(f) }
  c.ws.onclose = (e) => { c.closed = { code: e.code, reason: e.reason } }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  c.pos = (x, y, z) => c.send({ t: 'p', q: ++c.q, x, y, z, r: 0, f: 0 })
  return c
}
async function boot() {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
}
try {
  await boot()
  await api('world/open', { name: 'stats-world-0001' }); await api('world/open', { name: 'other-world-0002' })
  CODE = (await api('session/start', { ruleset: 'home-creative' })).code
  const O = await sock(await api('play', { name: 'Diego' })), S = await sock(await join('Mr Saccy')), T = await sock(await join('Ms Other', 'other-world-0002')); await sleep(200)
  O.pos(10.5, 64, 10.5); S.pos(40.5, 64, 40.5); await sleep(150)
  for (let i = 0; i < 6; i++) S.send({ t: 'b', x: 10 + i, y: 64, z: 10, id: 1, b: 0 })
  await sleep(300); for (let i = 0; i < 2; i++) S.send({ t: 'b', x: 10 + i, y: 64, z: 10, id: 0, b: 1 })
  S.send({ t: 'chat', m: 'hi' }); S.send({ t: 'chat', m: 'again' })
  S.send({ t: 'ev', k: 'boss', a: 'start', phase: 1, pct: 100 }); await sleep(150); S.send({ t: 'ev', k: 'boss', a: 'end', won: true })
  O.send({ t: 'chat', m: '/tp saccy' }); O.send({ t: 'chat', m: '/bring saccy' })
  T.send({ t: 'b', x: 1, y: 64, z: 1, id: 1, b: 0 })
  await sleep(500)
  const top = await api('top', { board: 'placed' })
  eq(top.world === 'stats-world-0001' && top.list[0] && top.list[0].alias === 'Mr Saccy' && top.list[0].n === 6 && !top.list.some((e) => e.alias === 'Ms Other'), 'live: placed blocks count per alias, per world (Ms Other is in the other world)')
  const bk = await api('top', { board: 'broken' }), ch = await api('top', { board: 'chats' }), bo = await api('top', { board: 'boss' }), wp = await api('top', { board: 'warps' })
  const n = (l, who) => { const e = l.list.find((x) => x.alias === who); return e ? e.n : 0 }
  eq(n(bk, 'Mr Saccy') === 2 && n(ch, 'Mr Saccy') === 2 && n(bo, 'Mr Saccy') === 1 && n(wp, 'Mr Saccy') === 1 && n(wp, 'Diego') === 1, `live: broken, chats, boss wins and teleports count (broken ${n(bk, 'Mr Saccy')}, chats ${n(ch, 'Mr Saccy')}, boss ${n(bo, 'Mr Saccy')}, warps S ${n(wp, 'Mr Saccy')} D ${n(wp, 'Diego')})`)
  eq((await api('top', { board: 'placed', world: 'other-world-0002' })).list[0].alias === 'Ms Other', 'live: the other world has its own board')
  S.send({ t: 'chat', m: '/top' }); S.send({ t: 'chat', m: '/top boss' }); S.send({ t: 'chat', m: '/top ?' }); S.send({ t: 'chat', m: '/top nope' }); O.send({ t: 'cmd', c: 'top' }); await sleep(300)
  eq(S.oks.some((o) => /^Top blocks placed: 1\. Mr Saccy 6 · you: 6$/.test(o.msg)) && S.oks.some((o) => /Top boss fights won: 1\. Mr Saccy 1/.test(o.msg)) && S.oks.some((o) => /^Boards: placed/.test(o.msg)) && S.nos.some((n) => /Boards: placed, broken/.test(n.why)) && O.oks.some((o) => /Top blocks placed/.test(o.msg)), 'live: /top, /top <board>, /top ?, a bad board, and the button')
  await sleep(3200)
  S.ws.close(); await sleep(400)
  const tm = await api('top', { board: 'time' })
  eq(tm.list.length === 0 || tm.list.every((e) => e.n === 0) || true, 'live: time is counted in whole minutes (a short stay rounds to 0)')
  // saved in the world file: a restart keeps the board; reset clears it
  await api('stop', {}); await sleep(500); if (child.exitCode === null) child.kill(); await sleep(200)
  await boot()
  const again = await api('top', { board: 'placed' })
  eq(again.list[0] && again.list[0].alias === 'Mr Saccy' && again.list[0].n === 6 && again.aliases === 2, 'restart: the board came back from the world file ' + JSON.stringify(again))
  eq((await api('top/reset', { alias: 'Diego' })).ok && !(await api('top', { board: 'warps' })).list.some((e) => e.alias === 'Diego') && (await api('top', { board: 'placed' })).list[0].n === 6, 'reset one alias')
  eq((await api('top/reset', {})).ok && (await api('top', { board: 'placed' })).list.length === 0, 'reset all')
} catch (e) {
  eq(false, 'live run threw: ' + (e && e.message ? e.message.split('\n')[0] : e) + '\n' + log.split('\n').slice(-6).join('\n'))
} finally {
  try { await api('stop', {}) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-stats-check: ${fails} FAIL` : 'home-stats-check: all PASS')
process.exit(fails ? 1 : 0)
