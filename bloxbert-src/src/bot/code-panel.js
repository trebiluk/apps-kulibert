import css from './code-panel.css'
import { CHIP_IDS, TRAY_N, addStep, removeStep } from './program.js'

const ICON = {
  forward: '<path d="M12 4 L12 18 M6 10 L12 4 L18 10" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  turn: '<path d="M7 16 A6 6 0 1 1 16 12 M16 12 L12 8 M16 12 L12 16" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  dig: '<path d="M6 16 L14 8 M14 8 L18 8 L18 12" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  place: '<path d="M5 14 L12 10 L19 14 L12 18 Z M12 10 L12 4" fill="none" stroke="#FF8A1F" stroke-width="2.2" stroke-linejoin="round"/>',
  repeat: '<path d="M7 8 H16 L13 5 M17 16 H8 L11 19" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  end: '<rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="#FF8A1F" stroke-width="2.4"/>',
}

let styleOn = false
function mountCss() {
  if (styleOn) return
  styleOn = true
  const tag = document.createElement('style')
  tag.id = 'bot-code-css'
  tag.textContent = css
  document.head.append(tag)
}

function icon(id) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.innerHTML = ICON[id] || ''
  return svg
}

function word(t, id) {
  return t('bot' + id.charAt(0).toUpperCase() + id.slice(1))
}

export function openCodePanel(opts) {
  mountCss()
  closeCodePanel()
  const t = opts.t
  const program = opts.program
  const root = document.createElement('div')
  root.id = 'bot-code'
  root.setAttribute('role', 'dialog')
  root.setAttribute('aria-modal', 'true')
  const card = document.createElement('div')
  card.className = 'bot-card'
  const bar = document.createElement('div')
  bar.className = 'bot-bar'
  const title = document.createElement('h2')
  title.className = 'bot-title'
  title.id = 'bot-code-title'
  title.textContent = t('code')
  root.setAttribute('aria-labelledby', 'bot-code-title')
  const x = document.createElement('button')
  x.type = 'button'
  x.className = 'bot-x'
  x.setAttribute('aria-label', t('close'))
  x.textContent = '×'
  x.addEventListener('click', () => closeCodePanel())
  bar.append(title, x)
  const layout = document.createElement('div')
  layout.className = 'bot-layout'
  const palette = document.createElement('div')
  palette.className = 'bot-palette'
  for (const id of CHIP_IDS) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'bot-chip'
    b.append(icon(id))
    const lab = document.createElement('span')
    lab.textContent = word(t, id)
    b.append(lab)
    b.addEventListener('click', () => {
      if (!addStep(program, id)) return
      if (opts.onChange) opts.onChange()
      paint()
    })
    palette.append(b)
  }
  const main = document.createElement('div')
  main.className = 'bot-main'
  const tray = document.createElement('div')
  tray.className = 'bot-tray'
  const keys = document.createElement('div')
  keys.className = 'bot-keys'
  for (const key of ['botRun', 'botStop', 'botUndo']) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'bot-key'
    b.disabled = true
    b.textContent = t(key) + ' · ' + t('botSoon')
    keys.append(b)
  }
  main.append(tray, keys)
  layout.append(palette, main)
  card.append(bar, layout)
  root.append(card)
  document.body.append(root)
  function paint() {
    tray.replaceChildren()
    const n = program.steps.length
    for (let i = 0; i < TRAY_N; i++) {
      const id = program.steps[i]
      const slot = document.createElement('div')
      slot.className = 'bot-slot' + (id ? '' : ' empty') + (!id && i === n ? ' cursor' : '')
      slot.dataset.slot = String(i)
      if (id) {
        slot.dataset.step = id
        slot.append(icon(id))
        const lab = document.createElement('span')
        lab.textContent = word(t, id)
        const del = document.createElement('button')
        del.type = 'button'
        del.className = 'bot-x'
        del.setAttribute('aria-label', t('close'))
        del.textContent = '×'
        del.addEventListener('click', () => {
          removeStep(program, i)
          if (opts.onChange) opts.onChange()
          paint()
        })
        slot.append(lab, del)
      }
      tray.append(slot)
    }
  }
  paint()
  x.focus()
  return root
}

export function closeCodePanel() {
  const el = document.getElementById('bot-code')
  if (el) el.remove()
}

export function codePanelOpen() {
  return !!document.getElementById('bot-code')
}
