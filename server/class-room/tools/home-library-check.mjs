// Part 12 check: the cloud plugin library. The Worker's pure half (server/plugin-library/src/library.js) runs here on
// a plain Node http server standing in for plugins.kulibert.net; two hosts link to it and sync.
//   node --no-warnings tools/home-library-check.mjs
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import http from 'node:http'
import { makeLibrary, route } from '../../plugin-library/src/library.js'
import { EXAMPLES } from '../src/plugins.js'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- the stand-in library
const libs = new Map(), stores = new Map()
const lookup = async (hash) => { if (!libs.has(hash)) { const m = new Map(); stores.set(hash, m); libs.set(hash, makeLibrary({ get: async (k) => m.get(k), put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))) } })) } return libs.get(hash) }
let hits = 0
const srv = http.createServer(async (req, res) => {
  hits++
  let text = ''; for await (const c of req) text += c
  let body = null; if (text) { try { body = JSON.parse(text) } catch (e) { res.writeHead(400); return res.end('{"error":"json"}') } }
  const auth = req.headers.authorization || ''
  const r = await route({ method: req.method, path: new URL(req.url, 'http://x').pathname, bearer: auth.startsWith('Bearer ') ? auth.slice(7) : '', body, lookup })
  res.writeHead(r.status, { 'content-type': 'application/json' }); res.end(JSON.stringify(r.body))
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
const LIB = 'http://127.0.0.1:' + srv.address().port

// ---- two hosts
const hosts = []
async function host(tag) {
  const PORT = 19680 + ((process.pid + hosts.length * 7) % 100), DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-lib-' + tag + '-')), A = 'http://127.0.0.1:' + PORT
  const child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { stdio: ['ignore', 'pipe', 'pipe'] })
  const h = { tag, child, DATA, A, log: '' }
  child.stdout.on('data', (d) => (h.log += d)); child.stderr.on('data', (d) => (h.log += d))
  for (let i = 0; i < 100 && !/owner page/.test(h.log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(h.log)[1]
  const post = (p, b, hd = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...hd }, body: JSON.stringify(b || {}) }).then(async (r) => ({ status: r.status, ...(await r.json()) }))
  h.token = (await post('/owner/pin', { key, pin: '246810' })).token
  h.api = (p, b) => post('/owner/' + p, b, { 'x-owner': h.token })
  h.plugins = async () => (await h.api('plugins', {})).list
  hosts.push(h); return h
}
try {
  const A = await host('a'), B = await host('b')
  await A.api('world/open', { name: 'lib-world-a-0001' }); await B.api('world/open', { name: 'lib-world-b-0001' })
  const welcome = EXAMPLES.find((e) => e.id === 'welcome'), bell = EXAMPLES.find((e) => e.id === 'dinner-bell')
  eq((await A.api('library/status', {})).on === false && (await A.api('library/pull', {})).error === 'no-library', 'unlinked: status says so; pull is refused')

  // A makes a library; the key lands in home.json and nowhere else
  const made = await A.api('library/new', { url: LIB })
  const cfgA = JSON.parse(fs.readFileSync(path.join(A.DATA, 'home.json'), 'utf8'))
  eq(made.ok && !made.key && /^lk_[0-9a-f]{32}$/.test(cfgA.library.key) && cfgA.library.url === LIB && !A.log.includes(cfgA.library.key), 'new: a library is made and linked; the key is in home.json only (not in the reply, not in the log)')
  eq((await A.api('state', {})).library.on === true && !JSON.stringify(await A.api('state', {})).includes(cfgA.library.key.slice(3)), 'state: linked, and the key never rides along')

  // an in-game save on A goes up on its own
  await A.api('plugin/put', { plugin: welcome }); await sleep(400)
  const lib1 = await (await fetch(LIB + '/lib', { headers: { authorization: 'Bearer ' + cfgA.library.key } })).json()
  eq(lib1.plugins.length === 1 && lib1.plugins[0].id === 'welcome' && /plugins pushed to the library: 1/.test(A.log), 'auto-push: Save & run on A lands in the library')

  // B links with the same key (typed on B's host PC) and pulls; B turns it off locally, which does not change A
  const link = await B.api('library/link', { url: LIB, key: cfgA.library.key })
  eq(link.ok && link.count === 1, 'link: B links with the key and sees 1 plugin')
  const pull = await B.api('library/pull', {})
  eq(pull.ok && pull.count === 1 && (await B.plugins())[0].id === 'welcome', 'pull: B now has Welcome')
  await B.api('plugin/on', { id: 'welcome', on: false }); await sleep(300)
  await B.api('plugin/put', { plugin: bell }); await sleep(400)
  const pullA = await A.api('library/pull', {})
  const listA = await A.plugins()
  eq(pullA.ok && listA.length === 2 && listA.find((p) => p.id === 'welcome').on === true && listA.find((p) => p.id === 'dinner-bell'), 'per-server on/off: B\'s Welcome is off, A pulls B\'s new Dinner bell and keeps its own Welcome ON')

  // conflict: A pushes an older version without force -> 409; with force -> wins
  await A.api('plugin/drop', { id: 'dinner-bell' }); await sleep(400)   // auto-push bumps the library
  const pushB = await B.api('library/push', {})
  eq(pushB.error === 'conflict' && (await B.api('library/push', { force: true })).ok && (await A.api('library/pull', { force: true })).count === 2, 'conflict: B\'s push with a stale version is refused (409); force pushes; A pulls the bell back')

  // files: save, edit on disk, load, and it goes up
  const sv = await A.api('plugins/files/save', {})
  const dir = path.join(A.DATA, 'plugins')
  eq(sv.ok && sv.count === 2 && fs.existsSync(path.join(dir, 'welcome.json')) && fs.existsSync(path.join(dir, 'dinner-bell.json')), 'files: Save as files writes plugins/<id>.json in the data folder')
  const w = JSON.parse(fs.readFileSync(path.join(dir, 'welcome.json'), 'utf8')); w.name = 'Welcome (edited in a file)'; fs.writeFileSync(path.join(dir, 'welcome.json'), JSON.stringify(w))
  fs.writeFileSync(path.join(dir, 'junk.json'), '{"id":"junk","name":"x","rules":[{"when":{"e":"join"},"if":[],"do":[{"a":"explode"}]}]}')
  fs.writeFileSync(path.join(dir, 'wrong-name.json'), JSON.stringify({ ...bell, id: 'other-id' }))
  const ld = await A.api('plugins/files/load', {}); await sleep(400)
  eq(ld.ok && ld.count === 2 && ld.bad.length === 2 && (await A.plugins()).find((p) => p.id === 'welcome').name === 'Welcome (edited in a file)', 'files: Load files takes the good ones, skips junk and a misnamed file (' + (ld.bad || []).join(' | ') + ')')
  const lib2 = await (await fetch(LIB + '/lib', { headers: { authorization: 'Bearer ' + cfgA.library.key } })).json()
  eq(lib2.plugins.find((p) => p.id === 'welcome').name === 'Welcome (edited in a file)', 'files: the loaded edit went up to the library')

  // a world open pulls; a dead library is survived
  await A.api('world/open', { name: 'lib-world-a-0002' }); await sleep(600)
  eq((await A.plugins()).length === 2 && /plugins pulled from the library/.test(A.log), 'open: a newly opened world pulls the library')
  eq((await A.api('library/link', { url: LIB, key: 'lk_' + '0'.repeat(32) })).error === 'no-library' && (await A.api('state', {})).library.on === false, 'link: a key nobody made is refused and nothing is kept')
  const relink = await A.api('library/link', { url: LIB, key: cfgA.library.key })
  srv.close(); await sleep(100)
  const dead = await A.api('library/pull', {})
  eq(relink.ok && dead.error === 'unreachable' && (await A.plugins()).length === 2, 'offline: with the library down, pull says unreachable and the world keeps its plugins')
  eq((await fetch(B.A + '/owner/library/link', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': B.token, 'x-forwarded-for': '10.0.0.9' }, body: '{}' })).status === 403, 'link/new are host-PC only')
} catch (e) {
  eq(false, 'live run threw: ' + (e && e.message ? e.message.split('\n')[0] : e) + '\n' + hosts.map((h) => h.log.split('\n').slice(-5).join('\n')).join('\n--\n'))
} finally {
  for (const h of hosts) { try { await h.api('stop', {}) } catch (e) {} }
  await sleep(300); for (const h of hosts) { if (h.child.exitCode === null) h.child.kill(); fs.rmSync(h.DATA, { recursive: true, force: true }) }
  try { srv.close() } catch (e) {}
}
console.log(fails ? `home-library-check: ${fails} FAIL` : 'home-library-check: all PASS')
process.exit(fails ? 1 : 0)
