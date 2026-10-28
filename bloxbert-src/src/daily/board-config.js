// Bertopia Daily Board. Pure data. Teachers merge a plain object over this.
// Unknown keys are ignored. A bad value keeps the default. No UI.

const IDS = new Set([
  'molten-chasm',
  'circuit-fix',
  'bertapult-distance',
  'bertapult-mark',
  'paperlab-fold',
  'parkour-rush',
])

export const DEFAULTS = {
  mon: 'molten-chasm',
  tue: 'circuit-fix',
  // ISO week parity. Even week -> distance, odd week -> mark.
  wed: { even: 'bertapult-distance', odd: 'bertapult-mark' },
  thu: 'paperlab-fold',
  fri: 'parkour-rush',
  weekend: ['parkour-rush', 'circuit-fix', 'bertapult-distance'],
  surpriseOdds: 8,
  sweep: { need: 3, of: 5 },
}

function isId(v) {
  return typeof v === 'string' && IDS.has(v)
}

function isPlain(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v)
}

export function boardConfig(override) {
  const cfg = {
    mon: DEFAULTS.mon,
    tue: DEFAULTS.tue,
    wed: { even: DEFAULTS.wed.even, odd: DEFAULTS.wed.odd },
    thu: DEFAULTS.thu,
    fri: DEFAULTS.fri,
    weekend: DEFAULTS.weekend.slice(),
    surpriseOdds: DEFAULTS.surpriseOdds,
    sweep: { need: DEFAULTS.sweep.need, of: DEFAULTS.sweep.of },
  }
  if (!isPlain(override)) return cfg
  for (const key of ['mon', 'tue', 'thu', 'fri']) {
    if (Object.prototype.hasOwnProperty.call(override, key) && isId(override[key])) cfg[key] = override[key]
  }
  if (Object.prototype.hasOwnProperty.call(override, 'wed')) {
    const w = override.wed
    if (isId(w)) cfg.wed = { even: w, odd: w }
    else if (isPlain(w)) {
      if (isId(w.even)) cfg.wed.even = w.even
      if (isId(w.odd)) cfg.wed.odd = w.odd
    }
  }
  if (Object.prototype.hasOwnProperty.call(override, 'weekend')) {
    const pool = override.weekend
    if (Array.isArray(pool) && pool.length > 0 && pool.every(isId)) cfg.weekend = pool.slice()
  }
  if (Object.prototype.hasOwnProperty.call(override, 'surpriseOdds')) {
    const n = override.surpriseOdds
    if (typeof n === 'number' && Number.isFinite(n) && n >= 1) cfg.surpriseOdds = n
  }
  if (Object.prototype.hasOwnProperty.call(override, 'sweep')) {
    const s = override.sweep
    if (isPlain(s) && Number.isInteger(s.need) && Number.isInteger(s.of) && s.need >= 0 && s.of >= 1 && s.need <= s.of) {
      cfg.sweep = { need: s.need, of: s.of }
    }
  }
  return cfg
}
