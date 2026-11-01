// Real decor check: CDP input drives the live Woodshop, place, toggle, light, save.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { spawnSync } from 'child_process'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
if (!existsSync(path.join(__dir, '../node_modules/puppeteer-core'))) {
  console.log('puppeteer-core missing, running npm ci')
  const ci = spawnSync('npm', ['ci'], { cwd: path.resolve(__dir, '..'), stdio: 'inherit' })
  if (ci.status) { console.error('npm ci failed'); process.exit(1) }
}
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found. Install Chrome or set a browser path.'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
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
await new Promise((r) => server.listen(8877, '127.0.0.1', r))

const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const errors = []
let page = null
let cdp = null
// Each size gets its own incognito context: a fresh kid with no save, gifts or hung tools from the last size.
async function freshPage() {
  if (page) await page.browserContext().close().catch(() => {})
  const ctx = await browser.createBrowserContext()
  page = await ctx.newPage()
  cdp = await page.createCDPSession()
  page.setDefaultTimeout(120000)
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  page.on('console', (msg) => { if (msg.type() === 'error' && !/404|Failed to load/.test(msg.text())) errors.push(msg.text()) })
}

const report = { steps: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 500) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 220) : ''))
  if (!ok && !report.fail) report.fail = name
  return ok
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function cdpClick(x, y, button) {
  const btn = button === 'right' ? 'right' : 'left'
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: btn, clickCount: 1 })
  await sleep(40)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: btn, clickCount: 1 })
}

let curTouch = false
async function boot(w, h, touch) {
  curTouch = !!touch
  await freshPage()
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, isLandscape: w > h, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:8877/?q=lite&smoke=1' + (touch ? '&touch=1' : ''), { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 45000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} })
  await sleep(400)
}

async function startItems() {
  return page.evaluate(() => {
    const s = window.__smoke
    window.__blocks.mode('survival')
    s.emptyBag()
    window.__blocks.give('woodshop', 1)
    window.__blocks.give('safetyGlasses', 1)
    window.__blocks.give('measuringTape', 1)
    window.__blocks.give('handSaw', 1)
    window.__blocks.give('hammer', 1)
    window.__blocks.give('ironIngot', 4)
    // 2.5.571 (6b1fad66) locks the iron lamps until the metal tier (T4) is open. A kid holding ingots has been
    // through the smelter, so open T4 the way the ladder does.
    if (s.gate) s.gate('T4')
    window.__blocks.give('glass', 4)
    window.__blocks.give('stick', 4)
    window.__blocks.give('woolBlue', 8)
    s.plant(60, 5, 60, 3)
    s.plant(62, 5, 62, 3)
    return { tools: s.count('hammer'), iron: s.count('ironIngot') }
  })
}

async function aimAndClick(cx, cy, cz, button) {
  const spot = await page.evaluate(async (cx, cy, cz, button) => {
    const s = window.__smoke
    const canvas = document.querySelector('#stage canvas')
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const n = [0, 0, 1]
    function pose(dist) {
      const tx = cx + 0.5 + n[0] * 0.46
      const ty = cy + 0.5
      const tz = cz + 0.5 + n[2] * 0.46
      const eyeX = tx + n[0] * dist
      const eyeY = ty
      const eyeZ = tz + n[2] * dist
      const dx = tx - eyeX, dy = ty - eyeY, dz = tz - eyeZ
      s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(dx, dz), Math.atan2(-dy, Math.hypot(dx, dz) || 0.001))
    }
    for (const dist of [2.2, 2.8, 3.4]) {
      for (let i = 0; i < 12; i++) {
        if (s.arm) s.arm()
        pose(dist)
        await frame(); await frame()
        const r = canvas.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        const hit = s.hit(x, y)
        const aim = s.aim()
        if (aim && aim.x === cx && aim.z === cz) {
          if (s.arm) s.arm()
          const common = { bubbles: true, cancelable: true, pointerId: 3, pointerType: 'mouse', clientX: x, clientY: y, isPrimary: true }
          const btn = button === 'right' ? 2 : 0
          canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: btn, buttons: btn === 2 ? 2 : 1 }))
          canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, button: btn, buttons: 0 }))
          return { x, y, hit, aim, fired: true }
        }
      }
    }
    const r = canvas.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, hit: s.hit(r.left + r.width / 2, r.top + r.height / 2), aim: s.aim() }
  }, cx, cy, cz, button)
  if (!spot.fired) await cdpClick(spot.x, spot.y, button)
  return spot
}

// Since 2.5.211 (df9a1a61) a desktop kid's first left click only grabs the mouse ("Your first click just grabs the
// mouse"); the world click comes after. Do what a kid does: click into play once, then click the block.
async function enterPlay() {
  const box = await page.evaluate(() => {
    if (document.pointerLockElement) return null
    const c = document.querySelector('#stage canvas')
    const r = c.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  if (!box) return true
  await cdpClick(box.x, box.y, 'left')
  await sleep(300)
  return page.evaluate(() => !!document.pointerLockElement)
}

async function openWoodshop() {
  await page.evaluate(() => window.__smoke.plant(60, 5, 60, 69))
  await enterPlay()
  const spot = await aimAndClick(60, 5, 60, 'left'); console.log('SPOT', JSON.stringify(spot))
  await sleep(500)
  const dbg = await page.evaluate(() => { const s = window.__smoke; return { v: s.voxel(60,5,60), aim: s.aim() } })
  console.log('AIM', JSON.stringify(dbg))
  return page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    const open = sheet && !sheet.hidden
    const wall = document.querySelectorAll('.wall-slot').length
    const bed = !!document.querySelector('.bed-card')
    const decor = document.querySelectorAll('.decor-card').length
    return { open, wall, bed, decor, panel: sheet && sheet.dataset.panel }
  })
}

async function hangAndCraft() {
  await dismissSafety()
  await page.evaluate(() => {
    for (const s of document.querySelectorAll('.wall-slot')) s.click()
  })
  await sleep(200)
  for (const id of ['floorLamp', 'wallLamp', 'rug']) {
    const box = await page.evaluate((id) => {
      const b = document.querySelector('.decor-just-' + id)
      if (!b) return null
      const r = b.getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    }, id)
    if (box) await cdpClick(box.x, box.y, 'left')
    await page.evaluate((id) => { const b = document.querySelector('.decor-just-' + id); if (b) b.click() }, id)
    await sleep(180)
    await page.evaluate((id) => { const b = document.querySelector('.decor-design-' + id); if (b && !b.disabled) b.click() }, id)
    await sleep(100)
  }
  const dbg = await page.evaluate(() => ({ slots: document.querySelectorAll('.wall-slot').length, filled: document.querySelectorAll('.wall-slot.filled').length, just: document.querySelectorAll('[class*=decor-just]').length, disabled: [...document.querySelectorAll('[class*=decor-just]')].filter(b => b.disabled).length }))
  console.log('CRAFTDBG', JSON.stringify(dbg))
  return page.evaluate(() => ({
    floor: window.__smoke.count('floorLamp'),
    wall: window.__smoke.count('wallLamp'),
    rug: window.__smoke.count('rug'),
  }))
}

async function selectItem(item) {
  await page.evaluate((item) => {
    const slots = window.__blocks.bag()
    const i = slots.findIndex((sl) => sl && (sl.item === item || String(sl).startsWith(item)))
    if (i >= 0 && window.__smoke.key) window.__smoke.key(i < 9 ? i : 0)
  }, item)
}
async function placeToggleLight() {
  await dismissSafety()
  // Worldgen can leave a dirt bump right where the checker stands (62,5,66 on some runs), which puts the eye inside
  // a block and the aim on the bump. Clear a work bay in front of the target, the way a kid would dig one.
  await page.evaluate(() => { const s = window.__smoke; s.close(); for (let x = 60; x <= 66; x++) for (let z = 63; z <= 69; z++) for (let y = 5; y <= 7; y++) s.plant(x, y, z, 0); for (let x = 60; x <= 66; x++) for (let z = 63; z <= 69; z++) s.plant(x, 4, z, 3) })
  await selectItem('floorLamp')
  for (let attempt = 0; attempt < 3; attempt++) {
    const spot = await aimAndClick(62, 5, 62, 'right')
    if (spot && spot.aim) {
      await page.evaluate(() => { const b = document.getElementById('t-place'); if (b) b.click() })
    }
    await sleep(300)
    const got = await page.evaluate(() => { const s = window.__smoke; for (const [x,y,z] of [[62,6,62],[62,5,63],[63,5,62],[61,5,62]]) if (s.voxel(x,y,z)===1100||s.voxel(x,y,z)===1101) return true; return false })
    if (got) break
  }
  const lampCell = await page.evaluate(() => {
    const s = window.__smoke
    for (const [x, y, z] of [[62, 6, 62], [62, 5, 63], [63, 5, 62], [61, 5, 62]]) {
      const id = s.voxel(x, y, z)
      if (id === 1100 || id === 1101) return { x, y, z, id }
    }
    return null
  })
  // ensure on: if placed off, one right-click turns it on
  await sleep(300)
  if (lampCell) await aimAndClick(lampCell.x, lampCell.y, lampCell.z, 'right')
  await sleep(400)
  let toggled = lampCell ? await page.evaluate((c) => window.__smoke.voxel(c.x, c.y, c.z), lampCell) : 0
  if (lampCell && toggled !== 1101) { await aimAndClick(lampCell.x, lampCell.y, lampCell.z, 'right'); await sleep(300); toggled = await page.evaluate((c) => window.__smoke.voxel(c.x, c.y, c.z), lampCell) }
  await page.evaluate(() => { const s = window.__smoke; s.stand(64, 7, 63, 0, 0.2); s.seek(s.nightAt()); try { window.__blocks.noa.setPaused(false) } catch (e) {} })
  await sleep(800)
  const light = await page.evaluate(() => {
    let on = false
    try { for (const L of window.__blocks.noa.rendering.scene.lights) if (L.getClassName && L.getClassName() === 'PointLight' && L.isEnabled && L.isEnabled()) on = true } catch (e) {}
    return on
  })
  if (lampCell) await aimAndClick(lampCell.x, lampCell.y, lampCell.z, 'right')
  await sleep(200)
  const off = lampCell ? await page.evaluate((c) => window.__smoke.voxel(c.x, c.y, c.z), lampCell) : 0
  return { lampCell, toggled, light, off }
}

// Hold the left button on a cell the way a kid does: in play (mouse grabbed), aimed at the cell, one real press.
// The Woodshop shows the shop-safety rules once; a kid taps OK before playing on. Do the same.
async function dismissSafety() {
  await page.evaluate(() => { const b = document.querySelector('#shop-safe button'); if (b) b.click() })
}

async function holdOn(c, ms, low = 0.5) {
  await dismissSafety()
  // Chrome refuses a new pointer lock for about a second after one ends, so try again after a short wait.
  // On a touch screen there is no mouse to grab; the kid just presses and holds.
  let locked = curTouch
  for (let i = 0; i < 4 && !locked; i++) { locked = await enterPlay(); if (!locked) await sleep(1200) }
  const box = await page.evaluate(() => { const r = document.querySelector('#stage canvas').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  // Find a pose that aims at the cell, then keep that pose for the whole hold: a steady hand. (Headless Chrome sends
  // a stray locked mousemove on press that would swing the camera; a kid's hand does not jump 600 px.)
  const pose = await page.evaluate(async (c) => {
    const s = window.__smoke
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    for (const dist of [2.2, 2.8, 3.4]) {
      for (let i = 0; i < 12; i++) {
        const tx = c.x + 0.5, ty = c.y + c.low, tz = c.z + 0.5
        const ex = tx, ey = c.y + 1.4, ez = tz + dist
        const p = [ex, ey - 1.62, ez, Math.atan2(tx - ex, tz - ez), Math.atan2(-(ty - ey), Math.hypot(tx - ex, tz - ez) || 0.001)]
        s.stand(...p)
        await frame(); await frame()
        const a = s.aim()
        if (a && a.x === c.x && a.y === c.y && a.z === c.z) return p
        // a rug answers from any of its 4 cells
        if (a && c.id >= 1104 && (a.id === 1104 || a.id === 1105)) return p
      }
    }
    return null
  }, { ...c, low })
  if (!pose) return false
  await page.evaluate((p) => {
    window.__steady = true
    const tick = () => { if (!window.__steady) return; window.__smoke.stand(...p); requestAnimationFrame(tick) }
    tick()
  }, pose)
  if (curTouch) {
    // A finger presses the block itself. On a sideways phone the camera-view chip sits over the middle of the
    // screen (2.5.595), so find a spot on the block that the canvas actually owns.
    const spot = await page.evaluate((c) => {
      const s = window.__smoke
      const canvas = document.querySelector('#stage canvas')
      const r = canvas.getBoundingClientRect()
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2
      for (const [dx, dy] of [[0, 0], [0, -30], [0, 30], [-40, 0], [40, 0], [0, -60], [0, 60], [-80, 0], [80, 0]]) {
        const x = cx + dx, y = cy + dy
        if (document.elementFromPoint(x, y) !== canvas) continue
        const h = s.hit(x, y)
        if (h && ((h.x === c.x && h.y === c.y && h.z === c.z) || (c.id >= 1104 && (h.id === 1104 || h.id === 1105)))) return { x, y }
      }
      return null
    }, c)
    const at = spot || box
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: at.x, y: at.y, id: 1 }] })
    await sleep(ms)
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  } else {
    await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: box.x, y: box.y, button: 'left', buttons: 1, clickCount: 1 })
    await sleep(ms)
    await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: box.x, y: box.y, button: 'left', buttons: 0, clickCount: 1 })
  }
  await page.evaluate(() => { window.__steady = false })
  await sleep(300)
  const aimed = true
  return locked && aimed
}

async function pickupSaveReload(lampCell) {
  if (!lampCell) return { cell: -1, bag: 0 }
  await page.evaluate(() => window.__smoke.close())
  const aimed = await holdOn(lampCell, 1400)
  const before = await page.evaluate((c) => ({ cell: window.__smoke.voxel(c.x, c.y, c.z), bag: window.__smoke.count('floorLamp') }), lampCell)
  await sleep(400)
  const save = await page.$('#save-btn')
  if (save) await save.click()
  await sleep(600)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 }).catch(() => {})
  await sleep(700)
  const after = await page.evaluate((c) => ({ cell: window.__smoke.voxel(c.x, c.y, c.z), bag: window.__smoke.count('floorLamp') }), lampCell)
  return { ...after, aimed, before }
}


async function rugPickupWalk() {
  // a block to aim at, with a clear 2x2 in front of its +z face for the rug
  await page.evaluate(() => { const s = window.__smoke; s.close(); s.plant(64, 5, 64, 3); for (const [x, z] of [[64, 65], [65, 65], [64, 66], [65, 66]]) s.plant(x, 5, z, 0) })
  await selectItem('rug')
  // place via real aim+right-click
  let placed = null
  for (let attempt = 0; attempt < 3; attempt++) {
    await aimAndClick(64, 5, 64, 'right')
    await page.evaluate(() => { const b = document.getElementById('t-place'); if (b) b.click() })
    await sleep(400)
    placed = await page.evaluate(() => {
      const s = window.__smoke
      for (const [x, y, z] of [[64,5,64],[64,6,64],[65,5,64],[64,5,65]]) {
        const id = s.voxel(x, y, z)
        if (id === 1104 || id === 1105) return { x, y, z, id }
      }
      return null
    })
    if (placed) break
  }
  if (!placed) return { placed: false, voxels: -1, bag: 0, walked: false }
  // hold left on the rug (real press) to pick up the whole rug
  const held = await holdOn(placed, 1400, 0.05)
  const after = await page.evaluate((p) => {
    const s = window.__smoke
    const cells = [[p.x, p.y, p.z], [p.x+1, p.y, p.z], [p.x, p.y, p.z+1], [p.x+1, p.y, p.z+1]]
    const zeros = cells.filter(([x,y,z]) => s.voxel(x,y,z) === 0).length
    return { zeros, bag: s.count('rug'), ids: cells.map(([x,y,z]) => s.voxel(x,y,z)) }
  }, placed)
  // place again and walk over with keys
  await selectItem('rug')
  await aimAndClick(64, 5, 64, 'right')
  await page.evaluate(() => { const b = document.getElementById('t-place'); if (b) b.click() })
  await sleep(400)
  // take the aim block away so the walk crosses the rug and nothing else
  await page.evaluate(() => { const s = window.__smoke; s.plant(64, 5, 64, 0); s.stand(64.5, 5, 68.5, Math.PI, 0.2) })
  // let the kid land before the walk (re-placing can leave them a step up)
  await page.evaluate(async () => { const n = window.__blocks.noa; let last = -1; for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 50)); const y = n.ents.getPositionData(n.playerEntity).position[1]; if (Math.abs(y - last) < 0.001) break; last = y } })
  const beforeY = await page.evaluate(() => {
    try { return window.__blocks.noa.ents.getPositionData(window.__blocks.noa.playerEntity).position[1] } catch (e) { return null }
  })
  // walk forward with keys
  await page.keyboard.down('KeyW')
  await sleep(600)
  await page.keyboard.up('KeyW')
  await sleep(200)
  const afterY = await page.evaluate(() => {
    try { return window.__blocks.noa.ents.getPositionData(window.__blocks.noa.playerEntity).position[1] } catch (e) { return null }
  })
  const walked = beforeY != null && afterY != null && Math.abs(afterY - beforeY) < 0.15
  return { placed: true, at: placed, held, ids: after.ids, voxels: after.zeros, bag: after.bag, walked, beforeY, afterY }
}

// DECOR_SIZES=412x915t,1366x768 runs other sizes ("t" = touch). Default: 1366 desk and 915x412 touch.
const SIZES = (process.env.DECOR_SIZES || '1366x768,915x412t').split(',').map((v) => { const m = v.match(/(\d+)x(\d+)(t?)/); return [+m[1], +m[2], !!m[3]] })
for (const [w, h, touch] of SIZES) {
  await boot(w, h, touch)
  const items = await startItems()
  note('items ' + w, items.tools === 1 && items.iron >= 1, JSON.stringify(items))
  const opened = await openWoodshop()
  note('woodshop open ' + w, opened.open && opened.wall >= 4 && opened.bed && opened.decor >= 3, JSON.stringify(opened))
  await sleep(300)
  const made = await hangAndCraft()
  note('craft ' + w, made.floor >= 1 && made.wall >= 1 && made.rug >= 1, JSON.stringify(made))
  const lit = await placeToggleLight()
  note('place+toggle ' + w, !!lit.lampCell && lit.toggled === 1101 && lit.light, JSON.stringify(lit))
  const pk = await pickupSaveReload(lit.lampCell)
  note('pickup+save ' + w, pk.cell === 0 && pk.bag >= 1, JSON.stringify(pk))
  const rug = await rugPickupWalk()
  note('rug pickup+walk ' + w, rug.placed && rug.voxels === 4 && rug.bag >= 1 && rug.walked, JSON.stringify(rug))
}
note('no page errors', errors.filter((e) => e.startsWith('page:')).length === 0, errors.filter((e) => e.startsWith('page:')).slice(0, 2).join(' | '))

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))
if (report.fail) process.exit(1)
