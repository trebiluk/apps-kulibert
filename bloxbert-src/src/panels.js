// Icon-tile panels. main.js wires the actions.
export function mountPanels(api) {
  const sheet = document.getElementById('sheet')
  const body = document.getElementById('sheet-body')
  const title = document.getElementById('sheet-title')
  const back = document.getElementById('sheet-back')
  let stack = []
  function tile(icon, label, fn, extra) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile'
    b.innerHTML = '<span class="gic">' + icon + '</span><span class="glbl"></span>'
    b.querySelector('.glbl').textContent = label
    if (extra) b.title = extra
    b.addEventListener('click', fn)
    return b
  }
  function show(id, label, fill, root) {
    if (api.onOpen) api.onOpen()
    if (id === 'menu' && api.holdTour) api.holdTour()
    if (root) stack = ['menu']
    else if (stack[stack.length - 1] !== id) stack.push(id)
    freshSlots()
    sheet.hidden = false
    title.textContent = label
    back.hidden = !!root
    body.innerHTML = ''
    const grid = document.createElement('div')
    grid.className = 'ggrid'
    fill(grid)
    body.append(grid)
    sheet.dataset.panel = id
    body.scrollTop = 0
    requestAnimationFrame(() => { body.scrollTop = 0 })
    armSlide(id)
    openedAt = performance.now()
  }
  let openedAt = 0
  function freshSlots() {
    const KS = window.KulibertSlots
    if (KS && KS.dropClick) KS.dropClick()
    if (KS && KS.clearPicks) KS.clearPicks()
    if (api.clearBag) api.clearBag()
  }
  const SLOT_PANELS = { inventory: 1, crafting: 1, station: 1, bench: 1, box: 1, woodshop: 1 }
  let slideGen = 0
  function motionOff() {
    try {
      if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (e) { return false }
  }
  function armSlide(id) {
    slideGen += 1
    const gen = slideGen
    const ready = () => {
      if (gen !== slideGen || sheet.dataset.slotsReady === '1') return
      sheet.classList.remove('slots-slide')
      sheet.dataset.slotsReady = '1'
      sheet.style.transition = ''
      sheet.style.transform = ''
      if (window.KulibertSlots && window.KulibertSlots.releaseClicks) window.KulibertSlots.releaseClicks()
    }
    if (!SLOT_PANELS[id] || motionOff()) {
      sheet.classList.remove('slots-slide')
      sheet.dataset.slotsReady = '1'
      sheet.style.transition = ''
      sheet.style.transform = ''
      return
    }
    sheet.dataset.slotsReady = '0'
    sheet.classList.add('slots-slide')
    sheet.style.transition = 'none'
    sheet.style.transform = 'translateY(40px)'
    const started = performance.now()
    const onEnd = (e) => {
      if (e.target !== sheet || e.propertyName !== 'transform') return
      sheet.removeEventListener('transitionend', onEnd)
      ready()
    }
    sheet.addEventListener('transitionend', onEnd)
    setTimeout(() => {
      sheet.removeEventListener('transitionend', onEnd)
      ready()
    }, 250)
    requestAnimationFrame(() => {
      if (gen !== slideGen) return
      const left = Math.max(0, 250 - (performance.now() - started))
      sheet.style.transition = 'transform ' + left + 'ms linear'
      sheet.style.transform = 'translateY(0)'
    })
  }
  function dismiss() {
    slideGen += 1
    freshSlots()
    sheet.dataset.slotsReady = '1'
    sheet.classList.remove('slots-slide')
    sheet.style.transition = ''
    sheet.style.transform = ''
    sheet.hidden = true
    stack = []
    sheet.dataset.panel = ''
  }
  function close() {
    if (api.closePlay) { api.closePlay(); return }
    dismiss()
    if (api.onClose) api.onClose()
  }
  function backOne() {
    if (stack.length <= 1) {
      if (stack[0] === 'tour') { openRoot(); return }
      close(); return
    }
    stack.pop()
    open(stack[stack.length - 1] || 'menu')
  }
  function open(id, key) {
    const map = {
      menu: () => show('menu', api.t('menu'), (g) => {
        g.append(
          tile('▶', api.t('resume'), close),
          tile('📚', api.t('myBuilds'), () => open('builds')),
          tile('🎒', api.t('inventory'), () => open('inventory')),
          tile('🔨', api.t('crafting'), () => open('crafting')),
          tile('🏪', api.t('shop'), () => open('shop')),
          tile('⚙', api.t('wallet'), () => open('wallet')),
          tile('🛠', api.t('settings'), () => open('settings')),
          tile('❓', api.t('help'), () => open('help')),
          tile('📒', api.t('notebook'), () => open('notebook')),
          tile('⛶', api.t('fs'), () => api.fullScreen()),
          tile('💾', api.t('save'), () => api.save()),
          tile('🌍', api.t('world'), () => open('world')),
          tile('🔀', api.t('mode'), () => open('mode')),
          tile('👩‍🏫', api.t('teacher'), () => open('teacher')),
          tile('🔍', api.t('inspect'), () => { api.inspect(); close() }),
          tile('🧰', api.t('buildTools'), () => { close(); api.tools() }),
          tile('📜', api.t('changelog'), () => open('log')),
          tile('🎯', api.t('tryThis'), () => open('goals')),
          tile('♿', api.t('a11y'), () => open('a11y')),
          tile('🚪', api.t('exitApp'), () => open('leave')),
        )
      }, true),
      inventory: () => show('inventory', api.t('inventory'), (g) => api.paintBag(g)),
      crafting: () => show('crafting', api.t('crafting'), (g) => api.paintCraft(g)),
      shop: () => show('shop', api.t('shop'), (g) => api.paintShop(g)),
      wallet: () => show('wallet', api.t('wallet'), (g) => api.paintWallet(g)),
      settings: () => show('settings', api.t('settings'), (g) => api.paintSettings(g)),
      teacher: () => show('teacher', api.t('teacher'), (g) => api.paintTeacher(g)),
      help: () => show('help', api.t('help'), (g) => {
        g.append(tile('🎬', api.t('tour'), () => open('tour')))
        const p = document.createElement('p'); p.className = 'gnote'; p.textContent = api.t('helpBody'); g.append(p)
      }),
      notebook: () => show('notebook', api.t('notebook'), (g) => {
        const lines = api.notes ? api.notes() : []
        if (!lines.length) {
          const p = document.createElement('p')
          p.className = 'gnote'
          p.textContent = api.t('notebookEmpty')
          g.append(p)
          return
        }
        for (const id of lines) {
          const p = document.createElement('p')
          p.className = 'gnote'
          p.dataset.note = id
          p.textContent = api.t(id)
          g.append(p)
        }
      }),
      tour: () => show('tour', api.t('tour'), (g) => api.paintTour(g)),
      goals: () => show('goals', api.t('tryThis'), (g) => api.paintGoals(g)),
      a11y: () => show('a11y', api.t('a11y'), (g) => api.paintA11y(g)),
      world: () => show('world', api.t('world'), (g) => {
        g.append(
          tile('📂', api.t('loadSaved'), () => api.load()),
          tile('⬆', api.t('exportWorld'), () => api.exportWorld()),
          tile('⬇', api.t('importWorld'), () => api.importWorld()),
          tile('✨', api.t('freshWorld'), () => api.fresh()),
          tile('⌂', api.t('hub'), () => api.hub()),
        )
      }),
      mode: () => show('mode', api.t('mode'), (g) => {
        const teacher = api.teacher && api.teacher()
        if (!teacher) {
          const note = document.createElement('p')
          note.className = 'gnote'
          note.textContent = api.t('buildLocked')
          g.append(note)
        }
        g.append(tile('⚙', api.t('survival'), () => api.setWorldMode('survival')))
        if (teacher) g.append(tile('🎨', api.t('creative'), () => api.setWorldMode('creative')))
        g.append(tile('▤', api.t('buildTable'), () => api.table()))
      }),
      station: (key) => show('station', api.t('oven'), (g) => api.paintStation(g, key, 'oven')),
      bench: (key) => show('bench', api.t('workbench'), (g) => api.paintStation(g, key, 'bench')),
      woodshop: (key) => show('woodshop', api.t('woodshop'), (g) => api.paintStation(g, key, 'woodshop')),
      log: () => show('log', api.t('changelog'), (g) => api.paintLog(g)),
      counter: (key) => show('counter', api.t('myCounter'), (g) => api.paintCounter(g, key)),
      bunk: (key) => show('bunk', api.t('bunk'), (g) => api.paintBunk(g, key)),
      box: (key) => show('box', api.t('box'), (g) => { api.paintBox(g, key); title.textContent = api.t('box') }),
      leave: () => show('leave', api.t('exitApp'), (g) => {
        const p = document.createElement('p'); p.className = 'gnote'; p.textContent = api.t('leaveAsk'); g.append(p)
        g.append(tile('✓', api.t('leave'), () => api.leave()), tile('✕', api.t('stay'), () => openRoot()))
      }),
      builds: () => show('builds', api.t('myBuilds'), (g) => api.paintBuilds(g)),
      rewind: () => show('rewind', api.t('undoMinutes'), (g) => api.paintRewind(g)),
      snaps: () => show('snaps', api.t('snapshots'), (g) => api.paintSnaps(g)),
      prices: () => show('prices', api.t('prices'), (g) => api.paintPrices(g)),
    }
    ;(map[id] || map.menu)(key)
  }
  function openRoot() { stack = ['menu']; open('menu') }
  back.addEventListener('click', backOne)
  const sheetX = document.getElementById('sheet-x')
  sheetX.addEventListener('pointerdown', (e) => e.stopPropagation())
  sheetX.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); close() })
  sheet.addEventListener('pointerdown', (e) => {
    if (sheet.hidden || performance.now() - openedAt < 400) return
    const t = e.target
    if (!t || t.closest('button, a, input, textarea, select, label, .well, .ks-slot, .keycap, .bag-card, .ks-picks, .oven-picks, .ks-choice, .oven-choice, .bed-card, .tape-track, .bed-step')) return
    if (t === sheet || t.id === 'sheet-body' || (t.classList && t.classList.contains('ggrid'))) close()
  })
  if (location.search.includes('smoke=1')) window.__btOpen = (id, key) => open(id, key)
  return { openRoot, open, close, dismiss, backOne, get openPanel() { return sheet.hidden ? '' : sheet.dataset.panel } }
}
