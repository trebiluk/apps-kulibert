// The in-game code builder (part 9): a panel where the host builds plugins out of blocks, no typing of code.
// HOME BUILD ONLY (imported from home.js, which main.js imports behind __HOME_HOST__). English-only.
//
// A plugin = rules; a rule = WHEN one event, IF any conditions, DO one or more actions. Every block is picked from a
// list and filled in with small inputs, so the result is always a valid plugin (src/plugins.js checkPlugin says why
// when it is not). Saved through the owner API (/owner/plugin/put); the host runs it at once.
// Text only in the DOM (textContent); 44 px targets; focus rings; Escape closes.
const WHEN = [['join', 'a player joins'], ['leave', 'a player leaves'], ['place', 'a block is placed'], ['break', 'a block is broken'], ['chat', 'someone chats'], ['command', 'someone types /…'], ['timer', 'every N seconds']]
const IF = [['owner', 'the player is the owner'], ['player', 'the player is named …'], ['block', 'the block is …'], ['zone', 'it happens inside a zone'], ['count', 'more than N in M seconds']]
const DO = [['tell', 'tell the player …'], ['say', 'say to everyone …'], ['announce', 'announce …'], ['tp', 'teleport the player to x y z'], ['spawn', 'send the player to spawn'], ['undo', 'undo that block'], ['set', 'set a block at x y z'], ['deny', 'refuse it (place/break/chat)'], ['kick', 'kick the player'], ['mute', 'mute / unmute the player']]
const CSS = `#home-builder{position:fixed;inset:0;z-index:60;background:rgba(2,6,23,.92);color:#f8fafc;font:14px/1.4 system-ui,sans-serif;overflow:auto;padding:16px}
#home-builder *{box-sizing:border-box}#home-builder h1{font-size:20px;margin:0 0 4px}#home-builder h2{font-size:15px;color:#2dd4bf;margin:14px 0 6px;text-transform:uppercase;letter-spacing:.04em}
#home-builder button,#home-builder select,#home-builder input{min-height:44px;border-radius:10px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font:inherit;padding:0 12px}
#home-builder button{min-width:44px;cursor:pointer}#home-builder button.go{background:#0f766e;border-color:#14b8a6}#home-builder button.bad{color:#fca5a5;border-color:#7f1d1d}#home-builder button:focus-visible,#home-builder select:focus-visible,#home-builder input:focus-visible{outline:3px solid #2dd4bf;outline-offset:2px}
#home-builder .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}#home-builder .card{background:#111827;border:1px solid #334155;border-radius:12px;padding:12px;margin:8px 0}
#home-builder .rule{border-left:4px solid #2dd4bf}#home-builder .blk{background:#1f2937;border-radius:10px;padding:8px;margin:6px 0}#home-builder .blk.when{border-left:4px solid #fbbf24}#home-builder .blk.if{border-left:4px solid #60a5fa}#home-builder .blk.do{border-left:4px solid #a3e635}
#home-builder .dim{color:#94a3b8}#home-builder .err{color:#fde68a;min-height:1.3em}#home-builder input.n{width:7em}#home-builder input.t{flex:1;min-width:12em}#home-builder .list button{display:block;width:100%;text-align:start;margin:4px 0}
#home-builder .top{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}`

export function createBuilder({ api, toast }) {
  let root = null, plugins = [], examples = [], cur = null, lastErr = ''
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e }
  const btn = (text, fn, cls) => { const b = el('button', cls, text); b.type = 'button'; b.onclick = fn; return b }
  const num = (v, fn, label) => { const i = el('input', 'n'); i.type = 'number'; i.value = v ?? 0; i.setAttribute('aria-label', label); i.oninput = () => fn(Number(i.value) | 0); return i }
  const txt = (v, fn, label, max = 200) => { const i = el('input', 't'); i.type = 'text'; i.maxLength = max; i.value = v || ''; i.placeholder = label; i.setAttribute('aria-label', label); i.oninput = () => fn(i.value); return i }
  const sel = (opts, v, fn, label) => { const s = el('select'); s.setAttribute('aria-label', label); for (const [k, t] of opts) { const o = el('option', '', t); o.value = k; s.append(o) } s.value = v; s.onchange = () => fn(s.value); return s }

  async function refresh() { try { const r = await api('plugins', {}); plugins = r.list || []; examples = r.examples || [] } catch (e) { plugins = []; examples = [] } }
  function open() {
    if (root) return
    root = el('div'); root.id = 'home-builder'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-label', 'Code builder')
    const st = el('style'); st.textContent = CSS; root.append(st)
    root.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Escape') { e.preventDefault(); cur ? paintList() : close() } })
    for (const ev of ['keyup', 'keypress']) root.addEventListener(ev, (e) => e.stopPropagation())
    document.body.append(root)
    refresh().then(paintList)
  }
  function close() { if (root) root.remove(); root = null; cur = null }
  const fresh = () => ({ id: 'plugin-' + Math.random().toString(36).slice(2, 7), name: 'My plugin', by: 'owner', about: '', on: true, v: 1, rules: [{ when: { e: 'join' }, if: [], do: [{ a: 'tell', text: 'Welcome, {player}!' }] }] })

  function paintList() {
    cur = null; root.querySelectorAll(':scope > :not(style)').forEach((n) => n.remove())
    const top = el('div', 'top'); top.append(el('h1', '', 'Code builder'), btn('✕ Close', close)); root.append(top)
    root.append(el('p', 'dim', 'Plugins are rules for this world: WHEN something happens, IF conditions hold, DO actions. They run on the server for everyone and are saved in the world.'))
    root.append(el('h2', '', 'Plugins in this world'))
    const list = el('div', 'list')
    if (!plugins.length) list.append(el('p', 'dim', 'None yet. Make one, or start from an example below.'))
    for (const p of plugins) {
      const row = el('div', 'row card')
      row.append(btn(p.on ? '● On' : '○ Off', async () => { await api('plugin/on', { id: p.id, on: !p.on }); await refresh(); paintList() }, p.on ? 'go' : ''))
      const name = el('div'); name.style.flex = '1'; name.append(el('b', '', p.name), el('div', 'dim', (p.about || '') + ' · ' + p.rules.length + ' rule' + (p.rules.length === 1 ? '' : 's') + ' · by ' + p.by)); row.append(name)
      row.append(btn('Edit', () => { cur = JSON.parse(JSON.stringify(p)); paintEditor() }), btn('Remove', async () => { if (confirm('Remove "' + p.name + '"?')) { await api('plugin/drop', { id: p.id }); await refresh(); paintList() } }, 'bad'))
      list.append(row)
    }
    root.append(list)
    const row = el('div', 'row'); row.append(btn('+ New plugin', () => { cur = fresh(); paintEditor() }, 'go')); root.append(row)
    // the cloud library (part 12): every save here lands there on its own; Pull brings the other servers' edits in
    const cloud = el('div', 'row cloud'); const note = el('span', 'dim', '')
    api('library/status', {}).then((st) => {
      if (!st || !st.on) { note.textContent = 'Cloud library: not linked (owner page → Plugin library).'; cloud.append(note); return }
      note.textContent = 'Cloud library: linked' + (st.v ? ' (v' + st.v + ')' : '') + '. Saves go up on their own.'
      cloud.append(btn('☁ Pull', async () => { const r = await api('library/pull', {}); if (r.error === 'conflict' && confirm('The library is older than this world\'s copy. Pull anyway?')) await api('library/pull', { force: true }); else if (r.error) alert('Pull failed: ' + r.error); await refresh(); paintList() }),
        btn('☁ Push', async () => { const r = await api('library/push', {}); if (r.error === 'conflict' && confirm('The library changed since this world last synced. Overwrite it with this world\'s plugins?')) await api('library/push', { force: true }); else if (r.error) alert('Push failed: ' + r.error); await refresh(); paintList() }), note)
    }).catch(() => { note.textContent = ''; })
    root.append(cloud)
    root.append(el('h2', '', 'Examples'))
    const exl = el('div', 'list')
    for (const p of examples) { const b = btn(p.name + ' — ' + (p.about || ''), () => { cur = JSON.parse(JSON.stringify(p)); cur.id = p.id + '-' + Math.random().toString(36).slice(2, 5); cur.by = 'owner'; paintEditor() }); exl.append(b) }
    root.append(exl)
  }

  function paintEditor() {
    root.querySelectorAll(':scope > :not(style)').forEach((n) => n.remove())
    const top = el('div', 'top'); top.append(el('h1', '', 'Edit plugin'), btn('← Back', () => { paintList() })); root.append(top)
    const head = el('div', 'card'); const r1 = el('div', 'row')
    r1.append(txt(cur.name, (v) => (cur.name = v), 'Name', 40), txt(cur.about, (v) => (cur.about = v), 'What it does (optional)', 200)); head.append(r1)
    const r2 = el('div', 'row'); const onB = btn(cur.on ? '● On' : '○ Off', () => { cur.on = !cur.on; onB.textContent = cur.on ? '● On' : '○ Off'; onB.className = cur.on ? 'go' : '' }, cur.on ? 'go' : ''); r2.append(onB, el('span', 'dim', 'id ' + cur.id)); head.append(r2)
    root.append(head)
    root.append(el('h2', '', 'Rules'))
    cur.rules.forEach((rule, ri) => root.append(paintRule(rule, ri)))
    const add = el('div', 'row'); add.append(btn('+ Add rule', () => { cur.rules.push({ when: { e: 'join' }, if: [], do: [{ a: 'tell', text: '' }] }); paintEditor() })); root.append(add)
    const err = el('p', 'err'); err.setAttribute('role', 'alert'); err.textContent = lastErr; root.append(err)
    const save = el('div', 'row'); save.append(btn('Save & run', async () => {
      const r = await api('plugin/put', { plugin: cur })
      if (r.error) { lastErr = r.error; err.textContent = r.error; return }
      lastErr = ''; toast('Plugin saved: ' + cur.name); await refresh(); paintList()
    }, 'go'), btn('Cancel', () => { lastErr = ''; paintList() }))
    root.append(save)
  }
  function paintRule(rule, ri) {
    const card = el('div', 'card rule')
    const head = el('div', 'row'); head.append(el('b', '', 'Rule ' + (ri + 1)), btn('Remove rule', () => { cur.rules.splice(ri, 1); paintEditor() }, 'bad')); card.append(head)
    // WHEN
    const w = el('div', 'blk when'); const wr = el('div', 'row'); wr.append(el('b', '', 'WHEN'), sel(WHEN, rule.when.e, (v) => { rule.when = v === 'timer' ? { e: 'timer', every: 60 } : v === 'command' ? { e: 'command', name: 'go' } : { e: v }; paintEditor() }, 'When'))
    if (rule.when.e === 'timer') wr.append(el('span', '', 'every'), num(rule.when.every, (v) => (rule.when.every = v), 'seconds'), el('span', '', 'seconds (10 or more)'))
    if (rule.when.e === 'command') wr.append(el('span', '', '/'), txt(rule.when.name, (v) => (rule.when.name = v.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16)), 'word', 16))
    w.append(wr); card.append(w)
    // IF
    const ifs = rule.if || (rule.if = [])
    ifs.forEach((c, ci) => {
      const b = el('div', 'blk if'); const r = el('div', 'row'); const neg = c.k === 'not'; const inner = neg ? c.c : c
      r.append(el('b', '', ci ? 'AND' : 'IF'), btn(neg ? 'NOT' : 'not', () => { ifs[ci] = neg ? inner : { k: 'not', c: inner }; paintEditor() }), sel(IF, inner.k, (v) => { const n = v === 'zone' ? { k: 'zone', x0: 0, y0: 0, z0: 0, x1: 10, y1: 10, z1: 10 } : v === 'count' ? { k: 'count', of: 'place', over: 10, per: 10 } : v === 'block' ? { k: 'block', is: 1 } : v === 'player' ? { k: 'player', is: '' } : { k: v }; ifs[ci] = neg ? { k: 'not', c: n } : n; paintEditor() }, 'Condition'))
      if (inner.k === 'player') r.append(txt(inner.is, (v) => (inner.is = v), 'name', 20))
      if (inner.k === 'block') r.append(el('span', '', 'id'), num(inner.is, (v) => (inner.is = v), 'block id'))
      if (inner.k === 'zone') for (const k of ['x0', 'y0', 'z0', 'x1', 'y1', 'z1']) r.append(el('span', 'dim', k), num(inner[k], (v) => (inner[k] = v), k))
      if (inner.k === 'count') r.append(sel([['place', 'places'], ['break', 'breaks'], ['chat', 'chats']], inner.of, (v) => (inner.of = v), 'of'), el('span', '', 'over'), num(inner.over, (v) => (inner.over = v), 'how many'), el('span', '', 'in'), num(inner.per, (v) => (inner.per = v), 'seconds'), el('span', '', 's'))
      r.append(btn('✕', () => { ifs.splice(ci, 1); paintEditor() }, 'bad')); b.append(r); card.append(b)
    })
    const addIf = el('div', 'row'); addIf.append(btn('+ IF', () => { ifs.push({ k: 'owner' }); paintEditor() })); card.append(addIf)
    // DO
    rule.do.forEach((d, di) => {
      const b = el('div', 'blk do'); const r = el('div', 'row')
      r.append(el('b', '', di ? 'AND' : 'DO'), sel(DO, d.a, (v) => { rule.do[di] = v === 'tp' ? { a: 'tp', x: 0, y: 64, z: 0 } : v === 'set' ? { a: 'set', x: 0, y: 64, z: 0, id: 1 } : v === 'mute' ? { a: 'mute', on: true } : ['tell', 'say', 'announce'].includes(v) ? { a: v, text: '' } : { a: v }; paintEditor() }, 'Action'))
      if (['tell', 'say', 'announce'].includes(d.a)) r.append(txt(d.text, (v) => (d.text = v), 'text ({player}, {block}, {x} {y} {z}, {count})'))
      if (d.a === 'tp' || d.a === 'set') for (const k of ['x', 'y', 'z']) r.append(el('span', 'dim', k), num(d[k], (v) => (d[k] = v), k))
      if (d.a === 'set') r.append(el('span', 'dim', 'block'), num(d.id, (v) => (d.id = v), 'block id'))
      if (d.a === 'mute') r.append(btn(d.on ? 'mute' : 'unmute', () => { d.on = !d.on; paintEditor() }))
      r.append(btn('✕', () => { rule.do.splice(di, 1); paintEditor() }, 'bad')); b.append(r); card.append(b)
    })
    const addDo = el('div', 'row'); addDo.append(btn('+ DO', () => { rule.do.push({ a: 'tell', text: '' }); paintEditor() })); card.append(addDo)
    return card
  }
  return { open, close, get isOpen() { return !!root } }
}
