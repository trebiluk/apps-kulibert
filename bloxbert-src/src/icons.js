// One picture per block. A few items draw their own face so they don't share one wood tile.
import { ITEMS } from './data/items.js'
const PNG = { glass: 'assets/glass.png', coreplate: 'assets/tile-coreplate.png', workbench: 'assets/tile-workbench.png', oven: 'assets/tile-oven.png', vend: 'assets/tile-vend.png', store: 'assets/tile-store.png', bunk: 'assets/tile-bunk.png' }
function glyph(paint) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  const g = c.getContext('2d')
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
  const gold = stage === 3
  g.strokeStyle = gold ? '#e6b422' : '#3D8C32'
  g.lineWidth = 3
  g.beginPath()
  const top = 40 - (16 + stage * 6)
  g.moveTo(24, 42)
  g.lineTo(24, top)
  if (stage >= 1) { g.moveTo(24, 32); g.lineTo(14, 24) }
  if (stage >= 2) { g.moveTo(24, 28); g.lineTo(34, 18) }
  g.stroke()
  if (stage >= 2) {
    g.fillStyle = gold ? '#f6c453' : '#d6b25e'
    g.beginPath()
    g.ellipse(24, top, 6, 4, 0, 0, Math.PI * 2)
    g.fill()
  }
  if (gold) {
    g.fillStyle = '#fff4b0'
    g.fillRect(34, 8, 4, 4)
  }
}
const FACE = {
  log(g) {
    g.fillStyle = '#6B3A1F'
    g.beginPath()
    g.arc(24, 24, 20, 0, Math.PI * 2)
    g.fill()
    g.strokeStyle = '#2A160C'
    g.lineWidth = 3
    g.stroke()
    g.strokeStyle = '#E6C98A'
    g.lineWidth = 2.5
    g.beginPath(); g.arc(24, 24, 13, 0, Math.PI * 2); g.stroke()
    g.beginPath(); g.arc(24, 24, 6, 0, Math.PI * 2); g.stroke()
    g.fillStyle = '#F3D7A1'
    g.beginPath(); g.arc(24, 24, 2.5, 0, Math.PI * 2); g.fill()
  },
  planks(g) {
    const rows = [[4, '#E8C27A'], [18, '#C9954C'], [32, '#E0B56A']]
    rows.forEach(([y, fill]) => {
      g.fillStyle = fill
      boxPath(g, 3, y, 42, 10, 2)
      g.fill()
      g.strokeStyle = '#5C3317'
      g.lineWidth = 2
      g.stroke()
    })
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
    g.strokeStyle = '#6B3A1F'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(24, 42)
    g.lineTo(24, 22)
    g.stroke()
    g.fillStyle = '#3FAE46'
    g.beginPath()
    g.ellipse(15, 18, 9, 5, -0.7, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#2F8F38'
    g.beginPath()
    g.ellipse(33, 16, 9, 5, 0.6, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#14521C'
    g.beginPath()
    g.arc(24, 20, 2.2, 0, Math.PI * 2)
    g.fill()
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
  tuft(g) {
    g.strokeStyle = '#3D8C32'
    g.lineWidth = 3
    g.beginPath()
    g.moveTo(16, 42); g.lineTo(12, 8)
    g.moveTo(24, 42); g.lineTo(24, 6)
    g.moveTo(32, 42); g.lineTo(36, 10)
    g.stroke()
  },
}
FACE.doorOpen = FACE.door
FACE.doorGlassOpen = FACE.doorGlass
export function blockIcon(block, atlas) {
  const name = block && block[1]
  if (FACE[name]) {
    const c = glyph(FACE[name])
    c.dataset.block = String(block[0])
    return c
  }
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 48
  c.dataset.block = String(block[0])
  const tex = block[4] || (Array.isArray(block[2]) ? block[2][2] : block[2])
  const img = new Image()
  img.src = PNG[tex] || 'assets/atlas.png'
  img.onload = () => {
    const ctx = c.getContext('2d')
    if (PNG[tex]) ctx.drawImage(img, 8, 8, 32, 32)
    else {
      const y = (atlas[tex] || 0) * 32
      ctx.drawImage(img, 0, y, 32, 32, 8, 8, 32, 32)
    }
  }
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
}
export function itemSvg(svg) {
  if (!svg) return ''
  if (String(svg).includes('<svg')) return svg
  return FOOD[svg] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#f6c453"/></svg>'
}
export function dropperIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.2 3.3l6.5 6.5-1.4 1.4-1.1-1.1-6.7 6.7a3.2 3.2 0 0 1-4.5 0l-.6.6-1.5-1.5.6-.6a3.2 3.2 0 0 1 0-4.5l6.7-6.7-1.1-1.1z"/></svg>'
}
function letterTile(letter) {
  const c = document.createElement('canvas')
  c.width = c.height = 48
  c.className = 'letter-tile'
  c.dataset.letter = String(letter || '?').slice(0, 2)
  const g = c.getContext('2d')
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
  const letter = (item && item.letter) || (key ? String(key).slice(0, 1).toUpperCase() : '?')
  return letterTile(letter)
}
