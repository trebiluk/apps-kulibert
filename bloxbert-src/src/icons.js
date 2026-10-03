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
export function itemSvg(svg) { return svg || '' }
