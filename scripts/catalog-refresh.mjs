import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

/**
 * The deterministic half of section 18.
 *
 * For one category, or all of them, it writes the list of claims in those model files that a vendor
 * page could prove wrong, each with the source that should settle it. No key, no network, no agent:
 * a manual run is useful on its own, which is what stops the workflow from being a no-op that hides
 * a missing secret.
 *
 *   node scripts/catalog-refresh.mjs                  every category, into catalog-refresh/
 *   node scripts/catalog-refresh.mjs image            one category
 *   node scripts/catalog-refresh.mjs image --stdout   one category, to stdout
 *
 * It goes through Vite because the workspace packages ship TypeScript source and Node cannot load
 * that. One in-memory bundle, no temporary files.
 */

const here = (p) => fileURLToPath(new URL(p, import.meta.url));

const result = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    ssr: true,
    lib: { entry: here('./refresh/entry.ts'), formats: ['es'], fileName: 'entry' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});

const output = Array.isArray(result) ? result[0].output : result.output;
const code = output.find((chunk) => chunk.type === 'chunk').code;
const catalog = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const args = process.argv.slice(2);
const toStdout = args.includes('--stdout');
const named = args.filter((a) => !a.startsWith('--'));
const known = catalog.CATEGORIES.map((c) => c.id);

for (const name of named) {
  if (!known.includes(name)) {
    console.error(`Unknown category: ${name}. One of: ${known.join(', ')}`);
    process.exit(1);
  }
}

// The date is passed in rather than read inside the report, so two runs on one day agree.
const today = new Date().toISOString().slice(0, 10);
const categories = named.length > 0 ? named : known;

if (!toStdout) mkdirSync(here('../catalog-refresh'), { recursive: true });

const reports = categories.map((category) => catalog.reportFor(category));

for (const report of reports) {
  const markdown = catalog.reportAsMarkdown(report, today);
  if (toStdout) {
    process.stdout.write(markdown);
  } else {
    writeFileSync(here(`../catalog-refresh/${report.category}.md`), `${markdown}\n`);
    console.log(`wrote catalog-refresh/${report.category}.md`);
  }
}

// The body the workflow opens the pull request with, written beside the reports it summarises.
if (!toStdout) {
  writeFileSync(here('../catalog-refresh/PR.md'), `${catalog.pullRequestBody(reports, today)}\n`);
  console.log('wrote catalog-refresh/PR.md');
}
