# Alice's Prairie AP 1.0.10

Builder accept on a fresh page, real clicks. Plate on main was AP 1.0.9.

## Check

```
LOADER p 0.75 rx 270 run 1 then run 0 loader 1 plate AP 1.0.10
HOME412 groom alice-groom-2 ear wonder-ear-2 bug 62 layers 4 parts 36 objs 82 fps 59 renderer webgl loader 0 plate AP 1.0.10
TILES412 lookout alice-wave-0 bounce go@0 | dress lock go@40 | burrow lock go@80 | signals lock go@120 | dash lock go@160 | dig lock go@200
PICKER Class L01 visible lookout tile hidden
HOME915 groom alice-groom-1 ear wonder-ear-1 bug 18 layers 4 parts 36 objs 82 fps 60
ROTATE alice-groom-1 -> alice-groom-0 layers 4 tiles 6
ROTATE PICKER ok
HOME1366 groom alice-groom-1 ear wonder-ear-0 bug 217 layers 4 parts 36 objs 82 fps 50 renderer webgl
FPS4x 34 renderer webgl objs 82 parts 36 layers 4
FIT360 n 6 bad []
MOTION groom alice-groom-0 ear wonder-ear-0 bug empty parts 0 bounce still,still,still,still,still,still later same
LITE objs 15 parts 0 layers 1 fps 60 renderer canvas
GZ 522263
bands-check ok
sim-check 0f5b63db7039
pixels 110 frames
console errors 0
```

Shots: proof/alice-1.0.10/loader-412.png, home-412.png, home-915.png, home-1366.png, home-360.png, picker-412.png.

First visit gzip is 522263 bytes (under 650 KB). The hawk row stays in the sky. Alice grooms and Wonderland's ears change frames. A butterfly crosses. Soon tiles keep the lock. Tiles bounce in 40 ms apart. Motion-off holds still. Lite is one layer, no particles, canvas, 60 fps.

WebGL at 1366 in this sandbox is 50 fps, and 34 at 4x CPU. Phone sizes hold 59–60. Lite holds 60.

## Items

1a. DONE. Home is the burrow entrance: the same sky, hills, and grass. Alice grooms, Wonderland's ears twitch, and a butterfly crosses.
1b. DONE. Tiles bounce in with Back.easeOut, staggered 40 ms. Motion-off shows them at once. The loading bar is on screen at 75% with pixel Alice running (frame 1 then 0). Soon tiles keep the lock picture.
