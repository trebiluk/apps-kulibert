/* Ramp & Fill RF 1.0.0 — L1 First Ramp, grains only. No trackers. */
(function () {
  var VERSION = "RF 1.0.0";
  var LINE = 36;
  var LIVE_CAP = 300;
  var STR = {
    en: {
      menu: "Menu", close: "Close", pause: "Pause", resume: "Resume", draw: "Draw", erase: "Erase", undo: "Undo", clear: "Clear", pour: "Pour", retry: "Retry",
      lesson: "Steeper = faster. Smoother = neater. Thick gel needs a bigger hill.",
      ghost: "Draw a ramp like this", clearAsk: "Erase all ramps?", yes: "Yes", no: "No",
      grains: "Grains", fillTo: "fill to here",
      empty: "Cup: empty", little: "Cup: a little in", half: "Cup: almost half full", moreHalf: "Cup: more than half", almost: "Cup: almost full", done: "Cup: filled to the line",
      noSpill: "nothing spilled", bitSpill: "a little spilled", someSpill: "some spilled",
      spill: "It spilled here — try a flatter ramp.",
      filled: "Filled it!", repour: "Re-pour", next: "Next", more: "can you fill more?",
      you: "You: #", noneRank: "You: #—", contest: "Contest is off.", top: "Top 10", alias: "Alias",
      whats: "RF 1.0.0 — Ramp & Fill is here: draw a ramp, pour the grains, fill the cup!",
      whatsNew: "What's new", help: "Help",
      helpDraw: "Draw a ramp like the dotted guide.",
      helpPour: "Press Pour. Grains slide into the cup.",
      helpSpill: "A spill stays circled. Flatten the ramp and try again. Ramps stay on Retry.",
      read: "Read it to me", language: "Language",
      firstDone: "First ramp done.", again: "Play this ramp again", paused: "Paused",
      local: "Aliases and cup pictures stay on this Chromebook. No names. No chat.",
      canvas: "Draw a ramp from the grains to the cup."
    },
    uk: {
      menu: "Меню", close: "Закрити", pause: "Пауза", resume: "Далі", draw: "Малюй", erase: "Сотри", undo: "Назад", clear: "Прибери", pour: "Лий", retry: "Ще раз",
      lesson: "Крутіше = швидше. Рівніше = охайніше. Густому гелю треба більший пагорб.",
      ghost: "Намалюй схил ось так", clearAsk: "Стерти всі схили?", yes: "Так", no: "Ні",
      grains: "Зерна", fillTo: "лий до сюди",
      empty: "Чашка: порожня", little: "Чашка: трохи є", half: "Чашка: майже половина", moreHalf: "Чашка: більше половини", almost: "Чашка: майже повна", done: "Чашка: до лінії",
      noSpill: "нічого не розлилось", bitSpill: "трохи розлилось", someSpill: "дещо розлилось",
      spill: "Тут розлилося — спробуй пологіший схил.",
      filled: "Наповнив!", repour: "Лий знову", next: "Далі", more: "зможеш наповнити ще?",
      you: "Ти: #", noneRank: "Ти: #—", contest: "Змагання вимкнено.", top: "Топ 10", alias: "Псевдонім",
      whats: "RF 1.0.0 — Ramp & Fill: малюй схил, лий і наповнюй чашки.",
      whatsNew: "Що нового", help: "Допомога",
      helpDraw: "Намалюй схил по крапках.",
      helpPour: "Натисни Лий. Зерна котяться в чашку.",
      helpSpill: "Розлив лишається в колі. Зроби схил пологішим. На Ще раз схили лишаються.",
      read: "Прочитай мені", language: "Мова",
      firstDone: "Перший схил готовий.", again: "Зіграй цей схил знову", paused: "Пауза",
      local: "Псевдоніми й чашки лишаються на цьому Chromebook. Без імен. Без чату.",
      canvas: "Намалюй схил від зерен до чашки."
    },
    ru: {
      menu: "Меню", close: "Закрыть", pause: "Пауза", resume: "Дальше", draw: "Рисуй", erase: "Сотри", undo: "Назад", clear: "Убери", pour: "Лей", retry: "Ещё раз",
      lesson: "Круче = быстрее. Ровнее = аккуратнее. Густому гелю нужен холм побольше.",
      ghost: "Нарисуй склон вот так", clearAsk: "Стереть все склоны?", yes: "Да", no: "Нет",
      grains: "Зёрна", fillTo: "лей до сюда",
      empty: "Чашка: пустая", little: "Чашка: чуть-чуть", half: "Чашка: почти половина", moreHalf: "Чашка: больше половины", almost: "Чашка: почти полная", done: "Чашка: до линии",
      noSpill: "ничего не пролилось", bitSpill: "немного пролилось", someSpill: "часть пролилась",
      spill: "Здесь пролилось — попробуй более пологий склон.",
      filled: "Наполнил!", repour: "Лей снова", next: "Дальше", more: "сможешь наполнить ещё?",
      you: "Ты: #", noneRank: "Ты: #—", contest: "Состязание выключено.", top: "Топ 10", alias: "Псевдоним",
      whats: "RF 1.0.0 — Ramp & Fill: рисуй склон, лей и наполняй чашки.",
      whatsNew: "Что нового", help: "Помощь",
      helpDraw: "Нарисуй склон по точкам.",
      helpPour: "Нажми Лей. Зёрна скатываются в чашку.",
      helpSpill: "Пролив остаётся в круге. Сделай склон положе. На Ещё раз склоны остаются.",
      read: "Прочитай мне", language: "Язык",
      firstDone: "Первый склон готов.", again: "Сыграй этот склон снова", paused: "Пауза",
      local: "Псевдонимы и чашки остаются на этом Chromebook. Без имён. Без чата.",
      canvas: "Нарисуй склон от зёрен к чашке."
    },
    es: {
      menu: "Menú", close: "Cerrar", pause: "Pausa", resume: "Seguir", draw: "Dibuja", erase: "Borra", undo: "Deshacer", clear: "Limpiar", pour: "Vierte", retry: "Otra vez",
      lesson: "Más pendiente = más rápido. Más liso = más limpio. El gel espeso necesita una colina más grande.",
      ghost: "Dibuja una rampa así", clearAsk: "¿Borrar todas las rampas?", yes: "Sí", no: "No",
      grains: "Granos", fillTo: "llena hasta aquí",
      empty: "Taza: vacía", little: "Taza: un poquito", half: "Taza: casi la mitad", moreHalf: "Taza: más de la mitad", almost: "Taza: casi llena", done: "Taza: hasta la línea",
      noSpill: "nada se derramó", bitSpill: "un poco se derramó", someSpill: "algo se derramó",
      spill: "Se derramó aquí — prueba una rampa más plana.",
      filled: "¡La llenaste!", repour: "Verter otra vez", next: "Siguiente", more: "¿puedes llenar más?",
      you: "Tú: #", noneRank: "Tú: #—", contest: "El concurso está apagado.", top: "Top 10", alias: "Alias",
      whats: "RF 1.0.0 — Ramp & Fill: dibuja una rampa, vierte y llena las tazas.",
      whatsNew: "Novedades", help: "Ayuda",
      helpDraw: "Dibuja una rampa como la guía de puntos.",
      helpPour: "Pulsa Vierte. Los granos bajan a la taza.",
      helpSpill: "El derrame queda en un círculo. Aplana la rampa. Otra vez deja las rampas.",
      read: "Léemelo", language: "Idioma",
      firstDone: "Primera rampa lista.", again: "Juega esta rampa otra vez", paused: "Pausa",
      local: "Los alias y las tazas se quedan en este Chromebook. Sin nombres. Sin chat.",
      canvas: "Dibuja una rampa desde los granos hasta la taza."
    },
    ar: {
      menu: "القائمة", close: "إغلاق", pause: "إيقاف", resume: "متابعة", draw: "ارسم", erase: "امسح", undo: "تراجع", clear: "امسح الكل", pour: "اسكب", retry: "أعد",
      lesson: "الأكثر انحدارًا = أسرع. الأكثر نعومة = أنظف. الجل السميك يحتاج تلًا أكبر.",
      ghost: "ارسم منحدرًا هكذا", clearAsk: "مسح كل المنحدرات؟", yes: "نعم", no: "لا",
      grains: "حبوب", fillTo: "املأ إلى هنا",
      empty: "الكوب: فارغ", little: "الكوب: قليل", half: "الكوب: قريب من النصف", moreHalf: "الكوب: أكثر من النصف", almost: "الكوب: قريب من الامتلاء", done: "الكوب: حتى الخط",
      noSpill: "لا انسكاب", bitSpill: "انسكاب قليل", someSpill: "بعض الانسكاب",
      spill: "انسكب هنا — جرّب منحدرًا أقل انحدارًا.",
      filled: "امتلأ!", repour: "اسكب مرة أخرى", next: "التالي", more: "هل تملأ المزيد؟",
      you: "أنت: #", noneRank: "أنت: #—", contest: "المسابقة متوقفة.", top: "أفضل 10", alias: "اسم مستعار",
      whats: "RF 1.0.0 — Ramp & Fill: ارسم منحدرًا، اسكب واملأ الأكواب.",
      whatsNew: "ما الجديد", help: "مساعدة",
      helpDraw: "ارسم منحدرًا مثل الدليل المنقط.",
      helpPour: "اضغط اسكب. الحبوب تنزلق إلى الكوب.",
      helpSpill: "الانسكاب يبقى في دائرة. اجعل المنحدر أقل ميلًا. إعادة تبقي المنحدرات.",
      read: "اقرأه لي", language: "اللغة",
      firstDone: "المنحدر الأول تم.", again: "العب هذا المنحدر مرة أخرى", paused: "متوقف",
      local: "الأسماء المستعارة والأكواب تبقى على هذا الجهاز. بلا أسماء حقيقية. بلا دردشة.",
      canvas: "ارسم منحدرًا من الحبوب إلى الكوب."
    },
    "fa-AF": {
      menu: "فهرست", close: "بستن", pause: "مکث", resume: "ادامه", draw: "بکش", erase: "پاک کن", undo: "برگرد", clear: "پاک همه", pour: "بریز", retry: "دوباره",
      lesson: "تندتر = تیزتر. هموارتر = پاکیزه‌تر. ژل غلیظ تپه بزرگ‌تر می‌خواهد.",
      ghost: "یک سرازیری این‌طور بکش", clearAsk: "همه سرازیری‌ها پاک شود؟", yes: "بله", no: "نه",
      grains: "دانه‌ها", fillTo: "تا اینجا پر کن",
      empty: "پیاله: خالی", little: "پیاله: کمی", half: "پیاله: نزدیک نیمه", moreHalf: "پیاله: بیشتر از نیمه", almost: "پیاله: نزدیک پر", done: "پیاله: تا خط",
      noSpill: "چیزی نریخت", bitSpill: "کمی ریخت", someSpill: "مقداری ریخت",
      spill: "اینجا ریخت — یک سرازیری تخت‌تر را امتحان کن.",
      filled: "پر شد!", repour: "دوباره بریز", next: "بعدی", more: "می‌توانی بیشتر پر کنی؟",
      you: "تو: #", noneRank: "تو: #—", contest: "مسابقه خاموش است.", top: "ده تای برتر", alias: "نام مستعار",
      whats: "RF 1.0.0 — Ramp & Fill: یک سرازیری بکش، بریز و پیاله‌ها را پر کن.",
      whatsNew: "تازه‌ها", help: "کمک",
      helpDraw: "سرازیری را مثل نقطه‌ها بکش.",
      helpPour: "بریز را بزن. دانه‌ها به پیاله می‌لغزند.",
      helpSpill: "ریختن در دایره می‌ماند. سرازیری را تخت‌تر کن. دوباره سرازیری‌ها را نگه می‌دارد.",
      read: "برایم بخوان", language: "زبان",
      firstDone: "سرازیری اول تمام شد.", again: "این سرازیری را دوباره بازی کن", paused: "مکث",
      local: "نام‌های مستعار و پیاله‌ها روی همین دستگاه می‌مانند. نام واقعی نیست. گفتگو نیست.",
      canvas: "از دانه‌ها تا پیاله یک سرازیری بکش."
    },
    rw: {
      menu: "Ibikubiyemo", close: "Funga", pause: "Hagarara", resume: "Komeza", draw: "Shushanya", erase: "Siba", undo: "Subira", clear: "Siba byose", pour: "Suka", retry: "Ongera",
      lesson: "Gupfuka = kwihuta. Gukora neza = gutunganya. Gel y'ubukoko isaba umusozi munini.",
      ghost: "Shushanya umuhengamo utya", clearAsk: "Siba imihengamo yose?", yes: "Yego", no: "Oya",
      grains: "Ibinyanye", fillTo: "uzuza kugeza hano",
      empty: "Igikombe: kirimo ubusa", little: "Igikombe: gito", half: "Igikombe: hafi kimwe cya kabiri", moreHalf: "Igikombe: kirenze kimwe cya kabiri", almost: "Igikombe: hafi kuzura", done: "Igikombe: kugeza ku murongo",
      noSpill: "ntacyasutse", bitSpill: "gito cyasutse", someSpill: "bimwe byasutse",
      spill: "Byasutse hano — gerageza umuhengamo utoroshye.",
      filled: "Cyuzuye!", repour: "Suka ukundi", next: "Ikurikira", more: "waba ushobora kwuzuza ibindi?",
      you: "Wowe: #", noneRank: "Wowe: #—", contest: "Amarushanwa afunze.", top: "10 za mbere", alias: "Izina ry'akazi",
      whats: "RF 1.0.0 — Ramp & Fill: shushanya umuhengamo, suka kandi wuzuz ibikombe.",
      whatsNew: "Ibishya", help: "Ubufasha",
      helpDraw: "Shushanya umuhengamo nka utudomo.",
      helpPour: "Kanda Suka. Ibinyanye bigera mu gikombe.",
      helpSpill: "Ibyasutse biguma mu ruziga. Toroza umuhengamo. Ongera bisiga imihengamo.",
      read: "Nsome", language: "Ururimi",
      firstDone: "Umuhengamo wa mbere warangiye.", again: "Kina uyu muhengamo ukundi", paused: "Byahagaze",
      local: "Amazina y'akazi n'ibikombe biguma kuri iki gikoresho. Nta mazina y'ukuri. Nta kiganiro.",
      canvas: "Shushanya umuhengamo uva ku binyanye ugera ku gikombe."
    },
    ti: {
      menu: "ዝርዝር", close: "ዕጸው", pause: "ደው", resume: "ቀጽል", draw: "ስኣል", erase: "ደምስስ", undo: "ምለስ", clear: "ኩሉ ደምስስ", pour: "ቀድሕ", retry: "ደጊም",
      lesson: "ዝቐነዐ = ዝቕልጥፍ። ዝለመመ = ዝጽሩይ። ሕማቕ ጀል ዓቢ ኮረብታ የድሊ።",
      ghost: "ቁልቁለት ከምዚ ስኣል", clearAsk: "ኩሎም ቁልቁለታት ይደምሰሱ?", yes: "እወ", no: "ኣይፋል",
      grains: "እኽሊ", fillTo: "ክሳብ ኣብዚ ምላእ",
      empty: "ኽባያ: ባዶ", little: "ኽባያ: ቁሩብ", half: "ኽባያ: ዳርጋ ፍርቂ", moreHalf: "ኽባያ: ልዕሊ ፍርቂ", almost: "ኽባያ: ዳርጋ መሊኡ", done: "ኽባያ: ክሳብ መስመር",
      noSpill: "ዝፈሰሰ የለን", bitSpill: "ቁሩብ ፈሲሱ", someSpill: "ገለ ፈሲሱ",
      spill: "ኣብዚ ፈሲሱ — ዝተዓርየ ቁልቁለት ፈትን።",
      filled: "መሊኡ!", repour: "ደጊምካ ቀድሕ", next: "ዝቕጽል", more: "ተወሳኺ ክትመልእ ትኽእል ዲኻ?",
      you: "ንስኻ: #", noneRank: "ንስኻ: #—", contest: "ውድድር ጠፊኡ።", top: "ላዕለዎት 10", alias: "ሕጉስ ስም",
      whats: "RF 1.0.0 — Ramp & Fill: ቁልቁለት ስኣል፣ ቀድሕን ንኽባያታት መልእን።",
      whatsNew: "ሓድሽ", help: "ሓገዝ",
      helpDraw: "ቁልቁለት ከም ነጥብታት ስኣል።",
      helpPour: "ቀድሕ ጠውቕ። እኽሊ ናብ ኽባያ ይንሸራተት።",
      helpSpill: "ዝፈሰሰ ኣብ ዓንኬል ይጸንሕ። ቁልቁለት ኣዕርዮ። ደጊም ቁልቁለታት ይሕልዉ።",
      read: "ኣንብበለይ", language: "ቋንቋ",
      firstDone: "ቀዳማይ ቁልቁለት ተዛዚሙ።", again: "ነዚ ቁልቁለት ደጊምካ ጻወት", paused: "ደው ኢሉ",
      local: "ሕጉስ ስምን ኽባያታትን ኣብዚ መሳርሒ ይጸንሑ። ናይ ብሓቂ ስም የለን። ዕላል የለን።",
      canvas: "ካብ እኽሊ ናብ ኽባያ ቁልቁለት ስኣል።"
    }
  };
  var LANGS = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
  var LABELS = { en: "English", uk: "Українська", ru: "Русский", es: "Español", ar: "العربية", "fa-AF": "دری", rw: "Ikinyarwanda", ti: "ትግርኛ" };

  var canvas = document.getElementById("board");
  var ctx = canvas.getContext("2d");
  var strokes = [];
  var undo = [];
  var live = [];
  var spillSpots = [];
  var fill = 0;
  var spill = 0;
  var tool = "draw";
  var pouring = false;
  var spawnLeft = 0;
  var spawnWait = 0;
  var paused = false;
  var ended = false;
  var filledOnce = false;
  var counted = false;
  var cups = 0;
  var mass = 1;
  var spawnGap = 0.045;
  var fps = 60;
  var fpsMin = 60;
  var fpsFrames = 0;
  var fpsAcc = 0;
  var startedAt = 0;
  var viewW = 800;
  var viewH = 500;
  var ghost = [];
  var cup = { x: 80, y: 200, w: 120, h: 140, top: 200 };
  var spout = { x: 500, y: 80 };
  var pointer = null;
  var drawing = null;
  var erasing = false;
  var lastT = 0;
  var reduced = false;

  function lang() {
    var v = document.documentElement.getAttribute("data-kp-lang") || "";
    if (STR[v]) return v;
    try {
      if (window.KulibertPrefs && STR[window.KulibertPrefs.lang]) return window.KulibertPrefs.lang;
    } catch (e) {}
    return "en";
  }
  function t(k) {
    var pack = STR[lang()] || STR.en;
    return pack[k] || STR.en[k] || "";
  }
  function motionLess() {
    if (document.documentElement.getAttribute("data-kp-motion") === "less") return true;
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function paintText() {
    reduced = motionLess();
    var L = lang();
    document.documentElement.lang = L === "fa-AF" ? "fa" : L;
    document.documentElement.dir = (L === "ar" || L === "fa-AF") ? "rtl" : "ltr";
    document.querySelectorAll("[data-k]").forEach(function (el) {
      var key = el.getAttribute("data-k");
      if (STR.en[key]) el.textContent = t(key);
    });
    var body = document.getElementById("whats-body");
    if (body) body.textContent = t("whats");
    canvas.setAttribute("aria-label", t("canvas"));
    paintStatus();
    paintCups();
    paintRank();
  }
  function cupWords() {
    var r = fill / LINE;
    var cupBit = t("empty");
    if (fill > 0 && r < 0.28) cupBit = t("little");
    else if (r >= 0.28 && r < 0.55) cupBit = t("half");
    else if (r >= 0.55 && r < 0.85) cupBit = t("moreHalf");
    else if (r >= 0.85 && r < 1) cupBit = t("almost");
    else if (r >= 1) cupBit = t("done");
    var sp = t("noSpill");
    if (spill > 0 && spill < 8) sp = t("bitSpill");
    else if (spill >= 8) sp = t("someSpill");
    return cupBit + " • " + sp;
  }
  function paintStatus() {
    var el = document.getElementById("status");
    if (el) el.textContent = cupWords();
    var spillEl = document.getElementById("spill-line");
    if (spillEl) spillEl.textContent = spill > 0 && !pouring && live.length === 0 && fill < LINE ? t("spill") : "";
  }
  function loadCups() {
    try { cups = Math.max(0, parseInt(localStorage.getItem("rampfill-cups") || "0", 10) || 0); } catch (e) { cups = 0; }
  }
  function saveCups() {
    try { localStorage.setItem("rampfill-cups", String(cups)); } catch (e) {}
  }
  function board() {
    try { return JSON.parse(localStorage.getItem("rampfill-board") || "[]"); } catch (e) { return []; }
  }
  function saveBoard(rows) {
    try { localStorage.setItem("rampfill-board", JSON.stringify(rows.slice(0, 10))); } catch (e) {}
  }
  function alias() {
    try {
      var who = window.KulibertWho && window.KulibertWho.read && window.KulibertWho.read();
      if (who && who.alias) return String(who.alias).slice(0, 24);
    } catch (e) {}
    try { return (localStorage.getItem("rampfill-alias") || "").slice(0, 24); } catch (e2) { return ""; }
  }
  function setAlias(v) {
    var s = String(v || "").replace(/[<>]/g, "").trim().slice(0, 24);
    try { localStorage.setItem("rampfill-alias", s); } catch (e) {}
    noteScore();
    paintRank();
  }
  function noteScore() {
    var name = alias();
    if (!name) return;
    var rows = board().filter(function (r) { return r && r.alias !== name; });
    rows.push({ alias: name, n: cups });
    rows.sort(function (a, b) { return b.n - a.n; });
    saveBoard(rows);
    paintRank();
  }
  function paintCups() {
    var box = document.getElementById("cups");
    var count = document.getElementById("count");
    if (!box) return;
    box.replaceChildren();
    var show = Math.min(cups, 8);
    for (var i = 0; i < show; i++) {
      var img = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      img.setAttribute("viewBox", "0 0 48 52");
      img.setAttribute("class", "cup-pic");
      img.setAttribute("aria-hidden", "true");
      img.innerHTML = '<path d="M10 14 H38 L34 46 H14 Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="2"/><path d="M14 22 H34" stroke="#1A120C" stroke-width="3"/><path d="M16 28 H32 L30 44 H18 Z" fill="#E0A106"/>';
      box.appendChild(img);
    }
    if (count) count.textContent = cups > 0 ? String(cups) : "";
  }
  function paintRank() {
    var el = document.getElementById("rank");
    var list = document.getElementById("top");
    var rows = board().slice().sort(function (a, b) { return (b.n || 0) - (a.n || 0); }).slice(0, 10);
    if (list) {
      list.replaceChildren();
      rows.forEach(function (r) {
        var li = document.createElement("li");
        li.textContent = (r.alias || "") + " · " + (r.n || 0);
        list.appendChild(li);
      });
    }
    if (!el) return;
    var name = alias();
    if (!name) { el.textContent = t("noneRank"); return; }
    var rank = 0;
    rows.forEach(function (r, i) { if (r.alias === name) rank = i + 1; });
    el.textContent = rank ? t("you") + rank : t("noneRank");
    var input = document.getElementById("alias");
    if (input && document.activeElement !== input) input.value = name;
  }
  function syncModal() {
    var open = !document.getElementById("menu").hidden || !document.getElementById("pause-layer").hidden || !document.getElementById("ask").hidden || !document.getElementById("endcard").hidden;
    if (open) document.documentElement.setAttribute("data-kb-modal-open", "1");
    else document.documentElement.removeAttribute("data-kb-modal-open");
  }
  function layout() {
    var r = canvas.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    viewW = r.width;
    viewH = r.height;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var tall = viewH > viewW * 1.05;
    var short = viewH < 280;
    var cw = Math.max(78, Math.min(150, viewW * (tall ? 0.42 : 0.18)));
    var ch = Math.max(short ? 70 : 96, Math.min(short ? 110 : 190, viewH * (short ? 0.42 : 0.46)));
    var cx = Math.max(18, viewW * (tall ? 0.12 : 0.16));
    var bottom = viewH - 18;
    cup = { x: cx, y: bottom - ch, w: cw, h: ch, top: bottom - ch };
    spout = {
      x: Math.min(viewW - 36, Math.max(cup.x + cup.w + 80, viewW * (tall ? 0.72 : 0.78))),
      y: Math.max(28, viewH * (short ? 0.08 : 0.12))
    };
    ghost = [];
    var x0 = spout.x - 6;
    var y0 = spout.y + 8;
    var x1 = cup.x + cup.w * 0.52;
    var y1 = cup.top + Math.min(28, cup.h * 0.22);
    var n = 16;
    for (var i = 0; i <= n; i++) {
      var u = i / n;
      ghost.push({
        x: x0 + (x1 - x0) * u,
        y: y0 + (y1 - y0) * (u * 0.72 + u * u * 0.28)
      });
    }
  }
  function denorm(p) { return { x: p.x * viewW, y: p.y * viewH }; }
  function norm(p) { return { x: p.x / viewW, y: p.y / viewH }; }
  function worldStrokes() {
    return strokes.map(function (s) { return s.map(denorm); });
  }
  function pushUndo() {
    undo.push(JSON.stringify(strokes));
    if (undo.length > 40) undo.shift();
  }
  function doUndo() {
    if (!undo.length || pouring) return;
    strokes = JSON.parse(undo.pop());
  }
  function insideCup(x, y) {
    return x > cup.x + 10 && x < cup.x + cup.w - 10 && y > cup.top + 4 && y < cup.y + cup.h - 6;
  }
  function nearestStroke(sx, sy) {
    var list = worldStrokes();
    var best = -1;
    var bestD = 140;
    for (var i = 0; i < list.length; i++) {
      if (list[i].length < 2) continue;
      var p = list[i][0];
      var d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }
  function capture(units, x, y) {
    fill += units;
    if (fill > LINE + 12) fill = LINE + 12;
  }
  function dropSpill(units, x, y) {
    spill += units;
    spillSpots.push({ x: x, y: y, n: units });
  }
  function releaseParticle(p) {
    p.mode = "free";
  }
  function settleFree(p) {
    if (insideCup(p.x, p.y) || (p.x > cup.x + 6 && p.x < cup.x + cup.w - 6 && p.y >= cup.top && p.y < cup.y + cup.h)) capture(p.mass, p.x, p.y);
    else dropSpill(p.mass, Math.max(12, Math.min(viewW - 12, p.x)), Math.min(viewH - 14, p.y));
  }
  function stepFollow(p, dt) {
    var list = worldStrokes();
    var stroke = list[p.stroke];
    if (!stroke || stroke.length < 2) { releaseParticle(p); return; }
    var left = p.speed * dt;
    var guard = 0;
    while (left > 0 && guard++ < 8) {
      if (p.si >= stroke.length - 1) { releaseParticle(p); p.x = stroke[stroke.length - 1].x; p.y = stroke[stroke.length - 1].y; return; }
      var A = stroke[p.si];
      var B = stroke[p.si + 1];
      var dx = B.x - A.x;
      var dy = B.y - A.y;
      var len = Math.hypot(dx, dy) || 0.001;
      var remain = (1 - p.u) * len;
      var slope = Math.min(1, Math.abs(dy) / len);
      p.speed = 120 + slope * 720;
      if (left < remain) {
        p.u += left / len;
        left = 0;
      } else {
        left -= remain;
        p.si += 1;
        p.u = 0;
        if (p.si < stroke.length - 1) {
          var C = stroke[p.si + 1];
          var ang = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(dy, dx);
          while (ang > Math.PI) ang -= Math.PI * 2;
          while (ang < -Math.PI) ang += Math.PI * 2;
          if (Math.abs(ang) > 0.55) p.jitter = (Math.random() - 0.5) * 16 * Math.min(1.2, Math.abs(ang));
        }
      }
      if (p.si >= stroke.length - 1) {
        var end = stroke[stroke.length - 1];
        p.x = end.x;
        p.y = end.y;
        p.vx = (dx / len) * p.speed;
        p.vy = (dy / len) * p.speed;
        releaseParticle(p);
        return;
      }
      var A2 = stroke[p.si];
      var B2 = stroke[p.si + 1];
      p.x = A2.x + (B2.x - A2.x) * p.u + (p.jitter || 0) * 0.25;
      p.y = A2.y + (B2.y - A2.y) * p.u;
      if (insideCup(p.x, p.y)) { capture(p.mass, p.x, p.y); p.dead = true; return; }
    }
  }
  function stepFree(p, dt) {
    p.vy += 1500 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (insideCup(p.x, p.y)) { capture(p.mass, p.x, p.y); p.dead = true; return; }
    if (p.y > viewH - 12 || p.x < 4 || p.x > viewW - 4) { settleFree(p); p.dead = true; }
  }
  function spawnOne() {
    if (live.length >= LIVE_CAP) {
      var old = live.shift();
      settleFree(old);
      return;
    }
    var hit = nearestStroke(spout.x, spout.y + 10);
    var p = {
      x: spout.x - 4,
      y: spout.y + 10,
      vx: -40,
      vy: 30,
      mode: hit < 0 ? "free" : "follow",
      stroke: hit,
      si: 0,
      u: 0,
      speed: 180,
      mass: mass,
      jitter: 0,
      dead: false,
      rot: Math.random() * 6
    };
    if (hit >= 0) {
      var s = worldStrokes()[hit];
      p.x = s[0].x;
      p.y = s[0].y;
    }
    live.push(p);
  }
  function checkFilled() {
    if (filledOnce || fill < LINE) return;
    filledOnce = true;
    document.getElementById("donebar").hidden = false;
    document.getElementById("endcard").hidden = true;
    if (!counted) {
      counted = true;
      cups += 1;
      saveCups();
      noteScore();
      paintCups();
    }
  }
  function resetPour(keepScoreFlag) {
    live = [];
    spillSpots = [];
    fill = 0;
    spill = 0;
    pouring = false;
    spawnLeft = 0;
    filledOnce = false;
    counted = false;
    document.getElementById("donebar").hidden = true;
    if (!keepScoreFlag) document.getElementById("endcard").hidden = true;
    ended = false;
    paintStatus();
  }
  function startPour() {
    if (paused || ended) return;
    if (pouring) return;
    resetPour(true);
    document.getElementById("endcard").hidden = true;
    ended = false;
    pouring = true;
    spawnLeft = Math.max(8, Math.round(48 / mass));
    spawnWait = 0;
  }
  function retry() {
    if (pouring && spawnLeft > 0) return;
    resetPour(false);
  }
  function finishNext() {
    document.getElementById("donebar").hidden = true;
    document.getElementById("endcard").hidden = false;
    ended = true;
    pouring = false;
    syncModal();
  }
  function playAgain() {
    document.getElementById("endcard").hidden = true;
    ended = false;
    resetPour(false);
    syncModal();
  }
  function setTool(next) {
    tool = next;
    document.getElementById("tool-draw").setAttribute("aria-pressed", next === "draw" ? "true" : "false");
    document.getElementById("tool-erase").setAttribute("aria-pressed", next === "erase" ? "true" : "false");
  }
  function pointerPos(e) {
    var r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (viewW / Math.max(1, r.width)),
      y: (e.clientY - r.top) * (viewH / Math.max(1, r.height))
    };
  }
  function eraseAt(x, y) {
    var next = [];
    var changed = false;
    strokes.forEach(function (s) {
      var keep = [];
      var chunk = [];
      s.forEach(function (p) {
        var w = denorm(p);
        if (Math.hypot(w.x - x, w.y - y) < 26) {
          changed = true;
          if (chunk.length > 1) keep.push(chunk);
          chunk = [];
        } else chunk.push(p);
      });
      if (chunk.length > 1) keep.push(chunk);
      keep.forEach(function (c) { next.push(c); });
    });
    if (changed) strokes = next;
    return changed;
  }
  function onDown(e) {
    if (paused || ended || !document.getElementById("ask").hidden) return;
    if (pointer != null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointer = e.pointerId;
    canvas.setPointerCapture(e.pointerId);
    var p = pointerPos(e);
    if (tool === "erase") {
      pushUndo();
      erasing = true;
      eraseAt(p.x, p.y);
      return;
    }
    pushUndo();
    drawing = [norm(p)];
    strokes.push(drawing);
  }
  function onMove(e) {
    if (e.pointerId !== pointer) return;
    var p = pointerPos(e);
    if (erasing) { eraseAt(p.x, p.y); return; }
    if (!drawing) return;
    var last = denorm(drawing[drawing.length - 1]);
    if (Math.hypot(p.x - last.x, p.y - last.y) < 7) return;
    drawing.push(norm(p));
  }
  function onUp(e) {
    if (e.pointerId !== pointer) return;
    pointer = null;
    drawing = null;
    erasing = false;
  }
  function askClear() {
    if (!strokes.length) return;
    document.getElementById("ask").hidden = false;
    syncModal();
    document.getElementById("ask-yes").focus();
  }
  function doClear() {
    pushUndo();
    strokes = [];
    document.getElementById("ask").hidden = true;
    syncModal();
  }
  function setPaused(on) {
    paused = on;
    document.getElementById("pause-layer").hidden = !on;
    syncModal();
    if (on) document.getElementById("resume-btn").focus();
  }
  function toggleMenu(open) {
    var menu = document.getElementById("menu");
    menu.hidden = !open;
    document.getElementById("menu-btn").setAttribute("aria-expanded", open ? "true" : "false");
    syncModal();
    if (open) document.getElementById("menu-close").focus();
  }
  function readAloud() {
    var text = t("whats") + " " + t("lesson") + " " + t("helpDraw") + " " + t("helpPour") + " " + t("helpSpill");
    try {
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function seed(n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.rotate(n.rot || 0);
    ctx.fillStyle = "#E0A106";
    ctx.strokeStyle = "#6B3A12";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, n.s || 5, (n.s || 5) * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#6B3A12";
    ctx.beginPath();
    ctx.arc((n.s || 5) * 0.2, 0, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  function draw() {
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#E7D7B8";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#C4A574";
    ctx.fillRect(0, viewH - 16, viewW, 16);
    ctx.strokeStyle = "#8C6A3A";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, viewH - 16);
    ctx.lineTo(viewW, viewH - 16);
    ctx.stroke();

    if (ghost.length) {
      ctx.save();
      ctx.strokeStyle = "#3E6B4F";
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 10]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ghost.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();
      if (!startedAt) startedAt = performance.now();
      if (performance.now() - startedAt < 5000) {
        var label = t("ghost");
        ctx.fillStyle = "#1A120C";
        ctx.font = "700 18px Barlow, Outfit, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, 12, 22);
      }
    }

    worldStrokes().forEach(function (s) {
      if (s.length < 2) return;
      ctx.strokeStyle = "#8A4B12";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.strokeStyle = "#E7B56A";
      ctx.lineWidth = 8;
      ctx.stroke();
    });

    if (spillSpots.length && !pouring && live.length === 0 && fill < LINE) {
      var sx = 0, sy = 0, sn = 0;
      spillSpots.forEach(function (p) { sx += p.x; sy += p.y; sn++; });
      sx /= sn; sy /= sn;
      ctx.beginPath();
      ctx.strokeStyle = "#8C3A2F";
      ctx.lineWidth = 4;
      ctx.ellipse(sx, sy, 34, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#1A120C";
      ctx.font = "700 16px Barlow, Outfit, sans-serif";
      ctx.textAlign = "center";
      var words = t("spill");
      var maxW = Math.min(280, viewW - 24);
      wrapText(words, sx, Math.min(viewH - 36, sy + 36), maxW, 20);
    }

    ctx.fillStyle = "#8C3A2F";
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cup.x, cup.top + 8);
    ctx.lineTo(cup.x + 8, cup.y + cup.h);
    ctx.lineTo(cup.x + cup.w - 8, cup.y + cup.h);
    ctx.lineTo(cup.x + cup.w, cup.top + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F3E6C8";
    ctx.fillRect(cup.x + 8, cup.top + 10, cup.w - 16, 10);
    var ratio = Math.max(0, Math.min(1, fill / LINE));
    var innerTop = cup.top + 18;
    var innerBot = cup.y + cup.h - 8;
    var pileH = (innerBot - innerTop) * ratio;
    if (pileH > 2) {
      ctx.fillStyle = "#E0A106";
      ctx.beginPath();
      ctx.moveTo(cup.x + 14, innerBot);
      ctx.lineTo(cup.x + cup.w - 14, innerBot);
      ctx.lineTo(cup.x + cup.w - 16, innerBot - pileH);
      ctx.quadraticCurveTo(cup.x + cup.w / 2, innerBot - pileH - 10, cup.x + 16, innerBot - pileH);
      ctx.closePath();
      ctx.fill();
      var dots = Math.min(12, Math.round(4 + ratio * 8));
      for (var d = 0; d < dots; d++) {
        seed({
          x: cup.x + 20 + ((d * 17) % (cup.w - 36)),
          y: innerBot - 8 - (d % 3) * 7 - pileH * 0.15,
          s: 3.2,
          rot: d
        });
      }
    }
    var lineY = cup.top + 18 + (innerBot - innerTop) * 0.08;
    lineY = innerBot - (innerBot - innerTop) * 0.92;
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cup.x + 6, lineY);
    ctx.lineTo(cup.x + cup.w - 6, lineY);
    ctx.stroke();
    ctx.fillStyle = "#1A120C";
    ctx.font = "700 14px Barlow, Outfit, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(t("fillTo"), cup.x + cup.w + 6, lineY + 4);
    ctx.font = "800 16px Barlow, Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillStyle = "#F3E6C8";
    ctx.fillText(t("grains"), cup.x + cup.w / 2, cup.top + cup.h * 0.62);
    for (var c = 0; c < 5; c++) {
      ctx.beginPath();
      ctx.fillStyle = "#F3E6C8";
      ctx.arc(cup.x + 22 + c * 14, cup.top + cup.h * 0.78, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#C47B12";
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(spout.x - 46, spout.y - 36);
    ctx.lineTo(spout.x + 28, spout.y - 36);
    ctx.lineTo(spout.x + 10, spout.y);
    ctx.lineTo(spout.x - 28, spout.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    seed({ x: spout.x - 16, y: spout.y - 18, s: 4, rot: 0.4 });
    seed({ x: spout.x, y: spout.y - 16, s: 4, rot: 1.2 });
    seed({ x: spout.x - 8, y: spout.y - 8, s: 3.5, rot: 2 });
    ctx.fillStyle = "#1A120C";
    ctx.font = "800 14px Barlow, Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(t("grains"), spout.x - 8, spout.y - 42);

    var visual = mass > 1 ? 7 : 5;
    live.forEach(function (p) { seed({ x: p.x, y: p.y, s: visual, rot: p.rot }); });
  }
  function wrapText(text, x, y, maxW, lh) {
    var words = String(text).split(" ");
    var line = "";
    var lines = [];
    words.forEach(function (w) {
      var tryLine = line ? line + " " + w : w;
      if (ctx.measureText(tryLine).width > maxW && line) { lines.push(line); line = w; }
      else line = tryLine;
    });
    if (line) lines.push(line);
    lines.forEach(function (ln, i) { ctx.fillText(ln, x, y + i * lh); });
  }
  function frame(t) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.033, lastT ? (t - lastT) / 1000 : 0.016);
    lastT = t;
    fpsFrames++;
    fpsAcc += dt;
    if (fpsAcc >= 0.5) {
      fps = fpsFrames / fpsAcc;
      fpsFrames = 0;
      fpsAcc = 0;
      if (pouring && fps < fpsMin) fpsMin = fps;
      if (fps < 40 && mass < 3) {
        mass = Math.min(3, mass + 1);
        spawnGap = 0.07;
      }
    }
    if (!paused && !ended && pouring) {
      spawnWait -= dt;
      while (spawnLeft > 0 && spawnWait <= 0 && live.length < LIVE_CAP) {
        spawnOne();
        spawnLeft--;
        spawnWait += spawnGap;
      }
      for (var i = 0; i < live.length; i++) {
        var p = live[i];
        if (p.mode === "follow") stepFollow(p, dt);
        else stepFree(p, dt);
      }
      live = live.filter(function (p) { return !p.dead; });
      if (spawnLeft <= 0 && live.length === 0) {
        pouring = false;
        checkFilled();
      } else checkFilled();
      paintStatus();
    }
    draw();
  }
  function bootLangs() {
    var box = document.getElementById("langs");
    LANGS.forEach(function (code) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = LABELS[code];
      b.lang = code === "fa-AF" ? "fa" : code;
      if (code === "ar" || code === "fa-AF") b.dir = "rtl";
      b.addEventListener("click", function () {
        try { if (window.KulibertPrefs && window.KulibertPrefs.acceptLang) window.KulibertPrefs.acceptLang(code); } catch (e) {}
        document.documentElement.setAttribute("data-kp-lang", code);
        paintText();
      });
      box.appendChild(b);
    });
  }
  document.getElementById("tool-draw").addEventListener("click", function () { setTool("draw"); });
  document.getElementById("tool-erase").addEventListener("click", function () { setTool("erase"); });
  document.getElementById("undo-btn").addEventListener("click", doUndo);
  document.getElementById("clear-btn").addEventListener("click", askClear);
  document.getElementById("ask-yes").addEventListener("click", doClear);
  document.getElementById("ask-no").addEventListener("click", function () {
    document.getElementById("ask").hidden = true;
    syncModal();
  });
  document.getElementById("pour-btn").addEventListener("click", startPour);
  document.getElementById("retry-btn").addEventListener("click", retry);
  document.getElementById("repour-btn").addEventListener("click", function () { resetPour(false); startPour(); });
  document.getElementById("next-btn").addEventListener("click", finishNext);
  document.getElementById("again-btn").addEventListener("click", playAgain);
  document.getElementById("pause-btn").addEventListener("click", function () { setPaused(true); });
  document.getElementById("resume-btn").addEventListener("click", function () { setPaused(false); });
  document.getElementById("menu-btn").addEventListener("click", function () { toggleMenu(true); paintRank(); });
  document.getElementById("menu-close").addEventListener("click", function () { toggleMenu(false); });
  document.getElementById("read-btn").addEventListener("click", readAloud);
  document.getElementById("alias").addEventListener("change", function (e) { setAlias(e.target.value); });
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  window.addEventListener("keydown", function (e) {
    var typing = e.target && e.target.closest && e.target.closest("input, textarea");
    if (e.key === "Escape") {
      if (!document.getElementById("ask").hidden) {
        document.getElementById("ask").hidden = true; syncModal(); e.preventDefault(); return;
      }
      if (!document.getElementById("menu").hidden) { toggleMenu(false); e.preventDefault(); return; }
      if (!document.getElementById("endcard").hidden) { playAgain(); e.preventDefault(); return; }
      setPaused(!paused);
      e.preventDefault();
      return;
    }
    if (typing) return;
    var k = e.key.toLowerCase();
    if (k === "d") setTool("draw");
    else if (k === "e") setTool("erase");
    else if (k === "z") doUndo();
    else if (k === "p") startPour();
    else if (k === "r") retry();
  });
  window.addEventListener("resize", layout);
  if (window.KulibertPrefs && window.KulibertPrefs.on) window.KulibertPrefs.on(paintText);
  new MutationObserver(paintText).observe(document.documentElement, { attributes: true, attributeFilter: ["data-kp-lang", "data-kp-motion"] });
  bootLangs();
  loadCups();
  paintText();
  layout();
  requestAnimationFrame(frame);
  window.__rf = {
    version: VERSION,
    fps: function () { return { now: fps, min: fpsMin }; },
    state: function () {
      return { fill: fill, spill: spill, line: LINE, pouring: pouring, live: live.length, words: cupWords(), paused: paused, strokes: strokes.length, cups: cups, mass: mass };
    },
    ghost: function () {
      var r = canvas.getBoundingClientRect();
      return ghost.map(function (p) {
        return { x: r.left + p.x * (r.width / viewW), y: r.top + p.y * (r.height / viewH) };
      });
    },
    spout: function () { return { x: spout.x, y: spout.y }; }
  };
})();
