// Home host pages: every inline <script> must parse, and the owner gate must be reachable by keyboard.
// Static only (no browser): catches the class of bug where one typo kills the whole owner page
// while every API check still passes. Run: node tools/home-page-check.mjs
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { pass++; console.log('PASS', m) } else { fail++; console.log('FAIL', m) } }
const dir = new URL('../host/', import.meta.url)

for (const page of ['owner.html', 'join.html']) {
  const html = readFileSync(new URL(page, dir), 'utf8')
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1])
  ok(scripts.length > 0, `${page}: has inline script`)
  scripts.forEach((src, i) => {
    let err = null
    try { new vm.Script(src, { filename: `${page}#${i}` }) } catch (e) { err = e }
    ok(!err, `${page}: script ${i} parses${err ? ' — ' + err.message : ''}`)
  })
  ok(/<html[^>]*\blang=/.test(html), `${page}: <html lang> set`)
  ok(/name="viewport"/.test(html), `${page}: viewport meta`)
}

const owner = readFileSync(new URL('owner.html', dir), 'utf8')
ok(/id="gate"[^>]*role="dialog"/.test(owner), 'owner: gate is a dialog')
ok(/id="pin"[^>]*aria-label=/.test(owner), 'owner: PIN input labelled')
ok(/id="gate-err"[^>]*role="alert"/.test(owner), 'owner: gate errors announced')
ok(/\$\('pin'\)\.addEventListener\('keydown'[\s\S]{0,80}Enter/.test(owner), 'owner: Enter submits PIN')

console.log(`\n${pass} PASS, ${fail} FAIL`)
process.exit(fail ? 1 : 0)
