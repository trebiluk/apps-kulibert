// Save an old open world twice and check the town stations do not appear.
import puppeteer from 'puppeteer-core'
import { readFileSync } from 'fs'

const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell'
const URL0 = process.argv[2] || 'http://127.0.0.1:8875/p0-preview/index.html?smoke=1'
const openGround = JSON.parse(readFileSync(new URL('../tests/fixtures/w-2.5.113.json', import.meta.url), 'utf8'))
const dup = JSON.parse(readFileSync(new URL('../tests/fixtures/w-2.5.124-dup.json', import.meta.url), 'utf8'))
const STATIONS = [[6, 5, 8], [8, 5, 9], [10, 5, 6], [11, 5, 8]]

function snapSource() {
  const crop = { 28: 1, 29: 1, 49: 1, 58: 1, 59: 1, 60: 1, 61: 1, 62: 1, 63: 1, 65: 1, 66: 1, 67: 1, 68: 1 }
  const cells = []
  for (let y = 0; y < 24; y++) for (let z = 0; z < 24; z++) for (let x = 0; x < 24; x++) {
    const id = window.__blocks.getVoxel(x, y, z) | 0
    if (!id || crop[id]) continue
    cells.push(x + ',' + y + ',' + z + ':' + id)
  }
  const stations = [[6, 5, 8], [8, 5, 9], [10, 5, 6], [11, 5, 8]].map(([x, y, z]) => window.__blocks.getVoxel(x, y, z) | 0)
  let hut = 0
  for (let x = 1; x <= 4; x++) for (let z = 1; z <= 4; z++) hut += window.__blocks.getVoxel(x, 5, z) | 0
  return { cells: cells.join('|'), stations, hut }
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message))
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
await page.goto(URL0, { waitUntil: 'domcontentloaded' })
await page.waitForFunction(() => window.__bloxReady && window.__blocks && window.__smoke, { timeout: 30000 })

const fresh = await page.evaluate(() => {
  window.__blocks.resetWorld()
  return [[6, 5, 8], [8, 5, 9], [10, 5, 6], [11, 5, 8]].map(([x, y, z]) => window.__blocks.getVoxel(x, y, z) | 0)
})

async function cycle(doc) {
  await page.evaluate(async (world) => { await window.__smoke.apply(world) }, doc)
  await new Promise((r) => setTimeout(r, 400))
  const placed = await page.evaluate(snapSource)
  await page.evaluate(async () => { await window.__blocks.save() })
  const shots = [placed]
  for (let i = 0; i < 2; i++) {
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => window.__bloxReady && window.__blocks, { timeout: 30000 })
    await new Promise((r) => setTimeout(r, 300))
    shots.push(await page.evaluate(snapSource))
  }
  return shots
}

const openShots = await cycle(openGround)
const dupShots = await cycle(dup)
await browser.close()

const fail = []
if (fresh.join(',') !== '22,25,26,23') fail.push('new world stations ' + fresh.join(','))
for (const [name, shots] of [['open', openShots], ['dup', dupShots]]) {
  for (let i = 0; i < shots.length; i++) {
    if (shots[i].stations.some((id) => id !== 0)) fail.push(name + ' stations ' + i + ' ' + shots[i].stations.join(','))
    if (shots[i].hut) fail.push(name + ' hut y5 ' + i)
  }
  if (shots[1].cells !== shots[2].cells) fail.push(name + ' reload voxels differ')
  if (shots[0].cells !== shots[1].cells) fail.push(name + ' save voxels differ')
}
if (errors.length) fail.push('errors ' + errors.slice(0, 4).join(' | '))
if (fail.length) {
  console.log('FAIL reload-check')
  for (const line of fail) console.log(line)
  process.exit(1)
}
console.log('PASS reload-check new ' + fresh.join(',') + ' open/dup stable, 0 errors')
