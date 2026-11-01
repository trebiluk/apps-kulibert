// World simulation, pure. The server is the clock for a shared world: the day clock and every
// machine (oven, belt) a kid has placed advance on the server, by elapsed time, whether or not
// anyone is online. Nothing here touches storage or sockets; world.js / world-do.js call it.
//
// Model (block ids only live on the server, so a machine is a counter, not an inventory):
//   oven  (id 23): prog = ms of work; done = floor(prog / OVEN_MS) bakes finished. The client maps
//                  "done" to finished items. Ovens finish for offline kids (Diego, 0068).
//   belt  (id 74): prog = ms of motion; step = floor(prog / BELT_MS) mod BELT_SLOTS, the belt phase.
// A machine is "working" when it is in the chunk's edits (a kid placed it). There is no power model.
//
// Determinism: every counter is a pure function of elapsed ms, so step(dt1) then step(dt2) equals
// step(dt1 + dt2). That is what makes a catch-up after a sleep match a world that never slept.
import { cellAt } from './chunks.js'

export const SIM_MS = 7500                      // alarm period while players are on (Diego)
export const CATCHUP_MS = 60 * 60 * 1000        // most world time granted after a sleep (Diego)
export const STEP_CHUNKS = 64                   // chunks per sim step; the rest continue next step
export const OVEN_MS = 20_000                   // one bake
export const BELT_MS = 1_000                    // one belt step
export const BELT_SLOTS = 16
export const MACHINES = { 23: 'oven', 74: 'belt' }
export const isMachine = (id) => Object.prototype.hasOwnProperty.call(MACHINES, id)

// Clamp the time to grant between two sim moments.
export const grant = (fromMs, toMs, cap = CATCHUP_MS) => Math.max(0, Math.min(cap, toMs - fromMs))

// Chunk edits (Map idx -> id) -> machine list [{ idx, id }], stable order.
export function machinesIn(edits) {
  const out = []
  for (const [idx, id] of edits) if (isMachine(id)) out.push({ idx, id })
  return out.sort((a, b) => a.idx - b.idx)
}

// One machine's public state from its counter.
export function stateOf(id, prog) {
  if (MACHINES[id] === 'oven') return { done: Math.floor(prog / OVEN_MS) }
  if (MACHINES[id] === 'belt') return { step: Math.floor(prog / BELT_MS) % BELT_SLOTS }
  return {}
}

// Advance one chunk. m: Map idx -> { id, prog, at } (at = last simulated ms, absent = never).
// Returns { m, changed: [idx...] } where changed lists machines whose public state moved.
// A machine not in edits any more (broken) is dropped; a new one starts now with prog 0.
export function stepChunk(edits, m, nowMs, cap = CATCHUP_MS) {
  const next = new Map()
  const changed = []
  for (const { idx, id } of machinesIn(edits)) {
    const prev = m.get(idx)
    if (!prev || prev.id !== id) { next.set(idx, { id, prog: 0, at: nowMs }); changed.push(idx); continue }
    const prog = prev.prog + grant(prev.at, nowMs, cap)
    next.set(idx, { id, prog, at: nowMs })
    if (JSON.stringify(stateOf(id, prog)) !== JSON.stringify(stateOf(id, prev.prog))) changed.push(idx)
  }
  return { m: next, changed }
}

// Changed machines of a chunk as "touch" ops: same block in, same block out, so a client that
// applies ops as block sets is unharmed, and one that watches machine cells re-reads the chunk.
export function touchOps(cx, cz, m, changed) {
  return changed.map((idx) => { const { x, y, z } = cellAt(cx, cz, idx); return { x, y, z, id: m.get(idx).id } })
}

// Machine rows for a chunk save: [[idx, id, prog, at], ...]. decodeMachines reads them back.
export const encodeMachines = (m) => [...m].map(([idx, s]) => [idx, s.id, s.prog, s.at])
export function decodeMachines(rows) {
  const m = new Map()
  for (const r of Array.isArray(rows) ? rows : []) {
    if (Array.isArray(r) && Number.isInteger(r[0]) && Number.isInteger(r[1]) && Number.isFinite(r[2]) && Number.isFinite(r[3])) m.set(r[0], { id: r[1], prog: r[2], at: r[3] })
  }
  return m
}
