# Bertopia 2.5.101 proof

What's new: Slots, buttons and text are the same size everywhere and fit every screen.

Fresh Survival, lite, real input. Bag, Crafting, and Box. Console 0 errors.

| view | slot | panel | hotbar | notes |
|---|---|---|---|---|
| 1366×768 | 56 | 896 | 56 | no font under 12px, 0 pressables under 44px, no page scroll |
| 1920×1080 | 64 | 1024 | 64 | same |
| 915×412 touch | 48 | 768 | 524 wide, slots 48 | Crafting scrolls to Wood Tool, Fill / Make / ×Max stay on screen |
| 412×915 touch | 48 | 396 | 7 slots + Bag at 44 | strip is 332px so slots 8–9 swipe; the 7 and the Bag all receive the tap |
| 1366 at 125% (CSS viewport 1093×614) | 48 | 768 | 48 | vmin shrinks with the CSS viewport |

Slots use `--ks-slot` from shared/kulibert-scale.css. The Box short-screen rule points at that token too.
