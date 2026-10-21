#!/usr/bin/env node
import { readFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const metaMatch = html.match(/<meta name="tech-room-rev" content="([^"]+)"/);
if (!metaMatch) {
  console.error("no meta tech-room-rev");
  process.exit(1);
}
const rev = metaMatch[1];
console.log("meta rev:", rev);

// Hub-owned ?v= stamps: shared scripts loaded by Hub
const hubStamps = html.match(/src="\/shared\/[^"]+\?v=([^"]+)"/g) || [];
let bad = 0;
for (const s of hubStamps) {
  const m = s.match(/v=([^"]+)/);
  if (m && m[1] !== rev) {
    console.error("stamp mismatch:", s);
    bad++;
  }
}
// also inline s.src
const inline = html.match(/s\.src = "\/shared\/[^"]+\?v=([^"]+)"/g) || [];
for (const s of inline) {
  const m = s.match(/v=([^"]+)/);
  if (m && m[1] !== rev) {
    console.error("inline stamp mismatch:", s);
    bad++;
  }
}
if (bad) {
  console.error(`FAIL: ${bad} Hub-owned stamps ≠ meta`);
  process.exit(1);
}
console.log("OK: all Hub-owned ?v= match meta");
process.exit(0);
