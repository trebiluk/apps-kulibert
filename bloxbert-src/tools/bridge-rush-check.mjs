// Bridge Rush proto rules: capacity, cart run, stars, records.
import { capacityAt, runCart, stars, better, insertRecord, blocksCost, GAP, BUDGET } from '../src/minigames/bridge-rules.js'
let fails = 0
const ok = (name, c, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? ' ' + d : '')) }
const fill = (k, n = GAP) => Array.from({ length: GAP }, (_, i) => (i < n ? k : ''))
ok('gap is 12, budget 40', GAP === 12 && BUDGET === 40)
ok('full wood span holds (middle cap 4 >= 3)', runCart(fill('wood')).distance === 12 && capacityAt(fill('wood'), 5) === 4)
ok('3-block wood stub breaks at its end', JSON.stringify(runCart(fill('wood', 3))) === '{"distance":2,"broke":2}', JSON.stringify(runCart(fill('wood', 3))))
ok('one wood block anchored in the cliff holds (short lever), cart falls off its end', JSON.stringify(runCart(fill('wood', 1))) === '{"distance":1,"broke":-1}')
ok('3-block steel stub holds, cart falls off the end', JSON.stringify(runCart(fill('steel', 3))) === '{"distance":3,"broke":-1}')
ok('empty gap: distance 0', runCart(fill('')).distance === 0)
const mixed = fill('wood'); mixed[6] = 'steel'
ok('mixed span crosses', runCart(mixed).distance === 12)
const hole = fill('wood'); hole[7] = ''
ok('a hole at 7: cell 6 is a cantilever and breaks', runCart(hole).broke === 6, JSON.stringify(runCart(hole)))
ok('cost: wood 1, steel 2', blocksCost(fill('wood')) === 12 && blocksCost(fill('steel')) === 24 && blocksCost(mixed) === 13)
ok('stars: full wood = 2 (under 20 blocks), full steel = 1, short = 0', stars(12, 12) === 2 && stars(12, 24) === 1 && stars(11, 5) === 0)
ok('better: longer wins, then fewer blocks', better({ distance: 12, blocks: 20 }, { distance: 11, blocks: 5 }) && better({ distance: 12, blocks: 12 }, { distance: 12, blocks: 20 }) && !better({ distance: 12, blocks: 20 }, { distance: 12, blocks: 12 }))
const recs = insertRecord(insertRecord(insertRecord(insertRecord([], { alias: 'a', distance: 5, blocks: 5 }), { alias: 'b', distance: 12, blocks: 24 }), { alias: 'c', distance: 12, blocks: 12 }), { alias: 'd', distance: 9, blocks: 9 })
ok('records: top 3 sorted', recs.length === 3 && recs.map((r) => r.alias).join('') === 'cbd', recs.map((r) => r.alias).join(''))
const same = insertRecord(insertRecord([], { alias: 'k', distance: 12, blocks: 12 }), { alias: 'k', distance: 12, blocks: 20 })
ok('one row per alias, worse run does not replace', same.length === 1 && same[0].blocks === 12)
ok('better run replaces the row', insertRecord(same, { alias: 'k', distance: 12, blocks: 10 })[0].blocks === 10)
console.log(fails ? 'bridge-rush: ' + fails + ' FAIL' : 'bridge-rush: all PASS')
process.exit(fails ? 1 : 0)
