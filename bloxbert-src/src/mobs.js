// Bertopia mobs: Scrapper and Sparkbug. School-safe: reboot, never die/kill.
import { inSafeZone as townSafe } from './safe-zone.js'
import { plotInterior as townPlot } from './town.js'

const LAMP_ON = new Set([1101, 1103, 47])
const BUNK = 26
const CHUNK = 24

export function createMobs(opts) {
  const {
    getVoxel, playerPos, isNight, toast, t,
    inSafeZone = townSafe,
    plotInterior = townPlot,
    litBedNear = null,
    isBuildWorld = () => false,
    isCreative = () => false,
    rule = () => ({}),
  } = opts || {}
  const mobs = []
  const LEASH = 16
  const DESPAWN = 48
  const NO_SPAWN_R = 8

  function calm() {
    const r = rule() || {}
    return r['survival.energy'] === 'calm' || r.energy === 'calm' || r.calm === true
  }
  function worldCap() { return calm() ? 10 : 24 }
  function zone(x, z) { return inSafeZone(Math.floor(x), Math.floor(z)) }
  function chunkKey(x, z) { return (Math.floor(x / CHUNK)) + ',' + (Math.floor(z / CHUNK)) }
  function ofKind(kind, x, z) {
    const key = chunkKey(x, z)
    let n = 0
    for (const m of mobs) if (m.kind === kind && chunkKey(m.x, m.z) === key) n++
    return n
  }
  function lampNear(x, y, z, r) {
    const x0 = x | 0, y0 = y | 0, z0 = z | 0
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (dx * dx + dz * dz > r * r) continue
      for (let dy = -2; dy <= 3; dy++) {
        if (LAMP_ON.has(getVoxel(x0 + dx, y0 + dy, z0 + dz) | 0)) return true
      }
    }
    return false
  }
  function bedNear(x, z) {
    if (litBedNear) return !!litBedNear(x, z)
    for (let dx = -8; dx <= 8; dx++) for (let dz = -8; dz <= 8; dz++) {
      for (let y = 0; y <= 16; y++) if ((getVoxel((x | 0) + dx, y, (z | 0) + dz) | 0) === BUNK) return true
    }
    return false
  }
  function enclosed(x, y, z) {
    return (getVoxel(x, y + 2, z) | 0) > 0 || (getVoxel(x, y + 3, z) | 0) > 0
  }
  function lightAt(x, y, z) {
    if (lampNear(x, y, z, 6)) return 12
    if (enclosed(x, y, z)) return 2
    return isNight && isNight() ? 3 : 14
  }
  function blockedWorld() { return !!(isBuildWorld() || isCreative()) }

  function spawnBoss(players) {
    const n = Math.max(1, Math.min(6, players || 1))
    const boss = {
      id: 'overseer-' + Date.now(),
      kind: 'overseer',
      x: 0, y: 5, z: 0,
      homeX: 0, homeY: 5, homeZ: 0,
      hp: 120 * n, maxHp: 120 * n,
      phase: 1, lastPhase: 0,
    }
    if (zone(boss.x, boss.z) || mobs.length >= worldCap()) return null
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
  function canSpawn(kind, x, y, z) {
    if (blockedWorld()) return false
    if (mobs.length >= worldCap()) return false
    if (zone(x, z) || plotInterior(x | 0, z | 0) || bedNear(x, z)) return false
    const p = playerPos && playerPos()
    if (p && Math.hypot(x - p[0], z - p[2]) < NO_SPAWN_R) return false
    if ((getVoxel(x, y - 1, z) | 0) <= 0 || (getVoxel(x, y, z) | 0) !== 0) return false
    if (kind === 'scrapper') {
      if (!(isNight && isNight())) return false
      if (lampNear(x, y, z, 6)) return false
      if (ofKind('scrapper', x, z) >= (calm() ? 1 : 3)) return false
    } else if (kind === 'sparkbug') {
      if (!enclosed(x, y, z) || y > 3 && !enclosed(x, y, z)) return false
      if (lightAt(x, y, z) > 4) return false
      if (ofKind('sparkbug', x, z) >= 4) return false
    }
    return true
  }
  function spawn(kind, x, y, z, forced) {
    if (!forced && (kind === 'scrapper' || kind === 'sparkbug') && !canSpawn(kind, x, y, z)) return null
    if (zone(x, z) || plotInterior(x | 0, z | 0) || blockedWorld()) return null
    if (mobs.length >= worldCap()) return null
    const mob = {
      id: kind + '-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      kind, x, y, z,
      homeX: x, homeY: y, homeZ: z,
      hp: kind === 'rustbot' ? 16 : kind === 'keeper' ? 24 : kind === 'scrapper' ? 6 : 4,
      maxHp: kind === 'rustbot' ? 16 : kind === 'keeper' ? 24 : kind === 'scrapper' ? 6 : 4,
      weak: kind === 'rustbot' ? 'back' : kind === 'keeper' ? 'chest' : null,
      facing: 0, stolen: null, lastTick: 0,
    }
    mobs.push(mob)
    return mob
  }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z) }
  function walk(m, tx, tz) {
    const dx = tx - m.x, dz = tz - m.z
    const len = Math.hypot(dx, dz)
    if (len < 0.15) return
    const step = Math.min(0.16, len)
    const nx = m.x + (dx / len) * step
    const nz = m.z + (dz / len) * step
    if (zone(nx, nz) && !zone(m.homeX, m.homeZ)) return
    m.x = nx
    m.z = nz
  }
  function walkHome(m) {
    if (!zone(m.homeX, m.homeZ)) walk(m, m.homeX, m.homeZ)
    else walk(m, m.x + (m.x - 8), m.z + (m.z - 8))
  }
  function tick(now) {
    if (now - (tick._last || 0) < 100) return
    tick._last = now
    const p = playerPos && playerPos()
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i]
      const d = p ? dist(m, { x: p[0], z: p[2] }) : 99
      if (p && d > DESPAWN) { mobs.splice(i, 1); continue }
      if (zone(m.x, m.z)) { walkHome(m); continue }
      const homeD = dist(m, { x: m.homeX, z: m.homeZ })
      if (homeD > LEASH) {
        m.x = m.homeX
        m.z = m.homeZ
        m.hp = m.maxHp
        if (zone(m.x, m.z)) walkHome(m)
        continue
      }
      if (p && zone(m.x + (p[0] - m.x) * 0.2, m.z + (p[2] - m.z) * 0.2)) { walkHome(m); continue }
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
      if (m.kind === 'rustbot' && p && d < 6) {
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
  function trySpawn(now) {
    if (blockedWorld() || mobs.length >= worldCap()) return null
    if (now - (trySpawn._last || 0) < 2000) return null
    trySpawn._last = now
    const p = playerPos && playerPos()
    if (!p) return null
    const ang = Math.random() * Math.PI * 2
    const rad = 12 + Math.random() * 12
    const x = Math.floor(p[0] + Math.cos(ang) * rad)
    const z = Math.floor(p[2] + Math.sin(ang) * rad)
    let y = Math.floor(p[1])
    for (let i = 4; i >= -6; i--) {
      const yy = y + i
      if ((getVoxel(x, yy, z) | 0) === 0 && (getVoxel(x, yy - 1, z) | 0) > 0) { y = yy; break }
    }
    const kind = enclosed(x, y, z) && lightAt(x, y, z) <= 4 ? 'sparkbug' : 'scrapper'
    if (!canSpawn(kind, x, y, z)) return null
    return spawn(kind, x, y, z)
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
  return { spawn, spawnBoss, bossPhase, tick, trySpawn, reboot, count, list, canSpawn }
}
