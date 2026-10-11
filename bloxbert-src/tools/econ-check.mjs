// Fails the build if a recipe, price, or name is off.
import { ITEMS } from '../src/data/items.js'
import { RECIPES } from '../src/data/recipes.js'
import { ECON, pays, sells } from '../src/data/econ.js'
import { EXTRA } from '../src/strings-extra.js'
import { STR } from '../src/strings.js'
const langs = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']
const fail = []
for (const r of RECIPES) {
  const inBase = r.in.reduce((n, [k, c]) => n + ((ITEMS[k] && ITEMS[k].base) || (k === 'woolAny' ? 3 : k === 'plankAny' ? 1 : 0)) * c, 0)
  const outBase = (ITEMS[r.out[0]].base || 0) * r.out[1]
  const cap = (inBase + r.secs * 0.4) * 1.25
  if (outBase > cap + 1e-6) fail.push(r.id + ' pays too much ' + outBase + ' > ' + cap)
}
for (const [k, item] of Object.entries(ITEMS)) {
  if (item.sell && pays(item, 0, 1, ECON) >= sells(item, 1, ECON)) fail.push(k + ' pays >= sells')
  if ((item.base === 0 || item.cat === 'common') && item.sell) fail.push(k + ' common is sellable')
  for (const lang of langs) {
    const name = (STR[lang] && STR[lang][k]) || (EXTRA[lang] && EXTRA[lang][k])
    if (!name) fail.push(k + ' missing name ' + lang)
  }
  if (!item.letter) fail.push(k + ' no icon letter')
}
if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('econ-check ok', Object.keys(ITEMS).length, 'items', RECIPES.length, 'recipes')
