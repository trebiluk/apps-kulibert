import { mergeOrAdd, stepMagnet, canPick, pullLoose, DROP_CAP, KID_CAP, PICK_R, lostWhyKey, restoreDrop, tagAlias } from '../src/drops.js'

const drops = []
const lost = []
const now = 10_000
if (mergeOrAdd(drops, lost, { item: 'dirt', n: 1, x: 1, y: 2, z: 3, at: now }) !== 'ground') throw new Error('first')
if (mergeOrAdd(drops, lost, { item: 'dirt', n: 3, x: 1.5, y: 2, z: 3, at: now }) !== 'merged') throw new Error('merge')
if (drops.length !== 1 || drops[0].n !== 4) throw new Error('pile ' + drops[0].n)
if (canPick(drops[0], now + 1000)) throw new Error('early pick')
if (!canPick(drops[0], now + 1500)) throw new Error('late pick')
const player = { x: 3, y: 2, z: 3 }
drops[0].at = 0
if (!stepMagnet(drops, player, 0.2, now)) throw new Error('magnet')
if (drops[0].x <= 1) throw new Error('did not move')
for (let i = 0; i < DROP_CAP; i++) mergeOrAdd(drops, lost, { item: 'stone', n: 1, x: i * 10, y: 0, z: 0, at: 0 })
if (mergeOrAdd(drops, lost, { item: 'sand', n: 2, x: 9, y: 0, z: 9, at: 0 }) !== 'lost') throw new Error('cap')
if (!lost.find((d) => d.item === 'sand' && d.n === 2)) throw new Error('lost box')
if (drops.length > DROP_CAP) throw new Error('world over ' + drops.length)
const bag = { dirt: 1 }
const ok = pullLoose(drops, lost, (k) => bag[k] || 0, (k, n) => { bag[k] -= n }, 'dirt', 4)
if (!ok || drops.some((d) => d.item === 'dirt')) throw new Error('pull')
if (PICK_R !== 1.5) throw new Error('reach')

const split = []
const splitLost = []
if (mergeOrAdd(split, splitLost, { item: 'dirt', n: 1, x: 0, y: 0, z: 0, at: 1, alias: 'ada' }) !== 'ground') throw new Error('ada ground')
if (mergeOrAdd(split, splitLost, { item: 'dirt', n: 1, x: 0.2, y: 0, z: 0, at: 2, alias: 'ben' }) !== 'ground') throw new Error('ben merge')
if (split.length !== 2) throw new Error('aliases merged')

function rain(alias, z) {
  const ground = []
  const box = []
  for (let i = 0; i < 40; i++) {
    const where = mergeOrAdd(ground, box, { item: 'log', n: 1, x: i * 10, y: 0, z, at: 1000 + i, alias })
    if (i < KID_CAP && where !== 'ground') throw new Error(alias + ' early ' + where)
    if (i >= KID_CAP && where !== 'trimmed') throw new Error(alias + ' trim ' + where)
  }
  const mine = ground.filter((d) => d.alias === alias)
  if (mine.length !== KID_CAP) throw new Error(alias + ' kept ' + mine.length)
  if (mine.some((d) => d.at < 1000 + (40 - KID_CAP))) throw new Error(alias + ' kept an old pile')
  const gone = box.filter((d) => d.item === 'log').reduce((s, d) => s + d.n, 0)
  if (gone !== 40 - KID_CAP) throw new Error(alias + ' lost ' + gone)
  if (!box.every((d) => d.why === 'ground' && lostWhyKey(d.why) === 'groundFull')) throw new Error(alias + ' why')
  return { ground, box }
}

const ada = rain('ada', 0)
const both = ada.ground.slice()
const bothLost = ada.box.slice()
for (let i = 0; i < 40; i++) {
  const where = mergeOrAdd(both, bothLost, { item: 'planks', n: 1, x: i * 10, y: 0, z: 80, at: 2000 + i, alias: 'ben' })
  if (i < KID_CAP && where !== 'ground') throw new Error('ben early')
  if (i >= KID_CAP && where !== 'trimmed') throw new Error('ben trim')
}
if (both.filter((d) => d.alias === 'ada').length !== 32) throw new Error('ada shared')
if (both.filter((d) => d.alias === 'ben').length !== 32) throw new Error('ben shared')
if (both.length > DROP_CAP) throw new Error('two kids over world')
if (both.some((d) => d.alias === 'ada' && d.at < 1008)) throw new Error('ada oldest stayed')
if (both.some((d) => d.alias === 'ben' && d.at < 2008)) throw new Error('ben oldest stayed')

const world = []
const worldLost = []
for (let k = 0; k < 8; k++) {
  for (let i = 0; i < KID_CAP; i++) {
    if (mergeOrAdd(world, worldLost, { item: 'stone', n: 1, x: i * 10, y: 0, z: k * 10, at: i, alias: 'k' + k }) !== 'ground') throw new Error('fill ' + k)
  }
}
if (world.length !== DROP_CAP) throw new Error('full ' + world.length)
if (mergeOrAdd(world, worldLost, { item: 'sand', n: 2, x: 4, y: 0, z: 4, at: 9, alias: 'extra' }) !== 'lost') throw new Error('ninth')
if (world.length !== DROP_CAP) throw new Error('ninth grew')
if (world.filter((d) => d.alias === 'k0').length !== KID_CAP) throw new Error('ninth evicted someone')

const saved = restoreDrop({ id: 7, x: 1.2, y: 3, z: 4, item: 'dirt', n: 2, at: 50, alias: '  ada  ' })
const again = restoreDrop(JSON.parse(JSON.stringify(saved)))
if (again.alias !== 'ada' || again.n !== 2 || again.id !== 7) throw new Error('reload ' + again.alias)
if (tagAlias('x'.repeat(40)).length !== 24) throw new Error('alias length')
console.log('drops-check ok', drops.length, 'piles')