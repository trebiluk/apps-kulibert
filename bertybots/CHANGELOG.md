# Berty's Botz changelog (structured)

**Chip: BB 0.18.0** · 2026-09-21 · channel **live**  
Source of truth: `js/version.js` + this file.  
If the intern and an old zip disagree, the chip wins.

English notes for the period board. Teachers do not need to code.

---

## Version law

| Kind | Looks like | Where it goes |
| --- | --- | --- |
| Spec / scaffold | `BB 0.0.x` | Repo only. No cart. |
| Debug drop | `BB 0.1.0-d3` | Workshop / intern. Chip must say **DEBUG**. Not the classroom URL. |
| Live classroom | `BB 0.18.0` | `https://apps.kulibert.net/bertybots/` |

Rules:

1. One job per version. Pause until GO.
2. Every push that changes play or save bumps the chip **in the same commit**.
3. Debug increments the `-dN` suffix (`-d1`, `-d2`…). Do not skip. Do not reuse.
4. Promote a debug train by dropping `-dN` and writing the teacher notes for that live number.
5. Never leave DEBUG on the projector. Hard refresh (Ctrl+Shift+R) if a cart still shows an old chip.
6. Student `.bertybots.json` may store `app` + `format` + `title` only. No names. Optional `appVersion` is the chip string, not a person.
7. Do not graft third-party game assets, official layouts, or `fcsim`.

---

## 0.19.27 — Optional curriculum — 2026-09-28

- Curriculum is off until you turn it on. Then the six design steps, Measure, Forces, and Systems sit above the shop. The build jobs stay.
- Assign with `?curriculum=1`. Turn off with `?curriculum=0` or Menu → More → Curriculum.

## 0.19.26 — Look at the goal — 2026-09-27

- The GOAL button jumps the view to the stripes. The job number, or H, brings the crate back. G does the look.
- The job name sits next to the numbers.

## 0.19.25 — Closer — 2026-09-27

- The camera sits on the crate, not the empty shop.
- The GOAL mark stays inside the screen.

## 0.19.24 — Big enough to grab — 2026-09-27

- The shop starts close again. Scroll still reaches a far Drop Zone.
- If the stripes are off screen, a GOAL arrow points at them.
- The job you are on has a ring, so it is not confused with the next one.

## 0.19.23 — Tools look like tools — 2026-09-27

- Shortcut chips no longer sit on the pictures. They show when you point at a button.
- The guide opens as a paper card up high, off the crate.

## 0.19.22 — You can look at the goal — 2026-09-27

- The Drop Zone is in the frame. Scroll sideways to move along the job. Ctrl-scroll zooms. The view still cannot leave the job.

## 0.19.21 — Next job is one click — 2026-09-27

- Next job opens Job 2 on the first click. The clear card closes when you pick a job.
- Slow stays on the top row. The footer stays a short line.

## 0.19.20 — Keys — 2026-09-27

- 1–5 pick parts, E erases, M moves, Space plays, S is slow, Esc stops, Z undoes. The key sits on the button.

## 0.19.19 — Stay on the job — 2026-09-27

- The camera cannot wander off into the brick wall.
- The hanging shop lights are gone. They looked like the puzzle.

## 0.19.18 — Berty points — 2026-09-27

- The shop opens closer, on the machine.
- Berty, in a hard hat, flies in the shop and points with a big speech bubble.

## 0.19.17 — Center, then a side — 2026-09-27

- A wheel locks to its center first. Push past the rim to catch a quadrant.

## 0.19.16 — The shop stays still — 2026-09-27

- The tool bar no longer grows and shrinks. The playfield does not jump.

## 0.19.15 — The line fits — 2026-09-26

- The bottom line is the only text while you build, and it is short enough to read.
- The stripes say PARK once. A clear is one card, then the next job.

## 0.19.14 — Three different moves — 2026-09-26

- Up the Curb starts with the blue wheel. It rolls the wrong way. The orange one climbs the step.
- The Wall is not a movie. The orange wheel hits the wall. The blue one goes the other way.
- High Shelf starts solved except a loose wheel sitting on the step. Drag it off.
- A clear freezes the parked machine and puts a small card in the corner, so the machine stays the picture.

## 0.19.13 — The hole eats the old wheel — 2026-09-26

- Mind the Pit is wide enough that the wheel from the earlier jobs falls in. A silver bar across the hole parks the crate.
- A miss leaves a Stopped mark. The stripes say PARK. The miss line says what happened, not "process."

## 0.19.12 — The toy stays up — 2026-09-26

- Build jobs keep the extra buttons hidden. One line tells you the move.
- Job 2 starts with a loose wheel. The step, the hole, the low wall, and the two steps are close enough to see. Pair needs a bar between the crates.

## 0.19.11 — Fix the cart — 2026-09-26

- Job 1 opens on a broken cart. Drag the right wheel behind the crate, then Play.
- Build jobs are Fix it, Roll Out, Curb, Pit, Wall, Shelf, Pair. Measure and Forces sit in Menu. Around the Bend stays off the strip.
- A clear is a card, then the next job.

## Current train (0.18.x live)

### 0.18.0 — TechWorks hang — 2026-09-21

- Teach Hang on TechWorks pins this shop (Open Shop, Forces, Measure, Roll Out). Deck plays the live URL — the shop is not copied onto tw.kulibert.net.
- Menu has TechWorks and Tech Room. Embed mode skips How-to. No names.

Hard refresh if a cart still says 0.17.0.

---

## 0.17.x

### 0.17.0 — See the job — 2026-09-21

- Camera frames Shop Floor and Drop Zone on every challenge. High Shelf and Around the Bend no longer hide the zone off-screen.
- Click-test: all 11 courses load, Starter cart, Play, Stop. Site Editor Level tab stays locked on challenges.

Hard refresh if a cart still says 0.16.1.

---

## 0.16.x

### 0.16.1 — Polish — 2026-09-21

- Lesson card sits top-right, off the crate. Play uses **g** / **v**, not a paragraph on the arrow.
- Hint hides while the test runs.

Hard refresh if a cart still says 0.16.0.

### 0.16.0 — Forces you can see — 2026-09-21

- Play draws a yellow **g** on the crate. Forces lesson names gravity, Drive torque (wheel-and-axle), and unbalanced motion.
- Assign **Forces** from the course list, or `?course=forces`.
- Hub snap glows when a wheel will join a linkage.
- Dust motes only during Play (cheaper Chromebook idle).

Hard refresh if a cart still says 0.15.0.

---

## 0.15.x

### 0.15.0 — Phone play — 2026-09-21

- On a phone, the tool bin stays icon-sized unless you pin Tools. Tap no longer wedges it open.
- Builder / Observer sit in Menu so they do not cover the crate.
- Play still collapses the bin so the floor can fill the screen.

Hard refresh if a cart still says 0.14.1.

---

## 0.14.x

### 0.14.1 — Polish — 2026-09-21

- Keyboard focus ring. Course picker matches the HUD.
- Machine / Level tabs hide on challenges (Site Editor still has them).
- Floor labels read on the brick. Lamps respect reduced motion.

Hard refresh if a cart still says 0.14.0.

### 0.14.0 — Site Editor is its own course — 2026-09-21

- Challenges lock Shop Floor / Drop Zone / slabs. That is the job, not a cheat.
- Assign **Site Editor** when the class designs a course.
- Menu links (Teacher, Privacy) are readable on the cream card.

Hard refresh if a cart still says 0.13.0.

---

## 0.13.x

### 0.13.0 — Sleek chrome — 2026-09-20

- HUD, rail, heat, and pair chip sit quieter. Hairline yellow, not racing stripes.
- Sheets and toasts fade. Play is still the loud button.
- Type is Barlow. Physics unchanged.

Hard refresh if a cart still says 0.12.0.

---

## 0.12.x

### 0.12.0 — After-test readout — 2026-09-20

- Stop names the fail: stalled, fell, overshot, missed, or parked.
- Last trail stays as a dashed ghost. Observer ring on the crate in Play.
- `?debug=1` (or backtick) shows chip + fps. Escape closes sheets.
- Chromebook idle draw is cheaper. Heat ids cannot grow forever.
- Pack: `js/io.js` + `js/pack.py`. Bundle cache-bust matches the chip.

Hard refresh if a cart still says 0.11.1.

---

## 0.11.x

### 0.11.1 — Camera on the job — 2026-09-19

- Build view sits on the Shop Floor, not the empty hangar.
- Play follows the crate. Lamps stay in frame.
- Physics unchanged.

Hard refresh if a cart still says 0.11.0.

### 0.11.0 — Class heat + pair chip — 2026-09-18

- HUD **Heat** is crates parked this period. Shared across Chromebooks on this shop. Not a kid list. No names.
- Stage chip: **Builder** / **Observer**. Local pair role. Does not lock tools. Does not pay TechCash.
- Menu **New period** clears heat for the room.
- Keeps the 0.10.1 phone HUD (course + Play + Stop + Menu).
- Still five parts. No magnets.

Hard refresh if a cart still says 0.10.1.

---

## 0.10.x

### 0.10.1 — Phone HUD fits — 2026-09-18

- Phone landscape: course + Play + Stop + Menu. Rank and Slow live in Menu.
- Graph paper still off unless you assign Measure.

Hard refresh if a cart still says 0.10.0.

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
