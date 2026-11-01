// Check for the one-click launcher (tools/home-launch.mjs, "Start Bertopia Home.cmd"). Offline.
//   node --no-warnings tools/home-launch-check.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import { nodePlan, buildPlan, installPlan, GIT_ENV } from './home-launch.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'launch-check-'))
const LAUNCH = path.join(path.dirname(new URL(import.meta.url).pathname), 'home-launch.mjs')

// Node choice
eq(nodePlan('22.13.0').flags.length === 0 && nodePlan('24.1.0').flags.length === 0 && nodePlan('22.23.4').exe, 'node: 22.13+ runs the host as is')
eq(nodePlan('22.12.0').flags.join() === '--experimental-sqlite' && nodePlan('22.5.1').flags.join() === '--experimental-sqlite', 'node: 22.5-22.12 (Diego\'s 22.12) gets --experimental-sqlite')
eq(nodePlan('22.4.0').exe === null && nodePlan('20.11.1').exe === null && /too old/.test(nodePlan('18.0.0').why), 'node: older is refused with the reason (Windows then fetches the portable LTS)')

// install: npm ci only when needed
{
  const src = path.join(TMP, 'src'); fs.mkdirSync(src); fs.writeFileSync(path.join(src, 'package-lock.json'), '{"v":1}')
  const stamp = path.join(src, 'node_modules', '.bt-lock-sha256')
  const a = installPlan({ src, lockstamp: stamp }); fs.mkdirSync(path.join(src, 'node_modules')); fs.writeFileSync(stamp, a.want)
  const b = installPlan({ src, lockstamp: stamp }); fs.writeFileSync(path.join(src, 'package-lock.json'), '{"v":2}')
  const c = installPlan({ src, lockstamp: stamp })
  eq(a.need && !b.need && c.need && /changed/.test(c.why), 'install: npm ci when node_modules is missing or package-lock.json changed, not otherwise')
}
// build: only when the game source changed
{
  const game = path.join(TMP, 'game'), stamp = path.join(game, '.bt-built-from')
  const a = buildPlan({ game, stamp, head: 'abc', dirty: '' })
  fs.mkdirSync(game); fs.writeFileSync(path.join(game, 'index.html'), 'x'); fs.writeFileSync(stamp, a.fp)
  const b = buildPlan({ game, stamp, head: 'abc', dirty: '' })
  const c = buildPlan({ game, stamp, head: 'def', dirty: '' }), d = buildPlan({ game, stamp, head: 'abc', dirty: ' M bloxbert-src/src/main.js' })
  const e = buildPlan({ game, stamp, head: null, dirty: null })
  eq(a.need && !b.need && c.need && d.need && !e.need, 'build: when missing, after a new commit or a local edit to the game; kept when unchanged or outside git')
}
// git: GitHub ssh:// deps go over HTTPS, without touching global config
{
  const env = { ...process.env, ...GIT_ENV, HOME: TMP, GIT_CONFIG_GLOBAL: path.join(TMP, 'nogit') }
  const url = spawnSync('git', ['ls-remote', '--get-url', 'ssh://git@github.com/fenomas/noa.git'], { encoding: 'utf8', env }).stdout.trim()
  const url2 = spawnSync('git', ['ls-remote', '--get-url', 'git@github.com:fenomas/noa.git'], { encoding: 'utf8', env }).stdout.trim()
  eq(url === 'https://github.com/fenomas/noa.git' && url2 === 'https://github.com/fenomas/noa.git' && !fs.existsSync(path.join(TMP, 'nogit')), 'git: the noa engine (ssh:// and git@ forms) is fetched over HTTPS; no global git config is written')
}
// dry runs
{
  const r = (fake, extra = []) => spawnSync(process.execPath, [LAUNCH, '--dry-run', '--no-update', ...extra], { encoding: 'utf8', env: { ...process.env, BT_FAKE_NODE: fake } })
  const a = r('22.12.0'), b = r('22.13.0', ['--no-build', '--', '--port', '9999']), c = r('20.11.0')
  eq(a.status === 0 && /would start: .* --experimental-sqlite --import \.\/host\/register\.mjs host\/home\.mjs --open/.test(a.stdout), 'dry run: with Node 22.12 the host starts with --experimental-sqlite')
  eq(b.status === 0 && /build skipped/.test(b.stdout) && !/npm/.test(b.stdout) && /--open --port 9999/.test(b.stdout), 'dry run: --no-build skips npm entirely; options after -- reach the host')
  eq(process.platform === 'win32' || (c.status === 1 && /too old.*nodejs\.org/s.test(c.stdout)), 'dry run: a too-old Node stops with what to install (off Windows)')
}
// real start through the launcher (no update, no build), with the 22.12 flag, then Stop
{
  const DATA = path.join(TMP, 'data'), PORT = 19590 + (process.pid % 100)
  const child = spawn(process.execPath, [LAUNCH, '--no-update', '--no-build', '--', '--port', String(PORT), '--data', DATA], { env: { ...process.env, BT_FAKE_NODE: '22.12.0', BROWSER: 'none', PATH: process.env.PATH }, stdio: ['ignore', 'pipe', 'pipe'] })
  let log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
  try {
    for (let i = 0; i < 120 && !/\[home\] Bertopia personal host/.test(log); i++) await sleep(50)
    const H = 'http://127.0.0.1:' + PORT
    eq(/node: Node 22\.12\.0 \(adding --experimental-sqlite\)/.test(log) && (await fetch(H + '/version')).ok, 'launcher: starts the host from the repo (flag path), owner page up')
    const key = /k=([0-9a-f]+)/.exec(log)[1]
    const tok = (await (await fetch(H + '/owner/pin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, pin: '246810' }) })).json()).token
    await fetch(H + '/owner/stop', { method: 'POST', headers: { 'x-owner': tok } })
    for (let i = 0; i < 60 && child.exitCode === null; i++) await sleep(50)
    eq(child.exitCode === 0 && !/TypeError|ReferenceError|Unhandled/.test(log), 'launcher: "Stop server" ends it with code 0 (the window closes; errors would keep it open)')
  } catch (e) { eq(false, 'launcher run threw: ' + e.message) } finally { if (child.exitCode === null) child.kill() }
}
// the double-click file
{
  const cmd = fs.readFileSync(path.resolve(path.dirname(LAUNCH), '..', '..', '..', 'Start Bertopia Home.cmd'), 'latin1')
  eq(cmd.includes('\r\n') && !/[^\r]\n/.test(cmd) && /node "%~dp0server\\class-room\\tools\\home-launch\.mjs" %\*/.test(cmd) && /if errorlevel 1 pause/.test(cmd) && /nodejs\.org/.test(cmd), 'Start Bertopia Home.cmd: CRLF, runs the launcher with the options passed through, stays open on errors, says where to get Node')
  const ga = fs.readFileSync(path.resolve(path.dirname(LAUNCH), '..', '..', '..', '.gitattributes'), 'utf8')
  eq(/^\*\.cmd text eol=crlf$/m.test(ga), '.gitattributes keeps .cmd files CRLF on every checkout')
}
fs.rmSync(TMP, { recursive: true, force: true })
console.log(fails ? `home-launch-check: ${fails} FAIL` : 'home-launch-check: all PASS')
process.exit(fails ? 1 : 0)
