// One shared loot list. Rolls come from play only: never from Cogs, the shop, or TechCash.
// boss rows are cosmetic. They do not change boss drops.
export const LOOT_ROWS = [
  { table: 'wild_bush', item: 'berry', weight: 4, min: 1, max: 2 },
  { table: 'wild_bush', item: 'bushSprout', weight: 1, min: 1, max: 1 },
  { table: 'supply_chest', item: 'scrap', weight: 60, min: 2, max: 4 },
  { table: 'supply_chest', item: 'stick', weight: 25, min: 1, max: 3 },
  { table: 'supply_chest', item: 'berry', weight: 10, min: 1, max: 2 },
  { table: 'supply_chest', item: 'coal', weight: 5, min: 1, max: 1 },
  { table: 'mob_scrap', item: 'scrap', weight: 70, min: 1, max: 2 },
  { table: 'mob_scrap', item: 'stick', weight: 30, min: 1, max: 1 },
  { table: 'boss', item: 'foundryTrim', weight: 1, min: 1, max: 1 },
]

export function rowsOf(table) {
  return LOOT_ROWS.filter((r) => r.table === table)
}

function mix(n, salt) {
  return (Math.imul(n ^ (salt | 0), 2246822519) ^ Math.imul(salt | 0, 374761393)) >>> 0
}

// Same hash the old wildBushLoot used, so a bush still drops the same berries.
function bushHash(x, y, z) {
  return (Math.imul(x | 0, 2246822519) ^ Math.imul(y | 0, 3266489917) ^ Math.imul(z | 0, 668265263) ^ Math.imul(68, 374761393)) >>> 0
}

export function supplySeed(x, y, z, alias) {
  let h = (Math.imul(x | 0, 2246822519) ^ Math.imul(y | 0, 3266489917) ^ Math.imul(z | 0, 668265263)) >>> 0
  const s = String(alias || '')
  for (let i = 0; i < s.length; i++) h = mix(h ^ s.charCodeAt(i), i + 1)
  return h
}

function countIn(row, h) {
  const min = row.min | 0
  const max = row.max | 0
  const span = Math.max(0, max - min)
  if (!span) return min
  return min + ((h >>> 0) % (span + 1))
}

export function rollWildBush(x, y, z) {
  const h = bushHash(x, y, z)
  const rows = rowsOf('wild_bush')
  const berry = rows.find((r) => r.item === 'berry') || { min: 1, max: 2 }
  const out = [{ item: 'berry', n: countIn(berry, h) }]
  const sprout = rows.find((r) => r.item === 'bushSprout')
  // weight 1 keeps the old "1 time in 4" sprout
  if (sprout && ((h >>> 3) % 4) < (sprout.weight | 0)) out.push({ item: 'bushSprout', n: sprout.min | 0 || 1 })
  return out
}

export function rollWeighted(table, seed) {
  const rows = rowsOf(table)
  if (!rows.length || table === 'boss') return null
  const total = rows.reduce((s, r) => s + (r.weight | 0), 0)
  if (!total) return null
  let pick = (seed >>> 0) % total
  let row = rows[rows.length - 1]
  for (const r of rows) {
    if (pick < (r.weight | 0)) { row = r; break }
    pick -= r.weight | 0
  }
  return { item: row.item, n: countIn(row, mix(seed, 91)) }
}

export function rollSupply(x, y, z, alias) {
  return rollWeighted('supply_chest', supplySeed(x, y, z, alias))
}

export function lootLines(table) {
  const rows = rowsOf(table)
  const total = rows.reduce((s, r) => s + (r.weight | 0), 0) || 1
  return rows.map((r) => {
    const pct = Math.round(((r.weight | 0) / total) * 100)
    const rarity = pct >= 40 ? 'common' : pct >= 15 ? 'uncommon' : 'rare'
    const shape = rarity === 'common' ? 'round' : rarity === 'uncommon' ? 'square' : 'diamond'
    return { item: r.item, pct, rarity, shape, min: r.min | 0, max: r.max | 0 }
  })
}
