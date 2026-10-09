# Bertopia 2.5.99 — shared slots on the Box

What's new: Boxes use the new shared slots: click, Shift-click and drag all work the same way.

`shared/kulibert-slots.js` is a plain IIFE (`window.KulibertSlots`). The Box grid and the Bag strip in the Box panel are the first callers. Bag, Oven, and Crafting panels are unchanged. `putInSlots` lives on `KulibertSlots.util`; `box.js` re-exports it.

## Proof (blocks-test, PC mouse 1366, real pointer and touch)

| Check | Result |
|---|---|
| Click Bag → Box merges to 64 (40 + 30, 6 stay in the Bag) | pass |
| Shift-click Bag → Box and Box → Bag | pass |
| Drag both ways | pass |
| Swap two different items | pass |
| `ks-pick` ring, aria-pressed, 56 px slots | pass |
| Esc unpicks and the panel stays open | pass |
| Close with a pick held, counts unchanged | pass |
| Break a full Box: 960 stone into the Bag, 192 stone drops, the Box drops | pass |
| Save, reload, wheat 11 and glass 8 kept | pass |
| Rotate mid-pick 915×412 ↔ 412×915, pick stays, slots stay 56 px | pass |
| Touch tap-tap and drag at 915×412 | pass |
| Touch tap-tap and drag at 412×915 | pass |
| Console errors / missing strings | 0 |

Screenshot: [pick.png](pick.png) (Planks 40 picked, cyan `ks-pick` ring). Short layout: [layout.png](layout.png).
