// Ten truss-bridge jobs, then a free design. Joints are pre-placed on the path.
// The kid stretches members. Meters are the classroom span, not a pixel count.

const BAY = 110;

function warren(n, seedBottom) {
  const joints = [];
  for (let i = 0; i <= n; i++) {
    joints.push({ x: i * BAY, y: 240, fixed: i === 0 || i === n });
  }
  for (let i = 0; i < n; i++) joints.push({ x: i * BAY + BAY / 2, y: 150, fixed: false });
  const seed = [];
  if (seedBottom) {
    for (let i = 0; i < n; i++) seed.push({ a: i, b: i + 1 });
  }
  return { joints, seed, loadIndex: Math.floor(n / 2), members: n + n * 2 };
}

function fullWarren(n) {
  const built = warren(n, false);
  const members = [];
  for (let i = 0; i < n; i++) members.push({ a: i, b: i + 1 });
  for (let i = 0; i < n; i++) {
    members.push({ a: i, b: n + 1 + i });
    members.push({ a: i + 1, b: n + 1 + i });
  }
  return members;
}

export { fullWarren };

export const SPAN_LEVELS = [
  {
    n: 1, id: "tri", band: "Forces", name: "Triangle",
    job: "24 m. Stretch two members up to the top joint. A triangle holds the truck.",
    spanM: 24, budget: 3, sagLimit: 16, leanLimit: 28,
    joints: [
      { x: 0, y: 220, fixed: true },
      { x: 220, y: 220, fixed: true },
      { x: 110, y: 110, fixed: false },
    ],
    seed: [],
    loadIndex: 2,
  },
  {
    n: 2, id: "deck", band: "Forces", name: "Deck",
    job: "24 m. The truck sits on the middle. Stretch the deck, then a member down from the peak.",
    spanM: 24, budget: 6, sagLimit: 10, leanLimit: 24,
    joints: [
      { x: 0, y: 220, fixed: true },
      { x: 140, y: 220, fixed: false },
      { x: 280, y: 220, fixed: true },
      { x: 140, y: 110, fixed: false },
    ],
    seed: [
      { a: 0, b: 3 },
      { a: 3, b: 2 },
    ],
    loadIndex: 1,
  },
  {
    n: 3, id: "diag", band: "Shapes", name: "Diagonal",
    job: "A square folds. Stretch one diagonal so it becomes a triangle.",
    spanM: 24, budget: 5, sagLimit: 16, leanLimit: 28,
    joints: [
      { x: 0, y: 230, fixed: true },
      { x: 160, y: 230, fixed: true },
      { x: 0, y: 100, fixed: false },
      { x: 160, y: 100, fixed: false },
    ],
    seed: [
      { a: 0, b: 2 },
      { a: 1, b: 3 },
      { a: 2, b: 3 },
    ],
    loadIndex: 2,
  },
  {
    n: 4, id: "two", band: "Shapes", name: "Two bays",
    job: "32 m. The deck is in. Add triangles across the gap.",
    spanM: 32, budget: 8, sagLimit: 16, leanLimit: 24,
    ...(() => {
      const w = warren(2, true);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 5, id: "across", band: "Spans", name: "Across",
    job: "40 m. Triangles all the way from bank to bank.",
    spanM: 40, budget: 11, sagLimit: 22, leanLimit: 28,
    ...(() => {
      const w = warren(3, true);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 6, id: "long", band: "Spans", name: "Long span",
    job: "48 m. Keep the triangles going. A long deck still needs them.",
    spanM: 48, budget: 14, sagLimit: 30, leanLimit: 28,
    ...(() => {
      const w = warren(4, true);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 7, id: "budget", band: "Materials", name: "Budget",
    job: "40 m. Hold the truck. Use no more members than Budget.",
    spanM: 40, budget: 9, onBudget: true, sagLimit: 22, leanLimit: 28,
    ...(() => {
      const w = warren(3, false);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 8, id: "wide", band: "Big", name: "Wider",
    job: "48 m. A wider span. Triangles, then stay near Budget.",
    spanM: 48, budget: 14, sagLimit: 30, leanLimit: 28,
    ...(() => {
      const w = warren(4, true);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 9, id: "fifty", band: "Big", name: "Longer",
    job: "56 m. Bank to bank. The truck has to stay up.",
    spanM: 56, budget: 17, sagLimit: 36, leanLimit: 30,
    ...(() => {
      const w = warren(5, true);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
  {
    n: 10, id: "efficient", band: "Big", name: "Efficient",
    job: "48 m. Hold the truck and stay on Budget.",
    spanM: 48, budget: 12, onBudget: true, sagLimit: 30, leanLimit: 28,
    ...(() => {
      const w = warren(4, false);
      return { joints: w.joints, seed: w.seed, loadIndex: w.loadIndex };
    })(),
  },
];

export const SPAN_FREE = {
  n: 0, id: "yours", band: "Yours", name: "Your truss",
  job: "Your truss across 40 m. Test tries the truck at three joints.",
  spanM: 40, budget: 12, sagLimit: 22, leanLimit: 28, free: true,
  ...(() => {
    const w = warren(3, false);
    return { slots: w.joints, joints: w.joints.filter((j) => j.fixed), seed: [], loadIndex: 1 };
  })(),
};
