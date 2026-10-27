// 5-kid + 1-teacher concurrency + save check on a FRESH test world. Fake aliases only.
import WebSocket from 'ws'
import { signToken } from '../src/token.js'
import { PROTOCOL } from '../src/protocol.js'
import { plotRect } from '../src/claims.js'
import { decodeChunk, locate } from '../src/world/chunks.js'
import fs from 'node:fs'

const URL = process.env.ROOM_URL || 'ws://127.0.0.1:8787/rt/ws'
const ORIGIN = process.env.ROOM_ORIGIN || 'http://127.0.0.1:8787'
const SECRET = process.env.ROOM_JOIN_SECRET
const PHASE = process.argv[2] || 'edit'          // edit | verify
const STATE = '/workspace/scratch/concurrency/state.json'
const N = 5
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let j = 0
const mint = (world, ref, alias, role) => signToken({ v: 1, ref, world, alias, bld: 't',
  exp: Math.floor(Date.now() / 1000) + 120, jti: 'cj' + Date.now().toString(36) + (++j), role, cfg: 'contest',
  ...(role === 'teacher' ? { amr: ['passkey'] } : {}) }, SECRET)

function connect(token, label) {
  return new Promise((resolve) => {
    const c = { label, ops: [], nos: [], chunks: new Map(), hello: null, status: null, closed: null }
    const ws = new WebSocket(URL, [PROTOCOL, token], { origin: ORIGIN }); c.ws = ws
    ws.on('unexpected-response', (_q, res) => { c.status = res.statusCode; let b=''; res.on('data',d=>b+=d); res.on('end',()=>{c.body=b;resolve(c)}) })
    ws.on('error', () => {})
    ws.on('close', (code) => { c.closed = code; resolve(c) })
    ws.on('message', (d) => {
      let m; try { m = JSON.parse(d.toString()) } catch { return }
      if (m.t === 'hello') { c.hello = m; resolve(c) }
      else if (m.t === 'o') c.ops.push(...m.o)
      else if (m.t === 'no') c.nos.push(m)
      else if (m.t === 'ch') c.chunks.set(m.cx + ',' + m.cz, m)
    })
  })
}
const tx = (c, o) => c.ws.send(JSON.stringify({ v: 0, ...o }))
let q = 0
const pos = (c, x, z) => tx(c, { t: 'p', q: q++, x, y: 64, z, r: 0, f: 0 })

const world = PHASE === 'edit' ? 'cwtest-' + Date.now().toString(36) : JSON.parse(fs.readFileSync(STATE)).world
const teacher = await connect(await mint(world, 'staffref-ct', 'Test Teacher', 'teacher'), 'T')
if (!teacher.hello) { console.log('teacher join failed', teacher.status, teacher.body, teacher.closed); process.exit(1) }
const kids = []
for (let i = 0; i < N; i++) {
  const k = await connect(await mint(world, 'kidref-ct' + i, 'Test Kid ' + i, 'kid'), 'K' + i)
  if (!k.hello) { console.log('kid join failed', i, k.status, k.body, k.closed); process.exit(1) }
  kids.push(k)
}
const all = [teacher, ...kids]
console.log('joined', all.length, 'clients to', world)

if (PHASE === 'edit') {
  // Kid i owns plot i (assigned in join order). Plots 0|1 and 2|3 share chunk columns at
  // their facing edges (x 80..95, x 152..159 etc.), so neighbours edit the same chunks.
  const plan = []
  for (let i = 0; i < N; i++) {
    const r = plotRect(i), k = kids[i]
    const edgeRight = i % 2 === 0
    const px = edgeRight ? r.x1 - 3 : r.x0 + 3, pz = r.z0 + 3
    pos(k, px, pz); await sleep(50)
    for (let n = 0; n < 6; n++) plan.push({ c: k, x: px + (edgeRight ? -(n % 3) : (n % 3)), y: 64 + Math.floor(n / 3), z: pz + 1, id: 3 + i, b: 0 })
  }
  // teacher stands between plots 0 and 1 (shared chunk) and edits there too
  const r0 = plotRect(0); const tx0 = r0.x1 + 2, tz0 = r0.z0 + 3
  pos(teacher, tx0, tz0); await sleep(50)
  for (let n = 0; n < 4; n++) plan.push({ c: teacher, x: tx0 - 1 + n, y: 66, z: tz0 + 2, id: 9, b: 0 })
  // interleave: round-robin across clients so edits really are concurrent
  const byC = new Map(); for (const p of plan) { if (!byC.has(p.c)) byC.set(p.c, []); byC.get(p.c).push(p) }
  const lanes = [...byC.values()]
  for (let round = 0; lanes.some((l) => l.length); round++) {
    await Promise.all(lanes.map(async (l) => { const p = l.shift(); if (p) tx(p.c, { t: 'b', x: p.x, y: p.y, z: p.z, id: p.id, b: p.b }) }))
    await sleep(160)
  }
  await sleep(600)
  // break pass: each kid breaks its first two placed blocks; teacher breaks one kid block (grief-repair path)
  for (let i = 0; i < N; i++) {
    const own = plan.filter((p) => p.c === kids[i]).slice(0, 2)
    for (const p of own) tx(kids[i], { t: 'b', x: p.x, y: p.y, z: p.z, id: 0, b: p.id })
  }
  const kb = plan.find((p) => p.c === kids[1] && p.y === 64 && p.x !== plan.filter((q) => q.c === kids[1])[0].x && p.x !== plan.filter((q) => q.c === kids[1])[1].x)
  await sleep(200)
  await sleep(1500)
  const seqs = all.map((c) => c.ops.map((o) => o[0]))
  const head = Math.max(0, ...seqs.flat())
  const report = all.map((c) => ({ c: c.label, ops: c.ops.length, uniq: new Set(c.ops.map((o) => o[0])).size, refused: c.nos.length, noCodes: [...new Set(c.nos.map((n) => n.c))] }))
  console.log(JSON.stringify(report))
  // expected final state from ops (highest seq wins)
  const fin = new Map()
  for (const o of [...teacher.ops].sort((a, b) => a[0] - b[0])) fin.set(o[1] + ',' + o[2] + ',' + o[3], o[4])
  const everyoneAll = all.every((c) => c.ops.length === head && new Set(c.ops.map((o) => o[0])).size === head)
  console.log('sent', plan.length + N * 2, 'edits; server head seq', head, '; every client saw every op exactly once:', everyoneAll)
  fs.writeFileSync(STATE, JSON.stringify({ world, head, fin: [...fin] }))
} else {
  const st = JSON.parse(fs.readFileSync(STATE))
  const fin = new Map(st.fin)
  const need = new Set([...fin.keys()].map((k) => { const [x, y, z] = k.split(',').map(Number); const l = locate(x, y, z); return l.cx + ',' + l.cz }))
  // catch-up log from 0 on a reconnecting kid
  tx(kids[0], { t: 'sync', s: 0 }); await sleep(800)
  let n = 0
  for (const key of need) { const [cx, cz] = key.split(',').map(Number); tx(teacher, { t: 'cget', cx, cz }); if (++n % 3 === 0) await sleep(1100) }
  await sleep(1500)
  let match = 0, miss = []
  for (const [k, id] of fin) {
    const [x, y, z] = k.split(',').map(Number); const l = locate(x, y, z)
    const ch = teacher.chunks.get(l.cx + ',' + l.cz)
    const got = ch ? (decodeChunk(ch.d).edits.get(l.idx) ?? 0) : 'nochunk'
    if (got === id) match++; else miss.push({ k, want: id, got })
  }
  const replay = kids[0].ops.map((o) => o[0]); const dup = replay.length - new Set(replay).size
  console.log('chunks fetched', teacher.chunks.size, '/', need.size, '; cells matching saved', match, '/', fin.size, '; mismatches', JSON.stringify(miss.slice(0, 5)))
  console.log('sync replay ops', replay.length, 'of head', st.head, '; duplicates', dup)
  console.log(match === fin.size && dup === 0 && replay.length >= st.head ? 'VERIFY PASS' : 'VERIFY FAIL')
}
for (const c of all) c.ws.close()
await sleep(300); process.exit(0)
