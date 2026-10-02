/* Shared Tech Room words. English is always the fallback. Never a blank, never a raw key. */
(function (root) {
  var EN = {
  "home": "Home",
  "signIn": "Sign in",
  "settings": "Settings",
  "play": "Play",
  "pause": "Pause",
  "resume": "Resume",
  "retry": "Retry",
  "exit": "Exit",
  "sound": "Sound",
  "music": "Music",
  "volume": "Volume",
  "next": "Next",
  "back": "Back",
  "help": "Help",
  "whatsNew": "What's new",
  "scores": "Scores",
  "levels": "Levels",
  "language": "Language",
  "mySettings": "My settings",
  "menu": "Menu",
  "close": "Close",
  "readAloud": "Read aloud",
  "noVoice": "No voice yet. Read the words.",
  "appsFollow": "Your apps will use this language."
};
  var FILES = { en: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  var packs = { en: EN };
  var pending = {};
  function fileFor(lang) {
    if (!lang || lang === "simple" || !FILES[lang]) return "en";
    return lang;
  }
  function current() {
    try {
      if (root.KulibertPrefs && typeof root.KulibertPrefs.lang === "string" && root.KulibertPrefs.lang) return root.KulibertPrefs.lang;
    } catch (e) {}
    var attr = document.documentElement.getAttribute("data-kp-lang") || "";
    if (attr === "simple" || FILES[attr]) return attr;
    return "en";
  }
  function t(key) {
    var k = String(key || "");
    if (!k) return "";
    var file = fileFor(current());
    var pack = packs[file];
    if (pack && pack[k]) return pack[k];
    if (EN[k]) return EN[k];
    return "";
  }
  function paint() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var v = t(nodes[i].getAttribute("data-i18n"));
      if (v) nodes[i].textContent = v;
    }
    var labels = document.querySelectorAll("[data-i18n-label]");
    for (var j = 0; j < labels.length; j++) {
      var label = t(labels[j].getAttribute("data-i18n-label"));
      if (label) labels[j].setAttribute("aria-label", label);
    }
  }
  function finish(name) {
    var waiters = pending[name] || [];
    delete pending[name];
    waiters.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function load(name, cb) {
    if (packs[name]) { if (cb) cb(); return; }
    if (pending[name]) { pending[name].push(cb || function () {}); return; }
    pending[name] = cb ? [cb] : [];
    var cached = "";
    try { cached = sessionStorage.getItem("kulibert-i18n-v1:" + name) || ""; } catch (e) {}
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") packs[name] = parsed;
      } catch (e2) {}
      finish(name);
      return;
    }
    fetch("/shared/i18n/" + name + ".json", { credentials: "omit" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (data) {
      if (data && typeof data === "object") {
        packs[name] = data;
        try { sessionStorage.setItem("kulibert-i18n-v1:" + name, JSON.stringify(data)); } catch (e3) {}
      }
    }).catch(function () {}).then(function () { finish(name); });
  }
  function ready(lang, cb) {
    var file = fileFor(lang || current());
    var left = (packs[file] ? 0 : 1) + (file !== "en" && !packs.en ? 1 : 0);
    if (!left) { if (cb) cb(); return; }
    var done = 0;
    function one() { done += 1; if (done >= left && cb) cb(); }
    if (!packs[file]) load(file, one);
    if (file !== "en" && !packs.en) load("en", one);
  }
  function boot() { ready(current(), paint); }
  root.addEventListener("kulibert-lang", function (ev) {
    var lang = ev && ev.detail && ev.detail.lang;
    ready(lang || current(), paint);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  root.KulibertI18n = { t: t, paint: paint, ready: ready };
})(typeof window !== "undefined" ? window : globalThis);
