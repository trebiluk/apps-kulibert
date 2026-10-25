import test from 'node:test'
import assert from 'node:assert/strict'
import { chunkCost, nearCost, dominant, CLASS_WEIGHT } from '../src/lag/lagcost.js'

const classOf = (id) => ({ 0: 'air', 1: 'solid', 2: 'light', 3: 'belt', 4: 'mystery' })[id] || 'solid'

test('cost: air is free, unknown ids are solid, classes add up, 3x3 sums, dominant ignores solid', () => {
  const c = chunkCost(new Map([[1, 0], [2, 1], [3, 2], [4, 2], [5, 3], [6, 4]]), classOf)
  assert.equal(c.by.light, 2 * CLASS_WEIGHT.light)
  assert.equal(c.by.belt, CLASS_WEIGHT.belt)
  assert.equal(c.by.solid, 2 * CLASS_WEIGHT.solid)           // id 1 and the unknown id 4
  assert.equal(c.by.air, undefined)
  assert.equal(nearCost(() => ({ total: 1, by: { light: 1 } }), 0, 0).total, 9)
  assert.equal(dominant({ solid: 99, belt: 2, light: 5 }), 'light')
  assert.equal(dominant({ solid: 99 }), null)
})
