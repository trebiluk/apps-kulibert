// 2.5.561 unstick check. Pure node, no browser, no engine.
//  1. basics.js: a tree does not grow into the player and a door does not auto-close on the player.
//  2. main.js: unstickPlayer() and playerIn(), taken straight from the source text, run against a fake world.
// node tools/unstick-check.mjs
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { createBasics } from '../src/basics.js'

const HERE = path.dirname(fileURLToPath(import.meta.url))
let fails = 0
function ok(cond, msg) {
  if (!cond) { fails++; console.log('FAIL', msg) } else console.log('ok  ', msg)
}

// ---------- 1. basics.js ----------
function makeBasics(playerIn) {
  const world = new Map()
  const k = (x, y, z) => x + ',' + y + ',' + z
  let clockNow = 0
  const calls = { settled: 0 }
  const api = {
    now: () => clockNow,
    t: (s) => s, toast: () => {},
    get: (x, y, z) => world.get(k(x, y, z)) || 0,
    set: (x, y, z, id) => { if (id) world.set(k(x, y, z), id); else world.delete(k(x, y, z)) },
    survival: () => false, teacher: () => false,
    give: () => {}, gift: () => {}, card: () => {}, badge: () => {}, flagDay: () => {}, changed: () => {},
    playerIn, settled: () => { calls.settled++ },
  }
  const b = createBasics(api)
  b.boot(false)
  return { b, api, world, calls }
}

{
  // trunk cell
  let here = [10, 5, 10]
  const t = makeBasics((x, y, z) => x === here[0] && y === here[1] && z === here[2])
  t.world.set('10,5,10', 185)
  t.b.saw(10, 5, 10, 185)
  t.b.clock(9 * 60 * 1000)
  ok(t.api.get(10, 5, 10) === 185, 'sapling stays a sapling while the player stands in its cell')
  ok(t.api.get(10, 8, 10) === 0, 'no trunk above the sapling while the player stands in it')
  ok(t.calls.settled === 0, 'nothing "settled" while growth is skipped')
  here = [50, 5, 50]
  t.b.clock(1000)
  ok(t.api.get(10, 5, 10) === 11 && t.api.get(10, 8, 10) === 11, 'tree grows on the next tick once the player has moved')
  ok(t.api.get(11, 8, 10) === 12, 'leaves grow too')
  ok(t.calls.settled === 1, 'main is told once after the tree grew')
}
{
  // a leaf cell, up in the air beside the trunk
  const t = makeBasics((x, y, z) => x === 11 && y === 9 && z === 10)
  t.world.set('10,5,10', 185)
  t.b.saw(10, 5, 10, 185)
  t.b.clock(9 * 60 * 1000)
  ok(t.api.get(10, 5, 10) === 185, 'sapling waits when the player stands where a leaf would grow')
}
{
  // no playerIn at all (tools, tests) still grows
  const t = makeBasics(undefined)
  t.world.set('10,5,10', 185)
  t.b.saw(10, 5, 10, 185)
  t.b.clock(9 * 60 * 1000)
  ok(t.api.get(10, 5, 10) === 11, 'without playerIn the tree grows as before')
}
{
  // slide door auto-closes after 3 seconds, unless the player stands in it
  let here = [20, 5, 20]
  const t = makeBasics((x, y, z) => x === here[0] && z === here[2] && (y === here[1] || y === here[1] + 1))
  t.world.set('20,5,20', 36)
  t.world.set('20,6,20', 56)
  ok(t.b.use(20, 5, 20) === true && t.api.get(20, 5, 20) === 37, 'slide door opens')
  t.b.clock(3500)
  ok(t.api.get(20, 5, 20) === 37 && t.api.get(20, 6, 20) === 57, 'door stays open while the player stands in the doorway')
  t.b.clock(3000)
  ok(t.api.get(20, 5, 20) === 37, 'and keeps waiting while they stay')
  here = [40, 5, 40]
  t.b.clock(500)
  ok(t.api.get(20, 5, 20) === 36 && t.api.get(20, 6, 20) === 56, 'door shuts once the doorway is clear')
  ok(t.calls.settled >= 1, 'main is told after the door shut')
}
{
  // the player's head is in the top half only
  const t = makeBasics((x, y, z) => x === 20 && y === 6 && z === 20)
  t.world.set('20,5,20', 36)
  t.world.set('20,6,20', 56)
  t.b.use(20, 5, 20)
  t.b.clock(3500)
  ok(t.api.get(20, 5, 20) === 37, 'door stays open when only the top half overlaps the player')
}

// ---------- 2. main.js helpers ----------
const mainSrc = readFileSync(path.join(HERE, '../src/main.js'), 'utf8')
const from = mainSrc.indexOf("// 2.5.561: the player's body against the voxel store")
const to = mainSrc.indexOf('function eyeBlocked() {')
if (from < 0 || to < 0 || to < from) { console.log('FAIL could not find the unstick block in main.js'); process.exit(1) }
const block = mainSrc.slice(from, to)

function fakeWorld(solidCells, opts = {}) {
  const solid = new Set(solidCells.map((c) => c.join(',')))
  const floor = opts.floor !== false
  const getVoxel = (x, y, z) => {
    if (floor && y === 0 && Math.abs(x) < 40 && Math.abs(z) < 40) return 3
    return solid.has(x + ',' + y + ',' + z) ? 3 : 0
  }
  const state = { pos: [0.5, 1, 0.5], vel: [9, -9, 9], resting: [true, true, true] }
  const body = { velocity: state.vel, resting: state.resting }
  const noa = {
    playerEntity: 1,
    entities: { getPosition: () => state.pos, setPosition: (e, p) => { state.pos = p.slice() } },
    ents: { getPositionData: () => ({ width: 0.6, height: 1.8 }), getPhysicsBody: () => body },
    registry: { getBlockSolidity: (id) => id === 3 },
  }
  const flags = { tableMode: false, seated: null, sleepBusy: false }
  const fn = new Function('noa', 'getVoxel', 'tableMode', 'seated', 'sleepBusy', block + '\nreturn { unstickPlayer, playerIn, bodyHitsSolid }')
  const api = fn(noa, getVoxel, opts.tableMode || false, opts.seated || null, opts.sleepBusy || false)
  return { api, state, body, flags }
}
const col = (x, z, y0, y1) => { const out = []; for (let y = y0; y <= y1; y++) out.push([x, y, z]); return out }
const ring = (y0, y1, r = 1) => { const out = []; for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) if (Math.max(Math.abs(dx), Math.abs(dz)) === r) for (let y = y0; y <= y1; y++) out.push([dx, y, dz]); return out }
const near = (a, b, e = 0.05) => Math.abs(a - b) < e

{
  const w = fakeWorld([])
  ok(w.api.unstickPlayer() === false && w.state.pos[1] === 1, 'standing on the floor is not stuck (feet exactly on the floor)')
  w.state.pos = [0.5, 0.9999, 0.5]
  ok(w.api.unstickPlayer() === false, 'standing a hair low is not stuck')
}
{
  const w = fakeWorld([[0, 1, 0]])
  ok(w.api.unstickPlayer() === true, 'block at the feet: moved')
  ok(near(w.state.pos[1], 2.02) && near(w.state.pos[0], 0.5) && near(w.state.pos[2], 0.5), 'block at the feet: up 1, same column (' + w.state.pos.map((n) => n.toFixed(2)).join(',') + ')')
  ok(w.body.velocity.every((v) => v === 0), 'velocity zeroed')
  ok(!w.api.bodyHitsSolid(w.state.pos[0], w.state.pos[1], w.state.pos[2], 0.6, 1.8), 'clear after the move')
}
{
  const w = fakeWorld([[0, 2, 0]])
  ok(w.api.unstickPlayer() === true && near(w.state.pos[1], 3.02), 'block at the waist: up 2, on top of it (' + w.state.pos[1].toFixed(2) + ')')
}
{
  const w = fakeWorld([[0, 3, 0]])
  ok(w.api.unstickPlayer() === false, 'a block just above the head (cell 3) is not an overlap')
}
{
  const w = fakeWorld(col(0, 0, 1, 3))
  ok(w.api.unstickPlayer() === true && near(w.state.pos[1], 4.02), 'three blocks in the column: up 3 (' + w.state.pos[1].toFixed(2) + ')')
}
{
  // low ceiling: up is no use, a neighbour with ground is
  const ceil = []
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) ceil.push([dx, 3, dz])
  const w = fakeWorld([[0, 1, 0], ...ceil])
  ok(w.api.unstickPlayer() === true, 'low ceiling: moved')
  const [x, y, z] = w.state.pos
  const d = Math.hypot(x - 0.5, z - 0.5)
  ok(near(y, 1.02) && d > 0.9 && d < 1.5, 'low ceiling: nearest neighbour at the same height (' + [x, y, z].map((n) => n.toFixed(2)).join(',') + ')')
  ok(!w.api.bodyHitsSolid(x, y, z, 0.6, 1.8), 'low ceiling: clear')
}
{
  // prefers an orthogonal neighbour over a diagonal one, and skips a blocked one
  const ceil = []
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) ceil.push([dx, 3, dz])
  const w = fakeWorld([[0, 1, 0], [1, 1, 0], [-1, 1, 0], [0, 1, 1], ...ceil])
  w.api.unstickPlayer()
  const [x, , z] = w.state.pos
  ok(near(x, 0.5) && near(z, -0.5), 'only the free orthogonal neighbour is chosen (' + x.toFixed(2) + ',' + z.toFixed(2) + ')')
}
{
  // the body straddles two columns and only the one beside the centre is blocked
  const w = fakeWorld([[1, 1, 0]])
  w.state.pos = [0.95, 1, 0.5]
  ok(w.api.unstickPlayer() === true && near(w.state.pos[1], 2.02) && near(w.state.pos[0], 0.95), 'straddling two columns: up 1 over the blocked one')
  ok(!w.api.bodyHitsSolid(w.state.pos[0], w.state.pos[1], w.state.pos[2], 0.6, 1.8), 'straddling: clear after the move')
}
{
  // a one-block-wide well
  const w = fakeWorld([[0, 1, 0], ...ring(1, 4)])
  ok(w.api.unstickPlayer() === true && near(w.state.pos[1], 2.02), 'well: up 1')
}
{
  // sealed in: block at the feet, ceiling, and walls two cells thick. Nothing to do, and no crash.
  const sealed = []
  for (let dx = -3; dx <= 3; dx++) for (let dy = 1; dy <= 12; dy++) for (let dz = -3; dz <= 3; dz++) sealed.push([dx, dy, dz])
  const w = fakeWorld(sealed)
  const before = w.state.pos.slice()
  ok(w.api.unstickPlayer() === false && w.state.pos.join() === before.join(), 'sealed in a solid cube: returns false and leaves the player alone')
}
{
  const w = fakeWorld([[0, 1, 0]], { seated: { x: 0, y: 1, z: 0 } })
  ok(w.api.unstickPlayer() === false && w.state.pos[1] === 1, 'seated on a chair: left alone')
  const t = fakeWorld([[0, 1, 0]], { tableMode: true })
  ok(t.api.unstickPlayer() === false, 'table mode: left alone')
  const s = fakeWorld([[0, 1, 0]], { sleepBusy: true })
  ok(s.api.unstickPlayer() === false, 'sleeping: left alone')
}
{
  const w = fakeWorld([])
  const pi = w.api.playerIn
  ok(pi(0, 1, 0) && pi(0, 2, 0), 'playerIn: feet cell and waist cell')
  ok(!pi(0, 3, 0), 'playerIn: not the cell above the head')
  ok(!pi(0, 0, 0), 'playerIn: not the floor under the feet')
  ok(!pi(1, 1, 0) && !pi(0, 1, 1) && !pi(-1, 1, 0), 'playerIn: not the next cells over')
  w.state.pos = [0.95, 1, 0.5]
  ok(pi(1, 1, 0), 'playerIn: a body 0.3 wide straddles two cells at x 0.95')
}
console.log(fails ? '\nunstick-check: ' + fails + ' FAILED' : '\nunstick-check: all passed')
process.exit(fails ? 1 : 0)
