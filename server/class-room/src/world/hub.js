// One shared world, all rooms. The hub is the single place that decides who may join, who may edit
// and what gets saved. A Durable Object (World) is a thin shell around this; tests drive it directly.
// All methods are synchronous, so no two rooms can interleave a read and a write.
import { makeWorld } from './world.js'
import { makeFanout } from './fanout.js'
import { makeAlloc } from './alloc.js'
import { undoPlan, applyUndo } from './undo.js'
import { buildAllowed } from './savemeta.js'
import { makeClaims } from '../claims.js'

const h32 = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0 }

export function makeHub({ db, send, gen, now = Date.now }) {
  const world = makeWorld(db, { gen })
  const fan = makeFanout(world, send, { now })
  let alloc = null, claims = null
  let cfg = db.getMeta('cfg'), test = db.getMeta('test') === '1'
  let open = false, locked = false

  return {
    world, fan,
    // a = { world, ref, grp, role, bld, cfg } -> { room, plot } | { err: 'closed'|'build'|'config'|'full' }
    assign(a) {
      const staff = a.role === 'teacher' || a.role === 'admin'
      if (!cfg) {
        if (!staff) return { err: 'closed' }
        cfg = a.cfg; test = a.bld === 't'
        db.commit({ meta: { cfg, test: test ? '1' : '0' } })
      }
      if (a.cfg !== cfg) return { err: 'config' }
      if (!buildAllowed(test, a.bld)) return { err: 'build' }
      if (staff) { if (!locked) open = true } else if (!open) return { err: 'closed' }
      alloc ||= makeAlloc(a.world)
      claims ||= makeClaims(cfg)
      const room = alloc.assign(a.ref, a.grp) ?? (staff ? alloc.idOf(0) : null)
      if (!room) return { err: 'full' }
      return { room, plot: staff ? null : claims.assign(a.ref) }
    },
    left: (ref) => alloc && alloc.leave(ref),
    setLocked(on) { locked = !!on; open = !locked },

    // actor = { ref, staff }; batch = [{x,y,z,id,b}] -> one result per edit, in order
    edit(actor, batch, t = now()) {
      const who = h32(actor.ref)
      const ok = [], out = batch.map((e) => {
        const c = claims ? claims.canEdit(actor, { op: e && e.id === 0 ? 'break' : 'place', x: e && e.x, y: e && e.y, z: e && e.z, id: e && e.id }, t) : { ok: false, why: 'closed' }
        if (c.ok) ok.push(e)
        return c.ok ? null : c
      })
      const res = world.apply(ok, who, t, { staff: !!actor.staff })
      let i = 0
      return out.map((c) => c || res[i++])
    },
    undo: (sel) => applyUndo(world, undoPlan(world.log(), sel)),
    link: (id) => { fan.link(id); return world.head() },
    unlink: (id) => fan.unlink(id),
    touch: (id) => fan.touch(id),
    chunk: (cx, cz) => world.chunk(cx, cz),
    since: (s, n) => world.since(s, n),
    flush: () => world.flush(),
    sim: (t = now()) => world.sim(t),
    clock: () => world.clock(),
    simAt: () => world.simAt(),
    budget: (ref, x, z) => world.budgetAt(h32(ref), x, z),
    who: h32,
  }
}
