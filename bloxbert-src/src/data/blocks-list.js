// Read-only block list. Shared by main.js and the icon test entry.
// Ids, names and keys stay frozen. Packs may insert after this base.
import { packBlocks, packOn } from '../packs/registry.js'

export const BASE_BLOCKS = [
  [1000, 'missing', 'gravel_stone', '?', null],
  [1, 'grass', ['grass_top', 'dirt', 'dirt_grass'], 'G', 'grass_top'],
  [2, 'dirt', 'dirt', 'D', 'dirt'],
  [3, 'stone', 'stone', 'S', 'stone'],
  [4, 'slate', 'greystone', 'Sl', 'greystone'],
  [5, 'coal', 'stone_coal', 'Co', 'stone_coal'],
  [6, 'sand', 'sand', 'Sa', 'sand'],
  [7, 'gravel', 'gravel_stone', 'Gv', 'gravel_stone'],
  [8, 'brickRed', 'brick_red', 'Br', 'brick_red'],
  [9, 'brickGrey', 'brick_grey', 'Bg', 'brick_grey'],
  [10, 'planks', 'wood', 'P', 'wood'],
  [11, 'log', ['trunk_top', 'trunk_top', 'trunk_side'], 'L', 'trunk_side'],
  [12, 'leaves', 'leaves', 'Lv', 'leaves'],
  [13, 'woolBlue', 'cotton_blue', 'Wb', 'cotton_blue'],
  [14, 'woolGreen', 'cotton_green', 'Wg', 'cotton_green'],
  [15, 'woolRed', 'cotton_red', 'Wr', 'cotton_red'],
  [16, 'woolTan', 'cotton_tan', 'Wt', 'cotton_tan'],
  [17, 'snow', 'snow', 'Sn', 'snow'],
  [18, 'ice', 'ice', 'I', 'ice'],
  [19, 'redSand', 'redsand', 'Rs', 'redsand'],
  [20, 'glass', 'glass', 'Gl', null],
  [21, 'coreplate', 'coreplate', 'Cp', null],
  [22, 'workbench', ['benchSide', 'benchSide', 'benchTop', 'wood', 'benchSide', 'benchSide'], 'Wk', null],
  [23, 'oven', 'ovenBrick', 'Ov', null],
  [24, 'vend', 'vend', 'Vc', null],
  [25, 'storeCounter', 'store', 'Sc', null],
  [26, 'bunk', 'bunk', 'Bk', null],
  [27, 'box', 'wrap_box', 'Bx', 'wood'],
  [30, 'door', 'wrap_door', 'Dr', 'wood'],
  [31, 'doorOpen', 'wrap_doorOpen', 'Do', 'wood'],
  [32, 'doorGlass', 'wrap_doorGlass', 'Gd', null],
  [33, 'doorGlassOpen', 'wrap_doorGlassOpen', 'Go', null],
  [34, 'doorMetal', 'wrap_doorMetal', 'Md', 'greystone'],
  [35, 'doorMetalOpen', 'wrap_doorMetalOpen', 'Mo', 'greystone'],
  [36, 'doorSliding', 'wrap_doorSliding', 'Sg', null],
  [37, 'doorSlidingOpen', 'wrap_doorSlidingOpen', 'So', null],
  [50, 'doorTop', 'wood', 'Dr', 'wood'],
  [51, 'doorTopOpen', 'wood', 'Do', 'wood'],
  [52, 'doorGlassTop', 'wrap_doorGlassTop', 'Gd', null],
  [53, 'doorGlassTopOpen', 'wrap_doorGlassTopOpen', 'Go', null],
  [54, 'doorMetalTop', 'greystone', 'Md', 'greystone'],
  [55, 'doorMetalTopOpen', 'greystone', 'Mo', 'greystone'],
  [56, 'doorSlidingTop', 'wrap_doorSlidingTop', 'Sg', null],
  [57, 'doorSlidingTopOpen', 'wrap_doorSlidingTopOpen', 'So', null],
  [38, 'lever', 'wrap_lever', 'Le', 'wood'],
  [39, 'leverOn', 'wood', 'Lo', 'wood'],
  [40, 'pushButton', 'wrap_pushButton', 'Pb', 'brick_red'],
  [41, 'pushButtonOn', 'brick_red', 'Pn', 'brick_red'],
  [42, 'smelter', 'wrap_smelter', 'Sm', 'brick_red'],
  [43, 'fabricator', 'wrap_fabricator', 'Fb', 'greystone'],
  [44, 'ironOre', 'wrap_ironOre', 'Io', 'brick_grey'],
  [45, 'copperOre', 'wrap_copperOre', 'Oc', 'stone_coal'],
  [46, 'zincOre', 'wrap_zincOre', 'Zo', 'greystone'],
  [47, 'lantern', 'wrap_lantern', 'Ln', null],
  [48, 'charger', 'wrap_charger', 'Ch', 'stone'],
  [64, 'water', 'ice', 'Wa', null],
  [69, 'woodshop', ['benchSide', 'benchSide', 'benchTop', 'wood', 'benchSide', 'benchSide'], 'Ws', null],
  [70, 'woodshopSide', ['benchSide', 'benchSide', 'benchTop', 'wood', 'benchSide', 'benchSide'], 'Ws', null],
  [71, 'clay', 'wrap_clay', 'Cy', 'dirt'],
]

function insertAfter(rows, key, extra) {
  if (!extra.length) return
  const i = rows.findIndex((r) => r[1] === key)
  if (i < 0) rows.push(...extra)
  else rows.splice(i + 1, 0, ...extra)
}

export function buildBlocks() {
  const rows = BASE_BLOCKS.map((r) => r.slice())
  if (packOn('farm')) {
    const byKey = new Map(packBlocks().filter((b) => b.row).map((b) => [b.key, b.row]))
    const take = (...keys) => keys.map((k) => byKey.get(k)).filter(Boolean)
    insertAfter(rows, 'box', take('wheat', 'reed'))
    insertAfter(rows, 'charger', take('farmland', 'tuft', 'cropSprout', 'cropLeafy', 'cropTall', 'cropRipe', 'farmlandWet'))
    insertAfter(rows, 'water', take('bushYoung', 'bushLeaf', 'bushFull', 'bushFruit'))
    insertAfter(rows, 'clay', take('sapling'))
  }
  if (packOn('decor')) {
    const byKey = new Map(packBlocks().filter((b) => b.row).map((b) => [b.key, b.row]))
    const take = (...keys) => keys.map((k) => byKey.get(k)).filter(Boolean)
    insertAfter(rows, 'clay', take('floorLampOff', 'floorLampOn', 'wallLampOff', 'wallLampOn', 'rugAnchor', 'rugPart'))
  }
  return rows
}

export const BLOCKS = buildBlocks()
