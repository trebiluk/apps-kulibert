// HUD clicks, tips, lamp, rug, held block, and Jump II. Real mouse, not element.click().
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
const out = '/tmp/polish-check'
mkdirSync(out, { recursive: true })
const chrome = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found.'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.woff2': 'font/woff2' }
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
await new Promise((r) => server.listen(8883, '127.0.0.1', r))

const CORNER = `
import sys
from PIL import Image
a = Image.open(sys.argv[1]).convert('RGB')
b = Image.open(sys.argv[2]).convert('RGB')
w, h = a.size
x0, y0 = w // 2, h // 2
pa, pb = a.load(), b.load()
diff = total = 0
for y in range(y0, h):
    for x in range(x0, w):
        total += 1
        if pa[x, y] != pb[x, y]:
            diff += 1
print(diff / total if total else 0, diff, total)
`

const LAMP = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size
px = im.load()
pts = []
for y in range(h // 6, 5 * h // 6):
    for x in range(w // 6, 5 * w // 6):
        r, g, b = px[x, y]
        if r > 190 and g > 120 and r > b + 40:
            pts.append((x, y))
if not pts:
    print(0, 0, 0, 0)
else:
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    bw = max(xs) - min(xs) + 1
    bh = max(ys) - min(ys) + 1
    aspect = bw / bh if bh else 99
    print(len(pts), bw, bh, aspect)
`

const RUG = `
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGB')
w, h = im.size
px = im.load()
vals = []
for y in range(int(h * 0.35), int(h * 0.92)):
    for x in range(int(w * 0.15), int(w * 0.85)):
        r, g, b = px[x, y]
        if 18 < r < 170 and r > g + 6 and g >= b and b < 90 and g < 120:
            vals.append(r)
if len(vals) < 8:
    print(len(vals), 0)
else:
    mean = sum(vals) / len(vals)
    var = sum((v - mean) ** 2 for v in vals) / len(vals)
    print(len(vals), var ** 0.5)
`

function py(script, args) {
  const r = spawnSync('python3', ['-c', script, ...args], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr || r.stdout || 'py failed')
  return r.stdout.trim().split(/\s+/).map(Number)
}

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const report = { steps: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 500) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 280) : ''))
  if (!ok && !report.fail) report.fail = name
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot(w, h) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errors = []
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  page.on('console', (m) => {
    if (m.type() !== 'error') return
    const t = m.text()
    if (/favicon|Failed to load resource|net::ERR/i.test(t)) return
    errors.push(t)
  })
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:8883/?q=lite&smoke=1', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 45000 })
  await page.waitForFunction(() => window.__blocks.noa.world.playerChunkLoaded, { timeout: 30000 }).catch(() => {})
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    const rc = document.getElementById('rules-card')
    if (rc) rc.hidden = true
    document.body.classList.remove('menu-open')
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    const shell = window.__blocks.noa.container && window.__blocks.noa.container._shell
    if (shell) shell.stickyPointerLock = false
    if (window.__quietUnlock) window.__quietUnlock()
    window.__smoke.arm()
    window.__smoke.close()
  })
  await sleep(200)
  return { ctx, page, errors }
}

async function shot(page, name) {
  const file = path.join(out, name + '.png')
  await page.screenshot({ path: file })
  return file
}

async function hitBox(page, sel) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const r = el.getBoundingClientRect()
    const x = Math.round(r.left + Math.min(r.width, 80) / 2)
    const y = Math.round(r.top + r.height / 2)
    const hit = document.elementFromPoint(x, y)
    const owner = hit && hit.closest ? hit.closest(sel) : null
    return { x, y, w: Math.round(r.width), h: Math.round(r.height), tag: hit && hit.tagName, id: hit && hit.id, ok: !!(owner || hit === el), hidden: !!el.hidden }
  }, sel)
}

async function mouseClick(page, sel) {
  const box = await hitBox(page, sel)
  if (!box || !box.ok) return box
  await page.evaluate(() => new Promise((resolve) => {
    const shell = window.__blocks.noa.container && window.__blocks.noa.container._shell
    if (shell) shell.stickyPointerLock = false
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    document.body.classList.remove('menu-open')
    if (window.__quietUnlock) window.__quietUnlock()
    if (!document.pointerLockElement) return resolve()
    const done = () => { document.removeEventListener('pointerlockchange', done); resolve() }
    document.addEventListener('pointerlockchange', done)
    setTimeout(resolve, 400)
  }))
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    document.body.classList.remove('menu-open')
    const shell = window.__blocks.noa.container && window.__blocks.noa.container._shell
    if (shell) shell.stickyPointerLock = false
  })
  await page.mouse.move(box.x, box.y)
  await page.mouse.click(box.x, box.y)
  return box
}

async function docSig(page) {
  return page.evaluate(async () => {
    const open = await new Promise((res, rej) => {
      const r = indexedDB.open('kuliblocks-test', 1)
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const text = await new Promise((res) => {
      try {
        const q = open.transaction('worlds').objectStore('worlds').get('bertyville-survival')
        q.onsuccess = () => {
          const doc = q.result
          if (!doc) return res('0')
          const s = JSON.stringify(doc)
          let h = 0
          for (let i = 0; i < s.length; i++) h = (h * 33 + s.charCodeAt(i)) | 0
          res(h + ':' + s.length)
        }
        q.onerror = () => res('err')
      } catch (e) { res('nostore') }
    })
    open.close()
    return text
  })
}

async function aimBlock(page) {
  return page.evaluate(() => {
    const B = window.__blocks
    const s = window.__smoke
    const p = s.pos()
    const h = B.noa.camera.heading
    B.setLook(h, 0)
    const dirx = Math.sin(h)
    const dirz = Math.cos(h)
    const y = Math.floor(p[1] + 1.4)
    const x = Math.floor(p[0] + dirx * 2)
    const z = Math.floor(p[2] + dirz * 2)
    s.plant(x, y, z, 2)
    s.plant(Math.floor(p[0] + dirx * 3), y, Math.floor(p[2] + dirz * 3), 0)
    return { x, y, z }
  })
}

async function wake(page) {
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    const rc = document.getElementById('rules-card')
    if (rc) rc.hidden = true
    document.body.classList.remove('menu-open')
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    if (window.__smoke) { window.__smoke.close(); window.__smoke.arm() }
  })
}

function chipText(page) {
  return page.evaluate(() => {
    const el = document.getElementById('path-chip')
    if (!el) return { hidden: true, text: '', fading: false }
    const op = parseFloat(getComputedStyle(el).opacity || '1')
    return { hidden: !!el.hidden, text: el.textContent || '', fading: el.classList.contains('path-out') || op < 0.85, out: el.classList.contains('path-out') }
  })
}

async function waitWorld(page, x, y, z, id, ms = 8000) {
  const t0 = Date.now()
  while (Date.now() - t0 < ms) {
    const got = await page.evaluate((x, y, z) => window.__smoke.world(x, y, z), x, y, z)
    if (got === id) return true
    await sleep(80)
  }
  return false
}

async function saveClick(page, tag) {
  await page.evaluate(() => {
    window.__smoke.arm()
    window.__blocks.noa.setPaused(false)
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    document.body.classList.remove('menu-open')
  })
  const spot = await aimBlock(page)
  await sleep(150)
  const beforeId = await page.evaluate((spot) => window.__smoke.voxel(spot.x, spot.y, spot.z), spot)
  await page.evaluate(() => window.__smoke.plant(180, 6, 180, 3))
  const beforeDoc = await docSig(page)
  const box = await mouseClick(page, '#save-btn')
  let toast = ''
  const t0 = Date.now()
  while (Date.now() - t0 < 8000) {
    toast = await page.evaluate(() => window.__smoke.toast())
    if (/Saved|Збережено|Сохранено|Guardado/.test(toast)) break
    await sleep(80)
  }
  const afterId = await page.evaluate((spot) => window.__smoke.voxel(spot.x, spot.y, spot.z), spot)
  const afterDoc = await docSig(page)
  const lock = await page.evaluate(() => document.pointerLockElement && document.pointerLockElement.id)
  note(tag + ' save hits the button', !!(box && box.ok), JSON.stringify(box))
  note(tag + ' save toast', /Saved|Збережено|Сохранено|Guardado/.test(toast) && !/Too far|далеко|lejos|بعيد/.test(toast), toast)
  note(tag + ' save doc changes', beforeDoc !== afterDoc && afterDoc !== '0' && afterDoc !== 'err', beforeDoc + ' -> ' + afterDoc)
  note(tag + ' aimed block unchanged', beforeId === afterId && afterId === 2, beforeId + ' -> ' + afterId)
  note(tag + ' no pointer lock', !lock, String(lock || ''))
  const slot = await mouseClick(page, '#hotbar .slot')
  const undo = await mouseClick(page, '#undo-btn')
  await sleep(200)
  const still = await page.evaluate((spot) => window.__smoke.voxel(spot.x, spot.y, spot.z), spot)
  note(tag + ' hotbar and undo do not break', still === 2 && !!(slot && slot.ok) && !!(undo && undo.ok), 'slot ' + JSON.stringify(slot) + ' undo ' + JSON.stringify(undo) + ' id ' + still)
}

const desk = await boot(1366, 768)
await saveClick(desk.page, '1366')

await desk.page.evaluate(() => localStorage.removeItem('bloxbert-learn'))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await desk.page.evaluate(() => {
  const rc = document.getElementById('rules-card')
  if (rc) rc.hidden = true
  window.__blocks.mode('survival')
  window.__smoke.emptyBag()
  window.__smoke.arm()
  try { window.__blocks.noa.setPaused(false) } catch (e) {}
})
await sleep(300)
let tip = await chipText(desk.page)
note('path tip shows chop', !tip.hidden && /Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(tip.text), tip.text.slice(0, 80))
await desk.page.evaluate(() => window.__blocks.give('log', 1))
await desk.page.waitForFunction(() => {
  const el = document.getElementById('path-chip')
  return el && !/Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(el.textContent || '')
}, { timeout: 4000 }).catch(() => {})
tip = await chipText(desk.page)
note('path tip hides after first log', !/Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(tip.text), tip.text.slice(0, 80))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await sleep(400)
tip = await chipText(desk.page)
note('path tip stays hidden after reload', !/Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(tip.text), tip.text.slice(0, 80))

await desk.page.evaluate(() => localStorage.removeItem('bloxbert-learn'))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await desk.page.evaluate(() => {
  const rc = document.getElementById('rules-card')
  if (rc) rc.hidden = true
  window.__blocks.mode('survival')
  window.__smoke.emptyBag()
  window.__smoke.arm()
  try { window.__blocks.noa.setPaused(false) } catch (e) {}
})
await sleep(300)
await wake(desk.page)
const pathBox = await mouseClick(desk.page, '#path-chip')
await sleep(200)
tip = await chipText(desk.page)
const nextTip = /Make a Wood Pickaxe|Зроби дерев|Сделай дерев|Haz un pico de madera|اصنع معول خشب|کلنگ چوبی بساز|Kora icyuma|መኮፍ ግበር/
note('path tip fades before the next', !!(pathBox && pathBox.ok) && !nextTip.test(tip.text) && (tip.fading || /Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(tip.text)), JSON.stringify(pathBox) + ' ' + tip.text.slice(0, 70))
await sleep(1900)
tip = await chipText(desk.page)
note('next tip shows after the wait', !tip.hidden && !tip.out && nextTip.test(tip.text), tip.text.slice(0, 80))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await sleep(300)
tip = await chipText(desk.page)
note('tapped tip stays hidden', !/Chop a tree|Зрубай дерево|Сруби дерево|Tala un árbol/.test(tip.text), tip.text.slice(0, 80))

await desk.page.evaluate(() => window.__blocks.panel('settings'))
await sleep(300)
await desk.page.evaluate(() => {
  const b = document.querySelector('#sheet [data-look="tips"]')
  if (b) b.scrollIntoView({ block: 'center', inline: 'nearest' })
})
await sleep(80)
const tipBtn = await desk.page.evaluate(() => {
  const b = document.querySelector('#sheet [data-look="tips"]')
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { x: Math.round(r.left + Math.min(r.width, 160) / 2), y: Math.round(r.top + r.height / 2), text: b.textContent || '', w: Math.round(r.width) }
})
if (tipBtn) await desk.page.mouse.click(tipBtn.x, tipBtn.y)
await sleep(200)
tip = await chipText(desk.page)
const tipsSaved = await desk.page.evaluate(() => {
  try { return !!JSON.parse(localStorage.getItem('bloxbert-learn') || '{}').hideTips } catch (e) { return false }
})
note('hide tips is saved', !!(tipBtn && tipBtn.w > 40 && /Hide tips|Сховати|Скрыть|Ocultar|أخف|پنهان|Hisha|ሕባእ/.test(tipBtn.text)) && tip.hidden && tipsSaved, JSON.stringify(tipBtn))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await sleep(300)
tip = await chipText(desk.page)
const tipsSaved2 = await desk.page.evaluate(() => {
  try { return !!JSON.parse(localStorage.getItem('bloxbert-learn') || '{}').hideTips } catch (e) { return false }
})
note('hide tips stays after reload', tip.hidden && tipsSaved2, tip.text.slice(0, 40))
await desk.page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('bloxbert-learn') || '{}')
  raw.tourDone = true
  raw.hideTips = false
  localStorage.setItem('bloxbert-learn', JSON.stringify(raw))
})
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await sleep(1200)
const tour = await desk.page.evaluate(() => {
  const sheet = document.getElementById('sheet')
  const rc = document.getElementById('rules-card')
  return {
    hidden: !sheet || !!sheet.hidden,
    panel: (sheet && sheet.dataset.panel) || '',
    rules: !!(rc && !rc.hidden),
  }
})
note('tour does not reopen on reload', !!(tour && tour.hidden && tour.panel !== 'tour'), JSON.stringify(tour))
await desk.page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem('bloxbert-learn') || '{}')
  raw.hideTips = false
  localStorage.setItem('bloxbert-learn', JSON.stringify(raw))
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
})

await desk.page.evaluate(() => {
  window.__smoke.stand(8.5, 8, 8.5, 0, 0)
  window.__smoke.arm()
})
await sleep(200)
let dig = await desk.page.evaluate(() => window.__smoke.townLock(6, 4, 8))
note('dig chip shows', !!(dig && dig.shown && /dig outside|копай|cava fuera|احفر خارج/.test(dig.text)), JSON.stringify(dig))
const digBox = await mouseClick(desk.page, '#dig-chip')
await sleep(100)
dig = await desk.page.evaluate(() => {
  const el = document.getElementById('dig-chip')
  return { shown: !!(el && !el.hidden) }
})
note('dig chip hides on tap', !!(digBox && digBox.ok) && !dig.shown, JSON.stringify(digBox))
await desk.page.evaluate(() => window.__smoke.stand(8.5, 8, 8.5, 0, 0))
await sleep(150)
dig = await desk.page.evaluate(() => window.__smoke.townLock(6, 5, 8))
await desk.page.evaluate(() => window.__smoke.stand(80, 12, 80, 0, 0))
await sleep(1200)
dig = await desk.page.evaluate(() => {
  const el = document.getElementById('dig-chip')
  return { shown: !!(el && !el.hidden), pos: window.__smoke.pos() }
})
note('dig chip hides outside town', !dig.shown, JSON.stringify(dig))
await desk.page.evaluate(() => window.__smoke.stand(8.5, 8, 8.5, 0, 0))
await sleep(250)
dig = await desk.page.evaluate(() => window.__smoke.townLock(8, 4, 6))
note('dig chip shows again', !!(dig && dig.shown), JSON.stringify(dig))
await sleep(8300)
dig = await desk.page.evaluate(() => {
  const el = document.getElementById('dig-chip')
  return { shown: !!(el && !el.hidden) }
})
note('dig chip hides after 8s', !dig.shown, JSON.stringify(dig))

await desk.page.evaluate(() => {
  const s = window.__smoke
  try { window.__blocks.noa.setPaused(false) } catch (e) {}
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  s.always(false)
  s.bright(false)
  s.seek(s.nightAt())
  const cells = [
    { side: 'S', x: 70, y: 8, z: 71, wx: 70, wy: 8, wz: 70 },
    { side: 'N', x: 74, y: 8, z: 73, wx: 74, wy: 8, wz: 74 },
    { side: 'E', x: 78, y: 8, z: 70, wx: 77, wy: 8, wz: 70 },
    { side: 'W', x: 82, y: 8, z: 70, wx: 83, wy: 8, wz: 70 },
  ]
  for (const c of cells) {
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 3; dy++) s.plant(c.x + dx, c.y + dy, c.z + dz, 0)
    s.plant(c.wx, c.wy, c.wz, 2)
    s.plant(c.x, c.y - 1, c.z, 2)
    s.setMeta(c.x + ',' + c.y + ',' + c.z, { kind: 'wallLamp', side: c.side })
    s.plant(c.x, c.y, c.z, 1103)
  }
  s.setMeta('68,8,72', { kind: 'rug', anchor: '68,8,72' })
  s.plant(68, 7, 72, 2)
  s.plant(69, 7, 72, 2)
  s.plant(68, 7, 73, 2)
  s.plant(69, 7, 73, 2)
  for (const [x, z] of [[68, 72], [69, 72], [68, 73], [69, 73]]) s.plant(x, 8, z, 0)
  s.plant(68, 8, 72, 1104)
  s.plant(69, 8, 72, 1105)
  s.plant(68, 8, 73, 1105)
  s.plant(69, 8, 73, 1105)
  s.stand(70.5, 8, 72.8, Math.PI, 0.62)
})
const lampLoaded = await waitWorld(desk.page, 70, 8, 71, 1103)
await desk.page.waitForFunction(() => {
  const lamp = window.__blocks.noa.rendering.scene.meshes.find((m) => m.name === 'wallLampOn')
  return !!(lamp && lamp.thinInstanceCount >= 4)
}, { timeout: 8000 }).catch(() => {})
await sleep(400)
const lamps = await desk.page.evaluate(() => {
  const s = window.__smoke
  const B = window.__blocks
  const cells = [
    { side: 'S', x: 70, y: 8, z: 71 },
    { side: 'N', x: 74, y: 8, z: 73 },
    { side: 'E', x: 78, y: 8, z: 70 },
    { side: 'W', x: 82, y: 8, z: 70 },
  ]
  const scene = B.noa.rendering.scene
  const lamp = scene.meshes.find((m) => m.name === 'wallLampOn')
  const rug = scene.meshes.find((m) => m.name === 'rug')
  const store = lamp && lamp._thinInstanceDataStorage
  if (store) store.worldMatrices = null
  const data = store && store.matrixData
  const n = lamp ? lamp.thinInstanceCount | 0 : 0
  const off = B.noa.worldOriginOffset || [0, 0, 0]
  const rows = []
  for (let i = 0; i < n && data; i++) {
    const o = i * 16
    rows.push({
      x: data[o + 12] + off[0],
      y: data[o + 13] + off[1],
      z: data[o + 14] + off[2],
      yaw: Math.atan2(data[o + 8], data[o]),
    })
  }
  const em = (mesh) => {
    const mat = mesh && mesh.material
    const subs = mat && mat.subMaterials
    if (!subs) return { multi: false, em: mat && mat.emissiveColor ? [mat.emissiveColor.r, mat.emissiveColor.g, mat.emissiveColor.b] : null }
    return {
      multi: true,
      em: subs.map((sub) => sub && sub.emissiveColor ? [+sub.emissiveColor.r.toFixed(3), +sub.emissiveColor.g.toFixed(3), +sub.emissiveColor.b.toFixed(3)] : null),
    }
  }
  let rugH = 0
  if (rug) {
    const bi = rug.getBoundingInfo()
    rugH = (bi.boundingBox.extendSize.y || 0) * 2
  }
  function ang(a, b) {
    let d = a - b
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    return Math.abs(d)
  }
  const want = { S: 0, N: Math.PI, E: Math.PI / 2, W: -Math.PI / 2 }
  const facing = {}
  for (const c of cells) {
    let best = null
    let bestD = 1e9
    for (const row of rows) {
      const d = (row.x - (c.x + 0.5)) ** 2 + (row.y - c.y) ** 2 + (row.z - (c.z + 0.5)) ** 2
      if (d < bestD) { bestD = d; best = row }
    }
    facing[c.side] = best ? { yaw: +best.yaw.toFixed(3), err: +ang(best.yaw, want[c.side]).toFixed(3), dist: +Math.sqrt(bestD).toFixed(2) } : null
  }
  s.stand(70.5, 8, 72.8, Math.PI, 0.62)
  return {
    phase: s.phase(),
    n: rows.length,
    off: [off[0], off[1], off[2]],
    rows: rows.map((r) => ({ x: +r.x.toFixed(1), y: +r.y.toFixed(1), z: +r.z.toFixed(1), yaw: +r.yaw.toFixed(3) })),
    loaded: s.world(70, 8, 71),
    facing,
    lamp: em(lamp),
    rug: em(rug),
    rugH,
    ids: cells.map((c) => s.voxel(c.x, c.y, c.z)),
  }
})
const faceOk = lamps && ['S', 'N', 'E', 'W'].every((side) => lamps.facing[side] && lamps.facing[side].err < 0.25 && lamps.facing[side].dist < 1.5)
note('wall lamp faces 4 walls', !!lampLoaded && faceOk && lamps.ids.every((id) => id === 1103), JSON.stringify({ n: lamps && lamps.n, off: lamps && lamps.off, rows: lamps && lamps.rows, facing: lamps && lamps.facing }))
const lampEm = lamps && lamps.lamp && lamps.lamp.em
const lampGlow = Array.isArray(lampEm) && lampEm.some((c) => c && c[0] > 0.7) && lampEm.some((c) => c && c[0] < 0.25)
note('only the shade glows', !!(lamps && lamps.lamp && lamps.lamp.multi && lampGlow), JSON.stringify(lamps && lamps.lamp))
await sleep(500)
const lampShot = await shot(desk.page, 'lamp-night')
const lampPx = py(LAMP, [lampShot])
note('night lamp is not a streak', lampPx[0] >= 40 && lampPx[3] > 0.35 && lampPx[3] < 3.2 && Math.min(lampPx[1], lampPx[2]) >= 10, lampPx.join(' '))
const rugEm = lamps && lamps.rug && lamps.rug.em
const rugOk = lamps && lamps.rug && lamps.rug.multi && lamps.rugH >= 0.045 && lamps.rugH <= 0.08 && Array.isArray(rugEm) && rugEm.every((c) => c && c[0] < 0.4) && rugEm.some((c) => c && c[0] > 0.05)
note('rug is a darker 2-tone', !!rugOk, JSON.stringify({ h: lamps && lamps.rugH, rug: lamps && lamps.rug }))
await desk.page.evaluate(() => window.__smoke.stand(68.8, 8.15, 73.4, Math.PI, 1.05))
await sleep(450)
const rugShot = await shot(desk.page, 'rug-night')
const rugPx = py(RUG, [rugShot])
note('rug visible at night', rugPx[0] >= 20, rugPx.join(' '))

await desk.page.evaluate(() => {
  const B = window.__blocks
  B.lookHand({ show: true, side: 'right', cam: 'close' })
  B.noa.camera.zoomDistance = 0
  B.noa.setPaused(false)
  document.body.classList.remove('menu-open', 'photo')
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  window.__smoke.emptyBag()
  window.__smoke.arm()
  window.__smoke.seek(1000)
})
await desk.page.waitForFunction(() => {
  const h = window.__blocks.hand()
  return h && h.visible && !h.key
}, { timeout: 8000 }).catch(() => {})
await sleep(250)
const bare = await shot(desk.page, 'hand-bare')
await desk.page.evaluate(() => {
  window.__blocks.give('planks', 4)
  window.__smoke.key(0)
  window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
  window.__blocks.noa.camera.zoomDistance = 0
})
await desk.page.waitForFunction(() => {
  const meshes = window.__blocks.noa.rendering.scene.meshes
  const h = window.__blocks.hand()
  return h && h.visible && h.key === 'block:planks' && meshes.some((m) => m.name === 'hand-b-10' && m.isEnabled())
}, { timeout: 8000 }).catch(() => {})
await sleep(250)
const held = await shot(desk.page, 'hand-block')
const corner = py(CORNER, [held, bare])
note('held block fits the hand', corner[0] > 0.008 && corner[0] < 0.25, (corner[0] * 100).toFixed(2) + '%')

const jump = await desk.page.evaluate(async () => {
  const B = window.__blocks
  const s = window.__smoke
  B.mode('survival')
  B.noa.setPaused(false)
  B.effects.clear('fly')
  B.effects.give('jump', { level: 2, ms: 180000 })
  for (let x = 40; x <= 49; x++) {
    for (let z = 40; z <= 54; z++) {
      for (let y = 3; y <= 18; y++) s.plant(x, y, z, 0)
      s.plant(x, 4, z, 2)
    }
  }
  for (let y = 5; y <= 10; y++) {
    for (let x = 40; x <= 49; x++) s.plant(x, y, 40, 2)
    for (let z = 40; z <= 54; z++) { s.plant(40, y, z, 2); s.plant(49, y, z, 2) }
  }
  for (let x = 41; x <= 48; x++) {
    s.plant(x, 5, 46, 2)
    s.plant(x, 6, 46, 2)
    s.plant(x, 7, 46, 2)
  }
  s.stand(44.5, 8, 44.4, 0, 0)
  B.hold('forward', false)
  B.hold('jump', false)
  const wait = async (ms) => {
    const t = performance.now()
    while (performance.now() - t < ms) await new Promise((r) => requestAnimationFrame(r))
  }
  let solid = 0
  const tLoad = performance.now()
  while (performance.now() - tLoad < 8000) {
    await new Promise((r) => requestAnimationFrame(r))
    solid = s.world(44, 5, 46)
    if (solid === 2 && s.world(44, 4, 44) === 2 && s.world(44, 12, 44) === 0 && s.grounded()) break
  }
  await wait(200)
  const y0 = s.pos()[1]
  B.hold('forward', true)
  await wait(180)
  B.hold('jump', true)
  let peak = s.pos()[1]
  const t = performance.now()
  while (performance.now() - t < 2400) {
    await new Promise((r) => requestAnimationFrame(r))
    const p = s.pos()
    if (p[1] > peak) peak = p[1]
  }
  const end = s.pos()
  B.hold('forward', false)
  B.hold('jump', false)
  return { y0, peak, dy: peak - y0, end, level: B.effects.level('jump'), solid, air: s.world(44, 12, 44), grounded: s.grounded() }
})
const cleared = jump && jump.end && jump.end[2] > 46.35 && jump.dy >= 3.2 && jump.dy < 4.2
note('Jump II clears a 3-block wall', !!cleared, JSON.stringify(jump))

await desk.page.evaluate(() => {
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  window.__smoke.emptyBag()
  window.__blocks.give('log', 3)
  window.__craftTrace = []
  window.__smoke.focus('planks')
})
await sleep(450)
async function dragCraft(page, item) {
  const spots = await page.evaluate((item) => {
    const bag = document.querySelector('#sheet .ks-bag .ks-slot[data-item="' + item + '"]')
    const well = document.querySelector('#sheet .ks-slot.ing')
    if (!bag || !well) return null
    const br = bag.getBoundingClientRect()
    const wr = well.getBoundingClientRect()
    return { bx: br.left + br.width / 2, by: br.top + br.height / 2, wx: wr.left + wr.width / 2, wy: wr.top + wr.height / 2, need: well.dataset.need || '' }
  }, item)
  if (!spots) return { ok: false, spots }
  await page.evaluate((spots) => {
    const bag = document.elementFromPoint(spots.bx, spots.by)
    const el = bag && bag.closest ? bag.closest('.ks-bag .ks-slot') : null
    if (!el) return
    const pid = 11
    const fire = (type, x, y, buttons) => el.dispatchEvent(new PointerEvent(type, {
      bubbles: true, cancelable: true, pointerId: pid, pointerType: 'mouse', clientX: x, clientY: y, button: 0, buttons,
    }))
    fire('pointerdown', spots.bx, spots.by, 1)
    for (let i = 1; i <= 10; i++) fire('pointermove', spots.bx + (spots.wx - spots.bx) * i / 10, spots.by + (spots.wy - spots.by) * i / 10, 1)
    fire('pointerup', spots.wx, spots.wy, 0)
  }, spots)
  return { ok: true, spots }
}
const logDrag = await dragCraft(desk.page, 'log')
await sleep(200)
await desk.page.evaluate(() => window.__blocks.give('dirt', 1))
await sleep(180)
const logCraft = await desk.page.evaluate(() => {
  const well = document.querySelector('#sheet .ks-slot.ing')
  const badge = well && well.querySelector('.ks-badge')
  const trace = window.__craftTrace || []
  return {
    badge: badge ? badge.textContent : '',
    logs: window.__smoke.count('log'),
    need: well ? well.dataset.need : '',
    returned: trace.some((r) => r.kind === 'return' && r.panel === 'crafting'),
    trace: trace.map((r) => r.kind + ':' + r.n).join(','),
  }
})
note('log stack stays on the tray', !!(logDrag && logDrag.ok && logCraft && logCraft.badge === '1/1' && logCraft.logs === 2 && !logCraft.returned), JSON.stringify({ logDrag, logCraft }))

await desk.page.evaluate(() => {
  window.__smoke.emptyBag()
  window.__blocks.give('planks', 3)
  window.__craftTrace = []
  window.__smoke.focus('workbench')
})
await sleep(450)
await desk.page.evaluate(() => {
  window.__craftTrace = []
  const book = document.querySelector('#sheet .book')
  if (book) book.dataset.live = '1'
})
const plankDrag = await dragCraft(desk.page, 'planks')
await sleep(220)
await desk.page.evaluate(() => window.__blocks.give('dirt', 1))
await sleep(200)
const craft = await desk.page.evaluate(() => {
  const well = document.querySelector('#sheet .ks-slot.ing')
  const badge = well && well.querySelector('.ks-badge')
  const book = document.querySelector('#sheet .book')
  const trace = window.__craftTrace || []
  return {
    badge: badge ? badge.textContent : '',
    live: !!(book && book.dataset.live === '1'),
    planks: window.__smoke.count('planks'),
    logs: window.__smoke.count('log'),
    trace: trace.map((r) => r.kind + ':' + r.n).join(','),
    returned: trace.some((r) => r.kind === 'return' && r.panel === 'crafting'),
  }
})
note('craft tray keeps 3', !!(plankDrag && plankDrag.ok && craft && craft.badge === '3/4' && craft.live && craft.planks === 0 && !craft.returned), JSON.stringify(craft))

const walk = await desk.page.evaluate(async () => {
  const B = window.__blocks
  const s = window.__smoke
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  B.noa.setPaused(false)
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))
  function clear(z1) {
    for (let x = 20; x <= 28; x++) for (let z = 10; z <= z1; z++) for (let y = 5; y <= 12; y++) s.plant(x, y, z, 0)
    for (let x = 20; x <= 28; x++) for (let z = 10; z <= z1; z++) s.plant(x, 4, z, 2)
  }
  async function run(step) {
    clear(36)
    if (step) for (let x = 20; x <= 28; x++) for (let z = 16; z <= 36; z++) s.plant(x, 5, z, 2)
    s.stand(24.5, 8, 13.2, 0, 0)
    const t0 = performance.now()
    while (performance.now() - t0 < 4000) {
      await new Promise((r) => requestAnimationFrame(r))
      if (s.world(24, 4, 13) === 2 && s.grounded()) break
    }
    await wait(180)
    const a = s.pos()
    B.hold('forward', true)
    await wait(1400)
    const b = s.pos()
    B.hold('forward', false)
    return { dz: +(b[2] - a[2]).toFixed(2), speed: +((b[2] - a[2]) / 1.4).toFixed(2), y0: +a[1].toFixed(2), y1: +b[1].toFixed(2), climb: B.climb }
  }
  const flat = await run(false)
  const step = await run(true)
  s.stand(140.5, 30, -50.5, 0, 0)
  const tLoad = performance.now()
  while (performance.now() - tLoad < 2500) {
    await new Promise((r) => requestAnimationFrame(r))
    if (s.world(140, 4, -50) || s.voxel(140, 8, -50)) break
  }
  function surface(x, z) {
    for (let y = 28; y >= 1; y--) {
      const id = s.voxel(x, y, z)
      if (id && id !== 12) return y
    }
    return 0
  }
  const dirs = [[0, 1, 0], [0, -1, Math.PI], [1, 0, Math.PI / 2], [-1, 0, -Math.PI / 2]]
  let rise = null
  for (let x = 128; x <= 164 && !rise; x++) {
    for (let z = -76; z <= -32 && !rise; z++) {
      const low = surface(x, z)
      if (low < 5) continue
      for (let d = 0; d < dirs.length; d++) {
        const dx = dirs[d][0], dz = dirs[d][1], heading = dirs[d][2]
        const hx = x + dx, hz = z + dz
        const high = surface(hx, hz)
        if (high !== low + 1) continue
        if (s.voxel(x, low + 1, z) || s.voxel(x, low + 2, z)) continue
        if (s.voxel(hx, high + 1, hz) || s.voxel(hx, high + 2, hz)) continue
        rise = { x, z, low, high, dx, dz, heading }
        break
      }
    }
  }
  let hill = { miss: true }
  if (rise) {
    s.stand(rise.x + 0.5, rise.low + 4, rise.z + 0.5, rise.heading, 0)
    const t1 = performance.now()
    while (performance.now() - t1 < 4000) {
      await new Promise((r) => requestAnimationFrame(r))
      const y = s.pos()[1]
      if (s.grounded() && s.world(rise.x, rise.low, rise.z) && y > rise.low + 0.4 && y < rise.low + 2.4) break
    }
    await wait(200)
    B.setLook(rise.heading, 0)
    const a = s.pos()
    let peak = a[1]
    B.hold('forward', true)
    const t2 = performance.now()
    while (performance.now() - t2 < 900) {
      await new Promise((r) => requestAnimationFrame(r))
      const y = s.pos()[1]
      if (y > peak) peak = y
    }
    const b = s.pos()
    B.hold('forward', false)
    hill = { dz: +(b[2] - a[2]).toFixed(2), dx: +(b[0] - a[0]).toFixed(2), speed: +(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.9).toFixed(2), y0: +a[1].toFixed(2), y1: +b[1].toFixed(2), peak: +peak.toFixed(2), rise: +(peak - a[1]).toFixed(2), low: rise.low, high: rise.high, x: rise.x, z: rise.z, heading: +rise.heading.toFixed(2) }
  }
  return { flat, step, hill }
})
const walkOk = walk && walk.flat.speed > 2.2 && walk.step.speed > 2 && walk.step.dz > walk.flat.dz * 0.65 && walk.step.y1 > walk.flat.y1 + 0.4
  && walk.hill && walk.hill.rise > 0.7 && walk.hill.rise < 1.8
note('walk speed flat and 1-block hill step', !!walkOk, JSON.stringify(walk))

const shop = await desk.page.evaluate(async () => {
  const B = window.__blocks
  const s = window.__smoke
  B.mode('survival')
  s.emptyBag()
  s.plant(24, 5, 14, 69)
  s.stand(24.5, 8, 16.4, Math.PI, 0)
  await new Promise((r) => setTimeout(r, 400))
  B.placeBlock({ position: [24, 5, 14], blockID: 69, normal: [0, 0, -1] })
  await new Promise((r) => setTimeout(r, 250))
  const read = () => [...document.querySelectorAll('#sheet .bed-card')].map((card) => {
    const btns = [...card.querySelectorAll('.bed-paths > button, .bed-paths > .keycap')]
    return {
      item: card.dataset.item || 'bed',
      labels: btns.map((b) => ((b.querySelector('.blab') || {}).textContent || '').trim()),
      icons: btns.filter((b) => b.querySelector('.bic svg')).length,
      tall: btns.filter((b) => b.getBoundingClientRect().height >= 44 && b.getBoundingClientRect().width >= 44).length,
      off: btns.filter((b) => b.disabled).length,
      why: btns.map((b) => b.title || ''),
    }
  })
  const closed = read()
  for (const id of ['safetyGlasses', 'measuringTape', 'handSaw', 'hammer', 'ironIngot', 'glass', 'stick']) B.give(id, 2)
  B.give('woolBlue', 8)
  B.give('woolRed', 4)
  for (const el of document.querySelectorAll('#sheet .wall-slot')) el.click()
  await new Promise((r) => setTimeout(r, 200))
  const hung = read()
  const design = document.querySelector('#sheet .decor-design-floorLamp')
  if (design) design.click()
  await new Promise((r) => setTimeout(r, 200))
  const teal = document.querySelector('#sheet .decor-card[data-item=floorLamp] [data-shade=Teal]')
  if (teal) teal.click()
  await new Promise((r) => setTimeout(r, 150))
  const measure = (document.querySelector('#sheet .decor-card[data-item=floorLamp] .decor-measure') || {}).textContent || ''
  const make = document.querySelector('#sheet .decor-card[data-item=floorLamp] .decor-make')
  if (make) make.click()
  await new Promise((r) => setTimeout(r, 250))
  const doc = await B.exportDoc()
  const held = doc && doc.meta && doc.meta['decor-held'] && doc.meta['decor-held'].list || []
  const lamp = held.filter((row) => row && row.item === 'floorLamp').pop()
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  try { B.noa.setPaused(false) } catch (e) {}
  const slot = (B.bag() || []).findIndex((row) => row && row.item === 'floorLamp')
  if (slot >= 0 && slot < 9) s.key(slot)
  s.plant(30, 4, 30, 2)
  s.stand(30.5, 7.2, 32.2, Math.PI, 0)
  await new Promise((r) => setTimeout(r, 300))
  B.placeBlock({ position: [30, 4, 30], normal: [0, 1, 0], blockID: 2 })
  await new Promise((r) => setTimeout(r, 450))
  const doc2 = await B.exportDoc()
  const cell = doc2 && doc2.meta && doc2.meta['30,5,30']
  const sc = B.noa.rendering.getScene()
  const tint = sc.meshes.find((m) => m.name && m.name.indexOf('decor-tint-') === 0 && m.isEnabled())
  const rgb = tint ? { r: +tint.material.emissiveColor.r.toFixed(2), g: +tint.material.emissiveColor.g.toFixed(2), b: +tint.material.emissiveColor.b.toFixed(2) } : null
  await B.save()
  return { closed, hung, measure, shade: lamp && lamp.design && lamp.design.shade, cell: cell && cell.design, rgb, voxel: s.world(30, 5, 30), slot }
})
const cardsOk = shop && shop.closed && shop.closed.length >= 4 && shop.closed.every((c) => c.labels.length >= 2 && c.labels.every((t) => t.length > 1) && c.icons >= 2 && c.tall >= 2 && c.off >= 2 && c.why.every((w) => /Hang 4 tools|tool/i.test(w)))
note('woodshop cards show two labelled buttons', !!cardsOk, JSON.stringify(shop && shop.closed))
const made = shop && shop.hung && shop.measure && shop.shade === 'Teal' && shop.cell && shop.cell.shade === 'Teal' && shop.rgb && shop.rgb.b > 0.5 && shop.rgb.r < 0.4 && shop.voxel === 1100
note('decor design stores the shade', !!made, JSON.stringify({ hung: shop && shop.hung, measure: shop && shop.measure, shade: shop && shop.shade, cell: shop && shop.cell, rgb: shop && shop.rgb, voxel: shop && shop.voxel }))
await desk.page.reload({ waitUntil: 'domcontentloaded' })
await desk.page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 })
await sleep(500)
const kept = await desk.page.evaluate(async () => {
  const B = window.__blocks
  const s = window.__smoke
  s.stand(30.5, 7.2, 32.2, Math.PI, 0)
  await new Promise((r) => setTimeout(r, 700))
  const doc = await B.exportDoc()
  const cell = doc && doc.meta && doc.meta['30,5,30']
  const sc = B.noa.rendering.getScene()
  const tint = sc.meshes.find((m) => m.name && m.name.indexOf('decor-tint-') === 0 && m.isEnabled())
  const rgb = tint ? { r: +tint.material.emissiveColor.r.toFixed(2), g: +tint.material.emissiveColor.g.toFixed(2), b: +tint.material.emissiveColor.b.toFixed(2) } : null
  return { shade: cell && cell.design && cell.design.shade, rgb, id: s.voxel(30, 5, 30), world: s.world(30, 5, 30) }
})
note('decor shade stays after reload', !!(kept && kept.shade === 'Teal' && kept.rgb && kept.rgb.b > 0.5 && kept.id === 1100), JSON.stringify(kept))

const hut = await desk.page.evaluate(async () => {
  const B = window.__blocks
  const s = window.__smoke
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  try { B.noa.setPaused(false) } catch (e) {}
  B.rules.set('survival.daynight', 'night')
  for (let x = 48; x <= 56; x++) for (let z = 48; z <= 56; z++) for (let y = 4; y <= 12; y++) s.plant(x, y, z, 0)
  for (let x = 50; x <= 54; x++) for (let z = 50; z <= 54; z++) {
    s.plant(x, 4, z, 10)
    s.plant(x, 8, z, 10)
    for (let y = 5; y <= 7; y++) if (x === 50 || x === 54 || z === 50 || z === 54) s.plant(x, y, z, 10)
  }
  s.stand(52.5, 7.2, 52.5, 0, 0)
  await new Promise((r) => setTimeout(r, 900))
  return { fps: s.fpsSpan(600) }
})
await desk.page.screenshot({ path: '/tmp/hut-dark.png', clip: { x: 430, y: 180, width: 500, height: 320 } })
await desk.page.evaluate(() => window.__smoke.plant(51, 5, 51, 1101))
await sleep(700)
await desk.page.screenshot({ path: '/tmp/hut-lit.png', clip: { x: 430, y: 180, width: 500, height: 320 } })
const hutLum = JSON.parse(await import('node:child_process').then(({ execFileSync }) => execFileSync('python3', ['-c', `
from PIL import Image
import json
def lum(p):
    im = Image.open(p).convert('RGB')
    px = list(im.getdata())
    acc = 0
    for r,g,b in px:
        acc += 0.2126*r + 0.7152*g + 0.0722*b
    return round(acc / max(1, len(px)), 1)
print(json.dumps({'dark': lum('/tmp/hut-dark.png'), 'lit': lum('/tmp/hut-lit.png')}))
`], { encoding: 'utf8' })))
await sleep(2200)
const fpsAfter = await desk.page.evaluate(() => window.__smoke.fpsSpan(600))
const hutOk = hutLum.dark >= 25 && hutLum.lit >= 60 && hutLum.lit > hutLum.dark + 10 && fpsAfter > 7
note('hut night luminance', !!hutOk, JSON.stringify({ ...hutLum, fps: hut && hut.fps, fpsAfter }))

function angGap(a, b) {
  let d = a - b
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return Math.abs(d)
}
async function dragLook(page, dy, kind) {
  const box = await page.evaluate(() => {
    const c = document.querySelector('#stage canvas') || document.querySelector('canvas')
    const r = c.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: Math.min(r.bottom - 40, Math.max(r.top + 40, r.top + r.height / 2)) }
  })
  const before = await page.evaluate(() => {
    const c = window.__blocks.noa.camera
    return { h: c.heading, p: c.pitch }
  })
  if (kind === 'touch') {
    await page.evaluate((box, dy) => {
      const c = document.querySelector('#stage canvas') || document.querySelector('canvas')
      const fire = (type, y, buttons) => c.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'touch', clientX: box.x, clientY: y, button: 0, buttons }))
      fire('pointerdown', box.y, 1)
      for (let i = 1; i <= 14; i++) fire('pointermove', box.y + dy * i / 14, 1)
      fire('pointerup', box.y + dy, 0)
    }, box, dy)
  } else {
    await page.mouse.move(box.x, box.y)
    await page.mouse.down()
    await page.mouse.move(box.x, box.y + dy, { steps: 16 })
    await page.mouse.up()
  }
  await sleep(40)
  const after = await page.evaluate(() => {
    const c = window.__blocks.noa.camera
    return { h: c.heading, p: c.pitch }
  })
  return { before, after, flip: angGap(before.h, after.h) > 1.2, pitch: after.p }
}
await desk.page.evaluate(() => {
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  window.__blocks.noa.setPaused(false)
  window.__blocks.setLook(0.6, 0)
})
await sleep(80)
const lookDown = await dragLook(desk.page, 700, 'mouse')
const lookUp = await dragLook(desk.page, -700, 'mouse')
const lookTouch = await dragLook(desk.page, 700, 'touch')
const lookTouchUp = await dragLook(desk.page, -700, 'touch')
await desk.page.evaluate(() => window.__blocks.panel('settings'))
await sleep(250)
await desk.page.evaluate(() => {
  const b = document.querySelector('#sheet [data-look="invert"]')
  if (b) b.scrollIntoView({ block: 'center', inline: 'nearest' })
})
const invBtn = await desk.page.evaluate(() => {
  const b = document.querySelector('#sheet [data-look="invert"]')
  if (!b) return null
  const r = b.getBoundingClientRect()
  return { x: Math.round(r.left + Math.min(r.width, 160) / 2), y: Math.round(Math.min(r.bottom - 8, Math.max(r.top + 8, r.top + r.height / 2))), text: b.textContent || '' }
})
if (invBtn) await desk.page.mouse.click(invBtn.x, invBtn.y)
await sleep(120)
const invAfter = await desk.page.evaluate(() => {
  const b = document.querySelector('#sheet [data-look="invert"]')
  return b ? b.textContent || '' : ''
})
await desk.page.evaluate(() => {
  const sheet = document.getElementById('sheet')
  if (sheet) sheet.hidden = true
  document.body.classList.remove('menu-open')
  try { window.__blocks.noa.setPaused(false) } catch (e) {}
  if (window.__smoke) window.__smoke.arm()
  const play = document.getElementById('play-chip')
  if (play) play.hidden = true
  const shell = window.__blocks.noa.container && window.__blocks.noa.container._shell
  if (shell) shell.stickyPointerLock = false
  if (window.__quietUnlock) window.__quietUnlock()
  window.__blocks.setLook(0.6, 0)
})
await sleep(80)
const lookInv = await dragLook(desk.page, 700, 'mouse')
await desk.page.evaluate(() => {
  const shell = window.__blocks.noa.container && window.__blocks.noa.container._shell
  if (shell) shell.stickyPointerLock = false
  if (window.__quietUnlock) window.__quietUnlock()
})
const maxPitch = 89 * Math.PI / 180 + 0.03
const pitches = [lookDown, lookUp, lookTouch, lookTouchUp, lookInv]
const pitchOk = pitches.every((row) => row && Math.abs(row.pitch) <= maxPitch && !row.flip && Math.abs(row.pitch) > 0.4)
  && lookInv && lookInv.pitch < -0.4
  && /✓/.test(invAfter)
note('look pitch stays under 89', !!pitchOk, JSON.stringify({
  down: lookDown && +lookDown.pitch.toFixed(3),
  up: lookUp && +lookUp.pitch.toFixed(3),
  touch: lookTouch && +lookTouch.pitch.toFixed(3),
  touchUp: lookTouchUp && +lookTouchUp.pitch.toFixed(3),
  inv: lookInv && +lookInv.pitch.toFixed(3),
  flips: pitches.map((row) => row && row.flip),
  invText: invAfter || (invBtn && invBtn.text),
}))

note('1366 console', desk.errors.length === 0, desk.errors.slice(0, 4).join(' | '))
await desk.ctx.close()

for (const [w, h, tag] of [[915, 412, '915'], [412, 732, '412']]) {
  const view = await boot(w, h)
  await saveClick(view.page, tag)
  note(tag + ' console', view.errors.length === 0, view.errors.slice(0, 4).join(' | '))
  await view.ctx.close()
}

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))
if (report.fail) process.exit(1)
