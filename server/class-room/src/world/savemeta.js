// Save safety: version, migrations with an "is it done?" flag, build separation, and a
// read-only health check for testers.
export const SAVE_FMT = 1

// A student build only touches student worlds; a test build only test worlds. bld: 's' | 't'.
export const buildAllowed = (worldIsTest, bld) => (bld === 't') === !!worldIsTest

// migrations: [{ id:'m001-name', map(chunkString) -> chunkString }]  (pure; one chunk at a time)
// Nothing runs by itself. A tester (staff) calls run(id). It is idempotent, keeps the old chunk in
// `bak:` rows, and sets the flag in the same commit as the new chunks.
export function makeMigrations(db, list) {
  const done = (id) => db.getMeta('mig:' + id) === '1'
  return {
    status: () => list.map((m) => ({ id: m.id, done: done(m.id) })),
    run(id) {
      const m = list.find((x) => x.id === id)
      if (!m) return { ok: false, why: 'unknown' }
      if (done(id)) return { ok: true, already: true }
      const rows = []
      const meta = { ['mig:' + id]: '1' }
      for (const [cx, cz, str] of db.allChunks()) {
        const next = m.map(str)
        if (next !== str) { rows.push([cx, cz, next]); meta['bak:' + id + ':' + cx + ',' + cz] = str }
      }
      db.commit({ chunks: rows, meta })
      return { ok: true, changed: rows.length }
    },
  }
}

// Read-only. Calls only get*/count*/oldest*/all* methods, never commit.
export function health(db, migrations) {
  const fmts = {}
  let chunks = 0
  for (const [, , str] of db.allChunks()) {
    chunks++
    let f = 'bad'
    try { const o = JSON.parse(str); f = Number.isInteger(o.f) ? o.f : 0 } catch (e) {}
    fmts[f] = (fmts[f] || 0) + 1
  }
  return {
    wseq: Number(db.getMeta('wseq') ?? 0), chunks, formats: fmts,
    oldestOp: db.oldestOp(), pendingMigrations: migrations.status().filter((m) => !m.done).map((m) => m.id),
    corrupt: fmts.bad || 0, newer: Object.keys(fmts).filter((f) => f !== 'bad' && Number(f) > SAVE_FMT).length,
  }
}
