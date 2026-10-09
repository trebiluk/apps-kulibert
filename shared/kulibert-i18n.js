/* Shared Tech Room words. English is always the fallback. Never a blank, never a raw key. */
(function (root) {
  var EN = {
  "home": "Home",
  "signIn": "Sign in",
  "settings": "Settings",
  "play": "Play",
  "pause": "Pause",
  "resume": "Resume",
  "retry": "Retry",
  "exit": "Exit",
  "sound": "Sound",
  "music": "Music",
  "volume": "Volume",
  "next": "Next",
  "back": "Back",
  "help": "Help",
  "whatsNew": "What's new",
  "scores": "Scores",
  "levels": "Levels",
  "language": "Language",
  "mySettings": "My settings",
  "menu": "Menu",
  "close": "Close",
  "readAloud": "Read aloud",
  "noVoice": "No voice yet. Read the words.",
  "appsFollow": "Your apps will use this language.",
  "code": "Code",
  "pin": "PIN",
  "codeHint": "5 characters",
  "pinHint": "From your teacher",
  "signNote": "The code and the PIN come from your teacher. Your name shows after they match.",
  "signTeacher": "The code and the PIN come from your teacher.",
  "errWait": "Wait a moment, then try again.",
  "errNeedBoth": "Enter the 5-character code and the 4-digit PIN.",
  "errNoMatch": "That code or PIN does not match.",
  "errNotListed": "That code is not on the list.",
  "errOffline": "TechWorks did not answer. Try again on the school network.",
  "searchHint": "Search or paste a link",
  "more": "More",
  "gotIt": "Got it",
  "pwaTip": "Install tip: Chrome menu, then Install page. The Tech Room icon stays on this Chromebook. Apps still need the school network.",
  "whatsNewLine": "Apps that don't fit on the top row are under More.",
  "moreApps": "More apps",
  "appNames": "App names in the top strip",
  "whatsNewStrip": "The top strip shows app icons only. Turn the names back on in My settings.",
  "myProgress": "My progress",
  "staff": "Staff",
  "signOut": "Sign out",
  "staffEdit": "Staff edit",
  "sortAz": "A–Z",
  "sortZa": "Z–A",
  "myStyle": "My style",
  "pickSize": "Pick a size. Your apps can use it.",
  "highContrast": "High contrast",
  "lessMotion": "Less motion",
  "captions": "Show words for sounds and speech",
  "textSize": "Text size",
  "pictureCards": "Picture cards",
  "cardBridge": "bridge",
  "cardForce": "force",
  "cardTriangle": "triangle",
  "savedHere": "Saved on this Chromebook.",
  "nothingMatches": "Nothing matches. Paste a link and press Enter to pin it here.",
  "searchLabel": "Search apps or paste a link",
  "groupTools": "Tools",
  "groupPlay": "Play",
  "groupDesign": "Design",
  "groupShop": "Shop",
  "groupSound": "Sound",
  "groupClass": "Class",
  "groupCampus": "Campus",
  "groupCrew": "Crew",
  "school": "School",
  "myShortcuts": "My shortcuts",
  "thisChromebook": "This Chromebook only",
  "liveNow": "Live now",
  "openedHere": "Opened here",
  "expand": "Expand",
  "twConnected": "TW Connected",
  "styleRoom": "Room",
  "styleGraph": "Graph",
  "styleMiami": "Miami",
  "styleSpa": "Spa",
  "styleNature": "Nature",
  "stylePeaks": "Peaks",
  "styleCity": "City",
  "styleSpace": "Space",
  "styleBerty": "Berty",
  "blurbBaboo": "Draw a house plan",
  "blurbBertycad": "Build 3D shapes",
  "blurbVisualizer": "Make lights dance",
  "blurbBits": "Shop timers and tools",
  "blurbBotz": "Solve machine puzzles",
  "blurbRun": "Run, jump, grab PC parts",
  "blurbSpan": "Build a bridge that holds",
  "blurbSpire": "Build a tall tower",
  "blurbDrift": "Fly a calm glider",
  "blurbHoldit": "Test a bridge design",
  "blurbBloxbert": "Build in Bertyville",
  "blurbGinger": "Plan a room",
  "blurbPaper": "Build with one sheet",
  "blurbLogo": "Make your own logo",
  "blurbDrawin": "Draw and paint",
  "blurbThrow": "Toss candy at a target",
  "blurbSprocket": "Get the 3D printer ready",
  "blurbDj": "Make a beat",
  "blurbBeatz": "Tap squares, make a song",
  "blurbTw": "See your class and XP",
  "blurbKz": "Code a robot",
  "blurbDebug": "Find the bad step",
  "about": "About",
  "aboutBody": "Bloxbert is a Solvay Tech Room build lab. The 3D engine is noa (MIT) and Babylon.js (Apache-2.0). Block art is the Kenney Voxel Pack (CC0).",
  "auto": "Auto",
  "autoClose": "Auto-close",
  "autoHint": "Best for most. Lowers detail if it gets slow.",
  "backMenu": "Menu",
  "break": "Break",
  "buildTable": "Build Table",
  "contest": "Build contest",
  "copyTip": "Copy a block you already have into your hand.",
  "creative": "Creative",
  "creditEngine": "Engine: noa (MIT) + Babylon.js (Apache-2.0). Block art: Kenney Voxel Pack (CC0).",
  "crouch": "Crouch",
  "exportWorld": "Export world file",
  "forward": "Forward",
  "freshWorld": "Fresh world",
  "fs": "Full screen",
  "fsExit": "Exit full screen",
  "fsIphone": "For full screen on iPhone: tap Share, then Add to Home Screen.",
  "full": "Full",
  "fullHint": "Sharpest look, farther view. Needs a fast device.",
  "hub": "Back to the Hub",
  "importWorld": "Import world file",
  "inspect": "Inspect",
  "jump": "Jump",
  "keysHint": "WASD walks. Shift runs. Z crouches. Space jumps one block. Hold left click to break. Right click places. Q drops one.",
  "keysLine": "WASD walk · Shift run · Z crouch · Space jump · Left hold breaks · Right places · Q drops",
  "later": "later cut",
  "left": "left",
  "lite": "Lite",
  "liteHint": "Fastest. For slow Chromebooks and phones.",
  "loadSaved": "Load my saved world",
  "mode": "Mode",
  "padlock": "Padlock",
  "pickup": "Pick up",
  "place": "Place",
  "redo": "Redo",
  "right": "Right",
  "save": "Save",
  "saveNow": "Save now",
  "showSpeed": "Show speed",
  "stickSide": "Stick side",
  "survival": "Survival",
  "tableHint": "Build Table: drag to orbit, tap a face to place. Arrow keys move the cursor. Enter places.",
  "textL": "Large",
  "textM": "Medium",
  "textS": "Small",
  "undo": "Undo",
  "whatsNewBody": "Recipes list everything you still need, counts update while a panel is open, and the Oven fire is easy to see.",
  "world": "World",
};
  var FILES = { en: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  var packs = { en: EN };
  var pending = {};
  var warned = Object.create(null);
  function fileFor(lang) {
    if (!lang || lang === "simple" || !FILES[lang]) return "en";
    return lang;
  }
  function current() {
    try {
      if (root.KulibertPrefs && typeof root.KulibertPrefs.lang === "string" && root.KulibertPrefs.lang) return root.KulibertPrefs.lang;
    } catch (e) {}
    var attr = document.documentElement.getAttribute("data-kp-lang") || "";
    if (attr === "simple" || FILES[attr]) return attr;
    return "en";
  }
  function lookup(pack, k) {
    if (!pack || typeof pack !== "object") return "";
    if (!Object.prototype.hasOwnProperty.call(pack, k)) return "";
    var v = pack[k];
    return typeof v === "string" && v.trim() ? v : "";
  }
  function warnMissing(k) {
    if (warned[k]) return;
    warned[k] = 1;
    try { console.warn("KulibertI18n missing: " + k); } catch (e) {}
  }
  function t(key, fallback) {
    var k = String(key == null ? "" : key);
    var fb = typeof fallback === "string" ? fallback : "";
    if (!k) return fb || k;
    var file = fileFor(current());
    var hit = lookup(packs[file], k);
    if (hit) return hit;
    var enHit = lookup(file === "en" ? EN : (packs.en || EN), k) || lookup(EN, k);
    if (enHit) return enHit;
    if (!pending[file]) warnMissing(k);
    return fb || k;
  }
  function paint() {
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute("data-i18n");
      var v = t(key);
      if (v && v !== key) nodes[i].textContent = v;
    }
    var labels = document.querySelectorAll("[data-i18n-label]");
    for (var j = 0; j < labels.length; j++) {
      var labelKey = labels[j].getAttribute("data-i18n-label");
      var label = t(labelKey);
      if (label && label !== labelKey) labels[j].setAttribute("aria-label", label);
    }
    var places = document.querySelectorAll("[data-i18n-placeholder]");
    for (var p = 0; p < places.length; p++) {
      var placeKey = places[p].getAttribute("data-i18n-placeholder");
      var hint = t(placeKey);
      if (hint && hint !== placeKey) places[p].setAttribute("placeholder", hint);
    }
  }
  function finish(name) {
    var waiters = pending[name] || [];
    delete pending[name];
    waiters.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function load(name, cb) {
    if (packs[name]) { if (cb) cb(); return; }
    if (pending[name]) { pending[name].push(cb || function () {}); return; }
    pending[name] = cb ? [cb] : [];
    var cached = "";
    try { cached = sessionStorage.getItem("kulibert-i18n-v9:" + name) || ""; } catch (e) {}
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") packs[name] = parsed;
      } catch (e2) {}
      finish(name);
      return;
    }
    var origin = "https://apps.kulibert.net";
    try {
      var tags = document.querySelectorAll("script[src*='kulibert-i18n.js']");
      var src = tags.length ? tags[tags.length - 1].src : "";
      if (src) origin = new URL(src, location.href).origin;
    } catch (eOrigin) {}
    fetch(origin + "/shared/i18n/" + name + ".json?v=2026-10-13-strip", { credentials: "omit", cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(function (data) {
      if (data && typeof data === "object") {
        packs[name] = data;
        try { sessionStorage.setItem("kulibert-i18n-v9:" + name, JSON.stringify(data)); } catch (e3) {}
      }
    }).catch(function () {}).then(function () { finish(name); });
  }
  function ready(lang, cb) {
    var file = fileFor(lang || current());
    var left = (packs[file] ? 0 : 1) + (file !== "en" && !packs.en ? 1 : 0);
    if (!left) { if (cb) cb(); return; }
    var done = 0;
    function one() { done += 1; if (done >= left && cb) cb(); }
    if (!packs[file]) load(file, one);
    if (file !== "en" && !packs.en) load("en", one);
  }
  function boot() { ready(current(), paint); }
  root.addEventListener("kulibert-lang", function (ev) {
    var lang = ev && ev.detail && ev.detail.lang;
    ready(lang || current(), paint);
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  root.KulibertI18n = { t: t, paint: paint, ready: ready };
})(typeof window !== "undefined" ? window : globalThis);
