// 2.5.596 (B20 p1): a teacher asks "who changed this block" from the 7-day edit log.
//   node --import ./test/shim/register.mjs --test test/editlog-history.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import './helpers.mjs'
import worker from '../src/worker.js'
import { signToken } from '../src/token.js'
import { memDb } from '../src/world/memdb.js'
import { makeHub } from '../src/world/hub.js'
import { HISTORY_MS, builderTag, historyAt, historyFrom, historyVia, PAGE } from '../src/editlog.js'

const SECRET = 'history-test-secret-0123456789ab'
const ORIGIN = 'https://apps.kulibert.net'
const STONE = 1, PLANKS = 10, BOX = 27
const KID_A = 'kidref-0001', KID_B = 'kidref-0002'
const DAY = 24 * 60 * 60 * 1000

// A hub over a memdb, with edits by two kids at one cell (and noise elsewhere).
function world() {
  const db = memDb()
  const hub = makeHub({ db, send: async () => true, gen: () => 0 })
  const now = Date.now()
  const a = hub.who(KID_A), b = hub.who(KID_B)
  const at = (x, id, before, who, t) => hub.world.apply([{ x, y: 64, z: 5, id, b: before }], who, t)[0]
  at(3, STONE, 0, a, now - 8 * DAY)           // older than 7 days: never returned
  at(3, 0, STONE, b, now - 8 * DAY + 1)
  at(3, PLANKS, 0, a, now - 3 * 60_000)       // A places planks
  at(4, STONE, 0, a, now - 2 * 60_000)        // another cell
  at(3, 0, PLANKS, b, now - 60_000)           // B breaks them
  at(3, BOX, 0, b, now - 30_000)              // B places a box
  return { db, hub, now, a, b }
}

const env = (hub) => ({
  ALLOWED_ORIGINS: ORIGIN, ROOM_JOIN_SECRET: SECRET,
  WORLDS: { idFromName: (n) => n, get: () => ({ since: async (s, n) => hub.since(s, n) }) },
  ROOMS: { idFromName: (n) => n, get: () => ({ fetch: async () => new Response(null, { status: 101 }) }) },
})
const ticket = (o = {}) => signToken({
  v: 1, ref: 'staffref-001', world: 'world-0001', alias: 'Ms Teacher', exp: Math.floor(Date.now() / 1000) + 120,
  jti: 'jti-' + Math.random().toString(36).slice(2, 12), role: 'teacher', amr: ['passkey'], cfg: 'contest', ...o,
}, SECRET)
const get = async (q, tk, headers = {}) => new Request('https://apps.kulibert.net/rt/history?' + q, {
  headers: { ...(tk ? { Authorization: 'Bearer ' + tk } : {}), ...headers },
})

test('historyAt: place and break by two kids, newest first, builder tags only, nothing older than 7 days', () => {
  const { db, hub, now, a, b } = world()
  hub.flush()
  const h = historyAt(db, 3, 64, 5, 10, now)
  assert.deepEqual(h.map((e) => [e.who, e.action, e.block]), [
    [builderTag(b), 'place', BOX],
    [builderTag(b), 'break', PLANKS],
    [builderTag(a), 'place', PLANKS],
  ])
  assert.ok(h[0].t > h[1].t && h[1].t > h[2].t, 'newest first')
  assert.match(h[0].who, /^b-[0-9a-f]{8}$/)
  assert.notEqual(builderTag(a), builderTag(b))
  assert.equal(historyAt(db, 3, 64, 5, 2, now).length, 2, 'limit')
  assert.deepEqual(historyAt(db, 9, 64, 9, 10, now), [], 'untouched cell')
  // a touch op (same block in and out: a container move, a sim step) is not a block change
  assert.deepEqual(historyFrom([{ s: 1, w: 0, x: 1, y: 1, z: 1, b: BOX, i: BOX, t: now }], 1, 1, 1, 10, now), [])
  assert.equal(historyFrom([{ s: 1, w: 0, x: 1, y: 1, z: 1, b: 0, i: STONE, t: now }], 1, 1, 1, 10, now)[0].who, 'system')
  assert.equal(historyFrom([{ s: 1, w: a, x: 1, y: 1, z: 1, b: STONE, i: PLANKS, t: now }], 1, 1, 1, 10, now)[0].action, 'replace')
})

test('historyVia reads the World only through since(): pages, and finds the oldest row after a purge', async () => {
  const { db, hub, now, a } = world()
  for (let i = 0; i < PAGE * 2 + 7; i++) hub.world.apply([{ x: 100 + (i % 50), y: 64, z: i, id: STONE, b: 0 }], a, now - 10_000)
  hub.flush()
  let calls = 0
  const since = async (s, n) => { calls++; return hub.since(s, n) }
  const all = await historyVia(since, 3, 64, 5, 10, now)
  assert.equal(all.length, 3)
  db.purgeOps(now - 7 * DAY)                    // the World alarm's purge: the 8-day-old rows are gone
  assert.equal(hub.since(0, 1).resync, true, 'since(0) now answers resync')
  calls = 0
  assert.deepEqual(await historyVia(since, 3, 64, 5, 10, now), all)
  assert.ok(calls < 40, 'binary search + pages, not one call per row: ' + calls)
})

test('GET /rt/history: staff gets JSON for its own world; kid 403; no ticket 401; other origin 403; nothing but tags', async () => {
  const { hub, a, b } = world()
  const e = env(hub)
  let r = await worker.fetch(await get('x=3&y=64&z=5', await ticket()), e)
  assert.equal(r.status, 200)
  assert.equal(r.headers.get('content-type'), 'application/json')
  assert.equal(r.headers.get('cache-control'), 'no-store')
  const body = JSON.parse(r.body)   // helpers.mjs FakeResponse keeps the raw body
  assert.deepEqual(Object.keys(body), ['x', 'y', 'z', 'entries'])
  assert.deepEqual(body.entries.map((x) => [x.who, x.action]), [[builderTag(b), 'place'], [builderTag(b), 'break'], [builderTag(a), 'place']])
  for (const x of body.entries) assert.deepEqual(Object.keys(x), ['who', 'action', 'block', 't'])
  const raw = JSON.stringify(body)
  for (const s of [KID_A, KID_B, 'staffref-001', 'Ms Teacher', 'Test Pup']) assert.ok(!raw.includes(s), 'no ref or alias text: ' + s)

  r = await worker.fetch(await get('x=3&y=64&z=5', await ticket({ role: 'kid', amr: undefined, ref: KID_A, alias: 'Test Pup 01' })), e)
  assert.equal(r.status, 403, 'a kid ticket is refused')
  r = await worker.fetch(await get('x=3&y=64&z=5', await ticket({ role: 'admin' }), { Origin: ORIGIN }), e)
  assert.equal(r.status, 200, 'admin, from the allowed origin')
  assert.equal(r.headers.get('access-control-allow-origin'), ORIGIN)
  r = await worker.fetch(await get('x=3&y=64&z=5', await ticket({ amr: ['pwd'] })), e)
  assert.equal(r.status, 401, 'staff without a passkey sign-in fails the existing ticket check')
  r = await worker.fetch(await get('x=3&y=64&z=5', await ticket({ world: undefined, room: 'room-0001' })), e)
  assert.equal(r.status, 403, 'a single-room ticket has no shared world to ask about')
  assert.equal((await worker.fetch(await get('x=3&y=64&z=5'), e)).status, 401)
  assert.equal((await worker.fetch(await get('x=3&y=64&z=5', 'not-a-ticket'), e)).status, 401)
  assert.equal((await worker.fetch(await get('x=3&y=64&z=5', await ticket(), { Origin: 'https://evil.example' }), e)).status, 403)
  assert.equal((await worker.fetch(await get('x=3&y=sixty&z=5', await ticket()), e)).status, 400)
  assert.equal((await worker.fetch(await get('x=3&y=64&z=5', await ticket()), { ...e, ROOM_JOIN_SECRET: '' })).status, 503)
  const pre = await worker.fetch(new Request('https://apps.kulibert.net/rt/history', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), e)
  assert.equal(pre.status, 204)
})

test('older than 7 days is never returned, even before the purge runs', () => {
  const { db, hub, now } = world()
  hub.flush()
  assert.ok(db.opsSince(0, 100).some((o) => o.t < now - HISTORY_MS), 'the old rows are still stored')
  assert.ok(historyAt(db, 3, 64, 5, 10, now).every((e) => e.t >= now - HISTORY_MS))
  assert.equal(historyAt(db, 3, 64, 5, 10, now).length, 3)
})
