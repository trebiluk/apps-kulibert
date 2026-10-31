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

// ---- Oven (part 2). Slots have meaning: 0 input, 1 fuel, 2 output. Numbers from the game:
// recipes from bloxbert-src/src/data/recipes.js (at: 'oven'), fuel from stations.js BAKES, ids from
// data/ids.js FROZEN. Only items with a frozen numeric id can live on the server, so the farm-pack oven
// recipes (flour, bread, cupcake) and pinecone fuel wait for an item-id table.
export const OVEN = 23
export const OVEN_IN = 0, OVEN_FUEL = 1, OVEN_OUT = 2
export const FUEL = { 10: 1, 11: 4, 5: 8 }                      // planks 1 bake, log 4, coal 8
export const OVEN_RECIPES = {
  6: { n: 2, out: 20, k: 1, ms: 5000 },                         // sand x2 -> glass x1, 5 s
  19: { n: 2, out: 8, k: 1, ms: 5000 },                         // red sand x2 -> red brick x1, 5 s
}
// Which slot an item may be put into. -> slot index, or null if this container does not take it there.
export function slotFor(containerId, item) {
  if (containerId !== OVEN) return undefined                    // undefined = any slot (a box)
  if (Object.prototype.hasOwnProperty.call(FUEL, item)) return OVEN_FUEL
  if (Object.prototype.hasOwnProperty.call(OVEN_RECIPES, item)) return OVEN_IN
  return null                                                   // the output slot is never put into
}
// Put into a container, honouring slot roles. -> { slots, left } or { error:'slot' }
export function putInto(containerId, slots, item, n) {
  const at = slotFor(containerId, item)
  if (at === undefined) return put(slots, item, n)
  if (at === null) return { error: 'slot' }
  const out = slots.map((q) => (q ? { ...q } : null))
  const cur = out[at]
  if (cur && cur.id !== item) return { slots: out, left: n }    // the slot holds something else: nothing fits
  const have = cur ? cur.n : 0
  const k = Math.min(STACK - have, n)
  if (k > 0) out[at] = { id: item, n: have + k }
  return { slots: out, left: n - k }
}

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
