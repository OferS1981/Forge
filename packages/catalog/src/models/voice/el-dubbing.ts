import type { Model } from '../../types';
import { or, rows } from '../shared';

export const elDubbing: Model = {
  id: 'el-dubbing',
  name: 'ElevenLabs',
  sub: 'Dubbing',
  version: 'v2',
  maker: 'ElevenLabs',
  category: 'voice',
  blurb:
    'Ninety-plus languages, keeps the original voices and the background bed, handles overlapping speech.',
  tags: ['90+ languages', '32 speakers', 'Keeps background', 'BCP-47 dialects'],
  grammar: 'voicedesign',
  length: [0, 0],
  core: ['lang', 'voiceChar'],
  craft: ['vTone', 'avoid'],
  tech: [],
  negative: { mode: 'none', note: 'none' },
  best: 'Localising finished video without re-mixing, preserving emotional tone and the original performance.',
  worst:
    'Not a script tool. If you need to change what is said, dub from an edited transcript in Dubbing Studio instead.',
  notes: [
    'Use BCP-47 tags with the dialect, not just the language: en-AU, es-MX, pt-BR. The dialect is where the quality is.',
    'Speaker similarity runs 0 to 10 and defaults to 7. Raise it when the original performance is the point.',
  ],
  warnings: [
    'API limit is 3GB per file, 180 minutes in-app. Dubbing Studio (v1) is the editable-transcript path and caps much lower at 45 minutes.',
    'Concurrency is three jobs on self-serve. Plan batches around it.',
  ],
  settings: (b) =>
    rows([
      ['target_lang', or(b.lang, 'es-MX'), 'BCP-47 with the dialect'],
      ['Speaker similarity', '7', '0–10'],
      ['num_speakers', 'auto', 'Up to 32'],
      ['Keep background audio', 'on', ''],
      ['Watermark', 'per your delivery spec', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/capabilities/dubbing',
      title: 'Dubbing',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
