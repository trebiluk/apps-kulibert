// Pure checks for the home avatars (flags byte, easing, pose). The drawn figure is checked in the browser by
// server/class-room/tools/home-play-check.mjs.   node tools/home-avatar-check.mjs
import { packFlags, unpackFlags, SUIT_IDS } from '../src/home/flags.js'
let fails = 0
const eq = (ok, msg) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + msg); if (!ok) fails++ }
eq(SUIT_IDS.every((s, i) => unpackFlags(packFlags(false, s)).suit === s && unpackFlags(packFlags(true, s)).flying && packFlags(true, s) <= 255), 'flags: every suit round-trips with and without flying, within the protocol byte')
eq(unpackFlags(0).suit === 'berty' && unpackFlags(255).suit === 'berty' && unpackFlags('x').suit === 'berty' && unpackFlags(1).flying, 'flags: 0, junk and out-of-range read as Berty; bit 0 is flying')
// ease and pose live in avatars.js, which imports Babylon; they are pure, so load the module's source text and evaluate just those
import { readFileSync } from 'node:fs'
const src = readFileSync(new URL('../src/home/avatars.js', import.meta.url), 'utf8')
const grab = (name) => { const m = src.match(new RegExp('export function ' + name + '\\([\\s\\S]*?\\n}\\n')); return m ? m[0].replace('export ', '') : '' }
const { ease, pose } = new Function(grab('ease') + grab('pose') + 'return { ease, pose }')()
const a = ease(null, { x: 0, y: 64, z: 0, r: 0 }, 16)
const b = ease(a, { x: 1, y: 64, z: 0, r: Math.PI / 2 }, 60)
eq(a.x === 0 && b.x > 0 && b.x < 1 && b.r > 0 && b.r < Math.PI / 2, 'ease: the figure glides toward a new spot and turns toward a new heading')
eq(ease(a, { x: 20, y: 64, z: 0, r: 0 }, 16).x === 20, 'ease: a jump over 8 blocks is a teleport, not a glide')
const t = ease({ x: 0, y: 0, z: 0, r: 3 }, { x: 0, y: 0, z: 0, r: -3 }, 90)
eq(t.r > 3 || t.r < -3, 'ease: turning takes the short way round the circle')
eq(pose(0, false, 0).swing === 0 && Math.abs(pose(3, false, 110).swing) > 0.3 && pose(0, true, 0).armsUp && !pose(3, false, 0).armsUp, 'pose: still = no swing, walking = swinging arms, flying = arms up')
console.log(fails ? `home-avatar-check: ${fails} FAIL` : 'home-avatar-check: all PASS'); process.exit(fails ? 1 : 0)
