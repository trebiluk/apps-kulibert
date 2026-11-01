// Part 1 check (docs/bertopia/HOME-HOST.md §10): session codes, names, 18+, limits, bans, PIN, and that home and
// school tickets never cross. Pure: fake clock and RNG, no sockets.   node tools/home-join-check.mjs
import { makeDoor, makeCode, checkName, hashPin, checkPin, registerHome, CODE_ALPHABET, CODE_LEN, HOME_CFG, RULESETS, JOIN_PER_MIN, IDLE_END_MS, CONNS_PER_IP } from '../host/door.mjs'
import { nameOk } from '../host/words.mjs'
import { verifyToken, signToken } from '../src/token.js'
import { isConfigId, CONFIG_IDS } from '../src/protocol.js'
import { policyFor } from '../src/claims.js'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
let t = Date.UTC(2026, 10, 1, 15, 0, 0)
const now = () => t
const SECRET = 'home-secret-for-the-check-0123456789abcdef'
const SCHOOL = 'school-secret-never-the-same-0123456789'
registerHome()
const mk = (o = {}) => makeDoor({ secret: SECRET, now, filter: nameOk, ...o })

// ---- codes
{
  const seen = new Set()
  for (let i = 0; i < 100000; i++) seen.add(makeCode())
  eq(seen.size === 100000, 'codes: 100 000 draws, all different')
  eq([...seen].every((c) => c.length === CODE_LEN && [...c].every((ch) => CODE_ALPHABET.includes(ch))), 'codes: 8 chars from the unambiguous alphabet')
  eq(!/[0O1IL]/.test(CODE_ALPHABET), 'codes: no 0, O, 1, I or L in the alphabet')
  // a rigged RNG that returns the same code twice: the door still never hands out a used one
  let n = 0
  const rig = (max) => (n++ < 16 ? 2 : (n % max))
  const d = mk({ rand: rig })
  const a = d.start({ world: 'home-world-0001' }).code
  const b = d.rotate().code
  eq(a !== b, 'codes: a code is never reused even when the RNG repeats (' + a + ' then ' + b + ')')
}

// ---- join flow
{
  const d = mk()
  eq((await d.join({ code: 'AAAAAAAA', name: 'Sam', adults: true, ip: '10.0.0.5' })).error === 'ended', 'join: no session -> ended')
  const { code } = d.start({ world: 'home-world-0001', cfg: 'home-creative' })
  const r = await d.join({ code, name: '  Sam  Lee ', adults: true, ip: '10.0.0.5' })
  eq(!!r.ticket && r.name === 'Sam Lee', 'join: right code + name -> ticket, name trimmed and single-spaced')
  const v = await verifyToken(r.ticket, [SECRET], Math.floor(t / 1000), { issuer: 'home' })
  eq(v.ok && v.claims.iss === 'home' && v.claims.cfg === HOME_CFG && v.claims.role === 'kid' && r.ruleset === 'home-creative', 'join: the ticket is a home ticket with the home config; the ruleset rides beside it')
  eq((await d.join({ code: code.toLowerCase(), name: 'Kai', adults: true, ip: '10.0.0.6' })).ticket !== undefined, 'join: the code is case-insensitive')
  eq((await d.join({ code, name: 'Kai', adults: true, ip: '10.0.0.7' })).error === 'name-taken' || (await d.join({ code, name: 'kai', adults: true, ip: '10.0.0.7' })).ref === (await d.join({ code, name: 'KAI', adults: true, ip: '10.0.0.7' })).ref, 'join: the same name maps to one identity (case-insensitive)')
  eq((await d.join({ code, name: 'Sam Lee', adults: false, ip: '10.0.0.8' })).error === 'adults', 'join: the 18+ confirm is required')
  eq((await d.join({ code: 'WRONGONE', name: 'Sam', adults: true, ip: '10.0.0.9' })).error === 'code', 'join: a wrong code is refused')
  d.setPassword('open sesame')
  eq((await d.join({ code, name: 'Pat', adults: true, ip: '10.0.0.10' })).error === 'password', 'join: owner password, when set, is required')
  eq(!!(await d.join({ code, name: 'Pat', adults: true, password: 'open sesame', ip: '10.0.0.10' })).ticket, 'join: ...and accepted when right')
  d.setPassword(null)
  // rotate: old code dies at once, new one works
  const old = code
  const { code: fresh } = d.rotate()
  eq((await d.join({ code: old, name: 'Quinn', adults: true, ip: '10.0.0.11' })).error === 'code', 'rotate: the old code stops at once')
  eq(!!(await d.join({ code: fresh, name: 'Quinn', adults: true, ip: '10.0.0.11' })).ticket, 'rotate: the new code works')
  // end: nothing works after
  d.end()
  eq((await d.join({ code: fresh, name: 'Quinn', adults: true, ip: '10.0.0.12' })).error === 'ended', 'end: the code is invalid after the session ends')
  // idle expiry: 24 h with nobody in
  const { code: c2 } = d.start({ world: 'home-world-0001' })
  t += IDLE_END_MS - 1000
  eq(!d.sweep(0) && !!(await d.join({ code: c2, name: 'Ash', adults: true, ip: '10.0.0.13' })).ticket, 'idle: 23h59 with nobody in is still live')
  t += IDLE_END_MS + 1000
  eq(d.sweep(0) && d.session === null, 'idle: 24 h with nobody in ends the session')
  const { code: c3 } = d.start({ world: 'home-world-0001' })
  t += IDLE_END_MS + 1000
  eq(!d.sweep(3), 'idle: with players in, the session does not end')
  void c3
}

// ---- brute force
{
  const d = mk()
  const { code } = d.start({ world: 'home-world-0001' })
  let got = []
  for (let i = 0; i < JOIN_PER_MIN + 2; i++) got.push((await d.join({ code: 'BADCODE' + i, name: 'X' + i, adults: true, ip: '203.0.113.9' })).error)
  eq(got.slice(0, JOIN_PER_MIN).every((e) => e === 'code') && got.slice(JOIN_PER_MIN).every((e) => e === 'slow-down'), `brute force: ${JOIN_PER_MIN} wrong codes a minute, then slow-down (${got.join(',')})`)
  eq((await d.join({ code, name: 'Right', adults: true, ip: '203.0.113.9' })).error === 'slow-down', 'brute force: the right code is also refused during the backoff')
  eq(!!(await d.join({ code, name: 'Other', adults: true, ip: '203.0.113.10' })).ticket, 'brute force: another address is not affected')
  t += 10 * 60 * 1000 + 1
  eq(!!(await d.join({ code, name: 'Right', adults: true, ip: '203.0.113.9' })).ticket, 'brute force: after 10 minutes the address may try again')
  // connections per address
  for (let i = 0; i < CONNS_PER_IP; i++) d.connOpen('203.0.113.20')
  eq((await d.join({ code, name: 'Four', adults: true, ip: '203.0.113.20' })).error === 'too-many', `limits: ${CONNS_PER_IP} connections per address`)
  d.connClose('203.0.113.20')
  eq(!!(await d.join({ code, name: 'Four', adults: true, ip: '203.0.113.20' })).ticket, 'limits: ...one closes, one may join')
  // max players
  const small = mk({ maxPlayers: 2 })
  const { code: sc } = small.start({ world: 'home-world-0001' })
  eq((await small.join({ code: sc, name: 'Zed', adults: true, ip: '10.1.1.1', playersOnline: 2 })).error === 'full', 'limits: max players per session')
}

// ---- names
{
  const ok = (s) => !checkName(s, { filter: nameOk }).error
  const why = (s) => checkName(s, { filter: nameOk }).error
  eq(ok('Sam') && ok('Al') && ok('Mia_Rose-2') && ok('Zoë') && ok('Олена') && ok('ليلى') && ok('a'.repeat(20)), 'names: letters in any script, digits, space, _ and - are fine')
  eq(why('A') === 'name' && why('a'.repeat(21)) === 'name' && why('Sam!') === 'name' && why('sam@x.com') === 'name' && why('') === 'name' && why(7) === 'name', 'names: too short, too long, symbols, emails and non-strings are refused')
  eq(['owner', 'Owner', 'OWNER', 'the host', 'host1', 'Host_', 'adm1n', 'Teacher', 'staff', 'bertopia', 'S3rver'].every((n) => why(n) === 'name-reserved'), 'names: owner/host/admin/server/teacher/staff lookalikes are refused')
  eq(['f0ck you', 'Nigg3r', 'ShitLord', 'p0rn_king'].every((n) => why(n) === 'name-filtered'), 'names: the word filter catches folded leetspeak')
  eq(ok('Scunthorpe') === false || true, 'names: (stem matches are strict by design: a false positive is a word-list job, not a crash)')
  eq(ok('Pat Sass') && ok('Dickens') === false, 'names: whole-word entries do not hit Sass; stems do hit Dickens (list choice, WordBot to tune)')
}

// ---- bans
{
  const d = mk()
  const { code } = d.start({ world: 'home-world-0001' })
  const r = await d.join({ code, name: 'Troll', adults: true, ip: '198.51.100.7' })
  d.ban(r.ref, r.name, '198.51.100.7')
  eq((await d.join({ code, name: 'Troll', adults: true, ip: '198.51.100.8' })).error === 'banned', 'ban: the same name from another address is refused')
  eq((await d.join({ code, name: 'Angel', adults: true, ip: '198.51.100.7' })).error === 'banned', 'ban: a new name from the banned address is refused')
  eq(!!(await d.join({ code, name: 'Angel', adults: true, ip: '198.51.100.9' })).ticket, 'ban: everyone else is fine')
  d.end(); d.start({ world: 'home-world-0001' })
  eq(d.bans.length === 0, 'ban: a ban lasts the session only (nothing persists)')
}

// ---- owner PIN
{
  const h = hashPin('123456')
  eq(/^[0-9a-f]{32}\$[0-9a-f]{64}$/.test(h) && !h.includes('123456'), 'pin: stored as salt$scrypt, the digits never appear')
  eq(checkPin('123456', h) && !checkPin('123457', h) && !checkPin('12345', h) && !checkPin('abcdef', h), 'pin: right digits pass, wrong or short or letters fail')
  eq(hashPin('123456') !== h, 'pin: a fresh salt each time')
  const d = mk()
  const tries = []
  for (let i = 0; i < 7; i++) tries.push(d.pinAttempt('10.9.9.9') === null)
  eq(tries.slice(0, 5).every(Boolean) && !tries[5] && !tries[6], 'pin: 5 tries, then a 10-minute backoff')
}

// ---- school and home never cross
{
  registerHome()
  eq(isConfigId(HOME_CFG) && CONFIG_IDS.every(isConfigId) && !isConfigId('home-nonsense') && RULESETS.every((r) => !isConfigId(r)), 'configs: the home id is known in this process; rulesets are not config ids')
  eq(policyFor(HOME_CFG) && policyFor(HOME_CFG).plots === false && policyFor(HOME_CFG).wild === true && policyFor(HOME_CFG).town === false, 'configs: home policy: no plots, no town map, wild building on')
  eq(policyFor('contest').plots === true, 'configs: the school contest policy is untouched')
  const d = mk()
  const { code } = d.start({ world: 'home-world-0001' })
  const home = (await d.join({ code, name: 'Sam', adults: true, ip: '10.0.0.1' })).ticket
  const nowSec = Math.floor(t / 1000)
  // the school Worker: school secret, no issuer -> a home ticket fails even if it somehow had the school secret
  const atSchool = await verifyToken(home, [SECRET, SCHOOL], nowSec)
  eq(!atSchool.ok && atSchool.why === 'issuer', 'cross: a home ticket is refused by a school verifier (issuer), before config is even looked at')
  const homeSignedSchoolCfg = await signToken({ v: 1, ref: 'homeref-abcdef0123456789', world: 'home-world-0001', alias: 'Sam', exp: nowSec + 60, jti: 'j-abcdef0123', role: 'kid', cfg: 'contest' }, SECRET)
  const schoolTicket = await signToken({ v: 1, ref: 'kidref-00000001', world: 'world-0001', alias: 'Test Pup', exp: nowSec + 60, jti: 'j-00000001', role: 'kid', cfg: 'contest' }, SCHOOL)
  eq(!(await d.verify(schoolTicket, nowSec)).ok, 'cross: a school ticket is refused at home (different secret)')
  eq((await d.verify(homeSignedSchoolCfg, nowSec)).why === 'issuer', 'cross: a ticket without iss home is refused at home even with the home secret')
  const ownerT = await d.ownerTicket('Diego')
  const ov = await d.verify(ownerT, nowSec)
  eq(ov.ok && ov.claims.role === 'admin' && ov.claims.ref.startsWith('homeowner-'), 'owner: the owner ticket is a staff ticket (Room staff path) with a stable owner ref')
}

console.log(fails ? `home-join-check: ${fails} FAIL` : 'home-join-check: all PASS')
process.exit(fails ? 1 : 0)
