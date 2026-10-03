import puppeteer from 'puppeteer-core'
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-software-rasterizer'] })
const p = await b.newPage(); await p.setViewport({ width: 1366, height: 768 })
const errs = []; p.on('pageerror', (e) => errs.push(e.message))
await p.goto('http://127.0.0.1:8870/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 1500))
console.log(await p.evaluate(() => document.getElementById('stage').innerText.slice(0, 80)), errs)
await p.screenshot({ path: 'measure/no-webgl-1366x768.png' }); await b.close()
