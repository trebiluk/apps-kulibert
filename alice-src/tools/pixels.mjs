/* Turn alice-src/art/*.txt pixel grids into a nearest-neighbor atlas. */
import { deflateSync } from "zlib";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ART = path.resolve(HERE, "../art");
const ZOOM = 2;
const MAX = 1024;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function pngRGBA(w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([sig, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

function parsePalette(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sym = trimmed[0];
    const rest = trimmed.slice(1).trim();
    if (!rest || rest === "transparent" || rest === ".") { map.set(sym, null); continue; }
    const hex = rest.replace("#", "");
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) throw new Error("bad color " + trimmed);
    map.set(sym, [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), 255]);
  }
  if (!map.has(".")) map.set(".", null);
  return map;
}

function parseFrames(text, file) {
  const frames = [];
  let name = "";
  let rows = [];
  const flush = () => {
    if (!name) return;
    if (!rows.length) throw new Error("empty frame " + name + " in " + file);
    const w = rows[0].length;
    if (!w || rows.some((row) => row.length !== w)) throw new Error("ragged frame " + name);
    frames.push({ name, rows, w, h: rows.length });
    name = "";
    rows = [];
  };
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) { flush(); continue; }
    if (trimmed.startsWith("#")) continue;
    if (trimmed.startsWith("frame ")) { flush(); name = trimmed.slice(6).trim(); continue; }
    if (!name) throw new Error("pixels outside a frame in " + file);
    rows.push(line.replace(/\s+$/, ""));
  }
  flush();
  return frames;
}

function shelf(frames) {
  const list = frames.slice().sort((a, b) => (b.h - a.h) || (b.w - a.w) || (a.name < b.name ? -1 : 1));
  const pad = 1;
  let x = 0;
  let y = 0;
  let rowH = 0;
  let usedW = 0;
  let usedH = 0;
  for (const frame of list) {
    if (x > 0 && x + frame.w > Math.floor(MAX / ZOOM)) { y += rowH + pad; x = 0; rowH = 0; }
    frame.px = x;
    frame.py = y;
    x += frame.w + pad;
    rowH = Math.max(rowH, frame.h);
    usedW = Math.max(usedW, x - pad);
    usedH = Math.max(usedH, y + frame.h);
  }
  if (usedW * ZOOM > MAX || usedH * ZOOM > MAX) throw new Error("atlas exceeds 1024");
  return { list, usedW, usedH };
}

function paint(list, palette, usedW, usedH) {
  const w = usedW * ZOOM;
  const h = usedH * ZOOM;
  const rgba = Buffer.alloc(w * h * 4);
  for (const frame of list) {
    for (let y = 0; y < frame.h; y++) {
      for (let x = 0; x < frame.w; x++) {
        const sym = frame.rows[y][x];
        if (!palette.has(sym)) throw new Error("unknown pixel " + sym + " in " + frame.name);
        const color = palette.get(sym);
        if (!color) continue;
        for (let dy = 0; dy < ZOOM; dy++) {
          for (let dx = 0; dx < ZOOM; dx++) {
            const px = (frame.px + x) * ZOOM + dx;
            const py = (frame.py + y) * ZOOM + dy;
            const i = (py * w + px) * 4;
            rgba[i] = color[0];
            rgba[i + 1] = color[1];
            rgba[i + 2] = color[2];
            rgba[i + 3] = color[3];
          }
        }
      }
    }
  }
  return { w, h, rgba };
}

function atlasJSON(list, w, h) {
  const frames = {};
  for (const frame of list) {
    const fw = frame.w * ZOOM;
    const fh = frame.h * ZOOM;
    frames[frame.name] = {
      frame: { x: frame.px * ZOOM, y: frame.py * ZOOM, w: fw, h: fh },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: fw, h: fh },
      sourceSize: { w: fw, h: fh },
    };
  }
  return { frames, meta: { app: "alice-pixels", image: "lookout-pixel.png", format: "RGBA8888", size: { w, h }, scale: String(ZOOM) } };
}

function loadFrames() {
  const palette = parsePalette(readFileSync(path.join(ART, "palette.txt"), "utf8"));
  const frames = [];
  const files = readdirSync(ART).filter((name) => name.endsWith(".txt") && name !== "palette.txt").sort();
  for (const file of files) frames.push(...parseFrames(readFileSync(path.join(ART, file), "utf8"), file));
  const names = new Set();
  for (const frame of frames) {
    if (names.has(frame.name)) throw new Error("duplicate frame " + frame.name);
    names.add(frame.name);
  }
  return { palette, frames };
}

export function buildAtlas() {
  const { palette, frames } = loadFrames();
  const packed = shelf(frames);
  const image = paint(packed.list, palette, packed.usedW, packed.usedH);
  return { png: pngRGBA(image.w, image.h, image.rgba), json: atlasJSON(packed.list, image.w, image.h), count: packed.list.length };
}

function writeBoth(png, json) {
  const targets = [
    path.resolve(HERE, "../public/assets/sprites"),
    path.resolve(HERE, "../../alice/assets/sprites"),
  ];
  for (const dir of targets) {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path.join(dir, "lookout-pixel.png"), png);
    writeFileSync(path.join(dir, "lookout-pixel.json"), JSON.stringify(json));
  }
}

const built = buildAtlas();
writeBoth(built.png, built.json);
console.log("pixels", built.count, built.json.meta.size.w + "x" + built.json.meta.size.h, built.png.length);
