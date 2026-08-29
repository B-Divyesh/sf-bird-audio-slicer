import { resolve } from 'node:path';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { defineConfig } from 'vite';

const root = resolve(import.meta.dirname);

export default defineConfig({
  root,
  publicDir: resolve(root, 'public'),
  build: {
    outDir: resolve(root, '../dist/site'),
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        notFound: resolve(root, '404.html'),
        privacy: resolve(root, 'privacy/index.html'),
        terms: resolve(root, 'terms/index.html')
      }
    },
    copyPublicDir: true
  },
  plugins: [{
    name: 'nightjar-demo-route',
    async closeBundle() {
      const out = resolve(root, '../dist/site');
      const home = await readFile(resolve(out, 'index.html'), 'utf8');
      const demo = home
        .replaceAll('Nightjar Slicer — split long bird recordings', 'Demo — Nightjar Slicer')
        .replace('href="https://bird-audio-slicer.sociobot.in/"', 'href="https://bird-audio-slicer.sociobot.in/demo/"')
        .replace('content="https://bird-audio-slicer.sociobot.in/"', 'content="https://bird-audio-slicer.sociobot.in/demo/"');
      await mkdir(resolve(out, 'demo'), { recursive: true });
      await writeFile(resolve(out, 'demo/index.html'), demo);
    }
  }
  ]
});
