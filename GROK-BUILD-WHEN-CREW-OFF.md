# Grok Build — when KuliBotz crew is OFF

Trebby (Diego): regular Grok Build must be able to edit and publish classroom apps without Flo / Debugzy / StyleBot / etc.

## Live locks (2026-09-17)

| App | Live URL | Source of truth | Publish path |
|-----|----------|-----------------|--------------|
| TechWorks | https://tw.kulibert.net | GitHub `trebiluk/TechWorks` `main` | Cloudflare Pages project **kulibert-desk** (auto from GitHub). **Not** Grok Orbit publish. |
| Baboo | https://baboo.kulibert.net | Grok Build / Vercel **baboo** | Vercel production → baboo.kulibert.net |
| BertyCAD | https://kidcad-phi.vercel.app (interim Help) | Grok Build project **BertyCAD: Friendly TinkerCAD Clone** | Help on kidcad-phi for now; **hold** kidcad.vercel.app until transfer |
| The Tech Room | https://apps.kulibert.net | **Must be** GitHub `trebiluk/apps-kulibert` (wire if missing) | Vercel project **apps-kulibert** |
| Koderized | https://tw.kulibert.net/koderized/ | GitHub `trebiluk/TechWorks` `public/koderized` | Cloudflare Pages **kulibert-desk**. Hub `/koderized` 301s here. School door `/coderized/` is a static CZ 1.4.0 copy in this repo (`coderized/`). |
| Sprocket PrintKit | jsDelivr `trebiluk/sprocket-printkit` | GitHub `trebiluk/sprocket-printkit` | push main |
| LogoLab | https://logolab-rho.vercel.app · door `/logolab/` | GitHub `trebiluk/logolab` `main` | Vercel project **logolab**. Custom host logolab.kulibert.net pending Cloudflare CNAME. |

## Hard rails
1. **Never remap** Grok Orbit → tw.kulibert.net. Orbit is leftover.
2. TechWorks classroom publish = **GitHub → Cloudflare Pages kulibert-desk** only.
3. apps.kulibert.net is **not** inside the TechWorks repo. Separate portal. Edit only after `trebiluk/apps-kulibert` is connected to Vercel `apps-kulibert`.
4. Do not double-publish the same app from two places in one cut.
5. Chromebook-first · no white walls as TechWorks default · FERPA aliases on student walls.

## What Build can do without crew
- Edit TechWorks in `trebiluk/TechWorks` and push `main` (Pages deploys).
- Edit Baboo / BertyCAD in their Grok Build projects and **Publish** to the live hosts above (Help interim = kidcad-phi).
- Edit The Tech Room once GitHub repo is linked — change `index.html`, push, Vercel deploys apps.kulibert.net.
- Read briefs in `/workspace/bertycad-ell-help/` or `/workspace/kidcad-ell-help/` if still on disk (Help module rails).

## What Build should ask Trebby first
- Live roster import / FERPA names
- Remapping any DNS or Cloudflare project
- Promoting experimental TechWorks FAIL packs during school hours
- Ginger (parked)
- Transferring kidcad.vercel.app off the other Vercel team

## Contact
When crew returns: Flo merges PASS/FAIL only. Debugzy is primary publisher for TechWorks/Baboo when crew is on; Build covers when crew is disabled.
