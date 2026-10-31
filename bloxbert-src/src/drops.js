// Loose drops. They never despawn. Each alias keeps 32 piles; the oldest past that
// wait in Lost & Found ("ground full"). The ground never draws more than 256 piles.
export const DROP_CAP = 256
export const KID_CAP = 32
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

// Alias only. Empty means an old or mob pile, which does not use a kid's 32.
export function tagAlias(alias) {
  if (alias == null) return ''
  const s = String(alias).trim().slice(0, 24)
  return s
}

export function restoreDrop(d) {
  return {
    id: d.id || 0,
    x: +d.x || 0,
    y: +d.y || 0,
    z: +d.z || 0,
    item: d.item,
    n: d.n | 0,
    at: d.at || 0,
    alias: tagAlias(d.alias),
  }
}

export function nearEnough(a, b, r) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return dx * dx + dy * dy + dz * dz <= r * r
}

function countAlias(drops, alias) {
  let n = 0
  for (const d of drops) if (tagAlias(d.alias) === alias) n++
  return n
}

function oldestOf(drops, alias) {
  let best = null
  for (const d of drops) {
    if (tagAlias(d.alias) !== alias) continue
    if (!best || (d.at || 0) < (best.at || 0) || ((d.at || 0) === (best.at || 0) && (d.id || 0) < (best.id || 0))) best = d
  }
  return best
}

function park(lost, item, n, why) {
  const pile = lost.find((d) => d.item === item && (d.why || 'ground') === why)
  if (pile) {
    pile.n += n
    if (!pile.why) pile.why = why
  } else lost.push({ item, n, why })
}

export function mergeOrAdd(drops, lost, drop) {
  const n = drop.n | 0
  if (!drop.item || n <= 0) return 'skip'
  const alias = tagAlias(drop.alias)
  const near = drops.find((d) => d.item === drop.item && tagAlias(d.alias) === alias && nearEnough(d, drop, MERGE_R))
  if (near) { near.n += n; return 'merged' }
  let trimmed = false
  if (alias && countAlias(drops, alias) >= KID_CAP) {
    const old = oldestOf(drops, alias)
    if (old) {
      const i = drops.indexOf(old)
      if (i >= 0) drops.splice(i, 1)
      park(lost, old.item, old.n, 'ground')
      trimmed = true
    }
  }
  if (drops.length >= DROP_CAP) {
    park(lost, drop.item, n, drop.why || 'ground')
    return 'lost'
  }
  drops.push({ id: seq++, x: drop.x, y: drop.y, z: drop.z, item: drop.item, n, at: drop.at || 0, alias })
  return trimmed ? 'trimmed' : 'ground'
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