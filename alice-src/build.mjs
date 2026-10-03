// Alice's Prairie build. npm run build → ../alice/
import { build } from "esbuild";
import { cpSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { gzipSync } from "zlib";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
process.chdir(HERE);
const i = process.argv.indexOf("--out");
const OUT = path.resolve(HERE, (i > 0 && process.argv[i + 1]) || "../alice");
if (OUT === path.resolve(HERE, "..") || OUT === HERE) throw new Error("refusing to build into the repo root or the source folder");
mkdirSync(OUT + "/assets", { recursive: true });
mkdirSync(OUT + "/fonts", { recursive: true });
await build({
  entryPoints: ["src/main.js"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2020",
  outfile: OUT + "/app.js",
  loader: { ".json": "json" },
  legalComments: "eof",
});
cpSync("index.html", OUT + "/index.html");
cpSync("app.css", OUT + "/app.css");
cpSync("fonts/OFL.txt", OUT + "/fonts/OFL.txt");
cpSync("fonts/atkinson-hyperlegible-400.woff2", OUT + "/fonts/atkinson-hyperlegible-400.woff2");
cpSync("fonts/atkinson-hyperlegible-700.woff2", OUT + "/fonts/atkinson-hyperlegible-700.woff2");
for (const f of readdirSync("assets")) cpSync("assets/" + f, OUT + "/assets/" + f);
let raw = 0;
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? walk(d + "/" + e.name) : [d + "/" + e.name]);
for (const f of walk(OUT)) {
  const b = readFileSync(f);
  raw += b.length;
  const gz = f.endsWith(".woff2") ? b.length : gzipSync(b).length;
  console.log(path.relative(OUT, f).padEnd(40), String(b.length).padStart(8), String(gz).padStart(8));
}
console.log("TOTAL", raw);
