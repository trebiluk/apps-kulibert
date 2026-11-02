// Menu audit: opens the full home game as the owner, walks every menu panel at 1366 and 412, and lists every
// control with its name, role, state and size. Flags: no accessible name, a toggle with no state, under 44 px,
// hidden overflow, duplicate names in one panel. Writes a JSON + text report to /tmp/home-menu-audit.*
// Usage: node --no-warnings tools/home-menu-audit.mjs   (needs bertopia-home/ built, Playwright)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..', '..')
const BUILT = path.join(REPO, 'bertopia-home', 'index.html')
if (!fs.existsSync(BUILT)) { console.log('home-menu-audit: SKIP — build the home game first (npm run build:home in bloxbert-src)'); process.exit(0) }
let chromium
for (const from of [path.join(REPO, 'bloxbert-src', 'package.json'), import.meta.url, '/usr/lib/node_modules/playwright/package.json']) { try { ({ chromium } = createRequire(from)('playwright')); break } catch (e) {} }
if (!chromium) { console.log('home-menu-audit: SKIP — Playwright missing'); process.exit(0) }

const PORT = 8971, DATA = path.join(os.tmpdir(), 'bt-menu-audit-' + process.pid)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const g = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { cwd: path.join(HERE, '..'), stdio: ['ignore', 'pipe', 'pipe'] })
let glog = ''; g.stdout.on('data', (d) => (glog += d)); g.stderr.on('data', (d) => (glog += d))
for (let i = 0; i < 100 && !/owner page/.test(glog); i++) await sleep(50)
const G = 'http://localhost:' + PORT, key = /k=([0-9a-f]+)/.exec(glog)[1]
const post = (p, b, h) => fetch(G + p, { method: 'POST', headers: { 'content-type': 'application/json', ...(h || {}) }, body: JSON.stringify(b || {}) }).then((r) => r.json())
const token = (await post('/owner/pin', { key, pin: '246810' })).token
const api = (p, b) => post('/owner/' + p, b, { 'x-owner': token })
await api('world/open', { name: 'audit-world-0001' }); await api('session/start', {})

const PANELS = ['menu', 'settings', 'a11y', 'mode', 'world', 'inventory', 'crafting', 'help', 'shop', 'wallet', 'builds', 'goals', 'notebook', 'badges', 'log', 'leave']
const report = { at: new Date().toISOString(), views: {} }
const browser = await chromium.launch()
try {
  for (const [w, h] of [[1366, 768], [412, 915]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } }), pg = await ctx.newPage()
    const errs = []; pg.on('pageerror', (e) => errs.push(String(e)))
    await pg.goto(G + '/join.html'); const own = await api('play', { name: 'Diego' }); await pg.evaluate((t) => sessionStorage.setItem('bt-home-owner-ticket', JSON.stringify(t)), own)
    await pg.goto(G + '/?owner=1&debug=1'); await sleep(9000)
    const view = { errors: errs, panels: {} }
    for (const id of PANELS) {
      await pg.evaluate((id) => window.__bt && window.__bt.openPanel(id), id).catch(() => {})
      await sleep(350)
      const got = await pg.evaluate((id) => {
        const sheet = document.getElementById('sheet'); if (!sheet || sheet.hidden) return { missing: true }
        const body = document.getElementById('sheet-body')
        const name = (el) => (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || '').trim().replace(/\s+/g, ' ')
        const rows = []
        for (const el of body.querySelectorAll('button, input, select, a, [role=radio], [role=switch], [role=checkbox], [role=slider]')) {
          const r = el.getBoundingClientRect(), cs = getComputedStyle(el)
          const visible = !!el.offsetParent && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0
          rows.push({ tag: el.tagName.toLowerCase(), type: el.type || '', role: el.getAttribute('role') || '', name: name(el).slice(0, 80), pressed: el.getAttribute('aria-pressed'), checked: el.getAttribute('aria-checked'), disabled: el.disabled || el.getAttribute('aria-disabled') === 'true', w: Math.round(r.width), h: Math.round(r.height), visible, cls: el.className.toString().slice(0, 40), offRight: visible && r.right > innerWidth + 1, offBottom: visible && r.bottom > innerHeight + 1 && cs.position === 'fixed' })
        }
        return { panel: sheet.dataset.panel, title: (document.getElementById('sheet-title') || {}).textContent, rows, scrollH: body.scrollHeight, clientH: body.clientHeight, overflowX: body.scrollWidth > body.clientWidth + 1 }
      }, id)
      view.panels[id] = got
      await pg.evaluate(() => { const x = document.getElementById('sheet-x'); if (x && !document.getElementById('sheet').hidden) x.click() }).catch(() => {})
      await sleep(150)
    }
    report.views[w] = view
    await ctx.close()
  }
} finally {
  await browser.close(); try { await api('stop') } catch (e) {}
  await sleep(300); if (g.exitCode === null) g.kill(); fs.rmSync(DATA, { recursive: true, force: true })
}
fs.writeFileSync('/tmp/home-menu-audit.json', JSON.stringify(report, null, 1))
// findings
const lines = []
for (const [w, view] of Object.entries(report.views)) {
  lines.push(`== ${w}px  errors: ${view.errors.length}`)
  for (const [id, p] of Object.entries(view.panels)) {
    if (p.missing) { lines.push(`-- ${id}: did not open`); continue }
    const vis = p.rows.filter((r) => r.visible)
    lines.push(`-- ${id} (${p.panel}) "${p.title}": ${vis.length} controls, ${p.rows.length - vis.length} hidden, body ${p.clientH}/${p.scrollH}${p.overflowX ? ' OVERFLOW-X' : ''}`)
    const seen = new Map()
    for (const r of vis) {
      const flags = []
      if (!r.name) flags.push('NO-NAME')
      if (r.h < 44 || r.w < 44) flags.push(`SMALL ${r.w}x${r.h}`)
      if (r.tag === 'button' && !r.role && r.pressed == null && /^(on|off|✓|☑|☐)/i.test(r.name)) flags.push('STATE-IN-TEXT-ONLY')
      if (r.role === 'radio' && r.checked == null) flags.push('RADIO-NO-CHECKED')
      if (r.role === 'switch' && r.checked == null) flags.push('SWITCH-NO-CHECKED')
      if (r.offRight) flags.push('OFF-RIGHT')
      const k = r.name.toLowerCase(); if (k) { if (seen.has(k)) flags.push('DUP-NAME'); seen.set(k, 1) }
      if (flags.length) lines.push(`   ${flags.join(' ')} :: <${r.tag}${r.role ? ' role=' + r.role : ''}> "${r.name}"${r.pressed != null ? ' pressed=' + r.pressed : ''}${r.checked != null ? ' checked=' + r.checked : ''}`)
    }
  }
}
fs.writeFileSync('/tmp/home-menu-audit.txt', lines.join('\n'))
console.log(lines.join('\n'))
