// Which 30-kid room of a world does a kid join? Fill rooms in order, keep a group (class) together
// when there is space, send a returning kid back to the room they had. Rooms are opaque ids:
// `${world}-r${n}`. Nobody is ever moved once seated.
export function makeAlloc(world, { cap = 30, maxRooms = 12 } = {}) {
  const rooms = []                 // index -> Set(ref)
  const seat = new Map()           // ref -> room index (while connected)
  const memo = new Map()           // ref -> last room index (reconnects)
  const grp = new Map()            // group id -> room index
  const idOf = (i) => `${world}-r${i + 1}`
  const room = (i) => rooms[i] || (rooms[i] = new Set())
  const free = (i) => i !== undefined && i < maxRooms && room(i).size < cap

  return {
    idOf,
    assign(ref, group) {
      if (seat.has(ref)) return idOf(seat.get(ref))
      let i = [memo.get(ref), group === undefined ? undefined : grp.get(group)].find(free)
      if (i === undefined) for (let k = 0; k < maxRooms; k++) if (free(k)) { i = k; break }
      if (i === undefined) return null                       // world full
      room(i).add(ref); seat.set(ref, i); memo.set(ref, i)
      if (group !== undefined) grp.set(group, i)
      if (memo.size > 5000) memo.delete(memo.keys().next().value)
      return idOf(i)
    },
    leave(ref) {
      const i = seat.get(ref)
      if (i === undefined) return
      room(i).delete(ref); seat.delete(ref)
    },
    counts: () => rooms.map((r) => r.size),
  }
}
