// The World Durable Object: one per shared world. Methods below are called by Rooms and the Worker
// over RPC. Everything real lives in world/hub.js; this file only gives it storage, a push channel
// to the rooms, a fan-out clock, and ONE alarm shared by the save, the world sim and the history
// purge (earliest due wins). It never sees text, names or IPs.
import { DurableObject } from 'cloudflare:workers'
import { makeHub } from './world/hub.js'
import { sqlDb } from './world/sqldb.js'
import { SIM_MS } from './world/sim.js'
import { makeHistory } from './editlog.js'

export const TICK_MS = 67          // 15 fan-out ticks a second (Diego, 0068)
export const SAVE_MS = 1500
export const PURGE_MS = 24 * 60 * 60 * 1000

// Pure scheduler: what the alarm should do at `now` and when it must fire next.
// due = { save, sim, purge } (ms or null); on = players are linked.
export function plan(now, due, on) {
  const run = { save: due.save != null && due.save <= now, sim: on && due.sim != null && due.sim <= now, purge: due.purge != null && due.purge <= now }
  const next = {
    save: run.save ? null : due.save,
    sim: on ? (run.sim ? now + SIM_MS : due.sim) : null,
    purge: run.purge ? now + PURGE_MS : due.purge,
  }
  const at = Math.min(...Object.values(next).filter((v) => v != null))
  return { run, next, at: Number.isFinite(at) ? at : null }
}

export class World extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    const db = sqlDb(ctx)
    this.hub = makeHub({
      db,
      send: async (room, msg) => {
        try { return (await env.ROOMS.get(env.ROOMS.idFromName(room)).deliver(msg)) === true } catch (e) { return false }
      },
    })
    this.history = makeHistory(db)
    this.timer = null
    this.due = { save: null, sim: null, purge: Date.now() + PURGE_MS }
  }
  on() { return this.hub.fan.linked().length > 0 }
  clock() {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.hub.fan.tick()
      if (!this.on()) { clearInterval(this.timer); this.timer = null }
    }, TICK_MS)
  }
  // One alarm slot. Sets it to the earliest of what is due; never moves it later.
  async arm() {
    const { at } = plan(-Infinity, this.due, this.on())
    if (at == null) return
    const cur = await this.ctx.storage.getAlarm()
    if (cur === null || at < cur) await this.ctx.storage.setAlarm(at)
  }
  async save() { if (this.due.save == null) this.due.save = Date.now() + SAVE_MS; await this.arm() }
  async alarm() {
    const now = Date.now()
    const { run, next } = plan(now, this.due, this.on())
    if (run.sim) { this.hub.sim(now); run.save = true }
    if (run.purge) this.history.purge(now)
    if (run.save) this.hub.flush()
    this.due = next
    await this.arm()
  }

  assign(a) { return this.hub.assign(a) }
  left(ref) { this.hub.left(ref) }
  setLocked(on) { this.hub.setLocked(on) }
  async edit(actor, batch) { const r = this.hub.edit(actor, batch); await this.save(); return r }
  async link(room) {
    const wasOff = !this.on()
    const head = this.hub.link(room)
    this.clock()
    if (wasOff) {
      // Wake: one catch-up step (capped inside the sim), then the regular sim cadence.
      const now = Date.now()
      this.hub.sim(now)
      this.hub.flush()
      this.due.sim = now + SIM_MS
      await this.arm()
    }
    return head
  }
  unlink(room) { this.hub.unlink(room) }
  touch(room) { this.hub.touch(room) }
  chunk(cx, cz) { return this.hub.chunk(cx, cz) }
  since(s, n) { return this.hub.since(s, n) }
  worldClock() { return this.hub.clock() }
  // Master Control rollback: undo every edit of the last N minutes, through the world (numbered, saved, fanned out)
  async rollback(minutes) {
    const until = Date.now(), since = until - Math.max(1, Math.min(7 * 24 * 60, Number(minutes) || 5)) * 60 * 1000
    const r = this.hub.undo({ since, until })
    await this.save()
    return { ok: true, cells: Array.isArray(r) ? r.length : 0, minutes: Math.round((until - since) / 60000) }
  }
}
