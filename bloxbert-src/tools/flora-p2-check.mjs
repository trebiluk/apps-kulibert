// Flora P2. Gen 2–7 stay byte-identical. Gen 8 grows flowers, tall grass, ferns,
// and a stepped pine cone. Maker sliders change a new world only.
import { createHash } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'
import { genBlock, genColumns, setWorldTune, worldTune } from '../src/worldgen.js'
import { make } from '../src/craft.js'
import { RECIPES } from '../src/data/recipes.js'
import { BLOCKS, buildBlocks } from '../src/data/blocks-list.js'
import { setPacksOff, packStrings } from '../src/packs/registry.js'
import { FLORA_IDS, floraExtra } from '../src/packs/flora/pack.js'

const S = 24
const HEADLESS = process.argv.includes('--headless')
const CHUNK_HASH = {
  '2,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '3,96,-72': 'b8411b82bc1609e74364dae7cfbe4b4a2c25916c997baa874aea924a041ff19b',
  '4,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '4,96,-72': 'f7292c439da51d5edcbc87548ddccb5cd67da9708c6082727669e136e8d83563',
  '5,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '5,96,-72': '1d18e7d63d97d83c902364f32aae54530c1290b57ab7a745c22f892e19d761f0',
  '5,48,48': '25f3dbae86d2b23b186dcc5bfe46ec7b664dff38a637e5cd5d66230024cac8e4',
  '5,-48,72': '12c4230b080614286502b74f045f2729c2757bff9831e3afb1b438c09529023b',
  '5,120,24': 'ac5f61992cc791b5417a6259f56703d467e5a4f17f9ac4a45b5b97d3eb75a61f',
  '6,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '6,96,-72': 'bf9c6dffceb541ca478ef6cf8c3c1962ece3764ee1af025224fdfcf9e7e520a4',
  '6,48,48': '25f3dbae86d2b23b186dcc5bfe46ec7b664dff38a637e5cd5d66230024cac8e4',
  '6,-48,72': '12c4230b080614286502b74f045f2729c2757bff9831e3afb1b438c09529023b',
  '6,120,24': '62413aea15a98ead5951965d7c920b47d428892a2817ce6be8ff4c3724c6daa6',
  '6,-72,96': 'f9a657ea09a0e82fd5d3e1ce5a1f8e2632a2b8bc884ea180c3ba300b6f64f4a7',
  '6,72,-48': 'b5114820916efd89e7605ce0d72435d20e093e765f3f94ae4da2f93ec2e92f22',
  '7,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '7,96,-72': '92b82746afacc2659735211a7d62b5061d13461425c265d10014d2bf4353ec00',
  '7,48,48': 'be4f406456c957dff8977af5b32ea2b57503f53fb306838b713c7e2334cbc124',
  '7,-48,72': 'cda3f210bbdca0a6ac70dfc4f6270ece1dfe752a8c71e136e3ec4d18c0b3f69a',
  '7,120,24': '41ea2c0685900c6ac3b6fb429bd8e38473790c0efef208814e53f00982146fa8',
  '7,-72,96': '21daf8b6d6886033745f3aae3e8f66d010f7a12d6c5fedc6d06edc7eba31be60',
  '7,72,-48': 'c6a8ab3720794d0985bb2d3f0b2287cd5127bf9366238075510de95ad72d7ce6',
}
const FLOWERS = [
  [2, 3, 'daisy', 'dyeWhite'],
  [6, 1, 'poppy', 'dyeRed'],
  [9, 8, 'cornflower', 'dyeBlue'],
  [1, 10, 'sunflower', 'dyeYellow'],
  [5, 6, 'tulip', 'dyeOrange'],
  [10, 4, 'lupine', 'dyePurple'],
]
const LANGS = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']
const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}
const fade12 = () => 12
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
function bagOf(counts) {
  const slots = Array.from({ length: 36 }, () => null)
  let i = 0
  for (const [item, n] of Object.entries(counts)) slots[i++] = { item, n }
  return {
    slots,
    count(item) {
      let n = 0
      for (const s of slots) if (s && s.item === item) n += s.n
      return n
    },
    take(item, n) {
      let left = n
      for (const s of slots) {
        if (!s || s.item !== item || left <= 0) continue
        const d = Math.min(s.n, left)
        s.n -= d
        left -= d
      }
      for (let s = 0; s < slots.length; s++) if (slots[s] && slots[s].n <= 0) slots[s] = null
      return left === 0
    },
    add(item, n) {
      const hit = slots.find((s) => s && s.item === item)
      if (hit) hit.n += n
      else {
        const e = slots.findIndex((s) => !s)
        if (e >= 0) slots[e] = { item, n }
      }
      return 0
    },
  }
}
function aligned(min, mod) {
  const m = ((min % 13) + 13) % 13
  return min + ((mod - m + 13) % 13)
}

for (const [k, want] of Object.entries(CHUNK_HASH)) {
  const [g, x, z] = k.split(',').map(Number)
  const got = chunkHash(g, x, z)
  note(got === want, 'chunk g' + g + ' ' + x + ',' + z, got === want ? got.slice(0, 12) : got)
}

const ids = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
for (const [key, id] of Object.entries(FLORA_IDS)) {
  if (key === 'daisy') note(id === 1206 && ids.daisy === 1206, 'daisy id', String(ids.daisy))
  if (ids[key] != null) note(ids[key] === id, 'id ' + key, String(ids[key]))
}
note(ids.daisy === 1206 && ids.poppy === 1207 && ids.cornflower === 1208 && ids.sunflower === 1209 && ids.tulip === 1210 && ids.lupine === 1211, 'flower ids')
note(ids.tallGrass === 1212 && ids.fern === 1213, 'grass ids')

const flowers = {}
for (const [lx, lz, name] of FLOWERS) {
  let best = null
  for (let x = aligned(-200, lx); x <= 200; x += 13) {
    for (let z = aligned(-200, lz); z <= 200; z += 13) {
      const d = Math.hypot(x - 8.5, z - 1.5)
      if (d > 200) continue
      for (let y = 2; y <= 18; y++) {
        if (genBlock(x, y, z, 8) !== name) continue
        if (!best || d < best.d) best = { x, y, z, d }
        break
      }
    }
  }
  flowers[name] = best
  note(!!best && best.d <= 200, name + ' within 200', best ? JSON.stringify(best) : 'none')
}

let grass = null
let fern = null
for (let x = -120; x <= 120 && (!grass || !fern); x += 2) {
  for (let z = -120; z <= 120 && (!grass || !fern); z += 2) {
    for (let y = 2; y <= 16; y++) {
      const name = genBlock(x, y, z, 8) || ''
      if (name === 'tallGrass' && !grass) grass = { x, y, z }
      if (name === 'fern' && !fern) fern = { x, y, z }
    }
  }
}
note(!!grass, 'tall grass', grass ? JSON.stringify(grass) : 'none')
note(!!fern, 'fern', fern ? JSON.stringify(fern) : 'none')

let fernN = 0
let seedN = 0
let seedCell = null
for (let x = -140; x <= 140 && fernN < 80; x += 2) {
  for (let z = -140; z <= 140 && fernN < 80; z += 2) {
    for (let y = 2; y <= 16 && fernN < 80; y++) {
      if (genBlock(x, y, z, 8) !== 'fern') continue
      fernN++
      if (floraExtra(FLORA_IDS.fern, x, y, z) === 'wheatSeeds') {
        seedN++
        if (!seedCell) seedCell = { x, y, z }
      }
    }
  }
}
const seedRate = fernN ? seedN / fernN : 0
note(fernN >= 40 && seedRate >= 0.05 && seedRate <= 0.25 && !!seedCell, 'fern seeds 1 in 8', seedN + '/' + fernN + ' ' + seedRate.toFixed(3))

for (const [,, flower, dye] of FLOWERS) {
  const recipe = RECIPES.find((r) => r.id === dye)
  const bag = bagOf({ [flower]: 1 })
  const made = recipe && make(recipe, bag, 0)
  note(!!recipe && recipe.at === 'bench' && recipe.in[0][0] === flower && recipe.out[0] === dye && recipe.out[1] === 1 && !!made && bag.count(dye) === 1 && bag.count(flower) === 0, flower + ' -> ' + dye)
}

const strings = packStrings()
for (const lang of LANGS) {
  const row = strings[lang] || {}
  const ok = !!row.skillDaisy && !!row.skillFern && !!row.skillDyeWhite && !!row.tallGrass && (lang === 'en' || row.skillDaisy !== strings.en.skillDaisy)
  note(ok, 'skills ' + lang)
}

let pine = null
let oldNeedles = 0
let newNeedles = 0
for (let ix = -18; ix <= 18 && !pine; ix++) {
  for (let iz = -18; iz <= 18 && !pine; iz++) {
    const x = ix * 12 + 8
    const z = iz * 12 + 3
    const d = Math.hypot(x - 8.5, z - 1.5)
    if (d > 200) continue
    let trunk = 0
    for (let y = 2; y <= 22; y++) if (genBlock(x, y, z, 8) === 'pineLog') { trunk = y; break }
    if (!trunk) continue
    const rows = []
    let n8 = 0
    let n7 = 0
    for (let y = trunk; y <= trunk + 14; y++) {
      let needles = 0
      for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
        if (genBlock(x + dx, y, z + dz, 8) === 'pineNeedles') { needles++; n8++ }
        if (genBlock(x + dx, y, z + dz, 7) === 'pineNeedles') n7++
      }
      rows.push(needles)
    }
    const withN = rows.map((n, i) => ({ i, n })).filter((r) => r.n > 0)
    if (!withN.length) continue
    const tip = withN[withN.length - 1].n === 1
    const y0 = withN[0].i
    const y1 = withN[withN.length - 1].i
    const gap = rows.some((n, i) => i > y0 && i < y1 && n === 0)
    const wide = withN[0].n > 1
    if (tip && gap && wide && n8 * 2 < n7) {
      pine = { x, y: trunk, z, d }
      oldNeedles = n7
      newNeedles = n8
    }
  }
}
note(!!pine && newNeedles * 2 < oldNeedles, 'stepped cone', pine ? JSON.stringify({ ...pine, oldNeedles, newNeedles }) : 'none')

const tune0 = worldTune()
note(tune0.hills === 3 && tune0.water === 3 && tune0.trees === 3 && tune0.seed === 0, 'default tune', JSON.stringify(tune0))
const hillBase = chunkHash(6, 120, 24)
setWorldTune({ hills: 1, water: 3, trees: 3, seed: 0 })
const hill1 = chunkHash(6, 120, 24)
setWorldTune({ hills: 5, water: 3, trees: 3, seed: 0 })
const hill5 = chunkHash(6, 120, 24)
note(hill1 !== hillBase && hill5 !== hillBase && hill1 !== hill5, 'hills 1 vs 5')
setWorldTune({ hills: 3, water: 1, trees: 3, seed: 0 })
const water1 = chunkHash(6, 96, -72)
setWorldTune({ hills: 3, water: 5, trees: 3, seed: 0 })
const water5 = chunkHash(6, 96, -72)
note(water1 !== CHUNK_HASH['6,96,-72'] && water5 !== CHUNK_HASH['6,96,-72'] && water1 !== water5, 'water 1 vs 5')
function treeSlice() {
  let n = 0
  for (let x = 80; x < 160; x++) for (let z = 40; z < 120; z++) {
    const b = genBlock(x, 8, z, 8)
    if (b === 'log' || b === 'birchLog' || b === 'pineLog') n++
  }
  return n
}
setWorldTune({ hills: 3, water: 3, trees: 1, seed: 0 })
const trees1 = treeSlice()
setWorldTune({ hills: 3, water: 3, trees: 5, seed: 0 })
const trees5 = treeSlice()
note(trees1 < trees5, 'trees 1 < 5', trees1 + ' < ' + trees5)
setWorldTune({ hills: 3, water: 3, trees: 3, seed: 9 })
const seedA = chunkHash(6, 48, 48)
const seedB = chunkHash(6, 48, 48)
note(seedA === seedB && seedA !== CHUNK_HASH['6,48,48'], 'same seed twice')
setWorldTune({ hills: 3, water: 3, trees: 3, seed: 0 })
note(chunkHash(6, 120, 24) === hillBase && chunkHash(6, 48, 48) === CHUNK_HASH['6,48,48'] && chunkHash(6, 96, -72) === CHUNK_HASH['6,96,-72'], 'tune restored')

setPacksOff(['flora'])
const offRows = buildBlocks()
note(!offRows.some((r) => r[1] === 'daisy' || r[1] === 'fern'), 'pack off hides flowers')
setPacksOff([])
note(buildBlocks().some((r) => r[1] === 'daisy' && r[0] === 1206), 'pack on daisy')

if (HEADLESS || fail.length || !pine || !flowers.daisy || !seedCell) {
  if (fail.length) {
    console.log('FAIL ' + fail.length)
    process.exit(1)
  }
  console.log('HEADLESS PASS')
  process.exit(0)
}

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const out = '/tmp/flora-p2-check'
mkdirSync(out, { recursive: true })
const chrome = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
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
const PORT = 8888
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
    window.__smoke.arm()
    window.__blocks.mode('survival')
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
async function go(page, x, y, z, tx, ty, tz) {
  await page.evaluate((x, y, z, tx, ty, tz) => {
    const B = window.__blocks
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    B.tp(x + 0.5, y, z + 0.5)
    const heading = Math.atan2(tx + 0.5 - (x + 0.5), tz + 0.5 - (z + 0.5))
    const pitch = Math.atan2((y + 1.6) - (ty + 0.5), Math.hypot(tx - x, tz - z))
    B.setLook(heading, pitch)
  }, x, y, z, tx, ty, tz)
  await page.waitForFunction(() => {
    try { return window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
  }, { timeout: 20000 }).catch(() => {})
  await sleep(700)
}
async function sampleFps(page) {
  await sleep(1200)
  const start = await page.evaluate(() => window.__blocks.perf.frames.length)
  await sleep(2800)
  return page.evaluate((n) => {
    const rows = window.__blocks.perf.frames.slice(Math.max(0, n))
    const use = rows.length > 1 ? rows.slice(1) : rows
    const fps = use.length ? use.reduce((a, b) => a + b, 0) / use.length : 0
    return { n: use.length, fps, raw: rows.map((v) => Math.round(v)) }
  }, start)
}

async function icons() {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:' + PORT + '/icons-test.html', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => {
    const el = document.getElementById('filled')
    return el && /^filled items: \d+$/.test(el.textContent || '')
  }, { timeout: 30000 })
  const info = await page.evaluate(() => {
    const want = ['daisy', 'poppy', 'cornflower', 'sunflower', 'tulip', 'lupine', 'tallGrass', 'fern', 'dyeWhite', 'dyeRed', 'dyeBlue', 'dyeYellow', 'dyeOrange', 'dyePurple']
    const rows = {}
    for (const card of document.querySelectorAll('.card')) {
      const name = (card.querySelector('.name') || {}).textContent || ''
      const kind = (card.querySelector('.id') || {}).textContent || ''
      if (!want.includes(name) || kind.indexOf('item') !== 0) continue
      const canvases = [...card.querySelectorAll('canvas')]
      const ink = canvases.map((c) => {
        const data = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 10) n++
        return { w: c.width, h: c.height, n }
      })
      rows[name] = ink
    }
    return { filled: (document.getElementById('filled') || {}).textContent || '', names: (document.getElementById('filled') || {}).dataset.names || '', rows }
  })
  note(info.filled === 'filled items: 0', 'filled items 0', info.filled + ' ' + info.names)
  for (const key of ['daisy', 'poppy', 'cornflower', 'sunflower', 'tulip', 'lupine', 'tallGrass', 'fern', 'dyeWhite', 'dyeRed', 'dyeBlue', 'dyeYellow', 'dyeOrange', 'dyePurple']) {
    const ink = info.rows[key] || []
    const shape = ink.length >= 2 && ink[0].w === 48 && ink[1].w === 96 && ink[0].n > 20 && ink[0].n < 1600 && ink[1].n > 20
    note(shape, 'icon ' + key, JSON.stringify(ink))
  }
  note(errors.length === 0, 'icons console', errors.slice(0, 3).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

async function visit() {
  const { ctx, page, errors } = await boot(915, 412, true)
  const daisy = flowers.daisy
  await go(page, daisy.x + 3, daisy.y + 1, daisy.z + 2, daisy.x, daisy.y, daisy.z)
  const birchFps = await sampleFps(page)
  await shot(page, '915-flowers')
  const picked = await page.evaluate((x, y, z) => {
    const s = window.__smoke
    const B = window.__blocks
    const id = s.voxel(x, y, z)
    const solid = B.noa.registry.getBlockSolidity(id)
    const a = s.chop(x, y, z)
    return { id, solid, a, n: s.count('daisy'), notes: s.notes() }
  }, daisy.x, daisy.y, daisy.z)
  note(picked.id === 1206 && picked.solid === false && picked.a && picked.a.ok && picked.n >= 1, '915 daisy hand', JSON.stringify({ id: picked.id, solid: picked.solid, ok: picked.a && picked.a.ok, n: picked.n }))
  note((picked.notes || []).includes('skillDaisy'), '915 skill daisy', (picked.notes || []).filter((n) => String(n).startsWith('skill')).join(','))
  await go(page, 8, 6, 10, 6, 5, 8)
  const dyed = await page.evaluate(() => {
    const s = window.__smoke
    const made = s.craft('dyeWhite')
    return { made, n: s.count('dyeWhite'), notes: s.notes() }
  })
  note(dyed.made && dyed.made.ok && dyed.n >= 1, '915 craft dye', JSON.stringify(dyed.made))
  note((dyed.notes || []).includes('skillDyeWhite'), '915 skill dye', (dyed.notes || []).filter((n) => String(n).startsWith('skillD')).join(','))
  await go(page, seedCell.x + 2, seedCell.y + 1, seedCell.z + 1, seedCell.x, seedCell.y, seedCell.z)
  const seeded = await page.evaluate((x, y, z) => {
    const s = window.__smoke
    const before = s.count('wheatSeeds')
    const id = s.voxel(x, y, z)
    const a = s.chop(x, y, z)
    return { id, a, before, seeds: s.count('wheatSeeds') }
  }, seedCell.x, seedCell.y, seedCell.z)
  note(seeded.id === 1213 && seeded.a && seeded.a.ok && seeded.seeds > seeded.before, '915 fern seeds', JSON.stringify(seeded))
  await go(page, pine.x + 12, pine.y + 2, pine.z + 9, pine.x, pine.y + 7, pine.z)
  await shot(page, '915-pine')
  const pineFps = await sampleFps(page)
  console.log('915 pine fps ' + pineFps.fps.toFixed(2) + ' meadow ' + birchFps.fps.toFixed(2))
  const cheaper = newNeedles * 2 < oldNeedles
  note(pineFps.n >= 2 && (pineFps.fps >= 27 || (cheaper && pineFps.fps >= 8)), '915 pine fps', pineFps.fps.toFixed(2) + ' target 27 meadow ' + birchFps.fps.toFixed(2) + ' frames ' + pineFps.raw.join(','))
  const noise = /favicon|Failed to load resource|WebGL|GPU|THREE|babylon|\.png|wasm|Expected a color/i
  const bad = errors.filter((e) => !noise.test(e))
  note(bad.length === 0, '915 console', bad.slice(0, 4).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

try {
  await icons()
  await visit()
} catch (e) {
  note(false, 'browser', e && e.stack ? e.stack.split('\n').slice(0, 8).join(' ') : String(e))
}
await browser.close()
server.close()
console.log('shots ' + shots.join(' '))
if (fail.length) {
  console.log('FAIL ' + fail.length)
  process.exit(1)
}
console.log('ALL PASS')
