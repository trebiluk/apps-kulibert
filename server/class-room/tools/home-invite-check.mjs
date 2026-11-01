// Part 10 check: invite keys (host/door.mjs) and the griefer guard (host/home.mjs), pure half then a live host.
//   node --no-warnings tools/home-invite-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeDoor, isInviteKey, INVITES_MAX } from '../host/door.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- pure: the door
{
  let t = 1_000_000
  const d = makeDoor({ secret: 'k'.repeat(32), now: () => t })
  const { code } = d.start({ world: 'w-0001' })
  const i1 = d.invite({ label: 'Bob', max: 2 })
  eq(/^ADLT-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/.test(i1.key) && isInviteKey(i1.key) && isInviteKey(i1.key.toLowerCase().replace(/-/g, ' ')) && !isInviteKey(code), 'key: ADLT-XXXX-XXXX-XXXX from the code alphabet; case and dashes do not matter; a session code is not a key')
  eq(d.invites.length === 1 && !('key' in d.invites[0]) && !('hash' in d.invites[0]) && d.invites[0].live && d.invites[0].uses === 0, 'list: no key and no hash ever come back; live, 0 uses')
  const j1 = await d.join({ code: i1.key, name: 'Bob', adults: true, ip: '1.1.1.1' })
  const j2 = await d.join({ code: i1.key.toLowerCase(), name: 'Bo', adults: true, ip: '1.1.1.2' })
  const j3 = await d.join({ code: i1.key, name: 'Bop', adults: true, ip: '1.1.1.3' })
  eq(j1.invite === i1.id && j1.inviteUse === 1 && j2.inviteUse === 2 && j3.error === 'invite-used' && d.invites[0].used.map((u) => u.name).join() === 'Bob,Bo', 'join: a 2-use key lets two people in, the third is told it is used up; the list shows who used it')
  d.setPassword('secret')
  const i2 = d.invite({ name: 'Locked Lou' })
  const j4 = await d.join({ code: i2.key, name: 'Someone Else', adults: true, ip: '1.1.1.4' })
  const j5 = await d.join({ code, name: 'Plain Pat', adults: true, ip: '1.1.1.5' })
  eq(j4.name === 'Locked Lou' && !j4.error && j5.error === 'password', 'join: an invite skips the session password and a name-locked key joins as that name')
  const i2b = d.invite({ label: 'adults?' })
  eq((await d.join({ code: i2b.key, name: 'x', adults: false, ip: '1.1.1.6' })).error === 'adults' && d.invites.find((i) => i.id === i2b.id).uses === 0, 'join: the 18+ box is still required with a key, and a refused join does not spend a use')
  const i3 = d.invite({ label: 'short', ttlMs: 5 * 60 * 1000 })
  t += 6 * 60 * 1000
  eq((await d.join({ code: i3.key, name: 'Late', adults: true, ip: '1.1.1.7' })).error === 'invite-expired', 'join: an expired key is told so')
  const i4 = d.invite({ label: 'taken back' })
  eq(d.revokeInvite(i4.id).ok && (await d.join({ code: i4.key, name: 'Rev', adults: true, ip: '1.1.1.8' })).error === 'invite-revoked' && d.revokeInvite('inv-nope').error, 'revoke: a revoked key is refused; revoking nothing is an error')
  eq((await d.join({ code: 'ADLT-2222-3333-4444', name: 'Guess', adults: true, ip: '1.1.1.9' })).error === 'code', 'join: a made-up key reads as a wrong code (and spends a join try)')
  for (let i = 0; i < 5; i++) await d.join({ code: 'ADLT-2222-3333-4445', name: 'Guess', adults: true, ip: '9.9.9.9' })
  eq((await d.join({ code: 'ADLT-2222-3333-4446', name: 'Guess', adults: true, ip: '9.9.9.9' })).error === 'slow-down', 'join: key guessing hits the same 5-a-minute limit as code guessing')
  const i5 = d.invite({ label: 'after rotate' }); d.rotate()
  eq(!(await d.join({ code: i5.key, name: 'Rota', adults: true, ip: '1.1.1.10' })).error, 'rotate: a live key still works after the code rotates')
  const d2 = makeDoor({ secret: 'k'.repeat(32), now: () => t }); d2.start({ world: 'w' })
  let made = 0; for (let i = 0; i < INVITES_MAX + 3; i++) if (!d2.invite({}).error) made++
  eq(made === INVITES_MAX && d2.invite({}).error === 'too-many-invites', 'cap: at most ' + INVITES_MAX + ' live keys')
  eq(d.invite({ max: 999 }).max === 50 && d.invite({ max: 0 }).max === 1 && d.invite({ name: '!!' }).error === 'name', 'shape: uses clamp to 1..50; a bad name lock is refused')
}

// ---- live
const PORT = 19880 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-inv-')), A = 'http://127.0.0.1:' + PORT
let child = null, token = null, CODE = '', ipN = 50, log = ''
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (code, name) => post('/join', { code, name, adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { nos: [], hello: null, closed: null, q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'no') c.nos.push(f) }
  c.ws.onclose = (e) => { c.closed = { code: e.code, reason: e.reason } }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  return c
}
try {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  await api('world/open', { name: 'inv-world-0001' })
  CODE = (await api('session/start', { ruleset: 'home-creative' })).code
  const O = await sock(await api('play', { name: 'Diego' }))
  const inv = await api('invite', { label: 'Mr Saccy', max: 1, hours: 2 })
  eq(inv.status === 200 && isInviteKey(inv.key) && inv.link === 'http://localhost:' + PORT + '/?invite=' + encodeURIComponent(inv.key) && /owner made invite/.test(log) && !log.includes(inv.key.slice(5, 14)), 'live: /owner/invite returns the key once with a join link; the feed names it but never shows the key')
  const st = await api('state', {})
  eq(st.invites.length === 1 && st.invites[0].label === 'Mr Saccy' && !JSON.stringify(st.invites).includes(inv.key.slice(5, 14)) && st.guard && st.guard.on && st.guard.breaks === 70, 'live: state lists the invite (no key) and the guard settings')
  const j = await join(inv.key.toLowerCase(), 'Mr Saccy')
  eq(j.status === 200 && !!j.ticket, 'live: a player joins with the key in the code field')
  const S = await sock(j); await sleep(200)
  eq(/Mr Saccy joined with invite Mr Saccy \(1\/1\)/.test(log), 'live: the feed says who joined with which invite (1/1)')
  eq((await join(inv.key, 'Second')).error === 'invite-used' && (await join('ADLT-2222-3333-4444', 'Guess')).error === 'code', 'live: the used key is refused; a made-up key is a wrong code')
  const inv2 = await api('invite', { label: 'gone', max: 3 })
  eq((await api('invite/revoke', { id: inv2.id })).ok && (await join(inv2.key, 'Rev')).error === 'invite-revoked' && (await api('invites', {})).list.find((i) => i.id === inv2.id).live === false, 'live: revoke works and the list shows it done')
  eq((await post('/owner/invite', { label: 'x' }, { 'x-forwarded-for': '203.0.113.9' })).status === 403, 'live: the invite API is owner-only and host-PC-only')

  // griefer guard: a block storm from the player is kicked and undone; a second storm is a ban. The owner is never guarded.
  for (let i = 0; i < 30; i++) S.send({ t: 'b', x: 100 + i, y: 64, z: 100, id: 1, b: 0 })   // 30 placements (not counted)
  await sleep(300)
  for (let i = 0; i < 75; i++) { S.send({ t: 'b', x: 100 + (i % 30), y: 64, z: 100, id: 0, b: 1 }); if (i % 9 === 8) await sleep(1000) }   // 75 breaks spread over ~8 s, under the Room's 10/s
  await sleep(600)
  eq(S.closed && S.closed.code === 4006 && S.closed.reason === 'kicked' && /guard kicked Mr Saccy \(block storm: 70\+ breaks in 10 s\)/.test(log) && /guard undid \d+ cells? of Mr Saccy/.test(log), `live guard: 75 breaks in ~8 s = kicked (${S.closed && S.closed.reason}) and the last minute undone`)
  const S2 = await sock(await join(CODE, 'Mr Saccy')); await sleep(200)
  eq(!!S2.hello, 'live guard: a kicked player may come back once')
  for (let i = 0; i < 75; i++) { S2.send({ t: 'b', x: 100 + (i % 30), y: 64, z: 100, id: 0, b: 1 }); if (i % 9 === 8) await sleep(1000) }
  await sleep(600)
  eq(S2.closed && S2.closed.reason === 'banned' && /guard banned Mr Saccy \(second block storm\)/.test(log) && (await join(CODE, 'Mr Saccy')).error === 'banned', 'live guard: the second storm is a ban (name and address)')
  for (let i = 0; i < 75; i++) { O.send({ t: 'b', x: 200 + (i % 30), y: 64, z: 100, id: 0, b: 1 }); if (i % 9 === 8) await sleep(1000) }
  await sleep(400)
  eq(O.closed === null, 'live guard: the owner is never guarded')
  eq((await api('guard', { on: false })).guard.on === false && JSON.parse(fs.readFileSync(path.join(DATA, 'home.json'), 'utf8')).guard.on === false && (await api('guard', { on: true, breaks: 5, window: 1 })).guard.breaks === 10, 'live guard: the owner can turn it off (saved in home.json); limits clamp (10+ breaks, 2+ s)')
  const T = await sock(await join(CODE, 'Tame Tim'))
  for (let i = 0; i < 12; i++) { T.send({ t: 'b', x: 300 + i, y: 64, z: 100, id: 0, b: 1 }); if (i % 9 === 8) await sleep(1000) }
  await sleep(400)
  eq(T.closed && T.closed.reason === 'kicked', 'live guard: the owner\'s own limit (10 in 2 s) applies')
} catch (e) {
  eq(false, 'live run threw: ' + (e && e.message ? e.message.split('\n')[0] : e) + '\n' + log.split('\n').slice(-6).join('\n'))
} finally {
  try { await api('stop', {}) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-invite-check: ${fails} FAIL` : 'home-invite-check: all PASS')
process.exit(fails ? 1 : 0)
