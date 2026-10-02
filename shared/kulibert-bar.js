/* One Tech Room bar. Inside the Hub it stays quiet and talks to the strip.
   Standalone, it draws Home, the app plate, the alias, and Help.
   A deferred script has no currentScript, and a cross-origin app
   (baboo.kulibert.net) cannot load /shared from its own origin. */
(function (root) {
  function barScript() {
    var current = document.currentScript;
    if (current && current.src && current.src.indexOf("kulibert-bar.js") !== -1) return current;
    var nodes = document.querySelectorAll("script[src*='kulibert-bar.js']");
    return nodes.length ? nodes[nodes.length - 1] : current;
  }
  var script = barScript();
  var app = (script && script.getAttribute("data-app")) || "";
  var version = (script && script.getAttribute("data-version")) || "";
  var name = (script && script.getAttribute("data-name")) || "";
  var helpSel = (script && script.getAttribute("data-help")) || "";
  var menuSel = (script && script.getAttribute("data-menu")) || "";
  if (helpSel && menuSel && helpSel === menuSel) {
    console.warn("kulibert-bar: data-help matches data-menu, ignoring help");
    helpSel = "";
  }
  var helpFn = null;
  var toastTimer = 0;
  var assetOrigin = "https://apps.kulibert.net";
  try {
    if (script && script.src) assetOrigin = new URL(script.src, location.href).origin;
  } catch (eOrigin) {}
  function asset(path) { return assetOrigin + path; }

  function classic() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("hub") === "classic" || q.get("theme") === "classic") return true;
      return localStorage.getItem("tech-room-hub") === "classic";
    } catch (e) { return false; }
  }
  function framed() {
    try { return root.parent !== root; } catch (e) { return false; }
  }
  function schoolOrigin(origin) {
    try {
      var host = new URL(origin).hostname;
      return host === "kulibert.net" || host.slice(-13) === ".kulibert.net" || origin === location.origin;
    } catch (e) { return false; }
  }
  function ensureCss() {
    if (document.querySelector("link[data-kb-css]")) return;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = asset("/shared/kulibert-bar.css?v=2026-10-09-menu");
    link.setAttribute("data-kb-css", "1");
    (document.head || document.documentElement).appendChild(link);
  }
  function ensureWho(done) {
    if (root.KulibertWho) { done(); return; }
    var s = document.createElement("script");
    s.src = asset("/shared/kw-who.js?v=2026-10-01-job");
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function postUp(msg) {
    if (!framed()) return;
    try { root.parent.postMessage(msg, "*"); } catch (e) {}
  }
  function paintAlias(node) {
    if (!node) return;
    var who = root.KulibertWho && root.KulibertWho.read && root.KulibertWho.read();
    var on = root.KulibertWho && root.KulibertWho.active && root.KulibertWho.active();
    if (on && who && who.alias) { node.textContent = who.alias; return; }
    var word = root.KulibertI18n && root.KulibertI18n.t ? root.KulibertI18n.t("signIn") : "";
    node.textContent = word || "Sign in";
  }
  function toast(text) {
    ensureCss();
    var el = document.getElementById("kb-toast");
    if (!el) {
      el = document.createElement("p");
      el.id = "kb-toast";
      el.className = "kb-toast";
      el.setAttribute("role", "status");
      document.body.appendChild(el);
    }
    el.hidden = false;
    el.textContent = String(text || "").slice(0, 80);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2800);
  }
  function plateText() {
    var narrow = false;
    try { narrow = window.matchMedia("(max-width: 400px)").matches; } catch (eNarrow) {}
    if (narrow && version) return version;
    return [name || app, version].filter(Boolean).join(" \u00b7 ");
  }
  var whatsAttr = (script && script.getAttribute("data-whats-new")) || "";
  var WHATS = {
    en: "Menu opens the app's own menu, with nothing on top of it.",
    uk: "\u041c\u0435\u043d\u044e \u0432\u0456\u0434\u043a\u0440\u0438\u0432\u0430\u0454 \u043c\u0435\u043d\u044e \u0441\u0430\u043c\u043e\u0457 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u0438, \u0456 \u043d\u0456\u0447\u043e\u0433\u043e \u0439\u043e\u0433\u043e \u043d\u0435 \u0437\u0430\u043a\u0440\u0438\u0432\u0430\u0454.",
    ru: "\u041c\u0435\u043d\u044e \u043e\u0442\u043a\u0440\u044b\u0432\u0430\u0435\u0442 \u043c\u0435\u043d\u044e \u0441\u0430\u043c\u043e\u0433\u043e \u043f\u0440\u0438\u043b\u043e\u0436\u0435\u043d\u0438\u044f, \u0438 \u043d\u0438\u0447\u0435\u0433\u043e \u0435\u0433\u043e \u043d\u0435 \u0437\u0430\u043a\u0440\u044b\u0432\u0430\u0435\u0442.",
    es: "Men\u00fa abre el men\u00fa de la propia aplicaci\u00f3n, sin nada encima.",
    ar: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629 \u062a\u0641\u062a\u062d \u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u062a\u0637\u0628\u064a\u0642 \u0646\u0641\u0633\u0647\u0627\u060c \u062f\u0648\u0646 \u0634\u064a\u0621 \u0641\u0648\u0642\u0647\u0627.",
    "fa-AF": "\u0645\u0646\u0648\u060c \u0645\u0646\u0648\u06cc \u062e\u0648\u062f \u0628\u0631\u0646\u0627\u0645\u0647 \u0631\u0627 \u0628\u0627\u0632 \u0645\u06cc\u200c\u06a9\u0646\u062f \u0648 \u0686\u06cc\u0632\u06cc \u0631\u0648\u06cc \u0622\u0646 \u0646\u06cc\u0633\u062a.",
    rw: "Menu ifungura menu y'aporogaramu ubwayo, nta kindi gihagarara hejuru.",
    ti: "\u1218\u120b\u1308\u1262 \u1293\u12ed\u1272 \u1218\u1270\u130d\u1260\u122a \u1218\u120b\u1308\u1262 \u12ed\u12b8\u134d\u1275\u1363 \u12a3\u1265 \u120d\u12d5\u120a\u12a1 \u1290\u1308\u122d \u12e8\u1208\u1295\u1362"
  };
  function whatsText() {
    if (whatsAttr) return whatsAttr;
    var lang = "en";
    try { lang = pageLang(); } catch (eLang) {}
    if (lang === "simple") lang = "en";
    return WHATS[lang] || WHATS.en;
  }
  function setDrawer(open) {
    var box = document.getElementById("kb-drawer");
    var btn = document.querySelector(".kb-bar .kb-menu");
    if (!box) return;
    box.hidden = !open;
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    postUp({ type: "kb-menu-state", open: !!open });
    if (open) paintDrawer();
  }
  function paintDrawer() {
    var box = document.getElementById("kb-drawer");
    if (!box) return;
    var title = box.querySelector(".kb-drawer-title");
    var line = box.querySelector(".kb-drawer-line");
    var home = box.querySelector(".kb-drawer-home");
    var settings = box.querySelector(".kb-drawer-settings");
    var help = box.querySelector(".kb-drawer-help");
    var news = box.querySelector(".kb-drawer-kicker");
    var full = [name || app, version].filter(Boolean).join(" \u00b7 ");
    if (title) title.textContent = full || trBar("menu", "Menu");
    if (line) line.textContent = whatsText();
    if (news) news.textContent = trBar("whatsNew", "What\u2019s new");
    if (home) home.textContent = "\u2302 " + trBar("home", "Home");
    if (settings) settings.textContent = trBar("mySettings", "My settings");
    if (help) help.textContent = trBar("help", "Help");
  }
  function ensureDrawer() {
    if (document.getElementById("kb-drawer")) return;
    ensureCss();
    var box = document.createElement("aside");
    box.id = "kb-drawer";
    box.className = "kb-drawer";
    box.hidden = true;
    box.setAttribute("dir", "ltr");
    box.innerHTML = [
      '<p class="kb-drawer-title"></p>',
      '<p class="kb-drawer-news"><strong class="kb-drawer-kicker">What\u2019s new</strong> <span class="kb-drawer-line"></span></p>',
      '<a class="kb-drawer-home" href="https://apps.kulibert.net/" target="_top">\u2302 Home</a>',
      '<button type="button" class="kb-drawer-settings">My settings</button>',
      '<div class="kb-drawer-langs" hidden></div>',
      '<button type="button" class="kb-drawer-help">Help</button>'
    ].join("");
    document.body.appendChild(box);
    var langs = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
    var labels = { en: "English", uk: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430", ru: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439", es: "Espa\u00f1ol", ar: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629", "fa-AF": "\u062f\u0631\u06cc", rw: "Ikinyarwanda", ti: "\u1275\u130d\u122d\u129b" };
    var row = box.querySelector(".kb-drawer-langs");
    langs.forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = labels[code];
      b.setAttribute("lang", code === "fa-AF" ? "fa" : code);
      if (code === "ar" || code === "fa-AF") b.dir = "rtl";
      b.addEventListener("click", function () {
        if (root.KulibertPrefs && root.KulibertPrefs.acceptLang) root.KulibertPrefs.acceptLang(code);
      });
      row.appendChild(b);
    });
    box.querySelector(".kb-drawer-settings").addEventListener("click", function () {
      row.hidden = !row.hidden;
    });
    box.querySelector(".kb-drawer-help").addEventListener("click", function () {
      openHelp();
      if (!helpSel && typeof helpFn !== "function") {
        var line = box.querySelector(".kb-drawer-line");
        if (line) line.focus && line.setAttribute("tabindex", "-1");
      }
    });
    document.addEventListener("mousedown", function (ev) {
      var live = document.getElementById("kb-drawer");
      var menuBtn = document.querySelector(".kb-bar .kb-menu");
      if (!live || live.hidden) return;
      if (live.contains(ev.target) || (menuBtn && menuBtn.contains(ev.target))) return;
      setDrawer(false);
    });
    paintDrawer();
  }
  function hideDupes() {
    var sels = ["#btn-menu", "#menu-btn", "#btn-crew", "#land-menu", "[data-bits-menu]", "button.tw-edge-pocket-chip", ".tw-edge-pocket-chip", "[aria-controls='hi-drawer']", "header.sticky > button[aria-expanded]"];
    sels.forEach(function (sel) {
      var nodes = document.querySelectorAll(sel);
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i];
        if (el.classList.contains("kb-menu") && el.closest && el.closest(".kb-bar")) continue;
        if (el.closest && (el.closest(".kb-drawer") || el.closest("#hub-drawer"))) continue;
        el.classList.add("kb-menu-dupe");
      }
    });
  }
  function shownControl(el) {
    if (!el || el.hidden) return false;
    var s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden") return false;
    var r = el.getBoundingClientRect();
    return r.width >= 8 && r.height >= 8;
  }
  function pointPanel() {
    var hit = document.elementFromPoint(100, 300);
    if (!hit || !hit.closest) return null;
    if (hit.closest(".kb-bar") || hit.closest("#kb-drawer") || hit.closest("#hub-drawer")) return null;
    var n = hit;
    while (n && n !== document.documentElement) {
      if (n.id === "kb-drawer" || n.id === "hub-drawer") return null;
      var s = getComputedStyle(n);
      if (s.position === "fixed" || s.position === "absolute") {
        var r = n.getBoundingClientRect();
        if (r.width >= 200 && r.height >= 80 && r.left <= 100 && r.right >= 100) return n;
      }
      n = n.parentElement;
    }
    return null;
  }
  function appPanels() {
    var found = [];
    var nodes = document.body ? document.body.querySelectorAll("*") : [];
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (!el || el.id === "kb-drawer" || el.id === "hub-drawer") continue;
      if (el.closest && (el.closest(".kb-bar") || el.closest("#kb-drawer") || el.closest("#hub-drawer"))) continue;
      if (el.hidden) continue;
      var s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden") continue;
      if (s.position !== "fixed" && s.position !== "absolute") continue;
      var r = el.getBoundingClientRect();
      if (r.width >= 200 && r.height >= 40 && r.left >= -1 && r.left <= 12 && r.top < 240) found.push(el);
    }
    return found;
  }
  function hideStrayDrawer() {
    var stray = document.getElementById("kb-drawer");
    if (stray) stray.hidden = true;
  }
  function openMenu() {
    var btn = document.querySelector(".kb-bar .kb-menu");
    var el = menuSel ? document.querySelector(menuSel) : null;
    if (btn) btn.setAttribute("aria-expanded", "true");
    if (el && typeof el.click === "function") {
      var trust = shownControl(el);
      var before = appPanels();
      var beforePoint = pointPanel();
      el.click();
      if (trust) {
        postUp({ type: "kb-menu-state", open: true });
        hideStrayDrawer();
        return;
      }
      setTimeout(function () {
        var now = appPanels();
        var grew = false;
        for (var i = 0; i < now.length; i++) if (before.indexOf(now[i]) === -1) grew = true;
        var nowPoint = pointPanel();
        if (grew || (nowPoint && nowPoint !== beforePoint) || (before.length && !now.length)) {
          postUp({ type: "kb-menu-state", open: true });
          hideStrayDrawer();
          return;
        }
        ensureDrawer();
        var box = document.getElementById("kb-drawer");
        setDrawer(!box || box.hidden);
      }, 350);
      return;
    }
    ensureDrawer();
    var box = document.getElementById("kb-drawer");
    setDrawer(!box || box.hidden);
  }
  function openHelp() {
    if (typeof helpFn === "function") { helpFn(); return; }
    if (helpSel) {
      var el = document.querySelector(helpSel);
      if (el && el.click) el.click();
    }
  }
  root.addEventListener("message", function (ev) {
    var data = ev.data;
    if (!data || !data.type) return;
    if (!schoolOrigin(ev.origin)) return;
    if (data.type === "kb-help") { openHelp(); return; }
    if (data.type === "kb-menu") { openMenu(); return; }
    if (data.type === "kp-lang") { applyBarLang(data.lang); return; }
    if (data.type !== "kw-who") return;
    ensureWho(function () {
      var api = root.KulibertWho;
      if (!api) return;
      if (data.on === false) {
        if (api.forget) api.forget();
        try { sessionStorage.removeItem("kw-session-v1"); } catch (e) {}
      } else if (data.alias && data.code && api.write) {
        api.write(data.alias, data.code);
        try { sessionStorage.setItem("kw-session-v1", "1"); } catch (e2) {}
      }
      paintAlias(document.querySelector(".kb-alias"));
    });
  });

  root.KulibertBar = {
    setHelp: function (fn) { helpFn = fn; },
    toast: toast
  };

  if (classic()) {
    if (!document.getElementById("tw-session-boot")) {
      var shim = document.createElement("script");
      shim.id = "tw-session-boot";
      shim.src = asset("/shared/tw-session.js?v=2026-10-09-menu");
      (document.head || document.documentElement).appendChild(shim);
    }
    return;
  }

  var LANG_OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  var allowRtl = script && script.getAttribute("data-rtl") === "1";
  function langCode(value) {
    var s = String(value || "");
    return LANG_OK[s] ? s : "";
  }
  function dirOfLang(lang) {
    return lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
  }
  function trBar(key, fallback) {
    var v = root.KulibertI18n && root.KulibertI18n.t ? root.KulibertI18n.t(key) : "";
    return v || fallback;
  }
  function paintBar() {
    var home = document.querySelector(".kb-bar .kb-home");
    var menuBtn = document.querySelector(".kb-bar .kb-menu");
    var helpBtn = document.querySelector(".kb-bar .kb-help");
    if (home) home.textContent = "\u2302 " + trBar("home", "Home");
    if (menuBtn) menuBtn.textContent = "\u2630 " + trBar("menu", "Menu");
    if (helpBtn) {
      var help = trBar("help", "Help");
      helpBtn.textContent = help;
      helpBtn.setAttribute("aria-label", help);
    }
    paintAlias(document.querySelector(".kb-bar .kb-alias"));
    paintDrawer();
  }
  function storedLang() {
    try {
      var raw = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "null");
      return langCode(raw && raw.lang) || "";
    } catch (e) { return ""; }
  }
  function pageLang() {
    try {
      var fromQ = langCode(new URLSearchParams(location.search).get("lang"));
      if (fromQ) return fromQ;
    } catch (e) {}
    try {
      if (root.KulibertPrefs && root.KulibertPrefs.lang) return langCode(root.KulibertPrefs.lang) || "en";
    } catch (e2) {}
    return storedLang() || "en";
  }
  function ensureI18n(done) {
    if (root.KulibertI18n) { done(); return; }
    var s = document.createElement("script");
    s.src = asset("/shared/kulibert-i18n.js?v=2026-10-09-menu");
    s.onload = function () { done(); };
    s.onerror = function () { done(); };
    (document.head || document.documentElement).appendChild(s);
  }
  function applyBarLang(lang) {
    if (classic()) return;
    var code = langCode(lang) || "en";
    document.documentElement.lang = code === "simple" ? "en" : code;
    document.documentElement.setAttribute("data-kp-lang", code);
    if (allowRtl) document.documentElement.dir = dirOfLang(code);
    var havePrefs = root.KulibertPrefs && root.KulibertPrefs.acceptLang;
    if (havePrefs) {
      try { if (root.KulibertPrefs.lang !== code) root.KulibertPrefs.acceptLang(code); } catch (e) {}
    } else if (storedLang() !== code) {
      try {
        var cur = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "{}") || {};
        if (!cur || typeof cur !== "object") cur = {};
        cur.lang = code;
        cur.v = 1;
        localStorage.setItem("kulibert-prefs-v1", JSON.stringify(cur));
      } catch (eStore) {}
      try {
        root.dispatchEvent(new CustomEvent("kulibert-lang", { detail: { lang: code, dir: dirOfLang(code) } }));
      } catch (e2) {}
    }
    var paint = function () { paintBar(); };
    if (root.KulibertI18n && root.KulibertI18n.ready) root.KulibertI18n.ready(code, paint);
    else paint();
  }
  document.documentElement.setAttribute("data-kb-bar", "1");
  ensureI18n(function () { applyBarLang(pageLang()); });
  root.addEventListener("kulibert-lang", function (ev) {
    var lang = ev && ev.detail && ev.detail.lang;
    if (allowRtl && lang && !classic()) {
      var code = langCode(lang) || "en";
      document.documentElement.lang = code === "simple" ? "en" : code;
      document.documentElement.setAttribute("data-kp-lang", code);
      document.documentElement.dir = dirOfLang(code);
    }
    var go = function () { paintBar(); };
    if (root.KulibertI18n && root.KulibertI18n.ready) root.KulibertI18n.ready(lang, go);
    else go();
  });
  root.addEventListener("storage", function (ev) {
    if (!ev || ev.key !== "kulibert-prefs-v1" || root.KulibertPrefs) return;
    var code = storedLang();
    if (code) applyBarLang(code);
  });
  if (framed()) {
    document.documentElement.classList.add("kb-framed");
    ensureCss();
    postUp({ type: "kb-app", app: app, name: name || app, version: version, help: !!helpSel, menu: !!menuSel });
    return;
  }

  function draw() {
    if (document.querySelector(".kb-bar")) return;
    ensureCss();
    var bar = document.createElement("div");
    bar.className = "kb-bar";
    bar.innerHTML = [
      '<button type="button" class="kb-menu" aria-expanded="false">\u2630 Menu</button>',
      '<a class="kb-home" href="https://apps.kulibert.net/" target="_top">\u2302 Home</a>',
      '<span class="kb-plate"></span>',
      '<button type="button" class="kb-settings" hidden aria-label="My settings">\u2699</button>',
      '<span class="kb-alias">Sign in</span>',
      helpSel ? '<button type="button" class="kb-help" aria-label="Help">?</button>' : ''
    ].join("");
    document.body.insertBefore(bar, document.body.firstChild);
    document.body.classList.add("kb-on");
    var plate = bar.querySelector(".kb-plate");
    plate.textContent = plateText();
    var menuBtn = bar.querySelector(".kb-menu");
    if (menuBtn) {
      menuBtn.setAttribute("aria-controls", "kb-drawer");
      menuBtn.addEventListener("click", openMenu);
    }
    var helpBtn = bar.querySelector(".kb-help");
    if (helpBtn) helpBtn.addEventListener("click", openHelp);
    ensureWho(function () { paintAlias(bar.querySelector(".kb-alias")); paintBar(); });
    root.addEventListener("storage", function () { paintAlias(bar.querySelector(".kb-alias")); });
    root.addEventListener("resize", function () { plate.textContent = plateText(); });
    hideDupes();
    if (root.MutationObserver) {
      var watch = new MutationObserver(function () { hideDupes(); });
      watch.observe(document.body, { childList: true, subtree: true });
    }
  }
  if (document.body) draw();
  else document.addEventListener("DOMContentLoaded", draw);
})(typeof window !== "undefined" ? window : globalThis);
