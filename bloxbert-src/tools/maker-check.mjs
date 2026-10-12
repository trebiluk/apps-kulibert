// World Maker M2: Islands, Sky, Parkour Start, share codes, and the world switch.
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
  const arm = () => {
    const el = document.getElementById('toast')
    if (!el || el.dataset.logged) return
    el.dataset.logged = '1'
    window.__toastLog = window.__toastLog || []
    new MutationObserver(() => {
      const text = (el.textContent || '').trim()
      if (text) window.__toastLog.push(text)
    }).observe(el, { childList: true, subtree: true, characterData: true })
  }
  document.addEventListener('DOMContentLoaded', arm)
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

async function makePreset(label) {
  await openMaker()
  eq(await clickTile(label), 'pick ' + label)
  const seed = await seedNow()
  const code = await page.evaluate(() => (document.querySelector('[data-share-code]') || {}).placeholder || '')
  const gen = await page.evaluate(() => window.__makerGen || 0)
  eq(await clickTile('Make this world'), 'make ' + label)
  await page.waitForFunction((g) => (window.__makerGen || 0) > g, { timeout: 40000 }, gen)
  await sleep(400)
  return { seed, code }
}
function chunkHash() {
  return page.evaluate(async () => {
    const doc = await window.__blocks.exportDoc()
    const keys = Object.keys(doc.chunks).sort()
    let h = 0
    for (const k of keys) {
      const s = doc.chunks[k]
      for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) >>> 0
    }
    return { h, n: keys.length, preset: doc.maker && doc.maker.preset, name: (document.querySelector('.tb-name') || {}).textContent || '' }
  })
}
async function reloadReady() {
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.evaluate(() => {
    const b = document.querySelector('#rules-card .rc-got')
    if (b) b.click()
    const card = document.getElementById('rules-card')
    if (card) card.hidden = true
  })
}
async function fallOff() {
  const before = await page.evaluate(() => window.__toastLog ? window.__toastLog.length : 0)
  await page.evaluate(() => window.__blocks.tp(8.5, -20, 1.5))
  await page.waitForFunction((n) => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    const log = window.__toastLog || []
    return p[1] > 0 && log.slice(n).some((t) => t.indexOf('Try again') >= 0)
  }, { timeout: 8000 }, before).catch(() => {})
  return page.evaluate((n) => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    const said = (window.__toastLog || []).slice(n).join(' | ')
    return { y: p[1], said }
  }, before)
}

const islands = await makePreset('Islands')
const islandMap = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  let sand = 0
  let grass = 0
  let water = 0
  let tree = 0
  for (let x = -30; x <= 36; x++) for (let z = -30; z <= 36; z++) {
    if (g(x, 3, z) === 64) water++
    if (g(x, 5, z) === 1) grass++
    if (g(x, 4, z) === 6) sand++
    if (g(x, 8, z) === 11) tree++
  }
  return { sand, grass, water, tree, title: (document.querySelector('.tb-name') || {}).textContent || '', tip: (document.getElementById('menu-hint') || {}).textContent || '' }
})
eq(islandMap.grass >= 6 && islandMap.sand >= 6 && islandMap.water > 100 && islandMap.tree > 0, 'islands ' + JSON.stringify(islandMap))
eq(islandMap.title.split(' ').length === 2 && islandMap.title !== 'Bertopia', 'island name ' + islandMap.title)
eq(/Flat world|build anything|sand/.test(islandMap.tip) || /swim/.test(islandMap.tip), 'island tip ' + islandMap.tip)
const islandHash = await chunkHash()
await reloadReady()
const islandAgain = await chunkHash()
eq(islandAgain.h === islandHash.h && islandAgain.preset === 'islands', 'islands reload ' + islandAgain.h + ' ' + islandHash.h)

await openMaker()
const liveCode = await page.evaluate(() => (document.querySelector('[data-live-share]') || {}).textContent || '')
eq(liveCode === islands.code && /^ISL-\d-\d-\d [A-Z][a-z]+-[A-Z][a-z]+-[A-Z][a-z]+$/.test(liveCode), 'island code ' + liveCode + ' want ' + islands.code)
await page.evaluate((code) => {
  const box = document.querySelector('[data-share-code]')
  box.value = code
  box.dispatchEvent(new Event('input', { bubbles: true }))
}, liveCode)
eq(await page.evaluate(() => { document.querySelector('[data-share-use]').click(); return true }), 'use code')
await sleep(200)
const coded = await seedNow()
eq(coded.words === islands.seed.words && coded.num === islands.seed.num, 'code restored seed ' + JSON.stringify(coded))
const genCode = await page.evaluate(() => window.__makerGen || 0)
eq(await clickTile('Make this world'), 'make from code')
await page.waitForFunction((g) => (window.__makerGen || 0) > g, { timeout: 40000 }, genCode)
await sleep(300)
const codedHash = await chunkHash()
eq(codedHash.h === islandHash.h, 'code round trip ' + codedHash.h + ' ' + islandHash.h)

const sky = await makePreset('Sky')
const skyMap = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  let pads = 0
  for (let x = 6; x <= 10; x++) for (let z = -1; z <= 3; z++) if (g(x, 7, z) === 1) pads++
  return { pads, air: g(0, 7, 0), under: g(8, 4, 1) }
})
eq(skyMap.pads === 25 && skyMap.air === 0 && skyMap.under === 0, 'sky start ' + JSON.stringify(skyMap))
const skyFall = await fallOff()
eq(skyFall.y > 0 && /Try again/.test(skyFall.said), 'sky respawn ' + JSON.stringify(skyFall))
const skyHash = await chunkHash()
await reloadReady()
const skyAgain = await chunkHash()
eq(skyAgain.h === skyHash.h && skyAgain.preset === 'sky', 'sky reload')

const park = await makePreset('Parkour Start')
const parkMap = await page.evaluate(() => {
  const g = window.__blocks.getVoxel
  let stone = 0
  let green = 0
  for (let x = 0; x <= 80; x++) for (let y = 4; y <= 30; y++) for (let z = -2; z <= 4; z++) {
    const id = g(x, y, z)
    if (id === 3) stone++
    if (id === 14) green++
  }
  return { stone, green, air: g(8, 9, 1) }
})
eq(parkMap.stone > 20 && parkMap.green >= 5 && parkMap.air === 0, 'parkour pads ' + JSON.stringify(parkMap))
const parkFall = await fallOff()
eq(parkFall.y > 0 && /Try again/.test(parkFall.said), 'parkour respawn ' + JSON.stringify(parkFall))
const parkHash = await chunkHash()
await reloadReady()
const parkAgain = await chunkHash()
eq(parkAgain.h === parkHash.h && parkAgain.preset === 'parkour', 'parkour reload')

await openMaker()
eq(await clickTile('Void'), 'void again')
const genVoid = await page.evaluate(() => window.__makerGen || 0)
eq(await clickTile('Make this world'), 'void for fall')
await page.waitForFunction((g) => (window.__makerGen || 0) > g, { timeout: 40000 }, genVoid)
const voidTip = await page.evaluate(() => (document.getElementById('menu-hint') || {}).textContent || '')
eq(/one platform/.test(voidTip), 'void tip ' + voidTip)
const voidFall = await fallOff()
eq(voidFall.y > 0 && /Try again/.test(voidFall.said), 'void respawn ' + JSON.stringify(voidFall))

await openMenu()
eq(await clickTile('World'), 'teacher world')
await page.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => /World Maker on/.test(n.textContent)), { timeout: 20000 })
eq(await clickTile('World Maker on'), 'turn maker off')
await page.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => n.textContent === 'World Maker off'), { timeout: 10000 })
await page.evaluate(() => window.__blocks.save())
await sleep(300)

await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
  try { localStorage.removeItem('bloxbert-teacher') } catch (e) {}
  try { localStorage.removeItem('tech-room-hub-staff') } catch (e) {}
  try { localStorage.setItem('bloxbert-maker', '1') } catch (e) {}
})
await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__blocks && window.__bloxReady, { timeout: 90000 })
await page.evaluate(() => {
  const b = document.querySelector('#rules-card .rc-got')
  if (b) b.click()
})
await page.evaluate(() => document.getElementById('game-menu').click())
await page.waitForFunction(() => document.getElementById('sheet') && !document.getElementById('sheet').hidden)
eq(await clickTile('World'), 'kid world')
await sleep(500)
const kidSees = await page.evaluate(() => [...document.querySelectorAll('#sheet .glbl')].map((n) => n.textContent))
eq(!kidSees.some((t) => t === 'New world'), 'kid device hides New world ' + kidSees.join(','))

eq(!errs.length, 'console ' + errs.join(' | '))

if (fail.length) {
  console.error('maker-check FAIL ' + fail.length)
  process.exitCode = 1
} else console.log('maker-check ok')
await browser.close()
server.close()
process.exit(process.exitCode || 0)
