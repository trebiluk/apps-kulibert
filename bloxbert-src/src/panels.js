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
    if (root) stack = ['menu']
    else if (stack[stack.length - 1] !== id) stack.push(id)
    sheet.hidden = false
    title.textContent = label
    back.hidden = !!root
    body.innerHTML = ''
    const grid = document.createElement('div')
    grid.className = 'ggrid'
    fill(grid)
    body.append(grid)
    sheet.dataset.panel = id
  }
  function close() {
    sheet.hidden = true
    stack = []
    api.onClose()
  }
  function backOne() {
    if (stack.length <= 1) { close(); return }
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
          tile('⛶', api.t('fs'), () => api.fullScreen()),
          tile('💾', api.t('save'), () => api.save()),
          tile('🌍', api.t('world'), () => open('world')),
          tile('🔀', api.t('mode'), () => open('mode')),
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
        g.append(
          tile('🎨', api.t('creative'), () => api.setWorldMode('creative')),
          tile('⚙', api.t('survival'), () => api.setWorldMode('survival')),
          tile('▤', api.t('buildTable'), () => api.table()),
        )
      }),
      station: (key) => show('station', api.t('oven'), (g) => api.paintStation(g, key, 'oven')),
      bench: (key) => show('bench', api.t('workbench'), (g) => api.paintStation(g, key, 'bench')),
      log: () => show('log', api.t('changelog'), (g) => api.paintLog(g)),
      counter: (key) => show('counter', api.t('myCounter'), (g) => api.paintCounter(g, key)),
      bunk: (key) => show('bunk', api.t('bunk'), (g) => api.paintBunk(g, key)),
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
  document.getElementById('sheet-x').addEventListener('click', close)
  return { openRoot, open, close, backOne, get openPanel() { return sheet.hidden ? '' : sheet.dataset.panel } }
}
