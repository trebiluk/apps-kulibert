/* Hub Menu snippet. Copy with hub-menu.css and the markup.
   KulibertBar exports setHelp and toast only, so the rows are a local list
   that matches the Hub menu: Close, What's new, Home, My settings, Help. */
(function (root) {
  var COPY = {
    en: { hubMenu: "Hub Menu", close: "Close", whatsNew: "What's new", home: "Home", mySettings: "My settings", help: "Help" },
    uk: { hubMenu: "Меню Хаба", close: "Закрити", whatsNew: "Що нового", home: "Головна", mySettings: "Мої налаштування", help: "Допомога" },
    ru: { hubMenu: "Меню хаба", close: "Закрыть", whatsNew: "Что нового", home: "Главная", mySettings: "Мои настройки", help: "Помощь" },
    es: { hubMenu: "Menú Hub", close: "Cerrar", whatsNew: "Novedades", home: "Inicio", mySettings: "Mis ajustes", help: "Ayuda" },
    ar: { hubMenu: "قائمة المحور", close: "إغلاق", whatsNew: "ما الجديد", home: "الرئيسية", mySettings: "إعداداتي", help: "مساعدة" },
    "fa-AF": { hubMenu: "فهرست مرکز", close: "بستن", whatsNew: "تازه‌ها", home: "خانه", mySettings: "تنظیمات من", help: "کمک" },
    rw: { hubMenu: "Menyu y'urubuga", close: "Funga", whatsNew: "Ibishya", home: "Ahabanza", mySettings: "Igenamiterere ryanjye", help: "Ubufasha" },
    ti: { hubMenu: "ዝርዝር ማእኸል", close: "ዕጸው", whatsNew: "እንታይ ሓድሽ ኣሎ", home: "መበገሲ", mySettings: "ናተይ ቅጥዕታት", help: "ሓገዝ" }
  };
  var LANGS = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
  var LANG_NAMES = { en: "English", uk: "Українська", ru: "Русский", es: "Español", ar: "العربية", "fa-AF": "دری", rw: "Ikinyarwanda", ti: "ትግርኛ" };

  function norm(lang) {
    var s = String(lang || "");
    if (s === "fa") s = "fa-AF";
    if (s === "simple") s = "en";
    return COPY[s] ? s : "";
  }

  function currentLang(ev) {
    var fromEv = ev && ev.detail ? norm(ev.detail.lang) : "";
    if (fromEv) return fromEv;
    var html = norm(document.documentElement.getAttribute("lang"));
    if (html) return html;
    try {
      if (root.KulibertPrefs && root.KulibertPrefs.lang) {
        var pref = norm(root.KulibertPrefs.lang);
        if (pref) return pref;
      }
    } catch (e) {}
    try {
      var raw = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "null");
      var stored = norm(raw && raw.lang);
      if (stored) return stored;
    } catch (e2) {}
    return "en";
  }

  function packFor(lang) {
    return COPY[lang] || COPY.en;
  }

  function newsLine() {
    var nodes = document.querySelectorAll("[data-bb='whatsNewLine']");
    for (var i = 0; i < nodes.length; i++) {
      var text = (nodes[i].textContent || "").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    var tag = document.querySelector("script[data-whats-new]");
    return (tag && tag.getAttribute("data-whats-new")) || "";
  }

  function panelOf(row) {
    var id = row.getAttribute("aria-controls");
    return id ? document.getElementById(id) : null;
  }

  function paint(row, ev) {
    var panel = panelOf(row);
    if (!panel) return;
    var lang = currentLang(ev);
    var pack = packFor(lang);
    var rtl = lang === "ar" || lang === "fa-AF";
    var langAttr = lang === "fa-AF" ? "fa" : lang;
    row.lang = langAttr;
    row.dir = rtl ? "rtl" : "ltr";
    panel.lang = langAttr;
    panel.dir = rtl ? "rtl" : "ltr";
    var name = row.querySelector(".hub-menu-row-label");
    if (name) name.textContent = pack.hubMenu;
    row.setAttribute("aria-label", pack.hubMenu);
    var labels = panel.querySelectorAll("[data-hub-key]");
    for (var i = 0; i < labels.length; i++) {
      var key = labels[i].getAttribute("data-hub-key");
      if (pack[key]) labels[i].textContent = pack[key];
    }
    var line = panel.querySelector(".hub-menu-panel-line");
    if (line) line.textContent = newsLine();
    var settings = panel.querySelector(".hub-menu-panel-settings");
    if (settings) settings.setAttribute("aria-label", pack.mySettings);
    var langs = panel.querySelectorAll(".hub-menu-panel-lang");
    for (var j = 0; j < langs.length; j++) {
      langs[j].setAttribute("aria-pressed", langs[j].getAttribute("data-lang") === lang ? "true" : "false");
    }
  }

  function setOpen(row, open) {
    var panel = panelOf(row);
    row.setAttribute("aria-expanded", open ? "true" : "false");
    if (!panel) return;
    panel.hidden = !open;
    if (!open) {
      var langs = panel.querySelector(".hub-menu-panel-langs");
      var settings = panel.querySelector(".hub-menu-panel-settings");
      if (langs) langs.hidden = true;
      if (settings) settings.setAttribute("aria-expanded", "false");
    }
  }

  function hostOpener(row) {
    var nodes = document.querySelectorAll("[aria-controls]");
    var found = null;
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el === row) continue;
      var id = el.getAttribute("aria-controls");
      if (!id) continue;
      var box = document.getElementById(id);
      if (box && box.contains(row)) found = el;
    }
    return found;
  }

  function closeHost(row) {
    setOpen(row, false);
    var opener = hostOpener(row);
    var sheet = row.closest(".sheet");
    var open = !!(opener && opener.getAttribute("aria-expanded") === "true");
    if (!open && sheet && !sheet.hidden) open = true;
    if (open && opener && typeof opener.click === "function") opener.click();
    else if (sheet) sheet.hidden = true;
    if (opener && typeof opener.focus === "function") opener.focus();
  }

  function onHelp(panel) {
    var tag = document.querySelector("script[data-help]");
    var sel = tag && tag.getAttribute("data-help");
    if (sel) {
      try {
        var el = document.querySelector(sel);
        if (el && typeof el.click === "function") {
          el.click();
          return;
        }
      } catch (e) {}
    }
    try { root.postMessage({ type: "kb-help" }, root.location.origin); } catch (e2) {}
    var line = panel.querySelector(".hub-menu-panel-line");
    if (!line) return;
    if (!line.hasAttribute("tabindex")) line.setAttribute("tabindex", "-1");
    line.focus();
  }

  function ensureLangs(box) {
    if (!box || box.getAttribute("data-hub-langs") === "1") return;
    box.setAttribute("data-hub-langs", "1");
    LANGS.forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "hub-menu-panel-lang";
      b.setAttribute("data-lang", code);
      b.textContent = LANG_NAMES[code];
      b.setAttribute("lang", code === "fa-AF" ? "fa" : code);
      if (code === "ar" || code === "fa-AF") b.dir = "rtl";
      b.addEventListener("click", function () {
        if (root.KulibertPrefs && typeof root.KulibertPrefs.acceptLang === "function") {
          root.KulibertPrefs.acceptLang(code);
          return;
        }
        try {
          var cur = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "{}");
          if (!cur || typeof cur !== "object") cur = {};
          cur.lang = code;
          cur.v = 1;
          localStorage.setItem("kulibert-prefs-v1", JSON.stringify(cur));
        } catch (e) {}
        try {
          root.dispatchEvent(new CustomEvent("kulibert-lang", {
            detail: { lang: code, dir: code === "ar" || code === "fa-AF" ? "rtl" : "ltr" }
          }));
        } catch (e2) {}
      });
      box.appendChild(b);
    });
  }

  function keepKey(ev) {
    if (ev.key === "Enter" || ev.key === " " || ev.code === "Space") ev.stopPropagation();
  }

  function bind(row) {
    if (row.getAttribute("data-hub-menu-ready") === "1") return;
    var panel = panelOf(row);
    if (!panel || !panel.classList.contains("hub-menu-panel")) return;
    row.setAttribute("data-hub-menu-ready", "1");
    if (!row.hasAttribute("aria-expanded")) row.setAttribute("aria-expanded", "false");
    if (row.getAttribute("aria-expanded") !== "true") panel.hidden = true;
    ensureLangs(panel.querySelector(".hub-menu-panel-langs"));
    paint(row);
    row.addEventListener("click", function () {
      setOpen(row, row.getAttribute("aria-expanded") !== "true");
    });
    row.addEventListener("keydown", function (ev) {
      keepKey(ev);
      if (ev.key === "Escape" && row.getAttribute("aria-expanded") === "true") {
        ev.preventDefault();
        ev.stopPropagation();
        setOpen(row, false);
      }
      if (ev.key === "ArrowDown" && row.getAttribute("aria-expanded") === "true") {
        var first = panel.querySelector("button, a");
        if (first) {
          ev.preventDefault();
          first.focus();
        }
      }
    });
    panel.addEventListener("keydown", function (ev) {
      keepKey(ev);
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation();
      setOpen(row, false);
      row.focus();
    });
    var closeBtn = panel.querySelector(".hub-menu-panel-close");
    if (closeBtn) closeBtn.addEventListener("click", function () { closeHost(row); });
    var settings = panel.querySelector(".hub-menu-panel-settings");
    var langs = panel.querySelector(".hub-menu-panel-langs");
    if (settings && langs) {
      settings.addEventListener("click", function () {
        var open = langs.hidden;
        langs.hidden = !open;
        settings.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) {
          var first = langs.querySelector("button");
          if (first) first.focus();
        }
      });
    }
    var help = panel.querySelector(".hub-menu-panel-help");
    if (help) help.addEventListener("click", function () { onHelp(panel); });
  }

  function start() {
    var rows = document.querySelectorAll(".hub-menu-row");
    for (var i = 0; i < rows.length; i++) bind(rows[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();

  root.addEventListener("kulibert-lang", function (ev) {
    var rows = document.querySelectorAll(".hub-menu-row");
    for (var i = 0; i < rows.length; i++) paint(rows[i], ev);
    setTimeout(function () {
      var again = document.querySelectorAll(".hub-menu-row");
      for (var j = 0; j < again.length; j++) paint(again[j], ev);
    }, 0);
  });
})(typeof window !== "undefined" ? window : globalThis);
