// Part 8 check: server commands (src/essentials.js wired through host/commands.mjs) by buttons ({t:'cmd'}) and by
// typed '/...' chat lines, on a live host. Pure half on commands.mjs first.
//   node --no-warnings tools/home-cmd-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeCommands, menuFor, PLAYER_CMDS, OWNER_CMDS } from '../host/commands.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- pure
{
  let t = 0
  const ps = [{ id: 1, ref: 'a', alias: 'Diego', staff: true, pos: { x: 1, y: 64, z: 1 } }, { id: 2, ref: 'b', alias: 'Mr Saccy', staff: false, pos: { x: 5, y: 64, z: 5 } }]
  const c = makeCommands({ spawn: () => ({ x: 8.5, y: 8, z: 1.5 }), players: () => ps, now: () => t })
  const [O, S] = ps
  eq(menuFor(false).map((m) => m.c).join() === 'spawn,sethome,home' && menuFor(true).length === 13, 'menu: players get spawn/sethome/home; the owner gets the staff set too')
  eq(c.parse('/tp sacc', true).cmd.id === 2 && c.parse('/TP mr saccy', true).cmd.id === 2 && c.parse('/tp nobody', true).error === 'no-such-player', 'typed: names match whole or by start, any case; unknown names are refused')
  eq(c.parse('/tp Diego', false).error === 'role' && c.parse('/spawnall', false).error === 'role' && c.parse('/home', false).cmd.c === 'home', 'typed: staff commands refused for players; player commands fine')
  eq(c.parse('/nope', true).error === 'unknown' && c.parse('hello', true).error === 'not-a-command' && /\/spawn/.test(c.parse('/help', false).help) && !/\/tp/.test(c.parse('/help', false).help) && /\/tp/.test(c.parse('/help', true).help), 'typed: unknown commands, plain text, and /help per role')
  eq(c.run(S, { c: 'home' }).error === 'no-home' && c.run(S, { c: 'sethome' }).fx[0].k === 'home-set' && c.run(S, { c: 'home' }).fx[0].pos.x === 5, 'home: no home until set; then /home teleports there')
  eq(c.run(S, { c: 'spawn' }).fx[0].pos.y === 8 && c.run(S, { c: 'spawn' }).error === 'cooldown' && (t += 6000, c.run(S, { c: 'spawn' }).fx.length === 1), 'spawn: works, then a 5 s cooldown for players, then again')
  eq(c.run(O, { c: 'spawn' }).fx.length === 1 && c.run(O, { c: 'spawn' }).fx.length === 1, 'the owner has no cooldowns')
  eq(c.run(O, { c: 'bring', id: 2 }).fx[0].id === 2 && c.run(O, { c: 'bring', id: 2 }).fx[0].pos.x === 1 && c.run(S, { c: 'bring', id: 1 }).error === 'role', 'bring: moves the other player to the owner; players cannot')
  eq(c.setWarp('Castle', O.pos).warps.join() === 'Castle' && c.parse('/warp castle', true).cmd.i === 1 && c.run(O, c.parse('/warp castle', true).cmd).fx[0].pos.x === 1 && c.setWarp('bad name!', O.pos).error === 'warp-name' && c.delWarp('Castle').warps.length === 0 && c.parse('/warp castle', true).error === 'no-such-warp', 'warps: set by name (checked), warp to it, remove it')
  eq(c.run(O, { c: 'mute', id: 2, on: 1 }).fx[0].on === 1 && c.isMuted('b') && c.run(O, { c: 'mute', id: 2, on: 0 }).fx[0].on === 0 && !c.isMuted('b'), 'mute by command tracks the player')
  eq(c.run(O, { c: 'bring', id: 99 }).error === 'no-such-player' && c.run(O, { c: 'nope' }).error === 'shape' && c.run(O, { c: 'tp', id: '2' }).error === 'shape', 'bad shapes and missing targets are refused, never a throw')
}

// ---- live
const PORT = 19990 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-cmd-')), A = 'http://127.0.0.1:' + PORT
let child = null, token = null, CODE = '', ipN = 50
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (name) => post('/join', { code: CODE, name, adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { tps: [], oks: [], nos: [], chat: [], rules: [], hello: null, q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'tp') c.tps.push(f); else if (f.t === 'cmdok') c.oks.push(f); else if (f.t === 'cmdno') c.nos.push(f); else if (f.t === 'chat') c.chat.push(f); else if (f.t === 'rules') c.rules.push(f) }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !(c.hello && c.rules.length); i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  c.pos = (x, y, z) => c.send({ t: 'p', q: ++c.q, x, y, z, r: 0, f: 0 })
  return c
}
try {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  await api('world/open', { name: 'cmd-world-0001' })
  CODE = (await api('session/start', { ruleset: 'home-survival' })).code
  const O = await sock(await api('play', { name: 'Diego' })), S = await sock(await join('Mr Saccy'))
  eq(S.rules[0].menu.map((m) => m.c).join() === 'spawn,sethome,home' && O.rules[0].menu.some((m) => m.c === 'bring'), 'live: the rules frame carries each role\'s command menu')
  O.pos(10.5, 64, 10.5); S.pos(40.5, 64, 40.5); await sleep(150)
  S.send({ t: 'cmd', c: 'spawn' }); await sleep(200)
  eq(S.tps.length === 1 && S.tps[0].x === 8.5 && S.tps[0].y === 8, 'live button: spawn teleports the player (tp frame)')
  S.send({ t: 'chat', m: '/home' }); await sleep(200)
  eq(S.nos.some((n) => /No home set/.test(n.why)) && !O.chat.length, 'live typed: /home with no home is refused with a plain reason; the line is not chat')
  S.send({ t: 'cmd', c: 'sethome' }); await sleep(150); S.send({ t: 'chat', m: '/home' }); await sleep(200)
  eq(S.oks.some((o) => o.msg === 'Home set.') && S.tps.length === 2 && S.tps[1].x === 40.5, 'live: sethome then /home goes back there')
  S.send({ t: 'chat', m: '/bring Diego' }); await sleep(200)
  eq(S.nos.some((n) => /Only the owner/.test(n.why)) && O.tps.length === 0, 'live: a player typing an owner command is refused')
  O.send({ t: 'chat', m: '/bring sacc' }); await sleep(200)
  eq(S.tps.length === 3 && S.tps[2].x === 10.5 && S.tps[2].by === 'Diego' && O.oks.some((o) => /on the way/.test(o.msg)), 'live: the owner brings a player by (partial) name; the player is told who moved them')
  O.send({ t: 'cmd', c: 'tp', id: S.hello.you }); await sleep(200)
  eq(O.tps.length === 1 && O.tps[0].x === 40.5, 'live button: the owner teleports to a player by id')
  O.send({ t: 'chat', m: '/setwarp tower' }); await sleep(200)
  eq(O.oks.some((o) => /Warp "tower" set/.test(o.msg)) && S.rules.at(-1).warps.join() === 'tower', 'live: /setwarp names a warp; everyone\'s menu lists it')
  S.send({ t: 'chat', m: '/warp tower' }); await sleep(200)
  eq(S.nos.some((n) => /Only the owner/.test(n.why)), 'live: warps are owner-only (per essentials.js)')
  O.send({ t: 'chat', m: '/announce Dinner in 5' }); await sleep(200)
  eq(S.chat.some((c) => c.a === '📣 Diego' && c.m === 'Dinner in 5'), 'live: /announce reaches everyone as a marked chat line')
  O.send({ t: 'chat', m: '/mute saccy' }); await sleep(150); S.send({ t: 'chat', m: 'can anyone hear me' }); await sleep(200)
  eq(S.nos.some((n) => n.why === undefined) || !O.chat.some((c) => c.m === 'can anyone hear me'), 'live: /mute by name silences chat (the owner-page mute and the command agree)')
  O.send({ t: 'chat', m: '/spawnall' }); await sleep(200)
  eq(S.tps.at(-1).x === 8.5 && O.tps.at(-1).x === 8.5, 'live: /spawnall moves everyone')
  O.send({ t: 'chat', m: '/help' }); await sleep(150)
  eq(O.oks.some((o) => /Commands:.*\/bring/.test(o.msg)), 'live: /help lists the commands for the role')
  eq(/\] owner sent everyone to spawn/.test(log) && /\] owner announced: Dinner in 5/.test(log) && !log.includes(CODE), 'feed: owner commands show in the host window; no secrets')
  for (const c of [O, S]) try { c.ws.close() } catch (e) {}
} catch (e) {
  eq(false, 'live run threw: ' + e.message)
} finally {
  try { await post('/owner/stop', {}, { 'x-owner': token }) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-cmd-check: ${fails} FAIL` : 'home-cmd-check: all PASS')
process.exit(fails ? 1 : 0)
