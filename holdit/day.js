/* HI 1.1.25 — Challenge of the Day. Existing jobs, date-seeded. No server. */
(function () {
  var SPANS = [
    { id: "creek-crossing", title: "Creek Crossing", hold: "24 kN", goal: "Cross the creek with a triangle." },
    { id: "warren-yard", title: "Yard Spur", hold: "80 kN", goal: "Zigzag the yard spur with triangles." },
    { id: "pratt-river", title: "Pratt River", hold: "120 kN", goal: "Let the Pratt diagonals pull." },
    { id: "howe-lesson", title: "Howe Counter-example", hold: "120 kN", goal: "See why the Howe shape folds." },
    { id: "freight-span", title: "Heavy Freight", hold: "400 kN", goal: "Carry the heavy freight across." },
    { id: "economy-run", title: "Economy Run", hold: "90 kN", goal: "Cross the gap on a tight budget." }
  ];
  var SPIRES = [
    { id: "flag-mast", title: "Flag Mast", hold: "4 kN", goal: "Build the flag mast up to the line." },
    { id: "water-tower", title: "Water Tower", hold: "50 kN", goal: "Hold the tank on the water tower." },
    { id: "radio-mast", title: "Radio Mast", hold: "8 kN", goal: "Raise the radio mast in the wind." },
    { id: "lookout", title: "Lookout Deck", hold: "80 kN", goal: "Build the lookout deck." },
    { id: "pylon", title: "Wind Pylon", hold: "40 kN", goal: "Stand the wind pylon up." },
    { id: "aftershock", title: "Aftershock", hold: "30 kN", goal: "Keep the tower up after the shake." }
  ];
  var COPY = {
    en: { kicker: "Challenge of the day", best: "Best today on this device", none: "none yet", bars: "bars", play: "Play today's challenge", note: "Records show aliases only. A new challenge every school day.", span: "Span", spire: "Spire", spanSub: "Bridges · jobs + Free build", spireSub: "Towers · jobs + Free build", or: "Or pick a game:", min: "~5 min", hold: "Hold" },
    es: { kicker: "Reto del día", best: "Mejor hoy en este aparato", none: "aún nadie", bars: "barras", play: "Juega el reto de hoy", note: "Las marcas usan alias. Un reto nuevo cada día de clase.", span: "Span", spire: "Spire", spanSub: "Puentes · trabajos y libre", spireSub: "Torres · trabajos y libre", or: "O elige un juego:", min: "~5 min", hold: "Aguanta" },
    ar: { kicker: "تحدي اليوم", best: "الأفضل اليوم على هذا الجهاز", none: "لا أحد بعد", bars: "قضبان", play: "العب تحدي اليوم", note: "السجلات بأسماء مستعارة فقط. تحدٍ جديد كل يوم دراسة.", span: "Span", spire: "Spire", spanSub: "جسور · أعمال وبناء حر", spireSub: "أبراج · أعمال وبناء حر", or: "أو اختر لعبة:", min: "~5 د", hold: "احمل" },
    "fa-AF": { kicker: "چالش امروز", best: "بهترین امروز روی همین دستگاه", none: "هنوز کسی نه", bars: "میله", play: "چالش امروز را بازی کن", note: "رکوردها فقط نام مستعار اند. هر روز مکتب یک چالش نو.", span: "Span", spire: "Spire", spanSub: "پل‌ها · کار و ساخت آزاد", spireSub: "برج‌ها · کار و ساخت آزاد", or: "یا یک بازی انتخاب کن:", min: "~۵ دقیقه", hold: "نگه دار" },
    uk: { kicker: "Виклик дня", best: "Найкраще сьогодні на цьому пристрої", none: "ще немає", bars: "стрижні", play: "Грати виклик дня", note: "Рекорди лише з псевдонімами. Новий виклик кожного навчального дня.", span: "Span", spire: "Spire", spanSub: "Мости · задачі і вільна гра", spireSub: "Вежі · задачі і вільна гра", or: "Або обери гру:", min: "~5 хв", hold: "Тримай" },
    ru: { kicker: "Задача дня", best: "Лучшее сегодня на этом устройстве", none: "пока нет", bars: "стержни", play: "Играть задачу дня", note: "Рекорды только с псевдонимами. Новая задача каждый учебный день.", span: "Span", spire: "Spire", spanSub: "Мосты · задачи и свободная игра", spireSub: "Башни · задачи и свободная игра", or: "Или выбери игру:", min: "~5 мин", hold: "Держи" },
    rw: { kicker: "Ikibazo cy'uyu munsi", best: "Ibyiza uyu munsi kuri iki gikoresho", none: "ntakiriho", bars: "imirongo", play: "Kina ikibazo cy'uyu munsi", note: "Ibyanditswe ni amazina y'ibanga gusa. Ikibazo gishya buri munsi w'ishuri.", span: "Span", spire: "Spire", spanSub: "Amabirige · imirimo n'ubwisanzure", spireSub: "Iminara · imirimo n'ubwisanzure", or: "Cyangwa hitamo umukino:", min: "~5 min", hold: "Fata" },
    ti: { kicker: "ፈተና ናይ ሎሚ", best: "ዝበለጸ ሎሚ ኣብዚ መሳርሒ", none: "ገና የለን", bars: "ዕንጨይቲ", play: "ፈተና ናይ ሎሚ ተጻወት", note: "መዝገባት ብቅጽል ስም ጥራይ እዮም። ኣብ ነፍሲ ወከፍ መዓልቲ ትምህርቲ ሓድሽ ፈተና።", span: "Span", spire: "Spire", spanSub: "ድልድላት · ስራሕን ነጻ ህንጻን", spireSub: "ግምብታት · ስራሕን ነጻ ህንጻን", or: "ወይ ጸወታ ምረጽ:", min: "~5 ደቒቕ", hold: "ሓዝ" }
  };
  var DAYS = { en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], es: ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"], ar: ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"], "fa-AF": ["یکش", "دوش", "سه‌ش", "چهارش", "پنجش", "جمعه", "شنب"], uk: ["нд", "пн", "вт", "ср", "чт", "пт", "сб"], ru: ["вс", "пн", "вт", "ср", "чт", "пт", "сб"], rw: ["cyum", "mbe", "kab", "gtu", "kan", "gat", "gat"], ti: ["ሰን", "ሰኑ", "ሰሉ", "ረቡ", "ሓሙ", "ዓር", "ቀዳ"] };

  function lang() {
    var code = "en";
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q) code = q;
      else {
        var html = document.documentElement.lang || "";
        if (html === "fa") html = "fa-AF";
        if (COPY[html]) code = html;
        else if (window.KulibertPrefs && KulibertPrefs.lang) code = KulibertPrefs.lang;
      }
    } catch (e) {}
    if (code === "simple") code = "en";
    return COPY[code] ? code : "en";
  }
  function t() { return COPY[lang()]; }
  function home() {
    var path = location.pathname.replace(/\/+$/, "") || "/";
    return path === "/holdit" && !document.querySelector(".shop-editor");
  }
  function dayNumber() {
    var d = new Date();
    return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
  }
  var GOAL = {
    "creek-crossing": { es: "Cruza el arroyo con un triángulo.", ar: "اعبر الجدول بمثلث.", "fa-AF": "جوی را با یک مثلث بگذران.", uk: "Перейди струмок трикутником.", ru: "Перейди ручей треугольником.", rw: "Nyura uruzi ukoresheje mpandeshatu.", ti: "ነቲ ሩባ ብስሉስ ሕለፍ።" },
    "warren-yard": { es: "Haz zigzag en el ramal con triángulos.", ar: "اصنع زكزاكاً في الفرع بمثلثات.", "fa-AF": "شاخه را با مثلث‌ها زیگزاگ کن.", uk: "Зроби зигзаг на гілці трикутниками.", ru: "Сделай зигзаг на ветке треугольниками.", rw: "Kora zigizagi ku muhanda n'impandeshatu.", ti: "ኣብቲ መንገዲ ብስሉሳት ዚግዛግ ግበር።" },
    "pratt-river": { es: "Deja que las diagonales Pratt tiren.", ar: "دع أقطار برات تشد.", "fa-AF": "بگذار قطرهای پرات بکشند.", uk: "Нехай діагоналі Пратта тягнуть.", ru: "Пусть диагонали Пратта тянут.", rw: "Reka imirongo ya Pratt ikure.", ti: "ሰያፍታት ፕራት ጎተቱ።" },
    "howe-lesson": { es: "Mira por qué la forma Howe se dobla.", ar: "انظر لماذا ينطوي شكل هاو.", "fa-AF": "ببین چرا شکل هاو تا می‌شود.", uk: "Подивись, чому форма Гау складається.", ru: "Посмотри, почему форма Гау складывается.", rw: "Reba impamvu ishusho ya Howe igonda.", ti: "ስለምንታይ ቅርጺ ሃው ከም ዝዕፈስ ርአ።" },
    "freight-span": { es: "Lleva la carga pesada al otro lado.", ar: "انقل الشحن الثقيل إلى الجهة الأخرى.", "fa-AF": "بار سنگین را به آن سو ببر.", uk: "Перевези важкий вантаж.", ru: "Перевези тяжёлый груз.", rw: "Jyana umuzigo uremereye hirya.", ti: "ነቲ ከቢድ ጽዕነት ናብቲ ካልእ ጎኒ ውሰድ።" },
    "economy-run": { es: "Cruza con poco dinero.", ar: "اعبر بميزانية صغيرة.", "fa-AF": "با بودجهٔ کم بگذر.", uk: "Перейди за малі гроші.", ru: "Перейди за небольшие деньги.", rw: "Nyura ufite budget ntoya.", ti: "ብውሑድ ገንዘብ ሕለፍ።" },
    "flag-mast": { es: "Sube el mástil de la bandera hasta la línea.", ar: "ارفع سارية العلم إلى الخط.", "fa-AF": "دیرک بیرق را تا خط بالا ببر.", uk: "Підніми флагшток до лінії.", ru: "Подними флагшток до линии.", rw: "Zamura ikariso kugeza ku murongo.", ti: "ነቲ ልዳት ክሳብ መስመር ኣልዕል።" },
    "water-tower": { es: "Sostén el tanque en la torre de agua.", ar: "احمل الخزان على برج الماء.", "fa-AF": "تانک را روی برج آب نگه دار.", uk: "Втримай бак на водонапірній вежі.", ru: "Удержи бак на водонапорной башне.", rw: "Fata tanki ku munara w'amazi.", ti: "ነቲ ታንኪ ኣብ ግምቢ ማይ ሓዝ።" },
    "radio-mast": { es: "Levanta el mástil de radio en el viento.", ar: "ارفع سارية الراديو في الريح.", "fa-AF": "دیرک رادیو را در باد بلند کن.", uk: "Підніми радіощоглу на вітрі.", ru: "Подними радиомачту на ветру.", rw: "Zamura ikariso rya radiyo mu muyaga.", ti: "ነቲ ልዳት ራድዮ ኣብ ንፋስ ኣልዕል።" },
    lookout: { es: "Construye la plataforma del mirador.", ar: "ابنِ منصة المراقبة.", "fa-AF": "سکوی دیدبان را بساز.", uk: "Побудуй майданчик оглядової вежі.", ru: "Построй площадку смотровой.", rw: "Ubaka urusoziko rw'igare.", ti: "ነቲ መድረኽ ትዕዛቢ ህነጽ።" },
    pylon: { es: "Pon de pie el pilón de viento.", ar: "أقم برج الرياح.", "fa-AF": "برج باد را راست کن.", uk: "Постав вітровий пілон.", ru: "Поставь ветровой пилон.", rw: "Hagarika pilon y'umuyaga.", ti: "ነቲ ግምቢ ንፋስ ኣቕም።" },
    aftershock: { es: "Mantén la torre en pie tras el temblor.", ar: "أبقِ البرج قائماً بعد الهزة.", "fa-AF": "برج را پس از لرزه سر پا نگه دار.", uk: "Втримай вежу після поштовху.", ru: "Удержи башню после толчка.", rw: "Fata umunara uhagaze nyuma y'inyigisho.", ti: "ድሕሪ ምንቅጥቃጥ ነቲ ግምቢ ቀጥ ኣቢልካ ሓዝ።" }
  };
  function goalText(item) {
    var pack = GOAL[item.id];
    var code = lang();
    return (pack && pack[code]) || item.goal;
  }
  var picked = "";
  function camp() {
    if (picked === "tower" || picked === "bridge") return picked;
    var mode = "";
    try { mode = new URLSearchParams(location.search).get("mode") || ""; } catch (e) {}
    if (mode === "spire" || mode === "tower") return "tower";
    return "bridge";
  }
  function job() {
    var list = camp() === "tower" ? SPIRES : SPANS;
    var n = dayNumber();
    return list[((n % list.length) + list.length) % list.length];
  }
  function towerArt() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 340 220");
    svg.setAttribute("class", "hi-day-art");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<rect y="180" width="340" height="40" fill="#1E3470"/><path d="M150 180l20-150 20 150M130 150h80M140 110h60M170 30v-12" stroke="#C9D5F5" stroke-width="6" fill="none"/>';
    return svg;
  }
  function doorBtn(which, name, sub, icon) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "hi-day-door" + (camp() === which ? " is-sel" : "");
    b.setAttribute("aria-pressed", camp() === which ? "true" : "false");
    b.appendChild(svgIcon(icon));
    var label = el("span", "hi-day-door-label");
    label.appendChild(el("span", "hi-day-door-name", name));
    label.appendChild(el("small", "", sub));
    b.appendChild(label);
    if (camp() === which) b.appendChild(el("span", "hi-day-check", "✓"));
    b.addEventListener("click", function () {
      picked = which;
      sig = "";
      try {
        var url = new URL(location.href);
        url.searchParams.set("mode", which === "tower" ? "spire" : "span");
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      } catch (e) {}
      render();
    });
    return b;
  }
  function alias() {
    try {
      var who = window.KulibertWho && KulibertWho.read && KulibertWho.read();
      if (who && who.alias) return String(who.alias).replace(/\s+/g, " ").trim().slice(0, 16);
    } catch (e) {}
    try {
      var raw = JSON.parse(localStorage.getItem("kw-who-v1") || "null");
      if (raw && raw.alias) return String(raw.alias).replace(/\s+/g, " ").trim().slice(0, 16);
    } catch (e2) {}
    return "";
  }
  function todayStamp(ms) {
    var d = new Date(ms);
    var n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  }
  function best(id) {
    var key = "holdit-day-best-v1";
    var board = {};
    try { board = JSON.parse(localStorage.getItem(key) || "{}"); } catch (e) {}
    var slot = dayNumber() + ":" + id;
    var rec = board[slot] || null;
    var name = alias();
    var bars = null;
    try {
      var save = JSON.parse(localStorage.getItem("loadpath-save-v1") || "null");
      var draft = save && save.drafts && save.drafts[id];
      if (draft && draft.at && todayStamp(draft.at) && draft.world && draft.world.members) {
        bars = draft.world.members.length;
      }
    } catch (e2) {}
    if (name && bars && (!rec || bars < rec.bars)) {
      rec = { alias: name, bars: bars };
      board[slot] = rec;
      try { localStorage.setItem(key, JSON.stringify(board)); } catch (e3) {}
    }
    return rec;
  }
  function stars(id) {
    try {
      var save = JSON.parse(localStorage.getItem("loadpath-save-v1") || "null");
      var row = save && save.levels && save.levels[id];
      var n = row && row.stars ? row.stars : 0;
      if (n < 0) n = 0;
      if (n > 3) n = 3;
      return n;
    } catch (e) { return 0; }
  }
  function svgIcon(path) {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 44 44");
    svg.setAttribute("aria-hidden", "true");
    var d = document.createElementNS("http://www.w3.org/2000/svg", "path");
    d.setAttribute("d", path);
    d.setAttribute("fill", "none");
    d.setAttribute("stroke", "#EAF0FF");
    d.setAttribute("stroke-width", "3");
    svg.appendChild(d);
    return svg;
  }
  function chip(iconPath, text) {
    var node = el("span", "hi-day-chip", "");
    if (iconPath) node.appendChild(svgIcon(iconPath));
    node.appendChild(document.createTextNode(text));
    return node;
  }
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function bridgeArt() {
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 340 220");
    svg.setAttribute("class", "hi-day-art");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = '<rect y="170" width="340" height="50" fill="#1E3470"/><path d="M60 170q110 40 220 0" fill="#06122B"/><path d="M40 150h260M40 150l45-55 45 55 45-55 45 55 45-55 35 55" stroke="#C9D5F5" stroke-width="6" fill="none"/>';
    return svg;
  }
  function paintStars(host, n) {
    host.innerHTML = "";
    host.className = "hi-day-stars";
    host.setAttribute("aria-hidden", "true");
    for (var i = 0; i < 3; i++) {
      var s = document.createElement("span");
      s.textContent = "★";
      if (i < n) s.className = "is-on";
      host.appendChild(s);
    }
  }
  var sig = "";
  function menuNodes() {
    var langSel = document.getElementById("lp-lang");
    if (!langSel || !langSel.closest) return [];
    var span = langSel.closest("span") || langSel;
    var wrap = span.parentElement;
    var pressed = wrap ? [].slice.call(wrap.querySelectorAll(":scope > button[aria-pressed]")) : [];
    return [span, pressed[0], pressed[1]].filter(Boolean);
  }
  function drawerOpen() {
    var d = document.getElementById("hi-drawer");
    if (!d || d.getAttribute("data-state") === "closed") return false;
    var r = d.getBoundingClientRect();
    return r.width > 40 && r.height > 40;
  }
  function clearSlot(el) {
    el.style.position = "";
    el.style.zIndex = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.margin = "";
    el.style.visibility = "";
    el.style.pointerEvents = "";
    el.style.minHeight = "";
    el.style.boxSizing = "";
    el.style.display = "";
    el.style.alignItems = "";
  }
  function isMenuControl(node) {
    if (!node || !node.closest) return false;
    var nodes = menuNodes();
    for (var i = 0; i < nodes.length; i++) {
      if (node === nodes[i] || nodes[i].contains(node)) return true;
    }
    return false;
  }
  var hubSlotted = false;
  function slotMenu() {
    var nodes = menuNodes();
    var nav = document.querySelector("#hi-drawer nav");
    var open = drawerOpen();
    var d = document.getElementById("hi-drawer");
    if (nav) {
      if (!nav.hasAttribute("data-hub-menu-host")) nav.setAttribute("data-hub-menu-host", "");
      nav.style.paddingTop = open ? (124 + nodes.length * 56) + "px" : "";
    }
    if (!open) hubSlotted = false;
    else if (!hubSlotted && window.HubMenu && typeof HubMenu.scan === "function") {
      hubSlotted = true;
      HubMenu.scan();
    }
    nodes.forEach(function (el, i) {
      if (!open || !d) {
        clearSlot(el);
        return;
      }
      var r = d.getBoundingClientRect();
      el.style.position = "fixed";
      el.style.zIndex = "80";
      el.style.margin = "0";
      el.style.visibility = "visible";
      el.style.pointerEvents = "auto";
      el.style.minHeight = "48px";
      el.style.boxSizing = "border-box";
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.left = Math.round(r.left + 16) + "px";
      el.style.top = Math.round(r.top + 116 + i * 56) + "px";
      el.style.width = Math.max(48, Math.round(r.width - 32)) + "px";
      var sel = el.querySelector && el.querySelector("select");
      if (sel) {
        sel.style.width = "100%";
        sel.style.maxWidth = "none";
        sel.style.minHeight = "48px";
        sel.style.pointerEvents = "auto";
      }
    });
  }
  function slotSave(play) {
    var row = document.querySelector(".shop:not(.shop-editor) .mt-3 .flex");
    if (!row) return;
    if (!play || play.getBoundingClientRect().width < 8) {
      clearSlot(row);
      return;
    }
    var pr = play.getBoundingClientRect();
    row.style.position = "fixed";
    row.style.zIndex = "30";
    row.style.margin = "0";
    row.style.visibility = "visible";
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.left = Math.round(pr.left) + "px";
    row.style.top = Math.round(pr.bottom + 8) + "px";
    row.style.width = Math.round(Math.max(pr.width, 48)) + "px";
  }
  function render() {
    if (!home()) {
      sig = "";
      document.body.classList.remove("hi-day");
      var old = document.getElementById("hi-day");
      if (old) old.remove();
      return;
    }
    var shop = document.querySelector(".shop:not(.shop-editor)");
    if (!shop) return;
    var current = job();
    var nextSig = lang() + ":" + current.id;
    if (document.getElementById("hi-day") && sig === nextSig) {
      slotMenu();
      slotSave(document.querySelector(".hi-day-play"));
      return;
    }
    sig = nextSig;
    document.body.classList.add("hi-day");
    var root = document.getElementById("hi-day");
    if (!root) {
      root = el("div", "hi-day");
      root.id = "hi-day";
      shop.appendChild(root);
    }
    var copy = t();
    var code = lang();
    var dayName = (DAYS[code] || DAYS.en)[new Date().getDay()];
    root.innerHTML = "";
    var card = el("section", "hi-day-card");
    card.setAttribute("aria-labelledby", "hi-day-goal");
    var copyCol = el("div", "hi-day-copy");
    copyCol.appendChild(el("p", "hi-day-kicker", copy.kicker + " · " + dayName));
    var goal = el("h1", "hi-day-goal", goalText(current));
    goal.id = "hi-day-goal";
    goal.lang = code === "fa-AF" ? "fa" : code;
    copyCol.appendChild(goal);
    var chips = el("div", "hi-day-chips");
    var spanIcon = "M2 30h40M6 30V18l8 12 8-12 8 12 8-12v12M6 18h32";
    var spireIcon = "M10 40h24M14 40l8-34 8 34M16 30h12M18 20h8";
    chips.appendChild(chip(camp() === "tower" ? spireIcon : spanIcon, camp() === "tower" ? copy.spire : copy.span));
    chips.appendChild(chip("M22 6a10 10 0 1 0 0.1 0M22 14v8l5 3", copy.hold + " " + current.hold));
    chips.appendChild(chip("M22 8v14M22 8a8 8 0 1 0 0.1 0M16 38h12", copy.min));
    copyCol.appendChild(chips);
    var rec = best(current.id);
    var bestText = copy.best + ": " + (rec ? rec.bars + " " + copy.bars + " · " + rec.alias : copy.none);
    copyCol.appendChild(el("p", "hi-day-best", "🏆 " + bestText));
    var play = el("button", "hi-day-play", "▶ " + copy.play);
    play.type = "button";
    play.addEventListener("click", function () {
      location.assign("/holdit/play/" + current.id);
    });
    copyCol.appendChild(play);
    slotSave(play);
    slotMenu();
    var art = el("div", "hi-day-artwrap");
    var starHost = el("div", "");
    paintStars(starHost, stars(current.id));
    art.appendChild(starHost);
    art.appendChild(camp() === "tower" ? towerArt() : bridgeArt());
    card.appendChild(copyCol);
    card.appendChild(art);
    root.appendChild(card);
    root.appendChild(el("p", "hi-day-or", copy.or));
    var doors = el("div", "hi-day-doors");
    doors.appendChild(doorBtn("bridge", copy.span, copy.spanSub, "M2 30h40M6 30V18l8 12 8-12 8 12 8-12v12M6 18h32"));
    doors.appendChild(doorBtn("tower", copy.spire, copy.spireSub, "M10 40h24M14 40l8-34 8 34M16 30h12M18 20h8"));
    root.appendChild(doors);
    root.appendChild(el("p", "hi-day-note", copy.note));
  }
  var busy = false;
  function pass() {
    if (busy) return;
    busy = true;
    try { render(); } finally { busy = false; }
  }
  function arm() {
    pass();
    new MutationObserver(pass).observe(document.body, { childList: true, subtree: true });
    new MutationObserver(function () { sig = ""; pass(); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang", "dir", "class"] });
  }
  function guardMenuClicks() {
    var app = document.getElementById("app");
    if (!app || app.getAttribute("data-hi-menu-guard") === "1") return;
    app.setAttribute("data-hi-menu-guard", "1");
    ["pointerdown", "pointerup", "mousedown", "mouseup"].forEach(function (type) {
      app.addEventListener(type, function (ev) {
        if (!drawerOpen() || !isMenuControl(ev.target)) return;
        ev.stopPropagation();
      }, false);
    });
  }
  document.addEventListener("click", function (ev) {
    if (!home()) return;
    var btn = ev.target && ev.target.closest && ev.target.closest(".kb-bar .kb-menu");
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    var menu = document.getElementById("hi-menu");
    if (!menu) return;
    window.setTimeout(function () { menu.click(); }, 40);
  }, true);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", guardMenuClicks);
  else guardMenuClicks();
  if (document.body) arm();
  else document.addEventListener("DOMContentLoaded", arm);
  window.addEventListener("kulibert-lang", function () { sig = ""; pass(); });
  window.addEventListener("resize", function () { slotMenu(); slotSave(document.querySelector(".hi-day-play")); });
})();
