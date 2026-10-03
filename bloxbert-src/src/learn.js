// Picture tour, Try this goals, accessibility prefs, and the teacher outbox. Local only.
const KEY = 'bloxbert-learn'
export function createLearn(api) {
  const state = load()
  const goals = [
    { id: 'place10', need: 10, pay: 5, n: 0 },
    { id: 'fillBox', need: 1, pay: 5, n: 0 },
    { id: 'planks', need: 1, pay: 5, n: 0 },
    { id: 'sell3', need: 3, pay: 5, n: 0 },
    { id: 'stock', need: 1, pay: 10, n: 0 },
  ]
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) {} }
  function tourOn() { return !state.tourDone }
  function skipTour() { state.tourDone = true; save() }
  function resetTour() { state.tourDone = false; save() }
  function bump(id, n = 1) {
    const g = goals.find((x) => x.id === id)
    if (!g || g.done) return
    g.n += n
    if (g.n >= g.need) { g.done = true; api.pay(g.pay, id); api.toast(api.t('goalDone')) }
    save()
  }
  function a11y(patch) {
    state.a11y = Object.assign({ text: 'M', contrast: false, hold: true, gentle: false, robots: false }, state.a11y || {}, patch || {})
    document.documentElement.dataset.a11y = state.a11y.contrast ? 'contrast' : ''
    save()
    return state.a11y
  }
  function outbox() { return state.outbox || (state.outbox = []) }
  function send(amount, perk) {
    const row = { id: 'o' + Date.now(), at: Date.now(), amount, unit: 'cogs', perk, status: 'waiting' }
    outbox().push(row)
    save()
    return row
  }
  function paintTour(g) {
    const steps = ['tourMove', 'tourLook', 'tourPlace', 'tourBar', 'tourShop', 'tourTools']
    let i = 0
    function draw() {
      g.innerHTML = ''
      const p = document.createElement('p')
      p.className = 'gnote'
      p.textContent = api.t(steps[i])
      g.append(p)
      const next = document.createElement('button')
      next.type = 'button'
      next.className = 'gtile'
      next.innerHTML = '<span class="gic">▶</span><span class="glbl">' + api.t('next') + '</span>'
      next.addEventListener('click', () => { if (i < steps.length - 1) { i++; draw() } else { skipTour(); api.close() } })
      const skip = document.createElement('button')
      skip.type = 'button'
      skip.className = 'gtile'
      skip.innerHTML = '<span class="gic">✕</span><span class="glbl">' + api.t('skip') + '</span>'
      skip.addEventListener('click', () => { skipTour(); api.close() })
      g.append(next, skip)
    }
    draw()
  }
  function paintGoals(g) {
    const g0 = goals.find((x) => !x.done) || goals[goals.length - 1]
    const p = document.createElement('p')
    p.className = 'gnote'
    p.textContent = api.t(g0.id) + ' ' + g0.n + '/' + g0.need
    g.append(p)
  }
  function paintA11y(g) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile'
    b.innerHTML = '<span class="gic">◐</span><span class="glbl">' + api.t('highContrast') + '</span>'
    b.addEventListener('click', () => a11y({ contrast: !a11y().contrast }))
    const gentle = document.createElement('button')
    gentle.type = 'button'
    gentle.className = 'gtile'
    gentle.innerHTML = '<span class="gic">✿</span><span class="glbl">' + api.t('gentle') + '</span>'
    gentle.addEventListener('click', () => a11y({ gentle: !a11y().gentle }))
    g.append(b, gentle)
  }
  if (!state.tourDone) setTimeout(() => api.openTour && api.openTour(), 600)
  return { tourOn, skipTour, resetTour, bump, a11y, outbox, send, paintTour, paintGoals, paintA11y, goals: () => goals }
}
