# Ramp & Fill FIX-LIST
Stage 26. Version locked: RF 1.0.26.

- [x] **win-levels:** After a win, Levels (icon and word, at least 48px) opens the picker. Next level shows when the next level is unlocked. Home still goes to the Hub.
- [x] **level-1-guide:** Level 1 keeps a faint dotted ramp on the board. Help still says to draw like the dotted guide.

Stage 25. Version locked: RF 1.0.25.

- [x] **level-picker:** Levels opens a picker. Level 1 is open. The next level unlocks only after a win. Locked tiles show a lock icon and the word Locked. Tiles are at least 48px and keyboard focusable. Unlocks stay in localStorage.
- [x] **pill-clear:** Sign in and Back to the Hub no longer cover the version chip or Close on the play screen or the menu at 1366×768, 412×915, and 915×412.

Stage 24. Version locked: RF 1.0.24.

- [x] **home-pour-lines:** The home screen uses the Pour Lines paper, Syne title, and two tabs (Levels, Pour Lines), plus Cup Stack, Referee, and Stack ideas. No illustrated tiles.
- [x] **tap-44:** Home tabs, chips, and the menu button are at least 44px.
- [x] **whats-new:** What's new says RF 1.0.24 in all 8 languages and Simple.
- [x] **help-guide:** Help lines no longer carry data-i18n, so the shared English pack cannot overwrite the guide.

Stage 23. Version locked: RF 1.0.22.

- [x] **pl-materials:** Sugar, gel, syrup, and water each fall their own way. A wrong pour mixes the jar. A full jar with a rim spills that material back out.
- [x] **pl-levels-8-21:** Levels 8 to 21. The 21 level chips wrap and stay 44 by 48.
- [x] **pl-shapes-words:** Sugar is a circle, gel a rounded square, syrup a diamond, and water a ring. Jar badges and lose titles use words in every language.

Stage 22. Version locked: RF 1.0.21.

- [x] **pl-layout:** Wide screens put the board beside a 260 px rail. A phone stacks the controls. A sideways phone uses a slim rail and a tall board.
- [x] **pl-keyboard-pen:** Arrows move a pen on the board. Enter puts it down or lifts it. Space pours. Esc lifts the pen, closes a lose card, or goes home.
- [x] **pl-words:** The board, the pen, the jars and the level chips have words in every language. Pour Lines stays English.

Stage 21. Version locked: RF 1.0.20.

- [x] **pl-engine:** Pour Lines has its own screen, canvas, grains, lines, jars and arms.
- [x] **pl-levels-1-7:** Levels 1 to 7, with a letter and a gram count on every jar.
- [x] **pl-pour-rewind:** Pour, pause, resume, rewind, undo and a two-tap clear. Rewind keeps the lines.

Stage 20. Version locked: RF 1.0.19.

- [x] **home-no-pause:** The home menu hides Pause and the fill bar. Both come back when a level starts. Escape on the home menu does not open Pause.

Stage 19. Version locked: RF 1.0.18.

- [x] **ref-team-buttons-fit:** On a phone the four Referee team buttons sit in a 2×2 grid so the name and the number both show. Wider screens keep one row only when the whole label fits.

Stage 18. Version locked: RF 1.0.17.

- [x] **rf-tool-row-name:** The ramp tool bar and the empty cup score are named in the kid's language, including after a language change. The English words stay in the page as the no-JS fallback.

Stage 17. Version locked: RF 1.0.16.

- [x] **RF 1.0.16 ITEM 1:** The Daily cup date uses the browser's own short date when that language is installed. Kinyarwanda and Tigrinya, which Chrome does not include, use day and month names from the string table. The tile label uses the same words. Kinyarwanda, Tigrinya, and Dari names need a native check.

Stage 16. Version locked: RF 1.0.15.

- [x] **RF 1.0.15 ITEM 1:** Ramp counts use the right word for 1, 2–4 and 5+ in every language. The level tile, the Daily tile, its aria-label, and the end card share one helper.

Stage 15. Version locked: RF 1.0.14.

- [x] **RF 1.0.14 ITEM 1:** The Daily cup tile shows today's best after a clear. The end card shows Best and New best! when you beat it. No streak and no alias.

Stage 14. Version locked: RF 1.0.13.

- [x] **RF 1.0.13 ITEM 1:** The level list has a Daily cup tile. The cup comes from the school date, so the whole class gets the same one. Weekends repeat Friday. Today's best is date and a number on this device only. No streak and no alias.

Stage 13. Version locked: RF 1.0.12.

- [x] **RF 1.0.12 ITEM 1:** After a new best, Retry can show a faint grey copy of those ramps. The lines are stored by level only. Show best is a 44px switch, on by default.

Stage 12. Version locked: RF 1.0.11.

- [x] **RF 1.0.11 ITEM 1:** A pour shows a soft splash and a fill-line ripple. The fill percent counts up in the page. A short rising tone plays unless mute is on. Reduced motion skips the ripple.
- [x] **RF 1.0.11 ITEM 2:** The level list shows each level's stars as a star icon plus a number, and the fewest-ramps best. A locked level says to finish the one before it.
- [x] **RF 1.0.11 ITEM 3:** The clear card shows stars one by one (still if motion is reduced). Next is focused. Retry stays at least 44px.
- [x] **RF 1.0.11 ITEM 4:** Feature ideas are written below. No code.

## Feature ideas (RF 1.0.11 investigate)

1. **Level Maker share code.** A kid builds a ramp puzzle and gets a short code a classmate can type to try it. Why: the class already trades ideas out loud. Size: medium (a local code, not an account). Risk: a bad code must fail quietly, and the code must not carry a real name.
2. **Daily cup.** One new cup shape each school day, same for the whole class. Why: a reason to open the app tomorrow. Size: small. Risk: do not store a streak that identifies a kid, and do not change the existing save.
3. **Class referee board.** The in-person timer already locks a time. A later build could list team aliases and locked times on one screen. Why: the referee still writes times on paper. Size: medium. Risk: aliases only, nothing online, and no editing a locked time.
4. **New materials.** Sand and oil next to grains, water, and gel, each with one sentence about why it moves that way. Why: the lesson words are already there. Size: medium. Risk: do not retune the current pour.
5. **Best-ramp ghost.** After a new best, a faint replay of that ramp can show on Retry. Why: "try for fewer" is easier if you can see what worked. Size: small. Risk: the ghost must not cover the draw tool or the cup.

Stage 11. Version locked: RF 1.0.10.

- [x] **RF 1.0.10 ITEM 1:** The grains-cup status line is in all 8 languages plus Simple. Spanish says "Taza de granos llena: elige Agua y dibuja hasta esa taza." The wrong-cup lines are translated too.

Stage 10. Version locked: RF 1.0.9.

- [x] **RF 1.0.9 ITEM 1:** The test script loads only when the staff unlock and the Test switch are both on. A kid page has no kw-test tag and no test global.

Stage 9. Version locked: RF 1.0.8.

- [x] **RF 1.0.8 ITEM 1:** Pick the path, Wall, and the level-5 hint are translated in all 8 languages plus Simple. On a 412-wide phone the status line and the hint wrap. Nothing is cut off.
- [x] **RF 1.0.8 ITEM 2:** The test script is added only after the staff unlock. A kid page has no kw-test tag and no test global.
- [x] **RF 1.0.8 ITEM 3:** A staff test win shows the win screen and posts only to the TEST board. Kids cannot start that win.

Stage 8. Version locked: RF 1.0.7.

- [x] **RF 1.0.7 ITEM 1:** Staff Test mode shows Jump to win and Jump to lose only when the hub switch and staff unlock are on. Those wins post to the TEST board. The score route never writes the real board. Kids, and ?test=1 alone, get no test controls.
- [x] **RF 1.0.7 ITEM 2:** The real board returned no rampfill rows after 6:00 PM ET. No candidate. Nothing removed.
- [x] **RF 1.0.7 ITEM 3:** The staff test help line is in all 8 languages plus Simple. Kids do not see that line.

Stage 7. Version locked: RF 1.0.6.

- [x] **RF 1.0.6 ITEM 1:** Title, chip, menu plate, data-version, cache-bust and What's new all read RF 1.0.6 from the one VERSION constant.
- [x] **RF 1.0.6 ITEM 2:** Help lesson and fewer-ramps lines are in all 8 languages plus Simple. The page loads the current language file, so those keys are not missing.
- [x] **RF 1.0.6 ITEM 3:** On a short sideways screen, Cup Stack sits on its own row. It no longer covers Undo or Clear. Pause stays full size and is not under the Hub home button.
- [x] **RF 1.0.6 ITEM 4:** The real board at tw.kulibert.net/api/boards returned no rampfill rows. Nothing was removed.

Stage 6. Version locked: RF 1.0.5.

- [x] **RF 1.0.5 ITEM 1:** The clear card shows one lesson line and an icon. Level 1 says slope. Level 4 says viscosity. Levels 2 and 5 say flow rate. Help tells you to read that line.
- [x] **RF 1.0.5 ITEM 2:** A clear saves the fewest ramps for this alias on this Chromebook. The card says Best: N ramps. A lower clear shows New best! with an icon and words. Try for fewer starts the level again.
- [x] **RF 1.0.5 ITEM 3:** Star rules stayed put. No spill is 3 stars, up to 12 spilled is 2, more than that is 1.

Stage 5. Version locked: RF 1.0.4.

- [x] **RF 1.0.4 ITEM 0:** One Retry tap stops a pour and clears a spill. The status goes back to empty with the start hint.
- [x] **RF 1.0.4 (a):** Referee screen has a room-sized timer, count up and count down, Start / Stop / Reset, and a bigger Done button. The last 10 seconds grow and the border thickens. Time! is a card with an icon. No sound.
- [x] **RF 1.0.4 (b):** Numbered cards 1–4 on the referee screen: pyramid, tower to a line, bridge, and stairs. Each shows the stack as a picture and “You need” as cup pictures. Teams are Team 1–4 with a shape and a word. Nothing is saved online.
- [x] **RF 1.0.4 (c):** Stack ideas is its own page with five big pictures: pyramid, tower, bridge, stairs, and a line. Each says how many cups with cup pictures. No printing.
- [x] **RF 1.0.4 (d):** Done stops the timer and shows “Hands off — time locked” with an icon and words. Start cannot change that time. Next card keeps the card order and gives the next team a fresh timer. Reset clears the lock without skipping the card.

- [x] **RF 1.0.3 ITEM 1:** Home shows two tiles, Levels and Cup Stack. One tap on Cup Stack opens stacking. The in-level Cup Stack button stays.
- [x] **RF 1.0.3 ITEM 2:** A fresh level, Clear, and Retry show no spill text. "can you fill more?" waits until a cup is filled.
- [x] **RF 1.0.3 ITEM 3:** "fill to here" sits above the cup rim and does not cover a cup. Spill tips stay inside the canvas.
- [x] **RF 1.0.3 ITEM 4:** Beating a level opens the next one. Stars and the cup row stay after a reload. Start over in the menu clears them after a confirm.
- [x] **RF 1.0.3 ITEM 5:** `?proof=1` adds window.__RF_PROOF with level, solve, and state. Without that query the hook is absent.
- [x] **RF 1.0.3 ITEM 6:** A long press on the canvas does not open a menu. Drawing still works.

- [x] **RF 1.0.0** shipped (aa3602a). L1 grains ramp still fills, spills, and retries with the ramp kept.
- [x] **RF 1.0.1** shipped (c989425). L1 to L3 stay. Sideways cup, two cups, first water leak.
- [x] **RF 1.0.2 0a:** Result line is a fixed height, empty or not. Canvas px matches fresh and after a spill at 915×412. Canvas labels stay inside the edges.
- [x] **RF 1.0.2 0b:** Contest is off, so the play screen has no "You: #" line and no empty rank gap.
- [x] **RF 1.0.2 0c:** "can you fill more?" stays hidden on a fresh load and a reload until this visit hits Filled it.
- [x] **RF 1.0.2 0d:** "Cups: N" with a cup icon sits next to the cup pictures.
- [x] **RF 1.0.2 0e:** What's new is RF 1.0.2 in 8 languages. Level 1 help says grains (water later), not that Level 1 already has water.
- [x] **RF 1.0.2 0f:** NOT REPRODUCED. Five Level 2 pours at 915×412 and five at 1366, each watched 10s. Fills stayed at the line, strokes stayed, level stayed 2, canvas height did not move. No pour timer clears the cup (a grain older than 12s only settles or spills that grain). Pour physics unchanged.
- [x] **RF 1.0.2 L4 Slow Gel:** A flat tray is already drawn. Gel sits and says make the hill bigger. A steeper ramp lets the gel ooze in and fill. Word Gel is on the cup and the hopper.
- [x] **RF 1.0.2 L5 Pick the Path:** Grains cup on the left, water cup on the right, a wall between them. Grains and Water buttons, one pour at a time. Grains fill on a hill. Water fills only when the ramp meets the lip.
- [x] **RF 1.0.2 Stars and session cup row:** A full cup with no spill gets 3 stars, a small spill gets 2, a bigger spill still gets 1. Stars sit on the cup and on the session cup pictures. The row height stays put.
- [x] **RF 1.0.2 Cup Stack** side tile: tap the dotted cups and 3 snap into a stack. A far tap tips the cup calmly. Retry clears the stack at once. A standing stack catches a slow pour of grains.
