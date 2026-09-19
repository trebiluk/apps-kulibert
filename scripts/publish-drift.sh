#!/usr/bin/env bash
# Rebuild the classroom Drift snapshot into ./drift/
# School DNS blocks *.vercel.app — never emit that host in HTML or bundles.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="${DRIFT_SRC:-/tmp/drift-publish}"
REPO="${DRIFT_REPO:-https://github.com/trebiluk/drift.git}"

if [[ ! -d "$SRC/.git" ]]; then
  rm -rf "$SRC"
  git clone --depth 1 "$REPO" "$SRC"
fi

python3 - "$SRC" <<'PY'
from pathlib import Path
import sys
vite = Path(sys.argv[1]) / "vite.config.ts"
text = vite.read_text()
old = """const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL
  || (process.env.VERCEL ? "drift-psi-two.vercel.app" : "");

export default defineConfig(({ command, isPreview }) => ({
  base: prodHost ? `https://${prodHost}/` : "/","""
new = """const classroomBase = process.env.DRIFT_BASE || "/drift/";

export default defineConfig(({ command, isPreview }) => ({
  base: classroomBase,"""
if old not in text and "DRIFT_BASE" not in text:
    raise SystemExit("vite.config.ts base block changed; update scripts/publish-drift.sh")
if old in text:
    vite.write_text(text.replace(old, new, 1))
PY

cd "$SRC"
if [[ ! -d node_modules ]]; then
  npm install --no-audit --no-fund
fi

env -u VERCEL -u VERCEL_URL -u VERCEL_PROJECT_PRODUCTION_URL \
  DRIFT_BASE=/drift/ \
  DRIFT_NITRO_PRESET=node-server \
  VITE_AUTH_ENABLED=false \
  node scripts/with-app-env.mjs ./node_modules/.bin/vite build

python3 - "$SRC/.output/public" "$ROOT/drift" <<'PY'
from pathlib import Path
import shutil
import sys

src = Path(sys.argv[1])
dst = Path(sys.argv[2])
if not (src / "index.html").exists():
    raise SystemExit(f"missing {src / 'index.html'}")
if dst.exists():
    shutil.rmtree(dst)
dst.mkdir(parents=True)

for name in ("assets", "favicon.svg", "og.jpg", "x-banner.jpg"):
    item = src / name
    if not item.exists():
        continue
    if item.is_dir():
        shutil.copytree(item, dst / name)
    else:
        shutil.copy2(item, dst / name)

icon_src = src / "__grok" / "icon-180.png"
icon_dst = dst / "__grok"
icon_dst.mkdir(parents=True, exist_ok=True)
if icon_src.exists():
    shutil.copy2(icon_src, icon_dst / "icon-180.png")
(icon_dst / "manifest.webmanifest").write_text(
    """{
  "name": "Drift",
  "short_name": "Drift",
  "start_url": "/drift/",
  "display": "standalone",
  "background_color": "#6EB5E0",
  "theme_color": "#6EB5E0",
  "icons": [{"src": "./icon-180.png", "sizes": "180x180", "type": "image/png"}]
}
""",
    encoding="utf-8",
)

html = (src / "index.html").read_bytes().replace(b"\x00", b"").decode("utf-8")
html = html.replace('href="/drift/', 'href="./')
html = html.replace('src="/drift/', 'src="./')
html = html.replace('="/drift/', '="./')
html = html.replace('"/drift/assets/', '"./assets/')
if "vercel.app" in html:
    raise SystemExit("index.html still contains vercel.app")
(dst / "index.html").write_text(html, encoding="utf-8")

hits = []
for path in dst.rglob("*"):
    if path.is_file() and path.suffix.lower() in {".html", ".js", ".css", ".svg", ".webmanifest", ".json"}:
        if "vercel.app" in path.read_text(encoding="utf-8", errors="ignore"):
            hits.append(str(path))
if hits:
    raise SystemExit("vercel.app still present:\n" + "\n".join(hits))
print(f"published {dst}")
PY
