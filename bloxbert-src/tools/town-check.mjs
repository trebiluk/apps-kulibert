import { STATIONS, plotInterior, keptCell, FLOOR } from '../src/town.js'

let bad = 0
const ok = (c, m) => { if (!c) { bad++; console.error(m) } }
const y = FLOOR + 1
for (const s of STATIONS) {
  ok(keptCell(s.x, y, s.z), s.id + ' is not protected')
  ok(!plotInterior(s.x, s.z), s.id + ' sits on a student plot')
}
ok(plotInterior(21, 7), 'plot middle is for students')
ok(!keptCell(21, y, 7), 'a student plot is locked')
ok(keptCell(8, FLOOR, 0), 'the road is open')
ok(keptCell(-10, FLOOR, 14), 'the pond is open')
ok(!keptCell(80, FLOOR, 80), 'the wild is locked')
if (bad) { console.error(bad + ' town problems'); process.exit(1) }
console.log('town-check ok ' + STATIONS.map((s) => s.id).join(' '))
