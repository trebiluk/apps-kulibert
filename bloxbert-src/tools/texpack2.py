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
    # Irregular cracks (short zigzags, not lines across the tile) and a few pebbles. No mortar, no grid.
    for cx, cy, run in ((2, 2, 4), (10, 5, 3), (4, 11, 4), (13, 12, 3)):
        for i in range(run):
            tile.set(cx + i // 2 + (i % 2), cy + i, t['chip'])
    for px_, py_ in ((8, 1), (1, 7), (7, 13)):
        tile.set(px_, py_, t['light'])
        tile.set(px_ + 1, py_, t['light'])
        tile.set(px_ + 1, py_ + 1, t['chip'])
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
    False: dict(gap=(92, 82, 72), tones=[(152, 142, 128), (138, 128, 116), (166, 156, 142)], hi=(188, 178, 162)),
    True: dict(gap=(88, 80, 84), tones=[(150, 140, 142), (136, 126, 130), (164, 154, 156)], hi=(186, 176, 178)),
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
# A stone base plus 4 angular chunks, 2-3 texels each, with a 1-texel light edge on the top and left.
# Every ore has its own chunk shape, so they differ without color: coal = blocks, iron = steps,
# copper = plus and arrow, zinc = bars. Never round.
SHAPES = {
    # coal: chunky blocks with a cut corner. iron: thick diagonal steps. copper: plus and tripod. zinc: bars.
    'coal': [[(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1), (0, 2), (1, 2)],
             [(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1), (1, 2), (2, 2)]],
    'iron': [[(0, 0), (1, 0), (0, 1), (1, 1), (2, 1), (1, 2), (2, 2)], [(1, 0), (2, 0), (0, 1), (1, 1), (2, 1), (0, 2), (1, 2)]],  # thick diagonal steps
    'copper': [[(1, 0), (0, 1), (1, 1), (2, 1), (1, 2)], [(1, 0), (0, 1), (1, 1), (2, 1), (0, 2), (2, 2)]],
    'zinc': [[(0, 0), (1, 0), (2, 0), (0, 1), (1, 1), (2, 1)], [(0, 0), (1, 0), (0, 1), (1, 1), (0, 2), (1, 2)]],
}
SPOTS = [(1, 1), (9, 1), (5, 7), (12, 8), (1, 12)]

# Ores must tell apart WITHOUT color (color-blind and low-vision kids): each has its own chunk shape AND its own brightness step.
# Stone is about lum 123. Coal is darkest, then copper, then stone, then iron, then zinc, each at least 30 apart (tools/texpack-audit.py checks it).
ORES = {
    # name: (body, light edge on top, shade underneath, accent)
    'coal': ((40, 40, 44), (58, 58, 64), (38, 38, 42), None),
    'copper': ((118, 64, 40), (146, 86, 54), (88, 48, 28), None),
    'iron': ((200, 164, 128), (222, 190, 152), (190, 154, 118), None),
    'zinc': ((206, 218, 230), (206, 218, 230), (190, 204, 218), None),
}


def ore_tile(kind, myst, rot=0):
    body, light, shade, accent = ORES[kind]
    tile = stone_tile(myst, base_only=True)
    shapes = SHAPES[kind]
    mine = {}
    for k, (ax, ay) in enumerate(SPOTS):
        if kind == 'coal' and k == 4:
            continue  # coal reads best with 4
        shape = shapes[(k + rot) % len(shapes)]
        cells = [((ax + dx) % N, (ay + dy) % N) for dx, dy in shape]
        for c in cells:
            if c in mine:
                raise SystemExit('ore chunks overlap at %s' % (c,))
            mine[c] = k
        have = set(cells)
        top = min(c[1] for c in cells)
        left = min(c[0] for c in cells)
        for cx, cy in cells:
            if (cx, cy - 1) not in have:
                col = light      # 1 texel light edge along the top
            elif (cx, cy + 1) not in have:
                col = shade
            else:
                col = body
            tile.set(cx, cy, col)
        if accent and k % 2 == 1:
            tile.set(cells[-1][0], cells[-1][1], accent)
    # Chunks must not touch each other (a one texel gap keeps each shape readable).
    for (x, y), k in mine.items():
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                o = mine.get(((x + dx) % N, (y + dy) % N))
                if o is not None and o != k:
                    raise SystemExit('%s chunks %d and %d touch at %s' % (kind, k, o, (x, y)))
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
    pillow = (210, 202, 182)
    pillow_d = (180, 172, 154)
    blanket = (62, 111, 168) if not myst else (92, 86, 140)
    blanket_l = (84, 134, 190) if not myst else (116, 110, 164)
    blanket_d = (50, 92, 142) if not myst else (72, 66, 112)
    tile = Tile(blanket)
    # Fabric weave on the blanket: alternate texels of two close tones.
    for y in range(N):
        for x in range(N):
            tile.set(x, y, blanket_d if (x + y) % 2 else blanket)
    for i in range(N):
        tile.set(i, 0, wood)
        tile.set(i, 15, wood_d)
        tile.set(0, i, wood)
        tile.set(15, i, wood_d)
    # Pillow at the head: rounded rectangle with its own weave, shaded underneath.
    for y in range(2, 6):
        for x in range(2, 14):
            if (x in (2, 13)) and (y in (2, 5)):
                continue
            tile.set(x, y, pillow_d if y == 5 else (pillow if (x + y) % 2 else (200, 192, 172)))
    # Blanket fold, then stitched dashes (readable without color).
    for x in range(1, 15):
        tile.set(x, 7, blanket_l)
        tile.set(x, 8, blanket_d)
    for y in (11, 13):
        for x in range(2, 14):
            if (x + y) % 3 != 0:
                tile.set(x, y, blanket_l)
    return tile


# ---- dirt, grass side, log, planks, sand, wool (classic rules, 2.5.553) ----
DIRT = {
    False: dict(base=(122, 85, 52), dark=(102, 70, 42), light=(140, 101, 64), speck=(86, 58, 34), pebble=(156, 134, 104)),
    True: dict(base=(110, 82, 100), dark=(92, 66, 84), light=(126, 98, 116), speck=(74, 52, 68), pebble=(146, 134, 158)),
}


def dirt_tile(myst):
    t = DIRT[myst]
    tile = Tile(t['base'])
    for y in range(N):
        for x in range(N):
            n = vnoise(x, y, 17, 4)
            if n < 0.36:
                tile.set(x, y, t['dark'])
            elif n > 0.66:
                tile.set(x, y, t['light'])
    for x, y in ((2, 1), (7, 3), (12, 2), (4, 6), (10, 8), (1, 10), (14, 11), (6, 12), (11, 14), (3, 15)):
        tile.set(x, y, t['speck'])
    # A few tiny pebbles: two light texels with a dark one under.
    for x, y in ((8, 6), (2, 13), (13, 9)):
        tile.set(x, y, t['pebble'])
        tile.set(x + 1, y, t['pebble'])
        tile.set(x + 1, y + 1, t['speck'])
    if myst:
        for x, y in ((5, 4), (12, 12)):
            tile.set(x, y, (54, 112, 110))
    return tile


FRINGE = {
    False: dict(top=(114, 160, 74), mid=(94, 138, 62), low=(78, 120, 52)),
    True: dict(top=(146, 128, 176), mid=(127, 110, 158), low=(104, 88, 134)),  # matches the lifted Mystical grass top
}


def grass_side(myst):
    tile = dirt_tile(myst)
    f = FRINGE[myst]
    for x in range(N):
        h = 3 + int(rnd(x, 3, 61) * 2)  # 3 or 4 texels, ragged
        for y in range(h):
            if y == 0:
                c = f['top'] if rnd(x, 0, 62) < 0.5 else f['mid']
            elif y == h - 1:
                c = f['low']
            else:
                c = f['mid']
            tile.set(x, y, c)
    return tile


def oak_side_classic():
    base, dark, light, groove = (107, 74, 46), (92, 62, 38), (124, 88, 56), (70, 48, 30)
    tile = Tile(base)
    for x in range(N):
        tone = (dark, base, light, base, dark)[int(rnd(x, 1, 71) * 5) % 5]
        for y in range(N):
            tile.set(x, y, tone)
    for x in (1, 5, 8, 12, 14):
        y = int(rnd(x, 2, 72) * 5)
        while y < N + 6:
            ln = 3 + int(rnd(x, y, 73) * 4)
            for i in range(ln):
                tile.set(x, y + i, groove)
            y += ln + 2 + int(rnd(x, y, 74) * 3)
    return tile


def oak_top_classic():
    ring_a, ring_b, core, edge = (176, 138, 90), (150, 114, 70), (112, 80, 50), (88, 60, 38)
    tile = Tile(ring_b)
    for y in range(N):
        for x in range(N):
            r = math.hypot(x - 7.5, y - 7.5)
            if r > 7.2:
                c = edge
            elif r < 1.7:
                c = core
            elif int((r - 1.7) * 0.8) % 2 == 0:
                c = ring_a
            else:
                c = ring_b
            tile.set(x, y, c)
    return tile


PLANK = {
    False: dict(tones=[(165, 124, 78), (150, 112, 70), (180, 138, 90)], seam=(112, 80, 48), grain=(188, 148, 100)),
    True: dict(tones=[(120, 92, 138), (106, 80, 124), (134, 106, 152)], seam=(80, 60, 100), grain=(150, 124, 168)),
}


def planks_tile(myst):
    t = PLANK[myst]
    tile = Tile(t['tones'][0])
    for band in range(4):
        y0 = band * 4
        for y in range(y0, y0 + 3):
            for x in range(N):
                tile.set(x, y, t['tones'][(band + (x + band * 3) // 6) % 3])
        for x in range(N):
            tile.set(x, y0 + 3, t['seam'])
        jx = (band * 5 + 3) % N
        for y in range(y0, y0 + 3):
            tile.set(jx, y, t['seam'])
        gx = (band * 7 + 2) % N
        for i in range(3):
            tile.set(gx + i, y0 + 1, t['grain'])
    return tile


def sand_tile():
    base, dark, light, speck = (198, 178, 132), (186, 166, 122), (210, 190, 142), (160, 140, 100)
    tile = Tile(base)
    for y in range(N):
        for x in range(N):
            n = vnoise(x, y, 23, 8)
            if n < 0.38:
                tile.set(x, y, dark)
            elif n > 0.64:
                tile.set(x, y, light)
    for x, y in ((1, 2), (6, 1), (11, 3), (14, 6), (3, 7), (9, 8), (5, 11), (12, 12), (2, 14), (8, 15), (15, 9)):
        tile.set(x, y, speck)
    return tile


WOOL = {
    'cotton_blue': (62, 111, 168),
    'cotton_green': (76, 126, 84),
    'cotton_red': (164, 80, 72),
    'cotton_tan': (200, 178, 134),
}


def wool_tile(key):
    base = WOOL[key]
    dark = tuple(int(c * 0.86) for c in base)
    light = tuple(min(210, int(c * 1.10)) for c in base)
    tile = Tile(base)
    # Fabric weave: a 2 x 2 over-under pattern, plus a stitched dash every fourth row.
    for y in range(N):
        for x in range(N):
            if (x // 2 + y // 2) % 2 == 0:
                tile.set(x, y, dark if (x + y) % 2 else base)
            else:
                tile.set(x, y, light if (x + y) % 2 else base)
    return tile


BRICK = {
    'brick_red': dict(tones=[(164, 92, 72), (150, 80, 62), (176, 104, 82)], mortar=(120, 100, 88)),
    'brick_grey': dict(tones=[(146, 136, 124), (132, 122, 112), (158, 148, 136)], mortar=(92, 84, 76)),
}


def brick_tile(key):
    t = BRICK[key]
    tile = Tile(t['mortar'])
    for row in range(4):
        y0 = row * 4
        off = 4 if row % 2 else 0
        for b in range(2):
            x0 = off + b * 8
            tone = t['tones'][(row * 2 + b) % 3]
            for y in range(y0, y0 + 3):
                for x in range(x0, x0 + 7):
                    tile.set(x, y, tone)
            # one chip per brick so no two look the same
            tile.set(x0 + 1 + (row + b) % 4, y0 + 1, t['tones'][(row + b + 1) % 3])
    return tile


# ---- calm pass for the older tiles ------------------------------------------

def _hls_clamp(c, smax, lmin, lmax):
    import colorsys
    r, g, b = [v / 255.0 for v in c]
    h, l, sat = colorsys.rgb_to_hls(r, g, b)
    sat = min(sat, smax)
    r, g, b = [int(round(v * 255)) for v in colorsys.hls_to_rgb(h, l, sat)]
    y = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if y > lmax:
        k = lmax / y
        r, g, b = int(r * k), int(g * k), int(b * k)
    elif y < lmin:
        add = lmin - y
        r, g, b = min(255, int(r + add)), min(255, int(g + add)), min(255, int(b + add))
    return r, g, b


def calm(im, texturize=False, seed=1):
    """Cap saturation near 55%, keep luminance 15-85%, and (if asked) add soft 16-grid texture to a flat tile."""
    src = im.convert('RGB')
    out = Image.new('RGBA', src.size)
    px = src.load()
    op = out.load()
    for y in range(src.height):
        for x in range(src.width):
            r, g, b = _hls_clamp(px[x, y], 0.52, 44, 214)
            op[x, y] = (r, g, b, 255)
    if texturize:
        step = src.width // N
        for i in range(26):
            tx, ty = int(rnd(i, seed, 81) * N), int(rnd(i, seed, 82) * N)
            sign = 1 if rnd(i, seed, 83) < 0.5 else -1
            for dx in range(2 if i % 3 == 0 else 1):
                gx = (tx + dx) % N
                for yy in range(step):
                    for xx in range(step):
                        r, g, b, a = op[gx * step + xx, ty * step + yy]
                        d = sign * 14
                        op[gx * step + xx, ty * step + yy] = _hls_clamp((max(0, min(255, r + d)), max(0, min(255, g + d)), max(0, min(255, b + d))), 0.52, 44, 214) + (255,)
    return out


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
        'trunk_side': (lambda: oak_side(True)) if myst else oak_side_classic,
        'trunk_top': (lambda: oak_top(True)) if myst else oak_top_classic,
        'dirt': lambda: dirt_tile(myst),
        'dirt_grass': lambda: grass_side(myst),
        'wood': lambda: planks_tile(myst),
        'sand': (lambda: sand_tile()) if not myst else None,
        'cotton_blue': lambda: wool_tile('cotton_blue'),
        'cotton_green': lambda: wool_tile('cotton_green'),
        'cotton_red': lambda: wool_tile('cotton_red'),
        'cotton_tan': lambda: wool_tile('cotton_tan'),
        'brick_red': lambda: brick_tile('brick_red'),
        'brick_grey': lambda: brick_tile('brick_grey'),
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
          'wrap_pinePlanks', 'wrap_birchPlanks', 'wrap_birchLeaves', 'bunk', 'dirt', 'dirt_grass', 'wood', 'sand',
          'cotton_blue', 'cotton_green', 'cotton_red', 'cotton_tan', 'brick_red', 'brick_grey']


def face(layer, myst):
    """64px RGBA master for this layer and pack, or None if part 2 leaves it alone."""
    fn = _by_layer(myst).get(layer)
    if fn is None:
        return None
    return fn().image()


# Older tiles that only need the calm pass, and the ones that are flat and need a little texture too.
CALM_FLAT = ('coreplate', 'vend', 'store', 'snow', 'ice')
CALM_SKIP = ('glass', 'wrap_doorGlass', 'water')
