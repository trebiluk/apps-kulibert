// Horizon check (2.5.552): clock-driven sky is smooth, calm and bounded; hills are deterministic and small.
import { blendSky, bodies, glowFor, hillSamples, hillBytes, hillColors, PALETTE, REST, HILL_N, HILL_MAX } from '../src/gfx/horizon.js'
import { CYCLE, phaseAt } from '../src/day.js'

const fail = []
function check(ok, msg) { if (!ok) fail.push(msg) }
const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
const maxCh = (c) => Math.max(c[0], c[1], c[2])

// 1. Smooth: step through a whole cycle every second. No color channel may move more than 0.03 in one second.
let worstStep = 0
let prev = null
let worstMax = 0
let prevStars = null
let worstStars = 0
for (let ms = 0; ms <= CYCLE; ms += 1000) {
  const b = blendSky(ms)
  const parts = [b.zenith, b.horizon, b.hill, b.glow]
  for (const p of parts) worstMax = Math.max(worstMax, maxCh(p))
  const flat = [...b.zenith, ...b.horizon, ...b.hill, b.glowAmt]
  if (prev) for (let i = 0; i < flat.length; i++) worstStep = Math.max(worstStep, Math.abs(flat[i] - prev[i]))
  if (prevStars !== null) worstStars = Math.max(worstStars, Math.abs(b.stars - prevStars))
  prevStars = b.stars
  prev = flat
}
check(worstStars <= 0.05, 'stars fade too fast: ' + worstStars.toFixed(4) + ' per second')
check(worstStep <= 0.03, 'sky moves too fast: ' + worstStep.toFixed(4) + ' per second')
check(worstMax <= 0.90, 'a sky color is too bright: ' + worstMax.toFixed(3))

// 2. The cycle joins up: the end of one day is the start of the next.
const a = blendSky(0)
const z = blendSky(CYCLE)
check(JSON.stringify(a) === JSON.stringify(z), 'cycle does not wrap')

// 3. Resting looks match the palette and the day clock names.
for (const k of Object.keys(PALETTE)) {
  const b = blendSky(REST[k])
  check(Math.abs(b.horizon[0] - PALETTE[k].horizon[0]) < 0.02, k + ' rest horizon is not the ' + k + ' color')
  const ph = phaseAt(REST[k]).name
  check(ph === k, k + ' rest time is in phase ' + ph)
}

// 4. Night is dark blue, never black. Dusk is warm and muted, not neon.
const n = blendSky(REST.night)
check(lum(n.horizon) > 0.1 && n.horizon[2] > n.horizon[0], 'night horizon is black or not blue')
check(lum(n.zenith) > 0.03, 'night zenith is pitch black')
const d = blendSky(REST.dusk)
check(d.horizon[0] > d.horizon[2] && maxCh(d.horizon) <= 0.85, 'dusk horizon is not warm and muted')
check(d.horizon[0] - d.horizon[1] < 0.3, 'dusk horizon is too saturated')

// 5. Hills read as far away: hazier than the near sky colors would be, and lighter than nothing.
const hc = hillColors(blendSky(REST.day))
const hz = blendSky(REST.day).horizon
const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2])
check(dist(hc.far, hz) < dist(hc.near, hz), 'far hills are not closer to the horizon color than near hills')

// 6. Sunset: the sun is low at dusk, the moon is up at night, nothing glows when both are down.
const sunDusk = bodies(15.2 * 60 * 1000).sun
check(sunDusk.vis > 0 && sunDusk.dir[1] < 0.2, 'sun is not low at dusk')
const noon = bodies(7 * 60 * 1000).sun
check(noon.vis > 0.99 && noon.dir[1] > 0.7, 'sun is not high at noon')
check(bodies(17.8 * 60 * 1000).moon.vis > 0.99, 'moon is not up at night')
check(bodies(17.8 * 60 * 1000).sun.vis === 0, 'sun is up at night')
check(glowFor(blendSky(0), { sun: { dir: [0, -1, 0], vis: 0 }, moon: { dir: [0, -1, 0], vis: 0 } }).amt === 0, 'glow with no body')
let worstGlow = 0
for (let ms = 0; ms < CYCLE; ms += 5000) worstGlow = Math.max(worstGlow, glowFor(blendSky(ms), bodies(ms)).amt)
check(worstGlow <= 0.55, 'glow too strong: ' + worstGlow.toFixed(2))
// Bodies move slowly: under 2 degrees of arc per second.
let worstTurn = 0
let pb = null
for (let ms = 0; ms < CYCLE; ms += 1000) {
  const bb = bodies(ms).sun
  const s = bb.dir
  if (bb.vis < 0.01) { pb = null; continue }
  if (pb) worstTurn = Math.max(worstTurn, Math.acos(Math.min(1, s[0] * pb[0] + s[1] * pb[1] + s[2] * pb[2])))
  pb = s
}
check(worstTurn < 2 * Math.PI / 180, 'sun moves too fast: ' + (worstTurn * 180 / Math.PI).toFixed(2) + ' deg/s')

// 7. Hills: same world gives the same ridge, ridge is small and in range, a different seed changes it.
const rough = (seed) => (x, z) => {
  let h = Math.imul(x + seed * 13, 374761393) + Math.imul(z - seed * 7, 668265263)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}
const ground = (x, z) => 4 + Math.round(2 * Math.sin(x / 40) + 2 * Math.cos(z / 55))
const s1 = hillSamples(ground, rough(0), 8, 1, 4)
const s2 = hillSamples(ground, rough(0), 8, 1, 4)
const s3 = hillSamples(ground, rough(5), 8, 1, 4)
check(JSON.stringify(s1) === JSON.stringify(s2), 'hills are not deterministic')
check(JSON.stringify(s1) !== JSON.stringify(s3), 'hills ignore the world seed')
let lo = 1
let hi = 0
for (const ring of s1) for (const v of ring) { lo = Math.min(lo, v); hi = Math.max(hi, v) }
check(lo >= 0.012 && hi <= HILL_MAX, 'hill height out of range: ' + lo.toFixed(3) + ' to ' + hi.toFixed(3))
check(s1[0].length === HILL_N && s1[1].length === HILL_N, 'wrong number of samples')
const bytes = hillBytes(s1)
check(bytes.length === HILL_N * 4 && bytes[3] === 255, 'bad strip size or alpha')
let jag = 0
for (let i = 0; i < HILL_N; i++) jag = Math.max(jag, Math.abs(s1[1][i] - s1[1][(i + 1) % HILL_N]))
check(jag < 0.03, 'ridge is jagged: ' + jag.toFixed(3))
// Flat world still has gentle hills, not a ruler.
const flat = hillSamples(() => 4, rough(0), 8, 1, 4)
let fl = 1
let fh = 0
for (const v of flat[1]) { fl = Math.min(fl, v); fh = Math.max(fh, v) }
check(fh - fl > 0.01, 'flat world gives a ruler-straight ridge')

if (fail.length) {
  console.error('horizon check FAILED')
  for (const f of fail) console.error(' - ' + f)
  process.exit(1)
}
console.log('horizon ok')
