// Block-change log. Separate IndexedDB from the world save. Flush off the frame.
const RETAIN_MS = 14 * 24 * 60 * 60 * 1000
const MAX_BYTES = 5 * 1024 * 1024
const BUCKET = 10 * 60 * 1000

export function createLog({ dbName, worldId: initialWorld, chunkSize }) {
  const pending = []
  let dbp = null
  let bytes = 0
  let worldId = initialWorld

  function idb() {
    if (dbp) return dbp
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open(dbName, 1)
      r.onupgradeneeded = () => r.result.createObjectStore('buckets')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    return dbp
  }
  function pack(rows) {
    const n = rows.length
    const buf = new ArrayBuffer(8 + n * 20)
    const view = new DataView(buf)
    view.setUint32(0, 0x424c4f58, true)
    view.setUint32(4, n, true)
    for (let i = 0; i < n; i++) {
      const o = 8 + i * 20
      const row = rows[i]
      view.setUint32(o, Math.floor(row.t / 1000), true)
      view.setInt32(o + 4, row.x, true)
      view.setInt32(o + 8, row.y, true)
      view.setInt32(o + 12, row.z, true)
      view.setUint16(o + 16, row.before, true)
      view.setUint16(o + 18, row.after, true)
    }
    return new Uint8Array(buf)
  }
  function unpack(u8) {
    const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength)
    const n = view.getUint32(4, true)
    const rows = []
    for (let i = 0; i < n; i++) {
      const o = 8 + i * 20
      rows.push({
        t: view.getUint32(o, true) * 1000,
        x: view.getInt32(o + 4, true),
        y: view.getInt32(o + 8, true),
        z: view.getInt32(o + 12, true),
        before: view.getUint16(o + 16, true),
        after: view.getUint16(o + 18, true),
        actor: 'you',
        source: 'hand',
      })
    }
    return rows
  }
  async function gz(u8) {
    const cs = new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'))
    return new Uint8Array(await new Response(cs).arrayBuffer())
  }
  async function ungz(u8) {
    const ds = new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))
    return new Uint8Array(await new Response(ds).arrayBuffer())
  }
  function setWorld(id) { worldId = id }
  function note(group, actor = 'you') {
    if (!group) return
    for (let i = 0; i < group.n; i++) {
      pending.push({
        t: group.at, x: group.xyz[i * 3], y: group.xyz[i * 3 + 1], z: group.xyz[i * 3 + 2],
        before: group.before[i], after: group.after[i], actor, source: group.source,
      })
    }
  }
  async function flush() {
    if (!pending.length) return 0
    const batch = pending.splice(0, pending.length)
    const groups = new Map()
    for (const row of batch) {
      const ci = Math.floor(row.x / chunkSize), cj = Math.floor(row.y / chunkSize), ck = Math.floor(row.z / chunkSize)
      const bucket = Math.floor(row.t / BUCKET) * BUCKET
      const k = worldId + '|' + ci + ',' + cj + ',' + ck + '|' + bucket + '|' + row.t
      if (!groups.has(k)) groups.set(k, [])
      groups.get(k).push(row)
    }
    const db = await idb()
    let wrote = 0
    for (const [k, rows] of groups) {
      const packed = await gz(pack(rows))
      wrote += packed.byteLength
      await new Promise((res, rej) => {
        const tx = db.transaction('buckets', 'readwrite')
        tx.objectStore('buckets').put({ gz: packed, n: rows.length, t: rows[0].t, bytes: packed.byteLength, world: worldId }, k)
        tx.oncomplete = res
        tx.onerror = () => rej(tx.error)
      })
    }
    bytes += wrote
    return wrote
  }
  async function allKeys() {
    const db = await idb()
    return new Promise((res) => {
      const out = []
      const r = db.transaction('buckets').objectStore('buckets').openCursor()
      r.onsuccess = () => {
        const c = r.result
        if (!c) { res(out); return }
        if (String(c.key).startsWith(worldId + '|')) out.push({ key: c.key, t: c.value.t || 0, bytes: c.value.bytes || 0 })
        c.continue()
      }
      r.onerror = () => res(out)
    })
  }
  async function history(x, y, z) {
    await flush()
    const ci = Math.floor(x / chunkSize), cj = Math.floor(y / chunkSize), ck = Math.floor(z / chunkSize)
    const prefix = worldId + '|' + ci + ',' + cj + ',' + ck + '|'
    const db = await idb()
    const keys = await allKeys()
    const hits = []
    for (const item of keys) {
      if (!String(item.key).startsWith(prefix)) continue
      const rec = await new Promise((res) => {
        const r = db.transaction('buckets').objectStore('buckets').get(item.key)
        r.onsuccess = () => res(r.result)
        r.onerror = () => res(null)
      })
      if (!rec) continue
      const rows = unpack(await ungz(rec.gz))
      for (const row of rows) if (row.x === x && row.y === y && row.z === z) hits.push(row)
    }
    hits.sort((a, b) => b.t - a.t)
    return hits.slice(0, 10)
  }
  async function prune(nowMs = Date.now()) {
    await flush()
    const keys = (await allKeys()).sort((a, b) => a.t - b.t)
    const db = await idb()
    let total = keys.reduce((n, k) => n + k.bytes, 0)
    const drop = []
    for (const item of keys) {
      if (item.t < nowMs - RETAIN_MS || total > MAX_BYTES) {
        drop.push(item.key)
        total -= item.bytes
      }
    }
    if (!drop.length) { bytes = total; return 0 }
    await new Promise((res, rej) => {
      const tx = db.transaction('buckets', 'readwrite')
      const store = tx.objectStore('buckets')
      for (const k of drop) store.delete(k)
      tx.oncomplete = res
      tx.onerror = () => rej(tx.error)
    })
    bytes = Math.max(0, total)
    return drop.length
  }
  async function clearWorld() {
    pending.length = 0
    const keys = await allKeys()
    if (!keys.length) return
    const db = await idb()
    await new Promise((res, rej) => {
      const tx = db.transaction('buckets', 'readwrite')
      const store = tx.objectStore('buckets')
      for (const item of keys) store.delete(item.key)
      tx.oncomplete = res
      tx.onerror = () => rej(tx.error)
    })
    bytes = 0
  }
  return { note, flush, history, prune, clearWorld, setWorld }
}
