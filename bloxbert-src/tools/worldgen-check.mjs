// B05 worldgen part A. No browser. Proves a new world grows snow and red sand,
// and that ice and red brick leave the gated group once the kid holds the input.
import { genBlock, genColumns } from '../src/worldgen.js'
import { craftStatus, isStone } from '../src/craft.js'
import { RECIPES } from '../src/data/recipes.js'

const GEN = 8
const SPAWN = [8.5, 1.5]
const REACH = 150
const fail = []
function eq(ok, msg) {
  if (!ok) fail.push(msg)
  else console.log('ok ' + msg)
}

function near(x, z) {
  const dx = x - SPAWN[0]
  const dz = z - SPAWN[1]
  return dx * dx + dz * dz <= REACH * REACH
}

let snow = 0
let red = 0
let snowLow = 0
let redFar = 0
const redAt = []
const t0 = performance.now()
let chunks = 0
for (let x0 = -144; x0 <= 144; x0 += 24) {
  for (let z0 = -144; z0 <= 144; z0 += 24) {
    const cols = genColumns(x0, z0, GEN)
    chunks++
    for (let i = 0; i < 24; i++) {
      for (let k = 0; k < 24; k++) {
        const x = x0 + i
        const z = z0 + k
        const idx = i * 24 + k
        const h = cols.h[idx]
        const top = genBlock(x, h, z, GEN, null, cols)
        if (top === 'snow') {
          if (h < 12) snowLow++
          else if (near(x, z)) snow++
        }
        if (top === 'redSand') {
          if (near(x, z)) {
            red++
            if (redAt.length < 3) redAt.push([x, h, z])
          } else redFar++
        }
      }
    }
  }
}
const ms = performance.now() - t0
const per = ms / chunks
eq(snow > 0, 'snow on hills y>=12 within 150 of spawn (' + snow + ')')
eq(snowLow === 0, 'snow stays off low ground (' + snowLow + ')')
eq(red > 0, 'red sand on a deep riverbank within 150 (' + red + ' at ' + JSON.stringify(redAt) + ')')
eq(per < 80, 'chunk gen ' + per.toFixed(1) + ' ms per 24-chunk (' + chunks + ' chunks)')

function bagOf(counts) {
  return { count: (item) => counts[item] || 0 }
}
const nearOven = { bench: true, oven: true, smelter: false, forge: false, fabricator: false }
const ice = RECIPES.find((r) => r.id === 'ice')
const brick = RECIPES.find((r) => r.id === 'brickRed')
const oven = RECIPES.find((r) => r.id === 'oven')
const iceHeld = craftStatus(ice, bagOf({ snow: 4 }), nearOven, false)
const brickHeld = craftStatus(brick, bagOf({ redSand: 2 }), nearOven, false)
const iceEmpty = craftStatus(ice, bagOf({}), nearOven, false)
const slateOven = craftStatus(oven, bagOf({ slate: 8 }), { bench: true, oven: false }, false)
const stoneOven = craftStatus(oven, bagOf({ stone: 8 }), { bench: true, oven: false }, false)
eq(iceHeld.group !== 'gated' && iceHeld.ok, 'ice leaves gated once snow is held ' + iceHeld.group)
eq(brickHeld.group !== 'gated' && brickHeld.ok, 'red brick leaves gated once red sand is held ' + brickHeld.group)
eq(!iceEmpty.ok && iceEmpty.group !== 'now', 'ice stays closed with an empty bag')
eq(!isStone('slate') && isStone('stone') && isStone('coal'), 'slate is not stoneAny')
eq(!slateOven.ok && stoneOven.ok, 'oven takes stone, not slate')

if (fail.length) {
  console.error(fail.join('\n'))
  process.exit(1)
}
console.log('worldgen-check ok ' + per.toFixed(1) + ' ms/chunk')
