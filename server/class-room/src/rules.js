// "The server is the boss." Pure checks the room runs on what a client SAYS it did.
// The client is never trusted: a number from a client is a request, not a fact.
//
// Wired in Phase 0:      checkMove       (positions are the only thing that exists yet)
// Written and tested, NOT wired until Phase 1 (there are no block edits or
// inventory on the server yet):  checkReach, checkBlockEdit, checkInventory
//
// The numbers are first guesses. Tune them from real play data, not from this file.
// They are generous on purpose: a false "speed hack" on a legit kid is worse than a
// slightly loose limit, and the strike ladder (guard.js) handles repeat offenders.

export const LIMITS = {
  maxHorizontalSpeed: 20,   // blocks per second (walking is about 4-6)
  maxUpSpeed: 14,           // blocks per second
  maxDownSpeed: 80,         // blocks per second (falling)
  slack: 4,                 // extra blocks allowed on top of speed * time (network jitter)
  minDtSec: 0.05,           // never divide by less than this
  maxDtSec: 2,              // never credit more than this much travel after a pause
  yMin: -128,
  yMax: 512,
  reach: 6,                 // blocks from the eye to the block centre, plus half a block
  eyeHeight: 1.6,
  maxStack: 64,
  maxStacksPerCall: 1,
}

// prev: {x,y,z} the last accepted position, or null (first frame).
// next: {x,y,z} what the client claims now.  dtMs: server clock time since prev was accepted.
// Returns {ok:true} or {ok:false, why:'bounds'|'speed'}.
export function checkMove(prev, next, dtMs) {
  if (next.y < LIMITS.yMin || next.y > LIMITS.yMax) return { ok: false, why: 'bounds' }
  if (!prev) return { ok: true }
  const dt = Math.min(LIMITS.maxDtSec, Math.max(LIMITS.minDtSec, dtMs / 1000))
  const dx = next.x - prev.x
  const dz = next.z - prev.z
  const dy = next.y - prev.y
  if (Math.hypot(dx, dz) > LIMITS.maxHorizontalSpeed * dt + LIMITS.slack) return { ok: false, why: 'speed' }
  if (dy > LIMITS.maxUpSpeed * dt + LIMITS.slack) return { ok: false, why: 'speed' }
  if (-dy > LIMITS.maxDownSpeed * dt + LIMITS.slack) return { ok: false, why: 'speed' }
  return { ok: true }
}

// Can a player at `pos` (feet) touch the block at `block` (integer cell)? Uses the room's
// own copy of where the player is, never a position the client put in the edit message.
export function checkReach(pos, block) {
  const dx = block.x + 0.5 - pos.x
  const dy = block.y + 0.5 - (pos.y + LIMITS.eyeHeight)
  const dz = block.z + 0.5 - pos.z
  return Math.hypot(dx, dy, dz) <= LIMITS.reach + 0.5
}

// edit: {op:'place'|'break', x,y,z (integers), id (integer)}  knownIds: Set of allowed block ids.
export function checkBlockEdit(edit, pos, knownIds) {
  if (!edit || (edit.op !== 'place' && edit.op !== 'break')) return { ok: false, why: 'shape' }
  for (const k of ['x', 'y', 'z']) if (!Number.isInteger(edit[k])) return { ok: false, why: 'shape' }
  if (edit.y < LIMITS.yMin || edit.y > LIMITS.yMax) return { ok: false, why: 'bounds' }
  if (edit.op === 'place' && !(Number.isInteger(edit.id) && knownIds && knownIds.has(edit.id))) return { ok: false, why: 'item' }
  if (!pos || !checkReach(pos, edit)) return { ok: false, why: 'reach' }
  return { ok: true }
}

// The server owns the inventory (a Map of item id -> count). A client may only ASK for a
// change; the server applies it if it is possible, and refuses it if not.
// change: {id, delta}. Returns {ok:true, next:Map} or {ok:false, why}.
export function checkInventory(inv, change, knownIds) {
  if (!change || !Number.isInteger(change.id) || !Number.isInteger(change.delta) || change.delta === 0) return { ok: false, why: 'shape' }
  if (!knownIds || !knownIds.has(change.id)) return { ok: false, why: 'item' }
  if (Math.abs(change.delta) > LIMITS.maxStack * LIMITS.maxStacksPerCall) return { ok: false, why: 'amount' }
  const have = inv.get(change.id) || 0
  const want = have + change.delta
  if (want < 0) return { ok: false, why: 'missing' }
  if (want > LIMITS.maxStack) return { ok: false, why: 'stack' }
  const next = new Map(inv)
  if (want === 0) next.delete(change.id); else next.set(change.id, want)
  return { ok: true, next }
}
