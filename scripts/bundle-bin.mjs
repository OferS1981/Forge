import { chmodSync } from 'node:fs';
import { resolve } from 'node:path';
import { build } from 'vite';

/**
 * Bundles one of the two binaries.
 *
 * The workspace packages ship TypeScript source, so a bin entry has to be built before Node can
 * run it. One in-memory-free Vite build per binary, everything inlined, a shebang on the front and
 * the executable bit set.
 *
 *   node ../../scripts/bundle-bin.mjs src/main.ts dist
 */
const [, , entry, outDir] = process.argv;
if (entry === undefined || outDir === undefined) {
  console.error('usage: bundle-bin.mjs <entry> <outDir>');
  process.exit(1);
}

await build({
  configFile: false,
  logLevel: 'error',
  build: {
    outDir: resolve(process.cwd(), outDir),
    emptyOutDir: true,
    ssr: true,
    target: 'node22',
    lib: { entry: resolve(process.cwd(), entry), formats: ['es'], fileName: () => 'main.js' },
    rollupOptions: {
      output: { inlineDynamicImports: true, banner: '#!/usr/bin/env node' },
      // Node's own modules stay external. Nothing else is a dependency.
      external: (id) => id.startsWith('node:'),
    },
  },
});

const built = resolve(process.cwd(), outDir, 'main.js');
chmodSync(built, 0o755);
console.log(`built ${outDir}/main.js`);
