// T4 and T5 stay closed in the Game world until ladder.js (goal 32).
const open = { T4: false, T5: false }
export const SMELTER_FUEL_SLOT = 16
export const COAL_RUNS = 4
export function gateOpen(tier, creative) {
  if (creative) return true
  if (tier !== 'T4' && tier !== 'T5') return true
  return !!open[tier]
}
export function setGate(tier, on) {
  if (tier === 'T4' || tier === 'T5') open[tier] = !!on
}
export function gates() { return { T4: open.T4, T5: open.T5 } }
