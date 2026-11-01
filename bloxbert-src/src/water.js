// Water flow. Event-driven and bounded, so it costs nothing while nobody digs near water.
// When a cell next to water opens (a kid breaks a block), water runs into it: it falls straight down first, and
// spreads sideways only at or below the surface level of the water it came from, so it never climbs onto dry land.
// One event fills at most MAX_CELLS within RADIUS blocks of where it started. Rings land STEP_MS apart so the
// water visibly runs; with reduced motion it fills in one go. Flowing water is ordinary water once it lands.

export const MAX_CELLS = 96
export const RADIUS = 12
export const STEP_MS = 120

const SIDES = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]

export function createWater({ getVoxel, setVoxel, WATER, open = (id) => !id, reduce = () => false, after = () => {} }) {
  let jobs = 0

  // the highest water touching (x, y, z): from above, or beside at the same height
  function sourceLevel(x, y, z) {
    if (getVoxel(x, y + 1, z) === WATER) {
      let top = y + 1
      while (top < y + 64 && getVoxel(x, top + 1, z) === WATER) top++
      return top
    }
    let best = null
    for (const [dx, , dz] of SIDES) {
      if (getVoxel(x + dx, y, z + dz) !== WATER) continue
      let top = y
      while (top < y + 64 && getVoxel(x + dx, top + 1, z + dz) === WATER) top++
      if (best == null || top > best) best = top
    }
    return best
  }

  function run(ox, oy, oz, level) {
    const seen = new Set()
    let frontier = [[ox, oy, oz]]
    let filled = 0
    jobs++
    const step = () => {
      const next = []
      for (const [x, y, z] of frontier) {
        const k = x + ',' + y + ',' + z
        if (seen.has(k)) continue
        seen.add(k)
        if (filled >= MAX_CELLS) break
        if (!open(getVoxel(x, y, z))) continue
        setVoxel(x, y, z, WATER)
        filled++
        // fall first: water under open air keeps dropping, and does not also spread from here
        if (open(getVoxel(x, y - 1, z))) { next.push([x, y - 1, z]); continue }
        for (const [dx, , dz] of SIDES) {
          const nx = x + dx, nz = z + dz
          if (Math.abs(nx - ox) > RADIUS || Math.abs(nz - oz) > RADIUS) continue
          if (y > level) continue
          if (open(getVoxel(nx, y, nz))) next.push([nx, y, nz])
        }
      }
      frontier = next
      if (frontier.length && filled < MAX_CELLS) {
        if (reduce()) step()
        else setTimeout(step, STEP_MS)
      } else {
        jobs--
        if (filled) after(filled)
      }
    }
    step()
  }

  // Call after a block at (x, y, z) became open.
  function opened(x, y, z) {
    if (!open(getVoxel(x, y, z))) return false
    const level = sourceLevel(x, y, z)
    if (level == null) return false
    run(x, y, z, level)
    return true
  }

  return { opened, busy: () => jobs > 0 }
}
