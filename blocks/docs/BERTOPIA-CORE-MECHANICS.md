# Bertopia Core Mechanics — LOCKED (GameMaster, Oct 4 2026 ~7:00 AM ET)
Source: Diego 6:46 AM ("firm up the basics before more features"; "the game can only do a certain number of things").
Respects: NEXT-50, STORAGE-SPEC, FUN-ITEMS-SPEC, EFFECTS-SPEC, WORLDS, gamemaster/BERTOPIA-BASICS-GM (Lantern, doors, day/night, glow, Bot), fixq/bertopia-WORLD-PLAN (Damage Off/Gentle/Real, Suit 0–100).
Global locks: 20-min day/night (14/2/3/1), nights ≥40% (Brighter nights 60%), no monsters, Damage Off by default, kid-safe, aliases only, teal/cyan/blue first + Berty purple accents, Reduced motion respected (no bob, no particles, no shake), taps ≥44 px, phone = Chromebook, 8 languages, RTL mirrors panels but NOT the move stick.
Units: blocks (b), b/s, b/s², s, ms, px (CSS px), degrees (°). "Game world" = Survival rules; "Build world" (the Workshop, Teacher flag) = Creative rules (see BERTOPIA-WORLDS.md).

## 0. FIXED CORE VERBS (the whole game; nothing gets a one-off control)
Gestures are the kw-interact names in §0.3. A long-press "Options" sheet is part of Open/Use, not a new verb.

| # | Verb | One line | Touch (one thumb) | Chromebook | Feel test |
|---|---|---|---|---|---|
| 1 | **Move** | walk, run, jump, crouch, swim, fly (Build world) | `stick` (bottom corner), Jump button beside it (slide onto it), Crouch toggle | WASD/arrows, Space, hold Shift = run, hold Z = crouch | One thumb crosses a 1-block gap and climbs a 1-block step at 360×740. |
| 2 | **Mine** | break a block into your Bag | `hold` on the block (ring fills) | hold left click | A kid breaks dirt by hand in under 1 s without reading anything. |
| 3 | **Place** | put the selected block/item on a face | `tap` a block face | right click | 10 taps along a floor = 10 blocks in a straight line, 0 misplaced. |
| 4 | **Use** | activate the selected item or a device: toggle, wear, effect, level, tag (arena/Hide-and-Seek) | `tap` the selected hotbar slot again / worn-item button; `tap` a device | F (item) / right click (device) | A kid cycles the Lantern Low→Med→High with 3 taps, never opening a menu. |
| 5 | **Open** | open anything with an inside or a hinge: storage, furniture, stations, doors, Terminal, Bag | `tap` it; Bag = Bag tile; close = ✕ / scrim / back, one step | right click; E = Bag; Esc closes one level | Open a Box and close it in 2 taps total. |
| 6 | **Connect** | wire neighbours together (tubes, cables, wires, Storage Link snap) | `tap` an end to toggle, or `link` A → B | click end / click A then B | A kid links two Boxes with a tube on the first try and sees items move. |
| 7 | **Pair** | wirelessly bind two things far apart (fob↔Bot, pad↔pad, drone↔dock) | `link`: hold the item, tap the partner | select item, right click partner | A kid pairs the fob in 1 tap and the Bot follows within 2 s. |
| 8 | **Move-item** | move stacks between Bag, hotbar, pockets, storage, ground, players | `tap` item → `tap` slot (tap-first); `drag` extra; ½ button | click → click; drag; Shift+click quick-move; Q drop 1, Shift+Q drop stack | 20 mixed moves; Bag total unchanged (NEXT-50 #8). |
| 9 | **Craft** | make things from a recipe list | open Craft (Bag tab or tap a station), `tap` recipe, ×1 / ×Max | C, click recipe | A kid makes Planks from a Log within 10 s of first opening Craft. |
| 10 | **Paint** | recolor blocks you own (looks only, free) | Paint Brush selected, `tap` block; `long-press` = palette sheet | Brush selected, right click; hold right click 500 ms / O = palette | Paint 5 blocks teal in 5 taps; Undo 1 tap brings the last color back. |

### 0.1 Priority rule for a single tap/right click (no ambiguity)
1) a player in an Arena / Hide-and-Seek zone → Use (Tag) · 2) an interactive block (door, storage, device) → Open or Use · 3) selected item is a block → Place · 4) selected item has a Use → Use. Crouch-toggle ON (or Shift held) forces Place against interactive blocks. Interactive blocks never break from `hold`; their Options sheet has "Pick up" (contents kept, NEXT "never lost").

### 0.2 Item → verbs (every locked item)
| Item | Verbs (how) |
|---|---|
| LED Lantern | Place; Use = tap cycles Low/Med/High (radius 4/7/10; Game world 8/4/2.5 min; recharge 4 min daylight / 2 min Charger; empty = radius-1 glow); worn/held light via hotbar Use |
| Charger · Solar Panel · LED Glow Strip · Battery Box | Place; Connect (wire panel→Charger/Strip/Box); Open = info card (charge bar); long-press Options = Pick up |
| Battery Cell | Craft; Move-item (feed into devices); no world gesture |
| Glow Pebble / Glow Stick / Jumbo Glow / Cold Glow Vial | Craft (color at craft); Place (floor or wall); fade is automatic; Use = tap placed stick to pick up (unspent → Bag, spent → Tube/Vial back, Pebble → nothing) |
| Doors: Wood, Glass | Place (same type adjacent auto-merges to double door); Open = tap (optional 3 s auto-close in Options) |
| Door: Metal | Place; opens only via Use on a Button/Lever or a powered circuit (Connect) |
| Sliding lab door | Place; auto-opens on approach when powered (Connect), else Open = tap; auto-closes 3 s |
| Door lock | long-press Options → padlock (owner + crew; Teacher override; off in arenas) |
| Day/night toggles ('Always day', 'Brighter nights') | Open ☰ Settings → tap toggle (Use); Teacher day/night button same pattern |
| Workshop Door (Teacher flag only, at spawn) | Open = tap (same as any door) → Build world; matching door returns you |
| Publish (Build world) | Use: mark area (Place-style corner taps), tap Publish; Undo Publish = Use in Options (last 5) |
| Berty's Bot H1 | Craft; Place; Pair (tap bot with fob); follow/park automatic; Open = Cargo Bay (9/18/27); long-press Options = Access (Private / Crew deposit / Crew open), Pack up (contents kept) |
| Fob | Pair; re-pair = Pair a new fob (old goes dead); dropped fob persists (Move-item) |
| Bag / Pockets / Backpacks | Open (Bag tile / E); Move-item; Backpack = Move-item into back slot (wear) |
| Wall Shelf · Shelf · Side Table · Desk · Box · Double Box · Cabinet · Glass Cabinet · Steel Locker | Place (Box beside Box auto-merges 36); Open = tap (drawer/door 0.2 s, instant w/ Reduced motion); Move-item; Options = lock / Pick up; Paint (two-tone) |
| Paint Brush | Paint = tap; long-press = palette (24 swatches + custom + 8 saved); Fill (≤64 connected) and Eyedropper are modes in the palette; Undo 20 = Undo button |
| Item Tube · Powered Tube · Filter Tube | Place (auto-connect); Connect = tap end; Filter rule = long-press Options (By Item ≤6 / Type / Color) |
| Extractor · Sorter | Place (Extractor snaps onto storage); Options = "Pull everything / Pull only…", Sorter output chips |
| Network Cable · Storage Link | Place / snap; Connect |
| Network Core · Drive Bay · Drives | Place; Open bay; Move-item Drives in/out (a pulled Drive opens like a Box) |
| Terminal | Open; search box, chips and sort live inside the Open panel; tap item = Move-item to Bag; "Show Network" = Use (button); "Deliver to me" = Use |
| Teleport Pads | Craft (pre-paired); Place; Pair (tap one with the other in hand); Move-item onto pad = send; Open = partner tray (9); Options = access |
| Delivery Drone + Dock | Place Dock; Pair drone↔dock; Use = send (pick target in sheet); Open = 4-slot payload |
| Pet Rock | Place; Use = tap wiggle; long-press Options = Follow / Sit / Nap / Whistle / Pocket |
| Gravity Hat (= Float effect) | Move-item to head slot; Use = worn-item button (10 s float; hold Jump to rise); tap HUD chip ends early |
| Disco Floor | Place; step = automatic; Options on a tile = pattern (Rainbow/One Color/Chase/Follow the Music) |
| Bounce Block | Place; Move (land on it); Crouch held = land without bouncing |
| Bobbleheads + Trophy Shelf | earned; Place shelf; Move-item bobblehead onto shelf (only valid spot); removal via Settings (Use) |
| Note Block | Place; Use = tap raises pitch + plays; Connect = circuit trigger |
| Keyboard · Drum Kit · Guitar | Place; Open = 8-pad player; tap pads (inside the panel) |
| Jukebox | Place; Open = disc list; Move-item disc in; volume slider in panel |
| Holiday deco packs | Place; Paint where allowed |
| Effects (EFFECTS-SPEC): Warp Key, Bandage/Herb Tonic/Med Kit, Whistle Bell, Critter Jar, Morph Vial, Camo Cloak, Magnet Wand, Light Wand, Fizz Vial, Frost Vial, Spark Rod | Use = tap selected slot / worn button; HUD chip tap = end early; Meet Me invite = choose in Use sheet, partner taps Accept. Numbers: see BERTOPIA-EFFECTS-SPEC.md (not repeated here) |
| Warp Pad · Sleeping Bag · Crew Banner · Lab Bench | Place; Use (Sleeping Bag/Banner = set spawn); Lab Bench = Open → Craft; Warp Pad destination is implicit |
| Game Zone Flag (anyone, Game world) | Place; Options = size 16–48, start Hide-and-Seek/mini-game (Use) |
| Hide-and-Seek / Arena Tag | Use on a player within 2 blocks, only inside an Arena or Game Zone (priority 1 in §0.1) |

### 0.3 kw-interact alignment (StyleBot's module not found on the box — FLAG FOR STYLEBOT)
`rg -i kw-interact /workspace /home/box` found no draft at 7:00 AM. Proposed shared names/thresholds (match NEXT-50 #6 "drag after 250 ms hold or 8 px"):
| Name | Rule |
|---|---|
| `tap` | down→up < 250 ms and < 8 px travel |
| `hold` | still (< 8 px) ≥ 250 ms; continuous until release (Mine, panel drag start) |
| `long-press` | still ≥ 500 ms; cyan ring fills over 500 ms (static ring w/ Reduced motion); fires Options only where an Options sheet exists |
| `drag` | ≥ 8 px travel (world: camera look; panels: move item; ghost: nudge); cancels cleanly on rotate |
| `link` | tap source (or select item) → tap target within 10 s; cyan preview line; tap empty / ✕ cancels |
| `stick` | floating joystick: dead zone 12 px, full speed at 48 px, run beyond 56 px for ≥ 300 ms |
StyleBot: please adopt these names in kw-interact (open/connect/link/move) or send back your values; GameMaster will re-align this file, not the other way round on thresholds already locked in NEXT-50.

## 1. Move / jump / run
| Value | Locked |
|---|---|
| Player box / eye | 0.6 × 1.8 b, eye 1.62 b |
| Walk / Run / Crouch | 4.3 / 5.6 / 1.3 b/s |
| Accel 0→walk / decel to 0 | 0.12 s / 0.10 s (ice: decel 0.6 s) |
| Gravity / terminal fall | 32 b/s² / 30 b/s |
| Jump | fixed height 1.25 b (v0 8.9 b/s), no variable height, airtime 0.56 s; clears 1 block, never 2 |
| Gap reach | walk 2 b, run 3 b |
| Double jump | none (extra height only from Bounce Block, Frog morph, Gravity Hat) |
| Coyote time / jump buffer | 120 ms / 150 ms |
| Jump carry (one-thumb) | Jump within 200 ms of releasing the stick keeps the stick's last heading and speed until landing |
| Auto step-up | 0.5 b always; Auto-climb 1 b = ON by default on touch, OFF on Chromebook (Settings toggle) |
| Air control | 60% of ground accel; air speed never exceeds takeoff speed |
| Crouch edge-guard | crouching never walks off a drop > 0.5 b |
| Fly (Build world only) | double-tap Jump (2 taps < 300 ms) toggles; 10.9 b/s horizontal, 7 b/s up/down (Jump / Shift or Crouch) |
| Touch stick | bottom-left by default, mirror-able to right (Settings), 120 px zone; Jump 64 px + Crouch 48 px sit directly above the stick |
Feel test: one thumb only, a kid jumps a 1-block gap in one tap, climbs a 1-block step without a jump, and can NOT jump onto a 2-block wall.

## 2. Mine / break
Hold-to-break; ≤ 0.25 s blocks break on a `tap`. One multi-tool per tier (no tool-type memorizing). No tier gates: every block breaks by hand, just slower; after 2 s by hand a hint chip says "A Copper Tool is faster."
Tool multipliers: Hand ×1 · Wood ×2 · Stone ×3 · Copper ×4 · Steel ×6. Time = hand ÷ multiplier, floor 0.15 s.

| Material (hand s) | | | |
|---|---|---|---|
| Leaves 0.2 | Snow 0.3 | Glass 0.4 (drops itself) | Sand / Red sand / Ice 0.5 |
| Dirt / Grass 0.6 | Gravel 0.7 | Cloth (wool) 0.8 | Stations / furniture: not mined → Options "Pick up" |
| Planks 1.5 | Log 2.0 | Stone 3.0 | Slate / Coal ore 3.5 |
| Red / Grey brick 4.0 | Copper / Zinc / Silicon ore 4.5 | Copper block 5.0 | Steel block 7.5 |
| Coreplate (y −64 floor): never breaks | | | |
- Feedback: 4 crack stages at 25/50/75/100%, soft tick each stage, small puff at 100% (crack overlay only with Reduced motion). Releasing early: progress drains to 0 over 0.5 s; aiming at another block resets.
- Result goes straight into the Bag (Game world). Bag full → the block still breaks and drops as a persistent item (§6). Grass drops Dirt; Leaves 33% Berry (live rule kept).
- Build world: instant break on `tap`; `hold` repeats every 0.25 s. Morph Prairie Dog dirt ×2 = EFFECTS-SPEC.
Feel test: a kid breaks Dirt by hand in under 1 s and Stone with a Stone Tool in 1 s.

## 3. Place
| Value | Locked |
|---|---|
| Reach | Game world 6 b; Build world 10 b; same for touch and mouse |
| Aim | touch: ray from the tapped point; Chromebook: crosshair (pointer lock) |
| Grid | always snaps to the 1-block grid |
| Facing | doors, furniture, tubes, stairs auto-face the player; Rotate ⟳ 90° (R key / ⟳ chip on the selected block) |
| Repeat | hold right click repeats every 0.25 s; touch is one tap = one block |
| Ghost | cyan outline (0.52 b half-size) on the target face; striped ghost for Paste/Fill/Blueprint with ✓ Place / ✕ Cancel |
| Never inside | player's full 0.6 × 1.8 box, other players, Bot, Pet Rock, Drone |
| Undo | 200 groups / 5 MB per session, own edits only; one Undo per action group (Fill = 1); Game world refunds/charges the Bag and refuses if the items are already used ("already left the Bag"); Redo until the next new edit |
| Pick Block | middle click; touch: Pick chip, then tap a block (Game world selects it from the Bag only if you have it) |
Feel test: 10 taps along a floor place 10 blocks, 0 land inside Berty.

## 4. Camera
| Value | Touch (portrait + landscape) | Chromebook |
|---|---|---|
| Default view | 3rd person, 4 b behind, 1.5 b up, wall-clip pull-in | 1st person (V or ☰ toggles) |
| Look | `drag` on any empty world area | pointer lock mouse/trackpad |
| Sensitivity | 0.40°/px H, 0.34°/px V; slider 0.5×–2× | 0.066°/count; slider 0.5×–2× |
| Invert Y | off (toggle) | off (toggle) |
| Pitch clamp | ±85° | ±85° |
| FOV | portrait: vertical 85° (≈48° horizontal at 360×740); landscape: vertical 55° | vertical 55°; "Wide view" +10° |
| Auto-follow | 3rd person swings behind movement at 90°/s after 0.5 s of moving with no manual look; off while dragging | off |
| Motion | head bob ±0.045 b; none with Reduced motion | same |
Feel test: in portrait, one thumb can walk around a house and the camera ends up behind Berty without touching the screen elsewhere.

## 5. Hotbar
9 slots (2.6.0: tap-first; Bag = Hotbar 9 + Pockets 6 = 15; STORAGE-SPEC). Select: `tap` slot (≥ 44 px; live 64/58 px OK) · keys 1–9 (0 does nothing) · wheel 1 slot per notch, wraps 9→1. Tap the already-selected slot = Use. Selected slot: 2 px cyan border + name chip 1.5 s. Feel test: a kid selects slot 7 in one tap or one key, never by accident while looking around.

## 6. Pick up and drop
| Value | Locked |
|---|---|
| Auto-pickup | 1.5 b radius; magnet pull from 2.5 b at 6 b/s |
| Own-drop delay | 1.5 s before you re-collect what you dropped |
| Drop | Q / Bag "Drop 1"; Shift+Q / "Drop all" = stack; touch: drag out of the Bag panel |
| Despawn | NEVER. Dropped items persist across saves; same item within 2 b merges |
| Cap | 256 loose stacks per world; past the cap new drops go to the Lost & Found box at spawn (still never lost) |
| Ownership | only you (and crew if allowed) can pick up your drops; Give = drop facing a player ≤ 3 b → they tap Accept |
| Map | a loose stack untouched for 60 s shows a minimap dot |
Feel test: drop a stack, walk away, reload, come back: it's still there and pops into the Bag when you walk over it.

## 7. Health / respawn
- Damage **Off** by default (no hearts shown). Teacher toggle Off / Gentle / Real (WORLD-PLAN); Challenge worlds, Dailies and contests lock Off.
- When on: 10 hearts (= Suit 100; 1 heart = 10 Suit). Gentle halves every damage number. Regen +0.5 heart / 2 s after 6 s with no damage. Heal items: EFFECTS-SPEC.
- Knockout at 0: glitter poof (no death animation), respawn in 3 s at Sleeping Bag → Crew Banner → World Spawn, 5 s spawn shield.
- Keep inventory ALWAYS (Bag, backpack, worn items); no XP/Cog loss. Falling below y −72 = poof to spawn (live rule kept).
Feel test: with Damage On, a kid who gets knocked out is back playing with every item in under 5 s.

## 8. Fall, water, molten
| Rule | Locked |
|---|---|
| Fall damage | only when Damage On: none ≤ 4 b; 1 heart per 2 b beyond 4 (Real); Gentle halves |
| Always-safe landings | water ≥ 1 b deep, Bounce Block (walk 4 / jump 6 / max 6, crouch = no bounce), Cat morph; Leaves and Snow halve fall damage |
| Swim | 2.2 b/s; Jump rises 2.0 b/s; Crouch sinks 1.0 b/s; idle floats up to the surface |
| Breath | Damage Off: no breath bar, unlimited. Damage On: 15 s; at 0 you auto-rise at 3 b/s and lose 0.5 heart per 2 s (Real) but water can never take the last heart |
| Lava / molten metal | never instant loss. Off: teal "Suit cool-down" bounce to last safe block. On: −3 hearts (Gentle −1.5) + bounce; can't take the last heart. Items that fall in pop to the nearest safe block |
Feel test: a kid falls in molten metal with Damage Off and is back on the bank with every item in under 1 s.

## 9. Crafting flow
- Tap-first list, no grid memorization. Sections: **Can make now** (top) · **Almost** (missing 1–2 kinds; missing items in amber with "Found in…" link) · **Show all** (collapsed).
- Each tile: picture, name, ingredients with have/need ("Planks 2/4"). Station recipes show "Needs Workbench/Oven/Lab Bench"; station counts if within 4 b (±2 b up/down).
- ×1 (tap tile) · ×Max (button on the tile; makes as many as the Bag allows). Hand recipes instant; station recipes use their timer (glass 5 s etc., live values kept).
- Bag full → output drops at your feet (never lost). Game world only; Build world uses the palette.
Feel test: a kid with 1 Log and 0 instructions makes 4 Planks, then sees the Workbench under "Can make now."

## 10. Game world vs Build world (Survival vs Creative)
| | GAME world (Bertyville, everyone, Survival rules) | BUILD world (the Workshop, Teacher flag, Creative rules) |
|---|---|---|
| Blocks | mined, crafted, never bought with Cogs (A1 stock refills only) | full palette |
| Mine | timed (§2) | instant tap |
| Reach | 6 b | 10 b |
| Fly | no | double-tap Jump |
| Bag | 15 + backpack (max 33) | palette; separate Bag (nothing leaks) |
| Energy / lights / glow | real timers | always on / permanent |
| Damage | Off default; teacher Gentle/Real | Off |
| Day/night | 20-min cycle; Always-day toggle | always day (toggle) |
| Effects, Bot, Pet Rock, Drone | yes | no (stay parked in Game world) |
| Games / earning | anyone starts games; Cogs, badges | no games; Builder badges only; Publish areas |
| Undo | 200 groups, Bag-aware | 200 groups |
Feel test: a Teacher steps through the Workshop Door, builds, Publishes, and steps back to the exact spot they left with their Game Bag untouched.

## NEEDS DIEGO: possible new verbs (recommendations)
| Candidate | Recommendation |
|---|---|
| Search (Terminal, Bag) | **Fold into Open.** It's a text box inside an opened panel (Bag already has search in 2.6.1). |
| Ride / Sit | **Fold into Use** (tap a seat/pod = sit; Move/Jump = stand). Nothing locked needs it yet; revisit with the Glideway. |
| Float (Gravity Hat) | **Fold into Use** (worn button) + Move (hold Jump to rise). |
| Play an instrument | **Fold into Open** (8-pad panel) + Use (Note Block tap). |
| Tag (Arena + Hide-and-Seek only) | **Scoped form of Use** ("Use on a player within 2 b"), active only inside an Arena or Game Zone; outside, tapping a player shows their alias card. Not a new verb. |
| Pair vs Connect | Kept separate on purpose (wired vs wireless lesson). If Diego wants 9 verbs, merge as "Link." |

## Live game vs spec (apps.kulibert.net/blocks/ v2.5.13, app.js?v=2.5.13, last-modified Sun Oct 4 6:27 AM ET; minified, so line = minified line; snippets are grep-able)
Engine: noa-engine + Babylon.js. Local repo clone (/workspace/repos/apps-kulibert, Sep 23) has no blocks/ source, so evidence is the live bundle.
| # | Live value | Evidence | Spec | Fix |
|---|---|---|---|---|
| 1 | One speed 10 b/s; no walk/run/crouch | L2 `this.maxSpeed=10` (noa default, never overridden) | 4.3 / 5.6 / 1.3 | set movement state per mode |
| 2 | Jump ≈2.4 b on a 1-tick tap, ≈4.5 b held 500 ms (simulated from engine constants) — clears 2-block walls | L2 `jumpImpulse=10`, `jumpForce=12`, `jumpTime=500`; L2433 `gravityMultiplier=2` on `gravity:[0,-10,0]` | fixed 1.25 b, g 32 | jumpForce 0, impulse/gravity per §1 |
| 3 | Double jump on | L2433 `airJumps:1}` | none | airJumps 0 |
| 4 | No coyote time / jump buffer | L2 movement only jumps if `atRestY()<0` or air jump | 120 / 150 ms | add |
| 5 | Auto-step full 1 b on every platform | L2433 `playerAutoStep:!0`; noa steps to `Math.floor(h+1.001)` | 0.5 b; 1 b only touch default | toggle by platform |
| 6 | Reach 10 b in all modes | L2433 `blockTestDistance:10` | Game 6 / Build 10 | set per world |
| 7 | Break is instant (click or Break button), no hold, no cracks, no tools | L2433 `Lp()` → `Xh(e,t,i,0)`; `t-break` click | §2 table | add hold timer + crack stages |
| 8 | Full Bag refuses to break | L2433 onBreak `e.add(ee,1)` → toast `bagFull`, returns false | break + persistent drop | drop overflow |
| 9 | Survival Bag is 36 slots | L2433 `hp()` `Array.from({length:36}` | 15 (+ backpack) | 2.6.0 |
| 10 | Touch is two-handed: 4-arrow d-pad bottom-left + Break/Place/Jump bottom-right | index.html `.move{left:12px;bottom:92px}`, `.acts{right:12px;bottom:92px}` | one-thumb stick + Jump carry | new touch layout |
| 11 | Touch aims with screen-center crosshair + Place/Break buttons | L2433 `Xn()` uses `K.targetedBlock`; `t-place` | tap-the-face / hold-to-mine | ray from tap point |
| 12 | Long-press 500 ms in world = Pick Block | L2433 `setTimeout(()=>{…qh()…},500)` | long-press = Options; hold = Mine; Pick chip | remap |
| 13 | Look drag starts at 10 px (summed x+y) | L2433 `Ct.moved>=10` | `drag` 8 px | 8 px |
| 14 | Touch look 0.483°/px H, 0.41°/px V, no slider, no invert setting | L2433 `Ap=58*Math.PI/180/120`, `*.85`; no settings found | 0.40/0.34 + slider + invert | add Settings |
| 15 | FOV 45.8° vertical-fixed on all screens → ≈23° horizontal in portrait at 360×740 | Babylon default L23 `this.fov=.8`, `FOVMODE_VERTICAL_FIXED`; never set by app | portrait 85° vertical, landscape 55° | set per orientation |
| 16 | First person only in play; 3rd person (16 b) only in Build Table | L2433 `K.camera.zoomDistance=0` / `=16` | touch default 3rd person 4 b + auto-follow | add |
| 17 | Creative fly can never turn on: `rs` is only ever set false, yet the hint promises "double-tap to fly" | L2433 `oE()` reads `rs` but never sets it true; only `rs=!1` (2 places); keysHint text | double-tap Jump toggles fly (Build world) | toggle `rs` |
| 18 | Key 0 selects slot 1 | L2433 `e===9?0:e` | 0 does nothing | ignore 0 |
| 19 | E is both noa "alt-fire" (place) and the app's Bag key; Q is Pick Block | L2 `"alt-fire":["Mouse3","KeyE"]`, `"mid-fire":["Mouse2","KeyQ"]`; L2433 `r.key==="e"` | E = Bag only; Q = Drop | rebind (possible stray place on E: untested) |
| 20 | Place-inside-player check tests only Berty's center column | L2433 `Math.floor(a[0])===e&&Math.floor(a[2])===i` | full 0.6×1.8 box + Bot/Pet/players | AABB test |
| 21 | Crafting: one flat list, disabled tiles, no Can-make/Almost grouping, no ×Max; full Bag refuses ("bagFull") | L2433 `paintCraft` `I(D)`, `up()` | §9 | regroup, ×Max, drop overflow |
| 22 | Any player can switch to Creative from the menu | L2433 `setWorldMode` → `bertyville` / `bertyville-survival` | Build world = Teacher flag only | gate behind flag |
| 23 | No health, hearts, water, lava or fall damage exist; no dropped-item entities; no day/night | no fluid blocks registered (L2433 `registerBlock(r,{material:e,opaque:…})`), no damage code | Damage Off default matches; rest is new work | build per §6–8 |
Matches (keep): player 0.6×1.8 (noa defaults), eye ≈0.9×height, hotbar 9 + key/wheel select, Undo 200 groups / 5 MB (L2433 `i.length>200`), station range ±4/±2, void y<−72 respawn keeps the Bag, head bob off with prefers-reduced-motion (`Cp`), cyan target outline 0.52.
Outside this spec, flagged: the Tally store sells Blue/Red wool, flour, sugar for Cogs (L2433 `storeSells:[…]`); check against A1 "materials never bought except stock refills."
