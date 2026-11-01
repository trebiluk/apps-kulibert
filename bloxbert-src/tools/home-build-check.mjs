// Part 2 check (docs/bertopia/HOME-HOST.md §10). Two halves:
//   A. source guard (always): every use of the home module in main.js sits inside an `if (__HOME_HOST__)` guard or an
//      expression `(__HOME_HOST__ && …)`, the student index has no home marker, and the home strings are English-only.
//   B. build + join (needs esbuild, i.e. node_modules): builds ../bertopia-home with --home, proves the home bundle carries
//      the join screen and the student bundles do not (home-leak-check), then starts a real personal host serving the
//      home bundle and joins it with a headless browser if playwright is available (else a plain fetch of / and /join).
//   node tools/home-build-check.mjs            node tools/home-build-check.mjs --source-only
import { readFileSync, existsSync, rmSync } from 'fs'
import { spawnSync, spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'
const HERE = path.dirname(fileURLToPath(import.meta.url)); const SRC = path.resolve(HERE, '..'); const REPO = path.resolve(SRC, '..')
let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---- A. source
{
  const main = readFileSync(path.join(SRC, 'src/main.js'), 'utf8')
  const lines = main.split('\n')
  const uses = lines.map((l, i) => [i + 1, l]).filter(([, l]) => /\bHOME\./.test(l) && !/^\s*\/\//.test(l) && !/^import /.test(l))
  const unguarded = uses.filter(([, l]) => !/__HOME_HOST__/.test(l))
  eq(uses.length > 0 && unguarded.length === 0, `main.js: every HOME.* use (${uses.length}) is on a line guarded by __HOME_HOST__` + (unguarded.length ? ' — unguarded: ' + unguarded.map(([n]) => n).join(',') : ''))
  eq(/import \* as HOME from '\.\/home\/home\.js'/.test(main), 'main.js: the home module is imported as a namespace (one import to drop)')
  eq(!/homeOwnerOn/.test(main.replace(/HOME\.homeOwnerOn/g, '')), 'main.js: homeOwnerOn exists only through the home module')
  eq(!/function (staffOn|teacherOn)\(\)[\s\S]{0,400}HOME/.test(main), 'main.js: staffOn()/teacherOn() bodies are untouched')
  const idx = readFileSync(path.join(SRC, 'index.html'), 'utf8')
  eq(!/bertopia-home/.test(idx) && /hub-staff-auth\.js/.test(idx), 'index.html (student): no home marker; school sign-in still present')
  const home = readFileSync(path.join(SRC, 'src/home/home.js'), 'utf8')
  // English-only (Diego, Nov 1: the personal host is adults-only; its own text is English, every language falls back to it)
  eq(/^  en: \{/m.test(home) && !/^  (simple|uk|ru|es|ar|'fa-AF'|rw|ti): \{/m.test(home) && /const str = \(lang\) => \(\{ \.\.\.S\.en, lang \}\)/.test(home), 'home strings: English only, every language falls back to English')
  eq(/homeWsOk/.test(home) && /wss:/.test(home) && home.includes('192') && home.includes('168'), 'home client: ws:// only for this machine and private networks, wss:// otherwise')
  const cfg = readFileSync(path.join(SRC, 'src/classnet/config.js'), 'utf8')
  eq(/setHomeEndpoints/.test(cfg) && /kulibert\.net/.test(cfg), 'classnet/config.js: home seam added, school rule kept')
  const bld = readFileSync(path.join(SRC, 'build.mjs'), 'utf8')
  eq(/--home/.test(bld) && /__HOME_HOST__/.test(bld) && /home-leak-check/.test(bld) && /never goes into a student door/.test(bld), 'build.mjs: --home target, __HOME_HOST__ define, leak check on student builds, refuses home into a student door')
  const leak = spawnSync(process.execPath, [path.join(HERE, 'home-leak-check.mjs')], { encoding: 'utf8' })
  eq(leak.status === 0, 'current student bundles: ' + (leak.stdout || leak.stderr).trim().split('\n').pop())
}
if (process.argv.includes('--source-only')) { console.log(fails ? `home-build-check (source): ${fails} FAIL` : 'home-build-check (source): all PASS'); process.exit(fails ? 1 : 0) }

// ---- B. build + join
if (!existsSync(path.join(SRC, 'node_modules', 'esbuild'))) {
  console.log('SKIP  build + join: esbuild is not installed here (npm ci in bloxbert-src, then run again)')
  console.log(fails ? `home-build-check: ${fails} FAIL` : 'home-build-check: all PASS (source half; build half skipped)')
  process.exit(fails ? 1 : 0)
}
const OUT = path.join(REPO, 'bertopia-home')
const b = spawnSync(process.execPath, ['build.mjs', '--home'], { cwd: SRC, encoding: 'utf8' })
eq(b.status === 0, 'build --home: ' + (b.status === 0 ? 'ok' : (b.stderr || b.stdout).trim().split('\n').slice(-3).join(' | ')))
if (b.status === 0) {
  const app = readFileSync(path.join(OUT, 'app.js'), 'utf8'); const idx = readFileSync(path.join(OUT, 'index.html'), 'utf8')
  eq(/session code/i.test(app) && /homeWsOk|home-join/.test(app), 'home bundle: carries the join screen')
  eq(/bertopia-home/.test(idx) && !/hub-staff-auth|kw-test/.test(idx), 'home index: home marker, no school sign-in, no kw-test')
  const leak2 = spawnSync(process.execPath, [path.join(HERE, 'home-leak-check.mjs')], { encoding: 'utf8' })
  eq(leak2.status === 0, 'student bundles after a home build: still clean')
  // start a host that serves the home bundle, fetch / and join by code
  const PORT = 18990 + (process.pid % 100)
  const data = path.join(REPO, '.tmp-home-check'); rmSync(data, { recursive: true, force: true })
  const host = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', data, '--game', OUT], { cwd: path.join(REPO, 'server', 'class-room'), stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''; host.stdout.on('data', (d) => (log += d)); host.stderr.on('data', (d) => (log += d))
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const key = (/k=([0-9a-f]+)/.exec(log) || [])[1]
  eq(!!key && /game: /.test(log), 'host: started and found the home bundle')
  const A = 'http://127.0.0.1:' + PORT
  const post = (p, body, h = {}) => fetch(A + p, { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify(body) }).then((r) => r.json())
  const tok = (await post('/owner/pin', { key, pin: '246810' })).token
  await post('/owner/world/open', { name: 'check-world-1' }, { 'x-owner': tok })
  const s = await post('/owner/session/start', { ruleset: 'home-creative' }, { 'x-owner': tok })
  const page = await (await fetch(A + '/')).text()
  eq(/bertopia-home/.test(page) && /app\.js\?v=/.test(page), 'host serves the home game page at /')
  eq((await fetch(A + '/shared/kulibert-bar.js')).status === 200, 'host serves /shared/* for the page')
  const j = await post('/join', { code: s.code, name: 'Check', adults: true }, { 'x-forwarded-for': '203.0.113.50' })
  eq(j.error === 'no-owner', 'join from the page: told to wait for the owner (the hub rule)')
  let pw = null; try { pw = await import('playwright') } catch (e) {}
  if (pw) {
    const br = await pw.chromium.launch(); const pg = await br.newPage({ viewport: { width: 412, height: 915 } })
    await pg.goto(A + '/'); await pg.waitForSelector('#hj-go', { timeout: 15000 })
    eq(true, 'browser: the join screen shows before the world loads')
    await pg.fill('#hj-code', s.code); await pg.fill('#hj-name', 'Check'); await pg.check('#hj-adults'); await pg.click('#hj-go'); await pg.waitForTimeout(800)
    eq(/owner is not in the world/.test(await pg.textContent('#hj-out')), 'browser: a plain message when the owner is not in yet')
    await br.close()
  } else console.log('SKIP  browser half: playwright not installed')
  await post('/owner/stop', {}, { 'x-owner': tok }); await sleep(500); if (host.exitCode === null) host.kill()
  rmSync(data, { recursive: true, force: true })
}
console.log(fails ? `home-build-check: ${fails} FAIL` : 'home-build-check: all PASS')
process.exit(fails ? 1 : 0)
