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
export function fromDoc(doc) {
  if (!doc || doc.v === 1) return { player: emptyPlayer('survival'), econ: null, meta: {}, lost: [], drops: [] }
  return {
    player: doc.player || emptyPlayer(doc.player && doc.player.mode),
    econ: doc.econ || null,
    meta: doc.meta || {},
    lost: doc.lost || [],
    drops: doc.drops || [],
  }
}
