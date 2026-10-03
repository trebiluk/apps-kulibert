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
await browser.close()
if (errs.length || !hot) {
  console.error(errs.join('\n') || 'no hotbar')
  process.exit(1)
}
console.log('smoke ok', url)
