// Our own 32px tiles. node + zlib only.
import { deflateSync } from 'zlib'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
const out = join(dirname(fileURLToPath(import.meta.url)), '../assets')
mkdirSync(out, { recursive: true })
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4)
  }
  const crc = (buf) => {
    let c = ~0
    for (const b of buf) { c ^= b; for (let i = 0; i < 8; i++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) }
    const o = Buffer.alloc(4); o.writeUInt32BE((~c) >>> 0); return o
  }
  const chunk = (t, d) => Buffer.concat([Buffer.from([(d.length >>> 24) & 255, (d.length >>> 16) & 255, (d.length >>> 8) & 255, d.length & 255]), Buffer.from(t), d, crc(Buffer.concat([Buffer.from(t), d]))])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
function tile(paint) {
  const px = Buffer.alloc(32 * 32 * 4)
  const set = (x, y, r, g, b, a = 255) => { const i = (y * 32 + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a }
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) paint(x, y, set)
  return px
}
const tiles = {
  coreplate: tile((x, y, set) => { set(x, y, 30, 41, 59); if (((x / 8 | 0) + (y / 8 | 0)) % 2 === 0) set(x, y, 15, 118, 110) }),
  workbench: tile((x, y, set) => { set(x, y, 120, 72, 36); if (y > 20) set(x, y, 80, 48, 24) }),
  oven: tile((x, y, set) => { set(x, y, 55, 65, 81); if (x > 10 && x < 22 && y > 12 && y < 22) set(x, y, 251, 146, 60) }),
  vend: tile((x, y, set) => { set(x, y, 15, 118, 110); if (y < 8) set(x, y, 34, 211, 238) }),
  store: tile((x, y, set) => { set(x, y, 30, 64, 175); if (y > 22) set(x, y, 15, 118, 110) }),
  bunk: tile((x, y, set) => { set(x, y, 59, 130, 246); if (y < 10) set(x, y, 248, 250, 252) }),
}
const names = Object.keys(tiles)
const strip = Buffer.alloc(32 * names.length * 32 * 4)
names.forEach((n, i) => tiles[n].copy(strip, i * 32 * 32 * 4))
writeFileSync(join(out, 'tiles-extra.png'), png(32, 32 * names.length, strip))
for (const n of names) writeFileSync(join(out, 'tile-' + n + '.png'), png(32, 32, tiles[n]))
writeFileSync(join(out, 'tiles-extra.json'), JSON.stringify({ size: 32, names }))
console.log('tiles', names.join(', '))
