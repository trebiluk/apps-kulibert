// Items inside containers on the live server (item transport part 1). Pure.
// A container cell (box 27, oven 23) has fixed slots; a slot is { id, n } with 1 <= n <= STACK or null.
// Nothing is ever destroyed: put() returns what did not fit, take() returns what it got.
// Item ids are the game's numeric ids (never names). Saved in the chunk field `i` (see chunks.js).
export const STACK = 64
export const CONTAINERS = { 27: 18, 23: 3 }        // id -> slot count (box: box.js BOX_SLOTS = 18; oven: in, fuel, out)
export const isContainer = (id) => Object.prototype.hasOwnProperty.call(CONTAINERS, id)
export const slotsOf = (id) => CONTAINERS[id] || 0
export const validItem = (id) => Number.isInteger(id) && id > 0 && id <= 65535
export const validCount = (n) => Number.isInteger(n) && n >= 1 && n <= STACK          // one slot's worth (save rows)
export const MOVE_MAX = STACK * 18                                                        // most items in one put/take (a full box)
export const validMove = (n) => Number.isInteger(n) && n >= 1 && n <= MOVE_MAX

export const emptySlots = (id) => Array.from({ length: slotsOf(id) }, () => null)

// Put n of item into slots: top up matching stacks first, then empty slots. -> { slots, left }
export function put(slots, id, n) {
  const out = slots.map((s) => (s ? { ...s } : null))
  let left = n
  for (const s of out) { if (!left) break; if (s && s.id === id && s.n < STACK) { const k = Math.min(STACK - s.n, left); s.n += k; left -= k } }
  for (let i = 0; i < out.length && left; i++) { if (!out[i]) { const k = Math.min(STACK, left); out[i] = { id, n: k }; left -= k } }
  return { slots: out, left }
}

// Take up to n of item from slots (last stacks first). -> { slots, got }
export function take(slots, id, n) {
  const out = slots.map((s) => (s ? { ...s } : null))
  let got = 0
  for (let i = out.length - 1; i >= 0 && got < n; i--) {
    const s = out[i]
    if (!s || s.id !== id) continue
    const k = Math.min(s.n, n - got)
    s.n -= k; got += k
    if (!s.n) out[i] = null
  }
  return { slots: out, got }
}

export const count = (slots, id) => slots.reduce((a, s) => a + (s && s.id === id ? s.n : 0), 0)
export const isEmpty = (slots) => slots.every((s) => !s)

// Breaking a container that holds items (Diego, Oct 31; replaces the part 1 'not-empty' refusal):
// a player break or wrench drops 80% of each stack, rounded per stack (the other 20% is lost); an
// explosion drops everything. -> [{ id, n }] one entry per non-empty stack that keeps at least one item.
export const BREAK_KEEP = 0.8
export const EXPLODE_KEEP = 1
export function dropsOf(slots, keep) {
  const out = []
  for (const s of slots || []) {
    if (!s) continue
    const n = Math.round(s.n * keep)
    if (n > 0) out.push({ id: s.id, n })
  }
  return out
}

// Save rows: [[idx, [[slot, id, n], ...]], ...]  sparse, only cells with something in them.
export function encodeItems(items) {
  const rows = []
  for (const [idx, slots] of items) {
    const r = []
    slots.forEach((s, i) => { if (s) r.push([i, s.id, s.n]) })
    if (r.length) rows.push([idx, r])
  }
  return rows
}

// rows -> Map idx -> slots. blockAt(idx) gives the block id so slot counts come from the block; a row
// for a cell that is no longer a container, or a slot past the count, is dropped (never thrown).
export function decodeItems(rows, blockAt) {
  const items = new Map()
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!Array.isArray(row) || !Number.isInteger(row[0]) || !Array.isArray(row[1])) continue
    const n = slotsOf(blockAt(row[0]))
    if (!n) continue
    const slots = Array.from({ length: n }, () => null)
    for (const s of row[1]) {
      if (!Array.isArray(s) || !Number.isInteger(s[0]) || s[0] < 0 || s[0] >= n || !validItem(s[1]) || !validCount(s[2])) continue
      slots[s[0]] = { id: s[1], n: s[2] }
    }
    if (!isEmpty(slots)) items.set(row[0], slots)
  }
  return items
}
