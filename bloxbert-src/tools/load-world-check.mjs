// 2.5.557 round 1: "load picks the right world", provable in node, no browser.
//  1. src/save/world-id.js: which doc load() opens, what the line and the data attributes say.
//  2. src/save/server-sync.js with two worlds on one fake server: each load asks for, and gets, its own world only.
// node tools/load-world-check.mjs
import { createHash } from 'node:crypto'
import { pathToFileURL, fileURLToPath } from 'node:url'
import path from 'node:path'
import { pickLoaded, belongsTo, describeWorld, worldLine, worldAttrs, SURVIVAL_WORLD, WORKSHOP_WORLD } from '../src/save/world-id.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const MOD = pathToFileURL(path.join(HERE, '../src/save/server-sync.js')).href

let fails = 0
function ok(cond, msg) {
  if (!cond) { fails++; console.log('FAIL', msg) } else console.log('ok  ', msg)
}

// ---------- 1. world-id.js ----------
{
  const local = { id: SURVIVAL_WORLD, updatedAt: '2026-10-31T08:53:00.000Z', syncRev: 2, seed: 1 }
  const pulled = { id: SURVIVAL_WORLD, updatedAt: '2026-10-31T09:10:00.000Z', syncRev: 5 }
  let p = pickLoaded(SURVIVAL_WORLD, local, pulled)
  ok(p.doc === pulled && p.from === 'server' && !p.mismatch, 'a pulled server copy of this world is the one that opens')
  p = pickLoaded(SURVIVAL_WORLD, local, null)
  ok(p.doc === local && p.from === 'device', 'no pulled copy: this device\'s copy opens')
  p = pickLoaded(SURVIVAL_WORLD, null, null)
  ok(p.doc === null && p.from === 'new', 'nothing saved anywhere: a new world')
  p = pickLoaded(SURVIVAL_WORLD, local, { id: WORKSHOP_WORLD, updatedAt: 'x', syncRev: 9 })
  ok(p.doc === local && p.from === 'device' && p.ignored, 'a pulled copy that names the other world is ignored, the device copy stays')
  p = pickLoaded(SURVIVAL_WORLD, null, { id: WORKSHOP_WORLD, updatedAt: 'x' })
  ok(p.doc === null && p.from === 'new' && p.ignored, 'a pulled copy of the other world is never opened, even with nothing else saved')
  p = pickLoaded(WORKSHOP_WORLD, { id: SURVIVAL_WORLD, updatedAt: 'y' }, null)
  ok(p.doc && p.from === 'device' && p.mismatch, 'a device copy under the wrong key still opens (never throw a save away) but is reported as a mismatch')
  ok(belongsTo(SURVIVAL_WORLD, { updatedAt: 'z' }), 'an old doc with no id counts as a match')
  ok(!belongsTo(SURVIVAL_WORLD, null), 'no doc is no match')
  // 'bertyville' is a prefix of 'bertyville-survival'; they must never be taken for each other
  ok(!belongsTo(WORKSHOP_WORLD, { id: SURVIVAL_WORLD }) && !belongsTo(SURVIVAL_WORLD, { id: WORKSHOP_WORLD }), 'bertyville and bertyville-survival are different worlds')

  const T = { world: 'World', survival: 'Survival', creative: 'Creative', worldSeed: 'seed {n}', worldFromDevice: 'from this device', worldFromServer: 'from the school server', worldFromNew: 'new world', worldSaved: 'saved {when}' }
  const t = (k) => T[k] || k
  const fmt = () => '04:53'
  const info = describeWorld({ id: SURVIVAL_WORLD, doc: local, from: 'device', seed: 1 })
  ok(info.id === SURVIVAL_WORLD && info.kind === 'survival' && info.name === 'survival' && info.seed === 1 && info.from === 'device' && info.savedAt === local.updatedAt && info.rev === 2, 'describeWorld: survival world facts')
  ok(worldLine(info, t, fmt) === 'World: Survival · seed 1 · from this device · saved 04:53', 'worldLine: ' + worldLine(info, t, fmt))
  const shop = describeWorld({ id: WORKSHOP_WORLD, doc: pulled, from: 'server', seed: 1 })
  ok(shop.kind === 'creative' && worldLine(shop, t, fmt) === 'World: Creative · seed 1 · from the school server · saved 04:53', 'worldLine: workshop from the server: ' + worldLine(shop, t, fmt))
  const custom = describeWorld({ id: SURVIVAL_WORLD, doc: null, from: 'new', customName: 'Brave Hills', seed: 4242 })
  ok(custom.kind === 'custom' && worldLine(custom, t, () => '') === 'World: Brave Hills · seed 4242 · new world', 'worldLine: custom world uses its own name and seed, no saved time: ' + worldLine(custom, t, () => ''))
  const a = worldAttrs(shop)
  ok(a.world === WORKSHOP_WORLD && a.worldFrom === 'server' && a.worldSeed === '1' && a.worldRev === '5' && a.worldMismatch === '0' && a.worldSaved === pulled.updatedAt, 'worldAttrs: strings only, ready for dataset')
  ok(Object.values(a).every((v) => typeof v === 'string'), 'worldAttrs: every value is a string')
  ok(worldAttrs(describeWorld({ id: 'x', doc: null, from: 'error', seed: 1 })).worldRev === '', 'worldAttrs: no rev is an empty string')
}

// ---------- 2. server-sync.js with two worlds ----------
const sha = (t) => createHash('sha256').update(t).digest('hex')
const json = (status, body) => ({ status, ok: status >= 200 && status < 300, json: async () => body })
const worlds = {
  [SURVIVAL_WORLD]: { rev: 5, head: { id: SURVIVAL_WORLD, format: 'kuliblocks', v: 2, schema: 6, updatedAt: '2026-10-31T09:10:00.000Z', title: 'Bertyville' }, chunks: { '0,0,0': 'survival-blocks' } },
  [WORKSHOP_WORLD]: { rev: 9, head: { id: WORKSHOP_WORLD, format: 'kuliblocks', v: 2, schema: 6, updatedAt: '2026-10-31T09:20:00.000Z', title: 'Bertyville' }, chunks: { '0,0,0': 'workshop-blocks' } },
}
const urls = []
globalThis.window = { addEventListener() {} }
Object.defineProperty(globalThis, 'navigator', { value: { onLine: true }, configurable: true })
globalThis.location = { search: '?sync=1' }
// a tiny IndexedDB: enough for the backup the pull writes first
const stores = {}
globalThis.indexedDB = {
  open(name) {
    const r = {}
    setImmediate(() => {
      const fresh = !stores[name]
      if (fresh) stores[name] = new Map()
      r.result = {
        objectStoreNames: { contains: () => true },
        createObjectStore() {},
        transaction: () => {
          const tx = { objectStore: () => ({ put: (v, k) => { stores[name].set(k, v) }, get: (k) => { const q = {}; setImmediate(() => { q.result = stores[name].get(k); q.onsuccess && q.onsuccess() }); return q } }) }
          setTimeout(() => tx.oncomplete && tx.oncomplete(), 5)
          return tx
        },
        close() {},
      }
      if (fresh && r.onupgradeneeded) r.onupgradeneeded()
      r.onsuccess && r.onsuccess()
    })
    return r
  },
}
globalThis.fetch = async (url) => {
  const u = String(url)
  urls.push(u)
  if (u.includes('/api/who')) return json(200, { verified: true })
  const m = /[?&]world=([^&]+)/.exec(u)
  const w = m && worlds[decodeURIComponent(m[1])]
  if (!w) return json(404, { ok: false })
  if (u.includes('&ck=')) {
    const tok = decodeURIComponent(u.split('&ck=')[1]).split(',')
    const out = {}
    for (let i = 0; i < tok.length; i += 3) { const k = tok.slice(i, i + 3).join(','); if (k in w.chunks) out[k] = w.chunks[k] }
    return json(200, { ok: true, chunks: out })
  }
  const chunks = {}
  for (const [k, v] of Object.entries(w.chunks)) chunks[k] = { hash: sha(v), rev: w.rev }
  return json(200, { ok: true, rev: w.rev, schema: 6, head: w.head, chunks })
}
const realLog = console.log
console.log = (...a) => { if (String(a[0]).startsWith('ok') || String(a[0]).startsWith('FAIL')) realLog(...a) }

const sync = await import(MOD)
const clean = (id, rev, at) => ({ id, updatedAt: at, syncRev: rev, syncedAt: at, chunks: { '0,0,0': 'old-' + id }, format: 'kuliblocks', v: 2, schema: 6 })

{
  // this device has an older, clean copy of each world; the server has a newer one of each
  const localS = clean(SURVIVAL_WORLD, 2, '2026-10-31T08:00:00.000Z')
  const localW = clean(WORKSHOP_WORLD, 4, '2026-10-31T08:05:00.000Z')
  const pulledS = await sync.maybePull(SURVIVAL_WORLD, localS)
  ok(pulledS && pulledS.id === SURVIVAL_WORLD && pulledS.chunks['0,0,0'] === 'survival-blocks' && pulledS.syncRev === 5, 'survival load gets the survival server copy (rev 5), not the workshop one')
  const pulledW = await sync.maybePull(WORKSHOP_WORLD, localW)
  ok(pulledW && pulledW.id === WORKSHOP_WORLD && pulledW.chunks['0,0,0'] === 'workshop-blocks' && pulledW.syncRev === 9, 'workshop load gets the workshop server copy (rev 9), not the survival one')
  const pickS = pickLoaded(SURVIVAL_WORLD, localS, pulledS)
  const pickW = pickLoaded(WORKSHOP_WORLD, localW, pulledW)
  ok(pickS.from === 'server' && pickS.doc.chunks['0,0,0'] === 'survival-blocks' && !pickS.mismatch, 'pick for survival: server copy, matches')
  ok(pickW.from === 'server' && pickW.doc.chunks['0,0,0'] === 'workshop-blocks' && !pickW.mismatch, 'pick for workshop: server copy, matches')
  const mine = (w) => urls.filter((u) => new RegExp('[?&]world=' + w + '(&|$)').test(u))
  const other = (w) => urls.filter((u) => /[?&]world=/.test(u) && !new RegExp('[?&]world=' + w + '(&|$)').test(u))
  ok(mine(SURVIVAL_WORLD).length > 0 && mine(WORKSHOP_WORLD).length > 0, 'both worlds were asked for by their own id')
  ok(urls.filter((u) => /world=bertyville(&|$)/.test(u)).every((u) => !u.includes('survival')), 'the bertyville requests never carry the survival id')
  ok(other(SURVIVAL_WORLD).every((u) => /world=bertyville(&|$)/.test(u)), 'the only other world asked for while loading survival was the workshop, by its own load')
  ok(sync.syncMark(SURVIVAL_WORLD).syncRev === 5 && sync.syncMark(WORKSHOP_WORLD).syncRev === 9, 'sync marks are kept per world (5 and 9)')
  // back-ups went to the right DB and carry the right world's old copy
  const backups = [...stores['kuliblocks'].entries()].filter(([k]) => String(k).includes('-backup-'))
  ok(backups.length === 2 && backups.some(([k, v]) => k.startsWith(SURVIVAL_WORLD) && v.doc.chunks['0,0,0'] === 'old-' + SURVIVAL_WORLD) && backups.some(([k, v]) => k.startsWith(WORKSHOP_WORLD + '-backup') && v.doc.chunks['0,0,0'] === 'old-' + WORKSHOP_WORLD), 'each world\'s old copy was backed up under its own name before the pull')
}
{
  // a fresh device: nothing saved; each world opens its own server copy
  const a = await sync.maybePull(SURVIVAL_WORLD, null)
  const b = await sync.maybePull(WORKSHOP_WORLD, null)
  ok(a.chunks['0,0,0'] === 'survival-blocks' && b.chunks['0,0,0'] === 'workshop-blocks', 'fresh device: survival opens survival, workshop opens workshop')
  ok(pickLoaded(SURVIVAL_WORLD, null, a).from === 'server' && pickLoaded(WORKSHOP_WORLD, null, b).from === 'server', 'fresh device: both come from the server')
}
{
  // a device that saved since its last sync keeps its own world (nothing pulled), and says "device"
  const dirty = { ...clean(SURVIVAL_WORLD, 2, '2026-10-31T08:00:00.000Z'), updatedAt: '2026-10-31T08:30:00.000Z' }
  const pulled = await sync.maybePull(SURVIVAL_WORLD, dirty)
  const pick = pickLoaded(SURVIVAL_WORLD, dirty, pulled)
  ok(pulled === null && pick.doc === dirty && pick.from === 'device', 'saved since the last sync: this device\'s world opens, not the server\'s')
}
console.log = realLog
console.log(fails ? '\nload-world-check: ' + fails + ' FAILED' : '\nload-world-check: all passed')
process.exit(fails ? 1 : 0)
