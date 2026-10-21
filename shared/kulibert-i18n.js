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
  "whatsNewLine": "Hub rev 2026-10-20-staff-es-fineprint-door: The staff page and Fine Print now follow your language, and the Tech Room door link is easier to tap.",
  "staffHelpLine": "Staff: admin tools appear only after you unlock with the desk key.",
  "finePrint": "Fine Print",
  "finePrintTitle": "About This Hub",
  "finePrintKid": "Some important stuff about the apps here: who made them, how we keep you safe, and who to talk to.",
  "finePrintClose": "Close",
  "staffTitle": "Staff",
  "staffIntro": "Enter the staff password. This device stays unlocked until Sign out. The TechWorks desk key is a separate lock.",
  "staffShow": "Show",
  "staffUnlock": "Unlock",
  "staffDoor": "Tech Room door",
  "staffDeskTitle": "Room desk",
  "staffDeskIntro": "Not a class tile. Unlock with the TechWorks Cloud desk key. Hashed in this tab. Close the tab to lock.",
  "staffSignOut": "Sign out",
  "staffPinTitle": "Student PIN",
  "staffPinBody": "The PIN is set in TechWorks, not on this Chromebook. A student picks their alias, then types the code and that PIN.",
  "staffKeyLabel": "TechWorks desk key",
  "staffUnlockTab": "Unlock this tab",
  "staffKeyHint": "Paste the Cloud desk key. First save claims the door if nobody has yet.",
  "finePrintGrown": "KuliNet is a set of free learning apps made by a teacher for Technology Education students at Solvay Middle School (grades 6–8) in Solvay, New York. This page explains who owns what, credits, student data, and how to reach us.",
  "fineMade": "Made Here",
  "fineMadeKid": "Mr. Kulibert and his helper bots built these apps for our class. They're free, and nobody is selling anything here.",
  "fineNotTheirs": "Not Theirs",
  "fineNotTheirsKid": "Bertopia is a block-building game, but it isn't Minecraft or Roblox. We're not connected to those games. Berty is our own character.",
  "finePrivacy": "Your Privacy",
  "finePrivacyKid": "You use a code name, not your real name. Don't type your real name, address, phone, or passwords. Only Mr. Kulibert knows which code name is yours.",
  "fineSchool": "School Use",
  "fineSchoolKid": "These apps are for class. Use them for school work and be kind.",
  "fineProgress": "Work in Progress",
  "fineProgressKid": "We keep building and fixing these apps, so sometimes things break or change. If something looks weird, tell Mr. Kulibert.",
  "fineCreations": "Student Creations",
  "fineCreationsKid": "What you make belongs to you. The class can see and remix it, and you get credit by your code name.",
  "fineKind": "Be Kind",
  "fineKindKid": "Only share things that are kind, school-appropriate, and made by you or the class.",
  "fineQuestions": "Questions?",
  "fineQuestionsKid": "Questions or worries? Talk to Mr. Kulibert or a grown-up you trust.",
  "fineMadeGrown": "The KuliNet apps are free learning tools a teacher made for class. No ads, no purchases, nothing for sale.",
  "fineNotTheirsGrown": "KuliNet is not connected to Minecraft, Roblox, or any other company. Those names belong to their owners.",
  "finePrivacyGrown": "Students use a class code and an alias, not their real names. Don't type your real name or passwords.",
  "fineSchoolGrown": "These apps are for class work. Use them for school and be kind.",
  "fineProgressGrown": "The apps keep changing. Work saved only in the browser can be lost. Keep a copy of anything important.",
  "fineCreationsGrown": "What you make is yours. The class can see and remix it, and you get credit by your code name.",
  "staffLockedChip": "Locked · Cloud desk key",
  "staffStep1": "Not a class tile. Staff on a Chromebook is only a local switch.",
  "staffStep2": "Cloud desk key. Same 12-character key. SHA-256 in the browser. First save claims the door.",
  "staffStep3": "This tab only. Close the tab, it locks. Nothing stored on student machines.",
  "staffTabTitle": "Room desk · The Tech Room",
  "staffLockHelp": "Staff page. Unlock with the desk key.",
  "testModeHelp": "Test mode is for staff. Kids never see it.",
  "lbTitle": "Leaderboards",
  "lbPickAlias": "Pick an alias",
  "lbMyBest": "My best",
  "lbClassRecord": "Class record",
  "lbBeat": "Beat it",
  "lbTook": "You took #1",
  "lbTaken": "Your record was taken",
  "lbHeld": "Records you hold",
  "lbTabMy": "My bests",
  "lbTabClass": "Class",
  "lbTabSchool": "School",
  "lbTabWeek": "This week",
  "lbMyRank": "My rank",
  "lbHelpBtn": "Help",
  "lbHelpTitle": "Leaderboards and your stats",
  "lbHelp1": "Find your best on the game tile.",
  "lbHelp2": "Tap Beat it to open that board.",
  "lbHelp3": "My bests is you. Class and School show the top 10. This week starts Monday.",
  "lbHelp4": "A teacher can hide a tab or an alias.",
  "lbAliasHelp": "Pick a name from the list. Typed names are not saved.",
  "bbCanvasHelp": "Screen readers hear the job name, then the goal, win, or miss.",
  "lessItem": "Less {name}",
  "moreItem": "More {name}",
  "hkStepperHelp": "Minus and plus say which item they change.",
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
  "blurbBloxbert": "Build a world",
  "blurbAlice": "Help Alice guard the pups",
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
  "openOld": "Open my old world",
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
  "whatsNewBody": "A tap on a Bed, Oven, Box, Counter or Woodshop opens it. Crouch to build beside it, and a 3-star Bed keeps its design.",
  "world": "World",
  "graphics": "Graphics",
  "gfxLiteHint": "Flat sky. Lamps glow only.",
  "gfxNormal": "Normal",
  "gfxNormalHint": "Soft sky and warm lamps.",
  "gfxFancy": "Fancy",
  "gfxFancyHint": "Corner shade and swaying plants.",
  "vdHoldHelp": "Hold Run and Jump to keep going. The buttons fit on every phone.",
  "vdLive3": "3",
  "vdLive2": "2",
  "vdLive1": "1",
  "vdLiveGo": "Go",
  "vdLiveVexCheck": "VEX checkpoint",
  "vdLiveRioCheck": "RIO checkpoint",
  "vdLiveVexBack": "VEX back to checkpoint",
  "vdLiveRioBack": "RIO back to checkpoint",
  "vdLiveVexWin": "VEX takes the flag, {time} seconds, {coins} coins",
  "vdLiveRioWin": "RIO takes the flag, {time} seconds, {coins} coins",
  "vdLivePaused": "Paused",
  "vdLiveResumed": "Resumed",
  "vdShapeHelp": "VEX is a circle with V. RIO is a square with R. A sign tells you when someone goes back to a checkpoint.",
  "vdHeldHelp": "Hold a pad to keep moving. A held pad lights up and shows its word.",
  "vdPadOn": "On",
  "vdChipHelp": "VEX is a circle with V, RIO is a square with R — on the track and on the score chips.",
  "vdLobbyKicker": "Local circuit",
  "vdLobbyTag": "Two runners. One flag. First touch takes the heat.",
  "vdHeat1": "Heat 1",
  "vdHeat2": "Heat 2",
  "vdHeat3": "Heat 3",
  "vdNameQualifier": "Qualifier",
  "vdNameOverpass": "Overpass",
  "vdNameFinals": "Finals",
  "vdBlurbQualifier": "A clean opener. One shuttle over the pit, then saws and spikes to the flag.",
  "vdBlurbOverpass": "Laser trips, a moving lift, and a raised lane before the flag.",
  "vdBlurbFinals": "Three shuttles, a laser gate, and a saw on the closing straight.",
  "vdNoTime": "No time yet",
  "vdBest": "Best {time} · {name}",
  "vdHelpBtn": "Help",
  "vdTouchPads": "Touch pads",
  "vdHidePads": "Hide pads",
  "vdWordRun": "run",
  "vdWordJump": "jump",
  "vdWordDrop": "drop through",
  "rfHelpLesson": "Read the lesson line when you win.",
  "rfHelpFewer": "Try to win with fewer ramps.",
  "rfHelpPause": "Pause is always easy to tap, even sideways.",
  "rfTestHelp": "Staff only: with Test mode on, Jump to win or lose; scores go to the TEST board.",
  "rfLv5": "Pick the path",
  "rfWall": "Wall",
  "rfLesson5": "Same ramp, different pour. Grains like a hill. Water needs the lip.",
  "rfHelpPour5": "Pick Grains or Water. Only one pours at a time.",
  "vdHazardHelp": "Hazards send you back to your checkpoint. Restart resets the whole heat. Double-jump the wide gaps.",
  "vdClose": "Close",
  "vdMute": "Mute",
  "vdSoundOn": "Sound on",
  "vdUnmute": "Unmute",
  "vdPause": "Pause",
  "vdResume": "Resume",
  "vdRestart": "Restart",
  "vdRestartHeat": "Restart heat",
  "vdLeft": "Left",
  "vdRight": "Right",
  "vdJump": "Jump",
  "vdAriaVexLeft": "VEX left",
  "vdAriaVexRight": "VEX right",
  "vdAriaVexJump": "VEX jump",
  "vdAriaRioLeft": "RIO left",
  "vdAriaRioRight": "RIO right",
  "vdAriaRioJump": "RIO jump",
};
  var FILES = { en: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1, simple: 1 };
  var packs = { en: EN };
  var pending = {};
  var warned = Object.create(null);
  function fileFor(lang) {
    if (!lang || !FILES[lang]) return "en";
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
  var fetched = Object.create(null);
  function load(name, cb) {
    if (fetched[name]) { if (cb) cb(); return; }
    if (pending[name]) { pending[name].push(cb || function () {}); return; }
    pending[name] = cb ? [cb] : [];
    function take(data) {
      if (data && typeof data === "object") {
        packs[name] = Object.assign({}, packs[name] || {}, data);
        try { sessionStorage.setItem("kulibert-i18n-v30:" + name, JSON.stringify(packs[name])); } catch (e3) {}
      }
      fetched[name] = 1;
      finish(name);
    }
    var cached = "";
    try { cached = sessionStorage.getItem("kulibert-i18n-v30:" + name) || ""; } catch (e) {}
    if (cached) {
      try {
        var parsed = JSON.parse(cached);
        if (parsed && typeof parsed === "object") { take(parsed); return; }
      } catch (e2) {}
    }
    var origin = "https://apps.kulibert.net";
    try {
      var tags = document.querySelectorAll("script[src*='kulibert-i18n.js']");
      var src = tags.length ? tags[tags.length - 1].src : "";
      if (src) origin = new URL(src, location.href).origin;
    } catch (eOrigin) {}
    fetch(origin + "/shared/i18n/" + name + ".json?v=VD-1.0.10", { credentials: "omit", cache: "no-store" }).then(function (res) {
      return res.ok ? res.json() : null;
    }).then(take).catch(function () { take(null); });
  }
  function ready(lang, cb) {
    var file = fileFor(lang || current());
    var jobs = [];
    if (!fetched[file]) jobs.push(file);
    if (file !== "en" && !fetched.en) jobs.push("en");
    if (!jobs.length) { if (cb) cb(); return; }
    var done = 0;
    function one() { done += 1; if (done >= jobs.length && cb) cb(); }
    jobs.forEach(function (n) { load(n, one); });
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
