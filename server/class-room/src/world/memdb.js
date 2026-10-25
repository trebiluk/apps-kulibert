// In-memory stand-in for the world database (tests). The Durable Object version uses
// ctx.storage.sql with the same five methods. commit() is all-or-nothing.
export function memDb() {
  const chunks = new Map()
  let ops = []
  const meta = new Map()
  const db = {
    fail: false,   // tests: make the next commit throw
    getChunk: (cx, cz) => chunks.get(cx + ',' + cz) ?? null,
    getMeta: (k) => meta.get(k) ?? null,
    opsSince: (s, limit) => ops.filter((o) => o.s > s).slice(0, limit),
    oldestOp: () => (ops.length ? ops[0].s : null),
    commit({ chunks: cs = [], ops: os = [], meta: m = {}, keep = 20000 }) {
      if (db.fail) { db.fail = false; throw new Error('commit failed') }
      for (const [cx, cz, str] of cs) chunks.set(cx + ',' + cz, str)
      ops = ops.concat(os).slice(-keep)
      for (const k of Object.keys(m)) meta.set(k, m[k])
    },
    *allChunks() { for (const [k, v] of chunks) { const [cx, cz] = k.split(',').map(Number); yield [cx, cz, v] } },
    chunkCount: () => chunks.size,
  }
  return db
}
