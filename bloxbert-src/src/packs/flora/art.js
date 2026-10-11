// Flora pixel wraps. Items stay shapes. Blocks fill from the same paint.
import { PALETTE, reg } from '../../gfx/pixel-art.js'

PALETTE.birch = ['#3a2c22', '#d8c7a4', '#f3ead6', '#f7f3ea', '#1a140f']
PALETTE.birchLeaf = ['#245018', '#7cbc4e', '#a6dc78', '#cfeab0', '#3e7a2c']
PALETTE.pine = ['#1a140f', '#4a3b2e', '#2e261e', '#6a5644', '#100c09']
PALETTE.pineLeaf = ['#0c1c10', '#16321c', '#1e4628', '#102616', '#08140c']
PALETTE.cone = ['#3a2410', '#6b3e14', '#8a5a28', '#c4a574', '#2a180c']

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
}

registerFloraArt(reg)
