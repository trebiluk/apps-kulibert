import { APP_CHIP, APP_VERSION } from "./version.js";

export const FORMAT = 1;
export const PIECE_CAP = 48;

export function blankMachine() {
  return { parts: [] };
}

export function defaultLevel() {
  return {
    shop: { x: 1.2, y: 1.2, w: 8.2, h: 4.6 },
    drop: { x: 20.2, y: 1.2, w: 4.6, h: 3.4 },
    world: [
      { type: "slab", x: 0, y: 0, w: 28, h: 1.2 },
      { type: "slab", x: 0, y: 1.2, w: 0.4, h: 10 },
      { type: "slab", x: 27.6, y: 1.2, w: 0.4, h: 10 },
    ],
    cores: [{ x: 6.4, y: 1.48 }],
    tools: ["driveR", "driveL", "roller", "steel", "ghost"],
  };
}

export function defaultDoc() {
  return {
    app: "bertybots",
    format: FORMAT,
    title: "Open Shop",
    appVersion: APP_CHIP,
    level: defaultLevel(),
    machine: blankMachine(),
  };
}

export function sanitizeTitle(raw) {
  const t = String(raw || "").replace(/\s+/g, " ").trim().slice(0, 48);
  return t || "Open Shop";
}

export function packDoc(doc) {
  return {
    app: "bertybots",
    format: FORMAT,
    title: sanitizeTitle(doc.title),
    appVersion: APP_VERSION,
    level: {
      shop: { ...doc.level.shop },
      drop: { ...doc.level.drop },
      world: (doc.level.world || []).map((w) => ({ ...w })),
      cores: (doc.level.cores || []).map((c) => ({ x: c.x, y: c.y })),
      tools: [...(doc.level.tools || defaultLevel().tools)],
    },
    machine: {
      parts: (doc.machine.parts || []).map((p) => ({ ...p })),
    },
  };
}

export function unpackDoc(raw) {
  const base = defaultDoc();
  if (!raw || raw.app !== "bertybots") throw new Error("Not a Berty's Botz file.");
  const level = raw.level || {};
  const shop = { ...base.level.shop, ...(level.shop || {}) };
  const drop = { ...base.level.drop, ...(level.drop || {}) };
  const world = Array.isArray(level.world) ? level.world.map((w) => ({ ...w })) : base.level.world;
  const cores = Array.isArray(level.cores) && level.cores.length
    ? level.cores.slice(0, 3).map((c) => ({ x: +c.x, y: +c.y }))
    : base.level.cores;
  const tools = Array.isArray(level.tools) && level.tools.length ? level.tools : base.level.tools;
  const parts = raw.machine && Array.isArray(raw.machine.parts) ? raw.machine.parts.map((p) => ({ ...p })) : [];
  return {
    app: "bertybots",
    format: FORMAT,
    title: sanitizeTitle(raw.title),
    level: { shop, drop, world, cores, tools },
    machine: { parts },
  };
}

export function downloadDoc(doc, filename) {
  const blob = new Blob([JSON.stringify(packDoc(doc), null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  const safe = (filename || sanitizeTitle(doc.title) || "shop").replace(/[^\w.-]+/g, "-").toLowerCase();
  a.href = URL.createObjectURL(blob);
  a.download = safe.endsWith(".bertybots.json") ? safe : `${safe}.bertybots.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1500);
}

export function readFile(file) {
  return file.text().then((text) => unpackDoc(JSON.parse(text)));
}
