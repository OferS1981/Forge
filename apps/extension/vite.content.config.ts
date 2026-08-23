import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

/**
 * The content script, on its own, because a manifest v3 content script is a classic script and
 * cannot be a module. One file, no imports at run time, dropped into the same dist without
 * emptying it.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: false,
    lib: {
      entry: fileURLToPath(new URL('./src/content.ts', import.meta.url)),
      formats: ['iife'],
      name: 'ForgeContent',
      fileName: () => 'content.js',
    },
  },
});
