// Personal-host client (docs/bertopia/HOME-HOST.md). Imported from main.js ONLY inside `if (__HOME_HOST__)`, so esbuild
// drops this whole file from the student doors; tools/home-leak-check.mjs proves it. Adults 18+, non-school.
//
// What it does: before the world loads, a join screen (server address, session code, display name, one-time 18+
// confirm) asks the host for a ticket, opens the socket, and keeps it alive. An "owner" ticket (from the owner page)
// skips the screen. homeOwnerOn() is the home build's answer to teacherOn(): true only when the server's hello said
// this socket has the staff role. A version mismatch shows an Update card instead of connecting. The personal host is
// adults-only and its own text is English-only (Diego, Nov 1); the game itself keeps all its languages.
import { setHomeEndpoints } from '../classnet/config.js'
import { Rules } from '../rules.js'
import { ITEMS } from '../data/items.js'
import { RECIPES } from '../data/recipes.js'
import { EXTRA } from '../strings-extra.js'
import { DECAY_ITEMS, DECAY_RECIPES, DECAY_STRINGS, compost, say } from './decay.js'

// Home-only rules (docs §5). Registered from here, so the student build never has them. The personal host is
// adults-only and English-only (Diego, Nov 1): labels are English; the game falls back to English for every language.
// Decay (food rots, the bag wears): the two home items, the Bag patch recipe and their English words, added at boot.
// Called from registerHomeRules (main.js boot, under __HOME_HOST__), before the world and the craft list exist.
let decayIn = false
function registerDecay() {
  if (decayIn) return
  for (const [k, def] of Object.entries(DECAY_ITEMS)) if (!ITEMS[k]) ITEMS[k] = def
  for (const r of DECAY_RECIPES) if (!RECIPES.some((x) => x.id === r.id)) RECIPES.push(r)
  if (EXTRA.en) for (const k of ['rotten', 'bagPatch']) if (!EXTRA.en[k]) EXTRA.en[k] = DECAY_STRINGS[k]   // item names: the game looks them up by key
  decayIn = true
}
export const homeCompostCrop = (crop, cap) => compost(crop, cap) > 0
export const homeSay = say
export function registerHomeRules() {
  registerDecay()
  Rules.register({ id: 'combat.pvp', type: 'bool', def: false, group: 'combat', display: 'survival', icon: '⚔',
    label: { en: 'Player fights' },
    desc: { en: 'Players can hit each other.' } })
  Rules.register({ id: 'survival.keep', type: 'bool', def: true, group: 'survival', display: 'survival', icon: '🎒',
    label: { en: 'Keep inventory' },
    desc: { en: 'Players keep their bag and items. The host can set it for the whole world or one player.' } })
  Rules.register({ id: 'chat.typed', type: 'bool', def: true, group: 'core', display: 'effects', icon: '💬',
    label: { en: 'World chat' },
    desc: { en: 'Everyone in the world can type messages (200 characters, never saved).' } })
}
// The server's ruleset: applied to the game's own Rules (which already enforce locally) and announced with a calm toast.
export const RULE_TOAST = { en: 'Rules changed: {r}' }
let onRules = null
export function onHomeRules(fn) { onRules = fn }
// The owner's in-game editor (rules-editor.js) calls Rules.set(); at home the server is the authority, so when the owner
// is in, every set is also sent to the host, which validates it, bumps rev and broadcasts. Players never get this hook.
let ownerApi = null   // { base, token } from the owner page (sessionStorage), present only for the owner's own session
let wrapped = false
export function armOwnerEditor() {
  if (wrapped || !homeOwnerOn()) return
  try { ownerApi = JSON.parse(sessionStorage.getItem('bt-home-owner-api') || 'null') } catch (e) {}
  if (!ownerApi || !ownerApi.token) return
  const real = Rules.set
  Rules.set = (id, v) => { const out = real(id, v); try { fetch(ownerApi.base + '/owner/rule', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': ownerApi.token }, body: JSON.stringify({ id, v: out }) }).catch(() => {}) } catch (e) {} return out }
  wrapped = true
}
// Keep inventory for THIS player, as the server last said (the world's value or the owner's choice for this player).
// The game has no way to lose items yet, so ON is how it already plays; a future faint/drop asks homeKeep() first.
let keep = { on: true, from: 'world' }
export const homeKeep = () => ({ ...keep })
export function applyHomeRules(f, toast, lang) {
  if (!f || !f.r) return
  chatLang = lang || 'en'
  const r = { ...f.r }; const mode = r.mode; delete r.mode
  setChatOn(r['chat.typed'] === true)
  try { Rules.load(r) } catch (e) {}
  keep = { on: r['survival.keep'] !== false, from: f.keep === 'player' ? 'player' : 'world' }
  if (info) { info.ruleset = f.preset; info.mode = mode; info.locked = !!f.locked; info.rulesRev = f.rev }
  if (onRules) try { onRules({ preset: f.preset, mode, locked: !!f.locked, rev: f.rev, r }) } catch (e) {}
  if (toast && f.rev > 1) toast((RULE_TOAST[lang] || RULE_TOAST[(lang || '').split('-')[0]] || RULE_TOAST.en).replace('{r}', homeRuleName(f.preset)))
}
const KEY_ADULTS = 'bt-home-adults'
const KEY_LAST = 'bt-home-last'           // last server address + display name (no code, no ticket)
let sock = null, hello = null, info = null, q = 0

const S = {
  en: { title: 'Join a home server', intro: 'Run by a person you know, not by the school.', addr: 'Server address', code: 'Session code', name: 'Display name', pw: 'Password (the host set one)', adults: 'This server is for adults 18+. I confirm I am 18 or older.', join: 'Join', asking: 'Asking the host…', in: 'In world “{w}” as {n}', update: 'Your game needs an update to join this server.', updateHow: 'The server runs {s}; this game is {c}. Reload the page from the host address.', retry: 'Try again', solo: 'Play alone instead', rules: 'Rules: {r}',
    errs: { code: 'That session code is not right.', ended: 'There is no session running. Ask the host to start one.', password: 'That password is not right.', adults: 'Please confirm you are 18 or older.', name: 'Names are 2 to 20 letters, digits, spaces, _ or -.', 'name-reserved': 'That name looks like a host or owner name. Pick another.', 'name-filtered': 'That name is not allowed here. Pick another.', 'name-taken': 'That name is taken in this session.', full: 'The server is full right now.', 'too-many': 'Too many connections from your network.', banned: 'You cannot join this session.', 'slow-down': 'Too many tries. Wait a few minutes.', 'no-owner': 'The owner is not in the world yet. Ask them to press “Play as owner”.', network: 'Could not reach that server address.' } },
}
const RULE_NAMES = { 'home-school': 'Same as school', 'home-survival': 'Survival', 'home-creative': 'Creative', 'home-peaceful': 'Peaceful', 'home-pvp': 'PvP on', 'home-hardcore': 'Hardcore' }
const str = (lang) => ({ ...S.en, lang })   // English-only (adults 18+, Diego Nov 1)
const fill = (s, m) => s.replace(/\{(\w)\}/g, (_, k) => m[k])

export const isHomePage = () => typeof document !== 'undefined' && !!document.querySelector('meta[name="bertopia-home"]')
export const homeOwnerOn = () => !!(hello && hello.role !== 'k')
export const homeInfo = () => info
export const homeSocket = () => sock

// ws:// is accepted only for this machine and private networks; anything else must be wss:// (README: TLS proxy).
export function homeWsOk(u) {
  let url; try { url = new URL(u) } catch (e) { return false }
  if (url.protocol === 'wss:') return true
  if (url.protocol !== 'ws:') return false
  const h = url.hostname
  return h === 'localhost' || h === '127.0.0.1' || /^10\./.test(h) || /^192\.168\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h) || /^\[?fe80:/i.test(h) || /^\[?::1\]?$/.test(h)
}

function card(html) {
  let root = document.getElementById('home-join')
  if (!root) {
    root = document.createElement('div'); root.id = 'home-join'
    root.style.cssText = 'position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;background:#0b1220;color:#f8fafc;font:17px/1.5 system-ui,sans-serif'
    document.body.appendChild(root)
  }
  root.innerHTML = html
  return root
}
const css = `<style>#home-join .hc{background:#111a2e;border:1px solid #22304d;border-radius:16px;padding:22px 24px;width:min(92vw,440px)}
#home-join h1{font-size:20px;margin:0 0 6px}#home-join p,#home-join label{color:#94a3b8;margin:6px 0;display:block}
#home-join input[type=text],#home-join input[type=password]{width:100%;min-height:48px;font:18px system-ui;background:#0b1220;color:#f8fafc;border:1px solid #475569;border-radius:12px;padding:0 12px;margin:4px 0 10px;box-sizing:border-box}
#home-join #hj-code{font-size:24px;letter-spacing:4px;text-transform:uppercase;text-align:center}
#home-join .ad{display:flex;gap:10px;align-items:flex-start;background:#0b1220;border:1px solid #475569;border-radius:12px;padding:10px 12px;margin:6px 0 12px;color:#f8fafc}#home-join .ad input{width:24px;height:24px;margin:2px 0 0;flex:0 0 24px}
#home-join button{width:100%;min-height:52px;font:inherit;font-weight:600;background:#134e4a;color:#f8fafc;border:1px solid #2dd4bf;border-radius:12px;cursor:pointer;margin-top:6px}#home-join button.alt{background:#1e293b;border-color:#475569}
#home-join button:focus-visible,#home-join input:focus-visible{outline:3px solid #2dd4bf;outline-offset:2px}#home-join .out{margin-top:12px;min-height:1.5em}#home-join .bad{color:#f87171}#home-join .ok{color:#4ade80}
@media (prefers-reduced-motion:no-preference){#home-join button:active{transform:scale(.99)}}</style>`

// Resolves to { ticket, ws, name, world, ruleset, version } once in, or null if the player chose solo play.
export function homeJoinScreen({ lang = 'en', version = '' } = {}) {
  const T = str(lang)
  const rtl = /^(ar|fa)/.test(lang)
  let last = {}; try { last = JSON.parse(localStorage.getItem(KEY_LAST) || '{}') } catch (e) {}
  const owner = (() => { try { const o = JSON.parse(sessionStorage.getItem('bt-home-owner-ticket') || 'null'); sessionStorage.removeItem('bt-home-owner-ticket'); return o } catch (e) { return null } })()
  return new Promise((resolve) => {
    if (owner && owner.ticket) { connect(owner, T, version, resolve); return }
    const root = card(css + `<div class="hc" dir="${rtl ? 'rtl' : 'ltr'}"><h1>${T.title}</h1><p>${T.intro}</p>
      <label for="hj-addr">${T.addr}</label><input type="text" id="hj-addr" autocomplete="off" spellcheck="false" value="${(last.addr || location.origin).replace(/"/g, '')}">
      <label for="hj-code">${T.code}</label><input type="text" id="hj-code" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="ABCD EFGH">
      <label for="hj-name">${T.name}</label><input type="text" id="hj-name" maxlength="20" autocomplete="off" value="${(last.name || '').replace(/"/g, '')}">
      <div id="hj-pwrow" hidden><label for="hj-pw">${T.pw}</label><input type="password" id="hj-pw" autocomplete="off"></div>
      <label class="ad"><input type="checkbox" id="hj-adults"><span>${T.adults}</span></label>
      <button id="hj-go">${T.join}</button><button id="hj-solo" class="alt">${T.solo}</button><div class="out" id="hj-out" aria-live="polite"></div></div>`)
    const $ = (id) => root.querySelector('#' + id)
    try { if (sessionStorage.getItem(KEY_ADULTS) === '1') $('hj-adults').checked = true } catch (e) {}
    $('hj-solo').onclick = () => { root.remove(); resolve(null) }
    $('hj-code').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('hj-go').click() })
    $('hj-go').onclick = async () => {
      const base = $('hj-addr').value.trim().replace(/\/+$/, '')
      const body = { code: $('hj-code').value.trim().replace(/\s|-/g, '').toUpperCase(), name: $('hj-name').value, password: $('hj-pw').value || undefined, adults: $('hj-adults').checked }
      if (!/^https?:\/\//.test(base)) { badText($('hj-out'), 'http:// …'); return }
      $('hj-out').textContent = T.asking
      let j
      try { j = await (await fetch(base + '/join', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })).json() } catch (e) { j = { error: 'network' } }
      if (j.error) { if (j.error === 'password') $('hj-pwrow').hidden = false; badText($('hj-out'), errText(T, j.error) + (j.wait ? ' (' + Number(j.wait) + ' s)' : '')); return }
      if (version && j.version && j.version !== version) { updateCard(root, T, j.version, version, () => location.reload()); return }
      try { sessionStorage.setItem(KEY_ADULTS, '1'); localStorage.setItem(KEY_LAST, JSON.stringify({ addr: base, name: j.name })) } catch (e) {}
      connect(j, T, version, resolve, root)
    }
  })
}

function updateCard(root, T, server, client, retry) {
  root.innerHTML = css + `<div class="hc"><h1>⟳ ${T.update}</h1><p></p><button id="hj-retry">${T.retry}</button></div>`
  root.querySelector('.hc p').textContent = fill(T.updateHow, { s: String(server), c: String(client) })   // the server's words are text, never HTML
  root.querySelector('#hj-retry').onclick = retry
}

let toastFn = null
// Replies come from whatever address was typed: show them as text only, and look messages up as own keys only.
const errText = (T, code) => (Object.prototype.hasOwnProperty.call(T.errs, code) ? T.errs[code] : String(code))
function badText(el, text) { el.textContent = ''; const sp = document.createElement('span'); sp.className = 'bad'; sp.textContent = text; el.append(sp) }
export function setHomeToast(fn) { toastFn = fn }
function connect(j, T, version, resolve, root) {
  if (!homeWsOk(j.ws)) { (root || card(css)).querySelector('.out, .hc').innerHTML += '<span class="bad">ws:// is only for this machine or a home network.</span>'; return }
  if (sock) try { sock.close() } catch (e) {}
  hello = null; info = { name: j.name, world: j.world, ruleset: j.ruleset, ws: j.ws, server: j.version }
  setHomeEndpoints({ ws: j.ws, join: j.ws.replace(/^ws/, 'http').replace(/\/rt\/ws$/, '/join') })
  sock = new WebSocket(j.ws, ['bt-room.v0', j.ticket])
  sock.onmessage = (m) => { let f; try { f = JSON.parse(m.data) } catch (e) { return } if (f.t === 'hello') { hello = f; shareHello(f); if (root) root.remove(); resolve({ ...j, hello: f }) } else if (f.t === 'frz') { info.frozen = !!f.on } else if (f.t === 'rules') { applyHomeRules(f, toastFn, T.lang) } else homeFrame(f) }
  sock.onclose = (e) => { if (!hello && root && root.querySelector('#hj-out')) badText(root.querySelector('#hj-out'), e.reason ? errText(T, e.reason) : T.errs.network); hello = null }
  sock.onerror = () => {}
  const beat = setInterval(() => { if (!sock || sock.readyState !== 1) return clearInterval(beat); try { sock.send(JSON.stringify({ v: 0, t: 'ping', n: ++q })) } catch (e) {} }, 10000)
}

// The game calls these from its own loops when it has something to send (positions, edits); part 3/4 extend the set.
export function homeSend(frame) { if (sock && sock.readyState === 1) sock.send(JSON.stringify({ v: 0, ...frame })) }
export function homeLeave() { if (sock) try { sock.close(1000, 'bye') } catch (e) {} sock = null; hello = null; info = null }
export const homeRuleName = (id, lang) => (RULE_NAMES[id] || id || '').replace('home-', '')
export const homeStrings = S

// ---------------------------------------------------------------- typed chat (docs §6) — home only
// Shown only while the server's ruleset has chat.typed on (every preset starts with it off). Plain text both ways:
// messages are written with textContent, never as HTML. The server filters, limits and relays; nothing is stored.
const C = {
  en: { chat: 'Chat', send: 'Send', ph: 'Say something (200 max)', close: 'Close chat', unread: '{n} new', errs: { 'chat-slow': 'Slow down: wait {s} s.', 'chat-long': '200 characters at most.', 'chat-muted': 'The host muted you.', 'rule:chat.typed': 'Chat is off.', 'chat-empty': 'Type something first.' },
    bossStart: '{n} started a Foundry Overseer fight. Come help!', bossLive: '{n} is fighting the Foundry Overseer.', bossEnd: 'The Foundry Overseer fight is over.', bossWon: 'The Foundry Overseer was rebooted!' },
}
let chatLang = 'en'   // kept for the call shape; the personal host is English-only
const cs = () => C.en
const fillAll = (s, m) => String(s).replace(/\{(\w+)\}/g, (_, k) => (m[k] === undefined ? '' : String(m[k])))
const CHAT_LINES = 50
let dock = null, chatOn = false, unread = 0
function ensureDock() {
  if (dock || typeof document === 'undefined') return dock
  const T = cs()
  dock = document.createElement('div'); dock.id = 'home-chat'; dock.dir = document.documentElement.dir || 'ltr'
  dock.innerHTML = '<style>#home-chat{position:fixed;inset-inline-start:12px;top:38%;z-index:40;font:14px/1.35 system-ui,sans-serif;color:#f8fafc;max-width:calc(100vw - 24px)}#home-chat button,#home-chat input{min-height:44px;min-width:44px;border-radius:10px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font:inherit;padding:0 12px}#home-chat button:focus-visible,#home-chat input:focus-visible{outline:3px solid #2dd4bf;outline-offset:2px}#home-chat .hc-panel{margin-top:8px;width:min(320px,calc(100vw - 24px));background:#0f172a;border:1px solid #475569;border-radius:12px;padding:8px;box-sizing:border-box}#home-chat .hc-log{max-height:28vh;overflow-y:auto;margin:0 0 8px;padding:0;list-style:none;overflow-wrap:anywhere}#home-chat .hc-log li{padding:2px 0}#home-chat .hc-row{display:flex;gap:6px}#home-chat .hc-row input{flex:1;min-width:0}#home-chat .hc-msg{color:#fde68a;min-height:1.2em;margin:4px 0 0}#home-chat b{color:#5eead4}</style>' +
    '<button type="button" class="hc-toggle" aria-expanded="false" aria-controls="hc-panel"></button>' +
    '<div class="hc-panel" id="hc-panel" hidden><ul class="hc-log" aria-live="polite" aria-relevant="additions"></ul><form class="hc-row"><input type="text" maxlength="200" autocomplete="off" enterkeyhint="send"><button type="submit"></button></form><p class="hc-msg" role="status"></p></div>'
  const toggle = dock.querySelector('.hc-toggle'), panel = dock.querySelector('.hc-panel'), input = dock.querySelector('input'), form = dock.querySelector('form')
  input.setAttribute('aria-label', T.ph); input.placeholder = T.ph; form.querySelector('button').textContent = T.send
  toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) { unread = 0; input.focus() } paintToggle() }
  // keys typed here are chat, not game controls
  for (const ev of ['keydown', 'keyup', 'keypress']) input.addEventListener(ev, (e) => { e.stopPropagation(); if (e.type === 'keydown' && e.key === 'Escape') { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); paintToggle() } })
  form.onsubmit = (e) => { e.preventDefault(); const m = input.value.trim(); if (!m) return chatSay(cs().errs['chat-empty']); homeSend({ t: 'chat', m: m.slice(0, 200) }); input.value = ''; chatSay('') }
  document.body.append(dock); paintToggle()
  return dock
}
function paintToggle() { if (!dock) return; const T = cs(), b = dock.querySelector('.hc-toggle'); b.textContent = '💬 ' + T.chat + (unread ? ' · ' + fillAll(T.unread, { n: unread }) : ''); b.setAttribute('aria-label', b.textContent) }
function chatSay(text) { if (dock) dock.querySelector('.hc-msg').textContent = text }
function setChatOn(on) {
  chatOn = !!on
  if (chatOn) { ensureDock(); if (dock) dock.hidden = false }
  else if (dock) { dock.hidden = true; dock.querySelector('.hc-panel').hidden = true; dock.querySelector('.hc-toggle').setAttribute('aria-expanded', 'false') }
}
function chatLine(f) {
  if (!chatOn || !ensureDock()) return
  const log = dock.querySelector('.hc-log'), li = document.createElement('li'), who = document.createElement('b')
  who.textContent = String(f.a || '') + ': '; li.append(who, document.createTextNode(String(f.m || '')))
  log.append(li); while (log.children.length > CHAT_LINES) log.firstChild.remove()
  log.scrollTop = log.scrollHeight
  if (dock.querySelector('.hc-panel').hidden) { unread = Math.min(99, unread + 1); paintToggle() }
}
function chatRefused(f) { const T = cs(); chatSay(fillAll(T.errs[f.c] || T.errs['rule:chat.typed'], { s: f.wait || 2 })) }

// ---------------------------------------------------------------- shared boss news (docs §7) — home only
// Mobs stay local to each game; the fight itself is news. main.js calls homeBossTick() with the local Overseer (or
// null) at the boss bar's own 4 Hz; this sends start / phase / end to the host, at most one phase note per 3 s.
let bossMine = null, bossLast = 0, bossPending = null, bossLive = null
const BOSS_GAP_MS = 3000
export function homeBossTick(boss) {
  if (!sock || sock.readyState !== 1 || !hello) return
  const t = Date.now()
  if (boss && boss.hp > 0) {
    const pct = Math.min(100, Math.ceil(4 * Math.max(0, boss.hp) / (boss.maxHp || 1)) * 25), phase = Math.min(3, Math.max(1, boss.phase || 1))
    if (!bossMine || bossMine.id !== boss.id) { bossMine = { id: boss.id, phase, pct }; bossPending = null; bossLast = t; homeSend({ t: 'ev', k: 'boss', a: 'start', phase, pct }); return }
    if (phase !== bossMine.phase || pct !== bossMine.pct) { bossMine.phase = phase; bossMine.pct = pct; bossPending = { phase, pct } }
    if (bossPending && t - bossLast >= BOSS_GAP_MS) { homeSend({ t: 'ev', k: 'boss', a: 'phase', ...bossPending }); bossPending = null; bossLast = t }
    return
  }
  if (bossMine) { homeSend({ t: 'ev', k: 'boss', a: 'end', won: !!(boss && boss.hp <= 0) || bossMine.pct <= 25 }); bossMine = null; bossPending = null }
}
export const homeBossLive = () => bossLive
function bossNews(f) {
  if (f.k !== 'boss') return
  const T = cs(), me = info && f.by === info.name
  if (f.a === 'start' || f.a === 'live') { bossLive = { by: f.by, phase: f.phase, pct: f.pct }; if (!me && toastFn) toastFn(fillAll(f.a === 'start' ? T.bossStart : T.bossLive, { n: f.by })) }
  else if (f.a === 'phase') bossLive = { by: f.by, phase: f.phase, pct: f.pct }
  else if (f.a === 'end') { bossLive = null; if (!me && toastFn) toastFn(f.won ? T.bossWon : T.bossEnd) }
}
// the socket's home-only frames (called from connect's onmessage)
function homeFrame(f) {
  if (shareFrame(f)) return
  if (f.t === 'chat') chatLine(f)
  else if (f.t === 'ev') bossNews(f)
  else if (f.t === 'no' && typeof f.c === 'string' && (f.c.startsWith('chat-') || f.c === 'rule:chat.typed')) chatRefused(f)
}


// ---------------------------------------------------------------- shared world (part 7) — home only
// The host's map is the map: the game asks for every changed cell once ({t:'all'}), applies them over the same
// generated terrain, then applies live ops ({t:'o'}) after that point. Your edits go to the host ({t:'b'}), paced
// under the server's edit rate; a refused one is put back. Positions go out ~5 times a second; the other players
// come in through hello / join / leave / snapshots. main.js wires these into the game behind __HOME_HOST__.
const EDITS_PER_SEC = 8, POS_MS = 200
let world = null              // { head, cells } once the download finished
let worldWait = null, worldBuf = null, worldParts = null, heldOps = []
let opsFn = null, resyncFn = null, refusedFn = null
const others = new Map()      // id -> { a, x, y, z, r, f, at }
let posQ = 0, lastPos = null, lastPosAt = 0
const editQ = [], pendingEdits = new Map()
let editTimer = null

function shareHello(f) {
  others.clear()
  for (const p of f.players || []) others.set(p.i, { a: p.a, ...(Array.isArray(p.p) ? posOf(p.p) : {}), at: Date.now() })
  askWorld()
}
const posOf = (a) => ({ x: a[0], y: a[1], z: a[2], r: a[3], f: a[4] })
function askWorld() { worldParts = []; worldBuf = null; heldOps = []; homeSend({ t: 'all' }) }
function shareFrame(f) {
  if (f.t === 'all') {
    if (!worldParts) worldParts = []
    worldParts[f.i] = f.c
    if (worldParts.filter(Boolean).length === f.n) {
      const fresh = { head: f.s, cells: [].concat(...worldParts) }
      const again = !!world; world = fresh; worldParts = null
      const later = heldOps.filter((o) => o[0] > fresh.head); heldOps = []
      if (again && resyncFn) resyncFn(fresh.cells)
      if (worldWait) { worldWait(fresh); worldWait = null }
      if (later.length && opsFn) opsFn(later)
    }
    return true
  }
  if (f.t === 'o') { if (!world || worldParts) heldOps.push(...f.o); else if (opsFn) opsFn(f.o); for (const o of f.o) pendingEdits.delete(o[1] + ',' + o[2] + ',' + o[3]); return true }
  if (f.t === 'rs') { askWorld(); return true }
  if (f.t === 'join') { others.set(f.i, { a: f.a, at: Date.now() }); return true }
  if (f.t === 'leave') { others.delete(f.i); return true }
  if (f.t === 's') {
    if (f.f) for (const id of [...others.keys()]) if (!f.p.some((p) => p[0] === id)) others.delete(id)
    for (const p of f.p) { const o = others.get(p[0]) || { a: '' }; Object.assign(o, posOf(p.slice(1)), { at: Date.now() }); others.set(p[0], o) }
    return true
  }
  if (f.t === 'no' && Number.isInteger(f.x) && Number.isInteger(f.y) && Number.isInteger(f.z)) {
    const k = f.x + ',' + f.y + ',' + f.z, was = pendingEdits.get(k)
    if (was !== undefined) { pendingEdits.delete(k); if (refusedFn) refusedFn(f.x, f.y, f.z, Number.isInteger(f.cur) ? f.cur : was, f.c) }
    return true
  }
  return false
}
// true while this game is joined to a home server (main.js then plays the host's map)
export const homeShared = () => !!(sock && hello)
// the map, once: -> Promise<{ head, cells: [[x,y,z,id], ...] }>
export function homeWorld() { return world && !worldParts ? Promise.resolve(world) : new Promise((r) => { worldWait = r }) }
export function onHomeOps(fn) { opsFn = fn }            // fn([[s,x,y,z,id], ...]) live edits, yours included (echo)
export function onHomeResync(fn) { resyncFn = fn }      // fn(cells) the map again after a gap
export function onHomeRefused(fn) { refusedFn = fn }    // fn(x,y,z,idToPutBack,code)
// one local edit -> the host. b = the block it replaced (the host checks it). Paced at 8/s; a position goes first.
export function homeEdit(x, y, z, id, b) {
  if (!homeShared()) return
  editQ.push({ x, y, z, id, b }); pendingEdits.set(x + ',' + y + ',' + z, b)
  if (!editTimer) drainEdits()
}
function drainEdits() {
  if (!editQ.length || !homeShared()) { editTimer = null; return }
  if (lastPos) sendPos(true)
  const e = editQ.shift()
  homeSend({ t: 'b', x: e.x, y: e.y, z: e.z, id: e.id, b: e.b })
  editTimer = setTimeout(drainEdits, 1000 / EDITS_PER_SEC)
}
// the local player's spot; sent at most every 200 ms (or right before an edit, so the host's reach check is fresh)
export function homePos(x, y, z, r, flying) { lastPos = { x, y, z, r, f: flying ? 1 : 0 }; if (Date.now() - lastPosAt >= POS_MS) sendPos() }
function sendPos(force) {
  if (!lastPos || !homeShared()) return
  if (!force && Date.now() - lastPosAt < POS_MS) return
  lastPosAt = Date.now()
  homeSend({ t: 'p', q: ++posQ, x: lastPos.x, y: lastPos.y, z: lastPos.z, r: lastPos.r, f: lastPos.f })
}
// the other players for drawing: [{ id, name, x, y, z, r, f }] (only those with a known position)
export const homePlayers = () => [...others].filter(([, o]) => Number.isFinite(o.x)).map(([id, o]) => ({ id, name: o.a, x: o.x, y: o.y, z: o.z, r: o.r || 0, f: o.f || 0 }))
// the local save slot for this host's world: your bag and spot per host world, never your single-player world
export function homeSlot() {
  const k = String((info && info.ws) || '') + '|' + String((info && info.world) || '')
  let h = 0; for (let i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) >>> 0
  return 'home-' + h.toString(36)
}
