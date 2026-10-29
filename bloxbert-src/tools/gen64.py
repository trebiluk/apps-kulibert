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


def draw_grass(px, mystical):
    if mystical:
        fill_noise(px, [(92, 58, 122), (110, 70, 140), (74, 46, 104), (128, 90, 150), (84, 52, 112)], 3)
        fleck = (46, 130, 124)
        for y in range(2, 62, 1):
            for x in range(2, 62):
                if (x * 5 + y * 9) % 23 == 0:
                    put(px, x, y, fleck)
                    put(px, x + 1, y, (38, 112, 108))
    else:
        fill_noise(px, [(46, 110, 40), (62, 138, 48), (34, 90, 32), (80, 150, 56), (40, 100, 36)], 1)
        for y in range(64):
            for x in range(64):
                if (x * 3 + y * 11) % 37 == 0:
                    put(px, x, y, (90, 70, 40))
                elif (x + y * 2) % 29 == 0:
                    put(px, x, y, (24, 70, 22))


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
        # Base stays light so the darker cracks still read after a 2x2 average.
        fill_noise(px, [(168, 164, 156), (150, 146, 138), (184, 180, 172), (136, 132, 124)], 6)
        vein = None
        crack = (78, 74, 70)
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
        fill_noise(px, [(40, 110, 36), (24, 78, 28), (70, 140, 48), (30, 90, 32), (16, 60, 20)], 7)
    # A few darker pockets so the canopy is not a flat slab.
    for y in range(4, 60, 9):
        for x in range(4, 60, 11):
            col = (30, 20, 48) if mystical else (16, 52, 18)
            for dy in range(3):
                for dx in range(3):
                    if dx + dy < 4:
                        put(px, x + dx, y + dy, col)


def draw_sand(px, mystical):
    if not mystical:
        fill_noise(px, [(210, 190, 130), (196, 174, 112), (176, 154, 96), (220, 200, 146), (160, 140, 88)], 11)
        for y in range(64):
            for x in range(64):
                if (x * 9 + y * 4) % 31 == 0:
                    put(px, x, y, (140, 118, 72))
        return
    colors = [(150, 130, 176), (90, 140, 138), (176, 150, 190), (70, 100, 120), (130, 110, 150)]
    for y in range(64):
        for x in range(64):
            cell = (x // 8) + (y // 8) * 3
            a = colors[cell % len(colors)]
            b = colors[(cell + 2) % len(colors)]
            c = a if (x % 8) + (y % 8) < 8 else b
            put(px, x, y, c)


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


def stone_cracks_survive(im64):
    small = box_avg(im64)
    px = small.load()
    lums = []
    for y in range(32):
        for x in range(32):
            r, g, b, a = px[x, y]
            lums.append((r + g + b) / 3)
    lums.sort()
    med = lums[len(lums) // 2]
    dark = lums[max(1, len(lums) // 20)]
    # Cracks must stay about 25% darker than the stone body after the average.
    if dark > med * 0.78:
        raise SystemExit('classic stone cracks vanished at 32 (dark %s med %s)' % (dark, med))
    print('stone 32 dark', round(dark, 1), 'median', round(med, 1))


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

    alias = {
        'benchTop': 'workbench',
        'oven': 'ovenFront',
    }
    for key, src in WRAP_ALIAS.items():
        alias['wrap_' + key] = 'wrap_' + src

    def face_for(layer, myst):
        if layer == 'leavesUnder':
            return master_image('leaves_under', myst)
        if layer.startswith('wrap_'):
            return wraps[layer[5:]]
        if layer in MASTERS:
            return master_image(layer, myst)
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

    stone_cracks_survive(images_by_pack['classic'][layers.index('stone')])

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
        'water': 'ice.png',
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
    masters_keys = {'grass', 'dirt', 'stone', 'coal', 'sand', 'planks', 'log', 'leaves'}
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
