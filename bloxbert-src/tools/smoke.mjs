import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { inflateSync } from 'zlib'
const chrome = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'].find((p) => existsSync(p))
const url = process.argv[2] || 'http://127.0.0.1:8875/blocks/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function parkMouse(page, x, y) {
  await page.mouse.up().catch(() => {})
  await sleep(80)
  for (let i = 0; i < 3; i++) {
    const locked = await page.evaluate(() => !!document.pointerLockElement)
    if (!locked) break
    await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
    await page.waitForFunction(() => !document.pointerLockElement, { timeout: 600 }).catch(() => {})
    await sleep(40)
  }
  const locked = await page.evaluate(() => !!document.pointerLockElement)
  if (!locked) await page.mouse.move(x, y)
}
async function tapAt(page, x, y, touch) {
  if (touch) await page.touchscreen.tap(x, y)
  else {
    await parkMouse(page, x, y)
    await page.mouse.down()
    await page.mouse.up()
  }
}
async function pressAt(page, x, y, ms, touch, button) {
  if (touch) {
    await page.touchscreen.touchStart(x, y)
    await sleep(ms)
    await page.touchscreen.touchEnd()
    return
  }
  await parkMouse(page, x, y)
  await page.mouse.down({ button: button || 'left' })
  await sleep(ms)
  await page.mouse.up({ button: button || 'left' })
}
async function stillHold(page, ms, touch) {
  if (touch) {
    const c = await page.evaluate(() => {
      const r = document.querySelector('#stage canvas').getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    await page.touchscreen.touchStart(c.x, c.y)
    await sleep(ms)
    await page.touchscreen.touchEnd()
    return
  }
  await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
  await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
  await sleep(50)
  const c = await page.evaluate(() => {
    const r = document.querySelector('#stage canvas').getBoundingClientRect()
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
  })
  await page.mouse.move(c.x, c.y)
  await page.mouse.down()
  await sleep(ms)
  await page.mouse.up()
}
async function jitterHold(page, x, y, ms) {
  await page.touchscreen.touchStart(x, y)
  const n = Math.max(1, Math.round(ms / 16))
  for (let i = 0; i < n; i++) {
    await page.touchscreen.touchMove(x + (Math.random() * 4 - 2), y + (Math.random() * 4 - 2))
    await sleep(16)
  }
  await page.touchscreen.touchEnd()
}
async function holdAt(page, x, y, ms, touch) {
  if (touch) {
    await page.touchscreen.touchStart(x, y)
    await sleep(ms)
    await page.touchscreen.touchEnd()
  } else {
    await parkMouse(page, x, y)
    await page.mouse.down()
    await sleep(ms)
    await page.mouse.up()
  }
}
async function boxOf(page, sel) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return null
    const s = getComputedStyle(el)
    if (el.hidden || s.display === 'none' || s.visibility === 'hidden') return null
    const r = el.getBoundingClientRect()
    if (r.width < 2 || r.height < 2) return null
    return { x: r.x, y: r.y, w: r.width, h: r.height }
  }, sel)
}
async function tapSel(page, sel, touch) {
  const b = await boxOf(page, sel)
  if (!b) return null
  if (sel === '#mode-survival' || sel === '#mode-creative') {
    await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
    await sleep(50)
  }
  await tapAt(page, b.x + b.w / 2, b.y + b.h / 2, touch)
  return b
}
async function tapLabel(page, text, touch) {
  const b = await page.evaluate((text) => {
    const el = [...document.querySelectorAll('button')].find((n) => n.textContent.includes(text) && !n.hidden && getComputedStyle(n).display !== 'none')
    if (!el) return null
    el.scrollIntoView({ block: 'center', inline: 'center' })
    const r = el.getBoundingClientRect()
    if (r.width < 8 || r.height < 8) return null
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }
  }, text)
  if (!b) return null
  await tapAt(page, b.x, b.y, touch)
  return b
}
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const page = await browser.newPage()
const errs = []
page.on('pageerror', (e) => errs.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
await page.setViewport({ width: 1366, height: 768 })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 2000))
const hot = await page.$('#hotbar')
await page.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true })
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 1500))
await tapSel(page, '.kb-bar .kb-menu', true)
await new Promise((r) => setTimeout(r, 300))
const open = await page.$eval('#sheet', (el) => !el.hidden && el.dataset.panel === 'menu')
await new Promise((r) => setTimeout(r, 800))
await tapSel(page, '.kb-bar .kb-menu', true)
const pics = await page.evaluate(() => {
  const menu = document.querySelectorAll('#sheet .gtile').length
  const icons = new Set([...document.querySelectorAll('#sheet .gic')].map((n) => n.textContent))
  const slots = [...document.querySelectorAll('#hotbar canvas')].map((c) => c.toDataURL())
  return { menu, icons: icons.size, text: document.body.innerText.includes('[object'), slots: new Set(slots).size }
})
await page.goto(url + (url.includes('?') ? '&' : '?') + 'smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
await new Promise((r) => setTimeout(r, 800))
const student = await page.evaluate(() => typeof window.__smoke)
const testUrl = process.argv[3]
let gate = { short: false, full: false, oven: false, pickup: '', sale: 0 }
if (testUrl) {
  await page.goto(testUrl + '?smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 1500))
  gate = await page.evaluate(() => {
    window.__smoke.seed()
    const bar = document.getElementById('hotbar').innerText
    const pics = document.querySelectorAll('#hotbar svg, #hotbar canvas').length
    window.__smoke.notch(5)
    const hot = window.__smoke.hot()
    window.__smoke.key(1)
    const before = window.__smoke.counts()
    window.__smoke.place()
    const after = window.__smoke.counts()
    return { bar, pics, hot, before, after }
  })
  await page.evaluate(() => window.__smoke.fillSeed(6))
  await tapSel(page, '#hotbar [data-slot="0"]', true)
  await page.evaluate(() => { document.querySelector('#tool-strip').hidden = false })
  await sleep(100)
  await tapSel(page, '#tool-strip [data-tool="fill"]', true)
  await sleep(80)
  await tapSel(page, '#tool-strip [data-tool="do"]', true)
  await sleep(80)
  const short = await page.evaluate(() => window.__smoke.counts().log === 6)
  await page.evaluate(() => window.__smoke.fillSeed(12))
  await tapSel(page, '#tool-strip [data-tool="fill"]', true)
  await sleep(80)
  await tapSel(page, '#tool-strip [data-tool="do"]', true)
  await sleep(80)
  const full = await page.evaluate(() => window.__smoke.counts().log === 0)
  await page.evaluate(() => window.__smoke.ovenOpen())
  gate = { ...gate, short, full }
  await new Promise((r) => setTimeout(r, 3000))
  const glassAt = await page.evaluate(() => {
    const glass = [...document.querySelectorAll('#sheet-body .gtile')].find((b) => /Glass|glass/.test(b.textContent))
    if (!glass) return null
    glass.scrollIntoView({ block: 'center', inline: 'center' })
    const r = glass.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height }
  })
  if (glassAt && glassAt.w > 8) await tapAt(page, glassAt.x, glassAt.y, true)
  const oven = await page.evaluate(() => ({
    strip: document.getElementById('sheet-body').innerText,
    sand: window.__smoke.counts().sand,
  }))
  gate = { ...gate, ...oven }
  const checks = []
  function note(name, size, ok, seen) { checks.push([name, size, ok, seen]); console.log(ok ? 'PASS' : 'FAIL', name, size, seen) }
  for (const size of [[412, 915], [1366, 768]]) {
    await page.setViewport({ width: size[0], height: size[1] })
    await page.goto(testUrl + '?smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 1200))
    await page.evaluate(() => window.__smoke.ovenOpen())
    await new Promise((r) => setTimeout(r, 400))
    const seen = await page.evaluate(() => {
      const tiles = [...document.querySelectorAll('#sheet-body .gtile')].slice(-2)
      const pics = tiles.map((el) => (el.querySelector('canvas') ? el.querySelector('canvas').toDataURL().slice(-24) : ''))
      const boxes = tiles.map((el) => el.getBoundingClientRect()).map((r) => ({ x: r.x, y: r.y, w: r.width, h: r.height }))
      return { pics, boxes, text: document.getElementById('sheet-body').innerText.slice(0, 120) }
    })
    const boxes = seen.boxes
    const overlap = boxes.length === 2 && boxes[0].x < boxes[1].x + boxes[1].w && boxes[1].x < boxes[0].x + boxes[0].w && boxes[0].y < boxes[1].y + boxes[1].h && boxes[1].y < boxes[0].y + boxes[0].h
    note('tile pictures differ', size[0], seen.pics[0] && seen.pics[0] !== seen.pics[1], seen.pics.join('|'))
    note('tiles do not overlap', size[0], boxes.length === 2 && !overlap, JSON.stringify(boxes))
    note('recipe words', size[0], seen.text.includes('Glass') && seen.text.includes('Bread'), seen.text)
  }
  note('student hook', 412, student === 'undefined', student)
  const empty = await page.evaluate(() => window.__smoke.emptyOven())
  note('nothing to bake', 412, empty.includes('Nothing to bake yet'), empty.slice(0, 80))
  await page.goto(testUrl + '?lang=ru&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 1000))
  const words = await page.evaluate(() => window.__smoke.words())
  note('ru fill chip', 412, words.fill.includes('Заполни') && !/[A-Za-z]/.test(words.fill), words.fill)
  note('ru walls', 412, words.walls.includes('Стены') && !/[A-Za-z]/.test(words.walls), words.walls)
  const glass = await page.evaluate(() => window.__smoke.glassOut())
  note('ru output glass', 412, glass.includes('Стекло') && !glass.includes('glass'), glass.slice(0, 60))
  await page.goto(testUrl + '?lang=es&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 800))
  await tapSel(page, '.kb-bar .kb-menu', false)
  await new Promise((r) => setTimeout(r, 400))
  const menu = await page.evaluate(() => document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent)
  note('es menu', 412, menu === 'Menú', menu)
  const contrast = await page.evaluate(() => getComputedStyle(document.getElementById('t-break')).backgroundColor)
  note('break contrast', 412, contrast === 'rgb(15, 23, 42)', contrast)
  await page.goto(testUrl + '?lang=ar&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 800))
  const brick = await page.evaluate(() => window.__smoke.brick())
  note('ar brick', 412, brick === 'طوب أحمر', brick)
  await page.goto(testUrl + '?lang=fa-AF&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 800))
  const dari = await page.evaluate(() => window.__smoke.brick())
  note('dari brick', 412, dari === 'خشت سرخ', dari)
  const place = await page.evaluate(() => getComputedStyle(document.getElementById('t-place')).backgroundColor)
  note('place contrast', 412, place === 'rgb(15, 23, 42)', place)
  for (const [lang, title] of [['ar', 'القائمة'], ['fa-AF', 'فهرست'], ['uk', 'Меню'], ['ru', 'Меню']]) {
    await page.goto(testUrl + '?lang=' + lang + '&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 700))
    await tapSel(page, '.kb-bar .kb-menu', false)
    await new Promise((r) => setTimeout(r, 250))
    const seen = await page.evaluate(() => document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent)
    note(lang + ' menu', 412, seen === title, seen)
  }
  for (const [lang, title, tour] of [['ar', 'القائمة', 'جولة'], ['fa-AF', 'فهرست', 'گشت']]) {
    await page.goto(testUrl + '?lang=' + lang + '&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.evaluate(() => localStorage.removeItem('bloxbert-learn'))
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 200))
    await tapSel(page, '.kb-bar .kb-menu', false)
    await new Promise((r) => setTimeout(r, 900))
    const held = await page.evaluate(() => ({
      panel: document.getElementById('sheet').dataset.panel,
      title: document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent,
      hidden: document.getElementById('sheet').hidden,
    }))
    note(lang + ' menu holds', 412, !held.hidden && held.panel === 'menu' && held.title === title && held.title !== tour, JSON.stringify(held))
    await page.evaluate(() => localStorage.removeItem('bloxbert-learn'))
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 900))
    await tapSel(page, '.kb-bar .kb-menu', false)
    await new Promise((r) => setTimeout(r, 400))
    const late = await page.evaluate(() => ({
      panel: document.getElementById('sheet').dataset.panel,
      title: document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent,
    }))
    note(lang + ' menu after tour', 412, late.panel === 'menu' && late.title === title && late.title !== tour, JSON.stringify(late))
  }
  await page.goto(testUrl + '?lang=es&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 700))
  await tapSel(page, '.kb-bar .kb-menu', false)
  await new Promise((r) => setTimeout(r, 250))
  await tapLabel(page, 'Ajustes', false)
  await sleep(250)
  const settings = await page.evaluate(() => document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent)
  note('es settings', 412, settings === 'Ajustes', settings)
  await tapLabel(page, 'Siempre', false)
  await sleep(200)
  const day = await page.evaluate(() => document.documentElement.dataset.alwaysDay)
  note('always day', 412, day === '1', day)
  await page.evaluate(() => {
    if (window.__smoke && window.__smoke.always) window.__smoke.always(false)
    return window.__smoke && window.__smoke.persist ? window.__smoke.persist() : null
  })
  await page.close()
  await prove2543(browser, testUrl, note, errs)
  await browser.close()
  if (errs.length) console.error('CONSOLE ' + errs.join(' | '))
  if (checks.some((c) => !c[2]) || errs.length) process.exit(1)
  process.exit(0)
}
await browser.close()
process.exit(errs.length ? 1 : 0)

function hit(a, b) {
  return a && b && a.w > 1 && b.w > 1 && a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5
}
function inside(r, w, h) {
  return r && r.w > 1 && r.x >= -1 && r.y >= -1 && r.x + r.w <= w + 1 && r.y + r.h <= h + 1
}
function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c)
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c
}
function pngMean(buf) {
  buf = Buffer.isBuffer(buf) ? buf : Buffer.from(buf)
  let o = 8
  let w = 0, h = 0, ctype = 6
  const idats = []
  while (o + 8 <= buf.length) {
    const len = buf.readUInt32BE(o); o += 4
    const type = buf.toString('ascii', o, o + 4); o += 4
    const data = buf.subarray(o, o + len); o += len + 4
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ctype = data[9] }
    else if (type === 'IDAT') idats.push(data)
    else if (type === 'IEND') break
  }
  const raw = inflateSync(Buffer.concat(idats))
  const ch = ctype === 6 ? 4 : ctype === 2 ? 3 : ctype === 4 ? 2 : 1
  const stride = w * ch
  let p = 0
  let prev = Buffer.alloc(stride)
  let sum = 0, n = 0
  for (let y = 0; y < h; y++) {
    const filter = raw[p++]
    const row = Buffer.from(raw.subarray(p, p + stride))
    p += stride
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? row[i - ch] : 0
      const b = prev[i]
      const c = i >= ch ? prev[i - ch] : 0
      if (filter === 1) row[i] = (row[i] + a) & 255
      else if (filter === 2) row[i] = (row[i] + b) & 255
      else if (filter === 3) row[i] = (row[i] + ((a + b) >> 1)) & 255
      else if (filter === 4) row[i] = (row[i] + paeth(a, b, c)) & 255
    }
    prev = row
    for (let x = 0; x < w; x++) {
      const r = row[x * ch]
      const g = ch > 1 ? row[x * ch + 1] : r
      const b = ch > 2 ? row[x * ch + 2] : r
      sum += 0.2126 * r + 0.7152 * g + 0.0722 * b
      n++
    }
  }
  return n ? sum / n : 0
}
function clampClip(clip, w, h) {
  const x = Math.max(0, Math.min(w - 2, Math.round(clip.x)))
  const y = Math.max(0, Math.min(h - 2, Math.round(clip.y)))
  return { x, y, width: Math.max(2, Math.min(w - x, Math.round(clip.width))), height: Math.max(2, Math.min(h - y, Math.round(clip.height))) }
}
async function regionMean(page, frac) {
  const box = await page.evaluate(() => {
    const c = document.querySelector('#stage canvas')
    const r = c.getBoundingClientRect()
    return { x: r.x, y: r.y, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight }
  })
  const clip = clampClip({
    x: box.x + box.w * frac.x0,
    y: box.y + box.h * frac.y0,
    width: box.w * (frac.x1 - frac.x0),
    height: box.h * (frac.y1 - frac.y0),
  }, box.vw, box.vh)
  return pngMean(await page.screenshot({ clip, type: 'png' }))
}
async function patchMean(page, x, y) {
  const view = await page.evaluate(() => ({ w: window.innerWidth, h: window.innerHeight }))
  const clip = clampClip({ x: x - 14, y: y - 14, width: 28, height: 28 }, view.w, view.h)
  return pngMean(await page.screenshot({ clip, type: 'png' }))
}
async function bootHud(browser, href, w, h, touch, prep, media) {
  const page = await browser.newPage()
  page.__err = []
  page.on('pageerror', (e) => page.__err.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.__err.push(m.text()) })
  page.on('dialog', (d) => d.accept())
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: 1 })
  if (media) await page.emulateMediaFeatures(media)
  await page.evaluateOnNewDocument(prep || (() => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true }))
  }))
  await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForFunction(() => document.querySelector('.kb-bar .kb-menu') && document.querySelectorAll('#hotbar .slot').length >= 9, { timeout: 20000 }).catch(() => {})
  await sleep(500)
  return page
}
async function layout(page, w, h) {
  return page.evaluate((w, h) => {
    function box(el) {
      if (!el) return null
      const s = getComputedStyle(el)
      if (el.hidden || s.display === 'none' || s.visibility === 'hidden') return null
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return null
      return { x: r.x, y: r.y, w: r.width, h: r.height, id: el.id || el.className }
    }
    const names = {
      path: box(document.getElementById('path-chip')),
      stick: box(document.getElementById('stick-pad')),
      jump: box(document.querySelector('#jump-col .jump')),
      crouch: box(document.getElementById('t-crouch')),
      pick: box(document.getElementById('pick-chip')),
      menu: box(document.querySelector('.kb-bar .kb-menu')),
      hint: box(document.getElementById('menu-hint')),
      keys: box(document.querySelector('.keys')),
    }
    const slots = [...document.querySelectorAll('#hotbar .slot')].map(box).filter(Boolean)
    const header = document.querySelector('.top').getBoundingClientRect()
    const bar = document.querySelector('html').dataset.kbBar != null || document.documentElement.hasAttribute('data-kb-bar')
    const headBottom = header.bottom
    let stickPts = []
    if (names.stick) {
      const s = names.stick
      const xs = [s.x + 16, s.x + s.w / 2, s.x + s.w - 16]
      const ys = [s.y + 16, s.y + s.h / 2, s.y + s.h - 16]
      for (const y of ys) for (const x of xs) {
        const el = document.elementFromPoint(x, y)
        stickPts.push(el && (el.id === 'stick-pad' || (el.closest && el.closest('#stick-pad'))) ? 'stick' : (el && (el.id || el.className)))
      }
    }
    const scroll = document.getElementById('hotbar').scrollWidth - document.getElementById('hotbar').clientWidth
    return { names, slots, headBottom, stickPts, scroll, n: slots.length, bar }
  }, w, h)
}
async function prove2543(browser, testUrl, note, errs) {
  const sizes = [[360, 740, true], [412, 915, true], [915, 412, true], [844, 390, true], [1366, 768, false]]
  for (const [w, h, touch] of sizes) {
    const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
    errs.push(...page.__err.map((e) => 'hud ' + e))
    const lay = await layout(page, w, h)
    const shown = Object.entries(lay.names).filter(([, r]) => r)
    let bad = ''
    for (const [name, r] of shown) if (!inside(r, w, h)) bad += name + ' off '
    for (let i = 0; i < shown.length; i++) for (let j = i + 1; j < shown.length; j++) {
      if (hit(shown[i][1], shown[j][1])) bad += shown[i][0] + '/' + shown[j][0] + ' '
    }
    const slotsOff = lay.slots.filter((r) => !inside(r, w, h))
    for (let i = 0; i < lay.slots.length; i++) for (let j = i + 1; j < lay.slots.length; j++) {
      if (hit(lay.slots[i], lay.slots[j])) bad += 'slot' + i + '/' + j + ' '
    }
    if (slotsOff.length) bad += 'slots-off ' + slotsOff.length + ' '
    for (const [name, r] of shown) for (const slot of lay.slots) if (hit(r, slot)) bad += name + '/slot '
    if (touch && lay.stickPts.length === 9 && lay.stickPts.some((p) => p !== 'stick')) bad += 'stick-hit ' + lay.stickPts.join(',') + ' '
    if (touch && lay.names.crouch && lay.names.crouch.y < lay.headBottom - 1) bad += 'crouch-under-header '
    if (touch && lay.names.jump && lay.names.jump.y < lay.headBottom - 1) bad += 'jump-under-header '
    if (!touch && lay.names.path && lay.names.keys && hit(lay.names.path, lay.names.keys)) bad += 'chip-keys '
    const upright = w < 480
    if (upright) {
      const small = lay.slots.filter((r) => r.w < 48 || r.h < 48)
      if (lay.n < 10) bad += 'slots ' + lay.n + ' '
      if (small.length) bad += 'small ' + small.length + ' '
      if (lay.scroll > 2) bad += 'scroll ' + lay.scroll + ' '
    }
    note('hud rects', w + 'x' + h, !bad, bad || 'clear ' + shown.map(([n]) => n).join(','))
    if (w === 412) {
      const slot = await tapSel(page, '#hotbar [data-slot="7"]', true)
      await sleep(200)
      const pressed = await page.evaluate(() => {
        const el = document.querySelector('#hotbar [data-slot="7"]')
        return el && el.getAttribute('aria-pressed')
      })
      note('slot 7', '412x915', !!slot && pressed === 'true', pressed)
      const bag = await tapSel(page, '#hotbar [data-bag="1"]', true)
      await sleep(300)
      const inv = await page.evaluate(() => ({
        panel: document.getElementById('sheet').dataset.panel,
        hidden: document.getElementById('sheet').hidden,
      }))
      note('bag opens inventory', '412x915', !!bag && !inv.hidden && inv.panel === 'inventory', inv.panel)
    }
    await page.close()
  }
  const spin = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true)
  errs.push(...spin.__err.map((e) => 'spin ' + e))
  await tapSel(spin, '#hotbar [data-slot="7"]', true)
  await sleep(200)
  const before = await spin.evaluate(() => ({
    hot: document.querySelector('#hotbar [data-slot="7"]') && document.querySelector('#hotbar [data-slot="7"]').getAttribute('aria-pressed'),
    path: document.getElementById('path-chip').textContent,
    mode: document.getElementById('mode-chip').textContent,
  }))
  await spin.setViewport({ width: 915, height: 412, hasTouch: true, isMobile: true })
  await sleep(400)
  const mid = await layout(spin, 915, 412)
  let midBad = ''
  const midShown = Object.entries(mid.names).filter(([, r]) => r)
  for (const [name, r] of midShown) if (!inside(r, 915, 412)) midBad += name + ' off '
  for (let i = 0; i < midShown.length; i++) for (let j = i + 1; j < midShown.length; j++) if (hit(midShown[i][1], midShown[j][1])) midBad += midShown[i][0] + '/' + midShown[j][0] + ' '
  if (mid.names.crouch && mid.names.crouch.y < mid.headBottom - 1) midBad += 'crouch-under-header '
  await spin.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true })
  await sleep(400)
  const after = await spin.evaluate(() => ({
    hot: document.querySelector('#hotbar [data-slot="7"]') && document.querySelector('#hotbar [data-slot="7"]').getAttribute('aria-pressed'),
    path: document.getElementById('path-chip').textContent,
    mode: document.getElementById('mode-chip').textContent,
  }))
  note('rotate state', '915x412', !midBad && before.hot === 'true' && after.hot === 'true' && before.path === after.path && before.mode === after.mode, midBad || JSON.stringify(after))
  await spin.close()

  const locked = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true)
  await tapSel(locked, '.kb-bar .kb-menu', true)
  await sleep(300)
  const hintGone = await locked.evaluate(() => document.getElementById('menu-hint').hidden)
  await tapLabel(locked, 'Teacher', true)
  await sleep(250)
  const gate = await locked.evaluate(() => ({
    text: document.getElementById('sheet-body').innerText,
    tiles: document.querySelectorAll('#sheet-body .gtile').length,
  }))
  note('teacher line', '412x915', hintGone && gate.tiles === 0 && gate.text.includes('Ask your teacher'), gate.text.slice(0, 80))
  await tapSel(locked, '#sheet-back', true)
  await sleep(200)
  await tapLabel(locked, 'Mode', true)
  await sleep(200)
  const mode = await locked.evaluate(() => document.getElementById('sheet-body').innerText)
  note('mode survival only', '412x915', mode.includes('Survival') && !mode.includes('Creative'), mode.slice(0, 80))
  await locked.close()

  const staffed = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true, () => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true }))
    localStorage.setItem('tech-room-hub-staff', '1')
  })
  await tapSel(staffed, '.kb-bar .kb-menu', true)
  await sleep(250)
  await tapLabel(staffed, 'Teacher', true)
  await sleep(200)
  await tapLabel(staffed, 'This device is a student', true)
  await sleep(300)
  const switched = await staffed.evaluate(() => document.getElementById('sheet-body').innerText.includes('This device can build'))
  await tapSel(staffed, '#sheet-back', true)
  await sleep(200)
  await tapLabel(staffed, 'Mode', true)
  await sleep(200)
  const creative = await staffed.evaluate(() => [...document.querySelectorAll('#sheet .gtile')].some((b) => b.textContent.includes('Creative')))
  note('staff switch creative', '412x915', switched && creative, String(switched) + ' ' + creative)
  await staffed.close()

  const saved = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true, () => {
    localStorage.clear()
    sessionStorage.clear()
    localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true }))
    localStorage.setItem('bloxbert-teacher', '1')
  })
  const chip = await saved.evaluate(() => ({
    mode: document.getElementById('mode-chip').textContent,
    creative: document.getElementById('m-creative').hidden,
  }))
  note('saved teacher stays survival', '412x915', chip.mode === 'Survival' && chip.creative, JSON.stringify(chip))
  await saved.close()

  async function centerOf(page) {
    return page.evaluate(() => {
      const r = document.querySelector('#stage canvas').getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
  }
  async function shut(page, touch) {
    const open = await page.evaluate(() => !document.getElementById('sheet').hidden)
    if (!open) return
    await tapSel(page, '#sheet-x', touch)
    await sleep(250)
  }
  async function waitGround(page) {
    let last = null
    let stable = 0
    for (let i = 0; i < 25; i++) {
      const s = await page.evaluate(() => ({ g: window.__smoke.grounded(), y: window.__smoke.pos()[1] }))
      if (s.g) return s.y
      if (last != null && Math.abs(s.y - last) < 0.02) stable++
      else stable = 0
      if (stable >= 3) return s.y
      last = s.y
      await sleep(80)
    }
    return page.evaluate(() => window.__smoke.pos()[1])
  }
  async function waitSteady(page) {
    await waitGround(page)
    let prev = ''
    let same = 0
    for (let i = 0; i < 24; i++) {
      const a = await page.evaluate(() => window.__smoke.aim())
      const key = a ? a.id + ':' + a.x + ':' + a.y + ':' + a.z : ''
      if (key && key === prev) {
        same++
        if (same >= 2) return a
      } else same = 0
      prev = key
      await sleep(70)
    }
    return page.evaluate(() => window.__smoke.aim())
  }
  async function lookSolid(page, id, spawn) {
    const spot = spawn.slice()
    for (let i = 0; i < 16; i++) {
      if (i === 0 || i === 6 || i === 12) {
        await page.evaluate((s) => window.__smoke.stand(s[0], s[1], s[2], s[3], s[4]), spot)
        await sleep(220)
      }
      const a = await page.evaluate((id) => {
        const t = window.__smoke.aim()
        if (!t) return null
        if (window.__smoke.kept(t.x, t.y, t.z)) return { kept: true }
        if (t.id !== id) window.__smoke.plant(t.x, t.y, t.z, id)
        const b = window.__smoke.aim()
        return b && b.id === id && !window.__smoke.kept(b.x, b.y, b.z) ? b : null
      }, id)
      if (a && a.id === id) return a
      if (a && a.kept) spot[2] += 1
      await sleep(100)
    }
    return null
  }
  async function play(w, h, touch) {
    const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
    errs.push(...page.__err.map((e) => 'play ' + e))
    const spawn = [8.5, 6.2, 16, Math.PI, 0.7]
    const reach = await page.evaluate(() => window.__smoke.reach())
    note('survival reach', w + 'x' + h, reach === 6, String(reach))
    const help = await page.evaluate(() => ({
      help: document.querySelector('#settings + .sec .help, .sec .help[data-i18n="keysHint"], [data-i18n="keysHint"].help').textContent,
      keys: document.querySelector('.keys').textContent,
    }))
    const keys = await page.evaluate(() => window.__smoke.word('keysHint'))
    note('keys hint', w + 'x' + h, help.help === keys, help.help)
    const aim = await lookSolid(page, 2, spawn)
    let mined = aim
    let broke = -1
    let mineMs = 0
    let c = await centerOf(page)
    for (let attempt = 0; attempt < 3 && broke !== 0; attempt++) {
      if (attempt) mined = await lookSolid(page, 2, spawn)
      c = await centerOf(page)
      const t0 = Date.now()
      await holdAt(page, c.x, c.y, 1100, false)
      mineMs = Date.now() - t0
      broke = await page.evaluate((aim) => aim ? window.__smoke.voxel(aim.x, aim.y, aim.z) : -1, mined)
    }
    note('hold mine dirt', w + 'x' + h, broke === 0 && mineMs < 1600, 'id ' + broke + ' aim ' + JSON.stringify(mined))
    await page.evaluate((n) => window.__smoke.fillBag('dirt', n), touch ? 1 : 2)
    const stone = await lookSolid(page, 3, spawn)
    const before = await page.evaluate(() => window.__smoke.count('dirt'))
    if (!touch) {
      await parkMouse(page, c.x, c.y)
      await page.mouse.down({ button: 'right' })
      await sleep(40)
      const mid = await page.evaluate(() => window.__smoke.count('dirt'))
      note('place on press', w + 'x' + h, !!stone && mid === before - 1, before + '->' + mid)
      await sleep(30)
      await page.mouse.up({ button: 'right' })
    } else await pressAt(page, c.x, c.y, 70, touch, 'right')
    await sleep(200)
    const placed = await page.evaluate(() => window.__smoke.count('dirt'))
    note('tap places', w + 'x' + h, !!stone && placed === before - 1, before + '->' + placed)
    const y0 = await waitGround(page)
    const jump = await boxOf(page, '#jump-col .jump')
    let peak = y0
    const started = Date.now()
    const pulse = async () => {
      if (touch && jump) await holdAt(page, jump.x + jump.w / 2, jump.y + jump.h / 2, 70, true)
      else {
        await page.focus('body')
        await page.keyboard.down(' ')
        await sleep(70)
        await page.keyboard.up(' ')
      }
    }
    await pulse()
    let second = false
    while (Date.now() - started < 700) {
      await sleep(40)
      const y = await page.evaluate(() => window.__smoke.pos()[1])
      if (y > peak) peak = y
      if (!second && Date.now() - started > 180) { second = true; await pulse() }
    }
    const air = await page.evaluate((y0, peak) => ({ gain: peak - y0, fly: window.__smoke.flying(), y: window.__smoke.pos()[1] }), y0, peak)
    note('air jump nothing', w + 'x' + h, !air.fly && air.gain < 2.2 && air.gain > 0.3, JSON.stringify(air))
    await page.evaluate(() => {
      window.__smoke.emptyBag()
      window.__smoke.fillBag('dirt', 64)
      window.__smoke.fillBag('stone', 896)
    })
    let full = null
    let drop = { id: -1, drops: [] }
    for (let attempt = 0; attempt < 4 && !(drop.id === 0 && drop.drops.length > 0); attempt++) {
      full = await lookSolid(page, 2, spawn)
      await waitSteady(page)
      const cFull = await centerOf(page)
      await holdAt(page, cFull.x, cFull.y, 1500, false)
      await sleep(200)
      drop = await page.evaluate((aim) => ({ id: aim ? window.__smoke.voxel(aim.x, aim.y, aim.z) : -1, drops: window.__smoke.drops(), toast: window.__smoke.toast() }), full)
    }
    note('full bag drops', w + 'x' + h, drop.id === 0 && drop.drops.length > 0, JSON.stringify(drop).slice(0, 140))
    await shut(page, touch)
    let box = null
    for (let attempt = 0; attempt < 3; attempt++) {
      const boxAt = await lookSolid(page, 27, spawn)
      if (boxAt) await page.evaluate((a) => window.__smoke.seedBox(a.x, a.y, a.z), boxAt)
      await sleep(150)
      const aimed = await page.evaluate(() => window.__smoke.aim())
      if (!aimed || aimed.id !== 27) continue
      const cBox = await centerOf(page)
      await pressAt(page, cBox.x, cBox.y, 70, touch, 'right')
      await sleep(300)
      box = await page.evaluate(() => ({
        panel: document.getElementById('sheet').dataset.panel,
        slots: document.querySelectorAll('#sheet-body .gtile.slot').length,
        lock: document.pointerLockElement ? 'locked' : 'free',
        menu: document.body.classList.contains('menu-open'),
        canvas: getComputedStyle(document.querySelector('#stage canvas')).pointerEvents,
      }))
      if (box.panel === 'box' && box.slots === 18) break
      await shut(page, touch)
    }
    note('box 18 pointer', w + 'x' + h, !!(box && box.panel === 'box' && box.slots === 18 && box.lock === 'free' && box.menu && box.canvas === 'none'), JSON.stringify(box))
    await shut(page, touch)
    const ovenAt = await lookSolid(page, 23, spawn)
    await sleep(150)
    const cOven = await centerOf(page)
    await pressAt(page, cOven.x, cOven.y, 70, touch, 'right')
    await sleep(300)
    const oven = await page.evaluate(() => ({
      panel: document.getElementById('sheet').dataset.panel,
      lock: document.pointerLockElement ? 'locked' : 'free',
      menu: document.body.classList.contains('menu-open'),
      aim: window.__smoke.aim(),
    }))
    note('oven pointer', w + 'x' + h, !!ovenAt && oven.panel === 'station' && oven.lock === 'free' && oven.menu, JSON.stringify(oven))
    await shut(page, touch)
    let shopAim = null
    const spots = [[8.5, 5.2, 6.2, 0, 1.05], [9.5, 5.4, 7.2, Math.PI, 1.1], [6.5, 5.6, 8.2, Math.PI / 2, 1.0], [8.5, 6.4, 3.5, 0, 0.85]]
    for (const spot of spots) {
      await page.evaluate((s) => window.__smoke.stand(s[0], s[1], s[2], s[3], s[4]), spot)
      for (let i = 0; i < 8; i++) {
        await sleep(120)
        shopAim = await page.evaluate(() => {
          const a = window.__smoke.aim()
          if (!a || !window.__smoke.kept(a.x, a.y, a.z)) return null
          if (a.id !== 2) window.__smoke.plant(a.x, a.y, a.z, 2)
          const b = window.__smoke.aim()
          return b && b.id === 2 && window.__smoke.kept(b.x, b.y, b.z) ? b : null
        })
        if (shopAim) break
      }
      if (shopAim) break
    }
    const cShop = await centerOf(page)
    await holdAt(page, cShop.x, cShop.y, 1100, false)
    await sleep(200)
    const shop = await page.evaluate(() => window.__smoke.toast())
    const want = await page.evaluate(() => window.__smoke.word('shopProtected'))
    note('shop protected', w + 'x' + h, shop === want, (shop || '').slice(0, 60) + ' aim ' + JSON.stringify(shopAim))
    if (touch) {
      await shut(page, true)
      const dragBox = await lookSolid(page, 27, spawn)
      const drag = await page.evaluate((b) => {
        if (!b) return null
        window.__smoke.plant(b.x, b.y, b.z + 1, 30)
        return { x: b.x, y: b.y, z: b.z }
      }, dragBox)
      const cDrag = await centerOf(page)
      await page.touchscreen.touchStart(cDrag.x, cDrag.y)
      await sleep(40)
      await page.touchscreen.touchMove(cDrag.x + 70, cDrag.y + 8)
      await sleep(40)
      await page.touchscreen.touchMove(cDrag.x + 140, cDrag.y)
      await sleep(80)
      await page.touchscreen.touchEnd()
      await sleep(250)
      const dragged = await page.evaluate((d) => ({
        hidden: document.getElementById('sheet').hidden,
        box: d ? window.__smoke.voxel(d.x, d.y, d.z) : -1,
        door: d ? window.__smoke.voxel(d.x, d.y, d.z + 1) : -1,
      }), drag)
      note('touch drag no use', w + 'x' + h, !!drag && dragged.hidden && dragged.box === 27 && dragged.door === 30, JSON.stringify(dragged))
    } else {
      const wool = await page.evaluate(() => {
        let n = 0
        for (let x = 40; x < 100; x++) for (let z = 40; z < 100; z++) {
          for (let y = 20; y >= 1; y--) {
            const id = window.__smoke.voxel(x, y, z)
            if (id) { if (id >= 13 && id <= 16) n++; break }
          }
        }
        return n
      })
      note('wool tops', '1366x768', wool === 0, String(wool))
      const bunk = await page.evaluate(() => window.__smoke.bunk())
      note('bunk still wool', '1366x768', bunk === 'planks:3+woolBlue:3', bunk)
      await shut(page, false)
      const doorAt = await lookSolid(page, 30, spawn)
      if (doorAt) await page.evaluate((d) => window.__smoke.plant(d.x + 1, d.y, d.z, 27), doorAt)
      await sleep(120)
      const beforeDoor = await page.evaluate((d) => d ? window.__smoke.voxel(d.x, d.y, d.z) : -1, doorAt)
      const cSweep = await centerOf(page)
      await parkMouse(page, cSweep.x, cSweep.y)
      await page.mouse.down({ button: 'right' })
      const tSweep = Date.now()
      for (let i = 1; i <= 12; i++) {
        await page.mouse.move(cSweep.x + i * 16, cSweep.y + (i % 2))
        await sleep(90)
      }
      const left = 1500 - (Date.now() - tSweep)
      if (left > 0) await sleep(left)
      await page.mouse.up({ button: 'right' })
      await sleep(250)
      const swept = await page.evaluate((d) => ({
        door: d ? window.__smoke.voxel(d.x, d.y, d.z) : -1,
        hidden: document.getElementById('sheet').hidden,
      }), doorAt)
      note('sweep no use', '1366x768', !!doorAt && beforeDoor === 30 && swept.door === 30 && swept.hidden, beforeDoor + ' ' + JSON.stringify(swept))
      const flipAt = await lookSolid(page, 30, spawn)
      let onDoor = false
      for (let i = 0; i < 16 && flipAt; i++) {
        const aimed = await page.evaluate(() => window.__smoke.aim())
        if (aimed && aimed.id === 30 && aimed.x === flipAt.x && aimed.y === flipAt.y && aimed.z === flipAt.z) { onDoor = true; break }
        await sleep(50)
      }
      const cFlip = await centerOf(page)
      await pressAt(page, cFlip.x, cFlip.y, 50, false, 'right')
      await sleep(200)
      const flipped = await page.evaluate((d) => d ? window.__smoke.voxel(d.x, d.y, d.z) : -1, flipAt)
      note('door flips once', '1366x768', onDoor && flipped === 31, String(flipped))
    }
    await page.close()
  }
  await play(412, 915, true)
  await play(1366, 768, false)
  const woolPage = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
  await woolPage.evaluate(() => window.__smoke.plant(120, 10, 120, 13))
  await woolPage.evaluate(() => window.__smoke.persist())
  await woolPage.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  let keptWool = -1
  for (let i = 0; i < 25; i++) {
    keptWool = await woolPage.evaluate(() => (window.__smoke ? window.__smoke.voxel(120, 10, 120) : -1)).catch(() => -1)
    if (keptWool === 13) break
    await sleep(200)
  }
  note('wool save', '1366x768', keptWool === 13, String(keptWool))
  await woolPage.close()

  for (const [lang, touchWord, keyWord] of [
    ['en', 'Move with the stick', 'Walk with WASD'],
    ['ru', 'Двигайся стиком', 'Иди с WASD'],
    ['ar', 'تحرك بالعصا', 'امش مع WASD'],
    ['fa-AF', 'با اهرم برو', 'با WASD برو'],
  ]) {
    for (const [w, h, touch, expect] of [[412, 915, true, touchWord], [1366, 768, false, keyWord]]) {
      const page = await bootHud(browser, testUrl + '?lang=' + lang + '&smoke=1', w, h, touch)
      const help = await page.evaluate(() => window.__smoke.word('help'))
      const tour = await page.evaluate(() => window.__smoke.word('tour'))
      await tapSel(page, '.kb-bar .kb-menu', touch)
      await sleep(250)
      await tapLabel(page, help, touch)
      await sleep(200)
      await tapLabel(page, tour, touch)
      await sleep(200)
      const seen = await page.evaluate(() => {
        const step = document.querySelector('#sheet-body .gnote')
        return { step: step ? step.textContent : '', news: document.getElementById('whats-new').textContent }
      })
      const latin = /[A-Za-z]/.test((seen.step + seen.news).replace(/WASD/g, ''))
      const strict = lang === 'ru' || lang === 'ar' || lang === 'fa-AF'
      note('tour words', lang + ' ' + w, seen.step === expect && (!strict || !latin), seen.step)
      if (touch) note('whats new', lang, seen.news.length > 8 && (!strict || !/[A-Za-z]/.test(seen.news)), seen.news.slice(0, 70))
      await page.close()
    }
  }

  for (const lang of ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']) {
    const page = await bootHud(browser, testUrl + '?lang=' + encodeURIComponent(lang) + '&smoke=1', 412, 915, true)
    errs.push(...page.__err.map((e) => 'bag ' + e))
    for (const [w, h] of [[360, 740], [412, 915]]) {
      await page.setViewport({ width: w, height: h, hasTouch: true, isMobile: true })
      await sleep(180)
      const bag = await page.evaluate(() => {
        const tile = document.querySelector('#hotbar .slot.bag-tile')
        const lbl = tile && tile.querySelector('.lbl')
        if (!tile || !lbl) return null
        const tr = tile.getBoundingClientRect()
        const lr = lbl.getBoundingClientRect()
        const inside = lr.left >= tr.left - 0.5 && lr.right <= tr.right + 0.5 && lr.top >= tr.top - 0.5 && lr.bottom <= tr.bottom + 0.5
        return { text: lbl.textContent, sh: lbl.scrollHeight, ch: lbl.clientHeight, sw: lbl.scrollWidth, cw: lbl.clientWidth, th: tr.height, inside }
      })
      const ok = !!(bag && bag.text && bag.sh <= bag.ch && bag.sw <= bag.cw && bag.inside && bag.th >= 48)
      note('bag label', lang + ' ' + w, ok, JSON.stringify(bag))
    }
    await page.close()
  }

  for (const lang of ['en', 'ru', 'ar', 'fa-AF']) {
    for (const [w, h] of [[1366, 768], [915, 412]]) {
      const page = await bootHud(browser, testUrl + '?lang=' + encodeURIComponent(lang) + '&smoke=1', w, h, false)
      errs.push(...page.__err.map((e) => 'keys ' + e))
      const fit = await page.evaluate((w, h) => {
        const el = document.querySelector('.keys')
        if (!el) return { missing: true }
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        const on = r.left >= -0.5 && r.top >= -0.5 && r.right <= w + 0.5 && r.bottom <= h + 0.5 && r.width > 2
        const clip = el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1
        function box(node) {
          if (!node) return null
          const cs = getComputedStyle(node)
          if (node.hidden || cs.display === 'none' || cs.visibility === 'hidden') return null
          const b = node.getBoundingClientRect()
          if (b.width < 2 || b.height < 2) return null
          return b
        }
        function hit(a, b) {
          return a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5
        }
        let overlap = ''
        for (const slot of document.querySelectorAll('#hotbar .slot')) {
          const b = box(slot)
          if (b && hit(r, b)) overlap += 'slot '
        }
        const path = box(document.getElementById('path-chip'))
        const hint = box(document.getElementById('menu-hint'))
        if (path && hit(r, path)) overlap += 'path '
        if (hint && hit(r, hint)) overlap += 'hint '
        return { on, clip, overlap, sw: el.scrollWidth, cw: el.clientWidth, op: s.opacity, disp: s.display, text: el.textContent.slice(0, 48) }
      }, w, h)
      note('keys fit', lang + ' ' + w, !!(fit.on && fit.clip && !fit.overlap && fit.disp !== 'none'), JSON.stringify(fit))
      await page.close()
    }
  }

  const fade = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
  errs.push(...fade.__err.map((e) => 'fade ' + e))
  await fade.focus('body')
  await fade.keyboard.press('w')
  await fade.keyboard.press('a')
  await sleep(40)
  const midOp = await fade.evaluate(() => {
    const el = document.querySelector('.keys')
    const s = getComputedStyle(el)
    return { op: s.opacity, disp: s.display, help: document.querySelector('[data-i18n="keysHint"].help').textContent, line: el.textContent, hint: window.__smoke.word('keysHint'), short: window.__smoke.word('keysLine') }
  })
  await fade.keyboard.press('s')
  await sleep(1000)
  const goneOp = await fade.evaluate(() => getComputedStyle(document.querySelector('.keys')).opacity)
  note('keys fade', '1366x768', midOp.op === '1' && midOp.disp !== 'none' && Number(goneOp) <= 0.02 && midOp.help === midOp.hint && midOp.line === midOp.short && midOp.line !== midOp.hint, midOp.op + '->' + goneOp)
  await fade.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
  await fade.waitForFunction(() => document.querySelector('.keys'), { timeout: 20000 }).catch(() => {})
  await sleep(400)
  const back = await fade.evaluate(() => {
    const el = document.querySelector('.keys')
    return el ? getComputedStyle(el).opacity + ' ' + getComputedStyle(el).display : 'missing'
  })
  note('keys back', '1366x768', back.startsWith('1 ') && !back.includes('none'), back)
  await fade.close()

  const red = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false, null, [{ name: 'prefers-reduced-motion', value: 'reduce' }])
  errs.push(...red.__err.map((e) => 'reduce ' + e))
  await red.focus('body')
  await red.keyboard.press('w')
  await red.keyboard.press('a')
  await red.keyboard.press('s')
  await sleep(40)
  const hid = await red.evaluate(() => {
    const el = document.querySelector('.keys')
    const s = getComputedStyle(el)
    return { disp: s.display, op: s.opacity, trans: el.style.transition || '' }
  })
  note('keys reduce', '1366x768', hid.disp === 'none' && !hid.trans, JSON.stringify(hid))
  await red.close()

  async function chopPage(w, h) {
    const page = await bootHud(browser, testUrl + '?smoke=1', w, h, true)
    errs.push(...page.__err.map((e) => 'chop ' + e))
    await page.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
    const spawn = [8.5, 6.2, 16, Math.PI, 0.7]
    await page.evaluate(() => window.__smoke.emptyBag())
    await page.evaluate((s) => window.__smoke.stand(s[0], s[1], s[2], s[3], s[4]), spawn)
    await sleep(250)
    await waitSteady(page)
    const log = await lookSolid(page, 11, spawn)
    await waitSteady(page)
    const c = await centerOf(page)
    return { page, log, c, spawn }
  }
  const tip = await bootHud(browser, testUrl + '?smoke=1&q=lite', 915, 412, true)
  errs.push(...tip.__err.map((e) => 'tip ' + e))
  const pathTouch = await tip.evaluate(() => {
    const el = document.getElementById('path-chip')
    return { text: el.textContent, tree: window.__smoke.word('pathTree'), sub: window.__smoke.word('pathTreeTouch'), hidden: el.hidden }
  })
  note('path hold line', '915x412', !pathTouch.hidden && pathTouch.text.includes(pathTouch.tree) && pathTouch.text.includes(pathTouch.sub), pathTouch.text)
  const mousePath = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
  const pathMouse = await mousePath.evaluate(() => {
    const el = document.getElementById('path-chip')
    return { text: el.textContent, sub: window.__smoke.word('pathTreeTouch'), tree: window.__smoke.word('pathTree') }
  })
  note('path hold line mouse', '1366x768', pathMouse.text.includes(pathMouse.tree) && !pathMouse.text.includes(pathMouse.sub), pathMouse.text)
  await mousePath.close()
  const ringAt = await lookSolid(tip, 11, [8.5, 6.2, 16, Math.PI, 0.7])
  const ringC = await centerOf(tip)
  await tip.touchscreen.touchStart(ringC.x, ringC.y)
  await sleep(200)
  const ring = await tip.evaluate(() => {
    const el = document.getElementById('pick-ring')
    if (!el || el.hidden) return { on: false }
    const r = el.getBoundingClientRect()
    return { on: r.width >= 20 && r.height >= 20 }
  })
  await sleep(450)
  await tip.touchscreen.touchEnd()
  note('crack ring early', '915x412', !!ringAt && ring.on, JSON.stringify(ring))
  await tip.close()
  const toastPage = await bootHud(browser, testUrl + '?smoke=1&q=lite', 915, 412, true)
  errs.push(...toastPage.__err.map((e) => 'toast ' + e))
  await toastPage.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
  await toastPage.evaluate(() => { window.__smoke.fillBag('stick', 1); window.__smoke.emptyBag() })
  await toastPage.evaluate((s) => window.__smoke.stand(s[0], s[1], s[2], s[3], s[4]), [8.5, 6.2, 16, Math.PI, 0.7])
  await waitSteady(toastPage)
  const toastLog = await lookSolid(toastPage, 11, [8.5, 6.2, 16, Math.PI, 0.7])
  await waitSteady(toastPage)
  const toastC = await centerOf(toastPage)
  await toastPage.touchscreen.tap(toastC.x, toastC.y)
  let toast1 = { toast: '', want: '' }
  const toastWait = Date.now()
  while (Date.now() - toastWait < 600) {
    toast1 = await toastPage.evaluate(() => ({ toast: window.__smoke.toast(), want: window.__smoke.word('holdToBreak') }))
    if (toast1.toast === toast1.want) break
    await sleep(40)
  }
  await sleep(2600)
  await toastPage.touchscreen.tap(toastC.x, toastC.y)
  await sleep(150)
  const toast2 = await toastPage.evaluate(() => window.__smoke.toast())
  note('hold toast once', '915x412', !!toastLog && toast1.toast === toast1.want && toast2 === '', toast1.toast + ' / ' + toast2)
  await toastPage.close()
  const broke = await chopPage(915, 412)
  await waitSteady(broke.page)
  let live = null
  let chopped = { id: -1, n: 0, aim: null }
  for (let attempt = 0; attempt < 3 && !(live && chopped.id === 0 && chopped.n === 1); attempt++) {
    const holdC = await centerOf(broke.page)
    live = await broke.page.evaluate((x, y) => {
      let h = window.__smoke.hit(x, y)
      if (!h || window.__smoke.kept(h.x, h.y, h.z)) return null
      if (h.id !== 11) window.__smoke.plant(h.x, h.y, h.z, 11)
      h = window.__smoke.hit(x, y)
      return h && h.id === 11 ? h : null
    }, holdC.x, holdC.y)
    if (!live) {
      live = await lookSolid(broke.page, 11, broke.spawn)
      continue
    }
    await jitterHold(broke.page, holdC.x, holdC.y, 2500)
    await sleep(250)
    chopped = await broke.page.evaluate((b) => ({
      id: b ? window.__smoke.voxel(b.x, b.y, b.z) : -1,
      n: window.__smoke.count('log'),
      aim: b,
    }), live)
  }
  note('jitter chop', '915x412', !!live && live.id === 11 && chopped.id === 0 && chopped.n === 1, JSON.stringify(chopped))
  const pathAfter = await broke.page.evaluate(() => document.getElementById('path-chip').textContent)
  const subWord = await broke.page.evaluate(() => window.__smoke.word('pathTreeTouch'))
  note('path hold gone', '915x412', !pathAfter.includes(subWord), pathAfter)
  const drag = await lookSolid(broke.page, 11, broke.spawn)
  const dragC = await centerOf(broke.page)
  const head0 = await broke.page.evaluate(() => window.__smoke.heading())
  await broke.page.touchscreen.touchStart(dragC.x, dragC.y)
  await broke.page.touchscreen.touchMove(dragC.x + 40, dragC.y)
  await sleep(60)
  const head1 = await broke.page.evaluate(() => window.__smoke.heading())
  await broke.page.touchscreen.touchEnd()
  await sleep(80)
  const stayed = await broke.page.evaluate((b) => b ? window.__smoke.voxel(b.x, b.y, b.z) : -1, drag)
  note('drag keeps log', '915x412', !!drag && stayed === 11 && Math.abs(head1 - head0) > 0.02, stayed + ' h ' + head0.toFixed(3) + '->' + head1.toFixed(3))
  const copyBtn = await broke.page.evaluate(() => {
    const el = document.getElementById('pick-chip')
    const r = el.getBoundingClientRect()
    const slots = [...document.querySelectorAll('#hotbar .slot')].map((s) => s.getBoundingClientRect())
    const hitSlot = slots.some((b) => r.left < b.right && r.right > b.left && r.top < b.bottom && r.bottom > b.top)
    return { text: el.textContent, svg: !!el.querySelector('svg'), w: r.width, h: r.height, x: r.x, y: r.y, hitSlot, vw: innerWidth, vh: innerHeight, tip: el.getAttribute('aria-label'), want: window.__smoke.word('copyTip') }
  })
  const copyOn = copyBtn.svg && copyBtn.text.includes('Copy') && copyBtn.w >= 44 && copyBtn.h >= 44 && copyBtn.x >= -1 && copyBtn.y >= -1 && copyBtn.x + copyBtn.w <= copyBtn.vw + 1 && copyBtn.y + copyBtn.h <= copyBtn.vh + 1 && !copyBtn.hitSlot && copyBtn.tip === copyBtn.want
  note('copy button', '915x412', copyOn, JSON.stringify(copyBtn))
  await broke.page.evaluate(() => window.__smoke.fillBag('planks', 8))
  await tapSel(broke.page, '#pick-chip', true)
  await sleep(100)
  const plank = await lookSolid(broke.page, 10, broke.spawn)
  const plankC = await centerOf(broke.page)
  await broke.page.touchscreen.tap(plankC.x, plankC.y)
  await sleep(200)
  const copied = await broke.page.evaluate(() => ({
    held: document.getElementById('current').textContent,
    name: window.__smoke.word('planks'),
    armed: document.getElementById('pick-chip').getAttribute('aria-pressed'),
    n: window.__smoke.count('planks'),
  }))
  note('copy tap planks', '915x412', !!plank && copied.held === copied.name && copied.armed === 'false' && copied.n === 8, JSON.stringify(copied))
  await tapSel(broke.page, '#pick-chip', true)
  await sleep(80)
  const armedLog = await lookSolid(broke.page, 11, broke.spawn)
  const armedC = await centerOf(broke.page)
  await jitterHold(broke.page, armedC.x, armedC.y, 2300)
  await sleep(200)
  const armedChop = await broke.page.evaluate((b) => ({ id: b ? window.__smoke.voxel(b.x, b.y, b.z) : -1, n: window.__smoke.count('log') }), armedLog)
  note('copy hold still breaks', '915x412', !!armedLog && armedChop.id === 0 && armedChop.n >= 1, JSON.stringify(armedChop))
  await broke.page.close()
  const small = await chopPage(360, 740)
  const smallLive = await small.page.evaluate(() => window.__smoke.aim())
  await jitterHold(small.page, small.c.x, small.c.y, 2300)
  await sleep(200)
  const smallChop = await small.page.evaluate((b) => ({ id: b ? window.__smoke.voxel(b.x, b.y, b.z) : -1, n: window.__smoke.count('log'), aim: b }), smallLive)
  const fit360 = await small.page.evaluate(() => {
    const el = document.getElementById('pick-chip')
    const r = el.getBoundingClientRect()
    return { text: el.textContent, w: r.width, h: r.height, x: r.x, y: r.y, vw: innerWidth, vh: innerHeight }
  })
  const fitOk = fit360.text.includes('Copy') && fit360.w >= 44 && fit360.h >= 44 && fit360.x >= -1 && fit360.y >= -1 && fit360.x + fit360.w <= fit360.vw + 1 && fit360.y + fit360.h <= fit360.vh + 1
  note('jitter chop', '360x740', !!smallLive && smallLive.id === 11 && smallChop.id === 0 && smallChop.n === 1 && fitOk, JSON.stringify(smallChop) + ' ' + JSON.stringify(fit360))
  await small.page.close()

  async function dragLook(page, dx, dy) {
    const c = await centerOf(page)
    const len = Math.hypot(dx, dy) || 1
    const tx = dx + (24 * dx) / len
    const ty = dy + (24 * dy) / len
    await page.touchscreen.touchStart(c.x, c.y)
    for (let i = 1; i <= 8; i++) {
      await page.touchscreen.touchMove(c.x + (tx * i) / 8, c.y + (ty * i) / 8)
      await sleep(16)
    }
    await page.touchscreen.touchEnd()
    await sleep(50)
  }
  async function walkStick(page, ms) {
    const pad = await page.evaluate(() => {
      const r = document.getElementById('stick-pad').getBoundingClientRect()
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
    })
    await page.touchscreen.touchStart(pad.x, pad.y)
    await page.touchscreen.touchMove(pad.x, pad.y - 40)
    await sleep(ms)
    await page.touchscreen.touchEnd()
    await sleep(60)
  }
  async function findHit(page, kind) {
    return page.evaluate((kind) => {
      const c = document.querySelector('canvas').getBoundingClientRect()
      const aim = window.__smoke.aim()
      const cx = c.left + c.width / 2
      const cy = c.top + c.height / 2
      let best = null
      for (let y = c.top + 16; y < c.bottom - 56; y += 14) {
        for (let x = c.left + 10; x < c.right - 10; x += 14) {
          const h = window.__smoke.hit(x, y)
          if (!h) continue
          const cd = Math.hypot(x - cx, y - cy)
          let ok = false
          if (kind === 'log') ok = h.x === 2 && h.y === 5 && h.z === 2 && cd > 30
          else if (kind === 'road') ok = h.id === 7 && window.__smoke.kept(h.x, h.y, h.z)
          else if (kind === 'grass') {
            const p = window.__smoke.pos()
            const ax = h.ax, ay = h.ay, az = h.az
            const overlap = ax < p[0] + 0.3 && ax + 1 > p[0] - 0.3 && ay < p[1] + 1.8 && ay + 1 > p[1] && az < p[2] + 0.3 && az + 1 > p[2] - 0.3
            ok = h.id === 1 && !window.__smoke.kept(h.x, h.y, h.z) && window.__smoke.voxel(ax, ay, az) === 0 && !overlap
          }
          if (!ok) continue
          let solid = 0
          if (kind === 'log') {
            for (const [dx, dy] of [[0, 10], [0, -10], [10, 0], [-10, 0]]) {
              const n = window.__smoke.hit(x + dx, y + dy)
              if (n && n.x === 2 && n.y === 5 && n.z === 2) solid++
            }
          }
          if (!best || solid > best.solid || (solid === best.solid && cd < best.cd)) best = { x, y, cd, h, aim, solid }
        }
      }
      return best
    }, kind)
  }
  async function approachLog(page) {
    await page.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
    await page.evaluate(() => { window.__smoke.fresh(); window.__smoke.emptyBag(); window.__smoke.key(0) })
    for (let i = 0; i < 40; i++) {
      const id = await page.evaluate(() => window.__smoke.world(2, 5, 2))
      if (id === 11) break
      await sleep(100)
    }
    await page.waitForFunction(() => window.__smoke.grounded(), { timeout: 8000 }).catch(() => {})
    for (let step = 0; step < 12; step++) {
      const st = await page.evaluate(() => {
        const p = window.__smoke.pos()
        const h = window.__smoke.heading()
        const want = Math.atan2(2.5 - p[0], 2.5 - p[2])
        let d = want - h
        while (d > Math.PI) d -= Math.PI * 2
        while (d < -Math.PI) d += Math.PI * 2
        return { d, dist: Math.hypot(p[0] - 2.5, p[2] - 2.5) }
      })
      if (st.dist < 3.05) break
      const px = st.d / (0.40 * Math.PI / 180)
      if (Math.abs(px) > 10) await dragLook(page, Math.max(-150, Math.min(150, px)), 0)
      await walkStick(page, 320)
    }
    for (const yaw of [0, 48, -48, 72, -72]) {
      if (yaw) await dragLook(page, yaw, 8)
      const spot = await findHit(page, 'log')
      const aim = await page.evaluate(() => window.__smoke.aim())
      const aimLog = !!(aim && aim.x === 2 && aim.y === 5 && aim.z === 2)
      if (spot && !aimLog) return { spot, aim }
    }
    const spot = await findHit(page, 'log')
    const aim = await page.evaluate(() => window.__smoke.aim())
    return { spot, aim }
  }
  async function hudNow(page) {
    return page.evaluate(() => {
      const slot = document.querySelector('#hotbar .slot:not(.bag-tile)')
      return {
        tag: slot && slot.querySelector('.tag') ? slot.querySelector('.tag').textContent : '',
        n: slot && slot.querySelector('.lbl') ? slot.querySelector('.lbl').textContent : '',
        cur: document.getElementById('current').textContent,
        log: window.__smoke.word('log'),
        dirt: window.__smoke.word('dirt'),
      }
    })
  }
  for (const [w, h] of [[915, 412], [360, 740]]) {
    const page = await bootHud(browser, testUrl + '?smoke=1&q=lite', w, h, true)
    errs.push(...page.__err.map((e) => 'finger ' + e))
    const got = await approachLog(page)
    await page.evaluate(() => window.__smoke.key(0))
    const aimLog = !!(got.aim && got.aim.x === 2 && got.aim.y === 5 && got.aim.z === 2)
    const spot = got.spot
    if (spot) await jitterHold(page, spot.x, spot.y, 2300)
    await sleep(200)
    const chopped = await page.evaluate(() => ({ id: window.__smoke.voxel(2, 5, 2), n: window.__smoke.count('log') }))
    note('finger chop', w + 'x' + h, !!spot && !aimLog && chopped.id === 0 && chopped.n === 1, JSON.stringify({ aim: got.aim, spot: spot && { x: Math.round(spot.x), y: Math.round(spot.y) }, chopped }))
    const hud = await hudNow(page)
    note('hotbar after chop', w + 'x' + h, hud.tag === 'L' && hud.n === '1' && hud.cur === hud.log, JSON.stringify(hud))
    if (w === 915) {
      const road = await findHit(page, 'road')
      let roadToast = ''
      let roadId = -1
      if (road) {
        const before = road.h.id
        await page.touchscreen.touchStart(road.x, road.y)
        await sleep(1000)
        roadToast = await page.evaluate(() => window.__smoke.toast())
        await page.touchscreen.touchEnd()
        await sleep(80)
        roadId = await page.evaluate((b) => window.__smoke.voxel(b.x, b.y, b.z), road.h)
        const want = await page.evaluate(() => window.__smoke.word('shopProtected'))
        note('road finger', '915x412', roadId === before && roadToast === want, roadToast + ' id ' + roadId)
      } else note('road finger', '915x412', false, 'no road')
      const grass = await findHit(page, 'grass')
      if (grass) {
        await page.touchscreen.tap(grass.x, grass.y)
        await sleep(200)
        const placed = await page.evaluate((b) => ({
          face: window.__smoke.voxel(b.ax, b.ay, b.az),
          grass: window.__smoke.voxel(b.x, b.y, b.z),
          n: window.__smoke.count('log'),
        }), grass.h)
        note('finger places', '915x412', placed.grass === 1 && placed.face === 11 && placed.n === 0, JSON.stringify(placed))
      } else note('finger places', '915x412', false, 'no grass')
    }
    await page.close()
  }
  const mouse = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
  errs.push(...mouse.__err.map((e) => 'mousechop ' + e))
  await mouse.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
  await mouse.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.key(0) })
  const mouseSpawn = [8.5, 6.2, 16, Math.PI, 0.7]
  let dirt = null
  let mouseGone = -1
  for (let attempt = 0; attempt < 3 && mouseGone !== 0; attempt++) {
    await mouse.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.key(0) })
    dirt = await lookSolid(mouse, 2, mouseSpawn)
    if (!dirt) continue
    const still = await mouse.evaluate((b) => {
      const a = window.__smoke.aim()
      return !!(a && a.id === 2 && a.x === b.x && a.y === b.y && a.z === b.z)
    }, dirt)
    if (!still) { dirt = null; continue }
    await stillHold(mouse, 1000, false)
    await sleep(200)
    mouseGone = await mouse.evaluate((b) => window.__smoke.voxel(b.x, b.y, b.z), dirt)
  }
  const mouseHud = await hudNow(mouse)
  note('mouse crosshair', '1366x768', !!dirt && mouseGone === 0 && mouseHud.tag === 'D' && mouseHud.n === '1' && mouseHud.cur === mouseHud.dirt, mouseGone + ' ' + JSON.stringify(mouseHud))
  await mouse.close()
  await prove2548()

  async function prove2548() {
    for (const [w, h, touch] of [[412, 915, true], [915, 412, true], [1366, 768, false]]) {
      const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
      errs.push(...page.__err.map((e) => 'b248 ' + w + ' ' + e))
      await page.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
      const boot = await page.evaluate(() => ({ always: window.__smoke.always(), phase: window.__smoke.phase(), day: document.documentElement.dataset.alwaysDay || '0' }))
      note('cycle on', w + 'x' + h, boot.always === false && boot.phase === 'day' && boot.day !== '1', JSON.stringify(boot))
      const dayL = await page.evaluate(() => window.__smoke.lum())
      await page.evaluate(() => window.__smoke.seek(window.__smoke.nightAt()))
      const nightL = await page.evaluate(() => window.__smoke.lum())
      note('night lum', w + 'x' + h, dayL > 0 && nightL + 1e-6 >= dayL * 0.4, dayL.toFixed(3) + ' -> ' + nightL.toFixed(3))
      await page.evaluate(() => window.__smoke.bright(true))
      const brightL = await page.evaluate(() => window.__smoke.lum())
      note('brighter nights', w + 'x' + h, brightL + 1e-6 >= dayL * 0.6, brightL.toFixed(3))
      await page.evaluate(() => { window.__smoke.bright(false); window.__smoke.seek(0) })
      await page.evaluate(() => window.__smoke.emptyBag())
      const spawn = [8.5, 6.2, 16, Math.PI, 0.7]
      const door = await lookSolid(page, 30, spawn)
      if (door) await page.evaluate((d) => window.__smoke.plant(d.x + 1, d.y, d.z, 30), door)
      await waitSteady(page)
      const c = await centerOf(page)
      if (touch) await page.touchscreen.tap(c.x, c.y)
      else await pressAt(page, c.x, c.y, 80, false, 'right')
      await sleep(250)
      const opened = await page.evaluate((d) => d ? { a: window.__smoke.voxel(d.x, d.y, d.z), b: window.__smoke.voxel(d.x + 1, d.y, d.z) } : null, door)
      note('double door tap', w + 'x' + h, !!opened && opened.a === 31 && opened.b === 31, JSON.stringify(opened))
      if (door) {
        await page.evaluate((d) => { window.__smoke.auto(d.x, d.y, d.z, true); window.__smoke.use(d.x, d.y, d.z); window.__smoke.use(d.x, d.y, d.z) }, door)
        await page.evaluate(() => window.__smoke.clock(3000))
        const shut = await page.evaluate((d) => ({ a: window.__smoke.voxel(d.x, d.y, d.z), b: window.__smoke.voxel(d.x + 1, d.y, d.z) }), door)
        note('auto close', w + 'x' + h, shut.a === 30 && shut.b === 30, JSON.stringify(shut))
      } else note('auto close', w + 'x' + h, false, 'no door')
      await page.close()
    }

    const page = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
    errs.push(...page.__err.map((e) => 'b248b ' + e))
    await page.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
    await page.evaluate(() => window.__smoke.emptyBag())
    const metal = await lookSolid(page, 34, [8.5, 6.2, 16, Math.PI, 0.7])
    const mc = await centerOf(page)
    await pressAt(page, mc.x, mc.y, 80, false, 'right')
    await sleep(200)
    const metalTap = await page.evaluate((d) => d ? { id: window.__smoke.voxel(d.x, d.y, d.z), toast: window.__smoke.toast(), want: window.__smoke.word('needsButton') } : null, metal)
    note('metal tap', '1366x768', !!metalTap && metalTap.id === 34 && metalTap.toast === metalTap.want, JSON.stringify(metalTap))
    if (metal) {
      await page.evaluate((d) => { window.__smoke.plant(d.x + 1, d.y, d.z, 38); window.__smoke.use(d.x + 1, d.y, d.z) }, metal)
      const levered = await page.evaluate((d) => window.__smoke.voxel(d.x, d.y, d.z), metal)
      note('lever opens metal', '1366x768', levered === 35, String(levered))
      await page.evaluate((d) => { window.__smoke.use(d.x + 1, d.y, d.z); window.__smoke.plant(d.x, d.y, d.z + 1, 40); window.__smoke.use(d.x, d.y, d.z + 1) }, metal)
      const pushed = await page.evaluate((d) => window.__smoke.voxel(d.x, d.y, d.z), metal)
      await page.evaluate(() => window.__smoke.clock(1500))
      const released = await page.evaluate((d) => ({ door: window.__smoke.voxel(d.x, d.y, d.z), button: window.__smoke.voxel(d.x, d.y, d.z + 1) }), metal)
      note('button 1.5s', '1366x768', pushed === 35 && released.door === 34 && released.button === 40, pushed + ' ' + JSON.stringify(released))
    } else note('lever opens metal', '1366x768', false, 'no metal')
    const slide = await page.evaluate(() => { window.__smoke.plant(70, 6, 70, 36); window.__smoke.use(70, 6, 70); return window.__smoke.voxel(70, 6, 70) })
    await page.evaluate(() => window.__smoke.clock(3000))
    const slideShut = await page.evaluate(() => window.__smoke.voxel(70, 6, 70))
    note('sliding auto', '1366x768', slide === 37 && slideShut === 36, slide + ' -> ' + slideShut)
    await page.evaluate(() => {
      window.__smoke.plant(80, 6, 80, 30)
      window.__smoke.lock(80, 6, 80, 'you')
      window.__smoke.actor('other')
    })
    const refused = await page.evaluate(() => { window.__smoke.use(80, 6, 80); return window.__smoke.voxel(80, 6, 80) })
    await page.evaluate(() => window.__smoke.teacher(true))
    const taught = await page.evaluate(() => { window.__smoke.use(80, 6, 80); return window.__smoke.voxel(80, 6, 80) })
    note('lock and teacher', '1366x768', refused === 30 && taught === 31, refused + ' ' + taught)
    await page.evaluate(() => window.__smoke.persist())
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    let keptDoor = -1
    for (let i = 0; i < 25; i++) {
      keptDoor = await page.evaluate(() => (window.__smoke ? window.__smoke.voxel(80, 6, 80) : -1)).catch(() => -1)
      if (keptDoor === 31) break
      await sleep(200)
    }
    const again = await page.evaluate(() => { window.__smoke.actor('other'); window.__smoke.use(80, 6, 80); return window.__smoke.voxel(80, 6, 80) })
    note('door save', '1366x768', keptDoor === 31 && again === 31, keptDoor + ' ' + again)
    const old = await page.evaluate(() => window.__smoke.loadOld())
    const oldOk = old && old.ids.length === 31 && old.ids.every((id, i) => id === i + 1) && old.unknown === 0 && old.gift.includes('glowPebble')
    note('old save', '1366x768', oldOk, JSON.stringify({ unknown: old && old.unknown, gift: old && old.gift, bad: old && old.ids.filter((id, i) => id !== i + 1).length }))
    await page.close()

    const hold = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true)
    errs.push(...hold.__err.map((e) => 'holddoor ' + e))
    await hold.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
    await hold.evaluate(() => window.__smoke.emptyBag())
    const hd = await lookSolid(hold, 30, [8.5, 6.2, 16, Math.PI, 0.7])
    const hc = await centerOf(hold)
    await hold.touchscreen.touchStart(hc.x, hc.y)
    await sleep(700)
    const opt = await hold.evaluate(() => {
      const el = document.getElementById('door-auto')
      const box = document.getElementById('door-opt')
      const r = el.getBoundingClientRect()
      return { h: r.height, w: r.width, hidden: !box || box.hidden }
    })
    await sleep(2500)
    await hold.touchscreen.touchEnd()
    await sleep(150)
    const stayed = await hold.evaluate((d) => d ? window.__smoke.voxel(d.x, d.y, d.z) : -1, hd)
    note('door hold', '412x915', !!hd && stayed === 30 && !opt.hidden && opt.h >= 44 && opt.w >= 44, stayed + ' ' + JSON.stringify(opt))
    await hold.close()

    const lamp = await bootHud(browser, testUrl + '?smoke=1', 1366, 768, false)
    errs.push(...lamp.__err.map((e) => 'lamp ' + e))
    await lamp.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
    await lamp.evaluate(() => window.__smoke.emptyBag())
    const need = await lamp.evaluate(() => window.__smoke.needs('lantern'))
    const wantT5 = await lamp.evaluate(() => window.__smoke.word('needsT5'))
    note('needs T5', '1366x768', need.includes(wantT5), need.slice(0, 180))
    const made = await lamp.evaluate(() => {
      window.__smoke.gate('T5')
      const p = window.__smoke.pos()
      const x = Math.floor(p[0]) + 2
      const y = Math.floor(p[1])
      const z = Math.floor(p[2])
      window.__smoke.plant(x, y, z, 43)
      const card = window.__smoke.card()
      const lost = window.__smoke.lost()
      window.__smoke.plant(x + 1, y, z, 43)
      const lost2 = window.__smoke.lost()
      window.__smoke.fillBag('glass', 1)
      window.__smoke.fillBag('steel', 1)
      window.__smoke.fillBag('batteryCell', 1)
      const craft = window.__smoke.craft('lantern')
      return { card, lost, lost2, craft, n: window.__smoke.count('lantern'), want: window.__smoke.word('starterKit') }
    })
    note('starter kit', '1366x768', made.card === made.want && made.lost.includes('batteryCell:1') && made.lost.includes('charger:1') && made.lost2.filter((s) => s.startsWith('batteryCell')).length === 1, JSON.stringify(made))
    note('craft lantern', '1366x768', !!(made.craft && made.craft.ok) && made.n >= 1, JSON.stringify(made.craft) + ' n ' + made.n)
    const drained = await lamp.evaluate(() => {
      window.__smoke.plant(60, 6, 60, 47)
      window.__smoke.use(60, 6, 60)
      window.__smoke.use(60, 6, 60)
      window.__smoke.use(60, 6, 60)
      const high = window.__smoke.light(60, 6, 60)
      window.__smoke.seek(window.__smoke.nightAt())
      window.__smoke.clock(2.5 * 60 * 1000)
      const empty = window.__smoke.light(60, 6, 60)
      window.__smoke.plant(61, 6, 60, 48)
      window.__smoke.clock(2 * 60 * 1000)
      const plugged = window.__smoke.light(60, 6, 60)
      window.__smoke.plant(61, 6, 60, 0)
      window.__smoke.charge(60, 6, 60, 0)
      window.__smoke.seek(0)
      window.__smoke.clock(4 * 60 * 1000)
      const sun = window.__smoke.light(60, 6, 60)
      return { high, empty, plugged, sun }
    })
    const highOk = drained.high && drained.high.level === 'high' && drained.high.radius === 10
    const emptyOk = drained.empty && drained.empty.radius === 1
    const plugOk = drained.plugged && drained.plugged.charge >= 0.99 && drained.plugged.radius === 10
    const sunOk = drained.sun && drained.sun.charge >= 0.99
    note('lantern taps', '1366x768', highOk && emptyOk && plugOk && sunOk, JSON.stringify(drained))
    const badges = await lamp.evaluate(() => {
      window.__smoke.clearLights()
      window.__smoke.resetBadges()
      window.__smoke.seek(window.__smoke.nightAt())
      for (let i = 0; i < 10; i++) {
        window.__smoke.plant(200 + i * 2, 4, 200, 47)
        window.__smoke.use(200 + i * 2, 4, 200)
      }
      window.__smoke.clock(0)
      const close = window.__smoke.badge()
      window.__smoke.clearLights()
      window.__smoke.resetBadges()
      for (let i = 0; i < 10; i++) {
        window.__smoke.plant(200 + i * 3, 4, 220, 47)
        window.__smoke.use(200 + i * 3, 4, 220)
      }
      window.__smoke.clock(0)
      const once = window.__smoke.badge()
      window.__smoke.clock(0)
      const twice = window.__smoke.badge()
      return { close, once, twice }
    })
    note('light up spaced', '1366x768', badges.close === 0 && badges.once === 1 && badges.twice === 1, JSON.stringify(badges))
    await lamp.evaluate(() => {
      window.__smoke.close()
      window.__smoke.clearLights()
      window.__smoke.bright(false)
      window.__smoke.always(false)
      window.__smoke.seek(window.__smoke.nightAt())
      window.__smoke.stand(48.5, 12, 36, 0, 0.35)
    })
    await sleep(400)
    let gy = -1
    for (let i = 0; i < 25 && gy < 0; i++) {
      gy = await lamp.evaluate(() => {
        for (let y = 40; y >= 1; y--) if (window.__smoke.voxel(48, y, 48)) return y
        return -1
      })
      if (gy < 0) await sleep(200)
    }
    await lamp.evaluate((y) => window.__smoke.stand(48.5, y + 1.2, 36, 0, 0.35), gy)
    await sleep(1600)
    await sleep(4200)
    const base = await lamp.evaluate(() => window.__smoke.fpsSpan(4000))
    await lamp.evaluate((y) => {
      for (let i = 0; i < 20; i++) {
        const x = 46 + (i % 5) * 3
        const z = 46 + ((i / 5) | 0) * 3
        window.__smoke.plant(x, y + 1, z, 47)
        window.__smoke.use(x, y + 1, z)
        window.__smoke.use(x, y + 1, z)
        window.__smoke.use(x, y + 1, z)
      }
    }, gy)
    await sleep(1800)
    let onScreen = 0
    let sample = null
    const pitches = [0.35, 0.22, 0.48, 0.15, 0.08, 0.55]
    const stands = [[48.5, 36], [52.5, 40]]
    for (const [sx, sz] of stands) {
      for (const pitch of pitches) {
        await lamp.evaluate((pitch, y, sx, sz) => window.__smoke.stand(sx, y + 1.2, sz, 0, pitch), pitch, gy, sx, sz)
        await sleep(400)
        const seen = await lamp.evaluate((y) => {
          let n = 0
          let first = null
          const w = window.innerWidth
          const h = window.innerHeight
          for (let i = 0; i < 20; i++) {
            const x = 46 + (i % 5) * 3
            const z = 46 + ((i / 5) | 0) * 3
            const p = window.__smoke.project(x, y, z)
            if (!first) first = p
            const q = window.__smoke.project(x, y + 1, z)
            const on = (p) => p && !p.behind && p.x >= 8 && p.y >= 8 && p.x <= w - 8 && p.y <= h - 8
            if (on(p) || on(q)) n++
          }
          return { n, first }
        }, gy)
        onScreen = seen.n
        sample = seen.first
        if (onScreen >= 12) break
      }
      if (onScreen >= 12) break
    }
    await sleep(4200)
    const after = await lamp.evaluate(() => window.__smoke.fpsSpan(4000))
    note('lantern fps', '1366x768', gy >= 0 && onScreen >= 12 && after >= base * 0.9, base.toFixed(1) + ' -> ' + after.toFixed(1) + ' on ' + onScreen + ' y ' + gy + ' ' + JSON.stringify(sample))
    await lamp.close()
  }
  await prove2549()
  await prove2550()
  await proveModeSwitch()
  await proveEnergy()

  async function prove2549() {
    const band = { x0: 0.72, y0: 0.45, x1: 0.92, y1: 0.62 }
    for (const [w, h, touch] of [[412, 915, true], [915, 412, true], [1366, 768, false]]) {
      const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
      errs.push(...page.__err.map((e) => 'b249 ' + w + ' ' + e))
      await page.waitForFunction(() => window.__bloxReady, { timeout: 20000 }).catch(() => {})
      await page.evaluate(() => {
        window.__smoke.always(false)
        window.__smoke.bright(false)
        window.__smoke.seek(0)
        window.__smoke.stand(8.5, 6.2, 16, 0, 0.6)
      })
      await sleep(900)
      const day = await regionMean(page, band)
      await page.evaluate(() => window.__smoke.seek(window.__smoke.nightAt()))
      await sleep(500)
      const night = await regionMean(page, band)
      const nr = day > 1 ? night / day : 0
      note('night grass', w + 'x' + h, nr >= 0.4 && nr <= 0.7, day.toFixed(1) + ' -> ' + night.toFixed(1) + ' ' + nr.toFixed(2))
      await page.evaluate(() => window.__smoke.bright(true))
      await sleep(400)
      const bright = await regionMean(page, band)
      const br = day > 1 ? bright / day : 0
      note('brighter grass', w + 'x' + h, br >= 0.6, bright.toFixed(1) + ' ' + br.toFixed(2))
      await page.evaluate(() => { window.__smoke.bright(false); window.__smoke.always(true); window.__smoke.seek(window.__smoke.nightAt()) })
      await sleep(400)
      const always = await regionMean(page, band)
      const ar = day > 1 ? always / day : 0
      note('always day grass', w + 'x' + h, ar >= 0.95 && ar <= 1.001, always.toFixed(1) + ' ' + ar.toFixed(3))
      await page.evaluate(() => {
        window.__smoke.always(false)
        window.__smoke.bright(false)
        window.__smoke.seek(window.__smoke.nightAt())
        window.__smoke.stand(30.5, 12, 32, 0, 0.35)
      })
      let gy = -1
      for (let i = 0; i < 25 && gy < 0; i++) {
        gy = await page.evaluate(() => {
          for (let y = 40; y >= 1; y--) if (window.__smoke.voxel(30, y, 40)) return y
          return -1
        })
        if (gy < 0) await sleep(200)
      }
      const lit = await page.evaluate((y) => {
        const lx = 30
        const ly = y + 1
        const lz = 40
        window.__smoke.plant(lx, ly, lz, 47)
        window.__smoke.use(lx, ly, lz)
        window.__smoke.use(lx, ly, lz)
        window.__smoke.use(lx, ly, lz)
        window.__smoke.stand(lx + 0.5, y + 2.3, lz - 6, 0, 0.42)
        return { lx, ly, lz, y, light: window.__smoke.light(lx, ly, lz) }
      }, gy)
      await sleep(500)
      let nearP = null
      let farP = null
      let nearOk = false
      let farOk = false
      for (const pitch of [0.35, 0.22, 0.48, 0.15]) {
        await page.evaluate((pitch, s) => window.__smoke.stand(s.lx + 0.5, s.y + 1.2, s.lz - 6, 0, pitch), pitch, lit)
        await sleep(280)
        nearP = await page.evaluate((s) => window.__smoke.project(s.lx + 2, s.y, s.lz), lit)
        farP = await page.evaluate((s) => window.__smoke.project(s.lx, s.y, s.lz + 12), lit)
        nearOk = !!(nearP && !nearP.behind && nearP.x > 10 && nearP.y > 10 && nearP.x < w - 10 && nearP.y < h - 10)
        farOk = !!(farP && !farP.behind && farP.x > 10 && farP.y > 10 && farP.x < w - 10 && farP.y < h - 10)
        if (nearOk && farOk) break
      }
      const nearM = nearOk ? await patchMean(page, nearP.x, nearP.y) : 0
      const farM = farOk ? await patchMean(page, farP.x, farP.y) : 0
      const high = lit.light && lit.light.level === 'high' && lit.light.radius === 10
      note('lantern patch', w + 'x' + h, !!high && nearOk && farOk && farM > 1 && nearM >= farM * 1.15, JSON.stringify({ high, nearM: Math.round(nearM), farM: Math.round(farM), nearP, farP, gy }))
      await page.evaluate(() => { window.__smoke.always(false); window.__smoke.bright(false) })
      await page.close()
    }
  }

  async function prove2550() {
    let spawn = [8.5, 6.2, 16, Math.PI, 0.7]
    async function sampleHold(page, x, y, total, touch) {
      if (touch) await page.touchscreen.touchStart(x, y)
      else {
        await page.mouse.up().catch(() => {})
        await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
        await page.mouse.move(x, y)
        await sleep(40)
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          window.__stopMove = (e) => e.stopImmediatePropagation()
          c.addEventListener('pointermove', window.__stopMove, true)
        })
        await page.mouse.down()
      }
      await sleep(1400)
      const early = await page.evaluate(() => window.__smoke.toast())
      await sleep(1600)
      const mid = await page.evaluate(() => window.__smoke.toast())
      await sleep(Math.max(0, total - 3000))
      if (touch) await page.touchscreen.touchEnd()
      else {
        await page.mouse.up()
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          if (window.__stopMove) c.removeEventListener('pointermove', window.__stopMove, true)
          if (window.__quietUnlock) window.__quietUnlock()
        }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 600 }).catch(() => {})
      }
      return { early, mid }
    }
    async function readyAim(page, id) {
      let aim = null
      for (let i = 0; i < 4 && !(aim && aim.id === id); i++) aim = await lookSolid(page, id, spawn)
      return aim
    }
    async function prepGround(page, x, z) {
      await page.evaluate((x, z) => window.__smoke.stand(x + 0.5, 48, z - 3, 0, 1.2), x, z)
      await sleep(450)
      const spot = await page.evaluate((x, z) => {
        let gy = 2
        for (let y = 48; y >= 1; y--) {
          const id = window.__smoke.voxel(x, y, z)
          if (id && id !== 11 && id !== 12) { gy = y; break }
        }
        for (let dx = -3; dx <= 3; dx++) for (let dz = -6; dz <= 3; dz++) for (let dy = 1; dy <= 16; dy++) window.__smoke.plant(x + dx, gy + dy, z + dz, 0)
        window.__smoke.plant(x, gy, z, 1)
        window.__smoke.emptyBag()
        window.__smoke.fillBag('sapling', 1)
        window.__smoke.key(0)
        window.__smoke.stand(x + 0.5, gy + 1.7, z - 3.2, 0, 0.48)
        return { x, y: gy, z }
      }, x, z)
      await sleep(300)
      return spot
    }
    for (const [w, h, touch] of [[412, 915, true], [915, 412, true], [1366, 768, false]]) {
      const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
      errs.push(...page.__err.map((e) => 'b250 ' + w + ' ' + e))
      await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 20000 }).catch(() => {})
      await page.evaluate(() => window.__smoke.stand(96.5, 40, 96.5, 0, 1.1))
      await sleep(700)
      const pad = await page.evaluate(() => {
        const x = 96
        const z = 96
        let gy = 0
        for (let y = 64; y >= 1; y--) if (window.__smoke.voxel(x, y, z)) { gy = y; break }
        if (!gy) return null
        for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 4; dz++) for (let dy = 1; dy <= 6; dy++) window.__smoke.plant(x + dx, gy + dy, z + dz, 0)
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 3; dz++) window.__smoke.plant(x + dx, gy, z + dz, 2)
        window.__smoke.plant(x, gy, z, 3)
        const s = [x + 0.5, gy + 1.7, z - 1.6, 0, 0.72]
        window.__smoke.stand(s[0], s[1], s[2], s[3], s[4])
        return s
      })
      if (pad) spawn = pad
      await sleep(300)
      await page.evaluate(() => window.__smoke.emptyBag())
      const beforeHand = await page.evaluate(() => window.__smoke.count('stone'))
      const stone = await readyAim(page, 3)
      const c = await centerOf(page)
      const hand = await sampleHold(page, c.x, c.y, 6000, touch)
      const handLeft = await page.evaluate((a, was) => ({
        id: a ? window.__smoke.voxel(a.x, a.y, a.z) : -1,
        n: window.__smoke.count('stone'),
        was,
        wood: window.__smoke.word('needsWood'),
      }), stone, beforeHand)
      note('hand stone', w + 'x' + h, !!stone && handLeft.id === 0 && handLeft.n === handLeft.was + 1 && hand.early !== handLeft.wood && hand.mid !== handLeft.wood, hand.early + ' | ' + hand.mid + ' id ' + handLeft.id)
      await page.evaluate(() => {
        window.__smoke.emptyBag()
        window.__smoke.fillBag('woodTool', 1)
        window.__smoke.key(0)
      })
      await tapSel(page, '#hotbar .bag-tile', touch)
      await sleep(350)
      const bagLine = await page.evaluate(() => {
        const text = [...document.querySelectorAll('#sheet-body .glbl')].map((el) => el.textContent)
        const wear = document.querySelector('#hotbar .slot .wear')
        return { text, wear: wear ? 'bar' : '', want: window.__smoke.word('woodToolLine') }
      })
      note('wood tool line', w + 'x' + h, bagLine.text.includes(bagLine.want) && bagLine.wear === '', JSON.stringify(bagLine).slice(0, 180))
      await shut(page, touch)
      await page.evaluate(() => window.__smoke.close())
      await waitGround(page)
      if (!touch) {
        const cHold = await centerOf(page)
        await parkMouse(page, cHold.x, cHold.y)
      }
      let broke = null
      for (let i = 0; i < 4 && !broke; i++) {
        const aim = await readyAim(page, 3)
        const steady = await waitSteady(page)
        if (aim && steady && steady.id === 3 && steady.x === aim.x && steady.y === aim.y && steady.z === aim.z) broke = aim
      }
      const beforeStone = await page.evaluate(() => window.__smoke.count('stone'))
      if (touch) await stillHold(page, 2500, true)
      else {
        await page.mouse.up().catch(() => {})
        await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
        const cNow = await centerOf(page)
        await page.mouse.move(cNow.x, cNow.y)
        await sleep(40)
        broke = await page.evaluate((a) => {
          const t = window.__smoke.aim()
          if (!t || window.__smoke.kept(t.x, t.y, t.z)) return a
          window.__smoke.plant(t.x, t.y, t.z, 3)
          const b = window.__smoke.aim()
          return b && b.id === 3 ? b : a
        }, broke)
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          window.__stopMove = (e) => e.stopImmediatePropagation()
          c.addEventListener('pointermove', window.__stopMove, true)
        })
        await page.mouse.down()
        await sleep(2500)
        await page.mouse.up()
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          if (window.__stopMove) c.removeEventListener('pointermove', window.__stopMove, true)
          if (window.__quietUnlock) window.__quietUnlock()
        }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
      }
      await sleep(200)
      const stoneGone = await page.evaluate((a, n) => ({
        id: a ? window.__smoke.voxel(a.x, a.y, a.z) : -1,
        n: window.__smoke.count('stone'),
        was: n,
      }), broke, beforeStone)
      note('wood breaks stone', w + 'x' + h, !!broke && stoneGone.id === 0 && stoneGone.n === stoneGone.was + 1, JSON.stringify(stoneGone))
      await waitGround(page)
      if (!touch) {
        const cOre = await centerOf(page)
        await parkMouse(page, cOre.x, cOre.y)
      }
      let ore = null
      for (let i = 0; i < 4 && !ore; i++) {
        const aim = await readyAim(page, 44)
        const steady = await waitSteady(page)
        if (aim && steady && steady.id === 44 && steady.x === aim.x && steady.y === aim.y && steady.z === aim.z) ore = aim
      }
      const beforeOre = await page.evaluate(() => window.__smoke.count('ironOre'))
      let oreEarly = ''
      let oreMid = ''
      if (touch) {
        const c3 = await centerOf(page)
        await page.touchscreen.touchStart(c3.x, c3.y)
        await sleep(1400)
        oreEarly = await page.evaluate(() => window.__smoke.toast())
        await sleep(1600)
        oreMid = await page.evaluate(() => window.__smoke.toast())
        await sleep(3000)
        await page.touchscreen.touchEnd()
      } else {
        await page.mouse.up().catch(() => {})
        await page.evaluate(() => { if (window.__quietUnlock) window.__quietUnlock() }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
        const cNow = await centerOf(page)
        await page.mouse.move(cNow.x, cNow.y)
        await sleep(40)
        ore = await page.evaluate((a) => {
          const t = window.__smoke.aim()
          if (!t || window.__smoke.kept(t.x, t.y, t.z)) return a
          window.__smoke.plant(t.x, t.y, t.z, 44)
          const b = window.__smoke.aim()
          return b && b.id === 44 ? b : a
        }, ore)
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          window.__stopMove = (e) => e.stopImmediatePropagation()
          c.addEventListener('pointermove', window.__stopMove, true)
        })
        await page.mouse.down()
        const t0 = Date.now()
        while (Date.now() - t0 < 4000) {
          await sleep(250)
          const st = await page.evaluate((a) => ({
            id: a ? window.__smoke.voxel(a.x, a.y, a.z) : -1,
            toast: window.__smoke.toast(),
          }), ore)
          if (!oreEarly && Date.now() - t0 >= 700) oreEarly = st.toast
          if (Date.now() - t0 >= 1400) oreMid = st.toast
          if (st.id === 0) break
        }
        await page.mouse.up()
        await page.evaluate(() => {
          const c = document.querySelector('#stage canvas')
          if (window.__stopMove) c.removeEventListener('pointermove', window.__stopMove, true)
          if (window.__quietUnlock) window.__quietUnlock()
        }).catch(() => {})
        await page.waitForFunction(() => !document.pointerLockElement, { timeout: 800 }).catch(() => {})
      }
      const oreHold = { early: oreEarly, mid: oreMid }
      const oreLeft = await page.evaluate((a, was) => ({
        id: a ? window.__smoke.voxel(a.x, a.y, a.z) : -1,
        n: window.__smoke.count('ironOre'),
        was,
        need: window.__smoke.word('needsStone'),
      }), ore, beforeOre)
      note('wood ore', w + 'x' + h, !!ore && oreLeft.id === 0 && oreLeft.n === oreLeft.was + 1 && oreHold.early !== oreLeft.need && oreHold.mid !== oreLeft.need, oreHold.early + ' | ' + oreHold.mid + ' ' + JSON.stringify(oreLeft))
      await page.evaluate(() => {
        window.__smoke.emptyBag()
        window.__smoke.fillBag('woodTool', 1)
        window.__smoke.key(0)
      })
      const leaf = await readyAim(page, 12)
      const c4 = await centerOf(page)
      let chops = 0
      while (chops < 8) {
        await page.evaluate((a) => {
          if (!a) return
          window.__smoke.plant(a.x, a.y, a.z, 12)
          const p = window.__smoke.pos()
          const dx = a.x + 0.5 - p[0]
          const dy = a.y + 0.5 - (p[1] + 1.62)
          const dz = a.z + 0.5 - p[2]
          const len = Math.hypot(dx, dy, dz) || 1
          for (const step of [0.9, 1.6]) {
            const bx = Math.floor(a.x + 0.5 + (dx / len) * step)
            const by = Math.floor(a.y + 0.5 + (dy / len) * step)
            const bz = Math.floor(a.z + 0.5 + (dz / len) * step)
            if (bx !== a.x || by !== a.y || bz !== a.z) window.__smoke.plant(bx, by, bz, 3)
          }
        }, leaf)
        await sleep(30)
        await holdAt(page, c4.x, c4.y, 360, touch)
        chops++
      }
      await sleep(150)
      const worn = await page.evaluate(() => ({
        stick: window.__smoke.count('stick'),
        tool: window.__smoke.count('woodTool'),
        bar: !!document.querySelector('#hotbar .wear'),
        toast: window.__smoke.toast(),
      }))
      note('tool stays', w + 'x' + h, worn.tool === 1 && worn.stick === 0 && !worn.bar && chops === 8, JSON.stringify({ ...worn, chops }))
      const spot = await prepGround(page, w === 412 ? 140 : w === 915 ? 180 : 220, 150)
      await sleep(500)
      for (let i = 0; i < 6; i++) {
        const aimed = await page.evaluate(() => window.__smoke.aim())
        if (aimed && aimed.x === spot.x && aimed.z === spot.z && aimed.y === spot.y) break
        await page.evaluate((s, i) => window.__smoke.stand(s.x + 0.5, s.y + 1.6, s.z - 3.6, 0, 0.28 + i * 0.06), spot, i)
        await sleep(250)
      }
      const c5 = await centerOf(page)
      if (touch) await pressAt(page, c5.x, c5.y, 90, true)
      else await pressAt(page, c5.x, c5.y, 90, false, 'right')
      await sleep(250)
      const planted = await page.evaluate((s) => ({
        id: window.__smoke.voxel(s.x, s.y + 1, s.z),
        n: window.__smoke.count('sapling'),
        aim: window.__smoke.aim(),
      }), spot)
      note('plant sapling', w + 'x' + h, planted.id === 185 && planted.n === 0, JSON.stringify(planted))
      await page.evaluate((s) => window.__smoke.plant(s.x + 2, s.y + 2, s.z, 3), spot)
      await page.evaluate(() => window.__smoke.clock(8 * 60 * 1000))
      const blocked = await page.evaluate((s) => window.__smoke.voxel(s.x, s.y + 1, s.z), spot)
      note('sapling waits', w + 'x' + h, blocked === 185, String(blocked))
      await page.evaluate((s) => {
        window.__smoke.plant(s.x + 2, s.y + 2, s.z, 0)
        window.__smoke.clock(1)
      }, spot)
      const grew = await page.evaluate((s) => ({
        trunk: window.__smoke.voxel(s.x, s.y + 1, s.z),
        top: window.__smoke.voxel(s.x, s.y + 4, s.z),
        cap: window.__smoke.voxel(s.x, s.y + 5, s.z),
        leaf: window.__smoke.voxel(s.x + 2, s.y + 3, s.z),
      }), spot)
      note('sapling grows', w + 'x' + h, grew.trunk === 11 && grew.top === 11 && grew.cap === 12 && grew.leaf === 12, JSON.stringify(grew))
      const again = await prepGround(page, w === 412 ? 140 : w === 915 ? 180 : 220, 158)
      await sleep(500)
      for (let i = 0; i < 8; i++) {
        const aimed = await page.evaluate(() => window.__smoke.aim())
        if (aimed && aimed.x === again.x && aimed.z === again.z && aimed.y === again.y) break
        await page.evaluate((s, i) => window.__smoke.stand(s.x + 0.5, s.y + 1.6, s.z - 3.6, 0, 0.28 + i * 0.05), again, i)
        await sleep(250)
      }
      const c6 = await centerOf(page)
      if (touch) await pressAt(page, c6.x, c6.y, 90, true)
      else await pressAt(page, c6.x, c6.y, 90, false, 'right')
      await sleep(200)
      await page.evaluate(() => window.__smoke.clock(4 * 60 * 1000))
      const mid = await page.evaluate((s) => window.__smoke.voxel(s.x, s.y + 1, s.z), again)
      await page.evaluate(() => window.__smoke.persist())
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__smoke.voxel, { timeout: 25000 }).catch(() => {})
      await sleep(400)
      const kept = await page.evaluate((s) => window.__smoke.voxel(s.x, s.y + 1, s.z), again)
      await page.evaluate(() => window.__smoke.clock(4 * 60 * 1000))
      const after = await page.evaluate((s) => window.__smoke.voxel(s.x, s.y + 1, s.z), again)
      note('sapling timer', w + 'x' + h, mid === 185 && kept === 185 && after === 11, mid + ' -> ' + kept + ' -> ' + after)
      const gift = await page.evaluate(async () => {
        const doc = await window.__blocks.exportDoc()
        doc.gifts = {}
        doc.lost = []
        await window.__smoke.apply(doc)
        const once = window.__smoke.lost().slice()
        const doc2 = await window.__blocks.exportDoc()
        await window.__smoke.apply(doc2)
        return { once, twice: window.__smoke.lost().slice(), flag: !!window.__smoke.gifts().sapling2 }
      })
      note('sapling gift', w + 'x' + h, gift.flag && gift.once.join(',') === 'sapling:2' && gift.twice.join(',') === 'sapling:2', JSON.stringify(gift))
      await page.close()
    }
  }

  async function proveModeSwitch() {
    function overlaps(a, b) {
      return a && b && a.w > 1 && b.w > 1 && a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5
    }
    async function pillBox(page) {
      return page.evaluate(() => {
        function box(el) {
          if (!el || el.hidden) return null
          const s = getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden') return null
          const r = el.getBoundingClientRect()
          return { x: r.x, y: r.y, w: r.width, h: r.height }
        }
        const pill = document.getElementById('mode-pill')
        const halves = [...pill.querySelectorAll('button')].map((b) => {
          const r = b.getBoundingClientRect()
          return { id: b.id, w: r.width, h: r.height, x: r.x, pressed: b.getAttribute('aria-pressed'), text: b.textContent }
        })
        const controls = ['#hotbar', '#stick-pad', '#jump-col .jump', '#t-break', '#pick-chip', '#hotbar .bag-tile', '.kb-bar'].map((sel) => box(document.querySelector(sel))).filter(Boolean)
        const pr = pill.getBoundingClientRect()
        return {
          pill: { x: pr.x, y: pr.y, w: pr.width, h: pr.height },
          halves,
          controls,
          dir: document.documentElement.dir || 'ltr',
          n: document.querySelectorAll('#hotbar .slot:not([data-bag])').length,
          expect: +(document.getElementById('hotbar').dataset.n || 0),
          mode: document.getElementById('mode-chip').textContent,
          menuCreative: document.getElementById('m-creative').hidden,
        }
      })
    }
    const langs = {
      en: 'Bertopia 2.5.54: an Energy bar, and eating fills it back up.',
      uk: 'Bertopia 2.5.54: смужка енергії, і їжа знову її наповнює.',
      ru: 'Полоска энергии, и еда снова её наполняет.',
      es: 'Bertopia 2.5.54: una barra de Energía, y comer la vuelve a llenar.',
      ar: 'شريط طاقة، والأكل يملؤه من جديد.',
      'fa-AF': 'یک نوار انرژی، و خوردن آن را دوباره پر می‌کند.',
      rw: 'Bertopia 2.5.54: umurongo w\'ingufu, kandi kurya kubisubiza.',
      ti: '2.5.54፡ መስመር ጉልበት፡ ምብላዕ ድማ ደጊሙ ይመልኦ።',
    }
    for (const [lang, line] of Object.entries(langs)) {
      const page = await bootHud(browser, testUrl + '?smoke=1&lang=' + encodeURIComponent(lang), 412, 915, true)
      errs.push(...page.__err.map((e) => 'lang ' + lang + ' ' + e))
      const seen = await page.evaluate(() => ({
        body: window.__smoke.word('whatsNewBody'),
        surv: document.getElementById('mode-survival').textContent,
        crea: document.getElementById('mode-creative').textContent,
        dir: document.documentElement.dir,
      }))
      const words = {
        en: ['Survival', 'Creative'], uk: ['Виживання', 'Creative'], ru: ['Выживание', 'Creative'], es: ['Supervivencia', 'Creative'],
        ar: ['بقاء', 'إبداعي'], 'fa-AF': ['بقا', 'خلاق'], rw: ['Ubugingo', 'Creative'], ti: ['ህይወት', 'Creative'],
      }[lang]
      const rtl = lang === 'ar' || lang === 'fa-AF'
      const box = await pillBox(page)
      const orderOk = box.halves[0].x < box.halves[1].x
      note('mode words ' + lang, '412x915', seen.body === line && seen.surv === words[0] && seen.crea === words[1] && seen.dir === (rtl ? 'rtl' : 'ltr') && orderOk, seen.surv + ' | ' + seen.crea + ' ' + seen.dir)
      await page.close()
    }
    for (const [w, h, touch] of [[412, 915, true], [915, 412, true], [1366, 768, false]]) {
      const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
      errs.push(...page.__err.map((e) => 'mode ' + w + ' ' + e))
      await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 20000 }).catch(() => {})
      await page.evaluate(() => {
        window.__smoke.emptyBag()
        if (window.__smoke.wipeCreative) window.__smoke.wipeCreative()
        window.__smoke.fillBag('log', 3)
        window.__smoke.key(2)
      })
      const before = await page.evaluate(async () => {
        const doc = await window.__blocks.exportDoc()
        const cam = window.__blocks.noa.camera
        const p = window.__smoke.pos()
        return { id: doc.id, pos: p, heading: cam.heading, pitch: cam.pitch, bag: doc.player.bag, hot: doc.player.hot, mode: doc.player.mode }
      })
      const stone = await lookSolid(page, 3, [8.5, 6.2, 16, Math.PI, 0.7])
      const stoneId = stone ? await page.evaluate((a) => window.__smoke.voxel(a.x, a.y, a.z), stone) : 0
      await waitGround(page)
      const spot = await page.evaluate(() => {
        const p = window.__smoke.pos()
        const cam = window.__blocks.noa.camera
        return { pos: p, heading: cam.heading, pitch: cam.pitch }
      })
      const worldBefore = before.id
      await tapSel(page, '#mode-creative', touch)
      await waitGround(page)
      const live = await page.evaluate(async (mark) => {
        const bags = window.__smoke.bags()
        const doc = await window.__blocks.exportDoc()
        const cam = window.__blocks.noa.camera
        const p = window.__smoke.pos()
        const craft = window.__smoke.craft('lantern')
        return {
          id: doc.id,
          pos: p,
          heading: cam.heading,
          pitch: cam.pitch,
          sameBag: JSON.stringify(doc.player.bag) === JSON.stringify(mark.bag),
          creativeEmpty: !(bags.creative || []).some(Boolean),
          crea: (bags.creative || []).filter(Boolean).map((s) => s.item + ':' + s.n).join(','),
          mode: doc.player.mode,
          reach: window.__smoke.reach(),
          gate: craft.gate || craft.why || '',
          n: document.querySelectorAll('#hotbar .slot:not([data-bag])').length,
          expect: +(document.getElementById('hotbar').dataset.n || 0),
          pressed: document.getElementById('mode-creative').getAttribute('aria-pressed'),
          block: mark.stone ? window.__smoke.voxel(mark.stone.x, mark.stone.y, mark.stone.z) : -1,
        }
      }, { bag: before.bag, stone })
      const moved = Math.hypot(live.pos[0] - spot.pos[0], live.pos[1] - spot.pos[1], live.pos[2] - spot.pos[2])
      const lookOk = Math.abs(live.heading - spot.heading) < 0.02 && Math.abs(live.pitch - spot.pitch) < 0.02
      note('live creative', w + 'x' + h, live.id === worldBefore && moved < 0.1 && lookOk && live.sameBag && live.creativeEmpty && live.mode === 'creative' && live.reach === 10 && live.gate !== 'T5' && live.n === live.expect && live.expect > 20 && live.pressed === 'true' && live.block === stoneId, JSON.stringify({ moved: +moved.toFixed(3), lookOk, empty: live.creativeEmpty, crea: live.crea, mode: live.mode }))
      const lay = await pillBox(page)
      let bad = ''
      if (lay.pill.h < 48) bad += 'short '
      if (lay.halves.some((b) => b.w < 44 || b.h < 48)) bad += 'half '
      if (lay.pill.x < -1 || lay.pill.y < -1 || lay.pill.x + lay.pill.w > w + 1 || lay.pill.y + lay.pill.h > h + 1) bad += 'off '
      for (const c of lay.controls) if (overlaps(lay.pill, c)) bad += 'cover '
      if (lay.halves.find((b) => b.id === 'mode-creative').pressed !== 'true') bad += 'lit '
      note('pill clear', w + 'x' + h, !bad, bad || 'clear')
      const aimed = await page.evaluate(() => {
        const canvas = document.querySelector('#stage canvas')
        const r = canvas.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        let h = window.__smoke.hit(x, y)
        if (!h || window.__smoke.kept(h.x, h.y, h.z)) return null
        window.__smoke.plant(h.x, h.y, h.z, 3)
        h = window.__smoke.hit(x, y)
        return h && h.id === 3 ? h : null
      })
      const stoneNow = aimed || stone
      const c = await centerOf(page)
      await holdAt(page, c.x, c.y, 800, touch)
      await sleep(250)
      const broke = await page.evaluate((a) => a ? window.__smoke.voxel(a.x, a.y, a.z) : -1, stoneNow)
      const bagsAfterBreak = await page.evaluate(() => {
        const bags = window.__smoke.bags()
        const surv = (bags.survival || []).filter(Boolean).map((s) => s.item + ':' + s.n)
        const crea = (bags.creative || []).filter(Boolean).map((s) => s.item + ':' + s.n)
        return { surv, crea }
      })
      const gotStone = bagsAfterBreak.crea.some((s) => s.indexOf('stone:') === 0)
      note('creative stone', w + 'x' + h, !!stoneNow && broke === 0 && bagsAfterBreak.surv.join(',') === 'log:3' && gotStone, broke + ' ' + JSON.stringify(bagsAfterBreak))
      await tapSel(page, '#mode-survival', touch)
      await sleep(300)
      const back = await page.evaluate(async () => {
        const doc = await window.__blocks.exportDoc()
        const craft = window.__smoke.craft('lantern')
        return {
          mode: doc.player.mode,
          bag: JSON.stringify(doc.player.bag),
          hot: doc.player.hot,
          reach: window.__smoke.reach(),
          gate: craft.gate || '',
          pressed: document.getElementById('mode-survival').getAttribute('aria-pressed'),
          slot: document.querySelector('#hotbar [data-slot="2"]') && document.querySelector('#hotbar [data-slot="2"]').getAttribute('aria-pressed'),
        }
      })
      note('survival bag back', w + 'x' + h, back.mode === 'survival' && back.bag === JSON.stringify(before.bag) && back.hot === 2 && back.reach === 6 && back.gate === 'T5' && back.pressed === 'true' && back.slot === 'true', JSON.stringify(back))
      await page.evaluate((a) => { if (a) window.__smoke.plant(a.x, a.y, a.z, 3) }, stoneNow)
      await sleep(200)
      const handStone = await page.evaluate(() => {
        const canvas = document.querySelector('#stage canvas')
        const r = canvas.getBoundingClientRect()
        const x = r.left + r.width / 2
        const y = r.top + r.height / 2
        let h = window.__smoke.hit(x, y)
        if (!h || window.__smoke.kept(h.x, h.y, h.z)) return null
        if (h.id !== 3) window.__smoke.plant(h.x, h.y, h.z, 3)
        h = window.__smoke.hit(x, y)
        return h && h.id === 3 ? h : null
      }) || stoneNow
      const c2 = await centerOf(page)
      await holdAt(page, c2.x, c2.y, 900, touch)
      await sleep(200)
      const handLeft = await page.evaluate((a) => {
        if (!a) return { id: -1, aim: null }
        const aim = window.__smoke.aim()
        return { id: window.__smoke.voxel(a.x, a.y, a.z), aim }
      }, handStone)
      note('hand cannot break stone', w + 'x' + h, !!handStone && handLeft.id === 3, JSON.stringify(handLeft))
      if (w === 915) {
        const posNow = await page.evaluate(() => window.__smoke.pos())
        await page.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true })
        await sleep(300)
        await page.setViewport({ width: 915, height: 412, hasTouch: true, isMobile: true })
        await sleep(300)
        const spun = await page.evaluate(() => window.__smoke.pos())
        const spinLay = await pillBox(page)
        let spinBad = ''
        if (spinLay.pill.h < 48) spinBad += 'short '
        for (const c of spinLay.controls) if (overlaps(spinLay.pill, c)) spinBad += 'cover '
        const drift = Math.hypot(spun[0] - posNow[0], spun[1] - posNow[1], spun[2] - posNow[2])
        note('rotate pill', '915x412', !spinBad && drift < 0.1 && spinLay.mode.includes('Survival'), spinBad || 'drift ' + drift.toFixed(3))
        await page.setViewport({ width: w, height: h, hasTouch: !!touch, isMobile: !!touch })
      }
      await page.evaluate(() => window.__smoke.persist())
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 25000 }).catch(() => {})
      await sleep(500)
      const kept = await page.evaluate(async () => {
        const doc = await window.__blocks.exportDoc()
        return {
          mode: doc.player.mode,
          surv: (doc.player.bag || []).filter(Boolean).map((s) => s.item + ':' + s.n).join(','),
          crea: (doc.player.bagCreative || []).filter(Boolean).map((s) => s.item + ':' + s.n).join(','),
          hot: doc.player.hot,
          id: doc.id,
        }
      })
      note('reload bags', w + 'x' + h, kept.mode === 'survival' && kept.surv === 'log:3' && /(^|,)stone:/.test(kept.crea) && kept.hot === 2 && kept.id === worldBefore, JSON.stringify(kept))
      const old = await page.evaluate(async () => {
        const doc = await window.__blocks.exportDoc()
        const keep = doc.player.bag
        delete doc.player.bagCreative
        delete doc.player.hotCreative
        doc.player.mode = 'survival'
        await window.__smoke.apply(doc)
        const next = await window.__blocks.exportDoc()
        const crea = (next.player.bagCreative || []).some(Boolean)
        return { same: JSON.stringify(next.player.bag) === JSON.stringify(keep), crea }
      })
      note('old save is survival bag', w + 'x' + h, old.same && !old.crea, JSON.stringify(old))
      if (page.__err.length) errs.push(...page.__err.map((e) => 'mode-late ' + w + ' ' + e))
      note('mode console', w + 'x' + h, page.__err.length === 0, page.__err.slice(0, 2).join(' | ') || '0')
      await page.close()
    }
  }

  async function proveEnergy() {
    function overlaps(a, b) {
      return a && b && a.w > 1 && b.w > 1 && a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5
    }
    async function hud(page) {
      return page.evaluate(() => {
        function box(el) {
          if (!el || el.hidden) return null
          const s = getComputedStyle(el)
          if (s.display === 'none' || s.visibility === 'hidden') return null
          const r = el.getBoundingClientRect()
          if (r.width < 2 || r.height < 2) return null
          return { x: r.x, y: r.y, w: r.width, h: r.height }
        }
        const bar = document.getElementById('energy-bar')
        const e = window.__smoke.energy ? window.__smoke.energy() : null
        return {
          e,
          bar: box(bar),
          plate: (document.getElementById('ver-plate') || {}).textContent || '',
          toast: window.__smoke.toast(),
          controls: ['#mode-pill', '#menu-btn', '.kb-bar .kb-menu', '#hotbar', '#hotbar .bag-tile', '#stick-pad', '#jump-col .jump', '#game-menu'].map((sel) => box(document.querySelector(sel))).filter(Boolean),
        }
      })
    }
    function fit(box, w, h, controls) {
      if (!box) return 'missing '
      let bad = ''
      if (box.x < -1 || box.y < -1 || box.x + box.w > w + 1 || box.y + box.h > h + 1) bad += 'off '
      for (const c of controls) if (overlaps(box, c)) bad += 'cover '
      return bad
    }
    for (const [w, h, touch] of [[412, 915, true], [915, 412, true], [1366, 768, false]]) {
      const page = await bootHud(browser, testUrl + '?smoke=1', w, h, touch)
      errs.push(...page.__err.map((e) => 'energy ' + w + ' ' + e))
      await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__smoke.energy, { timeout: 20000 }).catch(() => {})
      await page.evaluate(() => { window.__blocks.noa.setPaused(false); if (window.__smoke.close) window.__smoke.close(); window.__smoke.charge(10) })
      const start = await hud(page)
      note('energy full', w + 'x' + h, !!(start.e && start.e.bolts === 10 && start.e.shown && start.e.on && start.plate === '2.5.54'), JSON.stringify(start.e) + ' ' + start.plate)
      const lay0 = fit(start.bar, w, h, start.controls)
      note('energy fits', w + 'x' + h, !lay0, lay0 || 'ok')
      if (w === 1366) {
        await tapSel(page, '#mode-creative', false)
        await sleep(200)
        const crea = await page.evaluate(() => window.__smoke.energy())
        await page.evaluate(() => window.__smoke.clock(4 * 60 * 1000))
        const crea2 = await page.evaluate(() => window.__smoke.energy())
        note('creative no bar', w + 'x' + h, crea.bolts === 10 && !crea.shown && crea.pace === 1 && crea2.bolts === 10 && crea2.dig === 1, JSON.stringify(crea2))
        await tapSel(page, '#mode-survival', false)
        await sleep(200)
      }
      await page.evaluate(() => window.__smoke.clock(40 * 60 * 1000))
      const low = await hud(page)
      await page.evaluate(() => window.__smoke.clock(4 * 60 * 1000))
      const low2 = await page.evaluate(() => window.__smoke.energy())
      await sleep(180)
      const slow = await page.evaluate(() => {
        const noa = window.__blocks.noa
        const ms = noa.ents.getMovement(noa.playerEntity)
        return ms.maxSpeed
      })
      note('energy empty', w + 'x' + h, low.e && low.e.bolts === 0 && low.e.lowN === 1 && low.toast === 'Low energy - eat something' && low2.bolts === 0 && low2.lowN === 1 && low2.pace === 0.7 && low2.dig === 1.5 && Math.abs(slow - 4.3 * 0.7) < 0.08, JSON.stringify({ toast: low.toast, e: low2, slow }))
      await page.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.fillBag('bread', 1); window.__smoke.key(0) })
      await sleep(80)
      const beforeEat = await page.evaluate(() => window.__smoke.count('bread'))
      await tapSel(page, '#hotbar .slot[data-slot="0"]', touch)
      await sleep(120)
      const ate = await page.evaluate(() => ({ bolts: window.__smoke.energy().bolts, bread: window.__smoke.count('bread') }))
      note('eat bread', w + 'x' + h, beforeEat === 1 && ate.bread === 0 && ate.bolts === 4, JSON.stringify(ate))
      if (w === 412) {
        await page.setViewport({ width: 915, height: 412, hasTouch: true, isMobile: true })
        await sleep(300)
        const land = await hud(page)
        const landBad = fit(land.bar, 915, 412, land.controls)
        await page.setViewport({ width: 412, height: 915, hasTouch: true, isMobile: true })
        await sleep(300)
        const back = await hud(page)
        const backBad = fit(back.bar, 412, 915, back.controls)
        note('energy rotate', '915x412', !landBad && !backBad && land.e.bolts === 4 && back.e.bolts === 4 && land.e.shown && back.e.shown, (landBad || backBad || 'bolts ' + back.e.bolts))
      }
      await page.evaluate(() => window.__smoke.persist())
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 })
      await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__smoke.energy, { timeout: 25000 }).catch(() => {})
      await sleep(300)
      const kept = await page.evaluate(() => window.__smoke.energy())
      note('energy reload', w + 'x' + h, kept.bolts === 4 && kept.shown, JSON.stringify(kept))
      await page.evaluate(() => { window.__smoke.fillBag('bread', 2); window.__smoke.key(0) })
      await sleep(80)
      await tapSel(page, '#hotbar .slot[data-slot="0"]', touch)
      await sleep(100)
      await tapSel(page, '#hotbar .slot[data-slot="0"]', touch)
      await sleep(100)
      const filled = await page.evaluate(() => window.__smoke.energy().bolts)
      await page.evaluate(() => { window.__smoke.fillBag('berry', 1); window.__smoke.key(0) })
      await sleep(80)
      const berryBefore = await page.evaluate(() => window.__smoke.count('berry'))
      await tapSel(page, '#hotbar .slot[data-slot="0"]', touch)
      await sleep(120)
      const full = await page.evaluate(() => ({ bolts: window.__smoke.energy().bolts, berry: window.__smoke.count('berry'), toast: window.__smoke.toast() }))
      note('energy full food', w + 'x' + h, filled === 10 && berryBefore === 1 && full.berry === 1 && full.bolts === 10 && full.toast === "You're full", JSON.stringify({ filled, full }))
      if (page.__err.length) errs.push(...page.__err.map((e) => 'energy-late ' + w + ' ' + e))
      note('energy console', w + 'x' + h, page.__err.length === 0, page.__err.slice(0, 2).join(' | ') || '0')
      await page.close()
    }
    const staff = await bootHud(browser, testUrl + '?smoke=1', 412, 915, true, () => {
      localStorage.clear()
      sessionStorage.clear()
      localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true }))
      localStorage.setItem('tech-room-hub-staff', '1')
    })
    errs.push(...staff.__err.map((e) => 'energy staff ' + e))
    await staff.waitForFunction(() => window.__bloxReady && window.__smoke && window.__smoke.energy, { timeout: 20000 }).catch(() => {})
    await staff.evaluate(() => window.__smoke.charge(10))
    await tapSel(staff, '.kb-bar .kb-menu', true)
    await sleep(250)
    await tapLabel(staff, 'Teacher', true)
    await sleep(200)
    const had = await staff.evaluate(() => window.__smoke.energy().bolts)
    await tapLabel(staff, 'Energy on', true)
    await sleep(200)
    await staff.evaluate(() => window.__smoke.clock(40 * 60 * 1000))
    const off = await staff.evaluate(() => window.__smoke.energy())
    await tapLabel(staff, 'Energy off', true)
    await sleep(200)
    await staff.evaluate(() => window.__smoke.clock(40 * 60 * 1000))
    const onAgain = await staff.evaluate(() => ({ e: window.__smoke.energy(), store: localStorage.getItem('bloxbert-energy') }))
    note('energy switch', '412x915', off.bolts === had && !off.shown && !off.on && onAgain.e.on && onAgain.e.bolts === 0 && onAgain.e.lowN === 1 && onAgain.store === '1', JSON.stringify({ had, off, onAgain }))
    await staff.close()
  }
}

