# Bertopia 2.5.95 proof

2.5.94 is the parallel Box/Oven lane and was not on main. This cut is 2.5.95.

Live on blocks-test `?q=lite&smoke=1`, PC mouse, 1366×768. Version plate 2.5.95. What's new: "The Oven fire is big and lively, and new things you craft go where you can find them." 0 page errors, 0 console errors, 0 missing-string warnings.

1. A burning Oven: the fire beside Fuel is its own element, class `flame-side lit burn`. DOM box is 48×56 (at least 32 tall). Computed height 56px while the burn bar is 100%. Animation name is `bt-flicker`. See [oven-flame.png](oven-flame.png).
2. About 2 seconds later the same fire is still burning and still at least 32 tall, and it shrank: bar 20%, computed height 36.8px, box 37px.
3. An Oven with no fuel: class `flame-side out`, flame fill `rgb(107, 114, 128)` (grey), animation `none`. See [oven-out.png](oven-out.png).
4. Hotbar full (9 different items). Craft an Oven next to a Workbench. It lands in pocket slot 9. Toast: "Oven is in your Bag pockets" with a Hold this button. See [craft-pocket.png](craft-pocket.png). Hold this swaps it onto hotbar slot 1 (the selected slot). See [craft-held.png](craft-held.png).
5. Mid-play rotate 915×412, then 412×915, then back to 915×412. Console stayed empty. See [landscape-915x412.png](landscape-915x412.png), [portrait-412x915.png](portrait-412x915.png), [rotate-back-915x412.png](rotate-back-915x412.png).
