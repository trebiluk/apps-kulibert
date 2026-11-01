// Part 3 check (docs/bertopia/HOME-HOST.md §10): rulesets are server-held, sent on join, broadcast on change, and
// enforced on the wire against a client that ignores them. Pure half on host/rules.mjs, then a live host.
//   node --no-warnings tools/home-rules-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeRuleset, PRESETS, RULE_IDS, cleanValue } from '../host/rules.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- pure
{
  const student = PRESETS['home-survival']
  eq(RULE_IDS.every((id) => id in student) && student.mode === 'survival' && student['combat.pvp'] === false && student['survival.keep'] === true, 'presets: Survival = every rule on, cycle, normal, PvP off, keep on (the student defaults)')
  const school = makeRuleset('home-school')
  const sv = makeRuleset('home-survival')
  eq(JSON.stringify(school.snapshot().r) === JSON.stringify(sv.snapshot().r) && school.locked && !sv.locked, '"Same as school" equals Survival exactly and is locked')
  eq(school.set('core.break', false).error === 'locked' && school.get('core.break') === true, 'locked: the owner cannot edit "Same as school"')
  eq(PRESETS['home-creative'].mode === 'creative' && PRESETS['home-creative']['survival.energy'] === 'off' && PRESETS['home-creative']['survival.daynight'] === 'day', 'presets: Creative = creative mode, day, energy off')
  eq(PRESETS['home-peaceful']['survival.energy'] === 'calm' && PRESETS['home-pvp']['combat.pvp'] === true, 'presets: Peaceful calm energy; PvP on')
  eq(PRESETS['home-hardcore']['combat.pvp'] === true && PRESETS['home-hardcore']['survival.keep'] === false && PRESETS['home-hardcore']['survival.energy'] === 'fast', 'presets: Hardcore = PvP, no keep, fast energy')
  eq(cleanValue('core.break', 'yes') === undefined && cleanValue('survival.energy', 'turbo') === undefined && cleanValue('mode', 'god') === undefined && cleanValue('nope', true) === undefined, 'values: wrong types, unknown picks and unknown ids are refused')
  const r = makeRuleset('home-survival'); const rev0 = r.rev
  eq(r.set('core.break', false).ok && r.rev === rev0 + 1 && r.set('core.break', false).same && r.rev === rev0 + 1, 'edit: a change bumps rev; the same value again does not')
  eq(r.editWhy({ t: 'b', id: 0 }, false) === 'rule:core.break' && r.editWhy({ t: 'b', id: 1 }, false) === null && r.editWhy({ t: 'b', id: 0 }, true) === null, 'enforce: break off refuses a break, allows a place, never refuses the owner')
  r.set('core.place', false); eq(r.editWhy({ t: 'b', id: 5 }, false) === 'rule:core.place', 'enforce: place off refuses a place')
  r.set('core.craft', false); eq(r.craftWhy({ t: 'craft' }, false) === 'rule:core.craft' && r.craftWhy({}, true) === null, 'enforce: craft off')
  r.set('station.oven', false); eq(r.stationWhy({ t: 'st', k: 'oven' }, false) === 'rule:station.oven' && r.stationWhy({ t: 'st', k: 'bench' }, false) === null, 'enforce: one station off, the others open')
  r.set('core.station.open', false); eq(r.stationWhy({ t: 'st', k: 'bench' }, false) === 'rule:core.station.open', 'enforce: all stations off')
  eq(r.hitWhy({ t: 'hit', i: 2 }, false) === 'rule:combat.pvp' && makeRuleset('home-pvp').hitWhy({ t: 'hit', i: 2 }, false) === null, 'enforce: PvP off refuses a hit even from the owner; PvP preset allows')
  r.set('core.fly', false); eq(r.flyWhy({ t: 'p', f: 1 }, false) === 'rule:core.fly' && r.flyWhy({ t: 'p', f: 0 }, false) === null && makeRuleset('home-creative').flyWhy({ t: 'p', f: 1 }, false) === null, 'enforce: fly off refuses a flying position in survival; creative allows')
  r.setPreset('home-creative'); eq(r.name === 'home-creative' && r.get('core.break') === true, 'switch: a preset resets the edits')
}

// ---- live
const PORT = 19090 + (process.pid % 100)
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-rules-'))
const A = 'http://127.0.0.1:' + PORT
let child = null, key = null, token = null, ipN = 20
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const join = (name) => post('/join', { code: CODE, name, adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
let CODE = ''
async function sock(j) {
  const c = { nos: [], oks: [], rules: [], hello: null, ops: [], q: 0 }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'no') c.nos.push(f); else if (f.t === 'ok') c.oks.push(f); else if (f.t === 'rules') c.rules.push(f); else if (f.t === 'o') c.ops.push(...f.o) }
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !(c.hello && c.rules.length); i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  c.last = () => c.nos.at(-1) && c.nos.at(-1).c
  return c
}
try {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  await api('world/open', { name: 'rules-world-1' })
  CODE = (await api('session/start', { ruleset: 'home-survival' })).code
  const Ow = await sock(await api('play', { name: 'Owner' }))
  const S = await sock(await join('Sam')), K = await sock(await join('Kai'))
  eq(S.rules.length === 1 && S.rules[0].preset === 'home-survival' && S.rules[0].r['core.break'] === true && !S.rules[0].locked, 'join: the active ruleset arrives right after hello')
  for (const c of [Ow, S, K]) c.send({ t: 'p', q: c.q++, x: 10.5, y: 64, z: 10.5, r: 0, f: 0 }); await sleep(80)
  S.send({ t: 'b', x: 10, y: 64, z: 11, id: 1, b: 0 }); await sleep(250)
  eq(S.nos.length === 0 && K.ops.length === 1, 'survival: a place lands and everyone sees it')

  // the owner turns breaking off: both players hear it, a break is refused by the server, a place still lands
  const r1 = await api('rule', { id: 'core.break', v: false }); await sleep(200)
  eq(r1.ok && S.rules.length === 2 && K.rules.length === 2 && S.rules[1].r['core.break'] === false && S.rules[1].rev === r1.rev, 'edit: a single-rule change is broadcast to every client with a new rev')
  S.send({ t: 'b', x: 10, y: 64, z: 11, id: 0, b: 1 }); await sleep(250)
  eq(S.last() === 'rule:core.break' && K.ops.length === 1, 'enforce: a break is refused with rule:core.break and nothing is applied')
  Ow.send({ t: 'b', x: 10, y: 64, z: 11, id: 0, b: 1 }); await sleep(300)
  eq(Ow.nos.length === 0 && K.ops.length === 2, 'enforce: the owner is exempt (staff path): the owner\'s break lands')
  K.send({ t: 'b', x: 12, y: 64, z: 11, id: 1, b: 0 }); await sleep(250)
  eq(K.nos.length === 0 && K.ops.length === 3, 'enforce: placing is still allowed')

  // home-only frames: craft, station, hit
  S.send({ t: 'craft', i: 'planks' }); await sleep(150)
  eq(S.oks.at(-1) && S.oks.at(-1).a === 'craft', 'craft: allowed -> ok')
  await api('rule', { id: 'core.craft', v: false }); await sleep(150); S.send({ t: 'craft', i: 'planks' }); await sleep(150)
  eq(S.last() === 'rule:core.craft', 'craft: off -> refused')
  await api('rule', { id: 'station.oven', v: false }); await sleep(150); S.send({ t: 'st', k: 'oven' }); S.send({ t: 'st', k: 'bench' }); await sleep(200)
  eq(S.last() === 'rule:station.oven' && S.oks.at(-1).a === 'st', 'station: the oven is refused, the bench opens')
  S.send({ t: 'hit', i: K.hello.you }); await sleep(150)
  eq(S.last() === 'rule:combat.pvp', 'pvp: off by default -> a hit is refused')
  eq(S.ws.readyState === 1 && K.ws.readyState === 1, 'home-only frames never reach the Room, so nobody is hard-failed for an unknown type')

  // switch preset mid-session: everyone gets the toast frame; PvP now allowed; the edits are reset
  const sw = await api('ruleset', { ruleset: 'home-pvp' }); await sleep(250)
  eq(sw.ok && S.rules.at(-1).preset === 'home-pvp' && K.rules.at(-1).preset === 'home-pvp' && S.rules.at(-1).r['core.break'] === true, 'switch: PvP preset reaches both clients and resets the owner\'s edits')
  S.send({ t: 'hit', i: K.hello.you }); await sleep(150)
  eq(S.oks.at(-1).a === 'hit', 'pvp: on -> a hit is ok')
  S.send({ t: 'b', x: 12, y: 64, z: 11, id: 0, b: 1 }); await sleep(250)
  eq(S.nos.filter((n) => n.c === 'rule:core.break').length === 1 && K.ops.length === 4, 'switch: breaking works again after the switch')

  // "Same as school": locked, student rules, the editor refuses
  await api('ruleset', { ruleset: 'home-school' }); await sleep(200)
  const ed = await api('rule', { id: 'core.break', v: false })
  eq(S.rules.at(-1).locked === true && ed.error === 'locked', '"Same as school": locked; the owner\'s edit is refused')
  eq(JSON.stringify(S.rules.at(-1).r) === JSON.stringify(makeRuleset('home-survival').snapshot().r), '"Same as school" on the wire equals the student defaults')
  // fly: survival with core.fly off refuses a flying position; creative allows it
  await api('ruleset', { ruleset: 'home-survival' }); await api('rule', { id: 'core.fly', v: false }); await sleep(200)
  S.send({ t: 'p', q: S.q++, x: 11.5, y: 70, z: 10.5, r: 0, f: 1 }); await sleep(150)
  eq(S.last() === 'rule:core.fly', 'fly: refused in survival when core.fly is off')
  await api('ruleset', { ruleset: 'home-creative' }); await sleep(200)
  S.send({ t: 'p', q: S.q++, x: 11.5, y: 70, z: 10.5, r: 0, f: 1 }); await sleep(150)
  eq(S.last() !== 'rule:core.fly' || S.nos.filter((n) => n.c === 'rule:core.fly').length === 1, 'fly: allowed in creative')
  // the owner page shows the live ruleset
  const st = await api('state')
  eq(st.live.rules && st.live.rules.preset === 'home-creative' && st.live.rules.r.mode === 'creative', 'owner page: live view carries the ruleset')
  // restart: the preset is remembered (cfg.ruleset); edits are not (they are session state)
  await api('stop'); for (let i = 0; i < 60 && child.exitCode === null; i++) await sleep(50)
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  eq((await api('rules')).preset === 'home-creative', 'restart: the last preset is the default for the next session')
} catch (e) { fails++; console.log('FAIL  crashed: ' + (e && e.stack || e)) } finally {
  if (child && child.exitCode === null) child.kill(); fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-rules-check: ${fails} FAIL` : 'home-rules-check: all PASS')
process.exit(fails ? 1 : 0)
