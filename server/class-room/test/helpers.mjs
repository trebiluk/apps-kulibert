// Fake Cloudflare runtime for the in-process tests: fake sockets, the REAL Room and Worker.
// Import this file first in a test; it installs WebSocketPair and a small Response stand-in.
import { Room } from '../src/room.js'

export class FakeSocket {
  constructor() { this.inbox = []; this.closed = null; this.attachment = null; this.ctx = null }
  accept() {}
  send(s) { if (this.closed) throw new Error('send on closed socket'); this.inbox.push(s) }
  close(code, reason) {
    if (this.closed) throw new Error('already closed')
    this.closed = { code, reason }
    if (this.ctx) this.ctx.sockets.delete(this)
  }
  serializeAttachment(v) { this.attachment = structuredClone(v) }
  deserializeAttachment() { return this.attachment == null ? null : structuredClone(this.attachment) }
}
globalThis.WebSocketPair = class {
  constructor() {
    const server = new FakeSocket()
    this[0] = { server }   // "client" end: tests read what the server sent through .server
    this[1] = server
  }
}
globalThis.Response = class FakeResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status ?? 200
    this.webSocket = init.webSocket
    this.headers = new Headers(init.headers)
  }
}

// opts.open = false leaves the room closed (as a fresh room is) so a test can drive the staff flow.
export function makeRoom(opts = {}) {
  const ctx = {
    sockets: new Set(),
    acceptWebSocket(ws) { ws.ctx = this; this.sockets.add(ws) },
    getWebSockets() { return [...this.sockets] },
    waitUntil(p) { Promise.resolve(p).catch(() => {}) },
  }
  const room = new Room(ctx, opts.env || {})
  if (opts.open !== false) { room.open = true; room.cfg = 'period' }
  return { ctx, room }
}

export const refOf = (i) => 'kidref-' + String(i).padStart(4, '0')
export const aliasOf = (i) => 'Test Pup ' + String(i).padStart(2, '0')
let jtiN = 0
export const nextJti = () => 'jti-' + String(++jtiN).padStart(8, '0')

// The headers the Worker sets after it has verified a ticket.
export function joinReq(ref, alias, extra = {}) {
  return {
    headers: new Headers({
      Upgrade: 'websocket', 'x-bt-ref': ref, 'x-bt-alias': encodeURIComponent(alias),
      'x-bt-role': 'kid', 'x-bt-jti': nextJti(), 'x-bt-cfg': 'period', ...extra,
    }),
  }
}
export async function join(room, i, extra = {}) {
  const res = await room.fetch(joinReq(refOf(i), aliasOf(i), extra))
  return { i, q: 0, res, sock: res.webSocket?.server }
}
export async function joinStaff(room, role = 'teacher', n = 900) {
  const res = await room.fetch(joinReq('staffref-' + n, 'Teacher ' + n, { 'x-bt-role': role }))
  return { i: n, q: 0, res, sock: res.webSocket?.server }
}
export async function joinN(room, n) {
  const kids = []
  for (let i = 1; i <= n; i++) kids.push(await join(room, i))
  return kids
}
export const frames = (sock) => sock.inbox.map((s) => JSON.parse(s))
export const snaps = (sock) => frames(sock).filter((f) => f.t === 's')

// A well-formed position frame with the next sequence number for this kid.
export const posFrame = (k, o = {}) =>
  JSON.stringify({ v: 0, t: 'p', q: k.q++, x: 100.5, y: 64, z: -20.25, r: 0, f: 0, ...o })
export const sendPos = (room, k, n = 0) =>
  room.webSocketMessage(k.sock, posFrame(k, { x: 100.5 + k.i + n / 10, z: -20.25 - k.i, r: (k.i * 12 + n) % 360 }))
export const allPos = async (room, kids, n = 0) => { for (const k of kids) await sendPos(room, k, n) }
export const send = (room, k, obj) => room.webSocketMessage(k.sock, typeof obj === 'string' ? obj : JSON.stringify(obj))

export const timers = (t, now = 1_000_000) => t.mock.timers.enable({ apis: ['setInterval', 'Date'], now })
