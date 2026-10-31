# Vendored bloxbert-src node_modules

`vendor/bertopia-node_modules.tgz` is `bloxbert-src/node_modules` from `npm ci` against the lockfile
(@babylonjs/core 6.49.0, noa-engine fenomas/noa#8a74866). Built on linux-x64 (esbuild binary is @esbuild/linux-x64).

Extract (run from the repo root):

```sh
tar -xzf vendor/bertopia-node_modules.tgz -C bloxbert-src
```

Then build offline:

```sh
cd bloxbert-src && npm run build
```
