import { gateOpen } from './data/gates.js'
import { ITEMS } from './data/items.js'
import { RECIPES } from './data/recipes.js'
const WOOL = ['woolBlue', 'woolGreen', 'woolRed', 'woolTan']
const STONE = ['stone', 'coal']
const PLANKS = ['planks', 'birchPlanks', 'pinePlanks']
export function isWool(item) { return WOOL.indexOf(item) >= 0 }
export function isStone(item) { return STONE.indexOf(item) >= 0 }
export function isPlank(item) { return PLANKS.indexOf(item) >= 0 }
export function anyList(item) {
  if (item === 'woolAny') return WOOL
  if (item === 'stoneAny') return STONE
  if (item === 'plankAny') return PLANKS
  return null
}
// 0065: metal only comes from the smelter (tier T4). A recipe that needs metal directly, or needs an item that is
// itself made from metal, is locked until T4 opens, instead of showing as "almost" forever.
const METAL = ['ironIngot', 'copperIngot', 'zincIngot', 'steel']
const metalMemo = new Map()
export function needsMetal(recipe, recipes) {
  if (!recipe || !Array.isArray(recipe.in)) return false
  const key = recipe.id || ''
  if (key && metalMemo.has(key)) return metalMemo.get(key)
  let hit = recipe.in.some(([item]) => METAL.indexOf(item) >= 0)
  const list = Array.isArray(recipes) ? recipes : RECIPES
  if (!hit) {
    for (const [item] of recipe.in) {
      const maker = list.find((r) => r && r.out && r.out[0] === item)
      if (maker && maker.in.some(([k]) => METAL.indexOf(k) >= 0)) { hit = true; break }
    }
  }
  if (key) metalMemo.set(key, hit)
  return hit
}
export function resetMetalMemo() { metalMemo.clear() }
// Woodshop floor lamp and wall lamp are not in the Crafting book. One check on the DECOR inputs:
// any metal ingredient stays locked until T4 opens. Rug inputs are wool, so they stay out of this.
export function decorMetalLocked(ins, creative) {
  if (gateOpen('T4', !!creative)) return false
  return Array.isArray(ins) && ins.some((row) => row && METAL.indexOf(row[0]) >= 0)
}
export function countOf(bag, item) {
  if (!bag || !bag.count) return 0
  const list = anyList(item)
  if (!list) return bag.count(item) || 0
  let n = 0
  for (const k of list) n += bag.count(k) || 0
  return n
}
function takeOf(bag, item, n) {
  const list = anyList(item)
  if (!list) return bag.take(item, n) ? [[item, n]] : null
  let left = n
  const spent = []
  for (const k of list) {
    const have = bag.count(k) || 0
    if (!have || left <= 0) continue
    const d = Math.min(have, left)
    if (!bag.take(k, d)) break
    spent.push([k, d])
    left -= d
  }
  if (left > 0) {
    for (const [k, d] of spent) bag.add(k, d)
    return null
  }
  return spent
}
export function craftStatus(recipe, bag, near, creative, recipes) {
  const needs = []
  let missing = 0
  for (const [item, n] of recipe.in) {
    const have = countOf(bag, item)
    if (have < n) missing++
    needs.push([item, have, n])
  }
  const station = recipe.at === 'bench' && !near.bench ? 'bench'
    : recipe.at === 'oven' && !near.oven ? 'oven'
    : recipe.at === 'smelter' && !near.smelter ? 'smelter'
    : recipe.at === 'forge' && !near.forge ? 'forge'
    : recipe.at === 'fabricator' && !near.fabricator ? 'fabricator' : ''
  let gate = recipe.tier && !gateOpen(recipe.tier, !!creative) ? recipe.tier : ''
  if (!gate && !gateOpen('T4', !!creative) && needsMetal(recipe, recipes)) gate = 'metal' // 0065
  const bakeOnly = recipe.id === 'bread'
  const ok = !station && missing === 0 && !gate && !bakeOnly
  let group = gate ? 'gated' : ok ? 'now' : missing <= 2 ? 'almost' : 'rest'
  // Cupcake is the only ungated recipe with 3 inputs, so missing > 2 hid it in Show all.
  if (recipe.id === 'cupcake' && !gate && group === 'rest') group = 'almost'
  return { ok, missing, station, needs, group, gate, bakeOnly }
}
export function canMake(recipe, bag, near) {
  const st = craftStatus(recipe, bag, near)
  if (st.bakeOnly) return { ok: false, why: 'oven' }
  if (st.ok) return { ok: true }
  if (st.station) return { ok: false, why: st.station }
  const miss = st.needs.find(([, have, n]) => have < n)
  return { ok: false, why: 'count', item: miss && miss[0], need: miss && miss[2] }
}
export function maxTimes(recipe, bag) {
  if (recipe.id === 'bread') return 0
  let n = 64
  for (const [item, need] of recipe.in) n = Math.min(n, Math.floor(countOf(bag, item) / need))
  return n > 0 ? n : 0
}
// How many of each ingredient Fill moves into the tray. Never a craft.
export function fillTakes(recipe, count, placed) {
  return recipe.in.map(([item, n], i) => {
    const room = n - (placed[i] || 0)
    if (room <= 0) return 0
    const have = count(item) || 0
    return have > 0 ? Math.min(have, room) : 0
  })
}
// What ×Max would make, counted before anything is spent.
export function maxPlan(recipe, count) {
  const n = maxTimes(recipe, { count: (item) => count(item) || 0 })
  const uses = recipe.in.map(([item, need]) => [item, need * n])
  return { n, uses }
}
export function placeResult(bag, item, n, hot) {
  const cap = (ITEMS[item] && ITEMS[item].stack) || 64
  let left = n
  let pocket = -1
  const note = (i) => { if (i >= 9 && pocket < 0) pocket = i }
  const stackAt = (i) => {
    const s = bag.slots[i]
    if (!s || s.item !== item || s.n >= cap || left <= 0) return
    const take = Math.min(cap - s.n, left)
    s.n += take
    left -= take
    note(i)
  }
  const emptyAt = (i) => {
    if (i < 0 || bag.slots[i] || left <= 0) return
    const take = Math.min(cap, left)
    bag.slots[i] = { item, n: take }
    left -= take
    note(i)
  }
  const h = Number.isInteger(hot) ? hot : -1
  if (h >= 0 && h < 9) {
    if (!bag.slots[h]) emptyAt(h)
    else stackAt(h)
  }
  for (let i = 0; i < 9; i++) if (i !== h) stackAt(i)
  for (let i = 0; i < 9; i++) emptyAt(i)
  for (let i = 9; i < bag.slots.length; i++) stackAt(i)
  for (let i = 9; i < bag.slots.length; i++) emptyAt(i)
  return { left, pocket }
}
export function make(recipe, bag, hot) {
  if (recipe.id === 'bread') return false
  const spent = []
  for (const [item, n] of recipe.in) {
    const got = takeOf(bag, item, n)
    if (!got) {
      for (const [k, d] of spent) bag.add(k, d)
      return false
    }
    for (const row of got) spent.push(row)
  }
  const spot = placeResult(bag, recipe.out[0], recipe.out[1], hot)
  if (spot.left) {
    for (const [k, d] of spent) bag.add(k, d)
    const placed = recipe.out[1] - spot.left
    if (placed > 0) bag.take(recipe.out[0], placed)
    return false
  }
  return { ok: true, pocket: spot.pocket }
}
