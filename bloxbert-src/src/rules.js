// World rules. Pure data: no DOM. IDs are permanent. ALIASES is the only rename path.
const LANGS = ['en', 'uk', 'ru', 'es', 'ar', 'fa-AF', 'rw', 'ti']

export const ALIASES = {}

const registry = new Map()
const saved = new Map()
let currentLang = 'en'

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

function coerce(def, v) {
  if (def.type === 'bool') return v === true || v === false ? v : def.def
  if (def.type === 'num') return Number.isFinite(+v) ? +v : def.def
  if (def.type === 'pick') return typeof v === 'string' ? v : def.def
  return v
}

function register(def) {
  if (!def || typeof def.id !== 'string' || !def.id || registry.has(def.id)) return false
  registry.set(def.id, def)
  return true
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
  void ctx
  const id = canon(ruleId)
  const def = registry.get(id)
  const v = saved.has(id) ? saved.get(id) : (def ? def.def : true)
  const ok = typeof v === 'boolean' ? v : v !== false
  return { ok, ruleId: id }
}

function why(ruleId, lang) {
  const id = canon(ruleId)
  return text(WHY[id] || WHY_UNKNOWN, lang)
}

function icon(ruleId) {
  const def = registry.get(canon(ruleId))
  return (def && def.icon) || '•'
}

function useLang(code) {
  if (code && WHY_UNKNOWN[code]) currentLang = code
  return currentLang
}

const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

register({
  id: 'core.break', type: 'bool', def: true, group: 'core', icon: '⛏',
  label: L('Breaking', 'Ламання', 'Ломание', 'Romper', 'الكسر', 'شکستن', 'Gukata', 'ምስባር'),
  desc: L('Players can break blocks.', 'Гравці можуть ламати блоки.', 'Игроки могут ломать блоки.', 'Los jugadores pueden romper bloques.', 'اللاعبون يستطيعون كسر المكعبات.', 'بازیکن‌ها می‌توانند بلاک بشکنند.', 'Abakinnyi bashobora gukata ibibumbe.', 'ተጻወቲ ብሎክ ክስብሩ ይኽእሉ።'),
})
register({
  id: 'core.place', type: 'bool', def: true, group: 'core', icon: '▣',
  label: L('Placing', 'Ставлення', 'Установка', 'Poner', 'الوضع', 'گذاشتن', 'Gushyira', 'ምቕማጥ'),
  desc: L('Players can place blocks.', 'Гравці можуть ставити блоки.', 'Игроки могут ставить блоки.', 'Los jugadores pueden poner bloques.', 'اللاعبون يستطيعون وضع المكعبات.', 'بازیکن‌ها می‌توانند بلاک بگذارند.', 'Abakinnyi bashobora gushyira ibibumbe.', 'ተጻወቲ ብሎክ ክቐምጡ ይኽእሉ።'),
})
register({
  id: 'core.craft', type: 'bool', def: true, group: 'core', icon: '⚒',
  label: L('Crafting', 'Крафт', 'Крафт', 'Fabricar', 'الصنع', 'ساختن', 'Gukora', 'ምስራሕ'),
  desc: L('Players can craft.', 'Гравці можуть крафтити.', 'Игроки могут крафтить.', 'Los jugadores pueden fabricar.', 'اللاعبون يستطيعون الصنع.', 'بازیکن‌ها می‌توانند بسازند.', 'Abakinnyi bashobora gukora.', 'ተጻወቲ ክሰርሑ ይኽእሉ።'),
})
register({
  id: 'core.station.open', type: 'bool', def: true, group: 'core', icon: '⚙',
  label: L('Stations', 'Станки', 'Станки', 'Estaciones', 'المحطات', 'ایستگاه‌ها', 'Sitasiyo', 'ጣብያታት'),
  desc: L('Players can open a station.', 'Гравці можуть відкрити станок.', 'Игроки могут открыть станок.', 'Los jugadores pueden abrir una estación.', 'اللاعبون يستطيعون فتح محطة.', 'بازیکن‌ها می‌توانند ایستگاه را باز کنند.', 'Abakinnyi bashobora gufungura sitasiyo.', 'ተጻወቲ ጣብያ ክኸፍቱ ይኽእሉ።'),
})
// Today's behaviour: double-jump fly in Creative still works. Not checked yet.
register({
  id: 'core.fly', type: 'bool', def: true, group: 'core', icon: '✈',
  label: L('Flying', 'Політ', 'Полёт', 'Volar', 'الطيران', 'پرواز', 'Kuguruka', 'ምንፋር'),
  desc: L('Players can fly in Creative.', 'Гравці можуть літати у Творчому.', 'Игроки могут летать в Творческом.', 'Los jugadores pueden volar en Creativo.', 'اللاعبون يستطيعون الطيران في الوضع الإبداعي.', 'بازیکن‌ها می‌توانند در ساختن پرواز کنند.', 'Abakinnyi bashobora kuguruka muri Creative.', 'ተጻወቲ ኣብ ፈጠራ ክነፍሩ ይኽእሉ።'),
})

export const Rules = { register, load, dump, set, allow, why, icon, useLang, langs: LANGS }
