# Alice's Prairie AP 1.0.7

Builder accept on a fresh page, real taps and clicks, 5 sizes, en and ar. Plate on main was AP 1.0.6 (`42404d9`).

## Check

```
OK 360x740 en
OK 412x915 en
OK 915x412 en
OK 844x390 en
OK 1366x768 en
OK 360x740 ar
OK 412x915 ar
OK 915x412 ar
OK 844x390 ar
OK 1366x768 ar
CONTRAST {"help":{"cid":"help","min":15.79,"n":72,"dark":0,"bg":[11,31,58]},"read":{"cid":"read","min":14.12,"n":120,"dark":0,"bg":[11,31,58]}}
OK contrast help 15.79 speaker 14.12
FRAMES alice-pop-0,alice-pop-1,alice-pop-2
OK alice frames alice-pop-0 alice-pop-1 alice-pop-2
MISSED Endless · 0 | We'll get it next time! | The coyote got past. Coyotes need the Ground alarm. | +0 Seeds · This desk 0 | Try again | Home
OK miss results (next time, the reason, no high five)
CLEARED First Watch · 3600 | High five! | +40 Seeds · This desk 3600 | Try again | Home
OK cleared results (high five, no next time, no reason line)
OK 915 results rails covered
OK rotate 17 -> 70 pups 6
OK motion Less motion: On
OK lite webgl -> 2d
OK hide clock held 11
OK tap resumed
bands-check ok
sim-check 0f5b63db7039
pixels sha256 ab048a0252021e7fdd2992cb405f768ff45ebd79d871cba99308dfc3f2dafc05
```

Each size opened Menu, Settings, and Coming soon at home, then Help, Menu, Settings, and Restart mid-round. The step did not move for 3 seconds with a card open. A click where Dig or Snake had been did not open a new card and did not change score or why. Close and Keep resumed the round.

## Items

1. DONE. A card hides the scene controls. The panel is DOM. Plain lines block taps.
2. DONE. Help, Menu, and Settings pause the round. Close and Keep resume it. Hiding the tab still holds the clock, and a tap resumes it.
3a. DONE. Help 15.79:1, speaker 14.12:1, on #0b1f3a. No dark ink left.
3b. DONE. A miss says next time and the reason. A clear says High five only.
3c. DONE. alice-pop-0, alice-pop-1, and alice-pop-2 all show within 1 second.
3d. DONE. Arabic goal text is RTL (the score sits at the end).
