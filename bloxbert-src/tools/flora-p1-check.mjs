// Flora P1. Gen 2–6 stay byte-identical. Gen 7 grows birch and pine.
import { createHash } from 'crypto'
import { existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import puppeteer from 'puppeteer-core'
import path from 'path'
import { fileURLToPath } from 'url'
import { genBlock, genColumns, groundAt, spawnGround } from '../src/worldgen.js'
import { make } from '../src/craft.js'
import { RECIPES } from '../src/data/recipes.js'
import { BLOCKS, buildBlocks } from '../src/data/blocks-list.js'
import { setPacksOff } from '../src/packs/registry.js'
import { migrateVoxels, resetUnknown, isMissingId } from '../src/save/migrate.js'
import { FLORA_IDS, FLORA_BAND } from '../src/packs/flora/pack.js'

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
  '6,0,0': '15abb81d4974292096210e290481396324dbfdb427cce5c441628b133095f385',
  '6,96,-72': 'b5666783c988cd4e529873cf67b802a8107de28387b6e5f5746ef492708d87a7',
  '6,48,48': 'b9a409ecf9acd0c3f00b40fa140876b62afe49a8d022f1a7c5169d2e231211ef',
  '6,-48,72': '0b08acf83ec933f8f902f57ca258ec497662aefdb8cc1ad95ef38fa7fea7a23c',
  '6,120,24': '7dc0d5319a914b714bdb0e338a5686a088b4fb3ad8c9c29047240104e8957a40',
  '6,-72,96': '606ccf63546a52db45194cf2f6161347df959c6a369aab67929f875b747f4381',
  '6,72,-48': 'b29171097da4b92bfacdd8e9e792d39b0c045291d9de3adc53888bef87308b90',
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

note(gen4Sample() === GEN4_SAMPLE, 'gen4 sample', gen4Sample().slice(0, 12))
note(genSampleHash(3, 96, 48, 144, 96) === GEN3_SAMPLE, 'gen3 sample')
for (const [k, want] of Object.entries(CHUNK_HASH)) {
  const [g, x, z] = k.split(',').map(Number)
  const got = chunkHash(g, x, z)
  note(got === want, 'chunk g' + g + ' ' + x + ',' + z, got === want ? got.slice(0, 12) : got)
}

const ids = Object.fromEntries(BLOCKS.map((b) => [b[1], b[0]]))
note(FLORA_BAND[0] === 1200 && FLORA_BAND[1] === 1299, 'flora band', FLORA_BAND.join('-'))
note(ids.birchLog === FLORA_IDS.birchLog && ids.birchLog === 1200, 'birchLog id', String(ids.birchLog))
note(ids.birchLeaves === 1201 && ids.birchPlanks === 1202, 'birch ids')
note(ids.pineLog === 1203 && ids.pineNeedles === 1204 && ids.pinePlanks === 1205, 'pine ids')

let birch = null
let pine = null
let zone = 0
for (let ix = -25; ix <= 25; ix++) {
  for (let iz = -25; iz <= 25; iz++) {
    const spots = [[ix * 10 + 2, iz * 10 + 6, 'birchLog'], [ix * 12 + 8, iz * 12 + 3, 'pineLog']]
    for (const [x, z, kind] of spots) {
      const d = Math.hypot(x - 8.5, z - 1.5)
      if (d > 210) continue
      for (let y = 2; y <= 22; y++) {
        const name = genBlock(x, y, z, 7) || ''
        if (name !== kind) continue
        if (d <= 48) zone++
        if (d <= 200) {
          if (kind === 'birchLog' && (!birch || d < birch.d)) birch = { x, y, z, d }
          if (kind === 'pineLog' && (!pine || d < pine.d)) pine = { x, y, z, d }
        }
        break
      }
    }
  }
}
note(!!birch && birch.d <= 200, 'birch within 200', birch ? JSON.stringify(birch) : 'none')
note(!!pine && pine.d <= 200, 'pine within 200', pine ? JSON.stringify(pine) : 'none')
note(zone === 0, '48 zone clear', String(zone))
let oak = ''
for (let y = 2; y <= 14 && !oak; y++) oak = genBlock(-1, y, -19, 7) === 'log' ? 'log' : ''
note(oak === 'log' && genBlock(-1, 6, -19, 6) === genBlock(-1, 6, -19, 7), 'old oak stays')

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
const door = RECIPES.find((r) => r.id === 'door')
const bench = RECIPES.find((r) => r.id === 'workbench')
const birchRecipe = RECIPES.find((r) => r.id === 'birchPlanks')
note(!!door && door.in[0][0] === 'plankAny' && door.in[0][1] === 6, 'door plankAny')
note(!!bench && bench.in[0][0] === 'plankAny' && bench.in[0][1] === 4, 'workbench plankAny')
note(!!birchRecipe && birchRecipe.at === 'bench' && birchRecipe.out[0] === 'birchPlanks' && birchRecipe.out[1] === 4, 'birch planks recipe')
const doorBag = bagOf({ birchPlanks: 6 })
const madeDoor = make(door, doorBag, 0)
note(!!madeDoor && doorBag.count('door') === 1 && doorBag.count('birchPlanks') === 0, 'birch door', String(doorBag.count('door')))
const benchBag = bagOf({ birchPlanks: 4 })
const madeBench = make(bench, benchBag, 0)
note(!!madeBench && benchBag.count('workbench') === 1, 'birch workbench')
const oakBag = bagOf({ planks: 4 })
note(!!make(bench, oakBag, 0) && oakBag.count('workbench') === 1, 'oak planks still craft')

const onMap = Object.fromEntries(BLOCKS.filter((b) => b[1] !== 'missing').map((b) => [b[1], b[0]]))
resetUnknown()
const offMap = { ...onMap }
for (const key of ['birchLog', 'birchLeaves', 'birchPlanks', 'pineLog', 'pineNeedles', 'pinePlanks']) delete offMap[key]
const gone = migrateVoxels(['air', 'birchLog', 'pineLog'], Uint16Array.from([1, 2]), offMap)
note(isMissingId(gone.data[0]) && isMissingId(gone.data[1]) && gone.data[0] !== 1200, 'pack off placeholder', String(gone.data[0]))
resetUnknown()
const back = migrateVoxels(['air', 'birchLog', 'pineLog'], Uint16Array.from([1, 2]), onMap)
note(back.data[0] === 1200 && back.data[1] === 1203, 'pack on restored', back.data.join(','))
setPacksOff(['flora'])
const offRows = buildBlocks()
note(!offRows.some((r) => r[1] === 'birchLog' || r[1] === 'pineLog'), 'pack off block list')
setPacksOff([])
const onRows = buildBlocks()
note(onRows.some((r) => r[1] === 'birchLog' && r[0] === 1200), 'pack on block list')

if (HEADLESS || fail.length || !birch || !pine) {
  if (fail.length) {
    console.log('FAIL ' + fail.length)
    process.exit(1)
  }
  console.log('HEADLESS PASS')
  process.exit(0)
}

function openStand(tx, ty, tz) {
  let best = null
  for (let ang = 0; ang < 8; ang++) {
    const a = ang * Math.PI / 4
    const x = Math.round(tx + Math.sin(a) * 8)
    const z = Math.round(tz + Math.cos(a) * 8)
    let air = 0
    for (let dy = 0; dy <= 6; dy++) if (!genBlock(x, ty + dy, z, 7, fade12, null)) air++
    let blocked = false
    for (let i = 1; i < 8; i++) {
      const t = i / 8
      const bx = Math.round(x + (tx - x) * t)
      const by = Math.round(ty + 2 + t * 2)
      const bz = Math.round(z + (tz - z) * t)
      if (Math.abs(bx - tx) <= 1 && Math.abs(bz - tz) <= 1) continue
      const name = genBlock(bx, by, bz, 7, fade12, null)
      if (name === 'log' || name === 'leaves') blocked = true
    }
    const score = air + (blocked ? 0 : 12)
    if (!best || score > best.score) best = { x, y: ty + 1, z, air, score }
  }
  return best
}
const birchStand = openStand(birch.x, birch.y, birch.z)
const pineStand = openStand(pine.x, pine.y, pine.z)

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const out = '/tmp/flora-p1-check'
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
const PORT = 8886
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
    const pitch = -0.28
    B.setLook(heading, pitch)
  }, x, y, z, tx, ty, tz)
  await page.waitForFunction(() => {
    try { return window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
  }, { timeout: 20000 }).catch(() => {})
  await sleep(700)
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
    const want = ['birchLog', 'birchLeaves', 'birchPlanks', 'pineLog', 'pineNeedles', 'pinePlanks', 'pinecone']
    const rows = {}
    for (const card of document.querySelectorAll('.card')) {
      const name = (card.querySelector('.name') || {}).textContent || ''
      if (!want.includes(name)) continue
      const canvases = [...card.querySelectorAll('canvas')]
      const ink = canvases.map((c) => {
        const data = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, c.width, c.height).data
        let n = 0
        for (let i = 3; i < data.length; i += 4) if (data[i] > 10) n++
        return { w: c.width, h: c.height, n }
      })
      rows[name] = ink
    }
    return {
      filled: (document.getElementById('filled') || {}).textContent || '',
      names: (document.getElementById('filled') || {}).dataset.names || '',
      rows,
    }
  })
  note(info.filled === 'filled items: 0', 'filled items 0', info.filled + ' ' + info.names)
  for (const key of ['birchLog', 'birchLeaves', 'birchPlanks', 'pineLog', 'pineNeedles', 'pinePlanks', 'pinecone']) {
    const ink = info.rows[key] || []
    const ok = ink.length >= 2 && ink[0].w === 48 && ink[1].w === 96 && ink[0].n > 0 && ink[1].n > 0
    note(ok, 'icon ' + key, JSON.stringify(ink))
  }
  note(errors.length === 0, 'icons console', errors.slice(0, 3).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

async function visit(tag, w, h, touch) {
  const { ctx, page, errors } = await boot(w, h, touch)
  await go(page, birchStand.x, birchStand.y, birchStand.z, birch.x, birch.y + 3, birch.z)
  const choppedB = await page.evaluate((x, y, z) => {
    const s = window.__smoke
    const first = s.chop(x, y, z)
    return { first, logs: s.count('birchLog') }
  }, birch.x, birch.y, birch.z)
  await shot(page, tag + '-birch')
  const restB = await page.evaluate((x, y, z) => {
    const s = window.__smoke
    const chops = [s.chop(x, y + 1, z), s.chop(x, y + 2, z)]
    return { chops, logs: s.count('birchLog'), notes: s.notes() }
  }, birch.x, birch.y, birch.z)
  note(choppedB.logs >= 1 && restB.logs >= 3, tag + ' chop birch', JSON.stringify({ first: choppedB.first, rest: restB }))
  await go(page, pineStand.x, pineStand.y + 1, pineStand.z, pine.x, pine.y + 5, pine.z)
  const choppedP = await page.evaluate((x, y, z) => {
    const a = window.__smoke.chop(x, y, z)
    return { a, logs: window.__smoke.count('pineLog'), notes: window.__smoke.notes() }
  }, pine.x, pine.y, pine.z)
  await shot(page, tag + '-pine')
  note(choppedP.logs >= 1, tag + ' chop pine', JSON.stringify(choppedP))
  await go(page, 8, 6, 10, 6, 5, 8)
  const crafted = await page.evaluate(() => {
    const s = window.__smoke
    const one = s.craft('birchPlanks')
    const two = s.craft('birchPlanks')
    const three = s.craft('birchPlanks')
    const pine = s.craft('pinePlanks')
    const bench = s.craft('workbench')
    const door = s.craft('door')
    return {
      one, two, pine, bench, door,
      planks: s.count('birchPlanks'),
      pinePlanks: s.count('pinePlanks'),
      workbench: s.count('workbench'),
      doorN: s.count('door'),
      notes: s.notes(),
    }
  })
  await shot(page, tag + '-craft')
  note(crafted.door && crafted.door.ok && crafted.doorN >= 1, tag + ' craft door', JSON.stringify(crafted))
  note(crafted.bench && crafted.bench.ok && crafted.workbench >= 1, tag + ' craft bench', JSON.stringify({ bench: crafted.bench, workbench: crafted.workbench }))
  note(crafted.pine && crafted.pine.ok && crafted.pinePlanks >= 4, tag + ' craft pine planks', JSON.stringify(crafted.pine))
  const notes = crafted.notes || []
  note(notes.includes('skillBirchLog') && notes.includes('skillPineLog'), tag + ' skill notes', notes.filter((n) => String(n).startsWith('skill')).join(','))
  const noise = /favicon|Failed to load resource|WebGL|GPU|THREE|babylon|\.png|wasm|Expected a color/i
  const bad = errors.filter((e) => !noise.test(e))
  note(bad.length === 0, tag + ' console', bad.slice(0, 4).join(' | ') || 'clean')
  await page.close()
  await ctx.close()
}

try {
  await icons()
  await visit('1366', 1366, 768, false)
  await visit('915', 915, 412, true)
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
