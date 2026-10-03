// One edit path. Place, Break, Undo and Redo all write through applyEdit.
// Groups over 20k voxels skip per-block draws and invalidate the box once.
export function createEdits({ getVoxel, setVoxel, invalidate }) {
  const undoStack = []
  const redoStack = []
  const MAX_GROUPS = 200
  const MAX_BYTES = 5 * 1024 * 1024
  let onChange = () => {}

  function bytes(stack) {
    let n = 0
    for (const g of stack) n += g.xyz.byteLength + g.before.byteLength + g.after.byteLength
    return n
  }
  function trim() {
    while (undoStack.length > MAX_GROUPS || (undoStack.length && bytes(undoStack) + bytes(redoStack) > MAX_BYTES)) undoStack.shift()
  }
  function applyEdit(ops, meta = {}) {
    const source = meta.source || 'hand'
    const label = meta.label || source
    const xs = [], ys = [], zs = [], before = [], after = []
    for (const op of ops) {
      const x = op[0] | 0, y = op[1] | 0, z = op[2] | 0, v = op[3] | 0
      const was = getVoxel(x, y, z)
      if (was === v) continue
      xs.push(x); ys.push(y); zs.push(z); before.push(was); after.push(v)
    }
    const n = xs.length
    if (!n) return null
    const big = n > 20000
    let minX = xs[0], minY = ys[0], minZ = zs[0], maxX = xs[0], maxY = ys[0], maxZ = zs[0]
    for (let i = 0; i < n; i++) {
      setVoxel(xs[i], ys[i], zs[i], after[i], !big)
      if (xs[i] < minX) minX = xs[i]; if (xs[i] > maxX) maxX = xs[i]
      if (ys[i] < minY) minY = ys[i]; if (ys[i] > maxY) maxY = ys[i]
      if (zs[i] < minZ) minZ = zs[i]; if (zs[i] > maxZ) maxZ = zs[i]
    }
    if (big) invalidate({ base: [minX, minY, minZ], max: [maxX + 1, maxY + 1, maxZ + 1] })
    const xyz = new Int32Array(n * 3)
    for (let i = 0; i < n; i++) { xyz[i * 3] = xs[i]; xyz[i * 3 + 1] = ys[i]; xyz[i * 3 + 2] = zs[i] }
    const group = { label, source, at: Date.now(), n, xyz, before: Uint16Array.from(before), after: Uint16Array.from(after) }
    if (source === 'hand' || source === 'test') {
      undoStack.push(group)
      redoStack.length = 0
      trim()
    }
    onChange()
    return group
  }
  function writeGroup(group, which) {
    const ops = []
    const arr = which === 'before' ? group.before : group.after
    for (let i = group.n - 1; i >= 0; i--) ops.push([group.xyz[i * 3], group.xyz[i * 3 + 1], group.xyz[i * 3 + 2], arr[i]])
    return applyEdit(ops, { source: which === 'before' ? 'undo' : 'redo', label: group.label })
  }
  function undo() {
    const group = undoStack.pop()
    if (!group) return null
    const applied = writeGroup(group, 'before')
    redoStack.push(group)
    onChange()
    return applied || group
  }
  function redo() {
    const group = redoStack.pop()
    if (!group) return null
    const applied = writeGroup(group, 'after')
    undoStack.push(group)
    trim()
    onChange()
    return applied || group
  }
  function clear() {
    undoStack.length = 0
    redoStack.length = 0
    onChange()
  }
  return {
    applyEdit, undo, redo, clear,
    get canUndo() { return undoStack.length > 0 },
    get canRedo() { return redoStack.length > 0 },
    set onChange(fn) { onChange = fn },
  }
}
