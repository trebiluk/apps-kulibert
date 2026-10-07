/* Running Alice for the loading bar. paint-art.mjs copies these into the atlas. */
export const RUN = [
  [
    "................",
    "................",
    ".....KKKKK......",
    "....KFFFFFK.....",
    "....KFEFFFK.....",
    "...KKFFFFFFK....",
    "....KFFNNFFK....",
    ".....KKPPKK.....",
    "......K..K......",
    ".....K....K.....",
    "....K......K....",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  [
    "................",
    "....K...........",
    ".....KKKKK......",
    "....KFFFFFK.....",
    "....KFEFFFK.....",
    "...KKFFFFFFK....",
    "....KFFNNFFK....",
    ".....KKPPKK.....",
    ".....KK..KK.....",
    "....K......K....",
    "...K........K...",
    "................",
    "................",
    "................",
    "................",
    "................",
  ],
  [
    "................",
    "................",
    ".....KKKKK......",
    "....KFFFFFK.....",
    "....KFEFFFK.....",
    "...KKFFFFFFK....",
    "....KFFNNFFK....",
    ".....KKPPKK.....",
    "......KKKK......",
    ".....K....K.....",
    "....K......K....",
    "...K............",
    "................",
    "................",
    "................",
    "................",
  ],
];

const INK = {
  K: "#1c140f",
  F: "#e6b57a",
  E: "#1b1b22",
  N: "#e25b78",
  P: "#C04BD8",
};

export function paintRun(ctx) {
  const w = 16;
  RUN.forEach((rows, i) => {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const color = INK[row[x]];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(i * w + x, y, 1, 1);
      }
    });
  });
}
