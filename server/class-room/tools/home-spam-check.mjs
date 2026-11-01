// Part 4 check (docs/bertopia/HOME-HOST.md §6, §10): every spam limit TRIPS and then RECOVERS.
// Pure half on a fake clock (join and PIN backoff are 10 minutes; nobody waits that long in a check), then a live
// host for what only shows on the wire: world chat, keep inventory, shared events, the Room's edit rate, world files, the log.
//   node --no-warnings tools/home-spam-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeDoor, registerHome, JOIN_PER_MIN, JOIN_BACKOFF_MS, PIN_TRIES, PIN_BACKOFF_MS, CONNS_PER_IP, DEFAULT_MAX_PLAYERS } from '../host/door.mjs'
import { cleanChat, makeChatGate, CHAT_MAX, CHAT_BURST, CHAT_REFILL_MS } from '../host/chat.mjs'
import { makeEvents, EVENT_BURST, EVENT_WINDOW_MS, EVENT_STALE_MS } from '../host/events.mjs'
import { makeRuleset, PRESETS } from '../host/rules.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------------------------------------------------------------- pure, fake clock
registerHome()
let t = Date.UTC(2026, 10, 1, 15, 0, 0)
const now = () => t
const door = makeDoor({ secret: 'home-secret-for-the-spam-check-0123456789', now })
const { code } = door.start({ world: 'spam-world-0001' })
{
  const ip = '198.51.100.7'
  const r = []
  for (let i = 0; i < JOIN_PER_MIN; i++) r.push(await door.join({ code: 'WRONG' + i, name: 'Guess' + i, adults: true, ip }))
  const sixth = await door.join({ code, name: 'Rightcode', adults: true, ip })
  eq(r.every((x) => x.error === 'code') && sixth.error === 'slow-down' && sixth.wait === JOIN_BACKOFF_MS / 1000, `join: ${JOIN_PER_MIN} tries a minute, then a ${JOIN_BACKOFF_MS / 60000}-minute wait even with the right code`)
  t += JOIN_BACKOFF_MS - 1000
  eq((await door.join({ code, name: 'Rightcode', adults: true, ip })).error === 'slow-down', 'join: still waiting just before the backoff ends')
  t += 2000
  eq(!!(await door.join({ code, name: 'Rightcode', adults: true, ip })).ticket, 'join: recovers after the backoff')
  eq(!!(await door.join({ code, name: 'Otherone', adults: true, ip: '198.51.100.8' })).ticket, 'join: one address waiting never blocks another')
}
{
  const ip = '198.51.100.20'
  const tries = []; for (let i = 0; i < PIN_TRIES; i++) tries.push(door.pinAttempt(ip))
  const over = door.pinAttempt(ip)
  eq(tries.every((x) => !x) && over && over.wait === PIN_BACKOFF_MS / 1000, `PIN: ${PIN_TRIES} tries, then a ${PIN_BACKOFF_MS / 60000}-minute wait`)
  t += PIN_BACKOFF_MS + 1000
  eq(!door.pinAttempt(ip), 'PIN: recovers after the backoff')
  for (let i = 0; i < PIN_TRIES - 1; i++) door.pinAttempt(ip); door.pinOk(ip)
  eq(!door.pinAttempt(ip), 'PIN: a right PIN clears the count')
}
{
  t += 120000
  const ip = '198.51.100.30'
  for (let i = 0; i < CONNS_PER_IP; i++) door.connOpen(ip)
  eq((await door.join({ code, name: 'Fourthtab', adults: true, ip })).error === 'too-many', `connections: ${CONNS_PER_IP} per address, the next join is refused`)
  door.connClose(ip)
  eq(!!(await door.join({ code, name: 'Fourthtab', adults: true, ip })).ticket, 'connections: recovers when one closes')
}
{
  t += 120000
  eq((await door.join({ code, name: 'Latecomer', adults: true, ip: '198.51.100.40', playersOnline: DEFAULT_MAX_PLAYERS })).error === 'full', `players: ${DEFAULT_MAX_PLAYERS} is full`)
  eq(!!(await door.join({ code, name: 'Latecomer', adults: true, ip: '198.51.100.40', playersOnline: DEFAULT_MAX_PLAYERS - 1 })).ticket, 'players: recovers when one leaves')
}
{
  t += 120000
  const j = await door.join({ code, name: 'Troll', adults: true, ip: '198.51.100.50' })
  door.ban(j.ref, 'Troll', '198.51.100.50')
  const again = await door.join({ code, name: 'Troll', adults: true, ip: '198.51.100.51' })
  const sameIp = await door.join({ code, name: 'Newname', adults: true, ip: '198.51.100.50' })
  eq(again.error === 'banned' && sameIp.error === 'banned', 'ban: same name from a new address and a new name from the same address are both refused')
  door.unban(j.ref)
  eq(!!(await door.join({ code, name: 'Troll', adults: true, ip: '198.51.100.52' })).ticket, 'ban: recovers on unban')
}
{
  eq(cleanChat('hello there').m === 'hello there' && cleanChat('x'.repeat(CHAT_MAX)).m && cleanChat('x'.repeat(CHAT_MAX + 1)).error === 'chat-long', `chat: ${CHAT_MAX} characters pass, ${CHAT_MAX + 1} is refused`)
  eq(cleanChat('   ').error === 'chat-empty' && cleanChat(42).error === 'chat-empty', 'chat: empty or non-text is refused')
  eq(cleanChat('f u c k').m === 'f u c k' && cleanChat('shit happens').m === 'shit happens', 'chat: no word filter (adults 18+)')
  eq(cleanChat('a\u202eb\u200bc\u0007d').m === 'abcd', 'chat: direction overrides, zero-width and control characters are removed')
  let ct = 0; const g = makeChatGate({ now: () => ct })
  const burst = []; for (let i = 0; i < CHAT_BURST; i++) burst.push(g.check('r1'))
  const over = g.check('r1'), other = g.check('r2'); ct += CHAT_REFILL_MS
  eq(burst.every((x) => x === null) && over && over.wait === 1 && other === null && g.check('r1') === null && g.check('r1') !== null, `chat: a burst of ${CHAT_BURST}, then 1 a second per player; players do not share a bucket`)
  eq(Object.values(PRESETS).every((p) => p['chat.typed'] === true) && makeRuleset('home-school').set('chat.typed', false).ok, 'chat: on in every preset; the owner can turn it off, even under "Same as school"')
  eq(Object.values(PRESETS).every((p) => p['survival.keep'] === true) && makeRuleset('home-school').set('survival.keep', false).ok && makeRuleset('home-school').set('core.break', false).error === 'locked', 'keep inventory: on in every preset; a world toggle even under "Same as school" (game rules stay locked)')
}
{
  let et = 0; const ev = makeEvents({ now: () => et })
  const A = { ref: 'a', alias: 'Ana', staff: false }, B = { ref: 'b', alias: 'Ben', staff: false }, O = { ref: 'o', alias: 'Owner', staff: true }
  const s1 = ev.handle(A, { k: 'boss', a: 'start' })
  eq(s1.relay && s1.relay.a === 'start' && s1.relay.by === 'Ana' && ev.handle(B, { k: 'boss', a: 'start' }).error === 'ev-busy', 'events: one boss fight per world; a second start is refused')
  eq(ev.handle(B, { k: 'boss', a: 'phase', phase: 2 }).error === 'ev-not-yours' && ev.handle(A, { k: 'boss', a: 'phase', phase: 2, pct: 50 }).relay.pct === 50, 'events: only the starter moves the fight on')
  eq(ev.handle(A, { k: 'boss', a: 'phase', pct: 33 }).error === 'ev-shape' && ev.handle(A, { k: 'nuke', a: 'start' }).error === 'ev-shape', 'events: odd percentages and unknown kinds are refused')
  eq(ev.handle(A, { k: 'boss', a: 'phase', phase: 3 }).error === 'ev-slow', `events: ${EVENT_BURST} frames per ${EVENT_WINDOW_MS / 1000} s per player`)
  et += EVENT_WINDOW_MS
  eq(ev.handle(A, { k: 'boss', a: 'phase', phase: 3 }).relay, 'events: recovers after the window')
  eq(ev.current().a === 'live' && ev.handle(O, { k: 'boss', a: 'end' }).relay.a === 'end' && ev.current() === null, 'events: a newcomer hears the live fight; the owner can end it')
  ev.handle(B, { k: 'boss', a: 'start' }); const left = ev.leave('b')
  eq(left && left.a === 'end' && left.won === false && ev.current() === null, 'events: the fight ends when its starter leaves')
  ev.handle(A, { k: 'boss', a: 'start' }); et += EVENT_STALE_MS + 1
  eq(ev.current() === null && ev.handle(B, { k: 'boss', a: 'start' }).relay, 'events: a fight with no news for 15 minutes is forgotten')
}

// ---------------------------------------------------------------- live host
const PORT = 19290 + (process.pid % 100)
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-spam-'))
const H = 'http://127.0.0.1:' + PORT
let child = null, log = '', token = null, CODE = '', ipN = 30
const post = (p, b, h = {}) => fetch(H + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
async function sock(j) {
  const c = { nos: [], chat: [], ev: [], rules: [], hello: null }
  c.ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  c.ws.onmessage = (m) => { const f = JSON.parse(m.data); if (f.t === 'hello') c.hello = f; else if (f.t === 'no') c.nos.push(f); else if (f.t === 'chat') c.chat.push(f); else if (f.t === 'ev') c.ev.push(f); else if (f.t === 'rules') c.rules.push(f) }
  c.closed = null; c.ws.onclose = (e) => (c.closed = e.code)
  await new Promise((r, x) => { c.ws.onopen = r; c.ws.onerror = () => x(new Error('socket refused')) })
  for (let i = 0; i < 100 && !c.hello; i++) await sleep(20)
  c.send = (o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
  c.codes = () => c.nos.map((n) => n.c)
  return c
}
const player = async (name) => sock(await post('/join', { code: CODE, name, adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ }))
try {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA, '--show-chat'], { stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  await api('world/open', { name: 'spam-world-0001' })
  CODE = (await api('session/start', { ruleset: 'home-survival' })).code
  const own = await api('play', { name: 'Diego' })
  const O = await sock(own)
  const A = await player('Ana Spam'), B = await player('Ben Spam')

  // world chat: on by default, no filter, burst then 1 a second
  A.send({ t: 'chat', m: 'hi all' }); await sleep(200)
  eq(B.chat.at(-1) && B.chat.at(-1).m === 'hi all' && B.chat.at(-1).a === 'Ana Spam' && O.chat.length === 1, 'live chat: on by default; everyone hears it with the sender\'s display name')
  A.send({ t: 'chat', m: 'shit, that is a lot of lava' }); await sleep(150)
  eq(B.chat.at(-1).m === 'shit, that is a lot of lava', 'live chat: no word filter')
  for (let i = 0; i < CHAT_BURST; i++) A.send({ t: 'chat', m: 'spam ' + i }); await sleep(250)
  const slowNo = A.nos.find((n) => n.c === 'chat-slow')
  eq(slowNo && slowNo.wait >= 1 && !B.chat.some((c) => c.m === 'spam ' + (CHAT_BURST - 1)), `live chat: past the burst a message is refused with a wait and not relayed`)
  await sleep(CHAT_REFILL_MS + 200)
  A.send({ t: 'chat', m: 'again!' }); await sleep(200)
  eq(B.chat.at(-1).m === 'again!', 'live chat: recovers after a second')
  B.send({ t: 'chat', m: 'y'.repeat(CHAT_MAX + 1) }); await sleep(150)
  eq(B.codes().includes('chat-long') && A.chat.every((c) => c.a !== 'Ben Spam'), 'live chat: over 200 characters is refused and never relayed')
  await api('rule', { id: 'chat.typed', v: false }); await sleep(150)
  O.send({ t: 'chat', m: 'owner too?' }); await sleep(200)
  eq(O.codes().includes('rule:chat.typed') && !A.chat.some((c) => c.m === 'owner too?'), 'live chat: the owner can turn it off; off means off for the owner too')
  await api('rule', { id: 'chat.typed', v: true }); await sleep(150)
  const ref = (await (await fetch(H + '/owner/state', { headers: { 'x-owner': token } })).json()).live.players.find((p) => p.name === 'Ben Spam').ref
  await api('mute', { ref, on: true }); await sleep(CHAT_REFILL_MS)
  B.send({ t: 'chat', m: 'can you hear me' }); await sleep(200)
  eq(B.codes().includes('chat-muted') && !A.chat.some((c) => c.m === 'can you hear me'), 'live chat: a muted player is told and not relayed')
  await api('mute', { ref, on: false }); await sleep(CHAT_REFILL_MS)
  B.send({ t: 'chat', m: 'back now' }); await sleep(200)
  eq(A.chat.at(-1).m === 'back now', 'live chat: recovers on unmute')
  const files = fs.readdirSync(DATA, { recursive: true }).map(String)
  const onDisk = files.filter((f) => !fs.statSync(path.join(DATA, f)).isDirectory()).some((f) => fs.readFileSync(path.join(DATA, f)).includes('back now'))
  eq(!onDisk, 'live chat: no message is written to disk (the host window shows it only with --show-chat)')

  // keep inventory: world toggle, then one player set apart; each player's rules frame carries their own value
  const rulesOf = (c) => c.rules.at(-1) || {}
  await api('rule', { id: 'survival.keep', v: false }); await sleep(200)
  eq(rulesOf(A).r['survival.keep'] === false && rulesOf(B).r['survival.keep'] === false && rulesOf(B).keep === 'world', 'keep inventory: the world toggle reaches every player')
  const kb = await api('keep', { ref, on: true }); await sleep(200)
  eq(kb.ok && kb.keep === true && kb.from === 'player' && rulesOf(B).r['survival.keep'] === true && rulesOf(B).keep === 'player' && rulesOf(A).r['survival.keep'] === false, 'keep inventory: the owner sets one player apart; only that player hears it')
  const st = (await (await fetch(H + '/owner/state', { headers: { 'x-owner': token } })).json()).live.players
  eq(st.find((p) => p.ref === ref).keepOwn === true && st.find((p) => p.name === 'Ana Spam').keep === false, 'keep inventory: the owner page shows who follows the world and who is set')
  await api('rule', { id: 'survival.keep', v: true }); await api('rule', { id: 'survival.keep', v: false }); await sleep(200)
  eq(rulesOf(B).r['survival.keep'] === true, 'keep inventory: a player\'s own setting survives world changes')
  await api('keep', { ref, on: null }); await sleep(200)
  eq(rulesOf(B).r['survival.keep'] === false && rulesOf(B).keep === 'world', 'keep inventory: "Use world" puts the player back on the world value')
  eq((await api('keep', { ref, on: 'yes' })).error === 'value' && (await api('keep', { ref: '', on: true })).error === 'ref', 'keep inventory: odd values and empty refs are refused')
  await api('rule', { id: 'survival.keep', v: true })

  // shared events
  A.send({ t: 'ev', k: 'boss', a: 'start' }); await sleep(200)
  eq(B.ev.at(-1) && B.ev.at(-1).a === 'start' && B.ev.at(-1).by === 'Ana Spam' && O.ev.length === 1, 'live events: a boss start reaches everyone')
  B.send({ t: 'ev', k: 'boss', a: 'start' }); await sleep(150)
  eq(B.codes().includes('ev-busy'), 'live events: a second fight is refused while one is on')
  const C = await player('Cat Late'); await sleep(150)
  eq(C.ev.at(-1) && C.ev.at(-1).a === 'live' && C.ev.at(-1).by === 'Ana Spam', 'live events: a late joiner hears the fight that is on')
  A.ws.close(); await sleep(300)
  eq(B.ev.at(-1).a === 'end' && B.ev.at(-1).won === false, 'live events: the fight ends for everyone when its starter leaves')

  // edits: the Room's own rate (school code, unchanged)
  for (let i = 0; i < 16; i++) B.send({ t: 'b', x: 10 + i, y: 64, z: 12, id: 1, b: 0 })
  await sleep(400)
  const rated = B.codes().filter((c) => c === 'rate').length
  await sleep(1300); B.nos.length = 0
  B.send({ t: 'b', x: 40, y: 64, z: 40, id: 1, b: 0 }); await sleep(300)
  eq(rated > 0 && !B.codes().includes('rate') && B.closed === null, `live edits: a burst trips the Room's edit rate (${rated} refused), then recovers; the socket stays open`)

  // world files: export, import as a new world, refuse what is not a world
  const ex = await fetch(H + '/owner/world/export?name=spam-world-0001', { headers: { 'x-owner': token } })
  const bytes = Buffer.from(await ex.arrayBuffer())
  eq(ex.status === 200 && bytes.subarray(0, 15).toString('latin1') === 'SQLite format 3' && /spam-world-0001\.bertopia-world/.test(ex.headers.get('content-disposition') || ''), 'world file: export downloads the world as one file')
  const up = (name, body) => fetch(H + '/owner/world/import?name=' + name, { method: 'POST', headers: { 'x-owner': token, 'content-type': 'application/octet-stream' }, body }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
  const im = await up('copy-world-0001', bytes)
  eq(im.ok && fs.existsSync(path.join(DATA, 'worlds', 'copy-world-0001.sqlite')), 'world file: import makes a new world from it')
  eq((await up('copy-world-0001', bytes)).error === 'exists', 'world file: an import never replaces a world')
  eq((await up('junk-world-0001', Buffer.from('not a world at all'))).error === 'not-a-world' && (await up('../../etc0000', bytes)).error === 'name', 'world file: a non-SQLite file and a path-like name are refused')
  const bad = Buffer.from(bytes); bad.fill(7, 4096, 8192)
  const dmg = await up('dmg-world-0001', bad)
  eq(dmg.error === 'damaged' || dmg.error === 'not-a-world', 'world file: a damaged file is refused (' + dmg.error + ')')
  eq(!fs.readdirSync(path.join(DATA, 'worlds')).some((f) => /junk|dmg/.test(f)) && !fs.readdirSync(path.join(DATA, 'backups')).some((f) => f.startsWith('.import-')), 'world file: refused uploads leave nothing behind')
  eq((await fetch(H + '/owner/world/export?name=spam-world-0001')).status === 401, 'world file: export needs the owner sign-in')

  // behind a local TLS proxy the join reply hands out wss:// (the README's advice has to actually work)
  const viaTls = await post('/join', { code: CODE, name: 'Tls Tester', adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++, 'x-forwarded-proto': 'https' })
  const plain = await post('/join', { code: CODE, name: 'Lan Tester', adults: true }, { 'x-forwarded-for': '203.0.113.' + ipN++ })
  eq(/^wss:\/\//.test(viaTls.ws || '') && /^ws:\/\//.test(plain.ws || ''), 'TLS proxy: a join through the local proxy gets wss://, a plain one ws://')

  // the log: failure codes only
  eq(!log.includes(CODE) && !log.includes('246810') && !log.includes(token) && !/203\.0\.113\.\d/.test(log) && !/\b(no-owner|chat-|ev-)/.test(log), 'log: no session code, PIN, owner token, player address or error noise')
  await sleep(5200)   // the block tally prints 5 s after the last edit
  for (const rx of [/\] Ana Spam joined · \d in/, /\] Ana Spam: hi all/, /\] Ben Spam placed \d+ block/, /\] owner muted Ben Spam/, /\] Ana Spam started a boss fight/, /\] session started · world spam-world-0001/]) if (!rx.test(log)) console.log("MISSING", String(rx))
  eq(/\] Ana Spam joined · \d in/.test(log) && /\] Ana Spam: hi all/.test(log) && /\] Ben Spam placed \d+ block/.test(log) && /\] owner muted Ben Spam/.test(log) && /\] Ana Spam started a boss fight/.test(log) && /\] session started · world spam-world-0001/.test(log), 'feed: joins, chat (with --show-chat), block counts, owner actions, boss fights and the session show in the host window')
  eq(!/\] [^\n]*(no-owner|chat-slow|ev-busy)/.test(log), 'feed: refusals are not noise in the feed')
  for (const c of [O, B, C]) try { c.ws.close() } catch (e) {}
} catch (e) {
  eq(false, 'live run threw: ' + e.message)
} finally {
  try { await post('/owner/stop', {}, { 'x-owner': token }) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true })
}
console.log(fails ? `home-spam-check: ${fails} FAIL` : 'home-spam-check: all PASS')
console.log('note: quick chat (essentials.js, 1 per 2 s burst 3) is standalone and not wired into the Room yet; its limit is checked by its own unit tests, not here.')
process.exit(fails ? 1 : 0)
