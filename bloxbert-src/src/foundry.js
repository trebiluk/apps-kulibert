// C5 Foundry arena + Console. Outside safe zone. Alias-only.
import { inSafeZone } from './safe-zone.js'

export function placeFoundryArena(getVoxel, edit, origin) {
  // Small walled arena + Console + always-open Exit, placed outside town.
  // origin is a point outside the safe zone box.
  const ox = origin[0] | 0, oy = origin[1] | 0, oz = origin[2] | 0
  if (inSafeZone(ox, oz)) return false
  // Walls (simple stone ring)
  for (let x = -6; x <= 6; x++) for (let z = -6; z <= 6; z++) {
    if (Math.abs(x) === 6 || Math.abs(z) === 6) {
      for (let y = 0; y < 3; y++) edit(ox + x, oy + y, oz + z, 3) // stone
    }
  }
  // Exit door (always open — just a gap + marker)
  edit(ox, oy, oz + 6, 0)
  edit(ox, oy + 1, oz + 6, 0)
  // Foundry Console block (use id 42 smelter as stand-in, or a marker)
  edit(ox, oy, oz, 42)
  return true
}

export function onConsoleUse(session, spawnBoss) {
  // Place Override Key on Console → spawn boss
  if (!session || !session.bag || !session.spend) return false
  if (session.bag.count('overrideKey') < 1) return false
  if (!session.spend('overrideKey', 1)) return false
  const players = 1 // re-scale later via nearby count
  const boss = spawnBoss && spawnBoss(players)
  return !!boss
}
