// Fresh Survival start: bag and wallet match a new profile, and the archived world comes back.
import puppeteer from 'puppeteer-core'
import { existsSync } from 'fs'

const URL0 = process.argv[2] || 'http://127.0.0.1:8873/?smoke=1'
const chrome = process.env.CHROME_PATH || ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium-1148/chrome-linux/chrome'].find((p) => existsSync(p))
if (!chrome) throw new Error('no chrome')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const fail = []
function eq(ok, msg) { if (!ok) fail.push(msg) }

const browser = await puppeteer.launch({
  executablePath: chrome, headless: 'new', protocolTimeout: 180000,
  args: ['--no-sandbox', '--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-dev-shm-usage'],
})
const page = await browser.newPage()
page.setDefaultTimeout(90000)
const errs = []
page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message))
await page.evaluateOnNewDocument(() => {
  try { localStorage.setItem('bloxbert-learn', JSON.stringify({ tourDone: true, goals: {} })) } catch (e) {}
  try { localStorage.setItem('bloxbert-look', JSON.stringify({ sens: 1, invert: false, wide: false, climb: true })) } catch (e) {}
})
await page.goto(URL0, { waitUntil: 'load' })
await page.waitForFunction(() => window.__blocks && window.__smoke && window.__bloxReady, { timeout: 60000 })
await sleep(400)

const report = await page.evaluate(async () => {
  const B = window.__blocks
  const S = window.__smoke
  const counts = () => ({
    log: S.count('log'), stone: S.count('stone'), slate: S.count('slate'),
    sapling: S.count('sapling'), wood: S.count('woodTool'), oven: S.count('oven'), planks: S.count('planks'),
  })
  B.mode('survival')
  S.emptyBag()
  B.give('log', 5)
  B.give('stone', 3)
  B.give('slate', 8)
  const led = B.ledger()
  led.push({ tx: 's-fresh-check', at: 1, by: 'you', kind: 'goal', cogs: 15 })
  const high = B.cogs()
  B.setVoxel(30, 20, 30, 4)
  const before = { counts: counts(), voxel: B.getVoxel(30, 20, 30), cogs: high }
  await B.save()
  await B.resetWorld()
  const fresh = { counts: counts(), cogs: B.cogs(), voxel: B.getVoxel(30, 20, 30), words: {
    wood: S.word('woodTool'), stone: S.word('stoneTool'), path: S.word('pathTool'),
    fresh: S.word('confirmFresh'), stoneAny: S.word('stoneAny'),
  } }
  const dbName = indexedDB.databases ? null : null
  const names = await indexedDB.databases()
  const db = await new Promise((res, rej) => {
    const hit = names.find((d) => d.name && d.name.indexOf('kuliblocks') === 0)
    const r = indexedDB.open(hit ? hit.name : 'kuliblocks-test')
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  const keys = await new Promise((res, rej) => {
    const r = db.transaction('worlds').objectStore('worlds').getAllKeys()
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  })
  db.close()
  const classics = (keys || []).filter((k) => typeof k === 'string' && k.indexOf('-classic-') > 0)
  const oldBtn = document.getElementById('m-old')
  if (oldBtn) oldBtn.click()
  const t0 = performance.now()
  while (performance.now() - t0 < 2000 && !document.querySelector('#m-old-list button')) await new Promise((r) => setTimeout(r, 30))
  const row = document.querySelector('#m-old-list button')
  if (row) row.click()
  const t1 = performance.now()
  let back = null
  while (performance.now() - t1 < 8000) {
    const c = counts()
    if (c.log === 5 && B.getVoxel(30, 20, 30) === 4) { back = { counts: c, voxel: B.getVoxel(30, 20, 30), cogs: B.cogs() }; break }
    await new Promise((r) => setTimeout(r, 50))
  }
  S.emptyBag()
  S.give ? S.give('log', 2) : B.give('log', 2)
  S.focus('planks')
  B.panel('crafting')
  const craftText = (document.getElementById('sheet-body') || {}).innerText || ''
  const px = Math.floor(S.pos()[0])
  const py = Math.floor(S.pos()[1])
  const pz = Math.floor(S.pos()[2])
  B.setVoxel(px + 1, py, pz, 22)
  S.emptyBag()
  B.give('planks', 5)
  const made = S.craft('woodTool')
  const toast = S.toast()
  S.emptyBag()
  B.give('slate', 8)
  const oven = S.craft('oven')
  return { before, fresh, classics, opened: !!row, back, craftText, made, toast, oven, slateLeft: S.count('slate'), ovenN: S.count('oven') }
})

eq(report.before.voxel === 4 && report.before.counts.log === 5 && report.before.cogs === 35, 'setup bag/voxel/cogs ' + JSON.stringify(report.before))
eq(report.fresh.counts.sapling === 2 && report.fresh.counts.log === 0 && report.fresh.counts.stone === 0 && report.fresh.counts.slate === 0, 'fresh bag is saplings only ' + JSON.stringify(report.fresh.counts))
eq(report.fresh.cogs === 20, 'fresh wallet is 20, got ' + report.fresh.cogs)
eq(report.fresh.voxel !== 4, 'fresh world dropped the marked block')
eq(report.classics.length >= 1, 'archive key exists ' + JSON.stringify(report.classics))
eq(report.opened && report.back && report.back.counts.log === 5 && report.back.counts.stone === 3 && report.back.counts.slate === 8 && report.back.voxel === 4, 'archive restores bag and block ' + JSON.stringify(report.back))
eq(report.fresh.words.wood === 'Wood Pickaxe' && report.fresh.words.stone === 'Stone Pickaxe' && report.fresh.words.path === 'Make a Wood Pickaxe', 'tool names ' + JSON.stringify(report.fresh.words))
eq(/old world/i.test(report.fresh.words.fresh) && /menu/i.test(report.fresh.words.fresh), 'confirmFresh ' + report.fresh.words.fresh)
eq(report.fresh.words.stoneAny === 'Stone or Slate', 'stoneAny label ' + report.fresh.words.stoneAny)
eq(/In bag:\s*2/.test(report.craftText), 'planks shows In bag ' + report.craftText.slice(0, 240))
eq(report.made && report.made.ok && report.toast === 'Wood Pickaxe - mines stone faster', 'wood pick toast ' + JSON.stringify({ made: report.made, toast: report.toast }))
eq(report.oven && report.oven.ok && report.ovenN === 1 && report.slateLeft === 0, 'oven from 8 slate ' + JSON.stringify({ oven: report.oven, slate: report.slateLeft, n: report.ovenN }))
eq(!errs.length, 'console errors ' + errs.slice(0, 6).join(' | '))

await browser.close()
if (fail.length) {
  console.error(fail.join('\n'))
  process.exit(1)
}
console.log('fresh-check ok')
