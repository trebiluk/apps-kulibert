// Client frames for shared worlds. Same rules as protocol.js: version 0, exact keys, strict.
//   block edit  {"v":0,"t":"b","x":1,"y":64,"z":2,"id":5,"b":0}   id = new block, b = block the client saw
//   catch up    {"v":0,"t":"sync","s":812}                        last seq the client has
//   get chunk   {"v":0,"t":"cget","cx":0,"cz":-3}
// Server -> client: {"t":"o","o":[[s,x,y,z,id],...]} ops; {"t":"no","x","y","z","c":"stale","cur":3} refusal;
// {"t":"ch","cx","cz","s":812,"d":"<chunk>"} chunk (client ignores ops with s <= chunk s);
// {"t":"rs"} resync (reload your chunks). Edits and chunk requests have their own, smaller rate limits.
import { validCell } from './chunks.js'

export const CHUNK_REQ_PER_SEC = 4
export const EDITS_PER_SEC = 10
const KEYS = { b: ['x', 'y', 'z', 'id', 'b'], sync: ['s'], cget: ['cx', 'cz'] }
const int = (n) => Number.isInteger(n) && Math.abs(n) <= 2147483647

// -> { t:'b'|'sync'|'cget', ...fields } or { err:'type'|'keys'|'val'|'cell' }
export function parseFrame2(m) {
  if (!m || typeof m !== 'object' || m.v !== 0 || typeof m.t !== 'string' || !Object.hasOwn(KEYS, m.t)) return { err: 'type' }
  const want = KEYS[m.t]
  const keys = Object.keys(m).filter((k) => k !== 'v' && k !== 't')
  if (keys.length !== want.length || !want.every((k) => keys.includes(k))) return { err: 'keys' }
  if (!want.every((k) => int(m[k]))) return { err: 'val' }
  if (m.t === 'b') {
    if (!validCell(m.x, m.y, m.z)) return { err: 'cell' }
    if (m.id < 0 || m.b < 0) return { err: 'val' }
  }
  if (m.t === 'sync' && m.s < 0) return { err: 'val' }
  return { ...m, v: undefined }
}
