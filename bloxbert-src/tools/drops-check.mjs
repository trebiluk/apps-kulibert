import { mergeOrAdd, stepMagnet, canPick, pullLoose, DROP_CAP, PICK_R } from '../src/drops.js'

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
const bag = { dirt: 1 }
const ok = pullLoose(drops, lost, (k) => bag[k] || 0, (k, n) => { bag[k] -= n }, 'dirt', 4)
if (!ok || drops.some((d) => d.item === 'dirt')) throw new Error('pull')
if (PICK_R !== 1.5) throw new Error('reach')
console.log('drops-check ok', drops.length, 'piles')
