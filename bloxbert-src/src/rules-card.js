// Kid rule card. Shown once per rules snapshot when a world opens, and any time from Menu.
// NOTE: no shared read-aloud helper (stations.js speech is local). Speaker button waits for one.
import { Rules } from './rules.js'
import { Effects } from './effects.js'

const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

const UI = {
  title: L("This world's rules", 'Правила цього світу', 'Правила этого мира', 'Reglas de este mundo', 'قواعد هذا العالم', 'قانون‌های این دنیا', "Amategeko y'iyi si", 'ሕግታት ናይዚ ዓለም'),
  got: L('Got it', 'Зрозуміло', 'Понятно', 'Entendido', 'فهمت', 'فهمیدم', 'Ndabyumvise', 'ተረዲኡ'),
  normal: L('Normal rules', 'Звичні правила', 'Обычные правила', 'Reglas normales', 'قواعد عادية', 'قانون عادی', 'Amategeko asanzwe', 'ልሙድ ሕግታት'),
  more: L('+{n} more', '+{n} ще', '+{n} ещё', '+{n} más', '+{n} أكثر', '+{n} بیشتر', '+{n} ibindi', '+{n} ተወሳኺ'),
}

const CSS = `#rules-card{position:fixed;inset:0;z-index:70;display:flex;align-items:center;justify-content:center;background:rgba(5,8,20,.55);padding:12px;box-sizing:border-box}
#rules-card[hidden]{display:none}
#rules-card .rc-card{width:min(420px,100%);max-height:100%;overflow:auto;box-sizing:border-box;background:#0E1A22;color:#E6EEF2;border:1px solid #1F8A8A;border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:10px}
#rules-card .rc-name{margin:0;font-weight:700}
#rules-card .rc-title{margin:0;font-size:1.25rem;font-weight:800}
#rules-card .rc-tiles{display:flex;flex-wrap:wrap;gap:8px}
#rules-card .rc-tile{display:flex;align-items:center;gap:8px;min-height:44px;min-width:44px;box-sizing:border-box;padding:6px 10px;border-radius:12px;border:1px solid #1F8A8A;background:#13303A}
#rules-card .rc-more{margin:0;font-weight:700}
#rules-card .rc-got,#rules-card .rc-got:focus,#rules-card .rc-got:focus-visible{min-width:44px;min-height:44px;padding:8px 16px;font:inherit;font-weight:800;border-radius:12px;background-color:#E6EEF2;color:#0B1220;outline:3px solid #22D3EE;outline-offset:2px}
`

const seen = new Set()

function pick(pack, lang) {
  if (!pack) return ''
  return pack[lang] || pack.en || ''
}

function injectCss() {
  if (typeof document === 'undefined' || !document.getElementById || !document.createElement) return
  if (document.getElementById('rules-card-css')) return
  const s = document.createElement('sty' + 'le')
  s.id = 'rules-card-css'
  s.textContent = CSS
  const parent = document.head || document.documentElement
  if (parent && parent.append) parent.append(s)
}

let escOn = false
function armEsc(hide) {
  if (escOn || !document.addEventListener) return
  escOn = true
  document.addEventListener('keydown', (e) => {
    if (!e || (e.key !== 'Escape' && e.code !== 'Escape')) return
    const card = document.getElementById('rules-card')
    if (!card || card.hidden) return
    if (e.preventDefault) e.preventDefault()
    hide()
  })
}

export function diffs(lang) {
  return Rules.diffs(lang || 'en')
}

function hide() {
  const card = document.getElementById && document.getElementById('rules-card')
  if (card) card.hidden = true
}

export function showRulesCard(opts) {
  opts = opts || {}
  const lang = opts.lang || 'en'
  const items = diffs(lang).concat(Effects.tiles(lang))
  if (!opts.force && opts.teacher) return false
  if (!opts.force && !items.length) { hide(); return false }
  const key = (opts.world || '') + '#' + items.map((d) => d.id + ':' + String(d.value)).join(',')
  if (!opts.force && seen.has(key)) return false
  if (!opts.force) seen.add(key)
  injectCss()
  armEsc(hide)
  let root = document.getElementById('rules-card')
  if (!root) {
    root = document.createElement('div')
    root.id = 'rules-card'
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
    const host = document.body || document.documentElement
    if (host && host.append) host.append(root)
  }
  root.hidden = false
  root.innerHTML = ''
  const card = document.createElement('div')
  card.className = 'rc-card'
  card.setAttribute('dir', lang === 'ar' || lang === 'fa-AF' ? 'rtl' : 'ltr')
  const name = Rules.templateName()
  if (name) {
    const line = document.createElement('p')
    line.className = 'rc-name'
    line.textContent = name
    card.append(line)
  }
  const title = document.createElement('div')
  title.className = 'rc-title'
  title.id = 'rc-title'
  title.textContent = items.length ? pick(UI.title, lang) : pick(UI.normal, lang)
  root.setAttribute('aria-labelledby', 'rc-title')
  card.append(title)
  if (items.length) {
    const tiles = document.createElement('div')
    tiles.className = 'rc-tiles'
    const shown = items.slice(0, 6)
    for (const d of shown) {
      const tile = document.createElement('div')
      tile.className = 'rc-tile'
      tile.dataset.id = d.id
      const ico = document.createElement('span')
      ico.className = 'rc-ico'
      ico.textContent = d.icon || '•'
      const lab = document.createElement('span')
      lab.className = 'rc-lab'
      lab.textContent = d.text
      tile.append(ico, lab)
      tiles.append(tile)
    }
    card.append(tiles)
    if (items.length > shown.length) {
      const more = document.createElement('p')
      more.className = 'rc-more'
      more.textContent = pick(UI.more, lang).replace('{n}', String(items.length - shown.length))
      card.append(more)
    }
  }
  const got = document.createElement('button')
  got.type = 'button'
  got.className = 'keycap rc-got'
  got.textContent = pick(UI.got, lang)
  got.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault()
    hide()
  })
  card.append(got)
  root.append(card)
  if (got.focus) {
    try { got.focus() } catch (e) {}
  }
  return true
}
