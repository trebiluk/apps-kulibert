/* Ramp & Fill RF 1.0.19 — home hides Pause and the fill bar. No trackers. */
(function () {
  var VERSION = "RF 1.0.19";
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
    var pack = false;
    var asked = false;
    try {
      var raw = JSON.parse(sessionStorage.getItem("kulibert-test-pack") || "null");
      pack = !!(raw && raw.testMode === true);
    } catch (e) {}
    try {
      asked = new URLSearchParams(location.search).get("test") === "1" || sessionStorage.getItem("kulibert-test-tab") === "1";
    } catch (e2) {}
    return pack && asked;
  }
  function stripTestScript() {
    var nodes = document.querySelectorAll("script[src*='kw-test']");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].parentNode) nodes[i].parentNode.removeChild(nodes[i]);
    }
    var chip = document.getElementById("kw-test-chip");
    if (chip && chip.parentNode) chip.parentNode.removeChild(chip);
    try { delete window.KulibertTest; } catch (e) { window.KulibertTest = undefined; }
    try { delete window.KWTest; } catch (e2) { window.KWTest = undefined; }
  }
  function loadStaffTest() {
    if (!(staffUnlocked() && testSwitchOn())) {
      if (!testScriptAsked) stripTestScript();
      return;
    }
    if (window.HubStaffAuth && !window.KulibertStaffAuth) window.KulibertStaffAuth = window.HubStaffAuth;
    if (testScriptAsked || document.querySelector("script[src*='kw-test']")) {
      testScriptAsked = true;
      return;
    }
    testScriptAsked = true;
    var s = document.createElement("script");
    s.src = "/shared/kw-test.js?v=RF-1.0.9";
    s.onload = function () {
      if (window.HubStaffAuth && !window.KulibertStaffAuth) window.KulibertStaffAuth = window.HubStaffAuth;
      try { if (window.KulibertTest && window.KulibertTest.paint) window.KulibertTest.paint(); } catch (e) {}
    };
    document.head.appendChild(s);
  }
  var LINE = 36;
  var LIVE_CAP = 300;
  var STR = {
    en: {
      menu: "Menu", close: "Close", pause: "Pause", resume: "Resume", draw: "Draw", erase: "Erase", undo: "Undo", clear: "Clear", pour: "Pour", retry: "Retry",
      lesson: "Steeper = faster. Smoother = neater. Thick gel needs a bigger hill.",
      lesson2: "Steeper = faster. Smoother = neater. Plan space for the next ramp before you pour.",
      lesson3: "Water finds the low path. A tiny gap leaks the whole stream.",
      lesson4: "Thick gel needs a bigger hill. If it will not move, make the hill bigger.",
      lesson5: "Same ramp, different pour. Grains like a hill. Water needs the lip.",
      ghost: "Draw a ramp like this", clearAsk: "Erase all ramps?", yes: "Yes", no: "No",
      grains: "Grains", water: "Water", gel: "Gel", blockWord: "Block", wallWord: "Wall", fillTo: "fill to here",
      empty: "Cup: empty", little: "Cup: a little in", half: "Cup: almost half full", moreHalf: "Cup: more than half", almost: "Cup: almost full", done: "Cup: filled to the line",
      startHint: "Draw, then pour.",
      noSpill: "nothing spilled", bitSpill: "a little spilled", someSpill: "some spilled",
      starWord: "star", starsWord: "stars",
      stackTile: "Cup Stack", stackBack: "Ramps",
      stackAsk: "Tap the dotted cup. It snaps on.",
      stackNext: "Snap the next cup on top.",
      stackTip: "Too far. It tipped. Tap Retry.",
      stackStand: "The stack stands.",
      stackCaught: "The top cup caught the grains.",
      stackLesson: "Tap the dotted cups to stack 3. A far tap tips.",
      cupWord: "Cup",
      spill: "It spilled here — try a flatter ramp.",
      sat: "Gel sat still — make the hill bigger.",
      wrong: "Grains go in the left cup.",
      wrongW: "Water goes in the right cup.",
      pathNext: "Grains cup filled — pick Water and draw to that cup.",
      leak: "Water leaked at this gap — overlap the ramp onto the cup.",
      blocked: "The block stopped the water — draw the ramp over it.",
      leftFirst: "Fill the left cup first.",
      leftNext: "Left cup filled — draw a ramp to the other cup.",
      left: "Left", right: "Right",
      filled: "Filled it!", repour: "Re-pour", next: "Next", more: "can you fill more?",
      you: "You: #", noneRank: "You: #—", top: "Top 10", alias: "Alias",
      whats: "RF 1.0.19 — The home menu no longer shows Pause or the fill bar.",
      levels: "Levels", home: "Home",
      refTile: "Referee", countUp: "Count up", countDown: "Count down", refStart: "Start", refStop: "Stop", refReset: "Reset", refDone: "Done", timeUp: "Time!", minutes: "Minutes",
      cardWord: "Card", youNeed: "You need:", teamWord: "Team", pyramid: "Pyramid", tower: "Tower", bridge: "Bridge", stairs: "Stairs", ideas: "Stack ideas", line: "Line", handsOff: "Hands off — time locked", nextCard: "Next card",
      progress: "Progress", startOver: "Start over", resetAsk: "Start over? Cups and stars clear.", openWord: "open", locked: "locked",
      whatsNew: "What's new", help: "Help",
      helpDraw: "Draw a ramp like the dotted guide.",
      helpPour: "Press Pour. Grains (water later) slide into the cup.",
      helpPour2: "Press Pour. Grains fill the left cup, then the right.",
      helpPour3: "Press Pour. Water slides in when the ramp sits on the cup lip.",
      helpPour4: "Press Pour. Gel is slow. A flat tray will not move it.",
      helpPour5: "Pick Grains or Water. Only one pours at a time.",
      cupsWord: "Cups:",
      toolRow: "Ramp tools",
      helpSpill: "A spill stays circled. Fix the ramp and try again. Ramps stay on Retry.",
      helpLesson: "Read the lesson line when you win.",
      helpFewer: "Try to win with fewer ramps.",
      teachSlope: "Steeper slope = faster flow",
      teachGel: "Thick liquid (high viscosity) flows slower",
      teachRate: "Flow rate = how much pours each second",
      bestWord: "Best:", rampsWord: "ramps", rampsOne: "ramp", rampsTwo: "ramps", rampsFew: "ramps", rampsMany: "ramps", rampsOther: "ramps", newBest: "New best!", tryFewer: "Try for fewer",
      helpPause: "Pause is always easy to tap, even sideways.",
      fillWord: "Fill",
      helpSplash: "Pouring splashes. The fill percent counts up. Mute turns the tone off.",
      lockedWhy: "Locked. Finish the level before this one.",
      helpStars: "The level list shows your stars and your fewest ramps.",
      helpClear: "When you win, stars show one by one. Next is ready.",
      showBest: "Show best",
      onWord: "On",
      offWord: "Off",
      helpGhost: "Retry can show a faint grey copy of your best ramps. Show best turns it on or off.",
      dailyCup: "Daily cup",
      helpDaily: "The Daily cup is a new cup every school day. It is the same for the whole class. Your best stays on this device only.",
      helpDailyBest: "The Daily cup tile shows your best for today.",
      helpRamps: "\"1 ramp\" and \"2 ramps\" use the right word in every language.",
      wdMon: "Mon", wdTue: "Tue", wdWed: "Wed", wdThu: "Thu", wdFri: "Fri",
      mo1: "Jan", mo2: "Feb", mo3: "Mar", mo4: "Apr", mo5: "May", mo6: "Jun", mo7: "Jul", mo8: "Aug", mo9: "Sep", mo10: "Oct", mo11: "Nov", mo12: "Dec",
      helpDate: "The Daily cup date shows in your language.",
      testHelp: "Staff only: with Test mode on, Jump to win or lose; scores go to the TEST board.",
      testLose: "Not filled yet",
      testLoseNote: "The cup is not full. Try again.",
      read: "Read it to me", language: "Language",
      lv1: "First ramp", lv2: "Two cups", lv3: "First leak", lv4: "Slow gel", lv5: "Pick the path",
      done1: "First ramp done.", done2: "Two cups done.", done3: "First leak done.", done4: "Slow gel done.", done5: "Path done.",
      nextLevel: "Next level", beat: "Beat your fill", hub: "Back to Hub",
      noMore: "No more ramps yet.",
      paused: "Paused",
      local: "Aliases and cup pictures stay on this Chromebook. No names. No chat.",
      canvas: "Draw a ramp from the dispenser to the cup."
    },
    uk: {
      menu: "Меню", close: "Закрити", pause: "Пауза", resume: "Далі", draw: "Малюй", erase: "Сотри", undo: "Назад", clear: "Прибери", pour: "Лий", retry: "Ще раз",
      lesson: "Крутіше = швидше. Рівніше = охайніше.",
      lesson2: "Крутіше = швидше. Рівніше = охайніше. Залиш місце для наступного схилу, перш ніж лити.",
      lesson3: "Вода шукає низ. Мала щілина зливає весь струмінь.",
      lesson4: "Густий гель потребує крутішого схилу. Якщо не їде, зроби схил більшим.",
      lesson5: "Та сама рампа, інший налив. Зерно любить гірку. Воді потрібен край.",
      ghost: "Намалюй схил ось так", clearAsk: "Стерти всі схили?", yes: "Так", no: "Ні",
      grains: "Зерна", water: "Вода", gel: "Гель", blockWord: "Блок", wallWord: "Стіна", fillTo: "лий до сюди",
      empty: "Чашка: порожня", little: "Чашка: трохи є", half: "Чашка: майже половина", moreHalf: "Чашка: більше половини", almost: "Чашка: майже повна", done: "Чашка: до лінії",
      startHint: "Намалюй, потім сип.",
      noSpill: "нічого не розлилось", bitSpill: "трохи розлилось", someSpill: "дещо розлилось",
      starWord: "зірка", starsWord: "зірки",
      stackTile: "Стос чашок", stackBack: "Схили",
      stackAsk: "Торкнись пунктирної чашки. Вона стає на місце.",
      stackNext: "Постав наступну чашку зверху.",
      stackTip: "Занадто далеко. Вона перекинулась. Торкнись Спроба.",
      stackStand: "Стос стоїть.",
      stackCaught: "Верхня чашка зловила зерно.",
      stackLesson: "Торкнись пунктиру, щоб скласти 3. Далекий дотик перекидає.",
      spill: "Тут розлилося — спробуй пологіший схил.",
      sat: "Гель стоїть — зроби схил крутішим.",
      leak: "Вода витекла в цій щілині — наклади схил на край чашки.",
      blocked: "Блок зупинив воду — намалюй схил над ним.",
      leftFirst: "Спочатку наповни ліву чашку.",
      leftNext: "Ліва чашка повна — намалюй схил до іншої.",
      pathNext: "Чашку зерна наповнено — обери Воду і намалюй до тієї чашки.",
      wrong: "Зерно йде в ліву чашку.",
      wrongW: "Вода йде в праву чашку.",
      left: "Ліва", right: "Права",
      filled: "Наповнив!", repour: "Лий знову", next: "Далі", more: "зможеш наповнити ще?",
      you: "Ти: #", noneRank: "Ти: #—", top: "Топ 10", alias: "Псевдонім",
      whats: "RF 1.0.19 — Домашнє меню більше не показує Паузу чи смугу наповнення.",
      levels: "Рівні", home: "Дім",
      refTile: "Суддя", countUp: "Угору", countDown: "Відлік", refStart: "Старт", refStop: "Стоп", refReset: "Спочатку", refDone: "Готово", timeUp: "Час!", minutes: "Хвилини",
      cardWord: "Картка", youNeed: "Треба:", teamWord: "Команда", pyramid: "Піраміда", tower: "Вежа", bridge: "Міст", stairs: "Сходи", ideas: "Ідеї веж", line: "Ряд", handsOff: "Руки геть — час зафіксовано", nextCard: "Наступна картка",
      progress: "Прогрес", startOver: "Спочатку", resetAsk: "Спочатку? Чашки і зірки зітруться.", openWord: "відкрито", locked: "закрито",
      whatsNew: "Що нового", help: "Допомога",
      helpDraw: "Намалюй схил по крапках.",
      helpPour: "Натисни Лий. Зерна (вода пізніше) їдуть у чашку.",
      helpPour2: "Натисни Лий. Зерна наповнюють ліву чашку, потім праву.",
      helpPour3: "Натисни Лий. Вода заходить, коли схил лежить на краю чашки.",
      helpPour4: "Натисни Лий. Гель повільний. Плаский лоток його не зрушить.",
      helpPour5: "Обери зерна або воду. Лише одне ллється за раз.",
      cupsWord: "Чашки:",
      toolRow: "Інструменти рампи",
      helpSpill: "Розлив лишається в колі. Полагодь схил. На Ще раз схили лишаються.",
      helpLesson: "Прочитай рядок уроку, коли виграєш.",
      helpFewer: "Спробуй виграти з меншою кількістю схилів.",
      helpPause: "Паузу завжди легко натиснути, навіть збоку.",
      fillWord: "Наповнення",
      helpSplash: "Наливання бризкає. Відсоток наповнення росте. Без звуку тон вимкнений.",
      lockedWhy: "Закрито. Спочатку пройди попередній рівень.",
      helpStars: "Список рівнів показує твої зірки й найменше рамп.",
      helpClear: "Коли виграєш, зірки з’являються одна за одною. Далі вже готове.",
      showBest: "Показати найкраще",
      onWord: "Увімк",
      offWord: "Вимк",
      helpGhost: "Повторити може показати бліду сіру копію найкращих рамп. «Показати найкраще» вмикає або вимикає її.",
      dailyCup: "Чашка дня",
      helpDaily: "Чашка дня нова щошкільного дня. Вона однакова для всього класу. Твій рекорд лишається лише на цьому пристрої.",
      helpDailyBest: "Плитка чашки дня показує твій рекорд за сьогодні.",
      helpRamps: "«1 рампа» і «2 рампи» мають правильне слово кожною мовою.",
      wdMon: "пн", wdTue: "вт", wdWed: "ср", wdThu: "чт", wdFri: "пт",
      mo1: "січ", mo2: "лют", mo3: "бер", mo4: "кві", mo5: "тра", mo6: "чер", mo7: "лип", mo8: "сер", mo9: "вер", mo10: "жов", mo11: "лис", mo12: "гру",
      helpDate: "Дата чашки дня показується твоєю мовою.",
      testHelp: "Лише для персоналу: з увімкненим тестом натисни перехід до перемоги або поразки; бали йдуть лише на дошку TEST.",
      teachSlope: "Крутіший нахил = швидший потік",
      teachGel: "Густа рідина (висока в'язкість) тече повільніше",
      teachRate: "Швидкість потоку = скільки ллється щосекунди",
      bestWord: "Рекорд:", rampsWord: "рамп", rampsOne: "рампа", rampsTwo: "рампи", rampsFew: "рампи", rampsMany: "рамп", rampsOther: "рампи", newBest: "Новий рекорд!", tryFewer: "Спробуй менше",
      read: "Прочитай мені", language: "Мова",
      lv1: "Перший схил", lv2: "Дві чашки", lv3: "Перший витік", lv4: "Повільний гель", lv5: "Обери шлях",
      done1: "Перший схил готовий.", done2: "Дві чашки готові.", done3: "Перший витік готовий.", done4: "Повільний гель готовий.",
      nextLevel: "Наступний рівень", beat: "Побий свій налив", hub: "Назад до хабу",
      noMore: "Більше схилів поки немає.",
      paused: "Пауза",
      local: "Псевдоніми й чашки лишаються на цьому Chromebook. Без імен. Без чату.",
      canvas: "Намалюй схил від дозатора до чашки."
    },
    ru: {
      menu: "Меню", close: "Закрыть", pause: "Пауза", resume: "Дальше", draw: "Рисуй", erase: "Сотри", undo: "Назад", clear: "Убери", pour: "Лей", retry: "Ещё раз",
      lesson: "Круче = быстрее. Ровнее = аккуратнее.",
      lesson2: "Круче = быстрее. Ровнее = аккуратнее. Оставь место для следующего склона, прежде чем лить.",
      lesson3: "Вода ищет низ. Маленькая щель сливает всю струю.",
      lesson4: "Густой гель любит крутой склон. Если стоит, сделай холм больше.",
      lesson5: "Та же рампа, другой налив. Зёрна любят горку. Воде нужен край.",
      ghost: "Нарисуй склон вот так", clearAsk: "Стереть все склоны?", yes: "Да", no: "Нет",
      grains: "Зёрна", water: "Вода", gel: "Гель", blockWord: "Блок", wallWord: "Стена", fillTo: "лей до сюда",
      empty: "Чашка: пустая", little: "Чашка: чуть-чуть", half: "Чашка: почти половина", moreHalf: "Чашка: больше половины", almost: "Чашка: почти полная", done: "Чашка: до линии",
      startHint: "Нарисуй, потом сыпь.",
      noSpill: "ничего не пролилось", bitSpill: "немного пролилось", someSpill: "часть пролилась",
      starWord: "звезда", starsWord: "звёзды",
      stackTile: "Стопка чашек", stackBack: "Склоны",
      stackAsk: "Коснись пунктирной чашки. Она встанет на место.",
      stackNext: "Поставь следующую чашку сверху.",
      stackTip: "Слишком далеко. Она упала. Нажми Ещё раз.",
      stackStand: "Стопка стоит.",
      stackCaught: "Верхняя чашка поймала зёрна.",
      stackLesson: "Коснись пунктира, чтобы сложить 3. Дальний касание роняет.",
      spill: "Здесь пролилось — попробуй более пологий склон.",
      sat: "Гель стоит — сделай склон круче.",
      leak: "Вода утекла в этой щели — наложи склон на край чашки.",
      blocked: "Блок остановил воду — нарисуй склон над ним.",
      leftFirst: "Сначала наполни левую чашку.",
      leftNext: "Левая чашка полная — нарисуй склон к другой.",
      pathNext: "Чашка с зерном полная — выбери Воду и нарисуй к той чашке.",
      wrong: "Зёрна идут в левую чашку.",
      wrongW: "Вода идёт в правую чашку.",
      left: "Левая", right: "Правая",
      filled: "Наполнил!", repour: "Лей снова", next: "Дальше", more: "сможешь наполнить ещё?",
      you: "Ты: #", noneRank: "Ты: #—", top: "Топ 10", alias: "Псевдоним",
      whats: "RF 1.0.19 — Домашнее меню больше не показывает Паузу и полосу наполнения.",
      levels: "Уровни", home: "Дом",
      refTile: "Судья", countUp: "Вверх", countDown: "Отсчёт", refStart: "Старт", refStop: "Стоп", refReset: "Сначала", refDone: "Готово", timeUp: "Время!", minutes: "Минуты",
      cardWord: "Карточка", youNeed: "Нужно:", teamWord: "Команда", pyramid: "Пирамида", tower: "Башня", bridge: "Мост", stairs: "Лестница", ideas: "Идеи башен", line: "Ряд", handsOff: "Руки прочь — время зафиксировано", nextCard: "Следующая карточка",
      progress: "Прогресс", startOver: "Сначала", resetAsk: "Сначала? Стаканы и звёзды сотрутся.", openWord: "открыт", locked: "закрыт",
      whatsNew: "Что нового", help: "Помощь",
      helpDraw: "Нарисуй склон по точкам.",
      helpPour: "Нажми Лей. Зёрна (вода позже) едут в чашку.",
      helpPour2: "Нажми Лей. Зёрна наполняют левую чашку, потом правую.",
      helpPour3: "Нажми Лей. Вода заходит, когда склон лежит на крае чашки.",
      helpPour4: "Нажми Лей. Гель медленный. Плоский лоток его не сдвинет.",
      helpPour5: "Выбери зёрна или воду. За раз льётся только одно.",
      cupsWord: "Чашки:",
      toolRow: "Инструменты рампы",
      helpSpill: "Пролив остаётся в круге. Поправь склон. На Ещё раз склоны остаются.",
      helpLesson: "Прочитай строку урока, когда победишь.",
      helpFewer: "Попробуй победить с меньшим числом рамп.",
      helpPause: "Паузу всегда легко нажать, даже в горизонтальном режиме.",
      fillWord: "Наполнение",
      helpSplash: "Налив брызгает. Процент наполнения растёт. Без звука тон выключен.",
      lockedWhy: "Закрыто. Сначала пройди предыдущий уровень.",
      helpStars: "Список уровней показывает твои звёзды и лучшее число рамп.",
      helpClear: "Когда побеждаешь, звёзды появляются одна за другой. Дальше уже готово.",
      showBest: "Показать лучшее",
      onWord: "Вкл",
      offWord: "Выкл",
      helpGhost: "Повтор может показать бледную серую копию лучших рамп. «Показать лучшее» включает или выключает её.",
      dailyCup: "Чашка дня",
      helpDaily: "Чашка дня новая каждый учебный день. Она одна и та же для всего класса. Твой рекорд остаётся только на этом устройстве.",
      helpDailyBest: "Плитка чашки дня показывает твой рекорд за сегодня.",
      helpRamps: "«1 рампа» и «2 рампы» — правильное слово на каждом языке.",
      wdMon: "пн", wdTue: "вт", wdWed: "ср", wdThu: "чт", wdFri: "пт",
      mo1: "янв", mo2: "фев", mo3: "мар", mo4: "апр", mo5: "май", mo6: "июн", mo7: "июл", mo8: "авг", mo9: "сен", mo10: "окт", mo11: "ноя", mo12: "дек",
      helpDate: "Дата чашки дня показывается на твоём языке.",
      testHelp: "Только для сотрудников: при включённом тесте нажми переход к победе или к поражению; очки идут только на доску TEST.",
      teachSlope: "Круче наклон = быстрее поток",
      teachGel: "Густая жидкость (высокая вязкость) течёт медленнее",
      teachRate: "Скорость потока = сколько льётся в секунду",
      bestWord: "Рекорд:", rampsWord: "рамп", rampsOne: "рампа", rampsTwo: "рампы", rampsFew: "рампы", rampsMany: "рамп", rampsOther: "рампы", newBest: "Новый рекорд!", tryFewer: "Попробуй меньше",
      read: "Прочитай мне", language: "Язык",
      lv1: "Первый склон", lv2: "Две чашки", lv3: "Первая течь", lv4: "Медленный гель", lv5: "Выбери путь",
      done1: "Первый склон готов.", done2: "Две чашки готовы.", done3: "Первая течь готова.", done4: "Медленный гель готов.",
      nextLevel: "Следующий уровень", beat: "Побей свой налив", hub: "Назад на главную",
      noMore: "Больше склонов пока нет.",
      paused: "Пауза",
      local: "Псевдонимы и чашки остаются на этом Chromebook. Без имён. Без чата.",
      canvas: "Нарисуй склон от дозатора к чашке."
    },
    es: {
      menu: "Menú", close: "Cerrar", pause: "Pausa", resume: "Seguir", draw: "Dibuja", erase: "Borra", undo: "Deshacer", clear: "Limpiar", pour: "Vierte", retry: "Otra vez",
      lesson: "Más pendiente = más rápido. Más liso = más limpio.",
      lesson2: "Más pendiente = más rápido. Más liso = más limpio. Deja espacio para la otra rampa antes de verter.",
      lesson3: "El agua busca el camino bajo. Una rendija pequeña vacía todo el chorro.",
      lesson4: "El gel espeso necesita una colina más alta. Si no se mueve, agranda la colina.",
      lesson5: "La misma rampa, otro vertido. Los granos quieren una colina. El agua necesita el borde.",
      ghost: "Dibuja una rampa así", clearAsk: "¿Borrar todas las rampas?", yes: "Sí", no: "No",
      grains: "Granos", water: "Agua", gel: "Gel", blockWord: "Bloque", wallWord: "Muro", fillTo: "llena hasta aquí",
      empty: "Taza: vacía", little: "Taza: un poquito", half: "Taza: casi la mitad", moreHalf: "Taza: más de la mitad", almost: "Taza: casi llena", done: "Taza: hasta la línea",
      startHint: "Dibuja y luego vierte.",
      noSpill: "nada se derramó", bitSpill: "un poco se derramó", someSpill: "algo se derramó",
      starWord: "estrella", starsWord: "estrellas",
      stackTile: "Torre de tazas", stackBack: "Rampas",
      stackAsk: "Toca la taza punteada. Encaja sola.",
      stackNext: "Encaja la siguiente taza arriba.",
      stackTip: "Muy lejos. Se cayó. Toca Otra vez.",
      stackStand: "La torre se queda.",
      stackCaught: "La taza de arriba atrapó los granos.",
      stackLesson: "Toca las tazas punteadas para apilar 3. Un toque lejos la tumba.",
      spill: "Se derramó aquí — prueba una rampa más plana.",
      sat: "El gel se quedó quieto — haz la colina más alta.",
      leak: "El agua se fugó en este hueco — monta la rampa sobre el borde.",
      blocked: "El bloque paró el agua — dibuja la rampa por encima.",
      leftFirst: "Llena primero la taza izquierda.",
      leftNext: "La taza izquierda está llena — dibuja una rampa a la otra.",
      pathNext: "Taza de granos llena: elige Agua y dibuja hasta esa taza.",
      wrong: "Los granos van en la taza izquierda.",
      wrongW: "El agua va en la taza derecha.",
      left: "Izquierda", right: "Derecha",
      filled: "¡La llenaste!", repour: "Verter otra vez", next: "Siguiente", more: "¿puedes llenar más?",
      you: "Tú: #", noneRank: "Tú: #—", top: "Top 10", alias: "Alias",
      whats: "RF 1.0.19 — El menú de inicio ya no muestra Pausa ni la barra de llenado.",
      levels: "Niveles", home: "Inicio",
      refTile: "Árbitro", countUp: "Subir", countDown: "Cuenta atrás", refStart: "Inicio", refStop: "Parar", refReset: "Reiniciar", refDone: "Listo", timeUp: "¡Tiempo!", minutes: "Minutos",
      cardWord: "Tarjeta", youNeed: "Necesitas:", teamWord: "Equipo", pyramid: "Pirámide", tower: "Torre", bridge: "Puente", stairs: "Escalera", ideas: "Ideas de torres", line: "Fila", handsOff: "Manos fuera — tiempo cerrado", nextCard: "Siguiente tarjeta",
      progress: "Progreso", startOver: "Empezar de nuevo", resetAsk: "¿Empezar de nuevo? Se borran vasos y estrellas.", openWord: "abierto", locked: "cerrado",
      whatsNew: "Novedades", help: "Ayuda",
      helpDraw: "Dibuja una rampa como la guía de puntos.",
      helpPour: "Pulsa Vierte. Los granos (el agua, más tarde) bajan a la taza.",
      helpPour2: "Pulsa Vierte. Los granos llenan la taza izquierda y luego la derecha.",
      helpPour3: "Pulsa Vierte. El agua entra cuando la rampa toca el borde de la taza.",
      helpPour4: "Pulsa Vierte. El gel es lento. Una bandeja plana no lo mueve.",
      helpPour5: "Elige granos o agua. Solo uno se vierte a la vez.",
      cupsWord: "Tazas:",
      toolRow: "Herramientas de rampa",
      helpSpill: "El derrame queda en un círculo. Arregla la rampa. Otra vez deja las rampas.",
      helpLesson: "Lee la línea de la lección al ganar.",
      helpFewer: "Intenta ganar con menos rampas.",
      helpPause: "Pausa siempre es fácil de tocar, incluso de lado.",
      fillWord: "Llenado",
      helpSplash: "Verter salpica. El porcentaje de llenado sube. Silencio apaga el tono.",
      lockedWhy: "Cerrado. Termina el nivel anterior.",
      helpStars: "La lista de niveles muestra tus estrellas y tus rampas mínimas.",
      helpClear: "Al ganar, las estrellas salen una por una. Siguiente está listo.",
      showBest: "Ver la mejor",
      onWord: "Sí",
      offWord: "No",
      helpGhost: "Otra vez puede mostrar una copia gris tenue de tus mejores rampas. Ver la mejor la enciende o la apaga.",
      dailyCup: "Taza del día",
      helpDaily: "La taza del día es nueva cada día de clase. Es la misma para toda la clase. Tu mejor marca se queda solo en este aparato.",
      helpDailyBest: "La ficha de la taza del día muestra tu mejor marca de hoy.",
      helpRamps: "«1 rampa» y «2 rampas» usan la palabra correcta en cada idioma.",
      wdMon: "lun", wdTue: "mar", wdWed: "mié", wdThu: "jue", wdFri: "vie",
      mo1: "ene", mo2: "feb", mo3: "mar", mo4: "abr", mo5: "may", mo6: "jun", mo7: "jul", mo8: "ago", mo9: "sep", mo10: "oct", mo11: "nov", mo12: "dic",
      helpDate: "La fecha de la taza del día se ve en tu idioma.",
      testHelp: "Solo para el personal: con el modo Prueba, salta a ganar o a perder; los puntos van solo al tablero TEST.",
      teachSlope: "Más pendiente = flujo más rápido",
      teachGel: "Líquido espeso (alta viscosidad) fluye más lento",
      teachRate: "Caudal = cuánto se vierte cada segundo",
      bestWord: "Récord:", rampsWord: "rampas", rampsOne: "rampa", rampsTwo: "rampas", rampsFew: "rampas", rampsMany: "rampas", rampsOther: "rampas", newBest: "¡Nuevo récord!", tryFewer: "Prueba con menos",
      read: "Léemelo", language: "Idioma",
      lv1: "Primera rampa", lv2: "Dos tazas", lv3: "Primera fuga", lv4: "Gel lento", lv5: "Elige el camino",
      done1: "Primera rampa lista.", done2: "Dos tazas listas.", done3: "Primera fuga lista.", done4: "Gel lento listo.",
      nextLevel: "Siguiente nivel", beat: "Supera tu llenado", hub: "Volver al inicio",
      noMore: "No hay más rampas por ahora.",
      paused: "Pausa",
      local: "Los alias y las tazas se quedan en este Chromebook. Sin nombres. Sin chat.",
      canvas: "Dibuja una rampa desde el dispensador hasta la taza."
    },
    ar: {
      menu: "القائمة", close: "إغلاق", pause: "إيقاف", resume: "متابعة", draw: "ارسم", erase: "امسح", undo: "تراجع", clear: "امسح الكل", pour: "اسكب", retry: "أعد",
      lesson: "الأكثر انحدارًا = أسرع. الأكثر نعومة = أنظف.",
      lesson2: "الأكثر انحدارًا = أسرع. الأكثر نعومة = أنظف. اترك مكانًا للمنحدر التالي قبل أن تصب.",
      lesson3: "الماء يجد الطريق المنخفض. فجوة صغيرة تسرّب كل السيل.",
      lesson4: "الهلام السميك يحتاج تلة أكبر. إذا لم يتحرك، كبّر التلة.",
      lesson5: "نفس المنحدر، صبّ مختلف. الحبوب تحب التلة. الماء يحتاج الحافة.",
      ghost: "ارسم منحدرًا هكذا", clearAsk: "مسح كل المنحدرات؟", yes: "نعم", no: "لا",
      grains: "حبوب", water: "ماء", gel: "هلام", blockWord: "كتلة", wallWord: "الجدار", fillTo: "املأ إلى هنا",
      empty: "الكوب: فارغ", little: "الكوب: قليل", half: "الكوب: قريب من النصف", moreHalf: "الكوب: أكثر من النصف", almost: "الكوب: قريب من الامتلاء", done: "الكوب: حتى الخط",
      startHint: "ارسم، ثم صبّ.",
      noSpill: "لا انسكاب", bitSpill: "انسكاب قليل", someSpill: "بعض الانسكاب",
      starWord: "نجمة", starsWord: "نجوم",
      stackTile: "كومة الأكواب", stackBack: "المنحدرات",
      stackAsk: "المس الكوب المنقّط. يثبت في مكانه.",
      stackNext: "ثبّت الكوب التالي فوقه.",
      stackTip: "بعيد جدًا. وقع. المس إعادة.",
      stackStand: "الكومة ثابتة.",
      stackCaught: "الكوب الأعلى أمسك الحبوب.",
      stackLesson: "المس الأكواب المنقّطة لتكديس 3. اللمس البعيد يوقعها.",
      spill: "انسكب هنا — جرّب منحدرًا أقل انحدارًا.",
      sat: "الهلام واقف — اجعل التلة أكبر.",
      leak: "تسرب الماء من هذه الفجوة — اجعل المنحدر يركب على حافة الكوب.",
      blocked: "الكتلة أوقفت الماء — ارسم المنحدر فوقها.",
      leftFirst: "املأ الكوب الأيسر أولًا.",
      leftNext: "الكوب الأيسر امتلأ — ارسم منحدرًا إلى الكوب الآخر.",
      pathNext: "كوب الحبوب امتلأ — اختر الماء وارسم إلى ذلك الكوب.",
      wrong: "الحبوب تذهب إلى الكوب الأيسر.",
      wrongW: "الماء يذهب إلى الكوب الأيمن.",
      left: "اليسار", right: "اليمين",
      filled: "امتلأ!", repour: "اسكب مرة أخرى", next: "التالي", more: "هل تملأ المزيد؟",
      you: "أنت: #", noneRank: "أنت: #—", top: "أفضل 10", alias: "اسم مستعار",
      whats: "RF 1.0.19 — قائمة البداية لم تعد تُظهر الإيقاف المؤقت أو شريط الامتلاء.",
      levels: "المراحل", home: "البداية",
      refTile: "الحَكَم", countUp: "للأعلى", countDown: "عدّ تنازلي", refStart: "ابدأ", refStop: "أوقف", refReset: "أعد", refDone: "تم", timeUp: "الوقت!", minutes: "دقائق",
      cardWord: "بطاقة", youNeed: "تحتاج:", teamWord: "فريق", pyramid: "هرم", tower: "برج", bridge: "جسر", stairs: "درج", ideas: "أفكار الرص", line: "صف", handsOff: "ارفعوا الأيدي — الوقت مقفل", nextCard: "البطاقة التالية",
      progress: "التقدّم", startOver: "ابدأ من جديد", resetAsk: "البدء من جديد؟ تُمسح الأكواب والنجوم.", openWord: "مفتوح", locked: "مغلق",
      whatsNew: "ما الجديد", help: "مساعدة",
      helpDraw: "ارسم منحدرًا مثل الدليل المنقط.",
      helpPour: "اضغط اسكب. الحبوب (الماء لاحقًا) تنزلق إلى الكوب.",
      helpPour2: "اضغط اسكب. الحبوب تملأ الكوب الأيسر ثم الأيمن.",
      helpPour3: "اضغط اسكب. الماء يدخل حين يلامس المنحدر حافة الكوب.",
      helpPour4: "اضغط اسكب. الهلام بطيء. الصينية المسطحة لا تحرّكه.",
      helpPour5: "اختر الحبوب أو الماء. واحد فقط يُصب في كل مرة.",
      cupsWord: "الأكواب:",
      toolRow: "أدوات المنحدر",
      helpSpill: "الانسكاب يبقى في دائرة. أصلح المنحدر. إعادة تبقي المنحدرات.",
      helpLesson: "اقرأ سطر الدرس عندما تفوز.",
      helpFewer: "حاول أن تفوز بمنحدرات أقل.",
      helpPause: "الإيقاف المؤقت سهل اللمس دائمًا، حتى بالوضع الأفقي.",
      fillWord: "الامتلاء",
      helpSplash: "السكب يرش. نسبة الامتلاء ترتفع. كتم الصوت يوقف النغمة.",
      lockedWhy: "مقفل. أنهِ المستوى الذي قبله.",
      helpStars: "قائمة المستويات تعرض نجومك وأفضل منحدراتك.",
      helpClear: "عند الفوز تظهر النجوم واحدة واحدة. التالي جاهز.",
      showBest: "أظهر الأفضل",
      onWord: "تشغيل",
      offWord: "إيقاف",
      helpGhost: "إعادة المحاولة تعرض نسخة رمادية باهتة من أفضل منحدراتك. أظهر الأفضل يشغلها أو يوقفها.",
      dailyCup: "كوب اليوم",
      helpDaily: "كوب اليوم كوب جديد في كل يوم دراسي. هو نفسه لكل الصف. أفضل نتيجة تبقى على هذا الجهاز فقط.",
      helpDailyBest: "بطاقة كوب اليوم تعرض أفضل نتيجة لك اليوم.",
      helpRamps: "«1 منحدر» و«2 منحدران» بالكلمة الصحيحة في كل لغة.",
      wdMon: "الإثنين", wdTue: "الثلاثاء", wdWed: "الأربعاء", wdThu: "الخميس", wdFri: "الجمعة",
      mo1: "يناير", mo2: "فبراير", mo3: "مارس", mo4: "أبريل", mo5: "مايو", mo6: "يونيو", mo7: "يوليو", mo8: "أغسطس", mo9: "سبتمبر", mo10: "أكتوبر", mo11: "نوفمبر", mo12: "ديسمبر",
      helpDate: "تاريخ كوب اليوم يظهر بلغتك.",
      testHelp: "للموظفين فقط: مع وضع الاختبار، اقفز إلى الفوز أو الخسارة؛ النقاط تذهب إلى لوحة TEST فقط.",
      teachSlope: "ميل أكثر انحدارًا = تدفق أسرع",
      teachGel: "سائل كثيف (لزوجة عالية) يسيل أبطأ",
      teachRate: "معدل التدفق = كم يُسكب كل ثانية",
      bestWord: "الأفضل:", rampsWord: "منحدرات", rampsOne: "منحدر", rampsTwo: "منحدران", rampsFew: "منحدرات", rampsMany: "منحدرًا", rampsOther: "منحدر", newBest: "رقم جديد!", tryFewer: "جرّب بعدد أقل",
      read: "اقرأه لي", language: "اللغة",
      lv1: "المنحدر الأول", lv2: "كوبان", lv3: "أول تسرب", lv4: "هلام بطيء", lv5: "اختر المسار",
      done1: "المنحدر الأول تم.", done2: "الكوبان تمّا.", done3: "أول تسرب تم.", done4: "الهلام البطيء تم.",
      nextLevel: "المستوى التالي", beat: "تفوّق على ملئك", hub: "رجوع إلى البداية",
      noMore: "لا منحدرات أخرى الآن.",
      paused: "متوقف",
      local: "الأسماء المستعارة والأكواب تبقى على هذا الجهاز. بلا أسماء حقيقية. بلا دردشة.",
      canvas: "ارسم منحدرًا من الموزّع إلى الكوب."
    },
    "fa-AF": {
      menu: "فهرست", close: "بستن", pause: "مکث", resume: "ادامه", draw: "بکش", erase: "پاک کن", undo: "برگرد", clear: "پاک همه", pour: "بریز", retry: "دوباره",
      lesson: "تندتر = تیزتر. هموارتر = پاکیزه‌تر.",
      lesson2: "تندتر = تیزتر. هموارتر = پاکیزه‌تر. پیش از ریختن برای سرازیری بعدی جا بگذار.",
      lesson3: "آب راه پایین را پیدا می‌کند. یک شکاف کوچک همه جریان را می‌ریزد.",
      lesson4: "ژل غلیظ به تپه بزرگ‌تر نیاز دارد. اگر نرفت، تپه را بزرگ‌تر کن.",
      lesson5: "همان سطح شیب‌دار، ریزش دیگر. دانه‌ها تپه را دوست دارند. آب به لبه نیاز دارد.",
      ghost: "یک سرازیری این‌طور بکش", clearAsk: "همه سرازیری‌ها پاک شود؟", yes: "بله", no: "نه",
      grains: "دانه‌ها", water: "آب", gel: "ژل", blockWord: "بلوک", wallWord: "دیوار", fillTo: "تا اینجا پر کن",
      empty: "پیاله: خالی", little: "پیاله: کمی", half: "پیاله: نزدیک نیمه", moreHalf: "پیاله: بیشتر از نیمه", almost: "پیاله: نزدیک پر", done: "پیاله: تا خط",
      startHint: "بکش، بعد بریز.",
      noSpill: "چیزی نریخت", bitSpill: "کمی ریخت", someSpill: "مقداری ریخت",
      starWord: "ستاره", starsWord: "ستاره‌ها",
      stackTile: "دسته پیاله", stackBack: "سرازیری‌ها",
      stackAsk: "پیاله نقطه‌چین را بزن. سر جایش می‌نشیند.",
      stackNext: "پیاله بعدی را بالا بچسبان.",
      stackTip: "خیلی دور است. افتاد. دوباره را بزن.",
      stackStand: "دسته ایستاده است.",
      stackCaught: "پیاله بالا دانه‌ها را گرفت.",
      stackLesson: "پیاله‌های نقطه‌چین را بزن تا ۳ تا بچینی. لمس دور می‌اندازد.",
      spill: "اینجا ریخت — یک سرازیری تخت‌تر را امتحان کن.",
      sat: "ژل ایستاد — تپه را بزرگ‌تر کن.",
      leak: "آب از این شکاف ریخت — سرازیری را روی لبه پیاله بگذار.",
      blocked: "بلوک آب را ایستاند — سرازیری را از روی آن بکش.",
      leftFirst: "اول پیاله چپ را پر کن.",
      leftNext: "پیاله چپ پر شد — یک سرازیری تا پیاله دیگر بکش.",
      pathNext: "پیالهٔ دانه‌ها پر شد — آب را انتخاب کن و تا آن پیاله بکش.",
      wrong: "دانه‌ها به پیالهٔ چپ می‌روند.",
      wrongW: "آب به پیالهٔ راست می‌رود.",
      left: "چپ", right: "راست",
      filled: "پر شد!", repour: "دوباره بریز", next: "بعدی", more: "می‌توانی بیشتر پر کنی؟",
      you: "تو: #", noneRank: "تو: #—", top: "ده تای برتر", alias: "نام مستعار",
      whats: "RF 1.0.19 — فهرست خانه دیگر مکث یا نوار پُرشدن را نشان نمی‌دهد.",
      levels: "مرحله‌ها", home: "خانه",
      refTile: "داور", countUp: "رو به بالا", countDown: "شمارش معکوس", refStart: "شروع", refStop: "ایست", refReset: "از نو", refDone: "تمام", timeUp: "وقت!", minutes: "دقیقه",
      cardWord: "کارت", youNeed: "لازم:", teamWord: "تیم", pyramid: "هرم", tower: "برج", bridge: "پل", stairs: "پله", ideas: "ایده‌های چیدن", line: "ردیف", handsOff: "دست‌ها دور — وقت قفل شد", nextCard: "کارت بعدی",
      progress: "پیشرفت", startOver: "از نو", resetAsk: "از نو؟ پیاله‌ها و ستاره‌ها پاک می‌شوند.", openWord: "باز", locked: "بسته",
      whatsNew: "تازه‌ها", help: "کمک",
      helpDraw: "سرازیری را مثل نقطه‌ها بکش.",
      helpPour: "بریز را بزن. دانه‌ها (آب بعداً) به پیاله می‌لغزند.",
      helpPour2: "بریز را بزن. دانه‌ها اول پیاله چپ را پر می‌کنند، بعد راست را.",
      helpPour3: "بریز را بزن. آب وقتی وارد می‌شود که سرازیری روی لبه پیاله باشد.",
      helpPour4: "بریز را بزن. ژل آهسته است. سینی تخت آن را تکان نمی‌دهد.",
      helpPour5: "دانه‌ها یا آب را انتخاب کن. هر بار فقط یکی می‌ریزد.",
      cupsWord: "پیاله‌ها:",
      toolRow: "ابزار سطح شیب‌دار",
      helpSpill: "ریختن در دایره می‌ماند. سرازیری را درست کن. دوباره سرازیری‌ها را نگه می‌دارد.",
      helpLesson: "وقتی بردی خط درس را بخوان.",
      helpFewer: "بکوش با سطح شیب‌دار کمتر ببری.",
      helpPause: "توقف همیشه آسان زده می‌شود، حتی در حالت افقی.",
      fillWord: "پُرشدن",
      helpSplash: "ریختن می‌پاشد. درصد پُرشدن بالا می‌رود. بی‌صدا نغمه را خاموش می‌کند.",
      lockedWhy: "بسته است. اول سطح قبلی را تمام کن.",
      helpStars: "فهرست سطح‌ها ستاره‌ها و کمترین سطح شیب‌دار را نشان می‌دهد.",
      helpClear: "وقتی می‌بری، ستاره‌ها یکی یکی می‌آیند. بعدی آماده است.",
      showBest: "بهترین را نشان بده",
      onWord: "روشن",
      offWord: "خاموش",
      helpGhost: "دوباره می‌تواند نسخهٔ خاکستری کم‌رنگ بهترین سطح‌ها را نشان دهد. بهترین را نشان بده آن را روشن یا خاموش می‌کند.",
      dailyCup: "پیالهٔ امروز",
      helpDaily: "پیالهٔ امروز هر روز مکتب نو است. برای همهٔ صنف یکی است. بهترین عدد فقط روی همین دستگاه می‌ماند.",
      helpDailyBest: "کارت پیالهٔ امروز بهترین عدد امروزت را نشان می‌دهد.",
      helpRamps: "«۱ سطح» و «۲ سطح‌ها» در هر زبان واژهٔ درست دارند.",
      wdMon: "دوشنبه", wdTue: "سه‌شنبه", wdWed: "چهارشنبه", wdThu: "پنجشنبه", wdFri: "جمعه",
      mo1: "جنوری", mo2: "فبروری", mo3: "مارچ", mo4: "اپریل", mo5: "می", mo6: "جون", mo7: "جولای", mo8: "اگست", mo9: "سپتمبر", mo10: "اکتبر", mo11: "نومبر", mo12: "دسمبر",
      helpDate: "تاریخ پیالهٔ امروز به زبان تو دیده می‌شود.",
      testHelp: "فقط برای کارکنان: با حالت آزمایش، به برد یا باخت بپر؛ امتیازها فقط به تختهٔ TEST می‌روند.",
      teachSlope: "شیب تندتر = جریان تندتر",
      teachGel: "مایع غلیظ (گران‌روی بالا) آهسته‌تر می‌رود",
      teachRate: "سرعت جریان = در هر ثانیه چقدر می‌ریزد",
      bestWord: "بهترین:", rampsWord: "سطح", rampsOne: "سطح", rampsTwo: "سطح‌ها", rampsFew: "سطح‌ها", rampsMany: "سطح‌ها", rampsOther: "سطح‌ها", newBest: "رکورد تازه!", tryFewer: "با کمتر امتحان کن",
      read: "برایم بخوان", language: "زبان",
      lv1: "سرازیری اول", lv2: "دو پیاله", lv3: "اولین نشت", lv4: "ژل آهسته", lv5: "مسیر را انتخاب کن",
      done1: "سرازیری اول تمام شد.", done2: "دو پیاله تمام شد.", done3: "اولین نشت تمام شد.", done4: "ژل آهسته تمام شد.",
      nextLevel: "سطح بعدی", beat: "پر کردن خود را بهتر کن", hub: "بازگشت به آغاز",
      noMore: "سرازیری دیگری فعلاً نیست.",
      paused: "مکث",
      local: "نام‌های مستعار و پیاله‌ها روی همین دستگاه می‌مانند. نام واقعی نیست. گفتگو نیست.",
      canvas: "از پخش‌کننده تا پیاله یک سرازیری بکش."
    },
    rw: {
      menu: "Ibikubiyemo", close: "Funga", pause: "Hagarara", resume: "Komeza", draw: "Shushanya", erase: "Siba", undo: "Subira", clear: "Siba byose", pour: "Suka", retry: "Ongera",
      lesson: "Gupfuka = kwihuta. Gukora neza = gutunganya.",
      lesson2: "Gupfuka = kwihuta. Gukora neza = gutunganya. Sigaho umwanya w'umuhengamo ukurikira mbere yo gusuka.",
      lesson3: "Amazi ashaka inzira yo hasi. Akanya gato gasuka umuriro wose.",
      lesson4: "Jeli y'umutobe ikeneye umusozi munini. Niba itagenda, nuna umusozi.",
      lesson5: "Umuhanda umwe, gusuka gutandukanye. Ibinyobwa bikunda umusozi. Amazi akeneye uruhande.",
      ghost: "Shushanya umuhengamo utya", clearAsk: "Siba imihengamo yose?", yes: "Yego", no: "Oya",
      grains: "Ibinyanye", water: "Amazi", gel: "Jeli", blockWord: "Igipimo", wallWord: "Urukuta", fillTo: "uzuza kugeza hano",
      empty: "Igikombe: kirimo ubusa", little: "Igikombe: gito", half: "Igikombe: hafi kimwe cya kabiri", moreHalf: "Igikombe: kirenze kimwe cya kabiri", almost: "Igikombe: hafi kuzura", done: "Igikombe: kugeza ku murongo",
      startHint: "Shushanya, hanyuma usuke.",
      noSpill: "ntacyasutse", bitSpill: "gito cyasutse", someSpill: "bimwe byasutse",
      starWord: "inyenyeri", starsWord: "inyenyeri",
      stackTile: "Igipfunsi cy'ibikombe", stackBack: "Imihengamo",
      stackAsk: "Kanda igikombe cy'utudomo. Kigira ahantu.",
      stackNext: "Shyira ikindi hejuru.",
      stackTip: "Kure cyane. Cyaguye. Kanda Ongera.",
      stackStand: "Igipfunsi gihagarara.",
      stackCaught: "Igikombe cyo hejuru cyafashe ibinyampeke.",
      stackLesson: "Kanda utudomo ukore 3. Ukanda kure bigwa.",
      spill: "Byasutse hano — gerageza umuhengamo utoroshye.",
      sat: "Jeli yicaye — nuna umusozi.",
      leak: "Amazi yasutse muri aka kanya — shira umuhengamo ku murongo w'igikombe.",
      blocked: "Igipimo cyahagaritse amazi — shushanya umuhengamo hejuru yacyo.",
      leftFirst: "Banza wuzuze igikombe cy'ibumoso.",
      leftNext: "Igikombe cy'ibumoso cyuzuye — shushanya umuhengamo ujya ku kindi.",
      pathNext: "Igikombe cy'impeke cyuzuye — hitamo Amazi ushushe kugera kuri icyo gikombe.",
      wrong: "Ibinyanye bijya mu gikombe cy'ibumoso.",
      wrongW: "Amazi ajya mu gikombe cy'iburyo.",
      left: "Ibumoso", right: "Iburyo",
      filled: "Cyuzuye!", repour: "Suka ukundi", next: "Ikurikira", more: "waba ushobora kwuzuza ibindi?",
      you: "Wowe: #", noneRank: "Wowe: #—", top: "10 za mbere", alias: "Izina ry'akazi",
      whats: "RF 1.0.19 — Ibikubiyemo byo mu rugo ntibigaragaza Ihagarara cyangwa umurongo w'ubuzura.",
      levels: "Ingero", home: "Ahabanza",
      refTile: "Umusifuzi", countUp: "Kureba hejuru", countDown: "Kubara hasi", refStart: "Tangira", refStop: "Hagarara", refReset: "Ongera", refDone: "Byarangiye", timeUp: "Igihe!", minutes: "Iminota",
      cardWord: "Ikarita", youNeed: "Ukeneye:", teamWord: "Ikipe", pyramid: "Impyiramidi", tower: "Inzu ndende", bridge: "Ikiraro", stairs: "Amadarajya", ideas: "Ibitekerezo", line: "Ururimi", handsOff: "Kuraho amaboko — igihe cyafunze", nextCard: "Ikarita ikurikira",
      progress: "Intambwe", startOver: "Tangira bushya", resetAsk: "Tangira bushya? Ibikombe n'inyenyeri bisibangana.", openWord: "bifunguye", locked: "bifunze",
      whatsNew: "Ibishya", help: "Ubufasha",
      helpDraw: "Shushanya umuhengamo nka utudomo.",
      helpPour: "Kanda Suka. Ibinyanye (amazi nyuma) bigera mu gikombe.",
      helpPour2: "Kanda Suka. Ibinyanye buzura igikombe cy'ibumoso, hanyuma icy'iburyo.",
      helpPour3: "Kanda Suka. Amazi yinjira iyo umuhengamo wicaye ku munwa w'igikombe.",
      helpPour4: "Kanda Suka. Jeli itinda. Urubaho rw'urutambike ntiruyikurura.",
      helpPour5: "Hitamo ibinyobwa cyangwa amazi. Rimwe gusa rirasuka.",
      cupsWord: "Ibikombe:",
      toolRow: "Ibikoresho by'imihanda",
      helpSpill: "Ibyasutse biguma mu ruziga. Kosora umuhengamo. Ongera bisiga imihengamo.",
      helpLesson: "Soma umurongo w'isomo iyo utsinze.",
      helpFewer: "Gerageza gutsinda n'imihanda mike.",
      helpPause: "Hagarara byoroshye gukanda buri gihe, ndetse uri ku ruhande.",
      fillWord: "Kuzuza",
      helpSplash: "Gusuka biratemba. Ijanisha ryo kuzuza riratera. Guhagarika ijwi bihagarika umuziki.",
      lockedWhy: "Bifunze. Banza urangize urwego rwabanze.",
      helpStars: "Urutonde rw'inzego rwerekana inyenyeri zawe n'imihanda mike.",
      helpClear: "Iyo utsinze, inyenyeri ziza imwe imwe. Ikurikira iriteguye.",
      showBest: "Erekana byiza",
      onWord: "Gukora",
      offWord: "Hagarara",
      helpGhost: "Ongera ishobora kwerekana kopi y'ubugugu y'imihanda yawe myiza. Erekana byiza yikora cyangwa ihagarara.",
      dailyCup: "Igikombe cy'uyu munsi",
      helpDaily: "Igikombe cy'uyu munsi ni igikombe gishya buri munsi w'ishuri. Ni kimwe ku ishuri ryose. Ibyiza byawe biguma kuri iki gikoresho gusa.",
      helpDailyBest: "Agace k'igikombe cy'uyu munsi kerekana agahigo kawe k'uyu munsi.",
      helpRamps: "\"1 umuhanda\" na \"2 imihanda\" bikoresha ijambo ry'ukuri muri buri rurimi.",
      wdMon: "Mbe", wdTue: "Kab", wdWed: "Gtu", wdThu: "Kan", wdFri: "Gta",
      mo1: "Mut", mo2: "Gas", mo3: "Wer", mo4: "Mat", mo5: "Gic", mo6: "Kam", mo7: "Nya", mo8: "Kan", mo9: "Nze", mo10: "Ukw", mo11: "Ugu", mo12: "Uku",
      helpDate: "Itariki y'igikombe cy'uyu munsi igaragara mu rurimi rwawe.",
      testHelp: "Abakozi gusa: mu buryo bw'igerageza, iruka gutsinda cyangwa gutsindwa; amanota ajya ku kibaho cya TEST gusa.",
      teachSlope: "Ubuhaname bukabije = itemba ryihuta",
      teachGel: "Itabaza rikomeye (visikozite nyinshi) ritemba buhoro",
      teachRate: "Umuvuduko = ingano itemba buri segonda",
      bestWord: "Agahigo:", rampsWord: "imihanda", rampsOne: "umuhanda", rampsTwo: "imihanda", rampsFew: "imihanda", rampsMany: "imihanda", rampsOther: "imihanda", newBest: "Agahigo gashya!", tryFewer: "Gerageza nkeya",
      read: "Nsome", language: "Ururimi",
      lv1: "Umuhengamo wa mbere", lv2: "Ibikombe bibiri", lv3: "Isutse rya mbere", lv4: "Jeli itinda", lv5: "Hitamo inzira",
      done1: "Umuhengamo wa mbere warangiye.", done2: "Ibikombe bibiri byarangiye.", done3: "Isutse rya mbere ryarangiye.", done4: "Jeli itinda yarangiye.",
      nextLevel: "Urwego rukurikira", beat: "Irusha uko wuzuye", hub: "Subira ahatangira",
      noMore: "Nta mihengamo indi ubu.",
      paused: "Byahagaze",
      local: "Amazina y'akazi n'ibikombe biguma kuri iki gikoresho. Nta mazina y'ukuri. Nta kiganiro.",
      canvas: "Shushanya umuhengamo uva ku musuka ugera ku gikombe."
    },
    ti: {
      menu: "ዝርዝር", close: "ዕጸው", pause: "ደው", resume: "ቀጽል", draw: "ስኣል", erase: "ደምስስ", undo: "ምለስ", clear: "ኩሉ ደምስስ", pour: "ቀድሕ", retry: "ደጊም",
      lesson: "ዝቐነዐ = ዝቕልጥፍ። ዝለመመ = ዝጽሩይ።",
      lesson2: "ዝቐነዐ = ዝቕልጥፍ። ዝለመመ = ዝጽሩይ። ቅድሚ ምቅዳሕ ንዝቕጽል ቁልቁለት ቦታ ግደፍ።",
      lesson3: "ማይ ትሑት መንገዲ ይረክብ። ንእሽቶ ስንጥቕ ኩሉ ፍልፍል የፍስስ።",
      lesson4: "ጄል ዝወፈረ ዓቢ ኮረብታ የድሊ። እንተዘይንቀሳቐስ፣ ኮረብታ ዓብዩ ግበር።",
      lesson5: "ሓደ መንሸራተቲ፡ ዝተፈልየ ምቅዳሕ። እኽሊ ኮረብታ ይፈቱ። ማይ ኣፍደገ የድልዮ።",
      ghost: "ቁልቁለት ከምዚ ስኣል", clearAsk: "ኩሎም ቁልቁለታት ይደምሰሱ?", yes: "እወ", no: "ኣይፋል",
      grains: "እኽሊ", water: "ማይ", gel: "ጄል", blockWord: "መቆራጽ", wallWord: "መንደቕ", fillTo: "ክሳብ ኣብዚ ምላእ",
      empty: "ኽባያ: ባዶ", little: "ኽባያ: ቁሩብ", half: "ኽባያ: ዳርጋ ፍርቂ", moreHalf: "ኽባያ: ልዕሊ ፍርቂ", almost: "ኽባያ: ዳርጋ መሊኡ", done: "ኽባያ: ክሳብ መስመር",
      startHint: "ስዓል፣ ድሕሪኡ ኣፍስስ።",
      noSpill: "ዝፈሰሰ የለን", bitSpill: "ቁሩብ ፈሲሱ", someSpill: "ገለ ፈሲሱ",
      starWord: "ኮኾብ", starsWord: "ኮኾባት",
      stackTile: "ዕኹል ኽባያት", stackBack: "ቁልቁለታት",
      stackAsk: "ነቲ ነጥብታት ዘለዎ ኽባይ ጠውቕ። ይጣበቕ።",
      stackNext: "ዝቕጽል ኽባይ ኣብ ላዕሊ ጠውቕ።",
      stackTip: "ርሑቕ እዩ። ወዲቑ። ደጊምካ ጠውቕ።",
      stackStand: "ዕኹል ቐሚጡ ኣሎ።",
      stackCaught: "እቲ ላዕለዋይ ኽባይ እቲ ዘርኢ ሒዙ።",
      stackLesson: "ነቲ ነጥብታት ጠውቕ ክትደርድር 3። ርሑቕ ምጥዋቕ የውድቕ።",
      spill: "ኣብዚ ፈሲሱ — ዝተዓርየ ቁልቁለት ፈትን።",
      sat: "ጄል ጸኒዑ — ኮረብታ ዓብዩ ግበር።",
      leak: "ማይ ኣብዚ ስንጥቕ ፈሲሱ — ቁልቁለት ኣብ ዳርቢ ኽባያ ኣድርቦ።",
      blocked: "መቆራጽ ማይ ኣቋሪጹ — ቁልቁለት ኣብ ልዕሊኡ ስኣል።",
      leftFirst: "መጀመርታ ጸጋማይ ኽባያ ምላእ።",
      leftNext: "ጸጋማይ ኽባያ መሊኡ — ናብቲ ካልእ ቁልቁለት ስኣል።",
      pathNext: "ጽዋዕ ፍረታት ተመሊኡ — ማይ ምረጽ ክሳብ እታ ጽዋዕ ስኣል።",
      wrong: "እኽሊ ናብ ጸጋማይ ጽዋዕ ይኸይድ።",
      wrongW: "ማይ ናብ የማናይ ጽዋዕ ይኸይድ።",
      left: "ጸጋም", right: "የማን",
      filled: "መሊኡ!", repour: "ደጊምካ ቀድሕ", next: "ዝቕጽል", more: "ተወሳኺ ክትመልእ ትኽእል ዲኻ?",
      you: "ንስኻ: #", noneRank: "ንስኻ: #—", top: "ላዕለዎት 10", alias: "ሕጉስ ስም",
      whats: "RF 1.0.19 — መእተዊ ገጽ ፓውዝ ወይ መስመር ምምላእ ኣይርኢን።",
      levels: "ደረጃታት", home: "መጀመርታ",
      refTile: "ዳኛ", countUp: "ንላዕሊ", countDown: "ቁጽሪ ታሕቲ", refStart: "ጀምር", refStop: "ደው", refReset: "ዳግም", refDone: "ተወዲኡ", timeUp: "ሰዓት!", minutes: "ደቓይቕ",
      cardWord: "ካርድ", youNeed: "የድሊ:", teamWord: "ጋንታ", pyramid: "ሕርሚ", tower: "ግምቢ", bridge: "ድልድል", stairs: "መደያን", ideas: "ሓሳባት", line: "መስመር", handsOff: "ኢድካት ኣልዕሉ — ሰዓት ተዓጽየ", nextCard: "ዝቕጽል ካርድ",
      progress: "ምዕባለ", startOver: "ካብ ጀምር", resetAsk: "ካብ ጀምር? ኩባያታትን ኮኾብትን ይጠፍኡ።", openWord: "ኩፉት", locked: "ዕጹው",
      whatsNew: "ሓድሽ", help: "ሓገዝ",
      helpDraw: "ቁልቁለት ከም ነጥብታት ስኣል።",
      helpPour: "ቀድሕ ጠውቕ። እኽሊ (ማይ ድሕሪት) ናብ ኽባያ ይንሸራተት።",
      helpPour2: "ቀድሕ ጠውቕ። እኽሊ ቀዳማይ ጸጋማይ ኽባያ የምልእ፣ ድሕሪኡ የማናይ።",
      helpPour3: "ቀድሕ ጠውቕ። ማይ የእቱ እንተኾይኑ ቁልቁለት ኣብ ከንፈር ኽባያ ምስ ደቀሰ።",
      helpPour4: "ቀድሕ ጠውቕ። ጄል ቀስ ይብል። ጠፍጣፍ ሳሕን ኣይንቀሳቐሶን።",
      helpPour5: "እኽሊ ወይ ማይ ምረጽ። ሓደ ጥራይ እዩ ዝቐድሕ።",
      cupsWord: "ኽባያታት:",
      toolRow: "መሳርሒ መንሸራተቲ",
      helpSpill: "ዝፈሰሰ ኣብ ዓንኬል ይጸንሕ። ቁልቁለት ኣዐሪ። ደጊም ቁልቁለታት ይሕልዉ።",
      helpLesson: "ምስ ተዓወትካ መስመር ትምህርቲ ኣንብብ።",
      helpFewer: "ብውሑዳት መንሸራተቲ ክትዓውት ፈትን።",
      helpPause: "ጠጠው ምባል ኩሉ ግዜ ቀሊል እዩ፣ ብጐድኒ እውን።",
      fillWord: "ምምላእ",
      helpSplash: "ምቕዳሕ ይረጭ። ሚእታዊ ምምላእ ይወስኽ። ድምጺ ምዕጻው ነቲ ድምጺ የጥፍኦ።",
      lockedWhy: "ተዓጽዩ። ነቲ ቅድሚኡ ደረጃ ወድእ።",
      helpStars: "ዝርዝር ደረጃታት ኮኾብትኻን ዝበለጸ መንሸራተቲን የርኢ።",
      helpClear: "ምስ ተዓወትካ ኮኾብቲ ሓደ ሓደ ይመጹ። ዝቕጽል ድሉው እዩ።",
      showBest: "ዝበለጸ ኣርኢ",
      onWord: "ተኸፊቱ",
      offWord: "ጠፊኡ",
      helpGhost: "ዳግማይ ምፍታን ናይ ዝበለጸ መንሸራተቲ ግራጫ ቅዳሕ ከርኢ ይኽእል። ዝበለጸ ኣርኢ የብርሆ ወይ የጥፍኦ።",
      dailyCup: "ጽዋዕ ናይ ሎሚ",
      helpDaily: "ጽዋዕ ናይ ሎሚ ኣብ ነፍሲ ወከፍ መዓልቲ ትምህርቲ ሓድሽ እዩ። ንኹሉ ክፍሊ ተመሳሳሊ እዩ። ዝበለጸ ውጽኢት ኣብዚ መሳርሒ ጥራይ ይቕመጥ።",
      helpDailyBest: "ሰሌዳ ጽዋዕ ናይ ሎሚ ናይ ሎሚ ሪኮርድካ የርኢ።",
      helpRamps: "\"1 መንሸራተቲ\" እና \"2 መንሸራተታት\" ብቃል ቅኑዕ ኣብ ነፍሲ ወከፍ ቋንቋ።",
      wdMon: "ሰኑ", wdTue: "ሰሉ", wdWed: "ረቡ", wdThu: "ሓሙ", wdFri: "ዓር",
      mo1: "ጥሪ", mo2: "ለካ", mo3: "መጋ", mo4: "ሚያ", mo5: "ግን", mo6: "ሰነ", mo7: "ሓም", mo8: "ነሓ", mo9: "መስ", mo10: "ጥቅ", mo11: "ሕዳ", mo12: "ታሕ",
      helpDate: "ዕለት ጽዋዕ ናይ ሎሚ ብቋንቋኻ ትርአ።",
      testHelp: "ንሰራሕተኛታት ጥራይ፡ መፈተኒ ኣገባብ ምስ ዝበራህ ናብ ዓወት ወይ ምስዓር ዝለል፣ ነጥብታት ናብ ሰሌዳ TEST ጥራይ ይኸዱ።",
      teachSlope: "ዝቐነዐ ዝንባለ = ዝቕልጥፍ ውሕጅ",
      teachGel: "ርጉእ ፈሳሲ (ልዑል ርጉእነት) ቀስ ይውሕጅ",
      teachRate: "ፍጥነት ውሕጅ = ኣብ ሰከንድ ክንደይ ይውሕጅ",
      bestWord: "ሪኮርድ:", rampsWord: "መንሸራተቲ", rampsOne: "መንሸራተቲ", rampsTwo: "መንሸራተታት", rampsFew: "መንሸራተታት", rampsMany: "መንሸራተታት", rampsOther: "መንሸራተታት", newBest: "ሓድሽ ሪኮርድ!", tryFewer: "ብውሑድ ፈትን",
      read: "ኣንብበለይ", language: "ቋንቋ",
      lv1: "ቀዳማይ ቁልቁለት", lv2: "ክልተ ኽባያታት", lv3: "ቀዳማይ ፍሳስ", lv4: "ቀስ ዝብል ጄል", lv5: "መገዲ ምረጽ",
      done1: "ቀዳማይ ቁልቁለት ተዛዚሙ።", done2: "ክልተ ኽባያታት ተዛዚሞም።", done3: "ቀዳማይ ፍሳስ ተዛዚሙ።", done4: "ቀስ ዝብል ጄል ተዛዚሙ።",
      nextLevel: "ዝቕጽል ደረጃ", beat: "ምልኣትካ ዓዊር", hub: "ናብ መጀመርታ ተመለስ",
      noMore: "ካልእ ቁልቁለት ኣሎ ኣይኮነን።",
      paused: "ደው ኢሉ",
      local: "ሕጉስ ስምን ኽባያታትን ኣብዚ መሳርሒ ይጸንሑ። ናይ ብሓቂ ስም የለን። ዕላል የለን።",
      canvas: "ካብ መቐለሲ ናብ ኽባያ ቁልቁለት ስኣል።"
    },
    simple: {
      whats: "RF 1.0.19 — The home menu no longer shows Pause or the fill bar.",
      lockedWhy: "Locked. Finish the level before this one.",
      helpStars: "The level list shows your stars and your fewest ramps.",
      helpClear: "When you win, stars show one by one. Next is ready.",
      showBest: "Show best",
      onWord: "On",
      offWord: "Off",
      helpGhost: "Retry can show a faint grey copy of your best ramps. Show best turns it on or off.",
      dailyCup: "Daily cup",
      helpDaily: "The Daily cup is a new cup every school day. It is the same for the whole class. Your best stays on this device only.",
      helpDailyBest: "The Daily cup tile shows your best for today.",
      helpRamps: "\"1 ramp\" and \"2 ramps\" use the right word in every language.",
      wdMon: "Mon", wdTue: "Tue", wdWed: "Wed", wdThu: "Thu", wdFri: "Fri",
      mo1: "Jan", mo2: "Feb", mo3: "Mar", mo4: "Apr", mo5: "May", mo6: "Jun", mo7: "Jul", mo8: "Aug", mo9: "Sep", mo10: "Oct", mo11: "Nov", mo12: "Dec",
      helpDate: "The Daily cup date shows in your language.",
      toolRow: "Ramp tools",
      fillWord: "Fill",
      helpSplash: "A pour splashes. The fill percent counts up. Mute turns the tone off.",
      pathNext: "Grains cup is full. Pick Water. Draw to that cup.",
      wrong: "Grains go in the left cup.",
      wrongW: "Water goes in the right cup.",
      lesson5: "Same ramp. Grains like a hill. Water needs the lip.",
      wallWord: "Wall",
      helpPour5: "Pick grains or water. Only one pours.",
      lv5: "Pick the path",
      helpLesson: "Read the lesson line when you win.",
      helpFewer: "Try to win with fewer ramps.",
      teachSlope: "Steeper slope means faster flow",
      teachGel: "Thick liquid (high viscosity) moves slower",
      teachRate: "Flow rate means how much pours each second",
      bestWord: "Best:", rampsWord: "ramps", rampsOne: "ramp", rampsTwo: "ramps", rampsFew: "ramps", rampsMany: "ramps", rampsOther: "ramps", newBest: "New best!", tryFewer: "Try for fewer",
      helpPause: "Pause is easy to tap, even sideways.",
      testHelp: "Staff only. Jump to win or lose. Scores go to the TEST board."
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
  var fills = [0, 0];
  var countedCup = [false, false];
  var fill = 0;
  var spill = 0;
  var leakKind = "";
  var level = 1;
  var dailyOn = false;
  var clearRamps = 0;
  var newBest = false;
  var LEVEL_TAG = ["slope", "rate", "slope", "gel", "rate"];
  var ghostCup = 0;
  var activeSide = 0;
  var spouts = [null, null];
  var cupList = [];
  var block = null;
  var tool = "draw";
  var pouring = false;
  var spawnLeft = 0;
  var spawnWait = 0;
  var paused = false;
  var ended = false;
  var filledOnce = false;
  var sawFill = false;
  var cupStars = [0, 0];
  var sessionStars = [];
  var mode = "ramp";
  var refRun = false;
  var refLock = false;
  var refDown = false;
  var refLeft = 0;
  var refElapsed = 0;
  var refEnded = false;
  var refCard = 1;
  var refTeam = 1;
  var ideasFromRef = false;
  var IDEAS = [
    { name: "pyramid", cups: 6 },
    { name: "tower", cups: 4 },
    { name: "bridge", cups: 5 },
    { name: "stairs", cups: 6 },
    { name: "line", cups: 4 }
  ];
  var REF_CARDS = [
    { n: 1, name: "pyramid", cups: 6 },
    { n: 2, name: "tower", cups: 4 },
    { n: 3, name: "bridge", cups: 5 },
    { n: 4, name: "stairs", cups: 6 }
  ];
  var stack = [];
  var catchBits = [];
  var stackMsg = "";
  var stackWon = false;
  var stackReturnEnd = false;
  var stackFromHome = false;
  var cups = 0;
  var unlocked = 1;
  var levelStars = [0, 0, 0, 0, 0];
  var mass = 1;
  var spawnGap = 0.045;
  var fps = 60;
  var fpsMin = 60;
  var fpsFrames = 0;
  var fpsAcc = 0;
  var ghostUntil = 0;
  var viewW = 800;
  var viewH = 500;
  var ghost = [];
  var spout = { x: 500, y: 80 };
  var pointer = null;
  var drawing = null;
  var erasing = false;
  var lastT = 0;

  function lang() {
    var v = document.documentElement.getAttribute("data-kp-lang") || "";
    if (v === "simple" || STR[v]) return v;
    try {
      if (window.KulibertPrefs && STR[window.KulibertPrefs.lang]) return window.KulibertPrefs.lang;
    } catch (e) {}
    return "en";
  }
  var I18N_KEY = { lv5: "rfLv5", wallWord: "rfWall", lesson5: "rfLesson5", helpPour5: "rfHelpPour5" };
  function t(k) {
    var L = lang();
    var ik = I18N_KEY[k];
    if (ik && window.KulibertI18n && window.KulibertI18n.t) {
      var hit = window.KulibertI18n.t(ik, "");
      var en = (STR.en && STR.en[k]) || "";
      if (hit && (L === "en" || hit !== en)) return hit;
    }
    if (L === "simple" && STR.simple && STR.simple[k]) return STR.simple[k];
    var pack = STR[L] || STR.en;
    return pack[k] || STR.en[k] || "";
  }
  function rampsText(n) {
    var count = n | 0;
    var L = lang();
    var code = L === "simple" ? "en" : L;
    var cat = "other";
    try { cat = new Intl.PluralRules(code).select(count); } catch (e) {}
    var key = { one: "rampsOne", two: "rampsTwo", few: "rampsFew", many: "rampsMany", zero: "rampsFew", other: "rampsOther" }[cat] || "rampsOther";
    var pack = L === "simple" && STR.simple ? STR.simple : (STR[L] || STR.en);
    var word = pack[key] || pack.rampsOther || pack.rampsWord || t("rampsWord");
    return count + " " + word;
  }
  function motionLess() {
    if (document.documentElement.getAttribute("data-kp-motion") === "less") return true;
    try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; }
  }
  function lessonKey() {
    if (level === 5) return "lesson5";
    if (level === 4) return "lesson4";
    if (level === 3) return "lesson3";
    if (level === 2) return "lesson2";
    return "lesson";
  }
  function matName() { return level === 4 ? "gel" : level === 3 ? "water" : "grains"; }
  function paintEndCopy() {
    var card = document.getElementById("endcard");
    if (!card || card.hidden) return;
    var title = document.getElementById("end-title");
    var note = document.getElementById("end-note");
    var nextBtn = document.getElementById("next-level-btn");
    var hubBtn = document.getElementById("hub-btn");
    if (title) title.textContent = testLoseOn ? t("testLose") : t("done" + level);
    if (level >= 5) {
      if (note) { note.hidden = false; note.textContent = t("noMore"); }
      if (nextBtn) nextBtn.hidden = true;
      if (hubBtn) hubBtn.hidden = false;
    } else {
      if (note) { note.hidden = true; note.textContent = ""; }
      if (nextBtn) nextBtn.hidden = false;
      if (hubBtn) hubBtn.hidden = true;
    }
    var tag = LEVEL_TAG[level - 1] || "slope";
    var key = tag === "gel" ? "teachGel" : tag === "rate" ? "teachRate" : "teachSlope";
    var line = document.getElementById("end-lesson-text");
    var ico = document.getElementById("end-ico");
    if (testLoseOn) {
      if (line) line.textContent = t("testLoseNote");
      if (ico) ico.textContent = "⚑";
      return;
    }
    if (line) line.textContent = t(key);
    if (ico) ico.innerHTML = tag === "gel"
      ? '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 8 C24 8 14 22 14 30 A10 10 0 0 0 34 30 C34 22 24 8 24 8 Z" fill="#E7B56A" stroke="#F3E6C8" stroke-width="3"/></svg>'
      : tag === "rate"
      ? '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="26" r="14" fill="none" stroke="#F6C453" stroke-width="4"/><path d="M24 26 V16 M24 26 L32 30" fill="none" stroke="#F6C453" stroke-width="4" stroke-linecap="round"/></svg>'
      : '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M6 36 L28 16 H42" fill="none" stroke="#F6C453" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var bestEl = document.getElementById("end-best");
    var badge = document.getElementById("end-new");
    var badgeText = document.getElementById("end-new-text");
    var n = dailyOn ? todayDaily().best : savedBest();
    if (bestEl) bestEl.textContent = t("bestWord") + " " + rampsText(n);
    if (badgeText) badgeText.textContent = t("newBest");
    if (badge) badge.hidden = !newBest;
    paintEndStars();
  }
  function paintEndStars() {
    var box = document.getElementById("end-stars");
    if (!box) return;
    var n = 0;
    for (var i = 0; i < cupStars.length; i++) if ((cupStars[i] || 0) > n) n = cupStars[i];
    if (!n) n = levelStars[level - 1] || 0;
    box.replaceChildren();
    box.setAttribute("aria-label", n + " " + t(n === 1 ? "starWord" : "starsWord"));
    if (motionLess()) box.classList.add("still");
    else box.classList.remove("still");
    for (var s = 1; s <= n; s++) {
      var star = document.createElement("span");
      star.textContent = "★ " + s;
      box.appendChild(star);
    }
  }
  function rampWho() {
    var name = alias();
    return name ? name.slice(0, 24) : "player";
  }
  function rampMap() {
    try {
      var map = JSON.parse(localStorage.getItem("rampfill-ramp-best") || "{}");
      return map && typeof map === "object" && !Array.isArray(map) ? map : {};
    } catch (e) { return {}; }
  }
  function savedBest() {
    var row = rampMap()[rampWho()];
    return Array.isArray(row) ? (row[level - 1] | 0) : 0;
  }
  function recordRamps() {
    var n = rampCount();
    clearRamps = n;
    if (dailyOn) {
      saveDailyBest(n);
      return;
    }
    var who = rampWho();
    var map = rampMap();
    var row = Array.isArray(map[who]) ? map[who].slice(0, 5) : [0, 0, 0, 0, 0];
    while (row.length < 5) row.push(0);
    var prev = row[level - 1] | 0;
    newBest = prev > 0 && n > 0 && n < prev;
    if (n > 0 && (prev === 0 || n < prev)) {
      row[level - 1] = n;
      saveGhostStrokes();
    }
    map[who] = row;
    try { localStorage.setItem("rampfill-ramp-best", JSON.stringify(map)); } catch (e) {}
  }
  function readGhostStore() {
    try {
      var raw = localStorage.getItem("rampfill-ramp-ghost-v1");
      if (!raw) return {};
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object" || Array.isArray(data)) return {};
      return data;
    } catch (e) { return {}; }
  }
  function packGhostStrokes(list) {
    var out = [];
    (list || []).forEach(function (s) {
      if (!s || s.length < 2 || out.length >= 20) return;
      var pts = [];
      var step = s.length > 64 ? Math.ceil(s.length / 64) : 1;
      for (var i = 0; i < s.length && pts.length < 64; i += step) {
        var p = s[i];
        if (!p || typeof p.x !== "number" || typeof p.y !== "number") continue;
        if (!isFinite(p.x) || !isFinite(p.y)) continue;
        pts.push([Math.round(p.x * 1000) / 1000, Math.round(p.y * 1000) / 1000]);
      }
      if (pts.length >= 2) out.push(pts);
    });
    return out;
  }
  function saveGhostStrokes() {
    try {
      var data = readGhostStore();
      data[String(level)] = packGhostStrokes(strokes);
      localStorage.setItem("rampfill-ramp-ghost-v1", JSON.stringify(data));
    } catch (e) {}
  }
  var showBestOn = true;
  function bestGhostLines() {
    var data = readGhostStore();
    var rows = data[String(level)];
    if (!Array.isArray(rows)) return [];
    var out = [];
    rows.forEach(function (s) {
      if (!Array.isArray(s) || s.length < 2 || out.length >= 20) return;
      var pts = [];
      s.forEach(function (p) {
        if (!Array.isArray(p) || p.length < 2 || pts.length >= 64) return;
        var x = Number(p[0]);
        var y = Number(p[1]);
        if (!isFinite(x) || !isFinite(y)) return;
        pts.push({ x: x * viewW, y: y * viewH });
      });
      if (pts.length >= 2) out.push(pts);
    });
    return out;
  }
  function paintGhostToggle() {
    var btn = document.getElementById("ghost-toggle");
    if (!btn) return;
    btn.hidden = mode === "stack";
    btn.setAttribute("aria-pressed", showBestOn ? "true" : "false");
    var state = document.getElementById("ghost-state");
    if (state) state.textContent = t(showBestOn ? "onWord" : "offWord");
    btn.setAttribute("aria-label", t("showBest") + " " + t(showBestOn ? "onWord" : "offWord"));
  }
  function drawBestGhost() {
    if (!showBestOn) return;
    var lines = bestGhostLines();
    if (!lines.length) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, viewW, viewH);
    cupList.forEach(function (c) { ctx.rect(c.x - 2, c.top - 2, c.w + 4, c.h + 6); });
    try { ctx.clip("evenodd"); } catch (e) { ctx.clip(); }
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = "#4A4A4A";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    lines.forEach(function (s) {
      ctx.beginPath();
      s.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
    });
    ctx.restore();
  }
  function paintVersion() {
    document.title = "Ramp & Fill — " + VERSION;
    var chip = document.getElementById("ver-plate");
    if (chip) chip.textContent = VERSION;
    document.querySelectorAll(".ver-plate").forEach(function (el) { el.textContent = VERSION; });
    var bar = document.querySelector("script[data-app='rampfill']");
    if (bar) bar.setAttribute("data-version", VERSION);
    var body = document.getElementById("whats-body");
    if (body) {
      var line = t("whats");
      var cut = line.indexOf(":");
      body.textContent = cut > 0 ? VERSION + line.slice(cut) : VERSION;
    }
  }
  function paintText() {
    var L = lang();
    document.documentElement.lang = L === "fa-AF" ? "fa" : L;
    document.documentElement.dir = (L === "ar" || L === "fa-AF") ? "rtl" : "ltr";
    document.querySelectorAll("[data-k]").forEach(function (el) {
      var key = el.getAttribute("data-k");
      if (STR.en[key]) el.textContent = t(key);
    });
    var toolRow = document.getElementById("tool-row");
    if (toolRow) toolRow.setAttribute("aria-label", t("toolRow"));
    var score0 = document.querySelector(".score");
    if (score0 && !cups) score0.setAttribute("aria-label", t("cupsWord") + " 0");
    paintVersion();
    var pourHelp = document.getElementById("help-pour");
    if (pourHelp) pourHelp.textContent = t(level >= 5 ? "helpPour5" : level >= 4 ? "helpPour4" : level === 3 ? "helpPour3" : level === 2 ? "helpPour2" : "helpPour");
    var pg = document.getElementById("pick-grains");
    var pw = document.getElementById("pick-water");
    if (pg) pg.textContent = t("grains");
    if (pw) pw.textContent = t("water");
    var lessonText = mode === "stack" ? t("stackLesson") : t(lessonKey());
    var lessonEl = document.getElementById("lesson");
    if (lessonEl) lessonEl.textContent = lessonText;
    var l2 = document.getElementById("lesson-2");
    if (l2) l2.textContent = mode === "stack" ? t("stackLesson") : t(lessonKey());
    var lv = document.getElementById("level-name");
    if (lv) lv.textContent = document.body.classList.contains("at-ideas") ? t("ideas") : document.body.classList.contains("at-ref") ? t("refTile") : atHome() ? t("home") : mode === "stack" ? t("stackTile") : dailyOn ? t("dailyCup") : t("lv" + level);
    canvas.setAttribute("aria-label", mode === "stack" ? t("stackLesson") : t("canvas"));
    paintEndCopy();
    paintStatus();
    paintCups();
    paintRank();
    paintLevels();
    paintBoard();
    paintIdeas();
    paintGhostToggle();
  }
  function amountWord(amount) {
    var r = amount / LINE;
    if (amount <= 0) return t("empty");
    if (r < 0.28) return t("little");
    if (r < 0.55) return t("half");
    if (r < 0.85) return t("moreHalf");
    if (r < 1) return t("almost");
    return t("done");
  }
  function spillWord() {
    if (spill > 0 && spill < 8) return t("bitSpill");
    if (spill >= 8) return t("someSpill");
    return t("noSpill");
  }
  function starsWord(n) {
    return n + " " + t(n === 1 ? "starWord" : "starsWord");
  }
  function starBit() {
    var parts = [];
    for (var i = 0; i < cupList.length; i++) if (cupStars[i]) parts.push(starsWord(cupStars[i]));
    return parts.length ? " • " + parts.join(" • ") : "";
  }
  function spillBit() { return spill > 0 ? " • " + spillWord() : ""; }
  function freshHint() {
    if (spill > 0 || pouring || live.length) return "";
    if ((fills[0] || 0) > 0 || (fills[1] || 0) > 0) return "";
    return " • " + t("startHint");
  }
  function cupWords() {
    if (level === 5 && fills[0] >= LINE && fills[1] < LINE && !pouring && live.length === 0) return t("pathNext");
    if (level === 2 && fills[0] >= LINE && fills[1] < LINE && !pouring && live.length === 0) return t("leftNext");
    if (level === 2 || level === 5) {
      var a = amountWord(fills[0]).replace(/^[^:]+:\s*/, "");
      var b = amountWord(fills[1]).replace(/^[^:]+:\s*/, "");
      return t("left") + ": " + a + " • " + t("right") + ": " + b + spillBit() + freshHint() + starBit();
    }
    return amountWord(fills[0] || 0) + spillBit() + freshHint() + starBit();
  }
  function spillSentence() {
    if (leakKind === "wrong") return t("wrong");
    if (leakKind === "wrongW") return t("wrongW");
    if (leakKind === "sat") return t("sat");
    if (leakKind === "gap") return t("leak");
    if (leakKind === "block") return t("blocked");
    if (leakKind === "leftFirst") return t("leftFirst");
    return t("spill");
  }
  function anyShort() {
    var n = cupList.length || 1;
    for (var i = 0; i < n; i++) if ((fills[i] || 0) < LINE) return true;
    return false;
  }
  function paintStatus() {
    var el = document.getElementById("status");
    var spillEl = document.getElementById("spill-line");
    if (mode === "stack") {
      if (el) el.textContent = stackMsg;
      if (spillEl) spillEl.textContent = "";
      return;
    }
    var show = spill > 0 && !pouring && live.length === 0 && anyShort();
    if (el) el.textContent = cupWords() + (shortChrome() && show ? " • " + spillSentence() : "");
    if (spillEl) spillEl.textContent = show && !shortChrome() ? spillSentence() : "";
    paintFillPct();
  }
  function paintFillPct() {
    var el = document.getElementById("fill-pct");
    if (!el) return;
    var n = Math.max(1, cupList.length || 1);
    var parts = [];
    for (var i = 0; i < n; i++) {
      var pct = Math.round(Math.max(0, Math.min(100, ((fills[i] || 0) / LINE) * 100)));
      var who = n > 1 ? (i === 0 ? t("left") : t("right")) + " " : "";
      parts.push(who + t("fillWord") + " " + pct + "%");
    }
    el.textContent = parts.join(" • ");
  }
  var splashes = [];
  var tone = null;
  function noteSplash(x, y) {
    if (typeof x !== "number" || typeof y !== "number") return;
    splashes.push({ x: x, y: y, t: performance.now() });
    if (splashes.length > 24) splashes.shift();
  }
  function drawSplashes() {
    var now = performance.now();
    splashes = splashes.filter(function (s) { return now - s.t < 320; });
    splashes.forEach(function (s) {
      var u = (now - s.t) / 320;
      ctx.save();
      ctx.globalAlpha = 0.85 * (1 - u);
      ctx.strokeStyle = "#F6C453";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(s.x, s.y, 6 + u * 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
  }
  function soundWanted() {
    return document.documentElement.getAttribute("data-kp-sound") !== "0";
  }
  function stopTone() {
    if (!tone) return;
    try { tone.osc.stop(); } catch (e) {}
    try { tone.ctx.close(); } catch (e2) {}
    tone = null;
  }
  function pourTone() {
    if (!pouring || !soundWanted()) { stopTone(); return; }
    var pct = Math.max(0, Math.min(100, ((fills[0] || 0) / LINE) * 100));
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!tone) {
        var actx = new AC();
        var osc = actx.createOscillator();
        var gain = actx.createGain();
        osc.type = "sine";
        osc.frequency.value = 220;
        gain.gain.value = 0.04;
        osc.connect(gain);
        gain.connect(actx.destination);
        osc.start();
        tone = { ctx: actx, osc: osc, gain: gain };
      }
      tone.osc.frequency.setTargetAtTime(220 + pct * 2.2, tone.ctx.currentTime, 0.06);
    } catch (e3) { tone = null; }
  }
  function shortChrome() {
    try { return window.matchMedia("(max-height: 480px)").matches; } catch (e) { return false; }
  }
  function loadProgress() {
    unlocked = 1;
    levelStars = [0, 0, 0, 0, 0];
    sessionStars = [];
    cups = 0;
    try {
      var raw = localStorage.getItem("rampfill_progress");
      if (!raw) {
        cups = Math.max(0, parseInt(localStorage.getItem("rampfill-cups") || "0", 10) || 0);
        return;
      }
      var data = JSON.parse(raw);
      if (!data || typeof data !== "object") return;
      unlocked = Math.max(1, Math.min(5, data.unlocked | 0 || 1));
      if (Array.isArray(data.stars)) {
        for (var i = 0; i < 5; i++) levelStars[i] = Math.max(0, Math.min(3, data.stars[i] | 0 || 0));
      }
      cups = Math.max(0, data.cups | 0 || 0);
      if (Array.isArray(data.sessionStars)) {
        sessionStars = data.sessionStars.map(function (n) { return Math.max(0, Math.min(3, n | 0 || 0)); }).slice(0, 40);
      }
    } catch (e) {}
  }
  function saveProgress() {
    try {
      localStorage.setItem("rampfill_progress", JSON.stringify({
        unlocked: unlocked,
        stars: levelStars.slice(0, 5),
        cups: cups,
        sessionStars: sessionStars.slice(0, 40)
      }));
      localStorage.setItem("rampfill-cups", String(cups));
    } catch (e) {}
  }
  function saveCups() { saveProgress(); }
  function markProgress() {
    if (dailyOn) return;
    var nums = [];
    for (var i = 0; i < cupList.length; i++) if (cupStars[i]) nums.push(cupStars[i]);
    if (nums.length) {
      var best = nums[0];
      for (var j = 1; j < nums.length; j++) if (nums[j] < best) best = nums[j];
      if (best > (levelStars[level - 1] || 0)) levelStars[level - 1] = best;
    }
    if (level < 5) unlocked = Math.max(unlocked, level + 1);
    saveProgress();
    paintLevels();
  }
  function bestFor(n) {
    var row = rampMap()[rampWho()];
    return Array.isArray(row) ? (row[n - 1] | 0) : 0;
  }
  function paintLevels() {
    var list = document.getElementById("level-list");
    if (!list) return;
    list.replaceChildren();
    for (var i = 1; i <= 5; i++) {
      var li = document.createElement("li");
      var stars = levelStars[i - 1] || 0;
      var open = i <= unlocked;
      var starLine = "★ " + stars + " " + t(stars === 1 ? "starWord" : "starsWord");
      var best = bestFor(i);
      var bestLine = best > 0 ? t("bestWord") + " " + rampsText(best) : t("bestWord") + " — " + t("rampsWord");
      if (open) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = t("lv" + i) + " — " + starLine + " — " + bestLine;
        btn.addEventListener("click", (function (n) {
          return function () {
            toggleMenu(false);
            stackFromHome = false;
            if (mode === "stack") leaveStack();
            showPlay();
            setLevel(n);
          };
        })(i));
        li.appendChild(btn);
      } else li.textContent = t("lv" + i) + " — " + t("lockedWhy");
      list.appendChild(li);
    }
    var daily = document.createElement("li");
    var dayBtn = document.createElement("button");
    dayBtn.type = "button";
    dayBtn.className = "daily-tile";
    var day = schoolDay();
    dayBtn.innerHTML = '<svg viewBox="0 0 48 28" aria-hidden="true"><path d="M4 4 H44 L38 26 H10 Z" fill="#E0A106" stroke="#1A120C" stroke-width="2"/></svg>';
    var name = document.createElement("span");
    name.className = "daily-name";
    name.textContent = t("dailyCup");
    var when = document.createElement("span");
    when.className = "daily-date";
    when.textContent = dailyLabel(day);
    dayBtn.appendChild(name);
    dayBtn.appendChild(when);
    var saved = todayDaily();
    if (saved.best > 0) {
      var bestLine = document.createElement("span");
      bestLine.className = "daily-best";
      bestLine.textContent = t("bestWord") + " " + rampsText(saved.best);
      dayBtn.appendChild(bestLine);
    }
    dayBtn.setAttribute("aria-label", t("dailyCup") + " " + dailyLabel(day) + (saved.best > 0 ? " " + t("bestWord") + " " + rampsText(saved.best) : ""));
    dayBtn.addEventListener("click", function () {
      toggleMenu(false);
      stackFromHome = false;
      if (mode === "stack") leaveStack();
      beginDaily();
    });
    daily.appendChild(dayBtn);
    list.appendChild(daily);
  }
  function doReset() {
    unlocked = 1;
    levelStars = [0, 0, 0, 0, 0];
    cups = 0;
    sessionStars = [];
    try {
      localStorage.removeItem("rampfill_progress");
      localStorage.removeItem("rampfill-cups");
    } catch (e) {}
    saveProgress();
    var ask = document.getElementById("reset-ask");
    if (ask) ask.hidden = true;
    paintCups();
    paintLevels();
    toggleMenu(false);
    level = 1;
    dailyOn = false;
    showHome();
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
    var more = document.getElementById("more-line");
    var num = document.getElementById("cup-n");
    if (num) num.textContent = String(cups);
    if (more) {
      more.style.visibility = sawFill ? "visible" : "hidden";
      more.setAttribute("aria-hidden", sawFill ? "false" : "true");
    }
    if (!box) return;
    box.replaceChildren();
    var show = Math.min(cups, 8);
    var start = Math.max(0, cups - show);
    var score = document.querySelector(".score");
    if (score) {
      var last = sessionStars.length ? sessionStars[sessionStars.length - 1] : 0;
      score.setAttribute("aria-label", t("cupsWord") + " " + cups + (last ? ", " + starsWord(last) : ""));
    }
    for (var i = 0; i < show; i++) {
      var img = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      img.setAttribute("viewBox", "0 0 48 52");
      img.setAttribute("class", "cup-pic");
      img.setAttribute("aria-hidden", "true");
      var starIndex = (start + i) - (cups - sessionStars.length);
      var n = starIndex >= 0 ? sessionStars[starIndex] : 0;
      var stars = "";
      for (var s = 0; s < n; s++) {
        var cx = n === 1 ? 24 : 12 + s * (24 / Math.max(1, n - 1));
        stars += '<path d="' + starPath(cx, 8, 5) + '" fill="#F6C453" stroke="#1A120C" stroke-width="1"/>';
      }
      img.innerHTML = '<path d="M10 14 H38 L34 46 H14 Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="2"/><path d="M14 22 H34" stroke="#1A120C" stroke-width="3"/><path d="M16 28 H32 L30 44 H18 Z" fill="#E0A106"/>' + stars;
      box.appendChild(img);
    }
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
    var menu = document.getElementById("menu");
    var pauseL = document.getElementById("pause-layer");
    var ask = document.getElementById("ask");
    var card = document.getElementById("endcard");
    var open = (menu && !menu.hidden) || (pauseL && !pauseL.hidden) || (ask && !ask.hidden) || (card && !card.hidden);
    if (open) document.documentElement.setAttribute("data-kb-modal-open", "1");
    else document.documentElement.removeAttribute("data-kb-modal-open");
  }
  function makeCup(x, y, w, h) { return { x: x, y: y, w: w, h: h, top: y }; }
  function fitSpout(x, y) {
    x = Math.max(52, Math.min(viewW - 36, x));
    y = Math.max(52, Math.min(viewH - 24, y));
    return { x: x, y: y };
  }
  function hopperBox() {
    return { x: spout.x - 46, y: spout.y - 36, w: 74, h: 36 };
  }
  function buildGhost() {
    ghost = [];
    if (!cupList.length) return;
    var gi = level === 5 ? activeSide : ghostCup;
    var target = cupList[Math.min(gi, cupList.length - 1)];
    var x0 = spout.x - 4;
    var y0 = spout.y + 6;
    var x1 = target.x + target.w * 0.52;
    var y1 = target.top + Math.min(22, Math.max(8, target.h * 0.2));
    if (level === 3 || (level === 5 && activeSide === 1)) y1 = target.top + 8;
    var n = 16;
    if (level === 3 && block) {
      var side = target.x + target.w * 0.5 >= block.x + block.w ? 1 : -1;
      var mx = side > 0 ? block.x + block.w + 22 : block.x - 22;
      var my = block.y - 18;
      mx = Math.max(14, Math.min(viewW - 14, mx));
      my = Math.max(14, Math.min(block.y - 8, my));
      for (var i = 0; i <= n; i++) {
        var u = i / n;
        var x, y;
        if (u < 0.4) {
          var a = u / 0.4;
          x = x0 + (mx - x0) * a;
          y = y0 + (my - y0) * a;
        } else {
          var b = (u - 0.4) / 0.6;
          x = mx + (x1 - mx) * b;
          y = my + (y1 - my) * (b * 0.3 + b * b * 0.7);
        }
        if (block && x > block.x && x < block.x + block.w && y > block.y && y < block.y + block.h) y = block.y - 12;
        ghost.push({ x: x, y: y });
      }
    } else {
      for (var j = 0; j <= n; j++) {
        var u2 = j / n;
        ghost.push({
          x: x0 + (x1 - x0) * u2,
          y: y0 + (y1 - y0) * (u2 * 0.72 + u2 * u2 * 0.28)
        });
        var last = ghost[ghost.length - 1];
        if (level === 5 && block && last.x > block.x && last.x < block.x + block.w && last.y > block.y && last.y < block.y + block.h) {
          last.x = activeSide === 1 ? block.x + block.w + 16 : block.x - 16;
        }
      }
    }
  }
  function schoolDay(now) {
    var d = now ? new Date(now) : new Date();
    var day = d.getDay();
    if (day === 6) d.setDate(d.getDate() - 1);
    if (day === 0) d.setDate(d.getDate() - 2);
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function dailyPlan(day) {
    var h = 2166136261;
    var s = String(day || schoolDay());
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return {
      date: s,
      x: Math.round((0.08 + (h % 28) / 100) * 1000) / 1000,
      w: Math.round((0.18 + ((h >>> 8) % 10) / 100) * 1000) / 1000,
      h: Math.round((0.46 + ((h >>> 16) % 14) / 100) * 1000) / 1000
    };
  }
  function dailyLabel(day) {
    var parts = String(day || schoolDay()).split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var code = lang();
    var loc = code === "fa-AF" ? "fa" : code === "simple" ? "en" : code;
    var supported = [];
    try { supported = Intl.DateTimeFormat.supportedLocalesOf([loc]); } catch (e) {}
    if (supported.length) {
      try { return d.toLocaleDateString(loc, { weekday: "short", month: "short", day: "numeric" }); }
      catch (e2) {}
    }
    var names = { 1: "wdMon", 2: "wdTue", 3: "wdWed", 4: "wdThu", 5: "wdFri" };
    var wd = names[d.getDay()];
    if (!wd) return day;
    return t(wd) + ", " + d.getDate() + " " + t("mo" + (d.getMonth() + 1));
  }
  function readDaily() {
    try {
      var data = JSON.parse(localStorage.getItem("rampfill-daily-v1") || "null");
      if (!data || typeof data !== "object" || Array.isArray(data)) return { date: "", best: 0 };
      return { date: String(data.date || ""), best: data.best | 0 };
    } catch (e) { return { date: "", best: 0 }; }
  }
  function todayDaily() {
    var day = schoolDay();
    var row = readDaily();
    if (row.date !== day) {
      try { if (row.date) localStorage.removeItem("rampfill-daily-v1"); } catch (e) {}
      return { date: day, best: 0 };
    }
    return row;
  }
  function saveDailyBest(n) {
    if (!(n > 0)) return;
    var row = todayDaily();
    if (row.best > 0 && n >= row.best) return;
    newBest = row.best > 0 && n < row.best;
    try { localStorage.setItem("rampfill-daily-v1", JSON.stringify({ date: row.date, best: n })); } catch (e) {}
    paintLevels();
  }
  function rampCount() {
    var n = 0;
    strokes.forEach(function (s) { if (s && s.length >= 2) n += 1; });
    return n;
  }
  function beginDaily() {
    dailyOn = true;
    level = 1;
    activeSide = 0;
    strokes = [];
    undo = [];
    ghostCup = 0;
    ended = false;
    paused = false;
    newBest = false;
    var pause = document.getElementById("pause-layer");
    var card = document.getElementById("endcard");
    var bar = document.getElementById("donebar");
    if (pause) pause.hidden = true;
    if (card) card.hidden = true;
    if (bar) bar.hidden = true;
    showPlay();
    clearFills();
    layout();
    paintText();
    syncModal();
  }
  function placeWorld() {
    var tall = viewH > viewW * 1.05;
    var bottom = viewH - 10;
    var topLimit = 62;
    var n = (level === 2 || level === 5) ? 2 : 1;
    var cw = n === 2
      ? Math.max(64, Math.min(128, (viewW - 28) / 2))
      : Math.max(72, Math.min(150, viewW * (tall ? 0.4 : 0.2)));
    var availH = Math.max(52, bottom - topLimit - 12);
    var ch = Math.min(availH * 0.72, tall ? 210 : 190);
    ch = Math.max(56, Math.min(ch, availH));
    cupList = [];
    block = null;
    if (dailyOn) {
      var plan = dailyPlan(schoolDay());
      var dcw = Math.max(72, Math.min(150, viewW * plan.w));
      var dch = Math.max(56, Math.min(availH * 0.85, viewH * plan.h));
      var dcx = Math.max(12, Math.min(viewW * plan.x, viewW - dcw - 70));
      cupList.push(makeCup(dcx, bottom - dch, dcw, dch));
      spout = fitSpout(
        Math.min(viewW - 40, Math.max(cupList[0].x + cupList[0].w + 64, viewW * 0.72)),
        Math.max(58, Math.min(cupList[0].top - 16, viewH * 0.2))
      );
    } else if (level === 1 || level === 4) {
      var cx = Math.max(12, Math.min(viewW * (tall ? 0.08 : 0.13), viewW - cw - 70));
      cupList.push(makeCup(cx, bottom - ch, cw, ch));
      spout = fitSpout(
        Math.min(viewW - 40, Math.max(cupList[0].x + cupList[0].w + 64, viewW * (tall ? 0.64 : 0.74))),
        Math.max(58, Math.min(cupList[0].top - 16, tall ? 78 : viewH * 0.18))
      );
    } else if (level === 2) {
      var gap = 12;
      var total = cw * 2 + gap;
      var x0 = Math.max(8, Math.min(viewW * (tall ? 0.06 : 0.18), viewW - total - 8));
      cupList.push(makeCup(x0, bottom - ch, cw, ch));
      cupList.push(makeCup(x0 + cw + gap, bottom - ch, cw, ch));
      var sx = tall ? viewW * 0.7 : cupList[0].x + cupList[0].w + Math.min(36, viewW * 0.04);
      spout = fitSpout(sx, 58);
    } else if (level === 5) {
      var gap5 = Math.max(70, Math.min(120, viewW * 0.12));
      var cw5 = Math.max(64, Math.min(120, (viewW - gap5 - 24) / 2));
      var total5 = cw5 * 2 + gap5;
      var xL = Math.max(8, (viewW - total5) / 2);
      var ch5 = Math.max(56, Math.min(ch * 0.9, availH * 0.7));
      cupList.push(makeCup(xL, bottom - ch5, cw5, ch5));
      cupList.push(makeCup(xL + cw5 + gap5, bottom - ch5, cw5, ch5));
      var mid = xL + cw5 + gap5 / 2;
      var wy = 86;
      block = { x: mid - 24, y: wy, w: 48, h: Math.max(48, cupList[0].top - wy - 16) };
      spouts[0] = fitSpout(xL + cw5 * 0.55, 58);
      spouts[1] = fitSpout(xL + cw5 + gap5 + cw5 * 0.45, 58);
      spout = spouts[activeSide] || spouts[0];
    } else {
      var cx3 = tall ? Math.max(12, (viewW - cw) * 0.5) : Math.min(viewW - cw - 12, Math.max(viewW * 0.56, viewW - cw - 18));
      cupList.push(makeCup(cx3, bottom - ch, cw, ch));
      spout = fitSpout(tall ? viewW * 0.72 : Math.max(56, viewW * 0.16), 58);
      var c = cupList[0];
      var bw = Math.max(46, Math.min(70, viewW * 0.1));
      var bh = Math.max(30, Math.min(48, availH * 0.2));
      var bx = spout.x + (c.x + c.w * 0.5 - spout.x) * 0.38 - bw / 2;
      var by = spout.y + (c.top - spout.y) * 0.38;
      if (bx + bw > c.x - 40) bx = c.x - 40 - bw;
      if (bx < 8) bx = 8;
      by = Math.max(spout.y + 6, Math.min(by, c.top - bh - 36));
      block = { x: bx, y: by, w: bw, h: bh };
    }
    cupList.forEach(function (c) {
      if (c.top < spout.y + 12) {
        var nh = Math.max(50, bottom - (spout.y + 16));
        c.h = nh;
        c.y = bottom - nh;
        c.top = c.y;
      }
    });
    buildGhost();
  }
  function layout() {
    var r = canvas.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    var oldW = viewW;
    var oldH = viewH;
    var nw = r.width;
    var nh = r.height;
    if (live.length && oldW > 20 && oldH > 20 && (Math.abs(oldW - nw) > 1 || Math.abs(oldH - nh) > 1)) {
      var sx = nw / oldW;
      var sy = nh / oldH;
      live.forEach(function (p) { p.x *= sx; p.y *= sy; p.vx *= sx; p.vy *= sy; });
      spillSpots.forEach(function (p) { p.x *= sx; p.y *= sy; });
    }
    viewW = nw;
    viewH = nh;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    placeWorld();
    placePicks();
    tagSig = "";
    paintStatus();
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
  function insideCup(c, x, y) {
    return x > c.x + 8 && x < c.x + c.w - 8 && y > c.top + 2 && y < c.y + c.h - 4;
  }
  function lipOverlap(c, x, y) {
    return x >= c.x - 8 && x <= c.x + c.w + 8 && y >= c.top - 12 && y <= c.top + 30;
  }
  function whichCup(x, y) {
    for (var i = 0; i < cupList.length; i++) if (insideCup(cupList[i], x, y)) return i;
    return -1;
  }
  function inBlock(x, y) {
    if (!block || (level !== 3 && level !== 5)) return false;
    return x >= block.x && x <= block.x + block.w && y >= block.y && y <= block.y + block.h;
  }
  function segHitsBlock(x0, y0, x1, y1) {
    if (!block || (level !== 3 && level !== 5)) return null;
    for (var s = 1; s <= 5; s++) {
      var t = s / 5;
      var x = x0 + (x1 - x0) * t;
      var y = y0 + (y1 - y0) * t;
      if (inBlock(x, y)) return { x: x, y: y };
    }
    return null;
  }
  function strokeSeals(stroke, cup) {
    if (level !== 3 && !cup) return true;
    var c = cup || cupList[0];
    if (!c) return true;
    for (var i = 0; i < stroke.length; i++) {
      if (lipOverlap(c, stroke[i].x, stroke[i].y)) return true;
    }
    return false;
  }
  function nearestStroke(sx, sy) {
    var list = worldStrokes();
    if (level === 4) {
      var steep = -1;
      var steepSlope = -1;
      for (var g = 0; g < list.length; g++) {
        if (list[g].length < 2) continue;
        var st0 = list[g][0];
        if (Math.hypot(st0.x - sx, st0.y - sy) > 200) continue;
        var acc = 0;
        var nseg = 0;
        for (var k = 0; k < list[g].length - 1; k++) {
          var ax = list[g][k + 1].x - list[g][k].x;
          var ay = list[g][k + 1].y - list[g][k].y;
          var al = Math.hypot(ax, ay) || 1;
          acc += Math.abs(ay) / al;
          nseg++;
        }
        var sl = nseg ? acc / nseg : 0;
        if (sl > steepSlope) { steepSlope = sl; steep = g; }
      }
      if (steep >= 0) return steep;
    }
    var best = -1;
    var bestD = 160;
    for (var i = 0; i < list.length; i++) {
      if (list[i].length < 2) continue;
      var p = list[i][0];
      var d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) { bestD = d; best = i; }
    }
    if (level === 2 && fills[0] >= LINE && cupList[1]) {
      var gx = cupList[1].x + cupList[1].w / 2;
      var gy = cupList[1].top + 12;
      var alt = -1;
      var altD = 1e9;
      for (var j = 0; j < list.length; j++) {
        if (list[j].length < 2) continue;
        var st = list[j][0];
        if (Math.hypot(st.x - sx, st.y - sy) > 200) continue;
        var end = list[j][list[j].length - 1];
        var ed = Math.hypot(end.x - gx, end.y - gy);
        if (ed < altD) { altD = ed; alt = j; }
      }
      if (alt >= 0) return alt;
    }
    return best;
  }
  function takeCup(i, units, x, y) {
    if (level === 2 && i === 1 && fills[0] < LINE) {
      dropSpill(units, x, y);
      leakKind = "leftFirst";
      return false;
    }
    fills[i] = Math.min(LINE + 12, (fills[i] || 0) + units);
    fill = fills[0] || 0;
    noteSplash(x, y);
    return true;
  }
  function dropSpill(units, x, y) {
    spill += units;
    spillSpots.push({
      x: Math.max(16, Math.min(viewW - 16, x)),
      y: Math.max(16, Math.min(viewH - 16, y)),
      n: units
    });
  }
  function releaseParticle(p) { p.mode = "free"; }
  function settleFree(p) {
    var hit = whichCup(p.x, p.y);
    if (hit >= 0 && !(level === 5 && (p.kind === 1 || hit !== 0))) takeCup(hit, p.mass, p.x, p.y);
    else {
      dropSpill(p.mass, p.x, p.y);
      if (level === 5 && hit === 1 && p.kind === 0) leakKind = "wrong";
    }
  }
  function stepFollow(p, dt) {
    var list = worldStrokes();
    var stroke = list[p.stroke];
    if (!stroke || stroke.length < 2) { releaseParticle(p); return; }
    var water = level === 3 || (level === 5 && p.kind === 1);
    var wIndex = water && level === 5 ? 1 : 0;
    var wCup = cupList[wIndex];
    var seals = strokeSeals(stroke, water && level === 5 ? wCup : null);
    if (level === 4) {
      var a0 = stroke[0];
      var b0 = stroke[stroke.length - 1];
      var overall = Math.abs(b0.y - a0.y) / (Math.hypot(b0.x - a0.x, b0.y - a0.y) || 1);
      if (overall < 0.12) {
        p.stuck = (p.stuck || 0) + dt;
        if (p.stuck > 1.1) {
          dropSpill(p.mass, p.x, p.y);
          leakKind = "sat";
          p.dead = true;
        }
        return;
      }
    }
    var left = p.speed * dt;
    var guard = 0;
    while (left > 0 && guard++ < 8) {
      if (p.si >= stroke.length - 1) {
        var end = stroke[stroke.length - 1];
        var prev = stroke[Math.max(0, stroke.length - 2)];
        var crossed = segHitsBlock(prev.x, prev.y, end.x, end.y);
        if (crossed) {
          dropSpill(p.mass, crossed.x, crossed.y);
          leakKind = "block";
          p.dead = true;
          return;
        }
        if (water) {
          if (seals && wCup && lipOverlap(wCup, end.x, end.y)) takeCup(wIndex, p.mass, end.x, end.y);
          else {
            dropSpill(p.mass, end.x, end.y);
            if (!leakKind) leakKind = "gap";
          }
          p.dead = true;
          return;
        }
        if (level === 4) {
          if (whichCup(end.x, end.y) >= 0) takeCup(whichCup(end.x, end.y), p.mass, end.x, end.y);
          else {
            dropSpill(p.mass, end.x, end.y);
            if (!leakKind) leakKind = "sat";
          }
          p.dead = true;
          return;
        }
        p.x = end.x;
        p.y = end.y;
        releaseParticle(p);
        return;
      }
      var A = stroke[p.si];
      var B = stroke[p.si + 1];
      var dx = B.x - A.x;
      var dy = B.y - A.y;
      var len = Math.hypot(dx, dy) || 0.001;
      var remain = (1 - p.u) * len;
      var slope = Math.min(1, Math.abs(dy) / len);
      p.speed = level === 4 ? 42 + slope * 200 : 120 + slope * 720;
      var prevX = p.x;
      var prevY = p.y;
      if (left < remain) {
        p.u += left / len;
        left = 0;
      } else {
        left -= remain;
        p.si += 1;
        p.u = 0;
        var crossedStep = segHitsBlock(A.x, A.y, B.x, B.y);
        if (crossedStep) {
          dropSpill(p.mass, crossedStep.x, crossedStep.y);
          leakKind = "block";
          p.dead = true;
          return;
        }
        if (p.si < stroke.length - 1 && !water) {
          var C = stroke[p.si + 1];
          var ang = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(dy, dx);
          while (ang > Math.PI) ang -= Math.PI * 2;
          while (ang < -Math.PI) ang += Math.PI * 2;
          if (Math.abs(ang) > 0.55) p.jitter = (Math.random() - 0.5) * 14 * Math.min(1.2, Math.abs(ang));
        }
      }
      if (p.si >= stroke.length - 1) continue;
      var A2 = stroke[p.si];
      var B2 = stroke[p.si + 1];
      p.x = A2.x + (B2.x - A2.x) * p.u + (water ? 0 : (p.jitter || 0) * 0.2);
      p.y = A2.y + (B2.y - A2.y) * p.u;
      var hitB = segHitsBlock(prevX, prevY, p.x, p.y) || (inBlock(p.x, p.y) ? { x: p.x, y: p.y } : null);
      if (hitB) {
        dropSpill(p.mass, hitB.x, hitB.y);
        leakKind = "block";
        p.dead = true;
        return;
      }
      if (water) {
        if (seals && wCup && lipOverlap(wCup, p.x, p.y)) {
          takeCup(wIndex, p.mass, p.x, p.y);
          p.dead = true;
          return;
        }
      } else {
        var hit = whichCup(p.x, p.y);
        if (hit >= 0) {
          if (level === 5 && p.kind === 0 && hit !== 0) {
            dropSpill(p.mass, p.x, p.y);
            leakKind = "wrong";
          } else takeCup(hit, p.mass, p.x, p.y);
          p.dead = true;
          return;
        }
      }
    }
  }
  function stepFree(p, dt) {
    p.vy += (motionLess() ? 1400 : 1500) * dt;
    var ox = p.x;
    var oy = p.y;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    var hitB = segHitsBlock(ox, oy, p.x, p.y);
    if (hitB) {
      dropSpill(p.mass, hitB.x, hitB.y);
      leakKind = "block";
      p.dead = true;
      return;
    }
    if (level === 5 && p.kind === 1) {
      if (p.y > viewH - 12 || p.x < 4 || p.x > viewW - 4) {
        dropSpill(p.mass, Math.max(16, Math.min(viewW - 16, p.x)), Math.min(viewH - 16, p.y));
        if (!leakKind) leakKind = "gap";
        p.dead = true;
      }
      return;
    }
    if (level !== 3) {
      var hit = whichCup(p.x, p.y);
      if (hit >= 0) {
        if (level === 5 && hit !== 0) {
          dropSpill(p.mass, p.x, p.y);
          leakKind = "wrong";
        } else takeCup(hit, p.mass, p.x, p.y);
        p.dead = true;
        return;
      }
    }
    if (level === 4 && (p.y > viewH - 12 || p.x < 4 || p.x > viewW - 4)) {
      dropSpill(p.mass, Math.max(16, Math.min(viewW - 16, p.x)), Math.min(viewH - 16, p.y));
      if (!leakKind) leakKind = "sat";
      p.dead = true;
      return;
    }
    if (p.y > viewH - 12 || p.x < 4 || p.x > viewW - 4) {
      if (level === 3) {
        dropSpill(p.mass, p.x, Math.min(viewH - 16, p.y));
        if (!leakKind) leakKind = "gap";
      } else settleFree(p);
      p.dead = true;
    }
  }
  function spawnOne() {
    if (live.length >= LIVE_CAP) {
      var old = live.shift();
      if (level === 3 || (old.kind === 1 && level === 5)) {
        dropSpill(old.mass, old.x, old.y);
        if (!leakKind) leakKind = "gap";
      } else settleFree(old);
      return;
    }
    var from = level === 5 ? (spouts[activeSide] || spout) : spout;
    var hit = nearestStroke(from.x, from.y + 8);
    var p = {
      x: from.x - 4, y: from.y + 8, vx: activeSide === 1 ? 30 : -30, vy: 20,
      mode: hit < 0 ? "free" : "follow", stroke: hit, si: 0, u: 0,
      speed: 180, mass: mass, jitter: 0, dead: false, rot: Math.random() * 6,
      kind: level === 5 ? activeSide : (level === 3 ? 1 : 0)
    };
    if (hit >= 0) {
      var s = worldStrokes()[hit];
      p.x = s[0].x;
      p.y = s[0].y;
    }
    live.push(p);
  }
  function starCount(spilled) {
    if (spilled <= 0) return 3;
    if (spilled <= 12) return 2;
    return 1;
  }
  function starPath(cx, cy, r) {
    var d = "";
    for (var k = 0; k < 10; k++) {
      var rad = -Math.PI / 2 + k * Math.PI / 5;
      var rr = k % 2 ? r * 0.42 : r;
      var x = cx + Math.cos(rad) * rr;
      var y = cy + Math.sin(rad) * rr;
      d += (k ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1) + " ";
    }
    return d + "Z";
  }
  var testLoseOn = false;
  function staffTest() {
    try { return !!(window.KulibertTest && window.KulibertTest.on && window.KulibertTest.on()); }
    catch (e) { return false; }
  }
  function testAlias() {
    var name = "";
    try {
      if (window.KulibertBoards && window.KulibertBoards.words) {
        var list = window.KulibertBoards.words();
        var mine = alias();
        for (var i = 0; i < list.length; i++) {
          if (list[i].toLowerCase() === String(mine || "").toLowerCase()) name = list[i];
        }
        if (!name && list.length) name = list[0];
      }
    } catch (e) {}
    return name || "Swift Otter 12";
  }
  function rememberTest(row) {
    var rows = [];
    try { rows = JSON.parse(localStorage.getItem("kw-test-board-v1") || "[]"); } catch (e) {}
    if (!Array.isArray(rows)) rows = [];
    rows.push(row);
    try { localStorage.setItem("kw-test-board-v1", JSON.stringify(rows.slice(-100))); } catch (e2) {}
  }
  function postTestScore(value) {
    var token = "";
    try { token = sessionStorage.getItem("tech-room-desk-gate") || ""; } catch (e) {}
    var score = String(value);
    var name = testAlias();
    return fetch("/api/rampfill-board", {
      method: "POST",
      headers: { "content-type": "application/json", "x-tw-desk": token },
      body: JSON.stringify({ test: true, alias: name, score: score, game: "rampfill", board: "TEST" })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (res.ok && data && data.board === "TEST" && data.written) {
          rememberTest({ alias: name, board: "TEST", score: score, test: true, ts: Date.now(), game: "rampfill" });
        }
        return { status: res.status, data: data };
      });
    }).catch(function () { return { status: 0, data: { ok: false, written: false, board: "TEST" } }; });
  }
  var lastTestPost = null;
  function postWinScore(value) {
    if (staffTest()) { lastTestPost = postTestScore(value); return; }
    try {
      if (window.KulibertBoards) window.KulibertBoards.post({
        game: "rampfill", board: "pieces", value: value,
        version: VERSION
      });
    } catch (eBoard) {}
  }
  function showTestJumps() {
    loadStaffTest();
    var bar = document.getElementById("rf-test-jumps");
    if (!staffTest() || atHome()) {
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
      return;
    }
    if (bar) return;
    bar = document.createElement("div");
    bar.id = "rf-test-jumps";
    bar.className = "test-jumps";
    var win = document.createElement("button");
    win.type = "button";
    win.id = "rf-jump-win";
    win.setAttribute("aria-label", "Jump to win");
    win.innerHTML = '<span aria-hidden="true">🏆</span> Jump to win';
    var lose = document.createElement("button");
    lose.type = "button";
    lose.id = "rf-jump-lose";
    lose.setAttribute("aria-label", "Jump to lose");
    lose.innerHTML = '<span aria-hidden="true">⚑</span> Jump to lose';
    var note = document.createElement("p");
    note.id = "rf-test-help";
    note.className = "test-help";
    note.setAttribute("data-i18n", "rfTestHelp");
    note.textContent = t("testHelp");
    win.addEventListener("click", jumpWin);
    lose.addEventListener("click", jumpLose);
    bar.appendChild(win);
    bar.appendChild(lose);
    bar.appendChild(note);
    var tools = document.querySelector(".tools");
    if (tools && tools.parentNode) tools.parentNode.insertBefore(bar, tools);
  }
  function jumpWin() {
    if (!staffTest()) return Promise.resolve({ ok: false, written: false, board: "TEST" });
    testLoseOn = false;
    showPlay();
    if (mode === "stack") leaveStack();
    if (!cupList.length) setLevel(level || 1);
    lastTestPost = postTestScore(Math.max(1, strokes.length || 1));
    finishNext();
    return lastTestPost;
  }
  function jumpLose() {
    if (!staffTest()) return;
    testLoseOn = true;
    showPlay();
    if (mode === "stack") leaveStack();
    ended = true;
    pouring = false;
    document.getElementById("donebar").hidden = true;
    document.getElementById("endcard").hidden = false;
    paintEndCopy();
    syncModal();
    var again = document.getElementById("again-btn");
    if (again) again.focus();
  }
  function checkFilled() {
    var all = cupList.length > 0;
    var gained = false;
    for (var i = 0; i < cupList.length; i++) {
      if ((fills[i] || 0) >= LINE) {
        if (!countedCup[i]) {
          countedCup[i] = true;
          cupStars[i] = starCount(spill);
          if (!dailyOn) {
            cups += 1;
            sessionStars.push(cupStars[i]);
          }
          gained = true;
        }
        if (level === 2 && i === 0 && ghostCup === 0 && (fills[1] || 0) < LINE) {
          ghostCup = 1;
          ghostUntil = performance.now() + 5000;
          buildGhost();
        }
      } else all = false;
    }
    if (gained && !dailyOn) { saveCups(); noteScore(); paintCups(); }
    if (all && !filledOnce) {
      filledOnce = true;
      sawFill = true;
      if (dailyOn) saveDailyBest(rampCount());
      else { markProgress(); postWinScore(Math.max(1, strokes.length || 1)); }
      paintCups();
      document.getElementById("donebar").hidden = false;
      document.getElementById("endcard").hidden = true;
      paintEndStars();
      var nextClear = document.getElementById("next-btn");
      if (nextClear) nextClear.focus();
    }
  }
  function clearFills() {
    fills = [0, 0];
    countedCup = [false, false];
    cupStars = [0, 0];
    fill = 0;
    spill = 0;
    spillSpots = [];
    live = [];
    leakKind = "";
    pouring = false;
    spawnLeft = 0;
    filledOnce = false;
    sawFill = false;
    ghostCup = 0;
    var bar = document.getElementById("donebar");
    if (bar) bar.hidden = true;
    ghostUntil = performance.now() + 5000;
    if (cupList.length) buildGhost();
    pointer = null;
    drawing = null;
    erasing = false;
    paintStatus();
    paintCups();
  }
  function stackColumn() {
    var avail = Math.max(48, viewH - 36);
    var ch = Math.max(28, Math.min(86, avail / 3.05));
    var cw = Math.max(64, Math.min(110, Math.min(viewW * 0.22, ch * 1.35)));
    return { x: viewW / 2 - cw / 2, cw: cw, ch: ch, floor: viewH - 12 };
  }
  function resetStack() {
    stack = [];
    catchBits = [];
    stackWon = false;
    stackMsg = t("stackAsk");
    paintStatus();
  }
  function syncStackTools() {
    var stacking = mode === "stack";
    ["tool-draw", "tool-erase", "undo-btn", "clear-btn", "pour-btn"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.hidden = stacking;
    });
    var back = document.getElementById("stack-back");
    var tile = document.getElementById("stack-tile");
    var refBtn = document.getElementById("stack-ref");
    if (back) back.hidden = !stacking;
    if (tile) tile.hidden = stacking;
    if (refBtn) refBtn.hidden = !stacking;
  }
  function atHome() { return document.body.classList.contains("at-home"); }
  function showHome() {
    if (mode === "stack") {
      mode = "ramp";
      catchBits = [];
      syncStackTools();
    }
    document.body.classList.add("at-home");
    var lv = document.getElementById("level-name");
    if (lv) lv.textContent = t("home");
    paintStatus();
  }
  function showPlay() {
    document.body.classList.remove("at-home");
    layout();
    paintText();
  }
  function refMinutes() {
    var n = parseInt((document.getElementById("ref-mins") || {}).value, 10);
    if (!n || n < 1) n = 1;
    if (n > 30) n = 30;
    return n;
  }
  function cupShape(x, y, w, h) {
    var inset = Math.max(3, w * 0.12);
    return '<path d="M' + x + " " + y + " H" + (x + w) + " L" + (x + w - inset) + " " + (y + h) + " H" + (x + inset) + ' Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="3"/>';
  }
  function spanCup(x, y, w, h) {
    var inset = Math.max(3, h * 0.18);
    return '<path d="M' + x + " " + (y + inset) + " L" + (x + w) + " " + y + " V" + (y + h) + " L" + x + " " + (y + h - inset) + ' Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="3"/>';
  }
  function cardDiagram(kind) {
    var parts = [];
    if (kind === "pyramid") {
      parts.push(cupShape(20, 112, 60, 40), cupShape(90, 112, 60, 40), cupShape(160, 112, 60, 40));
      parts.push(cupShape(55, 68, 60, 40), cupShape(125, 68, 60, 40), cupShape(90, 24, 60, 40));
    } else if (kind === "tower") {
      parts.push('<path d="M16 18 H224" fill="none" stroke="#1A120C" stroke-width="6" stroke-linecap="round"/>');
      parts.push(cupShape(90, 28, 60, 28), cupShape(90, 58, 60, 28), cupShape(90, 88, 60, 28), cupShape(90, 118, 60, 28));
    } else if (kind === "bridge") {
      parts.push(cupShape(24, 78, 52, 34), cupShape(24, 114, 52, 34));
      parts.push(cupShape(164, 78, 52, 34), cupShape(164, 114, 52, 34));
      parts.push(spanCup(48, 36, 144, 40));
    } else if (kind === "stairs") {
      parts.push(cupShape(16, 114, 52, 34));
      parts.push(cupShape(84, 78, 52, 34), cupShape(84, 114, 52, 34));
      parts.push(cupShape(152, 42, 52, 34), cupShape(152, 78, 52, 34), cupShape(152, 114, 52, 34));
    } else {
      parts.push(cupShape(8, 96, 50, 40), cupShape(66, 96, 50, 40), cupShape(124, 96, 50, 40), cupShape(182, 96, 50, 40));
    }
    return '<svg viewBox="0 0 240 160">' + parts.join("") + "</svg>";
  }
  function paintBoard() {
    var card = REF_CARDS[refCard - 1] || REF_CARDS[0];
    var num = document.getElementById("ref-card-n");
    var name = document.getElementById("ref-card-name");
    var diagram = document.getElementById("ref-diagram");
    var row = document.getElementById("ref-cuprow");
    var count = document.getElementById("ref-cupn");
    if (!num || !diagram || !row) return;
    num.textContent = String(card.n);
    if (name) name.textContent = t(card.name);
    diagram.innerHTML = cardDiagram(card.name);
    var one = '<svg class="need-cup" viewBox="0 0 24 20" aria-hidden="true"><path d="M3 2 H21 L18 18 H6 Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="1.6"/></svg>';
    var pics = "";
    for (var i = 0; i < card.cups; i++) pics += one;
    row.innerHTML = pics;
    if (count) count.textContent = String(card.cups);
    document.querySelectorAll("#ref-teams button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-team")) === String(refTeam) ? "true" : "false");
    });
    document.querySelectorAll("#ref-picks button").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-card")) === String(refCard) ? "true" : "false");
    });
  }
  function paintIdeas() {
    var host = document.getElementById("ideas-list");
    if (!host) return;
    var one = '<svg class="need-cup" viewBox="0 0 24 20" aria-hidden="true"><path d="M3 2 H21 L18 18 H6 Z" fill="#8C3A2F" stroke="#1A120C" stroke-width="1.6"/></svg>';
    host.innerHTML = IDEAS.map(function (idea) {
      var pics = "";
      for (var i = 0; i < idea.cups; i++) pics += one;
      return '<figure class="idea"><div class="idea-pic">' + cardDiagram(idea.name) + '</div><figcaption>' + t(idea.name) + '</figcaption><p class="ref-need"><span>' + t("youNeed") + '</span> ' + pics + ' <span class="need-n">' + idea.cups + '</span></p></figure>';
    }).join("");
  }
  function openIdeas() {
    ideasFromRef = document.body.classList.contains("at-ref");
    document.body.classList.remove("at-home");
    document.body.classList.remove("at-ref");
    document.body.classList.add("at-ideas");
    var ref = document.getElementById("ref");
    if (ref) ref.hidden = true;
    var panel = document.getElementById("ideas");
    if (panel) panel.hidden = false;
    paintIdeas();
    paintText();
  }
  function closeIdeas() {
    document.body.classList.remove("at-ideas");
    var panel = document.getElementById("ideas");
    if (panel) panel.hidden = true;
    if (ideasFromRef) {
      ideasFromRef = false;
      openRef();
      return;
    }
    showHome();
  }
  function refClockText(ms) {
    var total = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(total / 60);
    var s = total % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function paintRef() {
    var clock = document.getElementById("ref-clock");
    var ms = refDown ? refLeft : refElapsed;
    if (clock) {
      clock.textContent = refClockText(ms);
      var warn = refDown && refRun && !refLock && refLeft > 0 && refLeft <= 10000;
      clock.classList.toggle("warn", warn);
    }
    var card = document.getElementById("ref-timeup");
    if (card) card.hidden = !(refEnded && !refLock);
    var lock = document.getElementById("ref-lock");
    if (lock) lock.hidden = !refLock;
    var startBtn = document.getElementById("ref-start");
    var stopBtn = document.getElementById("ref-stop");
    if (startBtn) startBtn.disabled = !!refLock;
    if (stopBtn) stopBtn.disabled = !!refLock;
    var up = document.getElementById("ref-up");
    var down = document.getElementById("ref-down");
    if (up) {
      up.disabled = !!(refLock || refRun);
      up.setAttribute("aria-pressed", refDown ? "false" : "true");
    }
    if (down) {
      down.disabled = !!(refLock || refRun);
      down.setAttribute("aria-pressed", refDown ? "true" : "false");
    }
    var mins = document.getElementById("ref-mins");
    if (mins) mins.disabled = refRun || refLock;
  }
  function loadDown() {
    refLeft = refMinutes() * 60 * 1000;
  }
  function openRef() {
    document.body.classList.remove("at-home");
    document.body.classList.add("at-ref");
    var panel = document.getElementById("ref");
    if (panel) panel.hidden = false;
    paintRef();
    paintText();
  }
  function closeRef() {
    document.body.classList.remove("at-ref");
    var panel = document.getElementById("ref");
    if (panel) panel.hidden = true;
    if (mode === "stack") {
      showPlay();
      paintText();
    } else showHome();
  }
  function refStart() {
    if (refLock) return;
    if (refDown && (refLeft <= 0 || !refRun && refElapsed === 0 && refLeft === 0)) loadDown();
    if (refDown && refLeft <= 0) loadDown();
    refEnded = false;
    refRun = true;
    paintRef();
  }
  function refStop() {
    if (refLock) return;
    refRun = false;
    paintRef();
  }
  function refReset() {
    refRun = false;
    refLock = false;
    refEnded = false;
    refElapsed = 0;
    refLeft = refDown ? refMinutes() * 60 * 1000 : 0;
    paintRef();
  }
  function refDone() {
    refRun = false;
    refLock = true;
    paintRef();
  }
  function refNext() {
    refCard = refCard >= REF_CARDS.length ? 1 : refCard + 1;
    refRun = false;
    refLock = false;
    refEnded = false;
    refElapsed = 0;
    refLeft = refDown ? refMinutes() * 60 * 1000 : 0;
    paintBoard();
    paintRef();
  }
  function refSetMode(down) {
    if (refLock || refRun) return;
    refDown = down;
    refEnded = false;
    refElapsed = 0;
    refLeft = down ? refMinutes() * 60 * 1000 : 0;
    paintRef();
  }
  function stepRef(dt) {
    if (!refRun || refLock) return;
    if (refDown) {
      refLeft -= dt * 1000;
      if (refLeft <= 0) {
        refLeft = 0;
        refRun = false;
        refEnded = true;
      }
    } else refElapsed += dt * 1000;
    paintRef();
  }
  function openLevels() {
    stackFromHome = false;
    if (mode === "stack") leaveStack();
    showPlay();
    setLevel(unlocked);
  }
  function openHomeStack() {
    stackFromHome = true;
    showPlay();
    enterStack();
  }
  function enterStack() {
    if (mode === "stack") return;
    stackReturnEnd = ended;
    mode = "stack";
    pouring = false;
    live = [];
    ended = false;
    paused = false;
    document.getElementById("endcard").hidden = true;
    document.getElementById("donebar").hidden = true;
    document.getElementById("pause-layer").hidden = true;
    document.getElementById("ask").hidden = true;
    resetStack();
    syncStackTools();
    paintText();
    syncModal();
  }
  function leaveStack() {
    if (mode !== "stack") return;
    mode = "ramp";
    catchBits = [];
    syncStackTools();
    placePicks();
    if (stackFromHome) {
      stackFromHome = false;
      showHome();
      syncModal();
      return;
    }
    if (stackReturnEnd) {
      ended = true;
      document.getElementById("endcard").hidden = false;
    } else if (filledOnce) document.getElementById("donebar").hidden = false;
    paintText();
    syncModal();
  }
  function placeStackCup(px) {
    if (stackWon || stack.length >= 3) return;
    if (stack.some(function (c) { return c.tipped; })) return;
    var col = stackColumn();
    var slot = stack.length;
    var snapped = Math.abs(px - (col.x + col.cw / 2)) <= col.cw * 0.55;
    var x = snapped ? col.x : Math.max(8, Math.min(viewW - col.cw - 8, px - col.cw / 2));
    var cup = {
      x: x,
      y: col.floor - col.ch * (slot + 1) + slot * 10,
      w: col.cw,
      h: col.ch,
      tipped: !snapped,
      tip: !snapped && motionLess() ? 1 : 0
    };
    if (!snapped && !motionLess()) cup.tip = 0.02;
    stack.push(cup);
    if (!snapped) stackMsg = t("stackTip");
    else if (stack.length === 3) {
      stackWon = true;
      stackMsg = t("stackStand");
      catchBits = [];
      for (var i = 0; i < 8; i++) catchBits.push({ y: 8 - i * 16, done: motionLess() });
      if (motionLess()) stackMsg = t("stackCaught");
    } else stackMsg = t("stackNext");
    paintStatus();
  }
  function stepStack(dt) {
    stack.forEach(function (c) {
      if (c.tipped && c.tip < 1) c.tip = Math.min(1, c.tip + dt * 1.15);
    });
    if (stackWon && catchBits.length) {
      var col = stackColumn();
      var top = stack[2];
      var land = top ? top.y + 16 : col.floor;
      var all = true;
      catchBits.forEach(function (b) {
        if (b.done) return;
        b.y += 90 * dt;
        if (b.y >= land) { b.y = land; b.done = true; }
        else all = false;
      });
      if (all && stackMsg !== t("stackCaught")) {
        stackMsg = t("stackCaught");
        paintStatus();
      }
    }
  }
  function drawStackCup(c) {
    ctx.save();
    if (c.tip) {
      ctx.translate(c.x + c.w / 2, c.y + c.h);
      ctx.rotate(c.tip * 1.15);
      ctx.translate(-(c.x + c.w / 2), -(c.y + c.h));
    }
    ctx.fillStyle = "#8C3A2F";
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + 8);
    ctx.lineTo(c.x + 8, c.y + c.h);
    ctx.lineTo(c.x + c.w - 8, c.y + c.h);
    ctx.lineTo(c.x + c.w, c.y + 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#F3E6C8";
    ctx.fillRect(c.x + 8, c.y + 10, c.w - 16, 8);
    backed(t("cupWord") || "Cup", c.x + c.w / 2, c.y + c.h * 0.62, c.h < 46 ? 14 : 16, "center");
    ctx.restore();
  }
  function drawStack() {
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#E7D7B8";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#C4A574";
    ctx.fillRect(0, viewH - 14, viewW, 14);
    var col = stackColumn();
    ctx.save();
    ctx.strokeStyle = "#3E6B4F";
    ctx.lineWidth = 3;
    ctx.setLineDash([3, 8]);
    for (var i = 0; i < 3; i++) {
      if (stack[i] && !stack[i].tipped) continue;
      var gy = col.floor - col.ch * (i + 1);
      ctx.strokeRect(col.x, gy, col.cw, col.ch);
    }
    ctx.restore();
    stack.forEach(drawStackCup);
    if (catchBits.length && stack[2]) {
      catchBits.forEach(function (b) {
        if (b.done) return;
        seed({ x: col.x + col.cw / 2, y: b.y, s: 4, rot: 0.4 });
      });
      if (catchBits.every(function (b) { return b.done; })) {
        ctx.fillStyle = "#E0A106";
        ctx.beginPath();
        ctx.ellipse(stack[2].x + stack[2].w / 2, stack[2].y + 28, stack[2].w * 0.28, 8, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (stackMsg) backedWrap(stackMsg, viewW / 2, 28, 16, Math.min(420, viewW - 20));
  }
  function startPour() {
    if (mode === "stack" || paused || ended || pouring) return;
    live = [];
    spillSpots = [];
    spill = 0;
    leakKind = "";
    pouring = true;
    spawnLeft = Math.max(8, Math.round(48 / mass));
    spawnWait = 0;
    document.getElementById("donebar").hidden = true;
    document.getElementById("endcard").hidden = true;
    ended = false;
  }
  function retry() {
    if (mode === "stack") { resetStack(); return; }
    ended = false;
    paused = false;
    document.getElementById("pause-layer").hidden = true;
    document.getElementById("endcard").hidden = true;
    clearFills();
    syncModal();
  }
  function repour() {
    ended = false;
    document.getElementById("endcard").hidden = true;
    clearFills();
    syncModal();
    startPour();
  }
  function finishNext() {
    recordRamps();
    document.getElementById("donebar").hidden = true;
    document.getElementById("endcard").hidden = false;
    ended = true;
    pouring = false;
    paintEndCopy();
    syncModal();
    var focus = level >= 5 ? document.getElementById("hub-btn") : document.getElementById("next-level-btn");
    if (focus) focus.focus();
    requestAnimationFrame(function () { if (focus && document.activeElement !== focus) focus.focus(); });
  }
  function beatFill() {
    document.getElementById("endcard").hidden = true;
    ended = false;
    newBest = false;
    clearFills();
    syncModal();
  }
  function setLevel(n) {
    dailyOn = false;
    if (mode === "stack") leaveStack();
    level = Math.max(1, Math.min(5, n | 0));
    activeSide = 0;
    strokes = [];
    undo = [];
    ghostCup = 0;
    ended = false;
    paused = false;
    document.getElementById("pause-layer").hidden = true;
    document.getElementById("endcard").hidden = true;
    document.getElementById("donebar").hidden = true;
    clearFills();
    layout();
    if (level === 4) seedGelTray();
    placePicks();
    paintText();
    syncModal();
  }
  function placePicks() {
    var grains = document.getElementById("pick-grains");
    var water = document.getElementById("pick-water");
    if (!grains || !water) return;
    var show = level === 5 && spouts[0] && spouts[1];
    grains.hidden = !show;
    water.hidden = !show;
    if (!show) return;
    function pin(btn, sp) {
      btn.style.left = Math.max(4, sp.x - 46) + "px";
      btn.style.top = Math.max(4, sp.y - 44) + "px";
    }
    pin(grains, spouts[0]);
    pin(water, spouts[1]);
    grains.setAttribute("aria-pressed", activeSide === 0 ? "true" : "false");
    water.setAttribute("aria-pressed", activeSide === 1 ? "true" : "false");
  }
  function pickSide(n) {
    if (level !== 5 || pouring) return;
    activeSide = n === 1 ? 1 : 0;
    spout = spouts[activeSide] || spout;
    ghostUntil = performance.now() + 5000;
    buildGhost();
    placePicks();
  }
  function seedGelTray() {
    if (level !== 4 || !cupList[0]) return;
    var c = cupList[0];
    var x0 = spout.x - 8;
    var y0 = spout.y + 8;
    var x1 = c.x + c.w + 28;
    if (!(x1 < x0 - 60)) x1 = x0 - 200;
    x1 = Math.max(20, Math.min(x0 - 40, x1));
    var pts = [];
    for (var i = 0; i <= 8; i++) {
      var u = i / 8;
      pts.push(norm({ x: x0 + (x1 - x0) * u, y: y0 + 6 * u }));
    }
    strokes = [pts];
    undo = [];
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
    if (!document.getElementById("endcard").hidden) return;
    if (pointer != null) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    var p = pointerPos(e);
    if (mode === "stack") { placeStackCup(p.x); return; }
    pointer = e.pointerId;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
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
    if (Math.hypot(p.x - last.x, p.y - last.y) < 6) return;
    drawing.push(norm(p));
  }
  function onUp(e) {
    if (e.pointerId !== pointer) return;
    if (drawing) {
      var p = pointerPos(e);
      var last = denorm(drawing[drawing.length - 1]);
      if (Math.hypot(p.x - last.x, p.y - last.y) >= 1) drawing.push(norm(p));
    }
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
    clearFills();
  }
  function setPaused(on) {
    if (atHome()) return;
    paused = on;
    document.getElementById("pause-layer").hidden = !on;
    syncModal();
    if (on) document.getElementById("resume-btn").focus();
  }
  function toggleMenu(open) {
    var menu = document.getElementById("menu");
    menu.hidden = !open;
    document.getElementById("menu-btn").setAttribute("aria-expanded", open ? "true" : "false");
    if (open) paintLevels();
    syncModal();
    if (open) document.getElementById("menu-close").focus();
  }
  function readAloud() {
    var text = t("whats") + " " + t(lessonKey()) + " " + t("helpDraw") + " " + t("helpPour") + " " + t("helpSpill");
    try {
      if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(u);
      }
    } catch (e) {}
  }
  function backed(text, x, y, size, align) {
    ctx.save();
    ctx.font = "700 " + size + "px Barlow, Outfit, sans-serif";
    ctx.textAlign = align || "left";
    var w = ctx.measureText(text).width;
    var pad = 4;
    var boxW = w + pad * 2;
    var boxH = size + 6;
    var rawLeft = align === "center" ? x - w / 2 - pad : align === "right" ? x - w - pad : x - pad;
    var left = Math.max(2, Math.min(rawLeft, Math.max(2, viewW - boxW - 2)));
    var top = Math.max(2, Math.min(y - size + 2, Math.max(2, viewH - boxH - 2)));
    var textX = align === "center" ? left + pad + w / 2 : align === "right" ? left + boxW - pad : left + pad;
    var textY = top + size - 2;
    ctx.fillStyle = "#F3E6C8";
    ctx.fillRect(left, top, boxW, boxH);
    ctx.fillStyle = "#1A120C";
    ctx.fillText(text, textX, textY);
    ctx.restore();
  }
  function backedWrap(text, x, y, size, maxW) {
    ctx.save();
    ctx.font = "700 " + size + "px Barlow, Outfit, sans-serif";
    ctx.textAlign = "center";
    var words = String(text).split(" ");
    var lines = [];
    var line = "";
    var limit = Math.max(80, Math.min(maxW, viewW - 16));
    words.forEach(function (w) {
      var tryLine = line ? line + " " + w : w;
      if (ctx.measureText(tryLine).width > limit && line) { lines.push(line); line = w; }
      else line = tryLine;
    });
    if (line) lines.push(line);
    var lh = size + 6;
    var widest = 0;
    lines.forEach(function (ln) { widest = Math.max(widest, ctx.measureText(ln).width); });
    var boxW = widest + 12;
    var boxH = lines.length * lh + 8;
    var left = Math.max(4, Math.min(x - boxW / 2, viewW - boxW - 4));
    var top = Math.max(4, Math.min(y - size, viewH - boxH - 4));
    ctx.fillStyle = "#F3E6C8";
    ctx.fillRect(left, top, boxW, boxH);
    ctx.fillStyle = "#1A120C";
    lines.forEach(function (ln, i) { ctx.fillText(ln, left + boxW / 2, top + size + i * lh); });
    ctx.restore();
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
    ctx.restore();
  }
  function waterDrop(n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.fillStyle = "#2E86C1";
    ctx.strokeStyle = "#0E3A5A";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(0, 0, (n.s || 5) * 0.85, (n.s || 5) * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawPile(c, amount, index) {
    var ratio = Math.max(0, Math.min(1, amount / LINE));
    var innerTop = c.top + 16;
    var innerBot = c.y + c.h - 8;
    var pileH = (innerBot - innerTop) * ratio;
    var kind = level === 5 ? (index === 1 ? "water" : "grains") : matName();
    if (pileH > 2 && kind === "grains") {
      ctx.fillStyle = "#E0A106";
      ctx.beginPath();
      ctx.moveTo(c.x + 14, innerBot);
      ctx.lineTo(c.x + c.w - 14, innerBot);
      ctx.lineTo(c.x + c.w - 16, innerBot - pileH);
      ctx.quadraticCurveTo(c.x + c.w / 2, innerBot - pileH - 8, c.x + 16, innerBot - pileH);
      ctx.closePath();
      ctx.fill();
    } else if (pileH > 2 && kind === "gel") {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.x + 8, c.top + 16);
      ctx.lineTo(c.x + 14, c.y + c.h - 6);
      ctx.lineTo(c.x + c.w - 14, c.y + c.h - 6);
      ctx.lineTo(c.x + c.w - 8, c.top + 16);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "#5C7A4A";
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, innerBot - pileH * 0.35, Math.max(12, (c.w - 36) / 2), Math.max(8, pileH * 0.5), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (pileH > 2) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(c.x + 10, c.top + 14);
      ctx.quadraticCurveTo(c.x + 6, c.y + c.h - 6, c.x + c.w / 2, c.y + c.h - 8);
      ctx.quadraticCurveTo(c.x + c.w - 6, c.y + c.h - 6, c.x + c.w - 10, c.top + 14);
      ctx.closePath();
      ctx.clip();
      ctx.fillStyle = "#2E86C1";
      ctx.fillRect(c.x + 4, innerBot - pileH, c.w - 8, pileH + 14);
      ctx.restore();
      ctx.strokeStyle = "#D6EEF8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x + 18, innerBot - pileH + 2);
      ctx.quadraticCurveTo(c.x + c.w / 2, innerBot - pileH + 6, c.x + c.w - 18, innerBot - pileH + 2);
      ctx.stroke();
    }
    var lineY = innerBot - (innerBot - innerTop) * 0.92;
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(c.x + 6, lineY);
    ctx.lineTo(c.x + c.w - 6, lineY);
    ctx.stroke();
    if (pileH > 2 && !motionLess()) {
      var surf = innerBot - pileH;
      var wobble = pouring ? Math.sin(performance.now() / 140) * 2.5 : 0;
      ctx.strokeStyle = "rgba(243,230,200,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(c.x + c.w / 2, surf, Math.max(10, (c.w - 28) / 2), 3 + Math.abs(wobble), 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  function drawCup(c, amount, index) {
    ctx.save();
    if (level === 3 || (level === 5 && index === 1)) {
      ctx.fillStyle = "#1F4E79";
      ctx.strokeStyle = "#1A120C";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x + 4, c.top + 8);
      ctx.quadraticCurveTo(c.x - 2, c.y + c.h, c.x + c.w / 2, c.y + c.h);
      ctx.quadraticCurveTo(c.x + c.w + 2, c.y + c.h, c.x + c.w - 4, c.top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#D6EEF8";
      ctx.lineWidth = 3;
      for (var i = 1; i <= 3; i++) {
        var yy = c.top + 18 + (c.h - 28) * (i / 4);
        ctx.beginPath();
        ctx.moveTo(c.x + 16, yy);
        ctx.quadraticCurveTo(c.x + c.w / 2, yy + 3, c.x + c.w - 16, yy);
        ctx.stroke();
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = "#8C3A2F";
      ctx.strokeStyle = "#1A120C";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(c.x, c.top + 8);
      ctx.lineTo(c.x + 8, c.y + c.h);
      ctx.lineTo(c.x + c.w - 8, c.y + c.h);
      ctx.lineTo(c.x + c.w, c.top + 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#F3E6C8";
      ctx.fillRect(c.x + 8, c.top + 10, c.w - 16, 8);
    }
    ctx.restore();
    drawPile(c, amount, index);
    if (level === 3 || (level === 5 && index === 1)) {
      backed(t("water"), c.x + c.w / 2, c.top + c.h * 0.62, 16, "center");
    } else {
    if (level === 4) {
      gelBlob({ x: c.x + c.w * 0.35, y: c.top + c.h * 0.72, s: 7 });
      gelBlob({ x: c.x + c.w * 0.55, y: c.top + c.h * 0.8, s: 8 });
      backed(t("gel"), c.x + c.w / 2, c.top + c.h * 0.48, 16, "center");
    } else {
      backed(t("grains"), c.x + c.w / 2, c.top + Math.min(c.h * 0.7, c.h - 16), 16, "center");
      if (level === 2) backed(index === 0 ? t("left") : t("right"), c.x + c.w / 2, c.top + c.h * 0.4, 14, "center");
      ctx.fillStyle = "#1A120C";
      for (var d2 = 0; d2 < 5; d2++) {
        ctx.beginPath();
        ctx.arc(c.x + 18 + d2 * Math.max(8, (c.w - 36) / 4), c.top + c.h * 0.84, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    }
    if (cupStars[index] && amount >= LINE) {
      var nStar = cupStars[index];
      var gapS = 16;
      var xS = c.x + c.w / 2 - ((nStar - 1) * gapS) / 2;
      var yS = Math.max(c.top + 28, Math.min(c.top + 40, c.y + c.h - 20));
      for (var si = 0; si < nStar; si++) drawStar(xS + si * gapS, yS, 7);
    }
  }
  function drawStar(x, y, r) {
    ctx.save();
    ctx.fillStyle = "#F6C453";
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (var k = 0; k < 10; k++) {
      var rad = -Math.PI / 2 + k * Math.PI / 5;
      var rr = k % 2 ? r * 0.42 : r;
      var px = x + Math.cos(rad) * rr;
      var py = y + Math.sin(rad) * rr;
      if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  function drawBlock() {
    if (!block) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(block.x, block.y, block.w, block.h);
    ctx.fillStyle = "#C4A574";
    ctx.fill();
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.lineWidth = 2;
    for (var i = -block.h; i < block.w + block.h; i += 10) {
      ctx.moveTo(block.x + i, block.y + block.h);
      ctx.lineTo(block.x + i + block.h, block.y);
    }
    ctx.stroke();
    ctx.restore();
    backed(t(level === 5 ? "wallWord" : "blockWord"), block.x + block.w / 2, block.y + block.h * 0.62, 16, "center");
    ctx.restore();
  }
  function gelBlob(n) {
    ctx.save();
    ctx.translate(n.x, n.y);
    ctx.fillStyle = "#5C7A4A";
    ctx.strokeStyle = "#1A120C";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, n.s || 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(-n.s * 0.25, -n.s * 0.2, (n.s || 7) * 0.28, 0, Math.PI * 2);
    ctx.fillStyle = "#D5E2C4";
    ctx.fill();
    ctx.restore();
  }
  function drawHopperAt(sp, kind, on) {
    var water = kind === "water";
    var gel = kind === "gel";
    ctx.fillStyle = water ? "#1F4E79" : gel ? "#3E5C32" : "#C47B12";
    ctx.strokeStyle = on ? "#F6C453" : "#1A120C";
    ctx.lineWidth = on ? 5 : 3;
    ctx.beginPath();
    ctx.moveTo(sp.x - 46, sp.y - 36);
    ctx.lineTo(sp.x + 28, sp.y - 36);
    ctx.lineTo(sp.x + 10, sp.y);
    ctx.lineTo(sp.x - 28, sp.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (water) {
      ctx.strokeStyle = "#D6EEF8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(sp.x - 30, sp.y - 18);
      ctx.quadraticCurveTo(sp.x - 8, sp.y - 12, sp.x + 8, sp.y - 18);
      ctx.stroke();
      backed(t("water"), sp.x - 8, sp.y - 16, 16, "center");
    } else if (gel) {
      gelBlob({ x: sp.x - 16, y: sp.y - 16, s: 5 });
      gelBlob({ x: sp.x - 2, y: sp.y - 12, s: 6 });
      backed(t("gel"), sp.x - 8, sp.y - 16, 16, "center");
    } else {
      seed({ x: sp.x - 18, y: sp.y - 20, s: 3.5, rot: 0.4 });
      seed({ x: sp.x - 4, y: sp.y - 18, s: 3.5, rot: 1.1 });
      seed({ x: sp.x - 12, y: sp.y - 10, s: 3, rot: 2 });
      backed(t("grains"), sp.x - 8, sp.y - 16, 16, "center");
    }
  }
  function drawHopper() {
    if (level === 5 && spouts[0] && spouts[1]) {
      drawHopperAt(spouts[0], "grains", activeSide === 0);
      drawHopperAt(spouts[1], "water", activeSide === 1);
      return;
    }
    drawHopperAt(spout, matName(), false);
  }
  function draw() {
    if (mode === "stack") { syncTags(); drawStack(); return; }
    ctx.clearRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#E7D7B8";
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.fillStyle = "#C4A574";
    ctx.fillRect(0, viewH - 14, viewW, 14);
    if (ghost.length && performance.now() < ghostUntil) {
      ctx.save();
      ctx.strokeStyle = "#3E6B4F";
      ctx.lineWidth = 4;
      ctx.setLineDash([2, 10]);
      ctx.lineCap = "round";
      ctx.beginPath();
      ghost.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.restore();
      var hb = hopperBox();
      var lx = 12;
      var ly = 26;
      if (lx < hb.x + hb.w + 8 && ly > hb.y - 8 && ly < hb.y + hb.h + 16) ly = Math.min(viewH - 18, hb.y + hb.h + 22);
      backed(t("ghost"), lx, ly, 18, "left");
    }
    drawBlock();
    drawBestGhost();
    worldStrokes().forEach(function (s) {
      if (s.length < 2) return;
      ctx.strokeStyle = "#8A4B12";
      ctx.lineWidth = 16;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      s.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
      ctx.stroke();
      ctx.strokeStyle = level === 3 ? "#7EC8E3" : "#E7B56A";
      ctx.lineWidth = 8;
      ctx.stroke();
    });
    if (spillSpots.length && !pouring && live.length === 0 && anyShort()) {
      var sx = 0, sy = 0, sn = 0;
      spillSpots.forEach(function (p) { sx += p.x; sy += p.y; sn++; });
      sx = Math.max(40, Math.min(viewW - 40, sx / sn));
      sy = Math.max(28, Math.min(viewH - 28, sy / sn));
      ctx.beginPath();
      ctx.strokeStyle = "#8C3A2F";
      ctx.lineWidth = 4;
      ctx.ellipse(sx, sy, 34, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      var tipY = sy + 36;
      if (tipY > viewH - 52) tipY = Math.max(22, sy - 28);
      backedWrap(spillSentence(), Math.max(70, Math.min(sx, viewW - 70)), tipY, 16, Math.min(240, viewW - 16));
    }
    cupList.forEach(function (c, i) { drawCup(c, fills[i] || 0, i); });
    drawHopper();
    var visual = mass > 1 ? 7 : 5;
    live.forEach(function (p) {
      if (p.kind === 1) waterDrop({ x: p.x, y: p.y, s: visual });
      else if (matName() === "water" && p.kind !== 0) waterDrop({ x: p.x, y: p.y, s: visual });
      else if (matName() === "gel") gelBlob({ x: p.x, y: p.y, s: visual + 2 });
      else seed({ x: p.x, y: p.y, s: visual, rot: p.rot });
    });
    drawSplashes();
    syncTags();
  }
  var tagSig = "";
  function tagArea(a, b) {
    var w = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    var h = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
    return w > 0 && h > 0 ? w * h : 0;
  }
  function syncTags() {
    var host = document.getElementById("board-tags");
    if (!host) return;
    if (mode === "stack" || !cupList.length || viewW < 8) {
      if (host.childElementCount) host.replaceChildren();
      tagSig = "";
      return;
    }
    var sig = viewW + "x" + viewH + ":" + lang() + ":" + cupList.map(function (c) {
      return Math.round(c.x) + "," + Math.round(c.top) + "," + Math.round(c.w) + "," + Math.round(c.h);
    }).join(";");
    if (sig === tagSig && host.childElementCount) return;
    tagSig = sig;
    host.replaceChildren();
    var r = canvas.getBoundingClientRect();
    var stage = host.parentElement.getBoundingClientRect();
    var sx = r.width / Math.max(1, viewW);
    var sy = r.height / Math.max(1, viewH);
    var ox = r.left - stage.left;
    var oy = r.top - stage.top;
    cupList.forEach(function (c, i) {
      var hit = document.createElement("div");
      hit.className = "cup-hit";
      hit.dataset.cup = String(i);
      hit.style.left = (ox + c.x * sx) + "px";
      hit.style.top = (oy + c.top * sy) + "px";
      hit.style.width = Math.max(1, c.w * sx) + "px";
      hit.style.height = Math.max(1, c.h * sy) + "px";
      host.appendChild(hit);
    });
    var canvasR = canvas.getBoundingClientRect();
    cupList.forEach(function (c, i) {
      var tag = document.createElement("div");
      tag.className = "fill-tag";
      tag.textContent = t("fillTo");
      var left = ox + (c.x + 4) * sx;
      tag.style.left = left + "px";
      tag.style.top = (oy + c.top * sy) + "px";
      tag.style.transform = "translateY(calc(-100% - 4px))";
      host.appendChild(tag);
      var b = tag.getBoundingClientRect();
      var shift = 0;
      if (b.left < canvasR.left + 2) shift = (canvasR.left + 2) - b.left;
      else if (b.right > canvasR.right - 2) shift = (canvasR.right - 2) - b.right;
      if (shift) {
        tag.style.left = (left + shift) + "px";
        b = tag.getBoundingClientRect();
      }
      var hits = host.querySelectorAll(".cup-hit");
      var overlap = 0;
      hits.forEach(function (hit) { overlap += tagArea(b, hit.getBoundingClientRect()); });
      if (overlap > 0 || b.top < canvasR.top + 1) {
        var beside = i === 0 ? canvasR.left + 2 : canvasR.right - 2 - b.width;
        tag.style.left = (beside - stage.left) + "px";
        tag.style.top = (oy + Math.max(4, c.top - 2) * sy) + "px";
        tag.style.transform = "translateY(-100%)";
      }
    });
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.033, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    stepRef(dt);
    showTestJumps();
    if (document.body.classList.contains("at-ref")) return;
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
    if (mode === "stack" && !paused) stepStack(dt);
    if (!paused && !ended && pouring && mode !== "stack") {
      spawnWait -= dt;
      while (spawnLeft > 0 && spawnWait <= 0 && live.length < LIVE_CAP) {
        spawnOne();
        spawnLeft--;
        spawnWait += spawnGap;
      }
      for (var i = 0; i < live.length; i++) {
        var p = live[i];
        p.life = (p.life || 0) + dt;
        if (p.life > 12) {
          if (level === 3 || (level === 5 && p.kind === 1)) {
            dropSpill(p.mass, p.x, p.y);
            if (!leakKind) leakKind = "gap";
          } else settleFree(p);
          p.dead = true;
          continue;
        }
        if (p.mode === "follow") stepFollow(p, dt);
        else stepFree(p, dt);
      }
      live = live.filter(function (p) { return !p.dead; });
      if (spawnLeft <= 0 && live.length === 0) {
        pouring = false;
        if (level === 5 && activeSide === 0 && (fills[0] || 0) >= LINE && (fills[1] || 0) < LINE) {
          activeSide = 1;
          spout = spouts[1] || spout;
          ghostUntil = performance.now() + 5000;
          buildGhost();
          placePicks();
          paintStatus();
        }
      }
      checkFilled();
      paintStatus();
      pourTone();
    } else if (!pouring) stopTone();
    draw();
  }
  function bootLangs() {
    var box = document.getElementById("langs");
    if (!box) return;
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
  function clientPoint(p) {
    var r = canvas.getBoundingClientRect();
    return { x: r.left + p.x * (r.width / viewW), y: r.top + p.y * (r.height / viewH) };
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
  document.getElementById("pick-grains").addEventListener("click", function () { pickSide(0); });
  document.getElementById("pick-water").addEventListener("click", function () { pickSide(1); });
  document.getElementById("stack-tile").addEventListener("click", function () {
    stackFromHome = false;
    enterStack();
  });
  document.getElementById("home-levels").addEventListener("click", openLevels);
  document.getElementById("home-stack").addEventListener("click", openHomeStack);
  document.getElementById("home-ref").addEventListener("click", openRef);
  document.getElementById("home-ideas").addEventListener("click", openIdeas);
  document.getElementById("ref-ideas").addEventListener("click", openIdeas);
  document.getElementById("ideas-home").addEventListener("click", closeIdeas);
  document.getElementById("stack-ref").addEventListener("click", openRef);
  document.getElementById("ref-up").addEventListener("click", function () { refSetMode(false); });
  document.getElementById("ref-down").addEventListener("click", function () { refSetMode(true); });
  document.getElementById("ref-start").addEventListener("click", refStart);
  document.getElementById("ref-stop").addEventListener("click", refStop);
  document.getElementById("ref-reset").addEventListener("click", refReset);
  document.getElementById("ref-done").addEventListener("click", refDone);
  document.getElementById("ref-next").addEventListener("click", refNext);
  document.getElementById("ref-home").addEventListener("click", closeRef);
  document.getElementById("ref-mins").addEventListener("change", function () {
    if (!refRun && !refLock && refDown) refLeft = refMinutes() * 60 * 1000;
    paintRef();
  });
  document.getElementById("ref-teams").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    refTeam = parseInt(btn.getAttribute("data-team"), 10) || 1;
    paintBoard();
  });
  document.getElementById("ref-picks").addEventListener("click", function (e) {
    var btn = e.target.closest("button");
    if (!btn) return;
    refCard = parseInt(btn.getAttribute("data-card"), 10) || 1;
    paintBoard();
  });
  document.getElementById("stack-back").addEventListener("click", leaveStack);
  document.getElementById("pour-btn").addEventListener("click", startPour);
  document.getElementById("retry-btn").addEventListener("click", retry);
  document.getElementById("ghost-toggle").addEventListener("click", function () {
    showBestOn = !showBestOn;
    paintGhostToggle();
  });
  document.getElementById("repour-btn").addEventListener("click", repour);
  document.getElementById("next-btn").addEventListener("click", finishNext);
  document.getElementById("next-level-btn").addEventListener("click", function () { if (level < 5) setLevel(level + 1); });
  document.getElementById("again-btn").addEventListener("click", beatFill);
  document.getElementById("fewer-btn").addEventListener("click", beatFill);
  document.getElementById("hub-btn").addEventListener("click", function () { window.location.href = "/"; });
  document.getElementById("pause-btn").addEventListener("click", function () { setPaused(true); });
  document.getElementById("resume-btn").addEventListener("click", function () { setPaused(false); });
  document.getElementById("menu-btn").addEventListener("click", function () { toggleMenu(true); paintRank(); });
  document.getElementById("menu-close").addEventListener("click", function () { toggleMenu(false); });
  document.getElementById("start-over").addEventListener("click", function () {
    document.getElementById("reset-ask").hidden = false;
  });
  document.getElementById("reset-yes").addEventListener("click", doReset);
  document.getElementById("reset-no").addEventListener("click", function () {
    document.getElementById("reset-ask").hidden = true;
  });
  document.getElementById("read-btn").addEventListener("click", readAloud);
  document.getElementById("alias").addEventListener("change", function (e) { setAlias(e.target.value); });
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
  window.addEventListener("keydown", function (e) {
    var typing = e.target && e.target.closest && e.target.closest("input, textarea");
    if (e.key === "Escape") {
      if (!document.getElementById("ask").hidden) {
        document.getElementById("ask").hidden = true; syncModal(); e.preventDefault(); return;
      }
      if (!document.getElementById("menu").hidden) { toggleMenu(false); e.preventDefault(); return; }
      if (document.body.classList.contains("at-ideas")) { closeIdeas(); e.preventDefault(); return; }
      if (document.body.classList.contains("at-ref")) { closeRef(); e.preventDefault(); return; }
      if (!document.getElementById("endcard").hidden) {
        document.getElementById("endcard").hidden = true;
        if (filledOnce) document.getElementById("donebar").hidden = false;
        syncModal();
        e.preventDefault();
        return;
      }
      setPaused(!paused);
      e.preventDefault();
      return;
    }
    if (typing || ended) return;
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
  loadProgress();
  paintText();
  layout();
  ghostUntil = performance.now() + 5000;
  requestAnimationFrame(frame);
  try { loadStaffTest(); } catch (eTest) {}
  window.__rf = {
    version: VERSION,
    stackGhost: function () {
      var col = stackColumn();
      var r = canvas.getBoundingClientRect();
      var out = [];
      for (var i = 0; i < 3; i++) {
        var x = col.x + col.cw / 2;
        var y = col.floor - col.ch * (i + 0.5);
        out.push({ x: r.left + x * (r.width / Math.max(1, viewW)), y: r.top + y * (r.height / Math.max(1, viewH)) });
      }
      return out;
    },
    fps: function () { return { now: fps, min: fpsMin }; },
    state: function () {
      var r = canvas.getBoundingClientRect();
      return {
        level: level, daily: dailyOn, plan: dailyPlan(schoolDay()), fill: fills[0] || 0, fills: fills.slice(), spill: spill, line: LINE,
        pouring: pouring, live: live.length, words: cupWords(), paused: paused, ended: ended,
        strokes: strokes.length, ramps: clearRamps, best: savedBest(), newBest: newBest, cups: cups, stars: cupStars.slice(), sessionStars: sessionStars.slice(), unlocked: unlocked, levelStars: levelStars.slice(), mass: mass, leak: leakKind, mat: matName(),
        mode: mode, stack: stack.length, stackMsg: stackMsg, tipped: stack.some(function (c) { return c.tipped; }), caught: catchBits.length > 0 && catchBits.every(function (b) { return b.done; }),
        stackBoxes: stack.map(function (c) { return { x: Math.round(c.x), y: Math.round(c.y), w: Math.round(c.w), h: Math.round(c.h), tip: Math.round(c.tip * 100) }; }),
        spawnLeft: spawnLeft,
        sample: live[0] ? { x: Math.round(live[0].x), y: Math.round(live[0].y), vy: Math.round(live[0].vy), mode: live[0].mode, si: live[0].si } : null,
        end: (function () {
          if (!strokes.length || !strokes[0].length) return null;
          var s = strokes[strokes.length - 1];
          var p = denorm(s[s.length - 1]);
          var c = cupList[0];
          return c ? { x: Math.round(p.x), y: Math.round(p.y), lip: lipOverlap(c, p.x, p.y), top: Math.round(c.top), n: s.length } : null;
        })(),
        canvasH: Math.round(r.height), canvasW: Math.round(r.width)
      };
    },
    ghost: function () { return ghost.map(clientPoint); },
    setLevel: setLevel,
    jumpWin: jumpWin,
    jumpLose: jumpLose,
    spout: function () { return clientPoint(spout); },
    hopper: function () { return hopperBox(); },
    world: function () {
      var r = canvas.getBoundingClientRect();
      function box(o) {
        return {
          x: r.left + o.x * (r.width / viewW),
          y: r.top + o.y * (r.height / viewH),
          w: o.w * (r.width / viewW),
          h: o.h * (r.height / viewH)
        };
      }
      return {
        hopper: hopperBox(),
        viewW: viewW,
        viewH: viewH,
        spout: clientPoint(spout),
        cups: cupList.map(function (c) { return Object.assign(box(c), { top: r.top + c.top * (r.height / viewH) }); }),
        block: block ? box(block) : null
      };
    }
  };
  function proofState() {
    var r = canvas.getBoundingClientRect();
    var open = [];
    for (var i = 1; i <= unlocked; i++) open.push(i);
    var cupsOut = [];
    for (var c = 0; c < cupList.length; c++) {
      var amt = fills[c] || 0;
      cupsOut.push({ fill: amt, full: amt >= LINE, stars: cupStars[c] || 0 });
    }
    var status = document.getElementById("status");
    return {
      version: VERSION,
      level: level,
      unlocked: open,
      cups: cupsOut,
      spilled: spill,
      status: status ? status.textContent : "",
      canvasW: Math.round(r.width),
      canvasH: Math.round(r.height)
    };
  }
  function proofLevel(n) {
    stackFromHome = false;
    if (mode === "stack") leaveStack();
    showPlay();
    setLevel(Math.max(1, Math.min(5, n | 0)));
  }
  function knownRamp(from, cup, intoLip) {
    var x0 = from.x;
    var y0 = from.y + 6;
    var x1 = cup.x + cup.w * 0.5;
    var y1 = intoLip ? cup.top + 10 : cup.top + Math.min(28, Math.max(14, cup.h * 0.22));
    var pts = [];
    for (var i = 0; i <= 10; i++) {
      var u = i / 10;
      pts.push(norm({ x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u }));
    }
    return pts;
  }
  function runPour() {
    return new Promise(function (resolve) {
      startPour();
      var guard = 0;
      function tick() {
        guard++;
        if ((pouring || live.length) && guard < 600) { setTimeout(tick, 50); return; }
        resolve();
      }
      setTimeout(tick, 60);
    });
  }
  function solveProof() {
    var jobs = [];
    if (level === 5 && cupList[0] && cupList[1] && spouts[0] && spouts[1]) {
      jobs.push(function () {
        activeSide = 0;
        spout = spouts[0];
        strokes = [knownRamp(spout, cupList[0], false)];
        return runPour();
      });
      jobs.push(function () {
        activeSide = 1;
        spout = spouts[1];
        strokes = [knownRamp(spout, cupList[1], true)];
        return runPour();
      });
    } else if (cupList[0]) {
      strokes = [knownRamp(spout, cupList[0], level === 3 || level === 5)];
      jobs.push(runPour);
    }
    var chain = Promise.resolve();
    jobs.forEach(function (job) { chain = chain.then(job); });
    return chain.then(proofState);
  }
  if (/(?:[?&])proof=1(?:&|$)/.test(location.search)) {
    window.__RF_PROOF = {
      level: function (n) { proofLevel(n); return proofState(); },
      solve: solveProof,
      state: proofState
    };
  }
})();
