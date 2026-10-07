import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
const chrome = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome'].find((p) => existsSync(p))
const url = process.argv[2] || 'http://127.0.0.1:8875/blocks/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function tapAt(page, x, y, touch) {
  if (touch) await page.touchscreen.tap(x, y)
  else {
    await page.mouse.move(x, y)
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
  await page.mouse.move(x, y)
  await page.mouse.down({ button: button || 'left' })
  await sleep(ms)
  await page.mouse.up({ button: button || 'left' })
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
    await page.mouse.move(x, y)
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
    const c = await centerOf(page)
    for (let attempt = 0; attempt < 2 && broke !== 0; attempt++) {
      if (attempt) mined = await lookSolid(page, 2, spawn)
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
      await page.mouse.move(c.x, c.y)
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
    for (let attempt = 0; attempt < 2 && !(drop.id === 0 && drop.drops.length > 0); attempt++) {
      full = await lookSolid(page, 2, spawn)
      const cFull = await centerOf(page)
      await holdAt(page, cFull.x, cFull.y, 1100, false)
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
      await page.mouse.move(cSweep.x, cSweep.y)
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
    const log = await lookSolid(page, 11, spawn)
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
  await tip.touchscreen.touchEnd()
  note('crack ring early', '915x412', !!ringAt && ring.on, JSON.stringify(ring))
  await tip.evaluate(() => window.__smoke.emptyBag())
  const toastLog = await lookSolid(tip, 11, [8.5, 6.2, 16, Math.PI, 0.7])
  const toastC = await centerOf(tip)
  await tip.touchscreen.tap(toastC.x, toastC.y)
  let toast1 = { toast: '', want: '' }
  const toastWait = Date.now()
  while (Date.now() - toastWait < 600) {
    toast1 = await tip.evaluate(() => ({ toast: window.__smoke.toast(), want: window.__smoke.word('holdToBreak') }))
    if (toast1.toast === toast1.want) break
    await sleep(40)
  }
  await sleep(2600)
  await tip.touchscreen.tap(toastC.x, toastC.y)
  await sleep(150)
  const toast2 = await tip.evaluate(() => window.__smoke.toast())
  note('hold toast once', '915x412', !!toastLog && toast1.toast === toast1.want && toast2 === '', toast1.toast + ' / ' + toast2)
  await tip.close()
  const broke = await chopPage(915, 412)
  const live = await broke.page.evaluate(() => window.__smoke.aim())
  await jitterHold(broke.page, broke.c.x, broke.c.y, 2300)
  await sleep(250)
  const chopped = await broke.page.evaluate((b) => ({
    id: b ? window.__smoke.voxel(b.x, b.y, b.z) : -1,
    n: window.__smoke.count('log'),
    aim: b,
  }), live)
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
          if (!best || cd < best.cd) best = { x, y, cd, h, aim }
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
    dirt = await lookSolid(mouse, 2, mouseSpawn)
    if (!dirt) continue
    const still = await mouse.evaluate((b) => {
      const a = window.__smoke.aim()
      return !!(a && a.id === 2 && a.x === b.x && a.y === b.y && a.z === b.z)
    }, dirt)
    if (!still) { dirt = null; continue }
    const mc = await centerOf(mouse)
    await holdAt(mouse, mc.x, mc.y, 1100, false)
    await sleep(200)
    mouseGone = await mouse.evaluate((b) => window.__smoke.voxel(b.x, b.y, b.z), dirt)
  }
  const mouseHud = await hudNow(mouse)
  note('mouse crosshair', '1366x768', !!dirt && mouseGone === 0 && mouseHud.tag === 'D' && mouseHud.n === '1' && mouseHud.cur === mouseHud.dirt, mouseGone + ' ' + JSON.stringify(mouseHud))
  await mouse.close()
}

