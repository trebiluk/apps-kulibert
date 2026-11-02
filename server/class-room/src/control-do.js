// The Control Durable Object (one, named 'main'): Master Control's staff switches, the live-room registry and the
// staff login counters. Holds ids, counts and flags only — never aliases, refs or addresses (see control.js).
import { DurableObject } from 'cloudflare:workers'
import { makeControl } from './control.js'

export class Control extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env)
    this.c = makeControl({ get: (k) => ctx.storage.get(k), put: (k, v) => ctx.storage.put(k, v) })
  }
  flags() { return this.c.flags() }
  setFlag(k, on) { return this.c.setFlag(k, on) }
  report(rid, s) { return this.c.report(rid, s) }
  state() { return this.c.state() }
  login(pass, hash, ip, secret, cfg) { return this.c.login(pass, hash, ip, secret, cfg) }
}
