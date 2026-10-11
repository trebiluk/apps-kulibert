// World Maker M1 and the held sapling sprite.
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8898
const shotDir = '/tmp/maker-check'
mkdirSync(shotDir, { recursive: true })
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = process.env.CHROME_PATH || [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try {
    let b = await readFile(f)
    const ext = path.extname(f)
    const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg|txt)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(port, '127.0.0.1', r))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg); console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg) }

function coverOf(aPath, bPath) {
  const py = `
import sys
from PIL import Image
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB')
w, h = a.size
if b.size != a.size:
    b = b.resize(a.size)
pa, pb = a.load(), b.load()
diff = 0
for y in range(h):
    for x in range(w):
        p, q = pa[x, y], pb[x, y]
        if abs(p[0]-q[0]) + abs(p[1]-q[1]) + abs(p[2]-q[2]) > 36:
            diff += 1
print(diff / float(w * h))
`
  const out = spawnSync('python3', ['-c', py, aPath, bPath], { encoding: 'utf8' })
  if (out.status) throw new Error(out.stderr || 'cover')
  return Number(out.stdout.trim())
}

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.setDefaultTimeout(90000)
const errs = []
page.on('console', (m) => {
  const text = m.text()
  if (m.type() === 'error' && !/404|favicon|Failed to load/.test(text)) errs.push(text)
  if (/missing string|KulibertI18n missing/.test(text)) errs.push(text)
})
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
page.on('dialog', async (d) => { try { await d.accept() } catch (e) {} })
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
  try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
  try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
  try { localStorage.setItem('tech-room-hub-staff', '1') } catch (e) {}
  try { localStorage.setItem('bloxbert-teacher', '1') } catch (e) {}
})

async function boot(w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/?q=lite&smoke=1', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.evaluate(() => {
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    const b = document.querySelector('#rules-card .rc-got')
    if (b) b.click()
    const card = document.getElementById('rules-card')
    if (card) card.hidden = true
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    document.body.classList.remove('menu-open')
    window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
    window.__smoke.arm()
  })
}

async function shot(name) {
  await sleep(500)
  const file = path.join(shotDir, name + '.png')
  const buf = await page.screenshot({ type: 'png' })
  writeFileSync(file, buf)
  return file
}

async function holdSapling(on) {
  await page.evaluate((on) => {
    window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
    window.__smoke.emptyBag()
    window.__smoke.arm()
    document.body.classList.remove('menu-open')
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    if (on) {
      window.__smoke.fillBag('sapling', 1)
      window.__smoke.key(0)
    }
  }, on)
  if (!on) {
    await page.waitForFunction(() => {
      const h = window.__blocks.hand()
      return h && h.visible && !h.key
    })
    return
  }
  await page.waitForFunction(() => {
    const h = window.__blocks.hand()
    return h && h.visible && h.key === 'block:sapling'
  })
}

async function saplingCover(tag, w, h) {
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await sleep(300)
  await holdSapling(false)
  const off = await shot(tag + '-off')
  await holdSapling(true)
  const on = await shot(tag + '-on')
  const meshes = await page.evaluate(() => {
    const sc = window.__blocks.noa.rendering.getScene()
    return sc.meshes.filter((m) => m.isEnabled()).map((m) => ({ name: m.name, idx: m.getTotalIndices() }))
  })
  const plant = meshes.find((m) => m.name === 'hand-plant-sapling')
  eq(!!plant && plant.idx === 6, tag + ' flat quad ' + JSON.stringify(plant))
  eq(!meshes.some((m) => m.name.indexOf('hand-b-') === 0), tag + ' no cube ' + meshes.map((m) => m.name).join(','))
  const cover = coverOf(on, off)
  eq(cover < 0.08, tag + ' sapling under 8% ' + (cover * 100).toFixed(2) + '%')
  eq(cover > 0.001, tag + ' sapling is visible ' + (cover * 100).toFixed(2) + '%')
}

await boot(1366, 768)
await saplingCover('desk', 1366, 768)
await saplingCover('phone', 915, 412)

async function openMenu() {
  await page.evaluate(() => document.getElementById('game-menu').click())
  await page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'menu'
  })
}
async function clickTile(label) {
  return page.evaluate((label) => {
    const t = [...document.querySelectorAll('#sheet .gtile, #sheet button')].find((el) => {
      const g = el.querySelector('.glbl')
      return ((g && g.textContent) || el.textContent || '').trim() === label
    })
    if (!t) return false
    t.click()
    return true
  }, label)
}
async function openMaker() {
  await openMenu()
  eq(await clickTile('World'), 'world')
  await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
  await page.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => n.textContent === 'New world'), { timeout: 20000 })
  eq(await clickTile('New world'), 'new world')
  await page.waitForFunction(() => document.querySelector('#sheet [data-seed-words]'))
}
function seedNow() {
  return page.evaluate(() => {
    const el = document.querySelector('#sheet [data-seed-words]')
    return { words: el.dataset.seedWords, num: el.dataset.seedNum, hills: (document.querySelector('[data-slider-value="hills"]') || {}).textContent || '' }
  })
}

await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
await openMaker()
await page.evaluate(() => document.querySelector('[data-slider="hills"][data-step="1"]').click())
await page.waitForFunction(() => document.querySelector('[data-preset="flat"]'))
eq(await clickTile('Flat'), 'flat preset')
const flatSeed = await seedNow()
eq(flatSeed.words.split(' ').length === 3 && flatSeed.hills === '4', 'flat seed and hill step ' + JSON.stringify(flatSeed))
const gen0 = await page.evaluate(() => window.__makerGen || 0)
eq(await clickTile('Make this world'), 'make flat')
await page.waitForFunction((g) => (window.__makerGen || 0) > g, { timeout: 40000 }, gen0)
const flat = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  return { y4: g(8, 4, 1), y3: g(8, 3, 1), y5: g(8, 5, 1), far: g(40, 4, 40), farUp: g(40, 8, 40), low: g(8, -1, 1) }
})
eq(flat.y4 === 1 && flat.y3 === 2 && flat.y5 === 0 && flat.far === 1 && flat.farUp === 0, 'flat world ' + JSON.stringify(flat))

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
await page.evaluate(() => {
  const b = document.querySelector('#rules-card .rc-got')
  if (b) b.click()
  const card = document.getElementById('rules-card')
  if (card) card.hidden = true
})
const flatAgain = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  return { y4: g(8, 4, 1), y3: g(8, 3, 1), far: g(40, 4, 40) }
})
eq(flatAgain.y4 === 1 && flatAgain.y3 === 2 && flatAgain.far === 1, 'flat reload ' + JSON.stringify(flatAgain))
await openMaker()
const flatBack = await seedNow()
eq(flatBack.words === flatSeed.words && flatBack.num === flatSeed.num && flatBack.hills === '4', 'flat seed stuck ' + JSON.stringify(flatBack) + ' want ' + JSON.stringify(flatSeed))

eq(await clickTile('New seed'), 'shuffle')
await sleep(100)
eq(await clickTile('Void'), 'void preset')
const voidSeed = await seedNow()
eq(voidSeed.words.split(' ').length === 3 && voidSeed.words !== flatSeed.words, 'void seed changed ' + voidSeed.words)
const gen1 = await page.evaluate(() => window.__makerGen || 0)
eq(await clickTile('Make this world'), 'make void')
await page.waitForFunction((g) => (window.__makerGen || 0) > g, { timeout: 40000 }, gen1)
const voidWorld = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  const pad = []
  for (let x = 6; x <= 10; x++) for (let z = -1; z <= 3; z++) pad.push(g(x, 7, z))
  return { pad, out: g(5, 7, 1), up: g(8, 8, 1), down: g(8, 6, 1), far: g(30, 7, 30) }
})
eq(voidWorld.pad.every((id) => id === 3) && voidWorld.pad.length === 25 && voidWorld.out === 0 && voidWorld.up === 0 && voidWorld.down === 0 && voidWorld.far === 0, 'void platform ' + JSON.stringify(voidWorld))

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
await page.evaluate(() => {
  const b = document.querySelector('#rules-card .rc-got')
  if (b) b.click()
  const card = document.getElementById('rules-card')
  if (card) card.hidden = true
})
const voidAgain = await page.evaluate(() => ({ mid: window.__blocks.getVoxel(8, 7, 1), out: window.__blocks.getVoxel(5, 7, 1), far: window.__blocks.getVoxel(30, 4, 30) }))
eq(voidAgain.mid === 3 && voidAgain.out === 0 && voidAgain.far === 0, 'void reload ' + JSON.stringify(voidAgain))
await openMaker()
const voidBack = await seedNow()
eq(voidBack.words === voidSeed.words && voidBack.num === voidSeed.num, 'void seed stuck ' + JSON.stringify(voidBack) + ' want ' + JSON.stringify(voidSeed))
eq(!errs.length, 'console ' + errs.join(' | '))

if (fail.length) {
  console.error('maker-check FAIL ' + fail.length)
  process.exitCode = 1
} else console.log('maker-check ok')
await browser.close()
server.close()
process.exit(process.exitCode || 0)
