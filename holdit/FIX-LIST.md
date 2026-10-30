# HoldIt FIX-LIST
Read this first on every HoldIt ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title: **HoldIt · HI 1.1.25** (`/holdit/` on apps.kulibert.net).
- Latest proof on file: `proof/holdit-1.1.18/RESULT.md`: Verdict: FAIL (P1). The 1.1.18 tower/full-screen items pass on first load; turning the phone, the Report table, drawer contrast and editor taps fail. HI 1.1.23 clears the drawer, the Member report, and the editor taps. The turn rows below stay open.

## 2. Open fixes (FAIL rows from the latest proof)
- [ ] Tower stays in view after a turn · FAIL: 412x915→915x412 board 113 px, ground off-screen (band −2.12); 360x740→740x360 65 px (−2.99); turning back stays squeezed (534 vs 742) · shots/matrix-412x915-en
- [ ] Turn card clear of controls · FAIL at 915x412 after a failed Test (covers FS bottom / Back) · shots/matrix-915x412-en-default-06-t01-result.png
- [x] Menu drawer / Settings ≥4.5:1 · HI 1.1.23 bd7f57f61ea3161cada4484f07bd92af724ee85a · was selects 1.41, Larger type/Read about 1.8, Teacher 3.47, locked cards 2.50. Paper fill, dark type, lock icon plus the word.
- [x] Member envelope (Report) · HI 1.1.23 44cb02ada5e225afe51b8595932a2a6a2917613e · was wood, 11px, headers 3.47:1, hover bar 1.41:1, overlay 0.80. Light table, 14px, light bold row, overlay 0.92, help strip hidden.
- [x] Editor taps ≥44 · HI 1.1.23 5cba8c3af566f3ca5ec36d79d2f2ec649dc7b036 · was Report 36px, side actions 36px tall, section chips about 40px wide. Dock stays on screen at 412 and 915.

## 3. Next up: open briefs in version order (tick when shipped AND proven)
- [ ] `briefs/fixq/holdit-1119-envelope-chips.md`: HoldIt HI 1.1.19: a Member report a kid can read (colour chips, not a table), towers stay in view after a turn, readable menus, and editor taps ≥44 (P…
- [ ] `briefs/fixq/hiscore-holdit.md`: HoldIt HI [NEXT] · hiscore-holdit: Crown Chase in HoldIt, Span and Spire: the Cost Crown and two more crowns per problem, the reveal rule instead of a…
- [ ] `briefs/fixq/menu-holdit.md`: HoldIt — same Hub menu
- [x] `briefs/fixq/spanspire-2-holdit.md`: HoldIt HI 1.1.21: Bridges becomes Span and Towers becomes Spire, the address picks the mode, and each mode opens its jobs.

Already shipped (version at or below live):
- [x] `briefs/fixq/holdit-1118-towers-fullscreen.md`: HoldIt HI 1.1.18: towers fit a sideways phone, a one-tap Full screen button that remembers the choice, a portrait lock for towers, and the Dari word f… (version ≤ live/proven 1.1.18)

## 4. Rules
- Every brief: 8 languages (en, uk, ru, es, ar, fa-AF, rw, ti), taps ≥44 px, ☰ top-left, phones equal to Chromebooks, and DONE only when its Accept passes on a fresh page.
- Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>. Push to main and reply with the sha.

## 5. Proof changelog
- `holdit-1.1.18`: Verdict: FAIL (P1). The 1.1.18 tower/full-screen items pass on first load; turning the phone, the Report table, drawer contrast and editor taps fail.
- `holdit1115`: Also prior 1.1.13/1.1.14: Export/Import 132×44; left ☰; What's new — still PASS.
- `holdit1114`: PASS vs 1.1.12 brief (tap targets + left menu + What's new). Residual: named Settings row → open brief holdit-1115.
- `fixq-09-holdit`: PASS (all acceptance checks in brief 09 / QUEUE-20 row 9). Proven live Sat Oct 3 2026, 6:40–6:55 AM ET.
