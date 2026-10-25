// The ONE writer for a world's blocks. Many 30-kid rooms send edits here; this object applies
// them one at a time and numbers them (wseq). In a Durable Object this runs single-threaded and
// the database is synchronous, so two rooms can never interleave a read and a write.
// An edit says what the client thought was there (b). If that is not what is there, it is
// refused as 'stale' and the true block comes back. Last writer never silently wins.
import { locate, validCell, encodeChunk, decodeChunk } from './chunks.js'

export const KEEP_OPS = 20000
const MAX_CLEAN = 256

export function makeWorld(db, { gen, now = Date.now } = {}) {
  const cache = new Map()
  let wseq = Number(db.getMeta('wseq') ?? 0)
  let pending = []

  const load = (cx, cz) => {
    const k = cx + ',' + cz
    let c = cache.get(k)
    if (!c) {
      const r = decodeChunk(db.getChunk(cx, cz))
      c = { cx, cz, edits: r.edits || new Map(), dirty: false, locked: r.error || null }
      cache.set(k, c)
    }
    return c
  }

  return {
    head: () => wseq,

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
        c.edits.set(idx, e.id)
        c.dirty = true
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

    // Write all dirty chunks and new ops in ONE commit. If it throws, nothing is marked clean
    // and the next flush retries, so no edit is lost and none is applied twice.
    flush() {
      const rows = []
      for (const c of cache.values()) if (c.dirty && !c.locked) rows.push([c.cx, c.cz, encodeChunk(c.edits)])
      if (!rows.length && !pending.length) return 0
      db.commit({ chunks: rows, ops: pending, meta: { wseq: String(wseq) }, keep: KEEP_OPS })
      for (const c of cache.values()) c.dirty = false
      pending = []
      if (cache.size > MAX_CLEAN) for (const k of cache.keys()) { if (cache.size <= MAX_CLEAN / 2) break; cache.delete(k) }
      return rows.length
    },
  }
}
