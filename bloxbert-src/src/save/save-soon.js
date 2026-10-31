// Pure scheduler for "save soon" (brief 0056). No DOM, no IndexedDB.
// Every call means "something changed". Calls inside one window share one save, at most one save per
// `gapMs`, and a save never re-runs unless a new change arrived after the last save started.
// run(): does the save, resolves to bytes (>= 0) or -1. onStart / onDone / onFail paint the chip.
export function createSaveSoon(opts) {
  const gapMs = opts.gapMs || 2000
  const now = opts.now || (() => Date.now())
  const setTimer = opts.setTimeout || ((fn, ms) => setTimeout(fn, ms))
  let changeSeq = 0
  let savedSeq = 0
  let timer = null
  let pending = null // { promise, resolve, reject } for the save that is queued but not started
  let running = null // promise of the save in flight
  let lastStart = -Infinity

  function fire() {
    timer = null
    const job = pending
    pending = null
    const seq = changeSeq
    lastStart = now()
    if (opts.onStart) opts.onStart()
    running = Promise.resolve()
      .then(() => opts.run())
      .then((bytes) => {
        running = null
        if (bytes >= 0) {
          savedSeq = seq
          if (opts.onDone) opts.onDone(bytes)
        }
        job.resolve(bytes)
        // Changes that landed while this save ran get their own save after the gap. A failed save is not retried on its own.
        if (pending) schedule()
        return bytes
      }, (e) => {
        running = null
        if (opts.onFail) opts.onFail(e)
        job.resolve(-1)
        if (pending) schedule()
      })
  }

  function schedule() {
    if (!pending) {
      let resolve
      let reject
      const promise = new Promise((res, rej) => { resolve = res; reject = rej })
      pending = { promise, resolve, reject }
    }
    if (timer || running) return pending.promise
    const wait = Math.max(0, gapMs - (now() - lastStart))
    timer = setTimer(fire, wait)
    return pending.promise
  }

  return {
    // Something changed: save after the gap. Returns the shared promise for that save.
    note() {
      changeSeq += 1
      return schedule()
    },
    // Nothing new since the last save: resolve at once, no save, no chip.
    dirty() { return changeSeq !== savedSeq },
    // After a save that ran elsewhere (the manual Save button, the 20 s sweep) with everything current.
    markSaved() { savedSeq = changeSeq },
    busy: () => !!(pending || running || timer),
  }
}
