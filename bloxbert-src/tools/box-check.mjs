import { emptyBox, putInSlots, BOX_SLOTS } from '../src/box.js'
import { mineMs } from '../src/feel.js'

let bad = 0
const ok = (c, m) => { if (!c) { bad++; console.error(m) } }
ok(emptyBox().length === 18, 'a box has 18 slots')
const first = putInSlots(emptyBox(), 'planks', 100)
ok(first.slots[0].n === 64 && first.slots[1].n === 36 && first.left === 0, 'a stack splits across slots')
const full = putInSlots(Array.from({ length: BOX_SLOTS }, () => ({ item: 'dirt', n: 64 })), 'stone', 1)
ok(full.left === 1, 'a full box gives the leftover back')
ok(mineMs('stone', true, false, 'hand') === 3000, 'stone by hand is 3 s')
ok(mineMs('stone', true, false, 'wood') === 1500, 'a wood tool halves stone')
ok(mineMs('stone', true, false, 'stone') === 1000, 'a stone tool breaks stone in 1 s')
if (bad) { console.error(bad + ' box problems'); process.exit(1) }
console.log('box-check ok')
