# Bertopia 2.5.109

Verdict: PASS

Shipped as 2.5.109 because 2.5.108 (Oven missing-ingredient line, Bag ready on open) landed on main during rebase. The proof below was run on this same bush code before that rebase. Fresh Survival, real right-click and hold-to-break. Blocks: 65 sprout (bushYoung), 66 leafy (bushLeaf), 67 full-green (bushFull), 68 fruiting (bushFruit).

- PASS fresh survival sprout
- PASS plant on wet grass — sprout spent, block 65, grass stays grass, wet
- PASS unripe tap is card only — Berry Bush - Sprout - ripe in 5:00, bush stays
- PASS dry bush — ripe in 10:00 and dry soil
- PASS farmland says why — Bushes grow on grass, not farmland.
- PASS water says why — Bushes cannot grow in water.
- PASS stone says why — Bushes cannot grow on stone.
- PASS ripe tap — +2 Berry, bush stays full-green (67), Regrows in 3:00
- PASS second tap on a growing bush adds no berries
- PASS offline jump ripens once — grown 600000, block 68
- PASS clock back does not go negative
- PASS forward jump stays one ripe
- PASS regrow jump caps at 6 min wet — grown 360000
- PASS break returns 1 sprout — bush gone
- PASS wheat still plants and harvests — +2 Wheat +1 Wheat Seeds
- PASS full bag — +2 Berry pop, berries in Lost & Found
- PASS box and oven still open
- PASS card 915x412 — readable, 44px tall, on screen
- PASS card rotate 412x915 — readable, on screen
- PASS console 0 errors
