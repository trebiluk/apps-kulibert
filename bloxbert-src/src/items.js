// Hotbar 9 + pockets 6. Older saves can be longer; load() returns what no longer fits.
const SOLO = { woodTool: 1, stoneTool: 1 }
export const BAG_N = 15
export function createBag() {
  const slots = Array.from({ length: BAG_N }, () => null)
  function count(item) {
    return slots.reduce((n, s) => n + (s && s.item === item ? s.n : 0), 0)
  }
  function add(item, n = 1, stack) {
    const cap = stack || SOLO[item] || 64
    let left = n
    for (const s of slots) if (s && s.item === item && s.n < cap) {
      const take = Math.min(cap - s.n, left)
      s.n += take
      left -= take
      if (!left) return 0
    }
    for (let i = 0; i < slots.length && left; i++) if (!slots[i]) {
      const take = Math.min(cap, left)
      slots[i] = { item, n: take }
      left -= take
    }
    return left
  }
  function take(item, n) {
    if (count(item) < n) return false
    let left = n
    for (const s of slots) if (s && s.item === item && left) {
      const d = Math.min(s.n, left)
      s.n -= d
      left -= d
      if (!s.n) slots[slots.indexOf(s)] = null
    }
    return true
  }
  function load(list) {
    const src = list || []
    const extra = []
    for (let i = 0; i < BAG_N; i++) {
      const raw = src[i]
      if (!raw || !raw.item) { slots[i] = null; continue }
      const s = { item: raw.item, n: raw.n }
      slots[i] = s
    }
    for (let i = BAG_N; i < src.length; i++) if (src[i] && src[i].item && src[i].n > 0) extra.push({ item: src[i].item, n: src[i].n })
    return extra
  }
  function dump() {
    return slots.map((s) => {
      if (!s) return null
      const o = { item: s.item, n: s.n }
      return o
    })
  }
  return { slots, count, add, take, load, dump }
}