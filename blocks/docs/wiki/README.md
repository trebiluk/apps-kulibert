# Bertopia wiki (single source of truth)
Diego, 6:59 AM Oct 6: "Design all the wiki and documentation early so we can follow the plan and lore to keep it real feeling."

**One rule above all:** names, descriptions, recipes, facts and Bertodex text live in **`REGISTRY.json`** and nowhere else. The game build (`bloxbert-src/src/data/registry.js`, generated) and the Bertodex both read it. The wiki table pages are generated from it, so a name can never drift between the game, the Bertodex and the docs.

## How to change something
1. Edit `bloxbert-src/assets/pack/tools/registry_src.py` (blocks, items, Dex text) or `build_registry.py` (verbs, recipes, fact chips, effects).
2. Run `python3 tools/build_registry.py <repo>/blocks/docs/wiki/REGISTRY.json` and `python3 tools/build_wiki.py <repo>/blocks/docs/wiki/REGISTRY.json <repo>/blocks/docs/wiki`.
3. Every new Build brief **adds its registry rows first** (CODING-PLAN phase 0), then the code.
4. Kid-facing text stays a draft until Curriculum Bot checks it (`textStatus`).

## Pages
| Page | What | Kind |
|---|---|---|
| [REGISTRY.json](REGISTRY.json) | every block, item, machine, ore, biome, element, effect, critter and recipe | data, generated |
| [verbs.md](verbs.md) | the ten verbs and everything that uses each | generated |
| [blocks.md](blocks.md) · [ores.md](ores.md) · [machines.md](machines.md) · [items.md](items.md) | catalogue with recipes, verbs, stage, fact chip and Bertodex id | generated |
| [recipes.md](recipes.md) | recipes by station | generated |
| [biomes.md](biomes.md) · [critters-and-bots.md](critters-and-bots.md) · [elements.md](elements.md) · [effects.md](effects.md) | the world | generated |
| [LORE.md](LORE.md) | Berty, Bertyville, the Commons, biomes, Hanging Isles, Fusion Core, bots, holidays | skeleton, **lore content: GameMaster** |
| [STYLE-GUIDE.md](STYLE-GUIDE.md) | wiki and in-game voice | hand-written |
| [topics/](topics/) | how systems work: power, logistics, worlds, progression, economy, dailies, music, holidays, furniture, Bertodex, settings | stubs that link to the specs |

## Specs this wiki follows (copies in `blocks/docs/`; the newest one wins, and GM-ANSWERS wins over all older lines)
- BERTOPIA-GM-ANSWERS-2026-10-06
- CORE-MECHANICS (the ten verbs)
- WORLDS (Game vs Build world)
- ORE-TABLE
- ELEMENT-ECONOMY
- WORLD-1
- WORLD-2
- STORAGE-SPEC
- EFFECTS-SPEC
- FUN-ITEMS-SPEC
- PROGRESSION-PLAN
- BERTOPIA-CODING-PLAN (the build order)
