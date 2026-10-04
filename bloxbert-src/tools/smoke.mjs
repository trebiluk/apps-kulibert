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
}
await browser.close()
const checks = [
  ['1a strip stays', gate.strip && gate.strip.includes('Glass') && gate.strip.includes('Bread')],
  ['1b sand spent', gate.sand === 0],
  ['student hook', student === 'undefined'],
]
for (const [name, ok] of checks) console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : JSON.stringify(gate))
if (checks.some(([, ok]) => !ok) || errs.length) process.exit(1)
console.log('smoke ok', url)
