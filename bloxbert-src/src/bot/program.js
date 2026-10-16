// A Bot program is a list of chips. The runner walks it one action at a time.
export const CHIP_IDS = ['forward', 'turn', 'dig', 'place', 'repeat', 'end']
export const TRAY_N = 12
export const STEP_CAP = 64

export function blankProgram() {
  return { v: 1, steps: [] }
}

function clampN(n) {
  const v = n | 0
  if (v < 2) return 2
  if (v > 9) return 9
  return v
}

export function makeStep(id, extra) {
  if (CHIP_IDS.indexOf(id) < 0) return null
  const step = { id }
  if (id === 'repeat') step.n = clampN(extra && extra.n)
  if (id === 'turn') step.dir = extra && extra.dir === 'l' ? 'l' : 'r'
  return step
}

function coerce(raw) {
  if (typeof raw === 'string') return makeStep(raw)
  if (!raw || typeof raw !== 'object') return null
  return makeStep(raw.id, raw)
}

export function readProgram(raw) {
  const steps = []
  const src = raw && Array.isArray(raw.steps) ? raw.steps : []
  for (const item of src) {
    const step = coerce(item)
    if (step && steps.length < TRAY_N) steps.push(step)
  }
  return { v: 1, steps }
}

export function prefillSteps() {
  return [
    { id: 'repeat', n: 4 },
    { id: 'place' },
    { id: 'forward' },
    { id: 'end' },
  ]
}

export function addStep(program, id) {
  const step = makeStep(id)
  if (!program || !step) return false
  if (program.steps.length >= TRAY_N) return false
  program.steps.push(step)
  return true
}

export function removeStep(program, index) {
  if (!program || index < 0 || index >= program.steps.length) return false
  program.steps.splice(index, 1)
  return true
}

export function bumpRepeat(step) {
  if (!step || step.id !== 'repeat') return
  const n = clampN(step.n)
  step.n = n >= 9 ? 2 : n + 1
}

export function flipTurn(step) {
  if (!step || step.id !== 'turn') return
  step.dir = step.dir === 'l' ? 'r' : 'l'
}

export function matchEnd(steps, repeatIndex) {
  let depth = 0
  for (let i = repeatIndex; i < steps.length; i++) {
    const id = steps[i] && steps[i].id
    if (id === 'repeat') depth += 1
    else if (id === 'end') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

export function createCursor() {
  return { ip: 0, frames: [], actions: 0 }
}

// One action, or a stop. Repeat and End are free and do not count toward the cap.
export function pullStep(steps, cursor) {
  if (cursor.actions >= STEP_CAP) return { kind: 'cap', index: Math.min(cursor.ip, Math.max(0, steps.length - 1)) }
  let guard = 0
  while (cursor.ip < steps.length && guard < 48) {
    guard += 1
    const step = steps[cursor.ip]
    if (!step) { cursor.ip += 1; continue }
    if (step.id === 'repeat') {
      const end = matchEnd(steps, cursor.ip)
      if (end < 0) return { kind: 'blocked', index: cursor.ip }
      cursor.frames.push({ body: cursor.ip + 1, end, left: clampN(step.n) })
      cursor.ip += 1
      continue
    }
    if (step.id === 'end') {
      const frame = cursor.frames[cursor.frames.length - 1]
      if (!frame || frame.end !== cursor.ip) { cursor.ip += 1; continue }
      frame.left -= 1
      if (frame.left > 0) cursor.ip = frame.body
      else { cursor.frames.pop(); cursor.ip = frame.end + 1 }
      continue
    }
    const index = cursor.ip
    cursor.ip += 1
    cursor.actions += 1
    return { kind: 'act', index, id: step.id, step, n: cursor.actions }
  }
  return { kind: 'done', index: -1, n: cursor.actions }
}

export function countActions(steps) {
  const cursor = createCursor()
  const copy = steps.map((s) => ({ id: s.id, n: s.n, dir: s.dir }))
  let n = 0
  for (let i = 0; i < STEP_CAP + 8; i++) {
    const hit = pullStep(copy, cursor)
    if (hit.kind === 'act') n += 1
    else break
  }
  return n
}
