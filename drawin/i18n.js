/* Drawin' words. English is the key and the fallback. simple and classic stay English. */
(function (root) {
  var PACK = { uk: {}, ru: {}, es: {}, ar: {}, "fa-AF": {}, rw: {}, ti: {} };
  function add(en, uk, ru, es, ar, fa, rw, ti) {
    var row = { uk: uk, ru: ru, es: es, ar: ar, "fa-AF": fa, rw: rw, ti: ti };
    Object.keys(row).forEach(function (k) { if (row[k]) PACK[k][en] = row[k]; });
  }
  add("Select", "Вибір", "Выбор", "Elegir", "تحديد", "انتخاب", "Hitamo", "ምረጽ");
  add("Node", "Вузли", "Узлы", "Nodos", "عقد", "گره", "Udupfu", "ኣንጓ");
  add("Points", "Точки", "Точки", "Puntos", "نقاط", "نقطه‌ها", "Utudomo", "ነጥብታት");
  add("Pen", "Перо", "Перо", "Pluma", "قلم", "قلم", "Ikinyuguti", "ብርዒ");
  add("Pencil", "Олівець", "Карандаш", "Lápiz", "قلم رصاص", "پنسل", "Ikaramu", "ርሳስ");
  add("Rectangle", "Прямокутник", "Прямоугольник", "Rectángulo", "مستطيل", "مستطیل", "Urukiramende", "ርብዒ");
  add("Ellipse", "Еліпс", "Эллипс", "Elipse", "بيضاوي", "بیضوي", "Uruziga", "ክቢ");
  add("Polygon", "Багатокутник", "Многоугольник", "Polígono", "مضلع", "چندضلعی", "Uruhinga", "ዝተዓጽፈ");
  add("Star", "Зірка", "Звезда", "Estrella", "نجمة", "ستاره", "Inyenyeri", "ኮኸብ");
  add("Spiral", "Спіраль", "Спираль", "Espiral", "حلزون", "مارپیچ", "Uruziga", "ሽኮር");
  add("Text", "Текст", "Текст", "Texto", "نص", "متن", "Inyandiko", "ጽሑፍ");
  add("Gradient", "Градієнт", "Градиент", "Degradado", "تدرج", "رنگ‌رفت", "Irangi", "ቀለም");
  add("Dropper", "Піпетка", "Пипетка", "Gotero", "قطارة", "قطره", "Gutora", "ምጥቃስ");
  add("Zoom", "Лупа", "Лупа", "Zoom", "تكبير", "زوم", "Kwegera", "ኣጉሊ");
  add("Hand", "Рука", "Рука", "Mano", "يد", "دست", "Ikiganza", "ኢድ");
  add("Shape tools", "Фігури", "Фигуры", "Formas", "أشكال", "شکل‌ها", "Imisusire", "ቅርጺ");
  add("File", "Файл", "Файл", "Archivo", "ملف", "فایل", "Dosiye", "ፋይል");
  add("Edit", "Правка", "Правка", "Editar", "تحرير", "سمون", "Hindura", "ኣርም");
  add("Object", "Об'єкт", "Объект", "Objeto", "عنصر", "چیز", "Ikintu", "ነገር");
  add("Path", "Контур", "Контур", "Trazo", "مسار", "خط", "Umuyoboro", "መንገዲ");
  add("View", "Вигляд", "Вид", "Ver", "عرض", "دیدن", "Reba", "ርኣይ");
  add("New page", "Нова сторінка", "Новая страница", "Página nueva", "صفحة جديدة", "صفحه نو", "Paji nshya", "ሓድሽ ገጽ");
  add("Open SVG…", "Відкрити SVG…", "Открыть SVG…", "Abrir SVG…", "افتح SVG…", "SVG باز کن…", "Fungura SVG…", "SVG ክፈት…");
  add("Save SVG", "Зберегти SVG", "Сохранить SVG", "Guardar SVG", "احفظ SVG", "SVG ثبت کن", "Bika SVG", "SVG ዕቅብ");
  add("Export PNG", "Експорт PNG", "Экспорт PNG", "Exportar PNG", "صدّر PNG", "PNG ببر", "Sohora PNG", "PNG ኣውጽእ");
  add("Undo", "Назад", "Назад", "Deshacer", "تراجع", "واپس", "Subiza", "መለስ");
  add("Redo", "Вперед", "Вперёд", "Rehacer", "إعادة", "دوباره", "Ongera", "ደጊም");
  add("Cut", "Вирізати", "Вырезать", "Cortar", "قص", "ببر", "Kata", "ቑረጽ");
  add("Copy", "Копіювати", "Копировать", "Copiar", "انسخ", "کاپی", "Kopa", "ቅዳሕ");
  add("Paste", "Вставити", "Вставить", "Pegar", "الصق", "بچسبان", "Omeka", "ለጥፍ");
  add("Duplicate", "Дублювати", "Дублировать", "Duplicar", "كرّر", "دوبل", "Kopa", "ድጋም");
  add("Delete", "Видалити", "Удалить", "Borrar", "احذف", "حذف", "Siba", "ደምስስ");
  add("Select all", "Вибрати все", "Выбрать всё", "Elegir todo", "حدد الكل", "همه را بگیر", "Hitamo byose", "ኩሉ ምረጽ");
  add("Group", "Група", "Группа", "Grupo", "مجموعة", "گروپ", "Itsinda", "ጉጅለ");
  add("Ungroup", "Розгрупувати", "Разгруппировать", "Desagrupar", "فك المجموعة", "گروپ خلاص", "Tangira itsinda", "ጉጅለ ፍታ");
  add("Flip horizontal", "Віддзеркалити ↔", "Отразить ↔", "Voltear ↔", "اقلب ↔", "وارونه ↔", "Hindukira ↔", "ገልባጥ ↔");
  add("Flip vertical", "Віддзеркалити ↕", "Отразить ↕", "Voltear ↕", "اقلب ↕", "وارونه ↕", "Hindukira ↕", "ገልባጥ ↕");
  add("Raise", "Вище", "Выше", "Subir", "ارفع", "بلند", "Zamura", "ልዕል");
  add("Lower", "Нижче", "Ниже", "Bajar", "أنزل", "پایین", "Manuka", "አውርድ");
  add("To front", "Наперед", "На перед", "Al frente", "للأمام", "پیش", "Imbere", "ቅድሚት");
  add("To back", "Назад", "Назад", "Al fondo", "للخلف", "عقب", "Inyuma", "ድሕሪት");
  add("Union", "Об'єднати", "Объединить", "Unir", "ادمج", "یکجا", "Huza", "ሓወስ");
  add("Difference", "Різниця", "Разность", "Diferencia", "فرق", "فرق", "Itandukaniro", "ፍልልይ");
  add("Intersection", "Перетин", "Пересечение", "Intersección", "تقاطع", "تقاطع", "Ahantu bahuriye", "መስቀለኛ");
  add("Exclusion", "Виключення", "Исключение", "Exclusión", "استثناء", "بجز", "Kurandura", "ምውጻእ");
  add("Division", "Поділ", "Деление", "División", "تقسيم", "تقسیم", "Gutandukanya", "ምክፋል");
  add("Combine", "З'єднати", "Соединить", "Combinar", "اجمع", "یکجا کن", "Huza", "ኣሐዋስ");
  add("Break apart", "Роз'єднати", "Разъединить", "Separar", "افصل", "جدا کن", "Tandukanya", "ኣፍልጥ");
  add("Close", "Замкнути", "Замкнуть", "Cerrar", "أغلق", "ببند", "Funga", "ዕጸው");
  add("Outset…", "Назовні…", "Наружу…", "Hacia afuera…", "للخارج…", "بیرون…", "Hanze…", "ወጻኢ…");
  add("Inset…", "Всередину…", "Внутрь…", "Hacia adentro…", "للداخل…", "درون…", "Imbere…", "ውሽጢ…");
  add("Stroke to path", "Обведення в контур", "Обводку в контур", "Trazo a camino", "الحد إلى مسار", "خط به مسیر", "Umurongo ube inzira", "መስመር ናብ መንገዲ");
  add("Simplify", "Спростити", "Упростить", "Simplificar", "بسّط", "ساده کن", "Yoroshya", "ኣቃልል");
  add("Reverse", "Навпаки", "Наоборот", "Invertir", "اعكس", "برعکس", "Hindukiza", "ግልባጥ");
  add("Join ends", "З'єднати кінці", "Соединить концы", "Unir extremos", "صل الطرفين", "سرها را وصل کن", "Huza impera", "ዳርቲ ሓወስ");
  add("Break at node", "Розірвати у вузлі", "Разорвать в узле", "Cortar en el nodo", "اقطع عند العقدة", "در گره ببر", "Kata ku dupfu", "ኣብ ኣንጓ ቑረጽ");
  add("Text to path", "Текст у контур", "Текст в контур", "Texto a trazo", "النص إلى مسار", "متن به خط", "Inyandiko ibe inzira", "ጽሑፍ ናብ መንገዲ");
  add("Put on path", "На контур", "На контур", "Poner en el trazo", "ضع على المسار", "روی خط بگذار", "Shyira ku nzira", "ኣብ መንገዲ ኣቕምጥ");
  add("Take off path", "Зняти з контуру", "Снять с контура", "Quitar del trazo", "أزل من المسار", "از خط بردار", "Kura ku nzira", "ካብ መንገዲ ኣልዕል");
  add("Zoom in", "Ближче", "Ближе", "Acercar", "قرّب", "نزدیک", "Egera", "ቀረብ");
  add("Zoom out", "Далі", "Дальше", "Alejar", "بعّد", "دور", "Iraguye", "ርሕቅ");
  add("Fit page", "На всю сторінку", "На всю страницу", "Ajustar página", "ملاءمة الصفحة", "صفحه را جور کن", "Shyira paji", "ገጽ ኣመጣጥ");
  add("Fit selection", "На вибір", "На выбор", "Ajustar selección", "ملاءمة التحديد", "انتخاب را جور کن", "Shyira ibyo wahisemo", "ዝተመርጸ ኣመጣጥ");
  add("Grid", "Сітка", "Сетка", "Cuadrícula", "شبكة", "جال", "Urusobetso", "መርበብ");
  add("Snap", "Прилипання", "Прилипание", "Imán", "التقاط", "چسپ", "Kwiyegeranya", "ምጥባቕ");
  add("Snap on", "Прилипання увімкнено", "Прилипание включено", "Imán activo", "الالتقاط يعمل", "چسپ روشن", "Kwiyegeranya gukora", "ምጥባቕ በሪሁ");
  add("Snap off", "Прилипання вимкнено", "Прилипание выключено", "Imán apagado", "الالتقاط متوقف", "چسپ خاموش", "Kwiyegeranya gihagaritswe", "ምጥባቕ ጠፊኡ");
  add("Saved", "Збережено", "Сохранено", "Guardado", "تم الحفظ", "ثبت شد", "Byabitswe", "ተዓቂቡ");
  add("Style", "Стиль", "Стиль", "Estilo", "نمط", "سبک", "Imiterere", "ቅዲ");
  add("selected", "вибрано", "выбрано", "elegidos", "محدد", "انتخاب", "byatoranyijwe", "ተመሪጹ");
  add("Fill", "Заливка", "Заливка", "Relleno", "تعبئة", "پُر", "Uzuza", "ምምላእ");
  add("Stroke", "Обведення", "Обводка", "Trazo", "حد", "خط", "Umurongo", "መስመር");
  add("None", "Немає", "Нет", "Ninguno", "لا شيء", "هیچ", "Nta na kimwe", "የለን");
  add("Width", "Товщина", "Толщина", "Ancho", "عرض", "پراخوالی", "Ubugari", "ሓጺን");
  add("Opacity", "Прозорість", "Прозрачность", "Opacidad", "شفافية", "روشنایی", "Ubunyereri", "ግልጽነት");
  add("Dash", "Пунктир", "Пунктир", "Guiones", "شرطة", "خط‌خط", "Utudomo", "ነጥቢ");
  add("Solid", "Суцільна", "Сплошная", "Continua", "متصل", "پوره", "Ihuze", "ምሉእ");
  add("Dots", "Крапки", "Точки", "Puntos", "نقاط", "نقطه", "Utudomo", "ነጥብታት");
  add("Arrange", "Розклад", "Расклад", "Ordenar", "ترتيب", "ترتیب", "Tegura", "ኣሰናድእ");
  add("Left", "Ліворуч", "Слева", "Izquierda", "يسار", "چپ", "Ibumoso", "ጸጋም");
  add("Center", "Центр", "Центр", "Centro", "وسط", "مرکز", "Hagati", "ማእከል");
  add("Right", "Праворуч", "Справа", "Derecha", "يمين", "راست", "Iburyo", "የማን");
  add("Top", "Верх", "Верх", "Arriba", "أعلى", "بالا", "Hejuru", "ላዕሊ");
  add("Middle", "Середина", "Середина", "Medio", "منتصف", "میان", "Hagati", "ማእከል");
  add("Bottom", "Низ", "Низ", "Abajo", "أسفل", "پایین", "Hasi", "ታሕቲ");
  add("To left", "До лівого", "К левому", "A la izquierda", "إلى اليسار", "به چپ", "Ku bumoso", "ናብ ጸጋም");
  add("To center", "До центру", "К центру", "Al centro", "إلى الوسط", "به مرکز", "Hagati", "ናብ ማእከል");
  add("To right", "До правого", "К правому", "A la derecha", "إلى اليمين", "به راست", "Ku buryo", "ናብ የማን");
  add("Space out ↔", "Розійтись ↔", "Разнести ↔", "Espaciar ↔", "باعد ↔", "فاصله ↔", "Tandukanya ↔", "ኣርሕቕ ↔");
  add("Space out ↕", "Розійтись ↕", "Разнести ↕", "Espaciar ↕", "باعد ↕", "فاصله ↕", "Tandukanya ↕", "ኣርሕቕ ↕");
  add("Page", "Сторінка", "Страница", "Página", "صفحة", "صفحه", "Paji", "ገጽ");
  add("Snap to grid, nodes, guides", "Липнути до сітки, вузлів і напрямних", "Липнуть к сетке, узлам и направляющим", "Imán a la cuadrícula, nodos y guías", "التقط الشبكة والعقد والأدلة", "به جال، گره و خط بچسپ", "Geranira urusobetso, udupfu n'abayobozi", "ናብ መርበብ፡ ኣንጓን መምርሒን ጠባቕ");
  add("Layers", "Шари", "Слои", "Capas", "طبقات", "لایه‌ها", "Ibipapuro", "ደርብታት");
  add("Hide layer", "Сховати шар", "Скрыть слой", "Ocultar capa", "أخفِ الطبقة", "لایه را پنهان کن", "Hisha urupapuro", "ደርቢ ሕባእ");
  add("Show layer", "Показати шар", "Показать слой", "Mostrar capa", "أظهر الطبقة", "لایه را نشان بده", "Erekana urupapuro", "ደርቢ ኣርኢ");
  add("Lock layer", "Замкнути шар", "Закрыть слой", "Bloquear capa", "اقفل الطبقة", "لایه را قفل کن", "Funga urupapuro", "ደርቢ ዕጸው");
  add("Unlock layer", "Відімкнути шар", "Открыть слой", "Desbloquear capa", "افتح الطبقة", "لایه را باز کن", "Fungura urupapuro", "ደርቢ ክፈት");
  add("Raise layer", "Підняти шар", "Поднять слой", "Subir capa", "ارفع الطبقة", "لایه را بلند کن", "Zamura urupapuro", "ደርቢ ልዕል");
  add("Add layer", "Додати шар", "Добавить слой", "Añadir capa", "أضف طبقة", "لایه بیفزا", "Ongeraho urupapuro", "ደርቢ ወስኽ");
  add("Objects", "Об'єкти", "Объекты", "Objetos", "عناصر", "چیزها", "Ibintu", "ነገራት");
  add("Nothing on this layer.", "На цьому шарі порожньо.", "На этом слое пусто.", "Nada en esta capa.", "لا شيء في هذه الطبقة.", "در این لایه هیچ نیست.", "Nta kintu kuri uru rupapuro.", "ኣብዚ ደርቢ ነገር የለን።");
  add("Path data", "Дані контуру", "Данные контура", "Datos del trazo", "بيانات المسار", "دیتای خط", "Amakuru y'inzira", "ዳታ መንገዲ");
  add("Document name", "Назва документа", "Имя документа", "Nombre del documento", "اسم المستند", "نام سند", "Izina rya dosiye", "ስም ሰነድ");
  add("Cancel", "Скасувати", "Отмена", "Cancelar", "إلغاء", "لغو", "Hagarika", "ሰርዝ");
  add("OK", "Гаразд", "ОК", "OK", "حسنًا", "باشه", "Yego", "ሕራይ");
  add("Replace", "Замінити", "Заменить", "Reemplazar", "استبدال", "عوض کن", "Simbuza", "ተክእ");
  add("Replace the drawing on this page?", "Замінити малюнок на цій сторінці?", "Заменить рисунок на этой странице?", "¿Reemplazar el dibujo de esta página?", "هل تستبدل رسم هذه الصفحة؟", "نقاشی این صفحه عوض شود؟", "Gusimbuza iri shusho kuri iyi paji?", "ነዚ ስእሊ ኣብዚ ገጽ ተክእ?");
  add("Vector", "Вектор", "Вектор", "Vectores", "فيكتور", "وکتور", "Vekiteri", "ቬክተር");
  add("Paint", "Фарба", "Краска", "Pintura", "رسم", "رنگ", "Irangi", "ሕብሪ");
  add("Blank page", "Порожня сторінка", "Пустая страница", "Página en blanco", "صفحة فارغة", "صفحه خالی", "Paji y'ubusa", "ባዶ ገጽ");
  add("Pen, a shape, or drop an SVG.", "Перо, фігура або кинь SVG.", "Перо, фигура или брось SVG.", "Pluma, una forma o suelta un SVG.", "قلم أو شكل أو أفلت SVG.", "قلم، شکل، یا SVG را رها کن.", "Ikinyuguti, imisusire, cyangwa SVG.", "ብርዒ፡ ቅርጺ፡ ወይ SVG ጠውቕ።");
  add("Draw a robot face. Tap Save when done.", "Намалюй обличчя робота. Потім торкнись Зберегти.", "Нарисуй лицо робота. Потом нажми Сохранить.", "Dibuja una cara de robot. Luego toca Guardar.", "ارسم وجه روبوت. ثم المس احفظ.", "روی ربات را بکش. بعد ثبت را بزن.", "Shushanya isura ya roboti. Hanyuma kanda Bika.", "ገጽ ሮቦት ስኣል። ምስ ወዳእካ ዕቅብ ጠውቕ።");
  add("Pick Vector for shapes or Paint for brushes.", "Вектор — для фігур. Фарба — для пензлів.", "Вектор — для фигур. Краска — для кистей.", "La pluma hace formas. El pincel pinta.", "فيكتور للأشكال. الرسم للفرش.", "وکتور برای شکل. رنگ برای برس.", "Imisusire ni vekiteri. Uburoshi ni irangi.", "ቬክተር ንቅርጺ። ሕብሪ ንብሩሽ።");
  add("The pen tool bends clean shapes. The brush lays color you can push around. The menu takes you home, shows the news, and opens your choices. Students tap once and start drawing.", "Перо гне рівні фігури. Пензель кладе колір, який можна розтерти. Меню веде на головну, показує новини й відкриває вибір. Учні торкаються раз і починають малювати.", "Перо гнёт ровные фигуры. Кисть кладёт цвет, который можно размазать. Меню ведёт на главную, показывает новости и открывает выбор. Ученики касаются раз и начинают рисовать.", "La pluma dobla formas limpias. El pincel pone color que puedes empujar. El menú vuelve al inicio, muestra novedades y abre tus ajustes. El alumnado toca una vez y empieza a dibujar.", "القلم يحني أشكالاً نظيفة. الفرشاة تضع لوناً تستطيع تحريكه. القائمة تعيدك للرئيسية وتعرض الجديد وتفتح إعداداتك. الطلاب يلمسون مرة ويبدأون الرسم.", "قلم شکل‌های صاف را خم می‌کند. برس رنگی می‌گذارد که می‌توانی بکشانی. فهرست تو را خانه می‌برد، تازه‌ها را نشان می‌دهد و تنظیمات را باز می‌کند. شاگردان یک بار می‌زنند و کشیدن را شروع می‌کنند.", "Ikinyuguti kigonda imisusire isukuye. Uburoshi bushyira ibara ushyira ahandi. Menyu igarura ahabanza, yereka ibishya, ikingura igenamiterere. Abanyeshuri bakanda rimwe batangira gushushanya.", "ብርዒ ጽሩይ ቅርጺ የዕምዕ። ብሩሽ ሕብሪ ዘተንቀሳቐስ የንብር። ዝርዝር ናብ መበገሲ ይመልስ፡ ሓድሽ የርኢ፡ ቅጥዕታት ይኸፍት። ተመሃሮ ሓንሳእ ይጠውቑ ስእሊ የጅምሩ።");
  add("Home", "Головна", "Главная", "Inicio", "الرئيسية", "خانه", "Ahabanza", "መበገሲ");
  add("Help", "Допомога", "Помощь", "Ayuda", "مساعدة", "کمک", "Ubufasha", "ሓገዝ");
  add("What's new", "Що нового", "Что нового", "Novedades", "ما الجديد", "تازه‌ها", "Ibishya", "እንታይ ሓድሽ ኣሎ");
  add("My settings", "Мої налаштування", "Мои настройки", "Mis ajustes", "إعداداتي", "تنظیمات من", "Igenamiterere ryanjye", "ናተይ ቅጥዕታት");
  add("Menu", "Меню", "Меню", "Menú", "القائمة", "فهرست", "Menyu", "ዝርዝር");
  add("Close menu", "Закрити меню", "Закрыть меню", "Cerrar menú", "أغلق القائمة", "فهرست را ببند", "Funga menyu", "ዝርዝር ዕጸው");
  add("One Menu at the top left, Home is easy to reach, and Drawin' is in your language.", "Одне меню зліва вгорі. Головну легко натиснути. Drawin' — вашою мовою.", "Одно меню слева вверху. Главную легко нажать. Drawin' — на вашем языке.", "Un menú arriba a la izquierda. Inicio es fácil de tocar. Drawin' está en tu idioma.", "قائمة واحدة في أعلى اليسار. الرئيسية سهلة الوصول. Drawin' بلغتك.", "یک فهرست در بالا چپ. خانه آسان است. Drawin' به زبان شماست.", "Menyu imwe hejuru ibumoso. Ahabanza iroroshye. Drawin' iri mu rurimi rwawe.", "ሓንቲ ዝርዝር ኣብ ላዕሊ ጸጋም። መበገሲ ቀሊል እዩ። Drawin' ብቋንቋኻ እዩ።");
  add("Drawin' tools have names in your language.", "Інструменти Drawin' мають назви твоєю мовою.", "Инструменты Drawin' названы на твоём языке.", "Las herramientas de Drawin' tienen nombre en tu idioma.", "أدوات Drawin' لها أسماء بلغتك.", "ابزار Drawin' به زبان تو نام دارد.", "Ibikoresho bya Drawin' bifite amazina mu rurimi rwawe.", "መሳርሒ Drawin' ብቋንቋኻ ስም ኣለዎ።");
  add("1. Pick a brush.", "1. Обери пензель.", "1. Выбери кисть.", "1. Elige un pincel.", "1. اختر فرشاة.", "1. یک برس بگیر.", "1. Hitamo uburoshi.", "1. ብሩሽ ምረጽ።");
  add("2. Draw on the page.", "2. Малюй на сторінці.", "2. Рисуй на странице.", "2. Dibuja en la página.", "2. ارسم على الصفحة.", "2. روی صفحه بکش.", "2. Shushanya kuri paji.", "2. ኣብ ገጽ ስኣል።");
  add("3. Tap Save.", "3. Торкнись Зберегти.", "3. Нажми Сохранить.", "3. Toca Guardar.", "3. المس احفظ.", "3. ثبت را بزن.", "3. Kanda Bika.", "3. ዕቅብ ጠውቕ።");
  add("Ink", "Чорнило", "Чернила", "Tinta", "حبر", "سیاهی", "Iwino", "ቀለም");
  add("Paper", "Папір", "Бумага", "Papel", "ورق", "کاغذ", "Impapuro", "ወረቐት");
  add("Brass", "Латунь", "Латунь", "Latón", "نحاس", "برنج", "Umuringa", "ናሕስ");
  add("Rust", "Іржа", "Ржавчина", "Óxido", "صدأ", "زنگ", "Iryogi", "ዝገት");
  add("Pine", "Сосна", "Сосна", "Pino", "صنوبر", "کاج", "Pinusi", "ጽድ");
  add("Navy", "Темно-синій", "Тёмно-синий", "Azul marino", "كحلي", "سرمه‌ای", "Ubururu bujimye", "ሰማያዊ");
  add("Brick", "Цегла", "Кирпич", "Ladrillo", "طوب", "خشت", "Itafari", "ሕጺን");
  add("Sand", "Пісок", "Песок", "Arena", "رمل", "ریگ", "Umucanga", "ሑጻ");
  add("Brush", "Пензель", "Кисть", "Pincel", "فرشاة", "برس", "Uburoshi", "ብሩሽ");
  add("Paint Bucket", "Відро фарби", "Ведро краски", "Bote de pintura", "دلو الطلاء", "سطل رنگ", "Indobo y'irangi", "ባልዲ ሕብሪ");
  add("Shape", "Фігура", "Фигура", "Forma", "شكل", "شکل", "Imisusire", "ቅርጺ");
  add("Hand Tool", "Рука", "Рука", "Mano", "أداة اليد", "ابزار دست", "Ikiganza", "መሳርሒ ኢድ");
  add("Select Tool", "Вибір", "Выбор", "Selección", "أداة التحديد", "ابزار انتخاب", "Igikoresho cyo guhitamo", "መሳርሒ ምረጽ");
  add("More Tools", "Ще інструменти", "Ещё инструменты", "Más herramientas", "مزيد من الأدوات", "ابزار بیشتر", "Ibindi bikoresho", "ተወሳኺ መሳርሒ");
  add("Eraser", "Гумка", "Ластик", "Borrador", "ممحاة", "پاک‌کن", "Igisiba", "መደምሰሲ");
  add("Eyedropper", "Піпетка", "Пипетка", "Gotero", "قطارة", "قطره", "Gutora irangi", "መጥቃሲ ሕብሪ");
  add("Smudge", "Розмазування", "Размазывание", "Difuminar", "تلطيخ", "مالش", "Gusokora", "ምሕባእ");
  add("Fill", "Заливка", "Заливка", "Relleno", "تعبئة", "پُر", "Uzuza", "ምምላእ");
  add("Drag to move. Shift adds. Corner handles scale, the brass knob rotates. Alt-drag copies.", "Тягни, щоб рухати. Shift додає. Кути змінюють розмір, латунна ручка крутить.", "Тяни, чтобы двигать. Shift добавляет. Углы меняют размер, латунная ручка крутит.", "Arrastra para mover. Mayús añade. Las esquinas cambian el tamaño.", "اسحب للتحريك. Shift يضيف. الزوايا تغيّر الحجم.", "بکش تا حرکت کند. Shift اضافه می‌کند.", "Kurura kugira ngo bimeze. Shift yongeraho.", "ጐተት ንምንቅስቓስ። Shift የወስኽ።");
  add("Drag nodes and handles. Double-click a segment to add a node. Delete removes nodes.", "Тягни вузли. Подвійний клік додає вузол.", "Тяни узлы. Двойной щелчок добавляет узел.", "Arrastra nodos. Doble clic añade un nodo.", "اسحب العقد. النقر مرتين يضيف عقدة.", "گره‌ها را بکش. دو بار کلیک گره می‌افزاید.", "Kurura udupfu. Kanda kabiri wongereho.", "ኣንጓ ጐተት። ክልተ ጠውቂ ነጥቢ የወስኽ።");
  add("Click corners, drag curves. Click the start node to close. Enter finishes, Esc cancels.", "Клікай кути, тягни криві. Клік на старті замикає.", "Кликай углы, тяни кривые. Клик по старту замыкает.", "Haz clic en esquinas y arrastra curvas. Clic al inicio cierra.", "انقر الزوايا واسحب المنحنيات.", "گوشه‌ها را بزن، خم را بکش.", "Kanda inguni, kurura imirongo.", "ኩርናዕ ጠውቕ፡ ዑንኬል ጐተት።");
  add("Draw freehand. The line simplifies into curves when you let go.", "Малюй вільно. Лінія стане кривими.", "Рисуй свободно. Линия станет кривыми.", "Dibuja a mano. La línea se vuelve curvas.", "ارسم بحرية. الخط يصير منحنيات.", "آزاد بکش. خط خم می‌شود.", "Shushanya ubusa. Umurongo uba imirongo.", "ብነጻ ስኣል። መስመር ናብ ዑንኬል ይቕየር።");
  add("Drag a rectangle. Shift locks a square. Alt grows from the center.", "Тягни прямокутник. Shift робить квадрат.", "Тяни прямоугольник. Shift делает квадрат.", "Arrastra un rectángulo. Mayús lo hace cuadrado.", "اسحب مستطيلاً. Shift يجعله مربعاً.", "مستطیل را بکش. Shift مربع می‌سازد.", "Kurura urukiramende. Shift rukora kare.", "ርብዒ ጐተት። Shift ትርብዒ ይገብሮ።");
  add("Drag an ellipse. Shift locks a circle. Alt grows from the center.", "Тягни еліпс. Shift робить коло.", "Тяни эллипс. Shift делает круг.", "Arrastra una elipse. Mayús la hace círculo.", "اسحب بيضاوياً. Shift يجعله دائرة.", "بیضوي را بکش. Shift دایره می‌سازد.", "Kurura uruziga. Shift rukora uruziga.", "ክቢ ጐተት። Shift ዓንኬል ይገብሮ።");
  add("Drag a polygon. Change sides in the panel.", "Тягни багатокутник. Кількість сторін у панелі.", "Тяни многоугольник. Число сторон в панели.", "Arrastra un polígono. Los lados están en el panel.", "اسحب مضلعاً. الأضلاع في اللوحة.", "چندضلعی را بکش. ضلع‌ها در پنل است.", "Kurura uruhinga. Impande ziri mu mbonerahamwe.", "ዝተዓጽፈ ጐተት። ገጽታት ኣብ ፓነል።");
  add("Drag a star. Points and inner radius are in the panel.", "Тягни зірку. Промені в панелі.", "Тяни звезду. Лучи в панели.", "Arrastra una estrella. Las puntas están en el panel.", "اسحب نجمة. الأطراف في اللوحة.", "ستاره را بکش. نوک‌ها در پنل است.", "Kurura inyenyeri. Impine ziri mu mbonerahamwe.", "ኮኸብ ጐተት። ንኡስ ኣብ ፓነል።");
  add("Drag a spiral from the center.", "Тягни спіраль від центру.", "Тяни спираль от центра.", "Arrastra una espiral desde el centro.", "اسحب حلزوناً من الوسط.", "مارپیچ را از مرکز بکش.", "Kurura uruziga uva hagati.", "ሽኮር ካብ ማእከል ጐተት።");
  add("Click to place text, then edit it in the panel.", "Клікни, щоб поставити текст. Прав у панелі.", "Кликни, чтобы поставить текст. Правь в панели.", "Haz clic para poner texto y edítalo en el panel.", "انقر لوضع النص ثم عدّله في اللوحة.", "برای متن کلیک کن، بعد در پنل درست کن.", "Kanda ushyire inyandiko, uhindure mu mbonerahamwe.", "ጽሑፍ ንምቕማጥ ጠውቕ፡ ኣብ ፓነል ኣርም።");
  add("Click to zoom in. Alt-click zooms out. The wheel always zooms toward the cursor.", "Клік наближає. Alt віддаляє.", "Клик приближает. Alt отдаляет.", "Clic acerca. Alt aleja.", "النقر يقرّب. Alt يبعّد.", "کلیک نزدیک می‌کند. Alt دور می‌کند.", "Kanda wegere. Alt iragura.", "ጠውቂ የቀርብ። Alt የርሕቕ።");
  add("Drag to pan. Space-drag pans from any tool.", "Тягни, щоб рухати аркуш. Пробіл теж.", "Тяни, чтобы двигать лист. Пробел тоже.", "Arrastra para mover la hoja. Espacio también.", "اسحب لتحريك الورقة. المسافة أيضاً.", "بکش تا صفحه حرکت کند.", "Kurura kugira ngo paji yimuke.", "ገጽ ንምንቅስቓስ ጐተት።");
  add("Select a path, then drag the brass stop to aim the gradient.", "Вибери контур і потягни латунну мітку градієнта.", "Выбери контур и потяни латунную метку градиента.", "Elige un trazo y arrastra la marca de latón.", "حدد مساراً ثم اسحب العلامة النحاسية.", "یک خط بگیر و نشانه برنجی را بکش.", "Hitamo inzira, ukurure ikimenyetso.", "መንገዲ ምረጽ፡ ነቲ ናሕስ ጐተት።");
  add("Click any fill to pick it up.", "Клікни заливку, щоб узяти колір.", "Кликни заливку, чтобы взять цвет.", "Haz clic en un relleno para tomar el color.", "انقر تعبئة لتأخذ اللون.", "روی پُر کلیک کن تا رنگ را بگیری.", "Kanda uzuza ujye irangi.", "ምምላእ ጠውቕ ሕብሪ ክትወስድ።");
  add("Cap", "Кінець", "Конец", "Punta", "طرف", "سر", "Impine", "ጫፍ");
  add("Butt", "Плаский", "Плоский", "Plano", "مسطح", "هموار", "Kare", "ለምሊ");
  add("Round", "Круглий", "Круглый", "Redondo", "دائري", "گرد", "Uruziga", "ክቢ");
  add("Square", "Квадрат", "Квадрат", "Cuadrado", "مربع", "مربع", "Kare", "ትርብዒ");
  add("Join", "Стик", "Стык", "Unión", "وصلة", "وصل", "Ihuza", "ምትእስሳር");
  add("Miter", "Гострий", "Острый", "Punta", "حاد", "تیز", "Icyatsi", "ሓሪ");
  add("Bevel", "Скіс", "Скос", "Bisel", "مشطوف", "مایل", "Ishyushyu", "ተንበር");
  add("Size", "Розмір", "Размер", "Tamaño", "حجم", "اندازه", "Ingano", "መጠን");
  add("Align", "Вирівняти", "Выровнять", "Alinear", "محاذاة", "برابر", "Kunganya", "ኣመጣጥ");
  add("Sides", "Сторони", "Стороны", "Lados", "أضلاع", "ضلع‌ها", "Impande", "ገጽታት");
  add("Inner", "Всередині", "Внутри", "Interior", "داخلي", "درون", "Imbere", "ውሽጢ");
  add("Turns", "Витки", "Витки", "Vueltas", "لفات", "چرخه‌ها", "Ihuriro", "ዙሪያ");
  add("Corner", "Кут", "Угол", "Esquina", "زاوية", "گوشه", "Iguni", "ኩርናዕ");
  add("Smooth", "Гладко", "Гладко", "Suave", "ناعم", "نرم", "Byoroshye", "ልስሉስ");
  add("Symmetric", "Симетрично", "Симметрично", "Simétrico", "متماثل", "برابر", "Kimwe", "ምዕራፍ");
  add("Page size", "Розмір сторінки", "Размер страницы", "Tamaño de página", "حجم الصفحة", "اندازه صفحه", "Ingano ya paji", "መጠን ገጽ");
  add("Outset", "Назовні", "Наружу", "Hacia afuera", "للخارج", "بیرون", "Hanze", "ወጻኢ");
  add("Inset", "Всередину", "Внутрь", "Hacia adentro", "للداخل", "درون", "Imbere", "ውሽጢ");
  add("Distance", "Відстань", "Расстояние", "Distancia", "مسافة", "فاصله", "Intera", "ርሕቀት");
  add("Height", "Висота", "Высота", "Alto", "ارتفاع", "بلندی", "Uburebure", "ቁመት");
  add("Create", "Створити", "Создать", "Crear", "أنشئ", "بساز", "Kora", "ፍጠር");
  add("Select an open path.", "Вибери відкритий контур.", "Выбери открытый контур.", "Elige un trazo abierto.", "حدد مساراً مفتوحاً.", "یک خط باز را بگیر.", "Hitamo inzira ifunguye.", "ክፉት መንገዲ ምረጽ።");
  add("Select a path.", "Вибери контур.", "Выбери контур.", "Elige un trazo.", "حدد مساراً.", "یک خط را بگیر.", "Hitamo inzira.", "መንገዲ ምረጽ።");

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
      var fromQ = new URLSearchParams(location.search).get("lang") || "";
      if (fromQ) code = fromQ;
      else if (root.KulibertPrefs && root.KulibertPrefs.lang) code = root.KulibertPrefs.lang;
      else code = document.documentElement.getAttribute("data-kp-lang") || "en";
    } catch (e2) { code = "en"; }
    if (!code || code === "simple" || code === "en" || !PACK[code]) return "en";
    return code;
  }
  function tx(s) {
    var text = s == null ? "" : String(s);
    if (!text) return text;
    var table = PACK[lang()];
    if (table && table[text]) return table[text];
    return text;
  }
  function paintChooser() {
    var blurb = document.getElementById("ds-blurb");
    if (blurb) blurb.textContent = tx("Pick Vector for shapes or Paint for brushes.");
    var more = document.getElementById("ds-more");
    if (more) more.textContent = tx("The pen tool bends clean shapes. The brush lays color you can push around. The menu takes you home, shows the news, and opens your choices. Students tap once and start drawing.");
    var news = document.getElementById("ds-news");
    if (news) news.textContent = tx("One Menu at the top left, Home is easy to reach, and Drawin' is in your language.");
    var vector = document.getElementById("pick-vector");
    var paint = document.getElementById("pick-paint");
    function label(btn, word) {
      if (!btn) return;
      var wordEl = btn.querySelector(".tool-word");
      if (wordEl) { wordEl.textContent = word; return; }
      var nodes = btn.childNodes;
      for (var i = nodes.length - 1; i >= 0; i--) {
        if (nodes[i].nodeType === 3 && nodes[i].textContent.trim()) {
          nodes[i].textContent = word;
          return;
        }
      }
    }
    label(vector, tx("Vector"));
    label(paint, tx("Paint"));
    var prompt = document.getElementById("ds-prompt");
    if (prompt && !document.body.classList.contains("is-studio")) {
      /* door copy only */
    }
  }
  root.DrawinTx = tx;
  root.DrawinLang = lang;
  root.DrawinPaintChooser = paintChooser;
  root.DRAWIN_I18N = PACK;
  root.addEventListener("kulibert-lang", function () { paintChooser(); });
})(window);
