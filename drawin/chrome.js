/* Drawin' DS 0.3.2 chrome. Left hamburger, left drawer, What's new, Hub language. */
(function () {
  var NEWS = "DS 0.3.2: Vector and Paint open from the door. Tools are big enough to tap.";
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

  function tx(s) {
    try { if (window.DrawinTx) return window.DrawinTx(s); } catch (e) {}
    return s;
  }
  function langNow() {
    try { if (window.KulibertPrefs && KulibertPrefs.lang) return KulibertPrefs.lang; } catch (e) {}
    return document.documentElement.getAttribute("data-kp-lang") || "en";
  }

  var css = document.createElement("style");
  css.textContent = [
    "#ds-nav{position:fixed;z-index:70;top:8px;left:8px;right:auto;min-width:44px;min-height:44px;width:44px;height:44px;padding:0;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:700 1.25rem/1 Outfit,system-ui,sans-serif;cursor:pointer}",
    "html[dir=rtl] #ds-nav{left:8px;right:auto}",
    "html[dir=rtl] #ds-drawer{left:0;right:auto;direction:ltr}",
    "html[dir=rtl] #ds-drawer button,html[dir=rtl] #ds-drawer a{direction:ltr;text-align:start}",
    "#ds-drawer{position:fixed;z-index:69;top:0;left:0;bottom:0;right:auto;width:min(300px,88vw);transform:translateX(-105%);background:#050814;color:#e8f7ff;border-right:1px solid #24506d;padding:60px 12px 16px;overflow:auto;direction:ltr;box-shadow:8px 0 24px rgba(0,0,0,.35)}",
    "#ds-drawer.is-open{transform:none}",
    "#ds-scrim{position:fixed;inset:0;z-index:68;background:rgba(0,0,0,.35)}",
    "#ds-scrim[hidden],#ds-lang[hidden]{display:none !important}",
    "#ds-drawer button,#ds-drawer a{display:flex;align-items:center;gap:.55rem;width:100%;min-height:44px;margin:0 0 6px;padding:0 12px;border-radius:12px;border:1px solid #24506d;background:#0b152c;color:#e8f7ff;font:650 1rem/1.2 Outfit,system-ui,sans-serif;text-decoration:none;text-align:start;cursor:pointer}",
    "#ds-drawer button[aria-pressed=true]{outline:2px solid #22d3ee}",
    "#ds-whatsnew{margin:0;padding:.55rem .8rem .55rem 60px;background:#123;color:#e8f7ff;font:650 .95rem/1.35 Outfit,system-ui,sans-serif}",
    ".ds-gear { display: inline-flex; align-items: center; gap: .4rem; min-height: 44px; min-width: 44px; padding: 0 .9rem; border-radius: 999px; border: 1px solid #24506d; background: #0b152c; color: #e8f7ff; font: 700 .95rem/1 Outfit, system-ui, sans-serif; cursor: pointer; }"
  ].join("");
  document.head.appendChild(css);

  var nav = document.createElement("button");
  nav.type = "button";
  nav.id = "ds-nav";
  nav.setAttribute("aria-expanded", "false");
  nav.setAttribute("aria-controls", "ds-drawer");
  nav.setAttribute("aria-label", "Menu");
  nav.textContent = "\u2630";

  var scrim = document.createElement("button");
  scrim.type = "button";
  scrim.id = "ds-scrim";
  scrim.hidden = true;
  scrim.setAttribute("aria-label", "Close menu");

  var drawer = document.createElement("nav");
  drawer.id = "ds-drawer";
  drawer.setAttribute("aria-label", "Drawin'");
  drawer.innerHTML = [
    '<a id="ds-home" href="/"><span aria-hidden="true">\u2302</span><span>' + tx("Home") + "</span></a>",
    '<button type="button" id="ds-news-btn"><span aria-hidden="true">\u2733</span><span>What\'s new</span></button>',
    '<button type="button" id="ds-set-btn" aria-expanded="false"><span aria-hidden="true">\u2699</span><span>My settings</span></button>',
    '<div id="ds-lang" hidden></div>',
    '<button type="button" id="ds-help-btn"><span aria-hidden="true">?</span><span>' + tx("Help") + "</span></button>"
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

  function paintLang() {
    var cur = langNow();
    langBox.querySelectorAll("button").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-lang") === cur ? "true" : "false");
    });
  }
  function setOpen(open) {
    drawer.classList.toggle("is-open", open);
    nav.setAttribute("aria-expanded", open ? "true" : "false");
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
      plate.textContent = NEWS;
    }
    setOpen(false);
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
    paintLang();
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
    if (!data || data.type !== "kb-settings") return;
    setOpen(true);
    langBox.hidden = false;
    drawer.querySelector("#ds-set-btn").setAttribute("aria-expanded", "true");
    paintLang();
  });
  window.addEventListener("kulibert-lang", paintLang);

  document.body.appendChild(scrim);
  document.body.appendChild(drawer);
  document.body.appendChild(nav);

  if (!document.getElementById("ds-news") && !document.getElementById("ds-whatsnew")) {
    var plate = document.createElement("p");
    plate.id = "ds-whatsnew";
    plate.setAttribute("role", "status");
    plate.textContent = NEWS;
    document.body.insertBefore(plate, document.body.firstChild);
  } else {
    var existing = document.getElementById("ds-news");
    if (existing) existing.textContent = NEWS;
  }

  var gear = document.getElementById("ds-settings");
  if (gear) {
    gear.addEventListener("click", function () {
      setOpen(true);
      langBox.hidden = false;
      drawer.querySelector("#ds-set-btn").setAttribute("aria-expanded", "true");
      paintLang();
    });
  }
  paintLang();
})();
