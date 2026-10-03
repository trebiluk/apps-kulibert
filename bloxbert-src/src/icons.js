// One picture per block, cropped from the game atlas. Not the whole strip.
export function icon(index, alt) {
  const c = document.createElement('canvas')
  c.width = 48
  c.height = 48
  c.setAttribute('aria-label', alt || '')
  const img = new Image()
  img.src = 'assets/atlas.png'
  img.onload = () => {
    const ctx = c.getContext('2d')
    const y = (index || 0) * 32
    ctx.drawImage(img, 0, y, 32, 32, 10, 4, 28, 16)
    ctx.drawImage(img, 0, y, 32, 32, 4, 16, 16, 24)
    ctx.drawImage(img, 0, y, 32, 32, 20, 16, 16, 24)
  }
  return c
}
