export function canMake(recipe, bag, near) {
  if (recipe.at === 'bench' && !near.bench) return { ok: false, why: 'bench' }
  if (recipe.at === 'oven' && !near.oven) return { ok: false, why: 'oven' }
  for (const [item, n] of recipe.in) if (bag.count(item) < n) return { ok: false, why: 'count', item, need: n }
  return { ok: true }
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
