# Bertopia doorbatch part 6 of 6: What's new 2.5.472 + Badges tile
BASE: current origin/main (pull first). Some of this may already be shipped in 2.5.476–487 — if so, check it off and skip.
GOAL: What's new talks about badges, the changelog has a plain 472 entry, and the menu has a Badges tile.

## Fix 1: whatsNewBody
src/strings.js, en block, anchor:
  en: {
    whatsNewBody: 'The Oven fire is big and lively, and new things you craft go where you can find them.',
Replace in all 8 langs with Curriculum Bot's 472 badges line. GAP: that line is not in any file on the box; Curriculum Bot pastes it into this part before paste. Also index.html  <p class="new" id="whats-new" data-i18n="whatsNewBody">2.5.297 — ...  fallback text -> the en line.

## Fix 2: changelog entry
src/changelog.js  export const CHANGELOG = [  : confirm 2.5.472 entry exists (RESULT.md says added); add plain en text "Earn badges by exploring. Each one pays 10 Cogs once." if missing. paintLog has no cap; leave it.

## Fix 3: Badges tile
Add a menu tile "Badges" that opens the badge card (Badges module, src/badges.js, import at main.js top: import * as Badges from './badges.js'). Key badgesTile in strings: en Badges, uk Значки, ru Значки, es Insignias, ar الشارات, fa-AF نشان‌ها, rw Ibirango, ti ምልክታት (Curriculum Bot confirm). Tile 48px+, icon + text.

FILES TOUCHED: src/strings.js, index.html, src/changelog.js, src/main.js, src/panels.js.
OUT OF SCOPE / BLAST RADIUS: badge earn rules and Cogs payout, save shape (badges:oD()), Creative/Build pay nothing. Blast radius: check-strings key parity.

HELP DOC: "Open Badges in the menu to see what you earned." 8 langs.
PII CHECK: badges show alias + game data only.
ACCESSIBILITY CHECK: tile keyboard-focusable, 44px+ taps in card, readable contrast.

STUDENTTESTER CHECKLIST (Test at 1366x768 Chromebook, and at 412 upright and 412 sideways. Test alias only, no class-world screenshots.)
1. What's new card mentions badges and 2.5.472.
2. Changelog top entry 2.5.472 plain.
3. Menu shows Badges tile; opens card; Esc closes it.
4. Help doc Badges line in en and fa-AF.

Say DONE only if you can see it working live; never fake a DONE.
