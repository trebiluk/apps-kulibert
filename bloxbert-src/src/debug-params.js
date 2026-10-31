// Debug URL params (2.5.563). For proof runs only: ignored unless ?debug=1.
//   ?clock=dawn|noon|dusk|night  pins the sky and clock face to that time. Session-only, never saved.
//   ?cam=sun|horizon             aims the camera at the sun disc, or level at the horizon under the sun.
// Pure: no DOM, no Babylon, so it can be checked in node.
import { bodies, REST } from './gfx/horizon.js'

const MIN = 60 * 1000
export const DEBUG_CLOCK = { dawn: 19.7 * MIN, noon: 7.5 * MIN, dusk: REST.dusk, night: REST.night }
const CAMS = ['sun', 'horizon']

export function readDebug(search) {
  const q = new URLSearchParams(search || '')
  if (q.get('debug') !== '1') return null
  const c = q.get('clock')
  const cam = q.get('cam')
  return {
    clock: Object.prototype.hasOwnProperty.call(DEBUG_CLOCK, c) ? c : null,
    cam: CAMS.includes(cam) ? cam : null,
  }
}

// Heading and pitch in noa's convention (see setLook in main.js): dir = [cos p sin h, -sin p, cos p cos h].
export function aimFor(cam, clockMs) {
  const d = bodies(Number.isFinite(clockMs) ? clockMs : REST.day).sun.dir
  const h = Math.atan2(d[0], d[2])
  const p = cam === 'sun' ? -Math.asin(Math.max(-1, Math.min(1, d[1]))) : 0
  return { h, p }
}
