// School-bundle leak check (docs/bertopia/HOME-HOST.md §2). The student doors must carry nothing of the personal host:
// no hosting UI words, no join/session-code strings, no owner keys, no ws:// or localhost origins, no host that is not
// *.kulibert.net. Run by build.mjs after every non-home build, and on demand:
//   node tools/home-leak-check.mjs [outDir ...]      (default: ../bertopia ../blocks ../blocks-test, those that exist)
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const HERE = path.dirname(fileURLToPath(import.meta.url))
const dirs = (process.argv.slice(2).length ? process.argv.slice(2) : ['../bertopia', '../blocks', '../blocks-test']).map((d) => path.resolve(HERE, '..', d)).filter((d) => existsSync(path.join(d, 'app.js')))

// Words and keys that exist only in the home build. Keep this list in step with the home strings (homeStrings in main.js).
const WORDS = [/join code/i, /session code/i, /homeOwnerOn/, /home-host/i, /bertopia-home/, /hostOwner[A-Z]/, /sessionCode[A-Z]/, /homeJoin[A-Z]/, /"iss":"home"/, /adults 18\+/i, /personal host/i, /__HOME_HOST__/, /homeBossTick/, /hc-panel/, /chat\.typed/, /Typed chat/, /\.bertopia-world/]
// Origins: anything ws:// (the school only ever uses wss), plain localhost/127.0.0.1 hosts, and any absolute http(s)/wss host outside kulibert.net.
const ORIGINS = [/\bws:\/\//, /https?:\/\/localhost[:/]/, /https?:\/\/127\.0\.0\.1/]
const HOST_RE = /\b(?:https?|wss):\/\/([a-z0-9.-]+)/gi
const ALLOW_HOST = (h) => h === 'kulibert.net' || h.endsWith('.kulibert.net') || h === 'localhost' || h === '127.0.0.1'
// Hosts that already appear in the student build for known, reviewed reasons (licences, engine docs). Add with care.
const KNOWN = new Set(['github.com', 'www.w3.org', 'kenney.nl', 'www.kenney.nl', 'opensource.org', 'creativecommons.org', 'unpkg.com', 'cdn.jsdelivr.net', 'fonts.googleapis.com', 'developer.mozilla.org', 'babylonjs.com', 'www.babylonjs.com', 'doc.babylonjs.com', 'playground.babylonjs.com', 'forum.babylonjs.com', 'raw.githubusercontent.com', 'registry.npmjs.org', 'schemas.microsoft.com', 'schemas.openxmlformats.org', 'www.apache.org', 'cdn.babylonjs.com', 'snippet.babylonjs.com', 'fenomas.com', 'feross.org'])  // the last four: Babylon/noa engine strings and a licence link, present in the student build since 2.0

let bad = 0
for (const d of dirs) {
  for (const f of ['app.js', 'index.html', 'sw.js']) {
    const p = path.join(d, f); if (!existsSync(p)) continue
    const src = readFileSync(p, 'utf8')
    for (const re of WORDS) { const m = re.exec(src); if (m) { console.error(`LEAK  ${path.relative(HERE + '/..', p)}: home word ${re} at ${m.index}: …${src.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ')}…`); bad++ } }
    for (const re of ORIGINS) { const m = re.exec(src); if (m) { console.error(`LEAK  ${path.relative(HERE + '/..', p)}: origin ${re}: …${src.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ')}…`); bad++ } }
    const hosts = new Set(); let m
    while ((m = HOST_RE.exec(src))) { const h = m[1].toLowerCase(); if (!ALLOW_HOST(h) && !KNOWN.has(h)) hosts.add(h) }
    for (const h of hosts) { console.error(`LEAK  ${path.relative(HERE + '/..', p)}: host outside kulibert.net: ${h}`); bad++ }
  }
}
if (!dirs.length) { console.log('home-leak-check: no student build found to check'); process.exit(0) }
console.log(bad ? `home-leak-check: ${bad} FAIL in ${dirs.map((d) => path.basename(d)).join(', ')}` : `home-leak-check: clean (${dirs.map((d) => path.basename(d)).join(', ')})`)
process.exit(bad ? 1 : 0)
