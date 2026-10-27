import { readdirSync } from 'fs'
import { spawnSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const files = readdirSync(here).filter((name) => /^classnet-.*-check\.mjs$/.test(name)).sort()
if (!files.length) {
  console.error('classnet-all: no checks')
  process.exit(1)
}
for (const name of files) {
  const run = spawnSync(process.execPath, [path.join(here, name)], { stdio: 'inherit' })
  const ok = run.status === 0
  console.log(name, ok ? 'ok' : 'FAIL')
  if (!ok) process.exit(run.status || 1)
}
