// Class simulations: whole classes on the real Room + World code, with chaos, checked against invariants.
//   node --import ./test/shim/register.mjs --test test/sim.scenarios.test.mjs
//   SIM_SEED=1234 ... replays one seed exactly (every scenario prints its seed).
// What every scenario checks at the end:
//   - convergence: every connected client's copy of every chunk it watches equals the World's
//   - the op stream each client got had no repeat and no hole outside a reload
//   - the World saved what it said it applied (a fresh World from the same db agrees)
import test from 'node:test'
import assert from 'node:assert/strict'
import { makeSim, classOf, settleIn, seedFromEnv } from './sim/harness.mjs'
import { locate } from '../src/world/chunks.js'
import { makeWorld } from '../src/world/world.js'
import { plotRect } from '../src/claims.js'

const STONE = 1, PLANKS = 10, GLASS = 20, BOX = 27, APPLE = 500

function invariants(sim, label) {
  const d = sim.diverged()
  assert.deepEqual(d.slice(0, 3), [], `${label}: a client's world differs from the server's (${sim.report()})`)
  assert.deepEqual(sim.streamFaults(), [], `${label}: repeated or missing ops (${sim.report()})`)
  sim.hub.flush()
  const fresh = makeWorld(sim.db, { gen: () => 0 })
  for (const c of sim.clients) for (const w of c.want) {
    const [cx, cz] = w.split(',').map(Number)
    assert.equal(fresh.chunk(cx, cz).d, sim.hub.chunk(cx, cz).d, `${label}: chunk ${w} saved = chunk ${w} live`)
  }
}

// each kid builds `n` blocks around its spot, `per` edits per 150 ms round, all kids interleaved
async function build(sim, kids, n, { y0 = 64, ids = [STONE, PLANKS] } = {}) {
  for (let i = 0; i < n; i++) {
    // the game sends its position all the time; a rebuilt Room learns where everyone stands from it
    if (i % 4 === 0) await Promise.all(kids.map((k) => { const s = sim.spot(k); return k.at(s.x, s.z) }))
    await Promise.all(kids.map((k) => { const s = sim.spot(k); return k.edit(s.x - 2 + (i % 5), y0 + Math.floor(i / 25), s.z + 1 + (Math.floor(i / 5) % 5), ids[i % ids.length]) }))
    await sim.settle(); sim.tick(150)
    await sim.hub.fan.tick(); await sim.settle()   // the World pushes accepted ops as it goes (alarm / after an edit)
    for (const k of kids) { k.pull(); await k.heal() }
  }
}

test('a class of 30 builds at once: 30 x 25 edits, every client converges, nothing repeated or lost', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(101) })
  const { kids } = await classOf(sim, 30)
  assert.ok(kids.every((k) => k.status === 101), 'all 30 seated')
  await settleIn(sim, kids)
  await build(sim, kids, 25)
  await sim.pump()
  assert.equal(sim.hub.world.head(), 30 * 25, 'every edit applied once (' + sim.report() + ')')
  assert.equal(kids.reduce((a, k) => a + k.nos.length, 0), 0, 'no refusals')
  invariants(sim, 'class of 30')
  console.log('# ' + sim.report())
})

test('two rooms (34 kids): edits in one room reach the other room, in order', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(202) })
  const { kids } = await classOf(sim, 34)
  assert.equal(sim.rooms.size, 2, 'the hub opened a second room after 30')
  // a kid from each room watches the other kid's chunk
  const a = kids[0], b = kids[33]
  assert.notEqual(a.rid, b.rid)
  await settleIn(sim, kids)
  const sa = sim.spot(a), sb = sim.spot(b)
  const ca = locate(sa.x, 64, sa.z), cb = locate(sb.x, 64, sb.z)
  await a.watch(cb.cx, cb.cz); await b.watch(ca.cx, ca.cz)
  await sim.settle(); sim.tick(500); a.pull(); b.pull()
  await build(sim, kids, 10)
  await sim.pump()
  assert.equal(sim.hub.world.head(), 340)
  invariants(sim, 'two rooms')
})

test('chaos: lost and repeated World->Room deliveries, random RPC order; every client still converges', async (t) => {
  for (const seed of [seedFromEnv(301), 302, 303]) {
    await t.test('seed ' + seed, async (t) => {
      const sim = await makeSim(t, { seed, latency: 8, dropDeliver: 0.3, dupDeliver: 0.3 })
      const { kids } = await classOf(sim, 12)
      await settleIn(sim, kids)
      await build(sim, kids, 20)
      await sim.pump(30)
      assert.ok(sim.stats.dropped > 0 && sim.stats.duplicated > 0, 'chaos happened: ' + sim.report())
      assert.equal(sim.hub.world.head(), 12 * 20)
      invariants(sim, 'chaos ' + seed)
      console.log('# ' + sim.report())
    })
  }
})

test('stale views: two players race for the same cells; the loser is refused stale, sees the winner, and nobody diverges', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(404), latency: 6 })
  const { teacher, kids } = await classOf(sim, 1)
  const k = kids[0]
  await settleIn(sim, [k, teacher])
  const s = sim.spot(k)
  await teacher.at(s.x, s.z)
  const { cx, cz } = locate(s.x, 64, s.z)
  await teacher.watch(cx, cz); await sim.settle(); sim.tick(300); teacher.pull()
  let stale = 0
  for (let i = 0; i < 30; i++) {
    const x = s.x - 2 + (i % 5), z = s.z + 2
    await Promise.all([k.edit(x, 65, z, k.sees(x, 65, z) ? 0 : STONE), teacher.edit(x, 65, z, teacher.sees(x, 65, z) ? 0 : PLANKS)])
    await sim.settle(); sim.tick(160); await sim.pump(3)
  }
  stale = [k, teacher].reduce((a, c) => a + c.nos.filter((n) => n.c === 'stale').length, 0)
  assert.equal(sim.hub.world.head() + stale, 60, `every race: exactly one applied (${sim.hub.world.head()}) and one stale (${stale})`)
  invariants(sim, 'races')
})

test('a Room object is evicted mid-build and rebuilt from its sockets: it relinks and nobody diverges', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(505) })
  const { kids } = await classOf(sim, 10)
  await settleIn(sim, kids)
  await build(sim, kids, 8)
  await sim.evictRoom(kids[0].rid)
  await build(sim, kids, 8, { y0: 66 })
  await sim.pump(20)
  assert.equal(sim.hub.world.head(), 160)
  invariants(sim, 'room evicted')
  console.log('# ' + sim.report())
})

// FINDING (2026-11-01, this suite): the hub keeps plot owners, the open flag, room seats and the fan-out links in memory
// only. If the World object restarts while Rooms keep their sockets, every edit is refused "closed" and no op reaches any
// room until each kid rejoins. Kept as a todo so it runs and reports without failing the suite; it turns green when fixed.
test('the World object restarts mid-build (deploy or crash): rooms keep getting edits and nobody diverges', { todo: 'World restart loses claims/open/seats/links (finding)' }, async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(606) })
  const { kids } = await classOf(sim, 10)
  await settleIn(sim, kids)
  await build(sim, kids, 8)
  await sim.pump()
  await sim.restartWorld()
  await build(sim, kids, 8, { y0: 66 })
  // rooms send a heartbeat every 10 s; give the system 15 s to notice
  for (let i = 0; i < 15; i++) { sim.tick(1000); await sim.settle(); await sim.pump(2) }
  assert.equal(sim.hub.world.head(), 160, 'edits after the restart were applied')
  const behind = kids.filter((k) => k.open && !k.seen.some((s) => s > 80))
  assert.deepEqual(behind.map((k) => k.ref), [], 'every kid heard the edits made after the World restarted (' + sim.report() + ')')
  invariants(sim, 'world restarted')
})

// FINDING 2 (2026-11-01, soak seed 12): when a Room object is rebuilt it relinks at the World's head, so ops the World
// accepted while the old object was going away never reach that room, and its clients are not told to reload (no rs).
// A client that checks op numbers sees the hole and reloads; one that does not keeps a stale view. Todo until fixed
// (for example: a Room broadcasts rs after it relinks).
test('a Room object is evicted while edits are in flight: its clients are told to reload, no silent hole', { todo: 'relink skips in-flight ops without rs (finding)' }, async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(555) })
  const { kids } = await classOf(sim, 6)
  await settleIn(sim, kids)
  await build(sim, kids, 4)
  // edits land in the World, but the room is evicted before they are pushed to it
  for (const k of kids) { const s = sim.spot(k); await k.edit(s.x, 67, s.z + 1, STONE) }
  await sim.settle()
  await sim.evictRoom(kids[0].rid)
  await build(sim, kids, 2, { y0: 66 })              // later edits arrive; the skipped ones never do
  await sim.pump()
  for (const k of kids) k.pull()
  assert.equal(kids.reduce((a, k) => a + k.gaps, 0), 0, 'no client saw a hole in the op stream (' + kids.map((k) => k.gaps).join(',') + ')')
})

test('reconnect: a kid drops mid-build and comes back with a new ticket; it reloads and converges', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(707) })
  const { kids } = await classOf(sim, 8)
  await settleIn(sim, kids)
  await build(sim, kids, 6)
  const gone = kids[3]
  await gone.room.webSocketClose(gone.sock, 1006)
  await sim.settle()
  await build(sim, kids.filter((k) => k !== gone), 6, { y0: 66 })
  const back = await sim.join(gone.ref)
  assert.equal(back.rid, gone.rid, 'the hub sent the kid back to the same room')
  await settleIn(sim, [back])
  await build(sim, kids.filter((k) => k !== gone).concat(back), 4, { y0: 67 })
  await sim.pump()
  invariants(sim, 'reconnect')
})

test('flood: every kid fires 40 edits in one burst; limits hold per kid, nobody else is slowed, all converge', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(808) })
  const { kids } = await classOf(sim, 10)
  await settleIn(sim, kids)
  await Promise.all(kids.flatMap((k) => { const s = sim.spot(k); return Array.from({ length: 40 }, (_, i) => k.send({ t: 'b', x: s.x - 2 + (i % 5), y: 64 + Math.floor(i / 25), z: s.z + 1 + (Math.floor(i / 5) % 5), id: STONE, b: 0 })) }))
  await sim.settle(80)
  await sim.pump()
  const per = kids.map((k) => { const s = sim.spot(k); let n = 0; for (let i = 0; i < 40; i++) if (sim.hub.world.cell(s.x - 2 + (i % 5), 64 + Math.floor(i / 25), s.z + 1 + (Math.floor(i / 5) % 5))) n++; return n })
  assert.ok(per.every((n) => n === per[0] && n > 0 && n <= 12), 'same share for every kid, within the limits: ' + per.join(','))
  assert.ok(kids.every((k) => k.open), 'a burst is dropped, not punished with a kick')
  // after a second, normal building works again for everyone
  sim.tick(1500)
  await build(sim, kids, 5, { y0: 66 })
  await sim.pump()
  assert.equal(sim.hub.world.head(), per.reduce((a, b) => a + b, 0) + 50)
  invariants(sim, 'flood')
})

test('grief rules under load: 9 kids try to edit one kid\'s plot while it builds; none land, the owner is not slowed', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(909) })
  const { kids } = await classOf(sim, 10)
  await settleIn(sim, kids)
  const owner = kids[0], s = sim.spot(owner)
  for (const k of kids.slice(1)) await k.at(s.x, s.z)
  await sim.settle()
  for (let i = 0; i < 15; i++) {
    await Promise.all([owner.edit(s.x - 2 + (i % 5), 64, s.z + 1 + Math.floor(i / 5), STONE), ...kids.slice(1).map((k) => k.edit(s.x - 2 + (i % 5), 66, s.z + 1, PLANKS))])
    await sim.settle(); sim.tick(160)
  }
  await sim.pump()
  assert.equal(sim.hub.world.head(), 15, 'only the owner\'s 15 edits landed')
  const codes = new Set(kids.slice(1).flatMap((k) => (k.pull(), k.nos.map((n) => n.c))))
  assert.ok(!codes.has('stale') && codes.size > 0, 'strangers were refused by the grief rules: ' + [...codes].join(','))
  invariants(sim, 'grief')
})

test('items (if this build has them): 10 kids share one box under chaos; items are conserved and every view agrees', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(1001), latency: 8, dropDeliver: 0.2, dupDeliver: 0.2 })
  if (!sim.hasItems) { t.skip('no items in this build'); return }
  const { kids } = await classOf(sim, 10)
  await settleIn(sim, kids)
  const owner = kids[0], s = sim.spot(owner), box = { x: s.x, y: 64, z: s.z + 2 }
  for (const k of kids) await k.at(s.x, s.z)
  await owner.edit(box.x, box.y, box.z, BOX); await sim.settle(); sim.tick(300)
  for (let round = 0; round < 20; round++) {
    await Promise.all(kids.map((k, i) => k.send(round % 2 ? { t: 'itake', ...box, id: APPLE + (i % 3), n: 1 + (i % 4) } : { t: 'iput', ...box, id: APPLE + (i % 3), n: 3 + (i % 5) })))
    await sim.settle(); sim.tick(160)
  }
  await sim.pump()
  for (const k of kids) k.pull()
  let put = 0, took = 0
  for (const k of kids) {
    // replies come back in the order the kid sent: even rounds put, odd rounds take
    let r = 0
    for (const m of k.sock.inbox.map((x) => JSON.parse(x))) {
      if (m.t === 'mv') { if (r % 2) took += m.moved; else put += m.moved; r++ }
      else if (m.t === 'no' && m.x === box.x && m.z === box.z) r++
    }
  }
  const inBox = sim.hub.inv(box.x, box.y, box.z).slots.reduce((a, q) => a + (q ? q.n : 0), 0)
  assert.equal(put - took, inBox, `put ${put} - took ${took} = in the box ${inBox} (${sim.report()})`)
  sim.hub.flush()
  assert.equal(makeWorld(sim.db, { gen: () => 0 }).inv(box.x, box.y, box.z).slots.reduce((a, q) => a + (q ? q.n : 0), 0), inBox, 'saved = live')
  invariants(sim, 'items')
})

test('self-check: the invariants catch a lost op, a repeated op and a wrong copy (so a green run means something)', async (t) => {
  const sim = await makeSim(t, { seed: seedFromEnv(1111) })
  const { kids } = await classOf(sim, 3)
  await settleIn(sim, kids)
  const room = sim.rooms.get(kids[0].rid)
  const real = room.deliver.bind(room)
  let n = 0
  // a broken room: it swallows the 3rd op it is given and sends the 5th twice
  room.deliver = async (msg) => {
    if (!msg.ops) return real(msg)
    const out = []
    for (const o of msg.ops) { n++; if (n !== 3) out.push(o); if (n === 5) out.push(o) }
    room.broadcast({ t: 'o', o: out.map((o) => [o.s, o.x, o.y, o.z, o.i]) })
    room.inbox && room.inbox.push(msg)
    return true
  }
  await build(sim, kids, 4)
  for (const k of kids) k.pull()
  const f = sim.streamFaults()
  assert.ok(f.some((x) => x.gaps) && f.some((x) => x.repeats), 'a hole and a repeat are reported: ' + JSON.stringify(f))
  // and a client whose copy is wrong is caught even when its stream looked fine
  room.deliver = real
  const k = kids[1]; const w = [...k.want][0]; const c = k.chunks.get(w)
  c.cells.set('0,64,0', 99); c.cells.set([...c.cells.keys()][0], 77)
  assert.ok(sim.diverged().some((d) => d.ref === k.ref), 'a corrupted client copy is reported')
})
