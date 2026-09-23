/* Kulibert lights stage — one draw path for /visualizer/ and /bertybeatz/.
   Chip lives on the doors. Hub live line is the Hub lane's job. */
(function (global) {
  var CHIP = "Viz 0.4.0";
  var LOOKS = [
    { id: "bars", label: "Bars" },
    { id: "kaleido", label: "Kaleidoscope" },
    { id: "clouds", label: "Clouds" },
    { id: "stars", label: "Stars" },
    { id: "code", label: "Code" },
  ];
  var CODE_KEY = "kulibert.codelook";
  var CODE_GROUPS = [
    { key: "folds", label: "Folds", options: [
      { id: "4", label: "4" },
      { id: "6", label: "6" },
      { id: "8", label: "8" },
    ]},
    { key: "grow", label: "Size", options: [
      { id: "short", label: "Short" },
      { id: "mid", label: "Mid" },
      { id: "tall", label: "Tall" },
    ]},
    { key: "ink", label: "Color", options: [
      { id: "cyan", label: "Cyan" },
      { id: "teal", label: "Teal" },
      { id: "amber", label: "Amber" },
    ]},
    { key: "pulse", label: "Pulse", options: [
      { id: "still", label: "Still" },
      { id: "beat", label: "Beat" },
    ]},
    { key: "rule", label: "Rule", options: [
      { id: "tree", label: "Tree" },
      { id: "vine", label: "Vine" },
      { id: "crystal", label: "Crystal" },
    ]},
  ];

  function normalizeCode(raw) {
    var folds = raw && (raw.folds === "4" || raw.folds === "8" || raw.folds === 4 || raw.folds === 8) ? String(raw.folds) : "6";
    var grow = raw && (raw.grow === "short" || raw.grow === "tall") ? raw.grow : "mid";
    var ink = raw && (raw.ink === "teal" || raw.ink === "amber") ? raw.ink : "cyan";
    var pulse = raw && raw.pulse === "still" ? "still" : "beat";
    var rule = raw && (raw.rule === "vine" || raw.rule === "crystal") ? raw.rule : "tree";
    return { folds: folds, grow: grow, ink: ink, pulse: pulse, rule: rule };
  }

  function loadCode() {
    try {
      return normalizeCode(JSON.parse(localStorage.getItem(CODE_KEY) || "null"));
    } catch (err) {
      return normalizeCode(null);
    }
  }

  function saveCode(next) {
    var recipe = normalizeCode(next);
    try {
      localStorage.setItem(CODE_KEY, JSON.stringify(recipe));
    } catch (err) {
      /* title-only storage; ignore a full disk */
    }
    return recipe;
  }

  function paintRecipe(el) {
    var recipe = loadCode();
    var buttons = el.querySelectorAll("button[data-key]");
    var i;
    for (i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      var on = String(recipe[b.getAttribute("data-key")]) === b.getAttribute("data-val");
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    }
  }

  function syncRecipe(el) {
    if (!el) return loadCode();
    if (!el.getAttribute("data-ready")) {
      el.setAttribute("data-ready", "1");
      el.innerHTML = "";
      CODE_GROUPS.forEach(function (group) {
        var wrap = document.createElement("div");
        wrap.className = "code-group";
        var lab = document.createElement("span");
        lab.className = "tool-label";
        lab.textContent = group.label;
        wrap.appendChild(lab);
        var chips = document.createElement("div");
        chips.className = "chips";
        chips.setAttribute("role", "group");
        chips.setAttribute("aria-label", group.label);
        group.options.forEach(function (opt) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn";
          b.textContent = opt.label;
          b.setAttribute("data-key", group.key);
          b.setAttribute("data-val", opt.id);
          b.addEventListener("click", function () {
            var cur = loadCode();
            cur[group.key] = opt.id;
            saveCode(cur);
            paintRecipe(el);
          });
          chips.appendChild(b);
        });
        wrap.appendChild(chips);
        el.appendChild(wrap);
      });
    }
    paintRecipe(el);
    return loadCode();
  }

  function mount(canvas, getSnap) {
    var vctx = canvas.getContext("2d");
    var bins = new Uint8Array(64);
    var clouds = [];
    var stars = [];
    var i;
    for (i = 0; i < 7; i++) {
      clouds.push({
        x: 0.12 + (i * 0.13) % 0.84,
        y: 0.28 + ((i * 37) % 50) / 100,
        r: 0.12 + (i % 3) * 0.04,
        hue: i % 3,
        sp: 0.04 + (i % 4) * 0.015,
      });
    }
    for (i = 0; i < 56; i++) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        s: 0.4 + Math.random() * 1.6,
        p: Math.random() * Math.PI * 2,
      });
    }
    var spin = 0;
    var lastKick = 0;
    var raf = 0;
    var alive = true;
    var reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    var reduceMotion = reduceQuery.matches;

    function onReduce() {
      reduceMotion = reduceQuery.matches;
    }
    if (reduceQuery.addEventListener) reduceQuery.addEventListener("change", onReduce);

    function size() {
      var wrap = canvas.parentElement || canvas;
      var cssW = Math.max(280, wrap.clientWidth);
      var cssH = Math.max(150, Math.round(parseFloat(getComputedStyle(canvas).height) || 220));
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      vctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvas._w = cssW;
      canvas._h = cssH;
    }

    function band(a, b) {
      var s = 0;
      var n = Math.max(1, b - a);
      var k;
      for (k = a; k < b && k < bins.length; k++) s += bins[k];
      return s / n / 255;
    }

    function idleFill() {
      var t = performance.now() / 1000;
      var n;
      for (n = 0; n < bins.length; n++) {
        bins[n] = 22 + 14 * Math.sin(t * 0.8 + n * 0.28) + (n % 4 === 0 ? 10 : 0);
      }
    }

    function fillBins(snap) {
      if (snap.bins && snap.bins.length) {
        var n = Math.min(bins.length, snap.bins.length);
        var i2;
        for (i2 = 0; i2 < n; i2++) bins[i2] = snap.bins[i2];
        return;
      }
      if (snap.analyser && snap.playing) {
        snap.analyser.getByteFrequencyData(bins);
        return;
      }
      idleFill();
    }

    function drawBars(w, h, play) {
      var n = 24;
      var gap = 4;
      var bw = (w - gap * (n + 1)) / n;
      var i3;
      for (i3 = 0; i3 < n; i3++) {
        var src = Math.floor((i3 / n) * 32);
        var v = bins[src] / 255;
        var bh = Math.max(6, v * (h - 18));
        var x = gap + i3 * (bw + gap);
        var y = h - bh - 8;
        var onBeat = play >= 0 && Math.floor((play / 16) * n) === i3;
        vctx.fillStyle = onBeat ? "#e8f7ff" : i3 % 4 === 0 ? "#22d3ee" : "#14b8a6";
        vctx.globalAlpha = 0.55 + v * 0.45;
        var r = Math.min(6, bw / 2);
        vctx.beginPath();
        vctx.moveTo(x, y + r);
        vctx.arcTo(x, y, x + r, y, r);
        vctx.arcTo(x + bw, y, x + bw, y + r, r);
        vctx.lineTo(x + bw, h - 8);
        vctx.lineTo(x, h - 8);
        vctx.closePath();
        vctx.fill();
      }
      vctx.globalAlpha = 1;
    }

    function drawKaleido(w, h) {
      var bass = band(0, 5);
      var mid = band(5, 16);
      var cx = w / 2;
      var cy = h / 2;
      var folds = 8;
      if (!reduceMotion) spin += 0.006 + bass * 0.01;
      var radius = Math.min(w, h) * (0.34 + mid * 0.18);
      vctx.save();
      vctx.translate(cx, cy);
      vctx.rotate(spin);
      var f;
      for (f = 0; f < folds; f++) {
        vctx.save();
        vctx.rotate((f * Math.PI * 2) / folds);
        if (f % 2) vctx.scale(-1, 1);
        var i4;
        for (i4 = 0; i4 < 10; i4++) {
          var v = bins[i4 + 2] / 255;
          var a = (i4 / 10) * (Math.PI / folds);
          vctx.strokeStyle = i4 % 3 === 0 ? "#22d3ee" : i4 % 3 === 1 ? "#a78bfa" : "#14b8a6";
          vctx.globalAlpha = 0.25 + v * 0.7;
          vctx.lineWidth = 2 + v * 5;
          vctx.beginPath();
          vctx.moveTo(8, 0);
          vctx.lineTo(Math.cos(a) * radius * (0.4 + v), Math.sin(a) * radius * (0.25 + v * 0.5));
          vctx.stroke();
        }
        vctx.restore();
      }
      vctx.beginPath();
      vctx.fillStyle = "#e8f7ff";
      vctx.globalAlpha = 0.35 + bass * 0.4;
      vctx.arc(0, 0, 6 + bass * 10, 0, Math.PI * 2);
      vctx.fill();
      vctx.restore();
      vctx.globalAlpha = 1;
    }

    function drawClouds(w, h) {
      var t = performance.now() / 1000;
      var bass = band(0, 6);
      var mid = band(6, 18);
      var high = band(18, 32);
      var energy = [bass, mid, high];
      clouds.forEach(function (c, idx) {
        var drift = reduceMotion ? 0 : Math.sin(t * c.sp + idx) * 0.04;
        var x = (c.x + drift) * w;
        var y = (c.y + Math.sin(t * 0.2 + idx) * (reduceMotion ? 0 : 0.04)) * h;
        var r = c.r * Math.min(w, h) * (1.1 + energy[c.hue] * 1.4);
        var g = vctx.createRadialGradient(x, y, 0, x, y, r);
        var col = c.hue === 0 ? "34,211,238" : c.hue === 1 ? "20,184,166" : "167,139,250";
        g.addColorStop(0, "rgba(" + col + "," + (0.42 + energy[c.hue] * 0.35) + ")");
        g.addColorStop(1, "rgba(" + col + ",0)");
        vctx.fillStyle = g;
        vctx.beginPath();
        vctx.arc(x, y, r, 0, Math.PI * 2);
        vctx.fill();
      });
    }

    function drawStars(w, h, snap) {
      var bass = band(0, 5);
      var mid = band(5, 14);
      var high = band(14, 28);
      var t = performance.now() / 1000;
      if (snap.kick) lastKick = t;
      var kickGlow = Math.max(0, 1 - (t - lastKick) * 3);
      vctx.fillStyle = "rgba(232,247,255," + (0.04 + kickGlow * 0.08) + ")";
      vctx.fillRect(0, 0, w, h);
      stars.forEach(function (s, idx) {
        var tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (reduceMotion ? 0.6 : 2.2) + s.p));
        var boost = idx % 7 === 0 ? bass : idx % 5 === 0 ? mid : high;
        var size = s.s * (1 + boost * 2.2) * (0.8 + tw);
        vctx.fillStyle = idx % 9 === 0 ? "#f59e0b" : idx % 4 === 0 ? "#22d3ee" : "#e8f7ff";
        vctx.globalAlpha = 0.25 + tw * 0.75;
        vctx.beginPath();
        vctx.arc(s.x * w, s.y * h, size, 0, Math.PI * 2);
        vctx.fill();
      });
      vctx.globalAlpha = 1;
      if (snap.snare && !reduceMotion) {
        vctx.strokeStyle = "rgba(232,247,255,0.28)";
        vctx.lineWidth = 1;
        vctx.beginPath();
        vctx.moveTo(w * 0.15, h * 0.2);
        vctx.lineTo(w * 0.85, h * 0.72);
        vctx.stroke();
      }
    }

    function drawLSystem(w, h, recipe, axiom, rule, iter, turnDeg) {
      var str = axiom;
      var i;
      var energy = band(0, 8) * 0.65 + band(8, 20) * 0.35;
      for (i = 0; i < iter; i++) {
        var next = "";
        var c;
        for (c = 0; c < str.length; c++) next += str[c] === "F" ? rule : str[c];
        if (next.length > 900) break;
        str = next;
      }
      var turn = (turnDeg * Math.PI) / 180;
      var len = 8;
      var color = recipe.ink === "teal" ? "#14b8a6" : recipe.ink === "amber" ? "#f59e0b" : "#22d3ee";
      function walk(draw) {
        var x = 0;
        var y = 0;
        var a = -Math.PI / 2;
        var stack = [];
        var minX = 0;
        var minY = 0;
        var maxX = 0;
        var maxY = 0;
        var segs = 0;
        var k;
        for (k = 0; k < str.length; k++) {
          var ch = str[k];
          if (ch === "F") {
            var x2 = x + Math.cos(a) * len;
            var y2 = y + Math.sin(a) * len;
            if (draw) {
              vctx.beginPath();
              vctx.moveTo(x, y);
              vctx.lineTo(x2, y2);
              vctx.stroke();
            }
            if (x2 < minX) minX = x2;
            if (y2 < minY) minY = y2;
            if (x2 > maxX) maxX = x2;
            if (y2 > maxY) maxY = y2;
            x = x2;
            y = y2;
            segs += 1;
            if (segs > 480) break;
          } else if (ch === "+") a += turn;
          else if (ch === "-") a -= turn;
          else if (ch === "[") stack.push([x, y, a]);
          else if (ch === "]" && stack.length) {
            var s = stack.pop();
            x = s[0];
            y = s[1];
            a = s[2];
          }
        }
        return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
      }
      var bounds = walk(false);
      var bw = Math.max(1, bounds.maxX - bounds.minX);
      var bh = Math.max(1, bounds.maxY - bounds.minY);
      var scale = Math.min((w - 24) / bw, (h - 24) / bh);
      if (recipe.pulse === "beat") scale *= 0.9 + energy * 0.16;
      vctx.save();
      vctx.translate(
        w / 2 - ((bounds.minX + bounds.maxX) / 2) * scale,
        h / 2 - ((bounds.minY + bounds.maxY) / 2) * scale,
      );
      vctx.scale(scale, scale);
      vctx.strokeStyle = color;
      vctx.globalAlpha = 0.82;
      vctx.lineWidth = Math.max(0.7, 1.5 / Math.max(scale, 0.2));
      walk(true);
      vctx.restore();
      vctx.globalAlpha = 1;
    }

    function drawCode(w, h) {
      var recipe = loadCode();
      var bass = band(0, 6);
      var mid = band(6, 18);
      var energy = bass * 0.65 + mid * 0.35;
      var grow = recipe.grow === "short" ? 0.56 : recipe.grow === "tall" ? 0.74 : 0.66;
      var arms = recipe.folds === "4" ? 4 : recipe.folds === "8" ? 8 : 6;
      var depth = arms >= 8 ? 4 : 5;
      var len0 = Math.min(w, h) * (recipe.pulse === "beat" ? 0.16 + energy * 0.08 : 0.18);
      var spread = reduceMotion ? 0.55 : 0.42 + mid * 0.28;
      var color = recipe.ink === "teal" ? "#14b8a6" : recipe.ink === "amber" ? "#f59e0b" : "#22d3ee";
      if (recipe.rule === "vine") {
        drawLSystem(w, h, recipe, "F", "F[+F]F[-F]F", recipe.folds === "8" ? 3 : 2, 26);
        return;
      }
      if (recipe.rule === "crystal") {
        drawLSystem(w, h, recipe, "F+F+F+F", "FF+F+F+F+F+FF", 2, 90);
        return;
      }
      function branch(x, y, angle, len, d) {
        if (d <= 0 || len < 1.5) return;
        var x2 = x + Math.cos(angle) * len;
        var y2 = y + Math.sin(angle) * len;
        vctx.strokeStyle = color;
        vctx.globalAlpha = 0.22 + (d / depth) * 0.62;
        vctx.lineWidth = Math.max(1.1, d * 0.7);
        vctx.beginPath();
        vctx.moveTo(x, y);
        vctx.lineTo(x2, y2);
        vctx.stroke();
        var next = len * grow;
        branch(x2, y2, angle - spread, next, d - 1);
        branch(x2, y2, angle + spread, next, d - 1);
      }
      var a;
      for (a = 0; a < arms; a++) {
        branch(w * 0.5, h * 0.5, (a * Math.PI * 2) / arms - Math.PI / 2, len0, depth);
      }
      vctx.globalAlpha = 1;
    }

    function drawScope(w, h, snap) {
      var wave = snap && snap.wave;
      var n = wave && wave.length ? wave.length : 0;
      vctx.beginPath();
      vctx.lineWidth = 1.5;
      vctx.strokeStyle = "rgba(232,247,255,0.62)";
      vctx.globalAlpha = reduceMotion ? 0.45 : 0.8;
      var amp = h * (reduceMotion ? 0.1 : 0.2);
      if (!n) {
        var i;
        var count = 48;
        for (i = 0; i < count; i++) {
          var x = (i / (count - 1)) * w;
          var v = ((bins[i % bins.length] / 255) - 0.35) * amp;
          if (i === 0) vctx.moveTo(x, h * 0.86 + v);
          else vctx.lineTo(x, h * 0.86 + v);
        }
      } else {
        var step = reduceMotion ? 4 : 2;
        var i2;
        var first = true;
        for (i2 = 0; i2 < n; i2 += step) {
          var x2 = (i2 / (n - 1)) * w;
          var y2 = h * 0.86 + ((wave[i2] - 128) / 128) * amp;
          if (first) {
            vctx.moveTo(x2, y2);
            first = false;
          } else vctx.lineTo(x2, y2);
        }
      }
      vctx.stroke();
      vctx.globalAlpha = 1;
    }

    var lastDraw = 0;
    function frame(now) {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
      if (typeof now !== "number") now = performance.now();
      var cap = reduceMotion ? 1000 / 15 : 1000 / 30;
      if (now - lastDraw < cap) return;
      lastDraw = now;
      var snap = {};
      try {
        snap = getSnap() || {};
      } catch (err) {
        snap = {};
      }
      var w = canvas._w || canvas.clientWidth;
      var h = canvas._h || canvas.clientHeight;
      fillBins(snap);
      vctx.clearRect(0, 0, w, h);
      vctx.fillStyle = "#050814";
      vctx.fillRect(0, 0, w, h);
      var look = snap.look || "bars";
      if (look === "kaleido") drawKaleido(w, h);
      else if (look === "clouds") drawClouds(w, h);
      else if (look === "stars") drawStars(w, h, snap);
      else if (look === "code") drawCode(w, h);
      else drawBars(w, h, typeof snap.playhead === "number" ? snap.playhead : -1);
      drawScope(w, h, snap);
    }

    size();
    window.addEventListener("resize", size);
    frame();

    return {
      resize: size,
      destroy: function () {
        alive = false;
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", size);
        if (reduceQuery.removeEventListener) reduceQuery.removeEventListener("change", onReduce);
      },
    };
  }

  global.KulibertStage = {
    CHIP: CHIP,
    LOOKS: LOOKS,
    mount: mount,
    loadCode: loadCode,
    syncRecipe: syncRecipe,
  };
})(window);
