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
function workbenchTop() {
  const px = Buffer.alloc(32 * 32 * 4)
  const set = (x, y, r, g, b, a = 255) => { const i = (y * 32 + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a }
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (x < 2 || y < 2 || x > 29 || y > 29) set(x, y, 92, 51, 23)
    else set(x, y, 232, 194, 122)
    if ((x === 11 || x === 21 || y === 11 || y === 21) && x > 2 && x < 29 && y > 2 && y < 29) set(x, y, 92, 51, 23)
  }
  for (let x = 4; x <= 12; x++) set(x, 6, 186, 192, 198)
  for (let x = 4; x <= 12; x += 2) { set(x, 7, 120, 126, 132); set(x, 5, 210, 214, 218) }
  for (let y = 4; y <= 9; y++) { set(12, y, 107, 58, 31); set(13, y, 74, 42, 22) }
  for (let x = 20; x <= 29; x++) for (let y = 23; y <= 25; y++) set(x, y, 186, 192, 198)
  for (let y = 26; y <= 30; y++) { set(24, y, 107, 58, 31); set(25, y, 74, 42, 22) }
  return px
}
function workbenchSide() {
  const px = Buffer.alloc(32 * 32 * 4)
  const set = (x, y, r, g, b, a = 255) => { const i = (y * 32 + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a }
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    if (y < 6) set(x, y, 232, 194, 122)
    else set(x, y, 201, 149, 76)
    if (y === 0 || y === 6 || y === 14 || y === 22 || y === 31) set(x, y, 92, 51, 23)
    if (x < 5 || x > 26) set(x, y, 138, 90, 50)
    if (x === 0 || x === 5 || x === 26 || x === 31) set(x, y, 92, 51, 23)
  }
  for (let x = 6; x <= 25; x++) { set(x, 15, 92, 51, 23); set(x, 16, 232, 194, 122) }
  for (let x = 8; x <= 15; x++) set(x, 19, 186, 192, 198)
  for (let x = 8; x <= 15; x += 2) set(x, 20, 120, 126, 132)
  for (let x = 18; x <= 25; x++) { set(x, 19, 186, 192, 198); set(x, 20, 160, 166, 172) }
  for (let y = 20; y <= 28; y++) { set(21, y, 107, 58, 31); set(22, y, 74, 42, 22) }
  return px
}
function glassPane() {
  const px = Buffer.alloc(32 * 32 * 4)
  const set = (x, y, r, g, b, a = 255) => { const i = (y * 32 + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a }
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const edge = x < 2 || y < 2 || x > 29 || y > 29
    const shine = (x - y === 6 || x - y === 7) && x > 5 && x < 24 && y > 2 && y < 20
    if (edge) set(x, y, 244, 252, 255, 235)
    else if (shine) set(x, y, 255, 255, 255, 230)
    else set(x, y, 198, 232, 248, 120)
  }
  return px
}
const tiles = {
  coreplate: tile((x, y, set) => { set(x, y, 30, 41, 59); if (((x / 8 | 0) + (y / 8 | 0)) % 2 === 0) set(x, y, 15, 118, 110) }),
  workbench: workbenchTop(),
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
writeFileSync(join(out, 'tile-workbench-side.png'), png(32, 32, workbenchSide()))
writeFileSync(join(out, 'glass.png'), png(32, 32, glassPane()))
writeFileSync(join(out, 'tiles-extra.json'), JSON.stringify({ size: 32, names }))
console.log('tiles', names.join(', '))
