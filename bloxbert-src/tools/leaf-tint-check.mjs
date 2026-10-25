// 2.5.463: leafTint channels stay ≤ 1.0
import { leafTint } from '../src/gfx/look.js'
let fail = 0
for (const id of [12, 1201]) {
  for (let i = 0; i < 200; i++) {
    const t = leafTint(id, i * 7, i * 13)
    if (!t) continue
    for (const c of t) {
      if (c > 1.0) { console.log(`FAIL id ${id} channel ${c}`); fail++ }
    }
  }
}
console.log(fail ? `FAIL ${fail}` : 'PASS leafTint ≤ 1.0')
process.exit(fail ? 1 : 0)
