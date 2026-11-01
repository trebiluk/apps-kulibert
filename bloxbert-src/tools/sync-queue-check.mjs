// Push queue in save/server-sync.js: one in-flight push per world, one timer per world, no fake "Two copies found".
// Pure node, no browser: fetch, timers, clock, navigator and indexedDB are stubbed.
// Usage: node tools/sync-queue-check.mjs            (tests ../src/save/server-sync.js)
//        SYNC_MODULE=/path/to/module.mjs node tools/sync-queue-check.mjs   (same checks on another build of the module)
import { createHash } from 'node:crypto'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'

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
globalThis.indexedDB = {
  open() {
    const r = {}
    realSetImmediate(() => {
      r.result = {
        transaction: () => {
          const tx = { objectStore: () => ({ put: (v, k) => { school.push(k); realSetImmediate(() => tx.oncomplete && tx.oncomplete()) } }) }
          return tx
        },
        close() {},
      }
      r.onsuccess && r.onsuccess()
    })
    return r
  },
}
const json = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })
globalThis.fetch = async (url, opt = {}) => {
  if (String(url).includes('/api/who')) return json(200, { verified: true })
  if (!opt.method || opt.method === 'GET') {
    srv.gets++
    if (srv.onGet) srv.onGet()
    if (!srv.exists) return json(404, { ok: false })
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
  if (forced) return json(forced, { ok: false })
  if (rec.ifMatch !== srv.rev) return json(409, { ok: false, rev: srv.rev })
  srv.exists = true
  srv.rev += 1
  srv.head = body.head
  Object.assign(srv.chunks, body.chunks)
  for (const k of body.drop || []) delete srv.chunks[k]
  return json(200, { ok: true, rev: srv.rev })
}
let logs = []
const realLog = console.log
console.log = (...a) => { logs.push(a.join(' ')) }

let n = 0
async function fresh() {
  resetNet(); logs = []; school = []; timers.clear()
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
  // main (2.5.595): a doc that arrived while a push was busy goes right after it, so a tab closed soon after still got both up
  eq(srv.rev === 2 && srv.puts.length === 2, 'first push landed, then the waiting doc right after it, one at a time (puts ' + srv.puts.length + ')')
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
  // main (Topia sync P1): a 409 reads the head again and retries once with that rev; only a second 409 keeps both
  eq(srv.puts[0].ifMatch === 3 && srv.puts[1] && srv.puts[1].ifMatch === 4, 're-PUT uses the fresh server rev: ' + srv.puts.map((p) => p.ifMatch).join(','))
  eq(srv.rev === 5, 'local doc ends up on the server')
}

// 6. a server 429 on PUT: main stops sync for this page (as 401/413/503); #62 (2.5.558) makes it a bounded wait
{
  const { maybePush } = await fresh()
  srv.putStatus = [429]
  maybePush(doc(['a']))
  await flush()
  await advance(21000)
  eq(srv.puts.length === 1 && srv.rev === 0, '429 stops sync on this page (main)')
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

console.log = realLog
if (fail.length) { console.error('sync-queue-check FAIL\n - ' + fail.join('\n - ')); process.exit(1) }
console.log('sync-queue-check ok (' + n + ' scenarios)')
