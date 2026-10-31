#!/usr/bin/env python3
"""Before/after swatch sheet for texture pack part 2 (2.5.553).

python3 tools/texpack2-sheet.py BEFORE_PACKS_DIR OUT_DIR
BEFORE_PACKS_DIR holds classic/ and mystical/ from the previous version (assets/packs).
Writes OUT_DIR/swatch-classic.png and swatch-mystical.png. Each row: before, after, after at 32px (what small
textures and phones show), all nearest neighbor.
"""
import os
import sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import texpack2  # noqa: E402

ROOT = os.path.dirname(HERE)
before_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
S = 128


def load(root, pack, layer):
    return Image.open(os.path.join(root, pack, layer + '.png')).convert('RGB')


for pack in ('classic', 'mystical'):
    layers = texpack2.LAYERS
    cols = 2
    rows = (len(layers) + cols - 1) // cols
    cw = S * 3 + 40
    sheet = Image.new('RGB', (cols * cw + 16, rows * (S + 26) + 40), (38, 38, 42))
    d = ImageDraw.Draw(sheet)
    d.text((8, 6), '%s: before | after | after at 32px (x4)   2.5.553' % pack, fill=(232, 232, 232))
    for i, layer in enumerate(layers):
        x0 = 8 + (i % cols) * cw
        y0 = 28 + (i // cols) * (S + 26)
        d.text((x0, y0), layer, fill=(232, 232, 232))
        b = load(before_dir, pack, layer).resize((S, S), Image.NEAREST)
        a = load(os.path.join(ROOT, 'assets', 'packs'), pack, layer)
        small = a.resize((32, 32), Image.BOX).resize((S, S), Image.NEAREST)
        sheet.paste(b, (x0, y0 + 14))
        sheet.paste(a.resize((S, S), Image.NEAREST), (x0 + S + 10, y0 + 14))
        sheet.paste(small, (x0 + 2 * S + 20, y0 + 14))
    sheet.save(os.path.join(out_dir, 'swatch-%s.png' % pack))
    print('wrote', os.path.join(out_dir, 'swatch-%s.png' % pack))
