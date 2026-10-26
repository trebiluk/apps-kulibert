# Bertopia doorbatch part 3 of 6: Bed text, side panel ×n, wood tip timing
BASE: current origin/main (pull first). Some of this may already be shipped in 2.5.476–487 — if so, check it off and skip.
GOAL: Bunk reads "Bed" everywhere, the side panel reads name ×n for every item, and the wood tip only shows while breaking.

## Fix 1: Bed text (key stays 'bunk')
src/strings-extra.js: change only VALUES of key bunk (en blocks at lines ~12 and ~22, and each language): en Bed, uk Ліжко, ru Кровать, es Cama, ar سرير, fa-AF تخت, rw Igitanda, ti ዓራት. Change poofBunk, anchored:
  coreplateToast: 'Coreplate. Nothing gets through.', poofTown: 'Poof! Back at Bertyville.', poofBunk: 'Poof! Back at your Bunk.'
to 'Poof! Back at your bed.' (locked). Other 7 langs: use Curriculum Bot's posted set (GAP: not in files; paste from room). Do not rename ID.bunk, 'bunk' material, panels.open('bunk'), RECIPES id, or save palette.

## Fix 2: side panel = name ×n
Find the panel painter that builds "Workbench 1 /64 You have 1 - ×64" (uses t('youHave') in strings-extra; Debugzy to locate exact painter in session.js/panels.js). Replace with one row per item: itemName + ' ×' + n (ar/fa-AF: name first, then ×n, in a dir=auto span so it lands left in RTL). Rows min-height 48px, font >= 16px. Panel height = content; hidden when no rows. Drop "/64", "You have", "Farm" suffix.

## Fix 3: wood tip only while breaking
src/strings-extra.js key toolFaster: 'A Wood Tool is faster.' -> 'Chop wood faster with a Wood Tool.' and 8 langs: uk Рубай дерево швидше дерев'яним інструментом. | ru Руби дерево быстрее деревянным инструментом. | es Corta madera más rápido con una herramienta de madera. | ar اقطع الخشب أسرع بأداة خشبية. | fa-AF با ابزار چوبی چوب را تیزتر ببُر. | rw Tema ibiti vuba ukoresheje igikoresho cy'igiti. | ti ብመሳርሒ ዕንጨይቲ ዕንጨይቲ ቀልጢፍካ ቁረጽ። (rw+ti native check pending). At the call site of t('toolFaster') in main.js, gate on an active break (mining progress > 0 on a log/wood block) and clear it when breaking stops; never on place.

FILES TOUCHED: src/strings-extra.js, src/main.js, src/session.js or src/panels.js (panel painter), index.html (panel CSS).
OUT OF SCOPE / BLAST RADIUS: bed behavior (instant sleep, 2-tile, no dim: separate on-screen check), stack limits, Bag grid, tools logic. Blast radius: tools/check-strings.mjs must pass (all 8 langs same keys); ids-check unaffected.

HELP DOC: rename Bunk to Bed in the help doc, 8 langs; add "The side list shows what you hold, like Workbench ×1."
PII CHECK: game data only.
ACCESSIBILITY CHECK: 48px rows, 16px+ text, RTL order correct, tip is text not color.

STUDENTTESTER CHECKLIST (Test at 1366x768 Chromebook, and at 412 upright and 412 sideways. Test alias only, no class-world screenshots.)
1. Craft/hold a bed: name says Bed; warp home toast "Poof! Back at your bed."
2. Hold 1 Workbench: panel shows one row "Workbench ×1", sized to fit. Hold 3 Wheat Seeds: "Wheat Seeds ×3".
3. Empty hands/empty list: panel gone.
4. Place a block: no wood tip. Chop a log by hand: "Chop wood faster with a Wood Tool." then clears.
5. Switch to ar: "طاولة العمل ×1" reads right; help doc says Bed in en and es.

Say DONE only if you can see it working live; never fake a DONE.
