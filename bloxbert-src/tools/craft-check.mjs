import { craftStatus, maxTimes } from '../src/craft.js'
import { RECIPES } from '../src/data/recipes.js'

const bag = { count(item) { return this.n[item] || 0 }, n: { log: 3 } }
const near = { bench: false, oven: false }
const planks = RECIPES.find((r) => r.id === 'planks')
const cup = RECIPES.find((r) => r.id === 'cupcake')
const oven = RECIPES.find((r) => r.id === 'oven')
if (craftStatus(planks, bag, near).group !== 'now') throw new Error('planks now')
if (maxTimes(planks, bag) !== 3) throw new Error('max ' + maxTimes(planks, bag))
bag.n = {}
if (craftStatus(planks, bag, near).group !== 'almost') throw new Error('one missing is almost')
if (craftStatus(cup, bag, near).group !== 'rest') throw new Error('three missing is show-all')
bag.n = { stone: 8 }
if (craftStatus(oven, bag, near).group !== 'almost') throw new Error('needs bench is almost')
bag.n = { flour: 1, sugar: 1 }
if (craftStatus(cup, bag, near).group !== 'almost') throw new Error('one ingredient left')
console.log('craft-check ok')
