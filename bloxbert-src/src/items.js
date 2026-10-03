// 36 slots, stacks of 64. Creative never uses this bag.
export function createBag() {
  const slots = Array.from({ length: 36 }, () => null)
  function count(item) {
    return slots.reduce((n, s) => n + (s && s.item === item ? s.n : 0), 0)
  }
  function add(item, n, stack = 64) {
    let left = n
    for (const s of slots) if (s && s.item === item && s.n < stack) {
      const take = Math.min(stack - s.n, left)
      s.n += take
      left -= take
      if (!left) return 0
    }
    for (let i = 0; i < slots.length && left; i++) if (!slots[i]) {
      const take = Math.min(stack, left)
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
    for (let i = 0; i < 36; i++) slots[i] = list && list[i] ? { item: list[i].item, n: list[i].n } : null
  }
  function dump() { return slots.map((s) => s ? { item: s.item, n: s.n } : null) }
  return { slots, count, add, take, load, dump }
}
