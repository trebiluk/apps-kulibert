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
  dirt: 0.6, grass: 0.6, gravel: 0.7, farmland: 0.6, farmlandWet: 0.6, water: 0.5,
  woolBlue: 0.8, woolGreen: 0.8, woolRed: 0.8, woolTan: 0.8,
  planks: 1.5, log: 2, stone: 3, slate: 3.5, coal: 3.5,
  brickRed: 4, brickGrey: 4,
  wheat: 0.4, reed: 0.4, sapling: 0.4, tuft: 0.3, door: 1.5, doorOpen: 1.5,
  cropSprout: 0.4, cropLeafy: 0.4, cropTall: 0.4, cropRipe: 0.4,
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

export const TOOL_X = { hand: 1, wood: 2, stone: 3, copper: 4, steel: 6 }
export const TOOL_RANK = { hand: 0, wood: 1, stone: 2, copper: 3, steel: 4 }
export const TOOL_LIFE = {}
export const DRAIN_MS = 500

export function toolNeed(name) {
  if (!name) return ''
  if (/Ore$/.test(name)) return 'stone'
  if (name === 'stone' || name === 'slate' || name === 'coal' || name === 'brickRed' || name === 'brickGrey') return 'wood'
  return ''
}

export function toolEnough() {
  return true
}

export function toolToast() {
  return ''
}

export function gateDig(p) {
  return { p, blocked: false }
}

let digSlow = 1
export function setDigSlow(n) { digSlow = n > 1 ? n : 1 }
export function getDigSlow() { return digSlow }

export function mineMs(name, survival, touch, tool = 'hand') {
  if (!survival) return touch ? 500 : 0
  const s = HAND_S[name]
  const hand = (s == null ? 3 : s) * 1000
  const mult = TOOL_X[tool] || 1
  return Math.max(150, (hand / mult) * digSlow)
}

export function crackStage(p) {
  if (p >= 1) return 4
  if (p >= 0.75) return 3
  if (p >= 0.5) return 2
  if (p >= 0.25) return 1
  return 0
}

export function crackVisible(elapsed, p) {
  return elapsed >= 250 && crackStage(p) >= 1
}

export function drainProgress(p, dt, drainMs = DRAIN_MS) {
  if (p <= 0) return 0
  return Math.max(0, p - dt / drainMs)
}

export function advanceDig(dig, now, holding, same) {
  if (!dig || dig.broke) return dig && dig.broke ? null : dig
  if (holding && !same) return null
  if (!holding) {
    const p = drainProgress(dig.p || 0, now - (dig.drainAt || now))
    if (p <= 0) return null
    return { ...dig, p, draining: true, drainAt: now }
  }
  const t0 = dig.draining ? now - (dig.p || 0) * dig.need : dig.t0
  const p = Math.min(1, dig.need > 0 ? (now - t0) / dig.need : 1)
  return { ...dig, t0, p, draining: false, drainAt: now }
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

export function keepCrouchStep(floorSolid, bodySolid) {
  if (bodySolid) return true
  return !!floorSolid
}

export function shouldRepeatPlace(held, elapsed, touch) {
  return !touch && !!held && elapsed >= 250
}

export function canUse(downBlock, upBlock, movedPx, isRepeat) {
  if (isRepeat) return false
  if (!downBlock || !upBlock) return false
  if (movedPx > 6) return false
  return downBlock.id === upBlock.id && downBlock.x === upBlock.x && downBlock.y === upBlock.y && downBlock.z === upBlock.z
}

export function airLimit(moving, maxSpeed, walk) {
  if (moving > 0.5) return Math.min(moving, maxSpeed)
  return Math.min(walk, maxSpeed)
}

export function capAir(vx, vz, cap) {
  const s = Math.hypot(vx, vz)
  if (!(cap > 0) || s <= cap) return [vx, vz]
  const k = cap / s
  return [vx * k, vz * k]
}

export function speedFor({ crouch, run, fly }) {
  if (fly) return FLY_H
  if (crouch) return CROUCH
  if (run) return RUN
  return WALK
}
