// Bloxbert build. Usage: node build.mjs [--out <dir>]   (default out: ../blocks, the student door)
//   npm run build        -> ../blocks/       (Bloxbert student door, from 2.0.0 on)
//   npm run build:test   -> ../blocks-test/  (test page; leave it until Diego says to remove it)
//   npm run build:dist   -> dist/            (local only, for tools/serve.mjs + tools/measure.mjs)
// The esbuild metafile goes to meta.json here (gitignored), never into the deployed folder.
import { build } from 'esbuild'
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { gzipSync } from 'zlib'
import path from 'path'
import { fileURLToPath } from 'url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
process.chdir(HERE)
const i = process.argv.indexOf('--out')
const OUT = path.resolve(HERE, (i > 0 && process.argv[i + 1]) || process.env.BLOX_OUT || '../blocks')
if (OUT === path.resolve(HERE, '..') || OUT === HERE) throw new Error('refusing to build into the repo root or the source folder')
console.log('out:', OUT)
mkdirSync(OUT + '/assets', { recursive: true })
const STUDENT = path.basename(OUT) === 'blocks'
console.log('student build:', STUDENT, OUT)
await build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: OUT + '/app.js', loader: { '.json': 'json' }, legalComments: 'eof', metafile: true,
  define: { 'process.env.NODE_ENV': '"production"', '__BLOX_STUDENT__': STUDENT ? 'true' : 'false' },
}).then((r) => writeFileSync('meta.json', JSON.stringify(r.metafile)))
cpSync('index.html', OUT + '/index.html')
cpSync('THIRD-PARTY.txt', OUT + '/THIRD-PARTY.txt')
for (const f of ['atlas.png', 'glass.png', 'KENNEY-LICENSE.txt']) cpSync('assets/' + f, OUT + '/assets/' + f)
let raw = 0, gz = 0
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name])
for (const f of walk(OUT).filter((f) => !f.endsWith('.txt'))) {
  const b = readFileSync(f); raw += b.length; gz += /\.(png)$/.test(f) ? b.length : gzipSync(b, { level: 9 }).length
  console.log(path.relative(OUT, f).padEnd(22), String(b.length).padStart(9), /\.png$/.test(f) ? '' : String(gzipSync(b, { level: 9 }).length).padStart(9))
}
console.log('TOTAL raw', raw, 'gzip(text)+png', gz, '(first-load budget: < 1 MB)')
