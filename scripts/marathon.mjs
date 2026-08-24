import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Ten rounds of ten, both arenas, aggregated per model. The marathon's scoreboard. */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const totals = new Map();
const add = (byModel, arena) => {
  for (const [id, s] of Object.entries(byModel)) {
    const t = totals.get(id) ?? { composer: { w: 0, f: 0 }, doctor: { w: 0, f: 0 } };
    t[arena].w += s.won;
    t[arena].f += s.fought;
    totals.set(id, t);
  }
};
for (let r = 0; r < 10; r += 1) {
  for (const [script, arena] of [
    ['judge.mjs', 'composer'],
    ['judge-doctor.mjs', 'doctor'],
  ]) {
    const out = execFileSync('node', [here(`./${script}`), `--round=${r}`, '--json'], {
      encoding: 'utf8',
    });
    const line = out.trim().split('\n').pop();
    add(JSON.parse(line).byModel, arena);
  }
  console.error(`round ${r} done`);
}
const rows = [...totals.entries()].map(([id, t]) => ({
  id,
  composer: `${t.composer.w}/${t.composer.f}`,
  doctor: `${t.doctor.w}/${t.doctor.f}`,
  rate: (((t.composer.w + t.doctor.w) / (t.composer.f + t.doctor.f)) * 100).toFixed(1),
}));
console.log(JSON.stringify(rows, null, 1));
