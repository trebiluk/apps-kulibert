// Windows launcher package check (tools/pack-windows.mjs). Offline: packs without Node (and once with a stand-in game
// build), reads the zip back, then UNPACKS it and runs the host from the unpacked layout, exactly as the launcher does
// (cwd app/server/class-room, `--import ./host/register.mjs host/home.mjs`). cmd.exe itself cannot run here, so the
// launcher text is checked line by line for the Windows pitfalls instead.
//   node --no-warnings tools/home-pack-check.mjs   [BT_PACK_ZIP=<a full zip with node.exe> to check that one too]
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { pack, readZip, writeZip, LAUNCHER, SHORTCUT, DATAFOLDER } from './pack-windows.mjs'

let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'pack-check-'))
const R = 'Bertopia Home/'

// zip round trip (the writer and reader the package uses)
{
  const big = Buffer.alloc(200000, 7), rnd = Buffer.from(Array.from({ length: 5000 }, () => Math.floor(Math.random() * 256)))
  writeZip(path.join(TMP, 'rt.zip'), [{ name: 'a/b.txt', data: Buffer.from('hello') }, { name: 'big.bin', data: big }, { name: 'rnd.bin', data: rnd }, { name: 'ü/ñ.txt', data: Buffer.from('x') }])
  const m = readZip(fs.readFileSync(path.join(TMP, 'rt.zip')))
  eq(m.get('a/b.txt').toString() === 'hello' && m.get('big.bin').equals(big) && m.get('rnd.bin').equals(rnd) && m.has('ü/ñ.txt') && fs.statSync(path.join(TMP, 'rt.zip')).size < 10000, 'zip: round trip (deflate, stored, unicode names) is exact')
}

// launcher text: the Windows pitfalls
{
  const L = LAUNCHER.split('\n')
  const blocks = L.filter((l) => /\(.*\)/.test(l) && /^\s*(if|for)\b/i.test(l))
  eq(!blocks.some((l) => /%~dp0/.test(l.slice(l.indexOf('(', l.search(/\)\s*\(|\s\(/) )))), 'launcher: no %~dp0 inside an if-block body (a folder like "Bob (Work)" would break the block)')
  eq(/runtime\\node\.exe/.test(LAUNCHER) && /where node/.test(LAUNCHER) && /22\.13/.test(LAUNCHER) && /v\[0\]===22&&v\[1\]>=13/.test(LAUNCHER), 'launcher: uses the packed node.exe, falls back to an installed Node, and requires 22.13+ (node:sqlite)')
  eq(/cd \/d "%~dp0app\\server\\class-room"/.test(LAUNCHER) && /--import \.\/host\/register\.mjs host\/home\.mjs --open %\*/.test(LAUNCHER), 'launcher: starts the host exactly like `npm run home`, from its own folder, passing extra options through')
  eq(/if not "%CODE%"=="0" \(.*pause\)/.test(LAUNCHER) && /if not exist .*home\.mjs.*pause/.test(LAUNCHER), 'launcher: on any error the window stays open with the reason (missing files, no Node, old Node, server error)')
  eq(!/!/.test(LAUNCHER.replace(/echo [^&\n]*/g, '')) && !/EnableDelayedExpansion/i.test(LAUNCHER), 'launcher: no delayed expansion (a "!" in a folder name stays harmless)')
  eq(/\$env:BT/.test(SHORTCUT) && !/'%~dp0/.test(SHORTCUT) && /bertopia\.ico/.test(SHORTCUT), 'shortcut: the folder reaches PowerShell through an environment variable (apostrophes in paths are safe)')
  eq(/Documents\\Bertopia Home/.test(DATAFOLDER) && /explorer/.test(DATAFOLDER), 'data folder: opens Documents\\Bertopia Home')
}

// pack without Node, read it back
const plain = await pack({ withNode: false, game: path.join(TMP, 'no-game'), out: path.join(TMP, 'out1') })
const zip = readZip(fs.readFileSync(plain.file))
const names = [...zip.keys()]
const need = ['Bertopia Home.cmd', 'Create desktop shortcut.cmd', 'Open data folder.cmd', 'README.txt', 'bertopia.ico', 'app/server/class-room/package.json', 'app/server/class-room/host/home.mjs', 'app/server/class-room/host/register.mjs', 'app/server/class-room/host/hooks.mjs', 'app/server/class-room/host/owner.html', 'app/server/class-room/host/join.html', 'app/server/class-room/src/room.js', 'app/server/class-room/src/world-do.js', 'app/bloxbert-src/package.json']
eq(need.every((n) => zip.has(R + n)), `package: launcher, README, icon, host, server code and game version are all there (${names.length} files)`)
eq(!names.some((n) => /home\.json$|\.dev\.vars|\.sqlite|\/test\/|node_modules|\.wrangler/.test(n)), 'package: no home.json, secrets, worlds, tests or node_modules')
eq(!names.some((n) => /host\/(host\.mjs|menu\.html|play\.html|start-topia-host\.cmd)$/.test(n)), 'package: the old #122 LAN host is left out; only the personal host ships')
const cmds = names.filter((n) => n.endsWith('.cmd') || n.endsWith('README.txt'))
eq(cmds.length === 4 && cmds.every((n) => { const t = zip.get(n).toString('latin1'); return t.includes('\r\n') && !/[^\r]\n/.test(t) }), 'package: the .cmd files and README use CRLF line ends (cmd.exe and Notepad need them)')
const readme = zip.get(R + 'README.txt').toString()
eq(/adults 18\+/.test(readme) && /NOT included/.test(readme) && /Private networks/.test(readme) && /host-only/.test(path.basename(plain.file)) && /no-node/.test(path.basename(plain.file)), 'package: README and file name say plainly what is missing (no game build, no Node)')
const ico = zip.get(R + 'bertopia.ico')
eq(ico.readUInt16LE(2) === 1 && ico.readUInt16LE(4) === 4, 'package: the icon is a real .ico (4 sizes)')
eq(JSON.parse(zip.get(R + 'app/bloxbert-src/package.json')).version === JSON.parse(fs.readFileSync(path.resolve('..', '..', 'bloxbert-src', 'package.json'))).version, 'package: carries the game version the Update card compares')

// with a (stand-in) home game build
const fake = path.join(TMP, 'fake-home'); fs.mkdirSync(fake)
fs.writeFileSync(path.join(fake, 'index.html'), '<!doctype html><meta name="bertopia-home" content="1"><title>fake home build</title><p id=marker>fake home game')
const withGame = await pack({ withNode: false, game: fake, out: path.join(TMP, 'out2') })
const z2 = readZip(fs.readFileSync(withGame.file))
eq(withGame.game && z2.has(R + 'app/bertopia-home/index.html') && !/host-only/.test(path.basename(withGame.file)) && /included \(app/.test(z2.get(R + 'README.txt').toString()), 'package: a home game build goes in app\\bertopia-home and the name drops "host-only"')
const student = path.join(TMP, 'student'); fs.mkdirSync(student); fs.writeFileSync(path.join(student, 'index.html'), '<!doctype html><title>student</title>')
eq(!(await pack({ withNode: false, game: student, out: path.join(TMP, 'out3') })).game, 'package: a student build is never packed as the home game (no bertopia-home marker)')

// unpack and run the host from the package layout, as the launcher does
const UNP = path.join(TMP, 'unpacked')
for (const [n, data] of z2) { const f = path.join(UNP, n); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data) }
const cwd = path.join(UNP, 'Bertopia Home', 'app', 'server', 'class-room'), DATA = path.join(TMP, 'data'), PORT = 19490 + (process.pid % 100)
const child = spawn(process.execPath, ['--no-warnings', '--import', './host/register.mjs', 'host/home.mjs', '--port', String(PORT), '--data', DATA], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
let log = ''; child.stdout.on('data', (d) => (log += d)); child.stderr.on('data', (d) => (log += d))
try {
  for (let i = 0; i < 100 && !/owner page/.test(log); i++) await sleep(50)
  const H = 'http://127.0.0.1:' + PORT
  const ver = await (await fetch(H + '/version')).json()
  const home = await (await fetch(H + '/')).text()
  const owner = await fetch(H + '/owner')
  eq(/owner page/.test(log) && ver.game === JSON.parse(fs.readFileSync(path.join(UNP, 'Bertopia Home', 'app', 'bloxbert-src', 'package.json'))).version, 'unpacked: the host starts from the package folder and reports the packed game version')
  eq(/fake home game/.test(home) && owner.status === 200, 'unpacked: it serves the packed home game at / and the owner page on this PC')
  eq(fs.existsSync(path.join(DATA, 'home.json')) && !fs.readdirSync(path.join(UNP, 'Bertopia Home'), { recursive: true }).some((f) => /home\.json$/.test(String(f))), 'unpacked: the secret and settings go to the data folder, never into the package folder')
  const key = /k=([0-9a-f]+)/.exec(log)[1]
  const tok = (await (await fetch(H + '/owner/pin', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ key, pin: '246810' }) })).json()).token
  await fetch(H + '/owner/stop', { method: 'POST', headers: { 'x-owner': tok } })
  for (let i = 0; i < 40 && child.exitCode === null; i++) await sleep(50)
  eq(child.exitCode === 0, 'unpacked: "Stop server" ends the process with code 0 (the launcher window then closes by itself)')
} catch (e) { eq(false, 'unpacked run threw: ' + e.message) } finally { if (child.exitCode === null) child.kill() }

// a full package (with node.exe), when one is given
const FULL = process.env.BT_PACK_ZIP
if (FULL && fs.existsSync(FULL)) {
  const z = readZip(fs.readFileSync(FULL), (n) => /runtime\/|README/.test(n))
  const exe = z.get(R + 'runtime/node.exe')
  eq(!!exe && exe.subarray(0, 2).toString() === 'MZ' && exe.length > 20e6 && z.has(R + 'runtime/LICENSE') && /official win-x64 build, SHA-256/.test(z.get(R + 'README.txt').toString()), `full package: runtime\\node.exe is a Windows program (${exe ? (exe.length / 1e6).toFixed(0) : 0} MB) with Node's LICENSE; README names the checked build`)
} else console.log('note: set BT_PACK_ZIP=<zip from `node tools/pack-windows.mjs`> to also check a package with node.exe')
fs.rmSync(TMP, { recursive: true, force: true })
console.log(fails ? `home-pack-check: ${fails} FAIL` : 'home-pack-check: all PASS')
process.exit(fails ? 1 : 0)
