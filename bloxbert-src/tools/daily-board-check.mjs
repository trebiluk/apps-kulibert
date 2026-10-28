import { boardConfig } from '../src/daily/board-config.js'
import { seed, today, sweepDone } from '../src/daily/board.js'

const fail = []
function check(ok, msg) { if (!ok) fail.push(msg) }

const POOL = ['parkour-rush', 'circuit-fix', 'bertapult-distance']

function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + n))
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return dt.getUTCFullYear() + '-' + mm + '-' + dd
}

check(new Date(Date.UTC(2026, 10, 2)).getUTCDay() === 1, '2026-11-02 is Monday')
const mon = today('2026-11-02')
check(mon.weekend === false, 'Monday is not a weekend')
if (mon.surprise) check(POOL.includes(mon.id), 'Monday surprise stays in the weekend pool')
else check(mon.id === 'molten-chasm', 'Monday 2026-11-02 is molten-chasm, got ' + mon.id)

check(new Date(Date.UTC(2026, 10, 4)).getUTCDay() === 3, '2026-11-04 is Wednesday')
let wedPair = null
for (let i = 0; i < 40 && !wedPair; i++) {
  const a = addDays('2026-11-04', i * 7)
  const b = addDays(a, 7)
  const ta = today(a)
  const tb = today(b)
  if (!ta.surprise && !tb.surprise && !ta.weekend && !tb.weekend) wedPair = [a, ta, b, tb]
}
check(!!wedPair, 'found two calm Wednesdays a week apart')
if (wedPair) {
  const [, ta, , tb] = wedPair
  check(ta.id !== tb.id, 'Wednesday alternates across 2 weeks: ' + ta.id + ' vs ' + tb.id)
  check(
    (ta.id === 'bertapult-distance' || ta.id === 'bertapult-mark') &&
    (tb.id === 'bertapult-distance' || tb.id === 'bertapult-mark'),
    'Wednesday ids are the bertapult pair'
  )
}

const first = JSON.stringify(today('2026-11-02'))
let stable = true
for (let i = 0; i < 100; i++) {
  if (JSON.stringify(today('2026-11-02')) !== first) stable = false
}
check(stable, 'same date returns the same result 100 times')
const r1 = seed('bertopia', '2026-11-02')()
const r2 = seed('bertopia', '2026-11-02')()
check(r1 === r2, 'seed is stable for the same app and date')

let surprises = 0
let day = '2026-01-01'
for (let i = 0; i < 800; i++) {
  if (today(day).surprise) surprises++
  day = addDays(day, 1)
}
const rate = surprises / 800
check(rate >= 0.08 && rate <= 0.17, 'surprise rate over 800 days is ' + rate.toFixed(4))

let thu = '2026-11-05'
let thuHit = null
for (let i = 0; i < 40 && !thuHit; i++) {
  const t = today(thu)
  if (!t.surprise && !t.weekend) thuHit = thu
  else thu = addDays(thu, 7)
}
check(!!thuHit, 'found a calm Thursday')
if (thuHit) {
  check(today(thuHit).id === 'paperlab-fold', 'default Thursday is paperlab-fold')
  check(today(thuHit, { thu: 'parkour-rush' }).id === 'parkour-rush', 'override {thu:parkour-rush} works')
  check(today(thuHit, { thu: 'nope' }).id === 'paperlab-fold', 'bad Thursday id falls back')
  const bad = { thu: 4, surpriseOdds: 0, weekend: [], sweep: { need: 9, of: 2 }, extra: true }
  check(today(thuHit, bad).id === 'paperlab-fold', 'bad override values fall back')
  const cfg = boardConfig(bad)
  check(cfg.surpriseOdds === 8 && cfg.weekend.length === 3 && cfg.sweep.need === 3, 'bad fields keep defaults')
  check(!Object.prototype.hasOwnProperty.call(cfg, 'extra'), 'unknown key ignored')
}

const sealed = boardConfig()
sealed.weekend.push('molten-chasm')
sealed.mon = 'parkour-rush'
const fresh = boardConfig()
check(fresh.mon === 'molten-chasm' && fresh.weekend.length === 3 && fresh.weekend.indexOf('molten-chasm') < 0, 'defaults are not shared')

check(sweepDone(['2026-11-02', '2026-11-03']) === false, 'sweepDone is false at 2')
check(sweepDone(['2026-11-02', '2026-11-03', '2026-11-04']) === true, 'sweepDone is true at 3')
check(sweepDone(['2026-11-02', '2026-11-03', '2026-11-07', '2026-11-08']) === false, 'Saturday and Sunday do not count')
check(sweepDone(['2026-11-02', '2026-11-02', '2026-11-03']) === false, 'a repeated day counts once')

if (fail.length) {
  console.error(fail.join('\n'))
  process.exit(1)
}
console.log('daily board ok')
