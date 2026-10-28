// Cog rules. Pure. No imports. Caps use the America/New_York day.
const METALS = { bronze: 1, silver: 1, gold: 1, platinum: 1, titanium: 1 }

export function changeDown(from, to) {
  if (from === 'gold' && to === 'silver') return { ok: true, from: from, to: to, take: 1, give: 10 }
  if (from === 'silver' && to === 'bronze') return { ok: true, from: from, to: to, take: 1, give: 10 }
  if (!METALS[from] || !METALS[to]) return { ok: false, error: 'no-convert' }
  return { ok: false, error: 'no-convert' }
}

function etKey(ms) {
  const parts = {}
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hourCycle: 'h23',
  })
  fmt.formatToParts(new Date(ms)).forEach(function (p) {
    if (p.type !== 'literal') parts[p.type] = p.value
  })
  return { day: parts.year + '-' + parts.month + '-' + parts.day, hour: parts.hour }
}

function whenOf(dateET) {
  if (dateET instanceof Date) return dateET.getTime()
  const n = Number(dateET)
  return n
}

function groupOf(src) {
  const s = String(src || '')
  if (s === 'sale' || s === 'purse' || s === 'town') return 'purse'
  if (s === 'run' || s.slice(0, 4) === 'run:') return 'run'
  if (s === 'daily' || s.slice(0, 6) === 'daily:') return 'daily'
  return ''
}

function bronzePay(row) {
  if (!row || (row.metal && row.metal !== 'bronze')) return 0
  const n = Number(row.cogs)
  if (!isFinite(n) || n <= 0) return 0
  return n
}

export function dayCap(entries, dateET, src) {
  const at = whenOf(dateET)
  const now = etKey(at)
  const group = groupOf(src)
  const groupCap = group === 'purse' ? 40 : group === 'run' ? 30 : group === 'daily' ? 60 : 0
  let day = 0
  let hour = 0
  let grouped = 0
  const rows = entries || []
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const t = Number(row && row.at)
    if (!isFinite(t)) continue
    const key = etKey(t)
    if (key.day !== now.day) continue
    const pay = bronzePay(row)
    day += pay
    if (key.hour === now.hour) hour += pay
    if (groupCap && groupOf(row.src) === group) grouped += pay
  }
  const full = day >= 150 || hour >= 60 || (groupCap > 0 && grouped >= groupCap)
  const entry = { metal: 'bronze', src: src || 'legacy', cogs: full ? 0 : 1, at: at, earned: day, cap: 150 }
  if (full) entry.note = 'full-today'
  return entry
}
