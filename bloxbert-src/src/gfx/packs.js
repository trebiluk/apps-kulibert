// Swappable block art. Built-in packs live in assets/packs/<id>/.
// The strip is one square layer per material, with a 2px copied gutter.
// setPack swaps that strip without a reload. Only the pack id is saved.
// 2.5.590: Mystical is the default for a fresh profile. A saved choice (either pack) is kept as it is.
import SHEET from '../../assets/packs/sheet.json'

const PACKS = {
  classic: { id: 'classic', name: 'Classic Topia' },
  mystical: { id: 'mystical', name: 'Mystical Topia' },
}
const STORE = 'bertopia-pack'
const DEFAULT_PACK = 'mystical'
const SMALL_KEY = 'bertopia-tex-small'

// 32 student colors. Index 0 is the dark check, 16 is the bright check.
export const PALETTE = [
  [28, 24, 22], [62, 48, 36], [92, 64, 40], [120, 84, 48], [86, 110, 48],
  [46, 120, 52], [36, 86, 40], [150, 126, 72], [196, 168, 110], [90, 90, 96],
  [130, 128, 124], [168, 164, 156], [78, 74, 70], [108, 104, 110], [70, 48, 96],
  [110, 72, 140], [224, 112, 32], [46, 120, 118], [90, 150, 146], [180, 86, 72],
  [150, 48, 52], [48, 72, 110], [90, 120, 160], [200, 160, 70], [160, 130, 170],
  [40, 40, 44], [20, 20, 22], [110, 110, 114], [180, 176, 170], [210, 120, 90],
  [120, 80, 60], [238, 243, 247],
]

// Faces a student key paints when it is narrower than the block's whole key. Grass top leaves dirt alone.
const STUDENT_FACES = { grass: ['grass_top'] }

let noaRef = null
let readyWait = []

export function packList() {
  return [PACKS.classic, PACKS.mystical]
}

export function currentPackId() {
  try {
    const id = localStorage.getItem(STORE)
    if (id === 'mystical' || id === 'classic') return id
  } catch (e) {}
  return DEFAULT_PACK
}

function queryTex() {
  try {
    return new URLSearchParams(location.search).get('tex')
  } catch (e) {
    return ''
  }
}

function autoSmall() {
  const cores = (navigator.hardwareConcurrency || 8) <= 4
  const mem = (navigator.deviceMemory || 8) <= 4
  let phone = false
  try {
    phone = matchMedia('(pointer: coarse)').matches || matchMedia('(max-width: 500px)').matches
  } catch (e) {}
  try {
    if (new URLSearchParams(location.search).has('touch')) phone = true
  } catch (e) {}
  return cores || mem || phone
}

function savedTex() {
  try { return localStorage.getItem(SMALL_KEY) || '' } catch (e) { return '' }
}

export function smallTextures() {
  const q = queryTex()
  // ?tex=64 and an explicit off both beat Chromebook auto and ?tex=32.
  if (q === '64') return false
  const saved = savedTex()
  if (saved === '0') return false
  if (saved === '1' || q === '32') return true
  // 2.5.550 lag test: every device starts on the 36px sheet (32px core). ?tex=64 or the Look toggle opts in to 64.
  return true
}

// 32px chosen by the device (Chromebook, phone, or ?tex=32), not by the player.
export function autoTex32() {
  if (!smallTextures()) return false
  const saved = savedTex()
  return saved !== '1' && saved !== '0'
}

let texBusy = false
export function setSmallTextures(on) {
  if (texBusy) return
  texBusy = true
  try { localStorage.setItem(SMALL_KEY, on ? '1' : '0') } catch (e) {}
  try {
    const u = new URL(location.href)
    u.searchParams.set('tex', on ? '32' : '64')
    location.replace(u.href)
  } catch (e) {
    location.reload()
  }
}

function coreSize() {
  return smallTextures() ? 32 : 64
}

function stripUrl(id) {
  const size = coreSize()
  return 'assets/packs/' + id + '/atlas' + size + '.png'
}

function indexOf(name) {
  const i = SHEET.order.indexOf(name)
  return i
}

function publishSheet(url) {
  const core = coreSize()
  const byMat = {}
  SHEET.order.forEach((name, i) => { byMat[name] = i })
  for (const alias in SHEET.alias) byMat[alias] = indexOf(SHEET.alias[alias])
  const img = new Image()
  img.decoding = 'async'
  const done = () => {
    window.__bertSheet = {
      img: img,
      url: url,
      core: core,
      layer: core + 4,
      byMat: byMat,
    }
    window.__bertPack = currentPackId()
    window.__bertTexCore = core
    window.dispatchEvent(new Event('bertopia-pack'))
  }
  img.onload = done
  img.onerror = () => {
    // A missing strip falls back to the missing tile instead of crashing.
    const fallback = missingStrip()
    img.onload = done
    img.src = fallback
    swapTextures(fallback)
  }
  if (img.src !== url) img.src = url
  else if (img.complete && img.naturalWidth) done()
}

function registerAll(url) {
  const noa = noaRef
  const core = coreSize()
  window.__bertTexCore = core
  SHEET.order.forEach((name, i) => {
    noa.registry.registerMaterial(name, { textureURL: url, atlasIndex: i })
  })
  for (const alias in SHEET.alias) {
    const src = SHEET.alias[alias]
    const i = indexOf(src)
    if (i < 0) continue
    noa.registry.registerMaterial(alias, { textureURL: url, atlasIndex: i })
  }
}

function tagTextures() {
  const scene = noaRef && noaRef.rendering && noaRef.rendering.scene
  if (!scene) return false
  const mats = scene.materials || []
  let ready = false
  for (let i = 0; i < mats.length; i++) {
    const tex = mats[i] && mats[i].diffuseTexture
    if (!tex) continue
    const u = tex.url || ''
    if (tex.__bertPack || u.indexOf('assets/packs/') >= 0) tex.__bertPack = 1
    if (tex.__bertPack && tex.isReady && tex.isReady()) ready = true
  }
  return ready
}

function rebuildPackArrays(tex) {
  const scene = noaRef && noaRef.rendering && noaRef.rendering.scene
  if (!scene || !tex) return
  const mats = scene.materials || []
  for (let i = 0; i < mats.length; i++) {
    const mat = mats[i]
    if (!mat || mat.diffuseTexture !== tex) continue
    const plugs = mat.pluginManager && mat.pluginManager._plugins
    if (!plugs) continue
    for (let j = 0; j < plugs.length; j++) {
      const plug = plugs[j]
      if (plug && plug.setTextureArrayData) {
        try { plug.setTextureArrayData(tex) } catch (e) {}
      }
    }
  }
}

function swapTextures(url) {
  registerAll(url)
  const scene = noaRef && noaRef.rendering && noaRef.rendering.scene
  if (!scene) return Promise.resolve()
  tagTextures()
  const mats = scene.materials || []
  const seen = new Set()
  const jobs = []
  for (let i = 0; i < mats.length; i++) {
    const tex = mats[i] && mats[i].diffuseTexture
    if (!tex || seen.has(tex) || !tex.__bertPack) continue
    seen.add(tex)
    jobs.push(new Promise((resolve) => {
      try {
        tex.updateURL(url, null, () => {
          rebuildPackArrays(tex)
          resolve()
        })
      } catch (e) { resolve() }
    }))
  }
  return Promise.all(jobs)
}

function whenStripReady(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function installPacks(noa, gfxLook) {
  noaRef = noa
  const id = currentPackId()
  const url = stripUrl(id)
  window.__bertTexCore = coreSize()
  registerAll(url)
  const oak = indexOf('leaves')
  const birch = indexOf('wrap_birchLeaves')
  const pine = indexOf('wrap_pineNeedles')
  if (gfxLook && gfxLook.setLeaves) gfxLook.setLeaves({ oak: oak, birch: birch, pine: pine })
  publishSheet(url)
  fetch('assets/packs/' + id + '/pack.json').then((r) => r.ok ? r.json() : null).then((pack) => {
    if (!pack || pack.format !== 'bertopia-pack') return
    window.__bertPackJson = pack
    if (pack.name && PACKS[id]) PACKS[id].name = pack.name
  }).catch(() => {})
  const mark = () => {
    window.__bertPackReady = true
    if (window.__bertStudentRestore) window.__bertStudentRestore()
    window.dispatchEvent(new Event('bertopia-pack-ready'))
    const wait = readyWait
    readyWait = []
    wait.forEach((fn) => fn())
  }
  whenStripReady(url).then((img) => {
    let n = 0
    const tick = () => {
      const ready = tagTextures()
      n += 1
      if ((img && ready) || n > 120) mark()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  window.__bertSetPack = setPack
  window.__bertStudentPack = applyStudent
  window.__bertPackId = currentPackId
  window.__bertSmall = smallTextures
  return { id: id, small: smallTextures(), url: url }
}

export function setPack(id) {
  if (!PACKS[id]) id = DEFAULT_PACK
  const started = performance.now()
  try { localStorage.setItem(STORE, id) } catch (e) {}
  const url = stripUrl(id)
  return swapTextures(url).then(() => whenStripReady(url)).then((img) => {
    if (img) {
      const core = coreSize()
      const byMat = (window.__bertSheet && window.__bertSheet.byMat) || {}
      window.__bertSheet = { img: img, url: url, core: core, layer: core + 4, byMat: byMat }
    } else publishSheet(url)
    window.__bertPack = id
    window.dispatchEvent(new Event('bertopia-pack'))
    if (window.__bertStudentRestore) window.__bertStudentRestore()
    return { id: id, ms: performance.now() - started }
  })
}

function paintGutter(g, core, y) {
  const pad = 2
  const x0 = pad
  const y0 = y + pad
  g.imageSmoothingEnabled = false
  g.drawImage(g.canvas, x0, y0, 1, core, 0, y0, pad, core)
  g.drawImage(g.canvas, x0 + core - 1, y0, 1, core, x0 + core, y0, pad, core)
  g.drawImage(g.canvas, x0, y0, core, 1, x0, y, core, pad)
  g.drawImage(g.canvas, x0, y0 + core - 1, core, 1, x0, y0 + core, core, pad)
}

function missingStrip() {
  const core = coreSize()
  const layer = core + 4
  const c = document.createElement('canvas')
  c.width = layer
  c.height = layer * Math.max(1, SHEET.order.length)
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  g.fillStyle = '#7a4e2a'
  g.fillRect(0, 0, c.width, c.height)
  return c.toDataURL('image/png')
}

// Build one atlas strip in a canvas: core image plus a 2px copied gutter.
export function buildAtlas(faces, core) {
  const size = core === 32 ? 32 : 64
  const layer = size + 4
  const c = document.createElement('canvas')
  c.width = layer
  c.height = layer * faces.length
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false
  faces.forEach((face, i) => {
    const y = i * layer
    if (!face) {
      g.fillStyle = '#7a4e2a'
      g.fillRect(0, y, layer, layer)
      return
    }
    g.drawImage(face, 2, y + 2, size, size)
    paintGutter(g, size, y)
  })
  return c
}

export function applyStudent(json) {
  const sheet = window.__bertSheet
  const img = sheet && sheet.img
  if (!json || json.format !== 'bertopia-pack' || !img || !img.naturalWidth) return Promise.resolve(false)
  const core = coreSize()
  const layer = core + 4
  const scale = core / 16
  const c = document.createElement('canvas')
  c.width = img.naturalWidth
  c.height = img.naturalHeight
  const g = c.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = false
  g.drawImage(img, 0, 0)
  const textures = json.textures || {}
  Object.keys(textures).forEach((key) => {
    const tex = textures[key]
    const pixels = tex && tex.pixels
    if (!pixels || pixels.length !== 256) return
    const mats = STUDENT_FACES[key] || (SHEET.keyMats && SHEET.keyMats[key]) || []
    mats.forEach((mat) => {
      const ix = indexOf(mat)
      if (ix < 0) return
      const y0 = ix * layer
      const data = g.getImageData(2, y0 + 2, core, core)
      for (let py = 0; py < 16; py++) {
        for (let px = 0; px < 16; px++) {
          const idx = pixels[py * 16 + px]
          const col = PALETTE[(idx | 0) & 31] || PALETTE[0]
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const x = px * scale + dx
              const y = py * scale + dy
              const o = (y * core + x) * 4
              data.data[o] = col[0]
              data.data[o + 1] = col[1]
              data.data[o + 2] = col[2]
              data.data[o + 3] = 255
            }
          }
        }
      }
      g.putImageData(data, 2, y0 + 2)
      paintGutter(g, core, y0)
    })
  })
  const url = c.toDataURL('image/png')
  swapTextures(url)
  return whenStripReady(url).then((next) => {
    if (next && window.__bertSheet) {
      window.__bertSheet.img = next
      window.__bertSheet.url = url
    }
    window.dispatchEvent(new Event('bertopia-pack'))
    return true
  })
}

// 2x2 box average, used if a 64 face has to become 32 in the canvas.
export function boxAverage(src, sw, sh) {
  const w = sw >> 1
  const h = sh >> 1
  const out = new Uint8ClampedArray(w * h * 4)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const o = ((y * 2 + dy) * sw + (x * 2 + dx)) * 4
          r += src[o]
          g += src[o + 1]
          b += src[o + 2]
          a += src[o + 3]
        }
      }
      const o = (y * w + x) * 4
      out[o] = r >> 2
      out[o + 1] = g >> 2
      out[o + 2] = b >> 2
      out[o + 3] = a >> 2
    }
  }
  return out
}
