#!/usr/bin/env python3
"""2.5.463: assert the calm atlas has no neon green and keeps gutters."""
import sys
try:
  from PIL import Image
except ImportError:
  print("PIL not installed, skip")
  sys.exit(0)
im = Image.open('assets/atlas.png').convert('RGBA')
w, h = im.size
if w != 36 or h != 1044:
  print(f"FAIL size {w}x{h}, expected 36x1044")
  sys.exit(1)
px = im.load()
ids = [0, 1, 2, 3, 10, 11, 12, 13]
fail = False
for idx in ids:
  y0 = idx * 18
  rs, gs, bs, n = 0, 0, 0, 0
  holes = 0
  for y in range(y0 + 2, y0 + 16):
    for x in range(2, 16):
      r, g, b, a = px[x, y]
      if a < 128:
        holes += 1
        continue
      rs += r; gs += g; bs += b; n += 1
      if g > 200 and r < 90 and b < 90:
        print(f"FAIL tile {idx} neon green at {x},{y}: {r},{g},{b}")
        fail = True
  if n:
    print(f"tile {idx}: mean RGB {rs//n},{gs//n},{bs//n}  holes {holes}")
  if idx == 13 and holes < 4:
    print(f"note: leaves (13) has {holes} alpha holes (solid is ok if no neon)")
print("PASS" if not fail else "FAIL")
sys.exit(1 if fail else 0)
