// Maker Pages (BERTOPIA-LORE.md §6). The Makers left 20 pages around the Verge; read in order they tell the story.
// Kids find them in any order. A found page is a learn note 'mp<N>' (same per-kid save as the farm notes), so no
// new save format. Page text keys are 'mp<N>' in strings-extra (LORE596).

export const PAGE_TOTAL = 20
export const PAGE_TOAST_DELAY = 2500

// event -> page. Events come from existing first-time moments only (no new world content in L01).
export const PAGE_TRIGGERS = {
  pathTool: 1, // first tool made: "We came to the Verge to learn how everything works."
  rebootkeeper: 4, // first Keeper rebooted: "The robots in the salt were our helpers…"
  rebootrustbot: 10, // first Rustbot rebooted: "Our robots forgot their instructions… They're lost."
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
  function found() { return pageIds(learn && learn.notes ? learn.notes() : []) }
  function find(n) {
    n = n | 0
    if (n < 1 || n > PAGE_TOTAL || !learn || !learn.addNote) return false
    if (!learn.addNote('mp' + n)) return false
    // icon + words, never a sound-only cue; the full page stays in the Notebook. Wait a beat: the moment that found
    // the page has its own toast ("Wood Tool!", "Rebooted!"), and the calm queue lets a newer plain toast replace a
    // waiting one, so posting at the same instant would lose the page line.
    // Short on purpose: a 60-word page overflows the toast box at 1366, so the page itself lives in the Notebook.
    if (toast) setTimeout(() => toast('📜 ' + say('mpFound').replace('{n}', n)), PAGE_TOAST_DELAY)
    return true
  }
  function on(evt) {
    const n = PAGE_TRIGGERS[String(evt || '').toLowerCase()] || PAGE_TRIGGERS[evt]
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
