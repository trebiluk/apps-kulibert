/* Pour Lines RF 1.0.21 — phone layout, keyboard pen, words. No sound. No saves. */
(function () {
  var W = 800, H = 600, R = 2.6, STEP = 1 / 180, MAX_STEPS = 9;
  var PL = {
    en: { ink: "Ink", rewind: "Rewind", notYet: "Not full yet", noInk: "Out of ink", board: "Draw lines so the sugar falls into the jars. Arrows move the pen, Enter puts it down, Space pours.", penDown: "Pen down", penUp: "Pen up", jar: "Jar", level: "Level" },
    uk: { ink: "Чорнило", rewind: "Назад", notYet: "Ще не повні", noInk: "Чорнило скінчилось", board: "Малюй лінії, щоб цукор потрапив у банки. Стрілки рухають перо, Enter опускає, Пробіл сипле.", penDown: "Перо опущено", penUp: "Перо піднято", jar: "Банка", level: "Рівень" },
    ru: { ink: "Чернила", rewind: "Заново", notYet: "Ещё не полные", noInk: "Чернила кончились", board: "Рисуй линии, чтобы сахар попал в банки. Стрелки двигают перо, Enter опускает, Пробел сыплет.", penDown: "Перо опущено", penUp: "Перо поднято", jar: "Банка", level: "Уровень" },
    es: { ink: "Tinta", rewind: "Repetir", notYet: "Aún no", noInk: "Sin tinta", board: "Dibuja líneas para que el azúcar caiga en los frascos. Flechas mueven el lápiz, Enter lo baja, Espacio vierte.", penDown: "Lápiz abajo", penUp: "Lápiz arriba", jar: "Frasco", level: "Nivel" },
    ar: { ink: "الحبر", rewind: "إعادة", notYet: "لم تمتلئ بعد", noInk: "نفد الحبر", board: "ارسم خطوطًا ليسقط السكر في الجرار. الأسهم تحرّك القلم، وEnter يُنزله، والمسافة تصبّ.", penDown: "القلم منزل", penUp: "القلم مرفوع", jar: "جرة", level: "المستوى" },
    "fa-AF": { ink: "جوهر", rewind: "دوباره", notYet: "هنوز پر نشده", noInk: "جوهر تمام شد", board: "خط بکش تا قند در کوزه‌ها بیفتد. کلیدهای جهت قلم را حرکت می‌دهند، Enter پایین می‌آورد، Space می‌ریزد.", penDown: "قلم پایین", penUp: "قلم بالا", jar: "کوزه", level: "مرحله" },
    rw: { ink: "Wino", rewind: "Subiramo", notYet: "Ntibiruzura", noInk: "Wino warashize", board: "Shushanya imirongo isukari igwe mu bibindi. Imyambi igendesha ikaramu, Enter iyamanura, Space isuka.", penDown: "Ikaramu imanuye", penUp: "Ikaramu izamuye", jar: "Ikibindi", level: "Urwego" },
    ti: { ink: "ቀለም", rewind: "ድገም", notYet: "ገና ኣይመልአን", noInk: "ቀለም ወዲኡ", board: "ሽኮር ኣብ ድስቲታት ኪወድቕ መስመራት ስኣል። ኣሰርቲ ብርዒ የንቅሉ፣ Enter የውርድ፣ Space የፍስስ።", penDown: "ብርዒ ወሪዱ", penUp: "ብርዒ ደይቡ", jar: "ድስቲ", level: "ደረጃ" }
  };
  var LV = [
    { ink: 10, S: [[150, 70, 70]], J: [[560, 470, 100, 90, 40]], L: [], M: [] },
    { ink: 12, S: [[130, 70, 70]], J: [[540, 470, 110, 90, 40]], L: [[360, 260, 360, 600]], M: [] },
    { ink: 14, S: [[400, 70, 70]], J: [[100, 480, 100, 80, 25], [600, 480, 100, 80, 25]], L: [[330, 250, 400, 215, 470, 250]], M: [] },
    { ink: 11, S: [[90, 60, 70]], J: [[620, 470, 120, 90, 45]], L: [[30, 190, 330, 240], [520, 310, 250, 370]], M: [] },
    { ink: 14, S: [[120, 60, 22], [400, 60, 40], [680, 60, 22]], J: [[60, 490, 90, 70, 20], [355, 490, 90, 70, 30], [650, 490, 90, 70, 20]], L: [[60, 200, 210, 170], [340, 250, 400, 236, 460, 250], [740, 200, 590, 170]], M: [] },
    { ink: 12, S: [[140, 60, 70]], J: [[580, 490, 130, 70, 50]], L: [], M: [[340, 300, 75, 1.5, 0.4]] },
    { ink: 12, S: [[130, 50, 40], [670, 50, 40]], J: [[300, 490, 200, 70, 60]], L: [[60, 170, 200, 140], [740, 170, 600, 140]], M: [] }
  ];

  var section, stage, cv, ctx, inkEl, barEl, jarEl, chipEl, pourBtn, rewindBtn, undoBtn, clearBtn, card, cardTitle, nextBtn, retryBtn, cardRewind;
  var level = 0, strokes = [], drawing = null, pointerId = null;
  var grains = [], jars = [], spouts = [], staticSegs = [], rng = Math.random;
  var simT = 0, accT = 0, running = false, paused = false, cardOn = false, won = false;
  var winWait = 0, slowT = 0, lastSpawn = -1, dirty = true, raf = 0, lastNow = 0, blurred = false;
  var clearUntil = 0, built = false;
  var penX = 400, penY = 300, penDown = false;

  function host() { return window.RFHost || {}; }
  function tr(key) {
    try { if (host().t) return host().t(key); } catch (e) {}
    return key;
  }
  function pl(key) {
    var L = "en";
    try { if (host().lang) L = host().lang() || "en"; } catch (e) {}
    var pack = (L === "simple") ? PL.en : (PL[L] || PL.en);
    return pack[key] || PL.en[key];
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function css() {
    if (document.getElementById("pl-css")) return;
    var s = document.createElement("style");
    s.id = "pl-css";
    s.textContent = [
      "body.at-pl .app{padding:4px 8px;gap:4px}",
      "body.at-pl .bar{min-height:44px}",
      "body.at-pl .home,body.at-pl .toolslot,body.at-pl .lesson-row,body.at-pl .stage,body.at-pl .status,body.at-pl .spill-line,body.at-pl .score,body.at-pl .ref,body.at-pl .ideas{display:none !important}",
      "body.at-pl #pause-btn{visibility:hidden}",
      ".pl{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:12px;overflow:hidden;position:relative;font-size:16px}",
      ".pl[hidden]{display:none !important}",
      "#pl-stage{min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;position:relative;direction:ltr}",
      "#pl-cv{touch-action:none;background:#f3e6c8;border:3px solid #1a120c;border-radius:16px;max-width:100%;max-height:100%;direction:ltr}",
      ".pl button:focus-visible,#pl-cv:focus-visible{outline:3px solid var(--ink,#1a120c);outline-offset:2px;box-shadow:0 0 0 2px var(--sand,#f3e6c8)}",
      ".pl-side{min-width:0;min-height:0;display:flex;flex-direction:column;gap:8px;overflow:auto}",
      ".pl-chips,.pl-jars{display:flex;flex-wrap:wrap;gap:6px}",
      ".pl-btns{display:flex;flex-direction:column;gap:6px}",
      ".pl button{min-width:0;min-height:44px;padding:8px 6px;border-radius:12px;border:3px solid #1a120c;background:#f3e6c8;color:#1a120c;font-weight:800;font-size:16px;overflow-wrap:anywhere;line-height:1.15}",
      ".pl-btns button{width:100%}",
      ".pl button.pl-chip{width:auto;min-width:44px;height:48px;min-height:48px;padding:0 4px}",
      ".pl-chip[aria-pressed=true]{background:#1f3a34;color:#f3e6c8}",
      "#pl-ink{margin:0;font-weight:800;min-height:24px;display:flex;align-items:center;overflow-wrap:anywhere}",
      "#pl-inkbar{height:12px;border:2px solid #1a120c;border-radius:999px;background:#f7f1e4;overflow:hidden}",
      "#pl-inkbar > span{display:block;height:100%;background:#1f3a34}",
      ".pl-jar{margin:0;font-weight:800;overflow-wrap:anywhere}",
      "#pl-card{position:absolute;inset:0;margin:auto;width:min(320px,calc(100% - 16px));height:fit-content;max-height:calc(100% - 16px);background:#f3e6c8;color:#1a120c;border:3px solid #1a120c;border-radius:16px;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;z-index:5}",
      "#pl-card[hidden]{display:none !important}",
      "#pl-card p{margin:0;font-weight:800;font-size:1.15rem;flex:1 1 140px;overflow-wrap:anywhere}",
      "#pl-live{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}",
      "@media (max-width:560px){.pl:not([hidden]){display:flex;flex-direction:column;gap:8px}.pl-side{width:auto;overflow:visible;flex:none}.pl-btns{display:grid;grid-template-columns:1fr 1fr;width:100%}#pl-stage{flex:1 1 auto}}",
      "@media (orientation:landscape) and (max-height:520px){body.at-pl.kb-on{padding-top:0 !important}body.at-pl .kb-bar{display:none !important}body.at-pl .app{padding:2px 6px;gap:2px}body.at-pl .bar{min-height:40px;height:40px}.pl:not([hidden]){display:grid;grid-template-columns:minmax(0,1fr) 160px;gap:8px}.pl-side{width:auto;overflow:auto;display:flex;flex-direction:column;gap:6px}#pl-jars{display:none !important}.pl-btns{order:1;display:grid;grid-template-columns:1fr 1fr;width:100%}#pl-ink{order:2;min-height:0}#pl-inkbar{order:3}.pl-chips{order:4;display:grid;grid-template-columns:repeat(3,1fr)}.pl-chips button{width:100%}}"
    ].join("");
    document.head.appendChild(s);
  }
  function build() {
    if (built) return;
    css();
    var ideas = document.getElementById("ideas");
    section = document.createElement("section");
    section.id = "pl";
    section.className = "pl";
    section.hidden = true;
    section.innerHTML = '<div id="pl-stage"><canvas id="pl-cv" tabindex="0"></canvas><div id="pl-card" role="dialog" hidden><p id="pl-card-t"></p><button type="button" id="pl-next"></button><button type="button" id="pl-retry"></button><button type="button" id="pl-card-rewind"></button></div></div><div class="pl-side"><div class="pl-chips" id="pl-chips"></div><p id="pl-ink"></p><div id="pl-inkbar" role="progressbar" aria-valuemin="0"><span></span></div><div class="pl-jars" id="pl-jars"></div><div class="pl-btns"><button type="button" id="pl-pour"></button><button type="button" id="pl-rewind"></button><button type="button" id="pl-undo"></button><button type="button" id="pl-clear"></button></div></div><p id="pl-live" aria-live="polite"></p>';
    if (ideas && ideas.parentNode) ideas.parentNode.insertBefore(section, ideas);
    else document.querySelector(".app").appendChild(section);
    stage = document.getElementById("pl-stage");
    cv = document.getElementById("pl-cv");
    ctx = cv.getContext("2d");
    inkEl = document.getElementById("pl-ink");
    barEl = document.getElementById("pl-inkbar");
    jarEl = document.getElementById("pl-jars");
    chipEl = document.getElementById("pl-chips");
    pourBtn = document.getElementById("pl-pour");
    rewindBtn = document.getElementById("pl-rewind");
    undoBtn = document.getElementById("pl-undo");
    clearBtn = document.getElementById("pl-clear");
    card = document.getElementById("pl-card");
    cardTitle = document.getElementById("pl-card-t");
    nextBtn = document.getElementById("pl-next");
    retryBtn = document.getElementById("pl-retry");
    cardRewind = document.getElementById("pl-card-rewind");
    var i;
    for (i = 0; i < LV.length; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pl-chip";
      b.textContent = String(i + 1);
      b.setAttribute("aria-label", String(i + 1));
      b.setAttribute("data-lv", String(i));
      chipEl.appendChild(b);
    }
    chipEl.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      loadLevel(parseInt(btn.getAttribute("data-lv"), 10) || 0);
    });
    pourBtn.addEventListener("click", togglePour);
    rewindBtn.addEventListener("click", function () { rewind(); });
    undoBtn.addEventListener("click", undo);
    clearBtn.addEventListener("click", askClear);
    nextBtn.addEventListener("click", function () { loadLevel(Math.min(LV.length - 1, level + 1)); });
    retryBtn.addEventListener("click", function () { rewind(); });
    cardRewind.addEventListener("click", function () { rewind(); });
    cv.addEventListener("pointerdown", onDown);
    cv.addEventListener("pointermove", onMove);
    cv.addEventListener("pointerup", onUp);
    cv.addEventListener("pointercancel", onUp);
    cv.addEventListener("lostpointercapture", onUp);
    cv.addEventListener("contextmenu", function (e) { e.preventDefault(); });
    cv.addEventListener("focus", function () { dirty = true; });
    cv.addEventListener("blur", function () { dirty = true; });
    new ResizeObserver(fit).observe(stage);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("blur", function () { blurred = true; });
    window.addEventListener("focus", function () { blurred = false; });
    document.addEventListener("visibilitychange", function () { blurred = document.hidden; });
    built = true;
    loadLevel(0);
  }
  function inkPx() {
    var px = 0, i;
    for (i = 0; i < strokes.length; i++) px += strokes[i].len;
    if (drawing) px += drawing.len;
    return px;
  }
  function budget() { return LV[level].ink; }
  function gText(n) {
    var g = Math.round(n * 0.2 * 10) / 10;
    return (Math.abs(g - Math.round(g)) < 0.05) ? String(Math.round(g)) : String(g);
  }
  function paint() {
    if (!built) return;
    var name = document.getElementById("home-pl-t");
    if (name) name.textContent = "Pour Lines";
    if (document.body.classList.contains("at-pl")) {
      var pill = document.getElementById("level-name");
      if (pill) pill.textContent = "Pour Lines";
    }
    var pourLabel = paused ? tr("resume") : (running ? tr("pause") : tr("pour"));
    pourBtn.textContent = pourLabel;
    pourBtn.setAttribute("aria-label", pourLabel);
    rewindBtn.textContent = pl("rewind");
    rewindBtn.setAttribute("aria-label", pl("rewind"));
    undoBtn.textContent = tr("undo");
    undoBtn.setAttribute("aria-label", tr("undo"));
    var asking = performance.now() < clearUntil;
    clearBtn.textContent = asking ? tr("clearAsk") : tr("clear");
    clearBtn.setAttribute("aria-label", clearBtn.textContent);
    nextBtn.textContent = tr("nextLevel");
    nextBtn.setAttribute("aria-label", tr("nextLevel"));
    retryBtn.textContent = tr("retry");
    retryBtn.setAttribute("aria-label", tr("retry"));
    cardRewind.textContent = pl("rewind");
    cardRewind.setAttribute("aria-label", pl("rewind"));
    var used = inkPx() / 100;
    var full = used >= budget() - 0.001;
    inkEl.textContent = full ? pl("noInk") : (pl("ink") + " " + used.toFixed(1) + " / " + budget().toFixed(1) + " ml");
    barEl.setAttribute("aria-valuemax", String(budget()));
    barEl.setAttribute("aria-valuenow", used.toFixed(1));
    barEl.setAttribute("aria-label", inkEl.textContent);
    barEl.firstChild.style.width = Math.min(100, budget() ? (used / budget()) * 100 : 0) + "%";
    jarEl.replaceChildren();
    var i;
    for (i = 0; i < jars.length; i++) {
      var p = document.createElement("p");
      p.className = "pl-jar";
      p.textContent = pl("jar") + " " + "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] + ": " + gText(jars[i].n) + " / " + gText(jars[i].tg) + " g";
      jarEl.appendChild(p);
    }
    var chips = chipEl.querySelectorAll("button");
    for (i = 0; i < chips.length; i++) {
      chips[i].setAttribute("aria-pressed", i === level ? "true" : "false");
      chips[i].setAttribute("aria-label", pl("level") + " " + (i + 1));
    }
    cv.setAttribute("aria-label", pl("board"));
    if (cardOn) {
      cardTitle.textContent = won ? ("✓ " + tr("filled")) : ("✗ " + pl("notYet"));
      nextBtn.hidden = !won;
      retryBtn.hidden = !won;
      cardRewind.hidden = won;
    }
    dirty = true;
  }
  function showCard(win) {
    if (cardOn) return;
    cardOn = true;
    won = win;
    running = false;
    paused = false;
    card.hidden = false;
    paint();
    (win ? nextBtn : cardRewind).focus();
  }
  function hideCard() {
    cardOn = false;
    won = false;
    card.hidden = true;
  }
  function loadLevel(n) {
    level = Math.max(0, Math.min(LV.length - 1, n));
    strokes = [];
    drawing = null;
    pointerId = null;
    penX = 400;
    penY = 300;
    penDown = false;
    hideCard();
    rewind(true);
    paint();
  }
  function rewind(keepCard) {
    var def = LV[level];
    grains = [];
    simT = 0;
    accT = 0;
    running = false;
    paused = false;
    winWait = 0;
    slowT = 0;
    lastSpawn = -1;
    rng = mulberry32(9001 + (level + 1) * 101);
    var need = 0, rateSum = 0, i;
    jars = def.J.map(function (j) {
      var tg = Math.round(j[4] / 0.2);
      need += tg;
      return { x: j[0], y: j[1], w: j[2], h: j[3], g: j[4], tg: tg, n: 0 };
    });
    def.S.forEach(function (s) { rateSum += s[2]; });
    spouts = def.S.map(function (s) {
      return { x: s[0], y: s[1], rate: s[2], acc: 0, spawned: 0, supply: Math.ceil(need * 1.3 * s[2] / rateSum) };
    });
    rebuildStatic();
    armSegs();
    if (!keepCard) hideCard();
    dirty = true;
    paint();
  }
  function togglePour() {
    if (cardOn) return;
    if (!running) { running = true; paused = false; }
    else { running = false; paused = true; }
    paint();
  }
  function undo() {
    if (drawing) return;
    strokes.pop();
    rebuildStatic();
    dirty = true;
    paint();
  }
  function askClear() {
    var now = performance.now();
    if (now < clearUntil) {
      strokes = [];
      clearUntil = 0;
      rebuildStatic();
      dirty = true;
    } else clearUntil = now + 3000;
    paint();
  }
  function poly(list, half) {
    var out = [], i, k;
    for (i = 0; i < list.length; i++) {
      var p = list[i];
      for (k = 0; k + 3 < p.length; k += 2) out.push({ ax: p[k], ay: p[k + 1], bx: p[k + 2], by: p[k + 3], half: half });
    }
    return out;
  }
  function rebuildStatic() {
    var def = LV[level];
    staticSegs = poly(def.L, 3);
    var pen = strokes.map(function (s) {
      var flat = [], i;
      for (i = 0; i < s.pts.length; i++) { flat.push(s.pts[i].x, s.pts[i].y); }
      return flat;
    });
    staticSegs = staticSegs.concat(poly(pen, 3));
    var i;
    for (i = 0; i < jars.length; i++) {
      var j = jars[i];
      staticSegs.push({ ax: j.x, ay: j.y, bx: j.x, by: j.y + j.h, half: 2.5 });
      staticSegs.push({ ax: j.x + j.w, ay: j.y, bx: j.x + j.w, by: j.y + j.h, half: 2.5 });
      staticSegs.push({ ax: j.x, ay: j.y + j.h, bx: j.x + j.w, by: j.y + j.h, half: 2.5 });
    }
  }
  function armSegs() {
    var spec = LV[level].M, out = [], i;
    for (i = 0; i < spec.length; i++) {
      var m = spec[i], A = m[4] + m[3] * simT;
      var dx = Math.cos(A) * m[2], dy = Math.sin(A) * m[2];
      out.push({ ax: m[0] - dx, ay: m[1] - dy, bx: m[0] + dx, by: m[1] + dy, half: 4, w: m[3], cx: m[0], cy: m[1], ang: A });
    }
    section.dataset.arm = out.map(function (s) { return s.ang.toFixed(4); }).join(",");
    return out;
  }
  function hash(segs) {
    var grid = {}, i;
    for (i = 0; i < segs.length; i++) {
      var s = segs[i];
      s.id = i;
      var x0 = Math.floor(Math.min(s.ax, s.bx) / 32) - 1;
      var x1 = Math.floor(Math.max(s.ax, s.bx) / 32) + 1;
      var y0 = Math.floor(Math.min(s.ay, s.by) / 32) - 1;
      var y1 = Math.floor(Math.max(s.ay, s.by) / 32) + 1;
      var x, y;
      for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
        var k = x + "," + y;
        (grid[k] || (grid[k] = [])).push(s);
      }
    }
    return grid;
  }
  function collide(g, seg) {
    var abx = seg.bx - seg.ax, aby = seg.by - seg.ay;
    var len2 = abx * abx + aby * aby;
    var t = len2 ? ((g.x - seg.ax) * abx + (g.y - seg.ay) * aby) / len2 : 0;
    if (t < 0) t = 0; else if (t > 1) t = 1;
    var qx = seg.ax + abx * t, qy = seg.ay + aby * t;
    var dx = g.x - qx, dy = g.y - qy;
    var dist = Math.hypot(dx, dy);
    var limit = R + seg.half;
    if (dist >= limit) return;
    var nx, ny;
    if (dist > 0.0001) { nx = dx / dist; ny = dy / dist; }
    else {
      var len = Math.hypot(abx, aby) || 1;
      nx = -aby / len; ny = abx / len;
    }
    var pen = limit - dist;
    g.x += nx * pen;
    g.y += ny * pen;
    var svx = 0, svy = 0;
    if (seg.w) {
      svx = -seg.w * (g.y - seg.cy);
      svy = seg.w * (g.x - seg.cx);
    }
    var vx = g.vx - svx, vy = g.vy - svy;
    var vn = vx * nx + vy * ny;
    if (vn < 0) {
      var tx = vx - nx * vn, ty = vy - ny * vn;
      vx = tx * 0.996 + nx * (-vn * 0.2);
      vy = ty * 0.996 + ny * (-vn * 0.2);
    }
    g.vx = vx + svx;
    g.vy = vy + svy;
  }
  function step(dt) {
    var segs = staticSegs.concat(armSegs());
    var grid = hash(segs);
    var i, s;
    for (i = 0; i < spouts.length; i++) {
      s = spouts[i];
      if (s.spawned >= s.supply) continue;
      s.acc += s.rate * dt;
      while (s.acc >= 1 && s.spawned < s.supply) {
        s.acc -= 1;
        s.spawned += 1;
        lastSpawn = simT;
        grains.push({
          x: s.x + (rng() * 2 - 1) * 5,
          y: s.y + 6,
          vx: (rng() * 2 - 1) * 20,
          vy: 80 + rng() * 40
        });
      }
    }
    for (i = 0; i < grains.length; i++) {
      var g = grains[i];
      g.vy += 980 * dt;
      var sp = Math.hypot(g.vx, g.vy);
      if (sp > 900) { g.vx *= 900 / sp; g.vy *= 900 / sp; }
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      var seen = {}, pass, cx = Math.floor(g.x / 32), cy = Math.floor(g.y / 32);
      for (pass = 0; pass < 2; pass++) {
        var yy, xx;
        for (yy = cy - 1; yy <= cy + 1; yy++) for (xx = cx - 1; xx <= cx + 1; xx++) {
          var bucket = grid[xx + "," + yy];
          if (!bucket) continue;
          var k;
          for (k = 0; k < bucket.length; k++) {
            var seg = bucket[k];
            if (seen[seg.id]) continue;
            seen[seg.id] = 1;
            collide(g, seg);
          }
        }
      }
    }
    var alive = [];
    for (i = 0; i < grains.length; i++) {
      var q = grains[i];
      if (q.y > 630 || q.x < -30 || q.x > 830) continue;
      var caught = false, j;
      for (j = 0; j < jars.length; j++) {
        var jar = jars[j];
        var surface = jar.y + jar.h - 3 - Math.min(1, jar.n / jar.tg) * (jar.h - 12);
        if (q.x > jar.x + 5 && q.x < jar.x + jar.w - 5 && q.y > Math.max(jar.y + 8, surface - 6) && q.y < jar.y + jar.h) {
          jar.n += 1;
          caught = true;
          break;
        }
      }
      if (!caught) alive.push(q);
    }
    grains = alive;
    simT += dt;
    var all = jars.every(function (jar) { return jar.n >= jar.tg; });
    if (all) {
      winWait += dt;
      if (winWait >= 0.9) showCard(true);
    } else {
      winWait = 0;
      var spent = spouts.every(function (spout) { return spout.spawned >= spout.supply; });
      if (!cardOn && spent && lastSpawn >= 0) {
        if (!grains.length) showCard(false);
        else {
          var maxv = 0;
          for (i = 0; i < grains.length; i++) maxv = Math.max(maxv, grains[i].vx * grains[i].vx + grains[i].vy * grains[i].vy);
          if (maxv < 400) slowT += dt; else slowT = 0;
          if (slowT >= 1.4 || simT - lastSpawn >= 25) showCard(false);
        }
      }
    }
    dirty = true;
  }
  function fit() {
    if (!stage || section.hidden) return;
    var r = stage.getBoundingClientRect();
    var cw = r.width, ch = cw * 0.75;
    if (ch > r.height) { ch = r.height; cw = ch * 4 / 3; }
    if (cw < 2 || ch < 2) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (Math.abs(parseFloat(cv.style.width) - cw) < 1 && Math.abs(parseFloat(cv.style.height) - ch) < 1) return;
    cv.style.width = cw + "px";
    cv.style.height = ch + "px";
    cv.width = Math.max(1, Math.round(cw * dpr));
    cv.height = Math.max(1, Math.round(ch * dpr));
    dirty = true;
  }
  function draw() {
    if (!ctx || section.hidden) return;
    var arms = armSegs();
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f3e6c8";
    ctx.fillRect(0, 0, W, H);
    var i;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1a120c";
    ctx.setLineDash([]);
    for (i = 0; i < LV[level].L.length; i++) strokePoly(LV[level].L[i], 6);
    for (i = 0; i < arms.length; i++) {
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(arms[i].ax, arms[i].ay);
      ctx.lineTo(arms[i].bx, arms[i].by);
      ctx.stroke();
    }
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 6;
    for (i = 0; i < strokes.length; i++) strokePts(strokes[i].pts);
    if (drawing) strokePts(drawing.pts);
    ctx.setLineDash([]);
    for (i = 0; i < jars.length; i++) {
      var j = jars[i];
      ctx.strokeStyle = "#1a120c";
      ctx.lineWidth = 5;
      ctx.strokeRect(j.x, j.y, j.w, j.h);
      ctx.fillStyle = "#1a120c";
      ctx.font = "700 22px sans-serif";
      ctx.fillText("ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i], j.x + 8, j.y + 26);
      ctx.font = "700 18px sans-serif";
      ctx.fillText(gText(j.n) + " / " + gText(j.tg) + " g", j.x + 8, j.y + j.h - 10);
    }
    ctx.fillStyle = "#1f3a34";
    for (i = 0; i < spouts.length; i++) {
      ctx.fillRect(spouts[i].x - 10, spouts[i].y - 8, 20, 12);
    }
    for (i = 0; i < grains.length; i++) {
      var g = grains[i];
      ctx.beginPath();
      ctx.arc(g.x, g.y, R, 0, Math.PI * 2);
      ctx.fillStyle = "#f4e4c4";
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "#1a120c";
      ctx.stroke();
    }
    if (document.activeElement === cv) {
      ctx.beginPath();
      ctx.arc(penX, penY, 10, 0, Math.PI * 2);
      ctx.moveTo(penX - 16, penY);
      ctx.lineTo(penX + 16, penY);
      ctx.moveTo(penX, penY - 16);
      ctx.lineTo(penX, penY + 16);
      ctx.lineWidth = 6;
      ctx.strokeStyle = "#f7f1e4";
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#1a120c";
      ctx.stroke();
    }
    dirty = false;
  }
  function strokePoly(p, width) {
    if (p.length < 4) return;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    var k;
    for (k = 2; k < p.length; k += 2) ctx.lineTo(p[k], p[k + 1]);
    ctx.stroke();
  }
  function strokePts(pts) {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    var i;
    for (i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (clearUntil && performance.now() >= clearUntil) { clearUntil = 0; paint(); }
    var hidden = section.hidden || document.hidden || blurred || !document.body.classList.contains("at-pl");
    if (!hidden && running && !cardOn) {
      var dt = Math.min(0.05, lastNow ? (now - lastNow) / 1000 : STEP);
      accT += dt;
      var n = 0;
      while (accT >= STEP && n < MAX_STEPS && running) {
        step(STEP);
        accT -= STEP;
        n++;
      }
      if (n === MAX_STEPS) accT = 0;
      if (n) paint();
    }
    lastNow = now;
    if (dirty) draw();
  }
  function worldPoint(e) {
    var r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  }
  function endDraw() {
    if (!drawing) return;
    if (drawing.pts.length >= 2) strokes.push(drawing);
    drawing = null;
    pointerId = null;
    rebuildStatic();
    dirty = true;
    paint();
  }
  function say(text) {
    var live = document.getElementById("pl-live");
    if (!live) return;
    live.textContent = "";
    live.textContent = text;
  }
  function beginStrokeAt(p) {
    if (inkPx() / 100 >= budget() - 0.001) { say(pl("noInk")); return false; }
    drawing = { pts: [{ x: p.x, y: p.y }], len: 0 };
    dirty = true;
    return true;
  }
  function extendStroke(p) {
    if (!drawing) return;
    var last = drawing.pts[drawing.pts.length - 1];
    var dx = p.x - last.x, dy = p.y - last.y;
    var dist = Math.hypot(dx, dy);
    if (dist < 5) return;
    var remain = Math.max(0, budget() * 100 - inkPx());
    if (remain <= 0) { endDraw(); say(pl("noInk")); return; }
    var next = p;
    if (dist > remain) {
      var scale = remain / dist;
      next = { x: last.x + dx * scale, y: last.y + dy * scale };
      dist = remain;
    }
    drawing.pts.push(next);
    drawing.len += dist;
    dirty = true;
    paint();
    if (inkPx() / 100 >= budget() - 0.001) { endDraw(); say(pl("noInk")); }
  }
  function setPenDown(on) {
    if (on === penDown) return;
    if (on) {
      if (cardOn) return;
      if (!beginStrokeAt({ x: penX, y: penY })) return;
      penDown = true;
      say(pl("penDown"));
    } else {
      penDown = false;
      endDraw();
      say(pl("penUp"));
    }
    dirty = true;
  }
  function onDown(e) {
    if (pointerId !== null || cardOn) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (penDown) { penDown = false; endDraw(); }
    if (inkPx() / 100 >= budget() - 0.001) { say(pl("noInk")); return; }
    pointerId = e.pointerId;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    cv.focus();
    beginStrokeAt(worldPoint(e));
    e.preventDefault();
  }
  function onMove(e) {
    if (e.pointerId !== pointerId || !drawing) return;
    if (e.pointerType === "mouse" && e.buttons === 0) { endDraw(); return; }
    extendStroke(worldPoint(e));
    e.preventDefault();
  }
  function onUp(e) {
    if (pointerId === null || (e && e.pointerId !== undefined && e.pointerId !== pointerId)) return;
    endDraw();
  }
  function typingTarget(el) {
    return !!(el && el.closest && el.closest("button, input, textarea, select, a"));
  }
  function onKey(e) {
    if (!document.body.classList.contains("at-pl")) return;
    if (e.key === "Escape") {
      if (penDown) {
        e.preventDefault();
        e.stopImmediatePropagation();
        setPenDown(false);
        return;
      }
      if (cardOn && !won) {
        e.preventDefault();
        e.stopImmediatePropagation();
        rewind();
        return;
      }
      return;
    }
    var inField = document.activeElement && document.activeElement.closest && document.activeElement.closest("input, textarea");
    if (e.key === "Backspace" && !inField) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (penDown) setPenDown(false);
      undo();
      return;
    }
    if (typingTarget(document.activeElement)) return;
    var k = e.key.toLowerCase();
    var onCanvas = document.activeElement === cv;
    if (onCanvas && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      var stepPx = e.shiftKey ? 40 : 10;
      if (e.key === "ArrowLeft") penX -= stepPx;
      else if (e.key === "ArrowRight") penX += stepPx;
      else if (e.key === "ArrowUp") penY -= stepPx;
      else penY += stepPx;
      if (penX < 0) penX = 0; else if (penX > W) penX = W;
      if (penY < 0) penY = 0; else if (penY > H) penY = H;
      if (penDown && drawing) {
        var start = drawing.pts[0];
        drawing.pts = [start];
        drawing.len = 0;
        extendStroke({ x: penX, y: penY });
        if (!drawing) penDown = false;
        else if (drawing.pts.length > 1) {
          penX = drawing.pts[drawing.pts.length - 1].x;
          penY = drawing.pts[drawing.pts.length - 1].y;
        }
      }
      dirty = true;
      return;
    }
    if (onCanvas && e.key === "Enter") {
      e.preventDefault();
      e.stopImmediatePropagation();
      setPenDown(!penDown);
      return;
    }
    if (e.key === " " || e.code === "Space") {
      e.preventDefault();
      e.stopImmediatePropagation();
      togglePour();
    } else if ((e.ctrlKey || e.metaKey) && k === "z") {
      e.preventDefault();
      e.stopImmediatePropagation();
      undo();
    } else if (k === "r" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      e.stopImmediatePropagation();
      rewind();
    }
  }
  function open() {
    build();
    document.body.classList.add("at-pl");
    section.hidden = false;
    fit();
    dirty = true;
    lastNow = 0;
    if (!raf) raf = requestAnimationFrame(frame);
    paint();
    cv.focus();
  }
  function close() {
    if (!built) return;
    document.body.classList.remove("at-pl");
    section.hidden = true;
    running = false;
    if (host().home) host().home();
  }
  build();
  window.PourLines = { open: open, close: close, paint: paint };
})();
