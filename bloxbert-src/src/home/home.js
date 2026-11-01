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
import { createBuilder } from './builder.js'

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
  if (Array.isArray(f.menu)) paintMenu(f.menu, Array.isArray(f.warps) ? f.warps : [])
  try { Rules.load(r) } catch (e) {}
  keep = { on: r['survival.keep'] !== false, from: f.keep === 'player' ? 'player' : 'world' }
  if (info) { info.ruleset = f.preset; info.mode = mode; info.locked = !!f.locked; info.rulesRev = f.rev }
  if (onRules) try { onRules({ preset: f.preset, mode, locked: !!f.locked, rev: f.rev, r }) } catch (e) {}
  if (toast && f.rev > 1) toast((RULE_TOAST[lang] || RULE_TOAST[(lang || '').split('-')[0]] || RULE_TOAST.en).replace('{r}', homeRuleName(f.preset)))
}
const KEY_ADULTS = 'bt-home-adults'
const KEY_LAST = 'bt-home-last'           // last server address + display name (no code, no ticket)
const KEY_AGAIN = 'bt-home-again'         // one-shot rejoin after a deliberate reload (this tab only, removed on read)
let codeNow = ''                          // the code this player joined with (memory only; written to KEY_AGAIN for a reload)
// Reload the game and come straight back in: the owner has its token, a player gets the code back once.
export function homeReload() {
  try { if (codeNow && !homeOwnerOn()) sessionStorage.setItem(KEY_AGAIN, JSON.stringify({ code: codeNow })) } catch (e) {}
  location.reload()
}
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
  // The owner's ticket is one-use, so a reload of the game tab (refresh, update, crash) used to drop the owner on the
  // guest join card. The owner page also left its 12-hour owner token in this tab: ask the host for a fresh owner
  // ticket with it instead. Host PC only (the server checks), and only on the ?owner=1 page the owner page opened.
  let ownerApiNow = null
  try { ownerApiNow = JSON.parse(sessionStorage.getItem('bt-home-owner-api') || 'null') } catch (e) {}
  if (owner && owner.name && ownerApiNow) try { sessionStorage.setItem('bt-home-owner-api', JSON.stringify({ ...ownerApiNow, name: owner.name })) } catch (e) {}
  const ownerAgain = !owner && /[?&]owner=1(&|$)/.test(location.search) && ownerApiNow && ownerApiNow.token ? ownerApiNow : null
  let again = null   // a one-shot rejoin after homeReload() (the touch setting needs a fresh page): same tab, used once
  try { again = JSON.parse(sessionStorage.getItem(KEY_AGAIN) || 'null'); sessionStorage.removeItem(KEY_AGAIN) } catch (e) {}
  return new Promise((resolve) => {
    if (owner && owner.ticket) { connect(owner, T, version, resolve); return }
    if (ownerAgain) {
      fetch(ownerAgain.base + '/owner/play', { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': ownerAgain.token }, body: JSON.stringify({ name: ownerAgain.name || 'Owner' }) })
        .then((r) => r.json()).catch(() => ({ error: 'network' }))
        .then((j) => { if (j && j.ticket) connect(j, T, version, resolve); else showCard(resolve) })
      return
    }
    showCard(resolve)
  })

  function showCard(resolve) {
    const root = card(css + `<div class="hc" dir="${rtl ? 'rtl' : 'ltr'}"><h1>${T.title}</h1><p>${T.intro}</p>
      <label for="hj-addr">${T.addr}</label><input type="text" id="hj-addr" autocomplete="off" spellcheck="false" value="${(last.addr || location.origin).replace(/"/g, '')}">
      <label for="hj-code">${T.code}</label><input type="text" id="hj-code" maxlength="9" autocomplete="off" autocapitalize="characters" placeholder="ABCD EFGH">
      <label for="hj-name">${T.name}</label><input type="text" id="hj-name" maxlength="20" autocomplete="off" value="${(last.name || '').replace(/"/g, '')}">
      <div id="hj-pwrow" hidden><label for="hj-pw">${T.pw}</label><input type="password" id="hj-pw" autocomplete="off"></div>
      <label class="ad"><input type="checkbox" id="hj-adults"><span>${T.adults}</span></label>
      <button id="hj-go">${T.join}</button><button id="hj-solo" class="alt">${T.solo}</button><div class="out" id="hj-out" aria-live="polite"></div></div>`)
    const $ = (id) => root.querySelector('#' + id)
    try { if (sessionStorage.getItem(KEY_ADULTS) === '1') $('hj-adults').checked = true } catch (e) {}
    if (again && again.code && !ownerAgain) { $('hj-code').value = String(again.code).slice(0, 9); $('hj-adults').checked = true; setTimeout(() => $('hj-go').click(), 50); again = null }
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
      codeNow = body.code
      connect(j, T, version, resolve, root)
    }
  }
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

// ---------------------------------------------------------------- Settings rows (home only; English, adults)
const TOUCH_KEY = 'bloxbert-touch'   // '' (auto) | 'on' | 'off' — main.js reads it at boot, before TOUCH_UI is fixed
export const homeTouchPref = () => { try { const v = localStorage.getItem(TOUCH_KEY); return v === 'on' || v === 'off' ? v : '' } catch (e) { return '' } }
const SET = { touch: 'Touch controls', touchHint: 'Auto picks by the device. On shows the stick and tap buttons; Off hides them (mouse and keys). Changing it reloads the game.', auto: 'Auto', on: 'On', off: 'Off', reload: 'Reloading…', host: 'This server', hostHint: 'Game mode, player fights and keep inventory are the host\'s rules for everyone here, not a device setting. The owner changes them with /rules or the owner page.', mode: 'Mode', pvp: 'Player fights', keep: 'Keep inventory', yes: 'on', no: 'off', you: ' (set for you)' }
export const homeSet = (k) => (Object.prototype.hasOwnProperty.call(SET, k) ? SET[k] : k)
export function homeSettings(g) {
  if (!hello || typeof document === 'undefined') return
  const line = (label) => { const row = document.createElement('div'); row.className = 'set-line'; row.style.flexWrap = 'wrap'; row.style.gap = '8px'; const lab = document.createElement('span'); lab.className = 'set-lab'; lab.textContent = label; row.append(lab); return row }
  const note = (text) => { const p = document.createElement('p'); p.className = 'gnote'; p.textContent = text; return p }
  // touch controls: three pills, one radiogroup
  const head = note(SET.touch); head.classList.add('ghead')
  const row = line(SET.touch), grp = document.createElement('div'); grp.setAttribute('role', 'radiogroup'); grp.setAttribute('aria-label', SET.touch); grp.style.display = 'flex'; grp.style.gap = '8px'
  const cur = homeTouchPref()
  for (const [v, word] of [['', SET.auto], ['on', SET.on], ['off', SET.off]]) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pill' + (v === cur ? ' on' : ''); b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', String(v === cur)); b.setAttribute('aria-label', SET.touch + ': ' + word)
    b.style.minHeight = '44px'; b.style.minWidth = '44px'; b.textContent = word; b.dataset.touch = v || 'auto'
    b.onclick = () => { if (v === cur) return; try { if (v) localStorage.setItem(TOUCH_KEY, v); else localStorage.removeItem(TOUCH_KEY) } catch (e) {} for (const k of grp.children) { k.classList.toggle('on', k === b); k.setAttribute('aria-checked', String(k === b)) } if (toastFn) toastFn(SET.reload); setTimeout(homeReload, 400) }
    grp.append(b)
  }
  row.append(grp)
  // what the host decides (read-only here)
  let pvp = false; try { pvp = Rules.value('combat.pvp') === true } catch (e) {}
  const r = { mode: info && info.mode, pvp, keep: keep.on }
  const hostHead = note(SET.host); hostHead.classList.add('ghead')
  const vals = note(SET.mode + ': ' + String(r.mode || '—') + ' · ' + SET.pvp + ': ' + (r.pvp ? SET.yes : SET.no) + ' · ' + SET.keep + ': ' + (r.keep ? SET.yes : SET.no) + (keep.from === 'player' ? SET.you : '')); vals.dataset.homeHost = '1'
  g.append(head, row, note(SET.touchHint), hostHead, vals, note(SET.hostHint))
}
// the Mode panel: at home the mode is the host's; only the Build Table is a local choice
export const homeModeNote = () => (hello ? SET.hostHint : '')
// the World panel: this world lives on the host; the owner's Download/Import are on the owner page
export const homeWorldNote = () => (hello ? 'This world lives on the host and is shared by everyone here. Loading, importing or starting a fresh world happens on the owner page, not on your device. Export saves a copy of what you have seen.' : '')
// after the join: no school hub to go back to
export function homeTrimHud() {
  if (!hello || typeof document === 'undefined') return
  const hub = document.getElementById('hub-back'); if (hub) hub.hidden = true
}

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
  dock.innerHTML = '<style>#home-chat{position:fixed;inset-inline-start:12px;top:38%;z-index:40;font:14px/1.35 system-ui,sans-serif;color:#f8fafc;max-width:calc(100vw - 24px)}#home-chat button,#home-chat input{min-height:44px;min-width:44px;border-radius:10px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font:inherit;padding:0 12px}#home-chat button:focus-visible,#home-chat input:focus-visible{outline:3px solid #2dd4bf;outline-offset:2px}#home-chat .hc-panel{margin-top:8px;width:min(320px,calc(100vw - 24px));background:#0f172a;border:1px solid #475569;border-radius:12px;padding:8px;box-sizing:border-box}#home-chat .hc-log{max-height:28vh;overflow-y:auto;margin:0 0 8px;padding:0;list-style:none;overflow-wrap:anywhere}#home-chat .hc-log li{padding:2px 0}#home-chat .hc-row{display:flex;gap:6px}#home-chat .hc-row input{flex:1;min-width:0}#home-chat .hc-msg{color:#fde68a;min-height:1.2em;margin:4px 0 0}#home-chat b{color:#5eead4}#home-chat .hc-cmds{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}#home-chat .hc-cmds button{padding:0 10px;font-size:13px}#home-chat .hc-pick{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 8px}@media (max-width:480px){#home-chat{top:50%}}</style>' +
    '<button type="button" class="hc-toggle" aria-expanded="false" aria-controls="hc-panel"></button>' +
    '<div class="hc-panel" id="hc-panel" hidden><div class="hc-cmds" role="group" aria-label="Commands"></div><ul class="hc-log" aria-live="polite" aria-relevant="additions"></ul><form class="hc-row"><input type="text" maxlength="200" autocomplete="off" enterkeyhint="send"><button type="submit"></button></form><p class="hc-msg" role="status"></p></div>'
  const toggle = dock.querySelector('.hc-toggle'), panel = dock.querySelector('.hc-panel'), input = dock.querySelector('input'), form = dock.querySelector('form')
  input.setAttribute('aria-label', T.ph); input.placeholder = T.ph; form.querySelector('button').textContent = T.send
  toggle.onclick = () => { panel.hidden = !panel.hidden; toggle.setAttribute('aria-expanded', String(!panel.hidden)); if (!panel.hidden) { unread = 0; input.focus() } paintToggle() }
  // keys typed here are chat, not game controls
  for (const ev of ['keydown', 'keyup', 'keypress']) input.addEventListener(ev, (e) => { e.stopPropagation(); if (e.type === 'keydown' && e.key === 'Escape') { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); paintToggle(); input.blur(); const c = document.querySelector('#stage canvas') || document.body; try { c.focus({ preventScroll: true }) } catch (e2) { c.focus() } } })
  // after Send the keys go back to the game (the box kept the focus, so Enter/Tab/Space never reached the wand or
  // the player until a mouse click: Diego, Nov 1). Shift+Enter keeps the cursor in the box for another message.
  let shiftHeld = false
  input.addEventListener('keydown', (e) => { shiftHeld = e.shiftKey })
  const backToGame = () => { input.blur(); const c = document.querySelector('#stage canvas') || document.body; try { c.focus({ preventScroll: true }) } catch (e) { c.focus() } }
  form.onsubmit = (e) => { e.preventDefault(); const m = input.value.trim(); if (!m) return chatSay(cs().errs['chat-empty']); if (!m.startsWith('/') && !chatOn) return chatSay(cs().errs['rule:chat.typed']); homeSend({ t: 'chat', m: m.slice(0, 200) }); input.value = ''; chatSay(''); if (!(e.submitter && e.submitter.dataset.stay) && !shiftHeld) backToGame() }

  document.body.append(dock); paintToggle()
  // the game's menu sheet is a dialog: the dock (fixed, z 40) used to sit on top of it (seen over Settings, Nov 1)
  const sheet = document.getElementById('sheet')
  if (sheet && typeof MutationObserver === 'function') { const fit = () => { dock.style.visibility = sheet.hidden ? '' : 'hidden' }; new MutationObserver(fit).observe(sheet, { attributes: true, attributeFilter: ['hidden'] }); fit() }
  return dock
}
function paintToggle() { if (!dock) return; const T = cs(), b = dock.querySelector('.hc-toggle'); b.textContent = (chatOn ? '💬 ' + T.chat : '⌘ Commands') + (unread ? ' · ' + fillAll(T.unread, { n: unread }) : '') + ' (T)'; b.setAttribute('aria-label', b.textContent) }
function chatSay(text) { if (dock) dock.querySelector('.hc-msg').textContent = text }
function setChatOn(on) {
  chatOn = !!on
  ensureDock(); if (!dock) return
  dock.hidden = false   // the dock is also the command line (part 8): it stays even with chat off
  const input = dock.querySelector('input'); input.placeholder = chatOn ? cs().ph : 'Commands only (chat is off): /help'
  paintToggle()
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
  if (f.t === 'tp') { if (tpFn) tpFn(f.x, f.y, f.z); if (toastFn && f.by && info && f.by !== info.name) toastFn(f.by + ' moved you'); return }
  if (f.t === 'plugins') { pluginSummary = f.list || []; return }
  if (f.t === 'cmdok') { if (f.msg) sysLine(f.msg); return }
  if (f.t === 'cmdno') { sysLine(f.why || 'That did not work.'); return }
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


// ---------------------------------------------------------------- commands (part 8): buttons + typed, same server path
// The rules frame carries the menu for this role. A button either sends {t:'cmd', c} at once, or asks for its argument
// (a player, a warp, a text) with a second row of buttons / a prompt, then sends. Typed '/...' lines go through chat.
let tpFn = null
export function onHomeTeleport(fn) { tpFn = fn }        // main.js: moves the player (safe landing is the game's)
function sysLine(text) {
  if (!ensureDock()) return
  const log = dock.querySelector('.hc-log'), li = document.createElement('li'); li.style.color = '#fde68a'; li.textContent = String(text)
  log.append(li); while (log.children.length > CHAT_LINES) log.firstChild.remove(); log.scrollTop = log.scrollHeight
  if (dock.querySelector('.hc-panel').hidden && toastFn) toastFn(String(text))
}
let menuNow = [], warpsNow = []
function paintMenu(menu, warps) {
  menuNow = menu; warpsNow = warps
  if (!ensureDock()) return
  const bar = dock.querySelector('.hc-cmds'); bar.textContent = ''
  for (const m of menu) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = m.label; b.dataset.c = m.c
    b.onclick = () => runButton(m)
    bar.append(b)
  }
  if (homeOwnerOn()) { const b = document.createElement('button'); b.type = 'button'; b.textContent = '⚙ Code builder'; b.dataset.c = 'builder'; b.onclick = () => homeOpenBuilder(); bar.append(b) }
}
function pickRow(title, items, onPick) {
  const bar = dock.querySelector('.hc-cmds'); const old = dock.querySelector('.hc-pick'); if (old) old.remove()
  const row = document.createElement('div'); row.className = 'hc-pick'; row.setAttribute('role', 'group'); row.setAttribute('aria-label', title)
  const lab = document.createElement('span'); lab.textContent = title + ' '; lab.style.alignSelf = 'center'; row.append(lab)
  for (const it of items) { const b = document.createElement('button'); b.type = 'button'; b.textContent = it.label; b.onclick = () => { row.remove(); onPick(it) }; row.append(b) }
  const x = document.createElement('button'); x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'Cancel'); x.onclick = () => row.remove(); row.append(x)
  bar.after(row); const first = row.querySelector('button'); if (first) first.focus()
}
function runButton(m) {
  if (!m.arg) { homeSend({ t: 'cmd', c: m.c }); return }
  if (m.arg === 'player') {
    const ps = homePlayers().map((p) => ({ label: p.name, id: p.id })).concat([...others].filter(([id, o]) => !Number.isFinite(o.x)).map(([id, o]) => ({ label: o.a, id })))
    if (!ps.length) return sysLine('Nobody else is in right now.')
    return pickRow(m.label + ':', ps, (it) => homeSend(m.c === 'unmute' ? { t: 'cmd', c: 'mute', id: it.id, on: 0 } : m.c === 'mute' ? { t: 'cmd', c: 'mute', id: it.id, on: 1 } : { t: 'cmd', c: m.c, id: it.id }))
  }
  if (m.arg === 'warp') {
    if (!warpsNow.length) return sysLine('No warps yet: "Set warp here" first.')
    return pickRow('Warp to:', warpsNow.map((w, i) => ({ label: w, i: i + 1, name: w })), (it) => homeSend({ t: 'chat', m: '/warp ' + it.name }))
  }
  if (m.arg === 'text') {
    const input = dock.querySelector('input'); input.value = '/' + m.c + ' '; input.focus(); sysLine(m.c === 'announce' ? 'Type the announcement, then Enter.' : 'Type the warp name, then Enter.')
  }
}
// T opens the panel (main.js calls this; the key is free at home: the teacher's rules key is a school thing)
export function homeOpenChat() {
  if (!ensureDock()) return false
  const panel = dock.querySelector('.hc-panel'), toggle = dock.querySelector('.hc-toggle')
  panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); unread = 0; paintToggle(); dock.querySelector('input').focus()
  return true
}


// ---------------------------------------------------------------- the code builder (part 9): owner only, in-game
let builder = null, pluginSummary = []
const ownerCall = (p, body) => fetch(ownerApi.base + '/owner/' + p, { method: 'POST', headers: { 'content-type': 'application/json', 'x-owner': ownerApi.token }, body: JSON.stringify(body || {}) }).then((r) => r.json())
export function homeOpenBuilder() {
  if (!homeOwnerOn()) { if (toastFn) toastFn('Only the host can open the code builder.'); return false }
  if (!ownerApi) { try { ownerApi = JSON.parse(sessionStorage.getItem('bt-home-owner-api') || 'null') } catch (e) {} }
  if (!ownerApi || !ownerApi.token) { if (toastFn) toastFn('Open the game from the owner page ("Play as owner") to use the builder.'); return false }
  if (!builder) builder = createBuilder({ api: ownerCall, toast: (m) => toastFn && toastFn(m) })
  builder.open(); return true
}
export const homePlugins = () => pluginSummary
