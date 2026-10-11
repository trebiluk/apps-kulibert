// Graphics look: Lite / Normal / Fancy. Resolution stays on quality.js.
// Lite: flat sky, no baked lamp light, no plant sway, face shade.
// Normal: sky gradient, baked lamp light, face shade. The default.
// Fancy: Normal plus per-vertex ambient occlusion and plant sway.
const GKEY = 'bloxbert-gfx'
const REACH = 7
const S = 24
const NAMES = { lite: 'Lite', normal: 'Normal', fancy: 'Fancy' }
const SWAY = new Set(['flora-daisy', 'flora-poppy', 'flora-cornflower', 'flora-sunflower', 'flora-tulip', 'flora-lupine', 'flora-tallGrass'])
const LIGHT_ID = new Set([47, 1101, 1103, 1401])

const SKY = {
  day: { zenith: [0.13, 0.34, 0.72], horizon: [0.72, 0.86, 0.97], sun: 1, moon: 0, stars: 0 },
  dusk: { zenith: [0.18, 0.09, 0.28], horizon: [0.96, 0.42, 0.16], sun: 0.7, moon: 0.35, stars: 0.35 },
  night: { zenith: [0.015, 0.02, 0.07], horizon: [0.08, 0.10, 0.22], sun: 0, moon: 1, stars: 1 },
  dawn: { zenith: [0.22, 0.16, 0.40], horizon: [0.98, 0.58, 0.36], sun: 0.85, moon: 0.2, stars: 0.12 },
}

function hash2(x, z) {
  let n = Math.imul(Math.floor(x / 4), 374761393) + Math.imul(Math.floor(z / 4), 668265263)
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295
}

export function leafTint(id, x, z) {
  const h = hash2(x, z)
  if (id === 1201) return [1.02 + h * 0.16, 1.10 + h * 0.10, 0.90 + h * 0.08]
  if (id === 1204) return [0.58 + h * 0.12, 0.68 + h * 0.10, 0.50 + h * 0.08]
  if (id === 12) return [0.86 + h * 0.18, 0.94 + h * 0.14, 0.74 + h * 0.10]
  return null
}

function faceShade(nx, ny, nz) {
  if (ny > 0.5) return 1
  if (ny < -0.5) return 0.55
  if (nx > 0.5 || nz > 0.5) return 0.8
  return 0.7
}

function k3(x, y, z) { return x + ',' + y + ',' + z }

export function createLook(opts) {
  const qs = new URLSearchParams(location.search)
  let stored = null
  try { stored = localStorage.getItem(GKEY) } catch (e) {}
  const asked = qs.get('gfx')
  let managed = false
  let name
  if (asked === 'lite' || asked === 'normal' || asked === 'fancy') name = asked
  else if (stored === 'lite' || stored === 'normal' || stored === 'fancy') name = stored
  else if (qs.get('q') === 'lite') name = 'lite'
  else { name = 'normal'; managed = true }
  let builds = 0
  let epoch = 1
  const lights = new Map()
  const fields = new Map()
  let leaf = { oak: 13, birch: -1, pine: -1 }
  let host = opts || {}

  function flags() {
    if (name === 'fancy') return { ao: true, sway: true, lights: true, gradient: true }
    if (name === 'lite') return { ao: false, sway: false, lights: false, gradient: false }
    return { ao: false, sway: false, lights: true, gradient: true }
  }

  function remember() {
    try { localStorage.setItem(GKEY, name) } catch (e) {}
  }

  function powerAt(id, x, y, z) {
    if (id === 1101 || id === 1103) return 7
    if (id !== 47 && id !== 1401) return 0
    const rec = host.meta ? host.meta(x, y, z) : null
    if (rec && rec.circuitLit) return id === 1401 ? 6 : 7
    if (id === 47 && host.lanternOn && host.lanternOn(x, y, z)) return 7
    return 0
  }

  function putLight(x, y, z, id) {
    const p = powerAt(id, x, y, z)
    const key = k3(x, y, z)
    if (p) lights.set(key, { x, y, z, p })
    else lights.delete(key)
  }

  function nearby(ox, oy, oz) {
    const x1 = ox + S
    const y1 = oy + S
    const z1 = oz + S
    const out = []
    for (const s of lights.values()) {
      if (s.x < ox - REACH || s.x >= x1 + REACH) continue
      if (s.y < oy - REACH || s.y >= y1 + REACH) continue
      if (s.z < oz - REACH || s.z >= z1 + REACH) continue
      out.push(s)
    }
    return out
  }

  function buildField(ox, oy, oz) {
    const src = nearby(ox, oy, oz)
    if (!src.length || !flags().lights) return null
    const map = new Map()
    const get = host.getVoxel
    const solid = host.opaque
    if (!get) return null
    for (const s of src) {
      const q = [[s.x, s.y, s.z, s.p]]
      map.set(k3(s.x, s.y, s.z), s.p)
      for (let n = 0; n < q.length; n++) {
        const x = q[n][0]
        const y = q[n][1]
        const z = q[n][2]
        const lv = q[n][3]
        if (lv <= 1) continue
        const next = lv - 1
        const dirs = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
        for (let d = 0; d < dirs.length; d++) {
          const nx = x + dirs[d][0]
          const ny = y + dirs[d][1]
          const nz = z + dirs[d][2]
          if (nx < ox - 1 || nx >= ox + S + 1 || ny < oy - 1 || ny >= oy + S + 1 || nz < oz - 1 || nz >= oz + S + 1) continue
          const key = k3(nx, ny, nz)
          if ((map.get(key) || 0) >= next) continue
          if (!(nx === s.x && ny === s.y && nz === s.z)) {
            const id = get(nx, ny, nz)
            if (id && solid && solid(id) && !LIGHT_ID.has(id)) continue
          }
          map.set(key, next)
          q.push([nx, ny, nz, next])
        }
      }
    }
    return map
  }

  function fieldAt(x, y, z) {
    const ci = Math.floor(x / S)
    const cj = Math.floor(y / S)
    const ck = Math.floor(z / S)
    const id = ci + ',' + cj + ',' + ck
    let row = fields.get(id)
    if (!row || row.epoch !== epoch) {
      row = { epoch, map: buildField(ci * S, cj * S, ck * S) }
      fields.set(id, row)
    }
    if (!row.map) return 0
    return row.map.get(k3(Math.floor(x), Math.floor(y), Math.floor(z))) || 0
  }

  function bump(x, y, z) {
    epoch++
    fields.clear()
    if (host.remesh) host.remesh(x, y, z, REACH + 1)
  }

  function sky(phase) {
    const row = SKY[phase] || SKY.day
    const flat = !flags().gradient
    return {
      zenith: row.zenith,
      horizon: flat ? [
        (row.zenith[0] + row.horizon[0]) * 0.5,
        (row.zenith[1] + row.horizon[1]) * 0.5,
        (row.zenith[2] + row.horizon[2]) * 0.5,
      ] : row.horizon,
      sun: row.sun,
      moon: row.moon,
      stars: row.stars,
      flat,
    }
  }

  function paint(mesh) {
    if (!mesh || !mesh.name || mesh.name.indexOf('chunk_') !== 0) return
    const m = /^chunk_(-?\d+)\|(-?\d+)\|(-?\d+)\|/.exec(mesh.name)
    if (!m || !mesh.getVerticesData) return
    const colors = mesh.getVerticesData('color')
    const normals = mesh.getVerticesData('normal')
    const positions = mesh.getVerticesData('position')
    if (!colors || !normals || !positions) return
    const ox = +m[1] * S
    const oy = +m[2] * S
    const oz = +m[3] * S
    const ao = flags().ao
    const lit = flags().lights && lights.size > 0
    const atlas = mesh.getVerticesData('texAtlasIndices')
    const tex = mesh.material && mesh.material.diffuseTexture
    const url = (tex && (tex.url || '')) || ''
    const wrap = url.indexOf('atlas.png') < 0 && url.length > 80
    const n = positions.length / 3
    for (let i = 0; i < n; i++) {
      const nx = normals[i * 3]
      const ny = normals[i * 3 + 1]
      const nz = normals[i * 3 + 2]
      let shade = ao ? 1 : faceShade(nx, ny, nz)
      const wx = ox + positions[i * 3]
      const wy = oy + positions[i * 3 + 1]
      const wz = oz + positions[i * 3 + 2]
      if (lit) {
        const lv = fieldAt(wx + nx * 0.25, wy + ny * 0.25, wz + nz * 0.25)
        if (lv > 0) {
          const w = lv / 7
          shade *= 1 + w * 0.9
          colors[i * 4 + 1] *= 1 + w * 0.35
          colors[i * 4 + 2] *= 1 + w * 0.08
        }
      }
      if (atlas) {
        const ix = atlas[i]
        let kind = 0
        if (!wrap && ix === leaf.oak) kind = 12
        else if (wrap && ix === leaf.birch) kind = 1201
        else if (wrap && ix === leaf.pine) kind = 1204
        const tint = kind ? leafTint(kind, wx, wz) : null
        if (tint) {
          colors[i * 4] *= tint[0]
          colors[i * 4 + 1] *= tint[1]
          colors[i * 4 + 2] *= tint[2]
        }
      }
      colors[i * 4] *= shade
      colors[i * 4 + 1] *= shade
      colors[i * 4 + 2] *= shade
    }
    mesh.setVerticesData('color', colors, false)
    builds++
  }

  function swayMesh(mesh, time, on) {
    const store = mesh._thinInstanceDataStorage
    if (!store || !store.matrixData || !(store.instancesCount > 0)) return null
    const data = store.matrixData
    const count = store.instancesCount
    let tip = null
    for (let i = 0; i < count; i++) {
      const o = i * 16
      const x = data[o + 12]
      const y = data[o + 13]
      const z = data[o + 14]
      let c = 1
      let s = 0
      if (on) {
        const ang = Math.sin(time * 1.6 + x * 0.65 + z * 0.45) * 0.22
        c = Math.cos(ang)
        s = Math.sin(ang)
      }
      data[o] = c
      data[o + 1] = s
      data[o + 2] = 0
      data[o + 4] = -s
      data[o + 5] = c
      data[o + 6] = 0
      data[o + 8] = 0
      data[o + 9] = 0
      data[o + 10] = 1
      if (!tip) {
        const hx = 0
        const hy = 0.7
        tip = [x + hx * c + hy * -s, y + hx * s + hy * c, z]
      }
    }
    mesh.thinInstanceBufferUpdated('matrix')
    mesh.__sway = on ? 1 : 0
    return tip
  }

  function readTip(mesh) {
    const store = mesh._thinInstanceDataStorage
    if (!store || !store.matrixData || !(store.instancesCount > 0)) return null
    const data = store.matrixData
    const x = data[12]
    const y = data[13]
    const z = data[14]
    const c = data[0]
    const s = data[1]
    const hy = 0.7
    return [x + hy * -s, y + hy * c, z]
  }
  function tickSway(scene, time) {
    if (!scene) return null
    const on = flags().sway && !(host.reduce && host.reduce())
    let tip = null
    const meshes = scene.meshes
    for (let i = 0; i < meshes.length; i++) {
      const mesh = meshes[i]
      if (!mesh || !SWAY.has(mesh.name)) continue
      if (on || mesh.__sway) swayMesh(mesh, time, on)
      if (!tip) {
        const hit = readTip(mesh)
        if (hit) tip = { name: mesh.name, tip: hit }
      }
    }
    return tip
  }

  return {
    get name() { return name },
    get managed() { return managed },
    get ao() { return flags().ao },
    get sway() { return flags().sway && !(host.reduce && host.reduce()) },
    get lightsOn() { return flags().lights },
    get gradient() { return flags().gradient },
    get builds() { return builds },
    label() { return NAMES[name] || name },
    bind(next) { host = Object.assign(host, next || {}) },
    setLeaves(next) { leaf = Object.assign(leaf, next || {}) },
    sky,
    leafTint,
    level(x, y, z) { return flags().lights ? fieldAt(x, y, z) : 0 },
    paint,
    tickSway,
    note(x, y, z, prev, nextId) {
      const was = LIGHT_ID.has(prev) || LIGHT_ID.has(nextId)
      if (!was) return
      putLight(x, y, z, nextId)
      bump(x, y, z)
    },
    reindex() {
      lights.clear()
      const saved = host.saved ? host.saved() : null
      if (!saved) return
      for (const [ck, data] of saved) {
        const parts = ck.split(',')
        const ci = +parts[0]
        const cj = +parts[1]
        const ckz = +parts[2]
        if (!data) continue
        for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
          const id = data[i * S * S + j * S + k]
          if (!LIGHT_ID.has(id)) continue
          putLight(ci * S + i, cj * S + j, ckz * S + k, id)
        }
      }
      epoch++
      fields.clear()
    },
    markCircuits() {
      const saved = host.saved ? host.saved() : null
      if (!saved) return
      let moved = false
      for (const [ck, data] of saved) {
        const parts = ck.split(',')
        const ci = +parts[0]
        const cj = +parts[1]
        const ckz = +parts[2]
        if (!data) continue
        for (let i = 0; i < S; i++) for (let j = 0; j < S; j++) for (let k = 0; k < S; k++) {
          const id = data[i * S * S + j * S + k]
          if (id !== 47 && id !== 1401 && id !== 1101 && id !== 1103) continue
          const x = ci * S + i
          const y = cj * S + j
          const z = ckz * S + k
          const key = k3(x, y, z)
          const p = powerAt(id, x, y, z)
          const prev = lights.get(key)
          if (p && (!prev || prev.p !== p)) { lights.set(key, { x, y, z, p }); moved = true }
          else if (!p && prev) { lights.delete(key); moved = true }
        }
      }
      if (moved) {
        epoch++
        fields.clear()
        if (host.remeshAllLights) host.remeshAllLights(lights)
      }
    },
    set(q) {
      if (q !== 'lite' && q !== 'normal' && q !== 'fancy') return null
      const prev = flags().ao
      name = q
      managed = false
      remember()
      epoch++
      fields.clear()
      return { ao: flags().ao, changed: flags().ao !== prev }
    },
    dropLite() {
      if (!managed || name === 'lite') return false
      name = 'lite'
      remember()
      epoch++
      fields.clear()
      return true
    },
  }
}
