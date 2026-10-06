# Bertopia crafting and machine screens: Build Tray + Machine Panel (GameMaster design brief, 2026-10-06 10:20 AM ET)
Diego (Oct 6): "Do we have visual drag and drop crafting, machine GUI, etc? Refine that mechanic."
**What we have today:** CORE-MECHANICS §9 is a tap-first recipe *list* (Can make now / Almost / Show all, ×1 and ×Max). Machines only say "Open (panel)" with no shared layout. kw-interact already has `openPanel`, `enableTapToSlot`, `enableDrag` and the 250 ms panel hold/drag timing (2.6.0), so this brief needs no new gesture code.
**What this adds:** a visual **Build Tray** for crafting and one shared **Machine Panel** that every machine uses. The list stays as the fast way in, and drag is always paired with tap-to-slot (no drag-only action, no long-press-only action).
House rules hold: no 3×3 crafting grid or any other look-alike layout, icon + 1–2 words, taps ≥ 44 px (slots 56 px), teal/cyan first, 8 languages + RTL mirror, steady light, Motion off = no animation.

## 1. Build Tray (crafting at the Workbench and by hand)
**Open:** tap a recipe tile in the list (§9) → the tray opens on that recipe. A **Tinker** tab next to the list opens an empty tray (§2).
**Look:** the item drawn as a simple **exploded parts picture** (box-primitive art), with an empty glowing slot on each part. Chair = seat slot (Planks ×4 shown as 4 pips on one slot) + back slot + 2 leg slots (Sticks). Copper Coil = core slot + wire wrap slot. Every recipe's slots sit on its picture, so the shape teaches what the parts are for; there's no memorised grid pattern.
- Slot shows a faint ghost of the needed part + "2/4" count. Filled = solid part + ✓. Wrong item = the slot shakes once (Motion on) or outlines amber, with a chip "This slot needs Sticks".
- **Fill in:** drag a stack from the Bag strip onto a slot (it takes only what's needed), or tap a Bag item then tap the slot (tap-first). Keyboard: Tab to a slot, Enter = place the selected Bag item.
- **Fill** button: fills every slot from the Bag in one tap (speed for mastery players, motor access for everyone). **×Max** stays on the list tile.
- **Make** button lights when all slots are full. Output pops into the Bag (full Bag → drops at your feet, never lost). Hand recipes are instant; station recipes show their timer on the Make button as a ring.
- **First build of each recipe by hand** (dragging or tapping each part, not Fill) stamps the Engineering Notebook and shows a one-line "how it works" card ("A coil of copper wire around iron makes a magnet when power flows."). After that, Fill is just as good; nothing is ever locked behind manual building.
- **Undo:** tap a filled slot to take the part back. ✕ closes and returns every part to the Bag.
**Layouts:** phone upright 412×915 = picture on top (≈ 60% height), Bag strip of 15 slots at the bottom in 2 rows, Fill / Make under the picture. Phone sideways 915×412 = picture left, Bag strip as a right column (3×5), buttons under the picture. Chromebook 1366×768 = 760 px centred panel, Bag strip below. Rotate mid-build keeps every placed part and the held item.

## 2. Tinker tab (discover recipes, optional)
- An empty tray with 6 free slots. Drop any parts in. If they make a recipe you haven't found yet, the picture assembles and the recipe joins your list (Bertodex "Recipes found" counter).
- No match → Berty's Bot gives a hint chip based on the closest recipe, never the answer: "Close! A motor also needs something that spins." Max 3 hints per recipe, then a "Show recipe" button.
- Every recipe is still visible in Show all; Tinker is for kids who like figuring things out. Tinker finds count toward the plaque goal "Inventor: find 25 recipes in Tinker".
- Nothing is used up in Tinker until you press Make.

## 3. Machine Panel (one layout for every machine)
Opens with **Open** (tap the machine / right click), per CORE-MECHANICS. The machine keeps running while the panel is open; the panel updates 4 times a second.
**Header:** machine icon + name · a status sentence, never a code ("Smelting copper: 12 s left" / "Waiting for ore" / "No power: connect a battery" / "Output full: take items or add a tube") · On/Off switch.
**Run tab (default)** is one row that reads left to right (mirrored in RTL):
`Inputs` → `Process` → `Outputs`
- **Inputs:** 1–4 slots with ghost icons of what fits. **Process:** a progress ring with time left, plus the machine's part picture (Motion on: gentle spin or glow, 1 cycle per 2 s or slower). **Outputs:** 1–4 slots; tap = take into Bag; **Take all** button.
- **Power strip** under the row: "Needs 20 W · Getting 20 W" with a meter and icon (amber + "Low power" text when short, never colour only). Fuel machines show a Fuel slot instead (Coal, Corn Mash), with a burn-time ring.
- **Fill inputs** button pulls matching items from the Bag; Shift+click quick-moves on Chromebook.
**Wires tab:** a small 3D cube of the machine with 6 face tiles. Tap a face to cycle **In · Out · Power · Off**, each with an icon and word. A side list shows what's connected on each face ("Left: Item Tube from Ore Box"). This is how kids set up automation without guessing.
**Inside tab (the lesson):** a cutaway picture of how the machine works, 1–2 sentences of real science, stored as a `fact` row in REGISTRY.json so Curriculum checks it with the registry before mach-1 ships, and live numbers (W in, items/min, yield %). Motion off = a still labelled diagram.
**Stats tab:** items made, items/min, uptime %, power used. These are the same numbers the Mastery measures read (Throughput, Power), so kids can see what the challenge scores.
**Upgrades:** 0–2 upgrade slots in the Run tab (Speed, Efficiency, Storage) where a machine allows them. Upgrades show their trade-off ("Speed: 2× faster, 2× power").
**Settings (⚙):** machine-specific options only: filter slots (drop a ghost item, it doesn't use the real one), Assembler recipe (opens the Build Tray picture as a template), Chassis direction, Quarry area. Same layout every time.
**Sharing:** several players can open the same machine. The server owns the slots; if two people grab one slot at once, the first wins and the other sees "Taken" for 1 s. The crew alias of whoever last changed a setting shows in Stats.
**Errors are sentences with a fix,** e.g. "Too much voltage: add a transformer" (Transformers, TEKKIT 8). No sound-only signal; every chime has a chip.
**Layouts:** same three shapes as the Build Tray (upright stacked: header, row as a vertical Inputs ↓ Process ↓ Outputs, tabs, Bag strip at the bottom; sideways: row across, Bag column on the right; Chromebook: 760 px centred). Tabs are 4 icon+word chips ≥ 48 px. Rotate keeps the open tab and the held item.

## 4. Which machine gets what
| Machine | Run tab | Extra |
|---|---|---|
| Smelter, Oven | 1 input, Fuel, 1 output | Inside: heat melts metal from rock |
| Ore Grinder, Electric Smelter | 1 input, Power, 2 outputs | Stats show yield % (1 ore → 2 dusts) |
| Generators (Wind, Water Wheel, Biofuel), Solar | no inputs (Biofuel: Fuel slot), output = W | Inside: magnet + coil; Wind shows height bonus |
| Battery Box, Capacitor Bank | charge meter in/out | Wires tab matters most |
| Assembler | recipe picture as template + input buffer | Settings: pick recipe in Build Tray |
| Filter Tube, Sorter | ghost filter slots | rules list ≤ 6 (STORAGE-SPEC) |
| Terminal | search + item grid (STORAGE-SPEC §3) | no Process ring |
| Quarry Rig | area map + depth, Start/Stop with 10 s countdown | safety light state |
| Bot | code panel (Code Runtime) | not a Machine Panel |
| Fusion Core | control room: coolant loop, magnet coils, output, Safe Shutdown button | Stats = uptime % for the class goal |

## 5. Build world
The palette is the same Bag strip shape: drag (or tap) palette items to the hotbar. No crafting. Machine Panels work the same, with free fuel/power toggles for the teacher's test builds.

## 6. Acceptance (StudentTester, real input only, all three screens + rotate)
1. A kid makes a Chair in the Build Tray by dragging, then by tap-to-slot, then with Fill. All three work one-thumb at 412 upright and 915 sideways.
2. A wrong item on a slot never gets used; the chip names the right part.
3. Rotating mid-build keeps every placed part and the held item.
4. Tinker: 2 Planks + 1 Copper Wire with no recipe found gives a hint chip, not the answer.
5. Smelter panel: the status sentence changes from "Waiting for ore" to "Smelting" to "Output full" correctly; Take all empties the outputs.
6. Wires tab: setting the left face to In lets a tube feed the machine; the side list names the tube.
7. Keyboard only: open, fill, make and close a recipe and a machine with Tab, Enter and Esc.
8. Motion off: no spin or pulse anywhere; every state still reads by icon + word.
9. Two players on one Smelter: no duplicated or lost items over 20 mixed moves.
10. ar / fa-AF: the Inputs → Outputs row mirrors and arrows flip.

## 7. Build order
Build Tray + Tinker ride with the next crafting brief after 260b (it reuses 2.6.0's Bag strip and drag). Machine Panel is a shared component (`ui.machinePanel(spec)`) built once in the first machine brief (`mach-1`) and reused by every later machine; earlier stations (Smelter, Oven) switch to it then.
