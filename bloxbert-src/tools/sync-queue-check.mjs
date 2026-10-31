// Push queue in save/server-sync.js: one in-flight push per world, one timer per world, no fake "Two copies found".
// Pure node, no browser: fetch, timers, clock, navigator and indexedDB are stubbed.
// Usage: node tools/sync-queue-check.mjs            (tests ../src/save/server-sync.js)
//        SYNC_MODULE=/path/to/module.mjs node tools/sync-queue-check.mjs   (same checks on another build of the module)
import { createHash } from 'node:crypto'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import { fromDoc, fitPlayer } from '../src/save.js'
import { getSyncState, mountSyncChip, setSyncState, onSyncRetry } from '../src/save/sync-chip.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MOD = process.env.SYNC_MODULE ? pathToFileURL(path.resolve(process.env.SYNC_MODULE)).href : pathToFileURL(path.join(HERE, '../src/save/server-sync.js')).href

const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg) }

// ---- virtual clock and timers
let now = Date.parse('2026-10-31T12:00:00Z')
let timerSeq = 0
const timers = new Map()
const realSetImmediate = setImmediate
const realSetTimeout = setTimeout
globalThis.setTimeout = (fn, ms) => { const id = ++timerSeq; timers.set(id, { at: now + (ms || 0), fn }); return id }
globalThis.clearTimeout = (id) => { timers.delete(id) }
Date.now = () => now
// real macrotasks, because crypto.subtle.digest finishes on the thread pool
const flush = async () => { for (let i = 0; i < 5; i++) await new Promise((r) => realSetTimeout(r, 4)) }
async function advance(ms) {
  const end = now + ms
  for (;;) {
    const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]
    if (!due) break
    timers.delete(due[0])
    now = Math.max(now, due[1].at)
    due[1].fn()
    await flush()
  }
  now = end
  await flush()
}

// ---- fake server
const sha = (t) => createHash('sha256').update(t).digest('hex')
let srv
let net
function resetNet() {
  srv = { exists: false, rev: 0, head: null, chunks: {}, puts: [], gets: 0, holdPut: null, other: null, putStatus: [] }
  net = { onLine: true, failPut: 0 }
}
const listeners = {}
globalThis.window = { addEventListener: (ev, fn) => { (listeners[ev] ||= []).push(fn) } }
Object.defineProperty(globalThis, 'navigator', { value: { get onLine() { return net.onLine } }, configurable: true })
globalThis.location = { search: '?sync=1' }
let school = []
let idbs = {}
let idbOpts = {}
const idbPuts = []
// Named in-memory databases. A DB that is created fresh fires onupgradeneeded; an old one without the store makes transaction() throw.
globalThis.indexedDB = {
  open(name) {
    const r = {}
    realSetImmediate(() => {
      const fresh = !idbs[name]
      if (fresh) idbs[name] = { stores: {} }
      const d = idbs[name]
      r.result = {
        objectStoreNames: { contains: (n) => !!d.stores[n] },
        createObjectStore: (n) => { d.stores[n] = new Map() },
        transaction: (n) => {
          if (idbOpts.txThrows) throw new Error('InvalidStateError')
          const st = d.stores[n]
          if (!st) throw new Error('NotFoundError')
          const tx = {
            objectStore: () => ({
              put: (v, k) => { st.set(k, v); idbPuts.push({ db: name, key: k }); if (String(k).endsWith('-school-copy')) school.push(k) },
              get: (k) => { const q = {}; realSetImmediate(() => { q.result = st.get(k); q.onsuccess && q.onsuccess() }); return q },
            }),
          }
          realSetTimeout(() => tx.oncomplete && tx.oncomplete(), 8)
          return tx
        },
        close() {},
      }
      if (fresh && r.onupgradeneeded) r.onupgradeneeded()
      if (idbOpts.blocked) { r.onblocked && r.onblocked(); return }
      r.onsuccess && r.onsuccess()
    })
    return r
  },
}
const json = (status, body, headers = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => body, headers: { get: (k) => headers[String(k).toLowerCase()] ?? null } })
globalThis.fetch = async (url, opt = {}) => {
  if (String(url).includes('/api/who')) return json(200, { verified: true })
  if (!opt.method || opt.method === 'GET') {
    srv.gets++
    if (srv.onGet) srv.onGet()
    if (!srv.exists) return json(404, { ok: false })
    if (String(url).includes('&ck=')) {
      const tok = decodeURIComponent(String(url).split('&ck=')[1]).split(',')
      const want = []
      for (let i = 0; i < tok.length; i += 3) want.push(tok.slice(i, i + 3).join(',')) // same grouping as the server's key list
      const out = {}
      for (const k of want) if (k in srv.chunks) out[k] = srv.chunks[k]
      return json(200, { ok: true, chunks: out })
    }
    const chunks = {}
    for (const [k, v] of Object.entries(srv.chunks)) chunks[k] = { hash: sha(v), rev: srv.rev }
    return json(200, { ok: true, rev: srv.rev, schema: 6, head: srv.head, chunks })
  }
  const body = JSON.parse(opt.body)
  const rec = { ifMatch: Number(opt.headers['If-Match']), keys: Object.keys(body.chunks || {}), head: body.head }
  srv.puts.push(rec)
  if (net.failPut > 0) { net.failPut--; throw new TypeError('network') }
  if (srv.holdPut) await srv.holdPut
  const forced = srv.putStatus.shift()
  if (forced) return typeof forced === 'number' ? json(forced, { ok: false }) : json(forced.status, { ok: false }, forced.headers)
  if (rec.ifMatch !== srv.rev) return json(409, { ok: false, rev: srv.rev })
  srv.exists = true
  srv.rev += 1
  srv.head = body.head
  Object.assign(srv.chunks, body.chunks)
  for (const k of body.drop || []) delete srv.chunks[k]
  return json(200, { ok: true, rev: srv.rev })
}
let logs = []
Math.random = () => 0.5 // jitter factor 1.0: backoff waits are exactly 2 s, 4 s, 8 s ...
const realLog = console.log
console.log = (...a) => { logs.push(a.join(' ')) }

let n = 0
async function fresh() {
  resetNet(); logs = []; school = []; idbs = {}; idbOpts = {}; idbPuts.length = 0; timers.clear()
  for (const k of Object.keys(listeners)) delete listeners[k]
  n++
  return import(MOD + '?run=' + n)
}
const doc = (blocks, at) => ({ id: 'bertyville-survival', updatedAt: at || new Date(now).toISOString(), schema: 6, format: 'kuliblocks', v: 2, chunks: Object.fromEntries(blocks.map((b, i) => ['0,0,' + i, b])) })

// 1. two blocks inside one second while the first PUT is in flight: one PUT at a time, no 409, both end up on the server
{
  const { maybePush } = await fresh()
  let release
  srv.holdPut = new Promise((r) => { release = r })
  maybePush(doc(['a']))
  await flush()
  now += 1000
  maybePush(doc(['a', 'b']))
  await flush()
  eq(srv.puts.length === 1, 'busy world: second save does not start a second PUT (' + srv.puts.length + ')')
  srv.holdPut = null
  release()
  await flush()
  eq(srv.rev === 1 && srv.puts.length === 1, 'first push landed alone')
  await advance(19000)
  eq(srv.puts.length === 1, 'second push waits for the 20 s window')
  await advance(2000)
  eq(srv.puts.length === 2 && srv.rev === 2, 'pending doc pushed when the window ends (puts ' + srv.puts.length + ')')
  eq(JSON.stringify(Object.values(srv.chunks)) === '["a","b"]', 'both blocks are on the server')
  eq(srv.puts[1].ifMatch === 1, 'second PUT uses the fresh rev')
  eq(!logs.some((l) => l.includes('409')) && school.length === 0, 'no 409 and no school copy')
  await advance(60000)
  eq(srv.puts.length === 2, 'pending cleared on success: nothing pushed again')
}

// 2. edit 5 s after a save is pushed within 25 s
{
  const { maybePush } = await fresh()
  maybePush(doc(['a']))
  await flush()
  await advance(5000)
  maybePush(doc(['a', 'edit']))
  await flush()
  eq(srv.puts.length === 1, 'edit inside the window is held')
  await advance(20000)
  eq(srv.puts.length === 2 && srv.chunks['0,0,1'] === 'edit', 'edit pushed within 25 s of the first save')
}

// 3. offline edit then online: one PUT
{
  const { maybePush } = await fresh()
  net.onLine = false
  maybePush(doc(['a']))
  maybePush(doc(['a', 'b']))
  await flush()
  eq(srv.puts.length === 0 && srv.gets === 0, 'offline: nothing sent')
  net.onLine = true
  for (const fn of listeners.online || []) fn()
  await flush()
  eq(srv.puts.length === 1 && srv.chunks['0,0,1'] === 'b', 'online: exactly one PUT with the newest doc (' + srv.puts.length + ')')
}

// 4. network failure retries on a timer, then clears
{
  const { maybePush } = await fresh()
  net.failPut = 1
  maybePush(doc(['a']))
  await flush()
  eq(srv.puts.length === 1 && srv.rev === 0, 'network failure: nothing stored')
  await advance(21000)
  eq(srv.puts.length === 2 && srv.rev === 1, 'retried after the window')
  await advance(60000)
  eq(srv.puts.length === 2, 'no more retries after success')
}

// 5. keepBoth re-pushes with the fresh rev, not the stale one
{
  const { maybePush } = await fresh()
  srv.exists = true; srv.rev = 3; srv.head = { format: 'kuliblocks', v: 2, schema: 6, title: 'T' }; srv.chunks = { '9,9,9': 'theirs' }
  // other device writes between our GET (rev 3) and our PUT
  let gets = 0
  srv.onGet = () => { gets++; if (gets === 1) queueMicrotask(() => { srv.rev = 4 }) }
  maybePush(doc(['mine']))
  await flush()
  eq(srv.puts.length === 2, 'conflict: PUT, then one re-PUT (' + srv.puts.length + ')')
  eq(srv.puts[0].ifMatch === 3 && srv.puts[1] && srv.puts[1].ifMatch === 4, 'keepBoth uses the fresh server rev: ' + srv.puts.map((p) => p.ifMatch).join(','))
  eq(school.length === 1, 'real conflict keeps a school copy')
  eq(srv.rev === 5, 'local doc ends up on the server')
}

// 6. a server 429 on PUT is a wait, not a stop
{
  const { maybePush } = await fresh()
  srv.putStatus = [429]
  maybePush(doc(['a']))
  await flush()
  await advance(21000)
  eq(srv.puts.length === 2 && srv.rev === 1, '429 retried after the window')
}

// 7. one timer per world however many saves arrive
{
  const { maybePush } = await fresh()
  maybePush(doc(['a']))
  await flush()
  for (let i = 0; i < 6; i++) { maybePush(doc(['a', 'x' + i])); await flush() }
  eq(timers.size === 1, 'one timer for the world (' + timers.size + ')')
  await advance(21000)
  eq(srv.puts.length === 2 && srv.chunks['0,0,1'] === 'x5', 'newest doc wins')
}

// 8. 401 stops sync; nothing more is sent
{
  const { maybePush } = await fresh()
  srv.putStatus = [401]
  maybePush(doc(['a']))
  await flush()
  maybePush(doc(['a', 'b']))
  await advance(60000)
  eq(srv.puts.length === 1, '401: sync stopped (' + srv.puts.length + ')')
}

const WORLD = 'bertyville-survival'
const stored = (db, key = WORLD) => (idbs[db] && idbs[db].stores.worlds ? idbs[db].stores.worlds.get(key) : undefined)
const hang = (p) => Promise.race([p, new Promise((r) => realSetTimeout(() => r('HANG'), 1500))])
const synced = (over = {}) => ({ id: WORLD, updatedAt: '2026-10-31T09:00:00.000Z', syncRev: 3, syncedAt: '2026-10-31T09:00:00.000Z', chunks: { '0,0,0': 'a' }, ...over })
function serverAt(rev, updatedAt, chunk = 'srv') {
  srv.exists = true; srv.rev = rev; srv.head = { format: 'kuliblocks', v: 2, schema: 6, id: WORLD, updatedAt, title: 'T' }; srv.chunks = { '0,0,0': chunk }
}

// 9. clock set back 1 h, edit offline, reload online: local edit wins and reaches the server
{
  const { maybePull } = await fresh()
  serverAt(3, '2026-10-31T09:30:00.000Z')
  // the offline edit carries an EARLIER updatedAt than the server head (device clock was set back)
  const local = synced({ updatedAt: '2026-10-31T08:00:00.000Z', chunks: { '0,0,0': 'edited offline' } })
  idbs.kuliblocks = { stores: { worlds: new Map([[WORLD, local]]) } }
  const got = await hang(maybePull(WORLD, local))
  eq(got === null, 'dirty local doc is not replaced by the server copy (' + String(got && got.id) + ')')
  await flush()
  eq(srv.puts.length === 1 && srv.puts[0].ifMatch === 3 && srv.chunks['0,0,0'] === 'edited offline', 'local edit reaches the server (puts ' + srv.puts.length + ')')
  const rec = stored('kuliblocks')
  eq(rec && rec.syncRev === 4 && rec.syncedAt === '2026-10-31T08:00:00.000Z', 'stored world is stamped with the new server rev')
}

// 10. saved and unchanged since the last sync, server moved on: pull, with a backup
{
  const { maybePull } = await fresh()
  serverAt(5, '2026-10-31T10:00:00.000Z', 'from other device')
  const local = synced()
  const got = await hang(maybePull(WORLD, local))
  eq(got && got !== 'HANG' && got.syncRev === 5 && got.chunks['0,0,0'] === 'from other device', 'clean local doc takes the newer server rev')
  eq(got && got.syncedAt === '2026-10-31T10:00:00.000Z', 'pulled doc is marked as synced')
  eq(idbPuts.some((p) => p.db === 'kuliblocks' && p.key.includes('-backup-')), 'local copy backed up before the pull')
  eq(srv.puts.length === 0, 'pull does not push')
}

// 11. server has the same rev, or an older clock but a newer rev elsewhere: nothing to pull
{
  const { maybePull } = await fresh()
  serverAt(3, '2030-01-01T00:00:00.000Z')
  const got = await hang(maybePull(WORLD, synced()))
  eq(got === null && srv.puts.length === 0, 'same rev: no pull, no push, whatever the server clock says')
}

// 12. never synced local world + server copy: local is kept and pushed; no local world: pull
{
  const { maybePull } = await fresh()
  serverAt(2, '2026-10-31T09:00:00.000Z')
  const local = { id: WORLD, updatedAt: '2026-10-31T07:00:00.000Z', chunks: { '0,0,0': 'mine' } }
  const got = await hang(maybePull(WORLD, local))
  await flush()
  eq(got === null && srv.puts.length === 1 && srv.chunks['0,0,0'] === 'mine', 'local doc without syncRev is kept and pushed')
  const b = await fresh()
  serverAt(2, '2026-10-31T09:00:00.000Z', 'theirs')
  const none = await hang(b.maybePull(WORLD, null))
  eq(none && none !== 'HANG' && none.chunks['0,0,0'] === 'theirs' && none.syncRev === 2, 'no local world: pull the server copy')
}

// 13. syncMark carries the last synced rev into the next save
{
  const { maybePush, syncMark } = await fresh()
  eq(Object.keys(syncMark(WORLD)).length === 0, 'no mark before any sync')
  const d = doc(['a'], '2026-10-31T11:00:00.000Z')
  maybePush(d)
  await flush()
  const m = syncMark(WORLD)
  eq(m.syncRev === 1 && m.syncedAt === '2026-10-31T11:00:00.000Z', 'mark after the first push: ' + JSON.stringify(m))
}

// 14. database name comes from main: test build writes backups only to kuliblocks-test
{
  const { maybePull, setSyncDb } = await fresh()
  setSyncDb('kuliblocks-test')
  serverAt(5, '2026-10-31T10:00:00.000Z')
  await hang(maybePull(WORLD, synced()))
  eq(idbPuts.length > 0 && idbPuts.every((p) => p.db === 'kuliblocks-test'), 'backups only in kuliblocks-test: ' + JSON.stringify(idbPuts.map((p) => p.db)))
  eq(!idbs.kuliblocks, 'student database not opened')
}

// 15. fresh profile (no database yet): no hang, store is created, pull and backup finish
{
  const { maybePull } = await fresh()
  serverAt(5, '2026-10-31T10:00:00.000Z')
  const t0 = Date.now()
  const got = await hang(maybePull(WORLD, synced()))
  eq(got && got !== 'HANG', 'fresh profile: pull finishes without hanging')
  eq(idbs.kuliblocks && idbs.kuliblocks.stores.worlds && idbPuts.length === 1, 'fresh profile: store created on upgrade and backup written')
  void t0
}

// 16. blocked open, old database without the store, and a throwing transaction() all reject quickly (never hang)
for (const [label, setup] of [
  ['blocked', () => { idbOpts.blocked = true }],
  ['no store', () => { idbs.kuliblocks = { stores: {} } }],
  ['transaction throws', () => { idbOpts.txThrows = true; idbs.kuliblocks = { stores: { worlds: new Map() } } }],
]) {
  const { maybePull } = await fresh()
  setup()
  serverAt(5, '2026-10-31T10:00:00.000Z')
  const got = await hang(maybePull(WORLD, synced()))
  eq(got && got !== 'HANG', label + ': pull still returns the server doc, no hang')
}

// 17. save.js: player, mode, bag and hot slot
{
  const creative = fromDoc({ v: 2, mode: 'creative' })
  eq(creative.player.mode === 'creative' && creative.player.bag.length === 15, 'doc with no player and mode creative reloads creative with 15 slots')
  eq(fromDoc({ v: 2 }).player.mode === 'survival', 'no player, no mode: survival')
  const odd = fromDoc({ v: 2, player: { mode: 'creative', bag: [{ item: 'a', n: 1 }], hot: 99 } }).player
  eq(odd.bag.length === 15 && odd.bag[0].item === 'a' && odd.bag[14] === null && odd.hot === 14, 'short bag padded to 15, hot clamped to 14')
  eq(fitPlayer({ bag: [], hot: -3 }).hot === 0 && fitPlayer({ bag: [], hot: 'x' }).hot === 0 && fitPlayer({ bag: [], hot: 2.9 }).hot === 2, 'hot clamped to 0-14, junk becomes 0')
  eq(fitPlayer({ mode: 'survival', bag: new Array(20).fill(null), hot: 3 }).bag.length === 20, 'longer bags are left alone')
}

// 18. backoff numbers: 2 s, 4 s, 8 s ... capped at 60 s, +/-25% jitter, Retry-After parsing
{
  const { backoffMs, retryAfterMs } = await fresh()
  const mid = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => backoffMs(n, () => 0.5))
  eq(JSON.stringify(mid) === JSON.stringify([2000, 4000, 8000, 16000, 32000, 60000, 60000, 60000]), 'backoff 2,4,8,16,32 then capped at 60 s: ' + mid.join(','))
  eq(backoffMs(1, () => 0) === 1500 && backoffMs(1, () => 1) === 2500, 'jitter is +/-25%')
  eq(backoffMs(9, () => 1) === 60000, 'never above 60 s')
  eq(retryAfterMs('7') === 7000 && retryAfterMs(null) === 0 && retryAfterMs('soon') === 0 && retryAfterMs('0') === 0, 'Retry-After seconds, junk and zero')
  eq(retryAfterMs(new Date(now + 9000).toUTCString()) > 7000 && retryAfterMs(new Date(now + 9000).toUTCString()) <= 9000, 'Retry-After as an HTTP date')
  eq(retryAfterMs('99999') === 300000, 'Retry-After capped at 5 min')
}

// 19. 429 with Retry-After: the push waits that long, then lands
{
  const { maybePush } = await fresh()
  srv.putStatus = [{ status: 429, headers: { 'retry-after': '30' } }]
  maybePush(doc(['a']))
  await flush()
  eq(srv.puts.length === 1, '429: first PUT sent')
  await advance(29000)
  eq(srv.puts.length === 1, '429 + Retry-After 30: nothing sent at 29 s (puts ' + srv.puts.length + ')')
  await advance(1500)
  eq(srv.puts.length === 2 && srv.rev === 1, 'sent right after 30 s and saved')
  eq(getSyncState() === 'saved', 'chip state saved after the retry (' + getSyncState() + ')')
}

// 20. 429 without Retry-After uses the backoff (2 s first)
{
  const { maybePush } = await fresh()
  srv.putStatus = [429]
  maybePush(doc(['a']))
  await flush()
  await advance(1500)
  eq(srv.puts.length === 1, '429 no header: not before 2 s')
  await advance(1000)
  eq(srv.puts.length === 2 && srv.rev === 1, '429 no header: retried at about 2 s')
}

// 21. 409 then success: one school copy, backoff on the repeat 409, no second copy, then saved
{
  const { maybePush } = await fresh()
  serverAt(3, '2026-10-31T09:00:00.000Z')
  srv.putStatus = [409, 409]
  maybePush(doc(['mine']))
  await flush()
  eq(school.length === 1, '409: both kept once')
  eq(srv.puts.length === 2, '409: PUT and the keepBoth re-PUT (' + srv.puts.length + ')')
  await advance(1500)
  eq(srv.puts.length === 2, '409 again: backs off, no immediate PUT')
  await advance(1000)
  eq(srv.puts.length === 3 && srv.rev === 4 && srv.chunks['0,0,0'] === 'mine', '409 then success: saved on the next try')
  eq(school.length === 1, 'no second school copy on the repeat 409')
  await advance(60000)
  eq(srv.puts.length === 3, 'done: nothing more sent')
}

// 22. 5xx backs off and recovers; a new save during backoff does not jump the queue
{
  const { maybePush } = await fresh()
  srv.putStatus = [503, 500]
  maybePush(doc(['a']))
  await flush()
  maybePush(doc(['a', 'b']))
  await flush()
  eq(srv.puts.length === 1, 'new save during backoff does not send straight away')
  await advance(2100)
  eq(srv.puts.length === 2, '503: retry at 2 s')
  await advance(3900)
  eq(srv.puts.length === 2, '500: second wait is 4 s, not 2')
  await advance(300)
  eq(srv.puts.length === 3 && srv.rev === 1 && srv.chunks['0,0,1'] === 'b', 'recovers with the newest doc')
}

// 23. six failed tries in a row: stop, keep the doc, show failed; Try again resets the count and works
{
  const { maybePush, retrySync } = await fresh()
  srv.putStatus = [503, 503, 503, 503, 503, 503]
  maybePush(doc(['keep me']))
  await flush()
  for (const wait of [2100, 4100, 8100, 16100, 32100]) await advance(wait)
  eq(srv.puts.length === 6, 'six tries made (' + srv.puts.length + ')')
  eq(timers.size === 0, 'no timer left after the sixth failure')
  eq(getSyncState() === 'failed', 'chip state is failed (' + getSyncState() + ')')
  await advance(300000)
  eq(srv.puts.length === 6, 'auto-retry stopped for good')
  maybePush(doc(['keep me', 'newer']))
  await flush()
  await advance(120000)
  eq(srv.puts.length === 6, 'a new save while stopped waits for Try again')
  retrySync()
  await flush()
  eq(srv.puts.length === 7 && srv.rev === 1 && srv.chunks['0,0,1'] === 'newer', 'Try again pushes the newest doc and it lands')
  eq(getSyncState() === 'saved', 'chip back to saved (' + getSyncState() + ')')
}

// 24. after Try again the count starts over (fail 6 more times to stop again)
{
  const { maybePush, retrySync } = await fresh()
  srv.putStatus = Array(12).fill(500)
  maybePush(doc(['a']))
  await flush()
  for (const wait of [2100, 4100, 8100, 16100, 32100]) await advance(wait)
  eq(srv.puts.length === 6 && getSyncState() === 'failed', 'stopped after six')
  retrySync()
  await flush()
  for (const wait of [2100, 4100, 8100, 16100, 32100]) await advance(wait)
  eq(srv.puts.length === 12 && getSyncState() === 'failed', 'a manual try resets the count: six more tries (' + srv.puts.length + ')')
}

// 25. network failures count and back off too; going online while backing off pushes at once
{
  const { maybePush } = await fresh()
  net.failPut = 2
  maybePush(doc(['a']))
  await flush()
  await advance(2100)
  await advance(4100)
  eq(srv.puts.length === 3 && srv.rev === 1, 'two network failures then success on the 2 s and 4 s waits')
  const b = await fresh()
  net.failPut = 1
  b.maybePush(doc(['a']))
  await flush()
  for (const fn of listeners.online || []) fn()
  await flush()
  eq(srv.puts.length === 2 && srv.rev === 1, 'online event retries without waiting')
}

// 26. chip: the Try again button (icon + text, 44 px) shows only in the failed state and calls the registered handler
{
  const made = []
  const el = (tag) => {
    const e = { tag, style: {}, attrs: {}, handlers: {}, children: [], textContent: '', className: '',
      setAttribute(k, v) { this.attrs[k] = v }, addEventListener(ev, fn) { this.handlers[ev] = fn },
      appendChild(c) { this.children.push(c); return c }, querySelector(sel) { return sel.includes('icon') ? (this.icon ||= { textContent: '' }) : (this.live ||= { textContent: '' }) } }
    made.push(e)
    return e
  }
  globalThis.document = { createElement: el, body: { appendChild() {} } }
  mountSyncChip()
  await flush()
  const retry = made.find((e) => e.className === 'bt-sync-retry')
  eq(!!retry && retry.style.cssText.includes('min-height:44px') && retry.style.cssText.includes('display:none'), 'Try again button exists, 44 px, hidden at first')
  eq(retry && retry.innerHTML.includes('↻') && retry.innerHTML.includes('Try again') && retry.attrs['aria-label'] === 'Try again', 'button has icon and text')
  setSyncState('failed')
  eq(retry.style.display === 'flex', 'visible in the failed state')
  const chipEl = made.find((e) => e.className === 'bt-sync-chip')
  eq(chipEl.live.textContent === 'Not saved to school' && chipEl.icon.textContent === '⚠', 'chip says Not saved to school (' + chipEl.live.textContent + ')')
  let pressed = 0
  onSyncRetry(() => { pressed++ })
  retry.handlers.click()
  eq(pressed === 1, 'press calls the retry handler')
  setSyncState('saving')
  eq(retry.style.display === 'none', 'hidden again once a try is running')
  delete globalThis.document
}

console.log = realLog
if (fail.length) { console.error('sync-queue-check FAIL\n - ' + fail.join('\n - ')); process.exit(1) }
console.log('sync-queue-check ok (' + n + ' scenarios)')
