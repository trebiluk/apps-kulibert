// Shared XP wallet for SpanCraft and Spire Lab. One purse on this Chromebook.
// Missions pay once. The ladder shows the next rung.

const KEY = "kulibert-xp-wallet-v1";

export const LADDERS = {
  spancraft: [
    { id: "cross", label: "Cross", xp: 10, hint: "Pass the load." },
    { id: "short", label: "Short", xp: 15, hint: "Two stars. Stay on budget." },
    { id: "clean", label: "Clean", xp: 25, hint: "Three stars." },
  ],
  spire: [
    { id: "stand", label: "Stand", xp: 10, hint: "One floor stays up." },
    { id: "line", label: "Line", xp: 15, hint: "Two even drops in a row." },
    { id: "climb", label: "Climb", xp: 25, hint: "Three floors standing." },
  ],
};

function blank() {
  return { v: 1, xp: 0, done: { spancraft: [], spire: [] } };
}

export function readWallet() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!data || data.v !== 1) return blank();
    const done = data.done || {};
    return {
      v: 1,
      xp: Number(data.xp) || 0,
      done: {
        spancraft: Array.isArray(done.spancraft) ? done.spancraft : [],
        spire: Array.isArray(done.spire) ? done.spire : [],
      },
    };
  } catch {
    return blank();
  }
}

function writeWallet(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* private mode */
  }
}

export function award(door, ids) {
  const data = readWallet();
  const list = LADDERS[door] || [];
  const have = new Set(data.done[door] || []);
  let gained = 0;
  for (const id of ids) {
    const rung = list.find((item) => item.id === id);
    if (!rung || have.has(id)) continue;
    have.add(id);
    gained += rung.xp;
  }
  data.done[door] = [...have];
  data.xp += gained;
  if (gained) writeWallet(data);
  return { gained, total: data.xp };
}

export function paintLadder(door) {
  const data = readWallet();
  const xp = document.getElementById("xp-n");
  if (xp) xp.textContent = String(data.xp);
  const ol = document.getElementById("ladder");
  if (!ol) return;
  const done = new Set((data.done && data.done[door]) || []);
  let marked = false;
  ol.replaceChildren(
    ...LADDERS[door].map((rung) => {
      const li = document.createElement("li");
      const isDone = done.has(rung.id);
      const isNow = !isDone && !marked;
      if (isNow) marked = true;
      li.className = isDone ? "done" : isNow ? "now" : "later";
      li.textContent = (isDone ? "✓ " : "") + rung.label;
      li.title = rung.hint + " · " + rung.xp + " XP";
      return li;
    }),
  );
}
