import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

export default defineConfig({
  root: ROOT,
  base: '/alice/',
  logLevel: 'warn',
  resolve: {
    alias: {
      phaser: path.resolve(ROOT, 'src/phaser-shim.js'),
    },
  },
  plugins: [
    {
      name: 'rex-phaser-global',
      transform(code, id) {
        if (id.includes('phaser3-rex-plugins') && !code.includes('const Phaser = window.Phaser')) {
          return `const Phaser = window.Phaser;\n${code}`;
        }
      },
    },
  ],
  build: {
    outDir: path.resolve(ROOT, '../alice'),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: { compress: { passes: 2 }, format: { comments: false } },
    rollupOptions: {
      output: { manualChunks: undefined },
    },
  },
});
