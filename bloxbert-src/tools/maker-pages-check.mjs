// Maker Pages L01 check: real triggers (first tool made via the path goal, first Rustbot and Keeper reboot),
// the toast text, the Notebook section, save across reload, no repeats, and every language.
// Usage: node tools/maker-pages-check.mjs   (serves ../blocks-test on 8879; shots in /tmp/mp-*.png)
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b) } catch (e) { res.writeHead(404); res.end() }
})
await new Promise((r) => server.listen(8879, '127.0.0.1', r))
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found.'); process.exit(1) }
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
function note(name, ok, detail) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + String(detail).slice(0, 240) : '')) }
const errors = []

async function boot(w, h, touch, lang) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, deviceScaleFactor: 1 })
  // proof hooks (__BT_PROOF.spawnMob / rebootMob) need ?proof=1 and the staff test switch, as on a teacher device
  await page.evaluateOnNewDocument(() => { window.kwTest = { on: () => true } })
  if (lang) await page.evaluateOnNewDocument((l) => { try { localStorage.setItem('bloxbert-lang', l) } catch (e) {} }, lang)
  await page.goto('http://127.0.0.1:8879/?q=lite&smoke=1&proof=1' + (touch ? '&touch=1' : ''), { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 60000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} ; window.__blocks.mode('survival') })
  return page
}
const toastText = (page) => page.evaluate(() => (document.getElementById('toast') || {}).textContent || '')
async function reboot(page, kind) {
  return page.evaluate((kind) => { const P = window.__BT_PROOF; if (!P) return false; const m = P.spawnMob(kind); return m && m.id ? (P.rebootMob(m.id), true) : false }, kind)
}
async function notebook(page) {
  await page.evaluate(() => window.__blocks.panel('notebook'))
  await sleep(400)
  return page.evaluate(() => ({
    head: (document.querySelector('#sheet .mp-head') || {}).textContent || '',
    pages: [...document.querySelectorAll('#sheet .mp-page')].map((p) => +p.dataset.page),
    none: !!document.querySelector('#sheet .mp-none'),
    stray: [...document.querySelectorAll('#sheet [data-note]')].filter((p) => /^mp\d/.test(p.dataset.note)).length,
  }))
}

for (const [w, h, touch] of [[1366, 768, false], [412, 915, true]]) {
  const page = await boot(w, h, touch)
  const empty = await notebook(page)
  note('empty notebook ' + w, empty.head.includes('0/20') && empty.none && empty.pages.length === 0, JSON.stringify(empty))
  await page.evaluate(() => window.__smoke.close())
  // Page 1: first tool made. Make a Wood Tool the way the Path counts it (give planks+sticks, craft via hook).
  const made = await page.evaluate(() => {
    const s = window.__smoke, B = window.__blocks
    const p = s.pos()
    s.plant(Math.floor(p[0]) + 1, Math.floor(p[1]), Math.floor(p[2]), 22) // a Workbench beside the kid
    B.give('planks', 6)
    return s.craft('woodTool')
  })
  await sleep(2900) // the page line waits 2.5 s behind the moment's own toast
  const t1 = await toastText(page)
  note('page 1 on first tool ' + w, made && made.ok !== false && /📜/.test(t1), JSON.stringify(made) + ' ' + t1)
  const rb = await reboot(page, 'rustbot')
  await sleep(2900)
  const t10 = await toastText(page)
  note('page 10 on first Rustbot reboot ' + w, rb && /📜/.test(t10) && /10/.test(t10), t10)
  await reboot(page, 'rustbot')
  await sleep(300)
  const again = await toastText(page)
  const kp = await reboot(page, 'keeper')
  await sleep(2900)
  const t4 = await toastText(page)
  note('page 4 on first Keeper reboot ' + w, kp && /📜/.test(t4), t4)
  const nb = await notebook(page)
  note('notebook lists pages ' + w, nb.head.includes('3/20') && nb.pages.join(',') === '1,4,10' && nb.stray === 0 && !nb.none, JSON.stringify(nb))
  await page.evaluate(() => { const h = document.querySelector('#sheet .mp-head'); if (h) h.scrollIntoView({ block: 'start' }) })
  await sleep(200)
  await page.screenshot({ path: '/tmp/mp-' + w + '.png' })
  const tw = await page.evaluate(() => [...document.querySelectorAll('#sheet .mp-page')].map((p) => p.getBoundingClientRect()).filter((r) => r.right > innerWidth + 1 || r.left < -1).length)
  note('pages fit the width ' + w, tw === 0, tw)
  // second reboot gave no new page; reload keeps the three
  await page.evaluate(() => { const b = document.getElementById('save-btn'); if (b) b.click() })
  await sleep(800)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 60000 })
  await sleep(600)
  const kept = await notebook(page)
  note('pages kept after reload ' + w, kept.pages.join(',') === '1,4,10', JSON.stringify(kept) + ' again=' + JSON.stringify(again))
  await page.browserContext().close()
}

// every language renders the section with real words (no raw keys)
for (const lang of ['en', 'simple', 'es', 'uk', 'ru', 'ar', 'fa-AF', 'rw', 'ti']) {
  const page = await boot(412, 915, true, lang)
  await reboot(page, 'rustbot')
  await sleep(300)
  const nb = await notebook(page)
  const text = await page.evaluate(() => [...document.querySelectorAll('#sheet .mp-head, #sheet .mp-page')].map((p) => p.textContent).join(' | '))
  note('lang ' + lang, nb.pages.join(',') === '10' && !/\b(mp10|mpLabel|makerPages|\{n\}|\{total\})\b/.test(text), text)
  await page.browserContext().close()
}
note('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
