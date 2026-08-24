/**
 * The marathon's content pools: nine patch sets per category, so ten rounds of ten battles fight
 * one hundred distinct briefs per model instead of the same ten repeated. Round 0 is the original
 * battle bank untouched; rounds 1 to 9 swap the content fields below into every brief. Craft
 * fields are left alone: the point is new subject matter through the same grammar, which is what
 * exposes lexicon gaps that a fixed bank cannot.
 */

const IMAGE_VIDEO = [
  { subject: 'a lighthouse keeper climbing a spiral stair', setting: 'a storm-lashed headland' },
  { subject: 'a street vendor frying dumplings', setting: 'a narrow alley strung with lanterns' },
  { subject: 'a dragon coiled around a bell tower', setting: 'a medieval hill town at dusk' },
  { subject: 'a violin restorer at a cluttered bench', setting: 'a workshop above a bakery' },
  { subject: 'a freight train crossing a viaduct', setting: 'frost-covered moorland' },
  { subject: 'a beekeeper inspecting a hive frame', setting: 'an orchard in late summer' },
  { subject: 'a diver mapping a shipwreck', setting: 'green harbour water, low visibility' },
  {
    subject: 'a ceramicist pulling a pot off the wheel',
    setting: 'a studio with clay-dusted windows',
  },
  {
    subject: 'a football stadium filling before kickoff',
    setting: 'floodlights against a winter sky',
  },
];

const VOICE = [
  { script: 'The library closes in fifteen minutes. Please bring your books to the front desk.' },
  { script: 'Chapter one. The house at the end of the lane had been empty for years.' },
  { script: 'Welcome aboard. This train calls at all stations to the coast.' },
  { script: 'Three, two, one. And we are live.' },
  { script: 'Your order has shipped. Expect delivery within two working days.' },
  { script: 'It was never about the money. It was about the principle of the thing.' },
  { script: 'Take a deep breath in. Hold it. And slowly let it go.' },
  { script: 'Breaking news this hour: the harbour bridge has reopened to traffic.' },
  { script: 'Once upon a time, in a kingdom of salt and glass, there lived a mapmaker.' },
];

const SFX = [
  { sound: 'a heavy vault door swinging shut with a resonant clang' },
  { sound: 'rain intensifying on a canvas tent' },
  { sound: 'a swarm of bees passing close and fading' },
  { sound: 'ice cracking across a frozen lake' },
  { sound: 'an old lift arriving, gate concertinaing open' },
  { sound: 'a campfire settling, sparks popping' },
  { sound: 'a fencing match, blades and footwork on a piste' },
  { sound: 'a printing press running at full speed' },
  { sound: 'wind moaning through a ship’s rigging' },
];

const MUSIC = [
  { mGenre: ['garage rock'], mInst: ['fuzz guitar', 'live drums'] },
  { mGenre: ['ambient'], mInst: ['tape loops', 'felt piano'] },
  { mGenre: ['afrobeat'], mInst: ['horn section', 'talking drum'] },
  { mGenre: ['synthwave'], mInst: ['analog synth', 'gated drums'] },
  { mGenre: ['bluegrass'], mInst: ['banjo', 'upright bass'] },
  { mGenre: ['trip hop'], mInst: ['dusty breaks', 'baritone guitar'] },
  { mGenre: ['chamber pop'], mInst: ['string quartet', 'celesta'] },
  { mGenre: ['dub reggae'], mInst: ['deep bass', 'spring reverb skanks'] },
  { mGenre: ['flamenco'], mInst: ['nylon guitar', 'palmas'] },
];

const TEXT = [
  { goal: 'Write a welcome email for new allotment society members' },
  { goal: 'Explain container shipping to a curious twelve-year-old' },
  { goal: 'Draft a polite complaint about a delayed kitchen delivery' },
  { goal: 'Summarise the attached meeting notes into five decisions' },
  { goal: 'Write a product description for a hand-forged chef knife' },
  { goal: 'Turn these bullet points into a wedding speech for my sister' },
  { goal: 'Write a museum label for a recovered Roman coin hoard' },
  { goal: 'Draft a fair rota policy for a shared studio space' },
  { goal: 'Explain why the sky is dark at night, for a planetarium wall' },
];

const CODE = [
  { cTask: 'Add cursor-based pagination to the orders endpoint' },
  { cTask: 'Fix the timezone bug where daily reports run twice on DST changeover' },
  { cTask: 'Extract the retry logic into a shared helper with backoff and jitter' },
  { cTask: 'Add a health check endpoint that verifies the database and the queue' },
  { cTask: 'Migrate the sessions table to include a revoked_at column, zero downtime' },
  { cTask: 'Cache the exchange-rate lookup for five minutes with stale-while-revalidate' },
  { cTask: 'Write property tests for the invoice rounding rules' },
  { cTask: 'Instrument the checkout flow with timing spans' },
  { cTask: 'Upgrade the image pipeline to stream instead of buffering whole files' },
];

const APP = [
  { aApp: 'A queue app for a barbershop where walk-ins see their place update live' },
  { aApp: 'A plant-watering tracker for a shared office jungle' },
  { aApp: 'A lost-and-found board for a school, with photo uploads' },
  { aApp: 'A tiny CRM for a wedding photographer: enquiries, shoots, invoices' },
  { aApp: 'A chore wheel for a flat of five that rotates weekly' },
  { aApp: 'A reading-challenge tracker for a village library' },
  { aApp: 'A booking page for a kayak rental hut with tide-aware slots' },
  { aApp: 'An expenses splitter for a band on tour' },
  { aApp: 'A signup sheet for allotment open day volunteers' },
];

const RESEARCH = [
  { rQuestion: 'Which countries have banned disposable vapes, and what happened to sales?' },
  { rQuestion: 'What does the evidence say about four-day school weeks and attainment?' },
  { rQuestion: 'How have museum admission charges changed visitor numbers in Europe?' },
  {
    rQuestion: 'What is the current state of sodium-ion batteries versus lithium for grid storage?',
  },
  { rQuestion: 'Which cities have pedestrianised their centres since 2020, and what changed?' },
  { rQuestion: 'What are the documented effects of later school start times on teenagers?' },
  { rQuestion: 'How is reclaimed timber certified, and which schemes are trusted?' },
  { rQuestion: 'What happened to bike-share schemes that switched to e-bikes?' },
  { rQuestion: 'Which heritage crafts are on the endangered list in the UK, and why?' },
];

const POOLS = {
  image: IMAGE_VIDEO,
  video: IMAGE_VIDEO,
  voice: VOICE,
  sfx: SFX,
  music: MUSIC,
  text: TEXT,
  code: CODE,
  app: APP,
  research: RESEARCH,
};

/** The battle bank for a round: round 0 is the bank as written; later rounds swap the content. */
export function battlesForRound(battles, category, round) {
  if (round === 0) return battles;
  const patch = (POOLS[category] ?? [])[(round - 1) % 9];
  if (!patch) return battles;
  return battles.map((brief) => {
    const next = { ...brief };
    for (const [key, value] of Object.entries(patch)) {
      // Only fields the brief already speaks to are swapped; a minimal brief stays minimal
      // except for its primary field, which every brief has.
      if (key in next || key === Object.keys(patch)[0]) next[key] = value;
    }
    return next;
  });
}
