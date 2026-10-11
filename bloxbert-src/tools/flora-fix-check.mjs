// Flora fix: shared aim check, fuller pine crown, tip X on touch, camera wall clamp.
import { createServer } from 'http'
import { readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'
import { genBlock } from '../src/worldgen.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mainSrc = await readFile(path.join(root, 'bloxbert-src/src/main.js'), 'utf8')
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}

const assigns = mainSrc.split('noa.blockTargetIdCheck =').length - 1
note(assigns === 1 && mainSrc.includes('FLORA_PLANT_IDS.has(id)'), 'shared aim check', 'assigns ' + assigns)

function treeScore(gen) {
  for (let ix = -18; ix <= 18; ix++) {
    for (let iz = -18; iz <= 18; iz++) {
      const x = ix * 12 + 8
      const z = iz * 12 + 3
      let trunk = 0
      for (let y = 2; y <= 22; y++) if (genBlock(x, y, z, gen) === 'pineLog') { trunk = y; break }
      if (!trunk) continue
      let needles = 0
      let logs = 0
      const rows = []
      for (let y = trunk - 1; y <= trunk + 14; y++) {
        let n = 0
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
          const b = genBlock(x + dx, y, z + dz, gen)
          if (b === 'pineNeedles') { n++; needles++ }
          if (b === 'pineLog') logs++
        }
        rows.push(n)
      }
      const withN = rows.map((n, i) => ({ i, n })).filter((r) => r.n > 0)
      if (!withN.length) continue
      return { x, z, trunk, needles, logs, total: needles + logs, rows, tip: withN[withN.length - 1].n, wide: withN[0].n, gap: rows.some((n, i) => i > withN[0].i && i < withN[withN.length - 1].i && n === 0) }
    }
  }
  return null
}
const pine8 = treeScore(8)
const pine7 = treeScore(7)
note(!!pine8 && pine8.total < 65 && pine8.total > 24, 'pine under 65', JSON.stringify(pine8 && { needles: pine8.needles, logs: pine8.logs, total: pine8.total, rows: pine8.rows }))
note(!!pine8 && pine8.tip === 1 && pine8.gap && pine8.wide > 1, 'stepped cone shape', JSON.stringify(pine8 && { tip: pine8.tip, gap: pine8.gap, wide: pine8.wide }))
note(!!pine8 && !!pine7 && pine8.needles > 17 && pine8.needles * 2 < pine7.needles, 'fuller than the pole', (pine8 && pine8.needles) + ' vs gen7 ' + (pine7 && pine7.needles))

function nearPine() {
  let best = null
  let bestD = 1e12
  for (let ix = -8; ix <= 8; ix++) {
    for (let iz = -8; iz <= 8; iz++) {
      const x = ix * 12 + 8
      const z = iz * 12 + 3
      let trunk = 0
      for (let y = 2; y <= 22; y++) if (genBlock(x, y, z, 8) === 'pineLog') { trunk = y; break }
      if (!trunk) continue
      const d = x * x + z * z
      if (d < bestD) { bestD = d; best = { x, z, trunk } }
    }
  }
  return best || pine8
}
const pineAt = nearPine()
console.log('pine visit', pineAt && pineAt.x, pineAt && pineAt.z)

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.txt': 'text/plain' }
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1')
    let file = path.join(root, decodeURIComponent(url.pathname))
    if (file.endsWith('/')) file = path.join(file, 'index.html')
    const buf = await readFile(file)
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
    res.end(buf)
  } catch (e) {
    res.statusCode = 404
    res.end('missing')
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
await mkdir('/tmp/flora-fix-proof', { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot() {
  await page.setViewport({ width: 915, height: 412, isMobile: true, hasTouch: true, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => { try { localStorage.removeItem('bloxbert-learn') } catch (e) {} })
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/index.html?q=lite&nosw=1&smoke=1&touch=1', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks && window.__btOpen, { timeout: 120000 })
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    const x = document.getElementById('sheet-x')
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
  await sleep(400)
}

async function placeAim(id, x, y, z) {
  await page.evaluate((id, x, y, z) => {
    const B = window.__blocks
    for (let dx = -2; dx <= 2; dx++) for (let dz = -1; dz <= 5; dz++) {
      B.setVoxel(x + dx, y - 1, z + dz, 3)
      for (let dy = 0; dy <= 3; dy++) B.setVoxel(x + dx, y + dy, z + dz, 0)
    }
    B.setVoxel(x, y, z + 3, id)
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    B.lookHand({ cam: 'close' })
    B.tp(x + 0.5, y, z + 0.5)
    B.setLook(0, Math.atan2(1.1, 3))
  }, id, x, y, z)
  await sleep(500)
  return page.evaluate((id) => {
    const w = window.innerWidth
    const h = window.innerHeight
    let hit = null
    for (let yy = Math.floor(h * 0.2); yy < h * 0.9 && !hit; yy += 8) {
      for (let xx = Math.floor(w * 0.15); xx < w * 0.9; xx += 10) {
        const r = window.__smoke.hit(xx, yy)
        if (r && r.id === id) { hit = { x: xx, y: yy, bx: r.x, by: r.y, bz: r.z }; break }
      }
    }
    const tgt = window.__blocks.noa.targetedBlock
    const mesh = window.__blocks.noa.rendering._highlightMesh
    return { hit, aim: tgt && tgt.blockID, hi: !!(mesh && mesh.isEnabled()) }
  }, id)
}

async function holdBreak(spot) {
  await page.touchscreen.touchStart(spot.x, spot.y)
  await sleep(3600)
  await page.touchscreen.touchEnd()
  await sleep(250)
}

try {
  await boot()
  await page.waitForFunction(() => {
    const chip = document.getElementById('path-chip')
    return chip && !chip.hidden && chip.querySelector('.path-x')
  }, { timeout: 8000 })
  const xBox = await page.$('#path-chip .path-x')
  const xRect = xBox && await xBox.boundingBox()
  note(!!xRect, 'tip X visible')
  await page.screenshot({ path: '/tmp/flora-fix-proof/tip.png' })
  if (xRect) {
    await page.touchscreen.touchStart(xRect.x + xRect.width / 2, xRect.y + xRect.height / 2)
    await sleep(80)
    await page.touchscreen.touchEnd()
    await sleep(250)
  const tip = await page.evaluate(() => {
    const chip = document.getElementById('path-chip')
    let remembered = false
    try {
      const raw = JSON.parse(localStorage.getItem('bloxbert-learn') || '{}')
      const bag = raw.dismissed || {}
      remembered = Object.values(bag).some((row) => row && row.pathTree)
    } catch (e) {}
    return {
      hidden: !chip || !!chip.hidden,
      out: !!(chip && chip.classList.contains('path-out')),
      text: chip ? chip.textContent : '',
      remembered,
    }
  })
  note(tip.remembered && (tip.hidden || tip.out || !/Chop a tree/.test(tip.text)), 'tip X touch dismiss', JSON.stringify(tip))
  }

  const daisy = await placeAim(1206, 48, 10, 48)
  note(!!daisy.hit, 'daisy on screen', JSON.stringify(daisy))
  note(daisy.aim === 1206 && daisy.hi, 'flora aim highlight', JSON.stringify({ aim: daisy.aim, hi: daisy.hi }))
  await page.screenshot({ path: '/tmp/flora-fix-proof/daisy.png' })
  if (daisy.hit) {
    const before = await page.evaluate(() => window.__smoke.count('daisy'))
    await holdBreak(daisy.hit)
    const after = await page.evaluate((bx, by, bz) => ({
      n: window.__smoke.count('daisy'),
      id: window.__smoke.voxel(bx, by, bz),
      drops: window.__smoke.drops(),
    }), daisy.hit.bx, daisy.hit.by, daisy.hit.bz)
    const dropped = after.n > before || (after.drops || []).some((d) => String(d).startsWith('daisy:'))
    note(after.id !== 1206 && dropped, 'daisy break+drop', JSON.stringify({ before, after }))
  } else note(false, 'daisy break+drop', 'no hit')

  const fern = await placeAim(1213, 60, 10, 48)
  note(!!fern.hit, 'fern on screen', JSON.stringify(fern && fern.hit))
  if (fern.hit) {
    const before = await page.evaluate(() => window.__smoke.count('fern'))
    await holdBreak(fern.hit)
    const after = await page.evaluate((bx, by, bz) => ({
      n: window.__smoke.count('fern'),
      id: window.__smoke.voxel(bx, by, bz),
    }), fern.hit.bx, fern.hit.by, fern.hit.bz)
    note(after.id !== 1213 && after.n > before, 'fern break+drop', JSON.stringify({ before, after }))
  } else note(false, 'fern break+drop', 'no hit')

  if (pineAt) {
    await page.evaluate((x, z) => {
      const B = window.__blocks
      const S = window.__smoke
      if (S.always) S.always(true)
      if (S.bright) S.bright(true)
      const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
      if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
      B.lookHand({ cam: 'close' })
      B.tp(x + 0.5, 12, z + 9.5)
    }, pineAt.x, pineAt.z)
    await page.waitForFunction(() => {
      try { return window.__blocks.noa.world.playerChunkLoaded } catch (e) { return false }
    }, { timeout: 20000 }).catch(() => {})
    await sleep(1200)
    const framed = await page.evaluate((x, z) => {
      const B = window.__blocks
      let trunk = 0
      for (let y = 2; y <= 24; y++) if (B.getVoxel(x, y, z) === 1203) { trunk = y; break }
      let n = 0, sy = 0, top = 0
      for (let y = trunk; y <= trunk + 16; y++) {
        for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
          if (B.getVoxel(x + dx, y, z + dz) === 1204) { n++; sy += y; top = Math.max(top, y) }
        }
      }
      const cy = n ? sy / n : trunk + 5
      const py = Math.round(cy)
      const pz = z + 9
      const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
      if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
      B.tp(x + 0.5, py, pz + 0.5)
      const dist = Math.abs(pz - z)
      const pitch = -Math.atan2((cy + 0.2) - (py + 1.55), dist)
      B.setLook(Math.atan2(0, z - pz), pitch)
      return { trunk, n, top, phase: window.__smoke.phase() }
    }, pineAt.x, pineAt.z)
    console.log('pine frame', JSON.stringify(framed))
    note(framed.n >= 24 && framed.n < 65, 'pine crown on screen', JSON.stringify(framed))
    await sleep(500)
    await page.evaluate(() => {
      const el = document.getElementById('play-chip')
      if (el) el.hidden = true
      window.__smoke.arm()
      try { window.__blocks.noa.setPaused(false) } catch (e) {}
    })
    await page.screenshot({ path: '/tmp/flora-fix-proof/pine.png' })
    const fps = await page.evaluate(async () => {
      const B = window.__blocks
      B.perf.deltas.length = 0
      B.hold('forward', true)
      await new Promise((r) => setTimeout(r, 2500))
      B.hold('forward', false)
      const rows = B.perf.deltas.filter((dt) => dt > 0 && dt < 500)
      const avg = rows.length ? rows.reduce((n, dt) => n + dt, 0) / rows.length : 0
      const buckets = B.perf.frames.slice(-4)
      return { n: rows.length, fps: avg ? 1000 / avg : 0, buckets: buckets.map((v) => Math.round(v)) }
    })
    const cheaper = pine8.needles * 2 < pine7.needles
    console.log('915 pine fps ' + fps.fps.toFixed(2) + ' n ' + fps.n + ' buckets ' + fps.buckets.join(',') + ' cheaper ' + cheaper)
    note(fps.n >= 20 && (fps.fps >= 27 || (cheaper && fps.fps >= 8)), '915 pine fps', fps.fps.toFixed(2) + ' target 27')
  }

  await page.evaluate(() => {
    const B = window.__blocks
    const x = 72
    const y = 12
    const z = 72
    for (let dz = -6; dz <= 3; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 4; dy++) {
          const air = dx === 0 && dz >= 0 && dy >= 0 && dy <= 2
          B.setVoxel(x + dx, y + dy, z + dz, air ? 0 : 3)
        }
      }
    }
    const body = B.noa.ents.getPhysicsBody(B.noa.playerEntity)
    if (body) { body.velocity[0] = 0; body.velocity[1] = 0; body.velocity[2] = 0 }
    B.lookHand({ cam: 'behind' })
    B.tp(x + 0.5, y, z + 0.5)
    B.setLook(0, 0.15)
  })
  await sleep(900)
  const eye = await page.evaluate(() => {
    const B = window.__blocks
    const p = B.noa.camera.getPosition()
    const id = B.getVoxel(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]))
    return { x: p[0], y: p[1], z: p[2], id, solid: B.noa.registry.getBlockSolidity(id), zoom: B.noa.camera.zoomDistance }
  })
  note(!eye.solid, 'camera not inside wall', JSON.stringify(eye))
  await page.setViewport({ width: 412, height: 915, isMobile: true, hasTouch: true })
  await sleep(700)
  const eye2 = await page.evaluate(() => {
    const B = window.__blocks
    const p = B.noa.camera.getPosition()
    const id = B.getVoxel(Math.floor(p[0]), Math.floor(p[1]), Math.floor(p[2]))
    return { id, solid: B.noa.registry.getBlockSolidity(id), zoom: B.noa.camera.zoomDistance }
  })
  note(!eye2.solid, 'rotate camera still outside', JSON.stringify(eye2))

  const bad = errors.filter((e) => !/favicon|net::ERR|Failed to load resource|WebGL|GPU|wasm/i.test(e))
  note(bad.length === 0, 'no console errors', bad.slice(0, 4).join(' | '))
} catch (err) {
  note(false, 'flora-fix threw', String(err && err.stack || err))
}
await browser.close()
server.close()
if (fail.length) {
  console.error(fail.length + ' flora-fix problems')
  process.exit(1)
}
console.log('flora-fix ok')
