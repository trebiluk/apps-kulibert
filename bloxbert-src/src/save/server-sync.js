// Push-only server copy for Bertopia worlds. Active only with ?sync=1.
// Never loads from server. Never throws into the caller.

const WHO = 'https://tw.kulibert.net/api/who'
const BASE = 'https://tw.kulibert.net/api/bertopia/world'

let active = false
let stopped = false
let logged409 = false
let verified = null
const lastPush = Object.create(null)
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
  // ensure required fields for checkHead
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
    if (putRes.ok) lastPush[world] = Date.now()
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
