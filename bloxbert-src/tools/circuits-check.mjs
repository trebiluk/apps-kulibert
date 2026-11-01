// Circuits C1. Sim is pure. The browser half uses real clicks at 915x412.
import { readFileSync, existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
import { simulate } from '../src/circuit-sim.js'
import { SCHEMA } from '../src/save/migrate.js'
import { Rules } from '../src/rules.js'
import '../src/packs/tech/pack.js'

const fail = []
function eq(ok, msg, extra) {
  if (!ok) fail.push(extra ? msg + ' ' + extra : msg)
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg + (extra ? ' ' + extra : ''))
}

function P(kind, x, y, z, on) {
  return { id: x + ',' + y + ',' + z, kind, x, y, z, on: !!on }
}
function litIds(parts, held) {
  return simulate({ parts }, { held: held || {} }).lit.slice().sort()
}

const loop = [
  P('cell', 0, 0, 0),
  P('line', 1, 0, 0),
  P('line', 2, 0, 0),
  P('load', 2, 0, 1),
  P('line', 1, 0, 1),
  P('line', 0, 0, 1),
]
eq(litIds(loop).join() === '2,0,1', 'closed loop lights')
const gap = loop.filter((p) => !(p.x === 1 && p.z === 0))
eq(litIds(gap).length === 0, 'gap does not light')
const openSw = [
  P('cell', 0, 0, 0),
  P('switch', 1, 0, 0, false),
  P('line', 2, 0, 0),
  P('load', 2, 0, 1),
  P('line', 1, 0, 1),
  P('line', 0, 0, 1),
]
eq(litIds(openSw).length === 0, 'open switch does not light')
const shut = openSw.map((p) => p.kind === 'switch' ? { ...p, on: true } : p)
eq(litIds(shut).join() === '2,0,1', 'closed switch lights')
const button = [
  P('cell', 0, 0, 0),
  P('button', 1, 0, 0),
  P('line', 2, 0, 0),
  P('load', 2, 0, 1),
  P('line', 1, 0, 1),
  P('line', 0, 0, 1),
]
eq(litIds(button, {}).length === 0, 'button unheld does not light')
eq(litIds(button, { '1,0,0': true }).join() === '2,0,1', 'button only while held')
const two = [
  P('cell', 0, 0, 0),
  P('line', 1, 0, 0),
  P('load', 2, 0, 0),
  P('line', 3, 0, 0),
  P('line', 3, 0, 1),
  P('load', 2, 0, 1),
  P('line', 1, 0, 1),
  P('line', 0, 0, 1),
]
eq(litIds(two).join('|') === '2,0,0|2,0,1', 'two lamps in a loop both light')
const wrong = [
  P('cell', 0, 0, 0),
  P('line', 1, 0, 0),
  P('load', 2, 0, 0),
  P('line', 3, 0, 0),
  P('cell', 4, 0, 0),
]
eq(litIds(wrong).length === 0, 'loop back to the wrong cell does not light')
eq(SCHEMA === 6, 'save schema stays 6')
eq(Rules.value('tech.circuits') === true, 'tech.circuits defaults on')

const game = [
  P('cell', 70, 5, 70),
  P('line', 71, 5, 70),
  P('line', 71, 6, 70),
  P('line', 71, 6, 71),
  P('switch', 70, 6, 71, false),
  P('load', 70, 5, 71),
]
eq(litIds(game).length === 0, 'game loop open switch stays dark')
const gameOn = game.map((p) => p.kind === 'switch' ? { ...p, on: true } : p)
eq(litIds(gameOn).join() === '70,5,71', 'game loop closed switch lights')
const gameGap = gameOn.filter((p) => !(p.x === 71 && p.y === 6 && p.z === 71))
const gapSim = simulate({ parts: gameGap }, {})
eq(gapSim.lit.length === 0, 'game loop gap goes dark')
eq(gapSim.stops.some((id) => id === '71,6,70' || id === '70,6,71'), 'dots stop beside the gap', gapSim.stops.join('|'))

const box = [
  P('cell', 0, 0, 0),
  P('line', 1, 0, 0),
  P('load', 1, 1, 0),
  P('switch', 0, 1, 0, false),
]
eq(litIds(box).length === 0, '2x2 open switch stays dark')
const boxOn = box.map((p) => p.kind === 'switch' ? { ...p, on: true } : p)
eq(litIds(boxOn).join() === '1,1,0', '2x2 closed switch lights')
const side = [
  P('cell', 0, 0, 0),
  P('line', 1, 0, 0),
  P('line', 2, 0, 0),
  P('line', 3, 0, 0),
  P('line', 2, 1, 0),
]
const sideSim = simulate({ parts: side }, {})
eq(sideSim.powered.indexOf('2,1,0') < 0, 'side tap off a straight run is not powered', sideSim.powered.join('|'))
eq(sideSim.powered.indexOf('1,0,0') >= 0 && sideSim.powered.indexOf('3,0,0') >= 0, 'end to end lines stay powered', sideSim.powered.join('|'))

if (process.env.UNIT) {
  if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
  console.log('unit ok')
  process.exit(0)
}

import puppeteer from 'puppeteer-core'
const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8911
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = process.env.CHROME_PATH || [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')

const server = createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (p.endsWith('/')) p += 'index.html'
  const f = path.join(root, p)
  if (!f.startsWith(root)) { res.writeHead(403); return res.end() }
  try {
    let b = await readFile(f)
    const ext = path.extname(f)
    const h = { 'content-type': types[ext] || 'application/octet-stream', 'cache-control': 'no-store' }
    if (/gzip/.test(req.headers['accept-encoding'] || '') && /\.(html|js|json|css|svg|txt)$/.test(ext)) { b = gzipSync(b); h['content-encoding'] = 'gzip' }
    h['content-length'] = b.length
    res.writeHead(200, h)
    res.end(b)
  } catch { res.writeHead(404); res.end('nf') }
})
await new Promise((r) => server.listen(port, '127.0.0.1', r))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

async function prep(page) {
  page.setDefaultTimeout(90000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {}, notes: ['lessonLoop', 'lessonSwitch', 'lessonCopper'] })) } catch (e) {}
    try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
    try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
  })
  return errs
}
async function boot(page, query) {
  const bootErr = []
  page.on('console', (m) => { if (m.type() === 'error') bootErr.push(m.text()) })
  page.on('pageerror', (e) => bootErr.push('pageerror: ' + e.message))
  await page.setViewport({ width: 915, height: 412, deviceScaleFactor: 1 })
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/?' + query, { waitUntil: 'domcontentloaded', timeout: 90000 })
  try {
    await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  } catch (e) {
    const info = await page.evaluate(() => ({
      ready: !!window.__bloxReady,
      blocks: !!window.__blocks,
      smoke: !!window.__smoke,
      text: (document.body && document.body.innerText || '').slice(0, 400),
    })).catch((err) => ({ eval: String(err) }))
    console.log('boot fail', query, JSON.stringify(info))
    console.log(bootErr.slice(0, 8).join('\n'))
    throw e
  }
  await page.evaluate(() => {
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    const b = document.querySelector('#rules-card .rc-got')
    if (b) b.click()
    const card = document.getElementById('rules-card')
    if (card) card.hidden = true
  })
  await sleep(250)
}

async function aimClick(page, x, y, z, face, pointerType) {
  return page.evaluate(async (x, y, z, face, pointerType) => {
    const s = window.__smoke
    const canvas = document.querySelector('#stage canvas')
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const normals = { top: [0, 1, 0], north: [0, 0, -1], south: [0, 0, 1], east: [1, 0, 0], west: [-1, 0, 0] }
    function pose(dist) {
      const tx = x + 0.5
      const tz = z + 0.5
      let eyeX, eyeY, eyeZ, lookY
      if (face === 'top') {
        lookY = y + 1.01
        eyeX = tx
        eyeZ = tz + dist
        eyeY = (y + 1.2) + 1.62
      } else {
        const n = normals[face]
        lookY = y + 0.5
        eyeX = tx + n[0] * (0.42 + dist)
        eyeY = lookY + 0.15
        eyeZ = tz + n[2] * (0.42 + dist)
      }
      const dx = tx - eyeX, dy = lookY - eyeY, dz = tz - eyeZ
      s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(dx, dz), Math.atan2(-dy, Math.hypot(dx, dz) || 0.001))
    }
    if (s.arm) s.arm()
    let aimed = null
    for (const dist of [2.2, 2.8, 3.6]) {
      for (let i = 0; i < 8; i++) {
        pose(dist)
        await frame(); await frame()
        const aim = s.aim()
        const hit = window.__blocks.noa.targetedBlock
        const n = hit && hit.normal
        const want = normals[face]
        const faceOk = !!(n && want && Math.abs(n[0] - want[0]) < 0.45 && Math.abs(n[1] - want[1]) < 0.45 && Math.abs(n[2] - want[2]) < 0.45)
        if (aim && faceOk && aim.x === x && aim.y === y && aim.z === z) { aimed = aim; break }
      }
      if (aimed) break
    }
    if (!aimed) return { ok: false, aim: s.aim(), voxel: s.voxel(x, y, z) }
    const r = canvas.getBoundingClientRect()
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const common = { bubbles: true, cancelable: true, pointerId: 7, pointerType: pointerType || 'mouse', clientX: cx, clientY: cy, isPrimary: true, button: 0, buttons: 1 }
    canvas.dispatchEvent(new PointerEvent('pointerdown', common))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    await frame(); await frame()
    return { ok: true, aim: aimed }
  }, x, y, z, face, pointerType)
}

async function lockPlay(page) {
  await page.evaluate(() => {
    const canvas = document.querySelector('#stage canvas')
    const r = canvas.getBoundingClientRect()
    const common = { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, isPrimary: true, button: 0, buttons: 1 }
    if (window.__smoke.arm) window.__smoke.arm()
    canvas.dispatchEvent(new PointerEvent('pointerdown', common))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
  })
  await sleep(280)
}

async function placeReal(page, item, x, y, z, face) {
  const held = await page.evaluate((item) => window.__smoke.hold(item), item)
  const click = await aimClick(page, x, y, z, face, 'mouse')
  await sleep(80)
  const id = await page.evaluate((x, y, z) => window.__smoke.voxel(x, y, z), x, y, z)
  return { held, click, id }
}

async function walkFps(page) {
  await page.evaluate(() => {
    window.__smoke.stand(12.4, 8, 22.4, 0, 0)
    window.__smoke.arm()
    window.__blocks.hold('forward', true)
  })
  await sleep(2600)
  return page.evaluate(() => {
    window.__blocks.hold('forward', false)
    return window.__smoke.fpsSpan(2000)
  })
}

const page = await browser.newPage()
const errs = await prep(page)
await boot(page, 'q=full&smoke=1&auto=0')
const version = await page.evaluate(() => window.__blocks.version)
eq(version === '2.5.174', 'version', version)

await page.evaluate(() => {
  const ops = []
  for (let x = 68; x <= 74; x++) for (let z = 68; z <= 74; z++) {
    ops.push([x, 4, z, 3])
    for (let y = 5; y <= 8; y++) ops.push([x, y, z, 0])
  }
  window.__blocks.applyEdit(ops)
  window.__smoke.emptyBag()
  window.__blocks.mode('survival')
  window.__smoke.stand(70.5, 6, 74, 0, 0)
})
await sleep(500)
const beforeFps = Math.max(await walkFps(page), await walkFps(page))
console.log('fps before ' + beforeFps.toFixed(2))

await lockPlay(page)
await page.evaluate(() => {
  window.__blocks.give('batteryCell', 2)
  window.__blocks.give('techLine', 8)
  window.__blocks.give('techSwitch', 2)
  window.__blocks.give('lantern', 2)
  window.__blocks.give('circuitLens', 1)
})
await sleep(200)

const CELL = 1400, LINE = 1401, SW = 1402, SWON = 1403, LAMP = 47
const spots = [
  ['batteryCell', 70, 4, 70, 'top', 70, 5, 70, CELL],
  ['techLine', 71, 4, 70, 'top', 71, 5, 70, LINE],
  ['lantern', 70, 4, 71, 'top', 70, 5, 71, LAMP],
  ['techLine', 71, 5, 70, 'top', 71, 6, 70, LINE],
  ['techLine', 71, 6, 70, 'south', 71, 6, 71, LINE],
  ['techSwitch', 71, 6, 71, 'west', 70, 6, 71, SW],
]
for (const row of spots) {
  const hit = await placeReal(page, row[0], row[1], row[2], row[3], row[4])
  const got = await page.evaluate((x, y, z) => window.__smoke.voxel(x, y, z), row[5], row[6], row[7])
  const toast = await page.evaluate(() => window.__smoke.toast())
  eq(hit.click.ok && got === row[8], 'place ' + row[0] + ' at ' + row[5] + ',' + row[6] + ',' + row[7], JSON.stringify({ held: hit.held, aim: hit.click.aim, got, toast }))
}

const faces = await page.evaluate(() => ({
  cell: window.__smoke.meta(70, 5, 70),
  line: window.__smoke.meta(71, 5, 70),
  high: window.__smoke.meta(71, 6, 70),
  mid: window.__smoke.meta(71, 6, 71),
  sw: window.__smoke.meta(70, 6, 71),
}))
const faceOk = ['cell', 'line', 'high', 'mid', 'sw'].every((k) => faces[k] && ['N', 'E', 'W', 'S'].includes(faces[k].face))
eq(faceOk, 'parts remember a facing', JSON.stringify(faces))

const dark = await page.evaluate(() => window.__smoke.circuit().lit.join('|'))
eq(dark === '', 'lamp starts dark', dark)

const clickOn = await aimClick(page, 70, 6, 71, 'west', 'mouse')
await sleep(120)
const onState = await page.evaluate(() => ({
  id: window.__smoke.voxel(70, 6, 71),
  lit: window.__smoke.circuit().lit.join('|'),
  glow: window.__smoke.meta(70, 5, 71),
}))
eq(clickOn.ok && onState.id === SWON && onState.lit === '70,5,71' && onState.glow && onState.glow.circuitLit === 1, 'real click closes the switch and lights the lamp', JSON.stringify(onState))

const tapOff = await aimClick(page, 70, 6, 71, 'west', 'touch')
await sleep(120)
const offState = await page.evaluate(() => ({
  id: window.__smoke.voxel(70, 6, 71),
  lit: window.__smoke.circuit().lit.join('|'),
}))
eq(tapOff.ok && offState.id === SW && offState.lit === '', 'real tap opens the switch and the lamp goes out', JSON.stringify(offState))

await aimClick(page, 70, 6, 71, 'west', 'mouse')
await sleep(80)
await page.evaluate(() => window.__smoke.hold('circuitLens'))
await sleep(350)
const flowing = await page.evaluate(() => window.__smoke.circuit())
eq(flowing.held && flowing.lit.join('|') === '70,5,71' && flowing.dots.length > 0 && flowing.glow > 0, 'lens shows flowing dots', JSON.stringify({ lit: flowing.lit, dots: flowing.dots.length, glow: flowing.glow, held: flowing.held }))

await page.evaluate(() => window.__blocks.applyEdit([[71, 6, 71, 0]]))
await sleep(350)
const stopped = await page.evaluate(() => window.__smoke.circuit())
const inGap = (stopped.dots || []).some((p) => p[0] >= 71 && p[0] < 72 && p[1] >= 6 && p[1] < 7 && p[2] >= 71 && p[2] < 72)
const beside = (stopped.stops || []).some((id) => id === '71,6,70' || id === '70,6,71')
eq(stopped.lit.length === 0 && !inGap && beside, 'lens dots stop at the removed line', JSON.stringify({ lit: stopped.lit, stops: stopped.stops, dots: stopped.dots.length, inGap }))

const beforeSave = await page.evaluate(() => ({
  ids: [
    window.__smoke.voxel(70, 5, 70),
    window.__smoke.voxel(71, 5, 70),
    window.__smoke.voxel(71, 6, 70),
    window.__smoke.voxel(70, 6, 71),
    window.__smoke.voxel(70, 5, 71),
  ],
  faces: {
    cell: window.__smoke.meta(70, 5, 70),
    sw: window.__smoke.meta(70, 6, 71),
    line: window.__smoke.meta(71, 6, 70),
  },
}))
const doc = await page.evaluate(() => window.__blocks.exportDoc())
await page.evaluate(async (saved) => { await window.__smoke.apply(saved) }, doc)
await sleep(300)
const afterSave = await page.evaluate(() => ({
  ids: [
    window.__smoke.voxel(70, 5, 70),
    window.__smoke.voxel(71, 5, 70),
    window.__smoke.voxel(71, 6, 70),
    window.__smoke.voxel(70, 6, 71),
    window.__smoke.voxel(70, 5, 71),
    window.__smoke.voxel(71, 6, 71),
  ],
  faces: {
    cell: window.__smoke.meta(70, 5, 70),
    sw: window.__smoke.meta(70, 6, 71),
    line: window.__smoke.meta(71, 6, 70),
  },
}))
eq(afterSave.ids.join() === beforeSave.ids.concat(0).join(), 'save reload keeps parts and switch state', afterSave.ids.join())
eq(afterSave.faces.cell && afterSave.faces.cell.face === beforeSave.faces.cell.face && afterSave.faces.sw && afterSave.faces.sw.face === beforeSave.faces.sw.face && afterSave.faces.line.face === beforeSave.faces.line.face, 'save reload keeps rotation', JSON.stringify(afterSave.faces))

await page.setViewport({ width: 412, height: 915 })
await sleep(400)
await page.setViewport({ width: 915, height: 412 })
await sleep(400)
eq(errs.length === 0, '915x412 rotate mid-play and 0 console errors', errs.slice(0, 4).join(' | '))

await page.evaluate(() => window.__smoke.hold('batteryCell') || window.__smoke.emptyBag())
const afterFps = Math.max(await walkFps(page), await walkFps(page))
console.log('fps after ' + afterFps.toFixed(2))
eq(afterFps + 0.05 >= beforeFps - Math.max(4, beforeFps * 0.2), 'walking fps not lower than before', beforeFps.toFixed(2) + ' -> ' + afterFps.toFixed(2))

const old = JSON.parse(readFileSync(path.join(__dir, '../tests/fixtures/w-v1.json'), 'utf8'))
const expectOld = JSON.parse(readFileSync(path.join(__dir, '../tests/fixtures/w-v1.expect.json'), 'utf8'))
await page.evaluate(async (saved) => { await window.__smoke.apply(saved) }, old)
await sleep(250)
const oldCounts = await page.evaluate(() => {
  const n = { 1: 0, 2: 0, 3: 0, tech: 0 }
  for (let x = 0; x < 24; x++) for (let y = 0; y < 24; y++) for (let z = 0; z < 24; z++) {
    const id = window.__smoke.voxel(x, y, z)
    if (id === 1 || id === 2 || id === 3) n[id] += 1
    if (id >= 1400 && id <= 1405) n.tech += 1
  }
  return n
})
eq(oldCounts[1] === expectOld.blocks.grass && oldCounts[2] === expectOld.blocks.dirt && oldCounts[3] === expectOld.blocks.stone && oldCounts.tech === 0, 'old fixture world loads unchanged', JSON.stringify(oldCounts))

const off = await browser.newPage()
const offErr = await prep(off)
await boot(off, 'nopack=tech&q=lite&smoke=1&auto=0')
await off.evaluate(async (saved) => { await window.__smoke.apply(saved) }, doc)
await sleep(300)
const crates = await off.evaluate(() => {
  const at = [[70, 5, 70], [71, 5, 70], [71, 6, 70], [71, 6, 71], [70, 6, 71]]
  const ids = at.map(([x, y, z]) => window.__smoke.voxel(x, y, z))
  const lamp = window.__smoke.voxel(70, 5, 71)
  return window.__blocks.exportDoc().then((next) => ({ ids, lamp, palette: next.palette, meta: next.meta || next.player && null }))
})
const missing = (id) => id === 1000 || (id >= 1001 && id <= 1099)
eq(missing(crates.ids[0]) && missing(crates.ids[1]) && missing(crates.ids[2]) && crates.ids[3] === 0 && missing(crates.ids[4]) && crates.lamp === 47, 'tech pack off shows ? crates and keeps the lantern', crates.ids.join() + ' lamp ' + crates.lamp)
const names = crates.palette.filter(Boolean)
eq(names.includes('techCell') && names.includes('techLine') && (names.includes('techSwitch') || names.includes('techSwitchOn')), 'pack off loses no part names', names.filter((n) => String(n).startsWith('tech') || n === 'lantern').join(','))
eq(offErr.length === 0, 'pack off page has no console errors', offErr.slice(0, 3).join(' | '))

const back = await browser.newPage()
await prep(back)
await boot(back, 'q=lite&smoke=1&auto=0')
const restoredDoc = await off.evaluate(() => window.__blocks.exportDoc())
await back.evaluate(async (saved) => { await window.__smoke.apply(saved) }, restoredDoc)
await sleep(250)
const restored = await back.evaluate(() => ({
  ids: [window.__smoke.voxel(70, 5, 70), window.__smoke.voxel(71, 5, 70), window.__smoke.voxel(71, 6, 70), window.__smoke.voxel(70, 6, 71), window.__smoke.voxel(71, 6, 71), window.__smoke.voxel(70, 5, 71)],
  face: window.__smoke.meta(70, 6, 71),
}))
eq(restored.ids[0] === CELL && restored.ids[1] === LINE && restored.ids[2] === LINE && restored.ids[3] === SWON && restored.ids[4] === 0 && restored.ids[5] === LAMP, 'pack on again restores every part and the switch', restored.ids.join())
eq(restored.face && restored.face.face === beforeSave.faces.sw.face, 'restored switch keeps its rotation', JSON.stringify(restored.face))

await browser.close()
server.close()
if (fail.length) {
  console.error('FAILED ' + fail.length)
  process.exit(1)
}
console.log('ALL PASS')
