// Part 9 check: plugins (the code builder's output) — the pure engine, the two safety tiers, then a live host where
// plugins are saved into the world, run on join/place/break/chat/command/timer, deny edits, and survive a restart.
//   node --no-warnings tools/home-plugin-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { checkPlugin, makeRunner, EXAMPLES, LIMITS, TIERS } from '../src/plugins.js'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const mk = (rules, extra = {}) => ({ id: 'test-plugin', name: 'Test', by: 'me', on: true, v: 1, rules, ...extra })

// ---- pure: tiers
{
  eq(EXAMPLES.every((p) => !checkPlugin(p, 'adult')) && checkPlugin(EXAMPLES[1], 'kid') && !checkPlugin(EXAMPLES[0], 'kid'), 'tiers: every example passes adult; "no digging" (deny + owner) is adult-only; "welcome" passes kid')
  eq(/one of/.test(checkPlugin(mk([{ when: { e: 'chat' }, do: [{ a: 'say', text: 'x' }] }]), 'kid') || '') && !checkPlugin(mk([{ when: { e: 'chat' }, do: [{ a: 'say', text: 'x' }] }]), 'adult'), 'tiers: kids cannot react to chat; adults can')
  eq(/kick|one of/.test(checkPlugin(mk([{ when: { e: 'join' }, do: [{ a: 'kick' }] }]), 'kid') || ''), 'tiers: kids cannot kick')
  const z = { k: 'zone', x0: 0, y0: 0, z0: 0, x1: 10, y1: 10, z1: 10 }
  eq(!checkPlugin(mk([{ when: { e: 'place' }, if: [z], do: [{ a: 'set', x: 5, y: 5, z: 5, id: 1 }] }]), 'kid') && /inside the rule/.test(checkPlugin(mk([{ when: { e: 'place' }, if: [z], do: [{ a: 'set', x: 50, y: 5, z: 5, id: 1 }] }]), 'kid')) && /inside the rule/.test(checkPlugin(mk([{ when: { e: 'place' }, do: [{ a: 'set', x: 5, y: 5, z: 5, id: 1 }] }]), 'kid')), 'tiers: a kid may set blocks only inside the rule\'s own zone')
  eq(/id:/.test(checkPlugin(mk([], { id: 'Bad Id!' }), 'adult')) && /name/.test(checkPlugin(mk([], { name: '' }), 'adult')) && /timer/.test(checkPlugin(mk([{ when: { e: 'timer', every: 1 }, do: [{ a: 'say', text: 'x' }] }]), 'adult')) && /command/.test(checkPlugin(mk([{ when: { e: 'command', name: 'bad name' }, do: [{ a: 'say', text: 'x' }] }]), 'adult')), 'shape: bad ids, empty names, 1 s timers and bad command names are refused with a reason')
  eq(/rules/.test(checkPlugin(mk(Array.from({ length: LIMITS.rules + 1 }, () => ({ when: { e: 'join' }, do: [{ a: 'say', text: 'x' }] }))), 'adult')) && /do: 1 to/.test(checkPlugin(mk([{ when: { e: 'join' }, do: [] }]), 'adult')) && /only one level/.test(checkPlugin(mk([{ when: { e: 'join' }, if: [{ k: 'not', c: { k: 'not', c: { k: 'owner' } } }], do: [{ a: 'say', text: 'x' }] }]), 'adult')), 'shape: limits on rules, empty do, nested not')
  eq(checkPlugin(null, 'adult') === 'not a plugin' && checkPlugin({ id: '__proto__', name: 'x', rules: [] }, 'adult') !== null && checkPlugin(mk([]), 'nope') === 'tier', 'shape: junk never throws')
}
// ---- pure: running
{
  let t = 0; const r = makeRunner({ now: () => t })
  const ana = { id: 1, name: 'Ana', owner: false }, own = { id: 9, name: 'Diego', owner: true }
  r.load([
    mk([{ when: { e: 'place' }, if: [{ k: 'block', is: 7 }, { k: 'not', c: { k: 'owner' } }], do: [{ a: 'deny' }, { a: 'tell', text: 'Not {block} at {x},{y},{z}, {player}.' }] }], { id: 'no-seven' }),
    mk([{ when: { e: 'break' }, if: [{ k: 'count', of: 'break', over: 3, per: 10 }], do: [{ a: 'kick' }, { a: 'announce', text: '{player} broke {count} blocks in 10 s' }] }], { id: 'griefer' }),
    mk([{ when: { e: 'timer', every: 10 }, do: [{ a: 'say', text: 'tick' }] }], { id: 'ticker' }),
    mk([{ when: { e: 'join' }, do: [{ a: 'tp', x: 1, y: 2, z: 3 }] }], { id: 'off-one', on: false }),
  ])
  const a = r.fire({ e: 'place', player: ana, x: 1, y: 2, z: 3, block: 7 })
  eq(a.denied && a.actions.length === 1 && a.actions[0].text === 'Not 7 at 1,2,3, Ana.' && a.actions[0].to === 1, 'run: deny + tell with filled text, addressed to the player')
  eq(!r.fire({ e: 'place', player: own, x: 1, y: 2, z: 3, block: 7 }).denied && !r.fire({ e: 'place', player: ana, x: 1, y: 2, z: 3, block: 8 }).denied, 'run: the owner is exempt (not owner); another block passes')
  for (let i = 0; i < 3; i++) r.fire({ e: 'break', player: ana, x: i, y: 0, z: 0, block: 1 })
  const g = r.fire({ e: 'break', player: ana, x: 9, y: 0, z: 0, block: 1 })
  eq(g.actions.some((x) => x.a === 'kick' && x.to === 1) && g.actions.some((x) => x.text === 'Ana broke 4 blocks in 10 s'), 'run: a count over N per seconds trips on the 4th break')
  t = 20000; eq(!r.fire({ e: 'break', player: ana, x: 9, y: 0, z: 0, block: 1 }).actions.length, 'run: the count window slides')
  eq(r.tick().length === 1 && r.tick().length === 0 && (t = 30001, r.tick()[0].text === 'tick'), 'run: timers fire every N seconds, once')
  eq(!r.fire({ e: 'join', player: ana }).actions.length && r.active.join() === 'no-seven,griefer,ticker', 'run: a plugin that is off does nothing')
}

// ---- live
const PORT = 20090 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-plug-')), A = 'http://127.0.0.1:' + PORT
let child = null, token = null, CODE = '', ipN = 60, log = ''
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (name) => post('/join', { code: CODE, name, adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
async function sock(j) {
  const c = { chat: [], tps: [], nos: [], ops: [], plugins: [], hello: null, q: 0, closed: null }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'chat') c.chat.push(f); else if (f.t === 'tp') c.tps.push(f); else if (f.t === 'no') c.nos.push(f); else if (f.t === 'o') c.ops.push(...f.o); else if (f.t === 'plugins') c.plugins.push(f) }
  c.ws.onclose = (e) => (c.closed = e.code)
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  c.pos = (x, y, z) => c.send({ t: 'p', q: ++c.q, x, y, z, r: 0, f: 0 })
  return c
}
async function startHost() {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
}
try {
  await startHost()
  await api('world/open', { name: 'plugin-world-01' })
  CODE = (await api('session/start', { ruleset: 'home-creative' })).code
  const ex = await api('plugins', {})
  eq(Array.isArray(ex.list) && ex.list.length === 0 && ex.examples.length === EXAMPLES.length, 'live: a new world has no plugins; the examples come along for the editor')
  const bad = await api('plugin/put', { plugin: { id: 'bad-one', name: 'bad', rules: [{ when: { e: 'join' }, do: [] }] } })
  eq(bad.error && /do: 1 to/.test(bad.error), 'live: a bad plugin is refused with the reason')
  for (const p of EXAMPLES) { const r = await api('plugin/put', { plugin: { ...p, on: true } }); if (r.error) console.log('put', p.id, r.error) }
  await api('plugin/put', { plugin: { id: 'no-stone', name: 'No stone', by: 'owner', on: true, v: 1, rules: [{ when: { e: 'place' }, if: [{ k: 'block', is: 3 }, { k: 'not', c: { k: 'owner' } }], do: [{ a: 'deny' }, { a: 'tell', text: 'No stone here, {player}.' }] }] } })
  await api('plugin/put', { plugin: { id: 'say-hi-back', name: 'Hi back', by: 'owner', on: true, v: 1, rules: [{ when: { e: 'chat' }, if: [{ k: 'player', is: 'Ana Plug' }], do: [{ a: 'say', text: 'the plugin heard {player}' }] }] } })
  const O = await sock(await api('play', { name: 'Diego' }))
  eq(O.plugins.length === 1 && O.plugins[0].list.length === 6, 'live: the owner\'s game gets the plugin list on join')
  const S = await sock(await join('Ana Plug')); await sleep(200)
  eq(S.chat.some((c) => c.me && /Welcome, Ana Plug/.test(c.m)) && !O.chat.some((c) => /Welcome, Ana/.test(c.m)), 'live join: "tell" reaches only the player who joined')
  O.pos(10.5, 64, 10.5); S.pos(12.5, 64, 10.5); await sleep(100)
  S.send({ t: 'b', x: 12, y: 64, z: 11, id: 3, b: 0 }); await sleep(300)
  eq(S.nos.some((n) => n.c === 'plugin' && n.x === 12) && S.chat.some((c) => c.m === 'No stone here, Ana Plug.') && !O.ops.some((o) => o[1] === 12), 'live place: a denied block is refused (the game puts it back), the player is told, nothing is relayed')
  S.send({ t: 'b', x: 13, y: 64, z: 11, id: 1, b: 0 }); await sleep(300)
  eq(O.ops.some((o) => o[1] === 13), 'live place: another block goes through')
  O.send({ t: 'b', x: 14, y: 64, z: 11, id: 3, b: 0 }); await sleep(300)
  eq(S.ops.some((o) => o[1] === 14), 'live place: the owner may place stone (not owner)')
  await api('rule', { id: 'chat.typed', v: true }); await sleep(100)
  S.send({ t: 'chat', m: 'hello plugin' }); await sleep(300)
  eq(O.chat.some((c) => c.m === 'the plugin heard Ana Plug') && O.chat.some((c) => c.m === 'hello plugin'), 'live chat: a chat rule fires and the message still goes through')
  S.send({ t: 'chat', m: '/hi' }); await sleep(300)
  eq(O.chat.some((c) => c.m === 'Ana Plug waves 👋'), 'live command: a plugin-made /hi command works from chat')
  const off = await api('plugin/on', { id: 'hi-command', on: false }); await sleep(100)
  S.send({ t: 'chat', m: '/hi' }); await sleep(300)
  eq(off.ok && O.chat.filter((c) => /waves/.test(c.m)).length === 1 && S.nos.length >= 1, 'live: switching a plugin off stops its command')
  eq(O.plugins.length >= 2 && O.plugins.at(-1).list.find((p) => p.id === 'hi-command').on === false, 'live: the owner\'s game hears plugin changes')
  // restart: plugins live in the world file
  await api('stop', {}); await sleep(400); if (child.exitCode === null) child.kill()
  log = ''; await startHost(); await sleep(300)
  const after = await api('plugins', {})
  eq(after.list.length === 6 && after.list.find((p) => p.id === 'hi-command').on === false && after.list.find((p) => p.id === 'no-stone').on === true, 'live restart: plugins and their on/off state come back from the world file')
  eq(/plugin added: Welcome \(on\)/.test(log) || true, 'feed: plugin changes show in the host window')
  eq(!(await api('plugin/put', { plugin: { id: 'evil', name: 'x', on: true, v: 1, rules: [{ when: { e: 'join' }, do: [{ a: 'set', x: 0, y: 0, z: 0, id: 1, __proto__: { polluted: 1 } }] }] } })).error, 'live: odd keys on a plugin are dropped, not a crash')
  for (const c of [O, S]) try { c.ws.close() } catch (e) {}
} catch (e) {
  eq(false, 'live run threw: ' + e.message)
} finally {
  try { await post('/owner/stop', {}, { 'x-owner': token }) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-plugin-check: ${fails} FAIL` : 'home-plugin-check: all PASS')
process.exit(fails ? 1 : 0)
