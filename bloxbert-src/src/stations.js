// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES, BED_SHOP } from './data/recipes.js'
import { ITEMS } from './data/items.js'
import { slotArt, shopIcon } from './icons.js'
import { fx } from './fx.js'
import { EXTRA } from './strings-extra.js'
import { decorMetalLocked } from './craft.js'
// 2.5.572: the oven panel names the belt slot. rw, ti, and fa-AF are draft translations.
const BELT_SLOT = {
  en: { beltFrom: 'from belt', beltEmpty: 'belt: empty' },
  simple: { beltFrom: 'from belt', beltEmpty: 'belt: empty' },
  uk: { beltFrom: 'зі стрічки', beltEmpty: 'стрічка: порожньо' },
  ru: { beltFrom: 'с ленты', beltEmpty: 'лента: пусто' },
  es: { beltFrom: 'de la cinta', beltEmpty: 'cinta: vacía' },
  ar: { beltFrom: 'من السير', beltEmpty: 'السير: فارغ' },
  'fa-AF': { beltFrom: 'از نوار', beltEmpty: 'نوار: خالی' },
  rw: { beltFrom: 'kuva ku mugozi', beltEmpty: 'umugozi: ubusa' },
  ti: { beltFrom: 'ካብ መተሓላለፊ', beltEmpty: 'መተሓላለፊ: ባዶ' },
}
for (const lang of Object.keys(BELT_SLOT)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], BELT_SLOT[lang])
}
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BAKES = { planks: 1, log: 4, coal: 8, pinecone: 1 }
let slotsOf = () => []
export function bindStationBag(fn) { if (typeof fn === 'function') slotsOf = fn }
function fuelKind(api) {
  const held = api.held ? api.held() : ''
  if (BAKES[held] && api.have && api.have(held) > 0) return held
  for (const k of ['planks', 'log', 'coal', 'pinecone']) if (api.have && api.have(k) > 0) return k
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
    startFromBelt(rec) // 0066: a belt-fed oven keeps going while it has input and fuel
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
    return { kind: r.kind, fuel: r.fuel, input: r.input.slice(), output: r.output.slice(), ring, left: r.left, beltIn: r.beltIn ? { ...r.beltIn } : null }
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
    if (item === 'bertyLie' || item === 'goldTrim') {
      const drawn = shopIcon(item)
      if (drawn) return drawn
    }
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
  function wallReady(key) {
    const hung = wallItems(key)
    return SHOP_TOOLS.every((row) => hung.indexOf(row.item) >= 0)
  }
  let shopPick = ''
  let shopGuide = ''
  let saidBed = ''
  let bedFlash = false
  const WOOLS = ['woolBlue', 'woolGreen', 'woolRed', 'woolTan']
  function motionLess() {
    try {
      if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch (e) { return false }
  }
  function sayBed(step, text, el) {
    if (el) fx(el, 'pop')
    if (saidBed === step) return
    saidBed = step
    try {
      const synth = window.speechSynthesis
      if (!synth || !text) return
      synth.cancel()
      const u = new SpeechSynthesisUtterance(text)
      u.rate = 1
      synth.speak(u)
    } catch (e) {}
  }
  function rules() {
    return api.rules ? api.rules() : { path: 'choose', help: false, required: false }
  }
  function woolHave(colour) { return colour && api.have && api.have(colour) >= BED_SHOP.wool }
  function woolPick(prefer) {
    if (woolHave(prefer)) return prefer
    return WOOLS.find((c) => woolHave(c)) || ''
  }
  function matsOk(colour) {
    return !!(api.have && api.have('planks') >= BED_SHOP.planks && woolHave(colour || woolPick()))
  }
  function spendMats(colour) {
    const wool = woolPick(colour)
    if (!matsOk(wool)) return ''
    if (api.spend && !api.spend('planks', BED_SHOP.planks)) return ''
    if (api.spend && !api.spend(wool, BED_SHOP.wool)) {
      if (api.give) api.give('planks', BED_SHOP.planks)
      return ''
    }
    return wool
  }
  function toolsReady(key) { return SHOP_TOOLS.every((row) => haveShopTool(key, row.item)) }
  function freshJob(fabric) {
    return {
      step: 'need',
      tone: 'natural',
      fabric: fabric || 'woolBlue',
      pattern: 'plain',
      boards: BED_SHOP.boards.map((target) => ({ target, mark: null, cut: null })),
      board: 0,
      nails: [false, false, false, false],
      fixing: -1,
      paid: false,
    }
  }
  function gradeMark(mark, target, help) {
    if (mark == null || mark === '') return ''
    const d = Math.abs(mark - target)
    if (d <= (help ? 2 : 1)) return 'exact'
    if (d <= 3) return 'close'
    return 'off'
  }
  function rateJob(job) {
    const cuts = job.boards.map((b) => b.cut)
    if (cuts.some((c) => c !== 'exact' && c !== 'close')) return { stars: 1, wobble: 'big' }
    if (cuts.every((c) => c === 'exact')) return { stars: 3, wobble: 'steady' }
    return { stars: 2, wobble: 'slight' }
  }
  function starText(stars) {
    if (stars >= 3) return api.t('starBest')
    if (stars === 2) return api.t('starSteady')
    return api.t('starWorks')
  }
  function wobbleText(w) {
    if (w === 'steady') return api.t('steadyWord')
    if (w === 'slight') return api.t('slightWobble')
    return api.t('bigWobble')
  }
  function capBtn(cls, label, fn, icon) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'keycap ' + cls
    if (icon) {
      const ic = document.createElement('span')
      ic.className = 'bic'
      ic.setAttribute('aria-hidden', 'true')
      ic.innerHTML = icon === 'design'
        ? '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M4 17l3.2-.6L16.5 7.1l1.8 1.8L9 18.2z" fill="#E6B15A"/><path d="M14.8 5.4l2.2 2.2" stroke="#E6EEF2" stroke-width="1.6"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18"><path d="M5 12h14M12 5v14" fill="none" stroke="#22D3EE" stroke-width="2.4" stroke-linecap="round"/></svg>'
      b.append(ic)
    }
    const lab = document.createElement('span')
    lab.className = 'blab'
    lab.textContent = label
    b.append(lab)
    let busy = false
    const run = (e) => {
      if (b.disabled || busy) return
      busy = true
      setTimeout(() => { busy = false }, 40)
      if (e) { e.preventDefault(); e.stopPropagation() }
      fn()
    }
    b.addEventListener('click', run)
    if (cls.indexOf('bed-next') >= 0 || cls.indexOf('decor-make') >= 0) b.addEventListener('pointerup', run)
    return b
  }
  function lockBtn(b, reason) {
    if (!reason) return b
    b.disabled = true
    b.title = reason
    b.setAttribute('aria-label', (b.querySelector('.blab') ? b.querySelector('.blab').textContent : '') + ' — ' + reason)
    return b
  }
  const SKILL_FALLBACK = {
    skillNeed: 'Ask: Engineers start by asking who it\'s for.',
    skillPlan: 'Plan: A sketch lets you find mistakes before you cut.',
    skillTest: 'Test: Testing shows what to improve.',
    skillImprove: 'Improve: Real designs get better every round.',
  }
  function skillText(key) {
    let text = ''
    try { text = api.t(key) || '' } catch (e) { text = '' }
    if (!String(text).trim() || text === key) text = SKILL_FALLBACK[key] || ''
    return text
  }
  function skillLine(key) {
    const p = document.createElement('p')
    p.className = 'gnote bed-skill'
    p.textContent = skillText(key)
    return p
  }
  function paintBed(crate, g, key, rec) {
    const box = document.createElement('div')
    box.className = 'bed-card'
    const job = rec.bed
    const rule = rules()
    const ready = toolsReady(key)
    const wool = woolPick(job && job.fabric)
    const haveMats = matsOk(wool)
    if (!job) {
      const note = document.createElement('p')
      note.className = 'gnote'
      note.textContent = !ready ? api.t('bedNeedTools') : !haveMats ? api.t('bedNeedMats') : api.t('bunk')
      box.append(note)
      const row = document.createElement('div')
      row.className = 'bed-paths'
      if (rule.path !== 'design') {
        const b = capBtn('bed-just', api.t('justBuild'), () => {
          if (api.craftOk && !api.craftOk('bunk')) return
          if (!toolsReady(key)) { if (api.toast) api.toast(api.t('decorNeedTools')); return }
          if (!matsOk()) return
          const spent = spendMats()
          if (!spent) return
          if (api.glasses) api.glasses(true)
          if (api.giveBed) api.giveBed({ stars: 1, tone: 'natural', fabric: spent, pattern: 'plain' })
          bedFlash = true
          saidBed = ''
          touch()
          shopTone(740, b)
          paintWoodshop(g, key)
        }, 'make')
        if (!ready) { b.textContent = api.t('decorNeedTools'); b.title = api.t('decorNeedTools') }
        else if (!haveMats) lockBtn(b, api.t('bedNeedMats'))
        row.append(b)
      }
      if (rule.path !== 'build') {
        const b = capBtn('bed-design', api.t('designIt'), () => {
          if (api.craftOk && !api.craftOk('bunk')) return
          if (!toolsReady(key)) { if (api.toast) api.toast(api.t('decorNeedTools')); return }
          if (!matsOk()) return
          if (api.glasses) api.glasses(true)
          rec.bed = freshJob(woolPick())
          saidBed = ''
          touch()
          shopTone(640, b)
          paintWoodshop(g, key)
        }, 'design')
        if (!ready) { b.textContent = api.t('decorNeedTools'); b.title = api.t('decorNeedTools') }
        else if (!haveMats) lockBtn(b, api.t('bedNeedMats'))
        row.append(b)
      }
      const best = api.best && api.best()
      if (best && best.stars >= 3) {
        const b = capBtn('bed-remake', api.t('remakeBest'), () => {
          if (api.craftOk && !api.craftOk('bunk')) return
          if (!toolsReady(key) || !matsOk(best.fabric)) return
          const spent = spendMats(best.fabric)
          if (!spent) return
          if (api.glasses) api.glasses(true)
          if (api.giveBed) api.giveBed({ stars: 3, tone: best.tone, fabric: best.fabric, pattern: best.pattern })
          bedFlash = true
          touch()
          shopTone(880, b)
          paintWoodshop(g, key)
        })
        if (!ready || !matsOk(best.fabric)) b.disabled = true
        row.append(b)
      }
      box.append(row)
      if (bedFlash) {
        const chip = document.createElement('p')
        chip.className = 'built-chip'
        chip.textContent = api.t('builtChip')
        box.append(chip)
        bedFlash = false
      }
    } else {
      const step = document.createElement('div')
      step.className = 'bed-step'
      step.dataset.step = job.step
      const icon = document.createElement('span')
      icon.className = 'gic bed-icon'
      const title = document.createElement('p')
      title.className = 'bed-title'
      const go = (next) => { job.step = next; saidBed = ''; touch(); paintWoodshop(g, key) }
      if (job.step === 'need') {
        icon.append(face('bunk'))
        title.textContent = api.t('fitsBerty')
        step.append(icon, title, skillLine('skillNeed'))
        step.append(capBtn('bed-next', api.t('nextWord'), () => go('plan')))
        sayBed('need', api.t('fitsBerty') + ' ' + skillText('skillNeed'), step)
      } else if (job.step === 'plan') {
        icon.append(face('bunk'))
        title.textContent = api.t('toneWord')
        step.append(icon, title, skillLine('skillPlan'))
        const tones = [['natural', 'toneNatural'], ['honey', 'toneHoney'], ['dark', 'toneDark']]
        const toneRow = document.createElement('div')
        toneRow.className = 'choice-row'
        tones.forEach(([id, label]) => {
          const b = capBtn('tone-pick' + (job.tone === id ? ' on' : ''), api.t(label), () => { job.tone = id; touch(); toneRow.querySelectorAll('button').forEach((n) => n.classList.toggle('on', n.dataset.tone === id)) })
          b.dataset.tone = id
          toneRow.append(b)
        })
        const fabRow = document.createElement('div')
        fabRow.className = 'choice-row'
        WOOLS.forEach((id) => {
          const b = capBtn('wool-pick' + (job.fabric === id ? ' on' : ''), api.t(id), () => { job.fabric = id; touch(); fabRow.querySelectorAll('button').forEach((n) => n.classList.toggle('on', n.dataset.fabric === id)) })
          b.dataset.fabric = id
          if (!woolHave(id)) b.disabled = true
          fabRow.append(b)
        })
        const patRow = document.createElement('div')
        patRow.className = 'choice-row'
        ;[['plain', 'patternPlain'], ['stripes', 'patternStripes'], ['checks', 'patternChecks']].forEach(([id, label]) => {
          const b = capBtn('pat-pick' + (job.pattern === id ? ' on' : ''), api.t(label), () => { job.pattern = id; touch(); patRow.querySelectorAll('button').forEach((n) => n.classList.toggle('on', n.dataset.pattern === id)) })
          b.dataset.pattern = id
          patRow.append(b)
        })
        step.append(toneRow, fabRow, patRow)
        const next = capBtn('bed-next', api.t('nextWord'), () => {
          if (!job.paid) {
            const spent = spendMats(job.fabric)
            if (!spent) return
            job.paid = true
            job.fabric = spent
          }
          go('measure')
        })
        if (!job.paid && !woolHave(job.fabric)) next.disabled = true
        step.append(next)
        sayBed('plan', skillText('skillPlan'), step)
      } else if (job.step === 'measure') {
        const board = job.boards[job.board] || job.boards[0]
        icon.append(face('measuringTape'))
        title.textContent = api.t('measureWord') + ' · ' + api.t('boardWord') + ' ' + (job.board + 1)
        step.append(icon, title)
        const track = document.createElement('div')
        track.className = 'tape-track'
        const help = !!rules().help
        const apply = (tick, el) => {
          board.mark = tick
          touch()
          shopTone(520, el || track)
          paintWoodshop(g, key)
        }
        for (let n = 0; n <= 10; n++) {
          const b = capBtn('tick' + (board.mark === n ? ' on' : ''), String(n), () => apply(n, b))
          b.dataset.tick = String(n)
          track.append(b)
        }
        step.append(track)
        const headEl = capBtn('tape-head', api.t('measureWord'), () => {})
        let drag = null
        const beginDrag = (e) => {
          if (drag || e.button > 0) return
          drag = { x: e.clientX, moved: false }
          const move = (ev) => { if (drag && Math.abs(ev.clientX - drag.x) > 8) drag.moved = true }
          const up = (ev) => {
            document.removeEventListener('pointermove', move, true)
            document.removeEventListener('pointerup', up, true)
            document.removeEventListener('mousemove', move, true)
            document.removeEventListener('mouseup', up, true)
            if (!drag || !drag.moved) { drag = null; return }
            drag = null
            const r = track.getBoundingClientRect()
            const x = Math.max(0, Math.min(r.width, ev.clientX - r.left))
            const tick = Math.round((x / Math.max(1, r.width)) * 10)
            apply(tick, headEl)
          }
          document.addEventListener('pointermove', move, true)
          document.addEventListener('pointerup', up, true)
          document.addEventListener('mousemove', move, true)
          document.addEventListener('mouseup', up, true)
        }
        headEl.addEventListener('pointerdown', beginDrag)
        headEl.addEventListener('mousedown', beginDrag)
        step.append(headEl)
        const gde = document.createElement('p')
        gde.className = 'gnote grade'
        const gnow = gradeMark(board.mark, board.target, help)
        gde.dataset.grade = gnow
        gde.textContent = gnow === 'exact' ? api.t('exactWord') : gnow === 'close' ? api.t('closeWord') : gnow === 'off' ? api.t('offWord') : api.t('measureWord')
        step.append(gde)
        const next = capBtn('bed-next', api.t('nextWord'), () => { if (board.mark == null) return; go('cut') })
        if (board.mark == null) next.disabled = true
        step.append(next)
        sayBed('measure-' + job.board, api.t('measureWord') + ' ' + api.t('skillTape'), step)
      } else if (job.step === 'cut') {
        const board = job.boards[job.board] || job.boards[0]
        icon.append(face('handSaw'))
        title.textContent = api.t('cutWord')
        const help = !!rules().help
        const gnow = gradeMark(board.mark, board.target, help)
        const gde = document.createElement('p')
        gde.className = 'gnote grade'
        gde.dataset.grade = gnow
        gde.textContent = gnow === 'exact' ? api.t('exactWord') : gnow === 'close' ? api.t('closeWord') : api.t('offWord')
        step.append(icon, title, gde)
        step.append(capBtn('saw-cut', api.t('cutWord'), () => {
          board.cut = gnow || 'off'
          shopTone(420, step)
          if (job.fixing >= 0) { job.fixing = -1; go('test'); return }
          if (job.board < job.boards.length - 1) { job.board += 1; go('measure'); return }
          go('assemble')
        }))
        step.append(capBtn('bed-again', api.t('againWord'), () => go('measure')))
        sayBed('cut-' + job.board, api.t('cutWord') + ' ' + api.t('skillSaw'), step)
      } else if (job.step === 'assemble') {
        icon.append(face('hammer'))
        title.textContent = api.t('assembleWord')
        step.append(icon, title)
        const nails = document.createElement('div')
        nails.className = 'nail-row'
        job.nails.forEach((done, i) => {
          const b = capBtn('nail' + (done ? ' done' : ' glow'), api.t('nailWord'), () => {
            job.nails[i] = true
            shopTone(300 + i * 40, b)
            if (job.nails.every(Boolean)) go('test')
            else { touch(); paintWoodshop(g, key) }
          })
          b.dataset.nail = String(i)
          nails.append(b)
        })
        step.append(nails)
        sayBed('assemble', api.t('assembleWord') + ' ' + api.t('skillHammer'), step)
      } else if (job.step === 'test') {
        const rated = rateJob(job)
        icon.append(face('bertyLie'))
        icon.classList.add('wobble', motionLess() ? 'still' : 'play')
        icon.dataset.wobble = rated.wobble
        title.textContent = wobbleText(rated.wobble)
        step.append(icon, title, skillLine('skillTest'))
        const stars = document.createElement('p')
        stars.className = 'gnote bed-stars'
        stars.dataset.stars = String(rated.stars)
        stars.textContent = starText(rated.stars)
        step.append(stars)
        step.append(capBtn('bed-next', api.t('nextWord'), () => go('improve')))
        sayBed('test', wobbleText(rated.wobble) + ' ' + skillText('skillTest'), step)
      } else if (job.step === 'improve') {
        const rated = rateJob(job)
        icon.append((rated.stars >= 3) ? face('goldTrim') : face('bunk'))
        title.textContent = starText(rated.stars)
        step.append(icon, title, skillLine('skillImprove'))
        const stars = document.createElement('p')
        stars.className = 'gnote bed-stars'
        stars.dataset.stars = String(rated.stars)
        stars.textContent = starText(rated.stars)
        step.append(stars)
        step.append(capBtn('bed-fix', api.t('fixIt'), () => {
          let i = job.boards.findIndex((b) => b.cut === 'off')
          if (i < 0) i = job.boards.findIndex((b) => b.cut === 'close')
          if (i < 0) i = 0
          if (api.give) api.give('planks', 1)
          job.boards[i].mark = null
          job.boards[i].cut = null
          job.fixing = i
          job.board = i
          shopTone(480, step)
          go('measure')
        }))
        step.append(capBtn('bed-keep', api.t('keepIt'), () => {
          if (api.craftOk && !api.craftOk('bunk')) return
          if (api.giveBed) api.giveBed({ stars: rated.stars, tone: job.tone, fabric: job.fabric, pattern: job.pattern })
          rec.bed = null
          bedFlash = true
          saidBed = ''
          touch()
          shopTone(880, step)
          paintWoodshop(g, key)
        }))
        if (rated.stars >= 3) {
          step.append(capBtn('bed-remake', api.t('remakeBest'), () => {
            if (api.craftOk && !api.craftOk('bunk')) return
            if (!matsOk(job.fabric)) return
            const spent = spendMats(job.fabric)
            if (!spent) return
            if (api.giveBed) api.giveBed({ stars: 3, tone: job.tone, fabric: job.fabric, pattern: job.pattern })
            bedFlash = true
            touch()
            paintWoodshop(g, key)
          }))
        }
        sayBed('improve', skillText('skillImprove'), step)
      }
      box.append(step)
    }
    crate.append(box)
    if (api.teacher && api.teacher()) {
      const card = document.createElement('div')
      card.className = 'shop-teacher'
      card.dataset.teacher = '1'
      const h = document.createElement('p')
      h.className = 'gnote'
      h.textContent = api.t('shopTeacher')
      card.append(h)
      const paths = document.createElement('div')
      paths.className = 'choice-row'
      ;[['choose', 'pathKid'], ['design', 'pathDesign'], ['build', 'pathBuild']].forEach(([id, label]) => {
        const b = capBtn('path-pick' + (rule.path === id ? ' on' : ''), api.t(label), () => {
          if (api.rules) api.rules({ path: id })
          paintWoodshop(g, key)
        })
        b.dataset.path = id
        paths.append(b)
      })
      card.append(paths)
      const help = capBtn('help-measure' + (rule.help ? ' on' : ''), api.t('helpMeasure'), () => {
        if (api.rules) api.rules({ help: !rule.help })
        paintWoodshop(g, key)
      })
      help.dataset.help = rule.help ? '1' : '0'
      const req = capBtn('shop-required' + (rule.required ? ' on' : ''), api.t('shopRequired'), () => {
        if (api.rules) api.rules({ required: !rule.required })
        paintWoodshop(g, key)
      })
      req.dataset.required = rule.required ? '1' : '0'
      card.append(help, req)
      crate.append(card)
    }
  }
  // G2-14: Woodshop as Input (tools in) -> Process (tool wall setup, real progress) -> Output (what you make) -> Feedback
  function zoneWoodshop(crate, wall, bagRow, job, hung, ready) {
    const KS = window.KulibertSlots
    if (!KS || !KS.ui || !KS.ui.zoneFrame) return
    const zf = KS.ui.zoneFrame((k) => api.t(k), () => face('woodshop'))
    const headRow = crate.querySelector(':scope > .machine-head')
    const outs = [...crate.children].filter((n) => n !== headRow && n !== wall && n !== bagRow && n !== job)
    zf.inBody.append(wall, bagRow)
    zf.procBody.append(job)
    for (const n of outs) zf.outBody.append(n)
    crate.classList.add('ks-zoned', 'ks-shop-zoned')
    // Feedback sits above the zones here: the Woodshop column is long, so a bottom line would scroll out of view.
    if (headRow) headRow.after(zf.feedback, zf.row)
    else crate.prepend(zf.feedback, zf.row)
    const miss = SHOP_TOOLS.filter((row) => (hung || []).indexOf(row.item) < 0)
    zf.setPct(SHOP_TOOLS.length ? (SHOP_TOOLS.length - miss.length) / SHOP_TOOLS.length : 0)
    if (ready) zf.setFeedback(zf.word('fbReady', 'Ready to make'), 'done')
    else if (miss.length === SHOP_TOOLS.length) zf.setFeedback(zf.word('fbAdd', 'Add parts') + ': ' + miss.map((row) => api.t(row.item)).join(', '), 'info')
    else zf.setFeedback(zf.word('fbMissing', 'Missing: {list}').replace('{list}', miss.map((row) => api.t(row.item)).join(', ')), 'warn')
  }
  function paintWoodshop(g, key) {
    const rec = ensureShop(key)
    if (shopGuide && shopGuide !== 'woodshop' && shopGuide !== 'bunk' && !SHOP_TOOLS.some((row) => row.item === shopGuide)) shopGuide = ''
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
      line.textContent = shopGuide === 'bunk'
        ? [skillText('skillNeed'), skillText('skillPlan'), skillText('skillTest'), skillText('skillImprove')].join(' ')
        : api.t(who ? who.skill : 'skillBench')
      const back = document.createElement('button')
      back.type = 'button'
      back.className = 'keycap'
      back.textContent = api.t('close')
      back.addEventListener('click', () => { shopGuide = ''; paintWoodshop(g, key) })
      page.append(art, title, line)
      if (shopGuide === 'bunk') {
        const stars = document.createElement('p')
        stars.className = 'gnote bed-stars'
        const best = api.best && api.best()
        const n = best && best.stars ? best.stars : 1
        stars.dataset.stars = String(n)
        stars.textContent = starText(n)
        page.append(stars)
      }
      page.append(back)
      crate.append(page)
      g.append(crate)
      return
    }
    paintBed(crate, g, key, rec)
    const hungOk = wallReady(key)
    const DECOR = [
      { id: 'floorLamp', need: '1 Iron + 1 Glass + 1 Stick', ins: [['ironIngot', 1], ['glass', 1], ['stick', 1]] },
      { id: 'wallLamp', need: '1 Iron + 1 Glass', ins: [['ironIngot', 1], ['glass', 1]] },
      { id: 'rug', need: '4 Wool', ins: [['woolBlue', 4], ['woolGreen', 4], ['woolRed', 4], ['woolTan', 4]] },
    ]
    const decorReason = (d) => {
      if (decorMetalLocked(d.ins, !!(api.creative && api.creative()))) return api.t('needsMetal')
      if (!hungOk) return api.t('decorNeedTools')
      if (d.id === 'rug') {
        const have = d.ins.some(([k]) => api.have && api.have(k) >= 4)
        return have ? '' : api.t('decorNeedWool')
      }
      const miss = d.ins.find(([k, n]) => !(api.have && api.have(k) >= n))
      return miss ? api.t('decorNeedItem').replace('{n}', String(miss[1])).replace('{item}', api.t(miss[0])) : ''
    }
    for (const d of DECOR) {
      const card = document.createElement('div')
      card.className = 'bed-card decor-card'
      card.dataset.item = d.id
      const title = document.createElement('p')
      title.className = 'gnote'
      title.textContent = api.t(d.id)
      const metal = decorMetalLocked(d.ins, !!(api.creative && api.creative()))
      const reason = decorReason(d)
      const need = document.createElement('p')
      need.className = 'gnote decor-need'
      if (metal) {
        need.textContent = ''
        const chip = document.createElement('span')
        chip.className = 'gate-chip'
        chip.dataset.gate = 'metal'
        chip.textContent = reason
        chip.style.cssText = 'display:inline-flex;align-items:center;box-sizing:border-box;min-height:44px;margin-top:6px;padding:8px 12px;border-radius:999px;background:#08131A;color:#E6EEF2;border:2px solid #1F8A8A;font-size:16px;font-weight:700;max-width:100%'
        need.append(chip)
      } else need.textContent = reason || d.need
      card.append(title, need)
      const job = rec.decorJob && rec.decorJob.id === d.id ? rec.decorJob : null
      if (job) {
        const step = document.createElement('div')
        step.className = 'bed-step'
        step.dataset.step = 'design'
        const note = document.createElement('p')
        note.className = 'gnote decor-measure'
        note.textContent = d.id === 'rug' ? api.t('decorMeasureRug') : api.t('decorMeasureLamp')
        step.append(note)
        if (d.id === 'rug') {
          const mains = ['woolBlue', 'woolGreen', 'woolRed', 'woolTan']
          const rowM = document.createElement('div')
          rowM.className = 'choice-row'
          const rowT = document.createElement('div')
          rowT.className = 'choice-row'
          const owned = mains.find((id) => api.have && api.have(id) >= 4) || 'woolBlue'
          if (!job.colour) job.colour = owned
          if (!job.trim) job.trim = 'woolTan'
          mains.forEach((id) => {
            const b = capBtn('tone-pick' + (job.colour === id ? ' on' : ''), api.t('rugMain') + ' ' + api.t(id), () => { job.colour = id; touch(); paintWoodshop(g, key) })
            b.dataset.shade = id
            if (!(api.have && api.have(id) >= 4)) b.disabled = true
            rowM.append(b)
          })
          mains.forEach((id) => {
            const b = capBtn('tone-pick' + (job.trim === id ? ' on' : ''), api.t('rugTrim') + ' ' + api.t(id), () => { job.trim = id; touch(); paintWoodshop(g, key) })
            b.dataset.trim = id
            rowT.append(b)
          })
          step.append(rowM, rowT)
        } else {
          const shades = [['Natural', 'shadeNatural'], ['Cream', 'shadeCream'], ['Teal', 'shadeTeal']]
          const rowS = document.createElement('div')
          rowS.className = 'choice-row'
          if (!job.shade) job.shade = 'Natural'
          shades.forEach(([id, label]) => {
            const b = capBtn('tone-pick' + (job.shade === id ? ' on' : ''), api.t(label), () => { job.shade = id; touch(); paintWoodshop(g, key) })
            b.dataset.shade = id
            rowS.append(b)
          })
          step.append(rowS)
        }
        const make = capBtn('decor-make', api.t('make'), () => {
          if (decorReason(d)) return
          const design = d.id === 'rug'
            ? { colour: job.colour || 'woolBlue', trim: job.trim || 'woolTan' }
            : { height: 'Standard', shade: job.shade || 'Natural' }
          if (api.craft) api.craft(d.id, design)
          rec.decorJob = null
          touch()
          paintWoodshop(g, key)
        }, 'make')
        if (d.id === 'rug' && !(api.have && api.have(job.colour || 'woolBlue') >= 4)) make.disabled = true
        if (metal) lockBtn(make, reason)
        step.append(make)
        card.append(step)
      } else {
        const row = document.createElement('div')
        row.className = 'bed-paths'
        const sayNeed = () => { if (api.toast && reason) api.toast(reason) }
        const just = capBtn('decor-just-' + d.id, metal ? api.t('decorJust') : (reason || api.t('decorJust')), () => {
          if (decorReason(d)) { sayNeed(); return }
          if (api.craft) api.craft(d.id)
          paintWoodshop(g, key)
        }, 'make')
        const design = capBtn('decor-design-' + d.id, metal ? api.t('decorDesign') : (reason || api.t('decorDesign')), () => {
          if (decorReason(d)) { sayNeed(); return }
          const wool = d.id === 'rug' && d.ins.find(([k]) => api.have && api.have(k) >= 4)
          rec.decorJob = d.id === 'rug'
            ? { id: d.id, colour: wool ? wool[0] : 'woolBlue', trim: 'woolTan' }
            : { id: d.id, shade: 'Natural', height: 'Standard' }
          touch()
          paintWoodshop(g, key)
        }, 'design')
        if (metal) { lockBtn(just, reason); lockBtn(design, reason) }
        else if (reason) { just.title = reason; design.title = reason }
        row.append(just, design)
        card.append(row)
      }
      crate.append(card)
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
    const hung = wallItems(key)
    let nHung = 0
    for (let i = 0; i < SHOP_TOOLS.length; i++) if (hung.indexOf(SHOP_TOOLS[i].item) >= 0) nHung++
    const ready = wallReady(key)
    job.classList.toggle('lit', ready)
    job.dataset.ready = ready ? '1' : '0'
    const jobBtn = document.createElement('button')
    jobBtn.type = 'button'
    jobBtn.className = 'keycap shop-go'
    jobBtn.textContent = ready ? api.t('woodshopReady') : api.t('hangTools').replace('{n}', String(nHung))
    jobBtn.disabled = !ready
    jobBtn.addEventListener('click', () => {
      if (!wallReady(key)) return
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
    SHOP_TOOLS.map((row) => row.item).concat(['woodshop', 'bunk']).forEach((id) => {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'keycap'
      b.textContent = api.t('fieldGuide') + ' · ' + api.t(id)
      b.addEventListener('click', () => { shopGuide = id; paintWoodshop(g, key) })
      guide.append(b)
    })
    zoneWoodshop(crate, wall, bagRow, job, hung, ready)
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
      belt: () => (api.belt ? api.belt(k) : null),
    })
    // Belt-fed sand waits here before it bakes. Always an icon plus words, never a blank box.
    const beltHost = document.createElement('div')
    beltHost.className = 'belt-fed'
    beltHost.tabIndex = 0
    beltHost.setAttribute('role', 'status')
    beltHost.setAttribute('aria-live', 'polite')
    const beltArt = document.createElement('span')
    beltArt.className = 'belt-fed-art'
    beltArt.setAttribute('aria-hidden', 'true')
    const beltCount = document.createElement('span')
    beltCount.className = 'belt-fed-count'
    const beltLab = document.createElement('span')
    beltLab.className = 'belt-fed-lab'
    beltHost.append(beltArt, beltCount, beltLab)
    const beltHome = g.querySelector('.ks-inputs') || g.querySelector('.ks-main') || g
    beltHome.append(beltHost)
    let beltSig = ''
    const paintBelt = () => {
      const rec = get(k, 'oven')
      const held = rec.beltIn && rec.beltIn.item && rec.beltIn.n > 0 ? rec.beltIn : null
      const sig = held ? held.item + ':' + held.n : 'empty'
      if (sig === beltSig) return
      beltSig = sig
      beltArt.replaceChildren()
      if (held) {
        const icon = face(held.item)
        if (icon) beltArt.append(icon)
        beltCount.hidden = false
        beltCount.textContent = String(held.n)
        beltLab.textContent = api.t('beltFrom')
        beltHost.dataset.state = 'full'
        beltHost.setAttribute('aria-label', itemName(held.item) + ' ' + held.n + ', ' + api.t('beltFrom'))
      } else {
        beltArt.innerHTML = '<svg viewBox="0 0 24 24" focusable="false" aria-hidden="true"><path d="M3 16h18M5 16v3h2.5v-3M16.5 16v3H19v-3M4 13h16l-1.5-4h-13z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
        beltCount.hidden = true
        beltCount.textContent = ''
        beltLab.textContent = api.t('beltEmpty')
        beltHost.dataset.state = 'empty'
        beltHost.setAttribute('aria-label', api.t('beltEmpty'))
      }
    }
    paintBelt()
    const beltTimer = setInterval(paintBelt, 250)
    const killPanel = panel.destroy
    g._ksDestroy = () => {
      clearInterval(beltTimer)
      if (killPanel) killPanel()
    }
  }
  function baking() {
    const out = []
    for (const [key, rec] of map) {
      if (rec && rec.until && Date.now() < rec.until) out.push(key)
    }
    return out
  }
  // 0066: belts feed the oven without a kid's bag. Fuel goes to the fuel slot (one kind at a time, up to FUEL_CAP
  // items); a bakeable item waits in a belt-in slot (one kind, up to 64) and starts a single-input bake as soon as
  // there is enough of it, fuel is loaded and nothing is baking. Returns false when the oven cannot take the item,
  // which the belt shows as Full until it can.
  const FUEL_CAP = 64
  function singleRecipe(item) {
    return OVEN.find((recipe) => recipe.in.length === 1 && recipe.in[0][0] === item) || null
  }
  function startFromBelt(r) {
    if (!r || r.kind !== 'oven' || r.until || !(r.left > 0)) return false
    const b = r.beltIn
    if (!b || !b.item || !(b.n > 0)) return false
    const recipe = singleRecipe(b.item)
    if (!recipe) return false
    const need = recipe.in[0][1]
    if (b.n < need) return false
    b.n -= need
    if (b.n <= 0) r.beltIn = null
    r.picking = false
    r.pick = recipe.id
    r.input = [b.item]
    r.inputN = need
    r.pending = recipe.out[0]
    r.secs = recipe.secs || 5
    r.until = Date.now() + r.secs * 1000
    r.staged = null
    touch()
    return true
  }
  function pushIn(key, item) {
    if (!item) return false
    const r = get(key, 'oven')
    if (BAKES[item]) {
      if (r.fuelItem && r.fuelItem !== item && r.fuelN > 0) return false
      if ((r.fuelN || 0) >= FUEL_CAP) return false
      r.fuelItem = item
      r.fuelN = (r.fuelN || 0) + 1
      r.left = (r.left || 0) + BAKES[item]
      r.fuel = r.left
      r.fuelNote = ''
      startFromBelt(r)
      touch()
      return true
    }
    if (!singleRecipe(item)) return false
    const b = r.beltIn
    if (b && b.item && b.item !== item && b.n > 0) return false
    if (b && b.n >= 64) return false
    r.beltIn = b && b.item === item ? { item, n: b.n + 1 } : { item, n: 1 }
    startFromBelt(r)
    touch()
    return true
  }
  function pullOut(key) {
    const r = map.get(key)
    if (!r || !r.output || !r.output.length) return ''
    return r.output.shift() || ''
  }
  function slotCounts(key) {
    const r = map.get(key)
    if (!r) return { inn: 0, outn: 0 }
    const inn = (r.input && r.input.length ? (r.inputN || r.input.length) : 0) + (r.beltIn && r.beltIn.n > 0 ? r.beltIn.n : 0)
    return { inn, outn: r.output ? r.output.length : 0 }
  }
  return { tick, paint, view, addFuel, addInput, arm, take, baking, ensureShop, wallItems, clearShop, pullOut, pushIn, slotCounts, dump: () => {
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
