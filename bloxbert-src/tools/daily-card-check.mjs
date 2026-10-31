import { cardModel, etDate, forcedDate, weekDays, doneDates, BUILT } from '../src/daily/card.js'
import { today } from '../src/daily/board.js'
import { EXTRA } from '../src/strings-extra.js'

const fail = []
function check(ok, msg) { if (!ok) fail.push(msg) }

// ET date, not host date: 2026-11-03 02:00 UTC is still 2026-11-02 in New York.
check(etDate(Date.UTC(2026, 10, 3, 2, 0)) === '2026-11-02', 'etDate uses America/New_York')
check(etDate(Date.UTC(2026, 10, 3, 6, 0)) === '2026-11-03', 'etDate rolls at ET midnight')

check(forcedDate('?dailyDate=2026-11-02') === '2026-11-02', 'forcedDate accepts a real date')
check(forcedDate('?dailyDate=2026-02-31') === null, 'forcedDate rejects 2026-02-31')
check(forcedDate('?dailyDate=banana') === null, 'forcedDate rejects junk')
check(forcedDate('') === null, 'forcedDate ignores no param')

// Monday and Thursday follow the picker. Find calm days (no Surprise) so the check is stable.
function calm(start, step) {
  for (let i = 0; i < 60; i++) {
    const [y, m, d] = start.split('-').map(Number)
    const u = new Date(Date.UTC(y, m - 1, d + i * step))
    const ymd = u.toISOString().slice(0, 10)
    if (!today(ymd).surprise) return ymd
  }
  return start
}
const mon = calm('2026-11-02', 7)
const thu = calm('2026-11-05', 7)
check(cardModel({ search: '?dailyDate=' + mon }).id === 'molten-chasm', 'Monday card is molten-chasm (' + mon + ')')
check(cardModel({ search: '?dailyDate=' + thu }).id === 'paperlab-fold', 'Thursday card is paperlab-fold (' + thu + ')')
check(cardModel({ dateET: '2026-11-07' }).weekend === true, 'Saturday is a weekend pick')

// Teacher config merges through boardConfig and is not hardcoded in the card.
check(cardModel({ dateET: mon, override: { mon: 'circuit-fix' } }).id === 'circuit-fix', 'teacher override changes Monday')
check(cardModel({ dateET: mon, override: { mon: 'nope' } }).id === 'molten-chasm', 'bad override keeps the default')
check(cardModel({ dateET: mon, override: { sweep: { need: 2, of: 5 } } }).need === 2, 'teacher sweep need shows')

// Nothing is built yet, so every card says coming soon.
check(Object.keys(BUILT).length === 0, 'no Daily is marked built')
check(cardModel({ dateET: mon }).built === false, 'unbuilt Daily is not playable')

// Sweep: Mon..Fri of the ET week, and only Daily ledger rows count.
check(weekDays('2026-11-04').join() === '2026-11-02,2026-11-03,2026-11-04,2026-11-05,2026-11-06', 'weekDays is Mon..Fri')
const at = (ymd, h) => Date.parse(ymd + 'T' + h + ':00Z')
const ledger = [
  { src: 'daily:holdit', at: at('2026-11-02', '15:00') },
  { src: 'daily', at: at('2026-11-02', '18:00') },
  { src: 'sale', at: at('2026-11-03', '15:00') },
  { src: 'daily:circuit', at: at('2026-11-05', '15:00') },
  { src: 'daily:old', at: at('2026-10-28', '15:00') },
]
check(doneDates(ledger, '2026-11-04').sort().join() === '2026-11-02,2026-11-05', 'doneDates counts Daily rows once per day, this week only')
check(doneDates(undefined, '2026-11-04').length === 0, 'no ledger shows 0')
const m = cardModel({ dateET: '2026-11-04', ledger })
check(m.count === 2 && m.days.filter((d) => d.done).length === 2, 'count matches the filled marks')

// Strings exist in every language.
const keys = Object.keys(EXTRA.en).filter((k) => /^(daily(Head|Surprise|Soon|Play|Sweep|Mark|Name|What)|wd[A-Z])/.test(k))
check(keys.length >= 24, 'daily strings present in en')
for (const lang of Object.keys(EXTRA)) for (const k of keys) check(!!EXTRA[lang][k], lang + ' missing ' + k)

if (fail.length) { console.error(fail.join('\n')); process.exit(1) }
console.log('daily card: ok')
