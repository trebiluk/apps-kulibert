// A Box holds 18 stacks. Nothing is deleted: what does not fit is returned.
export const BOX_SLOTS = 18

export function emptyBox() {
  return Array.from({ length: BOX_SLOTS }, () => null)
}

export function putInSlots(slots, item, n, cap = 64) {
  const util = globalThis.KulibertSlots && globalThis.KulibertSlots.util
  if (!util || !util.putInSlots) throw new Error('KulibertSlots')
  return util.putInSlots(slots, item, n, cap)
}
