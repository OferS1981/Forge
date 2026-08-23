import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

/**
 * Writes dist/manifest.json from `manifest()` in @forge/extension, which builds it out of the
 * catalogue's host map so the two can never drift.
 *
 * It goes through Vite rather than importing directly because the workspace packages ship
 * TypeScript source and Node cannot load that. One in-memory bundle, no temporary files.
 */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const version = JSON.parse(readFileSync(here('../package.json'), 'utf8')).version;

const result = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    ssr: true,
    lib: { entry: here('../src/manifest-entry.ts'), formats: ['es'], fileName: 'manifest-entry' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});

const output = Array.isArray(result) ? result[0].output : result.output;
const code = output.find((chunk) => chunk.type === 'chunk').code;
const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

writeFileSync(
  here('../dist/manifest.json'),
  `${JSON.stringify(module.manifest(version), null, 2)}\n`,
);
