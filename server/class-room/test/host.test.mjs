// The local host end to end: real HTTP, real WebSockets (Node's built-in client), worlds on disk, restart.
//   node --import ./host/register.mjs --test test/host.test.mjs      (also part of npm test)
// Runs host/host.mjs as a child on a free port with a temp data folder. Fake nicknames only.
import test from 'node:test'
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const PORT = 18790 + (process.pid % 100)
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-host-'))
const B = 'http://127.0.0.1:' + PORT
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let child = null, key = null

async function start() {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/host.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''
  child.stdout.on('data', (d) => { log += d })
  child.stderr.on('data', (d) => { log += d; if (process.env.HOST_DEBUG) process.stderr.write(d) })
  for (let i = 0; i < 100 && !/local host on/.test(log); i++) await sleep(50)
  assert.match(log, /local host on/, 'host started: ' + log)
  key = /k=([0-9a-f]+)/.exec(log)[1]
}
const api = (p, b) => fetch(B + '/host/' + p, { method: 'POST', headers: { 'x-host-key': key, 'content-type': 'application/json' }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const join = (code) => fetch(B + '/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ code }) }).then((r) => r.json())
async function connect(code) {
  const j = await join(code)
  assert.ok(j.ticket, 'ticket for ' + code + ': ' + JSON.stringify(j))
  const c = { ops: [], nos: [], hello: null, closed: null, q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'o') c.ops.push(...f.o); else if (f.t === 'no') c.nos.push(f) }
  c.ws.onclose = (e) => { c.closed = e.code }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused for ' + code)) })
  for (let i = 0; i < 100 && !c.hello && !c.closed; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  return c
}

test('local host: menu is host-only, players join by code, build with the school rules, world survives a restart', async (t) => {
  t.after(() => { if (child) child.kill(); if (!process.env.HOST_KEEP) fs.rmSync(DATA, { recursive: true, force: true }); else console.log('# kept', DATA) })
  await start()
  assert.equal((await fetch(B + '/host/state')).status, 403, 'no key, no menu API')
  assert.equal((await fetch(B + '/rt/health')).status, 200)

  assert.deepEqual(await api('world/open', { name: 'bad name!' }), { error: 'name' })
  assert.deepEqual(await api('world/open', { name: 'yard' }), { error: 'name' }, 'too short for a ticket id')
  assert.equal((await api('world/open', { name: 'back-yard-1' })).ok, true)
  const ann = await api('player/add', { nick: 'Ann' }), bo = await api('player/add', { nick: 'Bo' }), host = await api('player/add', { nick: 'Host', role: 'teacher' })
  assert.match(ann.code, /^[0-9A-F]{6}$/)
  assert.equal((await api('player/add', { nick: 'ann' })).error, 'taken')
  assert.equal((await api('player/add', { nick: 'a@b.com' })).error, 'nickname', 'an email is not a nickname')
  assert.equal((await join('NOPE00')).error, 'code')
  assert.equal((await join(ann.code)).error, 'no host', 'kids wait for the host')

  const H = await connect(host.code)
  assert.equal(H.hello.role, 't')
  const A = await connect(ann.code), Bo = await connect(bo.code)
  assert.deepEqual(Bo.hello.players.map((p) => p.a).sort(), ['Ann', 'Host'])
  const st = await api('state')
  assert.equal(st.live.rooms[0].players.length, 3)

  // Ann's plot is the first kid plot (contest rules): x 56.., z -108..
  const x = 60, z = -100
  for (const c of [A, Bo, H]) c.send({ t: 'p', q: c.q++, x: x + 0.5, y: 64, z: z + 0.5, r: 0, f: 0 })
  await sleep(80)
  for (let i = 0; i < 5; i++) { A.send({ t: 'b', x: x + i, y: 64, z: z + 1, id: 1, b: 0 }); await sleep(120) }
  Bo.send({ t: 'b', x: x, y: 66, z: z + 1, id: 10, b: 0 })
  H.send({ t: 'b', x: x, y: 64, z: z + 1, id: 0, b: 1 })
  await sleep(500)
  assert.equal(Bo.nos.map((n) => n.c).join(), 'not-yours', 'grief rules apply at home too')
  assert.equal(Bo.ops.length, 6, 'Bo saw Ann\'s 5 and the host\'s break')
  const live = (await api('state')).live
  assert.equal(live.head, 6)
  assert.equal(live.recent[0].who, 'Host')
  const built = await api('built', { x, y: 64, z: z + 1 })
  assert.deepEqual(built.entries.map((e) => e.who + ' ' + e.action), ['Host broke', 'Ann placed'])

  await api('lock', { on: true })
  assert.equal((await join(bo.code)).error, 'locked')
  assert.ok((await join(host.code)).ticket, 'the host can still join a locked world')
  await api('lock', { on: false })
  await api('player/kick', { code: bo.code })
  await sleep(100)
  assert.equal(Bo.closed, 4006)
  const bk = await api('world/backup')
  assert.ok(bk.ok && fs.existsSync(path.join(DATA, 'backups', bk.file)))

  // restart: the world reopens with its edits and the same join codes
  await api('stop'); await sleep(300)
  for (let i = 0; i < 50 && child.exitCode === null; i++) await sleep(50)
  assert.notEqual(child.exitCode, null, 'stopped')
  assert.equal(A.closed, 4006)
  const oldKey = key
  await start()
  assert.equal(key, oldKey, 'the host key is kept')
  const s2 = await api('state')
  assert.equal(s2.world, 'back-yard-1'); assert.equal(s2.live.head, 6)
  assert.deepEqual(s2.players.map((p) => p.alias), ['Ann', 'Bo', 'Host'])
  const H2 = await connect(host.code), A2 = await connect(ann.code)
  A2.send({ t: 'p', q: 0, x: x + 0.5, y: 64, z: z + 0.5, r: 0, f: 0 }); await sleep(50)
  A2.send({ t: 'b', x: x + 1, y: 64, z: z + 1, id: 1, b: 0 }); await sleep(300)   // stale: that block is still there from before
  assert.equal(A2.nos[0] && A2.nos[0].c, 'stale', 'the saved world is the one that came back')
  // restore the backup over a changed world
  A2.send({ t: 'b', x: x + 1, y: 64, z: z + 1, id: 0, b: 1 }); await sleep(400)
  assert.equal(A2.nos.length, 1, 'the break of a real block was accepted: ' + JSON.stringify(A2.nos))
  assert.equal((await api('state')).live.head, 7)
  const rs = await api('world/restore', { file: bk.file })
  assert.equal(rs.ok, true)
  const after = await api('state')
  assert.equal(after.live.head, 6, 'restored to the backup; recent: ' + JSON.stringify(after.live.recent.slice(0, 2)) + ' backups now: ' + after.backups.join())
  assert.equal(A2.closed, 4006, 'players were disconnected for the restore')
  void H2
})
