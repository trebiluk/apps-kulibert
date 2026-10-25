import test from 'node:test'
import assert from 'node:assert/strict'
import { TIPS } from '../src/lag/lagtips.js'
import { EN } from '../src/lag/en.js'

test('every tip string exists in English and is short; nothing unused', () => {
  const used = new Set(['lag.keep', 'lag.title', 'lag.badge'])
  for (const t of Object.values(TIPS)) { used.add(t.why); used.add(t.keep); for (const o of t.options) used.add(o.id) }
  for (const id of used) assert.ok(EN[id], 'missing ' + id)
  for (const id of Object.keys(EN)) assert.ok(used.has(id), 'unused ' + id)
  for (const [k, v] of Object.entries(EN)) assert.ok(v.length <= 100, k)
})
