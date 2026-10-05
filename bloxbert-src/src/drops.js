// Loose drops. They never despawn. Past 256 piles, the rest wait in Lost & Found.
export const DROP_CAP = 256
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

export function mergeOrAdd(drops, lost, drop) {
  const n = drop.n | 0
  if (!drop.item || n <= 0) return 'skip'
  const near = drops.find((d) => d.item === drop.item && nearEnough(d, drop, MERGE_R))
  if (near) { near.n += n; return 'merged' }
  if (drops.length >= DROP_CAP) {
    const pile = lost.find((d) => d.item === drop.item)
    if (pile) pile.n += n
    else lost.push({ item: drop.item, n })
    return 'lost'
  }
  drops.push({ id: seq++, x: drop.x, y: drop.y, z: drop.z, item: drop.item, n, at: drop.at || 0 })
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
