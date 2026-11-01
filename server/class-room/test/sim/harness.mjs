// Simulation harness for the class-room server: the REAL Worker-side Room(s) and World hub, in process,
// driven by fake clients that behave like the game client (they keep their own copy of the world from
// chunks + ops, send edits with the block they SEE as `b`, catch up with sync, reload on rs).
//
// Everything random comes from one seed, so a failing run is replayed exactly with SIM_SEED=<seed>.
// Time is node:test mock time (Date + setInterval); RPC interleaving is real (setImmediate), but its
// order is drawn from the seed too. Chaos knobs: RPC latency, lost and repeated World->Room deliveries,
// a Room object evicted and rebuilt from its sockets, the World object restarted from its saved db.
// Fake refs and aliases only ("Sim Pup NN"). Nothing here touches the network.
import '../helpers.mjs'
import { makeRoom, joinReq } from '../helpers.mjs'
import { Room } from '../../src/room.js'
import { memDb } from '../../src/world/memdb.js'
import { makeHub } from '../../src/world/hub.js'
import { cellAt, decodeChunk, locate } from '../../src/world/chunks.js'
import { plotRect } from '../../src/claims.js'

// ---- seeded randomness (mulberry32)
export function rng(seed) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return { next, int: (n) => Math.floor(next() * n), chance: (p) => next() < p, pick: (arr) => arr[Math.floor(next() * arr.length)] }
}
export const seedFromEnv = (fallback) => (process.env.SIM_SEED ? Number(process.env.SIM_SEED) : fallback)

const tickAsync = () => new Promise((r) => setImmediate(r))
const key = (x, y, z) => x + ',' + y + ',' + z
const ck = (cx, cz) => cx + ',' + cz

// ---- one fake game client
class SimClient {
  constructor(sim, ref, role, assigned, res) {
    this.sim = sim; this.ref = ref; this.role = role
    this.rid = assigned.room; this.plot = assigned.plot
    this.sock = res.webSocket ? res.webSocket.server : null
    this.status = res.status
    this.q = 0; this.read = 0
    this.pos = null
    this.last = 0                       // highest op seq received (0 = none yet)
    this.gaps = 0; this.repeats = 0; this.floor = 0
    this.chunks = new Map()             // 'cx,cz' -> { s, cells: Map 'x,y,z' -> id }
    this.want = new Set()               // chunks this client keeps a copy of
    this.seen = []                      // op seqs in arrival order (for duplicate/order checks)
    this.nos = []; this.mvs = []; this.drs = []; this.rs = 0; this.syncs = 0; this.hello = null
  }
  get room() { return this.sim.rooms.get(this.rid) }
  get open() { return this.sock && !this.sock.closed }
  async send(o) { if (this.open) await this.room.webSocketMessage(this.sock, JSON.stringify({ v: 0, ...o })) }
  async at(x, z, y = 64) { this.pos = { x, y, z }; await this.send({ t: 'p', q: this.q++, x: x + 0.5, y, z: z + 0.5, r: 0, f: 0 }) }
  sees(x, y, z) {
    const { cx, cz } = locate(x, y, z)
    const c = this.chunks.get(ck(cx, cz))
    return c ? (c.cells.get(key(x, y, z)) ?? 0) : null
  }
  // like the game: b is the block this client SEES there (it may be behind -> stale)
  async edit(x, y, z, id) { const b = this.sees(x, y, z); await this.send({ t: 'b', x, y, z, id, b: b ?? 0 }) }
  async watch(cx, cz) { this.want.add(ck(cx, cz)); await this.send({ t: 'cget', cx, cz }) }
  // read everything the server sent since last time
  pull() {
    if (!this.sock) return
    const inbox = this.sock.inbox
    for (; this.read < inbox.length; this.read++) {
      const m = JSON.parse(inbox[this.read])
      if (m.t === 'hello') this.hello = m
      else if (m.t === 'ch') this.onChunk(m)
      else if (m.t === 'o') this.onOps(m.o)
      else if (m.t === 'rs') { this.rs++; this.reloadAll = true; this.last = 0; this.floor = 0 }   // reload: the op stream restarts
      else if (m.t === 'no') this.nos.push(m)
      else if (m.t === 'mv') this.mvs.push(m)
      else if (m.t === 'dr') this.drs.push(m)
    }
  }
  onChunk(m) {
    const d = decodeChunk(m.d)
    const cells = new Map()
    for (const [idx, id] of d.edits) { const c = cellAt(m.cx, m.cz, idx); cells.set(key(c.x, c.y, c.z), id) }
    this.chunks.set(ck(m.cx, m.cz), { s: m.s, cells })
    if (m.s > this.floor) this.floor = m.s                  // ops must continue from (at most) the newest chunk we loaded
  }
  onOps(list) {
    for (const [s, x, y, z, id] of list) {
      this.seen.push(s)
      if (this.last && s <= this.last) { this.repeats++; continue }   // the room must never send an op twice
      if (s > (this.last || this.floor) + 1) { this.gaps++; this.gap = true }   // nor skip one without rs
      this.last = s
      const { cx, cz } = locate(x, y, z)
      const c = this.chunks.get(ck(cx, cz))
      if (c && s > c.s) c.cells.set(key(x, y, z), id)        // like the game: ops older than the chunk are in it already
    }
  }
  // what a client does on its own between frames: catch up after a gap, reload after rs
  async heal() {
    // the server drops an over-limit chunk request without a reply, so a client asks again for what it still lacks
    // (FINDING 3: so after a reload a client must keep asking until every chunk it watches is fresh)
    if (this.gap) { this.gap = false; this.syncs++; this.reloadAll = true }      // a hole in the op stream: reload
    if (this.reloadAll) { this.reloadAll = false; for (const c of this.chunks.values()) c.stale = true }
    let n = 0
    for (const w of this.want) {
      const c = this.chunks.get(w)
      if ((!c || c.stale) && n++ < 4) { const [cx, cz] = w.split(',').map(Number); await this.send({ t: 'cget', cx, cz }) }
    }
  }
}

// ---- the server side, with chaos
export async function makeSim(t, { seed = 1, latency = 4, dropDeliver = 0, dupDeliver = 0, world = 'world-0001', cfg = 'contest' } = {}) {
  t.mock.timers.enable({ apis: ['setInterval', 'Date'], now: Date.UTC(2026, 10, 2, 13, 0, 0) })
  const r = rng(seed)
  const sim = { seed, r, rooms: new Map(), clients: [], stats: { rpc: 0, dropped: 0, duplicated: 0, worldRestarts: 0, roomEvictions: 0 } }
  sim.db = memDb()
  const deliver = async (name, msg) => {
    const room = sim.rooms.get(name)
    if (!room) return false
    if (dropDeliver && r.chance(dropDeliver)) { sim.stats.dropped++; return false }    // lost on the way: the World resends
    const ok = await room.deliver(msg)
    if (dupDeliver && r.chance(dupDeliver)) { sim.stats.duplicated++; await room.deliver(msg) }   // repeated: the inbox drops it
    return ok
  }
  sim.hub = makeHub({ db: sim.db, send: deliver, gen: () => 0 })
  const lag = async () => { const n = r.int(latency + 1); for (let i = 0; i < n; i++) await tickAsync() }
  const call = (fn) => async (...a) => { sim.stats.rpc++; await lag(); return fn(sim.hub, ...a) }
  const stub = {
    assign: call((h, a) => h.assign(a)), edit: call((h, a, b) => h.edit(a, b)), link: call((h, id) => h.link(id)),
    unlink: call((h, id) => h.unlink(id)), touch: call((h, id) => h.touch(id)), left: call((h, ref) => h.left(ref)),
    chunk: call((h, x, z) => h.chunk(x, z)), since: call((h, s, n) => h.since(s, n)), setLocked: call((h, on) => h.setLocked(on)),
  }
  if (sim.hub.inv) { stub.inv = call((h, x, y, z) => h.inv(x, y, z)); stub.move = call((h, ref, x, y, z, i, n, d) => h.move(ref, x, y, z, i, n, d)) }
  sim.env = { WORLDS: { idFromName: (n) => n, get: () => stub } }
  sim.hasItems = !!stub.inv

  sim.settle = async (n = 40) => { for (let i = 0; i < n; i++) await tickAsync() }
  sim.tick = (ms) => t.mock.timers.tick(ms)
  sim.now = () => Date.now()

  sim.join = async (ref, role = 'kid', grp) => {
    const assigned = await stub.assign({ world, ref, grp, role, bld: 's', cfg })
    if (assigned.err) return { ref, err: assigned.err }
    if (!sim.rooms.has(assigned.room)) { const m = makeRoom({ open: false, env: sim.env }); sim.rooms.set(assigned.room, m.room); m.room.__ctx = m.ctx }
    const room = sim.rooms.get(assigned.room)
    const alias = role === 'kid' ? 'Sim Pup ' + ref.slice(-2) : 'Sim Teacher'
    const res = await room.fetch(joinReq(ref, alias, { 'x-bt-role': role, 'x-bt-cfg': cfg, 'x-bt-world': world, 'x-bt-rid': assigned.room, 'x-bt-ip': '00aa11bb22cc33dd' }))
    const c = new SimClient(sim, ref, role, assigned, res)
    sim.clients.push(c)
    await sim.settle()
    return c
  }
  // a plot's work spot and its chunks
  sim.spot = (c, dx = 4, dz = 4) => { const p = plotRect(c.plot); return { x: p.x0 + dx, z: p.z0 + dz } }

  // move every queued op to every room, and let clients read and heal, until nothing changes
  sim.pump = async (rounds = 12) => {
    for (let i = 0; i < rounds; i++) {
      await sim.hub.fan.tick()
      await sim.settle()
      for (const c of sim.clients) { c.pull(); await c.heal() }
      await sim.settle()
      for (const c of sim.clients) c.pull()
      const stale = (c) => [...c.want].some((w) => !c.chunks.get(w) || c.chunks.get(w).stale)
      const behind = sim.clients.some((c) => c.open && (c.gap || c.reloadAll || stale(c)))
      if (!behind && i >= 2) { sim.tick(300); await sim.hub.fan.tick(); await sim.settle(); for (const c of sim.clients) c.pull(); if (!sim.clients.some((c) => c.open && (c.gap || c.reloadAll || stale(c)))) return }
      sim.tick(300)   // the chunk and sync limits refill
    }
  }

  // ---- chaos: the World object restarts from its saved db (deploy, crash, eviction). Rooms keep their sockets.
  sim.restartWorld = async () => {
    sim.hub.flush()
    sim.hub = makeHub({ db: sim.db, send: deliver, gen: () => 0 })
    sim.stats.worldRestarts++
    await sim.settle()
  }
  // ---- chaos: a Room object is evicted and rebuilt from its hibernated sockets (constructor path)
  sim.evictRoom = async (rid) => {
    const old = sim.rooms.get(rid)
    if (old.timer) clearInterval(old.timer)
    const fresh = new Room(old.__ctx, sim.env)
    fresh.__ctx = old.__ctx
    sim.rooms.set(rid, fresh)
    sim.stats.roomEvictions++
    for (const c of sim.clients) if (c.rid === rid) c.inEvicted = true
    await sim.settle()
  }

  // ---- invariants
  sim.serverCells = (cx, cz) => {
    const d = decodeChunk(sim.hub.chunk(cx, cz).d)
    const cells = new Map()
    for (const [idx, id] of d.edits) { if (!id) continue; const c = cellAt(cx, cz, idx); cells.set(key(c.x, c.y, c.z), id) }
    return cells
  }
  // every open client's copy of every chunk it watches equals the World's
  sim.diverged = () => {
    const out = []
    for (const c of sim.clients) {
      if (!c.open) continue
      for (const w of c.want) {
        const [cx, cz] = w.split(',').map(Number)
        const mine = c.chunks.get(w)
        if (!mine) { out.push({ ref: c.ref, chunk: w, why: 'never loaded' }); continue }
        const srv = sim.serverCells(cx, cz)
        const cli = new Map([...mine.cells].filter(([, id]) => id))
        for (const [k, id] of srv) if (cli.get(k) !== id) { out.push({ ref: c.ref, chunk: w, cell: k, server: id, client: cli.get(k) ?? 0 }); break }
        for (const [k, id] of cli) if (!srv.has(k)) { out.push({ ref: c.ref, chunk: w, cell: k, server: 0, client: id }); break }
      }
    }
    return out
  }
  // the op stream each client got had no repeat and no hole (outside a reload)
  // (strict: allowEvictionGaps lets a client of an evicted Room have healed holes; see FINDING 2 in sim.scenarios)
  sim.streamFaults = ({ allowEvictionGaps = false } = {}) => sim.clients.filter((c) => c.repeats || (c.gaps && !(allowEvictionGaps && c.inEvicted))).map((c) => ({ ref: c.ref, repeats: c.repeats, gaps: c.gaps }))
  sim.evictionGaps = () => sim.clients.filter((c) => c.inEvicted && c.gaps).length
  sim.report = () => `seed ${seed} | rpc ${sim.stats.rpc} | lost deliveries ${sim.stats.dropped} | repeated ${sim.stats.duplicated} | world restarts ${sim.stats.worldRestarts} | room evictions ${sim.stats.roomEvictions} | rs ${sim.clients.reduce((a, c) => a + c.rs, 0)} | syncs ${sim.clients.reduce((a, c) => a + c.syncs, 0)}`
  return sim
}

// Join a teacher (opens the world) and n kids. Returns { teacher, kids }.
export async function classOf(sim, n, { grp } = {}) {
  const teacher = await sim.join('staffref-sim1', 'teacher')
  const kids = []
  for (let i = 0; i < n; i++) kids.push(await sim.join('kidref-sim' + String(i).padStart(2, '0'), 'kid', grp ? grp(i) : undefined))
  return { teacher, kids }
}

// Each kid stands at its plot's work spot and keeps a copy of the chunks around it (and of a shared chunk).
export async function settleIn(sim, kids, extra = []) {
  for (const k of kids) {
    if (!k.sock) continue
    const s = sim.spot(k)
    await k.at(s.x, s.z)
    const { cx, cz } = locate(s.x, 64, s.z)
    k.want.add(ck(cx, cz))
    for (const [ex, ez] of extra) k.want.add(ck(ex, ez))
  }
  // load in a few rounds: the chunk limit is 4/s with a burst of 8
  for (let round = 0; round < 4; round++) {
    for (const k of kids) for (const w of k.want) if (!k.chunks.has(w)) { const [cx, cz] = w.split(',').map(Number); await k.send({ t: 'cget', cx, cz }) }
    await sim.settle(); sim.tick(1000)
    for (const k of kids) k.pull()
  }
}
