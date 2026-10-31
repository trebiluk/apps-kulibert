#!/usr/bin/env python3
"""Bertopia pack art, part 1. Original 64px masters plus legacy faces.

Writes assets/packs/classic and assets/packs/mystical.
Masters: grass top, dirt, stone, log, planks, leaves (+ leaves under), sand, coal.
Every other ids.js key is a nearest-neighbor x2 of today's atlas tile, or the
same 16px wrap the game already draws, scaled x4. Those entries are marked
"comment": "legacy". Run: python3 tools/gen64.py
"""
import json
import math
import os
from PIL import Image
import texpack2

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
ATLAS_PATH = os.path.join(ROOT, 'assets', 'atlas.png')
GLASS_PATH = os.path.join(ROOT, 'assets', 'glass.png')
ATLAS_JSON = json.load(open(os.path.join(ROOT, 'assets', 'atlas.json'), encoding='utf8'))
IDS_JS = os.path.join(ROOT, 'src', 'data', 'ids.js')

# Same layer order as assets/atlas.json so old indices still line up.
ATLAS_ORDER = list(ATLAS_JSON.keys())


def imul(a, b):
    a &= 0xFFFFFFFF
    b &= 0xFFFFFFFF
    if a >= 0x80000000:
        a -= 0x100000000
    if b >= 0x80000000:
        b -= 0x100000000
    return (a * b) & 0xFFFFFFFF


def hash_key(s):
    h = 2166136261
    for ch in s:
        h = imul((h ^ ord(ch)) & 0xFFFFFFFF, 16777619)
    return h & 0xFFFFFFFF


def noise(seed, x, y):
    n = imul((x + imul(y, 57)) & 0xFFFFFFFF, seed)
    return (n % 1000) / 1000.0


def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


PAL = {
    'wood': ['#3a2415', '#5c3a1e', '#8b5a2b', '#c4a574', '#e8c27a'],
    'stone': ['#2d2d2d', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#a0a0a0'],
    'metal': ['#1c1917', '#44403c', '#78716c', '#a8a29e', '#d6d3d1'],
    'iron': ['#2d2d2d', '#4a4a4a', '#6b6b6b', '#8c8c8c', '#c0c0c0'],
    'copper': ['#5c2a1a', '#8b4513', '#b87333', '#d2691e', '#f4a460'],
    'zinc': ['#3a3a3a', '#5a5a5a', '#7a7a7a', '#9a9a9a', '#c0c0c0'],
    'steel': ['#1f2937', '#374151', '#4b5563', '#6b7280', '#9ca3af'],
    'oreIron': ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#b87333'],
    'oreCopper': ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#d2691e'],
    'oreZinc': ['#4a4a4a', '#6b6b6b', '#8c8c8c', '#2d2d2d', '#a0a0a0'],
    'glass': ['#608090', '#80b0c0', '#a0d0e0', '#c0e0f0', '#e8eef2'],
    'clay': ['#5c4033', '#8b5a2b', '#a0522d', '#cd853f', '#deb887'],
    'lantern': ['#1c1917', '#44403c', '#f4a460', '#e6b422', '#e8e0c8'],
    'button': ['#3a2415', '#5c3a1e', '#8b0000', '#dc143c', '#e07060'],
    'lever': ['#3a2415', '#5c3a1e', '#8b5a2b', '#c4a574', '#4a4a4a'],
    'food': ['#5c3317', '#8b4513', '#d2691e', '#f4a460', '#e6c45a'],
    'cloth': ['#4a0000', '#8b0000', '#dc143c', '#e07060', '#e8a090'],
    'birch': ['#3a2c22', '#d8c7a4', '#f3ead6', '#e8e0d0', '#1a140f'],
    'birchLeaf': ['#245018', '#7cbc4e', '#a6dc78', '#cfeab0', '#3e7a2c'],
    'pine': ['#1a140f', '#4a3b2e', '#2e261e', '#6a5644', '#100c09'],
    'pineLeaf': ['#0c1c10', '#16321c', '#1e4628', '#102616', '#08140c'],
}


def make_wrap(key, paint, pal_name):
    pal = [hex_rgb(c) for c in PAL[pal_name]]
    img = Image.new('RGBA', (16, 16), (0, 0, 0, 255))
    px = img.load()
    seed = hash_key(key)

    def setp(x, y, col):
        if x < 0 or y < 0 or x >= 16 or y >= 16:
            return
        rgb = pal[min(col, len(pal) - 1)]
        px[x, y] = (rgb[0], rgb[1], rgb[2], 255)

    for y in range(16):
        for x in range(16):
            n = noise(seed, x, y)
            base = 1 if n < 0.6 else 2 if n < 0.85 else 3
            setp(x, y, base)
    if paint:
        paint(setp, seed)
    for i in range(16):
        setp(i, 15, 0)
        setp(15, i, 0)
        setp(i, 0, min(4, len(pal) - 1))
        setp(0, i, min(4, len(pal) - 1))
    return img.resize((64, 64), Image.Resampling.NEAREST)


def paint_iron(setp, seed):
    for i in range(8):
        x = 3 + int(noise(seed, i, 1) * 10)
        y = 3 + int(noise(seed, i, 2) * 10)
        setp(x, y, 4)
        setp(x + 1, y, 3)


def paint_copper(setp, seed):
    for i in range(8):
        x = 3 + int(noise(seed, i, 1) * 10)
        y = 3 + int(noise(seed, i, 2) * 10)
        setp(x, y, 4)


def paint_zinc(setp, seed):
    for i in range(6):
        x = 4 + int(noise(seed, i, 1) * 8)
        y = 4 + int(noise(seed, i, 2) * 8)
        setp(x, y, 4)


def paint_box(setp, seed):
    for y in range(3, 13):
        for x in range(3, 13):
            setp(x, y, 1)
    setp(7, 6, 3)
    setp(8, 6, 3)
    setp(7, 7, 2)
    setp(8, 7, 2)


def paint_door(setp, seed):
    for y in range(1, 15):
        for x in range(4, 12):
            setp(x, y, 1)
    setp(10, 8, 3)
    setp(5, 4, 2)
    setp(6, 4, 2)
    setp(5, 5, 2)


def paint_door_metal(setp, seed):
    for y in range(1, 15):
        for x in range(4, 12):
            setp(x, y, 2)
    setp(10, 8, 4)
    for i in range(2, 14, 3):
        setp(5, i, 1)


def paint_smelter(setp, seed):
    for y in range(4, 14):
        for x in range(3, 13):
            setp(x, y, 1)
    setp(6, 6, 4)
    setp(9, 6, 4)
    setp(7, 9, 3)


def paint_fab(setp, seed):
    for y in range(3, 13):
        for x in range(3, 13):
            setp(x, y, 1)
    setp(5, 5, 3)
    setp(10, 5, 3)
    setp(7, 8, 2)
    setp(8, 8, 2)


def paint_charger(setp, seed):
    for y in range(4, 12):
        for x in range(4, 12):
            setp(x, y, 1)
    setp(6, 6, 4)
    setp(9, 6, 4)
    setp(7, 9, 3)


def paint_lantern(setp, seed):
    for y in range(4, 12):
        for x in range(5, 11):
            setp(x, y, 1)
    setp(6, 5, 3)
    setp(9, 5, 3)
    setp(7, 7, 4)
    setp(8, 7, 4)


def paint_clay(setp, seed):
    for y in range(4, 12):
        for x in range(4, 12):
            setp(x, y, 2)
    setp(6, 6, 1)
    setp(9, 7, 3)


def paint_button(setp, seed):
    for y in range(6, 10):
        for x in range(5, 11):
            setp(x, y, 2)
    setp(7, 7, 4)
    setp(8, 7, 4)


def paint_lever(setp, seed):
    for y in range(6, 10):
        setp(7, y, 1)
    setp(7, 5, 3)
    setp(8, 6, 2)
    setp(6, 8, 2)


def paint_door_glass(setp, seed):
    for y in range(1, 15):
        setp(4, y, 1)
        setp(11, y, 1)
    for x in range(4, 12):
        setp(x, 1, 1)
        setp(x, 14, 1)
    for y in range(3, 13):
        for x in range(5, 11):
            setp(x, y, 3)
    setp(6, 5, 4)
    setp(9, 6, 2)
    setp(10, 8, 1)


def paint_wheat(setp, seed):
    for y in range(3, 13):
        setp(8, y, 2)
    setp(7, 4, 3)
    setp(9, 5, 3)
    setp(7, 7, 3)
    setp(9, 8, 3)


def paint_sprout(setp, seed):
    setp(8, 11, 1)
    setp(8, 10, 2)
    setp(7, 9, 3)


def paint_leafy(setp, seed):
    setp(8, 12, 1)
    setp(8, 11, 2)
    setp(7, 10, 3)
    setp(9, 10, 3)
    setp(8, 9, 3)


def paint_tall(setp, seed):
    setp(8, 13, 1)
    setp(8, 12, 2)
    setp(7, 11, 3)
    setp(9, 11, 3)
    setp(8, 10, 3)
    setp(6, 9, 2)


def paint_ripe(setp, seed):
    setp(8, 13, 1)
    setp(8, 12, 2)
    setp(7, 11, 3)
    setp(9, 11, 3)
    setp(7, 8, 4)
    setp(9, 8, 4)
    setp(8, 7, 4)


def paint_bush_young(setp, seed):
    setp(8, 11, 1)
    setp(8, 10, 2)
    setp(7, 9, 3)
    setp(9, 9, 3)


def paint_bush_leaf(setp, seed):
    setp(8, 12, 1)
    setp(7, 10, 2)
    setp(8, 10, 3)
    setp(9, 10, 2)
    setp(8, 9, 3)


def paint_bush_full(setp, seed):
    setp(8, 12, 1)
    setp(6, 9, 2)
    setp(7, 9, 3)
    setp(8, 9, 3)
    setp(9, 9, 3)
    setp(10, 9, 2)
    setp(7, 8, 3)
    setp(9, 8, 3)


def paint_bush_fruit(setp, seed):
    paint_bush_full(setp, seed)
    setp(7, 7, 4)
    setp(9, 7, 4)
    setp(8, 6, 4)


def paint_floor_off(setp, seed):
    for y in range(4, 12):
        setp(8, y, 2)
    for x in range(6, 11):
        setp(x, 3, 4)
    setp(7, 12, 3)
    setp(8, 12, 3)
    setp(9, 12, 3)


def paint_floor_on(setp, seed):
    for y in range(4, 12):
        setp(8, y, 1)
    setp(6, 3, 3)
    setp(7, 3, 4)
    setp(8, 3, 4)
    setp(9, 3, 4)
    setp(10, 3, 3)
    setp(7, 12, 2)
    setp(8, 12, 2)
    setp(9, 12, 2)


def paint_wall_off(setp, seed):
    setp(4, 8, 2)
    setp(5, 8, 2)
    setp(6, 8, 2)
    setp(7, 6, 4)
    setp(8, 6, 4)
    setp(9, 6, 4)
    setp(8, 7, 4)


def paint_wall_on(setp, seed):
    setp(4, 8, 1)
    setp(5, 8, 1)
    setp(6, 8, 1)
    setp(7, 6, 3)
    setp(8, 6, 4)
    setp(9, 6, 4)
    setp(8, 7, 3)


def paint_rug(setp, seed):
    for y in range(5, 11):
        for x in range(3, 13):
            setp(x, y, 2)
    for x in range(4, 12):
        setp(x, 6, 3)
        setp(x, 9, 3)
    setp(5, 7, 4)
    setp(10, 8, 1)


def paint_rug_anchor(setp, seed):
    for y in range(5, 11):
        for x in range(3, 13):
            setp(x, y, 2)
    for x in range(4, 12):
        setp(x, 6, 3)
        setp(x, 9, 3)


def paint_rug_part(setp, seed):
    for y in range(5, 11):
        for x in range(3, 13):
            setp(x, y, 2)


def column(setp, x0, x1, c):
    for y in range(1, 15):
        for x in range(x0, x1 + 1):
            setp(x, y, c)


def paint_birch_log(setp, seed):
    column(setp, 4, 11, 3)
    for y in range(2, 14, 3):
        setp(5, y, 4)
        setp(7, y, 4)
        setp(9, y, 4)
        setp(6, y + 1, 4)
    setp(4, 1, 1)
    setp(11, 14, 1)


def paint_birch_leaves(setp, seed):
    for y in range(4, 12):
        for x in range(4, 12):
            if (x + y) % 5 != 0:
                setp(x, y, 2)
    setp(6, 5, 3)
    setp(9, 6, 3)
    setp(7, 9, 1)
    setp(10, 10, 3)
    setp(5, 8, 4)


def paint_birch_planks(setp, seed):
    for x in range(2, 14):
        for y in range(2, 5):
            setp(x, y, 3)
        for y in range(6, 9):
            setp(x, y, 2)
        for y in range(10, 13):
            setp(x, y, 3)
    setp(4, 3, 4)
    setp(9, 7, 1)
    setp(6, 11, 4)


def paint_pine_log(setp, seed):
    column(setp, 5, 10, 2)
    for y in range(3, 13, 4):
        setp(6, y, 0)
        setp(8, y, 4)
        setp(7, y + 1, 0)


def paint_pine_needles(setp, seed):
    for y in range(2, 14):
        w = 1 if y < 5 else 2 if y < 8 else 3 if y < 11 else 2
        for x in range(8 - w, 8 + w + 1):
            setp(x, y, 2 if (x + y) % 3 == 0 else 1)
    setp(8, 3, 3)
    setp(7, 7, 0)
    setp(9, 10, 2)


def paint_pine_planks(setp, seed):
    for x in range(3, 13):
        for y in range(2, 5):
            setp(x, y, 1)
        for y in range(6, 9):
            setp(x, y, 2)
        for y in range(10, 13):
            setp(x, y, 3)
    setp(5, 3, 0)
    setp(9, 7, 4)
    setp(7, 11, 0)


def paint_tech_cell(setp, seed):
    for y in range(3, 13):
        for x in range(5, 11):
            setp(x, y, 1)
    setp(6, 4, 3)
    setp(9, 5, 4)
    setp(7, 11, 0)
    setp(8, 2, 2)


def paint_tech_line(setp, seed):
    for x in range(1, 15):
        setp(x, 8, 2)
    setp(2, 7, 3)
    setp(13, 9, 1)
    setp(8, 8, 4)


def paint_tech_switch(setp, seed):
    for x in range(4, 12):
        setp(x, 11, 1)
    setp(8, 10, 2)
    setp(9, 8, 2)
    setp(10, 6, 3)
    setp(11, 5, 4)


def paint_tech_switch_on(setp, seed):
    for x in range(4, 12):
        setp(x, 11, 1)
    setp(8, 10, 2)
    setp(7, 8, 3)
    setp(6, 6, 4)
    setp(5, 5, 4)


def paint_tech_button(setp, seed):
    for y in range(5, 11):
        for x in range(5, 11):
            setp(x, y, 1)
    setp(7, 7, 4)
    setp(8, 7, 4)
    setp(7, 8, 3)
    setp(8, 8, 3)


def paint_tech_button_on(setp, seed):
    for y in range(6, 11):
        for x in range(5, 11):
            setp(x, y, 2)
    setp(7, 8, 4)
    setp(8, 8, 4)


WRAPS = {
    'box': (paint_box, 'wood'),
    'door': (paint_door, 'wood'),
    'doorMetal': (paint_door_metal, 'metal'),
    'smelter': (paint_smelter, 'button'),
    'fabricator': (paint_fab, 'metal'),
    'charger': (paint_charger, 'stone'),
    'lantern': (paint_lantern, 'lantern'),
    'clay': (paint_clay, 'clay'),
    'pushButton': (paint_button, 'button'),
    'lever': (paint_lever, 'lever'),
    'ironOre': (paint_iron, 'oreIron'),
    'copperOre': (paint_copper, 'oreCopper'),
    'zincOre': (paint_zinc, 'oreZinc'),
    'doorGlass': (paint_door_glass, 'glass'),
    'wheat': (paint_wheat, 'food'),
    'cropSprout': (paint_sprout, 'food'),
    'cropLeafy': (paint_leafy, 'food'),
    'cropTall': (paint_tall, 'food'),
    'cropRipe': (paint_ripe, 'food'),
    'bushYoung': (paint_bush_young, 'food'),
    'bushLeaf': (paint_bush_leaf, 'food'),
    'bushFull': (paint_bush_full, 'food'),
    'bushFruit': (paint_bush_fruit, 'food'),
    'floorLampOff': (paint_floor_off, 'lantern'),
    'floorLampOn': (paint_floor_on, 'lantern'),
    'wallLampOff': (paint_wall_off, 'lantern'),
    'wallLampOn': (paint_wall_on, 'lantern'),
    'rugAnchor': (paint_rug_anchor, 'cloth'),
    'rugPart': (paint_rug_part, 'cloth'),
    'birchLog': (paint_birch_log, 'birch'),
    'birchLeaves': (paint_birch_leaves, 'birchLeaf'),
    'birchPlanks': (paint_birch_planks, 'birch'),
    'pineLog': (paint_pine_log, 'pine'),
    'pineNeedles': (paint_pine_needles, 'pineLeaf'),
    'pinePlanks': (paint_pine_planks, 'pine'),
    'techCell': (paint_tech_cell, 'metal'),
    'techLine': (paint_tech_line, 'copper'),
    'techSwitch': (paint_tech_switch, 'copper'),
    'techSwitchOn': (paint_tech_switch_on, 'copper'),
    'techButton': (paint_tech_button, 'copper'),
    'techButtonOn': (paint_tech_button_on, 'copper'),
}

# Same picture as another wrap key.
WRAP_ALIAS = {
    'doorOpen': 'door',
    'doorTop': 'door',
    'doorTopOpen': 'door',
    'doorMetalOpen': 'doorMetal',
    'doorMetalTop': 'doorMetal',
    'doorMetalTopOpen': 'doorMetal',
    'doorGlassOpen': 'doorGlass',
    'doorGlassTop': 'doorGlass',
    'doorGlassTopOpen': 'doorGlass',
    'doorSliding': 'doorGlass',
    'doorSlidingOpen': 'doorGlass',
    'doorSlidingTop': 'doorGlass',
    'doorSlidingTopOpen': 'doorGlass',
    'pushButtonOn': 'pushButton',
    'leverOn': 'lever',
}


def frozen_keys():
    keys = []
    for line in open(IDS_JS, encoding='utf8'):
        line = line.strip()
        if not line or line.startswith('//') or line.startswith('export') or line.startswith('}'):
            continue
        if ':' not in line or line.startswith('{'):
            continue
        if line.startswith('id:') or line.startswith('key:') or line.startswith('mat:'):
            continue
        name = line.split(':', 1)[0].strip()
        if name.isidentifier() and name not in ('id', 'key', 'mat', 'letter', 'open'):
            if name[0].islower() or name[0].isupper():
                # FROZEN object keys only. Stop at REGISTRY.
                if name == 'REGISTRY':
                    break
                keys.append(name)
    # The parser also walks REGISTRY lines if we don't stop. Filter known.
    out = []
    seen = set()
    started = False
    for line in open(IDS_JS, encoding='utf8'):
        if 'export const FROZEN' in line:
            started = True
            continue
        if not started:
            continue
        if line.startswith('}'):
            break
        s = line.strip()
        if not s or s.startswith('//'):
            continue
        name = s.split(':', 1)[0].strip()
        if name.isidentifier() and name not in seen:
            seen.add(name)
            out.append(name)
    return out


def new_image():
    return Image.new('RGBA', (64, 64), (0, 0, 0, 255))


def fill_noise(px, cols, salt):
    for y in range(64):
        for x in range(64):
            h = (x * 13 + y * 29 + salt * 17 + (x // 3) * 3) & 255
            px[x, y] = cols[h % len(cols)] + (255,)


def put(px, x, y, rgb):
    if 0 <= x < 64 and 0 <= y < 64:
        px[x, y] = (rgb[0], rgb[1], rgb[2], 255)


# 2.5.545 calm art. Grass, sand and water are drawn on a 32 x 32 grid of 2x2
# cells, so every shape survives the 32px box-average exactly. Flat base color
# plus a few deliberate shapes. No per-pixel random speckle. All shapes wrap,
# so tiles join without seams.
def cell(px, cx, cy, rgb):
    cx %= 32
    cy %= 32
    for dy in range(2):
        for dx in range(2):
            px[cx * 2 + dx, cy * 2 + dy] = (rgb[0], rgb[1], rgb[2], 255)


def fill_flat(px, rgb):
    for y in range(64):
        for x in range(64):
            px[x, y] = (rgb[0], rgb[1], rgb[2], 255)


def spot_jitter(sx, sy, salt):
    # Fixed little shuffle so blade clusters do not line up in rows.
    n = (sx * 7 + sy * 13 + salt * 5) % 9
    return n % 3, n // 3


def blade_cluster(px, cx, cy, tall, wide, tip, body, root):
    # A short clump: 1 or 2 columns, 2-3 cells tall, bright tip, dark root cell.
    for col in range(wide):
        h = tall - (1 if col == 1 else 0)
        for i in range(h):
            if i == 0:
                c = tip
            elif i == h - 1:
                c = root
            else:
                c = body
            cell(px, cx + col, cy + i, c)


def draw_grass(px, mystical):
    if mystical:
        base, root, body, tip = (96, 62, 128), (74, 46, 104), (108, 72, 140), (128, 92, 158)
        fleck_a, fleck_b = (46, 130, 124), (38, 112, 108)
    else:
        base, root, body, tip = (60, 132, 46), (36, 94, 34), (72, 148, 52), (98, 170, 66)
    fill_flat(px, base)
    for sy in range(8):
        for sx in range(8):
            if (sx * 5 + sy * 3) % 7 == 0:
                continue  # leave some calm ground between clumps
            jx, jy = spot_jitter(sx, sy, 1)
            cx = sx * 4 + jx
            cy = sy * 4 + jy
            tall = 3 if (sx + sy * 2) % 3 else 2
            wide = 2 if (sx * 3 + sy) % 4 < 2 else 1
            blade_cluster(px, cx, cy, tall, wide, tip, body, root)
    if mystical:
        # Teal flecks: pairs, no glow, a dozen in the whole tile.
        for k in range(12):
            fx = (k * 11 + 3) % 32
            fy = (k * 7 + k // 3 * 5 + 2) % 32
            cell(px, fx, fy, fleck_a)
            cell(px, fx + 1, fy, fleck_b)


def draw_dirt(px, mystical):
    if mystical:
        fill_noise(px, [(92, 62, 84), (70, 48, 64), (110, 78, 96), (58, 40, 52)], 4)
        for y in range(8, 56, 10):
            for x in range(6, 58, 12):
                put(px, x, y, (46, 120, 116))
                put(px, x + 1, y, (46, 120, 116))
    else:
        fill_noise(px, [(120, 78, 42), (90, 58, 32), (140, 96, 54), (70, 46, 28), (150, 108, 64)], 2)
        for y in range(64):
            for x in range(64):
                if (x * 7 + y * 5) % 41 == 0:
                    put(px, x, y, (60, 40, 28))
                    put(px, x + 1, y, (168, 140, 100))


def draw_stone(px, mystical):
    if mystical:
        fill_noise(px, [(96, 88, 112), (112, 104, 128), (78, 82, 100), (124, 116, 138)], 5)
        vein = (46, 120, 116)
        crack = (52, 46, 64)
    else:
        # 2.5.550: cool mid-grey stone (spec #7A7D80, tones #6A6D70-#8E9194), cool cracks, not brown.
        fill_noise(px, [(122, 125, 128), (110, 113, 116), (142, 145, 148), (116, 119, 122)], 6)
        vein = None
        crack = (68, 71, 75)
    for y0 in range(6, 58, 13):
        yy = y0
        for x in range(2, 62):
            if (x // 4) % 2 == 0:
                yy = y0 + (1 if (x // 2) % 2 == 0 else 0)
            yy = max(1, min(61, yy))
            put(px, x, yy, crack)
            put(px, x, yy + 1, crack)
    for x0 in range(8, 56, 15):
        xx = x0
        for y in range(2, 62):
            if (y // 5) % 2 == 0:
                xx = x0 + (1 if (y // 3) % 2 == 0 else 0)
            xx = max(1, min(61, xx))
            put(px, xx, y, crack)
            put(px, xx + 1, y, crack)
    if vein:
        for i in range(6, 58):
            x = i
            y = 12 + int(7 * math.sin(i * 0.22)) + i // 5
            put(px, x, y, vein)
            put(px, x, y + 1, vein)
            put(px, x + 1, y, (36, 100, 98))


def draw_log_side(px, mystical):
    if mystical:
        for y in range(64):
            for x in range(64):
                v = math.sin(x * 0.16 + y * 0.42)
                if v > 0.35:
                    c = (46, 120, 118)
                elif v > -0.15:
                    c = (98, 64, 120)
                else:
                    c = (62, 40, 78)
                put(px, x, y, c)
    else:
        cols = [(92, 58, 32), (60, 38, 20), (140, 96, 58), (74, 48, 26)]
        for x in range(64):
            band = cols[(x // 8) % 4]
            for y in range(64):
                c = band
                if (y * 3 + x) % 17 == 0:
                    c = (40, 26, 14)
                put(px, x, y, c)


def draw_log_top(px, mystical):
    for y in range(64):
        for x in range(64):
            dx = x - 31.5
            dy = y - 31.5
            r = math.hypot(dx, dy)
            ang = math.atan2(dy, dx)
            if mystical:
                v = math.sin(ang * 3 + r * 0.45)
                if r > 30:
                    c = (40, 28, 52)
                elif v > 0.2:
                    c = (46, 120, 118)
                elif int(r) // 4 % 2 == 0:
                    c = (110, 74, 132)
                else:
                    c = (68, 44, 86)
            else:
                if r < 4:
                    c = (50, 32, 18)
                elif r > 30:
                    c = (58, 36, 20)
                elif int(r) // 4 % 2 == 0:
                    c = (130, 90, 52)
                else:
                    c = (86, 56, 30)
            put(px, x, y, c)


def draw_planks(px, mystical):
    if mystical:
        boards = [(110, 74, 132), (86, 56, 108), (124, 90, 146), (74, 48, 96)]
        seam = (46, 110, 108)
        knot = (62, 40, 78)
    else:
        boards = [(196, 164, 110), (168, 132, 78), (210, 176, 122), (150, 112, 64)]
        seam = (90, 58, 32)
        knot = (120, 78, 40)
    for y in range(64):
        band = y // 16
        for x in range(64):
            c = boards[band % 4]
            if y % 16 < 2:
                c = seam
            elif (x + band * 5) % 19 == 0 and 4 < (y % 16) < 13:
                c = knot
            put(px, x, y, c)


def draw_leaves(px, mystical, under=False):
    if under and mystical:
        fill_noise(px, [(58, 32, 86), (74, 42, 104), (46, 26, 70), (90, 56, 120)], 9)
        return
    if mystical:
        fill_noise(px, [(70, 48, 110), (46, 110, 108), (92, 60, 130), (38, 88, 90), (120, 80, 150)], 8)
    else:
        # 2.5.550: canopy lifted off near-black (spec 15-85% luminance, 3-5 tones).
        fill_noise(px, [(78, 122, 58), (64, 104, 48), (92, 138, 66), (70, 112, 52), (58, 94, 44)], 7)
    # A few darker pockets so the canopy is not a flat slab.
    for y in range(4, 60, 9):
        for x in range(4, 60, 11):
            col = (30, 20, 48) if mystical else (50, 82, 40)
            for dy in range(3):
                for dx in range(3):
                    if dx + dy < 4:
                        put(px, x + dx, y + dy, col)


# 2.5.550: birch gets real pack art (was the legacy 16px wrap in both packs).
def draw_birch_log(px, mystical):
    if mystical:
        bark, tone, mark = (168, 156, 186), (152, 140, 172), (70, 56, 88)
    else:
        bark, tone, mark = (200, 192, 170), (182, 174, 152), (64, 58, 50)
    fill_noise(px, [bark, tone, bark, (bark[0] - 8, bark[1] - 8, bark[2] - 8)], 3)
    # Short dark horizontal dashes: birch reads by its marks, not by color.
    for k in range(14):
        y = (k * 9 + 3) % 60
        x = (k * 23 + 5) % 52
        w = 6 + (k % 3) * 2
        for dx in range(w):
            put(px, x + dx, y, mark)
            put(px, x + dx, y + 1, mark)


def draw_birch_leaves(px, mystical):
    if mystical:
        cols = [(120, 140, 120), (104, 124, 106), (136, 156, 132), (96, 116, 100)]
        pocket = (80, 98, 86)
    else:
        cols = [(112, 150, 70), (98, 134, 60), (128, 166, 82), (104, 142, 64)]
        pocket = (82, 112, 50)
    fill_noise(px, cols, 11)
    for y in range(3, 60, 8):
        for x in range(3 + (y // 8 % 2) * 4, 60, 10):
            for d in range(3):
                put(px, x + d, y, pocket)
                put(px, x + 1, y + d - 1, pocket)


def draw_sand(px, mystical):
    if mystical:
        base, ripple, grain = (136, 116, 166), (112, 94, 142), (162, 140, 188)
    else:
        base, ripple, grain = (204, 180, 122), (174, 148, 92), (220, 198, 142)
    fill_flat(px, base)
    # Soft ripple lines: a run of cells that steps up one row halfway.
    for r in range(4):
        y0 = 3 + r * 8
        x0 = (r * 11 + 2) % 32
        for seg in range(2):
            xs = x0 + seg * 16
            for i in range(7):
                step = 0 if i < 4 else -1
                cell(px, xs + i, y0 + step, ripple)
            # light edge just under the line, shorter than the line
            for i in range(1, 5):
                step = 0 if i < 4 else -1
                cell(px, xs + i, y0 + step + 1, grain)
    # A few grain pairs.
    for k in range(10):
        gx = (k * 13 + 5) % 32
        gy = (k * 9 + 1) % 32
        cell(px, gx, gy, grain if k % 2 else ripple)
        cell(px, gx + 1, gy, grain if k % 2 else ripple)
    if mystical:
        # Crystal sand: six small plus-shaped facets, teal body with a pale center.
        facet, core = (84, 140, 138), (176, 150, 196)
        for k in range(6):
            fx = (k * 9 + 6) % 32
            fy = (k * 13 + 4 + (k % 2) * 3) % 32
            for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
                cell(px, fx + dx, fy + dy, facet)
            cell(px, fx, fy, core)


def draw_water(px, mystical):
    # Deep matte blue, darker ripple bands. No white, no shimmer, no animation.
    base, band, edge = (28, 88, 168), (18, 62, 130), (40, 108, 188)
    fill_flat(px, base)
    for r in range(4):
        y0 = 3 + r * 8
        for x in range(32):
            wave = int(round(1.4 * math.sin(2 * math.pi * (x + r * 6) / 32.0)))
            cell(px, x, y0 + wave, band)
            cell(px, x, y0 + wave + 1, band)
            if x % 8 < 5:
                cell(px, x, y0 + wave - 1, edge)


def draw_coal(px, mystical):
    # Same dark ore color in both looks. The shape is what changes.
    fill_noise(px, [(120, 118, 116), (100, 98, 96), (140, 138, 134), (88, 86, 84)], 12)
    ore = (32, 32, 34)
    ore2 = (48, 48, 52)
    if not mystical:
        blobs = [(16, 18, 7), (40, 16, 5), (28, 36, 8), (46, 42, 6), (18, 46, 5)]
        for cx, cy, rad in blobs:
            for y in range(cy - rad, cy + rad + 1):
                for x in range(cx - rad, cx + rad + 1):
                    if (x - cx) ** 2 + (y - cy) ** 2 <= rad * rad:
                        put(px, x, y, ore if (x + y) % 3 else ore2)
    else:
        for i in range(-10, 11):
            put(px, 32 + i, 32 - 10 + abs(i) // 3, ore)
            put(px, 32 + i, 32 + 10 - abs(i) // 3, ore)
            put(px, 32 - 10 + abs(i) // 3, 32 + i, ore2)
            put(px, 32 + 10 - abs(i) // 3, 32 + i, ore2)
        for y in range(26, 39):
            for x in range(26, 39):
                if abs(x - 32) + abs(y - 32) < 6:
                    put(px, x, y, ore)


def draw_grass_side(px, mystical):
    # Top band matches that pack's grass. The rest matches that pack's dirt.
    # A flat 12px band survives the 32px box-average (6 cells).
    if mystical:
        band, body = (0x7F, 0x6E, 0x9E), (0x6E, 0x58, 0x68)
    else:
        band, body = (0x3F, 0x7A, 0x32), (0x71, 0x4D, 0x2C)
    fill_flat(px, body)
    for y in range(12):
        for x in range(64):
            put(px, x, y, band)


def _rel_lum(rgb):
    def f(c):
        x = c / 255.0
        return x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4
    r, g, b = rgb[:3]
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def _contrast(a, b):
    hi, lo = max(_rel_lum(a), _rel_lum(b)), min(_rel_lum(a), _rel_lum(b))
    return (hi + 0.05) / (lo + 0.05)


def _mean_rgb(im):
    px = im.load()
    rs = gs = bs = 0
    n = im.width * im.height
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            rs += r
            gs += g
            bs += b
    return (rs / n, gs / n, bs / n)


def _sd_rgb(colors):
    ys = [0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] for c in colors]
    mu = sum(ys) / len(ys)
    return (sum((v - mu) ** 2 for v in ys) / len(ys)) ** 0.5


def shift_mean_rgb(im, target_rgb):
    """Slide every pixel by the same RGB delta so the mean lands on the target.

    A shared add raises lightness and does not push saturation up.
    """
    mr, mg, mb = _mean_rgb(im)
    dr = target_rgb[0] - mr
    dg = target_rgb[1] - mg
    db = target_rgb[2] - mb
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            px[x, y] = (
                max(0, min(255, int(round(r + dr)))),
                max(0, min(255, int(round(g + dg)))),
                max(0, min(255, int(round(b + db)))),
                a,
            )
    return (dr, dg, db)


def add_rgb(im, delta):
    dr, dg, db = delta
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            px[x, y] = (
                max(0, min(255, int(round(r + dr)))),
                max(0, min(255, int(round(g + dg)))),
                max(0, min(255, int(round(b + db)))),
                a,
            )


def compress_rgb(im, limit=2.0, sd_max=18.0):
    """Pull each pixel toward the tile mean until contrast and speckle are calm.

    The mean itself stays put, so a pack color we just set does not drift.
    """
    px = im.load()
    cols = [px[x, y][:3] for y in range(im.height) for x in range(im.width)]
    mr, mg, mb = _mean_rgb(im)

    def trial(k):
        out = []
        for r, g, b in cols:
            out.append((
                max(0, min(255, int(round(mr + (r - mr) * k)))),
                max(0, min(255, int(round(mg + (g - mg) * k)))),
                max(0, min(255, int(round(mb + (b - mb) * k)))),
            ))
        return out

    lo, hi = 0.0, 1.0
    best_k = 0.0
    for _ in range(18):
        mid = (lo + hi) / 2.0
        colors = trial(mid)
        dark = min(colors, key=_rel_lum)
        light = max(colors, key=_rel_lum)
        if _contrast(dark, light) <= limit and _sd_rgb(colors) <= sd_max:
            best_k = mid
            lo = mid
        else:
            hi = mid
    colors = trial(best_k)
    i = 0
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = colors[i]
            a = px[x, y][3]
            px[x, y] = (r, g, b, a)
            i += 1
    return best_k


# Mystical ground lifted off black. Leaves-under uses the same RGB shift as leaves.
MYST_LIFT = {
    'grass_top': (0x7F, 0x6E, 0x9E),
    'leaves': (0x6A, 0x70, 0x96),
    'dirt': (0x6E, 0x58, 0x68),
    'stone': (0x7A, 0x76, 0x88),
}
CLASSIC_CALM = ('stone', 'dirt', 'grass_top', 'leaves', 'leavesUnder')
_leaf_shift = [(0.0, 0.0, 0.0)]


def tune_face(layer, im, myst):
    if layer == 'dirt_grass':
        return im
    if myst and layer == 'leaves':
        _leaf_shift[0] = shift_mean_rgb(im, MYST_LIFT['leaves'])
        compress_rgb(im, 2.0)
        return im
    if myst and layer == 'leavesUnder':
        add_rgb(im, _leaf_shift[0])
        compress_rgb(im, 2.0)
        return im
    if myst and layer in MYST_LIFT:
        shift_mean_rgb(im, MYST_LIFT[layer])
        compress_rgb(im, 2.0)
        return im
    if (not myst) and layer in CLASSIC_CALM:
        compress_rgb(im, 2.0)
    return im


def tile_report(name, im):
    px = im.load()
    cols = [px[x, y][:3] for y in range(im.height) for x in range(im.width)]
    dark = min(cols, key=_rel_lum)
    light = max(cols, key=_rel_lum)
    mean = _mean_rgb(im)
    ys = [0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] for c in cols]
    mu = sum(ys) / len(ys)
    sd = (sum((v - mu) ** 2 for v in ys) / len(ys)) ** 0.5
    c = _contrast(dark, light)
    print('  %s mean=#%02X%02X%02X C=%.2f sd=%.1f' % (
        name, int(round(mean[0])), int(round(mean[1])), int(round(mean[2])),
        c, sd))
    return c, sd, mean


def cap_master(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            if (r, g, b) == (255, 255, 255) or r > 0xEE or g > 0xF3 or b > 0xF7:
                raise SystemExit('master too bright at %s,%s %s' % (x, y, (r, g, b)))
    return im


MASTERS = {
    'grass_top': lambda m: draw_grass(m, False),
    'dirt': lambda m: draw_dirt(m, False),
    'stone': lambda m: draw_stone(m, False),
    'trunk_side': lambda m: draw_log_side(m, False),
    'trunk_top': lambda m: draw_log_top(m, False),
    'wood': lambda m: draw_planks(m, False),
    'leaves': lambda m: draw_leaves(m, False, False),
    'leaves_under': lambda m: draw_leaves(m, False, True),
    'sand': lambda m: draw_sand(m, False),
    'stone_coal': lambda m: draw_coal(m, False),
    'water': lambda m: draw_water(m, False),
    'dirt_grass': lambda m: draw_grass_side(m, False),
}

MASTERS_MYST = {
    'grass_top': lambda m: draw_grass(m, True),
    'dirt': lambda m: draw_dirt(m, True),
    'stone': lambda m: draw_stone(m, True),
    'trunk_side': lambda m: draw_log_side(m, True),
    'trunk_top': lambda m: draw_log_top(m, True),
    'wood': lambda m: draw_planks(m, True),
    'leaves': lambda m: draw_leaves(m, True, False),
    'leaves_under': lambda m: draw_leaves(m, True, True),
    'sand': lambda m: draw_sand(m, True),
    'stone_coal': lambda m: draw_coal(m, True),
    'water': lambda m: draw_water(m, True),
    'dirt_grass': lambda m: draw_grass_side(m, True),
}


def master_image(name, mystical):
    im = new_image()
    fn = (MASTERS_MYST if mystical else MASTERS)[name]
    fn(im.load())
    # Classic leaves under is the same picture as the top, so oak still reads.
    if name == 'leaves_under' and not mystical:
        return master_image('leaves', False)
    return cap_master(im)


def atlas_core(atlas, name):
    i = ATLAS_JSON[name]
    y0 = i * 36
    core = atlas.crop((2, y0 + 2, 34, y0 + 34)).convert('RGBA')
    return core.resize((64, 64), Image.Resampling.NEAREST)


def glass_face():
    g = Image.open(GLASS_PATH).convert('RGBA')
    return g.resize((64, 64), Image.Resampling.NEAREST)


def box_avg(im):
    src = im.convert('RGBA')
    sp = src.load()
    out = Image.new('RGBA', (32, 32))
    dp = out.load()
    for y in range(32):
        for x in range(32):
            rs = gs = bs = als = 0
            for dy in range(2):
                for dx in range(2):
                    r, g, b, a = sp[x * 2 + dx, y * 2 + dy]
                    rs += r
                    gs += g
                    bs += b
                    als += a
            dp[x, y] = (rs // 4, gs // 4, bs // 4, als // 4)
    return out


def blit_gutter(strip, img, index, core):
    layer = core + 4
    pad = 2
    y = index * layer
    src = img.convert('RGBA')
    if src.size != (core, core):
        raise SystemExit('bad core %s' % (src.size,))
    strip.paste(src, (pad, y + pad))
    px = strip.load()
    sp = src.load()
    w = core
    for gy in range(w):
        left = sp[0, gy]
        right = sp[w - 1, gy]
        for p in range(pad):
            px[p, y + pad + gy] = left
            px[pad + w + p, y + pad + gy] = right
    for gx in range(w):
        top = sp[gx, 0]
        bot = sp[gx, w - 1]
        for p in range(pad):
            px[pad + gx, y + p] = top
            px[pad + gx, y + pad + w + p] = bot
    c00, c10 = sp[0, 0], sp[w - 1, 0]
    c01, c11 = sp[0, w - 1], sp[w - 1, w - 1]
    for py in range(pad):
        for px_ in range(pad):
            px[px_, y + py] = c00
            px[pad + w + px_, y + py] = c10
            px[px_, y + pad + w + py] = c01
            px[pad + w + px_, y + pad + w + py] = c11


def build_strip(images, core):
    layer = core + 4
    n = len(images)
    strip = Image.new('RGBA', (layer, layer * n), (0, 0, 0, 255))
    for i, im in enumerate(images):
        face = im if core == 64 else box_avg(im)
        blit_gutter(strip, face, i, core)
    return strip


def stone_pattern_survives(im64):
    """2.5.553: stone has no crack grid. Its patches must still show at 32: not flat, not busy."""
    small = box_avg(im64)
    px = small.load()
    lums = []
    for y in range(32):
        for x in range(32):
            r, g, b, a = px[x, y]
            lums.append(0.2126 * r + 0.7152 * g + 0.0722 * b)
    mu = sum(lums) / len(lums)
    sd = (sum((v - mu) ** 2 for v in lums) / len(lums)) ** 0.5
    if sd < 4.0:
        raise SystemExit('classic stone is flat at 32 (sd %.1f)' % sd)
    # No crack grid: a dark pixel is "line" if it sits in a run of 8+ that is 2 px thick or less.
    cut = mu - 1.2 * sd
    dark = [[lums[y * 32 + x] < cut for x in range(32)] for y in range(32)]

    def run(x, y, dx, dy):
        n = 1
        for sign in (1, -1):
            cx, cy = x + sign * dx, y + sign * dy
            while 0 <= cx < 32 and 0 <= cy < 32 and dark[cy][cx]:
                n += 1
                cx += sign * dx
                cy += sign * dy
        return n

    line = 0
    for y in range(32):
        for x in range(32):
            if not dark[y][x]:
                continue
            h, v = run(x, y, 1, 0), run(x, y, 0, 1)
            if (h >= 8 and v <= 2) or (v >= 8 and h <= 2):
                line += 1
    worst = line
    if line > 20:
        raise SystemExit('classic stone has %d crack-like dark pixels at 32 (crack grid?)' % line)
    print('stone 32 sd', round(sd, 1), 'crack-like pixels', worst)


def parse_block_faces():
    """Block key -> face spec. Files are filled later."""
    return None


def main():
    atlas = Image.open(ATLAS_PATH).convert('RGBA')
    mystical = False
    # Shared file bytes for legacy faces (same pixels both packs).
    legacy = {}
    for name in ATLAS_ORDER:
        if name in MASTERS:
            continue
        legacy[name] = atlas_core(atlas, name)
    legacy['glass'] = glass_face()
    wraps = {}
    for key, (fn, pal) in WRAPS.items():
        wraps[key] = make_wrap(key, fn, pal)

    # Layer list. Index 0-28 matches atlas.json. Then leaves under, then wraps.
    layers = []
    for name in ATLAS_ORDER:
        layers.append(name)
    layers.append('leavesUnder')
    wrap_layers = []
    for key in WRAPS:
        wrap_layers.append('wrap_' + key)
    layers.extend(wrap_layers)
    layers.append('water')

    alias = {
        'benchTop': 'workbench',
        'oven': 'ovenFront',
    }
    for key, src in WRAP_ALIAS.items():
        alias['wrap_' + key] = 'wrap_' + src

    def face_for(layer, myst):
        # 2.5.553 part 2: hand-drawn 16 x 16 tiles for these layers (tools/texpack2.py).
        p2 = texpack2.face(layer, myst)
        if p2 is not None:
            if layer == 'stone':
                return tune_face(layer, p2, myst)
            if layer in ('leaves', 'leavesUnder'):
                compress_rgb(p2, 2.0)  # the calm check below holds these two to contrast 2.0
            return p2
        if layer == 'leavesUnder':
            return tune_face('leavesUnder', master_image('leaves_under', myst), myst)
        if layer == 'wrap_birchLog':
            im = new_image(); draw_birch_log(im.load(), myst); return im
        if layer == 'wrap_birchLeaves':
            im = new_image(); draw_birch_leaves(im.load(), myst); return im
        if layer.startswith('wrap_'):
            return wraps[layer[5:]]
        if layer in MASTERS:
            return tune_face(layer, master_image(layer, myst), myst)
        if layer in legacy:
            return legacy[layer]
        raise SystemExit('no face for ' + layer)

    # File names written into each pack folder.
    def file_of(layer):
        return layer + '.png'

    packs_root = os.path.join(ROOT, 'assets', 'packs')
    os.makedirs(packs_root, exist_ok=True)

    images_by_pack = {}
    for myst, pid in ((False, 'classic'), (True, 'mystical')):
        folder = os.path.join(packs_root, pid)
        os.makedirs(folder, exist_ok=True)
        images = [face_for(layer, myst) for layer in layers]
        images_by_pack[pid] = images
        for layer, im in zip(layers, images):
            im.save(os.path.join(folder, file_of(layer)), 'PNG', optimize=True)
        # Alias files are the same PNG so every pack.json path exists.
        for key, src in WRAP_ALIAS.items():
            src_path = os.path.join(folder, 'wrap_' + src + '.png')
            dst_path = os.path.join(folder, 'wrap_' + key + '.png')
            if not os.path.exists(dst_path):
                Image.open(src_path).save(dst_path, 'PNG', optimize=True)
        build_strip(images, 64).save(os.path.join(folder, 'atlas64.png'), 'PNG', optimize=True)
        build_strip(images, 32).save(os.path.join(folder, 'atlas32.png'), 'PNG', optimize=True)
        print(pid, 'layers', len(layers), 'folder', folder)

    stone_pattern_survives(images_by_pack['classic'][layers.index('stone')])
    print('tuned faces')
    calm = ('grass_top', 'dirt', 'stone', 'leaves', 'leavesUnder')
    for pid in ('classic', 'mystical'):
        print(pid)
        for name in ('grass_top', 'dirt_grass', 'dirt', 'stone', 'leaves', 'leavesUnder'):
            c, sd, mean = tile_report(name, images_by_pack[pid][layers.index(name)])
            if c > 2.02:
                raise SystemExit('%s %s contrast %.2f over 2.0' % (pid, name, c))
            if name in calm and sd > 18.05:
                raise SystemExit('%s %s std %.1f over 18' % (pid, name, sd))
        side = images_by_pack[pid][layers.index('dirt_grass')]
        top = images_by_pack[pid][layers.index('grass_top')]
        band = side.getpixel((8, 4))
        body = side.getpixel((8, 40))
        tmean = _mean_rgb(top)
        seam = _contrast(band, tmean)
        print('  side band', band, 'body', body, 'vs top mean C=%.2f' % seam)
        if seam > 1.2:
            raise SystemExit('%s grass band vs top %.2f over 1.2' % (pid, seam))

    # Block key -> which files. `all` or top/side/bottom.
    # Material used by the block is recorded so the runtime can find a layer.
    reuse = {
        'farmland': 'dirt.png',
        'farmlandWet': 'dirt.png',
        'reed': 'leaves.png',
        'tuft': 'leaves.png',
        'sapling': 'leaves.png',
        'chair': 'wood.png',
        'sewing': 'wood.png',
        'water': 'water.png',
        'woodshopBench': 'workbench.png',
        'pushButtonOn': 'wrap_pushButton.png',
        'leverOn': 'wrap_lever.png',
    }
    # Atlas-backed single faces. Key -> layer file (already named by layer).
    atlas_key = {
        'slate': 'greystone.png',
        'gravel': 'gravel_stone.png',
        'brickRed': 'brick_red.png',
        'brickGrey': 'brick_grey.png',
        'woolBlue': 'cotton_blue.png',
        'woolGreen': 'cotton_green.png',
        'woolRed': 'cotton_red.png',
        'woolTan': 'cotton_tan.png',
        'snow': 'snow.png',
        'ice': 'ice.png',
        'redSand': 'redsand.png',
        'coreplate': 'coreplate.png',
        'vend': 'vend.png',
        'storeCounter': 'store.png',
        'bunk': 'bunk.png',
        'oven': 'ovenBrick.png',
        'conveyor': 'greystone.png',
        'glass': 'glass.png',
    }
    multi = {
        'grass': ('grass_top.png', 'dirt_grass.png', 'dirt.png'),
        'log': ('trunk_top.png', 'trunk_side.png', 'trunk_top.png'),
        'leaves': ('leaves.png', 'leaves.png', 'leavesUnder.png'),
        'workbench': ('workbench.png', 'benchSide.png', 'wood.png'),
        'woodshop': ('workbench.png', 'benchSide.png', 'wood.png'),
        'woodshopSide': ('workbench.png', 'benchSide.png', 'wood.png'),
    }
    masters_keys = {'grass', 'dirt', 'stone', 'coal', 'sand', 'planks', 'log', 'leaves', 'water'}
    direct = {
        'dirt': 'dirt.png',
        'stone': 'stone.png',
        'coal': 'stone_coal.png',
        'sand': 'sand.png',
        'planks': 'wood.png',
    }

    def entry_for(key):
        if key in multi:
            top, side, bottom = multi[key]
            ent = {'top': top, 'side': side, 'bottom': bottom}
            if key not in masters_keys:
                ent['comment'] = 'legacy'
            return ent
        if key in direct:
            return {'all': direct[key]}
        if key in reuse:
            ent = {'all': reuse[key]}
            if key not in masters_keys:
                ent['comment'] = 'legacy'
            return ent
        if key in atlas_key:
            return {'all': atlas_key[key], 'comment': 'legacy'}
        if key in WRAPS or key in WRAP_ALIAS:
            src = WRAP_ALIAS.get(key, key)
            return {'all': 'wrap_' + src + '.png', 'comment': 'legacy'}
        raise SystemExit('no pack entry for ' + key)

    # Student/runtime: which strip layers a block key overrides.
    key_mats = {}
    for key in frozen_keys():
        if key == 'missing':
            continue
        ent = entry_for(key)
        if 'all' in ent:
            layer = ent['all'][:-4]
            key_mats[key] = [layer]
        else:
            mats = []
            for face in ('top', 'side', 'bottom'):
                layer = ent[face][:-4]
                if layer not in mats:
                    mats.append(layer)
            key_mats[key] = mats
    for key in WRAP_ALIAS:
        if key not in key_mats:
            src = WRAP_ALIAS[key]
            key_mats[key] = ['wrap_' + src]
    for key in WRAPS:
        key_mats.setdefault(key, ['wrap_' + key])

    sheet = {
        'order': layers,
        'alias': alias,
        'keyMats': key_mats,
        'core64': 64,
        'gutter': 2,
    }
    json.dump(sheet, open(os.path.join(packs_root, 'sheet.json'), 'w', encoding='utf8'), indent=2)
    json.dump(sheet, open(os.path.join(packs_root, 'sheet.json'), 'w', encoding='utf8'))

    names = {'classic': 'Classic Topia', 'mystical': 'Mystical Topia'}
    keys = [k for k in frozen_keys() if k != 'missing']
    for key in list(WRAPS) + list(WRAP_ALIAS):
        if key not in keys:
            keys.append(key)
    for pid in ('classic', 'mystical'):
        blocks = {}
        for key in keys:
            blocks[key] = entry_for(key)
        pack = {
            'format': 'bertopia-pack',
            'version': 1,
            'id': pid,
            'name': names[pid],
            'author': 'Bertopia',
            'status': 'approved',
            'size': 64,
            'blocks': blocks,
        }
        path = os.path.join(packs_root, pid, 'pack.json')
        with open(path, 'w', encoding='utf8') as f:
            json.dump(pack, f, indent=2)
            f.write('\n')
        print('wrote', path, 'blocks', len(blocks))

    # glass.png is a face file but not a strip layer (the world keeps the alpha tile).
    for pid in ('classic', 'mystical'):
        legacy['glass'].save(os.path.join(packs_root, pid, 'glass.png'), 'PNG', optimize=True)


if __name__ == '__main__':
    main()
