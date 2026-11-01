// The few Cloudflare pieces the class-room server uses, done in plain Node so the SAME src/worker.js, src/room.js and
// src/world-do.js run on a home PC: WebSocketPair + a 101 Response, a Durable Object ctx for Rooms (hibernation-style
// sockets) and for the World (SQLite storage via node:sqlite, transactions, one alarm). Nothing here changes game rules.
import { createHash } from 'node:crypto'
import { DatabaseSync } from 'node:sqlite'

// ---------------------------------------------------------------- Response that can say 101
const RealResponse = globalThis.Response
globalThis.Response = class HostResponse {
  constructor(body, init = {}) {
    if (init.status === 101) return { status: 101, webSocket: init.webSocket, headers: new Headers(init.headers), body: null }
    return new RealResponse(body, init)
  }
}

// ---------------------------------------------------------------- one WebSocket over a raw TCP socket (RFC 6455)
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'
export const MAX_FRAME = 64 * 1024   // a client frame bigger than this closes the socket (game frames are tiny)

export function acceptKey(key) { return createHash('sha1').update(key + GUID).digest('base64') }

function frame(opcode, payload) {
  const len = payload.length
  const head = len < 126 ? Buffer.from([0x80 | opcode, len]) : len < 65536 ? Buffer.from([0x80 | opcode, 126, len >> 8, len & 255]) : (() => { const b = Buffer.alloc(10); b[0] = 0x80 | opcode; b[1] = 127; b.writeBigUInt64BE(BigInt(len), 2); return b })()
  return Buffer.concat([head, payload])
}

// The server end the Room holds. It buffers until the host attaches the real socket (the Room sends hello first).
export class HostSocket {
  constructor() { this.tcp = null; this.queue = []; this.closed = null; this.attachment = null; this.ctx = null; this.onClose = null }
  accept() {}
  serializeAttachment(v) { this.attachment = structuredClone(v) }
  deserializeAttachment() { return this.attachment == null ? null : structuredClone(this.attachment) }
  send(s) {
    if (this.closed) throw new Error('closed')
    const f = frame(1, Buffer.from(String(s)))
    if (this.tcp) this.tcp.write(f); else this.queue.push(f)
  }
  close(code = 1000, reason = '') {
    if (this.closed) return
    this.closed = { code, reason }
    if (this.ctx) this.ctx.sockets.delete(this)
    const r = Buffer.from(String(reason).slice(0, 120))
    const p = Buffer.alloc(2 + r.length); p.writeUInt16BE(code, 0); r.copy(p, 2)
    const f = frame(8, p)
    if (this.tcp) { this.tcp.write(f); this.tcp.end() } else this.queue.push(f)
  }
  // Wire a raw TCP socket in. onText(text) / onEnd(code) are called for the Room.
  attach(tcp, head, { onText, onEnd }) {
    this.tcp = tcp
    for (const f of this.queue) tcp.write(f)
    this.queue = []
    if (this.closed) { tcp.end(); return }
    let buf = head && head.length ? Buffer.from(head) : Buffer.alloc(0)
    let parts = []
    let ended = false
    const end = (code) => { if (ended) return; ended = true; if (this.ctx) this.ctx.sockets.delete(this); onEnd(code) }
    const pump = () => {
      while (buf.length >= 2) {
        const fin = buf[0] & 0x80, op = buf[0] & 0x0f, masked = buf[1] & 0x80
        let len = buf[1] & 0x7f, at = 2
        if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); at = 4 }
        else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); at = 10 }
        if (!masked || len > MAX_FRAME) { tcp.destroy(); end(1009); return }   // clients must mask; no giant frames
        if (buf.length < at + 4 + len) return
        const mask = buf.subarray(at, at + 4)
        const data = Buffer.from(buf.subarray(at + 4, at + 4 + len))
        for (let i = 0; i < data.length; i++) data[i] ^= mask[i & 3]
        buf = buf.subarray(at + 4 + len)
        if (op === 8) { const code = data.length >= 2 ? data.readUInt16BE(0) : 1005; if (!this.closed) { this.closed = { code }; tcp.write(frame(8, data.subarray(0, 2))); tcp.end() } end(code); return }
        if (op === 9) { tcp.write(frame(10, data)); continue }
        if (op === 10) continue
        if (op === 1 || op === 0) {
          parts.push(data)
          if (parts.reduce((a, b) => a + b.length, 0) > MAX_FRAME) { tcp.destroy(); end(1009); return }
          if (fin) { const text = Buffer.concat(parts).toString('utf8'); parts = []; onText(text) }
          continue
        }
        if (op === 2) { tcp.destroy(); end(1003); return }   // the game speaks text only
      }
    }
    tcp.on('data', (d) => { buf = Buffer.concat([buf, d]); pump() })
    tcp.on('close', () => end(1006))
    tcp.on('error', () => end(1006))
    pump()
  }
}

globalThis.WebSocketPair = class {
  constructor() {
    const server = new HostSocket()
    const client = { server }          // what the Worker returns; the host reaches the server end through it
    this[0] = client
    this[1] = server
  }
}

// ---------------------------------------------------------------- Durable Object ctx for a Room
export function roomCtx() {
  const ctx = {
    sockets: new Set(),
    acceptWebSocket(ws) { ws.ctx = ctx; ctx.sockets.add(ws) },
    getWebSockets() { return [...ctx.sockets] },
    waitUntil(p) { Promise.resolve(p).catch(() => {}) },
  }
  return ctx
}

// ---------------------------------------------------------------- Durable Object ctx for the World: SQLite + one alarm
export function worldCtx(file, onAlarm) {
  const db = new DatabaseSync(file)
  db.exec('PRAGMA journal_mode = WAL')
  db.exec('PRAGMA synchronous = NORMAL')
  const cache = new Map()
  const prep = (q) => { let s = cache.get(q); if (!s) { s = db.prepare(q); cache.set(q, s) } return s }
  const sql = {
    exec(q, ...args) {
      const rows = /^\s*(select|pragma|with)\b/i.test(q) ? prep(q).all(...args) : (prep(q).run(...args), [])
      return { toArray: () => rows, [Symbol.iterator]: () => rows[Symbol.iterator]() }
    },
  }
  let alarmAt = null, timer = null
  const ctx = {
    db,
    storage: {
      sql,
      transactionSync(fn) {
        db.exec('BEGIN')
        try { const r = fn(); db.exec('COMMIT'); return r } catch (e) { try { db.exec('ROLLBACK') } catch (_) {} throw e }
      },
      async getAlarm() { return alarmAt },
      async setAlarm(at) {
        alarmAt = at
        clearTimeout(timer)
        timer = setTimeout(() => { alarmAt = null; Promise.resolve(onAlarm()).catch((e) => console.error('[host] world alarm failed', e)) }, Math.max(0, at - Date.now()))
      },
    },
    waitUntil(p) { Promise.resolve(p).catch(() => {}) },
    close() { clearTimeout(timer); alarmAt = null; cache.clear(); try { db.close() } catch (e) { console.error('[host] sqlite close', e.message) } },
  }
  return ctx
}

// Durable Object RPC passes structured clones, never shared objects. The host keeps that rule.
export function rpc(target) {
  return new Proxy({}, {
    get(_, name) {
      if (name === 'then') return undefined
      return async (...args) => {
        let obj
        try { obj = target() } catch (e) { return undefined }       // the object is gone (world closed): like a failed DO call
        const fn = obj[name]
        if (typeof fn !== 'function') throw new Error('no RPC method ' + String(name))
        if (name === 'fetch') return fn.apply(obj, args)          // a Request/Response with a socket is handed over, not cloned
        const out = await fn.apply(obj, structuredClone(args))
        return out === undefined ? undefined : structuredClone(out)
      }
    },
  })
}
