// Brief 0056: saveSoon coalesces, never loops, and reports failure once.
import { createSaveSoon } from '../src/save/save-soon.js'
let t = 0
const timers = []
const clock = { now: () => t, setTimeout: (fn, ms) => { const h = { at: t + ms, fn }; timers.push(h); return h } }
async function tick(ms) { // advance the fake clock, firing timers in order, draining microtasks between
  const end = t + ms
  for (;;) {
    timers.sort((a, b) => a.at - b.at)
    const nx = timers[0]
    if (!nx || nx.at > end) break
    t = nx.at; timers.shift(); nx.fn()
    for (let i = 0; i < 10; i++) await Promise.resolve()
  }
  t = end
  for (let i = 0; i < 10; i++) await Promise.resolve()
}
let fails = 0
const ok = (name, c, d) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + name + (d ? ' ' + d : '')) }

// 1) ten changes in 300 ms -> one save
{
  let runs = 0; const log = []
  const s = createSaveSoon({ ...clock, run: async () => { runs++; return 100 }, onStart: () => log.push('start'), onDone: () => log.push('done') })
  s.note(); await tick(10)
  ok('first change saves at once', runs === 1, 'runs ' + runs)
  for (let i = 0; i < 10; i++) { s.note(); await tick(30) }
  ok('fast follow-up changes wait for the gap', runs === 1, 'runs ' + runs)
  await tick(2500)
  ok('then one save for all of them', runs === 2, 'runs ' + runs)
  ok('chip painted start/done per real save', log.join(',') === 'start,done,start,done', log.join(','))
  await tick(30000)
  ok('30 s idle -> no more saves', runs === 2 && !s.busy(), 'runs ' + runs)
}
// 2) a change during the save -> exactly one more save, after the gap
{
  let runs = 0; let s
  s = createSaveSoon({ ...clock, run: async () => { runs++; if (runs === 1) s.note(); return 1 } })
  s.note(); await tick(100)
  ok('change during save does not save at once', runs === 1, 'runs ' + runs)
  await tick(2100)
  ok('it saves once after the gap', runs === 2, 'runs ' + runs)
  await tick(10000)
  ok('then quiet', runs === 2 && !s.busy())
}
// 3) failure -> onFail once, promise resolves -1, no retry loop
{
  let runs = 0; let failed = 0
  const s = createSaveSoon({ ...clock, run: async () => { runs++; const e = new Error('QuotaExceededError'); throw e }, onFail: () => failed++ })
  const p = s.note(); await tick(2100)
  ok('failed save resolves -1', (await p) === -1)
  await tick(30000)
  ok('failure not retried', runs === 1 && failed === 1, 'runs ' + runs + ' fail ' + failed)
  ok('still dirty after failure', s.dirty())
}
// 4) a -1 (requeue) result does not count as saved
{
  let runs = 0
  const s = createSaveSoon({ ...clock, run: async () => { runs++; return runs === 1 ? -1 : 5 } })
  s.note(); await tick(2100)
  ok('-1 leaves dirty', s.dirty())
  s.note(); await tick(2100)
  ok('next change saves and clears dirty', runs === 2 && !s.dirty())
}
console.log(fails ? 'save-soon: ' + fails + ' FAIL' : 'save-soon: all PASS')
process.exit(fails ? 1 : 0)
