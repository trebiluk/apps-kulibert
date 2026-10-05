export const LOOK_IDS = ["teal", "dawn", "dusk", "night", "gold", "snow"];

const LOOKS = {
  teal: { sky: "#14506a", page: "#06122b" },
  dawn: { sky: "#7a3b48", page: "#2a1218" },
  dusk: { sky: "#3a2a6a", page: "#140c28" },
  night: { sky: "#0e1626", page: "#05070d" },
  gold: { sky: "#6b4a16", page: "#241608" },
  snow: { sky: "#4e6d86", page: "#162430" },
};

export function skyOf(name) {
  return (LOOKS[name] || LOOKS.teal).sky;
}

export function applyLook(name) {
  const look = LOOKS[name] ? name : "teal";
  document.documentElement.dataset.apTheme = look;
  document.body.style.background = LOOKS[look].page;
  return LOOKS[look].sky;
}
