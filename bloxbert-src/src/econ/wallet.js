// Append-only practice ledger. sum(ledger) + start === cogs. Start row is a 0 marker.
export function createWallet(cfg) {
  const state = {
    start: cfg.start, cogs: cfg.start, seq: 0, day: '', soldToday: {}, spentToday: 0, picked: [], found: [],
    ledger: [], dial: cfg.dial, dailyCap: cfg.dailyCap,
  }
  function check() {
    const sum = state.ledger.reduce((n, r) => n + r.cogs, 0)
    if (sum + state.start !== state.cogs) state.cogs = sum + state.start
  }
  function post(row) {
    state.seq += 1
    state.ledger.push({ tx: 's-' + state.seq, at: Date.now(), by: 'you', ...row })
    if (state.ledger.length > 500) state.ledger.splice(0, state.ledger.length - 500)
    state.cogs += row.cogs
    check()
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
    check()
  }
  function dump() {
    return {
      start: state.start, cogs: state.cogs, seq: state.seq, day: state.day, soldToday: { ...state.soldToday },
      spentToday: state.spentToday, picked: state.picked.slice(), found: (state.found || []).slice(), ledger: state.ledger.slice(),
      dial: state.dial, dailyCap: state.dailyCap,
    }
  }
  return { state, post, load, dump, check }
}
