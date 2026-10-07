// 20 min cycle: 14 day, 2 dusk, 3 night, 1 dawn. Night never below 40%.
export const CYCLE = 20 * 60 * 1000
export const DAY = 14 * 60 * 1000
export const DUSK = 2 * 60 * 1000
export const NIGHT = 3 * 60 * 1000
export const DAWN = 1 * 60 * 1000
const FLOOR = 0.4
const BRIGHT = 0.6
export function phaseAt(ms) {
  const t = ((ms % CYCLE) + CYCLE) % CYCLE
  if (t < DAY) return { name: 'day', k: 1 }
  if (t < DAY + DUSK) {
    const u = (t - DAY) / DUSK
    return { name: 'dusk', k: 1 - (1 - FLOOR) * u }
  }
  if (t < DAY + DUSK + NIGHT) return { name: 'night', k: FLOOR }
  const u = (t - DAY - DUSK - NIGHT) / DAWN
  return { name: 'dawn', k: FLOOR + (1 - FLOOR) * u }
}
export function skyK(ms, always, bright) {
  if (always) return 1
  const k = phaseAt(ms).k
  return bright ? Math.max(k, BRIGHT) : k
}
export function phaseName(ms, always) {
  if (always) return 'day'
  return phaseAt(ms).name
}
export const LEVELS = ['low', 'med', 'high']
export const RADIUS = { low: 4, med: 7, high: 10, empty: 1 }
export const DRAIN = { low: 8 * 60 * 1000, med: 4 * 60 * 1000, high: 2.5 * 60 * 1000 }
export const CHARGE_SUN = 4 * 60 * 1000
export const CHARGE_PLUG = 2 * 60 * 1000
export function lanternRadius(level, charge) {
  if (!(charge > 0)) return RADIUS.empty
  return RADIUS[level] || RADIUS.low
}
