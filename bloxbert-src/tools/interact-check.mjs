// Break and place with real mouse and touch events. Not __blocks.breakBlock.
import { existsSync, mkdirSync, copyFileSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import { execFileSync } from 'child_process'
import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'
import { genBlock } from '../src/worldgen.js'
import { tuftSeedCount } from '../src/data/items.js'
import { mineMs } from '../src/feel.js'
import { FLORA_IDS } from '../src/packs/flora/pack.js'

const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}

const GEN8 = ['birchLog', 'birchLeaves', 'birchPlanks', 'pineLog', 'pineNeedles', 'pinePlanks', 'daisy', 'poppy', 'cornflower', 'sunflower', 'tulip', 'lupine', 'tallGrass', 'fern']
for (const name of GEN8) {
  const ms = mineMs(name, true, false, 'hand')
  note(Number.isFinite(ms) && ms >= 150 && ms < 20000, 'mine ' + name, String(ms))
}
const HAND = { log: 2000, dirt: 600, grass: 600, sand: 500, stone: 3000 }
for (const [name, ms] of Object.entries(HAND)) {
  note(mineMs(name, true, false, 'hand') === ms, 'hand ' + name, String(mineMs(name, true, false, 'hand')))
}

const outside = (x, z) => !(x >= -24 && x <= 40 && z >= -22 && z <= 34)
function findName(name, x0, x1, z0, z1, pred) {
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!outside(x, z)) continue
      for (let y = 2; y <= 18; y++) {
        if (genBlock(x, y, z, 8) !== name) continue
        if (pred && !pred(x, y, z)) continue
        return { x, y, z, id: name === 'tuft' ? 58 : name === 'log' ? 11 : name === 'grass' ? 1 : name === 'daisy' ? FLORA_IDS.daisy : 0 }
      }
    }
  }
  return null
}
const daisy = findName('daisy', -180, 180, -180, 180)
const daisy2 = findName('daisy', (daisy ? daisy.x + 1 : 0), 180, -180, 180)
const tuft = findName('tuft', -100, 100, -100, 100, (x, y, z) => tuftSeedCount(x, y, z) === 1)
const log = findName('log', 30, 140, -80, 80)
let grass = null
let grassBreak = null
if (daisy) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0]]) {
    const x = daisy.x + dx
    const z = daisy.z + dz
    for (let y = 1; y <= 18; y++) {
      if (genBlock(x, y, z, 8) === 'grass' && !genBlock(x, y + 1, z, 8)) {
        const cell = { x, y, z, id: 1 }
        if (!grass) grass = cell
        else if (!grassBreak && (x !== grass.x || z !== grass.z)) grassBreak = cell
      }
    }
  }
}
note(!!daisy, 'found daisy', JSON.stringify(daisy))
note(!!daisy2 && daisy2.x !== daisy.x, 'found daisy2', JSON.stringify(daisy2))
note(!!tuft, 'found tuft', JSON.stringify(tuft))
note(!!log, 'found log', JSON.stringify(log))
note(!!grass, 'found grass', JSON.stringify(grass))
if (!grassBreak) grassBreak = findName('grass', 50, 90, 40, 80, (x, y, z) => !genBlock(x, y + 1, z, 8))
note(!!grassBreak, 'found grass break', JSON.stringify(grassBreak))

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const repo = path.resolve(__dir, '../..')
const out = '/tmp/interact-check'
const art = '/workspace/artifacts'
mkdirSync(out, { recursive: true })
mkdirSync(art, { recursive: true })
const chrome = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome'); process.exit(1) }
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const underShared = p.startsWith('/shared/')
  const rel = underShared ? p.slice('/shared/'.length) : p.slice(1)
  const base = underShared ? sharedRoot : root
  const f = path.join(base, rel)
  if (!f.startsWith(base)) { res.writeHead(403); return res.end() }
  try {
    let b
    if (existsSync(f)) b = await readFile(f)
    else if (underShared) b = execFileSync('git', ['-C', repo, 'show', 'HEAD:shared/' + rel])
    else throw new Error('missing')
    const ext = path.extname(rel)
    const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
const PORT = 8892
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const noise = /favicon|Failed to load resource|WebGL|GPU|THREE|babylon|\.png|wasm|Expected a color|source map/i

async function boot(w, h, touch) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.setViewport({ width: w, height: h, isMobile: !!touch, hasTouch: !!touch, deviceScaleFactor: 1 })
  const q = touch ? '&touch=1' : ''
  await page.goto('http://127.0.0.1:' + PORT + '/?q=lite&smoke=1' + q, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 45000 })
  await page.waitForFunction(() => window.__blocks.noa.world.playerChunkLoaded, { timeout: 30000 }).catch(() => {})
  await page.evaluate(() => {
    const x = document.getElementById('sheet-x')
    const sheet = document.getElementById('sheet')
    if (sheet && !sheet.hidden && x) x.click()
    if (sheet) sheet.hidden = true
    const rc = document.getElementById('rules-card')
    if (rc) rc.hidden = true
    const got = document.querySelector('#rules-card button')
    if (got) got.click()
    document.body.classList.remove('menu-open')
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    window.__smoke.arm()
    window.__blocks.mode('survival')
  })
  await sleep(400)
  return { ctx, page, errors }
}
async function shot(page, name) {
  const file = path.join(out, name + '.png')
  await page.screenshot({ path: file })
  copyFileSync(file, path.join(art, 'interact-' + name + '.png'))
  return file
}
async function center(page) {
  return page.evaluate(() => {
    const c = document.querySelector('#stage canvas') || document.querySelector('canvas')
    const r = c.getBoundingClientRect()
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }
  })
}
async function aim(page, tx, ty, tz, id) {
  const offsets = [[0, 1], [1, 0], [0, -1], [-1, 0], [0, 2], [2, 0], [0, -2], [-2, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]
  let last = null
  for (const [dx, dz] of offsets) {
    const stood = await page.evaluate((tx, ty, tz, dx, dz) => {
      const B = window.__blocks
      const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
      if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
      const x = tx + dx
      const z = tz + dz
      let feet = null
      for (let y = ty + 4; y >= 1; y--) {
        if (B.getVoxel(x, y, z) && !B.getVoxel(x, y + 1, z) && !B.getVoxel(x, y + 2, z)) { feet = y + 1; break }
      }
      if (feet == null) return false
      B.tp(x + 0.5, feet + 0.05, z + 0.5)
      const eyeY = feet + 1.62
      const vx = tx + 0.5 - (x + 0.5)
      const vy = (ty + 0.45) - eyeY
      const vz = tz + 0.5 - (z + 0.5)
      B.setLook(Math.atan2(vx, vz), Math.atan2(-vy, Math.hypot(vx, vz)))
      return true
    }, tx, ty, tz, dx, dz)
    if (!stood) continue
    if (dx === 0 && dz === 1) {
      await page.waitForFunction((x, y, z, id) => {
        try { return window.__blocks.getVoxel(x, y, z) === id && window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
      }, { timeout: 15000 }, tx, ty, tz, id).catch(() => {})
    }
    await sleep(220)
    let stable = false
    for (let i = 0; i < 6; i++) {
      last = await page.evaluate(() => {
        const t = window.__blocks.noa.targetedBlock
        return t ? { id: t.blockID, x: t.position[0], y: t.position[1], z: t.position[2] } : null
      })
      const hit = !!(last && last.id === id && last.x === tx && last.y === ty && last.z === tz)
      if (hit && stable) return last
      stable = hit
      if (!hit) await page.evaluate((dp) => window.__blocks.turn(0, dp), i % 2 ? 0.03 : -0.02)
      await sleep(90)
    }
  }
  const pos = await page.evaluate(() => window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity))
  return { aim: last, at: pos }
}
async function holdMouse(page, ms, button) {
  const c = await center(page)
  await page.mouse.move(c.x, c.y)
  await page.mouse.down({ button: button || 'left' })
  await sleep(ms)
  await page.mouse.up({ button: button || 'left' })
}
function countOf(page, item) {
  return page.evaluate((item) => window.__smoke.count(item), item)
}

async function pc() {
  const { ctx, page, errors } = await boot(1024, 576, false)
  const sap = await page.evaluate(() => {
    const bag = window.__blocks.bag()
    let n = 0
    let slot = -1
    bag.forEach((s, i) => { if (s && s.item === 'sapling') { n += s.n; if (slot < 0) slot = i } })
    if (n < 2) { window.__blocks.give('sapling', 2 - n); n = 2; slot = bag.findIndex((s) => s && s.item === 'sapling') }
    const empty = bag.findIndex((s, i) => i < 9 && !s)
    window.__smoke.key(slot)
    return { n, slot, empty, held: window.__smoke.hot() }
  })
  note(sap.n >= 2 && sap.slot >= 0, 'sapling x2', JSON.stringify(sap))

  const flowerAim = await aim(page, daisy.x, daisy.y, daisy.z, FLORA_IDS.daisy)
  const box = await page.evaluate(() => {
    const scene = window.__blocks.noa.rendering.scene
    const mesh = scene.getMeshByName('bb-outline')
    const t = window.__blocks.noa.targetedBlock
    const face = scene.getMeshByName('highlight')
    return {
      id: t && t.blockID,
      on: !!(mesh && mesh.isEnabled()),
      sx: mesh ? mesh.scaling.x : 0,
      sy: mesh ? mesh.scaling.y : 0,
      sz: mesh ? mesh.scaling.z : 0,
      face: !!(face && face.isEnabled()),
    }
  })
  note(box.id === FLORA_IDS.daisy && box.on && box.sy > 0.55 && box.sy < 0.8 && box.sx < box.sy && box.sx > 0.4 && !box.face, 'flower low box', JSON.stringify({ flowerAim, box }))
  await shot(page, 'before')
  await shot(page, 'highlight')

  if (sap.empty >= 0) await page.evaluate((i) => window.__smoke.key(i), sap.empty)
  await page.evaluate(() => window.__quietUnlock && window.__quietUnlock())
  await sleep(40)
  await holdMouse(page, 80)
  await sleep(180)
  const hint = await page.evaluate(() => {
    const toast = document.getElementById('toast')
    const ring = document.getElementById('pick-ring')
    return { toast: toast && !toast.hidden ? toast.textContent : '', ring: !!(ring && !ring.hidden), flower: window.__blocks.getVoxel(0, 0, 0) }
  })
  const flowerStill = await page.evaluate((x, y, z) => window.__blocks.getVoxel(x, y, z), daisy.x, daisy.y, daisy.z)
  note(/hold/i.test(hint.toast) && hint.ring && flowerStill === FLORA_IDS.daisy, 'quick click hint', JSON.stringify({ hint, flowerStill }))
  await page.evaluate((i) => window.__smoke.key(i), sap.slot)

  async function chop(cell, item, ms) {
    const before = await countOf(page, item)
    await page.evaluate(() => window.__quietUnlock && window.__quietUnlock())
    await sleep(40)
    const aimed = await aim(page, cell.x, cell.y, cell.z, cell.id)
    await holdMouse(page, ms)
    await sleep(300)
    const after = await countOf(page, item)
    const voxel = await page.evaluate((x, y, z) => window.__blocks.getVoxel(x, y, z), cell.x, cell.y, cell.z)
    return { before, after, voxel, aimed }
  }
  const flower = await chop({ ...daisy, id: FLORA_IDS.daisy }, 'daisy', mineMs('daisy', true, false) + 900)
  note(flower.voxel === 0 && flower.after === flower.before + 1, 'break flower', JSON.stringify(flower))
  await shot(page, 'after-break')
  const tuftGot = await chop(tuft, 'wheatSeeds', mineMs('tuft', true, false) + 700)
  note(tuftGot.voxel === 0 && tuftGot.after === tuftGot.before + 1, 'break tuft', JSON.stringify(tuftGot))
  const grassGot = await chop(grassBreak, 'dirt', mineMs('grass', true, false) + 700)
  note(grassGot.voxel === 0 && grassGot.after === grassGot.before + 1, 'break grass', JSON.stringify(grassGot))
  const logGot = await chop(log, 'log', mineMs('log', true, false) + 800)
  note(logGot.voxel === 0 && logGot.after === logGot.before + 1, 'break log', JSON.stringify(logGot))

  const sapBefore = await countOf(page, 'sapling')
  await page.evaluate(() => window.__quietUnlock && window.__quietUnlock())
  await sleep(40)
  const grassAim = await aim(page, grass.x, grass.y, grass.z, 1)
  await holdMouse(page, 90, 'right')
  await sleep(300)
  const placed = await page.evaluate((x, y, z) => {
    const hits = []
    for (let dx = -1; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) for (let dz = -1; dz <= 1; dz++) {
      const id = window.__blocks.getVoxel(x + dx, y + dy, z + dz)
      if (id === 185) hits.push([x + dx, y + dy, z + dz])
    }
    return { hits, sap: window.__smoke.count('sapling') }
  }, grass.x, grass.y, grass.z)
  note(placed.hits.length === 1 && placed.sap === sapBefore - 1, 'place sapling', JSON.stringify({ grassAim, placed, sapBefore }))
  await shot(page, 'after-place')

  await page.evaluate(() => window.__quietUnlock && window.__quietUnlock())
  await sleep(40)
  const c0 = await center(page)
  await page.mouse.move(c0.x, c0.y)
  await page.mouse.down()
  await sleep(120)
  await page.mouse.up()
  await sleep(250)
  const lockedOnce = await page.evaluate(() => !!document.pointerLockElement)
  await page.evaluate(() => document.exitPointerLock())
  await sleep(250)
  const afterExit = await page.evaluate(() => ({
    locked: !!document.pointerLockElement,
    sheet: !document.getElementById('sheet').hidden,
    chip: !document.getElementById('play-chip').hidden,
  }))
  const c1 = await center(page)
  await page.mouse.move(c1.x, c1.y)
  await page.mouse.down()
  await sleep(80)
  await page.mouse.up()
  await sleep(400)
  const relock = await page.evaluate(() => ({
    locked: !!document.pointerLockElement,
    sheet: !document.getElementById('sheet').hidden,
    chip: !document.getElementById('play-chip').hidden,
  }))
  const again = daisy2 || grass
  const againId = daisy2 ? FLORA_IDS.daisy : 1
  const againItem = daisy2 ? 'daisy' : 'dirt'
  const againMs = mineMs(againItem === 'daisy' ? 'daisy' : 'grass', true, false) + 900
  const before2 = await countOf(page, againItem)
  const againAim = await aim(page, again.x, again.y, again.z, againId)
  await holdMouse(page, againMs * 2 + 800)
  await sleep(300)
  const after2 = await countOf(page, againItem)
  const voxel2 = await page.evaluate((x, y, z) => window.__blocks.getVoxel(x, y, z), again.x, again.y, again.z)
  note(!afterExit.sheet && (relock.locked || relock.chip) && voxel2 === 0 && after2 === before2 + 1, 'relock then break', JSON.stringify({ lockedOnce, afterExit, relock, againAim, before2, after2, voxel2 }))

  const bad = errors.filter((e) => !noise.test(e))
  note(bad.length === 0, 'pc console', bad.slice(0, 4).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

async function phone() {
  const { ctx, page, errors } = await boot(915, 412, true)
  const flower = daisy2 || daisy
  const before = await countOf(page, 'daisy')
  await aim(page, flower.x, flower.y, flower.z, FLORA_IDS.daisy)
  const c = await center(page)
  await page.touchscreen.touchStart(c.x, c.y)
  await sleep(700)
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  await sleep(mineMs('daisy', true, true) + 400)
  await page.touchscreen.touchEnd().catch(() => {})
  await sleep(400)
  let voxel = await page.evaluate((x, y, z) => window.__blocks.getVoxel(x, y, z), flower.x, flower.y, flower.z)
  let after = await countOf(page, 'daisy')
  if (voxel !== 0) {
    await page.setViewport({ width: 915, height: 412, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
    await sleep(300)
    await aim(page, flower.x, flower.y, flower.z, FLORA_IDS.daisy)
    const c2 = await center(page)
    await page.touchscreen.touchStart(c2.x, c2.y)
    await sleep(mineMs('daisy', true, true) + 900)
    await page.touchscreen.touchEnd()
    await sleep(400)
    voxel = await page.evaluate((x, y, z) => window.__blocks.getVoxel(x, y, z), flower.x, flower.y, flower.z)
    after = await countOf(page, 'daisy')
  }
  note(voxel === 0 && after === before + 1, 'phone flower', JSON.stringify({ before, after, voxel, flower }))
  const bad = errors.filter((e) => !noise.test(e))
  note(bad.length === 0, 'phone console', bad.slice(0, 4).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

try {
  if (!fail.length) {
    await pc()
    await phone()
  }
} catch (e) {
  note(false, 'browser', e && e.stack ? e.stack.split('\n').slice(0, 12).join(' ') : String(e))
}
await browser.close()
server.close()
if (fail.length) {
  console.log('FAIL ' + fail.length)
  process.exit(1)
}
console.log('INTERACT PASS')
