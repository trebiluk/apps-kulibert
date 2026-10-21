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
let pendingDoc = null
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

async function pushNow(doc) {
  if (stopped || !doc || !doc.id) return
  const world = doc.id
  const now = Date.now()
  if (lastPush[world] && now - lastPush[world] < 20000) return

  if (!(await isVerified())) return

  let rev = 0
  let serverChunks = {}
  try {
    const getRes = await fetch(BASE + '?world=' + encodeURIComponent(world), { credentials: 'include' })
    if (getRes.status === 404) {
      rev = 0
    } else if (!getRes.ok) {
      if ([401, 413, 429, 503].includes(getRes.status)) stopped = true
      return
    } else {
      const server = await getRes.json()
      if (!server || !server.ok) return
      rev = server.rev || 0
      serverChunks = server.chunks || {}
    }
  } catch (e) {
    return
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
      return
    }
    if ([401, 413, 429, 503].includes(putRes.status)) {
      stopped = true
      return
    }
    if (putRes.ok) {
      lastPush[world] = Date.now()
      lastPushedAt[world] = doc.updatedAt || new Date().toISOString()
    }
  } catch (e) {
    // offline or network — keep pending
  }
}

function armOnline() {
  if (onlineHandler || typeof window === 'undefined') return
  onlineHandler = () => {
    if (pendingDoc && !stopped) {
      const d = pendingDoc
      pendingDoc = null
      pushNow(d).catch(() => {})
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
    if (stopped || !doc) return
    pendingDoc = doc
    if (typeof navigator !== 'undefined' && !navigator.onLine) return
    pushNow(doc).catch(() => {})
  } catch (e) {}
}
