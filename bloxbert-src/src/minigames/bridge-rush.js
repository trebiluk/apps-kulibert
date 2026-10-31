// Bridge Rush (PROTO). A 12-block gap between two stone cliffs with water below. The kid builds a deck across
// from a 40-block budget (Wood = 1, Steel = 2), then presses Test: a cart with 3 load units rolls left to right.
// A block holds its own load plus half of each deck neighbour; a block with air on one side holds only half
// (a cantilever). Wood holds 2, Steel holds 5, so a lone wood stub breaks and a full wood span holds.
// Score = cells crossed (0-12), tiebreak fewer blocks. Records: top 3, localStorage only.
// Grey boxes: Wood is planks (10), Steel is grey brick (9), the cart is a plain box mesh. No new art.
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { GAP, BUDGET, CART_LOAD, MATS, runCart, stars, better, insertRecord, blocksCost } from './bridge-rules.js'
export { GAP, BUDGET, CART_LOAD, MATS, capacityAt, runCart, stars, better, insertRecord, blocksCost } from './bridge-rules.js'

const STONE = 3
const WATER = 64
const REC_KEY = 'bt-bridge-records-v1'
const CART_SPEED = 2.2 // cells per second
const BREAK_MS = 450

export function createBridgeRush(api) {
  // api: getVoxel, edit, playerPos, scene, noa, t, toast, alias(), say(text) for the calm banner
  const t = (k, fb) => (api.t && api.t(k)) || fb
  let origin = null // [ox, oy, oz]: left cliff top-left; deck row y = oy + 1; cart lane z = oz
  let mat = 'wood'
  let row = Array.from({ length: GAP }, () => '')
  let spent = 0
  let lost = 0 // budget spent on blocks the cart broke: not refunded (G7 says nothing about a refund); Clear starts over
  let cart = null
  let run = null // { x (cells, float), falling, vy, result, since }
  let inside = false
  let hud = null
  let best = null
  let records = []
  try { records = JSON.parse(localStorage.getItem(REC_KEY) || '[]') || [] } catch (e) { records = [] }
  if (records.length) best = records[0]
  let lastCrack = null

  function cellX(i) { return origin[0] + 4 + i }
  function deckY() { return origin[1] + 1 }
  function inGap(x, y, z) {
    if (!origin) return false
    return y === deckY() && z === origin[2] && x >= cellX(0) && x <= cellX(GAP - 1)
  }
  function inArena(p) {
    if (!origin || !p) return false
    return p[0] >= origin[0] - 2 && p[0] <= origin[0] + 22 && p[2] >= origin[2] - 5 && p[2] <= origin[2] + 5 && p[1] >= origin[1] - 4 && p[1] <= origin[1] + 8
  }

  // World: two cliffs, a 12-wide gap, water two deep under it. Stone only.
  function setOrigin(o) { origin = [o[0] | 0, o[1] | 0, o[2] | 0]; readRow() }
  function place(o) {
    origin = [o[0] | 0, o[1] | 0, o[2] | 0]
    const [ox, oy, oz] = origin
    for (let x = -1; x <= 21; x++) for (let z = -3; z <= 3; z++) {
      const X = ox + x
      const Z = oz + z
      const cliff = x <= 3 || x >= 16
      for (let y = -4; y <= 6; y++) {
        const Y = oy + y
        let v = 0
        if (y === -4) v = STONE // floor of the pool
        else if (cliff && y <= 1) v = STONE
        else if (!cliff && y <= -2 && Math.abs(z) <= 2) v = WATER
        else if (!cliff && y <= -2) v = STONE // pool walls
        api.edit(X, Y, Z, v)
      }
    }
    // rails: a stone lip on both sides of the cart lane so the lane reads at a glance
    for (let x = 4; x <= 15; x++) { api.edit(ox + x, oy, oz - 3, STONE); api.edit(ox + x, oy, oz + 3, STONE) }
    readRow()
  }
  function readRow() {
    for (let i = 0; i < GAP; i++) {
      const v = api.getVoxel(cellX(i), deckY(), origin[2])
      row[i] = v === MATS.wood.id ? 'wood' : v === MATS.steel.id ? 'steel' : ''
    }
    spent = blocksCost(row) + lost
  }

  // Placement inside the gap comes from the budget, not the bag.
  function tryPlace(cell) {
    if (!inside || !cell) return false
    const [x, y, z] = cell
    if (!inGap(x, y, z)) {
      if (inBox(x, y, z)) { api.toast(t('brDeckOnly', 'Build on the bridge row')); return true }
      return false
    }
    const m = MATS[mat]
    if (spent + m.cost > BUDGET) { api.toast(t('brNoBudget', 'No blocks left')); return true }
    if (api.getVoxel(x, y, z)) return true
    api.edit(x, y, z, m.id)
    readRow()
    paint()
    return true
  }
  function tryBreak(x, y, z) {
    if (!inside) return false
    if (!inGap(x, y, z)) return inBox(x, y, z) // the arena itself cannot be dug up
    if (!api.getVoxel(x, y, z)) return true
    api.edit(x, y, z, 0)
    readRow()
    paint()
    return true
  }
  function landing(aimed) { // the cell a placement would land in
    if (!aimed || !aimed.position) return null
    const p = aimed.position
    // Aiming anywhere down the gap column (water, pool wall, pool floor) builds the deck cell above it: a kid on
    // the cliff looks down at the gap and taps; no need to find a side face.
    if (origin && p[2] === origin[2] && p[0] >= cellX(0) && p[0] <= cellX(GAP - 1) && p[1] < deckY()) return [p[0], deckY(), p[2]]
    // Aiming at the cliff-top cell right at the edge extends the deck from that edge.
    if (origin && p[2] === origin[2] && p[1] === deckY() && (p[0] === cellX(0) - 1 || p[0] === cellX(GAP))) return [p[0] === cellX(0) - 1 ? cellX(0) : cellX(GAP - 1), deckY(), p[2]]
    const n = aimed.normal || [0, 1, 0]
    // Aiming at the top of a deck block extends the deck: the next empty cell toward the far cliff, else the near one.
    if (inGap(p[0], p[1], p[2]) && n[1] === 1) {
      const i = p[0] - cellX(0)
      for (let j = i + 1; j < GAP; j++) if (!row[j]) return [cellX(j), deckY(), origin[2]]
      for (let j = i - 1; j >= 0; j--) if (!row[j]) return [cellX(j), deckY(), origin[2]]
      return [p[0], deckY(), p[2]] // full: tryPlace sees it is taken and does nothing
    }
    return [p[0] + n[0], p[1] + n[1], p[2] + n[2]]
  }
  // Inside the arena box, only the deck row takes blocks; anything else is refused with a word, so the pool and the
  // cliffs stay as built.
  function inBox(x, y, z) {
    return origin && x >= origin[0] - 1 && x <= origin[0] + 21 && z >= origin[2] - 3 && z <= origin[2] + 3 && y >= origin[1] - 4 && y <= origin[1] + 6
  }

  // Cart
  function ensureCart() {
    if (cart) return
    cart = CreateBox('bridge-cart', { width: 0.9, height: 0.6, depth: 0.7 }, api.scene)
    const m = new StandardMaterial('bridge-cart-m', api.scene)
    m.diffuseColor = new Color3(0.55, 0.58, 0.62)
    m.emissiveColor = new Color3(0.18, 0.19, 0.21)
    m.specularColor = new Color3(0, 0, 0)
    cart.material = m
    cart.isPickable = false
    cart.setEnabled(false)
    api.noa.rendering.addMeshToScene(cart, false)
  }
  function test() {
    if (!inside || run) return
    ensureCart()
    readRow()
    const result = runCart(row)
    run = { x: -1.5, falling: false, vy: 0, result, since: performance.now(), done: false, crackAt: 0, blocks: spent } // blocks counted before anything breaks
    clearCrack()
    cart.setEnabled(true)
    paint()
  }
  function retry() { if (run) return; test() }
  function clear() {
    if (run) return
    if (!confirm(t('brClearAsk', 'Clear the whole bridge?'))) return
    for (let i = 0; i < GAP; i++) if (row[i]) api.edit(cellX(i), deckY(), origin[2], 0)
    lost = 0
    readRow()
    clearCrack()
    paint()
  }
  function clearCrack() {
    if (!lastCrack) return
    const el = document.getElementById('bridge-crack')
    if (el) el.hidden = true
    lastCrack = null
  }
  function showCrack(i) {
    lastCrack = i
    let el = document.getElementById('bridge-crack')
    if (!el) {
      el = document.createElement('div')
      el.id = 'bridge-crack'
      el.setAttribute('role', 'status')
      el.setAttribute('aria-live', 'assertive')
      document.body.append(el)
    }
    el.innerHTML = '<span class="br-crack" aria-hidden="true">╳╳</span><span class="br-warn" aria-hidden="true">⚠</span><span class="br-word"></span>'
    el.querySelector('.br-word').textContent = t('brTooMuch', 'too much load')
    el.hidden = false
  }
  function update(dt) {
    const p = api.playerPos()
    const now = inArena(p)
    if (now !== inside) { inside = now; if (inside) { readRow(); mountHud(); showSign() } else { unmountHud() } }
    if (!run || !cart) return
    const r = run
    const step = (dt || 16) / 1000
    if (!r.falling) {
      r.x += CART_SPEED * step
      const cell = Math.floor(r.x)
      // breaking block: stop on it, show the crack, then it goes
      if (r.result.broke >= 0 && cell >= r.result.broke) {
        if (!r.crackAt) { r.crackAt = performance.now(); showCrack(r.result.broke); r.x = r.result.broke + 0.5 }
        if (performance.now() - r.crackAt >= BREAK_MS) {
          lost += MATS[row[r.result.broke]] ? MATS[row[r.result.broke]].cost : 0
          api.edit(cellX(r.result.broke), deckY(), origin[2], 0)
          readRow()
          r.falling = true
        }
      } else if (r.result.broke < 0 && cell >= r.result.distance && r.result.distance < GAP) {
        r.falling = true // off the end of a stub
      } else if (r.x >= GAP + 1.5) {
        finish(r)
      }
    } else {
      r.vy -= 9.8 * step
      cart.position.y += r.vy * step
      if (cart.position.y < localY(deckY() - 3)) finish(r)
    }
    if (!r.done) {
      const lp = api.noa.globalToLocal([cellX(0) + r.x, deckY() + 0.8, origin[2] + 0.5], null, [0, 0, 0])
      if (!r.falling) cart.position.set(lp[0], lp[1], lp[2])
      else { cart.position.x = lp[0]; cart.position.z = lp[2] }
    }
  }
  function localY(y) { return api.noa.globalToLocal([0, y, 0], null, [0, 0, 0])[1] }
  function finish(r) {
    if (r.done) return
    r.done = true
    cart.setEnabled(false)
    const blocks = r.blocks
    const distance = r.result.distance
    const st = stars(distance, blocks)
    const rec = { alias: String((api.alias && api.alias()) || t('c3You', 'You')).slice(0, 24), distance, blocks, at: Date.now() }
    const isBest = better(rec, best)
    records = insertRecord(records, rec)
    try { localStorage.setItem(REC_KEY, JSON.stringify(records)) } catch (e) {}
    if (isBest) {
      best = rec
      api.say(t('brNewBest', 'new best: {d} tiles, {b} blocks').replace('{d}', String(distance)).replace('{b}', String(blocks)))
    } else {
      api.toast(t('brResult', 'Crossed {d} of 12').replace('{d}', String(distance)) + (st ? ' ' + '⭐'.repeat(st) : ''))
    }
    run = null
    paint()
  }

  // HUD: build bar + Test/Retry/Clear + records board. DOM, keyboard and touch.
  function btn(id, icon, word, onClick) {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'br-btn'
    b.id = id
    b.innerHTML = '<span class="br-ico" aria-hidden="true"></span><span class="br-lab"></span>'
    b.querySelector('.br-ico').textContent = icon
    b.querySelector('.br-lab').textContent = word
    b.addEventListener('click', onClick)
    return b
  }
  function mountHud() {
    if (hud) return
    hud = document.createElement('div')
    hud.id = 'bridge-hud'
    hud.setAttribute('role', 'region')
    hud.setAttribute('aria-label', t('brTitle', 'Bridge Rush'))
    const wood = btn('br-wood', '🪵', t('brWood', 'Wood'), () => { mat = 'wood'; paint() })
    const steel = btn('br-steel', '🔩', t('brSteel', 'Steel'), () => { mat = 'steel'; paint() })
    const left = document.createElement('div')
    left.id = 'br-left'
    left.setAttribute('role', 'status')
    const testB = btn('br-test', '▶', t('brTest', 'Test'), test)
    const retryB = btn('br-retry', '↻', t('brRetry', 'Retry'), retry)
    const clearB = btn('br-clear', '🗑', t('brClear', 'Clear'), clear)
    const board = document.createElement('div')
    board.id = 'br-board'
    hud.append(wood, steel, left, testB, retryB, clearB, board)
    document.body.append(hud)
    paint()
  }
  function unmountHud() {
    if (hud) hud.remove()
    hud = null
    const sign = document.getElementById('bridge-sign')
    if (sign) sign.hidden = true
    clearCrack()
  }
  function paint() {
    if (!hud) return
    for (const k of ['wood', 'steel']) {
      const b = hud.querySelector('#br-' + k)
      const on = mat === k
      b.classList.toggle('on', on)
      b.setAttribute('aria-pressed', String(on))
      b.querySelector('.br-lab').textContent = t('br' + (k === 'wood' ? 'Wood' : 'Steel'), k === 'wood' ? 'Wood' : 'Steel') + ' ×' + MATS[k].cost
    }
    hud.querySelector('#br-left').textContent = t('brLeft', 'blocks left: {n}').replace('{n}', String(BUDGET - spent))
    hud.querySelector('#br-test').disabled = !!run
    hud.querySelector('#br-retry').disabled = !!run
    hud.querySelector('#br-clear').disabled = !!run || spent === 0
    const board = hud.querySelector('#br-board')
    board.innerHTML = ''
    const h = document.createElement('div')
    h.className = 'br-head'
    h.textContent = '🏆 ' + t('brRecords', 'Records')
    board.append(h)
    if (!records.length) {
      const e = document.createElement('div'); e.className = 'br-row'; e.textContent = t('brNoRecords', 'no runs yet'); board.append(e)
    }
    records.forEach((r, i) => {
      const line = document.createElement('div')
      line.className = 'br-row'
      line.textContent = (i + 1) + '. ' + r.alias + ' · ' + r.distance + '/12 · ' + r.blocks + ' ' + t('brBlocks', 'blocks') + (stars(r.distance, r.blocks) ? ' ' + '⭐'.repeat(stars(r.distance, r.blocks)) : '')
      board.append(line)
    })
  }
  function showSign() {
    let sign = document.getElementById('bridge-sign')
    if (!sign) {
      sign = document.createElement('div')
      sign.id = 'bridge-sign'
      sign.setAttribute('role', 'note')
      sign.innerHTML = '<span class="br-ico" aria-hidden="true">🌉</span><span class="br-word"></span>'
      document.body.append(sign)
    }
    sign.querySelector('.br-word').textContent = t('brSign', 'Bridge Rush: build across, then Test')
    sign.hidden = false
    clearTimeout(showSign.t)
    showSign.t = setTimeout(() => { sign.hidden = true }, 6000)
  }
  function onKey(e) {
    if (!inside || !hud) return false
    if (e.key === 't' || e.key === 'T') { test(); return true }
    if (e.key === 'r' || e.key === 'R') { retry(); return true }
    if (e.key === '1') { mat = 'wood'; paint(); return true }
    if (e.key === '2') { mat = 'steel'; paint(); return true }
    return false
  }

  return {
    place, setOrigin, update, tryPlace, tryBreak, landing, onKey, test, retry, clear,
    inside: () => inside,
    origin: () => (origin ? origin.slice() : null),
    state: () => ({ inside, mat, spent, left: BUDGET - spent, row: row.slice(), running: !!run, records: records.slice(), best }),
    setMat: (k) => { if (MATS[k]) { mat = k; paint() } },
  }
}
