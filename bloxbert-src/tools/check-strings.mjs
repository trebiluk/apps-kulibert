// Fail the build if a language is missing a key, copies English, uses the wrong script, or says ON/OFF.
// Every EXTRA.en key is checked after strings-extra.js merges the packs.
// Problems already listed in strings-known.json do not fail the build. New ones do.
import { readFileSync, readdirSync } from 'fs'
import { pathToFileURL } from 'url'
import { EXTRA } from '../src/strings-extra.js'
import { STR } from '../src/strings.js'

const scripts = {
  es: /[A-Za-zÁÉÍÓÚáéíóúñ¿¡]/, rw: /[A-Za-z']/,
  uk: /[А-Яа-яІіЇїЄєҐґ]/, ru: /[А-Яа-яЁё]/,
  ar: /[\u0600-\u06FF]/, 'fa-AF': /[\u0600-\u06FF]/, ti: /[\u1200-\u137F]/,
}
const names = /Bertopia|Bertyville|Tally|Kulibert|PvP|WASD|PIN|Tab|Space|Esc|⚙/
const CYR = /[\u0400-\u04FF]/
const ARAB = /[\u0600-\u06FF]/
const ETHI = /[\u1200-\u137F]/
const LATIN = /[A-Za-z]/
const ON_OFF = /(?:^|[^\p{L}\p{N}_])(?:ON|OFF)(?=[^\p{L}\p{N}_]|$)/u

function plain(v) {
  return String(v).replace(/\{[^}]*\}/g, ' ').replace(new RegExp(names.source, 'g'), ' ')
}

// rw/es stay Latin. uk/ru stay Cyrillic. ar/fa-AF stay Arabic. ti stays Ethiopic.
// en must not be another language. Placeholders and proper names are not foreign words.
export function wrongScript(lang, raw) {
  const v = plain(raw)
  if (lang === 'en' || lang === 'es' || lang === 'rw') return CYR.test(v) || ARAB.test(v) || ETHI.test(v)
  if (lang === 'uk' || lang === 'ru') return LATIN.test(v) || ARAB.test(v) || ETHI.test(v)
  if (lang === 'ar' || lang === 'fa-AF') return LATIN.test(v) || CYR.test(v) || ETHI.test(v)
  if (lang === 'ti') return LATIN.test(v) || CYR.test(v) || ARAB.test(v)
  return false
}

export function collectProblems() {
  const found = []
  const en = EXTRA.en
  const watch = Object.keys(en)
  const hit = (lang, reason, key) => found.push({ key, lang, reason })
  for (const key of watch) {
    const ev = en[key]
    if (ev && wrongScript('en', ev)) hit('en', 'wrong script', key)
  }
  for (const lang of Object.keys(EXTRA)) {
    if (lang === 'en' || lang === 'simple') continue
    for (const key of watch) {
      const v = EXTRA[lang][key]
      if (!v) { hit(lang, 'missing', key); continue }
      if (v === en[key] && !names.test(v) && key !== 'whatsNewBody') hit(lang, 'copies en', key)
      const re = scripts[lang]
      if ((re && !re.test(v) && !names.test(v)) || wrongScript(lang, v)) hit(lang, 'wrong script', key)
      if (ON_OFF.test(String(v))) hit(lang, 'on-off', key)
    }
  }
  const used = new Set()
  for (const f of readdirSync('src').filter((f) => f.endsWith('.js'))) {
    const text = readFileSync('src/' + f, 'utf8')
    for (const m of text.matchAll(/t\('([A-Za-z0-9]+)'\)/g)) used.add(m[1])
  }
  const skip = new Set(['p', 'a', 'q', 'div', 'span', 'button', 'canvas', 'on', 'off', 'webgl2', 'scale', 'lang', 'img', '2d', 'style'])
  for (const key of used) {
    if (!skip.has(key) && !en[key] && !(STR.en && STR.en[key])) hit('en', 'no en entry', key)
  }
  found.sort((a, b) => (a.lang + a.key + a.reason).localeCompare(b.lang + b.key + b.reason))
  return found
}

function main() {
  const en = EXTRA.en
  const found = collectProblems()
  const knownPath = new URL('./strings-known.json', import.meta.url)
  const known = JSON.parse(readFileSync(knownPath, 'utf8'))
  const knownSet = new Set(known.map((r) => r.lang + '\t' + r.key + '\t' + r.reason))
  let problems = 0
  for (const row of found) {
    const id = row.lang + '\t' + row.key + '\t' + row.reason
    if (knownSet.has(id)) continue
    console.error(row.lang, row.reason, row.key)
    problems++
  }
  console.log('checked', Object.keys(en).length, 'keys in', Object.keys(EXTRA).length, 'languages')
  console.log('known', known.length)
  if (problems) {
    console.error('strings:', problems, 'problems')
    process.exit(1)
  }
  console.log('strings: 0 problems')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main()
