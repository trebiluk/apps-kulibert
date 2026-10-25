// Tests for the Phase 1+ building blocks: claims (plots), edit log (rollback), essentials (spawn/home/quick-chat/mute).
import test from 'node:test'
import assert from 'node:assert/strict'
import { makeClaims, regionAt, plotRect, policyFor, PLOT_COUNT, PLOT, LAYOUT } from '../src/claims.js'
import { makeEditLog } from '../src/editlog.js'
import { makeEssentials, validCommand, isAfk, COOLDOWN_MS } from '../src/essentials.js'
import { CONFIG_IDS } from '../src/protocol.js'

// ------------------------------------------------------------ claims

test('layout: core and commons are protected; plots are 32x32 and never overlap or touch the commons', () => {
  assert.equal(regionAt(0, 0).kind, 'core')
  assert.equal(regionAt(30, 0).kind, 'commons')
  assert.equal(regionAt(41, 0).kind, 'wild')
  const seen = new Set()
  for (let i = 0; i < PLOT_COUNT; i++) {
    const r = plotRect(i)
    assert.equal(r.x1 - r.x0 + 1, PLOT)
    assert.equal(r.z1 - r.z0 + 1, PLOT)
    assert.ok(r.x0 > LAYOUT.commonsHalf, 'plot ' + i + ' touches the commons')
    for (const [x, z] of [[r.x0, r.z0], [r.x1, r.z1], [r.x0, r.z1], [r.x1, r.z0]]) {
      const g = regionAt(x, z)
      assert.deepEqual(g, { kind: 'plot', plot: i }, 'corner of plot ' + i)
    }
    assert.ok(!seen.has(r.x0 + ',' + r.z0)); seen.add(r.x0 + ',' + r.z0)
    assert.equal(regionAt(r.x1 + 1, r.z0).kind, 'path')   // walkway between plots (or past the grid edge)
  }
})

test('policy: only the decided config (contest) allows kid edits; the other six fail closed', () => {
  for (const cfg of CONFIG_IDS) {
    const c = makeClaims(cfg)
    const plot = c.assign('kidref-0001')
    if (cfg === 'contest') { assert.equal(plot, 0); assert.ok(policyFor(cfg)) }
    else { assert.equal(plot, null); assert.equal(policyFor(cfg), null); assert.equal(c.canEdit({ ref: 'kidref-0001', staff: false }, { op: 'break', x: 60, y: 64, z: -100 }, 0).why, 'no-policy', cfg) }
  }
  assert.equal(policyFor('myrealm'), null)
  assert.equal(policyFor('__proto__'), null)
})

test('plots: a kid edits only their own plot; core, commons, paths, wild and other kids are refused', () => {
  const c = makeClaims('contest')
  const me = { ref: 'kidref-0001', staff: false }
  const you = { ref: 'kidref-0002', staff: false }
  assert.equal(c.assign(me.ref), 0)
  assert.equal(c.assign(you.ref), 1)
  assert.equal(c.assign(me.ref), 0, 'same kid, same plot')
  const mine = plotRect(0), yours = plotRect(1)
  const e = (x, z, op = 'break') => ({ op, x, y: 64, z, id: 5 })
  assert.equal(c.canEdit(me, e(mine.x0 + 3, mine.z0 + 3), 0).ok, true)
  assert.equal(c.canEdit(me, e(yours.x0 + 3, yours.z0 + 3), 0).why, 'not-yours')
  assert.equal(c.canEdit(me, e(0, 0), 0).why, 'protected')
  assert.equal(c.canEdit(me, e(30, 0), 0).why, 'protected')
  assert.equal(c.canEdit(me, e(mine.x1 + 1, mine.z0), 0).why, 'protected')   // the path
  assert.equal(c.canEdit(me, e(500, 500), 0).why, 'protected')               // wild is off for contest
  assert.equal(c.canEdit(me, { op: 'break', x: 1.5, y: 64, z: 1 }, 0).why, 'shape')
  assert.equal(c.canEdit(me, { op: 'melt', x: 1, y: 64, z: 1 }, 0).why, 'shape')
})

test('plots: a kid cannot grant themselves anything; buddy build is off for contest', () => {
  const c = makeClaims('contest')
  c.assign('kidref-0001'); c.assign('kidref-0002')
  assert.equal(c.setBuddy(0, 'kidref-0002', true), false)   // policy.buddies is false
  assert.equal(c.canEdit({ ref: 'kidref-0002', staff: false }, { op: 'break', x: plotRect(0).x0, y: 64, z: plotRect(0).z0 }, 0).why, 'not-yours')
})

test('plots: lock (judging) makes the plot read-only for its owner; staff still repair; lockEverything freezes all kids', () => {
  const c = makeClaims('contest')
  const me = { ref: 'kidref-0001', staff: false }
  c.assign(me.ref)
  const r = plotRect(0)
  const at = { op: 'break', x: r.x0 + 1, y: 64, z: r.z0 + 1 }
  assert.equal(c.canEdit(me, at, 0).ok, true)
  c.lock(0, true)
  assert.equal(c.canEdit(me, at, 1000).why, 'locked')
  assert.equal(c.canEdit({ ref: 'staffref-1', staff: true }, at, 1000).ok, true)
  c.lock(0, false)
  assert.equal(c.canEdit(me, at, 2000).ok, true)
  c.lockEverything(true)
  assert.equal(c.canEdit(me, at, 3000).why, 'locked')
})

test('plots: edit rate limit, and repeated attempts on others\' land earn a strike', () => {
  const c = makeClaims('contest')
  const me = { ref: 'kidref-0001', staff: false }
  c.assign(me.ref)
  const r = plotRect(0)
  let ok = 0
  for (let i = 0; i < 50; i++) if (c.canEdit(me, { op: 'break', x: r.x0 + 1, y: 64, z: r.z0 + 1 }, 0).ok) ok++
  assert.equal(ok, 8)   // editsPerSec burst
  const g = makeClaims('contest')
  g.assign('kidref-0001'); g.assign('kidref-0002')
  const theirs = plotRect(1)
  const res = []
  for (let i = 0; i < 9; i++) res.push(g.canEdit({ ref: 'kidref-0001', staff: false }, { op: 'break', x: theirs.x0, y: 64, z: theirs.z0 }, i * 100))
  assert.ok(res.slice(0, 7).every((x) => !x.strike), 'struck too early')
  assert.equal(res[7].strike, true)
})

test('plots: the same plot is never given to two kids; spares run out at 36; release frees it', () => {
  const c = makeClaims('contest')
  const got = new Set()
  for (let i = 0; i < PLOT_COUNT; i++) got.add(c.assign('kidref-' + String(1000 + i)))
  assert.equal(got.size, PLOT_COUNT)
  assert.equal(c.assign('kidref-9999'), null)
  c.release('kidref-1000')
  assert.equal(c.assign('kidref-9999'), 0)
})

// ------------------------------------------------------------ edit log

test('edit log: rollback by time, by kid, by plot; returns the oldest "before"; bounded', () => {
  const l = makeEditLog(100)
  l.record(1000, 1, 5, 64, 5, 0, 7)   // kid 1 places 7 over air
  l.record(2000, 1, 5, 64, 5, 7, 0)   // kid 1 breaks it
  l.record(3000, 1, 5, 64, 5, 0, 9)   // kid 1 places 9
  l.record(3500, 2, 6, 64, 5, 3, 0)   // kid 2 breaks a 3
  const undo = l.rollback({ since: 0, now: 4000, who: 1 })
  assert.deepEqual(undo, [{ x: 5, y: 64, z: 5, id: 0 }])   // back to air, the oldest before
  assert.equal(l.size(), 1)
  assert.deepEqual(l.rollback({ since: 5000, now: 6000 }), [])
  assert.deepEqual(l.rollback({ since: 0, now: 4000, rect: { x0: 100, z0: 100, x1: 110, z1: 110 } }), [])
  assert.deepEqual(l.rollback({ since: 0, now: 4000, rect: { x0: 0, z0: 0, x1: 10, z1: 10 } }), [{ x: 6, y: 64, z: 5, id: 3 }])
  const big = makeEditLog(100)
  for (let i = 0; i < 1000; i++) big.record(i, 1, i, 64, 0, 0, 1)
  assert.equal(big.size(), 100)
})

// ------------------------------------------------------------ essentials

const world = () => ({
  spawn: { x: 0, y: 64, z: 0 },
  warps: new Map([[1, { x: 100, y: 64, z: 100 }]]),
  qcIds: new Set([1, 2, 3]), emoteIds: new Set([1, 2]), announceIds: new Set([1]), kitIds: new Set([1]),
  players: new Map([[5, { ref: 'kidref-0005', pos: { x: 9, y: 64, z: 9 } }]]),
  find(id) { return this.players.get(id) || null },
  homeOk: () => true,
})
const kid = { id: 5, ref: 'kidref-0005', staff: false, pos: { x: 9, y: 64, z: 9 } }
const teacher = { id: 1, ref: 'staffref-0001', staff: true, pos: { x: 50, y: 64, z: 50 } }

test('commands: exact shapes only; there is no way to type text', () => {
  assert.equal(validCommand({ c: 'qc', i: 2 }), true)
  for (const bad of [null, [], {}, { c: 'say', m: 'hi' }, { c: 'qc' }, { c: 'qc', i: 'x' }, { c: 'qc', i: 1, m: 'hello' }, { c: 'qc', i: -1 }, { c: 'qc', i: 1.5 },
    { c: 'mute', id: 5, on: 2 }, { c: 'spawn', extra: 1 }, { c: '__proto__' }, { c: 'tpa', id: 5 }, { c: 'nick', n: 'Bob' }, { c: 'msg', id: 5, m: 'hi' }]) {
    assert.equal(validCommand(bad), false, JSON.stringify(bad))
  }
})

test('kid commands: spawn, home, quick-chat and emotes work; cooldowns apply', () => {
  const e = makeEssentials(world())
  assert.deepEqual(e.handle(kid, { c: 'spawn' }, 0).fx, [{ k: 'tp', id: 5, pos: { x: 0, y: 64, z: 0 } }])
  assert.equal(e.handle(kid, { c: 'spawn' }, 1000).why, 'cooldown')
  assert.equal(e.handle(kid, { c: 'spawn' }, COOLDOWN_MS.spawn + 1).ok, true)
  assert.equal(e.handle(kid, { c: 'home' }, 0).why, 'no-home')
  assert.equal(e.handle(kid, { c: 'sethome' }, 0).ok, true)
  assert.deepEqual(e.handle(kid, { c: 'home' }, 100).fx, [{ k: 'tp', id: 5, pos: { x: 9, y: 64, z: 9 } }])
  assert.deepEqual(e.handle(kid, { c: 'qc', i: 2 }, 0).fx, [{ k: 'qc', from: 5, i: 2 }])
  assert.equal(e.handle(kid, { c: 'qc', i: 2 }, 100).why, 'cooldown')
  assert.equal(e.handle(kid, { c: 'qc', i: 99 }, 5000).why, 'id')   // not on the list
  assert.equal(e.handle(kid, { c: 'emote', i: 2 }, 0).ok, true)
})

test('kid commands: one home only; a home outside allowed land is refused; no kid-to-kid teleport exists', () => {
  const w = world(); w.homeOk = (ref, p) => p.x < 100
  const e = makeEssentials(w)
  assert.equal(e.handle({ ...kid, pos: { x: 500, y: 64, z: 0 } }, { c: 'sethome' }, 0).why, 'not-here')
  e.handle(kid, { c: 'sethome' }, 0)
  e.handle({ ...kid, pos: { x: 20, y: 64, z: 20 } }, { c: 'sethome' }, 5000)
  assert.deepEqual(e.homeOf(kid.ref), { x: 20, y: 64, z: 20 })   // replaced, not added
  assert.equal(e.handle({ ...kid, pos: null }, { c: 'sethome' }, 9000).why, 'pos')
  for (const c of [{ c: 'tp', id: 1 }, { c: 'bring', id: 1 }, { c: 'tpa', id: 1 }, { c: 'warp', i: 1 }]) assert.notEqual(e.handle(kid, c, 99999).ok, true, JSON.stringify(c))
})

test('staff commands are refused for kids, with no side effects', () => {
  const e = makeEssentials(world())
  for (const c of [{ c: 'warp', i: 1 }, { c: 'tp', id: 5 }, { c: 'bring', id: 5 }, { c: 'spawnall' }, { c: 'mute', id: 5, on: 1 }, { c: 'muteall', on: 1 }, { c: 'announce', i: 1 }, { c: 'kit', id: 5, i: 1 }]) {
    assert.deepEqual(e.handle(kid, c, 0), { ok: false, why: 'role' }, c.c)
  }
  assert.equal(e.isMuted('kidref-0005'), false)
})

test('staff: warp, tp, bring, spawnall, announce and kit use ids from the config lists only', () => {
  const e = makeEssentials(world())
  assert.deepEqual(e.handle(teacher, { c: 'warp', i: 1 }, 0).fx, [{ k: 'tp', id: 1, pos: { x: 100, y: 64, z: 100 } }])
  assert.equal(e.handle(teacher, { c: 'warp', i: 7 }, 0).why, 'id')
  assert.deepEqual(e.handle(teacher, { c: 'tp', id: 5 }, 0).fx, [{ k: 'tp', id: 1, pos: { x: 9, y: 64, z: 9 } }])
  assert.deepEqual(e.handle(teacher, { c: 'bring', id: 5 }, 0).fx, [{ k: 'tp', id: 5, pos: { x: 50, y: 64, z: 50 } }])
  assert.equal(e.handle(teacher, { c: 'bring', id: 77 }, 0).why, 'target')
  assert.deepEqual(e.handle(teacher, { c: 'spawnall' }, 0).fx, [{ k: 'spawnall', pos: { x: 0, y: 64, z: 0 } }])
  assert.equal(e.handle(teacher, { c: 'announce', i: 1 }, 0).ok, true)
  assert.equal(e.handle(teacher, { c: 'announce', i: 2 }, 0).why, 'id')
  assert.equal(e.handle(teacher, { c: 'kit', id: 5, i: 1 }, 0).ok, true)
  assert.equal(e.handle(teacher, { c: 'kit', id: 5, i: 9 }, 0).why, 'id')
  for (let n = 0; n < 5; n++) assert.equal(e.handle(teacher, { c: 'warp', i: 1 }, 0).ok, true, 'staff have no cooldown')
})

test('mute: a muted kid\'s quick-chat and emotes are dropped quietly; muteall; unmute', () => {
  const e = makeEssentials(world())
  assert.equal(e.handle(teacher, { c: 'mute', id: 5, on: 1 }, 0).ok, true)
  assert.equal(e.isMuted('kidref-0005'), true)
  assert.deepEqual(e.handle(kid, { c: 'qc', i: 1 }, 0), { ok: true, fx: [] })   // looks like success to the kid, goes nowhere
  assert.deepEqual(e.handle(kid, { c: 'emote', i: 1 }, 0), { ok: true, fx: [] })
  e.handle(teacher, { c: 'mute', id: 5, on: 0 }, 0)
  assert.equal(e.handle(kid, { c: 'qc', i: 1 }, 9000).fx.length, 1)
  e.handle(teacher, { c: 'muteall', on: 1 }, 0)
  assert.deepEqual(e.handle(kid, { c: 'qc', i: 1 }, 20000).fx, [])
  e.handle(teacher, { c: 'muteall', on: 0 }, 0)
  assert.equal(e.handle(kid, { c: 'qc', i: 1 }, 30000).fx.length, 1)
})

test('AFK: after a minute with no input', () => {
  assert.equal(isAfk(0, 59000), false)
  assert.equal(isAfk(0, 61000), true)
})
