// decor-check: place, toggle, pick up with design kept, rug 2x2 no-room.
import { readFileSync } from 'fs'
import { FROZEN } from '../src/data/ids.js'

const report = { steps: [], fail: null }
function note(name, ok, detail) {
  report.steps.push({ name, ok: !!ok, detail: detail || '' })
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + name + (detail ? ' ' + detail : ''))
  if (!ok && !report.fail) report.fail = name
  return ok
}

note('ids frozen', [1100, 1101, 1102, 1103, 1104, 1105].every((id) => Object.values(FROZEN).includes(id)))
note('ids unique', new Set(Object.values(FROZEN)).size === Object.keys(FROZEN).length)

// simulated place / toggle / pickup
let world = new Map()
let bag = []
function place(id, x, y, z, design) {
  world.set(x + ',' + y + ',' + z, { id, design })
  return true
}
function toggle(x, y, z) {
  const c = world.get(x + ',' + y + ',' + z)
  if (!c) return false
  const map = { 1100: 1101, 1101: 1100, 1102: 1103, 1103: 1102 }
  c.id = map[c.id] || c.id
  return true
}
function pickup(x, y, z) {
  const c = world.get(x + ',' + y + ',' + z)
  if (!c) return null
  world.delete(x + ',' + y + ',' + z)
  bag.push({ item: c.id === 1101 || c.id === 1100 ? 'floorLamp' : 'wallLamp', design: c.design })
  return bag[bag.length - 1]
}
function rugPlace(x, y, z) {
  const cells = [[x,y,z],[x+1,y,z],[x,y,z+1],[x+1,y,z+1]]
  for (const [cx,cy,cz] of cells) if (world.has(cx+','+cy+','+cz)) return false
  for (const [cx,cy,cz] of cells) world.set(cx+','+cy+','+cz, { id: cx===x&&cz===z?1104:1105, design: { main: 'red', trim: 'blue' } })
  return true
}

note('place floor', place(1100, 10, 1, 10, { height: 'Tall', shade: 'Teal' }))
note('toggle', toggle(10, 1, 10) && world.get('10,1,10').id === 1101)
note('pickup keeps design', (() => { const g = pickup(10, 1, 10); return g && g.design && g.design.shade === 'Teal' })())
note('rug 2x2', rugPlace(20, 1, 20) && world.size === 4)
note('rug no-room', !rugPlace(20, 1, 20))

console.log(JSON.stringify(report, null, 2))
if (report.fail) process.exit(1)
