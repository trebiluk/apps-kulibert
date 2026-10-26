# Bertopia doorbatch part 5 of 6: sticky item tip, repeating update toast
BASE: current origin/main (pull first). Some of this may already be shipped in 2.5.476–487 — if so, check it off and skip.
GOAL: the item tip clears when the Bag closes, and the update toast shows once per version.

## Fix 1: item tip clears on Bag close
src/session.js, near clearBagPick() in the returned API:
  bags: () => ({ survival: bags.survival.dump(), creative: bags.creative.dump() }), wallet, meta, paintBag, clearBagPick() { bagSel = -1
Add the tip hide (the hover/info tip element) inside clearBagPick, and make sure the Bag close path (Esc and close button in panels.js) calls clearBagPick.

## Fix 2: update toast once
src/main.js, the bert-update listener / update toast (near getRegistration in part 1). Guard with localStorage 'bert-update-seen' === VERSION; set it when shown. Do not re-show on controllerchange for the same version.

FILES TOUCHED: src/session.js, src/panels.js, src/main.js.
OUT OF SCOPE / BLAST RADIUS: Esc closes one level (PASS now, keep), SW update flow from part 1, sessionStorage bert-sw-reloaded logic.

HELP DOC: "A short note shows once when Bertopia updates." 8 langs via Curriculum Bot.
PII CHECK: version string only.
ACCESSIBILITY CHECK: toast stays 4 s static, aria-live polite, no flash.

STUDENTTESTER CHECKLIST (Test at 1366x768 Chromebook, and at 412 upright and 412 sideways. Test alias only, no class-world screenshots.)
1. Open Bag, hover/tap an item (tip shows), close with Esc: tip gone. Repeat with close button.
2. After an update, toast once; reload twice: no toast.
3. Esc still closes one level at a time.
4. Help doc line present in en and ru.

Say DONE only if you can see it working live; never fake a DONE.
