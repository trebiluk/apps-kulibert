// Part 4 check (docs/bertopia/HOME-HOST.md §7, §10): two real browser clients at 1366 and 412.
//
// Half A — the home client code (bloxbert-src/src/home/home.js, bundled with __HOME_HOST__=true) in Chromium against a
//   live host that serves it as its game: join screen, owner skip, see each other, build, rules toast, world chat,
//   keep inventory,
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
<body><div id="stage"><canvas tabindex="0" width="8" height="8"></canvas></div><div id="toasts" role="status" aria-live="polite"></div><script src="harness.js"></script></body></html>`)

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

    // world chat: on from the start; the dock works by keyboard; the burst limit is explained
    await P.waitForSelector('#home-chat .hc-toggle', { state: 'visible', timeout: 4000 })
    const tg = await P.evaluate(() => { const b = document.querySelector('#home-chat .hc-toggle'), r = b.getBoundingClientRect(); return { h: r.height, w: r.width, label: b.getAttribute('aria-label'), exp: b.getAttribute('aria-expanded') } })
    eq(tg.h >= 44 && tg.w >= 44 && /Chat/.test(tg.label) && tg.exp === 'false', `${tag} chat: the button is there from the start (chat on by default; 44 px, labelled, collapsed)`)
    await P.focus('#home-chat .hc-toggle'); await P.keyboard.press('Enter'); await sleep(150)
    const opened = await P.evaluate(() => ({ exp: document.querySelector('#home-chat .hc-toggle').getAttribute('aria-expanded'), focus: document.activeElement && document.activeElement.matches('#home-chat input') }))
    eq(opened.exp === 'true' && opened.focus, `${tag} chat: Enter on the button opens the panel and puts the cursor in the box`)
    const ring = await P.evaluate(() => { const s = getComputedStyle(document.activeElement); return s.outlineStyle + ' ' + s.outlineWidth })
    eq(/solid 3px/.test(ring), `${tag} chat: the focused box has a 3 px focus ring (${ring})`)
    await P.keyboard.type('hello from the play check'); await P.keyboard.press('Enter'); await sleep(400)
    const focusAfter = await P.evaluate(() => (document.activeElement && document.activeElement.tagName) || 'none')
    eq(focusAfter !== 'INPUT', `${tag} chat: after Send the keys go back to the game (focus is on ${focusAfter}, not the chat box)`)
    await P.focus('#home-chat input')
    await O.evaluate(() => { const b = document.querySelector('#home-chat .hc-toggle'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click() })
    const line = await O.evaluate(() => [...document.querySelectorAll('#home-chat .hc-log li')].map((l) => l.textContent).at(-1) || '')
    eq(line === (round === 1 ? 'Ana Play' : 'Bo Play') + ': hello from the play check', `${tag} chat: the owner's panel shows "${line}"`)
    for (let i = 0; i < 5; i++) { await P.focus('#home-chat input'); await P.keyboard.type('quick ' + i); await P.keyboard.press('Enter') }
    await sleep(300)
    const slow = await P.evaluate(() => document.querySelector('#home-chat .hc-msg').textContent)
    eq(/Slow down: wait \d s\./.test(slow), `${tag} chat: past the burst of 5 the box says "${slow}"`)
    await sleep(1300); await P.focus('#home-chat input'); await P.keyboard.type('<img src=x onerror=alert(1)>'); await P.keyboard.press('Enter'); await sleep(400)
    const asText = await O.evaluate(() => ({ imgs: document.querySelectorAll('#home-chat img').length, last: [...document.querySelectorAll('#home-chat .hc-log li')].map((l) => l.textContent).at(-1) }))
    eq(asText.imgs === 0 && asText.last.endsWith('<img src=x onerror=alert(1)>'), `${tag} chat: markup in a message arrives as plain text`)
    const unread = await P.evaluate(async () => { document.querySelector('#home-chat .hc-toggle').click(); await new Promise((r) => setTimeout(r, 50)); return document.querySelector('#home-chat .hc-toggle').textContent })
    await O.evaluate(() => window.HOME.homeSend({ t: 'chat', m: 'owner says hi' })); await sleep(400)
    const badge = await P.evaluate(() => document.querySelector('#home-chat .hc-toggle').textContent)
    eq(/1 new/.test(badge) && !/new/.test(unread), `${tag} chat: a closed panel counts new messages in words ("${badge}"), not colour alone`)
    await P.keyboard.press('Escape')

    // commands (part 8): buttons in the panel per role; a pick row for a player; T opens the panel; a tp frame moves
    const pm = await P.evaluate(() => [...document.querySelectorAll('#home-chat .hc-cmds button')].map((b) => b.dataset.c))
    const om = await O.evaluate(() => [...document.querySelectorAll('#home-chat .hc-cmds button')].map((b) => b.dataset.c))
    eq(pm.join() === 'spawn,sethome,home,list,msg' && om.includes('bring') && om.includes('announce') && om.includes('give'), `${tag} commands: the player sees 5 buttons, the owner sees the staff set too`)
    await P.evaluate(() => { window.tpGot = []; window.HOME.onHomeTeleport((x, y, z) => window.tpGot.push([x, y, z])) })
    await P.evaluate(() => { document.querySelector('#home-chat .hc-toggle').click(); document.querySelector('#home-chat .hc-cmds button[data-c=spawn]').click() }); await sleep(400)
    eq((await P.evaluate(() => window.tpGot)).length === 1, `${tag} commands: the Spawn button teleports the player through the tp hook`)
    await O.evaluate(() => { document.querySelector('#home-chat .hc-cmds button[data-c=bring]').click() }); await sleep(150)
    const pick = await O.evaluate(() => [...document.querySelectorAll('#home-chat .hc-pick button')].map((b) => b.textContent))
    eq(pick.includes(round === 1 ? 'Ana Play' : 'Bo Play') && pick.includes('✕'), `${tag} commands: "Bring player" asks which player with buttons (${pick.filter((x) => x !== '✕').join(', ')}) and a Cancel`)
    await O.evaluate((n) => { [...document.querySelectorAll('#home-chat .hc-pick button')].find((b) => b.textContent === n).click() }, round === 1 ? 'Ana Play' : 'Bo Play'); await sleep(400)
    eq((await P.evaluate(() => window.tpGot)).length === 2 && (await P.evaluate(() => window.toasts.join('|'))).includes('Diego moved you'), `${tag} commands: the player is brought and told who did it`)
    await P.evaluate(() => { document.querySelector('#home-chat .hc-toggle').click() })   // close
    await P.keyboard.press('Escape'); await P.focus('body'); await P.evaluate(() => window.HOME.homeOpenChat())
    eq(await P.evaluate(() => !document.querySelector('#home-chat .hc-panel').hidden && document.activeElement === document.querySelector('#home-chat input')), `${tag} commands: homeOpenChat (the T key) opens the panel with the cursor in the box`)
    await P.keyboard.type('/help'); await P.keyboard.press('Enter'); await sleep(300)
    eq((await P.evaluate(() => [...document.querySelectorAll('#home-chat .hc-log li')].map((l) => l.textContent).at(-1))).startsWith('Commands: /spawn'), `${tag} commands: a typed /help answers in the panel`)

    // the code builder (part 9): owner only; start from an example, change it, save; the host runs it
    eq(await P.evaluate(() => !window.HOME.homeOpenBuilder() && !document.querySelector('#home-builder')), `${tag} builder: a player cannot open it`)
    await O.evaluate((t) => sessionStorage.setItem('bt-home-owner-api', JSON.stringify({ base: location.origin, token: t })), token)
    eq(await O.evaluate(() => window.HOME.homeOpenBuilder() && !!document.querySelector('#home-builder[role=dialog]')), `${tag} builder: the owner opens it as a dialog`)
    await sleep(400)
    const exBtn = await O.evaluate(() => [...document.querySelectorAll('#home-builder .list button')].find((b) => /^Welcome/.test(b.textContent)) ? 'yes' : 'no')
    eq(exBtn === 'yes', `${tag} builder: the examples are listed`)
    await O.evaluate(() => [...document.querySelectorAll('#home-builder .list button')].find((b) => /^Welcome/.test(b.textContent)).click()); await sleep(150)
    const small = await O.evaluate(() => [...document.querySelectorAll('#home-builder button, #home-builder select, #home-builder input')].filter((e) => e.offsetParent && e.getBoundingClientRect().height < 44).length)
    eq(small === 0 && (await O.evaluate(() => document.querySelector('#home-builder select').value)) === 'join', `${tag} builder: the editor shows the example's WHEN (join); every control is at least 44 px`)
    await O.evaluate(() => { const i = [...document.querySelectorAll('#home-builder input.t')].find((x) => x.placeholder.startsWith('text')); i.value = 'Hi {player}, built in the builder'; i.dispatchEvent(new Event('input')) })
    await O.evaluate(() => [...document.querySelectorAll('#home-builder button')].find((b) => b.textContent === 'Save & run').click()); await sleep(600)
    eq(await O.evaluate(() => !!document.querySelector('#home-builder') && [...document.querySelectorAll('#home-builder .list b')].some((b) => b.textContent === 'Welcome')), `${tag} builder: Save & run lists the plugin as on`)
    const nc = await browser.newContext({ viewport: { width: w, height: h } }), NP = await nc.newPage()
    await NP.goto(H + '/'); await NP.waitForSelector('#hj-go')
    await NP.fill('#hj-code', CODE); await NP.fill('#hj-name', 'Newcomer'); await NP.check('#hj-adults'); await NP.focus('#hj-code'); await NP.keyboard.press('Enter')
    await NP.waitForFunction(() => window.session, null, { timeout: 8000 }); await sleep(500)
    eq(await NP.evaluate(() => [...document.querySelectorAll('#home-chat .hc-log li')].some((l) => /Hi Newcomer, built in the builder/.test(l.textContent))), `${tag} builder: the saved plugin greets the next player who joins`)
    await nc.close(); await sleep(300)
    await O.evaluate(() => [...document.querySelectorAll('#home-builder button')].find((b) => b.textContent === '✕ Close').click())
    await api('plugin/drop', { id: (await api('plugins', {})).list.find((p) => p.name === 'Welcome').id })

    // keep inventory: the world value arrives with the rules; the owner sets this player apart
    const k0 = await P.evaluate(() => window.HOME.homeKeep())
    const pref = (await (await fetch(H + '/owner/state', { headers: { 'x-owner': token } })).json()).live.players.find((p) => p.role === 'player').ref
    await api('keep', { ref: pref, on: false }); await sleep(400)
    const k1 = await P.evaluate(() => window.HOME.homeKeep()), kO = await O.evaluate(() => window.HOME.homeKeep())
    eq(k0.on === true && k0.from === 'world' && k1.on === false && k1.from === 'player' && kO.on === true, `${tag} keep inventory: on from the world; the owner turns it off for this player only`)
    await api('keep', { ref: pref, on: null })

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
    eq(await P.evaluate(() => !document.querySelector('#home-chat').hidden && /Commands/.test(document.querySelector('#home-chat .hc-toggle').textContent) && /Commands only/.test(document.querySelector('#home-chat input').placeholder)), `${tag} chat: with chat off the panel stays as "Commands" (buttons and /commands still work)`)
    await api('rule', { id: 'chat.typed', v: true })
    await oc.close(); await pc.close()
  }

  // invite link (part 10): ?invite=KEY lands on the join card with the key in, the key out of the address bar; the name is all that is asked
  { const ic = await browser.newContext({ viewport: { width: 412, height: 915 }, extraHTTPHeaders: { 'x-forwarded-for': '203.0.113.77' } }), I = await ic.newPage()   // its own address: the 5-a-minute join limit is per address
    const inv = await api('invite', { label: 'Link Lee', max: 1 })
    await I.goto(inv.link.replace('http://localhost:' + PORT, H)); await I.waitForSelector('#hj-go'); await sleep(200)
    const got = await I.evaluate(() => ({ code: document.querySelector('#hj-code').value, url: location.search, focus: document.activeElement && document.activeElement.id, label: document.querySelector('label[for=hj-code]').textContent }))
    await I.fill('#hj-name', 'Link Lee'); await I.check('#hj-adults'); await I.click('#hj-go'); await I.waitForFunction(() => window.session, null, { timeout: 8000 }).catch(() => {})
    const inAfter = await I.evaluate(() => !!window.session), out = await I.evaluate(() => document.querySelector('#hj-out') ? document.querySelector('#hj-out').textContent : '(card gone)')
    eq(got.code === inv.key && got.url === '' && got.focus === 'hj-name' && /invite key/.test(got.label) && inAfter, `invite link: key filled ${got.code === inv.key}, url clean ${got.url === ''}, focus ${got.focus}, label ok ${/invite key/.test(got.label)}, joined ${inAfter}${inAfter ? '' : ' (' + out + ')'}`)
    await I.goto(H + '/?invite=' + encodeURIComponent(inv.key)); await I.waitForSelector('#hj-go'); await I.fill('#hj-name', 'Link Two'); await I.check('#hj-adults'); await I.click('#hj-go'); await sleep(600)
    eq(/used up/.test(await I.evaluate(() => document.querySelector('#hj-out').textContent)), 'invite link: a second use of a one-use key is told it is used up')
    await ic.close() }

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
      // essentials 2 (part 13): the owner's /give, /clear and /gm land in the player's game
      { await O2.keyboard.press('t'); await sleep(300)
        const type = async (line) => { await O2.fill('#home-chat input', line); await O2.keyboard.press('Enter'); await sleep(500) }
        await type('/give Game Player planks 7')
        const got = await P2.evaluate(() => { const s = document.querySelector('#hotbar .slot[data-item=planks] .count'); return s ? s.textContent : '' })
        eq(got === '7', `@${w}: /give: the player's hotbar shows 7 planks (${got || 'none'})`)
        await type('/clear Game Player')
        eq(await P2.evaluate(() => !document.querySelector('#hotbar .slot[data-item]')), `@${w}: /clear: the player's bag is empty`)
        await type('/gm creative Game Player')
        eq(await P2.evaluate(() => document.getElementById('mode-creative').getAttribute('aria-pressed') === 'true' || document.body.classList.contains('mode-creative')), `@${w}: /gm creative: the player's game switches to creative`)
        await type('/gm survival Game Player'); await type('/give nobody planks 1')
        eq(await O2.evaluate(() => [...document.querySelectorAll('#home-chat .hc-log li')].some((l) => /No player by that name/.test(l.textContent))), `@${w}: a bad target is refused with a plain line`)
        await O2.keyboard.press('Escape'); await sleep(200) }
      // avatars (Nov 1): the other player is a Berty figure in their suit, facing their heading, with a name tag
      { await O2.evaluate((t) => sessionStorage.setItem('bt-home-owner-api', JSON.stringify({ base: location.origin, token: t, name: 'Diego' })), gt)
        await O2.goto(G + '/?owner=1&debug=1'); await sleep(8000)
        await P2.keyboard.down('a'); await sleep(700); await P2.keyboard.up('a'); await sleep(600)   // the player strafes, so the owner sees it move
        const av = await O2.evaluate(() => window.__btAvatars ? window.__btAvatars.peek() : null)
        const one = av && av.find((a) => a.name === 'Game Player')
        eq(!!one && one.parts === 8 && one.suit === 'berty' && Number.isFinite(one.r) && one.tag > 0, `@${w}: avatars: the owner sees "Game Player" as an 8-part Berty figure (suit ${one && one.suit}, tag ${one && one.tag})`)
        await P2.evaluate(() => localStorage.setItem('bloxbert-look', JSON.stringify({ cv: 3, suit: 'grove' }))); await P2.reload(); await P2.waitForSelector('#hj-go', { timeout: 20000 }).catch(() => {})
        if (await P2.$('#hj-go')) { await P2.fill('#hj-code', gcode); await P2.fill('#hj-name', 'Game Player'); await P2.check('#hj-adults'); await P2.click('#hj-go') }
        await sleep(7000); await P2.keyboard.down('d'); await sleep(500); await P2.keyboard.up('d'); await sleep(500)
        const av2 = await O2.evaluate(() => window.__btAvatars ? window.__btAvatars.peek() : null)
        const two = av2 && av2.find((a) => a.name === 'Game Player')
        eq(!!two && two.suit === 'grove', `@${w}: avatars: the player's Clothes choice (Grove) travels in the position flags (${two && two.suit})`)
        await O2.keyboard.down('s'); await sleep(900); await O2.keyboard.up('s'); await sleep(400)
        await O2.screenshot({ path: path.join(os.tmpdir(), `home-avatar-${w}.png`) }) }
      // menus at home (Nov 1 pass): Settings has the touch row and no language row, every ON/OFF pill is named, the
      // chat dock steps aside under the sheet, Mode/World are the host's, Accessibility tiles show their state
      await O2.evaluate((t) => sessionStorage.setItem('bt-home-owner-api', JSON.stringify({ base: location.origin, token: t, name: 'Diego' })), gt)
      await O2.goto(G + '/?owner=1&debug=1'); await sleep(8000)
      await O2.evaluate(() => window.__bt.openPanel('settings')); await sleep(400)
      const st = await O2.evaluate(() => { const b = document.getElementById('sheet-body'); const pills = [...b.querySelectorAll('button.pill')].filter((x) => /^(ON|OFF)$/.test(x.textContent)); return { touch: b.querySelectorAll('[role=radiogroup][aria-label="Touch controls"] [role=radio]').length, lang: !!b.querySelector('#lang-list'), unnamed: pills.filter((x) => !x.getAttribute('aria-label')).length, unstated: pills.filter((x) => !x.getAttribute('aria-pressed')).length, host: !!b.querySelector('[data-home-host]'), keepPill: [...b.querySelectorAll('.set-lab')].some((l) => /Keep my stuff/.test(l.textContent)), dock: document.getElementById('home-chat') ? getComputedStyle(document.getElementById('home-chat')).visibility : 'none' } })
      eq(st.touch === 3 && !st.lang && st.unnamed === 0 && st.unstated === 0 && st.host && !st.keepPill && (st.dock === 'hidden' || st.dock === 'none'), `@${w}: menus: Settings has Touch controls (3), no language row, ${st.unnamed} unnamed / ${st.unstated} unstated pills, the host line, no device keep pill; the chat dock hides under the sheet (${st.dock})`)
      await O2.evaluate(() => window.__bt.openPanel('mode')); await sleep(300)
      const md = await O2.evaluate(() => [...document.querySelectorAll('#sheet-body button')].map((b) => b.textContent.trim()))
      await O2.evaluate(() => window.__bt.openPanel('world')); await sleep(300)
      const wd = await O2.evaluate(() => [...document.querySelectorAll('#sheet-body button')].map((b) => b.textContent.trim()))
      eq(md.length === 1 && /Build Table/.test(md[0]) && wd.length === 1 && /Export/.test(wd[0]) && (await O2.evaluate(() => document.getElementById('hub-back').hidden)), `@${w}: menus: Mode offers only the Build Table, World only Export, and the hub link is gone (${md.join('/')} · ${wd.join('/')})`)
      await O2.evaluate(() => window.__bt.openPanel('a11y')); await sleep(300)
      const a1 = await O2.evaluate(() => { const t = [...document.querySelectorAll('#sheet-body button.gtile')]; t[0].click(); return { n: t.length, pressed: t.map((b) => b.getAttribute('aria-pressed')), after: t[0].getAttribute('aria-pressed'), mark: !!t[0].querySelector('[data-mark]') } })
      eq(a1.n === 3 && a1.pressed.every((p) => p === 'false' || p === 'true') && a1.after === 'true' && a1.mark, `@${w}: menus: Accessibility tiles carry aria-pressed and a check mark when on`)
      await O2.evaluate(() => { const t = [...document.querySelectorAll('#sheet-body button.gtile')]; t[0].click() })
      // hotbar (Nov 1 pass): numbered names; on a phone two rows of five (slots 1-5 / 6-9 + bag) and the stick above the bar
      await O2.evaluate(() => { const x = document.getElementById('sheet-x'); if (x && !document.getElementById('sheet').hidden) x.click() }); await sleep(300)
      // chat dock on a phone (style pass): sits above the hotbar, commands folded behind one button; the builder is opaque with a sticky top bar
      if (w === 412) {
        await O2.keyboard.press('t'); await sleep(400)
        const dk = await O2.evaluate(() => { const d = document.getElementById('home-chat'), r = d.getBoundingClientRect(), hb = document.getElementById('hotbar').getBoundingClientRect(), f = d.querySelector('.hc-fold'); return { above: r.bottom <= hb.top + 1, folded: d.querySelector('.hc-cmds').dataset.folded === '1' && getComputedStyle(d.querySelector('.hc-cmds')).display === 'none', foldText: f.textContent, foldH: Math.round(f.getBoundingClientRect().height) } })
        await O2.evaluate(() => document.querySelector('#home-chat .hc-fold').click()); await sleep(100)
        const open = await O2.evaluate(() => getComputedStyle(document.querySelector('#home-chat .hc-cmds')).display !== 'none')
        eq(dk.above && dk.folded && /Commands \(\d+\)/.test(dk.foldText) && dk.foldH >= 44 && open, `@${w}: chat dock: above the hotbar, "${dk.foldText}" folded by default (${dk.foldH} px) and unfolds on tap`)
        await O2.evaluate(() => [...document.querySelectorAll('#home-chat button')].find((b) => /Code builder/.test(b.textContent)).click()); await sleep(500)
        const bd = await O2.evaluate(() => { const b = document.getElementById('home-builder'); const cs = getComputedStyle(b), top = b.querySelector('.top'); return { opaque: cs.backgroundColor === 'rgb(11, 18, 32)', z: Number(cs.zIndex), sticky: getComputedStyle(top).position === 'sticky', dock: getComputedStyle(document.getElementById('home-chat')).visibility } })
        eq(bd.opaque && bd.z >= 1000 && bd.sticky && bd.dock === 'hidden', `@${w}: builder: opaque over the game, sticky title bar, the chat dock hidden under it`)
        await O2.evaluate(() => [...document.querySelectorAll('#home-builder button')].find((b) => b.textContent === '✕ Close').click()); await sleep(200)
        await O2.keyboard.press('Escape'); await sleep(200)
      }
      const hb = await O2.evaluate(() => { const bar = document.getElementById('hotbar'), rb = bar.getBoundingClientRect(); const slots = [...bar.querySelectorAll('.slot')].map((e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), label: e.getAttribute('aria-label') } }); const rows = new Set(slots.map((s) => Math.round(s.y / 30))).size; return { n: slots.length, rows, h: Math.round(rb.height), small: slots.filter((s) => s.w < 44 || s.h < 44).length, numbered: slots.slice(0, 9).every((s, i) => s.label.endsWith('· ' + (i + 1))), lift: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hud-lift')), centered: Math.abs((rb.left + rb.right) / 2 - innerWidth / 2) < 4 } })
      eq(hb.n === 10 && hb.small === 0 && hb.numbered && (w === 412 ? hb.rows === 2 && hb.h < 170 && hb.lift >= hb.h + 12 && hb.centered : hb.rows === 1), `@${w}: hotbar: ${hb.n} tiles in ${hb.rows} row(s), ${hb.h} px tall, none under 44 px, numbered names${w === 412 ? ', centered, HUD lifted to ' + hb.lift + ' px' : ''}`)
      if (w === 412) {   // touch controls: On -> reload -> the owner is back in, with the touch UI; then back to Auto
        await O2.evaluate(() => window.__bt.openPanel('settings')); await sleep(300)
        await O2.evaluate(() => document.querySelector('[role=radiogroup][aria-label="Touch controls"] [data-touch=on]').click())
        await O2.waitForFunction(() => !window.session, null, { timeout: 5000 }).catch(() => {}); await sleep(9000)
        await O2.waitForFunction(() => window.session, null, { timeout: 15000 }).catch(() => {})
        const tc = await O2.evaluate(() => ({ session: !!window.session, touch: document.body.classList.contains('touch'), pref: localStorage.getItem('bloxbert-touch'), join: !!document.querySelector('#hj-go'), canvas: !!document.querySelector('canvas'), play: !!(document.getElementById('play-chip') && !document.getElementById('play-chip').hidden) }))
        eq(!tc.join && tc.canvas && tc.touch && tc.pref === 'on', `@${w}: touch controls: On reloads the game, the owner is back in (no join card; Tap to play) with the touch UI (${JSON.stringify(tc)})`)
        await O2.evaluate(() => localStorage.removeItem('bloxbert-touch'))
      }
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
