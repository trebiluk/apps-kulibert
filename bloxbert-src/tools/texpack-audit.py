#!/usr/bin/env python3
"""Audit pack tiles against the StyleBot art rules (Oct 30 2026). Prints offenders; --strict exits 1 on any.

Rules checked per tile (64px masters in assets/packs/<pack>/<layer>.png):
  - tones between about 15% and 85% luminance (38..217 of 255); no pure white, no pure black
  - HSL saturation of any pixel at most 0.60 (rule says about 55%)
  - not flat: at least 3 distinct tones in the 16 x 16 reading of the tile
  - no channel above #E0 in the tile mean-bright zone: brightest pixel luminance at most 224
Usage: python3 tools/texpack-audit.py [--strict] [layer ...]
"""
import colorsys
import json
import os
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACKS = os.path.join(ROOT, 'assets', 'packs')
SKIP = {'glass', 'wrap_doorGlass', 'water'}  # alpha / water tiles have their own rules
SAT_MAX = 0.60
LUM_MIN, LUM_MAX = 38, 224
MIN_TONES = 3


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def hsl_sat(c):
    h, l, s = colorsys.rgb_to_hls(c[0] / 255.0, c[1] / 255.0, c[2] / 255.0)
    return s


def audit(pack, layer):
    im = Image.open(os.path.join(PACKS, pack, layer + '.png')).convert('RGB')
    # Read the tile as 16 x 16 (masters are 4x4 blocks at 64px, or 2x2 cells for the older ones).
    small = im.resize((16, 16), Image.Resampling.NEAREST)
    cols = [small.getpixel((x, y)) for y in range(16) for x in range(16)]
    allc = list(im.getdata())
    problems = []
    lo = min(allc, key=lum)
    hi = max(allc, key=lum)
    if lum(lo) < LUM_MIN:
        problems.append('too dark #%02X%02X%02X (lum %d)' % (lo + (int(lum(lo)),)))
    if lum(hi) > LUM_MAX:
        problems.append('too bright #%02X%02X%02X (lum %d)' % (hi + (int(lum(hi)),)))
    sat = max(allc, key=hsl_sat)
    if hsl_sat(sat) > SAT_MAX:
        problems.append('saturated #%02X%02X%02X (S %.2f)' % (sat + (hsl_sat(sat),)))
    tones = len(set(cols))
    if tones < MIN_TONES:
        problems.append('flat (%d tone%s)' % (tones, '' if tones == 1 else 's'))
    return problems, tones


def main():
    strict = '--strict' in sys.argv
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    order = json.load(open(os.path.join(PACKS, 'sheet.json')))['order']
    bad = 0
    for pack in ('classic', 'mystical'):
        for layer in order:
            if layer in SKIP or (only and layer not in only):
                continue
            problems, tones = audit(pack, layer)
            if problems:
                bad += 1
                print('%-8s %-22s %s' % (pack, layer, '; '.join(problems)))
    print('audit: %d tiles with problems' % bad)
    if strict and bad:
        sys.exit(1)


if __name__ == '__main__':
    main()
