import { gateOpen } from './data/gates.js'
export function craftStatus(recipe, bag, near, creative) {
  const needs = []
  let missing = 0
  for (const [item, n] of recipe.in) {
    const have = bag.count(item)
    if (have < n) missing++
    needs.push([item, have, n])
  }
  const station = recipe.at === 'bench' && !near.bench ? 'bench'
    : recipe.at === 'oven' && !near.oven ? 'oven'
    : recipe.at === 'smelter' && !near.smelter ? 'smelter'
    : recipe.at === 'forge' && !near.forge ? 'forge'
    : recipe.at === 'fabricator' && !near.fabricator ? 'fabricator' : ''
  const gate = recipe.tier && !gateOpen(recipe.tier, !!creative) ? recipe.tier : ''
  const bakeOnly = recipe.id === 'bread'
  const ok = !station && missing === 0 && !gate && !bakeOnly
  const group = gate ? 'gated' : ok ? 'now' : missing <= 2 ? 'almost' : 'rest'
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
  for (const [item, need] of recipe.in) n = Math.min(n, Math.floor(bag.count(item) / need))
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
export function make(recipe, bag) {
  if (recipe.id === 'bread') return false
  for (const [item, n] of recipe.in) if (!bag.take(item, n)) return false
  const left = bag.add(recipe.out[0], recipe.out[1])
  if (left) {
    for (const [item, n] of recipe.in) bag.add(item, n)
    bag.take(recipe.out[0], recipe.out[1] - left)
    return false
  }
  return true
}
