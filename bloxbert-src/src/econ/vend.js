import { buyChance, buyCount } from '../data/econ.js'
export function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0
    let t = Math.imul(a ^ a >>> 15, 1 | a)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}
export function dayNum(iso) {
  return Math.floor(Date.parse(iso + 'T00:00:00') / 86400000)
}
export function visit(counter, seed, day, visitN, itemBase) {
  const rand = mulberry32((seed ^ dayNum(day) ^ counter ^ visitN) >>> 0)
  const slots = counter.slots.map((s, i) => s && s.n ? i : -1).filter((i) => i >= 0)
  if (!slots.length) return null
  const i = slots[Math.floor(rand() * slots.length)]
  const slot = counter.slots[i]
  const chance = buyChance(slot.price, itemBase(slot.item))
  if (rand() > chance) return null
  const n = Math.min(slot.n, buyCount(slot.price, itemBase(slot.item)))
  if (!n) return null
  return { i, item: slot.item, n, cogs: slot.price * n }
}
