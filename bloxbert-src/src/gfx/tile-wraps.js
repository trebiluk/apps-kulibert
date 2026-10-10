// Runtime canvas atlas for pixel-art block wraps. Registers new materials.
import { getWrap, WRAPS } from './pixel-art.js';

const BLOCK_WRAPS = [
  'box', 'door', 'doorMetal', 'smelter', 'fabricator', 'charger', 'lantern', 'clay',
  'pushButton', 'lever', 'ironOre', 'copperOre', 'zincOre',
  'doorOpen', 'doorMetalOpen', 'doorTop', 'doorTopOpen', 'doorMetalTop', 'doorMetalTopOpen',
];

export function buildTileAtlas() {
  const size = 16;
  const pad = 2;
  const layer = size + pad * 2;
  const depth = BLOCK_WRAPS.length;
  const canvas = document.createElement('canvas');
  canvas.width = layer;
  canvas.height = layer * depth;
  const g = canvas.getContext('2d');
  g.imageSmoothingEnabled = false;
  const indices = {};
  BLOCK_WRAPS.forEach((key, i) => {
    const wrap = getWrap(key);
    if (!wrap) return;
    // Draw the 16px core with 2px gutter (copy edges)
    const tmp = document.createElement('canvas');
    tmp.width = tmp.height = 16;
    const tg = tmp.getContext('2d');
    tg.drawImage(wrap, 0, 0, 48, 48, 0, 0, 16, 16);
    const y = i * layer;
    // Center core
    g.drawImage(tmp, pad, y + pad);
    // Gutters: copy edges
    g.drawImage(tmp, 0, 0, 1, 16, pad - 1, y + pad, 1, 16); // left
    g.drawImage(tmp, 15, 0, 1, 16, pad + 16, y + pad, 1, 16); // right
    g.drawImage(tmp, 0, 0, 16, 1, pad, y + pad - 1, 16, 1); // top
    g.drawImage(tmp, 0, 15, 16, 1, pad, y + pad + 16, 16, 1); // bottom
    indices[key] = i;
  });
  return { canvas, indices, layer };
}

export function registerWrapMaterials(noa) {
  const { canvas, indices } = buildTileAtlas();
  const dataURL = canvas.toDataURL('image/png');
  // Register each as its own material pointing at the atlas layer
  for (const [key, idx] of Object.entries(indices)) {
    const matName = 'wrap_' + key;
    noa.registry.registerMaterial(matName, {
      textureURL: dataURL,
      atlasIndex: idx,
    });
  }
  return indices;
}

export function wrapMaterialFor(key) {
  return WRAPS[key] ? 'wrap_' + key : null;
}
