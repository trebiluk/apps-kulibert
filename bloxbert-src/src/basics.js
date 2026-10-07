// Doors, levers, buttons, day clock, lanterns. World field `basics` on the save.
import { isDoor, doorKind, group, touchingDoors, closedId, openId, isOpenDoor, LEVER, BUTTON, LANTERN, CHARGER, FABRICATOR, countSpaced } from './doors.js'
import { skyK, phaseName, LEVELS, lanternRadius, DRAIN, CHARGE_SUN, CHARGE_PLUG, DAY, DUSK } from './day.js'

const PREF = 'bloxbert-day'
export function createBasics(api) {
  let ms = 0
  let anchor = 0
  let lastT = 0
  let always = false
  let bright = false
  let actor = 'you'
  let arena = false
  let starter = false
  let teacherStub = false
  const locks = new Map()
  const autos = new Set()
  const timers = []
  const lights = new Map()
  const saplings = new Map()
  const badges = new Set()
  let card = ''
  let cardN = 0
  function now() { return ms + (api.now() - anchor) }
  function teacher() { return !!(teacherStub || (api.teacher && api.teacher())) }
  function prefSave() {
    try { localStorage.setItem(PREF, JSON.stringify({ always, bright })) } catch (e) {}
  }
  function prefLoad(survival) {
    try {
      const raw = JSON.parse(localStorage.getItem(PREF) || 'null')
      if (raw && typeof raw.always === 'boolean') { always = raw.always; bright = !!raw.bright; return }
    } catch (e) {}
    always = !survival
    bright = false
  }
  function key(x, y, z) { return x + ',' + y + ',' + z }
  function lockOf(cells) {
    for (const [x, y, z] of cells) {
      const hit = locks.get(key(x, y, z))
      if (hit) return hit
    }
    return null
  }
  function setAll(cells, id) {
    for (const [x, y, z] of cells) api.set(x, y, z, id)
  }
  function arm(cells, delay, close) {
    const at = now() + delay
    timers.push({ at, cells: cells.map(([x, y, z]) => [x, y, z]), close })
  }
  function canOpen(cells) {
    if (arena) return true
    const lock = lockOf(cells)
    if (!lock) return true
    if (teacher()) return true
    if (lock.owner === actor) return true
    api.toast(api.t('doorLocked'))
    return false
  }
  function toggleDoor(x, y, z, how) {
    const id = api.get(x, y, z)
    if (!isDoor(id)) return false
    const cells = group(x, y, z, api.get)
    const kind = doorKind(id)
    if (!canOpen(cells)) return true
    if (kind === 'metal' && how === 'tap') { api.toast(api.t('needsButton')); return true }
    const opening = cells.some((c) => !isOpenDoor(c[3]))
    const next = opening ? openId(id) : closedId(id)
    setAll(cells, next)
    const auto = cells.some((c) => autos.has(key(c[0], c[1], c[2])))
    if (opening && (kind === 'slide' || auto)) arm(cells, 3000, true)
    return true
  }
  function powerDoors(x, y, z, on, holdMs) {
    const seen = new Set()
    for (const hit of touchingDoors(x, y, z, api.get)) {
      const cells = group(hit[0], hit[1], hit[2], api.get)
      const stamp = cells.map((c) => key(c[0], c[1], c[2])).join('|')
      if (seen.has(stamp)) continue
      seen.add(stamp)
      if (!canOpen(cells)) continue
      const id = cells[0][3]
      if (on) {
        setAll(cells, openId(id))
        if (holdMs) arm(cells, holdMs, true)
      } else setAll(cells, closedId(id))
    }
  }
  function placeColumn(x, y, z, id) {
    api.set(x, y, z, id)
    if (!api.get(x, y + 1, z)) api.set(x, y + 1, z, id)
  }
  function click() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return
      if (!click.ctx) click.ctx = new AC()
      const ctx = click.ctx
      if (ctx.state === 'suspended') ctx.resume()
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'square'
      o.frequency.value = 740
      const t0 = ctx.currentTime
      g.gain.setValueAtTime(0.06, t0)
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.05)
      o.connect(g)
      g.connect(ctx.destination)
      o.start(t0)
      o.stop(t0 + 0.06)
    } catch (e) {}
  }
  function use(x, y, z) {
    const id = api.get(x, y, z)
    if (isDoor(id)) { click(); return toggleDoor(x, y, z, 'tap') }
    if (id === LEVER.off || id === LEVER.on) {
      click()
      const on = id === LEVER.off
      api.set(x, y, z, on ? LEVER.on : LEVER.off)
      powerDoors(x, y, z, on, 0)
      return true
    }
    if (id === BUTTON.off || id === BUTTON.on) {
      click()
      api.set(x, y, z, BUTTON.on)
      powerDoors(x, y, z, true, 1500)
      timers.push({ at: now() + 1500, cells: [[x, y, z]], button: true })
      return true
    }
    if (id === LANTERN) {
      const st = lights.get(key(x, y, z)) || { step: 0, charge: 1 }
      st.step = (st.step % 3) + 1
      lights.set(key(x, y, z), st)
      api.toast(api.t(st.step === 1 ? 'lanternLow' : st.step === 2 ? 'lanternMed' : 'lanternHigh'))
      return true
    }
    return false
  }
  function noteBlock(x, y, z, id) {
    if (id === LANTERN && !lights.has(key(x, y, z))) lights.set(key(x, y, z), { step: 0, charge: 1 })
    if (id === 185) saplings.set(key(x, y, z), { at: now() })
    if (id === FABRICATOR && api.survival() && !starter) {
      starter = true
      api.gift('batteryCell', 1)
      api.gift('charger', 1)
      api.card(api.t('starterKit'))
    }
  }
  function neighborsHave(x, y, z, id) {
    return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([dx, dy, dz]) => api.get(x + dx, y + dy, z + dz) === id)
  }
  function applyLights(dt) {
    const day = always || phaseName(now(), false) === 'day'
    const creative = !api.survival()
    for (const [k, st] of lights) {
      if (creative) { st.charge = 1; continue }
      const [x, y, z] = k.split(',').map(Number)
      if (api.get(x, y, z) !== LANTERN) { lights.delete(k); continue }
      if (!(dt > 0)) continue
      const level = LEVELS[(st.step || 1) - 1] || 'low'
      const plugged = neighborsHave(x, y, z, CHARGER)
      if (plugged) st.charge += dt / CHARGE_PLUG
      else if (day) st.charge += dt / CHARGE_SUN
      else if (st.step > 0) st.charge -= dt / DRAIN[level]
      if (st.charge < 0) st.charge = 0
      if (st.charge > 1) st.charge = 1
    }
  }
  function spaceClear(x, y, z) {
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let dy = 0; dy <= 6; dy++) {
      const id = api.get(x + dx, y + dy, z + dz)
      if (!id) continue
      if (dx === 0 && dy === 0 && dz === 0 && id === 185) continue
      return false
    }
    return true
  }
  function growTree(x, y, z) {
    for (let dy = 0; dy <= 3; dy++) api.set(x, y + dy, z, 11)
    const top = y + 3
    for (let dy = -1; dy <= 1; dy++) for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) + Math.abs(dz) + Math.abs(dy) > 3) continue
      if (dx === 0 && dz === 0 && dy <= 0) continue
      api.set(x + dx, top + dy, z + dz, 12)
    }
  }
  function growSaplings() {
    const t = now()
    for (const [k, st] of saplings) {
      const [x, y, z] = k.split(',').map(Number)
      if (api.get(x, y, z) !== 185) { saplings.delete(k); continue }
      if (t < (st.at || 0) + 8 * 60 * 1000) continue
      if (!spaceClear(x, y, z)) continue
      growTree(x, y, z)
      saplings.delete(k)
    }
  }
  function flush() {
    growSaplings()
    const t = now()
    for (let i = timers.length - 1; i >= 0; i--) {
      const job = timers[i]
      if (t < job.at) continue
      timers.splice(i, 1)
      if (job.button) api.set(job.cells[0][0], job.cells[0][1], job.cells[0][2], BUTTON.off)
      else if (job.close) {
        for (const [x, y, z] of job.cells) {
          const id = api.get(x, y, z)
          if (isDoor(id)) api.set(x, y, z, closedId(id))
        }
      }
    }
    considerBadges()
  }
  function tick() {
    const t = now()
    const dt = lastT ? Math.max(0, t - lastT) : 0
    lastT = t
    applyLights(dt)
    flush()
  }
  function litPoints() {
    if (always || phaseName(now(), false) !== 'night') return []
    const pts = []
    for (const [k, st] of lights) {
      if (!(st.charge > 0) || !(st.step > 0)) continue
      const [x, y, z] = k.split(',').map(Number)
      if (api.get(x, y, z) === LANTERN) pts.push({ x, y, z })
    }
    return pts
  }
  function considerBadges() {
    const n = countSpaced(litPoints(), 3)
    for (const tier of [10, 50, 200]) {
      if (n >= tier && !badges.has(tier)) {
        badges.add(tier)
        card = api.t('lightUp') + ' ' + tier
        cardN += 1
        api.badge(card)
      }
    }
    return n
  }
  function levelName(st) {
    if (!st || !st.step) return 'low'
    return LEVELS[st.step - 1] || 'low'
  }
  return {
    boot(survival) { anchor = api.now(); lastT = 0; prefLoad(survival); api.flagDay(always) },
    setAlways(on) { always = !!on; prefSave(); api.flagDay(always) },
    setBright(on) { bright = !!on; prefSave() },
    get always() { return always },
    get bright() { return bright },
    lum() { return skyK(now(), always, bright) },
    phase() { return phaseName(now(), always) },
    clock(n) { ms += n; applyLights(n); lastT = now(); flush() },
    seek(n) { ms = n; anchor = api.now(); lastT = now() },
    actor(id) { actor = id || 'you' },
    teacherStub(on) { teacherStub = !!on },
    arena(on) { arena = !!on },
    use, placeColumn, noteBlock, tick, isDoor,
    blocksBreak(id) { return api.survival() && isDoor(id) },
    lock(x, y, z, owner) { locks.set(key(x, y, z), { owner: owner || actor || 'you' }) },
    auto(x, y, z, on) {
      const cells = group(x, y, z, api.get)
      for (const c of cells) {
        const k = key(c[0], c[1], c[2])
        if (on) autos.add(k)
        else autos.delete(k)
      }
    },
    pickup(x, y, z) {
      const id = api.get(x, y, z)
      if (!isDoor(id)) return 0
      const cells = group(x, y, z, api.get)
      const cols = new Set(cells.map((c) => c[0] + ',' + c[2]))
      for (const c of cells) {
        api.set(c[0], c[1], c[2], 0)
        locks.delete(key(c[0], c[1], c[2]))
        autos.delete(key(c[0], c[1], c[2]))
      }
      const item = id === 30 || id === 31 ? 'door' : id === 32 || id === 33 ? 'doorGlass' : id === 34 || id === 35 ? 'doorMetal' : 'doorSliding'
      api.give(item, cols.size)
      return cols.size
    },
    light(x, y, z) {
      const st = lights.get(key(x, y, z))
      if (!st) return null
      const level = levelName(st)
      return { level, step: st.step, charge: st.charge, radius: lanternRadius(st.step ? level : 'empty', st.charge) }
    },
    setCharge(x, y, z, c) {
      const st = lights.get(key(x, y, z))
      if (st) st.charge = Math.max(0, Math.min(1, c))
    },
    lights() {
      const out = []
      for (const [k, st] of lights) {
        const [x, y, z] = k.split(',').map(Number)
        if (api.get(x, y, z) !== LANTERN) continue
        const level = levelName(st)
        const radius = lanternRadius(st.step ? level : 'empty', st.charge)
        out.push({ x, y, z, level, step: st.step, charge: st.charge, radius })
      }
      return out.sort((a, b) => b.radius - a.radius)
    },
    saw(x, y, z, id) { noteBlock(x, y, z, id) },
    badgeCount() { return cardN },
    badgeText() { return card },
    resetBadges() { badges.clear(); card = ''; cardN = 0 },
    nightAt() { return DAY + DUSK + 1000 },
    dump() {
      return {
        ms: now(), always, bright, starter, actor,
        locks: [...locks], autos: [...autos],
        lights: [...lights], badges: [...badges], saplings: [...saplings],
      }
    },
    load(doc) {
      if (!doc) return
      ms = doc.ms || 0
      anchor = api.now()
      lastT = now()
      if (typeof doc.always === 'boolean') always = doc.always
      bright = !!doc.bright
      starter = !!doc.starter
      if (doc.actor) actor = doc.actor
      locks.clear(); for (const [k, v] of doc.locks || []) locks.set(k, v)
      autos.clear(); for (const k of doc.autos || []) autos.add(k)
      lights.clear(); for (const [k, v] of doc.lights || []) lights.set(k, v)
      saplings.clear(); for (const [k, v] of doc.saplings || []) if (v && typeof v.at === 'number') saplings.set(k, { at: v.at })
      badges.clear(); for (const n of doc.badges || []) badges.add(n)
      cardN = badges.size
      api.flagDay(always)
      prefSave()
    },
  }
}
