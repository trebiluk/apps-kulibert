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
    stack = root ? [] : stack
    if (!root) stack.push(id)
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
    if (stack.length <= 1) { openRoot(); return }
    stack.pop()
    open(stack[stack.length - 1] || 'menu')
  }
  function open(id) {
    const map = {
      menu: () => show('menu', api.t('menu'), (g) => {
        g.append(
          tile('▶', api.t('resume'), close),
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
          tile('★', api.t('whatsNew'), () => open('news')),
        )
      }, true),
      inventory: () => show('inventory', api.t('inventory'), (g) => api.paintBag(g)),
      crafting: () => show('crafting', api.t('crafting'), (g) => api.paintCraft(g)),
      shop: () => show('shop', api.t('shop'), (g) => api.paintShop(g)),
      wallet: () => show('wallet', api.t('wallet'), (g) => api.paintWallet(g)),
      settings: () => show('settings', api.t('settings'), (g) => api.paintSettings(g)),
      teacher: () => show('teacher', api.t('teacher'), (g) => api.paintTeacher(g)),
      help: () => show('help', api.t('help'), (g) => { const p = document.createElement('p'); p.className = 'gnote'; p.textContent = api.t('helpBody'); g.append(p) }),
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
      news: () => show('news', api.t('whatsNew'), (g) => { const p = document.createElement('p'); p.className = 'gnote'; p.textContent = api.t('whatsNewBody'); g.append(p) }),
      counter: () => show('counter', api.t('myCounter'), (g) => api.paintCounter(g)),
      bunk: () => show('bunk', api.t('bunk'), (g) => api.paintBunk(g)),
      prices: () => show('prices', api.t('prices'), (g) => api.paintPrices(g)),
    }
    ;(map[id] || map.menu)()
  }
  function openRoot() { stack = ['menu']; open('menu') }
  back.addEventListener('click', backOne)
  document.getElementById('sheet-x').addEventListener('click', close)
  return { openRoot, open, close, backOne, get openPanel() { return sheet.hidden ? '' : sheet.dataset.panel } }
}
