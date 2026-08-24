import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';
import { build } from 'vite';

/**
 * The Doctor's judge: ten hostile prompts against all 57 models, 570 consultations a round.
 *
 * The Doctor's promise is threefold: it scores what you pasted, it names what is doing no work in
 * plain language, and the re-smithed prompt is genuinely better. Each consultation is judged on
 * those three promises plus the reviewer's bars:
 *
 *   1. Diagnosis catches the plants. Every hostile prompt carries known faults (dead weight,
 *      negation, tag soup, missing purpose); the findings must name at least the planted ones.
 *   2. The rebuild preserves the content. Real words the patient typed survive into the new
 *      prompt; the Doctor cuts filler, never meaning.
 *   3. The rebuild is better on the same scale. score(after) > score(before), and the flat
 *      output carries none of the dead-weight vocabulary that came in.
 *
 *   node scripts/judge-doctor.mjs             the round, per category and total
 *   node scripts/judge-doctor.mjs --losses    every lost consultation with its reasons
 */
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
const { MODELS, diagnose, rebuild, forge } = cat;

/**
 * Ten patients per category: the same ten failure archetypes a working reviewer sees daily,
 * instantiated with content that belongs to the category, so a music model is never judged on a
 * lighthouse. Voice patients carry their plants outside the script, because the script is
 * someone's words and the Doctor is not allowed to misquote them.
 */
const ARCHETYPES = (c) => [
  {
    name: 'tag soup',
    text: `${c.thing}, 8k, masterpiece, ultra detailed, trending on artstation, best quality`,
    keep: c.keep,
    deadIn: ['8k', 'masterpiece', 'trending on artstation'],
  },
  {
    name: 'vague and tiny',
    text: `a nice ${c.tiny}`,
    keep: [c.tiny],
    deadIn: ['nice'],
  },
  {
    name: 'negation heavy',
    text: `${c.thing} with no ${c.unwanted}, not crowded, without any clutter`,
    keep: c.keep,
    deadIn: [],
  },
  {
    name: 'emotive intensifiers',
    text: `an insanely breathtaking ${c.thing}, jaw-dropping, absolutely incredible`,
    keep: c.keep,
    deadIn: ['breathtaking', 'insanely', 'jaw-dropping'],
  },
  {
    name: 'keyword wall',
    text: `${c.wall}, hdr, sharp focus, high quality`,
    keep: c.wallKeep,
    deadIn: ['hdr', 'sharp focus', 'high quality'],
  },
  {
    name: 'rambling',
    text: `So basically what I want is ${c.thing}, you know, kind of ${c.mood} I guess, if possible`,
    keep: c.keep,
    deadIn: ['basically', 'kind of', 'if possible'],
  },
  {
    name: 'polite essay',
    text: `Hello! I would really appreciate it if you could please make ${c.thing}. Thank you so much in advance!`,
    keep: c.keep,
    deadIn: ['please', 'in advance'],
  },
  {
    name: 'contradiction',
    text: `minimalist maximalist ${c.thing}, ${c.clash}`,
    keep: c.keep,
    deadIn: [],
  },
  {
    name: 'the do-everything ask',
    text: c.everything,
    keep: c.everythingKeep,
    deadIn: [],
  },
  {
    name: 'no goal, only nouns',
    text: `${c.wall}`,
    keep: c.wallKeep,
    deadIn: [],
  },
];

const CONTENT = {
  image: {
    thing: 'a lighthouse on a cliff in a storm',
    keep: ['lighthouse', 'cliff'],
    tiny: 'dog',
    unwanted: 'people',
    mood: 'moody',
    clash: 'very dark bright lighting',
    wall: 'portrait, woman, red hair, freckles, 85mm, golden hour, film grain',
    wallKeep: ['freckles', 'red hair'],
    everything:
      'make me a logo and a banner and a poster for my bakery called Crumb, modern but vintage',
    everythingKeep: ['bakery', 'Crumb'],
  },
  video: {
    thing: 'a cyclist crossing a rain-slick junction at dusk',
    keep: ['cyclist', 'junction'],
    tiny: 'chase scene',
    unwanted: 'cars',
    mood: 'tense',
    clash: 'slow motion fast paced',
    wall: 'drone shot, city, rooftops, dawn, mist, slow push in, anamorphic',
    wallKeep: ['rooftops', 'mist'],
    everything:
      'I need a hero video and a teaser and vertical cuts for my kayak brand called Eddy, cinematic but fun',
    everythingKeep: ['kayak', 'Eddy'],
  },
  voice: {
    thing: 'a warm narrator reading: "Welcome back. Today we begin."',
    keep: ['Welcome back'],
    tiny: 'voiceover',
    unwanted: 'background noise',
    mood: 'calm',
    clash: 'whispered shouting delivery',
    wall: 'narrator, warm, slow, british, documentary, intimate',
    wallKeep: ['warm', 'documentary'],
    everything:
      'I want the same voice to do my podcast intro and my ads and my IVR menu, friendly but authoritative',
    everythingKeep: ['podcast'],
  },
  sfx: {
    thing: 'distant thunder rolling across a valley',
    keep: ['thunder', 'valley'],
    tiny: 'whoosh',
    unwanted: 'music',
    mood: 'ominous',
    clash: 'tiny huge sound',
    wall: 'rain, tin roof, close, loopable, ten seconds',
    wallKeep: ['tin roof', 'rain'],
    everything:
      'I need a click and a whoosh and an error sound and a fanfare for my app called Ping, subtle but noticeable',
    everythingKeep: ['whoosh'],
  },
  music: {
    thing: 'a slow soul ballad with warm horns',
    keep: ['soul', 'horns'],
    tiny: 'song',
    unwanted: 'vocals',
    mood: 'late-night',
    clash: 'acoustic heavy metal lullaby',
    wall: 'lo-fi, jazz, brushes, upright bass, rainy, 80 bpm',
    wallKeep: ['upright bass', 'lo-fi'],
    everything:
      'I need a theme song and a shorter sting and a hold-music version for my brand called Solder, catchy but classy',
    everythingKeep: ['Solder'],
  },
  text: {
    thing: 'an explainer of how tides work for curious ten-year-olds',
    keep: ['tides', 'ten-year-olds'],
    tiny: 'summary',
    unwanted: 'jargon',
    mood: 'friendly',
    clash: 'formal casual academic slang tone',
    wall: 'newsletter, product update, developers, changelog, concise, friendly',
    wallKeep: ['newsletter', 'developers'],
    everything:
      'write my landing page and my launch tweet and my investor update about our compost startup called Loam, bold but humble',
    everythingKeep: ['compost', 'Loam'],
  },
  code: {
    thing: 'a rate limiter for our public API in the gateway service',
    keep: ['rate limiter', 'gateway'],
    tiny: 'script',
    unwanted: 'dependencies',
    mood: 'robust',
    clash: 'quick and dirty production grade',
    wall: 'react, typescript, tailwind, dark mode, responsive, accessible',
    wallKeep: ['dark mode', 'responsive'],
    everything:
      'build the auth and the billing integration and the admin panel and migrate the database for my app called Ledger, fast',
    everythingKeep: ['auth', 'Ledger'],
  },
  app: {
    thing: 'a booking tool for a climbing gym with member check-in',
    keep: ['climbing gym', 'check-in'],
    tiny: 'dashboard',
    unwanted: 'clutter',
    mood: 'clean',
    clash: 'dense minimal information layout',
    wall: 'crm, pipeline, kanban, invoices, dark mode, mobile',
    wallKeep: ['kanban', 'invoices'],
    everything:
      'I need the landing page and the app and the admin and the email flows for my dog-walking service called Trot',
    everythingKeep: ['dog-walking', 'Trot'],
  },
  research: {
    thing: 'a comparison of heat pump incentives across the UK and Germany',
    keep: ['heat pump', 'Germany'],
    tiny: 'overview',
    unwanted: 'blogspam',
    mood: 'thorough',
    clash: 'exhaustive quick skim',
    wall: 'market size, competitors, pricing, regulation, sources, 2026',
    wallKeep: ['competitors', 'regulation'],
    everything:
      'research my competitors and the market and the regulations and possible names for my kelp farming startup, deep but fast',
    everythingKeep: ['kelp'],
  },
};

/**
 * The marathon's patients: nine replacement subjects per category, so ten rounds of ten fight a
 * hundred distinct consultations per model. The archetypes stay fixed, the ailment changes.
 */
const THINGS = {
  image: [
    ['a lighthouse keeper on a spiral stair', ['lighthouse', 'stair']],
    ['a street vendor frying dumplings', ['vendor', 'dumplings']],
    ['a dragon coiled around a bell tower', ['dragon', 'bell tower']],
    ['a violin restorer at a cluttered bench', ['violin', 'bench']],
    ['a freight train on a stone viaduct', ['train', 'viaduct']],
    ['a beekeeper lifting a hive frame', ['beekeeper', 'hive']],
    ['a diver over a shipwreck', ['diver', 'shipwreck']],
    ['a potter pulling a tall vase', ['potter', 'vase']],
    ['a stadium filling under floodlights', ['stadium', 'floodlights']],
  ],
  video: [
    ['a kayaker threading a rock garden', ['kayaker', 'rock']],
    ['a barista pouring latte art', ['barista', 'latte']],
    ['a hawk stooping on a field mouse', ['hawk', 'field']],
    ['a tram crossing a rainy junction', ['tram', 'junction']],
    ['a blacksmith drawing out a blade', ['blacksmith', 'blade']],
    ['a paper plane gliding through an office', ['paper plane', 'office']],
    ['a tide pool waking as the sea returns', ['tide pool', 'sea']],
    ['a drummer counting in a band', ['drummer', 'band']],
    ['a night market opening its shutters', ['market', 'shutters']],
  ],
  voice: [
    ['a stern librarian announcing: "The reading room closes in ten minutes."', ['reading room']],
    ['a gentle guide saying: "Mind the step as you board."', ['Mind the step']],
    ['an excited commentator: "And she takes the lead on the final bend."', ['final bend']],
    ['a tired detective: "Run it past me one more time."', ['one more time']],
    ['a kindly baker: "Fresh out of the oven, careful now."', ['out of the oven']],
    ['a ship captain: "All hands, prepare to make way."', ['make way']],
    ['a meditation coach: "Let your shoulders drop."', ['shoulders drop']],
    ['a quiz host: "For ten points, name the river."', ['ten points']],
    ['a storyteller: "The door had not been opened in a hundred years."', ['hundred years']],
  ],
  sfx: [
    ['a vault door sealing with a deep clang', ['vault', 'clang']],
    ['rain drumming on a canvas tent', ['rain', 'tent']],
    ['ice cracking across a lake', ['ice', 'lake']],
    ['an old lift gate concertinaing open', ['lift', 'gate']],
    ['a campfire settling and popping', ['campfire', 'popping']],
    ['a fencing bout on a metal piste', ['fencing', 'piste']],
    ['a printing press at full tilt', ['printing press']],
    ['wind in a ship rigging', ['wind', 'rigging']],
    ['a beaded curtain parting', ['beaded curtain']],
  ],
  music: [
    ['a garage rock stomper with fuzz guitar', ['garage rock', 'fuzz']],
    ['an ambient piece for tape loops and felt piano', ['ambient', 'felt piano']],
    ['an afrobeat groove with a horn section', ['afrobeat', 'horn']],
    ['a synthwave night-drive theme', ['synthwave', 'night-drive']],
    ['a bluegrass reel with banjo', ['bluegrass', 'banjo']],
    ['a trip hop track over dusty breaks', ['trip hop', 'dusty']],
    ['a chamber pop song with string quartet', ['chamber pop', 'quartet']],
    ['a dub reggae cut with deep bass', ['dub', 'bass']],
    ['a flamenco piece with palmas', ['flamenco', 'palmas']],
  ],
  text: [
    ['a welcome email for allotment members', ['allotment', 'welcome']],
    ['an explainer of container shipping for kids', ['container', 'shipping']],
    ['a complaint about a delayed kitchen', ['complaint', 'kitchen']],
    ['a museum label for a Roman coin hoard', ['museum', 'coin']],
    ['a product page for a chef knife', ['chef knife']],
    ['a wedding speech for my sister', ['wedding', 'sister']],
    ['a rota policy for a shared studio', ['rota', 'studio']],
    ['a planetarium wall text about the dark night sky', ['planetarium', 'night sky']],
    ['a newsletter about the harvest festival', ['newsletter', 'harvest']],
  ],
  code: [
    ['cursor pagination for the orders endpoint', ['pagination', 'orders']],
    ['the DST double-report bug', ['DST', 'report']],
    ['shared retry logic with backoff', ['retry', 'backoff']],
    ['a health check for database and queue', ['health check', 'queue']],
    ['a zero-downtime sessions migration', ['sessions', 'migration']],
    ['a five-minute exchange-rate cache', ['exchange-rate', 'cache']],
    ['property tests for invoice rounding', ['invoice', 'rounding']],
    ['timing spans on the checkout flow', ['checkout', 'spans']],
    ['streaming the image pipeline', ['image pipeline', 'streaming']],
  ],
  app: [
    ['a barbershop queue app', ['barbershop', 'queue']],
    ['a plant-watering tracker', ['plant', 'watering']],
    ['a school lost-and-found board', ['lost-and-found', 'school']],
    ['a wedding photographer CRM', ['photographer', 'CRM']],
    ['a rotating chore wheel', ['chore', 'wheel']],
    ['a library reading-challenge tracker', ['reading', 'library']],
    ['a tide-aware kayak booking page', ['kayak', 'tide']],
    ['a band tour expense splitter', ['band', 'expense']],
    ['an open-day volunteer signup sheet', ['volunteer', 'signup']],
  ],
  research: [
    ['disposable vape bans and sales', ['vape', 'sales']],
    ['four-day school weeks and attainment', ['school weeks', 'attainment']],
    ['museum admission charges and visitors', ['admission', 'visitors']],
    ['sodium-ion batteries for grid storage', ['sodium-ion', 'grid']],
    ['pedestrianised city centres since 2020', ['pedestrianised', 'centres']],
    ['later school start times for teenagers', ['start times', 'teenagers']],
    ['reclaimed timber certification schemes', ['timber', 'certification']],
    ['bike-share schemes that went electric', ['bike-share', 'electric']],
    ['endangered heritage crafts in the UK', ['heritage', 'crafts']],
  ],
};

function contentForRound(category, round) {
  const base = CONTENT[category] ?? CONTENT.image;
  if (round === 0) return base;
  const entry = (THINGS[category] ?? THINGS.image)[(round - 1) % 9];
  if (!entry) return base;
  const [thing, keep] = entry;
  return { ...base, thing, keep };
}

const PATIENTS_FOR = (category, round) => ARCHETYPES(contentForRound(category, round));

const wantLosses = process.argv.includes('--losses');
const roundArg = process.argv.find((a) => a.startsWith('--round='));
const ROUND = roundArg ? Number(roundArg.split('=')[1]) : 0;
const asJson = process.argv.includes('--json');
const byModel = {};
const losses = [];
let won = 0;
let fought = 0;
const perCategory = new Map();

for (const model of MODELS) {
  for (const patient of PATIENTS_FOR(model.category, ROUND)) {
    fought += 1;
    const reasons = [];
    let d;
    let after;
    try {
      d = diagnose(patient.text, model);
      const brief = rebuild(patient.text, model);
      after = forge(brief, model, 'advanced');
    } catch (error) {
      reasons.push(`threw: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (reasons.length === 0) {
      // Content may land in the flat, a block, or the negative: Suno's flat is the Style line
      // alone by design, and a voice-design scaffold carries its script as its own block.
      const flatLower = (
        after.flat +
        ' ' +
        after.blocks.map((bl) => bl.body).join(' ') +
        ' ' +
        after.negative
      ).toLowerCase();
      // 1. The rebuild preserves the content words.
      for (const word of patient.keep) {
        if (!flatLower.includes(word.toLowerCase())) reasons.push(`lost "${word}"`);
      }
      // 2. The rebuild is meaningfully better, not merely not-worse. A hostile prompt that only
      // breaks even means the Doctor treated the symptom it recognised and billed for the rest.
      const delta = after.score - d.score;
      if (after.score < d.score)
        reasons.push(`rebuild scored ${after.score}, below the patient's ${d.score}`);
      else if (delta < 10 && d.score < 75)
        reasons.push(
          `rebuild only moved ${String(delta)} points (${d.score} to ${after.score}) on a prompt with room`,
        );
      // 3. Dead weight that came in does not go out.
      for (const dead of patient.deadIn) {
        if (flatLower.includes(dead.toLowerCase()))
          reasons.push(`dead weight "${dead}" survived into the rebuild`);
      }
      // 4. The diagnosis says something: a hostile prompt with plants never gets a clean bill.
      if (patient.deadIn.length > 0 && d.findings.length === 0)
        reasons.push('no findings on a prompt with planted dead weight');
      // 5. The explanation is in sentences, not codes: every finding readable.
      for (const f of d.findings) {
        if (f.length < 15) reasons.push(`finding too thin to teach: "${f}"`);
      }
    }
    const catId = model.category;
    const bucket = perCategory.get(catId) ?? { won: 0, fought: 0 };
    bucket.fought += 1;
    byModel[model.id] ??= { won: 0, fought: 0 };
    byModel[model.id].fought += 1;
    if (reasons.length === 0) {
      won += 1;
      bucket.won += 1;
      byModel[model.id].won += 1;
    } else {
      losses.push({ model: model.id, patient: patient.name, reasons });
    }
    perCategory.set(catId, bucket);
  }
}

if (asJson) console.log(JSON.stringify({ round: ROUND, byModel }));
else
  for (const [catId, b] of perCategory) {
    console.log(`${catId.padEnd(10)} ${String(b.won).padStart(3)}/${String(b.fought)}`);
  }
if (!asJson)
  console.log(`TOTAL ${String(won)}/${String(fought)} (${((won / fought) * 100).toFixed(1)}%)`);
if (!asJson && (wantLosses || losses.length > 0)) {
  const lines = losses.map((l) => `${l.model} | ${l.patient} | ${l.reasons.join('; ')}`);
  writeFileSync(here('../doctor-losses.txt'), lines.join('\n') + '\n');
  console.log(`${String(losses.length)} losses written to doctor-losses.txt`);
}
