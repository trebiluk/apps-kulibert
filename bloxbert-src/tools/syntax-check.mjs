// Syntax check every JS file in src/ and build.mjs. Exit 1 on first failure.
import { readdirSync, statSync } from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '..')

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) out.push(...walk(p))
    else if (name.endsWith('.js')) out.push(p)
  }
  return out
}

const files = [...walk(path.join(ROOT, 'src')), path.join(ROOT, 'build.mjs')]
for (const f of files) {
  const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' })
  if (r.status) {
    const msg = (r.stderr || r.stdout || '').trim()
    const rel = path.relative(ROOT, f)
    console.error(`${rel}: ${msg}`)
    process.exit(1)
  }
}
console.log(`syntax-check: ${files.length} files OK`)
