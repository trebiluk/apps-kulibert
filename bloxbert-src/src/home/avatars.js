// Other players in a home world (part 7; rebuilt Nov 1): the same blocky Berty figure you are (shoes, legs, shirt,
// head, visor, two swinging arms) in THEIR suit colours, facing where they look, with a name tag above. HOME BUILD
// ONLY: created from main.js behind __HOME_HOST__.
// Positions arrive ~5 times a second with heading r and a flags byte f; each frame eases toward the latest one so
// movement looks smooth, and the arms swing when the figure is actually moving. f packs: bit 0 = flying,
// bits 1-3 = suit (0 berty, 1 clay, 2 bearcat, 3 grove, 4 snow); the school protocol already allows f 0..255.
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder'
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder'
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial'
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture'
import { Texture } from '@babylonjs/core/Materials/Textures/texture'
import { Mesh } from '@babylonjs/core/Meshes/mesh'
import { TransformNode } from '@babylonjs/core/Meshes/transformNode'
import { Vector3 } from '@babylonjs/core/Maths/math.vector'
import { Color3 } from '@babylonjs/core/Maths/math.color'
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer'

import { SUIT_IDS, unpackFlags } from './flags.js'
import { homeMyPos } from './home.js'
export { SUIT_IDS, packFlags, unpackFlags, mySuit } from './flags.js'
// the same suits as main.js (SUITS): shoe, pant, shirt, head, visor, hand
export const SUITS = {
  berty: { shoe: [0.08, 0.12, 0.16], pant: [0.06, 0.42, 0.5], shirt: [0.12, 0.82, 0.76], head: [0.45, 0.95, 0.9], visor: [0.72, 0.4, 1], hand: [0.82, 0.82, 0.82] },
  clay: { shoe: [0.37, 0.7, 0.77], pant: [0.14, 0.23, 0.29], shirt: [0.16, 0.2, 0.28], head: [0.84, 0.71, 0.54], visor: [0.29, 0.2, 0.16], hand: [0.84, 0.71, 0.54] },
  bearcat: { shoe: [0.1, 0.11, 0.14], pant: [0.11, 0.14, 0.2], shirt: [0.94, 0.54, 0.14], head: [0.9, 0.76, 0.64], visor: [0.11, 0.14, 0.2], hand: [0.94, 0.54, 0.14] },
  grove: { shoe: [0.23, 0.16, 0.11], pant: [0.42, 0.26, 0.14], shirt: [0.24, 0.56, 0.38], head: [0.88, 0.71, 0.54], visor: [0.18, 0.42, 0.28], hand: [0.88, 0.71, 0.54] },
  snow: { shoe: [0.23, 0.27, 0.33], pant: [0.56, 0.78, 0.85], shirt: [0.93, 0.95, 0.97], head: [0.94, 0.82, 0.72], visor: [0.35, 0.45, 0.55], hand: [0.94, 0.82, 0.72] },
}

// pure: where a figure should be drawn this frame (exported for checks)
export function ease(cur, target, dtMs) {
  if (!cur) return { x: target.x, y: target.y, z: target.z, r: target.r || 0 }
  const d = Math.hypot(target.x - cur.x, target.y - cur.y, target.z - cur.z)
  if (d > 8) return { x: target.x, y: target.y, z: target.z, r: target.r || 0 }   // a teleport: jump, do not glide across the map
  const k = Math.min(1, dtMs / 120)
  let dr = (target.r || 0) - cur.r
  while (dr > Math.PI) dr -= Math.PI * 2
  while (dr < -Math.PI) dr += Math.PI * 2
  return { x: cur.x + (target.x - cur.x) * k, y: cur.y + (target.y - cur.y) * k, z: cur.z + (target.z - cur.z) * k, r: cur.r + dr * Math.min(1, dtMs / 90) }
}
// pure: the pose for this frame. speed in blocks/s; -> { swing (arm/leg angle), bob (y lift), armsUp }
export function pose(speed, flying, tMs) {
  if (flying) return { swing: Math.sin(tMs / 400) * 0.12, bob: Math.sin(tMs / 700) * 0.06, armsUp: true }
  if (speed > 0.4) return { swing: Math.sin(tMs / 140) * 0.65, bob: Math.abs(Math.sin(tMs / 140)) * 0.04, armsUp: false }
  return { swing: 0, bob: Math.sin(tMs / 1600) * 0.012, armsUp: false }
}
const W = 256, H = 64
const NAME_FADE = 40   // blocks: the tag fades out beyond this
function paintTag(ctx, name) {
  ctx.clearRect(0, 0, W, H)
  ctx.font = 'bold 30px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  const label = String(name || '?').slice(0, 20), tw = Math.min(W - 4, ctx.measureText(label).width + 24)
  ctx.fillStyle = 'rgba(11,18,32,0.88)'; ctx.beginPath(); ctx.roundRect((W - tw) / 2, 10, tw, 44, 10); ctx.fill()
  ctx.strokeStyle = '#2dd4bf'; ctx.lineWidth = 2; ctx.stroke()
  ctx.fillStyle = '#f8fafc'; ctx.fillText(label, W / 2, 32, W - 20)
}

export function createAvatars({ scene, addMesh, toLocal, myPos = homeMyPos }) {
  const shown = new Map()   // id -> { root, parts, armL, armR, legL, legR, tag, tex, mats, name, suit, pos, last, speed }
  function part(sc, name, w, h, d, x, y, z, rgb, mat) {
    const m = CreateBox(name, { width: w, height: h, depth: d }, sc)
    m.position.set(x, y, z); m.isPickable = false; m.material = mat
    const n = m.getTotalVertices(), cols = new Float32Array(n * 4)
    for (let i = 0; i < n; i++) { cols[i * 4] = rgb[0]; cols[i * 4 + 1] = rgb[1]; cols[i * 4 + 2] = rgb[2]; cols[i * 4 + 3] = 1 }
    m.setVerticesData(VertexBuffer.ColorKind, cols)
    return m
  }
  function tint(m, rgb) { const n = m.getTotalVertices(), cols = new Float32Array(n * 4); for (let i = 0; i < n; i++) { cols[i * 4] = rgb[0]; cols[i * 4 + 1] = rgb[1]; cols[i * 4 + 2] = rgb[2]; cols[i * 4 + 3] = 1 } m.setVerticesData(VertexBuffer.ColorKind, cols) }
  function make(id, name, suitId) {
    const sc = scene(), suit = SUITS[suitId] || SUITS.berty
    const root = new TransformNode('hp-' + id, sc)
    const mat = new StandardMaterial('hpm-' + id, sc)
    mat.diffuseColor = new Color3(1, 1, 1); mat.specularColor = new Color3(0.04, 0.04, 0.04); mat.emissiveColor = new Color3(0.1, 0.28, 0.26)
    // the same parts and sizes as Berty (main.js), feet at y = -0.9 so root sits at the body centre like the player
    const parts = {
      shoe: part(sc, 'hp-shoe', 0.5, 0.03, 0.5, 0, -0.88, 0, suit.shoe, mat),
      legL: part(sc, 'hp-legl', 0.2, 0.18, 0.26, -0.11, -0.74, 0, suit.pant, mat),
      legR: part(sc, 'hp-legr', 0.2, 0.18, 0.26, 0.11, -0.74, 0, suit.pant, mat),
      shirt: part(sc, 'hp-shirt', 0.38, 0.58, 0.24, 0, -0.3, 0, suit.shirt, mat),
      head: part(sc, 'hp-head', 0.32, 0.3, 0.3, 0, 0.26, 0, suit.head, mat),
      visor: part(sc, 'hp-visor', 0.24, 0.08, 0.05, 0, 0.28, 0.16, suit.visor, mat),
      armL: part(sc, 'hp-arml', 0.12, 0.42, 0.12, -0.28, 0.02, 0, suit.shirt, mat),
      armR: part(sc, 'hp-armr', 0.12, 0.42, 0.12, 0.28, 0.02, 0, suit.shirt, mat),
    }
    parts.armL.setPivotPoint(new Vector3(0, 0.21, 0)); parts.armR.setPivotPoint(new Vector3(0, 0.21, 0))
    parts.legL.setPivotPoint(new Vector3(0, 0.09, 0)); parts.legR.setPivotPoint(new Vector3(0, 0.09, 0))
    for (const m of Object.values(parts)) { m.parent = root; addMesh(m) }
    // the name tag: a billboard above the head
    const tex = new DynamicTexture('hpt-' + id, { width: W, height: H }, sc, false, Texture.TRILINEAR_SAMPLINGMODE)
    tex.hasAlpha = true
    const tmat = new StandardMaterial('hptm-' + id, sc)
    tmat.diffuseTexture = tex; tmat.emissiveTexture = tex; tmat.useAlphaFromDiffuseTexture = true; tmat.disableLighting = true; tmat.backFaceCulling = false
    const tag = CreatePlane('hptag-' + id, { width: 1.3, height: 0.33 }, sc)
    tag.material = tmat; tag.billboardMode = Mesh.BILLBOARDMODE_ALL; tag.isPickable = false; tag.position.set(0, 0.75, 0); tag.parent = root
    addMesh(tag)
    paintTag(tex.getContext(), name); tex.update()
    return { root, parts, tag, tex, mats: [mat, tmat], name, suit: suitId, pos: null, last: null, speed: 0 }
  }
  function drop(id) { const a = shown.get(id); if (!a) return; try { for (const m of Object.values(a.parts)) m.dispose(); a.tag.dispose(); a.tex.dispose(); for (const m of a.mats) m.dispose(); a.root.dispose() } catch (e) {} shown.delete(id) }
  function resuit(a, suitId) {
    const suit = SUITS[suitId] || SUITS.berty; a.suit = suitId
    tint(a.parts.shoe, suit.shoe); tint(a.parts.legL, suit.pant); tint(a.parts.legR, suit.pant); tint(a.parts.shirt, suit.shirt); tint(a.parts.head, suit.head); tint(a.parts.visor, suit.visor); tint(a.parts.armL, suit.shirt); tint(a.parts.armR, suit.shirt)
  }
  const api = {
    // players: [{ id, name, x, y, z, r, f }] (feet position), every frame
    step(players, dtMs) {
      const seen = new Set(), t = (typeof performance !== 'undefined' ? performance.now() : Date.now()), me = myPos ? myPos() : null
      for (const p of players) {
        seen.add(p.id)
        const fl = unpackFlags(p.f)
        let a = shown.get(p.id)
        if (!a) { a = make(p.id, p.name, fl.suit); shown.set(p.id, a) }
        if (a.name !== p.name && p.name) { a.name = p.name; paintTag(a.tex.getContext(), p.name); a.tex.update() }
        if (a.suit !== fl.suit) resuit(a, fl.suit)
        const before = a.pos
        a.pos = ease(a.pos, p, dtMs)
        // speed from how far the eased figure moved this frame (smoothed), so the arms swing only while it walks
        const moved = before ? Math.hypot(a.pos.x - before.x, a.pos.z - before.z) : 0
        const inst = dtMs > 0 ? moved / (dtMs / 1000) : 0
        a.speed += (inst - a.speed) * Math.min(1, dtMs / 200)
        const po = pose(a.speed, fl.flying, t + (p.id.length ? p.id.charCodeAt(0) * 37 : 0))
        const l = toLocal([a.pos.x, a.pos.y + 0.9 + po.bob, a.pos.z])
        a.root.position.set(l[0], l[1], l[2])
        a.root.rotation.y = a.pos.r
        a.parts.armL.rotation.x = po.armsUp ? -2.6 : po.swing
        a.parts.armR.rotation.x = po.armsUp ? -2.6 : -po.swing
        a.parts.legL.rotation.x = po.armsUp ? 0.3 : -po.swing * 0.8
        a.parts.legR.rotation.x = po.armsUp ? 0.3 : po.swing * 0.8
        // the tag fades with distance (readable up close, no clutter across the map)
        if (me) { const d = Math.hypot(a.pos.x - me[0], a.pos.z - me[2]); a.tag.visibility = d > NAME_FADE ? 0 : d > NAME_FADE * 0.6 ? 1 - (d - NAME_FADE * 0.6) / (NAME_FADE * 0.4) : 1 }
      }
      for (const id of [...shown.keys()]) if (!seen.has(id)) drop(id)
    },
    clear() { for (const id of [...shown.keys()]) drop(id) },
    get count() { return shown.size },
    // the checks look at this (debug=1 only): name, suit, heading, pose, tag visibility of each figure
    peek() { return [...shown.entries()].map(([id, a]) => ({ id, name: a.name, suit: a.suit, r: a.root.rotation.y, parts: Object.keys(a.parts).length, armL: a.parts.armL.rotation.x, speed: a.speed, tag: a.tag.visibility, at: a.pos })) },
  }
  try { if (typeof location !== 'undefined' && /[?&]debug=1(&|$)/.test(location.search)) window.__btAvatars = api } catch (e) {}
  return api
}
