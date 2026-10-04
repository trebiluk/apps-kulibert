// Locked core numbers from BERTOPIA-CORE-MECHANICS.md. Pure, so a node check can prove them.
export const GRAV_MULT = 3.2
export const JUMP_V = 8.94
export const WALK = 4.3
export const RUN = 5.6
export const CROUCH = 1.3
export const FLY_H = 10.9
export const FLY_V = 7

export const HAND_S = {
  leaves: 0.2, snow: 0.3, glass: 0.4,
  sand: 0.5, redSand: 0.5, ice: 0.5,
  dirt: 0.6, grass: 0.6, gravel: 0.7,
  woolBlue: 0.8, woolGreen: 0.8, woolRed: 0.8, woolTan: 0.8,
  planks: 1.5, log: 2, stone: 3, slate: 3.5, coal: 3.5,
  brickRed: 4, brickGrey: 4,
}

export function jumpHeight(v = JUMP_V, g = 32) {
  return (v * v) / (2 * g)
}

export function overlapsPlayer(bx, by, bz, px, py, pz) {
  const minx = px - 0.3, maxx = px + 0.3
  const miny = py, maxy = py + 1.8
  const minz = pz - 0.3, maxz = pz + 0.3
  return bx < maxx && bx + 1 > minx && by < maxy && by + 1 > miny && bz < maxz && bz + 1 > minz
}

export function mineMs(name, survival, touch) {
  if (!survival) return touch ? 500 : 0
  const s = HAND_S[name]
  return Math.max(500, (s == null ? 3 : s) * 1000)
}

export function reachFor(survival) {
  return survival ? 6 : 10
}

export function inReach(px, py, pz, bx, by, bz, reach) {
  const dx = bx + 0.5 - px
  const dy = by + 0.5 - (py + 1.62)
  const dz = bz + 0.5 - pz
  return dx * dx + dy * dy + dz * dz <= reach * reach
}

export function speedFor({ crouch, run, fly }) {
  if (fly) return FLY_H
  if (crouch) return CROUCH
  if (run) return RUN
  return WALK
}
