"""Bertopia texture pack part 2 (2.5.553). Original pixel art, drawn on a 16 x 16 grid.

Each tile is authored as 16 x 16 and scaled x4 with nearest neighbor to the 64px
master, so at the 32px sheet every pixel is exactly 2 x 2 and stays crisp.
Every tile wraps (no seams). No tile uses a crack grid or per-pixel static.
Tones stay muted: luminance between about 15% and 85% (check_tones raises if not).
Run through gen64.py: python3 tools/gen64.py
"""
import math
from PIL import Image

N = 16
LUM_MIN = 38   # about 15%
LUM_MAX = 217  # about 85%


# ---- tiny helpers -------------------------------------------------------

def _hash(a, b, c=0):
    n = (a * 374761393 + b * 668265263 + c * 2147483647) & 0xFFFFFFFF
    n = ((n ^ (n >> 13)) * 1274126177) & 0xFFFFFFFF
    return (n ^ (n >> 16)) & 0xFFFFFFFF


def rnd(a, b, c=0):
    return _hash(a, b, c) / 4294967295.0


def lerp(a, b, t):
    return a + (b - a) * t


def vnoise(x, y, seed, period):
    """Smooth value noise that wraps every 16 px. period = lattice cells across the tile."""
    cell = N / period
    gx, gy = x / cell, y / cell
    x0, y0 = int(math.floor(gx)), int(math.floor(gy))
    fx, fy = gx - x0, gy - y0
    sx = fx * fx * (3 - 2 * fx)
    sy = fy * fy * (3 - 2 * fy)

    def v(ix, iy):
        return rnd(ix % period, iy % period, seed)

    return lerp(lerp(v(x0, y0), v(x0 + 1, y0), sx), lerp(v(x0, y0 + 1), v(x0 + 1, y0 + 1), sx), sy)


class Tile:
    def __init__(self, base):
        self.g = [[base] * N for _ in range(N)]

    def set(self, x, y, c):
        self.g[y % N][x % N] = c

    def get(self, x, y):
        return self.g[y % N][x % N]

    def image(self):
        im = Image.new('RGBA', (N, N))
        px = im.load()
        for y in range(N):
            for x in range(N):
                r, g, b = self.g[y][x]
                px[x, y] = (r, g, b, 255)
        return check_tones(im).resize((64, 64), Image.Resampling.NEAREST)


def check_tones(im):
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
            if lum < LUM_MIN or lum > LUM_MAX:
                raise SystemExit('texpack2 tone out of range at %s,%s %s lum %.0f' % (x, y, (r, g, b), lum))
    return im


# ---- tones per pack ------------------------------------------------------
# Classic: cool grey stone. Mystical: purple-grey stone with teal flecks, same locked look as before.

STONE = {
    False: dict(base=(122, 125, 128), dark=(104, 108, 112), light=(140, 143, 146), chip=(88, 92, 97)),
    True: dict(base=(122, 118, 136), dark=(104, 100, 120), light=(140, 136, 154), chip=(88, 84, 106)),
}


def stone_tile(myst, seed=3, base_only=False):
    t = STONE[myst]
    tile = Tile(t['base'])
    for y in range(N):
        for x in range(N):
            n = 0.62 * vnoise(x, y, seed, 4) + 0.38 * vnoise(x + 3, y + 5, seed + 11, 8)
            if n < 0.40:
                tile.set(x, y, t['dark'])
            elif n > 0.60:
                tile.set(x, y, t['light'])
    if base_only:
        return tile
    # Short chips: two pixels on a diagonal, scattered, never in rows.
    spots = [(2, 3), (11, 1), (6, 8), (13, 10), (3, 13), (9, 14)]
    for i, (x, y) in enumerate(spots):
        tile.set(x, y, t['chip'])
        if i % 2 == 0:
            tile.set(x + 1, y + 1, t['chip'])
        else:
            tile.set(x + 1, y, t['chip'])
    if myst:
        # A few teal flecks in pairs. No glow.
        for x, y in ((5, 2), (12, 6), (1, 9), (8, 12)):
            tile.set(x, y, (60, 128, 124))
            tile.set(x + 1, y, (50, 112, 108))
    return tile


# Underground stone ('slate' / greystone): darker, bluer, broken horizontal layers.
DEEP = {
    False: dict(base=(92, 100, 112), dark=(74, 82, 94), light=(112, 120, 132)),
    True: dict(base=(92, 88, 112), dark=(74, 70, 94), light=(112, 108, 134)),
}


def deep_tile(myst):
    t = DEEP[myst]
    tile = Tile(t['base'])
    for y in range(N):
        for k in range(2):
            h = rnd(y, k, 21)
            start = int(h * N)
            length = 3 + int(rnd(y, k, 22) * 4)
            tone = t['dark'] if rnd(y, k, 23) < 0.55 else t['light']
            if (y + k) % 4 == 3 and tone is t['light']:
                tone = t['dark']
            for i in range(length):
                tile.set(start + i, y, tone)
    if myst:
        for x, y in ((3, 4), (11, 9), (6, 13)):
            tile.set(x, y, (54, 112, 110))
    return tile


# Cobble: rounded stones with dark gaps. Nine cells on a wrapping 3 x 3 grid.
COBBLE = {
    False: dict(gap=(84, 90, 98), tones=[(126, 132, 138), (110, 116, 124), (142, 148, 152)], hi=(166, 172, 176)),
    True: dict(gap=(78, 74, 98), tones=[(124, 118, 140), (108, 102, 126), (140, 134, 158)], hi=(164, 158, 182)),
}


def cobble_tile(myst, seed=7):
    t = COBBLE[myst]
    seeds = []
    for j in range(3):
        for i in range(3):
            cx = (i * N / 3.0) + 1.0 + rnd(i, j, seed) * 3.2
            cy = (j * N / 3.0) + 1.0 + rnd(i, j, seed + 1) * 3.2
            seeds.append((cx, cy))

    def owner(x, y):
        best, bi = 1e9, 0
        for k, (sx, sy) in enumerate(seeds):
            dx = min(abs(x + 0.5 - sx), N - abs(x + 0.5 - sx))
            dy = min(abs(y + 0.5 - sy), N - abs(y + 0.5 - sy))
            d = dx * dx + dy * dy
            if d < best:
                best, bi = d, k
        return bi

    own = [[owner(x, y) for x in range(N)] for y in range(N)]
    tile = Tile(t['gap'])
    for y in range(N):
        for x in range(N):
            me = own[y][x]
            edge = own[y][(x + 1) % N] != me or own[(y + 1) % N][x] != me
            if edge:
                tile.set(x, y, t['gap'])
            else:
                tile.set(x, y, t['tones'][me % 3])
    # One soft highlight per stone, on its top-left side.
    for y in range(N):
        for x in range(N):
            me = own[y][x]
            if tile.get(x, y) == t['gap']:
                continue
            if own[y][(x - 1) % N] != me and own[(y - 1) % N][x] != me:
                tile.set(x, y, t['hi'])
    return tile


# ---- ores ----------------------------------------------------------------
# Angular chunks (squares, steps, diamonds) on the same stone base. Never round.

SHAPES = [
    [(0, 0), (1, 0), (0, 1), (1, 1)],
    [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1)],
    [(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)],
    [(0, 0), (0, 1), (1, 1), (1, 2)],
    [(0, 0), (1, 0), (1, 1), (2, 1)],
]
# Chunk anchors on the 16 grid. Spacing is checked below so chunks never touch.
SPOTS = [(1, 1, 0), (8, 0, 2), (4, 5, 1), (11, 6, 3), (0, 9, 4), (7, 10, 0), (12, 12, 1)]

ORES = {
    # name: (body, facet, edge, accent)
    'coal': ((56, 56, 62), (88, 88, 96), (44, 44, 50), None),
    'iron': ((196, 150, 112), (222, 184, 146), (150, 106, 76), None),
    'copper': ((200, 120, 72), (226, 156, 104), (150, 84, 50), (80, 150, 126)),
    'zinc': ((156, 178, 196), (192, 210, 222), (116, 138, 158), None),
}


def ore_tile(kind, myst, rot=0):
    body, facet, edge, accent = ORES[kind]
    tile = stone_tile(myst, base_only=True)
    taken = set()
    for k, (ax, ay, si) in enumerate(SPOTS):
        shape = SHAPES[(si + rot) % len(SHAPES)]
        cells = [((ax + dx) % N, (ay + dy) % N) for dx, dy in shape]
        for c in cells:
            if c in taken:
                raise SystemExit('ore chunks overlap at %s' % (c,))
        # Keep a one-pixel gap between chunks.
        for cx, cy in cells:
            taken.add((cx, cy))
        top = min(c[1] for c in cells)
        left = min(c[0] for c in cells)
        for cx, cy in cells:
            col = body
            if cy == top and cx == min(c[0] for c in cells if c[1] == top):
                col = facet
            elif cy == max(c[1] for c in cells):
                col = edge
            tile.set(cx, cy, col)
        if accent and k % 3 == 1:
            tile.set(cells[-1][0], cells[-1][1], accent)
        if myst and kind == 'coal' and k % 2 == 0:
            tile.set(left, top, (66, 118, 116))
    return tile


# ---- oak, mystical -------------------------------------------------------

OAK_M = dict(
    bark=[(104, 74, 92), (88, 62, 80), (122, 90, 108)],
    groove=(62, 44, 60),
    ring_a=(150, 118, 128), ring_b=(116, 86, 100), core=(78, 56, 70), edge=(70, 50, 66),
)


def oak_side(myst):
    t = OAK_M
    tile = Tile(t['bark'][0])
    for x in range(N):
        tone = t['bark'][int(rnd(x, 1, 31) * 3) % 3]
        for y in range(N):
            tile.set(x, y, tone)
    # Vertical grooves: broken dashes, a few columns. No stripes of another hue.
    for x in (2, 6, 9, 13):
        y = int(rnd(x, 2, 32) * 5)
        while y < N + 6:
            ln = 3 + int(rnd(x, y, 33) * 4)
            for i in range(ln):
                tile.set(x, y + i, t['groove'])
            y += ln + 2 + int(rnd(x, y, 34) * 3)
    # Bark plates: short lighter marks beside grooves.
    for x, y in ((3, 4), (7, 9), (10, 3), (14, 11), (4, 13)):
        tile.set(x, y, t['bark'][2])
        tile.set(x, y + 1, t['bark'][2])
    return tile


def oak_top(myst):
    t = OAK_M
    tile = Tile(t['ring_b'])
    for y in range(N):
        for x in range(N):
            r = math.hypot(x - 7.5, y - 7.5)
            if r > 7.2:
                c = t['edge']
            elif r < 1.7:
                c = t['core']
            elif int((r - 1.7) * 0.8) % 2 == 0:
                c = t['ring_a']
            else:
                c = t['ring_b']
            tile.set(x, y, c)
    return tile


LEAF_M = dict(
    dark=(50, 92, 92), mid=(66, 112, 106), light=(84, 140, 124), violet=(96, 76, 128),
)


def oak_leaves(myst, under=False):
    t = dict(LEAF_M)
    if under:
        t = {k: tuple(int(c * 0.82) for c in v) for k, v in t.items()}
    tile = Tile(t['mid'])
    # Leaf dabs: 2 x 2 or L shapes, lighter on top, dark pixel under.
    dabs = [(1, 1), (6, 0), (11, 2), (3, 5), (9, 6), (14, 7), (0, 10), (6, 11), (12, 12), (4, 14)]
    for i, (x, y) in enumerate(dabs):
        tile.set(x, y, t['light'])
        tile.set(x + 1, y, t['light'])
        tile.set(x, y + 1, t['mid'])
        tile.set(x + 1, y + 1, t['dark'])
        if i % 2 == 0:
            tile.set(x + 2, y + 1, t['dark'])
    # Violet dabs so the canopy keeps the Mystical purple.
    for x, y in ((4, 2), (13, 4), (2, 8), (9, 10), (14, 14), (7, 3)):
        tile.set(x, y, t['violet'])
        tile.set(x + 1, y + 1, t['violet'])
    return tile


# ---- pine, both packs ----------------------------------------------------

PINE = {
    False: dict(
        bark=[(100, 82, 66), (80, 64, 50), (120, 100, 80)], furrow=(54, 42, 34),
        need=[(40, 88, 54), (32, 70, 44), (58, 112, 70)], needle_hi=(76, 134, 84),
        plank=[(172, 124, 84), (152, 108, 72), (192, 142, 98)], seam=(104, 70, 44),
    ),
    True: dict(
        bark=[(96, 90, 116), (76, 70, 96), (116, 110, 138)], furrow=(52, 48, 72),
        need=[(48, 94, 108), (36, 74, 88), (68, 120, 130)], needle_hi=(92, 146, 150),
        plank=[(138, 120, 152), (120, 102, 136), (156, 138, 170)], seam=(80, 66, 100),
    ),
}


def pine_log(myst):
    t = PINE[myst]
    tile = Tile(t['bark'][0])
    for x in range(N):
        for y in range(N):
            tile.set(x, y, t['bark'][1] if (x // 2) % 2 else t['bark'][0])
    for x in (1, 5, 8, 12):
        y = int(rnd(x, 4, 41) * 6)
        while y < N + 6:
            ln = 4 + int(rnd(x, y, 42) * 4)
            for i in range(ln):
                tile.set(x, y + i, t['furrow'])
            y += ln + 1 + int(rnd(x, y, 43) * 3)
    for x, y in ((3, 2), (10, 5), (6, 9), (14, 12), (2, 12)):
        tile.set(x, y, t['bark'][2])
        tile.set(x + 1, y, t['bark'][2])
    return tile


def pine_needles(myst):
    t = PINE[myst]
    tile = Tile(t['need'][0])
    # Layered feathers: a short diagonal stroke each, alternating lean, in rows.
    for row in range(5):
        y = row * 3 + 1
        for k in range(4):
            x = (k * 4 + (row % 2) * 2 + int(rnd(row, k, 51) * 2)) % N
            lean = 1 if (row + k) % 2 == 0 else -1
            for i in range(3):
                tile.set(x + i * lean, y + i, t['need'][2] if i == 0 else t['need'][1])
            tile.set(x, y, t['needle_hi'] if (row + k) % 3 == 0 else t['need'][2])
    return tile


def pine_planks(myst):
    t = PINE[myst]
    tile = Tile(t['plank'][0])
    for band in range(4):
        y0 = band * 4
        tone = t['plank'][band % 3]
        for y in range(y0, y0 + 3):
            for x in range(N):
                tile.set(x, y, tone)
        for x in range(N):
            tile.set(x, y0 + 3, t['seam'])
        # One end joint per board, staggered.
        jx = (band * 5 + 3) % N
        for y in range(y0, y0 + 3):
            tile.set(jx, y, t['seam'])
        # Grain: short lighter dashes.
        gx = (band * 7 + 1) % N
        for i in range(4):
            tile.set(gx + i, y0 + 1, t['plank'][2])
    return tile


# ---- birch, both packs (a check pass: clean boards, no frame) -------------

BIRCH = {
    False: dict(plank=[(214, 202, 172), (196, 184, 154), (222, 212, 184)], seam=(150, 136, 108)),
    True: dict(plank=[(176, 168, 196), (160, 152, 182), (190, 182, 210)], seam=(112, 104, 140)),
}


def birch_planks(myst):
    t = BIRCH[myst]
    tile = Tile(t['plank'][0])
    for band in range(4):
        y0 = band * 4
        for y in range(y0, y0 + 3):
            for x in range(N):
                tile.set(x, y, t['plank'][band % 3])
        for x in range(N):
            tile.set(x, y0 + 3, t['seam'])
        jx = (band * 6 + 2) % N
        for y in range(y0, y0 + 3):
            tile.set(jx, y, t['seam'])
    return tile



BIRCH_LEAF = {
    False: dict(mid=(112, 150, 70), light=(140, 178, 92), dark=(86, 122, 56), accent=(150, 160, 70)),
    True: dict(mid=(96, 138, 132), light=(126, 168, 156), dark=(70, 108, 106), accent=(120, 104, 160)),
}


def birch_leaves(myst):
    t = BIRCH_LEAF[myst]
    tile = Tile(t['mid'])
    # Smaller, lighter dabs than oak: single light pixel pairs with a dark pixel under.
    dabs = [(0, 1), (5, 0), (10, 1), (14, 3), (2, 5), (7, 4), (12, 7), (4, 9), (9, 9), (0, 12), (6, 13), (12, 13)]
    for x, y in dabs:
        tile.set(x, y, t['light'])
        tile.set(x + 1, y, t['light'])
        tile.set(x + 1, y + 1, t['dark'])
    for x, y in ((3, 2), (13, 10), (8, 6), (2, 15)):
        tile.set(x, y, t['accent'])
    return tile


# ---- bed (bunk) ------------------------------------------------------------

def bed_tile(myst):
    wood = (118, 82, 52)
    wood_d = (88, 60, 38)
    pillow = (214, 206, 186)
    pillow_d = (184, 176, 158)
    blanket = (72, 106, 152) if not myst else (92, 86, 140)
    blanket_l = (96, 130, 176) if not myst else (116, 110, 164)
    blanket_d = (56, 86, 128) if not myst else (72, 66, 112)
    tile = Tile(blanket)
    for i in range(N):
        tile.set(i, 0, wood)
        tile.set(i, 15, wood_d)
        tile.set(0, i, wood)
        tile.set(15, i, wood_d)
    # Pillow at the head: rounded rectangle, shaded underneath.
    for y in range(2, 6):
        for x in range(2, 14):
            if (x in (2, 13)) and (y in (2, 5)):
                continue
            tile.set(x, y, pillow_d if y == 5 else pillow)
    # Blanket fold, then stitched stripes (dashes, so it reads without color).
    for x in range(1, 15):
        tile.set(x, 7, blanket_l)
        tile.set(x, 8, blanket_d)
    for y in (11, 13):
        for x in range(2, 14):
            if (x + y) % 3 != 0:
                tile.set(x, y, blanket_l)
    return tile


# ---- entry point used by gen64.py -----------------------------------------

def _by_layer(myst):
    return {
        'stone': lambda: stone_tile(myst, 3),
        'greystone': lambda: deep_tile(myst),
        'gravel_stone': lambda: cobble_tile(myst),
        'stone_coal': lambda: ore_tile('coal', myst, 0),
        'wrap_ironOre': lambda: ore_tile('iron', myst, 1),
        'wrap_copperOre': lambda: ore_tile('copper', myst, 2),
        'wrap_zincOre': lambda: ore_tile('zinc', myst, 3),
        'trunk_side': (lambda: oak_side(True)) if myst else None,
        'trunk_top': (lambda: oak_top(True)) if myst else None,
        'leaves': (lambda: oak_leaves(True)) if myst else None,
        'leavesUnder': (lambda: oak_leaves(True, True)) if myst else None,
        'wrap_pineLog': lambda: pine_log(myst),
        'wrap_pineNeedles': lambda: pine_needles(myst),
        'wrap_pinePlanks': lambda: pine_planks(myst),
        'wrap_birchPlanks': lambda: birch_planks(myst),
        'wrap_birchLeaves': lambda: birch_leaves(myst),
        'bunk': lambda: bed_tile(myst),
    }


# Layers this part redraws, for the PR sheet and the pack check.
LAYERS = ['stone', 'greystone', 'gravel_stone', 'stone_coal', 'wrap_ironOre', 'wrap_copperOre', 'wrap_zincOre',
          'trunk_side', 'trunk_top', 'leaves', 'leavesUnder', 'wrap_pineLog', 'wrap_pineNeedles',
          'wrap_pinePlanks', 'wrap_birchPlanks', 'wrap_birchLeaves', 'bunk']


def face(layer, myst):
    """64px RGBA master for this layer and pack, or None if part 2 leaves it alone."""
    fn = _by_layer(myst).get(layer)
    if fn is None:
        return None
    return fn().image()
