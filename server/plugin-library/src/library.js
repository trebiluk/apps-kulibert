// The plugin library, pure (part 12). One library = one owner's set of block plugins (src/plugins.js shapes),
// kept in the cloud so every server the owner runs can pull them, and the owner can edit them in-game or as
// files. Storage is a tiny key/value: get(k) -> value|undefined, put(k, v). Time is injectable.
// No names, no emails, no PII: a library is addressed by the hash of its key and holds plugins only.
import { checkPlugin, LIMITS } from '../../class-room/src/plugins.js'

export const TIER = 'adult'
export const MAX_BYTES = 256 * 1024          // the whole list, as JSON
export const MAX_PLUGINS = LIMITS.plugins    // 32

const bytesOf = (v) => new TextEncoder().encode(JSON.stringify(v)).length
// checkPlugin says why (a string) or null; the stored shape keeps only the known fields
const clean = (p) => ({ id: String(p.id), name: String(p.name), by: String(p.by || ''), about: String(p.about || ''), on: p.on !== false, v: Number.isFinite(p.v) ? p.v : 1, rules: p.rules })
const check = (p) => { const why = checkPlugin(p, TIER); return why ? { error: why } : { plugin: clean(p) } }

// Check a whole list: shapes, tier, size, unique ids. -> { ok, list } or { error, at }
export function checkList(list) {
  if (!Array.isArray(list)) return { error: 'plugins: a list' }
  if (list.length > MAX_PLUGINS) return { error: 'plugins: at most ' + MAX_PLUGINS }
  const ids = new Set(), out = []
  for (let i = 0; i < list.length; i++) {
    const r = check(list[i])
    if (r.error) return { error: r.error, at: i }
    if (ids.has(r.plugin.id)) return { error: 'plugin ' + r.plugin.id + ': twice', at: i }
    ids.add(r.plugin.id); out.push(r.plugin)
  }
  if (bytesOf(out) > MAX_BYTES) return { error: 'plugins: too big (256 KB)' }
  return { ok: true, list: out }
}

// The library over a store. Every write bumps v; a write that names an older v is refused with the current
// state so the caller can merge (an in-game editor and a file edit never silently clobber each other).
export function makeLibrary(store, { now = Date.now } = {}) {
  const read = async () => (await store.get('lib')) || null
  const write = async (lib) => { await store.put('lib', lib); return lib }
  return {
    // claim: the first write; a library that exists already is left alone
    async create() {
      const cur = await read()
      if (cur) return { error: 'exists' }
      const lib = { v: 1, at: now(), plugins: [] }
      await write(lib); return { ok: true, v: lib.v }
    },
    async get() {
      const cur = await read()
      return cur ? { ok: true, v: cur.v, at: cur.at, plugins: cur.plugins } : { error: 'no-library' }
    },
    async replace(plugins, v) {
      const cur = await read(); if (!cur) return { error: 'no-library' }
      if (v !== undefined && v !== null && Number(v) !== cur.v) return { error: 'conflict', v: cur.v, plugins: cur.plugins }
      const c = checkList(plugins); if (c.error) return { error: c.error, at: c.at }
      const lib = { v: cur.v + 1, at: now(), plugins: c.list }
      await write(lib); return { ok: true, v: lib.v, count: lib.plugins.length }
    },
    async put(plugin, v) {
      const cur = await read(); if (!cur) return { error: 'no-library' }
      if (v !== undefined && v !== null && Number(v) !== cur.v) return { error: 'conflict', v: cur.v, plugins: cur.plugins }
      const r = check(plugin); if (r.error) return { error: r.error }
      const list = cur.plugins.filter((p) => p.id !== r.plugin.id); list.push(r.plugin)
      const c = checkList(list); if (c.error) return { error: c.error }
      const lib = { v: cur.v + 1, at: now(), plugins: c.list }
      await write(lib); return { ok: true, v: lib.v, id: r.plugin.id }
    },
    async drop(id, v) {
      const cur = await read(); if (!cur) return { error: 'no-library' }
      if (v !== undefined && v !== null && Number(v) !== cur.v) return { error: 'conflict', v: cur.v, plugins: cur.plugins }
      if (!cur.plugins.some((p) => p.id === id)) return { error: 'no-such-plugin' }
      const lib = { v: cur.v + 1, at: now(), plugins: cur.plugins.filter((p) => p.id !== id) }
      await write(lib); return { ok: true, v: lib.v }
    },
  }
}

// Keys: lk_ + 32 hex (128 bits). Only the hash ever reaches storage or a Durable Object name.
export const KEY_RE = /^lk_[0-9a-f]{32}$/
export async function hashKey(key) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('bertopia-plugin-library|' + key))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export const makeKey = (bytes = crypto.getRandomValues(new Uint8Array(16))) => 'lk_' + [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')

// The HTTP face, pure: (method, path, bearer, body) -> { status, body }. lookup(hash) gives the library for a key.
export const ROUTES = ['POST /lib/new', 'GET /lib', 'PUT /lib', 'PUT /lib/plugin', 'DELETE /lib/plugin/:id', 'GET /lib/health']
export async function route({ method, path, bearer, body, lookup, makeKeyFn = makeKey }) {
  const json = (status, b) => ({ status, body: b })
  if (path === '/lib/health') return json(200, { ok: true })
  if (method === 'POST' && path === '/lib/new') {
    const key = makeKeyFn(), lib = await lookup(await hashKey(key))
    const r = await lib.create()
    return r.error ? json(500, r) : json(200, { ok: true, key, v: r.v })
  }
  if (!path.startsWith('/lib')) return json(404, { error: 'not found' })
  if (typeof bearer !== 'string' || !KEY_RE.test(bearer)) return json(401, { error: 'key' })
  const lib = await lookup(await hashKey(bearer))
  const b = body && typeof body === 'object' ? body : {}
  let r
  if (method === 'GET' && path === '/lib') r = await lib.get()
  else if (method === 'PUT' && path === '/lib') r = await lib.replace(b.plugins, b.v)
  else if (method === 'PUT' && path === '/lib/plugin') r = await lib.put(b.plugin, b.v)
  else if (method === 'DELETE' && /^\/lib\/plugin\/[A-Za-z0-9_-]{1,40}$/.test(path)) r = await lib.drop(path.slice('/lib/plugin/'.length), b.v)
  else return json(404, { error: 'not found' })
  if (r.error === 'no-library') return json(404, r)
  if (r.error === 'conflict') return json(409, r)
  if (r.error) return json(400, r)
  return json(200, r)
}
