// Screenshots for the report: builds a small example structure, then shoots it at 1366x768 and 412x915.
import puppeteer from 'puppeteer-core'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const b = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
for (const vp of [{ n: '1366x768', w: 1366, h: 768, m: false, q: '' }, { n: '412x915', w: 412, h: 915, m: true, q: '?touch=1' }]) {
  const ctx = await b.createBrowserContext(); const p = await ctx.newPage()
  await p.setViewport({ width: vp.w, height: vp.h, isMobile: vp.m, hasTouch: vp.m, deviceScaleFactor: 1 })
  await p.goto('http://127.0.0.1:8870/' + vp.q, { waitUntil: 'load' })
  await p.waitForFunction(() => window.__blocks && window.__blocks.perf.firstChunk > 0, { timeout: 60000 }); await sleep(2500)
  await p.evaluate(() => {
    const B = window.__blocks, S = B.setVoxel
    const H = (x, z) => Math.round(3 + 2.2 * Math.sin(x / 19) * Math.cos(z / 23) + 1.2 * Math.sin((x + z) / 11))
    const X0 = 2, X1 = 12, Z0 = 9, Z1 = 17, F = 5
    for (let x = X0 - 1; x <= X1 + 1; x++) for (let z = Z0 - 1; z <= Z1 + 1; z++) {
      for (let y = H(x, z) + 1; y < F; y++) S(x, y, z, 3)
      for (let y = F + 1; y <= H(x, z); y++) S(x, y, z, 0)
      S(x, F, z, 9)
    }
    for (let x = X0; x <= X1; x++) for (let z = Z0; z <= Z1; z++) {
      const edge = x === X0 || x === X1 || z === Z0 || z === Z1
      if (!edge) continue
      for (let y = F + 1; y <= F + 4; y++) {
        let id = 8
        if ((y === F + 2 || y === F + 3) && ((x - X0) % 3 === 1 || (z - Z0) % 3 === 1) && !(x === X0 && z === Z0) && !(x === X1 && z === Z1)) id = 20
        if (z === Z0 && (x === 7) && y <= F + 2) id = 0
        if (y === F + 4) id = 13
        S(x, y, z, id)
      }
    }
    for (let x = X0 - 1; x <= X1 + 1; x++) for (let z = Z0 - 1; z <= Z1 + 1; z++) S(x, F + 5, z, 10)
    for (let x = X0 + 2; x <= X1 - 2; x++) for (let z = Z0 + 2; z <= Z1 - 2; z++) S(x, F + 6, z, 11)
    // a path to the door
    for (let z = 0; z < Z0 - 1; z++) { S(7, H(7, z), z, 7) }
    B.noa.entities.setPosition(B.noa.playerEntity, [7.5, H(7, -3) + 1.2, -3.5])
    B.setLook(0.05, 0.12)
    B.pick(20)
  })
  await sleep(4000)
  await p.screenshot({ path: `measure/show-${vp.n}.png` })
  if (vp.m) { await p.click('#menu-btn'); await sleep(500); await p.screenshot({ path: `measure/show-${vp.n}-menu.png` }) }
  await ctx.close()
}
await b.close()
