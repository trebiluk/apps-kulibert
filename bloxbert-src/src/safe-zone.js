// Safe zone: Bertyville town box + 8-block margin. No combat inside.
const TOWN = { x0: -20, x1: 36, z0: -18, z1: 28 }
const MARGIN = 8
export function inSafeZone(x, z) {
  return x >= TOWN.x0 - MARGIN && x <= TOWN.x1 + MARGIN &&
         z >= TOWN.z0 - MARGIN && z <= TOWN.z1 + MARGIN
}
