// Ten truss-tower jobs, then a free design. Height is meters of rise.

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

function tower(stories, seedDiags) {
  return {
    joints: storyJoints(stories),
    seed: storySeed(stories, seedDiags),
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
  },
  {
    n: 3, id: "two", band: "Towers", name: "Two stories",
    job: "12 m. Triangles on both stories.",
    budget: 10, sagLimit: 18, leanLimit: 30,
    ...tower(2, false),
  },
  {
    n: 4, id: "three", band: "Towers", name: "Three stories",
    job: "18 m. A story is a triangle, then the next one.",
    budget: 14, sagLimit: 18, leanLimit: 32,
    ...tower(3, false),
  },
  {
    n: 5, id: "brace", band: "Shapes", name: "Braced",
    job: "18 m. The posts are in. Add a diagonal on every story.",
    budget: 14, sagLimit: 18, leanLimit: 32,
    ...tower(3, false),
    seed: storySeed(3, false),
  },
  {
    n: 6, id: "tall", band: "Towers", name: "Taller",
    job: "24 m. Four stories. Triangles all the way up.",
    budget: 18, sagLimit: 20, leanLimit: 34,
    ...tower(4, false),
  },
  {
    n: 7, id: "budget", band: "Materials", name: "Budget",
    job: "18 m. Stand to the goal. Use no more members than Budget.",
    budget: 12, onBudget: true, sagLimit: 18, leanLimit: 32,
    ...tower(3, false),
  },
  {
    n: 8, id: "push", band: "Big", name: "Side push",
    job: "24 m. The test pushes sideways. Diagonals keep the tower from leaning.",
    budget: 18, sagLimit: 20, leanLimit: 34, nudge: 0.0014,
    ...tower(4, false),
  },
  {
    n: 9, id: "thirty", band: "Big", name: "30 m",
    job: "30 m. Five stories. The top load has to stay up.",
    budget: 22, sagLimit: 22, leanLimit: 36,
    ...tower(5, false),
  },
  {
    n: 10, id: "efficient", band: "Big", name: "Efficient",
    job: "24 m. Hit the height and stay on Budget.",
    budget: 16, onBudget: true, sagLimit: 20, leanLimit: 34,
    ...tower(4, false),
  },
];

export const SPIRE_FREE = {
  n: 0, id: "yours", band: "Yours", name: "Your truss",
  job: "Your tower. Reach 18 m. Test pushes from both sides.",
  goalM: 18, budget: 16, sagLimit: 20, leanLimit: 36, free: true, nudge: 0.0011,
  slots: storyJoints(4),
  joints: storyJoints(4).filter((j) => j.fixed),
  seed: [],
  loadIndex: 0,
};
