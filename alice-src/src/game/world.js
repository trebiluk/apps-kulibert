import { skyGradient } from "./looks.js";
import { settings } from "./save.js";
import { intScale } from "./ui/widgets.js";
import {
  decorOn, driftTile, easeScroll, flyPath, motionOff,
  tickBirds, tickGlow, tickHoppers, tickMotes, tickPuddles,
} from "./fx.js";

const ORDER = ["Sunny", "Breezy", "Drizzle", "Snowy", "Night"];
const TILES = ["tile-0", "tile-1", "tile-2", "tile-3", "tile-4", "tile-5", "tile-6"];

export function dailyWeather(now = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now - start) / 86400000);
  return ORDER[((day % 5) + 5) % 5];
}

export function weatherFor(level, now = new Date()) {
  const raw = level && level.field;
  if (raw && ORDER.indexOf(raw) >= 0) return raw;
  const id = (level && level.id) || "";
  if (id === "lookout-daily") return dailyWeather(now);
  if (id === "lookout-L04" || id === "lookout-L06") return "Breezy";
  if (id === "lookout-L05") return "Drizzle";
  return "Sunny";
}

function hash(x, y, salt) {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(salt, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return (n ^ (n >>> 16)) >>> 0;
}

function canvasLite(scene) {
  if ((settings().lite || "auto") === "on") return true;
  const renderer = scene.game && scene.game.renderer;
  return !!(renderer && renderer.type === 1);
}

function holdFrame(sprite) {
  if (!sprite) return;
  if (!sprite.getData("held")) sprite.setData("held", sprite.frame ? sprite.frame.name : "");
  const held = sprite.getData("held");
  if (held) sprite.setFrame(held);
  if (sprite.anims && sprite.anims.pause) sprite.anims.pause();
}

function ensureTileset(scene) {
  if (scene.textures.exists("prairie-tiles")) return true;
  const tex = scene.textures.get("lookout");
  if (!tex || !tex.getSourceImage) return false;
  const img = tex.getSourceImage();
  const tw = 32;
  const canvas = scene.textures.createCanvas("prairie-tiles", tw * TILES.length, tw);
  if (!canvas || !canvas.getContext) return false;
  const ctx = canvas.getContext();
  ctx.imageSmoothingEnabled = false;
  TILES.forEach((name, i) => {
    const frame = scene.textures.getFrame("lookout", name);
    if (!frame) return;
    ctx.drawImage(img, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, i * tw, 0, tw, tw);
  });
  canvas.refresh();
  return true;
}

function paintSky(scene, sky, w, h, weather) {
  const colors = skyGradient(settings().look, weather);
  if (scene.cameras && scene.cameras.main) scene.cameras.main.setBackgroundColor(colors.flat);
  if (!sky) return;
  sky.clear();
  try {
    sky.fillGradientStyle(colors.top, colors.top, colors.bot, colors.bot, 1);
    sky.fillRect(0, 0, Math.max(2, w), Math.max(2, h));
  } catch (e) {
    sky.fillStyle(colors.bot, 1);
    sky.fillRect(0, 0, Math.max(2, w), Math.max(2, h));
  }
}

function webgl(scene) {
  return !!(scene.game && scene.game.renderer && scene.game.renderer.type === 2);
}

export function createPrairie(scene) {
  const rich = !canvasLite(scene);
  const api = {
    weather: "Sunny",
    laid: "",
    field: { x: 0, y: 0, w: 2, h: 2 },
    groundY: 0,
    clock: { on: false, last: 0 },
    froze: motionOff(),
    liveParts: 0,
  };
  api.sky = scene.add.graphics().setScrollFactor(0).setDepth(-8);
  api.farHills = null;
  api.nearHills = null;
  api.clouds = null;
  api.tufts = [];
  api.butterflies = [];
  api.hoppers = [];
  api.birds = [];
  api.puddles = [];
  api.motes = [];
  api.lights = [];
  api.fieldLayer = null;
  api.fieldMap = null;
  api.groundLine = null;
  if (rich) {
    api.farHills = scene.add.tileSprite(0, 0, 32, 32, "lookout", "hill-far").setScrollFactor(0.2).setDepth(-6).setAlpha(0.95);
    api.nearHills = scene.add.tileSprite(0, 0, 32, 32, "lookout", "hill-near").setScrollFactor(0.5).setDepth(-4);
    api.clouds = scene.add.tileSprite(0, 0, 32, 32, "lookout", "cloud").setScrollFactor(0.2).setDepth(-5).setAlpha(0.8);
    api.tufts = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
      const spr = scene.add.sprite(0, 0, "lookout", "grass-" + (i % 3)).setDepth(2).setScrollFactor(1);
      spr.play({ key: "grass-sway", startFrame: i % 3 });
      if (spr.anims) spr.anims.setProgress((i * 0.17) % 1);
      return spr;
    });
    api.butterflies = [0, 1, 2].map((i) => scene.add.sprite(-200, -200, "lookout", "butterfly-0").play("butterfly").setDepth(4).setScrollFactor(1).setData("i", i));
    api.birds = [0, 1, 2, 3].map(() => scene.add.sprite(-300, -300, "lookout", "bird-0").play("bird").setDepth(-3).setScrollFactor(0.2).setVisible(false));
    api.puddles = [0, 1, 2, 3].map((i) => scene.add.image(0, 0, "lookout", "puddle").setDepth(1).setScrollFactor(1).setVisible(false).setData("p", i));
    const group = scene.add.group();
    const frames = { Sunny: "mote", Drizzle: "drop", Snowy: "flake", Night: "glow" };
    for (let i = 0; i < 36; i++) {
      const mote = scene.add.image(0, 0, "lookout", "mote").setDepth(7).setScrollFactor(1).setVisible(false);
      mote.setData("p", i * 0.4);
      mote.setData("frames", frames);
      group.add(mote);
      api.motes.push(mote);
    }
    api.moteGroup = group;
    try {
      for (let i = 0; i < 6; i++) {
        const lamp = scene.add.pointlight(-400, -400, 0xffe7a0, 36, 0.35, 0.05).setDepth(4).setScrollFactor(1).setVisible(false);
        lamp.setData("p", i * 0.8);
        api.lights.push(lamp);
      }
    } catch (e) { api.lights = []; }
    api.groundLine = scene.add.rectangle(0, 0, 8, 8, 0x000000, 0).setVisible(false).setDepth(1);
    scene.physics.add.existing(api.groundLine, true);
    const hoppers = scene.physics.add.group({ allowGravity: true, collideWorldBounds: true });
    for (let i = 0; i < 2; i++) {
      const h = hoppers.create(-200, -200, "lookout", "hopper-0");
      h.setDepth(3).setScrollFactor(1).play("hopper");
      h.setBounce(0.4);
      h.setCollideWorldBounds(true);
      h.body.setAllowGravity(false);
      h.body.enable = false;
      api.hoppers.push(h);
    }
    scene.physics.add.collider(hoppers, api.groundLine);
    if (scene.physics.world) scene.physics.world.gravity.y = 860;
  }

  api.layers = () => {
    if (!rich) return api.fieldLayer && api.fieldLayer.visible ? 1 : 0;
    let n = 0;
    if (api.farHills && api.farHills.visible) n += 1;
    if (api.nearHills && api.nearHills.visible) n += 1;
    if (api.clouds && api.clouds.visible) n += 1;
    if (api.fieldLayer && api.fieldLayer.visible) n += 1;
    return n;
  };

  api.parts = () => api.liveParts;

  api.layout = (w, h, field, holes, weather, salt) => {
    api.weather = ORDER.indexOf(weather) >= 0 ? weather : "Sunny";
    api.field = field;
    const groundTop = Math.round(field.y + field.h * 0.4);
    api.groundY = Math.round(field.y + field.h * 0.86);
    paintSky(scene, api.sky, w, h, api.weather);
    const showRich = rich;
    if (api.farHills) api.farHills.setVisible(showRich);
    if (api.nearHills) api.nearHills.setVisible(showRich);
    if (api.clouds) api.clouds.setVisible(showRich);
    if (showRich) {
      const farH = Math.max(32, Math.floor(field.h * 0.28));
      const nearH = Math.max(32, Math.floor(field.h * 0.24));
      const cloudH = Math.max(24, Math.floor(field.h * 0.16));
      api.farHills.setPosition(field.x + field.w / 2, field.y + farH * 0.55).setSize(Math.max(32, field.w), farH);
      api.nearHills.setPosition(field.x + field.w / 2, groundTop - 8).setSize(Math.max(32, field.w), nearH);
      api.clouds.setPosition(field.x + field.w / 2, field.y + cloudH * 0.45).setSize(Math.max(32, field.w), cloudH);
      const breezy = api.weather === "Breezy";
      api.clouds.setAlpha(breezy ? 0.95 : 0.62);
      api.clouds.setTileScale(breezy ? 1.35 : 1, 1);
      api.farHills.tilePositionX = breezy ? 8 : 0;
    }
    const key = [Math.round(field.w), Math.round(field.h), Math.round(field.x), groundTop, api.weather, salt, (holes || []).map((hole) => (hole.x | 0) + ":" + (hole.y | 0)).join(".")].join("|");
    if (key !== api.laid && ensureTileset(scene)) {
      api.laid = key;
      if (api.fieldMap) {
        try { api.fieldMap.destroy(); } catch (e) {}
        api.fieldMap = null;
        api.fieldLayer = null;
      }
      const tw = 32;
      const cols = Math.max(2, Math.ceil(field.w / tw));
      const rows = Math.max(2, Math.ceil((field.y + field.h - groundTop) / tw));
      const data = [];
      const snow = api.weather === "Snowy";
      for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < cols; x++) {
          const px = field.x + x * tw + tw / 2;
          const py = groundTop + y * tw + tw / 2;
          let near = false;
          for (let i = 0; i < (holes || []).length; i++) {
            const dx = px - holes[i].x;
            const dy = py - holes[i].y;
            if (dx * dx + dy * dy < 46 * 46) { near = true; break; }
          }
          const n = hash(x, y, salt || 1);
          let tile = n % 3;
          if (!snow && n % 11 === 0) tile = 3;
          if (near) tile = n % 2 === 0 ? 3 : 4;
          if (snow) tile = n % 4 === 0 ? 6 : 5;
          row.push(tile);
        }
        data.push(row);
      }
      try {
        const map = scene.make.tilemap({ data, tileWidth: tw, tileHeight: tw });
        const tiles = map.addTilesetImage("prairie-tiles");
        const layer = map.createLayer(0, tiles, field.x, groundTop);
        if (layer) {
          layer.setDepth(0).setScrollFactor(1);
          api.fieldMap = map;
          api.fieldLayer = layer;
        }
      } catch (e) {}
    } else if (api.fieldLayer) {
      api.fieldLayer.setPosition(field.x, groundTop);
    }
    if (!showRich) return;
    api.tufts.forEach((tuft, i) => {
      intScale(tuft, 28);
      const x = field.x + 16 + ((field.w - 32) * i) / Math.max(1, api.tufts.length - 1);
      tuft.setPosition(Math.round(x), Math.round(field.y + field.h - 18));
      tuft.setAngle(api.weather === "Breezy" ? 14 : 0);
      tuft.setVisible(true);
    });
    api.butterflies.forEach((bug, i) => {
      intScale(bug, 22);
      const x = field.x + field.w * (0.22 + i * 0.26);
      const y = field.y + field.h * (0.22 + (i % 2) * 0.08);
      flyPath(scene, bug, x, y, 28 + i * 10, 2200 + i * 280);
      bug.setVisible(true);
    });
    if (api.groundLine) {
      api.groundLine.setPosition(field.x + field.w / 2, api.groundY);
      api.groundLine.setSize(Math.max(8, field.w), 12);
      if (api.groundLine.refreshBody) api.groundLine.refreshBody();
    }
    if (scene.physics && scene.physics.world) scene.physics.world.setBounds(field.x, field.y, field.w, field.h);
    api.hoppers.forEach((hopper, i) => {
      intScale(hopper, 22);
      const x = field.x + field.w * (0.3 + i * 0.35);
      hopper.setPosition(Math.round(x), api.groundY - 10);
      hopper.setVisible(true);
      if (hopper.body) {
        hopper.body.reset(hopper.x, hopper.y);
        hopper.body.setAllowGravity(false);
        hopper.body.enable = false;
      }
    });
    api.puddles.forEach((puddle, i) => {
      intScale(puddle, 36);
      puddle.setData("base", puddle.scaleX || 1);
      puddle.setPosition(field.x + field.w * (0.18 + i * 0.2), api.groundY - 6);
      puddle.setVisible(api.weather === "Drizzle");
    });
    const useLights = api.weather === "Night" && webgl(scene) && rich;
    const frame = api.weather === "Drizzle" ? "drop" : api.weather === "Snowy" ? "flake" : api.weather === "Night" ? "glow" : "mote";
    if (useLights && scene.lights && !api.lightsOn) {
      try { scene.lights.enable(); api.lightsOn = true; } catch (e) { api.lightsOn = false; }
    }
    api.motes.forEach((mote, i) => {
      mote.setFrame(frame);
      const col = i % 9;
      const row = Math.floor(i / 9);
      mote.setPosition(field.x + 12 + col * (field.w / 9), field.y + 10 + row * (field.h / 5));
      mote.setVisible(decorOn() && !useLights && api.weather !== "Breezy" && i < (api.weather === "Night" ? 6 : 36));
      if (api.weather === "Night") mote.setBlendMode(1);
    });
    api.lights.forEach((lamp, i) => {
      const x = field.x + field.w * (0.15 + (i % 3) * 0.28);
      const y = field.y + field.h * (0.3 + Math.floor(i / 3) * 0.22);
      lamp.setPosition(x, y);
      lamp.setVisible(useLights);
    });
    api.birds.forEach((bird) => {
      intScale(bird, 18);
      bird.setVisible(false);
    });
  };

  api.tick = (hole) => {
    const field = api.field;
    if (motionOff()) {
      api.tufts.forEach(holdFrame);
      api.butterflies.forEach(holdFrame);
      api.birds.forEach(holdFrame);
      api.hoppers.forEach(holdFrame);
      if (!api.froze) {
        try { scene.anims.pauseAll(); } catch (e) {}
        api.froze = true;
      }
    } else if (api.froze) {
      try { scene.anims.resumeAll(); } catch (e) {}
      api.froze = false;
    }
    const wind = api.weather === "Breezy" ? 2 : 1;
    driftTile(api.clouds, 0.32 * wind);
    driftTile(api.farHills, 0.05 * wind);
    driftTile(api.nearHills, 0.1);
    const center = field.x + field.w / 2;
    easeScroll(scene.cameras.main, hole ? (hole.x - center) * 0.04 : 0);
    tickHoppers(api.hoppers, api.groundY);
    const useLights = api.weather === "Night" && webgl(scene) && rich;
    tickGlow(api.lights, useLights, true);
    api.liveParts = tickMotes(api.motes, useLights ? "Breezy" : api.weather, field);
    tickPuddles(api.puddles, api.weather === "Drizzle" && rich);
    const skyBand = { x: field.x, y: field.y, w: field.w, h: Math.max(32, field.h * 0.35) };
    tickBirds(api.birds, skyBand, api.clock);
  };

  return api;
}
