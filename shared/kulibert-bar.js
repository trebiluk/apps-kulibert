/* One Tech Room bar. Inside the Hub it stays quiet and talks to the strip.
   Standalone, it draws Home, the app plate, the alias, and Help.
   A deferred script has no currentScript, and a cross-origin app
   (baboo.kulibert.net) cannot load /shared from its own origin.
   data-kb-modal-open: an app may set this attribute on <html> while its own
   layer is open (a list, a settings sheet, a dialog) and Escape should close
   that layer. Inside the Hub, Escape then stays in the app. With the
   attribute absent, Escape behaves exactly as before. */
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
  var foundMenu = null;
  var lastReportedMenu = null;
  var menuGen = 0;
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
    link.href = asset("/shared/kulibert-bar.css?v=2026-10-05-plate");
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
  function plateFull() {
    return [name || app, version].filter(Boolean).join(" \u00b7 ");
  }
  function plateClipped(plate) {
    if (!plate) return false;
    if (plate.scrollWidth > plate.clientWidth + 1) return true;
    var bar = plate.closest ? plate.closest(".kb-bar") : null;
    if (!bar) return false;
    if (bar.scrollWidth > bar.clientWidth + 1) return true;
    var pr = plate.getBoundingClientRect();
    var br = bar.getBoundingClientRect();
    return pr.right > br.right + 1 || pr.left < br.left - 1;
  }
  function fitPlate() {
    var plate = document.querySelector(".kb-bar .kb-plate");
    if (!plate) return;
    var full = plateFull();
    var short = version || full;
    plate.textContent = full;
    if (short !== full && plateClipped(plate)) plate.textContent = short;
    if (!plate.getAttribute("title")) plate.setAttribute("title", full);
  }
  var whatsAttr = (script && script.getAttribute("data-whats-new")) || "";
  var WHATS = {
    en: "One Menu button in every app. It opens that app's menu.",
    uk: "Одна кнопка «Меню» в кожній програмі. Вона відкриває меню цієї програми.",
    ru: "Одна кнопка «Меню» в каждом приложении. Она открывает меню этого приложения.",
    es: "Un solo botón Menú en cada aplicación. Abre el menú de esa aplicación.",
    ar: "زر قائمة واحد في كل تطبيق. يفتح قائمة ذلك التطبيق.",
    "fa-AF": "در هر برنامه یک دکمهٔ فهرست است. فهرست همان برنامه را باز می‌کند.",
    rw: "Buto imwe ya Menyu muri buri porogaramu. Ifungura menyu y'iyo porogaramu.",
    ti: "ኣብ ነፍሲ ወከፍ መተግበሪ ሓደ መጠወቒ ዝርዝር ኣሎ። ዝርዝር ናይታ መተግበሪ ይኸፍት።"
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
    var back = document.getElementById("kb-drawer-backdrop");
    if (back) back.hidden = !open;
    postUp({ type: "kb-menu-state", open: !!open });
    if (open) {
      paintDrawer();
      var closeBtn = box.querySelector(".kb-drawer-close");
      if (closeBtn) closeBtn.focus();
    } else if (btn) {
      btn.focus();
    }
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
    var closeLabel = box.querySelector(".kb-drawer-close-label");
    var full = [name || app, version].filter(Boolean).join(" \u00b7 ");
    if (title) title.textContent = full || trBar("menu", "Menu");
    if (line) line.textContent = whatsText();
    if (news) news.textContent = trBar("whatsNew", "What\u2019s new");
    if (home) home.textContent = "\u2302 " + trBar("home", "Home");
    if (settings) settings.textContent = trBar("mySettings", "My settings");
    if (help) help.textContent = trBar("help", "Help");
    if (closeLabel) {
      closeLabel.textContent = trBar("close", "Close");
      var lang = "en";
      try { lang = pageLang(); } catch (eCloseLang) {}
      if (lang === "simple") lang = "en";
      closeLabel.lang = lang;
      closeLabel.dir = lang === "ar" || lang === "fa-AF" ? "rtl" : "ltr";
    }
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
      '<button type="button" class="kb-drawer-close"><span aria-hidden="true">\u2715 </span><span class="kb-drawer-close-label">Close</span></button>',
      '<p class="kb-drawer-title"></p>',
      '<p class="kb-drawer-news"><strong class="kb-drawer-kicker">What\u2019s new</strong> <span class="kb-drawer-line"></span></p>',
      '<a class="kb-drawer-home" href="https://apps.kulibert.net/" target="_top">\u2302 Home</a>',
      '<button type="button" class="kb-drawer-settings">My settings</button>',
      '<div class="kb-drawer-langs" hidden></div>',
      '<button type="button" class="kb-drawer-help">Help</button>'
    ].join("");
    var back = document.createElement("div");
    back.id = "kb-drawer-backdrop";
    back.className = "kb-drawer-backdrop";
    back.hidden = true;
    back.addEventListener("click", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      setDrawer(false);
    });
    document.body.appendChild(back);
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
    box.querySelector(".kb-drawer-close").addEventListener("click", function () {
      setDrawer(false);
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
    document.addEventListener("keydown", function (ev) {
      if (!ev || ev.key !== "Escape") return;
      var live = document.getElementById("kb-drawer");
      if (!live || live.hidden) return;
      ev.preventDefault();
      ev.stopPropagation();
      setDrawer(false);
    });
    paintDrawer();
  }
  var dupeLock = false;
  function ensureDupeCss(sels) {
    var ok = [];
    for (var i = 0; i < sels.length; i++) {
      try { document.querySelector(sels[i]); ok.push(sels[i]); } catch (eSel) {}
    }
    if (!ok.length) return;
    var strong = [];
    for (var j = 0; j < ok.length; j++) strong.push("html.kb-framed " + ok[j] + ".kb-menu-dupe");
    var css = ok.join(",") + "{display:none !important}" + strong.join(",") + "{display:none !important}";
    var tag = document.getElementById("kb-dupe-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "kb-dupe-style";
      (document.head || document.documentElement).appendChild(tag);
    }
    if (tag.textContent !== css) tag.textContent = css;
  }
  function hideDupes() {
    if (dupeLock) return;
    dupeLock = true;
    try {
      var sels = dupeSelectors();
      var tag = document.getElementById("kb-dupe-style");
      if (tag) tag.disabled = true;
      var touched = [];
      sels.forEach(function (sel) {
        var nodes = [];
        try { nodes = document.querySelectorAll(sel); } catch (eSel) { return; }
        for (var i = 0; i < nodes.length; i++) {
          var el = nodes[i];
          if (!el || !el.classList) continue;
          if (el.classList.contains("kb-menu") && el.closest && el.closest(".kb-bar")) continue;
          if (el.closest && (el.closest(".kb-drawer") || el.closest("#hub-drawer"))) continue;
          if (el.getAttribute("data-kb-was-shown") !== "1" && shownControl(el)) el.setAttribute("data-kb-was-shown", "1");
          el.classList.add("kb-menu-dupe");
          if (touched.indexOf(el) === -1) touched.push(el);
        }
      });
      if (tag) tag.disabled = false;
      ensureDupeCss(sels);
      if (!menuSel) foundMenu = touched.length === 1 ? touched[0] : null;
      reportFrame();
    } finally {
      dupeLock = false;
    }
  }
  function dupeSelectors() {
    var sels = ["#btn-menu", "#menu-btn", "#btn-crew", "#land-menu", "[data-bits-menu]", "button.tw-edge-pocket-chip", ".tw-edge-pocket-chip", "[aria-controls='hi-drawer']", "#hi-menu", "header.sticky > button[aria-expanded]", "button.menu-btn[aria-controls='baboo-menu']"];
    if (menuSel) sels.push(menuSel);
    return sels;
  }
  function reportFrame() {
    if (!framed()) return;
    var hasMenu = !!(menuSel || (foundMenu && foundMenu.isConnected));
    if (lastReportedMenu === hasMenu) return;
    lastReportedMenu = hasMenu;
    postUp({ type: "kb-app", app: app, name: name || app, version: version, help: !!helpSel, menu: hasMenu });
  }
  function watchDupes() {
    if (!root.MutationObserver || !document.body) return;
    if (document.documentElement.getAttribute("data-kb-dupe-watch")) return;
    document.documentElement.setAttribute("data-kb-dupe-watch", "1");
    new MutationObserver(function () { hideDupes(); }).observe(document.body, { childList: true, subtree: true });
  }
  function menuEl() {
    if (menuSel) {
      try {
        var picked = document.querySelector(menuSel);
        if (picked) return picked;
      } catch (ePick) {}
    }
    if (foundMenu && foundMenu.isConnected) return foundMenu;
    return null;
  }
  function signalMenu(open) {
    var btn = document.querySelector(".kb-bar .kb-menu");
    if (btn) btn.setAttribute("aria-expanded", open ? "true" : "false");
    postUp({ type: "kb-menu-state", open: !!open });
  }
  function readMenuOpen(el, fallback) {
    if (!el) return !!fallback;
    var id = el.getAttribute("aria-controls");
    if (id) {
      var box = document.getElementById(id);
      if (!box || box.hidden) return false;
      var s = getComputedStyle(box);
      if (s.display === "none" || s.visibility === "hidden") return false;
      var r = box.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) return false;
      if (r.right < 0 || r.bottom < 0 || r.left > window.innerWidth || r.top > window.innerHeight) return false;
      return true;
    }
    var state = el.getAttribute("data-state");
    if (state === "closed") return false;
    if (state === "open") return !!(appPanels().length || pointPanel());
    if (el.hasAttribute("aria-expanded")) return el.getAttribute("aria-expanded") === "true";
    return !!fallback;
  }
  function shownControl(el) {
    if (!el || el.hidden) return false;
    if (el.getAttribute("data-kb-was-shown") === "1") return true;
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
    var back = document.getElementById("kb-drawer-backdrop");
    if (back) back.hidden = true;
  }
  function openMenu() {
    var gen = ++menuGen;
    var el = menuEl();
    if (el && typeof el.click === "function") {
      var trust = shownControl(el);
      var before = appPanels();
      var beforePoint = pointPanel();
      var wasOpen = el.getAttribute("data-kb-open") === "1" || el.getAttribute("aria-expanded") === "true";
      var beforeExp = el.getAttribute("aria-expanded");
      el.click();
      if (trust) {
        var afterExp = el.getAttribute("aria-expanded");
        var flipped = afterExp !== beforeExp && (afterExp === "true" || afterExp === "false");
        var isOpen = flipped ? afterExp === "true" : !wasOpen;
        el.setAttribute("data-kb-open", isOpen ? "1" : "0");
        signalMenu(isOpen);
        hideStrayDrawer();
        setTimeout(function () {
          if (gen !== menuGen) return;
          var confirmed = readMenuOpen(el, isOpen);
          el.setAttribute("data-kb-open", confirmed ? "1" : "0");
          signalMenu(confirmed);
        }, 350);
        return;
      }
      setTimeout(function () {
        if (gen !== menuGen) return;
        var now = appPanels();
        var grew = false;
        for (var i = 0; i < now.length; i++) if (before.indexOf(now[i]) === -1) grew = true;
        var nowPoint = pointPanel();
        var opened = grew || (!!nowPoint && nowPoint !== beforePoint);
        var closed = !opened && ((before.length && !now.length) || (!!beforePoint && !nowPoint));
        if (opened || closed) {
          var isOpen = readMenuOpen(el, opened);
          el.setAttribute("data-kb-open", isOpen ? "1" : "0");
          signalMenu(isOpen);
          hideStrayDrawer();
          return;
        }
        if (framed() && (menuSel || foundMenu)) {
          signalMenu(readMenuOpen(el, false));
          hideStrayDrawer();
          return;
        }
        ensureDrawer();
        var box = document.getElementById("kb-drawer");
        setDrawer(!box || box.hidden);
      }, 350);
      return;
    }
    if (framed() && menuSel) {
      signalMenu(false);
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
    fitPlate();
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
    s.src = asset("/shared/kulibert-i18n.js?v=2026-10-12-one-menu");
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
    function armFrameDupes() {
      hideDupes();
      watchDupes();
    }
    if (document.body) armFrameDupes();
    else document.addEventListener("DOMContentLoaded", armFrameDupes);
    root.addEventListener("keydown", function (ev) {
      if (!ev || ev.key !== "Escape" || ev.repeat) return;
      var tag = document.querySelector("script[data-app]");
      if (tag && tag.getAttribute("data-esc") === "app") return;
      var el = menuEl();
      var was = !!(el && (readMenuOpen(el, false) || el.getAttribute("data-kb-open") === "1"));
      if (!was) {
        if (document.documentElement.hasAttribute("data-kb-modal-open")) return;
        var tgt = ev.target;
        var typing = tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.tagName === "SELECT" || tgt.isContentEditable);
        if (typing) return;
        postUp({ type: "kb-esc" });
        return;
      }
      setTimeout(function () {
        var still = el && el.isConnected && readMenuOpen(el, false);
        if (!still) {
          menuGen++;
          if (el) el.setAttribute("data-kb-open", "0");
          signalMenu(false);
          hideStrayDrawer();
          return;
        }
        openMenu();
      }, 80);
    }, true);
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
    fitPlate();
    var menuBtn = bar.querySelector(".kb-menu");
    if (menuBtn) {
      menuBtn.setAttribute("aria-controls", "kb-drawer");
      menuBtn.addEventListener("click", openMenu);
    }
    var helpBtn = bar.querySelector(".kb-help");
    if (helpBtn) helpBtn.addEventListener("click", openHelp);
    ensureWho(function () { paintAlias(bar.querySelector(".kb-alias")); paintBar(); });
    root.addEventListener("storage", function () { paintAlias(bar.querySelector(".kb-alias")); });
    root.addEventListener("resize", function () { fitPlate(); });
    if (document.fonts && document.fonts.addEventListener) {
      document.fonts.addEventListener("loadingdone", function () { fitPlate(); });
    }
    hideDupes();
    watchDupes();
  }
  if (document.body) draw();
  else document.addEventListener("DOMContentLoaded", draw);
})(typeof window !== "undefined" ? window : globalThis);
