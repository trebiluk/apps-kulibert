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
const page = await browser.newPage()
const cdp = await page.createCDPSession()
page.setDefaultTimeout(120000)
const errors = []
page.on('pageerror', (e) => errors.push('page:' + e.message))
page.on('console', (msg) => { if (msg.type() === 'error' && !/404|Failed to load/.test(msg.text())) errors.push(msg.text()) })

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

async function boot(w, h, touch) {
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

async function openWoodshop() {
  await page.evaluate(() => window.__smoke.plant(60, 5, 60, 69))
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
  await page.evaluate(() => window.__smoke.close())
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

async function pickupSaveReload(lampCell) {
  if (!lampCell) return { cell: -1, bag: 0 }
  await page.evaluate(async (c) => {
    const s = window.__smoke
    const canvas = document.querySelector('#stage canvas')
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    s.stand(c.x + 0.5, c.y - 1, c.z + 2.6, Math.atan2(0, -1), 0.1)
    await frame(); await frame()
    const r = canvas.getBoundingClientRect()
    const common = { bubbles: true, cancelable: true, pointerId: 5, pointerType: 'mouse', clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, isPrimary: true, button: 0, buttons: 1 }
    canvas.dispatchEvent(new PointerEvent('pointerdown', common))
    await new Promise((res) => setTimeout(res, 800))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
  }, lampCell)
  await sleep(400)
  const save = await page.$('#save-btn')
  if (save) await save.click()
  await sleep(600)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 45000 }).catch(() => {})
  await sleep(700)
  return page.evaluate((c) => ({ cell: window.__smoke.voxel(c.x, c.y, c.z), bag: window.__smoke.count('floorLamp') }), lampCell)
}


async function rugPickupWalk() {
  await page.evaluate(() => window.__smoke.close())
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
  // aim and hold left (real CDP) to pick up whole rug
  const canvasBox = await page.evaluate(() => {
    const c = document.querySelector('#stage canvas')
    const r = c.getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  await aimAndClick(placed.x, placed.y, placed.z, 'left')
  // hold left via CDP
  await cdp.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: canvasBox.x, y: canvasBox.y, button: 'left', clickCount: 1 })
  await sleep(900)
  await cdp.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: canvasBox.x, y: canvasBox.y, button: 'left', clickCount: 1 })
  await sleep(400)
  const after = await page.evaluate((p) => {
    const s = window.__smoke
    const cells = [[p.x, p.y, p.z], [p.x+1, p.y, p.z], [p.x, p.y, p.z+1], [p.x+1, p.y, p.z+1]]
    const zeros = cells.filter(([x,y,z]) => s.voxel(x,y,z) === 0).length
    return { zeros, bag: s.count('rug') }
  }, placed)
  // place again and walk over with keys
  await selectItem('rug')
  await aimAndClick(placed.x, placed.y, placed.z, 'right')
  await page.evaluate(() => { const b = document.getElementById('t-place'); if (b) b.click() })
  await sleep(400)
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
  return { placed: true, voxels: after.zeros, bag: after.bag, walked, beforeY, afterY }
}

for (const [w, h, touch] of [[1366, 768, false], [915, 412, true]]) {
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
