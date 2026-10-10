// Wheat growth. Fixed times, no random ticks. Dry-equivalent 8 min to full; wet soil is 2x.
// Berry bushes share this clock: first fruit 10 min dry, regrow 6 min dry. Wet is 2x. They never die.
import { blockByKey } from './packs/registry.js'
import './packs/farm/pack.js'
function live(key) {
  const id = blockByKey(key)
  return id > 0 ? id : -1
}
export const RIPE_MS = 8 * 60 * 1000
export const BUSH_RIPE_MS = 10 * 60 * 1000
export const BUSH_REGROW_MS = 6 * 60 * 1000
export const WET_R = 4
export const DRY = live('farmland')
export const WET = live('farmlandWet')
export const WATER = 64
export const CROP = [live('cropSprout'), live('cropLeafy'), live('cropTall'), live('cropRipe')]
export const BUSH = [live('bushYoung'), live('bushLeaf'), live('bushFull'), live('bushFruit')]

export function isCropId(id) {
  return id > 0 && CROP.includes(id)
}

export function isBushId(id) {
  return id > 0 && BUSH.includes(id)
}

export function capOf(crop) {
  if (crop && crop.kind === 'bush') return crop.regrow ? BUSH_REGROW_MS : BUSH_RIPE_MS
  return RIPE_MS
}

export function stage(grown, crop) {
  const cap = capOf(crop)
  const g = Math.max(0, +grown || 0)
  if (crop && crop.kind === 'bush' && crop.regrow) return g >= cap ? 3 : 2
  if (g * 100 < cap * 33) return 0
  if (g * 100 < cap * 66) return 1
  if (g < cap) return 2
  return 3
}

export function advance(crop, now) {
  if (!crop) return crop
  const seen = +crop.lastSeen || 0
  if (!(now > seen)) return crop
  const speed = crop.wet ? 2 : 1
  const cap = capOf(crop)
  const next = (+crop.grown || 0) + (now - seen) * speed
  crop.grown = Math.min(cap, Math.max(0, next))
  crop.lastSeen = now
  return crop
}

export function preview(crop, now) {
  const cap = capOf(crop)
  const wet = !!(crop && crop.wet)
  let grown = crop ? (+crop.grown || 0) : 0
  const seen = crop ? (+crop.lastSeen || 0) : 0
  if (now > seen) grown = Math.min(cap, Math.max(0, grown + (now - seen) * (wet ? 2 : 1)))
  const speed = wet ? 2 : 1
  const left = grown >= cap ? 0 : (cap - grown) / speed
  return { grown, wet, stage: stage(grown, crop), left }
}

export function isRipe(crop, now) {
  if (!crop) return false
  return preview(crop, now).stage === 3
}

export function replantSeed(stored) {
  return stored > 0
}

export function formatLeft(ms) {
  const s = Math.max(0, Math.ceil((+ms || 0) / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m + ':' + String(r).padStart(2, '0')
}

export function nearWater(getVoxel, x, y, z) {
  for (let dx = -WET_R; dx <= WET_R; dx++) {
    for (let dz = -WET_R; dz <= WET_R; dz++) {
      if (getVoxel(x + dx, y, z + dz) === WATER) return true
      if (getVoxel(x + dx, y - 1, z + dz) === WATER) return true
    }
  }
  return false
}

export function createFarm() {
  const map = new Map()
  const key = (x, y, z) => x + ',' + y + ',' + z
  function add(x, y, z, now, wet, opts) {
    const kind = opts && opts.kind === 'bush' ? 'bush' : 'wheat'
    const row = {
      x: x | 0, y: y | 0, z: z | 0, plantedAt: now, grown: 0, wet: !!wet, lastSeen: now,
      kind, regrow: false,
    }
    map.set(key(row.x, row.y, row.z), row)
    return row
  }
  function get(x, y, z) { return map.get(key(x | 0, y | 0, z | 0)) || null }
  function remove(x, y, z) { map.delete(key(x | 0, y | 0, z | 0)) }
  function dump() {
    return [...map.values()].map((r) => ({
      x: r.x, y: r.y, z: r.z, plantedAt: r.plantedAt, grown: r.grown, wet: !!r.wet, lastSeen: r.lastSeen,
      kind: r.kind === 'bush' ? 'bush' : 'wheat', regrow: !!(r.kind === 'bush' && r.regrow),
    }))
  }
  function load(list) {
    map.clear()
    if (!Array.isArray(list)) return
    const now = Date.now()
    for (const r of list) {
      if (!r || !Number.isFinite(+r.x) || !Number.isFinite(+r.y) || !Number.isFinite(+r.z)) continue
      const kind = r.kind === 'bush' ? 'bush' : 'wheat'
      const regrow = kind === 'bush' && !!r.regrow
      const row = {
        x: r.x | 0,
        y: r.y | 0,
        z: r.z | 0,
        plantedAt: Number.isFinite(+r.plantedAt) ? +r.plantedAt : now,
        grown: Math.max(0, Math.min(capOf({ kind, regrow }), +r.grown || 0)),
        wet: !!r.wet,
        lastSeen: Number.isFinite(+r.lastSeen) ? +r.lastSeen : (Number.isFinite(+r.plantedAt) ? +r.plantedAt : now),
        kind,
        regrow,
      }
      map.set(key(row.x, row.y, row.z), row)
    }
  }
  function clear() { map.clear() }
  function rows() { return map.values() }
  return { add, get, remove, dump, load, clear, rows }
}
