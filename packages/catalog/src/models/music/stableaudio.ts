import type { Model } from '../../types';
import { rows } from '../shared';

export const stableaudio: Model = {
  id: 'stableaudio',
  name: 'Stable Audio',
  version: '2.5',
  maker: 'Stability AI',
  category: 'music',
  blurb:
    'Built for brand and production sound. Audio inpainting lets you regenerate a specific span of an existing track.',
  tags: ['Inpainting', 'Tempo bands', 'Production vocabulary', 'Enterprise'],
  grammar: 'music',
  // Its own note, below: Stability's order is core style, key instruments, mood, specific
  // details, then additional instructions.
  musicOrder: ['genre', 'inst', 'mood', 'prod', 'bpm', 'key', 'vocal'],
  length: [0, 0],
  core: ['mGenre', 'mMood', 'mInst', 'mBpm'],
  craft: ['mKey', 'mProd', 'mVocal', 'mStruct', 'mExclude'],
  tech: [],
  negative: { mode: 'prose', label: 'Avoid', note: 'expressed in the prompt' },
  best: 'Brand sound, loops and beds, regenerating a bad span without redoing the track.',
  worst: 'Vocals and song structure are not its strength.',
  notes: [
    "Stability's own prompt order is core style, key instruments, mood, specific details, then additional instructions.",
    'They publish tempo bands: 60–80 ballads, 80–100 R&B and house, 100–120 pop-rock and jazz, 120–140 disco and techno, 140–160 dubstep and metal.',
    'Their guidance asks for sophisticated mood words: euphoric not happy, melancholic not sad, soaring not energetic.',
  ],
  warnings: ["Naming an era does real work here: '80s gated reverb', '90s grunge distortion'."],
  settings: () =>
    rows([
      ['Model', 'Stable Audio 2.5', ''],
      ['Duration', 'up to 3 min', ''],
      ['Steps', 'default', ''],
      ['Inpaint range', 'set start and end', 'How you fix one bad span'],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://platform.stability.ai/docs/api-reference#tag/Audio',
      title: 'Stable Audio API reference',
      publisher: 'Stability AI',
    },
    {
      url: 'https://stableaudio.com/user-guide/prompt-structure',
      title: 'Prompt structure',
      publisher: 'Stability AI',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
