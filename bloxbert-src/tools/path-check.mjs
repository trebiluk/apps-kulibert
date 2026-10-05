import { coalHere, plantHere } from '../src/worldgen.js'
import { dropOf } from '../src/data/items.js'
import { RECIPES } from '../src/data/recipes.js'

let coal = 0
let cells = 0
for (let x = 40; x < 56; x++) for (let z = 40; z < 56; z++) for (let y = -12; y <= -3; y++) {
  cells++
  if (coalHere(x, y, z)) coal++
}
if (coal < 8) throw new Error('a small pit found only ' + coal + ' coal')
if (coal > cells / 2) throw new Error('coal is too common, ' + coal + ' of ' + cells)

let wheat = 0
let wool = 0
for (let x = 40; x < 120; x++) for (let z = 40; z < 120; z++) {
  const p = plantHere(x, 6, z, 5, false)
  if (p === 'wheat') wheat++
  if (String(p).startsWith('wool')) wool++
}
let reed = 0
for (let x = 40; x < 80; x++) for (let z = 40; z < 80; z++) {
  if (plantHere(x, 2, z, 1, false) === 'reed') reed++
}
if (!wheat || !wool || !reed) throw new Error('plants missing wheat ' + wheat + ' wool ' + wool + ' reed ' + reed)
if (plantHere(2, 6, 2, 5, true)) throw new Error('the town grew a plant')
if (dropOf(28) !== 'flour' || dropOf(29) !== 'sugar' || dropOf(31) !== 'door' || dropOf(5) !== 'coal') throw new Error('drops')
const door = RECIPES.find((r) => r.id === 'door')
if (!door || door.at !== 'bench' || door.in[0][0] !== 'planks' || door.in[0][1] !== 6) throw new Error('door recipe')
console.log('path-check ok', coal, 'coal', wheat, 'wheat', wool, 'wool', reed, 'reed')
