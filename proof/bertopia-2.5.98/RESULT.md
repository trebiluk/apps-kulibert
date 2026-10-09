# Bertopia 2.5.98 proof — Farming F2

Live on blocks-test `?q=lite&smoke=1` at 1366×768, then 915×412 and 412×915. Console errors: none (WebGL/GPU noise ignored).

Still water is a new block (id 64). Ice is not water. Survival has no water item; the proof places the block. Creative can place it. Wet farmland (id 63) and the four crop stages (59–62) stay out of the creative bar.

## Plant, wet soil, live growth

Hoe tilled plot grass to farmland. Water at (22, 4, 13) turned the z=10 row into wet farmland (63) and left the z=6 row dry (49). Six wheat seeds planted on the top face: 32 → 26 seeds, every crop id 59.

After 2.3s the real ticker had moved dry crops by about 1360 grown and wet crops by about 2720 (exactly 2×). Full ripe is 480000 grown: 8 min dry, 4 min wet. Each stage is a quarter of that.

## Card and click

Right-click did not change the voxel.

- Dry leafy: `Wheat - Leafy - ripe in 6:00 Dry soil: grows slowly. Water nearby = 2x.`
- Wet leafy: `Wheat - Leafy - ripe in 3:00`
- Fully grown: `Wheat - Ripe`

Notebook, once each: farm note, wet soil, seed, ripe crop.

## Break and sweep

Breaking a sprout put the seed back (bag 8 before the plant, 8 after the break), cleared the voxel, and dropped the save record.

One right-click stroke across six real farmland cells (x 19–24, z 7, all id 49) planted five. The sixth stayed air. Seeds 10 → 5.

A clock jumped forward did not un-grow a crop (grown stayed 50000, lastSeen stayed in the future).

## Closed for 5 minutes

Save, then the stored `lastSeen` was moved back 5 minutes and the tab reloaded. Wet crops came back ripe and capped (grown 480000, id 62), not a further stage. Dry crops came back tall (grown 302659, id 61): 5 minutes plus the few seconds of save and reload, not ripe.

## Screenshots

`wet-soil.png`, `stage-sprout.png`, `stage-leafy.png`, `stage-tall.png`, `stage-ripe.png`, `card.png`, `rotate-915.png`, `rotate-412.png`.
