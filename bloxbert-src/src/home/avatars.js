// Other players in a home world (part 7): a simple standing figure with the player's name above it, drawn as a
// billboard like the mobs (mobs.js syncMesh). HOME BUILD ONLY: created from main.js behind __HOME_HOST__.
// Positions arrive ~5 times a second; each frame eases toward the latest one so movement looks smooth.
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'

const COLORS = ['#38bdf8', '#f472b6', '#a3e635', '#fbbf24', '#c084fc', '#fb7185', '#2dd4bf', '#f97316']
const W = 128, H = 256

// pure: where a figure should be drawn this frame (exported for checks)
export function ease(cur, target, dtMs) {
  if (!cur) return { ...target }
  const d = Math.hypot(target.x - cur.x, target.y - cur.y, target.z - cur.z)
  if (d > 8) return { ...target }                                   // a teleport: jump, do not glide across the map
  const k = Math.min(1, dtMs / 120)
  return { x: cur.x + (target.x - cur.x) * k, y: cur.y + (target.y - cur.y) * k, z: cur.z + (target.z - cur.z) * k }
}
export const colorFor = (name) => { let h = 0; for (const c of String(name)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return COLORS[h % COLORS.length] }

function paint(ctx, name) {
  ctx.clearRect(0, 0, W, H)
  const col = colorFor(name)
  // name tag: dark plate, white text (readable on any sky or ground; not colour alone)
  ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const label = String(name || '?').slice(0, 20), tw = Math.min(W - 4, ctx.measureText(label).width + 14)
  ctx.fillStyle = 'rgba(15,23,42,0.85)'; ctx.fillRect((W - tw) / 2, 4, tw, 30)
  ctx.fillStyle = '#f8fafc'; ctx.fillText(label, W / 2, 20, W - 10)
  // the figure: head, body, legs
  ctx.fillStyle = '#f1c27d'; ctx.fillRect(44, 48, 40, 40)
  ctx.fillStyle = '#0f172a'; ctx.fillRect(52, 62, 7, 7); ctx.fillRect(69, 62, 7, 7)
  ctx.fillStyle = col; ctx.fillRect(36, 92, 56, 84)
  ctx.fillStyle = '#334155'; ctx.fillRect(40, 176, 22, 76); ctx.fillRect(66, 176, 22, 76)
}

export function createAvatars({ scene, addMesh, toLocal }) {
  const shown = new Map()   // id -> { mesh, tex, mat, name, pos }
  function make(id, name) {
    const sc = scene()
    const mesh = CreatePlane('hp-' + id, { width: 0.9, height: 1.8 }, sc)
    const tex = new DynamicTexture('hpt-' + id, { width: W, height: H }, sc, false, Texture.NEAREST_SAMPLINGMODE)
    tex.hasAlpha = true
    const mat = new StandardMaterial('hpm-' + id, sc)
    mat.diffuseTexture = tex; mat.emissiveTexture = tex; mat.useAlphaFromDiffuseTexture = true; mat.disableLighting = true; mat.backFaceCulling = false
    mesh.material = mat; mesh.billboardMode = Mesh.BILLBOARDMODE_Y; mesh.isPickable = false
    paint(tex.getContext(), name); tex.update()
    addMesh(mesh)
    return { mesh, tex, mat, name, pos: null }
  }
  function drop(id) { const a = shown.get(id); if (!a) return; try { a.mesh.dispose(); a.tex.dispose(); a.mat.dispose() } catch (e) {} shown.delete(id) }
  return {
    // players: [{ id, name, x, y, z }] (feet position), every frame
    step(players, dtMs) {
      const seen = new Set()
      for (const p of players) {
        seen.add(p.id)
        let a = shown.get(p.id)
        if (!a) { a = make(p.id, p.name); shown.set(p.id, a) }
        if (a.name !== p.name && p.name) { a.name = p.name; paint(a.tex.getContext(), p.name); a.tex.update() }
        a.pos = ease(a.pos, p, dtMs)
        const l = toLocal([a.pos.x, a.pos.y + 0.9, a.pos.z])
        a.mesh.position.set(l[0], l[1], l[2])
      }
      for (const id of [...shown.keys()]) if (!seen.has(id)) drop(id)
    },
    clear() { for (const id of [...shown.keys()]) drop(id) },
    get count() { return shown.size },
  }
}
