/** Ginger plan model. Vertex / line / hole / area pattern after cvdlab/react-planner (MIT). Original code. Units: feet. */

export const VER = "1.0.3";
export const WELD = 0.45;

export function uid(prefix) {
  return prefix + Math.random().toString(36).slice(2, 8);
}

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function hypot(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function shoelace(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function cycleKey(ids) {
  if (!ids.length) return "";
  let min = ids[0];
  for (const id of ids) if (id < min) min = id;
  let best = null;
  const n = ids.length;
  for (let rot = 0; rot < n; rot++) {
    if (ids[rot] !== min) continue;
    const cw = [];
    const ccw = [];
    for (let i = 0; i < n; i++) {
      cw.push(ids[(rot + i) % n]);
      ccw.push(ids[(rot - i + n * 2) % n]);
    }
    for (const seq of [cw, ccw]) {
      const s = seq.join(",");
      if (best === null || s < best) best = s;
    }
  }
  return best || ids.join(",");
}

export function pointSeg(p, a, b) {
  const vx = b.x - a.x;
  const vy = b.y - a.y;
  const l2 = vx * vx + vy * vy || 1e-9;
  let t = ((p.x - a.x) * vx + (p.y - a.y) * vy) / l2;
  t = Math.max(0, Math.min(1, t));
  const x = a.x + t * vx;
  const y = a.y + t * vy;
  return { t, x, y, dist: Math.hypot(p.x - x, p.y - y) };
}

export function pointInPoly(p, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const a = pts[i];
    const b = pts[j];
    const hit = a.y > p.y !== b.y > p.y && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y || 1e-9) + a.x;
    if (hit) inside = !inside;
  }
  return inside;
}

function vmap(plan) {
  return new Map(plan.vertices.map((v) => [v.id, v]));
}

export function detectFaces(plan) {
  const map = vmap(plan);
  const adj = new Map();
  function link(from, to, lineId) {
    const a = map.get(from);
    const b = map.get(to);
    if (!a || !b) return;
    if (!adj.has(from)) adj.set(from, []);
    adj.get(from).push({ to, lineId, ang: Math.atan2(b.y - a.y, b.x - a.x) });
  }
  for (const ln of plan.lines) {
    link(ln.a, ln.b, ln.id);
    link(ln.b, ln.a, ln.id);
  }
  for (const arr of adj.values()) arr.sort((p, q) => p.ang - q.ang || p.to.localeCompare(q.to));

  const used = new Set();
  const faces = [];

  function walk(startA, startB) {
    const edges = [];
    const ids = [startA];
    let prev = startA;
    let cur = startB;
    for (let guard = 0; guard < 80; guard++) {
      const ek = prev + ">" + cur;
      if (edges.includes(ek)) return null;
      edges.push(ek);
      if (cur === startA) return ids.length >= 3 ? { edges, ids } : null;
      ids.push(cur);
      const outs = adj.get(cur) || [];
      const rev = outs.findIndex((o) => o.to === prev);
      if (rev < 0) return null;
      const nxt = outs[(rev - 1 + outs.length) % outs.length];
      if (!nxt || (nxt.to === prev && outs.length === 1)) return null;
      prev = cur;
      cur = nxt.to;
    }
    return null;
  }

  for (const ln of plan.lines) {
    for (const [a, b] of [
      [ln.a, ln.b],
      [ln.b, ln.a],
    ]) {
      if (used.has(a + ">" + b)) continue;
      const got = walk(a, b);
      if (!got) continue;
      if (got.edges.some((e) => used.has(e))) continue;
      const pts = got.ids.map((id) => map.get(id)).filter(Boolean);
      if (pts.length < 3) continue;
      const area = shoelace(pts);
      got.edges.forEach((e) => used.add(e));
      if (area <= 1) continue;
      faces.push({
        key: cycleKey(got.ids),
        ids: got.ids,
        pts,
        area,
        cx: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        cy: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      });
    }
  }
  faces.sort((a, b) => a.key.localeCompare(b.key));
  return faces;
}

export function roomsOf(plan) {
  const named = new Map((plan.areas || []).map((a) => [a.key, a.name]));
  return detectFaces(plan).map((f, i) => ({
    mark: "R" + (i + 1),
    name: named.get(f.key) || "Room",
    area: f.area,
    key: f.key,
    pts: f.pts,
    cx: f.cx,
    cy: f.cy,
  }));
}

export function nameRoom(plan, key, name) {
  const row = plan.areas.find((a) => a.key === key);
  if (row) row.name = name;
  else plan.areas.push({ id: uid("a"), key, name });
}

function weld(plan, x, y) {
  let best = null;
  let bd = WELD;
  for (const v of plan.vertices) {
    const d = Math.hypot(v.x - x, v.y - y);
    if (d < bd) {
      bd = d;
      best = v;
    }
  }
  if (best) return best.id;
  const id = uid("v");
  plan.vertices.push({ id, x: roundFt(x), y: roundFt(y) });
  return id;
}

export function roundFt(n) {
  return Math.round(n * 2) / 2;
}

function splitAt(plan, vid) {
  const v = plan.vertices.find((p) => p.id === vid);
  if (!v) return;
  for (const ln of [...plan.lines]) {
    if (ln.a === vid || ln.b === vid) continue;
    const a = plan.vertices.find((p) => p.id === ln.a);
    const b = plan.vertices.find((p) => p.id === ln.b);
    if (!a || !b) continue;
    const d = pointSeg(v, a, b);
    if (d.dist < 0.2 && d.t > 0.03 && d.t < 0.97) {
      const id2 = uid("l");
      const oldB = ln.b;
      ln.b = vid;
      plan.lines.push({ id: id2, a: vid, b: oldB, thickIn: ln.thickIn || 6 });
      for (const h of plan.holes) {
        if (h.line !== ln.id) continue;
        if (h.t <= d.t) h.t = d.t === 0 ? 0 : h.t / d.t;
        else {
          h.line = id2;
          h.t = (h.t - d.t) / (1 - d.t);
        }
      }
    }
  }
}

export function addWall(plan, x1, y1, x2, y2) {
  x1 = roundFt(x1);
  y1 = roundFt(y1);
  x2 = roundFt(x2);
  y2 = roundFt(y2);
  if (hypot(x1, y1, x2, y2) < 0.5) return null;
  const a = weld(plan, x1, y1);
  const b = weld(plan, x2, y2);
  if (a === b) return null;
  splitAt(plan, a);
  splitAt(plan, b);
  if (plan.lines.some((l) => (l.a === a && l.b === b) || (l.a === b && l.b === a))) return null;
  const line = { id: uid("l"), a, b, thickIn: 6 };
  plan.lines.push(line);
  return line;
}

export function lineEnds(plan, line) {
  const a = plan.vertices.find((v) => v.id === line.a);
  const b = plan.vertices.find((v) => v.id === line.b);
  return a && b ? { a, b } : null;
}

export function lineLength(plan, line) {
  const e = lineEnds(plan, line);
  return e ? hypot(e.a.x, e.a.y, e.b.x, e.b.y) : 0;
}

export function addHole(plan, lineId, t, kind) {
  const line = plan.lines.find((l) => l.id === lineId);
  if (!line) return null;
  const widthFt = kind === "door" ? 3 : 4;
  const len = lineLength(plan, line);
  const half = len > 0 ? widthFt / 2 / len : 0.2;
  const tc = Math.min(1 - half - 0.02, Math.max(half + 0.02, t));
  const hole = {
    id: uid(kind === "door" ? "d" : "n"),
    line: lineId,
    t: tc,
    widthFt,
    kind,
    type: kind === "door" ? "Swing" : "Fixed",
    swing: 1,
  };
  plan.holes.push(hole);
  return hole;
}

export function nearestLine(plan, p, max = 0.7) {
  let best = null;
  for (const line of plan.lines) {
    const e = lineEnds(plan, line);
    if (!e) continue;
    const d = pointSeg(p, e.a, e.b);
    if (d.dist < max && (!best || d.dist < best.dist)) best = { line, ...d };
  }
  return best;
}

export function deleteLine(plan, id) {
  plan.lines = plan.lines.filter((l) => l.id !== id);
  plan.holes = plan.holes.filter((h) => h.line !== id);
  const used = new Set();
  for (const l of plan.lines) {
    used.add(l.a);
    used.add(l.b);
  }
  plan.vertices = plan.vertices.filter((v) => used.has(v.id));
}

export function deleteHole(plan, id) {
  plan.holes = plan.holes.filter((h) => h.id !== id);
}

export function deleteItem(plan, id) {
  plan.items = plan.items.filter((it) => it.id !== id);
}

export function seed() {
  const plan = {
    name: "Studio plan",
    level: "Level 1",
    ceilingFt: 9,
    vertices: [
      { id: "v1", x: 2, y: 2 },
      { id: "v2", x: 18, y: 2 },
      { id: "v3", x: 18, y: 14 },
      { id: "v4", x: 2, y: 14 },
    ],
    lines: [
      { id: "l1", a: "v1", b: "v2", thickIn: 6 },
      { id: "l2", a: "v2", b: "v3", thickIn: 6 },
      { id: "l3", a: "v3", b: "v4", thickIn: 6 },
      { id: "l4", a: "v4", b: "v1", thickIn: 6 },
    ],
    holes: [
      { id: "d1", line: "l3", t: 0.5, widthFt: 3, kind: "door", type: "Swing", swing: 1 },
      { id: "n1", line: "l1", t: 0.55, widthFt: 4, kind: "window", type: "Fixed", swing: 1 },
    ],
    areas: [],
    items: [{ id: "i1", kind: "table", x: 7, y: 9, rot: 0, w: 5, d: 3 }],
  };
  const face = detectFaces(plan)[0];
  if (face) plan.areas.push({ id: "a1", key: face.key, name: "Studio" });
  return plan;
}

export const CATALOG = {
  table: { label: "Table", w: 5, d: 3 },
  bed: { label: "Bed", w: 6.5, d: 5 },
  chair: { label: "Chair", w: 2, d: 2 },
  sofa: { label: "Sofa", w: 7, d: 3 },
  toilet: { label: "Toilet", w: 1.5, d: 2.5 },
  sink: { label: "Sink", w: 2, d: 1.6 },
};

export function itemRect(it) {
  const cat = CATALOG[it.kind] || CATALOG.table;
  return { w: it.w || cat.w, d: it.d || cat.d };
}

export function hitItem(plan, p) {
  for (let i = plan.items.length - 1; i >= 0; i--) {
    const it = plan.items[i];
    const { w, d } = itemRect(it);
    const dx = p.x - it.x;
    const dy = p.y - it.y;
    const c = Math.cos(-(it.rot || 0));
    const s = Math.sin(-(it.rot || 0));
    const lx = dx * c - dy * s;
    const ly = dx * s + dy * c;
    if (Math.abs(lx) <= w / 2 && Math.abs(ly) <= d / 2) return it;
  }
  return null;
}
