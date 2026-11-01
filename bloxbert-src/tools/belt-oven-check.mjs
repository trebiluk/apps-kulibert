// Brief 0066: belts feed ovens (fuel + input), oven -> belt -> box still works, the hint names the oven loop,
// one meta write per touched tile per tick, and belt items survive a dump/adopt round trip.
import { createStations } from '../src/stations.js'
import { createBelts } from '../src/conveyor.js'
import { EXTRA } from '../src/strings-extra.js'
let fails = 0
const ok = (name, c, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? ' ' + d : '')) }

// fake world: one oven at 0,5,10 facing S (front = 0,5,9), box at 0,5,-2, belts in between and before the oven
const OVEN = '0,5,10'
const stations = createStations({ touch() {}, name: (k) => k, have: () => 0, spend: () => false, give() {} })
let now = 1000
const realNow = Date.now
Date.now = () => now
const meta = new Map()
let writes = 0
const box = { slots: Array.from({ length: 18 }, () => null) }
const belts = createBelts({
  t: (k) => k,
  metaGet: (k) => meta.get(k),
  metaSet: (k, v) => { writes++; meta.set(k, v) },
  metaDelete: (k) => meta.delete(k),
  metaEntries: () => [...meta.entries()],
  machine: (x, y, z) => (x === 0 && y === 5 && z === 10 ? 'oven' : x === 0 && y === 5 && z === -2 ? 'box' : ''),
  machineFace: () => 'S',
  anchors: () => [{ x: 0, y: 5, z: 0 }],
  pullOven: () => stations.pullOut(OVEN) || '',
  pushOven: (x, y, z, item) => stations.pushIn(OVEN, item),
  ovenCounts: () => stations.slotCounts(OVEN),
  pushBox: (x, y, z, item) => { const i = box.slots.findIndex((s) => !s); if (i < 0) return false; box.slots[i] = { item, n: 1 }; return true },
  pullBox: () => '',
  boxCounts: () => ({ inn: 0, outn: box.slots.filter(Boolean).length }),
  hintDone: () => { hintDone = true },
  mark() {},
})
let hintDone = false
const A = [{ x: 0, y: 5, z: 0 }]

// line A feeds the oven from the south: tiles z=12..11 face N? Oven faces S, so its BACK is N (z=11): input belt must be at the back.
// isInputBelt: next cell of the belt is the machine and the belt sits at the machine's back. Oven at z=10 facing S -> back is z=11.
belts.commit(0, 5, 13, 'S'); belts.commit(0, 5, 12, 'S'); belts.commit(0, 5, 11, 'S')
// line B takes from the oven front (z=9) to the box at z=-2
for (let z = 9; z >= -1; z--) belts.commit(0, 5, z, 'S')
belts.adopt()
ok('hint names the oven loop (en)', EXTRA.en.beltHint === 'Belt the Oven to the Box', EXTRA.en.beltHint)
ok('hint in 8 languages, none still says smelter', ['uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti'].every((l) => EXTRA[l].beltHint && !/плавил|fundidora|مصهر|کوره گداز|isaturire|መፍለሒ/i.test(EXTRA[l].beltHint)))

// put a log, then 2 sand on the input line's tail and run ticks
function drop(item) { const tail = meta.get('0,5,13'); meta.set('0,5,13', { ...tail, item, n: 1 }); belts.adopt() }
drop('log')
for (let i = 0; i < 4; i++) belts.tick(A)
let v = stations.view(OVEN)
ok('belted log became oven fuel', v.fuel === 4 && v.left === 4, JSON.stringify({ fuel: v.fuel, left: v.left }))
ok('no stuck Full after the oven took it', belts.stats().full.length === 0, JSON.stringify(belts.stats().full))
drop('sand'); for (let i = 0; i < 4; i++) belts.tick(A)
ok('one sand waits (glass needs 2)', stations.slotCounts(OVEN).inn === 1 && !stations.view(OVEN).ring, JSON.stringify(stations.slotCounts(OVEN)))
drop('sand'); for (let i = 0; i < 4; i++) belts.tick(A)
v = stations.view(OVEN)
ok('second sand starts a glass bake', v.input[0] === 'sand' && v.ring >= 0, JSON.stringify(v))
now += 6000; stations.tick()
ok('bake finished: glass in output', stations.view(OVEN).output[0] === 'glass')
for (let i = 0; i < 14; i++) belts.tick(A)
ok('oven -> belt -> box: glass reached the box', box.slots.some((s) => s && s.item === 'glass'), JSON.stringify(box.slots.filter(Boolean)))
ok('belt hint finished on oven -> box', hintDone)
// oven refuses what it cannot bake: belt shows Full honestly, then clears when it can
drop('stone'); for (let i = 0; i < 4; i++) belts.tick(A)
ok('stone cannot go in: line marked Full', belts.stats().full.length === 1)
// clear the head tile by hand (as a kid breaking it) and confirm the Full flag drops
const head = meta.get('0,5,11'); meta.set('0,5,11', { ...head, item: '', n: 0 }); belts.adopt(); belts.tick(A)
ok('Full clears once the item is gone', belts.stats().full.length === 0)
// fuel kinds: coal on top of logs refused while logs remain, 64 cap
ok('second fuel kind refused while first remains', stations.pushIn(OVEN, 'coal') === false)
let n = 0; while (stations.pushIn(OVEN, 'log')) n++
ok('fuel slot caps at 64 items', n === 63 && stations.pushIn(OVEN, 'log') === false, 'added ' + n)

// write batching: a 64-tile line moving one item does at most one write per touched tile per tick
const meta2 = new Map(); let w2 = 0
const long = createBelts({ metaGet: (k) => meta2.get(k), metaSet: (k, v) => { w2++; meta2.set(k, v) }, metaEntries: () => [...meta2.entries()], machine: () => '', anchors: () => [{ x: 0, y: 5, z: 0 }], mark() {} })
for (let x = 0; x < 64; x++) long.commit(x, 5, 0, 'E')
long.adopt()
ok('64-tile line builds as one line', long.stats().lines === 1 && long.stats().tiles === 64)
for (let x = 0; x < 8; x += 2) { const t = meta2.get(x + ',5,0'); meta2.set(x + ',5,0', { ...t, item: 'log', n: 1 }) }
long.adopt(); w2 = 0; long.tick(A)
ok('4 items hop once: at most 8 tile writes (was up to 8 as well, but never twice for one tile)', w2 <= 8, 'writes ' + w2)
// a tile that both gives and takes in one tick is written once
const meta3 = new Map(); let w3 = 0; const seen3 = []
const chain = createBelts({ metaGet: (k) => meta3.get(k), metaSet: (k, v) => { w3++; seen3.push(k); meta3.set(k, v) }, metaEntries: () => [...meta3.entries()], machine: () => '', anchors: () => [{ x: 0, y: 5, z: 0 }], mark() {} })
for (let x = 0; x < 4; x++) chain.commit(x, 5, 0, 'E')
chain.adopt()
for (let x = 0; x < 3; x++) { const t = meta3.get(x + ',5,0'); meta3.set(x + ',5,0', { ...t, item: 'log', n: 1 }) }
chain.adopt(); w3 = 0; seen3.length = 0; chain.tick(A)
ok('3 items in a row: 4 writes, each tile once (was 6)', w3 === 4 && new Set(seen3).size === 4, 'writes ' + w3 + ' ' + seen3.join(' '))
ok('items moved one hop', meta3.get('3,5,0').item === 'log' && !meta3.get('0,5,0').n)
// save round trip: dump meta, adopt into a fresh belt set, items still there
const copy = new Map([...meta3.entries()].map(([k, v]) => [k, JSON.parse(JSON.stringify(v))]))
const again = createBelts({ metaGet: (k) => copy.get(k), metaSet: (k, v) => copy.set(k, v), metaEntries: () => [...copy.entries()], machine: () => '', anchors: () => [], mark() {} })
again.adopt()
ok('reload keeps belt items', again.stats().tiles === 4 && again.stats().sample.filter((t) => t.n).length === 3)
Date.now = realNow

// Panel: belt slot shows the waiting icon and count, then "belt: empty" once a bake takes the sand.
class FakeNode {
  constructor(tag) {
    this.tagName = tag
    this.className = ''
    this.children = []
    this.attrs = {}
    this.dataset = {}
    this.hidden = false
    this._text = ''
    this._html = ''
  }
  get textContent() { return this._text }
  set textContent(v) { this._text = String(v ?? '') }
  get innerHTML() { return this._html }
  set innerHTML(v) { this._html = String(v ?? ''); if (!this._html) this.children = [] }
  setAttribute(k, v) { this.attrs[k] = String(v) }
  getAttribute(k) { return this.attrs[k] }
  append(...nodes) { for (const n of nodes) if (n) this.children.push(n) }
  replaceChildren(...nodes) { this.children = nodes.filter(Boolean); this._html = '' }
  querySelector(sel) {
    const walk = (n) => {
      if (!n || !n.children) return null
      for (const c of n.children) {
        const classes = String(c.className || '').split(/\s+/)
        if (sel.startsWith('.') && !sel.includes(' ') && classes.includes(sel.slice(1))) return c
        const hit = walk(c)
        if (hit) return hit
      }
      return null
    }
    return walk(this)
  }
  get classList() {
    const self = this
    return { add(...xs) { const set = new Set(String(self.className || '').split(/\s+/).filter(Boolean)); xs.forEach((x) => set.add(x)); self.className = [...set].join(' ') }, remove() {}, toggle() {} }
  }
}
globalThis.document = { createElement: (tag) => new FakeNode(tag) }
globalThis.window = {
  KulibertSlots: {
    ui: {
      machinePanel(el) {
        const inputs = document.createElement('div')
        inputs.className = 'ks-inputs'
        el.append(inputs)
        return { destroy() {}, update() {} }
      },
    },
  },
}
const panelApi = createStations({
  t: (key) => EXTRA.en[key] || key,
  name: (item) => item,
  icon(item) {
    const n = document.createElement('span')
    n.dataset.block = '1'
    n.dataset.item = item
    return n
  },
  have: () => 0,
  spend: () => false,
  give() {},
  touch() {},
})
const host = document.createElement('div')
panelApi.paint(host, '2,5,2', 'oven')
const slot = host.querySelector('.belt-fed')
const lab = () => slot && slot.querySelector('.belt-fed-lab')
const art = () => slot && slot.querySelector('.belt-fed-art')
const count = () => slot && slot.querySelector('.belt-fed-count')
ok('empty belt slot says belt: empty', !!(lab() && lab().textContent === 'belt: empty'))
ok('empty belt slot has an icon', !!(art() && art().innerHTML.includes('<svg')))
ok('belt words in 8 languages', ['uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti', 'simple'].every((l) => EXTRA[l] && EXTRA[l].beltFrom && EXTRA[l].beltEmpty))
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
panelApi.pushIn('2,5,2', 'log')
panelApi.pushIn('2,5,2', 'sand')
wait(300).then(() => {
  ok('one sand shows icon, count, from belt', lab().textContent === 'from belt' && count().textContent === '1' && art().children[0] && art().children[0].dataset.item === 'sand', (lab() && lab().textContent) + ' ' + (count() && count().textContent))
  panelApi.pushIn('2,5,2', 'sand')
  return wait(300)
}).then(() => {
  ok('count drops to belt: empty once the bake starts', lab().textContent === 'belt: empty' && art().innerHTML.includes('<svg'), lab() && lab().textContent)
  if (host._ksDestroy) host._ksDestroy()
  console.log(fails ? 'belt-oven: ' + fails + ' FAIL' : 'belt-oven: all PASS')
  process.exit(fails ? 1 : 0)
}).catch((err) => {
  if (host._ksDestroy) host._ksDestroy()
  console.log('FAIL belt panel ' + err)
  process.exit(1)
})
