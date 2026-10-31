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

assert.equal(G.APP_VERSION, "1.6.1");
assert.equal(G.LEVELS.length, 10);
assert.equal(G.LEVELS[6].id, "T3");
assert.ok(G.LEVELS[6].duo);
for (let i = 0; i < 6; i++) assert.ok(!G.LEVELS[i].duo, "L" + (i + 1) + " stays Berty-only");
assert.deepEqual(G.LEVELS.map(function (level) { return level.kind; }), ["match", "place", "spot", "pile", "sensor", "debug", "handoff", "handoff", "handoff", "handoff"]);
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
assert.equal(G.langMeta("ar").draft, true);
assert.equal(G.langMeta("en").draft, false);
assert.equal(G.langMeta("uk").draft, true);
assert.equal(G.langMeta("ru").draft, true);
assert.equal(G.langMeta("es").draft, true);
assert.equal(G.langMeta("ar").rtl, true);
assert.equal(G.langMeta("fa-AF").rtl, true);
assert.equal(G.langMeta("en").rtl, false);
assert.equal(G.langMeta("es").rtl, false);
assert.equal(G.labelFor("base-left", "en"), "Base left");
assert.equal(G.labelFor("base-right", "en"), "Base right");
assert.equal(G.labelFor("base-left", "es"), "Base izquierda");
assert.equal(G.labelFor("base-right", "es"), "Base derecha");
assert.equal(G.labelFor("base-left", "ar"), "القاعدة يسار");
assert.equal(G.labelFor("base-right", "ar"), "القاعدة يمين");
assert.equal(G.labelFor("base-left", "fa-AF"), "پایه چپ");
assert.equal(G.labelFor("base-right", "fa-AF"), "پایه راست");
assert.equal(G.langMeta("es").baseDraft, true);
assert.equal(G.langMeta("ar").baseDraft, true);
assert.equal(G.langMeta("fa-AF").baseDraft, true);
assert.equal(G.langMeta("en").baseDraft, undefined);
assert.equal(G.labelFor("shoulder-up", "es"), "Hombro arriba");
assert.equal(G.labelFor("claw-close", "ar"), "أغلق المخلب");
assert.equal(G.labelFor("elbow-down", "fa-AF"), "آرنج پایین");
assert.equal(G.labelFor("repeat-3", "es"), "Repetir 3");
assert.equal(G.actionLabel("run", "es"), "Ejecutar");
assert.equal(G.actionLabel("undo", "ar"), "تراجع");
assert.equal(G.actionLabel("retry", "fa-AF"), "تلاش دوباره");
assert.match(G.helpFor("es", false), /3D/);
assert.match(G.helpFor("ar", false), /3D/);
assert.match(G.helpFor("fa-AF", false), /3D/);
assert.equal(G.langMeta("es").blocksDraft, true);
assert.equal(G.langMeta("ar").blocksDraft, true);
assert.equal(G.langMeta("fa-AF").blocksDraft, true);
assert.equal(G.helpFor("en", false).indexOf("Q turns the base left in 3D") !== -1, true);
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

const l6 = G.LEVELS[5];
assert.equal(l6.debug, true);
assert.equal(l6.metric, "swaps");
const l6broken = l6.broken.slice();
assert.equal(G.runAll(l6, l6broken).win, false);
const l6fixed = G.swapSteps(l6broken, 6);
assert.deepEqual(l6broken, l6.broken);
assert.equal(G.runAll(l6, l6fixed).win, true, "L6 is winnable");
assert.equal(l6.par, 1);
assert.equal(G.starsFor(true, 1, 1000, l6), 3);
assert.equal(G.starsFor(true, 2, 1000, l6), 1);
assert.ok(l6.blocks.indexOf("wrist-up") !== -1);
assert.ok(l6.blocks.indexOf("wrist-down") !== -1);

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
assert.match(page, /Berty &amp; Bizzy/);
assert.doesNotMatch(page.replace(/data-k="w100a">[^<]*/, ""), /Pinchy McPinchface/);
assert.match(page, /translate="no"/);
assert.match(page, /IBM Plex Sans/);
assert.match(page, /#F4F0E6/);
assert.match(page, /#FBF8F1/);
assert.match(page, /#2A2620/);
assert.match(page, /#E8B400/);
assert.match(page, /#1E1C19/);
assert.match(page, /#EFE9DC/);
assert.match(page, /v1\.6\.1/);
assert.match(page, /Version 1\.3\.0/);
assert.match(page, /Version 1\.2\.2/);
assert.match(page, /Version 1\.2\.1/);
assert.match(page, /Move a robot arm\./);
assert.match(page, /Q turns the base left/);
assert.match(page, /in 3D/);
assert.match(page, /The 3D arm turns on its base/);
assert.match(page, /scene-labels/);
assert.match(page, /font:\s*600 14px/);
assert.match(page, /fill:\s*none/);
assert.match(page, /star\.classList\.toggle\("is-on", i <= view\.stars\)/);
const wonStars = { kind: "won", n: 3, note: "The shoulder matches the mark. 1 block, 0.5 s." };
assert.equal(G.runView(wonStars).stars, 3);
assert.equal(G.runView(wonStars).words, "Three stars.");
const afterRetry = G.settleRun(wonStars, { type: "retry" });
assert.equal(afterRetry.kind, "idle");
assert.equal(G.runView(afterRetry).stars, 0);
assert.equal(G.runView(afterRetry).words, "No stars yet.");
assert.equal(G.runView(afterRetry).aria, "No stars yet.");
assert.match(page, /aria-keyshortcuts/);
assert.match(page, /addBlock\("base-left"\)/);
assert.match(page, /addBlock\("base-right"\)/);
assert.match(page, /world: true/);
assert.match(page, /Spots A1 to C3 and the bins sit on the table/);
assert.match(page, /vendor\/three\.min\.js/);
assert.match(page, /view3d\.js/);
assert.doesNotMatch(page, /https?:\/\//);
assert.doesNotMatch(page, /unpkg|jsdelivr|cdn\./);
assert.match(page, /1\.0\.0/);
assert.match(page, /What's new/);
assert.match(page, /id="langs"/);
assert.match(page, /Machine draft/);
assert.match(page, /id="draft-note"/);
assert.match(page, /labelFor/);
assert.match(page, /Stars: done, under the block par, under the time par/);
assert.match(page, /They stay on this screen only/);
assert.match(page, /function renderRun|var renderRun/);
assert.equal((page.match(/role="status"/g) || []).length, 1);
assert.doesNotMatch(page, /id="step-live"/);
assert.doesNotMatch(page, /star-words"\)\.textContent = (?!view\.words)/);
const won = { kind: "won", n: 3, note: "The program works. 1 swap, 4.0 s." };
const l6fail = G.settleRun(won, { type: "fail", note: "The claw never closed on the part." });
assert.equal(l6fail.kind, "failed");
assert.equal(G.runView(l6fail).words, "No stars yet.");
assert.equal(G.runView(l6fail).aria, "No stars yet.");
assert.equal(G.runView(l6fail).stars, 0);
assert.equal(G.runView(l6fail).status, "The claw never closed on the part.");
const undone = G.settleRun(won, { type: "undo", note: "Undone." });
assert.equal(G.runView(undone).words, "No stars yet.");
assert.equal(G.runView(undone).status, "Undone.");
assert.doesNotMatch(G.runView(undone).status, /program works|Three stars/);
const rerun = G.settleRun(won, { type: "start", note: "Running step 2 of 12." });
assert.equal(rerun.kind, "running");
assert.equal(G.runView(rerun).words, "No stars yet.");
assert.equal(G.runView(rerun).stars, 0);
assert.equal(G.runView(rerun).status, "Running step 2 of 12.");
assert.equal(G.runView(won).words, G.runView(won).aria);
assert.match(G.runView(won).status, /Three stars\.$/);
let attempt = G.settleRun(null, { type: "level" });
attempt = G.settleRun(attempt, { type: "edit", delta: 1, note: "Swapped." });
assert.equal(attempt.swaps, 1);
attempt = G.settleRun(attempt, { type: "start", note: "Running." });
assert.equal(attempt.swaps, 0);
assert.equal(attempt.steps, 0);
assert.equal(attempt.scoredSwaps, 1);
assert.equal(G.starsFor(true, attempt.scoredSwaps, 1000, l6), 3);
attempt = G.settleRun(attempt, { type: "win", n: 3, swaps: attempt.scoredSwaps, note: "The program works. 1 swap, 1.0 s." });
assert.equal(G.runView(attempt).words, "Three stars.");
attempt = G.settleRun(attempt, { type: "retry" });
assert.equal(attempt.kind, "idle");
assert.equal(attempt.swaps, 0);
attempt = G.settleRun(attempt, { type: "edit", delta: 1 });
attempt = G.settleRun(attempt, { type: "start" });
assert.equal(attempt.scoredSwaps, 1);
assert.equal(G.starsFor(true, attempt.scoredSwaps, 1000, l6), 3);
attempt = G.settleRun(attempt, { type: "win", n: 3, swaps: attempt.scoredSwaps, note: "The program works. 1 swap, 1.0 s." });
assert.equal(G.runView(attempt).words, "Three stars.");
const afterThree = G.settleRun(attempt, { type: "fail", note: "The claw never closed on the part." });
assert.equal(G.runView(afterThree).words, "No stars yet.");
assert.equal(G.runView(afterThree).stars, 0);
assert.equal(G.runView(afterThree).status, "The claw never closed on the part.");
assert.match(page, /session\.programs\.length < PINCHY\.LEVELS\.length/);
assert.match(page, /document\.documentElement\.lang = lang/);
assert.doesNotMatch(page, /fa-AF" \? "fa"/);
assert.match(page, /e\.stopPropagation\(\)/);
assert.match(page, /e\.key !== "Enter" && e\.key !== " "/);
const stored = page.replace(/(localStorage|\bs)\.(get|set|remove)Item\("(pinchy-theme|kulibert-prefs-v1|bb-tips-off|bb-intro-seen)"[^)]*\)/g, "").replace(/window\.(sessionStorage|localStorage)/g, "").replace(/bbStore\("(session|local)"\)/g, "");
assert.doesNotMatch(page, /access-v1|kulibert-prefs\.js/);
assert.doesNotMatch(stored, /localStorage|sessionStorage|indexedDB/);
assert.match(page, /bb-tips-off/);
assert.match(page, /bb-intro-seen/);
assert.match(page, /bb-best-v1/);
assert.match(page, /pinchy-theme/);
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
assert.match(hub, /href="\/berty-bizzy\/"/);
assert.match(hub, /data-door="\/berty-bizzy\/"[^>]*><a href="\/berty-bizzy\/">Berty &amp; Bizzy <strong>v1\.6\.1<\/strong>/);
assert.doesNotMatch(hub, /href="\/pinchy\/"/);
const vj = JSON.parse(fs.readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
for (const src of ["/pinchy", "/pinchy/", "/pinchy/:path*"]) {
  const r = vj.redirects.find(x => x.source === src);
  assert.ok(r && r.permanent === true && r.destination === "/berty-bizzy/", "308 redirect for " + src + " goes to /berty-bizzy/, never to a path that may not exist");
}
assert.match(hub, /translate="no">Berty &amp; Bizzy<\/span>/);

console.log("L1", l1win.join(" > "));
console.log("L2", l2win.join(" > "));
console.log("L3", l3win.join(" > "));
console.log("L4", l4win.join(" > "));
console.log("L5", l5win.join(" > "));
console.log("L6", l6fixed.join(" > "));
console.log("crash", line);

// 1.3.2: every language names every chrome string the ShipCheck listed, and none falls back to English.
var CHROME = ["estop", "clear", "themeDark", "themeLight", "Base", "Shoulder", "Elbow", "Wrist", "Claw", "degrees", "clawOpen", "clawShut",
  "OPEN", "SHUT", "No stars yet.", "One star.", "Two stars.", "Three stars.", "Add a block, then press Run.", "Add blocks, then press Run.",
  "starRules", "blocksLine", "timeNone", "timeLine", "swapsLine", "draftBadge", "whatsTitle", "whatsClose", "hubLine", "menu", "v161", "w161a", "w161b", "v160", "w160a", "w160b", "w160c", "cardDone", "cardCycle", "cardBlocks", "cardParts", "cardBest", "cardNew", "cardTry", "cardNext", "cardClose", "cardAria", "syncLone", "syncStuck", "T4", "T5", "T6", "T4-goal", "T5-goal", "T6-goal", "hb9", "hf6", "v150", "w150a", "w150b", "w150c", "nameBerty", "nameBizzy", "dof", "dofTitle", "laneAria", "laneNow", "armHit", "bothHold", "T3", "T3-goal", "legendDuo", "hb8", "hf5", "v140", "w140a", "w140b", "v132", "w132a", "w132b", "hi", "skipHint", "tip1", "tip2", "tipClose", "tipOff", "helpBtn", "helpTitle", "helpBlocksH", "hb1", "hb2", "hb3", "hb4", "hb5", "hb6", "hb7", "helpControlsH", "helpFailH", "hf1", "hf2", "hf3", "hf4", "resetTips", "helpClose", "tipsBack", "tagline",
  "v131", "w131a", "v130", "w130b", "v122", "w122d", "v121", "w121c", "v120", "w120b", "v110", "w110b", "v100", "w100c"];
var LANG_IDS = ["en", "uk", "ru", "es", "ar", "fa-AF", "rw", "ti"];
var SAME_OK = { "es T6": 0, "es Base": 1, "es nameBerty": 1, "es nameBizzy": 1, "rw nameBerty": 1, "rw nameBizzy": 1, "rw dof": 1, "ti dof": 1 };
var NO_LATIN = { ar: 1, "fa-AF": 1, ti: 1, uk: 1, ru: 1 };
for (var li = 0; li < LANG_IDS.length; li++) {
  var code = LANG_IDS[li];
  assert.equal(G.langMeta(code).id, code);
  assert.ok(G.langMeta(code).appName, code + " has an app name");
  for (var ci = 0; ci < CHROME.length; ci++) {
    var got = G.uiText(code, CHROME[ci]);
    assert.ok(got && (code === "en" || SAME_OK[code + " " + CHROME[ci]] || got !== CHROME[ci]), code + " " + CHROME[ci] + " resolves");
    if (code !== "en" && !SAME_OK[code + " " + CHROME[ci]]) assert.notEqual(got, G.uiText("en", CHROME[ci]), code + " " + CHROME[ci] + " is not English");
  }
  if (code !== "en") assert.equal(G.langMeta(code).draft, true, code + " is a machine draft");
  var jline = G.jointReadout({ base: 0, shoulder: 0, elbow: 0, wrist: 0, open: true }, code);
  if (NO_LATIN[code]) assert.ok(!/[A-Za-z]/.test(jline.replace(/\{n\}/g, "")), code + " joint summary has no English: " + jline);
  if (code !== "en") assert.ok(G.runView({ kind: "idle", note: "Add blocks, then press Run." }, code).status !== "Add blocks, then press Run.");
  if (code !== "en") assert.ok(G.starWords(0, code) !== "No stars yet.");
}

assert.equal(G.uiText("en", "tip1"), "Press Run. Watch Berty pick up the cube.");
assert.equal(G.uiText("en", "tip2"), "Each block turns one joint 15\u00b0.");
assert.equal(G.uiText("en", "hi"), "Hi! I'm Berty. I'm Bizzy.");

// 1.5.0: two arms, two lanes, one hand-off level.
{
  const T3 = G.LEVELS[6];
  const rep = (a, n) => Array(n).fill(a);
  const B = [].concat(rep("shoulder-down", 2), rep("elbow-down", 2), ["claw-close"], rep("base-right", 3), ["claw-open"]);
  const Z = [].concat(rep("base-left", 3), rep("shoulder-down", 2), rep("elbow-down", 2), ["claw-open", "claw-close"], rep("base-right", 5), ["claw-open"]);
  const both = G.runAllDuo(T3, B, Z);
  assert.equal(both.win, true, "hand-off is won with both lanes: " + both.crash);
  assert.equal(both.ticks, 15);
  assert.equal(G.runAllDuo(T3, B, []).win, false, "Berty alone cannot win");
  assert.equal(G.runAllDuo(T3, [], Z).win, false, "Bizzy alone cannot win");
  // the hand-off needs a claw to close before the other opens in the same tick
  const swappedOrder = G.runAllDuo(T3, B.slice(0, 8), Z.slice(0, 8).concat(["claw-open"]));
  assert.equal(swappedOrder.win, false);
  // arm to arm check: both turn to the middle and Berty's elbow meets Bizzy's wrist at step 3
  const clash = G.runAllDuo(T3, rep("base-right", 3), rep("base-left", 3));
  assert.equal(clash.win, false);
  assert.deepEqual([clash.armHit.a, clash.armHit.pa, clash.armHit.b, clash.armHit.pb], ["berty", "elbow", "bizzy", "wrist"]);
  assert.equal(clash.step, 3);
  assert.equal(G.armHitLine(clash.armHit, 3, "en"), "Berty's elbow hit Bizzy's wrist (step 3).");
  for (const code of LANG_IDS) {
    const line = G.armHitLine(clash.armHit, 7, code);
    assert.ok(line.indexOf("{") < 0 && line.indexOf("7") >= 0, code + " armHit line is filled in: " + line);
    if (code !== "en") assert.notEqual(line, G.armHitLine(clash.armHit, 7, "en"));
  }
  // both claws on the part: nobody may move
  const held = G.initialState(T3);
  held.holding = true;
  held.bizzy.holding = true;
  const stuck = G.duoTick(held, { berty: "base-left", bizzy: "" }, T3);
  assert.equal(stuck.ok, false);
  assert.equal(stuck.bothHold, true);
  // Bizzy is the same rig, mirrored on the right: 5 joints, same limits
  const z = G.armOf(G.initialState(T3), "bizzy");
  assert.deepEqual(Object.keys(z).filter(k => ["base", "shoulder", "elbow", "wrist", "gap"].includes(k)).sort(), ["base", "elbow", "gap", "shoulder", "wrist"]);
  assert.equal(G.LAYOUT.bizzyX, 190);
  // levels 1 to 6 carry no second arm in their state
  for (let i = 0; i < 6; i++) assert.equal(G.initialState(G.LEVELS[i]).bizzy, undefined);
}

// 1.6.0: Sync and Wait blocks, three more hand-off levels, cycle time.
{
  const rep = (a, n) => Array(n).fill(a);
  const lv = id => G.LEVELS.find(l => l.id === id);
  for (const id of ["sync-a", "sync-b", "sync-c", "wait-other", "wait-half"]) {
    assert.ok(G.blockById(id), id + " is a block");
    for (const code of LANG_IDS) assert.ok(G.labelFor(id, code), code + " names " + id);
  }
  for (const id of ["T4", "T5", "T6"]) {
    assert.ok(lv(id).duo);
    assert.ok(lv(id).blocks.includes("sync-a") && lv(id).blocks.includes("wait-other") && lv(id).blocks.includes("wait-half"), id + " offers the Sync and Wait blocks");
  }
  assert.ok(!lv("T3").blocks.includes("sync-a"), "T3 is unchanged");
  assert.ok(!G.LEVELS.slice(0, 6).some(l => (l.blocks || []).some(b => /^(sync|wait)-/.test(b))), "levels 1 to 6 are unchanged");
  // T4: the waiting arm waits at Sync A. 18 blocks, same 15 beats as padding with 24.
  const B4 = [].concat(rep("shoulder-down", 2), rep("elbow-down", 2), ["claw-close"], rep("base-right", 3), ["sync-a", "claw-open"]);
  const Z4 = [].concat(["sync-a", "claw-close"], rep("base-right", 5), ["claw-open"]);
  const r4 = G.runAllDuo(lv("T4"), B4, Z4);
  assert.equal(r4.win, true, "T4 with Sync A: " + r4.crash);
  assert.equal(r4.beats, 15);
  assert.equal(r4.cycle, 7.5);
  assert.equal(r4.blocks, 18);
  assert.equal(r4.parts, 1);
  const pad = G.runAllDuo(lv("T4"), B4.filter(c => c !== "sync-a"), [].concat(rep("claw-open", 8), ["claw-close"], rep("base-right", 5), ["claw-open"]));
  assert.equal(pad.win, true);
  assert.ok(pad.blocks > lv("T4").par && r4.blocks <= lv("T4").par, "only the Sync solution is under the block par");
  // the faster arm waits: Bizzy stays still at the Sync until Berty gets there
  {
    let st = G.initialState(lv("T4")); const runs = G.beginDuoRun(B4, Z4); const bizzyBase = []; let sawWait = false, sawRelease = false;
    for (let i = 0; i < 40; i++) { const ev = G.duoAdvance(runs, st, lv("T4")); if (ev.done) break; if (ev.release) { sawRelease = true; assert.equal(ev.cmd, "sync-a"); assert.ok(ev.index >= 0 && ev.indexZ >= 0, "both lanes are highlighted at the release"); continue; } if (ev.waitZ) { sawWait = true; assert.equal(ev.cmdZ, ""); } st = ev.state; bizzyBase.push(G.armOf(st, "bizzy").base); if (ev.win) break; }
    assert.ok(sawWait && sawRelease);
    assert.equal(new Set(bizzyBase.slice(0, 8)).size, 1, "Bizzy does not move while it waits at Sync A");
  }
  // T5: the other way round
  const B5 = [].concat(["sync-a", "claw-close"], rep("base-left", 5), ["claw-open"]);
  const Z5 = [].concat(rep("shoulder-down", 2), rep("elbow-down", 2), ["claw-close"], rep("base-left", 3), ["sync-a", "claw-open"]);
  assert.equal(G.runAllDuo(lv("T5"), B5, Z5).win, true);
  // T6: two cubes with Repeat 2 and two Syncs
  const B6 = [].concat(rep("shoulder-down", 2), rep("elbow-down", 2), ["repeat-2", "claw-close"], rep("base-right", 3), ["sync-a", "claw-open"], rep("base-left", 3), ["sync-b", "end-repeat"]);
  const Z6 = [].concat(["repeat-2", "sync-a", "claw-close"], rep("base-right", 5), ["claw-open", "sync-b"], rep("base-left", 5), ["end-repeat"]);
  const r6 = G.runAllDuo(lv("T6"), B6, Z6);
  assert.equal(r6.win, true, "T6: " + r6.crash);
  assert.equal(r6.parts, 2);
  assert.equal(r6.cycle, 13.5);
  assert.ok(r6.blocks <= lv("T6").par);
  // a Sync with no match names the lane and the step before anything moves
  const lone = G.runAllDuo(lv("T4"), ["claw-open", "claw-open", "sync-a"], ["claw-open"]);
  assert.deepEqual([lone.win, lone.sync.who, lone.sync.cmd, lone.sync.index, lone.beats], [false, "berty", "sync-a", 2, 0]);
  assert.equal(G.syncLoneLine(lone.sync, "en"), "Berty's Sync A (step 3) has no match in Bizzy's lane.");
  const lone2 = G.runAllDuo(lv("T4"), ["claw-open"], ["claw-open", "sync-b"]);
  assert.equal(G.syncLoneLine(lone2.sync, "en"), "Bizzy's Sync B (step 2) has no match in Berty's lane.");
  for (const code of LANG_IDS) {
    const line = G.syncLoneLine(lone.sync, code);
    assert.ok(line.indexOf("{") < 0 && line.indexOf("3") >= 0, code + " sync line is filled in: " + line);
  }
  // crossed Syncs would wait for ever: the run stops and names the arm that waits
  const crossed = G.runAllDuo(lv("T4"), ["sync-a", "sync-b"], ["sync-b", "sync-a"]);
  assert.equal(crossed.win, false);
  assert.deepEqual([crossed.stuck.who, crossed.stuck.cmd, crossed.stuck.index], ["berty", "sync-a", 0]);
  assert.equal(G.syncStuckLine(crossed.stuck, "en"), "Berty waits at Sync A (step 1), but Bizzy never gets there.");
  // Wait for other arm holds while the other arm moves a joint; Wait 0.5 s is one idle beat
  {
    let st = G.initialState(lv("T4")); const runs = G.beginDuoRun(rep("base-right", 3), ["wait-other", "wait-half", "claw-open"]);
    const waits = []; for (let i = 0; i < 8; i++) { const ev = G.duoAdvance(runs, st, lv("T4")); if (ev.done) break; waits.push(ev.waitZ ? "w" : "."); st = ev.state; }
    assert.equal(waits.slice(0, 3).join(""), "www", "Bizzy waits for each of Berty's three moves");
    assert.equal(runs.beats, 6);
  }
  assert.equal(G.cycleSeconds({ beats: 15 }), 7.5);
}
console.log("berty-bizzy win-test ok");
