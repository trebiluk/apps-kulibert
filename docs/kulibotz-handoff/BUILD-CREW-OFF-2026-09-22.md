# Grok Build — when KuliBotz crew is OFF

**Stamp:** 2026-09-22 (Flo) · Replaces stale 2026-09-19 queue where noted.
**Rule:** Regular **Grok Build on grok.com** edits and publishes **without** Flo / Debugzy / StyleBot / Curriculum / FeatureBot / RepoScout.
Sidebar Grok Bot “Build” agent is optional backup only — **primary path = paste into regular Grok Build**.

Crew may be busy or quiet. This file is enough to ship.

## Live locks (2026-09-22)

| App | Live URL | Source of truth | Publish path | Live note |
|-----|----------|-----------------|--------------|-----------|
| TechWorks | https://tw.kulibert.net | GitHub `trebiluk/TechWorks` `main` | Cloudflare Pages **kulibert-desk** (auto). **Not** Grok Orbit. | **v1.92.108** |
| Baboo | https://baboo.kulibert.net | GitHub `trebiluk/baboo` | Vercel → baboo.kulibert.net | Floorist spike HOLD publish until spike returns |
| The Tech Room hub | https://apps.kulibert.net | GitHub `trebiluk/apps-kulibert` | Vercel **apps-kulibert** | rev **2026-09-22-hub-tech-room-dark** · `data-kn-theme="tech-room"` (dark Tech Room, not Stark) · nickname **The Tech Room** · bg `#050814` · cards `#0B1220` · labels `#F7F9FF` · cyan `#22D3EE` |
| Koderized | https://koderized.kulibert.net · also TW path | GitHub `trebiluk/koderized` | Own host + TW embed | Live 200 |
| BertyCAD | https://apps.kulibert.net/bertycad/ | under apps-kulibert / bertycad | Hub / Vercel | Live |
| Botz | https://apps.kulibert.net/bertybots/ | apps-kulibert | Hub | BB **0.18.1** |
| Berty Run | https://apps.kulibert.net/berty-run/ | apps-kulibert | Hub | First Trace playable |
| BertyBeatz | https://apps.kulibert.net/bertybeatz/ | apps-kulibert | Hub | BZ **1.2.0** |
| PaperLab | https://apps.kulibert.net/paperlab/ | apps-kulibert | Hub | envelope **PASS** (diagrams+steps, rev **2026-09-22-paperlab-envelope-diagrams**); remaining plans still need the same bar |
| SpanCraft / Spire Lab | `/spancraft/` · `/spire-lab/` | apps-kulibert | Hub | MVP Load / Stand playable |
| Den / Bistro / Drift / LogoLab / Sprocket | hub paths | apps-kulibert | Hub | Live doors; Sprocket hub is lite 1.4.0 |
| Ginger | — | — | — | **PARKED** (no kid door) |

School doors = **`*.kulibert.net` only**. Never ship `vercel.app` as a student ClassLink URL.

## PaperLab — envelope PASS; remaining plans still need the same bar

Diego bar: **every plan** must have **diagrams + examples or step guides** so kids do not need the teacher.

- Envelope **PASS** live: https://apps.kulibert.net/paperlab/plans/envelope (diagrams + steps, rev **2026-09-22-paperlab-envelope-diagrams**)
- Remaining plans still need the same bar
- Curriculum steps (38 labs): `/workspace/shared/paperlab/plans/` + `INDEX.md` + `envelope-steps.md`
- StyleBot diagrams: `/workspace/shared/paperlab/visual-eval/envelope-diagrams/`
- Wire the remaining live plan pages under apps-kulibert PaperLab to that envelope bar
- Side-pane polish is **secondary** to instructional visuals

If crew is off: **Build owns grafting steps + diagrams into the remaining live PaperLab plans and publishing apps-kulibert.**

## What Build can do alone (no crew)

1. Push `trebiluk/TechWorks` `main` → CF Pages updates tw.kulibert.net.
2. Push/merge `trebiluk/baboo` → Vercel baboo.kulibert.net.
3. Push `trebiluk/apps-kulibert` `main` → Vercel updates apps.kulibert.net (Hub, PaperLab, Botz, Beatz, Run, Span/Spire, Den, etc.).
4. Treat crew-report briefs under `/workspace/shared/**/crew-reports/` as acceptance (or copies committed into those repos).
5. Prefer **Claude (newest available)** for coding in Build / cloud agents.
6. Bump hub `tech-room-rev` / TW chip / changelog plate on every ship.

## Hard rails (always)

1. Never remap Orbit → tw.kulibert.net.
2. TW publish = GitHub → CF Pages **kulibert-desk** only.
3. `apps.kulibert.net` ≠ TechWorks repo (`trebiluk/apps-kulibert` only).
4. No double-publish wars — one ship owner per cut; if crew returns, Flo merges PASS/FAIL only.
5. Chromebook mid/low first · TW **Dream dark** (no white walls) · Hub **The Tech Room** dark (`data-kn-theme="tech-room"`, rev **2026-09-22-hub-tech-room-dark**; bg `#050814` · cards `#0B1220` · labels `#F7F9FF` · cyan `#22D3EE`) · Baboo **Stark** · never mix Stark + Dream, or Stark + Tech Room, on one surface.
6. Edge Pocket = one top row; no permanent side ribbon.
7. FERPA: aliases only; never print teacher Desk PIN in Office/student chrome.
8. Inclusion default: plain language, fat targets, captions/TTS-friendly — not sound-only.
9. BabooBot is **retired** — do not wait on it.
10. Ask Trebby before: roster/FERPA changes, DNS remaps, Ginger unpark, kidcad.vercel.app transfer, experimental school-hours TW publish.

## Brand / shell tokens (Hub)

- Live: https://apps.kulibert.net · nickname **The Tech Room** · `data-kn-theme="tech-room"` · rev **2026-09-22-hub-tech-room-dark**
- Lock: bg `#050814` · cards `#0B1220` · labels `#F7F9FF` · cyan `#22D3EE` (dark Tech Room, not Stark)
- Tokens: `shared/brand/kulinet/shadcn-kulinet-tokens.css` (`[data-kn-theme="tech-room"]`)
- Map: `shared/apps-hub/crew-reports/STYLEBOT-SHADCN-KULINET-MAP.md`
- Prior shell AFTER shots (superseded by Tech Room dark): `shared/apps-hub/visual-eval/hub-shadcn-shell-*-AFTER-2026-09-22.png`
- Diego GO: full Hub shell shipped; live cut is dark Tech Room, not KuliNet Stark. Further hub polish OK without re-asking that GO

## Older week handoffs (context only — do not thrash stale PRs)

- `BUILD-WEEK-HANDOFF-2026-09-19.md` — Cleanup #8 / Fortnite #9 were dirty vs main; rebuild intent on current TW main with **new** chips if still needed
- `BUILD-MONDAY-HANDOFF-2026-09-19.md` — PlanIt/TEACH Edge Pocket spine (much already landed; verify before redoing)
- `BABOO-2.0-BUILD-PLAN.md` — floorist / tools; HOLD fancy publish until Diego GO

## How to start a Build chat cold

Paste this into the Build project:

> You are Grok Build for Kulibert Tech Ed (Solvay). Crew may be OFF. Follow `GROK-BUILD-WHEN-CREW-OFF.md` (this paste / repo docs). Ship to `*.kulibert.net` only. Chromebook-first. TW Dream dark; Hub The Tech Room dark (`data-kn-theme="tech-room"`, rev 2026-09-22-hub-tech-room-dark; bg #050814 · cards #0B1220 · labels #F7F9FF · cyan #22D3EE); Baboo Stark. PaperLab envelope PASS (diagrams+steps, rev 2026-09-22-paperlab-envelope-diagrams); remaining plans still need the same bar. Publish via the correct GitHub→host path. Prefer Claude newest. Do not wait on Flo/Debugzy/StyleBot.

Attach or point at: this file + PaperLab `envelope-steps.md` + envelope diagram folder when working PaperLab.

## When crew returns

Flo merges on evidence (URL + rev + shot). Build does not need crew ACKs to keep shipping locked work.
