import test from 'node:test'
import assert from 'node:assert/strict'
import { parseFrame2 } from '../src/world/protocol2.js'

test('frames: exact shapes; strings, floats, extra keys, bad cells are refused', () => {
  assert.equal(parseFrame2({ v: 0, t: 'b', x: 1, y: 64, z: 2, id: 5, b: 0 }).id, 5)
  assert.equal(parseFrame2({ v: 0, t: 'sync', s: 0 }).t, 'sync')
  assert.equal(parseFrame2({ v: 0, t: 'cget', cx: -1, cz: 3 }).cz, 3)
  const bad = [
    [{ v: 0, t: 'chat', m: 'x' }, 'type'], [{ v: 1, t: 'sync', s: 1 }, 'type'], [{ v: 0, t: 'sync' }, 'keys'],
    [{ v: 0, t: 'sync', s: 1, m: 'hi' }, 'keys'], [{ v: 0, t: 'sync', s: '1' }, 'val'], [{ v: 0, t: 'sync', s: -1 }, 'val'],
    [{ v: 0, t: 'b', x: 1.5, y: 64, z: 2, id: 5, b: 0 }, 'val'], [{ v: 0, t: 'b', x: 1, y: 9999, z: 2, id: 5, b: 0 }, 'cell'],
    [{ v: 0, t: 'b', x: 1, y: 64, z: 2, id: -5, b: 0 }, 'val'], [{ v: 0, t: '__proto__' }, 'type'], [null, 'type'],
  ]
  for (const [m, err] of bad) assert.deepEqual(parseFrame2(m), { err }, JSON.stringify(m))
})
