// Proof harness: screenshots + version chip + console errors at two viewports.
// Usage:
//   node tools/proof/run.mjs --url https://apps.kulibert.net --paths /bertopia/,/music/ \
//     [--steps "wait 1500; tap 200,400; key Escape; wait 500"] [--out proof-out]
// Steps run in order after load: `tap x,y` | `key Name` | `wait ms`.
// Viewports: 412x915 phone (dpr 2.625, touch) and 1366x768. Writes <out>/<name>.png and <out>/result.json.
// Browser: CHROME_PATH, else /usr/bin/google-chrome if present, else Playwright's own Chromium.
import { chromium } from 'playwright'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d }
const url = arg('url')
if (!url) { console.error('need --url'); process.exit(2) }
const paths = arg('paths', '/').split(',').map((s) => s.trim()).filter(Boolean)
const steps = arg('steps', 'wait 1500').split(';').map((s) => s.trim()).filter(Boolean)
const out = arg('out', 'proof-out')
mkdirSync(out, { recursive: true })

const VIEWS = [
  { name: '412x915', viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625, isMobile: true, hasTouch: true },
  { name: '1366x768', viewport: { width: 1366, height: 768 } },
]
const CHIP = ['#ver-plate', '#mu-chip', '#app-version', '.kb-plate', '[data-ver]', '.ver', '.plate']

const exe = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
const browser = await chromium.launch(exe ? { executablePath: exe } : {})
const results = []
let failed = false
for (const p of paths) {
  for (const v of VIEWS) {
    const { name, ...opts } = v
    const ctx = await browser.newContext(opts)
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
    page.on('pageerror', (e) => errors.push(String(e && e.message || e)))
    const target = new URL(p, url).href
    let status = null
    try {
      const res = await page.goto(target, { waitUntil: 'load', timeout: 45000 })
      status = res && res.status()
      for (const s of steps) {
        const [cmd, rest = ''] = s.split(/\s+(.*)/)
        if (cmd === 'wait') await page.waitForTimeout(Number(rest) || 0)
        else if (cmd === 'key') await page.keyboard.press(rest)
        else if (cmd === 'tap') {
          const [x, y] = rest.split(',').map(Number)
          if (opts.hasTouch) await page.touchscreen.tap(x, y)
          else await page.mouse.click(x, y)
        } else errors.push('unknown step: ' + s)
      }
    } catch (e) { errors.push('harness: ' + e.message); failed = true }
    const chip = await page.evaluate((sel) => {
      for (const s of sel) {
        for (const el of document.querySelectorAll(s)) {
          const t = (el.textContent || el.getAttribute('data-ver') || '').trim()
          if (t) return { selector: s, text: t }
        }
      }
      return null
    }, CHIP).catch(() => null)
    const file = (p.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'root') + '-' + name + '.png'
    await page.screenshot({ path: join(out, file) }).catch((e) => errors.push('shot: ' + e.message))
    results.push({ url: target, view: name, status, chip, png: file, consoleErrors: errors })
    console.log(name, target, status, chip ? chip.text : '(no chip)', errors.length + ' errors')
    await ctx.close()
  }
}
await browser.close()
writeFileSync(join(out, 'result.json'), JSON.stringify({ at: new Date().toISOString(), steps, results }, null, 2))
process.exit(failed ? 1 : 0)
