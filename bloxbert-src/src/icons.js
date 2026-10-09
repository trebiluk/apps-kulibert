// One picture per block. A few items draw their own face so they don't share one wood tile.
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
    g.fillRect(6, 34, 6, 10)
    g.fillRect(36, 34, 6, 10)
    g.fillStyle = '#D7A45A'
    boxPath(g, 3, 6, 42, 28, 3)
    g.fill()
    g.strokeStyle = '#3A2415'
    g.lineWidth = 2.5
    g.stroke()
    g.beginPath()
    g.moveTo(24, 8); g.lineTo(24, 32)
    g.moveTo(5, 20); g.lineTo(43, 20)
    g.strokeStyle = '#6B3E26'
    g.lineWidth = 2
    g.stroke()
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
}
export function itemSvg(svg) {
  if (!svg) return ''
  if (String(svg).includes('<svg')) return svg
  return FOOD[svg] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#f6c453"/></svg>'
}
export function dropperIcon() {
  return '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14.2 3.3l6.5 6.5-1.4 1.4-1.1-1.1-6.7 6.7a3.2 3.2 0 0 1-4.5 0l-.6.6-1.5-1.5.6-.6a3.2 3.2 0 0 1 0-4.5l6.7-6.7-1.1-1.1z"/></svg>'
}
