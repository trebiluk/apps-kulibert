// Procedural 16px pixel-art wraps. Seeded, deterministic, nearest-neighbor scaled x3 to 48px.
// Blocks fill the tile. Items are their own shape on a clear background, with a 1px dark outline.

export const PALETTE = {
  wood: ['#3a2415', '#5c3a1e', '#8b5a2b', '#c4a574', '#e8c27a'],
  stone: ['#2d2d2d', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#a0a0a0'],
  metal: ['#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1'],
  iron: ['#2d2d2d', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#c0c0c0'],
  copper: ['#5c2a1a', '#8b4513', '#b87333', '#d2691e', '#f4a460'],
  zinc: ['#3a3a3a', '#5a5a5a', '#7a7a7a', '#9a9a9a', '#c0c0c0'],
  steel: ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'],
  oreIron: ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#b87333'],
  oreCopper: ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#d2691e'],
  oreZinc: ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#a0a0a0'],
  glass: ['#608090', '#80b0c0', '#a0d0e0', '#c0e0f0', '#ffffff'],
  food: ['#5c3317', '#8b4513', '#d2691e', '#f4a460', '#ffd700'],
  cloth: ['#4a0000', '#8b0000', '#dc143c', '#ff6347', '#ffa07a'],
  clay: ['#5c4033', '#8b5a2b', '#a0522d', '#cd853f', '#deb887'],
  lantern: ['#1c1917', '#44403c', '#f4a460', '#ffd700', '#ffffff'],
  button: ['#3a2415', '#5c3a1e', '#8b0000', '#dc143c', '#ff6347'],
  lever: ['#3a2415', '#5c3a1e', '#8b5a2b', '#c4a574', '#4a4a4a'],
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function noise(seed, x, y) {
  const n = Math.imul(x + Math.imul(y, 57), seed) >>> 0;
  return (n % 1000) / 1000;
}

export function makeWrap(key, paintFn, paletteKey = 'stone', shape = false) {
  const pal = PALETTE[paletteKey] || PALETTE.stone;
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const tmp = document.createElement('canvas');
  tmp.width = tmp.height = 16;
  const tg = tmp.getContext('2d');
  tg.imageSmoothingEnabled = false;
  const img = tg.createImageData(16, 16);
  const data = img.data;
  const set = (x, y, colIdx) => {
    if (x < 0 || y < 0 || x >= 16 || y >= 16) return;
    const i = (y * 16 + x) * 4;
    const col = pal[Math.min(colIdx, pal.length - 1)];
    const r = parseInt(col.slice(1, 3), 16);
    const gg = parseInt(col.slice(3, 5), 16);
    const b = parseInt(col.slice(5, 7), 16);
    data[i] = r; data[i + 1] = gg; data[i + 2] = b; data[i + 3] = 255;
  };
  const seed = hash(key);
  if (!shape) {
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const n = noise(seed, x, y);
        const base = n < 0.6 ? 1 : n < 0.85 ? 2 : 3;
        set(x, y, base);
      }
    }
  }
  if (paintFn) paintFn(set, seed, pal);
  if (!shape) {
    for (let i = 0; i < 16; i++) {
      set(i, 15, 0);
      set(15, i, 0);
      set(i, 0, Math.min(4, pal.length - 1));
      set(0, i, Math.min(4, pal.length - 1));
    }
  } else {
    const dark = pal[0];
    const dr = parseInt(dark.slice(1, 3), 16);
    const dg = parseInt(dark.slice(3, 5), 16);
    const db = parseInt(dark.slice(5, 7), 16);
    const opaque = new Uint8Array(256);
    for (let i = 0; i < 256; i++) opaque[i] = data[i * 4 + 3] > 0 ? 1 : 0;
    const add = [];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const i = y * 16 + x;
        if (opaque[i]) continue;
        if ((x > 0 && opaque[i - 1]) || (x < 15 && opaque[i + 1]) || (y > 0 && opaque[i - 16]) || (y < 15 && opaque[i + 16])) add.push(i);
      }
    }
    for (const i of add) {
      const o = i * 4;
      data[o] = dr; data[o + 1] = dg; data[o + 2] = db; data[o + 3] = 255;
    }
  }
  tg.putImageData(img, 0, 0);
  g.drawImage(tmp, 0, 0, 48, 48);
  c.dataset.wrap = key;
  c.dataset.shape = shape ? '1' : '0';
  return c;
}

// Batch 1 wraps
export const WRAPS = {};

export function reg(key, fn, pal) {
  if (fn && fn.block) { WRAPS[key] = fn; return }
  const shape = () => makeWrap(key, fn, pal, true);
  const block = () => makeWrap(key, fn, pal, false);
  shape.block = block;
  WRAPS[key] = shape;
}

// Items
reg('stick', (set) => {
  for (let y = 2; y < 14; y++) set(7, y, 2);
  set(7, 2, 3); set(8, 3, 2);
}, 'wood');

reg('ironIngot', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) set(x, y, 3);
  set(5, 5, 4); set(10, 6, 2);
}, 'iron');

reg('copperIngot', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) set(x, y, 2);
  set(6, 5, 3); set(9, 7, 1);
}, 'copper');

reg('zincIngot', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) set(x, y, 2);
  set(5, 6, 3);
}, 'zinc');

reg('steel', (set) => {
  for (let y = 5; y < 11; y++) for (let x = 5; x < 11; x++) set(x, y, 2);
  set(6, 6, 3); set(9, 8, 1);
}, 'steel');

reg('copperWire', (set) => {
  for (let i = 2; i < 14; i++) set(i, 7 + Math.sin(i * 0.5) * 2 | 0, 2);
  set(3, 6, 3); set(12, 8, 1);
}, 'copper');

reg('batteryCell', (set) => {
  for (let y = 3; y < 13; y++) for (let x = 5; x < 11; x++) set(x, y, 1);
  set(6, 4, 3); set(9, 5, 4); set(7, 10, 0);
}, 'metal');

// Ores (stone with flecks)
reg('ironOre', (set, seed) => {
  for (let i = 0; i < 8; i++) {
    const x = 3 + (noise(seed, i, 1) * 10 | 0);
    const y = 3 + (noise(seed, i, 2) * 10 | 0);
    set(x, y, 4); set(x + 1, y, 3);
  }
}, 'oreIron');

reg('copperOre', (set, seed) => {
  for (let i = 0; i < 8; i++) {
    const x = 3 + (noise(seed, i, 1) * 10 | 0);
    const y = 3 + (noise(seed, i, 2) * 10 | 0);
    set(x, y, 4);
  }
}, 'oreCopper');

reg('zincOre', (set, seed) => {
  for (let i = 0; i < 6; i++) {
    const x = 4 + (noise(seed, i, 1) * 8 | 0);
    const y = 4 + (noise(seed, i, 2) * 8 | 0);
    set(x, y, 4);
  }
}, 'oreZinc');

// Blocks / icons
reg('box', (set) => {
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) set(x, y, 1);
  set(7, 6, 3); set(8, 6, 3); set(7, 7, 2); set(8, 7, 2); // latch
}, 'wood');

reg('door', (set) => {
  for (let y = 1; y < 15; y++) for (let x = 4; x < 12; x++) set(x, y, 1);
  set(10, 8, 3); // knob
  set(5, 4, 2); set(6, 4, 2); set(5, 5, 2);
}, 'wood');

reg('doorMetal', (set) => {
  for (let y = 1; y < 15; y++) for (let x = 4; x < 12; x++) set(x, y, 2);
  set(10, 8, 4); // knob
  for (let i = 2; i < 14; i += 3) set(5, i, 1);
}, 'metal');

reg('smelter', (set) => {
  for (let y = 4; y < 14; y++) for (let x = 3; x < 13; x++) set(x, y, 1);
  set(6, 6, 4); set(9, 6, 4); set(7, 9, 3); // glow
}, 'button');

reg('fabricator', (set) => {
  for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) set(x, y, 1);
  set(5, 5, 3); set(10, 5, 3); set(7, 8, 2); set(8, 8, 2);
}, 'metal');

reg('charger', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) set(x, y, 1);
  set(6, 6, 4); set(9, 6, 4); set(7, 9, 3);
}, 'stone');

reg('lantern', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 5; x < 11; x++) set(x, y, 1);
  set(6, 5, 3); set(9, 5, 3); set(7, 7, 4); set(8, 7, 4);
}, 'lantern');

reg('clay', (set) => {
  for (let y = 4; y < 12; y++) for (let x = 4; x < 12; x++) set(x, y, 2);
  set(6, 6, 1); set(9, 7, 3);
}, 'clay');

reg('pushButton', (set) => {
  for (let y = 6; y < 10; y++) for (let x = 5; x < 11; x++) set(x, y, 2);
  set(7, 7, 4); set(8, 7, 4);
}, 'button');

reg('lever', (set) => {
  for (let y = 6; y < 10; y++) set(7, y, 1);
  set(7, 5, 3); set(8, 6, 2); set(6, 8, 2);
}, 'lever');

// Tools. Pick head is 10px wide so it does not read as a stick.
reg('woodTool', (set) => {
  for (let y = 1; y <= 6; y++) for (let x = 3; x <= 12; x++) set(x, y, y < 3 ? 4 : 2)
  set(4, 2, 3); set(11, 2, 1)
  for (let y = 6; y <= 14; y++) for (let x = 6; x <= 9; x++) set(x, y, 1)
  set(7, 8, 3); set(8, 10, 2)
}, 'wood');

reg('stoneTool', (set) => {
  for (let y = 1; y <= 6; y++) for (let x = 3; x <= 12; x++) set(x, y, y < 3 ? 4 : 3)
  set(4, 2, 4); set(11, 2, 1)
  for (let y = 6; y <= 14; y++) for (let x = 6; x <= 9; x++) set(x, y, 1)
  set(7, 8, 2); set(8, 11, 0)
}, 'stone');

reg('hoe', (set) => {
  for (let i = 0; i < 10; i++) set(5 + i, 13 - i, 1);
  set(13, 3, 2); set(14, 3, 2); set(14, 4, 3); set(13, 4, 2);
}, 'wood');

// Open door states reuse closed
WRAPS.doorOpen = WRAPS.door;
WRAPS.doorMetalOpen = WRAPS.doorMetal;
WRAPS.doorTop = WRAPS.door;
WRAPS.doorTopOpen = WRAPS.door;
WRAPS.doorMetalTop = WRAPS.doorMetal;
WRAPS.doorMetalTopOpen = WRAPS.doorMetal;

export function getWrap(key) {
  return WRAPS[key] ? WRAPS[key]() : null;
}

export function getBlockWrap(key) {
  const f = WRAPS[key];
  if (!f) return null;
  return f.block ? f.block() : f();
}

// Batch 2 core: glass doors + woodshop tools
reg('doorGlass', (set) => {
  // frame
  for (let y = 1; y < 15; y++) { set(4, y, 1); set(11, y, 1); }
  for (let x = 4; x < 12; x++) { set(x, 1, 1); set(x, 14, 1); }
  // pane
  for (let y = 3; y < 13; y++) for (let x = 5; x < 11; x++) set(x, y, 3);
  set(6, 5, 4); set(9, 6, 2); // highlight
  set(10, 8, 1); // knob
}, 'glass');

reg('doorGlassOpen', WRAPS.doorGlass);
reg('doorGlassTop', WRAPS.doorGlass);
reg('doorGlassTopOpen', WRAPS.doorGlass);
reg('doorSliding', WRAPS.doorGlass);
reg('doorSlidingOpen', WRAPS.doorGlass);
reg('doorSlidingTop', WRAPS.doorGlass);
reg('doorSlidingTopOpen', WRAPS.doorGlass);

// Woodshop tools — diagonal handle + head
reg('measuringTape', (set) => {
  for (let i = 0; i < 9; i++) set(4 + i, 12 - i, 1);
  set(12, 3, 3); set(13, 3, 3); set(13, 4, 2); set(14, 4, 4); // tape head
}, 'metal');

reg('handSaw', (set) => {
  for (let y = 2; y <= 13; y++) for (let x = 2; x <= 5; x++) set(x, y, 1)
  set(3, 4, 3); set(4, 5, 4); set(4, 9, 0)
  for (let y = 4; y <= 8; y++) for (let x = 5; x <= 14; x++) set(x, y, y < 6 ? 4 : 3)
  for (let x = 6; x <= 14; x += 2) { set(x, 9, 2); set(x, 10, 1) }
}, 'metal');

reg('hammer', (set) => {
  for (let i = 0; i < 9; i++) set(5 + i, 13 - i, 1);
  set(12, 2, 2); set(13, 2, 2); set(13, 3, 3); set(14, 3, 2); set(12, 3, 2); // head
}, 'metal');

reg('safetyGlasses', (set) => {
  set(5, 6, 3); set(6, 6, 4); set(7, 6, 3);
  set(9, 6, 3); set(10, 6, 4); set(11, 6, 3);
  set(7, 7, 1); set(8, 7, 1); set(9, 7, 1); // bridge
  set(4, 8, 2); set(12, 8, 2); // arms
}, 'glass');

// Pull pack-owned art so packs keep their wraps
import '../packs/farm/art.js';
import '../packs/decor/art.js';


import { registerFarmArt } from '../packs/farm/art.js';
import { registerDecorArt } from '../packs/decor/art.js';
registerFarmArt(reg);
registerDecorArt(reg);
