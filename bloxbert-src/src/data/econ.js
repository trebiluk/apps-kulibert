// Practice prices. Whole numbers only. Commons are not sellable.
export const ECON = {
  start: 20, buyRate: 0.7, sellRate: 1.1, drop: 0.03, floorF: 0.5, dailyCap: 20, dial: 1,
  storeSells: ['flour', 'sugar', 'woolBlue', 'woolRed'],
  townsfolk: { on: true, everySec: 30, range: 64, maxPerCounterPerDay: 20 },
}
export function pays(item, sold, dial, cfg = ECON) {
  if (!item || !item.sell || !item.base) return 0
  const scale = Math.max(cfg.floorF, 1 - cfg.drop * (sold || 0))
  return Math.max(1, Math.floor(item.base * cfg.buyRate * (dial || 1) * scale))
}
export function sells(item, dial, cfg = ECON) {
  if (!item || !item.base) return 0
  return Math.ceil(item.base * cfg.sellRate * (dial || 1))
}
export function buyChance(price, base) {
  if (!base) return 0
  const r = price / base
  if (r <= 1) return 0.9
  if (r <= 1.25) return 0.6
  if (r <= 1.5) return 0.35
  if (r <= 2) return 0.1
  return 0
}
export function buyCount(price, base) {
  if (!base) return 1
  return price / base <= 0.8 ? 2 : 1
}
