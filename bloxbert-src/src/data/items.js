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
  berry: { svg: 'berry', letter: 'Be', cat: 'Food', base: 1, sell: true },
  flour: { svg: 'flour', letter: 'Fl', cat: 'Food', base: 3, sell: true },
  sugar: { svg: 'sugar', letter: 'Su', cat: 'Food', base: 2, sell: true },
  cupcake: { svg: 'cupcake', letter: 'Cu', cat: 'Food', base: 6, sell: true },
  bread: { svg: 'bread', letter: 'Bd', cat: 'Food', base: 8, sell: true },
}
export const ITEM_BY_BLOCK = Object.fromEntries(Object.entries(ITEMS).filter(([, v]) => v.block).map(([k, v]) => [v.block, k]))
export function dropOf(blockId) {
  if (blockId === 1) return 'dirt'
  return ITEM_BY_BLOCK[blockId] || null
}
