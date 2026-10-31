// Loose drops. They never despawn. Past 256 piles the ground is full, so the rest wait in Lost & Found.
// Per-kid (alias) cap: 32 piles. Excess oldest piles for that alias go to Lost & Found with "ground full".
export const DROP_CAP = 256
export const ALIAS_CAP = 32
export function lostWhyKey(why) {
  if (why === 'bag') return 'lostWhyBag'
  if (why === 'aside') return 'lostWhyAside'
  return 'groundFull'
}
export function lostWhyKeys(piles) {
  const keys = []
  for (const d of piles || []) {
    const k = lostWhyKey(d && d.why)
    if (!keys.includes(k)) keys.push(k)
  }
  return keys
}
export const PICK_R = 1.5
export const MAGNET_R = 2.5
export const MERGE_R = 2
export const OWN_MS = 1500
export const MAGNET_SPEED = 6

let seq = 1
export function noteId(id) { if (id >= seq) seq = id + 1 }

export function nearEnough(a, b, r) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return dx * dx + dy * dy + dz * dz <= r * r
}

function countAlias(drops, alias) {
  if (!alias) return 0
  return drops.filter(d => d.alias === alias).length
}

function enforceAliasCap(drops, lost, alias) {
  if (!alias) return
  const mine = drops.filter(d => d.alias === alias)
  if (mine.length <= ALIAS_CAP) return
  // sort by id (oldest first, since seq increases)
  mine.sort((a, b) => (a.id || 0) - (b.id || 0))
  const excess = mine.length - ALIAS_CAP
  for (let i = 0; i < excess; i++) {
    const old = mine[i]
    const idx = drops.indexOf(old)
    if (idx >= 0) {
      drops.splice(idx, 1)
      const pile = lost.find(d => d.item === old.item && d.why === 'ground')
      if (pile) pile.n += old.n
      else lost.push({ item: old.item, n: old.n, why: 'ground', alias: old.alias })
    }
  }
}

export function mergeOrAdd(drops, lost, drop) {
  const n = drop.n | 0
  if (!drop.item || n <= 0) return 'skip'
  const alias = drop.alias || ''
  const near = drops.find((d) => d.item === drop.item && nearEnough(d, drop, MERGE_R) && (!alias || d.alias === alias))
  if (near) { near.n += n; return 'merged' }
  if (drops.length >= DROP_CAP) {
    const pile = lost.find((d) => d.item === drop.item)
    if (pile) {
      pile.n += n
      if (!pile.why) pile.why = drop.why || 'ground'
    } else lost.push({ item: drop.item, n, why: drop.why || 'ground', alias })
    return 'lost'
  }
  const newDrop = { id: seq++, x: drop.x, y: drop.y, z: drop.z, item: drop.item, n, at: drop.at || 0, alias, why: drop.why }
  drops.push(newDrop)
  enforceAliasCap(drops, lost, alias)
  return 'ground'
}

export function canPick(drop, now) {
  return now - drop.at >= OWN_MS
}

export function nearPlayer(drop, feet, r = PICK_R) {
  const dx = drop.x - feet.x
  const dz = drop.z - feet.z
  const dy = drop.y - (feet.y + 0.2)
  return dx * dx + dz * dz <= r * r && Math.abs(dy) <= 2.5
}

export function stepMagnet(drops, player, dt, now) {
  let moved = false
  const speed = MAGNET_SPEED * dt
  for (const d of drops) {
    if (!canPick(d, now)) continue
    const dx = player.x - d.x
    const dy = player.y - d.y
    const dz = player.z - d.z
    const dist2 = dx * dx + dy * dy + dz * dz
    if (dist2 > MAGNET_R * MAGNET_R || dist2 < 0.0025) continue
    const dist = Math.sqrt(dist2)
    const step = Math.min(dist, speed)
    d.x += (dx / dist) * step
    d.y += (dy / dist) * step
    d.z += (dz / dist) * step
    moved = true
  }
  return moved
}

export function intoBag(name) {
  if (name === 'sand' || name === 'gravel' || name === 'clay') return { item: name, n: 1 }
  return null
}

// Wild berry bush break. 1-2 Berries every time, and a Bush Sprout 1 time in 4.
// Planted bushes do not use this. Leaf berries stay on their own roll.
export function wildBushLoot(x, y, z) {
  const h = (Math.imul(x | 0, 2246822519) ^ Math.imul(y | 0, 3266489917) ^ Math.imul(z | 0, 668265263) ^ Math.imul(68, 374761393)) >>> 0
  return { berries: 1 + (h % 2), sprout: ((h >>> 3) % 4) === 0 }
}

export function pullLoose(ground, lost, bagCount, bagTake, item, n) {
  let left = n
  for (const list of [ground, lost]) {
    for (let i = list.length - 1; i >= 0 && left; i--) {
      if (list[i].item !== item) continue
      const d = Math.min(list[i].n, left)
      list[i].n -= d
      left -= d
      if (!list[i].n) list.splice(i, 1)
    }
  }
  if (left && bagCount(item) >= left) { bagTake(item, left); left = 0 }
  return left === 0
}
