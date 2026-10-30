(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PINCHY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var APP_VERSION = "1.2.0";
  var UPPER = 108;
  var FORE = 78;
  var WRIST = 24;
  var SY = 108;
  var JAW = 26;
  var GAP_OPEN = 34;
  var GAP_CLOSED = 12;
  var THICK = 8;
  var BASE_MIN = -45;
  var BASE_MAX = 45;
  var SH_MIN = -15;
  var SH_MAX = 120;
  var EL_MIN = -120;
  var EL_MAX = 105;
  var WR_MIN = -75;
  var WR_MAX = 75;

  // fa-AF, rw, and ti are machine drafts (Curriculum Bot, Oct 30). ar and fa-AF are RTL.
  var LANGS = [
    { id: "en", name: "English", draft: false, rtl: false, up: "Wrist up", down: "Wrist down", part: "wrist" },
    { id: "uk", name: "Українська", draft: false, rtl: false, up: "Зап'ястя вгору", down: "Зап'ястя вниз", part: "зап'ястя" },
    { id: "ru", name: "Русский", draft: false, rtl: false, up: "Запястье вверх", down: "Запястье вниз", part: "запястье" },
    { id: "es", name: "Español", draft: false, rtl: false, up: "Muñeca arriba", down: "Muñeca abajo", part: "muñeca" },
    { id: "ar", name: "العربية", draft: false, rtl: true, up: "الرسغ لأعلى", down: "الرسغ لأسفل", part: "الرسغ" },
    { id: "fa-AF", name: "دری", draft: true, rtl: true, up: "مچ بالا", down: "مچ پایین", part: "مچ" },
    { id: "rw", name: "Ikinyarwanda", draft: true, rtl: false, up: "Ikiganza hejuru", down: "Ikiganza hasi", part: "ikiganza" },
    { id: "ti", name: "ትግርኛ", draft: true, rtl: false, up: "ሰለፍ ናብ ላዕሊ", down: "ሰለፍ ናብ ታሕቲ", part: "ሰለፍ" }
  ];

  var COLS = [["A", -30], ["B", 0], ["C", 30]];
  var ROWS = [["1", 96], ["2", 128], ["3", 162]];
  var COL_TOL = 7;
  var ROW_TOL = 15;

  var BLOCKS = [
    { id: "base-left", joint: "base", delta: -15, label: "Base left" },
    { id: "base-right", joint: "base", delta: 15, label: "Base right" },
    { id: "shoulder-up", joint: "shoulder", delta: 15, label: "Shoulder up" },
    { id: "shoulder-down", joint: "shoulder", delta: -15, label: "Shoulder down" },
    { id: "elbow-up", joint: "elbow", delta: 15, label: "Elbow up" },
    { id: "elbow-down", joint: "elbow", delta: -15, label: "Elbow down" },
    { id: "wrist-up", joint: "wrist", delta: 15, label: "Wrist up" },
    { id: "wrist-down", joint: "wrist", delta: -15, label: "Wrist down" },
    { id: "claw-open", joint: "claw", angle: GAP_OPEN, label: "Open claw" },
    { id: "claw-close", joint: "claw", angle: GAP_CLOSED, label: "Close claw" },
    { id: "repeat-3", joint: "repeat", label: "Repeat 3" },
    { id: "repeat-2", joint: "repeat", label: "Repeat 2" },
    { id: "end-repeat", joint: "repeat", label: "End repeat" },
    { id: "if-red-square", joint: "if", label: "If red \u25a0" },
    { id: "if-blue-circle", joint: "if", label: "If blue \u25cf" },
    { id: "end-if", joint: "if", label: "End if" }
  ];

  var CORE_BLOCKS = [
    "base-left", "base-right", "shoulder-up", "shoulder-down",
    "elbow-up", "elbow-down", "claw-open", "claw-close"
  ];

  var JOINTS = {
    "base-left": ["base", -15],
    "base-right": ["base", 15],
    "shoulder-up": ["shoulder", 15],
    "shoulder-down": ["shoulder", -15],
    "elbow-up": ["elbow", 15],
    "elbow-down": ["elbow", -15],
    "wrist-up": ["wrist", 15],
    "wrist-down": ["wrist", -15]
  };

  function blockById(id) {
    for (var i = 0; i < BLOCKS.length; i++) if (BLOCKS[i].id === id) return BLOCKS[i];
    return null;
  }

  function langMeta(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].id === code) return LANGS[i];
    return LANGS[0];
  }

  function labelFor(id, lang) {
    var meta = langMeta(lang || "en");
    if (id === "wrist-up") return meta.up;
    if (id === "wrist-down") return meta.down;
    var block = blockById(id);
    return block ? block.label : id;
  }

  function blocksFor(level) {
    if (level && level.blocks && level.blocks.length) return level.blocks.slice();
    return CORE_BLOCKS.slice();
  }

  function copyPart(part) {
    if (!part) return null;
    return {
      base: part.base, r: part.r, y: part.y, hw: part.hw, hh: part.hh,
      inBin: !!part.inBin, dropped: !!part.dropped,
      shape: part.shape || "", color: part.color || "", mark: part.mark || ""
    };
  }

  function cloneState(state) {
    return {
      base: state.base,
      shoulder: state.shoulder,
      elbow: state.elbow,
      wrist: state.wrist || 0,
      open: !!state.open,
      gap: state.gap,
      holding: !!state.holding,
      part: copyPart(state.part),
      sorted: state.sorted || 0,
      queue: (state.queue || []).map(copyPart),
      binned: (state.binned || []).map(copyPart)
    };
  }

  function pose(state) {
    var sd = state.shoulder;
    var ed = state.elbow;
    var wd = state.wrist || 0;
    var gap = state.gap == null ? (state.open ? GAP_OPEN : GAP_CLOSED) : state.gap;
    var s = sd * Math.PI / 180;
    var fore = (sd + ed) * Math.PI / 180;
    var hand = (sd + ed + wd) * Math.PI / 180;
    var ex = UPPER * Math.cos(s);
    var ey = SY + UPPER * Math.sin(s);
    var fx = Math.cos(fore);
    var fy = Math.sin(fore);
    var px = Math.cos(hand);
    var py = Math.sin(hand);
    var wx = ex + FORE * fx;
    var wy = ey + FORE * fy;
    var gx = wx + WRIST * px;
    var gy = wy + WRIST * py;
    var nx = -py;
    var ny = px;
    var along = JAW * 0.5;
    return {
      ex: ex, ey: ey, wx: wx, wy: wy, gx: gx, gy: gy,
      px: px, py: py, nx: nx, ny: ny, gap: gap,
      cx: gx + px * along, cy: gy + py * along,
      open: gap > 22, sd: sd, ed: ed
    };
  }

  function samples(x1, y1, x2, y2, n) {
    var pts = [];
    for (var i = 0; i <= n; i++) {
      var t = i / n;
      pts.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
    return pts;
  }

  function inBase(x, y) {
    return Math.abs(x) <= 34 && y >= -4 && y <= SY + 8;
  }

  function binsOf(level) {
    if (level && level.bins && level.bins.length) return level.bins;
    if (level && level.bin) return [level.bin];
    return [];
  }

  function obstacles(level, base) {
    var obs = [];
    var bins = binsOf(level);
    for (var n = 0; n < bins.length; n++) {
      var bin = bins[n];
      if (Math.abs(base - bin.base) > COL_TOL) continue;
      var mouthL = bin.r - bin.half;
      var mouthR = bin.r + bin.half;
      obs.push({ l: mouthL - THICK, r: mouthL, h: bin.h, name: "bin" });
      obs.push({ l: mouthR, r: mouthR + THICK, h: bin.h, name: "bin" });
    }
    return obs;
  }

  function pointHit(x, y, who, level, state, canPart) {
    if (y < 3 && !inBase(x, y)) return who + " hit the table";
    var obs = obstacles(level, state.base);
    for (var i = 0; i < obs.length; i++) {
      var o = obs[i];
      if (x >= o.l && x <= o.r && y >= -2 && y <= o.h) return who + " hit the " + o.name;
    }
    var part = state.part;
    if (canPart && part && !part.inBin && !state.holding && Math.abs(state.base - part.base) <= COL_TOL) {
      if (Math.abs(x - part.r) <= part.hw && Math.abs(y - part.y) <= part.hh) return who + " hit the part";
    }
    return "";
  }

  function binUnder(p, base, level) {
    var bins = binsOf(level);
    for (var i = 0; i < bins.length; i++) {
      var bin = bins[i];
      if (Math.abs(base - bin.base) > COL_TOL) continue;
      if (p.cx > bin.r - bin.half && p.cx < bin.r + bin.half && p.cy > 6 && p.cy < 240) return bin;
    }
    return null;
  }

  function overBin(p, base, level) {
    return !!binUnder(p, base, level);
  }

  function sensorMatch(state, cmd) {
    if (!state || !state.holding || !state.part) return false;
    var part = state.part;
    if (cmd === "if-red-square") return part.color === "red" && part.shape === "square";
    if (cmd === "if-blue-circle") return part.color === "blue" && part.shape === "circle";
    return false;
  }

  function contains(p, state) {
    var part = state.part;
    if (!part || part.inBin) return false;
    if (Math.abs(state.base - part.base) > COL_TOL) return false;
    var dx = part.r - p.gx;
    var dy = part.y - p.gy;
    var along = dx * p.px + dy * p.py;
    var across = dx * p.nx + dy * p.ny;
    return along >= 1 && along <= JAW + 2 && Math.abs(across) <= (p.gap / 2) + 3;
  }

  function collide(state, level) {
    var p = pose(state);
    var part = state.part;
    var hitPart = !state.holding && part && !part.inBin;
    var lists = [
      [samples(0, SY, p.ex, p.ey, 8), "shoulder", false],
      [samples(p.ex, p.ey, p.wx, p.wy, 8), "elbow", hitPart],
      [samples(p.wx, p.wy, p.gx, p.gy, 4), "wrist", hitPart]
    ];
    var i, j, hit, pts;
    for (i = 0; i < lists.length; i++) {
      pts = lists[i][0];
      for (j = 0; j < pts.length; j++) {
        hit = pointHit(pts[j][0], pts[j][1], lists[i][1], level, state, lists[i][2]);
        if (hit) return hit;
      }
    }
    var half = p.gap / 2;
    var sign;
    for (sign = -1; sign <= 1; sign += 2) {
      var x1 = p.gx + p.nx * sign * half;
      var y1 = p.gy + p.ny * sign * half;
      var x2 = x1 + p.px * JAW;
      var y2 = y1 + p.py * JAW;
      pts = samples(x1, y1, x2, y2, 5);
      for (j = 0; j < pts.length; j++) {
        var can = hitPart && !state.open;
        hit = pointHit(pts[j][0], pts[j][1], "claw", level, state, can);
        if (hit) return hit;
      }
      var ax = x2;
      var ay = y2;
      var dx = p.ex - 0;
      var dy = p.ey - SY;
      var len2 = dx * dx + dy * dy;
      if (len2 > 1) {
        var t = ((ax - 0) * dx + (ay - SY) * dy) / len2;
        if (t > 0.08 && t < 0.86) {
          var qx = 0 + t * dx;
          var qy = SY + t * dy;
          if (Math.hypot(ax - qx, ay - qy) < 8) return "claw hit the arm";
        }
      }
    }
    if (state.holding && part) {
      if (p.cy < part.hh && !overBin(p, state.base, level)) return "part hit the table";
      var obs = obstacles(level, state.base);
      for (i = 0; i < obs.length; i++) {
        var o = obs[i];
        if (p.cx >= o.l && p.cx <= o.r && p.cy >= -2 && p.cy <= o.h) return "part hit the " + o.name;
      }
    }
    return "";
  }

  function spotName(base, r) {
    var col = "";
    var row = "";
    var i;
    for (i = 0; i < COLS.length; i++) if (Math.abs(base - COLS[i][1]) <= COL_TOL) col = COLS[i][0];
    for (i = 0; i < ROWS.length; i++) if (Math.abs(r - ROWS[i][1]) <= ROW_TOL) row = ROWS[i][0];
    if (!col || !row) return "";
    return col + row;
  }

  function goalMet(state, level) {
    if (level.kind === "match") {
      var t = level.target;
      return state.base === t.base && state.shoulder === t.shoulder && state.elbow === t.elbow && !!state.open === !!t.open && !state.holding;
    }
    if (level.kind === "spot") {
      var p = pose(state);
      return spotName(state.base, p.cx) === level.spot && p.cy >= 10 && p.cy <= 52 && !state.holding;
    }
    if (level.kind === "place" || level.kind === "debug") return !!(state.part && state.part.inBin);
    if (level.kind === "pile" || level.kind === "sensor") {
      return (state.sorted || 0) >= (level.need || 1) && !(state.queue && state.queue.length) && !state.holding;
    }
    return false;
  }

  function limitMessage(joint, value) {
    return joint + " stopped at " + value + " degrees";
  }

  function withPartAtClaw(state, p) {
    var part = copyPart(state.part);
    part.base = state.base;
    part.r = p.cx;
    part.y = p.cy;
    part.inBin = false;
    part.dropped = false;
    return part;
  }

  function seal(state, result) {
    if (!result || !result.state || result.state === state) return result;
    var next = result.state;
    if (next.sorted == null) next.sorted = state.sorted || 0;
    if (!next.queue) next.queue = (state.queue || []).map(copyPart);
    if (!next.binned) next.binned = (state.binned || []).map(copyPart);
    return result;
  }

  function deliverPile(state, level, p) {
    var landed = binUnder(p, state.base, level);
    if (level.kind === "sensor" && landed && (landed.shape !== state.part.shape || landed.color !== state.part.color)) {
      var missed = copyPart(state.part);
      missed.base = state.base;
      missed.r = p.cx;
      missed.y = state.part.hh;
      missed.inBin = false;
      missed.dropped = true;
      return {
        ok: false, miss: true, t: 1, msg: "part went to the wrong bin",
        state: {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: true, gap: GAP_OPEN, holding: false, part: missed
        }
      };
    }
    var sorted = (state.sorted || 0) + 1;
    var queue = (state.queue || []).map(copyPart);
    var next = queue.length ? queue.shift() : null;
    var kept = copyPart(state.part);
    kept.inBin = true;
    kept.dropped = false;
    kept.base = state.base;
    kept.r = p.cx;
    kept.y = state.part.hh;
    var binned = (state.binned || []).map(copyPart);
    binned.push(kept);
    var need = level.need || 1;
    return {
      ok: true,
      win: sorted >= need && !next,
      t: 1,
      state: {
        base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
        open: true, gap: GAP_OPEN, holding: false,
        part: next, sorted: sorted, queue: queue, binned: binned
      }
    };
  }

  function applyCommand(state, cmd, level) {
    return seal(state, applyCommandBody(state, cmd, level));
  }

  function applyCommandBody(state, cmd, level) {
    var spec = JOINTS[cmd];
    var i, t, trial, hit, p, nBase, nSh, nEl, sd, ed, base, gap;
    if (spec) {
      nBase = state.base;
      nSh = state.shoulder;
      nEl = state.elbow;
      var nWr = state.wrist || 0;
      if (spec[0] === "base") nBase += spec[1];
      if (spec[0] === "shoulder") nSh += spec[1];
      if (spec[0] === "elbow") nEl += spec[1];
      if (spec[0] === "wrist") nWr += spec[1];
      if (nBase > BASE_MAX || nBase < BASE_MIN) {
        return { ok: false, msg: limitMessage("base", nBase > BASE_MAX ? BASE_MAX : BASE_MIN), t: 0, state: state };
      }
      if (nSh > SH_MAX || nSh < SH_MIN) {
        return { ok: false, msg: limitMessage("shoulder", nSh > SH_MAX ? SH_MAX : SH_MIN), t: 0, state: state };
      }
      if (nEl > EL_MAX || nEl < EL_MIN) {
        return { ok: false, msg: limitMessage("elbow", nEl > EL_MAX ? EL_MAX : EL_MIN), t: 0, state: state };
      }
      if (nWr > WR_MAX || nWr < WR_MIN) {
        return { ok: false, msg: limitMessage("wrist", nWr > WR_MAX ? WR_MAX : WR_MIN), t: 0, state: state };
      }
      for (i = 1; i <= 6; i++) {
        t = i / 6;
        base = state.base + (nBase - state.base) * t;
        sd = state.shoulder + (nSh - state.shoulder) * t;
        ed = state.elbow + (nEl - state.elbow) * t;
        var wr = (state.wrist || 0) + (nWr - (state.wrist || 0)) * t;
        trial = {
          base: base, shoulder: sd, elbow: ed, wrist: wr, open: state.open, gap: state.gap,
          holding: state.holding, part: state.holding ? copyPart(state.part) : state.part
        };
        if (state.holding) trial.part = withPartAtClaw(trial, pose(trial));
        hit = collide(trial, level);
        if (hit) return { ok: false, msg: hit, t: t, state: trial };
      }
      trial = {
        base: nBase, shoulder: nSh, elbow: nEl, wrist: nWr, open: state.open, gap: state.gap,
        holding: state.holding, part: state.holding ? copyPart(state.part) : state.part
      };
      if (state.holding) trial.part = withPartAtClaw(trial, pose(trial));
      return { ok: true, t: 1, state: trial };
    }
    if (cmd === "claw-close") {
      if (state.holding || !state.open) {
        return {
          ok: true, t: 1,
          state: {
            base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
            open: false, gap: GAP_CLOSED, holding: state.holding, part: copyPart(state.part)
          }
        };
      }
      p = pose(state);
      if (contains(p, state)) {
        var held = {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: false, gap: GAP_CLOSED, holding: true, part: copyPart(state.part)
        };
        held.part = withPartAtClaw(held, pose(held));
        return { ok: true, t: 1, state: held };
      }
      for (i = 1; i <= 4; i++) {
        t = i / 4;
        gap = GAP_OPEN + (GAP_CLOSED - GAP_OPEN) * t;
        trial = {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: gap > 22, gap: gap, holding: false, part: state.part
        };
        hit = collide(trial, level);
        if (hit) return { ok: false, msg: hit, t: t, state: trial };
      }
      return {
        ok: true, t: 1,
        state: {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: false, gap: GAP_CLOSED, holding: false, part: copyPart(state.part)
        }
      };
    }
    if (cmd === "claw-open") {
      if (!state.holding) {
        return {
          ok: true, t: 1,
          state: {
            base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
            open: true, gap: GAP_OPEN, holding: false, part: copyPart(state.part)
          }
        };
      }
      for (i = 1; i <= 4; i++) {
        t = i / 4;
        gap = GAP_CLOSED + (GAP_OPEN - GAP_CLOSED) * t;
        trial = {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: gap > 22, gap: gap, holding: true, part: copyPart(state.part)
        };
        trial.part = withPartAtClaw(trial, pose(trial));
        hit = collide(trial, level);
        if (hit) return { ok: false, msg: hit, t: t, state: trial };
      }
      p = pose({
        base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
        open: true, gap: GAP_OPEN, holding: false, part: state.part
      });
      if (overBin(p, state.base, level)) {
        if (level.kind === "pile" || level.kind === "sensor") return deliverPile(state, level, p);
        return {
          ok: true, win: true, t: 1,
          state: {
            base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
            open: true, gap: GAP_OPEN, holding: false,
            part: {
              base: state.base, r: p.cx, y: state.part.hh, hw: state.part.hw, hh: state.part.hh,
              inBin: true, dropped: false
            }
          }
        };
      }
      return {
        ok: false, miss: true, t: 1, msg: "part missed the bin",
        state: {
          base: state.base, shoulder: state.shoulder, elbow: state.elbow, wrist: state.wrist || 0,
          open: true, gap: GAP_OPEN, holding: false,
          part: {
            base: state.base, r: p.cx, y: state.part.hh, hw: state.part.hw, hh: state.part.hh,
            inBin: false, dropped: true
          }
        }
      };
    }
    return { ok: false, msg: "unknown block", t: 0, state: state };
  }

  function endReason(state, level) {
    if (goalMet(state, level)) return "";
    if (level.kind === "match") return "The arm does not match the mark yet.";
    if (level.kind === "spot") return "The claw is not on spot " + level.spot + " yet.";
    if (level.kind === "pile") {
      var placed = state.sorted || 0;
      if (state.holding) return "The part is still held. Open the claw over the bin.";
      if (state.part && state.part.dropped) return "The part missed the bin.";
      return "The pile still has parts out. " + placed + " of " + (level.need || 3) + " are in the bin.";
    }
    if (level.kind === "sensor") {
      if (state.holding) return "The part is still held. Open the claw over the matching bin.";
      if (state.part && state.part.dropped) return "The part missed the matching bin.";
      return "Red squares go in bin A. Blue circles go in bin B.";
    }
    if (state.holding) return "The part is still held. Open the claw over the bin.";
    if (state.part && state.part.dropped) return "The part missed the bin.";
    return "The claw never closed on the part.";
  }

  function emptyArm(base, shoulder, elbow) {
    return {
      base: base, shoulder: shoulder, elbow: elbow, wrist: 0,
      open: true, gap: GAP_OPEN, holding: false, part: null
    };
  }

  function buildLevels() {
    var grab = emptyArm(0, 15, -90);
    var gp = pose(grab);
    var part = { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false };
    var l1 = {
      id: "L1",
      name: "Move one joint",
      goal: "Move one joint. Shoulder up matches the mark.",
      start: { base: 0, shoulder: 30, elbow: -30 },
      kind: "match",
      target: { base: 0, shoulder: 45, elbow: -30, open: true },
      par: 1,
      timePar: 2500,
      part: null,
      bin: null,
      spot: "",
      blocks: CORE_BLOCKS.slice()
    };
    var l2 = {
      id: "L2",
      name: "Pick and place",
      goal: "Pick up the part and place it in the bin.",
      start: { base: 0, shoulder: 45, elbow: -60 },
      kind: "place",
      target: null,
      par: 8,
      timePar: 9000,
      part: part,
      bin: { base: 30, r: gp.cx, half: 36, h: 22 },
      spot: "",
      blocks: CORE_BLOCKS.slice()
    };
    var l3 = {
      id: "L3",
      name: "Go to spot",
      goal: "Go to spot A2 on the A1 to C3 grid.",
      start: { base: 0, shoulder: 45, elbow: -45 },
      kind: "spot",
      target: null,
      par: 7,
      timePar: 6500,
      part: null,
      bin: null,
      spot: "A2",
      blocks: CORE_BLOCKS.slice()
    };
    var pilePart = { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false };
    var l4 = {
      id: "L4",
      name: "Sort a pile",
      goal: "Use Repeat 3 to put all 3 parts from the pile into the bin.",
      start: { base: 0, shoulder: 15, elbow: -90, wrist: 0 },
      kind: "pile",
      target: null,
      par: 8,
      timePar: 14000,
      need: 3,
      part: pilePart,
      queue: [
        { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false },
        { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false }
      ],
      bin: { base: 30, r: gp.cx, half: 36, h: 22 },
      spot: "",
      blocks: ["repeat-3", "end-repeat", "wrist-up", "wrist-down"].concat(CORE_BLOCKS)
    };
    var redPart = { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false, shape: "square", color: "red", mark: "\u25a0" };
    var bluePart = { base: 0, r: gp.cx, y: gp.cy, hw: 8, hh: 8, inBin: false, dropped: false, shape: "circle", color: "blue", mark: "\u25cf" };
    var l5 = {
      id: "L5",
      name: "Sensor bins",
      goal: "If the sensor sees a red square, put it in bin A. If it sees a blue circle, put it in bin B. Use the shape and the color together.",
      start: { base: 0, shoulder: 15, elbow: -90, wrist: 0 },
      kind: "sensor",
      target: null,
      par: 13,
      timePar: 16000,
      need: 2,
      part: redPart,
      queue: [bluePart],
      bin: null,
      bins: [
        { id: "A", base: 15, r: gp.cx, half: 36, h: 22, shape: "square", color: "red", mark: "\u25a0" },
        { id: "B", base: -15, r: gp.cx, half: 36, h: 22, shape: "circle", color: "blue", mark: "\u25cf" }
      ],
      spot: "",
      blocks: ["repeat-2", "end-repeat", "if-red-square", "if-blue-circle", "end-if", "wrist-up", "wrist-down"].concat(CORE_BLOCKS)
    };
    var l6 = {
      id: "L6",
      name: "Fix the program",
      goal: "The program is broken. Swap as few steps as you can, then run it. Par is 1 swap.",
      start: { base: 0, shoulder: 45, elbow: -60 },
      kind: "debug",
      debug: true,
      metric: "swaps",
      target: null,
      par: 1,
      timePar: 9000,
      part: part,
      bin: l2.bin,
      spot: "",
      broken: ["shoulder-down", "shoulder-down", "elbow-down", "elbow-down", "claw-close", "base-right", "claw-open", "base-right"],
      blocks: ["wrist-up", "wrist-down"].concat(CORE_BLOCKS)
    };
    return [l1, l2, l3, l4, l5, l6];
  }

  var LEVELS = buildLevels();

  function initialState(level) {
    return {
      base: level.start.base,
      shoulder: level.start.shoulder,
      elbow: level.start.elbow,
      wrist: level.start.wrist || 0,
      open: true,
      gap: GAP_OPEN,
      holding: false,
      part: copyPart(level.part),
      sorted: 0,
      queue: (level.queue || []).map(copyPart),
      binned: []
    };
  }

  function isRepeat(cmd) {
    return cmd === "repeat-2" || cmd === "repeat-3";
  }

  function isIf(cmd) {
    return cmd === "if-red-square" || cmd === "if-blue-circle";
  }

  function matchEnd(commands, ip, openTest, closeId) {
    var depth = 1;
    for (var i = ip + 1; i < commands.length; i++) {
      if (openTest(commands[i])) depth += 1;
      else if (commands[i] === closeId) {
        depth -= 1;
        if (!depth) return i;
      }
    }
    return -1;
  }

  function beginRun(commands) {
    return { commands: commands.slice(), ip: 0, loops: [] };
  }

  function advance(run, state, level) {
    var commands = run.commands;
    if (run.ip >= commands.length) {
      return { done: true, ok: true, state: state, index: -1, cmd: "", t: 0 };
    }
    var index = run.ip;
    var cmd = commands[index];
    if (isRepeat(cmd)) {
      var end = matchEnd(commands, index, isRepeat, "end-repeat");
      if (end < 0) {
        return { done: true, ok: false, msg: "Repeat needs End repeat", t: 0, state: state, index: index, cmd: cmd };
      }
      var times = cmd === "repeat-2" ? 2 : 3;
      run.loops.push({ end: end, next: index + 1, left: times - 1 });
      run.ip = index + 1;
      return { done: false, ok: true, structural: true, t: 0, state: state, index: index, cmd: cmd };
    }
    if (cmd === "end-repeat") {
      var loop = run.loops.length ? run.loops[run.loops.length - 1] : null;
      if (!loop || loop.end !== index) {
        return { done: true, ok: false, msg: "End repeat without Repeat", t: 0, state: state, index: index, cmd: cmd };
      }
      if (loop.left > 0) {
        loop.left -= 1;
        run.ip = loop.next;
      } else {
        run.loops.pop();
        run.ip = index + 1;
      }
      return { done: false, ok: true, structural: true, t: 0, state: state, index: index, cmd: cmd };
    }
    if (isIf(cmd)) {
      var endIf = matchEnd(commands, index, isIf, "end-if");
      if (endIf < 0) {
        return { done: true, ok: false, msg: "If needs End if", t: 0, state: state, index: index, cmd: cmd };
      }
      run.ip = sensorMatch(state, cmd) ? index + 1 : endIf + 1;
      return { done: false, ok: true, structural: true, t: 0, state: state, index: index, cmd: cmd };
    }
    if (cmd === "end-if") {
      run.ip = index + 1;
      return { done: false, ok: true, structural: true, t: 0, state: state, index: index, cmd: cmd };
    }
    var result = applyCommand(state, cmd, level);
    run.ip = index + 1;
    return {
      done: false, ok: result.ok, win: !!result.win, msg: result.msg || "", miss: !!result.miss,
      t: result.t || 0, state: result.state, index: index, cmd: cmd, structural: false
    };
  }

  function runAll(level, commands) {
    var state = initialState(level);
    var startHit = collide(state, level);
    if (startHit) return { win: false, crash: startHit, step: 0, state: state, blocks: commands.length };
    var run = beginRun(commands);
    var guard = 0;
    while (guard < 500) {
      guard += 1;
      var ev = advance(run, state, level);
      if (ev.done && !ev.cmd) {
        return {
          win: false, crash: "", step: commands.length, blocks: commands.length,
          state: state, end: endReason(state, level)
        };
      }
      if (!ev.ok) {
        return {
          win: false, crash: ev.msg, step: ev.index >= 0 ? ev.index + 1 : 0, state: ev.state,
          miss: !!ev.miss, blocks: commands.length
        };
      }
      state = ev.state;
      if (ev.win || (!ev.structural && goalMet(state, level))) {
        return { win: true, crash: "", step: ev.index + 1, blocks: commands.length, state: state };
      }
    }
    return { win: false, crash: "program ran too long", step: 0, state: state, blocks: commands.length };
  }

  function swapSteps(commands, index) {
    var next = commands.slice();
    if (index < 0 || index + 1 >= next.length) return next;
    var tmp = next[index];
    next[index] = next[index + 1];
    next[index + 1] = tmp;
    return next;
  }

  function stepList(commands) {
    var out = [];
    for (var i = 0; i < commands.length; i++) {
      var block = blockById(commands[i]);
      if (!block) out.push({ joint: "unknown", delta: 0 });
      else if (block.joint === "claw") out.push({ joint: "claw", angle: block.angle });
      else out.push({ joint: block.joint, delta: block.delta });
    }
    return out;
  }

  function crashLine(msg, step, lang) {
    var code = lang && langMeta(lang).id === lang ? lang : "en";
    var text = String(msg);
    if (code === "en") text = text.charAt(0).toUpperCase() + text.slice(1);
    else text = text.replace(/\bwrist\b/gi, langMeta(code).part);
    if (text.charAt(text.length - 1) !== ".") text += ".";
    if (step > 0) text = text.slice(0, -1) + " at step " + step + ".";
    return text;
  }

  function starsFor(win, blocks, ms, level) {
    if (!win) return 0;
    var n = 1;
    if (blocks <= level.par) n = 2;
    if (n === 2 && ms <= level.timePar) n = 3;
    return n;
  }

  function starWords(n) {
    if (n <= 0) return "No stars yet.";
    if (n === 1) return "One star.";
    if (n === 2) return "Two stars.";
    return "Three stars.";
  }

  function settleRun(prev, event) {
    var type = event && event.type;
    var note = event && event.note;
    var prevSwaps = prev && typeof prev.swaps === "number" ? prev.swaps : 0;
    var attemptOver = !prev || prev.kind === "won" || prev.kind === "failed" || prev.kind === "crashed" || prev.kind === "running";
    if (type === "start") {
      var scored = prev && prev.kind === "running" ? (prev.scoredSwaps || 0) : prevSwaps;
      return {
        kind: "running",
        note: note || "Running.",
        swaps: 0,
        steps: event && event.steps ? event.steps : 0,
        scoredSwaps: scored
      };
    }
    if (type === "edit" || type === "undo") {
      var base = attemptOver ? 0 : prevSwaps;
      var delta = event && event.delta != null ? event.delta : (type === "undo" ? 0 : 1);
      return {
        kind: "idle",
        note: note || (type === "undo" ? "Undone." : "Add a block, then press Run."),
        swaps: Math.max(0, base + delta),
        steps: 0
      };
    }
    if (type === "retry") return { kind: "idle", note: note || "Arm reset. Program kept.", swaps: 0, steps: 0 };
    if (type === "level") return { kind: "idle", note: note || "Add blocks, then press Run.", swaps: 0, steps: 0 };
    if (type === "win") {
      return {
        kind: "won",
        n: event.n || 0,
        note: note || "Done.",
        swaps: event && event.swaps != null ? event.swaps : prevSwaps,
        steps: event && event.steps ? event.steps : 0
      };
    }
    if (type === "crash") return { kind: "crashed", note: note || "", swaps: 0, steps: event && event.steps ? event.steps : 0 };
    if (type === "fail") return { kind: "failed", note: note || "", swaps: 0, steps: event && event.steps ? event.steps : 0 };
    return prev || { kind: "idle", note: "Add a block, then press Run.", swaps: 0, steps: 0 };
  }

  function runView(state) {
    var kind = state && state.kind ? state.kind : "idle";
    var n = kind === "won" ? (state.n || 0) : 0;
    var words = starWords(n);
    var note = state && state.note ? state.note : "Add a block, then press Run.";
    var status = kind === "won" ? note + " " + words : note;
    return { kind: kind, stars: n, words: words, aria: words, status: status };
  }

  function jointReadout(state) {
    var claw = state.open ? "open" : "closed";
    return "Base " + Math.round(state.base) + " degrees. Shoulder " + Math.round(state.shoulder) +
      " degrees. Elbow " + Math.round(state.elbow) + " degrees. Wrist " + Math.round(state.wrist || 0) +
      " degrees. Claw " + claw + ".";
  }

  function stateKey(state) {
    var part = state.part;
    var p = "none";
    if (part) {
      p = [
        Math.round(part.base), Math.round(part.r), Math.round(part.y),
        part.inBin ? 1 : 0, part.dropped ? 1 : 0
      ].join(":");
    }
    return [
      state.base, state.shoulder, state.elbow, state.wrist || 0, state.open ? 1 : 0, state.holding ? 1 : 0,
      state.sorted || 0, (state.queue || []).length, p
    ].join(",");
  }

  return {
    APP_VERSION: APP_VERSION,
    LAYOUT: {
      upper: UPPER, fore: FORE, wrist: WRIST, sy: SY, jaw: JAW,
      gapOpen: GAP_OPEN, gapClosed: GAP_CLOSED, thick: THICK,
      baseMin: BASE_MIN, baseMax: BASE_MAX,
      shoulderMin: SH_MIN, shoulderMax: SH_MAX,
      elbowMin: EL_MIN, elbowMax: EL_MAX,
      wristMin: WR_MIN, wristMax: WR_MAX
    },
    LANGS: LANGS,
    COLS: COLS,
    ROWS: ROWS,
    BLOCKS: BLOCKS,
    LEVELS: LEVELS,
    blockById: blockById,
    blocksFor: blocksFor,
    langMeta: langMeta,
    labelFor: labelFor,
    pose: pose,
    collide: collide,
    contains: contains,
    spotName: spotName,
    goalMet: goalMet,
    initialState: initialState,
    applyCommand: applyCommand,
    runAll: runAll,
    beginRun: beginRun,
    advance: advance,
    sensorMatch: sensorMatch,
    binsOf: binsOf,
    endReason: endReason,
    stepList: stepList,
    swapSteps: swapSteps,
    crashLine: crashLine,
    starsFor: starsFor,
    starWords: starWords,
    settleRun: settleRun,
    runView: runView,
    jointReadout: jointReadout,
    cloneState: cloneState,
    stateKey: stateKey,
    obstacles: obstacles
  };
});
