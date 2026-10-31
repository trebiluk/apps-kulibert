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

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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


ORES = [('coal', 'stone_coal'), ('copper', 'wrap_copperOre'), ('iron', 'wrap_ironOre'), ('zinc', 'wrap_zincOre')]
ORE_STEP = 30  # luminance units (of 255) between stone and each ore, and between any two ores


def grid16(pack, layer):
    im = Image.open(os.path.join(PACKS, pack, layer + '.png')).convert('RGB').resize((16, 16), Image.Resampling.NEAREST)
    return [[im.getpixel((x, y)) for x in range(16)] for y in range(16)]


def shapes_of(mask):
    """4-connected chunks of True cells, each as a normalized frozenset (so the same shape anywhere matches)."""
    seen = set()
    out = []
    for y in range(16):
        for x in range(16):
            if not mask[y][x] or (x, y) in seen:
                continue
            stack = [(x, y)]
            cells = []
            seen.add((x, y))
            while stack:
                cx, cy = stack.pop()
                cells.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < 16 and 0 <= ny < 16 and mask[ny][nx] and (nx, ny) not in seen:
                        seen.add((nx, ny))
                        stack.append((nx, ny))
            x0 = min(c[0] for c in cells)
            y0 = min(c[1] for c in cells)
            out.append(frozenset((c[0] - x0, c[1] - y0) for c in cells))
    return out


def ore_check(verbose=True):
    """Ores must separate WITHOUT color: a brightness step from stone and from each other, and a shape of their own."""
    import texpack2
    bad = []
    for pack in ('classic', 'mystical'):
        ref = texpack2.stone_tile(pack == 'mystical', base_only=True)
        refg = [[ref.get(x, y) for x in range(16)] for y in range(16)]
        refl = [[lum(refg[y][x]) for x in range(16)] for y in range(16)]
        stone_ref = sum(sum(r) for r in refl) / 256.0
        sg = grid16(pack, 'stone')
        stone_act = sum(lum(sg[y][x]) for y in range(16) for x in range(16)) / 256.0
        lo, hi = min(stone_ref, stone_act), max(stone_ref, stone_act)
        means = {}
        shape_sets = {}
        for name, layer in ORES:
            g = grid16(pack, layer)
            mask = [[tuple(refg[y][x]) != g[y][x] for x in range(16)] for y in range(16)]
            ls = [lum(g[y][x]) for y in range(16) for x in range(16) if mask[y][x]]
            means[name] = sum(ls) / len(ls)
            ch = shapes_of(mask)
            shape_sets[name] = set(ch)
            if not (3 <= len(ch) <= 5):
                bad.append('%s %s has %d chunks (want 3 to 5)' % (pack, name, len(ch)))
            for c in ch:
                if not (2 <= len(c) <= 9):
                    bad.append('%s %s chunk of %d cells (want 2 to 9)' % (pack, name, len(c)))
            if not (means[name] <= lo - ORE_STEP or means[name] >= hi + ORE_STEP):
                bad.append('%s %s mean lum %.0f is within %d of stone (%.0f-%.0f)' % (pack, name, means[name], ORE_STEP, lo, hi))
        names = [n for n, _ in ORES]
        for i in range(len(names)):
            for j in range(i + 1, len(names)):
                a, b = names[i], names[j]
                if abs(means[a] - means[b]) < ORE_STEP:
                    bad.append('%s %s (%.0f) and %s (%.0f) are less than %d apart in grayscale' % (pack, a, means[a], b, means[b], ORE_STEP))
                if shape_sets[a] & shape_sets[b]:
                    bad.append('%s %s and %s share a chunk shape' % (pack, a, b))
        if verbose:
            print('ores %-8s stone %.0f | ' % (pack, (stone_ref + stone_act) / 2) + '  '.join('%s %.0f' % (n, means[n]) for n in sorted(means, key=lambda k: means[k])))
    return bad


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
    ores = ore_check()
    for line in ores:
        print('ORE', line)
    print('audit: %d tiles with problems, %d ore problems' % (bad, len(ores)))
    if strict and (bad or ores):
        sys.exit(1)


if __name__ == '__main__':
    main()
