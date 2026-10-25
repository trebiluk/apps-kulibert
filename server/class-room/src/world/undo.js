// Teacher grief undo. From logged ops, work out which blocks to put back. Staff only; the world
// applies the result like any edit (so it is numbered, saved and fanned out, and clients see it).
// sel: { since, until, who?, rect?{x0,z0,x1,z1} } in ms. Needs no kid login.
export function undoPlan(ops, sel) {
  const first = new Map()
  for (const o of ops) {
    if (o.t < sel.since || o.t > sel.until) continue
    if (sel.who !== undefined && o.w !== sel.who) continue
    const r = sel.rect
    if (r && (o.x < r.x0 || o.x > r.x1 || o.z < r.z0 || o.z > r.z1)) continue
    const k = o.x + ',' + o.y + ',' + o.z
    if (!first.has(k)) first.set(k, { x: o.x, y: o.y, z: o.z, id: o.b })   // the oldest "before" in the selection
  }
  return [...first.values()]
}

// Apply a plan through the world. b is read from the world so a changed cell is still undone.
export function applyUndo(world, plan) {
  const edits = []
  for (const p of plan) {
    const cur = world.cell(p.x, p.y, p.z)
    if (cur !== undefined && cur !== p.id) edits.push({ x: p.x, y: p.y, z: p.z, id: p.id, b: cur })
  }
  return world.apply(edits, 0)
}
