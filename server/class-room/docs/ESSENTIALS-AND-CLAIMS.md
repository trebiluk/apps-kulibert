# "Essentials" and "GriefPrevention" style modules (Phase 1+ building blocks)

Standalone and **not wired**. `src/essentials.js`, `src/claims.js`, `src/editlog.js` are pure code with tests (`test/modules.test.mjs`, 15 tests). `room.js` and the protocol are unchanged, so the Phase 0 gate is unaffected. Wire them only after Phase 0 passes on the real runtime.

## Why "style", not a port
The Minecraft plugins assume adult players who type, invite friends, claim land and teleport to each other. Bertopia's rules say the opposite (aliases only, no typed text, no kid-hosted worlds), so each idea is kept only where it fits.

| Plugin idea | Here |
| --- | --- |
| Chat, /msg, nicknames | **Quick-chat wheel and emotes only** (ids, translated on each client). No typing, no private messages, no nicknames. |
| /spawn, /home | Kept. One home per kid, no names, cooldowns, home only on land the kid may use. |
| /tpa (kid to kid) | **Not built.** A kid can go to spawn or their own home only. |
| /warp, /tp, /tphere, /spawn all | **Staff only.** Warps are preset ids. Teleports are decided by the server, which also fixes the "respawn gets snapped back" gap in the speed check. |
| /mute | Staff only: one kid or everyone. A muted kid is not told; their wheel messages just go nowhere. |
| /broadcast | Staff pick an announcement **id** from a fixed list; nobody types a broadcast. |
| /kit | Staff give a kit id from the config's list. |
| /afk | Automatic after 60 s. Icon **and** the word AFK on the nameplate. |
| Claims with a golden shovel, claim blocks | **Not built.** Plots are fixed 32x32 squares on a grid, assigned by staff, one per kid. |
| Trust / invite friends to build | **Off.** Staff-only switch, and only for configs that allow it (none do today). |
| Protected spawn / admin claims | Bertyville core and the commons: nobody but staff can edit. |
| Anti-grief (lava, TNT, mass breaking) | Banned block ids per config (list not decided), edit rate limit, strikes feed the kick/ban ladder. |
| CoreProtect-style rollback | `editlog.js`: rollback by time, kid or plot, staff only (admin). In memory only. |

## What is decided and what is not
- Decided by Diego: contest = "creative flat, plots, contest tools (open/close, theme, judging, podium), strong grief prevention". Only `contest` has an edit policy in `claims.js`.
- **Not decided (so kids cannot edit in these until Diego says):** `solvay`, `semester`, `period`, `game`, `loot`, `seed`. The code fails closed.
- Layout numbers (32-block plots, 4-block paths, 6x6 grid, core and commons sizes) are first guesses for the real map.

## Decisions needed from Diego
1. Edit rules for the six undecided configs (plots? shared build area? wild editing?).
2. Do any configs allow **staff-set buddy build** on a plot? (Default no.)
3. The fixed lists, per config: quick-chat wheel entries, emotes, announcements, warps, kits. (Ids only here; wording and translations come with the game-side paste.)
4. Banned block ids for grief prevention (lava, fire, TNT-like): needs the real block id list from Debugzy.
5. Contest tools: who locks a plot for judging and when (the module has `lock(plot)` and `lockEverything`).
6. Should the rollback log survive a restart? That means storing edit data; needs Diego's yes and the district's OK. Default: memory only.

## Wiring plan (Phase 1/2, after the Phase 0 gate; this is a plan, not built)
- Two new client frames, both strict and versioned like the rest: `{"v":0,"t":"cmd","c":"qc","i":2}` (the essentials commands; exact shapes in `essentials.js`) and `{"v":0,"t":"b","op":"place","x":..,"y":..,"z":..,"id":..}` (block edit).
- The room runs every block edit through, in order: `checkBlockEdit` (shape, reach, known id) then `claims.canEdit` then records it in the edit log. A refused edit sends the kid `{"t":"no","c":"<why>"}`; `strike:true` goes to the ladder in `guard.js`.
- Effects of `tp` set the server's copy of the position and send `{"t":"tp",...}`; the speed check then starts from the new spot.
- Kids still have no create/host/invite/text frames. `cmd` carries ids only.
- New abuse-script groups to add at wiring time: editing another kid's plot, editing the core, mass-breaking, quick-chat spam while muted, a kid sending a staff command via `cmd`, banned blocks.

## What the game must show (accessibility; for the later game-side paste)
- Quick-chat and emotes: a wheel with icon **and** words, keyboard (arrows + Enter, Esc closes) and touch (44 px targets). The message shows as a bubble next to the alias nameplate for a few seconds, **text on screen, never sound-only**. Reduced motion = no pop animation.
- Plot borders: drawn as a line plus a label with the plot's owner **alias** and "Your plot" / "Not your plot" in words, never colour alone, no flashing.
- A refused edit shows a short words-and-icon note ("This is not your plot", "This area is protected", "Plot is locked for judging").
- Frozen, muted-all and announcements: a banner with words. Announcements are preset ids, translated: en, uk, ru, es, ar, fa-AF, rw, ti + Simple.
- AFK: icon plus the word AFK.
- Countable checks for that paste: wheel reachable by keyboard alone in 3 key presses or fewer; every refusal note has words; plot border visible on a greyscale screenshot.

## Known limits
- Rolling back a cell restores the oldest block in the selection even if another kid edited it afterwards. Fine for undoing one griefer; staff should roll back by kid or plot, not by whole room.
- Nothing is persisted. Homes, mutes, plots and the edit log are forgotten when the room object is evicted. Persistence needs a privacy decision first.
- Cooldowns, rates and layout numbers are guesses to tune from play.
