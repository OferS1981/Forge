import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { build } from 'vite';
import { BENCH } from './bench-briefs.mjs';

/** Forges every bench brief against every model in its category, into one review file. */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const r = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    ssr: true,
    lib: { entry: here('./refresh/audit-entry.ts'), formats: ['es'], fileName: 'a' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const out = Array.isArray(r) ? r[0].output : r.output;
const code = out.find((c) => c.type === 'chunk').code;
const cat = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

const lines = [];
let pairs = 0;
for (const bench of BENCH) {
  lines.push(
    `\n${'#'.repeat(100)}\n# ${bench.id}  brief=${JSON.stringify(bench.brief)}\n${'#'.repeat(100)}`,
  );
  for (const model of cat.MODELS.filter((m) => m.category === bench.category)) {
    const reads = new Set([...model.core, ...model.craft, ...model.tech]);
    const brief = Object.fromEntries(Object.entries(bench.brief).filter(([k]) => reads.has(k)));
    const res = cat.forge(brief, model, 'simple');
    pairs += 1;
    lines.push(`\n== ${bench.id} :: ${model.id} (score ${res.score})`);
    lines.push(res.flat);
    if (res.negative) lines.push(`NEGATIVE: ${res.negative}`);
    const dropped = Object.keys(bench.brief).filter((k) => !reads.has(k));
    if (dropped.length) lines.push(`(fields this model does not read: ${dropped.join(', ')})`);
  }
}
writeFileSync(here('../bench-out.txt'), lines.join('\n'));
console.log(`wrote bench-out.txt, ${pairs} pairs`);
