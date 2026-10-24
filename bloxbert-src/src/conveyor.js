// Conveyor lines. One flat loop per tick. State lives in the world meta (facing, held count).
import { EXTRA } from './strings-extra.js'
import { RECIPES } from './data/recipes.js'

const COPY = {
  en: {
    conveyor: 'Conveyor',
    beltHint: 'Belt the Smelter to the Box',
    beltIn: 'In: Conveyor',
    beltOut: 'Out: Conveyor',
    beltMove: 'Input {inn} -> 4/sec -> Output {outn}',
    beltFull: 'Full',
    beltPaused: 'Paused',
    tooManyMachines: 'Too many machines here',
  },
  uk: {
    conveyor: 'Конвеєр',
    beltHint: 'Стрічка: Плавильня до Скриня',
    beltIn: 'Вхід: Конвеєр',
    beltOut: 'Вихід: Конвеєр',
    beltMove: 'Вхід {inn} -> 4/сек -> Вихід {outn}',
    beltFull: 'Повно',
    beltPaused: 'Пауза',
    tooManyMachines: 'Тут забагато машин',
  },
  ru: {
    conveyor: 'Конвейер',
    beltHint: 'Лента: Плавильня до Сундук',
    beltIn: 'Вход: Конвейер',
    beltOut: 'Выход: Конвейер',
    beltMove: 'Вход {inn} -> 4/сек -> Выход {outn}',
    beltFull: 'Полно',
    beltPaused: 'Пауза',
    tooManyMachines: 'Слишком много машин',
  },
  es: {
    conveyor: 'Transportador',
    beltHint: 'Cinta de la Fundidora a la Caja',
    beltIn: 'Entra: Transportador',
    beltOut: 'Sale: Transportador',
    beltMove: 'Entrada {inn} -> 4/s -> Salida {outn}',
    beltFull: 'Lleno',
    beltPaused: 'Pausa',
    tooManyMachines: 'Demasiadas máquinas aquí',
  },
  ar: {
    conveyor: 'سير',
    beltHint: 'صِل مصهر إلى صندوق',
    beltIn: 'داخل: سير',
    beltOut: 'خارج: سير',
    beltMove: 'مدخل {inn} -> 4/ث -> مخرج {outn}',
    beltFull: 'ممتلئ',
    beltPaused: 'متوقف',
    tooManyMachines: 'آلات كثيرة هنا',
  },
  'fa-AF': {
    conveyor: 'نوار',
    beltHint: 'کوره گداز را به صندوق برسان',
    beltIn: 'ورود: نوار',
    beltOut: 'خروج: نوار',
    beltMove: 'ورود {inn} -> ۴/ث -> خروج {outn}',
    beltFull: 'پر',
    beltPaused: 'مکث',
    tooManyMachines: 'اینجا ماشین زیاد است',
  },
  rw: {
    conveyor: 'Umugozi',
    beltHint: 'Huza Isaturire na Agasanduku',
    beltIn: 'Injira: Umugozi',
    beltOut: 'Sohoka: Umugozi',
    beltMove: 'Iwinjira {inn} -> 4/seg -> Ibisohoka {outn}',
    beltFull: 'Byuzuye',
    beltPaused: 'Hagarara',
    tooManyMachines: 'Imashini nyinshi hano',
  },
  ti: {
    conveyor: 'መተሓላለፊ',
    beltHint: 'መፍለሒ ናብ ሳንዱቅ',
    beltIn: 'እታይ: መተሓላለፊ',
    beltOut: 'ወጻኢ: መተሓላለፊ',
    beltMove: 'እታይ {inn} -> 4/ሰ -> ወጻኢ {outn}',
    beltFull: 'መሊኡ',
    beltPaused: 'ደው',
    tooManyMachines: 'ማሽን ብዙሕ ኣሎ',
  },
}
for (const lang of Object.keys(COPY)) {
  if (!EXTRA[lang]) EXTRA[lang] = {}
  Object.assign(EXTRA[lang], COPY[lang])
}

export const BELT_ID = 74
const LINE_CAP = 64
const KID_LINES = 16
const WORLD_LINES = 600
const CHUNK = 24
const NEAR = 2
const STEP = { N: [0, 0, 1], S: [0, 0, -1], E: [1, 0, 0], W: [-1, 0, 0] }
const BACK = { N: 'S', S: 'N', E: 'W', W: 'E' }
const TURN = { N: 'E', E: 'S', S: 'W', W: 'N' }
const FACES = ['N', 'E', 'S', 'W']

function keyOf(x, y, z) { return (x | 0) + ',' + (y | 0) + ',' + (z | 0) }
function stepOf(face, x, y, z) {
  const d = STEP[face] || STEP.S
  return [x + d[0], y + d[1], z + d[2]]
}
function chunkOf(x, y, z) {
  return [Math.floor(x / CHUNK), Math.floor(y / CHUNK), Math.floor(z / CHUNK)]
}
function nearAnchor(x, y, z, anchors) {
  const c = chunkOf(x, y, z)
  for (const a of anchors || []) {
    const b = chunkOf(a.x, a.y, a.z)
    if (Math.max(Math.abs(c[0] - b[0]), Math.abs(c[1] - b[1]), Math.abs(c[2] - b[2])) <= NEAR) return true
  }
  return false
}

export function createBelts(api) {
  const tiles = new Map()
  let lines = []
  let dirty = true
  let hintSent = false
  const full = new Set()
  const pausedLine = new Set()

  function t(k) { return api.t ? api.t(k) : k }
  function write(tile) {
    const prev = api.metaGet(tile.key) || {}
    api.metaSet(tile.key, {
      ...prev,
      kind: 'conveyor',
      face: tile.face,
      item: tile.item || '',
      n: tile.n | 0,
      owner: tile.owner || 'you',
      born: tile.born || 0,
    })
  }
  function readMeta() {
    tiles.clear()
    const all = api.metaEntries ? api.metaEntries() : []
    for (const [key, rec] of all) {
      if (!rec || rec.kind !== 'conveyor') continue
      const p = key.split(',').map(Number)
      if (p.length < 3 || p.some((n) => !Number.isFinite(n))) continue
      const face = FACES.includes(rec.face) ? rec.face : 'S'
      tiles.set(key, {
        key, x: p[0], y: p[1], z: p[2], face,
        item: rec.item || '', n: rec.n > 0 ? 1 : 0,
        owner: rec.owner || 'you', born: rec.born || 0,
      })
    }
    dirty = true
  }
  function rebuild() {
    const fed = new Set()
    for (const tile of tiles.values()) {
      const n = stepOf(tile.face, tile.x, tile.y, tile.z)
      const nxt = tiles.get(keyOf(n[0], n[1], n[2]))
      if (nxt && nxt.face === tile.face) fed.add(nxt.key)
    }
    const next = []
    const seen = new Set()
    for (const tile of tiles.values()) {
      if (fed.has(tile.key) || seen.has(tile.key)) continue
      const line = []
      let cur = tile
      let born = tile.born || 0
      while (cur && !seen.has(cur.key) && line.length < LINE_CAP + 8) {
        seen.add(cur.key)
        line.push(cur)
        if ((cur.born || 0) && (!born || cur.born < born)) born = cur.born
        const n = stepOf(cur.face, cur.x, cur.y, cur.z)
        const nxt = tiles.get(keyOf(n[0], n[1], n[2]))
        if (!nxt || nxt.face !== cur.face) break
        cur = nxt
      }
      const lineObj = { tiles: line, owner: line[0].owner || 'you', born, fromOven: false } // 2.5.440: cache line on tile
      for (const t of line) t.line = lineObj
      next.push(lineObj)
    }
    lines = next
    dirty = false
  }
  function ensure() { if (dirty) rebuild() }
  function lineNear(line, anchors) {
    for (const tile of line.tiles) if (nearAnchor(tile.x, tile.y, tile.z, anchors)) return true
    return false
  }
  function markPaused(anchors) {
    pausedLine.clear()
    ensure()
    const away = []
    for (const line of lines) if (!lineNear(line, anchors)) away.push(line)
    if (lines.length <= WORLD_LINES) return
    away.sort((a, b) => (a.born || 0) - (b.born || 0))
    let extra = lines.length - WORLD_LINES
    for (const line of away) {
      if (extra <= 0) break
      pausedLine.add(line)
      extra -= 1
    }
  }
  function snapped(x, y, z, fallback) {
    let face = FACES.includes(fallback) ? fallback : 'S'
    for (const f of FACES) {
      const b = stepOf(BACK[f], x, y, z)
      const back = tiles.get(keyOf(b[0], b[1], b[2]))
      if (back && back.face === f) return f
    }
    for (const f of FACES) {
      const n = stepOf(f, x, y, z)
      const front = tiles.get(keyOf(n[0], n[1], n[2]))
      if (front && front.face === f) return f
    }
    return face
  }
  function pretend(x, y, z, face, owner) {
    const key = keyOf(x, y, z)
    const prev = tiles.get(key)
    const tile = { key, x: x | 0, y: y | 0, z: z | 0, face, item: '', n: 0, owner: owner || 'you', born: Date.now() }
    tiles.set(key, tile)
    dirty = true
    rebuild()
    const line = lines.find((row) => row.tiles.some((t) => t.key === key))
    const info = {
      line, len: line ? line.tiles.length : 1,
      fresh: !prev && line && line.tiles[0].key === key && line.tiles.length === 1,
      joins: !!(line && line.tiles.length > 1),
    }
    if (prev) tiles.set(key, prev)
    else tiles.delete(key)
    dirty = true
    rebuild()
    return info
  }
  function awayFace(x, z) {
    const toward = api.faceToward ? api.faceToward(x, z) : 'S'
    return BACK[toward] || 'S'
  }
  function tryPlace(x, y, z, fallback, owner) {
    ensure()
    const face = snapped(x, y, z, fallback || awayFace(x, z))
    const info = pretend(x, y, z, face, owner || 'you')
    if (info.len > LINE_CAP) return { ok: false, face }
    if (!info.joins) {
      const mine = lines.filter((row) => row.owner === (owner || 'you')).length
      if (mine >= KID_LINES) return { ok: false, face }
      const anchors = api.anchors ? api.anchors() : []
      const away = lines.filter((row) => !lineNear(row, anchors)).length
      const nearN = lines.length - away
      if (nearN >= WORLD_LINES) return { ok: false, face }
    }
    return { ok: true, face }
  }
  function commit(x, y, z, face, owner) {
    const key = keyOf(x, y, z)
    const tile = {
      key, x: x | 0, y: y | 0, z: z | 0,
      face: FACES.includes(face) ? face : 'S',
      item: '', n: 0, owner: owner || 'you', born: Date.now(),
    }
    tiles.set(key, tile)
    write(tile)
    dirty = true
    if (api.mark) api.mark()
  }
  function rotate(x, y, z) {
    const key = keyOf(x, y, z)
    const tile = tiles.get(key)
    if (!tile) return null
    const face = TURN[tile.face] || 'E'
    const info = pretend(x, y, z, face, tile.owner)
    if (info.len > LINE_CAP) return false
    tile.face = face
    write(tile)
    dirty = true
    if (api.mark) api.mark()
    return true
  }
  function remove(x, y, z) {
    const key = keyOf(x, y, z)
    const tile = tiles.get(key)
    if (!tile) return ''
    const item = tile.n && tile.item ? tile.item : ''
    tiles.delete(key)
    if (api.metaDelete) api.metaDelete(key)
    dirty = true
    if (api.mark) api.mark()
    return item
  }
  function machineAt(x, y, z) {
    return api.machine ? api.machine(x, y, z) : ''
  }
  function isOutputBelt(tile) {
    const b = stepOf(BACK[tile.face], tile.x, tile.y, tile.z)
    const kind = machineAt(b[0], b[1], b[2])
    if (!kind) return null
    if (kind === 'box') return { kind, x: b[0], y: b[1], z: b[2] }
    const face = api.machineFace ? api.machineFace(b[0], b[1], b[2]) : 'S'
    const front = stepOf(face, b[0], b[1], b[2])
    if (front[0] === tile.x && front[1] === tile.y && front[2] === tile.z) return { kind, x: b[0], y: b[1], z: b[2] }
    return null
  }
  function isInputBelt(tile) {
    const n = stepOf(tile.face, tile.x, tile.y, tile.z)
    const kind = machineAt(n[0], n[1], n[2])
    if (!kind) return null
    if (kind === 'box') return { kind, x: n[0], y: n[1], z: n[2] }
    const face = api.machineFace ? api.machineFace(n[0], n[1], n[2]) : 'S'
    const backFace = BACK[face]
    const back = stepOf(backFace, n[0], n[1], n[2])
    if (kind === 'oven') {
      if (back[0] === tile.x && back[1] === tile.y && back[2] === tile.z) return { kind, x: n[0], y: n[1], z: n[2] }
      return null
    }
    if (back[0] === tile.x && back[1] === tile.y && back[2] === tile.z) return { kind, x: n[0], y: n[1], z: n[2] }
    return null
  }
  function pullFrom(src) {
    if (!src) return ''
    if (src.kind === 'oven') return api.pullOven ? api.pullOven(src.x, src.y, src.z) : ''
    if (src.kind === 'box') return api.pullBox ? api.pullBox(src.x, src.y, src.z) : ''
    if (src.kind === 'bench') return api.pullBench ? api.pullBench(src.x, src.y, src.z) : ''
    return ''
  }
  function pushTo(dst, item) {
    if (!dst || !item) return false
    if (dst.kind === 'box') return api.pushBox ? api.pushBox(dst.x, dst.y, dst.z, item) : false
    if (dst.kind === 'bench') return api.pushBench ? api.pushBench(dst.x, dst.y, dst.z, item) : false
    if (dst.kind === 'oven') return api.pushOven ? api.pushOven(dst.x, dst.y, dst.z, item) : false
    return false
  }
  function countsOf(kind, x, y, z) {
    if (kind === 'oven') return api.ovenCounts ? api.ovenCounts(x, y, z) : { inn: 0, outn: 0 }
    if (kind === 'box') return api.boxCounts ? api.boxCounts(x, y, z) : { inn: 0, outn: 0 }
    if (kind === 'bench') return api.benchCounts ? api.benchCounts(x, y, z) : { inn: 0, outn: 0 }
    return { inn: 0, outn: 0 }
  }
  function tick(anchors) {
    ensure()
    markPaused(anchors || [])
    let moved = false
    const nextFull = new Set()
    for (const line of lines) {
      const running = lineNear(line, anchors) && !pausedLine.has(line)
      if (!running) continue
      const row = line.tiles
      const head = row[row.length - 1]
      const tail = row[0]
      const dst = isInputBelt(head)
      if (head.n && dst) {
        const ok = pushTo(dst, head.item)
        const mk = keyOf(dst.x, dst.y, dst.z)
        if (ok) {
          head.n = 0
          head.item = ''
          write(head)
          full.delete(mk)
          moved = true
          if (line.fromOven && dst.kind === 'box') finishHint()
        } else nextFull.add(mk)
      }
      for (let i = row.length - 2; i >= 0; i--) {
        const a = row[i]
        const b = row[i + 1]
        if (a.n && !b.n) {
          b.item = a.item
          b.n = 1
          a.item = ''
          a.n = 0
          write(a)
          write(b)
          moved = true
        }
      }
      const src = isOutputBelt(tail)
      if (src && src.kind === 'oven') line.fromOven = true
      if (!tail.n && src) {
        const item = pullFrom(src)
        if (item) {
          tail.item = item
          tail.n = 1
          write(tail)
          moved = true
        }
      }
      if (api.craftBench) {
        const seen = new Set()
        for (const tile of row) {
          const fed = isOutputBelt(tile)
          const into = isInputBelt(tile)
          for (const m of [fed, into]) {
            if (!m || m.kind !== 'bench') continue
            const mk = keyOf(m.x, m.y, m.z)
            if (seen.has(mk)) continue
            seen.add(mk)
            if (api.craftBench(m.x, m.y, m.z)) moved = true
          }
        }
      }
    }
    full.clear()
    for (const key of nextFull) full.add(key)
    if (moved && api.mark) api.mark()
  }
  function finishHint() {
    if (hintSent) return
    hintSent = true
    if (api.hintDone) api.hintDone()
  }
  function flow(key) {
    ensure()
    const parts = String(key || '').split(',').map(Number)
    if (parts.length < 3) return null
    const [x, y, z] = parts
    const kind = machineAt(x, y, z)
    if (!kind) return null
    let inBelt = false
    let outBelt = false
    let paused = false
    let live = false
    const anchors = api.anchors ? api.anchors() : []
    for (const line of lines) {
      const head = line.tiles[line.tiles.length - 1]
      const tail = line.tiles[0]
      const dst = isInputBelt(head)
      const src = isOutputBelt(tail)
      const hitIn = dst && dst.x === x && dst.y === y && dst.z === z
      const hitOut = src && src.x === x && src.y === y && src.z === z
      if (!hitIn && !hitOut) continue
      if (hitIn) inBelt = true
      if (hitOut) outBelt = true
      const running = lineNear(line, anchors) && !pausedLine.has(line)
      if (!running) paused = true
      else live = true
    }
    if (!inBelt && !outBelt) return null
    const counts = countsOf(kind, x, y, z)
    const heldFull = full.has(keyOf(x, y, z)) && live
    const bits = []
    if (!live && paused) bits.push('⏸ ' + t('beltPaused'))
    else if (heldFull) bits.push('⏸ ' + t('beltFull'))
    bits.push(t('beltMove').replace('{inn}', String(counts.inn || 0)).replace('{outn}', String(counts.outn || 0)))
    if (inBelt) bits.push(t('beltIn'))
    if (outBelt) bits.push(t('beltOut') + (live && !heldFull ? ' 4/sec' : ''))
    return { text: bits.join(' · '), full: !!heldFull, paused: !live && paused, inBelt, outBelt }
  }
  function visuals(anchors) { // 2.5.440: use tile.line, memo lineNear
    ensure()
    const near = new Map()
    const out = []
    for (const tile of tiles.values()) {
      if (!nearAnchor(tile.x, tile.y, tile.z, anchors)) continue
      const line = tile.line
      let pause = !line || pausedLine.has(line)
      if (line && !pause) {
        if (!near.has(line)) near.set(line, lineNear(line, anchors))
        pause = !near.get(line)
      }
      out.push({ x: tile.x, y: tile.y, z: tile.z, face: tile.face, item: tile.n ? tile.item : '', n: tile.n | 0, pause })
    }
    return out
  }
  function prune() {
    if (!api.solid) return
    for (const tile of [...tiles.values()]) {
      if (!api.ready || !api.ready(tile.x, tile.y, tile.z)) continue
      if (!api.solid(tile.x, tile.y, tile.z)) remove(tile.x, tile.y, tile.z)
    }
  }
  return {
    id: BELT_ID,
    awayFace, tryPlace, commit, rotate, remove, tick, flow, visuals, prune,
    adopt: readMeta,
    clear() { tiles.clear(); lines = []; dirty = true; full.clear() },
    hintClear() { hintSent = false },
    stats() {
      ensure()
      return {
        tiles: tiles.size,
        lines: lines.length,
        full: [...full],
        sample: [...tiles.values()].slice(0, 8).map((tile) => ({ ...tile })),
      }
    },
  }
}

export function beltRecipeOk(bin, recipe) {
  const have = {}
  for (const s of bin || []) if (s && s.n) have[s.item] = (have[s.item] || 0) + s.n
  return (recipe.in || []).every(([item, n]) => (have[item] || 0) >= n)
}

export function craftOnce(bin, bout, recipes) {
  const list = recipes || RECIPES
  for (const recipe of list) {
    if (!recipe || (recipe.at !== 'hand' && recipe.at !== 'bench')) continue
    if (!beltRecipeOk(bin, recipe)) continue
    if (!roomFor(bout, recipe.out[0], recipe.out[1])) continue
    for (const [item, n] of recipe.in) takeStack(bin, item, n)
    addStack(bout, recipe.out[0], recipe.out[1])
    return recipe.id
  }
  return ''
}

function takeStack(slots, item, n) {
  let left = n
  for (const s of slots) {
    if (!s || s.item !== item || !left) continue
    const d = Math.min(s.n, left)
    s.n -= d
    left -= d
  }
  for (let i = slots.length - 1; i >= 0; i--) if (!slots[i] || slots[i].n <= 0) slots.splice(i, 1)
}
function addStack(slots, item, n) {
  let left = n
  for (const s of slots) {
    if (!s || s.item !== item || s.n >= 64 || !left) continue
    const d = Math.min(64 - s.n, left)
    s.n += d
    left -= d
  }
  while (left > 0 && slots.length < 8) {
    const d = Math.min(64, left)
    slots.push({ item, n: d })
    left -= d
  }
}
function roomFor(slots, item, n) {
  let space = 0
  let holes = 8 - (slots || []).length
  for (const s of slots || []) if (s && s.item === item) space += 64 - s.n
  space += Math.max(0, holes) * 64
  return space >= n
}

