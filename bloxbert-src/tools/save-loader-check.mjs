// Unit check for fromDoc loader: mode, bag pad to 15, hot clamp.
import { fromDoc, emptyPlayer } from '../src/save.js'

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

// 1. creative with no player field reloads as creative
const creativeDoc = { v: 2, mode: 'creative' }
const loaded1 = fromDoc(creativeDoc)
assert(loaded1.player.mode === 'creative', 'creative mode lost')
assert(loaded1.player.bag.length === 15, 'bag not 15')
assert(loaded1.player.hot === 0, 'hot not 0')

// 2. 9-slot bag loads with 15; hot 20 clamps to 14
const shortBagDoc = { v: 2, player: { mode: 'survival', bag: Array(9).fill(null), hot: 20 } }
const loaded2 = fromDoc(shortBagDoc)
assert(loaded2.player.bag.length === 15, 'bag not padded to 15')
assert(loaded2.player.hot === 14, 'hot not clamped to 14')

// 3. normal survival unchanged
const normal = { v: 2, player: emptyPlayer('survival') }
const loaded3 = fromDoc(normal)
assert(loaded3.player.mode === 'survival', 'survival mode changed')
assert(loaded3.player.bag.length === 15, 'normal bag wrong')
assert(loaded3.player.hot === 0, 'normal hot wrong')

console.log('save-loader-check: PASS')
