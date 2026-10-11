// Classic archives must not overwrite each other. Item art is a shape, not a filled square.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8897
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = process.env.CHROME_PATH || [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
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
const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg); console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg) }
const SHAPES = ['berry', 'bread', 'cupcake', 'flour', 'sugar', 'floorLamp', 'wallLamp', 'rug', 'measuringTape', 'handSaw', 'hammer', 'woodTool', 'stoneTool', 'hoe', 'stick', 'ironIngot', 'copperIngot', 'zincIngot']

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

function watch(page) {
  const errs = []
  const warns = []
  let dialogMode = 'dismiss'
  const dialogs = []
  page.on('console', (m) => {
    const text = m.text()
    if (m.type() === 'error' && !/404|favicon|Failed to load/.test(text)) errs.push(text)
    if ((m.type() === 'warning' || m.type() === 'warn') && /fillBag/.test(text)) warns.push(text)
    if (/missing string|KulibertI18n missing/.test(text)) errs.push(text)
  })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('dialog', async (d) => {
    dialogs.push(d.message())
    try { if (dialogMode === 'accept') await d.accept(); else await d.dismiss() } catch (e) {}
  })
  return { errs, warns, dialogs, setMode(m) { dialogMode = m } }
}

const art = await browser.newPage()
art.setDefaultTimeout(30000)
const artUi = watch(art)
await art.goto('http://127.0.0.1:' + port + '/blocks-test/icons-test.html', { waitUntil: 'domcontentloaded', timeout: 30000 })
await art.waitForFunction(() => {
  const filled = (document.getElementById('filled') || {}).textContent || ''
  const blank = (document.getElementById('blank') || {}).textContent || ''
  return /^filled items: \d+$/.test(filled) && /^blank: \d+$/.test(blank)
})
const artInfo = await art.evaluate((keys) => {
  function ratio(canvas) {
    const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    let ink = 0
    const n = canvas.width * canvas.height
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 16) clear++
      else ink++
    }
    let h = 0
    for (let i = 0; i < data.length; i += 16) h = (h * 33 + data[i]) >>> 0
    return { clear: clear / n, ink, h }
  }
  function card(name, kind) {
    const cards = [...document.querySelectorAll('.card')]
    return cards.find((c) => ((c.querySelector('.name') || {}).textContent || '') === name && ((c.querySelector('.id') || {}).textContent || '').indexOf(kind) === 0)
  }
  const out = {}
  for (const key of keys) {
    const c = card(key, 'item')
    const canvas = c && c.querySelector('canvas')
    out[key] = canvas ? ratio(canvas) : null
  }
  const door = card('door', 'block')
  const canvas = door && door.querySelector('canvas')
  out.door = canvas ? ratio(canvas) : null
  out.filled = (document.getElementById('filled') || {}).textContent || ''
  out.filledNames = (document.getElementById('filled') || {}).dataset.names || ''
  out.blank = (document.getElementById('blank') || {}).textContent || ''
  out.count = (document.getElementById('count') || {}).textContent || ''
  return out
}, SHAPES)
eq(artInfo.filled === 'filled items: 0', 'filled items 0 ' + artInfo.filled + ' ' + artInfo.filledNames)
eq(artInfo.blank === 'blank: 0', 'blank 0 ' + artInfo.blank)
eq(/fallbacks/.test(artInfo.count || ''), 'fallbacks reported ' + artInfo.count)
for (const key of SHAPES) {
  const row = artInfo[key]
  eq(!!row && row.clear >= 0.15 && row.ink > 0, 'shape ' + key + ' ' + JSON.stringify(row))
}
for (const key of ['berry', 'wallLamp', 'handSaw', 'woodTool', 'stoneTool']) {
  const row = artInfo[key]
  const cover = row ? 1 - row.clear : 0
  eq(!!row && cover >= 0.5 && cover <= 0.7, 'readable ' + key + ' ' + cover.toFixed(3))
}
eq(artInfo.berry && artInfo.bread && artInfo.cupcake && artInfo.berry.h !== artInfo.bread.h && artInfo.bread.h !== artInfo.cupcake.h && artInfo.berry.h !== artInfo.cupcake.h, 'berry bread cupcake differ')
eq(artInfo.door && artInfo.door.clear < 0.05, 'door block still fills ' + JSON.stringify(artInfo.door))
eq(!artUi.errs.length, 'art console ' + artUi.errs.join(' | '))
await art.close()

const page = await browser.newPage()
page.setDefaultTimeout(90000)
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
  try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
  try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
  try { localStorage.setItem('tech-room-hub-staff', '1') } catch (e) {}
  try { localStorage.setItem('bloxbert-teacher', '1') } catch (e) {}
})
const ui = watch(page)
await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
await page.goto('http://127.0.0.1:' + port + '/blocks-test/?q=lite&smoke=1', { waitUntil: 'domcontentloaded', timeout: 90000 })
await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
await page.evaluate(() => {
  try { window.__blocks.noa.setPaused(false) } catch (e) {}
  const b = document.querySelector('#rules-card .rc-got')
  if (b) b.click()
  const card = document.getElementById('rules-card')
  if (card) card.hidden = true
  window.__smoke.emptyBag()
  for (const k of ['berry', 'bread', 'cupcake']) window.__blocks.give(k, 1)
})
await sleep(250)
const hot = await page.evaluate(() => {
  function ratio(canvas) {
    if (!canvas) return null
    const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    let ink = 0
    let h = 0
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 16) clear++
      else ink++
    }
    for (let i = 0; i < data.length; i += 16) h = (h * 33 + data[i]) >>> 0
    return { clear: clear / (canvas.width * canvas.height), ink, h, kind: canvas.dataset.kind || '', shape: canvas.dataset.shape || '' }
  }
  const out = {}
  for (const key of ['berry', 'bread', 'cupcake']) {
    const bag = window.__blocks.bag()
    const i = bag.findIndex((s) => s && s.item === key)
    const canvas = i < 0 ? null : document.querySelector('#hotbar [data-slot="' + i + '"] canvas')
    out[key] = ratio(canvas)
  }
  return out
})
for (const key of ['berry', 'bread', 'cupcake']) eq(hot[key] && hot[key].kind === 'wrap' && hot[key].shape === '1' && hot[key].clear >= 0.15 && hot[key].ink > 0, 'hotbar shape ' + key + ' ' + JSON.stringify(hot[key]))
eq(hot.berry && hot.bread && hot.cupcake && hot.berry.h !== hot.bread.h && hot.bread.h !== hot.cupcake.h, 'hotbar foods differ')

await page.evaluate(() => document.querySelector('#hotbar [data-bag="1"]').click())
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'inventory')
const bagArt = await page.evaluate(() => {
  function ratio(canvas) {
    if (!canvas) return null
    const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data
    let clear = 0
    for (let i = 3; i < data.length; i += 4) if (data[i] < 16) clear++
    return clear / (canvas.width * canvas.height)
  }
  const out = {}
  for (const key of ['berry', 'bread', 'cupcake']) {
    const bag = window.__blocks.bag()
    const i = bag.findIndex((s) => s && s.item === key)
    const canvas = i < 0 ? null : document.querySelector('#sheet [data-slot="' + i + '"] canvas')
    out[key] = ratio(canvas)
  }
  return out
})
for (const key of ['berry', 'bread', 'cupcake']) eq(bagArt[key] >= 0.15, 'bag shape ' + key + ' ' + bagArt[key])
const unknownBag = await page.evaluate(() => {
  const ok1 = window.__smoke.fillBag('notARealItem', 1)
  const ok2 = window.__smoke.fillBag('notARealItem', 1)
  const has = window.__blocks.bag().some((s) => s && s.item === 'notARealItem')
  return { ok1, ok2, has }
})
eq(unknownBag.ok1 === false && unknownBag.ok2 === false && !unknownBag.has, 'fillBag rejects unknown ' + JSON.stringify(unknownBag))
eq(ui.warns.length === 1, 'fillBag warned once ' + ui.warns.join(' | '))

async function openMenu() {
  await page.evaluate(() => document.getElementById('game-menu').click())
  await page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'menu'
  })
}
async function clickTile(label) {
  return page.evaluate((label) => {
    const t = [...document.querySelectorAll('#sheet .gtile')].find((el) => {
      const g = el.querySelector('.glbl')
      return ((g && g.textContent) || el.textContent || '').trim() === label
    })
    if (!t) return false
    t.click()
    return true
  }, label)
}
const cell = await page.evaluate(() => {
  for (let x = 60; x < 90; x++) for (let y = 8; y < 20; y++) for (let z = 30; z < 60; z++) {
    const id = window.__blocks.getVoxel(x, y, z)
    if (id !== 3 && id !== 8 && id !== 9 && id !== 5) return { x, y, z, id }
  }
  return null
})
eq(!!cell, 'marker cell ' + JSON.stringify(cell))
await page.evaluate((c) => window.__blocks.setVoxel(c.x, c.y, c.z, 3), cell)
await openMenu()
ui.setMode('accept')
eq(await clickTile('World'), 'world')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile('Fresh world'), 'fresh one')
await page.waitForFunction((c) => window.__blocks.getVoxel(c.x, c.y, c.z) !== 3, { timeout: 40000 }, cell)
const mid = await page.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell)
const mark = mid === 8 ? 5 : 8
await sleep(1200)
await page.evaluate((c, id) => window.__blocks.setVoxel(c.x, c.y, c.z, id), cell, mark)
eq(await clickTile('Fresh world'), 'fresh two')
await page.waitForFunction((c, id) => window.__blocks.getVoxel(c.x, c.y, c.z) !== id, { timeout: 40000 }, cell, mark)
await page.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => n.textContent === 'Open my old world'), { timeout: 20000 })
eq(await clickTile('Open my old world'), 'open old')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'oldworlds')
await page.waitForFunction(() => document.querySelectorAll('#sheet [data-archive]').length >= 2, { timeout: 20000 })
const labels = await page.evaluate(() => [...document.querySelectorAll('#sheet .glbl')].map((n) => n.textContent).filter((t) => t.indexOf('Open · ') === 0))
eq(labels.length >= 2, 'two archives ' + labels.join(' | '))
eq(labels.slice(0, 2).every((t) => /Open · \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(t)), 'archive times ' + labels.join(' | '))
eq(labels.filter((t) => t.indexOf('Fresh start') >= 0).length >= 2, 'fresh labels ' + labels.join(' | '))
eq(labels.some((t) => /blocks|Bag /.test(t)), 'archive counts ' + labels.join(' | '))
const third = mark === 8 ? 5 : 8
await page.evaluate((c, id) => window.__blocks.setVoxel(c.x, c.y, c.z, id), cell, third)
const listed = await page.evaluate(() => [...document.querySelectorAll('#sheet [data-archive]')].map((el) => ({
  key: el.dataset.archive,
  label: (el.querySelector('.glbl') || {}).textContent || '',
})))
const freshRows = listed.filter((r) => r.label.indexOf('Fresh start') >= 0)
const keyB = freshRows[0] && freshRows[0].key
const keyA = freshRows[freshRows.length - 1] && freshRows[freshRows.length - 1].key
async function openKey(key, ids) {
  const gen = await page.evaluate(() => window.__archiveGen || 0)
  const label = await page.evaluate((key) => {
    const b = [...document.querySelectorAll('#sheet [data-archive]')].find((el) => el.dataset.archive === key)
    if (!b) return ''
    b.click()
    return (b.querySelector('.glbl') || {}).textContent || ''
  }, key)
  await page.waitForFunction((g, c, want) => {
    return (window.__archiveGen || 0) > g && want.indexOf(window.__blocks.getVoxel(c.x, c.y, c.z)) >= 0
  }, { timeout: 40000 }, gen, cell, ids)
  const id = await page.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell)
  return { label, id }
}
const ids = [3, mark, third]
const openA = await openKey(keyA, ids)
const openB = await openKey(keyB, ids)
const openA2 = await openKey(keyA, ids)
const openB2 = await openKey(keyB, ids)
function rowKind(label) {
  const date = (String(label || '').match(/Open · \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/) || [])[0] || ''
  const why = String(label || '').indexOf('Fresh start') >= 0 ? 'fresh' : String(label || '').indexOf('Swapped out') >= 0 ? 'swap' : ''
  return date + '|' + why
}
eq(openA.id === 3 && openB.id === mark && openA2.id === 3 && openB2.id === mark, 'cycle keeps markers ' + [openA.id, openB.id, openA2.id, openB2.id].join(',') + ' keys ' + keyA + ' ' + keyB)
eq(!!openA.label && rowKind(openA2.label) === rowKind(openA.label) && rowKind(openB2.label) === rowKind(openB.label), 'same archive twice ' + openA2.label + ' | ' + openB2.label)
await page.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => n.textContent.indexOf('Swapped out') >= 0), { timeout: 20000 })
const after = await page.evaluate(() => [...document.querySelectorAll('#sheet [data-archive]')].map((el) => ({
  key: el.dataset.archive,
  label: (el.querySelector('.glbl') || {}).textContent || '',
})))
eq(after.length >= 3, 'three worlds stay ' + after.map((r) => r.label).join(' | '))
eq(after.filter((r) => r.label.indexOf('Fresh start') >= 0).length >= 2, 'fresh worlds stay ' + after.map((r) => r.label).join(' | '))
eq(after.some((r) => r.key === keyA) && after.some((r) => r.key === keyB), 'original keys stay ' + after.map((r) => r.key).join(' | '))
const swap = after.find((r) => r.label.indexOf('Swapped out') >= 0)
const swapped = await openKey(swap && swap.key, ids)
eq(swapped.id === third, 'swapped world keeps its block ' + swapped.id + ' want ' + third)
await openKey(keyA, ids)
await page.evaluate((c) => window.__blocks.setVoxel(c.x, c.y, c.z, 9), cell)
const again = await openKey(keyA, ids)
eq(again.id === 3 && rowKind(again.label) === rowKind(openA.label), 'reopen A ignores the extra block ' + again.id + ' ' + again.label)

await openMenu()
eq(await clickTile('World'), 'world backups')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile('Backups'), 'backups')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'backups')
await page.waitForSelector('#backup-name')
const before = await page.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell)
await page.evaluate(() => {
  const el = document.getElementById('backup-name')
  el.focus()
  el.value = 'Keep me'
})
await page.evaluate(() => document.getElementById('backup-save').click())
await page.waitForFunction(() => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === 'Keep me'))
await page.evaluate((c) => window.__blocks.setVoxel(c.x, c.y, c.z, 9), cell)
ui.setMode('dismiss')
const asks = ui.dialogs.length
eq(await page.evaluate(() => {
  const row = [...document.querySelectorAll('[data-backup]')].find((r) => ((r.querySelector('[data-backup-name]') || {}).textContent || '') === 'Keep me')
  const b = row && row.querySelector('[data-act="restore"]')
  if (!b) return false
  b.click()
  return true
}), 'restore click')
await sleep(300)
eq(ui.dialogs.length > asks && /Restore this backup/.test(ui.dialogs[ui.dialogs.length - 1] || ''), 'restore asks first ' + (ui.dialogs[ui.dialogs.length - 1] || ''))
eq(await page.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell) === 9, 'dismiss keeps the block')
ui.setMode('accept')
await page.evaluate(() => {
  const row = [...document.querySelectorAll('[data-backup]')].find((r) => ((r.querySelector('[data-backup-name]') || {}).textContent || '') === 'Keep me')
  row.querySelector('[data-act="restore"]').click()
})
await page.waitForFunction((c, id) => window.__blocks.getVoxel(c.x, c.y, c.z) === id, { timeout: 40000 }, cell, before)
await page.waitForFunction(() => {
  const sheet = document.getElementById('sheet')
  const toast = (document.getElementById('toast') || {}).textContent || ''
  return !!(sheet && sheet.dataset.panel === 'backups' && /Backup restored/.test(toast))
}, { timeout: 40000 })
eq(true, 'restore put the world back')

await openMenu()
eq(await clickTile('World'), 'world class')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile('Class snapshot'), 'class snapshot')
await page.waitForFunction(() => /Backup saved/.test((document.getElementById('toast') || {}).textContent || ''), { timeout: 20000 })
eq(await clickTile('Backups'), 'backups for pads')
await page.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'backups')
for (let i = 1; i <= 11; i++) {
  const name = 'Pad ' + String(i).padStart(2, '0')
  await page.waitForSelector('#backup-name')
  await page.evaluate((name) => {
    const el = document.getElementById('backup-name')
    el.value = name
  }, name)
  await page.evaluate(() => document.getElementById('backup-save').click())
  await page.waitForFunction((name) => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === name), { timeout: 60000 }, name)
}
const names = await page.evaluate(() => [...document.querySelectorAll('[data-backup-name]')].map((n) => n.textContent))
eq(names.some((n) => n.indexOf('Class - ') === 0), 'class snapshot survives ' + names.join(','))
eq(!names.includes('Pad 01') && names.includes('Pad 11'), 'oldest plain dropped ' + names.join(','))
eq(/Oldest backup removed/.test((await page.evaluate(() => (document.getElementById('toast') || {}).textContent || ''))), 'oldest toast')
eq(!ui.errs.length, 'console ' + ui.errs.join(' | '))

if (fail.length) {
  console.error('archive-check FAIL ' + fail.length)
  process.exitCode = 1
} else console.log('archive-check ok')
await browser.close()
server.close()
process.exit(process.exitCode || 0)
