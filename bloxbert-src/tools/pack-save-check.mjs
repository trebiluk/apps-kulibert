// Pack blocks survive Save, reload, and a world-file round trip.
import puppeteer from 'puppeteer-core'
import { existsSync, writeFileSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
import { BLOCKS } from '../src/data/blocks-list.js'
import { FROZEN } from '../src/data/ids.js'
import { migrateVoxels, resetUnknown, isMissingId } from '../src/save/migrate.js'

const byName = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
const PACK_KEYS = [
  'floorLampOff', 'floorLampOn', 'wallLampOff', 'wallLampOn', 'rugAnchor', 'rugPart',
  'farmland', 'farmlandWet', 'cropSprout', 'cropLeafy', 'cropTall', 'cropRipe',
  'sapling', 'bushYoung', 'bushLeaf', 'bushFull', 'bushFruit', 'wheat', 'reed', 'tuft',
]
for (const key of PACK_KEYS) {
  if (byName[key] !== FROZEN[key]) throw new Error('name table drifted ' + key + ' ' + byName[key] + ' frozen ' + FROZEN[key])
}
resetUnknown()
const named = migrateVoxels(['air', 'floorLampOff', 'lantern'], Uint16Array.from([1, 2]), byName)
if (named.data[0] !== 1100 || named.data[1] !== FROZEN.lantern) throw new Error('pack name did not round-trip ' + named.data.join(','))
resetUnknown()
const absent = migrateVoxels(['air', 'floorLampOff', 'lantern'], Uint16Array.from([1, 2]), { lantern: FROZEN.lantern })
if (!isMissingId(absent.data[0]) || absent.data[0] === 1100 || absent.data[0] === FROZEN.lantern) throw new Error('missing pack became ' + absent.data[0])
if (absent.data[1] !== FROZEN.lantern) throw new Error('lantern moved while a pack was absent')
resetUnknown()
const hole = migrateVoxels(['air', null], Uint16Array.from([1]), byName)
if (hole.data[0] !== 0) throw new Error('dropped pack cell became ' + hole.data[0])
console.log('pack name table ok')

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8895
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

const URL0 = 'http://127.0.0.1:' + port + '/blocks-test/?q=lite&smoke=1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg); console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg) }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

async function prep(page) {
  page.setDefaultTimeout(90000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
    try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
    try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
  })
  return errs
}

async function boot(page) {
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
  await page.goto(URL0, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.evaluate(() => {
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    const b = document.querySelector('#rules-card .rc-got')
    if (b) b.click()
    const card = document.getElementById('rules-card')
    if (card) card.hidden = true
  })
  await sleep(300)
}

async function clickTile(page, label) {
  const hit = await page.evaluate((label) => {
    const tiles = [...document.querySelectorAll('#sheet .gtile')]
    const t = tiles.find((el) => ((el.querySelector('.glbl') || {}).textContent || '') === label)
    if (!t) return false
    t.click()
    return true
  }, label)
  return hit
}

function stageOf(row) {
  const cap = 8 * 60 * 1000
  const g = Math.max(0, +row.grown || 0)
  if (row && row.kind === 'bush' && row.regrow) return g >= cap ? 3 : 2
  if (g * 100 < cap * 33) return 0
  if (g * 100 < cap * 66) return 1
  if (g < cap) return 2
  return 3
}

async function selectItem(page, item) {
  return page.evaluate((item) => {
    const slots = window.__blocks.bag()
    const i = slots.findIndex((s) => s && s.item === item)
    if (i < 0) return false
    if (i > 8) return window.__smoke.hold(item)
    if (window.__smoke.hot() !== i) {
      const b = document.querySelector('#hotbar [data-slot="' + i + '"]')
      if (b) b.click()
      else window.__smoke.key(i)
    }
    return window.__blocks.bag()[window.__smoke.hot()] && window.__blocks.bag()[window.__smoke.hot()].item === item
  }, item)
}

async function aimClick(page, x, y, z, face, button) {
  return page.evaluate(async (x, y, z, face, button) => {
    const s = window.__smoke
    const canvas = document.querySelector('#stage canvas')
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const normals = { top: [0, 1, 0], north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] }
    const n = normals[face] || [0, 1, 0]
    function pose(dist) {
      const tx = x + 0.5
      const tz = z + 0.5
      let eyeX, eyeY, eyeZ, lookY
      if (face === 'top') {
        lookY = y + 1.01
        eyeX = tx
        eyeZ = tz + dist
        eyeY = lookY + 1.35
      } else {
        const n = normals[face]
        lookY = y + 0.5
        eyeX = tx + n[0] * (0.42 + dist)
        eyeY = lookY + 0.15
        eyeZ = tz + n[2] * (0.42 + dist)
      }
      const dx = tx - eyeX, dy = lookY - eyeY, dz = tz - eyeZ
      s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(dx, dz), Math.atan2(-dy, Math.hypot(dx, dz) || 0.001))
    }
    if (s.arm) s.arm()
    let aimed = null
    for (const dist of [2.2, 2.8, 3.6, 4.6]) {
      for (let i = 0; i < 10; i++) {
        pose(dist)
        await frame(); await frame()
        const aim = s.aim()
        if (aim && aim.x === x && aim.y === y && aim.z === z) { aimed = aim; break }
      }
      if (aimed) break
    }
    if (!aimed) return { ok: false, aim: s.aim(), world: s.world(x, y, z), toast: s.toast() }
    const r = canvas.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const btn = button === 'left' ? 0 : 2
    const common = { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'mouse', clientX: cx, clientY: cy, isPrimary: true, button: btn, buttons: btn === 2 ? 2 : 1 }
    canvas.dispatchEvent(new PointerEvent('pointerdown', common))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    await frame()
    return { ok: true, aim: aimed, toast: s.toast() }
  }, x, y, z, face, button)
}

async function readWorld(page) {
  return page.evaluate(() => {
    const s = window.__smoke
    const cells = [
      ['soil', 66, 5, 64],
      ['crop', 66, 6, 64],
      ['sapling', 68, 6, 64],
      ['floor', 70, 6, 64],
      ['wall', 63, 6, 64],
      ['rug0', 66, 6, 68],
      ['rug1', 67, 6, 68],
      ['rug2', 66, 6, 69],
      ['rug3', 67, 6, 69],
    ]
    const voxels = {}
    const meta = {}
    for (const [name, x, y, z] of cells) {
      voxels[name] = s.voxel(x, y, z)
      meta[name] = s.bed(x + ',' + y + ',' + z)
    }
    const crops = (window.__smoke.crops && window.__smoke.crops()) || []
    const crop = crops.find((r) => r && r.x === 66 && r.y === 6 && r.z === 64) || null
    return { voxels, meta, crop }
  })
}

const page = await browser.newPage()
const errs = await prep(page)
await boot(page)

const made = await page.evaluate(() => {
  const B = window.__blocks
  const s = window.__smoke
  B.mode('survival')
  s.emptyBag()
  B.give('woodshop', 1)
  B.give('safetyGlasses', 1)
  B.give('measuringTape', 1)
  B.give('handSaw', 1)
  B.give('hammer', 1)
  B.give('woolBlue', 4)
  s.plant(60, 5, 60, 69)
  s.freeze(true)
  return { wool: s.count('woolBlue'), shop: s.voxel(60, 5, 60) }
})
const shopAim = await aimClick(page, 60, 5, 60, 'south', 'left')
await sleep(500)
await page.evaluate(() => {
  const safe = document.getElementById('shop-safe')
  const btn = safe && safe.querySelector('button')
  if (btn) btn.click()
})
await sleep(200)
const hung = await page.evaluate(() => {
  for (const s of document.querySelectorAll('.wall-slot')) s.click()
  return { filled: document.querySelectorAll('.wall-slot.filled').length, cards: document.querySelectorAll('.decor-card').length }
})
await sleep(200)
await page.evaluate(() => {
  const b = document.querySelector('.decor-design-rug') || document.querySelector('.decor-just-rug')
  if (b) b.click()
})
await sleep(200)
const rugN = await page.evaluate(() => window.__smoke.count('rug'))
await page.evaluate(() => window.__blocks.give('rug', 1))
const rugN2 = await page.evaluate(() => window.__smoke.count('rug'))
eq(made.shop === 69 && shopAim.ok && hung.filled >= 4 && rugN === 1 && rugN2 === 2, 'rug crafted with a colour ' + JSON.stringify({ made, shopAim, hung, rugN, rugN2 }))

await page.evaluate(() => {
  const B = window.__blocks
  const s = window.__smoke
  B.give('hoe', 1)
  B.give('wheatSeeds', 4)
  B.give('sapling', 1)
  B.give('floorLamp', 1)
  B.give('wallLamp', 1)
  B.give('stone', 1)
  const xbtn = document.getElementById('sheet-x')
  if (xbtn) xbtn.click()
  s.close()
  for (let x = 62; x <= 72; x++) {
    for (let z = 60; z <= 72; z++) {
      s.plant(x, 4, z, 2)
      s.plant(x, 5, z, 1)
      s.plant(x, 6, z, 0)
      s.plant(x, 7, z, 0)
    }
  }
  s.plant(62, 6, 64, 3)
})
await page.evaluate(() => window.__smoke.stand(66, 8, 66, 0, 0.4))
await page.waitForFunction(() => window.__smoke.world(66, 5, 64) === 1 && window.__smoke.world(62, 6, 64) === 3, { timeout: 20000 })

async function put(item, x, y, z, face) {
  const held = await selectItem(page, item)
  let last = null
  for (let n = 0; n < 3 && !(last && last.ok); n++) last = await aimClick(page, x, y, z, face, 'right')
  await sleep(120)
  return { held, last }
}

const till = await put('hoe', 66, 5, 64, 'top')
const soil = await page.evaluate(() => window.__smoke.voxel(66, 5, 64))
const seeded = await put('wheatSeeds', 66, 5, 64, 'top')
const cropId = await page.evaluate(() => window.__smoke.voxel(66, 6, 64))
const sprout = await put('sapling', 68, 5, 64, 'top')
const sapId = await page.evaluate(() => window.__smoke.voxel(68, 6, 64))
const lamp = await put('floorLamp', 70, 5, 64, 'top')
const lampId = await page.evaluate(() => window.__smoke.voxel(70, 6, 64))
const wall = await put('wallLamp', 62, 6, 64, 'east')
const wallId = await page.evaluate(() => window.__smoke.voxel(63, 6, 64))
const rug = await put('rug', 66, 5, 68, 'top')
const rugId = await page.evaluate(() => window.__smoke.voxel(66, 6, 68))
eq(till.held && (soil === 49 || soil === 63), 'hoe farmland ' + soil + ' ' + JSON.stringify(till))
eq(seeded.held && cropId === 59, 'seeds planted ' + cropId + ' ' + JSON.stringify(seeded))
eq(sprout.held && sapId === 185, 'sapling planted ' + sapId + ' ' + JSON.stringify(sprout))
eq(lamp.held && lampId === 1100, 'floor lamp placed ' + lampId + ' ' + JSON.stringify(lamp))
eq(wall.held && wallId === 1102, 'wall lamp placed ' + wallId + ' ' + JSON.stringify(wall))
eq(rug.held && rugId === 1104, 'rug placed ' + rugId + ' ' + JSON.stringify(rug))

const toggled = await aimClick(page, 70, 6, 64, 'south', 'left')
await sleep(150)
let floorNow = await page.evaluate(() => window.__smoke.voxel(70, 6, 64))
if (floorNow !== 1101) {
  await aimClick(page, 70, 6, 64, 'south', 'right')
  await sleep(150)
  floorNow = await page.evaluate(() => window.__smoke.voxel(70, 6, 64))
}
eq(floorNow === 1101, 'floor lamp switched on ' + floorNow + ' ' + JSON.stringify(toggled))

await page.evaluate(() => {
  const s = window.__smoke
  s.freeze(false)
  s.seekCrops(4 * 60 * 1000)
  s.freeze(true)
})
const before = await readWorld(page)
const cropStage = before.crop ? stageOf(before.crop) : -1
eq(!!before.crop && cropStage >= 1 && before.voxels.crop === 59 + cropStage, 'crop stage advanced ' + JSON.stringify(before.crop) + ' id ' + before.voxels.crop)
eq(before.meta.floor && before.meta.floor.kind === 'floorLamp' && before.meta.floor.design && before.meta.floor.design.shade === 'Natural', 'floor lamp design ' + JSON.stringify(before.meta.floor))
eq(before.meta.wall && before.meta.wall.kind === 'wallLamp' && before.meta.wall.side, 'wall lamp side ' + JSON.stringify(before.meta.wall))
eq(before.meta.rug0 && before.meta.rug0.kind === 'rug' && before.meta.rug0.design && before.meta.rug0.design.colour === 'woolBlue', 'rug colour ' + JSON.stringify(before.meta.rug0))
eq(before.voxels.wall === 1102, 'wall lamp still off')
eq(before.voxels.rug1 === 1105 && before.voxels.rug2 === 1105 && before.voxels.rug3 === 1105, 'rug span ' + JSON.stringify(before.voxels))

const saved = await page.evaluate(async () => {
  const btn = document.getElementById('save-btn')
  if (!btn) return { missing: true }
  btn.click()
  const t0 = performance.now()
  while (performance.now() - t0 < 15000) {
    const el = document.getElementById('toast')
    const text = el && !el.hidden ? (el.textContent || '') : ''
    if (/Saved|Збережено|Сохранено|Guardado/.test(text)) return { text }
    await new Promise((r) => setTimeout(r, 80))
  }
  const el = document.getElementById('toast')
  return { text: el ? el.textContent : '', hidden: !el || el.hidden }
})
eq(/Saved|Збережено|Сохранено|Guardado/.test((saved && saved.text) || ''), 'real save ' + JSON.stringify(saved))

await page.reload({ waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
await page.evaluate(() => { const b = document.querySelector('#rules-card .rc-got'); if (b) b.click(); window.__smoke.freeze(true) })
await sleep(400)
const after = await readWorld(page)
function sameWorld(a, b) {
  const bad = []
  for (const k of Object.keys(a.voxels)) if (a.voxels[k] !== b.voxels[k]) bad.push(k + ' ' + a.voxels[k] + '→' + b.voxels[k])
  const af = a.meta.floor || {}
  const bf = b.meta.floor || {}
  if (!bf.design || bf.design.shade !== (af.design && af.design.shade) || bf.kind !== 'floorLamp') bad.push('floor meta')
  const aw = a.meta.wall || {}
  const bw = b.meta.wall || {}
  if (bw.kind !== 'wallLamp' || bw.side !== aw.side) bad.push('wall meta')
  for (const k of ['rug0', 'rug1', 'rug2', 'rug3']) {
    const ar = a.meta[k] || {}
    const br = b.meta[k] || {}
    if (br.kind !== 'rug' || br.anchor !== ar.anchor || !br.design || br.design.colour !== 'woolBlue') bad.push(k + ' meta')
  }
  if (!b.crop || stageOf(b.crop) !== stageOf(a.crop)) bad.push('crop stage ' + (b.crop && stageOf(b.crop)))
  return bad
}
const reloadDiff = sameWorld(before, after)
eq(!reloadDiff.length, 'reload keeps pack cells ' + reloadDiff.join('; '))

await page.evaluate(() => {
  const orig = URL.createObjectURL
  URL.createObjectURL = function (blob) {
    window.__exportBlob = blob
    return orig.call(URL, blob)
  }
  const card = document.getElementById('rules-card')
  if (card) card.hidden = true
  document.getElementById('game-menu').click()
})
await page.waitForFunction(() => {
  const sheet = document.getElementById('sheet')
  return sheet && !sheet.hidden && sheet.dataset.panel === 'menu'
})
eq(await clickTile(page, 'World'), 'menu world tile')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile(page, 'Export world file'), 'export world file')
await sleep(300)
const exported = await page.evaluate(async () => {
  const b = window.__exportBlob
  return b ? await b.text() : ''
})
eq(exported.includes('floorLampOff') || exported.includes('floorLampOn'), 'export palette names pack blocks')
const file = '/tmp/lane-d3/pack-world.json'
writeFileSync(file, exported)

const page2 = await browser.newPage()
const errs2 = await prep(page2)
await boot(page2)
await page2.evaluate(() => {
  const card = document.getElementById('rules-card')
  if (card) card.hidden = true
  document.getElementById('game-menu').click()
})
await page2.waitForFunction(() => {
  const sheet = document.getElementById('sheet')
  return sheet && !sheet.hidden && sheet.dataset.panel === 'menu'
})
eq(await clickTile(page2, 'World'), 'fresh profile world tile')
await page2.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
const chooserP = page2.waitForFileChooser({ timeout: 15000 })
eq(await clickTile(page2, 'Import world file'), 'import world file')
const chooser = await chooserP
await chooser.accept([file])
await page2.waitForFunction(() => window.__smoke && window.__smoke.voxel(70, 6, 64) === 1101, { timeout: 20000 }).catch(() => {})
await sleep(400)
const imported = await readWorld(page2)
const importDiff = sameWorld(before, imported)
eq(!importDiff.length, 'import keeps pack cells ' + importDiff.join('; '))

await page2.reload({ waitUntil: 'domcontentloaded' })
await page2.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
await page2.evaluate(() => { window.__smoke.freeze(true) })
await sleep(300)
const importedReload = await readWorld(page2)
const importReloadDiff = sameWorld(before, importedReload)
eq(!importReloadDiff.length, 'imported world reloads ' + importReloadDiff.join('; '))

eq(!errs.length, 'console errors ' + errs.slice(0, 4).join(' | '))
eq(!errs2.length, 'fresh profile console ' + errs2.slice(0, 4).join(' | '))

await browser.close()
server.close()
if (fail.length) {
  console.error(fail.join('\n'))
  process.exit(1)
}
console.log('pack-save-check ok')
