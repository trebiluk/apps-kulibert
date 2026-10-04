import puppeteer from 'puppeteer-core'
const url = process.argv[2] || 'http://127.0.0.1:8875/blocks/'
const browser = await puppeteer.launch({ executablePath: '/usr/bin/chromium', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] })
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
  await browser.close()
  if (checks.some((c) => !c[2]) || errs.length) process.exit(1)
  process.exit(0)
}
await browser.close()
process.exit(errs.length ? 1 : 0)
