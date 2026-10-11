// Gen 6 caves, overhangs, outcrops, and the river/lake fixes. Gen 2–5 stay byte-identical.
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
const HEADLESS = process.argv.includes('--headless')
const GEN4_SAMPLE = '9f88619597f29a3d8f45bef88f678bf64735ce90947d4460a356da2a239a4d60'
const GEN3_SAMPLE = '2c06555d8307d1cd8ab3842cfef4d8060212a2ba43e223cea02d31beb214694a'
const CHUNK_HASH = {
  '2,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '3,96,-72': '53ae0ace4d2192a2859b879c0f0b16fb0cf2b8934fdc27324e84a20fe5026deb',
  '4,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '4,96,-72': '5362bf330ed85d55509e702d7ca32dbe1f87f3a7e66ef85a189a8baa3d769f18',
  '5,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '5,96,-72': '1ebab38b5bef72b072e50936d58b7db3a63eea4de0ce2c13325d221780512934',
  '5,48,48': 'b9a409ecf9acd0c3f00b40fa140876b62afe49a8d022f1a7c5169d2e231211ef',
  '5,-48,72': '0b08acf83ec933f8f902f57ca258ec497662aefdb8cc1ad95ef38fa7fea7a23c',
  '5,120,24': '6f452be7d617328d9b0a4a06903afaa0163ae43b85e283058d8581423a5944f0',
}
const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}
const fade12 = () => 12

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
  for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
    h.update(genBlock(x0 + i, j, z0 + k, gen, fade12, cols) || '-')
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
function solidName(name) {
  return !!name && name !== 'water' && name !== 'reed' && name !== 'wheat' && name !== 'tuft' && name !== 'bushFruit' && name !== 'leaves'
}

note(gen4Sample() === GEN4_SAMPLE, 'gen4 sample', gen4Sample().slice(0, 12))
note(genSampleHash(3, 96, 48, 144, 96) === GEN3_SAMPLE, 'gen3 sample')
for (const [k, want] of Object.entries(CHUNK_HASH)) {
  const [g, x, z] = k.split(',').map(Number)
  const got = chunkHash(g, x, z)
  note(got === want, 'chunk g' + g + ' ' + x + ',' + z, got.slice(0, 12))
}

let colsBad = 0
let colsFirst = ''
for (let n = 0; n < 6; n++) {
  const x0 = ((n % 3) - 1) * 72
  const z0 = (Math.floor(n / 3) - 1) * 96
  const arr = new Int8Array(S * S)
  arr.fill(12)
  const cols = genColumns(x0, z0, 6, arr)
  for (let i = 0; i < S; i += 2) for (let k = 0; k < S; k += 2) {
    const x = x0 + i
    const z = z0 + k
    const info = cols.feat && cols.feat[i * S + k]
    const y0 = info ? info.y0 : 0
    const y1 = info ? info.y1 : 8
    for (let y = y0; y <= y1; y += 2) {
      const a = genBlock(x, y, z, 6, fade12) || ''
      const b = genBlock(x, y, z, 6, fade12, cols) || ''
      if (a !== b) {
        colsBad++
        if (!colsFirst) colsFirst = x + ',' + y + ',' + z + ' ' + a + '→' + b
      }
    }
  }
}
note(colsBad === 0, 'gen6 cols match', colsBad ? colsBad + ' ' + colsFirst : '0')

const water = new Map()
const caves = []
const lips = []
const rocks = []
let airUnder = 0
let faces = 0
let safeFeat = 0
let caveWater = 0
let reeds = 0
let lakeEdges = 0
for (let x0 = -216; x0 <= 216; x0 += S) {
  for (let z0 = -216; z0 <= 216; z0 += S) {
    const arr = new Int8Array(S * S)
    arr.fill(12)
    const cols = genColumns(x0, z0, 6, arr)
    if (!cols.hasFeat) continue
    for (let i = 0; i < S; i++) for (let k = 0; k < S; k++) {
      const info = cols.feat[i * S + k]
      if (!info) continue
      const x = x0 + i
      const z = z0 + k
      const d = Math.hypot(x - 8.5, z - 1.5)
      if (inSafe(x, z) && (info.water || info.cave || info.lip || info.rock || info.bank || info.seal)) safeFeat++
      if (info.water && info.cave) caveWater++
      if (info.cave) {
        if (info.cave.lo < 1 || info.h - info.cave.lo > 12) caveWater += 100
        caves.push({ x, z, d, lo: info.cave.lo, hi: info.cave.hi, h: info.h, mouth: info.cave.mouth })
        for (let y = info.cave.lo; y <= info.cave.hi; y++) {
          if (genBlock(x, y, z, 6, fade12, cols) === 'water') caveWater++
          for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            if (genBlock(x + dx, y, z + dz, 6, fade12) === 'water') caveWater++
          }
        }
      }
      if (info.lip) lips.push({ x, z, d, y0: info.lip.y0, y1: info.lip.y1, h: info.h })
      if (info.rock) rocks.push({ x, z, d, h: info.h, name: info.rock.name, w: info.rock.w, tall: info.rock.tall })
      if (info.water) {
        water.set(x + ',' + z, { top: info.water.top, depth: info.water.depth, lake: info.water.lake })
        for (let y = info.water.top; y >= info.water.top - info.water.depth + 1; y--) {
          if (!genBlock(x, y - 1, z, 6, fade12, cols)) airUnder++
        }
      }
      const reed = (info.bank && info.bank.reed) || (info.seal && info.seal.reed)
      if (reed) reeds++
    }
  }
}

for (const [k, v] of water) {
  const [x, z] = k.split(',').map(Number)
  for (let y = v.top; y >= v.top - v.depth + 1; y--) {
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const o = water.get((x + dx) + ',' + (z + dz))
      if (o && y <= o.top && y >= o.top - o.depth + 1) continue
      if (!genBlock(x + dx, y, z + dz, 6, fade12)) faces++
    }
  }
}

note(airUnder === 0, 'no air under water', String(airUnder))
note(faces === 0, 'no water face', String(faces))
note(safeFeat === 0, 'no feature in the 48 zone', String(safeFeat))
note(caveWater === 0, 'no cave under water', String(caveWater))

let river = null
for (const [k, v] of water) {
  if (v.lake || v.depth < 2) continue
  const [x, z] = k.split(',').map(Number)
  const d = Math.hypot(x - 8.5, z - 1.5)
  if (d > 200 || inSafe(x, z)) continue
  let a = 1
  for (let t = 1; water.has((x + t) + ',' + z); t++) a++
  for (let t = 1; water.has((x - t) + ',' + z); t++) a++
  let b = 1
  for (let t = 1; water.has(x + ',' + (z + t)); t++) b++
  for (let t = 1; water.has(x + ',' + (z - t)); t++) b++
  const width = Math.min(a, b)
  const across = a <= b
  const span = across ? a : b
  if (width < 3 || width > 5) continue
  let mid = v.depth
  const step = across ? [1, 0] : [0, 1]
  for (let t = -span; t <= span; t++) {
    const o = water.get((x + step[0] * t) + ',' + (z + step[1] * t))
    if (o && o.depth > mid) mid = o.depth
  }
  if (mid < 2) continue
  river = { x, z, y: v.top, depth: v.depth, mid, width, d: Math.round(d) }
  break
}
note(!!river, 'river 3-5 wide, middle >= 2', river ? JSON.stringify(river) : 'none')

let lake = null
let lakeDeep = 0
let lakeShallow = 0
for (const [k, v] of water) {
  if (!v.lake) continue
  const [x, z] = k.split(',').map(Number)
  const d = Math.hypot(x - 8.5, z - 1.5)
  if (d > 200) continue
  if (v.depth >= 3) lakeDeep++
  if (v.depth === 1) lakeShallow++
  if (!lake && v.depth >= 3) lake = { x, z, y: v.top, depth: v.depth, d: Math.round(d) }
}
note(lakeDeep > 0 && lakeShallow > 0, 'lake middle 3 and edge 1', 'deep ' + lakeDeep + ' edge ' + lakeShallow + (lake ? ' at ' + lake.x + ',' + lake.z : ''))

let reedNear = 0
for (const [k, v] of water) {
  if (!v.lake) continue
  const [x, z] = k.split(',').map(Number)
  if (Math.hypot(x - 8.5, z - 1.5) > 200) continue
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (water.has((x + dx) + ',' + (z + dz))) continue
    const b = genBlock(x + dx, v.top + 1, z + dz, 6, fade12)
    if (b === 'reed') reedNear++
  }
}
note(reedNear >= 8, 'reeds on lake edges', String(reedNear))

let open = null
for (const c of caves) {
  if (c.d > 200) continue
  for (let y = c.lo; y <= c.hi && !open; y++) {
    if (genBlock(c.x, y, c.z, 6, fade12)) continue
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + dx
      const nz = c.z + dz
      if (genBlock(nx, y, nz, 6, fade12)) continue
      let sky = true
      for (let yy = y + 1; yy <= 18; yy++) {
        const b = genBlock(nx, yy, nz, 6, fade12)
        if (solidName(b)) { sky = false; break }
      }
      if (!sky) continue
      const floor = c.lo - 1
      open = { x: c.x, z: c.z, y, nx, nz, floor, hi: c.hi, lo: c.lo, d: Math.round(c.d) }
      break
    }
  }
  if (open) break
}
note(!!open, 'cave with a sky opening', open ? JSON.stringify(open) : 'none')

function grounded(sx, sy, sz) {
  const seen = new Set()
  const stack = [[sx, sy, sz]]
  while (stack.length && seen.size < 4000) {
    const [x, y, z] = stack.pop()
    const key = x + ',' + y + ',' + z
    if (seen.has(key) || y < -2) continue
    const b = genBlock(x, y, z, 6, fade12)
    if (!solidName(b)) continue
    seen.add(key)
    if (y <= 0) return true
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) stack.push([x + dx, y, z + dz])
    stack.push([x, y - 1, z])
  }
  return false
}
let floatLip = 0
let overhang = null
for (const L of lips) {
  const under = genBlock(L.x, L.y0 - 1, L.z, 6, fade12)
  const cap = genBlock(L.x, L.y1, L.z, 6, fade12)
  if (under || !solidName(cap) || !grounded(L.x, L.y1, L.z)) floatLip++
  else if (L.d <= 200 && !overhang) overhang = { x: L.x, z: L.z, y0: L.y0, y1: L.y1, h: L.h, d: Math.round(L.d) }
}
note(floatLip === 0, 'no floating lip', String(floatLip))
note(!!overhang, 'overhang within 200', overhang ? JSON.stringify(overhang) : 'none')

let rock = null
let rockBad = 0
for (const R of rocks) {
  const below = genBlock(R.x, R.h, R.z, 6, fade12)
  const top = genBlock(R.x, R.h + 1, R.z, 6, fade12)
  if (!solidName(below) || (top !== 'stone' && top !== 'gravel')) rockBad++
  if (R.d <= 200 && !rock && (R.name === 'stone' || R.name === 'gravel') && R.w >= 2 && R.w <= 4) {
    rock = { x: R.x, z: R.z, h: R.h, name: R.name, w: R.w, d: Math.round(R.d) }
  }
}
note(rockBad === 0, 'outcrops sit on ground', String(rockBad))
note(!!rock, 'outcrop within 200', rock ? JSON.stringify(rock) : 'none')

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
for (const [x, z] of spots) fill(5, x, z)
let s5 = 0
for (const [x, z] of spots) s5 += fill(5, x, z)
for (const [x, z] of spots) fill(6, x, z)
let s6 = 0
for (const [x, z] of spots) s6 += fill(6, x, z)
const ms5 = s5 / spots.length
const ms6 = s6 / spots.length
const ratio = ms6 / ms5
console.log('warm chunk ms gen5 ' + ms5.toFixed(2) + ' gen6 ' + ms6.toFixed(2) + ' ratio ' + ratio.toFixed(3))
note(ratio <= 1.1, 'gen cost within 10%', ratio.toFixed(3))
note(ms6 <= 6, 'walk chunk budget', ms6.toFixed(2) + 'ms')

if (HEADLESS || fail.length || !open || !river || !overhang || !rock) {
  if (fail.length) {
    console.log('HEADLESS FAIL ' + fail.length)
    process.exit(1)
  }
  if (HEADLESS) {
    console.log('HEADLESS PASS')
    process.exit(0)
  }
}

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const out = '/tmp/gen-g4-check'
mkdirSync(out, { recursive: true })
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
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
const PORT = 8884
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
  await sleep(1500)
  const start = await page.evaluate(() => window.__blocks.perf.frames.length)
  await sleep(3200)
  return page.evaluate((n) => {
    const rows = window.__blocks.perf.frames.slice(Math.max(0, n))
    const use = rows.length > 1 ? rows.slice(1) : rows
    const fps = use.length ? use.reduce((a, b) => a + b, 0) / use.length : 0
    return { n: use.length, fps, raw: rows.map((v) => Math.round(v)) }
  }, start)
}

async function go(page, x, y, z, heading, pitch) {
  await page.evaluate((x, y, z, heading, pitch) => {
    const B = window.__blocks
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    B.tp(x + 0.5, y, z + 0.5)
    B.setLook(heading || 0, pitch == null ? 0.2 : pitch)
  }, x, y, z, heading || 0, pitch)
  await page.waitForFunction(() => {
    try { return window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
  }, { timeout: 20000 }).catch(() => {})
  await sleep(400)
}

async function sink(page, x, z, top) {
  const feet = top - 0.85
  for (let i = 0; i < 8; i++) {
    await page.evaluate((x, feet, z) => {
      const B = window.__blocks
      const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
      if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
      B.tp(x + 0.5, feet, z + 0.5)
      B.setLook(0.6, 0.05)
    }, x, feet, z)
    await sleep(80)
  }
  return page.evaluate(() => {
    const eye = window.__blocks.noa.camera.getPosition()
    const id = window.__blocks.getVoxel(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2]))
    const uw = document.getElementById('uw')
    return { id, uw: !!(uw && !uw.hidden), eye: [eye[0], eye[1], eye[2]] }
  })
}

async function visit(tag, w, h, touch) {
  const { ctx, page, errors } = await boot(w, h, touch)
  const spawnFps = await sampleFps(page)
  let walkFps = null
  if (tag === '915') {
    await page.evaluate(() => {
      const B = window.__blocks
      B.setLook(Math.atan2(-132.5, -137.5), 0.12)
      B.hold('forward', true)
    })
    walkFps = await sampleFps(page)
    await page.evaluate(() => { window.__blocks.hold('forward', false) })
    console.log('915 walk fps ' + walkFps.fps.toFixed(2) + ' spawn ' + spawnFps.fps.toFixed(2))
    note(walkFps.n >= 2, '915 walk fps', walkFps.fps.toFixed(2))
  }
  const gh = groundAt(open.nx, open.nz, 6)
  const faceIn = Math.atan2(open.x - open.nx, open.z - open.nz)
  await go(page, open.nx, Math.max(open.lo, gh + 1), open.nz, faceIn, 0.1)
  await page.evaluate(() => { window.__blocks.hold('forward', true) })
  await sleep(900)
  await page.evaluate(() => { window.__blocks.hold('forward', false) })
  const faceOut = Math.atan2(open.nx - open.x, open.nz - open.z)
  await go(page, open.x, open.lo, open.z, faceOut, 0.05)
  await sleep(500)
  const inside = await page.evaluate((x, y, z, hi) => {
    const id = window.__blocks.getVoxel(x, y, z)
    const cap = window.__blocks.getVoxel(x, hi + 1, z)
    return { id, cap }
  }, open.x, open.lo + 1, open.z, open.hi)
  await shot(page, tag + '-cave')
  note(inside.id === 0 && inside.cap !== 0 && inside.cap !== 64, tag + ' in cave', JSON.stringify(inside))
  const wet = await sink(page, river.x, river.z, river.y)
  await sleep(700)
  await shot(page, tag + '-river')
  note(wet.id === 64, tag + ' swim river', JSON.stringify(wet))
  const fps = await sampleFps(page)
  const ratioF = spawnFps.fps > 0 ? fps.fps / spawnFps.fps : 0
  note(spawnFps.fps >= 8 && fps.n >= 2 && ratioF >= 0.6, tag + ' fps', 'spawn ' + spawnFps.fps.toFixed(2) + ' ' + JSON.stringify(spawnFps.raw) + ' river ' + fps.fps.toFixed(2) + ' ' + JSON.stringify(fps.raw))
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
  note(false, 'browser', e && e.stack ? e.stack.split('\n').slice(0, 6).join(' ') : String(e))
}
await browser.close()
server.close()
console.log('shots ' + shots.join(' '))
if (fail.length) {
  console.log('FAIL ' + fail.length)
  process.exit(1)
}
console.log('ALL PASS')
