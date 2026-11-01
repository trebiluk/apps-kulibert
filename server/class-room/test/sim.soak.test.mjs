// Random soak: a class does random things for a while under chaos; the invariants are checked every 25 steps.
//   node --import ./test/shim/register.mjs --test test/sim.soak.test.mjs
// Longer runs (not in npm test):
//   SOAK_SEEDS=1-200 SOAK_STEPS=600 SOAK_KIDS=30 [SOAK_EVICT=1] node --import ./test/shim/register.mjs --test test/sim.soak.test.mjs
// A failure prints its seed and step; SOAK_SEEDS=<that seed> replays it exactly.
import test from 'node:test'
import assert from 'node:assert/strict'
import { makeSim, classOf, settleIn, rng } from './sim/harness.mjs'
import { locate } from '../src/world/chunks.js'
import { makeWorld } from '../src/world/world.js'

const BLOCKS = [1, 2, 3, 10, 11, 15]
const BOX = 27, APPLE = 500

function seeds() {
  const s = process.env.SOAK_SEEDS || '11,12,13'
  return s.split(',').flatMap((part) => { const [a, b] = part.split('-').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a] })
}
const STEPS = Number(process.env.SOAK_STEPS || 150)
const KIDS = Number(process.env.SOAK_KIDS || 12)
const EVICT = process.env.SOAK_EVICT === '1'

for (const seed of seeds()) {
  test(`soak seed ${seed}: ${KIDS} kids, ${STEPS} random steps, chaos on`, async (t) => {
    const r = rng(seed * 7919)
    const sim = await makeSim(t, { seed, latency: 6, dropDeliver: 0.15, dupDeliver: 0.15 })
    const { teacher, kids } = await classOf(sim, KIDS)
    await settleIn(sim, kids)
    await settleIn(sim, [teacher])
    const where = (c) => { const k = kids.find((x) => x.ref === c.ref) || c; return sim.spot(k) }
    // one shared box in kid 0's plot, if this build has items
    let box = null, moved = { put: 0, took: 0 }
    if (sim.hasItems) {
      const s = sim.spot(kids[0]); box = { x: s.x + 2, y: 64, z: s.z - 2 }
      await kids[0].edit(box.x, box.y, box.z, BOX); await sim.settle(); sim.tick(300); await sim.pump(3)
    }
    const fail = (step, msg) => assert.fail(`seed ${seed} step ${step}: ${msg} | ${sim.report()}`)
    let rejoins = 0, evictions = 0

    for (let step = 1; step <= STEPS; step++) {
      for (let i = 0; i < kids.length; i++) {
        const k = kids[i]
        if (!k.open) continue
        const s = where(k)
        const roll = r.next()
        if (roll < 0.55) {                                   // build or break near the spot, from what this kid sees
          const x = s.x - 2 + r.int(5), y = 64 + r.int(3), z = s.z + 1 + r.int(3)
          const seen = k.sees(x, y, z)
          await k.edit(x, y, z, seen ? 0 : r.pick(BLOCKS))
        } else if (roll < 0.75) {
          await k.at(s.x + r.int(2), s.z)                     // shuffle about
        } else if (roll < 0.80 && box) {                      // use the shared box
          for (const c of [k]) await c.at(sim.spot(kids[0]).x, sim.spot(kids[0]).z)
          if (r.chance(0.5)) await k.send({ t: 'iput', ...box, id: APPLE + r.int(3), n: 1 + r.int(6) })
          else await k.send({ t: 'itake', ...box, id: APPLE + r.int(3), n: 1 + r.int(6) })
        } else if (roll < 0.81) {                             // look at a neighbour's chunk too
          const other = r.pick(kids); const os = where(other); const { cx, cz } = locate(os.x, 64, os.z)
          await k.watch(cx, cz)
        } else if (roll < 0.812) {                            // wifi drops; comes back a bit later with a new ticket
          await k.room.webSocketClose(k.sock, 1006)
          k.backAt = step + 1 + r.int(5)
        }
      }
      // returning kids
      for (let i = 0; i < kids.length; i++) {
        const k = kids[i]
        if (k.open || !k.backAt || k.backAt > step) continue
        const back = await sim.join(k.ref)
        if (back.err || !back.sock) fail(step, 'a returning kid could not rejoin: ' + (back.err || back.status))
        kids[i] = back; rejoins++
        await settleIn(sim, [back])
        for (const w of k.want) back.want.add(w)
      }
      if (r.chance(0.3)) { const s = where(r.pick(kids)); await teacher.at(s.x, s.z); await teacher.edit(s.x, 67, s.z + 2, teacher.sees(s.x, 67, s.z + 2) ? 0 : 9) }   // grief repair
      // Room evictions are off by default: they hit FINDING 2 (see sim.scenarios). SOAK_EVICT=1 turns them on.
      if (EVICT && r.chance(0.004)) { await sim.evictRoom(r.pick([...sim.rooms.keys()])); evictions++ }
      await sim.settle()
      sim.tick(170)
      await sim.hub.fan.tick(); await sim.settle()
      for (const c of sim.clients) { c.pull(); await c.heal() }

      if (step % 25 === 0 || step === STEPS) {
        await sim.pump(30)
        const d = sim.diverged()
        if (d.length) fail(step, 'diverged ' + JSON.stringify(d.slice(0, 2)))
        const f = sim.streamFaults({ allowEvictionGaps: true })
        if (f.length) fail(step, 'stream faults ' + JSON.stringify(f.slice(0, 2)))
        if (box) {
          const live = sim.hub.inv(box.x, box.y, box.z)
          if (!live.error) {
            const n = live.slots.reduce((a, q) => a + (q ? q.n : 0), 0)
            if (n < 0 || n > 18 * 64) fail(step, 'box count out of range ' + n)
          }
        }
        sim.hub.flush()
        const fresh = makeWorld(sim.db, { gen: () => 0 })
        if (fresh.head() !== sim.hub.world.head()) fail(step, `saved head ${fresh.head()} != live head ${sim.hub.world.head()}`)
      }
    }
    console.log(`# soak ${seed}: head ${sim.hub.world.head()} | rejoins ${rejoins} | room evictions ${evictions} | clients with a hole after a Room eviction ${sim.evictionGaps()} | refusals ${sim.clients.reduce((a, c) => a + c.nos.length, 0)} | ${sim.report()}`)
  })
}
