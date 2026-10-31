import { setSyncState } from './sync-chip.js'
// Server copy for Bertopia worlds. Active only with ?sync=1.
// Push-only was S2a; this adds pull when local is missing or older.
// Never throws into the caller. Never loads without ?sync=1 + signed-in.

const WHO = 'https://tw.kulibert.net/api/who'
const BASE = 'https://tw.kulibert.net/api/bertopia/world'

let active = false
let stopped = false
let logged409 = false
let verified = null
const lastPush = Object.create(null)
// Which server rev this device last synced, and which local save that was (updatedAt as an opaque id, never compared by order).
const marks = Object.create(null)
let dbName = 'kuliblocks'
let onlineHandler = null
// Push queue, one lane per world. pending[w] is the newest doc the server has not confirmed.
// busy[w] is true while a push runs. timers[w] is the single wake-up for a throttled or failed push.
const WINDOW_MS = 20000
const pending = Object.create(null)
const seqs = Object.create(null)
const busy = Object.create(null)
const timers = Object.create(null)

function flagOn() {
  try {
    if (typeof location !== 'undefined' && /(?:\?|&)sync=1(?:&|$)/.test(location.search)) return true
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bt-sync') === '1') return true
  } catch (e) {}
  return false
}

function persistFlag() {
  try {
    if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('bt-sync', '1')
  } catch (e) {}
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  let hex = ''
  for (const b of new Uint8Array(buf)) hex += b.toString(16).padStart(2, '0')
  return hex
}

// The main app tells us which IndexedDB it uses (student door vs test page), so backups never touch the other one.
export function setSyncDb(name) {
  if (typeof name === 'string' && name) dbName = name
}

// Persisted onto each saved world so a reload knows what the server already has.
export function syncMark(world) {
  const m = marks[world]
  return m ? { syncRev: m.syncRev, syncedAt: m.syncedAt } : {}
}

function seedMark(world, doc) {
  if (!doc || typeof doc.syncRev !== 'number') return
  const cur = marks[world]
  if (!cur || cur.syncRev < doc.syncRev) marks[world] = { syncRev: doc.syncRev, syncedAt: doc.syncedAt }
}

function isDirty(doc) {
  // Saved since the last sync = its updatedAt is not the one we last pushed or pulled. Equality only, no clocks.
  return !doc || typeof doc.syncRev !== 'number' || doc.syncedAt !== doc.updatedAt
}

// Open the app's own database. Same shape as main's idb(): version 1, a 'worlds' store.
function openDb() {
  return new Promise((res, rej) => {
    let r
    try { r = indexedDB.open(dbName, 1) } catch (e) { rej(e); return }
    r.onupgradeneeded = () => {
      try { if (!r.result.objectStoreNames.contains('worlds')) r.result.createObjectStore('worlds') } catch (e) {}
    }
    r.onblocked = () => rej(new Error('blocked'))
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error || new Error('open'))
  })
}

// One readwrite step on the 'worlds' store. fn(store) may call store.get/put; the promise settles on commit, abort or a throw.
async function withStore(fn) {
  const db = await openDb()
  try {
    return await new Promise((res, rej) => {
      let tx
      let out
      try {
        tx = db.transaction('worlds', 'readwrite')
        out = fn(tx.objectStore('worlds'))
      } catch (e) { rej(e); return }
      tx.oncomplete = () => res(out)
      tx.onerror = () => rej(tx.error || new Error('tx'))
      tx.onabort = () => rej(tx.error || new Error('abort'))
    })
  } finally {
    try { db.close() } catch (e) {}
  }
}

async function isVerified() {
  if (verified !== null) return verified
  try {
    const res = await fetch(WHO, { credentials: 'include' })
    if (!res.ok) { verified = false; return false }
    const json = await res.json()
    verified = !!(json && json.verified)
    return verified
  } catch (e) {
    verified = false
    return false
  }
}

async function fetchHead(world) {
  const res = await fetch(BASE + '?world=' + encodeURIComponent(world), { credentials: 'include' })
  if (res.status === 404) return null
  if (!res.ok) {
    if ([401, 413, 429, 503].includes(res.status)) stopped = true
    return null
  }
  const json = await res.json()
  return (json && json.ok) ? json : null
}

async function fetchChunks(world, keys) {
  const out = {}
  for (let i = 0; i < keys.length; i += 64) {
    const batch = keys.slice(i, i + 64)
    const url = BASE + '?world=' + encodeURIComponent(world) + '&ck=' + batch.map(encodeURIComponent).join(',')
    const res = await fetch(url, { credentials: 'include' })
    if (!res.ok) return null
    const json = await res.json()
    if (!json || !json.ok || !json.chunks) return null
    Object.assign(out, json.chunks)
  }
  return out
}

async function backupBefore(doc) {
  if (!doc) return
  try {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const rec = { name: 'before-server-load', at: Date.now(), bytes: 0, doc, kind: '' }
    try { rec.bytes = JSON.stringify(doc).length } catch (e) {}
    await withStore((store) => { store.put(rec, (doc.id || 'bertyville-survival') + '-backup-' + id) })
  } catch (e) {}
}

export async function maybePull(worldId, localDoc) {
  try {
    seedMark(worldId, localDoc)
    if (!flagOn() || stopped || !(await isVerified())) return null
    const server = await fetchHead(worldId)
    if (!server || !server.head) return null
    const serverRev = typeof server.rev === 'number' ? server.rev : 0
    if (localDoc) {
      // A device that saved since its last sync keeps its own world, whatever the clocks say; the push below sends it.
      if (isDirty(localDoc)) { maybePush(localDoc); return null }
      if (serverRev <= localDoc.syncRev) return null
    }
    const keys = Object.keys(server.chunks || {})
    const chunks = keys.length ? await fetchChunks(worldId, keys) : {}
    if (chunks === null) return null
    if (localDoc) await backupBefore(localDoc)
    const doc = { ...server.head, chunks, id: worldId, syncRev: serverRev, syncedAt: server.head.updatedAt }
    marks[worldId] = { syncRev: serverRev, syncedAt: server.head.updatedAt }
    return doc
  } catch (e) {
    return null
  }
}


// Outcome of a push: 'ok' (on the server), 'retry' (try again later), 'drop' (give up: stopped or signed out).
async function keepBoth(localDoc) {
  try {
    const world = localDoc.id
    const server = await fetchHead(world)
    if (!server || !server.head) return stopped ? 'drop' : 'retry'
    const keys = Object.keys(server.chunks || {})
    const chunks = keys.length ? await fetchChunks(world, keys) : {}
    if (!chunks) return 'retry'
    const school = { ...server.head, chunks, id: world + '-school-copy', title: (server.head.title || 'Bertyville') + ' (school copy)' }
    await withStore((store) => { store.put(school, school.id) })
    showKeepBothCard()
    // re-push current on top of the server copy we just fetched: its rev, not the one the 409 came from
    const head = { ...localDoc }
    delete head.chunks
    if (!head.format) head.format = 'kuliblocks'
    if (head.v == null) head.v = 2
    if (typeof head.schema !== 'number') head.schema = 2
    const body = { head, chunks: localDoc.chunks || {}, drop: [] }
    const res = await fetch(BASE + '?world=' + encodeURIComponent(world), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'If-Match': String(server.rev || 0) },
      body: JSON.stringify(body),
    })
    return afterPut(res, world, localDoc, server.rev || 0)
  } catch (e) {
    return 'retry'
  }
}

function showKeepBothCard() {
  if (typeof document === 'undefined') return
  const card = document.createElement('div')
  card.setAttribute('role', 'dialog')
  card.setAttribute('aria-modal', 'true')
  card.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;z-index:9999;'
  const box = document.createElement('div')
  box.style.cssText = 'background:#f7f4ef;color:#1a1a1a;padding:28px 32px;border-radius:16px;max-width:420px;text-align:left;font:16px/1.4 system-ui,sans-serif;'
  box.innerHTML = '<p style="margin:0 0 8px;font-weight:600;">Two copies found.</p><p style="margin:0 0 20px;">We kept both.</p>'
  const ok = document.createElement('button')
  ok.textContent = 'OK'
  ok.style.cssText = 'background:#2563eb;color:#fff;border:0;border-radius:8px;padding:12px 28px;font-size:16px;cursor:pointer;min-width:44px;min-height:44px;'
  ok.addEventListener('click', () => { card.remove(); try { document.body.focus() } catch (e) {} })
  box.appendChild(ok)
  card.appendChild(box)
  document.body.appendChild(card)
  ok.focus()
  const close = (e) => { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); card.remove(); try { document.body.focus() } catch (e) {} } }
  card.addEventListener('keydown', close)
  card.addEventListener('click', (e) => { if (e.target === card) card.remove() })
}

// Reads a PUT answer once, for both the normal push and the keepBoth re-push.
// sentRev is the If-Match rev; the server moves it up by one.
async function afterPut(putRes, world, doc, sentRev) {
  if (putRes.ok) {
    let rev = sentRev + 1
    try { const j = await putRes.json(); if (j && typeof j.rev === 'number') rev = j.rev } catch (e) {}
    lastPush[world] = Date.now()
    marks[world] = { syncRev: rev, syncedAt: doc.updatedAt }
    storeMark(world, doc, rev)
    try { setSyncState('saved') } catch (e) {}
    return 'ok'
  }
  if ([401, 413, 503].includes(putRes.status)) { stopped = true; return 'drop' }
  return 'retry' // 429 (server window), 409 again, 5xx: wait and push again
}

// Best effort: stamp the stored world with what the server now has, if no newer save has replaced it.
function storeMark(world, doc, rev) {
  if (!doc.updatedAt) return
  withStore((store) => {
    const g = store.get(world)
    g.onsuccess = () => {
      const rec = g.result
      if (rec && rec.updatedAt === doc.updatedAt) store.put({ ...rec, syncRev: rev, syncedAt: doc.updatedAt }, world)
    }
  }).catch(() => {})
}

async function pushNow(doc) {
  if (stopped || !doc || !doc.id) return 'drop'
  const world = doc.id

  if (!(await isVerified())) { try { setSyncState("nosign") } catch (e) {} return 'drop' }
  try { setSyncState("saving") } catch (e) {}

  let rev = 0
  let serverChunks = {}
  try {
    const getRes = await fetch(BASE + '?world=' + encodeURIComponent(world), { credentials: 'include' })
    if (getRes.status === 404) {
      rev = 0
    } else if (!getRes.ok) {
      if ([401, 413, 429, 503].includes(getRes.status)) { stopped = true; return 'drop' }
      return 'retry'
    } else {
      const server = await getRes.json()
      if (!server || !server.ok) return 'retry'
      rev = server.rev || 0
      serverChunks = server.chunks || {}
    }
  } catch (e) {
    return 'retry'
  }

  const head = { ...doc }
  delete head.chunks
  if (!head.format) head.format = 'kuliblocks'
  if (head.v == null) head.v = 2
  if (typeof head.schema !== 'number') head.schema = 2
  if (!head.app && head.appVersion) head.app = String(head.appVersion).slice(0, 40)

  const local = doc.chunks || {}
  const toSend = {}
  const drop = []
  for (const [ck, data] of Object.entries(local)) {
    if (typeof data !== 'string') continue
    const hash = await sha256Hex(data)
    if (!serverChunks[ck] || serverChunks[ck].hash !== hash) toSend[ck] = data
  }
  for (const ck of Object.keys(serverChunks)) {
    if (!(ck in local)) drop.push(ck)
  }

  const body = { head, chunks: toSend, drop }
  try {
    const putRes = await fetch(BASE + '?world=' + encodeURIComponent(world), {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'If-Match': String(rev),
      },
      body: JSON.stringify(body),
    })
    if (putRes.status === 409) {
      if (!logged409) { console.log('bt-sync 409'); logged409 = true }
      return await keepBoth(doc)
    }
    return afterPut(putRes, world, doc, rev)
  } catch (e) {
    return 'retry' // offline or network
  }
}

function disarm(world) {
  if (timers[world]) { clearTimeout(timers[world]); delete timers[world] }
}

// One timer per world. It pushes whatever is pending when it fires.
function arm(world, ms) {
  if (timers[world]) return
  timers[world] = setTimeout(() => { delete timers[world]; kick(world) }, Math.max(0, ms) + 50)
}

// Start a push for this world if none is running and the 20 s window is open.
// A busy world keeps its pending doc; finish() pushes again when the running push ends.
function kick(world) {
  try {
    if (stopped || busy[world]) return
    const doc = pending[world]
    if (!doc) return
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { try { setSyncState('offline') } catch (e) {} return }
    const wait = lastPush[world] ? lastPush[world] + WINDOW_MS - Date.now() : 0
    if (wait > 0) { arm(world, wait); return }
    busy[world] = true
    const seq = seqs[world]
    pushNow(doc).catch(() => 'retry').then((out) => finish(world, seq, out))
  } catch (e) {
    busy[world] = false
  }
}

function finish(world, seq, out) {
  busy[world] = false
  // Clear the pending doc only if nothing newer arrived while the push ran.
  const same = seqs[world] === seq
  if ((out === 'ok' || out === 'drop') && same) delete pending[world]
  if (out === 'retry') { arm(world, WINDOW_MS); return }
  if (pending[world]) kick(world)
}

function armOnline() {
  if (onlineHandler || typeof window === 'undefined') return
  onlineHandler = () => {
    if (stopped) return
    for (const world of Object.keys(pending)) { disarm(world); kick(world) }
  }
  window.addEventListener('online', onlineHandler)
}

export function maybePush(doc) {
  try {
    if (!active) {
      if (!flagOn()) return
      active = true
      persistFlag()
      armOnline()
    }
    if (stopped || !doc || !doc.id) return
    pending[doc.id] = doc
    seqs[doc.id] = (seqs[doc.id] || 0) + 1
    if (typeof navigator !== 'undefined' && !navigator.onLine) { try { setSyncState('offline') } catch (e) {} return }
    kick(doc.id)
  } catch (e) {}
}
