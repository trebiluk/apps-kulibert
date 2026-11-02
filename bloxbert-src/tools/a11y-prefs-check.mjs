// BN-21 check: the Hub's less motion / high contrast / sound off reach Bertopia, motion is read live, and Bertopia's
// own Gentle Mode and High Contrast switches really change the page and show their state.
// Serves the whole repo (the Hub script lives in /shared) on 8887 and opens /blocks-test/.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b) } catch (e) { res.writeHead(404); res.end() }
})
await new Promise((r) => server.listen(8887, '127.0.0.1', r))
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const errors = []
function note(name, ok, detail) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail != null ? ' ' + String(detail).slice(0, 240) : '')) }
const PREFS = (o) => JSON.stringify(Object.assign({ v: 1, size: 'M', contrast: false, motion: 'full', sound: true, captions: true, read: false, lang: 'en' }, o))

async function boot(w, h, touch, prefs, extra) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error' && !/404|Failed to load|net::/.test(m.text())) errors.push(m.text()) })
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument((p, x) => {
    try { if (p && !sessionStorage.getItem('__seeded')) { localStorage.setItem('kulibert-prefs-v1', p); sessionStorage.setItem('__seeded', '1') }; if (x) for (const [k, v] of Object.entries(x)) localStorage.setItem(k, v) } catch (e) {}
    // count every chop shake and every void tint the page shows
    window.__shakes = 0; window.__poofs = 0
    new MutationObserver((ms) => {
      for (const m of ms) {
        const el = m.target
        if (m.attributeName === 'class' && el.classList && el.classList.contains('chop-shake')) window.__shakes++
        if (m.attributeName === 'hidden' && el.id === 'poof' && !el.hidden) window.__poofs++
      }
    }).observe(document, { attributes: true, subtree: true, attributeFilter: ['class', 'hidden'] })
  }, prefs || null, extra || null)
  await page.goto('http://127.0.0.1:8887/blocks-test/?q=lite&smoke=1' + (touch ? '&touch=1' : ''), { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 60000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} ; window.__blocks.mode('survival') })
  await sleep(500)
  return page
}
// a little tree beside the player, then n real chop hits
async function chop(page, n) {
  return page.evaluate(async (n) => {
    const s = window.__smoke
    // always the same open spot near spawn (a void fall moves the player), with a fresh little tree beside it
    if (!window.__p0) window.__p0 = s.pos()
    const p = window.__p0
    window.__tries = (window.__tries || 0) + 1
    const x = Math.floor(p[0]) + 1, z = Math.floor(p[2]) + window.__tries * 3, y = Math.floor(p[1])
    for (let k = 0; k < 6; k++) for (const [dx, dz] of [[-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [-1, -1], [0, -1]]) s.plant(x + dx - 1, y + k, z + dz, 0)
    s.stand(x - 1 + 0.5, y, z + 0.5, Math.PI / 2, 0.1)
    await new Promise((r) => setTimeout(r, 200))
    for (let k = 0; k < 4; k++) s.plant(x, y + k, z, 11)
    for (const [dx, dz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) s.plant(x + dx, y + 4, z + dz, 12)
    const before = window.__shakes
    let hits = 0
    for (let i = 0; i < n; i++) { const r = s.chopHit(); if (r) hits++; await new Promise((res) => setTimeout(res, 420)) }
    return { hits, shakes: window.__shakes - before }
  }, n)
}
async function voidFall(page) {
  return page.evaluate(async () => {
    const before = window.__poofs
    const s = window.__smoke
    const p = s.pos()
    s.stand(p[0], -300, p[2], 0, 0)
    await new Promise((r) => setTimeout(r, 1500))
    return window.__poofs - before
  })
}

for (const [w, h, touch] of [[1366, 768, false], [412, 915, true]]) {
  // 1. Hub "less motion": no shake, no tint; back to full -> shake is back without a reload
  let page = await boot(w, h, touch, PREFS({ motion: 'less' }))
  const attr = await page.evaluate(() => document.documentElement.getAttribute('data-kp-motion'))
  const c1 = await chop(page, 5)
  const tint = await voidFall(page)
  note('Hub less motion: view never moves ' + w, attr === 'less' && c1.hits >= 3 && c1.shakes === 0, JSON.stringify({ attr, ...c1 }))
  note('Hub less motion: no void tint ' + w, tint === 0, tint)
  await page.evaluate(() => document.documentElement.setAttribute('data-kp-motion', 'full')) // what the Hub script does on a change
  const c2 = await chop(page, 3)
  note('Hub back to full: shake returns, no reload ' + w, c2.hits >= 2 && c2.shakes >= 1, JSON.stringify(c2))
  // 2. OS reduced motion mid-game
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  const c3 = await chop(page, 3)
  note('OS reduced motion mid-game: shake stops ' + w, c3.hits >= 2 && c3.shakes === 0, JSON.stringify(c3))
  await page.browserContext().close()

  // 3. Gentle Mode + High Contrast in Bertopia's own panel
  page = await boot(w, h, touch, PREFS({}))
  const hubBefore = await page.evaluate(() => localStorage.getItem('kulibert-prefs-v1'))
  await page.evaluate(() => window.__blocks.panel('a11y'))
  await sleep(400)
  const tiles = await page.evaluate(() => [...document.querySelectorAll('#sheet .gtile')].map((b) => ({ text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed'), h: Math.round(b.getBoundingClientRect().height) })))
  note('tiles show Off at first ' + w, tiles.filter((t) => /Off$/.test(t.text)).length >= 2 && tiles.every((t) => t.h >= 44), JSON.stringify(tiles.slice(0, 3)))
  // click Gentle (2nd tile) and High Contrast (1st tile) the way a kid does
  const boxes = await page.evaluate(() => [...document.querySelectorAll('#sheet .gtile')].slice(0, 2).map((b) => { const r = b.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } }))
  for (const b of boxes) { if (touch) await page.touchscreen.tap(b.x, b.y); else await page.mouse.click(b.x, b.y); await sleep(300) }
  const after = await page.evaluate(() => ({
    gentle: document.documentElement.getAttribute('data-bt-gentle'),
    a11y: document.documentElement.dataset.a11y,
    tiles: [...document.querySelectorAll('#sheet .gtile')].slice(0, 2).map((b) => ({ text: b.textContent.trim(), pressed: b.getAttribute('aria-pressed'), check: !!b.querySelector('.a11y-state svg, .a11y-state canvas, .a11y-state img') })),
  }))
  // High Contrast in Bertopia must look the same as the Hub's high contrast: compare computed styles both ways
  const look = () => page.evaluate(() => {
    const pick = (el) => { if (!el) return null; const c = getComputedStyle(el); return [c.backgroundColor, c.color, c.outlineStyle, c.outlineColor, c.borderColor].join('|') }
    return [pick(document.body), pick(document.getElementById('hotbar')), pick(document.querySelector('#hotbar .slot')), pick(document.querySelector('#sheet .gtile')), pick(document.querySelector('header button, .top button'))]
  })
  const ours = await look()
  await page.evaluate(() => { document.documentElement.dataset.a11y = ''; document.documentElement.setAttribute('data-kp-contrast', '1') })
  const hubs = await look()
  await page.evaluate(() => { document.documentElement.dataset.a11y = 'contrast'; document.documentElement.setAttribute('data-kp-contrast', '0') })
  const plain = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  after.same = JSON.stringify(ours) === JSON.stringify(hubs)
  after.bodyBg = ours[0] && ours[0].split('|')[0]
  note('Gentle + High Contrast tiles show On with a check ' + w, after.gentle === '1' && after.a11y === 'contrast' && after.tiles.every((t) => t.pressed === 'true' && /On$/.test(t.text)), JSON.stringify(after.tiles))
  note('High Contrast looks the same as the Hub high contrast ' + w, after.same && after.bodyBg === 'rgb(0, 0, 0)', JSON.stringify({ same: after.same, diff: ours.map((o, i) => o === hubs[i] ? null : { i, ours: o, hub: hubs[i] }).filter(Boolean) }))
  await page.evaluate(() => window.__blocks.panel(''))
  const c4 = await chop(page, 4)
  note('Gentle Mode: chopping does not shake ' + w, c4.hits >= 3 && c4.shakes === 0, JSON.stringify(c4))
  const hubAfter = await page.evaluate(() => localStorage.getItem('kulibert-prefs-v1'))
  note('Gentle Mode leaves the Hub setting alone ' + w, hubAfter === hubBefore)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 60000 })
  await sleep(500)
  const kept = await page.evaluate(() => [document.documentElement.getAttribute('data-bt-gentle'), document.documentElement.dataset.a11y])
  note('Gentle + Contrast kept after reload ' + w, kept[0] === '1' && kept[1] === 'contrast', JSON.stringify(kept))
  await page.browserContext().close()

  // 4. Hub sound off: every new AudioContext is muted
  page = await boot(w, h, touch, PREFS({ sound: false }))
  const muted = await page.evaluate(async () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const dest = ctx.destination
    const isGain = typeof GainNode !== 'undefined' && dest instanceof GainNode
    try { await ctx.resume() } catch (e) {}
    await new Promise((r) => setTimeout(r, 200))
    const v = isGain ? dest.gain.value : null
    try { ctx.close() } catch (e) {}
    return { isGain, v, sound: document.documentElement.getAttribute('data-kp-sound') }
  })
  note('Hub sound off: game audio goes through a muted gain ' + w, muted.isGain && muted.sound === '0', JSON.stringify(muted))
  await page.browserContext().close()

  // 5. The language picked in Bertopia still wins over the Hub's
  page = await boot(w, h, touch, PREFS({ lang: 'en' }))
  await page.evaluate(() => window.__blocks && window.__blocks.panel && window.__blocks.panel('settings'))
  await sleep(400)
  const picked = await page.evaluate(() => { const o = [...document.querySelectorAll('[data-lang]')].find((x) => x.dataset.lang === 'es' && x.tagName !== 'HTML'); if (o) o.click(); return !!o })
  await sleep(300)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 60000 })
  await sleep(2500)
  const lang = await page.evaluate(() => document.documentElement.lang + '|' + JSON.parse(localStorage.getItem('kulibert-prefs-v1') || '{}').lang).then((x) => x.split('|'))
  note('the language picked in Bertopia sticks with the Hub script on ' + w, picked && lang[0] === 'es' && lang[1] === 'es', JSON.stringify({ picked, lang }))
  await page.browserContext().close()
}
note('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
