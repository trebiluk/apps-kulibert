// A Box holds 18 stacks. Nothing is deleted: what does not fit is returned.
export const BOX_SLOTS = 18

export function emptyBox() {
  return Array.from({ length: BOX_SLOTS }, () => null)
}

export function putInSlots(slots, item, n, cap = 64) {
  const next = slots.map((s) => (s ? { item: s.item, n: s.n } : null))
  let left = n | 0
  if (!item || left <= 0) return { slots: next, left: 0 }
  for (const s of next) {
    if (!left) break
    if (!s || s.item !== item || s.n >= cap) continue
    const move = Math.min(cap - s.n, left)
    s.n += move
    left -= move
  }
  for (let i = 0; i < next.length && left; i++) {
    if (next[i]) continue
    const move = Math.min(cap, left)
    next[i] = { item, n: move }
    left -= move
  }
  return { slots: next, left }
}
