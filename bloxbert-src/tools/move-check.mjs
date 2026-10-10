// PC auto-step, saved climb migration, underwater view, and pitch clamp.
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync, writeFileSync } from 'fs'

const chrome = ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome'].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')
const URL = process.argv[2] || 'http://127.0.0.1:8875/blocks-test/?smoke=1'
const out = '/tmp/move-check'
mkdirSync(out, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const report = { steps: [], errors: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 500) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 240) : ''))
  if (!ok && !report.fail) report.fail = name
  return ok
}
const maxP = 85 * Math.PI / 180

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

async function makePage(w, h, touch, seed) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  const errs = []
  page.on('pageerror', (e) => errs.push('page:' + e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  if (seed) await page.evaluateOnNewDocument((saved) => {
    if (sessionStorage.getItem('move-seeded')) return
    localStorage.setItem('bloxbert-look', JSON.stringify(saved))
    sessionStorage.setItem('move-seeded', '1')
  }, seed)
  await page.setViewport({ width: w, height: h, isMobile: !!touch, hasTouch: !!touch, deviceScaleFactor: touch ? 2 : 1 })
  const q = touch ? '&touch=1' : ''
  await page.goto(URL + q, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__blocks.perf && window.__blocks.perf.first > 0, { timeout: 60000 })
  await page.waitForFunction(() => window.__blocks.noa.world.playerChunkLoaded, { timeout: 30000 }).catch(() => {})
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    const x = document.getElementById('sheet-x')
    if (sheet && !sheet.hidden && x) x.click()
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    document.body.classList.remove('menu-open')
  })
  return { ctx, page, errs }
}

async function goHill(page) {
  await page.evaluate(() => {
    window.__blocks.tp(110.5, 24, 116.5)
    window.__blocks.setLook(0, 0.2)
    window.__blocks.noa.setPaused(false)
  })
  await page.waitForFunction(() => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    return window.__blocks.noa.world.playerChunkLoaded && p[1] < 20 && p[1] > 2
  }, { timeout: 20000 })
  await sleep(300)
}

async function flatten(page) {
  return page.evaluate(() => {
    const B = window.__blocks
    const p = B.noa.entities.getPosition(B.noa.playerEntity)
    const x0 = Math.floor(p[0])
    const z0 = Math.floor(p[2])
    let gy = Math.floor(p[1])
    while (gy > 0 && !B.getVoxel(x0, gy, z0)) gy--
    const ops = []
    for (let x = x0 - 2; x <= x0 + 2; x++) {
      for (let z = z0 - 1; z <= z0 + 6; z++) {
        ops.push([x, gy, z, 3])
        for (let y = 1; y <= 4; y++) ops.push([x, gy + y, z, 0])
      }
    }
    B.applyEdit(ops)
    B.tp(x0 + 0.5, gy + 1.05, z0 + 0.5)
    B.setLook(0, 0.15)
    B.noa.setPaused(false)
    return { x0, z0, ground: gy }
  })
}

async function holdW(page, ms) {
  await page.focus('canvas')
  await page.keyboard.down('KeyW')
  await sleep(ms)
  await page.keyboard.up('KeyW')
  await page.evaluate(() => { window.__blocks.hold('forward', false) })
}

async function placeStep(page, spot, tall) {
  await page.evaluate((spot, tall) => {
    const ops = []
    const z1 = tall > 1 ? spot.z0 + 2 : spot.z0 + 6
    for (let z = spot.z0 + 2; z <= z1; z++) {
      for (let x = spot.x0 - 2; x <= spot.x0 + 2; x++) {
        for (let h = 1; h <= 4; h++) ops.push([x, spot.ground + h, z, h <= tall ? 3 : 0])
      }
    }
    window.__blocks.applyEdit(ops)
    window.__blocks.tp(spot.x0 + 0.5, spot.ground + 1.05, spot.z0 + 0.5)
    window.__blocks.setLook(0, 0.15)
    window.__blocks.noa.setPaused(false)
  }, spot, tall)
  await sleep(250)
}

try {
  const pc = await makePage(1366, 768, false, null)
  const climb0 = await pc.page.evaluate(() => window.__blocks.climb)
  note('fresh climb default', climb0 === true, String(climb0))
  await goHill(pc.page)
  const spot = await flatten(pc.page)
  await placeStep(pc.page, spot, 1)
  const y0 = await pc.page.evaluate(() => window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)[1])
  await holdW(pc.page, 1000)
  const onLedge = await pc.page.evaluate((ground, z0) => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    return { y: p[1], z: p[2], on: p[1] >= ground + 1.8 && p[2] > z0 + 2 }
  }, spot.ground, spot.z0)
  note('1-block ledge', onLedge.on, JSON.stringify({ y0, ...onLedge, ground: spot.ground }))

  await placeStep(pc.page, spot, 2)
  await holdW(pc.page, 1000)
  const wall = await pc.page.evaluate((ground) => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    return { y: p[1], z: p[2], stopped: p[1] < ground + 1.7 }
  }, spot.ground)
  note('2-block wall stops', wall.stopped, JSON.stringify({ ...wall, ground: spot.ground }))

  const fogBefore = await pc.page.evaluate(() => {
    const s = window.__blocks.noa.rendering.getScene()
    return { start: s.fogStart, end: s.fogEnd, r: s.fogColor.r, g: s.fogColor.g, b: s.fogColor.b }
  })
  const dunk = await pc.page.evaluate((spot) => {
    const B = window.__blocks
    const x = spot.x0
    const z = spot.z0 + 5
    const gy = spot.ground
    const ops = []
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      ops.push([x + dx, gy, z + dz, 3])
      ops.push([x + dx, gy + 1, z + dz, 64])
      ops.push([x + dx, gy + 2, z + dz, 64])
      ops.push([x + dx, gy + 3, z + dz, 0])
    }
    B.applyEdit(ops)
    B.tp(x + 0.5, gy + 1.05, z + 0.5)
    B.setLook(0, 0.35)
    return { x, z, gy }
  }, spot)
  await sleep(400)
  await pc.page.screenshot({ path: out + '/under.png' })
  const wet = await pc.page.evaluate(() => {
    const s = window.__blocks.noa.rendering.getScene()
    const uw = document.getElementById('uw')
    const mat = s.materials.find((m) => m.name === 'shape-water')
    const eye = window.__blocks.noa.camera.getPosition()
    const block = window.__blocks.getVoxel(Math.floor(eye[0]), Math.floor(eye[1]), Math.floor(eye[2]))
    const st = uw ? getComputedStyle(uw) : null
    return {
      shown: !!(uw && !uw.hidden),
      pe: st ? st.pointerEvents : '',
      fogEnd: s.fogEnd, fogStart: s.fogStart,
      color: [s.fogColor.r, s.fogColor.g, s.fogColor.b],
      cull: !!(mat && mat.backFaceCulling),
      block, eye: eye.slice(),
    }
  })
  note('underwater view', wet.shown && wet.fogEnd === 12 && wet.fogStart === 0 && wet.cull && wet.block === 64 && wet.pe === 'none', JSON.stringify(wet))

  await pc.page.evaluate((dunk) => {
    const B = window.__blocks
    const x = dunk.x
    const z = dunk.z
    const gy = dunk.gy
    const ops = []
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
      ops.push([x + dx, gy + 6, z + dz, 3])
      ops.push([x + dx, gy + 7, z + dz, 0])
      ops.push([x + dx, gy + 8, z + dz, 0])
    }
    B.applyEdit(ops)
    B.tp(x + 0.5, gy + 7.05, z + 0.5)
    B.setLook(0, 0.2)
    B.noa.setPaused(false)
  }, dunk)
  await sleep(400)
  await pc.page.screenshot({ path: out + '/above.png' })
  const dry = await pc.page.evaluate(() => {
    const s = window.__blocks.noa.rendering.getScene()
    const uw = document.getElementById('uw')
    return { shown: !!(uw && !uw.hidden), fogEnd: s.fogEnd, fogStart: s.fogStart, color: [s.fogColor.r, s.fogColor.g, s.fogColor.b] }
  })
  const fogBack = !dry.shown && Math.abs(dry.fogEnd - fogBefore.end) < 0.01 && dry.color[2] > 0.7
  note('leave water', fogBack, JSON.stringify({ before: fogBefore, dry }))

  async function dragPitch(page, dy) {
    return page.evaluate(async (dy) => {
      const noa = window.__blocks.noa
      const B = window.__blocks
      if (window.__smoke && window.__smoke.arm) window.__smoke.arm()
      noa.setPaused(false)
      try { if (noa.container._shell) noa.container._shell.stickyPointerLock = false } catch (e) {}
      try { noa.container.setPointerLock(false) } catch (e) {}
      try { if (document.pointerLockElement) document.exitPointerLock() } catch (e) {}
      const unlockAt = performance.now()
      while ((document.pointerLockElement || (noa.container && noa.container.hasPointerLock)) && performance.now() - unlockAt < 800) {
        await new Promise((r) => requestAnimationFrame(r))
      }
      B.setLook(0, 0)
      const c = document.querySelector('canvas')
      const locked = !!(document.pointerLockElement || (noa.container && noa.container.hasPointerLock))
      if (locked) {
        const move = () => document.dispatchEvent(new MouseEvent('mousemove', {
          bubbles: true, movementX: 0, movementY: dy * 5, clientX: 480, clientY: 300,
        }))
        move()
        move()
      } else {
        const id = 7
        const fire = (type, y) => c.dispatchEvent(new PointerEvent(type, {
          bubbles: true, cancelable: true, clientX: 480, clientY: y, pointerId: id,
          button: 0, buttons: type === 'pointerup' ? 0 : 1, pointerType: 'mouse', isPrimary: true,
        }))
        fire('pointerdown', 300)
        fire('pointermove', 300 + dy)
        fire('pointerup', 300 + dy)
      }
      const dragged = noa.camera.pitch
      const max = 85 * Math.PI / 180
      const sign = dragged < 0 ? -1 : 1
      noa.camera.pitch = sign * 1.7
      noa.camera.sensitivityMult = 0
      noa.camera.sensitivityMultOutsidePointerlock = 0
      noa.inputs.pointerState.dx = 0
      noa.inputs.pointerState.dy = 0
      const t0 = performance.now()
      let pitch = noa.camera.pitch
      while (performance.now() - t0 < 2000) {
        await new Promise((r) => requestAnimationFrame(r))
        pitch = noa.camera.pitch
        if (Math.abs(Math.abs(pitch) - max) < 0.03) break
      }
      return { pitch, dragged, locked, dir: noa.camera.getDirection().slice() }
    }, dy)
  }
  const up = await dragPitch(pc.page, -900)
  const upOk = Math.abs(Math.abs(up.pitch) - maxP) < 0.03 && up.pitch < 0 && up.dragged < -1 && Math.abs(up.dir[1]) <= Math.sin(maxP) + 0.02
  note('pitch clamp', upOk, JSON.stringify(up))
  await pc.page.evaluate(() => {
    if (window.__btOpen) window.__btOpen('settings')
  })
  await sleep(250)
  const toggled = await pc.page.evaluate(() => {
    const b = [...document.querySelectorAll('#sheet button')].find((el) => (el.textContent || '').indexOf('Invert look') >= 0)
    if (b) b.click()
    const x = document.getElementById('sheet-x')
    if (x) x.click()
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    return !!(b)
  })
  const down = await dragPitch(pc.page, -900)
  const downOk = Math.abs(Math.abs(down.pitch) - maxP) < 0.03 && down.pitch > 0 && down.dragged > 1 && Math.abs(down.dir[1]) <= Math.sin(maxP) + 0.02
  note('pitch clamp invert', toggled && downOk, JSON.stringify(down))

  const frames = await pc.page.evaluate(() => new Promise((resolve) => {
    const n0 = window.__blocks.perf.frames.length
    const t0 = performance.now()
    const wait = () => {
      if (performance.now() - t0 > 4000 && window.__blocks.perf.frames.length > n0) resolve(window.__blocks.perf.frames.slice(n0))
      else setTimeout(wait, 200)
    }
    wait()
  }))
  const fps = frames.length ? frames[frames.length - 1] : 0
  note('1366 renders', fps > 1 && pc.errs.length === 0, JSON.stringify({ fps, errs: pc.errs.length }))
  report.fps1366 = fps
  report.errors.push(...pc.errs)
  await pc.ctx.close()

  const old = await makePage(1366, 768, false, { climb: false, sens: 1, invert: false, wide: false })
  const migrated = await old.page.evaluate(() => window.__blocks.climb)
  note('old climb:false ignored', migrated === true, String(migrated))
  await old.page.evaluate(() => { if (window.__btOpen) window.__btOpen('settings') })
  await sleep(300)
  const off = await old.page.evaluate(() => {
    const b = [...document.querySelectorAll('#sheet button')].find((el) => (el.textContent || '').indexOf('Auto-climb') >= 0)
    if (!b) return { clicked: false }
    b.click()
    const saved = JSON.parse(localStorage.getItem('bloxbert-look') || '{}')
    const x = document.getElementById('sheet-x')
    if (x) x.click()
    return { clicked: true, text: b.textContent, saved, climb: window.__blocks.climb }
  })
  note('settings turns climb off', off.clicked && off.climb === false && off.saved && off.saved.cv === 2 && off.saved.climb === false, JSON.stringify(off))
  await old.page.reload({ waitUntil: 'domcontentloaded' })
  await old.page.waitForFunction(() => window.__blocks && window.__blocks.climb === false, { timeout: 30000 }).catch(() => {})
  await old.page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    const x = document.getElementById('sheet-x')
    if (sheet && !sheet.hidden && x) x.click()
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
  })
  const stayed = await old.page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('bloxbert-look') || '{}')
    return { climb: window.__blocks.climb, saved }
  })
  note('climb stays off', stayed.climb === false && stayed.saved && stayed.saved.cv === 2 && stayed.saved.climb === false, JSON.stringify(stayed))
  await goHill(old.page)
  const spot2 = await flatten(old.page)
  await placeStep(old.page, spot2, 1)
  await holdW(old.page, 1000)
  const stuck = await old.page.evaluate((ground, z0) => {
    const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity)
    return { y: p[1], z: p[2], low: p[1] < ground + 1.7 && p[2] < z0 + 2.2 }
  }, spot2.ground, spot2.z0)
  note('off means no step', stuck.low, JSON.stringify({ ...stuck, ground: spot2.ground }))
  report.errors.push(...old.errs)
  await old.ctx.close()

  for (const vp of [{ name: '915x412', w: 915, h: 412, touch: true }, { name: '412x915', w: 412, h: 915, touch: true }]) {
    const tab = await makePage(vp.w, vp.h, vp.touch, null)
    const info = await tab.page.evaluate(() => ({
      climb: window.__blocks.climb,
      uw: !!document.getElementById('uw'),
    }))
    const paused = await tab.page.evaluate(() => window.__blocks.noa._paused)
    note(vp.name + ' boots', info.climb === true && info.uw && tab.errs.length === 0 && paused === false, JSON.stringify({ ...info, paused, errs: tab.errs }))
    report.errors.push(...tab.errs)
    await tab.ctx.close()
  }
} catch (err) {
  note('move-check crashed', false, err && err.stack ? err.stack : String(err))
}

writeFileSync(out + '/report.json', JSON.stringify(report, null, 2))
console.log(report.fail ? 'FAIL ' + report.fail : 'PASS move-check')
await browser.close()
process.exit(report.fail ? 1 : 0)
