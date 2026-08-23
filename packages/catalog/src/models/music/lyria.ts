import type { Model } from '../../types';
import { rows } from '../shared';

export const lyria: Model = {
  id: 'lyria',
  name: 'Google Lyria',
  version: '3 Pro',
  maker: 'Google DeepMind',
  category: 'music',
  blurb:
    'Three-minute full-structure songs with timestamp prompting, and SynthID plus C2PA on everything it makes.',
  tags: ['Timestamp prompts', '3 min', 'Image & PDF input', 'SynthID + C2PA'],
  grammar: 'music',
  length: [0, 0],
  core: ['mGenre', 'mMood', 'mInst', 'mBpm'],
  craft: ['mKey', 'mProd', 'mVocal', 'mStruct', 'mLyrics'],
  tech: [],
  negative: { mode: 'none', note: 'negative prompting is not documented for Lyria 3 Pro' },
  best: 'Scoring to picture, vocals with timed lyrics, provenance-clean delivery, music from a reference image or PDF.',
  worst: 'No documented negative prompting. Thirty seconds only on the non-Pro tiers.',
  notes: [
    "Google's formula is genre and style, mood, instrumentation, tempo and rhythm, vocal style and language, then lyrics.",
    'Timestamp prompting with [MM:SS] tags assigns actions to timed segments. That is how you score to a cut.',
  ],
  warnings: [
    'Every output carries SynthID watermarking and C2PA credentials. That is a feature for provenance and a constraint if you need a clean asset.',
  ],
  settings: (b) =>
    rows([
      ['model', 'lyria-3-pro', 'Lyria 3 for 30s, 3 Pro for full structure'],
      ['Duration', 'up to 3 min', ''],
      ['Vocals', b.mVocal === 'Vocals' ? 'on' : 'instrumental', '8 vocal languages'],
      ['Lyrics', "prefix with 'Lyrics:'", ''],
      ['Watermark', 'SynthID, always on', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [{ tag: 'commercial-safety', weight: 2 }],
  sources: [
    {
      url: 'https://ai.google.dev/gemini-api/docs/music-generation',
      title: 'Music generation',
      publisher: 'Google',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
