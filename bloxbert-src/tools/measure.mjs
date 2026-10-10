// Headless Chrome measurement: first-load bytes, first frame, fps with CPU throttled 4x, save/load round-trip.
// --route tools/walk-route.json walks a fixed hill path and reports fps, p95, and long tasks.
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'fs'
const argv = process.argv.slice(2)
let routeFile = ''
const rest = []
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--route') routeFile = argv[++i] || ''
  else rest.push(argv[i])
}
const URL0 = rest[0] || 'http://127.0.0.1:8870/'
const TAG = rest[2] || ''; const OUT = 'measure' + (TAG ? '/' + TAG : ''); mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const ROUTE = routeFile ? JSON.parse(readFileSync(routeFile, 'utf8')) : null
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome'].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')
const ALL = {
  '1366x768': { name: '1366x768', width: 1366, height: 768, mobile: false, q: '', rate: 4 },
  '1366x768-scale75': { name: '1366x768-scale75', width: 1366, height: 768, mobile: false, q: '?scale=0.75', rate: 4 },
  '1366x768-nothrottle': { name: '1366x768-nothrottle', width: 1366, height: 768, mobile: false, q: '', rate: 1 },
  '1366x768-scale1': { name: '1366x768-scale1', width: 1366, height: 768, mobile: false, q: '?scale=1', rate: 4 },
  '1920x1080': { name: '1920x1080', width: 1920, height: 1080, mobile: false, q: '', rate: 4 },
  '412x915': { name: '412x915', width: 412, height: 915, mobile: true, q: '?touch=1', rate: 4 },
  '1366-auto': { name: '1366-auto', width: 1366, height: 768, mobile: false, q: '?q=auto', rate: 4 },
  '1366-lite': { name: '1366-lite', width: 1366, height: 768, mobile: false, q: '?q=lite', rate: 4 },
  '1366-full': { name: '1366-full', width: 1366, height: 768, mobile: false, q: '?q=full', rate: 4 },
  '412-auto': { name: '412-auto', width: 412, height: 915, mobile: true, q: '?q=auto', rate: 4 },
  '412-lite': { name: '412-lite', width: 412, height: 915, mobile: true, q: '?q=lite', rate: 4 },
  '412-full': { name: '412-full', width: 412, height: 915, mobile: true, q: '?q=full', rate: 4 },
  '915-auto': { name: '915-auto', width: 915, height: 412, mobile: true, q: '?q=auto', rate: 4 },
  '915x412': { name: '915x412', width: 915, height: 412, mobile: true, q: '', rate: 4 },
}
const VPS = (rest[1] || '1366x768,412x915').split(',').map((k) => ALL[k])
const results = {}
const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
for (const vp of VPS) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.setDefaultTimeout(120000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 })
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true })) } catch (e) {}
    try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
  })
  const cdp = await page.createCDPSession()
  await cdp.send('Network.enable'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true })
  let bytes = 0; const files = {}
  cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength })
  cdp.on('Network.responseReceived', (e) => { files[e.requestId] = e.response.url })
  cdp.on('Network.loadingFinished', (e) => { if (files[e.requestId]) files[e.requestId] = [files[e.requestId], e.encodedDataLength] })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: vp.rate })
  const t0 = Date.now()
  await page.goto(URL0 + vp.q, { waitUntil: 'load' })
  await page.waitForFunction(() => window.__blocks && window.__blocks.perf.first > 0, { timeout: 60000 })
  const firstFrame = await page.evaluate(() => window.__blocks.perf.first)
  await page.waitForFunction(() => window.__blocks.perf.firstChunk > 0, { timeout: 60000 }).catch(() => {})
  const firstChunk = await page.evaluate(() => window.__blocks.perf.firstChunk)
  const navTiming = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd) } })
  // wait for chunks to mesh
  await page.waitForFunction(() => window.__blocks.noa.world._chunksKnown.count() >= 8, { timeout: 60000 }).catch(() => {})
  await sleep(4000)
  const gl = await page.evaluate(() => { const c = document.querySelector('canvas'); const g = c.getContext('webgl2') || c.getContext('webgl'); const d = g && g.getExtension('WEBGL_debug_renderer_info'); return { webgl2: !!c.getContext('webgl2'), renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : '?' } })
  const loadedAt = Date.now() - t0
  const firstBytes = bytes
  await page.screenshot({ path: `${OUT}/${vp.name}-1-start.png` })
  let built = { placed: 0, broken: 0 }
  let mark
  let routeReport = null
  if (!ROUTE) {
    built = await page.evaluate(async () => {
      const B = window.__blocks; const noa = B.noa
      B.setLook(noa.camera.heading, 0.75)
      let placed = 0, broken = 0
      const ids = [8, 9, 10, 13, 14, 15, 16, 20]
      for (let i = 0; i < 24; i++) {
        B.pick(ids[i % ids.length]); if (B.placeBlock()) placed++
        await new Promise((r) => setTimeout(r, 60))
        if (i % 6 === 5) { B.turn(0.35); await new Promise((r) => setTimeout(r, 120)) }
      }
      for (let i = 0; i < 4; i++) { if (B.breakBlock()) broken++; await new Promise((r) => setTimeout(r, 80)) }
      return { placed, broken }
    })
    mark = await page.evaluate(() => { const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity); const m = [Math.floor(p[0]) + 3, 9, Math.floor(p[2]) + 3]; window.__blocks.setVoxel(m[0], m[1], m[2], 15); return m })
    await sleep(1500)
  }
  await page.screenshot({ path: `${OUT}/${vp.name}-2-built.png` })
  let walk
  let levelWalk0
  if (ROUTE) {
    routeReport = await page.evaluate(async (route) => {
      const B = window.__blocks
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
      const holes = () => {
        const noa = B.noa
        const p = noa.entities.getPosition(noa.playerEntity)
        const S = 24
        const ci = Math.floor(p[0] / S)
        const cj = Math.floor(p[1] / S)
        const ck = Math.floor(p[2] / S)
        let missing = 0
        for (let di = -1; di <= 1; di++) for (let dk = -1; dk <= 1; dk++) for (let dj = -1; dj <= 1; dj++) {
          if (Math.abs(dj) > 1) continue
          if (di * di + dj * dj + dk * dk > 2.25) continue
          if (!noa.world._storage.getChunkByIndexes(ci + di, cj + dj, ck + dk)) missing++
        }
        return missing
      }
      const sheet = document.getElementById('sheet')
      const sheetX = document.getElementById('sheet-x')
      if (sheet && !sheet.hidden && sheetX) sheetX.click()
      if (B.noa._paused) B.noa.setPaused(false)
      B.tp(route.start[0], route.start[1], route.start[2])
      B.setLook(route.heading || 0, route.pitch || 0.2)
      let settled = false
      for (let i = 0; i < 80; i++) {
        if (holes() === 0) { settled = true; break }
        await sleep(100)
      }
      B.perf.frames.length = 0
      B.perf.deltas.length = 0
      B.perf.jsMs.length = 0
      const longs = []
      let obs = null
      try {
        obs = new PerformanceObserver((list) => {
          for (const e of list.getEntries()) if (e.duration > 200) longs.push(e.duration)
        })
        obs.observe({ type: 'longtask', buffered: false })
      } catch (e) {}
      const names = ['forward', 'backward', 'left', 'right', 'jump']
      const t0 = performance.now()
      let step = 0
      let maxHole = 0
      const limit = route.ms || 30000
      while (performance.now() - t0 < limit) {
        const t = performance.now() - t0
        while (step + 1 < route.steps.length && route.steps[step + 1].t <= t) step++
        const st = route.steps[step] || {}
        for (const name of names) B.hold(name, !!(st.hold && st.hold.indexOf(name) >= 0))
        if (st.heading != null) B.setLook(st.heading, route.pitch || 0.2)
        const hole = holes()
        if (hole > maxHole) maxHole = hole
        await sleep(100)
      }
      for (const name of names) B.hold(name, false)
      if (obs) obs.disconnect()
      const d = B.perf.deltas.slice()
      const longD = d.filter((x) => x > 200)
      const longMax = Math.max(0, ...longD, ...longs)
      return {
        fps: B.perf.frames.slice(1), d, js: B.perf.jsMs.slice(),
        longTasks: longD.length + longs.length, longMax, holes: maxHole, settled,
        pos: B.noa.entities.getPosition(B.noa.playerEntity).slice(),
      }
    }, ROUTE)
    walk = routeReport
    levelWalk0 = await page.evaluate(() => window.__blocks.perf.level ? window.__blocks.perf.level() : null)
    const d = routeReport.d || []
    const sorted = d.slice().sort((a, b) => a - b)
    const p95 = sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] : null
    console.log(vp.name, 'route-live', JSON.stringify({ fps: routeReport.fps, p95, longTasks: routeReport.longTasks, longMax: routeReport.longMax, holes: routeReport.holes, settled: routeReport.settled, frames: d.length, maxDelta: sorted.length ? sorted[sorted.length - 1] : 0, pos: routeReport.pos }))
  } else {
    await page.evaluate(() => { window.__blocks.perf.frames.length = 0; window.__blocks.perf.deltas.length = 0; window.__blocks.perf.jsMs.length = 0; window.__blocks.hold('forward', true); window.__walkT = setInterval(() => window.__blocks.turn(0.04), 100) })
    levelWalk0 = await page.evaluate(() => window.__blocks.perf.level ? window.__blocks.perf.level() : null)
    await sleep(9000)
    walk = await page.evaluate(() => { clearInterval(window.__walkT); window.__blocks.hold('forward', false); return { fps: window.__blocks.perf.frames.slice(1), d: window.__blocks.perf.deltas.slice(), js: window.__blocks.perf.jsMs.slice() } })
  }
  // fps standing still building view for 6 s
  await page.evaluate(() => { window.__blocks.perf.frames.length = 0; window.__blocks.perf.deltas.length = 0; window.__blocks.perf.jsMs.length = 0 })
  await sleep(6000)
  const levelEnd = await page.evaluate(() => window.__blocks.perf.level ? window.__blocks.perf.level() : null)
  const steps = await page.evaluate(() => window.__blocks.perf.steps ? window.__blocks.perf.steps.map((s) => ({ atMsAfterFirstFrame: Math.round(s.at - window.__blocks.perf.first), level: s.level })) : null)
  const idle = await page.evaluate(() => ({ fps: window.__blocks.perf.frames.slice(1), d: window.__blocks.perf.deltas.slice(), js: window.__blocks.perf.jsMs.slice() }))
  if (!mark) mark = await page.evaluate(() => { const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity); const m = [Math.floor(p[0]) + 3, Math.floor(p[1]) + 2, Math.floor(p[2]) + 3]; window.__blocks.setVoxel(m[0], m[1], m[2], 15); return m })
  try {
    await page.click('#menu-btn')
    await sleep(400)
    await page.screenshot({ path: `${OUT}/${vp.name}-3-menu.png` })
    await page.keyboard.press('Escape')
  } catch (e) {
    console.log(vp.name, 'menu skip', e.message)
  }
  // save + reload round trip
  const saveBytes = await page.evaluate(() => window.__blocks.save())
  const saveCheck = await page.evaluate(() => { const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity); return [Math.floor(p[0]), Math.floor(p[2])] })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await page.reload({ waitUntil: 'load' })
  await page.waitForFunction(() => window.__blocks && window.__blocks.perf.first > 0, { timeout: 60000 })
  await sleep(3000)
  await page.evaluate((m) => window.__blocks.noa.entities.setPosition(window.__blocks.noa.playerEntity, [m[0] + 0.5, 12, m[2] - 3.5]), mark)
  await page.waitForFunction((m) => window.__blocks.noa.getBlock(m[0], m[1], m[2]) === 15, { timeout: 20000 }, mark).catch(() => {})
  const restored = await page.evaluate((m) => {
    const el = document.getElementById('save-state')
    return { markBlockAfterReload: window.__blocks.noa.getBlock(m[0], m[1], m[2]), expected: 15, state: el ? el.textContent : '' }
  }, mark)
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length / 2)].toFixed(1) : null }
  const min = (a) => a.length ? +Math.min(...a).toFixed(1) : null
  const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : null }
  const stats = (o) => ({ fpsMedian: med(o.fps), fpsMin: min(o.fps), fpsPerSecond: o.fps.map((x) => +x.toFixed(1)), frameMsP50: o.d.length ? +pct(o.d, 0.5).toFixed(1) : null, frameMsP95: o.d.length ? +pct(o.d, 0.95).toFixed(1) : null, over33ms: o.d.filter((x) => x > 33.4).length, frames: o.d.length, renderJsMsP50: o.js && o.js.length ? +pct(o.js, 0.5).toFixed(2) : null, renderJsMsP95: o.js && o.js.length ? +pct(o.js, 0.95).toFixed(2) : null })
  const firstPlayable = Math.round(firstChunk || firstFrame)
  results[vp.name] = {
    gl, firstLoadBytes: firstBytes, reloadBytes: bytes - firstBytes, files: Object.values(files).filter(Array.isArray), firstFrameMs: Math.round(firstFrame), firstChunkMs: Math.round(firstChunk), firstPlayable, navTiming, readyMs: loadedAt,
    built, fpsWalk: stats(walk), fpsIdle: stats(idle),
    route: routeReport ? { longTasks: routeReport.longTasks, longMax: routeReport.longMax, holes: routeReport.holes, settled: routeReport.settled, p95: stats(walk).frameMsP95, pos: routeReport.pos } : null,
    levelWalk0, levelEnd, steps, saveBytes, afterReload: restored, errors: errs,
  }
  console.log(vp.name, JSON.stringify({ firstBytes, firstFrame: Math.round(firstFrame), firstChunk: Math.round(firstChunk), firstPlayable, navTiming, walk: stats(walk), idle: stats(idle), route: results[vp.name].route, levelWalk0, levelEnd, steps, built, saveBytes, restored, errs: errs.length, gl }))
  await ctx.close()
}
writeFileSync(`${OUT}/results-${VPS.map((v) => v.name).join('+')}.json`, JSON.stringify(results, null, 2))
await browser.close()
