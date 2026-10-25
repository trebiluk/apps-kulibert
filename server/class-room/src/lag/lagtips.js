// Lag Coach, part 3: the lesson. Each tip says WHY the build is slow (a general rule a kid can reuse),
// then gives several ways to fix it, with honest trade-offs. There is no single "right" way: `best` says
// which option is best for each goal (keep the look / most speed / least work), and `keep` is always there.
// Text is string ids; the English source text is in en.js (translate to uk, ru, es, ar, fa-AF, rw, ti + Simple).
const T = (why, opts, best) => ({ why, options: opts, best, keep: 'lag.keep' })
const O = (id, gain, look, effort) => ({ id, gain, look, effort })   // gain: small|medium|big  look: same|changes  effort: low|medium|high

export const TIPS = {
  light: T('lag.light.why', [O('lag.light.o1', 'medium', 'changes', 'low'), O('lag.light.o2', 'big', 'same', 'medium'), O('lag.light.o3', 'medium', 'same', 'high')],
    { look: 'lag.light.o2', speed: 'lag.light.o2', effort: 'lag.light.o1' }),
  belt: T('lag.belt.why', [O('lag.belt.o1', 'medium', 'changes', 'low'), O('lag.belt.o2', 'big', 'same', 'medium'), O('lag.belt.o3', 'medium', 'same', 'low')],
    { look: 'lag.belt.o3', speed: 'lag.belt.o2', effort: 'lag.belt.o3' }),
  circuit: T('lag.circuit.why', [O('lag.circuit.o1', 'big', 'same', 'low'), O('lag.circuit.o2', 'big', 'same', 'high'), O('lag.circuit.o3', 'medium', 'changes', 'medium')],
    { look: 'lag.circuit.o1', speed: 'lag.circuit.o2', effort: 'lag.circuit.o1' }),
  liquid: T('lag.liquid.why', [O('lag.liquid.o1', 'big', 'same', 'medium'), O('lag.liquid.o2', 'big', 'changes', 'low'), O('lag.liquid.o3', 'medium', 'same', 'low')],
    { look: 'lag.liquid.o1', speed: 'lag.liquid.o2', effort: 'lag.liquid.o2' }),
  entity: T('lag.entity.why', [O('lag.entity.o1', 'big', 'changes', 'low'), O('lag.entity.o2', 'medium', 'same', 'medium'), O('lag.entity.o3', 'medium', 'same', 'low')],
    { look: 'lag.entity.o3', speed: 'lag.entity.o1', effort: 'lag.entity.o3' }),
  spawner: T('lag.spawner.why', [O('lag.spawner.o1', 'big', 'changes', 'low'), O('lag.spawner.o2', 'big', 'same', 'medium'), O('lag.spawner.o3', 'medium', 'same', 'low')],
    { look: 'lag.spawner.o3', speed: 'lag.spawner.o1', effort: 'lag.spawner.o1' }),
  animated: T('lag.animated.why', [O('lag.animated.o1', 'medium', 'same', 'low'), O('lag.animated.o2', 'big', 'changes', 'medium'), O('lag.animated.o3', 'medium', 'same', 'medium')],
    { look: 'lag.animated.o1', speed: 'lag.animated.o2', effort: 'lag.animated.o1' }),
}

export const tipFor = (cls) => (Object.hasOwn(TIPS, cls) ? { cls, ...TIPS[cls] } : null)
