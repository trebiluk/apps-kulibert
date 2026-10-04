# Bertopia: Game World vs Build World + Roles (GameMaster, Oct 4 2026 6:56 AM ET)
Source: Diego 6:52 AM ("teachers are whoever I check the box for") and 6:53 AM (two worlds). This file overrides any older hosting or "teacher" wording in the other specs.

## Roles
- **Teacher** = a role flag Diego toggles per person in TechWorks (staff, club officers, kid helpers). It is NOT a fixed staff list. Every "teacher" in every Bertopia spec means "has the Teacher flag."
- The flag comes from TechWorks. The server wiring waits for Diego's OK; until then, the flag is set only through the existing admin path Debugzy controls.
- Everyone else is a **Player**.
- Teacher powers (everywhere): join, watch or stop any game; see true nameplates; override locks; remove bobbleheads; mute music; switch off effects for a class; open the Build world.

## The two worlds
| | GAME world (Bertyville) | BUILD world (the Workshop) |
|---|---|---|
| Who gets in | everyone | Teacher flag only |
| Rules | Survival rules: mine, craft, energy, day/night, Bag limits, effects | Creative rules: full palette, no energy, no limits, always day (toggle) |
| What happens there | play, explore, mine, craft, kids' own bases on their plots, storage and logistics, Dailies, contests, arenas, Hide-and-Seek and all mini-games | Teacher-builders build the official map: Bertyville town, Daily courses (Chasm, Parkour Rush), arenas, Game Zones, holiday displays |
| Starting games | **anyone** can place a Game Zone Flag and start Hide-and-Seek or a mini-game; teachers can join, watch or stop any game | no games run here |
| Earning | Cogs, badges, Bertodex entries, Patents | nothing (except Builder badges) |

Kids keep building their own things in the Game world: bases on their plots, storage, tubes, furniture and Chasm bridges. The Build world is only for the official, shared map that everyone plays on.

## Doors between them
- **Workshop Door:** a door block at Bertyville spawn. It's visible only to players with the Teacher flag. Tap = Open, the same verb as any door.
- **Leaving:** the matching door in the Workshop returns you to where you left the Game world.
- **Publishing:** in the Workshop, a teacher marks an area and taps Publish. That area replaces the matching area in the Game world at the next server sync, and an Undo Publish keeps the last 5 versions. Kids' plots are never overwritten; publishes skip claimed plots.

## What carries over
| Thing | Game → Build | Build → Game |
|---|---|---|
| Bag, backpacks, storage contents | no (each world has its own Bag; this stops Creative items leaking into Survival) | no |
| Blueprints | yes (a teacher can import any kid's Blueprint; credit "Original by [alias]" and a Patent stays with the kid) | yes, as published areas or as shared Blueprints in the Blueprint library |
| Cogs / Periodic Wallet | the wallet can be viewed in both; Cogs are earned and spent only in the Game world | none earned |
| Badges, Bertodex | progress only from the Game world; the Workshop can view the full Dex without unlocking anything | Builder badges only |
| Avatar, paint palette, settings, alias | yes | yes |
| Bot, Pet Rock, Drone | they stay parked in the Game world | not in the Workshop |
| Effects | not used in the Workshop (Creative tools replace them) | no |

## Mapping to the older specs
- "Creative" in the storage, fun-items, effects and core-mechanics specs = the **Build world** rules.
- "Survival" = the **Game world** rules.
