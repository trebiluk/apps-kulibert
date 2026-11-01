import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeLibrary, checkList, route, hashKey, makeKey, KEY_RE, MAX_PLUGINS } from '../src/library.js'
import { EXAMPLES } from '../../class-room/src/plugins.js'

const memStore = () => { const m = new Map(); return { get: async (k) => m.get(k), put: async (k, v) => { m.set(k, JSON.parse(JSON.stringify(v))) } } }
const welcome = EXAMPLES.find((e) => e.id === 'welcome')
const hi = EXAMPLES.find((e) => e.id === 'hi-command')

test('a library is created once, then holds versioned plugins', async () => {
  let t = 1000
  const lib = makeLibrary(memStore(), { now: () => t })
  assert.equal((await lib.get()).error, 'no-library')
  assert.deepEqual(await lib.create(), { ok: true, v: 1 })
  assert.equal((await lib.create()).error, 'exists')
  const r = await lib.replace([welcome, hi], 1)
  assert.deepEqual(r, { ok: true, v: 2, count: 2 })
  t = 2000
  const g = await lib.get()
  assert.equal(g.v, 2); assert.equal(g.at, 1000); assert.deepEqual(g.plugins.map((p) => p.id), ['welcome', 'hi-command'])
})

test('a stale version is refused with the current state; no version means "just write"', async () => {
  const lib = makeLibrary(memStore()); await lib.create(); await lib.replace([welcome])
  const c = await lib.replace([hi], 1)
  assert.equal(c.error, 'conflict'); assert.equal(c.v, 2); assert.deepEqual(c.plugins.map((p) => p.id), ['welcome'])
  assert.equal((await lib.replace([hi])).v, 3)
  assert.equal((await lib.put({ ...welcome, name: 'Hello' }, 3)).v, 4)
  assert.equal((await lib.get()).plugins.find((p) => p.id === 'welcome').name, 'Hello')
  assert.equal((await lib.drop('hi-command', 4)).v, 5)
  assert.equal((await lib.drop('hi-command')).error, 'no-such-plugin')
  assert.equal((await lib.put(welcome, 1)).error, 'conflict')
})

test('bad plugins never land: adult tier, limits, duplicate ids, size', async () => {
  const lib = makeLibrary(memStore()); await lib.create()
  assert.match((await lib.replace([{ id: 'boom', name: 'x', rules: [{ when: { e: 'join' }, if: [], do: [{ a: 'explode' }] }] }])).error, /do/)
  assert.match((await lib.replace([welcome, welcome])).error, /twice/)
  assert.match((await lib.replace('nope')).error, /a list/)
  const many = Array.from({ length: MAX_PLUGINS + 1 }, (_, i) => ({ ...welcome, id: 'p' + i }))
  assert.match((await lib.replace(many)).error, /at most/)
  const fat = { ...welcome, about: 'x'.repeat(5000) }   // about is capped by checkPlugin? if not, the 256 KB cap catches a list of them
  const r = checkList(Array.from({ length: 32 }, (_, i) => ({ ...fat, id: 'f' + i })))
  assert.ok(r.error, 'oversized content is refused somewhere: ' + JSON.stringify(r).slice(0, 80))
  assert.equal((await lib.get()).v, 1, 'nothing was written')
})

test('keys: lk_ + 32 hex; only the hash names a library; the same key hashes the same', async () => {
  const k = makeKey()
  assert.match(k, KEY_RE)
  assert.notEqual(makeKey(), k)
  const h = await hashKey(k)
  assert.match(h, /^[0-9a-f]{64}$/); assert.equal(await hashKey(k), h); assert.notEqual(await hashKey(makeKey()), h)
  assert.ok(!h.includes(k.slice(3, 20)))
})

test('route: the HTTP face end to end over an in-memory set of libraries', async () => {
  const libs = new Map()
  const lookup = async (hash) => { if (!libs.has(hash)) libs.set(hash, makeLibrary(memStore())); return libs.get(hash) }
  const R = (method, path, bearer, body) => route({ method, path, bearer, body, lookup })
  assert.equal((await R('GET', '/lib/health')).status, 200)
  assert.equal((await R('GET', '/lib', '')).status, 401)
  assert.equal((await R('GET', '/lib', 'lk_' + 'z'.repeat(32))).status, 401)
  assert.equal((await R('GET', '/lib', makeKey())).status, 404, 'a well-formed key nobody made: no library')
  const made = await R('POST', '/lib/new')
  assert.equal(made.status, 200); assert.match(made.body.key, KEY_RE); assert.equal(made.body.v, 1)
  const key = made.body.key
  assert.equal((await R('GET', '/lib', key)).body.plugins.length, 0)
  const put = await R('PUT', '/lib', key, { v: 1, plugins: [welcome] })
  assert.equal(put.status, 200); assert.equal(put.body.v, 2)
  const stale = await R('PUT', '/lib', key, { v: 1, plugins: [hi] })
  assert.equal(stale.status, 409); assert.equal(stale.body.v, 2)
  assert.equal((await R('PUT', '/lib/plugin', key, { plugin: hi })).status, 200)
  assert.equal((await R('DELETE', '/lib/plugin/hi-command', key)).body.v, 4)
  assert.equal((await R('DELETE', '/lib/plugin/nope', key)).status, 400)
  assert.equal((await R('PUT', '/lib', key, { plugins: [{ id: 'bad' }] })).status, 400)
  assert.equal((await R('GET', '/nope', key)).status, 404)
  assert.equal((await R('GET', '/lib', makeKey())).status, 404, 'another key is another (empty, unmade) library')
})
