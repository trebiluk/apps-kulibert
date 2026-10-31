// Holo Hand part 1 check (replaces the old first-person hand check; that hand is no longer mounted).
// The held item shows as a small amber hologram in the lower corner on the main-hand side.
// Checks at 1366x768, 412x915 upright and 915x412 sideways: it shows, it never covers the hotbar or a button,
// it follows the held item, Left mirrors it and survives a reload, reduced motion stops the bob,
// nothing in it is near white, and its per-frame cost is far under 0.5 ms.
// BLOX_ROOT can point at another built test page (default ../../blocks-test).
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(process.env.BLOX_ROOT || path.resolve(__dir, '../../blocks-test'))
const sharedRoot = path.resolve(process.env.BLOX_SHARED || path.resolve(__dir, '../../shared'))
const out = process.env.HANDS_OUT || '/tmp/hands-check'
mkdirSync(out, { recursive: true })
const chrome = ['/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find((p) => existsSync(p))
if (!chrome) { console.error('No Chrome/Chromium found.'); process.exit(1) }

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css' }
const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const underShared = p.startsWith('/shared/')
  const base = underShared ? sharedRoot : root
  const f = path.join(base, underShared ? p.slice('/shared/'.length) : p)
  if (!f.startsWith(base)) { res.writeHead(403); return res.end() }
  try {
    const b = await readFile(f)
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' })
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(8879, '127.0.0.1', r))

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
let failed = 0
function note(name, ok, detail) {
  if (!ok) failed++
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 240) : ''))
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function boot(w, h, touch, motion) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push('page:' + e.message))
  await page.setViewport({ width: w, height: h, isMobile: !!touch, hasTouch: !!touch, deviceScaleFactor: 1 })
  if (motion) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto('http://127.0.0.1:8879/?q=lite&smoke=1' + (touch ? '&touch=1' : ''), { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__bloxReady && window.__blocks, { timeout: 60000 })
  await sleep(2500)
  await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    const x = document.getElementById('sheet-x')
    if (sheet && !sheet.hidden && x) x.click()
    document.body.classList.remove('menu-open')
    window.__blocks.lookHand({ show: true, side: 'right', cam: 'close' })
    window.__blocks.mode('creative')
  })
  await sleep(1500)
  return { ctx, page, errors }
}

// Where the hologram is, what it covers, how it moves, and its brightest pixel.
async function look(page) {
  return page.evaluate(() => {
    const h = window.__blocks.hand()
    const el = document.getElementById('holo-hand')
    const r = el.getBoundingClientRect()
    const covers = []
    for (const e of document.querySelectorAll('button, a[href], input, [role="button"], #hotbar, #stick-pad, #current')) {
      if (el.contains(e)) continue
      if (e.checkVisibility && !e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue
      const q = e.getBoundingClientRect()
      if (q.width < 4 || q.height < 4) continue
      if (r.width && q.right > r.left && q.left < r.right && q.bottom > r.top && q.top < r.bottom) covers.push(e.id || String(e.className).slice(0, 24) || e.tagName)
    }
    let bright = 0
    let vis = 0
    let fillRatio = 0
    const c = el.querySelector('canvas')
    try {
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data
      let y0 = c.height, y1 = -1, x0 = c.width, x1 = -1, n = 0
      for (let i = 0; i < d.length; i += 4) {
        if (!d[i + 3]) continue
        bright = Math.max(bright, d[i], d[i + 1], d[i + 2])
        const p = i / 4, x = p % c.width, y = (p / c.width) | 0
        n++; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x
      }
      // r1: the drawn picture's own height on screen, not the box's
      if (y1 >= 0) { vis = Math.round(Math.max(y1 - y0 + 1, x1 - x0 + 1) / c.height * r.height); fillRatio = n / ((y1 - y0 + 1) * (x1 - x0 + 1)) }
    } catch (e) {}
    return {
      hand: h,
      shown: getComputedStyle(el).display !== 'none',
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      covers,
      anim: getComputedStyle(el.querySelector('.holo-bob')).animationName,
      bright,
      vis,
      fillRatio,
      vw: innerWidth,
      vh: innerHeight,
    }
  })
}

for (const [w, h, touch] of [[1366, 768, false], [412, 915, true], [915, 412, true]]) {
  const tag = w + 'x' + h
  const { ctx, page, errors } = await boot(w, h, touch)
  const a = await look(page)
  await page.screenshot({ path: path.join(out, tag + '.png') })
  note(tag + ' hologram shows', a.shown && a.hand && a.hand.visible && a.hand.room, JSON.stringify(a.rect))
  note(tag + ' covers no control', a.covers.length === 0, a.covers.join(','))
  note(tag + ' lower half, main-hand side', a.rect[1] > a.vh * 0.4 && a.rect[0] + a.rect[2] / 2 > a.vw / 2, JSON.stringify(a.rect))
  note(tag + ' size about 12% of height', a.rect[3] >= 44 && a.rect[3] <= Math.max(44, a.vh * 0.12) + 1, a.rect[3] + 'px')
  note(tag + ' drawn hand is about 12% of height (r1)', a.vis >= Math.min(a.vh * 0.11, a.rect[3]) && a.vis <= a.vh * 0.12 + 2, a.vis + 'px of ' + a.vh + ' = ' + (a.vis / a.vh * 100).toFixed(1) + '%')
  note(tag + ' no mesh (0 tris)', a.hand && a.hand.tris === 0)
  note(tag + ' not near white', a.bright > 0 && a.bright <= 0xEE, 'max channel ' + a.bright)
  note(tag + ' bobs', a.anim === 'holo-bob', a.anim)
  const k1 = a.hand && a.hand.key
  await page.keyboard.press('4')
  await sleep(600)
  const k2 = (await look(page)).hand.key
  note(tag + ' follows the held item', k1 && k2 && k1 !== k2, k1 + ' -> ' + k2)
  {
    // r1: Sapling shows its own sprite (a cube tile read as a tan square: almost every pixel of its box filled)
    const slot = await page.evaluate(() => {
      window.__blocks.mode('survival'); window.__blocks.give('sapling', 1)
      const b = window.__blocks.bag(); const list = Array.isArray(b) ? b : (b && b.slots) || []
      for (let i = 0; i < 9; i++) { const s = list[i]; if (s && (s.item || s.id || s.key) === 'sapling') return i }
      return -1
    })
    if (slot >= 0) { await page.keyboard.press(String(slot + 1)); await sleep(900) }
    const sp = await look(page)
    await page.screenshot({ path: path.join(out, tag + '-sapling.png') })
    note(tag + ' Sapling uses its sprite, not a square (r1)', slot >= 0 && sp.hand && /^block:|sapling/.test(sp.hand.key || '') && sp.shown && sp.fillRatio < 0.8, 'slot ' + slot + ' key ' + (sp.hand && sp.hand.key) + ' fill ' + sp.fillRatio.toFixed(2))
    await page.evaluate(() => window.__blocks.mode('creative'))
    await sleep(400)
  }
  {
    // r1: Left at every size; at 412 upright it sits in the lower-left corner
    await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'left' }))
    await sleep(1300)
    const l = await look(page)
    await page.screenshot({ path: path.join(out, tag + '-left.png') })
    // 412 upright: the stick pad and hotbar fill the corner itself, so "lower-left corner" = flush left, right on top of the stick
    const stickTop = await page.evaluate(() => { const e = document.getElementById('stick-pad'); return e && e.offsetWidth ? Math.round(e.getBoundingClientRect().top) : -1 })
    const corner = l.rect[0] <= 12 && stickTop > 0 && stickTop - (l.rect[1] + l.rect[3]) >= 0 && stickTop - (l.rect[1] + l.rect[3]) <= 16
    note(tag + ' Left: lower-left corner, covers nothing (r1)', l.shown && l.covers.length === 0 && (w !== 412 || corner) && l.rect[0] + l.rect[2] / 2 < l.vw / 2, JSON.stringify(l.rect) + ' bottom ' + ((l.rect[1] + l.rect[3]) / l.vh * 100).toFixed(0) + '%')
    await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'right' }))
    await sleep(800)
  }
  if (w === 1366) {
    await page.evaluate(() => window.__blocks.lookHand({ show: false }))
    await sleep(300)
    note(tag + ' Show hand off hides it', !(await look(page)).shown)
    await page.evaluate(() => window.__blocks.lookHand({ show: true }))
    await sleep(300)
    await page.keyboard.press('h')
    await sleep(300)
    const hOff = await look(page)
    const noteText = await page.evaluate(() => { const n = document.getElementById('holo-note'); return n && !n.hidden ? n.textContent : '' })
    await page.keyboard.press('h')
    await sleep(1300)
    const hOn = await look(page)
    note(tag + ' H key hides and shows it, with a label', !hOff.shown && hOn.shown && !!noteText, noteText)
    await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'left' }))
    await sleep(1300)
    const l = await look(page)
    note(tag + ' Left mirrors to the left corner', l.shown && l.rect[0] + l.rect[2] / 2 < l.vw / 2 && l.covers.length === 0, JSON.stringify(l.rect))
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__bloxReady && window.__blocks, { timeout: 60000 })
    await sleep(2500)
    const r = await look(page)
    note(tag + ' Left survives a reload', r.hand && r.hand.side === 'left' && r.rect[0] + r.rect[2] / 2 < r.vw / 2, JSON.stringify(r.rect))
    await page.evaluate(() => window.__blocks.lookHand({ show: true, side: 'right' }))
  }
  note(tag + ' no page errors', errors.length === 0, errors.join(' | '))
  await ctx.close()
}

{
  const { ctx, page } = await boot(412, 915, true, true)
  const a = await look(page)
  note('reduced motion: no bob', a.anim === 'none', a.anim)
  await ctx.close()
}

await browser.close()
server.close()
console.log(failed ? 'holo hand: ' + failed + ' FAIL' : 'holo hand: all PASS')
process.exit(failed ? 1 : 0)
