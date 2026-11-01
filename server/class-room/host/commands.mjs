// Server commands for the personal host (part 8): the essentials module (src/essentials.js, "standalone, not wired"
// until now) behind two doors that end in the same place:
//   buttons  -> {t:'cmd', c:'home'}                    the exact shapes essentials.js checks (ids, never names)
//   typed    -> {t:'chat', m:'/tp Trebby'}             parsed here into the same shape; names become room ids
// Pure: no sockets. The host hands in the players it knows and sends the effects out.
//
// Typed forms (18+; buttons send the same thing):
//   /spawn  /sethome  /home  /help
//   owner:  /tp <name>  /bring <name>  /spawnall  /warp <name>  /setwarp <name>  /delwarp <name>  /warps
//           /mute <name>  /unmute <name>  /muteall  /unmuteall  /announce <text>
import { makeEssentials, COOLDOWN_MS } from '../src/essentials.js'

export const PLAYER_CMDS = ['spawn', 'sethome', 'home', 'help']
export const OWNER_CMDS = ['tp', 'bring', 'spawnall', 'warp', 'setwarp', 'delwarp', 'warps', 'mute', 'unmute', 'muteall', 'unmuteall', 'announce']
const WARP_NAME = /^[a-z0-9][a-z0-9_-]{0,19}$/i
const fold = (s) => String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim()

// The menu a client gets in hello/rules: what this role may use, with the words for the buttons (English-only at home)
export function menuFor(staff) {
  const me = [{ c: 'spawn', label: 'Go to spawn' }, { c: 'sethome', label: 'Set home here' }, { c: 'home', label: 'Go home' }]
  if (!staff) return me
  return me.concat([{ c: 'tp', label: 'Go to player', arg: 'player' }, { c: 'bring', label: 'Bring player', arg: 'player' }, { c: 'spawnall', label: 'Everyone to spawn' },
    { c: 'warp', label: 'Warp to', arg: 'warp' }, { c: 'setwarp', label: 'Set warp here', arg: 'text' }, { c: 'mute', label: 'Mute player', arg: 'player' }, { c: 'unmute', label: 'Unmute player', arg: 'player' },
    { c: 'muteall', label: 'Mute everyone' }, { c: 'unmuteall', label: 'Unmute everyone' }, { c: 'announce', label: 'Announce', arg: 'text' }])
}

// deps: { spawn: {x,y,z}, players: () => [{ id, ref, alias, staff, pos }], now }
export function makeCommands({ spawn, players, now = Date.now }) {
  const warps = new Map()              // name(folded) -> { name, x, y, z }
  const warpIds = new Map()            // name(folded) -> id (essentials wants ids)
  let nextWarp = 1
  const world = {
    get spawn() { return spawn() },
    warps: { get: (i) => { for (const [k, id] of warpIds) if (id === i) { const w = warps.get(k); return w && { x: w.x, y: w.y, z: w.z } } return null } },
    qcIds: new Set(), emoteIds: new Set(), announceIds: new Set([0]), kitIds: new Set(),
    find: (id) => { const p = players().find((q) => q.id === id); return p ? { ref: p.ref, pos: p.pos } : null },
    homeOk: () => true,                // 18+: your home is wherever you stand (the school wires claims here)
  }
  const ess = makeEssentials(world)
  // exact name, then a name that starts with it, then any word of a name that starts with it ("sacc" -> Mr Saccy)
  const byName = (name) => { const f = fold(name); if (!f) return null; const all = players(); return all.find((p) => fold(p.alias) === f) || all.find((p) => fold(p.alias).startsWith(f)) || all.find((p) => fold(p.alias).split(' ').some((w) => w.startsWith(f))) || null }

  // typed line -> { cmd, text? } | { error, help? }
  function parse(line, staff) {
    const m = /^\/(\w+)\s*(.*)$/.exec(String(line || '').trim()); if (!m) return { error: 'not-a-command' }
    const c = m[1].toLowerCase(), rest = m[2].trim()
    if (c === 'help') return { help: (staff ? PLAYER_CMDS.concat(OWNER_CMDS) : PLAYER_CMDS).filter((x) => x !== 'help').map((x) => '/' + x).join('  ') }
    if (!PLAYER_CMDS.includes(c) && !OWNER_CMDS.includes(c)) return { error: 'unknown' }
    if (OWNER_CMDS.includes(c) && !staff) return { error: 'role' }
    const needPlayer = ['tp', 'bring', 'mute', 'unmute']
    if (needPlayer.includes(c)) { if (!rest) return { error: 'who' }; const p = byName(rest); if (!p) return { error: 'no-such-player' }; return { cmd: c === 'unmute' ? { c: 'mute', id: p.id, on: 0 } : c === 'mute' ? { c: 'mute', id: p.id, on: 1 } : { c, id: p.id } } }
    if (c === 'muteall') return { cmd: { c: 'muteall', on: 1 } }
    if (c === 'unmuteall') return { cmd: { c: 'muteall', on: 0 } }
    if (c === 'announce') { if (!rest) return { error: 'what' }; return { cmd: { c: 'announce', i: 0 }, text: rest.slice(0, 200) } }
    if (c === 'warp') { const w = warpIds.get(fold(rest)); if (w === undefined) return { error: 'no-such-warp' }; return { cmd: { c: 'warp', i: w } } }
    if (c === 'setwarp' || c === 'delwarp') { if (!WARP_NAME.test(rest)) return { error: 'warp-name' }; return { local: c, name: rest } }
    if (c === 'warps') return { local: 'warps' }
    return { cmd: { c } }
  }

  // run a command for an actor -> { fx: [...], say?: text } | { error }
  function run(actor, cmd, text) {
    const r = ess.handle({ id: actor.id, ref: actor.ref, staff: !!actor.staff, pos: actor.pos || null }, cmd, now())
    if (!r.ok) return { error: r.why === 'cooldown' ? 'cooldown' : r.why === 'no-home' ? 'no-home' : r.why === 'target' ? 'no-such-player' : r.why }
    const fx = r.fx.map((f) => (f.k === 'announce' ? { ...f, text } : f))
    return { fx }
  }
  return {
    menuFor,
    parse,
    run,
    // owner-only, kept here: warps are per session, by name
    setWarp(name, pos) { const k = fold(name); if (!WARP_NAME.test(name) || !pos) return { error: 'warp-name' }; if (!warpIds.has(k)) warpIds.set(k, nextWarp++); warps.set(k, { name, x: pos.x, y: pos.y, z: pos.z }); return { ok: true, warps: this.warpList() } },
    delWarp(name) { const k = fold(name); if (!warps.has(k)) return { error: 'no-such-warp' }; warps.delete(k); warpIds.delete(k); return { ok: true, warps: this.warpList() } },
    warpList() { return [...warps.values()].map((w) => w.name) },
    isMuted: (ref) => ess.isMuted(ref),
    forget: (ref) => ess.forget(ref),
    cooldowns: COOLDOWN_MS,
  }
}
