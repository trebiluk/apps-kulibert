/* Author the text grids in art/sprites.txt. pixels.mjs is what the build runs. */
import { writeFileSync } from "fs";
import { RUN } from "../src/game/home-art.js";
import path from "path";
import { fileURLToPath } from "url";

const out = [];
function frame(name, rows) {
  const grid = rows.map((row) => row.replace(/\s/g, ""));
  const w = grid[0].length;
  if (grid.some((row) => row.length !== w)) throw new Error("ragged " + name);
  out.push("frame " + name);
  out.push(...grid);
  out.push("");
}
function blank(w, h) { return Array.from({ length: h }, () => ".".repeat(w)); }
function put(rows, x, y, ch) {
  if (y < 0 || x < 0 || y >= rows.length || x >= rows[0].length) return;
  const row = rows[y];
  rows[y] = row.slice(0, x) + ch + row.slice(x + 1);
}
function fill(rows, x, y, w, h, ch) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(rows, x + i, y + j, ch);
}
function stamp(rows, x, y, art) {
  art.forEach((line, j) => { for (let i = 0; i < line.length; i++) if (line[i] !== " ") put(rows, x + i, y + j, line[i]); });
}
function shift(rows, dy) {
  const h = rows.length;
  const w = rows[0].length;
  const next = blank(w, h);
  for (let y = 0; y < h; y++) {
    const src = y - dy;
    if (src >= 0 && src < h) next[y] = rows[src];
  }
  return next;
}

function dog(band, pose) {
  const g = blank(16, 16);
  const body = pose === "duck"
    ? ["..KKKKKK..", ".KFFFFFFK.", ".KFEEFFEK.", ".KFFNNFFK.", ".KKPPPPKK.", ".KPPPPPPK.", "..KKFFKK..", "...K..K...", "...KKKK..."]
    : ["...KKKK...", ".KKFFFFKK.", "KFFFFFFFFK", "KFFEEFFEEK", "KFFFFFFFFK", "KFFFNNFFFK", "KKPPPPPPKK", "KPPPPPPPPK", ".KFFFFFFK.", ".KFFKFFKFK", "..KK..KK..", "...KKKK..."];
  const y = pose === "pop" ? 1 : pose === "cheer" ? 2 : pose === "duck" ? 5 : 3;
  stamp(g, 2, y, body);
  for (let j = 0; j < g.length; j++) g[j] = g[j].replaceAll("P", band);
  if (pose === "look") { put(g, 6, y + 3, "W"); put(g, 10, y + 3, "E"); }
  if (pose === "chirp") { put(g, 7, y + 5, "E"); put(g, 8, y + 5, "N"); }
  if (pose === "wave") { put(g, 1, y + 6, "F"); put(g, 1, y + 5, "K"); put(g, 0, y + 4, "K"); }
  if (pose === "cheer") { put(g, 1, y + 2, "K"); put(g, 14, y + 2, "K"); put(g, 1, y + 1, "F"); put(g, 14, y + 1, "F"); }
  return g;
}

function pup(pose) {
  const g = blank(16, 16);
  const y = pose === "hide" ? 8 : pose === "scurry" ? 5 : 4;
  stamp(g, 3, y, ["..KKKK..", ".KFFFFK.", ".KEEFFK.", ".KFNFFK.", ".KFFFFK.", "..KKKK..", "...K.K.."]);
  if (pose === "scurry") { put(g, 4, y + 6, "K"); put(g, 9, y + 5, "K"); }
  if (pose === "hide") fill(g, 4, 10, 8, 3, "M");
  return g;
}

function hawk(kind) {
  const g = blank(24, 14);
  if (kind === "shadow") {
    stamp(g, 4, 8, ["..KKKKKKKKKKKK..", ".KMMMMMMMMMMMMK.", "..KKKKKKKKKKKK.."]);
    return g;
  }
  if (kind === "swoop") {
    stamp(g, 2, 3, ["KK..............KK", ".KKK..........KKK.", "..KKKKK....KKKKK..", "....KKKRRRRKKK....", "......KRRRRK......", ".......KNNK.......", "........KK........"]);
    return g;
  }
  const up = kind === "up";
  stamp(g, 0, up ? 1 : 3, [
    up ? "K......................K" : "........................",
    up ? ".KK..................KK." : "K....................K",
    "..KKK..............KKK..",
    "...KKKKRRRRRRRRKKKK...",
    ".....KKRRWWWRRKK.....",
    ".......KRRRRRK.......",
    "........KNNK.........",
    ".........KK..........",
  ]);
  return g;
}

function coyote(step) {
  const g = blank(24, 12);
  const leg = step % 2 === 0 ? "...K.K.....K.K...." : "....KK.....KK.....";
  stamp(g, 1, 2, ["..KKKK............", ".KOOOOOOK.........", "KOOOEEOOOKK.......", "KOOONOOOOOOK......", ".KOOOOOOOOOK......", leg, "..KK......KK......"]);
  if (step % 4 === 2) put(g, 2, 4, "O");
  if (step % 4 === 3) put(g, 18, 6, "K");
  return g;
}

function snake(step) {
  const g = blank(24, 10);
  const y = 3 + (step === 1 ? 1 : 0);
  const hump = step === 2 ? "VVVV..VVVV..VVVV" : step === 1 ? ".VVVVVVVVVVVVVV." : "VVVVVVVVVVVVVVVV";
  stamp(g, 2, y, ["...." + hump + "..", "..VVVVEEVVVVVVVVK.", "." + hump + "VVVK", "KKKKKKKKKKKKKKKKKK"]);
  return g;
}

function rabbit(step) {
  const g = blank(14, 16);
  const hop = step === 1 ? 1 : step === 2 ? 0 : 2;
  stamp(g, 4, hop, ["KK..KK", "KK..KK", "KK..KK", ".KKKK.", "KQEEQK", "KQQQQK", "KQNNQK", ".KQQK.", "..KK..", ".K..K."]);
  if (step === 2) { put(g, 3, 12, "K"); put(g, 10, 13, "K"); }
  return g;
}

function cloud() {
  const g = blank(18, 10);
  stamp(g, 2, 2, ["...CCCCCC....", ".CCCCCCCCCC..", "CCCCCCCCCCCCC.", "CCCCCCCCCCCCC.", ".CCCCCCCCCCC.", "...CCCCCCC..."]);
  return g;
}
function weed(step) {
  const g = blank(14, 14);
  stamp(g, 2, 2, ["...TTTT...", "..TTTTTT..", ".TTTTTTTT.", "TTTTTTTTTT", "TTTKKTTTTT", "TTTTTTTTTT", ".TTTTTTTT.", "..TTTTTT..", "...TTTT..."]);
  return shift(g, step === 0 ? 0 : step === 1 ? 1 : -1);
}
function butterfly(step) {
  const g = blank(16, 10);
  const wing = step === 1 ? ["UU..UU", "UU..UU"] : ["UUUUUU", ".U..U."];
  stamp(g, 1, 2, [wing[0] + ".." + wing[0], wing[1] + "KK" + wing[1], "..KKKKKKKK..", "...KKKKKK...", "....KNNK...."]);
  if (step === 2) put(g, 0, 2, "U");
  return g;
}
function hopper(step) {
  const g = blank(16, 10);
  stamp(g, 2, 2 + (step === 1 ? -1 : 0), ["..IIII..", ".IIIIII.", "IIIEEIII", ".IIKKII.", "..I..I..", ".I....I."]);
  if (step === 2) { put(g, 1, 7, "I"); put(g, 13, 6, "I"); }
  return g;
}
function grass(n) {
  const g = blank(16, 16);
  fill(g, 0, 10, 16, 6, n === 1 ? "H" : "G");
  put(g, 3, 7, "G"); put(g, 4, 6, "H"); put(g, 8, 8, "G"); put(g, 11, 5, "H");
  if (n === 2) { put(g, 6, 4, "Y"); put(g, 12, 7, "G"); }
  if (n === 0) fill(g, 0, 12, 16, 4, "H");
  return g;
}
function ground(n) {
  const g = blank(16, 16);
  fill(g, 0, 0, 16, 5, "G");
  fill(g, 0, 5, 16, 11, "M");
  put(g, 2, 2, "H"); put(g, 9, 1, "H"); put(g, 4, 8, "S"); put(g, 11, 11, "S");
  if (n === 1) { put(g, 7, 3, "Y"); put(g, 1, 13, "S"); }
  return g;
}
function hole() {
  const g = blank(16, 12);
  stamp(g, 1, 3, [".MMMMMMMMMMMM.", "MMKKKKKKKKKKMM", "MKKKKKKKKKKKKM", ".KKKKKKKKKKKK.", "..KKKKKKKKKK.."]);
  return g;
}
function mound() {
  const g = blank(20, 12);
  stamp(g, 1, 2, [".....MMMMMM.....", "...MMMMMMMMMM...", ".MMMMMMMMMMMMM.", "MMMMMMMMMMMMMMMM", "MMMSMMMMMMMMMSMM"]);
  return g;
}
function seed() {
  const g = blank(8, 8);
  stamp(g, 2, 1, [".YY.", "YYYY", "YYYY", ".YY."]);
  put(g, 3, 1, "H");
  return g;
}
function star() {
  const g = blank(9, 9);
  stamp(g, 3, 0, ["A", "A", "AAA", "AAAAA", ".AAA.", "..A.."]);
  put(g, 4, 3, "Y");
  return g;
}
function digit(n) {
  const seg = {
    0: "abcedf", 1: "bc", 2: "abged", 3: "abgcd", 4: "fgbc", 5: "afgcd", 6: "afgecd", 7: "abc", 8: "abcdefg", 9: "abfgcd",
  }[n];
  const g = blank(8, 12);
  const on = (s) => seg.includes(s);
  if (on("a")) fill(g, 2, 1, 4, 1, "K");
  if (on("b")) fill(g, 6, 2, 1, 3, "K");
  if (on("c")) fill(g, 6, 6, 1, 3, "K");
  if (on("d")) fill(g, 2, 9, 4, 1, "K");
  if (on("e")) fill(g, 1, 6, 1, 3, "K");
  if (on("f")) fill(g, 1, 2, 1, 3, "K");
  if (on("g")) fill(g, 2, 5, 4, 1, "K");
  return g;
}
function alarm(kind) {
  const g = blank(16, 16);
  if (kind === "sky") stamp(g, 1, 3, ["LLLLLLLLLLLLLL", ".KK........KK.", "..KKK....KKK..", "....KKRRKK....", ".....KRRK.....", "......KK......"]);
  if (kind === "ground") stamp(g, 1, 4, ["..KKKK........", ".KOOOOOK......", "KOOONOOOOK....", ".KOOOOOOOK....", "...K.K..K.K..."]);
  if (kind === "snake") stamp(g, 0, 6, ["VVVVVVVVVVVVVVVV", ".VVVVEEVVVVVVV.", "KKKKKKKKKKKKKKKK"]);
  return g;
}
function speaker() {
  const g = blank(16, 16);
  stamp(g, 2, 4, ["KKKK..", "KWWKKK", "KWWKKKK", "KWWKKK", "KKKK.."]);
  put(g, 11, 5, "C"); put(g, 12, 7, "C"); put(g, 11, 9, "C");
  return g;
}
function helpQ() {
  const g = blank(16, 16);
  stamp(g, 4, 2, ["KKKKKK", "K....K", "....KK", "...KK.", "..KK..", "..KK..", "......", "..KK.."]);
  return g;
}
function lock() {
  const g = blank(12, 14);
  stamp(g, 3, 1, [".KKKK.", "K....K", "K....K", "KKKKKK", "KYYYYK", "KYEEYK", "KYYYYK", "KKKKKK"]);
  return g;
}

for (const pose of ["pop", "look", "chirp", "duck", "cheer", "wave"]) {
  for (let i = 0; i < 3; i++) {
    let g = dog("P", pose);
    if (i === 1) g = shift(g, pose === "duck" ? 0 : -1);
    if (i === 2) g = shift(g, pose === "cheer" ? -2 : 1);
    if (pose === "wave" && i === 2) put(g, 0, 6, "F");
    frame("alice-" + pose + "-" + i, g);
  }
}
for (const pose of ["idle", "scurry"]) for (let i = 0; i < 3; i++) frame("pup-" + pose + "-" + i, shift(pup(pose === "idle" ? "idle" : "scurry"), i - 1));
frame("pup-hide", pup("hide"));
for (const pose of ["idle", "hop", "wave"]) {
  for (let i = 0; i < 3; i++) {
    const mapped = pose === "idle" ? "look" : pose === "hop" ? "pop" : "wave";
    let g = dog("B", mapped);
    g = shift(g, i - 1);
    frame("wonder-" + pose + "-" + i, g);
  }
}
function aliceGroom(step) {
  const g = dog("P", "look");
  const pawX = step === 1 ? 7 : 6;
  const pawY = step === 0 ? 7 : step === 1 ? 6 : 8;
  put(g, pawX, pawY, "F");
  put(g, pawX + 1, pawY, "K");
  if (step === 1) put(g, 8, 8, "U");
  if (step === 2) put(g, 7, 9, "F");
  return g;
}

function wonderEar(step) {
  const g = dog("B", "look");
  put(g, 5, 1, "K");
  put(g, 5, 2, "B");
  if (step === 0) { put(g, 10, 1, "K"); put(g, 10, 2, "B"); }
  if (step === 1) { put(g, 11, 2, "K"); put(g, 11, 3, "B"); }
  if (step === 2) { put(g, 10, 0, "K"); put(g, 10, 1, "B"); put(g, 10, 2, "B"); }
  return g;
}

for (let i = 0; i < 3; i++) frame("alice-groom-" + i, aliceGroom(i));
for (let i = 0; i < 3; i++) frame("wonder-ear-" + i, wonderEar(i));
RUN.forEach((rows, i) => frame("alice-run-" + i, rows));
frame("hawk-flap-0", hawk("down"));
frame("hawk-flap-1", hawk("up"));
frame("hawk-swoop", hawk("swoop"));
frame("hawk-shadow", hawk("shadow"));
for (let i = 0; i < 4; i++) frame("coyote-trot-" + i, coyote(i));
for (let i = 0; i < 3; i++) frame("snake-slither-" + i, snake(i));
for (let i = 0; i < 3; i++) frame("rabbit-hop-" + i, rabbit(i));
frame("cloud", cloud());
for (let i = 0; i < 3; i++) frame("weed-" + i, weed(i));
for (let i = 0; i < 3; i++) frame("butterfly-" + i, butterfly(i));
for (let i = 0; i < 3; i++) frame("hopper-" + i, hopper(i));
for (let i = 0; i < 3; i++) frame("grass-" + i, grass(i));
frame("hole", hole());
frame("mound", mound());
frame("ground-0", ground(0));
frame("ground-1", ground(1));
frame("seed", seed());
frame("star", star());
for (let i = 0; i < 10; i++) frame("dig-" + i, digit(i));
frame("alarm-sky", alarm("sky"));
frame("alarm-ground", alarm("ground"));
frame("alarm-snake", alarm("snake"));
frame("speaker", speaker());
frame("help-q", helpQ());
function tile(kind) {
  const g = blank(16, 16);
  if (kind >= 5) {
    fill(g, 0, 0, 16, 16, "W");
    fill(g, 0, 0, 16, 1, "C");
    fill(g, 0, 15, 16, 1, "C");
    if (kind === 6) { put(g, 5, 4, "H"); put(g, 11, 7, "G"); put(g, 7, 10, "H"); }
    else { put(g, 3, 5, "C"); put(g, 12, 8, "C"); put(g, 8, 12, "C"); }
    return g;
  }
  fill(g, 0, 0, 16, 8, "G");
  fill(g, 0, 0, 16, 1, "H");
  fill(g, 0, 8, 16, 8, "M");
  if (kind === 0) { put(g, 5, 4, "Y"); put(g, 10, 6, "H"); put(g, 4, 11, "S"); }
  if (kind === 1) { put(g, 8, 2, "H"); put(g, 3, 5, "Y"); put(g, 12, 10, "S"); }
  if (kind === 2) { put(g, 6, 3, "Y"); put(g, 13, 6, "Y"); put(g, 2, 12, "S"); }
  if (kind === 3) { fill(g, 3, 2, 10, 6, "M"); put(g, 5, 4, "S"); put(g, 10, 4, "S"); }
  if (kind === 4) fill(g, 5, 2, 6, 5, "K");
  return g;
}

function hill(near) {
  const g = blank(32, 16);
  const ch = near ? "H" : "L";
  for (let x = 0; x < 32; x++) {
    const wave = Math.round(Math.sin(x / (near ? 4.5 : 6.5)) * (near ? 3 : 2));
    const top = (near ? 5 : 7) + wave;
    for (let y = top; y < 15; y++) put(g, x, y, y === top && near && x % 5 === 0 ? "G" : ch);
  }
  return g;
}

function bird(up) {
  const g = blank(16, 8);
  if (up) stamp(g, 1, 0, ["K..........K", ".KK......KK.", "..KKKKKKKK..", "...KKKKKK...", "....K..K...."]);
  else stamp(g, 1, 1, ["..K......K..", ".KK......KK.", "KKKKKKKKKKKK", "..KKKKKKKK..", "....K..K...."]);
  return g;
}

function drop() {
  const g = blank(4, 10);
  ["L", "L", "W", "L", "C", "L"].forEach((ch, i) => put(g, 1, i, ch));
  return g;
}

function flake() {
  const g = blank(7, 7);
  stamp(g, 0, 0, ["...W...", "..WWW..", ".WWWWW.", "WWWWWWW", ".WWWWW.", "..WWW..", "...W..."]);
  return g;
}

function mote() {
  const g = blank(5, 5);
  stamp(g, 0, 0, ["..Y..", ".YYY.", "YYYYY", ".YYY.", "..Y.."]);
  return g;
}

function puddle() {
  const g = blank(16, 8);
  stamp(g, 0, 1, ["..CCCCCCCCCC..", ".CC........CC.", ".C..........C.", ".CC........CC.", "..CCCCCCCCCC.."]);
  return g;
}

function glowDot() {
  const g = blank(5, 5);
  stamp(g, 0, 0, ["..A..", ".AYA.", "AYYYA", ".AYA.", "..A.."]);
  return g;
}

function cloudShadow() {
  const g = blank(18, 8);
  fill(g, 3, 2, 12, 4, "C");
  fill(g, 5, 1, 8, 1, "W");
  fill(g, 5, 6, 8, 1, "W");
  fill(g, 2, 3, 1, 2, "W");
  fill(g, 15, 3, 1, 2, "W");
  return g;
}

function dustPuff() {
  const g = blank(8, 8);
  fill(g, 2, 2, 4, 4, "S");
  put(g, 3, 1, "T"); put(g, 4, 1, "T");
  put(g, 1, 3, "T"); put(g, 6, 3, "T");
  put(g, 3, 6, "T"); put(g, 4, 5, "T");
  put(g, 3, 3, "Y");
  return g;
}

frame("lock", lock());
for (let i = 0; i < 7; i++) frame("tile-" + i, tile(i));
frame("hill-far", hill(false));
frame("hill-near", hill(true));
frame("bird-0", bird(false));
frame("bird-1", bird(true));
frame("drop", drop());
frame("flake", flake());
frame("mote", mote());
frame("puddle", puddle());
frame("glow", glowDot());
frame("cloud-shadow", cloudShadow());
frame("dust", dustPuff());

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../art/sprites.txt");
writeFileSync(file, out.join("\n"));
console.log("wrote", file, out.length);
