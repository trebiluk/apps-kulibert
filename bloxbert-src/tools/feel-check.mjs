import { jumpHeight, overlapsPlayer, mineMs, reachFor, inReach, speedFor, JUMP_V } from '../src/feel.js'

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
ok(mineMs('leaves', true, false) === 500, 'leaves wait for the 500 ms mine')
ok(mineMs('stone', true, true) === 3000, 'stone is 3 s')
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

if (bad) { console.error(bad + ' feel checks failed'); process.exit(1) }
console.log('feel: 0 problems')
