// Version gate: for each app a PR touches, the built/served version must be one the registry allows.
// Usage: node tools/proof/version-check.mjs <base-ref>   (e.g. origin/main)
// Version is read from <path>index.html data-version="…", else <path>version.js / app.js (prefix + x.y.z).
import { execSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'

const base = process.argv[2] || 'origin/main'
const reg = JSON.parse(readFileSync(new URL('./version-registry.json', import.meta.url)))
const touched = execSync(`git diff --name-only ${base}...HEAD`).toString().split('\n').filter(Boolean)
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function versionOf(app) {
  const idx = app.path + 'index.html'
  if (existsSync(idx)) {
    const m = readFileSync(idx, 'utf8').match(/data-version="([^"]+)"/)
    if (m) return { v: m[1].replace(new RegExp('^' + esc(app.prefix)), ''), from: idx }
  }
  for (const f of ['version.js', 'app.js']) {
    const file = app.path + f
    if (!existsSync(file)) continue
    const m = readFileSync(file, 'utf8').match(new RegExp(esc(app.prefix) + '(\\d+\\.\\d+\\.\\d+)'))
    if (m) return { v: m[1], from: file }
  }
  return null
}

let bad = 0
for (const [id, app] of Object.entries(reg.apps)) {
  const roots = [app.path, ...(app.also || [])]
  if (!touched.some((f) => roots.some((r) => f.startsWith(r)))) continue
  const got = versionOf(app)
  if (!got) { console.log(`WARN ${id}: no version found under ${app.path}`); continue }
  const ok = app.allowed.includes(got.v)
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${id}: ${got.v} (${got.from}) ${ok ? '' : 'not in registry; live ' + app.live}`)
  if (!ok) bad++
}
if (!bad) console.log('version-check: pass')
process.exit(bad ? 1 : 0)
