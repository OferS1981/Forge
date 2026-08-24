import type { ModelSpec } from '../../types';
import { or, rows } from '../shared';

export const suno: ModelSpec = {
  id: 'suno',
  name: 'Suno',
  version: 'v5.5',
  maker: 'Suno',
  category: 'music',
  blurb:
    'Style field, lyrics field, and a dedicated Exclude Styles box that is the only reliable way to say no.',
  tags: ['4–7 descriptors', 'Metatags in lyrics', 'Exclude Styles', 'Weirdness slider'],
  grammar: 'music',
  // Its own note, below: metatags go in the Lyrics field, [Intro] [Verse 1] [Chorus], and
  // parameterised sections work too, [Chorus: full band, soaring vocals].
  structureTags: true,
  length: [0, 0],
  core: ['mGenre', 'mMood', 'mInst', 'mBpm'],
  craft: ['mKey', 'mProd', 'mVocal', 'mStruct', 'mLyrics', 'mExclude'],
  tech: [],
  negative: {
    mode: 'field',
    label: 'Exclude Styles',
    note: 'a dedicated field. Negative language in the Style box does not work reliably',
  },
  best: 'Full songs with vocals, fast iteration, personas and custom models.',
  worst:
    'Artist names, exact mix parameters and hard BPM enforcement do not work in the Style field.',
  notes: [
    'The Style field wants four to seven descriptors, no more: genre, subgenre, tempo, key instruments, vocal style, production, mood.',
    'Metatags go in the Lyrics field: [Intro] [Verse 1] [Pre-Chorus] [Chorus] [Bridge] [Breakdown] [Outro]. Parameterised sections work too: [Chorus: full band, soaring vocals].',
    'Weirdness sits at 50% by default. Style Influence controls how strictly it obeys your descriptors.',
  ],
  warnings: [
    'Never put negatives in the Style box. They go in Exclude Styles or they are ignored.',
    'Download caps take effect from 3 September 2026: 20 a month on Pro, 60 on Premier. Check before you plan a release.',
  ],
  settings: (b) =>
    rows([
      ['Style field', 'the composed style line', 'Keep it to 4–7 descriptors'],
      ['Exclude Styles', or(b.mExclude, 'none'), 'The only working negative'],
      ['Weirdness', '50%', 'Right is experimental and less coherent'],
      ['Style Influence', '70%', 'Higher means stricter adherence'],
      ['Instrumental', b.mVocal === 'Instrumental' ? 'on' : 'off', ''],
    ]),
  flatStyleOnly: true,
  pairsWith: [
    {
      model: 'el-sfx',
      why: 'Transitions, risers and stingers between sections come from a sound-effects model, not the music model.',
    },
  ],
  betterFor: [],
  strengthTags: [],
  sources: [{ url: 'https://help.suno.com/', title: 'Suno help centre', publisher: 'Suno' }],
  verifiedOn: '2026-08-23',
  unverified: true,
};
