/* Hub language after app.js, plus Settings languages in the left Menu. */
(function (root) {
  var api = root.VzI18n;
  if (!api) return;
  var LANGS = [
    ["en", "English"], ["uk", "Українська"], ["ru", "Русский"], ["es", "Español"],
    ["ar", "العربية"], ["fa-AF", "دری"], ["rw", "Ikinyarwanda"], ["ti", "ትግርኛ"]
  ];
  var WHATS = {
    en: "Settings and What's new are in the left Menu.",
    uk: "Налаштування і Що нового є в меню зліва.",
    ru: "Настройки и Что нового в меню слева.",
    es: "Ajustes y Qué hay de nuevo están en el menú de la izquierda.",
    ar: "الإعدادات وما الجديد في القائمة اليسرى.",
    "fa-AF": "تنظیمات و چی نو است در منوی چپ است.",
    rw: "Igenamiterere n'ibishya biri mu menu y'ibumoso.",
    ti: "ምርጻዓት ን ሕዳስ ተባደለ ኣብ ጣፍ መላገቢ እዩም።"
  };
  var SETTINGS = { en: "Settings", uk: "Налаштування", ru: "Настройки", es: "Ajustes", ar: "الإعدادات", "fa-AF": "تنظیمات", rw: "Igenamiterere", ti: "ምርጻዓት" };
  var EN_NO = "No song yet. Make one in Music. The picture will use it.";
  var EN_IDLE = "Press Play. Read the word. Sound can stay off.";
  function fillLangs() {
    var box = document.getElementById("lang-list");
    if (!box || box.childElementCount) return;
    LANGS.forEach(function (pair) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn";
      b.textContent = pair[1];
      b.setAttribute("data-lang", pair[0]);
      b.setAttribute("lang", pair[0] === "fa-AF" ? "fa" : pair[0]);
      if (pair[0] === "ar" || pair[0] === "fa-AF") b.dir = "rtl";
      b.addEventListener("click", function () {
        if (root.KulibertPrefs && root.KulibertPrefs.acceptLang) root.KulibertPrefs.acceptLang(pair[0]);
        paintLive();
      });
      box.appendChild(b);
    });
    var settings = document.getElementById("settings-btn");
    if (settings && !settings.dataset.wired) {
      settings.dataset.wired = "1";
      settings.addEventListener("click", function () {
        var open = box.hidden;
        box.hidden = !open;
        settings.setAttribute("aria-expanded", open ? "true" : "false");
      });
    }
  }
  function paintLive() {
    fillLangs();
    var t = api.t;
    var code = api.lang();
    var line = document.getElementById("whats-line");
    if (line) line.textContent = WHATS[code] || WHATS.en;
    var settings = document.getElementById("settings-btn");
    if (settings) settings.textContent = SETTINGS[code] || SETTINGS.en;
    var play = document.getElementById("play-btn");
    var word = document.getElementById("play-word");
    if (play && word) {
      var label = play.classList.contains("is-on") ? t("pause") : t("play");
      word.textContent = label;
      play.setAttribute("aria-label", label);
    }
    var mute = document.getElementById("mute-btn");
    if (mute) mute.textContent = mute.getAttribute("aria-pressed") === "true" ? t("muted") : t("soundOn");
    var now = document.getElementById("now-line");
    if (now) {
      var text = now.textContent || "";
      if (text === EN_NO || text.indexOf("No song yet") === 0) now.textContent = t("noSong");
      else if (text === EN_IDLE) now.textContent = t("nowIdle");
    }
    var lesson = document.getElementById("lesson");
    if (lesson && !lesson.hidden && api.lesson) {
      var n = parseInt((document.getElementById("lesson-n") || {}).textContent, 10) || 1;
      var step = api.lesson(n - 1);
      var title = document.getElementById("lesson-title");
      var body = document.getElementById("lesson-body");
      if (title && step.title) title.textContent = step.title;
      if (body && step.body) body.textContent = step.body;
      var next = document.getElementById("lesson-next");
      if (next) next.textContent = n === 4 && next.classList.contains("ready") ? t("done") : t("iDid");
    }
    document.querySelectorAll("#lang-list button").forEach(function (b) {
      var on = b.getAttribute("data-lang") === code;
      b.classList.toggle("on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
    ["chip-label", "chip-live", "foot-chip", "drawer-chip"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "Viz 0.9.2";
    });
    document.title = "Visualizer \u00b7 Viz 0.9.2";
    var dup = document.getElementById("kb-drawer");
    if (dup) dup.hidden = true;
  }
  root.VzPaintLive = paintLive;
  function both() { api.paint(); paintLive(); }
  root.addEventListener("kulibert-lang", both);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(both, 60); });
  else setTimeout(both, 60);
  setInterval(both, 800);
})(window);
