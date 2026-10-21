(function () {
  var WHATS = {
    en: "VD 1.0.15: The winner is announced once, clearly.",
    uk: "VD 1.0.15: Переможця оголошують один раз, чітко.",
    ru: "VD 1.0.15: Победителя объявляют один раз, чётко.",
    es: "VD 1.0.15: El ganador se anuncia una vez, con claridad.",
    ar: "VD 1.0.15: يُعلَن الفائز مرة واحدة، بوضوح.",
    "fa-AF": "VD 1.0.15: برنده یک بار، واضح اعلام می‌شود.",
    rw: "VD 1.0.15: Uwatsinze avugwa rimwe, neza.",
    ti: "VD 1.0.15: ዓዋቲ ሓደ ግዜ፡ ብንጹር ይነግር።",
    simple: "VD 1.0.15: The winner is said once."
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
      if (plate && plate.textContent !== "VD 1.0.15") plate.textContent = "VD 1.0.15";
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
