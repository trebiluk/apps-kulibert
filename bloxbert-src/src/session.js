// Survival session: bag, Cogs, shop, counters, bunk. Creative never touches this bag.
import { ITEMS, dropOf } from './data/items.js'
import { RECIPES } from './data/recipes.js'
import { ECON } from './data/econ.js'
import { pays, sells } from './data/econ.js'
import { createBag } from './items.js'
import { canMake, make } from './craft.js'
import { createWallet } from './econ/wallet.js'
import { quoteSell, quoteBuy, canSellToday } from './econ/store.js'
import { visit } from './econ/vend.js'
import { icon } from './icons.js'

export function createSession(api) {
  const bag = createBag()
  const wallet = createWallet(ECON)
  const meta = new Map()
  let mode = 'creative'
  let home = null
  let hot = 0
  let day = localDay()
  function localDay() {
    const d = new Date()
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
  }
  let paused = false
  let visitN = 1
  const bagHist = []
  const redoBag = []
  const placedLeaves = new Set()
  wallet.state.day = day
  wallet.post({ kind: 'start', cogs: 0, by: 'you' })

  function t(k) { return api.t(k) }
  function itemName(k) { return t(k) }
  function today() {
    if (wallet.state.day !== day) { wallet.state.day = day; wallet.state.soldToday = {}; wallet.state.spentToday = 0 }
    return day
  }
  function paintChip() {
    const el = document.getElementById('wallet-chip')
    if (!el) return
    el.hidden = mode !== 'survival'
    el.innerHTML = '<bdi>⚙ ' + wallet.state.cogs + '</bdi> <small>' + t('practice') + '</small>'
  }
  function paintHotbar() {
    const bar = document.getElementById('hotbar')
    if (!bar) return
    bar.classList.toggle('bagbar', mode === 'survival')
    if (mode !== 'survival') return
    bar.innerHTML = ''
    for (let i = 0; i < 9; i++) {
      const s = bag.slots[i]
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'slot'
      b.dataset.slot = String(i)
      const sw = document.createElement('span')
      sw.className = 'sw'
      const item = s && ITEMS[s.item]
      if (item && item.svg) sw.innerHTML = icon(item.svg)
      else if (item) sw.textContent = item.letter
      const tag = document.createElement('span')
      tag.className = 'tag'
      tag.textContent = item ? item.letter : ''
      const lbl = document.createElement('span')
      lbl.className = 'lbl'
      lbl.textContent = s ? String(s.n) : ''
      b.append(sw, tag, lbl)
      if (!s) b.classList.add('empty')
      b.setAttribute('aria-pressed', String(i === hot))
      b.addEventListener('click', () => { hot = i; paintHotbar() })
      bar.append(b)
    }
  }
  function selectedItem() {
    if (mode !== 'survival') return null
    return bag.slots[hot] && bag.slots[hot].item
  }
  function near(kind) {
    const p = api.pos()
    const id = kind === 'bench' ? 22 : 23
    for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -4; dz <= 4; dz++) {
      if (api.getVoxel(Math.floor(p[0]) + dx, Math.floor(p[1]) + dy, Math.floor(p[2]) + dz) === id) return true
    }
    return false
  }
  function card(g, itemKey) {
    const item = ITEMS[itemKey]
    const p = document.createElement('p')
    p.className = 'gnote'
    const pay = quoteSell(item, wallet.state.soldToday[itemKey] || 0, wallet.state.dial || 1, { ...ECON, dial: wallet.state.dial })
    p.innerHTML = '<bdi>' + t('worth') + ' ⚙ ' + (item.base || 0) + ' · ' + t('tallyPays') + ' ⚙ ' + pay + ' · ' + t('youHave') + ' ' + bag.count(itemKey) + '</bdi>'
    g.append(p)
  }
  function itemIcon(item) {
    if (!item) return ''
    if (item.svg) return icon(item.svg)
    return '<span class="sw pat-' + ((item.block || 1) % 6) + '"></span>'
  }
  function paintBag(g) {
    if (!bag.slots.some(Boolean)) {
      const p = document.createElement('p')
      p.className = 'gnote'
      p.textContent = t('emptyBag')
      g.append(p)
    }
    bag.slots.forEach((s) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      b.innerHTML = '<span class="gic" aria-hidden="true">' + (s ? itemIcon(ITEMS[s.item]) : '') + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = s ? itemName(s.item) + ' ' + s.n : ''
      b.setAttribute('aria-label', s ? itemName(s.item) : t('emptySlot'))
      if (s) b.addEventListener('click', () => card(g, s.item))
      g.append(b)
    })
  }
  function paintCraft(g) {
    const stations = { bench: near('bench'), oven: near('oven') }
    for (const r of RECIPES) {
      const gate = canMake(r, bag, stations)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      const out = ITEMS[r.out[0]]
      b.innerHTML = '<span class="gic">' + itemIcon(out) + '</span><span class="glbl"></span><span class="gneed"></span>'
      b.querySelector('.glbl').textContent = itemName(r.out[0])
      b.querySelector('.gneed').textContent = r.in.map(([k, n]) => itemName(k) + '×' + n).join(' ')
      if (!gate.ok && gate.why === 'oven') b.querySelector('.glbl').textContent = t('needsOven')
      if (!gate.ok && gate.why === 'bench') b.querySelector('.glbl').textContent = t('needsBench')
      b.disabled = !gate.ok
      b.addEventListener('click', () => {
        if (!make(r, bag)) { api.toast(t('bagFull')); return }
        paintHotbar()
        api.toast(t('make') + ' ' + itemName(r.out[0]))
        g.innerHTML = ''
        paintCraft(g)
      })
      g.append(b)
    }
  }
  function paintShop(g) {
    g.innerHTML = ''
    g.append(tab('💰', t('sell'), () => paintSell(g)))
    g.append(tab('🛒', t('buy'), () => paintBuy(g)))
    g.append(tab('📋', t('prices'), () => paintPrices(g)))
    paintSell(g)
  }
  function tab(ic, label, fn) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile tab'
    b.innerHTML = '<span class="gic">' + ic + '</span><span class="glbl"></span>'
    b.querySelector('.glbl').textContent = label
    b.addEventListener('click', fn)
    return b
  }
  function btn(label, fn) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'gtile'
    b.innerHTML = '<span class="gic">⚙</span><span class="glbl"></span>'
    b.querySelector('.glbl').textContent = label
    b.addEventListener('click', fn)
    return b
  }
  function paintSell(g) {
    today()
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const [k, item] of Object.entries(ITEMS)) {
      if (!bag.count(k)) continue
      const sold = wallet.state.soldToday[k] || 0
      const pay = item.sell ? quoteSell(item, sold, wallet.state.dial || 1, ECON) : 0
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      b.innerHTML = '<span class="gic">' + itemIcon(item) + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = item.sell ? itemName(k) + ' ⚙ ' + pay + ' · ' + sold + '/20' : itemName(k) + ' ' + t('cantSell')
      b.disabled = !item.sell || !canSellToday(sold, wallet.state.dailyCap || ECON.dailyCap)
      b.addEventListener('click', () => { sell(k, 1); paintSell(g) })
      g.append(b)
    }
  }
  function paintBuy(g) {
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const k of ECON.storeSells) {
      const item = ITEMS[k]
      const price = quoteBuy(item, wallet.state.dial || 1, ECON)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic">' + itemIcon(item) + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = itemName(k) + ' ⚙ ' + price
      b.addEventListener('click', () => buy(k, 1, price))
      g.append(b)
    }
  }
  function paintPrices(g) {
    for (const el of [...g.querySelectorAll('.item')]) el.remove()
    for (const k of ECON.storeSells) {
      const item = ITEMS[k]
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic">' + itemIcon(item) + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = itemName(k) + ' · ' + t('sell') + ' ⚙ ' + quoteSell(item, wallet.state.soldToday[k] || 0, wallet.state.dial || 1, ECON) + ' · ' + t('buy') + ' ⚙ ' + quoteBuy(item, wallet.state.dial || 1, ECON)
      g.append(b)
    }
  }
  function paintWallet(g) {
    const p = document.createElement('p')
    p.className = 'gnote balance'
    p.innerHTML = '<bdi>⚙ ' + wallet.state.cogs + ' ' + t('practice') + '</bdi>'
    g.append(p)
    const phrase = { sell: t('sold'), buy: t('bought'), 'till-take': t('takeTill'), 'vend-sale': t('townBought'), start: t('startCogs'), teacher: t('teacher') }
    for (const row of wallet.state.ledger.slice(-10).reverse()) {
      const line = document.createElement('p')
      line.className = 'gnote'
      const time = new Date(row.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const words = (phrase[row.kind] || row.kind).replace('{n}', row.n || 0).replace('{item}', itemName(row.item || '')).replace('{cogs}', Math.abs(row.cogs))
      line.innerHTML = '<bdi>' + words + ' ' + (row.cogs ? (row.cogs > 0 ? '+' : '') + '⚙' + row.cogs : '') + ' · ' + time + '</bdi>'
      g.append(line)
    }
  }
  function paintSettings(g) {
    g.append(btn(t('teacher'), () => api.open('teacher')))
    const n = document.createElement('p')
    n.className = 'gnote'
    n.textContent = t('onDevice')
    g.append(n)
  }
  function paintTeacher(g) {
    g.append(btn(t('priceDial'), () => { wallet.state.dial = wallet.state.dial === 1 ? 1.5 : 1; api.toast(t('pricesChanged')) }))
    g.append(btn(t('townsfolk'), () => { ECON.townsfolk.on = !ECON.townsfolk.on }))
    g.append(btn(t('resetWallet'), () => { if (confirm(t('resetWallet'))) { wallet.state.cogs = wallet.state.start; wallet.state.ledger = []; wallet.post({ kind: 'teacher', cogs: 0, by: 'teacher' }); paintChip() } }))
  }
  function paintCounter(g, key) {
    const rec = meta.get(key)
    if (!rec) return
    rec.slots.forEach((s, i) => {
      g.append(btn((s ? itemName(s.item) + ' ' + s.n + ' ⚙ ' + s.price : t('stock')) + ' ' + (i + 1), () => stock(key, i)))
    })
    g.append(btn(t('takeTill') + ' ⚙ ' + rec.till, () => { takeTill(key); paintCounter(g, key) }))
    g.append(btn('🧹 ' + t('pickup'), () => { if (confirm(t('pickup'))) { const [x, y, z] = String(key).split(',').map(Number); pickup(x, y, z, 24); api.close() } }))
    const profit = (rec.sales || []).reduce((n, s) => n + s.cogs, 0) - wallet.state.spentToday
    const line = document.createElement('p')
    line.className = 'gnote'
    line.textContent = t('profit') + ' ⚙ ' + profit
    g.append(line)
  }
  function hashKey(key) {
    let h = 0
    for (const c of key) h = (h * 33 + c.charCodeAt(0)) | 0
    return h
  }
  function paintBunk(g, key) {
    g.append(btn(t('yes'), () => { home = String(key || '0,0,0').split(',').map(Number); api.toast(t('homeSet')); api.close() }))
    g.append(btn('🧹 ' + t('pickup'), () => { home = null; api.toast(t('homeCleared')); api.close() }))
    g.append(btn(t('no'), () => api.close()))
  }
  function sell(k, n) {
    today()
    const item = ITEMS[k]
    const sold = wallet.state.soldToday[k] || 0
    if (!canSellToday(sold, wallet.state.dailyCap || ECON.dailyCap)) { api.toast(t('tallyEnough').replace('{item}', itemName(k))); return }
    const pay = quoteSell(item, sold, wallet.state.dial || 1, ECON)
    if (!bag.take(k, n)) return
    wallet.state.soldToday[k] = sold + n
    wallet.post({ kind: 'sell', item: k, n, cogs: pay * n, by: 'tally' })
    paintChip(); paintHotbar()
    api.toast(t('sold').replace('{n}', n).replace('{item}', itemName(k)))
  }
  function buy(k, n, price) {
    if (wallet.state.cogs < price * n) { api.toast(t('needMore').replace('{n}', price * n - wallet.state.cogs)); return }
    if (bag.add(k, n)) { api.toast(t('bagFull')); return }
    wallet.state.spentToday += price * n
    wallet.post({ kind: 'buy', item: k, n, cogs: -price * n, by: 'tally' })
    paintChip(); paintHotbar()
    api.toast(t('bought').replace('{n}', n).replace('{item}', itemName(k)))
  }
  function stock(key, i) {
    const rec = meta.get(key)
    const item = selectedItem() || Object.keys(ITEMS).find((k) => bag.count(k))
    if (!item || !bag.take(item, 1)) { api.toast(t('bagFull')); return }
    rec.slots[i] = { item, n: (rec.slots[i] && rec.slots[i].item === item ? rec.slots[i].n : 0) + 1, price: rec.slots[i] && rec.slots[i].price || Math.max(1, ITEMS[item].base || 1) }
    paintHotbar()
  }
  function takeTill(key) {
    const rec = meta.get(key)
    if (!rec.till) return
    wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
    rec.till = 0
    paintChip()
  }
  function onBreak(x, y, z, id) {
    if (mode !== 'survival') return true
    if (id === 21) { api.toast(t('coreplateToast')); return false }
    if (x >= 4 && x <= 13 && z >= 4 && z <= 11 && y >= 4 && y <= 9) { api.toast(t('shopProtected')); return false }
    const drop = dropOf(id)
    if (drop && bag.add(drop, 1)) { api.toast(t('bagFull')); return false }
    if (id === 12 && !placedLeaves.has(x + ',' + y + ',' + z)) {
      const spot = x + ',' + y + ',' + z
      const h = (x * 374761393 + y * 668265263 + z * 1274126177) >>> 0
      if (!wallet.state.picked.includes(spot) && (h / 4294967296) < 0.33) {
        wallet.state.picked.push(spot)
        bag.add('berry', 1)
      }
    }
    if (id === 24 || id === 26) return false
    bagHist.push({ type: 'break', item: drop, n: drop ? 1 : 0 })
    return true
  }
  function onPlace(x, y, z, id) {
    if (mode !== 'survival') return true
    const item = selectedItem()
    const need = Object.entries(ITEMS).find(([, v]) => v.block === id)
    const key = need ? need[0] : item
    if (!key || !bag.count(key)) { api.toast(t('noItem').replace('{item}', itemName(key || 'stone'))); return false }
    if (!bag.take(key, 1)) return false
    if (id === 12) placedLeaves.add(x + ',' + y + ',' + z)
    if (id === 24) meta.set(x + ',' + y + ',' + z, { kind: 'vend', owner: 'you', slots: [null, null, null, null], till: 0, sales: [], salesN: 0 })
    bagHist.push({ type: 'place', item: key, n: 1 })
    redoBag.length = 0
    paintHotbar()
    return true
  }
  function pickup(x, y, z, id) {
    const key = x + ',' + y + ',' + z
    if (id === 24) {
      const rec = meta.get(key)
      if (rec) {
        for (const s of rec.slots) if (s) bag.add(s.item, s.n)
        if (rec.till) wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
        meta.delete(key)
      }
      bag.add('vend', 1)
    }
    if (id === 26) { home = null; bag.add('bunk', 1) }
    return true
  }
  function beforeUndo() {
    if (mode !== 'survival' || !bagHist.length) return true
    const h = bagHist[bagHist.length - 1]
    if (h.type === 'break' && h.item && bag.count(h.item) < h.n) { api.toast(t('alreadyLeft')); return false }
    return true
  }
  function afterUndo() {
    if (mode !== 'survival') return
    const h = bagHist.pop()
    if (!h) return
    if (h.type === 'place') bag.add(h.item, h.n)
    if (h.type === 'break' && h.item) bag.take(h.item, h.n)
    redoBag.push(h)
    paintHotbar()
  }
  function beforeRedo() {
    if (mode !== 'survival' || !redoBag.length) return true
    const h = redoBag[redoBag.length - 1]
    if (h.type === 'place' && h.item && bag.count(h.item) < h.n) { api.toast(t('noItem').replace('{item}', itemName(h.item))); return false }
    return true
  }
  function afterRedo() {
    if (mode !== 'survival') return
    const h = redoBag.pop()
    if (!h) return
    bagHist.push(h)
    if (h.type === 'place') bag.take(h.item, h.n)
    if (h.type === 'break' && h.item) bag.add(h.item, h.n)
    paintHotbar()
  }
  function vendTick(n = 1) {
    today()
    let sales = 0
    for (const [key, rec] of meta) {
      if (rec.kind !== 'vend') continue
      for (let i = 0; i < n; i++) {
        if ((rec.salesN || 0) >= (ECON.townsfolk.maxPerCounterPerDay || 20)) break
        const hit = visit(rec, hashKey(key), day, visitN++, (item) => (ITEMS[item] && ITEMS[item].base) || 1)
        if (!hit) continue
        rec.salesN = (rec.salesN || 0) + 1
        rec.slots[hit.i].n -= hit.n
        if (!rec.slots[hit.i].n) rec.slots[hit.i] = null
        rec.till += hit.cogs
        rec.sales = (rec.sales || []).concat([{ at: Date.now(), item: hit.item, n: hit.n, cogs: hit.cogs }]).slice(-20)
        wallet.post({ kind: 'vend-sale', item: hit.item, n: hit.n, cogs: 0, by: 'townsfolk' })
        sales++
        api.toast(t('townBought').replace('{n}', hit.n).replace('{item}', itemName(hit.item)).replace('{cogs}', hit.cogs))
      }
    }
    return sales
  }
  function dump() {
    const m = {}
    for (const [k, v] of meta) m[k] = v
    return { player: { mode, bag: bag.dump(), hot, home, table: api.tableOn() }, econ: wallet.dump(), meta: m }
  }
  function load(doc) {
    mode = (doc.player && doc.player.mode) || 'creative'
    bag.load(doc.player && doc.player.bag)
    home = doc.player && doc.player.home || null
    hot = (doc.player && doc.player.hot) || 0
    wallet.load(doc.econ)
    if (!wallet.state.ledger.length) wallet.post({ kind: 'start', cogs: 0, by: 'you' })
    meta.clear()
    for (const [k, v] of Object.entries(doc.meta || {})) meta.set(k, v)
    day = wallet.state.day || day
    paintChip(); paintHotbar()
  }
  function setMode(next) { mode = next; paintChip(); paintHotbar() }
  setInterval(() => { if (!paused && mode === 'survival' && ECON.townsfolk.on) vendTick(1) }, 30000)
  return {
    bag, wallet, meta, paintBag, paintCraft, paintShop, paintWallet, paintSettings, paintTeacher, paintPrices, paintCounter, paintBunk,
    onBreak, onPlace, beforeUndo, afterUndo, beforeRedo, afterRedo, vendTick, dump, load, setMode, paintChip, paintHotbar, selectedItem, pickup,
    get mode() { return mode }, set paused(v) { paused = v }, get home() { return home },
    setDay(iso) { day = iso; wallet.state.day = iso; wallet.state.soldToday = {}; for (const rec of meta.values()) rec.visits = 0 },
    give(item, n) { bag.add(item, n); paintHotbar() },
    blockForHot() { const k = selectedItem(); return k && ITEMS[k] && ITEMS[k].block },
  }
}
