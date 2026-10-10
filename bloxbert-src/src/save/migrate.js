// Save schema. A doc with no schema counts as 2. Newer than SCHEMA is read-only.
import { FROZEN } from '../data/ids.js'

export const SCHEMA = 3
const MISSING = FROZEN.missing
const RUNTIME_LO = 1001
const RUNTIME_HI = 1099

const byName = new Map()
const byId = new Map()
const retired = new Set()

export function resetUnknown() {
  byName.clear()
  byId.clear()
}

export function unknownEntries() {
  return [...byId.entries()]
}

export function isMissingId(id) {
  return id === MISSING || (id >= RUNTIME_LO && id <= RUNTIME_HI)
}

export function claimUnknown(name) {
  if (byName.has(name)) return byName.get(name)
  const used = new Set(byName.values())
  for (let id = RUNTIME_LO; id <= RUNTIME_HI; id++) {
    if (used.has(id)) continue
    byName.set(name, id)
    byId.set(id, name)
    return id
  }
  return MISSING
}

export const MIGRATIONS = [
  { from: 2, to: 3, run(doc) {
    const packs = doc && doc.packs && typeof doc.packs === 'object' ? { ...doc.packs } : {}
    return { ...doc, schema: SCHEMA, packs }
  } },
]

export function schemaOf(doc) {
  if (!doc || doc.schema == null) return 2
  return doc.schema | 0
}

export function migrate(doc) {
  const schema = schemaOf(doc)
  if (schema > SCHEMA) return { doc, readOnly: true, schema }
  let cur = doc || {}
  let at = schema
  for (const step of MIGRATIONS) {
    if (step.from !== at || at >= SCHEMA) continue
    cur = step.run(cur)
    at = step.to
  }
  return { doc: cur, readOnly: false, schema: at }
}

export function migrateVoxels(palette, data, nameToId) {
  const names = palette && palette.length ? palette : null
  const gifts = []
  const out = data.slice()
  if (!names) return { data: out, gifts }
  const known = nameToId || {}
  for (let i = 0; i < out.length; i++) {
    const id = out[i]
    if (!id) { out[i] = 0; continue }
    const name = id < names.length ? names[id] : null
    if (!name || name === 'air') { out[i] = 0; continue }
    const now = known[name]
    if (now) out[i] = now
    else if (retired.has(name)) {
      out[i] = 0
      gifts.push(name)
    } else out[i] = claimUnknown(name)
  }
  return { data: out, gifts }
}
