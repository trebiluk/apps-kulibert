// Home host fuzz check: garbage HTTP bodies, prototype keys, path tricks, oversized bodies and nasty socket frames.
// Passes when: no 5xx, oversized bodies get 413, the host still answers, and the log has no crash lines.
// Spawns its own host on a temp port and data dir. Run: node tools/home-fuzz-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'
const PORT = 19190 + (process.pid % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'fz-')), A = 'http://127.0.0.1:' + PORT
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
const key = /k=([0-9a-f]+)/.exec(log)[1]
const post = (p, b, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: typeof b === 'string' ? b : JSON.stringify(b) }).then(async (r) => ({ status: r.status, body: await r.text() }))
const tok = JSON.parse((await post('/owner/pin', { key, pin: '246810' })).body).token
const O = { 'x-owner': tok }
await post('/owner/world/open', { name: 'fuzz-world-1' }, O)
const code = JSON.parse((await post('/owner/session/start', {}, O)).body).code
const bad = []
// HTTP: garbage bodies, huge bodies, wrong types
for (const [p, b, h] of [['/join', 'not json'], ['/join', '{"code":1,"name":{},"adults":"true"}'], ['/join', '{"code":"' + 'A'.repeat(5000) + '"}'], ['/join', '{"code":"' + code + '","name":"x".repeat(1),"adults":true}'], ['/owner/rule', '{"id":{"a":1},"v":[]}', O], ['/owner/rule', '{"id":"__proto__","v":true}', O], ['/owner/ruleset', '{"ruleset":"constructor"}', O], ['/owner/rollback', '{"minutes":"1e9","ref":"../../x"}', O], ['/owner/kick', '{"ref":null}', O], ['/owner/world/open', '{"name":"../../../etc/passwd"}', O], ['/owner/world/restore', '{"file":"../../home.json"}', O], ['/owner/mute', '{"ref":{"toString":1}}', O]]) {
  let r; try { r = await post(p, b, h || {}) } catch (e) { r = { status: 599, body: e.cause ? e.cause.code : String(e) } } if (r.status >= 500) bad.push([p, b.slice(0, 40), r.status, r.body.slice(0, 60)])
}
console.log('HTTP 5xx:', bad.length ? JSON.stringify(bad) : 'none')
// WS: an owner socket, then every nasty frame
const big = await post('/join', '{"code":"' + 'A'.repeat(20000) + '"}')
console.log('oversized body:', big.status)
const j = JSON.parse((await post('/owner/play', { name: 'Fz' }, O)).body)
const ws = new WebSocket(j.ws, ['bt-room.v0', j.ticket]); let closed = null; ws.onclose = (e) => (closed = e.code)
await new Promise((r) => (ws.onopen = r)); await sleep(150)
const frames = ['', 'x', '{', '[]', 'null', '{"v":0}', '{"v":0,"t":5}', '{"v":0,"t":"b"}', '{"v":0,"t":"b","x":"1","y":[],"z":{},"id":-1,"b":null}', '{"v":0,"t":"b","x":1e300,"y":64,"z":1,"id":1,"b":0}', '{"v":0,"t":"craft","i":"' + 'z'.repeat(3000) + '"}', '{"v":0,"t":"st","k":"__proto__"}', '{"v":0,"t":"st","k":{"a":1}}', '{"v":0,"t":"hit","i":"me"}', '{"v":0,"t":"p","q":0,"x":1,"y":2,"z":3,"r":0,"f":"yes"}', '{"v":0,"t":"rules","r":{"core.break":false}}', '{"v":0,"t":"q","m":"hi"}', '{"v":0,"t":"ok","a":"craft"}', '{"v":9,"t":"b"}']
for (const f of frames) { if (ws.readyState !== 1) break; ws.send(f); await sleep(30) }
await sleep(300)
console.log('socket after nasty frames:', ws.readyState === 1 ? 'still open (Room decides per its own rules)' : 'closed ' + closed)
const st = await fetch(A + '/owner/state', { headers: O }).then((r) => r.json()).catch(() => ({}))
const crashes = (log.match(/TypeError|RangeError|ReferenceError|at .*home\.mjs/g) || []).length
console.log('host still answers:', !!st.version, '| crash lines in log:', crashes)
await post('/owner/stop', {}, O); await sleep(300); if (child.exitCode === null) child.kill(); fs.rmSync(DATA, { recursive: true, force: true })
console.log(log.split('\n').filter((l) => /Error/.test(l)).slice(0, 5).join('\n'))
const ok = !bad.length && big.status === 413 && !!st.version && !crashes
console.log(ok ? 'PASS fuzz: no 5xx, 413 on big bodies, host alive, no crash lines' : 'FAIL fuzz')
process.exit(ok ? 0 : 1)
