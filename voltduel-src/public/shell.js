(function () {
  var WHATS = {
    en: "VD 1.0.4 — The race fills phone screens upright, and nothing covers the track.",
    uk: "VD 1.0.4 — Гонка заповнює екран телефона вертикально, і ніщо не закриває трасу.",
    ru: "VD 1.0.4 — Гонка заполняет экран телефона вертикально, и ничто не закрывает трассу.",
    es: "VD 1.0.4 — La carrera llena la pantalla del móvil en vertical y nada tapa la pista.",
    ar: "VD 1.0.4 — السباق يملأ شاشة الهاتف عموديًا، ولا شيء يغطي المضمار.",
    "fa-AF": "VD 1.0.4 — مسابقه صفحهٔ موبایل را در حالت ایستاده پر می‌کند، و هیچ چیز مسیر را نمی‌پوشاند.",
    rw: "VD 1.0.4 — Isiganwa ryuzuza ecran ya telefoni ihagaze, kandi nta kintu gipfuka inzira.",
    ti: "VD 1.0.4 — ጉያ ስክሪን ሞባይል ብቕኑዕ ይመልእ፣ ዝኾነ ነገር ድማ መገዲ ኣይሽፍንን።"
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
      if (plate && plate.textContent !== "VD 1.0.4") plate.textContent = "VD 1.0.4";
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
  function watchPlate() {
    var plate = document.querySelector(".kb-plate");
    if (!plate || plate.getAttribute("data-vd-watch") === "1") return;
    plate.setAttribute("data-vd-watch", "1");
    new MutationObserver(paint).observe(plate, { characterData: true, subtree: true, childList: true });
  }
  window.addEventListener("resize", paint);
  setInterval(function () { watchPlate(); paint(); }, 250);
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
