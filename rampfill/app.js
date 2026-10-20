/* Ramp & Fill RF 1.0.3 — home tiles. No trackers. */
(function () {
  var VERSION = "RF 1.0.3";
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
      whats: "RF 1.0.3 — Cup Stack has its own tile, fresh levels start clean, and your progress is saved!",
      levels: "Levels", home: "Home",
      whatsNew: "What's new", help: "Help",
      helpDraw: "Draw a ramp like the dotted guide.",
      helpPour: "Press Pour. Grains (water later) slide into the cup.",
      helpPour2: "Press Pour. Grains fill the left cup, then the right.",
      helpPour3: "Press Pour. Water slides in when the ramp sits on the cup lip.",
      helpPour4: "Press Pour. Gel is slow. A flat tray will not move it.",
      helpPour5: "Pick Grains or Water. Only one pours at a time.",
      cupsWord: "Cups:",
      helpSpill: "A spill stays circled. Fix the ramp and try again. Ramps stay on Retry.",
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
      ghost: "Намалюй схил ось так", clearAsk: "Стерти всі схили?", yes: "Так", no: "Ні",
      grains: "Зерна", water: "Вода", gel: "Гель", blockWord: "Блок", fillTo: "лий до сюди",
      empty: "Чашка: порожня", little: "Чашка: трохи є", half: "Чашка: майже половина", moreHalf: "Чашка: більше половини", almost: "Чашка: майже повна", done: "Чашка: до лінії",
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
      left: "Ліва", right: "Права",
      filled: "Наповнив!", repour: "Лий знову", next: "Далі", more: "зможеш наповнити ще?",
      you: "Ти: #", noneRank: "Ти: #—", top: "Топ 10", alias: "Псевдонім",
      whats: "RF 1.0.3 — Cup Stack має власну плитку, нові рівні починаються чисто, а твій прогрес зберігається!",
      levels: "Рівні", home: "Дім",
      whatsNew: "Що нового", help: "Допомога",
      helpDraw: "Намалюй схил по крапках.",
      helpPour: "Натисни Лий. Зерна (вода пізніше) їдуть у чашку.",
      helpPour2: "Натисни Лий. Зерна наповнюють ліву чашку, потім праву.",
      helpPour3: "Натисни Лий. Вода заходить, коли схил лежить на краю чашки.",
      helpPour4: "Натисни Лий. Гель повільний. Плаский лоток його не зрушить.",
      cupsWord: "Чашки:",
      helpSpill: "Розлив лишається в колі. Полагодь схил. На Ще раз схили лишаються.",
      read: "Прочитай мені", language: "Мова",
      lv1: "Перший схил", lv2: "Дві чашки", lv3: "Перший витік", lv4: "Повільний гель",
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
      ghost: "Нарисуй склон вот так", clearAsk: "Стереть все склоны?", yes: "Да", no: "Нет",
      grains: "Зёрна", water: "Вода", gel: "Гель", blockWord: "Блок", fillTo: "лей до сюда",
      empty: "Чашка: пустая", little: "Чашка: чуть-чуть", half: "Чашка: почти половина", moreHalf: "Чашка: больше половины", almost: "Чашка: почти полная", done: "Чашка: до линии",
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
      left: "Левая", right: "Правая",
      filled: "Наполнил!", repour: "Лей снова", next: "Дальше", more: "сможешь наполнить ещё?",
      you: "Ты: #", noneRank: "Ты: #—", top: "Топ 10", alias: "Псевдоним",
      whats: "RF 1.0.3 — У Cup Stack своя плитка, новые уровни начинаются чисто, а твой прогресс сохраняется!",
      levels: "Уровни", home: "Дом",
      whatsNew: "Что нового", help: "Помощь",
      helpDraw: "Нарисуй склон по точкам.",
      helpPour: "Нажми Лей. Зёрна (вода позже) едут в чашку.",
      helpPour2: "Нажми Лей. Зёрна наполняют левую чашку, потом правую.",
      helpPour3: "Нажми Лей. Вода заходит, когда склон лежит на крае чашки.",
      helpPour4: "Нажми Лей. Гель медленный. Плоский лоток его не сдвинет.",
      cupsWord: "Чашки:",
      helpSpill: "Пролив остаётся в круге. Поправь склон. На Ещё раз склоны остаются.",
      read: "Прочитай мне", language: "Язык",
      lv1: "Первый склон", lv2: "Две чашки", lv3: "Первая течь", lv4: "Медленный гель",
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
      ghost: "Dibuja una rampa así", clearAsk: "¿Borrar todas las rampas?", yes: "Sí", no: "No",
      grains: "Granos", water: "Agua", gel: "Gel", blockWord: "Bloque", fillTo: "llena hasta aquí",
      empty: "Taza: vacía", little: "Taza: un poquito", half: "Taza: casi la mitad", moreHalf: "Taza: más de la mitad", almost: "Taza: casi llena", done: "Taza: hasta la línea",
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
      left: "Izquierda", right: "Derecha",
      filled: "¡La llenaste!", repour: "Verter otra vez", next: "Siguiente", more: "¿puedes llenar más?",
      you: "Tú: #", noneRank: "Tú: #—", top: "Top 10", alias: "Alias",
      whats: "RF 1.0.3 — ¡Cup Stack tiene su propio botón, los niveles empiezan limpios y tu progreso se guarda!",
      levels: "Niveles", home: "Inicio",
      whatsNew: "Novedades", help: "Ayuda",
      helpDraw: "Dibuja una rampa como la guía de puntos.",
      helpPour: "Pulsa Vierte. Los granos (el agua, más tarde) bajan a la taza.",
      helpPour2: "Pulsa Vierte. Los granos llenan la taza izquierda y luego la derecha.",
      helpPour3: "Pulsa Vierte. El agua entra cuando la rampa toca el borde de la taza.",
      helpPour4: "Pulsa Vierte. El gel es lento. Una bandeja plana no lo mueve.",
      cupsWord: "Tazas:",
      helpSpill: "El derrame queda en un círculo. Arregla la rampa. Otra vez deja las rampas.",
      read: "Léemelo", language: "Idioma",
      lv1: "Primera rampa", lv2: "Dos tazas", lv3: "Primera fuga", lv4: "Gel lento",
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
      ghost: "ارسم منحدرًا هكذا", clearAsk: "مسح كل المنحدرات؟", yes: "نعم", no: "لا",
      grains: "حبوب", water: "ماء", gel: "هلام", blockWord: "كتلة", fillTo: "املأ إلى هنا",
      empty: "الكوب: فارغ", little: "الكوب: قليل", half: "الكوب: قريب من النصف", moreHalf: "الكوب: أكثر من النصف", almost: "الكوب: قريب من الامتلاء", done: "الكوب: حتى الخط",
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
      left: "اليسار", right: "اليمين",
      filled: "امتلأ!", repour: "اسكب مرة أخرى", next: "التالي", more: "هل تملأ المزيد؟",
      you: "أنت: #", noneRank: "أنت: #—", top: "أفضل 10", alias: "اسم مستعار",
      whats: "RF 1.0.3 — للعبة Cup Stack مربّع خاص، والمراحل الجديدة تبدأ نظيفة، وتقدّمك محفوظ!",
      levels: "المراحل", home: "البداية",
      whatsNew: "ما الجديد", help: "مساعدة",
      helpDraw: "ارسم منحدرًا مثل الدليل المنقط.",
      helpPour: "اضغط اسكب. الحبوب (الماء لاحقًا) تنزلق إلى الكوب.",
      helpPour2: "اضغط اسكب. الحبوب تملأ الكوب الأيسر ثم الأيمن.",
      helpPour3: "اضغط اسكب. الماء يدخل حين يلامس المنحدر حافة الكوب.",
      helpPour4: "اضغط اسكب. الهلام بطيء. الصينية المسطحة لا تحرّكه.",
      cupsWord: "الأكواب:",
      helpSpill: "الانسكاب يبقى في دائرة. أصلح المنحدر. إعادة تبقي المنحدرات.",
      read: "اقرأه لي", language: "اللغة",
      lv1: "المنحدر الأول", lv2: "كوبان", lv3: "أول تسرب", lv4: "هلام بطيء",
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
      ghost: "یک سرازیری این‌طور بکش", clearAsk: "همه سرازیری‌ها پاک شود؟", yes: "بله", no: "نه",
      grains: "دانه‌ها", water: "آب", gel: "ژل", blockWord: "بلوک", fillTo: "تا اینجا پر کن",
      empty: "پیاله: خالی", little: "پیاله: کمی", half: "پیاله: نزدیک نیمه", moreHalf: "پیاله: بیشتر از نیمه", almost: "پیاله: نزدیک پر", done: "پیاله: تا خط",
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
      left: "چپ", right: "راست",
      filled: "پر شد!", repour: "دوباره بریز", next: "بعدی", more: "می‌توانی بیشتر پر کنی؟",
      you: "تو: #", noneRank: "تو: #—", top: "ده تای برتر", alias: "نام مستعار",
      whats: "RF 1.0.3 — Cup Stack کاشی خودش را دارد، مرحله‌های تازه پاک شروع می‌شوند و پیشرفتت ذخیره می‌شود!",
      levels: "مرحله‌ها", home: "خانه",
      whatsNew: "تازه‌ها", help: "کمک",
      helpDraw: "سرازیری را مثل نقطه‌ها بکش.",
      helpPour: "بریز را بزن. دانه‌ها (آب بعداً) به پیاله می‌لغزند.",
      helpPour2: "بریز را بزن. دانه‌ها اول پیاله چپ را پر می‌کنند، بعد راست را.",
      helpPour3: "بریز را بزن. آب وقتی وارد می‌شود که سرازیری روی لبه پیاله باشد.",
      helpPour4: "بریز را بزن. ژل آهسته است. سینی تخت آن را تکان نمی‌دهد.",
      cupsWord: "پیاله‌ها:",
      helpSpill: "ریختن در دایره می‌ماند. سرازیری را درست کن. دوباره سرازیری‌ها را نگه می‌دارد.",
      read: "برایم بخوان", language: "زبان",
      lv1: "سرازیری اول", lv2: "دو پیاله", lv3: "اولین نشت", lv4: "ژل آهسته",
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
      ghost: "Shushanya umuhengamo utya", clearAsk: "Siba imihengamo yose?", yes: "Yego", no: "Oya",
      grains: "Ibinyanye", water: "Amazi", gel: "Jeli", blockWord: "Igipimo", fillTo: "uzuza kugeza hano",
      empty: "Igikombe: kirimo ubusa", little: "Igikombe: gito", half: "Igikombe: hafi kimwe cya kabiri", moreHalf: "Igikombe: kirenze kimwe cya kabiri", almost: "Igikombe: hafi kuzura", done: "Igikombe: kugeza ku murongo",
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
      left: "Ibumoso", right: "Iburyo",
      filled: "Cyuzuye!", repour: "Suka ukundi", next: "Ikurikira", more: "waba ushobora kwuzuza ibindi?",
      you: "Wowe: #", noneRank: "Wowe: #—", top: "10 za mbere", alias: "Izina ry'akazi",
      whats: "RF 1.0.3 — Cup Stack ifite akazu kayo, ingero nshya zitangira zisukuye, kandi aho ugeze harabikwa!",
      levels: "Ingero", home: "Ahabanza",
      whatsNew: "Ibishya", help: "Ubufasha",
      helpDraw: "Shushanya umuhengamo nka utudomo.",
      helpPour: "Kanda Suka. Ibinyanye (amazi nyuma) bigera mu gikombe.",
      helpPour2: "Kanda Suka. Ibinyanye buzura igikombe cy'ibumoso, hanyuma icy'iburyo.",
      helpPour3: "Kanda Suka. Amazi yinjira iyo umuhengamo wicaye ku munwa w'igikombe.",
      helpPour4: "Kanda Suka. Jeli itinda. Urubaho rw'urutambike ntiruyikurura.",
      cupsWord: "Ibikombe:",
      helpSpill: "Ibyasutse biguma mu ruziga. Kosora umuhengamo. Ongera bisiga imihengamo.",
      read: "Nsome", language: "Ururimi",
      lv1: "Umuhengamo wa mbere", lv2: "Ibikombe bibiri", lv3: "Isutse rya mbere", lv4: "Jeli itinda",
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
      ghost: "ቁልቁለት ከምዚ ስኣል", clearAsk: "ኩሎም ቁልቁለታት ይደምሰሱ?", yes: "እወ", no: "ኣይፋል",
      grains: "እኽሊ", water: "ማይ", gel: "ጄል", blockWord: "መቆራጽ", fillTo: "ክሳብ ኣብዚ ምላእ",
      empty: "ኽባያ: ባዶ", little: "ኽባያ: ቁሩብ", half: "ኽባያ: ዳርጋ ፍርቂ", moreHalf: "ኽባያ: ልዕሊ ፍርቂ", almost: "ኽባያ: ዳርጋ መሊኡ", done: "ኽባያ: ክሳብ መስመር",
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
      left: "ጸጋም", right: "የማን",
      filled: "መሊኡ!", repour: "ደጊምካ ቀድሕ", next: "ዝቕጽል", more: "ተወሳኺ ክትመልእ ትኽእል ዲኻ?",
      you: "ንስኻ: #", noneRank: "ንስኻ: #—", top: "ላዕለዎት 10", alias: "ሕጉስ ስም",
      whats: "RF 1.0.3 — Cup Stack ናይ ገዛእ ርእሱ ሰሌዳ ኣለዎ፣ ሓደስቲ ደረጃታት ጽሩያት ይጅምሩ፣ ምዕባለኻ ድማ ይዕቀብ!",
      levels: "ደረጃታት", home: "መጀመርታ",
      whatsNew: "ሓድሽ", help: "ሓገዝ",
      helpDraw: "ቁልቁለት ከም ነጥብታት ስኣል።",
      helpPour: "ቀድሕ ጠውቕ። እኽሊ (ማይ ድሕሪት) ናብ ኽባያ ይንሸራተት።",
      helpPour2: "ቀድሕ ጠውቕ። እኽሊ ቀዳማይ ጸጋማይ ኽባያ የምልእ፣ ድሕሪኡ የማናይ።",
      helpPour3: "ቀድሕ ጠውቕ። ማይ የእቱ እንተኾይኑ ቁልቁለት ኣብ ከንፈር ኽባያ ምስ ደቀሰ።",
      helpPour4: "ቀድሕ ጠውቕ። ጄል ቀስ ይብል። ጠፍጣፍ ሳሕን ኣይንቀሳቐሶን።",
      cupsWord: "ኽባያታት:",
      helpSpill: "ዝፈሰሰ ኣብ ዓንኬል ይጸንሕ። ቁልቁለት ኣዐሪ። ደጊም ቁልቁለታት ይሕልዉ።",
      read: "ኣንብበለይ", language: "ቋንቋ",
      lv1: "ቀዳማይ ቁልቁለት", lv2: "ክልተ ኽባያታት", lv3: "ቀዳማይ ፍሳስ", lv4: "ቀስ ዝብል ጄል",
      done1: "ቀዳማይ ቁልቁለት ተዛዚሙ።", done2: "ክልተ ኽባያታት ተዛዚሞም።", done3: "ቀዳማይ ፍሳስ ተዛዚሙ።", done4: "ቀስ ዝብል ጄል ተዛዚሙ።",
      nextLevel: "ዝቕጽል ደረጃ", beat: "ምልኣትካ ዓዊር", hub: "ናብ መጀመርታ ተመለስ",
      noMore: "ካልእ ቁልቁለት ኣሎ ኣይኮነን።",
      paused: "ደው ኢሉ",
      local: "ሕጉስ ስምን ኽባያታትን ኣብዚ መሳርሒ ይጸንሑ። ናይ ብሓቂ ስም የለን። ዕላል የለን።",
      canvas: "ካብ መቐለሲ ናብ ኽባያ ቁልቁለት ስኣል።"
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
  var stack = [];
  var catchBits = [];
  var stackMsg = "";
  var stackWon = false;
  var stackReturnEnd = false;
  var stackFromHome = false;
  var cups = 0;
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
    if (title) title.textContent = t("done" + level);
    if (level >= 5) {
      if (note) { note.hidden = false; note.textContent = t("noMore"); }
      if (nextBtn) nextBtn.hidden = true;
      if (hubBtn) hubBtn.hidden = false;
    } else {
      if (note) { note.hidden = true; note.textContent = ""; }
      if (nextBtn) nextBtn.hidden = false;
      if (hubBtn) hubBtn.hidden = true;
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
    var body = document.getElementById("whats-body");
    if (body) body.textContent = t("whats");
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
    if (lv) lv.textContent = atHome() ? t("home") : mode === "stack" ? t("stackTile") : t("lv" + level);
    canvas.setAttribute("aria-label", mode === "stack" ? t("stackLesson") : t("canvas"));
    paintEndCopy();
    paintStatus();
    paintCups();
    paintRank();
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
  function cupWords() {
    if (level === 5 && fills[0] >= LINE && fills[1] < LINE && !pouring && live.length === 0) return t("pathNext");
    if (level === 2 && fills[0] >= LINE && fills[1] < LINE && !pouring && live.length === 0) return t("leftNext");
    if (level === 2 || level === 5) {
      var a = amountWord(fills[0]).replace(/^[^:]+:\s*/, "");
      var b = amountWord(fills[1]).replace(/^[^:]+:\s*/, "");
      return t("left") + ": " + a + " • " + t("right") + ": " + b + " • " + spillWord() + starBit();
    }
    return amountWord(fills[0] || 0) + " • " + spillWord() + starBit();
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
    if (el) el.textContent = cupWords();
    var show = spill > 0 && !pouring && live.length === 0 && anyShort();
    if (spillEl) spillEl.textContent = show ? spillSentence() : "";
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
    if (level === 1 || level === 4) {
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
  function checkFilled() {
    var all = cupList.length > 0;
    var gained = false;
    for (var i = 0; i < cupList.length; i++) {
      if ((fills[i] || 0) >= LINE) {
        if (!countedCup[i]) {
          countedCup[i] = true;
          cups += 1;
          cupStars[i] = starCount(spill);
          sessionStars.push(cupStars[i]);
          gained = true;
        }
        if (level === 2 && i === 0 && ghostCup === 0 && (fills[1] || 0) < LINE) {
          ghostCup = 1;
          ghostUntil = performance.now() + 5000;
          buildGhost();
        }
      } else all = false;
    }
    if (gained) { saveCups(); noteScore(); paintCups(); }
    if (all && !filledOnce) {
      filledOnce = true;
      sawFill = true;
      paintCups();
      document.getElementById("donebar").hidden = false;
      document.getElementById("endcard").hidden = true;
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
    ghostCup = 0;
    var bar = document.getElementById("donebar");
    if (bar) bar.hidden = true;
    ghostUntil = performance.now() + 5000;
    if (cupList.length) buildGhost();
    pointer = null;
    drawing = null;
    erasing = false;
    paintStatus();
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
    if (back) back.hidden = !stacking;
    if (tile) tile.hidden = stacking;
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
  function openLevels() {
    stackFromHome = false;
    if (mode === "stack") leaveStack();
    showPlay();
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
    if (pouring && spawnLeft > 0) return;
    ended = false;
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
    document.getElementById("donebar").hidden = true;
    document.getElementById("endcard").hidden = false;
    ended = true;
    pouring = false;
    paintEndCopy();
    syncModal();
    var focus = level >= 5 ? document.getElementById("hub-btn") : document.getElementById("next-level-btn");
    if (focus) focus.focus();
  }
  function beatFill() {
    document.getElementById("endcard").hidden = true;
    ended = false;
    clearFills();
    syncModal();
  }
  function setLevel(n) {
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
    var label = t("fillTo");
    ctx.font = "700 18px Barlow, Outfit, sans-serif";
    var tw = ctx.measureText(label).width;
    if (c.x + c.w + 10 + tw < viewW - 4) backed(label, c.x + c.w + 8, lineY + 6, 18, "left");
    else backed(label, c.x + c.w / 2, Math.max(20, c.top - 2), 18, "center");
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
    if (mode === "stack") { drawStack(); return; }
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
      sx /= sn; sy /= sn;
      ctx.beginPath();
      ctx.strokeStyle = "#8C3A2F";
      ctx.lineWidth = 4;
      ctx.ellipse(sx, sy, 34, 22, 0, 0, Math.PI * 2);
      ctx.stroke();
      backedWrap(spillSentence(), sx, Math.min(viewH - 28, sy + 40), 16, Math.min(280, viewW - 24));
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
  }
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.033, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
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
    }
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
  document.getElementById("stack-back").addEventListener("click", leaveStack);
  document.getElementById("pour-btn").addEventListener("click", startPour);
  document.getElementById("retry-btn").addEventListener("click", retry);
  document.getElementById("repour-btn").addEventListener("click", repour);
  document.getElementById("next-btn").addEventListener("click", finishNext);
  document.getElementById("next-level-btn").addEventListener("click", function () { if (level < 5) setLevel(level + 1); });
  document.getElementById("again-btn").addEventListener("click", beatFill);
  document.getElementById("hub-btn").addEventListener("click", function () { window.location.href = "/"; });
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
  loadCups();
  paintText();
  layout();
  ghostUntil = performance.now() + 5000;
  requestAnimationFrame(frame);
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
        level: level, fill: fills[0] || 0, fills: fills.slice(), spill: spill, line: LINE,
        pouring: pouring, live: live.length, words: cupWords(), paused: paused, ended: ended,
        strokes: strokes.length, cups: cups, stars: cupStars.slice(), sessionStars: sessionStars.slice(), mass: mass, leak: leakKind, mat: matName(),
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
})();
