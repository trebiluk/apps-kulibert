import '../packs/farm/pack.js'
import '../packs/flora/pack.js'
import { packRecipes } from '../packs/registry.js'
export const RECIPES = [
  { id: 'planks', at: 'hand', in: [['log', 1]], out: ['planks', 4], secs: 0 },
  { id: 'workbench', at: 'hand', in: [['plankAny', 4]], out: ['workbench', 1], secs: 2 },
  { id: 'ice', at: 'hand', in: [['snow', 4]], out: ['ice', 1], secs: 0 },
  { id: 'oven', at: 'bench', in: [['stoneAny', 8]], out: ['oven', 1], secs: 10 },
  { id: 'brickGrey', at: 'bench', in: [['stone', 2]], out: ['brickGrey', 2], secs: 2 },
  { id: 'vend', at: 'bench', in: [['plankAny', 6], ['glass', 1]], out: ['vend', 1], secs: 10 },
  { id: 'bunk', at: 'bench', in: [['plankAny', 3], ['woolBlue', 3]], out: ['bunk', 1], secs: 5 },
  { id: 'box', at: 'bench', in: [['plankAny', 8]], out: ['box', 1], secs: 4 },
  { id: 'woodTool', at: 'bench', in: [['plankAny', 5]], out: ['woodTool', 1], secs: 2 },
  { id: 'stoneTool', at: 'bench', in: [['stone', 3], ['plankAny', 2]], out: ['stoneTool', 1], secs: 4 },
  { id: 'door', at: 'bench', in: [['plankAny', 6]], out: ['door', 1], secs: 3 },
  { id: 'stick', at: 'bench', in: [['plankAny', 2]], out: ['stick', 4], secs: 1 },
  { id: 'safetyGlasses', at: 'bench', in: [['glass', 2], ['stick', 1]], out: ['safetyGlasses', 1], secs: 2 },
  { id: 'measuringTape', at: 'bench', in: [['ironIngot', 1], ['woolAny', 1]], out: ['measuringTape', 1], secs: 2 },
  { id: 'handSaw', at: 'bench', in: [['ironIngot', 1], ['stick', 1]], out: ['handSaw', 1], secs: 2 },
  { id: 'hammer', at: 'bench', in: [['ironIngot', 1], ['stick', 1], ['plankAny', 1]], out: ['hammer', 1], secs: 2 },
  { id: 'woodshop', at: 'bench', in: [['plankAny', 4], ['log', 2], ['ironIngot', 1]], out: ['woodshop', 1], secs: 4 },
  { id: 'doorGlass', at: 'bench', in: [['glass', 4], ['plankAny', 2]], out: ['doorGlass', 1], secs: 3 },
  { id: 'pushButton', at: 'bench', tier: 'T1', in: [['plankAny', 1]], out: ['pushButton', 1], secs: 1 },
  { id: 'lever', at: 'bench', tier: 'T2', in: [['stick', 1], ['stone', 1]], out: ['lever', 1], secs: 2 },
  { id: 'smelter', at: 'bench', tier: 'T4', in: [['brickRed', 8], ['ironOre', 1], ['coal', 1]], out: ['smelter', 1], secs: 8 },
  { id: 'ironIngot', at: 'smelter', tier: 'T4', in: [['ironOre', 1]], out: ['ironIngot', 1], secs: 4 },
  { id: 'copperIngot', at: 'smelter', tier: 'T4', in: [['copperOre', 1]], out: ['copperIngot', 1], secs: 4 },
  { id: 'zincIngot', at: 'smelter', tier: 'T4', in: [['zincOre', 1]], out: ['zincIngot', 1], secs: 4 },
  { id: 'steel', at: 'forge', tier: 'T4', in: [['ironIngot', 1], ['coal', 1]], out: ['steel', 1], secs: 4 },
  { id: 'copperWire', at: 'forge', tier: 'T4', in: [['copperIngot', 1]], out: ['copperWire', 4], secs: 2 },
  { id: 'doorMetal', at: 'forge', tier: 'T4', in: [['steel', 6]], out: ['doorMetal', 1], secs: 4 },
  { id: 'fabricator', at: 'forge', tier: 'T5', in: [['steel', 4], ['copperWire', 2], ['glass', 1], ['batteryCell', 1]], out: ['fabricator', 1], secs: 8 },
  { id: 'batteryCell', at: 'fabricator', tier: 'T5', in: [['copperIngot', 1], ['zincIngot', 1]], out: ['batteryCell', 2], secs: 4 },
  { id: 'doorSliding', at: 'fabricator', tier: 'T5', in: [['glass', 4], ['steel', 2], ['copperWire', 1]], out: ['doorSliding', 1], secs: 5 },
  { id: 'lantern', at: 'fabricator', tier: 'T5', in: [['glass', 1], ['steel', 1], ['batteryCell', 1]], out: ['lantern', 1], secs: 4 },
  { id: 'charger', at: 'fabricator', tier: 'T5', in: [['steel', 1], ['copperWire', 1]], out: ['charger', 1], secs: 3 },
  { id: 'glass', at: 'oven', in: [['sand', 2]], out: ['glass', 1], secs: 5 },
  { id: 'brickRed', at: 'oven', in: [['redSand', 2]], out: ['brickRed', 1], secs: 5 },
]
function mountFarmRecipes() {
  const farm = packRecipes()
  const hoe = farm.find((r) => r.id === 'hoe')
  if (hoe) {
    const { after, ...row } = hoe
    const i = RECIPES.findIndex((r) => r.id === (after || 'stick'))
    RECIPES.splice(i < 0 ? RECIPES.length : i + 1, 0, row)
  }
  for (const id of ['cupcake', 'bread', 'flour']) {
    const row = farm.find((r) => r.id === id)
    if (!row) continue
    const { after, ...rest } = row
    RECIPES.push(rest)
  }
  for (const id of ['birchPlanks', 'pinePlanks']) {
    if (RECIPES.some((r) => r.id === id)) continue
    const row = packRecipes().find((r) => r.id === id)
    if (row) RECIPES.push(row)
  }
}
mountFarmRecipes()

// Woodshop Bed. Planks plus 3 wool of one colour. The bench bunk above stays when Woodshop required is off.
export const BED_SHOP = { planks: 3, wool: 3, boards: [4, 7, 5] }
