// Pack registry. No packs ship yet. Merge order is pack id, A to Z.
import { FROZEN } from '../data/ids.js'

const PACKS = []

function blockOf(raw) {
  if (Array.isArray(raw)) return { id: raw[0], key: raw[1] }
  return raw || {}
}

function ordered() {
  return [...PACKS].sort((a, b) => String(a.id).localeCompare(String(b.id)))
}

export function registerPack(pack) {
  if (!pack || typeof pack.id !== 'string' || !pack.id) throw new Error('pack id')
  if (typeof pack.v !== 'number') throw new Error('pack v')
  if (PACKS.some((p) => p.id === pack.id)) throw new Error('duplicate pack ' + pack.id)
  const blocks = Array.isArray(pack.blocks) ? pack.blocks.map(blockOf) : []
  const seenId = new Set()
  const seenKey = new Set()
  for (const b of blocks) {
    const id = b.id | 0
    const key = b.key
    if (!key || id < 1100) throw new Error('pack id range ' + id)
    if (FROZEN[key] !== id) throw new Error('frozen ' + key)
    const owner = Object.keys(FROZEN).find((k) => FROZEN[k] === id)
    if (owner !== key) throw new Error('frozen id ' + id)
    if (seenId.has(id) || seenKey.has(key)) throw new Error('duplicate ' + key)
    for (const other of PACKS) {
      for (const ob of other.blocks || []) {
        if (ob.id === id || ob.key === key) throw new Error('duplicate ' + key)
      }
    }
    seenId.add(id)
    seenKey.add(key)
  }
  PACKS.push({
    id: pack.id,
    v: pack.v,
    blocks,
    items: pack.items || [],
    recipes: pack.recipes || [],
    strings: pack.strings || {},
    drops: pack.drops || {},
    migrate: typeof pack.migrate === 'function' ? pack.migrate : null,
  })
  return pack.id
}

export function packIds() {
  return ordered().map((p) => p.id)
}

export function packVersions() {
  const out = {}
  for (const p of ordered()) out[p.id] = p.v
  return out
}

export function packBlocks() {
  const out = []
  for (const p of ordered()) for (const b of p.blocks) out.push(b)
  return out
}
