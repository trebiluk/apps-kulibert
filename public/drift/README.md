# Drift · classroom door

Static snapshot of [trebiluk/drift](https://github.com/trebiluk/drift) for The Tech Room.

**Live:** https://apps.kulibert.net/drift/

School DNS (Solvay) blocks `*.vercel.app`. Built files live in `public/drift/` and are rewritten to `/drift/`. `index.html` uses relative `./assets/…` only — never `https://drift-psi-two.vercel.app/assets/…`. Vite build flag: `DRIFT_BASE=./`.

Do not proxy this door back to `https://drift-psi-two.vercel.app`.

## Prove (after deploy)

```bash
curl -sS https://apps.kulibert.net/drift/ | grep vercel.app
```

That must print **nothing**. `view-source` of `/drift/` must contain zero `vercel.app`. Same check on the snapshot:

```bash
grep -R --include='*.html' --include='*.js' --include='*.css' vercel.app public/drift && echo FAIL || echo PASS
```

## Rebuild

From the hub repo root:

```bash
bash scripts/publish-drift.sh
```

That clones `trebiluk/drift`, builds with `DRIFT_BASE=./`, and replaces `public/drift/`.
