/* HI 1.1.19 — the tower refits after a turn, and the turn tip stays off the controls. */
(function () {
  var KEY = "kulibert-fullscreen";
  var TURN = "kulibert-tower-turn-hide";
  var TOWERS = {
    "flag-mast": 1, "water-tower": 1, "radio-mast": 1, lookout: 1, pylon: 1,
    aftershock: 1, "economy-spire": 1, core: 1, "utility-bid": 1
  };
  var STR = {
    en: { fs: "Full screen", exit: "Exit full screen", turn: "Turn your phone upright for towers", close: "Close", hint: "For full screen on iPhone: tap Share, then Add to Home Screen, and open HoldIt from there." },
    es: { fs: "Pantalla completa", exit: "Salir de pantalla completa", turn: "Pon el teléfono de pie para las torres", close: "Cerrar", hint: "Para pantalla completa en iPhone: toca Compartir, luego Añadir a inicio, y abre HoldIt desde ahí." },
    uk: { fs: "На весь екран", exit: "Вийти з повного екрана", turn: "Для веж тримайте телефон сторч", close: "Закрити", hint: "Для повного екрана на iPhone: натисніть Поділитися, потім На початковий екран, і відкрийте HoldIt звідти." },
    ru: { fs: "Во весь экран", exit: "Выйти из полного экрана", turn: "Для башен держите телефон вертикально", close: "Закрыть", hint: "Для полного экрана на iPhone: нажмите Поделиться, затем На экран «Домой», и откройте HoldIt оттуда." },
    ar: { fs: "ملء الشاشة", exit: "الخروج من ملء الشاشة", turn: "أدر هاتفك عموديًا للأبراج", close: "إغلاق", hint: "لملء الشاشة على آيفون: اضغط مشاركة، ثم إضافة إلى الشاشة الرئيسية، وافتح هولدإت من هناك." },
    "fa-AF": { fs: "تمام صفحه", exit: "خروج از تمام صفحه", turn: "برای برج‌ها تلفون را راست بگیرید", close: "بستن", hint: "برای تمام صفحه در آیفون: شریک را بزنید، بعد به صفحهٔ اصلی اضافه کنید، و هولدایت را از آنجا باز کنید." },
    rw: { fs: "Mugaragaza rwose", exit: "Sohoka muri mugaragaza", turn: "Shyira terefone uhagaze ku minara", close: "Funga", hint: "Ku mugaragaza rwose kuri iPhone: kanda Sangiza, hanyuma Ongeraho ku rupapuro rw'itangiriro, ukingure HoldIt uhereye aho." },
    ti: { fs: "ምሉእ መርኣይ", exit: "ካብ ምሉእ መርኣይ ውጻእ", turn: "ንግምቢ ተሌፎን ቀጥ ኣቢልካ ሓዝ", close: "ዕጸው", hint: "ኣብ ኣይፎን ምሉእ መርኣይ: ሼር ጠውቕ፣ ድሕሪኡ ናብ መጀመርታ ስክሪን ወስኽ፣ ካብኡ HoldIt ክፈት።" }
  };
  function lang() {
    var code = "en";
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q) code = q;
      else if (window.KulibertPrefs && KulibertPrefs.lang) code = KulibertPrefs.lang;
      else {
        var raw = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "null");
        if (raw && raw.lang) code = raw.lang;
      }
    } catch (e) {}
    var html = document.documentElement.getAttribute("data-kp-lang") || document.documentElement.lang;
    if ((!code || code === "en") && html && STR[html]) code = html;
    if (code === "simple") code = "en";
    return STR[code] ? code : "en";
  }
  function L(k) { return STR[lang()][k]; }
  function get() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function canFS() { return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); }
  function isFS() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function installed() {
    try {
      return matchMedia("(display-mode: standalone), (display-mode: fullscreen)").matches || navigator.standalone === true;
    } catch (e) { return false; }
  }
  function enterFS() {
    var el = document.documentElement;
    try {
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: "hide" }) : el.webkitRequestFullscreen && el.webkitRequestFullscreen();
      return Promise.resolve(p).catch(function () {});
    } catch (e) { return Promise.resolve(); }
  }
  function exitFS() {
    try {
      var fn = document.exitFullscreen || document.webkitExitFullscreen;
      if (fn && isFS()) fn.call(document);
    } catch (e) {}
  }
  var fails = 0, pending = false;
  function reenter(e) {
    if (get() !== "on" || isFS() || !canFS() || installed() || fails > 1 || pending) return;
    if (e.target && e.target.closest && e.target.closest("[data-fs-exit]")) return;
    if (e.type === "keydown" && e.key === "Escape") return;
    pending = true;
    enterFS().then(function () { pending = false; if (!isFS()) fails++; });
  }
  addEventListener("pointerup", reenter, { capture: true, passive: true });
  addEventListener("keydown", reenter, { capture: true });

  var btn = document.createElement("button");
  btn.type = "button";
  btn.id = "hi-fs";
  btn.className = "hi-fs";
  btn.hidden = true;
  btn.innerHTML = '<span class="hi-fs-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square"/></svg></span><span class="hi-fs-label"></span>';
  var hint = document.createElement("div");
  hint.id = "hi-fs-hint";
  hint.className = "hi-fs-hint";
  hint.hidden = true;
  hint.setAttribute("role", "dialog");
  hint.innerHTML = '<p></p><button type="button" data-fs-hint-x aria-label="Close">×</button>';
  var turn = document.createElement("div");
  turn.id = "hi-turn";
  turn.className = "hi-turn";
  turn.hidden = true;
  turn.innerHTML = '<span class="hi-turn-text"></span><button type="button" data-turn-x aria-label="Close">×</button>';
  document.addEventListener("DOMContentLoaded", function () {
    document.body.appendChild(btn);
    document.body.appendChild(hint);
    document.body.appendChild(turn);
  });
  if (document.body) {
    document.body.appendChild(btn);
    document.body.appendChild(hint);
    document.body.appendChild(turn);
  }

  function paint() {
    var pack = STR[lang()];
    var label = btn.querySelector(".hi-fs-label");
    if (label.textContent !== pack.fs) label.textContent = pack.fs;
    if (btn.getAttribute("aria-label") !== pack.fs) btn.setAttribute("aria-label", pack.fs);
    var hp = hint.querySelector("p");
    if (hp.textContent !== pack.hint) hp.textContent = pack.hint;
    var hx = hint.querySelector("button");
    if (hx.getAttribute("aria-label") !== pack.close) hx.setAttribute("aria-label", pack.close);
    var tt = turn.querySelector(".hi-turn-text");
    if (tt.textContent !== pack.turn) tt.textContent = pack.turn;
    var tx = turn.querySelector("button");
    if (tx.getAttribute("aria-label") !== pack.close) tx.setAttribute("aria-label", pack.close);
    document.querySelectorAll("[data-fs-exit-label]").forEach(function (el) {
      if (el.textContent !== pack.exit) el.textContent = pack.exit;
    });
  }

  function showBtn() {
    var canvas = document.querySelector(".shop-editor canvas.hi-stage");
    var hide = !canvas || isFS() || installed();
    if (hide) { btn.hidden = true; return; }
    var r = canvas.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) { btn.hidden = true; return; }
    btn.hidden = false;
    var rtl = document.documentElement.dir === "rtl";
    var top = r.top + 8;
    btn.style.top = Math.round(top) + "px";
    if (rtl) {
      btn.style.left = Math.round(r.left + 8) + "px";
      btn.style.right = "auto";
    } else {
      btn.style.left = "auto";
      btn.style.right = Math.round(window.innerWidth - r.right + 8) + "px";
    }
    /* Drop below a card that already owns this corner. Stay inside the canvas. */
    for (var n = 0; n < 4; n++) {
      var b = btn.getBoundingClientRect();
      var next = 0;
      var cards = document.querySelectorAll(".hi-studio, .hi-plan");
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i].getBoundingClientRect();
        if (c.width < 8 || c.height < 8) continue;
        var hit = b.left < c.right - 1 && b.right > c.left + 1 && b.top < c.bottom - 1 && b.bottom > c.top + 1;
        if (hit && c.bottom + 8 > next) next = c.bottom + 8;
      }
      if (!next || next + 44 > r.bottom - 4) break;
      top = next;
      btn.style.top = Math.round(top) + "px";
    }
  }
  btn.addEventListener("click", function () {
    if (!canFS()) { hint.hidden = false; return; }
    set("on");
    fails = 0;
    pending = true;
    enterFS().then(function () { pending = false; if (!isFS()) fails++; showBtn(); });
  });
  hint.querySelector("button").addEventListener("click", function () { hint.hidden = true; });

  function levelId() {
    var m = location.pathname.match(/\/play\/([^/]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  function isTower() {
    var el = document.querySelector(".shop.shop-editor");
    if (el && el.getAttribute("data-campaign") === "tower") return true;
    return !!TOWERS[levelId()];
  }
  function isPhone() {
    try {
      return matchMedia("(pointer: coarse)").matches && Math.min(screen.width, screen.height) <= 600;
    } catch (e) { return false; }
  }
  function sideways() {
    return window.innerHeight <= 480 && window.innerWidth > window.innerHeight;
  }
  function lockTower() {
    if (!isTower() || !isPhone() || !isFS()) return;
    try {
      var o = screen.orientation;
      if (o && o.lock) o.lock("portrait").catch(function () {});
    } catch (e) {}
  }
  function unlockTower() {
    try {
      var o = screen.orientation;
      if (o && o.unlock) o.unlock();
    } catch (e) {}
  }
  function rectOf(el) {
    if (!el) return null;
    var cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return null;
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return null;
    return r;
  }
  function hit(a, b) {
    if (!a || !b) return false;
    return a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;
  }
  function resultOpen() {
    var nodes = document.querySelectorAll("[role='dialog'], [role='alertdialog']");
    for (var i = 0; i < nodes.length; i++) {
      var r = rectOf(nodes[i]);
      if (r && r.width > 40 && r.height > 40) return nodes[i];
    }
    return null;
  }
  function controlRects() {
    var out = [];
    var nodes = document.querySelectorAll("button, a, [role='button']");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest && el.closest("#hi-turn")) continue;
      var r = rectOf(el);
      if (!r) continue;
      if (r.bottom < 0 || r.right < 0 || r.top > window.innerHeight || r.left > window.innerWidth) continue;
      out.push(r);
    }
    var dlg = resultOpen();
    if (dlg) {
      var dr = rectOf(dlg);
      if (dr) out.push(dr);
    }
    return out;
  }
  function placeTurn() {
    var canvas = document.querySelector(".shop-editor canvas.hi-stage");
    var dismissed = false;
    try { dismissed = sessionStorage.getItem(TURN) === "1"; } catch (e) {}
    var show = !!(isTower() && isPhone() && sideways() && !dismissed && canvas);
    if (!show) { turn.hidden = true; return; }
    var locked = false;
    try { locked = screen.orientation && screen.orientation.type && screen.orientation.type.indexOf("portrait") === 0 && isFS(); } catch (e) {}
    if (locked) { turn.hidden = true; return; }
    var r = canvas.getBoundingClientRect();
    if (r.width < 40 || r.height < 40) { turn.hidden = true; return; }
    /* A result card owns the controls. Hide the tip instead of covering them. */
    if (resultOpen()) { turn.hidden = true; return; }
    turn.hidden = false;
    var rtl = document.documentElement.dir === "rtl";
    var box = turn.getBoundingClientRect();
    var tw = Math.max(box.width, 160);
    var th = Math.max(box.height, 44);
    var spots = rtl
      ? [
          { left: r.right - tw - 8, top: r.bottom - th - 8 },
          { left: r.left + 8, top: r.bottom - th - 8 },
          { left: r.right - tw - 8, top: r.top + 8 }
        ]
      : [
          { left: r.left + 8, top: r.bottom - th - 8 },
          { left: r.right - tw - 8, top: r.bottom - th - 8 },
          { left: r.left + 8, top: r.top + Math.max(8, r.height * 0.55) }
        ];
    var controls = controlRects();
    var placed = false;
    for (var s = 0; s < spots.length; s++) {
      var left = Math.round(Math.max(r.left + 4, Math.min(spots[s].left, r.right - tw - 4)));
      var top = Math.round(Math.max(4, Math.min(spots[s].top, r.bottom - th - 4)));
      var candidate = { left: left, top: top, right: left + tw, bottom: top + th, width: tw, height: th };
      var blocked = false;
      for (var c = 0; c < controls.length; c++) {
        if (hit(candidate, controls[c])) { blocked = true; break; }
      }
      if (blocked) continue;
      turn.style.left = left + "px";
      turn.style.right = "auto";
      turn.style.top = top + "px";
      placed = true;
      break;
    }
    if (!placed) turn.hidden = true;
  }
  turn.querySelector("button").addEventListener("click", function () {
    try { sessionStorage.setItem(TURN, "1"); } catch (e) {}
    turn.hidden = true;
  });

  function dockCards() {
    var shop = document.querySelector(".shop.shop-editor");
    if (!shop) return;
    var cards = shop.querySelectorAll(".hi-plan, .hi-studio");
    var tower = shop.getAttribute("data-campaign") === "tower";
    var short = window.innerHeight <= 500;
    for (var i = 0; i < cards.length; i++) {
      if (!(tower && short)) {
        cards[i].style.removeProperty("top");
        cards[i].style.removeProperty("max-height");
        cards[i].style.removeProperty("overflow");
        cards[i].style.removeProperty("position");
        continue;
      }
      /* Side cards overlay the board. They must not join the flex column and steal its height. */
      cards[i].style.setProperty("position", "absolute", "important");
      var canvas = shop.querySelector("canvas.hi-stage");
      if (!canvas) continue;
      var parent = cards[i].offsetParent || shop;
      var c = canvas.getBoundingClientRect();
      var p = parent.getBoundingClientRect();
      var top = c.top - p.top + 8;
      cards[i].style.setProperty("top", Math.round(top) + "px", "important");
      var max = Math.max(72, Math.min(c.height * 0.42, 120));
      cards[i].style.setProperty("max-height", Math.round(max) + "px", "important");
      cards[i].style.setProperty("overflow", "auto", "important");
    }
  }
  function stageCanvas() {
    return document.querySelector(".shop-editor canvas.hi-stage");
  }
  /* Drop a pinned pixel size so the board can fill its flex cell again. */
  function releaseStage(canvas) {
    if (!canvas) return;
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
    canvas.style.removeProperty("max-height");
    var parent = canvas.parentElement;
    if (!parent) return;
    parent.style.minHeight = "0px";
    parent.style.removeProperty("height");
  }
  function refitBoard() {
    var canvas = stageCanvas();
    if (!canvas) return;
    releaseStage(canvas);
    var parent = canvas.parentElement;
    if (!parent) return;
    var w = parent.clientWidth;
    var h = parent.clientHeight;
    if (w < 40 || h < 40) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var bw = Math.max(1, Math.floor(w * dpr));
    var bh = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    /* The draw loop frames the tower only while this flag is clear. */
    try { window.dispatchEvent(new Event("lp-fit")); } catch (e) {}
  }
  var refitGen = 0;
  function settleRefit() {
    var token = ++refitGen;
    var pass = function () {
      if (token !== refitGen) return;
      refitBoard();
      dockCards();
      showBtn();
      placeTurn();
    };
    requestAnimationFrame(function () { requestAnimationFrame(pass); });
    setTimeout(pass, 250);
  }
  var wasTower = false;
  function onRoute() {
    var now = isTower();
    if (wasTower && !now) unlockTower();
    if (now) lockTower();
    wasTower = now;
    placeTurn();
    dockCards();
    showBtn();
  }
  document.addEventListener("fullscreenchange", function () { lockTower(); showBtn(); placeTurn(); settleRefit(); });
  document.addEventListener("webkitfullscreenchange", function () { lockTower(); showBtn(); placeTurn(); settleRefit(); });
  addEventListener("resize", function () { dockCards(); showBtn(); placeTurn(); settleRefit(); });
  addEventListener("orientationchange", function () {
    setTimeout(function () { showBtn(); placeTurn(); lockTower(); }, 60);
    settleRefit();
  });
  if (window.visualViewport) {
    visualViewport.addEventListener("resize", function () { settleRefit(); });
  }
  setInterval(onRoute, 400);

  function ensureExit(panel) {
    if (!panel || panel.querySelector("[data-fs-exit-label]")) return;
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-fs-exit", "");
    b.setAttribute("data-fs-exit-label", "");
    b.className = "hi-fs-exit";
    b.textContent = L("exit");
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      set("off");
      fails = 99;
      exitFS();
      hint.hidden = true;
      showBtn();
    });
    panel.appendChild(b);
  }
  var obs = new MutationObserver(function () {
    obs.disconnect();
    try {
      ensureExit(document.getElementById("hi-settings-panel"));
      paint();
    } finally {
      if (document.body) obs.observe(document.body, { childList: true, subtree: true });
    }
  });
  function arm() {
    obs.observe(document.body, { childList: true, subtree: true });
    paint();
    onRoute();
  }
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
  addEventListener("kulibert-lang", paint);

  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest && e.target.closest("a.kb-home, a[target='_top']");
    if (!a) return;
    unlockTower();
    exitFS();
  }, true);
})();
