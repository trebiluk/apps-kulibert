/* Sprocket words. English is the fallback. Shared chrome words come from KulibertI18n. */
(function (root) {
  var PACK = {
    en: {
      shop: "Shop desk",
      nowDo: "Do the check boxes. Then tap AMS / stock or Timers.",
      before: "Before you print",
      amsGloss: "AMS = the color box",
      spoolGloss: "spool = the roll of plastic",
      printerGloss: "P1S / P2S = the printer",
      clean: "Clean plate (plate)",
      glue: "Glue stick if the plate needs it (plate)",
      enough: "Enough plastic on the spool (spool)",
      safe: "Stay safe",
      safeBody: "Hot nozzle. Moving parts. Do not reach in while it prints. Wait for the cool timer. Teacher starts the job.",
      first: "First layer look",
      firstBody: "Too high: lines do not stick. Too low: plastic smears. Squish should look like a flat ribbon, not a round noodle.",
      convert: "Convert",
      stock: "Stock",
      timers: "Timers",
      more: "More",
      amsStock: "AMS / stock",
      bambu: "Bambu help",
      starter: "starter spools",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. Always check the spool (spool).",
      amsMap: "AMS map",
      low: "low",
      stockNote: "This live desk shows the starter map. Full edit lives on the teacher PC.",
      noTimer: "No timer",
      print2: "Print 2 h",
      cool: "Cool 20",
      glue2: "Glue 2",
      dry: "Dry PLA 4 h",
      timerNote: "Keep this tab open for the clock. Dry heat is a reminder only — set the dryer yourself.",
      done: "Done",
      studio: "Studio + Handy hub",
      studioSmall: "Official start page",
      amsGuides: "AMS guides",
      amsSmall: "Slots, lights, limits",
      filament: "Filament wiki",
      filamentSmall: "Dry and store notes",
      cannot: "Cannot connect printer",
      cannotSmall: "Studio cannot see the machine",
      official: "Official Bambu pages only. Handy needs cloud mode.",
      about: "Classroom helper. No live printer control. Open sliced files in Studio on the teacher PC.",
      local: "Full converters, spool edit, queue, and backup stay in the local Sprocket file.",
      whats: "Sprocket follows the Hub language.",
      light: "Light",
      dark: "Dark",
      big: "Big type",
      normal: "Normal type",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    uk: {
      shop: "Стіл майстерні",
      nowDo: "Познач клітинки. Потім торкнись AMS / запас або Таймери.",
      before: "Перед друком",
      amsGloss: "AMS = коробка з кольорами",
      spoolGloss: "spool = рулон пластику",
      printerGloss: "P1S / P2S = принтер",
      clean: "Чиста пластина (plate)",
      glue: "Клей, якщо пластині треба (plate)",
      enough: "Досить пластику на котушці (spool)",
      safe: "Безпека",
      safeBody: "Гаряче сопло. Рухомі частини. Не лізь рукою, поки друкує. Чекай таймер охолодження. Роботу починає вчитель.",
      first: "Перший шар",
      firstBody: "Зависоко: лінії не липнуть. Занизько: пластик мажеться. Має бути плоска стрічка, не кругла локшина.",
      convert: "Перевести",
      stock: "Запас",
      timers: "Таймери",
      more: "Ще",
      amsStock: "AMS / запас",
      bambu: "Довідка Bambu",
      starter: "стартові котушки",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. Завжди перевір котушку (spool).",
      amsMap: "Карта AMS",
      low: "мало",
      stockNote: "Тут стартова карта. Повне редагування — на комп’ютері вчителя.",
      noTimer: "Немає таймера",
      print2: "Друк 2 год",
      cool: "Охолодження 20",
      glue2: "Клей 2",
      dry: "Сушка PLA 4 год",
      timerNote: "Не закривай цю вкладку. Сушка — лише нагадування. Сушарку вмикаєш сам.",
      done: "Готово",
      studio: "Студія + Handy",
      studioSmall: "Офіційна перша сторінка",
      amsGuides: "Посібники AMS",
      amsSmall: "Слоти, лампи, межі",
      filament: "Вікі філаменту",
      filamentSmall: "Як сушити і зберігати",
      cannot: "Принтер не з’єднується",
      cannotSmall: "Studio не бачить машину",
      official: "Лише офіційні сторінки Bambu. Handy потребує хмари.",
      about: "Помічник для класу. Принтером звідси не керуєш. Нарізані файли відкривай у Studio на комп’ютері вчителя.",
      local: "Повні перетворення, правка котушок і копія лишаються в локальному файлі Sprocket.",
      whats: "Sprocket говорить мовою Хаба.",
      light: "Світла",
      dark: "Темна",
      big: "Великі літери",
      normal: "Звичайні літери",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    ru: {
      shop: "Стол мастерской",
      nowDo: "Отметь клетки. Потом нажми AMS / запас или Таймеры.",
      before: "Перед печатью",
      amsGloss: "AMS = коробка с цветами",
      spoolGloss: "spool = рулон пластика",
      printerGloss: "P1S / P2S = принтер",
      clean: "Чистая пластина (plate)",
      glue: "Клей, если пластине нужно (plate)",
      enough: "Хватит пластика на катушке (spool)",
      safe: "Безопасность",
      safeBody: "Горячее сопло. Движущиеся части. Не лезь рукой, пока печатает. Жди таймер остывания. Работу начинает учитель.",
      first: "Первый слой",
      firstBody: "Слишком высоко: линии не липнут. Слишком низко: пластик мажется. Должна быть плоская лента, не круглая лапша.",
      convert: "Перевести",
      stock: "Запас",
      timers: "Таймеры",
      more: "Ещё",
      amsStock: "AMS / запас",
      bambu: "Справка Bambu",
      starter: "стартовые катушки",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. Всегда проверь катушку (spool).",
      amsMap: "Карта AMS",
      low: "мало",
      stockNote: "Здесь стартовая карта. Полное редактирование — на компьютере учителя.",
      noTimer: "Нет таймера",
      print2: "Печать 2 ч",
      cool: "Остывание 20",
      glue2: "Клей 2",
      dry: "Сушка PLA 4 ч",
      timerNote: "Не закрывай эту вкладку. Сушка — только напоминание. Сушилку включаешь сам.",
      done: "Готово",
      studio: "Студия + Handy",
      studioSmall: "Официальная первая страница",
      amsGuides: "Руководства AMS",
      amsSmall: "Слоты, лампы, пределы",
      filament: "Вики филамента",
      filamentSmall: "Как сушить и хранить",
      cannot: "Принтер не соединяется",
      cannotSmall: "Studio не видит машину",
      official: "Только официальные страницы Bambu. Handy нуждается в облаке.",
      about: "Помощник для класса. Принтером отсюда не управляешь. Нарезанные файлы открывай в Studio на компьютере учителя.",
      local: "Полные преобразования, правка катушек и копия остаются в локальном файле Sprocket.",
      whats: "Sprocket говорит на языке Хаба.",
      light: "Светлая",
      dark: "Тёмная",
      big: "Крупный текст",
      normal: "Обычный текст",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    es: {
      shop: "Mesa del taller",
      nowDo: "Marca las casillas. Luego toca AMS / material o Temporizadores.",
      before: "Antes de imprimir",
      amsGloss: "AMS = la caja de colores",
      spoolGloss: "spool = el rollo de plástico",
      printerGloss: "P1S / P2S = la impresora",
      clean: "Limpia la placa (plate)",
      glue: "Barra de pegamento si la placa lo necesita (plate)",
      enough: "Bastante plástico en el rollo (spool)",
      safe: "Con cuidado",
      safeBody: "Boquilla caliente. Piezas que se mueven. No metas la mano mientras imprime. Espera el temporizador de enfriado. El profe empieza el trabajo.",
      first: "La primera capa",
      firstBody: "Muy alto: las líneas no pegan. Muy bajo: el plástico se aplasta. Debe verse como una cinta plana, no un fideo redondo.",
      convert: "Convertir",
      stock: "Material",
      timers: "Temporizadores",
      more: "Más",
      amsStock: "AMS / material",
      bambu: "Ayuda Bambu",
      starter: "rollos de inicio",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. Siempre revisa el rollo (spool).",
      amsMap: "Mapa AMS",
      low: "bajo",
      stockNote: "Esta mesa muestra el mapa de inicio. El cambio completo está en la PC del profe.",
      noTimer: "Sin temporizador",
      print2: "Imprimir 2 h",
      cool: "Enfriar 20",
      glue2: "Pegamento 2",
      dry: "Secar PLA 4 h",
      timerNote: "Deja esta pestaña abierta. El calor de secado solo avisa. Tú enciendes la secadora.",
      done: "Listo",
      studio: "Studio + Handy",
      studioSmall: "Página oficial de inicio",
      amsGuides: "Guías AMS",
      amsSmall: "Ranuras, luces, límites",
      filament: "Wiki del filamento",
      filamentSmall: "Notas para secar y guardar",
      cannot: "No conecta la impresora",
      cannotSmall: "Studio no ve la máquina",
      official: "Solo páginas oficiales de Bambu. Handy necesita la nube.",
      about: "Ayudante de clase. No controla la impresora en vivo. Abre los archivos cortados en Studio en la PC del profe.",
      local: "Los convertidores completos, el rollo y la copia quedan en el archivo local de Sprocket.",
      whats: "Sprocket sigue el idioma del Hub.",
      light: "Claro",
      dark: "Oscuro",
      big: "Letra grande",
      normal: "Letra normal",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    ar: {
      shop: "طاولة الورشة",
      nowDo: "علّم المربعات. ثم المس AMS / المخزون أو المؤقتات.",
      before: "قبل الطباعة",
      amsGloss: "AMS = صندوق الألوان",
      spoolGloss: "spool = لفة البلاستيك",
      printerGloss: "P1S / P2S = الطابعة",
      clean: "نظّف اللوحة (plate)",
      glue: "عصا لصق إذا احتاجت اللوحة (plate)",
      enough: "بلاستيك كافٍ على اللفة (spool)",
      safe: "ابقَ آمناً",
      safeBody: "الفوهة ساخنة. أجزاء تتحرك. لا تمد يدك أثناء الطباعة. انتظر مؤقت التبريد. المعلم يبدأ العمل.",
      first: "شكل الطبقة الأولى",
      firstBody: "عالية جداً: الخطوط لا تلتصق. منخفضة جداً: البلاستيك يتمدد. يجب أن تبدو شريطاً مسطحاً لا معكرونة.",
      convert: "حوّل",
      stock: "المخزون",
      timers: "المؤقتات",
      more: "المزيد",
      amsStock: "AMS / المخزون",
      bambu: "مساعدة Bambu",
      starter: "لفات البداية",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. افحص اللفة دائماً (spool).",
      amsMap: "خريطة AMS",
      low: "قليل",
      stockNote: "هذه الطاولة تعرض خريطة البداية. التعديل الكامل على جهاز المعلم.",
      noTimer: "لا مؤقت",
      print2: "طباعة ساعتين",
      cool: "تبريد 20",
      glue2: "لصق 2",
      dry: "تجفيف PLA ٤ س",
      timerNote: "اترك هذه الصفحة مفتوحة. حرارة التجفيف تذكير فقط. أنت تشغّل المجفف.",
      done: "تم",
      studio: "Studio + Handy",
      studioSmall: "صفحة البداية الرسمية",
      amsGuides: "أدلة AMS",
      amsSmall: "فتحات وأضواء وحدود",
      filament: "ويكي الخيط",
      filamentSmall: "ملاحظات التجفيف والتخزين",
      cannot: "الطابعة لا تتصل",
      cannotSmall: "Studio لا يرى الآلة",
      official: "صفحات Bambu الرسمية فقط. Handy يحتاج السحابة.",
      about: "مساعد الصف. لا يتحكم بالطابعة مباشرة. افتح الملفات المقطعة في Studio على جهاز المعلم.",
      local: "التحويل الكامل وتعديل اللفة والنسخة تبقى في ملف Sprocket المحلي.",
      whats: "Sprocket يتبع لغة المحور.",
      light: "فاتح",
      dark: "داكن",
      big: "خط كبير",
      normal: "خط عادي",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    "fa-AF": {
      shop: "میز دکان",
      nowDo: "خانه‌ها را نشانی کن. بعد AMS / ذخیره یا تایمر را بزن.",
      before: "پیش از چاپ",
      amsGloss: "AMS = جعبه رنگ",
      spoolGloss: "spool = رول پلاستیک",
      printerGloss: "P1S / P2S = پرنتر",
      clean: "صفحه را پاک کن (plate)",
      glue: "اگر صفحه لازم دارد، چسب بزن (plate)",
      enough: "پلاستیک کافی روی رول (spool)",
      safe: "در امان بمان",
      safeBody: "نوزل داغ است. تکه‌های روان حرکت می کنند. وقت چاپ دست نزن. تایمر سرد شدن را صبر کن. معلم کار را شروع می کند.",
      first: "نگاه لایه اول",
      firstBody: "بلند: خط نمی چسبد. پایین: پلاستیک پهن می شود. باید مانند فیتۀ پهن باشد، نه رشته گرد.",
      convert: "تبدیل",
      stock: "ذخیره",
      timers: "تایمرها",
      more: "بیشتر",
      amsStock: "AMS / ذخیره",
      bambu: "کمک Bambu",
      starter: "رول‌های آغاز",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. همیشه رول را ببین (spool).",
      amsMap: "نقشه AMS",
      low: "کم",
      stockNote: "این میز نقشه آغاز را نشان می دهد. ویرایش کامل در کمپیوتر معلم است.",
      noTimer: "تایمر نیست",
      print2: "چاپ ۲ ساعت",
      cool: "سرد شدن ۲۰",
      glue2: "چسب ۲",
      dry: "خشک کردن PLA ۴ ساعت",
      timerNote: "این صفحه را باز بگذار. گرمی خشک فقط یادآوری است. خشک‌کن را خودت روشن کن.",
      done: "تمام",
      studio: "Studio + Handy",
      studioSmall: "صفحه آغاز رسمی",
      amsGuides: "رهنمای AMS",
      amsSmall: "خانه‌ها، چراغ، حد",
      filament: "ویکی فیلامنت",
      filamentSmall: "خشک و نگهداری",
      cannot: "پرنتر وصل نمی شود",
      cannotSmall: "Studio ماشین را نمی بیند",
      official: "فقط صفحه‌های رسمی Bambu. Handy به ابر ضرورت دارد.",
      about: "کمک صنف. از اینجا پرنتر را روشن نمی کنی. فایل بریده را در Studio روی کمپیوتر معلم باز کن.",
      local: "تبدیل کامل، ویرایش رول و کاپی در فایل محلی Sprocket می ماند.",
      whats: "Sprocket زبان هاب را پیروی می کند.",
      light: "روشن",
      dark: "تاریک",
      big: "حرف بزرگ",
      normal: "حرف عادی",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    rw: {
      shop: "Ameza y'ikoraniro",
      nowDo: "Shyira akamenyetso ku gasanduku. Hanyuma kanda AMS / ibicuruzwa cyangwa Timer.",
      before: "Mbere yo gucapura",
      amsGloss: "AMS = agasanduku k'amabara",
      spoolGloss: "spool = umurongo wa pulasitiki",
      printerGloss: "P1S / P2S = mucapari",
      clean: "Sukura urubaho (plate)",
      glue: "Shyira kole niba urubaho rubikeneye (plate)",
      enough: "Pulasitiki ihagije ku murongo (spool)",
      safe: "Bika umutekano",
      safeBody: "Umunwa wa mucapari urashyushye. Ibice birimo kugenda. Ntugere mo igihe irimo gucapura. Tegereza timer yo gukonja. Umwarimu ni we utangira akazi.",
      first: "Isura y'urubariro rwa mbere",
      firstBody: "Hejuru cyane: imirongo ntigumaho. Hasi cyane: pulasitiki irasa. Igomba kuba umurongo upfutse, si spageti.",
      convert: "Hindura",
      stock: "Ibicuruzwa",
      timers: "Timer",
      more: "Ibindi",
      amsStock: "AMS / ibicuruzwa",
      bambu: "Ubufasha bwa Bambu",
      starter: "imirongo yo gutangira",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. Buri gihe reba umurongo (spool).",
      amsMap: "Ikarita ya AMS",
      low: "bike",
      stockNote: "Iyi meza yerekana ikarita yo gutangira. Guhindura byose biba kuri mudasobwa y'umwarimu.",
      noTimer: "Nta timer",
      print2: "Capura amasaha 2",
      cool: "Konja 20",
      glue2: "Kole 2",
      dry: "Umutsi PLA amasaha 4",
      timerNote: "Sigaho iyi paji. Ubushyuhe bwo kuma ni icyibutso gusa. Ni wowe ucana umuriro.",
      done: "Byarangiye",
      studio: "Studio + Handy",
      studioSmall: "Paji y'ibanze yemewe",
      amsGuides: "Amabwiriza ya AMS",
      amsSmall: "Utuyumba, amatara, imipaka",
      filament: "Wiki ya filament",
      filamentSmall: "Kuma no kubika",
      cannot: "Mucapari ntiyahuza",
      cannotSmall: "Studio ntiyabona imashini",
      official: "Paji zemewe za Bambu gusa. Handy ikeneye cloud.",
      about: "Umufasha w'ishuri. Ntiyagenza mucapari ako kanya. Fungura dosiye zaciwe muri Studio kuri mudasobwa y'umwarimu.",
      local: "Guhindura byuzuye, guhindura umurongo, na kopi bisigara muri dosiye ya Sprocket iri hano.",
      whats: "Sprocket ikurikiza ururimi rwa Hub.",
      light: "Umuco",
      dark: "Umwijima",
      big: "Inyuguti nini",
      normal: "Inyuguti zisanzwe",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    },
    ti: {
      shop: "ሰደቓ ዕዳጋ",
      nowDo: "ሳጹናት ምልክት ግበር። ድሕሪኡ AMS / መኽዘን ወይ ቆጻሪ ጠውቕ።",
      before: "ቅድሚ ሕትመት",
      amsGloss: "AMS = ሳጹን ሕብሪ",
      spoolGloss: "spool = ጥቕሊ ፕላስቲክ",
      printerGloss: "P1S / P2S = መሕተሚ",
      clean: "ሰሌዳ ኣጽርይ (plate)",
      glue: "ሰሌዳ እንተ ደልየቶ ሙጫ (plate)",
      enough: "ኣብ ጥቕሊ እኹል ፕላስቲክ (spool)",
      safe: "ውሑስ ኩን",
      safeBody: "ኣፍ ሙቐት እዩ። ኣካላት ይንቀሳቐሱ። ኣብ እዋን ሕትመት ኢድካ ኣይኣትው። ናይ ዝሑል ቆጻሪ ተጸበ። ስራሕ መምህር እዩ ዝጅምር።",
      first: "መልክዕ ናይ ቀዳማይ ፍርቂ",
      firstBody: "ልዑል፡ መስመራት ኣይተጣበቕን። ትሑት፡ ፕላስቲክ ይበታተን። ከም ጠፍጢፍ ቴፕ ክመስል ኣለዎ፡ ከይኸውን ዘውራር መስመር።",
      convert: "ቀይር",
      stock: "መኽዘን",
      timers: "ቆጻሪታት",
      more: "ተወሳኺ",
      amsStock: "AMS / መኽዘን",
      bambu: "ሓገዝ Bambu",
      starter: "ናይ መጀመርታ ጥቕልታት",
      mmNote: "1 in = 25.4 mm. F = C × 9/5 + 32. ኩሉ ግዜ ጥቕሊ ርኣይ (spool).",
      amsMap: "ካርታ AMS",
      low: "ውሑድ",
      stockNote: "እዚ ሰደቓ ናይ መጀመርታ ካርታ የርኢ። ምሉእ ምትዕርራይ ኣብ ኮምፒተር መምህር እዩ።",
      noTimer: "ቆጻሪ የለን",
      print2: "ሕትመት 2 ሰዓት",
      cool: "ዝሑል 20",
      glue2: "ሙጫ 2",
      dry: "PLA 4 ሰዓት ኣድርቕ",
      timerNote: "እዚ ገጽ ክፉት ግደፎ። ድሩቕ ሙቐት መዘኻኸሪ ጥራይ እዩ። ማድረቒ ንስኻ ትውልዖ።",
      done: "ተወዲኡ",
      studio: "Studio + Handy",
      studioSmall: "ወግዓዊ መጀመርታ ገጽ",
      amsGuides: "መምርሒ AMS",
      amsSmall: "ቦታታት፡ መብራህቲ፡ ደረት",
      filament: "ዊኪ ፊላመንት",
      filamentSmall: "ምድራቕን ምዕቃብን",
      cannot: "መሕተሚ ኣይራኸብን",
      cannotSmall: "Studio ነቲ ማሽን ኣይርእዮን",
      official: "ወግዓዊ ገጻት Bambu ጥራይ። Handy ደበና የድሊ።",
      about: "ሓጋዚ ክፍሊ። ካብዚ መሕተሚ ኣይትቆጻጸርን። ዝተቐረጸ ፋይላት ኣብ Studio ኣብ ኮምፒተር መምህር ክፈት።",
      local: "ምሉእ ምቕያር፡ ምትዕርራይ ጥቕሊ፡ ከምኡ ውን ቅዳሕ ኣብ ናይዚ ቦታ ፋይል Sprocket ይቕመጥ።",
      whats: "Sprocket ቋንቋ ሃብ ይስዕብ።",
      light: "ብርሃን",
      dark: "ጸልማት",
      big: "ዓቢ ፊደል",
      normal: "ንቡር ፊደል",
      jade: "Jade White PLA",
      black: "Black PLA",
      teal: "Teal PLA",
      yellow: "Yellow PETG"
    }
  };

  function classic() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("theme") === "classic" || q.get("hub") === "classic") return true;
      if (localStorage.getItem("tech-room-hub") === "classic") return true;
    } catch (e) {}
    return false;
  }
  function lang() {
    if (classic()) return "en";
    var code = "en";
    try {
      var q = new URLSearchParams(location.search).get("lang") || "";
      if (q) code = q;
      else if (root.KulibertPrefs && root.KulibertPrefs.lang) code = root.KulibertPrefs.lang;
      else code = document.documentElement.getAttribute("data-kp-lang") || "en";
    } catch (e) { code = "en"; }
    if (code === "simple") return "en";
    return PACK[code] ? code : "en";
  }
  function tx(key) {
    var table = PACK[lang()] || PACK.en;
    if (table[key]) return table[key];
    if (PACK.en[key]) return PACK.en[key];
    return key || "";
  }
  function shared(key, fallback) {
    var api = root.KulibertI18n;
    if (api && api.t) {
      try {
        var v = api.t(key, fallback || "");
        if (v) return v;
      } catch (e) {}
    }
    return fallback || key;
  }
  function bdi(name) { return "<bdi>" + name + "</bdi>"; }
  function slot(n, name, extra) {
    return '<div class="ams-slot"><b>' + bdi("AMS " + n) + '</b><span>' + bdi(tx(name)) + '</span><small>' + extra + '</small></div>';
  }
  function view(name) {
    if (name === "convert") {
      return '<div class="wrap"><h1>' + tx("convert") + '</h1>' +
        '<div class="card"><label>mm</label><input id="mm" type="number" inputmode="decimal" value="25.4"><div class="big" id="mmout"></div></div>' +
        '<div class="card"><label>C</label><input id="c" type="number" inputmode="decimal" value="215"><div class="big" id="cout"></div></div>' +
        '<p class="formula">' + tx("mmNote") + '</p></div>';
    }
    if (name === "stock") {
      return '<div class="wrap"><h1>' + tx("stock") + '</h1><div class="card"><strong>' + tx("amsMap") + '</strong><div class="ams-grid">' +
        slot(1, "jade", "820 g") +
        slot(2, "black", "140 g · " + tx("low")) +
        slot(3, "teal", "610 g") +
        slot(4, "yellow", "430 g") +
        '</div><p class="muted">' + tx("stockNote") + '</p></div></div>';
    }
    if (name === "timers") {
      return '<div class="wrap"><h1>' + tx("timers") + '</h1><div class="card"><strong id="tlab">' + tx("noTimer") + '</strong><div class="timer-time" id="tclk">0:00</div><div class="chips">' +
        '<button class="chip" data-min="120">' + tx("print2") + '</button>' +
        '<button class="chip" data-min="20">' + tx("cool") + '</button>' +
        '<button class="chip" data-min="2">' + tx("glue2") + '</button>' +
        '<button class="chip" data-min="240">' + tx("dry") + '</button>' +
        '</div><p class="muted">' + tx("timerNote") + '</p></div></div>';
    }
    if (name === "help") {
      return '<div class="wrap"><h1>' + tx("bambu") + '</h1><div class="help">' +
        '<a href="https://wiki.bambulab.com/en/studio-handy" target="_blank" rel="noopener">' + tx("studio") + '<small>' + tx("studioSmall") + '</small></a>' +
        '<a href="https://wiki.bambulab.com/en/ams" target="_blank" rel="noopener">' + tx("amsGuides") + '<small>' + tx("amsSmall") + '</small></a>' +
        '<a href="https://wiki.bambulab.com/en/filament-acc" target="_blank" rel="noopener">' + tx("filament") + '<small>' + tx("filamentSmall") + '</small></a>' +
        '<a href="https://wiki.bambulab.com/en/software/bambu-studio/failed-to-connect-printer" target="_blank" rel="noopener">' + tx("cannot") + '<small>' + tx("cannotSmall") + '</small></a>' +
        '</div><div class="warnbox">' + tx("official") + '</div></div>';
    }
    if (name === "more") {
      return '<div class="wrap"><h1>' + tx("more") + '</h1><div class="card"><strong><bdi>Sprocket</bdi> 1.5.1</strong>' +
        '<p class="muted">' + tx("whats") + '</p>' +
        '<p class="muted">' + tx("about") + '</p>' +
        '<p class="muted">' + tx("local") + '</p></div></div>';
    }
    return '<div class="wrap"><h1>' + tx("shop") + '</h1>' +
      '<p class="now-do muted">' + tx("nowDo") + '</p>' +
      '<p class="muted">' + tx("whats") + '</p>' +
      '<div class="pills">' +
      '<button class="pill-btn" data-tab="stock"><b>4</b> ' + tx("starter") + '</button>' +
      '<button class="pill-btn" data-tab="timers">' + tx("timers") + '</button>' +
      '<button class="pill-btn">' + bdi("P1S") + ' / ' + bdi("P2S") + '</button>' +
      '</div>' +
      '<div class="card"><strong>' + tx("before") + '</strong><div class="gloss">' +
      '<article><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="8" width="24" height="16" fill="none" stroke="currentColor" stroke-width="2"/></svg><p><bdi>' + tx("amsGloss") + '</bdi></p></article>' +
      '<article><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="10" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="16" r="3"/></svg><p><bdi>' + tx("spoolGloss") + '</bdi></p></article>' +
      '<article><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="6" y="10" width="20" height="14" fill="none" stroke="currentColor" stroke-width="2"/></svg><p><bdi>' + tx("printerGloss") + '</bdi></p></article>' +
      '</div>' +
      '<label class="check"><input type="checkbox"><svg viewBox="0 0 32 32" aria-hidden="true"><rect x="4" y="14" width="24" height="8" fill="none" stroke="currentColor"/></svg> ' + tx("clean") + '</label>' +
      '<label class="check"><input type="checkbox"><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M10 22l6-14 6 14" fill="none" stroke="currentColor"/></svg> ' + tx("glue") + '</label>' +
      '<label class="check"><input type="checkbox"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="8" fill="none" stroke="currentColor"/></svg> ' + tx("enough") + '</label>' +
      '</div>' +
      '<div class="card"><strong>' + tx("safe") + '</strong><p class="muted">' + tx("safeBody") + '</p></div>' +
      '<div class="card"><strong>' + tx("first") + '</strong><p class="muted">' + tx("firstBody") + '</p></div>' +
      '<div class="quick">' +
      '<button class="btn secondary" data-tab="convert">' + tx("convert") + '</button>' +
      '<button class="btn secondary" data-tab="stock">' + tx("amsStock") + '</button>' +
      '<button class="btn secondary" data-tab="help">' + shared("help", tx("bambu")) + '</button>' +
      '<button class="btn secondary" data-tab="timers">' + tx("timers") + '</button>' +
      '</div></div>';
  }
  function paintNav() {
    var map = {
      home: shared("home", "Home"),
      convert: tx("convert"),
      stock: tx("stock"),
      timers: tx("timers"),
      help: shared("help", "Help"),
      more: tx("more")
    };
    document.querySelectorAll(".nav button").forEach(function (b) {
      var key = b.getAttribute("data-tab");
      var icon = b.querySelector("span");
      var glyph = icon ? icon.textContent : "";
      if (!map[key]) return;
      b.textContent = "";
      if (glyph) {
        var s = document.createElement("span");
        s.textContent = glyph;
        b.appendChild(s);
      }
      b.appendChild(document.createTextNode(map[key]));
    });
    var mode = document.getElementById("mode-btn");
    if (mode) {
      var on = document.body.classList.contains("student");
      mode.textContent = on ? tx("normal") : tx("big");
    }
    var dark = document.getElementById("dark-btn");
    if (dark) dark.textContent = document.body.classList.contains("dark") ? tx("light") : tx("dark");
  }
  root.SprocketI18n = { tx: tx, shared: shared, lang: lang, view: view, paintNav: paintNav, doneWord: function () { return tx("done"); } };
})(window);
