# Bertopia doorbatch part 4 of 6: menu dim, Entrar/Deshacer wrap, keys tip hides
BASE: current origin/main (pull first). Some of this may already be shipped in 2.5.476–487 — if so, check it off and skip.
GOAL: the menu dims to flat gray (no blur), top-right buttons never overlap, and the keys tip bar goes away.

## Fix 1: solid scrim
index.html CSS, anchor:
  #scrim{position:fixed;inset:0;background:rgba(5,8,20,.25);z-index:8;opacity:0;pointer-events:none;backdrop-filter:none}
Set background:rgba(20,20,22,0.72). Then grep index.html, read.css and src/*.js for every backdrop-filter / filter:blur on menu open (Debugzy to locate the one live on 2.5.472) and remove it. No blur anywhere (slow on Chromebooks).

## Fix 2: top-right buttons wrap
Container holding signIn (Entrar) and Undo (Deshacer): display:flex; flex-wrap:wrap; gap:8px; justify-content:flex-end; max-width:calc(100vw - 16px). Each button min-height:48px, min-width:48px, icon + text, white-space:nowrap. Check es (longest labels) at 412.

## Fix 3: keys tip bar hides
Find the keys hint bar (strings-extra keysHint* family; Debugzy to locate painter). Hide it after the first move/look input or 8 s, whichever first; remember per device in localStorage key bert-keys-tip-seen; never show on touch-only devices.

FILES TOUCHED: index.html, read.css, src/main.js.
OUT OF SCOPE / BLAST RADIUS: menu contents, panel layout from part 3, StyleBot's gray+orange theme and shop money sign (separate), pause logic. Blast radius: any panel using #scrim (Bag, bed, shop) changes to gray.

HELP DOC: "Press ? to see the keys again." 8 langs via Curriculum Bot.
PII CHECK: localStorage flag only, no names.
ACCESSIBILITY CHECK: scrim contrast keeps menu text >= 4.5:1; 48px targets; no flashing; focus order unchanged.

STUDENTTESTER CHECKLIST (Test at 1366x768 Chromebook, and at 412 upright and 412 sideways. Test alias only, no class-world screenshots.)
1. Open the menu: background flat dark gray, not blurry.
2. es at 412 upright: Entrar and Deshacer on separate rows or side by side, never overlapping.
3. Move once: keys bar disappears; reload: stays hidden.
4. Help doc shows the keys line in en and es.

Say DONE only if you can see it working live; never fake a DONE.
