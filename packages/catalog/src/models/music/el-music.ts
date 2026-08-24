import type { ModelSpec } from '../../types';
import { rows } from '../shared';

export const elMusic: ModelSpec = {
  id: 'el-music',
  name: 'ElevenLabs',
  sub: 'Music',
  version: 'music_v2',
  maker: 'ElevenLabs',
  category: 'music',
  blurb:
    "Studio language moves real levers here. Sidechained, close-mic'd, bone-dry, tape saturation and plate reverb all produce audible change.",
  tags: ['Up to 5 minutes', 'Section editing', 'Composition plans', 'C2PA optional'],
  grammar: 'music',
  // Its own note, below: the five dimensions to decide up front are genre, mood,
  // instrumentation, tempo, and era.
  musicOrder: ['genre', 'mood', 'inst', 'bpm', 'key', 'prod', 'vocal'],
  length: [0, 0],
  core: ['mGenre', 'mMood', 'mInst', 'mBpm'],
  craft: ['mKey', 'mProd', 'mVocal', 'mStruct', 'mLyrics', 'mExclude'],
  tech: [],
  negative: {
    mode: 'prose',
    label: 'Avoid',
    note: 'negative global styles exist inside a composition plan',
  },
  best: 'Underscore and beds, full songs with structure, mid-track genre transitions, section-level inpainting.',
  worst: 'Prompt and composition_plan are mutually exclusive. You pick one path.',
  notes: [
    'The five dimensions to decide up front are genre, mood, instrumentation, tempo in BPM, and era.',
    "Narrate the arrangement sequentially. 'Start with… just… then… bring in…' are load-bearing words.",
    "Negative space is the prompt for loops: 'no melody, just drums'. Timing directives work too: 'lyrics begin at 15 seconds'.",
  ],
  warnings: [
    'music_length_ms only applies when you use prompt, not composition_plan.',
    'Prompt cap is 4100 characters.',
  ],
  settings: (b) =>
    rows([
      ['model_id', 'music_v2', ''],
      ['music_length_ms', 'e.g. 90000', '3000–600000'],
      ['force_instrumental', b.mVocal === 'Instrumental' ? 'true' : 'false', ''],
      ['seed', 'fix once you like one', ''],
      ['output_format', 'wav', 'MP3 44.1kHz otherwise'],
      ['sign_with_c2pa', 'true if provenance matters', ''],
    ]),
  pairsWith: [],
  betterFor: [],
  strengthTags: [],
  sources: [
    {
      url: 'https://elevenlabs.io/docs/capabilities/music',
      title: 'Music',
      publisher: 'ElevenLabs',
    },
  ],
  verifiedOn: '2026-08-23',
  unverified: true,
};
