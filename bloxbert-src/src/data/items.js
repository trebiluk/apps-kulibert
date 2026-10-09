// Item keys. Block ids match the registry. Commons have base 0 and cannot be sold.
export const ITEMS = {
  log: { block: 11, letter: 'L', cat: 'Materials', base: 4, stack: 64, sell: true },
  planks: { block: 10, letter: 'P', base: 1, sell: true },
  dirt: { block: 2, letter: 'D', base: 0, sell: false },
  grass: { block: 1, letter: 'G', base: 0, sell: false },
  stone: { block: 3, letter: 'S', base: 0, sell: false },
  slate: { block: 4, letter: 'Sl', base: 0, sell: false },
  coal: { block: 5, letter: 'Co', base: 0, sell: false },
  sand: { block: 6, letter: 'Sa', base: 0, sell: false },
  gravel: { block: 7, letter: 'Gv', base: 0, sell: false },
  brickRed: { block: 8, letter: 'Br', base: 2, sell: true },
  brickGrey: { block: 9, letter: 'Bg', base: 0, sell: false },
  leaves: { block: 12, letter: 'Lv', base: 0, sell: false },
  woolBlue: { block: 13, letter: 'Wb', base: 3, sell: true },
  woolGreen: { block: 14, letter: 'Wg', base: 3, sell: true },
  woolRed: { block: 15, letter: 'Wr', base: 3, sell: true },
  woolTan: { block: 16, letter: 'Wt', base: 3, sell: true },
  snow: { block: 17, letter: 'Sn', base: 0, sell: false },
  ice: { block: 18, letter: 'I', base: 0, sell: false },
  redSand: { block: 19, letter: 'Rs', base: 0, sell: false },
  glass: { block: 20, letter: 'Gl', base: 2, sell: true },
  coreplate: { block: 21, letter: 'Cp', base: 0, sell: false, creativeOnly: true },
  workbench: { block: 22, letter: 'Wk', base: 5, sell: false },
  oven: { block: 23, letter: 'Ov', base: 5, sell: false },
  vend: { block: 24, letter: 'Vc', base: 15, sell: false },
  storeCounter: { block: 25, letter: 'Sc', base: 0, sell: false },
  bunk: { block: 26, letter: 'Bk', base: 16, sell: false },
  box: { block: 27, letter: 'Bx', base: 4, sell: false },
  door: { block: 30, letter: 'Dr', base: 2, sell: false },
  stick: { letter: 'Sk', base: 0, sell: false },
  doorGlass: { block: 32, letter: 'Gd', base: 0, sell: false },
  doorMetal: { block: 34, letter: 'Md', base: 0, sell: false },
  doorSliding: { block: 36, letter: 'Sg', base: 0, sell: false },
  lever: { block: 38, letter: 'Le', base: 0, sell: false },
  pushButton: { block: 40, letter: 'Pb', base: 0, sell: false },
  smelter: { block: 42, letter: 'Sm', base: 0, sell: false },
  fabricator: { block: 43, letter: 'Fb', base: 0, sell: false },
  ironOre: { block: 44, letter: 'Io', base: 0, sell: false },
  copperOre: { block: 45, letter: 'Oc', base: 0, sell: false },
  zincOre: { block: 46, letter: 'Zo', base: 0, sell: false },
  lantern: { block: 47, letter: 'Ln', base: 0, sell: false },
  charger: { block: 48, letter: 'Ch', base: 0, sell: false },
  ironIngot: { letter: 'Ii', base: 0, sell: false },
  copperIngot: { letter: 'Ci', base: 0, sell: false },
  zincIngot: { letter: 'Zi', base: 0, sell: false },
  steel: { letter: 'Se', base: 0, sell: false },
  copperWire: { letter: 'Cw', base: 0, sell: false },
  batteryCell: { letter: 'Bc', base: 0, sell: false },
  woodTool: { svg: 'woodTool', letter: 'Wd', tool: 'wood', base: 2, sell: false, stack: 1 },
  stoneTool: { svg: 'stoneTool', letter: 'So', tool: 'stone', base: 3, sell: false, stack: 1 },
  sapling: { block: 185, letter: 'Sp', base: 0, sell: false },
  berry: { svg: 'berry', letter: 'Be', cat: 'Food', base: 1, sell: true },
  wheat: { block: 28, letter: 'Wh', cat: 'Food', base: 2, sell: false },
  flour: { svg: 'flour', letter: 'Fl', cat: 'Food', base: 3, sell: true },
  sugar: { svg: 'sugar', letter: 'Su', cat: 'Food', base: 2, sell: true },
  cupcake: { svg: 'cupcake', letter: 'Cu', cat: 'Food', base: 6, sell: true },
  bread: { svg: 'bread', letter: 'Bd', cat: 'Food', base: 8, sell: true },
}
export const ITEM_BY_BLOCK = Object.fromEntries(Object.entries(ITEMS).filter(([, v]) => v.block).map(([k, v]) => [v.block, k]))
export function dropOf(blockId) {
  if (blockId === 1) return 'dirt'
  if (blockId === 28) return 'wheat'
  if (blockId === 29) return 'sugar'
  if (blockId >= 50 && blockId <= 57) return dropOf(blockId - 20)
  if (blockId === 31) return 'door'
  if (blockId === 33) return 'doorGlass'
  if (blockId === 35) return 'doorMetal'
  if (blockId === 37) return 'doorSliding'
  if (blockId === 39) return 'lever'
  if (blockId === 41) return 'pushButton'
  return ITEM_BY_BLOCK[blockId] || null
}
export function saplingRoll(x, y, z) {
  const h = (Math.imul(x | 0, 2246822519) + Math.imul(y | 0, 3266489917) + Math.imul(z | 0, 668265263)) >>> 0
  return h % 6 === 0
}
