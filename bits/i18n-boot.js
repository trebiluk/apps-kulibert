/* Bits language runtime. English fills any missing string. Shared chrome words come from KulibertI18n. */
(function (root) {
  var OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  var packs = root.BitsI18nPacks || { en: {} };
  var lang = "en";
  var fans = [];
  var PHRASE = {
    "Minutes": "minutes", "Seconds": "seconds", "End": "periodEnd",
    "Dice": "modeDice", "Wheel": "modeWheel", "Teams": "teams", "Seats": "seats",
    "Millimeters": "millimeters", "Stick length": "stickLength", "Kerf": "kerf",
    "Piece": "piece", "How many": "howMany", "Wheel size": "wheelSize",
    "Distance": "distance", "Track (90°)": "track90", "Shape width": "shapeW",
    "Shape height": "shapeH", "Gap": "gap", "Sheet width": "sheetW", "Sheet height": "sheetH",
    "Load held": "loadHeld", "Build mass": "buildMass", "Amount": "amount",
    "From": "from", "To": "to", "Model inches": "modelIn", "1 to": "oneTo",
    "A / radius": "aRadius", "B / height": "bHeight", "C": "dimC",
    "Volts": "volts", "Amps": "amps", "Ohms": "ohms", "Ohms 2": "ohms2",
    "Load": "load", "Load arm": "loadArm", "Effort arm": "effortArm",
    "Thick in": "thick", "Wide in": "wide", "Long ft": "longft",
    "Rise": "rise", "Run": "run", "Leg a": "legA", "Leg b": "legB",
    "Teeth A": "teethA", "Teeth B": "teethB", "RPM A": "rpmA",
    "Lanes": "lanes", "Laps": "laps", "Speed": "solveSpeed", "Time": "solveTime",
    "Basic": "basic", "Scientific": "scientific", "Degrees": "degrees", "Radians": "radians",
    "Sheet": "modeSheet", "Box": "shapeBox", "Cylinder": "shapeCyl", "Sphere": "shapeSphere",
    "Ohm": "modeOhm", "Series": "modeSeries", "Parallel": "modeParallel",
    "HUD dark": "hudDark", "Light": "light", "High-contrast": "contrast",
    "Mass": "catMass", "Volume": "catVolume", "Temp": "catTemp"
  };
  var TOOL = {
    "Drama Timer": "toolDrama", "A huge ring for the scene.": "blurbDrama",
    "Countdown to Bell": "toolBell", "Solvay periods, teacher times.": "blurbBell",
    "Dice / Teams": "toolDice", "Dice, a wheel, or crews. No names.": "blurbDice",
    "Noise Meter": "toolNoise", "Live only. Never recorded.": "blurbNoise",
    "Calculator": "toolCalc", "Basic and scientific, one tile.": "blurbCalc",
    "Random Prompt": "toolPrompt", "A design challenge on tap.": "blurbPrompt",
    "Tape reader": "toolTape", "Tap a tick or type millimeters.": "blurbTape",
    "Cut list": "toolCuts", "Pieces on sticks, kerf shown.": "blurbCuts",
    "Robot drive": "toolRobot", "Wheel, distance, and a 90° turn.": "blurbRobot",
    "Sheet fit": "toolSheet", "How many fit on a Cricut mat.": "blurbSheet",
    "Strength score": "toolStrength", "Load ÷ build mass. No names.": "blurbStrength",
    "Convert": "toolConvert", "Length, mass, volume, temperature.": "blurbConvert",
    "Scale": "toolScale", "Model length times the ratio.": "blurbScale",
    "Volume": "toolVolume", "Box, cylinder, or sphere.": "blurbVolume",
    "Speed": "toolSpeed", "Distance, speed, or time.": "blurbSpeed",
    "Circuits": "toolCircuits", "Ohm's law, series, and parallel.": "blurbCircuits",
    "Levers": "toolLevers", "Load times arm equals effort times arm.": "blurbLevers",
    "Lumber": "toolLumber", "Board feet from thickness, width, length.": "blurbLumber",
    "Roof pitch": "toolRoof", "Rise, run, and the right triangle.": "blurbRoof",
    "Gears": "toolGears", "Teeth that really turn.": "blurbGears",
    "Angles": "toolAngles", "Drag the ray on the protractor.": "blurbAngles",
    "Stopwatch Race": "toolRace", "Two to four lanes. First to the laps wins.": "blurbRace",
    "Color Mixer": "toolColor", "RGB, HSL, and a hex swatch.": "blurbColor",
    "Binary / Pixel": "toolBinary", "Eight bits, and a 16×16 grid.": "blurbBinary"
  };
  function norm(v) { return OK[String(v || "")] ? String(v) : ""; }
  function dirOf(code) { return code === "ar" || code === "fa-AF" ? "rtl" : "ltr"; }
  function htmlLang(code) { return code === "simple" ? "en" : (code || "en"); }
  function pack() { return packs[lang] || packs.en || {}; }
  function bb(key) {
    var cur = pack();
    if (cur[key]) return cur[key];
    if (packs.en && packs.en[key]) return packs.en[key];
    return "";
  }
  function bbf(key, map) {
    var s = bb(key);
    if (!s || !map) return s || "";
    Object.keys(map).forEach(function (k) { s = s.split("{" + k + "}").join(String(map[k])); });
    return s;
  }
  var SHARED_EN = {
    settings: "Settings", exit: "Exit", pause: "Pause", close: "Close",
    whatsNew: "What's new", noVoice: "No voice yet. Read the words.", help: "Help", play: "Play"
  };
  function shared(key) {
    var v = "";
    try { if (root.KulibertI18n && root.KulibertI18n.t) v = root.KulibertI18n.t(key) || ""; } catch (e) {}
    return v || SHARED_EN[key] || "";
  }
  function phrase(label) { return PHRASE[label] || ""; }
  function toolKey(label) { return TOOL[label] || PHRASE[label] || ""; }
  function show(node, key) {
    if (!node) return;
    node.dataset.k = key;
    node.removeAttribute("data-sk");
    node.textContent = bb(key);
  }
  function showShared(node, key) {
    if (!node) return;
    node.dataset.sk = key;
    node.removeAttribute("data-k");
    node.textContent = shared(key);
  }
  function showAria(node, key) {
    if (!node) return;
    node.dataset.ak = key;
    node.setAttribute("aria-label", bb(key));
  }
  function repaint() {
    var nodes = document.querySelectorAll("[data-k]");
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = bb(nodes[i].dataset.k);
    var sharedNodes = document.querySelectorAll("[data-sk]");
    for (var j = 0; j < sharedNodes.length; j++) sharedNodes[j].textContent = shared(sharedNodes[j].dataset.sk);
    var aria = document.querySelectorAll("[data-ak]");
    for (var a = 0; a < aria.length; a++) aria[a].setAttribute("aria-label", bb(aria[a].dataset.ak));
    fans.forEach(function (fn) { try { fn(); } catch (e) {} });
  }
  function applyDom() {
    var el = document.documentElement;
    el.lang = htmlLang(lang);
    el.dir = dirOf(lang);
    el.setAttribute("data-kp-lang", lang);
    var board = document.querySelector(".board");
    if (board) board.setAttribute("dir", "ltr");
    var dock = document.querySelector(".dock");
    if (dock) dock.setAttribute("dir", "ltr");
  }
  function setLang(code) {
    lang = norm(code) || "en";
    try {
      if (root.KulibertPrefs && root.KulibertPrefs.acceptLang && root.KulibertPrefs.lang !== lang) {
        root.KulibertPrefs.acceptLang(lang);
      }
    } catch (e) {}
    applyDom();
    var go = function () { repaint(); };
    if (root.KulibertI18n && root.KulibertI18n.ready) root.KulibertI18n.ready(lang, go);
    else go();
  }
  function fromPage() {
    try {
      var hit = norm(new URLSearchParams(location.search).get("lang"));
      if (hit) return hit;
    } catch (e) {}
    try {
      if (root.KulibertPrefs && root.KulibertPrefs.lang) {
        var p = norm(root.KulibertPrefs.lang);
        if (p) return p;
      }
    } catch (e2) {}
    try {
      var raw = JSON.parse(localStorage.getItem("kulibert-prefs-v1") || "null");
      var stored = norm(raw && raw.lang);
      if (stored) return stored;
    } catch (e3) {}
    return "en";
  }
  function on(fn) {
    fans.push(fn);
    return function () {
      var i = fans.indexOf(fn);
      if (i >= 0) fans.splice(i, 1);
    };
  }
  function prompts() {
    var rows = (pack().prompts && pack().prompts.length) ? pack().prompts : (packs.en.prompts || []);
    var base = (packs.en && packs.en.prompts) || rows;
    return base.map(function (line, i) { return rows[i] || line; });
  }
  function boot() {
    setLang(fromPage());
    root.addEventListener("kulibert-lang", function (ev) {
      var code = ev && ev.detail && ev.detail.lang;
      setLang(code || fromPage());
    });
  }
  function say(text) {
    var words = String(text || "").replace(/\s+/g, " ").trim().slice(0, 180);
    if (!words) return;
    var line = document.getElementById("kp-live");
    if (!line) {
      line = document.createElement("p");
      line.id = "kp-live";
      line.setAttribute("role", "status");
      (document.body || document.documentElement).appendChild(line);
    }
    line.hidden = false;
    line.lang = htmlLang(lang);
    line.dir = dirOf(lang);
    line.textContent = words;
    var code = lang;
    function fail() { line.textContent = words + " " + shared("noVoice"); }
    function speak(voices) {
      var prefs = root.KulibertPrefs;
      var voice = prefs && prefs.voiceFor ? prefs.voiceFor(code, voices || []) : null;
      if (!voice || !root.speechSynthesis) { fail(); return; }
      var want = (code === "simple" ? "en" : String(code)).toLowerCase().split("-")[0];
      var got = String(voice.lang || "").toLowerCase().replace(/_/g, "-");
      if (got !== want && got.indexOf(want + "-") !== 0) { fail(); return; }
      try {
        root.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(words);
        u.voice = voice;
        u.lang = voice.lang;
        root.speechSynthesis.speak(u);
      } catch (e) { fail(); }
    }
    function begin() {
      var synth = root.speechSynthesis;
      if (!synth || !synth.getVoices) { fail(); return; }
      var list = [];
      try { list = synth.getVoices() || []; } catch (e2) { list = []; }
      if (list.length) { speak(list); return; }
      var timer = setTimeout(function () {
        try { synth.removeEventListener("voiceschanged", onv); } catch (e3) {}
        var again = [];
        try { again = synth.getVoices() || []; } catch (e4) {}
        speak(again);
      }, 500);
      function onv() {
        clearTimeout(timer);
        try { synth.removeEventListener("voiceschanged", onv); } catch (e5) {}
        var again = [];
        try { again = synth.getVoices() || []; } catch (e6) {}
        speak(again);
      }
      try { synth.addEventListener("voiceschanged", onv); } catch (e7) { clearTimeout(timer); fail(); }
    }
    if (root.KulibertI18n && root.KulibertI18n.ready) root.KulibertI18n.ready(code, begin);
    else begin();
  }
  function hush() { try { if (root.speechSynthesis) root.speechSynthesis.cancel(); } catch (e) {} }
  root.BitsI18n = {
    bb: bb, bbf: bbf, shared: shared, phrase: phrase, toolKey: toolKey,
    show: show, showShared: showShared, showAria: showAria,
    boot: boot, on: on, lang: function () { return lang; }, dir: function () { return dirOf(lang); },
    prompts: prompts, say: say, hush: hush, repaint: repaint, setLang: setLang
  };
})(typeof window !== "undefined" ? window : globalThis);
