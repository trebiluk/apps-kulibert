(function () {
  var WHATS = {
    en: "VD 1.0.18: The full-screen button speaks your language.",
    uk: "VD 1.0.18: Кнопка на весь екран говорить вашою мовою.",
    ru: "VD 1.0.18: Кнопка на весь экран говорит на вашем языке.",
    es: "VD 1.0.18: El botón de pantalla completa habla tu idioma.",
    ar: "VD 1.0.18: زر ملء الشاشة يتكلم لغتك.",
    "fa-AF": "VD 1.0.18: دکمهٔ تمام‌صفحه به زبان شما است.",
    rw: "VD 1.0.18: Buto yo kwuzuza ikirahure ivuga ururimi rwawe.",
    ti: "VD 1.0.18: ናይ ምሉእ ስክሪን መልጎም ብቋንቋኻ ይዛረብ።",
    simple: "VD 1.0.18: The full screen button uses your language."
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
  var FS = {
    en: { enter: "Full screen", short: "Full", exit: "Exit full screen", exitShort: "Exit" },
    simple: { enter: "Full screen", short: "Full", exit: "Leave full screen", exitShort: "Leave" },
    es: { enter: "Pantalla completa", short: "Completa", exit: "Salir de pantalla completa", exitShort: "Salir" },
    uk: { enter: "На весь екран", short: "Екран", exit: "Вийти з повного екрана", exitShort: "Вийти" },
    ru: { enter: "На весь экран", short: "Экран", exit: "Выйти из полного экрана", exitShort: "Выйти" },
    ar: { enter: "ملء الشاشة", short: "كامل", exit: "الخروج من ملء الشاشة", exitShort: "خروج" },
    "fa-AF": { enter: "تمام‌صفحه", short: "کامل", exit: "خروج از تمام‌صفحه", exitShort: "خروج" },
    rw: { enter: "Ikirahure cyuzuye", short: "Yuzuye", exit: "Sohoka ikirahure cyuzuye", exitShort: "Sohoka" },
    ti: { enter: "ምሉእ ስክሪን", short: "ምሉእ", exit: "ካብ ምሉእ ስክሪን ውጻእ", exitShort: "ውጻእ" }
  };
  var PANEL = {
    en: { close: "Close", hub: "Back to the Hub" },
    simple: { close: "Close", hub: "Back to Hub" },
    es: { close: "Cerrar", hub: "Volver al Hub" },
    uk: { close: "Закрити", hub: "Назад до Хабу" },
    ru: { close: "Закрыть", hub: "Назад в Хаб" },
    ar: { close: "إغلاق", hub: "العودة إلى المركز" },
    "fa-AF": { close: "بستن", hub: "بازگشت به هاب" },
    rw: { close: "Funga", hub: "Gusubira kuri Hub" },
    ti: { close: "ዕጸው", hub: "ናብ ሃብ ተመለስ" }
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
      if (plate && plate.textContent !== "VD 1.0.18") plate.textContent = "VD 1.0.18";
      if (fs) {
        var pack = FS[code] || FS.en;
        var on = !!document.fullscreenElement;
        var label = on ? pack.exit : pack.enter;
        var word = on ? pack.exitShort : pack.short;
        if (fs.getAttribute("aria-label") !== label) fs.setAttribute("aria-label", label);
        var wordEl = document.getElementById("vd-fs-label");
        if (wordEl && wordEl.textContent !== word) wordEl.textContent = word;
        fs.style.whiteSpace = "normal";
        fs.style.height = "auto";
        fs.style.maxWidth = "8.5rem";
        fs.style.lineHeight = "1.1";
        fs.style.textAlign = "center";
        if (wordEl) {
          wordEl.style.whiteSpace = "normal";
          wordEl.style.overflowWrap = "anywhere";
          wordEl.style.lineHeight = "1.05";
        }
      }
      var panelWords = PANEL[code] || PANEL.en;
      var hub = document.querySelector(".vd-hub");
      [closeBtn, hub].forEach(function (el, index) {
        if (!el) return;
        var text = index === 0 ? panelWords.close : panelWords.hub;
        if (el.textContent !== text) el.textContent = text;
        if (el.getAttribute("aria-label") !== text) el.setAttribute("aria-label", text);
        el.style.whiteSpace = "normal";
        el.style.height = "auto";
        el.style.maxWidth = "100%";
        el.style.lineHeight = "1.15";
        el.style.overflowWrap = "anywhere";
        el.style.textAlign = "center";
      });
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
    else if (!open) {
      var buttons = document.querySelectorAll(".kb-menu, #vd-menu");
      var target = menu;
      for (var i = 0; i < buttons.length; i++) {
        var box = buttons[i].getBoundingClientRect();
        if (box.width > 0 && box.height > 0) { target = buttons[i]; break; }
      }
      if (target) target.focus();
    }
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
    document.addEventListener("fullscreenchange", paint);
  }
})();

/* VD 1.0.11 — kw-test.js only when staff unlock AND the Test switch are both on. */
(function () {
  var testScriptAsked = false;
  function staffUnlocked() {
    try {
      if (localStorage.getItem("tech-room-hub-staff") === "1") return true;
      if (sessionStorage.getItem("tech-room-hub-staff") === "1") return true;
    } catch (e) {}
    try {
      if (window.HubStaffAuth && window.HubStaffAuth.isUnlocked && window.HubStaffAuth.isUnlocked()) return true;
      if (window.KulibertStaffAuth && window.KulibertStaffAuth.isUnlocked && window.KulibertStaffAuth.isUnlocked()) return true;
    } catch (e2) {}
    return false;
  }
  function testSwitchOn() {
    var pack = false, asked = false;
    try { var raw = JSON.parse(sessionStorage.getItem("kulibert-test-pack") || "null"); pack = !!(raw && raw.testMode === true); } catch (e) {}
    try { asked = new URLSearchParams(location.search).get("test") === "1" || sessionStorage.getItem("kulibert-test-tab") === "1"; } catch (e2) {}
    return pack && asked;
  }
  function stripTestScript() {
    var nodes = document.querySelectorAll("script[src*='kw-test']");
    for (var i = 0; i < nodes.length; i++) if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    var chip = document.getElementById("kw-test-chip"); if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
    try { delete window.KulibertTest; } catch (e) { window.KulibertTest = undefined; }
    try { delete window.KWTest; } catch (e2) { window.KWTest = undefined; }
  }
  function loadStaffTest() {
    if (!(staffUnlocked() && testSwitchOn())) { if (!testScriptAsked) stripTestScript(); return; }
    if (window.HubStaffAuth && !window.KulibertStaffAuth) window.KulibertStaffAuth = window.HubStaffAuth;
    if (testScriptAsked || document.querySelector("script[src*='kw-test']")) { testScriptAsked = true; return; }
    testScriptAsked = true;
    var s = document.createElement("script"); s.src = "/shared/kw-test.js?v=VD-1.0.11"; document.head.appendChild(s);
  }
  loadStaffTest();
  var ticks = 0;
  var timer = setInterval(function () {
    ticks += 1;
    loadStaffTest();
    if (ticks >= 20) clearInterval(timer);
  }, 200);
})();
