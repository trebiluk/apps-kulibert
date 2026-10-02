/* Paint stays left to right. Tool tips and names follow the Hub language. */
(function () {
  var META = "width=device-width, initial-scale=1, viewport-fit=cover";
  var busy = false;
  function pin() {
    if (document.documentElement.getAttribute("dir") !== "ltr") document.documentElement.setAttribute("dir", "ltr");
    var meta = document.querySelector('meta[name="viewport"]');
    if (meta && /maximum-scale|user-scalable\s*=\s*no/i.test(meta.getAttribute("content") || "")) meta.setAttribute("content", META);
  }
  function txLoose(v) {
    var direct = window.DrawinTx(v);
    if (direct !== v) return direct;
    var table = window.DRAWIN_I18N && window.DRAWIN_I18N.uk;
    if (!table) return v;
    var keys = Object.keys(table).sort(function (a, b) { return b.length - a.length; });
    for (var i = 0; i < keys.length; i++) {
      if (v === keys[i] || v.indexOf(keys[i] + " ") === 0 || v.indexOf(keys[i] + " (") === 0) {
        return window.DrawinTx(keys[i]) + v.slice(keys[i].length);
      }
    }
    return v;
  }
  function apply(el) {
    if (!el || !el.getAttribute || !window.DrawinTx) return;
    ["title", "aria-label"].forEach(function (attr) {
      var v = el.getAttribute(attr);
      if (!v || v.indexOf("·") === 0) return;
      var store = "data-ds-en-" + attr;
      var en = el.getAttribute(store);
      if (!en) {
        el.setAttribute(store, v);
        en = v;
      }
      var next = txLoose(en);
      if (next && next !== v) el.setAttribute(attr, next);
    });
    if (el.childNodes && el.childNodes.length === 1 && el.childNodes[0].nodeType === 3) {
      var raw = el.textContent.trim();
      if (!raw) return;
      if (!el.getAttribute("data-ds-en-text")) el.setAttribute("data-ds-en-text", raw);
      var word = txLoose(el.getAttribute("data-ds-en-text"));
      if (word && raw !== word) el.textContent = word;
    }
  }
  function walk() {
    if (busy) return;
    busy = true;
    try {
      pin();
      if (!window.DrawinTx) return;
      var prompt = document.getElementById("ds-prompt");
      if (prompt) {
        var next = window.DrawinTx("Draw a robot face. Tap Save when done.");
        if (prompt.textContent !== next) prompt.textContent = next;
      }
      var tips = document.getElementById("ds-tips");
      if (tips) {
        var lines = tips.querySelectorAll("p");
        var keys = ["1. Pick a brush.", "2. Draw on the page.", "3. Tap Save."];
        for (var i = 0; i < lines.length && i < keys.length; i++) {
          var line = window.DrawinTx(keys[i]);
          if (lines[i].textContent !== line) lines[i].textContent = line;
        }
      }
      var help = document.getElementById("ds-help");
      document.querySelectorAll("button, [title], [aria-label]").forEach(function (el) {
        if (el.id === "ds-help") return;
        apply(el);
      });
      if (help && window.KulibertI18n) {
        var word = window.KulibertI18n.t("help", "Help");
        if (help.textContent !== "?") help.textContent = "?";
        if (help.getAttribute("aria-label") !== word) help.setAttribute("aria-label", word);
      }
    } finally {
      busy = false;
    }
  }
  pin();
  var ticks = 0;
  var timer = setInterval(function () {
    walk();
    ticks += 1;
    if (ticks > 40) clearInterval(timer);
  }, 500);
  if (window.MutationObserver) {
    new MutationObserver(function () { walk(); }).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["title", "aria-label"]
    });
  }
  window.addEventListener("kulibert-lang", walk);
  window.addEventListener("message", function (ev) {
    if (!ev.data || ev.data.type !== "kp-lang") return;
    if (window.KulibertPrefs && KulibertPrefs.acceptLang) KulibertPrefs.acceptLang(ev.data.lang);
    walk();
  });
})();
