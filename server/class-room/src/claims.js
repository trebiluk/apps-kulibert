// "GriefPrevention style" protection for a room, adapted for a kids' class server.
// Pure functions and small state; no Cloudflare APIs. STANDALONE and NOT WIRED: Phase 0 has
// no block edits, so nothing calls this yet. It is the Phase 2 (plots) building block.
//
// How it differs from the Minecraft plugin, on purpose:
// - Kids do NOT draw claims with a golden shovel, do not buy claim blocks, and cannot
//   claim land. A plot is a fixed 32x32 square on a grid, ASSIGNED to a kid by staff
//   (or automatically when staff open the room). One plot per kid.
// - Trust ("buddy build") is OFF unless staff turn it on for a config, and it is staff-set.
//   A kid cannot invite anyone anywhere (no invites, no kid-hosted anything).
// - Protected zones that nobody but staff can touch: the Bertyville core and the commons.
// - Everything fails closed: a config with no policy below allows NO kid edits at all.
// - Staff can always edit (they are the grief-repair tool), except they cannot edit an
//   invalid shape. A locked plot (judging, end of semester) is read-only for its owner too.
//
// What a refused edit returns: {ok:false, why, strike?}. `strike:true` means "this looks like
// griefing, count it toward the kick/ban ladder in guard.js" (repeated attempts on other
// kids' plots or protected land). Plain mistakes (out of reach, wrong spot once) do not strike.

import { newBucket, takeToken, WORLD_LIMIT } from './protocol.js'

// ---- layout (first guesses; tune with the real map. Block coordinates, x/z only.)
export const PLOT = 32          // plot side
export const PATH = 4           // walkway between plots
export const PITCH = PLOT + PATH
export const COLS = 6
export const ROWS = 6
export const PLOT_COUNT = COLS * ROWS   // 36: room for 30 kids and a few spares
export const LAYOUT = {
  coreHalf: 16,       // |x| and |z| <= 16: the Bertyville core, staff only
  commonsHalf: 40,    // beyond the core up to 40: the commons, staff only
  gridX0: 56,         // first plot column starts here
  gridZ0: -108,       // first plot row starts here
}

// ---- per-config policy. ONLY `contest` is decided (Diego: "creative flat, plots, contest
// tools, strong grief prevention"). The other six have no policy yet, so kids cannot edit in
// them until Diego decides. Do not guess these.
export const POLICY = {
  contest: { plots: true, wild: false, strong: true, buddies: false, editsPerSec: 8, bannedBlocks: [] },
  // solvay, semester, period, game, loot, seed: undecided -> no kid edits
}
// A non-school host registers the policy for its own config ids (see protocol.js registerConfigIds). School never calls this.
const EXTRA_POLICY = new Map()
export function registerPolicy(cfg, policy) { if (/^home(-|$)/.test(cfg) && policy && typeof policy === 'object') EXTRA_POLICY.set(cfg, { ...policy }) }
export const policyFor = (cfg) => (Object.hasOwn(POLICY, cfg) ? POLICY[cfg] : EXTRA_POLICY.get(cfg) ?? null)

export function plotRect(i) {
  const c = i % COLS
  const r = Math.floor(i / COLS)
  const x0 = LAYOUT.gridX0 + c * PITCH
  const z0 = LAYOUT.gridZ0 + r * PITCH
  return { x0, z0, x1: x0 + PLOT - 1, z1: z0 + PLOT - 1 }
}

// Where is this cell? -> {kind:'core'|'commons'|'plot'|'path'|'wild', plot?}
export function regionAt(x, z) {
  const ax = Math.abs(x)
  const az = Math.abs(z)
  if (ax <= LAYOUT.coreHalf && az <= LAYOUT.coreHalf) return { kind: 'core' }
  if (ax <= LAYOUT.commonsHalf && az <= LAYOUT.commonsHalf) return { kind: 'commons' }
  const dx = x - LAYOUT.gridX0
  const dz = z - LAYOUT.gridZ0
  if (dx >= 0 && dz >= 0 && dx < COLS * PITCH && dz < ROWS * PITCH) {
    const c = Math.floor(dx / PITCH)
    const r = Math.floor(dz / PITCH)
    if (dx - c * PITCH < PLOT && dz - r * PITCH < PLOT) return { kind: 'plot', plot: r * COLS + c }
    return { kind: 'path' }
  }
  return { kind: 'wild' }
}

const STRIKE_WINDOW_MS = 10000
const STRIKE_AFTER = 8   // refused edits on land that is not yours, inside the window

export function makeClaims(cfg) {
  const policy = policyFor(cfg)
  const owners = new Map()     // plot index -> ref
  const byRef = new Map()      // ref -> plot index
  const locked = new Set()
  const buddies = new Map()    // plot index -> Set(ref)  (only when policy.buddies)
  const rate = new Map()       // ref -> bucket
  const denied = new Map()     // ref -> [timestamps]
  let lockAll = false

  const banned = new Set(policy ? policy.bannedBlocks : [])

  function noteDenied(ref, now) {
    const list = (denied.get(ref) || []).filter((t) => now - t < STRIKE_WINDOW_MS)
    list.push(now)
    denied.set(ref, list)
    return list.length >= STRIKE_AFTER
  }

  return {
    policy,

    // Staff action. Same kid gets the same plot back. Returns the plot index or null when full.
    assign(ref) {
      if (!policy || !policy.plots) return null
      if (byRef.has(ref)) return byRef.get(ref)
      for (let i = 0; i < PLOT_COUNT; i++) {
        if (!owners.has(i)) { owners.set(i, ref); byRef.set(ref, i); return i }
      }
      return null
    },
    release(ref) {
      const i = byRef.get(ref)
      if (i === undefined) return
      owners.delete(i); byRef.delete(ref); buddies.delete(i); locked.delete(i)
    },
    plotOf: (ref) => (byRef.has(ref) ? byRef.get(ref) : null),

    // Staff actions. lock(i) = read-only (judging). lockEverything(true) = whole room read-only for kids.
    lock(i, on) { if (on) locked.add(i); else locked.delete(i) },
    lockEverything(on) { lockAll = !!on },

    // Staff action, and only when the config allows it. A kid cannot call this.
    setBuddy(plot, ref, on) {
      if (!policy || !policy.buddies || !owners.has(plot)) return false
      const s = buddies.get(plot) || new Set()
      if (on) s.add(ref); else s.delete(ref)
      buddies.set(plot, s)
      return true
    },

    // actor: {ref, staff}. edit: {op:'place'|'break', x, y, z, id?}. now: ms.
    canEdit(actor, edit, now) {
      if (!edit || (edit.op !== 'place' && edit.op !== 'break')) return { ok: false, why: 'shape' }
      for (const k of ['x', 'y', 'z']) if (!Number.isInteger(edit[k]) || Math.abs(edit[k]) > WORLD_LIMIT) return { ok: false, why: 'shape' }
      if (actor.staff) return { ok: true }                       // staff repair grief; the room still logs it
      if (!policy) return { ok: false, why: 'no-policy' }        // fails closed: undecided config
      if (lockAll) return { ok: false, why: 'locked' }
      if (edit.op === 'place' && banned.has(edit.id)) return { ok: false, why: 'banned-block' }

      const reg = regionAt(edit.x, edit.z)
      let why = null
      if (reg.kind === 'core' || reg.kind === 'commons' || reg.kind === 'path') why = policy.town === false ? null : 'protected'   // town: false = no Bertyville map (home worlds)
      else if (reg.kind === 'wild') why = policy.wild ? null : 'protected'
      else if (!policy.plots) why = 'protected'
      else {
        const owner = owners.get(reg.plot)
        const mine = owner === actor.ref || (buddies.get(reg.plot) && buddies.get(reg.plot).has(actor.ref))
        if (!mine) why = 'not-yours'
        else if (locked.has(reg.plot)) why = 'locked'
      }
      if (why) {
        const strike = (why === 'protected' || why === 'not-yours') && policy.strong && noteDenied(actor.ref, now)
        return strike ? { ok: false, why, strike: true } : { ok: false, why }
      }

      let b = rate.get(actor.ref)
      if (!b) { b = newBucket(now, policy.editsPerSec); rate.set(actor.ref, b) }
      if (!takeToken(b, now)) return { ok: false, why: 'rate' }
      return { ok: true }
    },
  }
}
