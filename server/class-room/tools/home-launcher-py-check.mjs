// Runs the Python launcher's checks (launcher/test_launcher.py) and checks the Windows-only files that cannot run
// here (build-exe.cmd, "Bertopia Launcher.pyw") as text. SKIPs the Python half when no Python 3 is found.
//   node tools/home-launcher-py-check.mjs        (the window test also needs tkinter and a display: xvfb-run on Linux)
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
const HERE = path.dirname(fileURLToPath(import.meta.url)), L = path.resolve(HERE, '..', 'launcher'), REPO = path.resolve(HERE, '..', '..', '..')
let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }

const cmd = fs.readFileSync(path.join(L, 'build-exe.cmd'), 'latin1')
eq(cmd.includes('\r\n') && !/[^\r]\n/.test(cmd), 'build-exe.cmd: CRLF line ends')
eq(!cmd.split('\r\n').some((l) => /\(\s*$/.test(l) || /^\s*\)/.test(l)), 'build-exe.cmd: no multi-line ( ) blocks (folder names with brackets are safe)')
eq(/--onefile --windowed --name "Bertopia Launcher" --icon "%~dp0\.\.\\tools\\pack\\bertopia\.ico"/.test(cmd) && /--distpath "%~dp0\.\.\\\.\.\\\.\.\\dist"/.test(cmd) && /bertopia_launcher\.py"/.test(cmd), 'build-exe.cmd: one windowed .exe with the Bertopia icon, into dist\\ (git-ignored)')
eq(/pip install --user/.test(cmd) && /goto fail/.test(cmd) && /:nopy/.test(cmd) && /\$env:EXE/.test(cmd), 'build-exe.cmd: PyInstaller for this user only; clear messages when Python is missing or the build fails; the shortcut path goes through an env var')
const pyw = fs.readFileSync(path.join(REPO, 'Bertopia Launcher.pyw'), 'utf8')
eq(/server", "class-room", "launcher"/.test(pyw) && /bertopia_launcher\.main\(\)/.test(pyw), 'Bertopia Launcher.pyw: opens the launcher from the repo (no console window on Windows)')
const core = fs.readFileSync(path.join(L, 'bertopia_core.py'), 'utf8')
eq(/^LAUNCHER_VERSION = '\d+\.\d+\.\d+'/m.test(core), 'bertopia_core.py: LAUNCHER_VERSION is set (the .exe self-update compares it)')

const py = ['python3.12', 'python3', 'python', 'py'].find((p) => spawnSync(p, ['-c', 'import sys; sys.exit(0 if sys.version_info >= (3, 9) else 1)']).status === 0)
if (!py) console.log('SKIP  Python launcher checks: no Python 3.9+ found')
else {
  const hasTk = spawnSync(py, ['-c', 'import tkinter']).status === 0, hasX = !!process.env.DISPLAY || process.platform === 'win32'
  const xvfb = !hasX && spawnSync('xvfb-run', ['--help']).status === 0
  const args = ['-m', 'unittest', '-v', 'test_launcher']
  const r = xvfb && hasTk ? spawnSync('xvfb-run', ['-a', '-s', '-screen 0 1280x900x24', py, ...args], { cwd: L, encoding: 'utf8' }) : spawnSync(py, args, { cwd: L, encoding: 'utf8' })
  const out = (r.stdout || '') + (r.stderr || '')
  const ran = /Ran (\d+) tests?/.exec(out), skipped = (out.match(/skipped/g) || []).length
  eq(r.status === 0 && ran, `Python launcher checks (${py}${xvfb && hasTk ? ' under xvfb' : ''}): ${ran ? ran[1] : 0} tests OK${skipped ? `, ${skipped} skipped` : ''}`)
  if (r.status !== 0) console.log(out.split('\n').filter((l) => /FAIL|ERROR|Error|assert/i.test(l)).slice(0, 12).join('\n'))
}
console.log(fails ? `home-launcher-py-check: ${fails} FAIL` : 'home-launcher-py-check: all PASS')
process.exit(fails ? 1 : 0)
