import { createSession } from '../src/session.js'
import { createBag } from '../src/items.js'
import { createBasics } from '../src/basics.js'

globalThis.document = {
  getElementById() { return null },
  createElement() { return { className: '', style: {}, dataset: {}, classList: { add() {}, toggle() {}, remove() {} }, append() {}, setAttribute() {}, addEventListener() {}, querySelector: () => ({ textContent: '' }) } },
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

function node() {
  const n = { className: '', type: '', disabled: false, children: [], fn: null, style: {}, dataset: {} }
  n.classList = { add(c) { n.className += ' ' + c } }
  n.append = (ch) => { n.children.push(ch) }
  n.setAttribute = () => {}
  n.addEventListener = (ev, fn) => { n.fn = fn }
  n.querySelector = () => ({ textContent: '' })
  Object.defineProperty(n, 'innerHTML', { get() { return '' }, set() { n.children.length = 0 } })
  Object.defineProperty(n, 'lastChild', { get() { return n.children[n.children.length - 1] } })
  return n
}
document.createElement = () => node()
const boxToasts = []
const b = createSession({
  t: (k) => k,
  toast: (m) => boxToasts.push(m),
  getVoxel: () => 0,
  pos: () => [8, 5, 8],
  heading: () => 0,
  tableOn: () => false,
  markDirty() {},
  townKept: (x) => x === 4,
})
b.setMode('survival')
b.give('box', 1)
b.holdItem('box')
if (b.onPlace(4, 5, 4, 27) !== false || b.bag.count('box') !== 1) throw new Error('a box was placed in the shop')
if (b.onPlace(3, 5, 3, 27) !== true || b.bag.count('box') !== 0) throw new Error('a box did not place on the plot')
b.give('woodTool', 1)
b.holdItem('woodTool')
if (b.toolTier() !== 'wood') throw new Error('the wood tool was not in hand')
b.give('stone', 10)
b.holdItem('stone')
const g = node()
b.paintBox(g, '3,5,3')
if (g.children.length !== 19) throw new Error('the box did not show 18 slots, saw ' + g.children.length)
if (!String(g.children[0].className).includes('wide')) throw new Error('Put in does not span the row')
g.children[0].fn()
if (b.bag.count('stone') !== 0) throw new Error('Put in left the stone in the bag')
const stack = g.children.slice(1).find((c) => c.fn)
if (!stack) throw new Error('the stored stack had no button')
stack.fn()
if (b.bag.count('stone') !== 10) throw new Error('taking the stack did not return 10 stone')
for (let i = 0; i < 18; i++) {
  b.bag.take('dirt', b.bag.count('dirt'))
  b.give('dirt', 64)
  b.holdItem('dirt')
  const before = boxToasts.length
  g.children[0].fn()
  if (boxToasts.length !== before) throw new Error('slot ' + i + ' said the box was full')
  if (b.bag.count('dirt') !== 0) throw new Error('slot ' + i + ' left dirt in the bag')
}
const stone = b.bag.count('stone')
b.holdItem('stone')
g.children[0].fn()
if (!boxToasts.includes('boxFull') || b.bag.count('stone') !== stone) throw new Error('a full box did not keep the extra stone')
if (b.onBreak(3, 5, 3, 27) !== true) throw new Error('the box did not break')
const dirtOut = b.bag.count('dirt') + b.groundDrops().filter((d) => d.item === 'dirt').reduce((n, d) => n + d.n, 0)
if (dirtOut !== 18 * 64) throw new Error('breaking the box lost dirt, left ' + dirtOut)
if (!b.bag.count('box') && !b.groundDrops().some((d) => d.item === 'box')) throw new Error('breaking the box lost the box')

const wearToasts = []
const wear = createSession({
  t: (k) => k,
  toast: (m) => wearToasts.push(m),
  getVoxel: (x, y) => (y === 4 ? 1 : 0),
  pos: () => [8, 5, 8],
  heading: () => 0,
  tableOn: () => false,
  markDirty() {},
})
wear.setMode('survival')
wear.give('woodTool', 2)
if (wear.bag.slots.filter((s) => s && s.item === 'woodTool').length !== 2) throw new Error('wood tools stacked')
wear.holdItem('woodTool')
if (!wear.bag.slots[wear.hot] || wear.bag.slots[wear.hot].uses != null) throw new Error('a wood tool is tracking wear')
for (let i = 0; i < 80; i++) if (wear.onBreak(2, 3, 2, 2) !== true) throw new Error('a dirt break failed')
if (!wear.bag.slots[wear.hot] || wear.bag.slots[wear.hot].item !== 'woodTool' || wear.bag.count('woodTool') !== 2) throw new Error('the wood tool wore out')
if (wear.bag.count('stick')) throw new Error('a tool became a stick')
const worn = wear.dump()
const wornToasts = []
const worn2 = createSession({
  t: (k) => k, toast: (m) => wornToasts.push(m), getVoxel: () => 0, pos: () => [8, 5, 8], heading: () => 0, tableOn: () => false, markDirty() {},
})
worn2.load(worn)
worn2.holdItem('woodTool')
if (!worn2.bag.slots[worn2.hot] || worn2.bag.slots[worn2.hot].item !== 'woodTool' || worn2.bag.slots[worn2.hot].uses != null) throw new Error('reload brought wear back')
worn2.onBreak(2, 3, 2, 2)
if (worn2.bag.count('woodTool') !== 2) throw new Error('a break after reload lost a tool')
if (worn2.bag.count('stick') !== 0) throw new Error('a tool became a stick after reload')
if (wornToasts.includes('toolStick')) throw new Error('a wear toast fired')
wear.give('sapling', 1)
wear.holdItem('sapling')
if (wear.onPlace(3, 6, 3, 185) !== false || wear.bag.count('sapling') !== 1) throw new Error('a sapling planted off grass')
if (wear.onPlace(3, 5, 3, 185) !== true || wear.bag.count('sapling') !== 0) throw new Error('a sapling did not plant on grass')
let sapDrops = 0
for (let x = 0; x < 48; x++) {
  const before = wear.bag.count('sapling')
  wear.onBreak(x, 4, 9, 12)
  if (wear.bag.count('sapling') > before) sapDrops++
}
if (!sapDrops) throw new Error('leaves dropped no sapling')
const stoneToasts = []
const stoneTool = createSession({
  t: (k) => k, toast: (m) => stoneToasts.push(m), getVoxel: () => 0, pos: () => [8, 5, 8], heading: () => 0, tableOn: () => false, markDirty() {},
})
stoneTool.setMode('survival')
stoneTool.give('stoneTool', 1)
stoneTool.holdItem('stoneTool')
for (let i = 0; i < 150; i++) stoneTool.onBreak(1, 2, 8, 6)
if (stoneTool.bag.count('stoneTool') !== 1 || stoneTool.bag.count('stick') !== 0) throw new Error('a stone tool wore out')

const cells = new Map()
const ck = (x, y, z) => x + ',' + y + ',' + z
function worldApi(map) {
  return {
    now: () => 0, t: (k) => k, toast() {}, survival: () => true, teacher: () => false, give() {}, gift() {}, card() {}, badge() {}, flagDay() {},
    get: (x, y, z) => map.get(ck(x, y, z)) || 0,
    set: (x, y, z, id) => map.set(ck(x, y, z), id),
  }
}
const grow = createBasics(worldApi(cells))
grow.boot(true)
cells.set(ck(0, 5, 0), 1)
cells.set(ck(0, 6, 0), 185)
grow.saw(0, 6, 0, 185)
grow.clock(8 * 60 * 1000 - 1)
if (cells.get(ck(0, 6, 0)) !== 185) throw new Error('the sapling grew early')
grow.clock(1)
if (cells.get(ck(0, 6, 0)) !== 11 || cells.get(ck(0, 9, 0)) !== 11 || cells.get(ck(0, 10, 0)) !== 12 || cells.get(ck(2, 8, 0)) !== 12) throw new Error('the grown tree does not match a starter tree')
cells.set(ck(5, 6, 0), 185)
cells.set(ck(7, 7, 0), 3)
grow.saw(5, 6, 0, 185)
grow.clock(8 * 60 * 1000)
if (cells.get(ck(5, 6, 0)) !== 185) throw new Error('a blocked sapling grew')
cells.set(ck(7, 7, 0), 0)
grow.clock(0)
if (cells.get(ck(5, 6, 0)) !== 11) throw new Error('the sapling did not grow once the space was clear')
const mid = new Map()
mid.set(ck(10, 6, 0), 185)
const midApi = createBasics(worldApi(mid))
midApi.boot(true)
midApi.saw(10, 6, 0, 185)
midApi.clock(4 * 60 * 1000)
const savedGrow = midApi.dump()
const mid2 = new Map()
mid2.set(ck(10, 6, 0), 185)
const midLoad = createBasics(worldApi(mid2))
midLoad.load(savedGrow)
if (mid2.get(ck(10, 6, 0)) !== 185) throw new Error('reload grew the sapling too soon')
midLoad.clock(4 * 60 * 1000)
if (mid2.get(ck(10, 6, 0)) !== 11) throw new Error('reload lost the grow timer')

console.log('session-check ok', toasts.filter((t) => t === 'bagFull').length, 'full toasts')
process.exit(0)
