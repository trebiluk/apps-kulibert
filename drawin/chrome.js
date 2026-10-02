/* Drawin' DS 0.3.3 chrome. One Menu, left drawer, Hub language. */
(function () {
  var NEWS = "One Menu at the top left, Home is easy to reach, and Drawin' is in your language.";
  var LANGS = [
    ["en", "English"],
    ["simple", "Simple English"],
    ["uk", "Українська"],
    ["ru", "Русский"],
    ["es", "Español"],
    ["ar", "العربية"],
    ["fa-AF", "دری"],
    ["rw", "Kinyarwanda"],
    ["ti", "ትግርኛ"]
  ];

  function tx(en) {
    try {
      if (window.DrawinTx) {
        var hit = window.DrawinTx(en);
        if (hit) return hit;
      }
    } catch (e) {}
    return en;
  }
  function langNow() {
    try { if (window.KulibertPrefs && KulibertPrefs.lang) return KulibertPrefs.lang; } catch (e) {}
    return document.documentElement.getAttribute("data-kp-lang") || "en";
  }

  var css = document.createElement("style");
  css.textContent = [
    ".kb-bar{direction:ltr}",
    ".kb-bar .kb-menu{order:-1;flex:0 0 auto}",
    ".kb-bar .kb-home{flex:0 0 auto;position:relative;z-index:1}",
    "#ds-nav{position:fixed;z-index:70;top:8px;left:8px;right:auto;min-width:44px;min-height:44px;height:44px;padding:0 .85rem;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:700 1rem/1 Outfit,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem}",
    "#ds-nav.ds-off{display:none !important}",
    "html[dir=rtl] #ds-nav{left:8px;right:auto}",
    "html[dir=rtl] #ds-drawer{left:0;right:auto;direction:ltr}",
    "html[dir=rtl] #ds-drawer button,html[dir=rtl] #ds-drawer a{direction:ltr;text-align:start}",
    "#ds-drawer{position:fixed;z-index:69;top:0;left:0;bottom:0;right:auto;width:min(300px,88vw);transform:translateX(-105%);background:#050814;color:#e8f7ff;border-right:1px solid #24506d;padding:60px 12px 16px;overflow:auto;direction:ltr;box-shadow:8px 0 24px rgba(0,0,0,.35)}",
    "#ds-drawer.is-open{transform:none}",
    "#ds-scrim{position:fixed;inset:0;z-index:68;background:rgba(0,0,0,.35)}",
    "#ds-scrim[hidden],#ds-lang[hidden]{display:none !important}",
    "#ds-drawer button,#ds-drawer a{display:flex;align-items:center;gap:.55rem;width:100%;min-height:44px;margin:0 0 6px;padding:0 12px;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 1rem/1.2 Outfit,system-ui,sans-serif;text-decoration:none;text-align:start;cursor:pointer}",
    "#ds-drawer button[aria-pressed=true]{outline:2px solid #22d3ee}",
    "#ds-whatsnew{margin:0;padding:.55rem .8rem;background:#123;color:#e8f7ff;font:650 .95rem/1.35 Outfit,system-ui,sans-serif}",
    ".ds-gear{display:inline-flex;align-items:center;gap:.4rem;min-height:44px;min-width:44px;padding:0 .9rem;border-radius:999px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:700 .95rem/1 Outfit,system-ui,sans-serif;cursor:pointer}"
  ].join("");
  document.head.appendChild(css);

  var nav = document.createElement("button");
  nav.type = "button";
  nav.id = "ds-nav";
  nav.setAttribute("aria-expanded", "false");
  nav.setAttribute("aria-controls", "ds-drawer");
  nav.innerHTML = '<span aria-hidden="true">\u2630</span><span class="ds-menu-word"></span>';

  var scrim = document.createElement("button");
  scrim.type = "button";
  scrim.id = "ds-scrim";
  scrim.hidden = true;

  var drawer = document.createElement("nav");
  drawer.id = "ds-drawer";
  drawer.setAttribute("aria-label", "Drawin'");
  drawer.innerHTML = [
    '<a id="ds-home" href="/"><span aria-hidden="true">\u2302</span><span class="ds-lab"></span></a>',
    '<button type="button" id="ds-news-btn"><span aria-hidden="true">\u2733</span><span class="ds-lab"></span></button>',
    '<button type="button" id="ds-set-btn" aria-expanded="false"><span aria-hidden="true">\u2699</span><span class="ds-lab"></span></button>',
    '<div id="ds-lang" hidden></div>',
    '<button type="button" id="ds-help-btn"><span aria-hidden="true">?</span><span class="ds-lab"></span></button>'
  ].join("");

  var langBox = drawer.querySelector("#ds-lang");
  LANGS.forEach(function (row) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-lang", row[0]);
    b.setAttribute("lang", row[0] === "simple" ? "en" : row[0]);
    b.textContent = row[1];
    langBox.appendChild(b);
  });

  function setLab(sel, en) {
    var el = drawer.querySelector(sel);
    if (el) el.textContent = tx(en);
  }
  function paintLang() {
    var cur = langNow();
    langBox.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === cur ? "true" : "false");
    });
  }
  function paintChrome() {
    var menuWord = tx("Menu");
    nav.querySelector(".ds-menu-word").textContent = menuWord;
    nav.setAttribute("aria-label", menuWord);
    scrim.setAttribute("aria-label", tx("Close menu"));
    setLab("#ds-home .ds-lab", "Home");
    setLab("#ds-news-btn .ds-lab", "What's new");
    setLab("#ds-set-btn .ds-lab", "My settings");
    setLab("#ds-help-btn .ds-lab", "Help");
    var gear = document.querySelector("#ds-settings .ds-lab");
    if (gear) gear.textContent = tx("My settings");
    var plate = document.getElementById("ds-whatsnew") || document.getElementById("ds-news");
    if (plate) plate.textContent = tx(NEWS);
    var barMenu = document.querySelector(".kb-bar .kb-menu");
    var mark = nav.querySelector("span[aria-hidden]");
    if (barMenu) {
      barMenu.textContent = "\u2630 " + menuWord;
      if (mark) mark.textContent = "";
      nav.classList.add("ds-off");
      nav.setAttribute("aria-hidden", "true");
      nav.tabIndex = -1;
    } else {
      if (mark) mark.textContent = "\u2630";
      nav.classList.remove("ds-off");
      nav.removeAttribute("aria-hidden");
      nav.tabIndex = 0;
    }
    paintLang();
  }
  function setOpen(open) {
    drawer.classList.toggle("is-open", open);
    nav.setAttribute("aria-expanded", open ? "true" : "false");
    var barMenu = document.querySelector(".kb-bar .kb-menu");
    if (barMenu) barMenu.setAttribute("aria-expanded", open ? "true" : "false");
    scrim.hidden = !open;
    if (open) {
      var first = drawer.querySelector("a,button");
      if (first) first.focus();
    }
  }
  function showNews() {
    var plate = document.getElementById("ds-whatsnew") || document.getElementById("ds-news");
    if (plate) {
      plate.hidden = false;
      plate.textContent = tx(NEWS);
    }
    setOpen(false);
  }
  function openSettings() {
    setOpen(true);
    langBox.hidden = false;
    drawer.querySelector("#ds-set-btn").setAttribute("aria-expanded", "true");
    paintLang();
  }
  nav.addEventListener("click", function () { setOpen(!drawer.classList.contains("is-open")); });
  scrim.addEventListener("click", function () { setOpen(false); });
  drawer.querySelector("#ds-news-btn").addEventListener("click", showNews);
  drawer.querySelector("#ds-set-btn").addEventListener("click", function () {
    var open = langBox.hidden;
    langBox.hidden = !open;
    drawer.querySelector("#ds-set-btn").setAttribute("aria-expanded", open ? "true" : "false");
    paintLang();
  });
  drawer.querySelector("#ds-help-btn").addEventListener("click", function () {
    setOpen(false);
    var help = document.getElementById("ds-help");
    if (help) help.click();
    else showNews();
  });
  langBox.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-lang]");
    if (!b) return;
    var code = b.getAttribute("data-lang");
    try {
      if (window.KulibertPrefs && KulibertPrefs.acceptLang) KulibertPrefs.acceptLang(code);
    } catch (e) {}
    paintChrome();
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "kp-lang", lang: code }, location.origin);
      }
    } catch (e2) {}
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") setOpen(false);
  });
  window.addEventListener("message", function (ev) {
    var data = ev.data;
    if (!data) return;
    if (data.type === "kb-settings") openSettings();
  });
  window.addEventListener("kulibert-lang", paintChrome);

  document.body.appendChild(scrim);
  document.body.appendChild(drawer);
  document.body.appendChild(nav);

  if (!document.getElementById("ds-news") && !document.getElementById("ds-whatsnew")) {
    var plate = document.createElement("p");
    plate.id = "ds-whatsnew";
    plate.setAttribute("role", "status");
    document.body.insertBefore(plate, document.body.firstChild);
  }

  var gear = document.getElementById("ds-settings");
  if (gear) gear.addEventListener("click", openSettings);

  paintChrome();
  if (window.KulibertI18n && KulibertI18n.ready) KulibertI18n.ready(null, paintChrome);
})();
