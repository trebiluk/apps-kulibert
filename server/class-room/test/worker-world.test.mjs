import test from 'node:test'
import assert from 'node:assert/strict'
import './helpers.mjs'
import worker from '../src/worker.js'
import { signToken } from '../src/token.js'

test('worker in world mode: the hub seats the kid, errors map to 403/503, headers name the world and room', async () => {
  const SECRET = 'worker-test-secret-0123456789abcd'
  const seen = []
  let answer = { room: 'world-0001-r2' }
  const env = {
    ALLOWED_ORIGINS: 'https://apps.kulibert.net', ROOM_JOIN_SECRET: SECRET,
    WORLDS: { idFromName: (n) => n, get: () => ({ assign: async (a) => { seen.push(a); return answer } }) },
    ROOMS: { idFromName: (n) => 'room:' + n, get: (id) => ({ fetch: async (r) => { seen.push([id, r.headers.get('x-bt-world'), r.headers.get('x-bt-rid')]); return new Response(null, { status: 101 }) } }) },
  }
  const req = async (o) => new Request('https://apps.kulibert.net/rt/ws', { headers: { Upgrade: 'websocket', Origin: 'https://apps.kulibert.net', 'Sec-WebSocket-Protocol': 'bt-room.v0, ' + await signToken({
    v: 1, ref: 'kidref-0001', world: 'world-0001', grp: 'class-6a', alias: 'Test Pup 01', exp: Math.floor(Date.now() / 1000) + 60, jti: 'jti-' + Math.random().toString(36).slice(2, 12), role: 'kid', cfg: 'contest', ...o }, SECRET) } })
  assert.equal((await worker.fetch(await req({}), env)).status, 101)
  assert.deepEqual(seen[0], { world: 'world-0001', ref: 'kidref-0001', grp: 'class-6a', role: 'kid', bld: 's', cfg: 'contest' })
  assert.deepEqual(seen[1], ['room:world-0001-r2', 'world-0001', 'world-0001-r2'])
  answer = { err: 'full' }
  assert.equal((await worker.fetch(await req({}), env)).status, 503)
  answer = { err: 'closed' }
  assert.equal((await worker.fetch(await req({}), env)).status, 403)
  assert.equal((await worker.fetch(await req({}), { ...env, WORLDS: undefined })).status, 503)
})
