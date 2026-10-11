// Pure circuit check. No DOM, no noa. One network stops at 512 parts.
// simulate(netlist, inputs) -> { powered, lit, lines, stops, edges }
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
const MAX = 512

function pid(p) {
  if (p.id != null && p.id !== '') return String(p.id)
  return (p.x | 0) + ',' + (p.y | 0) + ',' + (p.z | 0)
}

function conducts(p, held) {
  if (p.kind === 'line' || p.kind === 'cell' || p.kind === 'load') return true
  if (p.kind === 'switch') return p.on === true
  if (p.kind === 'button') return !!(held[p.id] || held[p.x + ',' + p.y + ',' + p.z])
  return false
}

function path(start, goal, block, nbs) {
  if (start === goal) return [start]
  const prev = new Map()
  const q = [start]
  prev.set(start, null)
  for (let i = 0; i < q.length; i++) {
    const u = q[i]
    const next = nbs(u)
    for (let k = 0; k < next.length; k++) {
      const v = next[k]
      if (block.has(v) || prev.has(v)) continue
      prev.set(v, u)
      if (v === goal) {
        const out = [goal]
        let c = goal
        while (prev.get(c) != null) { c = prev.get(c); out.push(c) }
        out.reverse()
        return out
      }
      q.push(v)
    }
  }
  return null
}

export function conductorMarks(prev, events) {
  const seen = Object.assign({}, prev && prev.seen)
  let n = prev && prev.n ? prev.n | 0 : 0
  for (const e of events || []) {
    if (!e || (e.lines | 0) < 10) continue
    const id = String(e.id)
    if (seen[id]) continue
    seen[id] = 1
    n += 1
  }
  return { n, seen }
}

export function simulate(netlist, inputs) {
  const raw = netlist && Array.isArray(netlist.parts) ? netlist.parts : []
  const held = inputs && inputs.held && typeof inputs.held === 'object' ? inputs.held : {}
  const byId = new Map()
  const loc = new Map()
  for (const row of raw) {
    if (!row || row.kind == null) continue
    const p = {
      id: pid(row),
      kind: row.kind,
      x: row.x | 0,
      y: row.y | 0,
      z: row.z | 0,
      on: row.on === true,
    }
    if (byId.has(p.id)) continue
    byId.set(p.id, p)
    loc.set(p.x + ',' + p.y + ',' + p.z, p)
  }
  const lineCount = new Map()
  function countsFor(p) {
    let row = lineCount.get(p.id)
    if (row) return row
    row = [0, 0, 0]
    for (let d = 0; d < DIRS.length; d++) {
      const q = loc.get((p.x + DIRS[d][0]) + ',' + (p.y + DIRS[d][1]) + ',' + (p.z + DIRS[d][2]))
      if (!q || q.kind !== 'line') continue
      row[DIRS[d][0] ? 0 : DIRS[d][1] ? 1 : 2]++
    }
    lineCount.set(p.id, row)
    return row
  }
  // A line joins another line only end to end. A straight run does not short
  // sideways into a neighbor. A corner (one line each way) still turns.
  // Anything else is "into a part": cell, switch, button, or load.
  function endAxis(p, ax) {
    if (p.kind !== 'line') return true
    const row = countsFor(p)
    let best = 0
    for (let i = 0; i < 3; i++) if (row[i] > best) best = row[i]
    if (best >= 2) return row[ax] >= 2
    return best === 0 || row[ax] > 0
  }
  function wire(p, q) {
    if (p.kind !== 'line' || q.kind !== 'line') return true
    const ax = (q.x - p.x) ? 0 : (q.y - p.y) ? 1 : 2
    return endAxis(p, ax) && endAxis(q, ax)
  }
  const powered = []
  const lit = []
  const lines = {}
  const stops = []
  const edges = []
  const seen = new Set()
  for (const start of byId.values()) {
    if (seen.has(start.id)) continue
    const comp = []
    const stack = [start]
    seen.add(start.id)
    while (stack.length) {
      const p = stack.pop()
      comp.push(p)
      if (comp.length > MAX) break
      for (let d = 0; d < DIRS.length; d++) {
        const q = loc.get((p.x + DIRS[d][0]) + ',' + (p.y + DIRS[d][1]) + ',' + (p.z + DIRS[d][2]))
        if (!q || seen.has(q.id)) continue
        seen.add(q.id)
        stack.push(q)
      }
    }
    if (comp.length > MAX) continue
    const cond = new Set()
    for (const p of comp) if (conducts(p, held)) cond.add(p.id)
    const nbs = (id) => {
      const p = byId.get(id)
      const out = []
      for (let d = 0; d < DIRS.length; d++) {
        const q = loc.get((p.x + DIRS[d][0]) + ',' + (p.y + DIRS[d][1]) + ',' + (p.z + DIRS[d][2]))
        if (q && cond.has(q.id) && wire(p, q)) out.push(q.id)
      }
      return out
    }
    const cells = []
    const loads = []
    for (const p of comp) {
      if (!cond.has(p.id)) continue
      if (p.kind === 'cell') cells.push(p)
      else if (p.kind === 'load') loads.push(p)
    }
    const reach = new Set()
    const parent = new Map()
    const rq = []
    for (const c of cells) { reach.add(c.id); rq.push(c.id); parent.set(c.id, null) }
    for (let i = 0; i < rq.length; i++) {
      const next = nbs(rq[i])
      for (let k = 0; k < next.length; k++) {
        const v = next[k]
        if (reach.has(v)) continue
        reach.add(v)
        parent.set(v, rq[i])
        rq.push(v)
      }
    }
    const onCycle = new Set()
    for (const load of loads) {
      let best = 0
      let litBy = false
      for (const cell of cells) {
        const p1 = path(cell.id, load.id, new Set(), nbs)
        if (!p1) continue
        const block = new Set(p1.slice(1, -1))
        let nbs2 = nbs
        if (p1.length === 2) {
          const a = p1[0]
          const b = p1[1]
          nbs2 = (id) => nbs(id).filter((v) => !((id === a && v === b) || (id === b && v === a)))
        }
        const p2 = path(cell.id, load.id, block, nbs2)
        if (!p2) continue
        litBy = true
        const bag = new Set(p1.concat(p2))
        let nLines = 0
        for (const id of bag) {
          onCycle.add(id)
          if (byId.get(id).kind === 'line') nLines += 1
        }
        if (nLines > best) best = nLines
      }
      if (litBy) {
        lit.push(load.id)
        lines[load.id] = best
      }
    }
    for (const id of reach) powered.push(id)
    for (const id of reach) {
      const from = parent.get(id)
      if (from) edges.push([from, id])
    }
    const reachList = [...reach]
    for (let i = 0; i < reachList.length; i++) {
      const p = byId.get(reachList[i])
      let stop = false
      for (let d = 0; d < DIRS.length && !stop; d++) {
        const nx = p.x + DIRS[d][0]
        const ny = p.y + DIRS[d][1]
        const nz = p.z + DIRS[d][2]
        const q = loc.get(nx + ',' + ny + ',' + nz)
        if (q && !cond.has(q.id)) stop = true
        else if (!q) {
          for (let e = 0; e < DIRS.length; e++) {
            const far = loc.get((nx + DIRS[e][0]) + ',' + (ny + DIRS[e][1]) + ',' + (nz + DIRS[e][2]))
            if (far && far.id !== p.id) { stop = true; break }
          }
        }
      }
      if (stop) stops.push(p.id)
    }
    void onCycle
  }
  return { powered, lit, lines, stops, edges }
}
