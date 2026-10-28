// Append-only practice ledger. sum(ledger) + start === cogs. Start row is a 0 marker.
// onChange fires after every earn or spend so the chip, Wallet and shop stay on this total.
const METALS = ['bronze', 'silver', 'gold', 'platinum', 'titanium']
const SRC_BY_KIND = {
  start: 'start', goal: 'quest', badge: 'badge', sell: 'sale', buy: 'sale',
  'vend-sale': 'sale', 'till-take': 'sale', teacher: 'start', 'to-teacher': 'quest',
}
export function readRow(row) {
  const metal = row && METALS.indexOf(row.metal) >= 0 ? row.metal : 'bronze'
  const src = row && typeof row.src === 'string' && row.src ? row.src : 'legacy'
  return { metal: metal, src: src }
}
export function createWallet(cfg, onChange) {
  const state = {
    start: cfg.start, cogs: cfg.start, seq: 0, day: '', soldToday: {}, spentToday: 0, picked: [], found: [],
    ledger: [], dial: cfg.dial, dailyCap: cfg.dailyCap,
  }
  function check() {
    const sum = state.ledger.reduce((n, r) => n + (r.cogs || 0), 0)
    if (sum + state.start !== state.cogs) state.cogs = sum + state.start
  }
  function changed() {
    check()
    if (typeof onChange === 'function') onChange(state.cogs)
  }
  function sumMetal(metal) {
    let n = 0
    for (let i = 0; i < state.ledger.length; i++) {
      const row = state.ledger[i]
      if (readRow(row).metal === metal) n += row.cogs || 0
    }
    if (metal === 'bronze') n += state.start
    return n
  }
  function balance(metal) {
    check()
    return sumMetal(metal || 'bronze')
  }
  function balances() {
    check()
    return {
      bronze: sumMetal('bronze'), silver: sumMetal('silver'), gold: sumMetal('gold'),
      platinum: sumMetal('platinum'), titanium: sumMetal('titanium'),
    }
  }
  function post(row) {
    state.seq += 1
    const entry = { tx: 's-' + state.seq, at: Date.now(), by: 'you', ...row }
    if (!entry.metal) entry.metal = 'bronze'
    if (!entry.src) entry.src = SRC_BY_KIND[entry.kind] || 'quest'
    state.ledger.push(entry)
    if (state.ledger.length > 500) state.ledger.splice(0, state.ledger.length - 500)
    state.cogs += row.cogs || 0
    changed()
    return state.ledger[state.ledger.length - 1]
  }
  function load(econ) {
    if (!econ) return
    state.start = econ.start ?? cfg.start
    state.seq = econ.seq || 0
    state.day = econ.day || ''
    state.soldToday = econ.soldToday || {}
    state.spentToday = econ.spentToday || 0
    state.picked = econ.picked || []
    state.found = Array.isArray(econ.found) ? econ.found.slice() : []
    state.ledger = econ.ledger || []
    state.dial = econ.dial || cfg.dial
    state.dailyCap = econ.dailyCap || cfg.dailyCap
    state.cogs = econ.cogs ?? state.start
    changed()
  }
  function dump() {
    return {
      start: state.start, cogs: state.cogs, seq: state.seq, day: state.day, soldToday: { ...state.soldToday },
      spentToday: state.spentToday, picked: state.picked.slice(), found: (state.found || []).slice(), ledger: state.ledger.slice(),
      dial: state.dial, dailyCap: state.dailyCap,
    }
  }
  return { state, post, load, dump, check, balance, balances }
}
