// Part 5 check: decay for the personal host (food rots, the bag wears). Home build only.
//   node tools/home-decay-check.mjs          (the bag and compile halves need esbuild: npm ci, or BT_ESBUILD=<package>)
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as D from '../src/home/decay.js'
import { createBag as plainBag } from '../src/items.js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let fails = 0, skips = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
const skip = (msg) => { console.log('SKIP  ' + msg); skips++ }
const MIN = 60000

// ---------------------------------------------------------------- pure rules
{
  const berry = { item: 'berry', n: 3 }, bread = { item: 'bread', n: 1, age: 31 * MIN }
  eq(D.foodState(berry) === 'fresh' && D.feedFor(berry, 1) === 1 && D.freshness({ item: 'log', n: 1 }) === null, 'food: new food is fresh and feeds fully; non-food has no freshness')
  eq(D.foodState(bread) === 'stale' && D.feedFor(bread, 4) === 2 && D.feedFor({ item: 'berry', n: 1, age: 15 * MIN }, 1) === 1, 'food: past half its life it is stale: half energy, never below 1')
  const slots = [{ item: 'berry', n: 4 }, { item: 'bread', n: 2 }, { item: 'log', n: 9 }, null]
  const st = D.makeState(); const rotted = []
  for (let m = 0; m < 4; m++) rotted.push(...D.tick(st, slots, 5 * MIN).rotted)
  eq(rotted.join() === 'berry' && slots[0].item === D.ROTTEN && slots[0].n === 4 && slots[1].item === 'bread' && D.foodState(slots[1]) === 'fresh' && slots[2].n === 9, 'food: berries rot after 20 minutes of play into Rotten food (same count); bread lasts longer; logs never rot')
  const hitch = [{ item: 'berry', n: 1 }]; D.tick(D.makeState(), hitch, 3 * 60 * MIN)
  eq(hitch[0].item === 'berry' && hitch[0].age === 5 * MIN, 'food: one long pause (a hidden tab, a hitch) counts at most 5 minutes')
  const s = { item: 'berry', n: 10, age: 10 * MIN }; D.bagHook(D.makeState(), 15).merge(s, 5)
  eq(s.age === 5 * MIN, 'food: adding fresh food to a stack makes its age the average')

  const w = D.makeState(), full = Array.from({ length: 15 }, (_, i) => (i < 10 ? { item: 'log', n: 1 } : null))
  let torn = 0; for (let m = 0; m < 12; m++) torn += D.tick(w, full, 5 * MIN).torn
  eq(Math.round(w.wear) === 20 && torn === 1 && D.usableSlots(w, 15) === 14 && D.isTorn(w, 14, 15) && !D.isTorn(w, 13, 15), 'bag: a full bag wears 20% in an hour of play and tears 1 slot (the last pocket)')
  const light = D.makeState(), few = [{ item: 'log', n: 1 }, null, null]; for (let m = 0; m < 12; m++) D.tick(light, few, 5 * MIN)
  eq(Math.round(light.wear) === 6, 'bag: a light bag wears slower (6% in the same hour)')
  const worn = { wear: 100 }
  eq(D.usableSlots(worn, 15) === 10 && ![0, 4, 8, 9].some((i) => D.isTorn(worn, i, 15)), 'bag: at 100% it keeps the 9 hotbar slots + 1; the hotbar never tears')
  eq(D.usableSlots({ wear: 39.9 }, 15) === 14 && D.usableSlots({ wear: 40 }, 15) === 13, 'bag: one slot per full 20% of wear')
  const p = { wear: 47 }
  eq(D.patch(p) === 20 && p.wear === 27 && D.patch({ wear: 5 }) === 5 && D.patch({ wear: 0 }) === 0, 'bag: a Bag patch mends 20% (0 when the bag is fine)')
  eq(D.loadState({ wear: 999 }).wear === 100 && D.loadState({ wear: 'x' }).wear === 0 && D.loadState(null).wear === 0 && D.dumpState({ wear: 12.3456 }).wear === 12.35, 'bag: saved wear is checked and clamped')

  const a = D.eatRotten(() => 0.1), b = D.eatRotten(() => 0.5), c = D.eatRotten(() => 0.9)
  eq(a.bolts === 0 && a.say === 'rottenYuck' && b.bolts === 1 && b.say === 'rottenOk' && c.bolts === -1 && c.slowMs === D.QUEASY_MS && c.say === 'rottenSick', 'rotten food: eating it is a gamble (nothing 40%, +1 energy 30%, -1 and slower 30%)')
  const crop = { grown: 2 * MIN, lastSeen: 0 }, cap = 8 * MIN
  eq(D.compost(crop, cap) === 2 * MIN && crop.grown === 4 * MIN && D.compost({ grown: cap }, cap) === 0 && D.compost({ grown: 7 * MIN }, cap) === MIN, 'rotten food: compost grows a crop a quarter of the way (never past ripe)')
  eq(Object.keys(D.DECAY_STRINGS).every((k) => typeof D.DECAY_STRINGS[k] === 'string' && D.DECAY_STRINGS[k].length) && D.DECAY_ITEMS[D.ROTTEN] && D.DECAY_ITEMS[D.PATCH] && D.DECAY_RECIPES[0].out[0] === D.PATCH, 'items: Rotten food and Bag patch, the patch recipe (1 tan wool) and English words are all there')
}

// the game's own build gate: tools/check-strings.mjs must stay at 0 problems (build.mjs stops otherwise; Nov 1, Diego's
// first Windows build stopped here on 9 home words that reached t())
{
  const { spawnSync } = await import('node:child_process')
  const r = spawnSync(process.execPath, ['--no-warnings', 'tools/check-strings.mjs'], { cwd: ROOT, encoding: 'utf8' })
  eq(r.status === 0 && /strings: 0 problems/.test(r.stdout), 'build gate: the string check has 0 problems (decay words never go through the game\'s t())')
}

// ---------------------------------------------------------------- the real bag (src/items.js)
{
  const b = plainBag(); b.hook = D.bagHook({ wear: 100 }, 15)
  for (let i = 0; i < 15; i++) b.add('planks', 64)
  eq(b.slots.filter(Boolean).length === 15 && !b.dump().some((s) => s && s.age), 'bag in plain Node (no home flag): the hook is ignored, nothing about age is saved — the student path')
}
const ESB = [path.join(ROOT, 'package.json'), process.env.BT_ESBUILD ? path.join(process.env.BT_ESBUILD, 'package.json') : null].filter(Boolean)
let esbuild = null
for (const from of ESB) { try { esbuild = createRequire(from)(from.endsWith(path.join('esbuild', 'package.json')) ? path.dirname(from) : 'esbuild'); break } catch (e) {} }
if (!esbuild) skip('bag with the home flag + game compile: esbuild not installed (npm ci, or BT_ESBUILD=…)')
else {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'decay-check-'))
  await esbuild.build({ entryPoints: [path.join(ROOT, 'src', 'items.js')], bundle: true, format: 'esm', outfile: path.join(tmp, 'items-home.mjs'), define: { __HOME_HOST__: 'true' }, logLevel: 'error' })
  const { createBag } = await import(pathToFileURL(path.join(tmp, 'items-home.mjs')))
  const st = { wear: 40 }, bag = createBag(); bag.hook = D.bagHook(st, bag.slots.length)
  const left = bag.add('planks', 64 * 15)
  eq(left === 64 * 2 && !bag.slots[13] && !bag.slots[14], 'bag (home): at 40% wear the last 2 pockets are torn; nothing new goes in, the rest is handed back')
  bag.slots[14] = { item: 'stone', n: 3 }   // still 40%: slots 13 and 14 torn, 13 empty
  eq(bag.add('stone', 1) === 1 && bag.slots[14].n === 3, 'bag (home): a torn slot keeps what it holds but takes no more')
  const fb = createBag(); fb.hook = D.bagHook(D.makeState(), fb.slots.length)
  fb.add('berry', 4); fb.slots[0].age = 8 * MIN; fb.add('berry', 4)
  eq(fb.slots[0].n === 8 && fb.slots[0].age === 4 * MIN, 'bag (home): picking up fresh berries freshens the stack (average age)')
  const again = createBag(); again.load(fb.dump())
  eq(again.slots[0].age === 4 * MIN && createBag().load([{ item: 'berry', n: 1, age: 'old' }]) && true, 'bag (home): food age is saved and loaded; junk ages are ignored')

  // whole game: the home bundle has decay; the student bundle has none of it
  const out = {}
  for (const flag of ['true', 'false']) {
    await esbuild.build({ entryPoints: [path.join(ROOT, 'src', 'main.js')], bundle: true, minify: true, format: 'iife', outfile: path.join(tmp, 'main-' + flag + '.js'), define: { __HOME_HOST__: flag }, external: ['noa-engine', '@babylonjs/*'], loader: { '.png': 'dataurl', '.svg': 'text' }, logLevel: 'error' })
    out[flag] = fs.readFileSync(path.join(tmp, 'main-' + flag + '.js'), 'utf8')
  }
  const words = ['Rotten food', 'Bag patch', 'Bag wear', 'home-decay-css', 'takeHeldOne', 'rottenYuck', 'bagPatch']
  eq(words.every((w) => out.true.includes(w)), 'compile: the home game carries decay (items, patch recipe, words, hooks)')
  eq(!words.some((w) => out.false.includes(w)), 'compile: the student game carries none of it (minified, as build.mjs)')
  fs.rmSync(tmp, { recursive: true, force: true })
}
console.log(fails ? `home-decay-check: ${fails} FAIL` : `home-decay-check: all PASS${skips ? ` (${skips} skipped)` : ''}`)
process.exit(fails ? 1 : 0)
