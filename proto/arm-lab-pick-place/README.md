# Arm Lab

Grey-box prototype of the robot-arm game, levels 1–3 only. Session only: no accounts, saves, names, chat, or network calls. Best scores stay in memory until the page is closed.

Open `index.html` in a browser, or from the repo root:

```
python3 -m http.server 8765
```

Then visit http://127.0.0.1:8765/proto/arm-lab-pick-place/

## Try level 1

Level 1 is Grab. The part is already in the open gripper, above the bin. You can finish it in well under 30 seconds.

1. Press **Close** (key 6), then **Open** (key 5).
2. Press **Run** (Enter).
3. The gripper closes, then opens. The part drops in the bin. The status says the part is in the bin. Blocks and time show, and Best this session updates.
4. Press **Retry**. The arm resets and the two blocks stay.

To see a miss: press **Clear**, add **Shoulder -15** twice (key 2 or the down arrow), then **Run**. The arm stops and the status says `gripper hit table at step 2`. The stopped step is marked. **Retry** keeps the program.

Levels 2 and 3 use the same blocks. Level 2 is move and grab. Level 3 is pick and place: lift over the wall before you swing. Repeat is not in this prototype.

Do not merge this branch. Do not deploy it to production.
