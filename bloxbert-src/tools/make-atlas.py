# Build a vertical-strip atlas. Each tile is 32px of source plus a 2px gutter
# made by copying that tile's own edge pixels outward. The 32px cores do not change.
# noa reads the strip as square layers the width of the image (36).
import json, os
from PIL import Image

SRC = os.environ.get("KENNEY_TILES", "kenney/PNG/Tiles")
BASE = [
  "grass_top", "dirt_grass", "dirt", "stone", "greystone", "stone_coal", "sand",
  "gravel_stone", "brick_red", "brick_grey", "wood", "trunk_top", "trunk_side",
  "leaves", "cotton_blue", "cotton_green", "cotton_red", "cotton_tan", "snow",
  "ice", "redsand",
]
# Same pixels the separate materials already use. Names stay the material names.
EXTRA = [
  ("coreplate", "tile-coreplate.png"),
  ("workbench", "tile-workbench.png"),
  ("benchSide", "tile-workbench-side.png"),
  ("ovenBrick", "tile-oven-brick.png"),
  ("ovenFront", "tile-oven-front.png"),
  ("vend", "tile-vend.png"),
  ("store", "tile-store.png"),
  ("bunk", "tile-bunk.png"),
]
S = 32
G = 2
CELL = S + G * 2

def core(im):
    im = im.convert("RGBA")
    if im.size != (S, S):
        im = im.resize((S, S), Image.BOX)
    return im

def extrude(tile):
    cell = Image.new("RGBA", (CELL, CELL))
    cell.paste(tile, (G, G))
    px = cell.load()
    for i in range(S):
        top, bot = px[G + i, G], px[G + i, G + S - 1]
        left, right = px[G, G + i], px[G + S - 1, G + i]
        for g in range(G):
            px[G + i, g] = top
            px[G + i, G + S + g] = bot
            px[g, G + i] = left
            px[G + S + g, G + i] = right
    tl, tr = px[G, G], px[G + S - 1, G]
    bl, br = px[G, G + S - 1], px[G + S - 1, G + S - 1]
    for y in range(G):
        for x in range(G):
            px[x, y] = tl
            px[G + S + x, y] = tr
            px[x, G + S + y] = bl
            px[G + S + x, G + S + y] = br
    return cell

def from_kenney(name):
    im = Image.open(os.path.join(SRC, name + ".png"))
    im = core(im)
    if name != "glass":
        bg = Image.new("RGBA", (S, S), (0, 0, 0, 255))
        bg.alpha_composite(im)
        im = bg
    return im

def from_strip(path, index):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    if w == S:
        step, inset = S, 0
    elif w == CELL:
        step, inset = CELL, G
    else:
        raise SystemExit("atlas width %s is not 32 or 36" % w)
    y = index * step + inset
    return im.crop((inset, y, inset + S, y + S))

names = list(BASE)
tiles = []
kenney = os.path.isdir(SRC)
if kenney:
    tiles = [from_kenney(n) for n in BASE]
else:
    prev = json.load(open("assets/atlas.json"))
    order = list(prev.keys())
    # cores already stored in atlas.json order; extras are reloaded from their pngs
    base_names = [n for n in order if n in BASE] or list(BASE)
    if base_names != list(BASE):
        raise SystemExit("atlas.json base names changed: %s" % base_names)
    tiles = [from_strip("assets/atlas.png", order.index(n)) for n in BASE]
    names = list(BASE)

for name, fn in EXTRA:
    tiles.append(core(Image.open(os.path.join("assets", fn))))
    names.append(name)

strip = Image.new("RGBA", (CELL, CELL * len(tiles)))
for i, tile in enumerate(tiles):
    strip.paste(extrude(tile), (0, i * CELL))
strip.save("assets/atlas.png", optimize=True)
json.dump({n: i for i, n in enumerate(names)}, open("assets/atlas.json", "w"))
open("assets/atlas.json", "a").write("\n")
print(len(names), strip.size, os.path.getsize("assets/atlas.png"))
