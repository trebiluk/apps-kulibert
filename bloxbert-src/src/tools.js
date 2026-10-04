// Build Tools. One edit path. Ghosts are a preview; ✓ calls applyEdit.
export function createTools(api) {
  let a = null
  let b = null
  let clip = null
  const builds = []
  const snaps = []
  const cards = []
  function box() {
    if (!a || !b) return null
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0])
    const y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1])
    const z0 = Math.min(a[2], b[2]), z1 = Math.max(a[2], b[2])
    return { x0, y0, z0, x1, y1, z1, w: x1 - x0 + 1, h: y1 - y0 + 1, l: z1 - z0 + 1 }
  }
  function tooBig(bx) { return bx.w > 64 || bx.h > 32 || bx.l > 64 }
  function cells(bx) {
    const out = []
    for (let x = bx.x0; x <= bx.x1; x++) for (let y = bx.y0; y <= bx.y1; y++) for (let z = bx.z0; z <= bx.z1; z++) out.push([x, y, z, api.getVoxel(x, y, z)])
    return out
  }
  function select(p, q) { a = p; b = q; api.toast(tSize()) }
  function tSize() {
    const bx = box()
    if (!bx) return ''
    return bx.w + ' × ' + bx.h + ' × ' + bx.l + ' = ' + (bx.w * bx.h * bx.l)
  }
  function fill(id) {
    const bx = box()
    if (!bx || tooBig(bx)) { api.toast(api.t('tooBig')); return null }
    const ops = []
    for (const [x, y, z] of cells(bx)) {
      if (api.survival() && api.getVoxel(x, y, z) === 21) continue
      ops.push([x, y, z, id])
    }
    if (api.survival && api.survival()) {
      const have = api.have ? api.have(id) : 0
      if (have < ops.length) { api.toast(api.t('needMore').replace('{n}', ops.length - have).replace('{item}', api.blockName(id))); return null }
      if (api.spendBlock) api.spendBlock(id, ops.length)
    }
    return api.apply(ops, 'Fill ' + ops.length)
  }
  function copy() {
    const bx = box()
    if (!bx) return null
    clip = { origin: [bx.x0, bx.y0, bx.z0], size: [bx.w, bx.h, bx.l], cells: cells(bx).map(([x, y, z, id]) => [x - bx.x0, y - bx.y0, z - bx.z0, id]) }
    return clip
  }
  function pasteAt(origin, opts = {}) {
    if (!clip) return null
    const ops = []
    for (const [x, y, z, id] of clip.cells) {
      let dx = x, dz = z
      if (opts.mirror === 'x') dx = clip.size[0] - 1 - x
      if (opts.rot) { const t = dx; dx = dz; dz = clip.size[0] - 1 - t }
      const px = origin[0] + dx, py = origin[1] + y, pz = origin[2] + dz
      if (opts.keep && api.getVoxel(px, py, pz)) continue
      if (api.survival() && api.getVoxel(px, py, pz) === 21) continue
      ops.push([px, py, pz, id])
    }
    return api.apply(ops, 'Paste ' + ops.length)
  }
  function schemWrite() {
    if (!clip) copy()
    if (!clip) return null
    const names = api.names()
    const palette = ['air']
    const idx = new Map([[0, 0]])
    const data = []
    for (const [x, y, z, id] of clip.cells) {
      const name = names[id] || 'planks'
      if (!palette.includes(name)) palette.push(name)
      data.push(palette.indexOf(name))
    }
    return { format: 'bloxschem', v: 1, id: 'b' + Date.now(), name: 'Build', kind: 'build', createdAt: new Date().toISOString(), credits: [{ alias: 'me', role: 'made', app: 'bloxbert', at: new Date().toISOString() }], source: { app: 'bloxbert', appVersion: '2.3.0' }, size: clip.size, anchors: { start: [0, 0, 0], up: 'y' }, palette, blocks: { order: 'x+z*w+y*w*l', type: 'u16', enc: 'base64', count: data.length, data: btoa(String.fromCharCode(...new Uint8Array(new Uint16Array(data).buffer))) } }
  }
  function schemRead(obj) {
    if (!obj || obj.format !== 'bloxschem') { api.toast(api.t('badBuild')); return null }
    if (obj.scale && obj.scale !== 1) { api.toast(api.t('fineLater')); return null }
    const names = api.names()
    const changed = []
    const cells = []
    let raw = []
    try {
      const bin = atob(obj.blocks.data)
      raw = new Uint16Array(bin.length / 2)
      for (let i = 0; i < raw.length; i++) raw[i] = bin.charCodeAt(i * 2) + (bin.charCodeAt(i * 2 + 1) << 8)
    } catch (e) { api.toast(api.t('badBuild')); return null }
    const [w, h, l] = obj.size
    raw.forEach((pi, i) => {
      const name = obj.palette[pi] || 'air'
      let id = names.indexOf(name)
      if (id < 0 && name !== 'air') { changed.push(name + ' → ' + api.t('planks')); id = names.indexOf('planks') }
      const x = i % w, z = Math.floor(i / w) % l, y = Math.floor(i / (w * l))
      cells.push([x, y, z, Math.max(0, id)])
    })
    clip = { origin: [0, 0, 0], size: [w, h, l], cells }
    if (changed.length) api.toast(api.t('changedTo') + ' ' + changed.slice(0, 3).join(', '))
    return clip
  }
  function saveBuild(name) {
    const doc = schemWrite()
    if (!doc) return null
    doc.name = (name || 'Build').slice(0, 48)
    builds.push(doc)
    return doc
  }
  function rewind(mins) {
    return api.rewind ? api.rewind(mins) : null
  }
  function snapMake() { const s = { id: 's' + Date.now(), at: Date.now(), kind: 'now' }; snaps.push(s); return s }
  let pending = null
  function needBox() {
    if (!box()) { api.toast(api.t('tapCorner')); return false }
    return true
  }
  function stage(kind, ops, label) {
    pending = { kind, ops, label, adds: ops.length, removes: 0, inWay: 0 }
    const chip = document.getElementById('size-chip')
    if (chip) { chip.hidden = false; chip.textContent = label }
    return pending
  }
  function act(name, opts = {}) {
    if (name === 'select') {
      const aimed = api.aim && api.aim()
      if (!opts.a && !aimed) { api.toast(api.t('tapCorner')); return null }
      if (!a) { a = opts.a || aimed; api.toast(api.t('cornerA')); return { a } }
      b = opts.b || aimed
      const bx = box()
      if (bx && tooBig(bx)) { api.toast(api.t('tooBig')); a = b = null; return null }
      api.toast(tSize())
      return { a, b }
    }
    if (name === 'fill' || name === 'walls') {
      if (!needBox()) return null
      let id = opts.id || api.current()
      if (api.survival && api.survival() && api.heldBlock) id = api.heldBlock()
      if (api.survival && api.survival() && !id) { api.toast(api.t('pickBlock') || 'Pick a block in your hotbar first'); return null }
      const bx = box()
      if (!bx || tooBig(bx)) { api.toast(api.t('tooBig')); return null }
      const ops = []
      for (let x = bx.x0; x <= bx.x1; x++) for (let y = bx.y0; y <= bx.y1; y++) for (let z = bx.z0; z <= bx.z1; z++) {
        if (name === 'walls' && x !== bx.x0 && x !== bx.x1 && z !== bx.z0 && z !== bx.z1) continue
        if (api.survival() && api.getVoxel(x, y, z) === 21) continue
        ops.push([x, y, z, id])
      }
      return stage(name, ops, name + ' ' + ops.length)
    }
    if (name === 'paste') {
      const origin = api.aim() || [8, 6, 8]
      const ops = []
      if (clip) for (const [x, y, z, id] of clip.cells) ops.push([origin[0] + x, origin[1] + y, origin[2] + z, id])
      return stage('paste', ops, api.t('paste'))
    }
    return stage(name, [], name)
  }
  function confirm() {
    if (!pending) return null
    const ops = pending.ops || []
    if (api.survival && api.survival() && ops.length) {
      const need = {}
      for (const op of ops) need[op[3]] = (need[op[3]] || 0) + 1
      for (const [id, n] of Object.entries(need)) {
        const have = api.have ? api.have(+id) : 0
        if (have < n) {
          api.toast((api.t('needBlocks') || 'Need {n} more {item}').replace('{n}', n - have).replace('{item}', api.blockName(+id)))
          return null
        }
      }
      for (const [id, n] of Object.entries(need)) api.spendBlock(+id, n)
      if (api.noteBag) api.noteBag(need)
    }
    const group = api.apply(ops, pending.kind === 'fill' ? api.t('filled').replace('{n}', String(ops.length)) : pending.label)
    pending = null
    return group
  }
  function cancel() { pending = null; const chip = document.getElementById('size-chip'); if (chip) chip.hidden = true }
  function ghost() { return pending }
  function measure(points) {
    if (!points || points.length < 2) return box() ? { len: 0, area: 0, vol: box().w * box().h * box().l } : null
    const dx = points[1][0] - points[0][0], dy = points[1][1] - points[0][1], dz = points[1][2] - points[0][2]
    const len = Math.round(Math.hypot(dx, dy, dz))
    const area = points.length > 2 ? Math.abs((points[1][0] - points[0][0]) * (points[2][2] - points[0][2])) : 0
    return { len, area, vol: 0 }
  }
  return { select, box, fill, copy, pasteAt, schemWrite, schemRead, saveBuild, builds, snaps, cards, rewind, snapMake, measure, tSize, clip: () => clip, act, confirm, cancel, ghost }
}
