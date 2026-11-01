// Rulesets for the personal host (docs/bertopia/HOME-HOST.md §5). Pure. The keys are the game's own rule ids
// (bloxbert-src/src/rules.js) plus two home-only ones (combat.pvp, survival.keep) and the game mode. The server holds
// the active set, hands it out in hello, broadcasts a change, and ENFORCES what it can see on the wire.
export const RULE_IDS = ['core.break', 'core.place', 'core.craft', 'core.station.open', 'core.fly', 'station.bench', 'station.oven', 'station.woodshop', 'survival.daynight', 'survival.energy', 'combat.pvp', 'survival.keep']
const BOOLS = new Set(['core.break', 'core.place', 'core.craft', 'core.station.open', 'core.fly', 'station.bench', 'station.oven', 'station.woodshop', 'combat.pvp', 'survival.keep'])
const PICKS = Object.assign(Object.create(null), { 'survival.daynight': ['cycle', 'day', 'night'], 'survival.energy': ['off', 'calm', 'normal', 'fast'] })
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k)
export const MODES = ['survival', 'creative']

// Student defaults = what rules.js registers (every bool true, cycle, normal) + survival mode, PvP off, keep on.
const STUDENT = { mode: 'survival', 'core.break': true, 'core.place': true, 'core.craft': true, 'core.station.open': true, 'core.fly': true, 'station.bench': true, 'station.oven': true, 'station.woodshop': true, 'survival.daynight': 'cycle', 'survival.energy': 'normal', 'combat.pvp': false, 'survival.keep': true }
export const PRESETS = Object.assign(Object.create(null), {
  'home-school': { ...STUDENT, locked: true },                       // literal student rules; the editor is locked
  'home-survival': { ...STUDENT },
  'home-creative': { ...STUDENT, mode: 'creative', 'survival.daynight': 'day', 'survival.energy': 'off' },
  'home-peaceful': { ...STUDENT, 'survival.energy': 'calm' },
  'home-pvp': { ...STUDENT, 'combat.pvp': true },
  'home-hardcore': { ...STUDENT, 'survival.energy': 'fast', 'combat.pvp': true, 'survival.keep': false },
})
export const PRESET_NAMES = { 'home-school': 'Same as school', 'home-survival': 'Survival', 'home-creative': 'Creative', 'home-peaceful': 'Peaceful', 'home-pvp': 'PvP on', 'home-hardcore': 'Hardcore' }

// One value, validated against the key's type. -> value or undefined
export function cleanValue(id, v) {
  if (typeof id !== 'string') return undefined
  if (id === 'mode') return MODES.includes(v) ? v : undefined
  if (BOOLS.has(id)) return typeof v === 'boolean' ? v : undefined
  if (own(PICKS, id)) return PICKS[id].includes(v) ? v : undefined
  return undefined
}

// The live ruleset: a preset plus the owner's edits. Pure object with methods; the host keeps one per session.
export function makeRuleset(preset = 'home-survival') {
  let name = own(PRESETS, preset) ? preset : 'home-survival'
  let r = { ...PRESETS[name] }
  let rev = 1
  const api = {
    get name() { return name },
    get rev() { return rev },
    get locked() { return !!r.locked },
    // what hello and the rules frame carry
    snapshot() { const { locked, ...rest } = r; return { preset: name, rev, locked: !!locked, r: rest } },
    setPreset(p) { if (typeof p !== 'string' || !own(PRESETS, p)) return false; name = p; r = { ...PRESETS[p] }; rev++; return true },
    // an edit from the owner's editor; a locked preset ("Same as school") refuses every change
    set(id, v) { if (r.locked) return { error: 'locked' }; const c = cleanValue(id, v); if (c === undefined) return { error: 'value' }; if (r[id] === c) return { ok: true, same: true }; r[id] = c; rev++; return { ok: true } },
    get: (id) => (own(r, id) ? r[id] : undefined),
    // ---- enforcement: what the server refuses, by frame. staff (the owner) is never refused by a rule.
    // block edit {t:'b', id} : id 0 = break, else place
    editWhy(f, staff) { if (staff) return null; if (f.id === 0 && r['core.break'] === false) return 'rule:core.break'; if (f.id !== 0 && r['core.place'] === false) return 'rule:core.place'; return null },
    // craft {t:'craft'}: refused when crafting is off
    craftWhy(f, staff) { if (staff) return null; if (r['core.craft'] === false) return 'rule:core.craft'; return null },
    // station open {t:'st', k:'bench'|'oven'|'woodshop'}
    stationWhy(f, staff) { if (staff) return null; if (r['core.station.open'] === false) return 'rule:core.station.open'; const k = 'station.' + String(f.k); if (own(r, k) && r[k] === false) return 'rule:' + k; return null },
    // hit {t:'hit', i}: PvP
    hitWhy(f, staff) { if (r['combat.pvp'] !== true) return 'rule:combat.pvp'; return null },
    // fly flag on a position frame: f.f is the game's own "flying" bit; creative allows it, survival needs core.fly
    flyWhy(f, staff) { if (staff) return null; if (f.f && r.mode !== 'creative' && r['core.fly'] === false) return 'rule:core.fly'; return null },
  }
  return api
}
