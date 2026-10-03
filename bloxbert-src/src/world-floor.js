export const FLOOR_Y = -64
export const NET_Y = -72
export const FALLBACK_Y = -200
export function withFloor(y, above) {
  if (y === FLOOR_Y) return 21
  if (y < FLOOR_Y) return 0
  return above
}
