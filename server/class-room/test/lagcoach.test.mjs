import test from 'node:test'
import assert from 'node:assert/strict'
import { makeCoach, ALLOWED_ACTIONS } from '../src/lag/lagcoach.js'

const near = (by) => ({ total: Object.values(by).reduce((a, b) => a + b, 0), by })
const fast = Array(60).fill(16), slow = Array(60).fill(50)

test('a slow build is eased after 3 slow seconds, with a card; the build is never touched', () => {
  const co = makeCoach()
  const heavy = near({ light: 500, solid: 1 })
  const out = [1, 2, 3].map(() => co.sample(slow, heavy, '0,0'))
  assert.deepEqual(out.map((o) => o.tier), [0, 0, 2])
  const last = out[2]
  assert.equal(last.cause, 'build')
  assert.equal(last.card.cls, 'light')
  assert.ok(last.badge)
  assert.ok(last.actions.some((a) => a.a === 'tickRate' && a.cls === 'light' && a.f === 0.5))
  for (const a of last.actions) assert.ok(ALLOWED_ACTIONS.includes(a.a), a.a)
  assert.ok(!JSON.stringify(out).match(/delete|remove|replace|break|place/))
})

test('a slow device with a light build gets a quality step, no card, no blame', () => {
  const co = makeCoach()
  const o = [1, 2, 3].map(() => co.sample(slow, near({ light: 10 }), '0,0'))[2]
  assert.equal(o.cause, 'device')
  assert.equal(o.card, null)
  assert.deepEqual(o.actions, [{ a: 'quality', step: -1 }])
  assert.equal(o.badge, false)
})

test('very heavy builds go to tier 3; recovery steps down one tier per 10 ok seconds; no flapping', () => {
  const co = makeCoach()
  const huge = near({ circuit: 700, belt: 100 })
  for (let i = 0; i < 6; i++) co.sample(slow, huge, '1,1')
  assert.equal(co.tier(), 3)
  const t3 = co.sample(slow, huge, '1,1')
  assert.ok(t3.actions.some((a) => a.a === 'lod'))
  for (let i = 0; i < 9; i++) co.sample(fast, huge, '1,1')
  assert.equal(co.tier(), 3)                                  // 9 ok seconds is not enough
  co.sample(fast, huge, '1,1')
  assert.equal(co.tier(), 2)
  const flap = makeCoach()
  const tiers = []
  for (let i = 0; i < 40; i++) tiers.push(flap.sample(i % 3 === 2 ? fast : slow, huge, '2,2').tier)
  assert.equal(Math.max(...tiers), 0)                         // 2 slow + 1 ok never reaches 3 in a row
})

test('the card shows once per spot and kind; "keep it as is" keeps the easing but stops asking', () => {
  const co = makeCoach()
  const heavy = near({ belt: 600 })
  let cards = 0
  for (let i = 0; i < 30; i++) if (co.sample(slow, heavy, '0,0').card) cards++
  assert.equal(cards, 1)
  const c2 = makeCoach()
  c2.keep('5,5:belt')
  let n = 0, badge = false
  for (let i = 0; i < 10; i++) { const o = c2.sample(slow, near({ belt: 600 }), '5,5'); if (o.card) n++; badge = o.badge }
  assert.equal(n, 0)
  assert.equal(badge, true)
})
