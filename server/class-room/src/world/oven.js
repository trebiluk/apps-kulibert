// Oven conversion on the live server (item transport part 2). Pure.
// Runs on the oven's existing time counter: the sim grants elapsed ms (60-min offline cap from 0068) and
// bake() turns it into finished bakes. A bake needs: a recipe input (n items), a burning fuel bake or a
// fuel item to light, and room in the output slot (one stack, max 64, same item). If any is missing the
// oven PAUSES: nothing is consumed, the partial progress is kept, and the rest of the granted time is
// dropped (a paused oven does not bank time). Input and fuel are taken only when a bake completes, so
// nothing is ever lost. Deterministic: bake(a) then bake(b) equals bake(a + b) when nothing outside changes.
import { FUEL, OVEN_FUEL, OVEN_IN, OVEN_OUT, OVEN_RECIPES, STACK } from './items.js'

export const MAX_BAKES_PER_STEP = 720       // 60 min / 5 s: a full catch-up, never more work than that per step

// slots: [in, fuel, out]; st: { prog, left } (ms toward the current bake, bakes left in the burning fuel)
// -> { slots, st, bakes, why } why = null | 'input' | 'fuel' | 'full' (why it stopped, if it did)
export function bake(slots, st, grantedMs) {
  const s = slots.map((q) => (q ? { ...q } : null))
  let prog = st.prog || 0, left = st.left || 0, g = Math.max(0, grantedMs), bakes = 0, why = null
  while (bakes < MAX_BAKES_PER_STEP) {
    const inp = s[OVEN_IN], fuel = s[OVEN_FUEL], out = s[OVEN_OUT]
    const r = inp && OVEN_RECIPES[inp.id]
    if (!r || inp.n < r.n) { why = 'input'; break }
    if (left <= 0 && !(fuel && FUEL[fuel.id])) { why = 'fuel'; break }
    if (out && (out.id !== r.out || out.n + r.k > STACK)) { why = 'full'; break }
    const need = r.ms - prog
    if (g < need) { prog += g; g = 0; break }
    g -= need; prog = 0
    if (left <= 0) {                                           // light one fuel item
      left += FUEL[fuel.id]
      fuel.n -= 1
      if (!fuel.n) s[OVEN_FUEL] = null
    }
    left -= 1
    inp.n -= r.n
    if (!inp.n) s[OVEN_IN] = null
    s[OVEN_OUT] = out ? { id: out.id, n: out.n + r.k } : { id: r.out, n: r.k }
    bakes += 1
  }
  return { slots: s, st: { prog, left }, bakes, why }
}
