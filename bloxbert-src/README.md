# Bloxbert source (block builder)

This folder is the source for Bloxbert. It is not deployed (see `/.vercelignore`).
The live site serves only the built static folders in the repo root.

Student door is Bloxbert 2.0.0 at `/blocks/` (Bertyville). `/blocks-test/` stays at test 1.2 until Diego says to remove it.

- `/blocks/` is the **student door** (Bloxbert 2.0.0 and later). Build into it with `npm run build`.
- `/blocks-test/` is **Bloxbert test 1.2**, the test page. It stays up until Diego says to remove it. Don't build 2.x into it.

## Build
```
cd bloxbert-src
npm ci
npm run build        # -> ../blocks/       (student door)
npm run build:test   # -> ../blocks-test/  (test page only)
npm run build:dist   # -> dist/            (local, not committed)
```
`node build.mjs --out <dir>` (or `BLOX_OUT=<dir>`) builds anywhere else. Node 20, npm 9+.
A build writes `index.html`, `app.js`, `THIRD-PARTY.txt` and `assets/` (atlas, glass, Kenney license). First load must stay under 1 MB gzip; the build prints the total.
Commit the built door folder together with the source change.

## Stack (pinned)
- noa-engine: `github:fenomas/noa#8a74866055ab94ff3cfb332ff4762820e86a1721` (develop branch, MIT). No local edits.
- @babylonjs/core 6.49.0 (Apache-2.0). esbuild 0.24.2 bundles `src/main.js` into one IIFE.
- Block art: Kenney Voxel Pack (CC0, `assets/KENNEY-LICENSE.txt`), cut to a 32 px atlas by `tools/make-atlas.py` (needs the unzipped pack; set `KENNEY_TILES`). `assets/atlas.json` maps block names to atlas rows.
- Saves: `kuliblocks` v1 JSON in IndexedDB, plus Export/Import of a file. Our chunk store is the source of truth; noa only draws.

## Local checks (headless Chrome)
```
npm run build:dist && npm run serve          # http://127.0.0.1:8870/
node tools/func12.mjs http://127.0.0.1:8870/ phone|desk|lang <tag>
node tools/measure.mjs http://127.0.0.1:8870/ 1366-auto,1366-lite,412-auto <tag>
node tools/nogl.mjs                          # the "no 3D" card
```
Set `CHROME_PATH` if Chrome isn't at `/usr/bin/google-chrome`. Results go to `measure/` (not committed).
URL switches: `?touch=1` forces touch pads, `?q=auto|lite|full` picks quality, `?scale=0.75` sets render scale, `?lod=high` sets a bigger view distance.
