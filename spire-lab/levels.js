// Ten truss-tower jobs, then a free design. Height is meters of connected rise.
// parMembers is one diagonal per story. A second diagonal is extra steel.

function storyJoints(stories) {
  const joints = [];
  for (let s = 0; s <= stories; s++) {
    const w = Math.max(36, 80 - s * 10);
    const y = 400 - s * 90;
    joints.push({ x: 160 - w, y, fixed: s === 0 });
    joints.push({ x: 160 + w, y, fixed: s === 0 });
  }
  return joints;
}

function storySeed(stories, withDiag) {
  const seed = [];
  for (let s = 0; s < stories; s++) {
    const a = s * 2;
    const b = s * 2 + 1;
    const c = (s + 1) * 2;
    const d = (s + 1) * 2 + 1;
    seed.push({ a, b: c }, { a: b, b: d }, { a: c, b: d });
    if (withDiag) seed.push({ a, b: d });
  }
  return seed;
}

function postsOnly(stories) {
  const seed = [];
  for (let s = 0; s < stories; s++) {
    const a = s * 2;
    const b = s * 2 + 1;
    const c = (s + 1) * 2;
    const d = (s + 1) * 2 + 1;
    seed.push({ a, b: c }, { a: b, b: d });
  }
  return seed;
}

function tower(stories) {
  return {
    joints: storyJoints(stories),
    loadIndex: stories * 2,
    goalM: stories * 6,
  };
}

export const SPIRE_LEVELS = [
  {
    n: 1, id: "tri", band: "Forces", name: "Triangle",
    job: "6 m. Stretch two members up to the top joint. A triangle stands.",
    goalM: 6, budget: 3, sagLimit: 16, leanLimit: 28,
    joints: [
      { x: 80, y: 300, fixed: true },
      { x: 200, y: 300, fixed: true },
      { x: 140, y: 210, fixed: false },
    ],
    seed: [],
    loadIndex: 2,
    parMembers: [
      { a: 0, b: 2 },
      { a: 1, b: 2 },
      { a: 0, b: 1 },
    ],
  },
  {
    n: 2, id: "diag", band: "Shapes", name: "Diagonal",
    job: "A square story folds. Stretch one diagonal.",
    goalM: 6, budget: 5, sagLimit: 16, leanLimit: 30,
    joints: [
      { x: 70, y: 320, fixed: true },
      { x: 190, y: 320, fixed: true },
      { x: 70, y: 210, fixed: false },
      { x: 190, y: 210, fixed: false },
    ],
    seed: [
      { a: 0, b: 2 },
      { a: 1, b: 3 },
      { a: 2, b: 3 },
    ],
    loadIndex: 2,
    parMembers: [
      { a: 0, b: 2 },
      { a: 1, b: 3 },
      { a: 2, b: 3 },
      { a: 0, b: 3 },
    ],
  },
  {
    n: 3, id: "stack", band: "Towers", name: "Two stories",
    job: "12 m. Nothing is built yet. Triangle both stories.",
    budget: 10, sagLimit: 18, leanLimit: 30,
    ...(() => {
      const t = tower(2);
      return { joints: t.joints, seed: [], loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(2, true) };
    })(),
  },
  {
    n: 4, id: "add", band: "Towers", name: "Three stories",
    job: "18 m. The first story stands. Add two more.",
    budget: 14, sagLimit: 18, leanLimit: 32,
    ...(() => {
      const t = tower(3);
      return { joints: t.joints, seed: storySeed(1, true), loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(3, true) };
    })(),
  },
  {
    n: 5, id: "cross", band: "Shapes", name: "Braced",
    job: "18 m. Floors are in. Add one diagonal on each story. The test pushes the top.",
    budget: 14, sagLimit: 18, leanLimit: 32, gust: true,
    ...(() => {
      const t = tower(3);
      return { joints: t.joints, seed: storySeed(3, false), loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(3, true) };
    })(),
  },
  {
    n: 6, id: "floors", band: "Towers", name: "Taller",
    job: "24 m. Posts are in. Add a floor and one diagonal on each story. The test pushes the top.",
    budget: 18, sagLimit: 20, leanLimit: 34, gust: true,
    ...(() => {
      const t = tower(4);
      return { joints: t.joints, seed: postsOnly(4), loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(4, true) };
    })(),
  },
  {
    n: 7, id: "limit", band: "Materials", name: "Budget",
    job: "18 m. One diagonal on each story. A second one misses Budget.",
    budget: 12, onBudget: true, sagLimit: 18, leanLimit: 32, gust: true,
    ...(() => {
      const t = tower(3);
      return { joints: t.joints, seed: [], loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(3, true) };
    })(),
  },
  {
    n: 8, id: "shove", band: "Big", name: "Side push",
    job: "24 m. A harder push at the top. One diagonal on each story.",
    budget: 18, sagLimit: 20, leanLimit: 34, gust: true, nudge: 0.0022,
    ...(() => {
      const t = tower(4);
      return { joints: t.joints, seed: storySeed(4, false), loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(4, true) };
    })(),
  },
  {
    n: 9, id: "climb", band: "Big", name: "30 m",
    job: "30 m. Two stories are braced. Finish the tower. The test pushes the top.",
    budget: 22, sagLimit: 22, leanLimit: 36, gust: true,
    ...(() => {
      const t = tower(5);
      return { joints: t.joints, seed: storySeed(2, true), loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(5, true) };
    })(),
  },
  {
    n: 10, id: "spare", band: "Big", name: "Efficient",
    job: "24 m. Hit the height and stay on Budget. The test pushes the top.",
    budget: 16, onBudget: true, sagLimit: 20, leanLimit: 34, gust: true,
    ...(() => {
      const t = tower(4);
      return { joints: t.joints, seed: [], loadIndex: t.loadIndex, goalM: t.goalM, parMembers: storySeed(4, true) };
    })(),
  },
];

export const SPIRE_FREE = {
  n: 0, id: "yours", band: "Yours", name: "Your truss",
  job: "Your tower. Reach 18 m. The test pushes the top from both sides.",
  goalM: 18, budget: 16, sagLimit: 20, leanLimit: 36, free: true, gust: true, nudge: 0.0011,
  par: 117.8,
  slots: storyJoints(4),
  joints: storyJoints(4).filter((j) => j.fixed),
  seed: [],
  loadIndex: 0,
};
