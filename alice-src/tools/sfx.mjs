import { spawnSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "../public/assets");
mkdirSync(OUT, { recursive: true });

function tone(freq, ms, vol = 0.2, rate = 22050) {
  const n = Math.floor(rate * ms / 1000);
  const data = Buffer.alloc(n * 2);
  for (let i = 0; i < n; i++) {
    const env = Math.min(1, i / 200) * Math.min(1, (n - i) / 400);
    const s = Math.sin(2 * Math.PI * freq * i / rate) * vol * env;
    data.writeInt16LE(Math.max(-1, Math.min(1, s)) * 32767, i * 2);
  }
  return data;
}
function silence(ms, rate = 22050) {
  return Buffer.alloc(Math.floor(rate * ms / 1000) * 2);
}
function wav(pcm, rate = 22050) {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}
const rate = 22050;
const parts = [
  tone(880, 180), silence(40),
  tone(440, 280, 0.18), silence(40),
  tone(220, 200, 0.16), silence(40),
  tone(660, 400, 0.2),
];
const pcm = Buffer.concat(parts);
const wavPath = path.join(OUT, "sfx.wav");
writeFileSync(wavPath, wav(pcm, rate));
const spritemap = {
  chirp: { start: 0, end: 0.18 },
  swoop: { start: 0.22, end: 0.5 },
  miss: { start: 0.54, end: 0.74 },
  cheer: { start: 0.78, end: 1.18 },
};
writeFileSync(path.join(OUT, "sfx.json"), JSON.stringify({ spritemap }));
for (const ext of ["ogg", "m4a"]) {
  const args = ext === "ogg"
    ? ["-y", "-i", wavPath, "-c:a", "libvorbis", path.join(OUT, "sfx.ogg")]
    : ["-y", "-i", wavPath, "-c:a", "aac", path.join(OUT, "sfx.m4a")];
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status) process.exit(r.status);
}
console.log("sfx ready");
