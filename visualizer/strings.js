/* Visualizer words. English is the fallback. Note names stay English.
   fa-AF is Dari, not Iranian Persian.
   NEEDS NATIVE CHECK: every fa-AF, rw, and ti line. */
(function (root) {
  var EN = {
    menu: "Menu", whatsNew: "What's new",
    whats: "Visualizer speaks your Hub language. Menu is top-left.",
    score: "Score", beats: "Beats", lights: "Lights", band: "Band",
    play: "Play", pause: "Pause", stop: "Stop",
    soundOn: "Sound on", muted: "Muted",
    how: "How", learn: "Learn", look: "Look", color: "Color", layers: "Layers",
    wall: "Wall", frame: "Frame", try: "Try", crazy: "Crazy", beat: "Beat",
    sliders: "Sliders", more: "More", less: "Less",
    device: "Use this device's sound", library: "Use the library", importBeat: "Import a beat",
    rgb: "RGB cycle", reset: "Reset gizmos", teacher: "Teacher",
    howTitle: "How it works",
    help1: "The lesson lights Play, the word, or the color dots. The button says Got it when that step is done.",
    help2: "Pick a Look. Keys 1\u20135 are the first five. Keys 6\u20139 and 0 are the new ones.",
    help3: "Press Play. The picture follows your song from Music. Sound can stay off.",
    help4: "No song yet? Make one in Music. Come back. The same beats drive the lights.",
    nowIdle: "Press Play. Read the word. Sound can stay off.",
    noSong: "No song yet. Make one in Music. The picture will use it.",
    thisIs: "This is", pressFollow: "Press Play. The picture follows the beats.",
    now: "Now", rest: "Rest. The lights still move.", soundOff: "Sound is off.",
    deviceNow: "Now: this device.", deviceOff: "Sound is off. Now: this device.",
    lesson: "Lesson", of: "of", iDid: "I did this", skip: "Skip", done: "Done", gotIt: "Got it.",
    les1t: "See the beat", les1b: "Press Play. The picture moves with the beat. Sound can stay off. You still read the word.", les1m: "Press Play.",
    les2t: "The word", les2b: "Read the word under Play. When it names Kick, Snare, Hat, or a note, that sound is happening now.", les2m: "Keep Play on until the word names a sound.",
    les3t: "Color is not the music", les3b: "Tap a different color dot. The picture changes. The beat does not. The music is the beat and the notes.", les3m: "Tap a color dot that is not already on.",
    les4t: "One song", les4b: "Beats is the drums and the count. Score is the notes on the staff. This door only shows the song.",
    foot: "Sound can stay off. These lights move anyway. Same song in BertyBeatz.",
    own: "own door", shared: "shared lights"
  };
  var UK = {
    menu: "Меню", whatsNew: "Що нового",
    whats: "Visualizer говорить мовою Хаба. Меню зліва зверху.",
    score: "Ноти", beats: "Біти", lights: "Світло", band: "Гурт",
    play: "Грати", pause: "Пауза", stop: "Стоп",
    soundOn: "Звук є", muted: "Без звуку",
    how: "Як", learn: "Вчитись", look: "Вигляд", color: "Колір", layers: "Шари",
    wall: "Стіна", frame: "Рамка", try: "Спробуй", crazy: "Шалено", beat: "Біт",
    sliders: "Повзунки", more: "Більше", less: "Менше",
    device: "Звук цього пристрою", library: "Бібліотека", importBeat: "Ввезти біт",
    rgb: "Цикл RGB", reset: "Скинути повзунки", teacher: "Учитель",
    howTitle: "Як це працює",
    help1: "Урок підсвічує Грати, слово або кольорові крапки. Кнопка каже Вийшло, коли крок готовий.",
    help2: "Обери Вигляд. Клавіші 1\u20135 \u2014 перші п\u2019ять. 6\u20139 і 0 \u2014 нові.",
    help3: "Натисни Грати. Картинка йде за піснею з Музики. Звук може бути вимкнений.",
    help4: "Ще немає пісні? Зроби її в Музиці. Повернись. Ті самі біти рухають світло.",
    nowIdle: "Натисни Грати. Читай слово. Звук може бути вимкнений.",
    noSong: "Ще немає пісні. Зроби її в Музиці. Картинка візьме її.",
    thisIs: "Це", pressFollow: "Натисни Грати. Картинка йде за бітами.",
    now: "Зараз", rest: "Тиша. Світло далі рухається.", soundOff: "Звук вимкнено.",
    deviceNow: "Зараз: цей пристрій.", deviceOff: "Звук вимкнено. Зараз: цей пристрій.",
    lesson: "Урок", of: "з", iDid: "Я це зробив", skip: "Пропустити", done: "Готово", gotIt: "Вийшло.",
    les1t: "Побач біт", les1b: "Натисни Грати. Картинка рухається з бітом. Звук може бути вимкнений. Слово все одно читай.", les1m: "Натисни Грати.",
    les2t: "Слово", les2b: "Читай слово під Грати. Коли воно називає Kick, Snare, Hat чи ноту, цей звук зараз.", les2m: "Нехай Грати лишається, поки слово не назве звук.",
    les3t: "Колір \u2014 не музика", les3b: "Торкнись іншої кольорової крапки. Картинка зміниться. Біт \u2014 ні. Музика \u2014 це біт і ноти.", les3m: "Торкнись крапки, яка ще не увімкнена.",
    les4t: "Одна пісня", les4b: "Біти \u2014 це барабани й рахунок. Ноти \u2014 це ноти на стані. Ці двері лише показують пісню.",
    foot: "Звук може бути вимкнений. Світло все одно рухається. Та сама пісня в BertyBeatz.",
    own: "свої двері", shared: "спільне світло"
  };
  var RU = {
    menu: "Меню", whatsNew: "Что нового",
    whats: "Visualizer говорит на языке Хаба. Меню слева сверху.",
    score: "Ноты", beats: "Биты", lights: "Свет", band: "Группа",
    play: "Играть", pause: "Пауза", stop: "Стоп",
    soundOn: "Звук есть", muted: "Без звука",
    how: "Как", learn: "Учить", look: "Вид", color: "Цвет", layers: "Слои",
    wall: "Стена", frame: "Рамка", try: "Пробуй", crazy: "Бурно", beat: "Бит",
    sliders: "Ползунки", more: "Ещё", less: "Меньше",
    device: "Звук этого устройства", library: "Библиотека", importBeat: "Ввести бит",
    rgb: "Цикл RGB", reset: "Сбросить ползунки", teacher: "Учитель",
    howTitle: "Как это работает",
    help1: "Урок подсвечивает Играть, слово или цветные точки. Кнопка говорит Готово, когда шаг сделан.",
    help2: "Выбери Вид. Клавиши 1\u20135 \u2014 первые пять. 6\u20139 и 0 \u2014 новые.",
    help3: "Нажми Играть. Картинка идёт за песней из Музыки. Звук можно не включать.",
    help4: "Ещё нет песни? Сделай её в Музыке. Вернись. Те же биты двигают свет.",
    nowIdle: "Нажми Играть. Читай слово. Звук можно не включать.",
    noSong: "Ещё нет песни. Сделай её в Музыке. Картинка возьмёт её.",
    thisIs: "Это", pressFollow: "Нажми Играть. Картинка идёт за битами.",
    now: "Сейчас", rest: "Тишина. Свет всё равно движется.", soundOff: "Звук выключен.",
    deviceNow: "Сейчас: это устройство.", deviceOff: "Звук выключен. Сейчас: это устройство.",
    lesson: "Урок", of: "из", iDid: "Я это сделал", skip: "Пропустить", done: "Готово", gotIt: "Готово.",
    les1t: "Увидь бит", les1b: "Нажми Играть. Картинка движется с битом. Звук можно не включать. Слово всё равно читай.", les1m: "Нажми Играть.",
    les2t: "Слово", les2b: "Читай слово под Играть. Когда оно называет Kick, Snare, Hat или ноту, этот звук сейчас.", les2m: "Оставь Играть, пока слово не назовёт звук.",
    les3t: "Цвет \u2014 не музыка", les3b: "Нажми другую цветную точку. Картинка меняется. Бит \u2014 нет. Музыка \u2014 это бит и ноты.", les3m: "Нажми точку, которая ещё не включена.",
    les4t: "Одна песня", les4b: "Биты \u2014 это барабаны и счёт. Ноты \u2014 это ноты на стане. Эта дверь только показывает песню.",
    foot: "Звук можно не включать. Свет всё равно движется. Та же песня в BertyBeatz.",
    own: "своя дверь", shared: "общий свет"
  };
  var ES = {
    menu: "Menú", whatsNew: "Qué hay de nuevo",
    whats: "Visualizer habla el idioma del Hub. El menú está arriba a la izquierda.",
    score: "Notas", beats: "Ritmos", lights: "Luces", band: "Banda",
    play: "Tocar", pause: "Pausa", stop: "Parar",
    soundOn: "Sonido", muted: "Sin sonido",
    how: "Cómo", learn: "Aprender", look: "Vista", color: "Color", layers: "Capas",
    wall: "Fondo", frame: "Marco", try: "Prueba", crazy: "Loco", beat: "Ritmo",
    sliders: "Controles", more: "Más", less: "Menos",
    device: "Usar el sonido de este aparato", library: "Usar la biblioteca", importBeat: "Traer un ritmo",
    rgb: "Ciclo RGB", reset: "Reiniciar controles", teacher: "Maestro",
    howTitle: "Cómo funciona",
    help1: "La lección ilumina Tocar, la palabra o los puntos de color. El botón dice Listo cuando el paso está hecho.",
    help2: "Elige una Vista. Las teclas 1\u20135 son las primeras cinco. 6\u20139 y 0 son las nuevas.",
    help3: "Pulsa Tocar. La imagen sigue tu canción de Música. El sonido puede quedar apagado.",
    help4: "¿Aún no hay canción? Haz una en Música. Vuelve. Los mismos ritmos mueven las luces.",
    nowIdle: "Pulsa Tocar. Lee la palabra. El sonido puede quedar apagado.",
    noSong: "Aún no hay canción. Haz una en Música. La imagen la usará.",
    thisIs: "Esto es", pressFollow: "Pulsa Tocar. La imagen sigue los ritmos.",
    now: "Ahora", rest: "Silencio. Las luces siguen moviéndose.", soundOff: "El sonido está apagado.",
    deviceNow: "Ahora: este aparato.", deviceOff: "El sonido está apagado. Ahora: este aparato.",
    lesson: "Lección", of: "de", iDid: "Ya lo hice", skip: "Saltar", done: "Listo", gotIt: "Listo.",
    les1t: "Mira el ritmo", les1b: "Pulsa Tocar. La imagen se mueve con el ritmo. El sonido puede quedar apagado. Igual lee la palabra.", les1m: "Pulsa Tocar.",
    les2t: "La palabra", les2b: "Lee la palabra bajo Tocar. Si nombra Kick, Snare, Hat o una nota, ese sonido está ahora.", les2m: "Deja Tocar hasta que la palabra nombre un sonido.",
    les3t: "El color no es la música", les3b: "Toca otro punto de color. La imagen cambia. El ritmo no. La música es el ritmo y las notas.", les3m: "Toca un punto de color que no esté ya encendido.",
    les4t: "Una canción", les4b: "Ritmos son los tambores y la cuenta. Notas son las notas en el pentagrama. Esta puerta solo muestra la canción.",
    foot: "El sonido puede quedar apagado. Estas luces se mueven igual. La misma canción está en BertyBeatz.",
    own: "puerta propia", shared: "luces compartidas"
  };
  var AR = {
    menu: "القائمة", whatsNew: "ما الجديد",
    whats: "Visualizer يتكلم لغة المركز. القائمة أعلى اليسار.",
    score: "نوتات", beats: "إيقاع", lights: "أضواء", band: "فرقة",
    play: "تشغيل", pause: "إيقاف", stop: "وقف",
    soundOn: "الصوت مفتوح", muted: "بلا صوت",
    how: "كيف", learn: "تعلم", look: "شكل", color: "لون", layers: "طبقات",
    wall: "خلفية", frame: "إطار", try: "جرب", crazy: "مجنون", beat: "إيقاع",
    sliders: "منزلقات", more: "المزيد", less: "أقل",
    device: "صوت هذا الجهاز", library: "المكتبة", importBeat: "أدخل إيقاعًا",
    rgb: "دورة RGB", reset: "أعد المنزلقات", teacher: "المعلم",
    howTitle: "كيف يعمل",
    help1: "الدرس يضيء تشغيل أو الكلمة أو نقاط اللون. الزر يقول تم عند انتهاء الخطوة.",
    help2: "اختر شكلًا. المفاتيح 1\u20135 هي الخمسة الأولى. 6\u20139 و 0 جديدة.",
    help3: "اضغط تشغيل. الصورة تتبع أغنيتك من الموسيقى. الصوت يمكن أن يبقى مغلقًا.",
    help4: "لا أغنية بعد؟ اصنع واحدة في الموسيقى. عد. نفس الإيقاع يحرك الأضواء.",
    nowIdle: "اضغط تشغيل. اقرأ الكلمة. الصوت يمكن أن يبقى مغلقًا.",
    noSong: "لا أغنية بعد. اصنع واحدة في الموسيقى. الصورة ستستخدمها.",
    thisIs: "هذه", pressFollow: "اضغط تشغيل. الصورة تتبع الإيقاع.",
    now: "الآن", rest: "سكون. الأضواء ما زالت تتحرك.", soundOff: "الصوت مغلق.",
    deviceNow: "الآن: هذا الجهاز.", deviceOff: "الصوت مغلق. الآن: هذا الجهاز.",
    lesson: "درس", of: "من", iDid: "فعلت هذا", skip: "تخطى", done: "تم", gotIt: "تم.",
    les1t: "انظر الإيقاع", les1b: "اضغط تشغيل. الصورة تتحرك مع الإيقاع. الصوت يمكن أن يبقى مغلقًا. اقرأ الكلمة كل حال.", les1m: "اضغط تشغيل.",
    les2t: "الكلمة", les2b: "اقرأ الكلمة تحت تشغيل. إذا سمت Kick أو Snare أو Hat أو نوتة، فهذا الصوت الآن.", les2m: "اترك تشغيل حتى تسمي الكلمة صوتًا.",
    les3t: "اللون ليس الموسيقى", les3b: "امس نقطة لون أخرى. الصورة تتغير. الإيقاع لا. الموسيقى هي الإيقاع والنوتات.", les3m: "امس نقطة لون ليست مضاءة.",
    les4t: "أغنية واحدة", les4b: "الإيقاع هو الطبول والعد. النوتات هي النوتات على المدرج. هذا الباب يعرض الأغنية فقط.",
    foot: "الصوت يمكن أن يبقى مغلقًا. هذه الأضواء تتحرك كل حال. نفس الأغنية في BertyBeatz.",
    own: "باب خاص", shared: "أضواء مشتركة"
  };
  var FA = {
    menu: "مینو", whatsNew: "چی نو است",
    whats: "Visualizer به زبان هاب حرف می‌زند. مینو بالا چپ است.",
    score: "نوت‌ها", beats: "ضرب", lights: "چراغ", band: "گروپ",
    play: "پخش", pause: "مکث", stop: "ایست",
    soundOn: "صدا روشن", muted: "بی‌صدا",
    how: "چطور", learn: "یاد بگیر", look: "نما", color: "رنگ", layers: "لایه",
    wall: "دیوار", frame: "چوکات", try: "امتحان", crazy: "شور", beat: "ضرب",
    sliders: "لغزنده", more: "بیشتر", less: "کمتر",
    device: "صدای این دستگاه", library: "کتابخانه", importBeat: "ضرب بیاور",
    rgb: "چرخه RGB", reset: "لغزنده را برگردان", teacher: "معلم",
    howTitle: "چطور کار می‌کند",
    help1: "درس پخش، کلمه یا نقطه رنگ را روشن می‌کند. دکمه وقتی قدم تمام شد شد می‌گوید.",
    help2: "یک نما بگیر. کلید 1\u20135 پنج تای اول است. 6\u20139 و 0 نو است.",
    help3: "پخش را بزن. تصویر آهنگ موسیقی را دنبال می‌کند. صدا می‌تواند خاموش بماند.",
    help4: "هنوز آهنگ نیست؟ در موسیقی بساز. برگرد. همان ضرب چراغ را می‌جنباند.",
    nowIdle: "پخش را بزن. کلمه را بخوان. صدا می‌تواند خاموش بماند.",
    noSong: "هنوز آهنگ نیست. در موسیقی بساز. تصویر از آن استفاده می‌کند.",
    thisIs: "این", pressFollow: "پخش را بزن. تصویر ضرب را دنبال می‌کند.",
    now: "اکنون", rest: "سکوت. چراغ هنوز می‌جنبد.", soundOff: "صدا خاموش است.",
    deviceNow: "اکنون: این دستگاه.", deviceOff: "صدا خاموش است. اکنون: این دستگاه.",
    lesson: "درس", of: "از", iDid: "این را کردم", skip: "بگذر", done: "شد", gotIt: "شد.",
    les1t: "ضرب را ببین", les1b: "پخش را بزن. تصویر با ضرب می‌جنبد. صدا می‌تواند خاموش بماند. کلمه را بخوان.", les1m: "پخش را بزن.",
    les2t: "کلمه", les2b: "کلمه زیر پخش را بخوان. وقتی Kick، Snare، Hat یا نوت گفت، این صدا اکنون است.", les2m: "پخش را بگذار تا کلمه یک صدا را نام ببرد.",
    les3t: "رنگ موسیقی نیست", les3b: "نقطه رنگ دیگر را بزن. تصویر عوض می‌شود. ضرب نه. موسیقی ضرب و نوت است.", les3m: "نقطه رنگی را بزن که هنوز روشن نیست.",
    les4t: "یک آهنگ", les4b: "ضرب طبل و شمار است. نوت نوت روی خط است. این در فقط آهنگ را نشان می‌دهد.",
    foot: "صدا می‌تواند خاموش بماند. چراغ هنوز می‌جنبد. همان آهنگ در BertyBeatz است.",
    own: "در خود", shared: "چراغ مشترک"
  };
  var RW = {
    menu: "Ibikubiyemo", whatsNew: "Ibishya",
    whats: "Visualizer ivuga ururimi rwa Hub. Ibikubiyemo biri hejuru ibumoso.",
    score: "Inota", beats: "Imbyino", lights: "Amatara", band: "Itsinda",
    play: "Kina", pause: "Hagarara", stop: "Hagarika",
    soundOn: "Ijwi rirafunguye", muted: "Nta jwi",
    how: "Uko", learn: "Iga", look: "Isura", color: "Ibara", layers: "Ibice",
    wall: "Urukuta", frame: "Urubibi", try: "Gerageza", crazy: "Birakaze", beat: "Umubyino",
    sliders: "Ibipimo", more: "Ibindi", less: "Bike",
    device: "Koresha ijwi ry'iki gikoresho", library: "Koresha isomero", importBeat: "Injiza umubyino",
    rgb: "RGB isubiramo", reset: "Subiza ibipimo", teacher: "Umwarimu",
    howTitle: "Uko bikora",
    help1: "Isomo ryaka Kina, ijambo, cyangwa utudomo tw'ibara. Buto ivuga Byakozwe iyo intambwe irangiye.",
    help2: "Hitamo isura. Utubuto 1\u20135 ni bitanu bya mbere. 6\u20139 na 0 ni bishya.",
    help3: "Kanda Kina. Ishusho ikurikira indirimbo yawe muri Muzika. Ijwi rishobora kuguma rifunze.",
    help4: "Nta ndirimbo? Yikore muri Muzika. Garuka. Imbyino zimwe zitwara amatara.",
    nowIdle: "Kanda Kina. Soma ijambo. Ijwi rishobora kuguma rifunze.",
    noSong: "Nta ndirimbo. Yikore muri Muzika. Ishusho izayikoresha.",
    thisIs: "Iyi ni", pressFollow: "Kanda Kina. Ishusho ikurikira imbyino.",
    now: "Ubu", rest: "Utuntu. Amatara aracyimura.", soundOff: "Ijwi rirafunze.",
    deviceNow: "Ubu: iki gikoresho.", deviceOff: "Ijwi rirafunze. Ubu: iki gikoresho.",
    lesson: "Isomo", of: "muri", iDid: "Nabikoze", skip: "Simbuka", done: "Byarangiye", gotIt: "Byakozwe.",
    les1t: "Reba umubyino", les1b: "Kanda Kina. Ishusho imuka n'umubyino. Ijwi rishobora kuguma rifunze. Soma ijambo.", les1m: "Kanda Kina.",
    les2t: "Ijambo", les2b: "Soma ijambo munsi ya Kina. Iyo rivuga Kick, Snare, Hat cyangwa inota, iryo jwi ririho ubu.", les2m: "Sigaho Kina kugeza ijambo rivuga ijwi.",
    les3t: "Ibara si muzika", les3b: "Kanda akado k'ibara kindi. Ishusho ihinduka. Umubyino ntuhinduka. Muzika ni umubyino n'inota.", les3m: "Kanda akado k'ibara katari kaka.",
    les4t: "Indirimbo imwe", les4b: "Imbyino ni ingoma n'ibara. Inota ni inota ku murongo. Iyi ruri igaragaza indirimbo gusa.",
    foot: "Ijwi rishobora kuguma rifunze. Aya matara arimura. Indirimbo imwe iri muri BertyBeatz.",
    own: "urugi rwacyo", shared: "amatara asangiwe"
  };
  var TI = {
    menu: "መምረሓ", whatsNew: "ሕዳስ ተባደለ",
    whats: "Visualizer ባቅሊ ሃብ ይዘረብ። መምረሓ ሃይላይ ጣፍ እዩ።",
    score: "ኖታታት", beats: "ዕብድብ", lights: "ማብራህ", band: "ጃንዳ",
    play: "ከደት", pause: "አፍልጥ", stop: "አግትስ",
    soundOn: "ድምጺ ውጽት", muted: "ብዘይ ድምጺ",
    how: "በከመይ", learn: "ተምሃር", look: "ጥርዓት", color: "ህብሪ", layers: "ዝራዓት",
    wall: "ምድር", frame: "ፍረም", try: "ፍተን", crazy: "ዕቡድ", beat: "ዕብድብ",
    sliders: "ተንሸራቲ", more: "ደህሪ", less: "ንዕስቲ",
    device: "ድምጺ ንዘይ መሳርሂ", library: "ታይብሪ", importBeat: "ዕብድብ አምጺእ",
    rgb: "ዘውር RGB", reset: "ተንሸራቲ መለስ",
    teacher: "መምህራኒ",
    howTitle: "በከመይ ይሰርሕ",
    help1: "ትምህርቲ ን ከደት፣ ቃል ወይ ኖጥቢ ህብሪ የብርህ። መልክቲ ስገን ተበልዒ ይብል።",
    help2: "ጥርዓት ምረጥ። መውህቲ 1\u20135 ናይ ቀዳማይ ሓምስተ እዩ። 6\u20139 ን 0 ሓዳስ እዩ።",
    help3: "ከደት ጨቀቅ። ስእሊ ን ሙዝቃ ዘመጫ ይስዘይብ። ድምጺ ክፍቲ ክዝር ይክእል።",
    help4: "ዘመጫ የለይን? ኣብ ሙዝቃ ግበር። ተመለስ። ሑዳን ዕብድብ ማብራህ የንቀሳቅስ።",
    nowIdle: "ከደት ጨቀቅ። ንቃል ኣንብብ። ድምጺ ክፍቲ ክዝር ይክእል።",
    noSong: "ዘመጫ የለይን። ኣብ ሙዝቃ ግበር። ስእሊ ክተጠቅሞ እያ።",
    thisIs: "እዚ", pressFollow: "ከደት ጨቀቅ። ስእሊ ን ዕብድብ ይስዘይብ።",
    now: "ህጂ", rest: "ስቅታት። ማብራህ ኣይንቀሳቀስ አለው።", soundOff: "ድምጺ ጠፊኡ።",
    deviceNow: "ህጂ፡ እዚ መሳርሂ።", deviceOff: "ድምጺ ጠፊኡ። ህጂ፡ እዚ መሳርሂ።",
    lesson: "ትምህርቲ", of: "ካብ", iDid: "እዚ ገይረ", skip: "ዝለል", done: "ተወዲኡ", gotIt: "ተበልዒ።",
    les1t: "ን ዕብድብ ርአይ", les1b: "ከደት ጨቀቅ። ስእሊ ምስ ዕብድብ ይንቀሳቀስ። ድምጺ ክፍቲ ክዝር ይክእል። ንቃል ኣንብብ።", les1m: "ከደት ጨቀቅ።",
    les2t: "ንቃል", les2b: "ንቃል ኣብ ታሕቲ ከደት ኣንብብ። Kick፣ Snare፣ Hat ወይ ኖታ እንተበለ፣ እቲ ድምጺ ህጂ እዩ።", les2m: "ከደት ግደፍ ንቃል ድምጺ ክሰም እልክዕ።",
    les3t: "ህብሪ ሙዝቃ ኣይኮንን", les3b: "ካልእ ኖጥቢ ህብሪ ጨቀቅ። ስእሊ ይቀያይር። ዕብድብ ኣይቀያይርን። ሙዝቃ ዕብድብ ን ኖታ እዩ።", les3m: "ዘይተበርሄ ኖጥቢ ህብሪ ጨቀቅ።",
    les4t: "ሕድ ዘመጫ", les4b: "ዕብድብ ኮቦ ን ቁጤር እዩ። ኖታታት ንኣብ መስመር እዩ። እዚ ማእገድ ን ዘመጫ ጥራይ ይርአይ።",
    foot: "ድምጺ ክፍቲ ክዝር ይክእል። እዚአቶም ማብራህ ይንቀሳቀስ አለው። ሑዳን ዘመጫ ኣብ BertyBeatz እዩ።",
    own: "ናይ ማእገድ", shared: "ዝማራዊ ማብራህ"
  };
  var PACKS = { en: EN, uk: UK, ru: RU, es: ES, ar: AR, "fa-AF": FA, rw: RW, ti: TI };
  var OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
  function classic() {
    try {
      var q = new URLSearchParams(location.search);
      if (q.get("hub") === "classic" || q.get("theme") === "classic") return true;
      if (localStorage.getItem("tech-room-hub") === "classic") return true;
    } catch (e) {}
    return false;
  }
  function lang() {
    if (classic()) return "en";
    try {
      var q = new URLSearchParams(location.search).get("lang");
      if (q && OK[q]) return q;
      if (root.KulibertPrefs && OK[root.KulibertPrefs.lang]) return root.KulibertPrefs.lang;
    } catch (e2) {}
    return "en";
  }
  function packFor(code) {
    if (code === "simple" || !PACKS[code]) return EN;
    return PACKS[code];
  }
  function t(key) {
    var k = String(key == null ? "" : key);
    var pack = packFor(lang());
    if (pack && pack[k]) return pack[k];
    if (EN[k]) return EN[k];
    return "";
  }
  function paint() {
    var code = lang();
    var html = document.documentElement;
    html.lang = code === "simple" ? "en" : code;
    html.dir = code === "ar" || code === "fa-AF" ? "rtl" : "ltr";
    document.querySelectorAll("[data-vz]").forEach(function (node) {
      var v = t(node.getAttribute("data-vz"));
      if (v) node.textContent = v;
    });
    document.querySelectorAll("[data-vz-label]").forEach(function (node) {
      var v = t(node.getAttribute("data-vz-label"));
      if (v) node.setAttribute("aria-label", v);
    });
    ["chip-label", "chip-live", "foot-chip", "drawer-chip"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "Viz 0.9.1";
    });
    document.title = "Visualizer \u00b7 Viz 0.9.1";
    if (typeof root.VzPaintLive === "function") {
      try { root.VzPaintLive(); } catch (e) {}
    }
  }
  root.addEventListener("kulibert-lang", paint);
  root.addEventListener("storage", function (ev) {
    if (ev && ev.key === "kulibert-prefs-v1") paint();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", paint);
  else paint();
  root.VzI18n = { t: t, lang: lang, paint: paint, lesson: function (i) {
    return { title: t("les" + (i + 1) + "t"), body: t("les" + (i + 1) + "b"), miss: t("les" + (i + 1) + "m") };
  }};
})(window);
