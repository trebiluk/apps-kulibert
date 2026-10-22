#!/usr/bin/env node
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

function fail(reason) {
  console.error("FAIL: " + reason);
  process.exit(1);
}

const root = process.cwd();
const indexPath = root + "/index.html";
if (!existsSync(indexPath)) fail("index.html missing");

const html = readFileSync(indexPath, "utf8");

// 1. tech-room-rev appears in more than one source
const metas = [...html.matchAll(/<meta name="tech-room-rev" content="([^"]+)"/g)];
if (metas.length !== 1) fail(`tech-room-rev meta count ${metas.length} (must be exactly 1)`);
const rev = metas[0][1];
const stamps = [...html.matchAll(/src="\/shared\/[^"]+\?v=([^"]+)"|s\.src = "\/shared\/[^"]+\?v=([^"]+)"/g)];
for (const m of stamps) {
  const v = m[1] || m[2];
  if (v !== rev) fail(`Hub ?v= stamp "${v}" ≠ meta "${rev}"`);
}

// 2. any #live-chips data-door not same-origin (skip if one() early-returns on origin mismatch)
const hasOriginGuard = /new URL\(door,\s*location\.href\)\.origin\s*!==\s*location\.origin/.test(html);
if (!hasOriginGuard) {
  const chipSection = html.match(/<ul[^>]*id="live-chips"[\s\S]*?<\/ul>/);
  if (chipSection) {
    const doors = [...chipSection[0].matchAll(/data-door="([^"]+)"/g)].map(m => m[1]);
    for (const door of doors) {
      try {
        const u = new URL(door, "https://apps.kulibert.net/");
        if (u.origin !== "https://apps.kulibert.net") fail(`live-chips data-door not same-origin: ${door}`);
      } catch {
        fail(`live-chips bad data-door: ${door}`);
      }
    }
  }
}

// 3. parse inline scripts in index.html and the three app.js
function checkParse(file) {
  if (!existsSync(file)) return;
  const src = readFileSync(file, "utf8");
  if (file.endsWith(".html")) {
    const scripts = [...src.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
    for (const m of scripts) {
      const code = m[1].trim();
      if (!code || (code.startsWith("//") && code.length < 30)) continue;
      try {
        new Function(code);
      } catch (e) {
        fail(`${file} inline script parse: ${e.message.split("\n")[0]}`);
      }
    }
  } else {
    try {
      execSync(`node --check "${file}"`, { stdio: "pipe" });
    } catch (e) {
      const msg = (e.stderr || e.stdout || e.message || "").toString().split("\n")[0];
      fail(`${file} parse: ${msg}`);
    }
  }
}
checkParse(indexPath);
["blocks/app.js", "blocks-test/app.js", "bertopia/app.js"].forEach(p => checkParse(root + "/" + p));

// conflict markers + sw.js parse
function checkMarkers(file) {
  if (!existsSync(file)) return;
  const lines = readFileSync(file, "utf8").split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/^(<<<<<<<|=======|>>>>>>>)( |$)/.test(lines[i])) {
      fail(`conflict marker in ${file}:${i + 1}`);
    }
  }
}
["blocks", "blocks-test", "bertopia"].forEach(dir => {
  const sw = root + "/" + dir + "/sw.js";
  if (existsSync(sw)) checkParse(sw);
  ["index.html", "sw.js", "app.js"].forEach(f => checkMarkers(root + "/" + dir + "/" + f));
});
checkMarkers(indexPath);

// 4. blocks/, blocks-test/, bertopia/ index.html app.js?v values differ
function appJsV(dir) {
  const p = root + "/" + dir + "/index.html";
  if (!existsSync(p)) return null;
  const h = readFileSync(p, "utf8");
  const m = h.match(/app\.js\?v=([^"'&\s]+)/);
  return m ? m[1] : null;
}
const vs = ["blocks", "blocks-test", "bertopia"].map(appJsV);
const unique = [...new Set(vs.filter(Boolean))];
if (unique.length > 1) fail(`app.js?v differ: ${vs.join(" / ")}`);

// 5. bertopia/ and blocks-test/ byte-for-byte
import { createHash } from "node:crypto";
import { readdirSync, statSync } from "node:fs";
function walk(dir, base = "") {
  const out = [];
  for (const name of readdirSync(dir)) {
    const rel = base ? base + "/" + name : name;
    const full = dir + "/" + name;
    if (statSync(full).isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out.sort();
}
function sha(file) {
  return createHash("sha256").update(readFileSync(file)).digest("hex");
}
const aFiles = walk(root + "/bertopia");
const bFiles = walk(root + "/blocks-test");
const diffs = [];
const all = [...new Set([...aFiles, ...bFiles])];
for (const rel of all) {
  const pa = root + "/bertopia/" + rel;
  const pb = root + "/blocks-test/" + rel;
  if (!existsSync(pa) || !existsSync(pb) || sha(pa) !== sha(pb)) diffs.push(rel);
}
if (diffs.length) fail(`bertopia/ and blocks-test/ differ: ${diffs.slice(0, 5).join(", ")}`);

console.log("PASS");
process.exit(0);
