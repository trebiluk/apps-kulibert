import { readFileSync } from 'fs'
import vm from 'vm'
import { mineMs } from '../src/feel.js'

const src = readFileSync(new URL('../../shared/kulibert-slots.js', import.meta.url), 'utf8')
vm.runInThisContext(src, { filename: 'kulibert-slots.js' })
const { emptyBox, putInSlots, BOX_SLOTS } = await import('../src/box.js')

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
const KS = globalThis.KulibertSlots
const bag = KS.createInventory({ id: 'bag', size: 4 })
const box = KS.createInventory({ id: 'box', size: 3 })
bag.slots[0] = { item: 'planks', n: 40 }
box.slots[0] = { item: 'planks', n: 30 }
ok(KS.move(bag, 0, box, 0).moved === 34 && box.slots[0].n === 64 && bag.slots[0].n === 6, 'merge stops at 64')
bag.slots[1] = { item: 'dirt', n: 3 }
box.slots[1] = { item: 'sand', n: 2 }
ok(KS.move(bag, 1, box, 1).swapped === true && box.slots[1].item === 'dirt' && bag.slots[1].item === 'sand', 'different items swap')
bag.slots[2] = { item: 'coal', n: 4 }
ok(KS.quickMove(bag, 2, [box]).moved === 4 && box.slots[0].item !== 'coal' && box.slots.find((s) => s && s.item === 'coal'), 'shift moves a whole stack into an empty slot')
const only = KS.createInventory({ id: 'fuel', size: 1, filter: (item) => item === 'coal' })
bag.slots[3] = { item: 'log', n: 1 }
only.slots[0] = { item: 'coal', n: 1 }
ok(KS.move(bag, 3, only, 0).moved === 0, 'a filter blocks a swap')
if (bad) { console.error(bad + ' box problems'); process.exit(1) }
console.log('box-check ok')
