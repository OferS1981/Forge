/**
 * The performance budget, part C of the Good to Great plan, enforced in verify.
 *
 * Two numbers, both measured from the built output rather than asserted from hope:
 *
 * 1. First-paint JavaScript for every prerendered route: at most BUDGET_KB gzipped. This is what
 *    a mid-range phone on 4G actually downloads and parses before the page is interactive.
 * 2. The largest single route must stay under the same cap, so one route cannot quietly bloat
 *    while the average looks fine.
 *
 * The catalogue ships in the shared chunk on catalogue-bearing routes. That is a decision, not an
 * accident: the engine is synchronous by design (Build, Match, Compare and the glossary all need
 * the full registry at render), and the palette's copy of it is already lazy. If this budget ever
 * fails, the next lever is per-category model chunks, which means making the engine async first.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const BUDGET_KB = 320;
const OUT = fileURLToPath(new URL('../apps/web/out', import.meta.url));

function htmlFiles(dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) found.push(...htmlFiles(p));
    else if (entry.endsWith('.html')) found.push(p);
  }
  return found;
}

let worst = { route: '', kb: 0 };
const routes = htmlFiles(OUT);
if (routes.length === 0) {
  console.error('perf-budget: no built output at apps/web/out. Run the web build first.');
  process.exit(1);
}
for (const file of routes) {
  const html = readFileSync(file, 'utf8');
  const chunks = [...new Set(html.match(/\/_next\/static\/chunks\/[^"]+\.js/g) ?? [])];
  let bytes = 0;
  for (const chunk of chunks) {
    try {
      bytes += gzipSync(readFileSync(path.join(OUT, chunk))).length;
    } catch {
      // A chunk referenced but absent would fail the build itself; skip.
    }
  }
  const kb = Math.round(bytes / 1024);
  const route = file
    .slice(OUT.length)
    .replace(/index\.html$/, '')
    .replace(/\.html$/, '');
  if (kb > worst.kb) worst = { route: route === '' ? '/' : route, kb };
  if (kb > BUDGET_KB) {
    console.error(
      `perf-budget: ${route} ships ${String(kb)} KB gzipped, over the ${String(BUDGET_KB)} KB budget.`,
    );
    process.exit(1);
  }
}
console.log(
  `perf-budget: heaviest route is ${worst.route} at ${String(worst.kb)} KB gzipped, budget ${String(BUDGET_KB)} KB. Within budget.`,
);
