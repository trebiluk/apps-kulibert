// A Bot program is a list of chips. No runner yet.
export const CHIP_IDS = ['forward', 'turn', 'dig', 'place', 'repeat', 'end']
export const TRAY_N = 12

export function blankProgram() {
  return { v: 1, steps: [] }
}

export function readProgram(raw) {
  const steps = []
  const src = raw && Array.isArray(raw.steps) ? raw.steps : []
  for (const id of src) {
    if (CHIP_IDS.indexOf(id) >= 0 && steps.length < TRAY_N) steps.push(id)
  }
  return { v: 1, steps }
}

export function addStep(program, id) {
  if (!program || CHIP_IDS.indexOf(id) < 0) return false
  if (program.steps.length >= TRAY_N) return false
  program.steps.push(id)
  return true
}

export function removeStep(program, index) {
  if (!program || index < 0 || index >= program.steps.length) return false
  program.steps.splice(index, 1)
  return true
}
