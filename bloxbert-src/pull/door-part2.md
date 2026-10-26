# Bertopia doorbatch part 2 of 6: one-box held-item preview
BASE: current origin/main (pull first). Some of this may already be shipped in 2.5.476–487 — if so, check it off and skip.
GOAL: holding anything placeable shows one matte, see-through ghost at block size on the targeted tile only. No solid fill, no tall box, no floating card. Fixes the 3-tall Workbench tower and the huge green Wheat Seeds square.

## Fix 1: block ghost is block size
Anchor src/main.js syncPlaceGhost():
  ghostBedScale(id === ID.bunk)
  if (amber) { // 2.5.449: blocked = red outline, no fill
Set placeGhost.scaling to (1,1,1) for every non-bed id before enabling it (the Workbench inherits a stretched scale). Ghost style: see-through, about 25% fill (tealMat alpha 0.25, no emissive), 2px edge, sitting on the target tile's top face and sized to the item's footprint. Keep bed 2-tile span (shopSpan) as is.
In paintOutline():
  outline.setEnabled(true)
  const local = noa.globalToLocal([pos[0] + 0.5, pos[1] + (low ? 0.35 : 0.5), pos[2] + 0.5], null, [])
when heldBlockId() is placeable and ghostCell() is set, call outline.setEnabled(false) so only the ghost shows (one box, not two).

## Fix 2: seeds/plantables
In syncPlaceGhost(), branch before the block path when the held item is a seed/plantable (use the existing tryPlant item test): if the targeted block is farmland, show a small see-through sprout ghost (same style, sprout footprint) sitting on top of that tile plus a ✓ chip; otherwise draw no ghost at all and show a small icon + text tip near the hotbar: t('needsFarmSoil') ("Needs farm soil"). Never draw the held item's sprite/billboard in front of the camera: find what renders the green card (held-item billboard when heldBlockId() returns a crop id) and disable it for seeds.

## Fix 3: ✓ / ✕ cue, not color only
A small HUD chip near the crosshair: ✓ when ghost is valid, ✕ + reason when amber/blocked (seeds off farmland use the hotbar tip instead). aria-live polite text (throttled, change-only).

FILES TOUCHED: src/main.js, src/strings.js (needsFarmSoil, locked, verbatim: en Needs farm soil | uk Потрібна рілля | ru Нужна пашня | es Necesita tierra de cultivo | ar تحتاج إلى تربة زراعية | fa-AF به خاک زراعتی نیاز دارد | rw Bikenera ubutaka bw'umurima | ti ሓመድ ግራት የድሊ; rw+ti native-speaker check), index.html (chip CSS).
OUT OF SCOPE / BLAST RADIUS: placement rules, reach, bed/woodshop 2-tile logic, outline when hands empty (keep cyan outline), crop growth, save. Blast radius: tableMode cursor, door placement, lowPlant outline scaling.

HELP DOC: add "Hold a block to see a see-through box where it goes. Seeds only go on farm soil: look for ✓." in 8 languages via Curriculum Bot.
PII CHECK: game data only.
ACCESSIBILITY CHECK: ✓/✕ is icon + text, not color only; ghost alpha readable on grass and sand; no flashing.

STUDENTTESTER CHECKLIST (Test at 1366x768 Chromebook, and at 412 upright and 412 sideways. Test alias only, no class-world screenshots.)
1. Hold Workbench, aim at ground: one see-through box exactly one block, no tower.
2. Hold Wheat Seeds, aim at farmland: small sprout ghost on that tile + ✓. No green square anywhere.
3. Hold seeds, aim at grass: no ghost; "Needs farm soil" icon + text tip near the hotbar.
4. Hold a Bed: 2-tile ghost, red outline + ✕ when blocked.
5. Help doc shows the new preview line in en and ar.

Say DONE only if you can see it working live; never fake a DONE.
