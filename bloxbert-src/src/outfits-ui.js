// Avatar Outfits picker: Menu > My Look (2.5.555). No imports: main.js passes the outfits module as ctx.O.
// ctx: { O, store, t, toast, reduced():bool, onSave(look) }
// The preview is a small 2D box renderer (same boxes as the 3D rig), so it costs nothing on a Chromebook and needs no second 3D scene.

const CSS = `
#sheet[data-panel="mylook"] .ggrid{display:block;overflow:visible}
#sheet .ml{display:flex;flex-direction:column;gap:14px;color:#e6eef2;font-size:16px;line-height:1.35;max-width:760px;margin:0 auto}
#sheet .ml *{box-sizing:border-box}
#sheet .ml-top{display:flex;gap:18px;align-items:flex-start}
#sheet .ml-view{display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 0 auto}
#sheet .ml-view canvas{width:176px;height:220px;background:#15222c;border:2px solid #2f5566;border-radius:12px;image-rendering:pixelated;display:block}
#sheet .ml-turn{display:flex;gap:8px}
#sheet .ml-info{flex:1 1 auto;min-width:0}
#sheet .ml-name{font-size:22px;font-weight:700;margin:0 0 6px;overflow-wrap:anywhere}
#sheet .ml-all{margin:0 0 8px;padding:0;list-style:none;font-size:15px;color:#c9d6dc}
#sheet .ml-all li{display:flex;gap:6px;align-items:baseline;padding:2px 0}
#sheet .ml-all b{font-weight:600;color:#9fd8d0;min-width:4.2em}
#sheet .ml-state{display:inline-flex;gap:6px;align-items:center;font-weight:600;padding:4px 10px;border-radius:999px;border:2px solid #476b79;background:#10202a}
#sheet .ml-state.on{border-color:#7fd1b0;color:#bfe9d6}
#sheet .ml-hint{font-size:14px;color:#aebcc4;margin:0}
#sheet .ml-h{font-size:15px;font-weight:700;margin:0 0 6px;color:#9fd8d0;letter-spacing:.02em}
#sheet .ml-tabs{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 6px;scrollbar-width:thin}
#sheet .ml button{font:inherit;color:#e6eef2 !important;background:#1b2e3a !important;border:2px solid #3b6070;border-radius:12px;cursor:pointer;min-height:48px;padding:6px 12px;display:inline-flex;align-items:center;justify-content:center;gap:8px}
#sheet .ml button:hover{background:#23404f !important;color:#f1f6f8 !important}
#sheet .ml button:focus-visible{outline:3px solid #ffd58a;outline-offset:2px}
#sheet .ml-tab{flex:0 0 auto;min-width:104px;min-height:56px}
#sheet .ml-tab[aria-selected="true"]{background:#244b52 !important;border-color:#7ff5e3;box-shadow:inset 0 -4px 0 #7ff5e3}
#sheet .ml-row{display:flex;flex-wrap:wrap;gap:8px}
#sheet .ml-card{flex:0 0 auto;flex-direction:column;gap:4px;min-width:104px;min-height:96px;position:relative;text-align:center}
#sheet .ml-card canvas{width:56px;height:56px;image-rendering:pixelated;display:block}
#sheet .ml-sw{width:30px;height:30px;border-radius:8px;border:2px solid #0b141a;flex:0 0 auto}
#sheet .ml-chip{flex:0 0 auto;min-width:118px;justify-content:flex-start;padding:6px 10px}
#sheet .ml-chip canvas{width:32px;height:32px;image-rendering:pixelated;border:2px solid #0b141a;border-radius:6px;flex:0 0 auto}
#sheet .ml button[aria-checked="true"]{background:#244b52 !important;border-color:#7ff5e3;box-shadow:inset 0 0 0 2px #7ff5e3}
#sheet .ml-chk{display:none;font-weight:800;color:#7ff5e3}
#sheet .ml button[aria-checked="true"] .ml-chk{display:inline}
#sheet .ml-card .ml-chk{position:absolute;top:4px;right:8px}
#sheet .ml-act{display:flex;flex-wrap:wrap;gap:10px}
#sheet .ml-act button{min-width:120px;font-weight:700}
#sheet .ml-save{background:#2a6b5f !important;border-color:#7ff5e3}
#sheet .ml-ico{width:22px;height:22px;image-rendering:pixelated}
@media (max-width:560px){
  #sheet .ml-top{flex-direction:column;align-items:center}
  #sheet .ml-info{width:100%}
  #sheet .ml-view canvas{width:160px;height:200px}
  #sheet .ml-tabs{flex-wrap:nowrap}
}
`

const FACES = [
  // n: normal; o: origin corner as signs of half sizes; u, v: edge directions in units of full size
  { n: [0, 0, 1], o: [-1, 1, 1], u: [1, 0, 0], v: [0, -1, 0], sh: 0.8 },
  { n: [0, 0, -1], o: [1, 1, -1], u: [-1, 0, 0], v: [0, -1, 0], sh: 0.8 },
  { n: [1, 0, 0], o: [1, 1, 1], u: [0, 0, -1], v: [0, -1, 0], sh: 0.8 },
  { n: [-1, 0, 0], o: [-1, 1, -1], u: [0, 0, 1], v: [0, -1, 0], sh: 0.8 },
  { n: [0, 1, 0], o: [-1, 1, -1], u: [1, 0, 0], v: [0, 0, 1], sh: 1 },
  { n: [0, -1, 0], o: [-1, -1, 1], u: [1, 0, 0], v: [0, 0, -1], sh: 0.6 },
]

function injectCss() {
  if (document.getElementById('ml-css')) return
  const st = document.createElement('style')
  st.id = 'ml-css'
  st.textContent = CSS
  document.head.append(st)
}

export function mountMyLook(host, ctx) {
  const { O, store, t } = ctx
  injectCss()
  store.revert()

  // ---- pattern overlays: dark marks only, same tiles as the 3D atlas ------------------------------------
  const tileCanvas = O.PATTERNS.map((p) => {
    const c = document.createElement('canvas')
    c.width = O.TILE
    c.height = O.TILE
    const g = c.getContext('2d')
    const img = g.createImageData(O.TILE, O.TILE)
    for (let y = 0; y < O.TILE; y++) for (let x = 0; x < O.TILE; x++) {
      const i = (y * O.TILE + x) * 4
      img.data[i + 3] = Math.round((1 - O.patternValue(p, x, y)) * 255)
    }
    g.putImageData(img, 0, 0)
    return c
  })

  function render(c2, parts, yaw, pitch, scale, cx, cy) {
    const cosY = Math.cos(yaw); const sinY = Math.sin(yaw); const cosP = Math.cos(pitch); const sinP = Math.sin(pitch)
    const proj = (x, y, z) => {
      const x1 = x * cosY + z * sinY
      const z1 = -x * sinY + z * cosY
      const y2 = y * cosP - z1 * sinP
      const z2 = y * sinP + z1 * cosP
      return [cx + x1 * scale, cy - y2 * scale, z2]
    }
    const rotN = (n) => { const z1 = -n[0] * sinY + n[2] * cosY; return n[1] * sinP + z1 * cosP }
    const faces = []
    for (const part of parts) {
      const [px, py, pz] = part.p; const [w, h, d] = part.s
      for (const f of FACES) {
        if (rotN(f.n) <= 0.01) continue
        const u3 = [f.u[0] * w, f.u[1] * h, f.u[2] * d]
        const v3 = [f.v[0] * w, f.v[1] * h, f.v[2] * d]
        const a = proj(px + f.o[0] * w / 2, py + f.o[1] * h / 2, pz + f.o[2] * d / 2)
        const b = proj(px + f.o[0] * w / 2 + u3[0], py + f.o[1] * h / 2 + u3[1], pz + f.o[2] * d / 2 + u3[2])
        const c = proj(px + f.o[0] * w / 2 + u3[0] + v3[0], py + f.o[1] * h / 2 + u3[1] + v3[1], pz + f.o[2] * d / 2 + u3[2] + v3[2])
        const e = proj(px + f.o[0] * w / 2 + v3[0], py + f.o[1] * h / 2 + v3[1], pz + f.o[2] * d / 2 + v3[2])
        const depth = (a[2] + b[2] + c[2] + e[2]) / 4
        faces.push({ a, b, c, e, depth, sh: f.sh, rgb: part.rgb, pat: part.pat })
      }
    }
    faces.sort((m, n) => m.depth - n.depth)
    for (const f of faces) {
      const col = 'rgb(' + Math.round(f.rgb[0] * f.sh * 255) + ',' + Math.round(f.rgb[1] * f.sh * 255) + ',' + Math.round(f.rgb[2] * f.sh * 255) + ')'
      c2.beginPath()
      c2.moveTo(f.a[0], f.a[1]); c2.lineTo(f.b[0], f.b[1]); c2.lineTo(f.c[0], f.c[1]); c2.lineTo(f.e[0], f.e[1]); c2.closePath()
      c2.fillStyle = col
      c2.fill()
      if (f.pat) {
        c2.save()
        c2.clip()
        c2.imageSmoothingEnabled = false
        c2.setTransform(f.b[0] - f.a[0], f.b[1] - f.a[1], f.e[0] - f.a[0], f.e[1] - f.a[1], f.a[0], f.a[1])
        c2.drawImage(tileCanvas[f.pat], 0, 0, 1, 1)
        c2.restore()
      }
      c2.lineWidth = 1
      c2.strokeStyle = 'rgba(8,14,18,0.45)'
      c2.stroke()
    }
  }

  function drawIcon(canvas, slot, id, look) {
    const g = canvas.getContext('2d')
    const S = canvas.width
    g.clearRect(0, 0, S, S)
    if (id === 'none') {
      g.strokeStyle = '#9fb3bd'; g.lineWidth = 2
      g.strokeRect(S * 0.22, S * 0.22, S * 0.56, S * 0.56)
      g.beginPath(); g.moveTo(S * 0.22, S * 0.78); g.lineTo(S * 0.78, S * 0.22); g.stroke()
      return
    }
    const l = { ...look, [slot]: id }
    const parts = O.partsFor(l, slot)
    let x0 = 9; let x1 = -9; let y0 = 9; let y1 = -9
    for (const p of parts) { x0 = Math.min(x0, p.p[0] - p.s[0] / 2); x1 = Math.max(x1, p.p[0] + p.s[0] / 2); y0 = Math.min(y0, p.p[1] - p.s[1] / 2); y1 = Math.max(y1, p.p[1] + p.s[1] / 2) }
    const scale = (S * 0.82) / Math.max(x1 - x0, y1 - y0, 0.2)
    render(g, parts, -0.55, 0.3, scale, S / 2 - ((x0 + x1) / 2) * scale * 0.9, S / 2 + ((y0 + y1) / 2) * scale)
  }

  // ---- DOM ----------------------------------------------------------------------------------------------
  const root = document.createElement('div')
  root.className = 'ml'
  root.dataset.mylook = '1'
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e }

  const top = el('div', 'ml-top')
  const view = el('div', 'ml-view')
  const canvas = document.createElement('canvas')
  canvas.width = 200; canvas.height = 250
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', t('mlPreview'))
  const turn = el('div', 'ml-turn')
  const turnL = el('button', '', '◀ ' + t('mlTurnL'))
  const turnR = el('button', '', t('mlTurnR') + ' ▶')
  turnL.type = 'button'; turnR.type = 'button'
  turn.append(turnL, turnR)
  view.append(canvas, turn)
  const info = el('div', 'ml-info')
  const nameEl = el('h3', 'ml-name')
  nameEl.setAttribute('aria-live', 'polite')
  const allEl = el('ul', 'ml-all')
  const stateEl = el('span', 'ml-state')
  const hint = el('p', 'ml-hint', t('mlViewHint'))
  info.append(nameEl, allEl, stateEl, hint)
  top.append(view, info)

  const tabsEl = el('div', 'ml-tabs')
  tabsEl.setAttribute('role', 'tablist')
  const secItem = el('div'); const hItem = el('h4', 'ml-h', t('mlItem')); const itemsEl = el('div', 'ml-row')
  const secColor = el('div'); const hColor = el('h4', 'ml-h', t('mlColor')); const colorsEl = el('div', 'ml-row')
  const secPat = el('div'); const hPat = el('h4', 'ml-h', t('mlPattern')); const patsEl = el('div', 'ml-row')
  for (const [row, label] of [[itemsEl, 'mlItem'], [colorsEl, 'mlColor'], [patsEl, 'mlPattern']]) { row.setAttribute('role', 'radiogroup'); row.setAttribute('aria-label', t(label)) }
  secItem.append(hItem, itemsEl); secColor.append(hColor, colorsEl); secPat.append(hPat, patsEl)

  const act = el('div', 'ml-act')
  const bRandom = el('button', '', '⚂ ' + t('mlRandom')); const bReset = el('button', '', '↺ ' + t('mlReset')); const bSave = el('button', 'ml-save', '✔ ' + t('mlSave'))
  for (const b of [bRandom, bReset, bSave]) b.type = 'button'
  act.append(bRandom, bReset, bSave)
  root.append(top, tabsEl, secItem, secColor, secPat, act)
  host.append(root)

  let slot = 'head'
  let yaw = 0
  let hold = 0

  // roving tabindex group: one tab stop, arrows move focus, Enter or Space picks
  function arrows(group, selector) {
    group.addEventListener('keydown', (ev) => {
      const items = Array.from(group.querySelectorAll(selector))
      const i = items.indexOf(document.activeElement)
      if (i < 0) return
      let j = i
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') j = (i + 1) % items.length
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') j = (i - 1 + items.length) % items.length
      else if (ev.key === 'Home') j = 0
      else if (ev.key === 'End') j = items.length - 1
      else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); items[i].click(); return }
      else return
      ev.preventDefault()
      items.forEach((b, k) => { b.tabIndex = k === j ? 0 : -1 })
      items[j].focus()
    })
  }
  arrows(tabsEl, '.ml-tab'); arrows(itemsEl, '.ml-card'); arrows(colorsEl, '.ml-chip'); arrows(patsEl, '.ml-chip')

  function keep(fn) {
    const a = document.activeElement
    const key = a && root.contains(a) && a.dataset ? a.dataset.k : ''
    fn()
    if (key) { const again = root.querySelector('[data-k="' + key + '"]'); if (again) again.focus({ preventScroll: true }) }
  }

  function paintTabs() {
    tabsEl.replaceChildren()
    const look = store.get()
    for (const s of O.SLOTS) {
      const b = el('button', 'ml-tab')
      b.type = 'button'
      b.setAttribute('role', 'tab')
      b.setAttribute('aria-selected', String(s === slot))
      b.tabIndex = s === slot ? 0 : -1
      b.dataset.k = 'tab-' + s
      const c = document.createElement('canvas'); c.width = 28; c.height = 28; c.className = 'ml-ico'
      const rep = look[s] !== 'none' ? look[s] : O.ITEMS[s].find((i) => i !== 'none')
      drawIcon(c, s, rep, look)
      b.append(c, el('span', '', t('ls_' + s)))
      b.addEventListener('click', () => { slot = s; paintAll() })
      tabsEl.append(b)
    }
  }

  function radio(cls, key, label, selected) {
    const b = el('button', cls)
    b.type = 'button'
    b.setAttribute('role', 'radio')
    b.setAttribute('aria-checked', String(selected))
    b.setAttribute('aria-label', label)
    b.tabIndex = selected ? 0 : -1
    b.dataset.k = key
    return b
  }

  function paintRows() {
    const look = store.get()
    itemsEl.replaceChildren(); colorsEl.replaceChildren(); patsEl.replaceChildren()
    let anyTab = false
    for (const id of O.ITEMS[slot]) {
      const sel = look[slot] === id
      const name = t(O.itemKey(slot, id))
      const b = radio('ml-card', 'item-' + id, name, sel)
      const locked = !store.isUnlocked(slot, id)
      if (locked) { b.disabled = true; b.setAttribute('aria-disabled', 'true') }
      const c = document.createElement('canvas'); c.width = 56; c.height = 56
      drawIcon(c, slot, id, look)
      b.append(c, el('span', '', name), el('span', 'ml-chk', '✓'))
      b.addEventListener('click', () => { if (!locked) { store.set(slot, 'item', id); afterPick() } })
      itemsEl.append(b)
      anyTab = anyTab || sel
    }
    if (!anyTab && itemsEl.firstChild) itemsEl.firstChild.tabIndex = 0
    for (const id of O.COLOR_IDS) {
      const sel = look[slot + 'Color'] === id
      const name = t(O.colorKey(id))
      const b = radio('ml-chip', 'color-' + id, name, sel)
      const sw = el('span', 'ml-sw')
      const rgb = O.COLORS[id]
      sw.style.background = 'rgb(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' + Math.round(rgb[2] * 255) + ')'
      b.append(sw, el('span', '', name), el('span', 'ml-chk', '✓'))
      b.addEventListener('click', () => { store.set(slot, 'color', id); afterPick() })
      colorsEl.append(b)
    }
    for (const id of O.PATTERNS) {
      const sel = look[slot + 'Pattern'] === id
      const name = t(O.patternKey(id))
      const b = radio('ml-chip', 'pat-' + id, name, sel)
      const c = document.createElement('canvas'); c.width = O.TILE; c.height = O.TILE
      const g = c.getContext('2d')
      const rgb = O.COLORS[look[slot + 'Color']]
      g.fillStyle = 'rgb(' + Math.round(rgb[0] * 255) + ',' + Math.round(rgb[1] * 255) + ',' + Math.round(rgb[2] * 255) + ')'
      g.fillRect(0, 0, O.TILE, O.TILE)
      g.drawImage(tileCanvas[O.PATTERNS.indexOf(id)], 0, 0)
      b.append(c, el('span', '', name), el('span', 'ml-chk', '✓'))
      b.addEventListener('click', () => { store.set(slot, 'pattern', id); afterPick() })
      patsEl.append(b)
    }
  }

  function paintInfo() {
    const look = store.get()
    nameEl.textContent = O.nameFor(slot, look, t)
    allEl.replaceChildren()
    for (const s of O.SLOTS) {
      const li = el('li')
      li.append(el('b', '', t('ls_' + s)), el('span', '', O.nameFor(s, look, t)))
      allEl.append(li)
    }
    const saved = !store.dirty()
    stateEl.className = 'ml-state' + (saved ? ' on' : '')
    stateEl.textContent = (saved ? '✓ ' : '• ') + t(saved ? 'mlIsSaved' : 'mlUnsaved')
  }

  function draw() {
    const g = canvas.getContext('2d')
    g.setTransform(1, 0, 0, 1, 0, 0)
    g.clearRect(0, 0, canvas.width, canvas.height)
    g.fillStyle = '#15222c'
    g.fillRect(0, 0, canvas.width, canvas.height)
    g.fillStyle = '#0f1a22'
    g.fillRect(0, 226, canvas.width, 24)
    render(g, O.partsFor(store.get()), yaw, 0.2, 138, 100, 101)
  }

  function paintAll() { keep(() => { paintTabs(); paintRows(); paintInfo() }); draw() }
  function afterPick() { keep(() => { paintTabs(); paintRows(); paintInfo() }); draw() }

  turnL.addEventListener('click', () => { yaw -= Math.PI / 4; hold = performance.now() + 3000; draw() })
  turnR.addEventListener('click', () => { yaw += Math.PI / 4; hold = performance.now() + 3000; draw() })
  bRandom.addEventListener('click', () => { store.random(); paintAll() })
  bReset.addEventListener('click', () => { store.reset(); paintAll() })
  bSave.addEventListener('click', () => {
    if (store.save()) {
      if (ctx.onSave) ctx.onSave(store.saved())
      if (ctx.toast) ctx.toast(t('mlSaved'))
    }
    paintInfo()
  })

  paintAll()

  // Slow turn. Reduced motion: still front view, only the Turn buttons move it.
  const calm = ctx.reduced ? ctx.reduced() : false
  if (!calm) {
    let last = performance.now()
    let acc = 0
    const tick = (now) => {
      if (!canvas.isConnected) return
      const dt = Math.min(100, now - last)
      last = now
      acc += dt
      if (now > hold && acc >= 50) { yaw += 0.00045 * acc; acc = 0; draw() }
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  return { root, draw, get slot() { return slot }, setSlot(s) { slot = s; paintAll() }, setYaw(v) { yaw = v; draw() } }
}
