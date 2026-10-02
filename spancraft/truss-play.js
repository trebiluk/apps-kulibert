// Shared truss board for SpanCraft and Spire Lab.
// Stretch a member from joint to joint. Test is a pin-joint check, not a gradebook.

import { proveTruss } from "./truss-prove.js";
import { t, chrome, applyDir, noVoiceLine, uiLang } from "./truss-i18n.js";
import {
  quietMode,
  readFlag,
  writeFlag,
  readJson,
  writeJson,
  runProveTheater,
  mountHelpOverlay,
  wireEdgeHelp,
} from "../shared/engage-help.js";

const PROVE = { stiffness: 0.99, load: 0.02, steps: 140, nudge: 0.0008 };

export function mountTruss(cfg) {
  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const capWord = document.getElementById("cap-word");
  const capText = document.getElementById("cap-text");
  const capMark = document.getElementById("cap-mark");
  const caption = document.getElementById("caption");
  const retryBtn = document.getElementById("retry");
  const assistBtn = document.getElementById("assist");
  const levels = cfg.levels;
  const freeLevel = cfg.freeLevel;
  const catalog = levels.concat([freeLevel]);

  const state = {
    track: "levels",
    levelId: levels[0].id,
    joints: [],
    members: [],
    cleared: {},
    toys: [],
    tool: "joint",
    phase: "idle",
    bet: null,
    stretch: null,
    drag: null,
    view: null,
    bestStars: 0,
    stars: {},
    hot: null,
    challengeMet: false,
    hadMiss: false,
    fixLine: "",
    scale: 1,
    origin: { x: 40, y: 40 },
    openedAt: Date.now(),
    sentScore: {},
  };

  const art = {};
  function knockOut(img) {
    const c = document.createElement("canvas");
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    try {
      const data = g.getImageData(0, 0, w, h);
      const d = data.data;
      for (let i = 0; i < d.length; i += 4) {
        if (d[i] + d[i + 1] + d[i + 2] < 78) d[i + 3] = 0;
      }
      g.putImageData(data, 0, 0);
    } catch (err) {
      return img;
    }
    return c;
  }
  if (cfg.workshop) {
    const names = [
      "world-sky", "world-water", "world-ground",
      "abutment-left", "abutment-right", "pier", "deck-panel", "steel-member",
      "gusset-joint", "tower-base-pad", "tower-block",
    ];
    for (const name of names) {
      const img = new Image();
      img.onload = () => {
        art[name] = name.indexOf("world-") === 0 ? img : knockOut(img);
        draw();
      };
      img.src = "/holdit/art/" + name + ".png";
    }
  }

  function modeKey() {
    return cfg.mode === "spire" ? "spire" : "span";
  }
  function lineFirst() {
    if (cfg.workshop) return cfg.firstLine;
    return cfg.mode === "spire" ? t("firstSpire") : t("firstSpan");
  }
  function lineAssist() {
    if (cfg.workshop) return cfg.assistText;
    return cfg.mode === "spire" ? t("assistSpire") : t("assistSpan");
  }
  function jointHint() {
    const n = state.joints.length;
    if (!cfg.workshop) return lineAssist();
    if (n === 1 || state.stretch) return t("tapEnd");
    if (n === 0) return t("tapEnd");
    return t("letGo");
  }
  function assistOn() {
    return !!(assistBtn && assistBtn.getAttribute("aria-pressed") === "true");
  }
  function faceName(level) {
    if (cfg.workshop && level.free) return t("yourBuild");
    const hit = t("name." + modeKey() + "." + level.id);
    return hit || level.name;
  }
  function faceJob(level) {
    if (cfg.workshop) {
      if (!level.free) return level.job;
      return cfg.mode === "spire"
        ? "Your tower. Reach the height. The test pushes the top from both sides."
        : "Your bridge. The truck stops in every bay.";
    }
    return t("job." + modeKey() + "." + level.id) || level.job || "";
  }
  function syncAssistCue() {
    if (!cfg.workshop) return;
    const on = assistOn();
    const cue = document.getElementById("assist-cue");
    const text = jointHint();
    if (cue) {
      cue.hidden = !on;
      if (on) cue.removeAttribute("hidden");
      const span = cue.querySelector("span");
      if (span && span.textContent !== text) span.textContent = text;
    }
    const plate = document.getElementById("assist-plate");
    const plateText = document.getElementById("assist-plate-text");
    if (!plate) return;
    if (!on) {
      plate.classList.remove("show");
      plate.hidden = true;
      plate.setAttribute("hidden", "");
      return;
    }
    if (plateText && plateText.textContent !== text) plateText.textContent = text;
    plate.classList.add("show");
    plate.hidden = false;
    plate.removeAttribute("hidden");
    if (capWord && (capWord.dataset.k === "ready" || capWord.dataset.k === "assist")) {
      capWord.dataset.k = "assist";
      capWord.textContent = t("assist");
      capText.textContent = text;
    }
  }
  let cssW = 0;
  let cssH = 0;
  let plateTimer = 0;
  let theater = null;

  function levelById(id) {
    return catalog.find((l) => l.id === id) || levels[0];
  }
  function active() {
    return levelById(state.levelId);
  }
  function onFree() {
    return !!active().free || state.track === "challenge";
  }
  function pathClear() {
    return levels.every((l) => state.cleared[l.id]);
  }
  function cloneLevel(level) {
    const src = level.joints || [];
    state.joints = src.map((j) => ({ x: j.x, y: j.y, fixed: !!j.fixed }));
    state.members = (level.seed || []).map((m) => ({ a: m.a, b: m.b }));
    state.view = null;
    state.stretch = null;
    state.drag = null;
    state.bet = null;
  }

  function save() {
    writeJson(cfg.engageKey, {
      v: 2,
      levelId: state.levelId,
      cleared: state.cleared,
      track: state.track,
      challengeMet: state.challengeMet,
      stars: state.stars,
      bestStars: state.bestStars,
    });
    if (cfg.partFlag && pathClear()) {
      writeFlag(cfg.partFlag, true);
      if (cfg.pairFlag && cfg.retireFlag && readFlag(cfg.pairFlag)) writeFlag(cfg.retireFlag, true);
    }
  }
  function load() {
    let data = readJson(cfg.engageKey, null);
    if ((!data || data.v !== 2) && cfg.seedKey) {
      const old = readJson(cfg.seedKey, null);
      if (old && old.v === 2) data = old;
    }
    if (!data || data.v !== 2) return;
    state.cleared = data.cleared && typeof data.cleared === "object" ? data.cleared : {};
    const OLD_LEVEL = {
      span: { across: "stops", long: "endbay", budget: "tight", wide: "arch", fifty: "pier", efficient: "spare" },
      spire: { two: "stack", three: "add", brace: "cross", tall: "floors", budget: "limit", push: "shove", thirty: "climb", efficient: "spare" },
    };
    let savedId = data.levelId;
    if (savedId && !catalog.some((l) => l.id === savedId)) {
      const next = (OLD_LEVEL[cfg.mode] || {})[savedId];
      if (next) savedId = next;
    }
    state.levelId = catalog.some((l) => l.id === savedId) ? savedId : levels[0].id;
    state.track = data.track === "challenge" ? "challenge" : "levels";
    state.challengeMet = !!data.challengeMet;
    state.stars = data.stars && typeof data.stars === "object" ? { ...data.stars } : {};
    state.bestStars = data.bestStars || 0;
    if (!data.stars && data.bestStars && data.levelId && catalog.some((l) => l.id === data.levelId) && !state.stars[data.levelId]) {
      state.stars[data.levelId] = data.bestStars;
    }
    if (state.track === "challenge" && !pathClear()) state.track = "levels";
    if (state.track !== "challenge" && active().free) state.levelId = levels[0].id;
    if (cfg.partFlag && pathClear()) save();
  }

  const access = readAccess();
  let voiceReady = false;
  let lastSaid = "";
  function readAccess() {
    try {
      const raw = JSON.parse(localStorage.getItem(cfg.accessKey || "xx-access-v1") || "{}");
      const LANG_OK = { en: 1, simple: 1, uk: 1, ru: 1, es: 1, ar: 1, "fa-AF": 1, rw: 1, ti: 1 };
      const lang = LANG_OK[raw.lang] ? raw.lang : "en";
      return { lang: lang, speak: !!raw.speak, big: !!raw.big, fewer: !!raw.fewer };
    } catch (e) {
      return { lang: "en", speak: false, big: false, fewer: false };
    }
  }
  function writeAccess(next) {
    access.lang = next.lang;
    access.speak = next.speak;
    access.big = next.big;
    access.fewer = next.fewer;
    try { localStorage.setItem(cfg.accessKey || "xx-access-v1", JSON.stringify(next)); } catch (e) {}
    document.documentElement.dataset.big = next.big ? "1" : "0";
    document.documentElement.dataset.lang = next.lang;
    window.dispatchEvent(new Event((cfg.accessKey || "xx").split("-")[0] + "-access"));
    paintAccess();
  }
  function voiceOf() {
    return null;
  }
  function wantSpeak() {
    if (access.speak) return true;
    try {
      const prefs = window.KulibertPrefs;
      if (prefs && typeof prefs.get === "function" && prefs.get().read) return true;
    } catch (e) {}
    return false;
  }
  function say(text) {
    const words = String(text || "").replace(/\s+/g, " ").trim();
    if (!words) return;
    const lang = uiLang();
    let line = document.getElementById("kp-live") || document.getElementById("game-live");
    if (!line) {
      line = document.createElement("div");
      line.id = "game-live";
      line.setAttribute("role", "status");
      line.setAttribute("aria-live", "polite");
      line.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0)";
      document.body.appendChild(line);
    }
    const prefs = window.KulibertPrefs;
    const voice = prefs && typeof prefs.voiceFor === "function" ? prefs.voiceFor(lang) : null;
    const noVoice = lang === "rw" || lang === "ti" || !voice;
    if (noVoice || !window.speechSynthesis) {
      line.hidden = false;
      line.textContent = words + " " + noVoiceLine();
      return;
    }
    line.textContent = words;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(words);
      u.voice = voice;
      u.lang = voice.lang || "en-US";
      u.rate = lang === "simple" ? 0.85 : 0.95;
      window.speechSynthesis.speak(u);
    } catch (eSay) {
      line.hidden = false;
      line.textContent = words + " " + noVoiceLine();
    }
  }
  function stopSay() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }
  function maybeSay(text, quiet) {
    if (quiet || !voiceReady || !wantSpeak()) return;
    const line = String(text || "").split(". ")[0];
    if (!line || line === lastSaid) return;
    lastSaid = line;
    say(line);
  }
  function paintAccess() {
    document.documentElement.dataset.big = access.big ? "1" : "0";
    document.documentElement.dataset.lang = access.lang;
    const sheet = document.getElementById("access-sheet");
    if (!sheet) return;
    sheet.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-lang") === uiLang() ? "true" : "false");
    });
    const speakBtn = document.getElementById("access-speak");
    const bigBtn = document.getElementById("access-big");
    if (speakBtn) speakBtn.setAttribute("aria-pressed", access.speak ? "true" : "false");
    if (bigBtn) bigBtn.setAttribute("aria-pressed", access.big ? "true" : "false");
  }
  function mountAccess() {
    if (!cfg.accessKey || document.getElementById("access-sheet")) return;
    const readBtn = document.createElement("button");
    readBtn.type = "button";
    readBtn.id = "read-line";
    readBtn.className = "fat";
    readBtn.textContent = chrome("read") || "Read";
    caption.appendChild(readBtn);
    readBtn.addEventListener("click", () => {
      lastSaid = "";
      say(capText.textContent || "");
    });
    const gear = document.createElement("button");
    gear.type = "button";
    gear.id = "access-gear";
    gear.className = "fat";
    gear.textContent = chrome("settings");
    const kinds = document.getElementById("kinds");
    if (kinds) kinds.appendChild(gear);
    const LANG_PICKS = [
      ["en", "English"],
      ["simple", "Simple words"],
      ["uk", "Українська"],
      ["ru", "Русский"],
      ["es", "Español"],
      ["ar", "العربية"],
      ["fa-AF", "دری"],
      ["rw", "Ikinyarwanda"],
      ["ti", "ትግርኛ"],
    ];
    const sheet = document.createElement("div");
    sheet.id = "access-sheet";
    sheet.hidden = true;
    sheet.innerHTML =
      '<button type="button" id="access-close-top" class="fat"></button>' +
      '<p class="access-title" id="access-title"></p>' +
      '<p class="access-label" id="access-lang-label"></p>' +
      '<div class="access-row">' +
      LANG_PICKS.map((pair) => '<button type="button" data-lang="' + pair[0] + '">' + pair[1] + "</button>").join("") +
      "</div>" +
      '<div class="access-row">' +
      '<button type="button" id="access-speak"></button>' +
      '<button type="button" id="access-big"></button>' +
      "</div>" +
      '<button type="button" id="access-close" class="fat"></button>';
    document.body.appendChild(sheet);
    const shutSheet = () => {
      sheet.hidden = true;
      const menu = document.getElementById("land-menu");
      if (menu) menu.focus();
    };
    gear.addEventListener("click", () => {
      sheet.hidden = !sheet.hidden;
      paintAccess();
    });
    sheet.querySelector("#access-close").addEventListener("click", shutSheet);
    sheet.querySelector("#access-close-top").addEventListener("click", shutSheet);
    sheet.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        writeAccess({ lang: lang, speak: access.speak, big: access.big, fewer: false });
        try {
          const prefs = window.KulibertPrefs;
          if (prefs && typeof prefs.set === "function") prefs.set({ lang: lang });
          if (prefs && prefs.lang !== lang && typeof prefs.acceptLang === "function") prefs.acceptLang(lang);
        } catch (eLang) {}
        paintLang();
        say(btn.textContent || "");
      });
    });
    sheet.querySelector("#access-speak").addEventListener("click", () => {
      const speak = !access.speak;
      writeAccess({ lang: access.lang, speak: speak, big: access.big, fewer: false });
      say(speak ? t("readOn") : t("readOff"));
    });
    sheet.querySelector("#access-big").addEventListener("click", () => {
      writeAccess({ lang: access.lang, speak: access.speak, big: !access.big, fewer: false });
    });
    paintAccess();
  }

  function setStatus(word, text, tone, quiet) {
    capWord.textContent = word;
    capWord.dataset.k = quiet ? "quiet" : "line";
    capText.textContent = text;
    if (capMark) capMark.textContent = tone === "pass" ? "✓" : tone === "fail" ? "✕" : "";
    const open = caption.classList.contains("is-open");
    caption.className = "caption" + (tone ? " " + tone : "") + (open ? " is-open" : "");
    maybeSay(text, !!quiet);
  }
  function starPhrase(n) {
    if (!n) return "";
    const words = n === 1 ? t("starOne") : (n + t("starsN"));
    return "★".repeat(n) + "☆".repeat(Math.max(0, 4 - n)) + " " + words;
  }
  function starsFor(ok, meters, par, sag, limit) {
    if (!ok) return 0;
    if (!par) return 1;
    let n = 1;
    if (meters <= par * 1.25 + 0.05) n = 2;
    if (meters <= par * 1.02 + 0.05) n = 3;
    if (n === 3 && sag <= (limit || 30) * 0.9) n = 4;
    return n;
  }
  function showPlate(shout, captionText, mark) {
    const plate = document.getElementById("flash-plate");
    if (!plate) return;
    const shoutEl = document.getElementById("flash-shout");
    const capEl = document.getElementById("flash-caption");
    const markEl = document.getElementById("flash-mark");
    if (shoutEl) shoutEl.textContent = shout;
    if (capEl) capEl.textContent = captionText;
    if (markEl) markEl.textContent = mark || "";
    plate.hidden = false;
    plate.removeAttribute("hidden");
    window.clearTimeout(plateTimer);
    plateTimer = window.setTimeout(() => {
      plate.hidden = true;
      plate.setAttribute("hidden", "");
    }, quietMode() ? 700 : 1500);
  }
  function armRetry(on) {
    if (!retryBtn) return;
    retryBtn.classList.toggle("is-needed", !!on);
    retryBtn.hidden = false;
    retryBtn.disabled = false;
    const now = document.getElementById("retry-now");
    if (now) now.hidden = !on;
  }
  let mapOpener = null;
  function ensureNextBtn() {
    let btn = document.getElementById("next-level");
    if (btn) return btn;
    btn = document.createElement("button");
    btn.type = "button";
    btn.id = "next-level";
    btn.hidden = true;
    const now = document.getElementById("retry-now");
    if (now && now.parentNode) now.insertAdjacentElement("afterend", btn);
    else if (caption) caption.appendChild(btn);
    btn.addEventListener("click", () => {
      if (busy()) return;
      const nxt = nextAfter(active());
      if (nxt) beginLevel(nxt.id);
    });
    return btn;
  }
  function hideNextLevel() {
    const btn = document.getElementById("next-level");
    if (btn) btn.hidden = true;
  }
  function nextAfter(level) {
    if (!level || level.free) return null;
    const i = levels.findIndex((l) => l.id === level.id);
    if (i < 0) return null;
    if (i >= levels.length - 1) return pathClear() ? freeLevel : null;
    return levels[i + 1];
  }
  function paintNextLevel() {
    const btn = ensureNextBtn();
    const level = active();
    const nxt = nextAfter(level);
    if (!nxt) {
      btn.hidden = true;
      return;
    }
    btn.textContent = (nxt.free ? t("challenge") : t("nextLevel")) + " ›";
    btn.hidden = false;
    btn.removeAttribute("hidden");
  }
  function paintReadout() {
    const level = active();
    const nEl = document.getElementById("budget-n");
    const spanEl = document.getElementById("span-m");
    if (nEl) nEl.textContent = String(state.members.length);
    if (spanEl) spanEl.textContent = (level.spanM || 0) + " m";
    const maxEl = document.getElementById("budget-max");
    if (maxEl) maxEl.textContent = String(level.budget);
    const goalN = document.getElementById("goal-n");
    const goalM = document.getElementById("goal-m");
    const heightN = document.getElementById("height-n");
    const h = cfg.mode === "spire" ? linkedHeight(state.joints, state.members) : heightM(state.joints);
    if (heightN) heightN.textContent = String(Math.round(h));
    if (goalN) goalN.textContent = String(level.goalM || 0);
    if (goalM) goalM.textContent = (level.goalM || 0) + " m";
    const chip = document.getElementById("mastery-chip");
    const best = state.stars[level.id] || 0;
    if (chip) {
      chip.hidden = !best;
      if (best) chip.textContent = t("best") + " ★ " + best + "/4";
    }
    const budgetWord = document.getElementById("budget-word");
    const heightWord = document.getElementById("height-word");
    const goalWord = document.getElementById("goal-word");
    if (budgetWord) budgetWord.textContent = t("members");
    if (heightWord) heightWord.textContent = t("height");
    if (goalWord) goalWord.textContent = t("goal");
  }
  function pxPerMeter(level) {
    if (cfg.mode === "spire" || (!level.spanM && level.goalM)) return 15;
    const src = (level.slots && level.slots.length ? level.slots : level.joints) || [];
    if (!src.length || !level.spanM) return 1;
    const xs = src.map((j) => j.x);
    const span = Math.max(...xs) - Math.min(...xs);
    return span > 0 ? span / level.spanM : 1;
  }
  function metersOf(joints, members, level) {
    const p = pxPerMeter(level);
    let m = 0;
    for (const mem of members) {
      const a = joints[mem.a];
      const b = joints[mem.b];
      if (!a || !b) continue;
      m += Math.hypot(a.x - b.x, a.y - b.y) / p;
    }
    return m;
  }
  function parMeters(level) {
    if (typeof level.par === "number" && level.par > 0) return level.par;
    const src = level.joints && level.joints.length ? level.joints : state.joints;
    return metersOf(src, level.parMembers || [], level);
  }
  function linkedSet(joints, members) {
    const adj = joints.map(() => []);
    for (const m of members) {
      if (!joints[m.a] || !joints[m.b]) continue;
      adj[m.a].push(m.b);
      adj[m.b].push(m.a);
    }
    const seen = new Set();
    const q = [];
    joints.forEach((j, i) => {
      if (j.fixed) {
        seen.add(i);
        q.push(i);
      }
    });
    while (q.length) {
      const i = q.pop();
      for (const k of adj[i]) {
        if (seen.has(k)) continue;
        seen.add(k);
        q.push(k);
      }
    }
    return seen;
  }
  function linkedHeight(joints, members) {
    const bases = [];
    joints.forEach((j, i) => { if (j.fixed) bases.push(i); });
    if (!bases.length) return 0;
    const baseY = Math.max(...bases.map((i) => joints[i].y));
    let top = baseY;
    linkedSet(joints, members).forEach((i) => { top = Math.min(top, joints[i].y); });
    return Math.max(0, (baseY - top) / 15);
  }
  function topLinkedIndex() {
    let best = -1;
    let bestY = Infinity;
    linkedSet(state.joints, state.members).forEach((i) => {
      if (state.joints[i].fixed) return;
      if (state.joints[i].y < bestY) {
        bestY = state.joints[i].y;
        best = i;
      }
    });
    return best;
  }
  function deckIndexes(level) {
    const joints = state.joints;
    const ref = (level.slots && level.slots.length ? level.slots : level.joints) || joints;
    let maxY = -Infinity;
    for (const j of ref) if (j && j.y > maxY) maxY = j.y;
    const picks = [];
    joints.forEach((j, i) => {
      if (j.fixed) return;
      if (Math.abs(j.y - maxY) <= 16) picks.push(i);
    });
    picks.sort((a, b) => joints[a].x - joints[b].x);
    return picks;
  }
  function heightM(joints) {
    const bases = joints.filter((j) => j.fixed);
    if (!bases.length || joints.length < 2) return 0;
    const baseY = Math.max(...bases.map((j) => j.y));
    const top = Math.min(...joints.map((j) => j.y));
    return Math.max(0, (baseY - top) / 15);
  }
  function coach() {
    const level = active();
    syncJobAssist();
    if (state.members.length === 1 && level.n === 1 && !level.free) {
      setStatus(t("job") + " 1", t("oneSide"), "");
      return;
    }
    if (state.fixLine) {
      setStatus(t("fix"), state.fixLine + t("thenTest"), "");
      return;
    }
    if (onFree()) {
      const pass = cfg.workshop ? t("passBuild") : t("passTruss");
      setStatus(
        state.challengeMet ? t("clear") : t("challenge"),
        state.challengeMet ? pass + faceJob(level) : faceJob(level),
        state.challengeMet ? "pass" : "",
      );
      return;
    }
    if (!state.cleared[levels[0].id] && level.id === levels[0].id && state.members.length === 0) {
      setStatus(t("ready"), lineFirst(), "");
      return;
    }
    setStatus(t("job") + " " + level.n, faceJob(level), "");
  }

  function classicTheme() {
    return document.documentElement.dataset.theme === "classic";
  }
  function shortLand() {
    return window.matchMedia("(orientation: landscape) and (max-height: 500px)").matches;
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const classic = classicTheme();
    cssW = Math.max(classic ? 320 : 1, rect.width || 0);
    cssH = classic ? Math.max(240, rect.height || 0) : Math.max(1, rect.height || 0);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fit();
    draw();
  }
  function pointsForFit() {
    const level = active();
    const pts = (level.slots || level.joints || []).concat(state.joints);
    return pts.length ? pts : [{ x: 0, y: 0 }, { x: 200, y: 120 }];
  }
  function fit() {
    const pts = pointsForFit();
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    const bw = Math.max(80, maxX - minX);
    const bh = Math.max(80, maxY - minY);
    const classic = classicTheme();
    const narrow = cssW < 520;
    let padX = narrow ? 36 : 80;
    let padTop = narrow ? 28 : 48;
    let padBot = narrow ? Math.max(88, Math.round(cssH * 0.22)) : 200;
    if (!classic) {
      if (narrow) padX = 88;
      if (shortLand()) {
        padX = Math.min(64, Math.max(24, cssW * 0.04));
        padTop = Math.min(88, Math.max(72, cssH * 0.2));
        padBot = Math.min(200, Math.max(72, cssH * 0.22));
      }
      if (cssH - padTop - padBot < 48) {
        padTop = Math.min(padTop, Math.max(8, cssH * 0.12));
        padBot = Math.max(8, cssH - padTop - 48);
      }
    }
    const innerW = Math.max(48, cssW - padX);
    const innerH = Math.max(48, cssH - padTop - padBot);
    state.scale = Math.max(0.05, Math.min(innerW / bw, innerH / bh));
    state.origin = {
      x: (cssW - bw * state.scale) / 2 - minX * state.scale,
      y: padTop + Math.max(0, (innerH - bh * state.scale) / 2) - minY * state.scale,
    };
  }
  function toScreen(p) {
    return {
      x: state.origin.x + p.x * state.scale,
      y: state.origin.y + p.y * state.scale,
    };
  }
  function toModel(sx, sy) {
    return {
      x: (sx - state.origin.x) / state.scale,
      y: (sy - state.origin.y) / state.scale,
    };
  }
  function eventPoint(ev) {
    const rect = canvas.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }
  function nearestJoint(sx, sy, radius) {
    const joints = state.view ? state.view.joints : state.joints;
    let best = -1;
    let bestD = radius == null ? 56 : radius;
    joints.forEach((j, i) => {
      const p = toScreen(j);
      const d = Math.hypot(p.x - sx, p.y - sy);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }
  function nearestSlot(model) {
    const slots = active().slots || [];
    let best = null;
    let bestD = 28 / state.scale;
    for (const s of slots) {
      const taken = state.joints.some((j) => Math.hypot(j.x - s.x, j.y - s.y) < 8);
      if (taken) continue;
      const d = Math.hypot(s.x - model.x, s.y - model.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    return best;
  }
  function memberAt(sx, sy) {
    const joints = state.joints;
    let best = -1;
    let bestD = 16;
    state.members.forEach((m, i) => {
      const a = toScreen(joints[m.a]);
      const b = toScreen(joints[m.b]);
      if (!a || !b) return;
      const d = distToSeg(sx, sy, a.x, a.y, b.x, b.y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }
  function distToSeg(px, py, ax, ay, bx, by) {
    const abx = bx - ax;
    const aby = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / (abx * abx + aby * aby || 1)));
    return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
  }
  function hasMember(a, b) {
    return state.members.some((m) => (m.a === a && m.b === b) || (m.a === b && m.b === a));
  }
  function addMember(a, b) {
    if (a === b || a < 0 || b < 0) return false;
    if (hasMember(a, b)) return false;
    const A = state.joints[a];
    const B = state.joints[b];
    if (!A || !B) return false;
    if (Math.hypot(A.x - B.x, A.y - B.y) > 175) {
      setStatus(t("members"), t("tooLong"), "", true);
      return false;
    }
    state.members.push({ a, b });
    hideNextLevel();
    return true;
  }

  function paintWorld(joints) {
    const sky = art["world-sky"];
    if (sky) ctx.drawImage(sky, 0, 0, cssW, Math.max(80, cssH * 0.78));
    else {
      const g = ctx.createLinearGradient(0, 0, 0, cssH);
      g.addColorStop(0, "#b7c4ce");
      g.addColorStop(1, "#6d7f8c");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, cssW, cssH);
    }
    const bases = joints.filter((j) => j.fixed);
    const baseY = bases.length ? Math.max(...bases.map((j) => toScreen(j).y)) : cssH * 0.72;
    if (cfg.mode === "span") {
      const water = art["world-water"];
      if (water) ctx.drawImage(water, 0, baseY - 6, cssW, cssH - baseY + 6);
      else {
        ctx.fillStyle = "#3e5963";
        ctx.fillRect(0, baseY, cssW, cssH - baseY);
      }
      const fixed = bases.slice().sort((a, b) => a.x - b.x);
      if (fixed.length && art["abutment-left"]) {
        const p = toScreen(fixed[0]);
        ctx.drawImage(art["abutment-left"], p.x - 78, p.y - 28, 96, 96);
      }
      if (fixed.length > 1 && art["abutment-right"]) {
        const p = toScreen(fixed[fixed.length - 1]);
        ctx.drawImage(art["abutment-right"], p.x - 18, p.y - 28, 96, 96);
      }
      if (fixed.length > 1 && art["deck-panel"]) {
        const a = toScreen(fixed[0]);
        const b = toScreen(fixed[fixed.length - 1]);
        ctx.drawImage(art["deck-panel"], a.x, a.y - 16, Math.max(20, b.x - a.x), 24);
      }
      if (fixed.length > 1 && art["pier"]) {
        const mid = toScreen({
          x: (fixed[0].x + fixed[fixed.length - 1].x) / 2,
          y: fixed[0].y,
        });
        ctx.drawImage(art["pier"], mid.x - 16, mid.y - 8, 32, 78);
      }
    } else {
      const ground = art["world-ground"];
      if (ground) ctx.drawImage(ground, 0, baseY - 24, cssW, cssH - baseY + 24);
      else {
        ctx.fillStyle = "#6d655a";
        ctx.fillRect(0, baseY, cssW, cssH - baseY);
      }
      if (bases.length && art["tower-base-pad"]) {
        const xs = bases.map((j) => toScreen(j).x);
        const left = Math.min(...xs);
        const right = Math.max(...xs);
        ctx.drawImage(art["tower-base-pad"], left - 40, baseY - 16, Math.max(80, right - left + 80), 52);
        if (art["tower-block"]) {
          ctx.drawImage(art["tower-block"], (left + right) / 2 - 24, baseY - 62, 48, 48);
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, cssW, cssH);
    const level = active();
    const joints = state.view ? state.view.joints : state.joints;
    if (cfg.workshop) {
      paintWorld(joints);
    } else {
      ctx.fillStyle = "#07101f";
      ctx.fillRect(0, 0, cssW, cssH);
      if (cfg.mode === "span") {
        const base = toScreen({ x: 0, y: 250 });
        ctx.fillStyle = "#12324a";
        ctx.fillRect(0, base.y, cssW, cssH - base.y);
      }
    }
    for (const j of joints) {
      if (!j.fixed) continue;
      const p = toScreen(j);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(p.x - 36, p.y - 6, 72, 30);
      ctx.fillStyle = "#334155";
      ctx.fillRect(p.x - 36, p.y + 18, 72, 8);
    }
    const slots = level.slots || [];
    ctx.strokeStyle = "rgba(143,180,201,0.45)";
    ctx.lineWidth = 2;
    for (const s of slots) {
      const taken = state.joints.some((j) => Math.hypot(j.x - s.x, j.y - s.y) < 8);
      if (taken) continue;
      const p = toScreen(s);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    for (const m of state.members) {
      const a = joints[m.a];
      const b = joints[m.b];
      if (!a || !b) continue;
      const pa = toScreen(a);
      const pb = toScreen(b);
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = cfg.workshop ? "#3f4a55" : "#155e75";
      ctx.lineWidth = cfg.workshop ? 12 : 16;
      ctx.stroke();
      ctx.strokeStyle = cfg.workshop ? (cfg.mode === "spire" ? "#c4b5fd" : "#99f6e4") : "#a5f3fc";
      ctx.lineWidth = cfg.workshop ? 3 : 7;
      ctx.stroke();
    }
    if (cfg.workshop && assistOn() && !state.stretch && !state.view && joints.length >= 2) {
      let pair = null;
      const target = joints[level.loadIndex] ? level.loadIndex : 0;
      for (let i = 0; i < joints.length; i++) {
        if (i !== target && !hasMember(i, target)) {
          pair = [i, target];
          break;
        }
      }
      if (!pair) {
        for (let i = 0; i < joints.length && !pair; i++) {
          for (let j = i + 1; j < joints.length; j++) {
            if (!hasMember(i, j)) {
              pair = [i, j];
              break;
            }
          }
        }
      }
      if (pair) {
        const ga = toScreen(joints[pair[0]]);
        const gb = toScreen(joints[pair[1]]);
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.setLineDash([12, 8]);
        ctx.lineCap = "round";
        ctx.strokeStyle = "#f8fafc";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(ga.x, ga.y);
        ctx.lineTo(gb.x, gb.y);
        ctx.stroke();
        const ang = Math.atan2(gb.y - ga.y, gb.x - ga.x);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(gb.x, gb.y);
        ctx.lineTo(gb.x - 16 * Math.cos(ang - 0.45), gb.y - 16 * Math.sin(ang - 0.45));
        ctx.lineTo(gb.x - 16 * Math.cos(ang + 0.45), gb.y - 16 * Math.sin(ang + 0.45));
        ctx.closePath();
        ctx.fillStyle = "#f8fafc";
        ctx.fill();
        ctx.restore();
      }
    }
    if (state.stretch) {
      const a = toScreen(state.joints[state.stretch.from]);
      const aim = nearestJoint(state.stretch.sx, state.stretch.sy, 64);
      const end = aim >= 0 ? toScreen(state.joints[aim]) : { x: state.stretch.sx, y: state.stretch.sy };
      ctx.save();
      ctx.setLineDash(aim >= 0 ? [] : [8, 8]);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(end.x, end.y);
      ctx.stroke();
      ctx.restore();
      if (aim >= 0 && aim !== state.stretch.from) {
        ctx.beginPath();
        ctx.arc(end.x, end.y, 26, 0, Math.PI * 2);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    }
    const deckMark = !state.view && level.roll ? new Set(deckIndexes(level)) : null;
    joints.forEach((j, i) => {
      const p = toScreen(j);
      if (cfg.workshop && art["gusset-joint"]) {
        ctx.drawImage(art["gusset-joint"], p.x - 16, p.y - 16, 32, 32);
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, cfg.workshop ? 11 : (j.fixed ? 18 : 16), 0, Math.PI * 2);
      ctx.fillStyle = j.fixed ? "#e2e8f0" : "#67e8f9";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#0f172a";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#0f172a";
      ctx.fill();
      if (!state.view && ((deckMark && deckMark.has(i)) || (i === level.loadIndex && !level.free && !level.roll))) {
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(p.x - 16, p.y + 16, 32, 14);
      }
    });
    if (state.hot != null && joints[state.hot]) {
      const p = toScreen(joints[state.hot]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 28, 0, Math.PI * 2);
      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
    if (state.view && state.view.weight) {
      const w = toScreen(state.view.weight);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(w.x - 18, w.y - 12, 36, 20);
    }
    const meters = level.spanM || level.goalM;
    if (meters && !state.view) {
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "700 18px " + (getComputedStyle(document.body).fontFamily || "sans-serif");
      ctx.textAlign = "left";
      ctx.fillText((cfg.mode === "spire" ? meters + t("metersHeight") : meters + t("metersSpan")), 16, 28);
    }
    paintReadout();
    syncAssistCue();
  }

  function syncTrack() {
    const levelsBtn = document.getElementById("track-levels");
    const chal = document.getElementById("track-challenge");
    const brief = document.getElementById("brief");
    const free = onFree();
    if (levelsBtn) levelsBtn.setAttribute("aria-pressed", free ? "false" : "true");
    if (chal) {
      chal.setAttribute("aria-pressed", free ? "true" : "false");
      const open = pathClear();
      chal.classList.toggle("is-locked", !open);
      chal.setAttribute("aria-disabled", open ? "false" : "true");
      if (cfg.workshop) {
        const label = chal.querySelector(".chal-label");
        if (label) label.textContent = open ? t("challenge") : t("clearLevels");
      }
    }
    if (brief) {
      brief.hidden = !free;
      if (free) brief.textContent = faceJob(freeLevel);
    }
  }
  function syncTools() {
    for (const id of ["tool-add", "tool-move", "tool-delete"]) {
      const btn = document.getElementById(id);
      if (!btn) continue;
      const name = id === "tool-add" ? "joint" : id === "tool-move" ? "move" : "delete";
      btn.setAttribute("aria-pressed", state.tool === name ? "true" : "false");
    }
  }
  function busy() {
    return state.phase === "play" || state.phase === "theater";
  }

  function beginLevel(id) {
    state.levelId = id;
    if (levelById(id).free) state.track = "challenge";
    else state.track = "levels";
    state.hadMiss = false;
    state.fixLine = "";
    state.hot = null;
    state.openedAt = Date.now();
    cloneLevel(active());
    state.phase = "idle";
    armRetry(false);
    hideNextLevel();
    save();
    syncTrack();
    syncBet();
    coach();
    resize();
  }

  function renderMap() {
    const grid = document.getElementById("isle-grid");
    if (!grid) return;
    grid.innerHTML = "";
    for (const level of catalog) {
      const locked = level.free ? !pathClear() : (level.n > 1 && !state.cleared[levels[level.n - 2].id] && !state.cleared[level.id]);
      const open = !locked;
      const st = state.cleared[level.id] ? "clear" : locked ? "locked" : "active";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "isle-card";
      btn.dataset.state = st;
      btn.dataset.id = level.id;
      btn.disabled = locked;
      const tag = state.cleared[level.id] ? t("done") : locked ? t("locked") : (level.id === state.levelId ? t("now") : t("open"));
      const band = level.free ? t("afterPath") : String(level.n);
      const best = state.stars[level.id] || 0;
      const starLine = best ? (t("best") + " ★ " + best + "/4") : t("starsJob");
      btn.innerHTML =
        '<span class="isle-tag">' + band + " · " + tag + "</span>" +
        "<h3>" + faceName(level) + "</h3>" +
        "<p>" + faceJob(level) + "</p>" +
        '<span class="isle-toy">' + starLine + "</span>";
      btn.addEventListener("click", () => {
        if (!open) return;
        closeMap();
        beginLevel(level.id);
      });
      grid.appendChild(btn);
    }
  }
  function openMap(from) {
    const map = document.getElementById("isle-map");
    if (!map) return;
    const opener = from && from.nodeType === 1
      ? from
      : (from && from.currentTarget && from.currentTarget.nodeType === 1 ? from.currentTarget : null);
    if (opener) mapOpener = opener;
    renderMap();
    map.hidden = false;
    map.removeAttribute("hidden");
    const grid = document.getElementById("isle-grid");
    const level = active();
    let want = level.id;
    if (state.cleared[level.id]) {
      const nxt = nextAfter(level);
      if (nxt) want = nxt.id;
    }
    const card = grid && grid.querySelector("[data-id='" + want + "']");
    if (card && card.scrollIntoView) {
      try { card.scrollIntoView({ block: "nearest", inline: "nearest" }); } catch (eScroll) {}
    }
    const close = document.getElementById("isle-close");
    if (close) close.focus();
  }
  function closeMap() {
    const map = document.getElementById("isle-map");
    if (!map) return;
    const wasOpen = !map.hidden;
    map.hidden = true;
    map.setAttribute("hidden", "");
    const back = mapOpener;
    mapOpener = null;
    if (wasOpen && back && typeof back.focus === "function") back.focus();
  }

  function failReason(result) {
    if (result.reason === "few") return t("few");
    if (result.reason === "deck") return t("deck");
    if (result.reason === "roll") return t("roll");
    if (result.reason === "gust") return t("gust");
    if (result.reason === "lean") return t("lean");
    if (result.reason === "short") return t("short");
    return t("sag");
  }
  function proveOpts(level) {
    return {
      ...PROVE,
      sagLimit: level.sagLimit,
      leanLimit: level.leanLimit,
      nudge: level.nudge == null ? PROVE.nudge : level.nudge,
      gust: !!level.gust,
    };
  }
  function tagFail(level, result) {
    if (result.ok || result.reason === "few" || result.reason === "short" || result.reason === "nophysics") return result;
    if (level.gust) return { ...result, reason: "gust" };
    if (level.roll || (level.free && cfg.mode === "span")) return { ...result, reason: "roll" };
    return result;
  }

  function runCheck() {
    const level = active();
    const opts = proveOpts(level);
    if (state.joints.length < 2 || state.members.length < 2) {
      return { ok: false, reason: "few", sag: 99, lean: 0, frames: [] };
    }
    if (cfg.mode === "spire") {
      const h = linkedHeight(state.joints, state.members);
      if (h + 0.2 < (level.goalM || 0)) {
        return { ok: false, reason: "short", sag: 0, lean: 0, frames: [] };
      }
    }
    if (level.roll || (level.free && cfg.mode === "span")) {
      const picks = deckIndexes(level);
      if (!picks.length) return { ok: false, reason: "deck", sag: 99, lean: 0, frames: [] };
      let worst = null;
      for (const loadIndex of picks) {
        const r = tagFail(level, proveTruss({ joints: state.joints, members: state.members, loadIndex }, opts));
        if (!r.ok) return r;
        if (!worst || r.sag > worst.sag) worst = r;
      }
      return worst;
    }
    if (level.free && cfg.mode === "spire") {
      const top = topLinkedIndex();
      if (top < 0) return { ok: false, reason: "short", sag: 0, lean: 0, frames: [] };
      const gust = { ...opts, gust: true };
      const a = tagFail(level, proveTruss({ joints: state.joints, members: state.members, loadIndex: top }, { ...gust, nudgeSign: 1 }));
      if (!a.ok) return a;
      const b = tagFail(level, proveTruss({ joints: state.joints, members: state.members, loadIndex: top }, { ...gust, nudgeSign: -1 }));
      return b.ok ? (a.sag >= b.sag ? a : b) : b;
    }
    return tagFail(level, proveTruss({
      joints: state.joints,
      members: state.members,
      loadIndex: level.loadIndex,
    }, opts));
  }

  function shipClear(level, stars) {
    if (!cfg.twApp || !level) return null;
    const id = String(level.id || "");
    if (!id || state.sentScore[id]) return null;
    const api = window.KulibertWho;
    if (!api) return null;
    const earned = Math.max(1, Math.min(4, stars || 1));
    const star = earned >= 4 ? 3 : earned;
    const ms = Math.max(0, Date.now() - (state.openedAt || Date.now()));
    let row = null;
    try {
      if (typeof api.record === "function") {
        row = api.record({
          app: cfg.twApp,
          version: String(cfg.version || ""),
          event: "score",
          level: id,
          score: earned,
          max: 4,
          stars: star,
          xp: earned * 2,
          skill: "structures",
          ms: ms,
        });
      } else if (typeof api.mark === "function") {
        row = api.mark(cfg.twApp, ("Clear " + (level.name || id)).slice(0, 32));
      }
    } catch (eScore) {}
    if (!row) return null;
    state.sentScore[id] = true;
    if (window.KulibertBar && typeof window.KulibertBar.toast === "function") {
      window.KulibertBar.toast("Saved");
    }
    return row;
  }

  function finish(result) {
    state.phase = "idle";
    state.view = null;
    state.hot = !result.ok && Number.isInteger(result.hot) ? result.hot : null;
    const level = active();
    const held = !!result.ok;
    const onBudget = state.members.length <= level.budget;
    const met = held && (!level.onBudget || onBudget);
    const stars = starsFor(held, metersOf(state.joints, state.members, level), parMeters(level), result.sag || 0, level.sagLimit || 30);
    if (stars > (state.stars[level.id] || 0)) state.stars[level.id] = stars;
    state.bestStars = Math.max(state.bestStars, stars);
    let first = false;
    if (met) {
      first = !state.cleared[level.id] && level.id === levels[0].id;
      state.cleared[level.id] = true;
      if (level.free) state.challengeMet = true;
    }
    save();
    syncTrack();
    armRetry(!held);
    paintReadout();
    if (!held) {
      hideNextLevel();
      const line = failReason(result);
      state.hadMiss = true;
      state.fixLine = line;
      setStatus(t("fix"), line + t("thenTest"), "fail");
      showPlate(t("fix"), line, "✕");
    } else if (!met) {
      hideNextLevel();
      state.fixLine = "";
      const line = t("budget");
      setStatus(t("testPass"), line + " " + starPhrase(stars) + ".", "pass");
      showPlate(t("testPass"), line, "✓");
    } else {
      state.fixLine = "";
      const fixed = state.hadMiss;
      state.hadMiss = false;
      let line = starPhrase(stars) + ".";
      if (stars > 0 && stars < 3) line += t("fewer");
      if (fixed) line = t("fixedLead") + line;
      else if (first) line = t("firstClear") + line;
      else line = t("held") + line;
      if (!level.free && level.id === levels[levels.length - 1].id && pathClear()) {
        line += t("pathOpen");
      } else if (!level.free && !pathClear()) {
        line += t("nextJob");
      }
      setStatus(fixed ? t("youFixed") : t("clear"), line, "pass");
      showPlate(fixed ? t("youFixed") : t("clear"), line, "✓");
      shipClear(level, stars);
      paintNextLevel();
      const nxtBtn = document.getElementById("next-level");
      if (nxtBtn && !nxtBtn.hidden) nxtBtn.focus();
    }
    if (state.bet) {
      const saidHold = state.bet === "hold";
      const right = saidHold === held;
      const extra = right ? t("betMatch") : t("betMiss");
      capText.textContent = capText.textContent + extra;
      state.bet = null;
      syncBet();
    }
    draw();
    showNext();
  }

  function playResult(result) {
    const frames = result.frames || [];
    state.hot = Number.isInteger(result.hot) ? result.hot : null;
    if (quietMode() || frames.length < 2) {
      finish(result);
      return;
    }
    state.phase = "play";
    let i = 0;
    const step = () => {
      if (state.phase !== "play") return;
      state.view = frames[i];
      draw();
      i += 1;
      if (i < frames.length) requestAnimationFrame(step);
      else finish(result);
    };
    requestAnimationFrame(step);
  }

  function theaterLines(level) {
    const spire = cfg.mode === "spire";
    if (!spire) {
      if (level.roll || level.free) {
        return [
          [t("thSpan"), (level.spanM || 0) + " m."],
          [t("thTruck"), t("truckBay")],
          [t("thWatch"), t("watchFold")],
        ];
      }
      return [
        [t("thSpan"), (level.spanM || 0) + " m."],
        [t("thLoad"), cfg.workshop ? t("loadBridge") : t("loadTruss")],
        [t("thWatch"), t("watchTri")],
      ];
    }
    if (level.gust || level.free) {
      return [
        [t("height"), (level.goalM || 0) + t("goalTail")],
        [t("thPush"), t("pushTop")],
        [t("thWatch"), t("watchStory")],
      ];
    }
    return [
      [t("height"), (level.goalM || 0) + t("goalTail")],
      [t("thLoad"), t("loadTop")],
      [t("thWatch"), t("watchDiag")],
    ];
  }
  function startTest() {
    if (busy()) return;
    state.stretch = null;
    state.drag = null;
    armRetry(false);
    hideNextLevel();
    const go = () => {
      theater = null;
      state.phase = "play";
      const result = runCheck();
      playResult(result);
    };
    const level = active();
    state.phase = "theater";
    theater = runProveTheater({
      setStatus,
      totalMs: cfg.mode === "span" ? 1500 : 1200,
      lines: theaterLines(level),
      onDone: go,
    });
  }

  function retry() {
    if (theater && theater.cancel) theater.cancel();
    theater = null;
    state.phase = "idle";
    state.hot = null;
    state.hadMiss = false;
    state.fixLine = "";
    cloneLevel(active());
    armRetry(false);
    hideNextLevel();
    coach();
    draw();
  }

  function syncBet() {
    const bar = document.getElementById("bet-bar");
    if (!bar) return;
    bar.hidden = state.members.length === 0 || state.phase !== "idle";
    const label = bar.querySelector(".bet-label");
    if (label) {
      label.textContent = cfg.mode === "spire"
        ? "Will the tower stand?"
        : cfg.workshop
          ? "Will it hold?"
          : "Will the truss hold?";
    }
    for (const btn of bar.querySelectorAll(".bet-chip")) {
      btn.setAttribute("aria-pressed", btn.dataset.bet === state.bet ? "true" : "false");
    }
  }

  function placeEnd(from, sx, sy) {
    const A = state.joints[from];
    if (!A) return false;
    const m = toModel(sx, sy);
    const dx = m.x - A.x;
    const dy = m.y - A.y;
    const len = Math.hypot(dx, dy);
    if (len < 28) {
      setStatus(t("stretch"), t("tapEnd"), "", true);
      return false;
    }
    const cap = 175;
    const scale = len > cap ? cap / len : 1;
    state.joints.push({ x: A.x + dx * scale, y: A.y + dy * scale, fixed: false });
    state.members.push({ a: from, b: state.joints.length - 1 });
    hideNextLevel();
    return true;
  }
  function finishPointer(ev) {
    const s = eventPoint(ev);
    if (state.drag != null) {
      state.drag = null;
      draw();
      return;
    }
    if (!state.stretch) return;
    const from = state.stretch.from;
    state.stretch = null;
    const hit = nearestJoint(s.x, s.y, 64);
    if (hit < 0) {
      if (cfg.workshop && state.joints.length < 2) {
        if (placeEnd(from, s.x, s.y)) {
          syncBet();
          coach();
        }
      } else if (cfg.workshop || state.joints.length >= 2) {
        setStatus(t("stretch"), t("letGo"), "", true);
      } else {
        setStatus(t("stretch"), t("tapEnd"), "", true);
      }
    } else if (!addMember(from, hit)) {
      if (from !== hit && hasMember(from, hit)) {
        setStatus(t("stretch"), t("sideIn"), "", true);
      }
    } else {
      syncBet();
      coach();
    }
    draw();
  }
  canvas.addEventListener("pointerdown", (ev) => {
    if (busy()) return;
    if (canvas.setPointerCapture) canvas.setPointerCapture(ev.pointerId);
    const s = eventPoint(ev);
    const hit = nearestJoint(s.x, s.y, 56);
    if (state.tool === "delete") {
      if (hit >= 0 && !state.joints[hit].fixed) {
        state.joints.splice(hit, 1);
        state.members = state.members
          .filter((m) => m.a !== hit && m.b !== hit)
          .map((m) => ({
            a: m.a > hit ? m.a - 1 : m.a,
            b: m.b > hit ? m.b - 1 : m.b,
          }));
        hideNextLevel();
      } else {
        const mi = memberAt(s.x, s.y);
        if (mi >= 0) {
          state.members.splice(mi, 1);
          hideNextLevel();
        }
      }
      coach();
      draw();
      return;
    }
    if (state.tool === "move" && hit >= 0 && !state.joints[hit].fixed) {
      state.drag = hit;
      return;
    }
    if (hit >= 0) {
      state.stretch = { from: hit, sx: s.x, sy: s.y };
      if (cfg.workshop && state.joints.length < 2) {
        setStatus(t("stretch"), t("tapEnd"), "", true);
      }
      draw();
      return;
    }
    if (state.tool === "joint") {
      const model = toModel(s.x, s.y);
      const slot = nearestSlot(model);
      if (slot) {
        state.joints.push({ x: slot.x, y: slot.y, fixed: !!slot.fixed });
      } else if (cfg.workshop) {
        state.joints.push({ x: model.x, y: model.y, fixed: false });
      } else {
        return;
      }
      hideNextLevel();
      setStatus(t("joint"), state.joints.length < 2 ? t("tapEnd") : t("letGo"), "", true);
      if (!cfg.workshop) coach();
      draw();
    }
  });
  window.addEventListener("pointermove", (ev) => {
    if (!state.stretch && state.drag == null) return;
    const s = eventPoint(ev);
    if (state.drag != null) {
      const m = toModel(s.x, s.y);
      const joint = state.joints[state.drag];
      if (joint && (joint.x !== m.x || joint.y !== m.y)) hideNextLevel();
      if (joint) {
        joint.x = m.x;
        joint.y = m.y;
      }
      draw();
      return;
    }
    state.stretch.sx = s.x;
    state.stretch.sy = s.y;
    draw();
  });
  window.addEventListener("pointerup", finishPointer);
  window.addEventListener("pointercancel", finishPointer);

  function setTool(name) {
    if (busy()) return;
    state.tool = name;
    syncTools();
  }

  const helpApi = mountHelpOverlay({
    title: cfg.helpTitle,
    version: cfg.version,
    note: cfg.note,
    classHref: "./changelog.html",
    calmKey: cfg.calmKey,
    steps: cfg.steps,
    onReplayIntro: () => {
      writeFlag(cfg.assistKey, false);
      openAssist();
    },
  });
  wireEdgeHelp(document.getElementById("edge-btn"), document.getElementById("edge-menu"), helpApi.open);

  function narrowBoard() {
    return window.matchMedia("(max-width: 720px)").matches;
  }
  function assistLine() {
    const level = active();
    if (!level.free && level.n === 1 && state.members.length < 2) return lineAssist();
    return faceJob(level);
  }
  function syncJobAssist() {
    const text = document.getElementById("assist-plate-text");
    const plate = document.getElementById("assist-plate");
    if (!text || !plate || plate.hidden) return;
    const line = assistLine();
    if (text.textContent !== line) text.textContent = line;
  }
  function openAssist() {
    const plate = document.getElementById("assist-plate");
    const text = document.getElementById("assist-plate-text");
    if (!plate || !text) return;
    if (narrowBoard() && !cfg.workshop) {
      plate.classList.remove("show");
      plate.hidden = true;
      plate.setAttribute("hidden", "");
      return;
    }
    text.textContent = assistLine();
    plate.classList.add("show");
    plate.hidden = false;
    plate.removeAttribute("hidden");
  }
  function hideAssist() {
    const plate = document.getElementById("assist-plate");
    if (!plate) return;
    plate.classList.remove("show");
    plate.hidden = true;
    plate.setAttribute("hidden", "");
    writeFlag(cfg.assistKey, true);
    if (cfg.workshop && assistBtn) assistBtn.setAttribute("aria-pressed", "false");
    syncAssistCue();
  }

  function showNext() {
    const next = document.getElementById("next-door");
    if (!next || !cfg.nextDoor || !pathClear()) return;
    next.hidden = false;
    next.removeAttribute("hidden");
    next.href = cfg.nextDoor;
  }
  function stayHere() {
    return /(?:\?|&)stay=1(?:&|$)/.test(location.search);
  }

  function rememberHome(el) {
    if (!el || el.__home) return;
    el.__home = { parent: el.parentNode, next: el.nextSibling };
  }
  function restoreHome(el) {
    if (!el || !el.__home || !el.__home.parent) return;
    const home = el.__home;
    if (home.next && home.next.parentNode === home.parent) home.parent.insertBefore(el, home.next);
    else home.parent.appendChild(el);
  }
  function landPieces() {
    return [
      document.querySelector(".top-actions"),
      document.querySelector(".track"),
      document.querySelector(".edge-pocket"),
      document.getElementById("access-gear"),
      document.getElementById("read-line"),
    ].filter(Boolean);
  }
  function parkWho() {
    const bar = document.querySelector(".tw-app-bar");
    if (!bar) return;
    const park = document.getElementById("who-park");
    const kinds = document.getElementById("kinds");
    const top = document.querySelector(".top");
    const actions = document.querySelector(".top-actions");
    const portrait = window.matchMedia("(max-width: 720px) and (orientation: portrait)").matches;
    if (!classicTheme() && shortLand() && park) {
      if (bar.parentElement !== park) park.appendChild(bar);
      return;
    }
    if (!classicTheme() && portrait && kinds) {
      if (bar.parentElement !== kinds) kinds.insertBefore(bar, kinds.firstChild);
      return;
    }
    if (!classicTheme() && top) {
      const before = actions && actions.parentElement === top ? actions : null;
      if (bar.parentElement !== top) {
        if (before) top.insertBefore(bar, before);
        else top.appendChild(bar);
      }
      return;
    }
    if (bar.parentElement !== document.body) document.body.appendChild(bar);
  }
  function mountLand() {
    if (classicTheme()) return;
    const pocket = document.querySelector(".pocket");
    if (!pocket || document.getElementById("land-menu")) return;
    const menu = document.createElement("button");
    menu.type = "button";
    menu.id = "land-menu";
    menu.className = "land-menu";
    menu.setAttribute("aria-expanded", "false");
    menu.setAttribute("aria-controls", "land-drawer");
    menu.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="menu-word">Menu</span>';
    const bar = document.querySelector(".kb-bar");
    if (bar) bar.insertBefore(menu, bar.firstChild);
    else pocket.insertBefore(menu, pocket.firstChild);
    const drawer = document.createElement("div");
    drawer.id = "land-drawer";
    drawer.className = "land-drawer";
    drawer.hidden = true;
    drawer.innerHTML = '<div id="land-drawer-body"><nav id="land-nav">' +
      '<button type="button" id="land-close"></button>' +
      '<button type="button" data-land="levels"></button>' +
      '<button type="button" data-land="challenge"></button>' +
      '<button type="button" data-land="help"></button>' +
      '<button type="button" data-land="settings"></button>' +
      '<button type="button" data-land="retry"></button>' +
      '<a data-land="whats" href="./changelog.html"></a>' +
      '<p id="land-rev"></p>' +
      '<p id="land-whats"></p>' +
      "</nav></div>";
    document.body.appendChild(drawer);
    const body = drawer.querySelector("#land-drawer-body");
    const nav = drawer.querySelector("#land-nav");
    const park = document.createElement("div");
    park.id = "who-park";
    pocket.appendChild(park);
    let landed = false;
    const key = "kulibert-land-drawer";
    function setDrawer(open, focusMenu) {
      document.documentElement.classList.toggle("land-open", !!open);
      drawer.hidden = !open;
      menu.setAttribute("aria-expanded", open ? "true" : "false");
      try { localStorage.setItem(key, open ? "open" : "closed"); } catch (e) {}
      if (!open && focusMenu) menu.focus();
    }
    function syncLand() {
      const want = shortLand() && !classicTheme();
      if (want !== landed) {
        landed = want;
        if (want) {
          landPieces().forEach((el) => {
            rememberHome(el);
            body.appendChild(el);
          });
          let open = false;
          try { open = localStorage.getItem(key) === "open"; } catch (e) {}
          document.documentElement.classList.toggle("land-open", open);
          drawer.hidden = !open;
          menu.setAttribute("aria-expanded", open ? "true" : "false");
        } else {
          document.documentElement.classList.remove("land-open");
          drawer.hidden = true;
          menu.setAttribute("aria-expanded", "false");
          landPieces().forEach(restoreHome);
        }
        resize();
      }
      parkWho();
    }
    menu.addEventListener("click", () => {
      if (classicTheme()) return;
      const open = !document.documentElement.classList.contains("land-open");
      setDrawer(open, false);
    });
    const landClose = drawer.querySelector("#land-close");
    if (landClose) {
      landClose.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setDrawer(false, true);
      });
    }
    if (nav) {
      nav.addEventListener("click", (ev) => {
        const hit = ev.target.closest("[data-land]");
        if (!hit || hit.getAttribute("data-land") === "whats") return;
        const kind = hit.getAttribute("data-land");
        const go = {
          levels: document.getElementById("isles-btn"),
          challenge: document.getElementById("track-challenge"),
          help: document.getElementById("edge-btn"),
          retry: document.getElementById("retry"),
        }[kind];
        if (kind === "settings") {
          const sheet = document.getElementById("access-sheet");
          setDrawer(false, false);
          if (sheet) {
            sheet.hidden = false;
            paintAccess();
          }
          return;
        }
        if (go) go.click();
        setDrawer(false, false);
      });
    }
    if (caption) {
      caption.addEventListener("click", (ev) => {
        if (classicTheme()) return;
        if (ev.target.closest("button, a")) return;
        caption.classList.toggle("is-open");
      });
    }
    const mo = new MutationObserver(() => parkWho());
    mo.observe(document.body, { childList: true });
    syncLand();
    window.addEventListener("resize", syncLand);
  }

  function setLabel(el, text) {
    if (!el || text == null || text === "") return;
    for (let i = el.childNodes.length - 1; i >= 0; i--) {
      const n = el.childNodes[i];
      if (n.nodeType === 3 && n.textContent.trim()) {
        n.textContent = " " + text;
        return;
      }
    }
    if (el.querySelector("svg")) {
      el.appendChild(document.createTextNode(" " + text));
      return;
    }
    el.textContent = text;
  }
  function paintHelp() {
    if (cfg.workshop) return;
    const title = document.getElementById("help-title");
    if (title) title.textContent = cfg.mode === "spire" ? t("helpTitleSpire") : t("helpTitleSpan");
    const note = document.querySelector("#help-overlay .help-note");
    if (note) note.textContent = cfg.mode === "spire" ? t("noteSpire") : t("noteSpan");
    const steps = document.querySelectorAll("#help-overlay .help-steps li");
    const keys = ["step1", "step2", cfg.mode === "spire" ? "step3p" : "step3s", "step4"];
    steps.forEach((li, i) => {
      if (keys[i]) li.textContent = t(keys[i]);
    });
    const close = document.querySelector("#help-overlay [data-help=close]");
    if (close) close.textContent = t("gotIt");
    const replay = document.querySelector("#help-overlay [data-help=replay]");
    if (replay) replay.textContent = t("replay");
    const calm = document.querySelector("#help-overlay [data-help=calm]");
    if (calm) {
      calm.dataset.on = t("calmOn");
      calm.dataset.off = t("calm");
      const on = calm.getAttribute("aria-pressed") === "true";
      calm.textContent = on ? calm.dataset.on : calm.dataset.off;
    }
    const klass = document.querySelector("#help-overlay .help-class a");
    if (klass) klass.textContent = t("forClass");
  }
  function paintLang() {
    applyDir();
    const stage = document.querySelector(".stage");
    if (stage) stage.setAttribute("dir", "ltr");
    const board = document.getElementById("board");
    if (board) board.setAttribute("dir", "ltr");
    setLabel(document.getElementById("tool-add"), t("joint"));
    setLabel(document.getElementById("tool-move"), t("move"));
    setLabel(document.getElementById("tool-delete"), t("delete"));
    setLabel(document.getElementById("tool-test"), t("test"));
    setLabel(document.getElementById("assist"), t("assist"));
    setLabel(document.getElementById("retry"), chrome("retry"));
    setLabel(document.getElementById("retry-now"), chrome("retry"));
    setLabel(document.getElementById("isles-btn"), chrome("levels"));
    const levelsBtn = document.getElementById("track-levels");
    if (levelsBtn && !levelsBtn.querySelector("svg")) levelsBtn.textContent = chrome("levels");
    const chal = document.getElementById("track-challenge");
    if (chal && !chal.querySelector(".chal-label") && !chal.querySelector("svg")) chal.textContent = t("challenge");
    document.querySelectorAll(".top-actions a[href='/'], #edge-menu a[href='/']").forEach((a) => {
      a.textContent = chrome("room");
    });
    const edge = document.getElementById("edge-btn");
    if (edge) {
      setLabel(edge, chrome("help"));
      edge.setAttribute("aria-label", chrome("help"));
    }
    const howto = document.querySelector("[data-edge=howto]");
    if (howto) howto.textContent = t("howTo");
    const design = document.querySelector("#edge-menu a[href='/holdit/']");
    if (design) design.textContent = t("design");
    const forClass = document.querySelector("#edge-menu a[href='./changelog.html']");
    if (forClass) forClass.textContent = t("forClass");
    const betLabel = document.querySelector(".bet-label");
    if (betLabel) betLabel.textContent = cfg.mode === "spire" ? t("betAskSpire") : t("betAsk");
    const hold = document.getElementById("bet-hold");
    const fall = document.getElementById("bet-fall");
    if (hold) hold.textContent = t("hold");
    if (fall) fall.textContent = t("fall");
    const isleTitle = document.getElementById("isle-title");
    if (isleTitle) isleTitle.textContent = t("pathTitle");
    const isleClose = document.getElementById("isle-close");
    if (isleClose) isleClose.textContent = chrome("close");
    const wall = document.querySelector(".isle-wall");
    if (wall) wall.textContent = cfg.mode === "spire" ? t("isleWallSpire") : t("isleWallSpan");
    const menuWord = document.querySelector("#land-menu .menu-word");
    const menuLabel = chrome("menu") || "Menu";
    if (menuWord) menuWord.textContent = menuLabel;
    const menuBtn = document.getElementById("land-menu");
    if (menuBtn) menuBtn.setAttribute("aria-label", menuLabel);
    const landWord = {
      levels: chrome("levels"),
      challenge: t("challenge"),
      help: chrome("help"),
      settings: chrome("settings"),
      retry: chrome("retry"),
      whats: (window.KulibertI18n && typeof window.KulibertI18n.t === "function" && window.KulibertI18n.t("whatsNew")) || "What's new",
    };
    Object.keys(landWord).forEach((name) => {
      const node = document.querySelector("#land-nav [data-land='" + name + "']");
      if (node && landWord[name]) node.textContent = landWord[name];
    });
    const landRev = document.getElementById("land-rev");
    if (landRev) landRev.textContent = cfg.version || "";
    const landWhats = document.getElementById("land-whats");
    if (landWhats) landWhats.textContent = t("whatsNewLead");
    const brandRev = document.querySelector(".brand p");
    if (brandRev && cfg.version) brandRev.textContent = cfg.version;
    const got = document.getElementById("assist-gotit");
    if (got) got.textContent = t("gotIt");
    const strong = document.querySelector("#assist-plate strong");
    if (strong) strong.textContent = t("assist");
    const gear = document.getElementById("access-gear");
    if (gear) gear.textContent = chrome("settings");
    const readBtn = document.getElementById("read-line");
    if (readBtn) readBtn.textContent = chrome("read");
    const title = document.getElementById("access-title");
    if (title) title.textContent = chrome("settings");
    const lab = document.getElementById("access-lang-label");
    if (lab) lab.textContent = chrome("language");
    const speakBtn = document.getElementById("access-speak");
    if (speakBtn) speakBtn.textContent = chrome("read");
    const bigBtn = document.getElementById("access-big");
    if (bigBtn) bigBtn.textContent = t("big");
    const closeBtn = document.getElementById("access-close");
    if (closeBtn) closeBtn.textContent = chrome("close");
    const closeTop = document.getElementById("access-close-top");
    if (closeTop) closeTop.textContent = chrome("close");
    const landClose = document.getElementById("land-close");
    if (landClose) landClose.textContent = chrome("close");
    const nextBtn = document.getElementById("next-level");
    if (nextBtn && !nextBtn.hidden) {
      const nxt = nextAfter(active());
      if (nxt) nextBtn.textContent = (nxt.free ? t("challenge") : t("nextLevel")) + " ›";
    }
    const h1 = document.querySelector(".brand h1");
    if (h1 && !h1.querySelector("bdi")) {
      const name = h1.textContent.trim();
      h1.innerHTML = "<bdi>" + name + "</bdi>";
    }
    paintAccess();
    paintHelp();
    paintReadout();
    syncTrack();
    if (state.phase === "idle") coach();
  }

  load();
  if (cfg.retireTo && readFlag(cfg.retireFlag || "kulibert-holdit-clear-v1") && !stayHere()) {
    location.replace(cfg.retireTo);
    return;
  }
  showNext();
  if (readFlag(cfg.calmKey)) document.documentElement.classList.add("calm-clear");
  cloneLevel(active());
  syncTools();
  syncTrack();
  mountAccess();
  coach();
  voiceReady = true;
  resize();
  window.addEventListener("resize", resize);
  if (window.ResizeObserver) {
    const watch = new ResizeObserver(() => resize());
    watch.observe(canvas);
  }
  mountLand();
  ensureNextBtn();

  const addBtn = document.getElementById("tool-add");
  const moveBtn = document.getElementById("tool-move");
  const delBtn = document.getElementById("tool-delete");
  const testBtn = document.getElementById("tool-test");
  if (addBtn) addBtn.addEventListener("click", () => setTool("joint"));
  if (moveBtn) moveBtn.addEventListener("click", () => setTool("move"));
  if (delBtn) delBtn.addEventListener("click", () => setTool("delete"));
  if (testBtn) testBtn.addEventListener("click", startTest);
  if (retryBtn) retryBtn.addEventListener("click", retry);
  const retryNow = document.getElementById("retry-now");
  if (retryNow) retryNow.addEventListener("click", retry);
  const islesBtn = document.getElementById("isles-btn");
  if (islesBtn) islesBtn.addEventListener("click", openMap);
  const isleClose = document.getElementById("isle-close");
  if (isleClose) isleClose.addEventListener("click", closeMap);
  const isleMap = document.getElementById("isle-map");
  if (isleMap) isleMap.addEventListener("click", (ev) => { if (ev.target === isleMap) closeMap(); });
  const trackLevels = document.getElementById("track-levels");
  const trackChallenge = document.getElementById("track-challenge");
  if (trackLevels) trackLevels.addEventListener("click", () => {
    if (busy()) return;
    const current = active();
    if (current.free || state.track === "challenge") {
      beginLevel(levels[0].id);
      return;
    }
    openMap(trackLevels);
  });
  if (trackChallenge) trackChallenge.addEventListener("click", () => {
    if (busy()) return;
    if (!pathClear()) {
      setStatus(t("path"), cfg.workshop ? t("pathFirst") : t("pathTen"), "");
      return;
    }
    beginLevel(freeLevel.id);
  });
  for (const btn of document.querySelectorAll(".bet-chip")) {
    btn.addEventListener("click", () => {
      state.bet = btn.dataset.bet;
      syncBet();
      setStatus(t("bet"), btn.dataset.bet === "hold"
        ? (cfg.workshop ? t("betHold") : t("betHoldSoft"))
        : (cfg.workshop ? t("betFall") : t("betFallSoft")), "");
    });
  }
  const got = document.getElementById("assist-gotit");
  if (got) got.addEventListener("click", hideAssist);
  if (assistBtn) {
    assistBtn.addEventListener("click", () => {
      const on = assistBtn.getAttribute("aria-pressed") !== "true";
      assistBtn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) openAssist();
      else hideAssist();
      if (cfg.workshop) syncAssistCue();
    });
  }
  window.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape") {
      const map = document.getElementById("isle-map");
      if (map && !map.hidden) {
        ev.preventDefault();
        closeMap();
        return;
      }
      const sheet = document.getElementById("access-sheet");
      if (sheet && !sheet.hidden) {
        ev.preventDefault();
        sheet.hidden = true;
        const menu = document.getElementById("land-menu");
        if (menu) menu.focus();
        return;
      }
      const drawer = document.getElementById("land-drawer");
      if (drawer && !drawer.hidden) {
        ev.preventDefault();
        document.documentElement.classList.remove("land-open");
        drawer.hidden = true;
        const menu = document.getElementById("land-menu");
        if (menu) {
          menu.setAttribute("aria-expanded", "false");
          menu.focus();
        }
        try { localStorage.setItem("kulibert-land-drawer", "closed"); } catch (eEsc) {}
      }
      return;
    }
    if (ev.key === "Enter") {
      if (ev.target && (ev.target.tagName === "BUTTON" || ev.target.tagName === "A")) return;
      ev.preventDefault();
      startTest();
    }
  });
  if (cfg.workshop) {
    if (!readFlag(cfg.assistKey)) {
      if (assistBtn) assistBtn.setAttribute("aria-pressed", "true");
      openAssist();
    } else if (assistBtn) {
      assistBtn.setAttribute("aria-pressed", "false");
    }
    syncAssistCue();
  } else if (!readFlag(cfg.assistKey)) openAssist();
  paintReadout();
  draw();
  paintLang();
  window.addEventListener("kulibert-lang", (ev) => {
    const lang = (ev && ev.detail && ev.detail.lang) || uiLang();
    const again = () => {
      paintLang();
      const map = document.getElementById("isle-map");
      if (map && !map.hidden) renderMap();
    };
    if (window.KulibertI18n && typeof window.KulibertI18n.ready === "function") {
      window.KulibertI18n.ready(lang, again);
    } else again();
  });
  if (window.KulibertI18n && typeof window.KulibertI18n.ready === "function") {
    window.KulibertI18n.ready(uiLang(), () => paintLang());
  }
}
