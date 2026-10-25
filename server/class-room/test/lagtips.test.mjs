import test from 'node:test'
import assert from 'node:assert/strict'
import { TIPS, tipFor } from '../src/lag/lagtips.js'

test('tips: every kind has a why, 3+ ways, both look-keeping and look-changing, a best per goal, and keep', () => {
  for (const cls of Object.keys(TIPS)) {
    const t = tipFor(cls)
    assert.ok(t.why.startsWith('lag.' + cls + '.'), cls)
    assert.ok(t.options.length >= 3, cls)
    assert.ok(t.options.some((o) => o.look === 'same') && t.options.some((o) => o.look === 'changes'), cls)
    for (const o of t.options) { assert.ok(['small', 'medium', 'big'].includes(o.gain)); assert.ok(['low', 'medium', 'high'].includes(o.effort)) }
    const ids = t.options.map((o) => o.id)
    for (const goal of ['look', 'speed', 'effort']) assert.ok(ids.includes(t.best[goal]), cls + ' best ' + goal)
    assert.equal(new Set(Object.values(t.best)).size >= 2, true, cls + ': one option cannot be best for everything')
    assert.equal(t.keep, 'lag.keep')
  }
  assert.equal(tipFor('nope'), null)
  assert.equal(tipFor('__proto__'), null)
})
