import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const G = require("./game.js");

function findWin(level, cap) {
  const ids = G.blocksFor(level);
  const start = G.initialState(level);
  const startHit = G.collide(start, level);
  assert.equal(startHit, "", level.id + " start is clear");
  assert.equal(G.goalMet(start, level), false, level.id + " does not start finished");
  const queue = [{ state: start, cmds: [] }];
  const seen = new Set([G.stateKey(start)]);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur.cmds.length >= cap) continue;
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const result = G.applyCommand(cur.state, id, level);
      if (!result.ok) continue;
      const cmds = cur.cmds.concat(id);
      if (result.win || G.goalMet(result.state, level)) return cmds;
      const key = G.stateKey(result.state);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({ state: result.state, cmds: cmds });
    }
  }
  return null;
}

assert.equal(G.APP_VERSION, "1.0.0");
assert.equal(G.LEVELS.length, 5);
assert.deepEqual(G.LEVELS.map(function (level) { return level.kind; }), ["match", "place", "spot", "pile", "sensor"]);
assert.equal(G.spotName(-30, 96), "A1");
assert.equal(G.spotName(0, 128), "B2");
assert.equal(G.spotName(30, 162), "C3");
assert.equal(G.starWords(0), "No stars yet.");
assert.equal(G.starWords(1), "One star.");
assert.equal(G.starWords(2), "Two stars.");
assert.equal(G.starWords(3), "Three stars.");

const langs = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
const wristUp = {
  en: "Wrist up",
  uk: "Зап'ястя вгору",
  ru: "Запястье вверх",
  es: "Muñeca arriba",
  ar: "الرسغ لأعلى",
  "fa-AF": "مچ بالا",
  rw: "Ikiganza hejuru",
  ti: "ሰለፍ ናብ ላዕሊ"
};
const wristDown = {
  en: "Wrist down",
  uk: "Зап'ястя вниз",
  ru: "Запястье вниз",
  es: "Muñeca abajo",
  ar: "الرسغ لأسفل",
  "fa-AF": "مچ پایین",
  rw: "Ikiganza hasi",
  ti: "ሰለፍ ናብ ታሕቲ"
};
const wristPart = {
  en: "wrist",
  uk: "зап'ястя",
  ru: "запястье",
  es: "muñeca",
  ar: "الرسغ",
  "fa-AF": "مچ",
  rw: "ikiganza",
  ti: "ሰለፍ"
};
assert.deepEqual(G.LANGS.map(function (item) { return item.id; }), langs);
for (let i = 0; i < langs.length; i++) {
  const code = langs[i];
  const meta = G.langMeta(code);
  assert.equal(meta.up, wristUp[code], code + " wrist up");
  assert.equal(meta.down, wristDown[code], code + " wrist down");
  assert.equal(meta.part, wristPart[code], code + " wrist part");
  assert.equal(G.labelFor("wrist-up", code), wristUp[code]);
  assert.equal(G.labelFor("wrist-down", code), wristDown[code]);
}
assert.equal(G.langMeta("fa-AF").draft, true);
assert.equal(G.langMeta("rw").draft, true);
assert.equal(G.langMeta("ti").draft, true);
assert.equal(G.langMeta("ar").draft, false);
assert.equal(G.langMeta("en").draft, false);
assert.equal(G.langMeta("uk").draft, false);
assert.equal(G.langMeta("ar").rtl, true);
assert.equal(G.langMeta("fa-AF").rtl, true);
assert.equal(G.langMeta("en").rtl, false);
assert.equal(G.langMeta("es").rtl, false);
assert.deepEqual(G.blocksFor(G.LEVELS[0]), ["base-left", "base-right", "shoulder-up", "shoulder-down", "elbow-up", "elbow-down", "claw-open", "claw-close"]);

const flat = { base: 0, shoulder: 15, elbow: -90, wrist: 0, open: true, gap: 34, holding: false, part: null };
const bent = { base: 0, shoulder: 15, elbow: -90, wrist: 15, open: true, gap: 34, holding: false, part: null };
const flatPose = G.pose(flat);
const bentPose = G.pose(bent);
assert.ok(Math.abs(flatPose.cx - 134.08417942600929) < 1e-9);
assert.notEqual(bentPose.gy, flatPose.gy);
const lifted = G.applyCommand(flat, "wrist-up", G.LEVELS[0]);
assert.equal(lifted.ok, true);
assert.equal(lifted.state.wrist, 15);
const clearWrist = {
  base: 0, shoulder: 0, elbow: -60, wrist: 60,
  open: true, gap: 34, holding: false, part: G.LEVELS[1].part
};
assert.equal(G.collide(clearWrist, G.LEVELS[1]), "");
const wristHit = G.applyCommand(clearWrist, "elbow-down", G.LEVELS[1]);
assert.equal(wristHit.ok, false);
assert.match(wristHit.msg, /wrist hit/);
const enLine = G.crashLine(wristHit.msg, 2, "en");
assert.match(enLine, /Wrist/);
assert.match(enLine, /at step 2/);
for (let i = 0; i < langs.length; i++) {
  const code = langs[i];
  const line = G.crashLine(wristHit.msg, 4, code);
  if (code === "en") assert.match(line, /Wrist/);
  else assert.ok(line.indexOf(wristPart[code]) !== -1, code + " crash names the wrist");
  assert.match(line, /at step 4/);
}

const l1 = G.LEVELS[0];
const l1win = findWin(l1, 4);
assert.ok(l1win, "L1 is winnable");
assert.equal(l1win.length, 1);
assert.equal(G.stepList(l1win)[0].joint, "shoulder");
assert.equal(G.stepList(l1win)[0].delta, 15);
assert.equal(G.runAll(l1, l1win).win, true);
assert.ok(l1win.length <= l1.par);

const l2 = G.LEVELS[1];
const l2win = findWin(l2, 12);
assert.ok(l2win, "L2 is winnable");
assert.ok(l2win.indexOf("claw-close") !== -1);
assert.ok(l2win.indexOf("claw-open") !== -1);
assert.equal(G.runAll(l2, l2win).win, true);
assert.ok(l2win.length <= l2.par);

const l3 = G.LEVELS[2];
const l3win = findWin(l3, 12);
assert.ok(l3win, "L3 is winnable");
const l3result = G.runAll(l3, l3win);
assert.equal(l3result.win, true);
assert.equal(G.spotName(l3result.state.base, G.pose(l3result.state).cx), l3.spot);
assert.ok(l3win.length <= l3.par);
assert.equal(l3.spot, "A2");

const l4 = G.LEVELS[3];
const l4win = ["repeat-3", "claw-close", "base-right", "base-right", "claw-open", "base-left", "base-left", "end-repeat"];
const l4result = G.runAll(l4, l4win);
assert.equal(l4result.win, true, "L4 is winnable");
assert.equal(l4result.state.sorted, 3);
assert.ok(l4win.indexOf("repeat-3") !== -1);
assert.ok(l4win.indexOf("end-repeat") !== -1);
assert.ok(l4win.length <= l4.par);
assert.equal(G.runAll(l4, ["claw-close", "base-right", "base-right", "claw-open", "base-left", "base-left"]).win, false);
assert.equal(G.starsFor(true, l4win.length, 1000, l4), 3);
assert.equal(G.starsFor(true, l4win.length + 1, 1000, l4), 1);
assert.equal(G.starsFor(false, 1, 1, l4), 0);

const l5 = G.LEVELS[4];
const l5win = ["repeat-2", "claw-close", "if-red-square", "base-right", "claw-open", "base-left", "end-if", "if-blue-circle", "base-left", "claw-open", "base-right", "end-if", "end-repeat"];
const l5result = G.runAll(l5, l5win);
assert.equal(l5result.win, true, "L5 is winnable");
assert.equal(l5result.state.sorted, 2);
assert.ok(l5win.length <= l5.par);
assert.equal(G.labelFor("if-red-square", "en"), "If red \u25a0");
assert.equal(G.labelFor("if-blue-circle", "en"), "If blue \u25cf");
assert.equal(G.sensorMatch({ holding: true, part: { color: "red", shape: "circle" } }, "if-red-square"), false);
assert.equal(G.sensorMatch({ holding: true, part: { color: "blue", shape: "square" } }, "if-blue-circle"), false);
assert.equal(G.sensorMatch({ holding: true, part: { color: "red", shape: "square" } }, "if-red-square"), true);
assert.equal(G.sensorMatch({ holding: true, part: { color: "blue", shape: "circle" } }, "if-blue-circle"), true);
assert.equal(G.sensorMatch({ holding: false, part: { color: "red", shape: "square" } }, "if-red-square"), false);
const l5wrong = G.runAll(l5, ["claw-close", "base-left", "claw-open"]);
assert.equal(l5wrong.win, false);
assert.match(l5wrong.crash, /wrong bin/);
G.BLOCKS.forEach(function (block) {
  assert.notEqual(block.label, "Red");
  assert.notEqual(block.label, "Blue");
});

const crashProgram = ["shoulder-down", "shoulder-down", "shoulder-down"];
const crashCopy = crashProgram.slice();
const crash = G.runAll(l1, crashProgram);
assert.deepEqual(crashProgram, crashCopy);
assert.equal(crash.win, false);
assert.match(crash.crash, /claw|shoulder|elbow|wrist|base|part/i);
assert.ok(crash.step >= 1);
const line = G.crashLine(crash.crash, crash.step);
assert.match(line, /Claw|Shoulder|Elbow|Wrist|Base|Part/);
assert.match(line, new RegExp("at step " + crash.step));

const page = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const hub = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.match(page, /Pinchy McPinchface/);
assert.match(page, /translate="no"/);
assert.match(page, /Archivo/);
assert.match(page, /#06122B/);
assert.match(page, /#E85820/);
assert.match(page, /1\.0\.0/);
assert.match(page, /What's new/);
assert.match(page, /id="langs"/);
assert.match(page, /Machine draft/);
assert.match(page, /id="draft-note"/);
assert.match(page, /labelFor/);
assert.doesNotMatch(page, /localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(fs.readFileSync(new URL("./game.js", import.meta.url), "utf8"), /localStorage|sessionStorage|indexedDB/);
assert.match(page, /prefers-reduced-motion/);
assert.match(page, /min-height:\s*48px/);
assert.match(page, /outline:\s*3px solid/);
assert.match(page, /\\u25B6/);
assert.match(page, /\\u2717/);
assert.doesNotMatch(page, /LeRobot/i);
assert.doesNotMatch(page, /butter/i);
assert.doesNotMatch(page, /blur\(/i);
assert.doesNotMatch(page, /shake/i);
assert.equal((page.match(/box-shadow/g) || []).length, 1);
assert.match(hub, /href="\/pinchy\/"/);
assert.match(hub, /translate="no">Pinchy<\/span>/);

console.log("L1", l1win.join(" > "));
console.log("L2", l2win.join(" > "));
console.log("L3", l3win.join(" > "));
console.log("L4", l4win.join(" > "));
console.log("L5", l5win.join(" > "));
console.log("crash", line);
console.log("pinchy win-test ok");
