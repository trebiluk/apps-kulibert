# The Tech Room · apps.kulibert.net

ClassLink-style classroom portal for Kulibert Tech Ed apps.

**Live:** https://apps.kulibert.net  
**Vercel project:** `apps-kulibert`  
**Owner:** StyleBot family kit · FeatureBot shell · Flo orchestrates

## Deploy
Static `index.html` + `vercel.json`. Production domain `apps.kulibert.net` (Cloudflare in front).

**Drift** (Tech 6–8 calm-break) is a same-origin snapshot at [`/drift/`](https://apps.kulibert.net/drift/) (`public/drift/` in this repo, rewritten to `/drift/`). Conceptual Grok home = **Tech 6–8** lane (with Coderized / Koderized). Source edits: GitHub `trebiluk/drift`. Do not rewrite classroom traffic to `https://drift-psi-two.vercel.app` — Solvay blocks that host. `public/drift/index.html` uses relative `./assets/…` only. Prove: `curl -sS https://apps.kulibert.net/drift/ | grep vercel.app` must be empty. Rebuild: `bash scripts/publish-drift.sh`.

Hub tile label: **Drift · Tech 6–8** → `/drift/`.

## Edit
This repo is the source of truth. Connect Vercel project **apps-kulibert** to `trebiluk/apps-kulibert` (root directory `.`). Do not upload-replace the live file outside Git.

## Coderized school door (`/coderized/`)
Solvay blocks Vercel preview hosts, so `/coderized/` is a **static copy** of GitHub `trebiluk/coderized` (CZ 1.4.0) — same pattern as Sprocket / HouseKit. Canonical and PWA id are `https://apps.kulibert.net/coderized/`. Do not restore a proxy or 301 to a Vercel preview host.

**Sync after a `trebiluk/coderized` change:** copy `index.html`, `styles.css`, `app.js`, `origin.js`, `manifest.json`, `icon.svg`, and `sw.js` into `coderized/`, keep the hub canonical, then PR this repo. Newer Koderized stays at https://tw.kulibert.net/koderized/ (`/koderized` still 301s there).

## Grok Build crew-off pack
- `GROK-BUILD-WHEN-CREW-OFF.md` — live locks + hard rails
- `GROK-CHAT-DESCRIPTION.txt` — paste into Grok Build project Description
- `Kulibotz-Grok-Build-Handoff.pdf.b64` — base64 of the handoff PDF (see HANDOFF-PDF-README.md)
