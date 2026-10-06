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
 ('pan', 1, W, [('planks', 3)], 2, None, 'GM-ANSWERS §5 / ORE-TABLE'), ('carvingTool', 1, W, [('stick', 2), ('stone', 1)], 2, None, 'DECOR-PACKS §3 stand-in (2 Sticks + 1 Iron Nugget once an Iron Nugget item exists)'), ('bucket', 1, F, [('ironIngot', 3)], 4, 'T4', 'GM-ANSWERS §5'),
 ('smelter', 1, W, [('brickRed|brickGrey', 8), ('ironOre', 1), ('coal', 1)], 10, 'T4', 'GM-ANSWERS §5 (brick colour: open question)'),
 ('fabricator', 1, F, [('steel', 4), ('copperWire', 2), ('glass', 1), ('batteryCell', 1)], 10, 'T5', 'GM-ANSWERS §5 (bootstrap: open question)'),
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
 'coal': 'Coal is mostly carbon from plants that lived over 300 million years ago.', 'ironOre': 'Iron is the most-used metal on Earth. Steel is mostly iron.',
 'copperOre': 'Copper is used in wires because electricity flows through it easily.', 'zincOre': 'Zinc coating (galvanizing) keeps steel from rusting.',
 'tinOre': 'Bronze (copper + tin) was so important that a whole age of history is named after it.', 'quartzOre': 'Quartz is silicon + oxygen (SiO2). Most sand is quartz.',
 'silverOre': 'Silver conducts electricity better than any other metal.', 'goldOre': 'Gold never rusts, so very old gold objects still shine.',
 'glowMoss': 'Real glowing fungi (foxfire) make light with a chemical reaction called bioluminescence.', 'clay': 'Clay is made of tiny flat mineral grains. Fired clay becomes brick.',
 'water': 'Water is H2O: two hydrogen atoms and one oxygen atom.', 'sand': 'Glass is made by melting sand at about 1,700 C.',
 'glass': 'Glass looks solid, but it has no crystal pattern inside.', 'snow': 'Every snowflake has six sides because of how water molecules link up.',
 'ice': 'Ice floats because water expands when it freezes.', 'saltCrust': 'Table salt is sodium chloride (NaCl).', 'blackSand': 'Black sand gets its colour from heavy minerals like magnetite and ilmenite.',
 'bauxite': 'Almost all aluminum comes from bauxite.', 'ilmeniteOre': 'Ilmenite is the main ore of titanium.', 'platinumOre': 'Platinum is used in car parts that clean exhaust.',
 'basalt': 'Most of the ocean floor is basalt.', 'granite': 'Granite cooled slowly underground, so its crystals grew big enough to see.', 'graphiteOre': 'Pencil "lead" is really graphite mixed with clay.',
 'boundaryClay': 'A thin clay layer found worldwide is rich in iridium, a clue that a giant asteroid hit Earth 66 million years ago.',
 'steel': 'Steel is iron with a small amount of carbon, which makes it much stronger.', 'bronzeIngot': 'Bronze is about 90% copper and 10% tin.',
 'batteryCell': 'A battery turns stored chemical energy into electricity.', 'solarPanel': 'Solar cells are made from silicon.', 'silicon': 'Computer chips are made from silicon.',
 'logicChip': 'A chip holds millions or billions of tiny switches called transistors.', 'copperWire': 'Copper wire carries electricity in almost every building.',
 'bioplastic': 'Some plastics are made from corn starch instead of oil.', 'paintDab': 'Pigments give paint its colour. Early paints came from plants, berries and minerals.',
 'glowStick': 'A glow stick glows when two chemicals mix: chemiluminescence.', 'coldGlowVial': 'Cold slows chemical reactions, so a cold glow stick lasts longer.',
 'leaves': 'Leaves use sunlight, water and carbon dioxide to make sugar (photosynthesis).', 'log': 'You can count a tree\'s age from its rings.',
 'itemTube': 'Factories use conveyors to move goods from step to step.', 'terminal': 'A search engine finds things by looking through an index.', 'sorter': 'Recycling centres sort materials by type.',
 'charger': 'A wall outlet in the U.S. gives about 120 volts.', 'lantern': 'LEDs use much less energy than old light bulbs.',
 'teleportPad': 'Real teleporting of objects is not possible. Scientists can only "teleport" information between particles.',
 'deliveryDrone': 'Delivery drones balance speed, battery life and how much they carry.', 'bounceBlock': 'A spring stores energy when squashed and gives it back.',
 'noteBlock': 'A higher pitch means the sound wave vibrates faster.', 'pumpkin': 'Pumpkins are fruit, because they hold seeds.', 'flower': 'Bees carry pollen from flower to flower.',
 'corn': 'Corn is a grass. Each kernel is a seed.', 'cotton': 'Cotton fibers grow around the seeds of the cotton plant.', 'goldFlake': 'Gold is heavy, so it sinks to the bottom of a pan.',
 'pan': 'Panning works because heavier things sink faster in moving water.', 'hayBale': 'Hay is grass that is cut and dried so animals can eat it in winter.',
 'gourds': 'Gourds have hard shells and were used as bowls and bottles long ago.', 'scarecrow': 'Farmers have used scarecrows for thousands of years.',
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
