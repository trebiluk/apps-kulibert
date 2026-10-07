export const LOOK_IDS = ["teal", "dawn", "dusk", "night", "gold", "snow"];

const LOOKS = {
  teal: { sky: "#14506a", top: "#9ee7f5", bot: "#14506a", page: "#06122b" },
  dawn: { sky: "#7a3b48", top: "#ffc7b0", bot: "#7a3b48", page: "#2a1218" },
  dusk: { sky: "#3a2a6a", top: "#f0b0ea", bot: "#3a2a6a", page: "#140c28" },
  night: { sky: "#0e1626", top: "#3a4c6e", bot: "#0e1626", page: "#05070d" },
  gold: { sky: "#6b4a16", top: "#ffd56a", bot: "#6b4a16", page: "#241608" },
  snow: { sky: "#4e6d86", top: "#f4fbff", bot: "#4e6d86", page: "#162430" },
};

function hex(s) {
  return parseInt(String(s).replace("#", ""), 16) >>> 0;
}

function mix(a, b, t) {
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | bl;
}

export function skyOf(name) {
  return (LOOKS[name] || LOOKS.teal).sky;
}

export function skyGradient(name, weather) {
  const look = LOOKS[name] || LOOKS.teal;
  let top = hex(look.top);
  let bot = hex(look.bot);
  if (weather === "Night") {
    top = mix(top, 0x070b14, 0.78);
    bot = mix(bot, 0x121a2c, 0.7);
  } else if (weather === "Drizzle") {
    top = mix(top, 0x8b98a6, 0.5);
    bot = mix(bot, 0x3e4c58, 0.45);
  } else if (weather === "Snowy") {
    top = mix(top, 0xf7fbff, 0.62);
    bot = mix(bot, 0xb7c9d6, 0.45);
  } else if (weather === "Breezy") {
    top = mix(top, 0xffffff, 0.22);
  }
  return { top, bot, flat: look.sky };
}

export function applyLook(name) {
  const look = LOOKS[name] ? name : "teal";
  document.documentElement.dataset.apTheme = look;
  document.body.style.background = LOOKS[look].page;
  return LOOKS[look].sky;
}
