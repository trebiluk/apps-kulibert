(function () {
  var WHATS = {
    en: "VD 1.0.0 — Volt Duel is on the Hub: race a friend to the flag!",
    uk: "VD 1.0.0 — Volt Duel тепер у Хабі: змагайся з другом до прапорця!",
    ru: "VD 1.0.0 — Volt Duel теперь в Хабе: гонка с другом до флажка!",
    es: "VD 1.0.0 — Volt Duel ya está en el Hub: ¡corre con un amigo hasta la bandera!",
    ar: "VD 1.0.0 — Volt Duel الآن في المركز: سابق صديقك إلى العلم!",
    "fa-AF": "VD 1.0.0 — Volt Duel حالا در هاب است: با رفیقت تا بیرق مسابقه بده!",
    rw: "VD 1.0.0 — Volt Duel iri kuri Hub: siganwa n'inshuti yawe ugere ku ibendera!",
    ti: "VD 1.0.0 — Volt Duel ኣብ Hub ኣሎ፦ ምስ ዓርክኻ ክሳብ ባንዴራ ተቐዳደም!"
  };
  var TITLES = {
    en: "What's new",
    uk: "Що нового",
    ru: "Что нового",
    es: "Novedades",
    ar: "الجديد",
    "fa-AF": "تازه‌ها",
    rw: "Ibishya",
    ti: "ሓድሽ"
  };
  var menu = document.getElementById("vd-menu");
  var panel = document.getElementById("vd-panel");
  var closeBtn = document.getElementById("vd-close");
  var fs = document.getElementById("vd-fs");
  var painting = false;

  function lang() {
    var code = document.documentElement.getAttribute("data-kp-lang") || "en";
    if (code === "simple") code = "en";
    return WHATS[code] ? code : "en";
  }

  function paint() {
    if (painting) return;
    painting = true;
    try {
      var code = lang();
      var line = document.getElementById("vd-whats");
      var title = document.getElementById("vd-whats-title");
      var next = WHATS[code];
      if (line && line.textContent !== next) line.textContent = next;
      if (title && title.textContent !== (TITLES[code] || TITLES.en)) title.textContent = TITLES[code] || TITLES.en;
      if (line) {
        var langAttr = code === "fa-AF" ? "fa" : code;
        var dir = code === "ar" || code === "fa-AF" ? "rtl" : "ltr";
        if (line.lang !== langAttr) line.lang = langAttr;
        if (line.dir !== dir) line.dir = dir;
      }
      var plate = document.querySelector(".kb-plate");
      if (plate && plate.textContent !== "VD 1.0.0") plate.textContent = "VD 1.0.0";
    } finally {
      painting = false;
    }
  }

  function setOpen(open) {
    if (!panel || !menu) return;
    panel.hidden = !open;
    menu.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) document.documentElement.setAttribute("data-kb-modal-open", "1");
    else document.documentElement.removeAttribute("data-kb-modal-open");
    if (open && closeBtn) closeBtn.focus();
  }

  if (menu) {
    menu.addEventListener("click", function () {
      setOpen(!!panel && panel.hidden);
    });
  }
  if (closeBtn) closeBtn.addEventListener("click", function () { setOpen(false); });
  window.addEventListener("keydown", function (event) {
    if (!event || event.key !== "Escape" || !panel || panel.hidden) return;
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
  }, true);
  window.addEventListener("kulibert-lang", paint);
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang"] });
  setInterval(paint, 400);
  paint();

  if (fs) {
    fs.addEventListener("click", function () {
      var el = document.documentElement;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) void el.requestFullscreen();
      } else if (document.exitFullscreen) {
        void document.exitFullscreen();
      }
    });
  }
})();
