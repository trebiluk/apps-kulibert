# Berty's Botz changelog (structured)

**Chip: BB 0.10.0** · 2026-09-18 · channel **live**  
Source of truth: `js/version.js` + this file.  
If the intern and an old zip disagree, the chip wins.

English notes for the period board. Teachers do not need to code.

---

## Version law

| Kind | Looks like | Where it goes |
| --- | --- | --- |
| Spec / scaffold | `BB 0.0.x` | Repo only. No cart. |
| Debug drop | `BB 0.1.0-d3` | Workshop / intern. Chip must say **DEBUG**. Not the classroom URL. |
| Live classroom | `BB 0.10.0` | `https://apps.kulibert.net/bertybots/` |

Rules:

1. One job per version. Pause until GO.
2. Every push that changes play or save bumps the chip **in the same commit**.
3. Debug increments the `-dN` suffix (`-d1`, `-d2`…). Do not skip. Do not reuse.
4. Promote a debug train by dropping `-dN` and writing the teacher notes for that live number.
5. Never leave DEBUG on the projector. Hard refresh (Ctrl+Shift+R) if a cart still shows an old chip.
6. Student `.bertybots.json` may store `app` + `format` + `title` only. No names. Optional `appVersion` is the chip string, not a person.
7. Do not graft third-party game assets, official layouts, or `fcsim`.

---

## Current train (0.10.x live)

### 0.10.0 — Measure lesson — 2026-09-18

- Graph paper is off in regular shop.
- Assign **Measure** from the course list, or `?course=measure`.
- Tape two corners. 1 square = 1 unit. Three logs: floor width, drop width, gap.
- Local XP when the three lengths are in. No names.

Hard refresh if a cart still says 0.9.0.

---

## 0.9.x

### 0.9.0 — Shop that looks like a shop — 2026-09-18

- Graph paper gone. Brick wall, shop lamps, windows, dust, cones, pallet.
- Floor has a caution lip. Drop Zone is a painted loading bay.
- Physics unchanged. Props do not collide.

Hard refresh if a cart still says 0.8.0.

---

## 0.8.x

### 0.8.0 — Shop rank + visual how-to — 2026-09-18

- Top bar: Helper → Apprentice → Builder → Lead → Shop tech. XP is local to the Chromebook. No names.
- First win and lean machines (fewer parts than par) earn more. Courses are not locked.
- How-to: four looping examples (crate to Drop Zone, parts, drag to hub, XP).

Hard refresh if a cart still says 0.7.2.

---

## 0.7.x

### 0.7.2 — Tire tread — 2026-09-18

- Drive and Roller are knobby shop tires, not smooth disks.

Hard refresh if a cart still says 0.7.1.

### 0.7.1 — Drive arrows — 2026-09-18

- Drive-R shows a right arrow. Drive-L shows a left arrow. On the bin and on the wheel.

Hard refresh if a cart still says 0.7.0.

### 0.7.0 — Left tool bin — 2026-09-18

- Tools move to a diamond-plate rail on the left. Hover (or tap the chevron) to expand names.
- Icons look like the parts: orange Drive wheels, silver Steel bar, dashed Ghost, plywood crate.
- Guide lives at the bottom of the bin. The shop floor is the canvas again.

Hard refresh if a cart still says 0.6.0.

---

## 0.6.x

### 0.6.0 — Softer shop + pictograms — 2026-09-18

- Hazard tape off the HUD. Paper floor. Drop Zone, not Staging Bay.
- Tool buttons are pictogram + short word (wheel, beam, crate, play triangle).
- Menu (was Crew). Guide (was Job packet). How to shop (was Site induction).
- Ghost is a dashed bar again. Win reads “In the zone.”

Hard refresh if a cart still says 0.5.1.

---

## 0.5.x

### 0.5.1 — Landscape HUD — 2026-09-18

- Phone portrait: “Turn the device sideways” gate. Shop is landscape.
- One tool dock. Machine tools and Level tools never show together (`[hidden]` actually hides).
- Crew menu holds New / Open / Save / cart / undo / teacher.
- Job packet is one line. Tap to open Ask–Improve.
- Site induction does not auto-pop on a short screen.

Hard refresh if a cart still says 0.5.0.

### 0.5.0 — Job site look — 2026-09-17

- Yard is dusty plywood + concrete slabs with hatch
- Staging Bay uses caution-tape frame; Shop Floor is a plywood deck
- Steel draws as an I-beam; Ghost is caution tape
- Crate is a stamped plywood box with corner brackets
- Chrome: hazard stripes, stencil type, Site induction permit card
- Win banner: LOAD SECURE

---

## 0.4.x

### 0.4.0 — Design loop tutorial — 2026-09-17

- Guide rail: Ask → Imagine → Plan → Create → Test → Improve (NYS 5 / ITEEA)
- How to shop: four-beat tutorial, then loads Roll Out
- Course coaches for the first levels (Roll Out, Up the Curb, Mind the Pit, The Wall)
- Systems sheet: input / process / output / feedback + this course’s constraint
- Pair language: builder + observer. No names in files.

Hard refresh if a cart still says 0.3.0.

---

## 0.3.x

### 0.3.0 — Pusher cart + Pages stub — 2026-09-17

- Starter cart sits on the floor and shoves the crate in front (no more axle-jam)
- Stronger Drive bite
- Reset view
- Pair of Crates course (both cores must stay in the Drop Zone)
- Win flips Slow on so the class can watch the last second
- Play path: `index.html` + `js/bundle.js`. Live: `apps.kulibert.net/bertybots/`.

### 0.2.1 — Drag that works on a Chromebook — 2026-09-17

- Drag Drive-R / Drive-L / Roller from the toolbar onto the Shop Floor

### 0.2.0 — Class period tools — 2026-09-17

- Slow-mo, Undo, Starter cart, orange trail, teacher page

### 0.1.0 — Playable shop — 2026-09-17

Build, Play / Stop, Save local `.bertybots.json`, original courses.

---

## Not live (do not put back)

- Student names, aliases, roster ids, class codes in JSON
- Accounts, analytics, public design gallery
- Copied third-party art or official layouts from other games
- Magnets, springs, moving platforms
- WASM / `fcsim` fork
