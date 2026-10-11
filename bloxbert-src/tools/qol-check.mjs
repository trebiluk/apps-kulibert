// QoL 1: shift-click, stack split, long-press bar, item names. Real clicks.
import { createServer } from 'http'
import { readFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'
import { STR } from '../src/strings.js'
import { EXTRA } from '../src/strings-extra.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
const LANGS = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']
const NAMES = ['planks', 'dyeWhite', 'daisy', 'woodTool']
const fail = []
function note(ok, name, detail) {
  const line = (ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : '')
  console.log(line)
  if (!ok) fail.push(line)
}
for (const lang of LANGS) {
  for (const key of NAMES) {
    const hit = (EXTRA[lang] && EXTRA[lang][key]) || (STR[lang] && STR[lang][key]) || (EXTRA.en && EXTRA.en[key]) || (STR.en && STR.en[key])
    note(!!hit && hit !== key, lang + ' name ' + key, hit || 'missing')
  }
  for (const key of ['qolHalf', 'qolOne', 'qolMove']) {
    const hit = EXTRA[lang] && EXTRA[lang][key]
    note(!!hit && hit !== key, lang + ' ' + key, hit || 'missing')
  }
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.txt': 'text/plain', '.woff2': 'font/woff2' }
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1')
    let file = path.join(root, decodeURIComponent(url.pathname))
    if (file.endsWith('/')) file = path.join(file, 'index.html')
    const buf = await readFile(file)
    res.setHeader('Content-Type', MIME[path.extname(file)] || 'application/octet-stream')
    res.end(buf)
  } catch (e) {
    res.statusCode = 404
    res.end('missing')
  }
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const port = server.address().port
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
const errors = []
page.on('pageerror', (err) => errors.push(String(err)))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })
await mkdir('/tmp/qol-proof', { recursive: true })

async function boot() {
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/index.html?q=lite&nosw=1&smoke=1', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__btOpen, { timeout: 120000 })
  await page.evaluate(() => { window.__smoke.arm(); window.__smoke.emptyBag() })
}
async function bag() {
  return page.evaluate(() => window.__qolState())
}
async function sumKnown() {
  return page.evaluate(() => {
    const items = ['planks', 'dirt', 'log', 'sand', 'glass', 'dyeWhite', 'daisy', 'woodTool']
    const st = window.__qolState()
    let n = st.held ? st.held.n : 0
    for (const s of st.bag) if (s && items.includes(s.item)) n += s.n
    const drops = window.__smoke.drops() || []
    for (const row of drops) {
      const cut = String(row).split(':')
      if (items.includes(cut[0])) n += +cut[1] || 0
    }
    return n
  })
}
async function openPanel(id, key) {
  await page.evaluate((pid, pkey) => window.__btOpen(pid, pkey), id, key || '')
  await page.waitForFunction((pid) => {
    const sheet = document.getElementById('sheet')
    return sheet && !sheet.hidden && sheet.dataset.panel === pid && sheet.dataset.slotsReady !== '0'
  }, { timeout: 8000 }, id)
  await new Promise((r) => setTimeout(r, 80))
}
async function slotBox(sel) {
  const el = await page.$(sel)
  if (!el) return null
  const box = await el.boundingBox()
  return box
}
async function clickSel(sel, opts) {
  const box = await slotBox(sel)
  note(!!box, 'found ' + sel)
  if (!box) return
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  if (opts && opts.shift) await page.keyboard.down('Shift')
  if (opts && opts.button === 'right') await page.mouse.click(x, y, { button: 'right' })
  else await page.mouse.click(x, y)
  if (opts && opts.shift) await page.keyboard.up('Shift')
  await new Promise((r) => setTimeout(r, 80))
}

try {
  await boot()
  await page.evaluate(() => {
    window.__smoke.fillBag('planks', 9)
  })
  await openPanel('inventory')
  const beforeMove = await sumKnown()
  await clickSel('#sheet .well[data-slot="0"]', { shift: true })
  let st = await bag()
  const pocket = st.bag.findIndex((s, i) => i >= 9 && s && s.item === 'planks')
  note(pocket >= 9 && st.bag[0] == null && st.bag[pocket].n === 9, 'shift hotbar to bag', JSON.stringify(st.bag))
  await clickSel('#sheet .well[data-slot="' + pocket + '"]', { shift: true })
  st = await bag()
  note(st.bag[0] && st.bag[0].item === 'planks' && st.bag[0].n === 9 && !st.bag[pocket], 'shift bag to hotbar', JSON.stringify(st.bag[0]))

  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('planks', 5)
    window.__smoke.fillBag('dirt', 64 * 14)
  })
  await openPanel('inventory')
  const fullBefore = await page.evaluate(() => ({ planks: window.__smoke.count('planks'), dirt: window.__smoke.count('dirt') }))
  await clickSel('#sheet .well[data-slot="0"]', { shift: true })
  const fullAfter = await page.evaluate(() => ({
    planks: window.__smoke.count('planks'),
    dirt: window.__smoke.count('dirt'),
    shook: !!document.querySelector('.qol-shake, .well.qol-shake'),
    slot0: window.__qolState().bag[0],
  }))
  note(fullAfter.planks === 5 && fullAfter.dirt === fullBefore.dirt && fullAfter.slot0 && fullAfter.slot0.n === 5, 'full bag no move', JSON.stringify(fullAfter))

  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('planks', 9)
  })
  await openPanel('inventory')
  await clickSel('#sheet .well[data-slot="0"]', { button: 'right' })
  st = await bag()
  note(st.held && st.held.n === 5 && st.bag[0] && st.bag[0].n === 4, 'right-click half of 9', JSON.stringify(st))
  for (let i = 0; i < 3; i++) await clickSel('#sheet .well[data-slot="1"]', { button: 'right' })
  st = await bag()
  note(st.held && st.held.n === 2 && st.bag[1] && st.bag[1].n === 3 && st.bag[0] && st.bag[0].n === 4, 'drop-one x3', JSON.stringify({ held: st.held, a: st.bag[0], b: st.bag[1] }))
  note((await sumKnown()) === 9, 'split keeps 9')

  await page.setViewport({ width: 915, height: 412 })
  await page.evaluate(() => { if (window.__qolReturn) window.__qolReturn({ silent: true }); window.__smoke.emptyBag(); window.__smoke.fillBag('log', 6) })
  await openPanel('inventory')
  const box = await slotBox('#sheet .well[data-slot="0"]')
  note(!!box, 'touch slot')
  if (box) {
    await page.touchscreen.touchStart(box.x + box.width / 2, box.y + box.height / 2)
    await new Promise((r) => setTimeout(r, 500))
    await page.touchscreen.touchEnd()
    await new Promise((r) => setTimeout(r, 80))
  }
  const bar = await page.evaluate(() => {
    const el = document.getElementById('qol-bar')
    if (!el || el.hidden) return null
    const buttons = Array.from(el.querySelectorAll('button')).map((b) => b.dataset.qol + ':' + b.textContent)
    const font = parseFloat(getComputedStyle(el).fontSize)
    return { buttons, font }
  })
  note(!!bar && bar.buttons.some((b) => b.startsWith('half')) && bar.buttons.some((b) => b.startsWith('one')) && bar.buttons.some((b) => b.startsWith('move')), 'long-press bar', JSON.stringify(bar))
  note(!!bar && bar.font >= 14, 'bar 14px', bar && bar.font)
  await page.screenshot({ path: '/tmp/qol-proof/long-press.png' })
  const moveBtn = await page.$('#qol-bar button[data-qol="move"]')
  if (moveBtn) await moveBtn.click()
  await new Promise((r) => setTimeout(r, 100))
  st = await bag()
  note(!!st.bag.slice(9).find((s) => s && s.item === 'log' && s.n === 6) && !st.bag[0], 'long-press Move', JSON.stringify(st.bag))

  await page.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.fillBag('planks', 3); window.__smoke.fillBag('dyeWhite', 2); window.__smoke.fillBag('daisy', 1); window.__smoke.fillBag('woodTool', 1) })
  await openPanel('inventory')
  const labels = []
  let tipShot = false
  for (const sel of ['[data-slot="0"]', '[data-slot="1"]', '[data-slot="2"]', '[data-slot="3"]']) {
    const b = await slotBox('#sheet .well' + sel)
    if (!b) { labels.push('missing'); continue }
    await page.mouse.move(b.x + 4, b.y + 4)
    await new Promise((r) => setTimeout(r, 400))
    const text = await page.evaluate(() => {
      const tip = document.getElementById('qol-tip')
      if (!tip || tip.hidden) return ''
      return tip.textContent
    })
    labels.push(text)
    if (!tipShot && sel === '[data-slot="3"]') {
      await page.screenshot({ path: '/tmp/qol-proof/tooltip.png' })
      tipShot = true
    }
    await page.mouse.move(0, 0)
    await new Promise((r) => setTimeout(r, 40))
  }
  if (!tipShot) await page.screenshot({ path: '/tmp/qol-proof/tooltip.png' })
  note(labels[0].includes('Planks') && !labels[0].includes('planks'), 'tip planks', labels[0])
  note(labels[1].includes('White Dye') || labels[1].includes('Dye'), 'tip dye', labels[1])
  note(labels[2].includes('Daisy'), 'tip flower', labels[2])
  note(/Pickaxe|Wood/.test(labels[3]) && !labels[3].includes('woodTool'), 'tip tool', labels[3])
  const tipPx = await page.evaluate(() => {
    const tip = document.getElementById('qol-tip')
    return tip ? parseFloat(getComputedStyle(tip).fontSize) : 0
  })
  note(tipPx >= 14, 'tip 14px', tipPx)
  const wear = await page.evaluate(() => !!document.querySelector('#qol-tip .qol-wear'))
  note(wear, 'tool durability bar')

  await page.setViewport({ width: 1366, height: 768 })
  await page.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.fillBag('log', 4); window.__smoke.fillBag('sand', 4) })
  await openPanel('station', '8,5,8')
  await clickSel('#sheet .ks-slot[data-ks-bag]', { shift: true })
  const fuel = await page.evaluate(() => ({
    oven: window.__smoke.oven('8,5,8'),
    log: window.__smoke.count('log'),
  }))
  note(fuel.oven && fuel.oven.fuelItem === 'log' && fuel.oven.fuelN === 4 && fuel.log === 0, 'log to fuel', JSON.stringify(fuel))
  const sandBox = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('#sheet .ks-slot[data-ks-bag]'))
    const n = nodes.find((el) => el.dataset.item === 'sand')
    if (!n) return null
    const r = n.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  note(!!sandBox, 'sand slot', sandBox ? 'ok' : 'missing')
  if (sandBox) {
    await page.keyboard.down('Shift')
    await page.mouse.click(sandBox.x, sandBox.y)
    await page.keyboard.up('Shift')
    await new Promise((r) => setTimeout(r, 150))
  }
  const oven = await page.evaluate(() => ({ oven: window.__smoke.oven('8,5,8'), sand: window.__smoke.count('sand') }))
  note(oven.oven && oven.oven.input && oven.oven.input[0] === 'sand' && oven.sand < 4, 'sand to input', JSON.stringify(oven))

  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('glass', 10)
    window.__smoke.glassOut()
  })
  await openPanel('station', '1,5,1')
  const outBox = await page.evaluate(() => {
    const n = document.querySelector('#sheet [data-ks-role="output"]')
    if (!n) return null
    const r = n.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width }
  })
  note(!!outBox && outBox.w > 0, 'output slot', JSON.stringify(outBox))
  if (outBox) {
    await page.keyboard.down('Shift')
    await page.mouse.click(outBox.x, outBox.y)
    await page.keyboard.up('Shift')
    await new Promise((r) => setTimeout(r, 150))
  }
  const merged = await page.evaluate(() => ({
    glass: window.__smoke.count('glass'),
    out: (window.__smoke.oven('1,5,1') || {}).output || null,
  }))
  note(merged.glass === 11 && Array.isArray(merged.out) && merged.out.length === 0, 'output to bag merge', JSON.stringify(merged))

  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('log', 3)
    window.__smoke.fillBag('planks', 5)
  })
  await openPanel('crafting')
  await page.evaluate(() => {
    const tiles = Array.from(document.querySelectorAll('#sheet .well'))
    const hit = tiles.find((b) => !b.classList.contains('result') && (b.textContent || '').includes('Planks'))
    if (hit) hit.click()
  })
  await new Promise((r) => setTimeout(r, 120))
  const result = await page.$('#sheet .well.result')
  if (result) {
    const b = await result.boundingBox()
    if (b) {
      await page.keyboard.down('Shift')
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2)
      await page.keyboard.up('Shift')
      await new Promise((r) => setTimeout(r, 150))
    } else note(false, 'craft result box')
  } else note(false, 'craft result')
  const made = await page.evaluate(() => ({ planks: window.__smoke.count('planks'), log: window.__smoke.count('log'), id: document.getElementById('sheet') && document.getElementById('sheet').dataset.craft }))
  note(made.planks > 5 && made.log < 3, 'output crafts into bag', JSON.stringify(made))

  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('dirt', 6)
    window.__smoke.stash(3, 5, 3, 'dirt', 2)
  })
  await openPanel('box', '3,5,3')
  const bagSlot = await page.evaluate(() => {
    const n = document.querySelector('#sheet [data-ks-inv="bag"][data-item="dirt"]')
    if (!n) return null
    const r = n.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  note(!!bagSlot, 'box bag slot')
  if (bagSlot) {
    await page.keyboard.down('Shift')
    await page.mouse.click(bagSlot.x, bagSlot.y)
    await page.keyboard.up('Shift')
    await new Promise((r) => setTimeout(r, 150))
  }
  const boxed = await page.evaluate(() => ({
    bag: window.__smoke.count('dirt'),
    box: window.__smoke.peekBox(3, 5, 3),
  }))
  note(boxed.bag === 0 && boxed.box && boxed.box.some((row) => row === 'dirt:8'), 'shift bag to chest merge', JSON.stringify(boxed))

  await page.evaluate(() => { window.__smoke.emptyBag(); window.__smoke.fillBag('dirt', 8); window.__smoke.fillBag('planks', 7) })
  await openPanel('inventory')
  const start = await sumKnown()
  for (let i = 0; i < 50; i++) {
    const sel = i % 2 === 0 ? '#sheet .well[data-slot="0"]' : '#sheet .well[data-slot="' + (1 + (i % 8)) + '"]'
    const box = await slotBox(sel)
    if (!box) continue
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2
    if (i % 5 === 0) {
      await page.keyboard.down('Shift')
      await page.mouse.click(x, y)
      await page.keyboard.up('Shift')
    } else if (i % 5 === 1) await page.mouse.click(x, y, { button: 'right' })
    else await page.mouse.click(x, y)
  }
  if (await page.evaluate(() => window.__qolState().held)) {
    await page.evaluate(() => window.__qolReturn({ silent: true }))
  }
  const end = await sumKnown()
  note(start === end, '50 moves keep the count', start + ' -> ' + end)

  await page.setViewport({ width: 915, height: 412 })
  await page.evaluate(() => {
    window.__smoke.emptyBag()
    window.__smoke.fillBag('stone', 4)
  })
  await openPanel('inventory')
  await clickSel('#sheet .well[data-slot="0"]', { button: 'right' })
  st = await bag()
  note(st.held && st.held.n === 2, 'held before rotate', JSON.stringify(st.held))
  await page.setViewport({ width: 412, height: 915 })
  await new Promise((r) => setTimeout(r, 200))
  st = await bag()
  const stone = st.bag.reduce((n, s) => n + (s && s.item === 'stone' ? s.n : 0), 0)
  note(!st.held && stone === 4, 'rotate returns the held stack', JSON.stringify({ held: st.held, stone }))

  await page.setViewport({ width: 1366, height: 768 })
  await page.evaluate(() => {
    window.__smoke.setMeta('3,5,3', null)
    window.__smoke.emptyBag()
    window.__smoke.fillBag('planks', 9)
  })
  await openPanel('inventory')
  await clickSel('#sheet .well[data-slot="0"]', { shift: true })
  const kept = await page.evaluate(async () => {
    const before = window.__qolState().bag.map((s) => (s ? s.item + ':' + s.n : null))
    await window.__smoke.persist()
    return before
  })
  await new Promise((r) => setTimeout(r, 800))
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/index.html?q=lite&nosw=1&smoke=1', { waitUntil: 'domcontentloaded', timeout: 120000 })
  await page.waitForFunction(() => window.__bloxReady && window.__smoke && window.__qolState, { timeout: 120000 })
  const reloaded = await page.evaluate(() => ({
    n: window.__smoke.count('planks'),
    pocket: window.__qolState().bag[9],
  }))
  note(reloaded.n === 9 && reloaded.pocket && reloaded.pocket.item === 'planks' && reloaded.pocket.n === 9, 'reload keeps the result', JSON.stringify({ kept, reloaded }))

  const bad = errors.filter((e) => !/favicon|net::ERR|Failed to load resource/i.test(e))
  note(bad.length === 0, 'no console errors', bad.slice(0, 4).join(' | '))
} catch (err) {
  note(false, 'qol-check threw', String(err && err.stack || err))
}
await browser.close()
server.close()
if (fail.length) {
  console.error(fail.length + ' qol problems')
  process.exit(1)
}
console.log('qol-check ok')
