// A Box holds 18 stacks. Nothing is deleted: what does not fit is returned.
import { itemMuted } from './packs/registry.js'
export const BOX_SLOTS = 18

export function slotMuted(item) {
  return itemMuted(item)
}

export function emptyBox() {
  return Array.from({ length: BOX_SLOTS }, () => null)
}

export function putInSlots(slots, item, n, cap = 64) {
  const util = globalThis.KulibertSlots && globalThis.KulibertSlots.util
  if (!util || !util.putInSlots) throw new Error('KulibertSlots')
  return util.putInSlots(slots, item, n, cap)
}

export function cloneRec(rec) {
  if (!rec || typeof rec !== 'object') return rec
  const out = {}
  for (const k of Object.keys(rec)) {
    const v = rec[k]
    if (k === 'slots' && Array.isArray(v)) {
      out.slots = v.map((s) => {
        if (!s || !s.item) return null
        const slot = { item: s.item, n: s.n | 0 }
        if (s.price != null) slot.price = s.price
        if (s.uses != null) slot.uses = s.uses
        return slot
      })
    } else if (Array.isArray(v)) out[k] = v.map((row) => (row && typeof row === 'object' ? { ...row } : row))
    else out[k] = v
  }
  return out
}
