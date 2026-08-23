import type { Model } from '../../types';
import { rows } from '../shared';

export const genericMusic: Model = {
  id: 'generic-music',
  name: 'Any other music model',
  version: 'category wildcard',
  category: 'music',
  wildcard: true,
  blurb:
    'A portable style line plus a structured arrangement narration, which is what every music model actually wants.',
  tags: ['Model-agnostic', 'Style line + structure'],
  grammar: 'music',
  length: [0, 0],
  core: ['mGenre', 'mMood', 'mInst', 'mBpm'],
  craft: ['mKey', 'mProd', 'mVocal', 'mStruct', 'mLyrics', 'mExclude'],
  tech: [],
  negative: {
    mode: 'field',
    label: 'Exclude',
    note: 'put it in an exclude field if your tool has one',
  },
  best: 'Any music model.',
  worst: 'Nothing model-specific.',
  notes: [
    "BPM and key both work on the major models. State them as numbers and letters, not as 'fast' and 'sad'.",
  ],
  warnings: [
    'Section metatags like [Chorus] are a Suno and ElevenLabs convention. Check your tool before pasting them.',
  ],
  settings: (b) =>
    rows([
      ['Duration', 'as needed', ''],
      ['Instrumental', b.mVocal === 'Instrumental' ? 'on' : 'off', ''],
      ['Style adherence', 'high', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    { url: 'https://help.suno.com/', title: 'Suno help centre', publisher: 'Suno' },
    {
      url: 'https://elevenlabs.io/docs/capabilities/music',
      title: 'Music',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
