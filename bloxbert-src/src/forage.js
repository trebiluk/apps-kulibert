// Wild forage timers. Real clock, local save only. A back jump never goes negative.
// A forward jump fills at most once. Nothing dies.
export const BUSH_REFILL_MS = 3 * 60 * 1000
export const WHEAT_REFILL_MS = 10 * 60 * 1000
export const BARE_BUSH = 65
export const FRUIT_BUSH = 68
export const WILD_WHEAT = 28

function mix(x, y, z, salt) {
  return (Math.imul(x | 0, 2246822519) ^ Math.imul(y | 0, 3266489917) ^ Math.imul(z | 0, 668265263) ^ Math.imul(salt | 0, 374761393)) >>> 0
}

export function wildPickCount(x, y, z) {
  return 1 + (mix(x, y, z, 681) % 2)
}

function capOf(kind) {
  return kind === 'wheat' ? WHEAT_REFILL_MS : BUSH_REFILL_MS
}

export function createForage() {
  const map = new Map()
  const key = (x, y, z) => (x | 0) + ',' + (y | 0) + ',' + (z | 0)
  function add(x, y, z, kind, now) {
    const row = {
      x: x | 0, y: y | 0, z: z | 0,
      kind: kind === 'wheat' ? 'wheat' : 'bush',
      grown: 0,
      lastSeen: now,
    }
    map.set(key(row.x, row.y, row.z), row)
    return row
  }
  function get(x, y, z) { return map.get(key(x, y, z)) || null }
  function remove(x, y, z) { map.delete(key(x, y, z)) }
  function advance(row, now) {
    if (!row) return row
    const seen = +row.lastSeen || 0
    if (!(now > seen)) return row
    const cap = capOf(row.kind)
    const next = (+row.grown || 0) + (now - seen)
    row.grown = Math.min(cap, Math.max(0, next))
    row.lastSeen = now
    return row
  }
  function preview(row, now) {
    const cap = capOf(row.kind)
    let grown = +row.grown || 0
    const seen = +row.lastSeen || 0
    if (now > seen) grown = Math.min(cap, Math.max(0, grown + (now - seen)))
    const left = grown >= cap ? 0 : cap - grown
    return { grown, left, ready: grown >= cap }
  }
  function dump() {
    return [...map.values()].map((r) => ({
      x: r.x, y: r.y, z: r.z, kind: r.kind, grown: r.grown, lastSeen: r.lastSeen,
    }))
  }
  function load(list) {
    map.clear()
    if (!Array.isArray(list)) return
    const now = Date.now()
    for (const r of list) {
      if (!r || !Number.isFinite(+r.x) || !Number.isFinite(+r.y) || !Number.isFinite(+r.z)) continue
      const kind = r.kind === 'wheat' ? 'wheat' : 'bush'
      const cap = capOf(kind)
      const row = {
        x: r.x | 0,
        y: r.y | 0,
        z: r.z | 0,
        kind,
        grown: Math.max(0, Math.min(cap, +r.grown || 0)),
        lastSeen: Number.isFinite(+r.lastSeen) ? +r.lastSeen : now,
      }
      map.set(key(row.x, row.y, row.z), row)
    }
  }
  function clear() { map.clear() }
  function rows() { return map.values() }
  return { add, get, remove, dump, load, clear, rows, advance, preview }
}
