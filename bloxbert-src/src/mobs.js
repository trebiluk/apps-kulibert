// Bertopia mobs: Scrapper and Sparkbug. School-safe: reboot, never those other words.
import { inSafeZone as townSafe } from './safe-zone.js'
import { bumpFlanker, bumpMedic } from './crew-badges.js'
import { openDex } from './learn.js'
import { plotInterior as townPlot } from './town.js'
import { mergeOrAdd } from './drops.js'
import { getWrap } from './gfx/pixel-art.js'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'

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
    takeCommon = () => '',
    giveItem = () => {},
    ground = () => null,
    hurtSuit = () => {},
    lastBonk = () => 0,
    scene = () => null,
    addMesh = () => {},
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

  function spawnBoss(players, at) {
    const n = Math.max(1, Math.min(6, players || 1))
    // Place outside safe zone (default offset if no at)
    const x = at ? at[0] : 48, y = at ? at[1] : 5, z = at ? at[2] : 48
    if (zone(x, z)) return null
    const boss = {
      id: 'overseer-' + Date.now(),
      kind: 'overseer',
      x, y, z,
      homeX: x, homeY: y, homeZ: z,
      hp: 120 * n, maxHp: 120 * n,
      phase: 1, lastPhase: 0,
      startPlayers: n,
    }
    if (mobs.length >= worldCap()) return null
    mobs.push(boss)
    return boss
  }
  function rescaleBoss(id, nearby) {
    const b = mobs.find((m) => m.id === id)
    if (!b || b.kind !== 'overseer') return
    const n = Math.max(b.startPlayers || 1, Math.min(6, nearby || 1))
    if (n > (b.startPlayers || 1)) {
      b.maxHp = 120 * n
      b.hp = Math.min(b.hp + 120 * (n - (b.startPlayers || 1)), b.maxHp)
      b.startPlayers = n
    }
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
    } else if (kind === 'rustbot') {
      if (!(isNight && isNight())) return false
      if (y < -2 || y > 4) return false // surface + B2-B3 approx
      if (ofKind('rustbot', x, z) >= 2) return false
      // Copper tools gate: assume checked externally or always for playtest; report if needed
    } else if (kind === 'keeper') {
      if (y > -4) return false // B3 near gold approx
      if (ofKind('keeper', x, z) >= 1) return false
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
      dmg: kind === 'rustbot' ? 10 : kind === 'keeper' ? 15 : 0,
      speed: kind === 'rustbot' ? 0.6 : kind === 'keeper' ? 0.8 : 1,
      weak: kind === 'rustbot' ? 'back' : kind === 'keeper' ? 'chest' : null,
      facing: 0, stolen: null, lastTick: 0, slamMarker: null,
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
  function lessMotion() {
    try {
      if (document.documentElement.getAttribute('data-kp-motion') === 'less') return true
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    } catch (e) { return false }
  }
  function showZap(label) {
    try {
      let style = document.getElementById('c2-zap-style')
      if (!style) {
        style = document.createElement('style')
        style.id = 'c2-zap-style'
        style.textContent = '@keyframes c2zap{from{opacity:1}to{opacity:.75}}'
        document.head.append(style)
      }
      let el = document.getElementById('c2-zap')
      if (!el) {
        el = document.createElement('div')
        el.id = 'c2-zap'
        el.setAttribute('role', 'status')
        document.body.append(el)
      }
      const word = label || (t ? t('c2Zap') : 'Zap!')
      el.textContent = ''
      el.style.cssText = 'position:fixed;top:28%;left:50%;transform:translateX(-50%);z-index:40;display:flex;align-items:center;gap:8px;background:#1c1917;color:#f6e27a;padding:8px 14px;border-radius:10px;font:700 18px/1.2 sans-serif;pointer-events:none;max-width:90vw'
      const ring = document.createElement('span')
      ring.setAttribute('aria-hidden', 'true')
      ring.style.cssText = 'display:inline-block;width:44px;height:44px;box-sizing:border-box;border:3px dotted #f6e27a;border-radius:50%;flex:0 0 auto'
      if (!lessMotion()) ring.style.animation = 'c2zap .6s linear 1'
      const text = document.createElement('span')
      text.textContent = word
      el.append(ring, text)
      clearTimeout(showZap._t)
      showZap._t = setTimeout(() => { const n = document.getElementById('c2-zap'); if (n) n.remove() }, 600)
    } catch (e) {}
  }
  function showSlamMarker() {
    try {
      let el = document.getElementById('c4-slam')
      if (!el) {
        el = document.createElement('div')
        el.id = 'c4-slam'
        el.setAttribute('role', 'status')
        el.style.cssText = 'position:fixed;top:35%;left:50%;transform:translate(-50%,-50%);width:48px;height:48px;border:4px solid #fbbf24;background:rgba(251,191,36,.2);z-index:40;pointer-events:none;border-radius:4px'
        document.body.append(el)
      }
      clearTimeout(showSlamMarker._t)
      showSlamMarker._t = setTimeout(() => { const n = document.getElementById('c4-slam'); if (n) n.remove() }, 1000)
    } catch (e) {}
  }

  function showStamp() {
    try {
      const el = document.createElement('div')
      el.textContent = '⚠'
      el.style.cssText = 'position:fixed;top:40%;left:50%;transform:translate(-50%,-50%);font-size:48px;z-index:40;pointer-events:none;border:4px solid #f59e0b;padding:8px;border-radius:4px;background:rgba(0,0,0,.4)'
      document.body.append(el)
      setTimeout(() => el.remove(), 1500)
    } catch (e) {}
  }
  function showVent() {
    try {
      const el = document.createElement('div')
      el.textContent = '→ Hiss'
      el.style.cssText = 'position:fixed;top:45%;left:50%;transform:translate(-50%,-50%);font-size:24px;z-index:40;pointer-events:none;color:#fbbf24'
      document.body.append(el)
      setTimeout(() => el.remove(), 2000)
    } catch (e) {}
  }
  function dropMesh(m) {
    if (!m || !m.mesh) return
    try {
      const mat = m.mesh.material
      if (mat) {
        if (mat.diffuseTexture) mat.diffuseTexture.dispose()
        if (mat.emissiveTexture && mat.emissiveTexture !== mat.diffuseTexture) mat.emissiveTexture.dispose()
        mat.dispose()
      }
      m.mesh.dispose()
    } catch (e) {}
    m.mesh = null
  }
  function syncMesh(m) {
    if (!m || (m.kind !== 'scrapper' && m.kind !== 'sparkbug')) return
    const sc = scene ? scene() : null
    if (!sc) return
    if (!m.mesh) {
      try {
        const canvas = getWrap(m.kind)
        if (!canvas) return
        const mesh = CreatePlane('c2-' + m.id, { size: 0.9 }, sc)
        const mat = new StandardMaterial('c2m-' + m.id, sc)
        const tex = new DynamicTexture('c2t-' + m.id, canvas, sc, false, Texture.NEAREST_SAMPLINGMODE)
        tex.hasAlpha = true
        mat.diffuseTexture = tex
        mat.emissiveTexture = tex
        mat.useAlphaFromDiffuseTexture = true
        mat.disableLighting = true
        mat.backFaceCulling = false
        mesh.material = mat
        mesh.billboardMode = Mesh.BILLBOARDMODE_ALL
        mesh.isPickable = false
        if (addMesh) addMesh(mesh)
        m.mesh = mesh
      } catch (e) { return }
    }
    try {
      m.mesh.position.x = m.x
      m.mesh.position.y = (m.y || 0) + 0.9
      m.mesh.position.z = m.z
    } catch (e) {}
  }
  function sayItem(key, item) {
    const label = item ? (t ? t(item) : item) : ''
    const line = t ? t(key) : ''
    return line ? String(line).replace('{item}', label) : label
  }
  function zig(m, p) {
    const dx = p[0] - m.x
    const dz = p[2] - m.z
    const len = Math.hypot(dx, dz) || 1
    m.zig = (m.zig || 0) + 1
    const side = Math.sin(m.zig * 0.8) * 1.6
    walk(m, m.x + (dx / len) * 2 + (-dz / len) * side, m.z + (dz / len) * 2 + (dx / len) * side)
  }
  function showCrew() {
    try {
      let el = document.getElementById('c3-crew')
      if (!el) {
        el = document.createElement('div')
        el.id = 'c3-crew'
        el.setAttribute('role', 'status')
        document.body.append(el)
      }
      el.textContent = '🤝 ' + (t ? t('c3Crew') : 'Crew bonus')
      el.style.cssText = 'position:fixed;top:22%;left:50%;transform:translateX(-50%);z-index:41;background:#14532d;color:#fff;padding:8px 14px;border-radius:10px;font:700 16px/1.2 sans-serif;pointer-events:none;max-width:90vw'
      clearTimeout(showCrew._t)
      showCrew._t = setTimeout(() => { const n = document.getElementById('c3-crew'); if (n) n.remove() }, 2200)
    } catch (e) {}
  }
  function showTrail() {
    try {
      let el = document.getElementById('c3-trail')
      if (!el) {
        el = document.createElement('div')
        el.id = 'c3-trail'
        el.setAttribute('role', 'status')
        document.body.append(el)
      }
      el.textContent = '✨ ' + (t ? t('c3Trail') : 'Spark trail')
      el.style.cssText = 'position:fixed;top:30%;left:50%;transform:translateX(-50%);z-index:41;background:#1c1917;color:#f6e27a;padding:8px 14px;border-radius:10px;font:700 16px/1.2 sans-serif;pointer-events:none;max-width:90vw'
      clearTimeout(showTrail._t)
      showTrail._t = setTimeout(() => { const n = document.getElementById('c3-trail'); if (n) n.remove() }, 60000)
    } catch (e) {}
  }
  function payCrew(m, fromBonk) {
    let credit = null
    try { credit = window.crewCredit || null } catch (e) {}
    const me = t ? t('c3You') : 'You'
    if (fromBonk && credit) credit.record(m.id, me, 'hit')
    const now = Date.now()
    let who = credit ? credit.contributors(m.id, now) : []
    if (!who.length) who = [me]
    const mul = who.length >= 2 ? (credit && credit.bonus ? credit.bonus(m.id) : 1.25) : 1
    const cosmetic = m.kind === 'overseer'
    const item = cosmetic ? 'goldTrim' : 'stick'
    const n = cosmetic ? 1 : Math.max(1, Math.round(4 * mul))
    const drops = ground ? ground() : null
    const at = Date.now() + 86400000
    for (let i = 0; i < who.length; i++) {
      if (giveItem) giveItem(item, n)
      if (drops) mergeOrAdd(drops, [], { item, n, x: (m.x || 0) + i * 3, y: m.y || 0, z: m.z || 0, at })
    }
    if (who.length >= 2) showCrew()
    if (who.length >= 4) {
      if (credit) credit.trailUntil = now + 60000
      showTrail()
    }
    return who
  }
  function finishReboot(m, fromBonk) {
    // First reboot opens Bertodex
    if (!window._dexSeen) window._dexSeen = {}
    if (!window._dexSeen[m.kind]) {
      window._dexSeen[m.kind] = true
      const fact = m.kind === 'rustbot' ? (t ? t('c4RustFact') : 'Rustbot: rust is iron + oxygen + water') : (t ? t('c4KeeperFact') : 'Keeper: slam opens a weak point')
      try { openDex(m.kind, fact) } catch (e) {}
    }
    const item = m.stolen || ''
    if (item && giveItem) giveItem(item, 1)
    const who = payCrew(m, fromBonk)
    dropMesh(m)
    const i = mobs.indexOf(m)
    if (i >= 0) mobs.splice(i, 1)
    if (toast) toast(item ? sayItem('c2Back', item) : (t ? t('rebooted') : 'Rebooted!'))
    return who
  }
  function tick(now) {
    if (now - (tick._last || 0) < 100) return
    tick._last = now
    const p = playerPos && playerPos()
    const bonkAt = lastBonk ? lastBonk() : 0
    for (let i = mobs.length - 1; i >= 0; i--) {
      const m = mobs[i]
      const d = p ? dist(m, { x: p[0], z: p[2] }) : 99
      if (p && d > DESPAWN) { dropMesh(m); mobs.splice(i, 1); continue }
      if ((m.kind === 'scrapper' || m.kind === 'sparkbug') && bonkAt && now - bonkAt < 400 && bonkAt !== m.seenBonk && p && d < 3.2 && !zone(m.x, m.z)) {
        m.seenBonk = bonkAt
        finishReboot(m, true)
        continue
      }
      if (bonkAt) m.seenBonk = bonkAt
      if (zone(m.x, m.z)) { walkHome(m); syncMesh(m); continue }
      const homeD = dist(m, { x: m.homeX, z: m.homeZ })
      if (homeD > LEASH) {
        m.hp = m.maxHp
        walkHome(m)
        syncMesh(m)
        continue
      }
      if (p && zone(m.x + (p[0] - m.x) * 0.2, m.z + (p[2] - m.z) * 0.2)) { walkHome(m); syncMesh(m); continue }
      if (m.kind === 'scrapper') {
        if (m.stolen) walkHome(m)
        else if (p && d < 4) {
          const item = takeCommon ? takeCommon() : ''
          if (item) {
            m.stolen = item
            if (toast) toast((t ? t('c2Scrapper') : 'Scrapper') + ' ' + (t ? t('c2Grabs') : 'grabs') + '. ' + sayItem('c2Took', item))
            walkHome(m)
          }
        } else if (p && d < 12) walk(m, p[0], p[2])
      }
      if (m.kind === 'overseer') {
        const phase = bossPhase(m.id)
        if (phase !== m.lastPhase) {
          m.lastPhase = phase
          if (toast) toast(t ? t('phase' + phase) : 'Phase ' + phase)
        }
        // P1 Stamp
        if (phase === 1 && !m.stampAt) m.stampAt = now + 1500
        if (m.stampAt && now >= m.stampAt && !m.stamped) {
          showStamp()
          if (toast) toast(t ? t('c5Stamp') : '⚠ Stamp!')
          m.stamped = true
          m.weakOpen = now + 2000
          m.stampAt = 0
        }
        // P2 Conveyor (simple push note)
        if (phase === 2 && !m.conveyorAt) {
          m.conveyorAt = now
          if (toast) toast(t ? t('c5Conveyor') : 'Conveyor belts push to walls')
        }
        // P3 Overheat + vent
        if (phase === 3 && !m.ventAt) m.ventAt = now + 6000
        if (m.ventAt && now >= m.ventAt) {
          showVent()
          if (toast) toast(t ? t('c5Vent') : 'Hiss! Vent cone →')
          m.ventAt = now + 6000
        }
        // Wipe: if hp <= 0 handled in finish; here detect wipe request
        if (m.wipe) {
          m.hp = m.maxHp
          m.wipe = false
          if (toast) toast(t ? t('c5Wipe') : 'Calm. Key returned.')
          // return key logic via giveItem
          if (giveItem) giveItem('overrideKey', 1)
        }
      }
      if (m.kind === 'rustbot' && p && d < 6) {
        m.facing = Math.atan2(p[0] - m.x, p[2] - m.z)
        if (toast && !m.announced) { toast(t ? t('rustbotNear') : 'Rustbot nearby, hit its back'); m.announced = true }
      }
      if (m.kind === 'keeper' && d < 4) {
        if (!m.slamAt) m.slamAt = now + 1000
        else if (now >= m.slamAt && !m.slammed) {
          if (toast) toast(t ? t('slam') : 'Slam!')
          showSlamMarker()
          m.slammed = true
          m.weakOpen = now + 2000
        }
      }
      // Apply Bonk damage to rustbot/keeper (×2 on weak)
      if ((m.kind === 'rustbot' || m.kind === 'keeper') && bonkAt && now - bonkAt < 400 && bonkAt !== m.seenBonk && p && d < 3.2 && !zone(m.x, m.z)) {
        m.seenBonk = bonkAt
        let mul = 1
        if (m.kind === 'rustbot') {
          const ang = Math.atan2(p[0] - m.x, p[2] - m.z)
          const diff = Math.abs(((ang - m.facing + Math.PI) % (2*Math.PI)) - Math.PI)
          if (diff > Math.PI / 2) mul = 2 // back/flank
        } else if (m.kind === 'keeper' && m.weakOpen && now < m.weakOpen) {
          mul = 2 // chest open
        }
        const applied = (m.dmg || 4) * mul
        m.hp -= applied
        if (toast) toast((mul > 1 ? '⚡ ' : '') + '-' + applied)
        if (mul > 1) bumpFlanker()
        // Medic awarded from help-up path in main.js
        if (m.hp <= 0) finishReboot(m, true)
      }
      if (m.kind === 'sparkbug') {
        const cooling = m.zapCool && now < m.zapCool
        if (cooling) {
          if (p && d < 10 && d > 2.2) zig(m, p)
        } else if (p && d < 2.2) {
          if (!m.zapAt) {
            m.zapAt = now + 600
            showZap(t ? t('c2Zap') : 'Zap!')
          } else if (now >= m.zapAt) {
            if (!zone(m.x, m.z) && !zone(p[0], p[2]) && hurtSuit) hurtSuit(5, m.x, m.z)
            m.zapAt = 0
            m.zapCool = now + 1400
          }
        } else {
          if (m.zapAt && now >= m.zapAt) m.zapAt = 0
          if (p && d < 12) zig(m, p)
        }
      }
      syncMesh(m)
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
    let kind = enclosed(x, y, z) && lightAt(x, y, z) <= 4 ? 'sparkbug' : 'scrapper'
    if (isNight && isNight() && Math.random() < 0.3 && y >= -2 && y <= 4) kind = 'rustbot'
    else if (y < -4 && Math.random() < 0.15) kind = 'keeper'
    if (!canSpawn(kind, x, y, z)) return null
    return spawn(kind, x, y, z)
  }
  function reboot(id) {
    const m = mobs.find((row) => row.id === id)
    if (!m) return null
    return finishReboot(m, false)
  }
  function count() { return mobs.length }
  function list() { return mobs.map((m) => ({ id: m.id, kind: m.kind, x: m.x, y: m.y, z: m.z, hp: m.hp })) }
  return { spawn, spawnBoss, bossPhase, tick, trySpawn, reboot, count, list, canSpawn }
}
