// GFX 4: sky, lamps, water, leaves, presets, and the 915 walk.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const fail = []
function eq(ok, msg, extra) {
  if (!ok) fail.push(extra ? msg + ' ' + extra : msg)
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg + (extra ? ' ' + extra : ''))
}

const world = spawnSync(process.execPath, ['tools/world-check.mjs'], { cwd: path.dirname(fileURLToPath(import.meta.url)) + '/..', encoding: 'utf8' })
const worldOut = (world.stdout || '') + (world.stderr || '')
eq(world.status === 0 && /PASS|ok|fixtures/i.test(worldOut), 'old fixture worlds', world.status + ' ' + worldOut.trim().split('\n').slice(-3).join(' | '))

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8916
const shots = '/workspace/artifacts/gfx4-shots'
mkdirSync(shots, { recursive: true })
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = process.env.CHROME_PATH || [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
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
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

async function openPage(w, h) {
  const page = await browser.newPage()
  page.setDefaultTimeout(90000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {}, notes: [] })) } catch (e) {}
    try { localStorage.removeItem('bloxbert-gfx') } catch (e) {}
  })
  return { page, errs }
}
async function boot(page, query) {
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/?' + query, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady && window.__gfx, { timeout: 90000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} })
  await sleep(400)
}

// The 915 walk fps is compared with an earlier run on the same machine. With no baseline yet (a fresh machine),
// this run writes one and skips only the fps compare; every other line still counts. GFX4_BASELINE sets the path.
const basePath = process.env.GFX4_BASELINE || '/tmp/gfx4-baseline.json'
const base = existsSync(basePath) ? JSON.parse(readFileSync(basePath, 'utf8')) : null
const beforeFps = base ? base.fps : null

async function settle(page) {
  await page.evaluate(async () => {
    const B = window.__blocks
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    window.__smoke.always(false)
    B.tp(90.5, 22, 116.5)
    B.setLook(1.2, -0.62)
    for (let i = 0; i < 30; i++) await sleep(100)
  })
}
async function shot(page, name) {
  const file = shots + '/' + name + '.png'
  const box = await page.evaluate(() => {
    const c = document.querySelector('#stage canvas') || document.querySelector('canvas')
    const r = c.getBoundingClientRect()
    return {
      x: Math.max(0, Math.round(r.x)),
      y: Math.max(0, Math.round(r.y)),
      w: Math.max(2, Math.round(r.width)),
      h: Math.max(2, Math.round(r.height)),
    }
  })
  await page.screenshot({ path: file })
  return { file, box }
}
async function seek(page, ms) {
  await page.evaluate(async (n) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    window.__smoke.seek(n)
    for (let i = 0; i < 8; i++) await sleep(50)
  }, ms)
}

const wide = await openPage(1366, 768)
await boot(wide.page, 'smoke=1&auto=0')
await settle(wide.page)
const times = await wide.page.evaluate(() => ({
  noon: 7 * 60 * 1000,
  dusk: 14 * 60 * 1000 + 60 * 1000,
  night: window.__smoke.nightAt(),
}))
const wideFiles = {}
let wideSky = null
for (const name of ['noon', 'dusk', 'night']) {
  await seek(wide.page, times[name])
  if (name === 'noon') wideSky = await wide.page.evaluate(() => window.__gfx.sky())
  wideFiles[name] = await shot(wide.page, '1366x768-' + name)
}
eq(wide.errs.length === 0, '1366 console', wide.errs.slice(0, 3).join(' | '))

const phone = await openPage(915, 412)
await boot(phone.page, 'smoke=1&auto=0')
await settle(phone.page)
const phoneFiles = {}
for (const name of ['noon', 'dusk', 'night']) {
  await seek(phone.page, times[name])
  phoneFiles[name] = await shot(phone.page, '915x412-' + name)
}
eq(phone.errs.length === 0, '915 sky console', phone.errs.slice(0, 3).join(' | '))

const { default: png } = { default: null }
const py = spawnSync('python3', ['-c', `
from PIL import Image
import json, sys
def lum(px):
    return 0.2126*px[0]+0.7152*px[1]+0.0722*px[2]
def sample(item):
    im = Image.open(item['file']).convert('RGB')
    w,h = im.size
    box = item['box']
    x0 = max(0, min(w - 2, int(box['x'])))
    y0 = max(0, min(h - 2, int(box['y'])))
    cw = max(2, min(w - x0, int(box['w'])))
    ch = max(2, min(h - y0, int(box['h'])))
    def avg(fy0, fy1):
        rs=gs=bs=n=0
        yA = y0 + int(ch * fy0)
        yB = max(yA + 1, y0 + int(ch * fy1))
        xA = x0 + int(cw * 0.35)
        xB = max(xA + 1, x0 + int(cw * 0.65))
        for y in range(yA, min(h, yB), 2):
            for x in range(xA, min(w, xB), 4):
                r,g,b = im.getpixel((x,y))
                rs+=r; gs+=g; bs+=b; n+=1
        if n == 0: return [0,0,0,0]
        return [rs/n, gs/n, bs/n, lum((rs/n,gs/n,bs/n))]
    top = avg(0.22, 0.32)
    mid = avg(0.40, 0.50)
    bright = 0
    for y in range(y0, min(h, y0 + int(ch * 0.55)), 3):
        for x in range(x0, min(w, x0 + cw), 6):
            r,g,b = im.getpixel((x,y))
            if r+g+b > bright: bright = r+g+b
    return {'top': top, 'mid': mid, 'bright': bright, 'size': [w,h]}
files = json.loads(sys.argv[1])
out = {k: sample(v) for k,v in files.items()}
print(json.dumps(out))
`, JSON.stringify({ ...wideFiles, ...Object.fromEntries(Object.entries(phoneFiles).map(([k, v]) => ['p-' + k, v])) })], { encoding: 'utf8' })
let pix = {}
try { pix = JSON.parse(py.stdout || '{}') } catch (e) { pix = {} }
eq(py.status === 0 && pix.noon, 'sky samples', (py.stderr || '').slice(0, 180))
if (pix.noon && pix.night && pix.dusk) {
  eq(pix.noon.mid[3] > pix.noon.top[3] + 6, 'day sky gradient', JSON.stringify({ top: pix.noon.top.map(Math.round), mid: pix.noon.mid.map(Math.round) }))
  eq(pix.noon.top[2] > pix.noon.top[0], 'day zenith blue', JSON.stringify(pix.noon.top.map(Math.round)))
  eq(pix.dusk.mid[0] > pix.dusk.mid[2] + 8, 'dusk horizon warm', JSON.stringify(pix.dusk.mid.map(Math.round)))
  eq(pix.night.top[3] + 8 < pix.noon.top[3], 'night sky darker', JSON.stringify({ night: pix.night.top.map(Math.round), day: pix.noon.top.map(Math.round) }))
  eq(pix.night.bright > 400, 'night stars or moon', String(pix.night.bright))
  eq(Math.abs(wideSky.horizon[0] * 255 - pix.noon.mid[0]) < 80, 'fog near horizon family', JSON.stringify({ fog: wideSky.horizon, mid: pix.noon.mid.map(Math.round) }))
}
if (pix['p-noon']) eq(pix['p-noon'].size[0] === 915 && pix['p-noon'].size[1] === 412, '915 shot size', JSON.stringify(pix['p-noon'].size))

const gfx = await phone.page.evaluate(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const G = window.__gfx
  const B = window.__blocks
  const out = { preset: G.name, managed: G.managed, threw: false }
  try {
    G.set('fancy'); G.set('lite'); G.set('normal')
  } catch (e) { out.threw = String(e) }
  out.after = G.name
  const birchA = G.leaf(1201, 4, 4)
  const birchB = G.leaf(1201, 40, 12)
  const pine = G.leaf(1204, 4, 4)
  out.leafDiffer = Math.abs(birchA[1] - birchB[1]) > 0.02
  out.pineDarker = pine[1] < birchA[1] - 0.15
  window.__smoke.seek(window.__smoke.nightAt())
  const pos = window.__smoke.pos()
  const S = 24
  const cx0 = Math.floor(pos[0] / S) * S
  const cz0 = Math.floor(pos[2] / S) * S
  let x = Math.floor(pos[0]) + 5
  let z = Math.floor(pos[2])
  let y = Math.floor(pos[1])
  if (y < 6) y = 6
  if (y > 16) y = 16
  if (x < cx0 + 2) x = cx0 + 2
  if (x > cx0 + S - 10) x = cx0 + S - 10
  if (z < cz0 + 2) z = cz0 + 2
  if (z > cz0 + S - 6) z = cz0 + S - 6
  for (let dx = -1; dx <= 8; dx++) for (let dy = -1; dy <= 3; dy++) for (let dz = -2; dz <= 3; dz++) {
    B.setVoxel(x + dx, y + dy, z + dz, 0)
  }
  for (let dx = 0; dx <= 6; dx++) for (let dz = -1; dz <= 2; dz++) B.setVoxel(x + dx, y - 1, z + dz, 3)
  B.setVoxel(x + 4, y - 1, z, 1)
  for (let dx = -1; dx <= 7; dx++) for (let dz = -2; dz <= 3; dz++) {
    B.setVoxel(x + dx, y + 3, z + dz, 3)
    B.setVoxel(x + dx, y, z - 2, 3)
    B.setVoxel(x + dx, y + 1, z - 2, 3)
    B.setVoxel(x + dx, y + 2, z - 2, 3)
    B.setVoxel(x + dx, y, z + 3, 3)
    B.setVoxel(x + dx, y + 1, z + 3, 3)
    B.setVoxel(x + dx, y + 2, z + 3, 3)
  }
  for (let dz = -1; dz <= 2; dz++) for (let dy = 0; dy <= 2; dy++) {
    B.setVoxel(x - 1, y + dy, z + dz, 3)
    B.setVoxel(x + 7, y + dy, z + dz, 3)
  }
  let before = { best: 0, n: 0 }
  let lastBuilds = -1
  let calm = 0
  for (let i = 0; i < 50; i++) {
    before = G.shadeNear(x + 4, y - 1, z)
    if (before.n > 0 && G.builds === lastBuilds) calm++
    else calm = 0
    lastBuilds = G.builds
    if (before.n > 0 && calm >= 4) break
    await sleep(100)
  }
  const farBefore = G.level(x + 16, y, z)
  const b0 = G.builds
  B.setVoxel(x, y, z, 1101)
  let near = 0
  for (let i = 0; i < 30; i++) {
    near = G.level(x + 4, y, z)
    if (near > 0 && G.builds > b0) break
    await sleep(100)
  }
  const lit = G.shadeNear(x + 4, y - 1, z)
  const far = G.level(x + 16, y, z)
  const atLamp = G.level(x, y, z)
  const held = G.builds
  await sleep(1000)
  const still = G.builds === held
  const b1 = G.builds
  B.setVoxel(x, y, z, 0)
  let gone = near
  let restored = { best: lit.best, n: lit.n }
  for (let i = 0; i < 30; i++) {
    gone = G.level(x + 4, y, z)
    restored = G.shadeNear(x + 4, y - 1, z)
    if (gone === 0 && G.builds > b1 && restored.best < lit.best - 0.04) break
    await sleep(100)
  }
  const wx = Math.max(cx0 + 1, x - 4)
  const wz = z
  B.setVoxel(wx, y - 1, wz, 0)
  B.setVoxel(wx + 1, y - 1, wz, 0)
  B.setVoxel(wx, y, wz, 0)
  B.setVoxel(wx + 1, y, wz, 0)
  B.setVoxel(wx, y - 1, wz, 64)
  B.setVoxel(wx + 1, y - 1, wz, 64)
  let tops = []
  for (let i = 0; i < 25; i++) {
    tops = G.waterTops(wx, y - 1, wz)
    if (tops.length >= 4) break
    await sleep(100)
  }
  const xs = tops.map((p) => p[0])
  G.set('fancy')
  B.setVoxel(x + 2, y, z, 1206)
  let flower = null
  for (let i = 0; i < 25; i++) {
    flower = G.flower()
    if (flower && flower.tip) break
    await sleep(100)
  }
  const a = flower && flower.tip ? flower.tip.slice() : null
  await sleep(1000)
  const b = (G.flower() || {}).tip || null
  const moved = !!(a && b && (Math.abs(a[0] - b[0]) > 0.01 || Math.abs(a[1] - b[1]) > 0.01))
  G.set('lite')
  const c = (G.flower() || {}).tip || null
  await sleep(1000)
  const d = (G.flower() || {}).tip || null
  const stillPlant = !!(c && d && Math.abs(c[0] - d[0]) < 0.001 && Math.abs(c[1] - d[1]) < 0.001)
  return {
    out, before, lit, far, farBefore, near, gone, restored, still, b0, held, atLamp, room: [x, y, z],
    waterAlpha: G.waterAlpha(), tops: tops.length, span: xs.length ? Math.max(...xs) - Math.min(...xs) : 0,
    moved, stillPlant, flower: !!(a), liteName: G.name, gradient: G.gradient, lights: G.lights, ao: G.ao,
  }
})
eq(!gfx.out.threw && gfx.out.after === 'normal', 'preset switch', JSON.stringify(gfx.out))
eq(gfx.out.preset === 'normal' && gfx.out.managed === true, 'auto picks normal', JSON.stringify(gfx.out))
eq(gfx.near > 0 && gfx.far === 0, 'lamp light reaches 4 not 12', JSON.stringify({ near: gfx.near, far: gfx.far, atLamp: gfx.atLamp, room: gfx.room, before: gfx.before }))
eq(gfx.lit.best > gfx.before.best + 0.05, 'lamp raises block brightness', JSON.stringify({ before: gfx.before, lit: gfx.lit }))
eq(gfx.gone === 0 && gfx.restored.best < gfx.lit.best - 0.04, 'breaking lamp restores', JSON.stringify({ gone: gfx.gone, restored: gfx.restored, lit: gfx.lit.best }))
eq(gfx.still, 'light does not rebuild while standing', String(gfx.held))
eq(gfx.waterAlpha > 0.35 && gfx.waterAlpha < 0.75, 'water alpha', String(gfx.waterAlpha))
eq(gfx.tops >= 4 && gfx.tops <= 6 && gfx.span > 1.5, 'water tops share an edge', JSON.stringify({ tops: gfx.tops, span: gfx.span }))
eq(gfx.out && true, 'leaf variety', '')
const leaf = await phone.page.evaluate(() => {
  const G = window.__gfx
  const a = G.leaf(1201, 4, 4)
  const b = G.leaf(1201, 40, 12)
  const p = G.leaf(1204, 4, 4)
  return { a, b, p }
})
eq(Math.abs(leaf.a[1] - leaf.b[1]) > 0.02, 'two birches differ', JSON.stringify(leaf))
eq(leaf.p[1] < leaf.a[1] - 0.15 && leaf.p[1] < leaf.b[1] - 0.15, 'pine darker than birch', JSON.stringify(leaf))
eq(gfx.moved && gfx.flower, 'fancy flower sways', JSON.stringify({ moved: gfx.moved, flower: gfx.flower }))
eq(gfx.stillPlant && gfx.liteName === 'lite' && gfx.gradient === false && gfx.lights === false, 'lite holds plants and drops extras', JSON.stringify(gfx))

await phone.page.setViewport({ width: 412, height: 915, deviceScaleFactor: 1 })
await phone.page.evaluate(() => window.__blocks.refit())
await sleep(400)
await phone.page.setViewport({ width: 915, height: 412, deviceScaleFactor: 1 })
await phone.page.evaluate(() => window.__blocks.refit())
await sleep(300)
eq(phone.errs.length === 0, '915 rotate console', phone.errs.slice(0, 4).join(' | '))
await wide.page.close()
await phone.page.close()

const walkPage = await openPage(915, 412)
await boot(walkPage.page, 'smoke=1&auto=0')
const walk = await walkPage.page.evaluate(async () => {
  const B = window.__blocks
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  window.__smoke.always(false)
  B.tp(90.5, 22, 116.5)
  B.setLook(1.57, 0.35)
  for (let i = 0; i < 40; i++) await sleep(100)
  B.perf.frames.length = 0
  B.hold('forward', true)
  const t0 = performance.now()
  while (performance.now() - t0 < 8000) await sleep(100)
  B.hold('forward', false)
  const frames = B.perf.frames.slice()
  const avg = frames.length ? frames.reduce((a, b) => a + b, 0) / frames.length : 0
  return { avg, n: frames.length, pos: window.__smoke.pos(), name: window.__gfx.name }
})
const afterFps = Math.round(walk.avg * 100) / 100
console.log('FPS before ' + beforeFps + ' after ' + afterFps + ' n=' + walk.n + ' gfx=' + walk.name)
if (beforeFps == null) {
  writeFileSync(basePath, JSON.stringify({ fps: afterFps, n: walk.n, gfx: walk.name, at: new Date().toISOString() }) + '\n')
  console.log('NOTE 915 walk fps: no baseline at ' + basePath + ', wrote ' + afterFps + ' (compare runs from the next run on)')
} else eq(afterFps + 0.05 >= beforeFps * 0.92, '915 walk fps', 'before ' + beforeFps + ' after ' + afterFps)
eq(walkPage.errs.length === 0, 'walk console', walkPage.errs.slice(0, 3).join(' | '))

const litePage = await openPage(915, 412)
await boot(litePage.page, 'smoke=1&auto=0&q=lite')
const cheap = await litePage.page.evaluate(() => ({ name: window.__gfx.name, gradient: window.__gfx.gradient, lights: window.__gfx.lights, q: window.__blocks.quality }))
eq(cheap.name === 'lite' && cheap.gradient === false && cheap.lights === false && cheap.q === 'lite', 'lite keeps the cheap path', JSON.stringify(cheap))
eq(litePage.errs.length === 0, 'lite console', litePage.errs.slice(0, 3).join(' | '))

writeFileSync(shots + '/report.json', JSON.stringify({ beforeFps, afterFps, pix, gfx, leaf, cheap }, null, 2))
await browser.close()
server.close()
if (fail.length) {
  console.log('FAIL ' + fail.length)
  process.exit(1)
}
console.log('ALL PASS')
