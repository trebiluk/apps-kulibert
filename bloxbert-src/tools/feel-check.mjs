import { jumpHeight, overlapsPlayer, mineMs, reachFor, inReach, speedFor, JUMP_V, crackStage, crackVisible, drainProgress, advanceDig, keepCrouchStep, shouldRepeatPlace } from '../src/feel.js'

let bad = 0
function ok(cond, msg) {
  if (!cond) { bad++; console.error('FAIL', msg) }
}

const h = jumpHeight()
ok(h > 1.24 && h < 1.26, 'jump height ' + h)
ok(Math.abs(jumpHeight(JUMP_V, 32) - h) < 1e-9, 'jump uses g 32')
ok(overlapsPlayer(8, 8, 1, 8.5, 8, 1.5), 'block on the player overlaps')
ok(!overlapsPlayer(8, 8, 4, 8.5, 8, 1.5), 'block two steps away is clear')
ok(!overlapsPlayer(8, 10, 1, 8.5, 8, 1.5), 'block above the head is clear')
ok(mineMs('dirt', true, true) === 600, 'dirt mines in 0.6 s')
ok(mineMs('leaves', true, false) === 200, 'leaves break in 0.2 s')
ok(mineMs('stone', true, true) === 3000, 'stone is 3 s by hand')
ok(mineMs('stone', true, true, 'stone') === 1000, 'stone tool breaks stone in 1 s')
ok(mineMs('glass', true, true, 'steel') === 150, 'fast blocks never go under 0.15 s')
ok(crackStage(0.2) === 0 && crackStage(0.25) === 1 && crackStage(0.5) === 2 && crackStage(0.75) === 3 && crackStage(1) === 4, 'four crack stages')
ok(!crackVisible(200, 0.5) && crackVisible(250, 0.5), 'cracks wait 250 ms')
ok(drainProgress(1, 250) === 0.5 && drainProgress(0.5, 250) === 0, 'a let-go fades in half a second')
const mid = { p: 0.4, t0: 0, need: 1000, draining: true, drainAt: 1000 }
const held = advanceDig(mid, 1000, true, true)
ok(held && !held.draining && held.t0 === 600, 'pressing again keeps the cracks')
ok(advanceDig(mid, 1000, true, false) === null, 'a new block resets')
ok(advanceDig({ p: 0.5, drainAt: 1000, need: 1000 }, 1500, false, true) === null, 'half a second of rest clears it')
ok(mineMs('brickRed', true, true) === 4000, 'red brick is 4 s')
ok(mineMs('dirt', false, true) === 500, 'creative touch mine starts at 500 ms')
ok(mineMs('dirt', false, false) === 0, 'creative mouse mine is instant')
ok(reachFor(true) === 6 && reachFor(false) === 10, 'reach 6 / 10')
ok(inReach(0, 10, 0, 0, 10, 5, 6), '5 blocks is inside reach 6')
ok(!inReach(0, 10, 0, 0, 10, 8, 6), '8 blocks is outside reach 6')
ok(speedFor({}) === 4.3, 'walk')
ok(speedFor({ run: true }) === 5.6, 'run')
ok(speedFor({ crouch: true, run: true }) === 1.3, 'crouch wins')
ok(speedFor({ fly: true, run: true }) === 10.9, 'fly wins')
ok(keepCrouchStep(true, false), 'a floor ahead is safe to crouch')
ok(!keepCrouchStep(false, false), 'a crouch stops at a ledge')
ok(keepCrouchStep(false, true), 'a wall is not a ledge')
ok(shouldRepeatPlace(true, 250, false) && !shouldRepeatPlace(true, 200, false), 'mouse place repeats at 0.25 s')
ok(!shouldRepeatPlace(true, 500, true), 'a touch tap never repeats')

if (bad) { console.error(bad + ' feel checks failed'); process.exit(1) }
console.log('feel: 0 problems')
