# Bertopia 2.5.96 proof

2.5.94 was still free, but 2.5.95 landed on main while this was in progress (bigger Oven fire, crafts land where you can find them). This cut is the next free number, 2.5.96, and it keeps that fire and that landing.

Live on blocks-test `?q=lite&smoke=1`, PC mouse, 1366×768. Version plate 2.5.96. What's new: "The Oven works like the Box, its first click always counts, and you can find the Cupcake recipe." 0 page errors, 0 console errors, 0 missing-string warnings.

Cupcake was hidden because it is the only ungated recipe with 3 ingredient types. Crafting only keeps a recipe in Almost when 2 or fewer ingredients are missing, so Cupcake sat in the rest list (easy to miss even with Show all). It now stays in Almost, with the full need line and the Oven. Other recipes stay in the same groups.

1. Oven just opened. Click Planks in the bag, then Fuel, on the first try: Fuel loads Planks 1, bag planks 4 → 3, status "Add something to bake." No picker. See [oven-fuel-loaded.png](oven-fuel-loaded.png).
2. Click Dirt, then Input: "The Oven cannot bake Dirt." Dirt stays picked. Input stays empty. See [oven-reject.png](oven-reject.png).
3. Click Sand, then Input: Input loads Sand 2 and baking starts. Bag sand 4 → 2. See [oven-loaded.png](oven-loaded.png).
4. A fresh empty Oven, empty-hand click on Fuel: picker opens, status "Pick a fuel", and the only choice is Planks (not Sand or Dirt). See [oven-picker.png](oven-picker.png).
5. Sand into Input with no fuel: Input loads, status "Add fuel."
6. Crafting lists Cupcake under Almost, without Show all: "need 1 Flour (Workbench), 1 Sugar (Reed), 2 Berries (Leaves) · Oven". See [craft-cupcake.png](craft-cupcake.png).
7. Mid-play rotate 915×412, then 412×915, then back to 915×412. Crafting stayed open. Console stayed empty. See [landscape-915x412.png](landscape-915x412.png), [portrait-412x915.png](portrait-412x915.png), [rotate-back-915x412.png](rotate-back-915x412.png).
