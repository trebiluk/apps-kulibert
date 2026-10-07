import atlas from "../../../public/assets/sprites/lookout-pixel.json";

const FONT = "Atkinson Hyperlegible, Noto Sans Arabic, Noto Sans Ethiopic, Noto Sans, sans-serif";
const LIGHT_INK = ["speaker", "help-q"];
const iconCache = {};
let sheetPromise = null;

function hud() {
  let node = document.getElementById("ap-hud");
  if (!node) {
    node = document.createElement("div");
    node.id = "ap-hud";
    document.body.appendChild(node);
  }
  return node;
}

function loadSheet() {
  if (!sheetPromise) {
    sheetPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("sheet"));
      img.src = "/alice/assets/sprites/lookout-pixel.png";
    });
  }
  return sheetPromise;
}

function recolor(img, box) {
  const canvas = document.createElement("canvas");
  canvas.width = box.w;
  canvas.height = box.h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, box.x, box.y, box.w, box.h, 0, 0, box.w, box.h);
  const data = ctx.getImageData(0, 0, box.w, box.h);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 16) continue;
    const lum = (px[i] * 299 + px[i + 1] * 587 + px[i + 2] * 114) / 1000;
    if (lum < 96) { px[i] = 248; px[i + 1] = 250; px[i + 2] = 252; }
  }
  ctx.putImageData(data, 0, 0);
  return canvas.toDataURL();
}

function paintIcon(node, frame) {
  const spec = frame && atlas.frames[frame];
  if (!spec) { node.hidden = true; node.style.backgroundImage = "none"; return; }
  const box = spec.frame;
  const size = atlas.meta.size;
  node.hidden = false;
  node.style.width = Math.min(36, box.w) + "px";
  node.style.height = Math.min(36, box.h) + "px";
  node.dataset.frame = frame;
  if (LIGHT_INK.indexOf(frame) >= 0) {
    const apply = (url) => {
      if (node.dataset.frame !== frame) return;
      node.style.backgroundImage = "url(" + url + ")";
      node.style.backgroundPosition = "0 0";
      node.style.backgroundSize = Math.min(36, box.w) + "px " + Math.min(36, box.h) + "px";
      node.style.backgroundRepeat = "no-repeat";
      node.style.imageRendering = "pixelated";
    };
    if (iconCache[frame]) { apply(iconCache[frame]); return; }
    node.style.backgroundImage = "none";
    loadSheet().then((img) => {
      iconCache[frame] = recolor(img, box);
      apply(iconCache[frame]);
    }).catch(() => {});
    return;
  }
  node.style.backgroundImage = "url(/alice/assets/sprites/lookout-pixel.png)";
  const scale = Math.min(36 / box.w, 36 / box.h);
  node.style.backgroundPosition = (-box.x * scale) + "px " + (-box.y * scale) + "px";
  node.style.backgroundSize = (size.w * scale) + "px " + (size.h * scale) + "px";
  node.style.backgroundRepeat = "no-repeat";
  node.style.imageRendering = "pixelated";
}

export function makeButton(scene, cid, onDown, opts) {
  const card = !!(opts && opts.card);
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = card ? "ap-hit ap-cardrow" : "ap-hit ap-scene";
  btn.dataset.cid = cid;
  btn.innerHTML = '<i class="ap-ico" hidden></i><span class="ap-lab"></span>';
  btn.addEventListener("pointerdown", (ev) => { ev.preventDefault(); ev.stopPropagation(); if (onDown) onDown(); });
  hud().appendChild(btn);
  const data = { cid, bg: {
    setStrokeStyle(_w, color) { btn.style.borderColor = "#" + (color >>> 0).toString(16).padStart(6, "0"); },
    setFillStyle() { btn.style.background = "transparent"; btn.style.borderColor = "transparent"; },
    disableInteractive() { btn.style.pointerEvents = "auto"; },
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

export function showCard(rect) {
  const root = hud();
  let scrim = document.getElementById("ap-scrim");
  if (!scrim) {
    scrim = document.createElement("div");
    scrim.id = "ap-scrim";
    root.appendChild(scrim);
  }
  let panel = document.getElementById("ap-card");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "ap-card";
    root.appendChild(panel);
  }
  const stage = document.getElementById("stage").getBoundingClientRect();
  scrim.hidden = false;
  scrim.style.left = Math.round(stage.left) + "px";
  scrim.style.top = Math.round(stage.top) + "px";
  scrim.style.width = Math.round(stage.width) + "px";
  scrim.style.height = Math.round(stage.height) + "px";
  panel.hidden = false;
  panel.style.left = Math.round(stage.left + rect.x) + "px";
  panel.style.top = Math.round(stage.top + rect.y) + "px";
  panel.style.width = Math.round(rect.w) + "px";
  panel.style.height = Math.round(rect.h) + "px";
  document.body.classList.add("ap-card");
}

export function hideCard() {
  const scrim = document.getElementById("ap-scrim");
  const panel = document.getElementById("ap-card");
  if (scrim) scrim.hidden = true;
  if (panel) panel.hidden = true;
  document.body.classList.remove("ap-card");
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
