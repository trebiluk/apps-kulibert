// Top bar digital theme: fit, clicks, contrast, rotate. Screenshots stay out of git.
import { existsSync, mkdirSync, readFileSync } from 'fs'
import { spawnSync } from 'child_process'
import { createServer } from 'http'
import { readFile } from 'fs/promises'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
import puppeteer from 'puppeteer-core'

const fail = []
function eq(ok, msg, extra) {
  if (!ok) fail.push(extra ? msg + ' ' + extra : msg)
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + msg + (extra ? ' ' + extra : ''))
}

const __dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dir, '../..')
const version = JSON.parse(readFileSync(path.join(__dir, '../package.json'), 'utf8')).version
const port = 8917
const shots = '/workspace/artifacts/topbar-shots'
mkdirSync(shots, { recursive: true })
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml', '.txt': 'text/plain' }
const chrome = [
  '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell',
  '/opt/pw-browsers/chromium-1148/chrome-linux/chrome',
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

async function openPage(w, h) {
  const page = await browser.newPage()
  page.setDefaultTimeout(20000)
  const errs = []
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|404|Failed to load/.test(m.text())) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
  await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 })
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {}, notes: [] })) } catch (e) {}
    try { localStorage.setItem('bloxbert-fps', 'on') } catch (e) {}
    try { localStorage.removeItem('bloxbert-energy') } catch (e) {}
    try { localStorage.removeItem('bloxbert-teacher') } catch (e) {}
  })
  return { page, errs }
}
async function boot(page) {
  await page.goto('http://127.0.0.1:' + port + '/blocks-test/?smoke=1&auto=0', { waitUntil: 'domcontentloaded', timeout: 90000 })
  await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 90000 })
  await page.waitForFunction(() => {
    const bar = document.getElementById('energy-bar')
    const plate = document.querySelector('.tb-plate canvas.kd-word')
    return bar && bar.querySelectorAll('span').length === 10 && plate && document.getElementById('ver-plate')
  }, { timeout: 20000 })
  await page.evaluate(() => { try { window.__blocks.noa.setPaused(false) } catch (e) {} })
  await sleep(200)
}
async function press(page, sel) {
  // Pointer lock sends the OS click to the canvas. The game already retargets HUD clicks
  // with a synthetic MouseEvent, so fire that same click on the control.
  await page.evaluate((s) => {
    try { if (window.__quietUnlock) window.__quietUnlock() } catch (e) {}
    const el = document.querySelector(s)
    if (!el) return
    const r = el.getBoundingClientRect()
    const opt = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + Math.min(r.height / 2, 20), button: 0 }
    el.dispatchEvent(new PointerEvent('pointerdown', opt))
    el.dispatchEvent(new MouseEvent('click', opt))
  }, sel)
}
async function shot(page, name) {
  const file = shots + '/' + name + '.png'
  const clip = await page.evaluate(() => {
    const r = document.querySelector('header.top').getBoundingClientRect()
    return { h: Math.ceil(r.bottom + 36) }
  })
  const vp = page.viewport()
  const height = Math.max(80, Math.min(vp.height - 1, clip.h))
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: vp.width, height } })
  return file
}

const MEASURE = () => {
  const lin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
  const rgb = (s) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null }
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
  const contrast = (a, b) => { if (!a || !b) return 0; const L1 = lum(a), L2 = lum(b); const hi = Math.max(L1, L2), lo = Math.min(L1, L2); return (hi + 0.05) / (lo + 0.05) }
  const top = document.querySelector('header.top')
  const pr = top.getBoundingClientRect()
  const kids = [...top.children].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.id || el.className, top: Math.round(r.top - pr.top), w: Math.round(r.width), h: Math.round(r.height), hid: !!el.hidden }
  }).filter((k) => !k.hid && k.w > 2 && k.h > 2)
  const boxes = [...document.querySelectorAll('.top button, #wallet-chip, #mode-pill button, #ver-plate')].map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.id || el.className, w: Math.round(r.width), h: Math.round(r.height) }
  }).filter((b) => b.w > 0)
  const pair = (sel, textSel) => {
    const el = document.querySelector(sel)
    if (!el) return { sel, c: 0 }
    const text = textSel ? el.querySelector(textSel) : el
    const fg = rgb(getComputedStyle(text || el).color)
    const bg = rgb(getComputedStyle(el).backgroundColor)
    return { sel, c: Math.round(contrast(fg, bg) * 100) / 100, fg, bg }
  }
  const pairs = [
    pair('#menu-btn'),
    pair('#mode-survival'),
    pair('#mode-creative'),
    pair('#undo-btn', '.tl'),
    pair('#save-btn', '.tl'),
    pair('#ver-plate'),
    pair('#wallet-chip'),
    pair('#mode-chip'),
    pair('#perf'),
    pair('.top small.tb-lcd'),
  ]
  const btn = document.getElementById('save-btn')
  btn.focus()
  const o = getComputedStyle(btn)
  const canvas = document.querySelector('.tb-plate canvas.kd-word')
  const g = canvas.getContext('2d', { willReadFrequently: true })
  const data = g.getImageData(0, 0, canvas.width, canvas.height).data
  let teal = 0, orange = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], gv = data[i + 1], b = data[i + 2], a = data[i + 3]
    if (a < 200) continue
    if (gv > 220 && b > 190 && r < 180) teal++
    if (r > 220 && gv > 120 && gv < 210 && b < 140) orange++
  }
  const order = [...top.children].map((el) => el.id || (el.className || '').split(' ')[0])
  const undoTl = document.querySelector('#undo-btn .tl')
  const tlBox = undoTl.getBoundingClientRect()
  let kb = false
  for (const sheet of document.styleSheets) {
    let rules
    try { rules = sheet.cssRules } catch (e) { continue }
    for (const rule of rules) {
      if (rule.selectorText && rule.selectorText.indexOf('data-kb-bar') !== -1 && rule.selectorText.indexOf('.top') !== -1 && rule.style && rule.style.top === '48px') kb = true
    }
  }
  return {
    overflow: top.scrollWidth - top.clientWidth,
    kids,
    row: kids.length ? Math.max(...kids.map((k) => k.top)) - Math.min(...kids.map((k) => k.top)) : 99,
    boxes,
    small: boxes.filter((b) => b.w < 43 || b.h < 43),
    pairs,
    focus: { style: o.outlineStyle, width: o.outlineWidth, color: o.outlineColor },
    teal, orange,
    order,
    ver: document.getElementById('ver-plate').textContent.trim(),
    undo: document.querySelector('#undo-btn .tl').textContent,
    redo: document.querySelector('#redo-btn .tl').textContent,
    save: document.querySelector('#save-btn .tl').textContent,
    undoIcon: !!document.querySelector('#undo-btn .ti canvas'),
    redoIcon: !!document.querySelector('#redo-btn .ti canvas'),
    saveIcon: !!document.querySelector('#save-btn .ti canvas[data-icon="floppy"]'),
    emoji: /↶|↷|⬇|⚙/.test(document.querySelector('.tools').textContent),
    wallet: (document.getElementById('wallet-chip').textContent || '').replace(/\s+/g, ' ').trim(),
    modeS: document.getElementById('mode-survival').textContent.trim(),
    modeC: document.getElementById('mode-creative').textContent.trim(),
    pressed: document.getElementById('mode-survival').getAttribute('aria-pressed'),
    energyOn: document.querySelectorAll('#energy-bar span.on').length,
    energyBg: getComputedStyle(document.getElementById('energy-bar')).backgroundColor,
    bolt: getComputedStyle(document.querySelector('#energy-bar span.on'), '::before').backgroundColor,
    tlW: Math.round(tlBox.width),
    barBg: getComputedStyle(top).backgroundColor,
    barEdge: getComputedStyle(top).borderBottomColor,
    perfHidden: document.getElementById('perf').hidden,
    kb,
    saved: document.getElementById('save-btn').classList.contains('saved'),
  }
}

function paintOk(files) {
  const py = spawnSync('python3', ['-c', `
from PIL import Image
import json, sys
files = json.loads(sys.argv[1])
out = {}
for name, f in files.items():
    im = Image.open(f).convert('RGB')
    w,h = im.size
    orange = teal = navy = 0
    step = 3
    for y in range(0, h, step):
        for x in range(0, w, step):
            r,g,b = im.getpixel((x,y))
            if r > 220 and 100 < g < 210 and b < 130: orange += 1
            if r < 80 and g > 160 and b > 140: teal += 1
            if r < 30 and 10 < g < 40 and 30 < b < 70: navy += 1
    out[name] = {'orange': orange, 'teal': teal, 'navy': navy, 'size': [w, h]}
print(json.dumps(out))
`, JSON.stringify(files)], { encoding: 'utf8' })
  let pix = {}
  try { pix = JSON.parse(py.stdout || '{}') } catch (e) { pix = {} }
  return { ok: py.status === 0, pix, err: (py.stderr || '').slice(0, 200) }
}

let wide, mid, phone, tall, spin
try {
  wide = await openPage(1366, 768)
  await boot(wide.page)
  const wideM = await wide.page.evaluate(MEASURE)
  eq(wideM.overflow <= 1, '1366 no overflow', String(wideM.overflow))
  eq(wideM.row < 22, '1366 one row', JSON.stringify(wideM.kids))
  eq(wideM.small.length === 0, '1366 targets', JSON.stringify(wideM.small))
  eq(wideM.tlW > 8, '1366 tool labels', String(wideM.tlW))
  const wideShot = await shot(wide.page, '1366x768')
  eq(wide.errs.length === 0, '1366 console', wide.errs.slice(0, 3).join(' | '))

  mid = await openPage(1024, 576)
  await boot(mid.page)
  const midM = await mid.page.evaluate(MEASURE)
  eq(midM.overflow <= 1, '1024 no overflow', String(midM.overflow) + ' ' + JSON.stringify(midM.kids))
  eq(midM.row < 22, '1024 one row', JSON.stringify(midM.kids))
  eq(midM.small.length === 0, '1024 targets', JSON.stringify(midM.small))
  eq(midM.tlW > 8, '1024 tool labels', String(midM.tlW))
  const midShot = await shot(mid.page, '1024x576')
  eq(mid.errs.length === 0, '1024 console', mid.errs.slice(0, 3).join(' | '))

  phone = await openPage(915, 412)
  await boot(phone.page)
  const phoneM = await phone.page.evaluate(MEASURE)
  eq(phoneM.overflow <= 1, '915 no overflow', String(phoneM.overflow) + ' ' + JSON.stringify(phoneM.kids))
  eq(phoneM.row < 22, '915 one row', JSON.stringify(phoneM.kids))
  eq(phoneM.small.length === 0, '915 targets', JSON.stringify(phoneM.small))
  eq(phoneM.tlW < 2, '915 labels kept clipped', phoneM.undo + ' w=' + phoneM.tlW)
  const phoneShot = await shot(phone.page, '915x412')
  eq(phone.errs.length === 0, '915 console', phone.errs.slice(0, 3).join(' | '))

  tall = await openPage(412, 915)
  await boot(tall.page)
  const tallM = await tall.page.evaluate(MEASURE)
  eq(tallM.overflow <= 1, '412 no overflow', String(tallM.overflow) + ' ' + JSON.stringify(tallM.kids))
  eq(tallM.small.length === 0, '412 targets', JSON.stringify(tallM.small))
  eq(tallM.barBg === wideM.barBg, '412 themed bar', tallM.barBg)
  const tallShot = await shot(tall.page, '412x915')
  eq(tall.errs.length === 0, '412 console', tall.errs.slice(0, 3).join(' | '))

  const pix = paintOk({ '1366x768': wideShot, '1024x576': midShot, '915x412': phoneShot, '412x915': tallShot })
  eq(pix.ok, 'shot decode', pix.err)
  for (const name of ['1366x768', '1024x576', '915x412', '412x915']) {
    const p = pix.pix[name] || {}
    eq(p.orange > 4 && p.teal > 4 && p.navy > 8, name + ' theme pixels', JSON.stringify(p))
  }
  await mid.page.close()
  await phone.page.close()
  await tall.page.close()

  const look = wideM
  eq(look.ver === version, 'version chip', look.ver + ' vs ' + version)
  eq(look.order.slice(0, 6).join(',') === 'menu-btn,mode-pill,brand,mode-chip,wallet-chip,tools', 'control order', look.order.join(','))
  eq(look.modeS === 'Survival' && look.modeC === 'Creative' && look.pressed === 'true', 'mode labels', look.modeS + '/' + look.modeC)
  eq(look.undo === 'Undo' && look.redo === 'Redo' && look.save === 'Save', 'tool labels', [look.undo, look.redo, look.save].join('/'))
  eq(look.undoIcon && look.redoIcon && look.saveIcon && !look.emoji, 'pixel icons')
  eq(/\d+\s+practice/.test(look.wallet) && look.wallet.indexOf('⚙') === -1, 'practice chip', look.wallet)
  eq(look.teal > 8 && look.orange > 8, 'BERTOPIA colours', look.teal + '/' + look.orange)
  eq(look.energyOn === 10, 'energy bolts', String(look.energyOn))
  eq(look.energyBg === 'rgb(7, 16, 24)', 'energy strip', look.energyBg)
  eq(/255,\s*138,\s*31/.test(look.bolt), 'bolt accent', look.bolt)
  eq(look.barBg === 'rgb(10, 20, 40)', 'navy bar', look.barBg)
  eq(/45,\s*212,\s*191/.test(look.barEdge), 'teal edge', look.barEdge)
  eq(look.perfHidden === false, 'fps chip shown')
  eq(look.kb, 'hub ribbon offset kept')
  eq(!look.saved, 'save tick hidden before save')
  for (const pair of look.pairs) eq(pair.c >= 4.5, 'contrast ' + pair.sel, JSON.stringify(pair))
  const focusRgb = /rgba?\((\d+)/.exec(look.focus.color || '')
  eq(look.focus.style === 'solid' && parseFloat(look.focus.width) >= 2 && focusRgb && +focusRgb[1] > 180, 'focus ring', JSON.stringify(look.focus))

  await press(wide.page, '#menu-btn')
  await wide.page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'menu'
  })
  const menu = await wide.page.evaluate(() => {
    const s = document.getElementById('sheet')
    const panel = s.querySelector('.kd-panel')
    const cs = panel ? getComputedStyle(panel) : null
    return {
      groups: [...s.querySelectorAll('[data-group]')].map((g) => g.dataset.group),
      plate: !!s.querySelector('.kd-plate canvas'),
      chip: !!s.querySelector('.kd-chip'),
      border: cs ? cs.borderTopColor : '',
      width: cs ? cs.borderTopWidth : '',
      tb: !!s.querySelector('.tb-plate,.tb-lcd'),
    }
  })
  eq(menu.groups.indexOf('play') !== -1 && menu.groups.indexOf('world') !== -1 && menu.groups.indexOf('make') !== -1 && menu.groups.indexOf('settings') !== -1, 'menu groups', menu.groups.join(','))
  eq(menu.plate && menu.chip && !menu.tb, 'menu plate unchanged')
  eq(/45,\s*212,\s*191/.test(menu.border) && parseFloat(menu.width) >= 2, 'menu teal frame', menu.border + ' ' + menu.width)
  await press(wide.page, '#sheet-x')
  await wide.page.waitForFunction(() => document.getElementById('sheet').hidden)

  await press(wide.page, '#mode-creative')
  await wide.page.waitForFunction(() => document.body.classList.contains('mode-creative') && document.getElementById('mode-creative').getAttribute('aria-pressed') === 'true' && document.getElementById('energy-bar').hidden)
  await press(wide.page, '#mode-survival')
  await wide.page.waitForFunction(() => !document.body.classList.contains('mode-creative') && document.getElementById('mode-survival').getAttribute('aria-pressed') === 'true' && !document.getElementById('energy-bar').hidden)

  await press(wide.page, '#ver-plate')
  await wide.page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'log'
  })
  await press(wide.page, '#sheet-x')
  await wide.page.waitForFunction(() => document.getElementById('sheet').hidden)

  await press(wide.page, '#wallet-chip')
  await wide.page.waitForFunction(() => {
    const s = document.getElementById('sheet')
    return s && !s.hidden && s.dataset.panel === 'wallet'
  })
  const walletPanel = await wide.page.evaluate(() => {
    const live = document.querySelector('#sheet[data-panel="wallet"] .balance')
    return live ? live.textContent : ''
  })
  eq(/practice/.test(walletPanel), 'wallet panel still practice', walletPanel.slice(0, 80))
  await press(wide.page, '#sheet-x')
  await wide.page.waitForFunction(() => document.getElementById('sheet').hidden)

  const edited = await wide.page.evaluate(() => {
    const B = window.__blocks
    const p = window.__smoke.pos()
    const x = Math.floor(p[0]) + 3
    const y = Math.floor(p[1])
    const z = Math.floor(p[2])
    const was = B.getVoxel(x, y, z)
    const v = was === 1 ? 2 : 1
    const g = B.applyEdit([[x, y, z, v]])
    return { x, y, z, was, v, ok: !!g, can: !document.getElementById('undo-btn').disabled }
  })
  eq(edited.ok && edited.can, 'undo armed', JSON.stringify(edited))
  await press(wide.page, '#undo-btn')
  await wide.page.waitForFunction((x, y, z, was) => window.__blocks.getVoxel(x, y, z) === was && !document.getElementById('redo-btn').disabled, {}, edited.x, edited.y, edited.z, edited.was)
  await press(wide.page, '#redo-btn')
  await wide.page.waitForFunction((x, y, z, v) => window.__blocks.getVoxel(x, y, z) === v && !document.getElementById('undo-btn').disabled, {}, edited.x, edited.y, edited.z, edited.v)
  eq(true, 'undo redo click')

  await press(wide.page, '#save-btn')
  await wide.page.waitForFunction(() => document.getElementById('save-btn').classList.contains('saved'), { timeout: 15000 })
  eq(true, 'save tick')

  const fx = await wide.page.evaluate(() => {
    const ok = window.__blocks.effects.give('speed', { ms: 60000 })
    const chip = document.querySelector('#fx-strip .fx-chip')
    if (!chip) return { ok, missing: true }
    const s = getComputedStyle(chip)
    const bg = s.backgroundColor
    const color = s.color
    const text = chip.textContent
    const lin = (c) => { c = c / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }
    const rgb = (str) => { const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(str || ''); return m ? [+m[1], +m[2], +m[3]] : null }
    const fg = rgb(color), back = rgb(bg)
    let c = 0
    if (fg && back) {
      const L1 = 0.2126 * lin(fg[0]) + 0.7152 * lin(fg[1]) + 0.0722 * lin(fg[2])
      const L2 = 0.2126 * lin(back[0]) + 0.7152 * lin(back[1]) + 0.0722 * lin(back[2])
      const hi = Math.max(L1, L2), lo = Math.min(L1, L2)
      c = (hi + 0.05) / (lo + 0.05)
    }
    window.__blocks.effects.clear('speed')
    window.__blocks.effects.tick(1000)
    return { ok, bg, color, c: Math.round(c * 100) / 100, text }
  })
  eq(fx.ok && fx.bg === 'rgb(6, 32, 24)' && fx.c >= 4.5 && /Speed/.test(fx.text || ''), 'effect pill', JSON.stringify(fx))

  const dig = await wide.page.evaluate(() => {
    window.__blocks.showDig()
    const chip = document.getElementById('dig-chip')
    if (!chip) return null
    const s = getComputedStyle(chip)
    const r = chip.getBoundingClientRect()
    const out = { cls: chip.className, bg: s.backgroundColor, color: s.color, w: Math.round(r.width), h: Math.round(r.height), text: chip.textContent }
    chip.hidden = true
    return out
  })
  eq(dig && dig.cls.indexOf('tb-lcd') !== -1 && dig.bg === 'rgb(6, 32, 24)' && dig.w >= 43 && dig.h >= 43 && dig.text.length > 0, 'dig pill', JSON.stringify(dig))

  spin = await openPage(915, 412)
  await boot(spin.page)
  const before = await spin.page.evaluate(MEASURE)
  await spin.page.setViewport({ width: 412, height: 915, deviceScaleFactor: 1 })
  await sleep(250)
  const turned = await spin.page.evaluate(MEASURE)
  await spin.page.setViewport({ width: 915, height: 412, deviceScaleFactor: 1 })
  await sleep(250)
  const back = await spin.page.evaluate(MEASURE)
  eq(before.overflow <= 1 && before.row < 22, 'rotate start 915', String(before.overflow) + ' row ' + before.row)
  eq(turned.overflow <= 1, 'rotate portrait', String(turned.overflow) + ' ' + JSON.stringify(turned.kids))
  eq(back.overflow <= 1 && back.row < 22, 'rotate back 915', String(back.overflow) + ' row ' + back.row + ' ' + JSON.stringify(back.kids))
  eq(spin.errs.length === 0, 'rotate console', spin.errs.slice(0, 3).join(' | '))
  eq(wide.errs.length === 0, 'clicks console', wide.errs.slice(0, 4).join(' | '))
} finally {
  try { await browser.close() } catch (e) {}
  try { server.close() } catch (e) {}
}
console.log(fail.length ? 'FAIL ' + fail.length : 'ALL PASS')
process.exit(fail.length ? 1 : 0)
