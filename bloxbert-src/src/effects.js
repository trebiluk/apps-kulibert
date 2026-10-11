// Local effects. Session timers are not saved. World effects sit next to rules.
const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

const MIN = L('min', 'хв', 'мин', 'min', 'د', 'دقیقه', 'min', 'ደቒቕ')

const CATALOG = [
  { id: 'speed', icon: '🏃', levels: [1, 2],
    label: L('Speed', 'Швидкість', 'Скорость', 'Velocidad', 'السرعة', 'سرعت', 'Umuvuduko', 'ፍጥነት'),
    desc: L('Walk faster.', 'Ходи швидше.', 'Иди быстрее.', 'Camina más rápido.', 'امشِ أسرع.', 'تندتر راه برو.', 'Genda vuba.', 'ቐልጢፍኻ ኺድ።') },
  { id: 'jump', icon: '⤒', levels: [1, 2],
    label: L('Jump', 'Стрибок', 'Прыжок', 'Salto', 'القفز', 'پرش', 'Gusimbuka', 'ምዝላል'),
    desc: L('Jump higher.', 'Стрибай вище.', 'Прыгай выше.', 'Salta más alto.', 'اقفز أعلى.', 'بلندتر بپر.', 'Simbuka hejuru.', 'ንላዕሊ ዝለል።') },
  { id: 'fly', icon: '✈', levels: [1],
    label: L('Fly', 'Політ', 'Полёт', 'Volar', 'الطيران', 'پرواز', 'Kuguruka', 'ምንፋር'),
    desc: L('Fly like in Creative.', 'Літай як у Творчому.', 'Летай как в Творческом.', 'Vuela como en Creativo.', 'طر كما في الوضع الإبداعي.', 'مثل ساختن پرواز کن.', 'Guruka nka Creative.', 'ከም ፈጠራ ንፈር።') },
  { id: 'nightVision', icon: '👁', levels: [1],
    label: L('Night vision', 'Нічний зір', 'Ночное зрение', 'Visión nocturna', 'الرؤية الليلية', 'دید شب', 'Kureba ijoro', 'ራእይ ለይቲ'),
    desc: L('See in the dark.', 'Бач у темряві.', 'Видишь в темноте.', 'Ves en la oscuridad.', 'ترى في الظلام.', 'در تاریکی می‌بینی.', 'Ubona mu mwijima.', 'ኣብ ጸልማት ትሪኢ።') },
  { id: 'slowFall', icon: '🪶', levels: [1],
    label: L('Slow fall', 'Повільне падіння', 'Медленное падение', 'Caída lenta', 'سقوط بطيء', 'سقوط آهسته', 'Kugwa buhoro', 'ቀስ ዝበለ ውድቃት'),
    desc: L('Fall gently.', 'Падай м’яко.', 'Падай мягко.', 'Cae con suavidad.', 'تسقط بلطف.', 'آرام بیفت.', 'Ugwa buhoro.', 'ቀስ ኢልካ ውድቀ።') },
  { id: 'longReach', icon: '✋', levels: [1],
    label: L('Long reach', 'Довга рука', 'Длинная рука', 'Alcance largo', 'وصول بعيد', 'دست دراز', 'Ukuboko kure', 'ርሒቕ ምብጻሕ'),
    desc: L('Reach three blocks farther.', 'Дістань на три блоки далі.', 'Достань на три блока дальше.', 'Alcanza tres bloques más.', 'تصل ثلاثة مكعبات أبعد.', 'سه بلاک دورتر می‌رسی.', 'Ugeraho amabuye atatu kure.', 'ሰለስተ ብሎክ ርሒቕ ትበጽሕ።') },
]

const byId = new Map(CATALOG.map((d) => [d.id, d]))
const active = new Map()
const ghosts = []
let clock = 0
let langCode = 'en'
let langOf = () => langCode
let toastFn = () => {}
let nv = { from: 0, to: 0, t0: 0 }
let root = null
let cssOn = false

function text(pack, lang) {
  if (!pack) return ''
  return pack[lang] || pack.en || ''
}

function roman(level) {
  return level >= 2 ? 'II' : 'I'
}

function nvAt() {
  const p = Math.max(0, Math.min(1, (clock - nv.t0) / 1000))
  return nv.from + (nv.to - nv.from) * p
}

function setNv(to) {
  nv = { from: nvAt(), to, t0: clock }
}

function clampLevel(def, level) {
  const n = level == null ? def.levels[0] : level | 0
  return def.levels.includes(n) ? n : def.levels[0]
}

function entry(id) {
  return active.get(id) || null
}

function give(id, opts) {
  opts = opts || {}
  const def = byId.get(id)
  if (!def) return false
  const level = clampLevel(def, opts.level)
  const world = !!opts.world
  const ms = world || opts.ms == null ? null : Math.max(0, Number(opts.ms) || 0)
  active.set(id, { id, level, ms, until: ms == null ? null : clock + ms, world, at: clock })
  if (id === 'nightVision') setNv(1)
  const lv = def.levels.length > 1 ? ' ' + roman(level) : ''
  const tail = ms == null ? '' : ' - ' + Math.round(ms / 60000) + ' ' + text(MIN, langOf())
  toastFn(text(def.label, langOf()) + lv + tail)
  paint()
  return true
}

function clear(id) {
  if (!active.has(id)) return false
  active.delete(id)
  if (id === 'nightVision') setNv(0)
  ghosts.push({ id, until: clock + 400 })
  paint()
  return true
}

function list() {
  return [...active.values()].map((e) => ({ id: e.id, level: e.level, ms: e.ms, left: e.until == null ? null : Math.max(0, e.until - clock), world: e.world }))
}

function has(id) { return active.has(id) }
function level(id) { const e = entry(id); return e ? e.level : 0 }

function tick(dt) {
  clock += Math.max(0, Number(dt) || 0)
  for (const [id, e] of [...active]) {
    if (e.until != null && clock >= e.until) {
      active.delete(id)
      if (id === 'nightVision') setNv(0)
      ghosts.push({ id, until: clock + 400 })
    }
  }
  for (let i = ghosts.length - 1; i >= 0; i--) if (clock >= ghosts[i].until) ghosts.splice(i, 1)
  paint()
}

function speedMul() {
  const e = entry('speed')
  if (!e) return 1
  return e.level >= 2 ? 1.5 : 1.25
}

function jumpV(base) {
  const e = entry('jump')
  const extra = e ? (e.level >= 2 ? 2.2 : 1) : 0
  if (!extra) return base
  const g = 32
  const h = (base * base) / (2 * g) + extra
  return Math.sqrt(2 * g * h)
}

function spaceFly(survival, flying) {
  if (survival && !has('fly')) return { ok: false, flying: !!flying }
  return { ok: true, flying: !flying }
}

function grav(base, vy) {
  if (!has('slowFall')) return base
  if (typeof vy === 'number' && !(vy < 0)) return base
  return base * 0.4
}

function reach(base) {
  return base + (has('longReach') ? 3 : 0)
}

function light(k) {
  const n = typeof k === 'number' ? k : 0
  return Math.min(1, n + nvAt() * 0.55)
}

function dump() {
  const out = {}
  for (const e of active.values()) if (e.world) out[e.id] = { level: e.level }
  return out
}

function load(raw) {
  active.clear()
  ghosts.length = 0
  clock = 0
  nv = { from: 0, to: 0, t0: 0 }
  if (raw && typeof raw === 'object') {
    for (const id of Object.keys(raw)) {
      const def = byId.get(id)
      if (!def) continue
      const level = clampLevel(def, raw[id] && raw[id].level)
      active.set(id, { id, level, ms: null, until: null, world: true, at: clock })
    }
  }
  if (has('nightVision')) setNv(1)
  paint()
}

function tiles(lang) {
  const out = []
  for (const e of active.values()) {
    if (!e.world) continue
    const def = byId.get(e.id)
    if (!def) continue
    const lv = def.levels.length > 1 ? ' ' + roman(e.level) : ''
    out.push({ id: 'fx.' + e.id, icon: def.icon, text: text(def.label, lang) + lv, value: e.level })
  }
  return out
}

function catalog() {
  return CATALOG.map((d) => ({ id: d.id, icon: d.icon, levels: d.levels.slice(), label: d.label, desc: d.desc }))
}

function clockText(e) {
  if (e.until == null) return '∞'
  const s = Math.max(0, Math.ceil((e.until - clock) / 1000))
  const m = Math.floor(s / 60)
  const r = s % 60
  return m + ':' + String(r).padStart(2, '0')
}

function injectCss() {
  if (cssOn || typeof document === 'undefined' || !document.createElement || !document.getElementById) return
  if (document.getElementById('fx-strip-css')) { cssOn = true; return }
  const s = document.createElement('sty' + 'le')
  s.id = 'fx-strip-css'
  s.textContent = `#fx-strip{flex:1 0 100%;display:flex;flex-wrap:wrap;gap:4px;width:100%;max-width:100%;box-sizing:border-box;margin:2px 0 0;padding:0}
#fx-strip[hidden]{display:none}
#fx-strip .fx-chip{display:flex;align-items:center;gap:4px;min-height:28px;max-width:100%;box-sizing:border-box;padding:2px 8px;border-radius:999px;background:#13303A;color:#E6EEF2;font-size:12px;font-weight:700}
#fx-strip .fx-chip.fx-bye{opacity:.35}
#fx-strip .fx-ring{width:14px;height:14px;border-radius:50%;flex:0 0 14px;background:conic-gradient(#22D3EE calc(var(--p,1) * 360deg),#1c2740 0)}
#fx-strip .fx-more{margin:0;font-weight:800;min-height:28px;display:flex;align-items:center}`
  const parent = document.head || document.documentElement
  if (parent && parent.append) parent.append(s)
  cssOn = true
}

function paint() {
  if (!root) return
  injectCss()
  const lang = langOf()
  root.setAttribute('dir', lang === 'ar' || lang === 'fa-AF' ? 'rtl' : 'ltr')
  const rows = list()
  root.hidden = rows.length === 0 && ghosts.length === 0
  root.innerHTML = ''
  const shown = rows.slice(0, 4)
  const bye = new Set(ghosts.map((g) => g.id))
  for (const e of shown) {
    const def = byId.get(e.id)
    const chip = document.createElement('span')
    chip.className = 'fx-chip' + (bye.has(e.id) ? ' fx-bye' : '')
    chip.dataset.id = e.id
    const ico = document.createElement('span')
    ico.textContent = def ? def.icon : '•'
    const ring = document.createElement('span')
    ring.className = 'fx-ring'
    const frac = e.left == null || !e.ms ? 1 : Math.max(0, Math.min(1, e.left / e.ms))
    if (ring.style && ring.style.setProperty) ring.style.setProperty('--p', String(frac))
    const lab = document.createElement('span')
    const lv = def && def.levels.length > 1 ? ' ' + roman(e.level) : ''
    lab.textContent = (def ? text(def.label, lang) : e.id) + lv
    const time = document.createElement('span')
    time.className = 'fx-time'
    time.textContent = clockText(active.get(e.id) || e)
    chip.append(ico, ring, lab, time)
    root.append(chip)
  }
  for (const g of ghosts) {
    if (active.has(g.id) || shown.some((e) => e.id === g.id)) continue
    const def = byId.get(g.id)
    const chip = document.createElement('span')
    chip.className = 'fx-chip fx-bye'
    chip.dataset.id = g.id
    chip.textContent = (def ? def.icon : '') + (def ? text(def.label, lang) : g.id)
    root.append(chip)
  }
  if (rows.length > shown.length) {
    const more = document.createElement('span')
    more.className = 'fx-more'
    more.textContent = '+' + (rows.length - shown.length)
    root.append(more)
  }
}

function mount(anchor, opts) {
  opts = opts || {}
  if (typeof opts.lang === 'function') langOf = opts.lang
  else if (opts.lang) langCode = opts.lang
  if (opts.toast) toastFn = opts.toast
  injectCss()
  if (typeof document === 'undefined' || !document.createElement) return null
  root = document.getElementById && document.getElementById('fx-strip')
  if (!root) {
    root = document.createElement('div')
    root.id = 'fx-strip'
    root.hidden = true
    if (anchor && anchor.after) anchor.after(root)
    else {
      const host = document.body || document.documentElement
      if (host && host.append) host.append(root)
    }
  }
  paint()
  return root
}

function useLang(code) { if (code) { langCode = code; langOf = () => langCode } }

export const Effects = {
  give, clear, list, has, level, tick, speedMul, jumpV, spaceFly, grav, reach, light,
  dump, load, tiles, catalog, mount, useLang,
}
