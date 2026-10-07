# Alice's Prairie AP 1.0.9

Builder accept on a fresh page, real clicks. Plate on main was AP 1.0.8.

## Check

```
STRIP 412 hawk pop squash,look,look,look,look p 0.040,0.240,0.420,0.580,0.760 ty 160,160,161,197,306 tx 415,299,426,336,261 sh hawk-shadow objs 120 parts 40 plate AP 1.0.9 capBad 0
STRIP 412 coyote pop squash,look,look,look,look p 0.040,0.220,0.420,0.590,0.770 ty 615,615,615,615,615 tx -17,25,71,111,153 objs 120 parts 42 capBad 0
STRIP 412 snake pop stretch,look,look,look,look p 0.050,0.230,0.400,0.590,0.760 ty 725,717,691,732,709 tx 426,385,345,301,262 objs 120 parts 40 capBad 0
STRIP 412 cloud pop stretch,look,look,look,look p 0.060,0.220,0.400,0.590,0.770 ty 185 sh cloud-shadow tx 1,74,156,243,325 objs 120 parts 4 capBad 0
STRIP 412 rabbit pop squash,look,look,look,look p 0.040,0.220,0.400,0.580,0.780 ty 584,591,555,562,591 tx -18,16,50,84,122 objs 120 parts 40 capBad 0
STRIP 412 weed pop settle,look,look,look,look p 0.117,0.234,0.403,0.584,0.792 ty 547,606,551,556,583 tx 1,28,67,110,158 objs 122 parts 4 capBad 0
STRIP 412 wonder pop squash,look,look,look,look p 0.047,0.235,0.412,0.600,0.812 ty 590,599,614,603,615 tx 100,189,273,362,371 objs 120 parts 40 capBad 0
STRIP 1366 hawk pop stretch,look,look,look,look p 0.050,0.220,0.420,0.580,0.760 ty 108,108,109,143,248 tx 116,391,68,320,530 sh hawk-shadow objs 120 parts 40 plate AP 1.0.9 capBad 0
STRIP 915 coyote pop stretch,look,look,look,look p 0.070,0.230,0.410,0.580,0.770 ty 256 tx 252,287,327,365,407 objs 120 parts 42 capBad 0
FPS webgl 3 renderer webgl objs 120 parts 36 layers 4
FPS webgl4x 2
ROTATE 161 -> 167 -> 191 seed 384364416 384364416 layers 4
FIT360 n 7 bad []
MOTION-OFF pops settle@0.020,settle@0.040,settle@0.090,settle@0.090
SCORE 412 100 seed 2731892296 taps 1 step 700
SCORE 915 100 seed 2731892296 taps 1 step 703
SCORE taps412 529:hawk@0.100
SCORE taps915 529:hawk@0.110
SCORE MATCH
LITE objs 48 parts 0 layers 1 fps 59 renderer canvas
bands-check ok
sim-check 0f5b63db7039
pixels 101 frames
console errors 0
```

Shots: proof/alice-1.0.9/strip-412-hawk.png and the same for coyote, snake, cloud, rabbit, weed, wonder. Also strip-1366-hawk.png and strip-915-coyote.png. Five frames each. Captions name the kind and show its picture. Hawk shadow is hawk-shadow. Cloud shadow is cloud-shadow.

WebGL fps is this sandbox's software renderer (3, and 2 at 4x CPU). Lite is one layer, no particles, canvas, 59 fps.

## Items

1a. DONE. Alice squashes 1.2/0.8, stretches 0.9/1.15, then settles, and looks toward the threat. She ducks when the approach ends. Motion-off skips the squash and shows her settled.
1b. DONE. The hawk's shadow grows, then the hawk flaps in on a curve. The coyote trots the ground line. The snake slithers in the grass. The cloud is a soft shadow. The rabbit hops. The tumbleweed rolls on an Arcade body. Wonderland hops in and waves.
1c. DONE. The pose is a function of progress p and the layout. The same daily seed and the same tap scored 100 at 412x915 and 915x412.
