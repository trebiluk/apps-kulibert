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
// 2.5.557: which server rev this device last synced, and which local save that was (updatedAt as an opaque id, never compared by order).
const marks = Object.create(null)
let dbName = 'kuliblocks'
// Topia sync P1: one push in flight per world, one waiting doc per world, one timer per world.
const inflight = Object.create(null)
const pendingDocs = Object.create(null)
const pendTimers = Object.create(null)
const WINDOW = 20000
let onlineHandler = null
// 2.5.595: a push the page could not finish before it closed is sent in one go with fetch keepalive, as the same PUT a normal
// push makes (same headers, same If-Match), using the last server rev this page read. sendBeacon is not used: it cannot carry
// If-Match, so the server could not tell a stale copy from a fresh one. A world's flushed doc is remembered so a normal push
// does not send the same edit twice. Browsers allow about 64 KB of keepalive bodies per page; a bigger doc stays pending here.
const lastRev = Object.create(null)
const flushedDoc = Object.create(null)
let hideHandler = null
const KEEPALIVE_MAX = 60000

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


async function keepBoth(localDoc) {
  try {
    const world = localDoc.id
    const server = await fetchHead(world)
    if (!server || !server.head) return
    const freshRev = server.rev || 0 // P1: If-Match uses the rev we just read, never the stale one
    const keys = Object.keys(server.chunks || {})
    const chunks = keys.length ? await fetchChunks(world, keys) : {}
    if (!chunks) return
    const school = { ...server.head, chunks, id: world + '-school-copy', title: (server.head.title || 'Bertyville') + ' (school copy)' }
    await withStore((store) => { store.put(school, school.id) })   // 2.5.557: the app's own IndexedDB (setSyncDb)
    showKeepBothCard()
    // re-push current with the fresh server rev
    const head = { ...localDoc }
    delete head.chunks
    if (!head.format) head.format = 'kuliblocks'
    if (head.v == null) head.v = 2
    if (typeof head.schema !== 'number') head.schema = 2
    const body = { head, chunks: localDoc.chunks || {}, drop: [] }
    const putRes = await fetch(BASE + '?world=' + encodeURIComponent(world), {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'If-Match': String(freshRev) },
      body: JSON.stringify(body),
    })
    if (putRes.ok) {
      lastPush[world] = Date.now()
      let rev = freshRev + 1
      try { const j = await putRes.json(); if (j && typeof j.rev === 'number') rev = j.rev } catch (e) {}
      markSynced(world, localDoc, rev)
      try { setSyncState('saved') } catch (e) {}
    }
  } catch (e) {}
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

// 2.5.557: remember what the server now has for this world, in memory and on the stored world.
function markSynced(world, doc, rev) {
  marks[world] = { syncRev: rev, syncedAt: doc.updatedAt }
  storeMark(world, doc, rev)
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

// Reads the server head for one world. Returns { rev, chunks } or null; null means "skip this push".
async function readHead(world) {
  try {
    const getRes = await fetch(BASE + '?world=' + encodeURIComponent(world), { credentials: 'include' })
    if (getRes.status === 404) { lastRev[world] = 0; return { rev: 0, chunks: {} } }
    if (!getRes.ok) {
      if ([401, 413, 429, 503].includes(getRes.status)) stopped = true
      return null
    }
    const server = await getRes.json()
    if (!server || !server.ok) return null
    lastRev[world] = server.rev || 0
    return { rev: server.rev || 0, chunks: server.chunks || {} }
  } catch (e) {
    return null
  }
}

// One PUT attempt. Returns 'ok', 'conflict', 'stopped', 'skip' or 'net'.
async function putOnce(doc, world) {
  const got = await readHead(world)
  if (!got) return stopped ? 'stopped' : 'net'
  const rev = got.rev
  const serverChunks = got.chunks

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
    if (putRes.status === 409) return 'conflict'
    if ([401, 413, 429, 503].includes(putRes.status)) { stopped = true; return 'stopped' }
    if (putRes.ok) {
      lastPush[world] = Date.now()
      delete lastRev[world] // the rev moved; the next push (or flush) reads it again before it sends
      let synced = rev + 1 // 2.5.557: the server moves the If-Match rev up by one
      try {
        const j = await putRes.clone().json()
        if (j && typeof j.rev === 'number') { lastRev[world] = j.rev; synced = j.rev }
      } catch (e) {}
      markSynced(world, doc, synced)
      return 'ok'
    }
    return 'skip'
  } catch (e) {
    return 'net' // offline or network: the doc stays pending and is retried
  }
}

function armTimer(world, delay) {
  if (pendTimers[world] || typeof setTimeout === 'undefined') return
  pendTimers[world] = setTimeout(() => {
    delete pendTimers[world]
    const d = pendingDocs[world]
    if (d && !stopped) pushNow(d).catch(() => {})
  }, Math.max(50, delay))
}

async function runPush(doc) {
  const world = doc.id
  if (!(await isVerified())) { try { setSyncState('nosign') } catch (e) {} return }
  try { setSyncState('saving') } catch (e) {}

  let result = await putOnce(doc, world)
  if (result === 'conflict') {
    // Lane 1's server answers 409 {rev}: read the head again and try once more with that rev.
    result = await putOnce(doc, world)
    if (result === 'conflict') {
      if (!logged409) { console.log('bt-sync 409'); logged409 = true }
      await keepBoth(doc)
      return
    }
  }
  if (result === 'ok') {
    if (pendingDocs[world] === doc) delete pendingDocs[world]
    try { setSyncState('saved') } catch (e) {}
  } else if (result === 'net') {
    pendingDocs[world] = pendingDocs[world] || doc
    try { setSyncState('offline') } catch (e) {}
    armTimer(world, WINDOW)
  }
}

function pushNow(doc, force) {
  if (stopped || !doc || !doc.id) return Promise.resolve()
  const world = doc.id
  // Already sent in one go when the page was closing or hidden: do not send the same edit twice.
  if (flushedDoc[world] === doc) { if (pendingDocs[world] === doc) delete pendingDocs[world]; return Promise.resolve() }
  // Busy: keep the newest doc and push it when the current push finishes.
  if (inflight[world]) { pendingDocs[world] = doc; return inflight[world] }
  // Throttled: keep the doc and push it when the 20 s window ends.
  // A doc that arrived while a push was busy goes right after it (force), so a tab closed soon after still got both edits up.
  const now = Date.now()
  const wait = (!force && lastPush[world]) ? WINDOW - (now - lastPush[world]) : 0
  if (wait > 0) { pendingDocs[world] = doc; armTimer(world, wait); return Promise.resolve() }
  if (pendTimers[world]) { clearTimeout(pendTimers[world]); delete pendTimers[world] }

  const job = runPush(doc).catch(() => {}).then(() => {
    delete inflight[world]
    const next = pendingDocs[world]
    if (next && next !== doc && !stopped) return pushNow(next, true)
  })
  inflight[world] = job
  return job
}

// The whole doc as one PUT body, no chunk diff (there is no time for a hash pass or a GET when the page is closing).
function wholeBody(doc) {
  const head = { ...doc }
  delete head.chunks
  if (!head.format) head.format = 'kuliblocks'
  if (head.v == null) head.v = 2
  if (typeof head.schema !== 'number') head.schema = 2
  if (!head.app && head.appVersion) head.app = String(head.appVersion).slice(0, 40)
  const chunks = {}
  for (const [ck, data] of Object.entries(doc.chunks || {})) if (typeof data === 'string') chunks[ck] = data
  return JSON.stringify({ head, chunks, drop: [] })
}

// The page is closing or hidden: send what is still waiting, in one go, if it can be sent safely.
// Safe means this page has read a server rev for the world (so If-Match is honest), nothing is already in flight for it, and the
// doc is not one this page already flushed. Otherwise the doc stays pending here and is pushed, or pulled over, on the next load.
function flushPending() {
  if (stopped || typeof fetch === 'undefined') return
  for (const world of Object.keys(pendingDocs)) {
    const doc = pendingDocs[world]
    if (!doc || flushedDoc[world] === doc || inflight[world]) continue
    const rev = lastRev[world]
    if (typeof rev !== 'number') continue // never seen this world's rev on this page: a blind PUT could overwrite the school copy
    let body
    try { body = wholeBody(doc) } catch (e) { continue }
    const url = BASE + '?world=' + encodeURIComponent(world)
    if (body.length > KEEPALIVE_MAX) continue // too big to send on the way out: it stays pending and goes up on the next load
    let sent = false
    try {
      fetch(url, {
        method: 'PUT',
        credentials: 'include',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'If-Match': String(rev) },
        body,
      }).catch(() => {})
      sent = true
    } catch (e) { sent = false }
    if (sent) {
      flushedDoc[world] = doc
      if (pendTimers[world]) { clearTimeout(pendTimers[world]); delete pendTimers[world] }
      lastPush[world] = Date.now()
      // no sync mark: a keepalive answer is never read, so the next load treats this world as unsynced and pushes it
    }
  }
}

function armHide() {
  if (hideHandler || typeof window === 'undefined') return
  hideHandler = () => { try { flushPending() } catch (e) {} }
  window.addEventListener('pagehide', hideHandler)
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { try { if (document.hidden) flushPending() } catch (e) {} })
}

function armOnline() {
  if (onlineHandler || typeof window === 'undefined') return
  onlineHandler = () => {
    if (stopped) return
    for (const world of Object.keys(pendingDocs)) {
      if (pendTimers[world]) { clearTimeout(pendTimers[world]); delete pendTimers[world] }
      pushNow(pendingDocs[world]).catch(() => {})
    }
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
      armHide()
    }
    if (stopped || !doc || !doc.id) return
    pendingDocs[doc.id] = doc
    if (typeof navigator !== 'undefined' && !navigator.onLine) { try { setSyncState('offline') } catch (e) {} return }
    // The local save that hands us this doc is async, so on a closing tab it can land after pagehide already fired:
    // when the page is hidden, send it on the way out instead of starting a push that cannot finish.
    if (typeof document !== 'undefined' && document.hidden) { flushPending(); return }
    pushNow(doc).catch(() => {})
  } catch (e) {}
}
