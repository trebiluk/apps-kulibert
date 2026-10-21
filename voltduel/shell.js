(function () {
  var WHATS = {
    en: "VD 1.0.6: VEX and RIO have their own shapes, and a sign shows when you go back to a checkpoint.",
    uk: "VD 1.0.6: VEX і RIO мають власні форми, а напис показує, коли ти повертаєшся до контрольної точки.",
    ru: "VD 1.0.6: У VEX и RIO свои формы, а надпись показывает, когда ты возвращаешься к контрольной точке.",
    es: "VD 1.0.6: VEX y RIO tienen sus propias formas, y un letrero avisa cuando vuelves a un punto de control.",
    ar: "VD 1.0.6: لكل من VEX وRIO شكل خاص، وتظهر لافتة عندما تعود إلى نقطة التفتيش.",
    "fa-AF": "VD 1.0.6: VEX و RIO شکل‌های خود را دارند و یک تابلو نشان می‌دهد که کی به ایستگاه بازرسی برمی‌گردی.",
    rw: "VD 1.0.6: VEX na RIO bafite imiterere yabo bwite, kandi icyapa kikwereka igihe usubiye kuri checkpoint.",
    ti: "VD 1.0.6: VEX ን RIO ናይ ገዛእ ርእሶም ቅርጺ ኣለዎም፣ ናብ መቆጻጸሪ ነጥቢ ክትምለስ ከለኻ ምልክት ይርአ።",
    simple: "VD 1.0.6: V is a circle. R is a square. A sign shows when you go back."
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
        var langAttr = code === "fa-AF" ? "fa" : code === "simple" ? "en" : code;
        var dir = code === "ar" || code === "fa-AF" ? "rtl" : "ltr";
        if (line.lang !== langAttr) line.lang = langAttr;
        if (line.dir !== dir) line.dir = dir;
      }
      var plate = document.querySelector(".kb-plate");
      if (plate && plate.textContent !== "VD 1.0.6") plate.textContent = "VD 1.0.6";
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
