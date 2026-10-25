// The World Durable Object: one per shared world. Methods below are called by Rooms and the Worker
// over RPC. Everything real lives in world/hub.js; this file only gives it storage, a push channel
// to the rooms, a fan-out clock and a save alarm. It never sees text, names or IPs.
import { DurableObject } from 'cloudflare:workers'
import { makeHub } from './world/hub.js'
import { sqlDb } from './world/sqldb.js'

const TICK_MS = 100
const SAVE_MS = 1500

export class World extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.hub = makeHub({
      db: sqlDb(ctx),
      send: async (room, msg) => {
        try { return (await env.ROOMS.get(env.ROOMS.idFromName(room)).deliver(msg)) === true } catch (e) { return false }
      },
    })
    this.timer = null
  }
  clock() {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.hub.fan.tick()
      if (!this.hub.fan.linked().length) { clearInterval(this.timer); this.timer = null }
    }, TICK_MS)
  }
  async save() { if ((await this.ctx.storage.getAlarm()) === null) await this.ctx.storage.setAlarm(Date.now() + SAVE_MS) }
  async alarm() { this.hub.flush() }

  assign(a) { return this.hub.assign(a) }
  left(ref) { this.hub.left(ref) }
  setLocked(on) { this.hub.setLocked(on) }
  async edit(actor, batch) { const r = this.hub.edit(actor, batch); await this.save(); return r }
  link(room) { const head = this.hub.link(room); this.clock(); return head }
  unlink(room) { this.hub.unlink(room) }
  touch(room) { this.hub.touch(room) }
  chunk(cx, cz) { return this.hub.chunk(cx, cz) }
  since(s, n) { return this.hub.since(s, n) }
}
