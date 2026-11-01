// Part 4 check (docs/bertopia/HOME-HOST.md §7, §10): two real browser clients at 1366 and 412.
//
// Half A — the home client code (bloxbert-src/src/home/home.js, bundled with __HOME_HOST__=true) in Chromium against a
//   live host that serves it as its game: join screen, owner skip, see each other, build, rules toast, typed chat dock,
//   boss news, Update card, inclusion checks (44 px targets, focus ring, no sideways scroll, text not colour alone).
// Half B — the FULL home game (../../bertopia-home, from `npm run build:home`): both clients reach a running world.
//   Skipped, and said so, when that build is not there.
//
//   node --no-warnings tools/home-play-check.mjs
//   needs: esbuild (bloxbert-src/node_modules, or BT_ESBUILD=<path to the esbuild package>) and playwright
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')
const SRC = path.join(REPO, 'bloxbert-src')
let fails = 0, skips = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const skip = (msg) => { console.log('SKIP  ' + msg); skips++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const need = (name, hint) => { for (const from of [path.join(SRC, 'package.json'), import.meta.url]) { try { return createRequire(from)(name) } catch (e) {} } if (hint) try { return createRequire(import.meta.url)(hint) } catch (e) {} return null }

const esbuild = need('esbuild', process.env.BT_ESBUILD)
const pw = need('playwright')
if (!esbuild || !pw) {
  skip(`browser play check needs ${!esbuild ? 'esbuild (npm ci in bloxbert-src, or BT_ESBUILD=…)' : ''}${!esbuild && !pw ? ' and ' : ''}${!pw ? 'playwright' : ''}`)
  process.exit(0)
}
const GAMEV = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8')).version

// ---- the harness "game": the real home.js, served by the host exactly where the home build would be
const GAME = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-harness-'))
const entry = path.join(GAME, 'entry.js')
fs.writeFileSync(entry, `import * as HOME from ${JSON.stringify(path.join(SRC, 'src', 'home', 'home.js'))}
window.HOME = HOME; window.toasts = []; window.frames = []
const v = new URLSearchParams(location.search).get('v') || ${JSON.stringify(GAMEV)}
HOME.registerHomeRules()
HOME.setHomeToast((t) => { window.toasts.push(t); const d = document.createElement('div'); d.className = 'toast'; d.textContent = t; document.getElementById('toasts').append(d) })
HOME.homeJoinScreen({ lang: 'en', version: v }).then((s) => { window.session = s; const ws = HOME.homeSocket(); if (ws) ws.addEventListener('message', (m) => { try { window.frames.push(JSON.parse(m.data)) } catch (e) {} }) })
`)
await esbuild.build({ entryPoints: [entry], bundle: true, format: 'iife', outfile: path.join(GAME, 'harness.js'), define: { __HOME_HOST__: 'true' }, logLevel: 'error', target: 'es2020' })
fs.writeFileSync(path.join(GAME, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="bertopia-home" content="1"><title>home play check</title>
<style>body{margin:0;min-height:100vh;background:#1e293b;color:#f8fafc;font:14px system-ui}#toasts{position:fixed;bottom:12px;inset-inline:12px}.toast{background:#0f172a;border:1px solid #475569;border-radius:10px;padding:8px 12px;margin-top:6px}</style></head>
<body><div id="toasts" role="status" aria-live="polite"></div><script src="harness.js"></script></body></html>`)

// ---- the host
const PORT = 19390 + (process.pid % 100)
const DATA = fs.mkdtempSync(path.join(os.tmpdir(), 'topia-play-'))
const H = 'http://localhost:' + PORT
let child = null, log = '', token = null, CODE = ''
const post = (p, b, h = {}) => fetch(H + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
const browser = await pw.chromium.launch()
try {
  child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA, '--game', GAME], { cwd: path.join(HERE, '..'), stdio: ['ignore', 'pipe', 'pipe'] })
  child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  token = (await post('/owner/pin', { key, pin: '246810' })).token
  await api('world/open', { name: 'play-world-0001' })
  CODE = (await api('session/start', { ruleset: 'home-survival' })).code

  let round = 0
  for (const [w, h] of [[1366, 768], [412, 915]]) {
    round++
    const tag = `@${w}:`
    await api('ruleset', { ruleset: 'home-survival' })
    // owner: the owner page hands over a ticket in sessionStorage; the join screen is skipped
    const oc = await browser.newContext({ viewport: { width: w, height: h } }), O = await oc.newPage()
    const errs = []; O.on('pageerror', (e) => errs.push(String(e)))
    await O.goto(H + '/join.html'); const own = await api('play', { name: 'Diego' })
    await O.evaluate((t) => sessionStorage.setItem('bt-home-owner-ticket', JSON.stringify(t)), own)
    await O.goto(H + '/?owner=1'); await O.waitForFunction(() => window.session, null, { timeout: 8000 })
    eq(await O.evaluate(() => window.HOME.homeOwnerOn() && !document.querySelector('#hj-go')), `${tag} owner skips the join screen and is the owner`)

    // player: the real join screen, by keyboard where it matters
    const pc = await browser.newContext({ viewport: { width: w, height: h } }), P = await pc.newPage()
    P.on('pageerror', (e) => errs.push(String(e)))
    await P.goto(H + '/')
    await P.waitForSelector('#hj-go')
    const joinTargets = await P.evaluate(() => [...document.querySelectorAll('#hj-go,#hj-solo,input[type=text]')].filter((e) => e.offsetParent).map((e) => Math.round(e.getBoundingClientRect().height)))
    eq(joinTargets.length >= 4 && joinTargets.every((x) => x >= 44), `${tag} join screen: every button and field is at least 44 px (${joinTargets.join(',')})`)
    await P.fill('#hj-code', CODE.slice(0, 4) + ' ' + CODE.slice(4)); await P.fill('#hj-name', round === 1 ? 'Ana Play' : 'Bo Play'); await P.check('#hj-adults')
    await P.focus('#hj-code'); await P.keyboard.press('Enter')
    await P.waitForFunction(() => window.session, null, { timeout: 8000 })
    eq(await P.evaluate(() => !window.HOME.homeOwnerOn() && !document.querySelector('#hj-go')), `${tag} player joins through the screen (Enter on the code) and is not the owner`)
    const seen = await P.evaluate(() => (window.session.hello.players || []).map((p) => p.a))
    eq(seen.includes('Diego'), `${tag} the player sees the owner in the world (${seen.join(', ')})`)

    // see each other move, and build
    await O.evaluate(() => window.HOME.homeSend({ t: 'p', q: 1, x: 10.5, y: 64, z: 10.5, r: 0, f: 0 }))
    await P.evaluate(() => window.HOME.homeSend({ t: 'p', q: 1, x: 11.5, y: 64, z: 10.5, r: 0, f: 0 })); await sleep(700)
    const moved = await O.evaluate(() => window.frames.some((f) => f.t !== 'o' && JSON.stringify(f).includes('11.5')))
    eq(moved, `${tag} the owner sees the player's position`)
    await P.evaluate((z) => window.HOME.homeSend({ t: 'b', x: 11, y: 64, z, id: 1, b: 0 }), 11 + round); await sleep(400)
    eq(await O.evaluate(() => window.frames.some((f) => f.t === 'o' && f.o.length)), `${tag} the player builds and the owner sees the block`)

    // rules toast
    await api('ruleset', { ruleset: 'home-creative' }); await sleep(400)
    eq((await P.evaluate(() => window.toasts.join(' | '))).includes('Rules changed: Creative'), `${tag} a ruleset change shows the player a calm toast`)

    // typed chat: hidden while off; the owner turns it on; the dock works by keyboard; the 2 s gap is explained
    eq(await P.evaluate(() => !document.querySelector('#home-chat') || document.querySelector('#home-chat').hidden), `${tag} chat: no chat button while typed chat is off`)
    await api('rule', { id: 'chat.typed', v: true }); await sleep(400)
    await P.waitForSelector('#home-chat .hc-toggle', { state: 'visible', timeout: 4000 })
    const tg = await P.evaluate(() => { const b = document.querySelector('#home-chat .hc-toggle'), r = b.getBoundingClientRect(); return { h: r.height, w: r.width, label: b.getAttribute('aria-label'), exp: b.getAttribute('aria-expanded') } })
    eq(tg.h >= 44 && tg.w >= 44 && /Chat/.test(tg.label) && tg.exp === 'false', `${tag} chat: the button appears when the owner turns chat on (44 px, labelled, collapsed)`)
    await P.focus('#home-chat .hc-toggle'); await P.keyboard.press('Enter'); await sleep(150)
    const opened = await P.evaluate(() => ({ exp: document.querySelector('#home-chat .hc-toggle').getAttribute('aria-expanded'), focus: document.activeElement && document.activeElement.matches('#home-chat input') }))
    eq(opened.exp === 'true' && opened.focus, `${tag} chat: Enter on the button opens the panel and puts the cursor in the box`)
    const ring = await P.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth })
    eq(/solid 3px/.test(ring), `${tag} chat: the focused box has a 3 px focus ring (${ring})`)
    await P.keyboard.type('hello from the play check'); await P.keyboard.press('Enter'); await sleep(400)
    await O.evaluate(() => { const b = document.querySelector('#home-chat .hc-toggle'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click() })
    const line = await O.evaluate(() => [...document.querySelectorAll('#home-chat .hc-log li')].map((l) => l.textContent).at(-1) || '')
    eq(line === (round === 1 ? 'Ana Play' : 'Bo Play') + ': hello from the play check', `${tag} chat: the owner's panel shows "${line}"`)
    await P.keyboard.type('<img src=x onerror=alert(1)>'); await P.keyboard.press('Enter'); await sleep(150)
    const slow = await P.evaluate(() => document.querySelector('#home-chat .hc-msg').textContent)
    eq(/Wait \d s\./.test(slow), `${tag} chat: a second message inside 2 s says "${slow}"`)
    await sleep(2100); await P.keyboard.type('<img src=x onerror=alert(1)>'); await P.keyboard.press('Enter'); await sleep(400)
    const asText = await O.evaluate(() => ({ imgs: document.querySelectorAll('#home-chat img').length, last: [...document.querySelectorAll('#home-chat .hc-log li')].map((l) => l.textContent).at(-1) }))
    eq(asText.imgs === 0 && asText.last.endsWith('<img src=x onerror=alert(1)>'), `${tag} chat: markup in a message arrives as plain text`)
    const unread = await P.evaluate(async () => { document.querySelector('#home-chat .hc-toggle').click(); await new Promise((r) => setTimeout(r, 50)); return document.querySelector('#home-chat .hc-toggle').textContent })
    await O.evaluate(() => window.HOME.homeSend({ t: 'chat', m: 'owner says hi' })); await sleep(400)
    const badge = await P.evaluate(() => document.querySelector('#home-chat .hc-toggle').textContent)
    eq(/1 new/.test(badge) && !/new/.test(unread), `${tag} chat: a closed panel counts new messages in words ("${badge}"), not colour alone`)
    await P.keyboard.press('Escape')

    // boss news: the player's local Overseer starts and ends a fight; the owner hears both
    await P.evaluate(() => window.HOME.homeBossTick({ id: 'overseer-play', hp: 300, maxHp: 300, phase: 1 })); await sleep(400)
    eq((await O.evaluate(() => window.toasts.join(' | '))).includes((round === 1 ? 'Ana Play' : 'Bo Play') + ' started a Foundry Overseer fight'), `${tag} boss: the owner hears the player's fight start`)
    await P.evaluate(() => window.HOME.homeBossTick({ id: 'overseer-play', hp: 0, maxHp: 300, phase: 3 })); await P.evaluate(() => window.HOME.homeBossTick(null)); await sleep(400)
    eq((await O.evaluate(() => window.toasts.join(' | '))).includes('The Foundry Overseer was rebooted!'), `${tag} boss: the owner hears it was beaten`)
    eq(!(await P.evaluate(() => window.toasts.join(' | '))).includes('started a Foundry Overseer'), `${tag} boss: the player who started it is not told about their own fight`)

    // inclusion on both pages
    for (const [pg, who] of [[P, 'player'], [O, 'owner']]) {
      const inc = await pg.evaluate(() => ({ over: document.documentElement.scrollWidth > innerWidth, small: [...document.querySelectorAll('button,input:not([type=checkbox])')].filter((e) => e.offsetParent).filter((e) => e.getBoundingClientRect().height < 44).map((e) => e.className || e.id || e.tagName) }))
      eq(!inc.over && !inc.small.length, `${tag} ${who}: no sideways scroll, nothing under 44 px${inc.small.length ? ' (' + inc.small.join(',') + ')' : ''}`)
    }
    await P.screenshot({ path: path.join(os.tmpdir(), `home-play-${w}.png`) })
    eq(!errs.length, `${tag} no page errors${errs.length ? ': ' + errs.join(' / ') : ''}`)
    await api('rule', { id: 'chat.typed', v: false }); await sleep(200)
    eq(await P.evaluate(() => document.querySelector('#home-chat').hidden), `${tag} chat: turning it off hides the button again`)
    await oc.close(); await pc.close()
  }

  // Update card: an old game is told to update instead of joining
  const uc = await browser.newContext({ viewport: { width: 412, height: 915 } }), U = await uc.newPage()
  await U.goto(H + '/?v=0.0.1-old'); await U.waitForSelector('#hj-go')
  await U.fill('#hj-code', CODE); await U.fill('#hj-name', 'Old Game'); await U.check('#hj-adults'); await U.click('#hj-go')
  await U.waitForSelector('#hj-retry', { timeout: 5000 }).catch(() => {})
  const card = await U.evaluate(() => document.body.innerText)
  eq(/needs an update/.test(card) && card.includes('0.0.1-old') && !!(await U.$('#hj-retry')) && !(await U.evaluate(() => window.session)), 'Update card: an older game sees the Update card with both versions and does not join')
  await uc.close()

  // Half B: the full home game, when it has been built
  const BUILT = path.join(REPO, 'bertopia-home', 'index.html')
  if (!fs.existsSync(BUILT)) skip('full game: no home build at bertopia-home/ (run `npm ci && npm run build:home` in bloxbert-src, then rerun)')
  else {
    const g = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT + 1), '--data', DATA + '-g'], { cwd: path.join(HERE, '..'), stdio: ['ignore', 'pipe', 'pipe'] })
    let glog = ''; g.stdout.on('data', (d) => (glog += d)); g.stderr.on('data', (d) => (glog += d))
    for (let i = 0; i < 100 && !/owner page/.test(glog); i++) await sleep(50)
    const G = 'http://localhost:' + (PORT + 1), gkey = /k=([0-9a-f]+)/.exec(glog)[1]
    const gt = (await (await fetch(G + '/owner/pin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key: gkey, pin: '246810' }) })).json()).token
    const gapi = (p, b) => fetch(G + '/owner/' + p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': gt }, body: JSON.stringify(b || {}) }).then((r) => r.json())
    await gapi('world/open', { name: 'game-world-0001' }); const gcode = (await gapi('session/start', {})).code
    for (const [w, h] of [[1366, 768], [412, 915]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h } }), O2 = await ctx.newPage(), P2 = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage()
      const gerr = []; for (const pg of [O2, P2]) pg.on('pageerror', (e) => gerr.push(String(e)))
      await O2.goto(G + '/join.html'); const own = await gapi('play', { name: 'Diego' }); await O2.evaluate((t) => sessionStorage.setItem('bt-home-owner-ticket', JSON.stringify(t)), own)
      await O2.goto(G + '/?owner=1')
      await P2.goto(G + '/'); await P2.waitForSelector('#hj-go', { timeout: 20000 }); await P2.fill('#hj-code', gcode); await P2.fill('#hj-name', 'Game Player'); await P2.check('#hj-adults'); await P2.click('#hj-go')
      await sleep(8000)
      const ok = await Promise.all([O2, P2].map((pg) => pg.evaluate(() => !!document.querySelector('canvas') && !document.querySelector('#hj-go'))))
      eq(ok.every(Boolean), `@${w}: full game: owner and player both reach a running world`)
      eq(!gerr.length, `@${w}: full game: no page errors${gerr.length ? ': ' + gerr.slice(0, 2).join(' / ') : ''}`)
      await P2.screenshot({ path: path.join(os.tmpdir(), `home-game-${w}.png`) })
      await ctx.close()
    }
    await gapi('stop'); await sleep(300); if (g.exitCode === null) g.kill(); fs.rmSync(DATA + '-g', { recursive: true, force: true })
  }
} catch (e) {
  eq(false, 'play run threw: ' + (e && e.message ? e.message.split('\n')[0] : e))
} finally {
  await browser.close()
  try { await post('/owner/stop', {}, { 'x-owner': token }) } catch (e) {}
  await sleep(300); if (child && child.exitCode === null) child.kill()
  fs.rmSync(DATA, { recursive: true, force: true }); fs.rmSync(GAME, { recursive: true, force: true })
}
console.log(fails ? `home-play-check: ${fails} FAIL` : `home-play-check: all PASS${skips ? ` (${skips} skipped)` : ''}`)
process.exit(fails ? 1 : 0)
