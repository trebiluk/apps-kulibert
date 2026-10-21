// Bertopia mobs: Scrapper and Sparkbug. School-safe: reboot, never die/kill.
export function createMobs({ getVoxel, edit, playerPos, isNight, toast, t }) {
  const mobs = []
  const WORLD_CAP = 24
  const LEASH = 16
  const DESPAWN = 48
  const NO_SPAWN_R = 8

  function spawnBoss(players) {
    const n = Math.max(1, Math.min(6, players || 1))
    const boss = {
      id: 'overseer-' + Date.now(),
      kind: 'overseer',
      x: 0, y: 5, z: 0,
      homeX: 0, homeY: 5, homeZ: 0,
      hp: 120 * n,
      maxHp: 120 * n,
      phase: 1,
      lastPhase: 0,
    }
    mobs.push(boss)
    return boss
  }
  function bossPhase(id) {
    const b = mobs.find((m) => m.id === id)
    if (!b) return 0
    const pct = b.hp / b.maxHp
    if (pct > 0.6) return 1
    if (pct > 0.25) return 2
    return 3
  }
  function spawn(kind, x, y, z) {
    if (mobs.length >= WORLD_CAP) return null
    const mob = {
      id: kind + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind,
      x, y, z,
      homeX: x, homeY: y, homeZ: z,
      hp: kind === 'rustbot' ? 16 : kind === 'keeper' ? 24 : kind === 'scrapper' ? 6 : 4,
      maxHp: kind === 'rustbot' ? 16 : kind === 'keeper' ? 24 : kind === 'scrapper' ? 6 : 4,
      weak: kind === 'rustbot' ? 'back' : kind === 'keeper' ? 'chest' : null,
      facing: 0,
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
      if (m.kind === 'overseer') {
        const phase = bossPhase(m.id)
        if (phase !== m.lastPhase) {
          m.lastPhase = phase
          if (toast) toast(t ? t('phase' + phase) : 'Phase ' + phase)
        }
        if (phase === 1 && !m.stampAt) m.stampAt = now + 1500
        if (phase === 3 && !m.ventAt) m.ventAt = now + 6000
      }
      if (m.kind === 'rustbot' && d < 6) {
        m.facing = Math.atan2(p[0] - m.x, p[2] - m.z)
        if (toast && !m.announced) { toast(t ? t('rustbotNear') : 'Rustbot nearby, hit its back'); m.announced = true }
      }
      if (m.kind === 'keeper' && d < 4) {
        if (!m.slamAt) m.slamAt = now + 1000
        else if (now >= m.slamAt && !m.slammed) {
          if (toast) toast(t ? t('slam') : 'Slam!')
          m.slammed = true
          m.weakOpen = now + 2000
        }
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

  return { spawn, spawnBoss, bossPhase, tick, reboot, count, list, canSpawn }
}
