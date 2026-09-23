/* Kulibert lights stage — one draw path for /visualizer/ and /bertybeatz/.
   Chip lives here. Hub live line must say the same Viz chip. */
(function (global) {
  var CHIP = "Viz 0.1.0";
  var LOOKS = [
    { id: "bars", label: "Bars" },
    { id: "kaleido", label: "Kaleidoscope" },
    { id: "clouds", label: "Clouds" },
    { id: "stars", label: "Stars" },
  ];

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

    function frame() {
      if (!alive) return;
      raf = requestAnimationFrame(frame);
      if (document.hidden) return;
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
      else drawBars(w, h, typeof snap.playhead === "number" ? snap.playhead : -1);
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

  global.KulibertStage = { CHIP: CHIP, LOOKS: LOOKS, mount: mount };
})(window);
