// Hand size, flat held plants, and one hint at a time.
import { existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
import { EXTRA } from '../src/strings-extra.js'

const EN = 'Chop a tree near you. Hold left click on a log.'
const UK = 'Зрубай дерево біля себе. Тримай ліву кнопку на колоді.'
const fail = []
function eq(ok, msg, extra) {
  if (!ok) fail.push(extra ? msg + ' ' + extra : msg)
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg + (extra ? ' ' + extra : ''))
}
eq(EXTRA.en.pathTree === EN, 'pathTree en source')
eq(EXTRA.uk.pathTree === UK, 'pathTree uk source')
eq(EXTRA.ru.pathTree.includes('Сруби дерево рядом'), 'pathTree ru source')
eq(EXTRA.es.pathTree.includes('cerca de ti'), 'pathTree es source')
eq(EXTRA.ar.pathTree.includes('قربك'), 'pathTree ar source')
eq(EXTRA['fa-AF'].pathTree.includes('نزدیک'), 'pathTree fa source')
eq(EXTRA.rw.pathTree.includes('hafi yawe'), 'pathTree rw source')
eq(EXTRA.ti.pathTree.includes('ጥቓኻ'), 'pathTree ti source')
for (const lang of ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']) {
  eq(EXTRA[lang].pathTreeTouch && EXTRA[lang].pathTreeTouch.length < 40, lang + ' pathTreeTouch stays short', EXTRA[lang].pathTreeTouch)
}

import puppeteer from 'puppeteer-core'
const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8914
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
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

async function prep(page) {
  page.setDefaultTimeout(90000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {}, notes: [] })) } catch (e) {}
    try { localStorage.removeItem('bloxbert-menu-hint') } catch (e) {}
    try { localStorage.removeItem('bloxbert-bag-hint') } catch (e) {}
  })
  return errs
}

async function boot(page, query) {
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/?' + query, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.evaluate(() => {
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
  })
  await sleep(300)
}

async function hints(page) {
  return page.evaluate(() => {
    const shown = (el) => {
      if (!el || el.hidden) return false
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
      const r = el.getBoundingClientRect()
      return r.width > 2 && r.height > 2
    }
    const path = document.getElementById('path-chip')
    const menu = document.getElementById('menu-hint')
    return {
      path: shown(path),
      menu: shown(menu),
      pathText: path ? path.textContent : '',
      menuText: menu ? menu.textContent : '',
      n: (shown(path) ? 1 : 0) + (shown(menu) ? 1 : 0),
    }
  })
}

async function measure(page) {
  return page.evaluate(async () => {
    const noa = window.__blocks.noa
    const scene = noa.rendering.getScene()
    const cam = noa.rendering.camera
    const engine = scene.getEngine()
    const canvas = engine.getRenderingCanvas()
    const Vector3 = cam.position.constructor
    const Matrix = scene.getTransformMatrix().constructor
    const rw = engine.getRenderWidth()
    const rh = engine.getRenderHeight()
    const viewport = cam.viewport.toGlobal(rw, rh)
    const transform = scene.getTransformMatrix()
    const ident = Matrix.Identity()
    const rect = canvas.getBoundingClientRect()
    const sx = canvas.clientWidth / rw
    const sy = canvas.clientHeight / rh
    const meshes = scene.meshes.filter((m) => m.isEnabled() && (m.name === 'bertbot-hand' || (m.name && (m.name.indexOf('hand-plant-') === 0 || m.name.indexOf('hand-b-') === 0 || m.name.indexOf('hand-i-') === 0))))
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    const parts = []
    for (const mesh of meshes) {
      mesh.computeWorldMatrix(true)
      const world = mesh.getWorldMatrix()
      const pos = mesh.getVerticesData('position')
      const corners = []
      if (pos && pos.length) {
        for (let i = 0; i < pos.length; i += 3) {
          corners.push(Vector3.TransformCoordinates(new Vector3(pos[i], pos[i + 1], pos[i + 2]), world))
        }
      } else {
        for (const c of mesh.getBoundingInfo().boundingBox.vectorsWorld) corners.push(c)
      }
      let pminX = Infinity, pminY = Infinity, pmaxX = -Infinity, pmaxY = -Infinity
      for (const c of corners) {
        const p = Vector3.Project(c, ident, transform, viewport)
        const x = rect.left + p.x * sx
        const y = rect.top + p.y * sy
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
        if (x < pminX) pminX = x
        if (y < pminY) pminY = y
        if (x > pmaxX) pmaxX = x
        if (y > pmaxY) pmaxY = y
      }
      parts.push({
        name: mesh.name,
        verts: pos ? pos.length / 3 : 0,
        alpha: mesh.material ? mesh.material.transparencyMode : null,
        cut: mesh.material ? mesh.material.alphaCutOff : null,
        url: mesh.material && mesh.material.diffuseTexture ? String(mesh.material.diffuseTexture.url || '').slice(0, 32) : '',
        box: { w: pmaxX - pminX, h: pmaxY - pminY },
      })
    }
    const hot = document.getElementById('hotbar').getBoundingClientRect()
    const hadTouch = document.body.classList.contains('touch')
    if (!hadTouch) document.body.classList.add('touch')
    const chip = document.getElementById('pick-chip').getBoundingClientRect()
    if (!hadTouch) document.body.classList.remove('touch')
    const slot = document.querySelector('#hotbar [aria-pressed="true"] canvas')
    let icon = null
    const plant = scene.meshes.find((m) => m.isEnabled() && m.name && m.name.indexOf('hand-plant-') === 0)
    if (plant && slot && plant.material && plant.material.diffuseTexture && plant.material.diffuseTexture.url) {
      const img = new Image()
      img.src = plant.material.diffuseTexture.url
      try { await img.decode() } catch (e) {}
      const c = document.createElement('canvas')
      c.width = slot.width
      c.height = slot.height
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      const a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      const b = slot.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, slot.width, slot.height).data
      let diff = 0
      const n = Math.min(a.length, b.length)
      for (let i = 0; i < n; i++) if (a[i] !== b[i]) diff++
      icon = { diff, n, slot: slot.width + 'x' + slot.height }
    }
    const vw = window.innerWidth
    const vh = window.innerHeight
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const plantPart = parts.find((p) => p.name.indexOf('hand-plant-') === 0)
    const area = plantPart ? (plantPart.box.w * plantPart.box.h) / (vw * vh) : 0
    const hand = window.__blocks.hand()
    return {
      parts, icon, area,
      box: meshes.length ? { minX, minY, maxX, maxY, h: maxY - minY, w: maxX - minX } : null,
      vh, vw, hotTop: hot.top,
      chip: { left: chip.left, top: chip.top, right: chip.right, bottom: chip.bottom, w: chip.width, h: chip.height },
      center: { x: cx, y: cy },
      key: hand && hand.key,
      visible: !!(hand && hand.visible),
      side: hand && hand.side,
    }
  })
}

function judge(tag, m, opts) {
  const b = m.box
  eq(!!b && m.visible, tag + ' hand on screen', JSON.stringify({ visible: m.visible, key: m.key, parts: (m.parts || []).map((p) => p.name) }))
  if (!b) return
  const hFrac = b.h / m.vh
  const cx = (b.minX + b.maxX) / 2
  const contains = b.minX < m.center.x && b.maxX > m.center.x && b.minY < m.center.y && b.maxY > m.center.y
  const overHot = b.maxY > m.hotTop + 2
  const overChip = b.maxX > m.chip.left && b.minX < m.chip.right && b.maxY > m.chip.top && b.minY < m.chip.bottom
  eq(hFrac < 0.15, tag + ' hand height under 15%', (hFrac * 100).toFixed(1) + '% h=' + b.h.toFixed(0))
  eq(!overHot, tag + ' hand above hotbar', 'maxY ' + b.maxY.toFixed(0) + ' hot ' + m.hotTop.toFixed(0))
  eq(!overChip && m.chip.w > 20, tag + ' hand clear of copy chip', JSON.stringify({ box: [b.minX, b.minY, b.maxX, b.maxY].map((n) => n.toFixed(0)), chip: m.chip }))
  eq(!contains, tag + ' hand misses crosshair')
  if (opts.side === 'left') eq(cx < m.vw * 0.45, tag + ' hand on the left', 'cx ' + cx.toFixed(0))
  else eq(cx > m.vw * 0.55, tag + ' hand tucked lower right', 'cx ' + cx.toFixed(0) + ' y ' + ((b.minY + b.maxY) / 2).toFixed(0))
  if (opts.plant) {
    const plant = (m.parts || []).find((p) => p.name === 'hand-plant-' + opts.plant)
    const cube = (m.parts || []).filter((p) => p.name.indexOf('hand-b-') === 0)
    eq(!!plant && plant.verts === 4, tag + ' ' + opts.plant + ' is one quad', JSON.stringify(plant || null))
    eq(!!plant && plant.cut === 0.4 && (plant.alpha === 1 || plant.alpha === 2), tag + ' ' + opts.plant + ' alpha test', JSON.stringify(plant || null))
    eq(cube.length === 0, tag + ' ' + opts.plant + ' has no cube', cube.map((p) => p.name).join(','))
    eq(m.area > 0 && m.area < 0.08, tag + ' ' + opts.plant + ' covers under 8%', (m.area * 100).toFixed(2) + '%')
    eq(!!m.icon && m.icon.diff <= 24, tag + ' ' + opts.plant + ' matches hotbar icon', JSON.stringify(m.icon))
  }
}

async function hold(page, item) {
  await page.evaluate((item) => {
    window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
    window.__blocks.noa.camera.zoomDistance = 0
    window.__blocks.noa.setPaused(false)
    document.body.classList.remove('menu-open', 'photo')
    const sheet = document.getElementById('sheet')
    if (sheet) sheet.hidden = true
    const rc = document.getElementById('rules-card')
    if (rc) rc.hidden = true
    window.__smoke.emptyBag()
    if (item) {
      window.__blocks.give(item, 1)
      window.__smoke.hold(item)
    }
    window.__smoke.arm()
  }, item)
  await sleep(350)
}

const page = await browser.newPage()
const errs = await prep(page)
await page.setViewport({ width: 1024, height: 576, deviceScaleFactor: 1 })
await boot(page, 'q=full&smoke=1&auto=0')
const version = await page.evaluate(() => window.__blocks.version)
eq(version === '2.5.172', 'version', version)
const word = await page.evaluate(() => window.__smoke.word('pathTree'))
eq(word === EN, 'live pathTree english', word)
let tip = await hints(page)
eq(tip.n === 1 && tip.path && !tip.menu && tip.pathText.includes(EN), 'fresh survival shows only the chop tip', JSON.stringify(tip))
await page.screenshot({ path: '/tmp/hint-one.png' })
await page.evaluate(() => {
  const rc = document.getElementById('rules-card')
  if (rc) rc.hidden = true
  const x = document.querySelector('#path-chip .path-x')
  if (x) x.click()
})
await sleep(1800)
tip = await hints(page)
eq(tip.n === 1 && !tip.path && tip.menu, 'after chop tip closes, the next hint shows alone', JSON.stringify(tip))
await page.screenshot({ path: '/tmp/hint-next.png' })

await hold(page, '')
let m = await measure(page)
judge('1024 empty', m, {})
await hold(page, 'sapling')
m = await measure(page)
judge('1024 sapling', m, { plant: 'sapling' })
await page.screenshot({ path: '/tmp/hand-sapling-1024.png' })
await hold(page, 'dirt')
m = await measure(page)
judge('1024 dirt', m, {})
await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'left', cam: 'close' }))
await sleep(200)
m = await measure(page)
judge('1024 left', m, { side: 'left' })

await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
await sleep(400)
await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' }))
await hold(page, 'sapling')
m = await measure(page)
judge('1366 sapling', m, { plant: 'sapling' })
await hold(page, 'daisy')
m = await measure(page)
judge('1366 daisy', m, { plant: 'daisy' })
await page.screenshot({ path: '/tmp/hand-daisy-1366.png' })

await page.setViewport({ width: 915, height: 412, deviceScaleFactor: 1 })
await sleep(400)
await hold(page, 'sapling')
m = await measure(page)
judge('915 sapling', m, { plant: 'sapling' })
await page.screenshot({ path: '/tmp/hand-sapling-915.png' })
await hold(page, 'daisy')
m = await measure(page)
judge('915 daisy', m, { plant: 'daisy' })

await page.setViewport({ width: 412, height: 915, deviceScaleFactor: 1 })
await sleep(400)
await page.setViewport({ width: 915, height: 412, deviceScaleFactor: 1 })
await sleep(400)
eq(errs.length === 0, 'phone rotate mid-play and 0 console errors', errs.slice(0, 4).join(' | '))

const uk = await browser.newPage()
await prep(uk)
await uk.setViewport({ width: 1024, height: 576, deviceScaleFactor: 1 })
await boot(uk, 'q=full&smoke=1&auto=0&lang=uk')
const ukWord = await uk.evaluate(() => window.__smoke.word('pathTree'))
eq(ukWord === UK, 'live pathTree uk', ukWord)

await browser.close()
server.close()
if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('ALL PASS')
