// World rules. Pure data: no DOM. IDs are permanent. ALIASES is the only rename path.
const LANGS = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']

export const ALIASES = {}

const registry = new Map()
const saved = new Map()
let currentLang = 'en'
let hinted = ''

const WHY = {
  'core.break': {
    en: 'Breaking is off in this world',
    uk: 'Ламання вимкнене в цьому світі',
    ru: 'Ломание выключено в этом мире',
    es: 'Romper está apagado en este mundo',
    ar: 'الكسر متوقف في هذا العالم',
    'fa-AF': 'شکستن در این دنیا خاموش است',
    rw: 'Gukata birafunze muri iyi si',
    ti: 'ምስባር ኣብዚ ዓለም ጠፊኡ እዩ',
  },
  'core.place': {
    en: 'Placing is off in this world',
    uk: 'Ставлення вимкнене в цьому світі',
    ru: 'Ставить выключено в этом мире',
    es: 'Poner está apagado en este mundo',
    ar: 'الوضع متوقف في هذا العالم',
    'fa-AF': 'گذاشتن در این دنیا خاموش است',
    rw: 'Gushyira birafunze muri iyi si',
    ti: 'ምቕማጥ ኣብዚ ዓለም ጠፊኡ እዩ',
  },
  'core.craft': {
    en: 'Crafting is off in this world',
    uk: 'Крафт вимкнений у цьому світі',
    ru: 'Крафт выключен в этом мире',
    es: 'Fabricar está apagado en este mundo',
    ar: 'الصنع متوقف في هذا العالم',
    'fa-AF': 'ساختن در این دنیا خاموش است',
    rw: 'Gukora birafunze muri iyi si',
    ti: 'ምስራሕ ኣብዚ ዓለም ጠፊኡ እዩ',
  },
  'core.station.open': {
    en: 'Stations are off in this world',
    uk: 'Станки вимкнені в цьому світі',
    ru: 'Станки выключены в этом мире',
    es: 'Las estaciones están apagadas en este mundo',
    ar: 'المحطات متوقفة في هذا العالم',
    'fa-AF': 'ایستگاه‌ها در این دنیا خاموش اند',
    rw: 'Sitasiyo zirafunze muri iyi si',
    ti: 'ጣብያታት ኣብዚ ዓለም ጠፊአን እየን',
  },
  'core.fly': {
    en: 'Flying is off in this world',
    uk: 'Політ вимкнений у цьому світі',
    ru: 'Полёт выключен в этом мире',
    es: 'Volar está apagado en este mundo',
    ar: 'الطيران متوقف في هذا العالم',
    'fa-AF': 'پرواز در این دنیا خاموش است',
    rw: 'Kuguruka birafunze muri iyi si',
    ti: 'ምንፋር ኣብዚ ዓለም ጠፊኡ እዩ',
  },
  'station.bench': {
    en: 'The teacher turned off the Workbench.',
    uk: 'Учитель вимкнув верстак.',
    ru: 'Учитель выключил верстак.',
    es: 'El maestro apagó el banco de trabajo.',
    ar: 'أوقف المعلم طاولة العمل.',
    'fa-AF': 'معلم میز کار را خاموش کرد.',
    rw: 'Umwarimu yafunze ameza yo gukora.',
    ti: 'መምህር መደብ ስራሕ ኣጥፍኦ።',
  },
  'station.oven': {
    en: 'The teacher turned off the Oven.',
    uk: 'Учитель вимкнув піч.',
    ru: 'Учитель выключил печь.',
    es: 'El maestro apagó el horno.',
    ar: 'أوقف المعلم الفرن.',
    'fa-AF': 'معلم تنور را خاموش کرد.',
    rw: 'Umwarimu yafunze ifuru.',
    ti: 'መምህር ምድጃ ኣጥፍኦ።',
  },
  'station.woodshop': {
    en: 'The teacher turned off the Woodshop.',
    uk: 'Учитель вимкнув столярню.',
    ru: 'Учитель выключил столярку.',
    es: 'El maestro apagó la carpintería.',
    ar: 'أوقف المعلم ورشة النجارة.',
    'fa-AF': 'معلم نجاری را خاموش کرد.',
    rw: 'Umwarimu yafunze ububiko bwimbaho.',
    ti: 'መምህር ናይ ዕንጨይቲ ዓውዲ ኣጥፍኦ።',
  },
}

const WHY_UNKNOWN = {
  en: 'That rule is off in this world',
  uk: 'Це правило вимкнене в цьому світі',
  ru: 'Это правило выключено в этом мире',
  es: 'Esa regla está apagada en este mundo',
  ar: 'هذه القاعدة متوقفة في هذا العالم',
  'fa-AF': 'این قانون در این دنیا خاموش است',
  rw: 'Iyo tegeko irafunze muri iyi si',
  ti: 'እዚ ሕጊ ኣብዚ ዓለም ጠፊኡ እዩ',
}

function text(pack, lang) {
  const code = pack[lang] ? lang : (pack[currentLang] ? currentLang : 'en')
  return pack[code] || pack.en || ''
}

function canon(id) {
  let key = String(id || '')
  for (let i = 0; i < 8 && ALIASES[key]; i++) key = ALIASES[key]
  return key
}

function same(a, b) {
  return a === b
}

function optionIds(def) {
  if (!def || !Array.isArray(def.options)) return null
  return def.options.map((o) => (typeof o === 'string' ? o : o && o.id)).filter(Boolean)
}

function coerce(def, v) {
  if (def.type === 'bool') return v === true || v === false ? v : def.def
  if (def.type === 'num') return Number.isFinite(+v) ? +v : def.def
  if (def.type === 'pick') {
    if (typeof v !== 'string') return def.def
    const ids = optionIds(def)
    if (ids && !ids.includes(v)) return def.def
    return v
  }
  return v
}

function register(def) {
  if (!def || typeof def.id !== 'string' || !def.id || registry.has(def.id)) return false
  registry.set(def.id, def)
  return true
}

function registerPack(prefix, defs) {
  const pack = String(prefix || '').replace(/\.+$/, '')
  if (!pack || !Array.isArray(defs)) return 0
  let n = 0
  for (const raw of defs) {
    if (!raw || typeof raw.id !== 'string' || !raw.id) continue
    const id = raw.id === pack || raw.id.startsWith(pack + '.') ? raw.id : pack + '.' + raw.id.replace(/^\.+/, '')
    const display = raw.display || (GROUPS[raw.group] ? raw.group : '')
    const def = { ...raw, id, pack }
    if (display) def.display = display
    if (register(def)) n += 1
  }
  return n
}

function load(obj) {
  saved.clear()
  if (!obj || typeof obj !== 'object') return
  for (const [raw, v] of Object.entries(obj)) {
    const id = canon(raw)
    const def = registry.get(id)
    if (!def) {
      saved.set(id, v)
      continue
    }
    const next = coerce(def, v)
    if (!same(def.def, next)) saved.set(id, next)
  }
}

function dump() {
  const out = {}
  for (const [id, v] of saved) {
    const def = registry.get(id)
    if (def && same(def.def, v)) continue
    out[id] = v
  }
  return out
}

function set(id, v) {
  const key = canon(id)
  const def = registry.get(key)
  if (!def) {
    saved.set(key, v)
    return v
  }
  const next = coerce(def, v)
  if (same(def.def, next)) saved.delete(key)
  else saved.set(key, next)
  return next
}

function allow(player, ruleId, ctx) {
  void player
  const id = canon(ruleId)
  const def = registry.get(id)
  const v = saved.has(id) ? saved.get(id) : (def ? def.def : true)
  const ok = typeof v === 'boolean' ? v : v !== false
  hinted = ''
  if (!ok) return { ok: false, ruleId: id, rule: id }
  if (id === 'core.station.open' && ctx && ctx.kind != null && ctx.kind !== '') {
    const childId = 'station.' + ctx.kind
    const child = registry.get(childId)
    if (child && child.type === 'bool') {
      const cv = saved.has(childId) ? saved.get(childId) : child.def
      if (cv === false) {
        hinted = childId
        return { ok: false, ruleId: childId, rule: childId }
      }
    }
  }
  return { ok: true, ruleId: id, rule: id }
}

function why(ruleId, lang) {
  const id = canon(ruleId)
  const key = id === 'core.station.open' && hinted.startsWith('station.') && WHY[hinted] ? hinted : id
  return text(WHY[key] || WHY_UNKNOWN, lang)
}

function icon(ruleId) {
  const id = canon(ruleId)
  const key = id === 'core.station.open' && hinted.startsWith('station.') && registry.has(hinted) ? hinted : id
  const def = registry.get(key)
  return (def && def.icon) || '•'
}

function useLang(code) {
  if (code && WHY_UNKNOWN[code]) currentLang = code
  return currentLang
}

function value(id) {
  const key = canon(id)
  if (saved.has(key)) return saved.get(key)
  const def = registry.get(key)
  return def ? def.def : undefined
}

function rows() {
  return [...registry.values()]
}

function unknown() {
  const out = []
  for (const [id, v] of saved) if (!registry.has(id)) out.push({ id, value: v })
  return out
}

const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

export const GROUPS = {
  building: L('Building', 'Будування', 'Строительство', 'Construcción', 'البناء', 'ساختمان', 'Kubaka', 'ምህናጽ'),
  crafting: L('Crafting', 'Крафт', 'Крафт', 'Fabricar', 'الصنع', 'ساختن', 'Gukora', 'ምስራሕ'),
  movement: L('Movement', 'Рух', 'Движение', 'Movimiento', 'الحركة', 'حرکت', 'Kugenda', 'ምንቅስቓስ'),
  survival: L('Survival', 'Виживання', 'Выживание', 'Supervivencia', 'البقاء', 'بقا', 'Kubaho', 'ህይወት'),
  effects: L('Effects', 'Ефекти', 'Эффекты', 'Efectos', 'التأثيرات', 'اثرها', 'Ingaruka', 'ጽልዋታት'),
}

register({
  id: 'core.break', type: 'bool', def: true, group: 'core', display: 'building', icon: '⛏',
  label: L('Breaking', 'Ламання', 'Ломание', 'Romper', 'الكسر', 'شکستن', 'Gukata', 'ምስባር'),
  desc: L('Players can break blocks.', 'Гравці можуть ламати блоки.', 'Игроки могут ломать блоки.', 'Los jugadores pueden romper bloques.', 'اللاعبون يستطيعون كسر المكعبات.', 'بازیکن‌ها می‌توانند بلاک بشکنند.', 'Abakinnyi bashobora gukata ibibumbe.', 'ተጻወቲ ብሎክ ክስብሩ ይኽእሉ።'),
})
register({
  id: 'core.place', type: 'bool', def: true, group: 'core', display: 'building', icon: '▣',
  label: L('Placing', 'Ставлення', 'Установка', 'Poner', 'الوضع', 'گذاشتن', 'Gushyira', 'ምቕማጥ'),
  desc: L('Players can place blocks.', 'Гравці можуть ставити блоки.', 'Игроки могут ставить блоки.', 'Los jugadores pueden poner bloques.', 'اللاعبون يستطيعون وضع المكعبات.', 'بازیکن‌ها می‌توانند بلاک بگذارند.', 'Abakinnyi bashobora gushyira ibibumbe.', 'ተጻወቲ ብሎክ ክቐምጡ ይኽእሉ።'),
})
register({
  id: 'core.craft', type: 'bool', def: true, group: 'core', display: 'crafting', icon: '⚒',
  label: L('Crafting', 'Крафт', 'Крафт', 'Fabricar', 'الصنع', 'ساختن', 'Gukora', 'ምስራሕ'),
  desc: L('Players can craft.', 'Гравці можуть крафтити.', 'Игроки могут крафтить.', 'Los jugadores pueden fabricar.', 'اللاعبون يستطيعون الصنع.', 'بازیکن‌ها می‌توانند بسازند.', 'Abakinnyi bashobora gukora.', 'ተጻወቲ ክሰርሑ ይኽእሉ።'),
})
register({
  id: 'core.station.open', type: 'bool', def: true, group: 'core', display: 'crafting', icon: '⚙',
  label: L('Stations', 'Станки', 'Станки', 'Estaciones', 'المحطات', 'ایستگاه‌ها', 'Sitasiyo', 'ጣብያታት'),
  desc: L('Players can open a station.', 'Гравці можуть відкрити станок.', 'Игроки могут открыть станок.', 'Los jugadores pueden abrir una estación.', 'اللاعبون يستطيعون فتح محطة.', 'بازیکن‌ها می‌توانند ایستگاه را باز کنند.', 'Abakinnyi bashobora gufungura sitasiyo.', 'ተጻወቲ ጣብያ ክኸፍቱ ይኽእሉ።'),
})
// Today's behaviour: double-jump fly in Creative still works. Not checked yet.
register({
  id: 'core.fly', type: 'bool', def: true, group: 'core', display: 'movement', soon: true, icon: '✈',
  label: L('Flying', 'Політ', 'Полёт', 'Volar', 'الطيران', 'پرواز', 'Kuguruka', 'ምንፋር'),
  desc: L('Players can fly in Creative.', 'Гравці можуть літати у Творчому.', 'Игроки могут летать в Творческом.', 'Los jugadores pueden volar en Creativo.', 'اللاعبون يستطيعون الطيران في الوضع الإبداعي.', 'بازیکن‌ها می‌توانند در ساختن پرواز کنند.', 'Abakinnyi bashobora kuguruka muri Creative.', 'ተጻወቲ ኣብ ፈጠራ ክነፍሩ ይኽእሉ።'),
})
// Kinds that exist in stations.js / machineKind: bench, oven, woodshop.
// sewing, loom, and a craft table are not station kinds, so they are not rules.
register({
  id: 'station.bench', type: 'bool', def: true, group: 'crafting', display: 'crafting', icon: '▤',
  label: L('Workbench', 'Верстак', 'Верстак', 'Banco de trabajo', 'طاولة العمل', 'میز کار', 'Ameza yo gukora', 'መደብ ስራሕ'),
  desc: L('Players can open the Workbench.', 'Гравці можуть відкрити верстак.', 'Игроки могут открыть верстак.', 'Los jugadores pueden abrir el banco de trabajo.', 'اللاعبون يستطيعون فتح طاولة العمل.', 'بازیکن‌ها می‌توانند میز کار را باز کنند.', 'Abakinnyi bashobora gufungura ameza yo gukora.', 'ተጻወቲ መደብ ስራሕ ክኸፍቱ ይኽእሉ።'),
})
register({
  id: 'station.oven', type: 'bool', def: true, group: 'crafting', display: 'crafting', icon: '🔥',
  label: L('Oven', 'Піч', 'Печь', 'Horno', 'الفرن', 'تنور', 'Ifuru', 'ምድጃ'),
  desc: L('Players can open the Oven.', 'Гравці можуть відкрити піч.', 'Игроки могут открыть печь.', 'Los jugadores pueden abrir el horno.', 'اللاعبون يستطيعون فتح الفرن.', 'بازیکن‌ها می‌توانند تنور را باز کنند.', 'Abakinnyi bashobora gufungura ifuru.', 'ተጻወቲ ምድጃ ክኸፍቱ ይኽእሉ።'),
})
register({
  id: 'station.woodshop', type: 'bool', def: true, group: 'crafting', display: 'crafting', icon: '🪵',
  label: L('Woodshop', 'Столярня', 'Столярка', 'Carpintería', 'ورشة النجارة', 'نجاری', 'Ububiko bwimbaho', 'ናይ ዕንጨይቲ ዓውዲ'),
  desc: L('Players can open the Woodshop.', 'Гравці можуть відкрити столярню.', 'Игроки могут открыть столярку.', 'Los jugadores pueden abrir la carpintería.', 'اللاعبون يستطيعون فتح ورشة النجارة.', 'بازیکن‌ها می‌توانند نجاری را باز کنند.', 'Abakinnyi bashobora gufungura ububiko bwimbaho.', 'ተጻወቲ ናይ ዕንጨይቲ ዓውዲ ክኸፍቱ ይኽእሉ።'),
})
register({
  id: 'survival.daynight', type: 'pick', def: 'cycle', group: 'survival', display: 'survival', icon: '☀',
  options: [
    { id: 'cycle', label: L('Cycle', 'Цикл', 'Цикл', 'Ciclo', 'دورة', 'چرخه', 'Uruzinduko', 'ዑደት') },
    { id: 'day', label: L('Day', 'День', 'День', 'Día', 'نهار', 'روز', 'Umunsi', 'መዓልቲ') },
    { id: 'night', label: L('Night', 'Ніч', 'Ночь', 'Noche', 'ليل', 'شب', 'Ijoro', 'ለይቲ') },
  ],
  label: L('Day and night', 'День і ніч', 'День и ночь', 'Día y noche', 'النهار والليل', 'روز و شب', 'Umunsi nijoro', 'መዓልቲን ለይቲን'),
  desc: L('Cycle, always day, or always night.', 'Цикл, завжди день, або завжди ніч.', 'Цикл, всегда день или всегда ночь.', 'Ciclo, siempre de día, o siempre de noche.', 'دورة، أو نهار دائم، أو ليل دائم.', 'چرخه، همیشه روز، یا همیشه شب.', 'Uruzinduko, umunsi iteka, cyangwa ijoro iteka.', 'ዑደት፡ ኩሉ ግዜ መዓልቲ፡ ወይ ኩሉ ግዜ ለይቲ።'),
})
// NOTE next step: session.js owns the drain. Multiplier off 0, calm 0.5, normal 1, fast 1.5.
register({
  id: 'survival.energy', type: 'pick', def: 'normal', group: 'survival', display: 'survival', soon: true, icon: '⚡',
  options: [
    { id: 'off', label: L('Off', 'Вимкнено', 'Выкл', 'Apagado', 'متوقف', 'خاموش', 'Bifunze', 'ጠፊኡ') },
    { id: 'calm', label: L('Calm', 'Спокійно', 'Спокойно', 'Calma', 'هادئ', 'آرام', 'Buhoro', 'ርጉእ') },
    { id: 'normal', label: L('Normal', 'Звично', 'Обычно', 'Habitual', 'عادي', 'عادی', 'Bisanzwe', 'ልሙድ') },
    { id: 'fast', label: L('Fast', 'Швидко', 'Быстро', 'Rápido', 'سريع', 'تند', 'Vuba', 'ቅልጡፍ') },
  ],
  label: L('Energy', 'Енергія', 'Энергия', 'Energía', 'الطاقة', 'انرژی', 'Ingufu', 'ጉልበት'),
  desc: L('How fast energy drops. Not in this build.', 'Як швидко спадає енергія. Ще не в цій збірці.', 'Как быстро падает энергия. Ещё не в этой сборке.', 'Qué tan rápido baja la energía. Aún no en esta versión.', 'سرعة نزول الطاقة. ليست في هذه النسخة.', 'انرژی چقدر تند کم می‌شود. در این نسخه نیست.', 'Uko ingufu zigabanuka. Ntiri muri iyi verisiyo.', 'ጉልበት ብኽንደይ ይወርድ። ኣብዚ ሕንጻ የለን።'),
})

const WORD = {
  off: L('off', 'вимкнено', 'выкл', 'apagado', 'متوقف', 'خاموش', 'bifunze', 'ጠፊኡ'),
  on: L('on', 'увімкнено', 'вкл', 'encendido', 'يعمل', 'روشن', 'gifunguye', 'ወሊዑ'),
  alwaysDay: L('Always day', 'Завжди день', 'Всегда день', 'Siempre de día', 'نهار دائم', 'همیشه روز', 'Umunsi iteka', 'ኩሉ ግዜ መዓልቲ'),
  alwaysNight: L('Always night', 'Завжди ніч', 'Всегда ночь', 'Siempre de noche', 'ليل دائم', 'همیشه شب', 'Ijoro iteka', 'ኩሉ ግዜ ለይቲ'),
}

function templateName() {
  for (const id of ['name', 'meta.name', 'rules.name']) {
    if (!saved.has(id)) continue
    const v = saved.get(id)
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function valueWord(def, v, lang) {
  if (def.type === 'bool') return text(v === false ? WORD.off : WORD.on, lang)
  if (def.id === 'survival.daynight') {
    if (v === 'day') return text(WORD.alwaysDay, lang)
    if (v === 'night') return text(WORD.alwaysNight, lang)
  }
  const opt = (def.options || []).find((o) => (typeof o === 'string' ? o : o && o.id) === v)
  if (opt && typeof opt === 'object' && opt.label) return text(opt.label, lang)
  return typeof v === 'string' ? v : ''
}

function iconFor(def, value) {
  if (def && def.id === 'survival.daynight') {
    if (value === 'night') return '\u{1F319}'
    if (value === 'day') return '\u2600'
  }
  return (def && def.icon) || '•'
}

function diffs(lang) {
  const out = []
  for (const def of registry.values()) {
    if (!def || def.soon) continue
    if (def.missing) continue
    const v = saved.has(def.id) ? saved.get(def.id) : def.def
    if (same(def.def, v)) continue
    const label = text(def.label, lang)
    const word = valueWord(def, v, lang)
    const phrase = def.id === 'survival.daynight' ? word : (label ? label + ' ' + word : word)
    out.push({ id: def.id, icon: iconFor(def, v), label, value: v, word, text: phrase })
  }
  return out
}

export const Rules = { register, registerPack, load, dump, set, allow, why, icon, iconFor, useLang, value, rows, unknown, diffs, templateName, langs: LANGS }
