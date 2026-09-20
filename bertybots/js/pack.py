#!/usr/bin/env python3
"""Pack version.js + io.js + shop.js → bundle.js. Chip is law."""
import re
from pathlib import Path
root = Path(__file__).resolve().parent
chip = "0.12.0"
for line in (root / "version.js").read_text().splitlines():
    if "APP_VERSION" in line:
        chip = line.split('"')[1]
        break
parts = []
for name in ("version.js", "io.js", "shop.js"):
    t = (root / name).read_text()
    t = re.sub(r"import\s+\{[\s\S]*?\}\s+from\s+['\"][^'\"]+['\"];\s*", "", t)
    t = t.replace("export const ", "const ").replace("export function ", "function ")
    parts.append(t.strip() + "\n")
out = f"/* Berty's Botz BB {chip} — bundled for any http(s) host */\n" + "\n".join(parts) + "\nboot();\n"
(root / "bundle.js").write_text(out)
print("packed", chip, len(out))
