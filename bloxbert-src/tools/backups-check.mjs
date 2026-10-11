// Hotbar/Bag wraps plus local teacher backups. Real clicks. Hooks only give items and mark a cell.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const port = 8896
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

const URL0 = 'http://127.0.0.1:' + port + '/blocks-test/?q=lite&smoke=1'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg); console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg) }
const ART = ['berry', 'bread', 'floorLamp', 'rug', 'measuringTape']

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})

function watch(page) {
  const errs = []
  let dialogMode = 'dismiss'
  const dialogs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/404|favicon|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  page.on('dialog', async (d) => {
    dialogs.push(d.message())
    try { if (dialogMode === 'accept') await d.accept(); else await d.dismiss() } catch (e) {}
  })
  return {
    errs,
    dialogs,
    setMode(m) { dialogMode = m },
  }
}

async function prep(page, teacher, lang) {
  await page.evaluateOnNewDocument((teacher, lang) => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
    try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
    try { sessionStorage.setItem('bt-shop-safe', '1') } catch (e) {}
    if (teacher) {
      try { localStorage.setItem('tech-room-hub-staff', '1') } catch (e) {}
      try { localStorage.setItem('bloxbert-teacher', '1') } catch (e) {}
    }
    if (lang) {
      try { localStorage.setItem('kulibert-prefs-v1', JSON.stringify({ lang })) } catch (e) {}
    }
  }, teacher, lang || '')
  return watch(page)
}

async function ready(page) {
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.evaluate(() => {
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    const b = document.querySelector('#rules-card .rc-got')
    if (b) b.click()
    const card = document.getElementById('rules-card')
    if (card) card.hidden = true
  })
  await sleep(200)
}

async function boot(page, teacher, lang) {
  const ui = await prep(page, teacher, lang)
  await page.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
  const q = lang ? '&lang=' + encodeURIComponent(lang) : ''
  await page.goto(URL0 + q, { waitUntil: 'domcontentloaded', timeout: 90000 })
  await ready(page)
  return ui
}

async function openMenu(page) {
  await page.evaluate(() => document.getElementById('game-menu').click())
  await page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'menu'
  })
}
async function clickTile(page, label) {
  const ok = await page.evaluate((label) => {
    const tiles = [...document.querySelectorAll('#sheet .gtile')]
    const t = tiles.find((el) => {
      const g = el.querySelector('.glbl')
      const text = (g && g.textContent) || el.textContent || ''
      return text.trim() === label
    })
    if (!t) return false
    t.click()
    return true
  }, label)
  return ok
}
async function go(page, panel) {
  await openMenu(page)
  const label = panel === 'world' ? 'World' : panel
  eq(await clickTile(page, label), 'open ' + label)
  await page.waitForFunction((id) => document.getElementById('sheet').dataset.panel === id, {}, panel === 'world' ? 'world' : panel)
}

function inkScript() {
  return `(function ink(canvas){
    if (!canvas || canvas.tagName !== 'CANVAS') return 0
    try {
      const data = canvas.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, canvas.width, canvas.height).data
      let n = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) n++
      return n
    } catch (e) { return -1 }
  })`
}

async function artIn(page, root) {
  return page.evaluate((root, keys, inkFn) => {
    const ink = eval(inkFn)
    const out = {}
    for (const key of keys) {
      const bag = window.__blocks.bag()
      const i = bag.findIndex((s) => s && s.item === key)
      const slot = i < 0 ? null : document.querySelector(root + ' [data-slot="' + i + '"]')
      const canvas = slot && slot.querySelector('canvas[data-kind="wrap"]')
      out[key] = { i, kind: canvas ? canvas.dataset.kind : '', ink: ink(canvas), wrap: canvas ? canvas.dataset.wrap || canvas.dataset.item || '' : '' }
    }
    const berry = document.querySelector(root + ' [data-slot="0"] canvas')
    out._node = berry ? 1 : 0
    return out
  }, root, ART, inkScript())
}

const teacher = await browser.newPage()
teacher.setDefaultTimeout(90000)
const ui = await boot(teacher, true, '')

await teacher.evaluate(() => {
  window.__smoke.emptyBag()
  for (const k of ['berry', 'bread', 'floorLamp', 'rug', 'measuringTape']) window.__blocks.give(k, 1)
})
await sleep(200)
const hot = await artIn(teacher, '#hotbar')
for (const k of ART) eq(hot[k] && hot[k].kind === 'wrap' && hot[k].ink > 0 && hot[k].wrap === k, 'hotbar ' + k + ' ' + JSON.stringify(hot[k]))

await teacher.evaluate(() => document.querySelector('#hotbar [data-bag="1"]').click())
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'inventory')
await sleep(150)
const bag = await artIn(teacher, '#sheet[data-panel="inventory"]')
for (const k of ART) eq(bag[k] && bag[k].kind === 'wrap' && bag[k].ink > 0, 'bag ' + k + ' ' + JSON.stringify(bag[k]))
const distinct = await teacher.evaluate(() => {
  const a = document.querySelector('#hotbar [data-slot="0"] canvas')
  const b = document.querySelector('#sheet[data-panel="inventory"] [data-slot="0"] canvas')
  return !!(a && b && a !== b)
})
eq(distinct, 'hotbar and bag do not share one canvas')
await teacher.evaluate(() => { const x = document.getElementById('sheet-x'); if (x) x.click() })

await teacher.evaluate(() => document.getElementById('save-btn').click())
await teacher.waitForFunction(() => /Saved|Збережено|Сохранено|Guardado/.test((document.getElementById('toast') || {}).textContent || ''), { timeout: 20000 })
await teacher.reload({ waitUntil: 'domcontentloaded', timeout: 90000 })
await ready(teacher)
const again = await artIn(teacher, '#hotbar')
for (const k of ART) eq(again[k] && again[k].kind === 'wrap' && again[k].ink > 0, 'reload hotbar ' + k + ' ' + JSON.stringify(again[k]))

const cell = await teacher.evaluate(() => {
  const spots = [[80, 8, 80], [90, 8, 90], [70, 10, 40], [110, 8, 20]]
  for (const [x, y, z] of spots) {
    const id = window.__blocks.getVoxel(x, y, z)
    if (id !== 3) return { x, y, z, id }
  }
  return null
})
eq(!!cell && cell.id !== 3, 'marker cell ' + JSON.stringify(cell))

await openMenu(teacher)
eq(await clickTile(teacher, 'World'), 'world tile')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
const worldLabels = await teacher.evaluate(() => [...document.querySelectorAll('#sheet .glbl')].map((n) => n.textContent))
eq(worldLabels.includes('Backups'), 'teacher sees Backups')
eq(worldLabels.includes('Class snapshot'), 'teacher sees Class snapshot')
eq(await clickTile(teacher, 'Backups'), 'backups tile')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'backups')
await teacher.waitForSelector('#backup-name')
const cloud = await teacher.evaluate(() => (document.querySelector('[data-cloud-note]') || {}).textContent || '')
eq(/cloud copy is a later step/i.test(cloud), 'cloud note ' + cloud)

await teacher.evaluate(() => { const el = document.getElementById('backup-name'); el.focus(); el.value = '' })
await teacher.keyboard.type('Lesson one')
await teacher.evaluate(() => document.getElementById('backup-save').click())
await teacher.waitForFunction(() => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === 'Lesson one'), { timeout: 60000 })
eq(true, 'named backup Lesson one')

for (const [w, h, name] of [[412, 800, '412'], [915, 412, '915x412'], [1366, 768, '1366']]) {
  await teacher.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await sleep(150)
  const box = await teacher.evaluate(() => {
    const body = document.getElementById('sheet-body')
    const input = document.getElementById('backup-name')
    const r = input ? input.getBoundingClientRect() : null
    return {
      overflow: body ? body.scrollWidth - body.clientWidth : 99,
      iw: r ? Math.round(r.width) : 0,
      ih: r ? Math.round(r.height) : 0,
    }
  })
  eq(box.iw >= 40 && box.ih >= 36, name + ' name field ' + JSON.stringify(box))
  eq(box.overflow <= 8, name + ' no sideways spill ' + box.overflow)
}
await teacher.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })

await teacher.evaluate((c) => window.__blocks.setVoxel(c.x, c.y, c.z, 3), cell)
await teacher.evaluate(() => document.getElementById('save-btn').click())
await teacher.waitForFunction(() => /Saved|Збережено|Сохранено|Guardado/.test((document.getElementById('toast') || {}).textContent || ''), { timeout: 20000 })
const placed = await teacher.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell)
eq(placed === 3, 'placed stone ' + placed)

await openMenu(teacher)
await clickTile(teacher, 'World')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
await clickTile(teacher, 'Backups')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'backups')
await teacher.waitForFunction(() => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === 'Lesson one'))
ui.setMode('accept')
eq(await teacher.evaluate(() => {
  const row = [...document.querySelectorAll('[data-backup]')].find((r) => ((r.querySelector('[data-backup-name]') || {}).textContent || '') === 'Lesson one')
  const b = row && row.querySelector('[data-act="restore"]')
  if (!b) return false
  b.click()
  return true
}), 'restore Lesson one')
await teacher.waitForFunction((c) => window.__blocks.getVoxel(c.x, c.y, c.z) === c.id, { timeout: 40000 }, cell)
eq(true, 'restore removed the block')
await teacher.waitForFunction(() => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent.indexOf('Before restore') === 0), { timeout: 20000 })
eq(true, 'Before restore backup exists')

const beforeRows = await teacher.evaluate(() => [...document.querySelectorAll('[data-backup-name]')].filter((n) => n.textContent.indexOf('Before restore') === 0).length)
ui.setMode('accept')
eq(await teacher.evaluate(() => {
  const row = [...document.querySelectorAll('[data-backup]')].find((r) => ((r.querySelector('[data-backup-name]') || {}).textContent || '').indexOf('Before restore') === 0)
  const b = row && row.querySelector('[data-act="restore"]')
  if (!b) return false
  b.click()
  return true
}), 'restore Before restore')
await teacher.waitForFunction((c, n) => {
  const names = [...document.querySelectorAll('[data-backup-name]')].filter((el) => el.textContent.indexOf('Before restore') === 0)
  return window.__blocks.getVoxel(c.x, c.y, c.z) === 3 && names.length > n
}, { timeout: 40000 }, cell, beforeRows)
eq(true, 'Before restore brought the block back')

await openMenu(teacher)
eq(await clickTile(teacher, 'World'), 'world for class snapshot')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile(teacher, 'Class snapshot'), 'class snapshot tap')
await teacher.waitForFunction(() => /Backup saved/.test((document.getElementById('toast') || {}).textContent || ''), { timeout: 20000 })
eq(await clickTile(teacher, 'Backups'), 'back to backups')
await teacher.waitForFunction(() => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent.indexOf('Class - ') === 0), { timeout: 20000 })
eq(true, 'class snapshot appears')

const sample = await teacher.evaluate(() => {
  const n = document.querySelector('[data-backup-name]')
  return n ? n.textContent : ''
})
ui.setMode('dismiss')
const beforeN = ui.dialogs.length
eq(await teacher.evaluate((name) => {
  const row = [...document.querySelectorAll('[data-backup]')].find((r) => ((r.querySelector('[data-backup-name]') || {}).textContent || '') === name)
  const b = row && row.querySelector('[data-act="delete"]')
  if (!b) return false
  b.click()
  return true
}, sample), 'delete click')
await sleep(300)
eq(ui.dialogs.length > beforeN && /Delete this backup/.test(ui.dialogs[ui.dialogs.length - 1] || ''), 'delete asks once ' + (ui.dialogs[ui.dialogs.length - 1] || ''))
const still = await teacher.evaluate((name) => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === name), sample)
eq(still, 'dismiss keeps the backup')

async function acceptDelete(page) {
  ui.setMode('accept')
  const id = await page.evaluate(() => {
    const row = document.querySelector('[data-backup]')
    const b = row && row.querySelector('[data-act="delete"]')
    if (!row || !b) return ''
    const gone = row.getAttribute('data-backup') || ''
    b.click()
    return gone
  })
  if (!id) return ''
  try {
    await page.waitForFunction((gone) => {
      if (!document.getElementById('backup-name')) return false
      const rows = [...document.querySelectorAll('[data-backup]')]
      if (rows.some((r) => r.getAttribute('data-backup') === gone)) return false
      if (document.querySelector('[data-backup-empty]')) return true
      return rows.length > 0
    }, { timeout: 20000 }, id)
  } catch (e) {
    const snap = await page.evaluate((gone) => ({
      panel: (document.getElementById('sheet') || {}).dataset ? document.getElementById('sheet').dataset.panel : '',
      names: [...document.querySelectorAll('[data-backup-name]')].map((n) => n.textContent),
      ids: [...document.querySelectorAll('[data-backup]')].map((n) => n.getAttribute('data-backup')),
      empty: !!document.querySelector('[data-backup-empty]'),
      toast: (document.getElementById('toast') || {}).textContent || '',
      input: !!document.getElementById('backup-name'),
      gone,
    }), id)
    console.log('delete wait snap ' + JSON.stringify(snap))
    throw e
  }
  return id
}

const dropped = await acceptDelete(teacher)
eq(!!dropped, 'delete removed a backup')
eq(await teacher.evaluate((name) => ![...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === name), sample), 'accepted delete removed ' + sample)
for (let guard = 0; guard < 20; guard++) {
  const left = await teacher.evaluate(() => document.querySelectorAll('[data-backup]').length)
  if (!left) break
  const id = await acceptDelete(teacher)
  if (!id) break
}
eq(await teacher.evaluate(() => document.querySelectorAll('[data-backup]').length) === 0, 'backups cleared')

for (let i = 1; i <= 11; i++) {
  const name = 'Pad ' + String(i).padStart(2, '0')
  await teacher.waitForSelector('#backup-name')
  await teacher.evaluate((name) => {
    const el = document.getElementById('backup-name')
    el.focus()
    el.value = name
  }, name)
  await teacher.evaluate(() => document.getElementById('backup-save').click())
  await teacher.waitForFunction((name) => [...document.querySelectorAll('[data-backup-name]')].some((n) => n.textContent === name), { timeout: 60000 }, name)
}
const kept = await teacher.evaluate(() => [...document.querySelectorAll('[data-backup-name]')].map((n) => n.textContent))
eq(kept.length === 10, '11 backups -> 10 kept ' + kept.length)
eq(!kept.includes('Pad 01') && kept.includes('Pad 11'), 'newest kept oldest dropped ' + kept.join(','))

const kidCtx = await browser.createBrowserContext()
const kid = await kidCtx.newPage()
kid.setDefaultTimeout(90000)
const kidUi = await boot(kid, false, '')
await openMenu(kid)
await clickTile(kid, 'World')
await kid.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
const kidLabels = await kid.evaluate(() => [...document.querySelectorAll('#sheet .glbl')].map((n) => n.textContent))
eq(!kidLabels.includes('Backups') && !kidLabels.includes('Class snapshot'), 'kid sees no tile ' + kidLabels.join('|'))
eq(!kidUi.errs.length, 'kid console ' + kidUi.errs.join(' | '))

await openMenu(teacher)
await clickTile(teacher, 'World')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
await teacher.evaluate((c) => window.__blocks.setVoxel(c.x, c.y, c.z, 3), cell)
ui.setMode('dismiss')
const freshAsk = ui.dialogs.length
eq(await clickTile(teacher, 'Fresh world'), 'fresh tile')
await sleep(400)
eq(ui.dialogs.length > freshAsk && /fresh world/i.test(ui.dialogs[ui.dialogs.length - 1] || ''), 'fresh asks first ' + (ui.dialogs[ui.dialogs.length - 1] || ''))
eq(await teacher.evaluate((c) => window.__blocks.getVoxel(c.x, c.y, c.z), cell) === 3, 'cancel leaves the block')
ui.setMode('accept')
eq(await clickTile(teacher, 'Fresh world'), 'fresh confirm')
await teacher.waitForFunction((c) => window.__blocks.getVoxel(c.x, c.y, c.z) !== 3, { timeout: 40000 }, cell)
eq(true, 'fresh world cleared the block')
await teacher.waitForFunction(() => [...document.querySelectorAll('#sheet .glbl')].some((n) => n.textContent === 'Open my old world'), { timeout: 20000 })
eq(await clickTile(teacher, 'Open my old world'), 'open old tile')
await teacher.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'oldworlds')
const dated = await teacher.evaluate(() => {
  const b = [...document.querySelectorAll('#sheet .gtile')].find((el) => /Open · \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(((el.querySelector('.glbl') || {}).textContent || '')))
  if (!b) return ''
  const text = b.querySelector('.glbl').textContent
  b.click()
  return text
})
eq(/Open · \d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(dated), 'old world has a time ' + dated)
await teacher.waitForFunction((c) => window.__blocks.getVoxel(c.x, c.y, c.z) === 3, { timeout: 40000 }, cell)
eq(true, 'old world reopened')

const arCtx = await browser.createBrowserContext()
const ar = await arCtx.newPage()
ar.setDefaultTimeout(90000)
const arUi = await boot(ar, true, 'ar')
eq(await ar.evaluate(() => document.documentElement.dir) === 'rtl', 'arabic rtl')
await openMenu(ar)
await clickTile(ar, 'العالم')
await ar.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'world')
eq(await clickTile(ar, 'نسخ'), 'arabic backups tile')
await ar.waitForFunction(() => document.getElementById('sheet').dataset.panel === 'backups')
await ar.setViewport({ width: 412, height: 800, deviceScaleFactor: 1 })
await sleep(150)
const arFit = await ar.evaluate(() => {
  const body = document.getElementById('sheet-body')
  const input = document.getElementById('backup-name')
  const r = input ? input.getBoundingClientRect() : null
  return { dir: document.documentElement.dir, overflow: body ? body.scrollWidth - body.clientWidth : 99, iw: r ? Math.round(r.width) : 0, title: (document.getElementById('sheet-title') || {}).textContent || '' }
})
eq(arFit.dir === 'rtl' && arFit.title === 'نسخ' && arFit.iw >= 40 && arFit.overflow <= 8, 'arabic 412 ' + JSON.stringify(arFit))
await ar.setViewport({ width: 1366, height: 768, deviceScaleFactor: 1 })
eq(!arUi.errs.length, 'arabic console ' + arUi.errs.join(' | '))

eq(!ui.errs.length, 'console ' + ui.errs.join(' | '))
if (fail.length) {
  console.error('backups-check FAIL ' + fail.length)
  process.exitCode = 1
} else console.log('backups-check ok')
await browser.close()
server.close()
process.exit(process.exitCode || 0)
