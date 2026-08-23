import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/**
 * The gallery is a development page, not part of the product. It exists so axe and Playwright have
 * every control on one route, in both themes. It is never deployed.
 */
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    emptyOutDir: true,
  },
  server: { port: 4321, strictPort: true },
  preview: { port: 4321, strictPort: true },
});
