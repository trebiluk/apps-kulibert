// First-join HUD. Four steps, one chip at a time, saved on the player.
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
  function hotN() { return quiet() && !state.craft ? 4 : 9 }
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
  function pump() {
    let changed = false
    for (const step of ORDER) {
      if (!state.earned[step]) break
      if (state[step]) continue
      state[step] = true
      changed = true
      wait.push({ chip: true, step, text: api.t('chipNew') + ': ' + api.t(WORD[step]) })
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
      const i = wait.findIndex((row) => !row.chip)
      if (i >= 0) wait[i] = job
      else wait.push(job)
      return
    }
    show(job)
  }
  function kick() {
    const next = wait.shift()
    if (next) show(next)
  }
  function show(job) {
    const el = document.getElementById('toast')
    if (!el) return
    holding = !!job.chip
    if (document.body) document.body.classList.add('tip-on')
    el.replaceChildren()
    el.classList.toggle('new-chip', !!job.chip)
    if (job.chip && api.icon) {
      const ico = api.icon(job.step)
      if (ico) {
        const wrap = document.createElement('span')
        wrap.className = 'chip-ico'
        wrap.append(ico)
        el.append(wrap)
      }
    }
    el.append(document.createTextNode(job.text || ''))
    if (job.act && job.act.label && job.act.run) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'toast-hold'
      b.textContent = job.act.label
      b.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        job.act.run()
        finish()
      })
      el.append(b)
    }
    el.hidden = false
    clearTimeout(timer)
    const ms = job.chip ? 2000 : (job.act ? 8000 : 2400)
    timer = setTimeout(finish, ms)
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
    }
    if (document.body) document.body.classList.remove('tip-on')
  }
  apply()
  return { quiet, hotN, workbenchOn, botOn, machinesOn, allOn, dump, adopt, setAll, note, say, apply }
}
