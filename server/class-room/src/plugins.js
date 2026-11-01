// Plugins: rules a person builds without code (the in-game code builder, part 9). Pure: no sockets, no clock of
// its own, no I/O. The host (or the hub) feeds events in and carries the actions out.
//
// A plugin is data, never code:
//   { id, name, by, about, on, rules: [ { when, if: [...], do: [...] } ], v: 1 }
//   when: { e: 'join' | 'leave' | 'place' | 'break' | 'chat' | 'command' | 'timer', ...args }
//         timer: { e: 'timer', every: seconds (>= 10) }      command: { e: 'command', name: 'word' }  -> "/word" in chat
//   if:   [ { k: 'owner' } | { k: 'player', is: 'name' } | { k: 'block', is: id } | { k: 'zone', x0,y0,z0,x1,y1,z1 }
//           | { k: 'count', of: 'place'|'break'|'chat', over: n, per: seconds } | { k: 'not', c: {...} } ]
//   do:   [ { a: 'say', text } | { a: 'tell', text } | { a: 'announce', text } | { a: 'tp', x, y, z } | { a: 'spawn' }
//           | { a: 'undo' } | { a: 'kick' } | { a: 'mute', on } | { a: 'set', x, y, z, id } | { a: 'deny' } ]
// Text may use {player}, {block}, {x}, {y}, {z}, {count}.
//
// Two safety tiers decide which blocks a plugin may hold (checkPlugin):
//   'kid'   (students: saved under the alias)   when: join, place, break, command, timer · if: block, zone, not ·
//           do: say, tell, set (inside the plugin's zone only)
//   'adult' (18+: the cloud library)            everything above
// Limits: 32 rules per plugin, 8 ifs and 8 dos per rule, text 200 chars, timer >= 10 s, 50 actions per event.
export const TIERS = {
  kid: { when: ['join', 'place', 'break', 'command', 'timer'], if: ['block', 'zone', 'not', 'player'], do: ['say', 'tell', 'set'] },
  adult: { when: ['join', 'leave', 'place', 'break', 'chat', 'command', 'timer'], if: ['owner', 'player', 'block', 'zone', 'count', 'not'], do: ['say', 'tell', 'announce', 'tp', 'spawn', 'undo', 'kick', 'mute', 'set', 'deny'] },
}
export const LIMITS = { rules: 32, ifs: 8, dos: 8, text: 200, timerMin: 10, actionsPerEvent: 50, plugins: 32 }
const int = (v, lo = -1e6, hi = 1e6) => Number.isInteger(v) && v >= lo && v <= hi
const str = (v, n = LIMITS.text) => typeof v === 'string' && v.length <= n
const ID = /^[a-z0-9][a-z0-9-]{1,39}$/

// -> null when fine, else a plain reason (the editor shows it)
export function checkPlugin(p, tier = 'kid') {
  const T = TIERS[tier]; if (!T) return 'tier'
  if (!p || typeof p !== 'object' || Array.isArray(p)) return 'not a plugin'
  if (!ID.test(String(p.id || ''))) return 'id: letters, digits and - (2 to 40)'
  if (!str(p.name, 40) || !p.name.trim()) return 'name: 1 to 40 characters'
  if (!str(p.about || '', 200)) return 'about: up to 200 characters'
  if (!Array.isArray(p.rules) || p.rules.length > LIMITS.rules) return 'rules: a list of up to ' + LIMITS.rules
  for (let i = 0; i < p.rules.length; i++) {
    const r = p.rules[i], at = 'rule ' + (i + 1) + ': '
    if (!r || typeof r !== 'object') return at + 'not a rule'
    const w = r.when; if (!w || !T.when.includes(w.e)) return at + 'when: one of ' + T.when.join(', ')
    if (w.e === 'timer' && !int(w.every, LIMITS.timerMin, 86400)) return at + 'timer: every 10 to 86400 seconds'
    if (w.e === 'command' && !/^[a-z][a-z0-9]{0,15}$/.test(String(w.name || ''))) return at + 'command: a word (letters and digits, up to 16)'
    const ifs = r.if || [], dos = r.do || []
    if (!Array.isArray(ifs) || ifs.length > LIMITS.ifs) return at + 'if: up to ' + LIMITS.ifs
    if (!Array.isArray(dos) || dos.length > LIMITS.dos || !dos.length) return at + 'do: 1 to ' + LIMITS.dos + ' actions'
    const zone = ifs.find((c) => c && c.k === 'zone')
    const checkIf = (c, depth = 0) => {
      if (!c || !T.if.includes(c.k)) return 'if: one of ' + T.if.join(', ')
      if (c.k === 'player' && !str(c.is, 20)) return 'if player: a name'
      if (c.k === 'block' && !int(c.is, 0, 65535)) return 'if block: a block id'
      if (c.k === 'zone' && ![c.x0, c.y0, c.z0, c.x1, c.y1, c.z1].every((n) => int(n))) return 'if zone: two corners'
      if (c.k === 'count' && (!['place', 'break', 'chat'].includes(c.of) || !int(c.over, 1, 10000) || !int(c.per, 1, 3600))) return 'if count: of place/break/chat, over n, per seconds'
      if (c.k === 'not') return depth ? 'if not: only one level' : checkIf(c.c, 1)
      return null
    }
    for (const c of ifs) { const why = checkIf(c); if (why) return at + why }
    for (const d of dos) {
      if (!d || !T.do.includes(d.a)) return at + 'do: one of ' + T.do.join(', ')
      if (['say', 'tell', 'announce'].includes(d.a) && (!str(d.text) || !String(d.text).trim())) return at + 'do ' + d.a + ': some text'
      if (d.a === 'tp' && ![d.x, d.y, d.z].every((n) => int(n))) return at + 'do tp: x y z'
      if (d.a === 'mute' && typeof d.on !== 'boolean') return at + 'do mute: on or off'
      if (d.a === 'set') {
        if (![d.x, d.y, d.z].every((n) => int(n)) || !int(d.id, 0, 65535)) return at + 'do set: x y z and a block id'
        if (tier === 'kid' && !(zone && inZone(zone, d))) return at + 'do set: kids may only set blocks inside the rule\'s own zone'
      }
    }
  }
  return null
}
const inZone = (z, p) => p.x >= Math.min(z.x0, z.x1) && p.x <= Math.max(z.x0, z.x1) && p.y >= Math.min(z.y0, z.y1) && p.y <= Math.max(z.y0, z.y1) && p.z >= Math.min(z.z0, z.z1) && p.z <= Math.max(z.z0, z.z1)

const fill = (text, ev) => String(text).replace(/\{(player|block|x|y|z|count)\}/g, (_, k) => (ev[k] === undefined ? '' : String(ev[k])))

// The runner. plugins: [plugin] (only those with on: true run). now(): ms.
// fire(ev) -> { actions: [ { a, ..., to: playerId? } ], denied: bool }
//   ev: { e, player: { id, name, owner }, x, y, z, block, text, name(command) }
export function makeRunner({ now = Date.now } = {}) {
  let list = []
  const counts = new Map()   // playerId|kind -> [times]
  const timers = []          // { plugin, rule, next }
  function load(plugins) {
    list = plugins.filter((p) => p && p.on && Array.isArray(p.rules))
    timers.length = 0
    const t = now()
    for (const p of list) for (const r of p.rules) if (r.when && r.when.e === 'timer') timers.push({ p, r, next: t + r.when.every * 1000 })
  }
  function note(ev) {
    if (!ev.player || !['place', 'break', 'chat'].includes(ev.e)) return
    const k = ev.player.id + '|' + ev.e, t = now(), arr = (counts.get(k) || []).filter((x) => t - x < 3600000); arr.push(t); counts.set(k, arr)
  }
  const countOf = (ev, c) => { if (!ev.player) return 0; const t = now(); return (counts.get(ev.player.id + '|' + c.of) || []).filter((x) => t - x < c.per * 1000).length }
  function test(c, ev) {
    switch (c.k) {
      case 'owner': return !!(ev.player && ev.player.owner)
      case 'player': return !!(ev.player && String(ev.player.name).toLowerCase() === String(c.is).toLowerCase())
      case 'block': return ev.block === c.is
      case 'zone': return Number.isFinite(ev.x) && inZone(c, ev)
      case 'count': { const n = countOf(ev, c); ev.count = n; return n > c.over }
      case 'not': return !test(c.c, ev)
    }
    return false
  }
  function fire(ev) {
    note(ev)
    const out = [], denied = { v: false }
    for (const p of list) for (const r of p.rules) {
      const w = r.when
      if (w.e !== ev.e) continue
      if (w.e === 'command' && w.name !== ev.name) continue
      if (!(r.if || []).every((c) => test(c, ev))) continue
      for (const d of r.do) {
        if (out.length >= LIMITS.actionsPerEvent) return { actions: out, denied: denied.v }
        if (d.a === 'deny') { denied.v = true; continue }
        const to = ev.player ? ev.player.id : undefined
        if (['say', 'tell', 'announce'].includes(d.a)) out.push({ a: d.a, text: fill(d.text, { ...ev, player: ev.player && ev.player.name }), to, plugin: p.id })
        else if (d.a === 'tp') out.push({ a: 'tp', x: d.x, y: d.y, z: d.z, to, plugin: p.id })
        else if (d.a === 'set') out.push({ a: 'set', x: d.x, y: d.y, z: d.z, id: d.id, plugin: p.id })
        else out.push({ ...d, to, plugin: p.id })
      }
    }
    return { actions: out, denied: denied.v }
  }
  // call often (every second is fine): -> actions from timers that came due
  function tick() {
    const t = now(), out = []
    for (const tm of timers) if (t >= tm.next) { tm.next = t + tm.r.when.every * 1000; const r = fire({ e: 'timer', name: tm.p.id }); out.push(...r.actions) }
    return out
  }
  return { load, fire, tick, get active() { return list.map((p) => p.id) } }
}

// Starter plugins (the editor's "examples"); all pass the kid tier except where noted
export const EXAMPLES = [
  { id: 'welcome', name: 'Welcome', by: 'bertopia', about: 'Says hello to everyone who joins.', on: true, v: 1, rules: [{ when: { e: 'join' }, if: [], do: [{ a: 'tell', text: 'Welcome, {player}! Type /help to see what you can do.' }] }] },
  { id: 'no-dig-here', name: 'No digging here', by: 'bertopia', about: 'Breaking blocks in the marked zone is refused.', on: false, v: 1, rules: [{ when: { e: 'break' }, if: [{ k: 'zone', x0: -10, y0: 0, z0: -10, x1: 10, y1: 100, z1: 10 }, { k: 'not', c: { k: 'owner' } }], do: [{ a: 'deny' }, { a: 'tell', text: 'This spot is kept as it is.' }] }] },   // adult (deny, owner)
  { id: 'dinner-bell', name: 'Dinner bell', by: 'bertopia', about: 'Every 10 minutes, a friendly reminder.', on: false, v: 1, rules: [{ when: { e: 'timer', every: 600 }, if: [], do: [{ a: 'say', text: 'Stretch, drink some water, look away from the screen.' }] }] },
  { id: 'hi-command', name: '/hi', by: 'bertopia', about: 'Adds a /hi command that waves.', on: false, v: 1, rules: [{ when: { e: 'command', name: 'hi' }, if: [], do: [{ a: 'say', text: '{player} waves 👋' }] }] },
]
