import atlas from "../../../public/assets/sprites/lookout-pixel.json";

const FONT = "Atkinson Hyperlegible, Noto Sans Arabic, Noto Sans Ethiopic, Noto Sans, sans-serif";

function hud() {
  let node = document.getElementById("ap-hud");
  if (!node) {
    node = document.createElement("div");
    node.id = "ap-hud";
    document.body.appendChild(node);
  }
  return node;
}

function paintIcon(node, frame) {
  const spec = frame && atlas.frames[frame];
  if (!spec) { node.hidden = true; return; }
  const box = spec.frame;
  const size = atlas.meta.size;
  node.hidden = false;
  node.style.width = Math.min(36, box.w) + "px";
  node.style.height = Math.min(36, box.h) + "px";
  const scale = Math.min(36 / box.w, 36 / box.h);
  node.style.backgroundImage = "url(/alice/assets/sprites/lookout-pixel.png)";
  node.style.backgroundPosition = (-box.x * scale) + "px " + (-box.y * scale) + "px";
  node.style.backgroundSize = (size.w * scale) + "px " + (size.h * scale) + "px";
  node.style.backgroundRepeat = "no-repeat";
  node.style.imageRendering = "pixelated";
}

export function makeButton(scene, cid, onDown) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "ap-hit";
  btn.dataset.cid = cid;
  btn.innerHTML = '<i class="ap-ico" hidden></i><span class="ap-lab"></span>';
  btn.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); if (onDown) onDown(); });
  hud().appendChild(btn);
  const data = { cid, bg: {
    setStrokeStyle(_w, color) { btn.style.borderColor = "#" + (color >>> 0).toString(16).padStart(6, "0"); },
    setFillStyle() { btn.style.background = "transparent"; btn.style.borderColor = "transparent"; },
    disableInteractive() { btn.style.pointerEvents = "none"; },
  } };
  const box = {
    btn,
    data,
    visible: true,
    setDepth() { return box; },
    setVisible(v) { box.visible = v; btn.hidden = !v; return box; },
    getData(key) { return data[key]; },
    setData(key, value) { data[key] = value; return box; },
    destroy() { btn.remove(); },
  };
  if (scene && scene.events) scene.events.once("shutdown", () => btn.remove());
  return box;
}

export function fitButton(box, rect, word, frame) {
  const btn = box.btn;
  if (!rect) { btn.hidden = true; box.visible = false; return; }
  const stage = document.getElementById("stage").getBoundingClientRect();
  box.visible = true;
  btn.hidden = false;
  btn.style.left = Math.round(stage.left + rect.x) + "px";
  btn.style.top = Math.round(stage.top + rect.y) + "px";
  btn.style.width = rect.w + "px";
  btn.style.height = rect.h + "px";
  const lab = btn.querySelector(".ap-lab");
  lab.textContent = word || "";
  lab.hidden = !word;
  paintIcon(btn.querySelector(".ap-ico"), frame);
  btn.style.fontFamily = FONT;
}

export function hideButton(box) {
  if (!box) return;
  box.visible = false;
  if (box.btn) box.btn.hidden = true;
}

export function showText(node, str, x, y, wrap) {
  const value = str || "";
  if (!value) { node.setText(""); node.setVisible(false); return; }
  node.setVisible(true);
  node.setPosition(x, y);
  if (wrap) node.setWordWrapWidth(wrap);
  node.setText(value);
}

export function intScale(sprite, target) {
  const fw = Math.max(1, sprite.frame.width);
  const z = Math.max(1, Math.floor(target / fw));
  sprite.setScale(z);
  return z;
}
