// Brief 0065: metal recipes show locked (not "almost") until T4 opens; belt benches accept plankAny/stoneAny/woolAny.
import { craftStatus, needsMetal, anyList } from '../src/craft.js'
import { RECIPES } from '../src/data/recipes.js'
import { beltRecipeOk, craftOnce } from '../src/conveyor.js'
import { setGate } from '../src/data/gates.js'
let fails = 0
const ok = (name, c, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? ' ' + d : '')) }
const bagOf = (obj) => ({ count: (k) => obj[k] || 0 })
const near = { bench: true, oven: true, smelter: false, forge: false, fabricator: false }
const byId = (id) => RECIPES.find((r) => r.id === id)

// 1) the seven metal dead-ends are gated in Survival, never "almost"
for (const id of ['sewing', 'measuringTape', 'handSaw', 'hammer', 'woodshop']) {
  const r = byId(id)
  const st = craftStatus(r, bagOf({ planks: 64, stick: 64, woolBlue: 64, glass: 64 }), near, false)
  ok(id + ' survival: gated "metal"', st.gate === 'metal' && st.group === 'gated' && !st.ok, st.gate + '/' + st.group)
}
ok('needsMetal one step back (something made from an ingot)', needsMetal({ id: 'x', in: [['handSaw', 1]] }, [...RECIPES]))
ok('needsMetal false for planks', !needsMetal(byId('planks')))

// 2) T1/T2 recipes unchanged
for (const id of ['planks', 'workbench', 'stick', 'woodTool', 'stoneTool', 'door', 'chair', 'box', 'conveyor', 'lever', 'pushButton', 'glass', 'oven']) {
  const r = byId(id)
  const st = craftStatus(r, bagOf({ log: 64, planks: 64, stick: 64, stone: 64, woolBlue: 64, glass: 64, sand: 64 }), near, false)
  ok(id + ' survival: ok, not gated', st.ok && !st.gate, st.gate)
}
// 3) Creative shows and makes every recipe (no gate anywhere)
ok('creative: nothing gated', RECIPES.every((r) => !craftStatus(r, bagOf({}), near, true).gate))
// 4) T4 open -> metal recipes are plain "almost"/"now" again
setGate('T4', true)
ok('T4 open: hammer not gated', !craftStatus(byId('hammer'), bagOf({}), near, false).gate)
setGate('T4', false)

// 5) belt alias
ok('anyList exported', Array.isArray(anyList('plankAny')) && anyList('planks') === null)
const bench = byId('workbench')
ok('belt: 4 birch planks make a workbench', beltRecipeOk([{ item: 'birchPlanks', n: 4 }], bench))
ok('belt: 2 planks + 2 pine planks make a workbench', beltRecipeOk([{ item: 'planks', n: 2 }, { item: 'pinePlanks', n: 2 }], bench))
ok('belt: 3 planks do not', !beltRecipeOk([{ item: 'planks', n: 3 }], bench))
ok('belt: literal inputs still literal', beltRecipeOk([{ item: 'log', n: 1 }], byId('planks')) && !beltRecipeOk([{ item: 'birchPlanks', n: 1 }], byId('conveyor')))
// craftOnce spends across alias kinds and leaves the rest
const bin = [{ item: 'planks', n: 1 }, { item: 'pinePlanks', n: 5 }]
const bout = []
const made = craftOnce(bin, bout, [bench])
ok('craftOnce workbench from mixed planks', made === 'workbench' && bout[0] && bout[0].item === 'workbench', made)
ok('craftOnce took 1 planks + 3 pine, left 2 pine', bin.length === 1 && bin[0].item === 'pinePlanks' && bin[0].n === 2, JSON.stringify(bin))
const bin2 = [{ item: 'planks', n: 2 }, { item: 'stick', n: 4 }]
const out2 = []
ok('mixed planks + sticks bin crafts a stick recipe', craftOnce(bin2, out2, [byId('stick')]) === 'stick' && out2[0].n === 4)

// 6) recipes list intact
ok('RECIPES has no duplicate ids', new Set(RECIPES.map((r) => r.id)).size === RECIPES.length)
ok('pack recipes mounted (hoe, flour, techLine)', ['hoe', 'flour', 'techLine'].every(byId))
console.log(fails ? 'craft-gate: ' + fails + ' FAIL' : 'craft-gate: all PASS')
process.exit(fails ? 1 : 0)
