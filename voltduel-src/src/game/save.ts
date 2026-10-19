const KEY = "volt-duel-v1";

export type Best = { time: number; coins: number; name: string };

export type Save = {
  best: Record<string, Best>;
  muted: boolean;
};

export function emptySave(): Save {
  return { best: {}, muted: false };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw) as Partial<Save>;
    return {
      best: parsed.best && typeof parsed.best === "object" ? parsed.best : {},
      muted: !!parsed.muted,
    };
  } catch {
    return emptySave();
  }
}

export function writeSave(save: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch {
    /* ignore quota */
  }
}

export function considerBest(save: Save, levelId: string, time: number, coins: number, name: string): Save {
  const prev = save.best[levelId];
  const better =
    !prev || time < prev.time - 0.005 || (Math.abs(time - prev.time) <= 0.005 && coins > prev.coins);
  if (!better) return save;
  return { ...save, best: { ...save.best, [levelId]: { time, coins, name } } };
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe - m * 60;
  if (m > 0) return `${m}:${s.toFixed(2).padStart(5, "0")}`;
  return s.toFixed(2);
}
