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
      b.addEventListener('pointerdown', function (e) { if (blockSlot(e)) return; beginDrag(b, inv, i, view, e) })
      b.addEventListener('click', function (e) { if (blockSlot(e)) return; onSlot(inv, i, b, view, e) })
      return b
    }

    function onSlot(inv, i, el, view, ev) {
      if (slotsHeld()) return
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
      if (slotsHeld()) return
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

  function bounce(slot, message) {
    if (!slot) return
    slot.classList.add('ks-bounce')
    var host = slot.closest ? slot.closest('.ks-machine, .ks-craft') : null
    var line = host ? host.querySelector('[data-ks-bounce]') : null
    var lineStamp = 0
    if (line && message) {
      line.hidden = false
      line.textContent = message
      lineStamp = (line._ksBounce = (line._ksBounce || 0) + 1)
    }
    var stamp = (slot._ksBounce = (slot._ksBounce || 0) + 1)
    root.setTimeout(function () {
      if (slot._ksBounce === stamp) slot.classList.remove('ks-bounce')
      if (line && lineStamp && line._ksBounce === lineStamp) {
        line.hidden = true
        line.textContent = ''
      }
    }, 1500)
  }

  function bindName(opts) {
    if (opts && opts.name) return opts.name
    return cfg.name
  }
  function bindIcon(opts) {
    if (opts && opts.icon) return opts.icon
    return cfg.icon
  }
  function bindT(opts) {
    if (opts && opts.t) return opts.t
    return cfg.t
  }

  function fillArt(el, item, iconOf) {
    var art = el.querySelector('.ks-art')
    if (!art) return
    var next = item || ''
    if ((art.dataset.item || '') === next) return
    art.dataset.item = next
    art.innerHTML = ''
    if (!next) return
    try {
      var node = iconOf(next)
      if (node) art.append(node)
    } catch (e) {}
  }

  var slideClick = null
  var swallowClickUntil = 0
  var openPanels = []

  function slideTy() {
    var sheet = document.getElementById('sheet')
    if (!sheet) return 0
    var raw = root.getComputedStyle(sheet).transform
    if (!raw || raw === 'none') return 0
    try { return new root.DOMMatrix(raw).m42 || 0 } catch (e) { return 0 }
  }
  function slotOfEvent(e) {
    if (!e || !e.target || !e.target.closest) return null
    return e.target.closest('.ks-slot, .well[data-slot], #sheet[data-panel="inventory"] .well, .ks-choice, .oven-choice')
  }
  function slotFromPoint(x, y) {
    var under = document.elementFromPoint(x, y)
    if (!under || !under.closest) return null
    return under.closest('.ks-slot, .well[data-slot], #sheet[data-panel="inventory"] .well, .ks-choice, .oven-choice')
  }
  function holdClick(e, slot) {
    if (!e || (e.button != null && e.button > 0)) return
    var ty = slideTy()
    var seen = slot || slotOfEvent(e)
    if (!seen) seen = slotFromPoint(e.clientX, e.clientY)
    if (slideClick && slideClick.seen && slideClick.seen.isConnected && seen && seen !== slideClick.seen) return
    slideClick = { x: e.clientX, y: e.clientY - ty, shift: !!e.shiftKey, seen: seen || (slideClick && slideClick.seen) || null }
  }
  function dropClick() {
    slideClick = null
    swallowClickUntil = 0
  }
  function releaseClicks() {
    var job = slideClick
    slideClick = null
    if (!job) return
    var slot = null
    if (job.seen && job.seen.isConnected) slot = job.seen
    else if (job.seen) slot = slotFromPoint(job.x, job.y)
    if (!slot || !slot.isConnected) return
    swallowClickUntil = root.performance.now() + 500
    slot.__ksIgnoreUntil = swallowClickUntil
    slot.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: root,
      clientX: job.x,
      clientY: job.y,
      button: 0,
      shiftKey: !!job.shift,
    }))
  }
  function clearPicks() {
    dropClick()
    var i
    for (i = 0; i < sessions.length; i++) {
      try { sessions[i].cancelDrag() } catch (e) {}
      try { sessions[i].unpick() } catch (e2) {}
    }
    openPanels = openPanels.filter(function (p) { return p.alive() })
    for (i = 0; i < openPanels.length; i++) {
      try { openPanels[i].clear() } catch (e3) {}
    }
  }

  function slotsHeld() {
    var sheet = document.getElementById('sheet')
    return !!(sheet && !sheet.hidden && sheet.dataset.slotsReady === '0')
  }
  function guardSlot(e) {
    if (e && e.type === 'pointerdown' && swallowClickUntil && !slotsHeld()) swallowClickUntil = 0
    var slot = slotOfEvent(e)
    if (slotsHeld()) {
      if (e) {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'pointerdown' || e.type === 'click') holdClick(e, slot)
      }
      return true
    }
    if (e && e.type === 'click' && e.isTrusted !== false && swallowClickUntil && root.performance.now() < swallowClickUntil) {
      swallowClickUntil = 0
      if (slot) slot.__ksIgnoreUntil = 0
      e.preventDefault()
      e.stopPropagation()
      return true
    }
    return false
  }
  function blockSlot(e) { return guardSlot(e) }
  if (root.document && root.document.addEventListener) {
    root.document.addEventListener('pointerdown', function (e) {
      if (swallowClickUntil && !slotsHeld()) swallowClickUntil = 0
    }, true)
    root.document.addEventListener('click', function (e) {
      if (!e || e.isTrusted === false) return
      if (!swallowClickUntil || root.performance.now() >= swallowClickUntil) return
      var sheet = document.getElementById('sheet')
      if (!sheet || sheet.hidden || !e.target || !sheet.contains(e.target)) return
      swallowClickUntil = 0
      e.preventDefault()
      e.stopPropagation()
    }, true)
  }

  function armPointer(el, handlers, guardBox) {
    el.addEventListener('pointerdown', function (e) {
      if (blockSlot(e)) return
      if (!e || (e.button != null && e.button !== 0)) return
      var pid = e.pointerId
      var thresh = e.pointerType === 'touch' ? 10 : 8
      var sx = e.clientX
      var sy = e.clientY
      var dragged = false
      var ghost = null
      var done = false
      function clearMarks() {
        var nodes = document.querySelectorAll('.drop-ok,.drop-bad')
        for (var n = 0; n < nodes.length; n++) nodes[n].classList.remove('drop-ok', 'drop-bad')
      }
      function targetAt(x, y) {
        var under = document.elementFromPoint(x, y)
        if (!under || !under.closest) return null
        var well = under.closest('.ks-slot')
        if (well && handlers.root && !handlers.root.contains(well)) return null
        return well
      }
      function finish(ev, cancel) {
        if (done) return
        if (ev && ev.pointerId != null && ev.pointerId !== pid) return
        done = true
        root.removeEventListener('pointermove', moveEv, true)
        root.removeEventListener('pointerup', upEv, true)
        root.removeEventListener('pointercancel', upEv, true)
        try { el.releasePointerCapture(pid) } catch (err) {}
        clearMarks()
        if (ghost) ghost.remove()
        guardBox.guard = { el: el, until: root.performance.now() + 300 }
        if (dragged && !cancel && ev) {
          if (handlers.onDrop) handlers.onDrop(targetAt(ev.clientX, ev.clientY), ev)
          return
        }
        if (!dragged && !cancel && handlers.onActivate) handlers.onActivate(ev || e)
      }
      function moveEv(ev) {
        if (ev.pointerId !== pid) return
        if (handlers.canDrag && !handlers.canDrag()) return
        var dx = ev.clientX - sx
        var dy = ev.clientY - sy
        if (!dragged && dx * dx + dy * dy >= thresh * thresh) {
          dragged = true
          ghost = document.createElement('div')
          ghost.className = 'ks-ghost'
          if (cfg.reducedMotion && cfg.reducedMotion()) ghost.classList.add('ks-still')
          var item = handlers.item ? handlers.item() : ''
          if (item && handlers.icon) {
            try {
              var node = handlers.icon(item)
              if (node) ghost.append(node)
            } catch (err) {}
          }
          document.body.append(ghost)
        }
        if (!ghost) return
        ghost.style.left = ev.clientX + 'px'
        ghost.style.top = ev.clientY + 'px'
        clearMarks()
        var well = targetAt(ev.clientX, ev.clientY)
        if (well && well !== el) well.classList.add(handlers.accept && handlers.accept(well) ? 'drop-ok' : 'drop-bad')
      }
      function upEv(ev) { finish(ev, ev.type === 'pointercancel') }
      try { el.setPointerCapture(pid) } catch (err) {}
      root.addEventListener('pointermove', moveEv, true)
      root.addEventListener('pointerup', upEv, true)
      root.addEventListener('pointercancel', upEv, true)
    })
    el.addEventListener('click', function (e) {
      if (blockSlot(e)) return
      if (guardBox.guard && root.performance.now() < guardBox.guard.until && guardBox.guard.el === el) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      if (handlers.onActivate) handlers.onActivate(e)
    })
  }

  var FLAME = '<svg class="flame" viewBox="0 0 32 40" aria-hidden="true"><path d="M16 2c2 8 8 10 8 18a8 8 0 1 1-16 0c0-5 3-8 4-12 1 3 2 4 4 6z"/><path class="core" d="M16 18c1 4 4 5 4 9a4 4 0 1 1-8 0c0-3 2-4 4-9z"/></svg>'

  function sideBySide() {
    return root.innerHeight <= 500 && root.innerWidth >= 700
  }

  function machinePanel(el, opts) {
    opts = opts || {}
    var nameOf = bindName(opts)
    var iconOf = bindIcon(opts)
    var tr = bindT(opts)
    var pick = null
    var pickerRole = ''
    var pickSig = ''
    var guardBox = { guard: null }
    var alive = true
    var buttons = {}
    openPanels.push({
      alive: function () { return alive && card.isConnected },
      clear: function () {
        pick = null
        pickerRole = ''
        pickSig = ''
        if (!card.isConnected) return
        ensureBag()
        renderPicker()
      },
    })

    el.innerHTML = ''
    el.classList.add('ks-root')
    var card = document.createElement('div')
    card.className = 'ks-machine station-crate machine'
    var main = document.createElement('div')
    main.className = 'ks-main'
    var head = document.createElement('div')
    head.className = 'machine-head'
    var ic = document.createElement('span')
    ic.className = 'gic'
    if (opts.headerIcon || opts.icon) {
      try {
        var glyph = typeof opts.headerIcon === 'function' ? opts.headerIcon() : opts.headerIcon
        if (!glyph && typeof opts.icon === 'function') glyph = opts.icon('oven')
        if (glyph) ic.append(glyph)
      } catch (e) {}
    }
    var words = document.createElement('div')
    var title = document.createElement('span')
    title.className = 'machine-name'
    title.textContent = opts.title || ''
    var status = document.createElement('p')
    status.className = 'machine-status'
    status.setAttribute('role', 'status')
    words.append(title, status)
    head.append(ic, words)

    function slotButton(role, label) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'ks-slot ks-empty slot-' + (role === 'input' ? 'in' : role)
      b.dataset.ksRole = role
      b.dataset.role = role === 'input' ? 'input' : role
      var art = document.createElement('span')
      art.className = 'ks-art'
      var badge = document.createElement('span')
      badge.className = 'ks-badge'
      badge.hidden = true
      var lab = document.createElement('span')
      lab.className = 'ks-lab'
      lab.textContent = label || role
      b.append(art, badge, lab)
      buttons[role] = b
      armPointer(b, {
        root: card,
        item: function () { return '' },
        canDrag: function () { return false },
        icon: iconOf,
        onActivate: function (ev) { activateMachine(role, ev) },
      }, guardBox)
      return b
    }

    var inputs = document.createElement('div')
    inputs.className = 'ks-inputs'
    var fuelLabel = tr('fuel') || 'Fuel'
    var inputLabel = tr('input') || 'Input'
    var outputLabel = tr('output') || 'Output'
    inputs.append(slotButton('fuel', fuelLabel), slotButton('input', inputLabel))

    var process = document.createElement('div')
    process.className = 'ks-process'
    var flame = document.createElement('span')
    flame.className = 'flame-side out'
    flame.innerHTML = FLAME + '<i class="burn-bar"></i>'
    var arrow = document.createElement('div')
    arrow.className = 'arrow-bar'
    arrow.setAttribute('aria-hidden', 'true')
    var arrowFill = document.createElement('div')
    arrowFill.className = 'arrow-fill'
    arrow.append(arrowFill)
    var time = document.createElement('span')
    time.className = 'ks-time'
    var preview = document.createElement('div')
    preview.className = 'will-make'
    preview.hidden = true
    var previewArt = document.createElement('span')
    previewArt.className = 'gic ks-art'
    var previewLab = document.createElement('span')
    previewLab.className = 'glbl'
    preview.append(previewArt, previewLab)
    process.append(flame, arrow, time, preview)

    var outputs = document.createElement('div')
    outputs.className = 'ks-outputs'
    outputs.append(slotButton('output', outputLabel))

    var picks = document.createElement('div')
    picks.className = 'oven-picks oven-ask ks-picks'
    picks.hidden = true
    var note = document.createElement('p')
    note.className = 'fuel-chip'
    note.dataset.ksBounce = '1'
    note.setAttribute('role', 'status')
    note.hidden = true
    var hintClick = document.createElement('p')
    hintClick.className = 'gnote oven-click'
    var hintBake = document.createElement('p')
    hintBake.className = 'gnote oven-bakes'
    var bag = document.createElement('div')
    bag.className = 'ks-bag ks-bag-rows'
    main.append(head, inputs, process, outputs, picks, note, hintClick, hintBake)
    card.append(main, bag)
    el.append(card)

    function slotsNow() {
      var list = typeof opts.slots === 'function' ? opts.slots() : (opts.slots || [])
      return list || []
    }
    function slotByRole(role) {
      var list = slotsNow()
      for (var i = 0; i < list.length; i++) if (list[i] && list[i].role === role) return list[i]
      return null
    }
    function bagSlots() {
      var list = typeof opts.bag === 'function' ? opts.bag() : (opts.bag || [])
      return list || []
    }
    function paintOne(btn, desc) {
      if (!btn) return
      var item = desc && desc.item
      var n = desc && desc.n
      btn.classList.toggle('ks-empty', !item)
      fillArt(btn, item, iconOf)
      var badge = btn.querySelector('.ks-badge')
      if (item && n > 0) { badge.hidden = false; badge.textContent = String(n) }
      else badge.hidden = true
      var named = item ? (nameOf(item) || item) : ''
      var word = (desc && desc.label) || btn.querySelector('.ks-lab').textContent
      btn.setAttribute('aria-label', named ? word + ' ' + named + (n > 0 ? ' ' + n : '') : word)
      btn.title = named || word
    }
    function layoutBag() {
      var wide = sideBySide()
      card.classList.toggle('ks-side', wide)
      bag.className = 'ks-bag ' + (wide ? 'ks-bag-col' : 'ks-bag-rows')
    }
    function ensureBag() {
      var list = bagSlots()
      if (bag.children.length !== list.length) {
        bag.innerHTML = ''
        for (var i = 0; i < list.length; i++) bag.append(makeBag(i))
      }
      var nodes = bag.children
      for (var j = 0; j < list.length; j++) {
        var s = list[j]
        var b = nodes[j]
        var item = s && s.n > 0 ? s.item : ''
        b.dataset.item = item || ''
        b.dataset.i = String(j)
        b.classList.toggle('ks-empty', !item)
        b.classList.toggle('ks-pick', !!(pick && pick.i === j && item))
        fillArt(b, item, iconOf)
        var badge = b.querySelector('.ks-badge')
        if (item) { badge.hidden = false; badge.textContent = String(s.n) }
        else badge.hidden = true
        b.setAttribute('aria-label', item ? (nameOf(item) || item) + ' ' + s.n : (tr('emptySlot') || 'Empty'))
        b.setAttribute('aria-pressed', pick && pick.i === j ? 'true' : 'false')
      }
    }
    function makeBag(i) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'ks-slot ks-empty'
      b.dataset.ksBag = '1'
      var art = document.createElement('span')
      art.className = 'ks-art'
      var badge = document.createElement('span')
      badge.className = 'ks-badge'
      badge.hidden = true
      b.append(art, badge)
      armPointer(b, {
        root: card,
        item: function () {
          var s = bagSlots()[i]
          return s && s.n > 0 ? s.item : ''
        },
        canDrag: function () {
          var s = bagSlots()[i]
          return !!(s && s.n > 0)
        },
        icon: iconOf,
        accept: function (well) {
          var s = bagSlots()[i]
          return !!(s && well && acceptWell(well, s.item))
        },
        onActivate: function (ev) {
          var s = bagSlots()[i]
          if (!s || !(s.n > 0)) return
          activateBag(i, s.item, ev)
        },
        onDrop: function (well) {
          var s = bagSlots()[i]
          if (!s || !well) return
          dropOn(well, s.item)
        },
      }, guardBox)
      return b
    }
    function acceptWell(well, item) {
      if (!well || !item || well.dataset.ksBag) return false
      var desc = slotByRole(well.dataset.ksRole)
      if (!desc || desc.takeOnly) return false
      return desc.filter ? !!desc.filter(item) : false
    }
    function tryLoad(role, item, well) {
      var desc = slotByRole(role)
      var msg = opts.refuse ? opts.refuse(role, item) : ''
      if (!desc || desc.takeOnly || (desc.filter && !desc.filter(item))) {
        bounce(well || buttons[role], msg)
        pick = null
        update()
        return
      }
      var res = opts.onLoad ? opts.onLoad(role, item) : { ok: false }
      if (!res || res.ok === false) {
        if (res && res.message) bounce(well || buttons[role], res.message)
        else if (msg && desc.filter && !desc.filter(item)) bounce(well || buttons[role], msg)
        pick = null
        update()
        return
      }
      pick = null
      pickerRole = ''
      pickSig = ''
      update()
    }
    function activateMachine(role, ev) {
      if (role === 'output') {
        if (opts.onTake) opts.onTake()
        pick = null
        pickerRole = ''
        update()
        return
      }
      if (pick && pick.item) {
        tryLoad(role, pick.item, buttons[role])
        return
      }
      var desc = slotByRole(role)
      if (!desc || !desc.item) {
        pickerRole = pickerRole === role ? '' : role
        pickSig = ''
        renderPicker()
        return
      }
    }
    function activateBag(i, item, ev) {
      if (ev && ev.shiftKey) {
        var list = slotsNow()
        for (var n = 0; n < list.length; n++) {
          var desc = list[n]
          if (!desc || desc.takeOnly) continue
          if (desc.filter && desc.filter(item)) {
            tryLoad(desc.role, item, buttons[desc.role])
            return
          }
        }
        return
      }
      if (pick && pick.i === i) pick = null
      else pick = { i: i, item: item }
      pickerRole = ''
      update()
    }
    function dropOn(well, item) {
      var role = well.dataset.ksRole
      if (!role) return
      tryLoad(role, item, well)
    }
    function renderPicker() {
      if (!pickerRole) {
        picks.hidden = true
        picks.innerHTML = ''
        pickSig = ''
        return
      }
      var desc = slotByRole(pickerRole)
      var list = bagSlots()
      var fit = []
      var seen = {}
      for (var i = 0; i < list.length; i++) {
        var s = list[i]
        if (!s || !(s.n > 0)) continue
        if (desc && desc.filter && !desc.filter(s.item)) continue
        if (!seen[s.item]) { seen[s.item] = fit.length; fit.push({ item: s.item, n: 0 }) }
        fit[seen[s.item]].n += s.n
      }
      var sig = pickerRole + '|' + fit.map(function (row) { return row.item + ':' + row.n }).join(',')
      picks.hidden = false
      picks.dataset.ask = pickerRole
      if (sig === pickSig && picks.childElementCount) return
      pickSig = sig
      picks.innerHTML = ''
      if (!fit.length) {
        var empty = document.createElement('p')
        empty.className = 'gnote'
        empty.textContent = pickerRole === 'fuel' ? (tr('addFuelWood') || '') : (tr('nothingBake') || '')
        picks.append(empty)
        return
      }
      for (var f = 0; f < fit.length; f++) {
        (function (row) {
          var b = document.createElement('button')
          b.type = 'button'
          b.className = 'gtile oven-choice ks-choice'
          b.dataset.item = row.item
          b.dataset.fit = pickerRole
          var art = document.createElement('span')
          art.className = 'ks-art gic'
          try {
            var node = iconOf(row.item)
            if (node) art.append(node)
          } catch (err) {}
          var lab = document.createElement('span')
          lab.className = 'glbl'
          var named = nameOf(row.item) || row.item
          lab.textContent = named + ' ×' + row.n
          b.append(art, lab)
          b.setAttribute('aria-label', named)
          armPointer(b, {
            root: card,
            canDrag: function () { return false },
            onActivate: function () {
              var role = pickerRole
              pickerRole = ''
              pickSig = ''
              tryLoad(role, row.item, buttons[role])
            },
          }, guardBox)
          picks.append(b)
        })(fit[f])
      }
    }
    function update() {
      if (!alive) return
      if (!card.isConnected) {
        if (update.seen) destroy()
        return
      }
      update.seen = true
      layoutBag()
      var text = ''
      try { text = typeof opts.status === 'function' ? opts.status() : (opts.status || '') } catch (e) {}
      status.textContent = text || ''
      paintOne(buttons.fuel, slotByRole('fuel'))
      paintOne(buttons.input, slotByRole('input'))
      paintOne(buttons.output, slotByRole('output'))
      var proc = {}
      try { proc = typeof opts.process === 'function' ? opts.process() : (opts.process || {}) } catch (e2) { proc = {} }
      arrowFill.style.width = Math.round((proc.pct || 0) * 100) + '%'
      var burning = !!proc.burning
      var lit = !!proc.lit
      flame.className = 'flame-side' + (lit ? ' lit' : ' out') + (burning ? ' burn' : '')
      flame.style.setProperty('--burn', String(proc.burn || 0))
      var bar = flame.querySelector('.burn-bar')
      if (bar) bar.style.width = Math.round((proc.burn || 0) * 100) + '%'
      time.textContent = proc.label || ''
      if (proc.previewItem) {
        preview.hidden = false
        fillArt(preview, proc.previewItem, iconOf)
        previewLab.textContent = proc.previewText || ''
        preview.title = proc.previewText || ''
      } else preview.hidden = true
      var notes = []
      try { notes = typeof opts.notes === 'function' ? opts.notes() : (opts.notes || []) } catch (e3) { notes = [] }
      hintClick.textContent = notes[0] || ''
      hintBake.textContent = notes[1] || ''
      ensureBag()
      if (pickerRole) {
        var open = slotByRole(pickerRole)
        if (open && open.item) { pickerRole = ''; pickSig = '' }
      }
      renderPicker()
    }
    function onResize() { if (alive) update() }
    function destroy() {
      if (!alive) return
      alive = false
      root.clearInterval(timer)
      root.removeEventListener('resize', onResize)
    }
    var timer = root.setInterval(update, 250)
    root.addEventListener('resize', onResize)
    root.requestAnimationFrame(update)
    update()
    return { update: update, destroy: destroy }
  }

  function craftPanel(el, opts) {
    opts = opts || {}
    var nameOf = bindName(opts)
    var iconOf = bindIcon(opts)
    var tr = bindT(opts)
    var recipe = opts.recipe || { in: [], out: ['', 1] }
    var pick = null
    var guardBox = { guard: null }
    openPanels.push({
      alive: function () { return card.isConnected },
      clear: function () {
        pick = null
        if (card.isConnected) paintBag()
      },
    })
    el.innerHTML = ''
    el.classList.add('ks-root')
    var card = document.createElement('div')
    card.className = 'ks-craft'
    var line = document.createElement('div')
    line.className = 'tray-line'
    var wells = []
    function placedNow() {
      var list = typeof opts.placed === 'function' ? opts.placed() : (opts.placed || [])
      return list || []
    }
    function bagSlots() {
      var list = typeof opts.bag === 'function' ? opts.bag() : (opts.bag || [])
      return list || []
    }
    function needText(item) {
      var raw = tr('slotNeeds') || 'This slot needs {item}'
      return raw.replace('{item}', nameOf(item) || item)
    }
    recipe.in.forEach(function (pair, index) {
      var item = pair[0]
      var n = pair[1]
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'ks-slot ing'
      b.dataset.i = String(index)
      b.dataset.need = item
      b.dataset.ksRole = 'ing'
      var art = document.createElement('span')
      art.className = 'ks-art'
      var badge = document.createElement('span')
      badge.className = 'ks-badge'
      var lab = document.createElement('span')
      lab.className = 'ks-lab'
      lab.textContent = nameOf(item) || item
      b.append(art, badge, lab)
      armPointer(b, {
        root: card,
        canDrag: function () { return false },
        icon: iconOf,
        onActivate: function () { activateIng(index, b) },
      }, guardBox)
      line.append(b)
      wells.push(b)
    })
    var arrow = document.createElement('div')
    arrow.className = 'chunk-arrow'
    arrow.setAttribute('aria-hidden', 'true')
    line.append(arrow)
    var result = document.createElement('div')
    result.className = 'well result'
    var resultArt = document.createElement('span')
    resultArt.className = 'art ks-art'
    try {
      var outNode = iconOf(recipe.out[0])
      if (outNode) resultArt.append(outNode)
    } catch (e) {}
    var resultLab = document.createElement('span')
    resultLab.className = 'wlab'
    resultLab.textContent = opts.resultName || (nameOf(recipe.out[0]) || '')
    result.append(resultArt, resultLab)
    line.append(result)

    var bag = document.createElement('div')
    bag.className = 'ks-bag ks-bag-rows'
    var list = bagSlots()
    for (var i = 0; i < list.length; i++) bag.append(makeBag(i))
    var note = document.createElement('p')
    note.className = 'slot-chip fuel-chip'
    note.dataset.ksBounce = '1'
    note.setAttribute('role', 'status')
    note.hidden = true
    var keys = document.createElement('div')
    keys.className = 'keys'
    var fillBtn = document.createElement('button')
    fillBtn.type = 'button'
    fillBtn.className = 'keycap fill'
    fillBtn.textContent = opts.fillLabel || tr('fillTray') || 'Fill'
    fillBtn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (opts.onFill) opts.onFill()
    })
    var makeBtn = document.createElement('button')
    makeBtn.type = 'button'
    makeBtn.className = 'keycap make' + (opts.bake ? ' bake' : '') + (!opts.makeDisabled && !opts.bake ? ' lit' : '')
    makeBtn.disabled = !!opts.makeDisabled
    if (opts.bake && opts.ovenIcon) {
      var mic = document.createElement('span')
      mic.className = 'art'
      try { var mn = opts.ovenIcon(); if (mn) mic.append(mn) } catch (err) {}
      var mlab = document.createElement('span')
      mlab.textContent = opts.makeLabel || ''
      makeBtn.append(mic, mlab)
    } else makeBtn.textContent = opts.makeLabel || tr('make') || 'Make'
    makeBtn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (makeBtn.disabled) return
      if (opts.onMake) opts.onMake()
    })
    var maxBtn = document.createElement('button')
    maxBtn.type = 'button'
    maxBtn.className = 'keycap xmax'
    maxBtn.textContent = opts.maxLabel || tr('timesMax') || '×Max'
    maxBtn.disabled = !!opts.maxDisabled
    maxBtn.addEventListener('click', function (e) {
      e.preventDefault()
      e.stopPropagation()
      if (maxBtn.disabled) return
      if (opts.onMax) opts.onMax()
    })
    keys.append(fillBtn, makeBtn, maxBtn)
    card.append(line, bag, note, keys)
    el.append(card)
    paintWells()
    paintBag()

    function paintWells() {
      var placed = placedNow()
      for (var w = 0; w < wells.length; w++) {
        var pair = recipe.in[w]
        var have = placed[w] || 0
        var b = wells[w]
        b.dataset.placed = String(have)
        b.classList.toggle('ks-empty', have <= 0)
        b.classList.toggle('ghost', have <= 0)
        b.classList.toggle('done', have >= pair[1])
        fillArt(b, pair[0], iconOf)
        var badge = b.querySelector('.ks-badge')
        badge.hidden = false
        badge.textContent = have + '/' + pair[1]
        var check = b.querySelector('.check')
        if (have >= pair[1] && !check) {
          check = document.createElement('span')
          check.className = 'check'
          check.textContent = '✓'
          check.setAttribute('aria-hidden', 'true')
          b.append(check)
        } else if (have < pair[1] && check) check.remove()
        b.setAttribute('aria-label', (nameOf(pair[0]) || pair[0]) + ' ' + have + '/' + pair[1])
      }
    }
    function paintBag() {
      var slots = bagSlots()
      var nodes = bag.children
      for (var j = 0; j < nodes.length; j++) {
        var s = slots[j]
        var b = nodes[j]
        var item = s && s.n > 0 ? s.item : ''
        b.dataset.item = item || ''
        b.dataset.slot = String(j)
        b.classList.toggle('ks-empty', !item)
        b.classList.toggle('ks-pick', !!(pick && pick.i === j && item))
        b.setAttribute('aria-pressed', pick && pick.i === j ? 'true' : 'false')
        fillArt(b, item, iconOf)
        var badge = b.querySelector('.ks-badge')
        if (item) { badge.hidden = false; badge.textContent = String(s.n) }
        else badge.hidden = true
        b.setAttribute('aria-label', item ? (nameOf(item) || item) + ' ' + s.n : (tr('emptySlot') || 'Empty'))
      }
    }
    function makeBag(i) {
      var b = document.createElement('button')
      b.type = 'button'
      b.className = 'ks-slot ks-empty'
      b.dataset.ksBag = '1'
      var art = document.createElement('span')
      art.className = 'ks-art'
      var badge = document.createElement('span')
      badge.className = 'ks-badge'
      badge.hidden = true
      b.append(art, badge)
      armPointer(b, {
        root: card,
        item: function () {
          var s = bagSlots()[i]
          return s && s.n > 0 ? s.item : ''
        },
        canDrag: function () {
          var s = bagSlots()[i]
          return !!(s && s.n > 0)
        },
        icon: iconOf,
        accept: function (well) {
          var s = bagSlots()[i]
          return !!(s && accepts(well, s.item))
        },
        onActivate: function (ev) {
          var s = bagSlots()[i]
          if (!s || !(s.n > 0)) return
          activateBag(i, s.item, ev)
        },
        onDrop: function (well) {
          var s = bagSlots()[i]
          if (!s || !well) return
          dropOn(well, s.item)
        },
      }, guardBox)
      return b
    }
    var WOOL_ANY = { woolBlue: 1, woolGreen: 1, woolRed: 1, woolTan: 1 }
    var STONE_ANY = { stone: 1, slate: 1, coal: 1 }
    var PLANK_ANY = { planks: 1, birchPlanks: 1, pinePlanks: 1 }
    function ingMatch(need, item) {
      if (need === item) return true
      if (need === 'woolAny' && WOOL_ANY[item]) return true
      if (need === 'stoneAny' && STONE_ANY[item]) return true
      if (need === 'plankAny' && PLANK_ANY[item]) return true
      return false
    }
    function accepts(well, item) {
      if (!well || well.dataset.ksRole !== 'ing') return false
      var index = +well.dataset.i
      var pair = recipe.in[index]
      if (!pair || !ingMatch(pair[0], item)) return false
      return (placedNow()[index] || 0) < pair[1]
    }
    function dropOn(well, item) {
      var index = +well.dataset.i
      var pair = recipe.in[index]
      if (!pair || !ingMatch(pair[0], item)) {
        bounce(well, pair ? needText(pair[0]) : '')
        return
      }
      if (opts.onPlace) opts.onPlace(index, item)
    }
    function activateIng(index, well) {
      var pair = recipe.in[index]
      var have = placedNow()[index] || 0
      if (pick && pick.item) {
        if (have >= pair[1] && ingMatch(pair[0], pick.item)) {
          pick = null
          if (opts.onReturn) opts.onReturn(index)
          return
        }
        if (!ingMatch(pair[0], pick.item)) {
          bounce(well, needText(pair[0]))
          pick = null
          paintBag()
          return
        }
        if (opts.onPlace) opts.onPlace(index, pick.item)
        return
      }
      if (have > 0 && opts.onReturn) opts.onReturn(index)
    }
    function activateBag(i, item, ev) {
      if (ev && ev.shiftKey) {
        var placed = placedNow()
        for (var n = 0; n < recipe.in.length; n++) {
          var pair = recipe.in[n]
          if (ingMatch(pair[0], item) && (placed[n] || 0) < pair[1]) {
            if (opts.onPlace) opts.onPlace(n, item)
            return
          }
        }
        var wrong = wells[0]
        for (var w = 0; w < recipe.in.length; w++) if (recipe.in[w][0] !== item) { wrong = wells[w]; break }
        if (wrong) bounce(wrong, needText(recipe.in[+wrong.dataset.i][0]))
        return
      }
      if (pick && pick.i === i) pick = null
      else pick = { i: i, item: item }
      paintBag()
    }
    return { root: card }
  }

  root.KulibertSlots = {
    config: config,
    createInventory: createInventory,
    move: move,
    quickMove: quickMove,
    createSession: createSession,
    util: { putInSlots: putInSlots },
    ui: { machinePanel: machinePanel, craftPanel: craftPanel, bounce: bounce },
    guardSlot: guardSlot,
    holdClick: holdClick,
    dropClick: dropClick,
    releaseClicks: releaseClicks,
    clearPicks: clearPicks,
  }
})(typeof window !== 'undefined' ? window : globalThis)
