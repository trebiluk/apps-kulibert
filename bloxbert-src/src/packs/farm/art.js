// Farm pack pixel art. Called from pixel-art.js after reg is ready.
export function registerFarmArt(reg) {
  reg('berry', (set) => {
    const blob = (cx, cy, rx, ry, col) => {
      for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
        for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const dx = (x - cx) / rx
          const dy = (y - cy) / ry
          if (dx * dx + dy * dy <= 1) set(x, y, col)
        }
      }
    }
    for (let x = 4; x <= 11; x++) set(x, 2, 1)
    set(5, 1, 1); set(6, 1, 2); set(7, 1, 1); set(8, 1, 1)
    set(9, 3, 1); set(10, 3, 1)
    blob(5, 7, 3.2, 2.6, 3)
    blob(10, 7, 3.2, 2.6, 4)
    blob(7.5, 11, 3.4, 2.8, 2)
    set(4, 6, 4); set(10, 6, 4); set(8, 10, 4)
  }, 'food');
  reg('flour', (set) => {
    for (let y = 4; y < 12; y++) for (let x = 6; x < 10; x++) set(x, y, 3);
    set(7, 5, 4); set(8, 6, 2);
  }, 'food');
  reg('sugar', (set) => {
    set(6, 7, 4); set(8, 6, 4); set(10, 7, 4);
    set(7, 8, 3); set(9, 8, 3);
  }, 'food');
  reg('cupcake', (set) => {
    for (let y = 8; y < 12; y++) for (let x = 6; x < 10; x++) set(x, y, 2);
    set(7, 6, 4); set(8, 5, 4); set(9, 6, 3);
  }, 'food');
  reg('bread', (set) => {
    for (let y = 6; y < 11; y++) for (let x = 5; x < 11; x++) set(x, y, 2);
    set(6, 7, 3); set(9, 7, 3); set(7, 8, 4);
  }, 'food');
  reg('wheat', (set) => {
    for (let y = 3; y < 13; y++) set(8, y, 2);
    set(7, 4, 3); set(9, 5, 3); set(7, 7, 3); set(9, 8, 3);
  }, 'food');
  reg('wheatSeeds', (set) => {
    set(6, 7, 2); set(8, 6, 3); set(10, 7, 2);
    set(7, 8, 1); set(9, 8, 1);
  }, 'food');
  reg('bushSprout', (set) => {
    set(8, 10, 1); set(8, 9, 2); set(7, 8, 3); set(9, 8, 3);
  }, 'food');
  reg('cropSprout', (set) => {
    set(8, 11, 1); set(8, 10, 2); set(7, 9, 3);
  }, 'food');
  reg('cropLeafy', (set) => {
    set(8, 12, 1); set(8, 11, 2); set(7, 10, 3); set(9, 10, 3); set(8, 9, 3);
  }, 'food');
  reg('cropTall', (set) => {
    set(8, 13, 1); set(8, 12, 2); set(7, 11, 3); set(9, 11, 3); set(8, 10, 3); set(6, 9, 2);
  }, 'food');
  reg('cropRipe', (set) => {
    set(8, 13, 1); set(8, 12, 2); set(7, 11, 3); set(9, 11, 3);
    set(7, 8, 4); set(9, 8, 4); set(8, 7, 4);
  }, 'food');
  reg('bushYoung', (set) => {
    set(8, 11, 1); set(8, 10, 2); set(7, 9, 3); set(9, 9, 3);
  }, 'food');
  reg('bushLeaf', (set) => {
    set(8, 12, 1); set(7, 10, 2); set(8, 10, 3); set(9, 10, 2); set(8, 9, 3);
  }, 'food');
  reg('bushFull', (set) => {
    set(8, 12, 1); set(6, 9, 2); set(7, 9, 3); set(8, 9, 3); set(9, 9, 3); set(10, 9, 2);
    set(7, 8, 3); set(9, 8, 3);
  }, 'food');
  reg('bushFruit', (set) => {
    set(8, 12, 1); set(6, 9, 2); set(7, 9, 3); set(8, 9, 3); set(9, 9, 3); set(10, 9, 2);
    set(7, 7, 4); set(9, 7, 4); set(8, 6, 4);
  }, 'food');
}
