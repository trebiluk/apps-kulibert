(function () {
  var WHATS = {
    en: "VD 1.0.7: The touch pads fit on upright phones, and Menu and Back to the Hub are easy to tap.",
    uk: "VD 1.0.7: Сенсорні кнопки вміщуються на телефоні вертикально, а Меню й Назад до Хабу легко натиснути.",
    ru: "VD 1.0.7: Сенсорные кнопки помещаются на телефоне вертикально, а Меню и Назад в Хаб легко нажать.",
    es: "VD 1.0.7: Los botones táctiles caben en el teléfono en vertical, y Menú y Volver al Hub son fáciles de tocar.",
    ar: "VD 1.0.7: أزرار اللمس تتسع على الهاتف عموديًا، وأصبح من السهل لمس القائمة والعودة إلى المركز.",
    "fa-AF": "VD 1.0.7: دکمه‌های لمسی در تلفن ایستاده جا می‌شوند و منو و بازگشت به هاب آسان زده می‌شوند.",
    rw: "VD 1.0.7: Utubuto two gukoraho dukwira kuri telefoni ihagaze, kandi Menu na Subira kuri Hub byoroshye gukanda.",
    ti: "VD 1.0.7: መጠወቒ ቁልፍታት ኣብ ቀጥ ዝበለ ሞባይል ይኣትዉ፣ ሜኑን ናብ ሃብ ምምላስን ቀሊል እዩ።",
    simple: "VD 1.0.7: The pads fit. Menu and Back are easy to tap."
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
      if (plate && plate.textContent !== "VD 1.0.7") plate.textContent = "VD 1.0.7";
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
