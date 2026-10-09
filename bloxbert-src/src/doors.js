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
  50: { kind: 'wood', open: false, other: 51, top: true },
  51: { kind: 'wood', open: true, other: 50, top: true },
  52: { kind: 'glass', open: false, other: 53, top: true },
  53: { kind: 'glass', open: true, other: 52, top: true },
  54: { kind: 'metal', open: false, other: 55, top: true },
  55: { kind: 'metal', open: true, other: 54, top: true },
  56: { kind: 'slide', open: false, other: 57, top: true },
  57: { kind: 'slide', open: true, other: 56, top: true },
}
export const LEVER = { off: 38, on: 39 }
export const BUTTON = { off: 40, on: 41 }
export const LANTERN = 47
export const CHARGER = 48
export const FABRICATOR = 43
const STEPS = [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0], [0, -1, 0]]
export function isDoor(id) { return !!DOOR[id] }
export function isDoorTop(id) { return !!(DOOR[id] && DOOR[id].top) }
export function doorTopId(id) {
  const row = DOOR[id]
  if (!row) return 0
  return row.top ? id : id + 20
}
export function doorKind(id) { return DOOR[id] ? DOOR[id].kind : '' }
export function isOpenDoor(id) { return !!(DOOR[id] && DOOR[id].open) }
export function closedId(id) { return DOOR[id] ? (DOOR[id].open ? DOOR[id].other : id) : 0 }
export function openId(id) { return DOOR[id] ? (DOOR[id].open ? id : DOOR[id].other) : 0 }
export const DOOR_HOLD_MS = 1200
export function placedDoorId(id) {
  const shut = closedId(id)
  return shut || (isDoor(id) ? id : 0)
}
export function leverOpens(turningOn) { return !!turningOn }
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
  for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy && !dz) continue
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
