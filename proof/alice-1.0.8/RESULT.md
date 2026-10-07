# Alice's Prairie AP 1.0.8

Builder accept on a fresh page, real clicks, 412x915, 1366x768, plus 360x740 fit and a 915x412 rotate. Plate on main was AP 1.0.7.

## Check

```
OK Sunny 412x915 weather Sunny objs 119 parts 36 layers 4 webgl plate AP 1.0.8
OK Sunny 1366x768 weather Sunny objs 119 parts 36 layers 4 webgl
OK Breezy 412x915 weather Breezy objs 119 parts 0 layers 4
OK Breezy 1366x768 weather Breezy objs 107 parts 0 layers 4
OK Drizzle 412x915 weather Drizzle objs 119 parts 36 layers 4
OK Drizzle 1366x768 weather Drizzle objs 107 parts 36 layers 4
OK Snowy 412x915 weather Snowy objs 119 parts 36 layers 4
OK Snowy 1366x768 weather Snowy objs 107 parts 36 layers 4
OK Night 412x915 weather Night objs 119 parts 0 layers 4
OK Night 1366x768 weather Night objs 119 parts 0 layers 4
OK motion-off diff 0 of 317588 weather Sunny step 198 layers 4
FPS webgl 13 renderer webgl objs 119 parts 36 layers 4
FPS webgl4x 9 renderer webgl objs 107 parts 36 layers 4
LITE canvas objs 40 parts 0 layers 1 fps 58
OK rotate 29 -> 82 origin true layers 4
OK fit360 n 7
bands-check ok
sim-check 0f5b63db7039
pixels 99 frames
```

Shots: proof/alice-1.0.8/sunny-412.png, sunny-1366.png, breezy-412.png, breezy-1366.png, drizzle-412.png, drizzle-1366.png, snowy-412.png, snowy-1366.png, night-412.png, night-1366.png. Motion-off pair still-a.png and still-b.png differ by 0 pixels outside the threat.

WebGL fps is the headless software renderer in this sandbox (13, and 9 at 4x CPU). Lite is one layer, no particles, canvas, 58 fps.

## Items

1a. DONE. Sky gradient, far hills (scroll 0.2), near hills (scroll 0.5), a tilemap field, and foreground tufts. Clouds and far hills drift. The camera eases 4% toward the active hole.
1b. DONE. Tufts sway on a 3-frame anim, three butterflies follow tween paths, two grasshoppers hop on Arcade bodies, and a bird line crosses.
1c. DONE. L01–L03 Sunny, L04 Breezy, L05 Drizzle, L06 Breezy. Daily picks by the day (Sunny, Breezy, Drizzle, Snowy, Night). The six looks tint the sky.
