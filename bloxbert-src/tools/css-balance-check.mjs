// Every { in read.css and in index.html's <style> blocks has its }. A missing } makes every rule after it a nested
// rule that silently stops matching (it happened three times in merges before 2.5.599). Run by the build checks.
import { readFileSync } from 'node:fs'
let bad = 0
function depthOf(name, css) {
  const s = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/"[^"\n]*"|'[^'\n]*'/g, (m) => ' '.repeat(m.length))
  let d = 0, line = 1, min = 0
  const open = []
  for (const ch of s) {
    if (ch === '\n') line++
    else if (ch === '{') { d++; open.push(line) }
    else if (ch === '}') { d--; open.pop(); if (d < min) min = d }
  }
  if (d !== 0 || min < 0) { bad++; console.log('FAIL ' + name + ' braces off by ' + d + (open.length ? ' (unclosed from line ' + open.slice(-3).join(', ') + ')' : '')) }
  else console.log('PASS ' + name + ' braces balanced')
}
depthOf('read.css', readFileSync(new URL('../read.css', import.meta.url), 'utf8'))
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
let i = 0
for (const m of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) depthOf('index.html <style> #' + (++i), m[1])
process.exit(bad ? 1 : 0)
