import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
const chrome = ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome'].find((p) => existsSync(p))
const url = process.argv[2] || 'http://127.0.0.1:8875/blocks/'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function tapAt(page, x, y, touch) {
  if (touch) await page.touchscreen.tap(x, y)
  else await page.mouse.click(x, y)
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
await page.evaluate(() => document.getElementById('game-menu').click())
await new Promise((r) => setTimeout(r, 300))
const open = await page.$eval('#sheet', (el) => !el.hidden && el.dataset.panel === 'menu')
await new Promise((r) => setTimeout(r, 800))
const pics = await page.evaluate(() => {
  document.getElementById('game-menu').click()
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
    window.__smoke.fillSeed(6)
    document.querySelector('#hotbar [data-slot="0"]').click()
    document.querySelector('#tool-strip').hidden = false
    document.querySelector('#tool-strip [data-tool="fill"]').click()
    document.querySelector('#tool-strip [data-tool="do"]').click()
    const short = window.__smoke.counts().log === 6
    window.__smoke.fillSeed(12)
    document.querySelector('#tool-strip [data-tool="fill"]').click()
    document.querySelector('#tool-strip [data-tool="do"]').click()
    const full = window.__smoke.counts().log === 0
    window.__smoke.ovenOpen()
    return { bar, pics, hot, before, after, short, full }
  })
  await new Promise((r) => setTimeout(r, 3000))
  const oven = await page.evaluate(() => {
    const strip = document.getElementById('sheet-body').innerText
    const glass = [...document.querySelectorAll('#sheet-body .gtile')].find((b) => /Glass|glass/.test(b.textContent))
    if (glass) glass.click()
    return { strip, sand: window.__smoke.counts().sand }
  })
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
  await page.evaluate(() => document.getElementById('game-menu').click())
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
    await page.evaluate(() => document.getElementById('game-menu').click())
    await new Promise((r) => setTimeout(r, 250))
    const seen = await page.evaluate(() => document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent)
    note(lang + ' menu', 412, seen === title, seen)
  }
  for (const [lang, title, tour] of [['ar', 'القائمة', 'جولة'], ['fa-AF', 'فهرست', 'گشت']]) {
    await page.goto(testUrl + '?lang=' + lang + '&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.evaluate(() => localStorage.removeItem('bloxbert-learn'))
    await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 })
    await new Promise((r) => setTimeout(r, 200))
    await page.evaluate(() => document.getElementById('game-menu').click())
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
    await page.evaluate(() => document.getElementById('game-menu').click())
    await new Promise((r) => setTimeout(r, 400))
    const late = await page.evaluate(() => ({
      panel: document.getElementById('sheet').dataset.panel,
      title: document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent,
    }))
    note(lang + ' menu after tour', 412, late.panel === 'menu' && late.title === title && late.title !== tour, JSON.stringify(late))
  }
  await page.goto(testUrl + '?lang=es&smoke=1', { waitUntil: 'domcontentloaded', timeout: 30000 })
  await new Promise((r) => setTimeout(r, 700))
  await page.evaluate(() => document.getElementById('game-menu').click())
  await new Promise((r) => setTimeout(r, 250))
  const settings = await page.evaluate(() => {
    const tile = [...document.querySelectorAll('#sheet .gtile')].find((b) => b.textContent.includes('Ajustes'))
    if (tile) tile.click()
    return document.getElementById('sheet-title') && document.getElementById('sheet-title').textContent
  })
  note('es settings', 412, settings === 'Ajustes', settings)
  const day = await page.evaluate(() => {
    const tile = [...document.querySelectorAll('#sheet .gtile')].find((b) => b.textContent.includes('Siempre'))
    if (tile) tile.click()
    return document.documentElement.dataset.alwaysDay
  })
  note('always day', 412, day === '1', day)
  await prove2543(browser, testUrl, note, errs)
  await browser.close()
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
async function bootHud(browser, href, w, h, touch, prep) {
  const page = await browser.newPage()
  page.__err = []
  page.on('pageerror', (e) => page.__err.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') page.__err.push(m.text()) })
  page.on('dialog', (d) => d.accept())
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, isMobile: !!touch, deviceScaleFactor: 1 })
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
    await page.evaluate(() => window.__smoke.fillBag('dirt', 1))
    const stone = await lookSolid(page, 3, spawn)
    const before = await page.evaluate(() => window.__smoke.count('dirt'))
    await holdAt(page, c.x, c.y, 90, touch)
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
    const boxAt = await lookSolid(page, 27, spawn)
    if (boxAt) await page.evaluate((a) => window.__smoke.seedBox(a.x, a.y, a.z), boxAt)
    await sleep(150)
    const cBox = await centerOf(page)
    await holdAt(page, cBox.x, cBox.y, 90, touch)
    await sleep(300)
    const box = await page.evaluate(() => ({
      panel: document.getElementById('sheet').dataset.panel,
      slots: document.querySelectorAll('#sheet-body .gtile.slot').length,
      lock: document.pointerLockElement ? 'locked' : 'free',
      menu: document.body.classList.contains('menu-open'),
      canvas: getComputedStyle(document.querySelector('#stage canvas')).pointerEvents,
    }))
    note('box 18 pointer', w + 'x' + h, box.panel === 'box' && box.slots === 18 && box.lock === 'free' && box.menu && box.canvas === 'none', JSON.stringify(box))
    await shut(page, touch)
    const ovenAt = await lookSolid(page, 23, spawn)
    await sleep(150)
    const cOven = await centerOf(page)
    await holdAt(page, cOven.x, cOven.y, 90, touch)
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
    await page.close()
  }
  await play(412, 915, true)
  await play(1366, 768, false)

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
}

