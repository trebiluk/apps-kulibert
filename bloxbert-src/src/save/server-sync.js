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
const lastPushedAt = Object.create(null)
// Topia sync P1: one push in flight per world, one waiting doc per world, one timer per world.
const inflight = Object.create(null)
const pendingDocs = Object.create(null)
const pendTimers = Object.create(null)
const WINDOW = 20000
let onlineHandler = null

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
    const DB = 'kuliblocks'
    const STORE = 'worlds'
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    const rec = { name: 'before-server-load', at: Date.now(), bytes: 0, doc, kind: '' }
    try { rec.bytes = JSON.stringify(doc).length } catch (e) {}
    await new Promise((res, rej) => {
      const r = indexedDB.open(DB, 1)
      r.onsuccess = () => {
        const db = r.result
        const tx = db.transaction(STORE, 'readwrite')
        tx.objectStore(STORE).put(rec, (doc.id || 'bertyville-survival') + '-backup-' + id)
        tx.oncomplete = () => { try { db.close() } catch (e) {}; res() }
        tx.onerror = () => rej(tx.error)
      }
      r.onerror = () => rej(r.error)
    })
  } catch (e) {}
}

export async function maybePull(worldId, localDoc) {
  try {
    if (!flagOn() || stopped || !(await isVerified())) return null
    const server = await fetchHead(worldId)
    if (!server || !server.head) return null
    const head = server.head
    const serverAt = head.updatedAt || ''
    const localAt = (localDoc && localDoc.updatedAt) || ''
    const lastPushAt = lastPushedAt[worldId] || ''
    const localNewerOrUnsaved = localDoc && (localAt > serverAt || (localAt && lastPushAt && localAt > lastPushAt))
    if (localDoc && localNewerOrUnsaved) return null
    if (localDoc) await backupBefore(localDoc)
    const keys = Object.keys(server.chunks || {})
    const chunks = keys.length ? await fetchChunks(worldId, keys) : {}
    if (chunks === null) return null
    const doc = { ...head, chunks, id: worldId }
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
    await new Promise((res, rej) => {
      const r = indexedDB.open('kuliblocks', 1)
      r.onsuccess = () => {
        const db = r.result
        const tx = db.transaction('worlds', 'readwrite')
        tx.objectStore('worlds').put(school, school.id)
        tx.oncomplete = () => { try { db.close() } catch (e) {}; res() }
        tx.onerror = () => rej(tx.error)
      }
      r.onerror = () => rej(r.error)
    })
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
      lastPushedAt[world] = localDoc.updatedAt || new Date().toISOString()
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

// Reads the server head for one world. Returns { rev, chunks } or null; null means "skip this push".
async function readHead(world) {
  try {
    const getRes = await fetch(BASE + '?world=' + encodeURIComponent(world), { credentials: 'include' })
    if (getRes.status === 404) return { rev: 0, chunks: {} }
    if (!getRes.ok) {
      if ([401, 413, 429, 503].includes(getRes.status)) stopped = true
      return null
    }
    const server = await getRes.json()
    if (!server || !server.ok) return null
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
      lastPushedAt[world] = doc.updatedAt || new Date().toISOString()
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
    }
    if (stopped || !doc || !doc.id) return
    pendingDocs[doc.id] = doc
    if (typeof navigator !== 'undefined' && !navigator.onLine) { try { setSyncState('offline') } catch (e) {} return }
    pushNow(doc).catch(() => {})
  } catch (e) {}
}
