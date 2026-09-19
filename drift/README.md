# Drift · classroom door

Static snapshot of [trebiluk/drift](https://github.com/trebiluk/drift) for The Tech Room.

**Live:** https://apps.kulibert.net/drift/

School DNS (Solvay) blocks `*.vercel.app`. This folder is served same-origin. `index.html` uses relative `./assets/…` only. The JS/CSS bundles are built with Vite `base: '/drift/'` so they never bake a Vercel host.

Do not proxy this door back to `drift-psi-two.vercel.app`.

## Prove (after deploy)

```bash
curl -sS https://apps.kulibert.net/drift/ | grep vercel.app
```

That must print **nothing**. Same check on the snapshot in this repo:

```bash
grep -R vercel.app drift/ && echo FAIL || echo PASS
```

## Rebuild

From the hub repo root:

```bash
bash scripts/publish-drift.sh
```

That clones `trebiluk/drift`, builds with `DRIFT_BASE=/drift/`, and replaces `drift/`.
