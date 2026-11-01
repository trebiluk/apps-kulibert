// First-join HUD. Four steps, one chip at a time, saved on the player.
import { showToast } from './tips.js'
const ORDER = ['tree', 'craft', 'bench', 'run']
const WORD = { tree: 'workbench', craft: 'hotbar', bench: 'botTab', run: 'craftMachines' }

export function createCalm(api) {
  const state = {
    tracked: true,
    all: false,
    tree: false,
    craft: false,
    bench: false,
    run: false,
    earned: { tree: false, craft: false, bench: false, run: false },
  }
  const wait = []
  let holding = false
  let timer = 0

  function creative() { return !!(api.creative && api.creative()) }
  function doneAll() { return state.tree && state.craft && state.bench && state.run }
  function quiet() { return state.tracked && !state.all && !creative() && !doneAll() }
  function hotN() { return 9 }
  function workbenchOn() { return !quiet() || state.tree }
  function botOn() { return !quiet() || state.bench }
  function machinesOn() { return !quiet() || state.run }
  function allOn() { return !!state.all }

  function apply() {
    if (document.body) document.body.classList.toggle('hud-calm', quiet())
    if (api.repaint) api.repaint()
  }
  function dump() {
    return {
      v: 1,
      all: state.all ? 1 : 0,
      tree: state.tree ? 1 : 0,
      craft: state.craft ? 1 : 0,
      bench: state.bench ? 1 : 0,
      run: state.run ? 1 : 0,
    }
  }
  function fill(on) {
    state.all = !!on
    for (const step of ORDER) {
      state[step] = !!on
      state.earned[step] = !!on
    }
  }
  function adopt(raw, played) {
    state.tracked = true
    wait.length = 0
    holding = false
    if (raw && raw.v === 1) {
      state.all = !!raw.all
      for (const step of ORDER) {
        state[step] = !!raw[step]
        state.earned[step] = !!raw[step]
      }
    } else if (played) fill(true)
    else fill(false)
    apply()
  }
  function setAll(on) {
    state.all = !!on
    apply()
    if (api.dirty) api.dirty()
  }
  function note(step) {
    if (!state.tracked || creative() || !ORDER.includes(step)) return
    state.earned[step] = true
    if (state.all) {
      if (!state[step]) {
        state[step] = true
        if (api.dirty) api.dirty()
      }
      return
    }
    pump()
  }
  function pathSays(word) {
    const needle = String(word || '').trim()
    if (!needle) return false
    const el = document.getElementById('path-chip')
    if (!el || el.hidden) return false
    const title = el.querySelector('.path-title')
    const text = title ? String(title.textContent || '') : ''
    return text.toLowerCase().indexOf(needle.toLowerCase()) >= 0
  }
  function pump() {
    let changed = false
    for (const step of ORDER) {
      if (!state.earned[step]) break
      if (state[step]) continue
      state[step] = true
      changed = true
      const named = api.t(WORD[step])
      // 2.5.482: the path chip already names this step. Don't toast the same words.
      if (!pathSays(named)) wait.push({ chip: true, step, text: api.t('chipNew') + ': ' + named })
    }
    if (!changed) return
    apply()
    if (api.dirty) api.dirty()
    if (!holding) kick()
  }
  function say(text, act) {
    if (!text) return
    const job = { text, act: act || null }
    if (holding) {
      // a waiting Maker Page line (📜, lore/pages.js) is a one-time story moment: never replace it
      const i = wait.findIndex((row) => !row.chip && !row.nice && !String(row.text || '').startsWith('📜'))
      if (i >= 0) wait[i] = job
      else wait.push(job)
      return
    }
    show(job)
  }
  function cheer(kind) {
    const key = { log: 'niceLog', make: 'niceMake', place: 'nicePlace', wall: 'niceWall' }[kind]
    if (!key) return
    wait.push({ nice: true, step: 'nice-' + kind, text: api.t(key) })
    if (!holding) kick()
  }
  function chime() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      const ctx = chime.ac || (chime.ac = new AC())
      if (ctx.state === 'suspended') ctx.resume().catch(() => {})
      const o = ctx.createOscillator()
      const gain = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(520, ctx.currentTime)
      o.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.12)
      gain.gain.setValueAtTime(0.0001, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22)
      o.connect(gain)
      gain.connect(ctx.destination)
      o.start()
      o.stop(ctx.currentTime + 0.24)
    } catch (e) {}
  }
  function kick() {
    const next = wait.shift()
    if (next) show(next)
  }
  function show(job) {
    if (job.nice) chime()
    showToast(job.text || '', {
      act: job.act,
      ms: job.nice ? 1500 : job.chip ? 2000 : (job.act ? 8000 : 2400),
      chip: !!job.chip,
      id: job.step || '',
      fill: (el) => {
        el.classList.toggle('new-chip', !!job.chip)
        el.classList.toggle('nice-chip', !!job.nice)
        if (!(job.chip || job.nice) || !api.icon) return
        const ico = api.icon(job.step)
        if (!ico) return
        const wrap = document.createElement('span')
        wrap.className = 'chip-ico'
        wrap.append(ico)
        el.append(wrap)
      },
    })
    holding = false
    if (wait.length) kick()
  }
  function finish() {
    clearTimeout(timer)
    timer = 0
    holding = false
    if (wait.length) { kick(); return }
    const el = document.getElementById('toast')
    if (el) {
      el.hidden = true
      el.classList.remove('new-chip')
      el.classList.remove('nice-chip')
    }
    if (document.body) document.body.classList.remove('tip-on')
  }
  apply()
  return { quiet, hotN, workbenchOn, botOn, machinesOn, allOn, dump, adopt, setAll, note, say, cheer, apply }
}
