// Lag Coach, part 2: notice lag while it happens, ease it without touching the build, and offer
// a lesson. Call sample() once a second with the frame times (ms) of that second and the cost of the
// chunks near the player. Pure state machine; the game applies `actions` and shows `card`.
//
// Promises (all tested):
//  - It never changes, removes or replaces a block. Actions only slow or hide things on this screen.
//  - It never blames a build when the device is just slow (low cost): that gets a quality step only.
//  - No flapping: 3 slow seconds in a row to step up, 10 ok seconds in a row to step down.
//  - The lesson card appears once per spot and kind of build, and "Keep it as is" is always one tap.
import { BUDGET, dominant } from './lagcost.js'

export const ALLOWED_ACTIONS = ['tickRate', 'particles', 'lightRadius', 'lod', 'quality']
const p95 = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * 0.95))] : 0 }

export function makeCoach({ targetMs = 33, budget = BUDGET, enterSec = 3, exitSec = 10, blameAt = 0.6, heavyAt = 1.5 } = {}) {
  let tier = 0, slowRun = 0, okRun = 0
  const shown = new Set()    // "chunk:class" cards already offered this session

  const plan = (t, cls, near) => {
    if (t === 0) return []
    const a = [{ a: 'particles', on: false }, { a: 'tickRate', cls, f: t === 2 ? 0.5 : 0.25 }]
    if (cls === 'light') a.push({ a: 'lightRadius', blocks: t === 2 ? 24 : 12 })
    if (t === 3) {
      a.push({ a: 'lod', far: true })
      for (const k of Object.keys(near.by)) if (k !== cls && k !== 'solid' && near.by[k] >= 4) a.push({ a: 'tickRate', cls: k, f: 0.25 })
    }
    return a
  }

  return {
    // frames: ms list; near: { total, by }; spot: "cx,cz" of the player's chunk.
    sample(frames, near, spot) {
      const lag = p95(frames)
      const load = near.total / budget
      const slow = lag > targetMs
      const cause = !slow ? 'none' : load >= blameAt ? 'build' : 'device'
      if (slow) { slowRun++; okRun = 0 } else { okRun++; slowRun = 0 }

      if (slowRun >= enterSec) {
        // tiers: 1 = device is slow (quality step only), 2 = a build is the cause, 3 = a very heavy build
        const goal = cause === 'build' ? (load >= heavyAt ? 3 : 2) : 1
        if (tier < goal) tier = cause === 'build' && tier < 2 ? 2 : tier + 1
        slowRun = 0
      } else if (okRun >= exitSec && tier > 0) { tier--; okRun = 0 }

      const cls = dominant(near.by)
      let actions = []
      let card = null
      if (tier >= 2 && cls) {
        actions = plan(tier, cls, near)
        const key = spot + ':' + cls
        if (!shown.has(key)) { shown.add(key); card = { cls, key } }
      } else if (tier === 1) {
        actions = [{ a: 'quality', step: -1 }]
      }
      return { tier, cause, load, p95: lag, actions, badge: tier >= 2, card }
    },
    // "Keep it as is": mitigation stays, the card is not offered again for this spot and kind.
    keep: (key) => shown.add(key),
    tier: () => tier,
  }
}
