// Decay for the personal host (adults 18+; Diego, Nov 1): food rots, the bag wears. HOME BUILD ONLY: every caller is
// inside `if (__HOME_HOST__)`, and this file has no top-level side effects, so the student build drops it.
// Pure: no DOM, no clock of its own. Survival only (the callers check the mode).
//
// Food: berries, cupcakes and bread age while you play (not while the game is closed or hidden). Half-way they are
//   stale (half energy, at least 1). At the end of their life the stack turns into Rotten food, same count.
// Rotten food: eat it (a gamble: nothing, +1 energy, or -1 energy and slower for a bit), throw it out (Drop), or use
//   it on a crop or bush as compost (grows it a quarter of the way at once).
// Bag: wears with play time, faster when it is full. Every 20% of wear tears one pocket slot (hotbar slots never
//   tear; at most 5 of the 6 pockets). A torn slot keeps what is in it, but nothing new goes in. A Bag patch (1 tan
//   wool at the craft list) mends 20%.

export const ROTTEN = 'rotten'
export const PATCH = 'bagPatch'
const MIN = 60 * 1000
export const FOOD_LIFE_MS = { berry: 20 * MIN, cupcake: 40 * MIN, bread: 60 * MIN }
export const STALE_AT = 0.5
export const WEAR_STEP = 20                 // % of wear per torn slot
export const WEAR_MAX = 100
export const WEAR_FULL_MS = 180000           // 1% wear per 3 min of play with a full bag...
export const WEAR_LIGHT_MS = 600000        // ...or per 10 min with a light one
export const FULL_STACKS = 10               // "full" = this many slots in use
export const HOTBAR = 9
export const PATCH_MENDS = 20
export const COMPOST_SHARE = 0.25
export const QUEASY_MS = 20000

export const isFood = (item) => Object.prototype.hasOwnProperty.call(FOOD_LIFE_MS, item)
const age = (s) => (Number.isFinite(s && s.age) && s.age > 0 ? s.age : 0)

// 1 (fresh) .. 0 (about to rot); null for anything that does not rot
export function freshness(s) {
  if (!s || !isFood(s.item)) return null
  return Math.max(0, 1 - age(s) / FOOD_LIFE_MS[s.item])
}
export function foodState(s) {
  if (s && s.item === ROTTEN) return 'rotten'
  const f = freshness(s)
  if (f === null) return null
  return f > STALE_AT ? 'fresh' : 'stale'
}
// energy from one bite: stale food gives half (at least 1)
export function feedFor(s, base) {
  if (!(base > 0)) return 0
  return foodState(s) === 'stale' ? Math.max(1, Math.floor(base / 2)) : base
}

// ---- the bag
export function makeState() { return { wear: 0 } }
export function loadState(raw) { const w = raw && Number.isFinite(+raw.wear) ? +raw.wear : 0; return { wear: Math.max(0, Math.min(WEAR_MAX, w)) } }
export const dumpState = (st) => ({ wear: Math.round(st.wear * 100) / 100 })
// usable slots for a bag of n: one fewer per WEAR_STEP, never into the hotbar, at least HOTBAR + 1
export function usableSlots(st, n) { return Math.max(HOTBAR + 1, n - Math.floor((st ? st.wear : 0) / WEAR_STEP)) }
export const isTorn = (st, i, n) => i >= usableSlots(st, n)

// The hook createBag() calls in the home build: torn slots take nothing new; food added to a stack makes it a
// little fresher (the stack's age is the average of its items).
export function bagHook(st, size) {
  return {
    open: (i) => !isTorn(st, i, size),
    // s already holds s.n including the `added` new (age 0) items
    merge(s, added) { if (isFood(s.item) && s.n > 0) s.age = age(s) * Math.max(0, s.n - added) / s.n },
    fresh(s) { if (isFood(s.item)) s.age = 0 },
  }
}

// Time passes (survival, game visible). Mutates slots and state. -> { rotted: [item...], torn: number newly torn }
export function tick(st, slots, ms) {
  const out = { rotted: [], torn: 0 }
  if (!(ms > 0)) return out
  const step = Math.min(ms, 5 * MIN)            // a long hitch never rots a fresh stack in one go
  for (let i = 0; i < slots.length; i++) {
    const s = slots[i]
    if (!s || !isFood(s.item)) continue
    s.age = age(s) + step
    if (s.age >= FOOD_LIFE_MS[s.item]) { out.rotted.push(s.item); slots[i] = { item: ROTTEN, n: s.n } }
  }
  const used = slots.filter(Boolean).length
  const before = usableSlots(st, slots.length)
  st.wear = Math.min(WEAR_MAX, st.wear + step / (used >= FULL_STACKS ? WEAR_FULL_MS : WEAR_LIGHT_MS))
  out.torn = before - usableSlots(st, slots.length)
  return out
}
// a Bag patch: -> the wear mended (0 when the bag is already fine)
export function patch(st) { const was = st.wear; st.wear = Math.max(0, st.wear - PATCH_MENDS); return was - st.wear }

// ---- rotten food
// eat one: -> { bolts: -1|0|1, slowMs, say: 'rottenYuck'|'rottenOk'|'rottenSick' }
export function eatRotten(rand = Math.random) {
  const r = rand()
  if (r < 0.4) return { bolts: 0, slowMs: 0, say: 'rottenYuck' }
  if (r < 0.7) return { bolts: 1, slowMs: 0, say: 'rottenOk' }
  return { bolts: -1, slowMs: QUEASY_MS, say: 'rottenSick' }
}
// compost a crop record (farm.js shape: grown, lastSeen); cap = capOf(crop). -> growth added (0 = already ripe)
export function compost(crop, cap) {
  if (!crop || !(cap > 0)) return 0
  const g = Math.max(0, +crop.grown || 0)
  if (g >= cap) return 0
  const next = Math.min(cap, g + cap * COMPOST_SHARE)
  crop.grown = next
  return next - g
}

// English-only text (the personal host's own words; Diego, Nov 1)
export const DECAY_STRINGS = {
  rotten: 'Rotten food', bagPatch: 'Bag patch',
  foodFresh: 'fresh', foodStale: 'stale',
  rottenYuck: 'Yuck. Nothing happens.', rottenOk: 'Not bad, actually. +1 energy.', rottenSick: 'Your stomach turns. -1 energy, and you are slower for a bit.',
  foodRotted: '{item} went rotten.', composted: 'Composted. The crop grows faster.', compostRipe: 'This one is already ripe.',
  bagWear: 'Bag wear {p}% · {n} slots', bagTornSlot: 'Torn slot: nothing new fits here', bagTore: 'Your bag is wearing out: a slot tore. Make a Bag patch in the craft list.',
  bagPatched: 'Bag patched. Wear {p}%.', bagFine: 'Your bag is in good shape.',
}
// the two home items and the patch recipe, in the game's own shapes (data/items.js, data/recipes.js)
export const DECAY_ITEMS = {   // literal keys (= ROTTEN, PATCH) so the student build can drop this file whole
  rotten: { letter: 'Ro', cat: 'Food', base: 0, sell: false },
  bagPatch: { letter: 'Pa', base: 0, sell: false, stack: 16 },
}
export const DECAY_RECIPES = [{ id: 'bagPatch', at: 'bench', in: [['woolTan', 1]], out: ['bagPatch', 1], secs: 2 }]
