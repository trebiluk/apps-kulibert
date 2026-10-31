// The world database on Durable Object SQLite storage (ctx.storage.sql). Same methods as memdb.js.
// Not runnable outside workerd: Debugzy proves it under `wrangler dev` (see the acceptance steps).
export function sqlDb(ctx) {
  const sql = ctx.storage.sql
  sql.exec('CREATE TABLE IF NOT EXISTS chunks(cx INTEGER, cz INTEGER, d TEXT NOT NULL, PRIMARY KEY(cx, cz))')
  sql.exec('CREATE TABLE IF NOT EXISTS ops(s INTEGER PRIMARY KEY, w INTEGER, x INTEGER, y INTEGER, z INTEGER, b INTEGER, i INTEGER, t INTEGER)')
  sql.exec('CREATE TABLE IF NOT EXISTS meta(k TEXT PRIMARY KEY, v TEXT)')
  const one = (q, ...a) => sql.exec(q, ...a).toArray()[0]
  return {
    getChunk: (cx, cz) => one('SELECT d FROM chunks WHERE cx=? AND cz=?', cx, cz)?.d ?? null,
    getMeta: (k) => one('SELECT v FROM meta WHERE k=?', k)?.v ?? null,
    opsSince: (s, n) => sql.exec('SELECT s,w,x,y,z,b,i,t FROM ops WHERE s>? ORDER BY s LIMIT ?', s, n).toArray(),
    oldestOp: () => one('SELECT MIN(s) AS m FROM ops')?.m ?? null,
    purgeOps(before) { sql.exec('DELETE FROM ops WHERE t < ?', before); return one('SELECT changes() AS n')?.n ?? 0 },
    *allChunks() { for (const r of sql.exec('SELECT cx,cz,d FROM chunks')) yield [r.cx, r.cz, r.d] },
    commit({ chunks = [], ops = [], meta = {}, keep = 20000 }) {
      ctx.storage.transactionSync(() => {
        for (const [cx, cz, d] of chunks) sql.exec('INSERT OR REPLACE INTO chunks VALUES(?,?,?)', cx, cz, d)
        for (const o of ops) sql.exec('INSERT OR REPLACE INTO ops VALUES(?,?,?,?,?,?,?,?)', o.s, o.w, o.x, o.y, o.z, o.b, o.i, o.t)
        for (const k of Object.keys(meta)) sql.exec('INSERT OR REPLACE INTO meta VALUES(?,?)', k, meta[k])
        sql.exec('DELETE FROM ops WHERE s <= (SELECT MAX(s) FROM ops) - ?', keep)
      })
    },
  }
}
