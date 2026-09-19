# The Tech Room · apps.kulibert.net

ClassLink-style classroom portal for Kulibert Tech Ed apps.

**Live:** https://apps.kulibert.net  
**Vercel project:** `apps-kulibert`  
**Owner:** StyleBot family kit · FeatureBot shell · Flo orchestrates

## Deploy
Static `index.html` + `vercel.json`. Production domain `apps.kulibert.net` (Cloudflare in front).

**Drift** is a same-origin snapshot at [`/drift/`](https://apps.kulibert.net/drift/) (`public/drift/` in this repo, rewritten to `/drift/`). Do not rewrite it to `https://drift-psi-two.vercel.app` — Solvay blocks that host. `index.html` uses relative `./assets/…` only. Prove: `curl -sS https://apps.kulibert.net/drift/ | grep vercel.app` must be empty. Rebuild: `bash scripts/publish-drift.sh`.

## Edit
This repo is the source of truth. Connect Vercel project **apps-kulibert** to `trebiluk/apps-kulibert` (root directory `.`). Do not upload-replace the live file outside Git.

## Grok Build crew-off pack
- `GROK-BUILD-WHEN-CREW-OFF.md` — live locks + hard rails
- `GROK-CHAT-DESCRIPTION.txt` — paste into Grok Build project Description
- `Kulibotz-Grok-Build-Handoff.pdf.b64` — base64 of the handoff PDF (see HANDOFF-PDF-README.md)
