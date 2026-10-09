# Bertopia 2.5.102 proof — harvest, replant, flour and bread

Live on blocks-test, PC mouse, Survival, lite, fresh world. Console bad: none (WebGL startup noise ignored). Energy stayed 10 bolts, still on the 0–10 bar.

## 1. Three wet ripe harvests
Pond-side wet farmland (63) at (4, 4, −12/−11/−10). Crops set to ripe (62). Each right-click:

| z | wheat | seeds | tile | toast |
|---|---|---|---|---|
| −12 | 0→2 | 5→6 | 59 Sprout | Replanted |
| −11 | 2→3 | 6→7 | 59 Sprout | Replanted |
| −10 | 3→5 | 7→8 | 59 Sprout | Replanted |

Soil stayed wet farmland. Two fly-icons popped on the first harvest. First card: "Wheat makes Flour at the Workbench. 2 Flour bakes Bread in the Oven." Notebook: farmReplant and farmHarvest.

## 2. No seed
Ripe wheat at (4, 5, −15) with an empty bag. Tile became air, wet farmland stayed, wheat 1, seeds 2. Toast: "Harvested - no seed to replant".

## 3. Unripe
Right-click the sprout at (4, 5, −12). Card: "Wheat - Sprout - ripe in 3:47". Voxel stayed 59. No toast. Wheat did not change.

## 4. Break is not a harvest
Chop of the sprout at (4, 5, −10): seeds 8→9, wheat stayed 0, tile gone, farmland stayed. No harvest toast. Notebook did not add another harvest line.

## 5. Flour and bread
5 wheat became 5 flour at the workbench. 2 flour baked in the oven (8s) into 1 bread. Energy 10 before and after. Recipe lines: "need 1 Wheat (grow it on Farmland)" and "Bake in Oven · Wheat (grow it on Farmland)".

## 6. Sweep and a full bag
One press harvested 5 of 6 ripe tiles at x=3 (sprout 59). The sixth stayed ripe (62). A full bag of dirt sent the wheat and seeds to the ground and toasted "Bag full" (Lost & Found still waits until the ground cap, as before).

## 7. Rotate
915×412 then 412×915 mid-play. Console bad [].

Gzip student total 743185. blocks app.js gzip 454355. blocks-test app.js gzip 458066. Both under 1 MB. strings: 0 problems. 2.5.101 scale lock stayed in place.
