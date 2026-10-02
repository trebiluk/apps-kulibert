// Creator Dash prototype logic. Test page: all data is example data held in memory and localStorage on this device. Nothing is uploaded.
(function () {
  const ME = { alias: 'NovaFox', code: 'NOVAF-2M', crew: 'Crew Volt', cls: 1 }
  const KEY = 'creator-dash-proto-v1'
  const D = window.CD_DATA
  const $ = (id) => document.getElementById(id)
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  let S = load()
  function fresh() {
    return { posts: D.posts.map((p, i) => ({ ...p, t: i })), pending: D.pending.map((p) => ({ ...p })), liked: {}, voted: {}, mine: [{ id: 'm1', title: 'Night Bus (rain mix)', status: 'ok', ref: 'p2' }, { id: 'm2', title: 'Untitled loft sketch', status: 'no', reason: 'Not finished yet: add the second floor, then send it again.' }], picks: { c3: 'p6' }, now: Date.now() }
  }
  function load() { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.posts) return s } catch (e) {} return fresh() }
  function keep() { try { localStorage.setItem(KEY, JSON.stringify(S)) } catch (e) {} }
  function toast(t) { const el = $('toast'); el.textContent = t; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => (el.hidden = true), 2600) }
  const byId = (id) => S.posts.find((p) => p.id === id)
  const appName = (a) => (D.apps[a] || {}).name || a
  const contestOf = (id) => D.contests.find((c) => c.id === id)
  const art = (p, h) => window.cdArt(D.apps[p.app].kind, p.seed || 1, h || p.h || 220)
  const remixesOf = (id) => S.posts.filter((p) => (p.chain || []).slice(-1)[0] === id)

  // ---------- menu ----------
  const drawer = $('drawer'), scrim = $('scrim')
  function menu(on) { drawer.classList.toggle('open', on); scrim.hidden = !on; $('menu-btn').setAttribute('aria-expanded', String(on)); if (on) drawer.querySelector('.row').focus() }
  $('menu-btn').onclick = () => menu(!drawer.classList.contains('open'))
  $('close-btn').onclick = () => menu(false); scrim.onclick = () => menu(false)
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') menu(false) })
  const TITLES = { board: 'Class board', contests: 'Contests', post: 'Post a project', mine: 'My posts', queue: 'Approve queue (teacher)' }
  function show(v) {
    for (const s of document.querySelectorAll('.view')) s.hidden = s.id !== 'v-' + v
    for (const r of drawer.querySelectorAll('[data-view]')) r.classList.toggle('on', r.dataset.view === v)
    $('view-title').textContent = TITLES[v]; menu(false); window.scrollTo(0, 0)
    render[v] && render[v]()
    if (location.hash !== '#' + v) history.replaceState(null, '', '#' + v)
  }
  for (const r of drawer.querySelectorAll('[data-view]')) r.onclick = () => show(r.dataset.view)
  $('post-btn').onclick = () => show('post')
  $('reset-demo').onclick = () => { S = fresh(); keep(); toast('Example data reset.'); show('board') }

  // ---------- filters ----------
  function opts(sel, list, all) { sel.innerHTML = `<option value="">${all}</option>` + list.map(([v, t]) => `<option value="${esc(v)}">${esc(t)}</option>`).join('') }
  opts($('f-app'), Object.entries(D.apps).map(([k, v]) => [k, v.name]), 'All apps')
  opts($('f-cls'), D.classes.map((c, i) => [String(i + 1), c]), 'All classes')
  opts($('f-contest'), D.contests.map((c) => [c.id, c.title]), 'Any / none')
  opts($('f-crew'), D.crews.map((c) => [c, c]), 'All crews')
  opts($('p-contest'), D.contests.filter((c) => c.status !== 'closed').map((c) => [c.id, c.title + ' (' + appName(c.app) + ')']), 'Not a contest entry')
  for (const id of ['f-app', 'f-cls', 'f-contest', 'f-crew', 'f-sort']) $(id).onchange = () => render.board()
  $('f-clear').onclick = () => { for (const id of ['f-app', 'f-cls', 'f-contest', 'f-crew']) $(id).value = ''; $('f-sort').value = 'new'; render.board() }

  // ---------- cards ----------
  function chainLine(p) {
    const c = p.chain || []; if (!c.length) return ''
    const root = byId(c[0]), parent = byId(c[c.length - 1])
    if (!root) return ''
    return c.length === 1 ? `↻ Remix of <b>${esc(root.title)}</b> by ${esc(root.alias)}` : `↻ Remix of ${esc(parent.alias)}'s remix of <b>${esc(root.title)}</b> by ${esc(root.alias)}`
  }
  function card(p) {
    const c = p.contest && contestOf(p.contest), nR = remixesOf(p.id).length
    const pick = c && S.picks[c.id] === p.id
    const canVote = c && c.status === 'voting'
    return `<article class="card" data-id="${p.id}">
      <button class="art" data-open="${p.id}" aria-label="Open ${esc(p.title)}" style="all:unset;display:block;cursor:pointer;line-height:0">${art(p)}</button>
      <div class="body">
        <p class="badges"><span class="badge ex">Example data</span><span class="badge app">${esc(appName(p.app))}</span>${c ? `<span class="badge contest">Contest · ${esc(c.title)}</span>` : ''}${pick ? '<span class="badge pick">★ Teacher pick</span>' : ''}</p>
        <h4>${esc(p.title)}</h4>
        <p class="by"><span class="av">${esc(p.alias[0])}</span><b>${esc(p.alias)}</b> · ${esc(p.crew)}</p>
        ${p.tool ? `<p class="by">Tool: ${esc(p.tool)} · ${esc(p.material)}</p>` : ''}
        ${chainLine(p) ? `<p class="remix-line">${chainLine(p)}</p>` : ''}
        <div class="foot">
          <button class="like" data-like="${p.id}" aria-pressed="${!!S.liked[p.id]}" aria-label="Like ${esc(p.title)}">♥ ${p.likes + (S.liked[p.id] ? 1 : 0)}</button>
          ${canVote ? `<button class="vote" data-vote="${p.id}" aria-pressed="${S.voted[c.id] === p.id}" ${p.alias === ME.alias ? 'disabled title="You can\'t vote for your own entry"' : ''}>▲ Vote ${p.votes + (S.voted[c.id] === p.id ? 1 : 0)}</button>` : ''}
          <span class="sp"></span><span class="rmx">${nR ? nR + (nR === 1 ? ' remix' : ' remixes') : ''}</span>
        </div>
      </div></article>`
  }
  function wireCards(root) {
    root.querySelectorAll('[data-open]').forEach((b) => (b.onclick = () => openDetail(b.dataset.open)))
    root.querySelectorAll('[data-like]').forEach((b) => (b.onclick = () => like(b.dataset.like)))
    root.querySelectorAll('[data-vote]').forEach((b) => (b.onclick = () => vote(b.dataset.vote)))
  }
  function like(id) { S.liked[id] = !S.liked[id]; keep(); rerender() }
  function vote(id) {
    const p = byId(id), c = contestOf(p.contest)
    if (!c || c.status !== 'voting' || p.alias === ME.alias) return
    S.voted[c.id] = S.voted[c.id] === id ? null : id; keep(); rerender()
    toast(S.voted[c.id] ? 'Vote saved. You get one vote in "' + c.title + '". Tap another entry to move it.' : 'Vote removed.')
  }
  function rerender() { const v = (location.hash || '#board').slice(1); render[v] && render[v](); if ($('detail').open) openDetail($('detail').dataset.id) }

  const render = {}
  render.board = () => {
    const f = { app: $('f-app').value, cls: $('f-cls').value, contest: $('f-contest').value, crew: $('f-crew').value, sort: $('f-sort').value }
    let list = S.posts.filter((p) => (!f.app || p.app === f.app) && (!f.cls || String(p.cls) === f.cls) && (!f.contest || p.contest === f.contest) && (!f.crew || p.crew === f.crew))
    if (f.sort === 'likes') list.sort((a, b) => b.likes - a.likes)
    else if (f.sort === 'remix') list.sort((a, b) => remixesOf(b.id).length - remixesOf(a.id).length)
    else list.sort((a, b) => b.t - a.t)
    $('count-line').textContent = list.length + ' approved post' + (list.length === 1 ? '' : 's') + ' · example data'
    $('board-grid').innerHTML = list.map(card).join('') || '<p class="lead">Nothing matches these filters yet.</p>'
    wireCards($('board-grid'))
  }

  // ---------- detail ----------
  function openDetail(id) {
    const p = byId(id); if (!p) return
    const dlg = $('detail'); dlg.dataset.id = id
    $('d-art').innerHTML = art(p, 340)
    const c = p.contest && contestOf(p.contest)
    $('d-badges').innerHTML = `<span class="badge ex">Example data</span><span class="badge app">${esc(appName(p.app))}</span>${c ? `<span class="badge contest">Contest · ${esc(c.title)}</span>` : ''}<span class="badge">${esc(D.classes[p.cls - 1])}</span>`
    $('d-title').textContent = p.title
    $('d-by').innerHTML = `<span class="av">${esc(p.alias[0])}</span> made by <b>${esc(p.alias)}</b> · ${esc(p.crew)}`
    $('d-desc').textContent = p.desc
    $('d-kv').innerHTML = p.tool ? `Tool: <b>${esc(p.tool)}</b> · Material: <b>${esc(p.material)}</b>` : ''
    const chain = [...(p.chain || []).map(byId).filter(Boolean), p]
    $('d-chain').innerHTML = chain.map((x, i) => `<li class="${x.id === p.id ? 'me' : ''}">${i === 0 ? 'Original' : 'Remix'}: <b>${esc(x.title)}</b> by ${esc(x.alias)}${x.id === p.id ? ' (this one)' : ''}</li>`).join('')
    const r = remixesOf(p.id)
    $('d-rmx-h').hidden = !r.length
    $('d-remixes').innerHTML = r.map((x) => `<li><button class="btn ghost" style="min-height:36px;padding:2px 8px" data-open="${x.id}">${esc(x.title)}</button> by ${esc(x.alias)}</li>`).join('')
    const canVote = c && c.status === 'voting'
    $('d-actions').innerHTML = `<button class="btn primary" id="d-remix">↻ Remix in ${esc(appName(p.app))}</button>
      <button class="like" data-like="${p.id}" aria-pressed="${!!S.liked[p.id]}">♥ ${p.likes + (S.liked[p.id] ? 1 : 0)}</button>
      ${canVote ? `<button class="vote" data-vote="${p.id}" aria-pressed="${S.voted[c.id] === p.id}" ${p.alias === ME.alias ? 'disabled' : ''}>▲ Vote</button>` : ''}
      <button class="btn ghost" id="d-report">Tell the teacher</button>`
    if (p.app === 'workshop') $('d-remix').textContent = '↻ Build your own version'
    $('d-remix').onclick = () => toast(p.app === 'workshop' ? 'Example: starts a Workshop post with "Inspired by ' + p.alias + '" in its credit chain.' : 'Example: opens ' + appName(p.app) + ' with a copy of "' + p.title + '". Your remix keeps the credit chain back to ' + chain[0].alias + '.')
    $('d-report').onclick = () => toast('Example: sends this post back to the teacher queue to check again.')
    wireCards(dlg)
    if (!dlg.open) dlg.showModal()
  }
  $('d-close').onclick = () => $('detail').close()
  $('detail').addEventListener('click', (e) => { if (e.target === $('detail')) $('detail').close() })

  // ---------- contests ----------
  function remain(c) {
    if (c.status === 'closed') return 'Closed'
    const end = S.now + (c.ends === '+2d' ? 2 * 864e5 : 25 * 6e4) - (Date.now() - S.now) * 0
    const ms = Math.max(0, end - Date.now()); const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60
    return d ? `${d}d ${h}h ${m}m left` : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')} left`
  }
  render.contests = () => {
    $('contest-list').innerHTML = D.contests.map((c) => {
      const entries = S.posts.filter((p) => p.contest === c.id).sort((a, b) => b.votes + (S.voted[c.id] === b.id) - (a.votes + (S.voted[c.id] === a.id)))
      const pick = S.picks[c.id] && byId(S.picks[c.id])
      return `<div class="contest-card"><span class="st ${c.status}">${c.status === 'open' ? 'Building' : c.status === 'voting' ? 'Voting open' : 'Closed'}</span>
        <h3>${esc(c.title)}</h3><p class="badges"><span class="badge ex">Example data</span><span class="badge app">${esc(appName(c.app))}</span><span class="badge">set by the teacher</span></p>
        <p class="muted">${esc(c.theme)}</p><div class="timer" data-timer="${c.id}">${remain(c)}</div>
        <p class="muted">${entries.length} approved entr${entries.length === 1 ? 'y' : 'ies'}${c.status === 'voting' ? ' · one vote each, not your own' : ''}</p>
        ${entries.length ? `<ol class="rank">${entries.slice(0, 3).map((p) => `<li><b>${esc(p.title)}</b> · ${esc(p.alias)}${c.status !== 'open' ? ' · ' + (p.votes + (S.voted[c.id] === p.id ? 1 : 0)) + ' votes' : ''}</li>`).join('')}</ol>` : ''}
        ${pick ? `<p class="muted" style="margin-top:8px">★ Teacher pick: <b>${esc(pick.title)}</b> by ${esc(pick.alias)}</p>` : ''}
        <div class="actions" style="margin-top:10px"><button class="btn blue" data-see="${c.id}">See entries</button>${c.status === 'open' ? `<button class="btn primary" data-enter="${c.id}">Enter</button>` : ''}</div></div>`
    }).join('')
    $('contest-list').querySelectorAll('[data-see]').forEach((b) => (b.onclick = () => { $('f-contest').value = b.dataset.see; show('board') }))
    $('contest-list').querySelectorAll('[data-enter]').forEach((b) => (b.onclick = () => { show('post'); $('p-contest').value = b.dataset.enter }))
  }
  setInterval(() => document.querySelectorAll('[data-timer]').forEach((el) => (el.textContent = remain(contestOf(el.dataset.timer)))), 1000)

  // ---------- post ----------
  let kind = 'app', photo = null
  document.querySelectorAll('.tab').forEach((t) => (t.onclick = () => {
    kind = t.dataset.kind
    document.querySelectorAll('.tab').forEach((x) => x.setAttribute('aria-selected', String(x === t)))
    document.querySelector('.kind-app').hidden = kind !== 'app'; document.querySelector('.kind-workshop').hidden = kind !== 'workshop'
  }))
  $('p-desc').oninput = () => ($('desc-left').textContent = 280 - $('p-desc').value.length + ' left')
  $('p-photo').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return
    if (f.size > 15 * 1024 * 1024) { $('size-line').textContent = 'That photo is over 15 MB. Pick a smaller one.'; return }
    const img = await createImageBitmap(f)
    const k = Math.min(1, 1600 / Math.max(img.width, img.height))
    const cv = document.createElement('canvas'); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k)
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
    let q = 0.82, blob
    do { blob = await new Promise((r) => cv.toBlob(r, 'image/webp', q)); q -= 0.12 } while (blob.size > 400 * 1024 && q > 0.4)
    photo = { url: URL.createObjectURL(blob), size: blob.size, w: cv.width, h: cv.height }
    $('preview').src = photo.url; $('preview').hidden = false; $('drop-text').hidden = true
    $('size-line').textContent = `Re-saved as WebP ${cv.width}×${cv.height}: ${(f.size / 1024).toFixed(0)} KB → ${(blob.size / 1024).toFixed(0)} KB. Location data removed.`
  }
  $('post-form').onsubmit = (e) => {
    e.preventDefault()
    const title = $('p-title').value.trim()
    if (!title) { $('post-note').textContent = 'Add a title first.'; $('p-title').focus(); return }
    if (kind === 'workshop' && !photo) { $('post-note').textContent = 'Add a photo of your project first.'; return }
    const app = kind === 'workshop' ? 'workshop' : $('p-app').value
    const id = 'q' + Date.now()
    S.pending.unshift({ id, app, title, alias: ME.alias, code: ME.code, crew: ME.crew, cls: ME.cls, desc: $('p-desc').value.trim() || '(no description)', tool: kind === 'workshop' ? $('p-tool').value : undefined, material: kind === 'workshop' ? $('p-mat').value : undefined, contest: $('p-contest').value || null, chain: app === 'djberty' && /remix/i.test($('p-save').value) ? ['p1', 'p2'] : [], h: 230, seed: 20 + (Date.now() % 50), photo: photo && photo.url, flags: kind === 'workshop' ? ['Check the photo for faces or name tags'] : [] })
    S.mine.unshift({ id, title, status: 'wait' }); keep()
    $('post-form').reset(); photo = null; $('preview').hidden = true; $('drop-text').hidden = false; $('size-line').textContent = ''
    $('post-note').textContent = ''; toast('Example: added to the teacher queue on this device only. Nothing was uploaded.'); show('mine')
  }

  // ---------- mine ----------
  const ST = { wait: ['wait', 'Waiting for teacher'], ok: ['ok', 'On the board'], no: ['no', 'Sent back'] }
  render.mine = () => {
    $('mine-list').innerHTML = S.mine.map((m) => {
      const p = byId(m.ref || m.id) || S.pending.find((x) => x.id === m.id)
      const thumb = p ? (p.photo ? `<img src="${p.photo}" alt="">` : art(p, 160)) : window.cdArt('plan', 3, 160)
      return `<div class="item"><div class="thumb">${thumb}</div><div><p class="badges"><span class="badge ex">Example data · kept on this device</span></p><h4>${esc(m.title)}</h4><span class="state ${ST[m.status][0]}">${ST[m.status][1]}</span>${m.reason ? `<p class="flag">Teacher: ${esc(m.reason)}</p>` : ''}</div></div>`
    }).join('')
  }

  // ---------- queue (teacher) ----------
  const REASONS = ['Shows a face or name tag', 'Has a real name', 'Not school-appropriate', 'Off topic', 'Not finished yet']
  function qCount() { $('q-count').textContent = S.pending.length }
  render.queue = () => {
    qCount()
    $('queue-list').innerHTML = S.pending.length ? S.pending.map((p) => `<div class="item" data-q="${p.id}"><div class="thumb">${p.photo ? `<img src="${p.photo}" alt="Submitted photo">` : art(p, 160)}</div><div>
      <p class="badges"><span class="badge ex">Example data</span><span class="badge app">${esc(appName(p.app))}</span>${p.contest ? `<span class="badge contest">Contest · ${esc(contestOf(p.contest).title)}</span>` : ''}<span class="badge">${esc(D.classes[p.cls - 1])}</span></p>
      <h4>${esc(p.title)}</h4><p class="by"><span class="av">${esc(p.alias[0])}</span><b>${esc(p.alias)}</b> · ${esc(p.crew)} · <span class="muted">${esc(p.code)}</span></p>
      <p style="margin:4px 0">${esc(p.desc)}</p>${p.tool ? `<p class="by">Tool: ${esc(p.tool)} · ${esc(p.material)}</p>` : ''}
      ${(p.chain || []).length ? `<p class="remix-line">${chainLine(p)}</p>` : ''}
      ${(p.flags || []).map((f) => `<p class="flag">⚑ ${esc(f)}</p>`).join('')}
      <div class="actions" style="margin-top:8px"><button class="btn primary" data-ok="${p.id}">Approve</button>${p.contest ? `<button class="btn blue" data-pick="${p.id}">Approve + Teacher pick</button>` : ''}<button class="btn warn" data-no="${p.id}">Send back…</button></div>
      <div class="reasons" hidden data-r="${p.id}">${REASONS.map((r) => `<button data-reason="${esc(r)}">${esc(r)}</button>`).join('')}</div></div></div>`).join('') : '<p class="lead">Queue is empty. New posts show up here first.</p>'
    const list = $('queue-list')
    list.querySelectorAll('[data-ok]').forEach((b) => (b.onclick = () => approve(b.dataset.ok, false)))
    list.querySelectorAll('[data-pick]').forEach((b) => (b.onclick = () => approve(b.dataset.pick, true)))
    list.querySelectorAll('[data-no]').forEach((b) => (b.onclick = () => { const r = list.querySelector(`[data-r="${b.dataset.no}"]`); r.hidden = !r.hidden }))
    list.querySelectorAll('[data-reason]').forEach((b) => (b.onclick = () => reject(b.closest('[data-q]').dataset.q, b.dataset.reason)))
  }
  function approve(id, pick) {
    const i = S.pending.findIndex((p) => p.id === id); if (i < 0) return
    const p = S.pending.splice(i, 1)[0]
    S.posts.push({ ...p, likes: 0, votes: 0, t: Math.max(...S.posts.map((x) => x.t)) + 1, flags: undefined })
    if (pick && p.contest) S.picks[p.contest] = p.id
    const m = S.mine.find((x) => x.id === id); if (m) { m.status = 'ok'; m.ref = id }
    keep(); render.queue(); toast('Approved. "' + p.title + '" is on the board under ' + p.alias + '.')
  }
  function reject(id, reason) {
    const i = S.pending.findIndex((p) => p.id === id); if (i < 0) return
    const p = S.pending.splice(i, 1)[0]
    const m = S.mine.find((x) => x.id === id); if (m) { m.status = 'no'; m.reason = reason }
    keep(); render.queue(); toast('Sent back to ' + p.alias + ': ' + reason)
  }

  qCount()
  const start = (location.hash || '#board').slice(1)
  show(TITLES[start] ? start : 'board')
  window.addEventListener('hashchange', () => { const v = location.hash.slice(1); if (TITLES[v]) show(v) })
})()
