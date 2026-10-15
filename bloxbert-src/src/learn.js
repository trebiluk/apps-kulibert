// Picture tour, Try this goals, accessibility prefs, and the teacher outbox. Local only.
import { menuIcon } from './icons.js'
const KEY = 'bloxbert-learn'
export function createLearn(api) {
  const state = load()
  const goals = [
    { id: 'pathTree', need: 1, pay: 2, n: 0 },
    { id: 'pathTool', need: 1, pay: 3, n: 0 },
    { id: 'pathStone', need: 1, pay: 3, n: 0 },
    { id: 'pathCoal', need: 1, pay: 4, n: 0 },
    { id: 'pathDoor', need: 1, pay: 4, n: 0 },
    { id: 'pathHome', need: 1, pay: 5, n: 0 },
  ]
  for (const g of goals) {
    const saved = state.goals && state.goals[g.id]
    if (!saved) continue
    g.n = saved.n || 0
    g.done = !!saved.done
  }
  function remember() {
    state.goals = Object.fromEntries(goals.map((g) => [g.id, { n: g.n, done: !!g.done }]))
    save()
  }
  function worldId() {
    return String((api.world && api.world()) || 'world')
  }
  function dismissedBag() {
    if (!state.dismissed || typeof state.dismissed !== 'object' || Array.isArray(state.dismissed)) state.dismissed = {}
    const id = worldId()
    const bag = state.dismissed[id]
    if (!bag || typeof bag !== 'object' || Array.isArray(bag)) state.dismissed[id] = {}
    return state.dismissed[id]
  }
  function dismissed(id) {
    return !!dismissedBag()[id]
  }
  function dismissId(id) {
    if (!id || dismissed(id)) return
    dismissedBag()[id] = 1
    save()
  }
  let cardHidden = false
  let pathShown = false
  let pathGap = 0
  let celebrate = 0
  function currentGoal() {
    return goals.find((x) => !x.done && !dismissed(x.id))
  }
  function dismissPath() {
    if (celebrate) {
      clearTimeout(celebrate)
      celebrate = 0
      cardHidden = false
      paintPath()
      return
    }
    const g = currentGoal()
    if (g) dismissId(g.id)
    pathShown = false
    clearTimeout(celebrate)
    celebrate = 0
    clearTimeout(pathGap)
    const el = document.getElementById('path-chip')
    cardHidden = true
    if (state.hideTips) {
      pathGap = 0
      if (el) { el.classList.remove('path-out'); el.hidden = true }
      if (api.releaseHint) api.releaseHint("path")
      return
    }
    if (el && !el.hidden) el.classList.add('path-out')
    pathGap = setTimeout(() => {
      pathGap = 0
      if (el) { el.classList.remove('path-out'); el.hidden = true; el.replaceChildren() }
      cardHidden = !!state.hideTips
      if (api.releaseHint) api.releaseHint("path")
      paintPath()
    }, 1500)
  }
  function showPath() {
    cardHidden = false
    paintPath()
  }
  function sync() {
    const g = goals.find((x) => x.id === 'pathTree')
    if (!g || g.done) return false
    let logs = 0
    try { logs = api.count ? api.count('log') : 0 } catch (e) { logs = 0 }
    if (!(logs >= 1)) return false
    bump('pathTree', Math.max(1, g.need - (g.n || 0)))
    return true
  }
  function paintPath() {
    const el = document.getElementById('path-chip')
    if (!el) return
    if (state.hideTips || (api.survival && !api.survival())) {
      const was = !el.hidden
      el.classList.remove('path-out')
      el.hidden = true
      if (was && api.releaseHint) api.releaseHint("path")
      return
    }
    if (pathGap || celebrate) return
    const g = currentGoal()
    if (!g || cardHidden) {
      const was = !el.hidden
      el.hidden = true
      el.replaceChildren()
      if (was && api.releaseHint) api.releaseHint("path")
      return
    }
    if (!pathShown && api.hintTaken && api.hintTaken()) {
      el.classList.remove('path-out')
      el.hidden = true
      el.replaceChildren()
      if (api.queueHint) api.queueHint("path")
      return
    }
    el.classList.remove('path-out')
    el.hidden = false
    el.replaceChildren()
    const title = document.createElement('span')
    title.className = 'path-title'
    title.textContent = api.t(g.id === 'pathTree' && api.touch && api.touch() ? 'pathTreeTouch' : g.id)
    const x = document.createElement('span')
    x.className = 'path-x'
    const xp = menuIcon('x')
    if (xp) x.append(xp)
    x.setAttribute('role', 'button')
    x.setAttribute('aria-label', api.t('close'))
    el.append(title, x)
    pathShown = true
    if (api.claimHint) api.claimHint("path")
    placePath(el)
  }
  function placePath(el, follow) {
    if (!el) return
    if (window.innerHeight > 500) {
      el.style.top = ''
      el.style.left = ''
      el.style.maxWidth = ''
      el.style.bottom = ''
      el.style.fontSize = ''
      const fs = document.getElementById('fs-btn')
      if (!fs) return
      const fr = fs.getBoundingClientRect()
      if (!(fr.width > 2 && fr.height > 2)) return
      const chip = el.getBoundingClientRect()
      if (fr.left < chip.left) return
      if (fr.top < chip.bottom && fr.bottom > chip.top) {
        el.style.maxWidth = Math.max(160, fr.left - chip.left - 8) + 'px'
      }
      return
    }
    const jump = document.getElementById('jump-col')
    const jr = jump ? jump.getBoundingClientRect() : null
    const jumpRight = jr && jr.width > 2 && jr.height > 2 ? jr.right : 12
    const left = jumpRight + 12
    const pick = document.getElementById('pick-chip')
    const pr = pick ? pick.getBoundingClientRect() : null
    const pickLeft = pr && pr.width > 2 && pr.height > 2 ? pr.left : window.innerWidth
    const hot = document.getElementById('hotbar')
    const hr = hot ? hot.getBoundingClientRect() : null
    let limit = hr && hr.width > 2 && hr.height > 2 ? hr.top : window.innerHeight
    const held = document.getElementById('held-chip')
    if (held && !held.hidden) {
      const hd = held.getBoundingClientRect()
      if (hd.width > 2 && hd.height > 2) limit = Math.min(limit, hd.top)
    }
    el.style.top = 'auto'
    el.style.left = left + 'px'
    el.style.maxWidth = (pickLeft - left - 12) + 'px'
    el.style.bottom = (window.innerHeight - limit + 8) + 'px'
    el.style.fontSize = '13px'
    if (follow) return
    if (placePath.again) cancelAnimationFrame(placePath.again)
    placePath.again = requestAnimationFrame(() => {
      placePath.again = 0
      const chip = document.getElementById('path-chip')
      if (!chip || chip.hidden) return
      placePath(chip, true)
    })
  }
  function onPathResize() {
    const el = document.getElementById('path-chip')
    if (!el || el.hidden) return
    placePath(el)
  }
  window.addEventListener('resize', onPathResize)
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onPathResize)
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch (e) { return {} }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)) } catch (e) {} }
  function tourOn() { return !state.tourDone }
  function skipTour() { state.tourDone = true; save() }
  function resetTour() { state.tourDone = false; save() }
  function celebrateStep(g) {
    clearTimeout(celebrate)
    const nxt = currentGoal()
    const el = document.getElementById('path-chip')
    const quiet = !el || state.hideTips || (api.survival && !api.survival())
    const finish = () => {
      celebrate = 0
      cardHidden = false
      paintPath()
      if (!nxt) api.toast(api.t('goalDone'))
    }
    if (quiet) { finish(); return }
    el.classList.remove('path-out')
    el.hidden = false
    el.replaceChildren()
    const title = document.createElement('span')
    title.className = 'path-title'
    title.textContent = api.t(g.id === 'pathTree' && api.touch && api.touch() ? 'pathTreeTouch' : g.id)
    const mark = document.createElement('span')
    mark.className = 'path-check'
    const icon = menuIcon('check')
    if (icon) mark.append(icon)
    el.append(title, mark)
    celebrate = setTimeout(finish, 800)
  }
  function bump(id, n = 1) {
    if (celebrate) return
    const g = goals.find((x) => x.id === id)
    if (!g || g.done) return
    const showing = currentGoal()
    if (!showing) return
    const gi = goals.indexOf(g)
    const si = goals.indexOf(showing)
    if (gi < si) return
    const later = gi > si
    g.n += n
    if (g.n < g.need) {
      remember()
      if (!later) paintPath()
      return
    }
    g.done = true
    if (later) {
      for (let i = 0; i < gi; i++) {
        if (!goals[i].done) goals[i].done = true
      }
    }
    dismissId(g.id)
    remember()
    api.pay(g.pay, id)
    celebrateStep(g)
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
      p.textContent = api.t(steps[i] === 'tourMove' && api.touch && api.touch() ? 'tourMoveTouch' : steps[i])
      g.append(p)
      const next = document.createElement('button')
      next.type = 'button'
      next.className = 'gtile'
      const nico = document.createElement('span')
      nico.className = 'gic'
      const np = menuIcon('play')
      if (np) nico.append(np)
      const nlab = document.createElement('span')
      nlab.className = 'glbl'
      nlab.textContent = api.t('next')
      next.append(nico, nlab)
      next.addEventListener('click', () => { if (i < steps.length - 1) { i++; draw() } else { skipTour(); api.close() } })
      const skip = document.createElement('button')
      skip.type = 'button'
      skip.className = 'gtile'
      const sico = document.createElement('span')
      sico.className = 'gic'
      const sp = menuIcon('x')
      if (sp) sico.append(sp)
      const slab = document.createElement('span')
      slab.className = 'glbl'
      slab.textContent = api.t('skip')
      skip.append(sico, slab)
      skip.addEventListener('click', () => { skipTour(); api.close() })
      g.append(next, skip)
    }
    draw()
  }
  function paintGoals(g) {
    showPath()
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
    const bico = document.createElement('span')
    bico.className = 'gic'
    const bp = menuIcon('eye')
    if (bp) bico.append(bp)
    const blab = document.createElement('span')
    blab.className = 'glbl'
    blab.textContent = api.t('highContrast')
    b.append(bico, blab)
    b.addEventListener('click', () => a11y({ contrast: !a11y().contrast }))
    const gentle = document.createElement('button')
    gentle.type = 'button'
    gentle.className = 'gtile'
    const gico = document.createElement('span')
    gico.className = 'gic'
    const gp = menuIcon('leaf')
    if (gp) gico.append(gp)
    const glab = document.createElement('span')
    glab.className = 'glbl'
    glab.textContent = api.t('gentle')
    gentle.append(gico, glab)
    gentle.addEventListener('click', () => a11y({ gentle: !a11y().gentle }))
    const bright = document.createElement('button')
    bright.type = 'button'
    bright.className = 'gtile'
    const paintBright = () => {
      bright.replaceChildren()
      const ico = document.createElement('span')
      ico.className = 'gic'
      const pic = menuIcon('day')
      if (pic) ico.append(pic)
      const lab = document.createElement('span')
      lab.className = 'glbl'
      lab.textContent = api.t('brighterNights')
      bright.append(ico, lab)
      if (api.bright && api.bright()) {
        const mark = menuIcon('check')
        if (mark) lab.after(mark)
      }
    }
    paintBright()
    bright.addEventListener('click', () => { if (api.setBright) api.setBright(!(api.bright && api.bright())); paintBright() })
    g.append(b, gentle, bright)
  }
  let autoToken = 0
  let menuHolds = false
  function cancelAuto() { menuHolds = true; autoToken += 1 }
  function armAuto() {
    const token = ++autoToken
    setTimeout(() => {
      if (token !== autoToken || menuHolds || state.tourDone) return
      if (api.panel && api.panel()) return
      api.openTour && api.openTour()
    }, 600)
  }
  if (!state.tourDone) armAuto()
  paintPath()
  function notes() { return (state.notes || []).slice() }
  function setHideTips(on) {
    state.hideTips = !!on
    save()
    clearTimeout(pathGap)
    pathGap = 0
    clearTimeout(celebrate)
    celebrate = 0
    if (state.hideTips) cardHidden = true
    else cardHidden = false
    paintPath()
    return !!state.hideTips
  }
  function hideTips() { return !!state.hideTips }
  function addNote(id) {
    if (!id) return false
    if (!state.notes) state.notes = []
    if (state.notes.includes(id)) return false
    state.notes.push(id)
    save()
    return true
  }
  return { tourOn, skipTour, resetTour, bump, a11y, outbox, send, paintTour, paintGoals, paintA11y, paintPath, dismissPath, sync, goals: () => goals, cancelAuto, notes, addNote, hideTips, setHideTips }
}
