// EXAMPLE DATA ONLY. Made-up aliases, crews, and projects for the box prototype.
// No real students. Aliases follow the Hub Alias Pass shape (alias + 5-char code, no names).
window.CD_DATA = {
  classes: ['6 · Period 2', '7 · Period 4', '8 · Period 6'],
  crews: ['Crew Volt', 'Crew Tide', 'Crew Gear', 'Crew Orbit', 'Crew Kelp', 'Crew Flux'],
  apps: {
    djberty: { name: 'DJ Berty', kind: 'beat' },
    blocks: { name: 'Block Builder', kind: 'voxel' },
    bertycad: { name: 'BertyCAD', kind: 'cad' },
    baboo: { name: 'Baboo', kind: 'plan' },
    workshop: { name: 'Workshop', kind: 'photo' },
  },
  contests: [
    { id: 'c1', title: 'Rainy-day beat', app: 'djberty', theme: 'A beat that sounds like rain on the shop roof. 90–100 bpm.', ends: '+2d', status: 'voting' },
    { id: 'c2', title: 'Bridge over the gap', app: 'blocks', theme: 'Build a bridge that crosses a 12-block gap. 25 minutes.', ends: '+25m', status: 'open' },
    { id: 'c3', title: 'Best birdhouse', app: 'workshop', theme: 'Workshop: a birdhouse from one pine board.', ends: 'closed', status: 'closed' },
  ],
  posts: [
    { id: 'p1', app: 'djberty', title: 'Night Bus', alias: 'TealOwl', code: 'TEALO-K7', crew: 'Crew Tide', cls: 1, likes: 14, votes: 0, contest: null, chain: [], desc: 'Lo-fi loop, 84 bpm. Soft kick, hats on the off-beat.', h: 220, seed: 3 },
    { id: 'p2', app: 'djberty', title: 'Night Bus (rain mix)', alias: 'NovaFox', code: 'NOVAF-2M', crew: 'Crew Volt', cls: 1, likes: 9, votes: 11, contest: 'c1', chain: ['p1'], desc: 'Kept the chords, added a shaker that sounds like rain.', h: 180, seed: 7 },
    { id: 'p3', app: 'djberty', title: 'Night Bus (march)', alias: 'Quartz88', code: 'QUART-9P', crew: 'Crew Gear', cls: 1, likes: 6, votes: 4, contest: 'c1', chain: ['p1', 'p2'], desc: 'Remixed the rain mix into a marching snare pattern.', h: 200, seed: 11 },
    { id: 'p4', app: 'blocks', title: 'Cable bridge', alias: 'PixelMoss', code: 'PIXEL-4R', crew: 'Crew Orbit', cls: 2, likes: 21, votes: 0, contest: 'c2', chain: [], desc: 'Two towers and a deck made of planks. 412 blocks.', h: 260, seed: 5 },
    { id: 'p5', app: 'bertycad', title: 'Phone stand v3', alias: 'ByteHeron', code: 'BYTEH-7Q', crew: 'Crew Kelp', cls: 3, likes: 17, votes: 0, contest: null, chain: [], desc: '15° lean, cable slot, printed on the Bambu in PLA.', h: 240, seed: 2 },
    { id: 'p6', app: 'workshop', title: 'Pine birdhouse', alias: 'CedarJet', code: 'CEDAR-3H', crew: 'Crew Gear', cls: 2, likes: 25, votes: 18, contest: 'c3', chain: [], desc: 'Cut from one 1x6 pine board. Hinged roof so it can be cleaned.', tool: 'Miter saw', material: 'Pine 1x6', h: 300, seed: 4 },
    { id: 'p7', app: 'baboo', title: 'Ranch with a loft', alias: 'NovaFox', code: 'NOVAF-2M', crew: 'Crew Volt', cls: 1, likes: 8, votes: 0, contest: null, chain: [], desc: 'Open kitchen, loft over the garage.', h: 210, seed: 9 },
    { id: 'p8', app: 'blocks', title: 'Cable bridge + lights', alias: 'Ripple3', code: 'RIPPL-8D', crew: 'Crew Flux', cls: 2, likes: 12, votes: 0, contest: null, chain: ['p4'], desc: 'Remix: glass lamps along the deck and a ramp at each end.', h: 190, seed: 13 },
    { id: 'p9', app: 'workshop', title: 'Wave keychain', alias: 'ByteHeron', code: 'BYTEH-7Q', crew: 'Crew Kelp', cls: 3, likes: 10, votes: 0, contest: null, chain: [], desc: 'A wave pattern keychain. Two passes on 3 mm birch.', tool: 'Laser cutter', material: 'Birch ply 3 mm', h: 230, seed: 6 },
    { id: 'p10', app: 'djberty', title: 'Shop Floor Stomp', alias: 'GearLynx', code: 'GEARL-5T', crew: 'Crew Gear', cls: 3, likes: 19, votes: 7, contest: 'c1', chain: [], desc: 'Trap beat, 140 bpm, 808 slides in A minor.', h: 170, seed: 8 },
    { id: 'p11', app: 'bertycad', title: 'Phone stand v3 (tablet)', alias: 'Quartz88', code: 'QUART-9P', crew: 'Crew Gear', cls: 1, likes: 5, votes: 0, contest: null, chain: ['p5'], desc: 'Remix: wider base and a deeper lip for a tablet.', h: 200, seed: 12 },
    { id: 'p12', app: 'workshop', title: 'Catapult, round 2', alias: 'TealOwl', code: 'TEALO-K7', crew: 'Crew Tide', cls: 1, likes: 13, votes: 0, contest: null, chain: [], desc: 'Shorter arm, rubber-band tension. Hit the 3 m mark 4 of 5 times.', tool: 'Drill press', material: 'Poplar + rubber bands', h: 280, seed: 10 },
    { id: 'p13', app: 'blocks', title: 'Tide pool lab', alias: 'Kelpie', code: 'KELPI-6W', crew: 'Crew Kelp', cls: 3, likes: 7, votes: 0, contest: null, chain: [], desc: 'Survival build: glass roof, sand floor, ice pools.', h: 240, seed: 14 },
    { id: 'p14', app: 'baboo', title: 'Ranch with a loft, 2 baths', alias: 'Ripple3', code: 'RIPPL-8D', crew: 'Crew Flux', cls: 2, likes: 4, votes: 0, contest: null, chain: ['p7'], desc: 'Remix: moved the stairs, added a second bathroom.', h: 180, seed: 15 },
  ],
  pending: [
    { id: 'q1', app: 'workshop', title: 'Step stool', alias: 'OrbitAce', code: 'ORBIT-1B', crew: 'Crew Orbit', cls: 2, desc: 'Two steps, pocket screws, sanded to 220.', tool: 'Pocket-hole jig', material: 'Pine 1x8', h: 250, seed: 16, flags: ['Check the photo for faces or name tags'] },
    { id: 'q2', app: 'djberty', title: 'Night Bus (drill remix)', alias: 'FluxBee', code: 'FLUXB-3C', crew: 'Crew Flux', cls: 1, desc: 'Remix of the rain mix with a drill-style hat roll.', chain: ['p1', 'p2'], h: 190, seed: 17, flags: [] },
    { id: 'q3', app: 'blocks', title: 'Bridge over the gap', alias: 'PixelMoss', code: 'PIXEL-4R', crew: 'Crew Orbit', cls: 2, desc: 'Contest entry. Arch bridge, 18 blocks wide.', contest: 'c2', h: 220, seed: 18, flags: [] },
  ],
}
