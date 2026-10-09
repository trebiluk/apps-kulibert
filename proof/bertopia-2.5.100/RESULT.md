# Bertopia 2.5.100 proof — ponds and green wheat

2.5.99 was already the shared-slots Box ship, so this farm fix is 2.5.100. Their slots changelog entry is kept. Live on blocks-test, PC mouse, Survival, lite. Console bad: none (WebGL startup noise ignored).

## 1. Walk to a pond and till
Seed-1 ponds: 5×5 depth 1 at (5,−11), 4×4 depth 2 at (−2,5) and (16,−6). Nearest water is 8 blocks from spawn. Holding forward from spawn reached 2.9 blocks from the pond center in 1.8 s, feet on the ground. Hoe on the grass beside it (4,4,−11) became Wet Farmland (63). Notes: farmWet, farmNote.

Water is not solid and not a target. Breaking the pond cell returns false and the water stays.

## 2. Green until the card says Ripe
Planted on that wet tile (sprout 59, soil stays 63). setGrown cuts:

| grown | id | card |
|---|---|---|
| 0 | 59 Sprout | Wheat - Sprout - ripe in 4:00 |
| 33% | 60 Leafy | Wheat - Leafy - ripe in 2:41 |
| 66% | 61 Tall | Wheat - Tall - ripe in 1:22 |
| 99% | 61 Tall | Wheat - Tall - ripe in 0:03 |
| 100% | 62 Ripe | Wheat - Ripe |

Screenshots stage-0/33/66/99/100.png. Pixel box on the plant: gold pixels 16, 0, 0, 0, then 3621 only at Ripe. Sprout is light green, leafy mid green, tall deep green. 99% is still the deep green tall model while the card says ripe in 0:01. Ripe is gold with the sparkle. stage-leafy-412.png and stage-leafy-915.png stay green and readable.

## 3. Row of 5
Seeds or a Hoe: blockTargetIdCheck is false for crop ids 59–62. Empty hand: true. Standing in reach, one crop already at (19,5,7) stayed 59 while seeds planted (20–24, 5, 7), all 59. Seeds 10 → 5. Nothing in that row was broken.

## 4. Old save
Planks on the first rescue spot stayed (16). Wiped 65 still-water cells inside 40 of spawn (0 left). ensure added one 4×4 (16 water) at (−16,4), center 22.6 blocks out, not on the planks. pondAid true.

## 5. Rotate
915×412 then 412×915 mid-play. Console bad [].

Gzip student total 740314. blocks-test app.js gzip 454925. Both under 1 MB. strings: 0 problems.
