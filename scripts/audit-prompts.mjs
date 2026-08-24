import { fileURLToPath } from 'node:url';
import { build } from 'vite';

/**
 * Forges one brief per category against every model in that category, so the output of all 57 can
 * be read side by side. A review aid, not part of the product.
 */
const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const result = await build({
  configFile: false,
  logLevel: 'error',
  build: {
    write: false,
    ssr: true,
    lib: { entry: here('./refresh/audit-entry.ts'), formats: ['es'], fileName: 'audit' },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const output = Array.isArray(result) ? result[0].output : result.output;
const code = output.find((c) => c.type === 'chunk').code;
const cat = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);

/* One creative intent per category, written the way a person would type it. */
const BRIEFS = {
  image: {
    subject: 'a retired boxer taping his hands',
    setting: 'a basement gym at 6am',
    medium: 'photograph',
    purpose: 'editorial',
  },
  video: {
    subject: 'a retired boxer taping his hands',
    setting: 'a basement gym at 6am',
    action: 'he wraps one hand, then looks up at the camera',
    purpose: 'social',
  },
  voice: {
    script: 'You have three minutes. Use them.',
    useCase: 'Corporate narration',
    voiceChar: 'a weathered man in his sixties, London',
    lang: 'en-GB',
  },
  sfx: { sound: 'a heavy steel door closing in a concrete stairwell', sfxKind: 'impact' },
  music: { mGenre: 'shoegaze', mMood: 'melancholic', mInst: 'analog poly synth', mBpm: '92' },
  text: {
    goal: 'Summarise a 40-page tenancy agreement for a first-time renter',
    context: 'The renter has no legal background and is deciding whether to sign this week',
    format: 'Markdown with headings',
  },
  code: {
    cTask: 'Add rate limiting to an existing Express API',
    cStack: 'Node, Express, Redis, deployed on Fly',
    cCheck: 'The existing integration tests pass and a new one covers the 429 path',
  },
  app: {
    aApp: 'a tool for tracking which visitor holds which physical door pass',
    aScreens: 'the desk view, and a list of passes not yet returned',
    aData: 'Visitor, Pass, CheckIn',
  },
  research: {
    rQuestion:
      'Which UK councils have adopted AI planning-permission triage, and with what results?',
    rScope: 'England and Wales, 2023 onwards, council publications and local press',
    rFormat: 'Cited brief, 1 page',
  },
};

const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const mode = process.argv.includes('--advanced') ? 'advanced' : 'simple';

for (const category of cat.CATEGORIES) {
  if (only.length > 0 && !only.includes(category.id)) continue;
  const models = cat.MODELS.filter((m) => m.category === category.id);
  const wanted = BRIEFS[category.id] ?? {};
  console.log(
    `\n${'='.repeat(90)}\n${category.name.toUpperCase()}  (brief: ${JSON.stringify(wanted)})\n${'='.repeat(90)}`,
  );
  for (const model of models) {
    const fields = new Set([...model.core, ...model.craft, ...model.tech]);
    const brief = Object.fromEntries(Object.entries(wanted).filter(([k]) => fields.has(k)));
    const missing = model.core.filter((f) => brief[f] === undefined);
    const out = cat.forge(brief, model, mode);
    console.log(
      `\n--- ${cat.modelLabel(model)} [${model.id}] grammar=${model.grammar} score=${out.score}`,
    );
    if (missing.length > 0)
      console.log(`    (core fields the brief did not cover: ${missing.join(', ')})`);
    console.log(out.flat);
    if (out.negative) console.log(`  NEGATIVE: ${out.negative}`);
  }
}
