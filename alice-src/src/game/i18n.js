import en from "../i18n/en.json";
import uk from "../i18n/uk.json";
import ru from "../i18n/ru.json";
import es from "../i18n/es.json";
import ar from "../i18n/ar.json";
import fa from "../i18n/fa-AF.json";
import rw from "../i18n/rw.json";
import ti from "../i18n/ti.json";

export const PACKS = { en, uk, ru, es, ar, "fa-AF": fa, rw, ti };
export const RTL = { ar: 1, "fa-AF": 1 };

export function lang() {
  return document.documentElement.getAttribute("data-kp-lang") || "en";
}
export function rtl() {
  return !!RTL[lang()];
}
export function t(key) {
  const pack = PACKS[lang()] || en;
  return pack[key] || en[key] || key;
}
export function say(text) {
  const node = document.getElementById("live");
  if (node) node.textContent = text || "";
}
