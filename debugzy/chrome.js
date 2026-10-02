/* Debugzy v0.1.3 chrome. Hub Menu opens this left drawer. */
(function () {
  var NEWS = "Fixed the blank screen in Arabic and Dari on phones.";
  var LANGS = [
    ["en", "English"],
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
      if (window.DebugzyTx) return DebugzyTx(en);
    } catch (e) {}
    return en;
  }
  function langNow() {
    try {
      if (window.KulibertPrefs && KulibertPrefs.lang) return KulibertPrefs.lang;
    } catch (e) {}
    return document.documentElement.getAttribute("data-kp-lang") || "en";
  }

  var css = document.createElement("style");
  css.textContent = [
    "html[dir=rtl] .kb-bar{direction:ltr}",
    ".kb-bar .kb-menu{order:-1}",
    "body{padding-top:4.2rem}",
    "#dz-nav{position:fixed;z-index:70;top:8px;left:8px;right:auto;min-width:44px;min-height:44px;padding:0 .85rem;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:700 1rem/1 Outfit,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:.4rem}",
    "#dz-nav.dz-off{position:fixed;left:8px;top:8px;width:44px;height:44px;padding:0;margin:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}",
    "html[dir=rtl] #dz-nav{left:8px;right:auto}",
    "html[dir=rtl] #dz-drawer{left:0;right:auto}",
    "#dz-drawer{position:fixed;z-index:69;top:0;left:0;bottom:0;right:auto;width:min(22rem,88vw);transform:translateX(-105%);background:#050814;color:#e8f7ff;border-right:1px solid #24506d;padding:64px 14px 16px;overflow:auto;box-shadow:8px 0 24px rgba(0,0,0,.35)}",
    "#dz-drawer.is-open{transform:none}",
    "#dz-scrim{position:fixed;inset:0;z-index:68;border:0;background:rgba(0,0,0,.35)}",
    "#dz-scrim[hidden]{display:none !important}",
    "#dz-drawer h2{margin:1rem 0 .35rem;font-size:1rem}",
    "#dz-drawer p{margin:.25rem 0 0;line-height:1.45}",
    "#dz-drawer .dz-help{margin:.35rem 0 0;padding-inline-start:1.15rem;line-height:1.45}",
    "#dz-drawer .dz-help li{margin:.2rem 0}",
    "#dz-langs{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:.45rem}",
    "#dz-langs button,#dz-drawer a.dz-room{display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 .85rem;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 1rem/1.2 Outfit,'Noto Sans Arabic','Noto Sans Ethiopic',system-ui,sans-serif;text-decoration:none;cursor:pointer}",
    "#dz-langs button[aria-pressed=true]{background:#22d3ee;color:#041018;border-color:#22d3ee}",
    "#dz-drawer a.dz-room{display:flex;width:100%;margin-top:.8rem}",
    ".dz-chip{display:inline-flex;margin-top:.15rem}",
    "html[dir=rtl] .step,html[dir=rtl] .choice{text-align:start}",
    ".steps,.choices{flex-direction:column}"
  ].join("");
  document.head.appendChild(css);

  var nav = document.createElement("button");
  nav.type = "button";
  nav.id = "dz-nav";
  nav.setAttribute("aria-expanded", "false");
  nav.setAttribute("aria-controls", "dz-drawer");
  nav.innerHTML = '<span aria-hidden="true">\u2630</span> <span class="dz-menu-word"></span>';

  var scrim = document.createElement("button");
  scrim.type = "button";
  scrim.id = "dz-scrim";
  scrim.hidden = true;

  var drawer = document.createElement("nav");
  drawer.id = "dz-drawer";
  drawer.setAttribute("aria-label", "Debugzy");
  drawer.innerHTML = [
    '<p class="dz-chip">v0.1.3</p>',
    '<h2 data-k="whats"></h2>',
    '<p id="dz-news"></p>',
    '<h2 data-k="help"></h2>',
    '<p data-k="helpTitle"></p>',
    '<ol class="dz-help">',
    "<li data-k=\"help1\"></li>",
    "<li data-k=\"help2\"></li>",
    "<li data-k=\"help3\"></li>",
    "<li data-k=\"help4\"></li>",
    "<li data-k=\"help5\"></li>",
    "<li data-k=\"help6\"></li>",
    "<li data-k=\"help7\"></li>",
    "<li data-k=\"help8\"></li>",
    "</ol>",
    '<h2 data-k="settings"></h2>',
    '<p data-k="language"></p>',
    '<div id="dz-langs"></div>',
    '<a class="dz-room" href="/" data-k="room"></a>'
  ].join("");

  var HELP = {
    whats: "What's new",
    help: "Help",
    helpTitle: "Help · Easy steps",
    help1: "Read the whole sequence once.",
    help2: "Point to the step you think is wrong.",
    help3: "Say why in one short sentence.",
    help4: "Change one thing only.",
    help5: "Press Try again.",
    help6: "Watch the result.",
    help7: "Pass means it works. Fail means name why, then go back.",
    help8: "Write your alias on the ticket if you keep paper proof.",
    settings: "Settings",
    language: "Language",
    room: "Tech Room"
  };

  var langBox = drawer.querySelector("#dz-langs");
  LANGS.forEach(function (row) {
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("data-lang", row[0]);
    b.textContent = row[1];
    langBox.appendChild(b);
  });

  function paintLang() {
    var cur = langNow();
    if (cur === "simple") cur = "en";
    langBox.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === cur ? "true" : "false");
    });
  }
  function paint() {
    var menuWord = tx("Menu");
    nav.querySelector(".dz-menu-word").textContent = menuWord;
    nav.setAttribute("aria-label", menuWord);
    scrim.setAttribute("aria-label", tx("Close menu"));
    drawer.querySelector("#dz-news").textContent = tx(NEWS);
    Object.keys(HELP).forEach(function (key) {
      var el = drawer.querySelector('[data-k="' + key + '"]');
      if (el) el.textContent = tx(HELP[key]);
    });
    var barMenu = document.querySelector(".kb-bar .kb-menu");
    if (barMenu) {
      barMenu.textContent = "\u2630 " + menuWord;
      nav.classList.add("dz-off");
    } else {
      nav.classList.remove("dz-off");
    }
    paintLang();
  }
  function setOpen(open) {
    drawer.classList.toggle("is-open", open);
    nav.setAttribute("aria-expanded", open ? "true" : "false");
    var barMenu = document.querySelector(".kb-bar .kb-menu");
    if (barMenu) barMenu.setAttribute("aria-expanded", open ? "true" : "false");
    scrim.hidden = !open;
  }
  nav.addEventListener("click", function () {
    setOpen(!drawer.classList.contains("is-open"));
  });
  scrim.addEventListener("click", function () { setOpen(false); });
  langBox.addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-lang]");
    if (!b) return;
    var code = b.getAttribute("data-lang");
    try {
      if (window.KulibertPrefs && KulibertPrefs.acceptLang) KulibertPrefs.acceptLang(code);
    } catch (e) {}
    paint();
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "kp-lang", lang: code }, "*");
      }
    } catch (e2) {}
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") setOpen(false);
  });
  window.addEventListener("kulibert-lang", paint);

  document.body.appendChild(scrim);
  document.body.appendChild(drawer);
  document.body.appendChild(nav);
  paint();
  if (window.KulibertI18n && KulibertI18n.ready) KulibertI18n.ready(null, paint);
})();
