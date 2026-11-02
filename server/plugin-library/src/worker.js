// Bertopia plugin library Worker (part 12). One Durable Object per library, named by the hash of the owner's key;
// the Worker only parses the request and hands it to src/library.js. No logs with keys, no names, no IPs.
import { DurableObject } from 'cloudflare:workers'
import { makeLibrary, route } from './library.js'

export class Library extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.lib = makeLibrary({ get: (k) => ctx.storage.get(k), put: (k, v) => ctx.storage.put(k, v) })
  }
  create() { return this.lib.create() }
  get() { return this.lib.get() }
  replace(plugins, v) { return this.lib.replace(plugins, v) }
  put(plugin, v) { return this.lib.put(plugin, v) }
  drop(id, v) { return this.lib.drop(id, v) }
}

const MAX_BODY = 300 * 1024
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,PUT,POST,DELETE,OPTIONS', 'access-control-allow-headers': 'authorization,content-type', 'access-control-max-age': '600' }

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
    let body = null
    if (request.method === 'PUT' || request.method === 'POST' || request.method === 'DELETE') {
      const len = Number(request.headers.get('content-length') || 0)
      if (len > MAX_BODY) return reply(413, { error: 'too big' })
      const text = await request.text()
      if (text.length > MAX_BODY) return reply(413, { error: 'too big' })
      if (text) { try { body = JSON.parse(text) } catch (e) { return reply(400, { error: 'json' }) } }
    }
    const auth = request.headers.get('authorization') || ''
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
    const lookup = (hash) => env.LIBRARIES.get(env.LIBRARIES.idFromName(hash))
    const r = await route({ method: request.method, path: url.pathname, bearer, body, lookup })
    return reply(r.status, r.body)
  },
}
const reply = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...CORS } })
