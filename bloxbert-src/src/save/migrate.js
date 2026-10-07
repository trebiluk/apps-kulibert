export function migrateVoxels(palette, data, nameToId) {
  const names = palette && palette.length ? palette : null
  const gifts = []
  const out = data.slice()
  if (!names) return { data: out, gifts }
  for (let i = 0; i < out.length; i++) {
    const id = out[i]
    if (!id) { out[i] = 0; continue }
    const name = id < names.length ? names[id] : null
    if (!name || name === 'air') { out[i] = 0; continue }
    const now = nameToId[name]
    if (now) out[i] = now
    else {
      out[i] = 0
      gifts.push(name)
    }
  }
  return { data: out, gifts }
}