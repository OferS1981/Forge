import { has, stripBanned, wordCount } from '../compose/text';
import type { Axes, AxisId, Brief, ForgeResult, Model, Score } from '../types';

export interface Axis {
  id: AxisId;
  name: string;
  weight: number;
}

/** How much of the prompt is actually steering the model. Weights ported verbatim. */
export const AXES: readonly Axis[] = [
  { id: 'specificity', name: 'Specificity', weight: 18 },
  { id: 'technical', name: 'Craft layer', weight: 18 },
  { id: 'structure', name: 'Structure', weight: 14 },
  { id: 'constraints', name: 'Constraints', weight: 12 },
  { id: 'format', name: 'Output shape', weight: 12 },
  { id: 'context', name: 'Context', weight: 10 },
  { id: 'modelfit', name: 'Model fit', weight: 10 },
  { id: 'noise', name: 'Signal purity', weight: 6 },
];

export function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

export function weigh(axes: Axes): number {
  let total = 0;
  for (const a of AXES) total += (axes[a.id] || 0) * a.weight * 0.01;
  return Math.round(clamp(total));
}

const CONSTRAINT_FIELDS = ['avoid', 'mExclude', 'cScope', 'rules', 'rGaps', 'sfxLoop'] as const;

export function score(b: Brief, m: Model, res: Pick<ForgeResult, 'flat' | 'blocks'>): Score {
  // A motion-only prompt is short because the vendor says only the motion goes in the prompt;
  // its richness lives in the labelled blocks, so they count toward what was actually written.
  const words = m.motionOnly
    ? wordCount(res.flat + ' ' + res.blocks.map((bl) => bl.body).join(' '))
    : wordCount(res.flat);
  const entries = Object.entries(b) as [keyof Brief, Brief[keyof Brief]][];
  const filled = entries.filter(([k, v]) => has(v) && k !== 'aspect' && k !== 'duration').length;

  const hasSeed =
    has(b.subject) ||
    has(b.goal) ||
    has(b.cTask) ||
    has(b.aApp) ||
    has(b.rQuestion) ||
    has(b.script) ||
    has(b.sound) ||
    has(b.mGenre) ||
    // Dubbing's material arrives as audio: the language pair is its seed.
    has(b.lang);

  /*
   * Craft is measured against the craft that applies: an isometric diagram has no lens, no
   * aperture and no film stock, and leaving them empty is correctness, not neglect.
   */
  const modelFields = new Set<string>([...m.core, ...m.craft, ...m.tech]);
  const seedText = [b.subject, b.goal, b.cTask, b.aApp, b.rQuestion, b.script, b.sound]
    .filter((v): v is string => typeof v === 'string')
    .join(' ');
  const seedWords = wordCount(seedText);
  const medium = typeof b.medium === 'string' ? b.medium.toLowerCase() : '';
  const cameraless =
    medium.length > 0 && !/photo|cinematic|film|render/.test(medium)
      ? new Set(['lens', 'aperture', 'film'])
      : new Set<string>();
  // A diagram has no lighting model either: leaving light empty on an isometric plan is right.
  if (/diagram|vector|collage/.test(medium)) cameraless.add('light');
  // An instrumental has no lyrics by definition; the empty field is the correct answer.
  const instrumental = typeof b.mVocal === 'string' && /instrumental/i.test(b.mVocal);
  const inapplicable = new Set([...cameraless, ...(instrumental ? ['mLyrics'] : [])]);
  const applicable = m.craft.filter((f) => !inapplicable.has(f));
  const craft = applicable.filter((f) => has(b[f])).length;
  // The script and the lyrics are someone's words, carried verbatim; they are never fined for
  // vocabulary the descriptive fields would have stripped.
  const bannedWords = stripBanned(
    (Object.entries(b) as [string, unknown][])
      .filter(([k]) => k !== 'script' && k !== 'mLyrics')
      .map(([, v]) => v)
      .flat()
      .filter((v): v is string => typeof v === 'string')
      .join(' '),
  ).removed.length;

  /*
   * Phase 13 calibration, recorded in PORT-NOTES: the ported weights measured every category
   * with an image-shaped ruler. A Suno style line is short because short is correct there, and a
   * voice prompt's output shape lives in its settings, not its words. Each category is now scored
   * against its own ideal; the axes and weights are unchanged.
   */
  const wordsPerPoint =
    m.category === 'image' || m.category === 'video'
      ? 0.55
      : m.category === 'music' || m.category === 'sfx'
        ? 1.6
        : m.category === 'voice'
          ? 0.5
          : 0.28;
  const axes: Axes = {
    specificity: clamp((hasSeed ? 55 : 0) + Math.min(45, words * wordsPerPoint)),
    // A floor of 30 once a seed exists: thin craft by design (a product shot refusing a mood)
    // is not the same as no craft at all.
    technical: clamp((hasSeed ? 35 : 0) + (craft / Math.max(1, applicable.length)) * 65),
    // A composed grammar is structured by construction; blocks add on top of that floor. Audio
    // prompts also keep structure in their settings table, which prose block-counting cannot see.
    structure: clamp(
      45 +
        res.blocks.length * 12 +
        (m.category === 'music' ||
        m.category === 'sfx' ||
        m.category === 'voice' ||
        m.motionOnly === true
          ? 15
          : 0),
    ),
    constraints: clamp(
      has(b.avoid) ||
        has(b.cScope) ||
        has(b.mExclude) ||
        has(b.rules) ||
        has(b.rGaps) ||
        has(b.sfxLoop)
        ? 85
        : m.category === 'voice' && (has(b.vTone) || has(b.vArch))
          ? 70
          : CONSTRAINT_FIELDS.some((f) => modelFields.has(f))
            ? 20
            : // A model with no constraint field cannot be penalised for lacking one.
              60,
    ),
    format: clamp(
      has(b.format) ||
        has(b.rFormat) ||
        has(b.aspect) ||
        has(b.duration) ||
        has(b.sfxLen) ||
        has(b.mBpm) ||
        has(b.cCheck) ||
        has(b.aScreens) ||
        m.category === 'image'
        ? 80
        : m.category === 'music' ||
            m.category === 'voice' ||
            m.category === 'sfx' ||
            m.motionOnly === true
          ? 65
          : 35,
    ),
    context: clamp(
      has(b.purpose) ||
        has(b.context) ||
        has(b.cStack) ||
        has(b.rDecision) ||
        has(b.setting) ||
        has(b.useCase) ||
        has(b.mMood) ||
        has(b.room) ||
        has(b.voiceChar) ||
        has(b.aData) ||
        // The still image is the motion prompt's context: the subject describes that frame.
        (m.motionOnly === true && has(b.subject))
        ? 85
        : // A script is situational by nature: it carries its own where and who.
          m.category === 'voice' && has(b.script)
          ? 60
          : // A seed written as a sentence carries its own situation: "an isometric floor plan
            // of a tiny bakery" already says where we are.
            seedWords >= 6
            ? 55
            : 30,
    ),
    modelfit: clamp(50 + Math.min(50, craft * 12)),
    noise: clamp(100 - bannedWords * 25),
  };

  return { axes, total: weigh(axes), filled };
}
