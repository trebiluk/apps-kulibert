// Pure Daily picker. dateET is an ET calendar date (YYYY-MM-DD), not a host timestamp.
import { mulberry32 } from '../econ/vend.js'
import { boardConfig } from './board-config.js'

const APP = 'bertopia'
const DAY_KEY = { 1: 'mon', 2: 'tue', 4: 'thu', 5: 'fri' }

export function fnv1a32(str) {
  let h = 0x811c9dc5
  const s = String(str)
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function seed(app, dateET) {
  return mulberry32(fnv1a32('kulinet|' + app + '|' + dateET))
}

function ymdUtc(dateET) {
  if (typeof dateET !== 'string') return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateET)
  if (!m) return null
  const y = +m[1]
  const mo = +m[2]
  const d = +m[3]
  const utc = new Date(Date.UTC(y, mo - 1, d))
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== mo - 1 || utc.getUTCDate() !== d) return null
  return utc
}

function isoWeekday(utc) {
  const day = utc.getUTCDay()
  return day === 0 ? 7 : day
}

function isoWeek(utc) {
  const date = new Date(utc.getTime())
  const day = isoWeekday(date)
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

function pickPool(rng, pool) {
  return pool[Math.floor(rng() * pool.length)]
}

export function today(dateET, override) {
  const cfg = boardConfig(override)
  const utc = ymdUtc(dateET)
  if (!utc) return { id: cfg.mon, surprise: false, weekend: false }
  const wd = isoWeekday(utc)
  const rng = seed(APP, dateET)
  if (wd >= 6) {
    return { id: pickPool(rng, cfg.weekend), surprise: false, weekend: true }
  }
  const base = wd === 3 ? (isoWeek(utc) % 2 === 0 ? cfg.wed.even : cfg.wed.odd) : cfg[DAY_KEY[wd]]
  const surprise = rng() < 1 / cfg.surpriseOdds
  return {
    id: surprise ? pickPool(rng, cfg.weekend) : base,
    surprise,
    weekend: false,
  }
}

export function sweepDone(doneDatesThisWeek, override) {
  const cfg = boardConfig(override)
  const seen = new Set()
  const list = Array.isArray(doneDatesThisWeek) ? doneDatesThisWeek : []
  for (const raw of list) {
    const utc = ymdUtc(raw)
    if (!utc) continue
    const wd = isoWeekday(utc)
    if (wd >= 1 && wd <= 5) seen.add(raw)
  }
  return seen.size >= cfg.sweep.need
}
