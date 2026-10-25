#!/usr/bin/env python3
# In-house recolor for calm everyday blocks. Same atlas layout, only indexes 0,1,2,3,10,11,12,13.
# All other tiles must stay byte-for-byte identical.
import os, sys, hashlib
from PIL import Image
import random

ATLAS = os.path.join(os.path.dirname(__file__), "..", "assets", "atlas.png")
S = 32
G = 2
CELL = S + G * 2  # 36
LAYERS = 29

# Indexes to modify
MODIFY = {0, 1, 2, 3, 10, 11, 12, 13}  # grass_top, dirt_grass, dirt, stone, wood, trunk_top, trunk_side, leaves
PART2 = {5, 6, 7, 8, 9, 14, 15, 16, 17, 20}  # stone_coal, sand, gravel_stone, brick_red, brick_grey, cotton_blue, cotton_green, cotton_red, cotton_tan, redsand

def load():
    im = Image.open(ATLAS).convert("RGBA")
    if im.size != (CELL, CELL * LAYERS):
        sys.exit(f"unexpected size {im.size}")
    return im

def core_of(im, idx):
    y = idx * CELL + G
    return im.crop((G, y, G + S, y + S))

def put_core(im, idx, core):
    y = idx * CELL + G
    im.paste(core, (G, y))
    # re-copy 2px gutters from new core edges
    px = im.load()
    cy = y
    for i in range(S):
        # top gutter
        px[G + i, cy - 1] = px[G + i, cy]
        px[G + i, cy - 2] = px[G + i, cy]
        # bottom
        px[G + i, cy + S] = px[G + i, cy + S - 1]
        px[G + i, cy + S + 1] = px[G + i, cy + S - 1]
    for j in range(S):
        # left
        px[G - 1, cy + j] = px[G, cy + j]
        px[G - 2, cy + j] = px[G, cy + j]
        # right
        px[G + S, cy + j] = px[G + S - 1, cy + j]
        px[G + S + 1, cy + j] = px[G + S - 1, cy + j]
    # corners
    for dy in (-2, -1, S, S + 1):
        for dx in (-2, -1, S, S + 1):
            sx = G if dx < 0 else G + S - 1
            sy = cy if dy < 0 else cy + S - 1
            px[G + dx, cy + dy] = px[sx, sy]

def is_green(r, g, b):
    return g > r + 20 and g > b + 20 and g > 80

def calm_pixel(r, g, b, a, seed_val, is_greenish):
    if a == 0:
        return r, g, b, a
    # desaturate
    avg = (r + g + b) / 3
    sat = 0.75 if is_greenish else 0.90
    r = int(avg + (r - avg) * sat)
    g = int(avg + (g - avg) * sat)
    b = int(avg + (b - avg) * sat)
    # green hue shift toward olive
    if is_greenish:
        r = min(255, r + 8)
        b = min(255, b + 4)
        g = max(0, g - 6)
    # cap neon
    if g > 200 and r < 90 and b < 90:
        g = 180
    # subtle speckle
    if seed_val % 8 == 0:
        delta = (seed_val % 13) - 6
        r = max(0, min(255, r + delta))
        g = max(0, min(255, g + delta))
        b = max(0, min(255, b + delta))
    return max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), a

def calm_part2(r, g, b, a, seed_val, idx):
    if a == 0:
        return r, g, b, a
    avg = (r + g + b) / 3
    if idx in (6, 20):  # sand, redsand: -15%, no pure yellow
        sat = 0.85
        r = int(avg + (r - avg) * sat)
        g = int(avg + (g - avg) * sat)
        b = int(avg + (b - avg) * sat)
        if r > 225: r = 225
        if g > 225: g = 225
    elif idx in (5, 7):  # coal, gravel: -10%
        sat = 0.90
        r = int(avg + (r - avg) * sat)
        g = int(avg + (g - avg) * sat)
        b = int(avg + (b - avg) * sat)
    elif idx in (8, 9):  # bricks: -15%
        sat = 0.85
        r = int(avg + (r - avg) * sat)
        g = int(avg + (g - avg) * sat)
        b = int(avg + (b - avg) * sat)
    elif idx in (14, 15, 16, 17):  # wool: -20%, no neon
        sat = 0.80
        r = int(avg + (r - avg) * sat)
        g = int(avg + (g - avg) * sat)
        b = int(avg + (b - avg) * sat)
        mx, mn = max(r, g, b), min(r, g, b)
        if mx > 230 and mn < 70:
            r = min(r, 220)
            g = min(g, 220)
            b = min(b, 220)
    # seeded speckle
    if seed_val % 8 == 0:
        delta = (seed_val % 13) - 6
        r = max(0, min(255, r + delta))
        g = max(0, min(255, g + delta))
        b = max(0, min(255, b + delta))
    return max(0, min(255, r)), max(0, min(255, g)), max(0, min(255, b)), a

def process():
    im = load()
    orig_hash = {}
    for idx in range(LAYERS):
        if idx not in MODIFY:
            core = core_of(im, idx)
            orig_hash[idx] = hashlib.md5(core.tobytes()).hexdigest()

    rng = random.Random(42)
    for idx in sorted(MODIFY):
        core = core_of(im, idx)
        px = core.load()
        for y in range(S):
            for x in range(S):
                r, g, b, a = px[x, y]
                seed = rng.randint(0, 999999)
                greenish = is_green(r, g, b) or idx in (0, 13) or (idx == 1 and y < 10)
                nr, ng, nb, na = calm_pixel(r, g, b, a, seed, greenish)
                px[x, y] = (nr, ng, nb, na)
        put_core(im, idx, core)

    # assert others unchanged
    for idx, h in orig_hash.items():
        core = core_of(im, idx)
        if hashlib.md5(core.tobytes()).hexdigest() != h:
            sys.exit(f"tile {idx} changed unexpectedly")
    im.save(ATLAS)
    print(f"wrote {ATLAS} size={im.size}")

def process_part2():
    im = load()
    orig_hash = {}
    for idx in range(LAYERS):
        if idx not in PART2:
            core = core_of(im, idx)
            orig_hash[idx] = hashlib.md5(core.tobytes()).hexdigest()
    rng = random.Random(42)
    for idx in sorted(PART2):
        core = core_of(im, idx)
        px = core.load()
        for y in range(S):
            for x in range(S):
                r, g, b, a = px[x, y]
                seed = rng.randint(0, 999999)
                nr, ng, nb, na = calm_part2(r, g, b, a, seed, idx)
                px[x, y] = (nr, ng, nb, na)
        put_core(im, idx, core)
    for idx, h in orig_hash.items():
        core = core_of(im, idx)
        if hashlib.md5(core.tobytes()).hexdigest() != h:
            sys.exit(f"tile {idx} changed unexpectedly")
    im.save(ATLAS)
    print(f"wrote {ATLAS} size={im.size} (part 2)")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--part" and len(sys.argv) > 2 and sys.argv[2] == "2":
        process_part2()
    else:
        process()
