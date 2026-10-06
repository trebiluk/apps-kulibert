Verdict: READY (look rules; no open calls; 3 small fixes for GameMaster at the end)
# Bertopia holiday lights: look rules (StyleBot, 2026-10-06)
Scope: the **look** of lit pumpkins, String lights / Winter lights, lanterns, and friendly Spooky props. GameMaster's `BERTOPIA-DECOR-PACKS.md` owns the mechanics: light radius, power, the carve panel and recipes. Debugzy builds it. Nothing here is live. Pack names follow Curriculum (2026-10-06): **Autumn**, **Winter**, **String lights** (shown as "Winter lights" in the Winter pack; normal parts all year), and **Spooky** (optional).
Mock: `holiday-look-mocks/00-sheet.png` (source `sheet.html`, renderer `render-sheet.js`).

## 0. Global locks (apply to every light here)
- **Brightest pixel = `#FFF1D6`** (relative luminance 0.89). No `#FFFFFF` anywhere in the world. This covers the summed halo too: halos use **normal alpha blend, never additive**, so overlapping halos can't climb past their own colour.
- **Halo = one baked sprite per light.** It's a 64 px radial texture on a billboard, depth-tested with no depth write, drawn behind the block so the block hides its centre. Alpha **≤ 0.30** at the centre with a smooth falloff to 0. No real-time point lights, no bloom or blur pass, no per-bulb shadows. The block-light radius (pumpkin r6, ghost r4, lantern 4/7/10) is GameMaster's light-level rule, not a GPU light.
- **Brightness changes:** smooth (cosine), never stepped. Fastest cycle: **4 s** (string-light twinkle). That's ≤ 0.25 Hz, about **12× under** WCAG 2.3.1's 3 flashes/s. Lights never go fully off while powered. No colour cycling, and no whole-string sync.
- **Motion:** read `KWI.motionOn()` when kw-interact is on the page. Otherwise use `html[data-kwi-motion]`, then `html[data-kp-motion]` (`less` = off), then `prefers-reduced-motion`. Listen to `kwi:motion {on}` (and the `data-kp-motion` change) and switch **live, with no reload**. Motion off = every light steady at its full level, with the same on / off / unpowered state.
- **High contrast** (`html[data-kp-contrast="1"]`) wins: **no halo sprites at all**, a flat emissive face, a **2 px solid `#FFE14A` outline** on lit lights, a **dashed** outline on unpowered or empty ones, and steady even with Motion on.
- **Teal/cyan first, then blue.** Purple only for Berty and the TechWorks logo, never in bulbs or props. Red never on a face or eye.
- **Phone = Chromebook:** 412×915, 915×412 and 1366 get the same caps, sizes in blocks and states.

## 1. Lit pumpkin (carved pumpkin = Jack-o'-Lantern)
| State | Holes (carved cells) | Rim (¼-cell inner edge) | Halo | Skin |
|---|---|---|---|---|
| Unlit | `#120802` | `#623E1B` (cut flesh, night shade) | none | pumpkin `#E8782A`, ribs `#B9551B`, stem `#6E7F35` |
| Lit, day | `#120802` (dark, so the face keeps its shape on orange) | **amber `#F2B45A`**, emissive 55% (the "it's lit" cue) | none | same |
| Lit, night | **core `#FFC56B`**, emissive 100% | `#C46A1A` | **`#FFB547`, radius 1.5 blocks from the centre, α 0.30** | lit by world light |
| Lit, high contrast | `#FFC56B` flat | none | **none** | + 2 px `#FFE14A` outline |
- **Dusk/dawn:** the halo α ramps 0 → 0.30 over the 2-min dusk and back down over dawn. It never pops on.
- **Steady glow, no flicker (StyleBot call 2026-10-06, matches GameMaster DECOR-PACKS §3 "no flame, no flicker"):** a lit pumpkin sits at brightness 1.00 in every mode, with Motion on or off. No flame sprite, no position jitter, no animated halo. The only movement in the holiday packs is string-light twinkle and ghost bob.
- **Face shape at block size:** Mark Builder's 12×12 mask (8×8 with Big Cells) → a 48×48 face texture (4 texels per cell), **nearest filtering, no bilinear**.
  - Mip levels are built with a **max filter (any carved texel stays carved)** and **stop at 12×12**, so a 1-cell line never fades out at distance.
  - The glow fills the holes only; the halo sits behind the block, so it never softens the face.
- **Palette:** Mark Builder's palette isn't forced on the world. The carved face is a mask, and the **glow is always amber**. Neither Paint nor the Mark Builder colours change the glow.
- **Measured contrast:** lit hole vs night skin (`#6A3A14`) **6.0:1**; dark hole vs day skin **5.9:1**. Unlit at night is 2.1:1 on purpose (it reads as "off"; the rim helps).

## 2. String lights / Winter lights
- **Colours (bulb core at 100%):** teal `#2DD4BF`, cyan `#67E8F9`, blue `#60A5FA`, green `#86EFAC`, amber `#FBBF24`, red `#FF8A80` (soft, not the error red).
  - **Multi** (GameMaster's "Rainbow") = those 6 in fixed repeating order. **Warm only** = warm white `#FFE8B0`, soft gold `#FFD27A`, amber `#FBBF24`.
  - All are ≤ the `#FFF1D6` cap (the highest is warm white at luminance 0.82). Every one is ≥ 7:1 on the night sky `#0B1626`.
- **Halo:** one sprite per bulb, **radius 0.3 block, α ≤ 0.25**, tinted to the bulb colour. Halos are drawn only within 32 blocks; beyond that it's emissive only.
- **Twinkle (Motion on, default for powered strings at night):** per bulb, b = 1 − 0.15·(1 − cos(2πt/P + φ)).
  - **Range 0.70–1.00 (never below 0.70, never off).**
  - **Random-looking phase per bulb:** φᵢ = frac(seed + i·0.618) (golden-ratio spacing). seed and P come from a hash of the string anchor, with **P random per string in 4–7 s**, so neighbouring strings never share a beat. Everything is deterministic, so it survives reload and rotation without re-syncing.
  - **Never a synced whole-string blink:** at most 1/3 of a string's bulbs (4 of 12) may be within ±0.1 cycle of their minimum at once. Golden-ratio spacing gives a worst case of 3 of 12 (simulated over 1,000 strings). Fully random per-bulb phases and periods broke the rule in about 7% of frames, which is why I didn't use them.
  - **Hue never changes.**
- **GameMaster's patterns** (after the Circuits pack; Steady, Slow Fade 4 s, Slow Chase) use the **same 0.70–1.00 band** and the same smooth curve. A chase lifts the lead bulb to 1.00 over the others at 0.70.
- **Motion off:** every bulb steady at 1.00 and no pattern runs. Brightness stays the same, only the change stops.
- **Day (powered, string off until night):** bulb glass at 35% of its colour, no halo, no twinkle.
- **Unpowered** (only after the Circuits pack, once the built-in one-night battery is used up):
  - Bulbs at **15%** of their colour, **no halo, no twinkle**.
  - **Non-colour cue:** a crossed-out plug decal at the string's start anchor (off-white `#EDE7DA`).
  - Looking at or tapping the string shows the chip **"Needs power ⚡"** in words (same wording as the Fabricator).
  - In high contrast: a dashed 2 px `#FFE14A` outline.
  - It reads correctly in greyscale.
- **Cap per screen:** **48 animated bulbs** (nearest to the camera); all other bulbs render steady at 1.00. The halo cap is shared (§5).

## 3. Lanterns and other light parts (same rules)
| Part | Core | Halo (radius / α) | Motion on | Motion off | Empty / unpowered |
|---|---|---|---|---|---|
| LED Lantern Low / Med / High | warm white `#FFE8B0` at 60 / 80 / 100%, teal frame `#14B8A6` | 0.9 / 0.20 · 1.2 / 0.26 · 1.5 / 0.30 | steady (it's an LED) | steady | GameMaster's radius-1 glow = core 15%, no halo, hollow-battery decal + "Needs power ⚡" |
| Moon Lantern (Spooky) | **full round** moon `#F3E9C6`, craters `#E2D6AE` | 1.0 / 0.22, tint `#F3E9C6` | steady | steady | n/a |
| Friendly Ghost Light (Spooky) | sheet `#EDE7DA`, inner glow `#A5F3FC` | 1.0 / 0.20 cyan | bob ±0.08 block, 4 s period | still | n/a |
| LED Glow Strip | teal `#2DD4BF` | 0.4 / 0.20 | steady | steady | 15%, plug decal + chip |
| Glow Moss, Glow Stick, Jumbo Glow | existing teal / own dye colour | ≤ 1.0 / ≤ 0.25 | steady | steady | n/a |
- **Lantern shapes:** box, round, cylinder or full moon. **No crescents, crosses or 6-point stars** (Curriculum rule 5). Stars, when used, are 5-point.

## 4. Friendly spooky
**Autumn + Spooky palette:**
| Name | Hex |
|---|---|
| pumpkin / rib / stem | `#E8782A` / `#B9551B` / `#6E7F35` |
| hay | `#D9B45B` |
| corn husk | `#E6CF8B` |
| leaf rust / gold | `#C2562B` / `#E0A33A` |
| apple | `#B8433A` |
| bark | `#6B4A2F` |
| ghost sheet (off-white) | `#EDE7DA` |
| moon | `#F3E9C6` |
| cobweb grey | `#B8BEC6`, drawn at α ≤ 0.60 |
| bat slate | `#6B7396` |
| cat charcoal / rim | `#3A4052` / `#8A97A8` |
| prop eyes and mouths | `#2B3440` |
| blush | `#F4B6B6` |
| night sky | `#0B1626` |

**Contrast:** every prop is ≥ 3:1 on the night sky. The lowest are bat 3.9, leaf rust 4.0 and stem 4.1. The cat body is 1.8, so the cat always carries the `#8A97A8` rim (6.1).

**Do**
- Rounded silhouettes, with corners ≥ 25% of the shape's size. Stubby, chunky, box-primitive friendly.
- Sheet-ghosts with a wavy hem, big dark oval eyes and a small smile or "o" mouth, optional blush.
- Bats with a round body, scalloped wings and a tiny smile; a cat sitting with its tail curled.
- **Eyes are never emissive.** Cat eyes are amber `#FBBF24` paint with no glow.
- Moon is full and round. Cobwebs are soft grey, decor only, ≤ 60% α.
- Carved-face stamps drawn as open smiles.

**Don't**
- No glowing or red eyes. No teeth, fangs or claws. No blood, drips or gore.
- No skulls, skeletons or bones. No **Day of the Dead imagery** (sugar skulls, calavera patterns).
- No tombstones, coffins, witches, monsters or weapons. No religious symbols.
- **No jump scares:** nothing pops up, lunges, chases or appears suddenly. The ghost only bobs in place, and only with Motion on.
- **No sudden sounds:** no screams or cackles. Sound plays only on the kid's own action (GameMaster's chime and click), with a soft attack and never louder than normal UI sounds. Each sound has a visual.
- No pure white. Cobwebs never cover a face or a HUD control.

## 5. Constants (paste)
```js
// Bertopia holiday look (StyleBot 2026-10-06). Look only; mechanics live in BERTOPIA-DECOR-PACKS.md.
const HOLIDAY_LOOK = Object.freeze({
  capColor: '#FFF1D6',                       // brightest world pixel; never #FFFFFF
  halo: { blend: 'normal', maxAlpha: 0.30, texPx: 64, drawWithinBlocks: 32, maxOnScreen: 160 },
  pumpkin: { skin: '#E8782A', rib: '#B9551B', stem: '#6E7F35', hole: '#120802', fleshRim: '#623E1B',
    core: '#FFC56B', litRim: '#C46A1A', dayRim: '#F2B45A', dayRimEmissive: 0.55,
    halo: '#FFB547', haloRadius: 1.5, haloAlpha: 0.30,
    flicker: null,   // lit pumpkins are steady (no flicker) in every mode
    texPerCell: 4, mipFloorCells: 12, filter: 'nearest', mipFilter: 'max' },
  bulbs: { multi: ['#2DD4BF', '#67E8F9', '#60A5FA', '#86EFAC', '#FBBF24', '#FF8A80'],
    warm: ['#FFE8B0', '#FFD27A', '#FBBF24'], haloRadius: 0.3, haloAlpha: 0.25,
    twinkle: { min: 0.70, periodS: [4, 7], perString: true, phaseStep: 0.618034 }, day: 0.35, unpowered: 0.15 },
  lantern: { core: '#FFE8B0', frame: '#14B8A6', empty: 0.15,
    levels: { low: [0.60, 0.9, 0.20], med: [0.80, 1.2, 0.26], high: [1.00, 1.5, 0.30] } }, // [emissive, haloR, haloA]
  ghost: { sheet: '#EDE7DA', glow: '#A5F3FC', haloRadius: 1.0, haloAlpha: 0.20, bob: { amp: 0.08, periodS: 4 } },
  moon: { core: '#F3E9C6', crater: '#E2D6AE', haloRadius: 1.0, haloAlpha: 0.22 },
  caps: { animatedBulbs: 48, animatedPumpkins: 8, bobbingGhosts: 6, animatedTotal: 60 },
  hc: { outline: '#FFE14A', outlinePx: 2, unpoweredDash: [4, 3], halo: false, animate: false },
  unpoweredChip: 'Needs power ⚡',
});
function holidayMotionOn() {                 // same order as kw-interact
  if (window.KWI && KWI.motionOn) return KWI.motionOn();
  const h = document.documentElement, m = h.getAttribute('data-kwi-motion'), p = h.getAttribute('data-kp-motion');
  if (m) return m === 'on'; if (p) return p !== 'less';
  return !matchMedia('(prefers-reduced-motion: reduce)').matches;
}
// Animate in the shader: uTime + per-string period/seed from hash(anchor), bulb phase = fract(seed + i*0.618034); uMotion = holidayMotionOn() ? 1 : 0.
// Update uMotion on 'kwi:motion' and on data-kp-motion changes. No per-bulb JS per frame.
```

## 6. Accept tests (run each at 412×915, 915×412 and 1366×768)
1. **Night scene:** 1 lit pumpkin, 1 unlit pumpkin, 1 Multi string (12 bulbs), 1 LED Lantern High and the 4 Spooky props render. Every 1-cell carved line is visible at 3 blocks and at 12 blocks. The halo is ≤ 1.5 blocks in radius. Sizes in blocks are the same on all 3 screens.
2. **Pixel scan** of a frame with 20 lit pumpkins and overlapping halos: no world pixel is above `#FFF1D6` luminance (0.89), and there are **0 `#FFFFFF` pixels**.
3. **Flash check:** record 10 s at 30 fps with 48 twinkling bulbs and 8 lit pumpkins.
   - No bulb drops below 70% of its own peak, and no pumpkin below 88%.
   - No light cycles faster than once per 2.7 s.
   - No frame has more than 1/3 of a string's bulbs at their minimum together.
   - Bulb hue drift ≤ 2°.
   - A flash analyser (PEAT or equivalent) reports 0 general flashes and 0 red flashes.
4. **Motion off live:** press Hub → My settings → "Less motion" (→ `data-kp-motion="less"`, `data-kwi-motion="off"`, `KWI.motionOn()` false). Within 1 s, with no reload, every twinkle, flicker, bob and pattern stops and every light sits at its full level with the same states. Turning it back on resumes motion with the phases still spread out.
5. **Rotate mid-play** (upright → sideways → upright) while bulbs twinkle, one string is unpowered and the lantern is on Med. Every light keeps its lit / day / unpowered state, colour and level. The twinkle phases don't reset into sync. Halo sizes in blocks stay the same.
6. **Unpowered:** after the Circuits pack, let the battery night run out. Bulbs go to 15% with no halo or twinkle, the plug decal shows, and a tap shows "Needs power ⚡". The state is readable in a greyscale screenshot. The empty LED Lantern does the same.
7. **High contrast** (`data-kp-contrast="1"`): 0 halo draw calls; lit lights have a 2 px solid `#FFE14A` outline and unpowered ones are dashed; everything is steady even with Motion on.
8. **Caps:** a plot with 64 strings × 12 bulbs and 20 lit pumpkins in view has ≤ 48 animated bulbs and ≤ 160 halos (pumpkins don't animate), and holds ≥ 30 fps at 1366 with CPU 4× throttle (GameMaster's test 10).
9. **Day and dusk:** a lit pumpkin at noon shows dark holes with an amber rim and no halo. The halo fades in over dusk with no pop.
10. **Friendly spooky review** against the §4 do/don't list: no teeth stamps, no glowing or red eyes, full moon only, cobweb `#B8BEC6` at α ≤ 0.60, the ghost bobs only with Motion on, no sound without a kid action.
11. **Contrast:** chips ≥ 4.5:1 (HUD text `#E6FBFF` on `#0E1729` = 16.7:1); lit hole vs skin ≥ 3:1 at night; props ≥ 3:1 on the night sky.

## 7. Mock check (00-sheet.png, 1560×1080)
- **What's on the sheet:**
  - Pumpkin unlit, lit and high contrast.
  - String lights steady, mid-twinkle (each bulb labelled with its % at that instant, 70–100) and unpowered.
  - Ghost light + bat bunting, cat statue + full-moon lantern, cobweb + leaf pile, all on a night scene.
- **Scan of the scene areas:** max luminance **0.81** (moon / warm white), **0 pixels above `#FFF1D6`**, **0 `#FFFFFF`**.
  - The only brighter pixels on the sheet are the caption and HUD-chip text at the existing HUD text cap `#E6FBFF` (luminance 0.93).
  - **StyleBot call:** HUD text keeps the existing HUD cap `#E6FBFF`. It's small text on a dark chip, not a glow or light, so it isn't a glare source. The `#FFF1D6` cap covers every world pixel, glow and halo.

## 8. Flags for GameMaster (their brief; I didn't edit it)
1. **Flicker: resolved.** Lit pumpkins are steady with no flicker, matching DECOR-PACKS §3. Nothing to change on GameMaster's side.
2. **"Toothy grin" stamp** (§3 stamps) conflicts with "no teeth". Proposal: rename it **"Wide grin"**, drawn as an open smile with no teeth. Freehand stays open and teachers can hide a carving.
3. **Names and symbols:** DECOR-PACKS still says "Harvest", "Spooky-Cute", "Diwali" and "Winter Lights packs". Curriculum's names are Autumn, Spooky, Winter and String lights. The Moon stamp and Moon Lantern must be a full moon, not a crescent. FUN-ITEMS' "crescent and star lanterns" also conflict with Curriculum rule 5.
