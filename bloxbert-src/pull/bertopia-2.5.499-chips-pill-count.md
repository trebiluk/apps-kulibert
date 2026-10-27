# BUILD PASTE: Bertopia 2.5.499, chips + update pill + held count (3 items)

Bertopia, `bloxbert-src`, live 2.5.496 VERSION LOCKED: 2.5.499 (2.5.497 classnet, 2.5.498 berry badge ship first). Files: unknown exact lines, Debugzy/Build to locate by selector: main.js, read.css, index.html. Pull first, no force-push. Match by selector or function name.
Source proof: /workspace/proof/bertopia-2.5.496/RESULT.md (412x915, Oct 27 6:00 AM ET).

## Fix 1 (P1): top chips overlap on a phone
Seen: reload at 412x915, top chips stack on top of each other under the top bar (shot "chip overlap" in RESULT.md).
Change: every top status chip (goal, safe-zone, saved, earn, inspect, boss bar) sits in the one `#chip-lane` and is placed only by `layoutLane()`. Remove any leftover `position/top/left/right/transform/z-index` on those chips outside the lane. Cap 3 visible under 520 wide or tall, else 4; extras wait, never overlap.
Done: at 412x915, 915x412 and 1366x768, no two chips touch each other, the top bar, Menu, pause or full-screen buttons.

## Fix 2 (P1): update pill sits mid-screen
Seen: the "Actualización lista" (Update ready) pill floats in the middle of the world view, covering play.
Change: `#update-chip` lives in `#chip-lane` at the lowest priority (last), same size rule as other chips (text 14px+, tap 44x44+, 4.5:1 contrast, icon + word). When Menu/sheet is open it docks above the hotbar, never mid-screen.
Done: pill is in the lane row (or above the hotbar with Menu open) at all three sizes, never over the crosshair or center of the screen.

## Fix 3 (P2): held card shows name only, no count
Seen: holding a stack shows "Césped" with no "× count" (2.5.488 promised name × count).
Change: held card text = `<item name> × <count>` whenever count > 1, in every mode (creative and survival), in the player's language. Count 1 shows the name only.
Done: hold 12 grass, card says "Grass × 12" (es: "Césped × 12"); drop to 1, says "Grass".

## Version + What's new
Bump to the next 2.5.x. What's new line (plain, translated through the strings file): "Top messages line up and don't cover each other. The update note moved to the top row. Your held item shows how many you have."

## Out of scope
No change to chip colors, fonts, hotbar layout, chat, class server, drones, doors or badges. Don't touch save format or server code.

## DONE / NOT DONE rules
Say DONE only if you can see it working live at apps.kulibert.net/blocks/ with the new version chip. Never fake a DONE. If a check can't run (sideways phone), say NOT DONE: BLOCKED-rig for that check only.

## Proof list (StudentTester)
1. 412x915 reload: chips in one row, no overlap. Screenshot.
2. 915x412 with a mid-play rotate: same, nothing cut off. Screenshot.
3. 1366x768: update pill in the lane, not mid-screen. Screenshot.
4. Hold a stack: "name × count" in English and Spanish. Screenshot.
5. Help/What's new shows the new line, translated. Console has 0 errors.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
