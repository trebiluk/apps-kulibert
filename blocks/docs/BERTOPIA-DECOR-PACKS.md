# Bertopia decor packs: furniture, autumn set, pumpkin carving, string lights (GameMaster design brief, 2026-10-06 7:05 AM ET)
Diego (Oct 6): spooky seats, custom jack-o'-lantern carving (maybe built on LogoLab), Christmas lights; "Sitting = seasonal autumn"; "Seats also needed for tables yes."
Source of truth for these items. StyleBot sets the look (glow, twinkle, friendly-spooky). Curriculum's check (`CURRICULUM-HOLIDAY-AND-TEKKIT-CHECK-2026-10-06.md`) is adopted in full; it changes `fixq/bertopia-holidays-1.md` as below.

## Pack model (Curriculum's recommendation, adopted 7:10 AM)
- **Default packs are seasonal, never holiday-themed:** **Autumn** (hay, gourds, pumpkins, scarecrow, leaf piles, carving) and **Winter** (snow décor + String lights, shown as "Winter lights" in the Winter pack).
- **Spooky** is its own pack. The teacher can turn it on or off; on Auto it is live only **Oct 15 – Nov 1**. Friendly props only, no gore, no Day of the Dead skulls.
- **Lights and lanterns are normal building parts all year** (String Lights, Jack-o'-Lantern once carved, Moon Lantern as a full moon), so kids light a build for whatever they celebrate.
- No religious symbols in any pack. No contest themed on one holiday.
- Hub Master Control: one row per pack, **On / Off / Auto by date**. Turning a pack off removes it from the palette and craft list only; **placed builds never disappear** and unlocks are kept.
- The 14 culture packs in holidays-1 stay as teacher-optional extras (off by default) with their "About" cards; Debugzy updates holidays-1 to this model.

## 0. Rules for every item here
- No new controls. Place, Use, Options (long-press / right-click), Rotate ⟳, Pick up — all existing (CORE-MECHANICS).
- Game world: crafted at the Workbench from cheap basics (§5). Build world: free in the palette once its pack is unlocked.
- Autumn/Winter items unlock by the season, Spooky by its window or teacher toggle, and all are **kept forever**; furniture and lights are base game, never seasonal.
- Friendly-spooky only: pumpkins, cute ghosts, bats, black cats, moon, cobwebs, hay. **No** skeletons, tombstones, blood, monsters, witches, or weapons (Día de los Muertos and ED kids).
- Lights: steady by default, no flame (LED-style), never faster than 1 change per 2 s, no pure white (warm white = #FFE8B0), no strobe ever (stays under WCAG 2.3.1 three-flash rule). Motion off = always steady.
- Everything has a name in 8 languages and an icon+word tile; meaning never by colour only.

## 1. Furniture (base game, after basics)
| Item | Size | Recipe (Workbench) | Use |
|---|---|---|---|
| Chair | 1×1 | 4 Planks + 2 Sticks | tap = sit |
| Stool | 1×1 | 2 Planks + 2 Sticks | tap = sit |
| Bench | 2×1 | 3 Planks + 2 Sticks | tap = sit (2 kids) |
| Table | 1×1 | 3 Planks + 1 Stick | Place an item on it (see below) |
| Long Table | 2×1 | 5 Planks + 2 Sticks | same, 2 display spots |
- **Wood looks:** made from the Planks you use (Oak now; Birch and Spruce arrive with world-2). Then any colour with the free Paint Brush (it never spends dabs).
- **Sit** = Use on a seat (CORE-MECHANICS §"Ride / Sit" fold). Move or Jump stands you up. Camera stays third/first person as before. One kid per seat spot; a taken seat shows a small "Taken" chip, never a silent fail.
- **Rest:** with Damage On, sitting restores 1 heart every 10 s (a reason to build a café, not a power).
- **Table display:** Use on a table while holding any item puts **1 copy on display** (food, a Pet Rock, a lit pumpkin). Use again with an empty hand takes it back. Teaches nothing heavy; it powers café / shop role-play (WORLD-PLAN §N Shops).
- Seats auto-face the player; Rotate ⟳ turns 90°. Pick up via Options, contents (display item) returned.

## 2. Autumn set (Autumn pack) + Spooky pack
"Spooky sitting things" = autumn seats. They sit like furniture (§1).
| Item | Pack | Recipe | Notes |
|---|---|---|---|
| Hay Bale | Autumn | 4 Corn | **seat**; stacks like a block; halves fall damage like Leaves |
| Pumpkin | Autumn | grows from Pumpkin Seeds | **carvable** (§3); seeds: 4 in the Autumn unlock gift, and 2 back from every carving |
| Pumpkin Stool | Spooky | 1 Pumpkin + 2 Sticks | **seat**, carved face shows |
| Spooky Bench | Spooky | 3 Planks + 2 Sticks | **seat** (2), bat cut-outs in the backrest |
| Gourd Pile, Corn Stalks, Apple Crate | Autumn | 1–2 basic items each | decor |
| Leaf Pile | Autumn | 4 Leaves | soft landing (halves fall damage); jump in = small leaf puff, none with Motion off |
| Scarecrow | Autumn | 2 Hay Bale + 1 Cloth + 1 Pumpkin | decor in Autumn; after Hawkbots ship, the powered **Robo-Scarecrow** is the working version (WORLD-PLAN §M) |
| Friendly Ghost Light | Spooky | 1 Cloth + 1 Glow Pebble | soft light r4, gently bobs only with Motion on |
| Cobweb Deco, Bat Bunting, Black Cat Statue, Moon Lantern (full round moon) | Spooky | 1–2 basics each | decor; cobweb never slows players (decor only) |

## 3. Pumpkin carving (my rules for the carve panel)
**Tool:** the **Carving Scoop** (2 Sticks + 1 Stone). Part of Autumn, so carving is an autumn craft, not a Halloween one; kids carve any face they like. A scoop, not a knife: safe-tool rule.
**Start:** hold the Scoop and Use a Pumpkin (placed or in the Bag). The face you tapped is the one you carve. Opens the Carve panel (one step back to close).

**Panel (built on LogoLab's Mark Builder grid + stamps; reuse its code, our art):**
- **Grid:** 12×12 cells on the pumpkin face. Drag or tap to carve; tap a carved cell to fill it back. At 412 upright the grid fills the width (~30 px cells); drawing canvases are exempt from the 44 px rule, but every button is ≥48 px. **Big Cells** toggle switches to 8×8 for motor access.
- **Mirror** (on by default): left half copies to the right, so a first-try face looks good. One tap turns it off.
- **Stamps** (from Mark Builder, picked from a 6-tile row): round eye, triangle eye, smile, wide grin (an open smile, no teeth), star, full moon (round, never a crescent). No letter stamps (keeps carvings as pictures; freehand still allowed).
- **Undo** (20 steps), **Clear**, **Done ✓**. Done is the only way to save; ✕ asks "Keep your carving?" Keep / Throw away.
- **My Carvings:** the last 12 faces are saved; "Use saved" puts one on a new pumpkin in 1 tap.
- **Data:** a 144-bit mask (18 bytes) per carved face, saved with the block and inside Blueprints. Up to 4 faces per pumpkin (one per side).
- **Lit:** a carved pumpkin is a **Jack-o'-Lantern** light block (radius 6), warm amber light through the holes (no flame, no flicker). Unlit pumpkins show dark holes.
- **What you get:** carving gives back 2 Pumpkin Seeds + 1 Pumpkin Mush (Oven: 1 Mush + 1 Sugar → Pumpkin Pie, a food).
- **Safety:** carvings are visible only where builds are (own plot, crew plot, published area). Teacher Rollback / Uncarve covers them like any block. Freehand can draw anything, so this is the same trust model as Paint.
- **Mastery hook:** none. Art isn't scored, and no holiday-themed contests.

## 4. String lights
**String lights** (shown as "Winter lights" in the Winter pack): a normal building part all year; the Winter pack only adds snow-tipped and icicle bulb styles. Colours: warm white, amber, red, green, blue, teal; plus a Rainbow string.
- **Place (2 taps, no drag):** hold String Lights, Use a block face = start; Use a second face within 12 blocks = the string drapes between with a gentle sag. ✕ chip cancels after the first tap. Use on a string = Options (colour, pattern, Pick up).
- **Power (the tech lesson, phased):**
  - Before circuits ship: every string has a built-in battery and lights at night automatically.
  - After the Circuits pack: a string still runs on its built-in battery for one night, but plugging it into a circuit (battery, solar, grid) keeps it on and unlocks patterns. Lore card: "Real light strings are wired in parallel so one dead bulb doesn't kill the rest."
- **Patterns** (Light Controller, after circuits; Motion on only): Steady, Slow Fade (4 s), Slow Chase (one bulb step per 0.5 s with a soft fade, so no hard flash). Motion off forces Steady.
- **Look:** bulbs glow (emissive) but **do not each cast light**; one soft glow per string (Chromebook). Cap 64 strings per plot, 12 bulbs each.
- Count as lit blocks under the basics-1 light rule.

## 5. Recipe sanity
Everything here costs Planks, Sticks, Stone, Corn, Leaves, Cloth or Glow Pebble, so a kid can furnish a café on day one and nothing waits on ores. No Iron Nugget item (decided 7:12 AM, answer to G-Q19). No Cogs ever.

## 6. Assets
- **Models (box-primitive style):** Chair, Stool, Bench, Table, Long Table; Hay Bale, Pumpkin (uncarved + 4 face-mask overlay), Pumpkin Stool, Spooky Bench, Gourd Pile, Corn Stalks, Apple Crate, Leaf Pile, Scarecrow, Ghost Light, Cobweb, Bat Bunting, Black Cat Statue, Moon Lantern (full moon), String lights bulb + wire.
- **Icons:** each item above + Carving Scoop, Pumpkin Seeds, Pumpkin Mush, Pumpkin Pie.
- **Carve panel:** Mark Builder grid reskinned in Bertopia teal, 6 stamp icons, Mirror / Big Cells / Undo / Clear / Done icons.
- **Sounds (each with a visual):** sit creak, scoop scrape, lantern "on" chime, light click.

## 7. Acceptance tests (phone 412×915 upright, phone 915×412 sideways, Chromebook 1366×768; rotate mid-carve and mid-placement)
1. Craft a Chair from 4 Planks + 2 Sticks, place it, tap it: the kid sits. Move: stands. Second kid taps it: "Taken" chip.
2. Put a Pumpkin Pie on a Table; it shows. Tap with an empty hand: back in the Bag.
3. Carve a face with Mirror on in ≤30 s using only taps/drags; Done saves it; reload the world: the face is still there and glows at night.
4. Rotate the phone mid-carve (upright ↔ sideways): grid and buttons stay usable, carving not lost. Same for a String Lights placement after the first tap. Big Cells shows 8×8.
5. "Use saved" puts the last face on a new pumpkin in 1 tap.
6. Place String Lights with 2 taps 10 blocks apart; they sag and light at night. Motion off: steady, no pattern runs.
7. No light in this brief changes brightness faster than 1 step per 0.5 s with fade; no pure-white pixels in any glow (StyleBot check).
8. Teacher sets Spooky to Off: its items leave the palette and craft list; placed ones stay, unlocks kept. On Auto it shows only Oct 15 – Nov 1. String Lights stay available all year.
9. Every new name shows in the chosen language; ar and fa-AF RTL in the carve panel.
10. 1366 at CPU 4× throttle: a plot with 64 strings and 20 lit pumpkins holds ≥30 fps.
DONE only when every test passes on the live site. Never fake a DONE.

GameMaster 2026-10-06 7:20 AM: per StyleBot's look rules (`STYLEBOT-HOLIDAY-LIGHTS-LOOK-2026-10-06.md`) and Curriculum's names: pack names are Autumn, Spooky, Winter and String lights only (no Harvest, Spooky-Cute, Diwali or Winter Lights packs); the Toothy grin stamp is now Wide grin (open smile, no teeth); the Moon stamp and Moon Lantern are full moons.
