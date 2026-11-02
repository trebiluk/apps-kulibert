// Master Control part 2 check: the teacher controls against a mocked class server (the real one is tested in
// server/class-room/test/control.test.mjs). Serves /master-control and /shared from this repo, intercepts
// https://class.kulibert.net/*, and drives the page at 1366 and 412.   node tools/master-control-check.mjs
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let chromium
for (const from of [path.join(ROOT, 'bloxbert-src', 'package.json'), import.meta.url]) { try { ({ chromium } = createRequire(from)('playwright')); break } catch (e) {} }
if (!chromium) { console.log('master-control-check: SKIP — Playwright missing'); process.exit(0) }
let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }
const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html'
  const f = path.join(ROOT, p)
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nope') }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); res.end(fs.readFileSync(f))
})
await new Promise((r) => srv.listen(0, '127.0.0.1', r))
const H = 'http://127.0.0.1:' + srv.address().port
const browser = await chromium.launch()
try {
  for (const [w, h] of [[1366, 768], [412, 915]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }), pg = await ctx.newPage()
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e)))
    // the mocked class server
    const calls = []; let flags = { open: true, chat: true }, frozen = false
    await pg.route('https://class.kulibert.net/**', async (route) => {
      const req = route.request(), url = new URL(req.url()), body = req.postData() ? JSON.parse(req.postData()) : {}
      const auth = req.headers().authorization || ''
      calls.push([url.pathname, body, !!auth])
      const json = (status, b) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type' }, body: JSON.stringify(b) })
      if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS' } })
      if (url.pathname === '/rt/health') return route.fulfill({ status: 200, body: 'ok', headers: { 'access-control-allow-origin': '*' } })
      if (url.pathname === '/rt/staff/login') return body.pass === 'open sesame' ? json(200, { ok: true, ticket: 'tkt-test', exp: Math.floor(Date.now() / 1000) + 300 }) : json(401, { error: 'password', left: 4 })
      if (auth !== 'Bearer tkt-test') return json(401, { error: 'ticket' })
      if (url.pathname === '/rt/control/state') return json(200, { flags, rooms: [{ rid: 'world-0001-r1', wid: 'world-0001', kids: 12, staff: 1, frozen }], at: Date.now() })
      if (url.pathname === '/rt/control/open' || url.pathname === '/rt/control/chat') { flags[url.pathname.split('/').pop()] = body.on; return json(200, { ok: true, flags }) }
      if (url.pathname === '/rt/control/freeze') { frozen = body.on; return json(200, { ok: true, frozen }) }
      if (url.pathname === '/rt/control/kick') return body.alias === 'Pup 01' ? json(200, { ok: true }) : json(400, { error: 'no-such-player' })
      if (url.pathname === '/rt/control/rollback') return json(200, { ok: true, cells: 42, minutes: body.minutes })
      return json(404, { error: 'not found' })
    })
    let nextPrompt = 'wrong'
    pg.on('dialog', (d) => d.type() === 'prompt' ? d.accept(nextPrompt) : d.accept())
    await pg.goto(H + '/master-control/'); await sleep(600)
    const tag = `@${w}`
    eq(/Class server: up/.test(await pg.textContent('#tc-state')), `${tag} health: the card says the class server is up`)
    eq(await pg.evaluate(() => document.getElementById('tc-open').disabled && document.getElementById('tc-chat').disabled && !document.querySelector('#tc-rooms table')), `${tag} signed out: switches disabled, no rooms shown`)
    await pg.click('#tc-unlock'); await sleep(400)
    eq(/Wrong password \(4 tries left\)/.test(await pg.textContent('#tc-state')), `${tag} sign-in: a wrong password is told so with the tries left`)
    nextPrompt = 'open sesame'; await pg.click('#tc-unlock'); await sleep(600)
    const st = await pg.evaluate(() => ({ state: document.getElementById('tc-state').textContent, open: document.getElementById('tc-open').textContent, pressed: document.getElementById('tc-open').getAttribute('aria-pressed'), rows: document.querySelectorAll('#tc-rooms tbody tr').length, who: document.getElementById('tc-who').textContent, unlockHidden: document.getElementById('tc-unlock').hidden }))
    eq(/1 live room · multiplayer on · chat on/.test(st.state) && st.open === 'Multiplayer: ON' && st.pressed === 'true' && st.rows === 1 && /Signed in/.test(st.who) && st.unlockHidden, `${tag} signed in: state painted, one room row, the countdown shows (${st.state})`)
    await pg.click('#tc-open'); await sleep(400)
    eq(calls.some((c) => c[0] === '/rt/control/open' && c[1].on === false && c[2]) && (await pg.textContent('#tc-open')) === 'Multiplayer: OFF', `${tag} multiplayer switch: sends open:false with the ticket and repaints OFF`)
    await pg.click('#tc-chat'); await sleep(400)
    eq((await pg.textContent('#tc-chat')) === 'Chat: OFF', `${tag} chat switch: repaints OFF`)
    await pg.click('#tc-rooms tbody button:has-text("Freeze")'); await sleep(400)
    eq(calls.some((c) => c[0] === '/rt/control/freeze' && c[1].room === 'world-0001-r1' && c[1].on === true) && !!(await pg.$('#tc-rooms tbody button:has-text("Unfreeze")')), `${tag} freeze: sends room + on and the button turns into Unfreeze`)
    await pg.fill('#tc-rooms input[type=text]', 'Pup 01'); await pg.click('#tc-rooms button:has-text("Kick")'); await sleep(400)
    eq(calls.some((c) => c[0] === '/rt/control/kick' && c[1].alias === 'Pup 01') && /Kicked Pup 01/.test(await pg.textContent('#tc-state')), `${tag} kick: confirms, sends the alias, says so`)
    await pg.fill('#tc-rooms input[type=number]', '15'); await pg.click('#tc-rooms button:has-text("Rollback")'); await sleep(400)
    eq(calls.some((c) => c[0] === '/rt/control/rollback' && c[1].minutes === 15) && /Rolled back 42 blocks \(15 min\)/.test(await pg.textContent('#tc-state')), `${tag} rollback: confirms, sends minutes, reports the cells`)
    const small = await pg.evaluate(() => [...document.querySelectorAll('#teacher button, #teacher input')].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).length)
    const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)
    eq(small === 0 && !overflow, `${tag} every control is at least 44 px tall and nothing overflows sideways`)
    eq(!errs.length, `${tag} no page errors${errs.length ? ': ' + errs[0] : ''}`)
    await ctx.close()
  }
} catch (e) {
  eq(false, 'run threw: ' + (e && e.message ? e.message.split('\n')[0] : e))
} finally { await browser.close(); srv.close() }
console.log(fails ? `master-control-check: ${fails} FAIL` : 'master-control-check: all PASS')
process.exit(fails ? 1 : 0)
