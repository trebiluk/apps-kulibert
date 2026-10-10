// Tap every face of a Bed, Oven, Box, Counter and Woodshop. A tap uses it. Crouch places beside it.
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'

const layout = JSON.parse(readFileSync(new URL('../tests/open-ground.json', import.meta.url), 'utf8'))
const chrome = ['/opt/pw-browsers/chromium-1148/chrome-linux/chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')
const out = '/tmp/furniture-tap'
mkdirSync(out, { recursive: true })
const IDS = { bunk: 26, oven: 23, box: 27, vend: 24, woodshop: 69 }
const PANELS = { bunk: 'bunk', oven: 'station', box: 'box', vend: 'counter', woodshop: 'woodshop' }
const FACES = [
  { name: '+x', n: [1, 0, 0] },
  { name: '-x', n: [-1, 0, 0] },
  { name: '+y', n: [0, 1, 0] },
  { name: '-y', n: [0, -1, 0] },
  { name: '+z', n: [0, 0, 1] },
  { name: '-z', n: [0, 0, -1] },
]
const HOLDS = ['coal', 'bread', 'empty', 'handSaw']
const ONLY = process.env.TAP_ONLY || ''
const report = { version: '2.5.128', steps: [], fps: {}, errors: [] }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail == null ? '' : String(detail).slice(0, 600) })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + String(detail).slice(0, 280) : ''))
  if (!ok && !report.fail) report.fail = name
  return ok
}
const browser = await puppeteer.launch({
  executablePath: chrome,
  headless: 'new',
  protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.setDefaultTimeout(180000)
const errors = []
page.on('pageerror', (e) => errors.push('page:' + e.message))
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()) })

async function boot(w, h, touch) {
  await page.setViewport({ width: w, height: h, hasTouch: !!touch, isLandscape: w > h, deviceScaleFactor: 1 })
  const q = touch ? '&touch=1' : ''
  await page.goto('http://127.0.0.1:8875/blocks-test/?q=lite&smoke=1' + q, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(() => window.__bloxReady && window.__btOpen && window.__smoke && window.__blocks, { timeout: 45000 })
  await new Promise((r) => setTimeout(r, 300))
}

async function buildWorld() {
  return page.evaluate(async (layout, IDS) => {
    const air = []
    for (let x = 58; x <= 100; x++) for (let y = 2; y <= 23; y++) for (let z = 58; z <= 110; z++) air.push([x, y, z, 0])
    for (let i = 0; i < air.length; i += 6000) window.__blocks.applyEdit(air.slice(i, i + 6000))
    const ops = []
    for (const p of layout.pieces) {
      ops.push([p.x, p.y, p.z, IDS[p.kind]])
      if (p.kind === 'woodshop') ops.push([p.x + 1, p.y, p.z, 70])
    }
    window.__blocks.applyEdit(ops)
    const s = window.__smoke
    window.__blocks.mode('survival')
    s.close()
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    s.emptyBag()
    for (const p of layout.pieces) {
      const key = p.x + ',' + p.y + ',' + p.z
      if (p.kind === 'bunk') s.setMeta(key, { kind: 'bunk', stars: p.stars, restAt: p.restAt, tone: p.tone, fabric: p.fabric, pattern: p.pattern })
      if (p.kind === 'box') s.setMeta(key, { kind: 'box', slots: Array.from({ length: 18 }, () => null) })
      if (p.kind === 'vend') s.setMeta(key, { kind: 'vend', owner: 'you', slots: [null, null, null, null], till: 0, sales: [], salesN: 0 })
      if (p.kind === 'woodshop') {
        const side = (p.x + 1) + ',' + p.y + ',' + p.z
        const row = (role) => ({ kind: 'woodshop', face: 'N', role, anchor: key, pair: side })
        s.setMeta(key, row('anchor'))
        s.setMeta(side, row('side'))
      }
    }
    const b = layout.pieces[0]
    s.close()
    try { window.__blocks.noa.setPaused(false) } catch (e) {}
    s.stand(b.x + 3.2, b.y + 2, b.z + 0.5, Math.atan2(-1, 0), 0.2)
    const t0 = performance.now()
    let world = 0
    while (performance.now() - t0 < 8000) {
      s.stand(b.x + 3.2, b.y + 2, b.z + 0.5, Math.atan2(-1, 0), 0.2)
      world = s.world(b.x, b.y, b.z)
      if (world === 26 && s.voxel(b.x, b.y, b.z) === 26) break
      await new Promise((r) => setTimeout(r, 80))
    }
    return { world, voxel: s.voxel(b.x, b.y, b.z), version: window.__blocks.version, paused: window.__blocks.noa._paused }
  }, layout, IDS)
}

function expectCell(piece, n) {
  if (piece.kind === 'woodshop' && n[0] === 1) return { x: piece.x + 1, y: piece.y, z: piece.z, id: 70 }
  return { x: piece.x, y: piece.y, z: piece.z, id: IDS[piece.kind] }
}

async function tapPiece(piece, hold, touch) {
  return page.evaluate(async (piece, hold, touch, faces) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const s = window.__smoke
    const IDS = { bunk: 26, oven: 23, box: 27, vend: 24, woodshop: 69 }
    const PANELS = { bunk: 'bunk', oven: 'station', box: 'box', vend: 'counter', woodshop: 'woodshop' }
    s.close()
    s.emptyBag()
    window.__blocks.mode('survival')
    s.setEnergy(2)
    if (hold === 'coal') window.__blocks.give('coal', 8)
    if (hold === 'bread') window.__blocks.give('bread', 4)
    if (hold === 'handSaw') window.__blocks.give('handSaw', 1)
    if (hold !== 'empty') s.hold(hold)
    const before = { coal: s.count('coal'), bread: s.count('bread'), saw: s.count('handSaw') }
    const canvas = document.querySelector('#stage canvas')
    function cellFor(n) {
      if (piece.kind === 'woodshop' && n[0] === 1) return { x: piece.x + 1, y: piece.y, z: piece.z, id: 70 }
      return { x: piece.x, y: piece.y, z: piece.z, id: IDS[piece.kind] }
    }
    function pose(n, dist) {
      const cell = cellFor(n)
      const tx = cell.x + 0.5 + n[0] * 0.46
      const ty = cell.y + 0.5 + n[1] * 0.46
      const tz = cell.z + 0.5 + n[2] * 0.46
      const eyeX = tx + n[0] * dist
      const eyeY = ty + n[1] * dist
      const eyeZ = tz + n[2] * dist
      const dx = tx - eyeX
      const dy = ty - eyeY
      const dz = tz - eyeZ
      s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(dx, dz), Math.atan2(-dy, Math.hypot(dx, dz) || 0.001))
    }
    async function lockAim(n) {
      const cell = cellFor(n)
      const rect = () => canvas.getBoundingClientRect()
      let last = null
      for (const dist of [2.4, 3.2, 4.0]) {
        for (let i = 0; i < 10; i++) {
          pose(n, dist)
          await frame()
          const r = rect()
          const cx = r.left + r.width / 2
          const cy = r.top + r.height / 2
          const aim = s.aim()
          let hit = s.hit(cx, cy)
          let x = cx
          let y = cy
          const same = (h) => h && h.id === cell.id && h.x === cell.x && h.y === cell.y && h.z === cell.z && h.nx === n[0] && h.ny === n[1] && h.nz === n[2]
          if (!same(hit)) {
            const grid = [-48, -24, 0, 24, 48]
            outer: for (const oy of grid) for (const ox of grid) {
              const h = s.hit(cx + ox, cy + oy)
              if (same(h)) { hit = h; x = cx + ox; y = cy + oy; break outer }
            }
          }
          last = { hit, aim, dist }
          const aimOk = aim && aim.id === cell.id && aim.x === cell.x && aim.y === cell.y && aim.z === cell.z
          if (same(hit) && (touch || aimOk)) return { x, y, hit, aim, dist }
        }
      }
      return { x: 0, y: 0, hit: last && last.hit, aim: last && last.aim, miss: true, dist: 2.4, last }
    }
    function fire(x, y) {
      if (!touch && s.arm) s.arm()
      const common = { bubbles: true, cancelable: true, pointerId: 3, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: y, isPrimary: true }
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, button: 0, buttons: 1 }))
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, button: 0, buttons: 0 }))
    }
    function panel() {
      const sheet = document.getElementById('sheet')
      return sheet && !sheet.hidden ? sheet.dataset.panel || '' : ''
    }
    function kept() {
      const key = piece.x + ',' + piece.y + ',' + piece.z
      const meta = s.bed(key)
      const side = piece.kind === 'woodshop' ? s.voxel(piece.x + 1, piece.y, piece.z) : 70
      return s.voxel(piece.x, piece.y, piece.z) === IDS[piece.kind] && side === 70 && !!meta && meta.kind === (piece.kind === 'oven' ? meta.kind : piece.kind === 'bunk' ? 'bunk' : piece.kind === 'box' ? 'box' : piece.kind === 'vend' ? 'vend' : 'woodshop')
    }
    const facesOut = []
    for (const face of faces) {
      const aim = await lockAim(face.n)
      if (aim.miss) {
        facesOut.push({ face: face.name, miss: true, hit: aim.hit, aim: aim.aim, last: aim.last })
        break
      }
      const taps = []
      let muted = null
      for (let n = 0; n < 5; n++) {
        pose(face.n, aim.dist || 2.4)
        await frame()
        const spot = await lockAim(face.n)
        const x = spot.miss ? aim.x : spot.x
        const y = spot.miss ? aim.y : spot.y
        fire(x, y)
        let open = panel()
        if (!open) {
          await sleep(360)
          fire(x, y)
          open = panel()
        }
        const safe = document.querySelector('#shop-safe button')
        if (safe) safe.click()
        const row = {
          open,
          voxel: s.voxel(piece.x, piece.y, piece.z),
          side: piece.kind === 'woodshop' ? s.voxel(piece.x + 1, piece.y, piece.z) : null,
          coal: s.count('coal'),
          bread: s.count('bread'),
          saw: s.count('handSaw'),
          meta: s.bed(piece.x + ',' + piece.y + ',' + piece.z),
        }
        taps.push(row)
        if (n === 0 && piece.kind === 'bunk' && hold === 'coal') {
          s.close()
          fire(aim.x, aim.y)
          muted = { voxel: s.voxel(piece.x, piece.y, piece.z), coal: s.count('coal'), open: panel() }
        }
        s.close()
        await sleep(340)
      }
      facesOut.push({ face: face.name, taps, muted, hit: aim.hit })
    }
    const meta = s.bed(piece.x + ',' + piece.y + ',' + piece.z)
    return {
      before,
      after: { coal: s.count('coal'), bread: s.count('bread'), saw: s.count('handSaw') },
      voxel: s.voxel(piece.x, piece.y, piece.z),
      side: piece.kind === 'woodshop' ? s.voxel(piece.x + 1, piece.y, piece.z) : null,
      meta,
      kept: kept(),
      faces: facesOut,
      want: PANELS[piece.kind],
    }
  }, piece, hold, touch, FACES)
}

async function crouchPlace(touch) {
  return page.evaluate(async (touch) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const s = window.__smoke
    const bunk = { x: 72, y: 16, z: 72 }
    s.close()
    await sleep(340)
    s.emptyBag()
    window.__blocks.give('coal', 4)
    s.hold('coal')
    const btn = document.getElementById('t-crouch')
    if (btn && btn.getAttribute('aria-pressed') !== 'true') btn.click()
    const n = [0, 0, 1]
    const tx = bunk.x + 0.5
    const ty = bunk.y + 0.5
    const tz = bunk.z + 0.5 + 0.46
    const dist = 3.4
    const eyeX = tx
    const eyeY = ty
    const eyeZ = tz + dist
    s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(0, -1), 0)
    const canvas = document.querySelector('#stage canvas')
    let hit = null
    for (let i = 0; i < 10; i++) {
      s.stand(eyeX, eyeY - 1.62, eyeZ, Math.atan2(0, -1), 0)
      await frame()
      const r = canvas.getBoundingClientRect()
      hit = s.hit(r.left + r.width / 2, r.top + r.height / 2)
      const aim = s.aim()
      if (hit && hit.id === 26 && hit.z === bunk.z && (touch || (aim && aim.id === 26 && aim.z === bunk.z))) break
    }
    const r = canvas.getBoundingClientRect()
    const x = r.left + r.width / 2
    const y = r.top + r.height / 2
    const common = { bubbles: true, cancelable: true, pointerId: 4, pointerType: touch ? 'touch' : 'mouse', clientX: x, clientY: y, isPrimary: true, button: 0 }
    const coalBefore = s.count('coal')
    window.__lands = []
    if (!touch && s.arm) s.arm()
    canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, buttons: 1 }))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    if (s.voxel(bunk.x, bunk.y, bunk.z) === 26 && s.count('coal') === coalBefore && !touch) {
      if (s.arm) s.arm()
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, buttons: 1 }))
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    }
    const near = []
    for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1], [0, 0, 2], [2, 0, 0], [-2, 0, 0], [0, 2, 0], [0, 0, -2]]) {
      const id = s.voxel(bunk.x + dx, bunk.y + dy, bunk.z + dz)
      if (id) near.push([dx, dy, dz, id])
    }
    if (btn && btn.getAttribute('aria-pressed') === 'true') btn.click()
    return {
      hit,
      bed: s.voxel(bunk.x, bunk.y, bunk.z),
      coal: s.count('coal'),
      coalBefore,
      near,
      lands: window.__lands ? window.__lands.slice(-3) : [],
      panel: (document.getElementById('sheet') || {}).dataset,
    }
  }, touch)
}

async function bedRoundTrip(touch) {
  return page.evaluate(async (touch) => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    const frame = () => new Promise((r) => requestAnimationFrame(r))
    const s = window.__smoke
    const x = 72, y = 16, z = 72
    s.close()
    await sleep(360)
    const crouch = document.getElementById('t-crouch')
    if (crouch && crouch.getAttribute('aria-pressed') === 'true') crouch.click()
    window.__blocks.applyEdit([[x, y, z + 1, 0]])
    s.emptyBag()
    window.__blocks.mode('survival')
    const dist = 2.6
    const eyeX = x + 0.5 - 0.46 - dist
    const eyeY = y + 0.5
    const eyeZ = z + 0.5
    const heading = Math.atan2(1, 0)
    function standAt() {
      try { window.__blocks.noa.setPaused(false) } catch (e) {}
      s.stand(eyeX, eyeY - 1.62, eyeZ, heading, 0)
    }
    standAt()
    const canvas = document.querySelector('#stage canvas')
    let saw = null
    for (let i = 0; i < 10; i++) {
      standAt()
      await frame()
      const r = canvas.getBoundingClientRect()
      saw = s.hit(r.left + r.width / 2, r.top + r.height / 2)
      const aim = s.aim()
      if (saw && saw.id === 26 && (touch || (aim && aim.id === 26))) break
    }
    const r = canvas.getBoundingClientRect()
    const common = { bubbles: true, cancelable: true, pointerId: 5, pointerType: touch ? 'touch' : 'mouse', clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, isPrimary: true, button: 0 }
    if (!touch && s.arm) s.arm()
    canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, buttons: 1 }))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    let open = document.getElementById('sheet')
    if (!open || open.hidden) {
      if (!touch && s.arm) s.arm()
      canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, buttons: 1 }))
      canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    }
    const word = s.word('pickup')
    const btn = [...document.querySelectorAll('#sheet button, #sheet-body button')].find((b) => (b.textContent || '').includes(word))
    if (btn) btn.click()
    await sleep(50)
    const queued = s.beds()
    const gone = s.voxel(x, y, z)
    const placed = s.placeBunk(x, y, z)
    s.emptyBag()
    s.fillBag('stone', 15 * 64)
    const stone = s.count('stone')
    s.setMeta(x + ',' + y + ',' + z, placed && placed.meta ? placed.meta : { kind: 'bunk', stars: 3, restAt: 1893456000000, tone: 'warm', fabric: 'woolRed', pattern: 'stripe' })
    if (s.voxel(x, y, z) !== 26) window.__blocks.applyEdit([[x, y, z, 26]])
    s.close()
    await sleep(360)
    standAt()
    await frame()
    if (!touch && s.arm) s.arm()
    canvas.dispatchEvent(new PointerEvent('pointerdown', { ...common, buttons: 1 }))
    canvas.dispatchEvent(new PointerEvent('pointerup', { ...common, buttons: 0 }))
    const btn2 = [...document.querySelectorAll('#sheet button, #sheet-body button')].find((b) => (b.textContent || '').includes(word))
    if (btn2) btn2.click()
    await sleep(40)
    const orphanKey = '90,16,90'
    s.setMeta(orphanKey, { kind: 'bunk', stars: 3, restAt: 1893456000000, tone: 'warm', fabric: 'woolRed', pattern: 'stripe' })
    const recovered = s.recover()
    return {
      found: !!btn,
      saw,
      sheet: ((document.getElementById('sheet') || {}).innerText || '').slice(0, 120),
      hidden: !!(document.getElementById('sheet') || {}).hidden,
      gone,
      queued,
      placed,
      stone,
      fullGone: s.voxel(x, y, z),
      lost: s.lost(),
      beds: s.beds(),
      bunk: s.count('bunk'),
      recovered,
      orphan: s.bed(orphanKey),
      toast: s.toast(),
    }
  }, touch)
}

let failed = false
try {
  for (const view of [{ name: 'touch', w: 915, h: 412, touch: true }, { name: 'mouse', w: 1366, h: 768, touch: false }]) {
    await boot(view.w, view.h, view.touch)
    const built = await buildWorld()
    if (!note(view.name + ' world', built.world === 26 && built.voxel === 26 && built.version === '2.5.128', JSON.stringify(built))) {
      failed = true
      break
    }
    const pieces = ONLY ? layout.pieces.filter((p) => ONLY.split(',').includes(p.kind)) : layout.pieces
    if (process.env.TAP_MATRIX !== '0') for (const hold of HOLDS) {
      for (const piece of pieces) {
        const cell = expectCell(piece, [0, 0, 1])
        const got = await tapPiece(piece, hold, view.touch)
        const bad = []
        if (got.after.coal !== got.before.coal) bad.push('coal ' + got.before.coal + '->' + got.after.coal)
        if (got.after.bread !== got.before.bread) bad.push('bread ' + got.before.bread + '->' + got.after.bread)
        if (got.after.saw !== got.before.saw) bad.push('saw ' + got.before.saw + '->' + got.after.saw)
        if (got.voxel !== IDS[piece.kind]) bad.push('voxel ' + got.voxel)
        if (piece.kind === 'woodshop' && got.side !== 70) bad.push('side ' + got.side)
        if (piece.kind === 'bunk' && (!got.meta || got.meta.stars !== 3 || got.meta.restAt !== 1893456000000)) bad.push('bed meta ' + JSON.stringify(got.meta))
        if (piece.kind === 'box' && (!got.meta || got.meta.kind !== 'box' || !got.meta.slots || got.meta.slots.length !== 18)) bad.push('box meta')
        if (piece.kind === 'vend' && (!got.meta || got.meta.kind !== 'vend')) bad.push('vend meta')
        if (piece.kind === 'woodshop' && (!got.meta || got.meta.kind !== 'woodshop')) bad.push('shop meta')
        for (const face of got.faces) {
          if (face.miss) { bad.push(face.face + ' missed ' + JSON.stringify(face.hit) + ' aim ' + JSON.stringify(face.aim)); continue }
          face.taps.forEach((tap, i) => {
            if (tap.open !== got.want) bad.push(face.face + '#' + i + ' panel ' + tap.open)
            if (tap.voxel !== IDS[piece.kind]) bad.push(face.face + '#' + i + ' voxel ' + tap.voxel)
            if (tap.coal !== got.before.coal || tap.bread !== got.before.bread || tap.saw !== got.before.saw) bad.push(face.face + '#' + i + ' spent')
          })
          if (face.muted && (face.muted.voxel !== 26 || face.muted.coal !== got.before.coal)) bad.push('mute deleted ' + JSON.stringify(face.muted))
        }
        if (got.faces.length < FACES.length) bad.push('faces ' + got.faces.length)
        const ok = note(view.name + ' ' + hold + ' ' + piece.kind, !bad.length, bad.join('; ') || cell.id)
        if (!ok) {
          failed = true
          await page.screenshot({ path: out + '/fail-' + view.name + '-' + hold + '-' + piece.kind + '.png' })
          writeFileSync(out + '/fail.json', JSON.stringify(got, null, 2))
          break
        }
      }
      if (failed) break
    }
    if (failed) break
    if (!ONLY) {
      const crouch = await crouchPlace(view.touch)
      const beside = (crouch.near || []).some((n) => n[3] === 5)
      const onBed = crouch.bed !== 26
      if (!note(view.name + ' crouch beside', crouch.bed === 26 && beside && crouch.coal === crouch.coalBefore - 1 && !onBed, JSON.stringify(crouch))) {
        failed = true
        writeFileSync(out + '/crouch.json', JSON.stringify(crouch, null, 2))
        break
      }
      const trip = await bedRoundTrip(view.touch)
      const design = (list) => (list || []).some((d) => d.stars === 3 && d.restAt === 1893456000000)
      const replaced = trip.placed && trip.placed.meta && trip.placed.meta.stars === 3 && trip.placed.meta.restAt === 1893456000000 && trip.placed.id === 26
      const lostBunk = (trip.lost || []).some((row) => String(row).startsWith('bunk:'))
      const orphanOk = trip.recovered > 0 && !trip.orphan && design(trip.beds)
      if (!note(view.name + ' 3-star replace', trip.found && trip.gone === 0 && design(trip.queued) && replaced, JSON.stringify({ found: trip.found, gone: trip.gone, hidden: trip.hidden, saw: trip.saw, sheet: trip.sheet, queued: trip.queued, placed: trip.placed && trip.placed.ok }))) failed = true
      if (!note(view.name + ' full bag lost', trip.stone === 15 * 64 && trip.fullGone === 0 && lostBunk && design(trip.beds), JSON.stringify({ stone: trip.stone, fullGone: trip.fullGone, lost: trip.lost, beds: trip.beds, bunk: trip.bunk }))) failed = true
      if (!note(view.name + ' orphan bed', orphanOk, JSON.stringify({ recovered: trip.recovered, orphan: trip.orphan, beds: trip.beds, toast: trip.toast }))) failed = true
      if (failed) {
        writeFileSync(out + '/trip.json', JSON.stringify(trip, null, 2))
        break
      }
    }
    const fps = await page.evaluate(() => window.__smoke.fpsSpan(2500))
    report.fps[view.name] = fps
    note(view.name + ' fps', fps > 0, String(fps))
  }
  // smoke step: open a real Woodshop and assert tool wall + Bed + decor cards
  await page.evaluate(() => {
    const s = window.__smoke
    s.plant(70, 5, 70, 69)
    s.plant(71, 5, 70, 70)
    s.setMeta('70,5,70', { kind: 'woodshop', face: 'N', role: 'anchor', anchor: '70,5,70', pair: '71,5,70' })
    s.stand(72, 7, 70, Math.atan2(-1, 0), 0.2)
  })
  await page.mouse.click(683, 384, { button: 'right' })
  await new Promise((r) => setTimeout(r, 600))
  const shop = await page.evaluate(() => {
    const sheet = document.getElementById('sheet')
    return {
      open: !!(sheet && !sheet.hidden),
      wall: document.querySelectorAll('.wall-slot').length,
      bed: !!document.querySelector('.bed-card'),
      decor: document.querySelectorAll('.decor-card').length,
    }
  })
  // real click on Bed Next
  const nextBox = await page.evaluate(() => {
    const b = document.querySelector('.bed-next')
    if (!b) return null
    const r = b.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  })
  if (nextBox) {
    await page.mouse.click(nextBox.x, nextBox.y)
    await new Promise((r) => setTimeout(r, 300))
  }
  const stepped = await page.evaluate(() => {
    const s = document.querySelector('.bed-step')
    return s ? s.dataset.step : ''
  })
  if (!note('bed next', stepped === 'plan' || stepped === 'measure', stepped || 'no step')) failed = true
  if (!note('woodshop open, shop.open && shop.wall >= 4 && shop.bed && shop.decor >= 3 && errors.filter((e) => e.startsWith('page:')).length === 0, JSON.stringify(shop))) failed = true
  const noise = errors.filter((e) => !/favicon|net::ERR_FILE|Download the React DevTools/i.test(e))
  report.errors = noise
  if (!note('console', noise.length === 0, noise.slice(0, 6).join(' | '))) failed = true
} finally {
  writeFileSync(out + '/report.json', JSON.stringify(report, null, 2))
  await browser.close()
}
if (failed || report.fail) {
  console.error('furniture-tap-check failed at ' + report.fail)
  process.exit(1)
}
console.log('furniture-tap-check ok', JSON.stringify(report.fps))
