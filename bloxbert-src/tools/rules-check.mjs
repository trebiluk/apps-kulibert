// World rules R1. Pure, no browser.
import { Rules, ALIASES } from '../src/rules.js'

const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg) }

const langs = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']
const scripts = {
  en: /[A-Za-z]/, es: /[A-Za-zÁÉÍÓÚáéíóúñ]/, rw: /[A-Za-z]/,
  uk: /[А-Яа-яІіЇїЄєҐґ]/, ru: /[А-Яа-яЁё]/,
  ar: /[\u0600-\u06FF]/, 'fa-AF': /[\u0600-\u06FF]/, ti: /[\u1200-\u137F]/,
}

eq(Object.keys(Rules.dump()).length === 0, 'dump of defaults is {} ' + JSON.stringify(Rules.dump()))
eq(Rules.allow(null, 'core.break', {}).ok === true, 'break starts on')
eq(Rules.allow({ admin: true }, 'core.place', { teacher: true }).ok === true, 'place starts on')
eq(Rules.allow(null, 'core.fly').ok === true, 'fly default is today')

Rules.set('core.break', false)
Rules.set('core.craft', false)
const dumped = Rules.dump()
eq(dumped['core.break'] === false && dumped['core.craft'] === false && dumped['core.place'] == null && dumped['core.fly'] == null, 'dump only changes ' + JSON.stringify(dumped))
const round = JSON.parse(JSON.stringify(dumped))
Rules.load({})
eq(Object.keys(Rules.dump()).length === 0 && Rules.allow(null, 'core.break').ok === true, 'empty load is defaults')
Rules.load(round)
eq(Rules.allow(null, 'core.break').ok === false && Rules.allow(null, 'core.craft').ok === false && Rules.allow(null, 'core.place').ok === true, 'load round trip')
eq(JSON.stringify(Rules.dump()) === JSON.stringify(round), 'dump matches loaded')
eq(JSON.stringify(round) === JSON.stringify(dumped), 'load did not mutate the saved object')

Rules.set('core.break', true)
eq(Rules.dump()['core.break'] == null && Rules.allow(null, 'core.break').ok === true, 'set back to default drops the key')

Rules.load({ 'core.place': false, 'pack.future.glow': 3, 'pack.future.flag': false })
eq(Rules.dump()['pack.future.glow'] === 3 && Rules.dump()['pack.future.flag'] === false, 'unknown ids survive ' + JSON.stringify(Rules.dump()))
eq(Rules.allow(null, 'pack.future.flag').ok === false, 'unknown false is off')
eq(Rules.allow(null, 'pack.future.glow').ok === true, 'unknown other value stays allowed')
eq(Rules.allow(null, 'core.place', { kind: 'oven' }).ok === false, 'place off')
const again = Rules.dump()
Rules.load(again)
eq(again['pack.future.glow'] === 3 && Rules.dump()['pack.future.glow'] === 3, 'unknown survives a second load')

for (const id of ['core.break', 'core.place', 'core.craft', 'core.station.open', 'core.fly']) {
  const seen = new Set()
  for (const lang of langs) {
    const line = Rules.why(id, lang)
    eq(!!line && scripts[lang].test(line), id + ' ' + lang + ' toast ' + line)
    if (lang !== 'en') seen.add(line)
  }
  eq(seen.size >= 6, id + ' translations differ')
}

ALIASES['old.break'] = 'core.break'
Rules.load({})
Rules.set('old.break', false)
eq(Rules.allow(null, 'old.break').ok === false && Rules.allow(null, 'core.break').ruleId === 'core.break', 'alias allow')
eq(Rules.dump()['core.break'] === false && Rules.dump()['old.break'] == null, 'alias stores the permanent id')
delete ALIASES['old.break']
Rules.load({})

eq(Rules.allow({ team: 'teacher' }, 'core.station.open', { kind: 'oven' }).ok === true, 'teacher does not bypass')

if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('rules-check ok')
