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
await new Promise((r) => setTimeout(r, 1500))
const food = await page.evaluate(() => {
  window.__smoke.seed()
  const bar = document.getElementById('hotbar').innerText
  const pics = document.querySelectorAll('#hotbar svg, #hotbar canvas').length
  window.__smoke.notch(5)
  const hot = window.__smoke.hot()
  window.__smoke.key(1)
  const before = window.__smoke.counts()
  window.__smoke.place()
  const after = window.__smoke.counts()
  return { bar, pics, hot, before, after, object: bar.includes('[object'), bare: document.querySelector('#hotbar .sw') && document.querySelector('#hotbar .sw').textContent.trim() === 'cupcake' }
})
await browser.close()
if (errs.length || !hot || !open || pics.text || pics.icons < 8 || pics.slots < 5 || food.object || food.bare || food.pics < 4 || food.hot !== 5 || food.after.sand !== 3 || food.after.coal !== 2) {
  console.error(errs.join('\n') || JSON.stringify({ pics, food }))
  process.exit(1)
}
console.log('smoke ok', url, pics, food)
