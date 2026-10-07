// Door kinds, double doors, and the light-up spacing rule. Pure.
export const DOOR = {
  30: { kind: 'wood', open: false, other: 31 },
  31: { kind: 'wood', open: true, other: 30 },
  32: { kind: 'glass', open: false, other: 33 },
  33: { kind: 'glass', open: true, other: 32 },
  34: { kind: 'metal', open: false, other: 35 },
  35: { kind: 'metal', open: true, other: 34 },
  36: { kind: 'slide', open: false, other: 37 },
  37: { kind: 'slide', open: true, other: 36 },
}
export const LEVER = { off: 38, on: 39 }
export const BUTTON = { off: 40, on: 41 }
export const LANTERN = 47
export const CHARGER = 48
export const FABRICATOR = 43
const STEPS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]
export function isDoor(id) { return !!DOOR[id] }
export function doorKind(id) { return DOOR[id] ? DOOR[id].kind : '' }
export function isOpenDoor(id) { return !!(DOOR[id] && DOOR[id].open) }
export function closedId(id) { return DOOR[id] ? (DOOR[id].open ? DOOR[id].other : id) : 0 }
export function openId(id) { return DOOR[id] ? (DOOR[id].open ? id : DOOR[id].other) : 0 }
export function group(x, y, z, get) {
  const id = get(x, y, z)
  const kind = doorKind(id)
  if (!kind) return []
  const seen = new Set()
  const out = []
  const q = [[x, y, z]]
  while (q.length) {
    const [cx, cy, cz] = q.pop()
    const key = cx + ',' + cy + ',' + cz
    if (seen.has(key)) continue
    const cid = get(cx, cy, cz)
    if (doorKind(cid) !== kind) continue
    seen.add(key)
    out.push([cx, cy, cz, cid])
    for (const [dx, dy, dz] of STEPS) q.push([cx + dx, cy + dy, cz + dz])
  }
  return out
}
export function touchingDoors(x, y, z, get) {
  const out = []
  for (const [dx, dy, dz] of STEPS) {
    const id = get(x + dx, y + dy, z + dz)
    if (isDoor(id)) out.push([x + dx, y + dy, z + dz, id])
  }
  return out
}
export function countSpaced(pts, min) {
  const used = []
  for (const p of pts) {
    let ok = true
    for (const u of used) {
      const d = Math.abs(u.x - p.x) + Math.abs(u.y - p.y) + Math.abs(u.z - p.z)
      if (d < min) { ok = false; break }
    }
    if (ok) used.push(p)
  }
  return used.length
}
