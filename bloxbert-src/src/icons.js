// One picture per block, cropped from that block's own atlas cell.
const PNG = { glass: 'assets/glass.png', coreplate: 'assets/tile-coreplate.png', workbench: 'assets/tile-workbench.png', oven: 'assets/tile-oven.png', vend: 'assets/tile-vend.png', store: 'assets/tile-store.png', bunk: 'assets/tile-bunk.png' }
export function blockIcon(block, atlas) {
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
  woodTool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16 L10 10 L14 14 L8 20 Z" fill="#c4a574"/><path d="M12 8 L20 4 L16 12 Z" fill="#78716c"/></svg>',
  stoneTool: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 16 L10 10 L14 14 L8 20 Z" fill="#a8a29e"/><path d="M12 8 L20 4 L16 12 Z" fill="#57534e"/></svg>',
}
export function itemSvg(svg) {
  if (!svg) return ''
  if (String(svg).includes('<svg')) return svg
  return FOOD[svg] || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="#f6c453"/></svg>'
}
