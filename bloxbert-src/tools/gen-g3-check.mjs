// Gen 5 rivers and lakes. Gen 4 chunks stay byte-identical. No browser until the headless checks pass.
import { createHash } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'
import { genBlock, groundAt, genColumns, spawnGround } from '../src/worldgen.js'

const S = 24
const GEN4_SAMPLE = '9f88619597f29a3d8f45bef88f678bf64735ce90947d4460a356da2a239a4d60'
const GEN3_SAMPLE = '2c06555d8307d1cd8ab3842cfef4d8060212a2ba43e223cea02d31beb214694a'
const CHUNK_HASH = {
  '2,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '4,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '4,96,-72': '5362bf330ed85d55509e702d7ca32dbe1f87f3a7e66ef85a189a8baa3d769f18',
  '3,96,-72': '53ae0ace4d2192a2859b879c0f0b16fb0cf2b8934fdc27324e84a20fe5026deb',
}
const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}

function gen4Sample() {
  const h = createHash('sha256')
  let n = 0
  for (let x = 96; x < 144; x++) {
    for (let z = 96; z < 144; z++) {
      const y = groundAt(x, z, 4)
      for (let dy = -2; dy <= 6; dy++) {
        h.update((genBlock(x, y + dy, z, 4) || '-') + '\n')
        n++
      }
    }
  }
  h.update(String(n))
  return h.digest('hex')
}

function genSampleHash(gen, x0, z0, x1, z1) {
  const h = createHash('sha256')
  let n = 0
  for (let x = x0; x < x1; x++) {
    for (let z = z0; z < z1; z++) {
      const y = spawnGround(x, z)
      for (let dy = -2; dy <= 6; dy++) {
        h.update(genBlock(x, y + dy, z, gen) || '-')
        n++
      }
    }
  }
  h.update(String(n))
  return h.digest('hex')
}

function chunkHash(gen, x0, z0) {
  const arr = new Int8Array(S * S)
  arr.fill(12)
  const cols = genColumns(x0, z0, gen, arr)
  const h = createHash('sha256')
  const fade = () => 12
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
    h.update(genBlock(x0 + i, j, z0 + k, gen, fade, cols) || '-')
  }
  return h.digest('hex')
}

function townD(x, z) {
  let dx = 0
  let dz = 0
  if (x < -20) dx = -20 - x
  else if (x > 36) dx = x - 36
  if (z < -18) dz = -18 - z
  else if (z > 28) dz = z - 28
  return Math.hypot(dx, dz)
}
function inSafe(x, z) {
  return Math.min(Math.hypot(x + 0.5 - 8.5, z + 0.5 - 1.5), townD(x, z)) <= 48
}

const g4s = gen4Sample()
note(g4s === GEN4_SAMPLE, 'gen4 sample', g4s.slice(0, 12))
const g3s = genSampleHash(3, 96, 48, 144, 96)
note(g3s === GEN3_SAMPLE, 'gen3 sample', g3s.slice(0, 12))
for (const [k, want] of Object.entries(CHUNK_HASH)) {
  const [g, x, z] = k.split(',').map(Number)
  const got = chunkHash(g, x, z)
  note(got === want, 'chunk g' + g + ' ' + x + ',' + z, got.slice(0, 12))
}

let colsBad = 0
let colsFirst = ''
const fade12 = () => 12
for (let n = 0; n < 8; n++) {
  const x0 = ((n % 4) - 1) * 48
  const z0 = (Math.floor(n / 4) - 1) * 72
  const arr = new Int8Array(S * S)
  arr.fill(12)
  const cols = genColumns(x0, z0, 5, arr)
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j += 3) for (let k = 0; k < S; k++) {
    const a = genBlock(x0 + i, j, z0 + k, 5, fade12) || ''
    const b = genBlock(x0 + i, j, z0 + k, 5, fade12, cols) || ''
    if (a !== b) {
      colsBad++
      if (!colsFirst) colsFirst = (x0 + i) + ',' + j + ',' + (z0 + k) + ' ' + a + '→' + b
    }
  }
}
note(colsBad === 0, 'gen5 cols match', colsBad ? colsBad + ' ' + colsFirst : '0')

const water = new Map()
let airUnder = 0
let deep = 0
let safeNew = 0
let plantOn = 0
for (let x0 = -216; x0 <= 216; x0 += S) {
  for (let z0 = -216; z0 <= 216; z0 += S) {
    const arr = new Int8Array(S * S)
    arr.fill(12)
    const cols = genColumns(x0, z0, 5, arr)
    if (!cols.hasWater) continue
    const cols4 = genColumns(x0, z0, 4, arr)
    for (let i = 0; i < S; i++) for (let k = 0; k < S; k++) {
      const x = x0 + i
      const z = z0 + k
      const h = cols.h[i * S + k]
      let top = -99
      let depth = 0
      let old = false
      for (let y = Math.min(23, h + 3); y >= h - 3 && y >= -2; y--) {
        if (genBlock(x, y, z, 4, fade12, cols4) === 'water') old = true
        if (genBlock(x, y, z, 5, fade12, cols) === 'water') {
          if (y > top) top = y
          depth++
          if (!genBlock(x, y - 1, z, 5, fade12, cols)) airUnder++
        }
      }
      if (depth > 3) deep++
      if (!depth) continue
      if (inSafe(x, z) && !old) safeNew++
      const above = genBlock(x, top + 1, z, 5, fade12, cols)
      if (above === 'wheat' || above === 'tuft' || above === 'bushFruit' || above === 'log' || above === 'leaves') plantOn++
      water.set(x + ',' + z, top)
    }
  }
}
note(airUnder === 0, 'no air under water', String(airUnder))
note(deep === 0, 'water at most 3 deep', String(deep))
note(safeNew === 0, 'no new water in the safe zone', String(safeNew))
note(plantOn === 0, 'no plants on water', String(plantOn))

let steps = 0
for (const [k, y] of water) {
  const [x, z] = k.split(',').map(Number)
  for (const [dx, dz] of [[1, 0], [0, 1]]) {
    const o = water.get((x + dx) + ',' + (z + dz))
    if (o != null && Math.abs(o - y) > 1) steps++
  }
}
note(steps === 0, 'no water wall', String(steps))

const lakes = []
const rivers = []
const seenLake = new Set()
for (const [k, y] of water) {
  if (seenLake.has(k)) continue
  const [sx, sz] = k.split(',').map(Number)
  const q = [[sx, sz]]
  seenLake.add(k)
  const cells = [[sx, sz]]
  let minx = sx, maxx = sx, minz = sz, maxz = sz
  while (q.length) {
    const [x, z] = q.pop()
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = (x + dx) + ',' + (z + dz)
      if (seenLake.has(nk) || water.get(nk) !== y) continue
      seenLake.add(nk)
      cells.push([x + dx, z + dz])
      q.push([x + dx, z + dz])
      if (x + dx < minx) minx = x + dx
      if (x + dx > maxx) maxx = x + dx
      if (z + dz < minz) minz = z + dz
      if (z + dz > maxz) maxz = z + dz
    }
  }
  const w = maxx - minx + 1
  const h = maxz - minz + 1
  const minor = Math.min(w, h)
  const major = Math.max(w, h)
  const cx = (minx + maxx) / 2
  const cz = (minz + maxz) / 2
  const d = Math.hypot(cx - 8.5, cz - 1.5)
  if (d > 200 || minor < 8 || minor > 20 || major > 22 || cells.length < 40) continue
  let best = cells[0]
  let bestN = -1
  for (const c of cells) {
    let n = 0
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      if (water.get((c[0] + dx) + ',' + (c[1] + dz)) === y) n++
    }
    if (n > bestN) { bestN = n; best = c }
  }
  lakes.push({ x: best[0], z: best[1], y, w, h, n: cells.length, d: Math.round(d) })
}
const seenRiver = new Set()
for (const [k, y] of water) {
  if (seenRiver.has(k)) continue
  const [sx, sz] = k.split(',').map(Number)
  const q = [[sx, sz, y]]
  seenRiver.add(k)
  const cells = [[sx, sz, y]]
  let minx = sx, maxx = sx, minz = sz, maxz = sz
  while (q.length) {
    const [x, z, cy] = q.pop()
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nk = (x + dx) + ',' + (z + dz)
      const ny = water.get(nk)
      if (ny == null || seenRiver.has(nk) || Math.abs(ny - cy) > 1) continue
      seenRiver.add(nk)
      cells.push([x + dx, z + dz, ny])
      q.push([x + dx, z + dz, ny])
      if (x + dx < minx) minx = x + dx
      if (x + dx > maxx) maxx = x + dx
      if (z + dz < minz) minz = z + dz
      if (z + dz > maxz) maxz = z + dz
    }
  }
  const w = maxx - minx + 1
  const h = maxz - minz + 1
  const minor = Math.min(w, h)
  const major = Math.max(w, h)
  if (major < 18 || minor > 6 || cells.length < 20) continue
  let at = null
  for (let i = 0; i < cells.length; i += Math.max(1, Math.floor(cells.length / 16))) {
    const [x, z, ty] = cells[i]
    let a = 1
    for (let t = 1; water.get((x + t) + ',' + z) != null; t++) a++
    for (let t = 1; water.get((x - t) + ',' + z) != null; t++) a++
    let b = 1
    for (let t = 1; water.get(x + ',' + (z + t)) != null; t++) b++
    for (let t = 1; water.get(x + ',' + (z - t)) != null; t++) b++
    const width = Math.min(a, b)
    if (width >= 3 && width <= 5 && !inSafe(x, z) && Math.hypot(x - 8.5, z - 1.5) <= 200) at = { x, z, y: ty, width }
  }
  if (at) rivers.push({ ...at, span: major, d: Math.round(Math.hypot(at.x - 8.5, at.z - 1.5)) })
}
lakes.sort((a, b) => b.n - a.n)
rivers.sort((a, b) => b.span - a.span)
note(lakes.length > 0, 'lake within 200', lakes[0] ? JSON.stringify(lakes[0]) : 'none')
note(rivers.length > 0, 'river within 200', rivers[0] ? JSON.stringify(rivers[0]) : 'none')
const lake = lakes[0] || null
const river = rivers[0] || null

const spots = []
for (let x = -24; x <= 120; x += 24) for (let z = -24; z <= 120; z += 24) spots.push([x, z])
function fill(gen, x0, z0) {
  const arr = new Int8Array(S * S)
  arr.fill(12)
  const t = performance.now()
  const cols = genColumns(x0, z0, gen, arr)
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) genBlock(x0 + i, j, z0 + k, gen, fade12, cols)
  return performance.now() - t
}
for (const [x, z] of spots) fill(4, x, z)
let s4 = 0
for (const [x, z] of spots) s4 += fill(4, x, z)
for (const [x, z] of spots) fill(5, x, z)
let s5 = 0
for (const [x, z] of spots) s5 += fill(5, x, z)
const ms4 = s4 / spots.length
const ms5 = s5 / spots.length
const ratio = ms5 / ms4
console.log('warm chunk ms gen4 ' + ms4.toFixed(2) + ' gen5 ' + ms5.toFixed(2) + ' ratio ' + ratio.toFixed(3))
note(ratio <= 1.12, 'gen cost within 10%', ratio.toFixed(3))

if (fail.length || !lake || !river) {
  console.log('HEADLESS FAIL ' + fail.length)
  process.exit(1)
}

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const out = '/tmp/gen-g3-check'
mkdirSync(out, { recursive: true })
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome'); process.exit(1) }
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const underShared = p.startsWith('/shared/')
  const base = underShared ? sharedRoot : root
  const rel = underShared ? p.slice('/shared/'.length) : p
  const f = path.join(base, rel)
  if (!f.startsWith(base)) { res.writeHead(403); return res.end() }
  try {
    let b = await readFile(f)
    const ext = path.extname(f)
    const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
const PORT = 8883
await new Promise((r) => server.listen(PORT, '127.0.0.1', r))
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const shots = []

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
    window.__blocks.mode('creative')
    window.__smoke.arm()
  })
  await sleep(300)
  return { ctx, page, errors }
}

async function shot(page, name) {
  const file = path.join(out, name + '.png')
  await page.screenshot({ path: file })
  shots.push(file)
  return file
}

async function sampleFps(page) {
  const start = await page.evaluate(() => window.__blocks.perf.frames.length)
  await sleep(2500)
  return page.evaluate((n) => {
    const rows = window.__blocks.perf.frames.slice(n)
    const fps = rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0
    return { n: rows.length, fps }
  }, start)
}

function shoreOf(x, z) {
  for (let r = 1; r <= 8; r++) {
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue
      const nx = x + dx
      const nz = z + dz
      if (water.has(nx + ',' + nz)) continue
      let touch = false
      for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (water.has((nx + a) + ',' + (nz + b))) touch = true
      }
      if (!touch) continue
      const h = groundAt(nx, nz, 5)
      return { x: nx, z: nz, y: h + 1, face: Math.atan2(x - nx, z - nz) }
    }
  }
  const h = groundAt(x, z, 5)
  return { x, z, y: h + 1, face: 0 }
}

async function go(page, x, y, z, heading) {
  await page.evaluate((x, y, z, heading) => {
    const B = window.__blocks
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    B.tp(x + 0.5, y, z + 0.5)
    B.setLook(heading || 0, 0.15)
  }, x, y, z, heading || 0)
  await page.waitForFunction((x, z) => {
    try { return window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
  }, { timeout: 20000 }, x, z).catch(() => {})
  const seen = await page.waitForFunction((x, y, z) => {
    const id = window.__blocks.getVoxel(x, y, z)
    return id === 64 || id === 1 || id === 6 || id === 7 || id === 2
  }, { timeout: 20000 }, x, Math.max(0, y - 1), z).then(() => true).catch(() => false)
  return seen
}

async function sink(page, x, z, top) {
  const feet = top - 0.85
  for (let i = 0; i < 8; i++) {
    await page.evaluate((x, feet, z) => {
      const B = window.__blocks
      const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
      if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
      B.tp(x + 0.5, feet, z + 0.5)
      B.setLook(0.4, 0.55)
    }, x, feet, z)
    await sleep(80)
  }
  return page.evaluate(() => {
    const eye = window.__blocks.noa.camera.getPosition()
    const id = window.__blocks.getVoxel(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2]))
    const uw = document.getElementById('uw')
    const pos = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    return { id, uw: !!(uw && !uw.hidden), eye: [eye[0], eye[1], eye[2]], pos: [pos[0], pos[1], pos[2]] }
  })
}

async function visit(tag, w, h, touch) {
  const { ctx, page, errors } = await boot(w, h, touch)
  const spawnFps = await sampleFps(page)
  const shore = shoreOf(lake.x, lake.z)
  await go(page, shore.x, shore.y, shore.z, shore.face)
  await page.evaluate(() => { window.__blocks.hold('forward', true) })
  await sleep(900)
  await page.evaluate(() => { window.__blocks.hold('forward', false) })
  await shot(page, tag + '-lake-bank')
  const wet = await sink(page, lake.x, lake.z, lake.y)
  await shot(page, tag + '-lake-swim')
  note(wet.id === 64 && wet.uw, tag + ' swim lake', JSON.stringify(wet))
  const lakeFps = await sampleFps(page)
  const rShore = shoreOf(river.x, river.z)
  await go(page, rShore.x, rShore.y, rShore.z, rShore.face)
  await page.evaluate(() => { window.__blocks.hold('forward', true) })
  await sleep(700)
  await page.evaluate(() => { window.__blocks.hold('forward', false) })
  const riverWet = await sink(page, river.x, river.z, river.y)
  await shot(page, tag + '-river')
  note(riverWet.id === 64, tag + ' in river', JSON.stringify(riverWet))
  const fpsOk = spawnFps.n >= 2 && lakeFps.n >= 2 && lakeFps.fps > spawnFps.fps * 0.45
  note(fpsOk, tag + ' fps', 'spawn ' + spawnFps.fps.toFixed(2) + ' (' + spawnFps.n + ') lake ' + lakeFps.fps.toFixed(2) + ' (' + lakeFps.n + ')')
  const noise = /favicon|Failed to load resource|WebGL|GPU|THREE|babylon|\.png|wasm|Expected a color/i
  const bad = errors.filter((e) => !noise.test(e))
  note(bad.length === 0, tag + ' console', bad.slice(0, 4).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

try {
  await visit('1366', 1366, 768, false)
  await visit('915', 915, 412, true)
} catch (e) {
  note(false, 'browser', e && e.stack ? e.stack.split('\n').slice(0, 4).join(' ') : String(e))
}
await browser.close()
server.close()
console.log('shots ' + shots.join(' '))
if (fail.length) {
  console.log('FAIL ' + fail.length)
  process.exit(1)
}
console.log('ALL PASS')
