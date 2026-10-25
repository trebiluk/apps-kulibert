// Chunk save format. A world = seed + edits. Only cells a kid changed are stored.
// Never rename a key. Add fields only. Missing fields load as empty. Newer format = read-only.
import { WORLD_LIMIT } from '../protocol.js'

export const FMT = 1
export const Y_MIN = -128
export const Y_MAX = 511

export const validCell = (x, y, z) =>
  Number.isInteger(x) && Number.isInteger(y) && Number.isInteger(z) &&
  y >= Y_MIN && y <= Y_MAX && Math.abs(x) <= WORLD_LIMIT && Math.abs(z) <= WORLD_LIMIT

export function locate(x, y, z) {
  const cx = Math.floor(x / 16)
  const cz = Math.floor(z / 16)
  return { cx, cz, idx: ((y - Y_MIN) * 16 + (z - cz * 16)) * 16 + (x - cx * 16) }
}

export function cellAt(cx, cz, idx) {
  return { x: cx * 16 + (idx % 16), y: Math.floor(idx / 256) + Y_MIN, z: cz * 16 + (Math.floor(idx / 16) % 16) }
}

export const encodeChunk = (edits) => JSON.stringify({ f: FMT, e: [...edits] })

// -> { edits:Map } or { error:'corrupt'|'newer' }. An error chunk is never written over.
export function decodeChunk(str) {
  if (str === null || str === undefined || str === '') return { edits: new Map() }
  let o
  try { o = JSON.parse(str) } catch (e) { return { error: 'corrupt' } }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return { error: 'corrupt' }
  if (o.f !== undefined && (!Number.isInteger(o.f) || o.f > FMT)) return { error: 'newer' }
  const edits = new Map()
  for (const p of Array.isArray(o.e) ? o.e : []) {
    if (Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1]) && p[0] >= 0 && p[1] >= 0) edits.set(p[0], p[1])
  }
  return { edits }
}
