# Alice's Prairie AP 1.0.6 proof

Fresh page `http://127.0.0.1:8099/alice/` (built `alice/`, Playwright chromium, `page.touchscreen.tap` at each control center). 0 console errors. Plate `Alice's Prairie · AP 1.0.6`.

## 1. Every screen fits

en and ar at 360×740, 412×915, 915×412, 844×390, 1366×768. Home, picker, and Lookout: no control overlap, every control on screen, `elementFromPoint` at the center is that control, taps ≥44. Sideways picker shows all 6 cards. Tap L01 starts First Watch (`الحراسة الأولى` in ar). Read and Help use different icons. Alarms read Sky / Ground / Snake.

```
360x740 en OK controls 9 cards 6 live First Watch · Keep the pups safe · 500
412x915 en OK controls 9 cards 6 live First Watch · Keep the pups safe · 500
915x412 en OK controls 9 cards 6 live First Watch · Keep the pups safe · 500
844x390 en OK controls 9 cards 6 live First Watch · Keep the pups safe · 500
1366x768 en OK controls 9 cards 6 live First Watch · Keep the pups safe · 500
360x740 ar OK controls 9 cards 6 live الحراسة الأولى · احمِ الصغار · 500
412x915 ar OK controls 9 cards 6 live الحراسة الأولى · احمِ الصغار · 500
915x412 ar OK controls 9 cards 6 live الحراسة الأولى · احمِ الصغار · 500
844x390 ar OK controls 9 cards 6 live الحراسة الأولى · احمِ الصغار · 500
1366x768 ar OK controls 9 cards 6 live الحراسة الأولى · احمِ الصغار · 500
```

## 2. Motion, Lite, clock

```
motion OK flag less row Less motion: On
lite OK before webgl after 2d setting on
clock OK lookout-L01 0 60 -> lookout-L01 0 60 drop 0
```

`prefers-reduced-motion: reduce` → `data-ap-motion=less` and Settings row `Less motion: On`. Lite On reloads onto a Canvas 2d renderer (baseline was webgl). Hiding the tab 5s does not move the round clock (60 → 60).

## 3. Pixel art

`node tools/pixels.mjs` twice, same PNG sha256 `ab048a0252021e7fdd2992cb405f768ff45ebd79d871cba99308dfc3f2dafc05` (1018×92, 83 frames). Alpha masks differ for hawk, coyote, snake, rabbit, cloud, tumbleweed, Wonderland, Alice, and pup. Captions: Hawk. Tap Sky. / Coyote. Tap Ground. / Snake. Tap Snake. / Cloud. Not a hawk. / Rabbit. A friend. / Tumbleweed. Let it pass. / Wonderland. A friend.

Shots at 412 and 1366 show the pixel cast. L01 shows a hawk, its shadow, and `Hawk. Tap Sky.`

`bands-check ok`. `sim-check 0f5b63db7039` (unchanged).

## FAIL
(none)
## ERRORS
(none)
