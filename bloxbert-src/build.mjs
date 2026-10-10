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
import { spawnSync } from 'child_process'
const PKG = JSON.parse(readFileSync(path.join(HERE, 'package.json'), 'utf8'))
spawnSync(process.execPath, ['tools/make-tiles.mjs'], { stdio: 'inherit' })
const strings = spawnSync(process.execPath, ['tools/check-strings.mjs'], { stdio: 'inherit' })
if (strings.status) process.exit(strings.status)
const check = spawnSync(process.execPath, ['tools/econ-check.mjs'], { stdio: 'inherit' })
if (check.status) process.exit(check.status)
const ids = spawnSync(process.execPath, ['tools/ids-check.mjs'], { stdio: 'inherit' })
if (ids.status) process.exit(ids.status)
const saves = spawnSync(process.execPath, ['tools/save-check.mjs'], { stdio: 'inherit' })
if (saves.status) process.exit(saves.status)
mkdirSync(OUT + '/assets', { recursive: true })
const STUDENT = path.basename(OUT) === 'blocks'
console.log('student build:', STUDENT, OUT)
// These includes are pulled in by StandardMaterial but only run behind defines the
// game never sets (shadows, bones, morphs, bump, decals, OIT, prepass). The
// uvOffset line in bumpFragment stays, because the lit shader always uses it.
const UNUSED_INCLUDE = /\/Shaders\/ShadersInclude\/(shadowsFragmentFunctions|shadowsVertex|bonesVertex|bonesDeclaration|bakedVertexAnimation|bakedVertexAnimationDeclaration|morphTargetsVertex|morphTargetsVertexGlobal|morphTargetsVertexGlobalDeclaration|morphTargetsVertexDeclaration|prePassVertex|prePassDeclaration|prePassVertexDeclaration|oitFragment|oitDeclaration|decalFragment|decalVertexDeclaration|decalFragmentDeclaration|bumpFragmentFunctions|bumpFragmentMainFunctions|bumpVertex|bumpVertexDeclaration)\.js$/
const trimUnusedShaders = {
  name: 'trim-unused-shaders',
  setup(b) {
    b.onLoad({ filter: UNUSED_INCLUDE }, async (args) => {
      let src = readFileSync(args.path, 'utf8')
      src = src.replace(/const shader = `[\s\S]*?`;/, 'const shader = " ";')
      return { contents: src, loader: 'js' }
    })
  },
}
await build({
  entryPoints: ['src/main.js'], bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: OUT + '/app.js', loader: { '.json': 'json' }, legalComments: 'eof', metafile: true,
  charset: 'utf8',
  drop: ['debugger'],
  pure: ['console.debug'],
  plugins: [trimUnusedShaders],
  define: { 'process.env.NODE_ENV': '"production"', '__BLOX_STUDENT__': STUDENT ? 'true' : 'false', PKG_VERSION: JSON.stringify(PKG.version) },
}).then((r) => writeFileSync('meta.json', JSON.stringify(r.metafile)))
cpSync('index.html', OUT + '/index.html')
cpSync('THIRD-PARTY.txt', OUT + '/THIRD-PARTY.txt')
const version = JSON.parse(readFileSync('package.json', 'utf8')).version
writeFileSync(OUT + '/sw.js', readFileSync('sw.js', 'utf8').replaceAll('__BLOX_VERSION__', version))
for (const f of readdirSync('assets').filter((f) => f.endsWith('.png') || f.endsWith('.txt') || f.endsWith('.json'))) cpSync('assets/' + f, OUT + '/assets/' + f)
let raw = 0, gz = 0
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name])
for (const f of walk(OUT).filter((f) => !f.endsWith('.txt'))) {
  const b = readFileSync(f); raw += b.length; gz += /\.(png)$/.test(f) ? b.length : gzipSync(b, { level: 9 }).length
  console.log(path.relative(OUT, f).padEnd(22), String(b.length).padStart(9), /\.png$/.test(f) ? '' : String(gzipSync(b, { level: 9 }).length).padStart(9))
}
console.log('TOTAL raw', raw, 'gzip(text)+png', gz, '(first-load budget: < 1 MB)')
const app = readFileSync(OUT + '/app.js')
console.log('app.js raw', app.length, 'gzip', gzipSync(app, { level: 9 }).length)
