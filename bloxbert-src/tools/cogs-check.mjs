import { createWallet, readRow } from '../src/econ/wallet.js'
import { changeDown, dayCap } from '../src/econ/cogs.js'

const fail = []
function check(ok, msg) { if (!ok) fail.push(msg) }

function etMs(day, hm) {
  const want = Date.parse(day + 'T' + hm + ':00Z')
  let ms = want
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hourCycle: 'h23',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  for (let i = 0; i < 3; i++) {
    const parts = {}
    fmt.formatToParts(new Date(ms)).forEach(function (p) { if (p.type !== 'literal') parts[p.type] = p.value })
    const shown = Date.parse(parts.year + '-' + parts.month + '-' + parts.day + 'T' + parts.hour + ':' + parts.minute + ':' + parts.second + 'Z')
    ms += want - shown
  }
  return ms
}

const old = {
  start: 20, cogs: 35, seq: 2,
  ledger: [
    { tx: 's-1', at: 1, kind: 'start', cogs: 0, by: 'you' },
    { tx: 's-2', at: 2, kind: 'goal', cogs: 15, by: 'you' },
  ],
}
const wallet = createWallet({ start: 20, dial: 1, dailyCap: 20 })
wallet.load(old)
check(wallet.balance() === 35, 'old balance ' + wallet.balance())
check(wallet.balance('bronze') === 35, 'bronze balance')
check(wallet.balances().bronze === 35 && wallet.balances().silver === 0, 'balances')
const dumped = wallet.dump()
check(dumped.ledger[1].metal === undefined && dumped.ledger[1].src === undefined, 'rewrote old save')
check(readRow(dumped.ledger[1]).metal === 'bronze' && readRow(dumped.ledger[1]).src === 'legacy', 'legacy maps to bronze')
const earned = wallet.post({ kind: 'goal', cogs: 5, by: 'you' })
check(earned.metal === 'bronze' && earned.src === 'quest' && wallet.balance() === 40, 'earn stays bronze')

const up = changeDown('bronze', 'gold')
check(up.ok === false, '100 bronze cannot become gold')
const gold = changeDown('gold', 'silver')
check(gold.ok === true && gold.give === 10, '1 gold -> 10 silver')
const silver = changeDown('silver', 'bronze')
check(silver.ok === true && silver.give === 10, '1 silver -> 10 bronze')
check(changeDown('silver', 'gold').ok === false, 'no upward')
check(changeDown('platinum', 'gold').ok === false, 'platinum blocked')
check(changeDown('titanium', 'bronze').ok === false, 'titanium blocked')

const noon = etMs('2026-10-27', '12:00')
function spread(n, src) {
  const rows = []
  for (let i = 0; i < n; i++) {
    const hour = String(8 + Math.floor(i / 50)).padStart(2, '0')
    rows.push({ at: etMs('2026-10-27', hour + ':00'), cogs: 1, metal: 'bronze', src: src })
  }
  return rows
}
const dayRows = spread(150, 'quest')
const nextDay = etMs('2026-10-27', '11:00')
const overDay = dayCap(dayRows, nextDay, 'quest')
check(overDay.cogs === 0 && overDay.note === 'full-today', '151st bronze pays 0')
check(dayCap(spread(149, 'quest'), nextDay, 'quest').cogs === 1, '150th still pays')

const hourAt = etMs('2026-10-27', '15:10')
const hourRows = []
for (let i = 0; i < 60; i++) hourRows.push({ at: hourAt, cogs: 1, metal: 'bronze', src: 'quest' })
const overHour = dayCap(hourRows, hourAt + 1000, 'quest')
check(overHour.cogs === 0 && overHour.note === 'full-today', '61st in one hour pays 0')

const late = etMs('2026-10-27', '23:59')
const early = etMs('2026-10-28', '00:01')
const full = []
for (let i = 0; i < 150; i++) full.push({ at: late, cogs: 1, metal: 'bronze', src: 'quest' })
check(dayCap(full, late, 'quest').cogs === 0, 'full at 23:59 ET')
check(dayCap(full, early, 'quest').cogs === 1 && !dayCap(full, early, 'quest').note, 'caps reset at ET midnight')

const purse = []
for (let i = 0; i < 40; i++) purse.push({ at: noon, cogs: 1, metal: 'bronze', src: 'sale' })
check(dayCap(purse, noon, 'sale').cogs === 0, 'purse 40')
const runs = []
for (let i = 0; i < 30; i++) runs.push({ at: noon, cogs: 1, metal: 'bronze', src: 'run' })
check(dayCap(runs, noon, 'run').cogs === 0, 'runs 30')
const dailies = []
for (let i = 0; i < 60; i++) dailies.push({ at: noon, cogs: 1, metal: 'bronze', src: 'daily' })
check(dayCap(dailies, noon, 'daily').cogs === 0, 'dailies 60')

if (fail.length) {
  console.error(fail.join('\n'))
  process.exit(1)
}
console.log('cogs ok')
