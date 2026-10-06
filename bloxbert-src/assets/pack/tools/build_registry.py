#!/usr/bin/env python3
"""Builds blocks/docs/wiki/REGISTRY.json: THE single source of truth for names, descriptions, verbs, recipes, stages,
asset ids, fact chips and Bertodex ids. The game (src/data/registry.js, generated) and the Bertodex both read it.
Sources: registry_src.py (pack), GM-ANSWERS-2026-10-06 (wins), ORE-TABLE, ELEMENT-ECONOMY, WORLD-1/2, STORAGE-SPEC,
basics-1/2/3 briefs, live bloxbert-src/src/data/recipes.js (2.5.42). Text status: draft until Curriculum Bot checks."""
import os, sys, json, csv
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE); sys.path.insert(0, HERE)
import registry_src as R, planned
OUT = sys.argv[1] if len(sys.argv) > 1 else f'{ROOT}/REGISTRY.json'
manifest_ids = {r['id'] for r in csv.DictReader(open(f'{ROOT}/MANIFEST.csv'))}
# ---- recipes: (out, n, station, [(in, n)], secs, gate, source)
W, O, S, F, FAB, H = 'workbench', 'oven', 'smelter', 'forge', 'fabricator', 'hand'
RECIPES = [
 ('planks', 4, H, [('log', 1)], 0, None, 'live'), ('workbench', 1, H, [('planks', 4)], 2, None, 'live'), ('ice', 1, H, [('snow', 4)], 0, None, 'live'),
 ('oven', 1, W, [('stone', 8)], 10, None, 'live'), ('brickGrey', 2, W, [('stone', 2)], 2, None, 'live'), ('vend', 1, W, [('planks', 6), ('glass', 1)], 10, None, 'live'),
 ('bunk', 1, W, [('planks', 3), ('woolBlue', 3)], 5, None, 'live'), ('box', 1, W, [('planks', 8)], 4, None, 'live'), ('door', 1, W, [('planks', 6)], 3, None, 'live'),
 ('glass', 1, O, [('sand', 2)], 5, None, 'live'), ('brickRed', 1, O, [('redSand', 2)], 5, None, 'live'), ('cupcake', 2, O, [('flour', 1), ('sugar', 1), ('berry', 2)], 10, None, 'live'),
 ('bread', 1, O, [('flour', 2)], 8, None, 'live'),
 ('stick', 4, W, [('planks', 2)], 1, None, 'GM-ANSWERS §5'), ('woodTool', 1, W, [('planks', 3), ('stick', 2)], 2, None, 'GM-ANSWERS §5 (live 2.5.42 = 5 Planks; migration keeps owned picks)'),
 ('stoneTool', 1, W, [('stone', 3), ('stick', 2)], 4, None, 'GM-ANSWERS §5 (live = 3 Stone + 2 Planks)'),
 ('copperPick', 1, F, [('copperIngot', 3), ('stick', 2)], 4, 'T4', 'GM-ANSWERS §5'), ('steelPick', 1, F, [('steel', 3), ('stick', 2)], 4, 'T4', 'GM-ANSWERS §5'),
 ('pan', 1, W, [('planks', 3)], 2, None, 'GM-ANSWERS §5 / ORE-TABLE'), ('carvingTool', 1, W, [('stick', 2), ('stone', 1)], 2, None, 'GM-ANSWERS 2026-10-06 (final: no Iron Nugget)'), ('bucket', 1, F, [('ironIngot', 3)], 4, 'T4', 'GM-ANSWERS §5'),
 ('smelter', 1, W, [('brickRed|brickGrey', 8), ('ironOre', 1), ('coal', 1)], 10, 'T4', 'GM-ANSWERS §5 (brick colour: open question)'),
 ('fabricator', 1, F, [('steel', 4), ('copperWire', 2), ('glass', 1), ('batteryCell', 1)], 10, 'T5', 'GM-ANSWERS §5; bootstrap = one-time Starter Kit (1 Battery Cell + 1 Charger to Overflow Box on first Fabricator placed, once per player per world)'),
 ('blueWhiteLights', 1, W, [('stringLights', 1), ('paintDab', 1)], 2, None, 'FUN-ITEMS §7 (Blue Dye → Paint Dab)'), ('wovenMat', 1, W, [('wheat', 3)], 2, None, 'FUN-ITEMS §7 (Grass Fiber → Wheat)'),
 ('harvestBasket', 1, W, [('wheat', 2), ('corn', 1)], 2, None, 'FUN-ITEMS §7 (Grass Fiber → Wheat)'), ('redLantern', 1, W, [('cloth', 1), ('paintDab', 1), ('glowStrip', 1)], 2, None, 'FUN-ITEMS §7 (Paper → Cloth, Red Dye → Paint Dab, LED → Glow Strip)'),
 ('paperDragon', 1, W, [('cloth', 3), ('paintDab', 1)], 2, None, 'FUN-ITEMS §7 (Paper → Cloth, Dye → Paint Dab)'), ('fanousLantern', 1, W, [('glass', 1), ('copperWire', 1), ('glowStrip', 1)], 2, None, 'FUN-ITEMS §7 (LED → Glow Strip)'),
 ('colourSplash', 1, W, [('stone|planks', 1), ('paintDab', 1)], 1, None, 'FUN-ITEMS §7 (Dye → Paint Dab)'), ('springGreens', 1, W, [('clay', 1), ('wheat', 1)], 2, None, 'FUN-ITEMS §7 (Clay Dish → Clay, Seeds → Wheat)'),
 ('kindnessHeart', 1, W, [('cloth', 1), ('paintDab', 1)], 1, None, 'FUN-ITEMS §7 (Paper → Cloth, Dye → Paint Dab)'), ('solarFlower', 1, W, [('flower', 1), ('solarPanel', 1)], 2, None, 'FUN-ITEMS §7 (Solar Cell → Solar Panel)'),
 ('imigongoTile', 1, W, [('clay', 1), ('paintDab', 1)], 2, None, 'FUN-ITEMS §7 (Dye → Paint Dab)'), ('petrykivkaTile', 1, W, [('planks', 1), ('paintDab', 1)], 2, None, 'FUN-ITEMS §7 (Dye → Paint Dab)'),
 ('mesobBasket', 1, W, [('wheat', 3)], 2, None, 'FUN-ITEMS §7 (Grass Fiber → Wheat)'), ('papelPicado', 1, W, [('cloth', 2), ('cotton', 1)], 2, None, 'FUN-ITEMS §7 (Paper → Cloth, String → Cotton)'),
 ('ironIngot', 1, S, [('ironOre', 1)], 4, 'T4', 'GM §5'), ('copperIngot', 1, S, [('rawCopper', 1)], 4, 'T4', 'GM §5'), ('zincIngot', 1, S, [('zincOre', 1)], 4, 'T4', 'GM §5'),
 ('tinIngot', 1, S, [('tinOre', 1)], 4, 'T4', 'GM §5'), ('silverIngot', 1, S, [('silverOre', 1)], 4, 'T4', 'GM §5'), ('goldIngot', 1, S, [('goldNugget', 1)], 4, 'T4', 'GM §5'),
 ('alumina', 1, S, [('bauxite', 1)], 4, 'T4', 'GM §5'), ('titaniumDioxide', 1, S, [('blackSand|ilmeniteOre', 1)], 4, 'T4', 'GM §5'),
 ('silicon', 1, S, [('quartz', 1), ('coal', 1)], 4, 'T5', 'GM §4'), ('platinumIngot', 1, S, [('platinumNugget', 1)], 4, 'embercore', 'GM §5'),
 ('steel', 1, F, [('ironIngot', 1), ('coal', 1)], 4, 'T4', 'GM §5'), ('bronzeIngot', 9, F, [('copperIngot', 8), ('tinIngot', 1)], 4, 'T4', 'GM §5'),
 ('copperWire', 4, F, [('copperIngot', 1)], 2, 'T4', 'GM §5'), ('glassVial', 2, F, [('glass', 1)], 2, 'T4', 'GM §5'), ('wireRope', 2, F, [('ironIngot', 1)], 2, 'T4', 'GM §5'),
 ('spring', 2, F, [('steel', 1)], 2, 'T4', 'GM §5'),
 ('batteryCell', 2, FAB, [('copperIngot', 1), ('zincIngot', 1)], 3, 'T5', 'GM §5 (1 charge)'), ('logicChip', 2, FAB, [('silicon', 1), ('copperWire', 2)], 3, 'T5', 'GM §5'),
 ('solarPanel', 1, FAB, [('glass', 2), ('silicon', 1), ('copperWire', 1)], 4, 'T5', 'GM §5'), ('charger', 1, FAB, [('steel', 1), ('copperWire', 1)], 3, 'T5', 'GM §5'),
 ('glowStrip', 1, FAB, [('glass', 1), ('copperWire', 1)], 2, 'T5', 'GM §5'), ('lantern', 1, FAB, [('glass', 1), ('steel', 1), ('batteryCell', 1)], 3, 'T5', 'GM §5'),
 ('doorSliding', 1, FAB, [('glass', 4), ('steel', 2), ('copperWire', 1)], 4, 'T5', 'basics-1 1d + GM §5'), ('aluminumIngot', 1, FAB, [('alumina', 1)], 4, 'T5', 'GM §5 (+4 charge)'),
 ('doorGlass', 1, W, [('glass', 4), ('planks', 2)], 3, None, 'basics-1 1a'), ('lever', 1, W, [('stick', 1), ('stone', 1)], 1, 'T2', 'basics-1 1b'), ('pushButton', 1, W, [('planks', 1)], 1, 'T1', 'basics-1 1b'),
 ('doorMetal', 1, F, [('steel', 6)], 4, 'T4', 'basics-1 brief 1c (6 Steel, T4); GM to confirm'),
 ('paintDab', 2, W, [('berry', 1)], 0, None, 'GM §1'), ('paintDab', 2, W, [('flower', 1)], 0, None, 'GM §1 (world-2)'),
 ('bioplastic', 1, O, [('corn', 2)], 5, None, 'GM §3'), ('plasticTube', 2, W, [('bioplastic', 1)], 1, None, 'GM §3'),
 ('copperDust', 2, W, [('rawCopper', 1)], 1, None, 'basics-2'), ('glowMix', 1, W, [('glowMoss', 1), ('copperDust', 1)], 1, None, 'basics-2 / GM §3'),
 ('glowMix', 1, W, [('glowMoss', 2)], 1, None, 'GM §3 (works with zero ores)'), ('boosterDye', 1, W, [('glowMoss', 1), ('paintDab', 1)], 1, None, 'basics-2 + GM §1'),
 ('glowPebble', 8, W, [('glowMoss', 1)], 0, None, 'basics-2'), ('glowStick', 4, W, [('plasticTube', 1), ('glowMix', 1)], 1, None, 'basics-2'),
 ('jumboGlow', 2, W, [('plasticTube', 1), ('glowMix', 2), ('boosterDye', 1)], 2, None, 'GM §2'), ('coldGlowVial', 1, W, [('glassVial', 1), ('glowMix', 3), ('ice', 1)], 2, 'world-2', 'basics-2 + WORLD-2 §4'),
 ('frostVial', 1, W, [('glassVial', 1), ('ice', 1)], 1, 'world-2', 'WORLD-2 §4'), ('saltPan', 1, W, [('planks', 4), ('glass', 1)], 3, 'world-2', 'WORLD-2 §5'),
 ('goldNugget', 1, H, [('goldFlake', 9)], 0, 'world-1', 'WORLD-1 (9 Flakes → Nugget)'),
 ('wallShelf', 1, W, [('planks', 2)], 2, None, 'STORAGE-SPEC §1'), ('shelf', 1, W, [('planks', 3)], 2, None, 'STORAGE-SPEC §1'), ('sideTable', 1, W, [('planks', 3)], 2, None, 'STORAGE-SPEC §1'),
 ('desk', 1, W, [('planks', 5), ('steel', 1)], 3, None, 'STORAGE-SPEC §1'), ('cabinet', 1, W, [('planks', 6), ('steel', 1)], 3, None, 'STORAGE-SPEC §1'),
 ('glassCabinet', 1, W, [('cabinet', 1), ('glass', 1)], 2, None, 'STORAGE-SPEC §1'), ('steelLocker', 1, F, [('steel', 6), ('box', 1)], 4, 'T4', 'STORAGE-SPEC §1'),
 ('satchel', 1, W, [('cloth', 3)], 2, None, 'STORAGE-SPEC §1'), ('backpack', 1, W, [('cloth', 6), ('steel', 1)], 3, None, 'STORAGE-SPEC §1'),
 ('expeditionPack', 1, W, [('cloth', 8), ('steel', 2), ('box', 1)], 4, None, 'STORAGE-SPEC §1'), ('paintBrush', 1, W, [('planks', 1), ('cloth', 1)], 1, None, 'STORAGE-SPEC §1'),
 ('cloth', 1, W, [('cotton', 3)], 1, None, 'storage-1'),
 ('itemTube', 4, W, [('glass', 1), ('copperWire', 1)], 2, None, 'STORAGE-SPEC §2'), ('extractor', 1, W, [('steel', 1), ('copperWire', 1), ('plasticTube', 1)], 2, None, 'STORAGE-SPEC §2'),
 ('poweredTube', 1, W, [('itemTube', 1), ('copperWire', 1)], 1, None, 'STORAGE-SPEC §2'), ('filterTube', 1, W, [('itemTube', 1), ('steel', 1)], 1, None, 'STORAGE-SPEC §2'),
 ('sorter', 1, W, [('steel', 2), ('copperWire', 1), ('glass', 1)], 2, None, 'STORAGE-SPEC §2'), ('batteryBox', 1, FAB, [('batteryCell', 4), ('steel', 1)], 3, 'T5', 'STORAGE-SPEC energy'),
 ('networkCable', 8, FAB, [('copperWire', 1), ('plasticTube', 1)], 2, 'T5', 'STORAGE-SPEC §3'), ('networkCore', 1, FAB, [('steel', 4), ('glass', 2), ('copperWire', 2), ('batteryCell', 2)], 5, 'T5', 'STORAGE-SPEC §3'),
 ('driveBay', 1, FAB, [('steel', 4), ('copperWire', 1)], 3, 'T5', 'STORAGE-SPEC §3'), ('driveS', 1, FAB, [('steel', 1), ('glass', 1), ('copperWire', 1)], 2, 'T5', 'STORAGE-SPEC §3'),
 ('driveM', 1, FAB, [('driveS', 2), ('silicon', 1)], 3, 'T5', 'STORAGE-SPEC §3'), ('driveL', 1, FAB, [('driveM', 2), ('silicon', 2), ('batteryCell', 1)], 4, 'T5', 'STORAGE-SPEC §3'),
 ('storageLink', 1, FAB, [('copperWire', 1), ('steel', 1)], 2, 'T5', 'STORAGE-SPEC §3'), ('terminal', 1, FAB, [('glass', 2), ('steel', 1), ('copperWire', 1)], 3, 'T5', 'STORAGE-SPEC §3'),
 ('teleportPad', 2, FAB, [('steel', 2), ('copperWire', 2), ('glass', 1), ('batteryCell', 1)], 5, 'T5', 'STORAGE-SPEC §4 (pre-paired pair)'),
 ('deliveryDrone', 1, FAB, [('steel', 2), ('copperWire', 4), ('batteryCell', 2), ('glass', 1), ('plasticTube', 4)], 6, 'T5', 'STORAGE-SPEC §4'),
 ('droneDock', 1, W, [('charger', 1), ('planks', 2)], 2, 'T5', 'STORAGE-SPEC §4'),
 ('bounceBlock', 2, W, [('steel', 1), ('planks', 2), ('cloth', 1)], 2, None, 'fun-1'), ('discoFloor', 4, FAB, [('glass', 2), ('copperWire', 1), ('glowMix', 1)], 3, None, 'fun-1'),
]
VERBS_BY = {  # CORE-MECHANICS §0.2; default for plain cubes = Mine, Place
 'door': 'Place,Open', 'doorGlass': 'Place,Open', 'doorMetal': 'Place,Connect', 'doorSliding': 'Place,Open,Connect', 'workshopDoor': 'Open',
 'lever': 'Place,Use,Connect', 'pushButton': 'Place,Use,Connect', 'lantern': 'Place,Use', 'charger': 'Place,Connect,Open', 'solarPanel': 'Place,Connect,Open',
 'glowStrip': 'Place,Connect,Open', 'batteryBox': 'Place,Connect,Open', 'copperWireBlock': 'Place,Connect',
 'glowPebble': 'Craft,Place,Use', 'glowStick': 'Craft,Place,Use', 'jumboGlow': 'Craft,Place,Use', 'coldGlowVial': 'Craft,Place,Use',
 'workbench': 'Place,Open,Craft', 'oven': 'Place,Open,Craft', 'smelter': 'Place,Open,Craft,Move-item', 'fabricator': 'Place,Open,Craft,Connect',
 'labBench': 'Place,Open,Craft', 'draftingTable': 'Place,Open', 'cleanBench': 'Place,Open,Craft', 'vend': 'Place,Open,Move-item', 'storeCounter': 'Open',
 'bunk': 'Place,Use', 'sleepingBag': 'Place,Use', 'crewBanner': 'Place,Use', 'warpPad': 'Place,Use', 'gameZoneFlag': 'Place,Open,Use',
 'itemTube': 'Place,Connect', 'poweredTube': 'Place,Connect', 'filterTube': 'Place,Connect,Open', 'extractor': 'Place,Open', 'sorter': 'Place,Open',
 'networkCable': 'Place,Connect', 'storageLink': 'Place,Connect', 'networkCore': 'Place,Open', 'driveBay': 'Place,Open,Move-item', 'terminal': 'Open,Move-item,Use',
 'teleportPad': 'Place,Pair,Move-item,Open', 'droneDock': 'Place,Pair,Use,Open', 'networkPad': 'Place,Pair,Move-item', 'saltPan': 'Place,Open',
 'bounceBlock': 'Place,Move', 'discoFloor': 'Place,Open', 'noteBlock': 'Place,Use,Connect', 'keyboardBlock': 'Place,Open', 'drumKit': 'Place,Open', 'guitar': 'Place,Open',
 'jukebox': 'Place,Open,Move-item', 'chair': 'Place,Use (sit; Move = stand)', 'stool': 'Place,Use (sit; Move = stand)', 'bench': 'Place,Use (sit; Move = stand)', 'table': 'Place,Paint',
 'carvedPumpkin': 'Place,Use', 'pumpkin': 'Place,Use (with Carving Scoop → carve panel)', 'winterLights': 'Place,Connect,Open (Steady/Slow twinkle)', 'stringLights': 'Place,Connect',
 'water': 'Move (swim),Use (Bucket)', 'seaWater': 'Move (swim),Use (Bucket)', 'coreplate': '(none)', 'molten': 'Move (bounce back)',
 'woodTool': 'Mine (held)', 'stoneTool': 'Mine (held)', 'copperPick': 'Mine (held)', 'steelPick': 'Mine (held)', 'pan': 'Use (on river gravel)', 'bucket': 'Use (on water)',
 'waterBucket': 'Use (place water)', 'paintBrush': 'Paint', 'fob': 'Pair', 'botH1': 'Craft,Place,Pair,Open', 'carvingTool': 'Use (on a Pumpkin)',
 'satchel': 'Move-item (wear)', 'backpack': 'Move-item (wear)', 'expeditionPack': 'Move-item (wear)', 'gravityHat': 'Move-item (wear),Use', 'petRock': 'Place,Use,Open',
 'driveS': 'Move-item,Open', 'driveM': 'Move-item,Open', 'driveL': 'Move-item,Open', 'deliveryDrone': 'Pair,Use,Open', 'musicDisc': 'Move-item',
}
FACTS = {  # real-science fact chips (DRAFT: Curriculum Bot checks before ship)
 'coal': 'Coal is a rock rich in carbon. Some coal is over 300 million years old. Some is much younger.', 'ironOre': 'Iron is the most-used metal on Earth. Steel is mostly iron.',
 'copperOre': 'Electricity flows through copper easily. That is why wires use it.', 'zincOre': 'Zinc coating (galvanizing) keeps steel from rusting.',
 'tinOre': 'Bronze is copper plus tin. A whole time in history is named after it: the Bronze Age.', 'quartzOre': 'Quartz is silicon + oxygen (SiO2). Most sand is quartz.',
 'silverOre': 'Silver carries electricity best of all metals. Copper is close, and it costs much less.', 'goldOre': 'Gold never rusts, so very old gold objects still shine.',
 'glowMoss': 'Some real fungi make their own light. People call it foxfire. Scientists call it bioluminescence (living light).', 'clay': 'Clay is made of tiny flat mineral grains. Fired clay becomes brick.',
 'water': 'Water is H2O: two hydrogen atoms and one oxygen atom.', 'sand': 'Glass makers melt sand with soda ash and limestone at about 1,500 °C.',
 'glass': 'Glass is a solid, but its atoms are jumbled. They are not lined up in a neat crystal pattern.', 'snow': 'Snow crystals have six sides or six arms. That comes from how water molecules link up. Most real snowflakes are lopsided.',
 'ice': 'Ice floats because water expands when it freezes.', 'saltCrust': 'Table salt is sodium chloride (NaCl).', 'blackSand': 'Many black sands get their color from heavy minerals like magnetite and ilmenite.',
 'bauxite': 'Almost all aluminum comes from bauxite.', 'ilmeniteOre': 'Ilmenite is the main ore of titanium.', 'platinumOre': 'Platinum is used in car parts that clean exhaust.',
 'basalt': 'Most of the ocean floor is basalt.', 'granite': 'Granite cooled slowly underground, so its crystals grew big enough to see.', 'graphiteOre': 'Pencil "lead" is really graphite mixed with clay.',
 'boundaryClay': 'Earth has a thin clay layer found all over the world. It is rich in iridium. That is a clue that a giant asteroid hit Earth about 66 million years ago.',
 'steel': 'Steel is iron with a small amount of carbon, which makes it much stronger.', 'bronzeIngot': 'Bronze is about 90% copper and 10% tin.',
 'batteryCell': 'A battery stores energy in chemicals. When you use it, the chemicals make power.', 'solarPanel': 'Most solar cells are made from silicon.', 'silicon': 'Computer chips are made from silicon.',
 'logicChip': 'A chip holds millions or billions of tiny switches called transistors.', 'copperWire': 'Almost every building has copper wires inside. They carry power to lights and plugs.',
 'bioplastic': 'Some plastics are made from corn starch instead of oil.', 'paintDab': 'Pigments give paint its color. Early paints used colored earth, charcoal and plants.',
 'glowStick': 'A glow stick glows when two chemicals mix: chemiluminescence.', 'coldGlowVial': 'Cold slows chemical reactions, so a cold glow stick lasts longer.',
 'leaves': 'Leaves use sunlight, water and carbon dioxide to make sugar (photosynthesis).', 'log': 'Where winters are cold, a tree adds one ring each year. Count the rings to find its age.',
 'itemTube': 'Factories use conveyors to move goods from step to step.', 'terminal': 'A search engine finds things by looking through an index.', 'sorter': 'Recycling centers sort materials by type.',
 'charger': 'A wall outlet in the U.S. gives about 120 volts.', 'lantern': 'LEDs use much less energy than old light bulbs.',
 'teleportPad': 'Real teleporting is not possible. Scientists can only send tiny bits of data from one particle to another.',
 'deliveryDrone': 'Delivery drones balance speed, battery life and how much they carry.', 'bounceBlock': 'A spring stores energy when squashed and gives it back.',
 'noteBlock': 'A higher pitch means the sound wave vibrates faster.', 'pumpkin': 'Pumpkins are fruit, because they hold seeds.', 'flower': 'Bees carry pollen from flower to flower.',
 'corn': 'Corn is a grass. Each kernel is a seed.', 'cotton': 'Cotton fibers grow around the seeds of the cotton plant.', 'goldFlake': 'Gold is very heavy for its size. So it sinks to the bottom of a pan.',
 'pan': 'Gold is much heavier than sand of the same size. In a swirling pan, gold sinks and water washes the sand away.', 'hayBale': 'Hay is grass that is cut and dried so animals can eat it in winter.',
 'gourds': 'Gourds have hard shells and were used as bowls and bottles long ago.', 'scarecrow': None,  # Curriculum 2026-10-06: UNSURE, dropped until sourced

 'batsDeco': 'One bat can eat hundreds of insects in one night.', 'winterLights': 'LED string lights use far less power than old bulbs.',
}
EFFECTS = [  # EFFECTS-SPEC
 ('warp', 'Warp', 'Takes you to your own Warp Pad.', 'warpKey', 'effects-1'), ('heal', 'Heal', 'Fixes hearts when Damage is on.', 'bandage', 'effects-1'),
 ('summon', 'Spawn and Summon', 'Calls your Pet Rock or Bot, or lets friendly critters out.', 'whistleBell', 'effects-1'), ('morph', 'Morph', 'Look like a block or critter for a while.', 'morphVial', 'effects-1'),
 ('camo', 'Camo', 'Blend into the background.', 'camoCloak', 'effects-1'), ('hideSeek', 'Hide-and-Seek', 'A game mode that uses Morph, Camo and Tag.', None, 'effects-1'),
 ('wonderLab', 'Wonder Lab', 'Science that looks like magic: magnets, light, foam, frost and sparks.', 'magnetWand', 'effects-1'), ('float', 'Float', 'Float gently for 10 seconds.', 'gravityHat', 'fun-1'),
]
BIOME_DESC = {'commons': 'Grass, oak trees and the town. Coal, clay, iron and a little copper.', 'glasswood': 'Pale granite hills with quartz crystals. Look for tin and gold veins.',
 'rustflats': 'A flat dry lake bed with white salt crust. Iron, silver and zinc in the hills.', 'tidewell': 'Beaches, cliffs and the sea. Black sand and the Salt Pan.',
 'frostspire': 'Snowy mountains and frozen lakes. Look for ice and tin.', 'emberdeep': 'Dark basalt hills. Copper at the edges, platinum deep down.',
 'sea': 'Still seawater at the edge of Tidewell.', 'town': 'Bertyville: the store, the stations and everyone\'s plots.'}
PILE_CULTURE = [  # FUN-ITEMS §7 + CURRICULUM-PILE-CULTURE-ITEMS-CHECK: object names, never a holiday; art PLANNED (planned.py)
 (172,'blueWhiteLights','Blue & White Lights','A plain string of blue and soft-white LED bulbs.','Winter','Blue and white lights are hung for Hanukkah in many Jewish homes.'),
 (173,'wovenMat','Woven Mat','A flat mat woven in red, black and green.','Autumn','Woven mats (mkeka) are laid out for Kwanzaa in many African American homes.'),
 (174,'harvestBasket','Harvest Basket','A basket of fruit and corn.','Autumn','Fruit and corn are set out for Kwanzaa and at many harvest festivals.'),
 (175,'redLantern','Red Lantern','A round red paper lantern with a steady LED glow.','Winter','Red paper lanterns are hung for Lunar New Year in many East Asian homes.'),
 (176,'paperDragon','Paper Dragon','A long, friendly paper dragon with a steady LED glow.','Winter','Paper dragons are carried in Lunar New Year parades.'),
 (177,'fanousLantern','Fanous Lantern','A metal-and-glass lantern with geometric windows and an LED glow.','Winter','Fanous lanterns light streets during Ramadan in Egypt and nearby countries.'),
 (178,'colourSplash','Color Splash Block','A block covered in bright paint splats.','Spring','People throw colored powder at Holi, a spring festival from India.'),
 (179,'springGreens','Spring Greens','A dish of sprouted green grass.','Spring','Sprouted greens (sabzeh) are grown for Nowruz, the new year in Afghanistan, Iran and nearby countries.'),
 (180,'kindnessHeart','Kindness Heart','A paper heart with flowers on it.','Spring','Hearts are shared during Kindness Week.'),
 (181,'solarFlower','Solar Flower','A flower that charges by day and glows softly at night.','Spring','Solar Flowers celebrate Earth Day and clean energy.'),
 (182,'imigongoTile','Imigongo Zigzag Tile','A tile with black, white and red zigzags.','Autumn','Imigongo is zigzag art from eastern Rwanda.'),
 (183,'petrykivkaTile','Petrykivka Flower Tile','A tile painted with bright flower sprays.','Spring','Petrykivka is a Ukrainian folk style of flower painting.'),
 (184,'mesobBasket','Mesob Basket','A tall woven basket with a lid.','Autumn','A mesob is a woven table-basket from Eritrea and Ethiopia.'),
]
SORT = {'pumpkin': 'Autumn', 'cornStalks': 'Autumn', 'leafPile': 'Autumn', 'appleCrate': 'Autumn', 'hayBale': 'Autumn', 'gourds': 'Autumn', 'scarecrow': 'Autumn', 'marigold': 'Autumn', 'marigoldPatternTile': 'Autumn', 'harvestLantern': 'Autumn', 'papelPicado': 'Autumn',
        'jackOLantern': 'Spooky', 'carvedPumpkin': 'Spooky', 'ghostLight': 'Spooky', 'cobweb': 'Spooky', 'batsDeco': 'Spooky', 'spookySign': 'Spooky', 'stringLights': 'Winter'}
CHECKED = set(['grass', 'dirt', 'stone', 'slate', 'gravel', 'brickRed', 'brickGrey', 'planks', 'leaves', 'woolBlue', 'woolGreen', 'woolRed', 'woolTan', 'ice', 'redSand', 'coreplate', 'workbench', 'oven', 'vend', 'storeCounter', 'bunk', 'box', 'wheat', 'reed', 'door', 'doorOpen', 'doorGlass', 'doorGlassOpen', 'doorMetal', 'doorMetalOpen', 'doorSliding', 'doorSlidingOpen', 'lever', 'leverOn', 'pushButton', 'pushButtonOn', 'smelter', 'fabricator', 'ironOre', 'zincOre', 'lantern', 'charger', 'glowPebble', 'glowStick', 'jumboGlow', 'coldGlowVial', 'cornPlant', 'glowStrip', 'copperWireBlock', 'water', 'quartzOre', 'quartzSand', 'clay', 'pannedGravel', 'molten', 'saltCrust', 'bauxite', 'platinumOre', 'basalt', 'snowGrass', 'cottonBush', 'flowerBush', 'saltPan', 'wallShelf', 'shelf', 'sideTable', 'desk', 'cabinet', 'glassCabinet', 'steelLocker', 'sign', 'itemTube', 'poweredTube', 'filterTube', 'extractor', 'networkCable', 'networkCore', 'driveBay', 'terminal', 'storageLink', 'batteryBox', 'networkPad', 'bounceBlock', 'discoFloor', 'noteBlock', 'keyboardBlock', 'drumKit', 'guitar', 'jukebox', 'pumpkin', 'jackOLantern', 'cornStalks', 'leafPile', 'appleCrate', 'marigoldPatternTile', 'stringLights', 'labBench', 'warpPad', 'sleepingBag', 'crewBanner', 'gameZoneFlag', 'workshopDoor', 'draftingTable', 'copperBlock', 'steelBlock', 'mirror', 'dexShelf', 'trophyShelf', 'bamboo', 'plywood', 'cutStone', 'cinderBlock', 'concrete', 'roofTile', 'frostedGlass', 'glassPane', 'quartzCrystal', 'overflowBox', 'bronzePlaque', 'granite', 'redSoil', 'birchLog', 'birchLeaves', 'spruceLog', 'spruceLeaves', 'flowerBushPink', 'flowerBushYellow', 'seaWater', 'hayBale', 'gourds', 'batsDeco', 'carvedPumpkin', 'spookySign', 'harvestLantern', 'chair', 'stool', 'bench', 'table', 'winterLights', 'wreath', 'giftBox', 'snowPal', 'ornamentTile', 'stripeBlock', 'woodTool', 'stoneTool', 'copperPick', 'steelPick', 'stick', 'bucket', 'waterBucket', 'berry', 'flour', 'sugar', 'cupcake', 'bread', 'corn', 'cornSeed', 'bioplastic', 'plasticTube', 'glowMix', 'boosterDye', 'glassVial', 'rawCopper', 'copperDust', 'copperIngot', 'ironIngot', 'steel', 'zincIngot', 'tinIngot', 'bronzeIngot', 'goldNugget', 'goldIngot', 'goldLeaf', 'silicon', 'logicChip', 'spring', 'steelBeam', 'timberBeam', 'cotton', 'cottonSeed', 'salt', 'platinumGrain', 'platinumNugget', 'titaniumDioxide', 'titaniumIngot', 'graphite', 'paintBrush', 'satchel', 'backpack', 'expeditionPack', 'fob', 'botH1', 'driveS', 'driveM', 'driveL', 'deliveryDrone', 'petRock', 'gravityHat', 'musicDisc', 'warpKey', 'bandage', 'herbTonic', 'medKit', 'whistleBell', 'critterJar', 'morphVial', 'camoCloak', 'magnetWand', 'lightWand', 'fizzVial', 'frostVial', 'sparkRod', 'cogCopper', 'cogSilver', 'cogGold', 'cogPlatinum', 'flower', 'apple', 'carvingTool', 'mob:bot', 'mob:drone', 'mob:petrock', 'mob:firefly', 'mob:butterfly', 'mob:songbird', 'mob:frog', 'mob:prairiedog', 'fx:warp', 'fx:heal', 'fx:summon', 'fx:morph', 'fx:camo', 'fx:hideSeek', 'fx:wonderLab', 'fx:float'])  # CURRICULUM-WIKI-LORE-FACTCHECK-2026-10-06 §8
ORIGIN_DRAFT = set()  # all 13 origin lines checked (Curriculum §8 rule, 10:17 AM)
CHECKED |= set(['alumina', 'aluminumBeam', 'aluminumIngot', 'batteryCell', 'blackSand', 'blueprintScroll', 'boundaryClay', 'cat', 'cleanBench', 'cloth', 'coal', 'cobweb', 'cogIridium', 'copperOre', 'copperWire', 'droneDock', 'ghostLight', 'glass', 'glowMoss', 'goldFlake', 'goldOre', 'graphiteOre', 'ilmeniteOre', 'iridiumSpeck', 'log', 'marigold', 'paintDab', 'pan', 'papelPicado', 'platinumIngot', 'quartz', 'rangoliTile', 'rhodiumSpeck', 'sand', 'silverIngot', 'silverOre', 'snow', 'solarPanel', 'sorter', 'teleportPad', 'tinOre', 'tintedGlass', 'wireRope'])  # the fixed entries, checked once pasted exactly (§8)
from inside_facts import INSIDE, GM as INSIDE_GM
for _k, _v in INSIDE.items(): FACTS[f'{_k}.inside'] = _v
def dex(k): return f'dex:{k}'
def asset(kind, k):
    for cand in ([f'block:{k}', k] if kind != 'item' else [k]):
        if cand in manifest_ids: return cand
    return None
def main():
    ents = []
    for b in R.BLOCKS:
        kind = 'ore' if (b[1].endswith('Ore') or b[1] in ('coal', 'bauxite', 'blackSand', 'saltCrust', 'clay', 'boundaryClay', 'glowMoss')) else ('machine' if b[8] == 'Items & Machines' else 'block')
        f = b[4]; tex = list(f.values())[0] if isinstance(f, dict) else f
        aid = f'block:{b[1]}' if f'block:{b[1]}' in manifest_ids else (tex if tex in manifest_ids else None)
        ents.append({'id': b[0], 'key': b[1], 'type': kind, 'name': {'en': b[2]}, 'desc': b[9], 'verbs': VERBS_BY.get(b[1], 'Mine,Place').split(','),
                     'recipes': [f'r:{b[1]}'] if any(r[0] == b[1] for r in RECIPES) else [], 'stage': b[6], 'availableFrom': b[7], 'assetId': aid,
                     'fact': FACTS.get(b[1]), 'dexId': dex(b[1]), 'dexCat': b[8], 'handS': b[5], 'textStatus': 'draft-curriculum-check'})
        if b[8] == 'Seasonal & Holiday': ents[-1]['pile'] = 'seasonal'; ents[-1]['sortGroup'] = SORT.get(b[1], 'Winter')
        if b[1] == 'marigoldPatternTile': ents[-1]['artStatus'] = 'redraw: marigold flowers only, no skull shapes'
    for i, k, nm, d, grp, origin in PILE_CULTURE:
        ents.append({'id': i, 'key': k, 'type': 'block', 'name': {'en': nm}, 'desc': d, 'verbs': ['Place', 'Mine'], 'recipes': [f'r:{k}'], 'stage': 'holidays-1', 'availableFrom': None,
                     'assetId': asset('block', k), 'fact': None, 'origin': origin, 'dexId': dex(k), 'dexCat': 'Seasonal & Holiday', 'pile': 'seasonal', 'sortGroup': grp,
                     'artStatus': 'planned (Curriculum shape limits, CURRICULUM-PILE-CULTURE-ITEMS-CHECK)', 'textStatus': 'draft-curriculum-check'})
    for it in R.ITEMS:
        ents.append({'id': None, 'key': it[0], 'type': 'item', 'name': {'en': it[1]}, 'desc': it[6], 'verbs': VERBS_BY.get(it[0], 'Move-item').split(','),
                     'recipes': [f'r:{it[0]}'] if any(r[0] == it[0] for r in RECIPES) else [], 'stage': it[3], 'availableFrom': it[4], 'assetId': asset('item', it[0]),
                     'fact': FACTS.get(it[0]), 'dexId': dex(it[0]), 'dexCat': it[5], 'textStatus': 'draft-curriculum-check'})
    for s in R.SPRITES:
        ents.append({'id': None, 'key': 'mob:' + s[0], 'type': 'mob', 'name': {'en': s[1]}, 'desc': s[3], 'verbs': ['Use', 'Open'] if s[0] in ('bot', 'petrock') else ['(watch)'],
                     'recipes': [], 'stage': s[2], 'assetId': s[0], 'fact': None, 'dexId': dex('mob:' + s[0]), 'dexCat': 'Plants & Critters', 'textStatus': 'draft-curriculum-check'})
    for bk, nm, col, pat in R.BIOMES:
        ents.append({'id': None, 'key': 'biome:' + bk, 'type': 'biome', 'name': {'en': nm}, 'verbs': ['Move'], 'recipes': [], 'desc': BIOME_DESC[bk], 'stage': 'world-2' if bk not in ('commons', 'town') else 'live',
                     'assetId': 'biome:' + bk, 'fact': None, 'dexId': dex('biome:' + bk), 'dexCat': 'Places', 'textStatus': 'TODO GameMaster lore line'})
    for e in R.ELEMENTS:
        ents.append({'id': None, 'key': 'el:' + e[0], 'type': 'element', 'name': {'en': e[2]}, 'symbol': e[0], 'z': e[1], 'desc': None, 'verbs': ['Open (Wallet card)'], 'recipes': [],
                     'stage': 'world-3', 'assetId': None, 'fact': None, 'dexId': dex('el:' + e[0]), 'dexCat': 'Elements', 'textStatus': 'card text in ELEMENT-ECONOMY §4'})
    for k, nm, d, item, st in EFFECTS:
        ents.append({'id': None, 'key': 'fx:' + k, 'type': 'effect', 'name': {'en': nm}, 'desc': d, 'verbs': ['Use'], 'recipes': [], 'stage': st, 'item': item,
                     'assetId': None, 'fact': None, 'dexId': dex('fx:' + k), 'dexCat': 'Effects', 'levels': ['I', 'II', 'III'], 'textStatus': 'draft'})
    recs = []; seen = {}
    for out, n, at, ins, secs, gate, src in RECIPES:
        rid = f'r:{out}' if out not in seen else f'r:{out}#{seen[out] + 1}'; seen[out] = seen.get(out, 0) + 1
        recs.append({'id': rid, 'type': 'recipe', 'out': [out, n], 'at': at, 'in': [[a, b] for a, b in ins], 'secs': secs, 'gate': gate, 'source': src})
    dp = f'{ROOT}/dex/bertodex-en.json'; dx = json.load(open(dp))
    for i, k, nm, d, grp, origin in PILE_CULTURE: dx['entries'][k] = {'name': nm, 'cat': 'Seasonal & Holiday', 'what': d, 'origin': origin}
    json.dump(dx, open(dp, 'w'), indent=1, ensure_ascii=False)
    for e in ents:
        if e['key'] in CHECKED: e['textStatus'] = 'checked'
        if e['type'] == 'machine' and f"{e['key']}.inside" in FACTS: e['inside'] = FACTS[f"{e['key']}.inside"]; e['insideStatus'] = 'unchecked'; e['insideSource'] = 'GM CRAFTING-AND-MACHINE-UI' if e['key'] in INSIDE_GM else 'Debugzy draft'
        if 'origin' in e: e['originStatus'] = 'draft-curriculum-check' if e['key'] in ORIGIN_DRAFT else 'checked'
    keys = {e['key'] for e in ents}
    missing = sorted({a.split('|')[0] for r in recs for a, _ in r['in'] if a.split('|')[0] not in keys} | {r['out'][0] for r in recs if r['out'][0] not in keys})
    doc = {'format': 'bertopia-registry', 'v': 1, 'generated': 'tools/build_registry.py (bertopia-assets pack); do not hand-edit, edit registry_src.py / build_registry.py',
           'rules': ['ids 1-31 are live 2.5.42 and frozen', 'every new brief adds its rows here FIRST (CODING-PLAN phase 0)', 'game + Bertodex read this file; names/facts never live anywhere else',
                     'text = grade 5-6 reading level, our own names only; draft until Curriculum Bot checks', 'GM-ANSWERS-2026-10-06 wins over older specs'],
           'verbs': ['Move', 'Mine', 'Place', 'Use', 'Open', 'Connect', 'Pair', 'Move-item', 'Craft', 'Paint'],
           'counts': {t: sum(1 for e in ents if e['type'] == t) for t in sorted({e['type'] for e in ents})} | {'recipe': len(recs)},
           'unknownKeysInRecipes': missing, 'entries': ents, 'recipes': recs}
    json.dump(doc, open(OUT, 'w'), indent=1, ensure_ascii=False)
    print(OUT, doc['counts'], 'unknown:', missing)
if __name__ == '__main__': main()
