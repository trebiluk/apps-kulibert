// Local teacher backups on this device only.
// A cloud copy is a later step. These keys never touch classic archives.
export function createBackups({ dbName, store, world, snapshot, applyDoc, save, toast, t }) {
  const prefix = () => world() + '-backup-'

  function openDb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(dbName, 1)
      r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(store)) r.result.createObjectStore(store) }
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error || new Error('idb'))
    })
  }
  function req(request) {
    return new Promise((res, rej) => {
      request.onsuccess = () => res(request.result)
      request.onerror = () => rej(request.error || new Error('idb'))
    })
  }
  async function withStore(mode, fn) {
    const db = await openDb()
    try {
      const tx = db.transaction(store, mode)
      const out = await fn(tx.objectStore(store))
      await new Promise((res, rej) => {
        tx.oncomplete = () => res()
        tx.onerror = () => rej(tx.error || new Error('idb'))
        tx.onabort = () => rej(tx.error || new Error('idb'))
      })
      return out
    } finally {
      try { db.close() } catch (e) {}
    }
  }
  function pad(n) { return String(n).padStart(2, '0') }
  function whenLabel(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes())
  }
  function clockLabel(d) {
    return pad(d.getHours()) + ':' + pad(d.getMinutes())
  }
  function className() {
    return t('classSnapName').replace('{when}', whenLabel(new Date()))
  }
  function beforeName() {
    return t('backupBefore').replace('{time}', clockLabel(new Date()))
  }
  async function backup(name, doc) {
    const clean = String(name || '').trim().slice(0, 40)
    if (!clean) return null
    const body = doc || await snapshot()
    let copy
    try { copy = JSON.parse(JSON.stringify(body)) } catch (e) { copy = body }
    let bytes = 0
    try { bytes = JSON.stringify(copy).length } catch (e) { bytes = 0 }
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const rec = { name: clean, at: Date.now(), bytes, doc: copy }
    await withStore('readwrite', (s) => { s.put(rec, prefix() + id); return null })
    await trim()
    return id
  }
  async function rows() {
    const pre = prefix()
    const keys = await withStore('readonly', (s) => req(s.getAllKeys()))
    const mine = (keys || []).filter((k) => typeof k === 'string' && k.indexOf(pre) === 0 && k.indexOf('-classic-') < 0)
    const out = []
    for (const k of mine) {
      const rec = await withStore('readonly', (s) => req(s.get(k)))
      if (!rec || !rec.doc) continue
      out.push({ id: k.slice(pre.length), key: k, name: String(rec.name || ''), at: rec.at || 0, bytes: rec.bytes || 0 })
    }
    out.sort((a, b) => (b.at - a.at) || String(b.id).localeCompare(String(a.id)))
    return out
  }
  async function list() { return rows() }
  async function trim() {
    const all = await rows()
    for (const row of all.slice(10)) {
      if (String(row.key).indexOf('-classic-') >= 0) continue
      await withStore('readwrite', (s) => { s.delete(row.key); return null })
    }
  }
  async function restore(id) {
    const key = prefix() + id
    const rec = await withStore('readonly', (s) => req(s.get(key)))
    if (!rec || !rec.doc) return false
    try { await save() } catch (e) {}
    await backup(beforeName())
    await applyDoc(rec.doc)
    try { await save() } catch (e) {}
    if (toast) toast(t('backupRestored'))
    return true
  }
  async function remove(id) {
    const key = prefix() + id
    if (key.indexOf('-classic-') >= 0) return
    await withStore('readwrite', (s) => { s.delete(key); return null })
  }
  return { backup, list, restore, remove, className }
}
