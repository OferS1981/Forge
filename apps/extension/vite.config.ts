import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The side panel and the service worker. Both are modules, so they build together.
 *
 * Section 14 says Vite plus `@crxjs/vite-plugin`. This is Vite without it: the plugin's job is
 * manifest rewriting and hot reload, and the manifest here is generated from the catalogue by a
 * function that is unit tested, which is better than either. Two small configs and one script
 * replace a long-running beta dependency in the build path. `PORT-NOTES.md` records the swap.
 */

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: fileURLToPath(new URL('./panel.html', import.meta.url)),
        'service-worker': fileURLToPath(new URL('./src/service-worker.ts', import.meta.url)),
      },
      output: {
        // A service worker is named in the manifest, so its file name cannot be hashed.
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
