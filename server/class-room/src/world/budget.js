// Placement budgets for a shared world, decided by the server (World object). Two budgets, checked in
// this order for every block PLACED (breaking is never refused):
//   1. lag:      the Lag Coach cost (src/lag/lagcost.js) of the chunk and its 8 neighbours must stay
//                within BUDGET (400 points) after the placement. Only blocks that cost more than a
//                plain solid block can be refused by it.
//   2. hightick: belts (74) and ovens (23) are high-tick machines. At most HIGH_TICK_MAX (10) in the
//                chunk and its 8 neighbours, and at most HIGH_TICK_MAX placed by one player (anywhere
//                in the world, counting only machines still standing).
// Either budget refuses with its own reason ('lag' | 'hightick') and the numbers, so the client can
// say why. Same area as lagcost: the 3x3 chunks around the placed block's chunk.
import { CLASS_WEIGHT, BUDGET } from '../lag/lagcost.js'

export const HIGH_TICK = new Set([74, 23])      // belt, oven (Diego, Lane 4)
export const HIGH_TICK_MAX = 10
export const LAG_BUDGET = BUDGET

// Server-side block class table for lagcost. Only ids whose class is certain are listed; every other
// id is 'solid' (lagcost's own rule for unknown ids). Ids from bloxbert-src/src/data/ids.js.
const CLASS = new Map([
  [74, 'belt'],                                                           // conveyor
  [47, 'light'], [1100, 'light'], [1101, 'light'], [1102, 'light'], [1103, 'light'],   // lantern, floor/wall lamps
  [38, 'circuit'], [39, 'circuit'], [40, 'circuit'], [41, 'circuit'], [1404, 'circuit'], [1405, 'circuit'],   // levers, buttons
  [64, 'liquid'],                                                         // water
])
export const classOf = (id) => (id === 0 ? 'air' : CLASS.get(id) || 'solid')
export const weightOf = (id) => CLASS_WEIGHT[classOf(id)] ?? CLASS_WEIGHT.solid

// One chunk's numbers: lag points and high-tick count. edits: Map idx -> id.
export function chunkTally(edits) {
  let lag = 0, ht = 0
  for (const id of edits.values()) { lag += weightOf(id); if (HIGH_TICK.has(id)) ht++ }
  return { lag, ht }
}

// Decide one placement. near = { lag, ht } summed over the 3x3 area BEFORE the edit; mine = high-tick
// machines this player has standing; cur = the block being replaced; id = the new block.
// -> { ok:true, budget } | { ok:false, why:'lag'|'hightick', budget }. budget is what the state shows.
export function decide({ near, mine, cur, id }) {
  const dLag = weightOf(id) - weightOf(cur)
  const dHt = (HIGH_TICK.has(id) ? 1 : 0) - (HIGH_TICK.has(cur) ? 1 : 0)
  const dMine = HIGH_TICK.has(id) ? 1 : 0
  const after = { lag: near.lag + dLag, ht: near.ht + dHt, mine: mine + dMine }
  // mine = -Infinity means staff: exempt from the per-player cap; shown as 0.
  const budget = (a) => ({ area: [a.ht, HIGH_TICK_MAX], you: [Number.isFinite(a.mine) ? a.mine : 0, HIGH_TICK_MAX], lag: [Math.round(a.lag), LAG_BUDGET] })
  if (id === 0) return { ok: true, budget: budget(after) }                                        // breaking: always
  if (weightOf(id) > CLASS_WEIGHT.solid && dLag > 0 && after.lag > LAG_BUDGET) return { ok: false, why: 'lag', budget: budget({ ...near, mine }) }
  if (dHt > 0 && (after.ht > HIGH_TICK_MAX || after.mine > HIGH_TICK_MAX)) return { ok: false, why: 'hightick', budget: budget({ ...near, mine }) }
  return { ok: true, budget: budget(after) }
}
