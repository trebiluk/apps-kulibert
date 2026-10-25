// Unit tests for the server-authority rules and the abuse ladder.
import test from 'node:test'
import assert from 'node:assert/strict'
import { checkMove, checkReach, checkBlockEdit, checkInventory, LIMITS } from '../src/rules.js'
import { makeLedger, STRIKES_TO_BAN, BAN_MS, MAX_BAN_MS, STRIKE_WINDOW_MS, logFailure, failureLog } from '../src/guard.js'

const at = (x, y, z) => ({ x, y, z })

test('moves: walking is fine, teleports and speed hacks are not', () => {
  assert.equal(checkMove(null, at(0, 64, 0), 0).ok, true)               // first frame
  assert.equal(checkMove(at(0, 64, 0), at(1, 64, 0), 200).ok, true)     // 5 blocks/s
  assert.equal(checkMove(at(0, 64, 0), at(5, 64, 0), 200).ok, true)     // sprint-ish plus slack
  assert.equal(checkMove(at(0, 64, 0), at(60, 64, 0), 200).why, 'speed')    // teleport
  assert.equal(checkMove(at(0, 64, 0), at(0, 64, 40), 1000).why, 'speed')
  assert.equal(checkMove(at(0, 64, 0), at(0, 90, 0), 200).why, 'speed')     // fly up
  assert.equal(checkMove(at(0, 64, 0), at(0, 40, 0), 200).ok, false)         // too far down in 0.2 s? (24 > 80*0.2+4 = 20)
  assert.equal(checkMove(at(0, 64, 0), at(0, 50, 0), 200).ok, true)          // a normal fall
  assert.equal(checkMove(at(0, 64, 0), at(0, LIMITS.yMax + 1, 0), 60000).why, 'bounds')
  assert.equal(checkMove(null, at(0, LIMITS.yMin - 1, 0), 0).why, 'bounds')
})

test('moves: waiting does not bank unlimited travel, and a burst of frames is not divided by zero', () => {
  assert.equal(checkMove(at(0, 64, 0), at(500, 64, 0), 3_600_000).why, 'speed')    // an hour of silence is capped at 2 s of travel
  assert.equal(checkMove(at(0, 64, 0), at(1, 64, 0), 0).ok, true)
  assert.equal(checkMove(at(0, 64, 0), at(50, 64, 0), 0).why, 'speed')
})

test('reach: only blocks close to the server-side position can be touched', () => {
  const me = at(10, 64, 10)
  assert.equal(checkReach(me, at(12, 64, 10)), true)
  assert.equal(checkReach(me, at(10, 63, 10)), true)
  assert.equal(checkReach(me, at(30, 64, 10)), false)
  assert.equal(checkReach(me, at(10, 90, 10)), false)
})

test('block edits: shape, bounds, known item, reach', () => {
  const me = at(0, 64, 0)
  const ids = new Set([1, 2, 3])
  assert.equal(checkBlockEdit({ op: 'place', x: 1, y: 64, z: 1, id: 2 }, me, ids).ok, true)
  assert.equal(checkBlockEdit({ op: 'break', x: 1, y: 64, z: 1 }, me, ids).ok, true)
  assert.equal(checkBlockEdit({ op: 'place', x: 1, y: 64, z: 1, id: 99 }, me, ids).why, 'item')
  assert.equal(checkBlockEdit({ op: 'place', x: 1.5, y: 64, z: 1, id: 2 }, me, ids).why, 'shape')
  assert.equal(checkBlockEdit({ op: 'nuke', x: 1, y: 64, z: 1 }, me, ids).why, 'shape')
  assert.equal(checkBlockEdit({ op: 'break', x: 1, y: 9999, z: 1 }, me, ids).why, 'bounds')
  assert.equal(checkBlockEdit({ op: 'break', x: 40, y: 64, z: 0 }, me, ids).why, 'reach')
  assert.equal(checkBlockEdit({ op: 'break', x: 1, y: 64, z: 1 }, null, ids).why, 'reach')
})

test('inventory: the server applies changes; the client only asks', () => {
  const ids = new Set([1, 2])
  const inv = new Map([[1, 10]])
  assert.equal(checkInventory(inv, { id: 1, delta: 5 }, ids).next.get(1), 15)
  assert.equal(checkInventory(inv, { id: 1, delta: -10 }, ids).next.has(1), false)
  assert.equal(checkInventory(inv, { id: 1, delta: -11 }, ids).why, 'missing')
  assert.equal(checkInventory(inv, { id: 1, delta: 60 }, ids).why, 'stack')
  assert.equal(checkInventory(inv, { id: 1, delta: 500 }, ids).why, 'amount')
  assert.equal(checkInventory(inv, { id: 9, delta: 1 }, ids).why, 'item')
  assert.equal(checkInventory(inv, { id: 1, delta: 0 }, ids).why, 'shape')
  assert.equal(checkInventory(inv, { id: 1, delta: 1.5 }, ids).why, 'shape')
  assert.equal(inv.get(1), 10, 'the original inventory was changed')
})

test('ledger: kick, then temp-ban after repeated strikes, longer each time, per kid only', () => {
  const l = makeLedger()
  let t = 1000
  assert.equal(l.strike('kidref-0001', t).action, 'kick')
  assert.equal(l.isBanned('kidref-0001', t), false)
  for (let i = 1; i < STRIKES_TO_BAN - 1; i++) l.strike('kidref-0001', ++t)
  const b = l.strike('kidref-0001', ++t)
  assert.equal(b.action, 'ban')
  assert.equal(l.isBanned('kidref-0001', t + 1), true)
  assert.equal(l.isBanned('kidref-0001', t + BAN_MS + 1), false)
  assert.equal(l.isBanned('kidref-0002', t), false, 'another kid was affected')
  // second ban is longer
  const t2 = t + BAN_MS + 10
  for (let i = 0; i < STRIKES_TO_BAN - 1; i++) l.strike('kidref-0001', t2 + i)
  const b2 = l.strike('kidref-0001', t2 + 5)
  assert.ok(b2.until - (t2 + 5) > BAN_MS)
  assert.ok(b2.until - (t2 + 5) <= MAX_BAN_MS)
})

test('ledger: old strikes expire; memory stays bounded', () => {
  const l = makeLedger()
  l.strike('kidref-0001', 0)
  l.strike('kidref-0001', 1)
  assert.equal(l.strike('kidref-0001', STRIKE_WINDOW_MS + 5).action, 'kick')   // the first two aged out
  for (let i = 0; i < 2000; i++) l.strike('kidref-' + String(10000 + i), i)
  assert.ok(l.size() <= 501)
})

test('failure log: code, alias and time only. No ref, IP, token or message text', () => {
  const seen = []
  const old = failureLog.sink
  failureLog.sink = (r) => seen.push(r)
  logFailure('Test Pup 01', 'replay', 5_000_000)
  logFailure(null, 'ticket-sig', 6_000_000)
  failureLog.sink = old
  assert.deepEqual(seen, [
    { ev: 'fail', code: 'replay', alias: 'Test Pup 01', ts: 5000 },
    { ev: 'fail', code: 'ticket-sig', alias: null, ts: 6000 },
  ])
})
