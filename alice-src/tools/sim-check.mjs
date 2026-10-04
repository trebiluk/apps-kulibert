import { createHash } from "crypto";
import { readFileSync } from "fs";
import { schedule, scoreRound } from "../src/core/lookout-sim.js";

const levels = JSON.parse(readFileSync(new URL("../src/levels/lookout.json", import.meta.url))).levels;
const parts = [];
for (let seed = 1; seed <= 20; seed++) {
  for (const lv of levels) {
    const sp = schedule(seed, lv, false);
    const events = sp.filter((s) => s.alarm >= 0).map((s) => [s.step + 4, s.alarm]);
    parts.push(JSON.stringify(scoreRound(sp, events, lv)));
  }
}
const hash = createHash("sha256").update(parts.join("\n")).digest("hex");
const EXPECT = "0f5b63db703951b461b4750418a6daf8bef02ddad4ec9af9e6b10cc38f7f9f0e";
if (hash !== EXPECT) { console.error("sim-check mismatch", hash); process.exit(1); }
console.log("sim-check", hash.slice(0, 12));
