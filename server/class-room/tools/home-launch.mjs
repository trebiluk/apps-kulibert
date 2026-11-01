// One-click start for the personal host FROM A REPO CHECKOUT (adults 18+). Does the setup a person would otherwise
// type: update, pick a Node that can run the host, install and build the home game only when needed, then start the
// host and open the owner page. "Start Bertopia Home.cmd" at the repo root runs this; so does
//   node server/class-room/tools/home-launch.mjs [--no-update] [--no-build] [--rebuild] [--dry-run] [-- <host options>]
//
// Steps (each says what it did, and a failure says what to do):
//  1. update   `git pull --ff-only`, only when the folder has no local changes and the branch tracks a remote.
//  2. Node     22.13+: as is. 22.5-22.12: adds --experimental-sqlite (node:sqlite is there behind a flag).
//              Older: on Windows, fetches the official Node 22 LTS (SHA-256 checked) into %LOCALAPPDATA%\Bertopia.
//  3. install  `npm ci` in bloxbert-src when node_modules is missing or package-lock.json changed. GitHub ssh:// deps
//              (the noa engine) are fetched over HTTPS through env-only git config: nothing global is changed.
//  4. build    `npm run build:home` when bertopia-home/ is missing or the game source changed since the last build
//              (fingerprint: git commit + uncommitted changes under bloxbert-src).
//  5. start    the host (`host/home.mjs --open`), from server/class-room, with any options after `--`.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import { spawnSync, spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOM = path.resolve(HERE, '..')
const REPO = path.resolve(ROOM, '..', '..')
const SRC = path.join(REPO, 'bloxbert-src')
const GAME = path.join(REPO, 'bertopia-home')
const STAMP = path.join(GAME, '.bt-built-from')
const LOCKSTAMP = path.join(SRC, 'node_modules', '.bt-lock-sha256')
const WIN = process.platform === 'win32'

const all = process.argv.slice(2), cut = all.indexOf('--')
const opts = cut >= 0 ? all.slice(0, cut) : all, pass = cut >= 0 ? all.slice(cut + 1) : []
const has = (k) => opts.includes('--' + k)
const DRY = has('dry-run')
const say = (s) => console.log('[start] ' + s)
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex')

// git with HTTPS for GitHub ssh:// deps, for this process tree only (git 2.31+ reads GIT_CONFIG_COUNT)
export const GIT_ENV = { GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_0: 'url.https://github.com/.insteadOf', GIT_CONFIG_VALUE_0: 'ssh://git@github.com/', GIT_CONFIG_KEY_1: 'url.https://github.com/.insteadOf', GIT_CONFIG_VALUE_1: 'git@github.com:' }
const git = (args, cwd = REPO) => { const r = spawnSync('git', args, { cwd, encoding: 'utf8' }); return r.status === 0 ? r.stdout.trim() : null }
const run = (cmd, args, cwd, env) => { if (DRY) { say('(dry run) would run: ' + [cmd, ...args].join(' ') + '  in ' + path.relative(REPO, cwd || REPO)); return 0 } const r = spawnSync(cmd, args, { cwd, stdio: 'inherit', env: { ...process.env, ...env }, shell: WIN }); return r.status === null ? 1 : r.status }

// ---- 2. which Node runs the host -> { exe, flags } or { error }
export function nodePlan(version = process.versions.node) {
  const [a, b] = version.split('.').map(Number)
  if (a > 22 || (a === 22 && b >= 13)) return { exe: process.execPath, flags: [], why: `Node ${version}` }
  if (a === 22 && b >= 5) return { exe: process.execPath, flags: ['--experimental-sqlite'], why: `Node ${version} (adding --experimental-sqlite)` }
  return { exe: null, flags: [], why: `Node ${version} is too old for the host (needs 22.13+, or 22.5+ with a flag)` }
}
async function portableNode() {
  if (!WIN) return null
  const base = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'Bertopia')
  const have = fs.existsSync(base) ? fs.readdirSync(base).filter((d) => /^node-v22\./.test(d)).sort().pop() : null
  if (have && fs.existsSync(path.join(base, have, 'node.exe'))) return path.join(base, have, 'node.exe')
  if (DRY) { say('(dry run) would fetch the official Node 22 LTS into ' + base); return 'node.exe' }
  say('fetching the official Node 22 LTS (one time, about 30 MB)...')
  const { nodeWin } = await import('./pack-windows.mjs')
  const n = await nodeWin()
  const dir = path.join(base, 'node-' + n.version); fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'node.exe'), n.exe); fs.writeFileSync(path.join(dir, 'LICENSE'), n.license)
  return path.join(dir, 'node.exe')
}

// ---- 4. does the game need a build? -> { need, why, fp }
export function buildPlan({ game = GAME, stamp = STAMP, head = git(['rev-parse', 'HEAD']), dirty = git(['status', '--porcelain', '--', 'bloxbert-src']) } = {}) {
  const fp = head === null ? null : sha(head + '\n' + (dirty || ''))
  if (!fs.existsSync(path.join(game, 'index.html'))) return { need: true, why: 'no home game build yet', fp }
  if (fp === null) return { need: false, why: 'not a git checkout: keeping the build that is there (use --rebuild to force)', fp }
  const was = fs.existsSync(stamp) ? fs.readFileSync(stamp, 'utf8').trim() : ''
  return was === fp ? { need: false, why: 'game build is up to date', fp } : { need: true, why: 'the game source changed since the last build', fp }
}
// ---- 3. does bloxbert-src need `npm ci`?
export function installPlan({ src = SRC, lockstamp = LOCKSTAMP } = {}) {
  const lock = path.join(src, 'package-lock.json')
  const want = fs.existsSync(lock) ? sha(fs.readFileSync(lock)) : ''
  if (!fs.existsSync(path.join(src, 'node_modules'))) return { need: true, why: 'packages not installed yet', want }
  const was = fs.existsSync(lockstamp) ? fs.readFileSync(lockstamp, 'utf8').trim() : ''
  return was === want ? { need: false, why: 'packages up to date', want } : { need: true, why: 'package-lock.json changed', want }
}

async function main() {
  say('Bertopia Home (adults 18+): getting everything ready')
  // 1. update
  if (has('no-update')) say('update: skipped (--no-update)')
  else if (git(['rev-parse', '--is-inside-work-tree']) !== 'true') say('update: not a git checkout, skipped')
  else if (git(['status', '--porcelain'])) say('update: you have local changes, so nothing is pulled (your files stay as they are)')
  else if (!git(['rev-parse', '--abbrev-ref', '@{u}'])) say('update: this branch tracks no remote, skipped')
  else {
    const before = git(['rev-parse', 'HEAD'])
    const r = DRY ? (say('(dry run) would run: git pull --ff-only'), 0) : spawnSync('git', ['pull', '--ff-only'], { cwd: REPO, stdio: 'inherit', env: { ...process.env, ...GIT_ENV } }).status
    say(r === 0 ? (git(['rev-parse', 'HEAD']) === before ? 'update: already up to date' : 'update: pulled the latest') : 'update: could not pull (offline, or the branch moved in a way that needs you); going on with what is here')
  }
  // 2. Node
  let node = nodePlan(process.env.BT_FAKE_NODE || process.versions.node)
  if (!node.exe) { const p = await portableNode(); if (p) node = { exe: p, flags: [], why: 'portable Node 22 LTS' } }
  if (!node.exe) { say(node.why + '. Install the Node 22 LTS from https://nodejs.org and run this again.'); return 1 }
  say('node: ' + node.why)
  // 3 + 4. install and build the game
  const bp = has('rebuild') ? { need: true, why: '--rebuild', fp: buildPlan().fp } : buildPlan()
  if (has('no-build')) say('game: build skipped (--no-build)' + (fs.existsSync(path.join(GAME, 'index.html')) ? '' : '; players get the plain join page'))
  else if (!bp.need) say('game: ' + bp.why)
  else {
    say('game: ' + bp.why)
    const ip = installPlan()
    if (ip.need) {
      say('install: ' + ip.why + ' (npm ci, about a minute)')
      if (run('npm', ['ci', '--no-audit', '--no-fund'], SRC, GIT_ENV) !== 0) { say('install failed: the lines above say why. Check your internet connection and run this again.'); return 1 }
      if (!DRY) fs.writeFileSync(LOCKSTAMP, ip.want)
    } else say('install: ' + ip.why)
    say('build: making the home game (about a minute)')
    if (run('npm', ['run', 'build:home'], SRC) !== 0) { say('build failed: the lines above say why. The server was not started.'); return 1 }
    if (!DRY && bp.fp) fs.writeFileSync(STAMP, bp.fp)
  }
  // 5. start
  const args = ['--no-warnings', ...node.flags, '--import', './host/register.mjs', 'host/home.mjs', '--open', ...pass]
  if (DRY) { say('(dry run) would start: ' + [node.exe, ...args].join(' ') + '  in server/class-room'); return 0 }
  say('starting the server. Keep this window open while people play; "Stop server" on the owner page ends it.')
  const child = spawn(node.exe, args, { cwd: ROOM, stdio: 'inherit' })
  return await new Promise((r) => child.on('exit', (code) => r(code === null ? 1 : code)))
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main()
