// Headless Chrome measurement: first-load bytes, first frame, fps with CPU throttled 4x, save/load round-trip.
import puppeteer from 'puppeteer-core'
import { writeFileSync, mkdirSync } from 'fs'
const URL0 = process.argv[2] || 'http://127.0.0.1:8870/'
const TAG = process.argv[4] || ''; const OUT = 'measure' + (TAG ? '/' + TAG : ''); mkdirSync(OUT, { recursive: true })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
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
}
const VPS = (process.argv[3] || '1366x768,412x915').split(',').map((k) => ALL[k])
const results = {}
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
})
for (const vp of VPS) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: vp.mobile ? 2 : 1 })
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
  // build: look down a bit, place a small wall of blocks, break some
  const built = await page.evaluate(async () => {
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
  // also a known voxel via setVoxel for the save check
  const mark = await page.evaluate(() => { const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity); const m = [Math.floor(p[0]) + 3, 9, Math.floor(p[2]) + 3]; window.__blocks.setVoxel(m[0], m[1], m[2], 15); return m })
  await sleep(1500)
  await page.screenshot({ path: `${OUT}/${vp.name}-2-built.png` })
  // fps while walking + turning for 10 s
  await page.evaluate(() => { window.__blocks.perf.frames.length = 0; window.__blocks.perf.deltas.length = 0; window.__blocks.perf.jsMs.length = 0; window.__blocks.hold('forward', true); window.__walkT = setInterval(() => window.__blocks.turn(0.04), 100) })
  const levelWalk0 = await page.evaluate(() => window.__blocks.perf.level ? window.__blocks.perf.level() : null)
  await sleep(9000)
  const walk = await page.evaluate(() => { clearInterval(window.__walkT); window.__blocks.hold('forward', false); return { fps: window.__blocks.perf.frames.slice(1), d: window.__blocks.perf.deltas.slice(), js: window.__blocks.perf.jsMs.slice() } })
  // fps standing still building view for 6 s
  await page.evaluate(() => { window.__blocks.perf.frames.length = 0; window.__blocks.perf.deltas.length = 0; window.__blocks.perf.jsMs.length = 0 })
  await sleep(6000)
  const levelEnd = await page.evaluate(() => window.__blocks.perf.level ? window.__blocks.perf.level() : null)
  const steps = await page.evaluate(() => window.__blocks.perf.steps ? window.__blocks.perf.steps.map((s) => ({ atMsAfterFirstFrame: Math.round(s.at - window.__blocks.perf.first), level: s.level })) : null)
  const idle = await page.evaluate(() => ({ fps: window.__blocks.perf.frames.slice(1), d: window.__blocks.perf.deltas.slice(), js: window.__blocks.perf.jsMs.slice() }))
  // menu shot
  await page.click('#menu-btn'); await sleep(400)
  await page.screenshot({ path: `${OUT}/${vp.name}-3-menu.png` })
  await page.keyboard.press('Escape')
  // save + reload round trip
  const saveBytes = await page.evaluate(() => window.__blocks.save())
  const saveCheck = await page.evaluate(() => { const p = window.__blocks.noa.entities.getPosition(window.__blocks.noa.playerEntity); return [Math.floor(p[0]), Math.floor(p[2])] })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await page.reload({ waitUntil: 'load' })
  await page.waitForFunction(() => window.__blocks && window.__blocks.perf.first > 0, { timeout: 60000 })
  await sleep(3000)
  await page.evaluate((m) => window.__blocks.noa.entities.setPosition(window.__blocks.noa.playerEntity, [m[0] + 0.5, 12, m[2] - 3.5]), mark)
  await page.waitForFunction((m) => window.__blocks.noa.getBlock(m[0], m[1], m[2]) === 15, { timeout: 20000 }, mark).catch(() => {})
  const restored = await page.evaluate((m) => ({ markBlockAfterReload: window.__blocks.noa.getBlock(m[0], m[1], m[2]), expected: 15, state: document.getElementById('save-state').textContent }), mark)
  const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? +s[Math.floor(s.length / 2)].toFixed(1) : null }
  const min = (a) => a.length ? +Math.min(...a).toFixed(1) : null
  const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * q))] : null }
  const stats = (o) => ({ fpsMedian: med(o.fps), fpsMin: min(o.fps), fpsPerSecond: o.fps.map((x) => +x.toFixed(1)), frameMsP50: +pct(o.d, 0.5).toFixed(1), frameMsP95: +pct(o.d, 0.95).toFixed(1), over33ms: o.d.filter((x) => x > 33.4).length, frames: o.d.length, renderJsMsP50: +pct(o.js, 0.5).toFixed(2), renderJsMsP95: +pct(o.js, 0.95).toFixed(2) })
  results[vp.name] = {
    gl, firstLoadBytes: firstBytes, reloadBytes: bytes - firstBytes, files: Object.values(files).filter(Array.isArray), firstFrameMs: Math.round(firstFrame), firstChunkMs: Math.round(firstChunk), navTiming, readyMs: loadedAt,
    built, fpsWalk: stats(walk), fpsIdle: stats(idle),
    levelWalk0, levelEnd, steps, saveBytes, afterReload: restored, errors: errs,
  }
  console.log(vp.name, JSON.stringify({ firstBytes, firstFrame: Math.round(firstFrame), firstChunk: Math.round(firstChunk), navTiming, walk: stats(walk), idle: stats(idle), levelWalk0, levelEnd, steps, built, saveBytes, restored, errs: errs.length, gl }))
  await ctx.close()
}
writeFileSync(`${OUT}/results-${VPS.map((v) => v.name).join('+')}.json`, JSON.stringify(results, null, 2))
await browser.close()
