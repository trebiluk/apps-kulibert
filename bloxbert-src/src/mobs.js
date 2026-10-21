// Bertopia mobs: Scrapper and Sparkbug. School-safe: reboot, never die/kill.
export function createMobs({ getVoxel, edit, playerPos, isNight, toast, t }) {
  const mobs = []
  const WORLD_CAP = 24
  const LEASH = 16
  const DESPAWN = 48
  const NO_SPAWN_R = 8

  function spawn(kind, x, y, z) {
    if (mobs.length >= WORLD_CAP) return null
    const mob = {
      id: kind + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind,
      x, y, z,
      homeX: x, homeY: y, homeZ: z,
      hp: kind === 'scrapper' ? 6 : 4,
      maxHp: kind === 'scrapper' ? 6 : 4,
      stolen: null,
      lastTick: 0,
    }
    mobs.push(mob)
    return mob
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.z - b.z)
  }

  function nearTown(x, z) {
    // Bertyville town box approx center
    return Math.abs(x - 60) < 30 && Math.abs(z - 60) < 30
  }

  function canSpawn(x, y, z) {
    if (nearTown(x, z)) return false
    const p = playerPos()
    if (p && Math.hypot(x - p[0], z - p[2]) < NO_SPAWN_R) return false
    return getVoxel(x, y - 1, z) > 0 && getVoxel(x, y, z) === 0
  }

  function tick(now) {
    if (now - (tick._last || 0) < 100) return
    tick._last = now
    const p = playerPos()
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i]
      const d = p ? dist(m, { x: p[0], z: p[2] }) : 99
      if (d > DESPAWN) { mobs.splice(i, 1); continue }
      const homeD = dist(m, { x: m.homeX, z: m.homeZ })
      if (homeD > LEASH) {
        m.x = m.homeX
        m.z = m.homeZ
        m.hp = m.maxHp
        continue
      }
      if (m.kind === 'scrapper' && d < 4 && !m.stolen) {
        m.stolen = 'common'
        if (toast) toast(t ? t('scrapperTook') : 'Scrapper took your item')
      }
      if (m.kind === 'sparkbug' && d < 2) {
        if (!m.zapAt) m.zapAt = now + 600
        else if (now >= m.zapAt) {
          if (toast) toast(t ? t('zap') : 'Zap!')
          m.zapAt = 0
        }
      }
    }
  }

  function reboot(id) {
    const i = mobs.findIndex((m) => m.id === id)
    if (i < 0) return null
    const m = mobs[i]
    const item = m.stolen
    mobs.splice(i, 1)
    if (toast) toast(t ? t('rebooted') : 'Rebooted!')
    return item
  }

  function count() { return mobs.length }
  function list() { return mobs.map((m) => ({ id: m.id, kind: m.kind, x: m.x, y: m.y, z: m.z, hp: m.hp })) }

  return { spawn, tick, reboot, count, list, canSpawn }
}
