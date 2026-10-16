// Touch chop hits the block under the finger, and a Bot wall plus the clock survive a reload.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const sharedRoot = path.resolve(__dir, '../../shared')
const chrome = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const underShared = p.startsWith('/shared/')
  const base = underShared ? sharedRoot : root
  const rel = underShared ? p.slice('/shared/'.length) : p.replace(/^\//, '')
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
await new Promise((r) => server.listen(8894, '127.0.0.1', r))

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const fail = []
const errors = []

function watch(page) {
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
  page.on('dialog', (d) => d.accept())
}

async function boot(page, url) {
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('bloxbert-look', JSON.stringify({ cv: 2, cam: 'behind', sens: 1, climb: true }))
  })
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__bot && window.__clock, { timeout: 30000 })
  await page.evaluate(() => {
    for (const id of ['sheet', 'about', 'door-opt', 'maker-card']) {
      const el = document.getElementById(id)
      if (el) el.hidden = true
    }
    if (window.__smoke.arm) window.__smoke.arm()
  })
}

const touch = await browser.newPage()
watch(touch)
await touch.setViewport({ width: 915, height: 412, deviceScaleFactor: 1, hasTouch: true, isMobile: true })
await boot(touch, 'http://127.0.0.1:8894/?q=lite&smoke=1&touch=1')

const chop = await touch.evaluate(async () => {
  const notes = []
  let gy = 6
  for (let y = 2; y < 30; y++) if (window.__smoke.voxel(80, y, 80) === 1) gy = y
  const feet = gy + 1
  for (let x = 76; x <= 86; x++) for (let z = 74; z <= 88; z++) for (let y = feet; y <= feet + 4; y++) {
    if (window.__smoke.voxel(x, y, z)) window.__smoke.plant(x, y, z, 0)
  }
  const log = { x: 80, y: feet + 1, z: 83 }
  const occ = { x: 80, y: feet + 1, z: 78 }
  window.__smoke.plant(log.x, log.y, log.z, 11)
  window.__smoke.plant(occ.x, occ.y, occ.z, 11)
  window.__smoke.stand(80.5, feet, 80.5, 0, 0)
  await new Promise((r) => setTimeout(r, 300))
  const spot = window.__smoke.screen(log.x, log.y, log.z)
  if (!spot) return { notes, err: 'no screen point', log, occ }
  let aim = null
  const tries = []
  for (let dy = -80; dy <= 80; dy += 16) for (let dx = -48; dx <= 48; dx += 16) {
    const hit = window.__smoke.hit(spot.x + dx, spot.y + dy)
    tries.push(hit ? [dx, dy, hit.id, hit.x, hit.y, hit.z, hit.far] : [dx, dy, 0])
    if (hit && hit.id === 11 && hit.x === log.x && hit.y === log.y && hit.z === log.z && !hit.far) {
      aim = { x: spot.x + dx, y: spot.y + dy, hit }
      break
    }
  }
  if (!aim) return { notes, err: 'finger missed the log', spot, log, occ, tries: tries.slice(0, 24) }
  const before = window.__smoke.count('log')
  const c = document.querySelector('#stage canvas')
  const fire = (type, buttons) => c.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, clientX: aim.x, clientY: aim.y, pointerId: 7, pointerType: 'touch', button: 0, buttons, isPrimary: true,
  }))
  const t0 = performance.now()
  fire('pointerdown', 1)
  let ring = null
  let tooFar = false
  while (performance.now() - t0 < 8000) {
    await new Promise((r) => setTimeout(r, 100))
    const toast = window.__smoke.toast() || ''
    const hint = document.getElementById('reach-hint')
    const hintText = hint && !hint.hidden ? hint.textContent : ''
    if (/too far away/i.test(toast) || /too far away/i.test(hintText)) tooFar = true
    const ringEl = document.getElementById('pick-ring')
    if (ringEl && !ringEl.hidden) {
      const r = ringEl.getBoundingClientRect()
      ring = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    }
    if (window.__smoke.voxel(log.x, log.y, log.z) === 0) break
  }
  fire('pointerup', 0)
  const ms = Math.round(performance.now() - t0)
  return {
    notes,
    ms,
    tooFar,
    before,
    after: window.__smoke.count('log'),
    target: window.__smoke.voxel(log.x, log.y, log.z),
    occluder: window.__smoke.voxel(occ.x, occ.y, occ.z),
    ring,
    aim,
    best: log,
  }
})

if (chop.err) fail.push('chop ' + chop.err + ' ' + JSON.stringify(chop.hit || chop.spot || ''))
else {
  if (chop.target !== 0) fail.push('chop target still ' + chop.target + ' after ' + chop.ms + 'ms')
  if (!(chop.after > chop.before)) fail.push('chop bag ' + chop.before + ' -> ' + chop.after)
  if (chop.tooFar) fail.push('chop said Too far away')
  if (chop.ms > 10000) fail.push('chop took ' + chop.ms + 'ms')
  if (!chop.ring) fail.push('chop ring never showed')
  else {
    const dx = Math.abs(chop.ring.x - chop.aim.x)
    const dy = Math.abs(chop.ring.y - chop.aim.y)
    if (dx > 36 || dy > 36) fail.push('ring off finger ' + dx + ',' + dy)
  }
  if (chop.occluder !== 11) fail.push('chop broke the camera-side log ' + chop.occluder)
}

const wall = await touch.evaluate(async () => {
  window.__smoke.showHud()
  if (window.__smoke.emptyBag) window.__smoke.emptyBag()
  let gy = 6
  for (let y = 2; y < 24; y++) if (window.__smoke.voxel(40, y, 40) === 1) gy = y
  for (let x = 38; x <= 48; x++) for (let z = 38; z <= 48; z++) for (let y = gy + 1; y <= gy + 3; y++) {
    if (window.__smoke.voxel(x, y, z)) window.__smoke.plant(x, y, z, 0)
  }
  window.__smoke.plant(40, gy, 40, 1)
  const placedBot = window.__bot.placeAt(40, gy, 40)
  window.__bot.face(0)
  window.__smoke.clock(8 * 60 * 1000)
  const face0 = window.__clock.face()
  window.__bot.program([{ id: 'repeat', n: 4 }, { id: 'place' }, { id: 'forward' }, { id: 'end' }])
  window.__bot.start()
  const t0 = performance.now()
  let pose = null
  while (performance.now() - t0 < 20000) {
    pose = window.__bot.pose()
    if (pose && !pose.running && pose.placed >= 4) break
    await new Promise((r) => setTimeout(r, 50))
  }
  const cells = []
  for (let x = 38; x <= 48; x++) for (let z = 38; z <= 48; z++) for (let y = gy; y <= gy + 3; y++) {
    if (window.__smoke.voxel(x, y, z) === 10) cells.push([x, y, z])
  }
  let chip = null
  const t1 = performance.now()
  while (performance.now() - t1 < 20000) {
    const el = document.getElementById('save-chip')
    if (el && !el.hidden && /Saved/.test(el.textContent || '')) {
      const r = el.getBoundingClientRect()
      const boxes = {}
      for (const id of ['pick-chip', 'hotbar', 'stick-pad', 'jump-col', 'game-menu', 'fs-btn', 'pause-btn']) {
        const n = document.getElementById(id)
        if (!n || n.hidden) { boxes[id] = null; continue }
        const s = getComputedStyle(n)
        if (s.display === 'none') { boxes[id] = null; continue }
        const b = n.getBoundingClientRect()
        if (b.width < 2 || b.height < 2) { boxes[id] = null; continue }
        const hit = r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top
        boxes[id] = { hit, w: Math.round(b.width), h: Math.round(b.height) }
      }
      const copy = document.getElementById('pick-chip')
      let tapped = true
      if (copy && getComputedStyle(copy).display !== 'none') {
        const b = copy.getBoundingClientRect()
        const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2)
        tapped = !(top && (top.id === 'save-chip' || top.closest && top.closest('#save-chip')))
      }
      chip = { text: el.textContent.replace(/\s+/g, ' ').trim(), boxes, tapped, x: Math.round(r.left), y: Math.round(r.top) }
      break
    }
    await new Promise((r) => setTimeout(r, 50))
  }
  return {
    placedBot,
    pose,
    cells,
    chip,
    face: window.__clock.face(),
    ms: window.__clock.dump() && window.__clock.dump().ms,
    face0,
    gy,
  }
})

if (!wall.placedBot) fail.push('bot did not place')
if (!wall.pose || wall.pose.placed < 4) fail.push('bot placed ' + (wall.pose && wall.pose.placed))
if (!wall.cells || wall.cells.length < 4) fail.push('wall cells ' + (wall.cells && wall.cells.length))
if (!wall.chip) fail.push('no Saved chip')
else {
  if (!/✓/.test(wall.chip.text) || !/Saved/.test(wall.chip.text)) fail.push('chip text ' + wall.chip.text)
  if (!wall.chip.tapped) fail.push('Saved blocked Copy')
  for (const [id, box] of Object.entries(wall.chip.boxes || {})) {
    if (box && box.hit) fail.push('Saved overlaps ' + id)
  }
}

const clockBefore = wall.face
const cellsBefore = wall.cells || []
await touch.reload({ waitUntil: 'domcontentloaded' })
await touch.waitForFunction(() => window.__bloxReady && window.__smoke && window.__clock, { timeout: 30000 })
const after = await touch.evaluate((cells) => {
  return {
    face: window.__clock.face(),
    ms: window.__clock.dump() && window.__clock.dump().ms,
    cells: cells.map(([x, y, z]) => [x, y, z, window.__smoke.voxel(x, y, z)]),
  }
}, cellsBefore)

const gone = (after.cells || []).filter((c) => c[3] !== 10)
if (gone.length) fail.push('wall missing after reload ' + JSON.stringify(gone))
if (clockBefore && after.face) {
  const mins = (f) => ((f.day || 1) * 24 * 60) + f.hh * 60 + f.mm
  const delta = mins(after.face) - mins(clockBefore)
  if (delta < -1 || delta > 1) fail.push('clock ' + clockBefore.text + ' day ' + clockBefore.day + ' -> ' + after.face.text + ' day ' + after.face.day + ' (' + delta + ' min)')
}

const desk = await browser.newPage()
watch(desk)
await desk.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
await boot(desk, 'http://127.0.0.1:8894/?q=full&smoke=1')
const mousePrep = await desk.evaluate(async () => {
  for (const id of ['rules-card', 'sheet', 'about', 'door-opt', 'maker-card', 'fs-hint', 'shop-safe', 'inspect-card']) {
    const el = document.getElementById(id)
    if (el) el.hidden = true
  }
  document.body.classList.remove('menu-open')
  if (window.__blocks && window.__blocks.noa) window.__blocks.noa.setPaused(false)
  if (window.__smoke.emptyBag) window.__smoke.emptyBag()
  const reach = window.__smoke.reach()
  const p = window.__smoke.pos()
  const x = Math.floor(p[0]) + 2
  const y = Math.floor(p[1]) + 1
  const z = Math.floor(p[2])
  window.__smoke.plant(x, y, z, 11)
  const h = Math.atan2((x + 0.5) - p[0], (z + 0.5) - p[2])
  window.__smoke.stand(p[0], p[1], p[2], h, 0)
  await new Promise((r) => setTimeout(r, 250))
  const chip = document.getElementById('play-chip')
  if (chip) chip.hidden = false
  const r = chip ? chip.getBoundingClientRect() : null
  return { reach, aim: window.__smoke.aim(), chip: r && r.width > 2 ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: 680, y: 400 } }
})
await desk.mouse.click(mousePrep.chip.x, mousePrep.chip.y)
await desk.waitForFunction(() => !!document.pointerLockElement, { timeout: 2500 }).catch(() => {})
await desk.mouse.move(40, 40)
await desk.mouse.down()
await desk.evaluate(() => {
  const c = document.querySelector('#stage canvas')
  c.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, cancelable: true, clientX: 40, clientY: 40, pointerId: 3, pointerType: 'mouse', button: 0, buttons: 1, isPrimary: true,
  }))
})
const mouse = { locked: false, ringAt: null, aim: null, paused: null, menu: false, center: { x: 683, y: 384 }, fire: null }
const tHold = Date.now()
while (Date.now() - tHold < 1500) {
  await new Promise((r) => setTimeout(r, 100))
  const snap = await desk.evaluate(() => {
    const ring = document.getElementById('pick-ring')
    let ringAt = null
    if (ring && !ring.hidden) {
      const r = ring.getBoundingClientRect()
      ringAt = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width }
    }
    return {
      locked: !!document.pointerLockElement,
      aim: window.__smoke.aim(),
      ringAt,
      paused: !!(window.__blocks && window.__blocks.noa && window.__blocks.noa._paused),
      menu: document.body.classList.contains('menu-open'),
      fire: !!(window.__blocks && window.__blocks.noa && window.__blocks.noa.inputs && window.__blocks.noa.inputs.state && window.__blocks.noa.inputs.state.fire),
      center: { x: innerWidth / 2, y: innerHeight / 2 },
    }
  })
  Object.assign(mouse, snap)
  if (snap.ringAt) break
}
await desk.mouse.up()
mouse.reach = mousePrep.reach
if (!(mouse.reach >= 6 && mouse.reach <= 10)) fail.push('mouse reach ' + mouse.reach)
if (!mouse.locked) fail.push('mouse pointer lock did not engage')
else if (!mouse.ringAt) fail.push('mouse ring missing')
else {
  const dx = Math.abs(mouse.ringAt.x - mouse.center.x)
  const dy = Math.abs(mouse.ringAt.y - mouse.center.y)
  if (dx > 40 || dy > 40) fail.push('mouse ring left the crosshair ' + dx + ',' + dy)
}

const loud = errors.filter((e) => !/WebGL|GPU|swiftshader|GL_|THREE|Babylon/i.test(e))
if (loud.length) fail.push('console ' + loud.slice(0, 3).join(' | '))

await browser.close()
server.close()

if (fail.length) {
  console.log('FAIL finger-save-check')
  for (const line of fail) console.log(line)
  console.log('chop ' + JSON.stringify(chop))
  console.log('wall ' + JSON.stringify(wall))
  console.log('mouse ' + JSON.stringify(mouse))
  process.exit(1)
}
console.log('PASS finger-save-check chop ' + chop.ms + 'ms bag ' + chop.before + '->' + chop.after + ' wall ' + (wall.cells && wall.cells.length) + ' clock ' + (clockBefore && clockBefore.text) + '->' + (after.face && after.face.text) + ' chip ' + (wall.chip && wall.chip.text) + ' reach ' + mouse.reach)
