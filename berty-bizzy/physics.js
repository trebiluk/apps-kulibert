// Berty & Bizzy 1.7.0 - small deterministic physics for the touch level.
// Rules: fixed step of 1/120 s, an accumulator that runs at most 4 steps per frame,
// no random numbers, no clock reads. The same program gives the same result and sim time at any fps.
// Bodies: one cube (dynamic), one target cube (rests), the arm jaws (kinematic, driven by the arm pose),
// static floor / belt / stop / bin walls. That is 2 jaws + 2 cubes + 5 statics, well under 12 bodies.
// cannon-es is not vendored in this build (see vendor/cannon-es.js); this module is the stand-in with
// the same step / accumulator contract, so swapping the solver later does not change the game.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.BBPHYS = api;
})(typeof self !== "undefined" ? self : this, function () {
  var STEP = 1 / 120;
  var MAX_SUB = 4;
  var G = 700;
  var JAW = 26;
  var PAD = 4;
  var MAX_BODIES = 12;
  var MAX_ARMS = 2;

  function clone(sim) {
    if (!sim) return null;
    var c = sim.cube;
    return {
      tick: sim.tick,
      cube: { r: c.r, y: c.y, vx: c.vx, vy: c.vy, ang: c.ang, w: c.w, hw: c.hw, hh: c.hh, base: c.base, mode: c.mode, sup: c.sup },
      B: sim.B ? { r: sim.B.r, y: sim.B.y, hw: sim.B.hw, hh: sim.B.hh, base: sim.B.base } : null,
      touch: !!sim.touch,
      fail: sim.fail || "",
      failStep: sim.failStep || 0,
      closeStep: sim.closeStep || 0,
      stacked: !!sim.stacked,
      tipDir: sim.tipDir || 0,
      tipKind: sim.tipKind || ""
    };
  }

  function create(level) {
    var L = level.physics;
    var p = level.part;
    return {
      tick: 0,
      cube: { r: p.r, y: p.y, vx: 0, vy: 0, ang: 0, w: 0, hw: p.hw, hh: p.hh, base: p.base, mode: "belt", sup: "" },
      B: L.target ? { r: L.target.r, y: L.target.hh, hw: L.target.hw, hh: L.target.hh, base: L.target.base } : null,
      touch: false, fail: "", failStep: 0, closeStep: 0, stacked: false, tipDir: 0, tipKind: ""
    };
  }

  function overlapAABB(a, b) {
    return Math.min(a.r1, b.r1) - Math.max(a.r0, b.r0) > 0.5 && Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0) > 0.5;
  }

  function padBoxes(g) {
    var out = [];
    for (var s = -1; s <= 1; s += 2) {
      var x0 = g.gx + g.nx * s * (g.gap / 2);
      var y0 = g.gy + g.ny * s * (g.gap / 2);
      var x1 = g.gx + g.nx * s * (g.gap / 2 + PAD);
      var y1 = g.gy + g.ny * s * (g.gap / 2 + PAD);
      var xs = [x0, x1, x0 + g.px * JAW, x1 + g.px * JAW];
      var ys = [y0, y1, y0 + g.py * JAW, y1 + g.py * JAW];
      out.push({ r0: Math.min.apply(null, xs), r1: Math.max.apply(null, xs), y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys) });
    }
    return out;
  }

  // The touch sensor: the cube sits in the gripper, centred between the pads, resting against the stop.
  function senses(sim, g) {
    var c = sim.cube;
    if (c.mode !== "belt" && c.mode !== "held") return false;
    if (c.mode === "held") return true;
    if (!g || Math.abs(g.base - c.base) > 7 || c.vx !== 0) return false;
    var dx = c.r - g.gx;
    var dy = c.y - g.gy;
    var along = dx * g.px + dy * g.py;
    var across = dx * g.nx + dy * g.ny;
    return along >= 1 && along <= JAW + 2 && Math.abs(across) <= 3;
  }

  function supports(sim, L) {
    var c = sim.cube;
    var list = [{ kind: "floor", l: -1e4, r: 1e4, top: 0 }];
    if (Math.abs(c.base - L.belt.base) <= 7) {
      list.push({ kind: "belt", l: L.belt.r0, r: L.belt.r1, top: L.belt.top });
      list.push({ kind: "stop", l: L.stop.r - L.stop.hw, r: L.stop.r + L.stop.hw, top: L.stop.top });
    }
    if (L.bin && Math.abs(c.base - L.bin.base) <= 7) {
      list.push({ kind: "wall", l: L.bin.r - L.bin.half - 8, r: L.bin.r - L.bin.half, top: L.bin.h });
      list.push({ kind: "wall", l: L.bin.r + L.bin.half, r: L.bin.r + L.bin.half + 8, top: L.bin.h });
    }
    if (sim.B && Math.abs(c.base - sim.B.base) <= 7) {
      list.push({ kind: "stack", l: sim.B.r - sim.B.hw, r: sim.B.r + sim.B.hw, top: sim.B.y + sim.B.hh });
    }
    return list;
  }

  function stepFree(sim, L) {
    var c = sim.cube;
    var prevBottom = c.y - c.hh;
    c.vy -= G * STEP;
    c.r += c.vx * STEP;
    c.y += c.vy * STEP;
    var list = supports(sim, L);
    var best = null;
    var i;
    for (i = 0; i < list.length; i++) {
      var s = list[i];
      var ovR = Math.min(c.r + c.hw, s.r) - Math.max(c.r - c.hw, s.l);
      if (ovR <= 0) continue;
      var bottom = c.y - c.hh;
      if (bottom >= s.top) continue;
      var penY = s.top - bottom;
      if (prevBottom >= s.top - 0.01 || penY <= Math.min(ovR, c.hh)) {
        if (!best || s.top > best.top) best = s;
      } else if (bottom < s.top - 0.5 && c.y - c.hh < s.top) {
        // side hit on a wall or stop: push out, keep falling
        var dir = c.r < (s.l + s.r) / 2 ? -1 : 1;
        c.r = dir < 0 ? s.l - c.hw : s.r + c.hw;
        c.vx = 0;
      }
    }
    if (!best) return;
    c.y = best.top + c.hh;
    c.vy = 0;
    c.vx = 0;
    var mid = (best.l + best.r) / 2;
    var inside = best.kind === "floor" || best.kind === "belt" || Math.abs(c.r - mid) <= (best.r - best.l) / 2;
    if (best.kind === "stack") inside = Math.abs(c.r - mid) <= sim.B.hw;
    c.sup = best.kind;
    if (inside) {
      c.mode = "rest";
      if (best.kind === "stack") sim.stacked = true;
      return;
    }
    c.mode = "tip";
    c.w = 0;
    sim.tipDir = c.r < mid ? -1 : 1;
    sim.tipKind = best.kind === "stack" ? "stack" : "tip";
    c.ang = 0;
  }

  function step(sim, level, g) {
    var L = level.physics;
    var c = sim.cube;
    sim.tick += 1;
    if (c.mode === "held") { sim.touch = true; return; }
    if (c.mode === "belt") {
      if (g && Math.abs(g.base - c.base) <= 7 && g.gap < c.hw * 2 + 1) {
        var boxes = padBoxes(g);
        var me = { r0: c.r - c.hw, r1: c.r + c.hw, y0: c.y - c.hh, y1: c.y + c.hh };
        if ((overlapAABB(me, boxes[0]) || overlapAABB(me, boxes[1])) && !senses(sim, g)) {
          var dir = c.r >= g.cx ? 1 : -1;
          c.mode = "free";
          c.vy = 150;
          c.vx = dir * 70;
          sim.fail = "slip";
          sim.failStep = sim.closeStep || 0;
        }
      }
      if (c.mode === "belt") {
        var face = L.stop.r + L.stop.hw;
        if (c.r - c.hw > face + 0.001) {
          c.vx = L.belt.speed;
          c.r += c.vx * STEP;
          if (c.r - c.hw <= face) { c.r = face + c.hw; c.vx = 0; }
        } else {
          c.vx = 0;
        }
      }
    } else if (c.mode === "free") {
      stepFree(sim, L);
    } else if (c.mode === "tip") {
      c.w += 16 * STEP;
      c.ang += c.w * STEP * sim.tipDir;
      if (Math.abs(c.ang) >= 0.85) {
        c.mode = "free";
        c.vx = sim.tipDir * 40;
        c.ang = sim.tipDir * Math.PI / 2;
        sim.fail = sim.tipKind === "stack" ? "stack" : "tip";
        sim.stacked = false;
      }
    }
    sim.touch = senses(sim, g);
  }

  // Arm pose at a fraction f of the way from one joint state to another.
  function blendArm(a, b, f) {
    return {
      base: a.base + (b.base - a.base) * f,
      shoulder: a.shoulder + (b.shoulder - a.shoulder) * f,
      elbow: a.elbow + (b.elbow - a.elbow) * f,
      wrist: (a.wrist || 0) + ((b.wrist || 0) - (a.wrist || 0)) * f,
      gap: a.gap + (b.gap - a.gap) * f
    };
  }

  // The accumulator. Feed it the real frame time; it says how many fixed steps to play now (at most 4).
  function pacer() {
    var acc = 0;
    return {
      steps: function (frameSeconds) {
        acc += Math.min(Math.max(frameSeconds, 0), 0.25);
        var n = Math.floor(acc / STEP + 1e-9);
        if (n > MAX_SUB) { n = MAX_SUB; acc = 0; } else acc -= n * STEP;
        return n;
      }
    };
  }

  return {
    STEP: STEP, MAX_SUB: MAX_SUB, MAX_BODIES: MAX_BODIES, MAX_ARMS: MAX_ARMS,
    create: create, clone: clone, step: step, senses: senses, blendArm: blendArm, pacer: pacer
  };
});
