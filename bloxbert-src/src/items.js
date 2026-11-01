// Hotbar 9 + pockets 6. Older saves can be longer; load() returns what no longer fits.
const SOLO = { woodTool: 1, stoneTool: 1, hoe: 1, safetyGlasses: 1, measuringTape: 1, handSaw: 1, hammer: 1 }
export const BAG_N = 15
// Home-build lines below use an inline typeof-safe flag: esbuild folds it away in the student build, and plain Node
// tools that import this file without the define still run.
export function createBag() {
  const slots = Array.from({ length: BAG_N }, () => null)
  function count(item) {
    return slots.reduce((n, s) => n + (s && s.item === item ? s.n : 0), 0)
  }
  function add(item, n = 1, stack) {
    const cap = stack || SOLO[item] || 64
    let left = n
    // 2.5.456: hotbar first — (a) stack in 0-8, (b) empty 0-8, (c) stack in 9+, (d) empty 9+
    const tryStack = (from, to) => {
      for (let i = from; i < to && left; i++) {
        const s = slots[i]
        if (s && s.item === item && s.n < cap && (!(typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) || !api.hook || api.hook.open(i))) {
          const take = Math.min(cap - s.n, left)
          s.n += take
          left -= take
          if ((typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) && api.hook) api.hook.merge(s, take)   // home build: food freshness
        }
      }
    }
    const tryEmpty = (from, to) => {
      for (let i = from; i < to && left; i++) if (!slots[i] && (!(typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) || !api.hook || api.hook.open(i))) {
        const take = Math.min(cap, left)
        slots[i] = { item, n: take }
        left -= take
        if ((typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) && api.hook) api.hook.fresh(slots[i])
      }
    }
    tryStack(0, 9)
    tryEmpty(0, 9)
    tryStack(9, slots.length)
    tryEmpty(9, slots.length)
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
      if ((typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) && Number.isFinite(raw.age) && raw.age > 0) s.age = raw.age   // home build: food age
      slots[i] = s
    }
    for (let i = BAG_N; i < src.length; i++) if (src[i] && src[i].item && src[i].n > 0) extra.push({ item: src[i].item, n: src[i].n })
    return extra
  }
  function dump() {
    return slots.map((s) => {
      if (!s) return null
      const o = { item: s.item, n: s.n }
      if ((typeof __HOME_HOST__ !== 'undefined' && __HOME_HOST__) && s.age > 0) o.age = Math.round(s.age)
      return o
    })
  }
  // hook: home build only (decay: torn slots, food freshness); always null in the student build
  const api = { slots, count, add, take, load, dump, hook: null }
  return api
}
export const BOT_TAB = { id: 'bot', item: 'bertyBot', label: 'botTab', free: true, one: true }