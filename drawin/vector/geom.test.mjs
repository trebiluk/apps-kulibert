import test from "node:test";
import assert from "node:assert/strict";
import {
  parsePath,
  subsToD,
  subsBBox,
  rectSubs,
  ellipseSubs,
  starSubs,
  arcPoints,
  offsetPoly,
  closestOnCubic,
  splitCubic,
  signedArea,
} from "./geom.js";

test("rect roundtrip", () => {
  const d = subsToD(rectSubs(10, 20, 30, 40));
  const back = parsePath(d);
  assert.equal(back.length, 1);
  assert.equal(back[0].closed, true);
  assert.equal(back[0].nodes.length, 4);
  const b = subsBBox(back);
  assert.equal(b.w, 30);
  assert.equal(b.h, 40);
});

test("cubic roundtrip keeps handles", () => {
  const d = "M0 0 C10 20 30 20 40 0";
  const subs = parsePath(d);
  assert.equal(subs[0].nodes.length, 2);
  assert.equal(subs[0].nodes[0].outx, 10);
  assert.equal(subs[0].nodes[1].inx, 30);
  const b = subsBBox(subs);
  assert.ok(b.h >= 15);
});

test("relative and H/V", () => {
  const subs = parsePath("M10 10 h20 v10 h-20 z");
  assert.equal(subs[0].closed, true);
  assert.equal(subs[0].nodes.length, 4);
  assert.equal(subsBBox(subs).w, 20);
});

test("ellipse bbox", () => {
  const b = subsBBox(ellipseSubs(50, 40, 20, 10));
  assert.ok(Math.abs(b.w - 40) < 0.2);
  assert.ok(Math.abs(b.h - 20) < 0.2);
});

test("star has 10 nodes", () => {
  assert.equal(starSubs(0, 0, 10, 5)[0].nodes.length, 10);
});

test("quarter arc passes near the diagonal", () => {
  const pts = arcPoints(10, 0, 0, 10, 10, 10, 0, 0, 1);
  const mid = pts[Math.floor(pts.length / 2)];
  assert.ok(Math.hypot(mid.x - 7.07, mid.y - 7.07) < 1.2, JSON.stringify(mid));
});

test("outset grows a clockwise square", () => {
  const sq = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 },
  ];
  assert.ok(signedArea(sq) > 0);
  const off = offsetPoly(sq, 10, true);
  let minx = Infinity;
  let maxx = -Infinity;
  for (const p of off) {
    minx = Math.min(minx, p.x);
    maxx = Math.max(maxx, p.x);
  }
  assert.ok(minx < -5, "min " + minx);
  assert.ok(maxx > 105, "max " + maxx);
});

test("split cubic midpoint", () => {
  const p0 = { x: 0, y: 0 };
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 100, y: 0 };
  const p3 = { x: 100, y: 0 };
  const s = splitCubic(p0, p1, p2, p3, 0.5);
  assert.ok(Math.abs(s.left[3].x - 50) < 0.01);
});

test("closest point on a line cubic", () => {
  const hit = closestOnCubic(
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 20, y: 0 },
    { x: 30, y: 0 },
    { x: 15, y: 4 },
  );
  assert.ok(hit.dist < 4.2);
  assert.ok(Math.abs(hit.p.x - 15) < 1);
});
