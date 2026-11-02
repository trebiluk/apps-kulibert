#!/usr/bin/env node
// Compare the hub's version list (index.html li[data-door]) with what each live app reports.
// Usage: node scripts/hub-versions.mjs           -> report
//        node scripts/hub-versions.mjs --write   -> also update index.html where the app is newer
import { readFileSync, writeFileSync } from "node:fs";

const HOST = "https://apps.kulibert.net";
const file = new URL("../index.html", import.meta.url);
let html = readFileSync(file, "utf8");
const rows = [...html.replace(/&amp;/g, "&").matchAll(/<li data-door="([^"]+)" data-prefix="([^"]*)"><a[^>]*>([^<]*)<strong>([^<]+)<\/strong>/g)]
  .map(m => ({ door: m[1], prefix: m[2], name: m[3].trim(), hub: m[4].trim() }));

const nums = v => (String(v).match(/\d+(\.\d+)+/) || [""])[0].split(".").map(Number);
const newer = (a, b) => { const x = nums(a), y = nums(b); for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); return false; };

// Where to look, most reliable first. Each returns a version string or "".
const probes = [
  s => (s.match(/data-version="([^"]+)"/) || [])[1],
  s => (s.match(/<meta name="[a-z-]*-rev" content="([^"]+)"/) || [])[1],
  s => (s.match(/\bVERSION\s*=\s*"([^"]+)"/) || [])[1],
  s => (s.match(/kulibert-bar\.js\?v=(\d+\.\d+\.\d+)"/) || [])[1],
];

async function live(door, prefix) {
  const url = door.startsWith("http") ? door : HOST + door;
  const res = await fetch(url, { redirect: "follow" });
  const page = await res.text();
  const named = prefix && prefix !== "v" ? new RegExp("\\b" + prefix + "[ -](\\d+\\.\\d+\\.\\d+)\\b") : null;
  const pick = text => {
    if (named) {
      const m = text.match(named);
      if (m) return prefix + " " + m[1];
      // Some apps print the number with no prefix (Bertopia: data-version="2.5.598"); a bare number is still this app's.
      const bare = (text.match(/data-version="v?(\d+\.\d+\.\d+)"/) || [])[1];
      return bare ? prefix + " " + bare : "";
    }
    for (const p of probes) { const v = p(text); if (v && /\d+\.\d+/.test(v)) return v; }
    return "";
  };
  let v = pick(page);
  if (v) return v;
  // Then the app's own scripts (not the shared ones), e.g. music/version.js or a Vite bundle.
  const js = [...page.matchAll(/src="([^"]+\.js)(?:\?[^"]*)?"/g)].map(m => new URL(m[1], url).href)
    .filter(h => !h.includes("/shared/") && !h.includes("grok.com")).slice(0, 6);
  for (const src of js) {
    try {
      const code = await (await fetch(src)).text();
      v = pick(code);
      if (!v && !named) { const m = code.match(/\b([A-Z]{2,3}) (\d+\.\d+\.\d+)\b/); if (m) v = m[1] + " " + m[2]; }
      if (v) return v;
    } catch {}
  }
  return "";
}

const write = process.argv.includes("--write");
let changed = 0;
for (const r of rows) {
  let app = "";
  try { app = await live(r.door, r.prefix); } catch (e) { app = ""; }
  const ahead = app && newer(app, r.hub);
  console.log(`${ahead ? "BEHIND" : app ? "ok    " : "??    "} ${r.name.padEnd(16)} hub ${r.hub.padEnd(12)} app ${app || "(not found)"}`);
  if (ahead && write) {
    const shown = (r.prefix === "v" ? "v" : r.prefix ? r.prefix + " " : "") + nums(app).join(".");
    html = html.replace(`${r.name} <strong>${r.hub}</strong>`, `${r.name} <strong>${shown}</strong>`);
    changed++;
  }
}
if (write && changed) { writeFileSync(file, html); console.log(`Updated ${changed} versions in index.html.`); }
