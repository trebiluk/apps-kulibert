/* Shared slot contract for Kulibert apps. No engine. No build step. */
(function (root) {
  var cfg = {
    icon: function () { return document.createElement('span') },
    name: function (item) { return String(item || '') },
    t: function (k) {
      if (root.KulibertI18n && root.KulibertI18n.t) return root.KulibertI18n.t(k)
      return k
    },
    cap: function () { return 64 },
    reducedMotion: function () {
      try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches } catch (e) { return false }
    },
    onChange: function () {},
    toast: function () {},
  }
  var sessions = []
  var activeDrag = null

  function config(next) {
    if (!next) return cfg
    if (next.icon) cfg.icon = next.icon
    if (next.name) cfg.name = next.name
    if (next.t) cfg.t = next.t
    if (next.cap) cfg.cap = next.cap
    if (next.reducedMotion) cfg.reducedMotion = next.reducedMotion
    if (next.onChange) cfg.onChange = next.onChange
    if (next.toast) cfg.toast = next.toast
    return cfg
  }

  function capFor(inv, item) {
    var n = 64
    if (inv && typeof inv.cap === 'function') n = inv.cap(item)
    else if (typeof cfg.cap === 'function') n = cfg.cap(item)
    else if (cfg.cap) n = cfg.cap
    n = n | 0
    return n > 0 ? n : 64
  }

  function copySlot(s) {
    return s && s.n > 0 ? { item: s.item, n: s.n } : null
  }

  function emit(inv) {
    var list = inv._on && inv._on.change ? inv._on.change : []
    for (var i = 0; i < list.length; i++) list[i]({ id: inv.id, slots: inv.slots })
    if (cfg.onChange) cfg.onChange({ id: inv.id, slots: inv.slots })
  }

  function createInventory(opts) {
    opts = opts || {}
    var slots = opts.slots || []
    var size = opts.size || slots.length
    while (slots.length < size) slots.push(null)
    var inv = {
      id: opts.id || 'inv',
      slots: slots,
      size: slots.length,
      filter: opts.filter || null,
      cap: opts.cap || null,
      _on: { change: [] },
    }
    inv.get = function (i) { return copySlot(slots[i]) }
    inv.set = function (i, slot) {
      slots[i] = copySlot(slot)
      emit(inv)
    }
    inv.count = function (item) {
      var n = 0
      for (var i = 0; i < slots.length; i++) if (slots[i] && slots[i].item === item) n += slots[i].n
      return n
    }
    inv.add = function (item, n) {
      var left = n | 0
      if (!item || left <= 0) return 0
      if (inv.filter && !inv.filter(item)) return left
      var cap = capFor(inv, item)
      var i
      for (i = 0; i < slots.length && left; i++) {
        var s = slots[i]
        if (!s || s.item !== item || s.n >= cap) continue
        var take = Math.min(cap - s.n, left)
        s.n += take
        left -= take
      }
      for (i = 0; i < slots.length && left; i++) {
        if (slots[i]) continue
        var put = Math.min(cap, left)
        slots[i] = { item: item, n: put }
        left -= put
      }
      if (left !== (n | 0)) emit(inv)
      return left
    }
    inv.take = function (item, n) {
      var need = n | 0
      if (!item || need <= 0) return false
      if (inv.count(item) < need) return false
      var left = need
      for (var i = 0; i < slots.length && left; i++) {
        var s = slots[i]
        if (!s || s.item !== item) continue
        var d = Math.min(s.n, left)
        s.n -= d
        left -= d
        if (s.n <= 0) slots[i] = null
      }
      emit(inv)
      return true
    }
    inv.on = function (ev, fn) {
      if (!inv._on[ev]) inv._on[ev] = []
      inv._on[ev].push(fn)
      return function () {
        var list = inv._on[ev]
        var at = list.indexOf(fn)
        if (at >= 0) list.splice(at, 1)
      }
    }
    inv.toJSON = function () {
      return slots.map(function (s) { return copySlot(s) })
    }
    inv.allows = function (item) { return !inv.filter || !!inv.filter(item) }
    return inv
  }

  function move(fromInv, i, toInv, j) {
    if (!fromInv || !toInv) return { moved: 0, reason: 'empty' }
    var src = fromInv.slots[i]
    if (!src || !(src.n > 0)) return { moved: 0, reason: 'empty' }
    if (fromInv === toInv && i === j) return { moved: 0, reason: 'same' }
    var dest = toInv.slots[j]
    if (j < 0 || j >= toInv.slots.length) return { moved: 0, reason: 'empty' }
    var cap = capFor(toInv, src.item)
    if (!dest) {
      if (!toInv.allows(src.item)) return { moved: 0, reason: 'filter' }
      toInv.slots[j] = { item: src.item, n: src.n }
      fromInv.slots[i] = null
      var moved = src.n
      emit(fromInv)
      if (fromInv !== toInv) emit(toInv)
      return { moved: moved }
    }
    if (dest.item === src.item) {
      if (dest.n >= cap) return { moved: 0, reason: 'full' }
      var room = cap - dest.n
      var n = Math.min(room, src.n)
      dest.n += n
      src.n -= n
      if (src.n <= 0) fromInv.slots[i] = null
      emit(fromInv)
      if (fromInv !== toInv) emit(toInv)
      return { moved: n }
    }
    if (!toInv.allows(src.item) || !fromInv.allows(dest.item)) return { moved: 0, reason: 'filter' }
    fromInv.slots[i] = { item: dest.item, n: dest.n }
    toInv.slots[j] = { item: src.item, n: src.n }
    emit(fromInv)
    if (fromInv !== toInv) emit(toInv)
    return { moved: src.n, swapped: true }
  }

  function quickMove(inv, i, targets) {
    var src = inv && inv.slots[i]
    if (!src || !(src.n > 0)) return { moved: 0, reason: 'empty' }
    var list = targets || []
    var t, s, cap, k
    for (t = 0; t < list.length; t++) {
      var destInv = list[t]
      if (!destInv || !destInv.allows(src.item)) continue
      cap = capFor(destInv, src.item)
      for (s = 0; s < destInv.slots.length; s++) {
        var d = destInv.slots[s]
        if (d && d.item === src.item && d.n + src.n <= cap) return move(inv, i, destInv, s)
      }
    }
    for (t = 0; t < list.length; t++) {
      destInv = list[t]
      if (!destInv || !destInv.allows(src.item)) continue
      for (k = 0; k < destInv.slots.length; k++) {
        if (!destInv.slots[k]) return move(inv, i, destInv, k)
      }
    }
    return { moved: 0, reason: 'full' }
  }

  function putInSlots(slots, item, n, cap) {
    var limit = cap || 64
    var next = (slots || []).map(function (s) { return s ? { item: s.item, n: s.n } : null })
    var left = n | 0
    if (!item || left <= 0) return { slots: next, left: 0 }
    var i
    for (i = 0; i < next.length && left; i++) {
      var s = next[i]
      if (!s || s.item !== item || s.n >= limit) continue
      var moveN = Math.min(limit - s.n, left)
      s.n += moveN
      left -= moveN
    }
    for (i = 0; i < next.length && left; i++) {
      if (next[i]) continue
      var put = Math.min(limit, left)
      next[i] = { item: item, n: put }
      left -= put
    }
    return { slots: next, left: left }
  }

  function createSession(rootEl) {
    var pick = null
    var guard = null
    var views = []
    var refreshFn = null
    var reg = {}

    function reduced() {
      if (cfg.reducedMotion && cfg.reducedMotion()) return true
      return false
    }

    function lookup(id) { return reg[id] || null }

    function setRefresh(fn) { refreshFn = fn }

    function refresh() {
      views = views.filter(function (v) { return v.el && v.el.isConnected })
      if (refreshFn) refreshFn()
      else views.forEach(draw)
    }

    function unpick() {
      if (!pick && !activeDrag) return
      pick = null
      refresh()
    }

    function hasPick() { return !!pick }

    function draw(view) {
      var inv = lookup(view.id)
      if (!inv) return
      var el = view.el
      el.classList.add('ks-grid')
      el.style.setProperty('--ks-cols', String(view.cols || 6))
      el.innerHTML = ''
      for (var i = 0; i < inv.slots.length; i++) el.append(slotButton(inv, i, view))
    }

    function slotButton(inv, i, view) {
      var s = inv.slots[i]
      var b = document.createElement('button')
      b.type = 'button'
      var picked = !!(pick && pick.id === inv.id && pick.i === i)
      b.className = 'ks-slot' + (s ? '' : ' ks-empty') + (picked ? ' ks-pick' : '')
      b.dataset.i = String(i)
      b.dataset.ksInv = inv.id
      if (s) b.dataset.item = s.item
      var label = s ? (cfg.name(s.item) + ' ' + s.n) : (cfg.t('emptySlot') || 'Empty')
      b.setAttribute('aria-label', label)
      b.setAttribute('aria-pressed', picked ? 'true' : 'false')
      var art = document.createElement('span')
      art.className = 'ks-art'
      if (s) {
        try {
          var node = cfg.icon(s.item)
          if (node) art.append(node)
        } catch (e) {}
      }
      b.append(art)
      if (s) {
        var badge = document.createElement('span')
        badge.className = 'ks-badge'
        badge.textContent = String(s.n)
        b.append(badge)
      }
      b.addEventListener('pointerdown', function (e) { beginDrag(b, inv, i, view, e) })
      b.addEventListener('click', function (e) { onSlot(inv, i, b, view, e) })
      return b
    }

    function onSlot(inv, i, el, view, ev) {
      if (guard && root.performance.now() < guard.until && ((el && guard.el === el) || (guard.id === inv.id && guard.i === i))) return
      var src = inv.slots[i]
      if (ev && ev.shiftKey && src) {
        var targets = (view && view.quick || []).map(lookup).filter(Boolean)
        var res = quickMove(inv, i, targets)
        if (!res.moved && res.reason === 'full' && cfg.toast) {
          var fullKey = targets[0] && String(targets[0].id || '').indexOf('box') === 0 ? 'boxFull' : 'bagFull'
          cfg.toast(cfg.t(fullKey) || fullKey)
        }
        if (res.moved) { pick = null; refresh() }
        return
      }
      if (pick && !(pick.id === inv.id && pick.i === i)) {
        var from = lookup(pick.id)
        if (from && from.slots[pick.i]) {
          var moved = move(from, pick.i, inv, i)
          if (moved.moved) { pick = null; refresh() }
          return
        }
      }
      if (pick && pick.id === inv.id && pick.i === i) { pick = null; refresh(); return }
      if (!src) return
      pick = { id: inv.id, i: i }
      refresh()
    }

    function beginDrag(el, inv, i, view, e) {
      if (!e || (e.button != null && e.button !== 0)) return
      if (!inv.slots[i]) return
      var pid = e.pointerId
      var start = e.pointerType === 'touch' ? 10 : 8
      var sx = e.clientX
      var sy = e.clientY
      var dragged = false
      var ghost = null
      var done = false
      var item = inv.slots[i].item
      function clearMarks() {
        var nodes = document.querySelectorAll('.drop-ok,.drop-bad')
        for (var n = 0; n < nodes.length; n++) nodes[n].classList.remove('drop-ok', 'drop-bad')
      }
      function targetAt(x, y) {
        var under = document.elementFromPoint(x, y)
        return under && under.closest ? under.closest('.ks-slot') : null
      }
      function preview(well) {
        if (!well) return false
        var to = lookup(well.dataset.ksInv)
        var j = +well.dataset.i
        if (!to || to === inv && j === i) return false
        var src = inv.slots[i]
        var dest = to.slots[j]
        if (!src) return false
        if (!dest) return to.allows(src.item)
        if (dest.item === src.item) return dest.n < capFor(to, src.item)
        return to.allows(src.item) && inv.allows(dest.item)
      }
      function finish(ev, cancel) {
        if (done) return
        if (ev && ev.pointerId != null && ev.pointerId !== pid) return
        done = true
        if (activeDrag && activeDrag.finish === finish) activeDrag = null
        root.removeEventListener('pointermove', moveEv, true)
        root.removeEventListener('pointerup', upEv, true)
        root.removeEventListener('pointercancel', upEv, true)
        try { el.releasePointerCapture(pid) } catch (err) {}
        clearMarks()
        if (ghost) ghost.remove()
        if (dragged) guard = { el: el, id: inv.id, i: i, until: root.performance.now() + 300 }
        if (!dragged || cancel) {
          if (!dragged && !cancel && ev && ev.pointerType && ev.pointerType !== 'mouse') {
            onSlot(inv, i, null, view, ev)
            guard = { el: el, id: inv.id, i: i, until: root.performance.now() + 300 }
          }
          return
        }
        var well = ev ? targetAt(ev.clientX, ev.clientY) : null
        if (!well) return
        var to = lookup(well.dataset.ksInv)
        var j = +well.dataset.i
        if (!to) return
        var res = move(inv, i, to, j)
        if (res.moved) { pick = null; refresh() }
      }
      function moveEv(ev) {
        if (ev.pointerId !== pid) return
        var dx = ev.clientX - sx
        var dy = ev.clientY - sy
        if (!dragged && dx * dx + dy * dy >= start * start) {
          dragged = true
          ghost = document.createElement('div')
          ghost.className = 'ks-ghost'
          if (reduced()) ghost.classList.add('ks-still')
          try {
            var node = cfg.icon(item)
            if (node) ghost.append(node)
          } catch (err) {}
          document.body.append(ghost)
        }
        if (!ghost) return
        ghost.style.left = ev.clientX + 'px'
        ghost.style.top = ev.clientY + 'px'
        clearMarks()
        var well = targetAt(ev.clientX, ev.clientY)
        if (well && well !== el) well.classList.add(preview(well) ? 'drop-ok' : 'drop-bad')
      }
      function upEv(ev) { finish(ev, ev.type === 'pointercancel') }
      activeDrag = { finish: finish }
      try { el.setPointerCapture(pid) } catch (err) {}
      root.addEventListener('pointermove', moveEv, true)
      root.addEventListener('pointerup', upEv, true)
      root.addEventListener('pointercancel', upEv, true)
    }

    function grid(el, inv, opts) {
      opts = opts || {}
      reg[inv.id] = inv
      views = views.filter(function (v) { return v.el !== el && v.el.isConnected })
      var view = {
        el: el,
        id: inv.id,
        cols: opts.cols || 6,
        quick: (opts.quick || []).map(function (q) { return q.id }),
      }
      views.push(view)
      el._ksInv = inv
      draw(view)
    }

    function activate(inv, i, ev) {
      var view = null
      for (var n = 0; n < views.length; n++) if (views[n].id === inv.id) view = views[n]
      onSlot(inv, i, null, view, ev || {})
    }

    function cancelDrag() {
      if (!activeDrag) return false
      activeDrag.finish(null, true)
      return true
    }

    var api = {
      grid: grid,
      activate: activate,
      unpick: unpick,
      hasPick: hasPick,
      cancelDrag: cancelDrag,
      setRefresh: setRefresh,
      move: move,
      quickMove: quickMove,
    }
    sessions.push(api)
    if (rootEl && root.MutationObserver) {
      var sheet = document.getElementById('sheet')
      if (sheet) {
        var obs = new root.MutationObserver(function () {
          if (sheet.hidden && pick) { pick = null }
        })
        obs.observe(sheet, { attributes: true, attributeFilter: ['hidden'] })
      }
    }
    return api
  }

  if (root.addEventListener) root.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return
    var i
    for (i = 0; i < sessions.length; i++) {
      if (sessions[i].cancelDrag()) {
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
    }
    for (i = 0; i < sessions.length; i++) {
      if (sessions[i].hasPick()) {
        sessions[i].unpick()
        e.preventDefault()
        e.stopImmediatePropagation()
        return
      }
    }
  }, true)

  root.KulibertSlots = {
    config: config,
    createInventory: createInventory,
    move: move,
    quickMove: quickMove,
    createSession: createSession,
    util: { putInSlots: putInSlots },
  }
})(typeof window !== 'undefined' ? window : globalThis)
