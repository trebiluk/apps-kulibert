// Generic power hook. Core does not know circuits. A pack may register one ask.
let ask = null

export function hookPower(fn) {
  ask = typeof fn === 'function' ? fn : null
}

export function powerOf(x, y, z) {
  if (!ask) return false
  try { return !!ask(x | 0, y | 0, z | 0) } catch (e) { return false }
}
