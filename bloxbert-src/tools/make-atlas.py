# Build a 32px vertical-strip atlas from the Kenney Voxel Pack (CC0) tiles.
# One tile per layer; noa reads a vertical strip as a 2D texture array.
import json, os
from PIL import Image
# Unzipped Kenney Voxel Pack (CC0, kenney.nl/assets/voxel-pack), PNG/Tiles folder. Set KENNEY_TILES or edit this line.
SRC = os.environ.get("KENNEY_TILES", "kenney/PNG/Tiles")
TILES = [
  "grass_top", "dirt_grass", "dirt", "stone", "greystone", "stone_coal", "sand",
  "gravel_stone", "brick_red", "brick_grey", "wood", "trunk_top", "trunk_side",
  "leaves", "cotton_blue", "cotton_green", "cotton_red", "cotton_tan", "snow",
  "ice", "redsand", "glass",
]
S = 32
strip = Image.new("RGBA", (S, S * len(TILES)), (0, 0, 0, 0))
for i, name in enumerate(TILES):
    im = Image.open(os.path.join(SRC, name + ".png")).convert("RGBA").resize((S, S), Image.BOX)
    if name != "glass":
        # opaque tiles: flatten any soft alpha so the atlas needs no blending
        bg = Image.new("RGBA", (S, S), (0, 0, 0, 255)); bg.alpha_composite(im); im = bg
    strip.paste(im, (0, i * S))
# opaque atlas without glass; glass gets its own tiny texture (alpha)
opaque = strip.crop((0, 0, S, S * (len(TILES) - 1)))
opaque.save("assets/atlas.png", optimize=True)
glass = strip.crop((0, S * (len(TILES) - 1), S, S * len(TILES)))
glass.save("assets/glass.png", optimize=True)
json.dump({n: i for i, n in enumerate(TILES[:-1])}, open("assets/atlas.json", "w"))
print(os.path.getsize("assets/atlas.png"), os.path.getsize("assets/glass.png"))
