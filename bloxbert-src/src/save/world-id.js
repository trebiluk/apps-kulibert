// 2.5.557 round 1: which world opened, and where its data came from. Pure: no DOM, no storage, no network.
// main.js calls these on every load(), and tools/load-world-check.mjs runs the same functions in node,
// so "load picks the right world" can be proved with or without a browser.

export const SURVIVAL_WORLD = 'bertyville-survival'
export const WORKSHOP_WORLD = 'bertyville'

// A saved doc that names a different world is not this world's save. Docs from before ids existed carry no id and count as a match.
export function belongsTo(worldId, doc) {
  return !!doc && (doc.id == null || doc.id === worldId)
}

// Which doc load() opens.
//   server copy (pulled, newer than this device's last sync)  -> 'server'
//   this device's copy                                         -> 'device'
//   neither                                                    -> 'new'
// A pulled copy that names another world is ignored and the device copy stays. A device copy that names another world is
// still opened (never throw a player's save away on a label), but it is reported as a mismatch.
export function pickLoaded(worldId, local, pulled) {
  if (pulled && belongsTo(worldId, pulled)) return { doc: pulled, from: 'server', mismatch: false, ignored: false }
  const ignored = !!pulled
  if (local) return { doc: local, from: 'device', mismatch: !belongsTo(worldId, local), ignored }
  return { doc: null, from: 'new', mismatch: false, ignored }
}

// What the world is called: a custom world uses its generated name; the two built-in worlds use their mode word.
export function worldKind(worldId, customName) {
  if (customName) return 'custom'
  return worldId === WORKSHOP_WORLD ? 'creative' : 'survival'
}

// The facts a tester needs. All plain values.
export function describeWorld({ id, doc, from, customName, seed, mismatch }) {
  const kind = worldKind(id, customName)
  return {
    id,
    kind,
    name: kind === 'custom' ? customName : kind,
    seed: Number.isFinite(+seed) ? +seed : 1,
    from: from || 'new',
    savedAt: doc && typeof doc.updatedAt === 'string' ? doc.updatedAt : '',
    rev: doc && typeof doc.syncRev === 'number' ? doc.syncRev : null,
    mismatch: !!mismatch,
  }
}

// One readable line, for the World panel and the toast after "Load my saved world".
//   World: Survival · seed 1 · from this device · saved 04:53
// t is the app's translate function; fmt turns an ISO time into the short clock text.
export function worldLine(info, t, fmt) {
  if (!info) return ''
  const name = info.kind === 'custom' ? info.name : t(info.kind)
  const parts = [t('world') + ': ' + name, t('worldSeed').replace('{n}', String(info.seed))]
  if (info.from === 'device' || info.from === 'server' || info.from === 'new') {
    parts.push(t(info.from === 'device' ? 'worldFromDevice' : info.from === 'server' ? 'worldFromServer' : 'worldFromNew'))
  }
  const when = info.savedAt ? fmt(info.savedAt) : ''
  if (when) parts.push(t('worldSaved').replace('{when}', when))
  return parts.join(' · ')
}

// The same facts as plain data attributes, so a script can read them off the page without opening a menu.
export function worldAttrs(info) {
  if (!info) return {}
  return {
    world: info.id,
    worldName: info.name,
    worldSeed: String(info.seed),
    worldFrom: info.from,
    worldSaved: info.savedAt,
    worldRev: info.rev == null ? '' : String(info.rev),
    worldMismatch: info.mismatch ? '1' : '0',
  }
}
