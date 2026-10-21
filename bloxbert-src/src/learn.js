// Picture tour, Try this goals, accessibility prefs, and the teacher outbox. Local only.
import { menuIcon } from './icons.js'
import { holdTip, dropTip } from './tips.js'
const KEY = 'bloxbert-learn'
const HAMMER = '<svg viewBox="0 0 48 48" width="22" height="22" aria-hidden="true"><rect x="8" y="8" width="22" height="10" fill="#6b7280" stroke="#1c1917" stroke-width="2"/><rect x="16" y="16" width="8" height="24" fill="#c9954c" stroke="#5c3317" stroke-width="2"/></svg>'
export function createLearn(api) {
  const state = load()
  const goals = [
    { id: 'pathTree', need: 1, pay: 2, n: 0 },
    { id: 'pathBench', need: 1, pay: 2, n: 0, make: 'workbench' },
    { id: 'pathTool', need: 1, pay: 3, n: 0, make: 'woodTool' },
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
  const benchI = goals.findIndex((g) => g.id === 'pathBench')
  if (benchI >= 0 && !goals[benchI].done && goals.some((g, i) => i > benchI && g.done)) {
    goals[benchI].done = true
    goals[benchI].n = goals[benchI].need
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
    pathShown = false
    clearTimeout(celebrate)
    celebrate = 0
    clearTimeout(pathGap)
    pathGap = 0
    const el = document.getElementById('path-chip')
    cardHidden = true
    if (el) { el.classList.remove('path-out'); el.hidden = true }
    dropTip('path')
    syncMake(null)
    if (api.releaseHint) api.releaseHint("path")
  }
  function showPath() {
    cardHidden = false
    paintPath()
  }
  function plankHave() {
    try {
      if (api.plankOwned) return api.plankOwned() | 0
      return api.count ? (api.count('planks') | 0) : 0
    } catch (e) { return 0 }
  }
  function itemHave(id) {
    try { return api.count ? (api.count(id) | 0) : 0 } catch (e) { return 0 }
  }
  const BENCH_PLANKS = 4
  function goalLine(g) {
    if (!g) return ''
    const have = plankHave()
    if (g.id === 'pathTree') {
      return api.t('goalPlanks').replace('{have}', String(Math.min(have, BENCH_PLANKS))).replace('{need}', String(BENCH_PLANKS))
    }
    if (g.id === 'pathBench') {
      if (have >= BENCH_PLANKS) return api.t('goalBenchReady').replace('{n}', String(have)).replace('{item}', api.t('planks'))
      return api.t('pathBench') + ' · ' + have + '/' + BENCH_PLANKS + ' ' + api.t('planks')
    }
    return api.t(g.id)
  }
  function paintTreeCount() {}
  function sync() {
    const el = document.getElementById('path-chip')
    const showing = currentGoal()
    if (showing && showing.make && itemHave(showing.make) > 0) {
      bump(showing.id, Math.max(1, showing.need - (showing.n || 0)))
      return true
    }
    if (showing && el && !el.hidden) {
      const title = el.querySelector('.path-title')
      if (title) title.textContent = goalLine(showing)
    }
    const tree = goals.find((x) => x.id === 'pathTree')
    if (!tree || tree.done) return false
    if (!showing || showing.id !== 'pathTree') return false
    if (plankHave() < 1) return false
    if (sync.wait) return true
    sync.wait = setTimeout(() => {
      sync.wait = 0
      const cur = goals.find((x) => x.id === 'pathTree')
      if (!cur || cur.done) return
      bump('pathTree', Math.max(1, cur.need - (cur.n || 0)))
    }, 700)
    return true
  }
  function paintPath() {
    const el = document.getElementById('path-chip')
    if (!el) return
    if (state.hideTips || (api.survival && !api.survival())) {
      const was = !el.hidden
      el.classList.remove('path-out')
      el.hidden = true
      syncMake(null)
      if (was && api.releaseHint) api.releaseHint("path")
      dropTip('path')
      return
    }
    if (pathGap || celebrate) { syncMake(null); return }
    const g = currentGoal()
    if (!g || cardHidden) {
      const was = !el.hidden
      el.hidden = true
      el.replaceChildren()
      syncMake(null)
      if (was && api.releaseHint) api.releaseHint("path")
      dropTip('path')
      return
    }
    if (!pathShown && api.hintTaken && api.hintTaken()) {
      el.classList.remove('path-out')
      el.hidden = true
      el.replaceChildren()
      syncMake(null)
      if (api.queueHint) api.queueHint("path")
      return
    }
    el.classList.remove('path-out')
    el.hidden = false
    el.replaceChildren()
    const title = document.createElement('span')
    title.className = 'path-title'
    title.textContent = goalLine(g)
    el.append(title)
    pathShown = true
    if (api.claimHint) api.claimHint("path")
    placePath(el)
    holdTip('path', el, () => !!(currentGoal() && !cardHidden && !state.hideTips && !(api.survival && !api.survival())))
    syncMake(g)
    const x = document.createElement('span')
    x.className = 'path-x'
    const xp = menuIcon('x')
    if (xp) x.append(xp)
    x.setAttribute('role', 'button')
    x.setAttribute('aria-label', api.t('close'))
    el.append(x)
  }
  function placePath(el, follow) {
    if (!el) return
    const phone = window.innerWidth <= 980 || window.innerHeight <= 520
    if (phone) {
      el.classList.remove('path-corner')
      const hot = document.getElementById('hotbar')
      const hr = hot ? hot.getBoundingClientRect() : null
      let bottom = 108
      if (hr && hr.height > 2 && hr.top > 40) bottom = Math.max(12, Math.round(window.innerHeight - hr.top + 8))
      const stick = document.getElementById('stick-pad')
      const sr = stick ? stick.getBoundingClientRect() : null
      const header = document.querySelector('header.top')
      const headerBottom = header ? header.getBoundingClientRect().bottom : 120
      const maxBottom = Math.max(12, window.innerHeight - headerBottom - 64)
      if (sr && sr.width > 2 && sr.height > 2) {
        const cardW = Math.min(el.offsetWidth || 260, window.innerWidth * 0.92)
        const cardLeft = (window.innerWidth - cardW) / 2
        if (cardLeft < sr.right - 4 && cardLeft + cardW > sr.left + 4) {
          const stickClear = Math.round(window.innerHeight - sr.top + 8)
          if (stickClear > bottom && stickClear <= maxBottom) bottom = stickClear
        }
      }
      if (bottom > maxBottom) bottom = maxBottom
      document.documentElement.style.setProperty('--goal-bottom', bottom + 'px')
      el.style.top = ''
      el.style.left = ''
      el.style.right = ''
      el.style.bottom = ''
      el.style.transform = ''
      el.style.maxWidth = ''
      el.style.width = ''
      el.style.background = ''
      el.style.color = ''
      el.style.border = ''
      el.style.boxShadow = ''
      el.style.outline = ''
      el.style.pointerEvents = ''
      return
    }
    const touch = document.body.classList.contains('touch') || (api.touch && api.touch())
    if (!(touch && window.innerHeight <= 500)) {
      el.classList.remove('path-corner')
      el.style.right = ''
      el.style.transform = ''
      el.style.background = ''
      el.style.color = ''
      el.style.border = ''
      el.style.boxShadow = ''
      el.style.outline = ''
      el.style.pointerEvents = ''
      if (window.innerHeight > 500) {
        el.style.top = ''
        el.style.left = ''
        el.style.maxWidth = ''
        el.style.bottom = ''
        el.style.fontSize = ''
        const fs = document.getElementById('fs-btn')
        const pause = document.getElementById('pause-btn')
        if (!fs) return
        const fr = fs.getBoundingClientRect()
        const pauseR = pause && !pause.hidden ? pause.getBoundingClientRect() : null
        const block = pauseR && pauseR.width > 2 ? pauseR : fr
        if (!(block.width > 2 && block.height > 2)) return
        const chip = el.getBoundingClientRect()
        if (block.left < chip.left) return
        if (block.top < chip.bottom && block.bottom > chip.top) {
          el.style.maxWidth = Math.max(160, block.left - chip.left - 8) + 'px'
        }
        return
      }
      const jump = document.getElementById('jump-col')
      const jr = jump ? jump.getBoundingClientRect() : null
      const stick = document.getElementById('stick-pad')
      const sr = stick ? stick.getBoundingClientRect() : null
      const pick = document.getElementById('pick-chip')
      const pr = pick ? pick.getBoundingClientRect() : null
      let left = 12
      let rightEdge = window.innerWidth - 12
      const shown = (r) => !!(r && r.width > 2 && r.height > 2)
      const park = (r) => {
        if (!shown(r)) return
        if (r.left < window.innerWidth * 0.5) left = Math.max(left, r.right + 12)
        if (r.right > window.innerWidth * 0.5) rightEdge = Math.min(rightEdge, r.left - 12)
      }
      park(sr)
      park(jr)
      park(pr)
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
      el.style.maxWidth = Math.max(120, rightEdge - left) + 'px'
      el.style.bottom = (window.innerHeight - limit + 8) + 'px'
      el.style.fontSize = '13px'
      if (follow) return
      if (placePath.again) cancelAnimationFrame(placePath.again)
      placePath.again = requestAnimationFrame(() => {
        placePath.again = 0
        const chip = document.getElementById('path-chip')
        if (!chip || chip.hidden) return
        placePath(chip, true)
        placeMake()
      })
      return
    }
    const rtl = document.documentElement.dir === 'rtl'
    const shownBox = (el) => {
      if (!el || el.hidden) return null
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden') return null
      const r = el.getBoundingClientRect()
      if (r.width < 2 || r.height < 2) return null
      return r
    }
    const mr = shownBox(document.getElementById('game-menu'))
    const fs = document.getElementById('fs-btn')
    const fr = shownBox(fs)
    const pauseBox = shownBox(document.getElementById('pause-btn'))
    const rightBtn = (!rtl && pauseBox) ? pauseBox : fr
    el.classList.add('path-corner')
    el.style.bottom = 'auto'
    el.style.maxWidth = '40vw'
    el.style.fontSize = '16px'
    el.style.transform = 'none'
    el.style.background = '#0E1A22'
    el.style.color = '#E6EEF2'
    el.style.border = '0'
    el.style.boxShadow = 'none'
    el.style.outline = 'none'
    el.style.pointerEvents = 'none'
    if (!rtl) {
      if (mr) {
        el.style.top = mr.top + 'px'
        el.style.left = (mr.right + 12) + 'px'
      } else {
        el.style.top = (fr ? fr.top : 8) + 'px'
        el.style.left = '12px'
      }
      el.style.right = 'auto'
    } else if (fr) {
      el.style.left = 'auto'
      el.style.right = (window.innerWidth - fr.left + 12) + 'px'
      el.style.top = fr.top + 'px'
    } else if (mr) {
      el.style.left = 'auto'
      el.style.right = (mr.right + 12) + 'px'
      el.style.top = mr.top + 'px'
    } else {
      el.style.left = 'auto'
      el.style.right = '12px'
      el.style.top = '8px'
    }
    if (follow) {
      const box = el.getBoundingClientRect()
      if (!rtl && rightBtn && box.width > 2 && box.right > rightBtn.left - 8 && box.left < rightBtn.left) {
        el.style.maxWidth = Math.max(120, Math.min(window.innerWidth * 0.4, rightBtn.left - box.left - 12)) + 'px'
      }
      if (rtl && mr && box.width > 2 && box.left < mr.right + 8 && box.right > mr.right) {
        el.style.maxWidth = Math.max(120, Math.min(window.innerWidth * 0.4, box.right - mr.right - 12)) + 'px'
      }
      return
    }
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
  function ensureMake() {
    let b = document.getElementById('path-make')
    if (b && b.isConnected) return b
    const chip = document.getElementById('path-chip')
    if (!chip) return null
    b = document.createElement('button')
    b.type = 'button'
    b.id = 'path-make'
    b.className = 'path-make'
    b.hidden = true
    chip.append(b)
    b.addEventListener('pointerdown', (e) => e.stopPropagation())
    b.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      pressMake()
    })
    return b
  }
  function placeMake() {
    const b = document.getElementById('path-make')
    if (!b) return
    b.style.position = 'static'
    b.style.left = ''
    b.style.top = ''
    b.style.right = ''
    b.style.bottom = ''
  }
  function syncMake(g) {
    const b = ensureMake()
    if (!b) return
    const show = !!(g && g.make) && !state.hideTips && !(api.survival && !api.survival())
    if (!show) {
      b.hidden = true
      return
    }
    b.hidden = false
    if (b.dataset.for !== g.make) {
      b.dataset.for = g.make
      b.replaceChildren()
      const ico = document.createElement('span')
      ico.className = 'path-make-ico'
      ico.innerHTML = HAMMER
      const lab = document.createElement('span')
      lab.className = 'path-make-lab'
      lab.textContent = api.t('make')
      b.append(ico, lab)
      b.setAttribute('aria-label', api.t('make'))
    }
    placeMake()
  }
  function goalMake() {
    const g = currentGoal()
    return g && g.make ? g.make : ''
  }
  function hasMake() {
    return !!goalMake() && !state.hideTips && !(api.survival && !api.survival())
  }
  function pressMake() {
    const id = goalMake()
    if (!id || !api.makeGoal) return false
    return api.makeGoal(id)
  }
  function celebrateStep(g) {
    clearTimeout(celebrate)
    celebrate = 0
    cardHidden = false
    const nxt = currentGoal()
    paintPath()
    if (!nxt) api.toast(api.t('goalDone'))
  }
  function bump(id, n = 1) {
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
      if (api.hudQuiet && api.hudQuiet()) return
      if (api.panel && api.panel()) return
      api.openTour && api.openTour()
    }, 600)
  }
  if (!(api.hudQuiet && api.hudQuiet()) && !state.tourDone) armAuto()
  paintPath()
  function freshGoals() {
    for (const g of goals) {
      g.n = 0
      g.done = false
    }
    state.goals = {}
    state.dismissed = {}
    save()
    cardHidden = false
    pathShown = false
    clearTimeout(sync.wait)
    sync.wait = 0
    paintPath()
  }
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
  function notes() { return (state.notes || []).slice() }
  function addNote(id) {
    if (!id) return false
    if (!state.notes) state.notes = []
    if (state.notes.includes(id)) return false
    state.notes.push(id)
    save()
    return true
  }
  return { tourOn, skipTour, resetTour, bump, a11y, outbox, send, paintTour, paintGoals, paintA11y, paintPath, dismissPath, sync, goals: () => goals, cancelAuto, notes, addNote, hideTips, setHideTips, pressMake, hasMake, freshGoals }
}

// C4 Bertodex block (appended, goals :1-460 untouched)
export function openDex(kind, fact) {
  // DOM created from JS as required
  const card = document.createElement('div')
  card.id = 'bertodex-card'
  card.style.cssText = 'position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:rgba(11,18,32,.92);overflow:auto'
  const inner = document.createElement('div')
  inner.style.cssText = 'background:#0f172a;border:2px solid #fff;border-radius:8px;padding:16px;max-width:412px;max-height:80vh;overflow:auto;color:#fff'
  inner.innerHTML = `<b>Bertodex: ${kind}</b><br>[icon]<br>${fact}<br>(8 languages + Simple)<br><button id="dex-close" style="min-width:44px;min-height:44px;margin-top:12px">[Close]</button>`
  card.append(inner)
  document.body.append(card)
  const close = () => card.remove()
  document.getElementById('dex-close').onclick = close
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() }, { once: true })
  return card
}
