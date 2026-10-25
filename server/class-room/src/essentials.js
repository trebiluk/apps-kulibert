// "Essentials style" everyday commands for a room, adapted for a kids' class server.
// Pure state + rules; the room applies the returned effects. STANDALONE and NOT WIRED.
//
// Kept from the Minecraft plugin idea: spawn, home, warps, teleport tools for staff, mute,
// announcements, kits, AFK, cooldowns. Changed on purpose:
// - NO typed text anywhere. "Chat" is the quick-chat wheel and emotes: small ids that every
//   client translates (8 languages + Simple). Announcements, warps and kits are ids from a
//   fixed list per config, never text a teacher types.
// - NO kid-to-kid teleport (no /tpa). A kid can go to spawn or to their own home, nothing else.
//   Only staff move other people (tp, bring, spawnall).
// - Teleports are decided by the SERVER (effect `tp`), so the speed check in rules.js is told
//   about them and does not snap the kid back. This closes the "respawn/portal" gap noted in
//   SECURITY.md.
// - One home per kid, no names. Cooldowns on everything a kid can do.
// - Mute is staff-only (one kid, or all kids). A muted kid's quick-chat is dropped quietly.
// - AFK is shown as an icon AND the word AFK on the nameplate (never colour alone).
//
// handle(actor, cmd, now) -> { ok:true, fx:[effects] } | { ok:false, why }
// actor: { id, ref, staff, pos|null }   cmd: see COMMANDS below (exact shapes)
// effects: {k:'tp', id, pos} {k:'qc', from, i} {k:'emote', from, i} {k:'announce', i}
//          {k:'mute', id, on} {k:'muteall', on} {k:'kit', id, i} {k:'home-set'} {k:'ok', c}
// The room must send each effect to the right sockets (qc/emote/announce to everyone).

import { WORLD_LIMIT } from './protocol.js'

export const COOLDOWN_MS = { spawn: 5000, sethome: 2000, home: 5000, qc: 2000, emote: 1000 }
export const AFK_AFTER_MS = 60000

// COMMANDS (exact keys; anything else is refused):
//   kid:   {c:'spawn'} {c:'sethome'} {c:'home'} {c:'qc', i} {c:'emote', i}
//   staff: {c:'warp', i} {c:'tp', id} {c:'bring', id} {c:'spawnall'} {c:'mute', id, on}
//          {c:'muteall', on} {c:'announce', i} {c:'kit', id, i}
const SHAPES = {
  spawn: [], sethome: [], home: [], qc: ['i'], emote: ['i'],
  warp: ['i'], tp: ['id'], bring: ['id'], spawnall: [], mute: ['id', 'on'], muteall: ['on'], announce: ['i'], kit: ['id', 'i'],
}
const STAFF_ONLY = new Set(['warp', 'tp', 'bring', 'spawnall', 'mute', 'muteall', 'announce', 'kit'])
const isId = (n) => Number.isInteger(n) && n >= 0 && n <= 65535
const isOnOff = (n) => n === 0 || n === 1

export function validCommand(cmd) {
  if (!cmd || typeof cmd !== 'object' || Array.isArray(cmd) || typeof cmd.c !== 'string' || !Object.hasOwn(SHAPES, cmd.c)) return false
  const keys = Object.keys(cmd).filter((k) => k !== 'c')
  const want = SHAPES[cmd.c]
  if (keys.length !== want.length || !want.every((k) => keys.includes(k))) return false
  for (const k of want) {
    if (k === 'on' ? !isOnOff(cmd[k]) : !isId(cmd[k])) return false
  }
  return true
}

const okPos = (p) => !!p && [p.x, p.y, p.z].every((n) => Number.isFinite(n) && Math.abs(n) <= WORLD_LIMIT)

// world: {
//   spawn: {x,y,z},
//   warps: Map(id -> {x,y,z})          staff-chosen preset places, ids only
//   qcIds, emoteIds, announceIds, kitIds: Set of allowed ids (labels live in the client, translated)
//   find(id) -> {ref, pos}|null        look up a player in this room by room id
//   homeOk(ref, pos) -> boolean        e.g. inside own plot or the commons (room wires claims here)
// }
export function makeEssentials(world) {
  const homes = new Map()   // ref -> pos  (memory only, forgotten with the room)
  const cool = new Map()    // ref -> { cmd: lastMs }
  const muted = new Set()   // refs
  let muteAll = false

  // The cooldown clock starts only when a command succeeds, so a refused try costs nothing.
  const ready = (ref, c, now) => {
    const wait = COOLDOWN_MS[c]
    const t = (cool.get(ref) || {})[c]
    return !wait || t === undefined || now - t >= wait
  }
  const stamp = (ref, c, now) => {
    if (!COOLDOWN_MS[c]) return
    const m = cool.get(ref) || {}
    m[c] = now
    cool.set(ref, m)
  }

  function run(actor, cmd, c) {
    switch (c) {
      case 'spawn':
        return { ok: true, fx: [{ k: 'tp', id: actor.id, pos: world.spawn }] }

      case 'sethome':
        if (!okPos(actor.pos)) return { ok: false, why: 'pos' }
        if (!world.homeOk(actor.ref, actor.pos)) return { ok: false, why: 'not-here' }
        homes.set(actor.ref, { x: actor.pos.x, y: actor.pos.y, z: actor.pos.z })
        return { ok: true, fx: [{ k: 'home-set' }] }

      case 'home': {
        const h = homes.get(actor.ref)
        return h ? { ok: true, fx: [{ k: 'tp', id: actor.id, pos: h }] } : { ok: false, why: 'no-home' }
      }

      case 'qc':
        if (!world.qcIds.has(cmd.i)) return { ok: false, why: 'id' }
        if (muteAll || muted.has(actor.ref)) return { ok: true, fx: [] }   // dropped quietly; the muted kid is not told who muted them
        return { ok: true, fx: [{ k: 'qc', from: actor.id, i: cmd.i }] }

      case 'emote':
        if (!world.emoteIds.has(cmd.i)) return { ok: false, why: 'id' }
        if (muteAll || muted.has(actor.ref)) return { ok: true, fx: [] }
        return { ok: true, fx: [{ k: 'emote', from: actor.id, i: cmd.i }] }

      // ---- staff only from here
      case 'warp': {
        const p = world.warps.get(cmd.i)
        return p ? { ok: true, fx: [{ k: 'tp', id: actor.id, pos: p }] } : { ok: false, why: 'id' }
      }
      case 'tp': {   // staff go to a player
        const t = world.find(cmd.id)
        return t && okPos(t.pos) ? { ok: true, fx: [{ k: 'tp', id: actor.id, pos: t.pos }] } : { ok: false, why: 'target' }
      }
      case 'bring': {   // staff bring a player to them
        const t = world.find(cmd.id)
        return t && okPos(actor.pos) ? { ok: true, fx: [{ k: 'tp', id: cmd.id, pos: actor.pos }] } : { ok: false, why: 'target' }
      }
      case 'spawnall':
        return { ok: true, fx: [{ k: 'spawnall', pos: world.spawn }] }
      case 'mute': {
        const t = world.find(cmd.id)
        if (!t) return { ok: false, why: 'target' }
        if (cmd.on) muted.add(t.ref); else muted.delete(t.ref)
        return { ok: true, fx: [{ k: 'mute', id: cmd.id, on: cmd.on }] }
      }
      case 'muteall':
        muteAll = cmd.on === 1
        return { ok: true, fx: [{ k: 'muteall', on: cmd.on }] }
      case 'announce':
        return world.announceIds.has(cmd.i) ? { ok: true, fx: [{ k: 'announce', i: cmd.i }] } : { ok: false, why: 'id' }
      case 'kit':
        if (!world.kitIds.has(cmd.i)) return { ok: false, why: 'id' }
        return world.find(cmd.id) ? { ok: true, fx: [{ k: 'kit', id: cmd.id, i: cmd.i }] } : { ok: false, why: 'target' }
    }
    return { ok: false, why: 'shape' }
  }

  return {
    isMuted: (ref) => muteAll || muted.has(ref),
    homeOf: (ref) => homes.get(ref) || null,

    handle(actor, cmd, now) {
      if (!validCommand(cmd)) return { ok: false, why: 'shape' }
      const c = cmd.c
      if (STAFF_ONLY.has(c) && !actor.staff) return { ok: false, why: 'role' }
      if (!actor.staff && !ready(actor.ref, c, now)) return { ok: false, why: 'cooldown' }
      const r = run(actor, cmd, c)
      if (r.ok && !actor.staff) stamp(actor.ref, c, now)
      return r
    },

    forget(ref) { cool.delete(ref) },   // call when a kid leaves; homes and mutes stay for the session
  }
}

// AFK for the nameplate: true after a minute with no input. Show the icon AND the word "AFK".
export const isAfk = (lastActiveMs, now) => now - lastActiveMs > AFK_AFTER_MS
