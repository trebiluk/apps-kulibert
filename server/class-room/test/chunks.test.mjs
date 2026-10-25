import test from 'node:test'
import assert from 'node:assert/strict'
import { locate, cellAt, encodeChunk, decodeChunk, FMT } from '../src/world/chunks.js'

test('cells round-trip through locate/cellAt, negatives included', () => {
  for (const [x, y, z] of [[0, 0, 0], [-1, -128, -1], [15, 511, 16], [-17, 64, 33], [99999, 5, -99999]]) {
    const { cx, cz, idx } = locate(x, y, z)
    assert.deepEqual(cellAt(cx, cz, idx), { x, y, z })
  }
})

test('chunk format: old/odd saves load as empty, newer and corrupt are locked, nothing renamed', () => {
  assert.equal(decodeChunk(null).edits.size, 0)
  assert.equal(decodeChunk('{}').edits.size, 0)
  assert.equal(decodeChunk('{"f":1}').edits.size, 0)
  assert.equal(decodeChunk('{"f":1,"e":[[5,7],["x",1],[3]]}').edits.get(5), 7)
  assert.equal(decodeChunk('{"f":99,"e":[]}').error, 'newer')
  assert.equal(decodeChunk('nope').error, 'corrupt')
  assert.deepEqual(JSON.parse(encodeChunk(new Map([[1, 2]]))), { f: FMT, e: [[1, 2]] })
})
