import assert from "node:assert/strict";
import { takeSteps, wantsCanvas, wantsMotionOff } from "../src/game/fx.js";
import {
  ALARM_MIN, bands, decidePose, goControls, homeControls, inside, lookoutControls, overlaps, pickerControls,
} from "../src/game/ui/bands.js";

const views = [[360, 740], [412, 915], [915, 412], [844, 390], [1366, 768]];

function canvasOf([w, h]) {
  return [w, Math.max(200, h - 48)];
}

function assertSet(name, list, w, h) {
  for (const rect of list) {
    assert.ok(inside(rect, w, h), name + " outside " + JSON.stringify(rect) + " in " + w + "x" + h);
    assert.ok(rect.w >= 44 && rect.h >= 44, name + " tap " + JSON.stringify(rect));
  }
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      assert.ok(!overlaps(list[i], list[j]), name + " overlap " + JSON.stringify(list[i]) + " " + JSON.stringify(list[j]));
    }
  }
}

let prev = null;
for (const view of views) {
  const pose = decidePose(view[0], view[1], prev);
  prev = pose;
  for (const rtl of [false, true]) {
    for (const size of [view, canvasOf(view)]) {
      const [w, h] = size;
      const b = bands(w, h, { rtl, pose, viewW: view[0], viewH: view[1] });
      assert.equal(b.pose, pose, "pose");
      if (pose === "upright") {
        assert.ok(b.field.h >= h * 0.55, "field " + b.field.h + " < 55% of " + h);
        assert.equal(b.alarms[0].y, b.alarms[1].y);
        assert.equal(b.alarms[1].y, b.alarms[2].y);
      } else {
        const single = b.alarms[0];
        const pair = b.alarms[1];
        if (!rtl) assert.ok(single.x < b.field.x && pair.x > b.field.x, "rails LTR");
        else assert.ok(single.x > b.field.x && pair.x < b.field.x, "rails RTL");
        assert.equal(b.cards.length, 6);
      }
      for (const alarm of b.alarms) assert.ok(alarm.h >= ALARM_MIN && alarm.w >= 64, "alarm " + JSON.stringify(alarm));
      const tag = w + "x" + h + (rtl ? " rtl" : "");
      assertSet("lookout " + tag, lookoutControls(b), w, h);
      assertSet("home " + tag, homeControls(b), w, h);
      assertSet("picker " + tag, pickerControls(b), w, h);
      assertSet("go " + tag, goControls(b), w, h);
    }
  }
}

assert.equal(decidePose(1000, 1060, "sideways"), "upright");
assert.equal(decidePose(1000, 940, "upright"), "sideways");
assert.equal(decidePose(1000, 1000, "sideways"), "sideways");
assert.equal(decidePose(1000, 1000, "upright"), "upright");
assert.equal(decidePose(1000, 1000, null), "upright");
assert.equal(wantsMotionOff({ setting: "full", attr: "", media: true }), true);
assert.equal(wantsMotionOff({ setting: "less", attr: "", media: false }), true);
assert.equal(wantsMotionOff({ setting: "full", attr: "less", media: false }), true);
assert.equal(wantsMotionOff({ setting: "full", attr: "", media: false }), false);
assert.equal(wantsCanvas({ lite: "on", liteAuto: false }), true);
assert.equal(wantsCanvas({ lite: "off", liteAuto: true }), false);
assert.equal(wantsCanvas({ lite: "auto", liteAuto: true }), true);
assert.equal(wantsCanvas({ lite: "auto", liteAuto: false }), false);
assert.equal(takeSteps(180, 40).steps, 0);
assert.equal(takeSteps(180, 40).acc, 0);
assert.equal(takeSteps(120, 0).steps, 6);
assert.ok(takeSteps(40, 0).steps >= 2);
console.log("bands-check ok");
