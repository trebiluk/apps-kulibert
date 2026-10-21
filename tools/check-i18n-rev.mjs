#!/usr/bin/env node
import { execSync } from "node:child_process";

function lastCt(path, extra = "") {
  try {
    const out = execSync(`git log -1 --format=%ct ${extra} -- ${path}`, { encoding: "utf8" }).trim();
    return out ? Number(out) : 0;
  } catch {
    return 0;
  }
}

function lastSha(path, extra = "") {
  try {
    return execSync(`git log -1 --format=%H ${extra} -- ${path}`, { encoding: "utf8" }).trim();
  } catch {
    return "(none)";
  }
}

const i18nCt = lastCt("shared/i18n");
const revCt = lastCt("shared/kulibert-i18n.js", '-S"I18N_REV"');
const i18nSha = lastSha("shared/i18n");
const revSha = lastSha("shared/kulibert-i18n.js", '-S"I18N_REV"');

console.log(`shared/i18n last commit: ${i18nSha} (${i18nCt})`);
console.log(`I18N_REV last change:   ${revSha} (${revCt})`);

if (i18nCt > revCt) {
  console.error("FAIL: shared/i18n is newer than the I18N_REV bump");
  process.exit(1);
}
console.log("OK");
process.exit(0);
