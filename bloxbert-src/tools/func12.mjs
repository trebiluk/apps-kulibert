// Bloxbert 1.2 functional + layout check. Usage: node tools/func12.mjs <base> <group: phone|desk|lang> [outTag]
// One headless Chrome per run. Checks: 0 errors, every visible control on screen and >=44 px, no tip/chip covering a control,
// top bar not clipped, canvas + render size match the viewport after rotate, ☰ top-left + left drawer (also ar / fa-AF),
// quality switch (Auto/Lite/Full), Undo, Save, Export->Import round trip, touch swipe turn.
import puppeteer from 'puppeteer-core'
import { writeFileSync } from 'fs'
const base = process.argv[2] || 'http://127.0.0.1:8871/'
const group = process.argv[3] || 'phone'
const tag = process.argv[4] || 'local'
const OUT = 'measure/v12'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const out = {}
const sep = base.includes('?') ? '&' : '?'

async function open(vp, q = '') {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage()
  const errs = [], warns = []
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); else if (m.type() === 'warn' || m.type() === 'warning') warns.push(m.text()) })
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  p.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()))
  p.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url()) })
  await p.setViewport(vp)
  await p.goto(base + (q ? sep + q : ''), { waitUntil: 'load' })
  await p.waitForFunction(() => window.__blocks && window.__blocks.perf.firstChunk, { timeout: 60000 })
  await sleep(2500)
  return { ctx, p, errs, warns }
}
const layout = (p) => p.evaluate(() => {
  const vis = (e) => { const cs = getComputedStyle(e); const r = e.getBoundingClientRect(); return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !e.closest('[hidden]') && !(e.closest('#drawer') && !document.getElementById('drawer').classList.contains('open')) }
  const R = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) } }
  const name = (e) => e.id || e.getAttribute('aria-label') || e.dataset.q || e.className
  const W = innerWidth, H = innerHeight
  const ctrls = [...document.querySelectorAll('button')].filter(vis).filter((e) => !e.closest('#hotbar'))
  const slots = [...document.querySelectorAll('#hotbar .slot')]
  const off = ctrls.filter((e) => { const r = e.getBoundingClientRect(); return r.left < -0.5 || r.top < -0.5 || r.right > W + 0.5 || r.bottom > H + 0.5 }).map((e) => name(e) + JSON.stringify(R(e)))
  const small = [...ctrls, ...slots].filter((e) => { const r = e.getBoundingClientRect(); return r.width < 44 || r.height < 44 }).map((e) => name(e) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height))
  const hb = document.getElementById('hotbar').getBoundingClientRect()
  const hotbarOff = hb.bottom > H + 0.5 || hb.left < -0.5 || hb.right > W + 0.5
  // overlaps between controls, and tips/chips covering a control
  const ov = (a, c) => { const x = a.getBoundingClientRect(), y = c.getBoundingClientRect(); return Math.min(x.right, y.right) - Math.max(x.left, y.left) > 1 && Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top) > 1 }
  const overlaps = []
  const all = [...ctrls, document.getElementById('hotbar')]
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (!all[i].contains(all[j]) && !all[j].contains(all[i]) && !(all[i].closest('.top') && all[j].closest('.top') && false) && ov(all[i], all[j])) overlaps.push(name(all[i]) + ' x ' + name(all[j]))
  const tips = ['#perf', '.keys', '#toast'].map((s) => document.querySelector(s)).filter((e) => e && vis(e))
  const covered = []
  for (const t of tips) for (const c of all) if (ov(t, c)) covered.push(name(t) + ' covers ' + name(c))
  const top = document.querySelector('.top'), tr = top.getBoundingClientRect()
  const clipped = [...document.querySelectorAll('.top > *, .tools > *')].filter(vis).filter((e) => { const r = e.getBoundingClientRect(); return r.right > W + 0.5 || r.left < -0.5 || r.bottom > tr.bottom + 0.5 }).map(name)
  const cv = document.querySelector('#stage canvas'), cr = cv.getBoundingClientRect()
  const B = window.__blocks, eng = B.noa.rendering.engine, lvl = B.perf.level()
  const menu = R(document.getElementById('menu-btn'))
  return {
    vp: W + 'x' + H, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
    canvasCss: [Math.round(cr.width), Math.round(cr.height)], render: [eng.getRenderWidth(), eng.getRenderHeight()], expectRender: [Math.round(cr.width / lvl), Math.round(cr.height / lvl)],
    renderOk: Math.abs(eng.getRenderWidth() - cr.width / lvl) <= 2 && Math.abs(eng.getRenderHeight() - cr.height / lvl) <= 2 && Math.round(cr.width) === W && Math.round(cr.height) === H,
    topH: Math.round(tr.height), undo: R(document.getElementById('undo-btn')), save: R(document.getElementById('save-btn')), menu, menuTopLeft: menu.x <= 16 && menu.y <= 16,
    off, small, hotbarOff, overlaps, covered, clipped, level: lvl, quality: B.quality, dir: document.documentElement.dir || 'ltr',
  }
})
const okLayout = (L) => L.renderOk && !L.off.length && !L.small.length && !L.hotbarOff && !L.overlaps.length && !L.covered.length && !L.clipped.length && L.menuTopLeft && L.scroll[0] <= +L.vp.split('x')[0] && L.scroll[1] <= +L.vp.split('x')[1]

async function menuCheck(p, shot) {
  await p.click('#menu-btn'); await sleep(450)
  const m = await p.evaluate(() => {
    const d = document.getElementById('drawer'), r = d.getBoundingClientRect()
    const q = [...document.querySelectorAll('.qbtn')].map((e) => { const r = e.getBoundingClientRect(); return { q: e.dataset.q, w: Math.round(r.width), h: Math.round(r.height), icon: !!e.querySelector('svg path, svg circle'), label: e.querySelector('b').textContent, checked: e.getAttribute('aria-checked') } })
    return { open: d.classList.contains('open'), left: Math.round(r.left), width: Math.round(r.width), title: d.querySelector('.dhead b').textContent, settingsTitle: document.querySelector('#settings h3').textContent, whatsNew: document.querySelector('.new').textContent.slice(0, 60), plate: document.querySelector('.plate').textContent, qbtns: q, qNow: document.getElementById('q-now').textContent }
  })
  if (shot) await p.screenshot({ path: shot })
  await p.keyboard.press('Escape'); await sleep(300)
  m.closed = await p.evaluate(() => !document.getElementById('drawer').classList.contains('open'))
  return m
}
async function editsCheck(p) {
  return p.evaluate(async () => {
    const B = window.__blocks, q = (s) => document.querySelector(s), n = B.noa, P = n.entities.getPosition(n.playerEntity)
    const x = Math.floor(P[0]) + 3, z = Math.floor(P[2]) + 3, y = Math.floor(P[1]) + 2
    const res = {}
    B.pick(3); B.setLook(0, 1.2); await new Promise((r) => setTimeout(r, 300))
    const t = n.targetedBlock && [...n.targetedBlock.adjacent]
    res.placed = B.placeBlock(); res.undoEnabled = !q('#undo-btn').disabled; res.after = t && B.getVoxel(...t)
    q('#undo-btn').click(); res.afterUndo = t && B.getVoxel(...t)
    q('#save-btn').click(); await new Promise((r) => setTimeout(r, 900)); res.saveState = q('#save-state').textContent
    B.setVoxel(x, y, z, 5); const doc = await B.exportDoc(); B.setVoxel(x, y, z, 0)
    await B.importFile(new File([JSON.stringify(doc)], 'w.json', { type: 'application/json' }))
    res.roundTrip = B.getVoxel(x, y, z) === 5; res.appVersion = doc.appVersion; res.exportKB = +(JSON.stringify(doc).length / 1024).toFixed(1)
    try { await B.importFile(new File(['{"x":1}'], 'bad.json')); res.badImport = 'accepted!' } catch (e) { res.badImport = e.message }
    B.setVoxel(x, y, z, 0)
    return res
  })
}
async function swipe(p, x0, y) {
  const h0 = await p.evaluate(() => window.__blocks.noa.camera.heading)
  const c = await p.target().createCDPSession()
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] })
  for (let i = 1; i <= 12; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + i * 10, y }] }); await sleep(16) }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  // slow drag: 120 px over ~1 s
  const h1 = await p.evaluate(() => window.__blocks.noa.camera.heading)
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y }] })
  for (let i = 1; i <= 24; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + i * 5, y }] }); await sleep(45) }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  const h2 = await p.evaluate(() => window.__blocks.noa.camera.heading)
  const deg = (a, b2) => { let d = b2 - a; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return +(d * 180 / Math.PI).toFixed(1) }
  return { quickSwipe120deg: deg(h0, h1), slowDrag120deg: deg(h1, h2), pointerLock: await p.evaluate(() => !!document.pointerLockElement) }
}
async function rotate(p, w, h, landscape) {
  await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2, isLandscape: landscape })
  await sleep(1200)
}
const phoneVp = (w, h) => ({ width: w, height: h, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })

if (group === 'phone') {
  for (const [nm, w, h] of [['412x915', 412, 915], ['915x412', 915, 412]]) {
    const { ctx, p, errs, warns } = await open(phoneVp(w, h))
    const r = { layout: await layout(p) }
    r.menu = await menuCheck(p, `${OUT}/${tag}-${nm}-menu.png`)
    r.edits = await editsCheck(p)
    r.swipe = await swipe(p, Math.round(w / 2) - 60, Math.round(h / 2))
    // quality switch live (Auto -> Lite -> Auto), no reload
    r.quality = await p.evaluate(async () => {
      const B = window.__blocks, st = () => ({ q: B.quality, level: B.perf.level(), auto: B.perf.auto, add: [...B.noa.world._chunkAddDistance], rem: [...B.noa.world._chunkRemoveDistance], aa: B.noa.rendering.engine._gl.getContextAttributes().antialias })
      const a = st(); document.querySelector('[data-q=lite]').click(); await new Promise((r) => setTimeout(r, 400)); const l = st(); document.querySelector('[data-q=auto]').click(); await new Promise((r) => setTimeout(r, 400))
      return { defaultOnPhone: a, afterLite: l, backToAuto: st() }
    })
    await sleep(2600)
    await p.screenshot({ path: `${OUT}/${tag}-${nm}.png` })
    r.layoutEnd = await layout(p)
    r.errors = errs; r.warnings = warns; r.pass = okLayout(r.layout) && okLayout(r.layoutEnd) && !errs.length && r.edits.roundTrip && r.menu.open && r.menu.left === 0 && r.menu.closed
    out[nm] = r; await ctx.close()
  }
  // rotate mid-session: upright -> sideways -> upright, with an edit in between
  {
    const { ctx, p, errs, warns } = await open(phoneVp(412, 915))
    const r = { start: await layout(p) }
    const mark = await p.evaluate(() => { const n = window.__blocks.noa, P = n.entities.getPosition(n.playerEntity); const m = [Math.floor(P[0]) + 2, Math.floor(P[1]) + 1, Math.floor(P[2]) + 2]; window.__blocks.setVoxel(...m, 15); return m })
    await p.evaluate(() => { window.__sameSession = 1; window.__orient = []; addEventListener('orientationchange', () => window.__orient.push(screen.orientation.type)); window.__blocks.hold('forward', true) }); await sleep(800); await p.evaluate(() => { window.__blocks.hold('forward', false) })
    await rotate(p, 915, 412, true); r.sideways = await layout(p); await p.screenshot({ path: `${OUT}/${tag}-rotate-2-sideways.png` })
    r.sidewaysMenu = await menuCheck(p, `${OUT}/${tag}-rotate-2-sideways-menu.png`)
    await rotate(p, 412, 915, false); r.backUpright = await layout(p); await p.screenshot({ path: `${OUT}/${tag}-rotate-3-upright.png` })
    await rotate(p, 915, 412, true); r.sidewaysAgain = await layout(p)
    r.markKept = await p.evaluate((m) => window.__blocks.getVoxel(...m) === 15, mark)
    r.sameSession = await p.evaluate(() => window.__sameSession === 1); r.orientationEvents = await p.evaluate(() => window.__orient)
    r.swipeSideways = await swipe(p, 400, 200)
    await sleep(1500)
    r.errors = errs; r.warnings = warns
    r.pass = [r.start, r.sideways, r.backUpright, r.sidewaysAgain].every(okLayout) && r.markKept && r.sameSession && !errs.length && r.sidewaysMenu.open && r.sidewaysMenu.left === 0
    out['rotate-412x915->915x412->412x915->915x412'] = r; await ctx.close()
  }
}
if (group === 'lang') {
  for (const lang of ['ar', 'fa-AF']) {
    for (const [w, h] of [[412, 915], [915, 412]]) {
      const { ctx, p, errs, warns } = await open(phoneVp(w, h), 'lang=' + lang)
      const r = { layout: await layout(p) }
      r.menu = await menuCheck(p, `${OUT}/${tag}-${lang}-${w}x${h}-menu.png`)
      r.htmlLang = await p.evaluate(() => document.documentElement.lang)
      r.padOrder = await p.evaluate(() => { const l = document.querySelector('.move .l').getBoundingClientRect(), rr = document.querySelector('.move .r').getBoundingClientRect(); return l.left < rr.left ? 'left-pad on left' : 'MIRRORED' })
      r.errors = errs; r.warnings = warns
      r.pass = okLayout(r.layout) && r.layout.dir === 'rtl' && r.menu.open && r.menu.left === 0 && r.menu.closed && !errs.length && r.padOrder === 'left-pad on left'
      out[lang + '-' + w + 'x' + h] = r; await ctx.close()
    }
  }
}
if (group === 'desk') {
  for (const [w, h] of [[1024, 768], [1366, 768]]) {
    const { ctx, p, errs, warns } = await open({ width: w, height: h })
    const r = { layout: await layout(p) }
    r.menu = await menuCheck(p, `${OUT}/${tag}-${w}x${h}-menu.png`)
    r.edits = await editsCheck(p)
    if (w === 1366) {
      // Full needs antialias -> saves and reloads once; then back to Auto (reload again)
      const st = () => p.evaluate(() => ({ q: window.__blocks.quality, level: window.__blocks.perf.level(), auto: window.__blocks.perf.auto, aa: window.__blocks.noa.rendering.engine._gl.getContextAttributes().antialias, add: [...window.__blocks.noa.world._chunkAddDistance] }))
      r.qStart = await st()
      await p.click('#menu-btn'); await sleep(400)
      await Promise.all([p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }), p.click('[data-q=full]')])
      await p.waitForFunction(() => window.__blocks && window.__blocks.perf.firstChunk, { timeout: 60000 }); await sleep(1500)
      r.qFull = await st(); r.layoutFull = await layout(p)
      await p.screenshot({ path: `${OUT}/${tag}-1366-full.png` })
      await p.click('#menu-btn'); await sleep(400)
      await Promise.all([p.waitForNavigation({ waitUntil: 'load', timeout: 30000 }), p.click('[data-q=auto]')])
      await p.waitForFunction(() => window.__blocks && window.__blocks.perf.firstChunk, { timeout: 60000 }); await sleep(1500)
      r.qBackAuto = await st()
    }
    await p.screenshot({ path: `${OUT}/${tag}-${w}x${h}.png` })
    r.errors = errs; r.warnings = warns
    r.pass = okLayout(r.layout) && !errs.length && r.edits.roundTrip && r.menu.open && r.menu.left === 0 && (w !== 1366 || (r.qFull.q === 'full' && r.qFull.aa === true && r.qBackAuto.q === 'auto' && r.qBackAuto.aa === false))
    out[w + 'x' + h] = r; await ctx.close()
  }
}
writeFileSync(`${OUT}/func-${tag}-${group}.json`, JSON.stringify(out, null, 1))
const brief = Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { pass: v.pass, errors: v.errors.length }]))
console.log(JSON.stringify(brief))
await b.close()
