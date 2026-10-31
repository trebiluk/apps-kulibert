// Bertopia Daily Board card. Shows today's Daily and the Weekly Sweep progress.
// Reads the picker in board.js and the teacher merge in board-config.js. Never hardcodes the day map.
// No animation, no sound, no colour-only meaning. Local reads only.
import { today } from './board.js'
import { boardConfig } from './board-config.js'

// Dailies that have a playable build. Map id -> true. Empty on purpose: none are built yet.
// When one ships, add its id here and pass an open(id) callback to paintDailyCard.
export const BUILT = {}

// Icon name (from icons.js MENU_GLYPH), name key, and one-line "what to do" key for each Daily id.
const META = {
  'molten-chasm': { icon: 'target', name: 'dailyNameMolten', what: 'dailyWhatMolten' },
  'circuit-fix': { icon: 'gear', name: 'dailyNameCircuit', what: 'dailyWhatCircuit' },
  'bertapult-distance': { icon: 'target', name: 'dailyNameBertDist', what: 'dailyWhatBertDist' },
  'bertapult-mark': { icon: 'target', name: 'dailyNameBertMark', what: 'dailyWhatBertMark' },
  'paperlab-fold': { icon: 'book', name: 'dailyNamePaper', what: 'dailyWhatPaper' },
  'parkour-rush': { icon: 'target', name: 'dailyNameParkour', what: 'dailyWhatParkour' },
}
const WEEKDAY_KEYS = ['wdMon', 'wdTue', 'wdWed', 'wdThu', 'wdFri']

// The America/New_York calendar date (YYYY-MM-DD) for a time. Never the host timezone.
export function etDate(ms) {
  const parts = {}
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  })
  fmt.formatToParts(new Date(ms)).forEach((p) => { if (p.type !== 'literal') parts[p.type] = p.value })
  return parts.year + '-' + parts.month + '-' + parts.day
}

// Spot-check hook: ?dailyDate=2026-11-02 forces the date. Anything that is not a real YYYY-MM-DD is ignored.
export function forcedDate(search) {
  try {
    const raw = new URLSearchParams(search || '').get('dailyDate')
    if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
    const [y, m, d] = raw.split('-').map(Number)
    const u = new Date(Date.UTC(y, m - 1, d))
    if (u.getUTCFullYear() !== y || u.getUTCMonth() !== m - 1 || u.getUTCDate() !== d) return null
    return raw
  } catch (e) { return null }
}

function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number)
  const u = new Date(Date.UTC(y, m - 1, d + n))
  return u.getUTCFullYear() + '-' + String(u.getUTCMonth() + 1).padStart(2, '0') + '-' + String(u.getUTCDate()).padStart(2, '0')
}

// Mon..Fri dates of the ISO week that holds dateET.
export function weekDays(dateET) {
  const [y, m, d] = dateET.split('-').map(Number)
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay() || 7
  const mon = addDays(dateET, 1 - wd)
  return [0, 1, 2, 3, 4].map((i) => addDays(mon, i))
}

// Dates (ET) this week on which a Daily was finished.
// TODO: Daily completions will come from the wallet ledger rows with src 'daily' or 'daily:<app>'
// (the same rows econ/cogs.js groups for the Daily cap), posted when the Daily payout lands.
// Nothing posts those rows yet, so this returns [] today and the card shows 0.
export function doneDates(ledger, dateET) {
  const week = new Set(weekDays(dateET))
  const out = new Set()
  for (const row of Array.isArray(ledger) ? ledger : []) {
    const src = String(row && row.src || '')
    if (src !== 'daily' && src.slice(0, 6) !== 'daily:') continue
    const at = Number(row.at)
    if (!isFinite(at)) continue
    const day = etDate(at)
    if (week.has(day)) out.add(day)
  }
  return Array.from(out)
}

function el(tag, cls, text) {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (text != null) n.textContent = text
  return n
}

// Build the card model. Pure, so tests can call it.
export function cardModel(opts) {
  const o = opts || {}
  const dateET = o.dateET || forcedDate(o.search) || etDate(o.now == null ? Date.now() : o.now)
  const cfg = boardConfig(o.override)
  const pick = today(dateET, o.override)
  const done = doneDates(o.ledger, dateET)
  const days = weekDays(dateET).map((d) => ({ date: d, done: done.indexOf(d) >= 0 }))
  return {
    dateET,
    id: pick.id,
    surprise: !!pick.surprise,
    weekend: !!pick.weekend,
    built: !!BUILT[pick.id],
    need: cfg.sweep.need,
    of: cfg.sweep.of,
    count: days.filter((d) => d.done).length,
    days,
  }
}

// Append the card to a panel grid. opts: t(key), icon(name) -> element|null, ledger, override, open(id), search, now.
export function paintDailyCard(g, opts) {
  const t = opts.t
  const m = cardModel(opts)
  const meta = META[m.id] || { icon: 'target', name: 'dailyHead', what: 'dailyHead' }
  const card = el('section', 'daily-card')
  card.dataset.dailyCard = '1'
  card.dataset.dailyId = m.id
  card.dataset.dailyDate = m.dateET
  card.setAttribute('aria-label', t('dailyHead'))

  const head = el('p', 'daily-head')
  head.append(el('span', 'daily-head-word', t('dailyHead')))
  if (m.surprise) {
    const tag = el('span', 'daily-tag')
    const ic = opts.icon && opts.icon('star')
    if (ic) { const w = el('span', 'daily-tag-ic'); w.setAttribute('aria-hidden', 'true'); w.append(ic); tag.append(w) }
    tag.append(el('span', null, t('dailySurprise')))
    tag.dataset.dailySurprise = '1'
    head.append(tag)
  }
  card.append(head)

  const body = el('div', 'daily-body')
  const icBox = el('span', 'daily-ic')
  icBox.setAttribute('aria-hidden', 'true')
  const ic = opts.icon && opts.icon(meta.icon)
  if (ic) icBox.append(ic)
  const txt = el('div', 'daily-txt')
  txt.append(el('b', 'daily-name', t(meta.name)), el('span', 'daily-what', t(meta.what)))
  body.append(icBox, txt)
  card.append(body)

  const go = el('button', 'gtile daily-go')
  go.type = 'button'
  go.dataset.dailyGo = '1'
  const goIc = opts.icon && opts.icon(m.built ? 'play' : 'flag')
  if (goIc) { const w = el('span', 'gic'); w.setAttribute('aria-hidden', 'true'); w.append(goIc); go.append(w) }
  go.append(el('span', 'glbl', m.built ? t('dailyPlay') : t('dailySoon')))
  if (!m.built) {
    // aria-disabled keeps the button reachable by keyboard so a kid hears why it does nothing.
    go.setAttribute('aria-disabled', 'true')
    go.classList.add('is-soon')
    go.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation() })
  } else {
    go.addEventListener('click', () => { if (typeof opts.open === 'function') opts.open(m.id) })
  }
  card.append(go)

  const sweep = el('div', 'daily-sweep')
  const line = t('dailySweep').replace('{n}', String(m.count)).replace('{need}', String(m.need))
  sweep.append(el('p', 'daily-sweep-line', line))
  const marks = el('ul', 'daily-marks')
  marks.setAttribute('aria-hidden', 'false')
  m.days.forEach((d, i) => {
    const li = el('li', 'daily-mark' + (d.done ? ' is-done' : ''))
    li.dataset.done = d.done ? '1' : '0'
    const day = t(WEEKDAY_KEYS[i])
    li.append(el('span', 'daily-mark-star', d.done ? '★' : '☆'))
    li.append(el('span', 'daily-mark-day', day))
    const sr = el('span', 'kd-sr', ' ' + (d.done ? t('dailyMarkDone') : t('dailyMarkTodo')))
    li.append(sr)
    marks.append(li)
  })
  sweep.append(marks)
  card.append(sweep)

  g.append(card)
  return card
}
