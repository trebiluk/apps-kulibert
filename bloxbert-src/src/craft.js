export function craftStatus(recipe, bag, near) {
  const needs = []
  let missing = 0
  for (const [item, n] of recipe.in) {
    const have = bag.count(item)
    if (have < n) missing++
    needs.push([item, have, n])
  }
  const station = recipe.at === 'bench' && !near.bench ? 'bench' : recipe.at === 'oven' && !near.oven ? 'oven' : ''
  const ok = !station && missing === 0
  const group = ok ? 'now' : missing <= 2 ? 'almost' : 'rest'
  return { ok, missing, station, needs, group }
}
export function canMake(recipe, bag, near) {
  const st = craftStatus(recipe, bag, near)
  if (st.ok) return { ok: true }
  if (st.station) return { ok: false, why: st.station }
  const miss = st.needs.find(([, have, n]) => have < n)
  return { ok: false, why: 'count', item: miss && miss[0], need: miss && miss[2] }
}
export function maxTimes(recipe, bag) {
  let n = 64
  for (const [item, need] of recipe.in) n = Math.min(n, Math.floor(bag.count(item) / need))
  return n > 0 ? n : 0
}
export function make(recipe, bag) {
  for (const [item, n] of recipe.in) if (!bag.take(item, n)) return false
  const left = bag.add(recipe.out[0], recipe.out[1])
  if (left) {
    for (const [item, n] of recipe.in) bag.add(item, n)
    bag.take(recipe.out[0], recipe.out[1] - left)
    return false
  }
  return true
}
