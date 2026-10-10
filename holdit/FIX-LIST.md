# HoldIt FIX-LIST
Read this first on every HoldIt ship. In the same commit, tick `[x]` on each item you finished, and put your version and sha next to it. Proof updates "Live now" and the changelog. Docs only: no app code.
Built Sun Oct 4 2026, 6:55 AM ET from Debugzy's fixq briefs and proof RESULTs; it may lag anything shipped after them.

## 1. Live now
- Live title: **HoldIt · HI 1.1.22** (`/holdit/` on apps.kulibert.net).
- Latest proof on file: `proof/holdit-1.1.18/RESULT.md`: Verdict: FAIL (P1). The 1.1.18 tower/full-screen items pass on first load; turning the phone, the Report table, drawer contrast and editor taps fail.

## 2. Open fixes (FAIL rows from the latest proof)
- [ ] Tower stays in view after a turn · FAIL: 412x915→915x412 board 113 px, ground off-screen (band −2.12); 360x740→740x360 65 px (−2.99); turning back stays squeezed (534 vs 742) · shots/matrix-412x915-en
- [ ] Turn card clear of controls · FAIL at 915x412 after a failed Test (covers FS bottom / Back) · shots/matrix-915x412-en-default-06-t01-result.png
- [ ] Menu drawer / Settings ≥4.5:1 · FAIL: selects 1.41, Larger type/Read 1.79, Teacher 2.29, locked lobby cards 1.7–1.98 · shots/*-02-drawer.png, *-03-settings.png
- [ ] Member envelope (Report) · FAIL (Diego): grey on wood, faint headers, picked row unreadable, all 0.00/— before Test, help strip shows through · diego/1024x547-member-envelope.png
- [ ] Editor taps ≥44 · FAIL (brief 19 items still open) · crops/

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
