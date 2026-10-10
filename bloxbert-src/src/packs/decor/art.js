// Decor pack pixel art. Off lamps use high-contrast so they read in the dark.
export function registerDecorArt(reg) {
  reg('floorLamp', (set) => {
    for (let y = 4; y < 12; y++) set(8, y, 1);
    set(6, 3, 3); set(7, 3, 4); set(8, 3, 4); set(9, 3, 4); set(10, 3, 3);
    set(7, 12, 2); set(8, 12, 2); set(9, 12, 2);
  }, 'lantern');
  reg('wallLamp', (set) => {
    set(4, 8, 1); set(5, 8, 1); set(6, 8, 1);
    set(7, 6, 3); set(8, 6, 4); set(9, 6, 4); set(8, 7, 3);
  }, 'lantern');
  reg('rug', (set) => {
    for (let y = 5; y < 11; y++) for (let x = 3; x < 13; x++) set(x, y, 2);
    for (let x = 4; x < 12; x++) { set(x, 6, 3); set(x, 9, 3); }
    set(5, 7, 4); set(10, 8, 1);
  }, 'cloth');
  reg('floorLampOff', (set) => {
    for (let y = 4; y < 12; y++) set(8, y, 2);
    set(6, 3, 4); set(7, 3, 4); set(8, 3, 4); set(9, 3, 4); set(10, 3, 4);
    set(7, 12, 3); set(8, 12, 3); set(9, 12, 3);
  }, 'lantern');
  reg('floorLampOn', (set) => {
    for (let y = 4; y < 12; y++) set(8, y, 1);
    set(6, 3, 3); set(7, 3, 4); set(8, 3, 4); set(9, 3, 4); set(10, 3, 3);
    set(7, 12, 2); set(8, 12, 2); set(9, 12, 2);
  }, 'lantern');
  reg('wallLampOff', (set) => {
    set(4, 8, 2); set(5, 8, 2); set(6, 8, 2);
    set(7, 6, 4); set(8, 6, 4); set(9, 6, 4); set(8, 7, 4);
  }, 'lantern');
  reg('wallLampOn', (set) => {
    set(4, 8, 1); set(5, 8, 1); set(6, 8, 1);
    set(7, 6, 3); set(8, 6, 4); set(9, 6, 4); set(8, 7, 3);
  }, 'lantern');
  reg('rugAnchor', (set) => {
    for (let y = 5; y < 11; y++) for (let x = 3; x < 13; x++) set(x, y, 2);
    for (let x = 4; x < 12; x++) { set(x, 6, 3); set(x, 9, 3); }
  }, 'cloth');
  reg('rugPart', (set) => {
    for (let y = 5; y < 11; y++) for (let x = 3; x < 13; x++) set(x, y, 2);
  }, 'cloth');
}
