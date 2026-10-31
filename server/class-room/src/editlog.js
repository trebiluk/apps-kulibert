// Edit log for rollback ("undo the grief"). Pure, memory only, bounded. STANDALONE, NOT WIRED.
// Each accepted block edit is recorded with the id it replaced. A teacher/admin rolls back by
// time, optionally for one kid (by room id) or one rectangle (a plot). The log returns the
// INVERSE edits; the room applies them and tells the clients. Entries hold opaque room ids and
// block ids only, never aliases, refs or text.
//
// Memory only: when the room object is evicted the log is gone. Making it durable (so a
// rollback survives a restart) stores student-adjacent data and needs Diego's yes first.
//
// P4 (Diego, 0068): the DURABLE build history is the world's ops table, one row per applied
// edit {s, w, x, y, z, b (before), i (after), t}. w is h32(actor ref), a one-way hash, never
// the ref or an alias. Rows older than HISTORY_MS are purged by the World alarm. Rollback from
// it is NOT wired (P5). The memory log above stays as the room-local tool it was.

export const HISTORY_MS = 7 * 24 * 60 * 60 * 1000

// Durable history over a world db (memdb/sqldb). rows(since) = the kept edits after seq `since`.
export function makeHistory(db) {
  return {
    rows: (since = 0, limit = 1000) => db.opsSince(since, limit),
    // Drops rows older than HISTORY_MS at nowMs. Returns how many went.
    purge: (nowMs, keepMs = HISTORY_MS) => db.purgeOps(nowMs - keepMs),
  }
}

// ---- B20 p1 (2.5.596): "who changed this block", for staff. Read-only over the same 7-day ops log.
// The log keeps w = h32(ref) only, so "who" is an opaque builder tag "b-<8 hex>", never an alias, ref,
// name, email, IP or device id. TechWorks (which knows each kid's ref) can turn a tag into an alias for
// the teacher (B20 p2). w = 0 is the server itself (undo, sim) -> "system". Touch ops (same block in
// and out: container moves, sim steps) are not block changes and are left out.
export const HISTORY_LIMIT = 10
export const builderTag = (w) => (w ? 'b-' + (w >>> 0).toString(16).padStart(8, '0') : 'system')
export const actionOf = (o) => (o.b === o.i ? null : o.i === 0 ? 'break' : o.b === 0 ? 'place' : 'replace')

// ops: log rows, oldest first. -> [{ who, action, block, t }] newest first, at most `limit`, none older
// than 7 days at nowMs. block = the block placed (place/replace) or the block broken (break).
export function historyFrom(ops, x, y, z, limit = HISTORY_LIMIT, nowMs = Date.now(), keepMs = HISTORY_MS) {
  const out = []
  for (let k = ops.length - 1; k >= 0 && out.length < limit; k--) {
    const o = ops[k]
    if (o.x !== x || o.y !== y || o.z !== z || o.t < nowMs - keepMs) continue
    const action = actionOf(o)
    if (action) out.push({ who: builderTag(o.w), action, block: action === 'break' ? o.b : o.i, t: o.t })
  }
  return out
}

// The same query over a world db (memdb/sqldb), for code running next to the log.
export function historyAt(db, x, y, z, limit = HISTORY_LIMIT, nowMs = Date.now()) {
  return historyFrom(db.opsSince(0, 100000), x, y, z, limit, nowMs)
}

// The same query from outside the World object, through its existing since(s, n) RPC only (no new
// RPC, nothing stored). since(s) answers { resync } when s is older than the oldest kept row, so the
// oldest seq is found by a binary search first, then the log is read in pages (it holds <= 20000 rows).
export const PAGE = 1000
export async function historyVia(since, x, y, z, limit = HISTORY_LIMIT, nowMs = Date.now()) {
  for (let attempt = 0; attempt < 2; attempt++) {           // a purge between probe and read: try once more
    const first = await since(0, 1)
    let s = 0
    if (first.resync) {
      let lo = 0, hi = first.head                            // since(hi) is never a resync
      while (lo < hi) { const mid = Math.floor((lo + hi) / 2); if ((await since(mid, 1)).resync) lo = mid + 1; else hi = mid }
      s = lo
    }
    const ops = []
    let gap = false
    for (;;) {
      const r = await since(s, PAGE)
      if (r.resync) { gap = true; break }
      ops.push(...r.ops)
      if (r.ops.length < PAGE) break
      s = r.ops[r.ops.length - 1].s
    }
    if (!gap) return historyFrom(ops, x, y, z, limit, nowMs)
  }
  return null
}

export const MAX_ENTRIES = 5000

export function makeEditLog(max = MAX_ENTRIES) {
  const log = []   // oldest first: {t, who, x, y, z, before, after}

  return {
    // who: the room-local player id (small integer). before/after: block ids (0 = air).
    record(t, who, x, y, z, before, after) {
      log.push({ t, who, x, y, z, before, after })
      if (log.length > max) log.shift()
    },
    size: () => log.length,

    // sel: { since (ms), now (ms), who? (room id), rect? {x0,z0,x1,z1} }
    // Returns [{x,y,z,id}] = the block to put back in each touched cell (the OLDEST `before`
    // in the selection), and removes the selected entries from the log.
    rollback(sel) {
      const picked = []
      const keep = []
      for (const e of log) {
        const inTime = e.t >= sel.since && e.t <= sel.now
        const byWho = sel.who === undefined || e.who === sel.who
        const inRect = !sel.rect || (e.x >= sel.rect.x0 && e.x <= sel.rect.x1 && e.z >= sel.rect.z0 && e.z <= sel.rect.z1)
        if (inTime && byWho && inRect) picked.push(e); else keep.push(e)
      }
      log.length = 0
      log.push(...keep)
      const first = new Map()
      for (const e of picked) {
        const key = e.x + ',' + e.y + ',' + e.z
        if (!first.has(key)) first.set(key, { x: e.x, y: e.y, z: e.z, id: e.before })
      }
      return [...first.values()]
    },
  }
}
