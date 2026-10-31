// The ONE writer for a world's blocks. Many 30-kid rooms send edits here; this object applies
// them one at a time and numbers them (wseq). In a Durable Object this runs single-threaded and
// the database is synchronous, so two rooms can never interleave a read and a write.
// An edit says what the client thought was there (b). If that is not what is there, it is
// refused as 'stale' and the true block comes back. Last writer never silently wins.
import { cellAt, locate, validCell, encodeChunk, decodeChunk } from './chunks.js'
import { CATCHUP_MS, STEP_CHUNKS, decodeMachines, encodeMachines, grant, isMachine, machinesIn, stepChunk, touchOps } from './sim.js'
import { OVEN, decodeItems, emptySlots, encodeItems, isContainer, isEmpty, putInto, take, validItem, validMove } from './items.js'
import { bake } from './oven.js'

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

  const load = (cx, cz) => {
    const k = cx + ',' + cz
    let c = cache.get(k)
    if (!c) {
      const r = decodeChunk(db.getChunk(cx, cz))
      const edits = r.edits || new Map()
      c = { cx, cz, edits, m: decodeMachines(r.m), items: decodeItems(r.i, (i) => edits.get(i) ?? 0), dirty: false, locked: r.error || null }
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
        // ovens first: turn the granted time into bakes, on the slots, before the counters move on
        for (const [idx, row] of c.m) {
          if (row.id !== OVEN || c.edits.get(idx) !== OVEN) continue
          const slots = c.items.get(idx)
          if (!slots) { row.at = nowMs; continue }                          // empty oven: nothing to bake, no time banked
          const b = bake(slots, row, grant(row.at, nowMs, cap))
          row.prog = b.st.prog
          if (b.st.left) row.left = b.st.left; else delete row.left
          if (b.bakes) {
            c.items.set(idx, b.slots)
            const { x, y, z } = cellAt(cx, cz, idx)
            pending.push({ s: ++wseq, w: 0, x, y, z, b: OVEN, i: OVEN, t: nowMs }); touched++
          }
        }
        const r = stepChunk(c.edits, c.m, nowMs, cap)
        c.m = r.m
        c.dirty = true
        for (const op of touchOps(cx, cz, c.m, r.changed)) { pending.push({ s: ++wseq, w: 0, x: op.x, y: op.y, z: op.z, b: op.id, i: op.id, t: nowMs }); touched++ }
      }
      cursor = keys.length ? (cursor + n) % keys.length : 0
      return { chunks: n, touched }
    },
    machineChunks: () => { ensureIndex(); return mindex.size },

    // ---- items in containers (part 1). The container is the authority; a change fans out as a touch op
    // on the cell (same block in and out) so clients re-read the cell with inv().
    // inv(x,y,z) -> { slots:[{id,n}|null...] } or { error:'container' }
    inv(x, y, z) {
      if (!validCell(x, y, z)) return { error: 'shape' }
      const { cx, cz, idx } = locate(x, y, z)
      const c = load(cx, cz)
      const id = c.edits.has(idx) ? c.edits.get(idx) : gen ? gen(x, y, z) : 0
      if (!isContainer(id)) return { error: 'container' }
      return { s: wseq, slots: c.items.get(idx) || emptySlots(id) }
    },
    // move(who, x,y,z, item, n, dir) dir 'put' | 'take' -> { ok, moved, slots } or { ok:false, why }
    move(who, x, y, z, item, n, dir, t = now()) {
      const v = this.inv(x, y, z)
      if (v.error) return { ok: false, why: v.error }
      if (!validItem(item) || !validMove(n)) return { ok: false, why: 'shape' }
      const { cx, cz, idx } = locate(x, y, z)
      const c = load(cx, cz)
      if (c.locked) return { ok: false, why: 'chunk-locked' }
      const block = c.edits.has(idx) ? c.edits.get(idx) : gen ? gen(x, y, z) : 0
      // an oven settles first: bake up to t on the slots it had, so time it spent paused (no fuel, no input,
      // output full) is never paid out to items put in now, and a take sees everything already baked
      const row = block === OVEN ? c.m.get(idx) : null
      if (row) {
        const b = bake(v.slots, row, grant(row.at, t, CATCHUP_MS))
        v.slots = b.slots; row.prog = b.st.prog; row.at = Math.max(row.at, t)
        if (b.st.left) row.left = b.st.left; else delete row.left
        if (b.bakes) { c.items.set(idx, b.slots); pending.push({ s: ++wseq, w: 0, x, y, z, b: OVEN, i: OVEN, t }) }
        c.dirty = true
      }
      const r = dir === 'take' ? take(v.slots, item, n) : putInto(block, v.slots, item, n)
      if (r.error) return { ok: false, why: r.error, slots: v.slots }
      const moved = dir === 'take' ? r.got : n - r.left
      if (!moved) return { ok: false, why: dir === 'take' ? 'none' : 'full', slots: v.slots }
      if (isEmpty(r.slots)) c.items.delete(idx); else c.items.set(idx, r.slots)
      c.dirty = true
      const id = c.edits.has(idx) ? c.edits.get(idx) : (gen ? gen(x, y, z) : 0)
      pending.push({ s: ++wseq, w: who, x, y, z, b: id, i: id, t })
      return { ok: true, s: wseq, moved, slots: r.slots }
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
        if (isContainer(cur) && c.items.has(idx)) return { ok: false, why: 'not-empty' }   // empty it first; nothing is ever destroyed
        c.edits.set(idx, e.id)
        c.dirty = true
        if (isMachine(cur) && !isMachine(e.id)) c.m.delete(idx)   // a broken machine takes its counter with it
        if (isMachine(e.id) || isMachine(cur)) index(cx, cz, c)
        pending.push({ s: ++wseq, w: who, x: e.x, y: e.y, z: e.z, b: cur, i: e.id, t })
        return { ok: true, s: wseq }
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
      return c.locked ? { error: c.locked } : { s: wseq, d: encodeChunk(c.edits, encodeMachines(c.m), encodeItems(c.items)) }
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
      for (const c of cache.values()) if (c.dirty && !c.locked) rows.push([c.cx, c.cz, encodeChunk(c.edits, encodeMachines(c.m), encodeItems(c.items))])
      if (!rows.length && !pending.length && !metaDirty) return 0
      const meta = { wseq: String(wseq), clock: String(clock) }
      if (simAt != null) meta.simAt = String(simAt)
      if (mindex) meta.mindex = JSON.stringify([...mindex])
      db.commit({ chunks: rows, ops: pending, meta, keep: KEEP_OPS })
      for (const c of cache.values()) c.dirty = false
      pending = []
      metaDirty = false
      if (cache.size > MAX_CLEAN) for (const k of cache.keys()) { if (cache.size <= MAX_CLEAN / 2) break; cache.delete(k) }
      return rows.length
    },
  }
}
