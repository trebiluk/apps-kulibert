// Clock guard check: bad values are ignored, a bad saved ms loads at dawn.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../../blocks-test')
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found.'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try {
    let b = await readFile(f)
    const ext = path.extname(f)
    const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(8878, '127.0.0.1', r))

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 120000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.setDefaultTimeout(60000)
const errors = []
page.on('pageerror', (e) => errors.push(e.message))

const report = { steps: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 300) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 160) : ''))
  if (!ok && !report.fail) report.fail = name
}

await page.goto('http://127.0.0.1:8878/?q=lite&smoke=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 45000 })

const bad = await page.evaluate(() => {
  const s = window.__smoke
  const before = s.phase()
  const lumBefore = s.lum()
  s.seek('night')
  s.clock(NaN)
  s.clock('abc')
  s.seek(undefined)
  return { before, after: s.phase(), lum: s.lum(), same: s.phase() === before, finite: Number.isFinite(s.lum()) }
})
note('bad seek/clock ignored', bad.same && bad.finite && bad.after !== 'NaN', JSON.stringify(bad))

const loaded = await page.evaluate(() => {
  const s = window.__smoke
  if (s.load) s.load({ ms: 'abc' })
  const phase = s.phase()
  const lum = s.lum()
  return { phase, lum, finite: Number.isFinite(lum), dawn: phase === 'day' || phase === 'dawn' }
})
note('bad ms loads at dawn', loaded.finite && loaded.lum === 1 && loaded.dawn, JSON.stringify(loaded))

note('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))

await browser.close()
server.close()
console.log(JSON.stringify(report, null, 2))
if (report.fail) process.exit(1)
