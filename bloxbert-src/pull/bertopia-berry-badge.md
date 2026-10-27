# BUILD PASTE: Bertopia berry badge fix (Berry Picker badge never counts)

GOAL: picking berries from 5 different bushes earns Berry Picker, the toast says "Badge earned: Berry Picker", and a picked bush goes bare.

Repo `bloxbert-src`, origin/main 157a945e (live 2.5.496). Pull first, no force-push. Match anchors by text, not line number.

Repro (test door `kuliblocks-test`, headless, 1366x768):
- `pickBush` on a ripe planted bush throws `ReferenceError: cell is not defined`. Berries are added (+3) but the bush stays ripe (bushFruit 68), so a second pick gives +3 more. That's endless berries, and the badge stays at 0/5.
- Wild bushes never call the badge at all.
- `bdgBerryRoundName` (the old name key) is already fixed on main in 2.5.475 (43e7e0fc). Don't touch the name lookup.

## Fix 1: undefined `cell` in pickBush (P0)
File `src/main.js`, function `pickBush`. Delete this line:
```
  Badges.bump('berryRound', cell) // 2.5.472
  popBerry(x, y, z, n)
```
(keep `popBerry`). Then add a line after the card at the end of the function:
```
  paintCrop(row)
  showCropCard(x, y, z)
  Badges.bump('berryRound', x + ',' + y + ',' + z)
}
```
Why after the card: `showCropCard`/`showCard` share the one toast, so a card shown after bump wipes "Badge earned". I confirmed this headless.

## Fix 2: wild bush picks count
Function `tryWildBush`, add after the card:
```
  forage.add(x, y, z, 'bush', now)
  showCard(wildBushText(x, y, z))
  Badges.bump('berryRound', cell)
```
Function `leftHarvest`, wild branch, add after the card:
```
      forage.add(x, y, z, 'bush', Date.now())
      showCard(wildBushText(x, y, z))
      Badges.bump('berryRound', cell)
```
`cell` is already a local in both functions.

## Fix 3: version + What's new
`package.json` version: VERSION LOCKED: 2.5.498. Add a `src/changelog.js` entry at the top for 2.5.498 (text below).
- Use the WHAT'S NEW block below for all 8 languages (rw, ti, fa-AF marked machine draft).
- Help doc: the badges panel already shows "Pick berries from 5 different wild bushes". No new help string.

## FILES TOUCHED
- `src/main.js` (pickBush, tryWildBush, leftHarvest only)
- `package.json` (version)
- `src/changelog.js` (one entry)
- the rebuilt door bundles, as usual

## OUT OF SCOPE (blast radius)
- `src/badges.js` (bump/load/dump format unchanged; keys stay "x,y,z" strings). Old saves have empty berry keys because bump always threw, so there's nothing to migrate.
- Name-key builder in `main.js` onBadge and `panels.js` badges: already correct.
- `crew-badges.js`, lanternWalk, gardenCorner, wallet pay (10 bronze Cogs once).
- `tryBush` / `cropDig` reach and survival gates; `wildPickCount`/`berryPickCount` amounts.
- Known, not fixed here: `Badges.load` returns early when a world has no `badges`, so progress can carry across a fresh or other world in one tab. Separate brief.
- No netcode, no student save `kuliblocks` and no repo-ak.

## STUDENTTESTER CHECKLIST (test door, test alias only)
Check each step at Chromebook 1366x768 and phone 412x915 upright and 915x412 sideways.
1. Survival: pick a ripe planted berry bush. Expect +berries, the bush goes bare and the card shows "Regrows in…". No console error.
2. Pick the same bush again right away. Expect no berries and Badges still 1 / 5.
3. Pick 4 different wild bushes. Expect the badges panel to count to 5 / 5, then Done.
4. On the 5th bush, expect "Badge earned: Berry Picker" (readable, not cut off), then "+10 Cogs". Picking more bushes pays nothing more.
5. Switch the language to es and ar. The badge toast shows that language, and ar reads right to left.
6. Reload. Badge still Done; Cogs not paid twice.

## PII CHECK
Badge data is bush coordinates + badge ids in the world doc. Aliases + game data only, never PII. Test aliases only, no class-world screenshots.

## ACCESSIBILITY CHECK
- "Badge earned" was being wiped silently. After the fix it shows as text in the toast, so it isn't sound-only.
- The panel row keeps shape + word (Alias badge), so meaning isn't carried by color alone.
- Toast readable at 412 wide; no flash.

Proof: live test door, steps 1–4 at 412 + 1366, console clean.

WHAT'S NEW (all 8; rw, ti, fa-AF = machine drafts pending native check):
- en: Berry bushes now empty when you pick them. Wild bushes count for the Berry badge too.
- uk: Кущі з ягодами тепер порожніють, коли ти їх збираєш. Дикі кущі теж рахуються для значка «Ягоди».
- ru: Кусты с ягодами теперь пустеют, когда ты их собираешь. Дикие кусты тоже считаются для значка «Ягоды».
- es: Los arbustos de bayas ahora quedan vacíos cuando los recoges. Los arbustos silvestres también cuentan para la insignia de Bayas.
- ar: شجيرات التوت تصبح فارغة الآن عندما تقطفها. الشجيرات البرية تُحسب أيضًا لشارة التوت.
- fa-AF: بته‌های توت حالا وقتی آن‌ها را می‌چینی خالی می‌شوند. بته‌های وحشی هم برای نشان توت حساب می‌شوند.
- rw: Ibihuru by'imbuto ubu birashira iyo ubisoromye. Ibihuru byo mu gasozi nabyo bibarwa ku kimenyetso cy'Imbuto.
- ti: ኣቑጽልቲ ፍረ ሕጂ ምስ ለቐምካዮም ባዶ ይኾኑ። ናይ በረኻ ኣቑጽልቲ እውን ንምልክት ፍረ ይቑጸሩ።
DESIGN LOCKED (GameMaster): wild bushes count; "Badge earned" toast shows after the bush card.

Say DONE only if you can see it working live; never fake a DONE.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
