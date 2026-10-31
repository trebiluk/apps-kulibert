(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PINCHY = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var APP_VERSION = "1.3.2";
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

  // Every non-English language is a machine draft (1.3.2): the table marks it and the app shows the badge. ar and fa-AF are RTL.
  var LANGS = [
    { id: "en", name: "English", draft: false, rtl: false, appName: "Pinchy", appName: "Pinchy", up: "Wrist up", down: "Wrist down", part: "wrist" },
    { id: "uk", name: "Українська", draft: true, rtl: false, appName: "Пінчі", appName: "Пінчі", up: "Зап'ястя вгору", down: "Зап'ястя вниз", part: "зап'ястя" },
    { id: "ru", name: "Русский", draft: true, rtl: false, appName: "Пинчи", appName: "Пинчи", up: "Запястье вверх", down: "Запястье вниз", part: "запястье" },
    { id: "es", name: "Español", draft: true, rtl: false, appName: "Pinchy", appName: "Pinchy", up: "Muñeca arriba", down: "Muñeca abajo", part: "muñeca", baseLeft: "Base izquierda", baseRight: "Base derecha", baseDraft: true, blocksDraft: true,
      blocks: {
        "base-left": "Base izquierda", "base-right": "Base derecha",
        "shoulder-up": "Hombro arriba", "shoulder-down": "Hombro abajo",
        "elbow-up": "Codo arriba", "elbow-down": "Codo abajo",
        "claw-open": "Abrir pinza", "claw-close": "Cerrar pinza",
        "repeat-3": "Repetir 3", "repeat-2": "Repetir 2", "end-repeat": "Fin repetir",
        "if-red-square": "Si rojo \u25a0", "if-blue-circle": "Si azul \u25cf", "end-if": "Fin si"
      },
      actions: { run: "Ejecutar", undo: "Deshacer", retry: "Reintentar" },
      help: "Las flechas eligen un bloque. Enter lo agrega. Q gira la base a la izquierda en 3D. E gira la base a la derecha en 3D. R ejecuta. Z deshace. Reintentar conserva el programa.",
      helpDebug: "Las flechas eligen un paso. Enter lo cambia con el siguiente. El brazo 3D gira sobre su base al ejecutar. R ejecuta. Z deshace."
    },
    { id: "ar", name: "العربية", draft: true, rtl: true, appName: "بينشي", appName: "بينشي", up: "الرسغ لأعلى", down: "الرسغ لأسفل", part: "الرسغ", baseLeft: "القاعدة يسار", baseRight: "القاعدة يمين", baseDraft: true, blocksDraft: true,
      blocks: {
        "base-left": "القاعدة يسار", "base-right": "القاعدة يمين",
        "shoulder-up": "كتف أعلى", "shoulder-down": "كتف أسفل",
        "elbow-up": "كوع أعلى", "elbow-down": "كوع أسفل",
        "claw-open": "افتح المخلب", "claw-close": "أغلق المخلب",
        "repeat-3": "كرر 3", "repeat-2": "كرر 2", "end-repeat": "نهاية التكرار",
        "if-red-square": "إذا أحمر \u25a0", "if-blue-circle": "إذا أزرق \u25cf", "end-if": "نهاية الشرط"
      },
      actions: { run: "تشغيل", undo: "تراجع", retry: "إعادة" },
      help: "الأسهم تختار بلوكًا. Enter يضيفه. Q تدير القاعدة يسارًا في 3D. E تدير القاعدة يمينًا في 3D. R يشغّل. Z يتراجع. إعادة المحاولة تبقي البرنامج.",
      helpDebug: "الأسهم تختار خطوة. Enter تبدلها مع التالية. الذراع 3D يدور على قاعدته عند التشغيل. R يشغّل. Z يتراجع."
    },
    { id: "fa-AF", name: "دری", draft: true, rtl: true, appName: "پینچی", appName: "پینچی", up: "مچ بالا", down: "مچ پایین", part: "مچ", baseLeft: "پایه چپ", baseRight: "پایه راست", baseDraft: true, blocksDraft: true,
      blocks: {
        "base-left": "پایه چپ", "base-right": "پایه راست",
        "shoulder-up": "شانه بالا", "shoulder-down": "شانه پایین",
        "elbow-up": "آرنج بالا", "elbow-down": "آرنج پایین",
        "claw-open": "چنگال باز", "claw-close": "چنگال بسته",
        "repeat-3": "تکرار ۳", "repeat-2": "تکرار ۲", "end-repeat": "پایان تکرار",
        "if-red-square": "اگر سرخ \u25a0", "if-blue-circle": "اگر آبی \u25cf", "end-if": "پایان اگر"
      },
      actions: { run: "اجرا", undo: "برگردان", retry: "تلاش دوباره" },
      help: "تیرها یک بلاک را انتخاب می‌کنند. Enter آن را اضافه می‌کند. Q پایه را در 3D به چپ می‌چرخاند. E پایه را در 3D به راست می‌چرخاند. R اجرا می‌کند. Z برمی‌گرداند. تلاش دوباره برنامه را نگه می‌دارد.",
      helpDebug: "تیرها یک گام را انتخاب می‌کنند. Enter آن را با گام بعدی عوض می‌کند. بازوی 3D هنگام اجرا روی پایه می‌چرخد. R اجرا می‌کند. Z برمی‌گرداند."
    },
    { id: "rw", name: "Ikinyarwanda", draft: true, rtl: false, appName: "Pinchy", appName: "Pinchy", up: "Ikiganza hejuru", down: "Ikiganza hasi", part: "ikiganza" },
    { id: "ti", name: "ትግርኛ", draft: true, rtl: false, appName: "ፒንቺ", appName: "ፒንቺ", up: "ሰለፍ ናብ ላዕሊ", down: "ሰለፍ ናብ ታሕቲ", part: "ሰለፍ" }
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
    if (meta.blocks && meta.blocks[id]) return meta.blocks[id];
    if (id === "base-left" && meta.baseLeft) return meta.baseLeft;
    if (id === "base-right" && meta.baseRight) return meta.baseRight;
    var block = blockById(id);
    return block ? block.label : id;
  }

  function actionLabel(id, lang) {
    var meta = langMeta(lang || "en");
    if (meta.actions && meta.actions[id]) return meta.actions[id];
    if (id === "run") return "Run";
    if (id === "undo") return "Undo";
    if (id === "retry") return "Reset";
    return id;
  }

  function helpFor(lang, debug) {
    var meta = langMeta(lang || "en");
    if (debug && meta.helpDebug) return meta.helpDebug;
    if (!debug && meta.help) return meta.help;
    if (debug) return "Arrow keys pick a step. Enter swaps it with the next step. The 3D arm turns on its base when the program runs. R runs. Z undoes.";
    return "Arrow keys pick a block. Enter adds it. Q turns the base left in 3D. E turns the base right in 3D. R runs. Z undoes. Retry keeps the program.";
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

  function starWords(n, lang) {
    var en = "Three stars.";
    if (n <= 0) en = "No stars yet.";
    else if (n === 1) en = "One star.";
    else if (n === 2) en = "Two stars.";
    return uiText(lang, en);
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

  function runView(state, lang) {
    var kind = state && state.kind ? state.kind : "idle";
    var n = kind === "won" ? (state.n || 0) : 0;
    var words = starWords(n, lang);
    var note = state && state.note ? state.note : "Add a block, then press Run.";
    note = uiText(lang, note);
    var status = kind === "won" ? note + " " + words : note;
    return { kind: kind, stars: n, words: words, aria: words, status: status };
  }

  var UI = {
    en: {
      L1: "Move one joint", L2: "Pick and place", L3: "Go to spot", L4: "Sort a pile", L5: "Sensor bins", L6: "Fix the program",
      Base: "Base", Shoulder: "Shoulder", Elbow: "Elbow", Wrist: "Wrist", Claw: "Claw",
      Left: "Left", Right: "Right", Down: "Down", Up: "Up", Close: "Close", Open: "Open",
      Part: "Part", Bin: "Bin", Table: "Table", "Go here": "Go here",
      "Red square": "Red square", "Blue circle": "Blue circle", Pile: "Pile",
      "No stars yet.": "No stars yet.", "One star.": "One star.", "Two stars.": "Two stars.", "Three stars.": "Three stars.",
      "Add a block, then press Run.": "Add a block, then press Run.",
      "Add blocks, then press Run.": "Add blocks, then press Run.",
      "Stopped.": "Stopped.", "Undone.": "Undone.", "Running.": "Running.",
      "Arm reset. Program kept.": "Arm reset. Program kept.",
      "No blocks yet.": "No blocks yet.",
      "legend": "The 3D arm turns on its base. Spots A1 to C3 and the bins sit on the table. A block is the part. A thick mark means go here.",
      "legendPile": "The 3D arm turns on its base. Repeat 3 runs the blocks up to End repeat three times. The pile has 3 parts. Wrist up and Wrist down are here too.",
      "legendSensor": "The 3D arm turns on its base. A red square goes in bin A. A blue circle goes in bin B. The words and the shape match. Color is not the only cue.",
      "legendDebug": "The 3D arm turns on its base. The outlined step swaps with the next step. Fewer swaps is better. Wrist up and Wrist down are on the block list.",
      "L1-goal": "Move one joint. Shoulder up matches the mark.",
      "L2-goal": "Pick up the part and place it in the bin.",
      "L3-goal": "Go to spot A2 on the A1 to C3 grid.",
      "L4-goal": "Sort the pile into the bin.",
      "L5-goal": "Send each part to the matching bin.",
      "L6-goal": "Fix the program with the fewest swaps.",
      READY: "READY", MOVING: "MOVING", STOPPED: "STOPPED", CRASH: "CRASH",
      STATUS: "STATUS", JOINTS: "JOINTS", PROGRAM: "PROGRAM", VIEW: "VIEW", CELL: "CELL",
      Levels: "Levels", Program: "Program", OPEN: "OPEN", SHUT: "SHUT",
      degrees: "degrees", clawOpen: "open", clawShut: "closed",
      estop: "\u25A0 E-STOP", clear: "\u2715 Clear",
      themeDark: "\u25D0 Dark", themeLight: "\u25D0 Light",
      starRules: "Stars: done, under the block par, under the time par. They stay on this screen only.",
      blocksLine: "Blocks: {n}", swapsLine: "Swaps: {n}", timeNone: "Time: none yet", timeLine: "Time: {n}",
      menu: "Menu", draftBadge: "Machine draft.", Target: "Target",
      whatsTitle: "What's new", whatsClose: "Close", play: "Play",
      hubLine: "One Menu button in every app. It opens that app's menu.",
      programAria: "Program. Enter adds the picked block.",
      jointsAria: "Joints", actionsAria: "Program controls",
      v132: "Version 1.3.2",
      w132a: "All 8 languages now translate the status line, E-STOP, Clear, the joint summary, the claw readout, the stars, blocks and time, the top bar, the theme button, and What's new.",
      w132b: "The language you pick is kept and shows from the first screen. Words that are not English are a machine draft.",
      v131: "Version 1.3.1",
      w131a: "The arm is printed links, six servos, and a two-jaw gripper.",
      w131b: "One Menu button in every app. It opens that app's menu.",
      v130: "Version 1.3.0",
      w130a: "Move a robot arm.",
      w130b: "Paper pendant: warm paper, charcoal ink, and mustard only on the header bars, the arm, and the E-STOP band.",
      w130c: "One Menu button in every app. It opens that app's menu.",
      v122: "Version 1.2.2",
      w122a: "Move a robot arm.",
      w122b: "The empty gap above the status line is gone.",
      w122c: "On a short sideways screen the level names stay whole, and the program stays on screen.",
      w122d: "Spanish, Arabic, and Dari name the blocks and the help. Those words are a machine draft.",
      v121: "Version 1.2.1",
      w121a: "Move a robot arm.",
      w121b: "The 3D scene fills the width, and the labels on it are large enough to read.",
      w121c: "Base left and Base right have Spanish, Arabic, and Dari names. Those names are a machine draft.",
      w121d: "Retry clears the stars on the row and in the words.",
      v120: "Version 1.2.0",
      w120a: "Move a robot arm.",
      w120b: "The arm is drawn in 3D from a fixed camera, so the base can turn.",
      w120c: "Levels 1 to 6 are unchanged. Stars stay on this screen only.",
      v110: "Version 1.1.0",
      w110a: "Move a robot arm.",
      w110b: "Level 4 sorts a pile with Repeat. Level 5 sends a red square to bin A and a blue circle to bin B. Level 6 fixes a broken program with swaps.",
      w110c: "Wrist up and Wrist down are in the later levels. A crash names the wrist.",
      w110d: "Stars mean done, under the block par, and under the time par. They stay on this screen only.",
      v100: "Version 1.0.0",
      w100a: "Pinchy McPinchface is the arm game.",
      w100b: "Level 1 moves one joint. Level 2 picks up a part and places it. Level 3 goes to a spot from A1 to C3.",
      w100c: "If the arm hits something, the note names the part and the step stays outlined. Retry keeps your program."
    },
    es: {
      "L1": "Mueve una articulación", "L2": "Recoge y coloca", "L3": "Ve a un punto",
      "L4": "Ordena un montón", "L5": "Cestas del sensor", "L6": "Arregla el programa",
      "Base": "Base", "Shoulder": "Hombro", "Elbow": "Codo",
      "Wrist": "Muñeca", "Claw": "Pinza", "Left": "Izquierda",
      "Right": "Derecha", "Down": "Abajo", "Up": "Arriba",
      "Close": "Cerrar", "Open": "Abrir", "Part": "Pieza",
      "Bin": "Cesta", "Table": "Mesa", "Go here": "Ve aquí",
      "Red square": "Cuadrado rojo", "Blue circle": "Círculo azul", "Pile": "Montón",
      "No stars yet.": "Aún no hay estrellas.", "One star.": "Una estrella.", "Two stars.": "Dos estrellas.",
      "Three stars.": "Tres estrellas.", "Add a block, then press Run.": "Añade un bloque y pulsa Ejecutar.", "Add blocks, then press Run.": "Añade bloques y pulsa Ejecutar.",
      "Stopped.": "Detenido.", "Undone.": "Deshecho.", "Running.": "En marcha.",
      "Arm reset. Program kept.": "Brazo reiniciado. Programa guardado.", "No blocks yet.": "Aún no hay bloques.", "READY": "LISTO",
      "MOVING": "MOVIENDO", "STOPPED": "PARADO", "CRASH": "CHOQUE",
      "STATUS": "ESTADO", "JOINTS": "EJES", "PROGRAM": "PROGRAMA",
      "VIEW": "VISTA", "CELL": "CELDA", "Levels": "Niveles",
      "Program": "Programa", "OPEN": "ABIERTA", "SHUT": "CERRADA",
      "degrees": "grados", "clawOpen": "abierta", "clawShut": "cerrada",
      "estop": "■ PARADA DE EMERGENCIA", "clear": "✕ Borrar", "themeDark": "◐ Oscuro",
      "themeLight": "◐ Claro", "starRules": "Estrellas: hecho, menos bloques que el par, menos tiempo que el par. Solo se quedan en esta pantalla.", "blocksLine": "Bloques: {n}",
      "swapsLine": "Cambios: {n}", "timeNone": "Tiempo: aún no", "timeLine": "Tiempo: {n}",
      "menu": "Menú", "draftBadge": "Borrador automático.", "Target": "Objetivo", "whatsTitle": "Novedades",
      "whatsClose": "Cerrar", "play": "Jugar", "hubLine": "Un solo botón Menú en cada aplicación. Abre el menú de esa aplicación.",
      "programAria": "Programa. Enter añade el bloque elegido.", "jointsAria": "Articulaciones", "actionsAria": "Botones del programa",
      "v132": "Versión 1.3.2", "w132a": "Los 8 idiomas ya traducen la línea de estado, la parada de emergencia, Borrar, el resumen de articulaciones, la pinza, las estrellas, bloques y tiempo, la barra superior, el botón de tema y Novedades.", "w132b": "El idioma elegido se guarda y se ve desde la primera pantalla. Las palabras que no están en inglés son un borrador automático.",
      "v131": "Versión 1.3.1", "w131a": "El brazo son eslabones impresos, seis servos y una pinza de dos dedos.", "w131b": "Un solo botón Menú en cada aplicación. Abre el menú de esa aplicación.",
      "v130": "Versión 1.3.0", "w130a": "Mueve un brazo robot.", "w130b": "Colgante de papel: papel cálido, tinta carbón y mostaza solo en las barras de cabecera, el brazo y la banda de parada de emergencia.",
      "w130c": "Un solo botón Menú en cada aplicación. Abre el menú de esa aplicación.", "v122": "Versión 1.2.2", "w122a": "Mueve un brazo robot.",
      "w122b": "El hueco vacío sobre la línea de estado ya no está.", "w122c": "En una pantalla horizontal corta los nombres de los niveles quedan enteros y el programa sigue en pantalla.", "w122d": "El español, el árabe y el darí nombran los bloques y la ayuda. Esas palabras son un borrador automático.",
      "v121": "Versión 1.2.1", "w121a": "Mueve un brazo robot.", "w121b": "La escena 3D ocupa todo el ancho y sus rótulos son lo bastante grandes para leerse.",
      "w121c": "Base izquierda y Base derecha tienen nombre en español, árabe y darí. Esos nombres son un borrador automático.", "w121d": "Reintentar borra las estrellas de la fila y de las palabras.", "v120": "Versión 1.2.0",
      "w120a": "Mueve un brazo robot.", "w120b": "El brazo se dibuja en 3D desde una cámara fija, así que la base puede girar.", "w120c": "Los niveles 1 a 6 no cambian. Las estrellas se quedan solo en esta pantalla.",
      "v110": "Versión 1.1.0", "w110a": "Mueve un brazo robot.", "w110b": "El nivel 4 ordena un montón con Repetir. El nivel 5 manda un cuadrado rojo a la cesta A y un círculo azul a la cesta B. El nivel 6 arregla un programa roto con cambios.",
      "w110c": "Muñeca arriba y Muñeca abajo están en los niveles siguientes. Un choque nombra la muñeca.", "w110d": "Las estrellas significan hecho, menos bloques que el par y menos tiempo que el par. Solo se quedan en esta pantalla.", "v100": "Versión 1.0.0",
      "w100a": "Pinchy McPinchface es el juego del brazo.", "w100b": "El nivel 1 mueve una articulación. El nivel 2 recoge una pieza y la coloca. El nivel 3 va a un punto de A1 a C3.", "w100c": "Si el brazo choca con algo, la nota nombra la pieza y el paso queda marcado. Reintentar conserva tu programa."
    },
    uk: {
      "L1": "Перемісти один суглоб", "L2": "Підніми й поклади", "L3": "Іди до точки",
      "L4": "Розсортуй купу", "L5": "Контейнери датчика", "L6": "Виправ програму",
      "Base": "Основа", "Shoulder": "Плече", "Elbow": "Лікоть",
      "Wrist": "Зап'ястя", "Claw": "Кіготь", "Left": "Ліворуч",
      "Right": "Праворуч", "Down": "Вниз", "Up": "Вгору",
      "Close": "Закрий", "Open": "Відкрий", "Part": "Деталь",
      "Bin": "Контейнер", "Table": "Стіл", "Go here": "Іди сюди",
      "Red square": "Червоний квадрат", "Blue circle": "Синє коло", "Pile": "Купа",
      "No stars yet.": "Ще немає зірок.", "One star.": "Одна зірка.", "Two stars.": "Дві зірки.",
      "Three stars.": "Три зірки.", "Add a block, then press Run.": "Додай блок, потім натисни «Пуск».", "Add blocks, then press Run.": "Додай блоки, потім натисни «Пуск».",
      "Stopped.": "Зупинено.", "Undone.": "Скасовано.", "Running.": "Працює.",
      "Arm reset. Program kept.": "Руку скинуто. Програму збережено.", "No blocks yet.": "Ще немає блоків.", "READY": "ГОТОВО",
      "MOVING": "РУХ", "STOPPED": "СТОП", "CRASH": "АВАРІЯ",
      "STATUS": "СТАН", "JOINTS": "СУГЛОБИ", "PROGRAM": "ПРОГРАМА",
      "VIEW": "ВИГЛЯД", "CELL": "КЛІТИНКА", "Levels": "Рівні",
      "Program": "Програма", "OPEN": "ВІДКРИТО", "SHUT": "ЗАКРИТО",
      "degrees": "градусів", "clawOpen": "відкрито", "clawShut": "закрито",
      "estop": "■ АВАРІЙНА ЗУПИНКА", "clear": "✕ Очистити", "themeDark": "◐ Темна",
      "themeLight": "◐ Світла", "starRules": "Зірки: виконано, менше за норму блоків, менше за норму часу. Вони лишаються тільки на цьому екрані.", "blocksLine": "Блоків: {n}",
      "swapsLine": "Обмінів: {n}", "timeNone": "Час: ще немає", "timeLine": "Час: {n}",
      "menu": "Меню", "draftBadge": "Машинна чернетка.", "Target": "Ціль", "whatsTitle": "Що нового",
      "whatsClose": "Закрити", "play": "Грати", "hubLine": "Одна кнопка «Меню» в кожній програмі. Вона відкриває меню цієї програми.",
      "programAria": "Програма. Enter додає вибраний блок.", "jointsAria": "Суглоби", "actionsAria": "Кнопки програми",
      "v132": "Версія 1.3.2", "w132a": "Усі 8 мов тепер перекладають рядок стану, аварійну зупинку, «Очистити», підсумок суглобів, показ кігтя, зірки, блоки й час, верхню панель, кнопку теми та «Що нового».", "w132b": "Вибрана мова зберігається й видна з першого екрана. Слова не англійською — машинна чернетка.",
      "v131": "Версія 1.3.1", "w131a": "Рука складається з надрукованих ланок, шести серводвигунів і захвату з двома щелепами.", "w131b": "Одна кнопка «Меню» в кожній програмі. Вона відкриває меню цієї програми.",
      "v130": "Версія 1.3.0", "w130a": "Рухай руку робота.", "w130b": "Паперовий підвіс: тепле паперове тло, вугільне чорнило, а гірчичний колір лише на смугах заголовка, руці та смузі аварійної зупинки.",
      "w130c": "Одна кнопка «Меню» в кожній програмі. Вона відкриває меню цієї програми.", "v122": "Версія 1.2.2", "w122a": "Рухай руку робота.",
      "w122b": "Порожній проміжок над рядком стану зник.", "w122c": "На короткому горизонтальному екрані назви рівнів лишаються цілими, а програма — на екрані.", "w122d": "Іспанська, арабська та дарі називають блоки й довідку. Ці слова — машинна чернетка.",
      "v121": "Версія 1.2.1", "w121a": "Рухай руку робота.", "w121b": "3D-сцена займає всю ширину, а підписи на ній досить великі, щоб їх прочитати.",
      "w121c": "Назви «Основа ліворуч» і «Основа праворуч» є іспанською, арабською та дарі. Ці назви — машинна чернетка.", "w121d": "Повтор прибирає зірки в ряду й у словах.", "v120": "Версія 1.2.0",
      "w120a": "Рухай руку робота.", "w120b": "Руку намальовано в 3D з нерухомої камери, тож основа може повертатися.", "w120c": "Рівні з 1 по 6 без змін. Зірки лишаються тільки на цьому екрані.",
      "v110": "Версія 1.1.0", "w110a": "Рухай руку робота.", "w110b": "Рівень 4 сортує купу з повтором. Рівень 5 відправляє червоний квадрат у контейнер A, а синє коло — у контейнер B. Рівень 6 лагодить зламану програму обмінами.",
      "w110c": "Зап'ястя вгору й вниз є в пізніших рівнях. Зіткнення називає зап'ястя.", "w110d": "Зірки означають: виконано, менше за норму блоків і менше за норму часу. Вони лишаються тільки на цьому екрані.", "v100": "Версія 1.0.0",
      "w100a": "Pinchy McPinchface — гра з рукою робота.", "w100b": "Рівень 1 рухає один суглоб. Рівень 2 піднімає деталь і кладе її. Рівень 3 іде до точки від A1 до C3.", "w100c": "Якщо рука щось зачепить, примітка називає деталь, а крок лишається обведеним. Повтор зберігає твою програму."
    },
    ru: {
      "L1": "Подвинь один сустав", "L2": "Возьми и положи", "L3": "Иди в точку",
      "L4": "Рассортируй кучу", "L5": "Корзины датчика", "L6": "Исправь программу",
      "Base": "Основание", "Shoulder": "Плечо", "Elbow": "Локоть",
      "Wrist": "Запястье", "Claw": "Клешня", "Left": "Влево",
      "Right": "Вправо", "Down": "Вниз", "Up": "Вверх",
      "Close": "Закрыть", "Open": "Открыть", "Part": "Деталь",
      "Bin": "Корзина", "Table": "Стол", "Go here": "Иди сюда",
      "Red square": "Красный квадрат", "Blue circle": "Синий круг", "Pile": "Куча",
      "No stars yet.": "Звёзд пока нет.", "One star.": "Одна звезда.", "Two stars.": "Две звезды.",
      "Three stars.": "Три звезды.", "Add a block, then press Run.": "Добавь блок, затем нажми «Пуск».", "Add blocks, then press Run.": "Добавь блоки, затем нажми «Пуск».",
      "Stopped.": "Остановлено.", "Undone.": "Отменено.", "Running.": "Работает.",
      "Arm reset. Program kept.": "Рука сброшена. Программа сохранена.", "No blocks yet.": "Блоков пока нет.", "READY": "ГОТОВО",
      "MOVING": "ДВИЖЕНИЕ", "STOPPED": "СТОП", "CRASH": "АВАРИЯ",
      "STATUS": "СОСТОЯНИЕ", "JOINTS": "СУСТАВЫ", "PROGRAM": "ПРОГРАММА",
      "VIEW": "ВИД", "CELL": "ЯЧЕЙКА", "Levels": "Уровни",
      "Program": "Программа", "OPEN": "ОТКРЫТА", "SHUT": "ЗАКРЫТА",
      "degrees": "градусов", "clawOpen": "открыта", "clawShut": "закрыта",
      "estop": "■ АВАРИЙНЫЙ СТОП", "clear": "✕ Очистить", "themeDark": "◐ Тёмная",
      "themeLight": "◐ Светлая", "starRules": "Звёзды: выполнено, меньше нормы блоков, меньше нормы времени. Они остаются только на этом экране.", "blocksLine": "Блоков: {n}",
      "swapsLine": "Обменов: {n}", "timeNone": "Время: пока нет", "timeLine": "Время: {n}",
      "menu": "Меню", "draftBadge": "Машинный черновик.", "Target": "Цель", "whatsTitle": "Что нового",
      "whatsClose": "Закрыть", "play": "Играть", "hubLine": "Одна кнопка «Меню» в каждом приложении. Она открывает меню этого приложения.",
      "programAria": "Программа. Enter добавляет выбранный блок.", "jointsAria": "Суставы", "actionsAria": "Кнопки программы",
      "v132": "Версия 1.3.2", "w132a": "Все 8 языков теперь переводят строку состояния, аварийный стоп, «Очистить», сводку суставов, показ клешни, звёзды, блоки и время, верхнюю панель, кнопку темы и «Что нового».", "w132b": "Выбранный язык сохраняется и виден с первого экрана. Слова не на английском — машинный черновик.",
      "v131": "Версия 1.3.1", "w131a": "Рука состоит из напечатанных звеньев, шести сервоприводов и захвата с двумя губками.", "w131b": "Одна кнопка «Меню» в каждом приложении. Она открывает меню этого приложения.",
      "v130": "Версия 1.3.0", "w130a": "Двигай руку робота.", "w130b": "Бумажный подвес: тёплая бумага, угольные чернила, а горчичный цвет только на полосах заголовка, руке и полосе аварийного стопа.",
      "w130c": "Одна кнопка «Меню» в каждом приложении. Она открывает меню этого приложения.", "v122": "Версия 1.2.2", "w122a": "Двигай руку робота.",
      "w122b": "Пустой промежуток над строкой состояния исчез.", "w122c": "На коротком горизонтальном экране названия уровней остаются целыми, а программа — на экране.", "w122d": "Испанский, арабский и дари называют блоки и справку. Эти слова — машинный черновик.",
      "v121": "Версия 1.2.1", "w121a": "Двигай руку робота.", "w121b": "3D-сцена занимает всю ширину, а подписи на ней достаточно крупные для чтения.",
      "w121c": "У «Основание влево» и «Основание вправо» есть названия на испанском, арабском и дари. Эти названия — машинный черновик.", "w121d": "Повтор убирает звёзды в ряду и в словах.", "v120": "Версия 1.2.0",
      "w120a": "Двигай руку робота.", "w120b": "Рука нарисована в 3D с неподвижной камеры, поэтому основание может поворачиваться.", "w120c": "Уровни с 1 по 6 без изменений. Звёзды остаются только на этом экране.",
      "v110": "Версия 1.1.0", "w110a": "Двигай руку робота.", "w110b": "Уровень 4 сортирует кучу с повтором. Уровень 5 отправляет красный квадрат в корзину A, а синий круг — в корзину B. Уровень 6 чинит сломанную программу обменами.",
      "w110c": "Запястье вверх и вниз есть на поздних уровнях. Столкновение называет запястье.", "w110d": "Звёзды значат: выполнено, меньше нормы блоков и меньше нормы времени. Они остаются только на этом экране.", "v100": "Версия 1.0.0",
      "w100a": "Pinchy McPinchface — игра про руку робота.", "w100b": "Уровень 1 двигает один сустав. Уровень 2 берёт деталь и кладёт её. Уровень 3 идёт в точку от A1 до C3.", "w100c": "Если рука что-то заденет, заметка называет деталь, а шаг остаётся обведённым. Повтор сохраняет твою программу."
    },
    rw: {
      "L1": "Hindura ingingo imwe", "L2": "Fata ushyire", "L3": "Jya ahantu",
      "L4": "Tondeka agatsiko", "L5": "Ibikoresho bya sensori", "L6": "Gorora porogaramu",
      "Base": "Ikibanza", "Shoulder": "Urutugu", "Elbow": "Inkokora",
      "Wrist": "Ikiganza", "Claw": "Agashumi", "Left": "Ibumoso",
      "Right": "Iburyo", "Down": "Hasi", "Up": "Hejuru",
      "Close": "Funga", "Open": "Fungura", "Part": "Igice",
      "Bin": "Igikoresho", "Table": "Ameza", "Go here": "Jya hano",
      "Red square": "Kare itukura", "Blue circle": "Uruziga rubisi", "Pile": "Agatsiko",
      "No stars yet.": "Nta nyenyeri ziraboneka.", "One star.": "Inyenyeri imwe.", "Two stars.": "Inyenyeri ebyiri.",
      "Three stars.": "Inyenyeri eshatu.", "Add a block, then press Run.": "Shyiramo ikibumbe, hanyuma ukande Tangira.", "Add blocks, then press Run.": "Shyiramo ibibumbe, hanyuma ukande Tangira.",
      "Stopped.": "Byahagaze.", "Undone.": "Byasubijwe inyuma.", "Running.": "Biragenda.",
      "Arm reset. Program kept.": "Ukuboko kwasubiye uko kwari. Porogaramu irahari.", "No blocks yet.": "Nta bibumbe biraboneka.", "READY": "BYARANGIYE",
      "MOVING": "BIRAGENDA", "STOPPED": "BYAHAGARITSWE", "CRASH": "IMPANUKA",
      "STATUS": "IMITERERE", "JOINTS": "INGINGO", "PROGRAM": "PORUGARAMU",
      "VIEW": "ISHUSHO", "CELL": "URUGO", "Levels": "Ibyiciro",
      "Program": "Porogaramu", "OPEN": "BIRAFUNGUYE", "SHUT": "BIRAFUNGIYE",
      "degrees": "dogere", "clawOpen": "rirafunguye", "clawShut": "rirafunze",
      "estop": "■ HAGARARA VUBA", "clear": "✕ Siba", "themeDark": "◐ Umwijima",
      "themeLight": "◐ Urumuri", "starRules": "Inyenyeri: byarangiye, ibibumbe bike, igihe gito. Zigumana kuri iyi ngaruriro gusa.", "blocksLine": "Ibibumbe: {n}",
      "swapsLine": "Impinduka: {n}", "timeNone": "Igihe: nta cyo", "timeLine": "Igihe: {n}",
      "menu": "Menyu", "draftBadge": "Inyandiko ya mashini.", "Target": "Intego", "whatsTitle": "Ibishya",
      "whatsClose": "Funga", "play": "Gukina", "hubLine": "Buto imwe ya Menyu muri buri porogaramu. Ifungura menyu y'iyo porogaramu.",
      "programAria": "Porogaramu. Enter yongeraho ikibumbe cyatoranyijwe.", "jointsAria": "Ingingo", "actionsAria": "Utubuto twa porogaramu",
      "v132": "Verisiyo 1.3.2", "w132a": "Indimi 8 zose zisobanura umurongo w'imiterere, Hagarara vuba, Siba, incamake y'ingingo, agashumi, inyenyeri, ibibumbe n'igihe, umurongo wo hejuru, buto y'ibara, n'Ibishya.", "w132b": "Ururimi uhisemo rurabikwa kandi rugaragara kuva ku ngaruriro ya mbere. Amagambo atari Icyongereza ni inyandiko ya mashini.",
      "v131": "Verisiyo 1.3.1", "w131a": "Ukuboko ni ibice byacapwe, moteri esheshatu, n'agafashi k'iminwa ibiri.", "w131b": "Buto imwe ya Menyu muri buri porogaramu. Ifungura menyu y'iyo porogaramu.",
      "v130": "Verisiyo 1.3.0", "w130a": "Hindura ukuboko kwa robo.", "w130b": "Impapuro zishyushye, wino y'amakara, n'ibara ry'ihinde gusa ku mirongo yo hejuru, ukuboko, n'umurongo wo guhagarara vuba.",
      "w130c": "Buto imwe ya Menyu muri buri porogaramu. Ifungura menyu y'iyo porogaramu.", "v122": "Verisiyo 1.2.2", "w122a": "Hindura ukuboko kwa robo.",
      "w122b": "Icyuho cyari hejuru y'umurongo w'imiterere cyavuyeho.", "w122c": "Ku ngaruriro ngufi iryamye amazina y'ibyiciro aguma yose, na porogaramu iguma ku ngaruriro.", "w122d": "Icyesipanyoli, Icyarabu n'Idari bitanga amazina y'ibibumbe n'ubufasha. Ayo magambo ni inyandiko ya mashini.",
      "v121": "Verisiyo 1.2.1", "w121a": "Hindura ukuboko kwa robo.", "w121b": "Ishusho ya 3D yuzuza ubugari bwose, kandi inyandiko zayo ni nini bihagije gusomwa.",
      "w121c": "Ikibanza ibumoso n'Ikibanza iburyo bifite amazina mu cyesipanyoli, icyarabu n'idari. Ayo mazina ni inyandiko ya mashini.", "w121d": "Gerageza ukundi isiba inyenyeri ku murongo no mu magambo.", "v120": "Verisiyo 1.2.0",
      "w120a": "Hindura ukuboko kwa robo.", "w120b": "Ukuboko gushushwa muri 3D kuri kamera ihamye, ikibanza gishobora kuzenguruka.", "w120c": "Ibyiciro 1 kugeza kuri 6 ntibyahindutse. Inyenyeri zigumana kuri iyi ngaruriro gusa.",
      "v110": "Verisiyo 1.1.0", "w110a": "Hindura ukuboko kwa robo.", "w110b": "Icyiciro cya 4 gitondeka agatsiko na Subiramo. Icyiciro cya 5 cyohereza kare itukura mu gikoresho A n'uruziga rubisi mu gikoresho B. Icyiciro cya 6 gikosora porogaramu yangiritse n'impinduka.",
      "w110c": "Ikiganza hejuru n'Ikiganza hasi biri mu byiciro bikurikira. Impanuka ivuga ikiganza.", "w110d": "Inyenyeri zivuga ko byarangiye, ibibumbe bike, n'igihe gito. Zigumana kuri iyi ngaruriro gusa.", "v100": "Verisiyo 1.0.0",
      "w100a": "Pinchy McPinchface ni umukino w'ukuboko.", "w100b": "Icyiciro cya 1 gihindura ingingo imwe. Icyiciro cya 2 gifata igice kikagishyira. Icyiciro cya 3 kijya ahantu kuva kuri A1 kugeza kuri C3.", "w100c": "Ukuboko nigukubita ikintu, inyandiko ivuga igice, kandi intambwe iguma ikikijwe. Gerageza ukundi ibika porogaramu yawe."
    },
    ti: {
      "L1": "ሓደ ጉልባብ ንቐሳቐስ", "L2": "ኣልዕል ኣንብር", "L3": "ናብ ነጥቢ ኺድ",
      "L4": "ክምርታት ኣሰላስል", "L5": "ሳጹናት ሰንሰር", "L6": "መደብ ኣስተኻኽል",
      "Base": "መሰረት", "Shoulder": "ትከሻ", "Elbow": "ኩርኩር",
      "Wrist": "ኣሰር", "Claw": "ጭንካል", "Left": "ጸጋም",
      "Right": "የማን", "Down": "ታሕቲ", "Up": "ላዕሊ",
      "Close": "ዓግት", "Open": "ክፈት", "Part": "ክፋል",
      "Bin": "ሳጹን", "Table": "ጠረጴዛ", "Go here": "ናብዚ ኺድ",
      "Red square": "ቀይሕ ርብዒ", "Blue circle": "ሰማያዊ ክቢ", "Pile": "ክምር",
      "No stars yet.": "ክሳብ ሕጂ ኮኸብ የለን።", "One star.": "ሓደ ኮኸብ።", "Two stars.": "ክልተ ኮኸባት።",
      "Three stars.": "ሰለስተ ኮኸባት።", "Add a block, then press Run.": "ሓደ ብሎክ ወስኽ፣ ድሕሪኡ ጀምር ጠውቕ።", "Add blocks, then press Run.": "ብሎኮታት ወስኽ፣ ድሕሪኡ ጀምር ጠውቕ።",
      "Stopped.": "ደው በለ።", "Undone.": "ተመሊሱ።", "Running.": "ይሰርሕ ኣሎ።",
      "Arm reset. Program kept.": "ኢድ ተመሊሱ። መደብ ተሓሊዩ።", "No blocks yet.": "ክሳብ ሕጂ ብሎክ የለን።", "READY": "ድሉው",
      "MOVING": "ይንቀሳቐስ", "STOPPED": "ደው በለ", "CRASH": "ጉድኣት",
      "STATUS": "ኩነታት", "JOINTS": "ጉልባብ", "PROGRAM": "መደብ",
      "VIEW": "ርኢቶ", "CELL": "ሕዋስ", "Levels": "ደረጃታት",
      "Program": "መደብ", "OPEN": "ክፉት", "SHUT": "ዕጹው",
      "degrees": "ዲግሪ", "clawOpen": "ክፉት", "clawShut": "ዕጹው",
      "estop": "■ ህጹጽ ደው", "clear": "✕ ደምስስ", "themeDark": "◐ ጸሊም",
      "themeLight": "◐ ብሩህ", "starRules": "ኮኸባት፡ ተወዲኡ፣ ካብ ደረጃ ብሎክ ንኽልተ፣ ካብ ደረጃ ግዜ ንኽልተ። ኣብዚ ገጽ ጥራይ ይቕመጡ።", "blocksLine": "ብሎኮታት፡ {n}",
      "swapsLine": "ለውጢ፡ {n}", "timeNone": "ግዜ፡ ገና", "timeLine": "ግዜ፡ {n}",
      "menu": "ዝርዝር", "draftBadge": "ናይ ማሽን ረቂቕ።", "Target": "ዕላማ", "whatsTitle": "ሓድሽ እንታይ ኣሎ",
      "whatsClose": "ዕጾ", "play": "ተጻወት", "hubLine": "ኣብ ነፍሲ ወከፍ መተግበሪ ሓደ መጠወቒ ዝርዝር ኣሎ። ዝርዝር ናይታ መተግበሪ ይኸፍት።",
      "programAria": "መደብ። Enter ዝተመርጸ ብሎክ የእቱ።", "jointsAria": "ጉልባባት", "actionsAria": "መጠወቕታት መደብ",
      "v132": "ዕትም 1.3.2", "w132a": "ኩለን 8 ቋንቋታት ሕጂ መስመር ኩነታት፣ ህጹጽ ደው፣ ደምስስ፣ ጽሑፍ ጉልባባት፣ ጭንካል፣ ኮኸባት፣ ብሎኮታትን ግዜን፣ ላዕለዋይ መስመር፣ መጠወቒ ገጽ፣ ሓድሽ እንታይ ኣሎን የተርጉማ።", "w132b": "ዝተመርጸ ቋንቋ ይቕመጥ፣ ካብ ቀዳማይ ገጽ ድማ ይርአ። ካብ እንግሊዝኛ ወጻኢ ዝዀኑ ቃላት ናይ ማሽን ረቂቕ እዮም።",
      "v131": "ዕትም 1.3.1", "w131a": "ኢዱ ዝተሓተመ ሕውስዋስ፣ ሽዱሽተ ሞተራትን ክልተ መንከስ ዘለዎ መጨበጢን እዩ።", "w131b": "ኣብ ነፍሲ ወከፍ መተግበሪ ሓደ መጠወቒ ዝርዝር ኣሎ። ዝርዝር ናይታ መተግበሪ ይኸፍት።",
      "v130": "ዕትም 1.3.0", "w130a": "ኢድ ሮቦት ኣንቀሳቕስ።", "w130b": "ወረቐት መስቀልቲ፡ ዝሞቐ ወረቐት፣ ጸሊም ቀለም፣ ብጫ ድማ ኣብ ላዕለዋይ መስመራት፣ ኢድን ህጹጽ ደው መስመርን ጥራይ።",
      "w130c": "ኣብ ነፍሲ ወከፍ መተግበሪ ሓደ መጠወቒ ዝርዝር ኣሎ። ዝርዝር ናይታ መተግበሪ ይኸፍት።", "v122": "ዕትም 1.2.2", "w122a": "ኢድ ሮቦት ኣንቀሳቕስ።",
      "w122b": "ልዕሊ መስመር ኩነታት ዝነበረ ባዶ ቦታ ተወግዱ።", "w122c": "ኣብ ሓጸር ተጋድሞ ስክሪን ስሞም ደረጃታት ምሉእ ይተርፍ፣ መደብ ድማ ኣብ ስክሪን ይተርፍ።", "w122d": "ስፓንኛ፣ ዓረብኛን ዳሪን ንብሎኮታትን ሓገዝን ይሰምዩ። እዞም ቃላት ናይ ማሽን ረቂቕ እዮም።",
      "v121": "ዕትም 1.2.1", "w121a": "ኢድ ሮቦት ኣንቀሳቕስ።", "w121b": "ናይ 3D ትርኢት ምሉእ ወድዓት ይሕዝ፣ ጽሑፋቱ ድማ ንምንባብ ዓበይቲ እዮም።",
      "w121c": "መሰረት ጸጋምን መሰረት የማንን ብስፓንኛ፣ ዓረብኛን ዳሪን ስም ኣለዎም። እዞም ስሞም ናይ ማሽን ረቂቕ እዮም።", "w121d": "ደጊምካ ፈትን ኮኸባት ኣብ መስመርን ኣብ ቃላትን ይደምስስ።", "v120": "ዕትም 1.2.0",
      "w120a": "ኢድ ሮቦት ኣንቀሳቕስ።", "w120b": "ኢድ ብ3D ካብ ሓደ ቀዋሚ ካሜራ ይስእል፣ ስለዚ መሰረት ክዘወር ይኽእል።", "w120c": "ደረጃታት 1 ክሳብ 6 ኣይተቐየሩን። ኮኸባት ኣብዚ ገጽ ጥራይ ይተርፉ።",
      "v110": "ዕትም 1.1.0", "w110a": "ኢድ ሮቦት ኣንቀሳቕስ።", "w110b": "ደረጃ 4 ክምር ብዳግም ይሰላስል። ደረጃ 5 ቀይሕ ርብዒ ናብ ሳጹን A ሰማያዊ ክቢ ድማ ናብ ሳጹን B ይልእኽ። ደረጃ 6 ዝተበላሸወ መደብ ብለውጢ ይኸውን።",
      "w110c": "ኣሰር ላዕሊን ኣሰር ታሕትን ኣብ ዝቕጽሉ ደረጃታት እዮም። ግጭት ኣሰር ይሰምዮ።", "w110d": "ኮኸባት ተወዲኡ፣ ካብ ደረጃ ብሎክ ንኽልተ፣ ካብ ደረጃ ግዜ ንኽልተ ማለት እዮም። ኣብዚ ገጽ ጥራይ ይተርፉ።", "v100": "ዕትም 1.0.0",
      "w100a": "Pinchy McPinchface ጸወታ ኢድ እዩ።", "w100b": "ደረጃ 1 ሓደ ጉልባብ የንቀሳቕስ። ደረጃ 2 ክፋል የልዕል የንብር። ደረጃ 3 ካብ A1 ክሳብ C3 ናብ ነጥቢ ይኸይድ።", "w100c": "ኢድ ንሓደ ነገር እንተተጋጨወ፣ መመላእታ ንክፋል ይሰምዮ፣ ስጉምቲ ድማ ኣብ ዙርያ ይተርፍ። ደጊምካ ፈትን መደብካ የቐምጦ።"
    },
    ar: {
      L1: "حرّك مفصلاً واحداً", L2: "التقط وضع", L3: "اذهب إلى نقطة", L4: "رتّب كومة", L5: "صناديق الحساس", L6: "أصلح البرنامج",
      Base: "قاعدة", Shoulder: "كتف", Elbow: "كوع", Wrist: "رسغ", Claw: "مخلب",
      Left: "يسار", Right: "يمين", Down: "أسفل", Up: "أعلى", Close: "أغلق", Open: "افتح",
      Part: "قطعة", Bin: "صندوق", Table: "طاولة", "Go here": "اذهب هنا",
      "Red square": "مربع أحمر", "Blue circle": "دائرة زرقاء", Pile: "كومة",
      "No stars yet.": "لا نجوم بعد.", "One star.": "نجمة واحدة.", "Two stars.": "نجمتان.", "Three stars.": "ثلاث نجوم.",
      "Add a block, then press Run.": "أضف بلوكاً، ثم اضغط تشغيل.",
      "Add blocks, then press Run.": "أضف بلوكات، ثم اضغط تشغيل.",
      "Stopped.": "توقف.", "Undone.": "تم التراجع.", "Running.": "يعمل.",
      "Arm reset. Program kept.": "أُعيدت الذراع. بقي البرنامج.",
      "No blocks yet.": "لا بلوكات بعد.",
      "legend": "الذراع ثلاثي الأبعاد يدور على قاعدته. النقاط من A1 إلى C3 والصناديق على الطاولة. البلوك هو القطعة. العلامة السميكة تعني اذهب هنا.",
      "legendPile": "الذراع ثلاثي الأبعاد يدور على قاعدته. كرر 3 يشغّل البلوكات حتى نهاية التكرار ثلاث مرات. في الكومة 3 قطع. الرسغ لأعلى والرسغ لأسفل هنا أيضًا.",
      "legendSensor": "الذراع ثلاثي الأبعاد يدور على قاعدته. المربع الأحمر يذهب إلى الصندوق A. الدائرة الزرقاء تذهب إلى الصندوق B. الكلمة والشكل متطابقان. اللون ليس الإشارة الوحيدة.",
      "legendDebug": "الذراع ثلاثي الأبعاد يدور على قاعدته. الخطوة المحددة تتبدل مع التالية. تبديلات أقل أفضل. الرسغ لأعلى والرسغ لأسفل في قائمة البلوكات.",
      "L1-goal": "حرّك مفصلاً واحداً. الكتف للأعلى يطابق العلامة.",
      "L2-goal": "التقط القطعة وضعها في الصندوق.",
      "L3-goal": "اذهب إلى النقطة A2 على شبكة A1 إلى C3.",
      "L4-goal": "استخدم كرر 3 لوضع القطع الثلاث من الكومة في الصندوق.",
      "L5-goal": "إذا رأى الحساس مربعاً أحمر فضعه في الصندوق A. إذا رأى دائرة زرقاء فضعه في الصندوق B.",
      "L6-goal": "البرنامج معطوب. بدّل أقل عدد من الخطوات ثم شغّله.",
      READY: "جاهز", MOVING: "يتحرك", STOPPED: "متوقف", CRASH: "اصطدام",
      STATUS: "الحالة", JOINTS: "المفاصل", PROGRAM: "البرنامج", VIEW: "العرض", CELL: "خلية",
      Levels: "المستويات", Program: "البرنامج", OPEN: "مفتوح", SHUT: "مغلق",
      degrees: "درجة", clawOpen: "مفتوح", clawShut: "مغلق",
      estop: "\u25A0 إيقاف طارئ", clear: "\u2715 مسح",
      themeDark: "\u25D0 داكن", themeLight: "\u25D0 فاتح",
      starRules: "النجوم: تم، تحت حد البلوكات، تحت حد الوقت. تبقى على هذه الشاشة فقط.",
      blocksLine: "البلوكات: {n}", swapsLine: "التبديلات: {n}", timeNone: "الوقت: لا شيء بعد", timeLine: "الوقت: {n}",
      menu: "القائمة", draftBadge: "مسودة آلية.", Target: "الهدف",
      whatsTitle: "ما الجديد", whatsClose: "إغلاق", play: "العب",
      hubLine: "زر قائمة واحد في كل تطبيق. يفتح قائمة هذا التطبيق.",
      programAria: "البرنامج. Enter يضيف البلوك المختار.",
      jointsAria: "المفاصل", actionsAria: "أزرار البرنامج",
      v132: "الإصدار 1.3.2",
      w132a: "اللغات الثماني كلها تترجم الآن سطر الحالة، وإيقاف الطوارئ، ومسح، وملخص المفاصل، وقراءة المخلب، والنجوم، والبلوكات والوقت، والشريط العلوي، وزر المظهر، وما الجديد.",
      w132b: "اللغة التي تختارها تُحفظ وتظهر من الشاشة الأولى. الكلمات غير الإنجليزية مسودة آلية.",
      v131: "الإصدار 1.3.1",
      w131a: "الذراع وصلات مطبوعة، وستة محركات، ومقبض بفكّين.",
      w131b: "زر قائمة واحد في كل تطبيق. يفتح قائمة هذا التطبيق.",
      v130: "الإصدار 1.3.0",
      w130a: "حرّك ذراع روبوت.",
      w130b: "قلادة ورقية: ورق دافئ، وحبر فحمي، وخردل فقط على أشرطة الرأس والذراع وشريط الإيقاف.",
      w130c: "زر قائمة واحد في كل تطبيق. يفتح قائمة هذا التطبيق.",
      v122: "الإصدار 1.2.2",
      w122a: "حرّك ذراع روبوت.",
      w122b: "الفراغ فوق سطر الحالة اختفى.",
      w122c: "على شاشة جانبية قصيرة تبقى أسماء المستويات كاملة، ويبقى البرنامج على الشاشة.",
      w122d: "الإسبانية والعربية والدرية تسمّي البلوكات والمساعدة. هذه الكلمات مسودة آلية.",
      v121: "الإصدار 1.2.1",
      w121a: "حرّك ذراع روبوت.",
      w121b: "المشهد ثلاثي الأبعاد يملأ العرض، والكلمات عليه كبيرة بما يكفي للقراءة.",
      w121c: "القاعدة يسار والقاعدة يمين لهما أسماء بالإسبانية والعربية والدرية. هذه الأسماء مسودة آلية.",
      w121d: "إعادة المحاولة تمسح النجوم في الصف وفي الكلمات.",
      v120: "الإصدار 1.2.0",
      w120a: "حرّك ذراع روبوت.",
      w120b: "الذراع مرسومة بثلاثة أبعاد من كاميرا ثابتة، فيمكن للقاعدة أن تدور.",
      w120c: "المستويات من 1 إلى 6 لم تتغير. النجوم تبقى على هذه الشاشة فقط.",
      v110: "الإصدار 1.1.0",
      w110a: "حرّك ذراع روبوت.",
      w110b: "المستوى 4 يرتّب كومة بالتكرار. المستوى 5 يرسل مربعًا أحمر إلى الصندوق A ودائرة زرقاء إلى الصندوق B. المستوى 6 يصلح برنامجًا معطوبًا بالتبديل.",
      w110c: "الرسغ لأعلى والرسغ لأسفل في المستويات اللاحقة. الاصطدام يسمّي الرسغ.",
      w110d: "النجوم تعني تم، وتحت حد البلوكات، وتحت حد الوقت. تبقى على هذه الشاشة فقط.",
      v100: "الإصدار 1.0.0",
      w100a: "Pinchy McPinchface هي لعبة الذراع.",
      w100b: "المستوى 1 يحرّك مفصلاً واحدًا. المستوى 2 يلتقط قطعة ويضعها. المستوى 3 يذهب إلى نقطة من A1 إلى C3.",
      w100c: "إذا اصطدمت الذراع بشيء، تذكر الملاحظة القطعة وتبقى الخطوة محددة. إعادة المحاولة تبقي برنامجك."
    },
    "fa-AF": {
      L1: "یک بند را حرکت بده", L2: "بردار و بگذار", L3: "به نقطه برو", L4: "کپه را مرتب کن", L5: "سطل‌های حسگر", L6: "برنامه را درست کن",
      Base: "پایه", Shoulder: "شانه", Elbow: "آرنج", Wrist: "مچ", Claw: "چنگال",
      Left: "چپ", Right: "راست", Down: "پایین", Up: "بالا", Close: "ببند", Open: "باز",
      Part: "قطعه", Bin: "سطل", Table: "میز", "Go here": "اینجا برو",
      "Red square": "مربع سرخ", "Blue circle": "دایره آبی", Pile: "کپه",
      "No stars yet.": "هنوز ستاره‌ای نیست.", "One star.": "یک ستاره.", "Two stars.": "دو ستاره.", "Three stars.": "سه ستاره.",
      "Add a block, then press Run.": "یک بلاک اضافه کن، بعد اجرا را بزن.",
      "Add blocks, then press Run.": "بلاک‌ها را اضافه کن، بعد اجرا را بزن.",
      "Stopped.": "ایست.", "Undone.": "برگردانده شد.", "Running.": "در حال اجرا.",
      "Arm reset. Program kept.": "بازو دوباره تنظیم شد. برنامه ماند.",
      "No blocks yet.": "هنوز بلاکی نیست.",
      "legend": "بازو سه‌بعدی روی پایه‌اش می‌چرخد. نقطه‌ها از A1 تا C3 و سطل‌ها روی میز اند. بلاک همان قطعه است. نشانه کلفت یعنی اینجا برو.",
      "legendPile": "بازو سه‌بعدی روی پایه‌اش می‌چرخد. تکرار ۳ بلاک‌ها را تا پایان تکرار سه بار اجرا می‌کند. کپه ۳ قطعه دارد. مچ بالا و مچ پایین هم اینجاست.",
      "legendSensor": "بازو سه‌بعدی روی پایه‌اش می‌چرخد. مربع سرخ به سطل A می‌رود. دایره آبی به سطل B می‌رود. واژه و شکل یکی است. رنگ تنها نشانه نیست.",
      "legendDebug": "بازو سه‌بعدی روی پایه‌اش می‌چرخد. گام خط‌کشی‌شده با گام بعدی جابه‌جا می‌شود. جابه‌جایی کمتر بهتر است. مچ بالا و مچ پایین در فهرست بلاک‌هاست.",
      "L1-goal": "یک بند را حرکت بده. شانه بالا با نشانه یکی می‌شود.",
      "L2-goal": "قطعه را بردار و در سطل بگذار.",
      "L3-goal": "به نقطه A2 روی شبکه A1 تا C3 برو.",
      "L4-goal": "با تکرار ۳ هر سه قطعه کپه را در سطل بگذار.",
      "L5-goal": "اگر حسگر مربع سرخ دید آن را در سطل A بگذار. اگر دایره آبی دید آن را در سطل B بگذار.",
      "L6-goal": "برنامه خراب است. کمترین گام را جابه‌جا کن و بعد اجرا کن.",
      READY: "آماده", MOVING: "در حرکت", STOPPED: "ایست", CRASH: "برخورد",
      STATUS: "وضعیت", JOINTS: "بندها", PROGRAM: "برنامه", VIEW: "نما", CELL: "خانه",
      Levels: "مرحله‌ها", Program: "برنامه", OPEN: "باز", SHUT: "بسته",
      degrees: "درجه", clawOpen: "باز", clawShut: "بسته",
      estop: "\u25A0 ایست اضطراری", clear: "\u2715 پاک کردن",
      themeDark: "\u25D0 تاریک", themeLight: "\u25D0 روشن",
      starRules: "ستاره‌ها: انجام شد، کمتر از حد بلاک، کمتر از حد زمان. فقط روی همین صفحه می‌مانند.",
      blocksLine: "بلاک‌ها: {n}", swapsLine: "جابه‌جایی‌ها: {n}", timeNone: "زمان: هنوز هیچ", timeLine: "زمان: {n}",
      menu: "فهرست", draftBadge: "پیش‌نویس ماشینی.", Target: "هدف",
      whatsTitle: "تازه‌ها", whatsClose: "بستن", play: "بازی",
      hubLine: "در هر برنامه یک دکمه فهرست است. فهرست همان برنامه را باز می‌کند.",
      programAria: "برنامه. Enter بلاک انتخاب‌شده را اضافه می‌کند.",
      jointsAria: "بندها", actionsAria: "دکمه‌های برنامه",
      v132: "نسخه 1.3.2",
      w132a: "حالا هر هشت زبان خط وضعیت، ایست اضطراری، پاک کردن، خلاصه بندها، نمایش چنگال، ستاره‌ها، بلاک‌ها و وقت، نوار بالا، دکمه تم و تازه‌ها را ترجمه می‌کنند.",
      w132b: "زبانی که انتخاب می‌کنی ذخیره می‌شود و از صفحه اول دیده می‌شود. واژه‌های غیرانگلیسی پیش‌نویس ماشینی اند.",
      v131: "نسخه 1.3.1",
      w131a: "بازو بندهای چاپ‌شده، شش موتور، و یک گیره با دو فک است.",
      w131b: "در هر برنامه یک دکمه فهرست است. فهرست همان برنامه را باز می‌کند.",
      v130: "نسخه 1.3.0",
      w130a: "یک بازوی ربات را حرکت بده.",
      w130b: "آویز کاغذی: کاغذ گرم، جوهر زغالی، و خردل فقط روی نوار سر، بازو، و نوار ایست.",
      w130c: "در هر برنامه یک دکمه فهرست است. فهرست همان برنامه را باز می‌کند.",
      v122: "نسخه 1.2.2",
      w122a: "یک بازوی ربات را حرکت بده.",
      w122b: "جای خالی بالای خط وضعیت رفت.",
      w122c: "روی صفحه کوتاه افقی نام مرحله‌ها کامل می‌ماند و برنامه روی صفحه می‌ماند.",
      w122d: "اسپانیایی، عربی و دری به بلاک‌ها و راهنما نام می‌دهند. این واژه‌ها پیش‌نویس ماشینی اند.",
      v121: "نسخه 1.2.1",
      w121a: "یک بازوی ربات را حرکت بده.",
      w121b: "صحنه سه‌بعدی همه عرض را می‌گیرد و نوشته‌هایش برای خواندن بزرگ اند.",
      w121c: "پایه چپ و پایه راست نام اسپانیایی، عربی و دری دارند. این نام‌ها پیش‌نویس ماشینی اند.",
      w121d: "تلاش دوباره ستاره‌ها را در ردیف و در واژه‌ها پاک می‌کند.",
      v120: "نسخه 1.2.0",
      w120a: "یک بازوی ربات را حرکت بده.",
      w120b: "بازو با دوربین ثابت سه‌بعدی کشیده شده تا پایه بچرخد.",
      w120c: "مرحله‌های 1 تا 6 همان است. ستاره‌ها فقط روی همین صفحه می‌مانند.",
      v110: "نسخه 1.1.0",
      w110a: "یک بازوی ربات را حرکت بده.",
      w110b: "مرحله 4 کپه را با تکرار مرتب می‌کند. مرحله 5 مربع سرخ را به سطل A و دایره آبی را به سطل B می‌فرستد. مرحله 6 برنامه خراب را با جابه‌جایی درست می‌کند.",
      w110c: "مچ بالا و مچ پایین در مرحله‌های بعدی است. برخورد نام مچ را می‌گوید.",
      w110d: "ستاره‌ها یعنی انجام شد، کمتر از حد بلاک، و کمتر از حد زمان. فقط روی همین صفحه می‌مانند.",
      v100: "نسخه 1.0.0",
      w100a: "Pinchy McPinchface بازی بازو است.",
      w100b: "مرحله 1 یک بند را حرکت می‌دهد. مرحله 2 یک قطعه را برمی‌دارد و می‌گذارد. مرحله 3 به نقطه‌ای از A1 تا C3 می‌رود.",
      w100c: "اگر بازو به چیزی بخورد، یادداشت نام قطعه را می‌گوید و گام خط‌کشی می‌ماند. تلاش دوباره برنامه را نگه می‌دارد."
    }
  };
  function uiText(lang, key) {
    var code = lang && langMeta(lang).id === lang ? lang : "en";
    var pack = UI[code] || UI.en;
    if (pack && pack[key]) return pack[key];
    if (UI.en[key]) return UI.en[key];
    return key;
  }

  function jointReadout(state, lang) {
    var claw = state.open ? uiText(lang, "clawOpen") : uiText(lang, "clawShut");
    var deg = uiText(lang, "degrees");
    return uiText(lang, "Base") + " " + Math.round(state.base) + " " + deg + ". " +
      uiText(lang, "Shoulder") + " " + Math.round(state.shoulder) + " " + deg + ". " +
      uiText(lang, "Elbow") + " " + Math.round(state.elbow) + " " + deg + ". " +
      uiText(lang, "Wrist") + " " + Math.round(state.wrist || 0) + " " + deg + ". " +
      uiText(lang, "Claw") + " " + claw + ".";
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
    actionLabel: actionLabel,
    helpFor: helpFor,
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
    uiText: uiText,
    cloneState: cloneState,
    stateKey: stateKey,
    obstacles: obstacles
  };
});
