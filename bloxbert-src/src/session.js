// Survival session: bag, Cogs, shop, counters, bunk. Creative never touches this bag.
import { ITEMS, dropOf, saplingRoll } from './data/items.js'
import { RECIPES } from './data/recipes.js'
import { ECON } from './data/econ.js'
import { pays, sells } from './data/econ.js'
import { createBag } from './items.js'
import { canMake, craftStatus, maxTimes, make } from './craft.js'
import { createWallet } from './econ/wallet.js'
import { quoteSell, quoteBuy, canSellToday } from './econ/store.js'
import { visit } from './econ/vend.js'
import { blockIcon, itemSvg } from './icons.js'
import { mergeOrAdd, stepMagnet, canPick, nearPlayer, pullLoose, noteId } from './drops.js'
import { emptyBox, putInSlots } from './box.js'
import { TOOL_LIFE } from './feel.js'

export function createSession(api) {
  const bag = createBag()
  const wallet = createWallet(ECON)
  const meta = new Map()
  let mode = 'survival'
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
  const ground = []
  const lost = []
  wallet.state.day = day
  wallet.post({ kind: 'start', cogs: 0, by: 'you' })

  function t(k) { return api.t(k) }
  function itemName(k) { return t(k) }
  function today() {
    if (wallet.state.day !== day) { wallet.state.day = day; wallet.state.soldToday = {}; wallet.state.spentToday = 0 }
    return day
  }
  function markFound(item) {
    if (!item || !ITEMS[item]) return
    if (!wallet.state.found) wallet.state.found = []
    if (!wallet.state.found.includes(item)) wallet.state.found.push(item)
  }
  function spawnDrop(item, n, x, y, z, why) {
    const where = mergeOrAdd(ground, lost, { item, n, x, y, z, at: Date.now() })
    if (where === 'lost') api.toast(t('lostFound'))
    else if (why === 'q') api.toast(t('dropped'))
    else if (why === 'full') api.toast(t('bagFull'))
    if (api.markDirty) api.markDirty()
    return where
  }
  function giveItem(item, n = 1) {
    markFound(item)
    const left = bag.add(item, n)
    if (n - left) paintHotbar()
    if (left) {
      const p = api.pos()
      spawnDrop(item, left, p[0], p[1] + 0.3, p[2], 'full')
    }
    return left
  }
  function heading() { return api.heading ? api.heading() : 0 }
  function dropSpot() {
    const p = api.pos()
    const h = heading()
    let x = p[0] + Math.sin(h) * 0.9
    let z = p[2] + Math.cos(h) * 0.9
    const y = p[1] + 0.35
    if (api.getVoxel && api.getVoxel(Math.floor(x), Math.floor(y), Math.floor(z))) { x = p[0]; z = p[2] }
    return [x, y, z]
  }
  function dropHeld(all) {
    if (mode !== 'survival') return
    const s = bag.slots[hot]
    if (!s) return
    const n = all ? s.n : 1
    const item = s.item
    if (!bag.take(item, n)) return
    const p = dropSpot()
    spawnDrop(item, n, p[0], p[1], p[2], 'q')
    paintHotbar()
  }
  function dropItem(item, all) {
    if (mode !== 'survival' || !bag.count(item)) return
    const n = all ? bag.count(item) : 1
    if (!bag.take(item, n)) return
    const p = dropSpot()
    spawnDrop(item, n, p[0], p[1], p[2], 'q')
    paintHotbar()
  }
  function takeLost() {
    let got = 0
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (let i = 0; i < lost.length;) {
      const d = lost[i]
      const left = bag.add(d.item, d.n)
      const took = d.n - left
      got += took
      if (took && !first) first = d.item
      if (left) { d.n = left; break }
      lost.splice(i, 1)
    }
    takeHand(first, wasEmpty)
    if (got) { paintHotbar(); paintChip(); api.toast(t('pickedUp')); if (api.markDirty) api.markDirty() }
    else if (lost.length) api.toast(t('bagFull'))
    return got
  }
  const dropPlayer = { x: 0, y: 0, z: 0 }
  const dropFeet = { x: 0, y: 0, z: 0 }
  function tickDrops(dt) {
    if (mode !== 'survival' || !ground.length) return false
    const p = api.pos()
    dropPlayer.x = p[0]
    dropPlayer.y = p[1] + 0.9
    dropPlayer.z = p[2]
    dropFeet.x = p[0]
    dropFeet.y = p[1]
    dropFeet.z = p[2]
    const now = Date.now()
    const moved = stepMagnet(ground, dropPlayer, (dt || 16) / 1000, now)
    let got = 0
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (let i = ground.length - 1; i >= 0; i--) {
      const d = ground[i]
      if (!canPick(d, now) || !nearPlayer(d, dropFeet)) continue
      const left = bag.add(d.item, d.n)
      const took = d.n - left
      if (!took) continue
      got += took
      if (!first) first = d.item
      markFound(d.item)
      if (left) d.n = left
      else ground.splice(i, 1)
    }
    takeHand(first, wasEmpty)
    if (got) { paintHotbar(); paintChip(); api.toast(t('pickedUp')) }
    if (moved || got) { if (api.markDirty) api.markDirty(); return true }
    return false
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
      if (item && item.svg) sw.innerHTML = itemSvg(item.svg)
      else if (item && item.block && api.blockIcon) sw.append(api.blockIcon(item.block))
      else if (item) sw.innerHTML = itemSvg('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/></svg>')
      const tag = document.createElement('span')
      tag.className = 'tag'
      tag.textContent = item ? item.letter : ''
      const lbl = document.createElement('span')
      lbl.className = 'lbl'
      lbl.textContent = s ? String(s.n) : ''
      b.append(sw, tag, lbl)
      const wear = s && wearBar(item, s.uses)
      if (wear) b.append(wear)
      if (!s) b.classList.add('empty')
      b.setAttribute('aria-pressed', String(i === hot))
      b.addEventListener('click', () => {
        if (i === hot) useHeld()
        else { hot = i; paintHotbar(); if (s) api.flash && api.flash(itemName(s.item)) }
      })
      bar.append(b)
    }
    const bagBtn = document.createElement('button')
    bagBtn.type = 'button'
    bagBtn.className = 'slot bag-tile'
    bagBtn.dataset.bag = '1'
    bagBtn.innerHTML = '<span class="gic"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 8h12v12H6z" fill="none" stroke="currentColor"/></svg></span><span class="lbl"></span>'
    bagBtn.querySelector('.lbl').textContent = t('bag')
    bagBtn.addEventListener('click', () => { if (api.open) api.open('inventory') })
    bar.append(bagBtn)
    const held = bag.slots[hot]
    const label = document.getElementById('current')
    if (label) label.textContent = held ? itemName(held.item) : t('emptySlot')
  }
  function selectedItem() {
    if (mode !== 'survival') return null
    return bag.slots[hot] && bag.slots[hot].item
  }
  const EDIBLE = ['berry', 'bread', 'cupcake']
  function useHeld() {
    const item = selectedItem()
    if (!item) return ''
    if (EDIBLE.includes(item) && bag.take(item, 1)) {
      paintHotbar()
      api.toast(t('ate').replace('{item}', itemName(item)))
      if (api.markDirty) api.markDirty()
      return itemName(item)
    }
    const name = itemName(item)
    if (api.flash) api.flash(name)
    return name
  }
  function selectOwned(blockId) {
    const key = Object.entries(ITEMS).find(([, v]) => v.block === blockId)
    if (!key || !bag.count(key[0])) return false
    const i = bag.slots.findIndex((s) => s && s.item === key[0])
    if (i < 0) return false
    if (i > 8) {
      const tmp = bag.slots[hot]
      bag.slots[hot] = bag.slots[i]
      bag.slots[i] = tmp
    } else hot = i
    paintHotbar()
    if (api.markDirty) api.markDirty()
    if (api.flash) api.flash(itemName(key[0]))
    return true
  }
  function near(kind) {
    const ids = kind === 'bench' ? [22] : kind === 'oven' ? [23] : kind === 'smelter' || kind === 'forge' ? [42] : kind === 'fabricator' ? [43] : []
    const p = api.pos()
    for (let dx = -4; dx <= 4; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -4; dz <= 4; dz++) {
      const id = api.getVoxel(Math.floor(p[0]) + dx, Math.floor(p[1]) + dy, Math.floor(p[2]) + dz)
      if (ids.includes(id)) return true
    }
    return false
  }
  function holdItem(itemKey, index) {
    let i = Number.isInteger(index) ? index : -1
    if (!bag.slots[i] || bag.slots[i].item !== itemKey) i = bag.slots.findIndex((s) => s && s.item === itemKey)
    if (i < 0) return false
    if (i > 8) {
      const tmp = bag.slots[hot]
      bag.slots[hot] = bag.slots[i]
      bag.slots[i] = tmp
    } else hot = i
    paintHotbar()
    if (api.markDirty) api.markDirty()
    return true
  }
  function card(g, itemKey, index) {
    const item = ITEMS[itemKey]
    const p = document.createElement('p')
    p.className = 'gnote'
    const pay = quoteSell(item, wallet.state.soldToday[itemKey] || 0, wallet.state.dial || 1, { ...ECON, dial: wallet.state.dial })
    p.innerHTML = '<bdi>' + t('worth') + ' ⚙ ' + (item.base || 0) + ' · ' + t('tallyPays') + ' ⚙ ' + pay + ' · ' + t('youHave') + ' ' + bag.count(itemKey) + '</bdi>'
    g.append(p)
    if (mode === 'survival' && bag.count(itemKey)) {
      g.append(btn(t('holdIt'), () => { holdItem(itemKey, index); if (api.close) api.close() }))
      g.append(btn(t('drop1'), () => { dropItem(itemKey, false); api.close() }))
      g.append(btn(t('dropAll'), () => { dropItem(itemKey, true); api.close() }))
    }
  }
  function itemIcon(item) {
    if (!item) return document.createElement('span')
    if (item.svg) { const s = document.createElement('span'); s.innerHTML = itemSvg(item.svg); return s }
    if (item.block && api.blockIcon) return api.blockIcon(item.block)
    const s = document.createElement('span')
    s.innerHTML = itemSvg('<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>')
    return s
  }
  function paintBag(g) {
    if (mode !== 'survival') {
      for (const [k, item] of Object.entries(ITEMS)) {
        if (!item.block) continue
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'gtile'
        const pic = document.createElement('span')
        pic.className = 'gic'
        pic.append(api.blockIcon ? api.blockIcon(item.block) : document.createElement('canvas'))
        b.append(pic)
        const lbl = document.createElement('span')
        lbl.className = 'glbl'
        lbl.textContent = itemName(k)
        b.append(lbl)
        b.addEventListener('click', () => { if (api.assign) api.assign(item.block, k); api.toast(itemName(k)) })
        g.append(b)
      }
      return
    }
    g.classList.add('baggrid')
    if (!bag.slots.some(Boolean)) {
      const p = document.createElement('p')
      p.className = 'gnote'
      p.textContent = t('emptyBag')
      g.append(p)
    }
    if (lost.length) {
      const n = lost.reduce((s, d) => s + d.n, 0)
      g.append(btn(t('lostBtn') + ' · ' + n, () => { takeLost(); g.innerHTML = ''; paintBag(g) }))
    }
    const paintOne = (s, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      const pic = document.createElement('span')
      pic.className = 'gic'
      pic.append(s ? itemIcon(ITEMS[s.item]) : document.createElement('span'))
      b.append(pic)
      const lbl = document.createElement('span')
      lbl.className = 'glbl'
      lbl.textContent = s ? bagLine(s) : ''
      b.append(lbl)
      const bar = s && wearBar(ITEMS[s.item], s.uses)
      if (bar) b.append(bar)
      if (i < 9 && i === hot) b.classList.add('on')
      b.setAttribute('aria-pressed', String(i < 9 && i === hot))
      b.setAttribute('aria-label', s ? itemName(s.item) : t('emptySlot'))
      if (!s) b.disabled = true
      else b.addEventListener('click', () => card(g, s.item, i))
      g.append(b)
    }
    const barHead = document.createElement('div')
    barHead.className = 'gnote ghead'
    barHead.textContent = t('hotbar')
    g.append(barHead)
    for (let i = 0; i < 9; i++) paintOne(bag.slots[i], i)
    const pockets = document.createElement('div')
    pockets.className = 'gnote ghead'
    pockets.textContent = t('pockets')
    g.append(pockets)
    for (let i = 9; i < bag.slots.length; i++) paintOne(bag.slots[i], i)
  }
  function paintCraft(g) {
    const stations = { bench: near('bench'), oven: near('oven'), smelter: near('smelter'), forge: near('forge'), fabricator: near('fabricator') }
    const rows = RECIPES.map((r) => ({ r, st: craftStatus(r, bag, stations, mode !== 'survival') }))
    const draw = (list) => {
      for (const { r, st } of list) {
        const row = document.createElement('div')
        row.className = 'craft-row'
        const b = document.createElement('button')
        b.type = 'button'
        b.className = 'gtile'
        const out = ITEMS[r.out[0]]
        b.innerHTML = '<span class="gic"></span><span class="glbl"></span><span class="gneed"></span>'
        b.querySelector('.gic').append(itemIcon(out))
        const note = st.needs.map(([k, have, n]) => itemName(k) + ' ' + have + '/' + n).join(' ')
        const station = st.station === 'oven' ? t('needsOven') : st.station === 'bench' ? t('needsBench') : st.station === 'smelter' ? t('needsT4') : st.station === 'forge' ? t('needsT4') : st.station === 'fabricator' ? t('needsT5') : ''
        const gateLine = st.gate === 'T5' ? t('needsT5') : st.gate === 'T4' ? t('needsT4') : ''
        b.querySelector('.glbl').textContent = itemName(r.out[0])
        b.querySelector('.gneed').textContent = gateLine || (station ? note + ' · ' + station : note)
        b.disabled = !st.ok
        b.addEventListener('click', () => { craftMany(r, 1); g.innerHTML = ''; paintCraft(g) })
        row.append(b)
        const times = maxTimes(r, bag)
        if (st.ok && times > 1) {
          const max = document.createElement('button')
          max.type = 'button'
          max.className = 'gtile xmax'
          max.textContent = t('timesMax')
          max.addEventListener('click', () => { craftMany(r, times); g.innerHTML = ''; paintCraft(g) })
          row.append(max)
        }
        g.append(row)
      }
    }
    const head = (key) => {
      const p = document.createElement('p')
      p.className = 'gnote ghead'
      p.textContent = t(key)
      g.append(p)
    }
    const now = rows.filter((x) => x.st.group === 'now')
    const almost = rows.filter((x) => x.st.group === 'almost')
    const gated = rows.filter((x) => x.st.group === 'gated')
    const rest = rows.filter((x) => x.st.group === 'rest')
    if (now.length) { head('canNow'); draw(now) }
    if (almost.length) { head('almost'); draw(almost) }
    if (rest.length || gated.length) {
      const toggle = document.createElement('button')
      toggle.type = 'button'
      toggle.className = 'gtile wide'
      toggle.textContent = t('showAll')
      toggle.addEventListener('click', () => { craftOpen = !craftOpen; g.innerHTML = ''; paintCraft(g) })
      g.append(toggle)
      if (craftOpen) draw(gated.concat(rest))
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
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic"></span><span class="glbl"></span>'
      b.querySelector('.gic').append(itemIcon(item))
      b.querySelector('.glbl').textContent = item.sell ? itemName(k) + ' · ' + t('sell') + ' ⚙ ' + pay : itemName(k)
      b.disabled = !item.sell || !canSellToday(sold, wallet.state.dailyCap || ECON.dailyCap)
      b.addEventListener('click', () => { sell(k, 1); paintSell(g) })
      g.append(b)
    }
  }
  function paintBuy(g) {
    for (const el of [...g.querySelectorAll('.item,.break')]) el.remove()
    const br = document.createElement('div')
    br.className = 'break'
    g.append(br)
    for (const k of ECON.storeSells) {
      const item = ITEMS[k]
      const price = quoteBuy(item, wallet.state.dial || 1, ECON)
      const known = (wallet.state.found || []).includes(k)
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile item'
      b.innerHTML = '<span class="gic"></span><span class="glbl"></span><span class="gneed"></span>'
      b.querySelector('.gic').append(itemIcon(item))
      b.querySelector('.glbl').textContent = itemName(k)
      b.querySelector('.gneed').textContent = known ? '⚙ ' + price : t('findFirst')
      b.disabled = !known
      if (known) b.addEventListener('click', () => buy(k, 1, price))
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
    const send = document.createElement('button')
    send.type = 'button'
    send.className = 'gtile'
    send.innerHTML = '<span class="gic">📤</span><span class="glbl">' + t('sendTeacher') + '</span>'
    send.addEventListener('click', () => {
      if (wallet.state.cogs < 1) return
      wallet.post({ kind: 'to-teacher', cogs: -1, perk: 'shout', status: 'waiting', by: 'you' })
      paintChip()
      api.toast(t('sentTeacher'))
    })
    g.append(send)
    const phrase = { sell: t('sold'), buy: t('bought'), 'till-take': t('takeTill'), 'vend-sale': t('townBought'), start: t('startCogs'), teacher: t('teacher') }
    for (const row of wallet.state.ledger.slice(-10).reverse()) {
      const line = document.createElement('p')
      line.className = 'gnote'
      const time = new Date(row.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      const words = (phrase[row.kind] || row.kind).replace('{n}', row.n || 0).replace('{item}', itemName(row.item || '')).replace('{cogs}', row.price || Math.abs(row.cogs))
      line.innerHTML = '<bdi>' + words + ' ' + (row.cogs ? (row.cogs > 0 ? '+' : '') + '⚙' + row.cogs : '') + ' · ' + time + '</bdi>'
      g.append(line)
    }
  }
  function paintSettings(g) {
    g.append(btn(t('alwaysDay'), () => {
      const on = document.documentElement.dataset.alwaysDay === '1'
      const next = !on
      document.documentElement.dataset.alwaysDay = next ? '1' : '0'
      if (api.setAlways) api.setAlways(next)
      api.toast(t('alwaysDay'))
    }))
    const n = document.createElement('p')
    n.className = 'gnote'
    n.textContent = t('onDevice')
    g.append(n)
  }
  function paintTeacher(g) {
    if (!(api.staff && api.staff())) {
      const note = document.createElement('p')
      note.className = 'gnote'
      note.textContent = t('askStaff')
      g.append(note)
      return
    }
    const on = api.teacher && api.teacher()
    g.append(btn(on ? t('teacherOn') : t('teacherOff'), () => {
      if (!on && !confirm(t('teacherAsk'))) return
      if (api.setTeacher) api.setTeacher(!on)
      g.innerHTML = ''
      paintTeacher(g)
    }))
    if (on) g.append(btn(api.townYes && api.townYes() ? t('townYes') : t('townNo'), () => {
      if (api.setTown) api.setTown(!(api.townYes && api.townYes()))
      g.innerHTML = ''
      paintTeacher(g)
    }))
    g.append(btn(t('priceDial'), () => { wallet.state.dial = wallet.state.dial === 1 ? 1.5 : 1; api.toast(t('pricesChanged')) }))
    g.append(btn(t('townsfolk'), () => { ECON.townsfolk.on = !ECON.townsfolk.on }))
    g.append(btn(t('resetWallet'), () => { if (confirm(t('resetWallet'))) { wallet.state.cogs = wallet.state.start; wallet.state.ledger = []; wallet.post({ kind: 'teacher', cogs: 0, by: 'teacher' }); paintChip() } }))
  }
  function paintCounter(g, key) {
    g.innerHTML = ''
    const rec = meta.get(key)
    if (!rec) return
    rec.slots.forEach((s, i) => {
      g.append(btn((s ? itemName(s.item) + ' ' + s.n + ' ⚙ ' + s.price : t('stock')) + ' ' + (i + 1), () => stock(key, i)))
    })
    g.append(btn(t('takeTill') + ' ⚙ ' + rec.till, () => { takeTill(key); paintCounter(g, key) }))
    g.append(btn('🧹 ' + t('pickup'), () => {
      const ask = document.createElement('div')
      ask.className = 'ggrid'
      const card = document.createElement('p')
      card.className = 'gnote'
      card.innerHTML = '<img alt="" src="assets/tile-vend.png" width="48" height="48"> '
      card.append(document.createTextNode(t('pickup') + '?'))
      const yes = document.createElement('button')
      yes.type = 'button'
      yes.className = 'gtile'
      yes.innerHTML = '<span class="gic">✓</span><span class="glbl"></span>'
      yes.querySelector('.glbl').textContent = t('pickup')
      yes.addEventListener('click', () => { const [x, y, z] = String(key).split(',').map(Number); pickup(x, y, z, 24); api.close() })
      const no = document.createElement('button')
      no.type = 'button'
      no.className = 'gtile'
      no.innerHTML = '<span class="gic">✕</span><span class="glbl"></span>'
      no.querySelector('.glbl').textContent = t('no')
      no.addEventListener('click', () => ask.remove())
      ask.append(card, yes, no)
      g.append(ask)
    }))
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
  function boxRec(key) {
    let rec = meta.get(key)
    if (!rec || !Array.isArray(rec.slots)) {
      rec = { kind: 'box', slots: emptyBox() }
      meta.set(key, rec)
    }
    while (rec.slots.length < 18) rec.slots.push(null)
    return rec
  }
  function spillBox(x, y, z) {
    const key = x + ',' + y + ',' + z
    const rec = meta.get(key)
    if (!rec || !rec.slots) return
    let first = ''
    const wasEmpty = !bag.slots[hot]
    for (const s of rec.slots) {
      if (!s || !s.n) continue
      const before = bag.count(s.item)
      const left = bag.add(s.item, s.n)
      if (!first && bag.count(s.item) > before) first = s.item
      if (left) spawnDrop(s.item, left, x + 0.5, y + 0.4, z + 0.5, 'full')
    }
    meta.delete(key)
    takeHand(first, wasEmpty)
    paintHotbar()
    paintChip()
  }
  function paintBox(g, key) {
    const rec = boxRec(key)
    g.classList.add('baggrid')
    g.append(btn(t('putIn'), () => {
      const item = selectedItem()
      if (!item) { api.toast(t('emptySlot')); return }
      const have = bag.count(item)
      const moved = putInSlots(rec.slots, item, have)
      const kept = have - moved.left
      if (!kept) { api.toast(t('boxFull')); return }
      if (!bag.take(item, kept)) return
      rec.slots = moved.slots
      if (moved.left) api.toast(t('boxFull'))
      paintHotbar()
      if (api.markDirty) api.markDirty()
      g.innerHTML = ''
      paintBox(g, key)
    }))
    const put = g.lastChild || g.children[g.children.length - 1]
    if (put && put.classList) put.classList.add('wide')
    rec.slots.forEach((s, i) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile slot'
      const info = s && ITEMS[s.item]
      if (s && info) {
        b.innerHTML = '<span class="gic">' + (info.svg ? itemSvg(info.svg) : info.letter) + '</span><span class="glbl"></span>'
        const name = b.querySelector('.glbl')
        if (name) name.textContent = String(s.n)
      }
      b.setAttribute('aria-label', s ? itemName(s.item) + ' ' + s.n : t('emptySlot'))
      if (!s) b.disabled = true
      else b.addEventListener('click', () => {
        const left = bag.add(s.item, s.n)
        if (left === s.n) { api.toast(t('bagFull')); return }
        rec.slots[i] = left ? { item: s.item, n: left } : null
        paintHotbar()
        if (api.markDirty) api.markDirty()
        g.innerHTML = ''
        paintBox(g, key)
      })
      g.append(b)
    })
  }
  function paintBunk(g, key) {
    g.append(btn(t('yes'), () => { home = String(key || '0,0,0').split(',').map(Number); markPath('pathHome'); api.toast(t('homeSet')); api.close() }))
    g.append(btn('🧹 ' + t('pickup'), () => { home = null; api.toast(t('homeCleared')); api.close() }))
    g.append(btn(t('no'), () => api.close()))
  }
  let craftOpen = false
  function craftMany(r, times) {
    const stations = { bench: near('bench'), oven: near('oven') }
    const n = Math.min(times, maxTimes(r, bag))
    if (!n || !canMake(r, bag, stations).ok) return false
    for (const [item, need] of r.in) bag.take(item, need * n)
    const left = bag.add(r.out[0], r.out[1] * n)
    markFound(r.out[0])
    if (left) {
      const p = api.pos()
      spawnDrop(r.out[0], left, p[0], p[1] + 0.3, p[2], 'full')
    } else api.toast(t('make') + ' ' + itemName(r.out[0]) + (n > 1 ? ' ×' + n : ''))
    if (r.out[0] === 'woodTool') markPath('pathTool')
    paintHotbar()
    return true
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
    if (!(wallet.state.found || []).includes(k)) { api.toast(t('findFirst')); return false }
    if (wallet.state.cogs < price * n) { api.toast(t('needMore').replace('{n}', price * n - wallet.state.cogs)); return false }
    if (bag.add(k, n)) { api.toast(t('bagFull')); return false }
    wallet.state.spentToday += price * n
    wallet.post({ kind: 'buy', item: k, n, cogs: -price * n, by: 'tally' })
    paintChip(); paintHotbar()
    api.toast(t('bought').replace('{n}', n).replace('{item}', itemName(k)))
    return true
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
  function takeHand(item, wasEmpty) {
    if (!wasEmpty || !item) return
    if (bag.slots[hot] && bag.slots[hot].item === item) return
    const i = bag.slots.findIndex((s) => s && s.item === item)
    if (i >= 0 && i < 9) hot = i
  }
  function markPath(id) { if (api.path) api.path(id) }
  function onBreak(x, y, z, id) {
    if (mode !== 'survival') return true
    if (id === 21) { api.toast(t('coreplateToast')); return false }
    if (api.townKept && api.townKept(x, y, z)) { api.toast(t('shopProtected')); return false }
    if (id === 24 || id === 26) return false
    if (id === 27) spillBox(x, y, z)
    const drop = dropOf(id)
    let got = 0
    let loose = 0
    const wasEmpty = !bag.slots[hot]
    if (drop) {
      markFound(drop)
      const left = bag.add(drop, 1)
      got = 1 - left
      loose = left
      if (left) spawnDrop(drop, left, x + 0.5, y + 0.4, z + 0.5, 'full')
      else takeHand(drop, wasEmpty)
    }
    if (id === 12 && !placedLeaves.has(x + ',' + y + ',' + z)) {
      const spot = x + ',' + y + ',' + z
      const h = (x * 374761393 + y * 668265263 + z * 1274126177) >>> 0
      if (!wallet.state.picked.includes(spot) && (h / 4294967296) < 0.33) {
        wallet.state.picked.push(spot)
        markFound('berry')
        const berryLeft = bag.add('berry', 1)
        if (berryLeft) spawnDrop('berry', berryLeft, x + 0.5, y + 0.7, z + 0.5, 'full')
      }
    }
    bagHist.push({ type: 'break', item: drop, n: got, loose })
    if (id === 12 && saplingRoll(x, y, z)) {
      markFound('sapling')
      const sapLeft = bag.add('sapling', 1)
      if (sapLeft) spawnDrop('sapling', sapLeft, x + 0.5, y + 0.55, z + 0.5, 'full')
    }
    if (id === 11) markPath('pathTree')
    if (id === 3) markPath('pathStone')
    if (id === 5) markPath('pathCoal')
    wearHeld()
    paintHotbar()
    paintChip()
    return true
  }
  function wearBar(item, uses) {
    const life = item && TOOL_LIFE[item.tool]
    if (!life) return null
    const bar = document.createElement('span')
    bar.className = 'wear'
    const fill = document.createElement('span')
    fill.className = 'fill'
    const left = uses == null ? life : uses
    fill.style.width = Math.max(0, Math.min(100, Math.round((left / life) * 100))) + '%'
    bar.append(fill)
    return bar
  }
  function bagLine(s) {
    if (s.item === 'woodTool') return t('woodToolLine')
    if (s.item === 'stoneTool') return t('stoneToolLine')
    return itemName(s.item) + ' ' + s.n
  }
  function wearHeld() {
    const s = bag.slots[hot]
    if (!s || !ITEMS[s.item] || !ITEMS[s.item].tool) return
    const life = TOOL_LIFE[ITEMS[s.item].tool]
    if (!life) return
    if (s.uses == null) s.uses = life
    s.uses -= 1
    if (s.uses > 0) return
    bag.slots[hot] = null
    const left = bag.add('stick', 1)
    if (left) {
      const p = api.pos()
      spawnDrop('stick', left, p[0], p[1] + 0.3, p[2], 'full')
    }
    api.toast(t('toolStick'))
  }
  function onPlace(x, y, z, id) {
    if (mode !== 'survival') return true
    if (id === 185) {
      const below = api.getVoxel ? api.getVoxel(x, y - 1, z) : 0
      if (below !== 1 && below !== 2) { api.toast(t('saplingSoil')); return false }
    }
    if (api.townKept && api.townKept(x, y, z)) { api.toast(t('shopProtected')); return false }
    const item = selectedItem()
    const need = Object.entries(ITEMS).find(([, v]) => v.block === id)
    const key = need ? need[0] : item
    if (!key || !bag.count(key)) { api.toast(t('noItem').replace('{item}', itemName(key || 'stone'))); return false }
    if (!bag.take(key, 1)) return false
    if (id === 12) placedLeaves.add(x + ',' + y + ',' + z)
    if (id === 24) meta.set(x + ',' + y + ',' + z, { kind: 'vend', owner: 'you', slots: [null, null, null, null], till: 0, sales: [], salesN: 0 })
    if (id === 27) meta.set(x + ',' + y + ',' + z, { kind: 'box', slots: emptyBox() })
    if (id === 30) markPath('pathDoor')
    bagHist.push({ type: 'place', item: key, n: 1 })
    redoBag.length = 0
    paintHotbar()
    return true
  }
  function pickup(x, y, z, id) {
    const key = x + ',' + y + ',' + z
    const wasEmpty = !bag.slots[hot]
    let first = ''
    if (id === 24) {
      const rec = meta.get(key)
      if (rec) {
        for (const s of rec.slots) if (s) {
          const before = bag.count(s.item)
          bag.add(s.item, s.n)
          if (!first && bag.count(s.item) > before) first = s.item
        }
        const beforeVend = bag.count('vend')
        bag.add('vend', 1)
        if (!first && bag.count('vend') > beforeVend) first = 'vend'
        if (rec.till) wallet.post({ kind: 'till-take', cogs: rec.till, by: 'you' })
        meta.delete(key)
      }
      if (api.removeBlock) api.removeBlock(x, y, z)
    }
    if (id === 26) {
      home = null
      const before = bag.count('bunk')
      bag.add('bunk', 1)
      if (!first && bag.count('bunk') > before) first = 'bunk'
    }
    takeHand(first, wasEmpty)
    paintHotbar()
    paintChip()
    return true
  }
  function beforeUndo() {
    if (mode !== 'survival' || !bagHist.length) return true
    const h = bagHist[bagHist.length - 1]
    if (h.type === 'break' && h.item && h.n && bag.count(h.item) < h.n) { api.toast(t('alreadyLeft')); return false }
    if (h.type === 'break' && h.loose && !pullLoose(ground, lost, (k) => bag.count(k), (k, n) => bag.take(k, n), h.item, h.loose)) { api.toast(t('alreadyLeft')); return false }
    return true
  }
  function afterUndo() {
    if (mode !== 'survival') return
    const h = bagHist.pop()
    if (!h) return
    if (h.type === 'place') bag.add(h.item, h.n)
    if (h.type === 'break' && h.item && h.n) bag.take(h.item, h.n)
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
    if (h.type === 'break' && h.item) {
      if (h.n) bag.add(h.item, h.n)
      if (h.loose) {
        const p = api.pos()
        spawnDrop(h.item, h.loose, p[0], p[1] + 0.3, p[2], 'full')
      }
    }
    paintHotbar()
  }
  function lostAdd(item, n) {
    if (!item || !(n > 0)) return
    const hit = lost.find((d) => d.item === item)
    if (hit) hit.n += n
    else lost.push({ item, n })
    if (api.markDirty) api.markDirty()
  }
  function tryCraft(name) {
    const r = RECIPES.find((x) => x.id === name || x.out[0] === name)
    if (!r) return { ok: false, why: 'missing' }
    const stations = { bench: near('bench'), oven: near('oven'), smelter: near('smelter'), forge: near('forge'), fabricator: near('fabricator') }
    const st = craftStatus(r, bag, stations, mode !== 'survival')
    if (!st.ok) return { ok: false, why: st.gate || st.station || 'count', gate: st.gate || '' }
    if (!make(r, bag)) return { ok: false, why: 'full' }
    paintHotbar()
    return { ok: true, n: bag.count(r.out[0]) }
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
        wallet.post({ kind: 'vend-sale', item: hit.item, n: hit.n, cogs: 0, price: hit.cogs, by: 'townsfolk' })
        sales++
        api.toast(t('townBought').replace('{n}', hit.n).replace('{item}', itemName(hit.item)).replace('{cogs}', hit.cogs))
      }
    }
    return sales
  }
  function dump() {
    const m = {}
    for (const [k, v] of meta) m[k] = v
    return { player: { mode, bag: bag.dump(), hot, home, table: api.tableOn() }, econ: wallet.dump(), meta: m, drops: ground.map((d) => ({ id: d.id, x: +d.x.toFixed(2), y: +d.y.toFixed(2), z: +d.z.toFixed(2), item: d.item, n: d.n, at: d.at })), lost: lost.map((d) => ({ item: d.item, n: d.n })) }
  }
  function load(doc) {
    mode = (doc.player && doc.player.mode) || 'survival'
    const extra = bag.load(doc.player && doc.player.bag) || []
    home = doc.player && doc.player.home || null
    hot = (doc.player && doc.player.hot) || 0
    wallet.load(doc.econ)
    if (!wallet.state.ledger.length) wallet.post({ kind: 'start', cogs: 0, by: 'you' })
    meta.clear()
    for (const [k, v] of Object.entries(doc.meta || {})) meta.set(k, v)
    day = wallet.state.day || day
    ground.length = 0
    lost.length = 0
    for (const d of doc.drops || []) {
      if (!d || !ITEMS[d.item] || !(d.n > 0)) continue
      ground.push({ id: d.id || ground.length + 1, x: +d.x || 0, y: +d.y || 0, z: +d.z || 0, item: d.item, n: d.n | 0, at: d.at || 0 })
      noteId(d.id || 0)
    }
    for (const d of doc.lost || []) if (d && ITEMS[d.item] && d.n > 0) lost.push({ item: d.item, n: d.n | 0 })
    for (const s of extra) if (s && ITEMS[s.item] && s.n > 0) {
      const hit = lost.find((d) => d.item === s.item)
      if (hit) hit.n += s.n
      else lost.push({ item: s.item, n: s.n })
    }
    if (extra.length) api.toast(t('keptAside'))
    for (const s of bag.slots) if (s) markFound(s.item)
    for (const item of (doc.econ && doc.econ.found) || []) markFound(item)
    paintChip(); paintHotbar()
  }
  function setMode(next) { mode = next; paintChip(); if (mode === 'survival') paintHotbar(); else if (api.paintBar) api.paintBar() }
  setInterval(() => { if (!paused && mode === 'survival' && ECON.townsfolk.on) vendTick(1) }, 30000)
  return {
    bag, wallet, meta, paintBag, paintCraft, paintShop, paintWallet, paintSettings, paintTeacher, paintPrices, paintCounter, paintBunk, paintBox,
    give: (item, n) => giveItem(item, n || 1),
    lostAdd,
    tryCraft,
    setCraftOpen(v) { craftOpen = !!v },
    lostItems: () => lost.map((d) => d.item + ':' + d.n),
    spend: (item, n) => bag.take(item, n),
    spendBlock: (id, n) => { const hit = Object.entries(ITEMS).find(([, v]) => v.block === id); const ok = hit ? bag.take(hit[0], n) : false; paintHotbar(); return ok },
    haveBlock: (id) => { const hit = Object.entries(ITEMS).find(([, v]) => v.block === id); return hit ? bag.count(hit[0]) : 0 },
    noteBag: (need) => { for (const [id, n] of Object.entries(need)) { const hit = Object.entries(ITEMS).find(([, v]) => v.block === +id); if (hit) bagHist.push({ type: 'place', item: hit[0], n }) } },
    setHot: (i) => { hot = ((i % 9) + 9) % 9; paintHotbar() },
    pressHot(i) {
      const n = ((i % 9) + 9) % 9
      if (n === hot) return useHeld()
      hot = n
      paintHotbar()
      const s = bag.slots[n]
      if (s && api.flash) api.flash(itemName(s.item))
      return ''
    },
    tryPlace: () => { const k = selectedItem(); const id = k && ITEMS[k] && ITEMS[k].block; return onPlace(1, 5, 1, id) },
    get hot() { return hot },
    onBreak, onPlace, beforeUndo, afterUndo, beforeRedo, afterRedo, vendTick, dump, load, setMode, paintChip, paintHotbar, selectedItem, pickup,
    get mode() { return mode }, set paused(v) { paused = v }, get home() { return home },
    setDay(iso) { day = iso; wallet.state.day = iso; wallet.state.soldToday = {}; for (const rec of meta.values()) rec.visits = 0 },
    give(item, n) { giveItem(item, n) },
    blockForHot() { const k = selectedItem(); return k && ITEMS[k] && ITEMS[k].block },
    toolTier() { const k = selectedItem(); return (k && ITEMS[k] && ITEMS[k].tool) || 'hand' },
    dropHeld, groundDrops: () => ground, clearLoose() { ground.length = 0; lost.length = 0 }, tickDrops,
    tryBuy(k) { const item = ITEMS[k]; return item ? buy(k, 1, quoteBuy(item, wallet.state.dial || 1, ECON)) : false },
    known: (k) => (wallet.state.found || []).includes(k),
    useHeld, selectOwned, holdItem,
  }
}
