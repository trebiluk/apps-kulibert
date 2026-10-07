import { dailyWeather } from "./world.js";

export function dayKey(now = new Date()) {
  return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
}

export function dailySeed(now = new Date()) {
  const s = dayKey(now);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function dailyLevel() {
  return {
    id: "lookout-daily",
    kinds: ["hawk", "coyote", "snake"],
    decoys: ["cloud", "rabbit"],
    holes: 5,
    seconds: 60,
    hawks: 9,
    goalScore: 700,
    pupsMin: 4,
    noFalse: false,
    combo: 0,
    stars: [400, 700, 1100],
    speed: 1,
    field: dailyWeather(),
  };
}

export function endlessLevel(wave) {
  const n = Math.max(1, wave || 1);
  return {
    id: "lookout-endless",
    kinds: ["hawk", "coyote", "snake"],
    decoys: n >= 2 ? ["cloud", "rabbit", "weed"] : ["cloud"],
    holes: 5,
    seconds: 24,
    hawks: 5 + Math.min(3, n),
    goalScore: 1,
    pupsMin: 0,
    speed: Math.min(1.6, 0.9 + n * 0.08),
    stars: [99999],
  };
}

export function titleKey(mode, level) {
  if (mode === "daily") return "today";
  if (mode === "endless") return "endless";
  const m = /L0?(\d+)/.exec((level && level.id) || "");
  if (!m) return "lookout";
  return "l0" + Number(m[1]);
}
