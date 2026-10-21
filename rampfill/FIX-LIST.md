# Ramp & Fill FIX-LIST
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
