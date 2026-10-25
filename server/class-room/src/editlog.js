// Edit log for rollback ("undo the grief"). Pure, memory only, bounded. STANDALONE, NOT WIRED.
// Each accepted block edit is recorded with the id it replaced. A teacher/admin rolls back by
// time, optionally for one kid (by room id) or one rectangle (a plot). The log returns the
// INVERSE edits; the room applies them and tells the clients. Entries hold opaque room ids and
// block ids only, never aliases, refs or text.
//
// Memory only: when the room object is evicted the log is gone. Making it durable (so a
// rollback survives a restart) stores student-adjacent data and needs Diego's yes first.

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
