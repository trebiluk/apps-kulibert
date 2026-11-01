// Maker Pages (BERTOPIA-LORE.md §6). The Makers left 20 pages around the Verge; read in order they tell the story.
// Kids find them in any order. A found page is a learn note 'mp<N>' (same per-kid save as the farm notes), so no
// new save format. Page text keys are 'mp<N>' in strings-extra (LORE596).

export const PAGE_TOTAL = 20
export const PAGE_TOAST_DELAY = 2500
export const PAGE_TOAST_GAP = 4000

// event -> page. Events come from existing first-time moments only (no new world content in L01).
export const PAGE_TRIGGERS = {
  pathTool: 1, // first tool made: "We came to the Verge to learn how everything works."
  rebootkeeper: 4, // first Keeper rebooted: "The robots in the salt were our helpers…"
  rebootrustbot: 10, // first Rustbot rebooted: "Our robots forgot their instructions… They're lost."
  sleep: 2, // first night slept in a bed: "The Clock Gate keeps time for the whole land. Keep it turning."
  bakeGlass: 3, // first glass out of an oven: "Light bends in the glass trees. We used it to send messages."
  day2: 5, // first time the kid lives to Day 2: "The tide is a clock too. Everything here is a machine if you look."
}

export function pageIds(notes) {
  const out = []
  for (const id of notes || []) {
    const m = /^mp(\d{1,2})$/.exec(String(id))
    if (m) {
      const n = +m[1]
      if (n >= 1 && n <= PAGE_TOTAL && !out.includes(n)) out.push(n)
    }
  }
  return out.sort((a, b) => a - b)
}

export function isPageNote(id) { return /^mp\d{1,2}$/.test(String(id)) }

export function createLore({ learn, t, toast }) {
  const say = (k) => (t ? t(k) : k)
  // Two pages can land together (sleeping also turns Day 1 into Day 2). The calm queue lets a newer plain toast
  // replace a waiting one, so lore spaces its own lines PAGE_TOAST_GAP apart.
  let nextFree = 0
  function found() { return pageIds(learn && learn.notes ? learn.notes() : []) }
  function find(n) {
    n = n | 0
    if (n < 1 || n > PAGE_TOTAL || !learn || !learn.addNote) return false
    if (!learn.addNote('mp' + n)) return false
    // icon + words, never a sound-only cue; the full page stays in the Notebook. Wait a beat: the moment that found
    // the page has its own toast ("Wood Tool!", "Rebooted!"), and the calm queue lets a newer plain toast replace a
    // waiting one, so posting at the same instant would lose the page line.
    // Short on purpose: a 60-word page overflows the toast box at 1366, so the page itself lives in the Notebook.
    const now = Date.now()
    const wait = Math.max(PAGE_TOAST_DELAY, nextFree - now)
    nextFree = now + wait + PAGE_TOAST_GAP
    // The first Rustbot/Keeper reboot also opens the full-screen Bertodex card; hold the line until it closes.
    const post = (tries) => {
      if (typeof document !== 'undefined' && document.getElementById('bertodex-card') && tries < 120) { setTimeout(() => post(tries + 1), 500); return }
      toast('📜 ' + say('mpFound').replace('{n}', n))
    }
    if (toast) setTimeout(() => post(0), wait)
    return true
  }
  function on(evt) {
    const n = PAGE_TRIGGERS[evt] || PAGE_TRIGGERS[String(evt || '').toLowerCase()]
    return n ? find(n) : false
  }
  return { found, find, on }
}

// Notebook section: "📜 Maker Pages 3/20", then each found page in order.
export function paintPages(g, notes, t) {
  const say = (k) => (t ? t(k) : k)
  const ids = pageIds(notes)
  const head = document.createElement('p')
  head.className = 'gnote mp-head'
  head.textContent = '📜 ' + say('makerPages').replace('{n}', ids.length).replace('{total}', PAGE_TOTAL)
  g.append(head)
  if (!ids.length) {
    const p = document.createElement('p')
    p.className = 'gnote mp-none'
    p.textContent = say('mpNone')
    g.append(p)
    return ids.length
  }
  for (const n of ids) {
    const p = document.createElement('p')
    p.className = 'gnote mp-page'
    p.dataset.page = String(n)
    const b = document.createElement('b')
    b.textContent = say('mpLabel').replace('{n}', n) + ' '
    p.append(b, document.createTextNode(say('mp' + n)))
    g.append(p)
  }
  return ids.length
}
