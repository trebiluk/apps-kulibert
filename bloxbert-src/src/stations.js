// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES } from './data/recipes.js'
import { ITEMS } from './data/items.js'
import { slotArt } from './icons.js'
import { fx } from './fx.js'
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BAKES = { planks: 1, log: 4, coal: 8 }
let slotsOf = () => []
export function bindStationBag(fn) { if (typeof fn === 'function') slotsOf = fn }
function fuelKind(api) {
  const held = api.held ? api.held() : ''
  if (BAKES[held] && api.have && api.have(held) > 0) return held
  for (const k of ['planks', 'log', 'coal']) if (api.have && api.have(k) > 0) return k
  return ''
}
function beginBake(r, recipe) {
  if (!recipe || r.until || !(r.left > 0)) return
  r.pending = recipe.out[0]
  r.secs = recipe.secs || 5
  r.until = Date.now() + r.secs * 1000
  r.staged = null
  r.picking = false
}
function recipeFor(api, item, fueled) {
  if (!item || !fueled) return null
  const creative = api.creative && api.creative()
  const ready = OVEN.filter((recipe) => recipe.in.some(([it]) => it === item) && (creative || recipe.in.every(([it, n]) => api.have && api.have(it) >= n)))
  if (!ready.length) return null
  return ready.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || ready.find((recipe) => recipe.in[0][0] === item) || ready[0]
}
export function createStations(api) {
  const map = new Map()
  function touch() { if (api.touch) api.touch() }
  function get(key, kind) {
    if (!map.has(key)) map.set(key, { kind, fuel: 0, input: [], output: [], until: 0, left: 0 })
    return map.get(key)
  }
  function finish(rec) {
    if (!rec || rec.kind !== 'oven' || !rec.until) return
    if (Date.now() < rec.until) return
    rec.output.push(rec.pending || 'glass')
    rec.pending = null
    rec.until = 0
    rec.left = Math.max(0, rec.left - 1)
    rec.fuel = rec.left
    rec.input = []
    rec.inputN = 0
    const burn = BAKES[rec.fuelItem] || 1
    rec.fuelSpent = (rec.fuelSpent || 0) + 1
    if (rec.fuelSpent >= burn) {
      rec.fuelSpent -= burn
      rec.fuelN = Math.max(0, (rec.fuelN || 1) - 1)
    }
    if (!(rec.left > 0) || !(rec.fuelN > 0)) { rec.fuelItem = ''; rec.fuelN = 0; rec.fuelSpent = 0 }
    touch()
  }
  function tick() {
    for (const rec of map.values()) finish(rec)
  }
  function addFuel(key, item) {
    const kind = item ? (BAKES[item] ? item : '') : fuelKind(api)
    if (!kind) return false
    if (api.spend && !api.spend(kind, 1)) return false
    const r = get(key, 'oven')
    if (r.fuelItem && r.fuelItem !== kind) r.fuelN = 0
    r.fuelItem = kind
    r.fuelN = (r.fuelN || 0) + 1
    r.left = (r.left || 0) + BAKES[kind]
    r.fuel = r.left
    r.fuelNote = ''
    beginBake(r, OVEN.find((x) => x.id === r.staged))
    touch()
    return true
  }
  function arm(key, recipeId) {
    const recipe = OVEN.find((x) => x.id === recipeId)
    if (!recipe) return false
    const r = get(key, 'oven')
    r.pick = recipe.id
    if (r.until) { r.picking = false; return true }
    const ready = recipe.in.every(([item, n]) => api.have && api.have(item) >= n)
    if (ready && r.staged !== recipe.id) {
      for (const [item, n] of recipe.in) if (api.spend) api.spend(item, n)
      r.staged = recipe.id
      r.input = recipe.in.map(([item]) => item)
      r.inputN = recipe.in[0][1]
    }
    r.picking = !r.staged
    beginBake(r, r.staged ? recipe : null)
    touch()
    return true
  }
  function addInput(key, recipeId) {
    const recipe = OVEN.find((x) => x.id === recipeId)
    const r = get(key, 'oven')
    if (!recipe || !(r.left > 0)) return false
    for (const [item, n] of recipe.in) if (api.have && api.have(item) < n) return false
    for (const [item, n] of recipe.in) if (api.spend) api.spend(item, n)
    r.picking = false
    r.pick = recipe.id
    r.input = recipe.in.map(([item]) => item)
    r.inputN = recipe.in[0][1]
    r.pending = recipe.out[0]
    r.secs = recipe.secs || 5
    r.until = Date.now() + r.secs * 1000
    r.staged = null
    touch()
    return true
  }
  function take(key) {
    const r = get(key, 'oven')
    const item = r.output.shift()
    if (item && api.give) api.give(item, 1)
    if (item) touch()
    return item
  }
  function view(key) {
    const r = map.get(key)
    if (!r) return { kind: 'oven', fuel: 0, input: [], output: [], ring: 0 }
    const secs = r.secs || 5
    const left = r.until ? Math.max(0, Math.ceil((r.until - Date.now()) / 1000)) : 0
    const ring = r.until ? (secs - left) / secs : 0
    return { kind: r.kind, fuel: r.fuel, input: r.input.slice(), output: r.output.slice(), ring, left: r.left }
  }
  function itemName(item) { return api.name ? api.name(item) : item }
  function bakesItem(item) { return OVEN.some((recipe) => recipe.in.some(([it]) => it === item)) }
  function haveN(item) { return api.have ? api.have(item) || 0 : 0 }
  function precursorStep(item) {
    if (!item || bakesItem(item)) return null
    const ovenIn = new Set()
    for (const recipe of OVEN) for (const [it] of recipe.in) ovenIn.add(it)
    let hop = null
    for (const recipe of RECIPES) {
      if (recipe.at === 'oven' || !recipe.in.some(([it]) => it === item)) continue
      const out = recipe.out[0]
      if (ovenIn.has(out)) return { out, at: recipe.at }
      if (!hop && RECIPES.some((next) => next.at !== 'oven' && next.in.some(([it]) => it === out) && ovenIn.has(next.out[0]))) hop = { out, at: recipe.at }
    }
    return hop
  }
  function needLine(item) {
    const ranked = []
    for (const recipe of OVEN) {
      if (!recipe.in.some(([it]) => it === item)) continue
      const miss = []
      for (const [it, n] of recipe.in) {
        const have = haveN(it)
        if (have < n) miss.push({ it, n, more: n - have })
      }
      if (miss.length) ranked.push({ recipe, miss })
    }
    if (!ranked.length) return ''
    ranked.sort((a, b) => {
      const aSelf = a.miss.some((m) => m.it === item) ? 0 : 1
      const bSelf = b.miss.some((m) => m.it === item) ? 0 : 1
      if (aSelf !== bSelf) return aSelf - bSelf
      const aOne = a.recipe.in.length === 1 ? 0 : 1
      const bOne = b.recipe.in.length === 1 ? 0 : 1
      if (aOne !== bOne) return aOne - bOne
      return a.miss.length - b.miss.length
    })
    const best = ranked[0]
    const gap = best.miss.find((m) => m.it === item) || best.miss[0]
    return api.t('ovenNeed')
      .replace('{out}', itemName(best.recipe.out[0]))
      .replace('{n}', String(gap.n))
      .replace('{item}', itemName(gap.it))
      .replace('{more}', String(gap.more))
  }
  function inputNote(item) {
    const named = itemName(item)
    const pre = precursorStep(item)
    if (pre) {
      const whereKey = pre.at === 'bench' ? 'workbench' : pre.at === 'forge' ? 'smelter' : pre.at
      return api.t('ovenFirst').replace('{item}', named).replace('{out}', itemName(pre.out)).replace('{where}', api.t(whereKey))
    }
    if (!bakesItem(item)) return api.t('ovenNoBake').replace('{item}', named)
    return needLine(item)
  }
  function bakeHint() {
    const bits = []
    let food = false
    for (const recipe of OVEN) {
      if (recipe.label === 'food') { food = true; continue }
      bits.push(recipe.in.map(([it]) => itemName(it)).join(' + ') + ' → ' + itemName(recipe.out[0]))
    }
    if (food) bits.push(api.t('rawFood') + ' → ' + api.t('bakedFood'))
    return api.t('bakesHint').replace('{list}', bits.join(', '))
  }
  function face(item) {
    const def = item && ITEMS[item]
    if (def && def.svg) return slotArt(item, null)
    if (api.icon && ((def && def.block) || !def)) {
      const node = api.icon(item)
      if (node && node.dataset && node.dataset.block) return node
    }
    return slotArt(item, null)
  }
  function head(crate, iconKey, name, status) {
    const row = document.createElement('div')
    row.className = 'machine-head'
    const ic = document.createElement('span')
    ic.className = 'gic'
    if (api.icon) ic.append(face(iconKey))
    const words = document.createElement('div')
    const title = document.createElement('span')
    title.className = 'machine-name'
    title.textContent = name
    const line = document.createElement('p')
    line.className = 'machine-status'
    line.setAttribute('role', 'status')
    line.textContent = status
    words.append(title, line)
    row.append(ic, words)
    crate.append(row)
  }
  const SHOP_TOOLS = [
    { item: 'safetyGlasses', need: 'needsGlasses', skill: 'skillGlasses' },
    { item: 'measuringTape', need: 'needsTape', skill: 'skillTape' },
    { item: 'handSaw', need: 'needsSaw', skill: 'skillSaw' },
    { item: 'hammer', need: 'needsHammer', skill: 'skillHammer' },
  ]
  function shopTone(hz, el) {
    if (el) fx(el, 'pop')
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      if (!shopTone.ctx) shopTone.ctx = new AC()
      const ctx = shopTone.ctx
      if (ctx.state === 'suspended') ctx.resume()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'square'
      o.frequency.value = hz || 520
      const t0 = ctx.currentTime
      g.gain.setValueAtTime(0.045, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.07)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 0.08)
    } catch (e) {}
  }
  function ensureShop(key) {
    const r = get(key, 'woodshop')
    if (!Array.isArray(r.wall)) r.wall = [null, null, null, null]
    r.kind = 'woodshop'
    return r
  }
  function wallItems(key) {
    const r = map.get(key)
    if (!r || !Array.isArray(r.wall)) return []
    return r.wall.filter(Boolean)
  }
  function clearShop(key) { map.delete(key) }
  function haveShopTool(key, item) {
    return wallItems(key).indexOf(item) >= 0 || !!(api.have && api.have(item) > 0)
  }
  let shopPick = ''
  let shopGuide = ''
  function paintWoodshop(g, key) {
    const rec = ensureShop(key)
    if (shopGuide && shopGuide !== 'woodshop' && !SHOP_TOOLS.some((row) => row.item === shopGuide)) shopGuide = ''
    g.innerHTML = ''
    g.classList.add('crate')
    const crate = document.createElement('div')
    crate.className = 'station-crate machine shop-bench'
    head(crate, 'woodshop', api.t('woodshop'), api.t('fieldGuide'))
    if (shopGuide) {
      const who = SHOP_TOOLS.find((row) => row.item === shopGuide)
      const page = document.createElement('div')
      page.className = 'shop-page'
      const art = document.createElement('span')
      art.className = 'gic'
      art.append(face(shopGuide))
      const title = document.createElement('p')
      title.className = 'gnote'
      title.textContent = api.t(shopGuide)
      const line = document.createElement('p')
      line.className = 'gnote shop-skill'
      line.textContent = api.t(who ? who.skill : 'skillBench')
      const back = document.createElement('button')
      back.type = 'button'
      back.className = 'keycap'
      back.textContent = api.t('close')
      back.addEventListener('click', () => { shopGuide = ''; paintWoodshop(g, key) })
      page.append(art, title, line, back)
      crate.append(page)
      g.append(crate)
      return
    }
    const wall = document.createElement('div')
    wall.className = 'tool-wall'
    const hang = (index, item) => {
      if (!SHOP_TOOLS[index] || SHOP_TOOLS[index].item !== item) return false
      if (rec.wall[index]) return false
      if (!(api.have && api.have(item) > 0)) return false
      if (api.spend && !api.spend(item, 1)) return false
      rec.wall[index] = item
      if (shopPick === item) shopPick = ''
      touch()
      shopTone(640, wall)
      paintWoodshop(g, key)
      return true
    }
    const takeBack = (index) => {
      const item = rec.wall[index]
      if (!item) return
      rec.wall[index] = null
      if (api.give) api.give(item, 1)
      touch()
      shopTone(420, wall)
      paintWoodshop(g, key)
    }
    SHOP_TOOLS.forEach((tool, index) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'wall-slot' + (rec.wall[index] ? ' filled' : ' empty')
      b.dataset.wall = tool.item
      const art = document.createElement('span')
      art.className = 'gic'
      art.append(face(rec.wall[index] || tool.item))
      const cap = document.createElement('span')
      cap.className = 'wall-cap'
      cap.textContent = rec.wall[index] ? '✓' : api.t(tool.need)
      b.append(art, cap)
      const label = rec.wall[index] ? api.t(tool.item) : api.t(tool.need)
      b.title = label
      b.setAttribute('aria-label', label)
      b.addEventListener('click', () => {
        if (rec.wall[index]) { takeBack(index); return }
        if (api.have && api.have(tool.item) > 0) hang(index, tool.item)
      })
      wall.append(b)
    })
    crate.append(wall)
    const bagRow = document.createElement('div')
    bagRow.className = 'shop-bag'
    ;(slotsOf() || []).forEach((s, i) => {
      if (!s || !s.item || !(s.n > 0) || !SHOP_TOOLS.some((row) => row.item === s.item)) return
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'keycap shop-tool' + (shopPick === s.item ? ' on' : '')
      b.dataset.item = s.item
      b.dataset.slot = String(i)
      const art = document.createElement('span')
      art.className = 'gic'
      art.append(face(s.item))
      const lab = document.createElement('span')
      lab.textContent = api.t(s.item)
      b.append(art, lab)
      b.setAttribute('aria-label', api.t(s.item))
      let drag = null
      b.addEventListener('pointerdown', (e) => {
        if (e.button > 0) return
        drag = { x: e.clientX, y: e.clientY, moved: false, item: s.item }
        try { b.setPointerCapture(e.pointerId) } catch (err) {}
      })
      b.addEventListener('pointermove', (e) => {
        if (!drag) return
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true
      })
      b.addEventListener('pointerup', (e) => {
        if (!drag) return
        const moved = drag.moved
        const item = drag.item
        drag = null
        if (!moved) {
          shopPick = shopPick === item ? '' : item
          paintWoodshop(g, key)
          return
        }
        const hit = document.elementFromPoint(e.clientX, e.clientY)
        const slot = hit && hit.closest ? hit.closest('[data-wall]') : null
        if (!slot) return
        const index = SHOP_TOOLS.findIndex((row) => row.item === slot.dataset.wall)
        if (index >= 0 && item === SHOP_TOOLS[index].item) hang(index, item)
      })
      bagRow.append(b)
    })
    crate.append(bagRow)
    const job = document.createElement('div')
    job.className = 'shop-job'
    const ready = SHOP_TOOLS.every((row) => haveShopTool(key, row.item))
    job.classList.toggle('lit', ready)
    job.dataset.ready = ready ? '1' : '0'
    const jobBtn = document.createElement('button')
    jobBtn.type = 'button'
    jobBtn.className = 'keycap shop-go'
    jobBtn.textContent = (ready ? '✓ ' : '') + api.t('woodshopReady')
    jobBtn.disabled = !ready
    jobBtn.addEventListener('click', () => {
      if (!SHOP_TOOLS.every((row) => haveShopTool(key, row.item))) return
      if (api.glasses) api.glasses(true)
      let note = crate.querySelector('.glasses-note')
      if (!note) {
        note = document.createElement('p')
        note.className = 'gnote glasses-note'
        const mark = document.createElement('span')
        mark.className = 'gic'
        mark.append(face('safetyGlasses'))
        note.append(mark, document.createTextNode(' ' + api.t('glassesOn')))
        crate.append(note)
      }
      shopTone(880, jobBtn)
    })
    job.append(jobBtn)
    const needs = document.createElement('div')
    needs.className = 'shop-needs'
    SHOP_TOOLS.forEach((row) => {
      const bit = document.createElement('button')
      bit.type = 'button'
      const has = haveShopTool(key, row.item)
      bit.className = 'need-tool' + (has ? ' have' : ' miss')
      bit.textContent = has ? '✓ ' + api.t(row.item) : api.t(row.need)
      if (!has) bit.addEventListener('click', () => { if (api.openCraft) api.openCraft(row.item) })
      needs.append(bit)
    })
    job.append(needs)
    crate.append(job)
    const guide = document.createElement('div')
    guide.className = 'shop-guide'
    SHOP_TOOLS.map((row) => row.item).concat(['woodshop']).forEach((id) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'keycap'
      b.textContent = api.t('fieldGuide') + ' · ' + api.t(id)
      b.addEventListener('click', () => { shopGuide = id; paintWoodshop(g, key) })
      guide.append(b)
    })
    crate.append(guide)
    g.append(crate)
    if (api.safetyDue && api.safetyDue()) showSafety()
  }
  function showSafety() {
    const old = document.getElementById('shop-safe')
    if (old) old.remove()
    const wrap = document.createElement('div')
    wrap.id = 'shop-safe'
    wrap.setAttribute('role', 'dialog')
    wrap.addEventListener('pointerdown', (e) => e.stopPropagation())
    const card = document.createElement('div')
    card.className = 'card'
    const art = document.createElement('span')
    art.className = 'gic'
    art.append(face('safetyGlasses'))
    const p = document.createElement('p')
    p.textContent = api.t('safetyBody')
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.textContent = api.t('safetyOk')
    const closeCard = () => {
      wrap.remove()
      document.removeEventListener('keydown', onKey, true)
      if (api.markSafety) api.markSafety()
      shopTone(520, btn)
    }
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      closeCard()
    }
    btn.addEventListener('click', closeCard)
    document.addEventListener('keydown', onKey, true)
    card.append(art, p, btn)
    wrap.append(card)
    document.body.append(wrap)
    shopTone(520, card)
  }
  function paint(g, key, kind) {
    const k = key || '0,5,0'
    if (kind === 'woodshop') {
      if (g._ksDestroy) { g._ksDestroy(); g._ksDestroy = null }
      paintWoodshop(g, k)
      return
    }
    const isBench = kind === 'bench'
    if (g._ksDestroy) { g._ksDestroy(); g._ksDestroy = null }
    g.innerHTML = ''
    g.classList.add('crate')
    if (isBench) {
      const crate = document.createElement('div')
      crate.className = 'station-crate machine'
      head(crate, 'workbench', api.t('workbench'), api.t('crafting'))
      g.append(crate)
      return
    }
    const KS = window.KulibertSlots
    if (!KS || !KS.ui || !KS.ui.machinePanel) return
    const read = () => {
      const r = get(k, 'oven')
      finish(r)
      const secs = r.secs || 5
      const timeLeft = r.until ? Math.max(0, (r.until - Date.now()) / 1000) : 0
      const pct = r.until ? Math.max(0, Math.min(1, (secs - timeLeft) / secs)) : 0
      const fuelItem = r.fuelItem || ''
      const fuelCount = fuelItem ? (r.fuelN || 0) : 0
      const inItem = (r.input && r.input[0]) || ''
      const inCount = inItem ? (r.inputN || 1) : 0
      const outItem = r.output && r.output[0]
      return { r, secs, timeLeft, pct, fuelItem, fuelCount, inItem, inCount, outItem }
    }
    const fueled = () => (get(k, 'oven').left || 0) > 0
    let ovenNote = ''
    const recipeYouCan = (item) => {
      if (!item) return null
      const creative = api.creative && api.creative()
      const ready = OVEN.filter((recipe) => recipe.in.some(([it]) => it === item) && (creative || recipe.in.every(([it, n]) => api.have && api.have(it) >= n)))
      if (!ready.length) return null
      return ready.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || ready.find((recipe) => recipe.in[0][0] === item) || ready[0]
    }
    const refuse = (role, item) => {
      const named = itemName(item)
      if (role === 'fuel') return api.t('fuelBounce').replace('{item}', named)
      if (role !== 'input') return ''
      const message = inputNote(item)
      if (message) ovenNote = message
      return message
    }
    const onLoad = (role, item) => {
      if (role === 'fuel') {
        if (!item || !BAKES[item]) return { ok: false, message: refuse('fuel', item) }
        if (!addFuel(k, item)) return { ok: false, message: api.t('addFuelWood') }
        return { ok: true }
      }
      if (role === 'input') {
        if (!item || !bakesItem(item)) return { ok: false, message: refuse('input', item) }
        const cur = get(k, 'oven')
        if (cur.until || (cur.input && cur.input.length)) return { ok: false }
        const recipe = recipeYouCan(item)
        if (!recipe) return { ok: false, message: refuse('input', item) }
        const ok = fueled() ? addInput(k, recipe.id) : arm(k, recipe.id)
        if (!ok) return { ok: false, message: api.t('nothingBake') }
        ovenNote = ''
        return { ok: true }
      }
      return { ok: false }
    }
    const panel = KS.ui.machinePanel(g, {
      title: api.t('oven'),
      headerIcon: () => face('oven'),
      icon: (item) => face(item),
      status: () => {
        const s = read()
        if (s.outItem && !s.r.until) return api.t('takeYour').replace('{item}', itemName(s.outItem))
        if (s.r.until) return api.t('bakingNow')
        if (ovenNote) return ovenNote
        if (s.inItem && !(s.r.left > 0)) return api.t('ovenAddFuel')
        if (s.r.left > 0 && !s.inItem) return api.t('addToBake')
        return api.t('needsFuel')
      },
      slots: () => {
        const s = read()
        return [
          { role: 'fuel', label: api.t('fuel'), item: s.fuelItem, n: s.fuelCount, filter: (item) => !!BAKES[item], takeOnly: false },
          { role: 'input', label: api.t('input'), item: s.inItem, n: s.inCount, filter: (item) => bakesItem(item), takeOnly: false },
          { role: 'output', label: api.t('output'), item: s.outItem || '', n: s.outItem ? 1 : 0, filter: () => false, takeOnly: true },
        ]
      },
      process: () => {
        const s = read()
        const fuelNow = s.r.left || 0
        const burning = !!(s.r.until && s.timeLeft > 0 && fuelNow > 0)
        let burn = 0
        if (burning && s.secs > 0) burn = s.timeLeft / s.secs
        else if (fuelNow > 0) burn = Math.min(1, fuelNow / 8)
        const pending = s.r.pending
        return {
          pct: s.pct,
          burning,
          lit: fuelNow > 0,
          burn,
          label: s.timeLeft > 0 ? Math.ceil(s.timeLeft) + 's' : '',
          previewItem: pending || '',
          previewText: pending ? api.t('willMake').replace('{item}', itemName(pending)) : '',
        }
      },
      bag: () => slotsOf() || [],
      onLoad,
      onTake: () => { take(k) },
      refuse,
      notes: () => [api.t('ovenClick'), bakeHint()],
      name: (item) => itemName(item),
      t: (key) => api.t(key),
    })
    g._ksDestroy = panel.destroy
  }
  function baking() {
    const out = []
    for (const [key, rec] of map) {
      if (rec && rec.until && Date.now() < rec.until) out.push(key)
    }
    return out
  }
  return { tick, paint, view, addFuel, addInput, arm, take, baking, ensureShop, wallItems, clearShop, dump: () => {
    const out = {}
    for (const [k, v] of map) out[k] = JSON.parse(JSON.stringify(v))
    return out
  }, load: (obj) => {
    map.clear()
    for (const [k, v] of Object.entries(obj || {})) {
      if (v && typeof v === 'object') map.set(k, JSON.parse(JSON.stringify(v)))
    }
  } }
}
