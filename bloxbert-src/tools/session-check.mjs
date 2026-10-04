import { createSession } from '../src/session.js'

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

const packed = s.bag.add('stone', 36 * 64)
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
console.log('session-check ok', toasts.filter((t) => t === 'bagFull').length, 'full toasts')
process.exit(0)
