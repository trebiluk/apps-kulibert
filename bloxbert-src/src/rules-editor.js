// Teacher scenario editor. Shell only: toggles, search, reset. No templates.
import { GROUPS, Rules } from './rules.js'
import { Effects } from './effects.js'

const L = (en, uk, ru, es, ar, fa, rw, ti) => ({ en, uk, ru, es, ar, 'fa-AF': fa, rw, ti })

const UI = {
  title: L('Rules', 'Правила', 'Правила', 'Reglas', 'القواعد', 'قانون‌ها', 'Amategeko', 'ሕግታት'),
  search: L('Search', 'Пошук', 'Поиск', 'Buscar', 'بحث', 'جستجو', 'Shakisha', 'ድለ'),
  changedOnly: L('Changed only', 'Лише змінені', 'Только изменённые', 'Solo cambios', 'المتغير فقط', 'فقط تغییر یافته', 'Ibyahinduwe gusa', 'ዝተቐየሩ ጥራይ'),
  reset: L('Reset to normal', 'Скинути до звичного', 'Сбросить к обычному', 'Volver a lo normal', 'إرجاع إلى الطبيعي', 'برگشت به عادی', 'Subiza ku bisanzwe', 'ናብ ልሙድ መልስ'),
  resetAsk: L('Reset every rule to normal?', 'Скинути всі правила до звичного?', 'Сбросить все правила к обычному?', '¿Volver todas las reglas a lo normal?', 'إرجاع كل القواعد إلى الطبيعي؟', 'همه قانون‌ها به عادی برگردد؟', 'Subiza amategeko yose ku bisanzwe?', 'ኩሉ ሕግታት ናብ ልሙድ ይመለስ?'),
  yes: L('Yes', 'Так', 'Да', 'Sí', 'نعم', 'بله', 'Yego', 'እወ'),
  no: L('Cancel', 'Скасувати', 'Отмена', 'Cancelar', 'إلغاء', 'لغو', 'Hagarika', 'ሰርዝ'),
  changedNote: L('Rules changed', 'Правила змінено', 'Правила изменены', 'Reglas cambiadas', 'تغيرت القواعد', 'قانون‌ها تغییر کرد', 'Amategeko yahindutse', 'ሕግታት ተቐይሩ'),
  soon: L('Coming soon', 'Незабаром', 'Скоро', 'Pronto', 'قريبًا', 'به زودی', 'Vuba', 'ቀሪቡ'),
  packOff: L('Pack not installed', 'Пакет не встановлено', 'Пакет не установлен', 'El paquete no está instalado', 'الحزمة غير مثبتة', 'بسته نصب نیست', 'Ipaki ntiyashyizweho', 'ጥቕሊ ኣይተተኽለን'),
  changedN: L('{n} changed', '{n} змінено', '{n} изменено', '{n} cambiadas', '{n} متغيرة', '{n} تغییر', '{n} byahinduwe', '{n} ተቐይሩ'),
  remove: L('Remove', 'Прибрати', 'Убрать', 'Quitar', 'إزالة', 'برداشتن', 'Kuraho', 'ኣልግስ'),
  clearFx: L('Clear all effects', 'Прибрати всі ефекти', 'Убрать все эффекты', 'Quitar todos los efectos', 'إزالة كل التأثيرات', 'همه اثرها را بردار', 'Kuraho ingaruka zose', 'ኩሉ ጽልዋታት ኣልግስ'),
}

const CSS = `#sheet[data-panel=rules] .ggrid{display:block;overflow:visible}
#sheet[data-panel=rules] .re-wrap{display:flex;flex-direction:column;gap:var(--ks-pad);min-width:0}
#sheet[data-panel=rules] .re-search{width:100%;min-height:var(--ks-touch);box-sizing:border-box;font:inherit;font-size:var(--ks-fs-m);border-radius:var(--ks-radius);padding:8px var(--ks-pad);background:#13303A;color:#E6EEF2;border:1px solid #1F8A8A}
#sheet[data-panel=rules] .re-panes{display:flex;flex-direction:column;gap:var(--ks-pad);min-width:0}
@media(min-width:700px){#sheet[data-panel=rules] .re-panes{flex-direction:row;align-items:flex-start}#sheet[data-panel=rules] .re-groups{flex:0 0 11rem}#sheet[data-panel=rules] .re-rows{flex:1;min-width:0}}
#sheet[data-panel=rules] .re-row{display:flex;gap:8px;align-items:center;min-width:0;min-height:var(--ks-touch)}
#sheet[data-panel=rules] .re-copy{flex:1;min-width:0;overflow-wrap:anywhere}
#sheet[data-panel=rules] .re-copy .re-name{font-weight:700}
#sheet[data-panel=rules] .re-copy .re-desc{display:block;font-size:var(--ks-fs-s);font-weight:500}
#sheet[data-panel=rules] .re-toggle{flex:none;min-width:var(--ks-touch);min-height:var(--ks-touch);padding:0}
#sheet[data-panel=rules] .re-pack{opacity:.55}
#sheet[data-panel=rules] .re-reset,#sheet[data-panel=rules] .re-yes{color:#f59e0b;border-color:#f59e0b}
#sheet[data-panel=rules] .re-groups .gtile{min-height:var(--ks-touch);align-items:flex-start;text-align:start}
#sheet[data-panel=rules] .re-find{display:flex;flex-direction:column;gap:4px;font-size:var(--ks-fs-s)}
#sheet[data-panel=rules] .re-rows{min-width:0;overflow:visible}
#sheet[data-panel=rules] .re-seg{display:flex;flex-wrap:wrap;gap:4px;justify-content:flex-end;max-width:100%}
#sheet[data-panel=rules] .re-opt{flex:none;min-width:var(--ks-touch);min-height:var(--ks-touch);padding:0 6px}
#sheet[data-panel=rules] .re-soon-tag{display:block;font-size:var(--ks-fs-s);font-weight:500}
#sheet[data-panel=rules] .re-fx .re-opt.on{outline:2px solid #22D3EE}
`

function pick(pack, lang) {
  if (!pack) return ''
  return pack[lang] || pack.en || ''
}

export function rulesWord(lang) {
  return pick(UI.title, lang || 'en')
}

function injectCss() {
  if (typeof document === 'undefined' || !document.getElementById || !document.createElement) return
  if (document.getElementById('rules-editor-css')) return
  const s = document.createElement('sty' + 'le')
  s.id = 'rules-editor-css'
  s.textContent = CSS
  const parent = document.head || document.documentElement
  if (parent && parent.append) parent.append(s)
}

function btn(className, text, run) {
  const b = document.createElement('button')
  b.type = 'button'
  b.className = className
  b.textContent = text
  b.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    run()
  })
  return b
}

export function paintRules(root, api) {
  injectCss()
  api = api || {}
  const lang = api.lang || 'en'
  const say = (key) => pick(UI[key], lang)
  const state = { q: '', changed: false, group: 'building', note: false, confirm: false }
  const fxPick = {}
  const regs = () => Rules.rows()

  function commit() {
    state.note = true
    if (api.markDirty) api.markDirty()
    try {
      const job = api.save && api.save()
      if (job && typeof job.catch === 'function') job.catch(() => {})
    } catch (e) {}
    draw()
  }

  function matches(label, desc) {
    const q = state.q.trim().toLowerCase()
    if (!q) return true
    return (String(label || '') + ' ' + String(desc || '')).toLowerCase().includes(q)
  }

  function visibleRows() {
    return regs().filter((d) => {
      if (state.changed && Rules.value(d.id) === d.def) return false
      if (state.q) return matches(pick(d.label, lang), pick(d.desc, lang))
      if (state.changed) return true
      return d.display === state.group
    })
  }

  function visiblePack() {
    return Rules.unknown().filter((u) => {
      if (state.q) return matches(u.id, say('packOff'))
      if (state.changed) return true
      return state.group === 'pack'
    })
  }

  function draw() {
    root.innerHTML = ''
    const wrap = document.createElement('div')
    wrap.className = 're-wrap wide'
    wrap.setAttribute('dir', lang === 'ar' || lang === 'fa-AF' ? 'rtl' : 'ltr')

    const find = document.createElement('div')
    find.className = 're-find'
    const findLab = document.createElement('span')
    findLab.textContent = say('search')
    find.append(findLab)
    const input = document.createElement('input')
    input.type = 'search'
    input.className = 're-search'
    input.value = state.q
    input.setAttribute('aria-label', say('search'))
    input.addEventListener('input', () => {
      state.q = input.value
      draw()
      const again = root.querySelector('.re-search')
      if (!again) return
      again.value = state.q
      if (again.focus) again.focus()
      if (again.setSelectionRange) {
        const n = state.q.length
        try { again.setSelectionRange(n, n) } catch (e) {}
      }
    })
    find.append(input)
    wrap.append(find)

    const only = btn('keycap re-changed', say('changedOnly'), () => {
      state.changed = !state.changed
      draw()
    })
    only.setAttribute('aria-pressed', state.changed ? 'true' : 'false')
    wrap.append(only)

    if (state.note) {
      const note = document.createElement('p')
      note.className = 'gnote re-note'
      note.setAttribute('role', 'status')
      note.textContent = say('changedNote')
      wrap.append(note)
    }

    const panes = document.createElement('div')
    panes.className = 're-panes'
    const groups = document.createElement('div')
    groups.className = 're-groups'
    const list = document.createElement('div')
    list.className = 're-rows'

    const order = Object.keys(GROUPS)
    if (Rules.unknown().length) order.push('pack')
    for (const id of order) {
      const members = id === 'pack' ? [] : regs().filter((d) => d.display === id)
      const n = id === 'pack' ? Rules.unknown().length : id === 'effects' ? Effects.list().length : members.filter((d) => Rules.value(d.id) !== d.def).length
      const name = id === 'pack' ? say('packOff') : pick(GROUPS[id], lang)
      const b = btn('gtile re-group' + (state.group === id ? ' on' : ''), '', () => {
        state.group = id
        state.q = ''
        draw()
      })
      b.dataset.group = id
      b.setAttribute('aria-pressed', state.group === id ? 'true' : 'false')
      const lab = document.createElement('span')
      lab.className = 'glbl'
      lab.textContent = name
      const count = document.createElement('span')
      count.className = 'gnote'
      count.textContent = say('changedN').replace('{n}', String(n))
      b.append(lab, count)
      groups.append(b)
    }

    for (const d of visibleRows()) {
      const row = document.createElement('div')
      row.className = 're-row' + (d.soon ? ' re-soon' : '')
      row.dataset.id = d.id
      const ico = document.createElement('span')
      ico.className = 'gic'
      ico.textContent = d.icon || '•'
      const copy = document.createElement('span')
      copy.className = 're-copy'
      const name = document.createElement('span')
      name.className = 're-name'
      name.textContent = pick(d.label, lang)
      const desc = document.createElement('span')
      desc.className = 're-desc'
      desc.textContent = pick(d.desc, lang)
      copy.append(name, desc)
      if (d.type === 'pick') {
        const seg = document.createElement('span')
        seg.className = 're-seg'
        const cur = Rules.value(d.id)
        const opts = Array.isArray(d.options) ? d.options : []
        for (const o of opts) {
          const oid = typeof o === 'string' ? o : o.id
          const choice = document.createElement('button')
          choice.type = 'button'
          choice.className = 'keycap re-opt' + (cur === oid ? ' on' : '')
          choice.textContent = typeof o === 'string' ? oid : pick(o.label, lang)
          choice.dataset.opt = oid
          choice.disabled = !!d.soon
          choice.setAttribute('aria-pressed', cur === oid ? 'true' : 'false')
          choice.setAttribute('aria-label', pick(d.label, lang) + ' ' + choice.textContent)
          choice.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            if (choice.disabled || d.soon) return
            Rules.set(d.id, oid)
            commit()
          })
          seg.append(choice)
        }
        if (d.soon) {
          const tag = document.createElement('span')
          tag.className = 're-soon-tag'
          tag.textContent = say('soon')
          copy.append(tag)
        }
        row.append(ico, copy, seg)
        list.append(row)
        continue
      }
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'keycap re-toggle'
      if (d.soon) {
        toggle.disabled = true
        toggle.textContent = say('soon')
        toggle.setAttribute('aria-label', pick(d.label, lang) + '. ' + say('soon'))
      } else {
        const on = Rules.value(d.id) !== false
        toggle.textContent = on ? '✓' : '✕'
        toggle.setAttribute('aria-pressed', on ? 'true' : 'false')
        toggle.setAttribute('aria-label', pick(d.label, lang))
        toggle.addEventListener('click', (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (toggle.disabled || d.soon) return
          Rules.set(d.id, Rules.value(d.id) === false)
          commit()
        })
      }
      row.append(ico, copy, toggle)
      list.append(row)
    }

    for (const u of visiblePack()) {
      const row = document.createElement('div')
      row.className = 're-row re-pack'
      row.dataset.id = u.id
      const ico = document.createElement('span')
      ico.className = 'gic'
      ico.textContent = '•'
      const copy = document.createElement('span')
      copy.className = 're-copy'
      const name = document.createElement('span')
      name.className = 're-name'
      name.textContent = u.id
      const desc = document.createElement('span')
      desc.className = 're-desc'
      desc.textContent = say('packOff')
      copy.append(name, desc)
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'keycap re-toggle'
      toggle.disabled = true
      toggle.textContent = say('soon')
      row.append(ico, copy, toggle)
      list.append(row)
    }

    if (!state.changed) {
      Effects.useLang(lang)
      const q = state.q.trim().toLowerCase()
      if (!q && state.group === 'effects' && Effects.list().length) {
        const clearAll = btn('keycap re-fx-clear', say('clearFx'), () => {
          const ids = Effects.list().map((e) => e.id)
          for (const id of ids) Effects.clear(id)
          draw()
        })
        clearAll.dataset.act = 'clear-all'
        list.append(clearAll)
      }
      for (const d of Effects.catalog()) {
        const nameTxt = pick(d.label, lang)
        const descTxt = pick(d.desc, lang)
        if (q) { if (!(nameTxt + ' ' + descTxt).toLowerCase().includes(q)) continue }
        else if (state.group !== 'effects') continue
        const row = document.createElement('div')
        row.className = 're-row re-fx'
        row.dataset.id = d.id
        const ico = document.createElement('span')
        ico.className = 'gic'
        ico.textContent = d.icon || '•'
        const copy = document.createElement('span')
        copy.className = 're-copy'
        const name = document.createElement('span')
        name.className = 're-name'
        name.textContent = nameTxt
        const desc = document.createElement('span')
        desc.className = 're-desc'
        desc.textContent = descTxt
        copy.append(name, desc)
        const seg = document.createElement('span')
        seg.className = 're-seg'
        const pickLv = fxPick[d.id] || d.levels[0]
        if (d.levels.length > 1) {
          for (const lv of d.levels) {
            const choice = document.createElement('button')
            choice.type = 'button'
            choice.className = 'keycap re-opt' + (pickLv === lv ? ' on' : '')
            choice.dataset.fx = d.id
            choice.dataset.level = String(lv)
            choice.textContent = lv >= 2 ? 'II' : 'I'
            choice.setAttribute('aria-pressed', pickLv === lv ? 'true' : 'false')
            choice.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              fxPick[d.id] = lv
              draw()
            })
            seg.append(choice)
          }
        }
        for (const mins of [1, 5, 10]) {
          const give = document.createElement('button')
          give.type = 'button'
          give.className = 'keycap re-opt'
          give.dataset.fx = d.id
          give.dataset.min = String(mins)
          give.textContent = String(mins)
          give.setAttribute('aria-label', nameTxt + ' ' + mins)
          give.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            Effects.useLang(lang)
            Effects.give(d.id, { level: fxPick[d.id] || d.levels[0], ms: mins * 60000 })
            draw()
          })
          seg.append(give)
        }
        if (Effects.has(d.id)) {
          const off = document.createElement('button')
          off.type = 'button'
          off.className = 'keycap re-opt re-fx-x'
          off.dataset.fx = d.id
          off.dataset.act = 'remove'
          off.textContent = '\u00d7'
          off.setAttribute('aria-label', say('remove') + ' ' + nameTxt)
          off.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            Effects.clear(d.id)
            draw()
          })
          seg.append(off)
        }
        row.append(ico, copy, seg)
        list.append(row)
      }
    }

    panes.append(groups, list)
    wrap.append(panes)

    const foot = document.createElement('div')
    foot.className = 're-foot keys'
    if (state.confirm) {
      const ask = document.createElement('p')
      ask.className = 'gnote re-ask'
      ask.textContent = say('resetAsk')
      foot.append(ask)
      foot.append(btn('keycap danger re-yes', say('yes'), () => {
        Rules.load({})
        state.confirm = false
        commit()
      }))
      foot.append(btn('keycap re-no', say('no'), () => {
        state.confirm = false
        draw()
      }))
    } else {
      foot.append(btn('keycap danger re-reset', say('reset'), () => {
        state.confirm = true
        draw()
      }))
    }
    wrap.append(foot)
    root.append(wrap)
  }

  draw()
}
