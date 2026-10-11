// Tech pack pixel art. Copper reads orange, the cell reads as a small battery.
export function registerTechArt(reg) {
  reg('techCell', (set) => {
    for (let y = 3; y < 13; y++) for (let x = 5; x < 11; x++) set(x, y, 1)
    set(6, 4, 3); set(9, 5, 4); set(7, 11, 0); set(8, 2, 2)
  }, 'metal')
  reg('techLine', (set) => {
    for (let x = 1; x < 15; x++) set(x, 8, 2)
    set(2, 7, 3); set(13, 9, 1); set(8, 8, 4)
  }, 'copper')
  reg('techSwitch', (set) => {
    for (let x = 4; x < 12; x++) set(x, 11, 1)
    set(8, 10, 2); set(9, 8, 2); set(10, 6, 3); set(11, 5, 4)
  }, 'copper')
  reg('techSwitchOn', (set) => {
    for (let x = 4; x < 12; x++) set(x, 11, 1)
    set(8, 10, 2); set(7, 8, 3); set(6, 6, 4); set(5, 5, 4)
  }, 'copper')
  reg('techButton', (set) => {
    for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) set(x, y, 1)
    set(7, 7, 4); set(8, 7, 4); set(7, 8, 3); set(8, 8, 3)
  }, 'copper')
  reg('techButtonOn', (set) => {
    for (let y = 6; y < 11; y++) for (let x = 5; x < 11; x++) set(x, y, 2)
    set(7, 8, 4); set(8, 8, 4)
  }, 'copper')
  reg('circuitLens', (set) => {
    for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) {
      const dx = x - 7.5
      const dy = y - 7.5
      if (dx * dx + dy * dy < 16) set(x, y, 3)
    }
    set(6, 6, 4); set(10, 9, 1); set(3, 8, 2); set(12, 8, 2)
  }, 'copper')
}
