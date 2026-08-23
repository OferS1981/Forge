import type { Brief, CategoryId } from '../../src/types';

/**
 * Two fixed briefs per category: one filled to the brim, one with only the first core field.
 * Every test that needs a brief uses these, so a change of behaviour shows up in one diff.
 */

export const FULL: Record<CategoryId, Brief> = {
  image: {
    subject: 'A retired boxer taping his hands in a basement gym',
    setting: 'Basement gym at 6am, condensation on the windows',
    purpose: 'Instagram carousel, first slide',
    medium: 'photograph',
    shot: ['medium close-up'],
    lens: '85mm portrait',
    aperture: 'f/2.8',
    light: ['softbox key camera-left'],
    film: 'Kodak Portra 400',
    grade: 'desaturated earth tones',
    comp: 'rule of thirds',
    mood: ['austere'],
    palette: '#0B3D2E deep green, warm brass, bone white',
    imgtext: 'NORTHBOUND SUPPLY CO.',
    ref: 'Roger Deakins night exteriors',
    avoid: 'logos, watermarks, other people',
    aspect: '4:5',
  },
  video: {
    subject: 'A retired boxer taping his hands in a basement gym',
    action: 'He finishes taping, flexes the fist, then looks up at the camera',
    setting: 'Basement gym at 6am, condensation on the windows',
    purpose: 'Pre-roll ad, sixty second cut',
    camMove: 'slow dolly in',
    shot: ['medium shot'],
    lens: '35mm',
    light: ['practical lamps only'],
    motion: ['steam rising'],
    pacing: 'deliberate',
    grade: 'crushed blacks, high contrast',
    mood: ['tense'],
    ref: 'Roger Deakins night exteriors',
    avoid: 'crowds, modern signage',
    aspect: '16:9',
    duration: '10s',
    shots: '3',
    vaudio: 'He says, "Last round." SFX: skipping rope on concrete. Ambient: distant traffic.',
  },
  voice: {
    script:
      'There is a moment, right before the bell, when the noise drops away. You can hear the ropes settle, and your own breathing, and nothing else at all. That is the moment the whole thing turns on.',
    useCase: 'Trailer / hype VO',
    voiceChar: 'British woman, late 30s, dry and unhurried',
    vTone: ['wry', 'authoritative'],
    vTexture: ['husky'],
    vArch: 'documentary narrator',
    lang: 'English, Received Pronunciation (not General American)',
    avoid: 'american vowels',
  },
  sfx: {
    sound: 'Heavy wooden door creaking open on rusted hinges',
    sfxKind: 'foley',
    room: 'stairwell',
    mic: 'shotgun mic',
    mood: ['menacing'],
    sfxLen: '3',
    sfxLoop: 'No',
  },
  music: {
    mGenre: ['noir jazz'],
    mMood: ['melancholic'],
    mInst: ['upright bass', 'muted trumpet', 'brush kit'],
    mProd: ['tape saturation'],
    mBpm: '92',
    mKey: 'A minor',
    mVocal: 'Instrumental',
    mStruct: 'Start with just brushed drums and upright bass, bring in the trumpet at 0:20',
    mLyrics: '',
    mExclude: 'electric guitar, heavy drums',
  },
  text: {
    goal: 'Review this pricing page copy and tell me which claims a sceptical CFO would not believe',
    role: 'sceptical reviewer',
    context: 'I will paste the current page copy below. Our buyer is a 20-person agency.',
    format: 'Markdown with headings',
    length: 'Under 400 words',
    rules: 'Never invent a statistic. Quote the source line before each claim',
    examples: 'Claim: "cuts admin by half". Not credible: no baseline, no sample, no source.',
    effort: 'High',
    avoid: 'marketing tone',
  },
  code: {
    cTask: 'Add rate limiting to the public API, 100 requests per minute per key',
    cStack: 'Node 22, Fastify, Postgres via Drizzle, tests in Vitest',
    cScope: 'Do not touch the auth middleware or any migration older than 0042',
    cCheck: 'npm test passes and curl -I returns 429 on the 101st call',
    cPattern: 'Mirror src/routes/webhooks.ts',
    rules: 'No new dependencies',
    examples: 'See the existing limiter in src/lib/throttle.ts',
    effort: 'High',
  },
  app: {
    aApp: 'A shared shopping list where two people tick items off in real time',
    aScreens: 'Just the list screen and the add-item sheet',
    aData: 'List has many Items. Item: name, quantity, done, addedBy',
    aStyle: 'Dense, 14px base, 8px radius, one accent colour, no gradients',
    cScope: 'The auth screens, which already work',
    rules: 'No new dependencies',
  },
  research: {
    rQuestion:
      'Which European cities have introduced a tourist cap since 2023, and what did it change?',
    rDecision: 'Where to run a pilot next spring',
    rScope: '2023 to today, EU only, primary sources and city government pages',
    rGaps: 'Say so in a Gaps section rather than estimating',
    rFormat: 'Comparison table',
    rules: 'Cite the city government page, not a news summary of it',
    effort: 'High',
  },
};

export const MINIMAL: Record<CategoryId, Brief> = {
  image: { subject: 'A brass key on a workbench' },
  video: { subject: 'A brass key on a workbench' },
  voice: { script: 'Doors close at eight.' },
  sfx: { sound: 'A single brass key dropped on a wooden bench' },
  music: { mGenre: ['ambient'] },
  text: { goal: 'Explain what a rate limit is' },
  code: { cTask: 'Fix the failing test in src/lib/throttle.test.ts' },
  app: { aApp: 'A timer that counts down to a date' },
  research: { rQuestion: 'What changed in EU short-let rules in 2025?' },
};

export const EMPTY: Brief = {};

export function briefsFor(category: CategoryId): { name: string; brief: Brief }[] {
  return [
    { name: 'full', brief: FULL[category] },
    { name: 'minimal', brief: MINIMAL[category] },
    { name: 'empty', brief: EMPTY },
  ];
}
