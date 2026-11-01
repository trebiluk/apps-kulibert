// Fake long-distance horizon (2.5.552). Pure: no Babylon, no DOM, so tools/horizon-check.mjs can run it in node.
// 1. blendSky(ms): sky, hill and glow colors blended smoothly from the day clock (no phase steps).
// 2. bodies(ms): where the sun and moon are, so a sunset happens low on the horizon.
// 3. hillTexture(): the far-hills ridgeline, sampled once from the world, as a tiny 64x1 RGBA strip.
// The sky shader reads the strip, so the hills cost no extra draw call and no per-frame work.
import { CYCLE } from '../day.js'

const MIN = 60 * 1000

// Muted on purpose: dusk is amber-peach, not pink or neon. Night is dark blue, never black.
// zenith / horizon: sky ends. hill: dark hill color before haze. glow: color near the sun or moon.
// glowAmt: how strong that glow is (0 to 1). Every channel stays at or under about 0.90 (#E6).
export const PALETTE = {
  day: { zenith: [0.20, 0.38, 0.62], horizon: [0.70, 0.80, 0.86], hill: [0.27, 0.41, 0.37], glow: [0.90, 0.82, 0.58], glowAmt: 0.16, stars: 0 },
  dusk: { zenith: [0.15, 0.24, 0.46], horizon: [0.72, 0.60, 0.52], hill: [0.20, 0.20, 0.30], glow: [0.88, 0.66, 0.40], glowAmt: 0.42, stars: 0.3 },
  night: { zenith: [0.03, 0.05, 0.13], horizon: [0.10, 0.14, 0.28], hill: [0.04, 0.06, 0.12], glow: [0.45, 0.55, 0.80], glowAmt: 0.22, stars: 1 },
  dawn: { zenith: [0.24, 0.22, 0.44], horizon: [0.76, 0.64, 0.56], hill: [0.22, 0.21, 0.31], glow: [0.88, 0.70, 0.46], glowAmt: 0.40, stars: 0.12 },
}

// Where each look sits in the 20 minute cycle. Each ramp is at least 40 s long, so nothing jumps.
// The dawn look holds from sunrise (19.5 min) to the new day, then eases into full day over 90 s.
// Sunset is about 15.5 min and sunrise about 19.5 min (see bodies()).
const KEYS = [
  [0, 'dawn'],
  [1.5 * MIN, 'day'],
  [12.5 * MIN, 'day'],
  [15.2 * MIN, 'dusk'],
  [16.8 * MIN, 'night'],
  [18.8 * MIN, 'night'],
  [19.5 * MIN, 'dawn'],
  [CYCLE, 'dawn'],
]

// A resting time for each phase, for when a rule or a switch locks the sky (always day, or night only).
export const REST = { day: 6 * MIN, dusk: 15.2 * MIN, night: 17.8 * MIN, dawn: 19.5 * MIN }

function ease(u) { return u * u * (3 - 2 * u) }
function mix(a, b, u) { return a + (b - a) * u }
function mix3(a, b, u) { return [mix(a[0], b[0], u), mix(a[1], b[1], u), mix(a[2], b[2], u)] }

export function blendSky(ms) {
  const t = ((ms % CYCLE) + CYCLE) % CYCLE
  let i = 0
  while (i < KEYS.length - 2 && t >= KEYS[i + 1][0]) i++
  const a = PALETTE[KEYS[i][1]]
  const b = PALETTE[KEYS[i + 1][1]]
  const span = KEYS[i + 1][0] - KEYS[i][0]
  const u = span > 0 ? ease(Math.min(1, Math.max(0, (t - KEYS[i][0]) / span))) : 0
  return {
    zenith: mix3(a.zenith, b.zenith, u),
    horizon: mix3(a.horizon, b.horizon, u),
    hill: mix3(a.hill, b.hill, u),
    glow: mix3(a.glow, b.glow, u),
    glowAmt: mix(a.glowAmt, b.glowAmt, u),
    stars: mix(a.stars, b.stars, u),
  }
}

// Sun is up from 19.5 min to 15.5 min of the next cycle (16 min). Moon is up from 15.5 to 20 min.
// Both climb to MAX_EL and set; the sun's path is a little south of overhead.
const MAX_EL = 1.0
const SUN_UP = 16 * MIN
const MOON_UP = 4.5 * MIN
function arc(u, flip) {
  if (u < 0 || u > 1) return { dir: [0, -1, 0], y: -1 }
  const el = MAX_EL * Math.sin(Math.PI * u)
  const az = Math.PI * (1 - u)
  const x = Math.cos(az) * Math.cos(el) * (flip ? -1 : 1)
  const y = Math.sin(el)
  const z = 0.45 * Math.cos(el)
  const len = Math.hypot(x, y, z)
  return { dir: [x / len, y / len, z / len], y: y / len }
}
function vis(y) { return ease(Math.min(1, Math.max(0, (y + 0.02) / 0.12))) }

export function bodies(ms) {
  const t = ((ms % CYCLE) + CYCLE) % CYCLE
  const su = t >= 19.5 * MIN ? (t - 19.5 * MIN) / SUN_UP : (t + 0.5 * MIN) / SUN_UP
  const mu = t >= 15.5 * MIN ? (t - 15.5 * MIN) / MOON_UP : -1
  const s = arc(su, false)
  const m = arc(mu, true)
  return { sun: { dir: s.dir, vis: vis(s.y) }, moon: { dir: m.dir, vis: vis(m.y) } }
}

// What the sky shader needs: which body glows, in what color, how much.
export function glowFor(blend, b) {
  if (b.sun.vis >= b.moon.vis && b.sun.vis > 0.001) {
    return { dir: b.sun.dir, col: blend.glow, amt: blend.glowAmt * b.sun.vis }
  }
  if (b.moon.vis > 0.001) {
    return { dir: b.moon.dir, col: [0.45, 0.55, 0.80], amt: 0.22 * b.moon.vis }
  }
  return { dir: [0, -1, 0], col: blend.glow, amt: 0 }
}

export const HILL_N = 64
export const HILL_MAX = 0.2 // largest ridge height stored, as sin(elevation). About 11.5 degrees.
const RADII = [150, 320]
const LIFT = [14, 34] // base hill height in blocks at 'near' and 'far'. Far is taller so both ridges show.
const MOUNT_R = 640 // far mountains sit behind both ridges
const MOUNT_LIFT = 46

// Texel i looks at this compass angle, matching atan(z, x) in the sky shader.
export function texelAngle(i, n = HILL_N) { return ((i + 0.5) / n - 0.5) * 2 * Math.PI }

// heightAt(x, z) -> ground height in blocks. rough(x, z) -> 0..1, seeded by the world seed.
// Real terrain nudges the ridge (x3 so it reads from far away); the seeded part keeps flat worlds from being a ruler.
export function hillSamples(heightAt, rough, cx, cz, baseY, n = HILL_N) {
  const out = [new Array(n), new Array(n)]
  for (let r = 0; r < 2; r++) {
    for (let i = 0; i < n; i++) {
      const a = texelAngle(i, n)
      const x = Math.round(cx + Math.cos(a) * RADII[r])
      const z = Math.round(cz + Math.sin(a) * RADII[r])
      const dy = (heightAt(x, z) - baseY) * 3
      const wob = (rough(x + r * 97, z - r * 61) - 0.5) * 22
      out[r][i] = Math.min(HILL_MAX * 0.85, Math.max(0.012, (LIFT[r] + dy + wob) / RADII[r]))
    }
    // Two soft passes so the ridge is a few big low-poly facets, not a jagged comb.
    for (let pass = 0; pass < 2; pass++) {
      const src = out[r].slice()
      for (let i = 0; i < n; i++) out[r][i] = (src[(i + n - 1) % n] + 2 * src[i] + src[(i + 1) % n]) / 4
    }
  }
  // Third row: far mountains, seeded only (no terrain under them yet). A few broad peaks, so the far view has a skyline.
  const m = new Array(n)
  for (let i = 0; i < n; i++) {
    const a = texelAngle(i, n)
    const x = Math.round(cx + Math.cos(a) * MOUNT_R)
    const z = Math.round(cz + Math.sin(a) * MOUNT_R)
    const big = rough(Math.round(x / 90) * 90 + 501, Math.round(z / 90) * 90 - 307)
    const small = rough(x + 911, z - 433)
    m[i] = Math.min(HILL_MAX * 0.98, Math.max(0.04, (MOUNT_LIFT + big * big * 120 + small * 16) / MOUNT_R))
  }
  for (let pass = 0; pass < 2; pass++) {
    const src = m.slice()
    for (let i = 0; i < n; i++) m[i] = (src[(i + n - 1) % n] + 2 * src[i] + src[(i + 1) % n]) / 4
  }
  out.push(m)
  return out
}

// RGBA bytes for the n x 1 strip. R = near ridge, G = far ridge, B = far mountains, A opaque.
export function hillBytes(samples) {
  const n = samples[0].length
  const px = new Uint8ClampedArray(n * 4)
  for (let i = 0; i < n; i++) {
    px[i * 4] = Math.round(Math.min(1, samples[0][i] / HILL_MAX) * 255)
    px[i * 4 + 1] = Math.round(Math.min(1, samples[1][i] / HILL_MAX) * 255)
    px[i * 4 + 2] = samples[2] ? Math.round(Math.min(1, samples[2][i] / HILL_MAX) * 255) : 0
    px[i * 4 + 3] = 255
  }
  return px
}

// Aerial perspective: far things drift toward the horizon color. Far ridge is hazier than near.
export function hillColors(blend) {
  return {
    near: mix3(blend.hill, blend.horizon, 0.22), // the treeline reads green, not grey
    far: mix3(blend.hill, blend.horizon, 0.55),
  }
}
