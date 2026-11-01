// One Durable Object = one room (one class period). Phase 0: presence only.
//
// Who can make a room: only staff. A room does not exist for kids until a teacher/admin
// ticket (signed by TechWorks after a staff passkey sign-in) joins it. Kids cannot create,
// host, or invite; there is no frame for any of that (see protocol.js). The room stays
// closed to kids when no staff has opened it, and again after a restart (fails closed).
//
// What it does
//   - accepts up to MAX_PLAYERS kids (plus up to MAX_STAFF_EXTRA staff), each with a small id
//   - remembers each alias (for the nameplate) and the last ACCEPTED position
//   - every TICK_MS sends each client the positions that changed (not its own)
//   - checks every position against the speed and bounds rules; bad ones are snapped back
//   - teacher/admin: kick, freeze, open, close (rollback is refused: no edits exist yet)
//
// What it never does
//   - store anything. No ctx.storage, no alarms. Strikes, bans, used tickets and the open
//     flag live in memory and are forgotten when the object is evicted.
//   - accept text, or any frame outside protocol.js. A bad frame ends the connection.
//   - send a kid's opaque ref or IP to any client, or write either to a log.
//
// Config: every ticket names one of the 7 world configs (protocol.js CONFIG_IDS).
//
// Wire format (JSON text frames). Client frames are defined and checked in protocol.js.
//   server -> client  {"t":"hello","you":3,"role":"k"|"t"|"a","max":30,"tick":200,"frozen":0,"players":[{"i":1,"a":"Test Pup 01","p":[x,y,z,r,f]|null}, ...]}
//                     {"t":"join","i":4,"a":"Test Pup 02"}   {"t":"leave","i":4}
//                     {"t":"s","k":812,"f":0,"p":[[id,x,y,z,r,f], ...]}   snapshot; "f":1 = full resync
//                     {"t":"pong","n":7}
//                     {"t":"fix","x":1,"y":64,"z":2}   the server refused a move: go back here
//                     {"t":"bud","area":[6,10],"you":[3,10],"lag":[212,400]}   high-tick and lag budget after placing or breaking a belt/oven
//                     {"t":"no","c":"hightick"|"lag",...,"bud":{...}}           a placement the World refused, with the numbers
//                     {"t":"frz","on":1}               freeze on/off (everyone)
//                     {"t":"ok","a":"kick"}  {"t":"err","c":"..."}   (err is followed by a close for protocol errors)
//                     {"t":"full","max":30}            then the socket closes with code 4001

import { DurableObject } from 'cloudflare:workers'
import {
  PROTOCOL, isConfigId, MAX_FRAME_CHARS, MAX_PLAYERS, MAX_STAFF_EXTRA, TICK_MS, FULL_EVERY_TICKS, IDLE_CLOSE_MS, CLOSE, ROLES,
  isOpaqueId, isStaff, cleanAlias, parseFrame, frag, newBucket, takeToken,
} from './protocol.js'
import { checkMove } from './rules.js'
import { makeLedger, logFailure } from './guard.js'
import { parseFrame2, EDITS_PER_SEC, CHUNK_REQ_PER_SEC } from './world/protocol2.js'
import { makeInbox } from './world/fanout.js'
import { checkBlockEdit } from './rules.js'

const SWEEP_EVERY = 25    // ticks (about 5 s): idle sockets, used tickets, old limiters
const FORGIVE_EVERY = 50  // ticks (about 10 s): forget flood and speed counts
const FLOOD_LIMIT = 30    // frames refused for rate before the socket is kicked
const SPEED_LIMIT = 5     // refused moves in one forgive window before the socket is kicked
const IP_MSGS_PER_SEC = 400   // all sockets behind one IP together (a class shares one school IP)
const IP_CONNECTS_BURST = 60  // join attempts, refilled at one per second
const JTI_KEEP_MS = 6 * 60 * 1000
const MAX_IP_ENTRIES = 300

const upgraded = (client) =>
  new Response(null, { status: 101, webSocket: client, headers: { 'Sec-WebSocket-Protocol': PROTOCOL } })
const refuse = (status, why) => new Response(why, { status })
const roleLetter = (r) => (r === 'admin' ? 'a' : r === 'teacher' ? 't' : 'k')

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.players = new Map() // id -> player
    this.byRef = new Map()   // opaque ref -> id (so a second tab replaces the first)
    this.nextId = 1
    this.tick = 0
    this.timer = null
    this.ledger = makeLedger()
    this.usedJti = new Map() // ticket id -> time seen (a ticket works once)
    this.ips = new Map()     // ip tag -> { msgs, conns, seen }
    this.open = false        // kids may join only while open
    this.locked = false      // a teacher closed it on purpose: staff joining does not reopen it
    this.cfg = null
    this.frozen = false
    this.wid = null          // shared-world id (null = single-room mode)
    this.rid = null          // this room's name inside the world
    this.stub = null
    this.inbox = null        // set once the world has linked this room

    // If this object was evicted and woken while sockets stayed open, rebuild the player
    // list from the sockets' small attachments. Positions are not kept; the next frame
    // from each client restores them. The room reopens only if a staff socket is among them.
    const now = Date.now()
    for (const ws of ctx.getWebSockets()) {
      const a = ws.deserializeAttachment()
      if (!a || !a.id) continue
      if (a.wid && !this.wid) { this.wid = a.wid; this.rid = a.rid; this.stub = env.WORLDS.get(env.WORLDS.idFromName(a.wid)); this.open = true }
      const p = this.makePlayer(ws, a.id, a.ref, a.alias, a.role || 'kid', 'none', now)
      this.players.set(a.id, p)
      this.byRef.set(a.ref, a.id)
      this.nextId = Math.max(this.nextId, (a.id % 65535) + 1)
      if (isStaff(p.role)) this.open = true
      if (a.cfg && isConfigId(a.cfg)) this.cfg = a.cfg
    }
    if (this.players.size) this.startTimer()
    if (this.wid && this.players.size) this.relink()
  }

  relink() { this.ctx.waitUntil(this.stub.link(this.rid).then((head) => { this.inbox = makeInbox(head) })) }

  makePlayer(ws, id, ref, alias, role, ip, now) {
    return {
      ws, id, ref, alias, role, ip, pos: null, posAt: now, dirty: false, last: now,
      bucket: newBucket(now), ebucket: newBucket(now, EDITS_PER_SEC), cbucket: newBucket(now, CHUNK_REQ_PER_SEC, 8), lastQ: -1, flood: 0, viol: 0,
    }
  }

  allocId() {
    for (let i = 0; i < 65535; i++) {
      const id = this.nextId
      this.nextId = (this.nextId % 65535) + 1
      if (!this.players.has(id)) return id
    }
    throw new Error('no free ids')
  }

  ipEntry(ip, now) {
    let e = this.ips.get(ip)
    if (!e) {
      if (this.ips.size >= MAX_IP_ENTRIES) this.ips.delete(this.ips.keys().next().value)
      e = { msgs: newBucket(now, IP_MSGS_PER_SEC), conns: newBucket(now, 1, IP_CONNECTS_BURST), seen: now }
      this.ips.set(ip, e)
    }
    e.seen = now
    return e
  }

  sweepState(now) {
    for (const [j, t] of this.usedJti) if (now - t > JTI_KEEP_MS) this.usedJti.delete(j)
    for (const [k, e] of this.ips) if (now - e.seen > 60000) this.ips.delete(k)
    this.ledger.sweep(now)
  }

  // ------------------------------------------------------------ join

  async fetch(request) {
    if (request.headers.get('Upgrade') !== 'websocket') return refuse(426, 'expected websocket')

    // Set by the Worker after it verified the signed ticket. Re-checked here anyway.
    const h = (n) => request.headers.get(n) || ''
    const ref = h('x-bt-ref')
    let alias = ''
    try { alias = cleanAlias(decodeURIComponent(h('x-bt-alias'))) || '' } catch (e) {}
    const role = h('x-bt-role')
    const jti = h('x-bt-jti')
    const cfg = h('x-bt-cfg')
    const wid = h('x-bt-world')
    const rid = h('x-bt-rid')
    const ip = /^[0-9a-f]{16}$/.test(h('x-bt-ip')) ? h('x-bt-ip') : 'none'
    if (!isOpaqueId(ref) || !alias || !ROLES.includes(role) || !isOpaqueId(jti) || !isConfigId(cfg)) return refuse(400, 'bad identity')

    const now = Date.now()
    this.sweepState(now)

    // A ticket works once. A replayed ticket is refused (and the kid is not punished for it:
    // whoever replays it is not necessarily the kid it was issued to).
    if (this.usedJti.has(jti)) { logFailure(alias, 'replay-ticket', now); return refuse(401, 'used') }
    this.usedJti.set(jti, now)

    if (!takeToken(this.ipEntry(ip, now).conns, now)) { logFailure(alias, 'ip-connects', now); return refuse(429, 'slow down') }
    if (this.ledger.isBanned(ref, now)) { logFailure(alias, 'banned-join', now); return refuse(403, 'banned') }

    const staff = isStaff(role)
    if (wid) {   // shared world: the hub already checked open/config/build when it seated this kid
      if (!isOpaqueId(wid) || !isOpaqueId(rid) || !this.env.WORLDS) return refuse(400, 'bad identity')
      if (this.wid && (this.wid !== wid || this.rid !== rid)) return refuse(403, 'config')
      if (!this.wid) { this.wid = wid; this.rid = rid; this.stub = this.env.WORLDS.get(this.env.WORLDS.idFromName(wid)) }
      this.open = true
    }
    if (!staff && !this.open) return refuse(403, 'closed')
    // A room is one config. Kids must carry the same config id as the staff who opened it.
    if (!this.wid && !staff && cfg !== this.cfg) return refuse(403, 'config')
    if (!this.wid && staff && this.cfg && this.players.size > 0 && cfg !== this.cfg) return refuse(403, 'config')

    // A second tab from the same kid replaces the first, so there are no ghost avatars.
    const dup = this.byRef.get(ref)
    if (dup) this.drop(dup, CLOSE.REPLACED, 'replaced')

    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)

    const all = [...this.players.values()]
    const kids = all.filter((p) => !isStaff(p.role)).length
    if (staff ? all.length - kids >= MAX_STAFF_EXTRA : kids >= MAX_PLAYERS) {
      server.accept()
      server.send(JSON.stringify({ t: 'full', max: MAX_PLAYERS }))
      server.close(CLOSE.FULL, 'full')
      return upgraded(client)
    }

    if (staff) {
      if (this.players.size === 0 || !this.cfg) this.cfg = cfg
      if (!this.locked) this.open = true
    }

    this.ctx.acceptWebSocket(server)
    const id = this.allocId()
    server.serializeAttachment({ id, ref, alias, role, cfg: this.cfg, wid: this.wid, rid: this.rid })
    const me = this.makePlayer(server, id, ref, alias, role, ip, now)

    const others = []
    for (const p of this.players.values()) {
      others.push({ i: p.id, a: p.alias, p: p.pos ? [p.pos.x, p.pos.y, p.pos.z, p.pos.r, p.pos.f] : null })
    }
    this.players.set(id, me)
    this.byRef.set(ref, id)

    this.send(me, { t: 'hello', you: id, role: roleLetter(role), max: MAX_PLAYERS, tick: TICK_MS, frozen: this.frozen ? 1 : 0, players: others })
    this.broadcast({ t: 'join', i: id, a: alias }, id)
    this.startTimer()
    if (this.wid && this.players.size === 1) this.relink()
    return upgraded(client)
  }

  // ------------------------------------------------------------ messages

  async webSocketMessage(ws, message) {
    const a = ws.deserializeAttachment()
    const p = a && this.players.get(a.id)
    if (!p) return

    const now = Date.now()
    p.last = now

    // Rate limits first, before any parsing: per socket and per IP. Over the limit = the
    // frame is thrown away and counted; a flood ends in a kick.
    const ipOk = p.ip === 'none' || takeToken(this.ipEntry(p.ip, now).msgs, now)
    if (!takeToken(p.bucket, now) || !ipOk) {
      if (++p.flood > FLOOD_LIMIT) this.punish(p, 'flood', CLOSE.ABUSE, now)
      return
    }

    if (this.wid && typeof message === 'string' && message.length <= MAX_FRAME_CHARS) {
      let m = null
      try { m = JSON.parse(message) } catch (e) {}
      if (m && (m.t === 'b' || m.t === 'sync' || m.t === 'cget')) return this.worldFrame(p, m, now)
    }
    const f = parseFrame(message)
    if (f.err) return this.hardFail(p, f.err, now)

    if (f.t === 'ping') return this.send(p, { t: 'pong', n: f.n })

    if (f.t === 'p') {
      if (f.q <= p.lastQ) return this.hardFail(p, 'replay', now)   // sequence must go up
      p.lastQ = f.q
      if (this.frozen && !isStaff(p.role) && p.pos) return this.snapBack(p)
      const r = checkMove(p.pos, f.pos, now - p.posAt)
      if (!r.ok) {
        if (++p.viol >= SPEED_LIMIT) return this.punish(p, r.why, CLOSE.ABUSE, now)
        if (p.pos) return this.snapBack(p)
        return   // first frame out of bounds: ignore it, the next one can be fine
      }
      p.pos = f.pos
      p.posAt = now
      p.dirty = true
      return
    }

    // f.t === 'st': staff commands. The role comes from the signed ticket (bound to this
    // room), and is checked again here. A kid sending one is an attack, not a mistake.
    if (!isStaff(p.role)) return this.hardFail(p, 'role', now)
    this.staffCommand(p, f)
  }

  // Shared-world frames. Cheap checks here; the hub does the claims check and the one real write.
  async worldFrame(p, m, now) {
    const f = parseFrame2(m)
    if (f.err) return this.hardFail(p, f.err, now)
    if (f.t === 'cget') {
      if (!takeToken(p.cbucket, now)) return
      const r = await this.stub.chunk(f.cx, f.cz)
      return this.send(p, r.error ? { t: 'no', c: 'chunk' } : { t: 'ch', cx: f.cx, cz: f.cz, s: r.s, d: r.d })
    }
    if (f.t === 'sync') {
      if (!takeToken(p.cbucket, now)) return
      const r = await this.stub.since(f.s, 200)
      return this.send(p, r.resync ? { t: 'rs' } : { t: 'o', o: r.ops.map((o) => [o.s, o.x, o.y, o.z, o.i]) })
    }
    const no = (c, extra) => this.send(p, { t: 'no', c, x: f.x, y: f.y, z: f.z, ...extra })
    if (!takeToken(p.ebucket, now)) return no('rate')
    if (this.frozen && !isStaff(p.role)) return no('frozen')
    const v = checkBlockEdit({ op: f.id === 0 ? 'break' : 'place', x: f.x, y: f.y, z: f.z, id: f.id }, p.pos, null)
    if (!v.ok) return no(v.why)
    const [r] = await this.stub.edit({ ref: p.ref, staff: isStaff(p.role) }, [{ x: f.x, y: f.y, z: f.z, id: f.id, b: f.b }])
    // Relay only: the World decided and sent its numbers; the room passes them to this kid.
    if (r.ok) return r.budget ? this.send(p, { t: 'bud', ...r.budget }) : undefined   // the block itself arrives through the fan-out
    no(r.why, { ...(r.cur === undefined ? {} : { cur: r.cur }), ...(r.budget ? { bud: r.budget } : {}) })
    if (r.strike) this.punish(p, r.why, CLOSE.ABUSE, now)
  }

  // World -> this room (RPC). Ordered ops from the hub; repeats are dropped; a gap tells clients to reload.
  async deliver(msg) {
    if (!this.inbox) return false
    const r = this.inbox.push(msg)
    if (r.gap) {
      this.inbox = makeInbox(msg.resync ? msg.head : msg.ops.length ? msg.ops[msg.ops.length - 1].s : msg.from)
      this.broadcast({ t: 'rs' })
    } else if (r.fresh.length) this.broadcast({ t: 'o', o: r.fresh.map((o) => [o.s, o.x, o.y, o.z, o.i]) })
    return true
  }

  staffCommand(p, f) {
    if (f.a === 'kick') {
      const t = this.players.get(f.i)
      if (!t || t === p) return this.send(p, { t: 'err', c: 'target' })
      if (isStaff(t.role) && p.role !== 'admin') return this.send(p, { t: 'err', c: 'role' })
      this.drop(t.id, CLOSE.KICKED, 'kicked')
      return this.send(p, { t: 'ok', a: 'kick' })
    }
    if (f.a === 'freeze') {
      this.frozen = f.on === 1
      this.broadcast({ t: 'frz', on: f.on })
      return this.send(p, { t: 'ok', a: 'freeze' })
    }
    if (f.a === 'open' || f.a === 'close') {
      const on = f.a === 'open'
      this.locked = !on; this.open = on || !!this.wid
      if (this.wid) this.ctx.waitUntil(this.stub.setLocked(!on))   // the whole world, every room
      return this.send(p, { t: 'ok', a: f.a })
    }
    // rollback: nothing is edited or stored in Phase 0, so there is nothing to roll back.
    return this.send(p, { t: 'err', c: p.role === 'admin' ? 'unsupported' : 'role' })
  }

  snapBack(p) {
    const q = p.pos
    this.send(p, { t: 'fix', x: q.x, y: q.y, z: q.z })
  }

  // A protocol error: tell the socket why (one short code), count a strike, close it.
  hardFail(p, code, now) {
    this.send(p, { t: 'err', c: code })
    this.punish(p, code, CLOSE.BAD, now)
  }

  punish(p, code, closeCode, now) {
    logFailure(p.alias, code, now)
    this.ledger.strike(p.ref, now)   // 3 strikes in 10 minutes = temporary ban (see guard.js)
    this.drop(p.id, closeCode, 'abuse')
  }

  async webSocketClose(ws, code) {
    const a = ws.deserializeAttachment()
    if (a && a.id) this.drop(a.id, code, 'bye')
  }

  async webSocketError(ws) {
    const a = ws.deserializeAttachment()
    if (a && a.id) this.drop(a.id, 1011, 'error')
  }

  // ------------------------------------------------------------ tick

  startTimer() {
    if (!this.timer) this.timer = setInterval(() => this.onTick(), TICK_MS)
  }

  stopTimer() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  onTick() {
    this.tick++
    const now = Date.now()
    const everyone = [...this.players.values()]

    if (this.tick % SWEEP_EVERY === 0) {
      for (const p of everyone) if (now - p.last > IDLE_CLOSE_MS) this.drop(p.id, CLOSE.IDLE, 'idle')
      this.sweepState(now)
    }
    if (this.tick % FORGIVE_EVERY === 0) {
      for (const p of everyone) { p.flood = 0; p.viol = 0 }
      if (this.wid && this.inbox) this.ctx.waitUntil(this.stub.touch(this.rid))   // heartbeat to the world
    }

    const full = this.tick % FULL_EVERY_TICKS === 0
    const entries = []
    for (const p of everyone) {
      if (p.pos && (p.dirty || full)) {
        entries.push({ id: p.id, s: frag(p.id, p.pos) })
        p.dirty = false
      }
    }

    if (entries.length) {
      const head = '{"t":"s","k":' + this.tick + ',"f":' + (full ? 1 : 0) + ',"p":['
      for (const p of everyone) {
        if (!this.players.has(p.id)) continue
        const mine = []
        for (const e of entries) if (e.id !== p.id) mine.push(e.s) // never send a kid their own position
        if (mine.length) this.sendRaw(p, head + mine.join(',') + ']}')
      }
    }

    if (this.players.size === 0) this.stopTimer()
  }

  // ------------------------------------------------------------ helpers

  send(p, obj) { this.sendRaw(p, JSON.stringify(obj)) }

  sendRaw(p, s) {
    try { p.ws.send(s) } catch (e) { this.drop(p.id, 1011, 'send') }
  }

  broadcast(obj, exceptId) {
    const s = JSON.stringify(obj)
    for (const p of [...this.players.values()]) if (p.id !== exceptId) this.sendRaw(p, s)
  }

  drop(id, code, reason) {
    const p = this.players.get(id)
    if (!p) return
    this.players.delete(id)
    if (this.byRef.get(p.ref) === id) this.byRef.delete(p.ref)
    // 1005, 1006 and 1015 cannot be sent in a close frame
    const ok = Number.isInteger(code) && code >= 1000 && code <= 4999 && ![1004, 1005, 1006, 1015].includes(code)
    try { p.ws.close(ok ? code : 1000, reason) } catch (e) {}
    this.broadcast({ t: 'leave', i: id }, id)
    if (this.wid) {
      this.ctx.waitUntil(this.stub.left(p.ref))
      if (this.players.size === 0) { this.inbox = null; this.ctx.waitUntil(this.stub.unlink(this.rid)) }
    }
  }
}
