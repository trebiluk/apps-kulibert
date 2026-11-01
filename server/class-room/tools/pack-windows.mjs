// Windows launcher package for the Bertopia personal host (adults 18+). Builds one zip a Windows PC can unpack and
// double-click: no install, no npm, no internet once unpacked.
//
//   node tools/pack-windows.mjs [--out <dir>] [--node 22.x.y] [--no-node] [--game <dir>]
//
// Zip layout (root folder "Bertopia Home"):
//   Bertopia Home.cmd             double-click: starts the host, opens the owner page
//   Create desktop shortcut.cmd   a desktop shortcut with the Bertopia icon
//   Open data folder.cmd          Documents\Bertopia Home (worlds, backups, home.json)
//   README.txt, bertopia.ico
//   runtime\node.exe, runtime\LICENSE      portable Node (official win-x64 build, SHA-256 checked)
//   app\server\class-room\{package.json, host\, src\}   the host, same layout as the repo, so no path changes
//   app\bloxbert-src\package.json          the game version (the join reply and Update card use it)
//   app\bertopia-home\                     the home game build, when `npm run build:home` has made one
//
// Never packed: home.json, secrets, worlds, .dev.vars, tests, node_modules. Runs on Windows, macOS or Linux.
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOM = path.resolve(HERE, '..')
const REPO = path.resolve(ROOM, '..', '..')
const argv = process.argv.slice(2)
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d }
const flag = (k) => argv.includes('--' + k)
const OUT = path.resolve(arg('out', path.join(REPO, 'dist')))
const CACHE = path.join(OUT, '.cache')
const NODE_MIN = [22, 13]                     // node:sqlite without a flag
const ROOT = 'Bertopia Home'

// ---------------------------------------------------------------- a small zip (store/deflate), pure Node
const DOS = (d) => { const t = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff; const day = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff; return [t, day] }
export function writeZip(file, entries) {         // entries: [{ name, data: Buffer }]
  const parts = [], central = []; let off = 0; const [tm, dt] = DOS(new Date())
  for (const e of entries) {
    const name = Buffer.from(e.name, 'utf8'), raw = e.data, crc = zlib.crc32(raw)
    const def = zlib.deflateRawSync(raw, { level: 9 }), useDef = def.length < raw.length, body = useDef ? def : raw
    const h = Buffer.alloc(30); h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0x0800, 6); h.writeUInt16LE(useDef ? 8 : 0, 8); h.writeUInt16LE(tm, 10); h.writeUInt16LE(dt, 12)
    h.writeUInt32LE(crc, 14); h.writeUInt32LE(body.length, 18); h.writeUInt32LE(raw.length, 22); h.writeUInt16LE(name.length, 26); h.writeUInt16LE(0, 28)
    const c = Buffer.alloc(46); c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8); c.writeUInt16LE(useDef ? 8 : 0, 10); c.writeUInt16LE(tm, 12); c.writeUInt16LE(dt, 14)
    c.writeUInt32LE(crc, 16); c.writeUInt32LE(body.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28); c.writeUInt32LE(off, 42)
    parts.push(h, name, body); central.push(c, name); off += 30 + name.length + body.length
  }
  const cd = Buffer.concat(central), end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10); end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(off, 16)
  if (entries.length > 0xffff || off > 0xffffffff) throw new Error('zip too big for this writer')
  fs.writeFileSync(file, Buffer.concat([...parts, cd, end]))
}
export function readZip(buf, want = () => true) {  // -> Map name -> Buffer (store/deflate; enough for nodejs.org zips and ours)
  let e = buf.length - 22; while (e >= 0 && buf.readUInt32LE(e) !== 0x06054b50) e--
  if (e < 0) throw new Error('not a zip')
  const n = buf.readUInt16LE(e + 10); let p = buf.readUInt32LE(e + 16); const out = new Map()
  for (let i = 0; i < n; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad zip directory')
    const method = buf.readUInt16LE(p + 10), size = buf.readUInt32LE(p + 20), nl = buf.readUInt16LE(p + 28), xl = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42)
    const name = buf.toString('utf8', p + 46, p + 46 + nl); p += 46 + nl + xl + cl
    if (name.endsWith('/') || !want(name)) continue
    const ds = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28), body = buf.subarray(ds, ds + size)
    out.set(name, method === 8 ? zlib.inflateRawSync(body) : method === 0 ? Buffer.from(body) : (() => { throw new Error('zip method ' + method) })())
  }
  return out
}

// ---------------------------------------------------------------- portable Node (official build, checked)
async function get(url) { const r = await fetch(url); if (!r.ok) throw new Error(url + ' -> HTTP ' + r.status); return Buffer.from(await r.arrayBuffer()) }
async function pickNode() {
  const want = arg('node', '')
  if (want) return 'v' + want.replace(/^v/, '')
  const list = JSON.parse((await get('https://nodejs.org/dist/index.json')).toString())
  const ok = list.find((r) => r.lts && /^v22\./.test(r.version) && (r.files || []).includes('win-x64-zip'))
  if (!ok) throw new Error('no Node 22 LTS for win-x64 in nodejs.org/dist/index.json')
  return ok.version
}
export async function nodeWin() {
  const v = await pickNode(); const [a, b] = v.slice(1).split('.').map(Number)
  if (a < NODE_MIN[0] || (a === NODE_MIN[0] && b < NODE_MIN[1])) throw new Error(`Node ${v} is too old: the host needs ${NODE_MIN.join('.')}+ (node:sqlite)`)
  const name = `node-${v}-win-x64.zip`, cached = path.join(CACHE, name)
  fs.mkdirSync(CACHE, { recursive: true })
  const sums = (await get(`https://nodejs.org/dist/${v}/SHASUMS256.txt`)).toString()
  const line = sums.split('\n').find((l) => l.trim().endsWith('  ' + name)); if (!line) throw new Error('no checksum for ' + name)
  const expect = line.trim().split(/\s+/)[0]
  let zip = fs.existsSync(cached) ? fs.readFileSync(cached) : null
  const sha = (b) => crypto.createHash('sha256').update(b).digest('hex')
  if (!zip || sha(zip) !== expect) { console.log(`[pack] downloading ${name}`); zip = await get(`https://nodejs.org/dist/${v}/${name}`); fs.writeFileSync(cached, zip) }
  if (sha(zip) !== expect) throw new Error(`checksum mismatch for ${name}`)
  const inner = `node-${v}-win-x64/`
  const files = readZip(zip, (n) => n === inner + 'node.exe' || n === inner + 'LICENSE')
  const exe = files.get(inner + 'node.exe'), lic = files.get(inner + 'LICENSE')
  if (!exe || exe.subarray(0, 2).toString() !== 'MZ') throw new Error('node.exe missing or not a Windows program')
  return { version: v, exe, license: lic || Buffer.from('See https://github.com/nodejs/node/blob/main/LICENSE\n'), sha256: expect }
}

// ---------------------------------------------------------------- launchers (CRLF: cmd.exe needs it)
const crlf = (s) => Buffer.from(s.replace(/\r?\n/g, '\r\n'), 'utf8')
export const LAUNCHER = `@echo off
setlocal EnableExtensions
title Bertopia Home server (adults 18+)
rem Bertopia personal host. Double-click to start; the owner page opens in your browser.
if not exist "%~dp0app\\server\\class-room\\host\\home.mjs" (echo This package is incomplete: app\\server\\class-room is missing. Unpack the whole zip again. & pause & exit /b 1)
set "NODE=%~dp0runtime\\node.exe"
if not exist "%NODE%" set "NODE="
if not defined NODE (where node >nul 2>&1 && set "NODE=node")
if not defined NODE (echo Node.js was not found. This package normally carries it in the runtime folder. & echo Unpack the whole zip again, or install the Node 22 LTS from https://nodejs.org and run this again. & pause & exit /b 1)
"%NODE%" -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]>22||(v[0]===22&&v[1]>=13)?0:1)"
if errorlevel 1 (echo This needs Node 22.13 or newer. Install the LTS from https://nodejs.org and run this again. & pause & exit /b 1)
cd /d "%~dp0app\\server\\class-room"
echo Bertopia Home server - for adults 18+.
echo The owner page opens in your browser. Keep this window open while people play.
echo To stop: press Stop server on the owner page, or close this window.
echo Worlds and backups: %USERPROFILE%\\Documents\\Bertopia Home
echo.
"%NODE%" --no-warnings --import ./host/register.mjs host/home.mjs --open %*
set "CODE=%ERRORLEVEL%"
if not "%CODE%"=="0" (echo. & echo The server stopped with an error, code %CODE%. The lines above say why. & pause)
exit /b %CODE%
`
export const SHORTCUT = `@echo off
rem Puts a "Bertopia Home" shortcut (with the Bertopia icon) on your desktop.
set "BT=%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command "$d=[Environment]::GetFolderPath('Desktop'); $s=(New-Object -ComObject WScript.Shell).CreateShortcut((Join-Path $d 'Bertopia Home.lnk')); $s.TargetPath=(Join-Path $env:BT 'Bertopia Home.cmd'); $s.WorkingDirectory=$env:BT; $s.IconLocation=(Join-Path $env:BT 'bertopia.ico'); $s.Description='Bertopia Home server (adults 18+)'; $s.Save()"
if errorlevel 1 (echo Could not make the shortcut. You can still double-click "Bertopia Home.cmd".) else (echo Done: "Bertopia Home" is on your desktop.)
pause
`
export const DATAFOLDER = `@echo off
rem Opens the folder with your worlds, backups and settings (home.json holds your server secret: do not share it).
set "DATA=%USERPROFILE%\\Documents\\Bertopia Home"
if not exist "%DATA%" mkdir "%DATA%"
start "" explorer "%DATA%"
`
const README = (game, node, version) => `Bertopia Home server for Windows - for adults 18+
====================================================

This runs a Bertopia world on your PC for people you know. It is not the school
class server: no student accounts, no school sign-in.

START
  1. Unpack the whole zip (right-click > Extract All). Do not run it from inside the zip.
  2. Double-click "Bertopia Home.cmd". If Windows asks whether to run it, choose
     "More info" > "Run anyway" (or, before unpacking: right-click the zip >
     Properties > tick Unblock > OK).
  3. Your browser opens the owner page. The first time, choose an owner PIN (6+ digits).
  4. Create a world, pick rules, press Start session, then "Play as owner".
     Give players the 8-character session code.
  Keep the black window open while people play. Stop with "Stop server" on the
  owner page, or close the window.

  Optional: "Create desktop shortcut.cmd" puts a Bertopia Home icon on your desktop.
           "Open data folder.cmd" opens Documents\\Bertopia Home.

PLAYERS ON OTHER COMPUTERS
  Off by default (this PC only). On the owner page turn on "Let other computers
  join", then close and start the server again. Windows Firewall asks once
  whether node.exe may use the network: allow "Private networks" only.
  Players open the address the owner page shows (http://192.168.x.x:8890/).
  Do not open the port on your router. For outside access see HOME-README.md
  (app\\server\\class-room\\host\\HOME-README.md): TLS proxy only.

WHAT IS IN HERE
  Game build:  ${game ? 'included (app\\bertopia-home)' : 'NOT included: players get the plain join page only. Build it with\n               "npm ci && npm run build:home" in bloxbert-src, then pack again.'}
  Game version: ${version}
  Node:        ${node ? node.version + ' (official win-x64 build, SHA-256 ' + node.sha256.slice(0, 16) + '...), runtime\\node.exe' : 'not included: install the Node 22 LTS from https://nodejs.org'}
  Your data:   Documents\\Bertopia Home (worlds, backups, home.json). Never inside this folder,
               so you can replace this folder with a newer package and keep your worlds.

Full guide: app\\server\\class-room\\host\\HOME-README.md
`

// ---------------------------------------------------------------- assemble
const NEVER = /(^|\/)(home\.json|\.dev\.vars.*|node_modules|test|\.wrangler|.*\.sqlite(-wal|-shm)?)$/
function addTree(entries, from, to, skip = () => false) {
  for (const f of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, f.name), rel = to + '/' + f.name
    if (NEVER.test(rel) || skip(rel)) continue
    if (f.isDirectory()) addTree(entries, src, rel, skip); else entries.push({ name: rel, data: fs.readFileSync(src) })
  }
}
export async function pack({ withNode = !flag('no-node'), game = arg('game', path.join(REPO, 'bertopia-home')), out = OUT } = {}) {
  const gameVersion = JSON.parse(fs.readFileSync(path.join(REPO, 'bloxbert-src', 'package.json'), 'utf8')).version
  const hasGame = !!game && fs.existsSync(path.join(game, 'index.html')) && fs.readFileSync(path.join(game, 'index.html'), 'utf8').includes('bertopia-home')
  const node = withNode ? await nodeWin() : null
  const entries = []
  const A = ROOT + '/app'
  entries.push({ name: A + '/server/class-room/package.json', data: fs.readFileSync(path.join(ROOM, 'package.json')) })
  addTree(entries, path.join(ROOM, 'host'), A + '/server/class-room/host', (rel) => /\/(host\.mjs|menu\.html|play\.html|start-topia-host\.cmd)$/.test(rel))
  addTree(entries, path.join(ROOM, 'src'), A + '/server/class-room/src')
  entries.push({ name: A + '/bloxbert-src/package.json', data: Buffer.from(JSON.stringify({ name: 'bloxbert', version: gameVersion }, null, 2) + '\n') })
  if (hasGame) addTree(entries, game, A + '/bertopia-home')
  if (node) { entries.push({ name: ROOT + '/runtime/node.exe', data: node.exe }); entries.push({ name: ROOT + '/runtime/LICENSE', data: node.license }) }
  entries.push({ name: ROOT + '/Bertopia Home.cmd', data: crlf(LAUNCHER) })
  entries.push({ name: ROOT + '/Create desktop shortcut.cmd', data: crlf(SHORTCUT) })
  entries.push({ name: ROOT + '/Open data folder.cmd', data: crlf(DATAFOLDER) })
  entries.push({ name: ROOT + '/README.txt', data: crlf(README(hasGame, node, gameVersion)) })
  const icon = path.join(HERE, 'pack', 'bertopia.ico')   // the game's workbench tile (Kenney, CC0) at 16/32/48/256
  if (fs.existsSync(icon)) entries.push({ name: ROOT + '/bertopia.ico', data: fs.readFileSync(icon) })
  fs.mkdirSync(out, { recursive: true })
  const file = path.join(out, `Bertopia-Home-Windows-${gameVersion}${hasGame ? '' : '-host-only'}${node ? '' : '-no-node'}.zip`)
  writeZip(file, entries)
  return { file, bytes: fs.statSync(file).size, entries: entries.length, game: hasGame, node: node ? node.version : null, gameVersion }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const r = await pack()
  console.log(`[pack] ${r.file}`)
  console.log(`[pack] ${(r.bytes / 1e6).toFixed(1)} MB, ${r.entries} files · game build: ${r.game ? 'yes' : 'NO (host + join page only; run npm run build:home in bloxbert-src first)'} · Node: ${r.node || 'not included'}`)
}
