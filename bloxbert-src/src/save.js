export function emptyPlayer(mode = 'survival') {
  return { mode, bag: Array.from({ length: 15 }, () => null), hot: 0, home: null, table: false }
}
export function toV2(v1, player, econ, meta) {
  return {
    ...v1, v: 2,
    player: player || emptyPlayer('survival'),
    econ: econ || null,
    meta: meta || {},
  }
}
// 15 hotbar/bag slots, hot slot inside 0-14. Older or hand-made docs may carry fewer.
export function fitPlayer(p) {
  const bag = Array.isArray(p.bag) ? p.bag.slice() : []
  while (bag.length < 15) bag.push(null)
  const hot = Number.isFinite(p.hot) ? Math.min(14, Math.max(0, Math.trunc(p.hot))) : 0
  return { ...p, bag, hot }
}
export function fromDoc(doc) {
  if (!doc || doc.v === 1) return { player: emptyPlayer('survival'), econ: null, meta: {}, lost: [], drops: [], bots: [] }
  return {
    player: fitPlayer(doc.player || emptyPlayer(doc.mode || 'survival')),
    econ: doc.econ || null,
    meta: doc.meta || {},
    lost: doc.lost || [],
    drops: doc.drops || [],
    bots: Array.isArray(doc.bots) ? doc.bots : [],
  }
}

export function botsFrom(doc) {
  return Array.isArray(doc && doc.bots) ? doc.bots : []
}
