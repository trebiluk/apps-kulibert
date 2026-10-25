// World -> rooms. The world keeps one cursor per linked room and pushes accepted ops in order.
// A push that is not acknowledged is simply sent again from the same cursor, so a flaky hop
// can delay a room but never skip or reorder an edit. The room side (makeInbox) drops repeats
// and reports a gap, which means "ask the clients to reload chunks".
export function makeFanout(world, send, { now = Date.now, deadMs = 30000, batch = 200 } = {}) {
  const rooms = new Map()
  let busy = false
  return {
    // A room that links starts at the head: its clients load chunks from the world (chunk().s).
    link(id, t = now()) { rooms.set(id, { cur: world.head(), seen: t }) },
    unlink: (id) => rooms.delete(id),
    touch(id, t = now()) { const r = rooms.get(id); if (r) r.seen = t },
    linked: () => [...rooms.keys()],

    // send(id, {from, ops} | {resync:true, head}) -> Promise<boolean> (true = room has it)
    async tick(t = now()) {
      if (busy) return
      busy = true
      try {
        await Promise.all([...rooms].map(async ([id, r]) => {
          if (t - r.seen > deadMs) { rooms.delete(id); return }
          const res = world.since(r.cur, batch)
          if (res.resync) { if (await send(id, { resync: true, head: res.head })) r.cur = res.head; return }
          if (!res.ops.length) return
          if (await send(id, { from: r.cur, ops: res.ops })) r.cur = res.ops[res.ops.length - 1].s
        }))
      } finally { busy = false }
    },
  }
}

// Room side. push(msg) -> { fresh:[ops to show], gap:boolean }
export function makeInbox(start = 0) {
  let last = start
  return {
    last: () => last,
    push(msg) {
      if (msg.resync) { last = msg.head; return { fresh: [], gap: true } }
      if (msg.from > last) return { fresh: [], gap: true }
      const fresh = msg.ops.filter((o) => o.s > last)
      if (fresh.length) last = fresh[fresh.length - 1].s
      return { fresh, gap: false }
    },
  }
}
