// Water flow check: digging beside water fills the hole, water falls into a pit, never climbs onto dry land, stops at
// the cap, and the filled water saves. Builds its own pool so worldgen can't change the answer. Serves ../blocks-test on 8883.
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
await new Promise((r) => server.listen(8883, '127.0.0.1', r))
const chrome = process.env.CHROME_PATH || ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
const browser = await puppeteer.launch({ executablePath: chrome, headless: 'new', protocolTimeout: 180000, args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'] })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let fails = 0
const errors = []
function note(name, ok, detail) { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (detail ? ' ' + String(detail).slice(0, 260) : '')) }

for (const reduce of [false, true]) {
  const ctx = await browser.createBrowserContext()
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
  if (reduce) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
  await page.goto('http://127.0.0.1:8883/?q=lite&smoke=1', { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__blocks, { timeout: 60000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} ; window.__blocks.mode('survival') })
  const tag = reduce ? 'reduced motion' : 'normal'
  // A test bay away from town: stone floor y=3, dirt ground y=4..5 (surface y=5), a 3x3 pool at y=4..5 (surface 5).
  const W = await page.evaluate(() => {
    const s = window.__smoke
    const WATER = (() => { for (let id = 1; id < 400; id++) { try { if (window.__blocks.noa.registry.getBlockFluidity && window.__blocks.noa.registry.getBlockFluidity(id)) return id } catch (e) {} } return 0 })()
    const X = 120, Z = 120
    for (let x = X - 16; x <= X + 16; x++) for (let z = Z - 16; z <= Z + 16; z++) {
      s.plant(x, 3, z, 3)
      s.plant(x, 4, z, 2); s.plant(x, 5, z, 2)
      for (let y = 6; y <= 9; y++) s.plant(x, y, z, 0)
    }
    for (let x = X - 1; x <= X + 1; x++) for (let z = Z - 1; z <= Z + 1; z++) { s.plant(x, 4, z, WATER); s.plant(x, 5, z, WATER) }
    s.stand(X + 0.5, 6, Z + 6.5, Math.PI, 0.3)
    return { WATER, X, Z }
  })
  note('test water id found ' + tag, W.WATER > 0, JSON.stringify(W))
  const v = (x, y, z) => page.evaluate((x, y, z) => window.__smoke.voxel(x, y, z), x, y, z)
  const settle = async () => { for (let i = 0; i < 80; i++) { if (!(await page.evaluate(() => window.__smoke.waterBusy()))) return; await sleep(100) } }
  const { X, Z, WATER } = W
  // 1. dig the dirt right beside the pool at surface height: it fills
  await page.evaluate((X, Z) => (window.__smoke.stand(X + 2.5, 6, Z + 2.5, Math.PI, 0.6), window.__smoke.dig(X + 2, 5, Z)), X, Z)
  await settle()
  note('hole beside pool fills ' + tag, (await v(X + 2, 5, Z)) === WATER, await v(X + 2, 5, Z))
  // 2. a dry trench one block further, dug before connecting: stays dry; dig the link: both fill
  await page.evaluate((X, Z) => { window.__smoke.stand(X + 4.5, 6, Z + 2.5, Math.PI, 0.6); window.__smoke.dig(X + 4, 5, Z) }, X, Z)
  await settle()
  const dryFirst = await v(X + 4, 5, Z)
  await page.evaluate((X, Z) => (window.__smoke.stand(X + 3.5, 6, Z + 2.5, Math.PI, 0.6), window.__smoke.dig(X + 3, 5, Z)), X, Z)
  await settle()
  note('dry trench stays dry, then fills when linked ' + tag, dryFirst === 0 && (await v(X + 3, 5, Z)) === WATER && (await v(X + 4, 5, Z)) === WATER, JSON.stringify([dryFirst, await v(X + 3, 5, Z), await v(X + 4, 5, Z)]))
  // 3. never onto dry land: the air above the ground (y=6) beside the pool stays air
  const above = await page.evaluate((X, Z) => { const s = window.__smoke; let n = 0; for (let x = X - 6; x <= X + 6; x++) for (let z = Z - 6; z <= Z + 6; z++) if (s.voxel(x, 6, z) !== 0) n++; return n }, X, Z)
  note('no water climbs onto the ground ' + tag, above === 0, above)
  // 4. a pit under the new channel: water falls into it
  await page.evaluate((X, Z) => { const s = window.__smoke; s.plant(X + 4, 4, Z, 0); s.plant(X + 4, 3, Z, 0); s.plant(X + 4, 2, Z, 3); s.plant(X + 4, 5, Z, 2) }, X, Z)
  await page.evaluate((X, Z) => (window.__smoke.stand(X + 4.5, 6, Z + 2.5, Math.PI, 0.6), window.__smoke.dig(X + 4, 5, Z)), X, Z)
  await settle()
  note('water falls into a pit ' + tag, (await v(X + 4, 5, Z)) === WATER && (await v(X + 4, 4, Z)) === WATER && (await v(X + 4, 3, Z)) === WATER, JSON.stringify([await v(X + 4, 5, Z), await v(X + 4, 4, Z), await v(X + 4, 3, Z)]))
  // 5. cap: a huge dug basin at y=4..5 (open, 25x25) next to the pool takes at most 96 cells per dig
  const capped = await page.evaluate(async (X, Z, WATER) => {
    const s = window.__smoke
    for (let x = X - 14; x <= X + 14; x++) for (let z = Z + 3; z <= Z + 14; z++) { s.plant(x, 4, z, 0); s.plant(x, 5, z, 0) }
    s.plant(X, 5, Z + 2, 2); s.plant(X, 4, Z + 2, 2)
    let before = 0
    for (let x = X - 16; x <= X + 16; x++) for (let z = Z - 16; z <= Z + 16; z++) for (let y = 2; y <= 6; y++) if (s.voxel(x, y, z) === WATER) before++
    s.stand(X + 2.5, 6, Z + 2.5, Math.PI, 0.6)
    s.dig(X, 5, Z + 2)
    for (let i = 0; i < 100 && s.waterBusy(); i++) await new Promise((r) => setTimeout(r, 100))
    let after = 0
    for (let x = X - 16; x <= X + 16; x++) for (let z = Z - 16; z <= Z + 16; z++) for (let y = 2; y <= 6; y++) if (s.voxel(x, y, z) === WATER) after++
    return { added: after - before }
  }, X, Z, WATER)
  note('one dig fills at most 96 cells ' + tag, capped.added > 1 && capped.added <= 96, JSON.stringify(capped))
  // 5b. building into water: aim at the pool's far wall from across the water while holding Dirt; the preview
  // lands in a water cell and must say it fits (it was a red "No room", and placing there already worked)
  const cue = await page.evaluate(async (X, Z) => {
    const s = window.__smoke, B = window.__blocks
    B.give('dirt', 4)
    const i = B.bag().findIndex((sl) => sl && (sl.item === 'dirt' || String(sl).startsWith('dirt')))
    if (i >= 0 && s.key) s.key(i < 9 ? i : 0)
    const f = () => new Promise((r) => requestAnimationFrame(r))
    // the pool's west wall is dirt at (X-2, 5, Z); aim at its east face from the water side
    let seen = null
    for (let k = 0; k < 20; k++) {
      s.stand(X + 1.5, 5.2, Z + 0.5, -Math.PI / 2, 0.35)
      await f(); await f()
      const el = document.getElementById('place-cue')
      seen = { aim: s.aim(), cue: el ? el.dataset.kind || el.className || '' : '', text: el ? el.textContent : '' }
      if (seen.aim && seen.text) break
    }
    return seen
  }, X, Z)
  note('preview over water fits, no red No room ' + tag, cue && !/No room/i.test(cue.text || ''), JSON.stringify(cue))
  // 6. saves: reload and the dug-and-filled cells are still water
  await page.evaluate(() => { const b = document.getElementById('save-btn'); if (b) b.click() })
  await sleep(1200)
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke, { timeout: 60000 })
  await sleep(800)
  note('filled water is saved ' + tag, (await v(X + 2, 5, Z)) === WATER && (await v(X + 3, 5, Z)) === WATER, JSON.stringify([await v(X + 2, 5, Z), await v(X + 3, 5, Z)]))
  await ctx.close()
}
note('no page errors', errors.length === 0, errors.slice(0, 2).join(' | '))
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
