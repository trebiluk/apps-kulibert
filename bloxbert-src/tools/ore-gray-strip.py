#!/usr/bin/env python3
"""Grayscale proof strip: stone + every ore, color on top and grayscale below (same luminance as the CSS grayscale filter).
python3 tools/ore-gray-strip.py OUT.png
Numbers under each tile are the mean luminance (0-255) of the ore chunks (stone: of the whole tile)."""
import importlib.util
import os
import sys
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location('audit', os.path.join(HERE, 'texpack-audit.py'))
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
texpack2 = audit.texpack2 if hasattr(audit, 'texpack2') else __import__('texpack2')
PACKS = audit.PACKS
S = 128
NAMES = [('Stone', 'stone'), ('Coal', 'stone_coal'), ('Copper', 'wrap_copperOre'), ('Iron', 'wrap_ironOre'), ('Zinc', 'wrap_zincOre')]


def gray(im):
    out = Image.new('RGB', im.size)
    px = im.load(); op = out.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b = px[x, y][:3]
            v = int(round(0.2126 * r + 0.7152 * g + 0.0722 * b))
            op[x, y] = (v, v, v)
    return out


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else 'ore-gray-strip.png'
    W = 16 + len(NAMES) * (S + 12)
    H = 2 * (2 * S + 78) + 20
    sheet = Image.new('RGB', (W, H), (34, 34, 38))
    d = ImageDraw.Draw(sheet)
    y0 = 8
    for pack in ('classic', 'mystical'):
        ref = texpack2.stone_tile(pack == 'mystical', base_only=True)
        d.text((8, y0), '%s pack: color, then grayscale. Numbers are mean brightness 0-255.' % pack, fill=(235, 235, 235))
        y0 += 16
        for i, (label, layer) in enumerate(NAMES):
            x0 = 8 + i * (S + 12)
            im = Image.open(os.path.join(PACKS, pack, layer + '.png')).convert('RGB')
            small = im.resize((16, 16), Image.Resampling.NEAREST)
            if layer == 'stone':
                vals = [audit.lum(small.getpixel((x, y))) for y in range(16) for x in range(16)]
            else:
                vals = [audit.lum(small.getpixel((x, y))) for y in range(16) for x in range(16) if tuple(ref.get(x, y)) != small.getpixel((x, y))]
            mean = sum(vals) / len(vals)
            big = im.resize((S, S), Image.Resampling.NEAREST)
            sheet.paste(big, (x0, y0))
            sheet.paste(gray(big), (x0, y0 + S + 6))
            d.text((x0, y0 + 2 * S + 12), label, fill=(235, 235, 235))
            d.text((x0 + 58, y0 + 2 * S + 12), '%d' % round(mean), fill=(255, 220, 140))
        y0 += 2 * S + 54
    sheet.save(out)
    print('wrote', out, sheet.size)


if __name__ == '__main__':
    main()
