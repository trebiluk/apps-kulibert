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
function padBagAndClampHot(player) {
  if (!player) return player
  if (!Array.isArray(player.bag)) player.bag = []
  while (player.bag.length < 15) player.bag.push(null)
  if (player.bag.length > 15) player.bag = player.bag.slice(0, 15)
  if (typeof player.hot !== 'number' || player.hot < 0 || player.hot > 14) player.hot = 0
  else player.hot = Math.min(14, Math.max(0, Math.floor(player.hot)))
  return player
}
export function fromDoc(doc) {
  if (!doc || doc.v === 1) return { player: emptyPlayer('survival'), econ: null, meta: {}, lost: [], drops: [], bots: [] }
  const player = padBagAndClampHot(doc.player || emptyPlayer(doc.mode || 'survival'))
  return {
    player,
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
