/** Pure geometry for the Drawin' vector studio. No DOM. */

export const KAPPA = 0.5522847498307936;

export function node(x, y, extra = {}) {
  return {
    x,
    y,
    inx: null,
    iny: null,
    outx: null,
    outy: null,
    kind: "corner",
    ...extra,
  };
}

export function tokenize(d) {
  return d.match(/[a-zA-Z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
}

function isCmd(s) {
  return typeof s === "string" && /^[a-zA-Z]$/.test(s);
}

/** Endpoint-parameterized SVG arc, sampled to points (excluding the start). */
export function arcPoints(x0, y0, x1, y1, rx, ry, phi, large, sweep, steps) {
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  if (!rx || !ry || (x0 === x1 && y0 === y1)) return [{ x: x1, y: y1 }];
  const rad = (phi * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = (x0 - x1) / 2;
  const dy = (y0 - y1) / 2;
  let x1p = cos * dx + sin * dy;
  let y1p = -sin * dx + cos * dy;
  let rx2 = rx * rx;
  let ry2 = ry * ry;
  const lam = (x1p * x1p) / rx2 + (y1p * y1p) / ry2;
  if (lam > 1) {
    const s = Math.sqrt(lam);
    rx *= s;
    ry *= s;
    rx2 = rx * rx;
    ry2 = ry * ry;
  }
  const sign = Number(large) === Number(sweep) ? -1 : 1;
  const num = rx2 * ry2 - rx2 * y1p * y1p - ry2 * x1p * x1p;
  const den = rx2 * y1p * y1p + ry2 * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / (den || 1)));
  const cxp = (coef * (rx * y1p)) / ry;
  const cyp = (coef * (-ry * x1p)) / rx;
  const cx = cos * cxp - sin * cyp + (x0 + x1) / 2;
  const cy = sin * cxp + cos * cyp + (y0 + y1) / 2;
  const ang = (ux, uy, vx, vy) => {
    const dot = ux * vx + uy * vy;
    const m = Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1;
    let a = Math.acos(Math.min(1, Math.max(-1, dot / m)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dtheta = ang(
    (x1p - cxp) / rx,
    (y1p - cyp) / ry,
    (-x1p - cxp) / rx,
    (-y1p - cyp) / ry,
  );
  if (!Number(sweep) && dtheta > 0) dtheta -= Math.PI * 2;
  if (Number(sweep) && dtheta < 0) dtheta += Math.PI * 2;
  const n = steps || Math.max(8, Math.ceil(Math.abs(dtheta) / (Math.PI / 18)));
  const pts = [];
  for (let i = 1; i <= n; i++) {
    const th = theta1 + dtheta * (i / n);
    const px = rx * Math.cos(th);
    const py = ry * Math.sin(th);
    pts.push({
      x: cos * px - sin * py + cx,
      y: sin * px + cos * py + cy,
    });
  }
  return pts;
}

export function parsePath(d) {
  const t = tokenize(String(d || ""));
  let i = 0;
  const subs = [];
  let sub = null;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let cmd = "M";
  let prevCubic = null;

  const read = () => {
    const n = parseFloat(t[i++]);
    if (Number.isNaN(n)) throw new Error("bad path number");
    return n;
  };
  const last = () => sub.nodes[sub.nodes.length - 1];
  const ensure = () => {
    if (!sub) {
      sub = { closed: false, nodes: [node(cx, cy)] };
      subs.push(sub);
    }
  };

  while (i < t.length) {
    if (isCmd(t[i])) cmd = t[i++];
    const rel = cmd === cmd.toLowerCase();
    const C = cmd.toUpperCase();

    if (C === "Z") {
      if (sub && sub.nodes.length) {
        const first = sub.nodes[0];
        const lastN = sub.nodes[sub.nodes.length - 1];
        if (
          sub.nodes.length > 1 &&
          Math.hypot(lastN.x - first.x, lastN.y - first.y) < 0.05
        ) {
          if (lastN.inx != null) {
            first.inx = lastN.inx;
            first.iny = lastN.iny;
            if (first.kind === "corner") first.kind = lastN.kind;
          }
          sub.nodes.pop();
        }
        sub.closed = true;
        cx = sx;
        cy = sy;
      }
      sub = null;
      prevCubic = null;
      continue;
    }
    if (C === "M") {
      const x = read();
      const y = read();
      const ax = rel ? cx + x : x;
      const ay = rel ? cy + y : y;
      sub = { closed: false, nodes: [node(ax, ay)] };
      subs.push(sub);
      cx = sx = ax;
      cy = sy = ay;
      prevCubic = null;
      cmd = rel ? "l" : "L";
      continue;
    }
    if (C === "L") {
      ensure();
      const x = read();
      const y = read();
      const ax = rel ? cx + x : x;
      const ay = rel ? cy + y : y;
      sub.nodes.push(node(ax, ay));
      cx = ax;
      cy = ay;
      prevCubic = null;
      continue;
    }
    if (C === "H") {
      ensure();
      const x = read();
      const ax = rel ? cx + x : x;
      sub.nodes.push(node(ax, cy));
      cx = ax;
      prevCubic = null;
      continue;
    }
    if (C === "V") {
      ensure();
      const y = read();
      const ay = rel ? cy + y : y;
      sub.nodes.push(node(cx, ay));
      cy = ay;
      prevCubic = null;
      continue;
    }
    if (C === "C") {
      ensure();
      let x1 = read();
      let y1 = read();
      let x2 = read();
      let y2 = read();
      let x = read();
      let y = read();
      if (rel) {
        x1 += cx;
        y1 += cy;
        x2 += cx;
        y2 += cy;
        x += cx;
        y += cy;
      }
      const prev = last();
      prev.outx = x1;
      prev.outy = y1;
      const n = node(x, y, { inx: x2, iny: y2, kind: "smooth" });
      sub.nodes.push(n);
      prevCubic = { x: x2, y: y2 };
      cx = x;
      cy = y;
      continue;
    }
    if (C === "S") {
      ensure();
      let x2 = read();
      let y2 = read();
      let x = read();
      let y = read();
      if (rel) {
        x2 += cx;
        y2 += cy;
        x += cx;
        y += cy;
      }
      const x1 = prevCubic ? 2 * cx - prevCubic.x : cx;
      const y1 = prevCubic ? 2 * cy - prevCubic.y : cy;
      const prev = last();
      prev.outx = x1;
      prev.outy = y1;
      sub.nodes.push(node(x, y, { inx: x2, iny: y2, kind: "smooth" }));
      prevCubic = { x: x2, y: y2 };
      cx = x;
      cy = y;
      continue;
    }
    if (C === "Q") {
      ensure();
      let x1 = read();
      let y1 = read();
      let x = read();
      let y = read();
      if (rel) {
        x1 += cx;
        y1 += cy;
        x += cx;
        y += cy;
      }
      const c1x = cx + (2 / 3) * (x1 - cx);
      const c1y = cy + (2 / 3) * (y1 - cy);
      const c2x = x + (2 / 3) * (x1 - x);
      const c2y = y + (2 / 3) * (y1 - y);
      const prev = last();
      prev.outx = c1x;
      prev.outy = c1y;
      sub.nodes.push(node(x, y, { inx: c2x, iny: c2y, kind: "smooth" }));
      prevCubic = null;
      cx = x;
      cy = y;
      continue;
    }
    if (C === "T") {
      ensure();
      let x = read();
      let y = read();
      if (rel) {
        x += cx;
        y += cy;
      }
      sub.nodes.push(node(x, y));
      cx = x;
      cy = y;
      prevCubic = null;
      continue;
    }
    if (C === "A") {
      ensure();
      const rx = read();
      const ry = read();
      const ang = read();
      const large = read();
      const sweep = read();
      let x = read();
      let y = read();
      if (rel) {
        x += cx;
        y += cy;
      }
      const pts = arcPoints(cx, cy, x, y, rx, ry, ang, large, sweep);
      for (const p of pts) sub.nodes.push(node(p.x, p.y));
      cx = x;
      cy = y;
      prevCubic = null;
      continue;
    }
    if (i < t.length && !isCmd(t[i])) i += 1;
  }
  return subs.filter((s) => s.nodes.length);
}

function fmt(n) {
  if (!Number.isFinite(n)) return "0";
  const r = Math.round(n * 100) / 100;
  return String(r);
}

function seg(a, b) {
  const straight = a.outx == null && b.inx == null;
  if (straight) return `L${fmt(b.x)} ${fmt(b.y)}`;
  const c1x = a.outx == null ? a.x : a.outx;
  const c1y = a.outy == null ? a.y : a.outy;
  const c2x = b.inx == null ? b.x : b.inx;
  const c2y = b.iny == null ? b.y : b.iny;
  return `C${fmt(c1x)} ${fmt(c1y)} ${fmt(c2x)} ${fmt(c2y)} ${fmt(b.x)} ${fmt(b.y)}`;
}

export function subsToD(subs) {
  let d = "";
  for (const sub of subs || []) {
    const ns = sub.nodes;
    if (!ns.length) continue;
    d += `M${fmt(ns[0].x)} ${fmt(ns[0].y)}`;
    for (let i = 1; i < ns.length; i++) d += seg(ns[i - 1], ns[i]);
    if (sub.closed && ns.length > 1) {
      d += seg(ns[ns.length - 1], ns[0]);
      d += "Z";
    }
  }
  return d;
}

export function subsBBox(subs) {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  const add = (x, y) => {
    if (x == null || y == null || !Number.isFinite(x) || !Number.isFinite(y)) return;
    minx = Math.min(minx, x);
    miny = Math.min(miny, y);
    maxx = Math.max(maxx, x);
    maxy = Math.max(maxy, y);
  };
  for (const sub of subs || []) {
    for (const n of sub.nodes) {
      add(n.x, n.y);
      add(n.inx, n.iny);
      add(n.outx, n.outy);
    }
  }
  if (!Number.isFinite(minx)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minx, y: miny, w: Math.max(0, maxx - minx), h: Math.max(0, maxy - miny) };
}

export function unionBBox(boxes) {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  for (const b of boxes) {
    if (!b || b.w < 0) continue;
    minx = Math.min(minx, b.x);
    miny = Math.min(miny, b.y);
    maxx = Math.max(maxx, b.x + b.w);
    maxy = Math.max(maxy, b.y + b.h);
  }
  if (!Number.isFinite(minx)) return { x: 0, y: 0, w: 0, h: 0 };
  return { x: minx, y: miny, w: maxx - minx, h: maxy - miny };
}

export function rectSubs(x, y, w, h) {
  return [
    {
      closed: true,
      nodes: [node(x, y), node(x + w, y), node(x + w, y + h), node(x, y + h)],
    },
  ];
}

export function ellipseSubs(cx, cy, rx, ry) {
  const kx = rx * KAPPA;
  const ky = ry * KAPPA;
  const right = node(cx + rx, cy, {
    inx: cx + rx,
    iny: cy - ky,
    outx: cx + rx,
    outy: cy + ky,
    kind: "smooth",
  });
  const bottom = node(cx, cy + ry, {
    inx: cx + kx,
    iny: cy + ry,
    outx: cx - kx,
    outy: cy + ry,
    kind: "smooth",
  });
  const left = node(cx - rx, cy, {
    inx: cx - rx,
    iny: cy + ky,
    outx: cx - rx,
    outy: cy - ky,
    kind: "smooth",
  });
  const top = node(cx, cy - ry, {
    inx: cx - kx,
    iny: cy - ry,
    outx: cx + kx,
    outy: cy - ry,
    kind: "smooth",
  });
  return [{ closed: true, nodes: [right, bottom, left, top] }];
}

export function polygonSubs(cx, cy, r, sides, rot = -Math.PI / 2) {
  const n = Math.max(3, sides | 0);
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const a = rot + (i * 2 * Math.PI) / n;
    nodes.push(node(cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
  return [{ closed: true, nodes }];
}

export function starSubs(cx, cy, r, points, inner = 0.4, rot = -Math.PI / 2) {
  const n = Math.max(3, points | 0);
  const nodes = [];
  for (let i = 0; i < n * 2; i++) {
    const a = rot + (i * Math.PI) / n;
    const rr = i % 2 === 0 ? r : r * inner;
    nodes.push(node(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
  }
  return [{ closed: true, nodes }];
}

export function spiralSubs(cx, cy, r, turns = 3, rot = -Math.PI / 2) {
  const tcount = Math.max(0.5, turns);
  const steps = Math.max(24, Math.round(tcount * 28));
  const nodes = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = rot + t * tcount * Math.PI * 2;
    const rr = r * t;
    nodes.push(node(cx + rr * Math.cos(a), cy + rr * Math.sin(a)));
  }
  return [{ closed: false, nodes }];
}

export function bez(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
}

export function splitCubic(p0, p1, p2, p3, t) {
  const lerp = (a, b, u) => ({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const f = lerp(d, e, t);
  return { left: [p0, a, d, f], right: [f, e, c, p3] };
}

export function closestOnCubic(p0, p1, p2, p3, q) {
  let bestT = 0;
  let bestD = Infinity;
  let best = p0;
  const score = (t) => {
    if (t < 0 || t > 1) return;
    const p = bez(p0, p1, p2, p3, t);
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
    if (d < bestD) {
      bestD = d;
      bestT = t;
      best = p;
    }
  };
  for (let i = 0; i <= 24; i++) score(i / 24);
  let span = 1 / 24;
  for (let k = 0; k < 6; k++) {
    span /= 2;
    score(bestT - span);
    score(bestT + span);
  }
  return { t: bestT, dist: Math.sqrt(bestD), p: best };
}

export function segmentControls(a, b) {
  return [
    { x: a.x, y: a.y },
    { x: a.outx == null ? a.x : a.outx, y: a.outy == null ? a.y : a.outy },
    { x: b.inx == null ? b.x : b.inx, y: b.iny == null ? b.y : b.iny },
    { x: b.x, y: b.y },
  ];
}

export function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function lineHit(p, r, q, s) {
  const cross = r.x * s.y - r.y * s.x;
  if (Math.abs(cross) < 1e-9) return null;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const t = (dx * s.y - dy * s.x) / cross;
  return { x: p.x + t * r.x, y: p.y + t * r.y };
}

/** delta > 0 expands a closed shape (visual outset). */
export function offsetPoly(pts, delta, closed) {
  if (pts.length < 2 || !delta) return pts.map((p) => ({ ...p }));
  const area = signedArea(pts);
  const dir = !closed ? 1 : area > 0 ? -1 : 1;
  const d = delta * dir;
  const n = pts.length;
  const normal = (a, b) => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return { x: (-dy / l) * d, y: (dx / l) * d, dx: dx / l, dy: dy / l };
  };
  const out = [];
  const limit = Math.abs(delta) * 8;
  const count = closed ? n : n;
  for (let i = 0; i < count; i++) {
    if (!closed && (i === 0 || i === n - 1)) {
      const a = pts[i];
      const b = pts[i === 0 ? 1 : n - 2];
      const nn = i === 0 ? normal(a, b) : normal(b, a);
      out.push({ x: a.x + nn.x, y: a.y + nn.y });
      continue;
    }
    const prev = pts[(i - 1 + n) % n];
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const n1 = normal(prev, cur);
    const n2 = normal(cur, next);
    const p = { x: cur.x + n1.x, y: cur.y + n1.y };
    const r = { x: n1.dx, y: n1.dy };
    const q = { x: cur.x + n2.x, y: cur.y + n2.y };
    const s = { x: n2.dx, y: n2.dy };
    const hit = lineHit(p, r, q, s);
    if (!hit || Math.hypot(hit.x - cur.x, hit.y - cur.y) > limit) {
      out.push(p, q);
    } else out.push(hit);
  }
  return out;
}

export function mapPoint(x, y, fn) {
  return fn(x, y);
}
