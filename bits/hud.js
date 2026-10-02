/* Bits and Bobs BB 2.0.3 — tech-room HUD. Classic board: ?theme=classic. Languages follow the Hub. */
(function () {
  if (document.documentElement.classList.contains("is-classic")) {
    var frame = document.querySelector(".classic-frame");
    frame.src = "/bits/classic.html";
    return;
  }
  if (window.BitsI18n) BitsI18n.boot();
  function bb(key) { return window.BitsI18n ? BitsI18n.bb(key) : ""; }
  function bbf(key, map) { return window.BitsI18n ? BitsI18n.bbf(key, map) : ""; }
  function onLang(fn) { return window.BitsI18n ? BitsI18n.on(fn) : function () {}; }
  var COLOR_KEY = ["colorCyan", "colorAmber", "colorViolet", "colorLime", "colorCoral", "colorIce", "colorVermilion", "colorMint"];
  function colorName(i) { return bb(COLOR_KEY[i] || "colorCyan"); }

  var ACCENTS = [["Vermilion", "#e25c12"], ["Cyan", "#3ee0ff"], ["Amber", "#ffb020"], ["Lime", "#b6f25c"], ["Violet", "#c084fc"], ["Ice", "#d7f6ff"]];
  var DEFAULTS = ["drama", "bell", "dice", "noise", "calc", "prompt"];
  var CREW = ["#3ee0ff", "#ffb020", "#c084fc", "#b6f25c", "#ff6b6b", "#d7f6ff", "#e25c12", "#7dffb3"];
  var PROMPTS = [
    "Build a bridge from 20 sticks that holds a book.",
    "Design a chair for a toy that is only 10 cm tall.",
    "Make a ramp that slows a marble, then speeds it up.",
    "Sketch a logo that still works in one color.",
    "Build a lever that lifts a water bottle with one finger.",
    "Design a package that protects an egg from a 1 m drop.",
    "Make two gears that spin a flag slowly.",
    "Draw a room plan with a door that clears a 70 cm path.",
    "Invent a tool that helps someone open a jar.",
    "Build a tower as tall as your arm from paper only.",
    "Design a flashlight that stands on its own.",
    "Make a pulley that raises a pencil case.",
    "Sketch a robot wheel that will not slip on a ramp.",
    "Design a sign you can read from the back row.",
    "Build a balance from a ruler and a fulcrum.",
    "Invent a clip that holds a cable without pinching it.",
    "Draw a roof that sheds rain on a 6 in 12 pitch.",
    "Make a spinner that lands fairly on four colors.",
    "Design a handle a gloved hand can grip.",
    "Build a marble run with one loop.",
    "Cut a 12 inch stick into three equal pieces and show the kerf.",
    "Lay out four coasters on a 12x12 mat with an even gap.",
    "Measure 3 5/8 inches on a tape and say it in millimeters.",
    "Plan a 90 degree robot turn between two lines of tape."
  ];
  var BELLS = [["P1", "07:40", "08:24"], ["P2", "08:27", "09:11"], ["P3", "09:14", "09:58"], ["P4", "10:01", "10:45"], ["P5", "10:48", "11:32"], ["P6", "11:35", "12:19"], ["P7", "12:22", "13:06"], ["P8", "13:09", "13:53"], ["P9", "13:56", "14:40"]];

  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function btn(label) { var b = el("button", "btn"); b.type = "button"; b.textContent = label; return b; }
  function fmt(n, dp) {
    if (!Number.isFinite(n)) return "—";
    var d = dp == null ? 2 : dp;
    var p = Math.pow(10, d);
    var r = Math.round((n + Number.EPSILON) * p) / p;
    if (Object.is(r, -0)) r = 0;
    return r.toFixed(d);
  }
  function parseLen(raw) {
    if (raw == null) return null;
    var s = String(raw).trim().toLowerCase().replace(/-/g, " ");
    if (!s) return null;
    var unit = "in";
    if (s.endsWith("mm")) { unit = "mm"; s = s.slice(0, -2).trim(); }
    else if (s.endsWith("cm")) { unit = "cm"; s = s.slice(0, -2).trim(); }
    else if (s.endsWith("in")) { unit = "in"; s = s.slice(0, -2).trim(); }
    else if (s.endsWith('"')) { unit = "in"; s = s.slice(0, -1).trim(); }
    var inches = null, m;
    if ((m = s.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/))) inches = Number(m[1]) + Number(m[2]) / Number(m[3]);
    else if ((m = s.match(/^(\d+)\s*\/\s*(\d+)$/))) inches = Number(m[1]) / Number(m[2]);
    else if ((m = s.match(/^(\d+(?:\.\d+)?)$/))) inches = Number(m[1]);
    if (inches == null || !Number.isFinite(inches) || inches < 0) return null;
    if (unit === "mm") inches /= 25.4;
    if (unit === "cm") inches /= 2.54;
    return inches;
  }
  function inchLabel(inches) {
    if (!Number.isFinite(inches)) return "—";
    var neg = inches < 0;
    var six = Math.round(Math.abs(inches) * 16);
    var whole = Math.floor(six / 16);
    var num = six % 16, den = 16;
    while (num && num % 2 === 0 && den % 2 === 0) { num /= 2; den /= 2; }
    var text = "0";
    if (whole && num) text = whole + " " + num + "/" + den;
    else if (whole) text = String(whole);
    else if (num) text = num + "/" + den;
    var mm = Math.round(Math.abs(inches) * 254) / 10;
    return (neg ? "-" : "") + text + " in = " + mm.toFixed(1) + " mm";
  }
  function say(text) {
    if (window.BitsI18n) { BitsI18n.say(text); return; }
  }
  function hush() { if (window.BitsI18n) BitsI18n.hush(); else if (window.speechSynthesis) window.speechSynthesis.cancel(); }
  function resultBar(parent) {
    var box = el("div", "result");
    var num = el("p", "num");
    num.setAttribute("aria-live", "polite");
    num.textContent = "—";
    var row = el("div", "row");
    var sp = btn(""); if (window.BitsI18n) BitsI18n.show(sp, "speak"); else sp.textContent = "Speak";
    var st = btn(""); if (window.BitsI18n) BitsI18n.show(st, "stop"); else st.textContent = "Stop";
    var last = "";
    sp.addEventListener("click", function () { say(last || num.textContent); });
    st.addEventListener("click", hush);
    row.append(sp, st);
    box.append(num, row);
    parent.append(box);
    return { set: function (v) { last = String(v); num.textContent = last; }, node: num };
  }
  function field(label, value, on, kind) {
    var wrap = el("label", "field");
    var cap = el("span");
    var key = "";
    if (label && typeof label === "object" && label.k) key = label.k;
    else if (window.BitsI18n) key = BitsI18n.phrase(label) || "";
    if (key && window.BitsI18n) BitsI18n.show(cap, key);
    else cap.textContent = typeof label === "string" ? label : "";
    var input = el("input");
    input.type = kind || "text";
    input.value = value == null ? "" : value;
    input.autocomplete = "off";
    input.addEventListener("input", function () { on(input.value); });
    wrap.append(cap, input);
    return { wrap: wrap, input: input };
  }
  function numField(label, value, on) {
    var f = field(label, value, function (v) { on(Number(v)); }, "number");
    f.input.step = "any";
    return f;
  }
  function seg(labels, current, on) {
    var row = el("div", "seg");
    labels.forEach(function (lab) {
      var id = lab && typeof lab === "object" ? lab.id : lab;
      var key = lab && typeof lab === "object" ? lab.k : (window.BitsI18n ? BitsI18n.phrase(lab) : "");
      var b = btn("");
      if (key && window.BitsI18n) BitsI18n.show(b, key);
      else b.textContent = id;
      b.setAttribute("aria-pressed", id === current ? "true" : "false");
      b.addEventListener("click", function () {
        row.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        on(id);
      });
      row.append(b);
    });
    return row;
  }
  function reduced() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }

  function evalExpr(src, deg) {
    var s = String(src || "").replace(/π/g, "pi").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s+/g, "");
    if (!s) return 0;
    var i = 0;
    function peek() { return s[i]; }
    function num() {
      var t = "";
      while (i < s.length && /[0-9.]/.test(s[i])) t += s[i++];
      if (!t) throw new Error("num");
      return Number(t);
    }
    function fact(n) {
      if (n < 0 || n > 12 || n !== Math.floor(n)) return NaN;
      var v = 1, k; for (k = 2; k <= n; k++) v *= k; return v;
    }
    function factor() {
      if (peek() === "+") { i++; return factor(); }
      if (peek() === "-") { i++; return -factor(); }
      if (peek() === "(") { i++; var v = expr(); if (peek() !== ")") throw new Error(")"); i++; return v; }
      if (/[a-z]/i.test(peek() || "")) {
        var name = "";
        while (i < s.length && /[a-z]/i.test(s[i])) name += s[i++];
        if (name === "pi") return Math.PI;
        if (name === "e") return Math.E;
        if (name === "ans") return evalExpr.ans || 0;
        if (peek() !== "(") throw new Error("(");
        i++; var inner = expr(); if (peek() !== ")") throw new Error(")"); i++;
        if (name === "sin" || name === "cos" || name === "tan") {
          var r = deg ? inner * Math.PI / 180 : inner;
          return Math[name](r);
        }
        if (name === "ln") return Math.log(inner);
        if (name === "log") return Math.log(inner) / Math.LN10;
        if (name === "sqrt") return Math.sqrt(inner);
        throw new Error(name);
      }
      return num();
    }
    function power() {
      var v = factor();
      if (peek() === "^") { i++; v = Math.pow(v, power()); }
      if (peek() === "!") { i++; v = fact(v); }
      return v;
    }
    function term() {
      var v = power();
      while (peek() === "*" || peek() === "/") {
        var op = s[i++];
        var n = power();
        v = op === "*" ? v * n : v / n;
      }
      return v;
    }
    function expr() {
      var v = term();
      while (peek() === "+" || peek() === "-") {
        var op = s[i++];
        var n = term();
        if (peek() === "%") { i++; n = v * n / 100; }
        v = op === "+" ? v + n : v - n;
      }
      if (peek() === "%") { i++; v = v / 100; }
      return v;
    }
    var out = expr();
    if (i !== s.length) throw new Error("tail");
    return out;
  }

  function packCount(matW, matH, sw, sh, gap) {
    if (!(sw > 0) || !(sh > 0) || !(matW > 0) || !(matH > 0)) return { n: 0, cols: 0, rows: 0 };
    var stepW = sw + gap, stepH = sh + gap;
    if (!(stepW > 0) || !(stepH > 0)) return { n: 0, cols: 0, rows: 0 };
    var cols = Math.floor((matW + gap) / stepW);
    var rows = Math.floor((matH + gap) / stepH);
    cols = Math.max(0, cols); rows = Math.max(0, rows);
    return { n: cols * rows, cols: cols, rows: rows };
  }
  function shrinkPct(matW, matH, sw, sh) {
    if (!(sw > 0) || !(sh > 0)) return null;
    return Math.min(matW / sw, matH / sh) * 100;
  }
  function sheetSummary(matW, matH, w, h, gap) {
    var a = packCount(matW, matH, w, h, gap);
    var b = packCount(matW, matH, h, w, gap);
    var turned = b.n > a.n;
    var best = turned ? b : a;
    var pctA = shrinkPct(matW, matH, w, h);
    var pctB = shrinkPct(matW, matH, h, w);
    var pct = Math.max(pctA || 0, pctB || 0);
    if (best.n > 0) return best.n + " fit" + (turned ? " turned" : "");
    return "0 fit · Shrink to " + fmt(pct) + "% to fit one";
  }
  function sheetLine(matW, matH, w, h, gap) {
    var a = packCount(matW, matH, w, h, gap);
    var b = packCount(matW, matH, h, w, gap);
    var turned = b.n > a.n;
    var best = turned ? b : a;
    if (best.n > 0) return bbf(turned ? "fitTurned" : "fit", { n: best.n });
    var pct = Math.max(shrinkPct(matW, matH, w, h) || 0, shrinkPct(matW, matH, h, w) || 0);
    return bbf("shrink", { pct: fmt(pct) });
  }
  function driveMath(diameter, distance) {
    if (!(diameter > 0) || !Number.isFinite(distance)) return null;
    var turns = distance / (Math.PI * diameter);
    return { turns: turns, degrees: turns * 360 };
  }
  function turn90(diameter, track) {
    if (!(diameter > 0) || !(track > 0)) return null;
    var turns = track / (4 * diameter);
    return { turns: turns, degrees: turns * 360 };
  }

  function selfCheck() {
    if (parseLen("10 1/2") !== 10.5) console.error("parse 10 1/2");
    if (inchLabel(3 + 5 / 8) !== "3 5/8 in = 92.1 mm") console.error("tape label", inchLabel(3 + 5 / 8));
    if (fmt(13.720000000000002) !== "13.72") console.error("fmt", fmt(13.720000000000002));
    if (inchLabel(1) !== "1 in = 25.4 mm") console.error("mm", inchLabel(1));
    if (fmt(1762.947062, 1) !== "1762.9") console.error("deg");
    if (sheetSummary(18, 24, 4, 3, 0.25) !== "28 fit") console.error("sheet", sheetSummary(18, 24, 4, 3, 0.25));
    if (sheetSummary(12, 24, 20, 10, 0) !== "1 fit turned") console.error("turn", sheetSummary(12, 24, 20, 10, 0));
    if (Math.abs(evalExpr("200-10%", true) - 180) > 1e-6) console.error("percent");
    if (Math.abs(evalExpr("sin(90)", true) - 1) > 1e-6) console.error("sin");
    var fit = packCount(12, 12, 4, 3, 0.25);
    if (fit.n < 1) console.error("sheet");
    var d = driveMath(2, Math.PI * 2);
    if (!d || Math.abs(d.turns - 1) > 1e-6) console.error("drive");
  }

  var TOOLS = [];
  function addTool(id, name, blurb, mount) {
    var nameKey = window.BitsI18n ? BitsI18n.toolKey(name) : "";
    var blurbKey = window.BitsI18n ? BitsI18n.toolKey(blurb) : "";
    TOOLS.push({
      id: id,
      nameKey: nameKey,
      blurbKey: blurbKey,
      enName: name,
      enBlurb: blurb,
      get name() { return nameKey ? bb(nameKey) : name; },
      get blurb() { return blurbKey ? bb(blurbKey) : blurb; },
      mount: function (body, ctx) {
        var offs = [];
        ctx.onLang = function (fn) { offs.push(onLang(fn)); };
        var dispose = mount(body, ctx) || function () {};
        return function () { offs.forEach(function (fn) { fn(); }); try { dispose(); } catch (e) {} };
      }
    });
  }
  function byId(id) { for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].id === id) return TOOLS[i]; return null; }

  addTool("drama", "Drama Timer", "A huge ring for the scene.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.sec == null) bag.sec = 180;
    if (bag.chime == null) bag.chime = false;
    var left = bag.sec, total = bag.sec, timer = 0, running = false;
    var res = resultBar(body);
    var wrap = el("div", "ringwrap");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 120 120");
    var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", "60"); c.setAttribute("cy", "60"); c.setAttribute("r", "46");
    c.setAttribute("fill", "none"); c.setAttribute("stroke-width", "10");
    c.setAttribute("stroke", "currentColor"); c.setAttribute("transform", "rotate(-90 60 60)");
    svg.append(c); wrap.append(svg); body.append(wrap);
    var row = el("div", "row");
    var start = btn(""); var reset = btn(""); var chime = btn("");
    function paintRun() {
      if (running && window.BitsI18n) BitsI18n.showShared(start, "pause");
      else if (window.BitsI18n) BitsI18n.show(start, "start");
      else start.textContent = running ? "Pause" : "Start";
    }
    function paintChime() {
      chime.setAttribute("aria-pressed", bag.chime ? "true" : "false");
      if (window.BitsI18n) BitsI18n.show(chime, bag.chime ? "chimeOn" : "chimeOff");
      else chime.textContent = bag.chime ? "Chime on" : "Chime off";
    }
    if (window.BitsI18n) BitsI18n.show(reset, "reset"); else reset.textContent = "Reset";
    paintRun(); paintChime();
    row.append(start, reset, chime); body.append(row);
    var setRow = el("div", "row");
    var mins = numField("Minutes", Math.floor(bag.sec / 60), function () {});
    var secs = numField("Seconds", bag.sec % 60, function () {});
    setRow.append(mins.wrap, secs.wrap); body.append(setRow);
    function paint() {
      var m = Math.floor(left / 60), s = left % 60;
      var label = m + ":" + String(s).padStart(2, "0");
      res.set(label);
      var circ = 2 * Math.PI * 46;
      var p = total > 0 ? left / total : 0;
      c.setAttribute("stroke-dasharray", String(circ));
      c.setAttribute("stroke-dashoffset", String(circ * (1 - p)));
      c.setAttribute("stroke", left <= 10 ? "#ff5a4a" : "currentColor");
      wrap.classList.toggle("boom", left === 0);
    }
    function stop() { running = false; clearInterval(timer); paintRun(); }
    start.addEventListener("click", function () {
      if (running) { stop(); return; }
      if (left <= 0) {
        var t = Math.max(0, Math.round((Number(mins.input.value) || 0) * 60 + (Number(secs.input.value) || 0)));
        bag.sec = t; total = t; left = t; ctx.save();
      }
      if (left <= 0) return;
      running = true; paintRun();
      timer = setInterval(function () {
        left -= 1; paint();
        if (left <= 0) {
          stop();
          if (!reduced()) wrap.classList.add("shake");
          shipScore("drama", 1, 1);
          if (bag.chime) {
            try {
              var ac = new AudioContext();
              var o = ac.createOscillator(), g = ac.createGain();
              o.frequency.value = 880; o.connect(g); g.connect(ac.destination);
              g.gain.setValueAtTime(0.0001, ac.currentTime);
              g.gain.exponentialRampToValueAtTime(0.15, ac.currentTime + 0.02);
              g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.35);
              o.start(); o.stop(ac.currentTime + 0.4);
              o.onended = function () { ac.close(); };
            } catch (e) {}
          }
        }
      }, 1000);
    });
    reset.addEventListener("click", function () {
      stop(); wrap.classList.remove("shake");
      var t = Math.max(0, Math.round((Number(mins.input.value) || 0) * 60 + (Number(secs.input.value) || 0)));
      bag.sec = t; total = t || 1; left = t; ctx.save(); paint();
    });
    chime.addEventListener("click", function () {
      bag.chime = !bag.chime; paintChime(); ctx.save();
    });
    paint();
    ctx.onLang(paintRun); ctx.onLang(paintChime);
    return function () { clearInterval(timer); };
  });

  function hm(v) { var m = /^(\d{1,2}):(\d{2})$/.exec(v || ""); return m ? Number(m[1]) * 60 + Number(m[2]) : null; }
  function leftText(mins) {
    var s = Math.max(0, Math.round(mins * 60));
    var h = Math.floor(s / 3600); s -= h * 3600;
    var m = Math.floor(s / 60), sec = s % 60, p = function (n) { return String(n).padStart(2, "0"); };
    return h ? h + ":" + p(m) + ":" + p(sec) : m + ":" + p(sec);
  }
  addTool("bell", "Countdown to Bell", "Solvay periods, teacher times.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.periods) bag.periods = BELLS.map(function (p) { return { id: p[0], start: p[1], end: p[2] }; });
    var res = resultBar(body);
    var note = el("p", "note");
    if (window.BitsI18n) BitsI18n.show(note, "bellNote"); else note.textContent = "Starting Solvay day. Edit the times for this Chromebook.";
    body.append(note);
    var edit = btn("");
    if (window.BitsI18n) BitsI18n.show(edit, "editTimes"); else edit.textContent = "Edit times";
    body.append(edit);
    var form = el("div");
    form.hidden = true;
    bag.periods.forEach(function (p) {
      var row = el("div", "row");
      var lab = el("strong"); lab.textContent = p.id;
      var a = field({ k: "periodStart" }, p.start, function (v) { p.start = v; ctx.save(); }, "time");
      var b = field({ k: "periodEnd" }, p.end, function (v) { p.end = v; ctx.save(); }, "time");
      row.append(lab, a.wrap, b.wrap); form.append(row);
    });
    body.append(form);
    edit.addEventListener("click", function () { form.hidden = !form.hidden; });
    function tick() {
      var now = new Date();
      var m = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
      var cur = null, next = null;
      bag.periods.forEach(function (p) {
        var a = hm(p.start), b = hm(p.end);
        if (a == null || b == null) return;
        if (m >= a && m < b) cur = { p: p, left: b - m };
        else if (a > m && (!next || a < next.at)) next = { p: p, at: a, left: a - m };
      });
      if (cur) res.set(bbf("leftIn", { time: leftText(cur.left), id: cur.p.id }));
      else if (next) res.set(bbf("until", { time: leftText(next.left), id: next.p.id }));
      else res.set(bb("dayOver"));
    }
    tick();
    ctx.onLang(tick);
    var timer = setInterval(tick, 250);
    return function () { clearInterval(timer); };
  });

  addTool("dice", "Dice / Teams", "Dice, a wheel, or crews. No names.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.teams) bag.teams = 4;
    if (!bag.seats) bag.seats = 16;
    if (!bag.mode) bag.mode = "Dice";
    var res = resultBar(body);
    var host = el("div");
    body.append(host);
    body.append(seg(["Dice", "Wheel", "Teams"], bag.mode, function (m) { bag.mode = m; ctx.save(); draw(); }));
    function draw() {
      host.textContent = "";
      if (bag.mode === "Dice") {
        var scene = el("div", "scene");
        var cube = el("div", "cube");
        var show = { 1: [0, 0], 2: [-90, 0], 3: [0, -90], 4: [0, 90], 5: [90, 0], 6: [0, 180] };
        var pips = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
        var faces = { 1: "rotateY(0deg) translateZ(70px)", 6: "rotateY(180deg) translateZ(70px)", 3: "rotateY(90deg) translateZ(70px)", 4: "rotateY(-90deg) translateZ(70px)", 2: "rotateX(90deg) translateZ(70px)", 5: "rotateX(-90deg) translateZ(70px)" };
        var turn = 0;
        Object.keys(faces).forEach(function (n) {
          var f = el("div", "face");
          f.style.transform = faces[n];
          for (var i = 0; i < 9; i++) {
            var cell = el("div");
            if (pips[n].indexOf(i) >= 0) cell.className = "pip";
            f.append(cell);
          }
          cube.append(f);
        });
        scene.append(cube); host.append(scene);
        var roll = btn("");
        if (window.BitsI18n) BitsI18n.show(roll, "roll"); else roll.textContent = "Roll";
        roll.addEventListener("click", function () {
          var n = 1 + Math.floor(Math.random() * 6);
          if (!reduced()) turn += 2;
          var a = show[n];
          cube.style.transform = "rotateX(" + (a[0] + turn * 360) + "deg) rotateY(" + (a[1] + turn * 360) + "deg)";
          res.set(bbf("die", { n: n }));
          shipScore("dice", n, 6);
        });
        host.append(roll);
        res.set(bbf("die", { n: 1 }));
      } else if (bag.mode === "Wheel") {
        var pointer = el("div", "pointer");
        var rotor = el("div", "rotor");
        var stops = CREW.slice(0, 6).map(function (c, i) { return c + " " + (i * 60) + "deg " + ((i + 1) * 60) + "deg"; }).join(", ");
        rotor.style.background = "conic-gradient(" + stops + ")";
        var deg = 0;
        host.append(pointer, rotor);
        var spin = btn("");
        if (window.BitsI18n) BitsI18n.show(spin, "spin"); else spin.textContent = "Spin";
        spin.addEventListener("click", function () {
          var pick = Math.floor(Math.random() * 6);
          var target = (360 - (pick * 60 + 30) + 360) % 360;
          var current = ((deg % 360) + 360) % 360;
          var delta = (target - current + 360) % 360;
          deg += (reduced() ? 0 : 1440) + delta;
          rotor.style.transform = "rotate(" + deg + "deg)";
          var names = COLOR_KEY.slice(0, 6).map(colorName);
          res.set(bbf("crew", { name: names[pick] }));
        });
        host.append(spin);
        res.set(bb("spinWheel"));
      } else {
        var teams = numField("Teams", bag.teams, function (v) { bag.teams = Math.max(2, Math.min(8, v || 2)); ctx.save(); draw(); });
        var seats = numField("Seats", bag.seats, function (v) { bag.seats = Math.max(bag.teams, Math.min(36, v || bag.teams)); ctx.save(); draw(); });
        var row = el("div", "row"); row.append(teams.wrap, seats.wrap); host.append(row);
        var grid = el("div", "teamgrid");
        var names = COLOR_KEY.map(colorName);
        for (var i = 1; i <= bag.seats; i++) {
          var t = (i - 1) % bag.teams;
          var s = el("div", "seat");
          s.style.background = CREW[t];
          s.style.color = "#102033";
          s.textContent = String(i);
          s.title = bbf("seat", { n: i, name: names[t] });
          grid.append(s);
        }
        host.append(grid);
        res.set(bbf("crews", { teams: bag.teams, seats: bag.seats }));
      }
    }
    draw();
    ctx.onLang(draw);
  });

  addTool("noise", "Noise Meter", "Live only. Never recorded.", function (body, ctx) {
    var res = resultBar(body);
    var meter = el("div", "meter");
    meter.append(el("i", "c"), el("i", "l"), el("i", "h"));
    var needle = el("div", "needle");
    body.append(meter, needle);
    var note = el("p", "note");
    if (window.BitsI18n) BitsI18n.show(note, "noiseNote"); else note.textContent = "Calm, then loud. The mic is asked on the first tap and is not saved.";
    body.append(note);
    var listen = btn("");
    body.append(listen);
    var stream = null, ac = null, raf = 0, on = false, zoneKey = "";
    function paintListen() {
      if (window.BitsI18n) BitsI18n.show(listen, on ? "stopMic" : "listen");
      else listen.textContent = on ? "Stop mic" : "Listen";
    }
    paintListen();
    function level(buf) {
      var s = 0, i;
      for (i = 0; i < buf.length; i++) { var v = (buf[i] - 128) / 128; s += v * v; }
      return Math.sqrt(s / buf.length);
    }
    function stop() {
      on = false; cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
      if (ac) ac.close();
      stream = null; ac = null; paintListen();
    }
    listen.addEventListener("click", function () {
      if (on) { stop(); res.set(bb("micOff")); return; }
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        res.set(bb("micDenied"));
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(function (st) {
        stream = st; ac = new AudioContext();
        var src = ac.createMediaStreamSource(st);
        var an = ac.createAnalyser();
        an.fftSize = 1024; src.connect(an);
        var buf = new Uint8Array(an.fftSize);
        on = true; paintListen();
        var loop = function () {
          if (!on) return;
          an.getByteTimeDomainData(buf);
          var rms = level(buf);
          var pct = Math.max(0, Math.min(100, rms * 280));
          needle.style.marginLeft = "calc(" + pct + "% - 9px)";
          zoneKey = pct < 45 ? "calm" : pct < 75 ? "chatty" : "loud";
          res.set(bbf("zone", { zone: bb(zoneKey), n: Math.round(pct) }));
          raf = requestAnimationFrame(loop);
        };
        loop();
      }).catch(function () { res.set(bb("micDenied")); });
    });
    res.set(bb("tapListen"));
    ctx.onLang(function () { paintListen(); if (zoneKey) { /* live loop refreshes */ } });
    return stop;
  });

  addTool("calc", "Calculator", "Basic and scientific, one tile.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.mode) bag.mode = "Basic";
    if (bag.deg == null) bag.deg = true;
    var expr = "";
    var res = resultBar(body);
    res.set("0");
    body.append(seg(["Basic", "Scientific"], bag.mode, function (m) { bag.mode = m; ctx.save(); keys(); }));
    var ang = btn("");
    function paintAng() {
      if (window.BitsI18n) BitsI18n.show(ang, bag.deg ? "degrees" : "radians");
      else ang.textContent = bag.deg ? "Degrees" : "Radians";
    }
    paintAng();
    ang.addEventListener("click", function () { bag.deg = !bag.deg; paintAng(); ctx.save(); });
    body.append(ang);
    var pad = el("div", "keys");
    body.append(pad);
    function push(ch) { expr += ch; res.set(expr); }
    function run() {
      try {
        var v = evalExpr(expr, bag.deg);
        evalExpr.ans = v;
        res.set(fmt(v));
        expr = fmt(v);
        shipScore("calc", 1, 1);
      } catch (e) { res.set(bb("cantRead")); expr = ""; }
    }
    function keys() {
      pad.textContent = "";
      var list = ["7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "%", "+"];
      if (bag.mode === "Scientific") list = ["sin", "cos", "tan", "π", "ln", "log", "sqrt", "^", "7", "8", "9", "÷", "4", "5", "6", "×", "1", "2", "3", "−", "0", ".", "ans", "+"];
      list.forEach(function (k) {
        var b = btn(k); b.classList.add("key");
        b.addEventListener("click", function () {
          if (k === "sin" || k === "cos" || k === "tan" || k === "ln" || k === "log" || k === "sqrt") push(k + "(");
          else if (k === "π") push("pi");
          else if (k === "×") push("*");
          else if (k === "÷") push("/");
          else if (k === "−") push("-");
          else push(k);
        });
        pad.append(b);
      });
      var eq = btn("="); eq.classList.add("key"); eq.addEventListener("click", run);
      var clr = btn("C"); clr.classList.add("key"); clr.addEventListener("click", function () { expr = ""; res.set("0"); });
      pad.append(clr, eq);
    }
    keys();
    ctx.onLang(paintAng);
  });

  addTool("prompt", "Random Prompt", "A design challenge on tap.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.i == null) bag.i = Math.floor(Math.random() * PROMPTS.length);
    var res = resultBar(body);
    function show() {
      var rows = window.BitsI18n ? BitsI18n.prompts() : PROMPTS;
      res.set(rows[bag.i] || PROMPTS[bag.i] || "");
    }
    var b = btn("");
    if (window.BitsI18n) BitsI18n.show(b, "newPrompt"); else b.textContent = "New prompt";
    b.addEventListener("click", function () { bag.i = (bag.i + 1) % PROMPTS.length; ctx.save(); show(); });
    body.append(b); show();
    ctx.onLang(show);
  });

  addTool("tape", "Tape reader", "Tap a tick or type millimeters.", function (body) {
    var res = resultBar(body);
    var mm = field("Millimeters", "", function (v) {
      var n = Number(v);
      if (!Number.isFinite(n)) return;
      var six = Math.round(n / 25.4 * 16);
      six = Math.max(0, Math.min(12 * 16, six));
      light(six, false);
    }, "number");
    body.append(mm.wrap);
    var scroller = el("div", "tape-scroll");
    var tape = el("div", "tape");
    var ticks = [];
    for (var i = 0; i <= 12 * 16; i++) {
      var t = btn("");
      t.className = "tick" + (i % 16 === 0 ? " inch" : i % 8 === 0 ? " half" : "");
      if (i % 16 === 0) { var s = el("span"); s.textContent = String(i / 16); t.append(s); }
      (function (n, node) {
        node.addEventListener("click", function () { light(n, true); });
      })(i, t);
      ticks.push(t); tape.append(t);
    }
    scroller.append(tape); body.append(scroller);
    function light(n, fromTap) {
      ticks.forEach(function (t) { t.classList.remove("lit"); });
      var node = ticks[n];
      if (!node) return;
      node.classList.add("lit");
      var label = inchLabel(n / 16);
      res.set(label);
      if (!fromTap) mm.input.value = (n / 16 * 25.4).toFixed(1);
      var left = node.offsetLeft - scroller.clientWidth / 2 + 22;
      scroller.scrollLeft = Math.max(0, left);
    }
    light(0, true);
  });

  addTool("cuts", "Cut list", "Pieces on sticks, kerf shown.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.stock) bag.stock = "96";
    if (!bag.kerf) bag.kerf = "1/8";
    if (!bag.parts) bag.parts = [{ piece: "leg", len: "10 1/2", qty: 4, done: {} }, { piece: "rail", len: "18", qty: 2, done: {} }];
    var res = resultBar(body);
    var stock = field("Stick length", bag.stock, function (v) { bag.stock = v; ctx.save(); draw(); });
    var kerf = field("Kerf", bag.kerf, function (v) { bag.kerf = v; ctx.save(); draw(); });
    var top = el("div", "row"); top.append(stock.wrap, kerf.wrap); body.append(top);
    var list = el("div"); body.append(list);
    var add = btn("");
    if (window.BitsI18n) BitsI18n.show(add, "addPiece"); else add.textContent = "Add piece";
    add.addEventListener("click", function () {
      bag.parts.push({ piece: "shelf", len: "12", qty: 1, done: {} }); ctx.save(); draw();
    });
    body.append(add);
    var host = el("div"); body.append(host);
    function draw() {
      list.textContent = "";
      bag.parts.forEach(function (p, idx) {
        var row = el("div", "row");
        var piece = field({ k: "piece" }, p.piece, function (v) { p.piece = v.slice(0, 24); ctx.save(); paint(); });
        var len = field({ k: "length" }, p.len, function (v) { p.len = v; ctx.save(); paint(); });
        var qty = numField("How many", p.qty, function (v) { p.qty = Math.max(1, Math.min(24, v || 1)); ctx.save(); paint(); });
        var rm = btn("");
        if (window.BitsI18n) BitsI18n.show(rm, "remove"); else rm.textContent = "Remove";
        rm.addEventListener("click", function () { bag.parts.splice(idx, 1); ctx.save(); draw(); });
        row.append(piece.wrap, len.wrap, qty.wrap, rm); list.append(row);
      });
      paint();
    }
    function paint() {
      var stockIn = parseLen(bag.stock) || 0;
      var kerfIn = parseLen(bag.kerf) || 0;
      var items = [];
      bag.parts.forEach(function (p, pi) {
        var len = parseLen(p.len);
        if (len == null) return;
        var qty = Math.max(1, Math.min(24, Number(p.qty) || 1));
        if (!p.done) p.done = {};
        for (var i = 0; i < qty; i++) items.push({ key: pi + "-" + i, piece: p.piece || "piece", len: len, cut: !!p.done[i], pi: pi, i: i });
      });
      items.sort(function (a, b) { return b.len - a.len; });
      var sticks = [];
      var tooLong = [];
      items.forEach(function (item) {
        if (!(stockIn > 0) || item.len > stockIn + 1e-6) { tooLong.push(item); return; }
        var placed = false;
        for (var s = 0; s < sticks.length; s++) {
          var used = sticks[s].reduce(function (sum, x) { return sum + x.len; }, 0) + kerfIn * sticks[s].length;
          if (used + item.len <= stockIn + 1e-6) { sticks[s].push(item); placed = true; break; }
        }
        if (!placed) sticks.push([item]);
      });
      host.textContent = "";
      tooLong.forEach(function (item) {
        var warn = el("p", "note");
        warn.textContent = bbf("tooLong", { piece: item.piece || bb("piece") });
        host.append(warn);
      });
      sticks.forEach(function (stick, si) {
        var lab = el("div", "note");
        lab.textContent = bbf("stickN", { n: si + 1 });
        var bar = el("div", "stick");
        stick.forEach(function (item, ii) {
          if (ii > 0) {
            var k = el("div", "kerf");
            k.style.width = stockIn > 0 ? (kerfIn / stockIn * 100) + "%" : "4px";
            bar.append(k);
          }
          var segB = btn(item.piece);
          segB.className = "segpiece" + (item.cut ? " cut" : "");
          segB.style.width = stockIn > 0 ? Math.min(100, item.len / stockIn * 100) + "%" : "40%";
          segB.addEventListener("click", function () {
            bag.parts[item.pi].done[item.i] = !bag.parts[item.pi].done[item.i];
            ctx.save(); paint();
            shipScore("cuts", 1, 1);
          });
          bar.append(segB);
        });
        var used = stick.reduce(function (sum, x) { return sum + x.len; }, 0) + kerfIn * Math.max(0, stick.length - 1);
        if (stockIn > used) {
          var w = el("div", "waste");
          w.style.width = ((stockIn - used) / stockIn * 100) + "%";
          bar.append(w);
        }
        host.append(lab, bar);
      });
      var buy = sticks.length === 1 ? bb("buyOne") : bbf("buyMany", { n: sticks.length });
      if (tooLong.length) buy += " · " + bbf("tooLongN", { n: tooLong.length });
      res.set(buy);
    }
    draw();
    ctx.onLang(draw);
  });

  addTool("robot", "Robot drive", "Wheel, distance, and a 90° turn.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.d == null) bag.d = 65;
    if (bag.dist == null) bag.dist = 1000;
    if (bag.track == null) bag.track = 120;
    var res = resultBar(body);
    var bed = el("div", "rollbed");
    var wheel = el("div", "wheel");
    bed.append(wheel); body.append(bed);
    function paint() {
      var go = driveMath(bag.d, bag.dist);
      var spin = turn90(bag.d, bag.track);
      if (!go) { res.set(bb("needsWheel")); return; }
      res.set(bbf("turns", { turns: fmt(go.turns), deg: fmt(go.degrees, 1), each: spin ? fmt(spin.degrees, 1) : "—" }));
    }
    var d = numField("Wheel size", bag.d, function (v) { bag.d = v; ctx.save(); paint(); });
    var dist = numField("Distance", bag.dist, function (v) { bag.dist = v; ctx.save(); paint(); });
    var track = numField("Track (90°)", bag.track, function (v) { bag.track = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(d.wrap, dist.wrap, track.wrap); body.append(row);
    var note = el("p", "note");
    if (window.BitsI18n) BitsI18n.show(note, "robotNote"); else note.textContent = "Same unit for wheel, distance, and track. A point turn rolls the wheels opposite ways.";
    body.append(note);
    var roll = btn("");
    if (window.BitsI18n) BitsI18n.show(roll, "roll"); else roll.textContent = "Roll";
    roll.addEventListener("click", function () {
      var go = driveMath(bag.d, bag.dist);
      if (!go) return;
      var deg = go.turns * 360;
      if (reduced()) { wheel.style.transform = "translateX(70%) rotate(" + deg + "deg)"; return; }
      wheel.style.transition = "none";
      wheel.style.transform = "translateX(0) rotate(0deg)";
      requestAnimationFrame(function () {
        wheel.style.transition = "transform 1.2s linear";
        wheel.style.transform = "translateX(70%) rotate(" + deg + "deg)";
      });
    });
    body.append(roll); paint();
    ctx.onLang(paint);
  });

  addTool("sheet", "Sheet fit", "How many fit on a Cricut mat.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.unit) bag.unit = "in";
    if (bag.w == null) bag.w = 4;
    if (bag.h == null) bag.h = 3;
    if (bag.gap == null) bag.gap = 0.25;
    if (bag.sheetW == null) bag.sheetW = 18;
    if (bag.sheetH == null) bag.sheetH = 24;
    if (!bag.mat) bag.mat = "12×12";
    var res = resultBar(body);
    var pic = el("div"); body.append(pic);
    function matSize() {
      if (bag.mat === "Sheet") return [bag.sheetW, bag.sheetH];
      if (bag.mat === "12×24") return bag.unit === "cm" ? [30.48, 60.96] : [12, 24];
      return bag.unit === "cm" ? [30.48, 30.48] : [12, 12];
    }
    function paint() {
      var mat = matSize();
      var a = packCount(mat[0], mat[1], bag.w, bag.h, bag.gap);
      var b = packCount(mat[0], mat[1], bag.h, bag.w, bag.gap);
      var turned = b.n > a.n;
      var best = turned ? b : a;
      var sw = turned ? bag.h : bag.w, sh = turned ? bag.w : bag.h;
      res.set(sheetLine(mat[0], mat[1], bag.w, bag.h, bag.gap));
      pic.textContent = "";
      var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", "0 0 " + mat[0] + " " + mat[1]);
      svg.setAttribute("class", "mat");
      svg.style.width = "100%"; svg.style.height = "180px";
      var frame = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      frame.setAttribute("x", "0.35"); frame.setAttribute("y", "0.35");
      frame.setAttribute("width", Math.max(0, mat[0] - 0.7)); frame.setAttribute("height", Math.max(0, mat[1] - 0.7));
      frame.setAttribute("fill", "none"); frame.setAttribute("stroke", "currentColor"); frame.setAttribute("stroke-width", String(Math.max(mat[0], mat[1]) * 0.012));
      svg.append(frame);
      var stepX = sw + bag.gap, stepY = sh + bag.gap;
      for (var r = 0; r < best.rows; r++) for (var c = 0; c < best.cols; c++) {
        var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", c * stepX); rect.setAttribute("y", r * stepY);
        rect.setAttribute("width", sw); rect.setAttribute("height", sh);
        rect.setAttribute("fill", "currentColor"); rect.setAttribute("opacity", "0.85");
        svg.append(rect);
      }
      pic.append(svg);
    }
    body.append(seg(["in", "cm"], bag.unit, function (u) { bag.unit = u; ctx.save(); paint(); }));
    body.append(seg(["12×12", "12×24", "Sheet"], bag.mat, function (m) { bag.mat = m; ctx.save(); paint(); }));
    var w = numField("Shape width", bag.w, function (v) { bag.w = v; ctx.save(); paint(); });
    var h = numField("Shape height", bag.h, function (v) { bag.h = v; ctx.save(); paint(); });
    var g = numField("Gap", bag.gap, function (v) { bag.gap = Math.max(0, v || 0); ctx.save(); paint(); });
    var row = el("div", "row"); row.append(w.wrap, h.wrap, g.wrap); body.append(row);
    var sw = numField("Sheet width", bag.sheetW || 18, function (v) { bag.sheetW = v; ctx.save(); paint(); });
    var sh = numField("Sheet height", bag.sheetH || 24, function (v) { bag.sheetH = v; ctx.save(); paint(); });
    var row2 = el("div", "row"); row2.append(sw.wrap, sh.wrap); body.append(row2);
    paint();
    ctx.onLang(paint);
  });

  addTool("strength", "Strength score", "Load ÷ build mass. No names.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.tries) bag.tries = [];
    if (bag.load == null) bag.load = 20;
    if (bag.mass == null) bag.mass = 4;
    var res = resultBar(body);
    var bars = el("div", "bars");
    body.append(bars);
    function score(load, mass) { return mass > 0 ? load / mass : null; }
    function paint() {
      var s = score(bag.load, bag.mass);
      res.set(s == null ? bb("needsMass") : bbf("score", { n: fmt(s) }));
      bars.textContent = "";
      var max = 1;
      bag.tries.forEach(function (t) { var v = score(t.load, t.mass); if (v > max) max = v; });
      bag.tries.forEach(function (t, i) {
        var v = score(t.load, t.mass) || 0;
        var col = el("span");
        col.style.height = Math.max(4, v / max * 100) + "%";
        col.title = bbf("tryTitle", { n: i + 1, v: fmt(v) });
        bars.append(col);
      });
    }
    var load = numField("Load held", bag.load, function (v) { bag.load = v; ctx.save(); paint(); });
    var mass = numField("Build mass", bag.mass, function (v) { bag.mass = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(load.wrap, mass.wrap); body.append(row);
    var log = btn("");
    if (window.BitsI18n) BitsI18n.show(log, "logTry"); else log.textContent = "Log try";
    log.addEventListener("click", function () {
      if (!(bag.mass > 0)) { res.set(bb("needsMass")); return; }
      bag.tries.push({ load: bag.load, mass: bag.mass });
      if (bag.tries.length > 12) bag.tries.shift();
      ctx.save(); paint();
      shipScore("strength", 1, 1);
    });
    body.append(log);
    var note = el("p", "note");
    if (window.BitsI18n) BitsI18n.show(note, "strengthNote"); else note.textContent = "Same unit on both. The bar is the try, not a person.";
    body.append(note);
    paint();
    ctx.onLang(paint);
  });

  function convert(cat, amount, from, to) {
    var tables = {
      Length: { in: 1, ft: 12, mm: 1 / 25.4, cm: 1 / 2.54, m: 39.3700787 },
      Mass: { g: 1, kg: 1000, oz: 28.349523125, lb: 453.59237 },
      Volume: { mL: 1, L: 1000, tsp: 4.92892, cup: 236.588, fl_oz: 29.5735 }
    };
    if (cat === "Temp") {
      var c = from === "F" ? (amount - 32) * 5 / 9 : from === "K" ? amount - 273.15 : amount;
      if (to === "F") return c * 9 / 5 + 32;
      if (to === "K") return c + 273.15;
      return c;
    }
    var t = tables[cat];
    return amount * t[from] / t[to];
  }
  addTool("convert", "Convert", "Length, mass, volume, temperature.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.cat) bag.cat = "Length";
    if (bag.n == null) bag.n = 1;
    var units = { Length: ["in", "ft", "mm", "cm", "m"], Mass: ["g", "kg", "oz", "lb"], Volume: ["mL", "L", "tsp", "cup", "fl_oz"], Temp: ["F", "C", "K"] };
    if (!bag.from) bag.from = "in";
    if (!bag.to) bag.to = "mm";
    var res = resultBar(body);
    function paint() {
      var u = units[bag.cat];
      if (u.indexOf(bag.from) < 0) bag.from = u[0];
      if (u.indexOf(bag.to) < 0) bag.to = u[Math.min(1, u.length - 1)];
      var dp = bag.to === "mm" ? 1 : 2;
      res.set(fmt(convert(bag.cat, bag.n, bag.from, bag.to), dp) + " " + bag.to);
    }
    body.append(seg([{ id: "Length", k: "catLength" }, { id: "Mass", k: "catMass" }, { id: "Volume", k: "catVolume" }, { id: "Temp", k: "catTemp" }], bag.cat, function (c) { bag.cat = c; ctx.save(); build(); paint(); }));
    var host = el("div", "row"); body.append(host);
    function build() {
      host.textContent = "";
      var n = numField("Amount", bag.n, function (v) { bag.n = v; ctx.save(); paint(); });
      host.append(n.wrap);
      ["from", "to"].forEach(function (key) {
        var lab = el("label", "field");
        var cap = el("span");
        if (window.BitsI18n) BitsI18n.show(cap, key === "from" ? "from" : "to");
        else cap.textContent = key === "from" ? "From" : "To";
        lab.append(cap);
        var sel = el("select");
        units[bag.cat].forEach(function (u) {
          var o = el("option"); o.value = u; o.textContent = u; if (u === bag[key]) o.selected = true; sel.append(o);
        });
        sel.addEventListener("change", function () { bag[key] = sel.value; ctx.save(); paint(); });
        lab.append(sel); host.append(lab);
      });
    }
    build(); paint();
    ctx.onLang(function () { build(); paint(); });
  });

  addTool("scale", "Scale", "Model length times the ratio.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.model == null) bag.model = 6;
    if (bag.ratio == null) bag.ratio = 12;
    var res = resultBar(body);
    function paint() {
      var real = bag.model * bag.ratio;
      var feet = Math.floor(real / 12), inches = real - feet * 12;
      res.set(bbf("scaleOut", { real: fmt(real), ft: feet, inch: fmt(inches) }));
    }
    var a = numField("Model inches", bag.model, function (v) { bag.model = v; ctx.save(); paint(); });
    var b = numField("1 to", bag.ratio, function (v) { bag.ratio = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(a.wrap, b.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  addTool("volume", "Volume", "Box, cylinder, or sphere.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.shape) bag.shape = "Box";
    if (bag.a == null) bag.a = 4;
    if (bag.b == null) bag.b = 3;
    if (bag.c == null) bag.c = 2;
    var res = resultBar(body);
    function paint() {
      var v = 0;
      if (bag.shape === "Box") v = bag.a * bag.b * bag.c;
      else if (bag.shape === "Cylinder") v = Math.PI * bag.a * bag.a * bag.b;
      else v = 4 / 3 * Math.PI * Math.pow(bag.a, 3);
      var shown = fmt(v);
      res.set(bbf("cubic", { v: shown }));
    }
    body.append(seg(["Box", "Cylinder", "Sphere"], bag.shape, function (s) { bag.shape = s; ctx.save(); paint(); }));
    var a = numField("A / radius", bag.a, function (v) { bag.a = v; ctx.save(); paint(); });
    var b = numField("B / height", bag.b, function (v) { bag.b = v; ctx.save(); paint(); });
    var c = numField("C", bag.c, function (v) { bag.c = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(a.wrap, b.wrap, c.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  addTool("speed", "Speed", "Distance, speed, or time.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.solve) bag.solve = "Time";
    if (bag.d == null) bag.d = 100;
    if (bag.v == null) bag.v = 2;
    if (bag.t == null) bag.t = 50;
    var res = resultBar(body);
    function paint() {
      var out = "—";
      if (bag.solve === "Time" && bag.v) out = bbf("timeOut", { n: fmt(bag.d / bag.v) });
      else if (bag.solve === "Speed" && bag.t) out = bbf("speedOut", { n: fmt(bag.d / bag.t) });
      else if (bag.solve === "Distance") out = bbf("distOut", { n: fmt(bag.v * bag.t) });
      else out = bb("needsPos");
      res.set(out);
    }
    body.append(seg(["Distance", "Speed", "Time"], bag.solve, function (s) { bag.solve = s; ctx.save(); paint(); }));
    var d = numField("Distance", bag.d, function (v) { bag.d = v; ctx.save(); paint(); });
    var v = numField("Speed", bag.v, function (v0) { bag.v = v0; ctx.save(); paint(); });
    var t = numField("Time", bag.t, function (v0) { bag.t = v0; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(d.wrap, v.wrap, t.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  addTool("circuits", "Circuits", "Ohm's law, series, and parallel.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.mode) bag.mode = "Ohm";
    if (bag.v == null) bag.v = 9;
    if (bag.i == null) bag.i = 0.02;
    if (bag.r == null) bag.r = 450;
    if (bag.r2 == null) bag.r2 = 450;
    if (!bag.solve) bag.solve = "Ohms";
    var res = resultBar(body);
    function paint() {
      if (bag.mode === "Ohm") {
        var out = "—";
        if (!bag.solve) bag.solve = "Ohms";
        if (bag.solve === "Ohms") out = bag.i ? fmt(bag.v / bag.i) + " Ω" : bb("needsAmps");
        else if (bag.solve === "Amps") out = bag.r ? fmt(bag.v / bag.r) + " A" : bb("needsOhms");
        else out = fmt(bag.i * bag.r) + " V";
        res.set(out);
      } else if (bag.mode === "Series") {
        var r = bag.r + bag.r2;
        res.set(bbf("seriesOut", { r: fmt(r), a: r ? fmt(bag.v / r) : "—" }));
      } else {
        var r2 = (bag.r > 0 && bag.r2 > 0) ? 1 / (1 / bag.r + 1 / bag.r2) : NaN;
        res.set(bbf("parallelOut", { r: fmt(r2), a: r2 ? fmt(bag.v / r2) : "—" }));
      }
    }
    body.append(seg(["Ohm", "Series", "Parallel"], bag.mode, function (m) { bag.mode = m; ctx.save(); paint(); }));
    body.append(seg(["Volts", "Amps", "Ohms"], bag.solve, function (s) { bag.solve = s; ctx.save(); paint(); }));
    var v = numField("Volts", bag.v, function (n) { bag.v = n; ctx.save(); paint(); });
    var i = numField("Amps", bag.i, function (n) { bag.i = n; ctx.save(); paint(); });
    var r = numField("Ohms", bag.r, function (n) { bag.r = n; ctx.save(); paint(); });
    var r2 = numField("Ohms 2", bag.r2, function (n) { bag.r2 = n; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(v.wrap, i.wrap, r.wrap, r2.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  addTool("levers", "Levers", "Load times arm equals effort times arm.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.load == null) bag.load = 10;
    if (bag.la == null) bag.la = 20;
    if (bag.ea == null) bag.ea = 40;
    var res = resultBar(body);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 80"); svg.setAttribute("class", "fig"); svg.style.width = "100%"; svg.style.height = "90px";
    body.append(svg);
    function paint() {
      var effort = bag.ea > 0 ? bag.load * bag.la / bag.ea : NaN;
      res.set(bbf("effort", { n: fmt(effort) }));
      svg.textContent = "";
      var ful = 40 + (bag.la / Math.max(1, bag.la + bag.ea)) * 120;
      var beam = document.createElementNS("http://www.w3.org/2000/svg", "line");
      beam.setAttribute("x1", "20"); beam.setAttribute("x2", "180"); beam.setAttribute("y1", "40"); beam.setAttribute("y2", "40");
      beam.setAttribute("stroke", "currentColor"); beam.setAttribute("stroke-width", "6");
      var tri = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      tri.setAttribute("points", ful + ",52 " + (ful - 8) + ",70 " + (ful + 8) + ",70");
      tri.setAttribute("fill", "currentColor");
      svg.append(beam, tri);
    }
    var a = numField("Load", bag.load, function (v) { bag.load = v; ctx.save(); paint(); });
    var b = numField("Load arm", bag.la, function (v) { bag.la = v; ctx.save(); paint(); });
    var c = numField("Effort arm", bag.ea, function (v) { bag.ea = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(a.wrap, b.wrap, c.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  addTool("lumber", "Lumber", "Board feet from thickness, width, length.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.t == null) bag.t = 2;
    if (bag.w == null) bag.w = 4;
    if (bag.l == null) bag.l = 8;
    if (bag.n == null) bag.n = 1;
    if (bag.actual == null) bag.actual = false;
    var res = resultBar(body);
    function dressed(n) {
      var table = { 1: 0.75, 2: 1.5, 4: 3.5, 6: 5.5, 8: 7.25, 10: 9.25, 12: 11.25 };
      if (table[n]) return table[n];
      if (!Number.isFinite(n) || n <= 0) return n;
      if (n < 2) return 0.75;
      if (n < 8) return Math.round((n - 0.5) * 100) / 100;
      return Math.round((n - 0.75) * 100) / 100;
    }
    function paint() {
      var t = bag.actual ? dressed(bag.t) : bag.t;
      var w = bag.actual ? dressed(bag.w) : bag.w;
      var bf = t * w * bag.l / 12 * bag.n;
      res.set(bag.actual ? bbf("boardFtAct", { n: fmt(bf), t: fmt(t), w: fmt(w) }) : bbf("boardFt", { n: fmt(bf) }));
    }
    var actual = btn("");
    function paintActual() {
      actual.setAttribute("aria-pressed", bag.actual ? "true" : "false");
      if (window.BitsI18n) BitsI18n.show(actual, bag.actual ? "actual" : "nominal");
      else actual.textContent = bag.actual ? "Actual sizes" : "Nominal sizes";
    }
    paintActual();
    actual.addEventListener("click", function () {
      bag.actual = !bag.actual;
      paintActual();
      ctx.save(); paint();
    });
    body.append(actual);
    var t = numField("Thick in", bag.t, function (v) { bag.t = v; ctx.save(); paint(); });
    var w = numField("Wide in", bag.w, function (v) { bag.w = v; ctx.save(); paint(); });
    var l = numField("Long ft", bag.l, function (v) { bag.l = v; ctx.save(); paint(); });
    var n = numField("How many", bag.n, function (v) { bag.n = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(t.wrap, w.wrap, l.wrap, n.wrap); body.append(row); paint();
    ctx.onLang(function () { paintActual(); paint(); });
  });

  addTool("roof", "Roof pitch", "Rise, run, and the right triangle.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.rise == null) bag.rise = 6;
    if (bag.run == null) bag.run = 12;
    if (bag.a == null) bag.a = 3;
    if (bag.b == null) bag.b = 4;
    var res = resultBar(body);
    function paint() {
      var pitch = bag.run ? bag.rise / bag.run * 12 : NaN;
      var ang = bag.run ? Math.atan2(bag.rise, bag.run) * 180 / Math.PI : NaN;
      var hyp = Math.hypot(bag.rise, bag.run);
      var c = Math.hypot(bag.a, bag.b);
      res.set(bbf("pitch", { pitch: fmt(pitch), ang: fmt(ang, 1), hyp: fmt(hyp), c: fmt(c) }));
    }
    var rise = numField("Rise", bag.rise, function (v) { bag.rise = v; ctx.save(); paint(); });
    var run = numField("Run", bag.run, function (v) { bag.run = v; ctx.save(); paint(); });
    var a = numField("Leg a", bag.a, function (v) { bag.a = v; ctx.save(); paint(); });
    var b = numField("Leg b", bag.b, function (v) { bag.b = v; ctx.save(); paint(); });
    var row = el("div", "row"); row.append(rise.wrap, run.wrap, a.wrap, b.wrap); body.append(row); paint();
    ctx.onLang(paint);
  });

  function gearPath(teeth, R) {
    var pts = [], step = Math.PI * 2 / teeth, i;
    for (i = 0; i < teeth; i++) {
      var a0 = i * step;
      var a1 = a0 + step * 0.18, a2 = a0 + step * 0.46, a3 = a0 + step * 0.64;
      [[a0, R * 0.78], [a1, R], [a2, R], [a3, R * 0.78]].forEach(function (p, idx) {
        pts.push((pts.length ? "L" : "M") + (Math.cos(p[0]) * p[1]).toFixed(1) + " " + (Math.sin(p[0]) * p[1]).toFixed(1));
      });
    }
    return pts.join(" ") + "Z";
  }
  addTool("gears", "Gears", "Teeth that really turn.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.a == null) bag.a = 12;
    if (bag.b == null) bag.b = 24;
    if (bag.rpm == null) bag.rpm = 20;
    var res = resultBar(body);
    var box = el("div", "gearbox");
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    box.append(svg); body.append(box);
    var spinA, spinB, alive = true, ang = 0, last = performance.now();
    function layout() {
      var tA = Math.max(6, Math.min(40, Math.round(bag.a)));
      var tB = Math.max(6, Math.min(40, Math.round(bag.b)));
      var k = 3.1, rA = k * tA, rB = k * tB;
      var dist = rA * 0.86 + rB * 0.86;
      var cy = Math.max(rA, rB) + 4;
      svg.setAttribute("viewBox", "0 0 " + (rA + dist + rB + 8) + " " + (cy * 2));
      svg.textContent = "";
      function gear(cx, teeth, r, ref) {
        var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("transform", "translate(" + cx + " " + cy + ")");
        var spin = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", gearPath(teeth, r));
        path.setAttribute("fill", "none"); path.setAttribute("stroke", "currentColor"); path.setAttribute("stroke-width", "2");
        var hole = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        hole.setAttribute("r", String(r * 0.25)); hole.setAttribute("fill", "none"); hole.setAttribute("stroke", "currentColor");
        spin.append(path, hole); g.append(spin); svg.append(g);
        return spin;
      }
      spinA = gear(rA + 4, tA, rA);
      spinB = gear(rA + 4 + dist, tB, rB);
      var rpmB = tB ? bag.rpm * tA / tB : 0;
      res.set(bbf("gear", { a: tA, b: tB, rpm: fmt(bag.rpm), out: fmt(rpmB) }));
      return { tA: tA, tB: tB };
    }
    var ratio = layout();
    function frame(now) {
      if (!alive) return;
      var dt = (now - last) / 1000; last = now;
      if (!reduced()) ang += (bag.rpm || 0) * 6 * dt;
      if (spinA) spinA.setAttribute("transform", "rotate(" + ang.toFixed(2) + ")");
      if (spinB && ratio.tB) spinB.setAttribute("transform", "rotate(" + (-ang * ratio.tA / ratio.tB).toFixed(2) + ")");
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    var a = numField("Teeth A", bag.a, function (v) { bag.a = v; ctx.save(); ratio = layout(); });
    var b = numField("Teeth B", bag.b, function (v) { bag.b = v; ctx.save(); ratio = layout(); });
    var rpm = numField("RPM A", bag.rpm, function (v) { bag.rpm = v; ctx.save(); ratio = layout(); });
    var row = el("div", "row"); row.append(a.wrap, b.wrap, rpm.wrap); body.append(row);
    ctx.onLang(function () { ratio = layout(); });
    return function () { alive = false; };
  });

  addTool("angles", "Angles", "Drag the ray on the protractor.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.deg == null) bag.deg = 45;
    var res = resultBar(body);
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 200 120"); svg.classList.add("pro");
    body.append(svg);
    function paint() {
      var deg = Math.max(0, Math.min(180, bag.deg));
      var rad = deg * Math.PI / 180;
      var x = 100 + Math.cos(rad) * 78, y = 108 - Math.sin(rad) * 78;
      svg.textContent = "";
      var arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      arc.setAttribute("d", "M22 108 A78 78 0 0 1 178 108");
      arc.setAttribute("fill", "none"); arc.setAttribute("stroke", "currentColor"); arc.setAttribute("stroke-width", "8");
      var ray = document.createElementNS("http://www.w3.org/2000/svg", "line");
      ray.setAttribute("x1", "100"); ray.setAttribute("y1", "108"); ray.setAttribute("x2", String(x)); ray.setAttribute("y2", String(y));
      ray.setAttribute("stroke", "currentColor"); ray.setAttribute("stroke-width", "4");
      var handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.setAttribute("cx", String(x)); handle.setAttribute("cy", String(y)); handle.setAttribute("r", "12");
      handle.setAttribute("fill", "currentColor");
      svg.append(arc, ray, handle);
      var comp = deg <= 90;
      res.set(bbf(comp ? "angleComp" : "angle", { deg: fmt(deg, 1), sup: fmt(180 - deg, 1), comp: fmt(90 - deg, 1) }));
    }
    function setFrom(e) {
      var pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      var ctm = svg.getScreenCTM();
      if (!ctm) return;
      var p = pt.matrixTransform(ctm.inverse());
      var deg = Math.atan2(108 - p.y, p.x - 100) * 180 / Math.PI;
      bag.deg = Math.max(0, Math.min(180, deg));
      ctx.save(); paint();
    }
    svg.addEventListener("pointerdown", function (e) { setFrom(e); try { svg.setPointerCapture(e.pointerId); } catch (err) {} });
    svg.addEventListener("pointermove", function (e) { if (e.pressure || e.buttons) setFrom(e); });
    paint();
    ctx.onLang(paint);
  });

  addTool("race", "Stopwatch Race", "Two to four lanes. First to the laps wins.", function (body, ctx) {
    var bag = ctx.bag;
    if (!bag.lanes) bag.lanes = 2;
    if (!bag.laps) bag.laps = 3;
    var res = resultBar(body);
    var host = el("div"); body.append(host);
    var lanesN = numField("Lanes", bag.lanes, function (v) { bag.lanes = Math.max(2, Math.min(4, v || 2)); ctx.save(); draw(true); });
    var lapsN = numField("Laps", bag.laps, function (v) { bag.laps = Math.max(1, Math.min(12, v || 1)); ctx.save(); draw(true); });
    var row = el("div", "row"); row.append(lanesN.wrap, lapsN.wrap); body.append(row);
    var state = [];
    function draw(reset) {
      if (reset || state.length !== bag.lanes) {
        state = [];
        for (var i = 0; i < bag.lanes; i++) state.push({ laps: 0, at: 0 });
      }
      host.textContent = "";
      var box = el("div", "lanes");
      var winner = -1;
      state.forEach(function (lane, i) { if (lane.laps >= bag.laps && winner < 0) winner = i; });
      state.forEach(function (lane, i) {
        var rowL = el("div", "lane" + (i === winner ? " win" : ""));
        var tap = btn("");
        tap.textContent = bbf("lane", { n: i + 1, laps: lane.laps, goal: bag.laps });
        tap.addEventListener("click", function () {
          if (winner >= 0) return;
          lane.laps += 1; lane.at = performance.now();
          draw(false);
        });
        rowL.append(tap); box.append(rowL);
      });
      host.append(box);
      res.set(winner >= 0 ? bbf("laneWin", { n: winner + 1 }) : bbf("firstTo", { n: bag.laps }));
      if (winner >= 0) shipScore("race", bag.laps, bag.laps);
    }
    var reset = btn("");
    if (window.BitsI18n) BitsI18n.show(reset, "resetRace"); else reset.textContent = "Reset race";
    reset.addEventListener("click", function () { draw(true); });
    body.append(reset);
    draw(true);
    ctx.onLang(function () { draw(false); });
  });

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, hp = h / 60, x = c * (1 - Math.abs(hp % 2 - 1));
    var r = 0, g = 0, b = 0;
    if (hp < 1) { r = c; g = x; } else if (hp < 2) { r = x; g = c; } else if (hp < 3) { g = c; b = x; }
    else if (hp < 4) { g = x; b = c; } else if (hp < 5) { r = x; b = c; } else { r = c; b = x; }
    var m = l - c / 2;
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      var d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
  }
  addTool("color", "Color Mixer", "RGB, HSL, and a hex swatch.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.r == null) { bag.r = 226; bag.g = 92; bag.b = 18; }
    var res = resultBar(body);
    var sw = el("div", "swatch"); body.append(sw);
    var host = el("div"); body.append(host);
    function hex(n) { return n.toString(16).padStart(2, "0"); }
    function paint() {
      bag.r = Math.max(0, Math.min(255, Math.round(bag.r)));
      bag.g = Math.max(0, Math.min(255, Math.round(bag.g)));
      bag.b = Math.max(0, Math.min(255, Math.round(bag.b)));
      var h = "#" + hex(bag.r) + hex(bag.g) + hex(bag.b);
      sw.style.background = h;
      var hsl = rgbToHsl(bag.r, bag.g, bag.b);
      res.set(h + "  hsl(" + hsl[0] + " " + hsl[1] + "% " + hsl[2] + "%)");
    }
    function slider(label, max, read, write) {
      var lab = el("label", "field"); lab.textContent = label;
      var input = el("input"); input.type = "range"; input.min = "0"; input.max = String(max); input.value = String(read());
      input.addEventListener("input", function () { write(Number(input.value)); ctx.save(); paint(input); });
      lab._read = read; lab._input = input;
      lab.append(input); return lab;
    }
    function paint(skip) {
      bag.r = Math.max(0, Math.min(255, Math.round(bag.r)));
      bag.g = Math.max(0, Math.min(255, Math.round(bag.g)));
      bag.b = Math.max(0, Math.min(255, Math.round(bag.b)));
      var h = "#" + hex(bag.r) + hex(bag.g) + hex(bag.b);
      sw.style.background = h;
      var hsl = rgbToHsl(bag.r, bag.g, bag.b);
      res.set(h + "  hsl(" + hsl[0] + " " + hsl[1] + "% " + hsl[2] + "%)");
      host.querySelectorAll("label").forEach(function (lab) {
        if (!lab._input || lab._input === skip) return;
        lab._input.value = String(lab._read());
      });
    }
    function build() {
      host.textContent = "";
      function live() { return rgbToHsl(bag.r, bag.g, bag.b); }
      host.append(slider("R", 255, function () { return bag.r; }, function (v) { bag.r = v; }));
      host.append(slider("G", 255, function () { return bag.g; }, function (v) { bag.g = v; }));
      host.append(slider("B", 255, function () { return bag.b; }, function (v) { bag.b = v; }));
      host.append(slider("H", 360, function () { return live()[0]; }, function (v) {
        var hsl = live(); var rgb = hslToRgb(v, hsl[1], hsl[2]); bag.r = rgb[0]; bag.g = rgb[1]; bag.b = rgb[2];
      }));
      host.append(slider("S", 100, function () { return live()[1]; }, function (v) {
        var hsl = live(); var rgb = hslToRgb(hsl[0], v, hsl[2]); bag.r = rgb[0]; bag.g = rgb[1]; bag.b = rgb[2];
      }));
      host.append(slider("L", 100, function () { return live()[2]; }, function (v) {
        var hsl = live(); var rgb = hslToRgb(hsl[0], hsl[1], v); bag.r = rgb[0]; bag.g = rgb[1]; bag.b = rgb[2];
      }));
      var copy = btn("");
      if (window.BitsI18n) BitsI18n.show(copy, "copyHex"); else copy.textContent = "Copy for TinkerCAD/Cricut";
      copy.addEventListener("click", function () {
        var h = res.node.textContent.split(/\s+/)[0];
        function done() { copy.textContent = bbf("copied", { h: h }); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(h).then(done).catch(function () { copy.textContent = h; });
        } else copy.textContent = h;
      });
      host.append(copy);
    }
    build(); paint();
    ctx.onLang(function () { build(); paint(); });
  });

  addTool("binary", "Binary / Pixel", "Eight bits, and a 16×16 grid.", function (body, ctx) {
    var bag = ctx.bag;
    if (bag.bits == null) bag.bits = 65;
    if (!bag.pixels || bag.pixels.length !== 256) bag.pixels = new Array(256).fill(0);
    var res = resultBar(body);
    var row = el("div", "bitrow");
    body.append(row);
    function paintBits() {
      row.textContent = "";
      for (var i = 7; i >= 0; i--) {
        var on = (bag.bits >> i) & 1;
        var b = btn(on ? "1" : "0");
        b.setAttribute("aria-pressed", on ? "true" : "false");
        (function (bit) {
          b.addEventListener("click", function () { bag.bits ^= (1 << bit); ctx.save(); paintBits(); });
        })(i);
        row.append(b);
      }
      var ch = bag.bits >= 32 && bag.bits < 127 ? String.fromCharCode(bag.bits) : "·";
      res.set(bbf("ascii", { n: bag.bits, ch: ch }));
    }
    var grid = el("div", "pix");
    function paintPix() {
      grid.textContent = "";
      bag.pixels.forEach(function (on, i) {
        var c = btn("");
        c.className = on ? "on" : "";
        c.style.background = on ? "" : "#123";
        if (on) c.style.background = "";
        c.addEventListener("click", function () { bag.pixels[i] = on ? 0 : 1; ctx.save(); paintPix(); });
        grid.append(c);
      });
    }
    body.append(grid);
    var clr = btn("");
    if (window.BitsI18n) BitsI18n.show(clr, "clearGrid"); else clr.textContent = "Clear grid";
    clr.addEventListener("click", function () { bag.pixels = new Array(256).fill(0); ctx.save(); paintPix(); });
    body.append(clr);
    paintBits(); paintPix();
    ctx.onLang(paintBits);
  });

  var MAP = {
    calc: "calc", sci: "calc", convert: "convert", scale: "scale", angles: "angles", speed: "speed",
    ohm: "circuits", lever: "levers", gears: "gears", lumber: "lumber", fractions: "tape", triangles: "roof",
    roof: "roof", volume: "volume", wheel: "robot", chance: "dice", data: "strength", wires: "circuits"
  };
  function fresh() {
    return { v: 2, theme: "hud", accent: "#e25c12", big: false, order: DEFAULTS.slice(), layout: {}, layouts: {}, bags: {}, colsAt: null };
  }
  function load() {
    try {
      var raw = localStorage.getItem("bits-hud-v2");
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved && saved.v === 2 && Array.isArray(saved.order)) return Object.assign(fresh(), saved, { order: saved.order.filter(byId) });
      }
    } catch (e) {}
    var state = fresh();
    try {
      var old = JSON.parse(localStorage.getItem("bits-board-v1") || "null");
      var cards = old && old.state && old.state.cards;
      if (Array.isArray(cards)) cards.forEach(function (c) {
        var id = MAP[c.kind] || MAP[c.id];
        if (id && byId(id) && state.order.indexOf(id) < 0) state.order.push(id);
      });
    } catch (e2) {}
    return state;
  }

  var state = load();
  if (!state.layouts || typeof state.layouts !== "object") state.layouts = {};
  var tiles = new Map();
  var app = document.getElementById("app");
  var saveTimer = 0;

  function defaultSize(id) { return id === "drama" || id === "calc" ? "L" : "M"; }
  function lay(id) {
    if (!state.layout[id]) state.layout[id] = { size: defaultSize(id), pin: false, col: null, row: null };
    return state.layout[id];
  }
  function bag(id) {
    if (!state.bags[id]) state.bags[id] = {};
    return state.bags[id];
  }
  function slim() {
    return { v: 2, theme: state.theme, accent: state.accent, big: state.big, order: state.order, layout: state.layout, layouts: state.layouts || {}, bags: state.bags, colsAt: state.colsAt };
  }
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try { localStorage.setItem("bits-hud-v2", JSON.stringify(slim())); } catch (e) {}
      pushCloud();
      pushPrefs();
    }, 200);
  }
  function pushCloud() {
    var api = window.KulibertWho;
    if (!api || !api.saveApp || !api.read || !api.active || !api.active()) return;
    var rec = api.read();
    if (!rec || !rec.verified) return;
    try { api.saveApp("bits", { v: 2, hud: slim() }); } catch (e) {}
  }
  var scored = false;
  try { scored = sessionStorage.getItem("bits-score-v1") === "1"; } catch (eScore) {}
  var openedAt = Date.now();
  var prefsPulled = false;
  function shipScore(level, score, max) {
    if (scored) return;
    var api = window.KulibertWho;
    if (!api) return;
    var s = Number(score), m = Number(max);
    if (!isFinite(s)) s = 1;
    if (!isFinite(m) || m < 1) m = 1;
    s = Math.max(0, Math.round(s));
    m = Math.max(1, Math.round(m));
    if (s > m) s = m;
    var stars = s <= 0 ? 0 : s >= m ? 3 : s * 2 >= m ? 2 : 1;
    var row = null;
    if (typeof api.record === "function") {
      row = api.record({
        app: "bits",
        version: "BB 2.0.3",
        event: "score",
        level: String(level || "task").slice(0, 40),
        score: s,
        max: m,
        stars: stars,
        xp: Math.max(1, Math.min(25, s || 1)),
        skill: "makers",
        ms: Math.max(0, Date.now() - openedAt)
      });
    } else if (typeof api.mark === "function") {
      row = api.mark("bits", String(level || "task").slice(0, 32));
    }
    if (!row) return;
    scored = true;
    try { sessionStorage.setItem("bits-score-v1", "1"); } catch (e2) {}
    if (window.KulibertBar && typeof window.KulibertBar.toast === "function") window.KulibertBar.toast(bb("saved") || "Saved");
  }
  function prefsPayload() {
    var p = slim();
    try {
      if (JSON.stringify(p).length > 24000) {
        p = { v: 2, theme: state.theme, accent: state.accent, big: !!state.big, order: state.order, layout: state.layout, layouts: state.layouts || {}, colsAt: state.colsAt };
      }
    } catch (e3) {}
    return p;
  }
  function pushPrefs() {
    if (!prefsPulled) return;
    var api = window.KulibertWho;
    if (!api || !api.prefs || typeof api.prefs.set !== "function" || !api.active || !api.active()) return;
    api.prefs.set("bits", prefsPayload()).catch(function () {});
  }
  function applyPrefs(p) {
    if (!p || p.v !== 2 || !Array.isArray(p.order)) return;
    var order = p.order.filter(byId);
    if (!order.length) return;
    state.theme = p.theme || state.theme;
    state.accent = p.accent || state.accent;
    state.big = !!p.big;
    state.order = order;
    if (p.layout && typeof p.layout === "object") state.layout = p.layout;
    state.layouts = p.layouts && typeof p.layouts === "object" ? p.layouts : {};
    state.colsAt = p.colsAt == null ? null : p.colsAt;
    if (p.bags && typeof p.bags === "object") state.bags = p.bags;
    applyTheme();
    Array.from(tiles.keys()).forEach(function (id) {
      if (state.order.indexOf(id) < 0) {
        var node = tiles.get(id);
        if (node && node._dispose) node._dispose();
        if (node) node.remove();
        tiles.delete(id);
      }
    });
    ensure();
  }
  function pullPrefs() {
    var api = window.KulibertWho;
    if (!api || !api.prefs || typeof api.prefs.get !== "function" || !api.active || !api.active()) {
      prefsPulled = true;
      return;
    }
    api.prefs.get("bits").then(function (pack) {
      var p = pack && pack.prefs;
      if (p && p.v === 2) applyPrefs(p);
    }).catch(function () {}).then(function () {
      prefsPulled = true;
      pushPrefs();
    });
  }

  var top = el("header", "top");
  var brand = el("div", "brand");
  var h1 = el("h1");
  var word = el("bdi"); word.textContent = "Bits & Bobs"; h1.append(word);
  var ver = el("span", "ver");
  var verBdi = el("bdi"); verBdi.textContent = "BB 2.0.3"; ver.append(verBdi);
  var who = el("span", "who"); who.id = "who";
  brand.append(h1, ver, who); top.append(brand);
  var board = el("div", "board");
  board.setAttribute("dir", "ltr");
  var dock = el("div", "dock");
  dock.setAttribute("dir", "ltr");
  var addBtn = btn("+"); addBtn.className = "plus";
  if (window.BitsI18n) BitsI18n.showAria(addBtn, "addTool"); else addBtn.setAttribute("aria-label", "Add a tool");
  var bigBtn = btn("");
  var projBtn = btn("");
  var setBtn = btn("");
  if (window.BitsI18n) {
    BitsI18n.show(bigBtn, "bigType");
    BitsI18n.show(projBtn, "projector");
    BitsI18n.showShared(setBtn, "settings");
  } else {
    bigBtn.textContent = "Big type";
    projBtn.textContent = "Projector";
    setBtn.textContent = "Settings";
  }
  dock.append(addBtn, bigBtn, projBtn, setBtn);
  var exitBtn = btn("");
  if (window.BitsI18n) BitsI18n.showShared(exitBtn, "exit"); else exitBtn.textContent = "Exit";
  exitBtn.className = "proj-exit";
  exitBtn.addEventListener("click", function () { setProj(false); });
  app.append(top, board, dock, exitBtn);

  function applyTheme() {
    document.documentElement.dataset.theme = state.theme || "hud";
    document.documentElement.style.setProperty("--accent", state.accent || "#e25c12");
    document.documentElement.classList.toggle("big-type", !!state.big);
    bigBtn.setAttribute("aria-pressed", state.big ? "true" : "false");
  }
  function spans(size, cols) {
    var desk = { S: [3, 3], M: [4, 4], L: [6, 5], XL: [8, 6] };
    var tab = { S: [4, 4], M: [4, 4], L: [8, 5], XL: [8, 6] };
    var phone = { S: [4, 4], M: [4, 5], L: [4, 6], XL: [4, 7] };
    var table = cols <= 4 ? phone : cols <= 8 ? tab : desk;
    var pair = table[size] || table.M;
    return [Math.min(pair[0], cols), pair[1]];
  }
  function metrics() {
    var w = board.clientWidth || window.innerWidth;
    var cols = w < 700 ? 4 : w < 1100 ? 8 : 12;
    var pad = 8;
    var inner = Math.max(200, w - pad * 2);
    var proj = document.documentElement.classList.contains("is-projector");
    var row = cols === 12 ? 112 : cols === 8 ? 100 : 96;
    if (proj) row = Math.round(row * 1.5);
    return { cols: cols, cell: inner / cols, row: row, pad: pad };
  }
  function hits(c, r, w, h, ignore) {
    var g = metrics();
    for (var i = 0; i < state.order.length; i++) {
      var id = state.order[i];
      if (id === ignore) continue;
      var L = lay(id);
      if (L.col == null) continue;
      var sp = spans(L.size, g.cols);
      if (c < L.col + sp[0] && c + w > L.col && r < L.row + sp[1] && r + h > L.row) return true;
    }
    return false;
  }
  function nearest(col, row, w, h, ignore) {
    var g = metrics();
    var best = null, bestD = 1e9, r, c;
    for (r = 0; r < 500; r++) for (c = 0; c <= g.cols - w; c++) {
      if (hits(c, r, w, h, ignore)) continue;
      var d = Math.abs(c - col) + Math.abs(r - row);
      if (d < bestD) { bestD = d; best = { c: c, r: r }; }
    }
    return best || { c: 0, r: r };
  }
  function firstFit(w, h, ignore) {
    var g = metrics();
    var r, c;
    for (r = 0; r < 500; r++) for (c = 0; c <= g.cols - w; c++) {
      if (!hits(c, r, w, h, ignore)) return { c: c, r: r };
    }
    return { c: 0, r: r };
  }
  function placeOne(id) {
    var g = metrics();
    var L = lay(id);
    var sp = spans(L.size, g.cols);
    var spot = firstFit(sp[0], sp[1], id);
    L.col = Math.max(0, Math.min(spot.c, g.cols - sp[0]));
    L.row = Math.max(0, spot.r);
  }
  function clampTile(id) {
    var g = metrics();
    var L = lay(id);
    var sp = spans(L.size, g.cols);
    if (L.col == null) { placeOne(id); return; }
    L.col = Math.max(0, Math.min(L.col, g.cols - sp[0]));
    L.row = Math.max(0, L.row || 0);
  }
  function settleAround(id) {
    var guard = 0, moved = true;
    while (moved && guard < 40) {
      moved = false;
      guard++;
      state.order.forEach(function (other) {
        if (other === id || lay(other).pin) return;
        var L = lay(other);
        var sp = spans(L.size, metrics().cols);
        if (L.col == null || hits(L.col, L.row, sp[0], sp[1], other)) {
          var beforeC = L.col, beforeR = L.row;
          placeOne(other);
          if (L.col !== beforeC || L.row !== beforeR) moved = true;
        }
      });
    }
  }
  function snapshot(cols) {
    if (!cols) return;
    if (!state.layouts) state.layouts = {};
    var copy = {};
    state.order.forEach(function (id) {
      var L = lay(id);
      copy[id] = { size: L.size, pin: !!L.pin, col: L.col, row: L.row };
    });
    state.layouts[String(cols)] = copy;
  }
  function restore(cols) {
    var saved = state.layouts && state.layouts[String(cols)];
    if (!saved) {
      state.order.forEach(function (id) { if (!lay(id).pin) { lay(id).col = null; lay(id).row = null; } });
      state.order.forEach(function (id) { if (lay(id).col == null) placeOne(id); });
      return;
    }
    state.order.forEach(function (id) {
      var t = saved[id];
      var L = lay(id);
      if (!t) { L.col = null; L.row = null; return; }
      L.size = t.size || L.size;
      L.pin = !!t.pin;
      L.col = t.col;
      L.row = t.row;
      var sp = spans(L.size, cols);
      if (L.col == null || L.col < 0 || L.col + sp[0] > cols) { L.col = null; L.row = null; }
    });
    state.order.forEach(function (id) { if (lay(id).col == null) placeOne(id); });
  }
  function applyBox(id, animate) {
    var node = tiles.get(id);
    if (!node) return;
    var g = metrics();
    var L = lay(id);
    var sp = spans(L.size, g.cols);
    if (L.col == null) placeOne(id);
    L.col = Math.max(0, Math.min(L.col, g.cols - sp[0]));
    var x = g.pad + L.col * g.cell;
    var y = g.pad + L.row * g.row;
    node.style.width = Math.max(120, sp[0] * g.cell - 10) + "px";
    node.style.height = Math.max(140, sp[1] * g.row - 10) + "px";
    var sx = Number.isFinite(node._x) ? node._x : x;
    var sy = Number.isFinite(node._y) ? node._y : y;
    if (!animate || reduced()) {
      node.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      node._x = x; node._y = y;
      return;
    }
    var dx = x - sx, dy = y - sy, t0 = performance.now();
    var token = (node._tok = (node._tok || 0) + 1);
    function frame(now) {
      if (node._tok !== token) return;
      var t = Math.min(1, (now - t0) / 420);
      var k = 1 - Math.pow(1 - t, 3);
      var wob = Math.sin(t * Math.PI) * (1 - t) * 8;
      node.style.transform = "translate3d(" + (sx + dx * k) + "px," + (sy + dy * k + wob) + "px,0)";
      if (t < 1) requestAnimationFrame(frame);
      else { node.style.transform = "translate3d(" + x + "px," + y + "px,0)"; node._x = x; node._y = y; }
    }
    requestAnimationFrame(frame);
  }
  function fitBoard() {
    var g = metrics(), max = 0;
    state.order.forEach(function (id) {
      var L = lay(id), sp = spans(L.size, g.cols);
      max = Math.max(max, g.pad + (L.row + sp[1]) * g.row);
    });
    board.style.height = Math.max(max + 112, window.innerHeight) + "px";
  }
  function mount(id) {
    if (tiles.has(id) || !byId(id)) return;
    var tool = byId(id);
    var node = el("article", "tile");
    node.dataset.id = id;
    var bar = el("div", "tile-bar");
    bar.dataset.drag = "1";
    var title = el("h2");
    if (tool.nameKey && window.BitsI18n) BitsI18n.show(title, tool.nameKey); else title.textContent = tool.name;
    var pin = btn(""); pin.dataset.pin = "1";
    var close = btn("×"); close.dataset.close = "1";
    if (window.BitsI18n) BitsI18n.showAria(close, "remove"); else close.setAttribute("aria-label", "Remove");
    bar.append(title, pin, close);
    var body = el("div", "body");
    var grip = btn(""); grip.className = "grip"; grip.dataset.resize = "1";
    if (window.BitsI18n) BitsI18n.showAria(grip, "resize"); else grip.setAttribute("aria-label", "Resize");
    node.append(bar, body, grip);
    var L = lay(id);
    function paintPin() {
      pin.setAttribute("aria-pressed", L.pin ? "true" : "false");
      if (window.BitsI18n) BitsI18n.show(pin, L.pin ? "pinned" : "pin");
      else pin.textContent = L.pin ? "Pinned" : "Pin";
    }
    paintPin();
    pin.addEventListener("click", function () {
      L.pin = !L.pin; paintPin(); save();
    });
    close.addEventListener("click", function () { remove(id); });
    var dispose = tool.mount(body, { bag: bag(id), save: save, reduced: reduced }) || function () {};
    node._dispose = dispose;
    tiles.set(id, node);
    board.append(node);
  }
  function remove(id) {
    var node = tiles.get(id);
    if (node && node._dispose) node._dispose();
    if (node) node.remove();
    tiles.delete(id);
    state.order = state.order.filter(function (x) { return x !== id; });
    save(); layoutAll(false);
  }
  function untangle() {
    var guard = 0, moved = true;
    while (moved && guard < 60) {
      moved = false;
      guard++;
      state.order.forEach(function (id) {
        if (lay(id).pin) return;
        var L = lay(id);
        var sp = spans(L.size, metrics().cols);
        if (L.col == null || hits(L.col, L.row, sp[0], sp[1], id)) {
          var beforeC = L.col, beforeR = L.row;
          placeOne(id);
          if (L.col !== beforeC || L.row !== beforeR) moved = true;
        }
      });
    }
  }
  function layoutAll(animate) {
    var g = metrics();
    if (state.colsAt !== g.cols) {
      if (state.colsAt) snapshot(state.colsAt);
      restore(g.cols);
      state.colsAt = g.cols;
    } else {
      state.order.forEach(function (id) { if (lay(id).col == null) placeOne(id); });
    }
    untangle();
    state.order.forEach(function (id) { mount(id); applyBox(id, animate); });
    snapshot(g.cols);
    fitBoard();
  }
  function ensure() {
    Array.from(tiles.keys()).forEach(function (id) { if (state.order.indexOf(id) < 0) remove(id); });
    state.order.forEach(mount);
    layoutAll(false);
  }

  var drag = null;
  window.addEventListener("pointermove", function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var node = tiles.get(drag.id);
    var g = metrics();
    if (drag.type === "move") {
      var x = e.clientX - drag.ox, y = e.clientY - drag.oy;
      node.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      node._x = x; node._y = y;
      drag.last.push({ t: performance.now(), x: e.clientX, y: e.clientY });
      drag.last = drag.last.filter(function (p) { return p.t > performance.now() - 90; });
    } else {
      var sizes = ["S", "M", "L", "XL"], best = drag.size, bestD = 1e9;
      var base = spans(drag.size, g.cols);
      sizes.forEach(function (s) {
        var sp = spans(s, g.cols);
        var d = Math.abs(sp[0] * g.cell - (base[0] * g.cell + (e.clientX - drag.sx))) + Math.abs(sp[1] * g.row - (base[1] * g.row + (e.clientY - drag.sy)));
        if (d < bestD) { bestD = d; best = s; }
      });
      lay(drag.id).size = best;
      clampTile(drag.id);
      applyBox(drag.id, false);
    }
  });
  window.addEventListener("pointerup", function (e) {
    if (!drag || e.pointerId !== drag.pid) return;
    var node = tiles.get(drag.id);
    node.classList.remove("dragging");
    if (drag.type === "move") {
      var g = metrics();
      var x = node._x || 0, y = node._y || 0;
      if (drag.last.length >= 2 && !reduced()) {
        var a = drag.last[0], b = drag.last[drag.last.length - 1], dt = b.t - a.t || 1;
        var vx = (b.x - a.x) / dt, vy = (b.y - a.y) / dt;
        if (Math.hypot(vx, vy) > 0.45) { x += vx * 200; y += vy * 200; }
      }
      var sp = spans(lay(drag.id).size, g.cols);
      var col = Math.round((x - g.pad) / g.cell);
      var row = Math.round((y - g.pad) / g.row);
      col = Math.max(0, Math.min(col, g.cols - sp[0]));
      row = Math.max(0, row);
      var other = null;
      state.order.forEach(function (id) {
        if (id === drag.id || other) return;
        var node = tiles.get(id);
        if (!node || lay(id).col == null) return;
        var r = node.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) other = id;
      });
      if (other && !lay(other).pin) {
        var O = lay(other);
        var oc = O.col, orow = O.row;
        var spO = spans(O.size, g.cols);
        O.col = Math.max(0, Math.min(drag.origin.c, g.cols - spO[0]));
        O.row = drag.origin.r;
        lay(drag.id).col = Math.max(0, Math.min(oc, g.cols - sp[0]));
        lay(drag.id).row = orow;
        settleAround(drag.id);
        applyBox(other, true);
      } else {
        var spot = nearest(col, row, sp[0], sp[1], drag.id);
        lay(drag.id).col = Math.max(0, Math.min(spot.c, g.cols - sp[0]));
        lay(drag.id).row = spot.r;
      }
      applyBox(drag.id, true);
    } else {
      clampTile(drag.id);
      settleAround(drag.id);
      state.order.forEach(function (id) { applyBox(id, id !== drag.id); });
    }
    drag = null; save(); fitBoard();
    shipScore("layout", 1, 1);
  });
  board.addEventListener("pointerdown", function (e) {
    var tile = e.target.closest(".tile");
    if (!tile) return;
    if (e.target.closest("input, textarea, select, a")) return;
    var resize = e.target.closest("[data-resize]");
    if (e.target.closest("button") && !resize) return;
    var id = tile.dataset.id;
    var L = lay(id);
    if (resize) {
      resize.setPointerCapture(e.pointerId);
      drag = { type: "resize", id: id, pid: e.pointerId, sx: e.clientX, sy: e.clientY, size: L.size, origin: { c: L.col, r: L.row } };
      tile._tok = (tile._tok || 0) + 1;
      return;
    }
    if (!e.target.closest("[data-drag]") || L.pin) return;
    var g = metrics();
    e.preventDefault();
    e.target.closest("[data-drag]").setPointerCapture(e.pointerId);
    tile.classList.add("dragging");
    tile._tok = (tile._tok || 0) + 1;
    drag = { type: "move", id: id, pid: e.pointerId, ox: e.clientX - (g.pad + L.col * g.cell), oy: e.clientY - (g.pad + L.row * g.row), origin: { c: L.col, r: L.row }, last: [{ t: performance.now(), x: e.clientX, y: e.clientY }] };
  });

  function openSheet(title, build, key, sharedKey) {
    var old = document.querySelector(".sheet");
    if (old) old.remove();
    var sheet = el("div", "sheet");
    var panel = el("div", "panel");
    var head = el("div", "row");
    var h = el("h2");
    if (sharedKey && window.BitsI18n) BitsI18n.showShared(h, sharedKey);
    else if (key && window.BitsI18n) BitsI18n.show(h, key);
    else h.textContent = title;
    var close = btn("");
    if (window.BitsI18n) BitsI18n.showShared(close, "close"); else close.textContent = "Close";
    close.addEventListener("click", function () { sheet.remove(); });
    head.append(h, close);
    panel.append(head);
    build(panel);
    sheet.append(panel);
    sheet.addEventListener("click", function (e) { if (e.target === sheet) sheet.remove(); });
    document.body.append(sheet);
  }
  addBtn.addEventListener("click", function () {
    openSheet("Tools", function (panel) {
      TOOLS.forEach(function (tool) {
        var row = el("div", "row");
        var name = el("strong");
        var blurb = el("span", "note");
        if (tool.nameKey && window.BitsI18n) BitsI18n.show(name, tool.nameKey); else name.textContent = tool.name;
        if (tool.blurbKey && window.BitsI18n) BitsI18n.show(blurb, tool.blurbKey); else blurb.textContent = tool.blurb;
        var on = state.order.indexOf(tool.id) >= 0;
        var b = btn("");
        b.disabled = on;
        function paintAdd() {
          if (window.BitsI18n) BitsI18n.show(b, b.disabled ? "showing" : "add");
          else b.textContent = b.disabled ? "Showing" : "Add";
        }
        paintAdd();
        b.addEventListener("click", function () {
          if (state.order.indexOf(tool.id) >= 0) return;
          state.order.push(tool.id);
          placeOne(tool.id);
          save(); ensure();
          b.disabled = true;
          paintAdd();
        });
        row.append(name, blurb, b); panel.append(row);
      });
    }, "tools");
  });
  setBtn.addEventListener("click", function () {
    openSheet("Settings", function (panel) {
      var news = el("p", "note");
      if (window.BitsI18n) BitsI18n.show(news, "whatsBody");
      else news.textContent = "Bits & Bobs follows the Hub language. Arabic and Dari menus read right to left, and your board stays put.";
      var newsLabel = el("p", "note");
      if (window.BitsI18n) BitsI18n.showShared(newsLabel, "whatsNew"); else newsLabel.textContent = "What's new";
      panel.append(newsLabel, news);
      panel.append(seg(["HUD dark", "Light", "High-contrast"], state.theme === "light" ? "Light" : state.theme === "contrast" ? "High-contrast" : "HUD dark", function (lab) {
        state.theme = lab === "Light" ? "light" : lab === "High-contrast" ? "contrast" : "hud";
        applyTheme(); save();
      }));
      var presets = el("div", "presets");
      var ACCENT_KEY = { Vermilion: "colorVermilion", Cyan: "colorCyan", Amber: "colorAmber", Lime: "colorLime", Violet: "colorViolet", Ice: "colorIce" };
      ACCENTS.forEach(function (pair) {
        var b = btn(""); b.style.background = pair[1];
        if (window.BitsI18n && ACCENT_KEY[pair[0]]) BitsI18n.showAria(b, ACCENT_KEY[pair[0]]);
        else b.setAttribute("aria-label", pair[0]);
        b.addEventListener("click", function () { state.accent = pair[1]; applyTheme(); save(); });
        presets.append(b);
      });
      var picker = el("input"); picker.type = "color"; picker.value = state.accent;
      picker.addEventListener("input", function () { state.accent = picker.value; applyTheme(); save(); });
      panel.append(presets, picker);
      var big = btn("");
      function paintBig() {
        if (window.BitsI18n) BitsI18n.show(big, state.big ? "bigOn" : "bigOff");
        else big.textContent = state.big ? "Big type on" : "Big type off";
      }
      paintBig();
      big.addEventListener("click", function () { state.big = !state.big; applyTheme(); paintBig(); save(); });
      panel.append(big);
      state.order.forEach(function (id) {
        var row = el("label", "field");
        var cap = el("span");
        function paintSize() { cap.textContent = bbf("sizeOf", { name: byId(id).name }); }
        paintSize();
        if (window.BitsI18n) BitsI18n.on(paintSize);
        row.append(cap);
        var sel = el("select");
        ["S", "M", "L", "XL"].forEach(function (s) {
          var o = el("option"); o.value = s; o.textContent = s; if (lay(id).size === s) o.selected = true; sel.append(o);
        });
        sel.addEventListener("change", function () {
          lay(id).size = sel.value;
          clampTile(id);
          settleAround(id);
          save();
          layoutAll(true);
        });
        row.append(sel); panel.append(row);
      });
      TOOLS.forEach(function (tool) {
        var lab = el("label", "check");
        var box = el("input"); box.type = "checkbox"; box.checked = state.order.indexOf(tool.id) >= 0;
        var span = el("span");
        if (tool.nameKey && window.BitsI18n) BitsI18n.show(span, tool.nameKey); else span.textContent = tool.name;
        box.addEventListener("change", function () {
          if (box.checked) { if (state.order.indexOf(tool.id) < 0) { state.order.push(tool.id); placeOne(tool.id); } }
          else state.order = state.order.filter(function (x) { return x !== tool.id; });
          save(); ensure();
        });
        lab.append(box, span); panel.append(lab);
      });
      var reset = btn("");
      if (window.BitsI18n) BitsI18n.show(reset, "resetLayout"); else reset.textContent = "Reset layout";
      reset.addEventListener("click", function () {
        state.order = DEFAULTS.slice();
        state.layout = {};
        state.layouts = {};
        state.colsAt = null;
        save(); ensure();
        document.querySelector(".sheet").remove();
      });
      panel.append(reset);
      var classic = btn("");
      if (window.BitsI18n) BitsI18n.show(classic, "classicBoard"); else classic.textContent = "Classic board";
      classic.addEventListener("click", function () { location.href = "/bits/?theme=classic"; });
      panel.append(classic);
      var note = el("p", "note");
      if (window.BitsI18n) BitsI18n.show(note, "layoutNote");
      else note.textContent = "The layout autosaves on this Chromebook. Signed in, the same layout and theme go to TechWorks with your code. No name is stored.";
      panel.append(note);
    }, "", "settings");
  });
  bigBtn.addEventListener("click", function () { state.big = !state.big; applyTheme(); save(); });
  function setProj(on) {
    document.documentElement.classList.toggle("is-projector", on);
    document.documentElement.classList.toggle("tw-session-hide", on);
    if (on) { var p = document.documentElement.requestFullscreen; if (p) p.call(document.documentElement).catch(function () {}); }
    else if (document.fullscreenElement) document.exitFullscreen().catch(function () {});
    layoutAll(false);
  }
  projBtn.addEventListener("click", function () { setProj(!document.documentElement.classList.contains("is-projector")); });
  document.addEventListener("fullscreenchange", function () {
    if (!document.fullscreenElement) {
      document.documentElement.classList.remove("is-projector");
      document.documentElement.classList.remove("tw-session-hide");
    }
    layoutAll(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var sheet = document.querySelector(".sheet");
      if (sheet) { sheet.remove(); e.preventDefault(); return; }
      if (e.target.closest("input, textarea, select")) return;
      setProj(false);
      return;
    }
    if (e.target.closest("input, textarea, select")) return;
    if (e.key === "f" || e.key === "F") { e.preventDefault(); setProj(!document.documentElement.classList.contains("is-projector")); }
  });
  window.addEventListener("resize", function () { layoutAll(false); });

  function paintWho() {
    var api = window.KulibertWho, rec = api && api.read ? api.read() : null;
    var on = api && api.active && api.active() && rec && rec.verified && rec.alias;
    if (on) {
      who.removeAttribute("data-k");
      who.textContent = "";
      var bdi = document.createElement("bdi");
      bdi.textContent = rec.alias;
      who.append(bdi);
    } else if (window.BitsI18n) BitsI18n.show(who, "notIn");
    else who.textContent = "Not signed in";
  }
  window.addEventListener("storage", paintWho);
  window.addEventListener("kw-mark", function () { paintWho(); pushCloud(); });
  setInterval(paintWho, 800);

  function whenWho(fn) {
    if (window.KulibertWho) { fn(); return; }
    var n = 0;
    var t = setInterval(function () {
      n += 1;
      if (window.KulibertWho || n > 40) {
        clearInterval(t);
        if (window.KulibertWho) { fn(); return; }
        var s = document.createElement("script");
        s.src = "/shared/kw-who.js?v=2026-10-01-job";
        s.onload = fn;
        document.head.appendChild(s);
      }
    }, 50);
  }
  whenWho(function () { paintWho(); pullPrefs(); });

  applyTheme();
  ensure();
  if (window.BitsI18n) BitsI18n.setLang(BitsI18n.lang());
  selfCheck();
  paintWho();
  save();
})();
