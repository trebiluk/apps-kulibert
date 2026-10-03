// Fail the build if a language is missing a key, copies English, or uses the wrong script.
import { readFileSync, readdirSync } from 'fs'
import { EXTRA } from '../src/strings-extra.js'
import { STR } from '../src/strings.js'
const scripts = {
  en: /[A-Za-z]/, es: /[A-Za-zÁÉÍÓÚáéíóúñ¿¡]/, rw: /[A-Za-z']/ ,
  uk: /[А-Яа-яІіЇїЄєҐґ]/, ru: /[А-Яа-яЁё]/,
  ar: /[\u0600-\u06FF]/, 'fa-AF': /[\u0600-\u06FF]/, ti: /[\u1200-\u137F]/,
}
const names = /Bertopia|Bertyville|Tally|Kulibert/
let problems = 0
const en = EXTRA.en
const watch = ['changelog','youAreHere','tryThis','next','skip','tour','tourMove','a11y','helpBody','sendTeacher','highContrast','place10','addCoal','bake','sell','buy','fuel','input','output','bag']
for (const lang of Object.keys(EXTRA)) {
  if (lang === 'en') continue
  for (const key of watch) {
    const v = EXTRA[lang][key]
    if (!v) { console.error(lang, 'missing', key); problems++ ; continue }
    if (v === en[key] && !names.test(v) && key !== 'whatsNewBody') { console.error(lang, 'copies en', key); problems++ }
    const re = scripts[lang]
    if (re && !re.test(v) && !names.test(v)) { console.error(lang, 'wrong script', key, v); problems++ }
  }
}
const used = new Set()
for (const f of readdirSync('src').filter((f) => f.endsWith('.js'))) {
  const text = readFileSync('src/' + f, 'utf8')
  for (const m of text.matchAll(/t\('([A-Za-z0-9]+)'\)/g)) used.add(m[1])
}
const skip = new Set(['p','a','q','div','span','button','canvas','on','off','webgl2','scale','lang','img','2d'])
for (const key of used) if (!skip.has(key) && !en[key] && !(STR.en && STR.en[key])) { console.error('no en entry', key); problems++ }
if (problems) { console.error('strings:', problems, 'problems'); process.exit(1) }
console.log('strings: 0 problems')
