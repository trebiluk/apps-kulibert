/* Free-build codes and name words for SpanCraft and Spire Lab.
   A code is B + app letter (P spire, C span) + a Crockford base32 bitmask
   of slot pairs, plus one check character, in groups of 5. */
const ALPHA = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

const NAMES = {
  en: {
    adj: ["Teal", "Iron", "Quiet", "Bright", "Swift", "Amber", "Silver", "Bold", "Calm", "Copper", "Golden", "Keen", "Noble", "Rapid", "Solid", "Wild"],
    noun: ["Falcon", "Ridge", "Harbor", "Beacon", "Cedar", "Compass", "Dawn", "Ember", "Meadow", "Orion", "Prairie", "Quartz", "Summit", "Timber", "Valley", "Willow"],
  },
  es: {
    adj: ["Verdeazul", "Hierro", "Quieto", "Brillante", "Raudo", "Ámbar", "Plata", "Firme", "Calmo", "Cobre", "Dorado", "Agudo", "Noble", "Veloz", "Sólido", "Salvaje"],
    noun: ["Halcón", "Cresta", "Puerto", "Faro", "Cedro", "Brújula", "Alba", "Brasa", "Prado", "Orión", "Pradera", "Cuarzo", "Cumbre", "Madera", "Valle", "Sauce"],
  },
  uk: {
    adj: ["Бірюзовий", "Залізний", "Тихий", "Яскравий", "Швидкий", "Бурштиновий", "Срібний", "Сміливий", "Спокійний", "Мідний", "Золотий", "Гострий", "Шляхетний", "Стрімкий", "Міцний", "Дикий"],
    noun: ["Сокіл", "Хребет", "Гавань", "Маяк", "Кедр", "Компас", "Світанок", "Жар", "Лука", "Оріон", "Прерія", "Кварц", "Вершина", "Брус", "Долина", "Верба"],
  },
  ru: {
    adj: ["Бирюзовый", "Железный", "Тихий", "Яркий", "Быстрый", "Янтарный", "Серебряный", "Смелый", "Спокойный", "Медный", "Золотой", "Острый", "Благородный", "Стремительный", "Прочный", "Дикий"],
    noun: ["Сокол", "Хребет", "Гавань", "Маяк", "Кедр", "Компас", "Рассвет", "Уголь", "Луг", "Орион", "Прерия", "Кварц", "Вершина", "Брус", "Долина", "Ива"],
  },
  ar: {
    adj: ["فيروزي", "حديدي", "ساكن", "ساطع", "خاطف", "كهرماني", "فضي", "جريء", "هادئ", "نحاسي", "ذهبي", "حاد", "نبيل", "سريع", "صلب", "بري"],
    noun: ["صقر", "حافة", "ميناء", "منارة", "أرز", "بوصلة", "فجر", "جمرة", "مرج", "الجبار", "سهل", "كوارتز", "قمة", "خشب", "واد", "صفصاف"],
  },
  "fa-AF": {
    adj: ["فیروزه‌ای", "آهنی", "آرام", "روشن", "تیزرو", "کهربایی", "نقره‌ای", "دلیر", "آسوده", "مسی", "زرین", "تیز", "نجیب", "شتابان", "استوار", "وحشی"],
    noun: ["شاهین", "یال", "بندر", "مشعل", "سرو", "قطب‌نما", "سپیده", "اخگر", "چمن", "شکارچی", "دشت", "کوارتز", "قله", "الوار", "دره", "بید"],
  },
  rw: {
    adj: ["Ubururu", "Icyuma", "Ituze", "Umucyo", "Vuba", "Amabuye", "Ifeza", "Intwari", "Amahore", "Umuringa", "Izahabu", "Iryo", "Mwiza", "Ishoramari", "Ikomeza", "Kamere"],
    noun: ["Ikigwari", "Umugongo", "Icyambu", "Itara", "Ikedere", "Ikerekezo", "Isasa", "Ikara", "Ahantu", "Orion", "Ishamba", "Ikibuye", "Umusozi", "Igiti", "Akabande", "Umugunga"],
  },
  ti: {
    adj: ["ሰማያዊ", "ሓጺን", "ህድእ", "ብርሃን", "ቅልጡፍ", "ኣምበር", "ብሩር", "ጅግና", "ርጉእ", "ነሓስ", "ወርቂ", "ስሉጥ", "ክቡር", "ገጣሚ", "ጽኑዕ", "ዱር"],
    noun: ["ጭልፊ", "ሸንተረት", "ወደብ", "ብራና", "ዓርዘን", "መኮንን", "ጎሕ", "ሓዊ", "ሜዳ", "ኦርዮን", "ዓረር", "ኳርትዝ", "ጫፍ", "ዕንጨይቲ", "ሸለቆ", "ጣብ"],
  },
};

export function rollIndex() {
  return { a: Math.floor(Math.random() * 16), n: Math.floor(Math.random() * 16) };
}

export function namePart(lang, kind, i) {
  const pack = NAMES[lang] || NAMES.en;
  const list = pack[kind] || NAMES.en[kind];
  return list[i] || NAMES.en[kind][i] || "";
}

export function pairIndex(n, i, j) {
  if (i > j) {
    const t = i;
    i = j;
    j = t;
  }
  return (i * (2 * n - i - 1)) / 2 + (j - i - 1);
}

function modeOf(app) {
  return app === "P" ? "spire" : app === "C" ? "span" : "";
}
function letterOf(mode) {
  return mode === "spire" ? "P" : "C";
}
function widthOf(mode) {
  return mode === "spire" ? 9 : 5;
}
function bitsOf(mode) {
  return mode === "spire" ? 45 : 21;
}

function normBody(raw) {
  return String(raw || "")
    .toUpperCase()
    .replace(/I/g, "1")
    .replace(/L/g, "1")
    .replace(/O/g, "0")
    .replace(/\s+/g, "");
}

function checkOf(payload) {
  let s = 0;
  for (const ch of payload) s = (s + ALPHA.indexOf(ch)) % 32;
  return ALPHA[s];
}

export function encodeBuild(mode, mask) {
  const width = widthOf(mode);
  const bits = bitsOf(mode);
  let n = BigInt(mask) & ((1n << BigInt(bits)) - 1n);
  let payload = "";
  for (let i = 0; i < width; i++) {
    payload = ALPHA[Number(n & 31n)] + payload;
    n >>= 5n;
  }
  const full = payload + checkOf(payload);
  const groups = full.match(/.{1,5}/g).join("-");
  return "B" + letterOf(mode) + "-" + groups;
}

export function decodeBuild(raw) {
  const s = normBody(raw);
  const m = s.match(/^B([PC])-(.*)$/);
  if (!m) return { ok: false, reason: "bad" };
  const app = modeOf(m[1]);
  const body = m[2].replace(/-/g, "");
  const width = widthOf(app);
  if (body.length !== width + 1) return { ok: false, reason: "bad", app };
  for (const ch of body) {
    if (ALPHA.indexOf(ch) < 0) return { ok: false, reason: "bad", app };
  }
  const payload = body.slice(0, width);
  if (body.slice(width) !== checkOf(payload)) return { ok: false, reason: "bad", app };
  let n = 0n;
  for (const ch of payload) n = (n << 5n) + BigInt(ALPHA.indexOf(ch));
  if (n >= (1n << BigInt(bitsOf(app)))) return { ok: false, reason: "bad", app };
  return { ok: true, app, mask: n };
}
