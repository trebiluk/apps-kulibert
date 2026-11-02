/* Master Control part 2: the teacher controls, live against the class server (class.kulibert.net).
   Sign in = the staff password sent to the server, which answers with a 5-minute control ticket (kept in memory
   only). Every action carries the ticket. The server shows room ids and counts only, never student information. */
(function () {
  var BASE = 'https://class.kulibert.net'
  var $ = function (id) { return document.getElementById(id) }
  var state = $('tc-state'), unlock = $('tc-unlock'), refresh = $('tc-refresh'), who = $('tc-who'), rooms = $('tc-rooms')
  var ticket = null, exp = 0, timer = null, last = null

  function post(path, body, withTicket) {
    var h = { 'content-type': 'application/json' }
    if (withTicket) h.authorization = 'Bearer ' + ticket
    return fetch(BASE + path, { method: 'POST', headers: h, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.json().then(function (j) { j._status = r.status; return j }) })
  }
  function say(text, bad) { state.textContent = text; state.classList.toggle('miss', !!bad) }
  function live() { return ticket && Date.now() / 1000 < exp - 5 }
  function signedOut(why) {
    ticket = null; exp = 0; clearInterval(timer); timer = null
    unlock.hidden = false; refresh.hidden = true; who.hidden = true
    $('tc-open').disabled = $('tc-chat').disabled = true
    rooms.innerHTML = '<p class="lead">Sign in to see rooms.</p>'
    say(why || 'Class server: signed out.')
  }
  function health() {
    fetch(BASE + '/rt/health').then(function (r) { say(r.ok ? 'Class server: up. Sign in to use the controls.' : 'Class server: not answering (' + r.status + ').', !r.ok) })
      .catch(function () { say('Class server: not reachable.', true) })
  }
  function login() {
    var pass = window.prompt('Staff password for the class server')
    if (pass == null) return
    say('Signing in …')
    post('/rt/staff/login', { pass: pass }).then(function (r) {
      pass = ''
      if (!r.ticket) { say(r.error === 'slow-down' ? 'Too many tries. Wait ' + (r.wait || 600) + ' s.' : r.error === 'not-configured' ? 'The class server has no staff password set yet.' : 'Wrong password' + (r.left != null ? ' (' + r.left + ' tries left)' : '') + '.', true); return }
      ticket = r.ticket; exp = r.exp
      unlock.hidden = true; refresh.hidden = false; who.hidden = false
      timer = setInterval(tick, 1000); tick()
      load()
    }).catch(function () { say('Class server: not reachable.', true) })
  }
  function tick() {
    if (!live()) { signedOut('Class server: the 5-minute sign-in ended. Sign in again.'); return }
    who.textContent = 'Signed in · ' + Math.max(0, Math.round(exp - Date.now() / 1000)) + ' s left'
  }
  function act(action, body) {
    if (!live()) { signedOut(); return Promise.resolve(null) }
    return post('/rt/control/' + action, body, true).then(function (r) {
      if (r._status === 401) { signedOut('Class server: sign-in no longer valid. Sign in again.'); return null }
      if (r.error) { say('Could not ' + action + ': ' + r.error, true); return null }
      return r
    }).catch(function () { say('Class server: not reachable.', true); return null })
  }
  function load() {
    return act('state', {}).then(function (st) { if (st) paint(st); return st })
  }
  function paint(st) {
    last = st
    say('Class server: ' + st.rooms.length + ' live room' + (st.rooms.length === 1 ? '' : 's') + ' · multiplayer ' + (st.flags.open ? 'on' : 'off') + ' · chat ' + (st.flags.chat ? 'on' : 'off') + '.')
    var o = $('tc-open'), c = $('tc-chat')
    o.disabled = c.disabled = false
    o.textContent = 'Multiplayer: ' + (st.flags.open ? 'ON' : 'OFF'); o.setAttribute('aria-pressed', String(!!st.flags.open))
    c.textContent = 'Chat: ' + (st.flags.chat ? 'ON' : 'OFF'); c.setAttribute('aria-pressed', String(!!st.flags.chat))
    if (!st.rooms.length) { rooms.innerHTML = '<p class="lead">No rooms are live right now.</p>'; return }
    rooms.textContent = ''
    var table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody')
    thead.innerHTML = '<tr><th>Room</th><th>World</th><th>Kids</th><th>Staff</th><th>Actions</th></tr>'
    st.rooms.forEach(function (r) {
      var tr = document.createElement('tr'), td = function (t) { var d = document.createElement('td'); d.textContent = t; return d }
      var rc = document.createElement('td'), code = document.createElement('code'); code.textContent = r.rid; rc.appendChild(code)
      tr.appendChild(rc); tr.appendChild(td(r.wid || '—')); tr.appendChild(td(String(r.kids))); tr.appendChild(td(String(r.staff)))
      var acts = document.createElement('td'), box = document.createElement('div'); box.className = 'acts'
      var fr = document.createElement('button'); fr.type = 'button'; fr.textContent = r.frozen ? 'Unfreeze' : 'Freeze'; fr.setAttribute('aria-pressed', String(!!r.frozen))
      fr.onclick = function () { act('freeze', { room: r.rid, on: !r.frozen }).then(function (x) { if (x) load() }) }
      var who = document.createElement('input'); who.type = 'text'; who.placeholder = 'alias'; who.maxLength = 24; who.setAttribute('aria-label', 'Alias to kick from ' + r.rid)
      var kick = document.createElement('button'); kick.type = 'button'; kick.textContent = 'Kick'
      kick.onclick = function () { var a = who.value.trim(); if (!a) { who.focus(); return } if (!window.confirm('Kick "' + a + '" from ' + r.rid + '?')) return; act('kick', { room: r.rid, alias: a }).then(function (x) { if (x) { who.value = ''; load().then(function () { say('Kicked ' + a + ' from ' + r.rid + '.') }) } }) }
      var mins = document.createElement('input'); mins.type = 'number'; mins.min = 1; mins.max = 10080; mins.value = 5; mins.setAttribute('aria-label', 'Minutes to roll back in ' + r.rid); mins.style.width = '5em'
      var rb = document.createElement('button'); rb.type = 'button'; rb.textContent = 'Rollback'
      rb.onclick = function () { var m = Number(mins.value) || 5; if (!window.confirm('Undo every edit of the last ' + m + ' minutes in the world of ' + r.rid + '?')) return; act('rollback', { room: r.rid, minutes: m }).then(function (x) { if (x) say('Rolled back ' + (x.cells || 0) + ' blocks (' + m + ' min).') }) }
      box.appendChild(fr); box.appendChild(who); box.appendChild(kick); box.appendChild(mins); box.appendChild(rb)
      acts.appendChild(box); tr.appendChild(acts); tbody.appendChild(tr)
    })
    table.appendChild(thead); table.appendChild(tbody); rooms.appendChild(table)
  }
  $('tc-open').onclick = function () { if (!last) return; act('open', { on: !last.flags.open }).then(function (x) { if (x) load() }) }
  $('tc-chat').onclick = function () { if (!last) return; act('chat', { on: !last.flags.chat }).then(function (x) { if (x) load() }) }
  unlock.onclick = login
  refresh.onclick = load
  health()
  window.MasterControlClass = { base: BASE, live: live, load: load }   // for checks
})()
