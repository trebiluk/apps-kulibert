// Hand is really on screen, swings while you dig, and touch starts up close.
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const out = '/tmp/hands-check'
mkdirSync(out, { recursive: true })
const chrome = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found.'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' }
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
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(8879, '127.0.0.1', r))

const PY = `
import sys
from PIL import Image
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB')
w, h = a.size
side = sys.argv[3]
x0 = 0 if side == 'left' else w // 2
x1 = w // 2 if side == 'left' else w
y0 = h // 2
pa, pb = a.load(), b.load()
diff = 0
total = 0
for y in range(y0, h):
    for x in range(x0, x1):
        total += 1
        if pa[x, y] != pb[x, y]:
            diff += 1
print(diff, total, (diff / total) if total else 0)
`

function quarterDiff(fileA, fileB, side) {
  const r = spawnSync('python3', ['-c', PY, fileA, fileB, side], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'diff failed')
  const parts = r.stdout.trim().split(/\s+/).map(Number)
  return { diff: parts[0], total: parts[1], ratio: parts[2] }
}

const CORNER = `
import sys
from PIL import Image
from collections import deque
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB')
w, h = a.size
x0, y0 = w // 2, h // 2
pa, pb = a.load(), b.load()
diff = total = 0
pts = []
for y in range(y0, h):
    for x in range(x0, w):
        total += 1
        if pa[x, y] != pb[x, y]:
            diff += 1
            pts.append((x, y))
box = clear = 0
aspect = 1
if pts:
    seen = set()
    best = []
    S = set(pts)
    for p in pts:
        if p in seen: continue
        q = deque([p])
        seen.add(p)
        comp = [p]
        while q:
            x, y = q.popleft()
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                n = (x + dx, y + dy)
                if n in S and n not in seen:
                    seen.add(n)
                    q.append(n)
                    comp.append(n)
        if len(comp) > len(best): best = comp
    xs = [p[0] for p in best]
    ys = [p[1] for p in best]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    bw, bh = maxx - minx + 1, maxy - miny + 1
    aspect = bw / bh if bh else 1
    for y in range(miny, maxy + 1):
        for x in range(minx, maxx + 1):
            box += 1
            if pa[x, y] == pb[x, y]:
                clear += 1
print(diff / total if total else 0, clear / box if box else 0, diff, total, box, aspect)
`

function cornerDiff(fileA, fileB) {
  const r = spawnSync('python3', ['-c', CORNER, fileA, fileB], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'corner diff failed')
  const parts = r.stdout.trim().split(/\s+/).map(Number)
  return { ratio: parts[0], holes: parts[1], diff: parts[2], total: parts[3], box: parts[4], aspect: parts[5] }
}

async function waitMesh(page, name) {
  await page.waitForFunction((meshName) => {
    const meshes = window.__blocks.noa.rendering.scene.meshes
    return meshes.some((m) => m.name === meshName && m.isEnabled())
  }, { timeout: 8000 }, name)
}

async function emptyHand(page) {
  await page.evaluate(() => {
    const B = window.__blocks
    B.lookHand({ show: true, side: 'right', cam: 'close' })
    B.noa.camera.zoomDistance = 0
    B.noa.setPaused(false)
    document.body.classList.remove('menu-open', 'photo')
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    const rc = document.getElementById('rules-card')
    if (rc) rc.hidden = true
    window.__smoke.emptyBag()
    window.__smoke.arm()
  })
  try {
    await page.waitForFunction(() => {
      const h = window.__blocks.hand()
      return h && h.visible && !h.key
    }, { timeout: 8000 })
  } catch (e) {
    const info = await page.evaluate(() => {
      const B = window.__blocks
      return {
        hand: B.hand(),
        zoom: B.noa.camera.zoomDistance,
        cls: document.body.className,
        sheet: !!(document.getElementById('sheet') && !document.getElementById('sheet').hidden),
        card: !!(document.getElementById('rules-card') && !document.getElementById('rules-card').hidden),
        bread: window.__smoke.count('bread'),
        planks: window.__smoke.count('planks'),
      }
    })
    throw new Error('empty hand did not settle ' + JSON.stringify(info))
  }
  await settle(page)
}

async function proveHeld(page, tag) {
  await emptyHand(page)
  const bare = await shot(page, tag + '-bare')
  await selectItem(page, 'planks', 0, 'block:planks')
  await waitMesh(page, 'hand-b-10')
  await settle(page)
  const block = await shot(page, tag + '-block-corner')
  const blockDiff = cornerDiff(block, bare)
  note(tag + ' held block corner', blockDiff.ratio > 0.02, (blockDiff.ratio * 100).toFixed(2) + '% holes ' + (blockDiff.holes * 100).toFixed(0) + '%')
  const tools = [
    ['woodTool', 'flat:woodTool', 'pickaxe'],
    ['stoneTool', 'flat:stoneTool', 'stone pickaxe'],
    ['hoe', 'flat:hoe', 'hoe'],
    ['bread', 'flat:bread', 'bread'],
    ['handSaw', 'flat:handSaw', 'saw'],
  ]
  for (const [item, key, label] of tools) {
    await selectItem(page, item, 0, key)
    await waitMesh(page, 'hand-i-' + item)
    await settle(page)
    const file = await shot(page, tag + '-' + item + '-corner')
    const diff = cornerDiff(file, bare)
    note(tag + ' ' + label + ' corner', diff.ratio > 0.02, (diff.ratio * 100).toFixed(2) + '%')
    const shaped = diff.holes > 0.3 || diff.aspect >= 1.6 || diff.aspect <= 0.62
    note(tag + ' ' + label + ' not a square', shaped, 'clear ' + (diff.holes * 100).toFixed(1) + '% of ' + diff.box + ' aspect ' + diff.aspect.toFixed(2))
  }
}

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

const report = { steps: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 400) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 220) : ''))
  if (!ok && !report.fail) report.fail = name
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot(w, h, touch) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.setViewport({ width: w, height: h, isMobile: !!touch, hasTouch: !!touch, deviceScaleFactor: 1 })
  const q = touch ? '&touch=1' : ''
  await page.goto('http://127.0.0.1:8879/?q=lite&smoke=1' + q, { waitUntil: 'domcontentloaded', timeout: 90000 })
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
  })
  await sleep(250)
  return { ctx, page, errors }
}

async function shot(page, name) {
  const file = path.join(out, name + '.png')
  await page.screenshot({ path: file })
  return file
}

async function settle(page) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  await sleep(60)
}

async function stage(page) {
  await page.evaluate(() => {
    const B = window.__blocks
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    body.gravityMultiplier = 0
    body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
    B.tp(8.5, 8, 1.5)
    B.setLook(0, 0)
    for (let x = 6; x <= 11; x++) {
      for (let y = 7; y <= 12; y++) {
        for (let z = 2; z <= 7; z++) B.setVoxel(x, y, z, 0)
      }
    }
    for (let x = 7; x <= 10; x++) {
      for (let y = 8; y <= 11; y++) B.setVoxel(x, y, 4, 2)
    }
    B.mode('survival')
    window.__smoke.emptyBag()
    window.__smoke.arm()
    B.lookHand({ show: true, side: 'right', cam: 'close' })
    B.noa.setPaused(false)
    document.body.classList.remove('menu-open')
  })
  await settle(page)
}

async function selectItem(page, item, slot, key) {
  await page.evaluate((item, slot) => {
    window.__blocks.lookHand({ show: true, cam: 'close' })
    window.__blocks.noa.setPaused(false)
    document.body.classList.remove('menu-open')
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    window.__smoke.emptyBag()
    window.__blocks.give(item, item === 'planks' ? 8 : 1)
    window.__smoke.key(slot)
    window.__smoke.arm()
  }, item, slot)
  await page.waitForFunction((key) => {
    const h = window.__blocks.hand()
    return h && h.visible && h.key === key && h.tris === 108
  }, { timeout: 8000 }, key)
  await settle(page)
}

async function sampleFps(page) {
  const start = await page.evaluate(() => window.__blocks.perf.frames.length)
  await sleep(4000)
  return page.evaluate((n) => {
    const rows = window.__blocks.perf.frames.slice(n)
    const fps = rows.length ? rows.reduce((a, b) => a + b, 0) / rows.length : 0
    return { n: rows.length, fps }
  }, start)
}

const desk = await boot(1366, 768, false)
await stage(desk.page)

const held = [
  ['woodTool', 0, 'flat:woodTool'],
  ['planks', 0, 'block:planks'],
  ['bread', 0, 'flat:bread'],
]
let offShot = ''
for (const [item, slot, key] of held) {
  await selectItem(desk.page, item, slot, key)
  const onFile = await shot(desk.page, 'desk-' + item + '-on')
  await desk.page.evaluate(() => window.__blocks.lookHand({ show: false }))
  await desk.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
  await settle(desk.page)
  offShot = await shot(desk.page, 'desk-' + item + '-off')
  const d = quarterDiff(onFile, offShot, 'right')
  note('desk ' + key + ' pixels', d.ratio > 0.02, (d.ratio * 100).toFixed(2) + '% ' + d.diff + '/' + d.total)
  await desk.page.evaluate(() => window.__blocks.lookHand({ show: true }))
  await settle(desk.page)
}
await proveHeld(desk.page, 'desk')

await desk.page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'left', cam: 'close' }))
await desk.page.waitForFunction(() => {
  const h = window.__blocks.hand()
  return h && h.visible && h.side === 'left'
})
await settle(desk.page)
const leftOn = await shot(desk.page, 'desk-left-on')
await desk.page.evaluate(() => window.__blocks.lookHand({ show: false }))
await desk.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
await settle(desk.page)
const leftOff = await shot(desk.page, 'desk-left-off')
const leftDiff = quarterDiff(leftOn, leftOff, 'left')
note('desk left pixels', leftDiff.ratio > 0.02, (leftDiff.ratio * 100).toFixed(2) + '% ' + leftDiff.diff + '/' + leftDiff.total)

const aimed = await desk.page.evaluate(() => {
  const B = window.__blocks
  B.lookHand({ show: true, side: 'right', cam: 'close' })
  window.__smoke.emptyBag()
  window.__smoke.arm()
  B.noa.setPaused(false)
  document.body.classList.remove('menu-open')
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  const p = window.__smoke.pos()
  const cam = B.noa.camera
  const h = cam.heading
  B.setLook(h, 0)
  const dirx = Math.sin(h)
  const dirz = Math.cos(h)
  const eyeY = Math.floor(p[1] + 1.62)
  const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
  body.velocity[0] = body.velocity[1] = body.velocity[2] = 0
  for (let t = 1; t <= 3; t++) {
    const x = Math.floor(p[0] + dirx * t)
    const z = Math.floor(p[2] + dirz * t)
    if (t !== 2) B.setVoxel(x, eyeY, z, 0)
    B.setVoxel(x, eyeY + 1, z, 0)
  }
  const x = Math.floor(p[0] + dirx * 2)
  const z = Math.floor(p[2] + dirz * 2)
  B.setVoxel(x, eyeY, z, 2)
  const bx = Math.floor(p[0] + dirx * 3)
  const bz = Math.floor(p[2] + dirz * 3)
  B.setVoxel(bx, eyeY, bz, 3)
  return { x, y: eyeY, z, h, pos: p }
})
await desk.page.waitForFunction(() => {
  const a = window.__smoke.aim()
  return a && a.id === 2
}, { timeout: 8000 }).catch(() => {})
const dirtReady = await desk.page.evaluate(() => {
  const a = window.__smoke.aim()
  return a && a.id === 2 ? a : null
})
note('dirt aim', !!dirtReady, JSON.stringify(dirtReady || aimed))
const beforeSwing = await desk.page.evaluate(() => window.__blocks.hand().swingCount)
const point = await desk.page.evaluate(() => {
  const c = document.querySelector('#stage canvas')
  const r = c.getBoundingClientRect()
  const x = Math.round(r.left + r.width / 2)
  const y = Math.round(r.top + r.height * 0.42)
  const el = document.elementFromPoint(x, y)
  return { x, y, tag: el && el.tagName, id: el && el.id, canvas: el === c }
})
await desk.page.mouse.move(point.x, point.y)
await desk.page.evaluate(() => window.__smoke.arm())
await desk.page.mouse.down({ button: 'left' })
await sleep(1000)
await desk.page.mouse.up({ button: 'left' })
await sleep(150)
const afterSwing = await desk.page.evaluate(() => {
  const h = window.__blocks.hand()
  return { swing: h.swingCount, aim: window.__smoke.aim(), zoom: window.__blocks.noa.camera.zoomDistance }
})
note('dirt hold swings', !!dirtReady && afterSwing.swing - beforeSwing >= 3, 'delta ' + (afterSwing.swing - beforeSwing) + ' aim ' + JSON.stringify(afterSwing.aim) + ' hit ' + JSON.stringify(point))

const placeBefore = afterSwing.swing
await desk.page.evaluate((spot) => {
  const B = window.__blocks
  window.__smoke.emptyBag()
  B.give('planks', 8)
  window.__smoke.key(0)
  window.__smoke.arm()
  B.noa.setPaused(false)
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  if (spot) {
    B.setLook(spot.h, 0)
    B.setVoxel(spot.x, spot.y, spot.z, 2)
  }
}, aimed)
await desk.page.waitForFunction(() => {
  const a = window.__smoke.aim()
  return a && a.id === 2
}, { timeout: 4000 }).catch(() => {})
await sleep(300)
await desk.page.mouse.click(point.x, point.y, { button: 'right' })
await sleep(250)
const placed = await desk.page.evaluate(() => {
  const h = window.__blocks.hand()
  return { swing: h.swingCount, aim: window.__smoke.aim(), held: window.__smoke.count('planks') }
})
note('right-click place swing', placed.swing - placeBefore >= 1, 'delta ' + (placed.swing - placeBefore) + ' planks ' + placed.held + ' aim ' + JSON.stringify(placed.aim))

await desk.page.evaluate(() => {
  window.__blocks.lookHand({ show: true, cam: 'close', side: 'right' })
  window.__smoke.emptyBag()
  window.__blocks.noa.setPaused(false)
  document.body.classList.remove('menu-open')
})
await desk.page.waitForFunction(() => {
  const h = window.__blocks.hand()
  return window.__blocks.noa.camera.zoomDistance === 0 && h && h.visible
}, { timeout: 4000 })
await sleep(1200)
const fpsOn = await sampleFps(desk.page)
await desk.page.evaluate(() => window.__blocks.lookHand({ show: false }))
await desk.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
await sleep(300)
const fpsOff = await sampleFps(desk.page)
const cost1366 = fpsOff.fps - fpsOn.fps
note('fps 1366', fpsOn.n >= 3 && fpsOff.n >= 3 && cost1366 <= 2, 'on ' + fpsOn.fps.toFixed(2) + ' (' + fpsOn.n + ') off ' + fpsOff.fps.toFixed(2) + ' (' + fpsOff.n + ') cost ' + cost1366.toFixed(2))

await desk.page.evaluate(() => {
  window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
  window.__blocks.panel('inventory')
})
await desk.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
await settle(desk.page)
const panelOn = await shot(desk.page, 'desk-panel-on')
await desk.page.evaluate(() => window.__blocks.lookHand({ show: false }))
await settle(desk.page)
const panelOff = await shot(desk.page, 'desk-panel-off')
const panelDiff = quarterDiff(panelOn, panelOff, 'right')
note('panel hides hand', panelDiff.ratio < 0.02, (panelDiff.ratio * 100).toFixed(2) + '%')

await desk.page.evaluate(() => {
  window.__blocks.panel('')
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  window.__blocks.noa.setPaused(false)
  window.__blocks.lookHand({ show: true, cam: 'behind', side: 'right' })
})
await desk.page.waitForFunction(() => window.__blocks.noa.camera.zoomDistance > 3.5 && window.__blocks.hand() && window.__blocks.hand().visible === false, { timeout: 4000 })
await sleep(700)
await desk.page.evaluate(() => window.__blocks.noa.setPaused(true))
await settle(desk.page)
const behindOn = await shot(desk.page, 'desk-behind-on')
await desk.page.evaluate(() => window.__blocks.lookHand({ show: false }))
await settle(desk.page)
const behindOff = await shot(desk.page, 'desk-behind-off')
const behindDiff = quarterDiff(behindOn, behindOff, 'right')
const behindZoom = await desk.page.evaluate(() => window.__blocks.noa.camera.zoomDistance)
note('behind hides hand', behindDiff.ratio < 0.02 && behindZoom > 0.5, (behindDiff.ratio * 100).toFixed(2) + '% zoom ' + behindZoom)

note('desk console', desk.errors.length === 0, desk.errors.slice(0, 3).join(' | '))
await desk.ctx.close()

const phone = await boot(915, 412, true)
const zoomBoot = await phone.page.evaluate(() => window.__blocks.noa.camera.zoomDistance)
note('touch boots close', zoomBoot === 0, 'zoom ' + zoomBoot)
await stage(phone.page)
for (const [item, slot, key] of held) {
  await selectItem(phone.page, item, slot, key)
  const onFile = await shot(phone.page, 'phone-' + item + '-on')
  await phone.page.evaluate(() => window.__blocks.lookHand({ show: false }))
  await phone.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
  await settle(phone.page)
  const offFile = await shot(phone.page, 'phone-' + item + '-off')
  const d = quarterDiff(onFile, offFile, 'right')
  note('touch ' + key + ' pixels', d.ratio > 0.02, (d.ratio * 100).toFixed(2) + '% ' + d.diff + '/' + d.total)
  await phone.page.evaluate(() => window.__blocks.lookHand({ show: true, cam: 'close' }))
  await settle(phone.page)
}
await proveHeld(phone.page, 'touch')
const phoneZoom = await phone.page.evaluate(() => window.__blocks.noa.camera.zoomDistance)
const phoneHand = await phone.page.evaluate(() => window.__blocks.hand())
note('touch hand visible', phoneZoom === 0 && phoneHand && phoneHand.visible, 'zoom ' + phoneZoom + ' ' + JSON.stringify(phoneHand))
await phone.page.evaluate(() => {
  window.__blocks.lookHand({ show: true, cam: 'close' })
  window.__smoke.emptyBag()
})
await phone.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === true)
await sleep(2500)
const phoneOn = await sampleFps(phone.page)
await phone.page.evaluate(() => window.__blocks.lookHand({ show: false }))
await phone.page.waitForFunction(() => window.__blocks.hand() && window.__blocks.hand().visible === false)
await sleep(1000)
const phoneOff = await sampleFps(phone.page)
const cost915 = phoneOff.fps - phoneOn.fps
note('fps 915', phoneOn.n >= 2 && phoneOff.n >= 2 && cost915 <= 2, 'on ' + phoneOn.fps.toFixed(2) + ' (' + phoneOn.n + ') off ' + phoneOff.fps.toFixed(2) + ' (' + phoneOff.n + ') cost ' + cost915.toFixed(2))
note('touch console', phone.errors.length === 0, phone.errors.slice(0, 3).join(' | '))

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))
if (report.fail) process.exit(1)
