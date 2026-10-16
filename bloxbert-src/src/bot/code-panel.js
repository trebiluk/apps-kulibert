import css from './code-panel.css'
import { CHIP_IDS, TRAY_N, addStep, removeStep, bumpRepeat, flipTurn } from './program.js'

const ICON = {
  forward: '<path d="M12 4 L12 18 M6 10 L12 4 L18 10" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  turn: '<path d="M7 16 A6 6 0 1 1 16 12 M16 12 L12 8 M16 12 L12 16" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  dig: '<path d="M6 16 L14 8 M14 8 L18 8 L18 12" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  place: '<path d="M5 14 L12 10 L19 14 L12 18 Z M12 10 L12 4" fill="none" stroke="#FF8A1F" stroke-width="2.2" stroke-linejoin="round"/>',
  repeat: '<path d="M7 8 H16 L13 5 M17 16 H8 L11 19" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  end: '<rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="#FF8A1F" stroke-width="2.4"/>',
  run: '<path d="M8 5 L19 12 L8 19 Z" fill="#FF8A1F"/>',
  stop: '<rect x="7" y="7" width="10" height="10" rx="1" fill="#FF8A1F"/>',
  undo: '<path d="M7 12 H16 A4 4 0 0 0 16 8 H10 M7 12 L11 8 M7 12 L11 16" fill="none" stroke="#FF8A1F" stroke-width="2.2" stroke-linecap="round"/>',
  clear: '<path d="M8 8 L16 16 M16 8 L8 16" fill="none" stroke="#FF8A1F" stroke-width="2.4" stroke-linecap="round"/>',
  star: '<path d="M12 4 L14 9 H19 L15 12 L17 18 L12 14 L7 18 L9 12 L5 9 H10 Z" fill="#FF8A1F"/>',
  warn: '<path d="M12 4 L20 18 H4 Z" fill="none" stroke="#FF8A1F" stroke-width="2"/><path d="M12 9 V13" stroke="#E6EEF2" stroke-width="2" stroke-linecap="round"/>',
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

function wonFlag() {
  try { return localStorage.getItem('bloxbert-bot-win') === '1' } catch (e) { return false }
}

export function openCodePanel(opts) {
  mountCss()
  closeCodePanel()
  const t = opts.t
  const program = opts.program
  const reduce = opts.reduce ? opts.reduce() : false
  let pulse = false
  if (!wonFlag() && !reduce) {
    try {
      if (!localStorage.getItem('bloxbert-bot-pulsed')) {
        pulse = true
        localStorage.setItem('bloxbert-bot-pulsed', '1')
      }
    } catch (e) { pulse = true }
  }
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
  x.append(icon('clear'))
  const xWord = document.createElement('span')
  xWord.className = 'bot-x-word'
  xWord.textContent = t('close')
  x.append(xWord)
  x.addEventListener('click', () => { closeCodePanel(); if (opts.onClose) opts.onClose() })
  bar.append(title, x)
  const challenge = document.createElement('p')
  challenge.className = 'bot-challenge'
  challenge.textContent = t('botChallenge')
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
      if (opts.running && opts.running()) return
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
  const status = document.createElement('div')
  status.className = 'bot-status'
  status.hidden = true
  const live = document.createElement('div')
  live.className = 'bot-live'
  live.setAttribute('role', 'status')
  live.setAttribute('aria-live', 'polite')
  const keys = document.createElement('div')
  keys.className = 'bot-keys'
  const run = keyButton('run', t('botRun'), 'bot-run')
  const stop = keyButton('stop', t('botStop'), 'bot-stop')
  const undo = keyButton('undo', t('botUndo'), 'bot-undo')
  const clear = keyButton('clear', t('botClear'), 'bot-clear')
  if (pulse) run.classList.add('pulse')
  run.addEventListener('click', () => { if (opts.onRun) opts.onRun() })
  stop.addEventListener('click', () => { if (opts.onStop) opts.onStop() })
  undo.addEventListener('click', () => { if (opts.onUndo) opts.onUndo() })
  clear.addEventListener('click', () => { if (opts.onClear) opts.onClear(); paint() })
  keys.append(run, stop, undo, clear)
  main.append(tray, status, keys)
  layout.append(palette, main)
  card.append(bar, challenge, layout, live)
  root.append(card)
  document.body.append(root)
  let active = -1
  let mode = ''
  function keyButton(id, label, cls) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'bot-key ' + cls
    b.append(icon(id))
    const lab = document.createElement('span')
    lab.textContent = label
    b.append(lab)
    b.setAttribute('aria-label', label)
    return b
  }
  function locked() { return !!(opts.running && opts.running()) }
  function paint() {
    const showChallenge = opts.challenge ? opts.challenge() : !wonFlag()
    challenge.hidden = !showChallenge
    tray.replaceChildren()
    const n = program.steps.length
    for (let i = 0; i < TRAY_N; i++) {
      const step = program.steps[i]
      const slot = document.createElement('div')
      slot.className = 'bot-slot' + (step ? '' : ' empty') + (!step && i === n ? ' cursor' : '')
      slot.dataset.slot = String(i)
      if (i === active && mode === 'on') slot.classList.add('on')
      if (i === active && mode === 'bad') slot.classList.add('bad')
      if (!step) { tray.append(slot); continue }
      slot.dataset.step = step.id
      if (i === active && (mode === 'on' || mode === 'bad')) {
        const mark = document.createElement('span')
        mark.className = 'bot-mark'
        mark.setAttribute('aria-hidden', 'true')
        mark.textContent = mode === 'bad' ? '⚠' : '▶'
        slot.append(mark)
      }
      slot.append(icon(step.id))
      const lab = document.createElement('span')
      lab.textContent = word(t, step.id)
      slot.append(lab)
      if (step.id === 'repeat') {
        const num = document.createElement('button')
        num.type = 'button'
        num.className = 'bot-num'
        num.textContent = String(step.n || 2)
        num.setAttribute('aria-label', word(t, 'repeat') + ' ' + num.textContent)
        num.addEventListener('click', () => {
          if (locked()) return
          bumpRepeat(step)
          if (opts.onChange) opts.onChange()
          paint()
        })
        slot.append(num)
      }
      if (step.id === 'turn') {
        const dir = document.createElement('button')
        dir.type = 'button'
        dir.className = 'bot-num'
        const right = step.dir !== 'l'
        dir.textContent = right ? t('botRight') : t('botLeft')
        dir.setAttribute('aria-label', word(t, 'turn') + ' ' + dir.textContent)
        dir.addEventListener('click', () => {
          if (locked()) return
          flipTurn(step)
          if (opts.onChange) opts.onChange()
          paint()
        })
        slot.append(dir)
      }
      if (i === active && mode === 'bad') {
        const bad = document.createElement('span')
        bad.className = 'bot-badword'
        bad.textContent = t('botBlocked')
        slot.append(bad)
      }
      const del = document.createElement('button')
      del.type = 'button'
      del.className = 'bot-x'
      del.setAttribute('aria-label', t('close'))
      del.append(icon('clear'))
      del.addEventListener('click', () => {
        if (locked()) return
        removeStep(program, i)
        if (opts.onChange) opts.onChange()
        paint()
      })
      slot.append(del)
      tray.append(slot)
    }
    const going = locked()
    run.disabled = going || program.steps.length === 0
    stop.disabled = !going
    undo.disabled = going || !(opts.canUndo && opts.canUndo())
    clear.disabled = going || program.steps.length === 0
    for (const b of palette.querySelectorAll('button')) b.disabled = going
  }
  function showNote(kind) {
    status.replaceChildren()
    if (!kind) { status.hidden = true; return }
    status.hidden = false
    status.className = 'bot-status ' + kind
    status.append(icon(kind === 'win' ? 'star' : 'warn'))
    const lab = document.createElement('span')
    lab.textContent = kind === 'win' ? t('botWin') : t('botTooMany')
    status.append(lab)
  }
  paint()
  run.focus()
  return {
    root,
    repaint: paint,
    mark(index, next) {
      active = index
      mode = next || ''
      paint()
      const slot = tray.querySelector('.bot-slot.on, .bot-slot.bad')
      if (slot) {
        const left = slot.offsetLeft - 8
        if (left < tray.scrollLeft || left + slot.offsetWidth > tray.scrollLeft + tray.clientWidth) tray.scrollLeft = Math.max(0, left)
      }
    },
    strip(on) { root.classList.toggle('bot-strip', !!on) },
    note: showNote,
    say(text) { live.textContent = '' ; if (text) live.textContent = text },
    keys: paint,
  }
}

export function closeCodePanel() {
  const el = document.getElementById('bot-code')
  if (el) el.remove()
}

export function codePanelOpen() {
  return !!document.getElementById('bot-code')
}
