// One picture per block. A few items draw their own face so they don't share one wood tile.
import { getWrap, getBlockWrap } from "./gfx/pixel-art.js";
import { ITEMS } from './data/items.js'
import SHEET from '../assets/packs/sheet.json'
const PNG = { glass: 'assets/glass.png', coreplate: 'assets/tile-coreplate.png', workbench: 'assets/tile-workbench.png', oven: 'assets/tile-oven.png', vend: 'assets/tile-vend.png', store: 'assets/tile-store.png', bunk: 'assets/tile-bunk.png' }
const READ2D = { willReadFrequently: true }
function glyph(paint) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  const g = c.getContext('2d', READ2D)
  g.lineJoin = 'round'
  g.lineCap = 'round'
  paint(g)
  return c
}
function boxPath(g, x, y, w, h, r) {
  g.beginPath()
  g.moveTo(x + r, y)
  g.arcTo(x + w, y, x + w, y + h, r)
  g.arcTo(x + w, y + h, x, y + h, r)
  g.arcTo(x, y + h, x, y, r)
  g.arcTo(x, y, x + w, y, r)
  g.closePath()
}
function paintCrop(g, stage) {
  const greens = ['#9BE86A', '#3CB043', '#146B18']
  const gold = stage === 3
  g.strokeStyle = gold ? '#e6b422' : greens[stage]
  g.lineWidth = 4
  g.beginPath()
  const top = 40 - (16 + stage * 6)
  g.moveTo(24, 42)
  g.lineTo(24, top)
  if (stage >= 1) { g.moveTo(24, 32); g.lineTo(14, 24) }
  if (stage >= 2) { g.moveTo(24, 28); g.lineTo(34, 18) }
  g.stroke()
  if (stage >= 2) {
    g.fillStyle = gold ? '#f6c453' : '#146B18'
    g.beginPath()
    g.ellipse(24, top, 6, 4, 0, 0, Math.PI * 2)
    g.fill()
  }
  if (gold) {
    g.fillStyle = '#fff4b0'
    g.fillRect(34, 8, 4, 4)
  }
}
function paintBush(g, stage) {
  g.fillStyle = '#8B5A2B'
  g.beginPath()
  g.ellipse(24, 40, 11, 4.5, 0, 0, Math.PI * 2)
  g.fill()
  const greens = ['#86efac', '#22c55e', '#15803d', '#166534']
  const radius = [7, 10, 14, 14][stage]
  const cy = [30, 26, 22, 21][stage]
  g.fillStyle = greens[stage]
  g.beginPath()
  g.arc(24, cy, radius, 0, Math.PI * 2)
  g.fill()
  if (stage >= 1) {
    g.beginPath()
    g.arc(13, cy + 2, radius * 0.5, 0, Math.PI * 2)
    g.arc(35, cy + 1, radius * 0.48, 0, Math.PI * 2)
    g.fill()
  }
  if (stage === 3) {
    g.fillStyle = '#ef4444'
    g.beginPath(); g.arc(17, 18, 3.2, 0, Math.PI * 2); g.fill()
    g.beginPath(); g.arc(29, 16, 3.2, 0, Math.PI * 2); g.fill()
    g.beginPath(); g.arc(23, 26, 2.8, 0, Math.PI * 2); g.fill()
    g.fillStyle = '#fde68a'
    g.fillRect(34, 8, 4, 4)
  }
}
function tile(g, fill, draw) {
  g.fillStyle = fill
  boxPath(g, 8, 8, 32, 32, 5)
  g.fill()
  g.strokeStyle = 'rgba(20,16,12,.45)'
  g.lineWidth = 2
  g.stroke()
  if (draw) draw(g)
}
function asArt(name, painter) {
  const c = glyph(painter)
  c.dataset.wrap = name
  c.dataset.kind = 'wrap'
  return c
}
export const WAND_TIP = {
  select: '#22d3ee',
  fill: '#ff8a1f',
  walls: '#e6b422',
  copy: '#e6f6ff',
  paste: '#2dd4bf',
}
export function paintWand(g, mode) {
  const tip = WAND_TIP[mode] || WAND_TIP.select
  g.fillStyle = '#0a1428'
  g.fillRect(20, 16, 8, 28)
  g.fillStyle = '#2dd4bf'
  g.fillRect(22, 18, 4, 22)
  g.fillStyle = tip
  g.fillRect(16, 4, 16, 14)
  g.fillStyle = '#e6f6ff'
  g.fillRect(20, 8, 8, 6)
}
export function wandCanvas(mode) {
  const c = glyph((g) => paintWand(g, mode))
  c.dataset.item = 'buildWand'
  c.dataset.kind = 'wrap'
  c.dataset.wrap = 'buildWand'
  return c
}
const FACE = {
  buildWand(g) { paintWand(g, 'select') },
  log(g) {
    // Side bark + light round end ring. Distinct from planks at 32px.
    g.fillStyle = '#5C3317'
    g.fillRect(6, 14, 28, 20)
    g.strokeStyle = '#3A2415'
    g.lineWidth = 2
    g.strokeRect(6, 14, 28, 20)
    // bark lines
    g.strokeStyle = '#3A2415'
    g.lineWidth = 1.5
    g.beginPath()
    g.moveTo(10, 16); g.lineTo(10, 32)
    g.moveTo(16, 16); g.lineTo(16, 32)
    g.moveTo(22, 16); g.lineTo(22, 32)
    g.moveTo(28, 16); g.lineTo(28, 32)
    g.stroke()
    // light end ring
    g.fillStyle = '#E8C27A'
    g.beginPath(); g.arc(34, 24, 9, 0, Math.PI * 2); g.fill()
    g.strokeStyle = '#C9954C'
    g.lineWidth = 2
    g.beginPath(); g.arc(34, 24, 9, 0, Math.PI * 2); g.stroke()
    g.strokeStyle = '#A67C4E'
    g.lineWidth = 1.5
    g.beginPath(); g.arc(34, 24, 5, 0, Math.PI * 2); g.stroke()
  },
  planks(g) {
    // 3 flat stacked boards with dark gaps. Distinct from log at 32px.
    const boards = [
      [6, '#E8C27A'],
      [20, '#D4A85A'],
      [34, '#E0B56A'],
    ]
    boards.forEach(([y, fill]) => {
      g.fillStyle = '#3A2415'
      g.fillRect(4, y - 2, 40, 12)
      g.fillStyle = fill
      g.fillRect(5, y, 38, 8)
      g.strokeStyle = '#5C3317'
      g.lineWidth = 1
      g.strokeRect(5, y, 38, 8)
    })
  },

  berry(g) {
    // Cluster of 3 round berries. Distinct from sapling at 32px.
    const berries = [[18, 26, 8], [30, 26, 8], [24, 16, 7]]
    berries.forEach(([x, y, r]) => {
      g.fillStyle = '#c026d3'
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill()
      g.fillStyle = '#a21caf'
      g.beginPath(); g.arc(x - 2, y - 2, r * 0.35, 0, Math.PI * 2); g.fill()
    })
    // small stem
    g.strokeStyle = '#166534'
    g.lineWidth = 2
    g.beginPath(); g.moveTo(24, 12); g.lineTo(24, 8); g.stroke()
  },
  stick(g) {
    // One thin diagonal. Distinct from planks and log at 32px.
    g.strokeStyle = '#C4A574'
    g.lineWidth = 4
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(12, 36)
    g.lineTo(36, 12)
    g.stroke()
    g.strokeStyle = '#8B5A2B'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(14, 34)
    g.lineTo(34, 14)
    g.stroke()
  },
  workbench(g) {
    g.fillStyle = '#8A5A32'
    g.fillRect(6, 36, 7, 10)
    g.fillRect(35, 36, 7, 10)
    g.fillStyle = '#E8C27A'
    boxPath(g, 3, 6, 42, 30, 3)
    g.fill()
    g.strokeStyle = '#5C3317'
    g.lineWidth = 2.5
    g.stroke()
    g.strokeStyle = '#5C3317'
    g.lineWidth = 1.6
    g.beginPath()
    g.moveTo(17, 8); g.lineTo(17, 34)
    g.moveTo(31, 8); g.lineTo(31, 34)
    g.moveTo(5, 16); g.lineTo(43, 16)
    g.moveTo(5, 26); g.lineTo(43, 26)
    g.stroke()
    g.strokeStyle = '#C5CCD1'
    g.lineWidth = 2.4
    g.beginPath(); g.moveTo(8, 12); g.lineTo(18, 12); g.stroke()
    g.fillStyle = '#9AA3AA'
    for (let i = 0; i < 5; i++) g.fillRect(8 + i * 2, 13, 1.4, 2)
    g.fillStyle = '#6B3A1F'
    g.fillRect(16, 10, 5, 4)
    g.fillStyle = '#B7BFC6'
    g.fillRect(28, 28, 12, 4)
    g.fillStyle = '#6B3A1F'
    g.fillRect(32, 22, 3, 10)
  },
  wheat(g) {
    g.strokeStyle = '#3D8C32'
    g.lineWidth = 3
    g.beginPath(); g.moveTo(10, 40); g.lineTo(38, 10); g.stroke()
    g.beginPath(); g.moveTo(38, 40); g.lineTo(10, 10); g.stroke()
    g.fillStyle = '#E6B422'
    g.beginPath(); g.ellipse(38, 10, 6, 4, 0.4, 0, Math.PI * 2); g.fill()
    g.beginPath(); g.ellipse(10, 10, 6, 4, -0.4, 0, Math.PI * 2); g.fill()
  },
  door(g) {
    g.fillStyle = '#C9893E'
    boxPath(g, 12, 2, 24, 44, 3)
    g.fill()
    g.strokeStyle = '#3A2415'
    g.lineWidth = 2.5
    g.stroke()
    g.fillStyle = '#E6C27A'
    boxPath(g, 16, 6, 16, 18, 2)
    g.fill()
    g.fillStyle = '#F4F7F8'
    g.beginPath(); g.arc(30, 28, 2.4, 0, Math.PI * 2); g.fill()
  },
  box(g) {
    g.fillStyle = '#A56B32'
    boxPath(g, 4, 16, 40, 26, 3)
    g.fill()
    g.strokeStyle = '#3A2415'
    g.lineWidth = 2.5
    g.stroke()
    g.fillStyle = '#D7A45A'
    g.beginPath()
    g.moveTo(4, 18); g.lineTo(24, 6); g.lineTo(44, 18); g.closePath()
    g.fill()
    g.stroke()
    g.fillStyle = '#F6C453'
    boxPath(g, 20, 20, 8, 8, 1.5)
    g.fill()
    g.strokeStyle = '#3A2415'
    g.lineWidth = 1.5
    g.stroke()
  },
  oven(g) {
    g.fillStyle = '#5A6874'
    g.fillRect(2, 2, 44, 44)
    g.fillStyle = '#9AA6B0'
    g.fillRect(4, 4, 18, 16)
    g.fillRect(26, 4, 18, 16)
    g.fillRect(4, 28, 18, 16)
    g.fillRect(26, 28, 18, 16)
    g.fillStyle = '#12161C'
    g.fillRect(10, 10, 28, 20)
    g.fillStyle = '#FFB030'
    g.fillRect(14, 14, 20, 10)
    g.fillStyle = '#FF6A10'
    g.fillRect(18, 16, 12, 6)
  },
  doorGlass(g) {
    g.fillStyle = '#13303A'
    boxPath(g, 12, 2, 24, 44, 3)
    g.fill()
    g.strokeStyle = '#E6EEF2'
    g.lineWidth = 2.5
    g.stroke()
    g.fillStyle = '#7EE7F5'
    boxPath(g, 16, 6, 16, 22, 2)
    g.fill()
    g.strokeStyle = '#22D3EE'
    g.lineWidth = 1.5
    g.stroke()
    g.fillStyle = '#F4F7F8'
    g.beginPath(); g.arc(30, 34, 2.2, 0, Math.PI * 2); g.fill()
  },
  glass(g) {
    g.fillStyle = 'rgba(214, 240, 255, 0.88)'
    g.fillRect(6, 6, 36, 36)
    g.strokeStyle = '#F7FCFF'
    g.lineWidth = 3
    g.strokeRect(7, 7, 34, 34)
    g.strokeStyle = '#FFFFFF'
    g.lineWidth = 2
    g.beginPath()
    g.moveTo(12, 16); g.lineTo(22, 10)
    g.moveTo(14, 30); g.lineTo(28, 18)
    g.stroke()
  },
  leaves(g) {
    g.fillStyle = '#1F6B28'
    g.fillRect(4, 4, 40, 40)
    const blobs = [[14, 14, '#3FAE46'], [30, 12, '#57C45A'], [22, 24, '#2F8F38'], [34, 26, '#3FAE46'], [14, 32, '#57C45A'], [28, 34, '#1B5E24']]
    blobs.forEach(([x, y, fill]) => {
      g.fillStyle = fill
      g.beginPath()
      g.arc(x, y, 8, 0, Math.PI * 2)
      g.fill()
    })
    g.strokeStyle = '#14521C'
    g.lineWidth = 2
    g.strokeRect(4, 4, 40, 40)
  },
  sapling(g) {
    // Stem + 2 leaves. Distinct silhouette at 32px.
    g.strokeStyle = '#5C3317'
    g.lineWidth = 4
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(24, 40)
    g.lineTo(24, 18)
    g.stroke()
    // left leaf
    g.fillStyle = '#3FAE46'
    g.beginPath()
    g.ellipse(14, 16, 10, 6, -0.8, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#2F8F38'
    g.lineWidth = 1.5
    g.stroke()
    // right leaf (slightly higher)
    g.fillStyle = '#57C45A'
    g.beginPath()
    g.ellipse(34, 14, 9, 5, 0.7, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#3FAE46'
    g.stroke()
  },
  farmland(g) {
    g.fillStyle = '#8d5a2b'
    g.fillRect(4, 4, 40, 40)
    g.strokeStyle = '#3f2412'
    g.lineWidth = 3
    g.beginPath()
    for (let y = 12; y <= 40; y += 8) { g.moveTo(6, y); g.lineTo(42, y) }
    g.stroke()
  },
  farmlandWet(g) {
    g.fillStyle = '#5a3516'
    g.fillRect(4, 4, 40, 40)
    g.strokeStyle = '#2a160c'
    g.lineWidth = 3
    g.beginPath()
    for (let y = 12; y <= 40; y += 8) { g.moveTo(6, y); g.lineTo(42, y) }
    g.stroke()
    g.fillStyle = '#3b82f6'
    g.beginPath()
    g.arc(36, 12, 4, 0, Math.PI * 2)
    g.fill()
  },
  water(g) {
    g.fillStyle = '#3b82f6'
    g.globalAlpha = 0.85
    g.fillRect(4, 4, 40, 40)
    g.globalAlpha = 1
    g.fillStyle = '#dbeafe'
    g.fillRect(12, 12, 8, 6)
  },
  cropSprout(g) { paintCrop(g, 0) },
  cropLeafy(g) { paintCrop(g, 1) },
  cropTall(g) { paintCrop(g, 2) },
  cropRipe(g) { paintCrop(g, 3) },
  bushYoung(g) { paintBush(g, 0) },
  bushLeaf(g) { paintBush(g, 1) },
  bushFull(g) { paintBush(g, 2) },
  bushFruit(g) { paintBush(g, 3) },
  tuft(g) {
    g.strokeStyle = '#3D8C32'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(16, 42); g.lineTo(12, 8)
    g.moveTo(24, 42); g.lineTo(24, 6)
    g.moveTo(32, 42); g.lineTo(36, 10)
    g.stroke()
  },
  woodshop(g) {
    g.fillStyle = '#6B3A1F'
    g.fillRect(6, 30, 6, 14)
    g.fillRect(36, 30, 6, 14)
    g.fillStyle = '#E8C27A'
    g.fillRect(3, 16, 42, 16)
    g.strokeStyle = '#3A2415'
    g.lineWidth = 2
    g.strokeRect(3, 16, 42, 16)
    g.fillStyle = '#9AA3AA'
    g.fillRect(8, 20, 14, 4)
    g.fillStyle = '#C5CCD1'
    g.fillRect(26, 19, 14, 3)
    g.fillStyle = '#8A5A32'
    g.fillRect(30, 22, 3, 8)
  },
  woodshopSide(g) {
    FACE.woodshop(g)
  },
  grass(g) { tile(g, '#3FAE46', (c) => { c.fillStyle = '#8d5a2b'; c.fillRect(10, 30, 28, 8) }) },
  dirt(g) { tile(g, '#8d5a2b', (c) => { c.fillStyle = '#5a3516'; c.fillRect(14, 16, 6, 4); c.fillRect(26, 24, 5, 3) }) },
  stone(g) { tile(g, '#8a8f98', (c) => { c.fillStyle = '#5c636c'; c.fillRect(14, 16, 8, 6); c.fillRect(24, 24, 7, 5) }) },
  slate(g) { tile(g, '#5c6770', (c) => { c.strokeStyle = '#2e363c'; c.lineWidth = 2; c.strokeRect(14, 16, 18, 8); c.strokeRect(16, 26, 14, 6) }) },
  coal(g) { tile(g, '#2a2e33', (c) => { c.fillStyle = '#111418'; c.fillRect(14, 16, 5, 5); c.fillRect(24, 22, 6, 5); c.fillStyle = '#6b7280'; c.fillRect(18, 28, 4, 3) }) },
  sand(g) { tile(g, '#e6d3a1', (c) => { c.fillStyle = '#c4b07a'; c.fillRect(14, 18, 4, 3); c.fillRect(24, 24, 5, 3); c.fillRect(18, 28, 3, 2) }) },
  gravel(g) { tile(g, '#9aa3aa', (c) => { c.fillStyle = '#6b7280'; c.fillRect(13, 15, 6, 5); c.fillRect(23, 20, 7, 6); c.fillRect(16, 27, 5, 4) }) },
  brickRed(g) { tile(g, '#b84a3a', (c) => { c.strokeStyle = '#f3e6d8'; c.lineWidth = 2; c.strokeRect(12, 14, 10, 6); c.strokeRect(24, 14, 10, 6); c.strokeRect(16, 22, 12, 6); c.strokeRect(12, 30, 22, 6) }) },
  brickGrey(g) { tile(g, '#8d939a', (c) => { c.strokeStyle = '#e6eef2'; c.lineWidth = 2; c.strokeRect(12, 14, 10, 6); c.strokeRect(24, 14, 10, 6); c.strokeRect(16, 22, 12, 6) }) },
  woolBlue(g) { tile(g, '#3b6fd6') },
  woolGreen(g) { tile(g, '#2f9e4f') },
  woolRed(g) { tile(g, '#c43b3b') },
  woolTan(g) { tile(g, '#c4a36a') },
  snow(g) { tile(g, '#f4f7fb', (c) => { c.fillStyle = '#dbe7f5'; c.fillRect(14, 18, 6, 4); c.fillRect(24, 26, 7, 4) }) },
  ice(g) { tile(g, '#c5e8f7', (c) => { c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(14, 28); c.lineTo(22, 16); c.lineTo(32, 26); c.stroke() }) },
  redSand(g) { tile(g, '#c47a4a', (c) => { c.fillStyle = '#8d4e2c'; c.fillRect(14, 18, 4, 3); c.fillRect(24, 24, 5, 3) }) },
  coreplate(g) {
    tile(g, '#1c3a44', (c) => {
      c.strokeStyle = '#7ee7f0'; c.lineWidth = 2; c.strokeRect(16, 16, 16, 16)
      c.fillStyle = '#22d3ee'; c.fillRect(22, 22, 4, 4)
    })
  },
  vend(g) {
    tile(g, '#145e56', (c) => {
      c.fillStyle = '#e6f6ff'; c.fillRect(14, 16, 20, 12)
      c.fillStyle = '#ff8a1f'; c.fillRect(20, 30, 8, 4)
    })
  },
  storeCounter(g) {
    tile(g, '#c4a574', (c) => {
      c.fillStyle = '#5c3317'; c.fillRect(12, 28, 24, 6)
      c.fillStyle = '#f6c453'; c.fillRect(18, 16, 12, 8)
    })
  },
  bunk(g) {
    tile(g, '#6b3e26', (c) => {
      c.fillStyle = '#d64545'; c.fillRect(12, 18, 24, 8)
      c.fillStyle = '#f0c9a0'; c.fillRect(14, 14, 8, 6)
    })
  },
  chair(g) {
    g.fillStyle = '#5c3317'
    g.fillRect(8, 30, 6, 14)
    g.fillRect(34, 30, 6, 14)
    g.fillStyle = '#1aa6b8'
    g.fillRect(6, 24, 36, 8)
    g.fillStyle = '#8B5A2B'
    g.fillRect(6, 6, 8, 26)
  },
  sewing(g) {
    g.fillStyle = '#6B3A1F'
    g.fillRect(4, 28, 40, 8)
    g.fillStyle = '#c5ccd1'
    g.fillRect(28, 8, 6, 22)
    g.fillStyle = '#d64545'
    g.fillRect(8, 24, 16, 6)
    g.fillStyle = '#e6eef2'
    g.fillRect(30, 18, 2, 8)
  },
  conveyor(g) {
    g.fillStyle = '#10283A'
    g.fillRect(4, 16, 40, 16)
    g.fillStyle = '#1F8A8A'
    g.fillRect(6, 22, 28, 4)
    g.fillStyle = '#22D3EE'
    g.beginPath()
    g.moveTo(30, 16)
    g.lineTo(42, 24)
    g.lineTo(30, 32)
    g.closePath()
    g.fill()
  },
}
FACE.doorOpen = FACE.door
FACE.doorGlassOpen = FACE.doorGlass
const BLOCK_ALIAS = { leverOn: 'lever', pushButtonOn: 'pushButton', reed: 'leaves', woodshopSide: 'woodshop' }
// World cubes whose icon tile is atlas 0–20. Plants, tools, and shaped blocks keep their own pictures.
const WORLD_CUBE = {
  grass: 1, dirt: 1, stone: 1, slate: 1, coal: 1, sand: 1, gravel: 1,
  brickRed: 1, brickGrey: 1, planks: 1, log: 1, leaves: 1,
  woolBlue: 1, woolGreen: 1, woolRed: 1, woolTan: 1,
  snow: 1, ice: 1, redSand: 1,
}
function iconTex(block) {
  if (!block) return ''
  return block[4] || (Array.isArray(block[2]) ? block[2][2] : block[2]) || ''
}
function atlasSlot(tex, atlas) {
  if (!atlas || typeof tex !== 'string' || !Object.prototype.hasOwnProperty.call(atlas, tex)) return -1
  const i = atlas[tex]
  if (typeof i !== 'number' || i < 0 || i > 20) return -1
  return i
}
function calmFrame(ctx) {
  const m = (ctx.canvas.width || 48) / 48
  ctx.imageSmoothingEnabled = false
  ctx.strokeStyle = 'rgba(0,0,0,.35)'
  ctx.lineWidth = Math.max(1, m)
  ctx.strokeRect(8.5 * m, 8.5 * m, 31 * m, 31 * m)
  ctx.fillStyle = 'rgba(0,0,0,.35)'
  ctx.fillRect(8 * m, 38 * m, 32 * m, 2 * m)
}
function drawTile(c, img, sx, sy, sw, sh) {
  const ctx = c.getContext('2d', READ2D)
  const side = c.width || 48
  const m = side / 48
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, side, side)
  ctx.drawImage(img, sx, sy, sw, sh, 8 * m, 8 * m, 32 * m, 32 * m)
  calmFrame(ctx)
}
function atlasCanvas(block, tex, index) {
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 48
  c.dataset.block = String(block[0])
  c.dataset.kind = 'atlas'
  c.dataset.tex = tex
  const img = new Image()
  img.src = 'assets/atlas.png'
  const paint = () => drawTile(c, img, 2, index * 36 + 2, 32, 32)
  if (img.complete && img.naturalWidth) paint()
  else img.onload = paint
  return c
}
function knownPackMat(name) {
  if (!name) return false
  if (SHEET.order.indexOf(name) >= 0) return true
  return Object.prototype.hasOwnProperty.call(SHEET.alias, name)
}
function packMat(block) {
  if (!block) return ''
  const mat = block[2]
  if (typeof mat === 'string' && knownPackMat(mat)) return mat
  if (Array.isArray(mat)) {
    const top = mat.length === 6 ? mat[2] : mat[0]
    if (top && knownPackMat(top)) return top
  }
  const tex = iconTex(block)
  if (tex && knownPackMat(tex)) return tex
  return ''
}
function drawPackIcon(c) {
  const sheet = globalThis.__bertSheet
  const mat = c.dataset.packMat
  if (!sheet || !sheet.img || !mat || sheet.byMat[mat] == null) return
  const ix = sheet.byMat[mat]
  const core = sheet.core || 32
  const layer = sheet.layer || (core + 4)
  if (!sheet.img.naturalWidth) return
  drawTile(c, sheet.img, 2, ix * layer + 2, core, core)
}
if (typeof window !== 'undefined' && !globalThis.__bertIconHook) {
  globalThis.__bertIconHook = 1
  window.addEventListener('bertopia-pack', () => {
    document.querySelectorAll('canvas[data-pack-mat]').forEach((node) => drawPackIcon(node))
  })
}
export function blockIcon(block, atlas) {
  const name = block && block[1];
  const alias = BLOCK_ALIAS[name] || name
  const matName = packMat(block)
  if (matName) {
    const c = document.createElement('canvas')
    c.width = 48
    c.height = 48
    c.dataset.block = String(block[0])
    c.dataset.kind = 'pack'
    c.dataset.packMat = matName
    c.dataset.tex = matName
    drawPackIcon(c)
    return c
  }
  if (alias === 'workbench' || alias === 'woodshop') {
    const img = document.createElement('img')
    img.src = 'assets/tile-workbench.png'
    img.alt = ''
    img.className = 'kd-ico bench-png'
    img.dataset.kind = 'png'
    img.dataset.block = String(block[0])
    return img
  }
  const wrap = alias && getBlockWrap(alias);
  if (wrap) {
    wrap.dataset.block = String(block[0]);
    wrap.dataset.kind = 'wrap'
    if (!wrap.dataset.wrap) wrap.dataset.wrap = alias
    return wrap;
  }
  const tex = iconTex(block)
  const ix = atlasSlot(tex, atlas)
  if (ix >= 0 && (WORLD_CUBE[name] || WORLD_CUBE[alias])) return atlasCanvas(block, tex, ix)
  const painter = FACE[name] || FACE[alias]
  if (painter) {
    const c = asArt(alias || name, painter)
    c.dataset.block = String(block[0])
    return c
  }
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 48
  c.dataset.block = String(block[0])
  const img = new Image()
  img.src = PNG[tex] || 'assets/atlas.png'
  const paint = () => {
    if (PNG[tex]) drawTile(c, img, 0, 0, img.naturalWidth || 32, img.naturalHeight || 32)
    else if (atlas && atlas[tex] != null) drawTile(c, img, 2, (atlas[tex] || 0) * 36 + 2, 32, 32)
    else calmFrame(c.getContext('2d', READ2D))
  }
  if (img.complete && img.naturalWidth) paint()
  else img.onload = paint
  return c
}
const FOOD = {
  berry: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="14" r="6" fill="#c026d3"/><circle cx="12" cy="7" r="2" fill="#166534"/></svg>',
  flour: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="10" height="13" rx="2" fill="#f5f0e6" stroke="#d6d3d1"/></svg>',
  sugar: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="14" r="2" fill="#fff"/><circle cx="13" cy="11" r="2" fill="#fff"/><circle cx="16" cy="15" r="2" fill="#fff"/></svg>',
  cupcake: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 13h10l-1 7H8z" fill="#f6c453"/><circle cx="12" cy="10" r="5" fill="#f472b6"/></svg>',
  bread: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="14" rx="8" ry="5" fill="#e8b86d"/></svg>',
  woodTool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20 L13 8" fill="none" stroke="#C4A574" stroke-width="3" stroke-linecap="round"/><path d="M9 9c2-5 8-7 11-4-3 1-5 4-5 7-2 0-4-1-6-3z" fill="#8B5A2B" stroke="#3A2415" stroke-width="1"/></svg>',
  stoneTool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 V9" fill="none" stroke="#78716c" stroke-width="3" stroke-linecap="round"/><path d="M3 10 L12 3 L21 10 L12 8 Z" fill="#57534e" stroke="#1c1917" stroke-width="1.2"/></svg>',
  hoe: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 21 V10" fill="none" stroke="#C4A574" stroke-width="2.6" stroke-linecap="round"/><path d="M4 7 H19 V11 H4 Z" fill="#6b7280" stroke="#1c1917" stroke-width="1.3"/></svg>',
  wheatSeeds: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21 C12 14 9 12 8 6" fill="none" stroke="#3D8C32" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="8" cy="16" rx="2.2" ry="1.3" fill="#d6b483"/><ellipse cx="13" cy="15" rx="2.2" ry="1.3" fill="#c4a36a"/><ellipse cx="11" cy="18.5" rx="2" ry="1.2" fill="#e6c99a"/><ellipse cx="16" cy="18" rx="1.8" ry="1.1" fill="#b08958"/></svg>',
  bushSprout: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="19" rx="4" ry="2.2" fill="#8B5A2B"/><path d="M12 18 V9" stroke="#166534" stroke-width="1.8" fill="none" stroke-linecap="round"/><ellipse cx="8.2" cy="11.2" rx="3.2" ry="1.8" fill="#22c55e" transform="rotate(-28 8.2 11.2)"/><ellipse cx="15.8" cy="9.6" rx="3.2" ry="1.8" fill="#4ade80" transform="rotate(26 15.8 9.6)"/></svg>',
  safetyGlasses: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="2" y="18" width="6" height="4" fill="#1c3a44"/><rect x="40" y="18" width="6" height="4" fill="#1c3a44"/><rect x="8" y="14" width="14" height="12" fill="#9bd4e8" stroke="#1c3a44" stroke-width="2"/><rect x="26" y="14" width="14" height="12" fill="#9bd4e8" stroke="#1c3a44" stroke-width="2"/><rect x="20" y="18" width="8" height="3" fill="#1c3a44"/></svg>',
  measuringTape: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="12" width="22" height="24" fill="#e6b422" stroke="#5c3b09" stroke-width="2"/><rect x="24" y="20" width="18" height="6" fill="#c5ccd1" stroke="#3a4450" stroke-width="2"/><rect x="28" y="20" width="2" height="6" fill="#3a4450"/><rect x="34" y="20" width="2" height="6" fill="#3a4450"/><rect x="12" y="18" width="8" height="8" fill="#5c3b09"/></svg>',
  handSaw: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="16" width="28" height="8" fill="#c5ccd1" stroke="#3a4450" stroke-width="2"/><rect x="8" y="24" width="3" height="4" fill="#3a4450"/><rect x="14" y="24" width="3" height="4" fill="#3a4450"/><rect x="20" y="24" width="3" height="4" fill="#3a4450"/><rect x="26" y="18" width="16" height="10" fill="#8a5a32" stroke="#3a2415" stroke-width="2"/></svg>',
  hammer: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="8" y="8" width="22" height="10" fill="#6b7280" stroke="#1c1917" stroke-width="2"/><rect x="16" y="16" width="8" height="24" fill="#c9954c" stroke="#5c3317" stroke-width="2"/></svg>',
  bertyLie: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="4" y="28" width="40" height="10" fill="#c9954c" stroke="#5c3317" stroke-width="2"/><rect x="6" y="26" width="36" height="6" fill="#d64545"/><rect x="8" y="16" width="16" height="8" fill="#3ec6c6" stroke="#0b3a3a" stroke-width="2"/><rect x="24" y="12" width="10" height="10" fill="#f0c9a0" stroke="#5c3317" stroke-width="2"/></svg>',
  goldTrim: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="36" height="28" fill="none" stroke="#e6b15a" stroke-width="4"/><rect x="12" y="16" width="24" height="16" fill="#f6e3a8"/></svg>',
  floorLamp: '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 10 L38 10 L32 20 L16 20 Z" fill="#f6c453"/><rect x="22" y="20" width="4" height="16" fill="#8B5A2B"/><rect x="16" y="36" width="16" height="4" fill="#5C3317"/></svg>',
  wallLamp: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="14" width="6" height="16" fill="#6b7280"/><rect x="12" y="20" width="10" height="4" fill="#8B5A2B"/><path d="M22 12 L40 12 L36 22 L26 22 Z" fill="#f6c453"/></svg>',
  rug: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="12" width="36" height="6" fill="#dc2626"/><rect x="6" y="18" width="36" height="6" fill="#2563eb"/><rect x="6" y="24" width="36" height="6" fill="#dc2626"/><rect x="8" y="30" width="4" height="6" fill="#f8fafc"/><rect x="16" y="30" width="4" height="6" fill="#f8fafc"/><rect x="24" y="30" width="4" height="6" fill="#f8fafc"/><rect x="32" y="30" width="4" height="6" fill="#f8fafc"/></svg>',
  circuitLens: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="#7ee7f0" stroke="#0e7490" stroke-width="1.6"/><circle cx="12" cy="12" r="2" fill="#0891b2"/><path d="M5 12 H9 M15 12 H19 M12 5 V9 M12 15 V19" stroke="#0e7490" stroke-width="1.4"/></svg>',
}
export function itemSvg(svg) {
  if (!svg) return ''
  if (String(svg).includes('<svg')) return svg
  return FOOD[svg] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#f6c453"/></svg>'
}
export function shopIcon(name) {
  const svg = FOOD[name]
  if (!svg) return null
  const s = document.createElement('span')
  s.className = 'real-icon'
  s.dataset.kind = 'svg'
  s.dataset.item = name
  s.innerHTML = svg
  return s
}
export function dropperIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.2 3.3l6.5 6.5-1.4 1.4-1.1-1.1-6.7 6.7a3.2 3.2 0 0 1-4.5 0l-.6.6-1.5-1.5.6-.6a3.2 3.2 0 0 1 0-4.5l6.7-6.7-1.1-1.1z"/></svg>'
}
function letterTile(letter) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  c.className = 'letter-tile'
  c.dataset.letter = String(letter || '?').slice(0, 2)
  const g = c.getContext('2d', READ2D)
  g.fillStyle = '#3A4450'
  g.fillRect(6, 6, 36, 36)
  g.strokeStyle = '#C5D0D6'
  g.lineWidth = 2
  g.strokeRect(7, 7, 34, 34)
  g.fillStyle = '#E8EEF2'
  g.font = '700 16px sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(c.dataset.letter, 24, 25)
  return c
}
// Same picture the hotbar uses. A missing picture is a letter on a neutral tile, never a red square.
export function slotArt(key, blockNode) {
  if (key === 'workbench' || key === 'woodshop' || key === 'woodshopSide') {
    const img = document.createElement('img')
    img.src = 'assets/tile-workbench.png'
    img.alt = ''
    img.className = 'kd-ico bench-png'
    img.dataset.kind = 'png'
    img.dataset.item = key
    return img
  }
  // 2.5.471: hotbar and Bag use the same atlas tile as the world cube
  if (blockNode && WORLD_CUBE[key]) {
    if (blockNode.dataset) blockNode.dataset.item = key
    return blockNode
  }
  // 2.5.303: distinct pictures for wood items — FACE wins over wrap for these keys
  if (key === 'planks' || key === 'log' || key === 'berry' || key === 'sapling' || key === 'stick') {
    if (FACE[key]) {
      const c = asArt(key, FACE[key])
      c.dataset.item = key
      return c
    }
  }
  const wrap = key && getWrap(key);
  if (wrap) {
    wrap.dataset.item = key;
    wrap.dataset.kind = "wrap";
    if (!wrap.dataset.wrap) wrap.dataset.wrap = key
    return wrap;
  }
  if (key && FACE[key]) {
    const c = asArt(key, FACE[key])
    c.dataset.item = key
    return c
  }
  const item = key && ITEMS[key]
  if (item && item.svg) {
    const s = document.createElement('span')
    s.className = 'real-icon'
    s.dataset.item = key
    s.dataset.kind = 'svg'
    s.innerHTML = itemSvg(item.svg)
    return s
  }
  if (blockNode) return blockNode
  const letter = (item && item.letter) || (key ? String(key).slice(0, 1).toUpperCase() : 'box')
  return letterTile(letter === '?' ? 'box' : letter)
}

// 8×8 menu glyphs. One character, one palette colour. '.' is empty.
const MENU_PAL = {
  t: '#7ff5e3',
  d: '#2dd4bf',
  o: '#ffb36b',
  a: '#ff8a1f',
  w: '#e6f6ff',
  r: '#ff5a6a',
  b: '#c4a574',
  k: '#0a1428',
  n: '#16264a',
  c: '#cd7f32',
  u: '#8a4b16',
}
const MENU_GLYPH = {
  bag: ['..tt....', '.tttt...', 'tttttttt', 'twwwwwwt', 'twwwwwwt', 'twtttwwt', 'tttttttt', '........'],
  bench: ['bbbbbbbb', 'bwwwwwwb', 'bbbbbbbb', '..bb..bb', '..bb..bb', '..bb..bb', '........', '........'],
  book: ['ooooooo.', 'owwwwwwo', 'o......o', 'owwwwwwo', 'o......o', 'owwwwwwo', 'oooooooo', '........'],
  help: ['..ttt...', '.t...t..', '....t...', '...t....', '...t....', '........', '...t....', '........'],
  builds: ['..oooo..', '.oowwoo.', 'ooowwooo', 'wwwwwwww', '.dddddd.', '.dwwwwd.', '.dddddd.', '........'],
  globe: ['.tttttt.', 'twwtwwtt', 'ttwwttwt', 'tttttttt', 'twttwwtt', 'ttwwtwwt', '.tttttt.', '........'],
  flag: ['d.......', 'dttttt..', 'dooooat.', 'dooooat.', 'dttttt..', 'd.......', 'd.......', 'd.......'],
  floppy: ['ddddddd.', 'dwwwwwdd', 'dwwwwwdd', 'dddddddd', 'dwwwwwwd', 'dwddddwd', 'dwwwwwwd', 'dddddddd'],
  undo: ['..dddd..', 'd.....d.', 'd..dd...', 'd.......', '.d......', '..d.....', '...ddddd', '........'],
  redo: ['..dddd..', '.d.....d', '...dd..d', '.......d', '......d.', '.....d..', 'ddddd...', '........'],
  sliders: ['t....t..', 't.o..t.o', 't.o..t.o', 'ooooooo.', '..t..t.t', 'o.t..t.t', 'o.t.....', '........'],
  pick: ['.oooooo.', 'o.....o.', '.....o..', '....o...', '...b....', '..b.....', '.b......', 'b.......'],
  target: ['.rrrrrr.', 'r......r', 'r.oooo.r', 'r.o..o.r', 'r.oooo.r', 'r......r', '.rrrrrr.', '........'],
  shop: ['rorororo', 'rorororo', 'wwwwwwww', 'w......w', 'w..dd..w', 'w..dd..w', 'w......w', 'wwwwwwww'],
  coin: ['.oooooo.', 'owwwwwwo', 'owoaawwo', 'owwwwwwo', 'owoaawwo', 'owwwwwwo', '.oooooo.', '........'],
  cog: ['.t.cc.t.', 'cccccccc', 'c.uuuu.c', 'cc.tt.cc', 'cc.tt.cc', 'c.uuuu.c', 'cccccccc', '.t.cc.t.'],
  cogSilver: ['.t.ww.t.', 'wwwwwwww', 'w.nnnn.w', 'ww.tt.ww', 'ww.tt.ww', 'w.nnnn.w', 'wwwwwwww', '.t.ww.t.'],
  cogGold: ['.t.aa.t.', 'aaaaaaaa', 'a.oooo.a', 'aa.tt.aa', 'aa.tt.aa', 'a.oooo.a', 'aaaaaaaa', '.t.aa.t.'],
  gear: ['.t.tt.t.', 'tttttttt', 't.oooo.t', 'tto..ott', 'tto..ott', 't.oooo.t', 'tttttttt', '.t.tt.t.'],
  eye: ['........', '.tttttt.', 'twwwwwwt', 'twooowwt', 'twottowt', 'twwwwwwt', '.tttttt.', '........'],
  full: ['tt....tt', 't......t', '........', '........', '........', '........', 't......t', 'tt....tt'],
  scroll: ['oooooooo', 'otttttto', 'o......o', 'owwwwwwo', 'o......o', 'owwwwwwo', 'otttttto', 'oooooooo'],
  apple: ['...t.o..', '..tt....', '.rrrrrr.', 'rrrrrrrr', 'rrrrrrrr', 'rrwwrrrr', '.rrrrrr.', '........'],
  lens: ['.tttt...', 'twwwt...', 'twtwt...', 'twwwt...', '.ttttt..', '....t...', '.....t..', '......o.'],
  door: ['.wwwwww.', '.wkkkkkw.', '.wkkkkkw.', '.wkkokkw.', '.wkkkkkw.', '.wkkkkkw.', '.wkkkkkw.', '.wwwwww.'],
  play: ['t.......', 'tt......', 'ttt.....', 'tttt....', 'tttt....', 'ttt.....', 'tt......', 't.......'],
  x: ['r.....r.', '.r...r..', '..r.r...', '...r....', '..r.r...', '.r...r..', 'r.....r.', '........'],
  menu: ['........', 'tttttttt', '........', 'tttttttt', '........', 'tttttttt', '........', '........'],
  survive: ['.rr..rr.', 'rrrrrrrr', 'rrrrrrrr', '.rrrrrr.', '..rrrr..', '...rr...', '........', '........'],
  create: ['......aa', '.....ao.', '....ao..', '...ao...', '..bo....', '.bo.....', 'bo......', 'o.......'],
  select: ['tttt.ttt', 't......t', 't......t', '........', '........', 't......t', 't......t', 'tttt.ttt'],
  fill: ['...aa...', '..aaaa..', '.aaaaaa.', '.aaaaaa.', '.aaaaaa.', '..aaaa..', '...aa...', '...dd...'],
  walls: ['oooooooo', 'oo.oo.oo', 'oooooooo', '.oo.oo.o', 'oooooooo', 'oo.oo.oo', 'oooooooo', '........'],
  copy: ['.wwww...', '.w..ww..', '.w..w.w.', '.wwww.w.', '...w..w.', '...wwww.', '........', '........'],
  paste: ['..ttt...', '.wwwww..', '.w...w..', '.w.o.w..', '.w...w..', '.wwwww..', '........', '........'],
  check: ['........', '.......d', '......d.', 'd....d..', 'dd..d...', '.dddd...', '..dd....', '........'],
  leaf: ['...tt...', '..tttt..', '.tttttt.', 'ttttttt.', '.tttttt.', '..tttt..', '...t....', '..t.....'],
  flat: ['........', '........', '........', 'dddddddd', 'aaaaaaaa', '........', '........', '........'],
  void: ['.wwwwww.', 'w......w', 'w..kk..w', 'w.k..k.w', 'w.k..k.w', 'w..kk..w', 'w......w', '.wwwwww.'],
  islands: ['........', '..ttt...', '.ttttt..', 'ttttttt.', '..bbbb..', '.bbbbbb.', '........', '........'],
  sky: ['..wwww..', '.wwwwww.', 'wwwwwwww', '.wwwwww.', '........', '...o....', '...o....', '........'],
  parkour: ['oooo....', 'oooo....', '..oooo..', '..oooo..', '....oooo', '....oooo', '........', '........'],
  shuffle: ['.ddddd..', 'd....d..', 'd.......', '........', '.......d', '..d....d', '..ddddd.', '........'],
  back: ['...d....', '..d.....', '.ddddddd', '..d.....', '...d....', '........', '........', '........'],
  chevL: ['...d....', '..dd....', '.dd.....', 'dd......', '.dd.....', '..dd....', '...d....', '........'],
  chevR: ['....d...', '....dd..', '.....dd.', '......dd', '.....dd.', '....dd..', '....d...', '........'],
  folder: ['.ooo....', 'oooooooo', 'owwwwwwo', 'owwwwwwo', 'owwwwwwo', 'oooooooo', '........', '........'],
  up: ['...o....', '..ooo...', '.ooooo..', '...o....', '...o....', '...o....', '...o....', '........'],
  down: ['...o....', '...o....', '...o....', '...o....', '.ooooo..', '..ooo...', '...o....', '........'],
  spark: ['...aa...', '...aa...', 'aaaaaaaa', '.aaaaaa.', 'aaaaaaaa', '...aa...', '...aa...', '........'],
  home: ['.tttttt.', 'tttttttt', 'twwwwwwt', 'twttttwt', 'twttttwt', 'twtwwtwt', 'twwwwwwt', 'tttttttt'],
  cards: ['..nnnn..', '.nwwwwn.', 'nwwwwww.', 'nwwwwww.', 'nwwwwww.', '.nnnnnn.', '........', '........'],
  camera: ['.bbbbbb.', 'bwwwwwwb', 'bwoooowb', 'bwoooowb', 'bwwwwwwb', '.bbbbbb.', '...bb...', '........'],
  film: ['bbbbbbbb', 'b.b..b.b', 'bwwwwwwb', 'bwwwwwwb', 'bwwwwwwb', 'b.b..b.b', 'bbbbbbbb', '........'],
  scale: ['...dd...', '...dd...', 'dddddddd', '.d....d.', 'd......d', '........', '........', '........'],
  grid: ['tt.tt.tt', 'tt.tt.tt', '........', 'tt.tt.tt', 'tt.tt.tt', '........', 'tt.tt.tt', 'tt.tt.tt'],
  hotbar: ['nnnnnnnn', 'nwwwwwnn', 'nwwwwwnn', 'nnnnnnnn', '........', '........', '........', '........'],
  pockets: ['.bbbbbb.', 'bwwwwwwb', 'bwwwwwwb', 'bwwwwwwb', '.bbbbbb.', '..b..b..', '..b..b..', '........'],
  invert: ['.o....d.', 'ooo..ddd', '.o....d.', '.o....d.', '.d....o.', 'ddd..ooo', '.d....o.', '........'],
  wide: ['d......d', '.d....d.', '..d..d..', 'dddddddd', '..d..d..', '.d....d.', 'd......d', '........'],
  climb: ['b.bbbb.b', 'b.b..b.b', 'b.bbbb.b', 'b.b..b.b', 'b.bbbb.b', 'b.b..b.b', 'b.bbbb.b', '........'],
  hand: ['..www...', '.wwwww..', '.ww.ww..', '.wwwww..', '..www...', '...w....', '...w....', '........'],
  tips: ['..oooo..', '.oowwoo.', '.oowwoo.', '..oooo..', '...dd...', '...dd...', '..dddd..', '........'],
  graphics: ['...aa...', '..aaaa..', 'ttttt...', '.ttt....', '..tt....', '...t....', 'bbbbbbbb', '........'],
  quality: ['.oooooo.', 'o......o', 'o..aa..o', 'o.a..a.o', 'o......o', '.oooooo.', '...oo...', '........'],
  bolt: ['...aaa..', '..aaaa..', '.aaaa...', 'aaaaaaa.', '...aaaa.', '..aaaa..', '..aaa...', '........'],
  text: ['.aa..ww.', 'a..a.w.w', 'a..a.w.w', 'aaaa.www', 'a..a.w.w', 'a..a.w.w', '........', '........'],
  speed: ['........', 't....t..', '.t..t.t.', '..tt...t', '........', '........', '........', '........'],
  stick: ['...oo...', '..oooo..', '...oo...', '...oo...', '.oooooo.', 'oooooooo', '.oooooo.', '........'],
  about: ['.tttttt.', 't......t', 't..tt..t', 't..tt..t', 't......t', 't..tt..t', 't......t', '.tttttt.'],
  boxcheck: ['dddddddd', 'd......d', 'd.dddd.d', 'd.dddd.d', 'd.dddd.d', 'd......d', 'dddddddd', '........'],
  boxempty: ['dddddddd', 'd......d', 'd......d', 'd......d', 'd......d', 'd......d', 'dddddddd', '........'],
  star: ['...aa...', '..aaaa..', 'aaaaaaaa', '.aaaaaa.', '..aaaa..', '.aa..aa.', 'a......a', '........'],
  clock: ['.oooooo.', 'o..o...o', 'o..o...o', 'oooo...o', 'o......o', 'o......o', '.oooooo.', '........'],
  day: ['...aa...', '.a.aa.a.', '..aaaa..', 'aaa..aaa', '..aaaa..', '.a.aa.a.', '...aa...', '........'],
  sun: ['...aa...', '.a.aa.a.', '..aaaa..', 'aaa..aaa', '..aaaa..', '.a.aa.a.', '...aa...', '........'],
  moon: ['..wwww..', '.wwww...', 'wwww....', 'wwww....', 'wwww....', '.wwww...', '..wwww..', '........'],
  sunset: ['...aa...', '..aaaa..', '.aaaaaa.', 'aaaaaaaa', 'oooooooo', '........', '........', '........'],
  sunrise: ['........', '........', 'oooooooo', 'aaaaaaaa', '.aaaaaa.', '..aaaa..', '...aa...', '........'],
  send: ['o.......', 'oo......', 'ooo.....', 'oooo....', 'ooo.....', 'oo......', 'o.......', '........'],
}
function blitRows(rows, pal) {
  const h = rows.length
  const w = rows[0].length
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = false
  for (let y = 0; y < h; y++) {
    const row = rows[y]
    for (let x = 0; x < w; x++) {
      const col = pal[row[x]]
      if (!col) continue
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }
  }
  c.setAttribute('aria-hidden', 'true')
  return c
}
const missingIcons = new Set()
function benchPng(asItem) {
  const img = document.createElement('img')
  img.src = 'assets/tile-workbench.png'
  img.alt = ''
  img.className = 'kd-ico bench-png'
  img.dataset.kind = 'png'
  if (asItem) img.dataset.item = asItem
  else img.dataset.icon = 'bench'
  return img
}
export function menuIcon(name) {
  if (name === 'bench') return benchPng(null)
  const rows = MENU_GLYPH[name]
  if (!rows) {
    if (name && !missingIcons.has(name)) {
      missingIcons.add(name)
      console.warn('missing icon', name)
    }
    return null
  }
  const c = blitRows(rows, MENU_PAL)
  c.className = 'kd-ico'
  c.dataset.icon = name
  return c
}
const MENU_FONT = {
  B: ['##.', '#.#', '##.', '#.#', '##.'],
  E: ['###', '#..', '##.', '#..', '###'],
  R: ['##.', '#.#', '##.', '#.#', '#.#'],
  T: ['###', '.#.', '.#.', '.#.', '.#.'],
  O: ['###', '#.#', '#.#', '#.#', '###'],
  P: ['##.', '#.#', '##.', '#..', '#..'],
  I: ['###', '.#.', '.#.', '.#.', '###'],
  A: ['.#.', '#.#', '###', '#.#', '#.#'],
}
const MENU_LOGO = [
  '......tttt......',
  '.....tttttt.....',
  '....tttttttt....',
  '...tttttttttt...',
  '....tttttttt....',
  '......bbbb......',
  '......bbbb......',
  '.oooooooooooooo.',
  '.owwwwwwwwwwwwo.',
  '.owwwwwwwwwwwwo.',
  '.oooooooooooooo.',
]
// Pixel tree on a block, plus BERTOPIA in a 5px font. BERT is teal, OPIA is orange.
export function menuPlate() {
  const word = 'BERTOPIA'
  let tw = 0
  for (const ch of word) tw += MENU_FONT[ch][0].length + 1
  tw -= 1
  const lw = MENU_LOGO[0].length
  const gap = 2
  const w = lw + gap + tw
  const h = MENU_LOGO.length
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d', { willReadFrequently: true })
  g.imageSmoothingEnabled = false
  for (let y = 0; y < h; y++) {
    const row = MENU_LOGO[y]
    for (let x = 0; x < lw; x++) {
      const col = MENU_PAL[row[x]]
      if (!col) continue
      g.fillStyle = col
      g.fillRect(x, y, 1, 1)
    }
  }
  const y0 = Math.floor((h - 5) / 2)
  let x0 = lw + gap
  for (let i = 0; i < word.length; i++) {
    const glyph = MENU_FONT[word[i]]
    g.fillStyle = i < 4 ? '#7ff5e3' : '#ffb36b'
    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < glyph[y].length; x++) {
        if (glyph[y][x] === '#') g.fillRect(x0 + x, y0 + y, 1, 1)
      }
    }
    x0 += glyph[0].length + 1
  }
  c.className = 'kd-word'
  c.setAttribute('aria-hidden', 'true')
  return c
}

