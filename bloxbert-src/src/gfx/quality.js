// Auto / Lite / Full. Auto steps resolution before it blurs past 1.5, then steps back up.
// Draw distance stays on the solid disk. noa keeps a chunk when i²+k² <= add²,
// so add 1 drops the diagonal (1,1) and that face can sit a block in front of
// the camera, inside the fog. √2 loads the same chunks as 1.5, so a shorter
// add does not save a single chunk without opening a hole.
const QKEY = 'bloxbert-quality'
const AUTO_KEY = 'bloxbert-quality-auto'
const RES_MAX = 1.5
const RES_STEP = 0.25
const SOLID_ADD = [1.5, 1]
const SOLID_REM = [2.5, 2]

export const QP = {
  auto: { aa: false, add: [1.5, 1], rem: [2.5, 2] },
  lite: { aa: false, scale: 1.75, add: [1.5, 1], rem: [2.5, 2] },
  full: { aa: true, scale: 1, add: [2, 1.5], rem: [3, 2.5] },
}

const NAMES = { auto: 'Auto', lite: 'Lite', full: 'Full' }

function roundStep(n) {
  return Math.round(n * 100) / 100
}

export function fogFor(addH) {
  const end = addH * 24 - 4
  return { start: end * 0.6, end }
}

function buildSteps(start) {
  const steps = [{ add: SOLID_ADD.slice(), rem: SOLID_REM.slice(), level: start }]
  let lv = start
  while (lv + RES_STEP <= RES_MAX + 1e-6) {
    lv = roundStep(lv + RES_STEP)
    steps.push({ add: SOLID_ADD.slice(), rem: SOLID_REM.slice(), level: lv })
  }
  return steps
}

function readSavedStep() {
  try {
    const raw = JSON.parse(localStorage.getItem(AUTO_KEY) || 'null')
    if (!raw || !Number.isFinite(raw.level)) return null
    if (raw.add !== 1 && raw.add !== 1.5) return null
    return { level: raw.level, add: raw.add }
  } catch (e) {
    return null
  }
}

export function createQuality() {
  const qs = new URLSearchParams(location.search)
  const big = innerWidth * innerHeight > 1366 * 768 * 1.15
  const pinned = qs.has('scale')
  const autoOff = qs.get('auto') === '0'
  let stored = null
  try { stored = localStorage.getItem(QKEY) } catch (e) {}
  let quality = QP[qs.get('q')] ? qs.get('q') : QP[stored] ? stored : 'auto'
  const aa = QP[quality].aa
  const startLevel = big ? 1.5 : 1
  const steps = buildSteps(startLevel)
  let step = 0
  let level = pinned ? 1 / Math.max(0.5, Math.min(1, +qs.get('scale') || 1)) : (QP[quality].scale || startLevel)
  let add = QP[quality].add.slice()
  let rem = QP[quality].rem.slice()
  let auto = quality === 'auto' && !pinned && !autoOff
  let lowSecs = 0
  let highSecs = 0
  let told = false
  let scene = null

  function remember() {
    try {
      localStorage.setItem(AUTO_KEY, JSON.stringify({ level, add: add[0] }))
    } catch (e) {}
  }

  function matchSaved(saved) {
    if (!saved) return 0
    const lv = Math.max(startLevel, Math.min(RES_MAX, saved.level))
    let best = 0
    let score = Infinity
    for (let i = 0; i < steps.length; i++) {
      const d = Math.abs(steps[i].level - lv)
      if (d < score) { score = d; best = i }
    }
    return best
  }

  function useStep(i) {
    step = Math.max(0, Math.min(steps.length - 1, i))
    const row = steps[step]
    level = row.level
    add = row.add.slice()
    rem = row.rem.slice()
  }

  if (auto) useStep(matchSaved(readSavedStep()))

  function applyFog(next) {
    if (next) scene = next
    if (!scene) return
    const fog = fogFor(add[0])
    scene.fogStart = fog.start
    scene.fogEnd = fog.end
  }

  function tick(fps) {
    if (!auto) return null
    if (fps < 30) {
      highSecs = 0
      lowSecs += 1
      if (lowSecs >= 3 && step < steps.length - 1) {
        lowSecs = 0
        useStep(step + 1)
        remember()
        const toast = !told
        told = true
        return { dir: 'down', toast }
      }
    } else if (fps > 50) {
      lowSecs = 0
      highSecs += 1
      if (highSecs >= 10 && step > 0) {
        highSecs = 0
        useStep(step - 1)
        remember()
        return { dir: 'up', toast: false }
      }
    } else {
      lowSecs = 0
      highSecs = 0
    }
    return null
  }

  function set(q) {
    if (!QP[q]) return null
    try { localStorage.setItem(QKEY, q) } catch (e) {}
    if (QP[q].aa !== aa) return { reload: true }
    quality = q
    auto = q === 'auto' && !pinned && !autoOff
    lowSecs = 0
    highSecs = 0
    if (!pinned && q === 'auto') useStep(matchSaved(readSavedStep()))
    else if (!pinned) {
      level = QP[q].scale
      add = QP[q].add.slice()
      rem = QP[q].rem.slice()
    } else if (q === 'auto') {
      add = SOLID_ADD.slice()
      rem = SOLID_REM.slice()
    } else {
      add = QP[q].add.slice()
      rem = QP[q].rem.slice()
    }
    return { reload: false }
  }

  return {
    get quality() { return quality },
    get level() { return level },
    get aa() { return aa },
    get auto() { return auto },
    get add() { return add },
    get rem() { return rem },
    get step() { return step },
    label() { return NAMES[quality] || quality },
    tick,
    set,
    applyFog,
  }
}
