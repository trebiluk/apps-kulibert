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
// Refuse to build if any source or output carries git conflict markers (P0 2.5.356).
const MARK = /^(<{7}|>{7})( |$)|^={7}$/m
const scanMarkers = (files) => { const bad = files.filter((f) => { try { return MARK.test(readFileSync(f, 'utf8')) } catch { return false } }); if (bad.length) { console.error('conflict markers found:', bad.join(', ')); process.exit(1) } }
scanMarkers(['index.html', 'sw.js', 'read.css', 'package.json', ...readdirSync('src').filter((f) => /\.(js|json|css)$/.test(f)).map((f) => 'src/' + f)])
const syntax = spawnSync(process.execPath, ['tools/syntax-check.mjs'], { stdio: 'inherit' })
if (syntax.status) process.exit(syntax.status)
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
const STUDENT = ['blocks', 'bertopia'].includes(path.basename(OUT)) // 2.5.473: both doors are student
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
  outfile: OUT + '/app.js', loader: { '.json': 'json', '.css': 'text' }, legalComments: 'eof', metafile: true,
  charset: 'utf8',
  drop: ['debugger'],
  pure: ['console.debug'],
  plugins: [trimUnusedShaders],
  banner: { js: '/*! Bertopia ' + PKG.version + ' */' },
  define: { 'process.env.NODE_ENV': '"production"', '__BLOX_STUDENT__': STUDENT ? 'true' : 'false', '__BLOX_DOOR__': JSON.stringify('/' + path.basename(OUT) + '/'), PKG_VERSION: JSON.stringify(PKG.version) },
}).then((r) => writeFileSync('meta.json', JSON.stringify(r.metafile)))
// Icon test entry — no main.js, just the contact sheet
await build({
  entryPoints: ['src/icons-test-entry.js'], bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: OUT + '/icons-test.js', loader: { '.json': 'json' }, legalComments: 'eof',
})
let indexSrc = readFileSync('index.html', 'utf8')
const ver = JSON.parse(readFileSync('package.json', 'utf8')).version
// Replace version plate, chip data-version, and app.js query
indexSrc = indexSrc.replace(/id="ver-plate">[^<]+</, 'id="ver-plate">' + ver + '<')
indexSrc = indexSrc.replace(/data-version="[^"]+"/, 'data-version="' + ver + '"')
indexSrc = indexSrc.replace(/app\.js\?v=[^"]+/, 'app.js?v=' + ver)
indexSrc = indexSrc.replace(/read\.css\?v=[^"]+/, 'read.css?v=' + ver)
indexSrc = indexSrc.replace(/<title>[^<]*<\/title>/, '<title>Bertopia ' + ver + '</title>')
if (!indexSrc.includes('<title>Bertopia ' + ver + '</title>') || !indexSrc.includes('app.js?v=' + ver) || !indexSrc.includes('data-version="' + ver + '"')) {
  console.error('version stamp mismatch')
  process.exit(1)
}
writeFileSync(OUT + '/index.html', indexSrc)
cpSync('read.css', OUT + '/read.css')
cpSync('icons-test.html', OUT + '/icons-test.html')
cpSync('THIRD-PARTY.txt', OUT + '/THIRD-PARTY.txt')
const version = JSON.parse(readFileSync('package.json', 'utf8')).version
writeFileSync(OUT + '/sw.js', readFileSync('sw.js', 'utf8').replaceAll('__BLOX_VERSION__', version))
scanMarkers([OUT + '/index.html', OUT + '/sw.js', OUT + '/app.js'])
function copyAssetTree(src, dst) {
  for (const f of readdirSync(src, { withFileTypes: true })) {
    if (f.name.startsWith('.')) continue
    const from = src + '/' + f.name
    const to = dst + '/' + f.name
    if (f.isDirectory()) {
      mkdirSync(to, { recursive: true })
      copyAssetTree(from, to)
    } else if (/\.(png|txt|json)$/.test(f.name)) cpSync(from, to)
  }
}
copyAssetTree('assets', OUT + '/assets')
let raw = 0, gz = 0
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name])
for (const f of walk(OUT).filter((f) => !f.endsWith('.txt'))) {
  const b = readFileSync(f); raw += b.length; gz += /\.(png)$/.test(f) ? b.length : gzipSync(b, { level: 9 }).length
  console.log(path.relative(OUT, f).padEnd(22), String(b.length).padStart(9), /\.png$/.test(f) ? '' : String(gzipSync(b, { level: 9 }).length).padStart(9))
}
console.log('TOTAL raw', raw, 'gzip(text)+png', gz, '(first-load budget: < 1 MB)')
const app = readFileSync(OUT + '/app.js')
console.log('app.js raw', app.length, 'gzip', gzipSync(app, { level: 9 }).length)
