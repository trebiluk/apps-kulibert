import { createSession } from '../src/session.js'
import { createBag } from '../src/items.js'

globalThis.document = {
  getElementById() { return null },
  createElement() { return { className: '', style: {}, dataset: {}, classList: { add() {}, toggle() {} }, append() {}, setAttribute() {}, addEventListener() {}, querySelector: () => ({ textContent: '' }) } },
  documentElement: { dataset: {} },
}

const toasts = []
let pos = [8.5, 5, 1.5]
const s = createSession({
  t: (k) => k,
  toast: (m) => toasts.push(m),
  getVoxel: (x) => (x === 99 ? 1 : 0),
  pos: () => pos,
  heading: () => 0,
  tableOn: () => false,
  markDirty() {},
})
s.setMode('survival')

const packed = s.bag.add('stone', 15 * 64)
if (packed !== 0) throw new Error('bag did not fill, left ' + packed)
if (s.onBreak(20, 4, 20, 2) !== true) throw new Error('full bag refused the break')
const pile = s.groundDrops().find((d) => d.item === 'dirt')
if (!pile || pile.n !== 1) throw new Error('dirt did not fall')
if (s.bag.count('dirt')) throw new Error('dirt went into a full bag')
s.tickDrops(40)
if (s.bag.count('dirt')) throw new Error('picked up too soon')

pile.at = 0
pile.x = 7.5
pile.y = 4.4
pile.z = 1.5
s.tickDrops(40)
if (s.bag.count('dirt')) throw new Error('picked into a full bag')
s.bag.take('stone', 64)
s.tickDrops(40)
if (s.bag.count('dirt') !== 1) throw new Error('walk-up did not pick the drop')

if (s.onBreak(20, 4, 20, 24) !== false) throw new Error('counter broke')
if (s.bag.count('vend') || s.groundDrops().some((d) => d.item === 'vend')) throw new Error('counter paid an item')
if (s.onBreak(20, 4, 20, 26) !== false) throw new Error('bunk broke')

s.bag.take('stone', 5)
const held = s.bag.slots[s.hot] && s.bag.slots[s.hot].item
const before = s.bag.count(held)
s.dropHeld(false)
if (s.bag.count(held) !== before - 1) throw new Error('Q did not drop one of ' + held)
const loose = s.groundDrops().find((d) => d.item === held && d.at > 0)
if (!loose || loose.x === 99) throw new Error('drop spot')
if (loose.z < 1.5) throw new Error('drop should sit in front')

const doc = s.dump()
const s2 = createSession({
  t: (k) => k, toast() {}, getVoxel: () => 0, pos: () => pos, heading: () => 0, tableOn: () => false, markDirty() {},
})
s2.load(doc)
if (!s2.groundDrops().some((d) => d.item === held)) throw new Error('reload lost the drop')

if (s.tryBuy('woolBlue') !== false) throw new Error('bought wool before finding it')
s.give('flour', 1)
if (!s.known('flour')) throw new Error('flour was not marked found')
if (s.tryBuy('flour') !== true) throw new Error('found flour did not restock')
s.bag.take('stone', 64)
s.give('bread', 2)
const breadAt = s.bag.slots.findIndex((x) => x && x.item === 'bread')
if (breadAt < 0) throw new Error('bread had nowhere to go')
s.setHot(breadAt)
if (s.useHeld() !== 'bread' || s.bag.count('bread') !== 1) throw new Error('bread did not get eaten once')
if (s.pressHot(breadAt) !== 'bread' || s.bag.count('bread') !== 0) throw new Error('the same number key did not eat')
const flourAt = s.bag.slots.findIndex((x) => x && x.item === 'flour')
if (flourAt < 0 || flourAt > 8) throw new Error('flour was not on the hotbar')
const flourN = s.bag.count('flour')
s.pressHot(flourAt)
if (s.hot !== flourAt || s.bag.count('flour') !== flourN) throw new Error('choosing flour should not eat it')
s.pressHot(flourAt)
if (s.bag.count('flour') !== flourN) throw new Error('flour should not be eaten')
if (!s.selectOwned(3)) throw new Error('stone in the bag should be selectable')
s.bag.take('stone', s.bag.count('stone'))
if (s.selectOwned(3)) throw new Error('missing stone was selectable')
const old = createBag()
const extra = old.load(Array.from({ length: 36 }, () => ({ item: 'dirt', n: 1 })))
if (old.slots.filter(Boolean).length !== 15 || extra.length !== 21) throw new Error('old slots were not kept aside')
s.setHot(0)
s.bag.slots[0] = { item: 'stone', n: 64 }
s.bag.slots[10] = { item: 'stone', n: 3 }
if (!s.holdItem('stone', 10) || s.bag.slots[0].n !== 3 || s.bag.slots[10].n !== 64) throw new Error('Hold this took the hotbar stack instead of the pocket')
s.load({ player: { mode: 'survival', bag: Array.from({ length: 20 }, () => ({ item: 'dirt', n: 1 })), hot: 0 } })
if (s.bag.count('dirt') !== 15 || !toasts.includes('keptAside')) throw new Error('old stacks were not kept aside')
console.log('session-check ok', toasts.filter((t) => t === 'bagFull').length, 'full toasts')
process.exit(0)
