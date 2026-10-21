(function () {
  var WHATS = {
    en: "VD 1.0.8: VEX and RIO score chips now differ by shape and letter, RIO no longer covers VEX at the start, and staff Test mode can reach the win.",
    uk: "VD 1.0.8: Фішки рахунку VEX і RIO тепер різняться формою та літерою, RIO більше не закриває VEX на старті, а тестовий режим персоналу доходить до перемоги.",
    ru: "VD 1.0.8: Фишки счёта VEX и RIO теперь различаются формой и буквой, RIO больше не закрывает VEX на старте, а тестовый режим сотрудников доходит до победы.",
    es: "VD 1.0.8: Las fichas de VEX y RIO ahora se distinguen por forma y letra, RIO ya no tapa a VEX al inicio y el modo Prueba del personal llega a la victoria.",
    ar: "VD 1.0.8: شارات نقاط VEX وRIO تختلف الآن بالشكل والحرف، ولم يعد RIO يغطي VEX عند البداية، ووضع اختبار الموظفين يصل إلى الفوز.",
    "fa-AF": "VD 1.0.8: نشان‌های امتیاز VEX و RIO اکنون با شکل و حرف فرق دارند، RIO در آغاز دیگر VEX را نمی‌پوشاند و حالت آزمایش کارکنان به بُرد می‌رسد.",
    rw: "VD 1.0.8: Udupapuro tw'amanota twa VEX na RIO ubu dutandukanywa n'ishusho n'inyuguti, RIO ntigipfukirana VEX mu ntangiriro, kandi uburyo bw'igerageza bw'abakozi bugera ku ntsinzi.",
    ti: "VD 1.0.8: ናይ ነጥቢ ምልክታት VEX ን RIO ሕጂ ብቕርጽን ፊደልን ይፈላለዩ፣ RIO ኣብ መጀመርታ ንVEX ኣይሽፍኖን፣ ናይ ሰራሕተኛታት መፈተኒ ኣገባብ ናብ ዓወት ይበጽሕ።",
    simple: "VD 1.0.8: VEX is a circle V. RIO is a square R. Staff can test the win."
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
      if (plate && plate.textContent !== "VD 1.0.8") plate.textContent = "VD 1.0.8";
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
