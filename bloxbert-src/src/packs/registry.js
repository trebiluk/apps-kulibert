// Pack registry. Merge order is pack id, A to Z.
// Farm blocks keep their frozen core ids. Every other pack id is 1100+.
import { FROZEN } from '../data/ids.js'

const PACKS = []
const MOVABLE = new Set([
  'wheat', 'reed', 'farmland', 'tuft', 'cropSprout', 'cropLeafy', 'cropTall', 'cropRipe',
  'farmlandWet', 'bushYoung', 'bushLeaf', 'bushFull', 'bushFruit', 'sapling',
])

function blockOf(raw) {
  if (Array.isArray(raw)) return { id: raw[0], key: raw[1], row: raw.slice() }
  const row = raw && raw.row ? raw.row.slice() : [raw && raw.id, raw && raw.key]
  return { id: row[0], key: row[1], row }
}

function ordered() {
  return [...PACKS].sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

function packsOffFromLocation() {
  try {
    const search = typeof location !== 'undefined' && location && location.search ? location.search : ''
    const q = new URLSearchParams(search).get('nopack') || ''
    return q.split(',').map((s) => s.trim()).filter(Boolean)
  } catch (e) {
    return []
  }
}

const OFF = new Set(packsOffFromLocation())
const BANDS = []

export function setPacksOff(ids) {
  OFF.clear()
  for (const id of ids || []) if (id) OFF.add(String(id))
}

export function packOn(id) {
  return !OFF.has(id)
}

export function registerPack(pack) {
  if (!pack || typeof pack.id !== 'string' || !pack.id) throw new Error('pack id')
  if (typeof pack.v !== 'number') throw new Error('pack v')
  if (PACKS.some((p) => p.id === pack.id)) throw new Error('duplicate pack ' + pack.id)
  const blocks = Array.isArray(pack.blocks) ? pack.blocks.map(blockOf) : []
  const band = Array.isArray(pack.band) ? [pack.band[0] | 0, pack.band[1] | 0] : null
  if (band && (band[0] < 1100 || band[1] < band[0] || band[1] - band[0] > 99)) throw new Error('pack band ' + pack.id)
  if (band) {
    for (const other of BANDS) {
      if (!(band[1] < other[0] || band[0] > other[1])) throw new Error('band overlap ' + pack.id)
    }
  }
  const seenId = new Set()
  const seenKey = new Set()
  for (const b of blocks) {
    const id = b.id | 0
    const key = b.key
    const banded = !!(band && id >= band[0] && id <= band[1])
    const movable = MOVABLE.has(key) && FROZEN[key] === id
    if (!key || (id < 1100 && !movable)) throw new Error('pack id range ' + id)
    if (band && !banded) throw new Error('outside band ' + key)
    if (banded) {
      if (FROZEN[key] != null) throw new Error('frozen ' + key)
      const owner = Object.keys(FROZEN).find((k) => FROZEN[k] === id)
      if (owner) throw new Error('frozen id ' + id)
    } else {
      if (FROZEN[key] !== id) throw new Error('frozen ' + key)
      const owner = Object.keys(FROZEN).find((k) => FROZEN[k] === id)
      if (owner !== key) throw new Error('frozen id ' + id)
    }
    if (seenId.has(id) || seenKey.has(key)) throw new Error('duplicate ' + key)
    for (const other of PACKS) {
      for (const ob of other.blocks || []) {
        if (ob.id === id || ob.key === key) throw new Error('duplicate ' + key)
      }
    }
    seenId.add(id)
    seenKey.add(key)
    b.id = id
  }
  if (band) BANDS.push(band)
  const drops = new Map()
  if (Array.isArray(pack.drops)) for (const pair of pack.drops) drops.set(pair[0] | 0, pair[1])
  PACKS.push({
    id: pack.id,
    v: pack.v,
    blocks,
    items: pack.items || [],
    recipes: pack.recipes || [],
    strings: pack.strings || {},
    drops,
    migrate: typeof pack.migrate === 'function' ? pack.migrate : null,
  })
  return pack.id
}

export function packIds() {
  return ordered().map((p) => p.id)
}

export function packVersions() {
  return Object.fromEntries(ordered().map((p) => [p.id, p.v]))
}

export function packBlocks() {
  const out = []
  for (const p of ordered()) for (const b of p.blocks) out.push(b)
  return out
}

export function blockByKey(key) {
  for (const p of ordered()) {
    if (!packOn(p.id)) continue
    for (const b of p.blocks) if (b.key === key) return b.id
  }
  return 0
}

export function packItems() {
  const out = []
  for (const p of ordered()) for (const it of p.items) out.push({ pack: p.id, ...it })
  return out
}

export function packRecipes() {
  const out = []
  for (const p of ordered()) {
    if (!packOn(p.id)) continue
    for (const r of p.recipes) out.push(r)
  }
  return out
}

export function packDrop(blockId) {
  for (const p of ordered()) {
    if (!packOn(p.id)) continue
    if (p.drops.has(blockId)) return p.drops.get(blockId)
  }
  return undefined
}

export function packStrings() {
  const out = {}
  for (const p of ordered()) {
    for (const [lang, row] of Object.entries(p.strings || {})) {
      out[lang] = Object.assign(out[lang] || {}, row)
    }
  }
  return out
}

export function itemMuted(key) {
  if (!key) return false
  for (const p of PACKS) {
    if (packOn(p.id)) continue
    if ((p.items || []).some((it) => it.key === key)) return true
  }
  return false
}
