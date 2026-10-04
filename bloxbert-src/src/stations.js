// Station panels. State is per block, keyed x,y,z, and saved with the world.
import { RECIPES } from './data/recipes.js'
const OVEN = RECIPES.filter((r) => r.at === 'oven')
const BENCH = RECIPES.filter((r) => r.at === 'bench')
export function createStations(api) {
  const map = new Map()
  function get(key, kind) {
    if (!map.has(key)) map.set(key, { kind, fuel: 0, input: [], output: [], until: 0, left: 0 })
    return map.get(key)
  }
  function tick() {
    const now = Date.now()
    for (const rec of map.values()) {
      if (rec.kind !== 'oven' || !rec.until) continue
      if (now >= rec.until) {
        rec.output.push(rec.pending || 'glass')
        rec.pending = null
        rec.until = 0
        rec.left = Math.max(0, rec.left - 1)
        rec.fuel = Math.ceil(rec.left / 4)
      }
    }
  }
  function addFuel(key) {
    if (api.spend && !api.spend('coal', 1)) return false
    const r = get(key, 'oven'); r.fuel += 1; r.left += 4
    return true
  }
  function addInput(key, item) {
    const r = get(key, 'oven')
    if (!r.fuel && !r.left) return false
    if (api.spend && !api.spend(item, item === 'sand' ? 2 : 1)) return false
    const recipe = OVEN.find((x) => x.in[0][0] === item)
    r.input.push(item)
    r.pending = recipe ? recipe.out[0] : 'glass'
    r.until = Date.now() + ((recipe && recipe.secs) || 5) * 1000
    if (!r.left) r.left = r.fuel * 4
    return true
  }
  function take(key) {
    const r = get(key, 'oven')
    const item = r.output.shift()
    if (item && api.give) api.give(item, 1)
    return item
  }
  function view(key) {
    const r = map.get(key)
    if (!r) return { kind: 'oven', fuel: 0, input: [], output: [], ring: 0 }
    const ring = r.until ? Math.min(1, 1 - (r.until - Date.now()) / 5000) : 0
    return { kind: r.kind, fuel: r.fuel, input: r.input.slice(), output: r.output.slice(), ring, left: r.left }
  }
  function paint(g, key, kind) {
    const r = get(key || '0,5,0', kind || 'oven')
    g.innerHTML = ''
    if (kind === 'bench') {
      const p = document.createElement('p')
      p.className = 'gnote'
      p.textContent = api.t('input')
      g.append(p)
      return
    }
    for (const [label, n] of [[api.t('fuel'), r.left ? r.left + ' ' + api.t('left') : api.t('addCoal')], [api.t('input'), r.input[0] || api.t('input')], [api.t('output'), r.output[0] || api.t('output')]]) {
      const b = document.createElement('button')
      b.type = 'button'
      b.className = 'gtile'
      b.innerHTML = '<span class="gic">' + (label === api.t('fuel') ? '🔥' : '▣') + '</span><span class="glbl"></span>'
      b.querySelector('.glbl').textContent = label + ' ' + n
      b.addEventListener('click', () => {
        if (label === api.t('fuel')) addFuel(key || '0,5,0')
        if (label === api.t('input')) addInput(key || '0,5,0', 'sand')
        if (label === api.t('output')) take(key || '0,5,0')
        paint(g, key, kind)
      })
      g.append(b)
    }
    if (r.until) {
      const left = Math.max(0, Math.ceil((r.until - Date.now()) / 1000))
      const ring = document.createElement('div')
      ring.innerHTML = '<svg viewBox="0 0 36 36" width="48" height="48"><circle cx="18" cy="18" r="15" fill="none" stroke="#22d3ee" stroke-width="3" stroke-dasharray="' + (left * 10) + ' 100"/></svg><span>' + left + ' s</span>'
      g.append(ring)
    }
    clearTimeout(paint.timer)
    paint.timer = setTimeout(() => { if (g.isConnected) paint(g, key, kind) }, 1000)
  }
  return { tick, paint, view, addFuel, addInput, take, dump: () => Object.fromEntries(map), load: (obj) => { map.clear(); for (const [k, v] of Object.entries(obj || {})) map.set(k, v) } }
}
