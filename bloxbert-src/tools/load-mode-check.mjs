// Brief 0057: a world reopens in the right mode, the bag is always 15 slots, the sync chip stays when sync is on.
import { fromDoc, fitPlayer, emptyPlayer } from '../src/save.js'
let fails = 0
const ok = (name, c, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? ' ' + d : '')) }

// 1) creative save with no player field reloads as creative
const a = fromDoc({ format: 'kuliblocks', v: 2, mode: 'creative', chunks: {} })
ok('no player + doc.mode creative -> creative', a.player.mode === 'creative', a.player.mode)
ok('and the bag is 15', a.player.bag.length === 15 && a.player.hot === 0)
const a2 = fromDoc({ format: 'kuliblocks', v: 2, chunks: {} })
ok('no player, no mode -> survival', a2.player.mode === 'survival')

// 2) 9-slot bag pads to 15; hot 20 clamps to 14; -3 clamps to 0; junk hot -> 0
const nine = Array.from({ length: 9 }, (_, i) => (i === 1 ? { item: 'berry', n: 2 } : null))
const b = fromDoc({ v: 2, player: { mode: 'creative', bag: nine, hot: 20, home: [1, 2, 3], table: false } })
ok('9-slot bag -> 15', b.player.bag.length === 15 && b.player.bag[1].item === 'berry' && b.player.bag[14] === null)
ok('hot 20 -> 14', b.player.hot === 14)
ok('mode kept creative', b.player.mode === 'creative')
ok('home and table kept', b.player.home[2] === 3 && b.player.table === false)
ok('hot -3 -> 0', fitPlayer({ bag: [], hot: -3 }).hot === 0)
ok('hot "x" -> 0', fitPlayer({ bag: [], hot: 'x' }).hot === 0)
ok('hot 7.9 -> 7', fitPlayer({ bag: [], hot: 7.9 }).hot === 7)
ok('longer bags left alone', fitPlayer({ bag: new Array(20).fill(null), hot: 0 }).bag.length === 20)
ok('input not mutated', (() => { const p = { mode: 'survival', bag: nine, hot: 20 }; fitPlayer(p); return p.bag.length === 9 && p.hot === 20 })())

// 3) normal survival save loads unchanged
const full = Array.from({ length: 15 }, (_, i) => (i < 3 ? { item: 'planks', n: 4 + i } : null))
const c = fromDoc({ v: 2, player: { mode: 'survival', bag: full, hot: 2, home: null, table: true }, econ: { cogs: 5 }, meta: { k: 1 }, lost: [], drops: [{ item: 'log', n: 1 }], bots: [] })
ok('survival unchanged', c.player.mode === 'survival' && c.player.hot === 2 && c.player.bag.length === 15 && c.player.bag[2].n === 6 && c.player.table === true && c.econ.cogs === 5 && c.drops.length === 1)
ok('v1 doc -> fresh survival player', fromDoc({ v: 1 }).player.mode === 'survival' && fromDoc({ v: 1 }).player.bag.length === 15)
ok('emptyPlayer default', emptyPlayer().mode === 'survival' && emptyPlayer('creative').mode === 'creative')

// 4) sync chip flag: ?sync=1 or the bt-sync sessionStorage key (same key as server-sync.js)
const src = await import('fs').then((fs) => fs.readFileSync(new URL('../src/save/sync-chip.js', import.meta.url), 'utf8'))
// 2.5.559 (#64): one sync flag module (save/sync-flag.js) that the chip and server-sync both import
const flagSrc = await import('fs').then((fs) => fs.readFileSync(new URL('../src/save/sync-flag.js', import.meta.url), 'utf8'))
ok('sync-chip reads bt-sync from sessionStorage', /from '\.\/sync-flag\.js'/.test(src) && /sessionStorage\.getItem\('bt-sync'\) === '1'/.test(flagSrc))
const srv = await import('fs').then((fs) => fs.readFileSync(new URL('../src/save/server-sync.js', import.meta.url), 'utf8'))
ok('server-sync persists the same key', /persistFlag/.test(srv) && /from '\.\/sync-flag\.js'/.test(srv) && /sessionStorage\.setItem\('bt-sync', '1'\)/.test(flagSrc))
// mountSyncChip in a fake browser: no query and no flag -> no chip; flag only -> chip mounted
let appended = 0
const fakeEl = () => ({ setAttribute() {}, append() {}, appendChild() {}, addEventListener() {}, querySelector: () => ({ textContent: '' }), style: {}, innerHTML: '' })
globalThis.location = { search: '' }
globalThis.sessionStorage = { store: {}, getItem(k) { return this.store[k] || null }, setItem(k, v) { this.store[k] = v } }
globalThis.document = { createElement: fakeEl, body: { appendChild() { appended++ } } }
globalThis.window = { addEventListener() {} }
const chip = await import('../src/save/sync-chip.js')
chip.mountSyncChip()
ok('no ?sync=1 and no flag -> chip not mounted', appended === 0)
sessionStorage.setItem('bt-sync', '1')
chip.mountSyncChip()
ok('bt-sync flag alone -> chip mounted', appended === 1)
console.log(fails ? 'load-mode: ' + fails + ' FAIL' : 'load-mode: all PASS')
process.exit(fails ? 1 : 0)
