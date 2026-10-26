Bertopia 2.5.492 — Chip lane Part 1c: earnChip and the crew badge
Part 1c of the chip lane. Pull --rebase first, no force-push. Files: bloxbert-src/src/crew-badges.js, bloxbert-src/src/main.js, bloxbert-src/src/changelog.js, FIX-LIST.md (+ the version sites exactly as in the last Bertopia ship).

VERSION STAMP: Debugzy locked 2.5.492; never pick or lower it. Stamp every site the last ship stamped (data-version, app.js?v=, sw.js VERSION, changelog line).

ANTI-STALL: one item at a time, push when each FIX works. If earnChip, setHost, or a CrewBadges dump/load already exist in these files (from 1a or 1b), STOP and report NOT DONE with the names found. Do not write a second copy.

OUT OF SCOPE: badges.js (Berry Round, Lantern Walk, Garden Corner) and its Cogs payout; new badges; panels.js and strings-extra.js (existing keys are reused); human co-op (crewCredit.onRemote stays a stub); any sound.

FIX 1 — earnChip, the one door (crew-badges.js).
- export function earnChip(id): ids "medic" | "flanker" | "foundry" only. Unknown id or already earned: return false and do nothing. Otherwise add to earned, show the chip, call host.markDirty(), return true.
- bumpMedic and bumpFlanker keep counting (stop counting at 10) and call earnChip at 10. bumpFoundry calls earnChip("foundry"). Delete the three inline earned.add + showChip("English") blocks. Keep the window.bumpMedic / bumpFlanker / bumpFoundry globals and the exports mobs.js imports.
- export function setHost(h): h = { t, markDirty }. Stores them. Without a host (tests), fall back to the old English names and skip markDirty. In main.js, right after the Badges.onBadge(...) block add: CrewBadges.setHost({ t: t, markDirty: function () { dirty = true } }), with import * as CrewBadges from './crew-badges.js' beside the Badges import.
- Chip text = t("bdgEarned") with {name} replaced by t("c4tBadge" + id). Both keys already exist in all 9 sets. No new strings.
- Chip look (showChip): a div with role="status", an aria-hidden "🏅" span plus a text span with dir="auto". Static: no animation, no transition, no fade, no flash. Keep the dark blue #1e3a8a with light text (contrast 4.5:1 or more), 16px bold, font-family inherit, max-width 90vw, overflow-wrap anywhere, pointer-events none, same top 18% centre place. Shows 4 s. One chip at a time: a second badge waits in a queue (max 3) and shows after the first goes. Reduced motion changes nothing because nothing moves.

FIX 2 — save and load (crew-badges.js, main.js).
- Remove saveBadges and loadBadges (never called). Add export function dump() = { v: 1, counts: { medic, flanker, foundry }, earned: [ids] } and export function load(src). load ALWAYS resets to zero first, then applies src only if src.v === 1: counts must be integers clamped to 0-10 (foundry 0-1), earned keeps only the three known ids and stays in sync with counts at or above the goal. Anything else, null or bad shape: stay at zero, no throw.
- main.js world snapshot: after the line `badges: Badges.dump(), // 2.5.472` add `crew: CrewBadges.dump(),`. After `Badges.load(src && src.badges) // 2.5.472` add `CrewBadges.load(src && src.crew)`. Only counts and ids are saved: no name, no alias text, no timestamp.

FIX 3 — the Notebook list speaks your language (crew-badges.js badgeList).
- badgeList() keeps returning { id, name, progress, earned }, but name = t("c4tBadge" + id) and progress = t("bdgDone") when earned, else t("bdgProgress") with {n} and {m} filled (medic and flanker n of 10, foundry 0 of 1). Fallback to the old English text only when no host is set. panels.js already adds the ☑/☐ mark in front, so done is never colour alone. Do not touch panels.js.

CHANGELOG: add a line "Crew badges now save, and the badge pop-up uses your language." and a What's new entry in all 9 sets, same format as the 2.5.472 line:
en Crew badges now save when you leave, and the badge pop-up speaks your language.
simple Crew badges are now saved. The badge message uses your language.
uk Значки екіпажу тепер зберігаються, а повідомлення про значок — вашою мовою.
ru Значки команды теперь сохраняются, а сообщение о значке — на вашем языке.
es Las insignias de equipo ahora se guardan, y el aviso de insignia está en tu idioma.
ar شارات الطاقم تُحفظ الآن، ورسالة الشارة بلغتك.
fa-AF نشان‌های خدمه حالا ذخیره می‌شوند و پیام نشان به زبان تو است.
rw Ibimenyetso by'itsinda ubu bibikwa, kandi ubutumwa bw'ikimenyetso buri mu rurimi rwawe.
ti ባጃት ጋንታ ሕጂ ይዕቀቡ፣ መልእኽቲ ባጅ ድማ ብቋንቋኻ እዩ።
rw, ti and fa-AF are drafts that need a native check.
FIX-LIST.md: tick [x] `chip-earn`, `chip-save`, `chip-list` with the version and sha.

ACCEPT
1. Survival world: run bumpFoundry() twice. One chip "Badge earned: Foundry Crew" shows for about 4 s; the second call shows nothing.
2. Run bumpMedic() 9 times: no chip. The 10th: exactly one chip. Notebook crew list: "☑ Crew Medic  Done"; "☐ Flanker  0 of 10".
3. bumpFlanker() 4 times, reload the world: the list reads "4 of 10" and Crew Medic stays done. Open a world saved before this build (no crew key): all three at zero.
4. Language uk, then ar: chip and list change; ar reads right to left; at 412 px wide a long chip wraps and never clips.
5. Set the saved crew to {v:1,counts:{medic:99,x:5},earned:["zzz","medic"]} and reload: medic reads 10 of 10 and done, nothing else is earned, no console error.

Commit author: trebiluk <6373031+trebiluk@users.noreply.github.com>
Push to GitHub main and reply with the commit sha
