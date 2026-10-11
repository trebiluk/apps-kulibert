// Flora pixel wraps. Items stay shapes. Blocks fill from the same paint.
import { PALETTE, reg } from '../../gfx/pixel-art.js'

PALETTE.birch = ['#3a2c22', '#d8c7a4', '#f3ead6', '#f7f3ea', '#1a140f']
PALETTE.birchLeaf = ['#245018', '#7cbc4e', '#a6dc78', '#cfeab0', '#3e7a2c']
PALETTE.pine = ['#1a140f', '#4a3b2e', '#2e261e', '#6a5644', '#100c09']
PALETTE.pineLeaf = ['#0c1c10', '#16321c', '#1e4628', '#102616', '#08140c']
PALETTE.cone = ['#3a2410', '#6b3e14', '#8a5a28', '#c4a574', '#2a180c']
PALETTE.daisy = ['#f7f3ea', '#f4f7f2', '#f2d15a', '#d8e0d4', '#8a8f86']
PALETTE.poppy = ['#8e1520', '#d23a3a', '#f07a72', '#2f6b28', '#5c1016']
PALETTE.corn = ['#1d3f9a', '#3d6fe0', '#f2d15a', '#2f6b28', '#16306e']
PALETTE.sun = ['#e2a40a', '#f6d34a', '#6b3e14', '#3e7a2c', '#8a5a10']
PALETTE.tulip = ['#e07018', '#f2a04a', '#3e7a2c', '#a84810', '#f7e2c4']
PALETTE.lupine = ['#5a2e86', '#8a56c4', '#c49ae6', '#2f6b28', '#3a1c58']
PALETTE.grass = ['#245018', '#5ea832', '#8ed45a', '#16320e', '#3e7a2c']
PALETTE.fern = ['#14321c', '#2a6a38', '#4a9a52', '#0c2014', '#1e4a28']
PALETTE.dye = ['#f7f3ea', '#d23a3a', '#3d6fe0', '#f6d34a', '#e07018', '#8a56c4', '#6b4423']

function column(set, x0, x1, c) {
  for (let y = 1; y < 15; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
}

export function registerFloraArt(paint) {
  paint('birchLog', (set) => {
    column(set, 4, 11, 3)
    for (let y = 2; y < 14; y += 3) {
      set(5, y, 4); set(7, y, 4); set(9, y, 4); set(6, y + 1, 4)
    }
    set(4, 1, 1); set(11, 14, 1)
  }, 'birch')
  paint('birchLeaves', (set) => {
    for (let y = 4; y <= 11; y++) for (let x = 4; x <= 11; x++) if ((x + y) % 5 !== 0) set(x, y, 2)
    set(6, 5, 3); set(9, 6, 3); set(7, 9, 1); set(10, 10, 3); set(5, 8, 4)
  }, 'birchLeaf')
  paint('birchPlanks', (set) => {
    for (let x = 2; x <= 13; x++) {
      for (let y = 2; y <= 4; y++) set(x, y, 3)
      for (let y = 6; y <= 8; y++) set(x, y, 2)
      for (let y = 10; y <= 12; y++) set(x, y, 3)
    }
    set(4, 3, 4); set(9, 7, 1); set(6, 11, 4)
  }, 'birch')
  paint('pineLog', (set) => {
    column(set, 5, 10, 2)
    for (let y = 3; y < 13; y += 4) { set(6, y, 0); set(8, y, 4); set(7, y + 1, 0) }
  }, 'pine')
  paint('pineNeedles', (set) => {
    for (let y = 2; y <= 13; y++) {
      const w = y < 5 ? 1 : y < 8 ? 2 : y < 11 ? 3 : 2
      for (let x = 8 - w; x <= 8 + w; x++) set(x, y, (x + y) % 3 === 0 ? 2 : 1)
    }
    set(8, 3, 3); set(7, 7, 0); set(9, 10, 2)
  }, 'pineLeaf')
  paint('pinePlanks', (set) => {
    for (let x = 3; x <= 12; x++) {
      for (let y = 2; y <= 4; y++) set(x, y, 1)
      for (let y = 6; y <= 8; y++) set(x, y, 2)
      for (let y = 10; y <= 12; y++) set(x, y, 3)
    }
    set(5, 3, 0); set(9, 7, 4); set(7, 11, 0)
  }, 'pine')
  paint('pinecone', (set) => {
    for (let y = 4; y <= 12; y++) {
      const w = y <= 5 || y >= 12 ? 0 : y <= 7 || y >= 11 ? 1 : 2
      for (let x = 8 - w; x <= 8 + w; x++) set(x, y, y % 2 ? 2 : 1)
    }
    set(8, 3, 3); set(7, 8, 4); set(9, 10, 0)
  }, 'cone')
  const bloom = (key, pal, petal, heart) => {
    paint(key, (set) => {
      for (let y = 3; y <= 12; y++) set(8, y, 3)
      for (let y = 6; y <= 10; y++) for (let x = 5; x <= 11; x++) {
        const d = Math.abs(x - 8) + Math.abs(y - 8)
        if (d === 2 || d === 3) set(x, y, petal)
      }
      set(8, 8, heart); set(7, 8, heart); set(9, 8, heart); set(8, 7, heart); set(8, 9, heart)
    }, pal)
  }
  bloom('daisy', 'daisy', 1, 2)
  bloom('poppy', 'poppy', 2, 0)
  bloom('cornflower', 'corn', 1, 2)
  bloom('sunflower', 'sun', 1, 2)
  bloom('tulip', 'tulip', 1, 0)
  bloom('lupine', 'lupine', 2, 1)
  paint('tallGrass', (set) => {
    for (let y = 4; y <= 13; y++) { set(6, y, 1); set(8, y, 2); set(10, y, 1) }
    set(6, 5, 2); set(10, 6, 4); set(8, 4, 3)
  }, 'grass')
  paint('fern', (set) => {
    for (let y = 4; y <= 13; y++) set(8, y, 1)
    for (let i = 0; i < 5; i++) { set(8 - i, 6 + i, 2); set(8 + i, 6 + i, 2) }
    set(5, 10, 4); set(11, 10, 3)
  }, 'fern')
  const drop = (key, c) => {
    paint(key, (set) => {
      for (let y = 5; y <= 11; y++) {
        const w = y < 7 ? 1 : y < 10 ? 2 : 1
        for (let x = 8 - w; x <= 8 + w; x++) set(x, y, c)
      }
      set(8, 4, c); set(7, 8, 6)
    }, 'dye')
  }
  drop('dyeWhite', 0)
  drop('dyeRed', 1)
  drop('dyeBlue', 2)
  drop('dyeYellow', 3)
  drop('dyeOrange', 4)
  drop('dyePurple', 5)
}

registerFloraArt(reg)
