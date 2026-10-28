// Icon-tile panels. main.js wires the actions.
import { menuIcon, menuPlate } from './icons.js'
export function mountPanels(api) {
  const sheet = document.getElementById('sheet')
  const body = document.getElementById('sheet-body')
  const title = document.getElementById('sheet-title')
  const back = document.getElementById('sheet-back')
  function paintMenuChrome() {
    const word = api.t('menu')
    if (title) title.textContent = word
    if (back) {
      back.setAttribute('aria-label', word)
      const lab = back.querySelector('.back-lab')
      if (lab) lab.textContent = word
    }
    const drawer = document.getElementById('drawer')
    if (drawer) drawer.setAttribute('aria-label', api.t('drawerName'))
  }
  if (back) {
    const holdRoot = () => {
      const sheetEl = document.getElementById('sheet')
      const panel = sheetEl && sheetEl.dataset.panel
      if (sheetEl && !sheetEl.hidden && panel && panel !== 'menu') return
      const word = api.t('menu')
      const lab = back.querySelector('.back-lab')
      if (back.getAttribute('aria-label') === word && lab && lab.textContent === word) return
      back.setAttribute('aria-label', word)
      if (lab) lab.textContent = word
    }
    new MutationObserver(holdRoot).observe(back, { attributes: true, attributeFilter: ['aria-label'], subtree: true, characterData: true, childList: true })
  }
  let stack = []
  function tile(icon, label, fn, extra) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile'
    const ico = document.createElement('span')
    ico.className = 'gic'
    if (icon) {
      const pic = menuIcon(icon)
      if (pic) ico.append(pic)
    }
    const lab = document.createElement('span')
    lab.className = 'glbl'
    lab.textContent = label
    b.append(ico, lab)
    b.title = extra || label
    b.addEventListener('click', fn)
    return b
  }
  const sheetX = document.getElementById('sheet-x')
  function restoreMenuChrome() {
    const bar = sheet.querySelector('.sheet-bar')
    if (!bar) return
    const backBtn = document.getElementById('sheet-back')
    if (title) title.classList.remove('kd-sr')
    if (sheetX) {
      if (sheetX.dataset.menuX === '1') {
        delete sheetX.dataset.menuX
        delete sheetX.dataset.act
      }
      if (!sheetX.querySelector('.xlab')) {
        const word = document.createElement('span')
        word.className = 'xlab'
        word.textContent = api.t('close')
        sheetX.append(word)
      }
      sheetX.classList.add('kd-key', 'kd-x')
    }
    if (backBtn) bar.append(backBtn)
    if (title) bar.append(title)
    if (sheetX) bar.append(sheetX)
    if (backBtn) bar.insertBefore(backBtn, bar.firstChild)
    if (sheet.firstElementChild !== bar) sheet.insertBefore(bar, sheet.firstChild)
  }
  function show(id, label, fill, root) {
    restoreMenuChrome()
    if (api.onOpen) api.onOpen()
    if (id === 'menu' && api.holdTour) api.holdTour()
    if (root) stack = ['menu']
    else if (stack[stack.length - 1] !== id) stack.push(id)
    freshSlots()
    sheet.dataset.panel = id
    sheet.hidden = false
    title.textContent = label
    back.hidden = !!root
    body.innerHTML = ''
    const grid = document.createElement('div')
    grid.className = 'ggrid'
    fill(grid)
    body.append(grid)
    if (id === 'menu') {
      const bar = sheet.querySelector('.sheet-bar')
      if (bar) sheet.append(bar)
    }
    if (id === 'tour') {
      sheet.style.height = 'auto'
      sheet.style.maxHeight = 'min(200px, calc(100% - 200px))'
      sheet.style.width = 'min(520px, calc(100vw - 24px))'
      sheet.style.left = 'max(12px, calc(50% - 260px))'
      sheet.style.right = 'auto'
      sheet.style.bottom = 'auto'
      sheet.style.top = 'calc(var(--kb-bar-h, 48px) + 64px)'
      body.style.overflow = 'visible'
    } else {
      sheet.style.height = ''
      sheet.style.maxHeight = ''
      sheet.style.width = ''
      sheet.style.left = ''
      sheet.style.right = ''
      sheet.style.bottom = ''
      sheet.style.top = ''
      body.style.overflow = ''
    }
    lastFill = fill
    dress(id)
    if (api.paintBack) api.paintBack()
    if (id === 'menu') paintMenuChrome()
    body.scrollTop = 0
    requestAnimationFrame(() => { body.scrollTop = 0 })
    armSlide(id)
    openedAt = performance.now()
  }
  let openedAt = 0
  let lastFill = null
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
    try { if (window.__qolReturn) window.__qolReturn({ silent: true }) } catch (e) {}
    restoreMenuChrome()
    freshSlots()
    sheet.dataset.slotsReady = '1'
    sheet.classList.remove('slots-slide')
    sheet.style.transition = ''
    sheet.style.transform = ''
    sheet.style.height = ''
    sheet.style.maxHeight = ''
    sheet.style.width = ''
    sheet.style.left = ''
    sheet.style.right = ''
    sheet.style.bottom = ''
    sheet.style.top = ''
    body.style.overflow = ''
    sheet.hidden = true
    stack = []
    sheet.dataset.panel = ''
    sheet.classList.remove('kd-panel', 'menu-fit')
    const bar = sheet.querySelector('.sheet-bar')
    if (bar) bar.classList.remove('kd-plate')
  }
  function close() {
    if (api.closePlay) { api.closePlay(); return }
    dismiss()
    if (api.onClose) api.onClose()
  }
  function backOne() {
    if (stack.length <= 1) {
      if (!stack[0] || stack[0] === 'menu') { close(); return }
      openRoot(); return
    }
    stack.pop()
    open(stack[stack.length - 1] || 'menu')
  }
  function rulesOk() {
    return !!((api.teacher && api.teacher()) || (api.staff && api.staff()))
  }
  function keyTile(icon, act, label, fn) {
    const b = tile(icon, label, fn, label)
    b.classList.add('kd-key')
    b.dataset.act = act
    return b
  }
  function menuGroup(id, label, tiles, opt) {
    const box = document.createElement('div')
    box.className = 'kd-group' + (opt && opt.teacher ? ' kd-teacher' : '')
    box.dataset.group = id
    const h = document.createElement('div')
    h.className = 'kd-glab'
    h.append(document.createTextNode(label))
    if (opt && opt.tag) {
      const tag = document.createElement('span')
      tag.className = 'kd-tag'
      tag.textContent = opt.tag
      h.append(tag)
    }
    box.append(h)
    for (const b of tiles) box.append(b)
    return box
  }
  function badgeIds() { return ['berryRound', 'lanternWalk', 'gardenCorner'] }
  function badgeCountLine() {
    const ids = badgeIds()
    let got = 0
    for (const id of ids) {
      const prog = window.Badges && window.Badges.progress ? window.Badges.progress(id) : null
      if (prog && prog.done) got += 1
    }
    return (api.t('bdgProgress') || '{n} of {m}').replace('{n}', String(got)).replace('{m}', String(ids.length))
  }
  function badgeHead() { return api.t('bdgTitle') + ' · ' + badgeCountLine() }
  function liftLang(g) {
    const list = g.querySelector('#lang-list')
    if (!list) return
    const row = list.previousElementSibling
    if (!row || !row.classList.contains('set-line')) return
    g.insertBefore(row, g.firstChild)
    g.insertBefore(list, row.nextSibling)
    const btn = row.querySelector('button[aria-controls="lang-list"]')
    if (!btn || btn.dataset.langLift === '1') return
    btn.dataset.langLift = '1'
    btn.addEventListener('click', () => {
      requestAnimationFrame(() => {
        if (list.hidden || !list.scrollIntoView) return
        list.scrollIntoView({ block: 'nearest' })
      })
    })
  }
  function paintMenu(g) {
    g.classList.add('kd-panel')
    const plate = document.createElement('div')
    plate.className = 'kd-plate'
    plate.append(menuPlate())
    if (title) {
      title.classList.add('kd-sr')
      plate.append(title)
    }
    const go = keyTile('play', 'resume', api.t('resume'), () => {
      if (api.startPlay) api.startPlay()
      else close()
    })
    go.classList.add('kd-go')
    const playTiles = [
      keyTile('bag', 'inventory', api.t('inventory'), () => open('inventory')),
      keyTile('bench', 'crafting', api.t('crafting'), () => open('crafting')),
      keyTile('book', 'notebook', api.t('notebook'), () => open('notebook')),
      (() => {
        const b = keyTile('star', 'badges', api.t('bdgTitle'), () => open('badges')) // 2.5.476: badges tile
        const n = document.createElement('span')
        n.className = 'bdg-tile-n'
        n.dataset.bdgCount = '1'
        n.textContent = badgeCountLine()
        b.append(n)
        return b
      })(),
      keyTile('help', 'help', api.t('help'), () => open('help')),
    ]
    const groups = document.createElement('div')
    groups.className = 'kd-groups'
    groups.append(
      menuGroup('play', api.t('menuPlay'), playTiles),
      menuGroup('world', api.t('world'), [
        keyTile('builds', 'builds', api.t('myBuilds'), () => open('builds')),
        keyTile('globe', 'world', api.t('world'), () => open('world')),
        keyTile('flag', 'rules', api.t('worldRules'), () => { close(); api.worldRules() }),
        keyTile('floppy', 'save', api.t('save'), () => api.save()),
        keyTile('sliders', 'mode', api.t('mode'), () => open('mode')),
      ]),
      menuGroup('make', api.t('menuMake'), [
        keyTile('pick', 'tools', api.t('buildWand'), () => { close(); api.tools() }),
        keyTile('target', 'goals', api.t('tryThis'), () => open('goals')),
        keyTile('shop', 'shop', api.t('shop'), () => open('shop')),
        keyTile('coin', 'wallet', api.t('wallet'), () => open('wallet')),
      ]),
      menuGroup('settings', api.t('settings'), [
        keyTile('gear', 'settings', api.t('settings'), () => open('settings')),
        keyTile('eye', 'a11y', api.t('a11y'), () => open('a11y')),
        keyTile('full', 'fs', api.t('fs'), () => api.fullScreen()),
        keyTile('scroll', 'log', api.t('changelog'), () => open('log')),
      ]),
    )
    if (rulesOk()) {
      groups.append(menuGroup('teacher', api.t('teacher'), [
        keyTile('apple', 'teacher', api.t('teacher'), () => open('teacher')),
        keyTile('lens', 'inspect', api.t('inspect'), () => { api.inspect(); close() }),
      ], { teacher: true, tag: api.t('menuStaff') }))
    }
    const exit = keyTile('door', 'exit', api.t('exitApp'), () => open('leave'))
    exit.classList.add('kd-exit')
    if (sheetX) {
      sheetX.classList.add('kd-x')
      sheetX.dataset.menuX = '1'
      sheetX.dataset.act = 'close'
      const word = document.createElement('span')
      word.className = 'xlab'
      word.textContent = api.t('close')
      sheetX.replaceChildren(menuIcon('x'), word)
    }
    g.append(go, groups, exit)
    if (sheetX) g.append(sheetX)
    g.append(plate)
    return go
  }
  function dress(id) {
    const framed = !!id && id !== 'menu'
    const full = { inventory: 1, crafting: 1, station: 1, bench: 1, box: 1, woodshop: 1, tour: 1 }
    sheet.classList.toggle('kd-panel', framed)
    sheet.classList.toggle('menu-fit', framed && !full[id])
    const bar = sheet.querySelector('.sheet-bar')
    if (bar) bar.classList.toggle('kd-plate', framed)
    if (back) back.classList.add('kd-key')
    if (sheetX) sheetX.classList.add('kd-key', 'kd-x')
    const chip = document.getElementById('sheet-ver')
    if (chip) {
      chip.hidden = true
      chip.textContent = ''
    }
    if (!framed) return
    body.querySelectorAll('button, .gnote.ghead, .crate-tab, .machine-name').forEach((el) => {
      if (el.tagName === 'BUTTON') {
        if (el.classList.contains('well') || el.classList.contains('ks-slot') || el.classList.contains('wall-slot')) return
        el.classList.add('kd-key')
        if (el.classList.contains('make') || el.classList.contains('shop-go') || el.classList.contains('xmax-yes') || el.classList.contains('bed-rest') || el.classList.contains('decor-make')) el.classList.add('kd-go')
        return
      }
      el.classList.add('kd-group', 'kd-glab')
    })
  }
  function softRepaint() {
    if (!lastFill || sheet.hidden) return
    const grid = body.querySelector(':scope > .ggrid')
    if (!grid) return
    if (grid._ksDestroy) { try { grid._ksDestroy() } catch (e) {} grid._ksDestroy = null }
    grid.innerHTML = ''
    lastFill(grid)
    dress(sheet.dataset.panel)
  }
  function open(id, key) {
    sheet.dataset.pkey = key || ''
    const map = {
      menu: () => {
        let go = null
        show('menu', api.t('menu'), (g) => { go = paintMenu(g) }, true)
        const focusGo = () => {
          if (!go || !go.isConnected) return
          go.style.outline = ''
          go.style.outlineOffset = ''
          const quiet = !!(api.lastPointer && api.lastPointer()) // 2.5.393: opened by mouse/touch -> no forced ring on Seguir; keyboard keeps it
          try { go.focus({ focusVisible: !quiet }) } catch (e) { try { go.focus() } catch (err) {} }
        }
        requestAnimationFrame(focusGo)
      },
      inventory: () => show('inventory', api.t('inventory'), (g) => api.paintBag(g)),
      crafting: () => show('crafting', api.t('crafting'), (g) => api.paintCraft(g)),
      shop: () => show('shop', api.t('shop'), (g) => api.paintShop(g)),
      wallet: () => show('wallet', api.t('wallet'), (g) => api.paintWallet(g)),
      settings: () => show('settings', api.t('settings'), (g) => { api.paintSettings(g); liftLang(g) }),
      teacher: () => show('teacher', api.t('teacher'), (g) => {
        const host = document.createElement('div')
        host.className = 'ggrid wide'
        g.append(host)
        if (api.paintTeacher) api.paintTeacher(host)
        if (!rulesOk()) return
        const b = tile('scale', api.rulesWord ? api.rulesWord() : 'Rules', () => open('rules'))
        b.classList.add('wide')
        b.dataset.rulesTile = '1'
        g.append(b)
      }),
      badges: () => show('badges', badgeHead(), (g) => { // 2.5.476: badges panel
        const list = ['berryRound', 'lanternWalk', 'gardenCorner']
        for (const id of list) {
          const row = document.createElement('div')
          row.className = 'bdg-row'
          const prog = (window.Badges && window.Badges.progress) ? window.Badges.progress(id) : { n: 0, m: 5, done: false }
          const kind = id === 'berryRound' ? api.t('bdgKindAlias') : id === 'lanternWalk' ? api.t('bdgKindStamp') : api.t('bdgKindTrophy') // 2.5.479: shape + word
          const stem = id.replace(/Round|Walk|Corner/, '')
          const name = api.t('bdg' + stem[0].toUpperCase() + stem.slice(1) + 'Name') || id
          const goal = api.t('bdg' + stem[0].toUpperCase() + stem.slice(1) + 'Goal') || ''
          const count = prog.done ? api.t('bdgDone') : prog.n + ' / ' + prog.m
          const shape = document.createElement('span')
          shape.className = 'bdg-shape'
          shape.dataset.kind = id === 'berryRound' ? 'alias' : id === 'lanternWalk' ? 'stamp' : 'trophy'
          shape.setAttribute('aria-hidden', 'true')
          const copy = document.createElement('div')
          copy.className = 'bdg-copy'
          const title = document.createElement('span')
          title.className = 'bdg-name'
          title.textContent = name
          title.title = name
          const num = document.createElement('span')
          num.className = 'bdg-count'
          num.textContent = count
          copy.append(title, num)
          row.append(shape, copy)
          row.setAttribute('role', 'group')
          row.setAttribute('aria-label', name + '. ' + kind + '. ' + goal + '. ' + count)
          g.append(row)
        }
      }),
      help: () => show('help', api.t('help'), (g) => {
        g.append(tile('film', api.t('tour'), () => open('tour')))
        const touch = !!(api.touch && api.touch())
        const keys = document.createElement('p')
        keys.className = 'gnote'
        keys.dataset.helpKeys = '1'
        const raw = api.t(touch ? 'keysLineTouch' : 'keysLine')
        keys.textContent = String(raw || '').replace(/\s*·\s*/g, '·')
        g.append(keys)
        const keysAgain = document.createElement('p')
        keysAgain.className = 'gnote'
        keysAgain.dataset.helpKeysAgain = '1'
        keysAgain.textContent = api.t('keysAgain')
        g.append(keysAgain)
        const stay = document.createElement('p')
        stay.className = 'gnote'
        stay.dataset.helpKeysStay = '1'
        stay.textContent = api.t('helpKeysStay')
        g.append(stay)
        const flyLook = document.createElement('p'); flyLook.className = 'gnote'; flyLook.textContent = api.t('helpFlyLook'); g.append(flyLook)
        const chipNote = document.createElement('p')
        chipNote.className = 'gnote'
        chipNote.textContent = api.t('keysChipHint')
        g.append(chipNote)
        const lamps = document.createElement('p'); lamps.className = 'gnote'; lamps.textContent = api.t('helpLamps'); g.append(lamps)
        const shop = document.createElement('p'); shop.className = 'gnote'; shop.textContent = api.t('helpWoodshop'); g.append(shop)
        const upd = document.createElement('p'); upd.className = 'gnote'; upd.textContent = api.t('helpUpdate'); g.append(upd)
        const ghost = document.createElement('p'); ghost.className = 'gnote'; ghost.textContent = api.t('ghostHelp'); g.append(ghost)
        const pvp = document.createElement('p'); pvp.className = 'gnote'; pvp.textContent = api.t('pvpHint'); g.append(pvp)
        const boss = document.createElement('p'); boss.className = 'gnote'; boss.textContent = api.t('helpBossBar'); g.append(boss)
        const use = document.createElement('p'); use.className = 'gnote'; use.textContent = api.t('helpUse'); g.append(use)
        const bonk = document.createElement('p'); bonk.className = 'gnote'; bonk.textContent = api.t('helpBonk'); g.append(bonk)
        const hubLang = document.createElement('p'); hubLang.className = 'gnote'; hubLang.textContent = api.t('helpHubLang'); g.append(hubLang)
        const menuLang = document.createElement('p'); menuLang.className = 'gnote'; menuLang.textContent = api.t('helpMenuLang'); g.append(menuLang)
        const news = document.createElement('p'); news.className = 'gnote'; news.textContent = api.t('helpNew'); g.append(news)
        const again = document.createElement('p'); again.className = 'gnote'; again.textContent = api.t('helpTapAgain'); g.append(again)
        const bots = document.createElement('p'); bots.className = 'gnote'; bots.textContent = api.t('c2Help'); g.append(bots)
        const crew = document.createElement('p'); crew.className = 'gnote'; crew.textContent = api.t('c3Help'); g.append(crew)
        const c4 = document.createElement('p'); c4.className = 'gnote'; c4.textContent = api.t('c4Help'); g.append(c4)
        const c5 = document.createElement('p'); c5.className = 'gnote'; c5.textContent = api.t('c5Help'); g.append(c5)
      }),
      notebook: () => show('notebook', api.t('notebook'), (g) => {
        const lines = api.notes ? api.notes() : []
        if (!lines.length) {
          const p = document.createElement('p')
          p.className = 'gnote'
          p.textContent = api.t('notebookEmpty')
          g.append(p)
        } else {
          for (const id of lines) {
            const p = document.createElement('p')
            p.className = 'gnote'
            p.dataset.note = id
            p.textContent = api.t(id)
            g.append(p)
          }
        }
        const crewHead = document.createElement('p')
        crewHead.className = 'gnote'
        crewHead.textContent = api.t('c4tCrew') || 'Crew badges'
        g.append(crewHead)
        const list = (typeof window !== 'undefined' && window.badgeList) ? window.badgeList() : []
        for (const b of list) {
          const row = document.createElement('p')
          row.className = 'gnote'
          row.textContent = (b.earned ? '☑ ' : '☐ ') + (api.t('c4tBadge' + b.id) || b.name) + '  ' + b.progress
          g.append(row)
        }
        const dex = document.createElement('p')
        dex.className = 'gnote'
        const seen = (typeof window !== 'undefined' && window.dexSeen) ? window.dexSeen() : {}
        dex.textContent = (api.t('c4tDex') || 'Bertodex: ') + (Object.keys(seen).length ? Object.keys(seen).join(', ') : 'none')
        g.append(dex)
        const reopen = document.createElement('button')
        reopen.textContent = api.t('c4tReopen') || 'Reopen'
        reopen.style.minWidth = '44px'
        reopen.style.minHeight = '44px'
        reopen.onclick = () => { try { if (window.openDex) window.openDex('rustbot', api.t('c4RustFact') || 'fact') } catch (e) {} }
        g.append(reopen)
      }),
      tour: () => show('tour', api.t('tour'), (g) => api.paintTour(g)),
      goals: () => show('goals', api.t('tryThis'), (g) => api.paintGoals(g)),
      a11y: () => show('a11y', api.t('a11y'), (g) => api.paintA11y(g)),
      world: () => show('world', api.t('world'), (g) => {
        g.append(
          tile('folder', api.t('loadSaved'), () => api.load()),
          tile('up', api.t('exportWorld'), () => api.exportWorld()),
          tile('down', api.t('importWorld'), () => api.importWorld()),
          tile('spark', api.t('freshWorld'), () => { if (confirm(api.t('confirmFresh'))) api.fresh() }),
          tile('home', api.t('hub'), () => api.hub()),
        )
        if (api.teacher && api.teacher()) {
          g.append(tile('cards', api.t('backups'), () => open('backups')))
          g.append(tile('camera', api.t('classSnap'), () => { if (api.classSnap) api.classSnap() }))
        }
        const oldSlot = document.createElement('div')
        oldSlot.className = 'wide'
        oldSlot.dataset.oldSlot = '1'
        g.append(oldSlot)
        if (api.paintOldEntry) api.paintOldEntry(oldSlot, () => open('oldworlds'))
      }),
      mode: () => show('mode', api.t('mode'), (g) => {
        const teacher = api.teacher && api.teacher()
        if (!teacher) {
          const note = document.createElement('p')
          note.className = 'gnote'
          note.textContent = api.t('buildLocked')
          g.append(note)
        }
        g.append(tile('survive', api.t('survival'), () => api.setWorldMode('survival')))
        if (teacher) g.append(tile('create', api.t('creative'), () => api.setWorldMode('creative')))
        g.append(tile('grid', api.t('buildTable'), () => api.table()))
      }),
      station: (key) => show('station', api.t('oven'), (g) => api.paintStation(g, key, 'oven')),
      bench: (key) => show('bench', api.t('workbench'), (g) => api.paintStation(g, key, 'bench')),
      woodshop: (key) => show('woodshop', api.t('woodshop'), (g) => api.paintStation(g, key, 'woodshop')),
      log: () => show('log', api.t('changelog'), (g) => api.paintLog(g)),
      backups: () => show('backups', api.t('backups'), (g) => { if (api.paintBackups) api.paintBackups(g) }),
      oldworlds: () => show('oldworlds', api.t('openOld'), (g) => { if (api.paintOldWorlds) api.paintOldWorlds(g) }),
      counter: (key) => show('counter', api.t('myCounter'), (g) => api.paintCounter(g, key)),
      bunk: (key) => show('bunk', api.t('bunk'), (g) => api.paintBunk(g, key)),
      box: (key) => show('box', api.t('box'), (g) => { api.paintBox(g, key); title.textContent = api.t('box') }),
      leave: () => show('leave', api.t('exitApp'), (g) => {
        const p = document.createElement('p'); p.className = 'gnote'; p.textContent = api.t('leaveAsk'); g.append(p)
        g.append(tile('check', api.t('leave'), () => api.leave()), tile('x', api.t('stay'), () => openRoot()))
      }),
      builds: () => show('builds', api.t('myBuilds'), (g) => api.paintBuilds(g)),
      rewind: () => show('rewind', api.t('undoMinutes'), (g) => api.paintRewind(g)),
      snaps: () => show('snaps', api.t('snapshots'), (g) => api.paintSnaps(g)),
      prices: () => show('prices', api.t('prices'), (g) => api.paintPrices(g)),
      rules: () => show('rules', api.rulesWord ? api.rulesWord() : 'Rules', (g) => {
        if (!rulesOk()) return
        if (api.paintRules) api.paintRules(g)
      }),
    }
    ;(map[id] || map.menu)(key)
  }
  function openRoot() { stack = ['menu']; open('menu') }
  back.addEventListener('click', backOne)
  const eat = (e) => { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation() }
  sheetX.addEventListener('pointerdown', eat, true)
  sheetX.addEventListener('pointerup', eat, true)
  sheetX.addEventListener('click', (e) => { eat(e); close() }, true)
  sheet.addEventListener('pointerdown', (e) => {
    if (sheet.hidden || performance.now() - openedAt < 400) return
    const t = e.target
    if (!t || t.closest('button, a, input, textarea, select, label, .well, .ks-slot, .keycap, .bag-card, .ks-picks, .oven-picks, .ks-choice, .oven-choice, .bed-card, .tape-track, .bed-step')) return
    if (t === sheet || t.id === 'sheet-body' || (t.classList && t.classList.contains('ggrid'))) close()
  })
  if (globalThis.location && String(globalThis.location.search || '').includes('smoke=1')) window.__btOpen = (id, key) => open(id, key)
  paintMenuChrome()
  return { openRoot, open, close, dismiss, backOne, softRepaint, get openPanel() { return sheet.hidden ? '' : sheet.dataset.panel } }
}
