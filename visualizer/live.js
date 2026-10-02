/* Re-apply Hub language after app.js paints English. Does not call VzI18n.paint. */
(function (root) {
  var api = root.VzI18n;
  if (!api) return;
  var EN_NO = "No song yet. Make one in Music. The picture will use it.";
  var EN_IDLE = "Press Play. Read the word. Sound can stay off.";
  function paintLive() {
    var t = api.t;
    var play = document.getElementById("play-btn");
    var word = document.getElementById("play-word");
    if (play && word) {
      var on = play.classList.contains("is-on");
      var label = on ? t("pause") : t("play");
      word.textContent = label;
      play.setAttribute("aria-label", label);
    }
    var mute = document.getElementById("mute-btn");
    if (mute) {
      var pressed = mute.getAttribute("aria-pressed") === "true";
      mute.textContent = pressed ? t("muted") : t("soundOn");
    }
    var now = document.getElementById("now-line");
    if (now) {
      var text = now.textContent || "";
      if (text === EN_NO || text.indexOf("No song yet") === 0) now.textContent = t("noSong");
      else if (text === EN_IDLE) now.textContent = t("nowIdle");
    }
    var box = document.getElementById("lesson");
    if (box && !box.hidden && api.lesson) {
      var n = parseInt((document.getElementById("lesson-n") || {}).textContent, 10) || 1;
      var step = api.lesson(n - 1);
      var title = document.getElementById("lesson-title");
      var body = document.getElementById("lesson-body");
      if (title && step.title) title.textContent = step.title;
      if (body && step.body) body.textContent = step.body;
      var next = document.getElementById("lesson-next");
      if (next) next.textContent = n === 4 && next.classList.contains("ready") ? t("done") : t("iDid");
      var miss = document.getElementById("lesson-miss");
      if (miss && (miss.textContent === "Got it." || miss.textContent === "Press Play.")) {
        miss.textContent = miss.textContent === "Got it." ? t("gotIt") : t("les1m");
      }
    }
    ["chip-label", "chip-live", "foot-chip", "drawer-chip"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "Viz 0.9.1";
    });
  }
  root.VzPaintLive = paintLive;
  function both() {
    api.paint();
    paintLive();
  }
  root.addEventListener("kulibert-lang", both);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(both, 60); });
  else setTimeout(both, 60);
  setInterval(both, 800);
})(window);
