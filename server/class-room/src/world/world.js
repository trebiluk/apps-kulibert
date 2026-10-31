// The ONE writer for a world's blocks. Many 30-kid rooms send edits here; this object applies
// them one at a time and numbers them (wseq). In a Durable Object this runs single-threaded and
// the database is synchronous, so two rooms can never interleave a read and a write.
// An edit says what the client thought was there (b). If that is not what is there, it is
// refused as 'stale' and the true block comes back. Last writer never silently wins.
import { locate, validCell, encodeChunk, decodeChunk } from './chunks.js'
import { HIGH_TICK, chunkTally, decide } from './budget.js'
import { CATCHUP_MS, STEP_CHUNKS, decodeMachines, encodeMachines, grant, isMachine, machinesIn, stepChunk, touchOps } from './sim.js'

export const KEEP_OPS = 20000
const MAX_CLEAN = 256

export function makeWorld(db, { gen, now = Date.now } = {}) {
  const cache = new Map()
  let wseq = Number(db.getMeta('wseq') ?? 0)
  let pending = []
  // Day clock (world ms) and when the sim last ran. Both persist in meta.
  let clock = Number(db.getMeta('clock') ?? 0)
  let simAt = db.getMeta('simAt') == null ? null : Number(db.getMeta('simAt'))
  // Machine chunks: keys 'cx,cz' of chunks holding at least one machine, kept in meta so a sim step
  // never has to scan every chunk. Built once from existing chunks when missing (older worlds).
  let mindex = db.getMeta('mindex') == null ? null : new Set(JSON.parse(db.getMeta('mindex')))
  let cursor = 0
  // Who placed each standing high-tick machine: 'cx,cz,idx' -> actor hash. Persisted in meta so the
  // per-player budget survives a restart. Machines placed before this existed belong to nobody: they
  // count for their area, not for any player.
  const owner = new Map(Object.entries(JSON.parse(db.getMeta('htown') ?? '{}')))
  let ownerDirty = false
  const mineOf = (who) => { let n = 0; for (const w of owner.values()) if (w === who) n++; return n }
  // Per-chunk tallies (lag points, high-tick count), recomputed when a chunk's edits change.
  const tallies = new Map()
  const tallyOf = (cx, cz) => {
    const k = cx + ',' + cz
    let t = tallies.get(k)
    if (!t) { t = chunkTally(load(cx, cz).edits); tallies.set(k, t) }
    return t
  }
  const nearOf = (cx, cz) => {
    let lag = 0, ht = 0
    for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const t = tallyOf(cx + dx, cz + dz); lag += t.lag; ht += t.ht }
    return { lag, ht }
  }

  const load = (cx, cz) => {
    const k = cx + ',' + cz
    let c = cache.get(k)
    if (!c) {
      const r = decodeChunk(db.getChunk(cx, cz))
      c = { cx, cz, edits: r.edits || new Map(), m: decodeMachines(r.m), dirty: false, locked: r.error || null }
      cache.set(k, c)
    }
    return c
  }

  // Keep the machine index in step with a chunk's edits.
  const index = (cx, cz, c) => {
    ensureIndex()
    const k = cx + ',' + cz
    if (machinesIn(c.edits).length) mindex.add(k); else mindex.delete(k)
    metaDirty = true
  }
  let metaDirty = false
  const ensureIndex = () => {
    if (mindex) return
    mindex = new Set()
    for (const [cx, cz, str] of db.allChunks()) { const r = decodeChunk(str); if (r.edits && machinesIn(r.edits).length) mindex.add(cx + ',' + cz) }
    metaDirty = true
  }

  return {
    head: () => wseq,
    clock: () => clock,
    simAt: () => simAt,

    // One sim step at nowMs. Advances the day clock by the granted time and up to STEP_CHUNKS
    // machine chunks (round robin), each by its own elapsed time. Changed machines become touch
    // ops so rooms fan them out. Returns { chunks, touched }.
    sim(nowMs, cap = CATCHUP_MS) {
      ensureIndex()
      clock += simAt == null ? 0 : grant(simAt, nowMs, cap)
      simAt = nowMs
      metaDirty = true
      const keys = [...mindex]
      let touched = 0, n = 0
      for (let i = 0; i < keys.length && n < STEP_CHUNKS; i++, n++) {
        const k = keys[(cursor + i) % keys.length]
        const [cx, cz] = k.split(',').map(Number)
        const c = load(cx, cz)
        if (c.locked) continue
        const r = stepChunk(c.edits, c.m, nowMs, cap)
        c.m = r.m
        c.dirty = true
        for (const op of touchOps(cx, cz, c.m, r.changed)) { pending.push({ s: ++wseq, w: 0, x: op.x, y: op.y, z: op.z, b: op.id, i: op.id, t: nowMs }); touched++ }
      }
      cursor = keys.length ? (cursor + n) % keys.length : 0
      return { chunks: n, touched }
    },
    machineChunks: () => { ensureIndex(); return mindex.size },

    // used/max for a player at a cell: { area:[n,10], you:[n,10], lag:[points,400] } (no placement).
    budgetAt(who, x, z) {
      const { cx, cz } = locate(x, 0, z)
      return decide({ near: nearOf(cx, cz), mine: mineOf(who), cur: 0, id: 0 }).budget
    },

    // batch: [{x,y,z,id,b}]  who: small int (room-local player id or 0 for staff)
    apply(batch, who, t = now()) {
      return batch.map((e) => {
        if (!e || !validCell(e.x, e.y, e.z) || !Number.isInteger(e.id) || e.id < 0 || !Number.isInteger(e.b) || e.b < 0) return { ok: false, why: 'shape' }
        const { cx, cz, idx } = locate(e.x, e.y, e.z)
        const c = load(cx, cz)
        if (c.locked) return { ok: false, why: 'chunk-locked' }
        const cur = c.edits.has(idx) ? c.edits.get(idx) : gen ? gen(e.x, e.y, e.z) : e.b
        if (cur !== e.b) return { ok: false, why: 'stale', cur }
        if (cur === e.id) return { ok: true, s: wseq, same: true }
        // Budgets: lagcost first, then high-tick (budget.js). The server decides.
        const cellKey = cx + ',' + cz + ',' + idx
        // replacing your own machine frees its place in your budget first
        const verdict = decide({ near: nearOf(cx, cz), mine: mineOf(who) - (owner.get(cellKey) === who ? 1 : 0), cur, id: e.id })
        if (!verdict.ok) return { ok: false, why: verdict.why, budget: verdict.budget }
        c.edits.set(idx, e.id)
        c.dirty = true
        if (isMachine(cur) && !isMachine(e.id)) c.m.delete(idx)   // a broken machine takes its counter with it
        if (isMachine(e.id) || isMachine(cur)) index(cx, cz, c)
        tallies.delete(cx + ',' + cz)
        if (owner.delete(cellKey)) ownerDirty = true
        if (HIGH_TICK.has(e.id)) { owner.set(cellKey, who); ownerDirty = true }
        pending.push({ s: ++wseq, w: who, x: e.x, y: e.y, z: e.z, b: cur, i: e.id, t })
        return HIGH_TICK.has(e.id) || HIGH_TICK.has(cur) ? { ok: true, s: wseq, budget: verdict.budget } : { ok: true, s: wseq }
      })
    },

    // Ops after s: { ops, head } or { resync:true, head } when s is older than we keep.
    since(s, limit = 200) {
      const oldest = db.oldestOp() ?? (pending[0] ? pending[0].s : wseq + 1)
      if (s < oldest - 1 && s < wseq) return { resync: true, head: wseq }
      const saved = db.opsSince(s, limit)
      const ops = saved.concat(pending.filter((o) => o.s > s)).slice(0, limit)
      return { ops, head: wseq }
    },

    // Current chunk for a client, with the seq it is good up to.
    chunk(cx, cz) {
      const c = load(cx, cz)
      return c.locked ? { error: c.locked } : { s: wseq, d: encodeChunk(c.edits, encodeMachines(c.m)) }
    },

    // Block now at a cell, or undefined if never edited and no worldgen. (For undo and tests.)
    cell(x, y, z) {
      const { cx, cz, idx } = locate(x, y, z)
      const c = load(cx, cz)
      return c.edits.has(idx) ? c.edits.get(idx) : gen ? gen(x, y, z) : undefined
    },

    // Every op still kept, oldest first (for undo).
    log() { return db.opsSince(0, KEEP_OPS).concat(pending) },

    // Write all dirty chunks and new ops in ONE commit. If it throws, nothing is marked clean
    // and the next flush retries, so no edit is lost and none is applied twice.
    flush() {
      const rows = []
      for (const c of cache.values()) if (c.dirty && !c.locked) rows.push([c.cx, c.cz, encodeChunk(c.edits, encodeMachines(c.m))])
      if (!rows.length && !pending.length && !metaDirty && !ownerDirty) return 0
      const meta = { wseq: String(wseq), clock: String(clock) }
      if (simAt != null) meta.simAt = String(simAt)
      if (mindex) meta.mindex = JSON.stringify([...mindex])
      if (ownerDirty) meta.htown = JSON.stringify(Object.fromEntries(owner))
      db.commit({ chunks: rows, ops: pending, meta, keep: KEEP_OPS })
      for (const c of cache.values()) c.dirty = false
      pending = []
      metaDirty = false
      ownerDirty = false
      if (cache.size > MAX_CLEAN) for (const k of cache.keys()) { if (cache.size <= MAX_CLEAN / 2) break; cache.delete(k) }
      return rows.length
    },
  }
}
