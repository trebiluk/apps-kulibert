// Painter "Default block": one painted block goes back to the ACTIVE pack's own look, the other painted blocks stay.
// Runs in Classic and Mystical, at 1366 and 412 touch. Serves ../blocks-test on 8881.
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer-core'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.svg': 'image/svg+xml' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0])
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try { const b = await readFile(f); res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); res.end(b) } catch (e) { res.writeHead(404); res.end() }
})
await new Promise((r) => server.listen(8881, '127.0.0.1', r))
const chrome = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const errors = []
function note(name, ok, detail) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + String(detail).slice(0, 260) : '')) }

// hash of the live block strip (what the world draws)
const stripHash = (page) => page.evaluate(() => {
  const img = window.__bertSheet && window.__bertSheet.img
  if (!img || !img.naturalWidth && !img.width) return ''
  const c = document.createElement('canvas'); c.width = img.naturalWidth || img.width; c.height = img.naturalHeight || img.height
  const g = c.getContext('2d'); g.drawImage(img, 0, 0)
  const d = g.getImageData(0, 0, c.width, c.height).data
  let h = 2166136261
  for (let i = 0; i < d.length; i += 7) { h ^= d[i]; h = Math.imul(h, 16777619) >>> 0 }
  return h.toString(16)
})
const saved = (page) => page.evaluate(() => { try { const p = JSON.parse(localStorage.getItem('bertopia-student-pack') || 'null'); return p ? Object.keys(p.textures).sort() : [] } catch (e) { return 'bad' } })

async function paintBlock(page, key, colorIx) {
  await page.select('#pt-block', key)
  await sleep(150)
  await page.click('#pt-tools [data-tool="fill"]')
  await page.evaluate((i) => { const s = document.querySelectorAll('#painter .pt-swatch, #painter [data-color]'); const b = [...s].find((x) => +x.dataset.color === i) || s[i]; if (b) b.click() }, colorIx)
  const box = await page.evaluate(() => { const r = document.getElementById('pt-grid').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  await page.mouse.click(box.x, box.y)
  await sleep(100)
  await page.click('#pt-use')
  await sleep(1500)
}

for (const [w, h, touch] of [[1366, 768, false], [412, 915, true]]) {
  for (const pack of ['classic', 'mystical']) {
    const ctx = await browser.createBrowserContext()
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(e.message))
    await page.setViewport({ width: w, height: h, hasTouch: touch, deviceScaleFactor: 1 })
    await page.evaluateOnNewDocument((p) => { try { localStorage.setItem('bertopia-pack', p) } catch (e) {} }, pack)
    await page.goto('http://127.0.0.1:8881/?q=lite&smoke=1' + (touch ? '&touch=1' : ''), { waitUntil: 'domcontentloaded', timeout: 60000 })
    await page.waitForFunction(() => window.__bloxReady && window.__blocks && window.__bertSheet && window.__bertSheet.img, { timeout: 60000 })
    await sleep(1500)
    const tag = pack + ' ' + w
    const h0 = await stripHash(page)
    await page.evaluate(() => window.__blocks.panel('settings'))
    await sleep(400)
    const opener = await page.$('#pt-open')
    if (!opener) { note('painter opens ' + tag, false, 'no #pt-open in settings'); await ctx.close(); continue }
    await opener.click()
    await sleep(500)
    const btn = await page.evaluate(() => { const b = document.getElementById('pt-reset'); if (!b) return null; const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, text: b.textContent.trim(), icon: !!b.querySelector('svg'), visible: r.width > 0 } })
    note('Default block button ' + tag, btn && btn.visible && btn.h >= 44 && btn.icon && btn.text.length > 2, JSON.stringify(btn))
    await paintBlock(page, 'dirt', 19)
    await paintBlock(page, 'stone', 16)
    const h2 = await stripHash(page)
    const s2 = await saved(page)
    note('two blocks painted ' + tag, h2 !== h0 && s2.join(',') === 'dirt,stone', JSON.stringify({ s2, changed: h2 !== h0 }))
    await page.select('#pt-block', 'dirt')
    await sleep(150)
    await page.click('#pt-reset')
    await sleep(1800)
    const h3 = await stripHash(page)
    const s3 = await saved(page)
    const msg = await page.evaluate(() => (document.getElementById('pt-msg') || {}).textContent || '')
    const packWord = pack === 'mystical' ? 'Mystical' : 'Classic'
    const allLabel = await page.evaluate(() => (document.getElementById('pt-back') || {}).textContent || '')
    note('reset-all label names no pack ' + tag, /Reset all/.test(allLabel) && !/Classic/.test(allLabel), allLabel)
    note('dirt back to pack, stone still painted ' + tag, s3.join(',') === 'stone' && h3 !== h2 && h3 !== h0 && msg.includes(packWord), JSON.stringify({ s3, msg }))
    await page.select('#pt-block', 'stone')
    await sleep(150)
    await page.click('#pt-reset')
    await sleep(1800)
    const h4 = await stripHash(page)
    const s4 = await saved(page)
    note('last block back: world is the pack again ' + tag, s4.length === 0 && h4 === h0, JSON.stringify({ s4, same: h4 === h0 }))
    // reload keeps it clean
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__bloxReady && window.__bertSheet && window.__bertSheet.img, { timeout: 60000 })
    await sleep(1500)
    note('reload stays the pack ' + tag, (await stripHash(page)) === h0)
    await ctx.close()
  }
}
note('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
