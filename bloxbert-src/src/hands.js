// First-person Bertbot hand. One merged hand mesh, one mesh per held item.
// Parent is the camera. Rendering group 1 clears depth so the hand never clips into blocks.
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color'
import { Vector4 } from '@babylonjs/core/Maths/math.vector'
import { slotArt, itemSvg } from './icons.js'
import { ITEMS } from './data/items.js'
import ATLAS from '../assets/atlas.json'

const GREY = new Color4(0.62, 0.66, 0.71, 1)
const ORANGE = new Color4(0.94, 0.54, 0.16, 1)
const SWING_MS = 250
const DIP_MS = 140

export function createHands(opts) {
  const scene = opts.scene
  const camera = opts.camera
  scene.setRenderingAutoClearDepthStencil(1, true, true, false)

  const flatMat = new StandardMaterial('hand-flat', scene)
  flatMat.disableLighting = true
  flatMat.emissiveColor = new Color3(1, 1, 1)
  flatMat.specularColor = new Color3(0, 0, 0)
  flatMat.fogEnabled = false
  flatMat.backFaceCulling = false

  const mainRoot = new TransformNode('hand-main', scene)
  mainRoot.parent = camera
  mainRoot.position.set(0, -0.02, 1.05)
  const offRoot = new TransformNode('hand-off', scene)
  offRoot.parent = camera
  offRoot.position.set(0, -0.02, 1.05)
  offRoot.scaling.x = -1
  offRoot.setEnabled(false)

  const pivot = new TransformNode('hand-pivot', scene)
  pivot.parent = mainRoot
  pivot.position.set(0.2, -0.26, 0)
  const itemAnchor = new TransformNode('hand-item', scene)
  itemAnchor.parent = pivot
  itemAnchor.position.set(0.24, -0.01, 0.22)

  const handMesh = buildHand(scene, flatMat)
  handMesh.parent = pivot
  const handTris = (handMesh.getTotalIndices() / 3) | 0

  const blockMat = new Map()
  const flatCache = new Map()
  const texInfo = new Map()
  let shown = null
  let shownKey = ''
  let shownBlock = 0
  let sideNow = 'right'
  let phase = 0
  let swingUntil = 0
  let swingKind = 'break'
  let dipUntil = 0
  let pending = ''

  let swings = 0

  function dress(mesh) {
    mesh.renderingGroupId = 1
    mesh.isPickable = false
    mesh.alwaysSelectAsActiveMesh = true
    mesh.receiveShadows = false
    opts.noa.rendering.addMeshToScene(mesh, false)
    return mesh
  }
  dress(handMesh)

  function setSide(side) {
    const left = side === 'left'
    if ((left ? 'left' : 'right') === sideNow) return
    sideNow = left ? 'left' : 'right'
    mainRoot.scaling.x = left ? -1 : 1
    offRoot.scaling.x = left ? 1 : -1
  }

  function syncItem() {
    const spec = opts.held()
    const key = spec.kind === 'empty' ? '' : spec.kind + ':' + spec.key
    if (key === shownKey || (key && key === pending)) return
    if (shown) shown.setEnabled(false)
    shown = null
    if (!key) { shownKey = ''; shownBlock = 0; pending = ''; return }
    if (spec.kind === 'block') {
      pending = ''
      shownKey = key
      shownBlock = spec.id | 0
      shown = blockCube(shownBlock)
      if (shown) holdBlock(shown)
      dipUntil = performance.now() + DIP_MS
      return
    }
    shownBlock = 0
    pending = key
    flatItem(spec.key, (mesh) => {
      if (pending !== key) return
      pending = ''
      shownKey = key
      if (shown) shown.setEnabled(false)
      shown = mesh
      if (!mesh) return
      mesh.parent = itemAnchor
      mesh.position.set(0, 0, 0)
      mesh.rotation.set(0, 0.15, 0)
      mesh.scaling.set(0.34, 0.34, 0.34)
      mesh.setEnabled(true)
      dipUntil = performance.now() + DIP_MS
    })
  }

  function update(dt) {
    setSide(opts.side())
    const hide = !opts.show() || opts.hidden() || opts.wet()
    if (mainRoot.isEnabled() === hide) mainRoot.setEnabled(!hide)
    if (!offRoot.isEnabled()) { /* off-hand stays empty until a later item */ }
    else offRoot.setEnabled(false)
    if (hide) return
    syncItem()
    const now = performance.now()
    const lite = opts.lite()
    let swayX = 0
    let swayZ = 0
    let bob = 0
    if (!lite) {
      const t = now * 0.001
      swayX = Math.sin(t * 1.3) * 0.03
      swayZ = Math.sin(t * 0.8) * 0.02
      const sp = opts.speed()
      if (sp > 0.25) {
        phase += Math.min(dt || 16, 50) * 0.008 * Math.min(2.2, 0.6 + sp * 0.25)
        bob = Math.sin(phase) * 0.012 * Math.min(1, sp / 3)
      }
    }
    let swing = 0
    if (swingUntil > now) {
      const u = 1 - (swingUntil - now) / SWING_MS
      swing = Math.sin(Math.max(0, Math.min(1, u)) * Math.PI)
    }
    let dip = 0
    if (dipUntil > now) {
      const u = 1 - (dipUntil - now) / DIP_MS
      dip = Math.sin(Math.max(0, Math.min(1, u)) * Math.PI) * 0.028
    }
    const chop = swingKind === 'place' ? 0.42 : 0.9
    const aspect = camera.getEngine().getAspectRatio(camera)
    const canvas = camera.getEngine().getRenderingCanvas()
    const cssH = (canvas && canvas.clientHeight) || camera.getEngine().getRenderHeight()
    const short = cssH > 0 && cssH < 500
    const narrow = aspect < 0.9
    pivot.rotation.x = swayX - swing * chop
    pivot.rotation.z = swayZ + swing * 0.15
    pivot.position.x = narrow ? 0.1 : 0.34
    pivot.position.y = (short ? -0.12 : -0.2) + bob - dip
    pivot.position.z = 0
  }

  function swing(kind) {
    swingKind = kind === 'place' ? 'place' : 'break'
    swingUntil = performance.now() + SWING_MS
    swings += 1
  }

  function holdBlock(mesh) {
    mesh.parent = itemAnchor
    mesh.position.set(0.02, -0.03, 0.02)
    mesh.rotation.set(0.15, 0.35, 0.05)
    mesh.scaling.set(1, 1, 1)
    mesh.setEnabled(true)
  }

  function blockCube(id) {
    const key = 'b' + id
    let mesh = blockMat.get(key)
    if (mesh) return mesh
    const faces = faceInfo(id)
    const url = faces.url
    const finish = (built) => {
      built.parent = itemAnchor
      built.position.set(0, 0, 0)
      built.setEnabled(false)
      dress(built)
      blockMat.set(key, built)
      if (shownBlock === id) {
        shown = built
        holdBlock(built)
      }
      return built
    }
    if (!url) {
      mesh = CreateBox('hand-b-' + id, { size: 0.22 }, scene)
      mesh.material = solidMat(faces.color || [0.5, 0.5, 0.5])
      return finish(mesh)
    }
    const info = texOf(url)
    const ready = () => {
      if (blockMat.get(key)) return
      const tile = info.w || 36
      const h = info.h || tile
      const uv = (idx) => {
        if (idx == null || idx < 0) return new Vector4(0, 0, 1, 1)
        const u0 = 2 / tile
        const u1 = (tile - 2) / tile
        const v1 = 1 - (idx * tile + 2) / h
        const v0 = 1 - (idx * tile + (tile - 2)) / h
        return new Vector4(u0, v0, u1, v1)
      }
      // CreateBox face order: +z, -z, +x, -x, +y, -y. noa dir: +x -x +y -y +z -z.
      const order = [4, 5, 0, 1, 2, 3]
      const faceUV = order.map((d) => uv(faces.idx[d]))
      mesh = CreateBox('hand-b-' + id, { size: 0.22, faceUV }, scene)
      mesh.material = atlasMat(url, info.tex)
      finish(mesh)
    }
    if (info.ready) ready()
    else info.wait.push(ready)
    return blockMat.get(key) || null
  }

  function faceInfo(id) {
    const idx = [null, null, null, null, null, null]
    let url = ''
    let color = null
    for (let d = 0; d < 6; d++) {
      let mid = 0
      try { mid = opts.noa.registry.getBlockFaceMaterial(id, d) } catch (e) { mid = 0 }
      const data = mid && opts.noa.registry.getMaterialData(mid)
      if (!data) continue
      if (data.texture && !url) url = data.texture
      if (data.atlasIndex != null && data.atlasIndex >= 0) idx[d] = data.atlasIndex
      else if (ATLAS && data.texture && data.texture.indexOf('atlas.png') >= 0) idx[d] = 0
      if (!color && data.color) color = data.color
    }
    return { url, idx, color }
  }

  function texOf(url) {
    let info = texInfo.get(url)
    if (info) return info
    info = { tex: null, ready: false, w: 0, h: 0, wait: [] }
    texInfo.set(url, info)
    const tex = new Texture(url, scene, false, true, Texture.NEAREST_SAMPLINGMODE)
    info.tex = tex
    const finish = () => {
      if (info.ready) return
      const size = tex.getSize()
      info.w = size.width || 36
      info.h = size.height || info.w
      info.ready = true
      const wait = info.wait.splice(0)
      for (let i = 0; i < wait.length; i++) wait[i]()
    }
    tex.onLoadObservable.addOnce(finish)
    if (tex.isReady() && tex.getSize().width) finish()
    return info
  }

  function atlasMat(url, tex) {
    const hit = blockMat.get('mat:' + url)
    if (hit) return hit
    const mat = new StandardMaterial('hand-atlas-' + blockMat.size, scene)
    mat.disableLighting = true
    mat.emissiveTexture = tex
    mat.specularColor = new Color3(0, 0, 0)
    mat.fogEnabled = false
    mat.backFaceCulling = false
    blockMat.set('mat:' + url, mat)
    return mat
  }

  function solidMat(rgb) {
    const key = 'c' + rgb[0] + ':' + rgb[1] + ':' + rgb[2]
    const hit = blockMat.get(key)
    if (hit) return hit
    const mat = new StandardMaterial('hand-col-' + blockMat.size, scene)
    mat.disableLighting = true
    mat.emissiveColor = new Color3(rgb[0], rgb[1], rgb[2])
    mat.fogEnabled = false
    mat.backFaceCulling = false
    blockMat.set(key, mat)
    return mat
  }

  function flatItem(key, done) {
    const hit = flatCache.get(key)
    if (hit) { done(hit); return }
    const item = ITEMS[key]
    if (item && item.svg) {
      rasterSvg(itemSvg(item.svg), (canvas) => {
        if (!canvas) { done(null); return }
        const mesh = slabFrom(canvas, key)
        if (mesh) flatCache.set(key, mesh)
        done(mesh)
      })
      return
    }
    paintNode(slotArt(key), (canvas) => {
      if (!canvas) { done(null); return }
      const mesh = slabFrom(canvas, key)
      if (mesh) flatCache.set(key, mesh)
      done(mesh)
    })
  }

  function slabFrom(canvas, key) {
    let data = null
    try {
      const g = canvas.getContext('2d', { willReadFrequently: true })
      data = g.getImageData(0, 0, canvas.width, canvas.height).data
    } catch (e) { return null }
    const built = extrude(data, canvas.width, canvas.height)
    if (!built) return null
    const mesh = new Mesh('hand-i-' + key, scene)
    built.applyToMesh(mesh)
    mesh.material = flatMat
    mesh.parent = itemAnchor
    mesh.position.set(0, 0, 0)
    mesh.setEnabled(false)
    dress(mesh)
    return mesh
  }

  setSide(opts.side())
  if (!opts.show() || opts.hidden() || opts.wet()) mainRoot.setEnabled(false)

  return {
    update, swing, setSide,
    mainHand: mainRoot,
    offHand: offRoot,
    showing: () => mainRoot.isEnabled(),
    key: () => shownKey,
    tris: () => handTris,
    swinging: () => performance.now() < swingUntil,
    swingCount: () => swings,
  }
}

function buildHand(scene, mat) {
  const parts = []
  const box = (name, w, h, d, x, y, z, color, rotZ) => {
    const mesh = CreateBox(name, {
      width: w, height: h, depth: d,
      faceColors: [color, color, color, color, color, color],
    }, scene)
    mesh.position.set(x, y, z)
    if (rotZ) mesh.rotation.z = rotZ
    parts.push(mesh)
  }
  box('fore', 0.055, 0.15, 0.055, 0.2, -0.2, 0.02, GREY, 0)
  box('wrist', 0.074, 0.022, 0.074, 0.2, -0.115, 0.045, ORANGE, 0)
  box('palm', 0.095, 0.042, 0.078, 0.22, -0.07, 0.09, GREY, 0)
  box('knuck', 0.09, 0.018, 0.02, 0.22, -0.055, 0.132, ORANGE, 0)
  for (let i = 0; i < 4; i++) {
    box('fing' + i, 0.018, 0.018, 0.055, 0.185 + i * 0.022, -0.058, 0.168, GREY, 0)
  }
  box('thumb', 0.02, 0.02, 0.046, 0.155, -0.085, 0.11, GREY, 0.7)
  const merged = Mesh.MergeMeshes(parts, true, true)
  merged.name = 'bertbot-hand'
  merged.material = mat
  return merged
}

function rasterSvg(markup, done) {
  let xml = String(markup || '')
  if (!xml.includes('<svg')) { done(null); return }
  if (!xml.includes('xmlns=')) xml = xml.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
  if (!/width=/.test(xml)) xml = xml.replace('<svg', '<svg width="48" height="48"')
  const img = new Image()
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = c.height = 48
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, 48, 48)
    URL.revokeObjectURL(url)
    done(c)
  }
  img.onerror = () => { URL.revokeObjectURL(url); done(null) }
  img.src = url
}

function paintNode(node, done) {
  if (node && node.getContext && node.width) { done(node); return }
  const svg = node && node.querySelector && node.querySelector('svg')
  if (!svg) { done(null); return }
  if (!svg.getAttribute('width')) svg.setAttribute('width', '48')
  if (!svg.getAttribute('height')) svg.setAttribute('height', '48')
  const xml = new XMLSerializer().serializeToString(svg)
  const img = new Image()
  const url = URL.createObjectURL(new Blob([xml], { type: 'image/svg+xml;charset=utf-8' }))
  img.onload = () => {
    const c = document.createElement('canvas')
    c.width = c.height = 48
    c.getContext('2d', { willReadFrequently: true }).drawImage(img, 0, 0, 48, 48)
    URL.revokeObjectURL(url)
    done(c)
  }
  img.onerror = () => { URL.revokeObjectURL(url); done(null) }
  img.src = url
}

// 48px icon -> thin slab, 1/16 deep, opaque pixels only, one mesh.
function extrude(data, width, height) {
  const N = 24
  const solid = new Uint8Array(N * N)
  const cols = new Uint32Array(N * N)
  const sx = width / N
  const sy = height / N
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = Math.min(width - 1, (x * sx) | 0)
      const py = Math.min(height - 1, (y * sy) | 0)
      const i = (py * width + px) * 4
      if (data[i + 3] < 80) continue
      const p = y * N + x
      solid[p] = 1
      cols[p] = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4)
    }
  }
  const pos = []
  const idx = []
  const col = []
  let v = 0
  const push = (x, y, z, c) => {
    const r = ((c >> 8) & 15) / 15
    const g = ((c >> 4) & 15) / 15
    const b = (c & 15) / 15
    pos.push(x, y, z)
    col.push(r, g, b, 1)
    return v++
  }
  const quad = (a, b, c, d) => { idx.push(a, b, c, a, c, d) }
  const s = 1 / N
  const z0 = -1 / 32
  const z1 = 1 / 32
  const used = new Uint8Array(N * N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const p = y * N + x
      if (!solid[p] || used[p]) continue
      const c = cols[p]
      let w = 1
      while (x + w < N && solid[p + w] && !used[p + w] && cols[p + w] === c) w++
      let h = 1
      let grow = true
      while (grow && y + h < N) {
        for (let k = 0; k < w; k++) {
          const q = (y + h) * N + x + k
          if (!solid[q] || used[q] || cols[q] !== c) { grow = false; break }
        }
        if (grow) h++
      }
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) used[(y + yy) * N + x + xx] = 1
      const x0 = x * s - 0.5
      const x1 = (x + w) * s - 0.5
      const y1 = 0.5 - y * s
      const y0 = 0.5 - (y + h) * s
      const a = push(x0, y0, z1, c)
      const b = push(x1, y0, z1, c)
      const d = push(x1, y1, z1, c)
      const e = push(x0, y1, z1, c)
      quad(a, b, d, e)
      const a2 = push(x0, y0, z0, c)
      const b2 = push(x0, y1, z0, c)
      const d2 = push(x1, y1, z0, c)
      const e2 = push(x1, y0, z0, c)
      quad(a2, b2, d2, e2)
    }
  }
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const p = y * N + x
      if (!solid[p]) continue
      const c = cols[p]
      const x0 = x * s - 0.5
      const x1 = x0 + s
      const y1 = 0.5 - y * s
      const y0 = y1 - s
      const edge = (xa, ya, xb, yb, xc, yc, xd, yd) => {
        const a = push(xa, ya, z0, c)
        const b = push(xb, yb, z1, c)
        const d = push(xc, yc, z1, c)
        const e = push(xd, yd, z0, c)
        quad(a, b, d, e)
      }
      if (x === 0 || !solid[p - 1]) edge(x0, y0, x0, y0, x0, y1, x0, y1)
      if (x === N - 1 || !solid[p + 1]) edge(x1, y1, x1, y1, x1, y0, x1, y0)
      if (y === 0 || !solid[p - N]) edge(x1, y1, x1, y1, x0, y1, x0, y1)
      if (y === N - 1 || !solid[p + N]) edge(x0, y0, x0, y0, x1, y0, x1, y0)
    }
  }
  if (!idx.length) return null
  const normals = new Array(pos.length)
  VertexData.ComputeNormals(pos, idx, normals)
  const vd = new VertexData()
  vd.positions = pos
  vd.indices = idx
  vd.colors = col
  vd.normals = normals
  return vd
}
