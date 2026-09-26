// Ten truss-bridge jobs, then a free design. Joints are pre-placed on the path.
// The kid stretches members. Meters are the classroom span, not a pixel count.
// parMembers is the intended build. Stars compare steel length to that set.

const BAY = 110;

function warren(n, seedBottom, kind) {
  const joints = [];
  for (let i = 0; i <= n; i++) {
    const pier = kind === "pier" && i === Math.floor(n / 2);
    joints.push({ x: i * BAY, y: 240, fixed: i === 0 || i === n || pier });
  }
  for (let i = 0; i < n; i++) {
    let rise = 90;
    if (kind === "arch") {
      const t = (i + 0.5) / n;
      rise = 50 + Math.sin(Math.PI * t) * 80;
    }
    joints.push({ x: i * BAY + BAY / 2, y: 240 - rise, fixed: false });
  }
  const seed = [];
  if (seedBottom) {
    for (let i = 0; i < n; i++) seed.push({ a: i, b: i + 1 });
  }
  return { joints, seed, loadIndex: Math.floor(n / 2) };
}

function triangles(n) {
  const members = [];
  for (let i = 0; i < n; i++) members.push({ a: i, b: i + 1 });
  for (let i = 0; i < n; i++) {
    members.push({ a: i, b: n + 1 + i });
    members.push({ a: i + 1, b: n + 1 + i });
  }
  return members;
}

function fullWarren(n) {
  return triangles(n);
}

export { fullWarren, triangles };

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
    parMembers: [
      { a: 0, b: 2 },
      { a: 1, b: 2 },
      { a: 0, b: 1 },
    ],
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
    parMembers: [
      { a: 0, b: 3 },
      { a: 3, b: 2 },
      { a: 0, b: 1 },
      { a: 1, b: 2 },
      { a: 3, b: 1 },
    ],
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
    parMembers: [
      { a: 0, b: 2 },
      { a: 1, b: 3 },
      { a: 2, b: 3 },
      { a: 0, b: 3 },
    ],
  },
  {
    n: 4, id: "two", band: "Shapes", name: "Two bays",
    job: "32 m. Two bays. The deck is in. Triangle each bay.",
    spanM: 32, budget: 8, sagLimit: 16, leanLimit: 24,
    ...(() => {
      const w = warren(2, true);
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(2) };
    })(),
  },
  {
    n: 5, id: "stops", band: "Spans", name: "Stops",
    job: "40 m. The truck stops in every bay. Triangle each one.",
    spanM: 40, budget: 11, sagLimit: 22, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(3, true);
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(3) };
    })(),
  },
  {
    n: 6, id: "endbay", band: "Spans", name: "End bay",
    job: "48 m. A missing end bay folds when the truck stops there.",
    spanM: 48, budget: 14, sagLimit: 30, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(4, true);
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(4) };
    })(),
  },
  {
    n: 7, id: "tight", band: "Materials", name: "Budget",
    job: "40 m. Extra bars miss Budget. The truck still stops in every bay.",
    spanM: 40, budget: 9, onBudget: true, sagLimit: 22, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(3, false);
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(3) };
    })(),
  },
  {
    n: 8, id: "arch", band: "Big", name: "Arch",
    job: "48 m. The road stays flat. The top is higher in the middle. Triangle every bay.",
    spanM: 48, budget: 14, sagLimit: 30, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(4, true, "arch");
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(4) };
    })(),
  },
  {
    n: 9, id: "pier", band: "Big", name: "Pier",
    job: "48 m. The pier holds the middle. Triangle both sides.",
    spanM: 48, budget: 14, sagLimit: 24, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(4, true, "pier");
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(4) };
    })(),
  },
  {
    n: 10, id: "spare", band: "Big", name: "Efficient",
    job: "48 m. Hold every bay and stay on Budget.",
    spanM: 48, budget: 12, onBudget: true, sagLimit: 30, leanLimit: 28, roll: true,
    ...(() => {
      const w = warren(4, false);
      return { joints: w.joints, seed: w.seed, loadIndex: 1, parMembers: triangles(4) };
    })(),
  },
];

export const SPAN_FREE = {
  n: 0, id: "yours", band: "Yours", name: "Your truss",
  job: "Your truss across 40 m. The truck stops in every bay.",
  spanM: 40, budget: 12, sagLimit: 22, leanLimit: 28, free: true, roll: true,
  par: 116.7,
  ...(() => {
    const w = warren(3, false);
    return { slots: w.joints, joints: w.joints.filter((j) => j.fixed), seed: [], loadIndex: 1 };
  })(),
};
